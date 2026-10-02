// StrangersInHisRealm (cut 1 of the Atahualpa clip), V2 (director's review 1:
// CLOSE -> WIDE -> CLOSE; the 168 as a marching column of men). Every moving
// thing as pure maths (no React), so the check scripts read the exact motion
// the component draws. See StrangersInHisRealm.tsx's header for the words, the
// gestures, the colour rule and the sources.
//   the ship     a hollow orange carrack sails in from the open sea WNW of
//                Tumbes and puts its bow on the beach (LANDING), easing out;
//                its bow is the anchor, so it stays on the beach as the camera
//                pulls back and the glyph shrinks (37.5 k^0.6 px)
//   the column   168 men (FACTS.md section 1: 62 horse + 106 foot), about 6
//                abreast x 28 deep along PIZARRO_1532: ragged ranks (4, 5 at
//                the head and the tail, 6-7 in the body), each man jittered ~30 %
//                of the spacing and the whole relaxed apart, so it is organic,
//                never a lattice, never strings, every man a separate dot
//   the stream   the men file off the bow onto the beach and down the road,
//                head first, each easing out to his file as he reaches his place
//   the march    the column walks the route at a slow, steady 1.1 px/f (at the
//                close-up's k 14) after a soft start; each man carries a tiny
//                stride bob along the march (+-0.5 px, his own phase); nothing else
//   the realm    the border wave from Tumbes both ways round the realm, the
//                wash a touch brighter (unchanged from V1)
//   the camera   the subject (the column's centre) at a screen point P and ln k,
//                each the integral of cosine-tapered velocity bumps (C1): the
//                PULL-BACK (k 2.2 -> 1.0, already easing out on f0, the long
//                glide f22-f46), a held breath on the realm wide (f46-f48), the
//                DIVE (k 1.0 -> 14, f48-f70), the hold's creep (+3 %)
import {
  LANDING,
  PIZARRO_1532,
  REALM_BORDER_RUNS,
  SCREEN_CX,
  SCREEN_CY,
  SITES,
  hash,
  landAt,
  makeTrack,
  project,
  realmLoopS,
  smoothstep,
  type Bump,
  type Cam,
  type P2,
} from "./incaShared";

export const FPS = 24;
// In-point 15.16 s ("that"). The line ends with "men" at 19.56 s:
// round((19.56 - 15.16) * 24) = round(105.6) = 106; DURATION = 106 + the
// 16-frame house tail = 122 frames (f0..f121).
export const IN_POINT = 15.16;
export const DURATION = 122;
export const LAST = DURATION - 1;

/** word onsets, f = round((t - 15.16) * 24) */
export const W = {
  that: 0,
  strangers: 7,
  have: 19,
  entered: 28,
  his: 37,
  realm: 45,
  and: 53,
  again: 57,
  were: 66,
  talking: 70,
  n168: 73,
  men: 96,
  menEnd: 106,
};

// the three framings
export const K_OPEN = 2.2; // f0: close on the landing (Ecuador and northern Peru, the Gulf of Guayaquil)
export const K_WIDE = 1.0; // f47-f49: THE REALM WIDE (the world's k 1 framing, camera (540, 960))
export const K_FINAL = 14; // f68+: the column (outside every LOD crossfade band; the tight level is sharp to k 21)
export const K_END = K_FINAL * 1.03; // f121: the hold's creep
export const CLOSE_Y = 780; // the column's centre on screen in the close-up

