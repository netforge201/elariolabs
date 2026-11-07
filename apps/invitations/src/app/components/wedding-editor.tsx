'use client';

import './studio.css';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeftIcon, ArrowUpRightIcon, CheckIcon, CopyIcon, DesktopIcon, MobileIcon, MusicIcon, PauseIcon, PhotoIcon, PlayIcon, UploadIcon,
} from './icons';
import InvitationView, { type InvitationData } from './invitation/invitation-view';
import {
  AUDIO_ACCEPT, DEFAULT_TRACK, DEFAULT_VOLUME, MAX_AUDIO_BYTES, MUSIC_NONE, MUSIC_UPLOAD, TEMPLATES, TRACKS,
  displayName, musicSourceKey, resolveDesignMode, resolveMusic, resolveTemplate, templateMeta,
  type DesignMode, type Locale, type MusicChoice, type MusicSource, type TemplateId, type TrackId, type UploadedMusic,
} from './invitation/catalog';
import { copy as invitationCopy } from './invitation/copy';
import { music, useFileProgress, useMusicSnapshot } from './invitation/music-engine';

type Wedding = {
  id: string;
  slug: string;
  partnerOne: string;
  partnerTwo: string;
  eventDate: string | null;
  eventTime: string | null;
  venueName: string | null;
  venueAddress: string | null;
  welcomeText: string | null;
  story: string | null;
  locale: string;
  template: string;
  designMode?: string;
  timezone?: string;
  coverImage?: string | null;
  music?: string | null;
  musicUpload?: UploadedMusic | null;
  musicVolume?: number | null;
  isPublished: boolean;
};

type Guest = { id: string; name: string; slug: string; template?: string; createdAt: string };

type FormState = {
  partnerOne: string;
  partnerTwo: string;
  eventDate: string;
  eventTime: string;
  venueName: string;
  venueAddress: string;
  welcomeText: string;
  story: string;
  locale: Locale;
  template: TemplateId;
  /** Stored separately from guests' own designs; switching never changes them. */
  designMode: DesignMode;
  coverImage: string | null;
  music: MusicChoice;
  /** Kept even while a built-in track is selected, so switching back is instant. */
  musicUpload: UploadedMusic | null;
  musicVolume: number;
};

type Step = 'details' | 'content' | 'design' | 'music';
type Device = 'mobile' | 'desktop';

