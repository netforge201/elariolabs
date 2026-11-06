'use client';

import { useEffect, useRef, useState } from 'react';
import { PlayIcon } from '../icons';
import { trackMeta, type Locale, type TrackId } from './catalog';
import type { Copy } from './copy';
import { music, useMusicSnapshot } from './music-engine';

export const INVITATION_OWNER = 'invitation';

export default function MusicControl({ track, locale, t, hidden }: {
  track: TrackId;
  locale: Locale;
  t: Copy;
  hidden: boolean;
}) {
  const snapshot = useMusicSnapshot();
  const mine = snapshot.owner === INVITATION_OWNER && snapshot.trackId === track;
  const playing = mine && (snapshot.status === 'playing' || snapshot.status === 'starting');
  const failed = mine && snapshot.status === 'error';
  const [showTitle, setShowTitle] = useState(false);
  const titleTimer = useRef<number | null>(null);

  // Briefly show the track name whenever playback starts.
  useEffect(() => {
    if (!playing) return;
    setShowTitle(true);
    titleTimer.current = window.setTimeout(() => setShowTitle(false), 3200);
    return () => { if (titleTimer.current) window.clearTimeout(titleTimer.current); };
  }, [playing]);

  const label = failed ? t.musicError : playing ? t.musicPause : t.musicPlay;
  const title = trackMeta(track).title[locale];

  return (
    <div className={`inv-music ${hidden ? 'is-hidden' : ''} ${playing ? 'is-playing' : ''}`}>
      <span className={`inv-music-title ${showTitle && playing ? 'is-visible' : ''}`} aria-live="polite">
        {playing ? title : ''}
      </span>
      <button
        type="button"
        className="inv-music-button"
        onClick={() => music().toggle(track, INVITATION_OWNER)}
        aria-label={label}
        aria-pressed={playing}
        title={label}
        disabled={failed}
        tabIndex={hidden ? -1 : 0}
      >
        <span className="inv-music-ring" aria-hidden="true" />
        {playing ? (
          <span className="inv-music-bars" aria-hidden="true"><i /><i /><i /><i /></span>
        ) : (
          <PlayIcon className="inv-music-play" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
