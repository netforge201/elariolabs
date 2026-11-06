// Generates the artwork for the Azerbaijani carpet & buta collection.
//
//   node scripts/carpet-art/generate.mjs                 → writes the app module
//   node scripts/carpet-art/generate.mjs --specimens DIR → also writes standalone
//                                                          SVGs + tile previews for review
//
// Output: src/app/components/invitation/carpet-art.ts (committed). The art uses
// palette classes (kr, kn, kg …) so each template re-colours it through CSS.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  f, pt, rot, butaFrame, butaSamples, spaced, volute, petal, ring, rosette, blossom, palmette, leaf,
} from './geometry.mjs';
import {
  raster, mirror8, toSvg,
  golHooked, golSmall, golStar, cornerStar,
  guardReciprocal, guardBarber, guardS, guardStars, mainStarOctagons, mainWineGlass,
  fieldLattice, fieldStars, fieldBoteh,
} from './knots.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(here, '../../src/app/components/invitation/carpet-art.ts');

// ---------------------------------------------------------------------------
// Buta artwork
// ---------------------------------------------------------------------------

const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const quad = (a, c, b, t) => lerp(lerp(a, c, t), lerp(c, b, t), t);
const quadTan = (a, c, b, t) => {
  const p = lerp(c, b, t), q = lerp(a, c, t);
  return (Math.atan2(p[1] - q[1], p[0] - q[0]) * 180) / Math.PI;
};

/** Paints concentric bands: [[inset, class], …] from the outside in. */
function bands(R, rotate, at, list) {
  return list.map(([d, cls]) => {
    const fr = butaFrame({ R, d, rotate, at });
    return fr ? `<path class="${cls}" d="${fr.path}"/>` : '';
  }).join('');
}

/** Beads (dots) evenly spaced along the centre line of a band. */
function beads(R, rotate, at, d, spacing, r, cls, skip = 0) {
  const fr = butaFrame({ R, d: 0, rotate, at });
  const pts = spaced(butaSamples({ R, d, rotate, at }), spacing, { skipNearTip: skip, tip: fr.points.tip });
  return `<path class="${cls}" d="${pts.map(({ p }) => ring(p, r)).join('')}"/>`;
}

/** A dotted line following an inset contour (round-capped zero-length dashes). */
function dottedContour(R, rotate, at, d, gap, w, cls = 'ksg') {
  const fr = butaFrame({ R, d, rotate, at });
  return fr ? `<path class="${cls}" fill="none" stroke-width="${w}" stroke-linecap="round" stroke-dasharray="0 ${gap}" d="${fr.path}"/>` : '';
}

/** Small lozenges oriented along a band, alternating two classes. */
function lozenges(R, rotate, at, d, spacing, len, wid, clsA, clsB, skip = 0) {
  const fr = butaFrame({ R, d: 0, rotate, at });
  const pts = spaced(butaSamples({ R, d, rotate, at }), spacing, { skipNearTip: skip, tip: fr.points.tip });
  let a = '', b = '';
  pts.forEach(({ p, ang }, i) => {
    const P = [[len / 2, 0], [0, wid / 2], [-len / 2, 0], [0, -wid / 2]].map(q => rot([p[0] + q[0], p[1] + q[1]], ang, p));
    const d2 = `M${P.map(q => pt(...q)).join('L')}Z`;
    if (i % 2) a += d2; else b += d2;
  });
  return `<path class="${clsA}" d="${a}"/><path class="${clsB}" d="${b}"/>`;
}

/** Spiral tendril continuing from the tip (stroked). */
function tipCurl(R, rotate, at, size, cls = 'ksg', w = 2.4) {
  const fr = butaFrame({ R, d: 0, rotate, at });
  const tip = fr.points.tip;
  // outward direction at the tip = local "up", rotated
  // The tail reaches the tip travelling toward local -x; the curl carries on
  // that way and rolls down into the concave side (a volute of 3 turns).
  const start = tip;
  const d = volute(start, 90 + rotate, size, 3, 0.55, 1);
  return `<path class="${cls}" fill="none" stroke-width="${w}" stroke-linecap="round" d="${d}"/>`;
}

