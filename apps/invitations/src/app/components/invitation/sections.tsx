'use client';

import { useEffect, useId, useState, type FormEvent, type ReactNode } from 'react';
import Reveal from '../reveal';
import {
  AppleIcon, CalendarIcon, CheckIcon, CopyIcon, GoogleCalendarIcon, MapPinIcon, TablePlateIcon,
} from '../icons';
import type { InvitationModel } from './model';
import { eventInstant, googleCalendarUrl, icsFile, monthGrid } from './event-time';
import { Flourish } from './ornaments';

type SectionProps = { m: InvitationModel };

function SectionHeading({ id, children }: { id: string; children: ReactNode }) {
  return (
    <header className="inv-section-head">
      <h2 id={id} className="inv-section-title">{children}</h2>
      <Flourish className="inv-section-flourish" />
    </header>
  );
}

// ---------------------------------------------------------------------------

export function Intro({ m }: SectionProps) {
  return (
    <Reveal className="inv-section inv-intro">
      {m.greeting && (
        <div className="inv-greeting">
          <span className="inv-label">{m.t.personalInvitation}</span>
          <p className="inv-greeting-name">{m.greeting}</p>
        </div>
      )}
      <p className="inv-welcome">{m.welcome}</p>
      {m.tableLabel && (
        <div className="inv-table">
          <TablePlateIcon className="inv-table-icon" aria-hidden="true" />
          <div>
            <span className="inv-label">{m.t.tableReserved}</span>
            <p>
              <strong>{m.tableLabel}</strong>
              {m.seatNumber ? <span> · {m.t.seat} {m.seatNumber}</span> : null}
            </p>
          </div>
        </div>
      )}
    </Reveal>
  );
}

export function Photo({ m }: SectionProps) {
  if (!m.coverImage || m.template === 'modern') return null;
  return (
    <Reveal className="inv-section inv-photo">
      <figure className="inv-photo-frame">
        {/* eslint-disable-next-line @next/next/no-img-element -- user uploads are data URLs or arbitrary hosts */}
        <img src={m.coverImage} alt={`${m.names[0]} ${m.t.and} ${m.names[1]}`} loading="lazy" decoding="async" />
      </figure>
    </Reveal>
  );
}

// ---------------------------------------------------------------------------

function MonthCalendar({ m }: SectionProps) {
  if (!m.day) return null;
  const grid = monthGrid(m.day, m.locale);
  return (
    <div className="inv-month" aria-hidden="true">
      <p className="inv-month-title">{grid.monthTitle}</p>
      <div className="inv-month-grid">
        {grid.weekdays.map(w => <span key={w} className="inv-month-wd">{w}</span>)}
        {grid.cells.map((cell, i) => (
          <span key={i} className={cell === grid.highlighted ? 'inv-month-day is-day' : 'inv-month-day'}>
            {cell ?? ''}
          </span>
        ))}
      </div>
    </div>
  );
}

