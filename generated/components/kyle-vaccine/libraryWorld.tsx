// ---------------------------------------------------------------------------
// libraryWorld: THE LIBRARY OF CULTURAL EVOLUTION, the shared world of kyle-vaccine cuts 68 (StoreThatInformation)
// and 76 (LibraryOfCulturalEvolution). Dwarkesh 3D style (styles/dwarkesh-3d.md) on the kit kits/dwarkesh-3d.
// A great library hall in the teal air (mood interior) in ONE-POINT perspective (the kit's londonDepth camera): a
// central aisle running into the depth, on both sides rows of tall double-faced bookcases ("stacks") standing across
// the hall like the bays of a long room, two levels (a gallery deck with a railing over the lower cases, the upper
// cases on it), pilasters at the stack ends, rolling ladders on the front faces, reading tables and benches down the
// aisle, a lectern at the front, clerestory windows high on both walls under a timber barrel vault, tall soft shafts
// falling from the left windows into the aisle, a tall window closing the far end. Books are air-lit spines in muted
// local colours (libraryShelves.tsx: thousands, baked once per render tab to JPEG textures, ten variants); nothing
// near orange except THE VACCINE BOOK (Jenner's).
//
// UNITS: the cast's (a man ~312 = 1.75 m, U = 178 per metre). X across (the aisle centre X = 0), Y height (floor 0,
// up is - Y), Z depth (stack 0's front face at Z = 0, + into the hall). Draw inside <WorldSvg cam> on DEPTH.
//
// API
//   U, DEPTH, HALL (aisle half-width AW, stack length SL, thickness T, pitch BAY, N stacks per side, the levels'
//     Y spans, the walls, the vault), stackZ(i) = the front face's Z of stack i (i = 0 nearest).
//   Faces: RowRef = { side: "L" | "R", stack, level: 0 lower | 1 upper }; faceX0(side) (world X of the face's left
//     end), levelTopY(level) (the case top), SEC_W / CASE_H / NSH (libraryShelves) = 5 sections of 220 per face.
//   slotAt(row, shelf, i) -> { X (spine centre), Y (the shelf's standing surface), Z (the face), w, h, top } for book
//     i (0 = world-leftmost) on shelf `shelf` (0 = top) of that face; booksOn(row, shelf) = how many.
//   VACCINE_SLOT: the free slot where Jenner's book goes in cut 68 (left stack 0, lower level, shelf 2 = shoulder
//     height): { row, shelf, X, Y, Z, w, h, d } with the book's spine flush with the face at Z when home.
//   VB = the vaccine book's size { w (spine), h, d }.
//   LECTERN { X, Z, topY }, TABLES (per bay), BENCH_X, ladders (LADDERS).
//   placeFigure(A, X, Z, feetY = 0) -> { at, scale } for a cast figure (feetY = -HALL.deck[0] on the gallery).
//   LIB_SCENE (the AirScene), libraryAir(cam, frame, rest?) -> AirWorld (the kit's airWorldOf on DEPTH, rest =
//     LIB_REST = cut 68's f0 camera, so motes and shafts parallax continuously across 68 -> 76).
//   <LibraryStage A frame extra? heroLive? uid? />  the whole hall in painter's order (far to near): extra = your
//     LibItem[] { Z (sort key: the item's nearest depth), key, node: () => ReactNode } sorted in with the stacks,
//     tables, ladders and shafts. Use it inside <AirStage v={A.v} shafts={0} bloom={LIB_BLOOM}> <WorldSvg cam>.
//   <Book A pose dims col /> a closed book in 3D at any orientation (pose = BookPose { c, ex, ey, ez }).
//   <VaccineBook A pose open glow uid />  Jenner's book (umber boards while open; closing, a warm orange binding lit
//     from within with two thin darker bands; cream pages): open 0..1
//     (1 = open flat in a shallow V, 0 = closed), glow 0..1 (the orange LIGHT in the pages; when closed it leaks only
//     from the page edges, and lights what is around it softly through the medium's bloom). bookCorners(...) gives
//     the cover points for the hands' grips.
//   <ShelfGlow A X Y Z amt uid />  the orange light leaking round a shelved glowing book onto its neighbours.
//   Cut 68's camera: storeCamAt(f) (sway included), STORE_END_CAM = storeCamAt(130) = cut 68's last frame, which is
//     cut 76's first; STORE_END = { frame 130, cam, ... }. Cut 76 renders its frame f as world frame 130 + f.
// ---------------------------------------------------------------------------
import React from "react";
import {
  ACCENT,
  ACCENT_DEEP,
  AirBox,
  AirFloor,
  AirShadow,
  ORANGE_LINE,
  airWorldOf,
  c01,
  formTone,
  hexRgb,
  lerp,
  mixHex,
  rgbHex,
  swayCam,
  type AirScene,
  type AirWorld,
  type Cam,
  type DepthOpts,
  type Mat,
  type P2,
} from "../kits/dwarkesh-3d/dwarkesh3d";
import { BOOK_COLS, CASE_H, OAK, SEC_W, ShelfSectionArt, caseBooks, shelfFloorY, useShelfTextures, type Gap, type SBook } from "./libraryShelves";

export { SEC_W, CASE_H, NSH, OAK, BOOK_COLS } from "./libraryShelves";

const Pt = (v: P2) => `${v[0].toFixed(2)},${v[1].toFixed(2)}`;
const poly = (q: P2[]) => `M${q.map(Pt).join("L")}Z`;

// ===================================================================================================================
// THE HALL
// ===================================================================================================================
export const U = 178;
/** the eye a little above a man's eye (1.69 m); camera 1800 in front of the stacks' front plane at zoom 2 */
export const DEPTH: DepthOpts = { eyeY: -300, dRef: 1800, kRef: 2, dolly: 0.5 };
export const HALL = {
  /** the aisle's half width: stacks from +-AW outward */
  AW: 260,
  /** a stack's length (5 sections of 220) */
  SL: 1100,
  /** a stack's thickness (double-faced) */
  T: 90,
  /** stack pitch */
  BAY: 420,
  /** stacks per side */
  N: 14,
  /** levels (Y top, Y bottom) */
  low: [-450, 0] as const,
  deck: [-472, -450] as const,
  up: [-922, -472] as const,
  cap: [-944, -922] as const,
  /** the outer walls (X = +-wallX), the clerestory windows on them, the vault springing at springY */
  wallX: 1360,
  win: [-1290, -1010] as const,
  springY: -1330,
  vaultH: 520,
  zFront: -2800,
  zEnd: 14 * 420 + 260,
};
export const stackZ = (i: number) => i * HALL.BAY;
export type Side = "L" | "R";
export type RowRef = { side: Side; stack: number; level: 0 | 1 };
export const faceX0 = (side: Side) => (side === "L" ? -HALL.wallX : HALL.AW);
export const faceX1 = (side: Side) => (side === "L" ? -HALL.AW : HALL.wallX);
export const levelTopY = (level: 0 | 1) => (level === 0 ? HALL.low[0] : HALL.up[0]);
const NSEC = HALL.SL / SEC_W;

/** the vaccine book (spine thickness w, height h, depth d) */
export const VB = { w: 10, h: 49, d: 36 };
/** the hero face: left stack 0, lower level. Its two aisle-end sections are drawn live (the vaccine slot is in sec 4) */
const HERO_ROW: RowRef = { side: "L", stack: 0, level: 0 };
const HERO_SECS = [3, 4];
const SLOT_SEC = 4;
const SLOT_SHELF = 2;
const SLOT_LX = 64;
const SLOT_GAP: Gap = { shelf: SLOT_SHELF, x0: SLOT_LX - VB.w / 2 - 0.7, x1: SLOT_LX + VB.w / 2 + 0.7 };
const isHero = (row: RowRef, sec: number) => row.side === HERO_ROW.side && row.stack === HERO_ROW.stack && row.level === HERO_ROW.level && HERO_SECS.includes(sec);
const hashI = (a: number, b: number, c: number, d: number) => {
  let h = (a * 73856093) ^ (b * 19349663) ^ (c * 83492791) ^ (d * 2654435761);
  h = Math.imul(h ^ (h >>> 13), 0x5bd1e995);
  return ((h ^ (h >>> 15)) >>> 0) % 1000003;
};
/** the art variant of a section (baked 0..NVAR-1; the hero sections have their own live variants) */
const variantOf = (row: RowRef, sec: number) => {
  if (isHero(row, sec)) return 40 + sec;
  return hashI(row.side === "L" ? 1 : 2, row.stack + 3, row.level + 5, sec + 7) % 10;
};
const sectionBooks = (row: RowRef, sec: number): SBook[][] => (isHero(row, sec) && sec === SLOT_SEC ? caseBooks(variantOf(row, sec), SLOT_GAP) : caseBooks(variantOf(row, sec)));

