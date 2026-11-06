import type { Locale } from './catalog';

const intlLocale: Record<Locale, string> = { az: 'az-AZ', ru: 'ru-RU', en: 'en-GB' };

/** "2026-06-14" from an ISO string or a plain date value. */
export function dayKey(value: string): string {
  return value.slice(0, 10);
}

function utcNoon(day: string): Date {
  return new Date(`${dayKey(day)}T12:00:00Z`);
}

function offsetMinutes(timeZone: string, at: Date): number {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone, hourCycle: 'h23',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    }).formatToParts(at);
    const get = (type: string) => Number(parts.find(p => p.type === type)?.value);
    const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
    return Math.round((asUtc - at.getTime()) / 60000);
  } catch {
    return 240; // Asia/Baku (UTC+4, no DST)
  }
}

/**
 * The real instant the celebration starts. Dates are stored as calendar days
 * and times as "HH:MM" wall-clock values in the wedding's time zone.
 */
export function eventInstant(day: string, time: string | null | undefined, timeZone = 'Asia/Baku'): Date {
  const [y, m, d] = dayKey(day).split('-').map(Number);
  const [h, min] = (time && /^\d{1,2}:\d{2}$/.test(time) ? time : '00:00').split(':').map(Number);
  const guess = Date.UTC(y, m - 1, d, h, min);
  return new Date(guess - offsetMinutes(timeZone, new Date(guess)) * 60000);
}

function capitalize(value: string, locale: Locale) {
  return value ? value.charAt(0).toLocaleUpperCase(intlLocale[locale]) + value.slice(1) : value;
}

export type DateParts = {
  full: string;      // 14 June 2026
  weekday: string;   // Saturday
  day: string;       // 14
  month: string;     // June (genitive where the language needs it)
  year: string;      // 2026
  numeric: string;   // 14.06.2026
};

export function formatDateParts(day: string, locale: Locale): DateParts {
  const date = utcNoon(day);
  const fmt = new Intl.DateTimeFormat(intlLocale[locale], {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  });
  const parts = fmt.formatToParts(date);
  const pick = (type: string) => parts.find(p => p.type === type)?.value ?? '';
  const [y, m, d] = dayKey(day).split('-');
  return {
    full: fmt.format(date).replace(/\s?г\.$/, ''),
    weekday: capitalize(new Intl.DateTimeFormat(intlLocale[locale], { weekday: 'long', timeZone: 'UTC' }).format(date), locale),
    day: String(Number(d)),
    month: capitalize(pick('month'), locale),
    year: y,
    numeric: `${d}.${m}.${y}`,
  };
}

/** Monday-first month grid for the wedding month; null cells are padding. */
export function monthGrid(day: string, locale: Locale) {
  const [y, m, d] = dayKey(day).split('-').map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const lead = (first.getUTCDay() + 6) % 7;
  const cells: (number | null)[] = Array.from({ length: lead }, () => null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(i);
  while (cells.length % 7) cells.push(null);

  // 2024-01-01 was a Monday.
  const weekdays = Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(intlLocale[locale], { weekday: 'short', timeZone: 'UTC' })
      .format(new Date(Date.UTC(2024, 0, 1 + i)))
      .replace('.', '')
      .slice(0, 2),
  );
  const monthTitle = capitalize(new Intl.DateTimeFormat(intlLocale[locale], {
    month: 'long', year: 'numeric', timeZone: 'UTC',
  }).format(first), locale).replace(/\s?г\.$/, '');

  return { cells, weekdays, highlighted: d, monthTitle };
}

// ---------------------------------------------------------------------------
// Calendar exports
// ---------------------------------------------------------------------------

type CalendarEvent = {
  title: string;
  description: string;
  location: string;
  day: string;
  time: string | null;
  timeZone?: string;
};

const stamp = (d: Date) => d.toISOString().replace(/-|:|\.\d+/g, '');
const compactDay = (day: string) => dayKey(day).replace(/-/g, '');
function nextDay(day: string) {
  const d = utcNoon(day);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

function range(event: CalendarEvent) {
  if (!event.time) return { allDay: true, start: compactDay(event.day), end: compactDay(nextDay(event.day)) };
  const start = eventInstant(event.day, event.time, event.timeZone);
  const end = new Date(start.getTime() + 5 * 3600_000);
  return { allDay: false, start: stamp(start), end: stamp(end) };
}

export function googleCalendarUrl(event: CalendarEvent): string {
  const { start, end } = range(event);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${start}/${end}`,
    details: event.description,
    location: event.location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

const icsText = (value: string) => value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');

export function icsFile(event: CalendarEvent): string {
  const r = range(event);
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ElarioLabs//Wedding Invitation//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${r.start}-${compactDay(event.day)}@elario-invitations`,
    `DTSTAMP:${stamp(new Date())}`,
    `SUMMARY:${icsText(event.title)}`,
    `DESCRIPTION:${icsText(event.description)}`,
    event.location ? `LOCATION:${icsText(event.location)}` : '',
    r.allDay ? `DTSTART;VALUE=DATE:${r.start}` : `DTSTART:${r.start}`,
    r.allDay ? `DTEND;VALUE=DATE:${r.end}` : `DTEND:${r.end}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n');
}
