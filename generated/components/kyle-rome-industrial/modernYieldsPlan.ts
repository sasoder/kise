// ---------------------------------------------------------------------------
// modernYieldsPlan: cut 20 ModernYieldsMissing (kyle-rome-industrial), pure data and maths: the camera (one even
// lateral dolly along the near edge of row B of the shared farm, ./farmPlan), the four stations, the ghosts' outlines
// (cast units, a man ~312 = 1.75 m) and their timings. The drawing is ./ModernYieldsMissing.tsx.
// ---------------------------------------------------------------------------
import { OX_TEAM, oxTeamX, type FarmEye, type Farmer } from "./farmPlan";

export type P2 = [number, number];
const c01 = (v: number) => Math.max(0, Math.min(1, v));
export const smooth = (v: number) => {
  const u = c01(v);
  return u * u * (3 - 2 * u);
};

/** the world clock: farm frame = ours + 158, so the world's ox team stands under the opening (centre X ~420 at f28) */
export const WORLD_F = 158;
export const worldFrame = (f: number) => f + WORLD_F;

// ===================================================================================================================
// THE CAMERA (Rev 2, the user on Rev 1's holds: "a lot better now but almost a bit too rigid. Instead of holding on
// each part, ease in and ease out, to still keep the movement while giving time to look at each part"): ONE
// continuous lateral path that never stops until the final settle. The eye 1.7 m up, looking into the valley; the
// stations on one line at Z ~2900, their bases near y 1050 as the camera passes them.
//   At each station the speed sinks to a slow drift (~2.8 units/frame, ~5 px/frame) at a trough frame near its word:
//     tractor f28 (drawn f0-34, "traction" f39), fertiliser f91 (sack drawn f68-92, fan open by f98, "fertilizers"
//     f96), wheat f162 (risen f138-160, "yields" f163), harvest f230 (ghost heap f212-255, "productive" f257).
//   Between troughs the speed rises and falls on one raised cosine (sin^2), sized so the path covers the distance
//   between stations; peaks stay under ~40 px/frame at the stations because the eye also backs out (up to 170
//   units, ~19 %) on the same sin^2 and is fully back in at every trough.
//   Before f28 it drifts at the trough speed; after f230 the drift eases to rest by f262 (the only stop).
// The eye X is the integral of that speed (a table at load).
// ===================================================================================================================
export const EYE = { H: 300, Z: 2160, F: 1300, hy: 523 };
/** the stations' trough frames and the eye X there */
export const TROUGHS: [number, number][] = [
  [28, 400],
  [91, 1372],
  [162, 2440],
  [230, 3352],
];
export const PATH = { vMin: 2.8, settle: 32, dollyOut: 170 };
/** which transition a frame is in (i = from trough i to i + 1) and its progress s, or null */
const legAt = (f: number): { i: number; s: number } | null => {
  for (let i = 0; i < TROUGHS.length - 1; i++) {
    const a = TROUGHS[i][0];
    const b = TROUGHS[i + 1][0];
    if (f >= a && f < b) return { i, s: (f - a) / (b - a) };
  }
  return null;
};
/** the peak speed of transition i, so that it covers its distance: D = T (vMin + vPk) / 2 */
const legPeak = (i: number) => {
  const [a, xa] = TROUGHS[i];
  const [b, xb] = TROUGHS[i + 1];
  return (2 * (xb - xa)) / (b - a) - PATH.vMin;
};
/** the eye's speed (units/frame) at a frame */
export const camSpeed = (f: number) => {
  const last = TROUGHS[TROUGHS.length - 1][0];
  if (f < TROUGHS[0][0]) return PATH.vMin;
  if (f >= last) return PATH.vMin * (1 - smooth((f - last) / PATH.settle));
  const m = legAt(f) as { i: number; s: number };
  const k = Math.sin(Math.PI * m.s) ** 2;
  return PATH.vMin + (legPeak(m.i) - PATH.vMin) * k;
};
const X_TABLE: number[] = (() => {
  // integrate from the first trough both ways so X(28) is exactly its key
  const out: number[] = new Array(301).fill(0);
  const f0 = TROUGHS[0][0];
  out[f0] = TROUGHS[0][1];
  for (let f = f0; f < 300; f++) {
    let acc = 0;
    for (let i = 0; i < 16; i++) acc += camSpeed(f + (i + 0.5) / 16) / 16;
    out[f + 1] = out[f] + acc;
  }
  for (let f = f0; f > 0; f--) out[f - 1] = out[f] - PATH.vMin;
  return out;
})();
export const camX = (f: number) => {
  const g = Math.max(0, Math.min(X_TABLE.length - 2, f));
  const i = Math.floor(g);
  return X_TABLE[i] + (X_TABLE[i + 1] - X_TABLE[i]) * (g - i);
};
/** the eye's depth: backing out between stations on the same sin^2, fully in at every trough */
export const camZ = (f: number) => {
  const m = legAt(f);
  if (!m) return EYE.Z;
  return EYE.Z - PATH.dollyOut * Math.sin(Math.PI * m.s) ** 2;
};
export const eyeAt = (f: number): FarmEye => ({ X: camX(f), H: EYE.H, Z: camZ(f), F: EYE.F, hy: EYE.hy });
/** screen px per world unit at depth Z in a hold (the dash sizes are fixed by it, so they never change) */
export const scaleAtZ = (Z: number) => EYE.F / (Z - EYE.Z);

