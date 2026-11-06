'use client';

import { useEffect, useRef, useState } from 'react';
import { PlayIcon } from '../icons';
import { displayName, musicSourceKey, trackMeta, type Locale, type MusicSource } from './catalog';
import type { Copy } from './copy';
import { music, useMusicSnapshot } from './music-engine';

export const INVITATION_OWNER = 'invitation';

function sourceTitle(source: MusicSource, locale: Locale) {
  if (source.kind === 'track') return trackMeta(source.id).title[locale];
  if (source.kind === 'file') return displayName(source.name);
  return source.title ?? 'YouTube';
}

/** The small round music button shown on every template. */
export default function MusicControl({ source, volume, locale, t, hidden }: {
  source: MusicSource;
  volume: number;
  locale: Locale;
  t: Copy;
  hidden: boolean;
}) {
  const snapshot = useMusicSnapshot();
  const mine = snapshot.owner === INVITATION_OWNER && snapshot.key === musicSourceKey(source);
  const playing = mine && (snapshot.status === 'playing' || snapshot.status === 'starting');
  const blocked = mine && snapshot.status === 'blocked';
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

  const errorLabel = source.kind === 'track' ? t.musicError : t.musicUnavailable;
  const label = failed ? errorLabel : playing ? t.musicPause : blocked ? t.musicTap : t.musicPlay;
  const title = sourceTitle(source, locale);
  // An uploaded file or video that failed can be retried; Web Audio failing means no support.
  const disabled = failed && source.kind === 'track';

  return (
    <div className={`inv-music ${hidden ? 'is-hidden' : ''} ${playing ? 'is-playing' : ''} ${blocked ? 'is-blocked' : ''}`}>
      <span className={`inv-music-title ${(showTitle && playing) || blocked || failed ? 'is-visible' : ''}`} aria-live="polite">
        {failed ? errorLabel : blocked && source.kind === 'file' ? t.musicTap : playing ? title : ''}
      </span>
      <button
        type="button"
        className="inv-music-button"
        onClick={() => music().toggle(source, INVITATION_OWNER, volume)}
        aria-label={label}
        aria-pressed={playing}
        title={label}
        disabled={disabled}
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
