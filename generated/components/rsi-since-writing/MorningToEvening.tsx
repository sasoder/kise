// ---------------------------------------------------------------------------
// MorningToEvening (rsi-since-writing, cut 109). Dwarkesh 3D style (styles/dwarkesh-3d.md).
// Opaque 1080x1920, 23.976 fps, 152 frames. The last graphic of the clip (the video ends after it).
// Cut 1's office (sinceWritingWorld + sinceWritingFolk, read-only) inside the misty teal air (AirStage, palette A) on a
// londonDepth one-point perspective, from the kit kits/dwarkesh-3d/dwarkesh3d; the Genius from rsi-ten-earths (read-only).
//
// CHECK LINE: "One day of ours, from morning to evening, is years of work for a future AI."
//
// THE LINE: "if you give these future AIs an assignment in the morning, then by the evening, they would have spent
// many years working on it."
// WORD -> FRAME (f0 = sequence frame 2629, 109.6512 s): if -4 · you 3 · give 5 · these 12 · future 16 · AIs 22 · an 32 ·
// assignment 36 · in 44 · the 48 · morning 49 · then 58 · by 64 · the 66 · evening 69 · they 79 · would 86 · have 88 ·
// spent 91 · many 96 · years 104 · working 116 · on 135 · it 141
// DURATION: the slot 109.6512 -> 115.9909 s = 6.340 s x 23.976 = 152 frames (f0..f151).
//
// THE MOTION: the office in the morning (sunT 0.07: the low sun at the window's left, cool sage light). YOU (Human v0)
// stand at the end of the Genius's desk holding one cream sheet up, and hand it across: the arm reaches out (f10-30),
// the sheet leaves the hand on f33 and is laid down flat in front of the Genius's keyboard, landing on f38 ("assignment")
// on the frame the Genius's near hand touches it (his reach f29-38); he draws it in a little (f38-45) and types on
// (continuously, every frame). From "then" (f56) the sun crosses the window in one eased arc to the low right (sunT 0.93
// by f114), the light swinging from the morning sage through the day's teal into the umber-rose dusk (officeDusk from
// ~f98), while the tall bookcase beside him fills with year binders, one per year: each rises from behind the steel
// pedestal at his chair (hidden at launch), climbs forward over its top into a lane in front of the case, along to its
// own column and in, bottom row first (1 2 3 at the bottom ... 10 11 12 at the top), launched at an accelerating
// cadence (gaps 4.8 -> 3.2 frames; landings f59 ... f110, LAND below); full on "many years". You stay at
// the desk end (no exit and return: it crowded the line): you watch him take the sheet, follow the binders with your
// eyes, and from f108 lean back a little and look up at the full shelf with a smile. Camera: one slow push in (k 1.58
// -> 1.735, a small pan right) from the office (window, desk, bookcase) onto desk + shelf + window. Settled f110-151:
// evening light, the full shelf, you looking up, the Genius typing; living hold (typing, breath, the air, the creep).
// CAUSE -> EFFECT: the sheet rides your hand until f33 (the grip is the solved hand); the Genius's hand lands on the
// sheet on f38, the sheet's landing frame. Each binder leaves from behind the pedestal (hidden at launch); the routes
// never intersect each other, the case or the pedestal (each column of a row has its own lane in depth; per-frame check:
// scripts/clips/rsi-since-writing/check-morning-to-evening.ts).
// Orange = the AI only (the Genius); the sheet cream, the binders the world's slate / umber / teal / red-brown.
//
// DEPTH: eye Y -260, dRef 1700 at kRef 1.32, dolly 0.5 (cut 1's), fog by the eye (officeScene(sunT)). The Genius X 0,
// Z 0 (dir -1: his desk on his left, X -48..-173, monitor X -160); you X -214, Z -70 (in front of the monitor's plane,
// so the reaching arm passes in front of it), facing right. The pedestal X 54..92, Z -20..50, 100 tall. The bookcase
// X 95..225, front Z 0, 60 deep, 4 rows of 3 binders (cut-local binders 36 x 76 x 54 units, 1.6x the world's
// YearBinder so the spine numbers read on a phone); the flying lane Z -64.
// The window X -440..-60, sill -330, head -600 (OfficeRoom's room prop; the module is unchanged).
//
// SOURCES: none. "many years" is the speaker's claim; the spines number the years 1-12.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { AirBox, AirShadow, AirStage, MAT, WorldSvg, airWorldOf, makeCamera, mixHex, swayCam, type AirWorld, type DepthOpts, type Mat, type P2 } from "../kits/dwarkesh-3d/dwarkesh3d";
import { GENIUS_POSES, Genius, geniusAnchors, mirrorPose } from "../rsi-ten-earths/tenEarthsGenius";
import { Human, humanAnchors, type HumanPose } from "./sinceWritingFolk";
import { POSES, breathe, covidGripTo, lerpPose } from "../kyle-covid/covidFolkBody";
import { BINDER_MATS, MAT_LEG, MAT_SHELF, MAT_SKIRT, OFFICE, OfficeDesk, OfficeRoom, OfficeShafts, OfficeTint, PLATE_FONT, WorkSheet, officeDusk, officeScene, type SheetPose } from "./sinceWritingWorld";

