// Structural checks for the 6/8 invitation compositions.
// Run: npx tsx scripts/verify-music.ts
//
// Verifies, on the actual note events the engine schedules:
//  - the meter (6 eighths per bar, 2 dotted-quarter pulses, tempo in 55–85),
//  - every written bar adds up to exactly six eighths,
//  - the accompaniment accents subdivisions 1 and 4 (and 1 more than 4),
//  - melodies articulate the 3 + 3 grouping (onsets on 1 or 4 in every bar),
//  - strong-beat melody notes are chord tones (anything else is listed),
//  - the loop seam: the bar after the last one is the first bar of the form again.

import { ACCENT_6_8, SIX_EIGHT, barLength, midiOf, parseChords, type SixEightComposition } from '../src/app/components/invitation/compositions-6-8';
import { COMPOSITIONS } from '../src/app/components/invitation/music-engine';

let failures = 0;
const fail = (msg: string) => { failures++; console.log(`  ✗ ${msg}`); };
const ok = (msg: string) => console.log(`  ✓ ${msg}`);

const ACCOMPANIMENT = new Set(['piano', 'harp']);

for (const [id, comp] of Object.entries(SIX_EIGHT) as [string, SixEightComposition][]) {
  const { piece } = comp;
  console.log(`\n${id} — ${piece.key}, 6/8, dotted quarter = ${piece.pulse} (eighth = ${comp.bpm})`);
  if (COMPOSITIONS[id as keyof typeof COMPOSITIONS] !== comp) fail('not registered in the engine');

  // Meter
  if (comp.beatsPerBar !== 6 || comp.meter?.numerator !== 6 || comp.meter?.denominator !== 8 || comp.meter.pulses !== 2) fail('meter is not 6/8');
  else ok('meter 6/8 — six eighth-note units per bar, two dotted-quarter pulses');
  if (comp.bpm !== piece.pulse * 3) fail('eighth-note rate is not 3 × pulse');
  if (piece.pulse < 55 || piece.pulse > 85) fail(`pulse ${piece.pulse} outside 55–85`);

  // Bar lengths
  let bad = 0;
  for (const s of piece.form) {
    if (s.melody.length !== s.chords.length || (s.counter && s.counter.length !== s.chords.length)) fail(`${s.label}: line lengths differ from chord count`);
    [...s.melody, ...(s.counter ?? [])].forEach((bar, i) => {
      if (barLength(bar) !== 6) { bad++; fail(`${s.label} bar ${i + 1} "${bar}" = ${barLength(bar)} eighths`); }
    });
  }
  if (!bad) ok('every melody/counter bar sums to exactly 6 eighths');

  const intro = comp.introBars ?? 0;
  const loop = comp.loopBars ?? 0;
  const total = intro + loop * 2;
  const secondsPerBar = (6 * 60) / comp.bpm;
  ok(`form: ${intro}-bar intro, then ${piece.form.map(s => `${s.label}(${s.chords.length})`).join(' ')} = ${loop} bars ≈ ${(loop * secondsPerBar).toFixed(1)} s per pass`);

  // Accents & onsets, measured on the scheduled events
  const accVel = Array(6).fill(0), accN = Array(6).fill(0);
  let barsWithoutBeatOnset = 0;
  const melodyHist = Array(6).fill(0);
  let eventsChecked = 0;
  for (let i = 0; i < total; i++) {
    const events = comp.bar(i);
    for (const e of events) {
      eventsChecked++;
      if (!(e.at >= 0 && e.at < 6) || !(e.len > 0)) fail(`bar ${i}: event out of bar ${JSON.stringify(e)}`);
      midiOf(e.note);
    }
    if (i < intro) continue;
    const loopIndex = (i - intro) % loop;
    let k = loopIndex, section = piece.form[0];
    for (const s of piece.form) { if (k < s.chords.length) { section = s; break; } k -= s.chords.length; }
    // accompaniment = the figure voices that are not the written melody
    const melodyNotes = new Set(section.melody[k].split(/\s+/).map(t => t.split(':')[0]));
    for (const e of events) {
      const slot = Math.round(e.at);
      if (ACCOMPANIMENT.has(e.voice) && !melodyNotes.has(e.note) && Math.abs(e.at - slot) < 0.05) { accVel[slot] += e.vel; accN[slot]++; }
    }
    let at = 0;
    const onsets: number[] = [];
    for (const token of section.melody[k].split(/\s+/)) {
      const [note, len] = token.split(':');
      if (note !== 'r') { onsets.push(at); melodyHist[at]++; }
      at += Number(len);
    }
    if (!onsets.some(o => o === 0 || o === 3)) barsWithoutBeatOnset++;
  }
  const mean = accVel.map((v, i) => v / Math.max(1, accN[i]));
  const fmt = mean.map(v => v.toFixed(3)).join('  ');
  if (mean[0] > mean[3] && [1, 2, 4, 5].every(i => mean[3] > mean[i] * 1.2)) ok(`accompaniment mean velocity by eighth 1..6: ${fmt} (accents on 1 and 4)`);
  else fail(`accents not on 1 and 4: ${fmt}`);
  ok(`accent profile used: ${ACCENT_6_8.join(' ')}`);
  if (barsWithoutBeatOnset) fail(`${barsWithoutBeatOnset} melody bars with no onset on 1 or 4`);
  else ok(`melody onsets per eighth 1..6 over two passes: ${melodyHist.join(' ')} — every bar articulates 1 or 4`);
  ok(`${eventsChecked} scheduled events checked over ${total} bars`);

  // Strong-beat consonance
  const odd: string[] = [];
  for (const s of piece.form) {
    s.melody.forEach((bar, i) => {
      const chords = parseChords(s.chords[i]);
      let at = 0;
      for (const token of bar.split(/\s+/)) {
        const [note, len] = token.split(':');
        if (note !== 'r' && (at === 0 || at === 3)) {
          const chord = chords.length > 1 && at === 3 ? chords[1] : chords[0];
          const pcs = new Set([chord.bass, ...chord.tones].map(n => midiOf(n) % 12));
          if (!pcs.has(midiOf(note) % 12)) odd.push(`${s.label}${i + 1}@${at + 1}:${note}`);
        }
        at += Number(len);
      }
    });
  }
  ok(`strong-beat non-chord melody notes (intentional appoggiaturas/suspensions): ${odd.length ? odd.join(', ') : 'none'}`);

  // Ranges
  const mel = piece.form.flatMap(s => s.melody.join(' ').split(/\s+/).map(t => t.split(':')[0]).filter(n => n !== 'r'));
  const mids = mel.map(midiOf);
  ok(`melody range MIDI ${Math.min(...mids)}–${Math.max(...mids)}`);

  // Loop seam
  const firstFormBar = JSON.stringify(comp.bar(intro).map(e => [e.note, e.voice]).filter(([, v]) => v !== 'strings' && v !== 'pad' && v !== 'bell'));
  const wrapBar = JSON.stringify(comp.bar(intro + loop).map(e => [e.note, e.voice]).filter(([, v]) => v !== 'strings' && v !== 'pad' && v !== 'bell'));
  if (firstFormBar === wrapBar) ok('loop seam: bar after the last bar is the first bar of the form (same chord + melody)');
  else fail('loop seam mismatch');
  const last = piece.form[piece.form.length - 1];
  const lastChord = parseChords(last.chords[last.chords.length - 1]).at(-1)!;
  const firstChord = parseChords(piece.form[0].chords[0])[0];
  ok(`seam harmony: ${lastChord.bass}… → ${firstChord.bass}…; last melody bar "${last.melody.at(-1)}" → first "${piece.form[0].melody[0]}"`);
  const interval = Math.abs(midiOf(parseCharsLast(last.melody.at(-1)!)) - midiOf(piece.form[0].melody[0].split(':')[0]));
  ok(`melodic step across the seam: ${interval} semitones`);
}

function parseCharsLast(bar: string) {
  const notes = bar.split(/\s+/).map(t => t.split(':')[0]).filter(n => n !== 'r');
  return notes[notes.length - 1];
}

console.log(failures ? `\n${failures} check(s) failed` : '\nAll 6/8 checks passed');
process.exit(failures ? 1 : 0);
