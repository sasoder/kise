// ---------------------------------------------------------------------------
// sugarAB: ACTS A + B of "SarahWar_Britain_let_America_go_to_keep_its_sugar_islands"
// (Dwarkesh with Sarah Paine; Dwarkesh map style) on THE SUGAR WORLD (sugarShared).
// Owned by builder W. Composed by sugarScene.tsx; rendered by cut A ThirteenColonies
// (g42..161) and cut B DeathGround (g312..446). Its elements persist on every later
// story frame unless handed off (HANDOFF in sugarShared; the state at B's end is
// exported as AB_END).
//
// A "The 13 revolting colonies, they had no intention of doing regime change in London."
// B "So the colonists fought harder because they're on death ground. It's big theater."
//
// ORANGE = THE SIDE AT WAR WITH BRITAIN: here the 13 colonies and their militia.
// Britain, its army and Great Britain itself are CREAM.
//
// GESTURES (story frames s; = global g in A; in B s = g - 150). Revision 2 (Fable's review).
//  A0 open s42 (g42): the eastern seaboard fills the column (k 0.95, the colonies'
//     box centred at y700); the 13 outlined in fine cream; Britain's faint cream wash
//     over them (they are British colonies); the camera creeping in (k 0.95 -> 0.975).
//  A1 "13" g46: the 13 flip orange one after another north -> south (NH MA RI CT NY
//     NJ PA DE MD VA NC SC GA, 3 f apart from s44, each a crisp 7 f front from its
//     north edge); the numeral 13 (IM Fell 262 px, ~160 px tall) slides up in the open
//     sea off Cape Hatteras (starts s38).
//  A2 "revolting colonies" g53-69: each colony settles from the bright flip wash into
//     the orange hatch, and the colonies' land edge turns from fine cream to the orange
//     dashed edge (N -> S, s57-96) = the side at war.
//  A3 "they had no intention" g83-108: an orange stroke draws along the colonies' sea
//     coast N -> S (s80-100) as the camera starts to leave: the limit of their aims.
//  A4 "of doing regime change in London" g108-150: A JOURNEY. One van Wijk-Nuij hop
//     (s80-144, rho 1.8): the camera leaves the orange colonies behind (they slide off
//     left), crosses the Atlantic and LANDS on Britain centred (k 1.0, the British Isles
//     ~490 px wide, centre at y835) 6 f before "London"; the 13 fades with it (s84-104).
//     Great Britain is cream throughout (lifted wash 0.26 + hatch 0.62: the subject).
//  A5 "London" g150: London's cream dot (s140-149) + "London" (IM Fell roman 42 px,
//     slide from s142). A's last frame s161: Britain centred, creeping in (k -> 1.03).
//  B1 "So the colonists" g313-329: from A's last frame, Howe's army (~32,000 men,
//     1 dot = 250 men = 128 cream dots, a rounded blue-noise body) forms at Spithead
//     (s162-174, filing out into the Channel) and sails west down the Channel and across; the camera follows on one
//     zoom-out/zoom-in hop (s162-210, rho 2.2) down to the colonies (k 0.6); the convoy
//     is slaved to the camera's progress and reaches the Narrows at ~s200 (g350).
//  B2 "fought harder" g341-352: the convoy files into New York harbour and becomes a
//     compact cream beachhead (Staten Island / Brooklyn / Manhattan / the Jersey shore,
//     radius 30 world px); orange militia rise across all 13 (s186-208), the colonies'
//     hatch dropping to the plain orange wash under them (s186-202); from s194 most of
//     them GATHER on the beachhead into a dense blue-noise band hugging it (a thick
//     front ~9 px apart, thinning inland), a sparse scatter staying out across the 13. The
//     camera pushes in on New York (s204-244, k 0.6 -> 2.4: beachhead ~144 px, the band
//     filling the column).
//  B3 "because they're on death ground" g371-394: a slow creep (k 2.4 -> 2.5); on
//     "death" (s238) the beachhead pushes out ONCE (~10 px) and is stopped by the band
//     (it gives ~2 px and closes); the cream settles back short of where it reached
//     (s242-254). No battle outcome.
//  B4 "It's big theater" g414-430: a clear eased PULL BACK (s266-306) to the seaboard +
//     interior (Maine -> Georgia + the Appalachians, k 0.72): the beachhead a speck on a
//     1,000-mile front; still easing out at B's last frame (s296) and on to s400.
//  LATER (for the acts that follow): London's dot + label fade out s552-564 (after C's
//     "Dutch"); from D's tour (g956 = s628) the colonies' orange (wash, edges, coast) and
//     the militia recede to TOUR_RUNG 0.3 over 12 f; E takes the colonies, the militia,
//     the beachhead and Britain's wash over the colonies at its IN (HANDOFF).
//
// SOURCES. Howe's army at New York, summer 1776: ~32,000 men (incl. ~9,000 Hessians),
// landed on Staten Island from 2 Jul 1776 (Wikipedia "New York and New Jersey
// campaign"; "Landing on Staten Island"). The fleet is drawn sailing from Spithead,
// as the spec asks (most of Howe's own force came via Halifax; the reinforcements
// from Britain). 13 colonies: successor-state outlines (US Census via us-atlas),
// coasts re-cut to Natural Earth 10m. Map: see sugarShared / build-sugar-map.mjs.
// ---------------------------------------------------------------------------
import React from "react";
import {
  ACCENT,
  type Act,
  type ActProps,
  CityDot,
  COLONIES,
  COLONIES_D,
  COLONY_COAST,
  COLONY_INNER_D,
  COLONY_OUTER_D,
  CUT_S,
  type Dot,
  Dots,
  Fill,
  HANDOFF,
  INK,
  InkLine,
  LABEL_LEAD,
  Label,
  Numeral,
  OrangeLine,
  PolityFill,
  TOUR_RUNG,
  W_ORANGE,
  at,
  blueNoise,
  clamp01,
  dOf,
  easeInOutSine,
  hash,
  inColonies,
  lerp,
  makeCamTrack,
  dotR,
  menDrift,
  project,
  ramp,
  revealHalfPlane,
  smoothRoute,
  smoothstep,
  sw,
  type P2,
} from "./sugarShared";

