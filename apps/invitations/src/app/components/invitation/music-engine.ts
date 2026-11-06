'use client';

// A small, dependency-free music engine for invitations.
//
// - Built-in tracks are generated live with the Web Audio API.
// - A couple's uploaded file plays through one shared <audio> element.
// - A YouTube video plays through YouTube's embedded player (youtube-player.ts).
// - One controller for the whole page owns all three, so the invitation, the
//   editor preview and the music picker can never play on top of each other.
// - Playback only ever starts from a user gesture (play()/toggle() are called
//   from click handlers); nothing here tries to get around autoplay rules.
// - Pausing fades out and suspends the context, so resuming is instant and no
//   duplicate schedulers or audio graphs are created.

import { useCallback, useSyncExternalStore } from 'react';
import { musicFileUrl, musicSourceKey, type MusicSource, type TrackId } from './catalog';
import { YouTubeDock, type YouTubeLabels } from './youtube-player';
import { SIX_EIGHT } from './compositions-6-8';

// ---------------------------------------------------------------------------
// Notes & compositions
// ---------------------------------------------------------------------------

const SEMITONE: Record<string, number> = {
  C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6,
  G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11,
};

function hz(note: string): number {
  const match = /^([A-G][#b]?)(\d)$/.exec(note);
  if (!match) return 440;
  const midi = (Number(match[2]) + 1) * 12 + SEMITONE[match[1]];
  return 440 * Math.pow(2, (midi - 69) / 12);
}

type Voice = 'piano' | 'harp' | 'bell' | 'pad' | 'bass' | 'strings' | 'cello';
/** at/len are in beats relative to the start of the bar. */
export type NoteEvent = { at: number; note: string; len: number; voice: Voice; vel: number };
export type Meter = {
  numerator: number;
  denominator: number;
  /** Felt pulses per bar (2 for 6/8: two dotted-quarter beats). */
  pulses: number;
  /** Tempo of the felt pulse (the dotted quarter in 6/8). */
  pulseBpm: number;
};
export type Composition = {
  /** Rate of the scheduler's beat unit. For 6/8 pieces the unit is the eighth note. */
  bpm: number;
  /** Output trim so tracks sit at a similar loudness (default 1). */
  gain?: number;
  beatsPerBar: number;
  bar: (index: number) => NoteEvent[];
  meter?: Meter;
  key?: string;
  introBars?: number;
  /** Bars in one pass of the looping form (after the intro). */
  loopBars?: number;
};

const ev = (at: number, note: string, len: number, voice: Voice, vel: number): NoteEvent => ({ at, note, len, voice, vel });
type Line = [number, string, number][];
const line = (notes: Line, voice: Voice, vel: number) => notes.map(([at, note, len]) => ev(at, note, len, voice, vel));

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

// Canon — Pachelbel's progression (public domain), harp arpeggios with the
// melody layered in on later passes.
const canonChords: [string, string[]][] = [
  ['D3', ['D4', 'F#4', 'A4', 'D5']],
  ['A2', ['C#4', 'E4', 'A4', 'C#5']],
  ['B2', ['D4', 'F#4', 'B4', 'D5']],
  ['F#2', ['C#4', 'F#4', 'A4', 'C#5']],
  ['G2', ['D4', 'G4', 'B4', 'D5']],
  ['D3', ['D4', 'F#4', 'A4', 'D5']],
  ['G2', ['D4', 'G4', 'B4', 'D5']],
  ['A2', ['C#4', 'E4', 'A4', 'C#5']],
];
const canonMelody = ['F#5', 'E5', 'D5', 'C#5', 'B4', 'A4', 'B4', 'C#5'];
const canonCounter = [['F#5', 'A5'], ['E5', 'A5'], ['F#5', 'D5'], ['C#5', 'A4'], ['D5', 'B4'], ['D5', 'F#5'], ['B4', 'D5'], ['C#5', 'E5']];
const arpPattern = [0, 1, 2, 3, 2, 3, 1, 2];

const canon: Composition = {
  bpm: 84,
  beatsPerBar: 4,
  bar(i) {
    const step = i % 8;
    const pass = Math.floor(i / 8) % 3;
    const [bass, tones] = canonChords[step];
    const events: NoteEvent[] = [ev(0, bass, 4, 'bass', 0.5)];
    arpPattern.forEach((t, k) => events.push(ev(k * 0.5, tones[t], 0.9, 'harp', k === 0 ? 0.42 : 0.3)));
    if (pass === 1) events.push(ev(0, canonMelody[step], 3.6, 'bell', 0.3));
    if (pass === 2) {
      events.push(ev(0, canonCounter[step][0], 1.8, 'bell', 0.26), ev(2, canonCounter[step][1], 1.8, 'bell', 0.24));
      events.push(ev(0, tones[0], 4.2, 'pad', 0.08));
    }
    return events;
  },
};

// First Dance — an original waltz in G major.
const waltzBass = ['G2', 'F#2', 'E2', 'C3', 'B2', 'A2', 'D3', 'G2'];
const waltzChords = [
  ['B3', 'D4', 'G4'], ['A3', 'D4', 'F#4'], ['B3', 'E4', 'G4'], ['C4', 'E4', 'G4'],
  ['B3', 'D4', 'G4'], ['A3', 'C4', 'E4'], ['A3', 'D4', 'F#4'], ['B3', 'D4', 'G4'],
];
const waltzMelody: Line[] = [
  [[0, 'D5', 1.5], [1.5, 'B4', 0.5], [2, 'G4', 1]],
  [[0, 'A4', 2], [2, 'D5', 1]],
  [[0, 'G5', 1.5], [1.5, 'F#5', 0.5], [2, 'E5', 1]],
  [[0, 'E5', 2], [2, 'C5', 1]],
  [[0, 'D5', 1], [1, 'B4', 1], [2, 'D5', 1]],
  [[0, 'C5', 1.5], [1.5, 'B4', 0.5], [2, 'A4', 1]],
  [[0, 'F#4', 1], [1, 'A4', 1], [2, 'C5', 1]],
  [[0, 'B4', 3]],
  [[0, 'G5', 1.5], [1.5, 'F#5', 0.5], [2, 'E5', 1]],
  [[0, 'D5', 2], [2, 'A4', 1]],
  [[0, 'B4', 1], [1, 'E5', 1], [2, 'G5', 1]],
  [[0, 'G5', 2], [2, 'E5', 1]],
  [[0, 'D5', 1.5], [1.5, 'C5', 0.5], [2, 'B4', 1]],
  [[0, 'A4', 1], [1, 'C5', 1], [2, 'E5', 1]],
  [[0, 'D5', 1.5], [1.5, 'C5', 0.5], [2, 'A4', 1]],
  [[0, 'G4', 3]],
];

const waltz: Composition = {
  bpm: 112,
  beatsPerBar: 3,
  bar(i) {
    const step = i % 16;
    const chord = step % 8;
    const events: NoteEvent[] = [ev(0, waltzBass[chord], 2.6, 'bass', 0.42)];
    for (const beat of [1, 2]) waltzChords[chord].forEach(n => events.push(ev(beat, n, 0.8, 'piano', 0.12)));
    if (i >= 2) events.push(...line(waltzMelody[step], 'piano', 0.36));
    return events;
  },
};

// Evening Light — slow ambient pads with sparse bells.
const eveningChords: [string, string[]][] = [
  ['F2', ['F3', 'A3', 'C4', 'E4']],
  ['A2', ['E3', 'G3', 'A3', 'C4']],
  ['D2', ['F3', 'A3', 'C4', 'E4']],
  ['A#1', ['F3', 'A3', 'A#3', 'D4']],
];
const eveningBells = ['F5', 'G5', 'A5', 'C6', 'D6', 'E5', 'C5'];

const evening: Composition = {
  bpm: 60,
  beatsPerBar: 8,
  bar(i) {
    const [bass, pad] = eveningChords[i % 4];
    const rand = seeded(i * 7919 + 13);
    const events: NoteEvent[] = [ev(0, bass, 8, 'bass', 0.26)];
    pad.forEach(n => events.push(ev(0, n, 8.4, 'pad', 0.14)));
    const slots = [0.5, 2, 3.5, 5, 6.5].filter(() => rand() > 0.4);
    slots.forEach(at => events.push(ev(at, eveningBells[Math.floor(rand() * eveningBells.length)], 2.5, 'bell', 0.14 + rand() * 0.1)));
    return events;
  },
};

// Nocturne — an original piano piece in A minor.
const nocturneChords = [
  ['A2', 'E3', 'A3', 'C4', 'E4'], ['F2', 'C3', 'F3', 'A3', 'C4'],
  ['C3', 'G3', 'C4', 'E4', 'G4'], ['G2', 'D3', 'G3', 'B3', 'D4'],
  ['A2', 'E3', 'A3', 'C4', 'E4'], ['D3', 'A3', 'D4', 'F4', 'A4'],
  ['E2', 'B2', 'E3', 'G#3', 'B3'], ['A2', 'E3', 'A3', 'C4', 'E4'],
];
const nocturnePattern = [0, 1, 2, 3, 4, 3, 2, 1];
const nocturneMelody: Line[] = [
  [[0, 'E5', 1.5], [1.5, 'D5', 0.5], [2, 'C5', 1], [3, 'B4', 1]],
  [[0, 'C5', 3], [3, 'A4', 1]],
  [[0, 'G4', 1], [1, 'C5', 1], [2, 'E5', 1.5], [3.5, 'D5', 0.5]],
  [[0, 'D5', 3], [3, 'B4', 1]],
  [[0, 'A5', 1.5], [1.5, 'G5', 0.5], [2, 'E5', 1], [3, 'C5', 1]],
  [[0, 'F5', 2], [2, 'E5', 1], [3, 'D5', 1]],
  [[0, 'B4', 1], [1, 'G#4', 1], [2, 'B4', 1], [3, 'D5', 1]],
  [[0, 'C5', 4]],
];

const nocturne: Composition = {
  bpm: 66,
  beatsPerBar: 4,
  bar(i) {
    const step = i % 8;
    const tones = nocturneChords[step];
    const events = nocturnePattern.map((t, k) => ev(k * 0.5, tones[t], 1.2, 'piano', k === 0 ? 0.28 : 0.17));
    if (i >= 2) events.push(...line(nocturneMelody[step], 'piano', 0.38));
    return events;
  },
};

export const COMPOSITIONS: Record<TrackId, Composition> = { ...SIX_EIGHT, canon, waltz, evening, nocturne };

// ---------------------------------------------------------------------------
// Synthesis
// ---------------------------------------------------------------------------

type Bus = { dry: AudioNode; wet: AudioNode };

function playNote(ctx: BaseAudioContext, bus: Bus, event: NoteEvent, start: number, secondsPerBeat: number) {
  const f = hz(event.note);
  const length = event.len * secondsPerBeat;
  const out = ctx.createGain();
  out.connect(bus.dry);
  out.connect(bus.wet);
  const nodes: AudioNode[] = [out];
  const oscillators: OscillatorNode[] = [];

  const osc = (type: OscillatorType, freq: number, gain: number, detune = 0) => {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    o.detune.value = detune;
    const g = ctx.createGain();
    g.gain.value = gain;
    o.connect(g);
    nodes.push(o, g);
    oscillators.push(o);
    return g;
  };

  let end: number;
  const env = out.gain;
  env.setValueAtTime(0.0001, start);

  if (event.voice === 'pad') {
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1000;
    filter.Q.value = 0.4;
    filter.connect(out);
    nodes.push(filter);
    osc('sawtooth', f, 0.5, -7).connect(filter);
    osc('sawtooth', f, 0.5, 7).connect(filter);
    const attack = Math.min(1.6, length / 2);
    env.linearRampToValueAtTime(event.vel * 0.5, start + attack);
    env.setValueAtTime(event.vel * 0.5, start + length);
    end = start + length + 2.2;
    env.linearRampToValueAtTime(0.0001, end);
  } else if (event.voice === 'bell') {
    osc('sine', f, 1).connect(out);
    osc('sine', f * 2.756, 0.16).connect(out);
    env.exponentialRampToValueAtTime(event.vel, start + 0.006);
    end = start + Math.max(length, 1.5) + 2.2;
    env.exponentialRampToValueAtTime(0.0001, end);
  } else if (event.voice === 'bass') {
    osc('sine', f, 1).connect(out);
    osc('triangle', f, 0.25).connect(out);
    env.exponentialRampToValueAtTime(event.vel, start + 0.03);
    env.exponentialRampToValueAtTime(event.vel * 0.45, start + length);
    end = start + length + 0.9;
    env.exponentialRampToValueAtTime(0.0001, end);
  } else if (event.voice === 'strings' || event.voice === 'cello') {
    // Bowed strings: two detuned saws through a gentle two-stage low-pass,
    // a soft attack and a vibrato that only blooms once the note is held.
    const cello = event.voice === 'cello';
    const tone = ctx.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.value = cello ? 1300 : Math.min(2600, f * 4.5);
    tone.Q.value = 0.6;
    const soften = ctx.createBiquadFilter();
    soften.type = 'lowpass';
    soften.frequency.value = cello ? 2400 : 4200;
    soften.Q.value = 0.3;
    tone.connect(soften).connect(out);
    nodes.push(tone, soften);

    const vibrato = ctx.createOscillator();
    vibrato.frequency.value = cello ? 4.6 : 5.3;
    const depth = ctx.createGain();
    depth.gain.setValueAtTime(0, start);
    depth.gain.linearRampToValueAtTime(0, start + Math.min(0.25, length * 0.4));
    depth.gain.linearRampToValueAtTime(cello ? 7 : 9, start + Math.min(0.9, length * 0.8) + 0.05);
    vibrato.connect(depth);
    nodes.push(vibrato, depth);
    for (const cents of [-6, 6]) {
      const g = osc('sawtooth', f, 0.42, cents);
      depth.connect(oscillators[oscillators.length - 1].detune);
      g.connect(tone);
    }
    osc('triangle', f, 0.35).connect(tone);
    oscillators.push(vibrato);

    const peak = event.vel * 0.5;
    const attack = Math.min(cello ? 0.22 : 0.3, Math.max(0.07, length * 0.4));
    env.linearRampToValueAtTime(peak, start + attack);
    env.linearRampToValueAtTime(peak * 0.86, start + Math.max(length, attack + 0.05));
    end = start + Math.max(length, attack + 0.05) + (cello ? 0.7 : 0.9);
    env.linearRampToValueAtTime(0.0001, end);
  } else {
    // piano / harp: plucked string with a closing filter
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    // Harder keystrokes sound brighter, so accents in the bar are heard in the
    // tone as well as the loudness.
    const bright = event.voice === 'harp' ? 3600 : 1900 + Math.min(event.vel, 0.5) * 2000;
    filter.frequency.setValueAtTime(bright, start);
    filter.frequency.exponentialRampToValueAtTime(700, start + 1.4);
    filter.connect(out);
    nodes.push(filter);
    osc('triangle', f, event.voice === 'piano' ? 0.8 : 1).connect(filter);
    osc('sine', f * 2, 0.22).connect(filter);
    if (event.voice === 'piano') {
      osc('sine', f * 3, 0.06).connect(filter);
      // A slightly detuned second string gives melody notes a natural shimmer.
      // Quiet accompaniment notes skip it to keep the oscillator count low on phones.
      if (event.vel >= 0.25) osc('triangle', f, 0.3, 3).connect(filter);
    }
    env.exponentialRampToValueAtTime(event.vel, start + 0.008);
    env.exponentialRampToValueAtTime(event.vel * 0.32, start + 0.45);
    end = start + Math.max(length, 0.5) + (event.voice === 'harp' ? 1.4 : 1.1);
    env.exponentialRampToValueAtTime(0.0001, end);
  }

  oscillators.forEach(o => { o.start(start); o.stop(end + 0.05); });
  oscillators[0].onended = () => nodes.forEach(n => n.disconnect());
}

function impulseResponse(ctx: BaseAudioContext, seconds = 3) {
  const rate = ctx.sampleRate;
  const length = Math.floor(rate * seconds);
  const buffer = ctx.createBuffer(2, length, rate);
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3.2);
  }
  return buffer;
}

