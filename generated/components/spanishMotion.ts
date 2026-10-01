// SpanishDivided + GoingBeyondHisMission (cut 1 of the Cortes clip): every
// moving thing as pure maths on ONE global clock g (no React), so the check
// scripts read the exact motion the component draws. See SpanishDivided.tsx's
// header for the words, the gestures and the sources.
//   the crowd   117 dots (cortesShared), one deterministic simulation: one
//               crowd -> the split (Cortes's 27 peel away as ONE body and gather
//               into a rounded group, the cream 90 settle into theirs) -> the
//               clash (the orange body drives into the cream's west flank; both
//               fronts flatten against each other into a seam; along it dots
//               compress and give and take each on its own phase; the cream
//               front bows back, then pushes back) -> one step west when
//               Narvaez's men land (cream presses orange)
//   the ship    rides NARVAEZ_VOYAGE_RIDE (one smooth open-water line): out of
//               Santiago, cruises, decelerates to the anchorage off San Juan de
//               Ulua; sized with the camera (37.5 k^0.6 px); it fades in once
//               (its whole box SHIP_CLEAR clear of Cuba) and out once (at anchor,
//               as the line goes ashore), never on land in between
//   the road    Cortes's road, drawn head-led from inside the orange body to
//               Tenochtitlan
//   the camera  its own authored track: ln k as a sum of eased segments; the
//               frame centre as screen-shaped glides, a C1 ship-locked follow
import {
  CORTES_ROAD,
  CREAM_REST,
  CROWD_SLOT,
  FISSURE,
  NARVAEZ_LAND_LEG,
  NARVAEZ_VOYAGE_RIDE as VOYAGE,
  N_CREAM,
  ORANGE_REST,
  SITES,
  SPANISH_ONE,
  clamp01,
  hash,
  landAt,
  smootherstep,
  smoothstep,
  type Cam,
  type P2,
} from "./cortesShared";

export const FPS = 24;
// ---------------------------------------------------------------------------
// THE GLOBAL CLOCK. g = round((t - 6.70) * 24) on the EDIT timeline (the SRT).
// Cut 1a SpanishDivided = g0..g84 (85 f), in-point 6.70 s; cut 1b
// GoingBeyondHisMission = g85..g321 (237 f), in-point 10.24 s.
// ---------------------------------------------------------------------------
export const IN_A = 6.7;
export const IN_B = 10.24;
export const DUR_A = 85; // round(3.54 * 24): "the Spanish ... each other" 6.70 -> 10.24 s
export const DUR_B = 237; // round(9.22 * 24) = 221 ("So ... mission" 10.24 -> 19.46 s) + the 16-frame tail
export const G_B = DUR_A; // global frame of cut 1b's f0
export const G_LAST = DUR_A + DUR_B - 1; // 321
/** word onsets, global frames */
export const W = {
  the: 0,
  spanish: 2,
  were: 12,
  themselves: 19,
  divided: 28,
  andIn: 42,
  fact: 56,
  fighting: 60,
  each: 70,
  other: 75,
  so: 85,
  maybe: 88,
  story: 98,
  how: 112,
  velazquez: 118,
  sends: 131,
  another: 141,
  expedition: 153,
  toGo: 164,
  capture: 187,
  and: 199,
  arrest: 206,
  cortes: 214,
  for: 227,
  going: 232,
  beyond: 238,
  the2: 248,
  prerogative: 256,
  ofHis: 273,
  mission: 293,
  end: 306,
};

/** soft trapezoid velocity profile on [a, b]: raised-cosine ramps of `ramp` frames */
const trap = (g: number, a: number, b: number, ramp: number) => {
  if (g <= a || g >= b) return 0;
  const r = Math.min(ramp, (b - a) / 2);
  if (g < a + r) return 0.5 * (1 - Math.cos((Math.PI * (g - a)) / r));
  if (g > b - r) return 0.5 * (1 - Math.cos((Math.PI * (b - g)) / r));
  return 1;
};
/** smootherstep with a warp (< 1 front-loads the move, so it lands softly) */
const ease = (u: number, warp = 1) => smootherstep(Math.pow(clamp01(u), warp));

// ---------------------------------------------------------------------------
// THE ZOOM (the camera's k; its frame centre is further down)
// ln k: a sum of eased segments [a, b, ln ratio, warp]. The creep runs from
// before g0 and overlaps the pull-back, so the zoom turns once and never
// plateaus; every later segment overlaps its neighbour.
// ---------------------------------------------------------------------------
const K0 = 10.95;
export const K_GULF = 0.928;
const K_SEGS: [number, number, number, number][] = [
  [-36, 98, Math.log(11.6 / K0), 1], // the creep in on the crowd (the whole crowd ~50-55 % of the width)
  [73, 112, Math.log(K_GULF / 11.6), 1], // THE PULL-BACK to the Gulf wide (slow out of the clash: k still > 11 at g80)
  [106, 146, Math.log(0.97 / K_GULF), 1], // a breath in toward Velazquez
  [140, 204, Math.log(1.72 / 0.97), 1], // the follow pushes in gently
  [196, 238, Math.log(1.8 / 1.72), 1], // creep while the ship lands
  [226, 291, Math.log(4.2 / 1.8), 0.9], // west and in onto central Mexico
  [272, 352, Math.log(4.38 / 4.2), 1], // the tail creep (overlaps the push; still moving at g321)
];
const LNK = (g: number) => Math.log(K0) + K_SEGS.reduce((s, [a, b, d, w]) => s + d * ease((g - a) / (b - a), w), 0);
export const kAt = (g: number) => Math.exp(LNK(g));