// ---------------------------------------------------------------------------
// THE COLUMN. 168 men, about 6 abreast x 28 deep along the route. Local
// frame: u along the route (+ = the head, inland, +s), v across (+ = the
// route's left). Spacing at the close-up (k 14): 12.4 px between ranks, 12.6 px
// between files; each man jittered +-30 % of the spacing (hashed), the odd
// ranks half a file over, each rank's centre and the body's width wandering a
// little, then relaxed apart (no two centres closer than 0.86 x the rank
// spacing = 10.7 px): a loose, organic column of separate men.
// ---------------------------------------------------------------------------
export const N_MEN = 168;
export const ROW_PX = 12.4; // screen px between ranks at K_FINAL
export const FILE_PX = 12.6; // screen px between files at K_FINAL
const ROW = ROW_PX / K_FINAL; // world px
const FILE = FILE_PX / K_FINAL;
/** rank sizes, head first: ragged ends (4, 5 ... 5, 4), 6-7 abreast in the body (~6.25); sum 168 */
export const RANKS: number[] = (() => {
  const head = [4, 5];
  const tail = [5, 4];
  const body: number[] = [];
  const nBody = 28 - head.length - tail.length; // 24
  const need = N_MEN - [...head, ...tail].reduce((a, b) => a + b, 0); // 150 = 24 ranks of 6 or 7
  const sevens = need - 6 * nBody; // 6
  // the ranks of 7 spread through the body by a hashed order
  const order = Array.from({ length: nBody }, (_, i) => i).sort((a, b) => hash(a, 61) - hash(b, 61));
  const seven = new Set(order.slice(0, sevens));
  for (let i = 0; i < nBody; i++) body.push(seven.has(i) ? 7 : 6);
  return [...head, ...body, ...tail];
})();
export const SLOTS: P2[] = (() => {
  const pts: P2[] = [];
  const nR = RANKS.length;
  RANKS.forEach((n, r) => {
    const u0 = ((nR - 1) / 2 - r) * ROW * (1 + 0.06 * (hash(r, 71) - 0.5)); // head (r 0) at +u
    const vShift = FILE * (0.24 * (hash(r, 72) - 0.5) + (r % 2 === 1 ? 0.5 : 0) - 0.25); // stagger + wander
    const widen = 1 + 0.08 * Math.sin(r * 0.55 + 1.3); // the body's width breathes along its length
    for (let j = 0; j < n; j++) {
      const id = r * 8 + j;
      const v = (j - (n - 1) / 2) * FILE * widen + vShift + FILE * 0.6 * (hash(id, 73) - 0.5);
      const u = u0 + ROW * 0.6 * (hash(id, 74) - 0.5);
      pts.push([u, v]);
    }
  });
  // relax: no two men closer than MIN_SEP (Jacobi pushes, 40 passes): daylight round every man
  const MIN_SEP = 0.86 * ROW;
  for (let it = 0; it < 40; it++) {
    const d = pts.map(() => [0, 0] as P2);
    for (let i = 0; i < pts.length; i++)
      for (let j = i + 1; j < pts.length; j++) {
        const ex = pts[j][0] - pts[i][0];
        const ey = pts[j][1] - pts[i][1];
        const l = Math.hypot(ex, ey);
        if (l >= MIN_SEP || l < 1e-9) continue;
        const m = (0.5 * (MIN_SEP - l)) / l;
        d[i][0] -= ex * m;
        d[i][1] -= ey * m;
        d[j][0] += ex * m;
        d[j][1] += ey * m;
      }
    pts.forEach((p, i) => {
      p[0] += d[i][0];
      p[1] += d[i][1];
    });
  }
  // centre the body on its own middle (u) and the route (v), head first
  const um = (Math.max(...pts.map((p) => p[0])) + Math.min(...pts.map((p) => p[0]))) / 2;
  const vm = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  return pts.map(([u, v]) => [u - um, v - vm] as P2).sort((a, b) => b[0] - a[0]);
})();
if (SLOTS.length !== N_MEN) throw new Error(`the column must be exactly ${N_MEN} men (it is ${SLOTS.length})`);
export const COLUMN_LEN = Math.max(...SLOTS.map((p) => p[0])) - Math.min(...SLOTS.map((p) => p[0])); // world px

/** the men's dot radius (world px): 3.5 px at the close-up, never under 1.6 px */
export const MAN_R_PX = 3.5;
export const menRadius = (k: number) => Math.max(MAN_R_PX / K_FINAL, 1.6 / k);