// ---------------------------------------------------------------------------
// TIMING (story frames)
// ---------------------------------------------------------------------------
const N_COL = COLONIES.length; // 13
export const T = {
  flip0: 44, // first flip starts (the word "13" = s46)
  flipGap: 3,
  flipDur: 7,
  settleDelay: 3,
  settleDur: 10,
  edge: [57, 96] as [number, number],
  numeral: sw(46) - LABEL_LEAD,
  numeralOut: [84, 104] as [number, number],
  coast: [80, 100] as [number, number],
  hopA: [76, 144] as [number, number], // lands 6 f before "London" (s150)
  londonDot: [140, 149] as [number, number],
  london: sw(150) - LABEL_LEAD,
  // B
  hopB: [162, 210] as [number, number],
  rise: [sw(336), sw(358)] as [number, number], // "fought harder" s191-202
  wash: [sw(336), sw(352)] as [number, number], // the colonies' hatch drops to the wash under the men
  gather: [sw(344), sw(388)] as [number, number],
  pushIn: [207, 244] as [number, number],
  push: [sw(386), sw(392)] as [number, number], // "death" s238
  halt: [sw(392), sw(404)] as [number, number],
  pullBack: [sw(416), sw(456)] as [number, number], // "big theater" s275-280, still moving at s296
  // later acts
  londonOut: [552, 564] as [number, number], // after C's "Dutch" (s547): London's job is done
  tour: sw(956), // D's tour begins: AB's orange recedes to TOUR_RUNG over 12 f
};
/** AB's layers recede to TOUR_RUNG during D's tour (E takes the colonies + militia at its IN) */
const tourK = (s: number) => lerp(1, TOUR_RUNG, ramp(s, T.tour, T.tour + 12));
const flipStart = (i: number) => T.flip0 + i * T.flipGap;
const flipEnd = (i: number) => flipStart(i) + T.flipDur;
const settleStart = (i: number) => flipEnd(i) + T.settleDelay;
const ALL_SETTLED = settleStart(N_COL - 1) + T.settleDur;

