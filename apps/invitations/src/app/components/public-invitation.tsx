'use client';

import { useState } from 'react';
import Countdown from './countdown';
import Reveal from './reveal';
import {
  CalendarIcon,
  GoogleCalendarIcon,
  AppleIcon,
  MapPinIcon,
  CopyIcon,
  CheckIcon,
  TablePlateIcon,
  CrestStarIcon,
  ArrowUpRightIcon,
  DownloadIcon,
  TemplateOrnament,
} from './icons';

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

  const locale: Locale = ['az', 'ru', 'en'].includes(wedding.locale)
    ? (wedding.locale as Locale)
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
  }

  return (
    <main className={`public-invitation ${template}`}>
      {/* Ambient background particles */}
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
          <span className="topline-symbol">
            <TemplateOrnament template={wedding.template} className="w-4 h-4 inline-block" />
          </span>
        </div>

        {/* Hero Section */}
        <section className="invitation-hero">
          <div className="hero-decoration" aria-hidden="true">
            <span className="hero-decoration-left">
              <TemplateOrnament template={wedding.template} className="w-16 h-16" />
            </span>
            <span className="hero-decoration-right">
              <TemplateOrnament template={wedding.template} className="w-16 h-16" />
            </span>
          </div>

          <Reveal className="hero-content">
            {/* Guest Salutation */}
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

            {/* Decorative Divider with SVG ornament */}
            <div className="hero-divider" aria-hidden="true">
              <span />
              <i>
                <TemplateOrnament template={wedding.template} className="w-5 h-5 inline-block" />
              </i>
              <span />
            </div>

            {/* Welcome Text */}
            {wedding.welcomeText && (
              <p className="hero-welcome">{wedding.welcomeText}</p>
            )}

            {/* Event Date */}
            <p className="hero-date">{formattedDate}</p>

            {/* VIP Table Badge */}
            {formattedTable && (
              <div className="invitation-table-badge" role="region" aria-label="Assigned Seating">
                <div className="table-badge-shimmer" aria-hidden="true" />
                <div className="table-badge-header">
                  <CrestStarIcon className="w-3.5 h-3.5 text-accent" />
                  <span className="table-badge-label">{t.tableReserved}</span>
                  <CrestStarIcon className="w-3.5 h-3.5 text-accent" />
                </div>
                <div className="table-badge-body">
                  <span className="table-badge-table-name">{formattedTable}</span>
                  {seatNumber && (
                    <span className="table-badge-seat-number">
                      <span className="seat-separator" aria-hidden="true" />
                      {t.seat} № {seatNumber}
                      <span className="seat-separator" aria-hidden="true" />
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
            <i aria-hidden="true">
              <TemplateOrnament template={wedding.template} className="w-4 h-4 inline-block" />
            </i>
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
                    <MapPinIcon className="w-3.5 h-3.5 inline-block" />
                    <span>{t.map}</span>
                    <ArrowUpRightIcon className="w-3 h-3 inline-block" />
                  </a>
                  <button
                    type="button"
                    onClick={copyToClipboard}
                    className="venue-copy-btn"
                    title={t.copyAddress}
                  >
                    {copied ? (
                      <>
                        <CheckIcon className="w-3.5 h-3.5 inline-block" />
                        <span>{t.copied}</span>
                      </>
                    ) : (
                      <>
                        <CopyIcon className="w-3.5 h-3.5 inline-block" />
                        <span>{t.copyAddress}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* 04 Table Card in details grid */}
            {formattedTable && (
              <div className="detail-card detail-table-assigned">
                <span className="detail-index">04</span>
                <span className="detail-label">{t.table}</span>
                <div className="detail-table-title-row">
                  <TablePlateIcon className="w-5 h-5 text-accent inline-block" />
                  <strong className="detail-table-title">{formattedTable}</strong>
                </div>
                {seatNumber && (
                  <span className="detail-seat-info">
                    {t.seat} № {seatNumber}
                  </span>
                )}
                <span className="detail-table-guest-note">{t.tableReserved}</span>
              </div>
            )}
          </div>

          {/* Add to Calendar: Fixed inline action box, NEVER gets cut off or hidden */}
          <div className="invitation-calendar-action">
            <div className="calendar-action-box">
              <div className="calendar-action-header">
                <CalendarIcon className="w-4 h-4 text-accent inline-block" />
                <span className="calendar-action-label">{t.addToCalendar}</span>
              </div>
              <div className="calendar-action-buttons">
                <a
                  href={getGoogleCalendarUrl()}
                  target="_blank"
                  rel="noreferrer"
                  className="calendar-action-btn google-btn"
                >
                  <GoogleCalendarIcon className="w-4 h-4 inline-block" />
                  <span>{t.googleCalendar}</span>
                  <ArrowUpRightIcon className="w-3 h-3 inline-block arrow-icon" />
                </a>
                <button
                  type="button"
                  onClick={downloadIcs}
                  className="calendar-action-btn apple-btn"
                >
                  <AppleIcon className="w-4 h-4 inline-block" />
                  <span>{t.appleCalendar}</span>
                  <DownloadIcon className="w-3 h-3 inline-block arrow-icon" />
                </button>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Countdown Timer */}
        <Reveal className="invitation-countdown">
          <div className="countdown-heading">
            <span>{t.countdown}</span>
            <i aria-hidden="true">
              <CrestStarIcon className="w-3.5 h-3.5 inline-block text-accent" />
            </i>
          </div>
          <Countdown date={wedding.eventDate} locale={locale} />
        </Reveal>

        {/* Couple Story */}
        {wedding.story && (
          <Reveal className="invitation-story">
            <span className="story-overline">{t.ourStory}</span>
            <div className="story-decoration" aria-hidden="true">
              <TemplateOrnament template={wedding.template} className="w-6 h-6 inline-block" />
            </div>
            <p>{wedding.story}</p>
          </Reveal>
        )}

        {/* Footer */}
        <Reveal className="invitation-footer">
          <div className="footer-ornament" aria-hidden="true">
            <TemplateOrnament template={wedding.template} className="w-6 h-6 inline-block" />
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
