import { redirect } from 'next/navigation';
import Link from 'next/link';
import { currentInvitationAccount } from '@/lib/auth';
import { db } from '@/lib/db';
import DashboardShell from '@/app/components/dashboard-shell';
import RecentGuests from '@/app/components/recent-guests';
import { getDashboardLocale } from '@/lib/dashboard-locale';
import { GuestsNavIcon } from '@/app/components/icons';
import { templateMeta } from '@/app/components/invitation/catalog';
import { eventInstant, formatDateParts } from '@/app/components/invitation/event-time';
import { normalizeSeatingPlan } from '@/lib/seating-types';
import { locateSeat } from '@/lib/seating-logic';

export const dynamic = 'force-dynamic';

const translations = {
  az: {
    kicker: 'Toyunuz', noWedding: 'Toyunuzu yaradın',
    countdown: 'Toya qalıb', days: 'gün', today: 'Bu gün toy günüdür!', past: 'Toy keçdi', noDate: 'Tarixi təyin edin',
    setDate: 'Studiyada tarixi əlavə edin →',
    guests: 'qonaq', guestsSub: 'adlı keçidlər', addGuests: 'Qonaq əlavə edin →',
    seated: 'yerləşdirilib', planCta: 'Oturacaq planı →',
    design: 'Dizayn', perGuest: 'Hər qonağa öz dizaynı', changeDesign: 'Studiyada dəyiş →',
    status: 'Status', published: 'Dərc edilib', draft: 'Qaralama', draftSub: 'Qonaqlar hələ görmür', publishedSub: 'Qonaqlar dəvətnaməni görür',
    publishCta: 'Studiyada dərc et', openCta: 'Dəvətnaməni aç',
    recent: 'Son qonaqlar', all: 'Hamısı →', noGuests: 'Hələ qonaq yoxdur.',
    create: 'Studiyanı aç', createSub: 'Adları, tarixi və məkanı daxil edin — qalan hər şey buradan idarə olunur.',
    send: 'Göndər', copy: 'Kopyala', copied: 'Kopyalandı', shareText: 'sizin şəxsi dəvətnaməniz:',
  },
  ru: {
    kicker: 'Ваша свадьба', noWedding: 'Создайте свою свадьбу',
    countdown: 'До свадьбы', days: 'дн.', today: 'Свадьба сегодня!', past: 'Свадьба прошла', noDate: 'Укажите дату',
    setDate: 'Добавьте дату в студии →',
    guests: 'гостей', guestsSub: 'личные ссылки', addGuests: 'Добавьте гостей →',
    seated: 'рассажено', planCta: 'План рассадки →',
    design: 'Дизайн', perGuest: 'Свой дизайн у каждого гостя', changeDesign: 'Изменить в студии →',
    status: 'Статус', published: 'Опубликовано', draft: 'Черновик', draftSub: 'Гости пока не видят', publishedSub: 'Гости видят приглашение',
    publishCta: 'Опубликовать в студии', openCta: 'Открыть приглашение',
    recent: 'Последние гости', all: 'Все →', noGuests: 'Гостей пока нет.',
    create: 'Открыть студию', createSub: 'Укажите имена, дату и место — всё остальное настраивается отсюда.',
    send: 'Отправить', copy: 'Копировать', copied: 'Скопировано', shareText: 'ваше персональное приглашение:',
  },
  en: {
    kicker: 'Your wedding', noWedding: 'Create your wedding',
    countdown: 'Until the wedding', days: 'days', today: 'The wedding is today!', past: 'The wedding has passed', noDate: 'Set the date',
    setDate: 'Add the date in the studio →',
    guests: 'guests', guestsSub: 'personal links', addGuests: 'Add guests →',
    seated: 'seated', planCta: 'Seating plan →',
    design: 'Design', perGuest: 'A design per guest', changeDesign: 'Change in the studio →',
    status: 'Status', published: 'Published', draft: 'Draft', draftSub: 'Guests cannot see it yet', publishedSub: 'Guests can see the invitation',
    publishCta: 'Publish in the studio', openCta: 'Open invitation',
    recent: 'Latest guests', all: 'All →', noGuests: 'No guests yet.',
    create: 'Open studio', createSub: 'Add the names, date and venue — everything else is managed from here.',
    send: 'Send', copy: 'Copy', copied: 'Copied', shareText: 'here is your personal invitation:',
  },
};

const DAY_MS = 24 * 60 * 60 * 1000;

