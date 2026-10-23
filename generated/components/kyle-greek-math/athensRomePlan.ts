// ---------------------------------------------------------------------------
// athensRomePlan: the DATA and CAMERA of the Athens-and-Rome world (kyle-greek-math, cuts E AthensNotMassive and
// F RomansHadThePeople), kept free of React and of the kit so checks run it in bun. The renderers are in
// athensRomeWorld.tsx (which re-exports everything here).
//
// UNITS: the cast's (U = 178 per metre, a man ~325 to the top of the head). X across (+ right), Y height as the kit's
// world (the ground is Y = 0, up is - Y), Z depth (+ away). Z = 0 is the Acropolis rock's front foot. Athens is on
// the LEFT (the rock, the Parthenon, the Athenian crowd at X ~ 0 in front of the rock); Rome far to the RIGHT beyond
// a wide stretch of empty plain (the Roman crowd from X ~ 6500 at its front, its left edge running back and right,
// the Colosseum in the haze behind it).
//
// THE CAMERA (Cam3): one pinhole, no pitch (verticals stay vertical), eye at (x, height h, z), focal F px, the horizon
// on screen row hy (a lens shift). kitCamOf() turns it into the kit's 2D camera + londonDepth DepthOpts (dolly 0,
// dRef = the eye's distance to Z = 0), so the kit's AirBox / AirCyl / AirFloor / AirShadow draw in it exactly.
// ---------------------------------------------------------------------------
export const U = 178;
export const FPS = 30000 / 1001;
/** cut E's frames (sequence 61.695 -> 66.133 s) */
export const E_DURATION = 133;

/** a stable hash 0..1 */
export const hash = (i: number, k: number) => {
  const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return s - Math.floor(s);
};
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (a: number, b: number, v: number) => {
  const u = c01((v - a) / (b - a));
  return u * u * (3 - 2 * u);
};

// ===================================================================================================================
// THE ACROPOLIS: the rock (a mesa of warm stone) and the Parthenon on it
// ===================================================================================================================
/** the plateau's height (14 m: stylised; the real rock stands ~70 m over the city) */
export const ROCK_H = 2500;
/** the plateau's outline (its edge at Y = -ROCK_H), counter-clockwise seen from above from the front-left; the front
 *  cliff runs along Z ~ 540..900. The rock is derived from it (ROCK_RINGS): the outline densified on a smooth closed
 *  curve with a little noise, a SHOULDER ring 30 % of the way down pushed out ~240 (the cliff leans back) and the FOOT
 *  ring on the ground pushed out ~700 (the talus apron). */
