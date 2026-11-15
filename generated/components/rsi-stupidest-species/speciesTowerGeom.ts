// ---------------------------------------------------------------------------
// speciesTowerGeom: the numbers and the pure geometry of THE SPECIES TOWER (rsi-stupidest-species, shared world W1).
// The drawing is speciesTower.tsx; its header is the API. Everything here is pure (no React).
//
// UNITS: the cast's (a man ~312 = 1.75 m), U = 178 per metre. X across, Y height with the floor Y = 0 and up - Y,
// Z depth behind the front plane (londonDepth). Heights in the constants are METRES above the floor (h), radii metres;
// m(h) turns metres into units, hy(h) = -m(h) is the world Y of a height.
// ---------------------------------------------------------------------------
import { pchip, perspective, type Cam, type DepthOpts, type P2, type Persp } from "../kits/dwarkesh-3d/dwarkesh3d";

export const U = 178;
export const m = (v: number) => v * U;
export const hy = (h: number) => -h * U;
export const FPS = 24000 / 1001;

// ===================================================================================================================
// THE TOWER (metres)
// ===================================================================================================================
/** a drum of the tower: heights h0 < h1 (m), `out` = metres added to the shaft's radius at that height */
export type DrumSpec = { id: string; h0: number; h1: number; out: number; kind: "shaft" | "ring" };
export const TOWER = {
  /** the shaft's radius at the floor (m) and the radius it loses per metre of height (a gentle taper) */
  R0: 12.0,
  taper: 0.02,
  /** the axis */
  X: 0,
  /** world Z (units) of the shaft's front face at the floor; the axis sits R0 behind it */
  zFront: 600,
  /** the plinth (two steps) */
  plinth: [
    { h0: 0, h1: 0.35, out: 1.1 },
    { h0: 0.35, h1: 0.95, out: 0.6 },
  ],
  lowerShaft: { h0: 0.95, h1: 3.75 },
  /** THE TECHNOLOGICAL-CIVILIZATION LINE: a fillet and the moulded band; its top (cornY) is the human's sill */
  cornice: { fillet: { h0: 3.75, h1: 3.95, out: 0.35 }, band: { h0: 3.95, h1: 4.5, out: 0.8 } },
  cornY: 4.5,
  upperShaft: { h0: 4.5, h1: 12.6 },
  /** THE SMARTEST POSSIBLE BIOLOGICAL SPECIES: necking, block, cap; capitalY = the top of the stone */
  capital: { necking: { h0: 12.6, h1: 13.0, out: 0.4 }, block: { h0: 13.0, h1: 15.0, out: 1.15 }, cap: { h0: 15.0, h1: 15.6, out: 1.45 } },
  capitalY: 15.6,
  /** the DASHED ORANGE continuation (same radius as the shaft, the taper running on) and its course rings (m) */
  dashCourses: [20.0, 24.4, 28.8],
  /** THE SUPERINTELLIGENCE CEILING: a dashed crowning band, `out` m wider than the shaft; ceilY = its top */
  ceil: { h0: 33.6, h1: 35, out: 1.8 },
  ceilY: 35,
  /** stone courses (m) and blocks per course on the front half */
  course: 1.15,
  blocksHalf: 15,
};
/** the shaft's radius at height h (m) */
export const Rm = (h: number) => TOWER.R0 - TOWER.taper * h;
/** the axis' depth (units) */
export const ZC = TOWER.zFront + m(TOWER.R0);

export const DRUMS: DrumSpec[] = [
  { id: "plinth0", ...TOWER.plinth[0], kind: "ring" },
  { id: "plinth1", ...TOWER.plinth[1], kind: "ring" },
  { id: "lower", ...TOWER.lowerShaft, out: 0, kind: "shaft" },
  { id: "fillet", ...TOWER.cornice.fillet, kind: "ring" },
  { id: "cornice", ...TOWER.cornice.band, kind: "ring" },
  { id: "upper", ...TOWER.upperShaft, out: 0, kind: "shaft" },
  { id: "necking", ...TOWER.capital.necking, kind: "ring" },
  { id: "capBlock", ...TOWER.capital.block, kind: "ring" },
  { id: "capCap", ...TOWER.capital.cap, kind: "ring" },
];

/** a 3D point on the tower: angle phi (rad; PI/2 = the front, facing the camera; > PI/2 = to the left), height h (m),
 *  `out` metres outside the shaft's surface (negative = inside: a niche's back wall) */
