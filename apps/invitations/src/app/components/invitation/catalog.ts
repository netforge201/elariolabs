// Shared, framework-free metadata for invitation templates and music.
// Safe to import from both server (API validation) and client code.

export type Locale = 'az' | 'ru' | 'en';
export type TemplateId = 'classic' | 'modern' | 'minimal';
type Localized = Record<Locale, string>;

export function resolveLocale(value: string | null | undefined): Locale {
  return value === 'ru' || value === 'en' || value === 'az' ? value : 'az';
}

/** Legacy ids ("elegant" is the DB default) map onto the current designs. */
export function resolveTemplate(template: string | null | undefined): TemplateId {
  if (template === 'modern' || template === 'elegant') return 'modern';
  if (template === 'minimal') return 'minimal';
  return 'classic';
}

export type TemplateMeta = {
  id: TemplateId;
  name: Localized;
  style: Localized;
  description: Localized;
  /** Paper, ink and accent — used for the swatch row in the template picker. */
  swatches: [string, string, string];
  usesPhoto: 'hero' | 'optional';
};

export const TEMPLATES: TemplateMeta[] = [
  {
    id: 'classic',
    name: { az: 'Fil sümüyü', ru: 'Слоновая кость', en: 'Ivory' },
    style: { az: 'Klassik', ru: 'Классика', en: 'Classic' },
    description: {
      az: 'Zərfdə gələn kağız dəvətnamə: şampan qızılı, monoqram möhürü və incə çiçək naxışları.',
      ru: 'Бумажное приглашение в конверте: шампань, сургучная печать с монограммой и нежная флористика.',
      en: 'A paper invitation that arrives in an envelope: champagne gold, a monogram wax seal and soft florals.',
    },
    swatches: ['#fbf6ec', '#3d3128', '#a8834a'],
    usesPhoto: 'optional',
  },
  {
    id: 'modern',
    name: { az: 'Kino', ru: 'Синема', en: 'Cinema' },
    style: { az: 'Müasir', ru: 'Современный', en: 'Modern' },
    description: {
      az: 'Tam ekran foto, kinematik açılış və iri redaksiya tipoqrafiyası. Cütlük şəkli ilə ən yaxşı görünür.',
      ru: 'Фото на весь экран, кинематографичное открытие и крупная редакционная типографика. Лучше всего с фото пары.',
      en: 'Full-bleed photography, a cinematic opening and bold editorial type. Best with a photo of the couple.',
    },
    swatches: ['#121014', '#f4ede2', '#d6b47a'],
    usesPhoto: 'hero',
  },
  {
    id: 'minimal',
    name: { az: 'Kətan', ru: 'Лён', en: 'Linen' },
    style: { az: 'Minimalist', ru: 'Минимализм', en: 'Minimal' },
    description: {
      az: 'Kətan tonları, adaçayı yaşılı və əl ilə çəkilmiş botanik xətt. Sakit, redaksiya üslubunda kompozisiya.',
      ru: 'Льняные тона, шалфей и рисованная ботаническая линия. Спокойная редакционная композиция.',
      en: 'Linen tones, sage ink and a hand-drawn botanical line. A calm, editorial composition.',
    },
    swatches: ['#f1ede4', '#2d302a', '#66745a'],
    usesPhoto: 'optional',
  },
];

export function templateMeta(id: string | null | undefined): TemplateMeta {
  const resolved = resolveTemplate(id);
  return TEMPLATES.find(t => t.id === resolved) ?? TEMPLATES[0];
}

// ---------------------------------------------------------------------------
// Music
// ---------------------------------------------------------------------------

export type TrackId = 'serenade' | 'promise' | 'memories' | 'wishes' | 'canon' | 'waltz' | 'evening' | 'nocturne';
export const MUSIC_NONE = 'none';
/** The couple's own audio file (stored server-side, see /api/music). */
export const MUSIC_UPLOAD = 'upload';
/** A YouTube video, played through YouTube's embedded player. */
export const MUSIC_YOUTUBE = 'youtube';
export type MusicChoice = TrackId | typeof MUSIC_NONE | typeof MUSIC_UPLOAD | typeof MUSIC_YOUTUBE;

export type TrackMeta = {
  id: TrackId;
  title: Localized;
  mood: Localized;
  note: Localized;
};

/**
 * Every track is an original arrangement rendered live in the browser with the
 * Web Audio API — no audio files are downloaded and there is nothing to license.
 * "Canon" uses Pachelbel's (public-domain) chord progression; it is the melody
 * that invitations played before music selection existed, so it stays default.
 */