function bbox(R, rotate, at, pad, extra = []) {
  const s = butaSamples({ R, d: 0, rotate, at }, 400).concat(extra);
  const xs = s.map(p => p[0]), ys = s.map(p => p[1]);
  const x0 = Math.min(...xs) - pad, y0 = Math.min(...ys) - pad, x1 = Math.max(...xs) + pad, y1 = Math.max(...ys) + pad;
  return [x0, y0, x1 - x0, y1 - y0].map(f);
}

/** The flowering spine inside the buta: belly gul → leaves → blossoms → palmette bud. */
function spineFlora(R, rotate, at, dField, { lite = false } = {}) {
  const inner = butaFrame({ R, d: dField, rotate, at });
  const local = inner.local;
  const L = p => inner.T(p);
  const belly = [0, R / 2];
  const tipL = local.tip;
  // Choose the stem's bow and reach so the whole stem plus the terminal bud
  // stays inside the field with a margin (computed, not hand-placed).
  const field = butaInside(R, rotate);
  const inField = (q, m) => field(q[0] - at[0], q[1] - at[1], dField + m);
  let best = null;
  for (let reach = 0.9; reach >= 0.45 && !best; reach -= 0.03) {
    for (const bow of [0.3, 0.22, 0.14, 0.06, 0.38]) {
      const end = lerp(belly, tipL, reach);
      const ctrl = [lerp(belly, tipL, 0.5)[0] + R * bow, lerp(belly, tipL, 0.5)[1] + R * bow * 0.35];
      const A = L(belly), C = L(ctrl), B = L(end);
      let ok = true;
      for (let t = 0.2; t <= 1.0001 && ok; t += 0.05) ok = inField(quad(A, C, B, t), t > 0.9 ? 9 : 6);
      if (ok) best = { A, C, B };
    }
  }
  const { A: a, C: c, B: b } = best ?? { A: L(belly), C: L(belly), B: L(lerp(belly, tipL, 0.4)) };
  const stem = `M${pt(...a)}Q${pt(...c)} ${pt(...b)}`;
  let leaves = '', veins = '', small = '';
  const leafLen = R * (lite ? 0.2 : 0.24);
  (lite ? [[0.45, 1], [0.62, -1], [0.78, 1]] : [[0.36, 1], [0.48, -1], [0.6, 1], [0.72, -1], [0.83, 1]]).forEach(([t, side], i) => {
    const p = quad(a, c, b, t);
    const ang = quadTan(a, c, b, t);
    const lf = leaf(p, leafLen * (1 - i * 0.12), ang + side * 46, 0.34);
    leaves += lf.body; veins += lf.vein;
  });
  if (!lite) {
    small += blossom(quad(a, c, b, 0.54), R * 0.08, ['ko', 'kc', 'kg'], 10);
    small += blossom(quad(a, c, b, 0.77), R * 0.062, ['kr', 'kc', 'kg'], -8);
  }
  small += palmette(b, R * (lite ? 0.15 : 0.19), quadTan(a, c, b, 1), ['kr', 'ko', 'kg', 'kc', 'kg']);
  // Floret trail: follows a deeper inset contour up the tail, shrinking toward the tip.
  const deep = dField + 6;
  const trailFr = butaFrame({ R, d: deep, rotate, at });
  if (trailFr) {
    const tipW = butaFrame({ R, d: 0, rotate, at }).points.tip;
    const pts = spaced(butaSamples({ R, d: deep, rotate, at }), R * 0.085)
      .filter(({ p }) => {
        const [lx, ly] = rot([p[0] - at[0], p[1] - at[1]], -rotate);
        return lx > R * 0.14 && ly < R * 0.18 && Math.hypot(p[0] - tipW[0], p[1] - tipW[1]) > R * (lite ? 0.42 : 0.3);
      });
    const far = Math.max(1, ...pts.map(({ p }) => Math.hypot(p[0] - tipW[0], p[1] - tipW[1])));
    pts.forEach(({ p }, i) => {
      const k = 0.55 + 0.45 * (Math.hypot(p[0] - tipW[0], p[1] - tipW[1]) / far);
      small += i % 2 ? blossom(p, R * 0.042 * k, ['kr', 'kc', 'kg'], i * 17) : `<path class="ko" d="${ring(p, R * 0.022 * k)}"/><path class="kg" d="${ring(p, R * 0.011 * k)}"/>`;
    });
  }
  const rose = rosette(a, Math.min(inner.r1 - 3, R * 0.29), { cls: ['kr', 'ko', 'kc', 'kg', 'kn'] });
  return `<path class="ksn" fill="none" stroke-width="${f(R * 0.024)}" stroke-linecap="round" d="${stem}"/>` +
    `<path class="kt" d="${leaves}"/><path class="ksg" fill="none" stroke-width="${f(R * 0.008)}" d="${veins}"/>` +
    small + rose;
}