export const towerPt = (phi: number, h: number, out = 0): [number, number, number] => {
  const r = m(Rm(h) + out);
  return [TOWER.X + r * Math.cos(phi), hy(h), ZC - r * Math.sin(phi)];
};
/** the shaft's front face depth (units) at height h */
export const zFrontAt = (h: number) => ZC - m(Rm(h));

// ===================================================================================================================
// THE NICHES (arched alcoves; u across in m, + = screen right; v up from the sill in m)
// ===================================================================================================================
export type NicheLight = "warm" | "cream" | "none";
export type NicheId = "chimp" | "human" | "grand" | "l0" | "l1" | "l2" | "l3" | "l4" | "l5" | "r0" | "r1" | "r2" | "r3" | "r4" | "r5";
export type Niche = { id: NicheId; ang: number; sill: number; h: number; w: number; depth: number; light: NicheLight; shaft: "lower" | "upper" };
const FLANK = 30; // deg either side of the front (the inner flanking columns)
const FLANK_OUT = 58; // the outer columns
const flankSills = [1.2, 5.4, 9.4];
export const NICHES: Niche[] = [
  // the centre column, low to high
  { id: "chimp", ang: 90, sill: 1.75, h: 1.85, w: 1.75, depth: 1.0, light: "none", shaft: "lower" },
  { id: "human", ang: 90, sill: TOWER.cornY, h: 4.6, w: 2.7, depth: 1.5, light: "warm", shaft: "upper" },
  { id: "grand", ang: 90, sill: 9.75, h: 2.55, w: 2.0, depth: 1.0, light: "cream", shaft: "upper" },
  // the flanking columns (all empty), staggered against the centre
  ...[FLANK, FLANK_OUT].flatMap((a, j) =>
    flankSills.flatMap((s, i): Niche[] => [
      { id: `l${i + 3 * j}` as NicheId, ang: 90 + a, sill: s, h: 2.4, w: 1.6, depth: 0.8, light: "none", shaft: s < TOWER.cornY ? "lower" : "upper" },
      { id: `r${i + 3 * j}` as NicheId, ang: 90 - a, sill: s, h: 2.4, w: 1.6, depth: 0.8, light: "none", shaft: s < TOWER.cornY ? "lower" : "upper" },
    ]),
  ),
];
export const nicheOf = (id: NicheId) => NICHES.find((n) => n.id === id) as Niche;
const deg = (d: number) => (d * Math.PI) / 180;
/** a niche-local point (u across, v up, m) at `inset` m in from the face, as a 3D point */
export const nichePt = (n: Niche, u: number, v: number, inset = 0): [number, number, number] => {
  const h = n.sill + v;
  return towerPt(deg(n.ang) - u / Rm(h), h, -inset);
};
/** the arch outline in niche-local (u, v): left jamb up, the semicircle over, the right jamb down (open at the sill) */
export const archUV = (n: Niche, N = 28): [number, number][] => {
  const r = n.w / 2;
  const spring = n.h - r;
  const pts: [number, number][] = [[-r, 0], [-r, spring]];
  for (let i = 1; i < N; i++) {
    const a = Math.PI - (Math.PI * i) / N;
    pts.push([r * Math.cos(a), spring + r * Math.sin(a)]);
  }
  pts.push([r, spring], [r, 0]);
  return pts;
};
/** where a figure stands in a niche: the centre of its floor, `inset` m in from the face (u across) */
export type SillAnchor = { X: number; Y: number; Z: number };
export const sillAnchor = (id: NicheId, u = 0, inset?: number): SillAnchor => {
  const n = nicheOf(id);
  const [X, Y, Z] = nichePt(n, u, 0, inset ?? Math.min(0.55, n.depth * 0.5));
  return { X, Y, Z };
};
/** the human stands here (his feet), the chimp's slot is here */
export const HUMAN_SPOT = sillAnchor("human", 0, 0.55);
export const CHIMP_SPOT = sillAnchor("chimp", 0, 0.45);

