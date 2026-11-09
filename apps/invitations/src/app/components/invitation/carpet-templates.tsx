// The Azerbaijani carpet & buta collection: six heroes and their opening cover.
//
// Each design is its own composition (border structure, ornament placement,
// background), built from the shared vector ornaments in carpet-ornaments.tsx.
// They plug into the same renderer as the original three designs: the content
// comes from the InvitationModel, and the sections below the hero (details,
// countdown, story, …) are the shared ones, themed in invitation.css.

import './carpet-templates.css';
import type { CarpetTemplateId } from './catalog';
import type { InvitationModel } from './model';
import { CalendarIcon, MapPinIcon } from '../icons';
import { ChevronDown } from './ornaments';
import { Art, Band, CarpetFrame, LancetCap, OgeeCap, frameSize, type FrameLayer } from './carpet-ornaments';
import type { ArtName, TileName } from './carpet-art';

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

/** The invitation text block shared by all six designs (styled per design). */
function KText({ m, className = '' }: HeroProps & { className?: string }) {
  return (
    <div className={`kx-text ${className}`}>
      <p className="inv-eyebrow kx-eyebrow inv-rise">{m.t.weddingInvitation}</p>
      <Names m={m} className="kx-names inv-rise" />
      <Art name="divider" className="kx-divider inv-rise" />
      <p className="kx-invite inv-rise">{m.inviteLine}</p>
      {(m.date || m.time) && (
        <p className="kx-meta kx-date inv-rise">
          <CalendarIcon className="kx-icon" aria-hidden="true" />
          <span>
            {m.date && <><span className="kx-weekday">{m.date.weekday}</span> <strong>{m.date.full}</strong></>}
            {m.time && <span className="kx-time">{m.date ? ' · ' : ''}{m.time}</span>}
          </span>
        </p>
      )}
      {m.venueName && (
        <p className="kx-meta kx-venue inv-rise">
          <MapPinIcon className="kx-icon" aria-hidden="true" />
          <span>{m.venueName}</span>
        </p>
      )}
    </div>
  );
}

function ScrollCue({ label }: { label: string }) {
  return (
    <span className="inv-scroll-cue" aria-hidden="true" title={label}>
      <ChevronDown className="inv-scroll-icon" />
    </span>
  );
}

/** Hero shell: the invitation card centred on the template's ground. */
function Shell({ id, m, children }: { id: CarpetTemplateId; m: InvitationModel; children: React.ReactNode }) {
  return (
    <section className={`inv-hero inv-hero--k kx-hero--${id}`}>
      <div className={`kx-card kx-card--${id}`}>{children}</div>
      <ScrollCue label={m.t.scroll} />
    </section>
  );
}

// ---------------------------------------------------------------------------
// 4 · Carpet Frame — three woven borders, star corners, göl medallions and
//     quarter-göl spandrels around a stepped cream field
// ---------------------------------------------------------------------------

const CARPET_FRAME: FrameLayer[] = [
  { kind: 'reciprocal', knot: 1 }, { kind: 'octagons', knot: 1.5 }, { kind: 'sChain', knot: 1 },
];

function CarpetHero({ m }: HeroProps) {
  return (
    <Shell id="carpet" m={m}>
      <div className="kx-carpet" style={{ ['--kx-frame' as string]: `${frameSize(CARPET_FRAME)}px` }}>
        <CarpetFrame layers={CARPET_FRAME} corners={[1]} />
        <div className="kx-field-wrap"><div className="kx-field" /></div>
        {(['tl', 'tr', 'bl', 'br'] as const).map(c => <Art key={c} name="spandrel" className={`kx-spandrel kx-spandrel--${c}`} />)}
        <Art name="golHooked" className="kx-medallion kx-medallion--top" />
        <Art name="golHooked" className="kx-medallion kx-medallion--bottom" />
      </div>
      <KText m={m} />
    </Shell>
  );
}