// ---------------------------------------------------------------------------
// THE MARCH: the column's centre at route arclength sC(f): S_C0 until the
// march sets off, then a soft start (smoothstep velocity over MARCH_RAMP)
// into V_MARCH (1.1 px/f at the close-up). The column stays on the straight
// road between the bend at Tumbes (s 2.9) and the bend at Poechos (s 39.5):
// its tail at s >= 3.6 when it forms, its head at s <= 35.5 on the last frame.
// ---------------------------------------------------------------------------
export const V_MARCH = 1.1 / K_FINAL; // world px / f
export const MARCH_T0 = 16; // the march sets off as the first men land
export const MARCH_RAMP = 14;
export const S_C0 = 3.6 + COLUMN_LEN / 2;
export const sC = (f: number) => {
  const t = f - MARCH_T0;
  if (t <= 0) return S_C0;
  const r = MARCH_RAMP;
  if (t < r) {
    const u = t / r;
    return S_C0 + V_MARCH * r * (u * u * u - 0.5 * u * u * u * u); // integral of V smoothstep(t / r)
  }
  return S_C0 + V_MARCH * (r * 0.5 + (t - r));
};
const R = PIZARRO_1532;
const nrmAt = (s: number): P2 => {
  const t = R.tangentAt(s);
  return [-t[1], t[0]];
};
/** man i's place in the column at frame f (world px) */
export const slotPos = (i: number, f: number): P2 => {
  const [u, v] = SLOTS[i];
  const s = sC(f) + u;
  const p = R.pointAt(s);
  const n = nrmAt(s);
  return [p[0] + n[0] * v, p[1] + n[1] * v];
};
/** the column's centre (world px) at frame f: the camera's subject */
export const bodyCentre = (f: number): P2 => R.pointAt(sC(f));

// ---------------------------------------------------------------------------
// THE SHIP. Its BOW (the hull's waterline front, 39 glyph units ahead of the
// middle) sails in from the open sea WNW of Tumbes (the mouth of the Gulf of
// Guayaquil: Pizarro crossed from Puna), already under way on f0, easing to a
// stop 1.2 world px off the beach at LANDING on f16 (power-2.5 ease-out); the
// glyph is drawn back from its bow at the current size, so the bow stays on the
// beach while the camera pulls back. It fades out (f30-f42) once the men are
// ashore. Size 37.5 k^0.6 screen px (the Cortes world's law): 60 px at k 2.2.
// ---------------------------------------------------------------------------
export const SHIP_SIZE = (k: number) => 37.5 * Math.pow(k, 0.6);
const BOW_UNITS = 39; // the hull's front at the waterline, glyph units ahead of the middle
export const SHIP_ARRIVE = 16;
export const SHIP_FADE: [number, number] = [30, 42];
const shipUnit = (k: number) => SHIP_SIZE(k) / 100 / k; // world px per glyph unit
export const BOW_ANCHOR: P2 = [LANDING.x + LANDING.seaward[0] * 1.2, LANDING.y + LANDING.seaward[1] * 1.2];
const BOW_FROM: P2 = [BOW_ANCHOR[0] - 27, BOW_ANCHOR[1] - 11]; // ~29 world px WNW, open water
const SAIL_LEN = Math.hypot(BOW_ANCHOR[0] - BOW_FROM[0], BOW_ANCHOR[1] - BOW_FROM[1]);
const SAIL_P = 2.5;
/** the bow (world px) at frame f */
export const bowPos = (f: number): P2 => {
  const t = Math.min(1, Math.max(0, f / SHIP_ARRIVE));
  const e = 1 - Math.pow(1 - t, SAIL_P); // eased out; already sailing on f0
  return [BOW_FROM[0] + (BOW_ANCHOR[0] - BOW_FROM[0]) * e, BOW_FROM[1] + (BOW_ANCHOR[1] - BOW_FROM[1]) * e];
};
/** the ship at frame f at zoom k: its waterline middle (x, y), speed, opacity, wake */
export const shipAt = (f: number, k: number) => {
  const t = Math.min(1, Math.max(0, f / SHIP_ARRIVE));
  const bow = bowPos(f);
  const speed = (SAIL_P * Math.pow(1 - t, SAIL_P - 1) * SAIL_LEN) / SHIP_ARRIVE; // world px / f
  const op = 1 - smoothstep((f - SHIP_FADE[0]) / (SHIP_FADE[1] - SHIP_FADE[0]));
  return { x: bow[0] - BOW_UNITS * shipUnit(k), y: bow[1], speed, op, wake: Math.min(1, speed / 2.6) };
};