// ---------------------------------------------------------------------------
// PLACES
// ---------------------------------------------------------------------------
const LONDON = at("london");
const NYC = at("newYork");
const COL_BOX = COLONIES.reduce(
  (b, c) => ({ x0: Math.min(b.x0, c.box.x0), y0: Math.min(b.y0, c.box.y0), x1: Math.max(b.x1, c.box.x1), y1: Math.max(b.y1, c.box.y1) }),
  { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity },
);
const COL_C: P2 = [(COL_BOX.x0 + COL_BOX.x1) / 2, (COL_BOX.y0 + COL_BOX.y1) / 2];
const NUMERAL_AT = project(-67.6, 36.2); // open sea off Cape Hatteras
/** the British Isles' centre (Mizen Head -10.5 .. Lowestoft 1.8 E, Lizard 49.95 .. Dunnet 58.65 N) */
const ISLES_C: P2 = (() => {
  const a = project(-10.5, 49.95);
  const b = project(1.8, 58.65);
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
})();
/** the beachhead: New York harbour (the Narrows, between Staten Island and Brooklyn) */
const ENC_C: P2 = project(-74.04, 40.63);
const SEABOARD_C = project(-77.2, 39.6);

// ---------------------------------------------------------------------------
// THE CAMERA (A + B)
// ---------------------------------------------------------------------------
export const camAB = makeCamTrack(
  [
    { p: COL_C, k: 0.95, sy: 700 }, // F0 A0 the seaboard
    { p: COL_C, k: 0.975, sy: 698 }, // F1 its creep
    { p: ISLES_C, k: 1.0, sy: 835 }, // F2 A4 Britain centred (GB + Ireland ~490 px wide)
    { p: ISLES_C, k: 1.03, sy: 835 }, // F3 its creep (runs into B)
    { p: NYC, k: 0.6, sx: 560, sy: 760 }, // F4 B1 the colonies: the convoy lands
    { p: ENC_C, k: 2.4, sx: 540, sy: 800 }, // F5 B2 the push in on New York
    { p: ENC_C, k: 2.5, sx: 540, sy: 800 }, // F6 its creep
    { p: SEABOARD_C, k: 0.72, sx: 540, sy: 800 }, // F7 B4 "big theater": the seaboard + interior
    { p: SEABOARD_C, k: 0.69, sx: 540, sy: 800 }, // F8 the pull-back eases on past B's end
  ],
  [
    { from: 0, to: 100 },
    { from: T.hopA[0], to: T.hopA[1], path: "vw", rho: 1.8, taper: 0.25 },
    { from: 136, to: 236 },
    { from: T.hopB[0], to: T.hopB[1], path: "vw", rho: 2.2, taper: 0.25 },
    { from: T.pushIn[0], to: T.pushIn[1] },
    { from: 240, to: 276 },
    { from: T.pullBack[0], to: T.pullBack[1], taper: 0.9 },
    { from: 300, to: 400 },
  ],
);

// ---------------------------------------------------------------------------
// A: the flips, the settle, the edge, the coast
// ---------------------------------------------------------------------------
const flipU = (i: number, s: number) => easeInOutSine((s - flipStart(i)) / T.flipDur);
const settleU = (i: number, s: number) => smoothstep((s - settleStart(i)) / T.settleDur);
const flipReveal = (i: number, s: number, k: number) => {
  const b = COLONIES[i].box;
  const pad = 6 / k;
  return revealHalfPlane([0, b.y0 - pad], [0, 1], (b.y1 - b.y0 + 2 * pad) * flipU(i, s));
};
/** the colonies' orange: hatch + deep fill; under the men (B) the hatch drops to the wash */
export const COLONY_ORANGE = { fill: 0.2, hatch: 0.85 };
export const COLONY_ORANGE_UNDER_MEN = { fill: 0.27, hatch: 0 };
const colonyOrange = (s: number) => {
  const u = ramp(s, T.wash[0], T.wash[1]);
  return { fill: lerp(COLONY_ORANGE.fill, COLONY_ORANGE_UNDER_MEN.fill, u), hatch: lerp(COLONY_ORANGE.hatch, COLONY_ORANGE_UNDER_MEN.hatch, u) };
};
const FLIP_WASH = 0.55;
/** a y-front sweeping the colonies north -> south (u 0..1): its world y */
const frontY = (u: number) => COL_BOX.y0 - 20 + (COL_BOX.y1 - COL_BOX.y0 + 40) * clamp01(u);
/** the horizontal band y0..y1 (svg d) */
const bandD = (y0: number, y1: number) => `M-1e5,${y0}L1e5,${y0}L1e5,${y1}L-1e5,${y1}Z`;
const COAST_D = COLONY_COAST.map((l) => dOf(l)).join("");
export const COLONY_WASH = { fill: 0.12, hatch: 0 };
/** Great Britain's cream: lifted (it is the subject of A's last frame) */
export const GB_WASH = { fill: 0.26, hatch: 0.62 };

