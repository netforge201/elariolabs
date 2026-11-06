// Knot-grid motifs: carpet patterns designed cell by cell, the way Azerbaijani
// pile carpets are actually woven. Each cell is one knot of one colour; the
// stepped edges are intentional (they are what makes geometry read as woven).
//
// A motif is a function (x, y) → colour code | null over an integer grid.
// Symmetry is enforced by construction (mirror4 / mirror8), and periodic
// border tiles are built over exactly one period, so repeats are seamless.

/** Colour codes → CSS classes defined in carpet-templates.css. */
export const CLS = { r: 'kr', R: 'kR', n: 'kn', g: 'kg', c: 'kc', o: 'ko', d: 'kd', t: 'kt', b: 'kb' };

export function raster(w, h, fn) {
  const cells = [];
  for (let y = 0; y < h; y++) {
    const row = [];
    for (let x = 0; x < w; x++) row.push(fn(x, y) ?? null);
    cells.push(row);
  }
  return { w, h, cells };
}

/** Rasterize a centred motif of radius N (grid 2N+1) from a function of |x|, |y|. */
export function centred(N, fn) {
  return raster(2 * N + 1, 2 * N + 1, (i, j) => fn(Math.abs(i - N), Math.abs(j - N), i - N, j - N));
}

/** 8-fold symmetric: fn receives (a, b) with a ≥ b ≥ 0. */
export function mirror8(N, fn) {
  return centred(N, (ax, ay) => fn(Math.max(ax, ay), Math.min(ax, ay)));
}

/** Overlay motif m onto grid g at (ox, oy); null cells are transparent. */
export function stamp(g, m, ox, oy) {
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    const v = m.cells[y][x];
    const X = ox + x, Y = oy + y;
    if (v && Y >= 0 && Y < g.h && X >= 0 && X < g.w) g.cells[Y][X] = v;
  }
  return g;
}

/** One merged path per colour (horizontal runs), painted in a fixed order. */
export function toSvg(g, { ground = null, order = 'dnRrtbocg', unit = 1 } = {}) {
  const runs = {};
  for (let y = 0; y < g.h; y++) {
    let x = 0;
    while (x < g.w) {
      const v = g.cells[y][x];
      if (!v || v === ground) { x++; continue; }
      let e = x;
      while (e < g.w && g.cells[y][e] === v) e++;
      (runs[v] ??= []).push(`M${x * unit} ${y * unit}h${(e - x) * unit}v${unit}h${-(e - x) * unit}z`);
      x = e;
    }
  }
  let out = ground ? `<rect class="${CLS[ground]}" width="${g.w * unit}" height="${g.h * unit}"/>` : '';
  for (const code of order) if (runs[code]) out += `<path class="${CLS[code]}" d="${runs[code].join('')}"/>`;
  for (const code of Object.keys(runs)) if (!order.includes(code)) out += `<path class="${CLS[code]}" d="${runs[code].join('')}"/>`;
  return out;
}

// ---------------------------------------------------------------------------
// Medallions (göl)
// ---------------------------------------------------------------------------

/**
 * Hooked göl (Kazakh / Bico type): a stepped lozenge outlined in gold with
 * latch hooks along its sides and ram's-horn finials on the four axes; a red
 * band set with navy hooks; a navy field holding an eight-pointed star with a
 * rosette heart.
 */
export function golHooked(N = 22) {
  return mirror8(N, (a, b) => {
    const d1 = a + b, dc = a;
    // ram's horn finials on the axes
    if (b === 0 && d1 >= 18 && d1 <= 20) return 'g';
    if (d1 === 21 && b <= 2) return 'g';
    if (a === 20 && b === 2) return 'g';
    if (a === 19 && b === 3) return 'g';
    if (d1 > 18) return null;
    // latch hooks along the four sides of the lozenge
    if (d1 === 18) return (a - b) % 4 === 0 || (a - b) % 4 === 1 ? 'g' : null;
    if (d1 === 17) return 'g';
    if (d1 >= 14) {
      // red band with small navy hooks
      if (d1 === 15 && (a - b) % 4 === 2) return 'n';
      if (d1 === 14 && (a - b) % 4 === 1) return 'n';
      return 'r';
    }
    if (d1 === 13) return 'g';
    // navy field with the star
    const star = (A, B) => dc <= A || d1 <= B;
    if (star(6, 9) && !star(5, 8)) return 'c';
    if (star(5, 8) && !star(4, 6)) return 'r';
    if (star(4, 6)) {
      if (d1 <= 1) return 'g';
      if (d1 <= 3) return 'n';
      if (d1 === 4 && b === 0) return 'g';
      return 'o';
    }
    // small cream diamonds on the diagonals of the field
    if (a === b && d1 >= 10 && d1 <= 11) return 'c';
    return 'n';
  });
}

