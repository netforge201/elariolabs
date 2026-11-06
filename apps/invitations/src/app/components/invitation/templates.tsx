// Template-specific compositions: the opening cover and the hero of each design.
// Shared sections (details, countdown, story, …) live in sections.tsx and are themed via CSS.

import type { InvitationModel } from './model';
import { ChevronDown, Flourish, RoseCorner, Sprig } from './ornaments';
import { isCarpetTemplate } from './catalog';
import { KCover, KHero, K_OPENING_DURATION } from './carpet-templates';

type HeroProps = { m: InvitationModel };

function Names({ m, as: Tag = 'h1', className = '' }: { m: InvitationModel; as?: 'h1' | 'p'; className?: string }) {
  return (
    <Tag className={`inv-names inv-names--${m.nameSize} ${className}`}>
      <span className="inv-name">{m.names[0]}</span>
      <span className="inv-amp" aria-hidden="true">&amp;</span>
      <span className="inv-sr"> {m.t.and} </span>
      <span className="inv-name">{m.names[1]}</span>
    </Tag>
  );
}

function ScrollCue({ label }: { label: string }) {
  return (
    <span className="inv-scroll-cue" aria-hidden="true" title={label}>
      <ChevronDown className="inv-scroll-icon" />
    </span>
  );
}

// ---------------------------------------------------------------------------
// Heroes
// ---------------------------------------------------------------------------

function ClassicHero({ m }: HeroProps) {
  return (
    <section className="inv-hero inv-hero--classic">
      <div className="inv-sheet">
        <RoseCorner className="inv-rose inv-rose--tl" />
        <RoseCorner className="inv-rose inv-rose--br" />
        <div className="inv-sheet-frame">
          <div className="inv-monogram inv-rise" aria-hidden="true">
            <span>{m.initials[0]}</span><i>&amp;</i><span>{m.initials[1]}</span>
          </div>
          <p className="inv-eyebrow inv-rise">{m.t.weddingInvitation}</p>
          <Names m={m} className="inv-rise" />
          <Flourish className="inv-flourish inv-rise" />
          {m.date && (
            <p className="inv-hero-date inv-rise">
              <span>{m.date.weekday}</span>
              <strong>{m.date.full}</strong>
              {m.time && <span>{m.time}</span>}
            </p>
          )}
          {m.venueName && <p className="inv-hero-venue inv-rise">{m.venueName}</p>}
        </div>
      </div>
      <ScrollCue label={m.t.scroll} />
    </section>
  );
}

function ModernHero({ m }: HeroProps) {
  return (
    <section className={`inv-hero inv-hero--modern ${m.coverImage ? 'has-photo' : 'no-photo'}`}>
      <div className="inv-modern-media" aria-hidden="true">
        {m.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element -- user uploads are data URLs or arbitrary hosts
          <img src={m.coverImage} alt="" decoding="async" />
        ) : (
          <div className="inv-modern-initials"><span>{m.initials[0]}</span><span>{m.initials[1]}</span></div>
        )}
      </div>
      <div className="inv-modern-scrim" aria-hidden="true" />
      <div className="inv-modern-content">
        <p className="inv-eyebrow inv-rise">{m.t.weddingInvitation}</p>
        <Names m={m} className="inv-rise" />
        {(m.date || m.venueName) && (
          <div className="inv-modern-line inv-rise">
            {m.date && <span className="inv-modern-num">{m.date.numeric}</span>}
            {m.time && <span>{m.time}</span>}
            {m.venueName && <span className="inv-modern-venue">{m.venueName}</span>}
          </div>
        )}
      </div>
      <ScrollCue label={m.t.scroll} />
    </section>
  );
}

function MinimalHero({ m }: HeroProps) {
  return (
    <section className="inv-hero inv-hero--minimal">
      <div className="inv-minimal-top inv-rise">
        <span className="inv-eyebrow">{m.t.weddingInvitation}</span>
        {m.date && <span className="inv-minimal-num">{m.date.numeric}</span>}
      </div>
      <div className="inv-minimal-body">
        <Names m={m} className="inv-rise" />
        <Sprig className="inv-sprig" />
      </div>
      {(m.date || m.venueName) && (
        <div className="inv-minimal-bottom inv-rise">
          {m.date && <span>{m.date.weekday}, {m.date.full}</span>}
          {m.time && <span>{m.time}</span>}
          {m.venueName && <span>{m.venueName}</span>}
        </div>
      )}
      <ScrollCue label={m.t.scroll} />
    </section>
  );
}

