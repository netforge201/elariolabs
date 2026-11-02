import { redirect } from 'next/navigation';
import Link from 'next/link';
import { currentInvitationAccount } from '@/lib/auth';
import { db } from '@/lib/db';
import DashboardShell from '@/app/components/dashboard-shell';
import { getDashboardLocale } from '@/lib/dashboard-locale';

export const dynamic = 'force-dynamic';

const translations = {
  az: {
    eyebrow: 'ŞƏXSİ DƏVƏTNAMƏLƏR', title: 'Qonaqlarınız',
    description: 'Hər qonaq üçün ayrıca dəvətnamə keçidlərini idarə edin.',
    count: 'ÜMUMİ QONAQ', manage: 'Studiyanı aç', first: 'Toy məlumatlarını yaradın',
    firstText: 'Toy məlumatlarını saxladıqdan sonra qonaqlar üçün fərdi keçidlər yarada bilərsiniz.',
    goStudio: 'Studiyaya keç', empty: 'İlk qonağınızı dəvət edin',
    emptyText: 'Studiyada ilk fərdi dəvətnamə keçidini yaradın.',
    create: 'Dəvətnamə yarat', open: 'Aç', invitation: 'dəvətnamə',
    invitations: 'dəvətnamə', couple: 'CÜTLÜK', link: 'ŞƏXSİ KEÇİD',
  },
  ru: {
    eyebrow: 'ПЕРСОНАЛЬНЫЕ ПРИГЛАШЕНИЯ', title: 'Ваши гости',
    description: 'Управляйте персональными ссылками-приглашениями для каждого гостя.',
    count: 'ВСЕГО ГОСТЕЙ', manage: 'Открыть студию', first: 'Сначала создайте свадьбу',
    firstText: 'После сохранения информации о свадьбе вы сможете создавать персональные ссылки для гостей.',
    goStudio: 'Перейти в студию', empty: 'Пригласите первого гостя',
    emptyText: 'Создайте первую персональную ссылку в студии.',
    create: 'Создать приглашение', open: 'Открыть', invitation: 'приглашение',
    invitations: 'приглашений', couple: 'МОЛОДОЖЁНЫ', link: 'ПЕРСОНАЛЬНАЯ ССЫЛКА',
  },
  en: {
    eyebrow: 'PERSONAL INVITATIONS', title: 'Your guests',
    description: 'Manage individual invitation links for everyone on your guest list.',
    count: 'TOTAL GUESTS', manage: 'Open studio', first: 'Create your wedding first',
    firstText: 'Once your wedding details are saved, you can create personal links for your guests.',
    goStudio: 'Go to studio', empty: 'Invite your first guest',
    emptyText: 'Create your first personal invitation link in the studio.',
    create: 'Create invitation', open: 'Open', invitation: 'invitation',
    invitations: 'invitations', couple: 'THE COUPLE', link: 'PERSONAL LINK',
  },
};

export default async function GuestsPage() {
  const account = await currentInvitationAccount();
  if (!account) redirect('/login');

  const locale = await getDashboardLocale();
  const t = translations[locale];

  const wedding = await db.invitationWedding.findUnique({
    where: { accountId: account.id },
    select: { id: true, partnerOne: true, partnerTwo: true },
  });

  const guests = wedding
    ? await db.invitationGuest.findMany({
        where: { weddingId: wedding.id },
        orderBy: { createdAt: 'desc' },
      })
    : [];

  const countLabel = guests.length === 1 ? t.invitation : t.invitations;

  return (
    <DashboardShell active="guests" accountName={account.name} accountEmail={account.email} locale={locale}>
      <div className="guests-page-heading">
        <div>
          <span className="elario-eyebrow">{t.eyebrow}</span>
          <h1>{t.title}</h1>
          <p>{t.description}</p>
        </div>
        <Link href="/dashboard/studio" className="elario-button-dark">{t.manage} <span>↗</span></Link>
      </div>

      <section className="guests-summary">
        <div><span>{t.count}</span><strong>{guests.length.toString().padStart(2, '0')}</strong></div>
        <div className="guests-summary-note"><i />{guests.length} {countLabel}</div>
      </section>

      {!wedding ? (
        <div className="guests-empty">
          <span className="guests-empty-symbol">✳</span>
          <h2>{t.first}</h2>
          <p>{t.firstText}</p>
          <Link href="/dashboard/studio" className="elario-button-dark">{t.goStudio} ↗</Link>
        </div>
      ) : guests.length === 0 ? (
        <div className="guests-empty">
          <span className="guests-empty-symbol">♧</span>
          <h2>{t.empty}</h2>
          <p>{t.emptyText}</p>
          <Link href="/dashboard/studio" className="elario-button-dark">{t.create} ↗</Link>
        </div>
      ) : (
        <section className="guests-table-card">
          <div className="guests-table-heading">
            <div><span className="elario-eyebrow">{t.couple}</span><h2>{wedding.partnerOne} & {wedding.partnerTwo}</h2></div>
            <span>{guests.length.toString().padStart(2, '0')}</span>
          </div>
          <div className="guests-table-labels"><span>GUEST</span><span>{t.link}</span><span /></div>
          {guests.map((guest, index) => (
            <div key={guest.id} className="guests-table-row">
              <div className="guest-identity">
                <span className="guest-number">{String(index + 1).padStart(2, '0')}</span>
                <strong>{guest.name}</strong>
              </div>
              <span className="guest-link-text">/guest/{guest.slug}</span>
              <a href={`/guest/${guest.slug}`} target="_blank" rel="noreferrer" className="guest-open-link">{t.open} ↗</a>
            </div>
          ))}
        </section>
      )}
    </DashboardShell>
  );
}