// ---------------------------------------------------------------------------
// TIMING (global frames)
// ---------------------------------------------------------------------------
export const T = {
  split: [24, 46] as const, // the 27 peel away as one body ("divided" g28): one move, no stagger
  colour: 10, // each dot's cream -> orange crossfade (travelling outward from the fissure)
  surge: [52, 64] as const, // the orange body drives into the cream's west flank ("fact" g56)
  swords: 53, // the swords slide up 24 px + fade in, landed on "fighting" g60
  velazquez: 110, // Santiago's dot fades in; VELAZQUEZ slides up, landed on g118
  depart: 129, // the ship sails (two frames ahead of "sends" g131)
  anchor: 194, // it rides at anchor off San Juan de Ulua
  ashore: [195, 201] as const, // the dashed line runs on ashore to San Juan de Ulua ("and" g199)
  shipOut: [196, 203] as const, // the ship fades out at anchor
  landLeg: [199, 207] as const, // the land leg drawn into the crowd ("arrest" g206)
  press: [204, 217] as const, // the cream front presses one step into the orange
  cortes: 206, // CORTES slides up, landed on "Cortes" g214
  cortesRecede: [245, 260] as const, // ... and eases to the context rung as the road gets under way
  routeRecede: [228, 246] as const, // Narvaez's route recedes to the context rung
  tenochIn: [236, 248] as const, // Tenochtitlan's cream dot fades in
  road: [227, 293] as const, // the road's head: leaves the body "going/beyond", reaches Tenochtitlan "mission"
  hold: [291, 303] as const, // the HoldRing crossfades in
  shimmer: 298, // a highlight travels the orange road to the end
};

