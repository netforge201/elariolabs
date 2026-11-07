'use client';

import { useEffect, useState } from 'react';
import { CheckIcon } from './icons';

type Guest = { id: string; name: string; slug: string };
type Labels = { send: string; copy: string; copied: string; shareText: string };

/** The overview's "latest guests" tile: share on phones, copy elsewhere. */
export default function RecentGuests({ guests, labels }: { guests: Guest[]; labels: Labels }) {
  const [canShare, setCanShare] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Detected after mount so the server markup and the first client render match.
  useEffect(() => {
    setCanShare(typeof navigator.share === 'function' && window.matchMedia('(pointer: coarse)').matches);
  }, []);

  const urlFor = (slug: string) => `${window.location.origin}/guest/${slug}`;

  async function copy(guest: Guest) {
    try {
      await navigator.clipboard.writeText(urlFor(guest.slug));
      setCopiedId(guest.id);
      window.setTimeout(() => setCopiedId(current => (current === guest.id ? null : current)), 2000);
    } catch { /* clipboard unavailable */ }
  }

  async function act(guest: Guest) {
    if (!canShare) return copy(guest);
    try {
      await navigator.share({ text: `${guest.name}, ${labels.shareText}`, url: urlFor(guest.slug) });
    } catch (err) {
      if (!(err instanceof DOMException && err.name === 'AbortError')) void copy(guest);
    }
  }

  return (
    <ul className="bx-guest-list">
      {guests.map(guest => (
        <li key={guest.id}>
          <span className="bx-initial" aria-hidden="true">{guest.name.trim().charAt(0).toLocaleUpperCase()}</span>
          <span className="bx-guest-name">{guest.name}</span>
          <button type="button" className="bx-chip" onClick={() => void act(guest)} aria-live="polite">
            {copiedId === guest.id
              ? <><CheckIcon className="w-3.5 h-3.5" aria-hidden="true" /> {labels.copied}</>
              : canShare ? labels.send : labels.copy}
          </button>
        </li>
      ))}
    </ul>
  );
}
