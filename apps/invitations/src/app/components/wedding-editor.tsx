'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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
  isPublished: boolean;
};

type Locale = 'az' | 'ru' | 'en';

type Guest = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
};

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
  template: string;
};

const templates = [
  { id: 'elegant', name: 'Editorial Luxury', desc: 'Fashion editorial, oversized typography', symbol: '✦' },
  { id: 'soft-colorful', name: 'Bloom Romance', desc: 'Pastel florals and delicate motion', symbol: '❀' },
  { id: 'azeri', name: 'Azerbaijani Heritage', desc: 'Shebeke geometry and oriental luxury', symbol: '❋' },
  { id: 'minimal', name: 'Pure Minimal', desc: 'Architectural whitespace and typography', symbol: '—' },
  { id: 'botanical', name: 'Secret Garden', desc: 'Botanical atmosphere and organic forms', symbol: '❧' },
  { id: 'romantic', name: 'Midnight', desc: 'Dark cinematic mood and starlight', symbol: '✧' },
  { id: 'classic', name: 'Royal Affair', desc: 'Regal frames and timeless ornament', symbol: '❖' },
];

const dict = {
  en: {
    dashboard: 'Wedding studio', back: 'Dashboard', save: 'Save changes', saving: 'Saving...',
    saved: 'Changes saved', error: 'Could not save changes', publish: 'Publish invitation',
    unpublish: 'Unpublish', published: 'Published', draft: 'Draft', preview: 'Live preview',
    desktop: 'Desktop', mobile: 'Mobile', details: 'Wedding details', names: 'The couple',
    date: 'Wedding date', time: 'Start time', venue: 'Venue', venueName: 'Venue name',
    address: 'Address', content: 'Invitation content', welcome: 'Welcome message',
    story: 'Our story', language: 'Invitation language', design: 'Choose your design',
    designHint: 'Select a design to see it instantly in the preview.',
    first: 'First name', second: 'Second name', copy: 'Copy link', open: 'Open invitation',
    link: 'Your invitation link', required: 'Enter both names before saving.',
    intro: 'Together with our families', invitation: 'We invite you to celebrate our special day',
    dateLabel: 'THE DATE', timeLabel: 'THE TIME', venueLabel: 'THE PLACE',
    countdown: 'Counting down to our day', footer: 'We look forward to celebrating with you',
    noDate: 'Your wedding date', noVenue: 'Your wedding venue', noWelcome: 'A beautiful beginning to our story.',
    languageAZ: 'Azerbaijani', languageRU: 'Russian', languageEN: 'English',
    sectionDesign: 'Design', sectionContent: 'Content', sectionDetails: 'Details',
    account: 'Account', signout: 'Sign out',
  },
  ru: {
    dashboard: 'Студия приглашений', back: 'К кабинету', save: 'Сохранить', saving: 'Сохранение...',
    saved: 'Изменения сохранены', error: 'Не удалось сохранить изменения', publish: 'Опубликовать',
    unpublish: 'Снять с публикации', published: 'Опубликовано', draft: 'Черновик', preview: 'Предпросмотр',
    desktop: 'Компьютер', mobile: 'Телефон', details: 'Детали свадьбы', names: 'Молодожёны',
    date: 'Дата свадьбы', time: 'Время начала', venue: 'Место проведения', venueName: 'Название площадки',
    address: 'Адрес', content: 'Содержание приглашения', welcome: 'Приветственное сообщение',
    story: 'Наша история', language: 'Язык приглашения', design: 'Выберите дизайн',
    designHint: 'Выберите дизайн — он сразу появится в предпросмотре.',
    first: 'Первое имя', second: 'Второе имя', copy: 'Копировать ссылку', open: 'Открыть приглашение',
    link: 'Ссылка на приглашение', required: 'Введите оба имени.',
    intro: 'Вместе с нашими семьями', invitation: 'Приглашаем вас разделить наш особенный день',
    dateLabel: 'ДАТА', timeLabel: 'ВРЕМЯ', venueLabel: 'МЕСТО',
    countdown: 'До нашего дня осталось', footer: 'Будем рады разделить этот день с вами',
    noDate: 'Дата вашей свадьбы', noVenue: 'Место проведения свадьбы', noWelcome: 'Начало нашей прекрасной истории.',
    languageAZ: 'Азербайджанский', languageRU: 'Русский', languageEN: 'Английский',
    sectionDesign: 'Дизайн', sectionContent: 'Содержание', sectionDetails: 'Детали',
    account: 'Аккаунт', signout: 'Выйти',
  },
  az: {
    dashboard: 'Dəvətnamə studiyası', back: 'Kabinetə qayıt', save: 'Yadda saxla', saving: 'Saxlanılır...',
    saved: 'Dəyişikliklər saxlanıldı', error: 'Saxlamaq mümkün olmadı', publish: 'Dərc et',
    unpublish: 'Dərcdən götür', published: 'Dərc edilib', draft: 'Qaralama', preview: 'Canlı önbaxış',
    desktop: 'Kompüter', mobile: 'Telefon', details: 'Toy məlumatları', names: 'Cütlük',
    date: 'Toy tarixi', time: 'Başlama vaxtı', venue: 'Məkan', venueName: 'Məkanın adı',
    address: 'Ünvan', content: 'Dəvətnamənin məzmunu', welcome: 'Salamlama mesajı',
    story: 'Bizim hekayəmiz', language: 'Dəvətnamənin dili', design: 'Dizayn seçin',
    designHint: 'Dizayn seçin və nəticəni dərhal önbaxışda görün.',
    first: 'Birinci ad', second: 'İkinci ad', copy: 'Keçidi kopyala', open: 'Dəvətnaməni aç',
    link: 'Dəvətnamə keçidi', required: 'Hər iki adı daxil edin.',
    intro: 'Ailələrimizin iştirakı ilə', invitation: 'Sizi özəl günümüzü qeyd etməyə dəvət edirik',
    dateLabel: 'TARİX', timeLabel: 'SAAT', venueLabel: 'MƏKAN',
    countdown: 'Bu günə qalan vaxt', footer: 'Bu günü sizinlə bölüşməkdən məmnun olarıq',
    noDate: 'Toy tarixiniz', noVenue: 'Toy məkanınız', noWelcome: 'Gözəl hekayəmizin başlanğıcı.',
    languageAZ: 'Azərbaycan dili', languageRU: 'Rus dili', languageEN: 'İngilis dili',
    sectionDesign: 'Dizayn', sectionContent: 'Məzmun', sectionDetails: 'Məlumatlar',
    account: 'Hesab', signout: 'Çıxış',
  },
};

