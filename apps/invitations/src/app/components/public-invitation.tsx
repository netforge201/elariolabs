'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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
  ClockIcon,
  HeartOutlineIcon,
  HeartFilledIcon,
  PlayIcon,
  CloseIcon,
  FloralCorner,
  BotanicalLineArt,
} from './icons';

export type Locale = 'az' | 'ru' | 'en';

export type Wedding = {
  slug?: string;
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
  coverImage?: string | null;
};

const words = {
  az: {
    intro: 'Ailələrimizin iştirakı ilə',
    invitation: 'Sizi toy mərasimimizə dəvət edirik',
    weddingInvitation: 'TOY DƏVƏTNAMƏSİ',
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
    and: 'və',
    confirmAttendance: 'Təsdiq et',
    rsvpButtonText: 'İştirakı təsdiq et',
    rsvpTitle: 'İştirak təsdiqi',
    rsvpSubtitle: 'Zəhmət olmasa, iştirakınız barədə bizə əvvəlcədən bildirin',
    willAttend: 'Məmnuniyyətlə iştirak edəcəyəm',
    willNotAttend: 'Təəssüf ki, iştirak edə bilməyəcəyəm',
    guestsCount: 'Qonaq sayı',
    yourName: 'Adınız və Soyadınız',
    wishes: 'Gənclərə xoş arzularınız',
    sendRsvp: 'Təsdiqlə və Göndər',
    sending: 'Göndərilir...',
    rsvpSuccess: 'Təşəkkür edirik! Cavabınız qeydə alındı',
    rsvpSuccessSub: 'Sizi şad günümüzdə görməyi səbirsizliklə gözləyirik!',
    close: 'Bağla',
    musicOn: 'Musiqi',
    musicOff: 'Musiqini dayandır',
    welcomeDefault: 'Sizi həyatımızın ən xoşbəxt gününü bizimlə bölüşməyə dəvət edirik!',
  },
  ru: {
    intro: 'Вместе с нашими семьями',
    invitation: 'Приглашаем вас разделить наш особенный день',
    weddingInvitation: 'ПРИГЛАШЕНИЕ НА СВАДЬБУ',
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
    and: 'и',
    confirmAttendance: 'Подтвердить участие',
    rsvpButtonText: 'Подтвердить участие',
    rsvpTitle: 'Подтверждение участия',
    rsvpSubtitle: 'С радостью ждём вас! Пожалуйста, подтвердите своё присутствие',
    willAttend: 'С радостью буду',
    willNotAttend: 'К сожалению, не смогу',
    guestsCount: 'Количество персон',
    yourName: 'Ваше имя и фамилия',
    wishes: 'Пожелания молодожёнам',
    sendRsvp: 'Подтвердить присутствие',
    sending: 'Отправка...',
    rsvpSuccess: 'Спасибо! Ваш ответ принят',
    rsvpSuccessSub: 'С нетерпением ждём встречи с вами на нашем празднике!',
    close: 'Закрыть',
    musicOn: 'Музыка',
    musicOff: 'Выключить музыку',
    welcomeDefault: 'С радостью приглашаем вас разделить с нами особенный день — нашу свадьбу!',
  },
  en: {
    intro: 'Together with our families',
    invitation: 'We invite you to celebrate our special day',
    weddingInvitation: 'WEDDING INVITATION',
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
    and: '&',
    confirmAttendance: 'Confirm attendance',
    rsvpButtonText: 'Confirm attendance',
    rsvpTitle: 'RSVP Confirmation',
    rsvpSubtitle: 'We would love to know if you can make it to our special day',
    willAttend: 'Joyfully accept',
    willNotAttend: 'Regretfully decline',
    guestsCount: 'Number of guests',
    yourName: 'Your name',
    wishes: 'Wishes for the newlyweds',
    sendRsvp: 'Submit RSVP',
    sending: 'Sending...',
    rsvpSuccess: 'Thank you! Your RSVP is confirmed',
    rsvpSuccessSub: 'We cannot wait to celebrate this special day with you!',
    close: 'Close',
    musicOn: 'Music',
    musicOff: 'Pause music',
    welcomeDefault: 'We joyfully invite you to share our special day with us — our wedding celebration!',
  },
};

function resolveTemplate(template: string): 'classic' | 'modern' | 'minimal' {
  if (template === 'modern' || template === 'elegant') return 'modern';
  if (template === 'minimal') return 'minimal';
  return 'classic';
}