/** Small göl for strips and arch crowns: stepped lozenge, hooks, cross heart. */
export function golSmall(N = 13) {
  return mirror8(N, (a, b) => {
    const d1 = a + b;
    if (b === 0 && (a === 11 || a === 12)) return 'g';
    if (a === 13 && b <= 1) return 'g';
    if (d1 > 11) return null;
    if (d1 === 11) return (a - b) % 3 === 0 ? 'g' : null;
    if (d1 === 10) return 'g';
    if (d1 >= 8) return (d1 === 8 && (a - b) % 4 === 0) ? 'c' : 'r';
    if (d1 === 7) return 'g';
    if (d1 >= 4) return a <= 2 && d1 >= 5 ? 'c' : 'n';
    if (d1 >= 2) return 'o';
    return 'c';
  });
}

/**
 * Octagonal star göl (Heritage): an octagon with a gold rim and a running band
 * of alternating lozenges, a deep field with an eight-pointed star whose points
 * end in latch hooks, and a stepped rosette in the centre.
 */
export function golStar(N = 24) {
  return mirror8(N, (a, b) => {
    const dc = a, d1 = a + b;
    const oct = (A, B) => dc <= A && d1 <= B;
    if (!oct(24, 34)) return null;
    if (!oct(23, 33)) return 'g';
    if (!oct(20, 29)) {
      // lozenge band: alternate red / cream diamonds along the ring
      const t = (a + 2 * b) % 6;
      return t < 2 ? 'r' : t < 3 ? 'g' : 'n';
    }
    if (!oct(19, 28)) return 'g';
    // field
    const star = (A, B) => dc <= A || d1 <= B;
    if (star(12, 17) && !star(11, 16)) return 'g';
    if (star(11, 16) && !star(9, 13)) {
      // hooks inside the star points
      if (b === 0 && a >= 14) return 'n';
      return 'r';
    }
    if (star(9, 13) && !star(8, 11)) return 'c';
    if (star(8, 11)) {
      if (d1 <= 2) return 'g';
      if (d1 <= 4) return 'r';
      if (dc <= 5 && d1 <= 7) return 'o';
      return 'n';
    }
    // latch hooks between the star points (on diagonals)
    if (a === b && a >= 9 && a <= 11) return 'o';
    if (a - b === 1 && a === 11) return 'o';
    return 't';
  });
}

/** Corner block for a border of thickness T knots: an eight-pointed star on navy. */
export function cornerStar(T) {
  const N = Math.floor(T / 2);
  const g = raster(T, T, () => 'n');
  const star = mirror8(N, (a, b) => {
    const d1 = a + b;
    const S = (A, B) => a <= A || d1 <= B;
    if (a >= N) return 'g';
    if (S(N - 3, N - 1)) {
      if (d1 <= 1) return 'g';
      if (S(N - 5, N - 3)) return 'c';
      return 'r';
    }
    return null;
  });
  return stamp(g, star, Math.floor((T - star.w) / 2), Math.floor((T - star.h) / 2));
}

// ---------------------------------------------------------------------------
// Border tiles (one period each; the band thickness is the tile height)
// ---------------------------------------------------------------------------

/** Reciprocal "wolf's tooth" guard: interlocking stepped teeth with gold rules. */
export function guardReciprocal() {
  const W = 10, H = 9;
  return raster(W, H, (x, y) => {
    if (y === 0 || y === H - 1) return 'g';
    // red teeth hang from the top, navy teeth rise from the bottom; they interlock
    const depth = H - 2;                       // 7 body rows
    const tooth = Math.round(depth * (1 - Math.abs(x + 0.5 - W / 2) / (W / 2))); // 1..7
    const row = y - 1;
    if (row < tooth) return row === tooth - 1 && tooth >= 3 && x === W / 2 - 1 ? 'g' : 'r';
    return row === tooth && tooth <= 4 && (x === 0 || x === W - 1) ? 'g' : 'n';
  });
}

/** Barber-pole guard: diagonal stripes red / gold / navy / cream. */
export function guardBarber() {
  const W = 12, H = 8;
  return raster(W, H, (x, y) => {
    if (y === 0 || y === H - 1) return 'g';
    const k = (x + y) % 12;
    return k < 4 ? 'r' : k < 5 ? 'g' : k < 9 ? 'n' : k < 10 ? 'g' : 'c';
  });
}

