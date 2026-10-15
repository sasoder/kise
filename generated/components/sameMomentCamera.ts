// SameMoment (Sarah Paine, Pearl Harbor clip, cut F) — the camera, the markers
// and the label layout: pure maths (no React), so the check scripts read exactly
// what the component draws.
//
// THE CAMERA (round 2): one continuous camera, composed of three zooms IN about
// fixed screen points (each by a smooth factor, so the composite is C1, never
// chases, and every point in frame only ever moves away from the pivots):
//   1. THE WIDE (f0 -> ~f40): the whole theatre from Malaya to Hawaii, drifting
//      in +6% about the band's middle while all eight strikes fly and land.
//   2. THE MOVE (~f32 -> ~f74): west and in (x1.17) about a point far off the
//      left edge: Hawaii slides out to the right, the Asian theatre fills the
//      frame (Malaya readable well before "Malaya", f64).
//   3. THE PUSH (from ~f46, through the list, still moving on the last frame):
//      k +15% about the Malay cluster, which holds while the east drifts out.
// World px = the kit's PACIFIC world (pearlPacificMapData).
import { TARGETS, project } from "./pearlPacificMapData";

export const FPS = 24;
// the slot: sequence 00:01:28:19 - 00:01:39:11 = frames 2131..2387 at 24 fps
// = 256 frames, + 12 frames of living tail (the editor trims) = 268.
export const SLOT = 256;
export const DURATION = SLOT + 12;
export const LAST = DURATION - 1;

/** word onsets, local frames (±3 f) */
export const W = {
  that: 0,
  japanese: 10,
  attack: 23,
  pearl: 28,
  harbor: 38,
  they: 47,
  also: 50,
  attack2: 57,
  malaya: 64,
  philippines: 82,
  singapore: 104,
  wake: 129,
  island: 134,
  guam: 151,
  thailand: 169,
  international: 189,
  settlement: 208,
  in: 224,
  shanghai: 233,
  cut: 256,
};

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const smoothstep = (v: number) => {
  const x = clamp01(v);
  return x * x * (3 - 2 * x);
};
const smootherstep = (v: number) => {
  const x = clamp01(v);
  return x * x * x * (x * (x * 6 - 15) + 10);
};

export type Cam = { x: number; y: number; k: number };
type XY = { x: number; y: number };

// ---------------------------------------------------------------------------
// tunables
// ---------------------------------------------------------------------------
export const TUNE = {
  // THE END FRAME (f267): zoom KE, Singora at x SX, Shanghai at y SHY
  KE: 1.447,
  SX: 150,
  SHY: 597,
  // the push (stage 3): factor PUSH about (QPx, QPy), ramping in pa..pb
  PUSH: 1.15,
  QPx: 150,
  QPy: 813,
  pa: 46,
  pb: 80,
  // the move (stage 2): factor MOVE about (QMx, QMy): rise ma..mb, fall mc..md
  MOVE: 1.166,
  QMx: -587,
  QMy: 800,
  ma: 32,
  mb: 44,
  mc: 46,
  md: 74,
  // the wide's drift (stage 1): factor DRIFT about (540, QDy), fading out da..db
  DRIFT: 1.06,
  QDy: 800,
  da: 30,
  db: 46,
};

/** compose: the camera `cam`, then a zoom by factor g about screen point q */
const zoomAbout = (cam: Cam, g: number, q: XY): Cam => {
  const k = cam.k * g;
  return { x: cam.x + ((540 - q.x) * (1 - g)) / k, y: cam.y + ((960 - q.y) * (1 - g)) / k, k };
};
/** the camera that `zoomAbout(·, g, q)` turns into `cam` */
const unzoomAbout = (cam: Cam, g: number, q: XY): Cam => ({ x: cam.x - ((540 - q.x) * (1 - g)) / cam.k, y: cam.y - ((960 - q.y) * (1 - g)) / cam.k, k: cam.k / g });

/** integrate a rate profile r(f) >= 0 into a 0..1 table (1 at `end`) */
const table = (rate: (f: number) => number, end: number) => {
  const n = LAST + 2;
  const t = new Float64Array(n);
  for (let f = 1; f < n; f++) t[f] = t[f - 1] + rate(f - 0.5);
  const tot = t[Math.min(n - 1, end)];
  return (f: number) => {
    const x = Math.max(0, Math.min(n - 1.001, f));
    const i = Math.floor(x);
    return Math.min(1, (t[i] + (t[i + 1] - t[i]) * (x - i)) / tot);
  };
};

export const buildTrack = (tune = TUNE) => {
  const SING = TARGETS.singora;
  const SHA = TARGETS.shanghai;
  const CE: Cam = { x: SING[0] + (540 - tune.SX) / tune.KE, y: SHA[1] + (960 - tune.SHY) / tune.KE, k: tune.KE };
  const QP = { x: tune.QPx, y: tune.QPy };
  const QM = { x: tune.QMx, y: tune.QMy };
  const QD = { x: 540, y: tune.QDy };
  const CA = unzoomAbout(CE, tune.PUSH, QP); // the theatre, before the push
  const CW = unzoomAbout(CA, tune.MOVE, QM); // the wide, after its drift
  const C0 = unzoomAbout(CW, tune.DRIFT, QD); // frame 0
  // rates: the drift runs from frame 0 (already moving) and hands over to the
  // move; the push takes over from the move; never a held frame
  const driftU = table((f) => 1 - smoothstep((f - tune.da) / (tune.db - tune.da)), tune.db);
  const moveU = table((f) => smoothstep((f - tune.ma) / (tune.mb - tune.ma)) * (1 - smootherstep((f - tune.mc) / (tune.md - tune.mc))), tune.md);
  const pushU = table((f) => smoothstep((f - tune.pa) / (tune.pb - tune.pa)), LAST);
  const at = (f: number): Cam => {
    let cam = zoomAbout(C0, Math.exp(Math.log(tune.DRIFT) * driftU(f)), QD);
    cam = zoomAbout(cam, Math.exp(Math.log(tune.MOVE) * moveU(f)), QM);
    cam = zoomAbout(cam, Math.exp(Math.log(tune.PUSH) * pushU(f)), QP);
    return cam;
  };
  return { at, C0, CW, CA, CE, QP, QM };
};