/** the books on one shelf of a face, world-left to right */
const faceShelf = (row: RowRef, shelf: number) => {
  const out: { X: number; w: number; h: number; tilt: number; c: number }[] = [];
  for (let s = 0; s < NSEC; s++) {
    const x0 = faceX0(row.side) + s * SEC_W;
    sectionBooks(row, s)[shelf].forEach((b) => out.push({ X: x0 + b.x + b.w / 2, w: b.w, h: b.h, tilt: b.tilt, c: b.c }));
  }
  return out;
};
export const booksOn = (row: RowRef, shelf: number) => faceShelf(row, shelf).length;
export const slotAt = (row: RowRef, shelf: number, i: number) => {
  const b = faceShelf(row, shelf)[i];
  const Y = levelTopY(row.level) + shelfFloorY(shelf);
  return { X: b.X, Y, Z: stackZ(row.stack), w: b.w, h: b.h, top: Y - b.h, tilt: b.tilt, col: BOOK_COLS[b.c] };
};
export const VACCINE_SLOT = {
  row: HERO_ROW,
  shelf: SLOT_SHELF,
  X: faceX0("L") + SLOT_SEC * SEC_W + SLOT_LX,
  Y: levelTopY(0) + shelfFloorY(SLOT_SHELF),
  Z: stackZ(0),
  w: VB.w,
  h: VB.h,
  d: VB.d,
};

/** the lectern at the front of the aisle (a slanted reading desk on a post) */
export const LECTERN = { X: -50, Z: -230, topY: -205, w: 74, d: 54 };
/** reading tables down the aisle, one per bay (X +-TABLE.hw, top at TABLE.y), benches at +-BENCH_X */
export const TABLE = { hw: 72, y: -136, th: 10, z0: 80, z1: 340 };
export const BENCH_X = 118;
export const TABLES = Array.from({ length: HALL.N - 1 }, (_, i) => ({ z0: stackZ(i) + TABLE.z0, z1: stackZ(i) + TABLE.z1 }));
/** rolling ladders leaning on a lower front face: X (centre), the face's stack */
export const LADDERS: { side: Side; stack: number; X: number }[] = [
  { side: "L", stack: 0, X: -930 },
  { side: "R", stack: 0, X: 780 },
];

/** a cast figure standing at (X, Z) with its feet at height feetY (0 = the floor; HALL.deck[0] = on the gallery) */
export const placeFigure = (A: AirWorld, X: number, Z: number, feetY = 0) => ({ at: A.P.p(X, feetY, Z), scale: A.P.r(Z) });

// ===================================================================================================================
// THE AIR
// ===================================================================================================================
export const LIB_SCENE: Partial<AirScene> = { mood: "interior", fogNear: 700, fogVis: 2600, fogMax: 0.92, hHigh: 1500, eyeT: 0.1 };
export const LIB_BLOOM = 0.24;

// ===================================================================================================================
// CUT 68's CAMERA (the first cut in the hall; its last frame is cut 76's first)
// ===================================================================================================================
/** the camera: a 3D target point Q held at screen (540, sy) at zoom k. f0: a medium shot on Jenner's open book;
 *  one smooth push and pan (an even tapered-cosine lobe f14-122, its plateau f47-89) following the book to the shelf; a slow creep to f130 on the slot. */
export const STORE_CAM = {
  from: { k: 2.05, Q: [-330, -232, -90] as const, sy: 930 },
  to: { k: 5.0, Q: [VACCINE_SLOT.X, VACCINE_SLOT.Y - VB.h * 0.5, VACCINE_SLOT.Z] as const, sy: 905 },
  move: [14, 122] as const,
  taper: 0.62,
  /** a slow creep on both sides of the move (fraction of the whole travel per frame) */
  creep: 0.0022,
};
export const STORE_LAST = 130;
/** the move's progress: a tapered-cosine (Tukey) velocity over STORE_CAM.move (taper STORE_CAM.taper: a long even
 *  plateau, no single peak), integrated and normalised, plus the creep */
const TUKEY = (() => {
  const [a, b] = STORE_CAM.move;
  const T = STORE_CAM.taper;
  const n = (b - a) * 8;
  const v = (x: number) => {
    if (x <= 0 || x >= 1) return 0;
    if (x < T / 2) return 0.5 * (1 - Math.cos((2 * Math.PI * x) / T));
    if (x > 1 - T / 2) return 0.5 * (1 - Math.cos((2 * Math.PI * (1 - x)) / T));
    return 1;
  };
  const cum: number[] = [0];
  for (let i = 1; i <= n; i++) cum.push(cum[i - 1] + v((i - 0.5) / n));
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    const t = x * n;
    const i = Math.floor(t);
    return lerp(cum[i], cum[Math.min(n, i + 1)], t - i) / cum[n];
  };
})();
const storeU = (f: number) => {
  const [a, b] = STORE_CAM.move;
  const c = STORE_CAM.creep;
  const core = TUKEY((f - a) / (b - a));
  // the creep: a constant slope over the whole cut, taken out of the core so the ends still land on the keys
  const lin = (f - a) / (b - a);
  return core * (1 - c * (b - a)) + c * (b - a) * lin;
};
export const storeCamBase = (f: number): Cam => {
  const u = storeU(f);
  const { from, to } = STORE_CAM;
  const k = Math.exp(lerp(Math.log(from.k), Math.log(to.k), u));
  const Q = [0, 1, 2].map((i) => lerp(from.Q[i], to.Q[i], u));
  const sy = lerp(from.sy, to.sy, u);
  const Dc = DEPTH.dRef * Math.pow(DEPTH.kRef / k, DEPTH.dolly);
  const r = Dc / (Dc + Q[2]);
  const y2 = DEPTH.eyeY + (Q[1] - DEPTH.eyeY) * r;
  return { k, cx: Q[0], cy: y2 - (sy - 960) / k };
};
export const storeCamAt = (f: number): Cam => swayCam(storeCamBase(f), f);
export const LIB_REST: Cam = storeCamAt(0);
export const STORE_END_CAM: Cam = storeCamAt(STORE_LAST);
export const STORE_END = { frame: STORE_LAST, cam: STORE_END_CAM };
export const libraryAir = (cam: Cam, frame: number, rest: Cam = LIB_REST): AirWorld => airWorldOf({ cam, rest, depth: DEPTH, frame, scene: LIB_SCENE });

// ===================================================================================================================
// BOOKS IN 3D
// ===================================================================================================================
export type V3 = [number, number, number];
const add3 = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul3 = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s];
const sub3 = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot3 = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm3 = (a: V3): V3 => mul3(a, 1 / Math.max(1e-9, Math.hypot(a[0], a[1], a[2])));
const cross3 = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
/** rotate v about the unit axis k by angle a (Rodrigues) */
export const rot3 = (v: V3, k: V3, a: number): V3 => {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return add3(add3(mul3(v, c), mul3(cross3(k, v), s)), mul3(k, dot3(k, v) * (1 - c)));
};
/** a book's frame: c = the spine's centre (world 3D), ex = across the spine (the book's thickness, cover to cover),
 *  ey = along the spine toward the HEAD (top), ez = from the spine to the fore-edge (the book's depth). */