/** Linked lozenge chain guard: stepped diamonds strung on a gold line. */
export function guardS() {
  const W = 12, H = 11;
  return raster(W, H, (x, y) => {
    if (y === 0 || y === H - 1) return 'g';
    if (y === 1 || y === H - 2) return 'n';
    const ax = Math.abs(x + 0.5 - 6), ay = Math.abs(y - 5);
    const d1 = ax + ay;
    if (d1 <= 1.5) return 'c';
    if (d1 <= 2.5) return 'o';
    if (d1 <= 4.5) return 'r';
    if (d1 <= 5.5) return 'g';
    if (ay === 0) return 'g';                 // the linking cord
    if ((x === 0 || x === W - 1) && ay === 2) return 'c'; // small knots on the cord
    return 'n';
  });
}

/** Dotted star guard: tiny 8-pointed stars alternating with gold dots on red. */
export function guardStars() {
  const W = 10, H = 9;
  return raster(W, H, (x, y) => {
    if (y === 0 || y === H - 1) return 'g';
    const ax = Math.abs(x - 4), ay = Math.abs(y - 4);
    const d1 = ax + ay;
    if (Math.max(ax, ay) <= 1 || d1 <= 2) return d1 === 0 ? 'g' : 'c';
    if ((x === 9 || x === 0) && y === 4) return 'g';
    return 'r';
  });
}

/**
 * Main border: eight-pointed stars in gold-rimmed navy octagons, linked by
 * stepped red lozenges with cream hearts (Carpet Frame).
 */
export function mainStarOctagons() {
  const W = 24, H = 21;
  return raster(W, H, (x, y) => {
    if (y === 0 || y === H - 1) return 'g';
    if (y === 1 || y === H - 2) return 'd';
    const ax = Math.abs(x - 11.5), ay = Math.abs(y - 10);
    const dc = Math.max(ax, ay), d1 = ax + ay;
    // octagon
    if (dc <= 8.5 && d1 <= 12.5) {
      if (!(dc <= 7.5 && d1 <= 11.5)) return 'g';
      const S = (A, B) => Math.max(ax, ay) <= A || d1 <= B;
      if (S(4.5, 6.5) && !S(3.5, 5.5)) return 'c';
      if (S(3.5, 5.5)) return d1 <= 1.5 ? 'g' : d1 <= 2.5 ? 'n' : 'r';
      if (ax === ay || Math.abs(ax - ay) < 1) return d1 >= 8 ? 'o' : 'n';
      return 'n';
    }
    // linking lozenge across the tile seam
    const lx = Math.min(x, W - 1 - x) + 0.5, ly = Math.abs(y - 10);
    const dl = lx + ly;
    if (dl <= 2.5) return 'c';
    if (dl <= 3.5) return 'g';
    if (dl <= 5.5) return 'r';
    return 'R';
  });
}

/**
 * Shirvan "wine-glass and leaf" main border (Heritage): upright calyx flowers
 * alternating with diagonal serrated leaves, the leaves turning direction from
 * one repeat to the next.
 */
export function mainWineGlass() {
  const W = 32, H = 22;
  const g = raster(W, H, (x, y) => (y === 0 || y === H - 1 ? 'g' : y === 1 || y === H - 2 ? 'd' : 'n'));
  const calyx = (cx) => {
    for (let y = 2; y < H - 2; y++) for (let x = cx - 6; x <= cx + 6; x++) {
      const dx = Math.abs(x - cx), yy = y - 2; // 0 top … 17 bottom
      let v = null;
      if (yy >= 14) v = dx <= 0 ? 'g' : dx <= 2 && yy >= 16 ? 'g' : null; // stem + foot
      else if (yy >= 8) { // cup: narrows to the stem
        const half = Math.round((14 - yy) * 0.9) + 1;
        if (dx <= half) v = dx === half ? 'g' : dx <= 1 ? 'o' : 'r';
      } else { // the flower held by the cup: a stepped bud between two curling petals
        const bud = dx + Math.abs(yy - 4);
        if (bud <= 1) v = 'r';
        else if (bud <= 2) v = 'c';
        else if (bud <= 3) v = 'g';
        else if (dx >= 4 && dx <= 5 && yy >= 5 && yy <= 7) v = dx === 5 && yy === 5 ? 'g' : 'o';
      }
      if (v && x >= 0 && x < W) g.cells[y][x] = v;
    }
  };
  const leafAt = (cx, dir) => {
    for (let y = 2; y < H - 2; y++) for (let x = Math.floor(cx - 8); x <= Math.ceil(cx + 8); x++) {
      const dx = x + 0.5 - cx, dy = y + 0.5 - 8;
      const u = (dx * dir - dy) / Math.SQRT2, v = (dx * dir + dy) / Math.SQRT2;
      // leaf sized to the gap between calyxes (their half-width is ~6 knots)
      const e = (u / 6.2) ** 2 + (v / 2.5) ** 2;
      let c = null;
      if (e <= 1) c = Math.abs(v) < 0.7 ? 'g' : e > 0.55 && Math.round(u) % 3 === 0 ? 'c' : 'r';
      if (c && x >= 0 && x < W && g.cells[y][x] === 'n') g.cells[y][x] = c;
    }
  };
  calyx(7.5 | 0);
  calyx(23.5 | 0);
  leafAt(16, 1);
  leafAt(32, -1);
  leafAt(0, -1);
  return g;
}