const dict = {
  en: {
    studio: 'Invitation studio', back: 'Dashboard', untitled: 'Your invitation',
    save: 'Save', saving: 'Saving…', saved: 'Saved', unsaved: 'Unsaved changes', savedMsg: 'Changes saved',
    error: 'Could not save changes', publish: 'Publish', unpublish: 'Unpublish', published: 'Published', draft: 'Draft',
    publishedMsg: 'Your invitation is live', unpublishedMsg: 'Invitation unpublished',
    steps: { details: 'Details', content: 'Words & photo', design: 'Design', music: 'Music' },
    names: 'The couple', first: 'First partner', second: 'Second partner',
    when: 'Date & time', date: 'Wedding date', time: 'Start time',
    where: 'Venue', venueName: 'Venue name', address: 'Address', addressHint: 'Guests can open it in maps or copy it.',
    language: 'Invitation language', languageHint: 'All invitation text, dates and buttons use this language.',
    languages: { az: 'Azerbaijani', ru: 'Russian', en: 'English' },
    welcome: 'Welcome message', welcomeHint: 'Leave empty to use the default text shown in the preview.',
    story: 'Your story', storyHint: 'Optional. Appears as its own section — line breaks are kept.',
    photo: 'Couple photo', photoHint: 'Use a vertical (portrait) photo. Cinema shows it full-screen on phones and as a portrait panel on wide screens; Ivory and Linen show it as a portrait.',
    upload: 'Upload a photo', uploadSub: 'JPG, PNG or WebP · resized automatically', replace: 'Replace', remove: 'Remove',
    photoUrl: 'Or paste an image link', photoError: 'Please choose an image file.',
    designTitle: 'Choose a design', designHint: 'Each design has its own opening, typography and palette. Thumbnails use your details.',
    selected: 'Selected', withPhoto: 'Best with a photo',
    musicTitle: 'Background music', musicHint: 'Music starts when a guest taps to open the invitation — browsers never allow sound before that tap. Guests can pause it at any time.',
    noMusic: 'No music', noMusicSub: 'The invitation opens silently',
    listen: 'Listen', stop: 'Stop', musicSource: 'All tracks are generated in the browser — no files, nothing to license.',
    tabBuiltin: 'Built-in', tabUpload: 'Your file', musicSourceLabel: 'Music source',
    activeNow: 'On the invitation:', activeNone: 'No music',
    audioUpload: 'Upload an audio file', audioUploadSub: 'MP3, M4A, AAC, WAV or OGG · up to 10 MB',
    uploading: 'Uploading…', uploadedOk: 'Uploaded. Save to put it on your invitation.',
    audioErr: {
      type: 'This file is not a supported audio format. Use MP3, M4A, AAC, WAV or OGG.',
      size: 'The file is larger than 10 MB. Please choose a shorter or more compressed file.',
      auth: 'Your session has expired. Please sign in again.',
      failed: 'Upload failed. Check your connection and try again.',
    },
    safariWarn: 'OGG, WebM and FLAC do not play on iPhone or Safari. MP3 or M4A works everywhere.',
    uploadMissing: 'That music file is no longer available, so your saved music was restored. Check the Music step and save again.',
    fileGone: 'This file could not be loaded. Please upload it again.',
    useThis: 'Use this music', inUse: 'In use', removeMusic: 'Remove', seek: 'Playback position',
    volume: 'Volume',
    preview: 'Live preview', mobile: 'Phone', desktop: 'Desktop', replay: 'Replay opening',
    sample: 'Sample names shown until you enter yours.',
    required: 'Enter both names before saving.',
    readyTitle: 'Ready to publish', missingTitle: 'To publish, add:',
    missing: { names: 'both names', date: 'date', time: 'start time', venue: 'venue name' },
    link: 'Invitation link', copy: 'Copy link', copied: 'Link copied', open: 'Open',
    notLive: 'Not visible to guests until published.',
    edit: 'Edit', show: 'Preview',
    leave: 'You have unsaved changes.',
  },
  ru: {
    studio: 'Студия приглашений', back: 'Кабинет', untitled: 'Ваше приглашение',
    save: 'Сохранить', saving: 'Сохранение…', saved: 'Сохранено', unsaved: 'Есть изменения', savedMsg: 'Изменения сохранены',
    error: 'Не удалось сохранить изменения', publish: 'Опубликовать', unpublish: 'Снять с публикации', published: 'Опубликовано', draft: 'Черновик',
    publishedMsg: 'Приглашение опубликовано', unpublishedMsg: 'Приглашение снято с публикации',
    steps: { details: 'Детали', content: 'Текст и фото', design: 'Дизайн', music: 'Музыка' },
    names: 'Пара', first: 'Первый партнёр', second: 'Второй партнёр',
    when: 'Дата и время', date: 'Дата свадьбы', time: 'Время начала',
    where: 'Место', venueName: 'Название площадки', address: 'Адрес', addressHint: 'Гости смогут открыть его на карте или скопировать.',
    language: 'Язык приглашения', languageHint: 'Весь текст, даты и кнопки приглашения будут на этом языке.',
    languages: { az: 'Азербайджанский', ru: 'Русский', en: 'Английский' },
    welcome: 'Приветствие', welcomeHint: 'Оставьте пустым, чтобы использовать текст по умолчанию из предпросмотра.',
    story: 'Ваша история', storyHint: 'Необязательно. Появится отдельным разделом, переносы строк сохраняются.',
    photo: 'Фото пары', photoHint: 'Используйте вертикальное фото. В «Синема» оно на весь экран телефона и вертикальной панелью на широких экранах; в «Слоновой кости» и «Льне» — портретом.',
    upload: 'Загрузить фото', uploadSub: 'JPG, PNG или WebP · размер оптимизируется', replace: 'Заменить', remove: 'Удалить',
    photoUrl: 'Или вставьте ссылку на изображение', photoError: 'Выберите файл изображения.',
    designTitle: 'Выберите дизайн', designHint: 'У каждого дизайна своё открытие, типографика и палитра. Миниатюры показывают ваши данные.',
    selected: 'Выбрано', withPhoto: 'Лучше с фото',
    musicTitle: 'Фоновая музыка', musicHint: 'Музыка включается, когда гость нажимает «Открыть приглашение» — браузеры не разрешают звук до этого нажатия. Гость может выключить её в любой момент.',
    noMusic: 'Без музыки', noMusicSub: 'Приглашение откроется в тишине',
    listen: 'Слушать', stop: 'Стоп', musicSource: 'Все мелодии создаются прямо в браузере — без файлов и лицензий.',
    tabBuiltin: 'Готовые', tabUpload: 'Свой файл', musicSourceLabel: 'Источник музыки',
    activeNow: 'В приглашении:', activeNone: 'Без музыки',
    audioUpload: 'Загрузите аудиофайл', audioUploadSub: 'MP3, M4A, AAC, WAV или OGG · до 10 МБ',
    uploading: 'Загрузка…', uploadedOk: 'Загружено. Сохраните, чтобы музыка появилась в приглашении.',
    audioErr: {
      type: 'Этот формат не поддерживается. Используйте MP3, M4A, AAC, WAV или OGG.',
      size: 'Файл больше 10 МБ. Выберите более короткий или сжатый файл.',
      auth: 'Сессия истекла. Войдите снова.',
      failed: 'Не удалось загрузить. Проверьте соединение и попробуйте ещё раз.',
    },
    safariWarn: 'OGG, WebM и FLAC не воспроизводятся на iPhone и в Safari. MP3 или M4A работают везде.',
    uploadMissing: 'Этот аудиофайл больше недоступен, поэтому восстановлена сохранённая музыка. Проверьте раздел «Музыка» и сохраните снова.',
    fileGone: 'Не удалось загрузить этот файл. Загрузите его ещё раз.',
    useThis: 'Выбрать эту музыку', inUse: 'Выбрано', removeMusic: 'Удалить', seek: 'Позиция воспроизведения',
    volume: 'Громкость',
    preview: 'Предпросмотр', mobile: 'Телефон', desktop: 'Компьютер', replay: 'Повторить открытие',
    sample: 'Пока вы не ввели имена, показаны примерные.',
    required: 'Введите оба имени.',
    readyTitle: 'Готово к публикации', missingTitle: 'Для публикации добавьте:',
    missing: { names: 'оба имени', date: 'дату', time: 'время начала', venue: 'название площадки' },
    link: 'Ссылка на приглашение', copy: 'Копировать', copied: 'Ссылка скопирована', open: 'Открыть',
    notLive: 'Гости не увидят приглашение до публикации.',
    edit: 'Редактор', show: 'Просмотр',
    leave: 'Есть несохранённые изменения.',
  },
  az: {
    studio: 'Dəvətnamə studiyası', back: 'Kabinet', untitled: 'Dəvətnaməniz',
    save: 'Yadda saxla', saving: 'Saxlanılır…', saved: 'Saxlanılıb', unsaved: 'Dəyişikliklər var', savedMsg: 'Dəyişikliklər saxlanıldı',
    error: 'Saxlamaq mümkün olmadı', publish: 'Dərc et', unpublish: 'Dərcdən götür', published: 'Dərc edilib', draft: 'Qaralama',
    publishedMsg: 'Dəvətnamə dərc edildi', unpublishedMsg: 'Dəvətnamə dərcdən götürüldü',
    steps: { details: 'Məlumatlar', content: 'Mətn və foto', design: 'Dizayn', music: 'Musiqi' },
    names: 'Cütlük', first: 'Birinci tərəf', second: 'İkinci tərəf',
    when: 'Tarix və saat', date: 'Toy tarixi', time: 'Başlama vaxtı',
    where: 'Məkan', venueName: 'Məkanın adı', address: 'Ünvan', addressHint: 'Qonaqlar onu xəritədə aça və ya kopyalaya bilər.',
    language: 'Dəvətnamənin dili', languageHint: 'Dəvətnamənin bütün mətni, tarixləri və düymələri bu dildə olacaq.',
    languages: { az: 'Azərbaycan dili', ru: 'Rus dili', en: 'İngilis dili' },
    welcome: 'Salamlama mətni', welcomeHint: 'Boş saxlasanız, önbaxışdakı standart mətn istifadə olunacaq.',
    story: 'Sizin hekayəniz', storyHint: 'İstəyə bağlı. Ayrıca bölmə kimi görünür, sətir keçidləri saxlanılır.',
    photo: 'Cütlüyün şəkli', photoHint: 'Şaquli (portret) şəkil istifadə edin. «Kino»da telefonda tam ekran, geniş ekranda şaquli panel kimi; «Fil sümüyü» və «Kətan»da portret kimi göstərilir.',
    upload: 'Şəkil yükləyin', uploadSub: 'JPG, PNG və ya WebP · ölçü avtomatik optimallaşdırılır', replace: 'Dəyiş', remove: 'Sil',
    photoUrl: 'Və ya şəkil linkini yapışdırın', photoError: 'Şəkil faylı seçin.',
    designTitle: 'Dizayn seçin', designHint: 'Hər dizaynın öz açılışı, tipoqrafiyası və rəngləri var. Miniatürlər sizin məlumatlarınızla göstərilir.',
    selected: 'Seçilib', withPhoto: 'Şəkillə daha gözəl',
    musicTitle: 'Fon musiqisi', musicHint: 'Musiqi qonaq «Dəvətnaməni açın» düyməsinə toxunanda başlayır — brauzerlər bu toxunuşdan əvvəl səsə icazə vermir. Qonaq istənilən an onu dayandıra bilər.',
    noMusic: 'Musiqisiz', noMusicSub: 'Dəvətnamə səssiz açılır',
    listen: 'Dinlə', stop: 'Dayandır', musicSource: 'Bütün melodiyalar birbaşa brauzerdə yaradılır — fayl və lisenziya tələb olunmur.',
    tabBuiltin: 'Hazır', tabUpload: 'Öz faylınız', musicSourceLabel: 'Musiqi mənbəyi',
    activeNow: 'Dəvətnamədə:', activeNone: 'Musiqisiz',
    audioUpload: 'Audio fayl yükləyin', audioUploadSub: 'MP3, M4A, AAC, WAV və ya OGG · 10 MB-a qədər',
    uploading: 'Yüklənir…', uploadedOk: 'Yükləndi. Dəvətnamədə görünməsi üçün yadda saxlayın.',
    audioErr: {
      type: 'Bu fayl dəstəklənən audio format deyil. MP3, M4A, AAC, WAV və ya OGG istifadə edin.',
      size: 'Fayl 10 MB-dan böyükdür. Daha qısa və ya sıxılmış fayl seçin.',
      auth: 'Sessiyanın vaxtı bitib. Yenidən daxil olun.',
      failed: 'Yükləmək alınmadı. Bağlantını yoxlayıb yenidən cəhd edin.',
    },
    safariWarn: 'OGG, WebM və FLAC iPhone və Safari-də oynamır. MP3 və ya M4A hər yerdə işləyir.',
    uploadMissing: 'Bu musiqi faylı artıq mövcud deyil, ona görə yadda saxlanmış musiqi bərpa olundu. «Musiqi» bölməsini yoxlayıb yenidən yadda saxlayın.',
    fileGone: 'Bu faylı yükləmək alınmadı. Onu yenidən yükləyin.',
    useThis: 'Bu musiqini seç', inUse: 'Seçilib', removeMusic: 'Sil', seek: 'Oxutma mövqeyi',
    volume: 'Səs səviyyəsi',
    preview: 'Canlı önbaxış', mobile: 'Telefon', desktop: 'Kompüter', replay: 'Açılışı təkrarla',
    sample: 'Adları daxil edənə qədər nümunə adlar göstərilir.',
    required: 'Hər iki adı daxil edin.',
    readyTitle: 'Dərc etməyə hazırdır', missingTitle: 'Dərc etmək üçün əlavə edin:',
    missing: { names: 'hər iki ad', date: 'tarix', time: 'başlama vaxtı', venue: 'məkanın adı' },
    link: 'Dəvətnamə keçidi', copy: 'Kopyala', copied: 'Keçid kopyalandı', open: 'Aç',
    notLive: 'Dərc edilənə qədər qonaqlar görmür.',
    edit: 'Redaktə', show: 'Önbaxış',
    leave: 'Saxlanılmamış dəyişikliklər var.',
  },
};

