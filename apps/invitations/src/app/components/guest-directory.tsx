'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRightIcon, CheckIcon, CopyIcon } from './icons';
import { formatGreeting, formatInviteLine, type GuestGender } from './invitation/model';
import type { Locale } from './invitation/catalog';

export type DirectoryGuest = {
  id: string; name: string; slug: string;
  rsvpEnabled: boolean;
  rsvpStatus: 'yes' | 'no' | null;
  rsvpGuests: number | null;
  rsvpNote: string | null;
  inviteName: string | null;
  views?: number;
  gender: GuestGender;
  withFamily: boolean;
  companion: 'wife' | 'spouse' | null;
  side?: 'bride' | 'groom' | 'shared';
  group?: string;
  isVip?: boolean;
  accessibility?: boolean;
  seated?: boolean;
  hasRequired?: boolean;
  hasPreferred?: boolean;
  hasExcluded?: boolean;
};

type Filters = Record<'group' | 'side' | 'vip' | 'access' | 'seat' | 'rel' | 'gender' | 'with' | 'rsvp' | 'answer', string>;
const NO_FILTERS: Filters = { group: '', side: '', vip: '', access: '', seat: '', rel: '', gender: '', with: '', rsvp: '', answer: '' };

function matches(g: DirectoryGuest, f: Filters) {
  const invitedWith = g.companion ?? (g.withFamily ? 'family' : 'alone');
  const rel = g.hasRequired || g.hasPreferred || g.hasExcluded;
  return (!f.group || (g.group ?? 'other') === f.group)
    && (!f.side || (g.side ?? 'shared') === f.side)
    && (!f.vip || String(Boolean(g.isVip)) === f.vip)
    && (!f.access || String(Boolean(g.accessibility)) === f.access)
    && (!f.seat || String(Boolean(g.seated)) === f.seat)
    && (!f.rel || (f.rel === 'req' ? g.hasRequired : f.rel === 'pref' ? g.hasPreferred : f.rel === 'excl' ? g.hasExcluded : !rel))
    && (!f.gender || (g.gender ?? 'unknown') === f.gender)
    && (!f.with || invitedWith === f.with)
    && (!f.rsvp || String(g.rsvpEnabled) === f.rsvp)
    && (!f.answer || (g.rsvpStatus ?? 'waiting') === f.answer);
}

export type DirectoryLabels = {
  open: string; copy: string; copied: string; share: string;
  search: string; noMatch: string; shareText: string; guestColumn: string; linkColumn: string;
};

export type RsvpLabels = {
  label: string; on: string; off: string; yes: string; no: string; pending: string; people: string;
  title: string; hint: string; coming: string; declined: string; waiting: string; enabled: string;
  allOn: string; allOff: string; error: string;
};

export type ProfileLabels = {
  views: string;
  edit: string; close: string; nick: string; inviteName: string; inviteNameHint: string;
  gender: string; male: string; female: string; none: string; family: string; preview: string;
  save: string; saving: string; saved: string; error: string; familyBadge: string; inviteAs: string;
  alone: string; wife: string; spouse: string;
};

/** The name a guest actually sees (the couple's nickname stays private). */
const shownName = (g: { name: string; inviteName: string | null }) => g.inviteName?.trim() || g.name;