// ---------------------------------------------------------------------------
// Field patterns
// ---------------------------------------------------------------------------

/** Kuba floral lattice (Oriental Palace field): gold diagonal lattice on red, rosettes at the nodes, navy stepped flowers in the cells. */
export function fieldLattice() {
  const W = 24, H = 24;
  return raster(W, H, (x, y) => {
    const u = (x - y + 48) % 24, v = (x + y) % 24;
    if (u === 0 || v === 0) return 'g';
    // node rosette at (0,0) and (12,12)
    const node = (px, py) => {
      const ax = Math.min(Math.abs(x - px), W - Math.abs(x - px)), ay = Math.min(Math.abs(y - py), H - Math.abs(y - py));
      return [ax, ay];
    };
    for (const [px, py] of [[0, 0], [12, 12]]) {
      const [ax, ay] = node(px, py);
      if (ax + ay <= 1) return 'g';
      if (Math.max(ax, ay) <= 1 || ax + ay <= 2) return 'c';
    }
    // cell flower centred at (12,0) and (0,12)
    for (const [px, py] of [[12, 0], [0, 12]]) {
      const [ax, ay] = node(px, py);
      const d1 = ax + ay, dc = Math.max(ax, ay);
      if (d1 <= 1) return 'o';
      if (dc <= 2 && d1 <= 3) return 'c';
      if (d1 <= 5 && (ax === 0 || ay === 0 || d1 <= 4)) return 'n';
      if (d1 === 6 && (ax === 0 || ay === 0)) return 'n';
    }
    return 'r';
  });
}

/** Staggered star field (Heritage inner field). */
export function fieldStars() {
  const W = 20, H = 40;
  return raster(W, H, (x, y) => {
    for (const [px, py] of [[10, 10], [0, 30], [20, 30]]) {
      const ax = Math.abs(x - px), ay = Math.abs(y - py);
      const dc = Math.max(ax, ay), d1 = ax + ay;
      const S = (A, B) => dc <= A || d1 <= B;
      if (S(3, 5)) return d1 <= 1 ? 'g' : S(2, 3) ? 'o' : 'r';
      if (S(4, 6) && (ax === 0 || ay === 0 || ax === ay)) return 'c';
    }
    // tiny gold crosses between stars
    for (const [px, py] of [[0, 10], [20, 10], [10, 30]]) {
      const ax = Math.abs(x - px), ay = Math.abs(y - py);
      if ((ax === 0 && ay <= 1) || (ay === 0 && ax <= 1)) return 'g';
    }
    return 'n';
  });
}

/**
 * Boteh field (Shirvan / Baku style): rows of small woven butas, each row
 * facing the other way, colours alternating — rasterized from the same
 * yin-yang buta used for the curvilinear art.
 */
export function fieldBoteh(inside) {
  const W = 16, H = 32;
  const motif = (cx, cy, flip, body) => (x, y) => {
    const lx = (x - cx) * flip, ly = y - cy;
    if (inside(lx, ly, 0)) return inside(lx, ly, 1.35) ? (inside(lx, ly, 2.6) ? 'c' : body) : 'g';
    return null;
  };
  const a = motif(8, 8, 1, 'r'), b = motif(0, 24, -1, 'o'), b2 = motif(16, 24, -1, 'o');
  return raster(W, H, (x, y) => {
    const px = x + 0.5, py = y + 0.5;
    return a(px, py) ?? b(px, py) ?? b2(px, py) ?? (((x + y) % 8 === 4 && (x % 8 === 4)) ? 'g' : 'n');
  });
}
