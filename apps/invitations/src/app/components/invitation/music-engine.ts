'use client';

// A small, dependency-free generative music engine built on the Web Audio API.
//
// - One AudioContext and one controller for the whole page, so the invitation,
//   the editor preview and the music picker can never play on top of each other.
// - Playback only ever starts from a user gesture (play()/toggle() are called
//   from click handlers); nothing here tries to get around autoplay rules.
// - Pausing fades out and suspends the context, so resuming is instant and no
//   duplicate schedulers or audio graphs are created.

import { useSyncExternalStore } from 'react';
import type { TrackId } from './catalog';

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

type Voice = 'piano' | 'harp' | 'bell' | 'pad' | 'bass';
/** at/len are in beats relative to the start of the bar. */
type NoteEvent = { at: number; note: string; len: number; voice: Voice; vel: number };
type Composition = { bpm: number; beatsPerBar: number; bar: (index: number) => NoteEvent[] };

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

const COMPOSITIONS: Record<TrackId, Composition> = { canon, waltz, evening, nocturne };

// ---------------------------------------------------------------------------
// Synthesis
// ---------------------------------------------------------------------------

type Bus = { dry: AudioNode; wet: AudioNode };

function playNote(ctx: AudioContext, bus: Bus, event: NoteEvent, start: number, secondsPerBeat: number) {
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
  } else {
    // piano / harp: plucked string with a closing filter
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    const bright = event.voice === 'harp' ? 3600 : 2600;
    filter.frequency.setValueAtTime(bright, start);
    filter.frequency.exponentialRampToValueAtTime(700, start + 1.4);
    filter.connect(out);
    nodes.push(filter);
    osc('triangle', f, 1).connect(filter);
    osc('sine', f * 2, 0.22).connect(filter);
    if (event.voice === 'piano') osc('sine', f * 3, 0.06).connect(filter);
    env.exponentialRampToValueAtTime(event.vel, start + 0.008);
    env.exponentialRampToValueAtTime(event.vel * 0.32, start + 0.45);
    end = start + Math.max(length, 0.5) + (event.voice === 'harp' ? 1.4 : 1.1);
    env.exponentialRampToValueAtTime(0.0001, end);
  }

  oscillators.forEach(o => { o.start(start); o.stop(end + 0.05); });
  oscillators[0].onended = () => nodes.forEach(n => n.disconnect());
}

function impulseResponse(ctx: AudioContext, seconds = 3) {
  const rate = ctx.sampleRate;
  const length = Math.floor(rate * seconds);
  const buffer = ctx.createBuffer(2, length, rate);
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3.2);
  }
  return buffer;
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

export type MusicStatus = 'idle' | 'starting' | 'playing' | 'paused' | 'error';
export type MusicSnapshot = { status: MusicStatus; trackId: TrackId | null; owner: string | null };

const VOLUME = 0.7;
const IDLE: MusicSnapshot = { status: 'idle', trackId: null, owner: null };

class MusicController {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private reverb: AudioNode | null = null;
  private sequencer: Sequencer | null = null;
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
    const master = ctx.createGain();
    master.gain.value = 0.0001;
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -16;
    compressor.ratio.value = 3;
    master.connect(compressor).connect(ctx.destination);

    const convolver = ctx.createConvolver();
    convolver.buffer = impulseResponse(ctx);
    const wet = ctx.createGain();
    wet.gain.value = 0.32;
    convolver.connect(wet).connect(master);

    this.ctx = ctx;
    this.master = master;
    this.reverb = convolver;

    document.addEventListener('visibilitychange', this.onVisibility);
    return ctx;
  }

  private onVisibility = () => {
    if (document.hidden && this.snapshot.status === 'playing') {
      this.resumeOnVisible = true;
      this.pause();
    } else if (!document.hidden && this.resumeOnVisible && this.snapshot.trackId) {
      this.resumeOnVisible = false;
      void this.play(this.snapshot.trackId, this.snapshot.owner ?? 'page');
    }
  };

  private fadeMaster(to: number, seconds: number) {
    if (!this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    const gain = this.master.gain;
    gain.cancelScheduledValues(now);
    gain.setValueAtTime(Math.max(gain.value, 0.0001), now);
    gain.linearRampToValueAtTime(Math.max(to, 0.0001), now + seconds);
  }

  async play(trackId: TrackId, owner: string) {
    const ctx = this.ensureContext();
    if (!ctx || !this.master || !this.reverb) {
      this.set({ status: 'error', trackId, owner });
      return;
    }
    if (this.suspendTimer !== null) {
      window.clearTimeout(this.suspendTimer);
      this.suspendTimer = null;
    }

    const sameTrack = this.sequencer && this.snapshot.trackId === trackId;
    this.set({ status: 'starting', trackId, owner });

    try {
      if (ctx.state !== 'running') await ctx.resume();
    } catch {
      this.set({ status: 'error' });
      return;
    }
    // A newer call may have changed the request while we were waiting.
    if (this.snapshot.trackId !== trackId || this.snapshot.status !== 'starting') return;

    if (!sameTrack) {
      this.sequencer?.stop();
      const composition = COMPOSITIONS[trackId] ?? COMPOSITIONS.canon;
      this.sequencer = new Sequencer(ctx, { dry: this.master, wet: this.reverb }, composition);
      this.sequencer.start();
    }
    this.fadeMaster(VOLUME, sameTrack ? 0.6 : 1.4);
    this.set({ status: 'playing' });
  }

  pause() {
    if (!this.ctx || (this.snapshot.status !== 'playing' && this.snapshot.status !== 'starting')) return;
    this.fadeMaster(0, 0.35);
    this.set({ status: 'paused' });
    const ctx = this.ctx;
    this.suspendTimer = window.setTimeout(() => {
      this.suspendTimer = null;
      if (this.snapshot.status === 'paused') void ctx.suspend().catch(() => {});
    }, 420);
  }

  toggle(trackId: TrackId, owner: string) {
    const s = this.snapshot;
    if ((s.status === 'playing' || s.status === 'starting') && s.trackId === trackId && s.owner === owner) this.pause();
    else void this.play(trackId, owner);
  }

  /** Stops playback entirely. With an owner, only stops if that owner started it. */
  stop(owner?: string) {
    if (owner && this.snapshot.owner !== owner) return;
    this.resumeOnVisible = false;
    this.sequencer?.stop(0.3);
    this.sequencer = null;
    if (this.ctx) {
      this.fadeMaster(0, 0.3);
      const ctx = this.ctx;
      if (this.suspendTimer !== null) window.clearTimeout(this.suspendTimer);
      this.suspendTimer = window.setTimeout(() => {
        this.suspendTimer = null;
        if (!this.sequencer) void ctx.suspend().catch(() => {});
      }, 400);
    }
    this.set(IDLE);
  }
}

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