// ---------------------------------------------------------------------------
// THE STREAM ("have entered", f19-f28): the men come off the bow, head first,
// one every ~0.054 f (STREAM_T0 .. STREAM_T1), step onto the beach and walk the
// road (route arclength s, a Hermite from 0 at V_STREAM into the march's speed
// at their place, so they fall in without a step), easing out to their files
// over the last frames; a 2-frame fade at the bow
// ---------------------------------------------------------------------------
export const STREAM_T0 = 16;
export const STREAM_T1 = 25;
const V_STREAM = 2.5; // world px / f
const hermite1 = (p0: number, v0: number, p1: number, v1: number, u: number) => {
  const h00 = 2 * u * u * u - 3 * u * u + 1;
  const h10 = u * u * u - 2 * u * u + u;
  const h01 = -2 * u * u * u + 3 * u * u;
  const h11 = u * u * u - u * u;
  return h00 * p0 + h10 * v0 + h01 * p1 + h11 * v1;
};
const BEACH: P2 = R.pointAt(0);
export const STREAM = SLOTS.map(([u], i) => {
  const t0 = STREAM_T0 + ((STREAM_T1 - STREAM_T0) * i) / (N_MEN - 1) + 0.5 * (hash(i, 31) - 0.5);
  let t1 = t0 + 6;
  for (let it = 0; it < 5; it++) t1 = t0 + Math.max(3, Math.min(14, (sC(t1) + u) / V_STREAM));
  return { t0, t1 };
});
export const ALL_ASHORE = Math.max(...STREAM.map((q) => q.t1));

/** the stride bob: along the march, +-0.5 screen px, each man his own phase and cadence */
const bob = (i: number, f: number, k: number) => (0.5 / k) * Math.sin((f * 2 * Math.PI) / (12 + 4 * hash(i, 81)) + 6.283 * hash(i, 82));
export type ManState = { x: number; y: number; op: number };
/** man i at frame f (world px) at zoom k */
export const manAt = (i: number, f: number, k: number): ManState => {
  const { t0, t1 } = STREAM[i];
  if (f < t0) return { x: 0, y: 0, op: 0 };
  if (f >= t1) {
    const p = slotPos(i, f);
    const s = sC(f) + SLOTS[i][0];
    const t = R.tangentAt(s);
    const b = bob(i, f, k) * smoothstep((f - t1) / 6);
    return { x: p[0] + t[0] * b, y: p[1] + t[1] * b, op: 1 };
  }
  // walking the road: s from 0 (the beach) to his place, v easing out to his file
  const H = t1 - t0;
  const u = (f - t0) / H;
  const s1 = sC(t1) + SLOTS[i][0];
  const vEnd = (sC(t1) - sC(t1 - 0.25)) * 4; // the march's speed at t1 (world px / f)
  const s = hermite1(0, V_STREAM * H, s1, vEnd * H, u);
  const lat = SLOTS[i][1] * smoothstep((f - (t1 - Math.min(5, H))) / Math.min(5, H));
  const p = R.pointAt(s);
  const n = nrmAt(s);
  // off the bow: the step from the bow to the beach fades over the first 2.5 frames
  const off = 1 - smoothstep((f - t0) / 2.5);
  const bow = BOW_ANCHOR;
  return {
    x: p[0] + n[0] * lat + (bow[0] - BEACH[0]) * off,
    y: p[1] + n[1] * lat + (bow[1] - BEACH[1]) * off,
    op: smoothstep((f - t0) / 2),
  };
};