// ---------------------------------------------------------------------------
// MEN: the dot size (>= 4 px in the close-ups)
// ---------------------------------------------------------------------------
export const menR = (k: number) => lerp(dotR(k), 4.2, smoothstep((k - 0.7) / 0.8));
const rng = (seed: number) => {
  let x = seed >>> 0;
  return () => {
    x = (x * 1664525 + 1013904223) >>> 0;
    return x / 4294967296;
  };
};
/** variable-density dart throwing: points p in box with inside(p), each at least sp(p)
 *  from every earlier one; up to n points, in throw order */
const darts = (n: number, box: { x0: number; y0: number; x1: number; y1: number }, inside: (p: P2) => boolean, sp: (p: P2) => number, seed: number, tries = 60000): P2[] => {
  const r = rng(seed);
  const pts: P2[] = [];
  for (let t = 0; t < tries && pts.length < n; t++) {
    const p: P2 = [box.x0 + r() * (box.x1 - box.x0), box.y0 + r() * (box.y1 - box.y0)];
    if (!inside(p)) continue;
    const d = sp(p);
    if (pts.every((q) => (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2 >= d * d)) pts.push(p);
  }
  return pts;
};
const rFromEnc = (p: P2) => Math.hypot(p[0] - ENC_C[0], p[1] - ENC_C[1]);
// assign starts to targets (2-opt on the squared distance)
const assign = (starts: P2[], targets: P2[]) => {
  const d2 = (a: P2, b: P2) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
  const asg = starts.map((_, i) => i);
  for (let pass = 0; pass < 30; pass++) {
    let improved = false;
    for (let i = 0; i < asg.length; i++)
      for (let j = i + 1; j < asg.length; j++) {
        const now = d2(starts[i], targets[asg[i]]) + d2(starts[j], targets[asg[j]]);
        const sw2 = d2(starts[i], targets[asg[j]]) + d2(starts[j], targets[asg[i]]);
        if (sw2 < now - 1e-6) {
          [asg[i], asg[j]] = [asg[j], asg[i]];
          improved = true;
        }
      }
    if (!improved) break;
  }
  return asg.map((a) => targets[a]);
};
const radial = (p: P2, d: number): P2 => {
  const dx = p[0] - ENC_C[0];
  const dy = p[1] - ENC_C[1];
  const l = Math.hypot(dx, dy) || 1;
  return [p[0] + (dx / l) * d, p[1] + (dy / l) * d];
};

// ---------------------------------------------------------------------------
// B: THE ARMY (convoy -> beachhead)
// ---------------------------------------------------------------------------
export const N_ARMY = 128; // Howe's ~32,000 at 1 dot = 250 men
/** the sea route Spithead -> down the Channel -> across -> Sandy Hook -> the Narrows */
export const SAIL_ROUTE = smoothRoute(
  [
    project(-1.1, 50.76), // Spithead
    project(-1.0, 50.6), // out past St Helens, east of the Isle of Wight
    project(-1.9, 50.3),
    project(-3.2, 50.05),
    project(-5.6, 49.3),
    project(-12, 48.1),
    project(-25, 46.4),
    project(-40, 43.6),
    project(-55, 41.2),
    project(-66, 40.0),
    project(-72.2, 40.25),
    project(-73.96, 40.45),
    project(-74.04, 40.58),
  ],
  4,
);
const ENC_R = 30; // world px: the beachhead's radius (~144 px across at the push-in, k 2.4)
/** the beachhead: 128 cream slots on the harbour's shores and anchorage (Staten Island,
 *  Brooklyn / western Long Island, Manhattan, the Jersey shore; blue noise) */
export const ENCLAVE: P2[] = (() => {
  const box = { x0: ENC_C[0] - ENC_R, y0: ENC_C[1] - ENC_R, x1: ENC_C[0] + ENC_R, y1: ENC_C[1] + ENC_R };
  const inside = (p: P2) => rFromEnc(p) <= ENC_R && (inColonies(p) || rFromEnc(p) <= 0.6 * ENC_R);
  return blueNoise(N_ARMY, box, inside, 1776, 40);
})();
// THE SAIL is slaved to the camera: the convoy's head keeps the same share of the
// camera's westward progress (so it never leaves the frame), arriving at the Narrows
// when the camera is LAND_AT of the way; then the body files into the harbour.
const BODY_L_LAND = 80; // the convoy's length entering the harbour, world px
const LAND_AT = 0.86;
const RUN_IN = 170; // world px the head runs on past the route's end (every dot gets in)
const CX0 = camAB(T.hopB[0]).cx;
const CX1 = camAB(T.hopB[1]).cx;
const camFrac = (s: number) => clamp01((CX0 - camAB(s).cx) / (CX0 - CX1));
const X_OF_S = (() => {
  const n = 2000;
  const xs: number[] = [];
  let m = Infinity;
  for (let i = 0; i <= n; i++) {
    m = Math.min(m, SAIL_ROUTE.pointAt((SAIL_ROUTE.len * i) / n)[0]);
    xs.push(m);
  }
  return xs;
})();
const sOfX = (x: number) => {
  const n = X_OF_S.length - 1;
  let lo = 0;
  let hi = n;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (X_OF_S[mid] > x) lo = mid;
    else hi = mid;
  }
  return (SAIL_ROUTE.len * hi) / n;
};
const X_START = SAIL_ROUTE.pointAt(0)[0];
const X_END = SAIL_ROUTE.pointAt(SAIL_ROUTE.len)[0];
/** the body's length (world px) on the AUTHORED camera (never the viewer's zoom, so the
 *  beachhead stays compact at every later zoom): >= 160 screen px at sea, closing up to
 *  BODY_L_LAND as it nears the Narrows, BODY_L_LAND once landed */