export function Hero({ m }: HeroProps) {
  if (isCarpetTemplate(m.template)) return <KHero id={m.template} m={m} />;
  if (m.template === 'modern') return <ModernHero m={m} />;
  if (m.template === 'minimal') return <MinimalHero m={m} />;
  return <ClassicHero m={m} />;
}

// ---------------------------------------------------------------------------
// Opening covers
// ---------------------------------------------------------------------------

type CoverProps = {
  m: InvitationModel;
  phase: 'closed' | 'opening';
  hasMusic: boolean;
  /** Only the live page moves focus; the editor preview must not steal it. */
  focus: boolean;
  onOpen: () => void;
};

function CoverPrompt({ m, hasMusic }: { m: InvitationModel; hasMusic: boolean }) {
  return (
    <span className="inv-cover-prompt">
      <span className="inv-cover-cta">{m.t.open}</span>
      <span className="inv-cover-hint">{hasMusic ? m.t.openHint : m.t.openHintSilent}</span>
    </span>
  );
}

function ClassicCover({ m, phase, hasMusic, focus, onOpen }: CoverProps) {
  return (
    <div className={`inv-cover inv-cover--classic is-${phase}`}>
      <p className="inv-cover-to">{m.greeting ?? m.t.youAreInvited}</p>
      <button type="button" className="inv-cover-button" onClick={onOpen} disabled={phase !== 'closed'} autoFocus={focus}>
        <span className="inv-envelope" aria-hidden="true">
          <span className="inv-envelope-back" />
          <span className="inv-envelope-card">
            <span className="inv-envelope-card-names">{m.names[0]} <i>&amp;</i> {m.names[1]}</span>
          </span>
          <span className="inv-envelope-pocket" />
          <span className="inv-envelope-flap" />
          <span className="inv-envelope-seal"><span>{m.initials[0]}</span><i>&amp;</i><span>{m.initials[1]}</span></span>
        </span>
        <CoverPrompt m={m} hasMusic={hasMusic} />
      </button>
    </div>
  );
}

function ModernCover({ m, phase, hasMusic, focus, onOpen }: CoverProps) {
  return (
    <div className={`inv-cover inv-cover--modern is-${phase}`}>
      <span className="inv-curtain inv-curtain--top" aria-hidden="true" />
      <span className="inv-curtain inv-curtain--bottom" aria-hidden="true" />
      <div className="inv-cover-stage">
        <p className="inv-cover-to">{m.greeting ?? m.t.youAreInvited}</p>
        <Names m={m} as="p" className="inv-cover-names" />
        <span className="inv-cover-rule" aria-hidden="true" />
        <button type="button" className="inv-cover-button" onClick={onOpen} disabled={phase !== 'closed'} autoFocus={focus}>
          <CoverPrompt m={m} hasMusic={hasMusic} />
        </button>
      </div>
    </div>
  );
}

function MinimalCover({ m, phase, hasMusic, focus, onOpen }: CoverProps) {
  return (
    <div className={`inv-cover inv-cover--minimal is-${phase}`}>
      <div className="inv-cover-stage">
        <Sprig className="inv-cover-sprig" />
        <p className="inv-cover-to">{m.greeting ?? m.t.youAreInvited}</p>
        <Names m={m} as="p" className="inv-cover-names" />
        <button type="button" className="inv-cover-button" onClick={onOpen} disabled={phase !== 'closed'} autoFocus={focus}>
          <CoverPrompt m={m} hasMusic={hasMusic} />
        </button>
      </div>
    </div>
  );
}

export function Cover(props: CoverProps) {
  if (isCarpetTemplate(props.m.template)) return <KCover id={props.m.template} {...props} />;
  if (props.m.template === 'modern') return <ModernCover {...props} />;
  if (props.m.template === 'minimal') return <MinimalCover {...props} />;
  return <ClassicCover {...props} />;
}

/** How long each opening takes before the cover is removed (ms). */
export const OPENING_DURATION = {
  classic: 1650, modern: 1250, minimal: 1000,
  carpet: K_OPENING_DURATION, buta: K_OPENING_DURATION, palace: K_OPENING_DURATION,
  asymmetric: K_OPENING_DURATION, garden: K_OPENING_DURATION, heritage: K_OPENING_DURATION,
} as const;
