import { redirect } from 'next/navigation';
import Link from 'next/link';
import { currentInvitationAccount } from '@/lib/auth';
import { db } from '@/lib/db';
import DashboardShell from '@/app/components/dashboard-shell';
import { getDashboardLocale } from '@/lib/dashboard-locale';

export const dynamic = 'force-dynamic';

const translations = {
  az: {
    eyebrow: 'ŞƏXSİ KABİNET', welcome: 'Hekayəniz', welcome2: 'burada başlayır.',
    description: 'Toy gününüzə aid hər şey bir məkanda.',
    account: 'Hesab', active: 'Aktiv', access: 'Giriş müddəti', unlimited: 'Limitsiz',
    guests: 'Fərdi dəvətnamələr', manage: 'Qonaqlara bax', publication: 'Dərc statusu',
    published: 'Dərc edilib', draft: 'Qaralama', wedding: 'Sizin toyunuz',
    date: 'Tarix', time: 'Saat', venue: 'Məkan', design: 'Dizayn',
    unspecified: 'Göstərilməyib', noDate: 'Tarix təyin edilməyib',
    noVenue: 'Məkan əlavə edilməyib', open: 'Dəvətnaməni aç',
    studio: 'Studiyanı aç', create: 'Dəvətnamə yarat',
    empty: 'Hələ dəvətnaməniz yoxdur',
    emptyText: 'İlk dəvətnamənizi yaradın və özəl gününüzü qonaqlarınızla bölüşün.',
    quick: 'SÜRƏTLİ KEÇİDLƏR', edit: 'Dizaynı redaktə et',
    guestAction: 'Qonaqları idarə et', invitation: 'DƏVƏTNAMƏNİZ',
    status: 'Nəşr vəziyyəti', accessUntil: 'Giriş qüvvədədir',
  },
  ru: {
    eyebrow: 'ЛИЧНЫЙ КАБИНЕТ', welcome: 'Ваша история', welcome2: 'начинается здесь.',
    description: 'Всё, что связано с вашим свадебным днём, в одном месте.',
    account: 'Аккаунт', active: 'Активен', access: 'Доступ до', unlimited: 'Без ограничений',
    guests: 'Персональные приглашения', manage: 'Список гостей', publication: 'Публикация',
    published: 'Опубликовано', draft: 'Черновик', wedding: 'Ваша свадьба',
    date: 'Дата', time: 'Время', venue: 'Место проведения', design: 'Дизайн',
    unspecified: 'Не указано', noDate: 'Дата пока не указана',
    noVenue: 'Место не добавлено', open: 'Открыть приглашение',
    studio: 'Открыть студию', create: 'Создать приглашение',
    empty: 'У вас пока нет приглашения',
    emptyText: 'Создайте своё первое приглашение и поделитесь этим особенным днём с гостями.',
    quick: 'БЫСТРЫЕ ДЕЙСТВИЯ', edit: 'Редактировать дизайн',
    guestAction: 'Управление гостями', invitation: 'ВАШЕ ПРИГЛАШЕНИЕ',
    status: 'Статус публикации', accessUntil: 'Доступ активен',
  },
  en: {
    eyebrow: 'YOUR PRIVATE SPACE', welcome: 'Your story', welcome2: 'starts here.',
    description: 'Everything for your wedding day, thoughtfully brought together.',
    account: 'Account', active: 'Active', access: 'Access until', unlimited: 'Unlimited',
    guests: 'Personal invitations', manage: 'View guests', publication: 'Publication',
    published: 'Published', draft: 'Draft', wedding: 'Your wedding',
    date: 'Date', time: 'Time', venue: 'Venue', design: 'Design',
    unspecified: 'Not specified', noDate: 'Date not set',
    noVenue: 'Venue not added', open: 'Open invitation',
    studio: 'Open studio', create: 'Create invitation',
    empty: 'Your invitation is waiting',
    emptyText: 'Create your first invitation and share your special day with the people you love.',
    quick: 'QUICK ACTIONS', edit: 'Edit your design',
    guestAction: 'Manage your guests', invitation: 'YOUR INVITATION',
    status: 'Publication status', accessUntil: 'Access is active',
  },
};

