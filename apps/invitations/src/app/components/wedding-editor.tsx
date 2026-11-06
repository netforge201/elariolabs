'use client';

import './studio.css';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeftIcon, ArrowUpRightIcon, CheckIcon, CopyIcon, DesktopIcon, MobileIcon, PauseIcon, PhotoIcon, PlayIcon, UploadIcon,
} from './icons';
import InvitationView, { type InvitationData } from './invitation/invitation-view';
import {
  DEFAULT_TRACK, MUSIC_NONE, TEMPLATES, TRACKS, resolveMusic, resolveTemplate,
  type Locale, type MusicChoice, type TemplateId, type TrackId,
} from './invitation/catalog';
import { copy as invitationCopy } from './invitation/copy';
import { music, useMusicSnapshot } from './invitation/music-engine';

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
  timezone?: string;
  coverImage?: string | null;
  music?: string | null;
  isPublished: boolean;
};

type Guest = { id: string; name: string; slug: string; createdAt: string };

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
  coverImage: string | null;
  music: MusicChoice;
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
  },
  ru: {
    title: 'Именные приглашения', sub: 'Отдельная ссылка для каждого гостя или семьи — с обращением по имени и номером стола.',
    placeholder: 'Например: Семья Алиевых', create: 'Создать ссылку', created: 'Персональная ссылка создана', copied: 'Ссылка скопирована',
    copy: 'Копировать', remove: 'Удалить', confirm: 'Удалить это приглашение?', empty: 'Пока нет именных приглашений.',
    importTitle: 'Массовый импорт', importSub: 'CSV, Excel, Word, TXT или PDF · до 10 МБ', choose: 'Выбрать файл', processing: 'Обработка…',
    found: (n: number) => `Распознано имён: ${n}. Проверьте список перед импортом.`, detected: (n: number) => `Распознано: ${n}`,
    clear: 'Очистить', confirmImport: 'Подтвердить импорт',
    imported: (a: number, b: number) => `Импортировано: ${a}. Пропущено дубликатов: ${b}.`, guestName: 'Имя гостя',
  },
  az: {
    title: 'Adlı dəvətnamələr', sub: 'Hər qonaq və ya ailə üçün ayrıca keçid — adla müraciət və masa nömrəsi ilə.',
    placeholder: 'Məsələn: Əliyevlər ailəsi', create: 'Keçid yarat', created: 'Şəxsi keçid yaradıldı', copied: 'Keçid kopyalandı',
    copy: 'Kopyala', remove: 'Sil', confirm: 'Bu dəvətnamə silinsin?', empty: 'Hələ adlı dəvətnamə yoxdur.',
    importTitle: 'Kütləvi idxal', importSub: 'CSV, Excel, Word, TXT və ya PDF · maksimum 10 MB', choose: 'Fayl seç', processing: 'Emal edilir…',
    found: (n: number) => `Tapılan adlar: ${n}. İdxaldan əvvəl siyahını yoxlayın.`, detected: (n: number) => `Tapılan: ${n}`,
    clear: 'Təmizlə', confirmImport: 'İdxalı təsdiqlə',
    imported: (a: number, b: number) => `İdxal edildi: ${a}. Təkrar olduğu üçün buraxıldı: ${b}.`, guestName: 'Qonağın adı',
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
    coverImage: w?.coverImage ?? null,
    // Existing invitations keep their saved (or legacy) track; new ones start on the 6/8 serenade.
    music: w ? resolveMusic(w.music) : DEFAULT_TRACK,
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

  const formRef = useRef(form);
  useEffect(() => { formRef.current = form; }, [form]);
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

  async function copyGuestLink(slug: string) {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/guest/${slug}`);
      setGuestMessage(g.copied);
    } catch { /* clipboard unavailable */ }
  }

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
                <small className="st-hint">{t.designHint}</small>
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
              <MusicPicker value={form.music} onChange={value => update('music', value)} locale={language} t={t} />
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

          <ul className="st-guest-list">
            {guests.length === 0 ? (
              <li className="st-hint">{g.empty}</li>
            ) : guests.map(guest => (
              <li key={guest.id} className="st-guest">
                <div>
                  <strong>{guest.name}</strong>
                  <small>{origin ? `${origin}/guest/${guest.slug}` : `/guest/${guest.slug}`}</small>
                </div>
                <button type="button" className="st-btn st-btn--small" onClick={() => void copyGuestLink(guest.slug)}>{g.copy}</button>
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

function MusicPicker({ value, onChange, locale, t }: {
  value: MusicChoice;
  onChange: (value: MusicChoice) => void;
  locale: Locale;
  t: (typeof dict)['en'];
}) {
  const snapshot = useMusicSnapshot();
  useEffect(() => () => music().stop(PICKER_OWNER), []);

  const previewing = (id: TrackId) =>
    snapshot.owner === PICKER_OWNER && snapshot.trackId === id && (snapshot.status === 'playing' || snapshot.status === 'starting');

  return (
    <fieldset className="st-group">
      <legend>{t.musicTitle}</legend>
      <small className="st-hint">{t.musicHint}</small>
      <div className="st-tracks" role="radiogroup" aria-label={t.musicTitle}>
        <div className={`st-track ${value === MUSIC_NONE ? 'is-selected' : ''}`}>
          <button type="button" role="radio" aria-checked={value === MUSIC_NONE} className="st-track-select"
            onClick={() => { music().stop(PICKER_OWNER); onChange(MUSIC_NONE); }}>
            <span className="st-track-radio" aria-hidden="true" />
            <span className="st-track-text"><strong>{t.noMusic}</strong><small>{t.noMusicSub}</small></span>
          </button>
        </div>
        {TRACKS.map(track => {
          const playing = previewing(track.id);
          return (
            <div key={track.id} className={`st-track ${value === track.id ? 'is-selected' : ''} ${playing ? 'is-playing' : ''}`}>
              <button type="button" role="radio" aria-checked={value === track.id} className="st-track-select" onClick={() => onChange(track.id)}>
                <span className="st-track-radio" aria-hidden="true" />
                <span className="st-track-text">
                  <strong>{track.title[locale]}</strong>
                  <small>{track.mood[locale]}</small>
                  <small className="st-track-note">{track.note[locale]}</small>
                </span>
              </button>
              <button type="button" className="st-track-play" aria-pressed={playing}
                aria-label={`${playing ? t.stop : t.listen}: ${track.title[locale]}`}
                onClick={() => (playing ? music().stop(PICKER_OWNER) : void music().play(track.id, PICKER_OWNER))}>
                {playing ? <PauseIcon className="w-3.5 h-3.5" aria-hidden="true" /> : <PlayIcon className="w-3.5 h-3.5" aria-hidden="true" />}
                <span>{playing ? t.stop : t.listen}</span>
              </button>
            </div>
          );
        })}
      </div>
      <small className="st-hint">{t.musicSource}</small>
    </fieldset>
  );
}