export function Details({ m, preview }: SectionProps & { preview: boolean }) {
  const headingId = useId();
  const [copied, setCopied] = useState(false);
  const hasVenue = Boolean(m.venueName || m.venueAddress);
  if (!m.date && !m.time && !hasVenue) return null;

  const title = `${m.names[0]} & ${m.names[1]}`;
  const event = {
    title: `${title} — ${m.t.weddingInvitation}`,
    description: m.welcome,
    location: m.address,
    day: m.day ?? '',
    time: m.time,
    timeZone: m.timezone,
  };
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(m.address)}`;

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(m.address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch { /* clipboard unavailable: the address stays visible on screen */ }
  }

  function downloadIcs() {
    const blob = new Blob([icsFile(event)], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^\p{L}\p{N}]+/gu, '-').toLowerCase()}.ics`;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <Reveal className="inv-section inv-details">
      <section aria-labelledby={headingId}>
        <SectionHeading id={headingId}>{m.t.celebration}</SectionHeading>
        <div className="inv-details-grid">
          {m.date && (
            <div className="inv-detail inv-detail--date">
              <span className="inv-label">{m.t.date}</span>
              {m.template === 'modern' ? (
                <p className="inv-bigdate" aria-hidden="true">
                  <strong>{m.date.day}</strong>
                  <span>{m.date.month}<br />{m.date.year}</span>
                </p>
              ) : (
                <MonthCalendar m={m} />
              )}
              <p className="inv-detail-main">{m.date.weekday}, {m.date.full}</p>
            </div>
          )}
          {m.time && (
            <div className="inv-detail inv-detail--time">
              <span className="inv-label">{m.t.time}</span>
              <p className="inv-detail-big">{m.time}</p>
            </div>
          )}
          {hasVenue && (
            <div className="inv-detail inv-detail--venue">
              <span className="inv-label">{m.t.venue}</span>
              {m.venueName && <p className="inv-detail-main inv-venue-name">{m.venueName}</p>}
              {m.venueAddress && <p className="inv-detail-sub">{m.venueAddress}</p>}
              <div className="inv-actions">
                <a className="inv-btn" href={mapUrl} target="_blank" rel="noreferrer">
                  <MapPinIcon className="inv-btn-icon" aria-hidden="true" />{m.t.map}
                </a>
                <button type="button" className={`inv-btn ${copied ? 'is-done' : ''}`} onClick={copyAddress}>
                  {copied ? <CheckIcon className="inv-btn-icon" aria-hidden="true" /> : <CopyIcon className="inv-btn-icon" aria-hidden="true" />}
                  <span aria-live="polite">{copied ? m.t.copied : m.t.copyAddress}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {m.day && (
          <div className="inv-calendar-actions" role="group" aria-label={m.t.addToCalendar}>
            <span className="inv-label"><CalendarIcon className="inv-btn-icon" aria-hidden="true" />{m.t.addToCalendar}</span>
            <div className="inv-actions">
              <a className="inv-btn" href={googleCalendarUrl(event)} target="_blank" rel="noreferrer"
                onClick={preview ? e => e.preventDefault() : undefined}>
                <GoogleCalendarIcon className="inv-btn-icon" aria-hidden="true" />{m.t.googleCalendar}
              </a>
              <button type="button" className="inv-btn" onClick={preview ? undefined : downloadIcs}>
                <AppleIcon className="inv-btn-icon" aria-hidden="true" />{m.t.appleCalendar}
              </button>
            </div>
          </div>
        )}
      </section>
    </Reveal>
  );
}

// ---------------------------------------------------------------------------

function remaining(target: number) {
  const diff = Math.max(0, target - Date.now());
  return [
    Math.floor(diff / 86_400_000),
    Math.floor(diff / 3_600_000) % 24,
    Math.floor(diff / 60_000) % 60,
    Math.floor(diff / 1000) % 60,
  ];
}