export type BookPose = { c: V3; ex: V3; ey: V3; ez: V3 };
/** a book standing on a shelf, spine to the camera, sunk `out` units behind the face (out < 0 = sticking out) */
export const shelvedPose = (X: number, Ybottom: number, Zface: number, h: number, out = 0): BookPose => ({ c: [X, Ybottom - h / 2, Zface + out], ex: [1, 0, 0], ey: [0, -1, 0], ez: [0, 0, 1] });
/** the light: from the upper left and a little in front */
const LIGHT = norm3([-0.55, -0.75, -0.4]);
const camPos = (A: AirWorld): V3 => [A.cam.cx, A.P.opts.eyeY, -A.Dc];

type Face = { q: V3[]; n: V3; fill: string; key: string; edge?: boolean };
const faceVisible = (A: AirWorld, f: Face) => {
  const ctr = mul3(f.q.reduce((s, p) => add3(s, p), [0, 0, 0] as V3), 1 / f.q.length);
  return dot3(f.n, sub3(camPos(A), ctr)) > 0;
};
const proj = (A: AirWorld, p: V3): P2 => A.P.p(p[0], p[1], p[2]);
/** a box in a book frame: x in [x0, x1] (along ex), y in [y0, y1] (along ey), z in [z0, z1] (along ez) */
const boxFaces = (pose: BookPose, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number) => {
  const { c, ex, ey, ez } = pose;
  const P = (x: number, y: number, z: number): V3 => add3(add3(add3(c, mul3(ex, x)), mul3(ey, y)), mul3(ez, z));
  return {
    P,
    spine: { q: [P(x0, y0, z0), P(x1, y0, z0), P(x1, y1, z0), P(x0, y1, z0)], n: mul3(ez, -1) },
    fore: { q: [P(x0, y0, z1), P(x0, y1, z1), P(x1, y1, z1), P(x1, y0, z1)], n: ez },
    head: { q: [P(x0, y1, z0), P(x1, y1, z0), P(x1, y1, z1), P(x0, y1, z1)], n: ey },
    tail: { q: [P(x0, y0, z0), P(x0, y0, z1), P(x1, y0, z1), P(x1, y0, z0)], n: mul3(ey, -1) },
    left: { q: [P(x0, y0, z0), P(x0, y1, z0), P(x0, y1, z1), P(x0, y0, z1)], n: mul3(ex, -1) },
    right: { q: [P(x1, y0, z0), P(x1, y0, z1), P(x1, y1, z1), P(x1, y1, z0)], n: ex },
  };
};
const litTone = (A: AirWorld, m: Mat, n: V3, Z: number, h: number, orange = false) => {
  const c = formTone(m, dot3(n, LIGHT), A.v.pal.shadow, 0.3);
  return orange ? A.toneO(c, Z, h) : A.tone(c, Z, h);
};

/** a closed book (any orientation): cloth/leather boards, cream page edges */
export const Book: React.FC<{ A: AirWorld; pose: BookPose; w: number; h: number; d: number; col: string; uid: string }> = ({ A, pose, w, h, d, col }) => {
  const m: Mat = { lit: mixHex(col, "#F3EBDD", 0.22), mid: col, dark: mixHex(col, "#22180F", 0.45) };
  const pages: Mat = { lit: "#EDE3CC", mid: "#D6C9AA", dark: "#8E8470" };
  const F = boxFaces(pose, -w / 2, w / 2, -h / 2, h / 2, 0, d);
  const Z = pose.c[2];
  const hh = -pose.c[1];
  const faces: Face[] = [
    { ...F.spine, fill: litTone(A, m, F.spine.n, Z, hh), key: "s" },
    { ...F.left, fill: litTone(A, m, F.left.n, Z, hh), key: "l" },
    { ...F.right, fill: litTone(A, m, F.right.n, Z, hh), key: "r" },
    { ...F.head, fill: litTone(A, pages, F.head.n, Z, hh), key: "h" },
    { ...F.tail, fill: litTone(A, pages, F.tail.n, Z, hh), key: "t" },
    { ...F.fore, fill: litTone(A, pages, F.fore.n, Z, hh), key: "f" },
  ];
  const ln = A.tone(mixHex(col, "#22180F", 0.6), Z, hh);
  return (
    <g>
      {faces
        .filter((f) => faceVisible(A, f))
        .map((f) => (
          <path key={f.key} d={poly(f.q.map((p) => proj(A, p)))} fill={f.fill} stroke={ln} strokeWidth={A.lw(0.5)} strokeLinejoin="round" />
        ))}
    </g>
  );
};

// ---- the vaccine book ---------------------------------------------------------------------------------------------
/** Jenner's binding: umber leather boards, a cream (vellum) spine with umber bands, cream pages */
export const VACCINE_BOARD: Mat = { lit: "#8C6A4A", mid: "#664A33", dark: "#33241A" };
export const VACCINE_SPINE: Mat = { lit: "#EFE6D2", mid: "#D9CCAE", dark: "#8E8268" };
/** the vaccine binding once the book is closed: a warm orange leather lit from within (THE vaccine book) */
export const VACCINE_BIND: Mat = { lit: "#F4A83C", mid: "#CF7E1E", dark: "#7E4712" };
const BAND_ORANGE = "#94540F";

/** the two halves of an open book: each half rotates about the spine (the ey axis through c) by +-open*82 deg out of
 *  the closed stack, away from the reader's side (-ez is the spine side). Returns the halves' frames. */
const halves = (pose: BookPose, open: number) => {
  const a = open * ((82 * Math.PI) / 180);
  // the hinge: the spine line (c, along ey). The left half's boards lie along -ex, the right's along +ex.
  const exL = rot3(pose.ex, pose.ey, a);
  const ezL = rot3(pose.ez, pose.ey, a);
  const exR = rot3(pose.ex, pose.ey, -a);
  const ezR = rot3(pose.ez, pose.ey, -a);
  return { L: { c: pose.c, ex: exL, ey: pose.ey, ez: ezL }, R: { c: pose.c, ex: exR, ey: pose.ey, ez: ezR } };
};
/** the points the hands hold: the outer covers' fore-edge corners at mid height (left, right), world 3D */
export const bookGrips = (pose: BookPose, open: number, dims = VB) => {
  const H = halves(pose, open);
  const L = add3(add3(H.L.c, mul3(H.L.ex, -dims.w / 2)), mul3(H.L.ez, dims.d * 0.8));
  const R = add3(add3(H.R.c, mul3(H.R.ex, dims.w / 2)), mul3(H.R.ez, dims.d * 0.8));
  return { L, R, spine: pose.c };
};
export const bookCorners = bookGrips;