/** Master gain → gentle compressor → speakers, with a shared reverb send. */
function createOutput(ctx: BaseAudioContext) {
  const master = ctx.createGain();
  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = -16;
  compressor.ratio.value = 3;
  master.connect(compressor).connect(ctx.destination);

  const convolver = ctx.createConvolver();
  convolver.buffer = impulseResponse(ctx);
  const wet = ctx.createGain();
  wet.gain.value = 0.32;
  convolver.connect(wet).connect(master);
  return { master, convolver };
}

/**
 * Renders the first `bars` bars of a track into any context — used with an
 * OfflineAudioContext to analyse the real synthesized output. Not used by the
 * live player, which schedules incrementally through Sequencer.
 */
export function scheduleTrack(ctx: BaseAudioContext, trackId: TrackId, bars: number, startAt = 0.05) {
  const composition = COMPOSITIONS[trackId];
  const { master, convolver } = createOutput(ctx);
  master.gain.value = VOLUME * (composition.gain ?? 1);
  const bus = { dry: master, wet: convolver };
  const secondsPerBeat = 60 / composition.bpm;
  for (let bar = 0; bar < bars; bar++) {
    const barStart = startAt + bar * composition.beatsPerBar * secondsPerBeat;
    for (const event of composition.bar(bar)) playNote(ctx, bus, event, barStart + event.at * secondsPerBeat, secondsPerBeat);
  }
  return bars * composition.beatsPerBar * secondsPerBeat;
}

