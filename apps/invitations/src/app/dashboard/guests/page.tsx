import { redirect } from 'next/navigation';
import Link from 'next/link';
import { currentInvitationAccount } from '@/lib/auth';
import { db } from '@/lib/db';
import DashboardShell from '@/app/components/dashboard-shell';
import GuestDirectory from '@/app/components/guest-directory';
import { resolveLocale } from '@/app/components/invitation/catalog';
import { getDashboardLocale } from '@/lib/dashboard-locale';
import { ArrowUpRightIcon, CrestStarIcon, GuestsNavIcon } from '@/app/components/icons';

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
    invitations: 'dəvətnamə', couple: 'CÜTLÜK', link: 'ŞƏXSİ KEÇİD', guest: 'QONAQ',
    copy: 'Kopyala', copied: 'Kopyalandı', share: 'Göndər', search: 'Qonaq axtar…', noMatch: 'Heç kim tapılmadı.',
    shareText: 'sizin şəxsi dəvətnaməniz:',
    rsvp: { label: 'RSVP', on: 'Açıq', off: 'Bağlı', yes: 'Gələcək', no: 'Gəlməyəcək', pending: 'Cavab gözlənilir', people: 'nəfər',
      title: 'İştirak təsdiqi (RSVP)', hint: 'RSVP yalnız adlı dəvətnamələrdə görünür. Hər qonaq üçün ayrıca açın və ya bağlayın.',
      coming: 'Gələcək', declined: 'Gəlməyəcək', waiting: 'Gözlənilir', enabled: 'RSVP açıq', allOn: 'Hamısına aç', allOff: 'Hamısında bağla', error: 'Yadda saxlamaq alınmadı' },
    profile: { edit: 'Düzəliş et', close: 'Bağla', nick: 'Ləqəb (yalnız siz görürsünüz)', inviteName: 'Dəvətnamədə ad',
      inviteNameHint: 'Boş qalsa, ləqəb yazılacaq', gender: 'Müraciət', male: 'Kişi · bəy', female: 'Qadın · xanım', none: 'Göstərilməyib',
      family: 'Ailəsi ilə birlikdə', preview: 'Qonaq belə görəcək', save: 'Yadda saxla', saving: 'Saxlanılır…', saved: 'Saxlanıldı',
      error: 'Yadda saxlamaq alınmadı', familyBadge: 'Ailə ilə', inviteAs: 'Dəvətnamədə' },
  },
  ru: {
    eyebrow: 'ПЕРСОНАЛЬНЫЕ ПРИГЛАШЕНИЯ', title: 'Ваши гости',
    description: 'Управляйте персональными ссылками-приглашениями для каждого гостя.',
    count: 'ВСЕГО ГОСТЕЙ', manage: 'Открыть студию', first: 'Сначала создайте свадьбу',
    firstText: 'После сохранения информации о свадьбе вы сможете создавать персональные ссылки для гостей.',
    goStudio: 'Перейти в студию', empty: 'Пригласите первого гостя',
    emptyText: 'Создайте первую персональную ссылку в студии.',
    create: 'Создать приглашение', open: 'Открыть', invitation: 'приглашение',
    invitations: 'приглашений', couple: 'МОЛОДОЖЁНЫ', link: 'ПЕРСОНАЛЬНАЯ ССЫЛКА', guest: 'ГОСТЬ',
    copy: 'Копировать', copied: 'Скопировано', share: 'Отправить', search: 'Поиск гостя…', noMatch: 'Никого не найдено.',
    shareText: 'ваше персональное приглашение:',
    rsvp: { label: 'RSVP', on: 'Вкл', off: 'Выкл', yes: 'Придёт', no: 'Не придёт', pending: 'Ждём ответа', people: 'чел.',
      title: 'Подтверждение участия (RSVP)', hint: 'RSVP показывается только в именных приглашениях. Включайте и выключайте для каждого гостя отдельно.',
      coming: 'Придут', declined: 'Не придут', waiting: 'Ждём ответа', enabled: 'RSVP включён', allOn: 'Включить всем', allOff: 'Выключить всем', error: 'Не удалось сохранить' },
    profile: { edit: 'Изменить', close: 'Закрыть', nick: 'Ник (видите только вы)', inviteName: 'Имя в приглашении',
      inviteNameHint: 'Если пусто — будет ник', gender: 'Обращение', male: 'Мужчина · bəy', female: 'Женщина · xanım', none: 'Не указано',
      family: 'Вместе с семьёй', preview: 'Гость увидит', save: 'Сохранить', saving: 'Сохраняем…', saved: 'Сохранено',
      error: 'Не удалось сохранить', familyBadge: 'С семьёй', inviteAs: 'В приглашении' },
  },
  en: {
    eyebrow: 'PERSONAL INVITATIONS', title: 'Your guests',
    description: 'Manage individual invitation links for everyone on your guest list.',
    count: 'TOTAL GUESTS', manage: 'Open studio', first: 'Create your wedding first',
    firstText: 'Once your wedding details are saved, you can create personal links for your guests.',
    goStudio: 'Go to studio', empty: 'Invite your first guest',
    emptyText: 'Create your first personal invitation link in the studio.',
    create: 'Create invitation', open: 'Open', invitation: 'invitation',
    invitations: 'invitations', couple: 'THE COUPLE', link: 'PERSONAL LINK', guest: 'GUEST',
    copy: 'Copy', copied: 'Copied', share: 'Send', search: 'Search guests…', noMatch: 'No guests match your search.',
    shareText: 'here is your personal invitation:',
    rsvp: { label: 'RSVP', on: 'On', off: 'Off', yes: 'Coming', no: 'Not coming', pending: 'Awaiting reply', people: 'people',
      title: 'RSVP', hint: 'RSVP appears only on personal invitations. Switch it on or off for each guest.',
      coming: 'Coming', declined: 'Not coming', waiting: 'Awaiting', enabled: 'RSVP on', allOn: 'Turn on for all', allOff: 'Turn off for all', error: 'Could not save' },
    profile: { edit: 'Edit', close: 'Close', nick: 'Nickname (only you see it)', inviteName: 'Name on the invitation',
      inviteNameHint: 'Empty → the nickname is used', gender: 'Address as', male: 'Man · bəy', female: 'Woman · xanım', none: 'Not set',
      family: 'Together with family', preview: 'The guest will see', save: 'Save', saving: 'Saving…', saved: 'Saved',
      error: 'Could not save', familyBadge: 'With family', inviteAs: 'On the invitation' },
  },
};