// ---------------------------------------------------------------------------
// 5 · Buta Elegance — a floral buta and a balalı buta in opposite corners,
//     islimi vines along the other two edges, deep navy
// ---------------------------------------------------------------------------

function ButaHero({ m }: HeroProps) {
  return (
    <Shell id="buta" m={m}>
      <div className="kx-ornaments" aria-hidden="true">
        <Art name="butaBalali" className="kx-buta kx-buta--tr" />
        <Art name="butaFloral" className="kx-buta kx-buta--bl" />
        <Art name="vine" className="kx-vine kx-vine--tl" />
        <Art name="vine" className="kx-vine kx-vine--br" />
      </div>
      <KText m={m} />
    </Shell>
  );
}

// ---------------------------------------------------------------------------
// 6 · Oriental Palace — Kuba lattice field, barber-pole and star guards,
//     a cream ogee arch with a hanging pendant and göl crown and base
// ---------------------------------------------------------------------------

const PALACE_FRAME: FrameLayer[] = [{ kind: 'barber', knot: 1.5 }, { kind: 'starGuard', knot: 1 }];

function PalaceHero({ m }: HeroProps) {
  return (
    <Shell id="palace" m={m}>
      <Band kind="lattice" knot={1.5} className="kx-ground" />
      <CarpetFrame layers={PALACE_FRAME} corners={[0]} />
      <div className="kx-arch">
        <OgeeCap className="kx-cap" />
        <div className="kx-arch-body" />
      </div>
      <Art name="pendant" className="kx-pendant" />
      <Art name="golSmall" className="kx-medallion kx-medallion--crown" />
      <Art name="golSmall" className="kx-medallion kx-medallion--base" />
      <KText m={m} className="kx-text--arch" />
    </Shell>
  );
}

// ---------------------------------------------------------------------------
// 7 · Traditional Asymmetric — a woven boteh-field strip with göl medallions
//     down one edge, a large floral buta rising from the corner, burgundy
// ---------------------------------------------------------------------------

function AsymmetricHero({ m }: HeroProps) {
  return (
    <Shell id="asymmetric" m={m}>
      <div className="kx-strip-panel" aria-hidden="true">
        <Band kind="boteh" knot={1.5} className="kx-strip-field" />
        <Band kind="reciprocal" knot={1} vertical className="kx-strip-guard" />
        <Art name="golSmall" className="kx-strip-medallion kx-strip-medallion--1" />
        <Art name="golSmall" className="kx-strip-medallion kx-strip-medallion--2" />
      </div>
      <Art name="butaFloral" className="kx-buta kx-buta--anchor" />
      <div className="kx-counter" aria-hidden="true">
        <Art name="butaSmall" className="kx-counter-buta" />
        <span className="kx-counter-rule" />
      </div>
      <KText m={m} className="kx-text--offset" />
    </Shell>
  );
}

// ---------------------------------------------------------------------------
// 8 · Buta Garden — ivory, four mirrored corner sprays with butas, a buta
//     pair crowning the top, a palmette crest below
// ---------------------------------------------------------------------------

function GardenHero({ m }: HeroProps) {
  return (
    <Shell id="garden" m={m}>
      <div className="kx-rule" aria-hidden="true" />
      <div className="kx-ornaments" aria-hidden="true">
        {(['tl', 'tr', 'bl', 'br'] as const).map(c => <Art key={c} name="cornerGarden" className={`kx-corner-spray kx-corner-spray--${c}`} />)}
        <Art name="butaPair" className="kx-crown" />
        <Art name="crest" className="kx-crest" />
      </div>
      <KText m={m} />
    </Shell>
  );
}

// ---------------------------------------------------------------------------
// 9 · Azerbaijani Heritage — star guard, Shirvan wine-glass border and
//     reciprocal guard around a star field; a green lancet arch crowned by the
//     octagonal star göl, a row of woven butas at its base
// ---------------------------------------------------------------------------