const bodyLAt = (s: number) => {
  if (s >= S_LAND) return BODY_L_LAND;
  return lerp(Math.max(BODY_L_LAND, 160 / camAB(s).k), BODY_L_LAND, smoothstep((headPhase(s) - 0.7) / 0.3));
};
const FORM = 12; // frames: the convoy forms at Spithead and files into the Channel
const headPhase = (s: number) => clamp01(camFrac(s) / LAND_AT);
const S_LAND = (() => {
  for (let s = T.hopB[0]; s < T.hopB[1] + 40; s += 0.25) if (headPhase(s) >= 1) return s;
  return T.hopB[1];
})();
const V_LAND = sOfX(X_END) - sOfX(lerp(X_START, X_END, headPhase(S_LAND - 1)));
const sHeadAt = (s: number) => {
  // the convoy forms: the whole body files out of Spithead into the Channel first
  const form = (bodyLAt(s) + 24) * smoothstep((s - T.hopB[0]) / FORM);
  if (s < S_LAND) return Math.max(form, sOfX(lerp(X_START, X_END, headPhase(s))));
  const tau = RUN_IN / Math.max(6, V_LAND);
  return SAIL_ROUTE.len + RUN_IN * (1 - Math.exp(-(s - S_LAND) / tau));
};
/** THE CONVOY'S BODY: 128 blue-noise points in a unit ellipse (u along: -1 tail ..
 *  +1 head; v across), head first - a rounded compact body, never a grid */
const BODY_A = 0.42;
const BODY: P2[] = blueNoise(N_ARMY, { x0: -1, y0: -BODY_A, x1: 1, y1: BODY_A }, ([u, v]) => u * u + (v / BODY_A) ** 2 <= 1, 1776 * 3, 30).sort((a, b) => b[0] - a[0]);
const bodySpacing = (L: number) => Math.sqrt((Math.PI * (L / 2) * ((L * BODY_A) / 2)) / N_ARMY);
const bodyAt = (sHead: number, L: number) =>
  BODY.map(([u, v]) => {
    const s = sHead - ((1 - u) * L) / 2;
    const sc = Math.max(0, s);
    const [x, y] = SAIL_ROUTE.pointAt(sc);
    const a = SAIL_ROUTE.pointAt(sc - L / 4);
    const b = SAIL_ROUTE.pointAt(sc + L / 4);
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const [tx, ty] = [(b[0] - a[0]) / l, (b[1] - a[1]) / l];
    // the body squeezes into a narrow stream as it comes out of Spithead (never over England / France)
    const lat = ((v * L) / 2) * smoothstep(sc / (L * 0.6));
    return { x: x - ty * lat, y: y + tx * lat, s, op: s <= 0 ? 0 : clamp01(s / 24) };
  });
const COL_END = bodyAt(SAIL_ROUTE.len, BODY_L_LAND).map((d) => [d.x, d.y] as P2);
export const ENC_SLOT: P2[] = assign(COL_END, ENCLAVE);
/** the push on "death ground" (world px, outward): the cream pushes out once (~10 px on
 *  screen) and is stopped by the orange, which gives ~2 px and closes again */