const TRACK = buildTrack();
export const CAM_TRACK: Cam[] = Array.from({ length: DURATION + 1 }, (_, f) => TRACK.at(f));
export const camAt = (frame: number): Cam => {
  const f = Math.max(0, Math.min(DURATION, frame));
  const i = Math.floor(f);
  if (f - i < 1e-6 || i >= DURATION) return CAM_TRACK[i];
  return TRACK.at(f);
};

// ---------------------------------------------------------------------------
// MARKERS: where each strike lands and its ring sits. Singora and Kota Bharu are
// ~160 km apart: their rings would overlap, so the two markers are displaced
// ~80 km apart along the coast (Singora NW toward Nakhon Si Thammarat, Kota Bharu
// SE toward Besut), a cartographic offset. The Malaya convoy's tracks end there.
// ---------------------------------------------------------------------------
export type MarkId = "pearlHarbor" | "kotaBharu" | "singora" | "singapore" | "clarkField" | "wake" | "guam" | "shanghai";
export const MARK_LL: Record<MarkId, [number, number]> = {
  pearlHarbor: [-157.97, 21.35],
  kotaBharu: [102.9, 5.4],
  singora: [100.1, 8.1],
  singapore: [103.85, 1.29],
  clarkField: [120.56, 15.18],
  wake: [166.65, 19.28],
  guam: [144.79, 13.44],
  shanghai: [121.49, 31.24],
};
export const MARKS = Object.fromEntries(Object.entries(MARK_LL).map(([k, [lo, la]]) => [k, project(lo, la)])) as Record<MarkId, [number, number]>;
/** where JAPAN's label hangs: off Honshu's Pacific coast (below the Shanghai label block) */
export const JAPAN_AT = project(140.0, 35.2);

// ---------------------------------------------------------------------------
// LABELS: one per spoken name, beside its own marker, sliding up ~8 f before
// the word. (dx, dy): the text anchor (baseline) in SCREEN px from the marker,
// so a label rides its marker through the camera. leader: a cased cream line
// from the ring's edge toward this screen offset, drawn out of the ring as the
// label lands. Laid out for the camera: nothing overlaps, nothing readable in
// the caption bands (y 1080-1250, 1360-1460), >= 40 px from the frame edges.
// ---------------------------------------------------------------------------
export const CAP = 34;
export const SPACING = 0.12; // em
export type LabelKey = "japan" | "pearl" | "malaya" | "philippines" | "singapore" | "wake" | "island" | "guam" | "thailand" | "international" | "settlement" | "shanghai";
export type LabelSpec = {
  key: LabelKey;
  at: MarkId | "japan";
  word: number;
  anchor: "start" | "middle" | "end";
  dx: number;
  dy: number;
  leader?: [number, number];
  /** letter spacing (em) when it must differ from SPACING */
  spacing?: number;
  /** Japan's own name is orange */
  orange?: boolean;
  /** [f0, f1]: fade out (a label about to leave the frame) */
  out?: [number, number];
};
export const LABELS: LabelSpec[] = [
  { key: "japan", at: "japan", word: W.japanese, anchor: "start", dx: -40, dy: 58, orange: true },
  { key: "pearl", at: "pearlHarbor", word: W.pearl, anchor: "end", dx: -40, dy: -10, out: [38, 45] },
  { key: "malaya", at: "kotaBharu", word: W.malaya, anchor: "start", dx: 58, dy: 14, leader: [50, 2] },
  { key: "philippines", at: "clarkField", word: W.philippines, anchor: "start", dx: 42, dy: -30, leader: [36, -38] },
  { key: "singapore", at: "singapore", word: W.singapore, anchor: "start", dx: 72, dy: 30, leader: [64, 17] },
  { key: "wake", at: "wake", word: W.wake, anchor: "end", dx: 18, dy: -100 },
  { key: "island", at: "wake", word: W.wake, anchor: "end", dx: 18, dy: -50 },
  { key: "guam", at: "guam", word: W.guam, anchor: "start", dx: 42, dy: 12 },
  { key: "thailand", at: "singora", word: W.thailand, anchor: "start", dx: -104, dy: -46, leader: [0, -40], spacing: 0.08 },
  { key: "international", at: "shanghai", word: W.international, anchor: "middle", dx: -66, dy: -138 },
  { key: "settlement", at: "shanghai", word: W.international, anchor: "middle", dx: -66, dy: -88 },
  { key: "shanghai", at: "shanghai", word: W.shanghai, anchor: "middle", dx: -66, dy: -38 },
];
export const LABEL_LEAD = 8; // the slide starts this many frames before the word