const guestDict = {
  en: {
    title: 'Personal invitations', sub: 'A unique link for each guest or family — it greets them by name and shows their table.',
    placeholder: 'e.g. The Aliyev family', create: 'Create link', created: 'Personal link created', copied: 'Link copied',
    copy: 'Copy', remove: 'Delete', confirm: 'Delete this invitation?', empty: 'No personal invitations yet.',
    importTitle: 'Bulk import', importSub: 'CSV, Excel, Word, TXT or PDF · up to 10 MB', choose: 'Choose file', processing: 'Processing…',
    found: (n: number) => `Found ${n} names. Review the list before importing.`, detected: (n: number) => `Detected: ${n}`,
    clear: 'Clear', confirmImport: 'Confirm import',
    imported: (a: number, b: number) => `Imported: ${a}. Duplicates skipped: ${b}.`, guestName: 'Guest name',
    search: 'Search guests…', noMatch: 'No guests match your search.', share: 'Send', copiedShort: 'Copied',
    shareText: (name: string) => `${name}, here is your personal invitation:`,
  },
  ru: {
    title: 'Именные приглашения', sub: 'Отдельная ссылка для каждого гостя или семьи — с обращением по имени и номером стола.',
    placeholder: 'Например: Семья Алиевых', create: 'Создать ссылку', created: 'Персональная ссылка создана', copied: 'Ссылка скопирована',
    copy: 'Копировать', remove: 'Удалить', confirm: 'Удалить это приглашение?', empty: 'Пока нет именных приглашений.',
    importTitle: 'Массовый импорт', importSub: 'CSV, Excel, Word, TXT или PDF · до 10 МБ', choose: 'Выбрать файл', processing: 'Обработка…',
    found: (n: number) => `Распознано имён: ${n}. Проверьте список перед импортом.`, detected: (n: number) => `Распознано: ${n}`,
    clear: 'Очистить', confirmImport: 'Подтвердить импорт',
    imported: (a: number, b: number) => `Импортировано: ${a}. Пропущено дубликатов: ${b}.`, guestName: 'Имя гостя',
    search: 'Поиск гостя…', noMatch: 'Никого не найдено.', share: 'Отправить', copiedShort: 'Скопировано',
    shareText: (name: string) => `${name}, ваше персональное приглашение:`,
  },
  az: {
    title: 'Adlı dəvətnamələr', sub: 'Hər qonaq və ya ailə üçün ayrıca keçid — adla müraciət və masa nömrəsi ilə.',
    placeholder: 'Məsələn: Əliyevlər ailəsi', create: 'Keçid yarat', created: 'Şəxsi keçid yaradıldı', copied: 'Keçid kopyalandı',
    copy: 'Kopyala', remove: 'Sil', confirm: 'Bu dəvətnamə silinsin?', empty: 'Hələ adlı dəvətnamə yoxdur.',
    importTitle: 'Kütləvi idxal', importSub: 'CSV, Excel, Word, TXT və ya PDF · maksimum 10 MB', choose: 'Fayl seç', processing: 'Emal edilir…',
    found: (n: number) => `Tapılan adlar: ${n}. İdxaldan əvvəl siyahını yoxlayın.`, detected: (n: number) => `Tapılan: ${n}`,
    clear: 'Təmizlə', confirmImport: 'İdxalı təsdiqlə',
    imported: (a: number, b: number) => `İdxal edildi: ${a}. Təkrar olduğu üçün buraxıldı: ${b}.`, guestName: 'Qonağın adı',
    search: 'Qonaq axtar…', noMatch: 'Heç kim tapılmadı.', share: 'Göndər', copiedShort: 'Kopyalandı',
    shareText: (name: string) => `${name}, sizin şəxsi dəvətnaməniz:`,
  },
};

const designModeDict = {
  en: {
    label: 'Design mode', global: 'One design for all', individual: 'Design per guest',
    globalActive: (name: string) => `Global design is on: every invitation uses ${name}.`,
    individualActive: 'Individual designs are on: each personal invitation uses the design assigned to that guest below.',
    keptNote: 'Guests\u2019 own designs stay saved while the global design is on.',
    defaultNote: 'The design selected here is used for the main invitation link and as the starting design for new guests.',
    globalPicker: 'Design for all guests', defaultPicker: 'Main link & new guests',
    guestDesign: 'Design', usesGlobal: (name: string) => `Global: ${name}`,
    savedHint: 'Saved for individual mode',
    saveMode: 'Save to apply the design mode to guest links.',
    updated: (guest: string, name: string) => `${guest}: ${name}`,
  },
  ru: {
    label: 'Режим дизайна', global: 'Один дизайн для всех', individual: 'Дизайн для каждого гостя',
    globalActive: (name: string) => `Включён общий дизайн: все приглашения используют «${name}».`,
    individualActive: 'Включены индивидуальные дизайны: каждое именное приглашение использует дизайн, назначенный гостю ниже.',
    keptNote: 'Индивидуальные дизайны гостей сохраняются, пока включён общий дизайн.',
    defaultNote: 'Выбранный здесь дизайн используется для основной ссылки и как начальный для новых гостей.',
    globalPicker: 'Дизайн для всех гостей', defaultPicker: 'Основная ссылка и новые гости',
    guestDesign: 'Дизайн', usesGlobal: (name: string) => `Общий: ${name}`,
    savedHint: 'Сохранён для индивидуального режима',
    saveMode: 'Сохраните, чтобы режим дизайна применился к ссылкам гостей.',
    updated: (guest: string, name: string) => `${guest}: ${name}`,
  },
  az: {
    label: 'Dizayn rejimi', global: 'Hamı üçün bir dizayn', individual: 'Hər qonağa öz dizaynı',
    globalActive: (name: string) => `Ümumi dizayn aktivdir: bütün dəvətnamələr «${name}» dizaynındadır.`,
    individualActive: 'Fərdi dizaynlar aktivdir: hər adlı dəvətnamə aşağıda həmin qonağa təyin edilmiş dizaynı istifadə edir.',
    keptNote: 'Ümumi dizayn aktiv olduqda qonaqların fərdi dizaynları saxlanılır.',
    defaultNote: 'Burada seçilən dizayn əsas keçid üçün və yeni qonaqların ilkin dizaynı kimi istifadə olunur.',
    globalPicker: 'Bütün qonaqlar üçün dizayn', defaultPicker: 'Əsas keçid və yeni qonaqlar',
    guestDesign: 'Dizayn', usesGlobal: (name: string) => `Ümumi: ${name}`,
    savedHint: 'Fərdi rejim üçün saxlanılıb',
    saveMode: 'Dizayn rejiminin qonaq keçidlərinə tətbiqi üçün yadda saxlayın.',
    updated: (guest: string, name: string) => `${guest}: ${name}`,
  },
};

const SAMPLE_NAMES: Record<Locale, [string, string]> = {
  az: ['Leyla', 'Elvin'],
  ru: ['Анна', 'Михаил'],
  en: ['Emma', 'James'],
};

const DEVICES: Record<Device, { width: number; height: number }> = {
  mobile: { width: 390, height: 780 },
  desktop: { width: 1280, height: 800 },
};

const PICKER_OWNER = 'studio-picker';

function initialForm(w: Wedding | null): FormState {
  return {
    partnerOne: w?.partnerOne ?? '',
    partnerTwo: w?.partnerTwo ?? '',
    eventDate: w?.eventDate?.slice(0, 10) ?? '',
    eventTime: w?.eventTime ?? '',
    venueName: w?.venueName ?? '',
    venueAddress: w?.venueAddress ?? '',
    welcomeText: w?.welcomeText ?? '',
    story: w?.story ?? '',
    locale: w?.locale === 'ru' || w?.locale === 'en' ? w.locale : 'az',
    template: resolveTemplate(w?.template ?? 'classic'),
    designMode: resolveDesignMode(w?.designMode),
    coverImage: w?.coverImage ?? null,
    // Existing invitations keep their saved (or legacy) track; new ones start on the 6/8 serenade.
    music: w ? resolveMusic(w.music) : DEFAULT_TRACK,
    musicUpload: w?.musicUpload ?? null,
    musicVolume: typeof w?.musicVolume === 'number' ? w.musicVolume : DEFAULT_VOLUME,
  };
}

// ---------------------------------------------------------------------------
// Preview frame: lays the invitation out at real device size, then scales it.
// ---------------------------------------------------------------------------