const pushU = (s: number) => {
  const out = easeInOutSine((s - T.push[0]) / (T.push[1] - T.push[0]));
  const back = easeInOutSine((s - T.halt[0]) / (T.halt[1] - T.halt[0]));
  return { cream: 4.2 * out - 2.6 * back, orange: 0.9 * smoothstep((s - T.push[0] - 3) / 3) - 0.9 * back };
};
/** the army at story frame s (world px; index-stable). Any s >= 162. */
export const armyAt = (s: number, k: number): Dot[] => {
  const sh = sHeadAt(s);
  const L = bodyLAt(s);
  const pu = pushU(s);
  const rSea = Math.min(menR(k), Math.max(2.6, 0.42 * bodySpacing(L) * k));
  const rEnc = Math.min(menR(k), Math.max(1.6, 0.5 * 3.9 * k));
  return bodyAt(sh, L).map((d, j) => {
    // the body point clamps at the route's end; blend to the beachhead slot
    const w = smoothstep((d.s - (SAIL_ROUTE.len - 40)) / 60);
    const slot = radial(ENC_SLOT[j], pu.cream * (0.5 + 0.5 * (rFromEnc(ENC_SLOT[j]) / ENC_R)));
    const dr = menDrift(j, s, k, 0.7 * w);
    return { x: lerp(d.x, slot[0], w) + dr[0], y: lerp(d.y, slot[1], w) + dr[1], t: 0, op: d.op, r: lerp(rSea, rEnc, w) };
  });
};

// ---------------------------------------------------------------------------
// B: THE MILITIA. They rise across the colonies on "fought harder"; most of them
// then GATHER on the beachhead into a dense blue-noise band hugging it (thick at
// the front, thinning inland); a sparse scatter stays out across the colonies.
// ---------------------------------------------------------------------------
const BAND_IN = ENC_R + 3.6;
const BAND_OUT = ENC_R + 105;
/** the band: a thick front (spacing 3.9 world px = ~9.4 px at the push-in, 20 world px
 *  deep) hugging the beachhead, thinning to ~16 inland */
const BAND_FRONT = 20;
const bandSp = (p: P2) => 3.9 + 0.14 * Math.max(0, rFromEnc(p) - BAND_IN - BAND_FRONT);
export const BAND: P2[] = darts(
  520,
  { x0: ENC_C[0] - BAND_OUT, y0: ENC_C[1] - BAND_OUT, x1: ENC_C[0] + BAND_OUT, y1: ENC_C[1] + BAND_OUT },
  (p) => {
    const r = rFromEnc(p);
    return r >= BAND_IN && r <= BAND_OUT && inColonies(p);
  },
  bandSp,
  1776 * 7,
  260000,
).sort((a, b) => rFromEnc(a) - rFromEnc(b));
/** where the gatherers rise: across the colonies within ~5-12 deg of New York */
const ORIGINS: P2[] = blueNoise(
  BAND.length,
  COL_BOX,
  (p) => {
    const r = rFromEnc(p);
    return inColonies(p) && r > BAND_OUT + 10 && r < 520;
  },
  1775 * 3,
  20,
);
const ORIGIN_OF = assign(BAND, ORIGINS);
/** the sparse scatter that stays out across all 13 */
export const SCATTER: P2[] = blueNoise(110, COL_BOX, (p) => inColonies(p) && rFromEnc(p) > BAND_OUT + 30, 1775, 16);
const N_BAND = BAND.length;
/** the militia at story frame s (world px; index-stable: band men first, then the scatter) */
export const militiaAt = (s: number, k: number): Dot[] => {
  const pu = pushU(s);
  const R = menR(k);
  const span = T.rise[1] - T.rise[0] - 8;
  const out: Dot[] = [];
  for (let i = 0; i < N_BAND; i++) {
    const o = ORIGIN_OF[i];
    const t0 = T.rise[0] + span * hash(i, 51);
    const u = smoothstep((s - t0) / 8);
    if (u <= 0) {
      out.push({ x: o[0], y: o[1], op: 0, t: 1 });
      continue;
    }
    // front men first: the band fills from the beachhead outward
    const fr = i / N_BAND;
    const t1 = T.gather[0] + 14 * fr + 6 * hash(i, 52);
    const dur = 26 + 8 * hash(i, 53);
    const w = easeInOutSine((s - Math.max(t1, t0 + 4)) / dur);
    let q: P2 = [lerp(o[0], BAND[i][0], w), lerp(o[1], BAND[i][1], w)];
    q = radial(q, pu.orange * (1 - fr));
    const dr = menDrift(i + 500, s, k, 0.7 * u);
    out.push({ x: q[0] + dr[0], y: q[1] + dr[1] + (1 - u) * (7 / k), op: u, t: 1, r: R });
  }
  SCATTER.forEach((p, j) => {
    const t0 = T.rise[0] + span * hash(j, 61);
    const u = smoothstep((s - t0) / 8);
    const dr = menDrift(j + 900, s, k, 0.7 * u);
    out.push({ x: p[0] + dr[0], y: p[1] + dr[1] + (1 - u) * (7 / k), op: u, t: 1, r: R });
  });
  return out;
};

