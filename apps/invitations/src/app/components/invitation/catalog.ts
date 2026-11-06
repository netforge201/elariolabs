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

export type TrackId = 'canon' | 'waltz' | 'evening' | 'nocturne';
export const MUSIC_NONE = 'none';
export type MusicChoice = TrackId | typeof MUSIC_NONE;

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

export const MUSIC_CHOICES: readonly string[] = [MUSIC_NONE, ...TRACKS.map(t => t.id)];

/** Invitations saved before music selection existed keep their original melody. */
export function resolveMusic(value: unknown): MusicChoice {
  if (value === MUSIC_NONE) return MUSIC_NONE;
  return TRACKS.some(t => t.id === value) ? (value as TrackId) : 'canon';
}

export function trackMeta(id: TrackId): TrackMeta {
  return TRACKS.find(t => t.id === id) ?? TRACKS[0];
}