// ---------------------------------------------------------------------------
// THE CROWD: one deterministic particle simulation (2 sub-steps a frame).
// Each dot springs toward its HOME; homes: SPANISH_ONE, then (the split, one
// eased move for all) its REST slot, then (the clash) REST + the body's drive.
// Constraints every sub-step: the seam (orange west of it, cream east, GAP
// apart), pairwise spacing (>= SPACE_MIN), and the coast (cream stay inland).
// The seam bows east (the cream front gives) then west (it pushes back), and
// ripples along its length; the front rows' homes give and take each on its
// own phase. Trajectories are then smoothed (sigma 1 f).
// ---------------------------------------------------------------------------
const N = SPANISH_ONE.length;
const ONE = SPANISH_ONE as P2[];
const REST: P2[] = Array.from({ length: N }, (_, i) => (i < N_CREAM ? (CREAM_REST[i] as P2) : (ORANGE_REST[i - N_CREAM] as P2)));
const isO = (i: number) => i >= N_CREAM;
const xAtY = (line: P2[], y: number) => {
  if (y <= line[0][1]) return line[0][0];
  for (let i = 1; i < line.length; i++) {
    if (y <= line[i][1]) {
      const u = (y - line[i - 1][1]) / (line[i][1] - line[i - 1][1] || 1);
      return line[i - 1][0] + (line[i][0] - line[i - 1][0]) * u;
    }
  }
  return line[line.length - 1][0];
};
const FIS = FISSURE as P2[];
// the seam: midway between the two bodies' facing fronts at rest
const O_FRONT = Math.max(...REST.filter((_, i) => isO(i)).map((p) => p[0]));
const C_FRONT = Math.min(...REST.filter((_, i) => !isO(i)).map((p) => p[0]));
export const SEAM_X0 = (O_FRONT + C_FRONT) / 2;
const O_YS = REST.filter((_, i) => isO(i)).map((p) => p[1]);
const SEAM_Y0 = Math.min(...O_YS);
const SEAM_Y1 = Math.max(...O_YS);
const SEAM_YC = (SEAM_Y0 + SEAM_Y1) / 2;
const SEAM_H = (SEAM_Y1 - SEAM_Y0) / 2 + 3;
export const GAP = 3.25; // centre spacing across the seam (2 r = 2.5)
const SPACE_MIN = 3.05; // the bodies compress to ~0.9 of their spacing at the seam
const PUSH_O = 2.6; // how far past the seam the orange drive aims (it presses)
const PUSH_C = 1.6;
const DRIVE_O = SEAM_X0 - GAP / 2 - O_FRONT + PUSH_O;
const DRIVE_C = C_FRONT - (SEAM_X0 + GAP / 2) + PUSH_C;
export const STEP = CROWD_SLOT; // the press: one step
/** the press: the seam moves one step west as Narvaez's men land */
export const pressAt = (g: number) => -STEP * ease((g - T.press[0]) / (T.press[1] - T.press[0]));
/** the seam's bow (world px, + = east: the cream front gives way): bows back, pushes back, then gives and takes */
const BOW_KEYS: [number, number][] = [
  [58, 0],
  [66, 1.9],
  [77, -0.85],
  [86, 0.4],
];
const bowAt = (g: number) => {
  if (g <= BOW_KEYS[0][0]) return 0;
  for (let i = 1; i < BOW_KEYS.length; i++) {
    const [g1, v1] = BOW_KEYS[i];
    const [g0, v0] = BOW_KEYS[i - 1];
    if (g <= g1) return v0 + (v1 - v0) * smoothstep((g - g0) / (g1 - g0));
  }
  // then the slow give and take, to the end
  const t = g - BOW_KEYS[BOW_KEYS.length - 1][0];
  return 0.4 * Math.cos((t * 2 * Math.PI) / 38) * (1 - 0.3 * smoothstep(t / 60));
};
const bowShape = (y: number) => {
  const u = (y - SEAM_YC) / SEAM_H;
  return Math.abs(u) >= 1 ? 0 : Math.pow(Math.cos((u * Math.PI) / 2), 2);
};
/** the seam's x at latitude y, frame g (no ripple) */
export const seamX = (y: number, g: number) => SEAM_X0 + bowAt(g) * bowShape(y) + pressAt(g);
const rippleAt = (y: number, g: number) => 0.32 * smoothstep((g - 62) / 10) * Math.sin(g * 0.21 + y / 4.3) * bowShape(y);
// split timing: one move for all (a sub-frame scatter only, so it reads as a body)
const SPLIT_T0 = Array.from({ length: N }, (_, i) => T.split[0] + 0.7 * (hash(i, 1) - 0.5));
const DIST_F = Array.from({ length: N }, (_, i) => Math.abs(xAtY(FIS, ONE[i][1]) - ONE[i][0]));
const MAX_DIST_O = Math.max(...DIST_F.slice(N_CREAM));
/** orange dots: the crossfade starts as the separation reaches them, outward from the fissure */
const COL0 = Array.from({ length: N }, (_, i) => T.split[0] + 2 + 10 * (DIST_F[i] / MAX_DIST_O) + 0.8 * hash(i, 2));
// distance from the seam at rest (front rows give and take, rear rows hold)
const SEAM_D = REST.map((p) => Math.abs(p[0] - SEAM_X0));
const surgeAt = (g: number) => ease((g - T.surge[0]) / (T.surge[1] - T.surge[0]), 0.85);

const SIM_F0 = -12;
const SIM_F1 = G_LAST + 14;
const SIM = (() => {
  const xs = Float64Array.from(ONE.map((p) => p[0]));
  const ys = Float64Array.from(ONE.map((p) => p[1]));
  const out: Float64Array[] = [];
  const SUB = 2;
  const relax = () => {
    for (let it = 0; it < 3; it++) {
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const dx = xs[j] - xs[i];
          const dy = ys[j] - ys[i];
          if (Math.abs(dx) >= SPACE_MIN || Math.abs(dy) >= SPACE_MIN) continue;
          const d = Math.hypot(dx, dy);
          if (d >= SPACE_MIN) continue;
          const c = (0.5 * (SPACE_MIN - d)) / (d || 1e-6);
          const ux = d > 1e-6 ? dx : Math.cos(i * 2.4) * 1e-3;
          const uy = d > 1e-6 ? dy : Math.sin(i * 2.4) * 1e-3;
          xs[i] -= ux * c;
          ys[i] -= uy * c;
          xs[j] += ux * c;
          ys[j] += uy * c;
        }
      }
    }
  };
  for (let f = SIM_F0; f <= SIM_F1; f++) {
    for (let sub = 0; sub < SUB; sub++) {
      const g = f + (sub + 1) / SUB;
      const su = surgeAt(g);
      const pr = pressAt(g);
      for (let i = 0; i < N; i++) {
        const sp = ease((g - SPLIT_T0[i]) / (T.split[1] - T.split[0]), 0.9);
        let hx = ONE[i][0] + (REST[i][0] - ONE[i][0]) * sp;
        const hy = ONE[i][1] + (REST[i][1] - ONE[i][1]) * sp;
        if (su > 0) {
          hx += (isO(i) ? DRIVE_O : -DRIVE_C) * su + pr;
          // the front rows give and take, each on its own phase
          const front = Math.exp(-SEAM_D[i] / (1.3 * CROWD_SLOT)) * smoothstep((g - 60) / 10);
          hx += front * 0.42 * Math.sin(g * (0.17 + 0.1 * hash(i, 4)) + 6.283 * hash(i, 5));
        }
        const a = 0.32;
        xs[i] += (hx - xs[i]) * a;
        ys[i] += (hy - ys[i]) * a;
      }
      const constrain = () => {
        if (su > 0.001) {
          for (let i = 0; i < N; i++) {
            const s = seamX(ys[i], g) + rippleAt(ys[i], g);
            if (isO(i)) {
              if (xs[i] > s - GAP / 2) xs[i] = s - GAP / 2;
            } else if (xs[i] < s + GAP / 2) xs[i] = s + GAP / 2;
          }
        }
        // the cream stay inland of the coast
        for (let i = 0; i < N_CREAM; i++) {
          if (!landAt(xs[i] + 2.6, ys[i])) xs[i] -= 0.6;
        }
      };
      // spacing and the seam, alternated until both hold
      for (let pass = 0; pass < 3; pass++) {
        relax();
        constrain();
      }
    }
    const row = new Float64Array(2 * N);
    for (let i = 0; i < N; i++) {
      row[2 * i] = xs[i];
      row[2 * i + 1] = ys[i];
    }
    out.push(row);
  }
  return out;
})();
const SMOOTH = [-3, -2, -1, 0, 1, 2, 3].map((j) => ({ j, w: Math.exp(-(j * j) / 2) }));
const SMOOTH_W = SMOOTH.reduce((a, t) => a + t.w, 0);
/** a dot's simulated (smoothed) position at frame g, world px */
const simAt = (g: number, i: number): P2 => {
  const fi = Math.round(g);
  let x = 0;
  let y = 0;
  for (const { j, w } of SMOOTH) {
    const r = SIM[Math.max(0, Math.min(SIM.length - 1, fi + j - SIM_F0))];
    x += r[2 * i] * w;
    y += r[2 * i + 1] * w;
  }
  return [x / SMOOTH_W, y / SMOOTH_W];
};

