'use client';

import { useState } from 'react';
import Countdown from './countdown';
import Reveal from './reveal';

export type Locale = 'az' | 'ru' | 'en';

export type Wedding = {
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
    personalInvitation: 'ŞƏXSİ DƏVƏTNAMƏ',
    guestHonor: 'Hörmətli qonağımız',
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
    seat: 'Yer',
    tableReserved: 'Sizin üçün ayrılmış masa',
    waitingForYou: 'Sizi aramızda görməyə şad olarıq',
    addToCalendar: 'Təqvimə əlavə et',
    googleCalendar: 'Google Calendar',
    appleCalendar: 'Apple / iCal',
    copyAddress: 'Ünvanı kopyala',
    copied: 'Ünvan kopyalandı!',
  },
  ru: {
    intro: 'Вместе с нашими семьями',
    invitation: 'Приглашаем вас разделить наш особенный день',
    personalInvitation: 'ПЕРСОНАЛЬНОЕ ПРИГЛАШЕНИЕ',
    guestHonor: 'Дорогой гость',
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
    seat: 'Место',
    tableReserved: 'Зарезервировано для вас',
    waitingForYou: 'Ждём вас с нетерпением',
    addToCalendar: 'Добавить в календарь',
    googleCalendar: 'Google Календарь',
    appleCalendar: 'Apple / iCal',
    copyAddress: 'Скопировать адрес',
    copied: 'Адрес скопирован!',
  },
  en: {
    intro: 'Together with our families',
    invitation: 'We invite you to celebrate our special day',
    personalInvitation: 'PERSONAL INVITATION',
    guestHonor: 'Honored Guest',
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
    seat: 'Seat',
    tableReserved: 'Reserved especially for you',
    waitingForYou: 'We look forward to celebrating with you',
    addToCalendar: 'Add to Calendar',
    googleCalendar: 'Google Calendar',
    appleCalendar: 'Apple / iCal',
    copyAddress: 'Copy address',
    copied: 'Address copied!',
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

function formatTableLabel(tableName: string, locale: Locale): string {
  const trimmed = tableName.trim();
  if (/^\d+$/.test(trimmed)) {
    if (locale === 'ru') return `Стол № ${trimmed}`;
    if (locale === 'az') return `Masa № ${trimmed}`;
    return `Table No. ${trimmed}`;
  }
  return trimmed;
}

export default function PublicInvitation({
  wedding,
  guestName,
  tableName,
  seatNumber,
}: {
  wedding: Wedding;
  guestName?: string;
  tableName?: string | null;
  seatNumber?: number | null;
}) {
  const [copied, setCopied] = useState(false);
  const [showCalendarMenu, setShowCalendarMenu] = useState(false);

  const locale: Locale = ['az', 'ru', 'en'].includes(wedding.locale)
    ? (wedding.locale as Locale)
    : 'az';

  const t = words[locale];
  const template = templates[wedding.template] || templates.elegant;
  const ornament = ornaments[wedding.template] || '✳';
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

  const formattedTable = tableName ? formatTableLabel(tableName, locale) : null;

  const personalGreeting = guestName
    ? locale === 'ru'
      ? `Дорогие ${guestName}`
      : locale === 'az'
        ? `Hörmətli ${guestName}`
        : `Dear ${guestName}`
    : null;

  function copyToClipboard() {
    if (!address) return;
    navigator.clipboard.writeText(address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    });
  }

  function getGoogleCalendarUrl() {
    const title = encodeURIComponent(`${wedding.partnerOne} & ${wedding.partnerTwo} — Wedding`);
    const details = encodeURIComponent(
      wedding.welcomeText || `Wedding celebration of ${wedding.partnerOne} & ${wedding.partnerTwo}`
    );
    const loc = encodeURIComponent(address);
    const time = wedding.eventTime || '18:00';
    const [h, m] = time.split(':').map(Number);
    const start = new Date(date);
    start.setHours(h || 18, m || 0, 0, 0);
    const end = new Date(start);
    end.setHours(start.getHours() + 5);

    const fmt = (d: Date) => d.toISOString().replace(/-|:|\.\d+/g, '');
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${fmt(start)}/${fmt(end)}&details=${details}&location=${loc}`;
  }

  function downloadIcs() {
    const time = wedding.eventTime || '18:00';
    const [h, m] = time.split(':').map(Number);
    const start = new Date(date);
    start.setHours(h || 18, m || 0, 0, 0);
    const end = new Date(start);
    end.setHours(start.getHours() + 5);

    const fmt = (d: Date) => d.toISOString().replace(/-|:|\.\d+/g, '');
    const title = `${wedding.partnerOne} & ${wedding.partnerTwo} — Wedding`;

    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//ElarioLabs//Wedding Invitation//EN',
      'BEGIN:VEVENT',
      `SUMMARY:${title}`,
      `DESCRIPTION:${wedding.welcomeText || title}`,
      `LOCATION:${address}`,
      `DTSTART:${fmt(start)}`,
      `DTEND:${fmt(end)}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invitation-${wedding.partnerOne}-${wedding.partnerTwo}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowCalendarMenu(false);
  }

  return (
    <main className={`public-invitation ${template}`}>
      {/* Dynamic atmospheric ambient glow and particles */}
      <div className="design-atmosphere" aria-hidden="true">
        <span className="atmosphere-orb orb-one" />
        <span className="atmosphere-orb orb-two" />
        <span className="atmosphere-orb orb-three" />
        <div className="floating-particles">
          <span className="particle p1" />
          <span className="particle p2" />
          <span className="particle p3" />
          <span className="particle p4" />
          <span className="particle p5" />
          <span className="particle p6" />
        </div>
      </div>

      <div className="invitation-shell">
        {/* Topline header */}
        <div className="invitation-topline">
          <span>{guestName ? t.personalInvitation : t.intro}</span>
          <span className="topline-symbol">{ornament}</span>
        </div>

        {/* Hero Section */}
        <section className="invitation-hero">
          <div className="hero-decoration" aria-hidden="true">
            <span className="hero-decoration-left">{ornament}</span>
            <span className="hero-decoration-right">{ornament}</span>
          </div>

          <Reveal className="hero-content">
            {/* Personal Guest Greeting if personal invitation */}
            {guestName ? (
              <div className="hero-guest-salutation">
                <span className="guest-eyebrow">{t.personalInvitation}</span>
                <p className="hero-kicker guest-highlighted-name">{personalGreeting}</p>
                <p className="hero-invitation-line">{t.invitation}</p>
              </div>
            ) : (
              <p className="hero-kicker">{t.invitation}</p>
            )}

            {/* Couple Names */}
            <h1 className="hero-names">
              <span>{wedding.partnerOne}</span>
              <i>{wedding.template === 'minimal' ? '+' : '&'}</i>
              <span>{wedding.partnerTwo}</span>
            </h1>

            {/* Decorative Divider */}
            <div className="hero-divider" aria-hidden="true">
              <span />
              <i>{ornament}</i>
              <span />
            </div>

            {/* Welcome Text */}
            {wedding.welcomeText && (
              <p className="hero-welcome">{wedding.welcomeText}</p>
            )}

            {/* Formatted Date */}
            <p className="hero-date">{formattedDate}</p>

            {/* VIP Assigned Table Card (Prominent on personal invitations) */}
            {formattedTable && (
              <div className="invitation-table-badge" role="region" aria-label="Assigned Seating">
                <div className="table-badge-shimmer" aria-hidden="true" />
                <div className="table-badge-header">
                  <span className="table-badge-crest" aria-hidden="true">✦</span>
                  <span className="table-badge-label">{t.tableReserved}</span>
                  <span className="table-badge-crest" aria-hidden="true">✦</span>
                </div>
                <div className="table-badge-body">
                  <span className="table-badge-table-name">{formattedTable}</span>
                  {seatNumber && (
                    <span className="table-badge-seat-number">
                      <span className="seat-separator">•</span>
                      {t.seat} № {seatNumber}
                      <span className="seat-separator">•</span>
                    </span>
                  )}
                </div>
                <div className="table-badge-footer">
                  <span>{t.waitingForYou}</span>
                </div>
              </div>
            )}
          </Reveal>

          <div className="hero-bottom-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </section>

        {/* Event Details Grid */}
        <Reveal className="invitation-details">
          <div className="section-heading">
            <span>{t.together}</span>
            <i aria-hidden="true">{ornament}</i>
          </div>

          <div className={`details-grid ${formattedTable ? 'has-table-card' : ''}`}>
            {/* 01 Date */}
            <div className="detail-card detail-date">
              <span className="detail-index">01</span>
              <span className="detail-label">{t.date}</span>
              <strong>{formattedDate}</strong>
            </div>

            {/* 02 Time */}
            {wedding.eventTime && (
              <div className="detail-card detail-time">
                <span className="detail-index">02</span>
                <span className="detail-label">{t.time}</span>
                <strong>{wedding.eventTime}</strong>
              </div>
            )}

            {/* 03 Venue & Navigation */}
            {address && (
              <div className="detail-card detail-venue">
                <span className="detail-index">03</span>
                <span className="detail-label">{t.venue}</span>
                <strong>{wedding.venueName || wedding.venueAddress}</strong>
                {wedding.venueName && wedding.venueAddress && (
                  <span className="venue-address">{wedding.venueAddress}</span>
                )}
                <div className="venue-actions">
                  <a
                    href={mapUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="venue-map-link"
                  >
                    <span>{t.map}</span>
                    <span aria-hidden="true">↗</span>
                  </a>
                  <button
                    type="button"
                    onClick={copyToClipboard}
                    className="venue-copy-btn"
                    title={t.copyAddress}
                  >
                    {copied ? t.copied : t.copyAddress}
                  </button>
                </div>
              </div>
            )}

            {/* 04 Table Card in details grid if assigned */}
            {formattedTable && (
              <div className="detail-card detail-table-assigned">
                <span className="detail-index">04</span>
                <span className="detail-label">{t.table}</span>
                <strong className="detail-table-title">{formattedTable}</strong>
                {seatNumber && (
                  <span className="detail-seat-info">
                    {t.seat} № {seatNumber}
                  </span>
                )}
                <span className="detail-table-guest-note">{t.tableReserved}</span>
              </div>
            )}
          </div>

          {/* Quick Actions: Add to Calendar */}
          <div className="invitation-calendar-action">
            <div className="calendar-dropdown-wrapper">
              <button
                type="button"
                onClick={() => setShowCalendarMenu(!showCalendarMenu)}
                className="calendar-btn"
                aria-expanded={showCalendarMenu}
              >
                <svg
                  className="calendar-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  aria-hidden="true"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span>{t.addToCalendar}</span>
                <span className="calendar-chevron" aria-hidden="true">▾</span>
              </button>

              {showCalendarMenu && (
                <div className="calendar-menu">
                  <a
                    href={getGoogleCalendarUrl()}
                    target="_blank"
                    rel="noreferrer"
                    className="calendar-menu-item"
                    onClick={() => setShowCalendarMenu(false)}
                  >
                    <span>{t.googleCalendar}</span>
                    <span aria-hidden="true">↗</span>
                  </a>
                  <button
                    type="button"
                    onClick={downloadIcs}
                    className="calendar-menu-item"
                  >
                    <span>{t.appleCalendar}</span>
                    <span aria-hidden="true">↓</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </Reveal>

        {/* Countdown Timer */}
        <Reveal className="invitation-countdown">
          <div className="countdown-heading">
            <span>{t.countdown}</span>
            <i aria-hidden="true">✧</i>
          </div>
          <Countdown date={wedding.eventDate} locale={locale} />
        </Reveal>

        {/* Couple Story */}
        {wedding.story && (
          <Reveal className="invitation-story">
            <span className="story-overline">{t.ourStory}</span>
            <div className="story-decoration" aria-hidden="true">
              {ornament}
            </div>
            <p>{wedding.story}</p>
          </Reveal>
        )}

        {/* Elegant Footer */}
        <Reveal className="invitation-footer">
          <div className="footer-ornament" aria-hidden="true">
            {ornament}
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
