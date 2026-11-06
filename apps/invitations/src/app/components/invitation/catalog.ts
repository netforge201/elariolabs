// Shared, framework-free metadata for invitation templates and music.
// Safe to import from both server (API validation) and client code.

export type Locale = 'az' | 'ru' | 'en';
/**
 * Every invitation design. The first three are the original designs; the rest
 * are the Azerbaijani carpet & buta collection (see carpet-templates.tsx).
 */
export type TemplateId =
  | 'classic' | 'modern' | 'minimal'
  | 'carpet' | 'buta' | 'palace' | 'asymmetric' | 'garden' | 'heritage';
type Localized = Record<Locale, string>;

export function resolveLocale(value: string | null | undefined): Locale {
  return value === 'ru' || value === 'en' || value === 'az' ? value : 'az';
}

export const TEMPLATE_IDS: readonly TemplateId[] = [
  'classic', 'modern', 'minimal',
  'carpet', 'buta', 'palace', 'asymmetric', 'garden', 'heritage',
];

export function isTemplateId(value: unknown): value is TemplateId {
  return typeof value === 'string' && (TEMPLATE_IDS as readonly string[]).includes(value);
}

/** Legacy ids ("elegant" is the DB default) map onto the current designs. */
export function resolveTemplate(template: string | null | undefined): TemplateId {
  if (template === 'elegant') return 'modern';
  return isTemplateId(template) ? template : 'classic';
}

// ---------------------------------------------------------------------------
// Design modes
// ---------------------------------------------------------------------------

/**
 * "global": every invitation uses the wedding's template.
 * "individual": each guest's invitation uses that guest's own template.
 * The two values are stored separately (wedding.template / guest.template),
 * so switching modes never changes either of them.
 */
export type DesignMode = 'global' | 'individual';
export const DESIGN_MODES: readonly DesignMode[] = ['global', 'individual'];

export function resolveDesignMode(value: string | null | undefined): DesignMode {
  return value === 'individual' ? 'individual' : 'global';
}

/**
 * The one rule every renderer uses to pick a design.
 * - global mode → the wedding's template
 * - individual mode → the guest's template
 * - no guest (the couple's main link) or a missing/invalid guest value → the
 *   wedding's template, a safe default that always exists.
 */
export function invitationTemplate(
  wedding: { template: string | null | undefined; designMode?: string | null },
  guestTemplate?: string | null,
): TemplateId {
  const global = resolveTemplate(wedding.template);
  if (resolveDesignMode(wedding.designMode) !== 'individual') return global;
  return isTemplateId(guestTemplate) ? guestTemplate : global;
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
  // --- Azerbaijani carpet & buta collection -------------------------------
  {
    id: 'carpet',
    name: { az: 'Xalça çərçivəsi', ru: 'Ковровая рамка', en: 'Carpet Frame' },
    style: { az: 'Xalça naxışı', ru: 'Ковровый узор', en: 'Carpet border' },
    description: {
      az: 'Üç qat toxunma haşiyə, ulduzlu künclər, qarmaqlı göl medalyonları və künc yarım-gölləri — əsl xalça kimi.',
      ru: 'Три тканые каймы, звёздные углы, крючковатые медальоны-гёль и угловые четверти гёля — как настоящий ковёр.',
      en: 'Three woven borders, star corner blocks, hooked göl medallions and quarter-göl spandrels — like a real rug.',
    },
    swatches: ['#f4e9d3', '#1c2347', '#b3262e'],
    usesPhoto: 'optional',
  },
  {
    id: 'buta',
    name: { az: 'Buta zərifliyi', ru: 'Элегантная бута', en: 'Buta Elegance' },
    style: { az: 'Buta və çiçəklər', ru: 'Бута и цветы', en: 'Buta & florals' },
    description: {
      az: 'Tünd göy fonda çiçəkli buta və balalı buta, qızılı islimi budaqları ilə. Zərif, asimmetrik kompozisiya.',
      ru: 'Цветочная бута и бута «с детьми» с золотыми ветвями ислими на тёмно-синем фоне. Изящная асимметрия.',
      en: 'A floral buta and a balalı buta (with young butas) with golden islimi vines on deep navy.',
    },
    swatches: ['#131a3a', '#e9c77f', '#c0392b'],
    usesPhoto: 'optional',
  },
  {
    id: 'palace',
    name: { az: 'Şərq sarayı', ru: 'Восточный дворец', en: 'Oriental Palace' },
    style: { az: 'Tağ və xalça', ru: 'Арка и ковёр', en: 'Arch & carpet' },
    description: {
      az: 'Quba naxışlı sahədə krem rəngli şərq tağı, asma bəzək və göl medalyonları. Simmetrik və təntənəli.',
      ru: 'Кремовая восточная арка в поле кубинской решётки, подвеска и медальоны-гёль. Симметрично и торжественно.',
      en: 'A cream ogee arch in a Kuba lattice field, with a hanging pendant and göl medallions.',
    },
    swatches: ['#f6ecd8', '#a3202a', '#1f2a5a'],
    usesPhoto: 'optional',
  },
  {
    id: 'asymmetric',
    name: { az: 'Ənənəvi asimmetriya', ru: 'Традиционная асимметрия', en: 'Traditional Asymmetric' },
    style: { az: 'Cəsarətli', ru: 'Смелый', en: 'Bold' },
    description: {
      az: 'Tünd albalı fonda göl medalyonlu toxunma buta zolağı və iri çiçəkli buta. Cəsarətli kompozisiya.',
      ru: 'Тканая полоса из мелких бут с медальонами и крупная цветочная бута на тёмно-бордовом фоне.',
      en: 'A woven strip of tiny butas with göl medallions, and a large floral buta on deep burgundy.',
    },
    swatches: ['#4a0f17', '#e3bf6f', '#22306b'],
    usesPhoto: 'optional',
  },
  {
    id: 'garden',
    name: { az: 'Buta bağı', ru: 'Сад буты', en: 'Buta Garden' },
    style: { az: 'Yüngül', ru: 'Светлый', en: 'Light' },
    description: {
      az: 'Fil sümüyü fonda butalı künc budaqları, cüt buta tacı və palmet. Ənənəvi, lakin yüngül.',
      ru: 'Угловые ветви с бутами, венец из парных бут и пальметта на цвете слоновой кости. Легко и традиционно.',
      en: 'Corner sprays with butas, a buta-pair crown and a palmette crest on warm ivory. Light and airy.',
    },
    swatches: ['#fbf4e6', '#b3262e', '#1f2a5a'],
    usesPhoto: 'optional',
  },
  {
    id: 'heritage',
    name: { az: 'Azərbaycan irsi', ru: 'Азербайджанское наследие', en: 'Azerbaijani Heritage' },
    style: { az: 'Dəbdəbəli', ru: 'Роскошный', en: 'Luxurious' },
    description: {
      az: 'Şirvan qədəh haşiyəsi, ulduzlu sahə, ulduz göllü yaşıl tağ və toxunma butalar sırası.',
      ru: 'Ширванская кайма «бокал и лист», звёздное поле, зелёная арка со звёздным гёлем и ряд тканых бут.',
      en: 'A Shirvan wine-glass border, a star field and a green arch crowned by a star göl, with woven butas.',
    },
    swatches: ['#0f3326', '#d9b46a', '#b3262e'],
    usesPhoto: 'optional',
  },
];