export default async function DashboardPage() {
  const account = await currentInvitationAccount();
  if (!account) redirect('/login');

  const locale = await getDashboardLocale();
  const t = translations[locale];

  const wedding = await db.invitationWedding.findUnique({ where: { accountId: account.id } });
  const guests = wedding
    ? await db.invitationGuest.findMany({ where: { weddingId: wedding.id }, select: { id: true, name: true, slug: true, inviteName: true }, orderBy: { createdAt: 'desc' } })
    : [];

  const shell = (children: React.ReactNode) => (
    <DashboardShell active="overview" accountName={account.name} accountEmail={account.email} locale={locale}>
      {children}
    </DashboardShell>
  );

  if (!wedding) {
    return shell(
      <section className="bx-empty">
        <p className="bx-kicker">{t.kicker}</p>
        <h1 className="bx-title">{t.noWedding}</h1>
        <p className="bx-muted">{t.createSub}</p>
        <Link href="/dashboard/studio" className="bx-button bx-button--dark">{t.create}</Link>
      </section>,
    );
  }

  // Countdown in the wedding's own time zone.
  const day = wedding.eventDate ? wedding.eventDate.toISOString().slice(0, 10) : null;
  const dateParts = day ? formatDateParts(day, locale) : null;
  let countdown: { kind: 'days'; days: number } | { kind: 'today' | 'past' | 'none' } = { kind: 'none' };
  if (day) {
    const start = eventInstant(day, wedding.eventTime, wedding.timezone || 'Asia/Baku').getTime();
    const diff = start - Date.now();
    countdown = diff > 0 ? { kind: 'days', days: Math.ceil(diff / DAY_MS) } : diff > -DAY_MS ? { kind: 'today' } : { kind: 'past' };
  }

  // Seated guests from the saved plan (only seats that still exist, guests that still exist).
  const theme = wedding.theme && typeof wedding.theme === 'object' && !Array.isArray(wedding.theme)
    ? wedding.theme as Record<string, unknown> : {};
  const plan = normalizeSeatingPlan(theme.seatingPlan);
  const guestIds = new Set(guests.map(guest => guest.id));
  const seated = new Set(plan.assignments
    .filter(item => guestIds.has(item.guestId) && locateSeat(plan, item.seatId))
    .map(item => item.guestId)).size;
  const seatedShare = guests.length ? seated / guests.length : 0;
  const ring = 2 * Math.PI * 18;

  const meta = templateMeta(wedding.template);
  const individual = wedding.designMode === 'individual';
  const published = wedding.isPublished;

  return shell(
    <div className="bx-overview">
      <header className="bx-page-head">
        <div>
          <p className="bx-kicker">{t.kicker}</p>
          <h1 className="bx-title">{wedding.partnerOne || '—'} &amp; {wedding.partnerTwo || '—'}</h1>
        </div>
        {published
          ? <a href={`/${wedding.slug}`} target="_blank" rel="noreferrer" className="bx-button bx-button--dark bx-head-cta">{t.openCta}</a>
          : <Link href="/dashboard/studio" className="bx-button bx-button--dark bx-head-cta">{t.publishCta}</Link>}
      </header>

      <div className="bx-grid">
        <section className="bx-tile bx-tile--hero bx-span-2">
          <p className="bx-tile-label">{t.countdown}</p>
          {countdown.kind === 'days' && (
            <p className="bx-countdown">{countdown.days}<span> {t.days}</span></p>
          )}
          {countdown.kind === 'today' && <p className="bx-countdown bx-countdown--text">{t.today}</p>}
          {countdown.kind === 'past' && <p className="bx-countdown bx-countdown--text">{t.past}</p>}
          {countdown.kind === 'none' && (
            <>
              <p className="bx-countdown bx-countdown--text">{t.noDate}</p>
              <Link href="/dashboard/studio" className="bx-tile-link bx-tile-link--light">{t.setDate}</Link>
            </>
          )}
          {dateParts && (
            <p className="bx-tile-foot">
              {dateParts.weekday}, {dateParts.full}{wedding.eventTime ? ` · ${wedding.eventTime}` : ''}{wedding.venueName ? ` · ${wedding.venueName}` : ''}
            </p>
          )}
        </section>

        <Link href="/dashboard/guests" className="bx-tile bx-tile--accent bx-tile--link">
          <GuestsNavIcon className="w-7 h-7" aria-hidden="true" />
          <span>
            <span className="bx-stat">{guests.length}</span>
            <span className="bx-stat-label">{t.guests} · {guests.length ? t.guestsSub : t.addGuests}</span>
          </span>
        </Link>

        <Link href="/dashboard/seating" className="bx-tile bx-tile--link">
          <svg className="bx-ring" viewBox="0 0 44 44" role="img" aria-label={`${Math.round(seatedShare * 100)}%`}>
            <circle cx="22" cy="22" r="18" />
            <circle cx="22" cy="22" r="18" className="bx-ring-value"
              strokeDasharray={`${Math.max(seatedShare * ring, seatedShare > 0 ? 2 : 0.01)} ${ring}`} transform="rotate(-90 22 22)" />
          </svg>
          <span>
            <span className="bx-stat">{seated} / {guests.length}</span>
            <span className="bx-stat-label">{t.seated} · {t.planCta}</span>
          </span>
        </Link>

        <section className="bx-tile bx-span-2 bx-recent">
          <div className="bx-tile-head">
            <h2>{t.recent}</h2>
            <Link href="/dashboard/guests" className="bx-tile-link">{t.all}</Link>
          </div>
          {guests.length === 0
            ? <p className="bx-muted">{t.noGuests}</p>
            : <RecentGuests guests={guests.slice(0, 4).map(g => ({ id: g.id, name: g.name, slug: g.slug, shareName: g.inviteName?.trim() || g.name }))} labels={{ send: t.send, copy: t.copy, copied: t.copied, shareText: t.shareText }} />}
        </section>

        <section className="bx-tile">
          <p className="bx-tile-label">{t.design}</p>
          <p className="bx-tile-value">{individual ? t.perGuest : meta.name[locale]}</p>
          {!individual && (
            <div className="bx-swatches" aria-hidden="true">
              {meta.swatches.map(color => <i key={color} style={{ background: color }} />)}
            </div>
          )}
          <Link href="/dashboard/studio" className="bx-tile-link">{t.changeDesign}</Link>
        </section>

        <section className="bx-tile">
          <p className="bx-tile-label">{t.status}</p>
          <p className="bx-tile-value">
            <span className={`bx-dot ${published ? 'is-live' : ''}`} aria-hidden="true" />{published ? t.published : t.draft}
          </p>
          <p className="bx-muted">{published ? t.publishedSub : t.draftSub}</p>
          {published
            ? <a href={`/${wedding.slug}`} target="_blank" rel="noreferrer" className="bx-button bx-button--dark">{t.openCta}</a>
            : <Link href="/dashboard/studio" className="bx-button bx-button--dark">{t.publishCta}</Link>}
        </section>
      </div>
    </div>,
  );
}