/** Large floral buta: five bands, a bead row, a lozenge band and a flowering spine. */
function butaFloral(R = 100, rotate = 6) {
  const at = [0, 0];
  const art =
    bands(R, rotate, at, [[0, 'kg'], [2.8, 'kr'], [11.2, 'kg'], [12.6, 'kn'], [19.4, 'kg'], [20.8, 'kc']]) +
    beads(R, rotate, at, 7, 7.4, 1.85, 'kc', 22) +
    lozenges(R, rotate, at, 16, 7.6, 5, 2.8, 'ko', 'kc', 38) +
    dottedContour(R, rotate, at, 25, 4.2, 1.5, 'ksr') +
    spineFlora(R, rotate, at, 25) +
    tipCurl(R, rotate, at, 7.5);
  const fr = butaFrame({ R, d: 0, rotate, at });
  return { vb: bbox(R, rotate, at, 6, [[fr.points.tip[0] - 22, fr.points.tip[1] - 22], [fr.points.tip[0] + 6, fr.points.tip[1] - 26]]).join(' '), svg: art };
}

/** "Balalı buta" — a mother buta holding two young butas. */
function butaBalali(R = 100, rotate = 4) {
  const at = [0, 0];
  const outer =
    bands(R, rotate, at, [[0, 'kg'], [2.6, 'kn'], [10, 'kg'], [11.4, 'kr'], [17.2, 'kg'], [18.6, 'kc']]) +
    beads(R, rotate, at, 6.3, 7, 1.7, 'ko', 20) +
    beads(R, rotate, at, 14.3, 6.2, 1.25, 'kc', 34);
  const inner = butaFrame({ R, d: 18.6, rotate, at });
  const field = butaInside(R, rotate);
  // Search position (around a seed point) and rotation for the largest child
  // whose whole outline (and curl) stays inside the field with a margin.
  const fits = (k, c, rr, margin) => butaSamples({ R: k, d: 0, rotate: rotate + rr, at: c }, 140)
    .every(([x, y]) => field(x, y, 18.6 + margin));
  const fit = (seed, rMax, margin, avoid = null) => {
    let best = { r: 0 };
    for (let dx = -12; dx <= 12; dx += 3) for (let dy = -12; dy <= 12; dy += 3) for (let rr = -20; rr <= 50; rr += 5) {
      const c = inner.T([seed[0] + dx, seed[1] + dy]);
      if (avoid && Math.hypot(c[0] - avoid.c[0], c[1] - avoid.c[1]) < avoid.r * 1.15 + 6) continue;
      let lo = best.r, hi = rMax;
      if (!fits(lo + 0.5, c, rr, margin)) continue;
      while (hi - lo > 0.5) { const mid = (lo + hi) / 2; if (fits(mid, c, rr, margin)) lo = mid; else hi = mid; }
      if (lo > best.r) best = { r: lo, c, rr };
    }
    return best;
  };
  // first child in the belly, second child up in the tail
  const child = (spec) => {
    const { r, c, rr } = spec;
    return bands(r, rotate + rr, c, [[0, 'kg'], [r * 0.07, 'kr'], [r * 0.19, 'kg'], [r * 0.23, 'kc']]) +
      beads(r, rotate + rr, c, r * 0.13, r * 0.15, r * 0.03, 'kc', r * 0.5) +
      rosette(butaFrame({ R: r, d: 0, rotate: rotate + rr, at: c }).T([0, r / 2]), r * 0.16, { seeds: false });
  };
  const bigSpec = fit([-R * 0.04, R * 0.36], R * 0.5, 4);
  const smallSpec = fit([R * 0.44, -R * 0.02], R * 0.3, 3.5, { c: bigSpec.c, r: bigSpec.r });
  const big = child(bigSpec);
  const small = child(smallSpec);
  const dots = [0.3, 0.55, 0.8].map(t => ring(inner.T(lerp([R * 0.36, R * 0.56], [R * 0.56, R * 0.3], t)), R * 0.016)).join('');
  const fr = butaFrame({ R, d: 0, rotate, at });
  return {
    vb: bbox(R, rotate, at, 6, [[fr.points.tip[0] - 22, fr.points.tip[1] - 22], [fr.points.tip[0] + 6, fr.points.tip[1] - 26]]).join(' '),
    svg: outer + big + small + `<path class="kg" d="${dots}"/>` + tipCurl(R, rotate, at, 7.5, 'ksg', 2.4),
  };
}