/** Designs from the Azerbaijani carpet & buta collection. */
export const CARPET_TEMPLATES = ['carpet', 'buta', 'palace', 'asymmetric', 'garden', 'heritage'] as const;
export type CarpetTemplateId = typeof CARPET_TEMPLATES[number];
export function isCarpetTemplate(id: TemplateId): id is CarpetTemplateId {
  return (CARPET_TEMPLATES as readonly string[]).includes(id);
}

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
export type MusicChoice = TrackId | typeof MUSIC_NONE | typeof MUSIC_UPLOAD;

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

export const MUSIC_CHOICES: readonly string[] = [MUSIC_NONE, MUSIC_UPLOAD, ...TRACKS.map(t => t.id)];

/** Default for newly created invitations. */
export const DEFAULT_TRACK: TrackId = 'serenade';

/** Invitations saved before music selection existed keep their original melody. */
export function resolveMusic(value: unknown): MusicChoice {
  if (value === MUSIC_NONE || value === MUSIC_UPLOAD) return value;
  // YouTube music was offered briefly and has been removed; those invitations
  // fall back to the default built-in track.
  if (value === 'youtube') return DEFAULT_TRACK;
  return TRACKS.some(t => t.id === value) ? (value as TrackId) : 'canon';
}

// ---------------------------------------------------------------------------
// Custom music: the couple's uploaded audio file
// ---------------------------------------------------------------------------

export type UploadedMusic = { id: string; name: string; mime: string; size: number };

/** Everything music-related saved in an invitation's theme. */
export type MusicSettings = {
  music: MusicChoice;
  musicUpload: UploadedMusic | null;
  /** 0–1, applied to every source. */
  musicVolume: number;
};

export const DEFAULT_VOLUME = 0.8;
export const MAX_AUDIO_BYTES = 10 * 1024 * 1024;
export const AUDIO_ACCEPT = 'audio/*,.mp3,.m4a,.aac,.wav,.ogg,.oga,.opus,.flac,.webm';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
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
    musicVolume: volume,
  };
}

/** A playable source for the music controller. */
export type MusicSource =
  | { kind: 'track'; id: TrackId }
  | { kind: 'file'; id: string; name: string };

export function musicSourceKey(source: MusicSource): string {
  if (source.kind === 'track') return `track:${source.id}`;
  return `file:${source.id}`;
}

export function musicFileUrl(id: string) {
  return `/api/music/file/${id}`;
}

/** The source that actually plays for a choice, or null for silence. */
export function resolveMusicSource(
  choice: MusicChoice,
  upload: UploadedMusic | null | undefined,
): MusicSource | null {
  if (choice === MUSIC_NONE) return null;
  if (choice === MUSIC_UPLOAD) return upload ? { kind: 'file', id: upload.id, name: upload.name } : null;
  return { kind: 'track', id: choice };
}

/** File name without its extension, for display. */
export function displayName(filename: string) {
  return filename.replace(/\.[a-z0-9]{2,5}$/i, '') || filename;
}