export function Countdown({ m }: SectionProps) {
  const target = m.day ? eventInstant(m.day, m.time, m.timezone).getTime() : 0;
  // Rendered only after mount so server and client markup always match.
  const [values, setValues] = useState<number[] | null>(null);

  useEffect(() => {
    if (!target) return;
    const update = () => setValues(remaining(target));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [target]);

  if (!target || (values && values.every(v => v === 0))) return null;

  return (
    <Reveal className="inv-section inv-countdown">
      <p className="inv-label">{m.t.countdown}</p>
      <div className="inv-count" role="timer" aria-live="off">
        {m.t.units.map((unit, i) => (
          <div key={unit} className="inv-count-cell">
            <strong>{values ? String(values[i]).padStart(2, '0') : '––'}</strong>
            <span>{unit}</span>
          </div>
        ))}
      </div>
    </Reveal>
  );
}

export function Story({ m }: SectionProps) {
  const headingId = useId();
  if (!m.story) return null;
  return (
    <Reveal className="inv-section inv-story">
      <section aria-labelledby={headingId}>
        <SectionHeading id={headingId}>{m.t.ourStory}</SectionHeading>
        <p className="inv-story-text">{m.story}</p>
      </section>
    </Reveal>
  );
}

// ---------------------------------------------------------------------------

type Saved = { attending: boolean; guestsCount: number; name: string };

function storageKey(m: InvitationModel) {
  return `inv-rsvp:${m.slug}:${m.guest?.slug ?? ''}`;
}

export function Rsvp({ m, preview }: SectionProps & { preview: boolean }) {
  const headingId = useId();
  const [name, setName] = useState(m.guest?.name ?? '');
  const [attending, setAttending] = useState<boolean | null>(null);
  const [count, setCount] = useState(1);
  const [wishes, setWishes] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    if (preview || !m.slug) return;
    try {
      const raw = window.localStorage.getItem(storageKey(m));
      if (!raw) return;
      const saved = JSON.parse(raw) as Saved;
      setAttending(saved.attending);
      setCount(saved.guestsCount || 1);
      if (saved.name) setName(saved.name);
      setStatus('done');
    } catch { /* storage unavailable */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview, m.slug, m.guest?.slug]);

  if (!m.slug && !preview) return null;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (preview || attending === null) return;
    if (!name.trim()) { setError(m.t.rsvpNameRequired); return; }
    setStatus('sending');
    setError('');
    try {
      const response = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weddingSlug: m.slug,
          guestName: name.trim(),
          guestSlug: m.guest?.slug,
          attending,
          guestsCount: attending ? count : 1,
          message: wishes.trim() || undefined,
        }),
      });
      if (!response.ok) throw new Error();
      try {
        window.localStorage.setItem(storageKey(m), JSON.stringify({ attending, guestsCount: count, name: name.trim() } satisfies Saved));
      } catch { /* storage unavailable */ }
      setStatus('done');
    } catch {
      setStatus('error');
      setError(m.t.rsvpError);
    }
  }

  return (
    <Reveal className="inv-section inv-rsvp">
      <section aria-labelledby={headingId}>
        <SectionHeading id={headingId}>{m.t.rsvpTitle}</SectionHeading>

        {status === 'done' ? (
          <div className="inv-rsvp-done" role="status">
            <span className="inv-rsvp-done-mark" aria-hidden="true"><CheckIcon className="inv-btn-icon" /></span>
            <p className="inv-rsvp-done-title">{attending ? m.t.rsvpThanksYes : m.t.rsvpThanksNo}</p>
            <p className="inv-detail-sub">{m.t.rsvpThanksSub}</p>
            <button type="button" className="inv-link-btn" onClick={() => setStatus('idle')}>{m.t.changeAnswer}</button>
          </div>
        ) : (
          <form className="inv-rsvp-form" onSubmit={submit} noValidate>
            <p className="inv-rsvp-sub">{m.t.rsvpSubtitle}</p>

            <div className="inv-choice" role="radiogroup" aria-label={m.t.rsvpTitle}>
              {[true, false].map(value => (
                <label key={String(value)} className={`inv-choice-option ${attending === value ? 'is-selected' : ''}`}>
                  <input type="radio" name="attending" checked={attending === value} onChange={() => setAttending(value)} />
                  <span className="inv-choice-dot" aria-hidden="true" />
                  <span>{value ? m.t.willAttend : m.t.willNotAttend}</span>
                </label>
              ))}
            </div>

            <label className="inv-field">
              <span className="inv-label">{m.t.yourName}</span>
              <input value={name} onChange={e => setName(e.target.value)} maxLength={100} autoComplete="name" required />
            </label>

            {attending && (
              <div className="inv-field">
                <span className="inv-label" id={`${headingId}-count`}>{m.t.guestsCount}</span>
                <div className="inv-stepper" role="group" aria-labelledby={`${headingId}-count`}>
                  <button type="button" onClick={() => setCount(c => Math.max(1, c - 1))} disabled={count <= 1} aria-label={m.t.fewer}>−</button>
                  <output aria-live="polite">{count}</output>
                  <button type="button" onClick={() => setCount(c => Math.min(10, c + 1))} disabled={count >= 10} aria-label={m.t.more}>+</button>
                </div>
              </div>
            )}

            <label className="inv-field">
              <span className="inv-label">{m.t.wishes} <small>({m.t.optional})</small></span>
              <textarea value={wishes} onChange={e => setWishes(e.target.value)} maxLength={500} rows={3} />
            </label>

            {error && <p className="inv-rsvp-error" role="alert">{error}</p>}

            <button type="submit" className="inv-btn inv-btn--primary" disabled={preview || attending === null || status === 'sending'}>
              {status === 'sending' ? m.t.sending : m.t.sendRsvp}
            </button>
            {preview && <p className="inv-rsvp-note">{m.t.rsvpPreview}</p>}
          </form>
        )}
      </section>
    </Reveal>
  );
}

// ---------------------------------------------------------------------------

export function Closing({ m }: SectionProps) {
  return (
    <footer className="inv-closing">
      <Reveal>
        <p className="inv-closing-text">{m.t.footer}</p>
        <p className="inv-closing-sign">{m.t.withLove},</p>
        <p className="inv-closing-names">{m.names[0]} <i>&amp;</i> {m.names[1]}</p>
        {m.date && <p className="inv-closing-date">{m.date.numeric}</p>}
      </Reveal>
    </footer>
  );
}
