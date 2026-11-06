'use client';

import { PlayIcon } from '../icons';
import { musicSourceKey, type Locale, type MusicSource } from './catalog';
import type { Copy } from './copy';
import { music, useMusicSnapshot } from './music-engine';

export const INVITATION_OWNER = 'invitation';

/**
 * The small round play/pause button shown on every template. The song itself
 * is never named on the invitation; the pill next to the button only appears
 * when the guest needs to act (playback blocked) or the music failed to load.
 */
export default function MusicControl({ source, volume, t, hidden }: {
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

  const errorLabel = source.kind === 'track' ? t.musicError : t.musicUnavailable;
  const label = failed ? errorLabel : playing ? t.musicPause : blocked ? t.musicTap : t.musicPlay;
  // An uploaded file or video that failed can be retried; Web Audio failing means no support.
  const disabled = failed && source.kind === 'track';

  return (
    <div className={`inv-music ${hidden ? 'is-hidden' : ''} ${playing ? 'is-playing' : ''} ${blocked ? 'is-blocked' : ''}`}>
      <span className={`inv-music-title ${(blocked && source.kind === 'file') || failed ? 'is-visible' : ''}`} aria-live="polite">
        {failed ? errorLabel : blocked && source.kind === 'file' ? t.musicTap : ''}
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