// ===================================================================================================================
// THE IDEAL OCCUPANT (C): a big rounded figure (a bigger head) filling the human's alcove; one closed outline in
// niche-local metres, from the left foot up the left side, round the head, down the right side and back
// ===================================================================================================================
export const OCCUPANT = { H: 4.3, headR: 0.66, inset: 0.85, dash: 0.34, gap: 0.2 };
const catmull = (pts: [number, number][], per = 6, closed = true): [number, number][] => {
  const out: [number, number][] = [];
  const n = pts.length;
  const at = (i: number) => pts[closed ? (i + n) % n : Math.max(0, Math.min(n - 1, i))];
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    for (let s = 0; s < per; s++) {
      const t = s / per;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  if (!closed) out.push(pts[n - 1]);
  return out;
};
/** the outline (niche-local u, v in m), starting at the left foot's outer heel */
export const occupantUV = (): [number, number][] => {
  const { H, headR } = OCCUPANT;
  const hc = H - headR;
  // the left half from the foot up to the neck (u < 0), mirrored for the right
  const leftUp: [number, number][] = [
    [-0.93, 0.02], // the left foot, outer
    [-0.8, 0.22],
    [-0.86, 0.75], // the leg's outer edge
    [-0.98, 1.2], // the hip
    [-1.2, 1.2], // the mitten hand (outer)
    [-1.26, 1.5],
    [-1.18, 2.15], // the arm's outer edge (the sleeve flaring out of the body)
    [-0.98, 2.68], // the shoulder
    [-0.55, 2.98],
    [-0.27, hc - headR * Math.sin(Math.acos(0.27 / headR))], // the neck, left (on the head's circle)
  ];
  const head: [number, number][] = [];
  const xa = Math.acos(0.27 / headR);
  const a0 = Math.PI + xa; // the neck, left (lower left of the circle, y up)
  const a1 = -xa; // the neck, right: round the top, clockwise
  for (let i = 0; i <= 16; i++) {
    const a = a0 + ((a1 - a0) * i) / 16;
    head.push([headR * Math.cos(a), hc + headR * Math.sin(a)]);
  }
  const rightDown = leftUp
    .slice()
    .reverse()
    .map(([u, v]) => [-u, v] as [number, number]);
  const legs: [number, number][] = [
    [0.93, 0.02],
    [0.26, 0.0], // the right foot's sole, inner
    [0.16, 0.95], // the inner leg up to the crotch
    [0.0, 1.06],
    [-0.16, 0.95],
    [-0.26, 0.0],
  ];
  const ctrl = [...leftUp, ...rightDown, ...legs.slice(1)];
  // the body as a smooth loop, the head spliced in exactly (a true circle)
  const body = catmull(ctrl, 7, true);
  // splice: cut the loop at the neck points and insert the head arc
  const iL = body.findIndex((q) => Math.abs(q[0] - leftUp[leftUp.length - 1][0]) < 1e-6 && Math.abs(q[1] - leftUp[leftUp.length - 1][1]) < 1e-6);
  const iR = body.findIndex((q) => Math.abs(q[0] - rightDown[0][0]) < 1e-6 && Math.abs(q[1] - rightDown[0][1]) < 1e-6);
  if (iL < 0 || iR < 0) return body;
  return [...body.slice(0, iL), ...head, ...body.slice(iR + 1)];
};
export const OCCUPANT_UV = occupantUV();

// ===================================================================================================================
// THE HOIST (F): a timber gallows on the floor in front of the human column (post, arm, brace, two sheaves), a rope
// from the winch drum up the post, over the sheaves and down to a bridle ring over the little timber platform
// ===================================================================================================================
export const HOIST = {
  /** the platform (m): half-width, thickness, depth, the gap in front of the cornice; its deck tops out at cornY */
  platHalfW: 1.25,
  platT: 0.26,
  platD: 1.4,
  gap: 0.3,
  /** the bridle ring above the deck (m) */
  ringAbove: 2.55,
  /** the gallows: post at postX, arm under armY, its left sheave (the platform's) and right sheave (the post's) */
  postX: 2.15,
  postW: 0.32,
  postTop: 10.55,
  armY: 10.05,
  armX0: -0.45,
  sheaveL: { X: 0, Y: 9.72, R: 0.28 },
  sheaveR: { X: 2.66, Y: 9.72, R: 0.28 },
  /** the winch: drum axis along Z at (drumX, drumH), its radius, the crank's reach */
  drumX: 3.3,
  drumH: 1.1,
  drumR: 0.36,
  drumW: 1.0,
  crankR: 0.72,
  /** where the EVOLUTION plate hangs (nailed on the post, the rope running behind it; m) */
  plate: { X: 2.5, h: 3.1 },
};
/** the deck's top (m above the floor) at platform height t (0 = resting on the floor, 1 = flush with the human's sill) */
export const deckH = (t: number) => HOIST.platT + (TOWER.cornY - HOIST.platT) * t;
/** the platform's depths (units): front and back */
export const platZ = () => {
  const zB = zFrontAt(TOWER.cornY) - m(TOWER.cornice.band.out + HOIST.gap);
  return { zB, zF: zB - m(HOIST.platD), zM: zB - m(HOIST.platD / 2) };
};
/** the human's feet on the deck at platform height t */
export const platformRiderSpot = (t: number, u = 0): SillAnchor => ({ X: m(u), Y: hy(deckH(t)), Z: platZ().zM + 20 });
/** the crank angle (rad, screen sense: + = clockwise) that winds the rope for platform height t: the rope wound on
 *  the drum = the platform's rise (one fall), so the crank turns rise / drumR */
export const crankFor = (t: number) => -(deckH(t) - deckH(0)) / HOIST.drumR;

// ===================================================================================================================
// THE CAMERA
// ===================================================================================================================
/** the depth camera: Dc = dRef (kRef / k)^dolly: a long lens in the wide (weak perspective, the ceiling ring a soft
 *  ellipse), closer in the close shots (the cornice and sills show their lit tops) */
export const TOWER_DEPTH = { dRef: 30000, kRef: 0.058, dolly: 0.6 };
/** the eye rises with the camera, a little slower (a crane): 0.85 x the frame centre's height + 0.6 m (>= 1.7 m), so
 *  the close shots look a little down onto the cornice's and the sills' lit tops and the high shots a little up */
export const eyeHeightAt = (cam: Cam) => m(Math.max(1.7, 0.85 * (-cam.cy / U) + 0.6));
export const towerDepth = (cam: Cam): DepthOpts => ({ eyeY: -eyeHeightAt(cam), ...TOWER_DEPTH });
export const towerPersp = (cam: Cam): Persp => perspective(cam, towerDepth(cam));
const DcOf = (k: number) => TOWER_DEPTH.dRef * Math.pow(TOWER_DEPTH.kRef / k, TOWER_DEPTH.dolly);
/** the 2D zoom k that shows depth Z at pxPerM screen px per metre */
export const kForScale = (pxPerM: number, Z = zFrontAt(TOWER.cornY)) => {
  let lo = Math.log(0.005);
  let hi = Math.log(10);
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    const k = Math.exp(mid);
    const D = DcOf(k);
    const s = k * (D / (D + Z)) * U;
    if (s > pxPerM) hi = mid;
    else lo = mid;
  }
  return Math.exp((lo + hi) / 2);
};
/** the camera at zoom k that puts the 3D point (X, Y, Z) at screen (sx, sy) */
export const frameAt = (k: number, X: number, Y: number, Z: number, sx = 540, sy = 960): Cam => {
  const D = DcOf(k);
  const r = D / (D + Z);
  let cy = Y - (sy - 960) / k;
  for (let i = 0; i < 40; i++) {
    const e = -eyeHeightAt({ k, cx: 0, cy });
    const py = e + (Y - e) * r;
    cy = py - (sy - 960) / k;
  }
  const cx = X - (sx - 540) / (r * k);
  return { k, cx, cy };
};
/** the screen point of a 3D point under a camera */
export const screenOf3 = (cam: Cam, X: number, Y: number, Z: number): P2 => {
  const P = towerPersp(cam);
  const q = P.p(X, Y, Z);
  return [540 + (q[0] - cam.cx) * cam.k, 960 + (q[1] - cam.cy) * cam.k];
};
/** the camera that puts the tower's front at height hA at screen y syA and at hB at syB (X = 0, sx 540) */
export const frameTwo = (hA: number, syA: number, hB: number, syB: number, sx = 540): Cam => {
  let lo = Math.log(0.005);
  let hi = Math.log(10);
  let cam = frameAt(1, 0, hy(hA), zFrontAt(hA), sx, syA);
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    cam = frameAt(Math.exp(mid), 0, hy(hA), zFrontAt(hA), sx, syA);
    const yB = screenOf3(cam, 0, hy(hB), zFrontAt(hB))[1];
    // bigger k = hB further above
    if (syA - yB > syA - syB) hi = mid;
    else lo = mid;
  }
  return cam;
};

