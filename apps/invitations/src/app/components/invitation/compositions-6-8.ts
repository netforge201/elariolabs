// Original compositions in 6/8 for the invitation music engine.
//
// Every bar here is six eighth notes grouped 3 + 3 — ONE-two-three FOUR-five-six —
// so each bar has two felt beats (dotted quarters). The scheduler's beat unit for
// these pieces is the EIGHTH NOTE: `bpm` is the eighth-note rate and the tempo a
// listener feels is the dotted-quarter `meter.pulseBpm` (= bpm / 3).
//
// Melodies are written bar by bar as "note:eighths" tokens ("r" is a rest) and
// every bar must add up to exactly six eighths; scripts/verify-music.ts checks
// that, along with the accent pattern and the loop seams.
//
// All melodies and arrangements are original to this project.

import type { Composition, NoteEvent } from './music-engine';

type Voice = NoteEvent['voice'];

export const EIGHTHS_PER_BAR = 6;

/**
 * Metric weight of each eighth in a 6/8 bar. Subdivision 1 is the strongest,
 * 4 is the second (and slightly lighter) beat, the rest are light — this is what
 * turns six even eighths into a compound-duple ONE-two-three FOUR-five-six.
 */
export const ACCENT_6_8 = [1, 0.5, 0.58, 0.82, 0.5, 0.58] as const;

/** Melody notes landing on a beat speak a little more than the ones between. */
const MELODY_WEIGHT = (at: number) => (at === 0 ? 1 : at === 3 ? 0.93 : 0.8);

/** Gentle rise and fall over each four-bar phrase. */
const PHRASE_SWELL = [0.92, 1, 1.06, 0.95];

// ---------------------------------------------------------------------------
// Small notation helpers
// ---------------------------------------------------------------------------