export type DotState = { x: number; y: number; t: number };
/** every dot at global frame g, world px; t = 0 cream .. 1 orange. k = the camera's zoom (the drift is ~1.1 screen px) */
export const dotsAt = (g: number, k: number): DotState[] => {
  const out: DotState[] = [];
  const a = Math.min(1.15 / k, 0.13); // the house micro-drift: ~1.1 screen px close up, capped in world px
  for (let i = 0; i < N; i++) {
    const [x, y] = simAt(g, i);
    const dx = a * Math.sin(g * (0.045 + 0.04 * hash(i, 11)) + 6.283 * hash(i, 13));
    const dy = a * Math.sin(g * (0.04 + 0.045 * hash(i, 12)) + 6.283 * hash(i, 14));
    const t = isO(i) ? smoothstep((g - COL0[i]) / T.colour) : 0;
    out.push({ x: x + dx, y: y + dy, t });
  }
  return out;
};
/** the orange body's centre and bottom (world px) at frame g, from the simulation (no drift) */
const O_IDS = Array.from({ length: N - N_CREAM }, (_, j) => N_CREAM + j);
export const orangeBodyAt = (g: number) => {
  let cx = 0;
  let cy = 0;
  for (const i of O_IDS) {
    const [x, y] = simAt(g, i);
    cx += x;
    cy += y;
  }
  cx /= O_IDS.length;
  cy /= O_IDS.length;
  return { cx, cy, bottom: cy + O_HALF_H };
};
const O_HALF_H = Math.max(...O_YS) - O_YS.reduce((a, b) => a + b, 0) / O_YS.length + 1.25;
/** the swords: centred on the seam, above the two bodies (world px of the anchor: seam x, top of the bodies) */
export const swordsAnchorAt = (g: number): P2 => {
  const near = REST.filter((p) => Math.abs(p[0] - SEAM_X0) < 9).map((p) => p[1]);
  return [SEAM_X0 + pressAt(g), Math.min(...near) - 1.25];
};

// ---------------------------------------------------------------------------
// THE SHIP: a soft trapezoid of speed along the riding voyage, from Santiago
// to THE ANCHORAGE (the last point of the line where its whole box keeps
// SHIP_CLEAR world px off land at the zoom it arrives at: ~29 world px east of
// San Juan de Ulua); sized with the camera. It fades in ONCE, as soon as its
// box is SHIP_CLEAR clear of Cuba leaving Santiago's bay, and out ONCE, at
// anchor, as the dashed line goes ashore; in between it is always fully seen,
// exactly on its own dashed route, and its box never comes within SHIP_CLEAR
// world px of land (the riding voyage was built for this).
// ---------------------------------------------------------------------------
const RAMP_UP = 11;
const RAMP_DOWN = 22;
const VOY_LEN = VOYAGE.len;
/** world px the ship's whole box keeps off land wherever it is seen */
export const SHIP_CLEAR = 6;
/** frames of the fade-in once its box is clear */
const FADE_IN = 7;
function trapUD(g: number, a: number, b: number) {
  if (g <= a || g >= b) return 0;
  if (g < a + RAMP_UP) return 0.5 * (1 - Math.cos((Math.PI * (g - a)) / RAMP_UP));
  if (g > b - RAMP_DOWN) return 0.5 * (1 - Math.cos((Math.PI * (b - g)) / RAMP_DOWN));
  return 1;
}
/** the carrack's length on screen (px): ~36 at k 0.95, ~52 at k 1.7 */
export const shipSize = (k: number) => 37.5 * Math.pow(k, 0.6);
/** the rock and pitch the carrack is drawn with (degrees): gentle, so its box stays tight */
export const SHIP_ROCK = 0.6;
export const SHIP_PITCH_MAX = 1.5;
/** the carrack's box about its waterline point, world px (Carrack glyph units, length / 100: x -56.5
 *  (bowsprit, west) .. +46 (stern), y -81.6 (pennant) .. +6.6 (keel)), bobbing (+-1.1) and tilted <= 2.1 deg */