// ---------------------------------------------------------------------------
// THE REALM: the wave and the wash (unchanged from V1)
//   the wave leaves Tumbes (its loop arclength) both ways round the realm's
//   loop; the two fronts meet in the far south at WAVE_TO, the border's point
//   at 33 S (east of Mendoza), at progress 1. The coast stretches of the loop
//   are the baked coast (already cream): the land border lights from its north
//   end (the coast-going front reaches it first) and from the Maule mouth (the
//   other front, last), meeting at 33 S
// ---------------------------------------------------------------------------
export const WAVE_FROM = realmLoopS([SITES.tumbes.x, SITES.tumbes.y]);
export const WAVE_TO = (() => {
  // the border vertex on the realm's south-east frontier (east of 70.5 W) whose latitude is nearest 33 S
  let best = { s: 0, d: Infinity };
  const y33 = project(-69, -33)[1];
  const xWest = project(-70.5, -33)[0];
  for (const run of REALM_BORDER_RUNS) {
    run.pts.forEach((p, j) => {
      const d = Math.abs(p[1] - y33) + (p[0] < xWest ? 1e6 : 0);
      if (d < best.d) best = { s: run.s[j], d };
    });
  }
  return best.s;
})();
export const WAVE_T: [number, number] = [33, 50]; // progress 0 -> 1, eased (the north end lights ~f38; "realm" f45 lands with ~80 % lit)
export const waveProgress = (f: number) => smoothstep((f - WAVE_T[0]) / (WAVE_T[1] - WAVE_T[0]));
export const WASH: [number, number] = [0.05, 0.075];
/** the wash: the context opacity `a`, a touch brighter (`b`) on "his realm" (f37-f50) */
export const smoothWash = (f: number, a = WASH[0], b = WASH[1]) => a + (b - a) * smoothstep((f - 37) / 13);

// ---------------------------------------------------------------------------
// THE CAMERA: subject S = the column's centre (bodyCentre(f)); its screen
// point P(f) and ln k(f) are integrals of cosine-tapered velocity bumps
// (makeTrack, C1); fixed bumps give the moves already under way on f0, the
// glides' areas are SOLVED to pass through the keys:
//   f0   CLOSE on the landing: k 2.2, the landing at screen (400, 790): the
//        realm's northern third (Ecuador, northern Peru, the gulf), the sea
//        with the ship to the left; already pulling back (zoom out 3.5 % over
//        f0-f30, the pan easing in)
//   f46  THE REALM WIDE: k 1.0, the camera (540, 960) exactly (the pull-back's
//        long glide f22-f46 lands; held f46-f48, while the wave closes in the
//        far south)
//   f80  the column: k 14, its centre at (540, 780) (the dive f48-f70: k within
//        1.4 % by f68, P lands on f68)
//   f121 the hold's creep: k 14.4 (+3 %), the column held at (540, 780)
// ---------------------------------------------------------------------------
type Win = [number, number, number];
/** a channel: fixed bumps + windows whose areas are solved so the channel (value v0 on f0) hits targets on keyF */
const solveTrack = (fixed: Bump[], windows: Win[], v0: number, keyF: number[], targets: number[]) => {
  const base = makeTrack(fixed, 0, -80, 260);
  const unit = windows.map(([a, b, t]) => makeTrack([[a, b, 1, t]] as Bump[], 0, -80, 260));
  const n = windows.length;
  const m = keyF.map((f, r) => [...unit.map((u) => u(f)), targets[r] - v0 - base(f)]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(m[r][c]) > Math.abs(m[p][c])) p = r;
    [m[c], m[p]] = [m[p], m[c]];
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const q = m[r][c] / m[c][c];
      for (let j = c; j <= n; j++) m[r][j] -= q * m[c][j];
    }
  }
  const areas = m.map((row, i) => row[n] / row[i]);
  return { track: makeTrack([...fixed, ...windows.map(([a, b, t], i) => [a, b, areas[i], t] as Bump)], v0, -80, 260), areas };
};
export const KEY_WIDE = 46; // the pull-back lands (the realm wide), held f46-f48
const F_DIVE: [number, number] = [48, 70];
/** ln k: a gentle zoom-out already under way on f0 (fixed), the pull-back's long glide, the dive, the hold's creep */
export const ZOOM_FIXED: Bump[] = [[-30, 30, -0.07, 1]];
export const WIN_ZOOM: Win[] = [
  [22, KEY_WIDE, 1], // THE PULL-BACK
  [F_DIVE[0], F_DIVE[1], 1], // THE DIVE
  [62, 200, 1], // the hold's creep (+3 %), overlapping the dive's tail: decaying into the hold
];
export const LNK = solveTrack(ZOOM_FIXED, WIN_ZOOM, Math.log(K_OPEN), [KEY_WIDE + 1, 80, LAST], [Math.log(K_WIDE), Math.log(K_FINAL), Math.log(K_END)]);
/** the f0 framing: the landing at screen (400, 790) at k 2.2 */
export const OPEN_LANDING_AT: P2 = [400, 790];
const CAM0: Cam = {
  k: K_OPEN,
  cx: LANDING.x - (OPEN_LANDING_AT[0] - SCREEN_CX) / K_OPEN,
  cy: LANDING.y - (OPEN_LANDING_AT[1] - SCREEN_CY) / K_OPEN,
};
const screenAt = (w: P2, c: Cam): P2 => [SCREEN_CX + (w[0] - c.cx) * c.k, SCREEN_CY + (w[1] - c.cy) * c.k];
const P_OPEN = screenAt(bodyCentre(0), CAM0);
const P_WIDE = screenAt(bodyCentre(KEY_WIDE + 1), { k: K_WIDE, cx: SCREEN_CX, cy: SCREEN_CY });
const P_CLOSE: P2 = [SCREEN_CX, CLOSE_Y];
/** the subject's screen point: the pull-back's pan (a little already under way on f0), the dive's pan */
const panFixed = (d: number): Bump[] => [[-30, 40, 0.1 * d, 1]];
export const WIN_PAN: Win[] = [
  [22, KEY_WIDE, 1], // THE PULL-BACK
  [F_DIVE[0], 68, 1], // THE DIVE (P lands on f68, k a little after: one S)
];
export const PX = solveTrack(panFixed(P_WIDE[0] - P_OPEN[0]), WIN_PAN, P_OPEN[0], [KEY_WIDE + 1, 80], [P_WIDE[0], P_CLOSE[0]]);
export const PY = solveTrack(panFixed(P_WIDE[1] - P_OPEN[1]), WIN_PAN, P_OPEN[1], [KEY_WIDE + 1, 80], [P_WIDE[1], P_CLOSE[1]]);
/** the authored camera at frame f (no sway) */
export const camAt = (f: number): Cam => {
  const k = Math.exp(LNK.track(f));
  const S = bodyCentre(f);
  return { k, cx: S[0] - (PX.track(f) - SCREEN_CX) / k, cy: S[1] - (PY.track(f) - SCREEN_CY) / k };
};
export const CAM_TRACK: Cam[] = Array.from({ length: DURATION + 1 }, (_, f) => camAt(f));