/** camera presets (2D cams; swayCam them in a cut). Hints from the cut briefs; tune per cut */
const kHuman = (px: number) => kForScale(px / 1.75, HUMAN_SPOT.Z);
export const TOWER_CAM = (() => {
  const hum = HUMAN_SPOT;
  const zP = platZ().zM;
  return {
    /** A f0: close on the human in his lit niche (~300 px tall, his middle near y 850), the cornice under the sill */
    A_open: frameAt(kHuman(300), 0, hy(TOWER.cornY + 0.9), hum.Z, 540, 850),
    /** A resolved: the human's sill near y 1040 (the shaft ~500 px wide, the lit niche ~105 px, the figure ~40 px), the
     *  dashed ceiling's top near y 320; the base melts into the low air below ~y 1150 (TowerFloor's wide mode) */
    A_resolved: frameTwo(TOWER.cornY, 1040, TOWER.ceilY, 320),
    /** B f0: the stone capital's top near y 620 (the SMARTEST POSSIBLE plate on its block), the whole stone drum below
     *  it (the lit niche ~y 920-1125, his face ~1050), the dashed edges rising out of the top of the frame near its sides (46 px/m) */
    B_open: frameAt(kForScale(46, zFrontAt(TOWER.capitalY)), 0, hy(TOWER.capitalY), zFrontAt(TOWER.capitalY), 540, 620),
    /** B resolved: the human (~210 px) on his sill at y ~790 = the cornice's top; the chimp's niche below it spans
     *  ~y 895-1160 (a ~1.2 m chimp's face lands ~y 1050, above caption band 1) */
    B_resolved: frameAt(kHuman(210), 0, hy(TOWER.cornY), hum.Z, 540, 790),
    /** C f0: the alcove whole at a medium distance, the cornice under it */
    C_open: frameAt(kForScale(108, hum.Z), 0, hy(TOWER.cornY), hum.Z, 540, 1010),
    /** C resolved: the alcove ~650 px tall, its crown near y 340, the sill near y 1000; the human ~250 px */
    C_resolved: frameAt(kForScale(650 / 4.6, hum.Z), 0, hy(TOWER.cornY), hum.Z, 540, 1000),
    /** F f0: the foot of the tower, the platform on the floor with the human (~220 px), the winch to the right */
    F_open: frameAt(kForScale(220 / 1.75, zP), m(1.25), hy(deckH(0)), zP, 540, 1010),
    /** F with the platform half-way (t 0.5), the camera risen with it */
    F_half: frameAt(kForScale(220 / 1.75, zP), m(1.25), hy(deckH(0.5)), zP, 540, 1000),
  };
})();