function DeviceStage({ device, children }: { device: Device; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const size = DEVICES[device];

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      const maxHeight = device === 'mobile' ? Math.max(480, window.innerHeight - 190) : Infinity;
      const next = Math.min(1, rect.width / (size.width + (device === 'mobile' ? 24 : 0)), maxHeight / size.height);
      setScale(Number.isFinite(next) && next > 0 ? next : 1);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    window.addEventListener('resize', measure);
    return () => { observer.disconnect(); window.removeEventListener('resize', measure); };
  }, [device, size.width, size.height]);

  return (
    <div ref={ref} className="st-stage-canvas">
      <div
        className={`st-device st-device--${device}`}
        style={{ width: size.width * scale, height: size.height * scale }}
      >
        <div
          className="st-device-screen"
          style={{
            width: size.width, height: size.height,
            transform: `scale(${scale})`,
            ['--preview-h' as string]: `${size.height}px`,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

export default function WeddingEditor({
  initialWedding, locale = 'az',
}: {
  initialWedding: Wedding | null;
  accountName?: string;
  accountEmail?: string;
  locale?: Locale;
}) {
  const language = locale;
  const t = dict[language];
  const g = guestDict[language];
  const dm = designModeDict[language];

  const [origin, setOrigin] = useState('');
  const [wedding, setWedding] = useState<Wedding | null>(initialWedding);
  const [form, setForm] = useState<FormState>(() => initialForm(initialWedding));
  const [step, setStep] = useState<Step>('details');
  const [device, setDevice] = useState<Device>('mobile');
  const [mobileView, setMobileView] = useState<'edit' | 'preview'>('edit');
  const [replayKey, setReplayKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);

  const [guests, setGuests] = useState<Guest[]>([]);
  const [guestName, setGuestName] = useState('');
  const [guestBusy, setGuestBusy] = useState(false);
  const [guestError, setGuestError] = useState('');
  const [guestMessage, setGuestMessage] = useState('');
  const [importNames, setImportNames] = useState<string[]>([]);
  const [importFileName, setImportFileName] = useState('');
  const [importBusy, setImportBusy] = useState(false);
  const [guestQuery, setGuestQuery] = useState('');
  const [copiedGuestId, setCopiedGuestId] = useState<string | null>(null);
  const [canShare, setCanShare] = useState(false);

  const formRef = useRef(form);
  useEffect(() => { formRef.current = form; }, [form]);
  const dirtyRef = useRef(hasChanges);
  useEffect(() => { dirtyRef.current = hasChanges; }, [hasChanges]);

  // The page can be stale: restored by the browser's Back button, or left open
  // in another tab while the invitation was changed elsewhere. Whenever the
  // editor is opened or comes back into focus with no unsaved edits, reload
  // the saved invitation so it never works from an outdated copy.
  useEffect(() => {
    let busy = false;
    const sync = async () => {
      if (busy || dirtyRef.current || document.hidden) return;
      busy = true;
      try {
        const response = await fetch('/api/wedding', { cache: 'no-store' });
        if (!response.ok) return;
        const latest = (await response.json()).wedding as Wedding | null;
        if (!latest || dirtyRef.current) return;
        setWedding(latest);
        const next = initialForm(latest);
        setForm(old => (JSON.stringify(old) === JSON.stringify(next) ? old : next));
      } catch { /* offline: keep what is shown */ } finally {
        busy = false;
      }
    };
    void sync();
    const onVisible = () => { if (!document.hidden) void sync(); };
    window.addEventListener('focus', onVisible);
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('pageshow', onVisible);
    return () => {
      window.removeEventListener('focus', onVisible);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('pageshow', onVisible);
    };
  }, []);
  useEffect(() => { setOrigin(window.location.origin); }, []);

  const weddingId = wedding?.id;
  useEffect(() => {
    if (!weddingId) { setGuests([]); return; }
    let cancelled = false;
    fetch('/api/guests')
      .then(async response => {
        if (!response.ok) throw new Error('Could not load guest list');
        return response.json();
      })
      .then(data => { if (!cancelled) setGuests(data.guests || []); })
      .catch(err => { if (!cancelled) setGuestError(err.message); });
    return () => { cancelled = true; };
  }, [weddingId]);

  // Warn before leaving with unsaved edits.
  useEffect(() => {
    if (!hasChanges) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [hasChanges]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(old => ({ ...old, [key]: value }));
    setHasChanges(true);
    setMessage('');
  }

  function patch(values: Partial<FormState>) {
    setForm(old => ({ ...old, ...values }));
    setHasChanges(true);
    setMessage('');
  }

  const missing = useMemo(() => {
    const list: (keyof typeof t.missing)[] = [];
    if (!form.partnerOne.trim() || !form.partnerTwo.trim()) list.push('names');
    if (!form.eventDate) list.push('date');
    if (!form.eventTime) list.push('time');
    if (!form.venueName.trim()) list.push('venue');
    return list;
  }, [form, t]);

  const usingSample = !form.partnerOne.trim() || !form.partnerTwo.trim();

  // The preview is the real invitation renderer fed with the unsaved form.
  const previewData = useMemo<InvitationData>(() => ({
    slug: wedding?.slug,
    partnerOne: form.partnerOne.trim() || SAMPLE_NAMES[form.locale][0],
    partnerTwo: form.partnerTwo.trim() || SAMPLE_NAMES[form.locale][1],
    eventDate: form.eventDate || null,
    eventTime: form.eventTime || null,
    timezone: wedding?.timezone ?? 'Asia/Baku',
    venueName: form.venueName || null,
    venueAddress: form.venueAddress || null,
    welcomeText: form.welcomeText || null,
    story: form.story || null,
    locale: form.locale,
    template: form.template,
    coverImage: form.coverImage,
    music: form.music,
    musicUpload: form.musicUpload,
    musicVolume: form.musicVolume,
  }), [form, wedding?.slug, wedding?.timezone]);

  function handleImageUpload(file: File) {
    if (!file.type.startsWith('image/')) { setError(t.photoError); return; }
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 1600;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) { height = Math.round((height * maxDim) / width); width = maxDim; }
          else { width = Math.round((width * maxDim) / height); height = maxDim; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          update('coverImage', canvas.toDataURL('image/jpeg', 0.85));
          setError('');
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  const save = useCallback(async (): Promise<Wedding | null> => {
    if (!form.partnerOne.trim() || !form.partnerTwo.trim()) {
      setError(t.required);
      setStep('details');
      setMobileView('edit');
      return null;
    }
    setSaving(true); setError(''); setMessage('');
    const submittedForm = JSON.stringify(form);
    try {
      const response = await fetch('/api/wedding', {
        method: wedding ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          eventDate: form.eventDate || null,
          eventTime: form.eventTime || null,
          venueName: form.venueName || null,
          venueAddress: form.venueAddress || null,
          welcomeText: form.welcomeText || null,
          story: form.story || null,
          coverImage: form.coverImage || null,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        if (response.status === 409 && result.wedding) setWedding(result.wedding);
        if (result.code === 'upload_missing') {
          // The file this page pointed at is gone; fall back to what is saved.
          const current = result.current as { music: string | null; musicUpload: UploadedMusic | null } | undefined;
          const savedUpload = current?.musicUpload ?? null;
          const savedChoice = current?.music ? resolveMusic(current.music) : DEFAULT_TRACK;
          setForm(old => ({
            ...old,
            musicUpload: savedUpload,
            music: savedChoice === MUSIC_UPLOAD && !savedUpload ? DEFAULT_TRACK : savedChoice,
          }));
          setStep('music');
          throw new Error(t.uploadMissing);
        }
        throw new Error(result.error || t.error);
      }
      setWedding(result.wedding);
      // Edits typed while the request was in flight stay marked as unsaved.
      setHasChanges(JSON.stringify(formRef.current) !== submittedForm);
      setMessage(t.savedMsg);
      return result.wedding as Wedding;
    } catch (e) {
      setError(e instanceof Error ? e.message : t.error);
      return null;
    } finally {
      setSaving(false);
    }
  }, [form, wedding, t]);

  async function togglePublish() {
    // Publishing always includes the latest edits.
    let current = wedding;
    if (!current || hasChanges) {
      current = await save();
      if (!current) return;
    }
    const nextState = !current.isPublished;
    setSaving(true); setError(''); setMessage('');
    try {
      const response = await fetch('/api/wedding', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: nextState }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || t.error);
      setWedding(result.wedding);
      setMessage(nextState ? t.publishedMsg : t.unpublishedMsg);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.error);
    } finally {
      setSaving(false);
    }
  }

  // Cmd/Ctrl + S saves.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        if (!saving) void save();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [save, saving]);

  async function copyLink() {
    if (!wedding) return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/${wedding.slug}`);
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 2200);
    } catch { /* clipboard unavailable — the link is visible to copy manually */ }
  }

  // ----- Personal invitations (unchanged behaviour) -----

  async function addGuest() {
    if (!guestName.trim()) return;
    setGuestBusy(true); setGuestError(''); setGuestMessage('');
    try {
      const response = await fetch('/api/guests', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: guestName.trim() }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not create invitation');
      setGuests(old => [result.guest, ...old]);
      setGuestName('');
      setGuestMessage(g.created);
    } catch (err) {
      setGuestError(err instanceof Error ? err.message : 'Error');
    } finally {
      setGuestBusy(false);
    }
  }

  /** Saves one guest's own design immediately. Other guests are never touched. */
  async function setGuestTemplate(guest: Guest, template: TemplateId) {
    if (guest.template === template) return;
    setGuestBusy(true); setGuestError(''); setGuestMessage('');
    try {
      const response = await fetch('/api/guests', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: guest.id, template }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not update design');
      setGuests(old => old.map(item => (item.id === guest.id ? { ...item, ...result.guest } : item)));
      setGuestMessage(dm.updated(guest.name, templateMeta(template).name[language]));
    } catch (err) {
      setGuestError(err instanceof Error ? err.message : 'Error');
    } finally {
      setGuestBusy(false);
    }
  }

  async function deleteGuest(id: string) {
    if (!window.confirm(g.confirm)) return;
    setGuestBusy(true); setGuestError('');
    try {
      const response = await fetch('/api/guests', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not delete invitation');
      setGuests(old => old.filter(guest => guest.id !== id));
    } catch (err) {
      setGuestError(err instanceof Error ? err.message : 'Error');
    } finally {
      setGuestBusy(false);
    }
  }

  // Detected after mount so server and client markup match.
  useEffect(() => {
    setCanShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function'
      && window.matchMedia('(pointer: coarse)').matches);
  }, []);

  async function copyGuestLink(guest: Guest) {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/guest/${guest.slug}`);
      setCopiedGuestId(guest.id);
      window.setTimeout(() => setCopiedGuestId(current => (current === guest.id ? null : current)), 2000);
    } catch { /* clipboard unavailable — the link stays visible in the row */ }
  }

  async function shareGuestLink(guest: Guest) {
    const url = `${window.location.origin}/guest/${guest.slug}`;
    try {
      await navigator.share({ title: title || g.title, text: g.shareText(guest.name), url });
    } catch (err) {
      // AbortError = the person closed the share sheet; anything else falls back to copying.
      if (!(err instanceof DOMException && err.name === 'AbortError')) void copyGuestLink(guest);
    }
  }

  const guestNeedle = guestQuery.trim().toLocaleLowerCase();
  const visibleGuests = guestNeedle
    ? guests.filter(guest => guest.name.toLocaleLowerCase().includes(guestNeedle))
    : guests;

  async function previewGuestFile(file: File) {
    setImportBusy(true); setGuestError(''); setGuestMessage(''); setImportNames([]);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/guests/import/preview', { method: 'POST', body: formData });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not read file');
      setImportNames(result.names || []);
      setImportFileName(result.fileName || file.name);
      setGuestMessage(g.found(result.count));
    } catch (err) {
      setGuestError(err instanceof Error ? err.message : 'Could not read file');
    } finally {
      setImportBusy(false);
    }
  }

  async function confirmGuestImport() {
    if (!importNames.length) return;
    setImportBusy(true); setGuestError(''); setGuestMessage('');
    try {
      const response = await fetch('/api/guests/import', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ names: importNames }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not import guests');
      setGuests(old => [
        ...(result.guests || []),
        ...old.filter(existing => !(result.guests || []).some((created: Guest) => created.id === existing.id)),
      ]);
      setImportNames([]);
      setImportFileName('');
      setGuestMessage(g.imported(result.imported, result.skippedDuplicates));
    } catch (err) {
      setGuestError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImportBusy(false);
    }
  }

  // ---------------------------------------------------------------------------

  const status = saving ? 'saving' : hasChanges || !wedding ? 'dirty' : 'saved';
  const title = form.partnerOne.trim() && form.partnerTwo.trim()
    ? `${form.partnerOne.trim()} & ${form.partnerTwo.trim()}`
    : t.untitled;
  const steps: Step[] = ['details', 'content', 'design', 'music'];
  const canPublish = wedding?.isPublished || missing.length === 0;

  return (
    <div className="st">
      <header className="st-bar">
        <div className="st-bar-title">
          <Link href="/dashboard" className="st-back"><ArrowLeftIcon className="w-3.5 h-3.5" aria-hidden="true" /> {t.back}</Link>
          <div>
            <p className="st-kicker">{t.studio}</p>
            <h1 className="st-title">{title}</h1>
          </div>
        </div>
        <div className="st-bar-actions">
          <span className={`st-save-state is-${status}`} aria-live="polite">
            <i aria-hidden="true" />{status === 'saving' ? t.saving : status === 'dirty' ? t.unsaved : t.saved}
          </span>
          <span className={`st-pill ${wedding?.isPublished ? 'is-live' : ''}`}>{wedding?.isPublished ? t.published : t.draft}</span>
          <button type="button" className="st-btn" onClick={() => void save()} disabled={saving || (!hasChanges && Boolean(wedding))}>
            {saving ? t.saving : t.save}
          </button>
          <button type="button" className="st-btn st-btn--primary" onClick={() => void togglePublish()}
            disabled={saving || !canPublish}
            title={!canPublish ? `${t.missingTitle} ${missing.map(k => t.missing[k]).join(', ')}` : undefined}>
            {wedding?.isPublished ? t.unpublish : t.publish}
          </button>
        </div>
      </header>

      {(message || error) && (
        <div className={`st-toast ${error ? 'is-error' : ''}`} role={error ? 'alert' : 'status'}>{error || message}</div>
      )}

      <div className="st-switch" role="tablist" aria-label={t.preview}>
        <button type="button" role="tab" aria-selected={mobileView === 'edit'} className={mobileView === 'edit' ? 'is-active' : ''} onClick={() => setMobileView('edit')}>{t.edit}</button>
        <button type="button" role="tab" aria-selected={mobileView === 'preview'} className={mobileView === 'preview' ? 'is-active' : ''} onClick={() => setMobileView('preview')}>{t.show}</button>
      </div>

      <div className={`st-work is-${mobileView}`}>
        <aside className="st-panel" aria-label={t.studio}>
          <nav className="st-steps" role="tablist" aria-label={t.studio}>
            {steps.map((id, index) => (
              <button key={id} type="button" role="tab" id={`st-tab-${id}`} aria-controls={`st-step-${id}`}
                aria-selected={step === id} className={`st-step ${step === id ? 'is-active' : ''}`} onClick={() => setStep(id)}>
                <small>{String(index + 1).padStart(2, '0')}</small>{t.steps[id]}
              </button>
            ))}
          </nav>

          <div className="st-panel-body" role="tabpanel" id={`st-step-${step}`} aria-labelledby={`st-tab-${step}`}>
            {step === 'details' && (
              <>
                <fieldset className="st-group">
                  <legend>{t.names}</legend>
                  <div className="st-grid-2">
                    <label className="st-field"><span>{t.first} <b aria-hidden="true">*</b></span>
                      <input value={form.partnerOne} onChange={e => update('partnerOne', e.target.value)} maxLength={100} autoComplete="off" required />
                    </label>
                    <label className="st-field"><span>{t.second} <b aria-hidden="true">*</b></span>
                      <input value={form.partnerTwo} onChange={e => update('partnerTwo', e.target.value)} maxLength={100} autoComplete="off" required />
                    </label>
                  </div>
                </fieldset>
                <fieldset className="st-group">
                  <legend>{t.when}</legend>
                  <div className="st-grid-2">
                    <label className="st-field"><span>{t.date} <b aria-hidden="true">*</b></span>
                      <input type="date" value={form.eventDate} onChange={e => update('eventDate', e.target.value)} />
                    </label>
                    <label className="st-field"><span>{t.time} <b aria-hidden="true">*</b></span>
                      <input type="time" value={form.eventTime} onChange={e => update('eventTime', e.target.value)} />
                    </label>
                  </div>
                </fieldset>
                <fieldset className="st-group">
                  <legend>{t.where}</legend>
                  <label className="st-field"><span>{t.venueName} <b aria-hidden="true">*</b></span>
                    <input value={form.venueName} onChange={e => update('venueName', e.target.value)} maxLength={200} />
                  </label>
                  <label className="st-field"><span>{t.address}</span>
                    <input value={form.venueAddress} onChange={e => update('venueAddress', e.target.value)} maxLength={500} />
                    <small>{t.addressHint}</small>
                  </label>
                </fieldset>
                <fieldset className="st-group">
                  <legend>{t.language}</legend>
                  <div className="st-segment" role="radiogroup" aria-label={t.language}>
                    {(['az', 'ru', 'en'] as Locale[]).map(code => (
                      <label key={code} className={form.locale === code ? 'is-active' : ''}>
                        <input type="radio" name="st-locale" checked={form.locale === code} onChange={() => update('locale', code)} />
                        {t.languages[code]}
                      </label>
                    ))}
                  </div>
                  <small className="st-hint">{t.languageHint}</small>
                </fieldset>
              </>
            )}

            {step === 'content' && (
              <>
                <fieldset className="st-group">
                  <legend>{t.welcome}</legend>
                  <label className="st-field">
                    <span className="inv-sr">{t.welcome}</span>
                    <textarea rows={5} value={form.welcomeText} onChange={e => update('welcomeText', e.target.value)} maxLength={5000}
                      placeholder={invitationCopy[form.locale].welcomeDefault} />
                    <small>{t.welcomeHint}</small>
                  </label>
                </fieldset>
                <fieldset className="st-group">
                  <legend>{t.story}</legend>
                  <label className="st-field">
                    <span className="inv-sr">{t.story}</span>
                    <textarea rows={7} value={form.story} onChange={e => update('story', e.target.value)} maxLength={10000} />
                    <small>{t.storyHint}</small>
                  </label>
                </fieldset>
                <fieldset className="st-group">
                  <legend>{t.photo}</legend>
                  <small className="st-hint">{t.photoHint}</small>
                  {form.coverImage ? (
                    <div className="st-photo">
                      {/* eslint-disable-next-line @next/next/no-img-element -- data URL or user-provided link */}
                      <img src={form.coverImage} alt="" />
                      <div className="st-photo-actions">
                        <label className="st-btn st-btn--small">
                          <UploadIcon className="w-3.5 h-3.5" aria-hidden="true" />{t.replace}
                          <input type="file" accept="image/*" className="inv-sr"
                            onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); e.currentTarget.value = ''; }} />
                        </label>
                        <button type="button" className="st-btn st-btn--small st-btn--danger" onClick={() => update('coverImage', null)}>{t.remove}</button>
                      </div>
                    </div>
                  ) : (
                    <label className="st-drop">
                      <PhotoIcon className="w-7 h-7" aria-hidden="true" />
                      <strong>{t.upload}</strong>
                      <small>{t.uploadSub}</small>
                      <input type="file" accept="image/*" className="inv-sr"
                        onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); e.currentTarget.value = ''; }} />
                    </label>
                  )}
                  <label className="st-field">
                    <span>{t.photoUrl}</span>
                    <input type="url" inputMode="url" placeholder="https://…"
                      value={form.coverImage?.startsWith('data:') ? '' : form.coverImage ?? ''}
                      onChange={e => update('coverImage', e.target.value || null)} />
                  </label>
                </fieldset>
              </>
            )}

            {step === 'design' && (
              <fieldset className="st-group">
                <legend>{t.designTitle}</legend>
                <div className="st-segment st-design-mode" role="radiogroup" aria-label={dm.label}>
                  {(['global', 'individual'] as DesignMode[]).map(mode => (
                    <label key={mode} className={form.designMode === mode ? 'is-active' : ''}>
                      <input type="radio" name="st-design-mode" value={mode} checked={form.designMode === mode}
                        onChange={() => update('designMode', mode)} />
                      <span>{mode === 'global' ? dm.global : dm.individual}</span>
                    </label>
                  ))}
                </div>
                <p className="st-design-mode-note" role="status">
                  <strong>
                    {form.designMode === 'global'
                      ? dm.globalActive(templateMeta(form.template).name[language])
                      : dm.individualActive}
                  </strong>
                  <span>{form.designMode === 'global' ? dm.keptNote : dm.defaultNote}</span>
                </p>
                <small className="st-hint">{t.designHint}</small>
                <p className="st-kicker st-design-picker-label">{form.designMode === 'global' ? dm.globalPicker : dm.defaultPicker}</p>
                <div className="st-templates" role="radiogroup" aria-label={t.designTitle}>
                  {TEMPLATES.map(tpl => {
                    const selected = form.template === tpl.id;
                    return (
                      <div key={tpl.id} className={`st-template ${selected ? 'is-selected' : ''}`}>
                        <span className="st-template-thumb" aria-hidden="true">
                          <span className="st-template-thumb-inner">
                            <InvitationView data={{ ...previewData, template: tpl.id }} mode="thumbnail" />
                          </span>
                        </span>
                        <span className="st-template-meta">
                          <small>{tpl.style[language]}</small>
                          <strong>{tpl.name[language]}</strong>
                          <span>{tpl.description[language]}</span>
                          <span className="st-swatches" aria-hidden="true">
                            {tpl.swatches.map(c => <i key={c} style={{ background: c }} />)}
                          </span>
                          {tpl.usesPhoto === 'hero' && !form.coverImage && <em>{t.withPhoto}</em>}
                        </span>
                        {selected && <span className="st-template-check" aria-hidden="true"><CheckIcon className="w-3.5 h-3.5" /></span>}
                        <button type="button" role="radio" aria-checked={selected} className="st-template-hit"
                          aria-label={`${tpl.name[language]} — ${tpl.style[language]}`} onClick={() => update('template', tpl.id)} />
                      </div>
                    );
                  })}
                </div>
              </fieldset>
            )}

            {step === 'music' && (
              <MusicPicker form={form} onPatch={patch} locale={language} t={t} />
            )}
          </div>

          <footer className="st-panel-foot">
            {missing.length === 0 ? (
              <p className="st-ready"><CheckIcon className="w-3.5 h-3.5" aria-hidden="true" /> {t.readyTitle}</p>
            ) : (
              <p className="st-missing">{t.missingTitle} <strong>{missing.map(k => t.missing[k]).join(', ')}</strong></p>
            )}
          </footer>
        </aside>

        <section className="st-stage" aria-label={t.preview}>
          <div className="st-stage-bar">
            <p><span className="st-live-dot" aria-hidden="true" />{t.preview}</p>
            <div className="st-stage-tools">
              <div className="st-segment st-segment--icons" role="radiogroup" aria-label={t.preview}>
                {(['mobile', 'desktop'] as Device[]).map(d => (
                  <label key={d} className={device === d ? 'is-active' : ''} title={d === 'mobile' ? t.mobile : t.desktop}>
                    <input type="radio" name="st-device" checked={device === d} onChange={() => setDevice(d)} />
                    {d === 'mobile' ? <MobileIcon className="w-4 h-4" aria-hidden="true" /> : <DesktopIcon className="w-4 h-4" aria-hidden="true" />}
                    <span>{d === 'mobile' ? t.mobile : t.desktop}</span>
                  </label>
                ))}
              </div>
              <button type="button" className="st-btn st-btn--small" onClick={() => setReplayKey(k => k + 1)}>{t.replay}</button>
            </div>
          </div>
          <DeviceStage device={device}>
            <InvitationView key={`${replayKey}-${form.template}`} data={previewData} mode="preview" />
          </DeviceStage>
          {usingSample && <p className="st-stage-note">{t.sample}</p>}
        </section>
      </div>

      {wedding && (
        <section className="st-card st-share">
          <div>
            <p className="st-kicker">{t.link}</p>
            <p className="st-share-url">{origin ? `${origin}/${wedding.slug}` : `/${wedding.slug}`}</p>
            {!wedding.isPublished && <small className="st-hint">{t.notLive}</small>}
          </div>
          <div className="st-share-actions">
            <button type="button" className="st-btn" onClick={() => void copyLink()}>
              {linkCopied ? <CheckIcon className="w-3.5 h-3.5" aria-hidden="true" /> : <CopyIcon className="w-3.5 h-3.5" aria-hidden="true" />}
              <span aria-live="polite">{linkCopied ? t.copied : t.copy}</span>
            </button>
            {wedding.isPublished && (
              <a className="st-btn st-btn--primary" href={`/${wedding.slug}`} target="_blank" rel="noreferrer">
                {t.open} <ArrowUpRightIcon className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
            )}
          </div>
        </section>
      )}

      {wedding && (
        <section className="st-card st-guests" aria-labelledby="st-guests-title">
          <header className="st-guests-head">
            <div>
              <h2 id="st-guests-title">{g.title}</h2>
              <p>{g.sub}</p>
              <p className="st-design-mode-badge">
                <span>{dm.label}:</span>{' '}
                <strong>
                  {form.designMode === 'global'
                    ? `${dm.global} · ${templateMeta(form.template).name[language]}`
                    : dm.individual}
                </strong>
                {resolveDesignMode(wedding.designMode) !== form.designMode && <em>{dm.saveMode}</em>}
              </p>
            </div>
            <strong className="st-count">{guests.length}</strong>
          </header>

          <form className="st-inline-form" onSubmit={e => { e.preventDefault(); void addGuest(); }}>
            <input value={guestName} onChange={e => setGuestName(e.target.value)} placeholder={g.placeholder} maxLength={160} aria-label={g.guestName} />
            <button type="submit" className="st-btn st-btn--primary" disabled={guestBusy || !guestName.trim()}>{guestBusy ? '…' : g.create}</button>
          </form>

          <div className="st-import">
            <div>
              <strong>{g.importTitle}</strong>
              <small>{g.importSub}</small>
            </div>
            <label className={`st-btn ${importBusy || guestBusy ? 'is-disabled' : ''}`}>
              <UploadIcon className="w-3.5 h-3.5" aria-hidden="true" />
              {importBusy ? g.processing : g.choose}
              <input type="file" className="inv-sr" accept=".csv,.xlsx,.xls,.docx,.txt,.pdf" disabled={importBusy || guestBusy}
                onChange={event => { const file = event.target.files?.[0]; if (file) void previewGuestFile(file); event.currentTarget.value = ''; }} />
            </label>
          </div>

          {importFileName && <p className="st-hint">{importFileName}</p>}

          {importNames.length > 0 && (
            <div className="st-import-review">
              <div className="st-import-summary">
                <strong>{g.detected(importNames.length)}</strong>
                <button type="button" className="st-link" onClick={() => { setImportNames([]); setImportFileName(''); }}>{g.clear}</button>
              </div>
              <ol className="st-import-list">
                {importNames.map((name, index) => (
                  <li key={index}>
                    <span>{index + 1}.</span>
                    <input aria-label={`${g.guestName} ${index + 1}`} maxLength={160} value={name}
                      onChange={event => setImportNames(old => old.map((item, i) => (i === index ? event.target.value : item)))} />
                    <button type="button" aria-label={g.remove} onClick={() => setImportNames(old => old.filter((_, i) => i !== index))}>×</button>
                  </li>
                ))}
              </ol>
              <button type="button" className="st-btn st-btn--primary" disabled={importBusy || guestBusy || !importNames.some(n => n.trim())}
                onClick={() => void confirmGuestImport()}>{g.confirmImport}</button>
            </div>
          )}

          {guestMessage && <p className="st-msg" role="status">{guestMessage}</p>}
          {guestError && <p className="st-msg is-error" role="alert">{guestError}</p>}

          {guests.length > 6 && (
            <input type="search" className="st-guest-search" value={guestQuery} placeholder={g.search}
              aria-label={g.search} onChange={event => setGuestQuery(event.target.value)} />
          )}

          <ul className="st-guest-list">
            {guests.length === 0 ? (
              <li className="st-hint">{g.empty}</li>
            ) : visibleGuests.length === 0 ? (
              <li className="st-hint">{g.noMatch}</li>
            ) : visibleGuests.map(guest => (
              <li key={guest.id} className="st-guest st-guest--design">
                <div>
                  <strong>{guest.name}</strong>
                  <small>{origin ? `${origin}/guest/${guest.slug}` : `/guest/${guest.slug}`}</small>
                </div>
                <label className="st-guest-design" title={form.designMode === 'global' ? dm.savedHint : undefined}>
                  <span className="inv-sr">{`${dm.guestDesign}: ${guest.name}`}</span>
                  {form.designMode === 'global' && (
                    <small className="st-guest-design-global">{dm.usesGlobal(templateMeta(form.template).name[language])}</small>
                  )}
                  <select
                    value={resolveTemplate(guest.template ?? wedding.template)}
                    disabled={guestBusy || form.designMode === 'global'}
                    onChange={event => void setGuestTemplate(guest, event.target.value as TemplateId)}
                  >
                    {TEMPLATES.map(tpl => <option key={tpl.id} value={tpl.id}>{tpl.name[language]}</option>)}
                  </select>
                </label>
                <div className="st-guest-actions">
                  {canShare && (
                    <button type="button" className="st-btn st-btn--small st-btn--primary" onClick={() => void shareGuestLink(guest)}>{g.share}</button>
                  )}
                  <button type="button" className="st-btn st-btn--small" onClick={() => void copyGuestLink(guest)} aria-live="polite">
                    {copiedGuestId === guest.id ? <><CheckIcon className="w-3.5 h-3.5" aria-hidden="true" /> {g.copiedShort}</> : g.copy}
                  </button>
                </div>
                <button type="button" className="st-icon-btn" disabled={guestBusy} onClick={() => void deleteGuest(guest.id)} aria-label={`${g.remove}: ${guest.name}`}>×</button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

type MusicTab = 'builtin' | 'upload';
const tabFor = (choice: MusicChoice): MusicTab => (choice === MUSIC_UPLOAD ? 'upload' : 'builtin');

type Dict = (typeof dict)['en'];
type AudioErrorCode = keyof Dict['audioErr'];

/** Formats that Safari / iOS cannot play, so the couple gets a heads-up. */
const NOT_ON_SAFARI = /\.(ogg|oga|opus|webm|flac)$/i;

function formatBytes(bytes: number) {
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const s = Math.floor(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function formatLabel(upload: UploadedMusic) {
  const ext = /\.([a-z0-9]{2,5})$/i.exec(upload.name)?.[1];
  return (ext ?? upload.mime.split('/')[1] ?? 'audio').toUpperCase();
}

/** Uploads with XMLHttpRequest so the editor can show real progress. */
function uploadAudio(file: File, onProgress: (fraction: number) => void): Promise<UploadedMusic> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/music/upload');
    xhr.responseType = 'json';
    xhr.upload.onprogress = event => { if (event.lengthComputable) onProgress(event.loaded / event.total); };
    xhr.onload = () => {
      const body = xhr.response as { upload?: UploadedMusic; code?: string } | null;
      if (xhr.status === 201 && body?.upload) resolve(body.upload);
      else reject(new Error(body?.code === 'type' || body?.code === 'size' || body?.code === 'auth' ? body.code : 'failed'));
    };
    xhr.onerror = () => reject(new Error('failed'));
    const data = new FormData();
    data.append('file', file);
    xhr.send(data);
  });
}

function MusicPicker({ form, onPatch, locale, t }: {
  form: FormState;
  onPatch: (values: Partial<FormState>) => void;
  locale: Locale;
  t: Dict;
}) {
  const snapshot = useMusicSnapshot();
  const [tab, setTab] = useState<MusicTab>(() => tabFor(form.music));
  useEffect(() => () => music().stop(PICKER_OWNER), []);

  const previewing = (source: MusicSource) =>
    snapshot.owner === PICKER_OWNER && snapshot.key === musicSourceKey(source)
    && (snapshot.status === 'playing' || snapshot.status === 'starting');
  const togglePreview = (source: MusicSource) => music().toggle(source, PICKER_OWNER, form.musicVolume);

  const activeLabel = form.music === MUSIC_NONE ? t.activeNone
    : form.music === MUSIC_UPLOAD ? displayName(form.musicUpload?.name ?? '')
    : TRACKS.find(track => track.id === form.music)?.title[locale] ?? '';

  function setVolume(percent: number) {
    const volume = Math.max(0, Math.min(1, percent / 100));
    onPatch({ musicVolume: volume });
    if (music().getSnapshot().owner === PICKER_OWNER) music().setVolume(volume);
  }

  const tabs: [MusicTab, string][] = [['builtin', t.tabBuiltin], ['upload', t.tabUpload]];

  return (
    <fieldset className="st-group">
      <legend>{t.musicTitle}</legend>
      <small className="st-hint">{t.musicHint}</small>

      <p className="st-music-active" aria-live="polite">
        <MusicIcon className="w-3.5 h-3.5" aria-hidden="true" />
        <span>{t.activeNow}</span> <strong>{activeLabel}</strong>
      </p>

      <div className="st-segment" role="radiogroup" aria-label={t.musicSourceLabel}>
        {tabs.map(([id, label]) => (
          <label key={id} className={tab === id ? 'is-active' : ''}>
            <input type="radio" name="st-music-tab" checked={tab === id} onChange={() => setTab(id)} />
            {label}
          </label>
        ))}
      </div>

      {tab === 'builtin' && (
        <>
          <div className="st-tracks" role="radiogroup" aria-label={t.musicTitle}>
            <div className={`st-track ${form.music === MUSIC_NONE ? 'is-selected' : ''}`}>
              <button type="button" role="radio" aria-checked={form.music === MUSIC_NONE} className="st-track-select"
                onClick={() => { music().stop(PICKER_OWNER); onPatch({ music: MUSIC_NONE }); }}>
                <span className="st-track-radio" aria-hidden="true" />
                <span className="st-track-text"><strong>{t.noMusic}</strong><small>{t.noMusicSub}</small></span>
              </button>
            </div>
            {TRACKS.map(track => {
              const source: MusicSource = { kind: 'track', id: track.id };
              const playing = previewing(source);
              return (
                <div key={track.id} className={`st-track ${form.music === track.id ? 'is-selected' : ''} ${playing ? 'is-playing' : ''}`}>
                  <button type="button" role="radio" aria-checked={form.music === track.id} className="st-track-select" onClick={() => onPatch({ music: track.id as TrackId })}>
                    <span className="st-track-radio" aria-hidden="true" />
                    <span className="st-track-text">
                      <strong>{track.title[locale]}</strong>
                      <small>{track.mood[locale]}</small>
                      <small className="st-track-note">{track.note[locale]}</small>
                    </span>
                  </button>
                  <button type="button" className="st-track-play" aria-pressed={playing}
                    aria-label={`${playing ? t.stop : t.listen}: ${track.title[locale]}`}
                    onClick={() => (playing ? music().stop(PICKER_OWNER) : void music().play(source, PICKER_OWNER, form.musicVolume))}>
                    {playing ? <PauseIcon className="w-3.5 h-3.5" aria-hidden="true" /> : <PlayIcon className="w-3.5 h-3.5" aria-hidden="true" />}
                    <span>{playing ? t.stop : t.listen}</span>
                  </button>
                </div>
              );
            })}
          </div>
          <small className="st-hint">{t.musicSource}</small>
        </>
      )}

      {tab === 'upload' && (
        <UploadPanel form={form} onPatch={onPatch} t={t} previewing={previewing} togglePreview={togglePreview} />
      )}

      {form.music !== MUSIC_NONE && (
        <label className="st-field st-volume">
          <span>{t.volume} · {Math.round(form.musicVolume * 100)}%</span>
          <input type="range" min={0} max={100} step={5} value={Math.round(form.musicVolume * 100)}
            onChange={e => setVolume(Number(e.target.value))} />
        </label>
      )}
    </fieldset>
  );
}

type PanelProps = {
  form: FormState;
  onPatch: (values: Partial<FormState>) => void;
  t: Dict;
  previewing: (source: MusicSource) => boolean;
  togglePreview: (source: MusicSource) => void;
};

function UploadPanel({ form, onPatch, t, previewing, togglePreview }: PanelProps) {
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<AudioErrorCode | null>(null);
  const [notice, setNotice] = useState(false);
  const upload = form.musicUpload;
  const source: MusicSource | null = upload ? { kind: 'file', id: upload.id, name: upload.name } : null;
  const playing = source ? previewing(source) : false;
  const position = useFileProgress(upload?.id ?? null);
  const inUse = form.music === MUSIC_UPLOAD;

  // Read the file's duration before it is played.
  useEffect(() => { if (source) music().prepare(source); }, [source?.kind, upload?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function choose(file: File | undefined) {
    if (!file) return;
    setError(null); setNotice(false);
    const looksLikeAudio = file.type.startsWith('audio/') || /\.(mp3|m4a|aac|wav|ogg|oga|opus|flac|webm|mp4)$/i.test(file.name);
    if (!looksLikeAudio) { setError('type'); return; }
    if (file.size > MAX_AUDIO_BYTES) { setError('size'); return; }
    setProgress(0);
    try {
      const uploaded = await uploadAudio(file, setProgress);
      if (upload) music().stop(PICKER_OWNER);
      onPatch({ musicUpload: uploaded, music: MUSIC_UPLOAD });
      setNotice(true);
    } catch (e) {
      const code = e instanceof Error ? e.message : 'failed';
      setError((['type', 'size', 'auth'].includes(code) ? code : 'failed') as AudioErrorCode);
    } finally {
      setProgress(null);
    }
  }

  function remove() {
    if (source && previewing(source)) music().stop(PICKER_OWNER);
    setNotice(false);
    onPatch({ musicUpload: null, ...(inUse && { music: DEFAULT_TRACK }) });
  }

  const fileInput = (
    <input type="file" accept={AUDIO_ACCEPT} className="inv-sr" disabled={progress !== null}
      onChange={e => { void choose(e.target.files?.[0]); e.currentTarget.value = ''; }} />
  );

  return (
    <div className="st-mpanel">
      {progress !== null ? (
        <div className="st-drop is-busy" role="status">
          <UploadIcon className="w-7 h-7" aria-hidden="true" />
          <strong>{t.uploading} {Math.round(progress * 100)}%</strong>
          <span className="st-progress" aria-hidden="true"><i style={{ width: `${Math.round(progress * 100)}%` }} /></span>
        </div>
      ) : upload ? (
        <div className={`st-mcard ${inUse ? 'is-selected' : ''}`}>
          <div className="st-mcard-head">
            <span className="st-mcard-icon" aria-hidden="true"><MusicIcon className="w-5 h-5" /></span>
            <span className="st-mcard-text">
              <strong title={upload.name}>{upload.name}</strong>
              <small>{formatLabel(upload)} · {formatBytes(upload.size)}</small>
            </span>
            {inUse && <span className="st-mbadge"><CheckIcon className="w-3 h-3" aria-hidden="true" />{t.inUse}</span>}
          </div>
          <div className="st-mplayer">
            <button type="button" className="st-mplay" aria-pressed={playing}
              aria-label={`${playing ? t.stop : t.listen}: ${upload.name}`}
              onClick={() => source && togglePreview(source)}>
              {playing ? <PauseIcon className="w-4 h-4" aria-hidden="true" /> : <PlayIcon className="w-4 h-4" aria-hidden="true" />}
            </button>
            <span className="st-mtime">{formatTime(position.current)}</span>
            <input type="range" className="st-mseek" min={0} max={Math.max(position.duration, 0.1)} step={0.1}
              value={Math.min(position.current, position.duration || 0)} aria-label={t.seek}
              disabled={!position.duration}
              onChange={e => music().seekFile(upload.id, Number(e.target.value))} />
            <span className="st-mtime">{formatTime(position.duration)}</span>
          </div>
          {fileFailed(source) && <p className="st-merror" role="alert">{t.fileGone}</p>}
          {NOT_ON_SAFARI.test(upload.name) && <small className="st-mwarn">{t.safariWarn}</small>}
          <div className="st-mactions">
            {!inUse && (
              <button type="button" className="st-btn st-btn--small st-btn--primary" onClick={() => onPatch({ music: MUSIC_UPLOAD })}>{t.useThis}</button>
            )}
            <label className="st-btn st-btn--small">
              <UploadIcon className="w-3.5 h-3.5" aria-hidden="true" />{t.replace}
              {fileInput}
            </label>
            <button type="button" className="st-btn st-btn--small st-btn--danger" onClick={remove}>{t.removeMusic}</button>
          </div>
        </div>
      ) : (
        <label className="st-drop">
          <UploadIcon className="w-7 h-7" aria-hidden="true" />
          <strong>{t.audioUpload}</strong>
          <small>{t.audioUploadSub}</small>
          {fileInput}
        </label>
      )}
      {error && <p className="st-merror" role="alert">{t.audioErr[error]}</p>}
      {notice && !error && <p className="st-mok" role="status"><CheckIcon className="w-3.5 h-3.5" aria-hidden="true" />{t.uploadedOk}</p>}
    </div>
  );
}

/** True when the uploaded file failed to load in the shared player. */
function fileFailed(source: MusicSource | null) {
  if (!source) return false;
  const s = music().getSnapshot();
  return s.key === musicSourceKey(source) && s.status === 'error';
}
