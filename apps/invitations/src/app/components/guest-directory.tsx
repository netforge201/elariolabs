'use client';

import { useEffect, useState } from 'react';
import { ArrowUpRightIcon, CheckIcon, CopyIcon } from './icons';

export type DirectoryGuest = { id: string; name: string; slug: string };

export type DirectoryLabels = {
  open: string; copy: string; copied: string; share: string;
  search: string; noMatch: string; shareText: string; guestColumn: string; linkColumn: string;
};

/** Guest rows with search, copy and native share (WhatsApp/Telegram on phones). */
export default function GuestDirectory({ guests, labels }: { guests: DirectoryGuest[]; labels: DirectoryLabels }) {
  const [query, setQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [canShare, setCanShare] = useState(false);

  // Detected after mount so the server markup and the first client render match.
  useEffect(() => {
    setCanShare(typeof navigator.share === 'function' && window.matchMedia('(pointer: coarse)').matches);
  }, []);

  const needle = query.trim().toLocaleLowerCase();
  const visible = needle ? guests.filter(guest => guest.name.toLocaleLowerCase().includes(needle)) : guests;
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
      await navigator.share({ text: `${guest.name}, ${labels.shareText}`, url: urlFor(guest.slug) });
    } catch (err) {
      if (!(err instanceof DOMException && err.name === 'AbortError')) void copy(guest);
    }
  }

  return (
    <>
      {guests.length > 6 && (
        <div className="guests-search">
          <input type="search" value={query} onChange={event => setQuery(event.target.value)}
            placeholder={labels.search} aria-label={labels.search} />
        </div>
      )}
      <div className="guests-table-labels"><span>{labels.guestColumn}</span><span>{labels.linkColumn}</span><span /></div>
      {visible.length === 0 && <p className="guests-no-match">{labels.noMatch}</p>}
      {visible.map(guest => {
        const index = guests.indexOf(guest);
        return (
          <div key={guest.id} className="guests-table-row">
            <div className="guest-identity">
              <span className="guest-number">{String(index + 1).padStart(2, '0')}</span>
              <strong>{guest.name}</strong>
            </div>
            <span className="guest-link-text">/guest/{guest.slug}</span>
            <div className="guest-row-actions">
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
        );
      })}
    </>
  );
}
