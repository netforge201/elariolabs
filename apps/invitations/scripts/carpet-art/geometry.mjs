// Computed geometry for the carpet & buta collection (see generate.mjs).
// Everything here is deterministic: the same inputs always produce the same
// path data, so the generated artwork can be regenerated and reviewed.

export const f = n => (Math.abs(n) < 1e-9 ? 0 : +n.toFixed(2));
export const pt = (x, y) => `${f(x)} ${f(y)}`;
const rad = d => (d * Math.PI) / 180;
export function rot([x, y], deg, [cx, cy] = [0, 0]) {
  const a = rad(deg), c = Math.cos(a), s = Math.sin(a);
  return [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c];
}

// ---------------------------------------------------------------------------
// Buta (boteh) — the yin-yang construction
// ---------------------------------------------------------------------------
//
// In local coordinates (y down) the silhouette is bounded by three circles:
//   back:  centre O = (0, 0),     radius R   — the big convex back (x ≥ 0 side)
//   belly: centre C1 = (0, R/2),  radius R/2 — convex lower lobe (x ≤ 0 side)
//   neck:  centre C2 = (0, -R/2), radius R/2 — concave curve up to the tip
// Back meets belly tangentially at the base, belly meets neck tangentially
// (the S-curve), and back meets neck in the sharp tip at (0, -R). Because the
// boundary is made of circle arcs, the shape inset by d is again three arcs
// (radii R-d, R/2-d, R/2+d), so every decorative band has an even width.

export function butaFrame({ R, d = 0, rotate = 0, at = [0, 0] }) {
  const Rb = R - d, r1 = R / 2 - d, r2 = R / 2 + d;
  if (r1 <= 0.5) return null;
  // tip: intersection of the back circle and the neck circle (x > 0)
  const ty = (r2 * r2 - Rb * Rb - (R * R) / 4) / R;
  const tx = Math.sqrt(Math.max(0, Rb * Rb - ty * ty));
  // Past this depth the tip would fold below the waist and the arcs would cross.
  if (ty > -R * 0.12) return null;
  const local = {
    tip: [tx, ty], right: [Rb, 0], base: [0, R - d], left: [-r1, R / 2], waist: [0, d], neck: [r2, -R / 2],
  };
  const T = p => {
    const [x, y] = rot(p, rotate);
    return [x + at[0], y + at[1]];
  };
  const P = Object.fromEntries(Object.entries(local).map(([k, v]) => [k, T(v)]));
  // tip → right → base (back), base → left → waist (belly), waist → neck → tip (neck)
  const path =
    `M${pt(...P.tip)}` +
    `A${f(Rb)} ${f(Rb)} 0 0 1 ${pt(...P.right)}` +
    `A${f(Rb)} ${f(Rb)} 0 0 1 ${pt(...P.base)}` +
    `A${f(r1)} ${f(r1)} 0 0 1 ${pt(...P.left)}` +
    `A${f(r1)} ${f(r1)} 0 0 1 ${pt(...P.waist)}` +
    (Math.hypot(P.neck[0] - P.tip[0], P.neck[1] - P.tip[1]) < 0.6
      ? `A${f(r2)} ${f(r2)} 0 0 0 ${pt(...P.tip)}Z`
      : `A${f(r2)} ${f(r2)} 0 0 0 ${pt(...P.neck)}A${f(r2)} ${f(r2)} 0 0 0 ${pt(...P.tip)}Z`);
  return { path, points: P, T, Rb, r1, r2, local };
}

/** Polyline samples of an inset contour, for spacing beads and teeth evenly. */
export function butaSamples({ R, d, rotate = 0, at = [0, 0] }, n = 720) {
  const fr = butaFrame({ R, d, rotate, at });
  if (!fr) return [];
  const { Rb, r1, r2, local } = fr;
  const tipA = Math.atan2(local.tip[1], local.tip[0]);
  const nTipA = Math.atan2(local.tip[1] + R / 2, local.tip[0]);
  const arcs = [
    // back: from tip angle down to +90° (base), clockwise in y-down = increasing angle
    { c: [0, 0], r: Rb, a0: tipA, a1: Math.PI / 2 },
    // belly: from +90° (base) via 180° to 270° (waist) around C1
    { c: [0, R / 2], r: r1, a0: Math.PI / 2, a1: (3 * Math.PI) / 2 },
    // neck: from +90° (waist, bottom of C2) decreasing to the tip angle
    { c: [0, -R / 2], r: r2, a0: Math.PI / 2, a1: nTipA },
  ];
  const lens = arcs.map(a => Math.abs(a.a1 - a.a0) * a.r);
  const total = lens.reduce((s, l) => s + l, 0);
  const out = [];
  arcs.forEach((a, i) => {
    const k = Math.max(2, Math.round((n * lens[i]) / total));
    for (let j = 0; j < k; j++) {
      const t = a.a0 + ((a.a1 - a.a0) * j) / k;
      out.push(fr.T([a.c[0] + a.r * Math.cos(t), a.c[1] + a.r * Math.sin(t)]));
    }
  });
  return out;
}