function dateLabel(value: string, locale: Locale) {
  if (!value) return locale === 'ru' ? 'Дата будет объявлена' : locale === 'az' ? 'Tarix təyin ediləcək' : 'Date to be announced';
  const d = new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat(locale === 'az' ? 'az-AZ' : locale === 'ru' ? 'ru-RU' : 'en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  }).format(d);
}

function Preview({ form, mode }: { form: FormState; mode: 'desktop' | 'mobile' }) {
  const [days, setDays] = useState<number | null>(null);
  const t = dict[form.locale];

  useEffect(() => {
    if (!form.eventDate) { setDays(null); return; }
    const update = () => setDays(Math.max(0, Math.ceil((new Date(`${form.eventDate}T${form.eventTime || '18:00'}:00`).getTime() - Date.now()) / 86400000)));
    update();
    const timer = window.setInterval(update, 60000);
    return () => window.clearInterval(timer);
  }, [form.eventDate, form.eventTime]);

  const names = [form.partnerOne || 'Alex', form.partnerTwo || 'Sam'];
  const venue = form.venueName || t.noVenue;
  const theme = `preview-${form.template}`;

  return (
    <div className={`preview-device ${mode === 'mobile' ? 'preview-mobile' : ''}`}>
      <div className={`invitation-canvas ${theme}`}>
        <div className="preview-top-ornament">{form.template === 'azeri' ? '❋ ❖ ❋' : form.template === 'botanical' ? '❧' : form.template === 'minimal' ? '—' : '✦'}</div>
        <div className="preview-content">
          <p className="preview-kicker">{t.intro}</p>
          <h1 className="preview-names">
            <span>{names[0]}</span>
            <i>{form.template === 'minimal' ? '+' : '&'}</i>
            <span>{names[1]}</span>
          </h1>
          <div className="preview-rule" />
          <p className="preview-welcome">{form.welcomeText || t.noWelcome}</p>
          <div className="preview-event">
            <div><small>{t.dateLabel}</small><strong>{dateLabel(form.eventDate, form.locale)}</strong></div>
            <div><small>{t.timeLabel}</small><strong>{form.eventTime || '18:00'}</strong></div>
            <div><small>{t.venueLabel}</small><strong>{venue}</strong><span>{form.venueAddress}</span></div>
          </div>
          {form.eventDate && <div className="preview-countdown">
            <small>{t.countdown}</small>
            <strong>{days === null ? '—' : days}</strong>
            <span>{form.locale === 'ru' ? 'дней' : form.locale === 'az' ? 'gün' : 'days'}</span>
          </div>}
          {form.story && <div className="preview-story"><small>{t.story}</small><p>{form.story}</p></div>}
          <div className="preview-bottom-rule" />
          <p className="preview-footer">{t.footer}</p>
        </div>
      </div>
    </div>
  );
}

export default function WeddingEditor({
  initialWedding, accountName, accountEmail,
}: {
  initialWedding: Wedding | null; accountName: string; accountEmail: string;
}) {
  const [language, setLanguage] = useState<Locale>('az');
  const [origin, setOrigin] = useState('');
  const [wedding, setWedding] = useState<Wedding | null>(initialWedding);
  const [mode, setMode] = useState<'desktop' | 'mobile'>('desktop');
  const [activeSection, setActiveSection] = useState<'details' | 'content' | 'design'>('details');
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [guests, setGuests] = useState<Guest[]>([]);
  const [guestName, setGuestName] = useState('');
  const [guestBusy, setGuestBusy] = useState(false);
  const [guestError, setGuestError] = useState('');
  const [guestMessage, setGuestMessage] = useState('');
  const [importNames, setImportNames] = useState<string[]>([]);
  const [importFileName, setImportFileName] = useState('');
  const [importBusy, setImportBusy] = useState(false);


  const [form, setForm] = useState<FormState>({
    partnerOne: initialWedding?.partnerOne ?? '',
    partnerTwo: initialWedding?.partnerTwo ?? '',
    eventDate: initialWedding?.eventDate?.slice(0, 10) ?? '',
    eventTime: initialWedding?.eventTime ?? '',
    venueName: initialWedding?.venueName ?? '',
    venueAddress: initialWedding?.venueAddress ?? '',
    welcomeText: initialWedding?.welcomeText ?? '',
    story: initialWedding?.story ?? '',
    locale: (initialWedding?.locale as Locale) || 'az',
    template: initialWedding?.template ?? 'elegant',
  });

  useEffect(() => {
    setOrigin(window.location.origin);
    const stored = localStorage.getItem('invitations-dashboard-locale');
    if (stored === 'az' || stored === 'ru' || stored === 'en') setLanguage(stored);
  }, []);

  const t = dict[language];

  useEffect(() => {
    if (!wedding) {
      setGuests([]);
      return;
    }
    let cancelled = false;
    fetch('/api/guests')
      .then(async response => {
        if (!response.ok) throw new Error('Could not load guest list');
        return response.json();
      })
      .then(data => {
        if (!cancelled) setGuests(data.guests || []);
      })
      .catch(error => {
        if (!cancelled) setGuestError(error.message);
      });
    return () => { cancelled = true; };
  }, [wedding?.id]);


  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(old => ({ ...old, [key]: value }));
    setHasChanges(true);
    setMessage('');
  }

  async function save() {
    if (!form.partnerOne.trim() || !form.partnerTwo.trim()) {
      setError(t.required);
      return;
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
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        if (response.status === 409 && result.wedding) setWedding(result.wedding);
        throw new Error(result.error || t.error);
      }
      setWedding(result.wedding);
      setHasChanges(JSON.stringify(form) !== submittedForm);
      setMessage(t.saved);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.error);
    } finally { setSaving(false); }
  }

  async function publish() {
    if (!wedding) { await save(); return; }
    setSaving(true); setError(''); setMessage('');
    try {
      const response = await fetch('/api/wedding', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !wedding.isPublished }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || t.error);
      setWedding(result.wedding);
      setMessage(t.saved);
    } catch (e) { setError(e instanceof Error ? e.message : t.error); }
    finally { setSaving(false); }
  }


  async function addGuest() {
    if (!guestName.trim()) return;
    setGuestBusy(true);
    setGuestError('');
    setGuestMessage('');
    try {
      const response = await fetch('/api/guests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: guestName.trim() }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not create invitation');
      setGuests(old => [result.guest, ...old]);
      setGuestName('');
      setGuestMessage(language === 'ru' ? 'Персональная ссылка создана' : language === 'az' ? 'Şəxsi keçid yaradıldı' : 'Personal link created');
    } catch (error) {
      setGuestError(error instanceof Error ? error.message : 'Error');
    } finally {
      setGuestBusy(false);
    }
  }

  async function deleteGuest(id: string) {
    if (!window.confirm(language === 'ru' ? 'Удалить это приглашение?' : language === 'az' ? 'Bu dəvətnamə silinsin?' : 'Delete this invitation?')) return;
    setGuestBusy(true);
    setGuestError('');
    try {
      const response = await fetch('/api/guests', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not delete invitation');
      setGuests(old => old.filter(guest => guest.id !== id));
    } catch (error) {
      setGuestError(error instanceof Error ? error.message : 'Error');
    } finally {
      setGuestBusy(false);
    }
  }

  async function copyGuestLink(slug: string) {
    await navigator.clipboard.writeText(`${window.location.origin}/guest/${slug}`);
    setGuestMessage(language === 'ru' ? 'Ссылка скопирована' : language === 'az' ? 'Keçid kopyalandı' : 'Link copied');
  }

  async function previewGuestFile(file: File) {
    setImportBusy(true);
    setGuestError('');
    setGuestMessage('');
    setImportNames([]);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/guests/import/preview', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Could not read file');
      }

      setImportNames(result.names || []);
      setImportFileName(result.fileName || file.name);
      setGuestMessage(
        language === 'ru'
          ? `Распознано имён: ${result.count}. Проверь список перед импортом.`
          : language === 'az'
            ? `Tapılan adlar: ${result.count}. İdxaldan əvvəl siyahını yoxlayın.`
            : `Found ${result.count} names. Review the list before importing.`
      );
    } catch (error) {
      setGuestError(error instanceof Error ? error.message : 'Could not read file');
    } finally {
      setImportBusy(false);
    }
  }

  async function confirmGuestImport() {
    if (!importNames.length) return;

    setImportBusy(true);
    setGuestError('');
    setGuestMessage('');

    try {
      const response = await fetch('/api/guests/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ names: importNames }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Could not import guests');
      }

      setGuests(old => [
        ...(result.guests || []),
        ...old.filter(existing =>
          !(result.guests || []).some((created: Guest) => created.id === existing.id)
        ),
      ]);

      setImportNames([]);
      setImportFileName('');

      setGuestMessage(
        language === 'ru'
          ? `Импортировано: ${result.imported}. Пропущено дубликатов: ${result.skippedDuplicates}.`
          : language === 'az'
            ? `İdxal edildi: ${result.imported}. Təkrar olduğu üçün buraxıldı: ${result.skippedDuplicates}.`
            : `Imported: ${result.imported}. Duplicates skipped: ${result.skippedDuplicates}.`
      );
    } catch (error) {
      setGuestError(error instanceof Error ? error.message : 'Import failed');
    } finally {
      setImportBusy(false);
    }
  }

  async function copyLink() {
    if (!wedding) return;
    await navigator.clipboard.writeText(`${window.location.origin}/${wedding.slug}`);
    setMessage(t.link + ' ✓');
  }

  const input = 'builder-input';
  const label = 'builder-label';
  const section = (id: 'details' | 'content' | 'design', title: string) => (
    <button type="button" className={`builder-tab ${activeSection === id ? 'active' : ''}`} onClick={() => setActiveSection(id)}>{title}</button>
  );

  return (
    <main className="builder-shell">
      <div className="builder-toolbar">
        <div><Link href="/dashboard">← {t.back}</Link><span>/</span><strong>{t.dashboard}</strong></div>
        <div className="builder-actions">
          <span className={`builder-save-indicator ${saving ? 'is-saving' : hasChanges ? 'is-dirty' : 'is-saved'}`}>
            <i />
            {saving
              ? (language === 'ru' ? 'Сохранение…' : language === 'az' ? 'Saxlanılır…' : 'Saving…')
              : hasChanges
                ? (language === 'ru' ? 'Есть изменения' : language === 'az' ? 'Dəyişikliklər var' : 'Unsaved changes')
                : (language === 'ru' ? 'Сохранено' : language === 'az' ? 'Saxlanılıb' : 'Saved')}
          </span>
          <span className={`builder-status ${wedding?.isPublished ? 'is-published' : ''}`}>{wedding?.isPublished ? t.published : t.draft}</span>
          <button type="button" className="builder-button secondary" onClick={save} disabled={saving}>{saving ? t.saving : t.save}</button>
          <button type="button" className="builder-button primary" onClick={publish} disabled={saving}>{wedding?.isPublished ? t.unpublish : t.publish}</button>
        </div>
      </div>

      <div className="builder-workspace">
        <aside className="builder-sidebar">
          <div className="builder-sidebar-heading"><div><small>ELARIOLABS / STUDIO</small><h1>{t.dashboard}</h1></div></div>
          <nav className="builder-tabs">
            {section('details', t.sectionDetails)}
            {section('content', t.sectionContent)}
            {section('design', t.sectionDesign)}
          </nav>

          <div className="builder-panel">
            {activeSection === 'details' && <>
              <div className="builder-group">
                <h2>{t.names}</h2>
                <div className="builder-field-grid">
                  <label className={label}>{t.first}<input className={input} value={form.partnerOne} onChange={e => update('partnerOne', e.target.value)} maxLength={100}/></label>
                  <label className={label}>{t.second}<input className={input} value={form.partnerTwo} onChange={e => update('partnerTwo', e.target.value)} maxLength={100}/></label>
                </div>
              </div>
              <div className="builder-group">
                <h2>{t.details}</h2>
                <div className="builder-field-grid">
                  <label className={label}>{t.date}<input className={input} type="date" value={form.eventDate} onChange={e => update('eventDate', e.target.value)}/></label>
                  <label className={label}>{t.time}<input className={input} type="time" value={form.eventTime} onChange={e => update('eventTime', e.target.value)}/></label>
                </div>
              </div>
              <div className="builder-group">
                <h2>{t.venue}</h2>
                <label className={label}>{t.venueName}<input className={input} value={form.venueName} onChange={e => update('venueName', e.target.value)} maxLength={200}/></label>
                <label className={label}>{t.address}<input className={input} value={form.venueAddress} onChange={e => update('venueAddress', e.target.value)} maxLength={500}/></label>
              </div>
              <div className="builder-group">
                <h2>{t.language}</h2>
                <select className={input} value={form.locale} onChange={e => update('locale', e.target.value as Locale)}>
                  <option value="az">{t.languageAZ}</option><option value="ru">{t.languageRU}</option><option value="en">{t.languageEN}</option>
                </select>
              </div>
            </>}

            {activeSection === 'content' && <>
              <div className="builder-group">
                <h2>{t.content}</h2>
                <label className={label}>{t.welcome}<textarea className={input} rows={5} value={form.welcomeText} onChange={e => update('welcomeText', e.target.value)} maxLength={5000}/></label>
                <label className={label}>{t.story}<textarea className={input} rows={8} value={form.story} onChange={e => update('story', e.target.value)} maxLength={10000}/></label>
                <p className="builder-hint">Changes appear in the preview immediately. Save to publish them.</p>
              </div>
            </>}

            {activeSection === 'design' && <>
              <div className="builder-group">
                <h2>{t.design}</h2><p className="builder-hint">{t.designHint}</p>
                <div className="builder-template-grid">
                  {templates.map((item, i) => <button type="button" key={item.id} onClick={() => update('template', item.id)} className={`builder-template ${form.template === item.id ? 'selected' : ''}`}>
                    <div className={`template-art template-art-${item.id}`}><span>{item.symbol}</span><b>{form.partnerOne || 'Alex'} & {form.partnerTwo || 'Sam'}</b><i>{i === 2 ? 'AZERBAIJAN' : 'WEDDING INVITATION'}</i></div>
                    <div className="template-meta"><strong>{item.name}</strong><small>{item.desc}</small></div>
                    {form.template === item.id && <span className="template-check">✓</span>}
                  </button>)}
                </div>
              </div>
            </>}
          </div>

          <div className="builder-sidebar-footer">
            <button type="button" className="builder-button primary full" onClick={save} disabled={saving}>{saving ? t.saving : t.save}</button>
            {message && <p className="builder-success">{message}</p>}
            {error && <p className="builder-error">{error}</p>}
          </div>
        </aside>

        <section className="builder-preview-area">
          <div className="preview-toolbar">
            <div><span className="preview-live-dot"/><strong>{t.preview}</strong></div>
            <div className="preview-switch">
              <button type="button" className={mode === 'desktop' ? 'active' : ''} onClick={() => setMode('desktop')}>▣ {t.desktop}</button>
              <button type="button" className={mode === 'mobile' ? 'active' : ''} onClick={() => setMode('mobile')}>▯ {t.mobile}</button>
            </div>
          </div>
          <div className="preview-stage">
            <Preview form={form} mode={mode} />
          </div>
          {wedding && <div className="builder-public-link">
            <div><small>{t.link}</small><strong>{origin ? `${origin}/${wedding.slug}` : `/${wedding.slug}`}</strong></div>
            <button type="button" onClick={copyLink}>{t.copy}</button>
            {wedding.isPublished && <a href={`/${wedding.slug}`} target="_blank" rel="noreferrer">{t.open} ↗</a>}
          </div>}
          {wedding && <section className="builder-guests">
            <div className="builder-guests-heading">
              <div>
                <small>ELARIOLABS / PERSONAL INVITATIONS</small>
                <h2>{language === 'ru' ? 'Именные приглашения' : language === 'az' ? 'Adlı dəvətnamələr' : 'Personal invitations'}</h2>
                <p>{language === 'ru' ? 'Создавайте отдельную ссылку для каждого гостя или семьи.' : language === 'az' ? 'Hər qonaq və ya ailə üçün ayrıca keçid yaradın.' : 'Create a unique invitation link for each guest or family.'}</p>
              </div>
              <strong>{guests.length}</strong>
            </div>
            <form className="builder-guest-form" onSubmit={e => { e.preventDefault(); void addGuest(); }}>
              <input
                value={guestName}
                onChange={e => setGuestName(e.target.value)}
                placeholder={language === 'ru' ? 'Например: Семья Алиевых' : language === 'az' ? 'Məsələn: Əliyevlər ailəsi' : 'e.g. The Aliyev family'}
                maxLength={160}
                aria-label="Guest name"
              />
              <button type="submit" disabled={guestBusy || !guestName.trim()}>
                {guestBusy ? '…' : language === 'ru' ? 'Создать ссылку' : language === 'az' ? 'Keçid yarat' : 'Create link'}
              </button>
            </form>
            <div className="builder-guest-import">
              <div className="builder-guest-import-heading">
                <strong>
                  {language === 'ru' ? 'Массовый импорт гостей' : language === 'az' ? 'Qonaqların kütləvi idxalı' : 'Bulk guest import'}
                </strong>
                <small>
                  {language === 'ru'
                    ? 'CSV, Excel, Word, TXT или PDF · до 10 МБ'
                    : language === 'az'
                      ? 'CSV, Excel, Word, TXT və ya PDF · maksimum 10 MB'
                      : 'CSV, Excel, Word, TXT or PDF · up to 10 MB'}
                </small>
              </div>
              <label className="builder-guest-file">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls,.docx,.txt,.pdf"
                  disabled={importBusy || guestBusy}
                  onChange={event => {
                    const file = event.target.files?.[0];
                    if (file) void previewGuestFile(file);
                    event.currentTarget.value = '';
                  }}
                />
                <span>
                  {importBusy
                    ? (language === 'ru' ? 'Обработка…' : language === 'az' ? 'Emal edilir…' : 'Processing…')
                    : (language === 'ru' ? 'Выбрать файл' : language === 'az' ? 'Fayl seç' : 'Choose file')}
                </span>
              </label>

              {importFileName && <p className="builder-guest-import-filename">{importFileName}</p>}

              {importNames.length > 0 && <>
                <div className="builder-guest-import-summary">
                  <strong>
                    {language === 'ru' ? `Распознано: ${importNames.length}` : language === 'az' ? `Tapılan: ${importNames.length}` : `Detected: ${importNames.length}`}
                  </strong>
                  <button type="button" onClick={() => { setImportNames([]); setImportFileName(''); }}>
                    {language === 'ru' ? 'Очистить' : language === 'az' ? 'Təmizlə' : 'Clear'}
                  </button>
                </div>
                <div className="builder-guest-import-list">
                  {importNames.map((name, index) => (
                    <div className="builder-guest-import-row" key={`${index}-${name}`}>
                      <span>{index + 1}.</span>
                      <input
                        aria-label={`Guest ${index + 1}`}
                        maxLength={160}
                        value={name}
                        onChange={event => setImportNames(old => old.map((item, i) => i === index ? event.target.value : item))}
                      />
                      <button
                        type="button"
                        aria-label="Remove guest"
                        onClick={() => setImportNames(old => old.filter((_, i) => i !== index))}
                      >×</button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="builder-guest-import-confirm"
                  disabled={importBusy || guestBusy || !importNames.some(name => name.trim())}
                  onClick={() => void confirmGuestImport()}
                >
                  {language === 'ru' ? 'Подтвердить импорт' : language === 'az' ? 'İdxalı təsdiqlə' : 'Confirm import'}
                </button>
              </>}
            </div>
            {guestMessage && <p className="builder-success">{guestMessage}</p>}
            {guestError && <p className="builder-error">{guestError}</p>}
            <div className="builder-guest-list">
              {guests.length === 0
                ? <p className="builder-hint">{language === 'ru' ? 'Пока нет именных приглашений.' : language === 'az' ? 'Hələ adlı dəvətnamə yoxdur.' : 'No personal invitations yet.'}</p>
                : guests.map(guest => <div className="builder-guest-row" key={guest.id}>
                    <div><strong>{guest.name}</strong><small>{origin ? `${origin}/guest/${guest.slug}` : `/guest/${guest.slug}`}</small></div>
                    <button type="button" onClick={() => void copyGuestLink(guest.slug)}>{language === 'ru' ? 'Копировать' : language === 'az' ? 'Kopyala' : 'Copy'}</button>
                    <button type="button" className="danger" disabled={guestBusy} onClick={() => void deleteGuest(guest.id)} aria-label="Delete guest">×</button>
                  </div>)
              }
            </div>
          </section>}

        </section>
      </div>
    </main>
  );
}