// ===================================================================================================================
// THE GHOST STROKE (the director's review): a bold dashed orange line, ~8.5 px at the near stations, round caps, dash
// ~3x the stroke, gap ~2x, a soft glow; dashes laid in world units so they never crawl
// ===================================================================================================================
export const STROKE_PX = 8.5;
/** dash and gap (world units) for a ghost standing at depth Z, stroke px w */
export const dashFor = (Z: number, w = STROKE_PX): [number, number] => [(3 * w) / scaleAtZ(Z), (2 * w) / scaleAtZ(Z)];

// ===================================================================================================================
// STATION 1, "mechanized traction": the world's ox team (OX_TEAM, Z 2900 / far ox 3160, walking to screen left) and
// over it a dashed TRACTOR (big rear wheel, small front wheel, bonnet, cab, exhaust stack), 0.72x life so it stands
// about as tall as the oxen, travelling with them. Its pen glides in from off the left edge, draws f0 -> f36
// ("traction" f39-57).
// ===================================================================================================================
export const TRACTOR = { Z: 3030, dx: 390, draw: [0, 34] as [number, number], R: 135, Rf: 80, s: 0.72 };
/** the tractor's rear-axle X at a frame (moves with the oxen) */
export const tractorX = (f: number) => oxTeamX(worldFrame(f)) - OX_TEAM.dir * TRACTOR.dx;
export const arc = (c: P2, R: number, a0: number, a1: number, n: number): P2[] => {
  const out: P2[] = [];
  for (let i = 0; i <= n; i++) {
    const a = ((a0 + (a1 - a0) * (i / n)) * Math.PI) / 180;
    out.push([c[0] + R * Math.cos(a), c[1] - R * Math.sin(a)]);
  }
  return out;
};
/** outline strokes, local (x forward = the way it drives, y up -), in drawing order (front wheel first) */
export const tractorStrokes = (roll: number): P2[][] => {
  const rw: P2 = [0, -TRACTOR.R];
  const fw: P2 = [430, -TRACTOR.Rf];
  const rollDeg = (roll * 180) / Math.PI;
  return [
    // the small front wheel and its hub
    arc(fw, TRACTOR.Rf, 90 + rollDeg, 450 + rollDeg, 40),
    arc(fw, 26, 90 + rollDeg, 450 + rollDeg, 16),
    // the body: the arch over the front wheel, the bonnet to the cab, the cab, down to the rear fender
    [
      ...arc(fw, 98, 168, 12, 14),
      [538, -168],
      [534, -250],
      [500, -274],
      [122, -292],
      [136, -440],
      [158, -452],
      [150, -467],
      [-118, -467],
      [-126, -452],
      [-106, -440],
      [-120, -258],
      [-150, -160],
      ...arc(rw, 155, 174, 6, 22),
      [300, -150],
      [335, -105],
    ],
    // the exhaust stack
    [
      [236, -282],
      [236, -508],
      [254, -516],
      [254, -282],
    ],
    // the big rear wheel and its hub
    arc(rw, TRACTOR.R, 90 + rollDeg, 450 + rollDeg, 56),
    arc(rw, 44, 90 + rollDeg, 450 + rollDeg, 22),
  ];
};