export default async function GuestsPage() {
  const account = await currentInvitationAccount();
  if (!account) redirect('/login');

  const locale = await getDashboardLocale();
  const t = translations[locale];

  const wedding = await db.invitationWedding.findUnique({
    where: { accountId: account.id },
    select: { id: true, partnerOne: true, partnerTwo: true, locale: true },
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
        <Link href="/dashboard/studio" className="elario-button-dark">{t.manage} <ArrowUpRightIcon className="w-3.5 h-3.5 inline-block" /></Link>
      </div>

      <section className="guests-summary">
        <div><span>{t.count}</span><strong>{guests.length.toString().padStart(2, '0')}</strong></div>
        <div className="guests-summary-note"><i />{guests.length} {countLabel}</div>
      </section>

      {!wedding ? (
        <div className="guests-empty">
          <span className="guests-empty-symbol"><CrestStarIcon className="w-8 h-8 text-amber-500/60 inline-block" /></span>
          <h2>{t.first}</h2>
          <p>{t.firstText}</p>
          <Link href="/dashboard/studio" className="elario-button-dark">{t.goStudio} <ArrowUpRightIcon className="w-3.5 h-3.5 inline-block" /></Link>
        </div>
      ) : guests.length === 0 ? (
        <div className="guests-empty">
          <span className="guests-empty-symbol"><GuestsNavIcon className="w-8 h-8 text-amber-500/60 inline-block" /></span>
          <h2>{t.empty}</h2>
          <p>{t.emptyText}</p>
          <Link href="/dashboard/studio" className="elario-button-dark">{t.create} <ArrowUpRightIcon className="w-3.5 h-3.5 inline-block" /></Link>
        </div>
      ) : (
        <section className="guests-table-card">
          <div className="guests-table-heading">
            <div><span className="elario-eyebrow">{t.couple}</span><h2>{wedding.partnerOne} & {wedding.partnerTwo}</h2></div>
            <span>{guests.length.toString().padStart(2, '0')}</span>
          </div>
          <GuestDirectory
            guests={guests.map(guest => ({
              id: guest.id, name: guest.name, slug: guest.slug,
              rsvpEnabled: guest.rsvpEnabled,
              rsvpStatus: guest.rsvpStatus === 'yes' || guest.rsvpStatus === 'no' ? guest.rsvpStatus : null,
              rsvpGuests: guest.rsvpGuests, rsvpNote: guest.rsvpNote,
              inviteName: guest.inviteName,
              gender: guest.gender === 'male' || guest.gender === 'female' ? guest.gender : null,
              withFamily: guest.withFamily,
            }))}
            rsvpLabels={t.rsvp}
            profileLabels={t.profile}
            inviteLocale={resolveLocale(wedding.locale)}
            labels={{
              open: t.open, copy: t.copy, copied: t.copied, share: t.share, search: t.search,
              noMatch: t.noMatch, shareText: t.shareText, guestColumn: t.guest, linkColumn: t.link,
            }}
          />
        </section>
      )}
    </DashboardShell>
  );
}