/** Guest rows with search, copy, native share and the per-guest RSVP switch. */
export default function GuestDirectory({ guests: initial, labels, rsvpLabels: r, profileLabels: pl, inviteLocale, exportLabels, filterLabels: fl, groupOptions = [] }: {
  exportLabels?: { bride: string; groom: string; all: string; empty: string };
  filterLabels?: Record<string, string>;
  groupOptions?: { id: string; name: string }[];
  guests: DirectoryGuest[]; labels: DirectoryLabels; rsvpLabels: RsvpLabels;
  profileLabels: ProfileLabels; inviteLocale: Locale;
}) {
  const [guests, setGuests] = useState(initial);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);

  async function addGuest(event: React.FormEvent) {
    event.preventDefault();
    if (!newName.trim() || !fl) return;
    setAdding(true);
    const response = await fetch('/api/guests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newName.trim() }) }).catch(() => null);
    if (response?.ok) window.location.reload(); else { alert(fl.addError); setAdding(false); }
  }

  async function importFile(file: File | undefined) {
    if (!file || !fl) return;
    setAdding(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const preview = await fetch('/api/guests/import/preview', { method: 'POST', body: form });
      const result = await preview.json();
      if (!preview.ok) throw new Error(result.error);
      const names: string[] = result.names || [];
      if (!names.length || !window.confirm(`${fl.confirmImport}\n\n${names.join('\n')}`)) { setAdding(false); return; }
      const saved = await fetch('/api/guests/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ names }) });
      if (!saved.ok) throw new Error();
      window.location.reload();
    } catch (err) {
      alert(err instanceof Error && err.message ? err.message : fl.addError);
      setAdding(false);
    }
  }
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [canShare, setCanShare] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Detected after mount so the server markup and the first client render match.
  useEffect(() => {
    setCanShare(typeof navigator.share === 'function' && window.matchMedia('(pointer: coarse)').matches);
  }, []);

  const summary = useMemo(() => {
    const on = guests.filter(g => g.rsvpEnabled);
    const yes = on.filter(g => g.rsvpStatus === 'yes');
    return {
      enabled: on.length,
      yesInvites: yes.length,
      yesPeople: yes.reduce((sum, g) => sum + (g.rsvpGuests ?? 1), 0),
      no: on.filter(g => g.rsvpStatus === 'no').length,
      waiting: on.filter(g => !g.rsvpStatus).length,
    };
  }, [guests]);

  const needle = query.trim().toLocaleLowerCase();
  const visible = guests.filter(guest => matches(guest, filters) &&
    (!needle || `${guest.name} ${guest.inviteName ?? ''}`.toLocaleLowerCase().includes(needle)));
  const urlFor = (slug: string) => `${window.location.origin}/guest/${slug}`;

  async function copy(guest: DirectoryGuest) {
    try {
      await navigator.clipboard.writeText(urlFor(guest.slug));
      setCopiedId(guest.id);
      window.setTimeout(() => setCopiedId(current => (current === guest.id ? null : current)), 2000);
    } catch { /* clipboard unavailable — "Open" still works */ }
  }

  async function share(guest: DirectoryGuest) {
    try {
      await navigator.share({ text: `${shownName(guest)}, ${labels.shareText}`, url: urlFor(guest.slug) });
    } catch (err) {
      if (!(err instanceof DOMException && err.name === 'AbortError')) void copy(guest);
    }
  }

  async function setRsvp(target: { id: string } | { all: true }, enabled: boolean) {
    const key = 'id' in target ? target.id : 'all';
    setBusy(key); setError('');
    const previous = guests;
    // Optimistic: flip at once, roll back if the server says no.
    setGuests(list => list.map(g => ('all' in target || g.id === target.id ? { ...g, rsvpEnabled: enabled } : g)));
    try {
      const response = await fetch('/api/guests/rsvp', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...target, enabled }),
      });
      if (!response.ok) throw new Error();
    } catch {
      setGuests(previous);
      setError(r.error);
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <div className="guests-rsvp-panel">
        <div className="guests-rsvp-head">
          <div>
            <strong>{r.title}</strong>
            <p>{r.hint}</p>
          </div>
          <div className="guests-rsvp-bulk">
            <button type="button" className="guest-action" disabled={busy !== null} onClick={() => void setRsvp({ all: true }, true)}>{r.allOn}</button>
            <button type="button" className="guest-action" disabled={busy !== null} onClick={() => void setRsvp({ all: true }, false)}>{r.allOff}</button>
          </div>
        </div>
        <dl className="guests-rsvp-stats">
          <div><dt>{r.enabled}</dt><dd>{summary.enabled}</dd></div>
          <div className="is-yes"><dt>{r.coming}</dt><dd>{summary.yesPeople} <small>{r.people}</small></dd></div>
          <div className="is-no"><dt>{r.declined}</dt><dd>{summary.no}</dd></div>
          <div><dt>{r.waiting}</dt><dd>{summary.waiting}</dd></div>
        </dl>
        {error && <p className="guests-rsvp-error" role="alert">{error}</p>}
      </div>

      {fl && (
        <form id="add-guest" onSubmit={addGuest} className="guests-search" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <input value={newName} onChange={event => setNewName(event.target.value)} placeholder={fl.addPh} style={{ flex: '1 1 260px' }} disabled={adding} />
          <button type="submit" className="guest-action guest-action--primary" disabled={adding || !newName.trim()}>{fl.add}</button>
          <label className="guest-action" style={{ cursor: 'pointer' }}>
            {fl.import}
            <input type="file" hidden accept=".csv,.xls,.xlsx,.doc,.docx,.txt,.pdf" disabled={adding} onChange={event => void importFile(event.target.files?.[0])} />
          </label>
        </form>
      )}

      {fl && (
        <details className="gd-filters" open={Object.values(filters).some(Boolean)}>
        <summary className="guest-action">
          {fl.title}
          {Object.values(filters).filter(Boolean).length > 0 && <span className="gd-filter-count">{Object.values(filters).filter(Boolean).length}</span>}
        </summary>
        <div className="gd-filter-grid">
          {([
            ['group', [...groupOptions.map(o => [o.id, o.name]), ['other', fl.noGroup]]],
            ['side', [['bride', fl.bride], ['groom', fl.groom], ['shared', fl.shared]]],
            ['vip', [['true', fl.yes], ['false', fl.no]]],
            ['access', [['true', fl.yes], ['false', fl.no]]],
            ['seat', [['true', fl.seated], ['false', fl.unseated]]],
            ['rel', [['req', fl.req], ['pref', fl.pref], ['excl', fl.excl], ['none', fl.none]]],
            ['gender', [['male', fl.male], ['female', fl.female], ['unknown', fl.unknown]]],
            ['with', [['alone', fl.alone], ['family', fl.family], ['wife', fl.wife], ['spouse', fl.spouse]]],
            ['rsvp', [['true', fl.on], ['false', fl.off]]],
            ['answer', [['yes', fl.coming], ['no', fl.declined], ['waiting', fl.waiting]]],
          ] as [keyof Filters, string[][]][]).map(([key, options]) => (
            <label key={key} className={`gd-filter ${filters[key] ? 'is-set' : ''}`}>
              <span>{fl[key]}</span>
              <select value={filters[key]} onChange={event => setFilters({ ...filters, [key]: event.target.value })}>
                <option value="">{fl.any}</option>
                {options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
          ))}
        </div>
        <div className="gd-filter-foot">
          <span>{fl.shown} <b>{visible.length}</b> {fl.of} {guests.length}</span>
          <button type="button" className="guest-action" onClick={() => setFilters(NO_FILTERS)} disabled={!Object.values(filters).some(Boolean)}>{fl.reset}</button>
        </div>
        </details>
      )}

      {exportLabels && (
        <div className="guests-search" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {(['bride', 'groom', 'all'] as const).map(side => (
            <button key={side} type="button" className="guest-action" onClick={async () => {
              const rows = side === 'all' ? visible : visible.filter(g => g.side === side);
              if (!rows.length) { alert(exportLabels.empty); return; }
              const H = inviteLocale === 'ru'
                ? { n: '№', name: 'Имя', link: 'Ссылка', side: 'Сторона', group: 'Группа', with: 'С кем', guests: 'гостей', one: 'Один', fam: 'С семьёй', wife: 'С женой', spouse: 'С супругой' }
                : inviteLocale === 'en'
                  ? { n: '#', name: 'Name', link: 'Link', side: 'Side', group: 'Group', with: 'With', guests: 'guests', one: 'Alone', fam: 'With family', wife: 'With wife', spouse: 'With spouse' }
                  : { n: '№', name: 'Ad', link: 'Keçid', side: 'Tərəf', group: 'Qrup', with: 'Kimlə', guests: 'qonaq', one: 'Tək', fam: 'Ailə ilə', wife: 'Xanımınızla', spouse: 'Həyat yoldaşınızla' };
              const sideName = (g: DirectoryGuest) => g.side === 'bride' ? (fl?.bride ?? 'Gəlin') : g.side === 'groom' ? (fl?.groom ?? 'Bəy') : (fl?.shared ?? '—');
              const withName = (g: DirectoryGuest) => g.companion === 'wife' ? H.wife : g.companion === 'spouse' ? H.spouse : g.withFamily ? H.fam : H.one;
              const order = [...groupOptions.map(o => o.id), ''];
              const known = new Set(groupOptions.map(o => o.id));
              const XLSX = await import('xlsx');
              const aoa: (string | number)[][] = [[H.n, H.name, H.link, H.side, H.group, H.with]];
              const headerRows: number[] = [];
              const links: [number, string][] = [];
              let n = 0;
              for (const gid of order) {
                const list = rows.filter(g => (g.group && known.has(g.group) ? g.group : '') === gid)
                  .sort((a, b) => a.name.localeCompare(b.name));
                if (!list.length) continue;
                const gname = gid ? groupOptions.find(o => o.id === gid)!.name : (fl?.noGroup ?? '—');
                if (aoa.length > 1) aoa.push([]);
                headerRows.push(aoa.length);
                aoa.push([`${gname} — ${list.length} ${H.guests}`]);
                for (const g of list) {
                  links.push([aoa.length, urlFor(g.slug)]);
                  aoa.push([++n, g.name, urlFor(g.slug), sideName(g), gname, withName(g)]);
                }
              }
              const ws = XLSX.utils.aoa_to_sheet(aoa);
              ws['!cols'] = [{ wch: 5 }, { wch: 28 }, { wch: 52 }, { wch: 12 }, { wch: 20 }, { wch: 18 }];
              ws['!merges'] = headerRows.map(r => ({ s: { r, c: 0 }, e: { r, c: 5 } }));
              for (const [r, url] of links) { const c = ws[XLSX.utils.encode_cell({ r, c: 2 })]; if (c) c.l = { Target: url }; }
              const wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, 'Dəvətnamələr');
              XLSX.writeFile(wb, `${side}-invitations.xlsx`);
            }}>{exportLabels[side]}</button>
          ))}
        </div>
      )}
      {guests.length > 6 && (
        <div className="guests-search">
          <input type="search" value={query} onChange={event => setQuery(event.target.value)}
            placeholder={labels.search} aria-label={labels.search} />
        </div>
      )}
      <div className="guests-table-labels"><span>{labels.guestColumn}</span><span>{labels.linkColumn}</span><span /></div>
      {visible.length === 0 && <p className="guests-no-match">{labels.noMatch}</p>}
      {visible.map(guest => {
        const index = guests.findIndex(g => g.id === guest.id);
        const status = !guest.rsvpEnabled ? null
          : guest.rsvpStatus === 'yes' ? { cls: 'is-yes', text: `${r.yes}${guest.rsvpGuests ? ` · ${guest.rsvpGuests} ${r.people}` : ''}` }
          : guest.rsvpStatus === 'no' ? { cls: 'is-no', text: r.no }
          : { cls: 'is-waiting', text: r.pending };
        return (
          <div key={guest.id} className="guests-row-wrap">
          <div className="guests-table-row">
            <div className="guest-identity">
              <span className="guest-number">{String(index + 1).padStart(2, '0')}</span>
              <span className="guest-identity-text">
                <strong>{guest.name}</strong>
                {(guest.inviteName || guest.gender) && (
                  <span className="guest-invite-as">{pl.inviteAs}: {formatGreeting(shownName(guest), guest.gender, inviteLocale)}</span>
                )}
                <span className="guest-badges">
                  {guest.companion ? <span className="guest-badge">{pl[guest.companion]}</span> : guest.withFamily && <span className="guest-badge">{pl.familyBadge}</span>}
                  {status && <span className={`guest-rsvp-status ${status.cls}`}>{status.text}</span>}
                  <span className="guest-badge" title={pl.views}>👁 {guest.views ?? 0} {pl.views}</span>
                </span>
                {guest.rsvpEnabled && guest.rsvpNote && <span className="guest-rsvp-note">“{guest.rsvpNote}”</span>}
              </span>
            </div>
            <span className="guest-link-text">/guest/{guest.slug}</span>
            <div className="guest-row-actions">
              <button type="button" className={`guest-action ${editingId === guest.id ? 'is-active' : ''}`}
                aria-expanded={editingId === guest.id} onClick={() => setEditingId(editingId === guest.id ? null : guest.id)}>
                {editingId === guest.id ? pl.close : pl.edit}
              </button>
              <button type="button" role="switch" aria-checked={guest.rsvpEnabled}
                aria-label={`${r.label}: ${guest.name}`} disabled={busy !== null}
                className={`guest-rsvp-switch ${guest.rsvpEnabled ? 'is-on' : ''}`}
                onClick={() => void setRsvp({ id: guest.id }, !guest.rsvpEnabled)}>
                <span className="guest-rsvp-track" aria-hidden="true"><i /></span>
                <span>{r.label} · {guest.rsvpEnabled ? r.on : r.off}</span>
              </button>
              {canShare && (
                <button type="button" className="guest-action guest-action--primary" onClick={() => void share(guest)}>{labels.share}</button>
              )}
              <button type="button" className="guest-action" onClick={() => void copy(guest)} aria-live="polite">
                {copiedId === guest.id
                  ? <><CheckIcon className="w-3.5 h-3.5" aria-hidden="true" /> {labels.copied}</>
                  : <><CopyIcon className="w-3.5 h-3.5" aria-hidden="true" /> {labels.copy}</>}
              </button>
              <a href={`/guest/${guest.slug}`} target="_blank" rel="noreferrer" className="guest-action">
                {labels.open} <ArrowUpRightIcon className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
            </div>
          </div>
          {editingId === guest.id && (
            <GuestEditor guest={guest} labels={pl} locale={inviteLocale}
              onSaved={saved => setGuests(list => list.map(g => (g.id === saved.id ? { ...g, ...saved } : g)))} />
          )}
          </div>
        );
      })}
    </>
  );
}