/** Smaller decorative buta: three bands, beads and a single gul. */
function butaSmall(R = 100, rotate = 8) {
  const at = [0, 0];
  const art =
    bands(R, rotate, at, [[0, 'kg'], [3.2, 'kr'], [13.4, 'kg'], [16, 'kc']]) +
    beads(R, rotate, at, 8.3, 8, 2.1, 'kc', 22) +
    dottedContour(R, rotate, at, 21, 4.6, 1.5, 'ksg') +
    spineFlora(R, rotate, at, 21, { lite: true }) +
    tipCurl(R, rotate, at, 7, 'ksg', 2.6);
  const fr = butaFrame({ R, d: 0, rotate, at });
  return { vb: bbox(R, rotate, at, 6, [[fr.points.tip[0] - 22, fr.points.tip[1] - 22], [fr.points.tip[0] + 6, fr.points.tip[1] - 24]]).join(' '), svg: art };
}

/** Symmetric pair: two butas back to back, tips curling outward, a palmette between. */
function butaPair() {
  const R = 60, rotate = -14, at = [44, 8];
  const one = bands(R, rotate, at, [[0, 'kg'], [2, 'kr'], [8, 'kg'], [9, 'kn'], [13, 'kg'], [14, 'kc']]) +
    beads(R, rotate, at, 5, 5.6, 1.25, 'kc', 8) +
    (() => { const inn = butaFrame({ R, d: 14, rotate, at }); return rosette(inn.T([0, R / 2]), inn.r1 - 3); })() +
    tipCurl(R, rotate, at, 5, 'ksg', 1.8);
  const pal = palmette([0, -22], 44, -90, ['kr', 'ko', 'kg', 'kc', 'kg'], { calyx: false }) + rosette([0, -20], 9) + rosette([0, 58], 11);
  const art = `<g>${one}</g><g transform="scale(-1 1)">${one}</g>${pal}`;
  const fr = butaFrame({ R, d: 0, rotate, at });
  const s = butaSamples({ R, d: 0, rotate, at }, 200);
  const xs = s.map(p => p[0]), ys = s.map(p => p[1]);
  const X = Math.max(...xs) + 6, y0 = Math.min(Math.min(...ys), fr.points.tip[1] - 18) - 6, y1 = Math.max(...ys) + 6;
  return { vb: [-X, y0, 2 * X, y1 - y0].map(f).join(' '), svg: art };
}

// ---------------------------------------------------------------------------
// Floral compositions
// ---------------------------------------------------------------------------

/**
 * Islimi vine: a sinuous stem of tangent circular arcs; every lobe carries a
 * curling tendril that ends in a palmette, a gul or a blossom; leaves pair at
 * each turn. Height H, drawn top to bottom.
 */