const PITCH: Record<string, number> = {
  C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6,
  G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11,
};
const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function midiOf(note: string): number {
  const match = /^([A-G][#b]?)(-?\d)$/.exec(note);
  if (!match) throw new Error(`Bad note "${note}"`);
  return (Number(match[2]) + 1) * 12 + PITCH[match[1]];
}

function shift(note: string, semitones: number): string {
  if (!semitones) return note;
  const midi = midiOf(note) + semitones;
  return `${NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`;
}

export type Chord = { bass: string; tones: [string, string, string] };

/** "Eb3 Bb3 Eb4 G4" (bass + three upper tones) or two half-bar chords split by "|". */
export function parseChords(spec: string): Chord[] {
  return spec.split('|').map(half => {
    const [bass, a, b, c] = half.trim().split(/\s+/);
    return { bass, tones: [a, b, c] };
  });
}

export type BarNote = { at: number; note: string; len: number };

/** "G5:2 F5:1 Eb5:2 Bb4:1" → notes positioned in eighths. Rests ("r:3") are skipped. */
export function parseBar(src: string): BarNote[] {
  const notes: BarNote[] = [];
  let at = 0;
  for (const token of src.trim().split(/\s+/)) {
    const [note, len] = token.split(':');
    const eighths = Number(len);
    if (note !== 'r') notes.push({ at, note, len: eighths });
    at += eighths;
  }
  return notes;
}

/** Total length of a written bar in eighths — must be 6. */
export function barLength(src: string): number {
  return src.trim().split(/\s+/).reduce((sum, token) => sum + Number(token.split(':')[1]), 0);
}

function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ev = (at: number, note: string, len: number, voice: Voice, vel: number): NoteEvent => ({ at, note, len, voice, vel });

/** Each chord of a bar with where it starts and how long it lasts (in eighths). */
function segments(chords: Chord[]) {
  return chords.length === 1
    ? [{ chord: chords[0], at: 0, len: 6 }]
    : [{ chord: chords[0], at: 0, len: 3 }, { chord: chords[1], at: 3, len: 3 }];
}

// ---------------------------------------------------------------------------
// Accompaniment figures — all built on the 3 + 3 grouping
// ---------------------------------------------------------------------------

/**
 * Flowing left-hand arpeggio: bass on 1, rising through the chord, the top tone
 * on 4 (the second beat), falling back. With two chords in the bar the second
 * one takes over on 4 with its own bass note.
 */
function arpeggio(chords: Chord[], voice: Voice, vel: number): NoteEvent[] {
  const [first] = chords;
  const second = chords[1];
  const [a, b, c] = first.tones;
  const pattern = second
    ? [first.bass, a, b, second.bass, second.tones[0], second.tones[1]]
    : [first.bass, a, b, c, b, a];
  return pattern.map((note, k) => {
    // The bass (and the chord change on 4) is "pedalled" through its half-bar.
    const len = k === 0 ? (second ? 3.2 : 5.6) : k === 3 ? 2.9 : 2.3;
    return ev(k, note, len, voice, vel * ACCENT_6_8[k]);
  });
}

/** Harp roll: like the arpeggio but climbs past the top of the chord on beat two. */
function harpRoll(chords: Chord[], vel: number): NoteEvent[] {
  const [first] = chords;
  const second = chords[1];
  const [a, b, c] = first.tones;
  const pattern = second
    ? [first.bass, a, b, second.bass, second.tones[1], second.tones[2]]
    : [first.bass, a, b, c, shift(a, 12), c];
  return pattern.map((note, k) => ev(k, note, k === 0 ? 5.6 : 2.6, 'harp', vel * ACCENT_6_8[k]));
}

/**
 * Lilting "bass – chord – chord, bass – chord – chord" figure: the low note
 * marks each beat and soft plucked chords fill subdivisions 2-3 and 5-6.
 */
function lilt(chords: Chord[], vel: number): NoteEvent[] {
  const out: NoteEvent[] = [];
  for (const half of [0, 3]) {
    const chord = chords.length > 1 && half === 3 ? chords[1] : chords[0];
    const low = half === 3 && chords.length === 1 ? shift(chord.bass, 7) : chord.bass;
    out.push(ev(half, low, 2.6, 'piano', vel * ACCENT_6_8[half]));
    for (const k of [1, 2]) {
      chord.tones.slice(1).forEach(note => out.push(ev(half + k, note, 0.75, 'harp', vel * 0.7 * ACCENT_6_8[half + k])));
    }
  }
  return out;
}

/** Sustained low bass under each chord, an octave down from the written bass. */
function bassLine(chords: Chord[], vel: number): NoteEvent[] {
  return segments(chords).map(({ chord, at, len }) => {
    const octave = Number(chord.bass.slice(-1));
    return ev(at, octave >= 3 ? shift(chord.bass, -12) : chord.bass, len + 0.4, 'bass', vel);
  });
}

/** Held chord for strings or pad, lifted out of the mud if it sits too low. */
function sustain(chords: Chord[], voice: Voice, vel: number): NoteEvent[] {
  return segments(chords).flatMap(({ chord, at, len }) =>
    chord.tones.map(note => ev(at, midiOf(note) < 48 ? shift(note, 12) : note, len + 0.3, voice, vel)));
}

/** A written melody line, with beat-aware weighting; strings get a touch of legato overlap. */
function melody(notes: BarNote[], voice: Voice, vel: number, octave = 0): NoteEvent[] {
  const legato = voice === 'strings' || voice === 'cello' ? 0.15 : 0;
  return notes.map(n => ev(n.at, shift(n.note, octave * 12), n.len + legato, voice, vel * MELODY_WEIGHT(n.at)));
}

// ---------------------------------------------------------------------------
// Form: intro (played once) → sections that loop forever
// ---------------------------------------------------------------------------

type Section = { label: string; chords: string[]; melody: string[]; counter?: string[] };

export type BarContext = {
  label: string;
  /** Bar number inside its section (or intro). */
  index: number;
  /** How many times the looping form has already been played. */
  pass: number;
  isIntro: boolean;
  chords: Chord[];
  melody: BarNote[];
  counter: BarNote[];
};

export type Piece68 = {
  key: string;
  /** Dotted-quarter beats per minute. */
  pulse: number;
  intro: string[];
  form: Section[];
  arrange: (bar: BarContext) => NoteEvent[];
};

export type SixEightComposition = Composition & { piece: Piece68 };

function sixEight(piece: Piece68): SixEightComposition {
  const loop = piece.form.flatMap(section => section.chords.map((_, index) => ({ section, index })));
  const introBars = piece.intro.length;

  return {
    piece,
    bpm: piece.pulse * 3,
    beatsPerBar: EIGHTHS_PER_BAR,
    // these arrangements are deliberately soft; bring them up to the level of the other tracks
    gain: 1.25,
    meter: { numerator: 6, denominator: 8, pulses: 2, pulseBpm: piece.pulse },
    key: piece.key,
    introBars,
    loopBars: loop.length,
    bar(i) {
      let context: BarContext;
      let swell: number;
      if (i < introBars) {
        context = {
          label: 'intro', index: i, pass: 0, isIntro: true,
          chords: parseChords(piece.intro[i]), melody: [], counter: [],
        };
        swell = 0.8 + (0.15 * i) / Math.max(1, introBars - 1);
      } else {
        const j = i - introBars;
        const { section, index } = loop[j % loop.length];
        context = {
          label: section.label, index, pass: Math.floor(j / loop.length), isIntro: false,
          chords: parseChords(section.chords[index]),
          melody: parseBar(section.melody[index]),
          counter: section.counter ? parseBar(section.counter[index]) : [],
        };
        swell = PHRASE_SWELL[index % 4];
      }

      // Light, deterministic humanisation: a few milliseconds of timing and a
      // few percent of velocity, so repeats never sound machine-identical.
      const rand = seeded(i * 104729 + 7);
      const jitter = 0.012 * (piece.pulse * 3) / 60; // ±6 ms expressed in eighths
      return piece.arrange(context).map(e => ({
        ...e,
        at: e.voice === 'bass' ? e.at : Math.max(0, e.at + (rand() - 0.5) * jitter),
        vel: e.vel * swell * (0.95 + rand() * 0.1),
      }));
    },
  };
}

// ---------------------------------------------------------------------------
// 1. Serenade — wedding. E-flat major, ♩. = 60. Piano, strings, cello.
// ---------------------------------------------------------------------------

const EB = 'Eb3 Bb3 Eb4 G4';
const BB_D = 'D3 Bb3 D4 F4';
const CM = 'C3 G3 C4 Eb4';
const GM_BB = 'Bb2 G3 Bb3 D4';
const AB = 'Ab2 Eb3 Ab3 C4';
const EB_G = 'G2 Eb3 Bb3 Eb4';
const FM7 = 'F2 C3 Ab3 Eb4';
const BB_SUS = 'Bb2 F3 Bb3 Eb4 | Bb2 F3 Bb3 D4';
const BB7 = 'Bb2 F3 Ab3 D4';
const BB = 'Bb2 F3 Bb3 D4';
const GM7 = 'G2 D3 F3 Bb3';
const GM = 'G2 D3 G3 Bb3';

const serenadeA: Section = {
  label: 'A',
  chords: [EB, BB_D, CM, GM_BB, AB, EB_G, FM7, BB_SUS],
  melody: [
    'G5:2 F5:1 Eb5:2 Bb4:1', 'F5:2 Eb5:1 D5:3', 'Eb5:2 D5:1 C5:2 G4:1', 'D5:3 Bb4:3',
    'C5:2 Eb5:1 Ab5:3', 'G5:2 Bb5:1 G5:2 Eb5:1', 'Ab5:2 G5:1 F5:2 Eb5:1', 'F5:3 D5:3',
  ],
};
const serenadeA2: Section = {
  label: 'A2',
  chords: [EB, BB_D, CM, GM_BB, AB, FM7, BB7, EB],
  melody: [
    ...serenadeA.melody.slice(0, 4),
    'C6:2 Bb5:1 Ab5:2 G5:1', 'F5:2 Ab5:1 C6:2 Ab5:1', 'G5:3 F5:2 D5:1', 'Eb5:6',
  ],
};
const serenadeB: Section = {
  label: 'B',
  chords: [AB, BB, GM7, CM, FM7, GM, AB, BB7],
  melody: [
    'Eb5:2 Ab5:1 C6:3', 'Bb5:3 F5:3', 'G5:3 F5:2 D5:1', 'Eb5:6',
    'Ab5:3 F5:2 Eb5:1', 'G5:3 D5:3', 'C5:2 Eb5:1 Ab5:3', 'Bb5:3 Ab5:2 F5:1',
  ],
  counter: ['C4:6', 'D4:6', 'Bb3:6', 'G3:6', 'Ab3:6', 'Bb3:6', 'C4:3 Eb4:3', 'D4:6'],
};

export const serenade = sixEight({
  key: 'E-flat major',
  pulse: 60,
  intro: ['Ab2 Eb3 Ab3 C4', BB_SUS],
  form: [serenadeA, serenadeA2, serenadeB, { ...serenadeA2, label: 'A3' }],
  arrange(bar) {
    const out = [...arpeggio(bar.chords, 'piano', 0.24), ...bassLine(bar.chords, 0.3)];
    const odd = bar.pass % 2 === 1;
    switch (bar.label) {
      case 'intro':
        out.push(...sustain(bar.chords, 'strings', 0.1 + 0.05 * bar.index));
        break;
      case 'A':
        out.push(...melody(bar.melody, 'piano', 0.4));
        if (odd) out.push(...sustain(bar.chords, 'strings', 0.07));
        break;
      case 'A2':
        out.push(...melody(bar.melody, 'piano', 0.4), ...sustain(bar.chords, 'strings', 0.08));
        break;
      case 'B':
        // the violins take the tune, the cello answers underneath
        out.push(...melody(bar.melody, 'strings', 0.3), ...melody(bar.counter, 'cello', 0.26, -1));
        break;
      case 'A3':
        out.push(...melody(bar.melody, 'piano', 0.42));
        out.push(...(odd ? melody(bar.melody, 'strings', 0.14, -1) : sustain(bar.chords, 'strings', 0.08)));
        break;
    }
    return out;
  },
});

// ---------------------------------------------------------------------------
// 2. The Promise — engagement. G major, ♩. = 66. Harp, piano, warm strings.
// ---------------------------------------------------------------------------

const G = 'G2 D3 G3 B3';
const CMAJ7 = 'C3 G3 B3 E4';
const EM = 'E2 B2 E3 G3';
const D = 'D3 A3 D4 F#4';
const G_B = 'B2 D3 G3 B3';
const C = 'C3 G3 C4 E4';
const AM7 = 'A2 E3 G3 C4';
const D_SUS = 'D3 A3 D4 G4 | D3 A3 D4 F#4';
const AM7_D7 = 'A2 E3 G3 C4 | D3 A3 C4 F#4';
const D7 = 'D3 A3 C4 F#4';

const promiseA: Section = {
  label: 'A',
  chords: [G, CMAJ7, EM, D, G_B, C, AM7, D_SUS],
  melody: [
    'B4:2 D5:1 G5:3', 'G5:2 F#5:1 E5:3', 'B4:2 E5:1 G5:2 F#5:1', 'F#5:2 E5:1 D5:3',
    'B4:2 D5:1 G5:3', 'G5:2 A5:1 G5:2 E5:1', 'C5:2 E5:1 A5:2 G5:1', 'G5:3 F#5:3',
  ],
};
const promiseB: Section = {
  label: 'B',
  chords: [EM, C, G, D, EM, C, AM7, D7],
  melody: [
    'G5:3 F#5:2 E5:1', 'E5:2 D5:1 C5:3', 'D5:2 B4:1 D5:2 G5:1', 'A5:3 F#5:3',
    'B5:2 A5:1 G5:3', 'E5:3 G5:2 E5:1', 'C5:2 E5:1 G5:2 A5:1', 'F#5:2 E5:1 D5:2 C5:1',
  ],
  counter: ['B3:6', 'G3:6', 'G3:3 B3:3', 'A3:6', 'B3:6', 'C4:6', 'C4:3 E4:3', 'D4:3 C4:3'],
};
const promiseA2: Section = {
  label: 'A2',
  chords: [G, CMAJ7, EM, D, G_B, C, AM7_D7, G],
  melody: [...promiseA.melody.slice(0, 6), 'A5:2 G5:1 F#5:2 E5:1', 'G5:6'],
};

export const promise = sixEight({
  key: 'G major',
  pulse: 66,
  intro: [CMAJ7, D_SUS],
  form: [promiseA, promiseB, promiseA2],
  arrange(bar) {
    const out = [...harpRoll(bar.chords, 0.2), ...bassLine(bar.chords, 0.26)];
    const odd = bar.pass % 2 === 1;
    switch (bar.label) {
      case 'intro':
        out.push(...sustain(bar.chords, 'pad', 0.06 + 0.03 * bar.index));
        break;
      case 'A':
        out.push(...melody(bar.melody, 'piano', 0.38));
        if (odd) out.push(...sustain(bar.chords, 'pad', 0.07));
        break;
      case 'B':
        out.push(...melody(bar.melody, 'piano', 0.34), ...melody(bar.counter, 'cello', 0.22, -1));
        out.push(...sustain(bar.chords, 'pad', 0.06));
        break;
      case 'A2':
        out.push(...melody(bar.melody, 'piano', 0.38));
        out.push(...(odd ? melody(bar.melody, 'strings', 0.12) : sustain(bar.chords, 'strings', 0.07)));
        break;
    }
    return out;
  },
});

// ---------------------------------------------------------------------------
// 3. Memories — anniversary. D minor ↔ F major, ♩. = 58. Cello, piano, violins.
// ---------------------------------------------------------------------------

const DM = 'D2 A2 F3 A3';
const BBMAJ7 = 'Bb1 F2 D3 A3';
const GM7_ = 'G2 D3 F3 Bb3';
const A7 = 'A2 E3 G3 C#4';
const BB_ = 'Bb2 F3 Bb3 D4';
const GM_ = 'G2 D3 G3 Bb3';
const A_SUS = 'A2 E3 A3 D4 | A2 E3 A3 C#4';
const F = 'F2 C3 A3 C4';
const C_E = 'E2 C3 G3 C4';
const AM_ = 'A2 E3 A3 C4';
const F_A = 'A2 F3 A3 C4';
const C7_SUS = 'C3 G3 Bb3 F4 | C3 G3 Bb3 E4';
const BB_A7 = 'Bb2 F3 Bb3 D4 | A2 E3 G3 C#4';

const memoriesA: Section = {
  label: 'A',
  chords: [DM, BBMAJ7, GM7_, A7, DM, BB_, GM_, A_SUS],
  // the cello sings this in its tenor register
  melody: [
    'D4:2 F4:1 A4:3', 'A4:2 G4:1 F4:2 D4:1', 'G4:2 Bb4:1 D5:2 C5:1', 'C#5:3 A4:3',
    'D5:2 C5:1 A4:2 F4:1', 'F4:2 G4:1 Bb4:2 D5:1', 'D5:2 C5:1 Bb4:2 G4:1', 'A4:6',
  ],
};
const memoriesB: Section = {
  label: 'B',
  // the relative major: the memory brightens
  chords: [F, C_E, DM, AM_, BB_, F_A, GM7_, C7_SUS],
  melody: [
    'C5:2 F5:1 A5:3', 'G5:2 F5:1 E5:3', 'F5:2 E5:1 D5:2 A4:1', 'E5:3 C5:3',
    'D5:2 F5:1 Bb5:3', 'A5:2 G5:1 F5:2 C5:1', 'Bb4:2 D5:1 F5:2 E5:1', 'F5:3 E5:3',
  ],
};
const memoriesA2: Section = {
  label: 'A2',
  chords: [DM, BBMAJ7, GM7_, A7, DM, GM_, BB_A7, DM],
  // the violins take the opening tune an octave higher, then close it differently
  melody: [
    'D5:2 F5:1 A5:3', 'A5:2 G5:1 F5:2 D5:1', 'G5:2 Bb5:1 D6:2 C6:1', 'C#6:3 A5:3',
    'D6:2 C6:1 A5:2 F5:1', 'Bb5:2 A5:1 G5:2 D5:1', 'F5:2 D5:1 E5:2 C#5:1', 'D5:6',
  ],
  counter: ['A3:6', 'F3:6', 'G3:6', 'E3:3 G3:3', 'F3:6', 'G3:6', 'D3:3 C#3:3', 'D3:6'],
};

export const memories = sixEight({
  key: 'D minor / F major',
  pulse: 58,
  intro: ['D2 A2 E3 F3', 'A2 E3 A3 D4 | A2 E3 G3 C#4'],
  form: [memoriesA, memoriesB, memoriesA2],
  arrange(bar) {
    const out = [...arpeggio(bar.chords, 'piano', 0.22), ...bassLine(bar.chords, 0.28)];
    const odd = bar.pass % 2 === 1;
    switch (bar.label) {
      case 'intro':
        out.push(...sustain(bar.chords, 'strings', 0.06 + 0.03 * bar.index));
        break;
      case 'A':
        out.push(...melody(bar.melody, 'cello', 0.34));
        if (odd) out.push(...sustain(bar.chords, 'strings', 0.05));
        break;
      case 'B':
        out.push(...melody(bar.melody, 'piano', 0.36), ...sustain(bar.chords, 'strings', 0.07));
        break;
      case 'A2':
        out.push(...melody(bar.melody, 'strings', 0.28), ...melody(bar.counter, 'cello', 0.22));
        break;
    }
    return out;
  },
});

// ---------------------------------------------------------------------------
// 4. Wishes — birthday. D major, ♩. = 76. Piano, plucked harp, celesta.
// ---------------------------------------------------------------------------

const D_ = 'D3 A3 D4 F#4';
const G_ = 'G2 B3 D4 G4';
const A_ = 'A2 A3 C#4 E4';
const BM = 'B2 B3 D4 F#4';
const EM7_A7 = 'E3 G3 B3 D4 | A2 G3 C#4 E4';
const FSM = 'F#2 A3 C#4 F#4';
const EM_ = 'E3 G3 B3 E4';
const A7_ = 'A2 G3 C#4 E4';

const wishesA: Section = {
  label: 'A',
  chords: [D_, G_, D_, A_, BM, G_, EM7_A7, D_],
  melody: [
    'A4:1 D5:1 F#5:1 A5:2 F#5:1', 'B5:2 A5:1 G5:3', 'F#5:1 E5:1 D5:1 F#5:2 A5:1', 'E5:3 C#5:2 A4:1',
    'B4:1 D5:1 F#5:1 B5:2 A5:1', 'G5:2 F#5:1 G5:2 B5:1', 'G5:2 F#5:1 E5:2 C#5:1', 'D5:3 r:3',
  ],
};
const wishesB: Section = {
  label: 'B',
  chords: [G_, A_, FSM, BM, EM_, A_, G_, A7_],
  melody: [
    'B5:3 G5:2 D5:1', 'A5:3 E5:3', 'F#5:2 E5:1 C#5:2 A4:1', 'B4:2 C#5:1 D5:3',
    'G5:2 F#5:1 E5:2 B4:1', 'C#5:2 E5:1 A5:3', 'B5:2 A5:1 G5:2 D5:1', 'A5:3 G5:2 E5:1',
  ],
};
const wishesA2: Section = {
  label: 'A2',
  chords: wishesA.chords,
  melody: [...wishesA.melody.slice(0, 6), 'B5:2 A5:1 G5:2 E5:1', 'D5:6'],
};

export const wishes = sixEight({
  key: 'D major',
  pulse: 76,
  intro: [D_, A7_],
  form: [wishesA, wishesB, wishesA2],
  arrange(bar) {
    const out = [...lilt(bar.chords, 0.22), ...bassLine(bar.chords, 0.2)];
    const odd = bar.pass % 2 === 1;
    switch (bar.label) {
      case 'A':
        out.push(...melody(bar.melody, 'piano', 0.4));
        if (odd) out.push(...melody(bar.melody, 'bell', 0.09, 1));
        break;
      case 'B':
        out.push(...melody(bar.melody, 'piano', 0.36), ...sustain(bar.chords, 'strings', 0.06));
        break;
      case 'A2':
        out.push(...melody(bar.melody, 'piano', 0.4), ...melody(bar.melody, 'bell', 0.1, 1));
        break;
    }
    return out;
  },
});

export const SIX_EIGHT = { serenade, promise, memories, wishes };