export const FPS = 24000 / 1001;
export const DURATION = 152;
export const schema = z.object({ guides: z.boolean().default(false) });
export const defaultProps = schema.parse({});

const c01 = (v: number) => Math.max(0, Math.min(1, v));
const sst = (a: number, b: number, x: number) => {
  const u = c01((x - a) / (b - a));
  return u * u * (3 - 2 * u);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const mix2 = (a: P2, b: P2, t: number): P2 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
const f2 = (v: number) => v.toFixed(2);

// ---------------------------------------------------------------------------
// THE SET
// ---------------------------------------------------------------------------
export const DEPTH: DepthOpts = { eyeY: -260, dRef: 1700, kRef: 1.32, dolly: 0.5 };
export const AI = { X: 0, Z: 0 };
export const YOU = { X: -214, Z: -70 };
const ROOM = { ...OFFICE, win: { ...OFFICE.win, x0: -440, x1: -60, sill: -330, head: -600 } };

/** the day: morning held (a creep) to "then", one eased arc to the low right, a creep at dusk */
export const sunAt = (f: number) => {
  const morning = 0.07 + 0.02 * c01(f / 56);
  const arc = sst(56, 114, f);
  return lerp(morning, 0.93, arc) + 0.02 * sst(114, 151, f);
};

// ---------------------------------------------------------------------------
// THE CAMERA: one slow push in from the wide office to desk + shelf + window
// ---------------------------------------------------------------------------
const camKeys = makeCamera([
  { f: 0, k: 1.58, wx: -32, wy: -232, sx: 540, sy: 830 },
  { f: 50, k: 1.62, wx: -20, wy: -232, sx: 540, sy: 832 },
  { f: 112, k: 1.722, wx: -12.5, wy: -232, sx: 540, sy: 836 },
  { f: 151, k: 1.735, wx: -12, wy: -232, sx: 540, sy: 838 },
]);
export const camOf = (f: number) => swayCam(camKeys(f), f);
const REST = camOf(0);

// ---------------------------------------------------------------------------
// THE ASSIGNMENT SHEET and YOU
// ---------------------------------------------------------------------------
/** handOver's t (the reach 0-0.45, hold 0.45-0.6, back 0.6-1) on the words */
const HO_KEYS: [number, number][] = [
  [10, 0],
  [30, 0.45],
  [37, 0.6],
  [56, 1],
];
const keyed = (keys: [number, number][], f: number) => {
  if (f <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [fa, ta] = keys[i - 1];
    const [fb, tb] = keys[i];
    if (f <= fb) return ta + (tb - ta) * ((f - fa) / (fb - fa));
  }
  return keys[keys.length - 1][1];
};
export const RELEASE = 33;
export const LANDED = 38;
const HAND_REST: P2 = [30, -158];
const HAND_REACH: P2 = [102, -199];
/** the sheet's centre from the grip (units, facing right): it hangs from his hand by its top left corner */
const HELD_OFF: P2 = [15, 24];
/** the sheet lying on the Genius's desk in front of his keyboard (and drawn in a little after his touch) */
export const SHEET_DESK = { X: -100, Y: -133.2, Z: -2, yaw: 4 };
const SHEET_PULLED = -97;

const STAND_HO: HumanPose = { ...POSES.stand(1), yaw: 1.0, headYaw: 0.95, footL: [-8, 0], footR: [10, -1], mouth: 0.18 } as HumanPose;
const humanClock = (f: number) => f * 1.25;
export const youAt = (f: number): { pose: HumanPose; hand: P2 } => {
  const u = keyed(HO_KEYS, f);
  const out = sst(0, 0.45, u) * (1 - sst(0.6, 1, u));
  const hand = mix2(HAND_REST, HAND_REACH, out);
  // the head through the day: on the sheet and his hand (morning), the binders (f62-110), up at the full shelf (f110+)
  const follow = sst(60, 74, f);
  const up = sst(108, 126, f);
  const look: P2 = [lerp(lerp(0.5, 0.55, follow), 0.45, up), lerp(lerp(0.25, -0.15, follow), -0.75, up)];
  const base = breathe(
    {
      ...STAND_HO,
      lean: (STAND_HO.lean ?? 0) + 8 * out - 2.5 * up,
      pitch: (STAND_HO.pitch ?? 0) + 4 * out - 3 * follow - 8 * up,
      look,
      mouth: lerp(0.18, 0.32, up),
    } as HumanPose,
    humanClock(f),
    0.6,
  ) as HumanPose;
  const solved = covidGripTo("officer", 3, base, { L: hand }, [0, 0], 1) as HumanPose;
  const opened = sst(RELEASE, RELEASE + 6, f);
  const held: HumanPose = { ...solved, armL: { ...solved.armL, fist: lerp(0.7, 0.25, opened), hand: lerp(14, 0, out) } };
  // after the hand-over the arm hangs free again (the unsolved standing arm)
  const free = sst(54, 66, f);
  const pose = free > 0 ? (lerpPose(held, base, free) as HumanPose) : held;
  return { pose, hand };
};

/** the assignment sheet: held (up to RELEASE), laid down (RELEASE -> LANDED), drawn in (LANDED -> +7), then still */
export const sheetAt = (f: number): { pose: SheetPose; held: boolean } => {
  const flat = (X: number): SheetPose => ({ X, Y: SHEET_DESK.Y, Z: SHEET_DESK.Z, yaw: SHEET_DESK.yaw, pitch: 0, roll: 0, curl: 0 });
  const heldAt = (ff: number): SheetPose => {
    const h = humanAnchors(0, youAt(ff).pose, [0, 0], 1).handL;
    // a little swing: the hanging bottom lags the hand's travel
    const v = youAt(ff + 1).hand[0] - youAt(ff - 1).hand[0];
    return { X: YOU.X + h[0] + HELD_OFF[0], Y: h[1] + HELD_OFF[1], Z: YOU.Z + 2, yaw: -3 * v, pitch: 86 - 2.5 * v, roll: 0, curl: 0.06 };
  };
  if (f <= RELEASE) return { pose: heldAt(f), held: true };
  if (f < LANDED) {
    const a = heldAt(RELEASE);
    const b = flat(SHEET_DESK.X);
    const t = (f - RELEASE) / (LANDED - RELEASE);
    const s = sst(0, 1, t);
    const fall = t * t; // the lay-down accelerates onto the desk
    return {
      pose: {
        X: lerp(a.X, b.X, s),
        Y: lerp(a.Y, b.Y, 0.55 * s + 0.45 * fall),
        Z: lerp(a.Z, b.Z, s),
        yaw: lerp(a.yaw, b.yaw, s),
        pitch: lerp(a.pitch, 0, 0.35 * s + 0.65 * fall),
        roll: 6 * Math.sin(Math.PI * t),
        curl: 0.2 * Math.sin(Math.PI * t),
      },
      held: false,
    };
  }
  return { pose: flat(lerp(SHEET_DESK.X, SHEET_PULLED, sst(LANDED, LANDED + 7, f))), held: false };
};

// ---------------------------------------------------------------------------
// THE GENIUS: typing every frame; the near hand reaches onto the sheet (touch on LANDED), draws it in, back to the keys
// ---------------------------------------------------------------------------
export const geniusAt = (f: number) => {
  const typed = GENIUS_POSES.typeAtDesk(1, f);
  const w = sst(29, LANDED, f) * (1 - sst(45, 54, f));
  if (w <= 0) return mirrorPose(typed);
  const own = geniusAnchors(0, typed, [0, 0], 1).handL;
  const sx = -sheetAt(Math.max(f, LANDED)).pose.X; // the sheet's x in his (right-facing) units
  const target: P2 = [sx - 14, -135.5];
  const q = covidGripTo("officer", 3, { ...typed, look: [lerp(0.35, 0.55, w), lerp(0.05, 0.5, w)] }, { L: mix2(own, target, w) }, [0, 0], 1);
  return mirrorPose({ ...q, armL: { ...q.armL, fist: lerp(0.15, 0.05, w), hand: lerp(18, 6, w) } } as typeof typed);
};

// ---------------------------------------------------------------------------
// THE BOOKCASE and THE YEAR BINDERS (cut-local: the world's YearBinder look at 1.6x, so the numbers read)
// ---------------------------------------------------------------------------
export const CASE = { X0: 95, X1: 225, Z: 0, D: 60, side: 7, board: 8, top: -448 };
export const BIN = { w: 36, h: 76, d: 54 };
/** board tops (binder bottoms), top row first */
export const ROWS = [-356, -264, -172, -80];
/** column centres: 2 units in from the upright, 2 units between binders (packed like real binders) */
const COLS = [0, 1, 2].map((j) => CASE.X0 + CASE.side + 2 + BIN.w / 2 + j * (BIN.w + 2));
/** year i + 1's slot: the shelf fills from the bottom row up (1 2 3 at the bottom, 10 11 12 at the top), so each
 *  year's route is a little longer than the one before and they land in order at a steady speed */
export const slotOf = (i: number) => ({ X: COLS[i % 3], Y: ROWS[3 - Math.floor(i / 3)] });
const COLORS = [0, 3, 2, 1, 2, 0, 3, 1, 0, 2, 1, 3];
export const YEARS = 12;
/** the desk-side pedestal beside his chair (a closed steel drawer unit): the binders rise from behind it */
export const PED = { X0: 54, X1: 92, Z0: -20, Z1: 50, H: 100 };
/** the lane in front of the case (a flying binder's spine face): 10 units clear of the case's front */
export const LANE_Z = -64;
/** a binder's bottom while it crosses to its column: 28 units over the pedestal's top (its label clear of the band) */
const CROSS_Y = -128;
type P3 = [number, number, number];
/** each year's route (binder bottom-centre of the spine face): up from the floor behind the pedestal, forward over its
 *  top into the lane, across to its own column, up (or down) the front of the case to its row, and in. Corners are
 *  rounded (quadratic fillets). Different columns use different vertical lanes (38 apart, binders 36 wide), so a
 *  year never passes through its neighbour's rise or entry; the shared start is spaced by the cadence. */
const routeOf = (i: number) => {
  const s = slotOf(i);
  const X0 = (PED.X0 + PED.X1) / 2;
  // where it crosses (its bottom Y) and in which lane (Z). A row's three years come close together, so each column
  // has its own lane, one binder depth + 6 nearer than the last: a later year always passes IN FRONT of the earlier
  // ones going in, never through them. The upper rows cross at their own height; the bottom row (below the pedestal's
  // top) crosses above it and comes down, its third year one binder higher (passing OVER the first two: a nearer lane
  // would bring its label into the button column).
  const r = 3 - Math.floor(i / 3);
  const c = i % 3;
  const D = BIN.d + 6;
  const [cy, lz] = r < 3 ? [ROWS[r], LANE_Z - D * c] : ([[CROSS_Y, LANE_Z], [CROSS_Y, LANE_Z - D], [CROSS_Y, LANE_Z]] as const)[c];
  // up out of hiding, then on a diagonal up and forward over the pedestal to its height and lane (the travel in depth
  // rides with the climb, so a binder never hangs on screen while it only comes nearer)
  const pts: P3[] = [
    [X0, -2, PED.Z1 + 6],
    [X0, -PED.H - 16, PED.Z1 + 6],
    [X0, cy, lz],
    [s.X, cy, lz],
    [s.X, s.Y, lz],
    [s.X, s.Y, CASE.Z],
  ];
  const radii = [0, 12, 26, 26, 4, 0]; // the last corner tight: level with its row before it enters the case
  // fillets: each interior corner becomes (in, corner, out) of a quadratic Bezier
  const sub = (a: P3, b: P3): P3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const len = (v: P3) => Math.hypot(v[0], v[1], v[2]);
  const along = (a: P3, b: P3, d: number): P3 => {
    const v = sub(b, a);
    const l = len(v) || 1;
    return [a[0] + (v[0] * d) / l, a[1] + (v[1] * d) / l, a[2] + (v[2] * d) / l];
  };
  const samples: P3[] = [pts[0]];
  let trunkAt = 0;
  for (let k = 1; k < pts.length - 1; k++) {
    const r = Math.min(radii[k], len(sub(pts[k], pts[k - 1])) / 2, len(sub(pts[k + 1], pts[k])) / 2);
    const pin = along(pts[k], pts[k - 1], r);
    const pout = along(pts[k], pts[k + 1], r);
    samples.push(pin);
    if (k === 2) trunkAt = samples.length - 1;
    for (let j = 1; j <= 8; j++) {
      const t = j / 8;
      const q = (u: number, v: number, w: number) => (1 - t) * (1 - t) * u + 2 * (1 - t) * t * v + t * t * w;
      samples.push([q(pin[0], pts[k][0], pout[0]), q(pin[1], pts[k][1], pout[1]), q(pin[2], pts[k][2], pout[2])]);
    }
  }
  samples.push(pts[pts.length - 1]);
  // the length that shows: travel in depth (Z) barely moves on screen, so it counts 0.3 and takes less of the time
  const cum = [0];
  for (let k = 1; k < samples.length; k++) {
    const v = sub(samples[k], samples[k - 1]);
    cum.push(cum[k - 1] + Math.hypot(v[0], v[1], 0.3 * v[2]));
  }
  return { samples, cum, L: cum[cum.length - 1], trunk: cum[trunkAt] };
};
export const ROUTES = Array.from({ length: YEARS }, (_, i) => routeOf(i));
/** THE TRUNK (up from behind the pedestal and forward over it, to where the year turns along the case) is shared by
 *  every year: all ride it at the same steady speed V_TRUNK (shown units / frame), so on it they stay spaced by their
 *  launch gaps (>= 3.2 frames x 30 = 96 > a binder's 76 height + its turn). After it each year eases over EASE_A
 *  frames to its cruise (0.8 x V_TRUNK), cruises, and eases into its slot over the last EASE_B frames. */
const V_TRUNK = 30;
const EASE_A = 4;
const EASE_B = 7;
/** each year's flight: the trunk at V_TRUNK, the rest at about 0.8 x V_TRUNK */
const TIME = ROUTES.map((R) => R.trunk / V_TRUNK + (R.L - R.trunk) / (0.8 * V_TRUNK));
/** the launches, at an accelerating cadence (gaps 4.8 -> 3.2 frames), placed so the last year lands on f110 */
const GAPS = [4.8, 4.5, 4.2, 4, 3.8, 3.6, 3.4, 3.3, 3.2, 3.2, 3.2];
const LAUNCH0 = 110 - TIME[YEARS - 1] - GAPS.reduce((a, b) => a + b, 0);
const LAUNCH = [LAUNCH0, ...GAPS.map((_, i) => LAUNCH0 + GAPS.slice(0, i + 1).reduce((a, b) => a + b, 0))];
/** landing frames of years 1..12 (each lands as it slides fully in; the count is the shelved binders) */
export const LAND = LAUNCH.map((l, i) => l + TIME[i]);
export const flightOf = (i: number) => TIME[i];
/** the integral of smoothstep over 0..u */
const sstInt = (u: number) => u * u * u - (u * u * u * u) / 2;
/** distance along year i's route t frames after its launch (shown units) */
const travel = (i: number, t: number) => {
  const R = ROUTES[i];
  const tT = R.trunk / V_TRUNK;
  if (t <= tT) return V_TRUNK * t;
  const Tr = flightOf(i) - tT;
  const Rr = R.L - R.trunk;
  const a = Math.min(EASE_A, Tr / 3);
  const b = Math.min(EASE_B, Tr / 2);
  const vc = (Rr - (a * V_TRUNK) / 2) / (Tr - (a + b) / 2); // the cruise speed that ends exactly in the slot
  const tau = Math.min(t - tT, Tr);
  if (tau <= a) return R.trunk + V_TRUNK * tau - (V_TRUNK - vc) * a * sstInt(tau / a);
  const dA = R.trunk + (a * (V_TRUNK + vc)) / 2;
  if (tau <= Tr - b) return dA + vc * (tau - a);
  const w = tau - (Tr - b);
  return dA + vc * (Tr - b - a) + vc * (w - b * sstInt(w / b));
};
export const binderAt = (i: number, f: number): { X: number; Y: number; Z: number; state: "wait" | "fly" | "shelved" } => {
  const s = slotOf(i);
  const R = ROUTES[i];
  const launch = LAND[i] - flightOf(i);
  if (f < launch) return { X: R.samples[0][0], Y: R.samples[0][1], Z: R.samples[0][2], state: "wait" };
  if (f >= LAND[i]) return { X: s.X, Y: s.Y, Z: CASE.Z, state: "shelved" };
  const d = travel(i, f - launch);
  let k = 1;
  while (k < R.cum.length - 1 && R.cum[k] < d) k++;
  const t = (d - R.cum[k - 1]) / (R.cum[k] - R.cum[k - 1] || 1);
  const a = R.samples[k - 1];
  const b = R.samples[k];
  return { X: lerp(a[0], b[0], t), Y: lerp(a[1], b[1], t), Z: lerp(a[2], b[2], t), state: "fly" };
};

/** the pedestal: a grey steel drawer unit (three drawers, small pulls) */
const Pedestal: React.FC<{ A: AirWorld }> = ({ A }) => {
  const { X0, X1, Z0, Z1, H } = PED;
  const P = A.P;
  const seams = [-H + 26, -H + 54];
  const ln = seams.map((y) => `M${P.p(X0 + 2, y, Z0).map(f2).join(",")}L${P.p(X1 - 2, y, Z0).map(f2).join(",")}`).join("");
  return (
    <g>
      <AirShadow A={A} X={(X0 + X1) / 2} Z={(Z0 + Z1) / 2} w={(X1 - X0) * 0.9} d={Z1 - Z0} uid="ps" amt={0.8} />
      <AirBox A={A} X0={X0} X1={X1} Y0={-H} Y1={0} Z0={Z0} Z1={Z1} mat={MAT_LEG} uid="ped" rim={0.5} />
      <path d={ln} stroke={A.tone(MAT_LEG.dark, Z0, 40)} strokeWidth={f2(A.lw(1.4))} fill="none" />
      {[-H + 12, -H + 40, -H + 68].map((y, i) => (
        <AirBox key={i} A={A} X0={(X0 + X1) / 2 - 7} X1={(X0 + X1) / 2 + 7} Y0={y - 2} Y1={y + 2} Z0={Z0 - 3} Z1={Z0} mat={MAT.iron} uid={`pp${i}`} rim={0.4} />
      ))}
    </g>
  );
};

const Binder: React.FC<{ A: AirWorld; X: number; Y: number; Z: number; n: number; mat: Mat; uid: string }> = ({ A, X, Y, Z, n, mat, uid }) => {
  const P = A.P;
  const { w, h, d } = BIN;
  const t = (hex: string) => A.tone(hex, Z, -Y + h / 2);
  const lab = [P.p(X - w / 2 + 3, Y - h + 6, Z), P.p(X + w / 2 - 3, Y - h + 40, Z)];
  const lc: P2 = [(lab[0][0] + lab[1][0]) / 2, (lab[0][1] + lab[1][1]) / 2 + 1.2 * P.r(Z)];
  const hole = P.p(X, Y - 15, Z);
  const r = P.r(Z);
  const text = `${n}`;
  return (
    <g>
      <AirBox A={A} X0={X - w / 2} X1={X + w / 2} Y0={Y - h} Y1={Y} Z0={Z} Z1={Z + d} mat={mat} uid={`${uid}-b`} />
      <rect x={f2(lab[0][0])} y={f2(lab[0][1])} width={f2(lab[1][0] - lab[0][0])} height={f2(lab[1][1] - lab[0][1])} rx={f2(2 * r)} fill={t("#EDE4D1")} />
      <text
        x={f2(lc[0])}
        y={f2(lc[1])}
        fill={t("#3A2D25")}
        textAnchor="middle"
        dominantBaseline="central"
        style={{ fontFamily: PLATE_FONT, fontWeight: 700, fontSize: (text.length > 1 ? 27 : 29) * r, letterSpacing: text.length > 1 ? "-0.04em" : 0, fontVariantNumeric: "lining-nums" }}
      >
        {text}
      </text>
      <circle cx={f2(hole[0])} cy={f2(hole[1])} r={f2(5 * r)} fill={t(mixHex(mat.dark, "#22180F", 0.3))} stroke={t(mat.lit)} strokeWidth={f2(1.2 * r)} />
    </g>
  );
};

const MAT_BACK: Mat = { lit: mixHex(MAT_SKIRT.lit, MAT_SKIRT.mid, 0.3), mid: MAT_SKIRT.mid, dark: MAT_SKIRT.dark };
/** the bookcase: back panel, base, boards (drawn before the binders), and the two side uprights (after them) */
const CaseBack: React.FC<{ A: AirWorld }> = ({ A }) => {
  const { X0, X1, Z, D, side, board, top } = CASE;
  return (
    <g>
      <AirShadow A={A} X={(X0 + X1) / 2} Z={Z + D / 2} w={(X1 - X0) * 0.75} d={D} uid="cs" amt={0.8} />
      <AirBox A={A} X0={X0 + side} X1={X1 - side} Y0={top} Y1={0} Z0={Z + D - 5} Z1={Z + D} mat={MAT_BACK} uid="cbk" rim={0.2} />
      <AirBox A={A} X0={X0 + side} X1={X1 - side} Y0={ROWS[3]} Y1={0} Z0={Z} Z1={Z + D - 5} mat={MAT_SHELF} uid="cbase" rim={0.4} />
      {ROWS.slice(0, 3).map((y, i) => (
        <AirBox key={i} A={A} X0={X0 + side} X1={X1 - side} Y0={y} Y1={y + board} Z0={Z} Z1={Z + D - 5} mat={MAT_SHELF} uid={`cb${i}`} rim={0.5} />
      ))}
      <AirBox A={A} X0={X0} X1={X1} Y0={top} Y1={top + board} Z0={Z} Z1={Z + D} mat={MAT_SHELF} uid="ctop" rim={0.6} />
    </g>
  );
};
const CaseSides: React.FC<{ A: AirWorld }> = ({ A }) => {
  const { X0, X1, Z, D, side, top, board } = CASE;
  return (
    <g>
      <AirBox A={A} X0={X1 - side} X1={X1} Y0={top + board} Y1={0} Z0={Z} Z1={Z + D} mat={MAT_SHELF} uid="cr" rim={0.4} />
      <AirBox A={A} X0={X0} X1={X0 + side} Y0={top + board} Y1={0} Z0={Z} Z1={Z + D} mat={MAT_SHELF} uid="cl" rim={0.5} />
    </g>
  );
};

/** the evening (cut-local, keyed to officeDusk): the room dims and warms toward a deep umber-rose (never black); the
 *  window, brighter than the room, keeps the last light. Over the world's OfficeTint, inside the stage. */
const DuskGrade: React.FC<{ sunT: number }> = ({ sunT }) => {
  const e = officeDusk(sunT);
  if (e <= 0.001) return <OfficeTint sunT={sunT} />;
  return (
    <>
      <OfficeTint sunT={sunT} />
      <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "multiply", background: `rgba(178,138,124,${f2(0.34 * e)})` }} />
      <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "multiply", background: `radial-gradient(ellipse 85% 60% at 45% 42%, rgba(255,255,255,0) 40%, rgba(120,86,74,${f2(0.35 * e)}) 100%)` }} />
    </>
  );
};