export const shipBox = (k: number) => {
  const u = shipSize(k) / 100 / k;
  const t = Math.sin(((SHIP_ROCK + SHIP_PITCH_MAX) * Math.PI) / 180);
  return { bow: (56.5 + 82.7 * t) * u, stern: (46 + 82.7 * t) * u, top: (82.7 + 56.5 * t) * u, bottom: (7.7 + 56.5 * t) * u };
};
type Box = { bow: number; stern: number; top: number; bottom: number };
/** does the box about waterline point (x, y), grown by `grow`, touch land? (sampled every world px, edges included) */
export const boxOnLand = (x: number, y: number, b: Box, grow = 0) => {
  const x0 = x - b.bow - grow;
  const x1 = x + b.stern + grow;
  const y0 = y - b.top - grow;
  const y1 = y + b.bottom + grow;
  for (let yy = y0; yy <= y1 + 1e-9; yy += 1) for (let xx = x0; xx <= x1 + 1e-9; xx += 1) if (landAt(xx, yy)) return true;
  for (let xx = x0; xx <= x1 + 1e-9; xx += 1) if (landAt(xx, y1) || landAt(xx, y0)) return true;
  for (let yy = y0; yy <= y1 + 1e-9; yy += 1) if (landAt(x1, yy) || landAt(x0, yy)) return true;
  return false;
};
/** the arclength table of a voyage that ends (stops) at sEnd on T.anchor */
const makeTab = (sEnd: number) => {
  const SUB = 8;
  const a = T.depart;
  const b = T.anchor;
  const out: number[] = [];
  let total = 0;
  for (let i = 0; i <= (b - a) * SUB; i++) total += trapUD(a + i / SUB, a, b) / SUB;
  let s = 0;
  for (let i = 0; i <= (b - a) * SUB; i++) {
    out.push((s / total) * sEnd);
    s += trapUD(a + i / SUB + 0.5 / SUB, a, b) / SUB;
  }
  return out;
};
const sOnTab = (tab: number[], sEnd: number, g: number) => {
  if (g <= T.depart) return 0;
  if (g >= T.anchor) return sEnd;
  const p = (g - T.depart) * 8;
  const i = Math.min(tab.length - 2, Math.floor(p));
  return tab[i] + (tab[i + 1] - tab[i]) * (p - i);
};
/** THE ANCHORAGE and THE SHOWING POINT (arclengths on the riding voyage): the anchorage is the last
 *  point whose box (at the zoom the ship gets there) is SHIP_CLEAR clear; the ship shows from the first
 *  point after which every box up to the anchorage is. Iterated: when it gets where depends on where it stops. */