export const TRACKS: TrackMeta[] = [
  // Original compositions in 6/8 (compound duple: two dotted-quarter beats per
  // bar), one for each kind of celebration. See compositions-6-8.ts.
  {
    id: 'serenade',
    title: { az: 'Serenada', ru: 'Серенада', en: 'Serenade' },
    mood: { az: 'Toy · fortepiano və simlilər · 6/8', ru: 'Свадьба · фортепиано и струнные · 6/8', en: 'Wedding · piano & strings · 6/8' },
    note: {
      az: 'Orijinal kompozisiya · Mi-bemol major',
      ru: 'Оригинальная композиция · ми-бемоль мажор',
      en: 'Original composition · E♭ major',
    },
  },
  {
    id: 'promise',
    title: { az: 'Əhd', ru: 'Обещание', en: 'The Promise' },
    mood: { az: 'Nişan · arfa və fortepiano · 6/8', ru: 'Помолвка · арфа и фортепиано · 6/8', en: 'Engagement · harp & piano · 6/8' },
    note: {
      az: 'Orijinal kompozisiya · Sol major',
      ru: 'Оригинальная композиция · соль мажор',
      en: 'Original composition · G major',
    },
  },
  {
    id: 'memories',
    title: { az: 'Xatirələr', ru: 'Воспоминания', en: 'Memories' },
    mood: { az: 'İldönümü · violonçel və fortepiano · 6/8', ru: 'Годовщина · виолончель и фортепиано · 6/8', en: 'Anniversary · cello & piano · 6/8' },
    note: {
      az: 'Orijinal kompozisiya · Re minor',
      ru: 'Оригинальная композиция · ре минор',
      en: 'Original composition · D minor',
    },
  },
  {
    id: 'wishes',
    title: { az: 'Arzular', ru: 'Пожелания', en: 'Wishes' },
    mood: { az: 'Ad günü · fortepiano və çelesta · 6/8', ru: 'День рождения · фортепиано и челеста · 6/8', en: 'Birthday · piano & celesta · 6/8' },
    note: {
      az: 'Orijinal kompozisiya · Re major',
      ru: 'Оригинальная композиция · ре мажор',
      en: 'Original composition · D major',
    },
  },
  {
    id: 'canon',
    title: { az: 'Kanon', ru: 'Канон', en: 'Canon' },
    mood: { az: 'Romantik · arfa', ru: 'Романтичная · арфа', en: 'Romantic · harp' },
    note: {
      az: 'Pakhelbelin akkord ardıcıllığı əsasında (ictimai mülkiyyət)',
      ru: 'По гармонии Пахельбеля (общественное достояние)',
      en: "On Pachelbel's chord progression (public domain)",
    },
  },
  {
    id: 'waltz',
    title: { az: 'İlk rəqs', ru: 'Первый танец', en: 'First Dance' },
    mood: { az: 'Vals · 3/4', ru: 'Вальс · 3/4', en: 'Waltz · 3/4' },
    note: { az: 'Orijinal kompozisiya', ru: 'Оригинальная композиция', en: 'Original composition' },
  },
  {
    id: 'evening',
    title: { az: 'Axşam işığı', ru: 'Вечерний свет', en: 'Evening Light' },
    mood: { az: 'Sakit · ambient', ru: 'Спокойная · эмбиент', en: 'Calm · ambient' },
    note: { az: 'Orijinal kompozisiya', ru: 'Оригинальная композиция', en: 'Original composition' },
  },
  {
    id: 'nocturne',
    title: { az: 'Noktürn', ru: 'Ноктюрн', en: 'Nocturne' },
    mood: { az: 'Zərif · fortepiano', ru: 'Нежная · фортепиано', en: 'Tender · piano' },
    note: { az: 'Orijinal kompozisiya', ru: 'Оригинальная композиция', en: 'Original composition' },
  },
];

export const MUSIC_CHOICES: readonly string[] = [MUSIC_NONE, MUSIC_UPLOAD, MUSIC_YOUTUBE, ...TRACKS.map(t => t.id)];

/** Default for newly created invitations. */
export const DEFAULT_TRACK: TrackId = 'serenade';

/** Invitations saved before music selection existed keep their original melody. */
export function resolveMusic(value: unknown): MusicChoice {
  if (value === MUSIC_NONE || value === MUSIC_UPLOAD || value === MUSIC_YOUTUBE) return value;
  return TRACKS.some(t => t.id === value) ? (value as TrackId) : 'canon';
}

// ---------------------------------------------------------------------------
// Custom music: uploaded files and YouTube videos
// ---------------------------------------------------------------------------