/** Jenner's book. open 0..1, glow 0..1. Drawn with its own soft light (screen) when glowing. */
export const VaccineBook: React.FC<{ A: AirWorld; pose: BookPose; open: number; glow: number; uid: string; dims?: typeof VB; light?: number }> = ({ A, pose, open, glow, uid, dims = VB, light = 1 }) => {
  const { w, h, d } = dims;
  const Z = pose.c[2];
  const hh = -pose.c[1];
  const g = c01(glow);
  const ln = A.tone(mixHex(VACCINE_BOARD.dark, "#22180F", 0.4), Z, hh);
  const els: React.ReactNode[] = [];
  // the leather catches its own light a little; the page edges carry the leak
  // umber while it is open (the light is in the pages), the warm orange binding as it closes (the knowledge inside)
  const bt = c01(g * (1 - open));
  const board: Mat = { lit: mixHex(VACCINE_BOARD.lit, VACCINE_BIND.lit, bt), mid: mixHex(VACCINE_BOARD.mid, VACCINE_BIND.mid, bt), dark: mixHex(VACCINE_BOARD.dark, VACCINE_BIND.dark, bt) };
  const edgeCol = A.toneO(mixHex("#E9DCC0", ACCENT, c01(g * (1.15 - 0.75 * open))), Z, hh);
  if (open < 0.02) {
    // closed: one block (boards round an inset page block)
    const F = boxFaces(pose, -w / 2, w / 2, -h / 2, h / 2, 0, d);
    const FP = boxFaces(pose, -w / 2 + 1.4, w / 2 - 1.4, -h / 2 + 1.1, h / 2 - 1.1, 0.6, d + 0.05);
    const faces: Face[] = [
      { ...F.spine, fill: litTone(A, board, F.spine.n, Z, hh), key: "s" },
      { ...F.left, fill: litTone(A, board, F.left.n, Z, hh), key: "l" },
      { ...F.right, fill: litTone(A, board, F.right.n, Z, hh), key: "r" },
      { ...F.head, fill: litTone(A, board, F.head.n, Z, hh), key: "h" },
      { ...F.tail, fill: litTone(A, board, F.tail.n, Z, hh), key: "t" },
      { ...F.fore, fill: litTone(A, board, F.fore.n, Z, hh), key: "f" },
    ];
    faces
      .filter((f) => faceVisible(A, f))
      .forEach((f) => {
        els.push(<path key={f.key} d={poly(f.q.map((p) => proj(A, p)))} fill={f.fill} stroke={ln} strokeWidth={A.lw(0.45)} strokeLinejoin="round" />);
        if (f.key === "h" || f.key === "t" || f.key === "f") {
          const pf = FP[f.key === "h" ? "head" : f.key === "t" ? "tail" : "fore"];
          els.push(<path key={`${f.key}p`} d={poly(pf.q.map((p) => proj(A, p)))} fill={edgeCol} />);
        }
      });
    // the spine: two thin raised bands in a darker orange, and a soft light from within (screen, strongest mid-spine)
    if (faceVisible(A, { ...F.spine, fill: "", key: "" })) {
      const band = (y0: number, y1: number, k: string) => {
        const Fb = boxFaces(pose, -w / 2, w / 2, y0, y1, -0.08, d);
        els.push(<path key={k} d={poly(Fb.spine.q.map((p) => proj(A, p)))} fill={A.toneO(mixHex(VACCINE_BOARD.mid, BAND_ORANGE, bt), Z, hh)} />);
      };
      band(h * 0.3, h * 0.335, "b1");
      band(-h * 0.335, -h * 0.3, "b2");
      if (g > 0.01) {
        const q = F.spine.q.map((p) => proj(A, p));
        const mA: P2 = [(q[0][0] + q[3][0]) / 2, (q[0][1] + q[3][1]) / 2];
        const mB: P2 = [(q[1][0] + q[2][0]) / 2, (q[1][1] + q[2][1]) / 2];
        els.push(
          <g key="within" style={{ mixBlendMode: "screen" }}>
            <defs>
              <linearGradient id={`${uid}-wi`} gradientUnits="userSpaceOnUse" x1={mA[0].toFixed(2)} y1={mA[1].toFixed(2)} x2={mB[0].toFixed(2)} y2={mB[1].toFixed(2)}>
                <stop offset="0" stopColor={ACCENT} stopOpacity={0} />
                <stop offset="0.5" stopColor="#FFD27A" stopOpacity={0.4 * g} />
                <stop offset="1" stopColor={ACCENT} stopOpacity={0} />
              </linearGradient>
            </defs>
            <path d={poly(q)} fill={`url(#${uid}-wi)`} />
          </g>,
        );
      }
    }
    // the leak: the light escaping at the head and the tail, a short soft bright line at each end
    if (g > 0.01) {
      const r = A.P.r(Z);
      const ends = [boxFaces(pose, -w / 2, w / 2, h / 2 - 0.3, h / 2 + 0.6, -0.1, d).spine.q, boxFaces(pose, -w / 2, w / 2, -h / 2 - 0.6, -h / 2 + 0.3, -0.1, d).spine.q];
      els.push(
        <g key="leak" style={{ mixBlendMode: "screen" }}>
          <defs>
            <filter id={`${uid}-lk`} x="-60%" y="-200%" width="220%" height="500%">
              <feGaussianBlur stdDeviation={(1.3 * r).toFixed(3)} />
            </filter>
          </defs>
          {ends.map((q, i) => (
            <path key={i} d={poly(q.map((p) => proj(A, p)))} fill={ACCENT} opacity={0.9 * g} filter={`url(#${uid}-lk)`} />
          ))}
        </g>,
      );
    }
  } else {
    // open: two halves, each a board + a page block; the pages curve up out of the gutter and carry the light
    const H = halves(pose, open);
    const cp = camPos(A);
    type Part = { dist: number; node: React.ReactNode };
    const parts: Part[] = [];
    const centre = (q: V3[]) => mul3(q.reduce((s, p) => add3(s, p), [0, 0, 0] as V3), 1 / q.length);
    const half = (hp: BookPose, sgn: -1 | 1, key: string) => {
      const xa = sgn < 0 ? -w / 2 : 0;
      const xb = sgn < 0 ? 0 : w / 2;
      const F = boxFaces(hp, xa, xb, -h / 2, h / 2, 0, d);
      const outer = sgn < 0 ? F.left : F.right;
      const faces: Face[] = [
        { ...outer, fill: litTone(A, board, outer.n, Z, hh), key: `${key}o` },
        { ...F.spine, fill: litTone(A, board, F.spine.n, Z, hh), key: `${key}s` },
        { ...F.head, fill: edgeCol, key: `${key}h`, edge: true },
        { ...F.tail, fill: edgeCol, key: `${key}t`, edge: true },
        { ...F.fore, fill: edgeCol, key: `${key}f`, edge: true },
      ];
      faces
        .filter((f) => faceVisible(A, f))
        .forEach((f) => parts.push({ dist: Math.hypot(...sub3(centre(f.q), cp)), node: <path key={f.key} d={poly(f.q.map((p) => proj(A, p)))} fill={f.fill} stroke={ln} strokeWidth={A.lw(0.45)} strokeLinejoin="round" /> }));
      // the page: the inner face (x = 0) bulging toward the reader, dipping into the gutter at the spine
      const inner = sgn < 0 ? F.right : F.left;
      if (!faceVisible(A, { ...inner, fill: "", key: "" })) return;
      const nIn = inner.n;
      const N = 10;
      const bul = (u: number) => 2.4 * Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.15)), 0.7) * open;
      const P = (y: number, u: number): V3 => add3(F.P(0, y, u * d), mul3(nIn, bul(u)));
      const top: V3[] = [];
      const bot: V3[] = [];
      for (let i = 0; i <= N; i++) {
        top.push(P(h / 2 - 0.6, i / N));
        bot.push(P(-h / 2 + 0.6, i / N));
      }
      const q = [...top, ...bot.reverse()];
      const gA = proj(A, P(0, 0));
      const gB = proj(A, P(0, 1));
      const gid = `${uid}${key}pg`;
      const lit = (t: number) => A.toneO(mixHex(mixHex("#EFE4CC", "#FFF4DA", g), ACCENT, g * t), Z, hh);
      parts.push({
        dist: Math.hypot(...sub3(centre(q), cp)) + 0.5,
        node: (
          <g key={`${key}pg`}>
            <defs>
              <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1={gA[0].toFixed(2)} y1={gA[1].toFixed(2)} x2={gB[0].toFixed(2)} y2={gB[1].toFixed(2)}>
                <stop offset="0" stopColor={mixHex(lit(0.6), ACCENT_DEEP, 0.3)} />
                <stop offset="0.14" stopColor={lit(0.32)} />
                <stop offset="0.55" stopColor={lit(0.1)} />
                <stop offset="1" stopColor={lit(0.3)} />
              </linearGradient>
            </defs>
            <path d={poly(q.map((p) => proj(A, p)))} fill={`url(#${gid})`} stroke={mixHex(lit(0.6), ACCENT_DEEP, 0.3)} strokeWidth={A.lw(0.35)} strokeLinejoin="round" />
          </g>
        ),
      });
    };
    half(H.L, -1, "L");
    half(H.R, 1, "R");
    parts.sort((a, b) => b.dist - a.dist);
    parts.forEach((p) => els.push(p.node));
  }
  // the light in the air round the book: strongest from open pages, a small warm leak when closed (screen)
  const gl = g * light;
  if (gl > 0.01) {
    const ctr = proj(A, add3(pose.c, mul3(pose.ez, d * (open > 0.02 ? 0.45 : 0.5))));
    const R = lerp(70, 165, open) * A.P.r(Z);
    const a = gl * lerp(0.2, 0.5, open);
    els.push(
      <g key="glow" style={{ mixBlendMode: "screen" }}>
        <defs>
          <radialGradient id={`${uid}-gl`}>
            <stop offset="0" stopColor={ACCENT} stopOpacity={a} />
            <stop offset="0.3" stopColor={ACCENT} stopOpacity={a * 0.5} />
            <stop offset="0.65" stopColor={ACCENT} stopOpacity={a * 0.16} />
            <stop offset="1" stopColor={ACCENT} stopOpacity={0} />
          </radialGradient>
        </defs>
        <ellipse cx={ctr[0]} cy={ctr[1]} rx={R} ry={R * 1.08} fill={`url(#${uid}-gl)`} />
      </g>,
    );
  }
  return <g>{els}</g>;
};