export default async function DashboardPage() {
  const account = await currentInvitationAccount();
  if (!account) redirect('/login');

  const locale = await getDashboardLocale();
  const t = translations[locale];

  const wedding = await db.invitationWedding.findUnique({
    where: { accountId: account.id },
  });

  const guestCount = wedding
    ? await db.invitationGuest.count({ where: { weddingId: wedding.id } })
    : 0;

  const date = wedding?.eventDate
    ? new Intl.DateTimeFormat(locale === 'az' ? 'az-AZ' : locale === 'ru' ? 'ru-RU' : 'en-GB',
      { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Baku' }).format(wedding.eventDate)
    : t.noDate;

  const expiry = account.accessExpiresAt
    ? new Intl.DateTimeFormat(locale === 'az' ? 'az-AZ' : locale === 'ru' ? 'ru-RU' : 'en-GB',
      { day: 'numeric', month: 'long', year: 'numeric' }).format(account.accessExpiresAt)
    : t.unlimited;

  const published = Boolean(wedding?.isPublished);

  return (
    <DashboardShell active="overview" accountName={account.name} accountEmail={account.email} locale={locale}>
      <div className="overview-heading">
        <div>
          <span className="elario-eyebrow">{t.eyebrow}</span>
          <h1>{t.welcome}<br /><em>{t.welcome2}</em></h1>
          <p>{t.description}</p>
        </div>
        <div className="overview-date-mark">
          <span>EST.</span><strong>2026</strong><i>✳</i>
        </div>
      </div>

      <section className="overview-hero">
        <div className="overview-hero-copy">
          <span className="elario-eyebrow">{t.invitation}</span>
          {wedding ? (
            <>
              <h2>{wedding.partnerOne}<br /><i>&</i> {wedding.partnerTwo}</h2>
              <p>{date}{wedding.eventTime ? ` · ${wedding.eventTime}` : ''}</p>
              <div className="overview-hero-actions">
                <Link href="/dashboard/studio" className="elario-button-light">{t.edit} <span>↗</span></Link>
                {published && <a href={`/${wedding.slug}`} target="_blank" rel="noreferrer" className="elario-button-ghost">{t.open} ↗</a>}
              </div>
            </>
          ) : (
            <>
              <h2>{t.empty}</h2>
              <p>{t.emptyText}</p>
              <Link href="/dashboard/studio" className="elario-button-light">{t.create} <span>↗</span></Link>
            </>
          )}
        </div>
        <div className="overview-hero-art" aria-hidden="true">
          <div className="overview-art-ring ring-one" />
          <div className="overview-art-ring ring-two" />
          <div className="overview-art-flower">✳</div>
          <span>THE BEGINNING OF FOREVER</span>
        </div>
      </section>

      <section className="overview-stats">
        <article className="overview-stat">
          <span>{t.publication}</span>
          <strong className={published ? 'stat-green' : ''}>{published ? t.published : t.draft}</strong>
          <small>{t.status}</small>
        </article>
        <article className="overview-stat">
          <span>{t.guests}</span>
          <strong>{guestCount.toString().padStart(2, '0')}</strong>
          <Link href="/dashboard/guests">{t.manage} ↗</Link>
        </article>
        <article className="overview-stat">
          <span>{t.account}</span>
          <strong className="stat-green">{t.active}</strong>
          <small>{t.access}: {expiry}</small>
        </article>
      </section>

      <section className="overview-bottom">
        <div className="overview-wedding-card">
          <span className="elario-eyebrow">{t.wedding.toUpperCase()}</span>
          <h2>{wedding ? `${wedding.partnerOne} & ${wedding.partnerTwo}` : t.empty}</h2>
          <div className="overview-detail-grid">
            <div><span>{t.date}</span><strong>{date}</strong></div>
            <div><span>{t.time}</span><strong>{wedding?.eventTime || t.unspecified}</strong></div>
            <div><span>{t.venue}</span><strong>{wedding?.venueName || t.noVenue}</strong></div>
            <div><span>{t.design}</span><strong>{wedding?.template || t.unspecified}</strong></div>
          </div>
        </div>
        <div className="overview-quick-card">
          <span className="elario-eyebrow">{t.quick}</span>
          <Link href="/dashboard/studio"><span className="quick-icon">✳</span><span>{t.edit}</span><b>↗</b></Link>
          <Link href="/dashboard/guests"><span className="quick-icon">♧</span><span>{t.guestAction}</span><b>↗</b></Link>
        </div>
      </section>
    </DashboardShell>
  );
}