// ---------------------------------------------------------------------------
// THE LAYERS
// ---------------------------------------------------------------------------
export const ABUnder: React.FC<ActProps> = ({ s, cam, uid = "" }) => {
  const k = cam.k;
  const co = colonyOrange(s);
  return (
    <>
      {/* Great Britain: cream (until C takes it) */}
      {s < HANDOFF.gbWash ? <PolityFill id={`abGb${uid}`} group="gb" side="cream" cam={cam} fill={GB_WASH.fill} hatch={GB_WASH.hatch} /> : null}
      {/* Britain's faint wash over her colonies (until E withdraws it) */}
      {s < HANDOFF.colonyWash ? <Fill id={`abCw${uid}`} d={COLONIES_D} cam={cam} side="cream" fill={COLONY_WASH.fill} hatch={COLONY_WASH.hatch} /> : null}
      {/* the 13 go orange */}
      {s < ALL_SETTLED
        ? COLONIES.map((c, i) => {
            if (s < flipStart(i)) return null;
            const su = settleU(i, s);
            const flipping = s < flipEnd(i);
            return (
              <Fill
                key={c.key}
                id={`abF${i}${uid}`}
                d={c.d}
                cam={cam}
                side="orange"
                fill={lerp(FLIP_WASH, COLONY_ORANGE.fill, su)}
                hatch={COLONY_ORANGE.hatch * su}
                reveal={flipping ? flipReveal(i, s, k) : undefined}
                feather={3}
              />
            );
          })
        : s < HANDOFF.colonies
          ? <Fill id={`abFall${uid}`} d={COLONIES_D} cam={cam} side="orange" fill={co.fill} hatch={co.hatch} opacity={tourK(s)} />
          : null}
    </>
  );
};
export const ABOver: React.FC<ActProps> = ({ s, cam, uid = "" }) => {
  const edgeU = (s - T.edge[0]) / (T.edge[1] - T.edge[0]);
  const coastU = (s - T.coast[0]) / (T.coast[1] - T.coast[0]);
  const lonDot = smoothstep((s - T.londonDot[0]) / (T.londonDot[1] - T.londonDot[0]));
  const showCol = s < HANDOFF.colonies;
  const army = s >= T.hopB[0] + 1 && s < HANDOFF.enclave ? armyAt(s, cam.k) : [];
  const mil = s >= T.rise[0] && s < HANDOFF.militia ? militiaAt(s, cam.k) : [];
  const tk = tourK(s);
  const lon = lonDot * (1 - ramp(s, T.londonOut[0], T.londonOut[1]));
  return (
    <>
      {/* the colonies' borders: fine cream between them; their land edge cream -> orange dashed */}
      {showCol ? <InkLine d={COLONY_INNER_D} cam={cam} width={1.3} opacity={0.62 * tk} /> : null}
      {edgeU < 1 ? (
        <g>
          <defs>
            <clipPath id={`abEdgeS${uid}`}>
              <path d={bandD(frontY(edgeU), 1e5)} />
            </clipPath>
            <clipPath id={`abEdgeN${uid}`}>
              <path d={bandD(-1e5, frontY(edgeU))} />
            </clipPath>
          </defs>
          {/* the cream edge where the orange has not reached yet, the orange dashed edge behind the front */}
          <g clipPath={`url(#abEdgeS${uid})`}>
            <InkLine d={COLONY_OUTER_D} cam={cam} width={1.3} opacity={0.62} />
          </g>
          {edgeU > 0 && showCol ? (
            <g clipPath={`url(#abEdgeN${uid})`}>
              <OrangeLine d={COLONY_OUTER_D} cam={cam} dash={0} width={W_ORANGE} />
            </g>
          ) : null}
        </g>
      ) : showCol ? (
        <OrangeLine d={COLONY_OUTER_D} cam={cam} dash={0} width={W_ORANGE} opacity={tk} />
      ) : null}
      {/* the limit of their aims: an orange stroke along their own coast */}
      {coastU > 0 && showCol ? (
        coastU < 1 ? (
          <g>
            <defs>
              <clipPath id={`abCoast${uid}`}>
                <path d={bandD(-1e5, frontY(easeInOutSine(coastU)))} />
              </clipPath>
            </defs>
            <g clipPath={`url(#abCoast${uid})`}>
              <OrangeLine d={COAST_D} cam={cam} width={W_ORANGE} />
            </g>
          </g>
        ) : (
          <OrangeLine d={COAST_D} cam={cam} width={W_ORANGE} opacity={tk} />
        )
      ) : null}
      {/* London */}
      <CityDot x={LONDON[0]} y={LONDON[1]} cam={cam} r={6.5} opacity={lon} />
      {/* the men */}
      {mil.length ? <Dots dots={mil} cam={cam} opacity={tk} /> : null}
      {army.length ? <Dots dots={army} cam={cam} /> : null}
    </>
  );
};
export const ABLabels: React.FC<ActProps> = ({ s, cam }) => {
  const nOut = 1 - smoothstep((s - T.numeralOut[0]) / (T.numeralOut[1] - T.numeralOut[0]));
  const lonOut = 1 - ramp(s, T.londonOut[0], T.londonOut[1]);
  return (
    <>
      {nOut > 0.002 ? <Numeral text="13" x={NUMERAL_AT[0]} y={NUMERAL_AT[1]} cam={cam} frame={s} f0={T.numeral} size={262} opacity={nOut} /> : null}
      {lonOut > 0.002 ? <Label text="London" font="roman" x={LONDON[0]} y={LONDON[1]} cam={cam} frame={s} f0={T.london} size={42} dy={-22} opacity={lonOut} /> : null}
    </>
  );
};