/** the orange light round a shelved glowing book: thin bright leaks at the spine's sides and over its head, and a
 *  soft warm falloff over the neighbouring spines (screen; the medium's bloom does the rest) */
export const ShelfGlow: React.FC<{ A: AirWorld; X: number; Y: number; Z: number; amt: number; uid: string; w?: number; h?: number; spread?: number }> = ({ A, X, Y, Z, amt, uid, w = VB.w, h = VB.h, spread = 1 }) => {
  if (amt <= 0.005) return null;
  const P = A.P;
  const r = P.r(Z);
  const ctr = P.p(X, Y - h * 0.55, Z);
  const L0 = P.p(X - w / 2 - 0.5, Y - h, Z);
  const R0 = P.p(X + w / 2 + 0.5, Y, Z);
  return (
    <g style={{ mixBlendMode: "screen" }}>
      <defs>
        <radialGradient id={`${uid}-sg`}>
          <stop offset="0" stopColor={ACCENT} stopOpacity={Math.min(0.9, 0.55 * amt)} />
          <stop offset="0.3" stopColor={ACCENT} stopOpacity={Math.min(0.5, 0.26 * amt)} />
          <stop offset="1" stopColor={ACCENT} stopOpacity={0} />
        </radialGradient>
        <filter id={`${uid}-sb`} x="-50%" y="-20%" width="200%" height="140%">
          <feGaussianBlur stdDeviation={1.7 * r} />
        </filter>
      </defs>
      <ellipse cx={ctr[0]} cy={ctr[1]} rx={46 * r * spread} ry={40 * r * spread} fill={`url(#${uid}-sg)`} />
      <g filter={`url(#${uid}-sb)`} opacity={Math.min(1, 0.9 * amt)}>
        <rect x={L0[0] - w * 0.9 * r} y={L0[1] - 1.6 * r} width={(R0[0] - L0[0]) + w * 1.8 * r} height={2 * r} fill={ACCENT} />
        <rect x={L0[0] - w * 0.6 * r} y={R0[1] - 0.6 * r} width={(R0[0] - L0[0]) + w * 1.2 * r} height={1.6 * r} fill={ACCENT} />
      </g>
    </g>
  );
};

// ===================================================================================================================
// THE STAGE
// ===================================================================================================================
export type LibItem = { Z: number; key: string; node: () => React.ReactNode };
const PLASTER: Mat = { lit: "#A39782", mid: "#7E7462", dark: "#463E34" };
const VAULT: Mat = { lit: "#87694A", mid: "#5C4632", dark: "#2E2219" };
const FLOOR: Mat = { lit: "#8A7A5C", mid: "#6E604A", dark: "#3A3128" };
const WINDOW_LIGHT = "#E4EBDC";

/** world-anchored light shafts from the left clerestory windows, falling to the right into the aisle */
const SHAFT_DIR = norm3([1.08, 1, 0.16]);
const shaftQuad = (A: AirWorld, zc: number, wz: number) => {
  const X = -HALL.wallX;
  const ends: V3[] = [];
  const tops: V3[] = [];
  for (const [Y, Z] of [
    [HALL.win[0], zc - wz / 2],
    [HALL.win[0], zc + wz / 2],
    [HALL.win[1], zc - wz / 2],
    [HALL.win[1], zc + wz / 2],
  ] as [number, number][]) {
    const p: V3 = [X, Y, Z];
    const L = -Y / SHAFT_DIR[1];
    tops.push(p);
    ends.push(add3(p, mul3(SHAFT_DIR, L)));
  }
  return { tops, ends, pts: [...tops, ...ends].map((p) => proj(A, p)) };
};
const hull = (pts: P2[]): P2[] => {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o: P2, a: P2, b: P2) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo: P2[] = [];
  for (const q of p) {
    while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
    lo.push(q);
  }
  const up: P2[] = [];
  for (const q of p.reverse()) {
    while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop();
    up.push(q);
  }
  return [...lo.slice(0, -1), ...up.slice(0, -1)];
};

/** clip a convex polygon to a rect (Sutherland-Hodgman): keeps a blurred shaft's box small */
const clipRect = (pts: P2[], x0: number, y0: number, x1: number, y1: number): P2[] => {
  let out = pts;
  const edges: [(p: P2) => boolean, (a: P2, b: P2) => P2][] = [
    [(p) => p[0] >= x0, (a, b) => [x0, a[1] + ((b[1] - a[1]) * (x0 - a[0])) / (b[0] - a[0])]],
    [(p) => p[0] <= x1, (a, b) => [x1, a[1] + ((b[1] - a[1]) * (x1 - a[0])) / (b[0] - a[0])]],
    [(p) => p[1] >= y0, (a, b) => [a[0] + ((b[0] - a[0]) * (y0 - a[1])) / (b[1] - a[1]), y0]],
    [(p) => p[1] <= y1, (a, b) => [a[0] + ((b[0] - a[0]) * (y1 - a[1])) / (b[1] - a[1]), y1]],
  ];
  for (const [inside, cut] of edges) {
    const src = out;
    out = [];
    for (let i = 0; i < src.length; i++) {
      const a = src[(i + src.length - 1) % src.length];
      const b = src[i];
      if (inside(b)) {
        if (!inside(a)) out.push(cut(a, b));
        out.push(b);
      } else if (inside(a)) out.push(cut(a, b));
    }
    if (!out.length) return out;
  }
  return out;
};

/** a soft-edged shaft without a blur filter (filters on big areas are slow): four copies of the polygon pushed out
 *  across the shaft's axis (a -> b) by -1/3, 0, +1/3, +2/3 of `w`, each a quarter strong */
const feather = (q: P2[], a: P2, b: P2, w: number): P2[][] => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L;
  const ny = dx / L;
  return [-1 / 3, 0, 1 / 3, 2 / 3].map((t) =>
    q.map((p) => {
      const side = Math.sign((p[0] - a[0]) * nx + (p[1] - a[1]) * ny) || 1;
      return [p[0] + side * nx * w * t, p[1] + side * ny * w * t] as P2;
    }),
  );
};

