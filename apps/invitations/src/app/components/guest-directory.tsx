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
  gender: GuestGender;
  withFamily: boolean;
};

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
  edit: string; close: string; nick: string; inviteName: string; inviteNameHint: string;
  gender: string; male: string; female: string; none: string; family: string; preview: string;
  save: string; saving: string; saved: string; error: string; familyBadge: string; inviteAs: string;
};

/** The name a guest actually sees (the couple's nickname stays private). */
const shownName = (g: { name: string; inviteName: string | null }) => g.inviteName?.trim() || g.name;

/** Guest rows with search, copy, native share and the per-guest RSVP switch. */
export default function GuestDirectory({ guests: initial, labels, rsvpLabels: r, profileLabels: pl, inviteLocale }: {
  guests: DirectoryGuest[]; labels: DirectoryLabels; rsvpLabels: RsvpLabels;
  profileLabels: ProfileLabels; inviteLocale: Locale;
}) {
  const [guests, setGuests] = useState(initial);
  const [query, setQuery] = useState('');
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
  const visible = needle
    ? guests.filter(guest => `${guest.name} ${guest.inviteName ?? ''}`.toLocaleLowerCase().includes(needle))
    : guests;
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
                  {guest.withFamily && <span className="guest-badge">{pl.familyBadge}</span>}
                  {status && <span className={`guest-rsvp-status ${status.cls}`}>{status.text}</span>}
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

type ProfilePatch = Pick<DirectoryGuest, 'id' | 'name' | 'inviteName' | 'gender' | 'withFamily'>;

/** Inline editor for how one guest is named and addressed, with a live preview. */
function GuestEditor({ guest, labels: l, locale, onSaved }: {
  guest: DirectoryGuest; labels: ProfileLabels; locale: Locale; onSaved: (g: ProfilePatch) => void;
}) {
  const [name, setName] = useState(guest.name);
  const [inviteName, setInviteName] = useState(guest.inviteName ?? '');
  const [gender, setGender] = useState<GuestGender>(guest.gender);
  const [withFamily, setWithFamily] = useState(guest.withFamily);
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const preview = `${formatGreeting(inviteName.trim() || name.trim() || '…', gender, locale)} — ${formatInviteLine(withFamily, locale)}`;

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    setState('saving');
    const body: ProfilePatch = { id: guest.id, name: name.trim(), inviteName: inviteName.trim() || null, gender, withFamily };
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
      <button type="button" role="switch" aria-checked={withFamily}
        className={`guest-rsvp-switch ${withFamily ? 'is-on' : ''}`} onClick={() => { setWithFamily(!withFamily); setState('idle'); }}>
        <span className="guest-rsvp-track" aria-hidden="true"><i /></span>
        <span>{l.family}</span>
      </button>
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