/** Schedules one composition into its own gain node, a bar at a time. */
class Sequencer {
  private bar = 0;
  private nextBarAt: number;
  private timer: number | null = null;
  private readonly dry: GainNode;
  private readonly send: GainNode;

  constructor(private ctx: AudioContext, destination: Bus, private composition: Composition) {
    this.dry = ctx.createGain();
    this.send = ctx.createGain();
    this.dry.connect(destination.dry);
    this.send.connect(destination.wet);
    this.dry.gain.value = composition.gain ?? 1;
    this.send.gain.value = composition.gain ?? 1;
    this.nextBarAt = ctx.currentTime + 0.12;
  }

  start() {
    this.tick();
    this.timer = window.setInterval(() => this.tick(), 250);
  }

  private tick() {
    const secondsPerBeat = 60 / this.composition.bpm;
    const bus = { dry: this.dry, wet: this.send };
    while (this.nextBarAt < this.ctx.currentTime + 1.2) {
      for (const event of this.composition.bar(this.bar)) {
        playNote(this.ctx, bus, event, this.nextBarAt + event.at * secondsPerBeat, secondsPerBeat);
      }
      this.nextBarAt += this.composition.beatsPerBar * secondsPerBeat;
      this.bar++;
    }
  }

  /** Stops scheduling and fades this sequence out (dry and reverb send). */
  stop(fade = 0.6) {
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
    const now = this.ctx.currentTime;
    for (const node of [this.dry, this.send]) {
      node.gain.cancelScheduledValues(now);
      node.gain.setValueAtTime(node.gain.value, now);
      node.gain.linearRampToValueAtTime(0.0001, now + fade);
    }
    window.setTimeout(() => { this.dry.disconnect(); this.send.disconnect(); }, (fade + 4) * 1000);
  }
}

