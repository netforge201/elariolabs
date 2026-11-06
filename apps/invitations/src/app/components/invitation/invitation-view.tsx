'use client';

import './invitation.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import { buildModel, type GuestInfo, type InvitationData } from './model';
import { Cover, Hero, OPENING_DURATION } from './templates';
import { Closing, Countdown, Details, Intro, Photo, Rsvp, Story } from './sections';
import MusicControl, { INVITATION_OWNER } from './music-control';
import { music } from './music-engine';

export type { InvitationData, GuestInfo } from './model';

/**
 * The single renderer for invitations — used by the public page, personal
 * guest links, the studio live preview and the template thumbnails, so what
 * couples see in the editor is exactly what guests receive.
 *
 * - live:      full page; cover and music control are fixed to the viewport.
 * - preview:   rendered inside the studio device frame; overlays are contained,
 *              RSVP/calendar actions are inert so nothing is written.
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
  const track = m.music === 'none' ? null : m.music;

  function open() {
    if (phase !== 'closed') return;
    // Started from the tap itself, so browsers allow audio without any workaround.
    if (track) void music().play(track, INVITATION_OWNER);
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

  // In the studio the track can change while it is playing: follow it.
  useEffect(() => {
    if (isThumb) return;
    const s = music().getSnapshot();
    if (s.owner !== INVITATION_OWNER) return;
    if (!track) music().stop(INVITATION_OWNER);
    else if (s.trackId !== track && (s.status === 'playing' || s.status === 'starting')) void music().play(track, INVITATION_OWNER);
  }, [track, isThumb]);

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
              <Rsvp m={m} preview={preview} />
              <Closing m={m} />
            </>
          )}
        </Page>
      </div>

      {!isThumb && phase !== 'open' && (
        <Cover m={m} phase={phase} hasMusic={Boolean(track)} focus={mode === 'live'} onOpen={open} />
      )}
      {!isThumb && track && (
        <MusicControl track={track} locale={m.locale} t={m.t} hidden={phase === 'closed'} />
      )}
    </div>
  );
}
