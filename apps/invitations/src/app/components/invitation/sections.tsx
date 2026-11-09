'use client';

import { useEffect, useId, useState, type ReactNode } from 'react';
import Reveal from '../reveal';
import {
  AppleIcon, CalendarIcon, CheckIcon, CopyIcon, GoogleCalendarIcon, MapPinIcon, NavigationIcon, TablePlateIcon,
} from '../icons';
import type { GuestRsvp, InvitationModel } from './model';
import { CARPET_TEMPLATES } from './catalog';

const isCarpetTemplate = (id: string) => (CARPET_TEMPLATES as readonly string[]).includes(id);
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
          {/* Carpet designs already print this line in their hero. */}
          {!isCarpetTemplate(m.template) && <p className="inv-greeting-invite">{m.inviteLine}</p>}
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
  // Opens the Waze app on phones (web Waze elsewhere) with a route to the venue.
  const wazeUrl = `https://waze.com/ul?q=${encodeURIComponent(m.address)}&navigate=yes`;

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
                <a className="inv-btn" href={wazeUrl} target="_blank" rel="noreferrer">
                  <NavigationIcon className="inv-btn-icon" aria-hidden="true" />{m.t.waze}
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

/** RSVP on a personal invitation (rendered only when the couple enabled it for this guest). */
export function Rsvp({ m, rsvp, slug, preview }: SectionProps & { rsvp: GuestRsvp; slug: string; preview: boolean }) {
  const headingId = useId();
  const [saved, setSaved] = useState<GuestRsvp>(rsvp);
  const [editing, setEditing] = useState(rsvp.status === null);
  const [attending, setAttending] = useState<boolean | null>(rsvp.status === null ? null : rsvp.status === 'yes');
  const [count, setCount] = useState(rsvp.guests ?? 1);
  const [note, setNote] = useState(rsvp.note ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [justSent, setJustSent] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (attending === null || busy || preview) return;
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, attending, guests: attending ? count : undefined, note: note.trim() || undefined }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.code === 'closed' ? m.t.rsvpClosed : m.t.rsvpError);
      setSaved(result.rsvp as GuestRsvp);
      setEditing(false);
      setJustSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : m.t.rsvpError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Reveal className="inv-section inv-rsvp">
      <section aria-labelledby={headingId}>
        <SectionHeading id={headingId}>{m.t.rsvpTitle}</SectionHeading>

        {!editing && saved.status ? (
          <div className="inv-rsvp-done" role="status">
            {justSent && <p className="inv-rsvp-thanks">{saved.status === 'yes' ? m.t.rsvpThanksYes : m.t.rsvpThanksNo}</p>}
            <span className="inv-label">{m.t.rsvpYour}</span>
            <p className="inv-detail-main">
              {saved.status === 'yes' ? m.t.rsvpYes : m.t.rsvpNo}
              {saved.status === 'yes' && saved.guests ? ` · ${saved.guests} ${m.t.rsvpPeople}` : ''}
            </p>
            {saved.note && <p className="inv-detail-sub inv-rsvp-note-text">“{saved.note}”</p>}
            <div className="inv-actions">
              <button type="button" className="inv-btn" onClick={() => { setEditing(true); setJustSent(false); }}>{m.t.rsvpChange}</button>
            </div>
          </div>
        ) : (
          <form className="inv-rsvp-form" onSubmit={submit}>
            <p className="inv-rsvp-intro">{m.t.rsvpIntro}</p>
            <div className="inv-rsvp-choice" role="radiogroup" aria-label={m.t.rsvpTitle}>
              <button type="button" role="radio" aria-checked={attending === true}
                className={`inv-btn ${attending === true ? 'is-done' : ''}`} onClick={() => setAttending(true)}>
                {attending === true && <CheckIcon className="inv-btn-icon" aria-hidden="true" />}{m.t.rsvpYes}
              </button>
              <button type="button" role="radio" aria-checked={attending === false}
                className={`inv-btn ${attending === false ? 'is-done' : ''}`} onClick={() => setAttending(false)}>
                {attending === false && <CheckIcon className="inv-btn-icon" aria-hidden="true" />}{m.t.rsvpNo}
              </button>
            </div>

            {attending === true && (
              <label className="inv-rsvp-field">
                <span className="inv-label">{m.t.rsvpCount}</span>
                <select value={count} onChange={e => setCount(Number(e.target.value))}>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
            )}

            {attending !== null && (
              <label className="inv-rsvp-field">
                <span className="inv-label">{m.t.rsvpNote}</span>
                <textarea value={note} maxLength={500} rows={3} onChange={e => setNote(e.target.value)} />
              </label>
            )}

            {error && <p className="inv-rsvp-error" role="alert">{error}</p>}

            <div className="inv-actions">
              <button type="submit" className="inv-btn inv-btn--solid" disabled={attending === null || busy || preview}>
                {busy ? m.t.rsvpSending : m.t.rsvpSend}
              </button>
            </div>
          </form>
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