export type UploadedMusic = { id: string; name: string; mime: string; size: number };
export type YoutubeMusic = { videoId: string; title: string | null; author: string | null };

/** Everything music-related saved in an invitation's theme. */
export type MusicSettings = {
  music: MusicChoice;
  musicUpload: UploadedMusic | null;
  musicYoutube: YoutubeMusic | null;
  /** 0–1, applied to every source. */
  musicVolume: number;
};

export const DEFAULT_VOLUME = 0.8;
export const MAX_AUDIO_BYTES = 10 * 1024 * 1024;
export const AUDIO_ACCEPT = 'audio/*,.mp3,.m4a,.aac,.wav,.ogg,.oga,.opus,.flac,.webm';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const YT_ID = /^[A-Za-z0-9_-]{11}$/;
const str = (value: unknown, max: number) => (typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : null);

function readUpload(value: unknown): UploadedMusic | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  if (typeof v.id !== 'string' || !UUID.test(v.id)) return null;
  return {
    id: v.id,
    name: str(v.name, 240) ?? 'audio',
    mime: str(v.mime, 60) ?? 'audio/mpeg',
    size: typeof v.size === 'number' && v.size > 0 ? v.size : 0,
  };
}

function readYoutube(value: unknown): YoutubeMusic | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  if (typeof v.videoId !== 'string' || !YT_ID.test(v.videoId)) return null;
  return { videoId: v.videoId, title: str(v.title, 300), author: str(v.author, 200) };
}

/**
 * Reads the music settings out of a stored theme object. Invitations that never
 * had custom music behave exactly as before (legacy ones keep "canon").
 */
export function readMusicSettings(theme: Record<string, unknown> | null | undefined): Omit<MusicSettings, 'music'> & { music: string | null } {
  const t = theme ?? {};
  const volume = typeof t.musicVolume === 'number' && t.musicVolume >= 0 && t.musicVolume <= 1 ? t.musicVolume : DEFAULT_VOLUME;
  return {
    music: typeof t.music === 'string' ? t.music : null,
    musicUpload: readUpload(t.musicUpload),
    musicYoutube: readYoutube(t.musicYoutube),
    musicVolume: volume,
  };
}

/** A playable source for the music controller. */
export type MusicSource =
  | { kind: 'track'; id: TrackId }
  | { kind: 'file'; id: string; name: string }
  | { kind: 'youtube'; videoId: string; title: string | null };

export function musicSourceKey(source: MusicSource): string {
  if (source.kind === 'track') return `track:${source.id}`;
  if (source.kind === 'file') return `file:${source.id}`;
  return `youtube:${source.videoId}`;
}

export function musicFileUrl(id: string) {
  return `/api/music/file/${id}`;
}

export function youtubeThumbnail(videoId: string) {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

/** The source that actually plays for a choice, or null for silence. */
export function resolveMusicSource(
  choice: MusicChoice,
  upload: UploadedMusic | null | undefined,
  youtube: YoutubeMusic | null | undefined,
): MusicSource | null {
  if (choice === MUSIC_NONE) return null;
  if (choice === MUSIC_UPLOAD) return upload ? { kind: 'file', id: upload.id, name: upload.name } : null;
  if (choice === MUSIC_YOUTUBE) return youtube ? { kind: 'youtube', videoId: youtube.videoId, title: youtube.title } : null;
  return { kind: 'track', id: choice };
}

/** File name without its extension, for display. */
export function displayName(filename: string) {
  return filename.replace(/\.[a-z0-9]{2,5}$/i, '') || filename;
}

/**
 * Extracts the video id from the YouTube link formats people paste:
 * watch?v=, youtu.be/, /shorts/, /embed/, /live/, music.youtube.com, the
 * mobile site and youtube-nocookie.com — with any extra query parameters.
 * Returns null for anything else (other sites, playlists without a video, …).
 */
export function parseYouTubeId(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  if (YT_ID.test(raw)) return raw;
  let url: URL;
  try {
    url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  let id: string | null = null;
  if (host === 'youtu.be') {
    id = url.pathname.split('/')[1] ?? null;
  } else if (['youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtube-nocookie.com'].includes(host)) {
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts[0] === 'watch') id = url.searchParams.get('v');
    else if (['shorts', 'embed', 'live', 'v', 'e'].includes(parts[0])) id = parts[1] ?? null;
  }
  return id && YT_ID.test(id) ? id : null;
}

export function trackMeta(id: TrackId): TrackMeta {
  return TRACKS.find(t => t.id === id) ?? TRACKS[0];
}