// ---------------------------------------------------------------------------
// Controller (one per page)
// ---------------------------------------------------------------------------

export type { MusicSource } from './catalog';
export type MusicStatus = 'idle' | 'starting' | 'playing' | 'paused' | 'blocked' | 'error';
export type MusicSnapshot = {
  status: MusicStatus;
  /** musicSourceKey() of the active source. */
  key: string | null;
  kind: MusicSource['kind'] | null;
  /** Set when the active source is a built-in track. */
  trackId: TrackId | null;
  owner: string | null;
};
export type FileProgress = { current: number; duration: number };

type SourceInput = MusicSource | TrackId;
const toSource = (input: SourceInput): MusicSource => (typeof input === 'string' ? { kind: 'track', id: input } : input);

const VOLUME = 0.7;
const IDLE: MusicSnapshot = { status: 'idle', key: null, kind: null, trackId: null, owner: null };
const ACTIVE: MusicStatus[] = ['starting', 'playing', 'paused', 'blocked'];
const DEFAULT_LABELS: YouTubeLabels = {
  close: 'Close video', tapToPlay: 'Tap ▶ on the video to start the music', unavailable: 'This video cannot be played here',
};

class MusicController {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private reverb: AudioNode | null = null;
  private sequencer: Sequencer | null = null;
  private audio: HTMLAudioElement | null = null;
  private youtube: YouTubeDock | null = null;
  private source: MusicSource | null = null;
  private volume = 1;
  private labels = DEFAULT_LABELS;
  private suspendTimer: number | null = null;
  private resumeOnVisible = false;
  private snapshot: MusicSnapshot = IDLE;
  private listeners = new Set<() => void>();

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };

  getSnapshot = () => this.snapshot;
  getServerSnapshot = () => IDLE;

  private set(next: Partial<MusicSnapshot>) {
    this.snapshot = { ...this.snapshot, ...next };
    this.listeners.forEach(l => l());
  }

  private isCurrent(key: string) {
    return this.snapshot.key === key && this.snapshot.status !== 'idle';
  }

  // ----- built-in tracks (Web Audio) -----

  private ensureContext(): AudioContext | null {
    if (this.ctx) return this.ctx;
    const Ctor = window.AudioContext
      ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;

    // iOS: treat this as media playback (user-initiated) rather than UI sound.
    const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession;
    if (session) {
      try { session.type = 'playback'; } catch { /* unsupported */ }
    }

    const ctx = new Ctor();
    const { master, convolver } = createOutput(ctx);
    master.gain.value = 0.0001;

    this.ctx = ctx;
    this.master = master;
    this.reverb = convolver;
    document.addEventListener('visibilitychange', this.onVisibility);
    return ctx;
  }

  private fadeMaster(to: number, seconds: number) {
    if (!this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    const gain = this.master.gain;
    gain.cancelScheduledValues(now);
    gain.setValueAtTime(Math.max(gain.value, 0.0001), now);
    gain.linearRampToValueAtTime(Math.max(to, 0.0001), now + seconds);
  }

  private suspendSoon(check: () => boolean) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    if (this.suspendTimer !== null) window.clearTimeout(this.suspendTimer);
    this.suspendTimer = window.setTimeout(() => {
      this.suspendTimer = null;
      if (check()) void ctx.suspend().catch(() => {});
    }, 420);
  }

  private async playTrack(trackId: TrackId, key: string, resume: boolean) {
    const ctx = this.ensureContext();
    if (!ctx || !this.master || !this.reverb) {
      this.set({ status: 'error' });
      return;
    }
    if (this.suspendTimer !== null) {
      window.clearTimeout(this.suspendTimer);
      this.suspendTimer = null;
    }
    try {
      if (ctx.state !== 'running') await ctx.resume();
    } catch {
      this.set({ status: 'error' });
      return;
    }
    // A newer call may have changed the request while we were waiting.
    if (this.snapshot.key !== key || this.snapshot.status !== 'starting') return;

    if (!resume || !this.sequencer) {
      this.sequencer?.stop();
      const composition = COMPOSITIONS[trackId] ?? COMPOSITIONS.canon;
      this.sequencer = new Sequencer(ctx, { dry: this.master, wet: this.reverb }, composition);
      this.sequencer.start();
    }
    this.fadeMaster(VOLUME * this.volume, resume ? 0.6 : 1.4);
    this.set({ status: 'playing' });
  }

  private stopTrack(fade = 0.3) {
    if (!this.sequencer) return;
    this.sequencer.stop(fade);
    this.sequencer = null;
    this.fadeMaster(0, fade);
    this.suspendSoon(() => !this.sequencer);
  }

  // ----- uploaded files (<audio>) -----

  private ensureAudio(): HTMLAudioElement {
    if (this.audio) return this.audio;
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.loop = true;
    const mine = () => this.source?.kind === 'file' && this.snapshot.kind === 'file';
    audio.addEventListener('playing', () => {
      if (mine() && (this.snapshot.status === 'starting' || this.snapshot.status === 'blocked')) this.set({ status: 'playing' });
    });
    audio.addEventListener('waiting', () => {
      if (mine() && this.snapshot.status === 'playing') this.set({ status: 'starting' });
    });
    audio.addEventListener('error', () => {
      if (mine() && audio.getAttribute('src')) this.set({ status: 'error' });
    });
    this.audio = audio;
    document.addEventListener('visibilitychange', this.onVisibility);
    return audio;
  }

  private setFile(id: string) {
    const audio = this.ensureAudio();
    const url = musicFileUrl(id);
    if (audio.getAttribute('src') !== url) {
      audio.setAttribute('src', url);
      audio.load();
    }
    return audio;
  }

  private playFile(source: Extract<MusicSource, { kind: 'file' }>, key: string) {
    const audio = this.setFile(source.id);
    audio.volume = this.volume;
    let attempt: Promise<void>;
    try {
      // Called synchronously from the tap, which is what browsers require.
      attempt = audio.play();
    } catch {
      this.set({ status: 'error' });
      return;
    }
    attempt.then(() => {
      if (this.isCurrent(key) && this.snapshot.status === 'starting') this.set({ status: 'playing' });
    }).catch((error: DOMException) => {
      if (!this.isCurrent(key) || error?.name === 'AbortError') return;
      this.set({ status: error?.name === 'NotAllowedError' ? 'blocked' : 'error' });
    });
  }

  /** Position of the uploaded file, for the editor's preview player. */
  subscribeFileProgress = (listener: () => void) => {
    const audio = this.ensureAudio();
    const events = ['timeupdate', 'durationchange', 'loadedmetadata', 'emptied', 'seeked'];
    events.forEach(e => audio.addEventListener(e, listener));
    return () => events.forEach(e => audio.removeEventListener(e, listener));
  };

  fileProgress(id: string): FileProgress {
    const audio = this.audio;
    if (!audio || audio.getAttribute('src') !== musicFileUrl(id)) return NO_PROGRESS;
    const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
    const current = audio.currentTime;
    if (this.lastProgress.current !== current || this.lastProgress.duration !== duration) {
      this.lastProgress = { current, duration };
    }
    return this.lastProgress;
  }
  private lastProgress: FileProgress = NO_PROGRESS;

  seekFile(id: string, seconds: number) {
    const audio = this.setFile(id);
    try { audio.currentTime = Math.max(0, seconds); } catch { /* not seekable yet */ }
  }

  // ----- YouTube -----

  private ensureYouTube(): YouTubeDock {
    if (this.youtube) return this.youtube;
    const mine = () => this.source?.kind === 'youtube' && this.snapshot.kind === 'youtube' && this.snapshot.status !== 'idle';
    this.youtube = new YouTubeDock(event => {
      if (event === 'closed') { this.stop(); return; }
      if (!mine()) return;
      if (event === 'playing') this.set({ status: 'playing' });
      else if (event === 'paused') this.set({ status: 'paused' });
      else if (event === 'buffering' && this.snapshot.status !== 'paused') this.set({ status: 'starting' });
      else if (event === 'blocked') this.set({ status: 'blocked' });
      else if (event === 'error') this.set({ status: 'error' });
    }, this.labels);
    document.addEventListener('visibilitychange', this.onVisibility);
    return this.youtube;
  }

  // ----- public API -----

  /** Interface text for the YouTube card, in the invitation's language. */
  setLabels(labels: YouTubeLabels) {
    this.labels = labels;
    this.youtube?.setLabels(labels);
  }

  /** 0–1. Applies immediately to whatever is playing. */
  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.sequencer && this.snapshot.status === 'playing') this.fadeMaster(VOLUME * this.volume, 0.15);
    if (this.audio) this.audio.volume = this.volume;
    this.youtube?.setVolume(this.volume);
  }

  /**
   * Gets a source ready without playing it (no user gesture needed), so the
   * guest's tap can start it instantly. Never interrupts what is playing.
   */
  prepare(input: SourceInput) {
    const source = toSource(input);
    const busy = (kind: MusicSource['kind']) => this.snapshot.kind === kind && ACTIVE.includes(this.snapshot.status);
    if (source.kind === 'file' && !busy('file')) this.setFile(source.id);
    if (source.kind === 'youtube' && !busy('youtube')) this.ensureYouTube().load(source.videoId, source.title);
  }

  /** Must be called from a user gesture (tap/click) the first time. */
  async play(input: SourceInput, owner: string, volume?: number) {
    const source = toSource(input);
    const key = musicSourceKey(source);
    if (volume !== undefined) this.volume = Math.max(0, Math.min(1, volume));
    const same = this.source !== null && musicSourceKey(this.source) === key && this.snapshot.status !== 'idle';

    // Only one source may sound at a time.
    if (source.kind !== 'track' || !same) this.stopTrack();
    if (this.audio && (source.kind !== 'file' || !same)) this.audio.pause();
    if (this.youtube && source.kind !== 'youtube') this.youtube.stop();

    this.source = source;
    this.set({ status: 'starting', key, kind: source.kind, trackId: source.kind === 'track' ? source.id : null, owner });

    if (source.kind === 'file') {
      this.playFile(source, key);
    } else if (source.kind === 'youtube') {
      const yt = this.ensureYouTube();
      if (!same) yt.load(source.videoId, source.title);
      yt.setVolume(this.volume);
      yt.play();
    } else {
      await this.playTrack(source.id, key, same);
    }
  }

  pause() {
    const { status, kind } = this.snapshot;
    if (status !== 'playing' && status !== 'starting' && status !== 'blocked') return;
    if (kind === 'track' && this.ctx) {
      this.fadeMaster(0, 0.35);
      this.suspendSoon(() => this.snapshot.status === 'paused');
    } else if (kind === 'file') {
      this.audio?.pause();
    } else if (kind === 'youtube') {
      this.youtube?.pause();
    }
    this.set({ status: 'paused' });
  }

  toggle(input: SourceInput, owner: string, volume?: number) {
    const s = this.snapshot;
    const key = musicSourceKey(toSource(input));
    if ((s.status === 'playing' || s.status === 'starting') && s.key === key && s.owner === owner) this.pause();
    else void this.play(input, owner, volume);
  }

  /** Stops playback entirely. With an owner, only stops if that owner started it. */
  stop(owner?: string) {
    if (owner && this.snapshot.owner !== owner) return;
    this.resumeOnVisible = false;
    this.stopTrack();
    if (this.audio) {
      this.audio.pause();
      try { this.audio.currentTime = 0; } catch { /* not loaded */ }
    }
    this.youtube?.stop();
    this.source = null;
    this.set(IDLE);
  }

  private onVisibility = () => {
    if (document.hidden && this.snapshot.status === 'playing') {
      this.resumeOnVisible = true;
      this.pause();
    } else if (!document.hidden && this.resumeOnVisible && this.source) {
      this.resumeOnVisible = false;
      void this.play(this.source, this.snapshot.owner ?? 'page');
    }
  };
}

const NO_PROGRESS: FileProgress = { current: 0, duration: 0 };

let controller: MusicController | null = null;
export function music(): MusicController {
  if (!controller) controller = new MusicController();
  return controller;
}

const serverController = {
  subscribe: () => () => {},
  getSnapshot: () => IDLE,
};

export function useMusicSnapshot(): MusicSnapshot {
  const c = typeof window === 'undefined' ? serverController : music();
  return useSyncExternalStore(c.subscribe, c.getSnapshot, () => IDLE);
}

/** Playback position of an uploaded file (zeros when another file is loaded). */
export function useFileProgress(id: string | null): FileProgress {
  const subscribe = useCallback(
    (listener: () => void) => (!id ? () => {} : music().subscribeFileProgress(listener)),
    [id],
  );
  const read = useCallback(() => (id ? music().fileProgress(id) : NO_PROGRESS), [id]);
  return useSyncExternalStore(subscribe, read, () => NO_PROGRESS);
}