export const ROCK_TOP: [number, number][] = [
  [-5300, 900],
  [-4300, 640],
  [-3200, 700],
  [-2350, 560],
  [-1500, 610],
  [-650, 540],
  [250, 600],
  [1150, 680],
  [1900, 860],
  [2350, 1500],
  [2500, 3200],
  [2300, 5600],
  [1800, 7900],
  [400, 8900],
  [-2000, 9200],
  [-4300, 8900],
  [-5600, 7600],
  [-6100, 4800],
  [-5900, 2200],
];
/** the shoulder's height (fraction of the rock's height): above it the cliff, below it the talus */
export const ROCK_SHOULDER = 0.3;
export type RockRings = { top: [number, number][]; sh: [number, number][]; foot: [number, number][] };
export const ROCK_RINGS: RockRings = (() => {
  const P = ROCK_TOP;
  const n = P.length;
  const SUB = 4;
  const top: [number, number][] = [];
  // a closed Catmull-Rom through the outline
  for (let i = 0; i < n; i++) {
    const p0 = P[(i - 1 + n) % n];
    const p1 = P[i];
    const p2 = P[(i + 1) % n];
    const p3 = P[(i + 2) % n];
    for (let k = 0; k < SUB; k++) {
      const t = k / SUB;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      top.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  const m = top.length;
  const outward = (i: number): [number, number] => {
    const a = top[(i - 1 + m) % m];
    const b = top[(i + 1) % m];
    const tx = b[0] - a[0];
    const tz = b[1] - a[1];
    const l = Math.hypot(tx, tz) || 1;
    return [tz / l, -tx / l];
  };
  const noise = (i: number, k: number) => 0.6 * Math.sin(i * 0.9 + k) + 0.4 * (hash(i, k) - 0.5) * 2;
  const top2: [number, number][] = top.map((p, i) => {
    const o = outward(i);
    const d = 70 * noise(i, 1);
    return [p[0] + o[0] * d, p[1] + o[1] * d];
  });
  const sh: [number, number][] = top2.map((p, i) => {
    const o = outward(i);
    const d = 240 + 130 * noise(i, 2);
    return [p[0] + o[0] * d, p[1] + o[1] * d];
  });
  const foot: [number, number][] = top2.map((p, i) => {
    const o = outward(i);
    const d = 720 + 240 * noise(i, 3);
    return [p[0] + o[0] * d, p[1] + o[1] * d];
  });
  return { top: top2, sh, foot };
})();
/** the rock's foot, nearest Z (for checks) */
export const ROCK_FOOT_Z = Math.min(...ROCK_RINGS.foot.map((p) => p[1]));
/** boulders on the talus: (ring index, how far down the talus 0..1, size) */
export const ROCK_BOULDERS: { i: number; u: number; r: number; seed: number }[] = (() => {
  const out: { i: number; u: number; r: number; seed: number }[] = [];
  const m = ROCK_RINGS.top.length;
  for (let i = 0; i < m; i++) {
    for (let k = 0; k < 2; k++) {
      const seed = 7000 + i * 2 + k;
      if (hash(seed, 1) > 0.55) continue;
      out.push({ i, u: 0.35 + 0.6 * hash(seed, 2), r: 50 + 110 * Math.pow(hash(seed, 3), 1.5), seed });
    }
  }
  return out;
})();
/** strata: ledge heights (fractions of the cliff band, from its top) */
export const ROCK_LEDGES = [0.22, 0.5, 0.78];
/** the citadel wall along the plateau's edge (inset, height, thickness) */
export const WALL = { inset: 70, h: 150, t: 110 };
/** the Parthenon stands on a low rise (the rock's highest part, a terrace), so the wall never hides its steps */
export const TEMPLE_LIFT = 150;

/** THE PARTHENON (simple marble volumes; proportions of the real temple, Doric, 8 x 17 columns, at ~97 units per
 *  real metre, i.e. a little under the cast's scale: a picture-book temple). Its axis X, its front (stylobate edge) Z. */
export const TEMPLE = {
  X: -900,
  Z: 1100,
  /** the top step's width and length (the stylobate) */
  W: 2950,
  L: 6650,
  /** three steps, each this tall and this deep */
  step: 55,
  stepD: 60,
  /** columns: lower radius, axial spacing, height (stylobate to capital top) */
  colR: 92,
  colS: 390,
  colH: 1010,
  /** the entablature (architrave + frieze + cornice) and the pediment's rise */
  ent: 330,
  ped: 330,
  /** the cella wall inset from the stylobate edge (sides) and the pronaos depth (front / back) */
  cellaInX: 340,
  cellaInZ: 760,
};
export const TEMPLE_BASE_Y = -(ROCK_H + TEMPLE_LIFT);
export const TEMPLE_TOP_H = ROCK_H + TEMPLE_LIFT + 3 * TEMPLE.step + TEMPLE.colH + TEMPLE.ent + TEMPLE.ped;
/** the column axes: the front row (8) and each flank (17), as world (X, Z) */
export const COL_FRONT: [number, number][] = Array.from({ length: 8 }, (_, i) => [TEMPLE.X + (i - 3.5) * TEMPLE.colS, TEMPLE.Z + 130]);
export const COL_FLANK = (side: -1 | 1): [number, number][] => Array.from({ length: 17 }, (_, i) => [TEMPLE.X + side * 3.5 * TEMPLE.colS, TEMPLE.Z + 130 + i * TEMPLE.colS]);

// ===================================================================================================================
// THE ATHENIANS: a modest crowd gathered on the plain in front of the rock (a few hundred figures in a loose oval;
// a jittered lattice, minimum spacing, no free scatter). Drawings: GREEK_CROWD 0..7 citizens, 8..10 scholars with a
// small orange tablet, 11 the Alexandrian with a scroll.
// ===================================================================================================================
export const CROWD = { X: -300, Z: -2560, a: 1260, b: 1160, DX: 118, DZ: 128 };
export type CrowdMan = { X: number; Z: number; i: number; seed: number; turn: number };
/** the head-turners' alternative head yaw per drawing (index into GREEK_CROWD 0..7); scholars never turn */
export const ALT_HEAD_YAW = [0.55, 1.12, -0.08, -0.5, 1.12, -0.08, -1.1, 0.06];
/** the base head yaw of each drawing's pose (romeCast front 0, stand(1) 0.66, stand(-1) -0.66) */
export const BASE_HEAD_YAW = [0, 0.66, -0.66, 0, 0.66, -0.66, -0.66, 0.66];
export const ATHENIANS: CrowdMan[] = (() => {
  const out: CrowdMan[] = [];
  const { X: cx, Z: cz, a, b, DX, DZ } = CROWD;
  let s = 0;
  for (let r = 0; ; r++) {
    const Zr = cz - b + r * DZ;
    if (Zr > cz + b) break;
    const off = r % 2 ? DX / 2 : 0;
    for (let X = cx - a - DX + off; X <= cx + a + DX; X += DX) {
      const seed = 1000 + s++;
      // loose: people gather, they do not stand in ranks (the rows must not read as stripes)
      const jx = (hash(seed, 1) - 0.5) * 80;
      const jz = (hash(seed, 2) - 0.5) * 104;
      const px = X + jx;
      const pz = Zr + jz;
      const th = Math.atan2((pz - cz) / b, (px - cx) / a);
      // a soft, irregular outline (a gathered crowd, not a formation): the radius breathes with the angle
      const rr = 1 + 0.07 * Math.sin(3 * th + 1.3) + 0.05 * Math.sin(5 * th + 0.4) - 0.04 * Math.cos(2 * th);
      const q = Math.hypot((px - cx) / a, (pz - cz) / b);
      if (q > rr + (hash(seed, 3) - 0.5) * 0.08) continue;
      // a minimum spacing (no two people in one place)
      if (out.some((o) => Math.abs(o.Z - pz) < 100 && Math.hypot((o.X - px) * 1.15, o.Z - pz) < 100)) continue;
      out.push({ X: px, Z: pz, i: Math.floor(hash(seed, 4) * 8), seed, turn: 0 });
    }
  }
  // the scholars: a handful at places nobody stands in front of (the front rows and the open flanks), so their orange
  // tablets glint; nearest figure to each target place becomes a scholar
  // target places (dx from the crowd's middle, Z, drawing)
  const SCHOLARS: [number, number, number][] = (
    [
    [-660, -3560, 8],
    [-180, -3700, 9],
    [390, -3670, 10],
    [890, -3400, 8],
    [-1190, -2700, 9],
    [1300, -2600, 10],
    [-1040, -3200, 11],
    [1140, -3080, 9],
  ] as [number, number, number][]
  ).map(([dx, Z, i]) => [CROWD.X + dx, Z, i] as [number, number, number]);
  // each scholar: the nearest citizen to the target place (never two scholars side by side); whoever stands just in
  // front of him steps aside (is left out), so his tablet is seen
  const chosen: CrowdMan[] = [];
  const gone = new Set<CrowdMan>();
  for (const [X, Z, i] of SCHOLARS) {
    let best: CrowdMan | null = null;
    let bd = 1e9;
    for (const m of out) {
      if (m.i >= 8 || gone.has(m) || chosen.some((q) => Math.hypot(q.X - m.X, q.Z - m.Z) < 330)) continue;
      const d = Math.hypot(m.X - X, m.Z - Z);
      if (d < bd) {
        bd = d;
        best = m;
      }
    }
    if (!best) continue;
    best.i = i;
    chosen.push(best);
    const b0 = best;
    out.forEach((q) => {
      if (q !== b0 && q.Z < b0.Z && b0.Z - q.Z < 300 && Math.abs(q.X - b0.X) < 85 && !chosen.includes(q)) gone.add(q);
    });
  }
  for (let k = out.length - 1; k >= 0; k--) if (gone.has(out[k])) out.splice(k, 1);
  // the head-turners: ~1 in 14 of the citizens (never two side by side), each on its own slow cycle
  out.forEach((m) => {
    if (m.i < 8 && hash(m.seed, 7) < 0.075) m.turn = 1;
  });
  // painter's order: far to near
  return out.sort((p, q) => q.Z - p.Z || p.X - q.X);
})();
export const ATHENS_FRONT_Z = Math.min(...ATHENIANS.map((m) => m.Z));
export const ATHENS_BACK_Z = Math.max(...ATHENIANS.map((m) => m.Z));
export const ATHENS_X0 = Math.min(...ATHENIANS.map((m) => m.X));
export const ATHENS_X1 = Math.max(...ATHENIANS.map((m) => m.X));

// ===================================================================================================================
// THE ROMANS: a vast crowd filling the plain to the horizon, far right; its left edge runs back and to the right
// (X >= ROMAN.x0 + ROMAN.slope (Z - ROMAN.z0)) so it stays off frame from Athens' cameras, deep rows spaced wider as
// they recede (on screen they still overlap: a carpet of people into the haze). No orange anywhere.
// ===================================================================================================================
export const ROMAN = { x0: 6600, z0: -4200, slope: 0.62, width0: 15000, widen: 1.05, zFar: 44000, DX: 132 };
export const romanLeftX = (Z: number) => ROMAN.x0 + ROMAN.slope * (Z - ROMAN.z0);
export const romanRightX = (Z: number) => romanLeftX(Z) + ROMAN.width0 + ROMAN.widen * (Z - ROMAN.z0);
/** the row spacing grows with depth (rows ~1/3 of a figure apart on screen from the cameras of this world) */
const romanDZ = (Z: number) => Math.max(150, 0.032 * (Z - ROMAN.z0 + 4700));
export const ROMANS: CrowdMan[] = (() => {
  const out: CrowdMan[] = [];
  let s = 0;
  let r = 0;
  for (let Z = ROMAN.z0; Z < ROMAN.zFar; Z += romanDZ(Z), r++) {
    const xa = romanLeftX(Z);
    const xb = romanRightX(Z);
    const dx = ROMAN.DX * (1 + 0.25 * c01((Z - 8000) / 30000));
    const off = r % 2 ? dx / 2 : 0;
    for (let X = xa + off; X <= xb; X += dx) {
      const seed = 50000 + s++;
      // the front edge and the left edge are a little ragged (a crowd, not a wall)
      const edge = (X - xa) / 900;
      if (edge < 1 && hash(seed, 3) > edge * 0.8 + 0.35) continue;
      // the front edge wanders (bays and bulges, a thinning fringe of stragglers): a crowd, not a rank
      const front = ROMAN.z0 + 520 + 420 * Math.sin(X / 1900 + 0.7) + 260 * Math.sin(X / 640 + 2.1);
      if (Z < front) {
        const u = (front - Z) / 520;
        if (hash(seed, 5) > Math.max(0, 0.75 - u) * 0.9) continue;
      }
      out.push({ X: X + (hash(seed, 1) - 0.5) * 40, Z: Z + (hash(seed, 2) - 0.5) * 0.25 * romanDZ(Z), i: Math.floor(hash(seed, 4) * 10), seed, turn: 0 });
    }
  }
  return out.sort((p, q) => q.Z - p.Z || p.X - q.X);
})();
/** the Colosseum, in the haze behind the Romans (an elliptical drum: 4 storeys, three arcades and the attic) */
export const COLOSSEUM = { X: 33500, Z: 47000, rx: 7600, rz: 6300, H: 4900 };

// ===================================================================================================================
// GROUND DETAIL: sparse scrub tufts and stones on the empty plain (kept clear of the crowds and the rock), so the
// plain reads as land and the pull-back has parallax
// ===================================================================================================================
export type Tuft = { X: number; Z: number; r: number; kind: number; seed: number };
const inPoly = (ring: [number, number][], X: number, Z: number) => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, zi] = ring[i];
    const [xj, zj] = ring[j];
    if (zi > Z !== zj > Z && X < ((xj - xi) * (Z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
};
const inRockFoot = (X: number, Z: number, pad: number) => [[0, 0], [pad, 0], [-pad, 0], [0, pad], [0, -pad]].some(([dx, dz]) => inPoly(ROCK_RINGS.foot, X + dx, Z + dz));
/** the dirt track from the Athenians' right flank across the empty plain toward the far right (where the Romans are),
 *  bending back into the haze; it keeps to the left of the Roman crowd (world X, Z points, a smooth curve) */
export const TRACK: [number, number][] = [
  [940, -3060],
  [2150, -2900],
  [3250, -2150],
  [4200, -300],
  [5200, 3000],
  [6500, 9000],
  [8600, 18000],
  [11000, 30000],
  [13600, 44000],
];
export const TRACK_W = 230;
const distToTrack = (X: number, Z: number) => {
  let best = 1e9;
  for (let i = 0; i < TRACK.length - 1; i++) {
    const [ax, az] = TRACK[i];
    const [bx, bz] = TRACK[i + 1];
    const vx = bx - ax;
    const vz = bz - az;
    const t = Math.max(0, Math.min(1, ((X - ax) * vx + (Z - az) * vz) / (vx * vx + vz * vz)));
    best = Math.min(best, Math.hypot(X - ax - vx * t, Z - az - vz * t));
  }
  return best;
};
const inAthens = (X: number, Z: number, pad: number) => Math.hypot((X - CROWD.X) / (CROWD.a + pad), (Z - CROWD.Z) / (CROWD.b + pad)) < 1.12;
const inRome = (X: number, Z: number, pad: number) => X > romanLeftX(Z) - pad && Z > ROMAN.z0 - pad;
export const TUFTS: Tuft[] = (() => {
  const out: Tuft[] = [];
  // a jittered grid (cells grow with depth), a tuft in some cells: min spacing, no clumps
  let s = 0;
  for (let Z = -16000; Z < 60000; ) {
    const cell = 330 + 0.08 * Math.max(0, Z + 9000);
    for (let X = -40000; X < 70000; X += cell) {
      const seed = 9000 + s++;
      if (hash(seed, 1) > 0.5) continue;
      const px = X + (hash(seed, 2) - 0.5) * cell * 0.8;
      const pz = Z + (hash(seed, 3) - 0.5) * cell * 0.8;
      if (inRockFoot(px, pz, 250) || inAthens(px, pz, 380) || inRome(px, pz, 300) || distToTrack(px, pz) < TRACK_W + 140) continue;
      out.push({ X: px, Z: pz, r: 44 + Math.pow(hash(seed, 4), 1.6) * 90, kind: hash(seed, 5) < 0.16 ? 1 : 0, seed });
    }
    Z += cell;
  }
  return out.sort((p, q) => q.Z - p.Z);
})();

// ===================================================================================================================
// THE CAMERA
// ===================================================================================================================
export type Cam3 = { x: number; h: number; z: number; F: number; hy: number };
/** a world point on screen (px) and its px per unit; null behind (or too near) the eye */
export const project = (c: Cam3, X: number, Y: number, Z: number) => {
  const d = Z - c.z;
  if (d < 60) return null;
  const s = c.F / d;
  return { x: 540 + (X - c.x) * s, y: c.hy + (c.h + Y) * s, s, d };
};
/** the kit's 2D camera + londonDepth DepthOpts that draw exactly this pinhole (dolly 0: dRef is the eye's distance) */
export const kitCamOf = (c: Cam3) => {
  const Dc = -c.z;
  const k = c.F / Dc;
  const eyeY = -c.h;
  return { cam: { cx: c.x, cy: eyeY - (c.hy - 960) / k, k }, depth: { eyeY, dRef: Dc, kRef: k, dolly: 0 } };
};

/** a bell-shaped progress 0..1 over f0..f1: the integral of t^a (1-t)^b, normalised (one acceleration lobe, one
 *  deceleration lobe; tollWorld's) */
export const bell = (f0: number, f1: number, a: number, b: number) => {
  const N = 400;
  const cum = new Float64Array(N + 1);
  for (let i = 1; i <= N; i++) {
    const t = (i - 0.5) / N;
    cum[i] = cum[i - 1] + Math.pow(t, a) * Math.pow(1 - t, b);
  }
  const tot = cum[N];
  return (f: number) => {
    const t = Math.max(0, Math.min(1, (f - f0) / (f1 - f0))) * N;
    const i = Math.min(N - 1, Math.floor(t));
    return (cum[i] + (cum[i + 1] - cum[i]) * (t - i)) / tot;
  };
};

/** the focal length of every E frame (px): a pure dolly, so the pull-back has real parallax */
export const E_F = 1100;
const TEMPLE_W_PX0 = 660;
/** E's first framing: the temple front ~61 % of the frame width, centred, its middle at y ~700, the eye a little
 *  above its cornice (in the light) */
const H0 = 4320;
const D0 = (TEMPLE.W * E_F) / TEMPLE_W_PX0;
const TEMPLE_MID_H = ROCK_H + TEMPLE_LIFT + (3 * TEMPLE.step + TEMPLE.colH + TEMPLE.ent + TEMPLE.ped) / 2;
const HY0 = 700 - ((H0 - TEMPLE_MID_H) * E_F) / D0;
/** E's settled framing, solved from the crowd: the nearest figures ~58 px tall with their feet at y ~1058 and the back
 *  rows' heads at y ~828 (the crowd between the caption bands' top and y ~820), the crowd's middle at x ~505 */
const FRONT_PX = 58;
const FRONT_FEET_Y = 1058;
const BACK_HEAD_Y = 828;
const D_FRONT = (325 * E_F) / FRONT_PX;
const D_BACK = D_FRONT + (ATHENS_BACK_Z - ATHENS_FRONT_Z);
const S_F = E_F / D_FRONT;
const S_B = E_F / D_BACK;
const H1 = (FRONT_FEET_Y - BACK_HEAD_Y - 325 * S_B) / (S_F - S_B);
const HY1 = FRONT_FEET_Y - H1 * S_F;
const Z1 = ATHENS_FRONT_Z - D_FRONT;
const S_MID = E_F / (CROWD.Z - Z1);
const X1 = CROWD.X - (505 - 540) / S_MID;
export const E_KEYS = {
  start: { x: TEMPLE.X + 200, h: H0, z: TEMPLE.Z - D0, F: E_F, hy: HY0 },
  settled: { x: X1, h: H1, z: Z1, F: E_F, hy: HY1 },
};
/** every channel on its own bell (already moving at f0, settled ~f112), then a slow creep (a hair further back and a
 *  drift right, toward where cut F goes) fading in from f88 and running past the cut's end */
const PD = bell(-16, 116, 1.45, 2.3);
const PH = bell(-12, 112, 1.5, 2.2);
const PY = bell(-6, 114, 1.6, 2.1);
const PX = bell(-14, 92, 1.4, 2.6);
/** the creep: 0 until f88, easing into a constant rate (per frame) */
const CREEP_F0 = 88;
const creepAt = (f: number) => {
  const u = (f - CREEP_F0) / 40;
  if (u <= 0) return 0;
  return u < 1 ? (u * u * u * (1 - u / 2)) * 40 : 20 + (f - CREEP_F0 - 40);
};
/** creep rates per frame: distance x (1 + rate), horizon */
export const E_CREEP = { dist: 0.00042, hy: -0.12 };
/** the truck right never stops: a slow drift (X_CREEP units per frame) ramps in under the main truck's deceleration
 *  (f28..f86), so the eye's x velocity falls monotonically onto the drift (no stall, no second lobe) and carries on past
 *  the cut toward where cut F goes */
const X_CREEP = 1.25;
const X_CREEP_AT: number[] = (() => {
  const out = [0];
  for (let f = 1; f <= 400; f++) {
    const u = c01((f - 0.5 - 28) / 58);
    out.push(out[f - 1] + X_CREEP * u * u * (3 - 2 * u));
  }
  return out;
})();
const xCreep = (f: number) => {
  if (f <= 0) return 0;
  const i = Math.min(399, Math.floor(f));
  return X_CREEP_AT[i] + (X_CREEP_AT[i + 1] - X_CREEP_AT[i]) * (f - i);
};
export const cameraE = (f: number): Cam3 => {
  const s = E_KEYS.start;
  const e = E_KEYS.settled;
  const d0 = TEMPLE.Z - s.z;
  const d1 = TEMPLE.Z - e.z;
  const cr = creepAt(f);
  const d = Math.exp(mix(Math.log(d0), Math.log(d1), PD(f))) * (1 + E_CREEP.dist * cr);
  return {
    x: mix(s.x, e.x, PX(f)) + xCreep(f),
    h: mix(s.h, e.h, PH(f)),
    z: TEMPLE.Z - d,
    F: E_F,
    hy: mix(s.hy, e.hy, PY(f)) + E_CREEP.hy * cr,
  };
};

// ===================================================================================================================
// LIFE (seed-stable, driven by a LIFE frame: E passes its frame; F passes E_END.life + its own frame)
// ===================================================================================================================
const SWAY_FPS = FPS;
/** a slow sway about the feet and a breath (pandemicFolkCrowd's sway, copied so this file stays React-free) */
export const swayOf = (life: number, seed: number) => {
  const t = life / SWAY_FPS;
  const hs = (n: number) => {
    const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return v - Math.floor(v);
  };
  const ph = hs(seed) * Math.PI * 2;
  const ph2 = hs(seed + 4) * Math.PI * 2;
  return { rot: 0.9 * Math.sin((t / (5 + 1.4 * hs(seed + 2))) * 2 * Math.PI + ph), sy: 1 + 0.005 * Math.sin((t / 3.9) * 2 * Math.PI + ph2) };
};
/** a head-turner's turned weight 0..1 at a life frame: hold, a ~13-frame turn, hold 50-80 frames, turn back */
export const headTurnOf = (life: number, seed: number) => {
  const P = 170 + 70 * hash(seed, 11);
  const t = ((((life + hash(seed, 12) * P) % P) + P) % P) / P;
  const len = 13 / P;
  const on = 0.18 + 0.1 * hash(seed, 13);
  const off = on + (50 + 30 * hash(seed, 14)) / P;
  return smooth(on, on + len, t) - smooth(off, off + len, t);
};