export const { S_ANCHOR, S_SHOW } = (() => {
  let sEnd = VOY_LEN - 30;
  let sShow = 0;
  for (let it = 0; it < 3; it++) {
    const tab = makeTab(sEnd);
    const kOfS = (s: number) => {
      let lo = T.depart;
      let hi = T.anchor;
      for (let j = 0; j < 30; j++) {
        const mid = (lo + hi) / 2;
        if (sOnTab(tab, sEnd, mid) < s) lo = mid;
        else hi = mid;
      }
      return kAt(hi);
    };
    const clear = (s: number) => {
      const [x, y] = VOYAGE.pointAt(s);
      return !boxOnLand(x, y, shipBox(kOfS(Math.min(s, sEnd))), SHIP_CLEAR);
    };
    let e = VOY_LEN;
    while (e > 0 && !clear(e)) e -= 0.5;
    sEnd = e;
    let f = sEnd;
    while (f > 0 && clear(f - 0.5)) f -= 0.5;
    sShow = f;
  }
  return { S_ANCHOR: sEnd, S_SHOW: sShow };
})();
const SHIP_TAB = makeTab(S_ANCHOR);
/** the ship's arclength along the riding voyage at g (it rides at anchor from T.anchor) */
export const shipS = (g: number) => sOnTab(SHIP_TAB, S_ANCHOR, g);
/** the frame the ship reaches its showing point */
export const G_SHOW = (() => {
  let lo = T.depart;
  let hi = T.anchor;
  for (let j = 0; j < 40; j++) {
    const mid = (lo + hi) / 2;
    if (shipS(mid) < S_SHOW) lo = mid;
    else hi = mid;
  }
  return hi;
})();
const fadeInAt = (g: number) => smoothstep((g - G_SHOW) / FADE_IN);
const fadeOutAt = (g: number) => 1 - smoothstep((g - T.shipOut[0]) / (T.shipOut[1] - T.shipOut[0]));
export type ShipState = { x: number; y: number; op: number; pitch: number; wake: number; s: number; size: number };
export const shipAt = (g: number): ShipState => {
  const s = shipS(g);
  const [x, y] = VOYAGE.pointAt(s);
  const tan = VOYAGE.tangentAt(Math.min(VOY_LEN - 2, Math.max(2, s)));
  // pitch: a touch of the course's slope (bow up when heading north-west), clamped
  const slope = Math.atan2(-tan[1], -tan[0]) * (180 / Math.PI);
  const pitch = Math.max(-SHIP_PITCH_MAX, Math.min(SHIP_PITCH_MAX, slope * 0.12));
  const speed = trapUD(g, T.depart, T.anchor);
  const k = kAt(g);
  return {
    x,
    y,
    s,
    size: shipSize(k),
    op: fadeInAt(g) * fadeOutAt(g),
    pitch,
    wake: smoothstep(speed * 1.6),
  };
};
/** the route drawn behind the ship (cream dashed): from Santiago to the ship (its stern once it shows),
 *  then, at anchor, on ashore to San Juan de Ulua */
export const routeEndAt = (g: number, k: number) => {
  const sail = Math.max(0, shipS(g) - ((0.4 * shipSize(k)) / k) * fadeInAt(g));
  if (g <= T.ashore[0]) return sail;
  return sail + (VOY_LEN - sail) * ease((g - T.ashore[0]) / (T.ashore[1] - T.ashore[0]));
};
/** the land leg drawn from the anchorage to Cempoala (arclength on NARVAEZ_LAND_LEG) */
export const landLegAt = (g: number) => NARVAEZ_LAND_LEG.len * ease((g - T.landLeg[0]) / (T.landLeg[1] - T.landLeg[0]), 0.9);

// ---------------------------------------------------------------------------
// THE ROAD: from just inside the orange body (where the road leaves it, as the
// body stands when the road sets out) to Tenochtitlan, head-led
// ---------------------------------------------------------------------------
export const ROAD_S0 = (() => {
  const pts = O_IDS.map((i) => simAt(T.road[0], i));
  let exit = 0;
  for (let s = 0; s <= CORTES_ROAD.len; s += 0.25) {
    const [x, y] = CORTES_ROAD.pointAt(s);
    if (pts.some(([px, py]) => Math.hypot(px - x, py - y) < CROWD_SLOT * 0.9)) exit = s;
  }
  return Math.max(0, exit - 3);
})();
const ROAD_TAB = (() => {
  const SUB = 8;
  const [a, b] = T.road;
  const v = (g: number) => trap(g, a, b, 13);
  let total = 0;
  for (let i = 0; i < (b - a) * SUB; i++) total += v(a + (i + 0.5) / SUB) / SUB;
  const out: number[] = [0];
  let s = 0;
  for (let i = 0; i < (b - a) * SUB; i++) {
    s += v(a + (i + 0.5) / SUB) / SUB;
    out.push(s / total);
  }
  return out;
})();
/** the road head's arclength at g (ROAD_S0 .. CORTES_ROAD.len) */
export const roadHeadAt = (g: number) => {
  const [a, b] = T.road;
  if (g <= a) return ROAD_S0;
  if (g >= b) return CORTES_ROAD.len;
  const p = (g - a) * 8;
  const i = Math.min(ROAD_TAB.length - 2, Math.floor(p));
  const u = ROAD_TAB[i] + (ROAD_TAB[i + 1] - ROAD_TAB[i]) * (p - i);
  return ROAD_S0 + (CORTES_ROAD.len - ROAD_S0) * u;
};
/** the head's speed (world px / f), for its glow */
export const roadSpeedAt = (g: number) => roadHeadAt(g + 0.5) - roadHeadAt(g - 0.5);

// ---------------------------------------------------------------------------
// THE CORTES LABEL: centred below the orange body; its cap line is the lower of
// (a 20 px gap under the body) and LABEL_Y_MIN: clear of the road's bend at
// Cholula and of the cream body's bottom (so it never sits on either)
// ---------------------------------------------------------------------------
export const LABEL_GAP = 20;
export const LABEL_Y_MIN = (() => {
  let roadLow = -Infinity;
  for (let s = ROAD_S0; s <= CORTES_ROAD.len; s += 0.25) roadLow = Math.max(roadLow, CORTES_ROAD.pointAt(s)[1]);
  const creamLow = Math.max(...CREAM_REST.map((p) => (p as P2)[1]));
  return Math.max(roadLow + 1.6, creamLow + 1.25 + 1.6);
})();
/** the label's cap-line world y at g */
export const cortesCapY = (g: number, k: number) => Math.max(orangeBodyAt(g).bottom + LABEL_GAP / k, LABEL_Y_MIN);

