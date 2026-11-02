import Countdown from './countdown';
import Reveal from './reveal';

type Locale = 'az' | 'ru' | 'en';

type Wedding = {
  partnerOne: string;
  partnerTwo: string;
  eventDate: string;
  eventTime: string | null;
  venueName: string | null;
  venueAddress: string | null;
  welcomeText: string | null;
  story: string | null;
  locale: string;
  template: string;
};

const words = {
  az: {
    intro: 'Ailələrimizin iştirakı ilə',
    invitation: 'Sizi toy mərasimimizə dəvət edirik',
    date: 'Toy tarixi',
    time: 'Başlama vaxtı',
    venue: 'Mərasim məkanı',
    map: 'Xəritədə aç',
    countdown: 'Bu günə qalan vaxt',
    footer: 'Bu özəl günümüzü bizimlə paylaşın',
    together: 'Birlikdə yeni bir başlanğıca',
    ourStory: 'Bizim hekayəmiz',
    celebration: 'Sevgi ilə, sizin üçün',
    table: 'Masanız',
  },
  ru: {
    intro: 'Вместе с нашими семьями',
    invitation: 'Приглашаем вас разделить наш особенный день',
    date: 'Дата свадьбы',
    time: 'Начало торжества',
    venue: 'Место проведения',
    map: 'Открыть карту',
    countdown: 'До нашего дня осталось',
    footer: 'Будем рады разделить этот день с вами',
    together: 'Навстречу нашей новой главе',
    ourStory: 'Наша история',
    celebration: 'С любовью, для вас',
    table: 'Ваш стол',
  },
  en: {
    intro: 'Together with our families',
    invitation: 'We invite you to celebrate our special day',
    date: 'Wedding date',
    time: 'Ceremony begins',
    venue: 'The celebration',
    map: 'Open map',
    countdown: 'Counting down to our day',
    footer: 'We look forward to celebrating with you',
    together: 'Together, into our next chapter',
    ourStory: 'Our story',
    celebration: 'With love, for you',
    table: 'Your table',
  },
};

const templates: Record<string, string> = {
  elegant: 'theme-elegant layout-editorial',
  'soft-colorful': 'theme-soft layout-bloom',
  azeri: 'theme-national layout-heritage',
  minimal: 'theme-minimal layout-minimal',
  botanical: 'theme-botanical layout-garden',
  romantic: 'theme-romantic layout-midnight',
  classic: 'theme-classic layout-royal',
};

const ornaments: Record<string, string> = {
  elegant: '✳',
  'soft-colorful': '❀',
  azeri: '✥',
  minimal: '+',
  botanical: '❧',
  romantic: '✧',
  classic: '❦',
};

export default function PublicInvitation({
  wedding,
  guestName,
  tableName,
}: {
  wedding: Wedding;
  guestName?: string;
  tableName?: string | null;
}) {
  const locale: Locale = ['az', 'ru', 'en'].includes(wedding.locale)
    ? wedding.locale as Locale
    : 'az';

  const t = words[locale];
  const template = templates[wedding.template] || templates.elegant;
  const date = new Date(wedding.eventDate);

  const formattedDate = new Intl.DateTimeFormat(
    locale === 'az' ? 'az-AZ' : locale === 'ru' ? 'ru-RU' : 'en-GB',
    {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Baku',
    },
  ).format(date);

  const address = [wedding.venueName, wedding.venueAddress]
    .filter(Boolean)
    .join(', ');

  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  const personalGreeting = guestName
    ? locale === 'ru'
      ? `Дорогие ${guestName}, приглашаем вас разделить с нами этот особенный день`
      : locale === 'az'
        ? `Hörmətli ${guestName}, sizi toy mərasimimizə dəvət edirik`
        : `Dear ${guestName}, we invite you to celebrate our special day`
    : t.invitation;

  return (
    <main className={`public-invitation ${template}`}>
      <div className="design-atmosphere" aria-hidden="true">
        <span className="atmosphere-orb orb-one" />
        <span className="atmosphere-orb orb-two" />
        <span className="atmosphere-orb orb-three" />
      </div>

      <div className="invitation-shell">
        <div className="invitation-topline">
          <span>{t.intro}</span>
          <span className="topline-symbol">{ornaments[wedding.template] || '✳'}</span>
        </div>

        <section className="invitation-hero">
          <div className="hero-decoration" aria-hidden="true">
            <span className="hero-decoration-left">{ornaments[wedding.template] || '✳'}</span>
            <span className="hero-decoration-right">{ornaments[wedding.template] || '✳'}</span>
          </div>

          <Reveal className="hero-content">
            <p className="hero-kicker">{personalGreeting}</p>

            <h1 className="hero-names">
              <span>{wedding.partnerOne}</span>
              <i>{wedding.template === 'minimal' ? '+' : '&'}</i>
              <span>{wedding.partnerTwo}</span>
            </h1>

            <div className="hero-divider" aria-hidden="true">
              <span />
              <i>{ornaments[wedding.template] || '✳'}</i>
              <span />
            </div>

            {wedding.welcomeText && (
              <p className="hero-welcome">{wedding.welcomeText}</p>
            )}

            <p className="hero-date">{formattedDate}</p>

            {guestName && tableName && (
              <div className="invitation-table-number">
                <span>{t.table}</span>
                <strong>{tableName}</strong>
              </div>
            )}
          </Reveal>

          <div className="hero-bottom-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </section>

        <Reveal className="invitation-details">
          <div className="section-heading">
            <span>{t.together}</span>
            <i aria-hidden="true">{ornaments[wedding.template] || '✳'}</i>
          </div>

          <div className="details-grid">
            <div className="detail-card detail-date">
              <span className="detail-index">01</span>
              <span className="detail-label">{t.date}</span>
              <strong>{formattedDate}</strong>
            </div>

            {wedding.eventTime && (
              <div className="detail-card detail-time">
                <span className="detail-index">02</span>
                <span className="detail-label">{t.time}</span>
                <strong>{wedding.eventTime}</strong>
              </div>
            )}

            {address && (
              <div className="detail-card detail-venue">
                <span className="detail-index">03</span>
                <span className="detail-label">{t.venue}</span>
                <strong>{wedding.venueName || wedding.venueAddress}</strong>
                {wedding.venueName && wedding.venueAddress && (
                  <span className="venue-address">{wedding.venueAddress}</span>
                )}
                <a href={mapUrl} target="_blank" rel="noreferrer">
                  {t.map} <span aria-hidden="true">↗</span>
                </a>
              </div>
            )}
          </div>
        </Reveal>

        <Reveal className="invitation-countdown">
          <div className="countdown-heading">
            <span>{t.countdown}</span>
            <i aria-hidden="true">✧</i>
          </div>
          <Countdown date={wedding.eventDate} locale={locale} />
        </Reveal>

        {wedding.story && (
          <Reveal className="invitation-story">
            <span className="story-overline">{t.ourStory}</span>
            <div className="story-decoration" aria-hidden="true">
              {ornaments[wedding.template] || '✳'}
            </div>
            <p>{wedding.story}</p>
          </Reveal>
        )}

        <Reveal className="invitation-footer">
          <div className="footer-ornament" aria-hidden="true">
            {ornaments[wedding.template] || '✳'}
          </div>
          <p>{t.footer}</p>
          <span>{t.celebration}</span>
          <div className="footer-names">
            {wedding.partnerOne} <i>&</i> {wedding.partnerTwo}
          </div>
        </Reveal>
      </div>
    </main>
  );
}