// ===================================================================================================================
// STATION 2, "synthetic fertilizers": a farmer on the fresh furrows flinging manure from a basket by hand (cast figure,
// facing right), and beside him the dashed FERTILISER SACK (fat, tied neck, two stencil bars) and a SPINNER whose
// fan of granules sprays out behind it. One pen: in from the right, the sack f74 -> f98, the spinner to f106; the fan
// opens f103 -> f114 and keeps streaming.
// ===================================================================================================================
export const MANURE_MAN: Farmer = { id: "c20man", kind: "freeman", variant: 1, X: 1250, Z: 2870, dir: 1, role: "stand", ph: 0, cyc: 40, tunic: "#9A9070" };
export const FLING = { cyc: 40, release: 0.58, flight: 13 };
export const SACK = { X: 1435, Z: 2930, draw: [68, 92] as [number, number] };
export const SPINNER = { X: 1555, Z: 2990, h: 66, r: 38, open: [86, 92] as [number, number] };
export const sackStrokes = (): P2[][] => [
  // the fat sack, from its right foot round to close there; the neck gathered and tied, a tuft above the tie
  [
    [72, 0],
    [90, -40],
    [96, -100],
    [84, -150],
    [50, -180],
    [22, -190],
    [18, -204],
    [28, -220],
    [8, -232],
    [0, -222],
    [-8, -232],
    [-28, -220],
    [-18, -204],
    [-22, -190],
    [-50, -180],
    [-84, -150],
    [-96, -100],
    [-90, -40],
    [-72, 0],
    [0, 8],
    [72, 0],
  ],
  // the tie round the neck
  [
    [-21, -197],
    [21, -197],
  ],
  // the two stencil bars on its belly (no readable text)
  [
    [-50, -118],
    [50, -118],
  ],
  [
    [-50, -82],
    [34, -82],
  ],
];
/** the spinner: a short post and a flat disc (the strokes in 3D are built in the component) */
/** the fan: granule paths from the spinner's rim, outward in ground directions phi (deg; 0 = +X, 90 = into the
 *  picture), landing at radius R; height h(t) = h0 (1 - t) + apex 4 t (1 - t) */
export const FAN = { phi0: -10, phi1: 190, rays: 13, R: 640, apex: 70, speed: 1 / 26, perRay: 7 };

// ===================================================================================================================
// STATION 3, "green revolution yields": the world's Roman wheat in B3 (sparse tufts, small ears; its reapers at the
// left edge) and over it a dashed patch of modern wheat. ACCURACY (the director): the Green Revolution wheats were
// semi-dwarfs, so the ghost stands a little SHORTER than the Roman wheat (~0.9x); the yield reads from density (about
// 3x the stalks: pairs every 21 units in three even rows 80 apart) and big heavy drooping ears. The plants rise one by
// one under a sweeping pen that glides in from the left, f138 -> f172 ("yields" f163-178).
// ===================================================================================================================
export const MODERN_WHEAT = { x0: 2180, x1: 2700, step: 21, rows: [2770, 2850, 2930], h: 108, ear: 32, earW: 7, sweep: [138, 160] as [number, number], grow: 8, lead: 420 };

// ===================================================================================================================
// STATION 4, "made agriculture stupendously productive": a clearing at the right of B3 (the world's B3 wheat is
// redrawn without it; the standing wheat in front fills the foot of the frame): a reaper cutting its left edge, the
// Roman day's harvest beside him (a small grain heap on its cloth, ~130 px) and the dashed modern heap: a low broad
// grain mound in the same profile (base ~2.35x its height), ~3x higher (~390 px, ~915 px wide) with grain marks on it, both bases near y 1000-1050. Its pen glides in from the right, draws
// the near base arc from the right foot, then the mound over the top, closing at the right foot f210 -> f254
// ("productive" f257-268).
// ===================================================================================================================
export const LAST_REAPER: Farmer = { id: "c20rp", kind: "slave", variant: 2, X: 3300, Z: 2900, dir: -1, role: "reap", ph: 0.3, cyc: 44, sheaves: 0 };
export const ROMAN_HEAP = { X: 3390, Z: 2905, w: 62, h: 74 };
/** the reaped clearing in B3: no standing wheat right of X = x0 + slope (Z - 2000), between z0 (ragged toward us) and
 *  z1 */
export const REAPED = { x0: 3205, slope: 0.05, z0: 2600, z1: 3220, x1: 3900 };
export const BIG_HEAP = { X: 3434, Z: 3020, w: 303, h: 258, draw: [212, 255] as [number, number] };
export const bigHeapMound = (): P2[] => {
  const { w, h } = BIG_HEAP;
  // a broad grain mound in the Roman heap's own profile (farmWorld heapShapes: ~0.6 h at 0.55 w, a gently rounded
  // crown), scaled up: a low broad mound, base ~2.35x its height; from the right foot to the left
  const out: P2[] = [];
  const N = 44;
  for (let i = 0; i <= N; i++) {
    const x = w - (2 * w * i) / N;
    const u = Math.abs(x) / w;
    out.push([x, -h * Math.pow(Math.max(0, 1 - Math.pow(u, 1.6)), 1.1)]);
  }
  return out;
};

// ===================================================================================================================
// WORLD FARMERS HIDDEN: B3's near reapers and gleaner would stand in the caption bands at our depth; B2b's team and
// binder clutter the ground behind the ghost tractor
// ===================================================================================================================
export const HIDE = ["B3r0", "B3r1", "B3g", "B2br0", "B2br1", "B2br2", "B2br3", "B2br4", "B2bb"];
