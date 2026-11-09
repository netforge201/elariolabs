import {
  DEFAULT_VOLUME, resolveLocale, resolveMusic, resolveMusicSource, resolveTemplate,
  type Locale, type MusicChoice, type MusicSource, type TemplateId, type UploadedMusic,
} from './catalog';
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
  musicUpload?: UploadedMusic | null;
  musicVolume?: number | null;
};

/** This guest's RSVP. Present only on personal invitations where the couple switched RSVP on. */
export type GuestRsvp = {
  status: 'yes' | 'no' | null;
  guests: number | null;
  note: string | null;
};

export type GuestInfo = {
  name: string;
  slug: string;
  tableName?: string | null;
  seatNumber?: number | null;
  rsvp?: GuestRsvp | null;
  /** "male" → "… bəy", "female" → "… xanım"; null keeps the neutral greeting. */
  gender?: GuestGender;
  /** The invitation is for the guest together with their family. */
  withFamily?: boolean;
};

export type GuestGender = 'male' | 'female' | null;

/**
 * The personal greeting line, e.g. "Hörmətli Orxan bəy" / "Hörmətli Amina xanım".
 * Shared by the invitation and the dashboard preview so both always match.
 */
export function formatGreeting(name: string, gender: GuestGender | undefined, locale: Locale): string {
  const n = name.trim();
  if (locale === 'az') {
    if (gender === 'male') return `Hörmətli ${n} bəy`;
    if (gender === 'female') return `Hörmətli ${n} xanım`;
    return `${copy.az.greetingPrefix} ${n}`;
  }
  if (locale === 'ru') {
    if (gender === 'male') return `Уважаемый ${n}`;
    if (gender === 'female') return `Уважаемая ${n}`;
    return `${copy.ru.greetingPrefix} ${n}`;
  }
  return `${copy.en.greetingPrefix} ${n}`;
}

/** "Sizi (ailənizlə birlikdə) toyumuza dəvət edirik" in the invitation's language. */
export function formatInviteLine(withFamily: boolean | undefined, locale: Locale): string {
  return withFamily ? copy[locale].youAreInvitedFamily : copy[locale].youAreInvited;
}

export type InvitationModel = {
  locale: Locale;
  t: Copy;
  template: TemplateId;
  music: MusicChoice;
  /** What actually plays (null = silent). */
  musicSource: MusicSource | null;
  musicVolume: number;
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
  /** "We invite you (with your family) to our wedding" — personal guests get the family variant when set. */
  inviteLine: string;
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
  const music = resolveMusic(data.music);

  return {
    locale,
    t,
    template: resolveTemplate(data.template),
    music,
    musicSource: resolveMusicSource(music, data.musicUpload),
    musicVolume: typeof data.musicVolume === 'number' ? Math.max(0, Math.min(1, data.musicVolume)) : DEFAULT_VOLUME,
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
    greeting: guest?.name ? formatGreeting(guest.name, guest.gender, locale) : null,
    inviteLine: formatInviteLine(guest?.withFamily, locale),
    tableLabel: guest?.tableName ? formatTableLabel(guest.tableName, locale) : null,
    seatNumber: guest?.seatNumber ?? null,
  };
}