const HERITAGE_FRAME: FrameLayer[] = [
  { kind: 'starGuard', knot: 1 }, { kind: 'wineGlass', knot: 1.5 }, { kind: 'reciprocal', knot: 1 },
];

function HeritageHero({ m }: HeroProps) {
  return (
    <Shell id="heritage" m={m}>
      <div className="kx-heritage" style={{ ['--kx-frame' as string]: `${frameSize(HERITAGE_FRAME)}px` }}>
        <Band kind="stars" knot={1.5} className="kx-ground" />
        <CarpetFrame layers={HERITAGE_FRAME} corners={[1]} />
        <div className="kx-arch">
          <LancetCap className="kx-cap" />
          <div className="kx-arch-body" />
        </div>
        <Art name="golStar" className="kx-medallion kx-medallion--crown" />
        <div className="kx-woven-row" aria-hidden="true">
          {Array.from({ length: 5 }, (_, i) => <Art key={i} name="butaWoven" className={`kx-woven ${i % 2 ? 'is-flipped' : ''}`} />)}
        </div>
      </div>
      <KText m={m} className="kx-text--arch" />
    </Shell>
  );
}

const HEROES: Record<CarpetTemplateId, (p: HeroProps) => React.JSX.Element> = {
  carpet: CarpetHero,
  buta: ButaHero,
  palace: PalaceHero,
  asymmetric: AsymmetricHero,
  garden: GardenHero,
  heritage: HeritageHero,
};

export function KHero({ id, m }: HeroProps & { id: CarpetTemplateId }) {
  const Hero = HEROES[id];
  return <Hero m={m} />;
}

// ---------------------------------------------------------------------------
// Opening cover: two woven doors part to reveal the invitation
// ---------------------------------------------------------------------------

/** Which woven field each design's doors are made of (null = plain ground with a buta). */
const DOOR: Record<CarpetTemplateId, TileName | null> = {
  carpet: 'octagons',
  buta: null,
  palace: 'lattice',
  asymmetric: 'boteh',
  garden: null,
  heritage: 'stars',
};
const DOOR_BUTA: Partial<Record<CarpetTemplateId, ArtName>> = { buta: 'butaFloral', garden: 'butaSmall' };
const COVER_MEDALLION: Record<CarpetTemplateId, ArtName> = {
  carpet: 'golHooked', buta: 'golSmall', palace: 'golSmall', asymmetric: 'golSmall', garden: 'golSmall', heritage: 'golStar',
};

export function KCover({ id, m, phase, hasMusic, focus, onOpen }: {
  id: CarpetTemplateId;
  m: InvitationModel;
  phase: 'closed' | 'opening';
  hasMusic: boolean;
  focus: boolean;
  onOpen: () => void;
}) {
  const door = DOOR[id];
  return (
    <div className={`inv-cover inv-cover--k kx-cover--${id} is-${phase}`}>
      {(['left', 'right'] as const).map(side => (
        <span key={side} className={`kx-door kx-door--${side}`} aria-hidden="true">
          {door ? <Band kind={door} knot={1.5} className="kx-door-field" /> : <Art name={DOOR_BUTA[id] ?? 'butaFloral'} className="kx-door-buta" />}
          <span className="kx-door-edge" />
        </span>
      ))}
      <div className="kx-cover-plaque">
        <Art name={COVER_MEDALLION[id]} className="kx-cover-medallion" />
        <p className="inv-cover-to">{m.greeting ?? m.t.youAreInvited}</p>
        <Names m={m} as="p" className="inv-cover-names kx-cover-names" />
        <button type="button" className="inv-cover-button" onClick={onOpen} disabled={phase !== 'closed'} autoFocus={focus}>
          <span className="inv-cover-prompt">
            <span className="inv-cover-cta">{m.t.open}</span>
            <span className="inv-cover-hint">{hasMusic ? m.t.openHint : m.t.openHintSilent}</span>
          </span>
        </button>
      </div>
    </div>
  );
}

/** Doors take ~1.1s to part. */
export const K_OPENING_DURATION = 1250;