export const LibraryStage: React.FC<{ A: AirWorld; frame: number; extra?: LibItem[]; heroLive?: boolean; uid?: string; shafts?: number }> = ({ A, frame, extra = [], heroLive = true, uid = "lib", shafts = 1 }) => {
  const tex = useShelfTextures();
  const P = A.P;
  const cam = A.cam;
  const Dc = A.Dc;
  const lw = (b: number, Z: number) => b * P.r(Z);
  const items: LibItem[] = [...extra];
  const back: React.ReactNode[] = [];
  // the visible X span at depth Z (with a margin, px)
  const xSpan = (Z: number, m = 60) => {
    const r = P.r(Z);
    return [cam.cx - (540 + m) / (cam.k * r), cam.cx + (540 + m) / (cam.k * r)] as const;
  };
  const ySpan = (Z: number, m = 60) => {
    const r = P.r(Z);
    const y0 = cam.cy - (960 + m) / cam.k;
    const y1 = cam.cy + (960 + m) / cam.k;
    return [P.opts.eyeY + (y0 - P.opts.eyeY) / r, P.opts.eyeY + (y1 - P.opts.eyeY) / r] as const;
  };

  // ---------------------------------------------------------------- the shell: end wall, side walls, vault, windows
  const zE = HALL.zEnd;
  {
    // the end wall and its tall window (the brightest air at the far end)
    const [ya, yb] = [HALL.springY - HALL.vaultH, 0];
    const ew = A.tone(PLASTER.mid, zE, 600);
    back.push(<path key="ew" d={poly([P.p(-HALL.wallX, ya, zE), P.p(HALL.wallX, ya, zE), P.p(HALL.wallX, yb, zE), P.p(-HALL.wallX, yb, zE)])} fill={ew} />);
    const wx = 230;
    const wy0 = -1240;
    const wy1 = -120;
    const arc = Array.from({ length: 13 }, (_, i) => {
      const t = Math.PI - (Math.PI * i) / 12;
      return P.p(wx * Math.cos(t), wy0 - wx * 0.9 * Math.sin(t), zE);
    });
    const wcol = mixHex(WINDOW_LIGHT, A.airHex(zE, 700), 0.45);
    back.push(<path key="ewin" d={poly([P.p(-wx, wy1, zE), ...arc, P.p(wx, wy1, zE)])} fill={wcol} />);
    const mull = A.tone(PLASTER.dark, zE, 600);
    back.push(
      <path
        key="ewm"
        d={`M${Pt(P.p(0, wy1, zE))}L${Pt(P.p(0, wy0 - wx * 0.9, zE))}M${Pt(P.p(-wx, -800, zE))}L${Pt(P.p(wx, -800, zE))}M${Pt(P.p(-wx, -460, zE))}L${Pt(P.p(wx, -460, zE))}`}
        stroke={mull}
        strokeWidth={lw(12, zE)}
        strokeOpacity={0.5}
      />,
    );
  }
  // side walls (X = +-wallX) in depth bands, the clerestory windows in them
  const NZ = 22;
  const zA = Math.max(HALL.zFront, P.zNear + 40);
  const zAt = (i: number) => lerp(zA, zE, Math.pow(i / NZ, 1.5));
  for (const s of [-1, 1]) {
    const X = s * HALL.wallX;
    const m = s < 0 ? { lit: PLASTER.mid, mid: PLASTER.mid, dark: PLASTER.dark } : PLASTER;
    for (let i = 0; i < NZ; i++) {
      const za = zAt(i);
      const zb = zAt(i + 1) + 2;
      const zm = (za + zb) / 2;
      back.push(<path key={`w${s}${i}`} d={poly([P.p(X, HALL.springY, za), P.p(X, HALL.springY, zb), P.p(X, 0, zb), P.p(X, 0, za)])} fill={A.tone(s < 0 ? m.mid : mixHex(m.lit, m.mid, 0.4), zm, 700)} />);
    }
    for (let i = -6; i < HALL.N; i++) {
      const zc = stackZ(i) + HALL.BAY / 2;
      if (zc < zA + 100 || zc > zE - 100) continue;
      const wz = 150;
      const q = [P.p(X, HALL.win[0], zc - wz / 2), P.p(X, HALL.win[0], zc + wz / 2), P.p(X, HALL.win[1], zc + wz / 2), P.p(X, HALL.win[1], zc - wz / 2)];
      back.push(<path key={`win${s}${i}`} d={poly(q)} fill={mixHex(WINDOW_LIGHT, A.airHex(zc, 1150), 0.25 + 0.6 * A.fog(zc))} />);
      back.push(<path key={`winm${s}${i}`} d={`M${Pt(P.p(X, HALL.win[0], zc))}L${Pt(P.p(X, HALL.win[1], zc))}`} stroke={A.tone(PLASTER.dark, zc, 1100)} strokeWidth={lw(6, zc)} strokeOpacity={0.55} />);
    }
  }
  // the vault: an elliptical barrel over the whole hall, in depth bands x around-bands, ribs at every stack
  {
    const NT = 12;
    const vp = (t: number, Z: number) => P.p(-HALL.wallX * Math.cos(t), HALL.springY - HALL.vaultH * Math.sin(t), Z);
    for (let i = 0; i < NZ; i++) {
      const za = zAt(i);
      const zb = zAt(i + 1) + 2;
      const zm = (za + zb) / 2;
      for (let j = 0; j < NT; j++) {
        const ta = (Math.PI * j) / NT;
        const tb = (Math.PI * (j + 1)) / NT + 0.01;
        // the vault's right half faces the left windows: a little lighter
        const lt = 0.25 + 0.5 * c01((ta - 0.6) / 2.2);
        const col = A.tone(mixHex(VAULT.dark, VAULT.mid, lt), zm, 1600);
        back.push(<path key={`v${i}-${j}`} d={poly([vp(ta, za), vp(tb, za), vp(tb, zb), vp(ta, zb)])} fill={col} />);
      }
    }
    // the purlins: timber lines along the vault at a few angles, in depth pieces fading with the fog
    for (const t of [0.18, 0.42, 0.72, 1.0, 1.28, 1.57, 1.86, 2.14, 2.42, 2.72, 2.96]) {
      for (let i = 0; i < NZ; i++) {
        const za = zAt(i);
        const zb = zAt(i + 1);
        const zm = (za + zb) / 2;
        back.push(<path key={`pu${t}-${i}`} d={`M${Pt(vp(t, za))}L${Pt(vp(t, zb))}`} stroke={A.tone(VAULT.dark, zm, 1600)} strokeWidth={lw(9, zm)} strokeOpacity={0.55 * (1 - A.fog(zm))} />);
      }
    }
    for (let i = -6; i <= HALL.N; i++) {
      const Z = stackZ(i);
      if (Z < zA + 50 || Z > zE) continue;
      let d = "";
      for (let j = 0; j <= 24; j++) d += `${j ? "L" : "M"}${Pt(vp((Math.PI * j) / 24, Z))}`;
      back.push(<path key={`rib${i}`} d={d} fill="none" stroke={A.tone(VAULT.mid, Z, 1600)} strokeWidth={lw(22, Z)} strokeOpacity={0.75} />);
    }
  }

  // ---------------------------------------------------------------- the floor
  const floor = <AirFloor A={A} x0={-HALL.wallX} x1={HALL.wallX} z0={HALL.zFront} z1={zE} mat={FLOOR} course={210} plank={52} melt={0.18} jointAmt={0.7} />;

  // ---------------------------------------------------------------- the stacks
  const caseFace = (row: RowRef, key: string): React.ReactNode => {
    const zf = stackZ(row.stack);
    const yT = levelTopY(row.level);
    const yB = yT + CASE_H;
    const fx0 = faceX0(row.side);
    const [vx0, vx1] = xSpan(zf);
    const [vy0, vy1] = ySpan(zf);
    if (yB < vy0 || yT > vy1) return null;
    // occlusion by the nearer stack on the same side (its aisle end at +-AW, its back at Z - BAY + T)
    let ox0 = -Infinity;
    let ox1 = Infinity;
    if (row.stack > 0) {
      const zb = zf - HALL.BAY + HALL.T;
      const s = row.side === "L" ? -1 : 1;
      const Xo = cam.cx + (s * HALL.AW - cam.cx) * ((Dc + zf) / (Dc + zb));
      if (s < 0) ox0 = Xo;
      else ox1 = Xo;
    }
    const secs: React.ReactNode[] = [];
    for (let sI = 0; sI < NSEC; sI++) {
      const x0 = fx0 + sI * SEC_W;
      const x1 = x0 + SEC_W;
      if (x1 < vx0 || x0 > vx1 || x1 < ox0 - 2 || x0 > ox1 + 2) continue;
      const a = P.p(x0, yT, zf);
      const b = P.p(x1, yB, zf);
      if (isHero(row, sI) && heroLive) {
        const sc = (b[0] - a[0]) / SEC_W;
        secs.push(
          <g key={`s${sI}`} transform={`translate(${a[0].toFixed(3)} ${a[1].toFixed(3)}) scale(${sc.toFixed(6)})`}>
            <ShelfSectionArt books={sectionBooks(row, sI)} uid={`${uid}${key}h${sI}`} />
          </g>,
        );
      } else {
        const url = tex.get(variantOf(row, sI));
        if (url) secs.push(<image key={`s${sI}`} href={url} x={a[0]} y={a[1]} width={b[0] - a[0] + 0.05} height={b[1] - a[1]} preserveAspectRatio="none" />);
      }
    }
    if (!secs.length) return null;
    const a = P.p(fx0, yT, zf);
    const b = P.p(fx0 + HALL.SL, yB, zf);
    const fz = A.fog(zf);
    const gid = `${uid}${key}fg`;
    return (
      <g key={`f${key}`}>
        {secs}
        <defs>
          <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1="0" y1={a[1].toFixed(2)} x2="0" y2={b[1].toFixed(2)}>
            <stop offset="0" stopColor={A.airHex(zf, -yT)} stopOpacity={fz} />
            <stop offset="1" stopColor={A.airHex(zf, -yB)} stopOpacity={fz} />
          </linearGradient>
          <linearGradient id={`${gid}o`} gradientUnits="userSpaceOnUse" x1="0" y1={a[1].toFixed(2)} x2="0" y2={b[1].toFixed(2)}>
            <stop offset="0" stopColor="#F3EBDD" stopOpacity={0.05 * (1 - fz)} />
            <stop offset="0.45" stopColor="#22180F" stopOpacity={0} />
            <stop offset="1" stopColor="#22180F" stopOpacity={(row.level === 0 ? 0.22 : 0.12) * (1 - fz)} />
          </linearGradient>
        </defs>
        <rect x={a[0]} y={a[1]} width={b[0] - a[0]} height={b[1] - a[1]} fill={`url(#${gid}o)`} />
        <rect x={a[0]} y={a[1]} width={b[0] - a[0]} height={b[1] - a[1]} fill={`url(#${gid})`} />
      </g>
    );
  };

  for (const side of ["L", "R"] as Side[]) {
    const s = side === "L" ? -1 : 1;
    const X0 = side === "L" ? -HALL.wallX : HALL.AW;
    const X1 = side === "L" ? -HALL.AW : HALL.wallX;
    const Xe = s * HALL.AW; // the aisle end
    for (let i = HALL.N - 1; i >= 0; i--) {
      const zf = stackZ(i);
      if (zf + HALL.BAY < P.zNear) continue;
      const zNext = i < HALL.N - 1 ? stackZ(i + 1) : HALL.zEnd;
      const key = `${side}${i}`;
      const [vx0, vx1] = xSpan(zf, 400);
      if (X1 < vx0 || X0 > vx1) continue;
      items.push({
        Z: zf,
        key: `st${key}`,
        node: () => (
          <g key={`st${key}`}>
            {/* lower case, deck over the bay, upper case, cap */}
            <AirBox A={A} X0={X0} X1={X1} Y0={HALL.low[0]} Y1={HALL.low[1]} Z0={zf} Z1={zf + HALL.T} mat={OAK} uid={`${uid}lc${key}`} rim={0.6} />
            {caseFace({ side, stack: i, level: 0 }, `${key}a`)}
            <AirBox A={A} X0={X0} X1={X1} Y0={HALL.deck[0]} Y1={HALL.deck[1]} Z0={zf} Z1={zNext} mat={OAK} uid={`${uid}dk${key}`} rim={0.8} />
            <AirBox A={A} X0={X0} X1={X1} Y0={HALL.up[0]} Y1={HALL.up[1]} Z0={zf} Z1={zf + HALL.T} mat={OAK} uid={`${uid}uc${key}`} rim={0.6} />
            {caseFace({ side, stack: i, level: 1 }, `${key}b`)}
            <AirBox A={A} X0={X0 - (s < 0 ? 6 : 0)} X1={X1 + (s > 0 ? 6 : 0)} Y0={HALL.cap[0]} Y1={HALL.cap[1]} Z0={zf - 7} Z1={zf + HALL.T + 7} mat={OAK} uid={`${uid}cp${key}`} />
            {/* the pilasters at the aisle end, both levels */}
            <AirBox A={A} X0={Xe - (s < 0 ? 12 : -2)} X1={Xe + (s < 0 ? 2 : 12)} Y0={HALL.low[0] + 4} Y1={0} Z0={zf - 6} Z1={zf + HALL.T + 6} mat={OAK} uid={`${uid}pl${key}`} />
            <AirBox A={A} X0={Xe - (s < 0 ? 12 : -2)} X1={Xe + (s < 0 ? 2 : 12)} Y0={HALL.up[0] + 4} Y1={HALL.up[1]} Z0={zf - 6} Z1={zf + HALL.T + 6} mat={OAK} uid={`${uid}pu${key}`} />
          </g>
        ),
      });
      // the gallery railing along the aisle edge over this bay (and across the front of stack 0)
      items.push({
        Z: zf - 1,
        key: `rl${key}`,
        node: () => {
          const yD = HALL.deck[0];
          const yTop = yD - 168;
          const Xr = Xe - s * 6;
          let posts = "";
          const za = zf - 4;
          const zb = zNext - 4;
          for (let n = 0; n <= 6; n++) {
            const Z = lerp(za, zb, n / 6);
            posts += `M${Pt(P.p(Xr, yD, Z))}L${Pt(P.p(Xr, yTop, Z))}`;
          }
          const rails = `M${Pt(P.p(Xr, yTop, za))}L${Pt(P.p(Xr, yTop, zb))}M${Pt(P.p(Xr, yD - 22, za))}L${Pt(P.p(Xr, yD - 22, zb))}`;
          const zm = (za + zb) / 2;
          const col = A.tone(OAK.mid, zm, 560);
          const els = [<path key="p" d={posts} stroke={col} strokeWidth={lw(5, zm)} />, <path key="r" d={rails} stroke={A.tone(OAK.lit, zm, 620)} strokeWidth={lw(7, zm)} strokeLinecap="round" />];
          if (i === 0) {
            // the front balustrade over stack 0's face
            let fp = "";
            const zF = zf - 5;
            for (let n = 0; n <= 18; n++) {
              const X = lerp(X0, X1, n / 18);
              fp += `M${Pt(P.p(X, yD, zF))}L${Pt(P.p(X, yTop, zF))}`;
            }
            const fr = `M${Pt(P.p(X0, yTop, zF))}L${Pt(P.p(Xr, yTop, zF))}M${Pt(P.p(X0, yD - 22, zF))}L${Pt(P.p(Xr, yD - 22, zF))}`;
            els.push(<path key="fp" d={fp} stroke={A.tone(OAK.mid, zF, 560)} strokeWidth={lw(5, zF)} />);
            els.push(<path key="fr" d={fr} stroke={A.tone(OAK.lit, zF, 620)} strokeWidth={lw(7, zF)} strokeLinecap="round" />);
          }
          return <g key={`rl${key}`}>{els}</g>;
        },
      });
    }
  }

  // ---------------------------------------------------------------- tables, benches, lectern, ladders
  TABLES.forEach((t, i) => {
    if (t.z1 < P.zNear + 50) return;
    const [vx0, vx1] = xSpan(t.z0, 200);
    if (TABLE.hw < vx0 || -TABLE.hw > vx1) return;
    items.push({
      Z: t.z0 - 2,
      key: `tb${i}`,
      node: () => (
        <g key={`tb${i}`}>
          {[-1, 1].map((s) => (
            <g key={s}>
              <AirShadow A={A} X={s * BENCH_X} Z={(t.z0 + t.z1) / 2} w={34} d={(t.z1 - t.z0) * 0.55} uid={`${uid}bs${i}${s}`} amt={0.5} />
              <AirBox A={A} X0={s * BENCH_X - 16} X1={s * BENCH_X + 16} Y0={-84} Y1={-76} Z0={t.z0 + 10} Z1={t.z1 - 10} mat={OAK} uid={`${uid}bn${i}${s}`} />
              <AirBox A={A} X0={s * BENCH_X - 12} X1={s * BENCH_X + 12} Y0={-76} Y1={0} Z0={t.z0 + 22} Z1={t.z0 + 30} mat={OAK} uid={`${uid}bl${i}${s}`} rim={0} />
              <AirBox A={A} X0={s * BENCH_X - 12} X1={s * BENCH_X + 12} Y0={-76} Y1={0} Z0={t.z1 - 30} Z1={t.z1 - 22} mat={OAK} uid={`${uid}bm${i}${s}`} rim={0} />
            </g>
          ))}
          <AirShadow A={A} X={0} Z={(t.z0 + t.z1) / 2} w={TABLE.hw * 1.1} d={(t.z1 - t.z0) * 0.55} uid={`${uid}ts${i}`} amt={0.55} />
          {[t.z1 - 16, t.z0 + 8].map((z, j) =>
            [-1, 1].map((s) => <AirBox key={`${j}${s}`} A={A} X0={s * (TABLE.hw - 8) - 5} X1={s * (TABLE.hw - 8) + 5} Y0={TABLE.y + TABLE.th} Y1={0} Z0={z} Z1={z + 8} mat={OAK} uid={`${uid}tl${i}${j}${s}`} rim={0} />),
          )}
          <AirBox A={A} X0={-TABLE.hw} X1={TABLE.hw} Y0={TABLE.y} Y1={TABLE.y + TABLE.th} Z0={t.z0} Z1={t.z1} mat={OAK} uid={`${uid}tt${i}`} />
        </g>
      ),
    });
  });
  // the lectern: a post on a foot, a slanted desk toward +Z (the reader stands behind it, facing us)
  items.push({
    Z: LECTERN.Z - LECTERN.d / 2,
    key: "lect",
    node: () => {
      const { X, Z, topY, w, d } = LECTERN;
      const deskF: V3[] = [
        [X - w / 2, topY + 16, Z - d / 2],
        [X + w / 2, topY + 16, Z - d / 2],
        [X + w / 2, topY - 12, Z + d / 2],
        [X - w / 2, topY - 12, Z + d / 2],
      ];
      const top = poly(deskF.map((p) => proj(A, p)));
      const frontQ: V3[] = [deskF[0], deskF[1], [X + w / 2, topY + 30, Z - d / 2], [X - w / 2, topY + 30, Z - d / 2]];
      return (
        <g key="lect">
          <AirShadow A={A} X={X} Z={Z} w={46} d={34} uid={`${uid}lcs`} amt={0.7} />
          <AirBox A={A} X0={X - 26} X1={X + 26} Y0={-12} Y1={0} Z0={Z - 20} Z1={Z + 20} mat={OAK} uid={`${uid}lcf`} />
          <AirBox A={A} X0={X - 8} X1={X + 8} Y0={topY + 26} Y1={-12} Z0={Z - 7} Z1={Z + 7} mat={OAK} uid={`${uid}lcp`} />
          <path d={top} fill={A.tone(OAK.lit, Z, -topY)} stroke={A.tone(OAK.dark, Z, -topY)} strokeWidth={A.lw(0.8)} />
          <path d={poly(frontQ.map((p) => proj(A, p)))} fill={A.tone(OAK.mid, Z, -topY)} stroke={A.tone(OAK.dark, Z, -topY)} strokeWidth={A.lw(0.8)} />
          <path d={`M${Pt(proj(A, deskF[0]))}L${Pt(proj(A, deskF[1]))}`} stroke="#F3EBDD" strokeOpacity={0.4} strokeWidth={A.lw(1)} />
        </g>
      );
    },
  });
  LADDERS.forEach((l, i) => {
    const zf = stackZ(l.stack);
    const zBot = zf - 92;
    const zTop = zf - 6;
    const yTop = HALL.low[0] + 6;
    const [vx0, vx1] = xSpan(zf, 200);
    if (l.X + 40 < vx0 || l.X - 40 > vx1) return;
    items.push({
      Z: zBot,
      key: `ld${i}`,
      node: () => {
        const rail = (dx: number) => `M${Pt(P.p(l.X + dx, 0, zBot))}L${Pt(P.p(l.X + dx, yTop, zTop))}`;
        let rungs = "";
        for (let n = 1; n <= 10; n++) {
          const t = n / 10.6;
          const Y = lerp(0, yTop, t);
          const Z = lerp(zBot, zTop, t);
          rungs += `M${Pt(P.p(l.X - 24, Y, Z))}L${Pt(P.p(l.X + 24, Y, Z))}`;
        }
        const zm = (zBot + zTop) / 2;
        const wheel = (dx: number) => {
          const c = P.p(l.X + dx, -7, zBot);
          return <circle key={dx} cx={c[0]} cy={c[1]} r={7 * P.r(zBot)} fill={A.tone("#4A4440", zBot, 10)} />;
        };
        return (
          <g key={`ld${i}`}>
            <AirShadow A={A} X={l.X} Z={zBot + 30} w={40} d={50} uid={`${uid}lds${i}`} amt={0.5} />
            <path d={rungs} stroke={A.tone(OAK.mid, zm, 220)} strokeWidth={lw(4.5, zm)} />
            <path d={rail(-26) + rail(26)} stroke={A.tone(OAK.lit, zm, 220)} strokeWidth={lw(7, zm)} strokeLinecap="round" />
            {wheel(-26)}
            {wheel(26)}
          </g>
        );
      },
    });
  });

  // ---------------------------------------------------------------- shafts (screen light in the air, world-anchored)
  if (shafts > 0) {
    for (let i = -2; i < HALL.N; i++) {
      const zc = stackZ(i) + HALL.BAY / 2;
      if (zc < P.zNear + 200 || zc > zE - 200) continue;
      const sq = shaftQuad(A, zc, 140);
      const h = clipRect(hull(sq.pts), cam.cx - 640 / cam.k, cam.cy - 1060 / cam.k, cam.cx + 640 / cam.k, cam.cy + 1060 / cam.k);
      if (h.length < 3) continue;
      const top = proj(A, [-HALL.wallX, HALL.win[0], zc]);
      const bot = proj(A, add3([-HALL.wallX, HALL.win[1], zc], mul3(SHAFT_DIR, -HALL.win[1] / SHAFT_DIR[1])));
      const sway = 0.82 + 0.18 * Math.sin(frame * 0.021 + i * 1.7);
      const amt = shafts * sway * Math.pow(1 - A.fog(zc), 2.6) * (i < 0 ? 0.32 : 1) * (0.75 + (0.5 * (((i * 37) % 7) + 7)) / 14);
      const gid = `${uid}sh${i}`;
      items.push({
        Z: zc - 60,
        key: `sh${i}`,
        node: () => (
          <g key={gid} style={{ mixBlendMode: "screen" }}>
            <defs>
              <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1={top[0].toFixed(1)} y1={top[1].toFixed(1)} x2={bot[0].toFixed(1)} y2={bot[1].toFixed(1)}>
                <stop offset="0" stopColor="#F3EBDD" stopOpacity={0.55 * amt} />
                <stop offset="0.6" stopColor="#F3EBDD" stopOpacity={0.45 * amt} />
                <stop offset="1" stopColor="#F3EBDD" stopOpacity={0.26 * amt} />
              </linearGradient>
            </defs>
            {feather(h, top, bot, 16 / cam.k).map((q, j) => (
              <path key={j} d={poly(q)} fill={`url(#${gid})`} opacity={0.33} />
            ))}
          </g>
        ),
      });
    }
  }

  items.sort((a, b) => b.Z - a.Z);
  return (
    <g>
      {back}
      {floor}
      {items.map((it) => (
        <React.Fragment key={it.key}>{it.node()}</React.Fragment>
      ))}
    </g>
  );
};

// re-exported helpers for the cuts
export { ACCENT, ACCENT_DEEP, ORANGE_LINE, hexRgb, rgbHex };
export const vec3 = { add3, mul3, sub3, dot3, norm3, cross3, rot3 };