const Guides: React.FC = () => (
  <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
    <rect x={65} y={290} width={950} height={780} fill="none" stroke="#2B6F8F" strokeWidth={2} strokeDasharray="10 8" opacity={0.8} />
    <rect x={0} y={1080} width={1080} height={170} fill="#2B6F8F" opacity={0.15} />
    <rect x={0} y={1360} width={1080} height={100} fill="#2B6F8F" opacity={0.15} />
    <line x1={0} x2={1080} y1={800} y2={800} stroke="#2B6F8F" strokeWidth={1} opacity={0.6} />
    <line x1={0} x2={1080} y1={880} y2={880} stroke="#2B6F8F" strokeWidth={1} opacity={0.6} />
    <line x1={955} x2={955} y1={900} y2={1920} stroke="#2B6F8F" strokeWidth={1} opacity={0.6} />
  </svg>
);

const MorningToEvening: React.FC<z.infer<typeof schema>> = ({ guides }) => {
  const frame = useCurrentFrame();
  const sunT = sunAt(frame);
  const cam = camOf(frame);
  const A = airWorldOf({ cam, rest: REST, depth: DEPTH, frame, scene: officeScene(sunT) });

  const ga = A.P.at(AI.X, AI.Z);
  const ya = A.P.at(YOU.X, YOU.Z);
  const you = youAt(frame);
  const sheet = sheetAt(frame);

  const shelved: React.ReactNode[] = [];
  const flyBehind: { z: number; y: number; node: React.ReactNode }[] = [];
  const flyFront: { z: number; y: number; node: React.ReactNode }[] = [];
  // right to left (the camera is left of the case: each binder's left side goes under its left neighbour)
  for (let i = LAND.length - 1; i >= 0; i--) {
    const b = binderAt(i, frame);
    if (b.state === "wait") continue;
    const node = <Binder key={i} A={A} X={b.X} Y={b.Y} Z={b.Z} n={i + 1} mat={BINDER_MATS[COLORS[i]]} uid={`bn${i}`} />;
    if (b.state === "shelved") shelved.push(node);
    // behind the pedestal while it is still below its top and behind it; in front of it once over it
    else (b.Y > -PED.H - 2 && b.Z > PED.Z0 ? flyBehind : flyFront).push({ z: b.Z, y: b.Y - BIN.h / 2, node });
  }
  // the flyers: the farther (higher Z) first
  const byZ = (q: { z: number; y: number; node: React.ReactNode }[]) => [...q].sort((a, b) => b.z - a.z || Math.abs(b.y - DEPTH.eyeY) - Math.abs(a.y - DEPTH.eyeY)).map((q2) => q2.node);

  const sheetNode = <WorkSheet A={A} pose={sheet.pose} uid="as" shadowY={sheet.pose.Z > -30 ? -132 : undefined} />;

  return (
    <AbsoluteFill>
      <AirStage v={A.v} shafts={0} bloom={0.22} overlay={<DuskGrade sunT={sunT} />}>
        <WorldSvg cam={cam}>
          <OfficeRoom A={A} sunT={sunT} uid="room" room={ROOM} />
          {/* the bookcase and the shelved years */}
          <CaseBack A={A} />
          {shelved}
          <CaseSides A={A} />
          {/* the years on their way: up from behind the desk-side pedestal and into the case */}
          {byZ(flyBehind)}
          <Pedestal A={A} />
          {byZ(flyFront)}
          {/* the Genius at his desk */}
          <OfficeDesk A={A} X={AI.X} Z={AI.Z} dir={-1} uid="gd" layer="back" />
          {!sheet.held ? sheetNode : null}
          <Genius variant={0} pose={geniusAt(frame)} at={ga.at} scale={ga.scale} uid="ai" frame={frame} fog={A.folkFog(AI.Z)} unitPx={A.k} />
          <OfficeDesk A={A} X={AI.X} Z={AI.Z} dir={-1} uid="gdf" layer="front" />
          {/* you, standing at the desk's end */}
          {sheet.held ? sheetNode : null}
          <AirShadow A={A} X={YOU.X} Z={YOU.Z} w={62} d={30} uid="ys" amt={0.8} />
          <Human variant={0} pose={you.pose} at={ya.at} scale={ya.scale} uid="you" frame={frame} fog={A.folkFog(YOU.Z)} unitPx={A.k} />
          <OfficeShafts A={A} sunT={sunT} uid="sh" room={ROOM} />
        </WorldSvg>
      </AirStage>
      {guides ? <Guides /> : null}
    </AbsoluteFill>
  );
};

export default MorningToEvening;