function vine(H = 420, lobes = 4) {
  const amp = 22, step = H / lobes;
  let stem = `M0 0`, flowers = '', leaves = '', veins = '', tendrils = '';
  for (let i = 0; i < lobes; i++) {
    const side = i % 2 ? -1 : 1;
    const y0 = i * step, y1 = (i + 1) * step;
    stem += `C${pt(side * amp * 1.35, y0 + step * 0.22)} ${pt(side * amp * 1.35, y0 + step * 0.78)} ${pt(0, y1)}`;
    // tendril from the lobe apex outward
    const apex = [side * amp * 1.01, y0 + step * 0.5];
    const ten = volute(apex, side > 0 ? -60 : -120, 9, 2, 0.5, side > 0 ? 1 : 0);
    tendrils += ten;
    const fl = [apex[0] + side * 30, apex[1] - 14];
    if (i % 3 === 0) flowers += palmette([apex[0] + side * 12, apex[1] - 4], 34, side > 0 ? -40 : -140);
    else if (i % 3 === 1) flowers += rosette(fl, 15);
    else flowers += blossom(fl, 12);
    // leaf pair at the turn
    const turn = [0, y1];
    [[side * 1, 1], [-side * 1, 0.8]].forEach(([s, k]) => {
      const lf = leaf(turn, 26 * k, s > 0 ? -25 : -155, 0.36);
      leaves += lf.body; veins += lf.vein;
    });
  }
  const art = `<path class="ksg" fill="none" stroke-width="3" stroke-linecap="round" d="${stem}"/>` +
    `<path class="ksg" fill="none" stroke-width="1.8" stroke-linecap="round" d="${tendrils}"/>` +
    `<path class="kt" d="${leaves}"/><path class="ksg" fill="none" stroke-width=".9" d="${veins}"/>` + flowers;
  return { vb: `-78 -26 156 ${f(H + 46)}`, svg: art };
}

/** Garden corner: a small buta on the diagonal with two leafy sprays along the edges. */
function cornerGarden() {
  const b = butaSmallGroup();
  const spray = (deg) => {
    let s = '', l = '', v = '';
    const base = [0, 0];
    const len = 120;
    const end = rot([len, 0], deg);
    const c = rot([len * 0.5, 14], deg);
    s += `M${pt(...base)}Q${pt(...c)} ${pt(...end)}`;
    [0.3, 0.52, 0.74].forEach((t, i) => {
      const p = quad(base, c, end, t);
      const ang = quadTan(base, c, end, t);
      const lf1 = leaf(p, 20 - i * 3, ang - 50, 0.36), lf2 = leaf(p, 18 - i * 3, ang + 50, 0.36);
      l += lf1.body + lf2.body; v += lf1.vein + lf2.vein;
    });
    return { s, l, v, end, ang: quadTan(base, c, end, 1) };
  };
  const a = spray(8), c2 = spray(82);
  return {
    vb: '-18 -18 170 170',
    svg: `<path class="ksg" fill="none" stroke-width="2.4" stroke-linecap="round" d="${a.s}${c2.s}"/>` +
      `<path class="kt" d="${a.l}${c2.l}"/><path class="ksg" fill="none" stroke-width=".8" d="${a.v}${c2.v}"/>` +
      blossom(a.end, 10, ['kr', 'kc', 'kg']) + blossom(c2.end, 10, ['kr', 'kc', 'kg']) +
      `<g transform="translate(66 66) rotate(-45) scale(.36) translate(-12 -6)">${b}</g>` +
      rosette([8, 8], 12),
  };
}
function butaSmallGroup() { return butaSmall(100, 0).svg; }

/** Crest: a palmette rising between two scrolling leaves, with a gul below (Garden top / bottom). */
function crest() {
  const pal = palmette([0, 30], 58, -90);
  let l = '', v = '', s = '';
  [-1, 1].forEach(side => {
    s += volute([side * 14, 34], side > 0 ? 0 : 180, 14, 3, 0.55, side > 0 ? 0 : 1);
    const lf = leaf([side * 16, 36], 40, side > 0 ? 14 : 166, 0.32);
    l += lf.body; v += lf.vein;
  });
  return {
    vb: '-78 -36 156 104',
    svg: `<path class="ksg" fill="none" stroke-width="2" stroke-linecap="round" d="${s}"/>` +
      `<path class="kt" d="${l}"/><path class="ksg" fill="none" stroke-width=".8" d="${v}"/>` + pal + rosette([0, 44], 13),
  };
}

