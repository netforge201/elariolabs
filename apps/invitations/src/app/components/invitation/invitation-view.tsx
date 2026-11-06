'use client';

import './invitation.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import { buildModel, type GuestInfo, type InvitationData } from './model';
import { Cover, Hero, OPENING_DURATION } from './templates';
import { Closing, Countdown, Details, Intro, Photo, Story } from './sections';
import MusicControl, { INVITATION_OWNER } from './music-control';
import { music } from './music-engine';
import { musicSourceKey } from './catalog';

export type { InvitationData, GuestInfo } from './model';

/**
 * The single renderer for invitations — used by the public page, personal
 * guest links, the studio live preview and the template thumbnails, so what
 * couples see in the editor is exactly what guests receive.
 *
 * - live:      full page; cover and music control are fixed to the viewport.
 * - preview:   rendered inside the studio device frame; overlays are contained,
 *              calendar actions are inert.
 * - thumbnail: hero only, static, not focusable.
 */
export default function InvitationView({ data, guest, mode = 'live' }: {
  data: InvitationData;
  guest?: GuestInfo | null;
  mode?: 'live' | 'preview' | 'thumbnail';
}) {
  const m = useMemo(() => buildModel(data, guest), [data, guest]);
  const isThumb = mode === 'thumbnail';
  const preview = mode !== 'live';
  const [phase, setPhase] = useState<'closed' | 'opening' | 'open'>(isThumb ? 'open' : 'closed');
  const timer = useRef<number | null>(null);
  const source = m.musicSource;
  const sourceKey = source ? musicSourceKey(source) : null;

  function open() {
    if (phase !== 'closed') return;
    // Started from the tap itself, so browsers allow audio without any workaround.
    if (source) void music().play(source, INVITATION_OWNER, m.musicVolume);
    setPhase('opening');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    timer.current = window.setTimeout(() => setPhase('open'), reduce ? 250 : OPENING_DURATION[m.template]);
  }

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  // Stop this invitation's music when it unmounts (thumbnails never play).
  useEffect(() => {
    if (isThumb) return;
    return () => music().stop(INVITATION_OWNER);
  }, [isThumb]);

  // Load the uploaded file ahead of the guest's tap, so it can start
  // immediately (nothing plays until that tap).
  useEffect(() => {
    if (isThumb || !source || source.kind === 'track') return;
    music().prepare(source);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on the source identity
  }, [sourceKey, isThumb]);

  // In the studio the music can change while it is playing: follow it.
  useEffect(() => {
    if (isThumb) return;
    const s = music().getSnapshot();
    if (s.owner !== INVITATION_OWNER) return;
    if (!source) music().stop(INVITATION_OWNER);
    else if (s.key !== sourceKey && (s.status === 'playing' || s.status === 'starting')) void music().play(source, INVITATION_OWNER, m.musicVolume);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on the source identity
  }, [sourceKey, isThumb]);

  // Volume edits in the studio apply to the invitation that is playing.
  useEffect(() => {
    if (isThumb) return;
    if (music().getSnapshot().owner === INVITATION_OWNER) music().setVolume(m.musicVolume);
  }, [m.musicVolume, isThumb]);

  // Keep the page still while the live cover is showing.
  useEffect(() => {
    if (mode !== 'live' || phase === 'open') return;
    const root = document.documentElement;
    root.classList.add('inv-locked');
    return () => root.classList.remove('inv-locked');
  }, [mode, phase]);

  const Page = mode === 'live' ? 'main' : 'div';

  return (
    <div
      className={`inv-root inv-t-${m.template} inv-mode-${mode} ${phase !== 'closed' ? 'is-open' : ''}`}
      lang={m.locale}
    >
      <div className="inv-scroll" inert={phase === 'closed' || isThumb}>
        <Page className="inv-page">
          <Hero m={m} />
          {!isThumb && (
            <>
              <Intro m={m} />
              <Photo m={m} />
              <Details m={m} preview={preview} />
              <Countdown m={m} />
              <Story m={m} />
              <Closing m={m} />
            </>
          )}
        </Page>
      </div>

      {!isThumb && phase !== 'open' && (
        <Cover m={m} phase={phase} hasMusic={Boolean(source)} focus={mode === 'live'} onOpen={open} />
      )}
      {!isThumb && source && (
        <MusicControl source={source} volume={m.musicVolume} locale={m.locale} t={m.t} hidden={phase === 'closed'} />
      )}
    </div>
  );
}