type ProfilePatch = Pick<DirectoryGuest, 'id' | 'name' | 'inviteName' | 'gender' | 'withFamily' | 'companion'>;

/** Inline editor for how one guest is named and addressed, with a live preview. */
function GuestEditor({ guest, labels: l, locale, onSaved }: {
  guest: DirectoryGuest; labels: ProfileLabels; locale: Locale; onSaved: (g: ProfilePatch) => void;
}) {
  const [name, setName] = useState(guest.name);
  const [inviteName, setInviteName] = useState(guest.inviteName ?? '');
  const [gender, setGender] = useState<GuestGender>(guest.gender);
  const [invitedWith, setInvitedWith] = useState<'none' | 'family' | 'wife' | 'spouse'>(guest.companion ?? (guest.withFamily ? 'family' : 'none'));
  const withFamily = invitedWith === 'family';
  const companion = invitedWith === 'wife' || invitedWith === 'spouse' ? invitedWith : null;
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const preview = `${formatGreeting(inviteName.trim() || name.trim() || '…', gender, locale)} — ${formatInviteLine(withFamily, locale, companion)}`;

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    setState('saving');
    const body: ProfilePatch = { id: guest.id, name: name.trim(), inviteName: inviteName.trim() || null, gender, withFamily, companion };
    try {
      const response = await fetch('/api/guests/profile', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error();
      onSaved(body);
      setState('saved');
    } catch {
      setState('error');
    }
  }

  const genders: [GuestGender, string][] = [['male', l.male], ['female', l.female], [null, l.none]];

  return (
    <form className="guest-editor" onSubmit={save}>
      <label className="guest-editor-field">
        <span>{l.nick}</span>
        <input value={name} maxLength={160} required onChange={e => { setName(e.target.value); setState('idle'); }} />
      </label>
      <label className="guest-editor-field">
        <span>{l.inviteName}</span>
        <input value={inviteName} maxLength={160} placeholder={name} onChange={e => { setInviteName(e.target.value); setState('idle'); }} />
        <small>{l.inviteNameHint}</small>
      </label>
      <div className="guest-editor-field">
        <span>{l.gender}</span>
        <div className="guest-editor-segment" role="radiogroup" aria-label={l.gender}>
          {genders.map(([value, label]) => (
            <button key={label} type="button" role="radio" aria-checked={gender === value}
              className={gender === value ? 'is-active' : ''} onClick={() => { setGender(value); setState('idle'); }}>{label}</button>
          ))}
        </div>
      </div>
      <div className="guest-editor-field">
        <span>{l.family}</span>
        <div className="guest-editor-segment" role="radiogroup" aria-label={l.family}>
          {([['none', l.alone], ['family', l.familyBadge], ['wife', l.wife], ['spouse', l.spouse]] as const).map(([value, label]) => (
            <button key={value} type="button" role="radio" aria-checked={invitedWith === value}
              className={invitedWith === value ? 'is-active' : ''} onClick={() => { setInvitedWith(value); setState('idle'); }}>{label}</button>
          ))}
        </div>
      </div>
      <p className="guest-editor-preview"><span>{l.preview}:</span> {preview}</p>
      <div className="guest-editor-actions">
        <button type="submit" className="guest-action guest-action--primary" disabled={state === 'saving' || !name.trim()}>
          {state === 'saving' ? l.saving : l.save}
        </button>
        {state === 'saved' && <span className="guest-editor-ok" role="status"><CheckIcon className="w-3.5 h-3.5" aria-hidden="true" /> {l.saved}</span>}
        {state === 'error' && <span className="guest-editor-err" role="alert">{l.error}</span>}
      </div>
    </form>
  );
}