/** Pendant hanging from an arch apex: a gul, a palmette and bead chain (Oriental Palace). */
function pendant() {
  const chain = [6, 14, 22].map(y => ring([0, y], 1.8)).join('');
  return {
    vb: '-30 0 60 96',
    svg: `<path class="kg" d="${chain}"/>` + palmette([0, 66], 34, 90) + rosette([0, 40], 12),
  };
}

/** Divider: stepped lozenge between two lines ending in small palmette buds. */
function divider() {
  const g = mirror8(5, (a, b) => {
    const d1 = a + b;
    if (d1 <= 1) return 'c';
    if (d1 <= 3) return 'r';
    if (d1 <= 5 && a <= 4) return 'g';
    return null;
  });
  const knots = toSvg(g, { unit: 2 });
  return {
    vb: '0 0 220 22',
    svg: `<path class="ksg" fill="none" stroke-width="1.2" stroke-linecap="round" d="M10 11H92M128 11H210"/>` +
      `<g transform="translate(99 0)">${knots}</g>` +
      `<path class="kg" d="${petal([92, 11], 180, 0, 9, 3.6)}${petal([128, 11], 0, 0, 9, 3.6)}${ring([6, 11], 2)}${ring([214, 11], 2)}"/>`,
  };
}

// ---------------------------------------------------------------------------
// Knot-grid assets
// ---------------------------------------------------------------------------

function knotArt(g) {
  return { vb: `0 0 ${g.w} ${g.h}`, svg: toSvg(g), w: g.w, h: g.h };
}

/** Spandrel: the lower-right quarter of a hooked göl, set into each field corner. */
function spandrel() {
  const g = golHooked(22);
  const N = 22;
  return raster(N + 1, N + 1, (x, y) => g.cells[N + y][N + x]);
}

/** Woven (knotted) buta for the Heritage base row. */
function butaWoven() {
  const R = 11, rotate = 6;
  const inside = butaInside(R, rotate);
  const W = 19, H = 26, cx = 9, cy = 13;
  const g = raster(W, H, (x, y) => {
    const lx = x + 0.5 - cx, ly = y + 0.5 - cy;
    if (!inside(lx, ly, 0)) return null;
    if (!inside(lx, ly, 1.2)) return 'g';
    if (!inside(lx, ly, 2.6)) return 'r';
    if (!inside(lx, ly, 3.6)) return 'c';
    // a stepped flower in the belly
    const bx = lx - rot([0, R / 2], rotate)[0], by = ly - rot([0, R / 2], rotate)[1];
    if (Math.abs(bx) + Math.abs(by) <= 1.2) return 'g';
    if (Math.abs(bx) + Math.abs(by) <= 2.4) return 'r';
    return 'c';
  });
  return g;
}

/** Point-in-buta test in local coordinates, for rasterizing butas onto the knot grid. */
function butaInside(R, rotate) {
  return (x, y, d) => {
    const [lx, ly] = rot([x, y], -rotate);
    const Rb = R - d, r1 = R / 2 - d, r2 = R / 2 + d;
    if (r1 <= 0) return false;
    const inBack = lx >= 0 && Math.hypot(lx, ly) <= Rb && Math.hypot(lx, ly + R / 2) >= r2;
    const inBelly = Math.hypot(lx, ly - R / 2) <= r1;
    return inBack || inBelly;
  };
}

// ---------------------------------------------------------------------------
// Assemble
// ---------------------------------------------------------------------------

const ART = {
  butaFloral: butaFloral(),
  butaBalali: butaBalali(),
  butaSmall: butaSmall(),
  butaPair: butaPair(),
  vine: vine(),
  cornerGarden: cornerGarden(),
  crest: crest(),
  pendant: pendant(),
  divider: divider(),
  golHooked: knotArt(golHooked()),
  golSmall: knotArt(golSmall()),
  golStar: knotArt(golStar()),
  spandrel: knotArt(spandrel()),
  butaWoven: knotArt(butaWoven()),
};