// ---------------------------------------------------------------------------
// THE CAMERA
// ---------------------------------------------------------------------------
// The frame centre (cx, cy) = the opening framing + screen-shaped glides
// [a, b, dx, dy, ramp] (each moves the camera by exactly (dx, dy) world px,
// world velocity ~ trap(g) / k(g), so its on-screen pan keeps the soft
// trapezoid's shape through a zoom) + THE FOLLOW (C1 ship lock).
type Glide = [number, number, number, number, number];
const G_SUB = 8;
const G_LO = -60;
const G_HI = 380;
const integrate = (vel: (g: number) => P2) => {
  const tx: number[] = [];
  const ty: number[] = [];
  let ax = 0;
  let ay = 0;
  for (let i = 0; i <= (G_HI - G_LO) * G_SUB; i++) {
    const g = G_LO + i / G_SUB;
    tx.push(ax);
    ty.push(ay);
    const [vx, vy] = vel(g + 0.5 / G_SUB);
    ax += vx / G_SUB;
    ay += vy / G_SUB;
  }
  return (g: number): P2 => {
    const p = (g - G_LO) * G_SUB;
    const i = Math.max(0, Math.min(tx.length - 2, Math.floor(p)));
    const u = clamp01(p - i);
    return [tx[i] + (tx[i + 1] - tx[i]) * u, ty[i] + (ty[i + 1] - ty[i]) * u];
  };
};
const makeGlide = ([a, b, dx, dy, ramp]: Glide) => {
  const raw = integrate((g) => [trap(g, a, b, ramp) / kAt(g), 0]);
  const total = raw(G_HI)[0] || 1;
  return (g: number): P2 => {
    const v = raw(g)[0] / total;
    return [dx * v, dy * v];
  };
};
// the ship's voyage track, smoothed (sigma 9 f): the follow rides this
const SHIP_SIG = 9;
const SHIP_SM = (() => {
  const step = 0.5;
  const xs: number[] = [];
  const ys: number[] = [];
  for (let g = G_LO; g <= G_HI; g += step) {
    let sx = 0;
    let sy = 0;
    let w = 0;
    for (let j = -3 * SHIP_SIG; j <= 3 * SHIP_SIG; j += step) {
      const q = Math.exp(-(j * j) / (2 * SHIP_SIG * SHIP_SIG));
      const [x, y] = VOYAGE.pointAt(shipS(g + j));
      sx += x * q;
      sy += y * q;
      w += q;
    }
    xs.push(sx / w);
    ys.push(sy / w);
  }
  return (g: number): P2 => {
    const p = (g - G_LO) / step;
    const i = Math.max(0, Math.min(xs.length - 2, Math.floor(p)));
    const u = clamp01(p - i);
    return [xs[i] + (xs[i + 1] - xs[i]) * u, ys[i] + (ys[i + 1] - ys[i]) * u];
  };
})();
// the crowd's centre in each framing (world px)
const meanOf = (pts: P2[]) => [pts.reduce((a, p) => a + p[0], 0) / pts.length, pts.reduce((a, p) => a + p[1], 0) / pts.length] as P2;
const ONE_C = (() => {
  const xs = ONE.map((p) => p[0]);
  const ys = ONE.map((p) => p[1]);
  return [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2] as P2;
})();
const REST_C = (() => {
  const xs = REST.map((p) => p[0]);
  const ys = REST.map((p) => p[1]);
  return [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2] as P2;
})();
// the opening framing: the crowd's centre at screen (540, 835) at k(0)
const C0: P2 = [ONE_C[0], ONE_C[1] + 125 / kAt(0)];
// THE GULF WIDE (g ~118): the Cempoala group at x ~145, Santiago at x ~935, on y 835
const GROUP_X = meanOf(REST)[0];
const GULF_SX = { group: 145, santiago: 935 };
export const GULF_CX = SITES.santiago.x - (GULF_SX.santiago - 540) / K_GULF;
const GULF_CY = 840 + 125 / K_GULF;
// the road's final framing: Cempoala and the crowd right, Tenochtitlan left, the content on y ~835
const FINAL_C: P2 = [(SITES.cempoala.x + SITES.tenochtitlan.x) / 2 + 3, 874 + 125 / 4.2];
// the Gulf wide is composed AT "Velazquez" (g118): Santiago at x GULF_SX.santiago
// at that frame's zoom (the group then lands at ~x 145)
const G_WIDE = 118;
const buildPre = (dx: number, dy: number): Glide[] => [
  [-40, 86, REST_C[0] - ONE_C[0], 0, 30], // the opening drifts west as the orange draws away (the two bodies stay centred)
  [84, 130, dx, dy, 18], // THE GLIDE EAST, at low k (passing through the Gulf wide on g118)
  [118, 152, 3, 0, 12], // its last velocity, carried on toward Santiago
];
const PRE: Glide[] = (() => {
  const k = kAt(G_WIDE);
  const want: P2 = [SITES.santiago.x - (GULF_SX.santiago - 540) / k, 840 + 125 / k];
  let dx = want[0] - (C0[0] + REST_C[0] - ONE_C[0]);
  let dy = want[1] - C0[1];
  for (let it = 0; it < 3; it++) {
    const fns = buildPre(dx, dy).map(makeGlide);
    let cx = C0[0];
    let cy = C0[1];
    for (const fn of fns) {
      const [ex, ey] = fn(G_WIDE);
      cx += ex;
      cy += ey;
    }
    dx += want[0] - cx;
    dy += want[1] - cy;
  }
  return buildPre(dx, dy);
})();
const PRE_FNS = PRE.map(makeGlide);
const preAt = (g: number): P2 => {
  let cx = C0[0];
  let cy = C0[1];
  for (const fn of PRE_FNS) {
    const [dx, dy] = fn(g);
    cx += dx;
    cy += dy;
  }
  return [cx, cy];
};
// THE FOLLOW. From frame G_IN (the ship crosses screen x X_IN on its own under
// the Gulf-wide camera) the camera is ship-locked: it holds the ship's smoothed
// track at a target screen point that STARTS where the ship is, moving as it
// moves (position and velocity match: C1), and eases to rest at SHIP_REST over
// D_IN frames, so the camera simply accelerates to the ship's own speed.
const X_IN = 760;
const D_IN = 20;
const SHIP_REST: P2 = [588, 862];
const natural = (g: number): P2 => {
  const p = preAt(g);
  const q = SHIP_SM(g);
  const k = kAt(g);
  return [540 + (q[0] - p[0]) * k, 960 + (q[1] - p[1]) * k];
};
export const G_IN = (() => {
  for (let g = T.depart; g < T.anchor; g += 0.05) if (natural(g)[0] <= X_IN) return g;
  return T.depart + 20;
})();
const IN_POS = natural(G_IN);
const IN_VEL: P2 = (() => {
  const a = natural(G_IN - 0.25);
  const b = natural(G_IN + 0.25);
  return [(b[0] - a[0]) * 2, (b[1] - a[1]) * 2];
})();
const shipScreen = (g: number): P2 => {
  const u = clamp01((g - G_IN) / D_IN);
  const h00 = 2 * u * u * u - 3 * u * u + 1;
  const h10 = u * u * u - 2 * u * u + u;
  const h01 = -2 * u * u * u + 3 * u * u;
  return [0, 1].map((c) => h00 * IN_POS[c] + h10 * IN_VEL[c] * D_IN + h01 * SHIP_REST[c]) as P2;
};
const followAt = (g: number): P2 => {
  if (g <= G_IN) return preAt(g);
  const [x, y] = SHIP_SM(g);
  const [sx, sy] = shipScreen(g);
  const k = kAt(g);
  return [x - (sx - 540) / k, y - (sy - 960) / k];
};
// [a, b, dx, dy]: the lead-on as the ship slows and anchors (the crowd reaches the centre by "arrest"/"Cortes")
const SETTLE: [number, number, number, number] = [180, 230, -50, -4];
const POST: Glide[] = (() => {
  const end = followAt(G_HI);
  // leading on toward the crowd as the ship slows and anchors (it anchors ~28 world px east of San Juan
  // de Ulua, so the camera looks ahead: the ship drifts right of SHIP_REST, the crowd comes to the centre)
  const settle: Glide = [SETTLE[0], SETTLE[1], SETTLE[2], SETTLE[3], 18];
  const west: Glide = [226, 292, FINAL_C[0] - (end[0] + SETTLE[2]), FINAL_C[1] - (end[1] + SETTLE[3]), 20]; // rides the road west and in
  const tail: Glide = [274, 356, -5, 1.5, 30]; // the creep
  return [settle, west, tail];
})();
const POST_FNS = POST.map(makeGlide);
export const GLIDES: Glide[] = [...PRE, ...POST];
/** the authored camera at global frame g (no sway) */
export const camAt = (g: number): Cam => {
  let [cx, cy] = followAt(g);
  for (const fn of POST_FNS) {
    const [dx, dy] = fn(g);
    cx += dx;
    cy += dy;
  }
  return { k: kAt(g), cx, cy };
};
export const CAM_TRACK: Cam[] = Array.from({ length: G_LAST + 1 }, (_, g) => camAt(g));
/** for the checks: the Gulf-wide targets */
export const GULF = { k: K_GULF, cx: GULF_CX, cy: GULF_CY, groupX: GROUP_X, screen: GULF_SX };