/** Evenly spaced points (with inward normals) along a closed polyline. */
export function spaced(samples, spacing, { skipNearTip = 0, tip } = {}) {
  const segs = [];
  let total = 0;
  for (let i = 0; i < samples.length; i++) {
    const a = samples[i], b = samples[(i + 1) % samples.length];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]);
    segs.push([a, b, l, total]);
    total += l;
  }
  const count = Math.max(1, Math.round(total / spacing));
  const step = total / count;
  const res = [];
  let si = 0;
  for (let k = 0; k < count; k++) {
    const s = k * step + step / 2;
    while (si < segs.length - 1 && segs[si][3] + segs[si][2] < s) si++;
    const [a, b, l, s0] = segs[si];
    const t = l ? (s - s0) / l : 0;
    const p = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    const tx = (b[0] - a[0]) / (l || 1), ty = (b[1] - a[1]) / (l || 1);
    // contour runs clockwise (y down) → interior is to the right: normal = (-ty, tx)
    const nrm = [-ty, tx];
    if (tip && skipNearTip && Math.hypot(p[0] - tip[0], p[1] - tip[1]) < skipNearTip) continue;
    res.push({ p, n: nrm, ang: (Math.atan2(ty, tx) * 180) / Math.PI });
  }
  return res;
}

/** A volute: semicircles of shrinking radius on alternating sides (G1 smooth). */
export function volute(start, dirDeg, r0, turns = 3, ratio = 0.56, sweep = 1) {
  let p = [f(start[0]), f(start[1])], r = r0, d = dirDeg;
  let s = `M${pt(...p)}`;
  for (let i = 0; i < turns; i++) {
    // round the end first, then use half the rounded chord as the radius → exact semicircles
    const end = [f(p[0] + Math.cos(rad(d)) * 2 * r), f(p[1] + Math.sin(rad(d)) * 2 * r)];
    const rr = +(Math.hypot(end[0] - p[0], end[1] - p[1]) / 2).toFixed(4);
    s += `A${rr} ${rr} 0 0 ${sweep} ${pt(...end)}`;
    p = end; d += 180; r *= ratio;
  }
  return s;
}

// ---------------------------------------------------------------------------
// Petals, rosettes, palmettes, leaves
// ---------------------------------------------------------------------------

/** Petal from radius r0 to r1 along `deg` about c; `w` half-width; pointed or round tip. */
export function petal(c, deg, r0, r1, w, { round = false, belly = 0.42 } = {}) {
  const L = r1 - r0;
  const loc = (u, v) => rot([c[0] + u, c[1] + v], deg, c);
  const b = loc(r0, 0), tip = loc(r1, 0);
  const c1 = loc(r0 + L * 0.08, w * 0.9), c2 = loc(r0 + L * (round ? 0.98 : 0.78), w * (round ? 1.05 : 0.62));
  const c3 = loc(r0 + L * (round ? 0.98 : 0.78), -w * (round ? 1.05 : 0.62)), c4 = loc(r0 + L * 0.08, -w * 0.9);
  if (round) {
    const m1 = loc(r0 + L * belly, w), m2 = loc(r0 + L * belly, -w);
    // handles either side of the widest point are collinear (tangent = petal axis): no crease
    return `M${pt(...b)}C${pt(...c1)} ${pt(...loc(r0 + L * belly * 0.6, w))} ${pt(...m1)}` +
      `C${pt(...loc(r0 + L * 0.82, w))} ${pt(...loc(r1, w * 0.55))} ${pt(...tip)}` +
      `C${pt(...loc(r1, -w * 0.55))} ${pt(...loc(r0 + L * 0.82, -w))} ${pt(...m2)}` +
      `C${pt(...loc(r0 + L * belly * 0.6, -w))} ${pt(...c4)} ${pt(...b)}Z`;
  }
  return `M${pt(...b)}C${pt(...c1)} ${pt(...c2)} ${pt(...tip)}C${pt(...c3)} ${pt(...c4)} ${pt(...b)}Z`;
}

export function ring(c, r) {
  // Radius taken from the rounded endpoints, so each half is an exact semicircle (tangent joins).
  const x0 = f(c[0] - r), x1 = f(c[0] + r), y = f(c[1]);
  const rr = +((x1 - x0) / 2).toFixed(4);
  return `M${x0} ${y}A${rr} ${rr} 0 1 0 ${x1} ${y}A${rr} ${rr} 0 1 0 ${x0} ${y}Z`;
}