/** a camera track: keys at frames, pchip on ln k, cx, cy, through the house damped follow (the crane cut's runner;
 *  CAM_STIFF 0.09 / CAM_DAMP 0.468 as kits/dwarkesh/fieldShared) with a lead of 5 frames */
export const towerCamTrack = (keys: { f: number; cam: Cam }[], duration: number, follow = true) => {
  const pk = pchip(keys.map((q) => [q.f, Math.log(q.cam.k)] as [number, number]));
  const px = pchip(keys.map((q) => [q.f, q.cam.cx] as [number, number]));
  const py = pchip(keys.map((q) => [q.f, q.cam.cy] as [number, number]));
  const clampF = (f: number) => Math.max(keys[0].f, Math.min(keys[keys.length - 1].f, f));
  const target = (f: number) => [px(clampF(f)), py(clampF(f)), pk(clampF(f))];
  if (!follow) return (f: number): Cam => {
    const t = target(f);
    return { cx: t[0], cy: t[1], k: Math.exp(t[2]) };
  };
  const STIFF = 0.09;
  const DAMP = 0.468;
  const PRE = 60;
  const LEAD = 5;
  let s = target(-PRE + LEAD);
  let v = [0, 0, 0];
  const out: Cam[] = [];
  for (let f = -PRE + 1; f <= duration + 2; f++) {
    const t = target(f + LEAD);
    v = v.map((vi, i) => vi + (t[i] - s[i]) * STIFF - vi * DAMP);
    s = s.map((si, i) => si + v[i]);
    if (f >= 0) out.push({ cx: s[0], cy: s[1], k: Math.exp(s[2]) });
  }
  return (f: number): Cam => out[Math.max(0, Math.min(out.length - 1, Math.round(f)))];
};