const tile = g => [g.w, g.h, toSvg(g)];
const TILES = {
  reciprocal: tile(guardReciprocal()),
  barber: tile(guardBarber()),
  sChain: tile(guardS()),
  starGuard: tile(guardStars()),
  octagons: tile(mainStarOctagons()),
  wineGlass: tile(mainWineGlass()),
  lattice: tile(fieldLattice()),
  stars: tile(fieldStars()),
  boteh: tile(fieldBoteh(butaInside(7, 6))),
};

const CORNERS = Object.fromEntries([8, 9, 11, 21, 22, 24, 32].map(t => [t, toSvg(cornerStar(t))]));

const banner = '// GENERATED by scripts/carpet-art/generate.mjs — do not edit by hand.\n// Regenerate with: node scripts/carpet-art/generate.mjs\n\n';
const ts = banner +
  `export type ArtName = ${Object.keys(ART).map(k => `'${k}'`).join(' | ')};\n` +
  `export type TileName = ${Object.keys(TILES).map(k => `'${k}'`).join(' | ')};\n\n` +
  `/** Standalone ornaments: viewBox + inner SVG markup (palette classes only, no ids). */\n` +
  `export const ART: Record<ArtName, { vb: string; svg: string }> = ${JSON.stringify(Object.fromEntries(Object.entries(ART).map(([k, v]) => [k, { vb: v.vb, svg: v.svg }])), null, 1)};\n\n` +
  `/** Border / field tiles: [width, height, svg] in knots; height = band thickness. */\n` +
  `export const TILES: Record<TileName, [number, number, string]> = ${JSON.stringify(TILES, null, 1)};\n\n` +
  `/** Corner blocks (square, in knots) keyed by the band thickness they turn. */\n` +
  `export const CORNERS: Record<number, string> = ${JSON.stringify(CORNERS, null, 1)};\n`;
fs.writeFileSync(OUT, ts);
console.log(`wrote ${path.relative(process.cwd(), OUT)} (${(ts.length / 1024).toFixed(1)} KB)`);

// ---------------------------------------------------------------------------
// Specimens for review (standalone SVGs with a fixed palette)
// ---------------------------------------------------------------------------

const specIdx = process.argv.indexOf('--specimens');
if (specIdx > 0) {
  const dir = process.argv[specIdx + 1];
  fs.mkdirSync(dir, { recursive: true });
  const style = '<style>.kr{fill:#b3262e}.kR{fill:#7d1a22}.kn{fill:#1c2347}.kg{fill:#d4a957}.kc{fill:#f4e9d3}.ko{fill:#e0782f}.kd{fill:#141a38}.kt{fill:#3f6b4f}.kb{fill:#5d86a8}.ksg{stroke:#d4a957}.ksn{stroke:#1c2347}.ksr{stroke:#b3262e}</style>';
  for (const [k, v] of Object.entries(ART)) {
    const [, , w, h] = v.vb.split(' ').map(Number);
    fs.writeFileSync(path.join(dir, `${k}.svg`),
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${v.vb}" width="${f(w * 3)}" height="${f(h * 3)}"><title>${k}</title>${style}${v.svg}</svg>`);
  }
  for (const [k, [w, h, svg]] of Object.entries(TILES)) {
    const reps = 5;
    fs.writeFileSync(path.join(dir, `tile-${k}.svg`),
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w * reps} ${h * (k === 'lattice' || k === 'stars' || k === 'boteh' ? reps : 1)}"><title>${k} ×${reps}</title>${style}` +
      Array.from({ length: reps * (k === 'lattice' || k === 'stars' || k === 'boteh' ? reps : 1) }, (_, i) => {
        const row = Math.floor(i / reps), col = i % reps;
        return `<g transform="translate(${col * w} ${row * h})">${svg}</g>`;
      }).join('') + `</svg>`);
  }
  console.log(`specimens → ${dir}`);
}