/** Layered gul: outer pointed petals, inner round petals offset by half a step, disc and seed ring. */
export function rosette(c, R, { n = 8, cls = ['kr', 'ko', 'kc', 'kg', 'kn'], seeds = true, rot0 = 0 } = {}) {
  const [outer, inner, disc, gold, eye] = cls;
  const step = 360 / n;
  let o = '', i = '', s = '';
  for (let k = 0; k < n; k++) {
    o += petal(c, rot0 + k * step - 90, R * 0.18, R, R * 0.26);
    i += petal(c, rot0 + k * step + step / 2 - 90, R * 0.14, R * 0.68, R * 0.19, { round: true });
  }
  if (seeds) for (let k = 0; k < n; k++) {
    const [x, y] = rot([c[0], c[1] - R * 0.3], rot0 + k * step, c);
    s += ring([x, y], R * 0.045);
  }
  return `<path class="${outer}" d="${o}"/><path class="${inner}" d="${i}"/>` +
    `<path class="${disc}" d="${ring(c, R * 0.38)}"/><path class="${gold}" d="${ring(c, R * 0.25)}"/>` +
    (seeds ? `<path class="${disc}" d="${s}"/>` : '') + (R * 0.11 >= 0.6 ? `<path class="${eye}" d="${ring(c, R * 0.11)}"/>` : '');
}

/** Five-lobed blossom (side view rosette) used for small flowers. */
export function blossom(c, R, cls = ['kr', 'kc', 'kg'], rot0 = 0) {
  let p = '';
  for (let k = 0; k < 5; k++) p += petal(c, rot0 + k * 72 - 90, R * 0.1, R, R * 0.36, { round: true });
  return `<path class="${cls[0]}" d="${p}"/><path class="${cls[1]}" d="${ring(c, R * 0.34)}"/><path class="${cls[2]}" d="${ring(c, R * 0.18)}"/>`;
}

/**
 * Xətai palmette (frontal fan flower): a calyx, five radiating lobes, an inner
 * fan in a second colour and a stamen arc. Mirror-symmetric about its axis.
 */
export function palmette(base, H, deg = -90, cls = ['kr', 'ko', 'kg', 'kc', 'kn'], { calyx: withCalyx = true } = {}) {
  const [lobe, fan, gold, cream, dark] = cls;
  const c = base;
  const lobes = [-58, -30, 0, 30, 58];
  let outer = '', inner = '';
  lobes.forEach((a, i) => {
    const long = i === 2 ? 1 : i === 1 || i === 3 ? 0.86 : 0.66;
    outer += petal(c, deg + a, H * 0.12, H * long, H * (i === 2 ? 0.17 : 0.15));
    inner += petal(c, deg + a * 0.82, H * 0.12, H * long * 0.66, H * 0.085, { round: true });
  });
  const cup = [rot([c[0] + H * 0.2, c[1] - H * 0.26], deg + 90, c), rot([c[0] - H * 0.2, c[1] - H * 0.26], deg + 90, c)];
  const calyx = `M${pt(...rot([c[0] - H * 0.02, c[1] + H * 0.3], deg + 90, c))}` +
    `C${pt(...rot([c[0] + H * 0.3, c[1] + H * 0.02], deg + 90, c))} ${pt(...rot([c[0] + H * 0.34, c[1] - H * 0.2], deg + 90, c))} ${pt(...cup[0])}` +
    `L${pt(...cup[1])}` +
    `C${pt(...rot([c[0] - H * 0.34, c[1] - H * 0.2], deg + 90, c))} ${pt(...rot([c[0] - H * 0.3, c[1] + H * 0.02], deg + 90, c))} ${pt(...rot([c[0] + H * 0.02, c[1] + H * 0.3], deg + 90, c))}Z`;
  const eye = rot([c[0], c[1] - H * 0.2], deg + 90, c);
  return `<path class="${lobe}" d="${outer}"/><path class="${fan}" d="${inner}"/>${withCalyx ? `<path class="${dark}" d="${calyx}"/>` : ''}` +
    `<path class="${gold}" d="${ring(eye, H * 0.09)}"/><path class="${cream}" d="${ring(eye, H * 0.04)}"/>`;
}

/** Almond leaf with a vein, oriented along `deg` from its base. */
export function leaf(base, len, deg, w = 0.3) {
  const body = petal(base, deg, 0, len, len * w);
  const a = rot([base[0] + len * 0.08, base[1]], deg, base), b = rot([base[0] + len * 0.82, base[1]], deg, base);
  return { body, vein: `M${pt(...a)}L${pt(...b)}` };
}