function formatTableLabel(tableName: string, locale: Locale): string {
  const trimmed = tableName.trim();
  if (/^\d+$/.test(trimmed)) {
    if (locale === 'ru') return `Стол № ${trimmed}`;
    if (locale === 'az') return `Masa № ${trimmed}`;
    return `Table No. ${trimmed}`;
  }
  return trimmed;
}

function getInitialLetter(name: string): string {
  return name.trim().charAt(0).toUpperCase() || 'A';
}

// Falling rose petals animation for Template 1 (Cream)
function PetalsShower() {
  const petals = useMemo(() => {
    return Array.from({ length: 18 }, (_, i) => ({
      id: i,
      left: `${(i * 5.6 + Math.sin(i * 1.7) * 4) % 100}%`,
      delay: `${(i * 0.75) % 8}s`,
      duration: `${7 + (i % 5) * 1.4}s`,
      size: 14 + (i % 4) * 5,
      rotation: (i * 47) % 360,
      opacity: 0.35 + (i % 4) * 0.15,
    }));
  }, []);

  return (
    <div className="petals-container" aria-hidden="true">
      {petals.map(p => (
        <span
          key={p.id}
          className="falling-petal"
          style={{
            left: p.left,
            animationDelay: p.delay,
            animationDuration: p.duration,
            width: `${p.size}px`,
            height: `${p.size * 1.3}px`,
            opacity: p.opacity,
          }}
        />
      ))}
    </div>
  );
}

// Golden stardust bokeh particles for Template 2 (Photo)
function StardustParticles() {
  const particles = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => ({
      id: i,
      left: `${(i * 4.3 + Math.cos(i * 2.1) * 6) % 100}%`,
      delay: `${(i * 0.45) % 6}s`,
      duration: `${5 + (i % 5) * 1.2}s`,
      size: 2 + (i % 3) * 2.5,
      opacity: 0.3 + (i % 4) * 0.18,
    }));
  }, []);

  return (
    <div className="stardust-container" aria-hidden="true">
      {particles.map(p => (
        <span
          key={p.id}
          className="stardust-particle"
          style={{
            left: p.left,
            animationDelay: p.delay,
            animationDuration: p.duration,
            width: `${p.size}px`,
            height: `${p.size}px`,
            opacity: p.opacity,
          }}
        />
      ))}
    </div>
  );
}

// Soft organic dust for Template 3 (Linear)
function OrganicDust() {
  const specks = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      id: i,
      left: `${(i * 8.3) % 100}%`,
      delay: `${(i * 0.8) % 7}s`,
      duration: `${8 + (i % 4) * 2}s`,
      size: 2 + (i % 2) * 1.5,
    }));
  }, []);

  return (
    <div className="organic-dust-container" aria-hidden="true">
      {specks.map(s => (
        <span
          key={s.id}
          className="dust-speck"
          style={{
            left: s.left,
            animationDelay: s.delay,
            animationDuration: s.duration,
            width: `${s.size}px`,
            height: `${s.size}px`,
          }}
        />
      ))}
    </div>
  );
}

