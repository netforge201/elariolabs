import { resolveLocale, resolveMusic, resolveTemplate, type Locale, type MusicChoice, type TemplateId } from './catalog';
import { copy, formatTableLabel, type Copy } from './copy';
import { dayKey, formatDateParts, type DateParts } from './event-time';

/** Everything an invitation can display. Optional fields are hidden when empty. */
export type InvitationData = {
  slug?: string;
  partnerOne: string;
  partnerTwo: string;
  eventDate: string | null;
  eventTime: string | null;
  timezone?: string | null;
  venueName: string | null;
  venueAddress: string | null;
  welcomeText: string | null;
  story: string | null;
  locale: string;
  template: string;
  coverImage?: string | null;
  music?: string | null;
};

export type GuestInfo = {
  name: string;
  slug: string;
  tableName?: string | null;
  seatNumber?: number | null;
};

export type InvitationModel = {
  locale: Locale;
  t: Copy;
  template: TemplateId;
  music: MusicChoice;
  names: [string, string];
  initials: [string, string];
  nameSize: 'regular' | 'long' | 'xlong';
  day: string | null;
  date: DateParts | null;
  time: string | null;
  timezone: string;
  venueName: string | null;
  venueAddress: string | null;
  address: string;
  welcome: string;
  story: string | null;
  coverImage: string | null;
  slug: string | null;
  guest: GuestInfo | null;
  greeting: string | null;
  tableLabel: string | null;
  seatNumber: number | null;
};

const clean = (value: string | null | undefined) => (value && value.trim() ? value.trim() : null);

function initial(name: string) {
  return name.trim().charAt(0).toLocaleUpperCase() || '·';
}

export function buildModel(data: InvitationData, guest?: GuestInfo | null): InvitationModel {
  const locale = resolveLocale(data.locale);
  const t = copy[locale];
  const names: [string, string] = [data.partnerOne.trim(), data.partnerTwo.trim()];
  const longest = Math.max(...names.map(n => n.length));
  const day = data.eventDate && /^\d{4}-\d{2}-\d{2}/.test(data.eventDate) ? dayKey(data.eventDate) : null;
  const venueName = clean(data.venueName);
  const venueAddress = clean(data.venueAddress);

  return {
    locale,
    t,
    template: resolveTemplate(data.template),
    music: resolveMusic(data.music),
    names,
    initials: [initial(names[0]), initial(names[1])],
    nameSize: longest > 22 ? 'xlong' : longest > 13 ? 'long' : 'regular',
    day,
    date: day ? formatDateParts(day, locale) : null,
    time: clean(data.eventTime),
    timezone: clean(data.timezone) ?? 'Asia/Baku',
    venueName,
    venueAddress,
    address: [venueName, venueAddress].filter(Boolean).join(', '),
    welcome: clean(data.welcomeText) ?? t.welcomeDefault,
    story: clean(data.story),
    coverImage: clean(data.coverImage),
    slug: data.slug ?? null,
    guest: guest ?? null,
    greeting: guest?.name ? `${t.greetingPrefix} ${guest.name}` : null,
    tableLabel: guest?.tableName ? formatTableLabel(guest.tableName, locale) : null,
    seatNumber: guest?.seatNumber ?? null,
  };
}