/** ACT AB for sugarScene */
export const ACT_AB: Act = { name: "AB", cam: camAB, Under: ABUnder, Over: ABOver, Labels: ABLabels };

// ---------------------------------------------------------------------------
// THE STATE AT B'S END (s = CUT_S.B.s1 = 296), for the acts that follow
// ---------------------------------------------------------------------------
const S_END = CUT_S.B.s1;
export const AB_END = {
  s: S_END,
  /** the camera on B's last frame (no sway) and where AB's track comes to rest
   *  (the pull-back eases on to s400: extendCamTrack(camAB, ...) carries it on) */
  cam: camAB(S_END),
  rest: camAB.rest,
  /** the British beachhead at New York: its centre, radius (world px) and the 128 dots'
   *  rest positions after the halt (index-stable; draw with Dots t 0, r menR(k), and
   *  add menDrift(i, s, k, 0.7) to keep them alive) */
  enclave: { c: ENC_C, r: ENC_R, dots: ENC_SLOT.map((p) => radial(p, 1.6 * (0.5 + 0.5 * (rFromEnc(p) / ENC_R)))) as P2[] },
  /** THE MILITIA (handed to E at HANDOFF.militia = E's first frame): militiaAt(s, k) gives
   *  the exact dots AB would draw at any s (index-stable: BAND.length band men nearest the
   *  beachhead first, then SCATTER.length scattered; drift = menDrift(i + 500 | j + 900,
   *  s, k, 0.7)); rest = their positions without the drift. Draw with Dots t 1, r menR(k). */
  militia: {
    at: (s: number, k: number) => militiaAt(s, k),
    rest: [...BAND, ...SCATTER] as P2[],
    nBand: BAND.length,
    nScatter: SCATTER.length,
  },
  /** the colonies' orange at B's end: orange Fill on COLONIES_D, fill 0.27, hatch 0 (the
   *  hatch dropped to the wash under the militia); Britain's wash over them (cream
   *  Fill, fill 0.12, no hatch) */
  colonyOrange: COLONY_ORANGE_UNDER_MEN,
  colonyWash: COLONY_WASH,
  /** Great Britain at B's end: cream Fill fill 0.26, hatch 0.62 */
  gbWash: GB_WASH,
  /** colours used */
  cream: INK,
  orange: ACCENT,
};