export default function PublicInvitation({
  wedding,
  guestName,
  guestSlug,
  tableName,
  seatNumber,
}: {
  wedding: Wedding;
  guestName?: string;
  guestSlug?: string;
  tableName?: string | null;
  seatNumber?: number | null;
}) {
  const [copied, setCopied] = useState(false);

  // Audio ambient player
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorIntervalRef = useRef<number | null>(null);

  const locale: Locale = ['az', 'ru', 'en'].includes(wedding.locale)
    ? (wedding.locale as Locale)
    : 'az';

  const t = words[locale];
  const activeTemplate = resolveTemplate(wedding.template);
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

  const initOne = getInitialLetter(wedding.partnerOne);
  const initTwo = getInitialLetter(wedding.partnerTwo);

  // Default photography couple background for Template 2
  const photoBackground = wedding.coverImage || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=80';

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
    const time = wedding.eventTime || '17:00';
    const [h, m] = time.split(':').map(Number);
    const start = new Date(date);
    start.setHours(h || 17, m || 0, 0, 0);
    const end = new Date(start);
    end.setHours(start.getHours() + 5);

    const fmt = (d: Date) => d.toISOString().replace(/-|:|\.\d+/g, '');
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${fmt(start)}/${fmt(end)}&details=${details}&location=${loc}`;
  }

  function downloadIcs() {
    const time = wedding.eventTime || '17:00';
    const [h, m] = time.split(':').map(Number);
    const start = new Date(date);
    start.setHours(h || 17, m || 0, 0, 0);
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

  // Romantic gentle acoustic melody synthesis via Web Audio API
  function toggleMusic() {
    if (isPlaying) {
      if (oscillatorIntervalRef.current) {
        window.clearInterval(oscillatorIntervalRef.current);
        oscillatorIntervalRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      setIsPlaying(false);
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      // Romantic Canon in D inspired gentle arpeggios
      const notes = [
        293.66, 369.99, 440.0, 587.33,
        220.0, 277.18, 329.63, 440.0,
        246.94, 293.66, 369.99, 493.88,
        185.0, 220.0, 277.18, 369.99,
        196.0, 246.94, 293.66, 392.0,
        146.83, 220.0, 293.66, 369.99,
      ];
      let step = 0;

      const playNote = () => {
        if (!ctx || ctx.state === 'closed') return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        const freq = notes[step % notes.length];
        step++;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        gain.gain.setValueAtTime(0.001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.06, ctx.currentTime + 0.12);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 1.25);
      };

      playNote();
      oscillatorIntervalRef.current = window.setInterval(playNote, 600);
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    }
  }

  useEffect(() => {
    return () => {
      if (oscillatorIntervalRef.current) {
        window.clearInterval(oscillatorIntervalRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  return (
    <main className={`public-invitation template-v2-${activeTemplate}`}>
      {/* Background Ambience & Animation */}
      {activeTemplate === 'classic' && <PetalsShower />}
      {activeTemplate === 'modern' && <StardustParticles />}
      {activeTemplate === 'minimal' && <OrganicDust />}

      <div className="invitation-shell">
        {/* ============================================================== */}
        {/* TEMPLATE 1: КЛАССИЧЕСКИЙ (А. КРЕМОВЫЙ)                         */}
        {/* ============================================================== */}
        {activeTemplate === 'classic' && (
          <section className="v2-card v2-classic-card">
            {/* Corner Floral Ornaments */}
            <div className="floral-corner-tl" aria-hidden="true"><FloralCorner position="top-left" /></div>
            <div className="floral-corner-tr" aria-hidden="true"><FloralCorner position="top-right" /></div>
            <div className="floral-corner-bl" aria-hidden="true"><FloralCorner position="bottom-left" /></div>
            <div className="floral-corner-br" aria-hidden="true"><FloralCorner position="bottom-right" /></div>

            {/* Inner Gold Foil Frame */}
            <div className="v2-classic-inner-frame">
              <Reveal>
                {/* Monogram Crest A & M */}
                <div className="v2-classic-monogram" aria-hidden="true">
                  <span>{initOne}</span>
                  <i className="v2-classic-monogram-amp">&</i>
                  <span>{initTwo}</span>
                </div>

                {/* Subtitle */}
                <div className="v2-classic-subtitle">{t.weddingInvitation}</div>

                {/* Couple Names in Cursive Script */}
                <h1 className="v2-classic-names">
                  <span>{wedding.partnerOne}</span>
                  <span className="v2-classic-amp">{t.and}</span>
                  <span>{wedding.partnerTwo}</span>
                </h1>

                {/* Delicate Gold Heart Outline */}
                <div className="v2-classic-heart" aria-hidden="true">
                  <HeartOutlineIcon className="w-5 h-5 text-amber-700/60 inline-block" />
                </div>

                {/* Guest Salutation if personalized link */}
                {guestName && (
                  <div className="v2-guest-badge">
                    <span className="v2-guest-eyebrow">{t.personalInvitation}</span>
                    <strong className="v2-guest-name">{personalGreeting}</strong>
                  </div>
                )}

                {/* Welcome Message */}
                <p className="v2-classic-welcome">
                  {wedding.welcomeText || t.welcomeDefault}
                </p>

                {/* Details Bar: Date, Time, Venue with Icons */}
                <div className="v2-classic-details-bar">
                  <div className="v2-detail-pill">
                    <CalendarIcon className="w-4 h-4 text-amber-800/80" />
                    <span>{formattedDate}</span>
                  </div>
                  <div className="v2-detail-pill">
                    <ClockIcon className="w-4 h-4 text-amber-800/80" />
                    <span>{wedding.eventTime || '17:00'}</span>
                  </div>
                  {wedding.venueName && (
                    <div className="v2-detail-pill v2-detail-pill-venue">
                      <MapPinIcon className="w-4 h-4 text-amber-800/80" />
                      <span>{wedding.venueName}</span>
                    </div>
                  )}
                </div>

                {/* VIP Table Badge for Guest */}
                {formattedTable && (
                  <div className="v2-table-badge">
                    <CrestStarIcon className="w-3.5 h-3.5 text-amber-700" />
                    <span className="v2-table-name">{formattedTable}</span>
                    {seatNumber && (
                      <span className="v2-seat-text">· {t.seat} № {seatNumber}</span>
                    )}
                    <CrestStarIcon className="w-3.5 h-3.5 text-amber-700" />
                  </div>
                )}

              </Reveal>
            </div>
          </section>
        )}

        {/* ============================================================== */}
        {/* TEMPLATE 2: СОВРЕМЕННЫЙ (А. ФОТОГРАФИЧЕСКИЙ)                   */}
        {/* ============================================================== */}
        {activeTemplate === 'modern' && (
          <section className="v2-card v2-modern-card">
            {/* Couple Full Photo Background */}
            <div
              className="v2-modern-bg-photo"
              style={{ backgroundImage: `url("${photoBackground}")` }}
              aria-hidden="true"
            />
            {/* Cinematic Gradient Scrim */}
            <div className="v2-modern-scrim" aria-hidden="true" />

            <div className="v2-modern-content">
              <Reveal>
                {/* Subtitle */}
                <div className="v2-modern-subtitle">{t.weddingInvitation}</div>

                {/* Towering Bold Editorial Names */}
                <h1 className="v2-modern-names">
                  <span className="modern-name-one">{wedding.partnerOne}</span>
                  <span className="modern-name-and">{t.and}</span>
                  <span className="modern-name-two">{wedding.partnerTwo}</span>
                </h1>

                {/* Guest Salutation if personalized link */}
                {guestName && (
                  <div className="v2-modern-guest">
                    <span className="v2-modern-guest-label">{t.personalInvitation}</span>
                    <strong className="v2-modern-guest-name">{personalGreeting}</strong>
                  </div>
                )}

                {/* Welcome Message */}
                <p className="v2-modern-welcome">
                  {wedding.welcomeText || t.welcomeDefault}
                </p>

                {/* Details Row */}
                <div className="v2-modern-details-row">
                  <div className="v2-modern-pill">
                    <CalendarIcon className="w-4 h-4 text-white/90" />
                    <span>{formattedDate}</span>
                  </div>
                  <div className="v2-modern-pill">
                    <ClockIcon className="w-4 h-4 text-white/90" />
                    <span>{wedding.eventTime || '17:00'}</span>
                  </div>
                  {wedding.venueName && (
                    <div className="v2-modern-pill v2-modern-venue">
                      <MapPinIcon className="w-4 h-4 text-white/90" />
                      <span>{wedding.venueName}</span>
                    </div>
                  )}
                </div>

                {/* VIP Table Badge */}
                {formattedTable && (
                  <div className="v2-modern-table-badge">
                    <CrestStarIcon className="w-3.5 h-3.5 text-amber-300" />
                    <span>{formattedTable}</span>
                    {seatNumber && <b>· {t.seat} № {seatNumber}</b>}
                    <CrestStarIcon className="w-3.5 h-3.5 text-amber-300" />
                  </div>
                )}

              </Reveal>
            </div>
          </section>
        )}

        {/* ============================================================== */}
        {/* TEMPLATE 3: МИНИМАЛИСТИЧНЫЙ (С. ЛИНЕЙНЫЙ)                      */}
        {/* ============================================================== */}
        {activeTemplate === 'minimal' && (
          <section className="v2-card v2-minimal-card">
            <div className="v2-minimal-grid">
              {/* Left Column: Asymmetrical Typography & Information */}
              <div className="v2-minimal-content">
                <Reveal>
                  <div className="v2-minimal-subtitle">{t.weddingInvitation}</div>

                  <h1 className="v2-minimal-names">
                    <span className="minimal-line-1">{wedding.partnerOne}</span>
                    <span className="minimal-line-2">{t.and} {wedding.partnerTwo}</span>
                  </h1>

                  {/* Guest Salutation if personalized link */}
                  {guestName && (
                    <div className="v2-minimal-guest">
                      <span className="v2-minimal-guest-badge">{t.personalInvitation}</span>
                      <p className="v2-minimal-guest-salutation">{personalGreeting}</p>
                    </div>
                  )}

                  <p className="v2-minimal-welcome">
                    {wedding.welcomeText || t.welcomeDefault}
                  </p>

                  <div className="v2-minimal-details">
                    <div className="v2-minimal-item">
                      <CalendarIcon className="w-4 h-4 text-stone-600" />
                      <span>{formattedDate}</span>
                    </div>
                    <div className="v2-minimal-item">
                      <ClockIcon className="w-4 h-4 text-stone-600" />
                      <span>{wedding.eventTime || '17:00'}</span>
                    </div>
                    {wedding.venueName && (
                      <div className="v2-minimal-item">
                        <MapPinIcon className="w-4 h-4 text-stone-600" />
                        <span>{wedding.venueName}</span>
                      </div>
                    )}
                  </div>

                  {formattedTable && (
                    <div className="v2-minimal-table-badge">
                      <TablePlateIcon className="w-4 h-4 text-stone-700" />
                      <span>{formattedTable}</span>
                      {seatNumber && <small>· {t.seat} № {seatNumber}</small>}
                    </div>
                  )}

                </Reveal>
              </div>

              {/* Right Column: Exquisite Minimalist Botanical Line-Art */}
              <div className="v2-minimal-artwork" aria-hidden="true">
                <BotanicalLineArt className="v2-botanical-svg" />
              </div>
            </div>
          </section>
        )}

        {/* ============================================================== */}
        {/* INTERACTIVE CALENDAR, VENUE & ESSENTIALS SECTION               */}
        {/* ============================================================== */}
        <Reveal className="v2-essentials-section">
          {/* Calendar & Address Actions */}
          <div className="v2-interactive-calendar-card">
            <div className="calendar-card-header">
              <div className="calendar-header-icon">
                <CalendarIcon className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h3>{t.date}</h3>
                <p>{formattedDate} {wedding.eventTime ? `· ${wedding.eventTime}` : ''}</p>
              </div>
            </div>

            <div className="calendar-buttons-row">
              <a
                href={getGoogleCalendarUrl()}
                target="_blank"
                rel="noreferrer"
                className="v2-btn-sub action-google-cal"
              >
                <GoogleCalendarIcon className="w-4 h-4 inline-block" />
                <span>{t.googleCalendar}</span>
              </a>
              <button
                type="button"
                onClick={downloadIcs}
                className="v2-btn-sub action-apple-cal"
              >
                <AppleIcon className="w-4 h-4 inline-block" />
                <span>{t.appleCalendar}</span>
              </button>
            </div>
          </div>

          {/* Venue Card with Copy Address & Maps */}
          {address && (
            <div className="v2-venue-card">
              <div className="venue-card-header">
                <div className="venue-header-icon">
                  <MapPinIcon className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h3>{wedding.venueName || t.venue}</h3>
                  {wedding.venueAddress && <p>{wedding.venueAddress}</p>}
                </div>
              </div>

              <div className="venue-buttons-row">
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className={`v2-btn-sub action-copy-address ${copied ? 'is-copied' : ''}`}
                >
                  {copied ? <CheckIcon className="w-4 h-4 text-emerald-600 inline-block" /> : <CopyIcon className="w-4 h-4 inline-block" />}
                  <span>{copied ? t.copied : t.copyAddress}</span>
                </button>
                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="v2-btn-sub action-open-map"
                >
                  <MapPinIcon className="w-4 h-4 inline-block" />
                  <span>{t.map}</span>
                </a>
              </div>
            </div>
          )}
        </Reveal>

        {/* ============================================================== */}
        {/* COUNTDOWN SECTION                                              */}
        {/* ============================================================== */}
        <Reveal className="v2-countdown-section">
          <span className="v2-countdown-title">{t.countdown}</span>
          <Countdown date={wedding.eventDate} locale={locale} />
        </Reveal>

        {/* ============================================================== */}
        {/* OUR STORY (IF PROVIDED)                                        */}
        {/* ============================================================== */}
        {wedding.story && (
          <Reveal className="v2-story-section">
            <h3 className="v2-story-title">{t.ourStory}</h3>
            <p className="v2-story-text">{wedding.story}</p>
          </Reveal>
        )}

        {/* Footer */}
        <footer className="v2-footer">
          <p>{t.footer}</p>
          <small>{wedding.partnerOne} & {wedding.partnerTwo} · 2026</small>
        </footer>
      </div>

      {/* ============================================================== */}
      {/* FLOATING AUDIO MUSIC PLAYER (BOTTOM-RIGHT)                      */}
      {/* ============================================================== */}
      <button
        type="button"
        className={`v2-music-toggle ${isPlaying ? 'is-playing' : ''}`}
        onClick={toggleMusic}
        title={isPlaying ? t.musicOff : t.musicOn}
        aria-label={isPlaying ? t.musicOff : t.musicOn}
      >
        <span className="v2-music-pulse-ring" aria-hidden="true" />
        {isPlaying ? (
          <div className="v2-soundbars" aria-hidden="true">
            <span className="bar b1" />
            <span className="bar b2" />
            <span className="bar b3" />
          </div>
        ) : (
          <PlayIcon className="w-4 h-4 ml-0.5" />
        )}
      </button>

    </main>
  );
}