// ---------------------------------------------------------------------------
// THE NUMERAL "168" (f73): IM Fell English roman, cream, 110 px, under the
// column on the content axis; slides up 24 px while fading in over 12 f from
// f65. Its baseline: NUMERAL_GAP px below the column's lowest man in the
// close-up (+ his radius + the figures' ascender), and never below y 1060
// ---------------------------------------------------------------------------
export const NUMERAL_F0 = 65;
export const NUMERAL_SIZE = 110;
const NUMERAL_GAP = 26;
export const NUMERAL_DY = (() => {
  let low = -Infinity;
  for (const f of [80, LAST]) {
    const cam = camAt(f);
    for (let i = 0; i < N_MEN; i++) {
      const p = slotPos(i, f);
      low = Math.max(low, SCREEN_CY + (p[1] - cam.cy) * cam.k);
    }
  }
  const baseline = Math.min(1060, Math.round(low + MAN_R_PX + NUMERAL_GAP + 0.72 * NUMERAL_SIZE));
  return baseline - CLOSE_Y;
})();
if (CLOSE_Y + NUMERAL_DY > 1060) throw new Error("the numeral's baseline is below y 1060");

/** checks: every man on land from the moment he stands in his place */
export const landCheck = () => {
  let off = 0;
  for (let f = 0; f <= LAST; f++)
    for (let i = 0; i < N_MEN; i++) {
      if (f < STREAM[i].t1) continue;
      const p = slotPos(i, f);
      if (!landAt(p[0], p[1])) off++;
    }
  return off;
};
