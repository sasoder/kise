// ---------------------------------------------------------------------------
// SixMonthsInFourDays (rsi-since-writing, cut 81). Dwarkesh 3D style (styles/dwarkesh-3d.md).
// Opaque 1080x1920, 23.976 fps, 158 frames.
// One stage inside the misty teal air (AirStage, palette A) on cut 3's one-point pinhole crane mapped onto the kit's
// londonDepth perspective every frame (kits/dwarkesh-3d/dwarkesh3d); the calendar board and its compress motion are the
// clip's shared module sinceWritingCalendar.tsx (cut 3's board, "again compressed"); the human, his desk and the paper
// are the clip's world (sinceWritingFolk / sinceWritingWorld); the Genius is the sister clip's (rsi-ten-earths).
//
// CHECK LINE: "Each agent did about six months of a person's full-time work, squeezed into four days."
//
// THE LINE: "it would be equivalent to a human working full-time for roughly six months, again compressed into just
// four days. And"
// WORD -> FRAME: active -13 · it -2 · would 3 · be 4 · equivalent 7 · to 15 · a 24 · human 27 · working 36 ·
// full-time 50 · for 65 · roughly 78 · six 84 · months, 93 · again 104 · compressed 112 · into 123 · just 131 ·
// four 137 · days. 146 · And 153 (Whisper; may run ~0.2-0.4 s early).
// DURATION: the slot 81.4147 -> 88.0046 s = 6.590 s x 23.976 = 158 frames (f0..f157).
//
// THE MOTION: cut 3's slate calendar board, now half a year: 26 week rows (JAN..JUN plates at the rows where each
// month starts: JAN, FEB, JUN off the board's left edge, MAR, APR, MAY on the empty weekend cells). The human (v0, white shirt) sits at his desk beside the board's left edge,
// writing, and his finished sheets (one cream WorkSheet = one workday) lift one by one off the pad at the end of his
// desk and arc onto the weekday cells in a loose flock, the front week first and then row by row away from the camera
// (weekends empty), the last week landing on f~90, while ONE crane lifts and pulls back from his desk and the front
// weeks to the whole half-year (f0-~94). Then the same camera comes back down and in (f~92-150), panning right; the Genius
// (v0, THE AI) walks in briskly from the right frame edge (feet planted; enters on "roughly" f~79, stops f102), turns to the board and does the compressing:
// on "again" he winds up toward the far weeks, on "compressed" ONE broad sweep down toward the front week (straight
// out ~f111; the first hops follow his hand at f112) and conducts while the rows slide forward exactly as in cut 3 and
// hop onto just FOUR stacks on the front week's MON..THU cells (130 sheets -> 32 / 32 / 33 / 33; f112-142); the
// emptied weeks dim and their month plates drain into the air (all gone by f130); MON..THU slide up on the board's front face, the plate
// "4 DAYS" slides up over the stacks (f131-143), he lowers his hand; living hold (the human still writing, small at
// his desk at the left).
// Orange = the AIs only (COMMON.md): the Genius; the sheets are cream, the board slate, the human in white and slate.
// Cause before effect: a sheet leaves the pad's top and lands exactly on its cell (restPose) on its landing frame;
// a week's sheets start to slide on the frame the release wave reaches it, after the sweep (hand straight out f111,
// first hop f112); every sheet lands exactly on its stack's top (stackTop), the stack's count switching on that frame.
//
// DEPTH: fog by world depth (fogBy "depth"); the pinhole has F = 1000 px and no pitch (cut 3's): f0 the eye ~1.9 m up
// at ~3 m in front of the front plane; ~f94 the crane's top, ~4.4 m up and ~4.6 m out; settled 1.2 m up, ~1.9 m out,
// the board's front face foot at y ~1062. The board: 7 x 48 across (X -174..174), 26 rows 64 deep (Z -46..1646).
// The human at X -420, Z 520 (his desk X -372..-247, Z 490..740); the Genius at X 310, Z 650 once in (walks in from
// X ~705, still off frame until f~79).
//
// SOURCES: six months ~ 26 weeks x 5 workdays = 130 workdays (COMMON.md, the speaker's "roughly six months"); the
// speaker's "four days". On screen: JAN..JUN, MON..THU, 4 DAYS.
// ---------------------------------------------------------------------------
import React from "react";
import { random, useCurrentFrame } from "remotion";
import { z } from "zod";
import { AirFloor, AirHorizonHazeW, AirShadow, AirStage, MAT, WorldSvg, airWorldOf, type AirWorld, type Cam, type DepthOpts } from "../kits/dwarkesh-3d/dwarkesh3d";
import { GENIUS_POSES as G, Genius, lerpPose, type GeniusPose } from "../rsi-ten-earths/tenEarthsGenius";
import { geniusAnchorsLocal } from "../rsi-ten-earths/tenEarthsGeniusBody";
import { CalStack, CalendarBoard, CalendarSheets, DAY_NAMES, calGeom, cellX, compressAt, compressPlan, restPose, rowZ, stackSeed } from "./sinceWritingCalendar";
import { HUMAN_DESK, HUMAN_POSES, Human } from "./sinceWritingFolk";
import { OfficeDesk, Plate, SheetStack, WorkSheet, plateT, stackTop, type SheetPose } from "./sinceWritingWorld";

export const FPS = 24000 / 1001;
export const DURATION = 158;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const c01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const sst = (a: number, b: number, v: number) => {
  const t = c01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
/** the medium's espresso low air (palette A, the low end of the ramp) */
const LOW_AIR = "#3D342B";

// ---- the calendar: half a year, 26 week rows ----
export const BOARD = calGeom(26);
export const WEEKDAYS = [0, 1, 2, 3, 4];

// ---- the camera: cut 3's pinhole (F, distance d to the front plane, eye height h, horizon hy, across cx) ----
export const F = 1000;
export type Cam3 = { d: number; h: number; hy: number; cx: number };
/** a bell-shaped progress 0..1 over f0..f1: the integral of t^a (1-t)^b, normalised (cut 3's) */
const bell = (f0: number, f1: number, a: number, b: number) => {
  const N = 400;
  const cum = new Float64Array(N + 1);
  for (let i = 1; i <= N; i++) {
    const t = (i - 0.5) / N;
    cum[i] = cum[i - 1] + Math.pow(t, a) * Math.pow(1 - t, b);
  }
  const tot = cum[N];
  return (f: number) => {
    const t = c01((f - f0) / (f1 - f0)) * N;
    const i = Math.min(N - 1, Math.floor(t));
    return (cum[i] + (cum[i + 1] - cum[i]) * (t - i)) / tot;
  };
};
/** three camera states: f0 (the desk and the front weeks), the crane's top (the half-year), settled (the four
 *  stacks). Each is keyed by its distance d, its across cx and two screen rows: yF = the board's front face foot
 *  (Y 0, Z z0) and yB = the board's far end (Y top, Z z1); the eye height and the horizon follow. Log distance. */
export const CAMK = {
  s0: { d: 440, cx: -50, yF: 1060, yB: 430 },
  s1: { d: 480, cx: -110, yF: 1165, yB: 405 },
  s2: { d: 340, cx: -72, yF: 1054, yB: 525 },
  /** the lift and pull-back (one lobe), the descent and push-in (one lobe) */
  up: bell(-10, 100, 1.3, 2.0),
  down: bell(88, 166, 1.4, 2.8),
};
/** the eye height and horizon that put the front foot at yF and the far end at yB, at distance d */
const solveH = (d: number, yF: number, yB: number) => {
  const a = F / (d + BOARD.z0);
  const b = F / (d + BOARD.z1);
  const h = (yF - yB + BOARD.top * b) / (a - b);
  return { h, hy: yF - h * a };
};
export const cam3At = (f: number): Cam3 => {
  const u = CAMK.up(f);
  const w = CAMK.down(f);
  const { s0, s1, s2 } = CAMK;
  const lg = (a: number, b: number, c: number) => Math.exp(Math.log(a) + (Math.log(b) - Math.log(a)) * u + (Math.log(c) - Math.log(b)) * w);
  const li = (a: number, b: number, c: number) => a + (b - a) * u + (c - b) * w;
  const d = lg(s0.d, s1.d, s2.d);
  const { h, hy } = solveH(d, li(s0.yF, s1.yF, s2.yF), li(s0.yB, s1.yB, s2.yB));
  return { d, h, hy, cx: li(s0.cx, s1.cx, s2.cx) };
};
/** the pinhole as a londonDepth perspective (Dc = d, k = F / d, the horizon at hy) (cut 3's) */
export const kitCam = (c: Cam3): { cam: Cam; depth: DepthOpts } => {
  const k = F / c.d;
  return { cam: { k, cx: c.cx, cy: (960 - c.hy) / k - c.h }, depth: { eyeY: -c.h, dRef: c.d, kRef: k, dolly: 1 } };
};
/** a world point on screen (px) for a camera state */
export const proj = (c: Cam3, X: number, Y: number, Z: number): [number, number] => {
  const k = F / (c.d + Z);
  return [540 + (X - c.cx) * k, c.hy + (Y + c.h) * k];
};
const REST = kitCam(cam3At(0)).cam;

// ---- the human at his desk (beside the board's left edge), the pad his finished sheets leave from ----
export const HUMAN = { X: -420, Z: 520 };
export const PAD = { X: HUMAN.X + 142, Y: -HUMAN_DESK.deskH, Z: HUMAN.Z + 70, n: 6, seed: 5 };
const padTop = (): SheetPose => stackTop(PAD.X, PAD.Z, PAD.n + 1, PAD.Y, 0, PAD.seed);

// ---- the laying: every weekday sheet of the half year, front week first, row by row away from the camera ----
export type LaySheet = { r: number; c: number; land: number; launch: number; seed: number };
const h01 = (s: string) => random(`smf-${s}`);
export const LAY_F0 = 8;
export const LAY_DR = 3.25;
export const LAY: LaySheet[] = (() => {
  const out: LaySheet[] = [];
  const from = padTop();
  for (let r = 0; r < BOARD.rows; r++)
    for (const c of WEEKDAYS) {
      const to = restPose(BOARD, r, c);
      const dist = Math.hypot(to.X - from.X, to.Z - from.Z);
      const land = LAY_F0 + r * LAY_DR + c * 0.55 + (h01(`l${r}-${c}`) - 0.5) * 0.8;
      const dur = 13 + dist / 95;
      out.push({ r, c, land, launch: land - dur, seed: r * 5 + c });
    }
  return out;
})();
/** a sheet's arc from the pad to its cell: it leaves the pad's top fast and settles flat (exactly `to` at t = 1); a
 *  lower arc than the world's sheetFlight (the flock skims over the board) */
export const layFlight = (from: SheetPose, to: SheetPose, t: number, seed: number): SheetPose => {
  const u = c01(t);
  const s = 1 - Math.pow(1 - u, 1.7);
  const dist = Math.hypot(to.X - from.X, to.Z - from.Z, to.Y - from.Y);
  const apex = 40 + 0.15 * dist;
  const rest = Math.pow(1 - s, 1.3);
  const ph = seed * 1.7;
  return {
    X: lerp(from.X, to.X, s) + 8 * Math.sin(Math.PI * s) * Math.sin(ph + 1),
    Y: lerp(from.Y, to.Y, s) - apex * 4 * s * (1 - s),
    Z: lerp(from.Z, to.Z, s) + 8 * Math.sin(Math.PI * s) * Math.cos(ph),
    yaw: lerp(from.yaw, to.yaw, s) + 24 * Math.sin(Math.PI * s) * Math.sin(ph),
    pitch: 14 * Math.sin(2 * Math.PI * 1.4 * u + ph) * rest,
    roll: 18 * Math.sin(2 * Math.PI * 1.1 * u + ph + 0.8) * rest,
    curl: 0.6 * Math.sin(Math.PI * Math.min(1, s * 1.15)) * rest,
  };
};
/** the laid state at a frame: resting sheets (landed) and flyers (in the air) */
export const layAt = (f: number) => {
  const landed: LaySheet[] = [];
  const flying: { s: LaySheet; pose: SheetPose }[] = [];
  const from = padTop();
  for (const s of LAY) {
    if (f >= s.land) landed.push(s);
    else if (f > s.launch) flying.push({ s, pose: layFlight(from, restPose(BOARD, s.r, s.c), (f - s.launch) / (s.land - s.launch), s.seed) });
  }
  return { landed, flying };
};

// ---- the months: a plate at the row where each month starts, on the board's right ----
export const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN"].map((t, m) => ({ t, r: Math.round(m * (26 / 6)) }));
/** plate size (units) so every month reads the same (~52 px) from the crane's top */
export const monthSize = (r: number) => 52 / (F / (CAMK.s1.d + rowZ(BOARD, r)));
export const monthPos = (r: number) => {
  const s = monthSize(r);
  // JAN and FEB just off the board's left edge (the weekend side of the front weeks is out of frame at the crane's
  // top); MAR, APR, MAY on the empty weekend cells (APR on the left would sit on the human's desk); JUN, far back,
  // on the left again above the desk so it does not stack on MAY
  const right = r >= MONTHS[2].r && r < MONTHS[5].r;
  const X = right ? cellX(BOARD, 5.5) : BOARD.x0 - 8 - 0.9 * s;
  // MAY stands a little taller so it clears APR in front of it as the perspective bunches the far rows up
  const lift = r === MONTHS[4].r ? 0.6 * s : 0;
  return { X, Y: BOARD.top - 0.8 * s - lift, Z: rowZ(BOARD, r) };
};

// ---- the compress (cut 3's motion; p 0..1 over f112..f142) ----
export const COMPRESS_F0 = 112;
export const COMPRESS_SPAN = 30;
export const PLAN = compressPlan({ g: BOARD, dst: [0, 1, 2, 3], span: COMPRESS_SPAN, hop: [8, 5.5] });
export const pAt = (f: number) => c01((f - COMPRESS_F0) / COMPRESS_SPAN);

// ---- the Genius: walks in from the right frame edge (planted feet), stops, turns to the board, crams the half-year ----
export const GENIUS = { X: 310, Z: 650, walk0: 66, walk1: 102, stop: 8, cadence: 3.9 };
/** the walk's amount: full stride, easing to a standstill over the last `stop` frames */
const walkAmt = (f: number) => 1 - sst(GENIUS.walk1 - GENIUS.stop, GENIUS.walk1, f);
const walkPose = (f: number): GeniusPose => G.walk(-1, (Math.max(GENIUS.walk0, Math.min(f, GENIUS.walk1)) - GENIUS.walk0) * GENIUS.cadence, walkAmt(f));
/** his feet's x (units from `at`) and which one is planted, for the tracking below */
const feet = (q: GeniusPose) => {
  const a = geniusAnchorsLocal(0, q);
  return { x: [a.ankleL[0], a.ankleR[0]], y: [a.ankleL[1], a.ankleR[1]] };
};
/** `at` offsets (units) per frame: the planted foot stays put (tracked on half frames), 0 at walk1 */
const WALK_TAB: number[] = (() => {
  const { walk0, walk1 } = GENIUS;
  const sub = 3;
  const xs: number[] = [0];
  let x = 0;
  let prev = feet(walkPose(walk0));
  for (let i = 1; i <= (walk1 - walk0) * sub; i++) {
    const cur = feet(walkPose(walk0 + i / sub));
    const s = prev.y[0] >= prev.y[1] ? 0 : 1; // the lower ankle (larger y) is the planted one
    x -= cur.x[s] - prev.x[s];
    prev = cur;
    if (i % sub === 0) xs.push(x);
  }
  const end = xs[xs.length - 1];
  return xs.map((v) => v - end);
})();
export const geniusX = (f: number) => {
  const { walk0, walk1 } = GENIUS;
  const t = Math.max(0, Math.min(walk1 - walk0, f - walk0));
  const i = Math.min(walk1 - walk0 - 1, Math.floor(t));
  return GENIUS.X + WALK_TAB[i] + (WALK_TAB[i + 1] - WALK_TAB[i]) * (t - i);
};
/** his near arm's keys (armL, reaching toward the board): [frame, angle about the shoulder (screen degrees, 90 =
 *  hanging, 180 = straight out toward the board, 225 = up toward the far weeks), reach (units)]; null = his own arm */
const ARM_KEYS: [number, number | null, number | null][] = [
  [103, null, null], // turned to the board, still hanging
  [109, 214, 96], // "again": the wind-up, back and up toward the far weeks
  [115, 136, 98], // "compressed": ONE broad sweep down toward the front week (straight out ~f111, the first hop f112)
  [122, 160, 86], // the hand comes up a little and stays out over the stream: conducting
  [134, 160, 86],
  [143, null, null], // lowered as the last sheets land (f142)
];
const deg = Math.PI / 180;
export const geniusPoseAt = (frame: number): GeniusPose => {
  // the walk in (planted feet), then he turns to the board (f100-110) and looks down the weeks, then at the stacks
  const turn = sst(GENIUS.walk1 - 4, GENIUS.walk1 + 8, frame);
  const walked = walkPose(frame);
  const after = turn > 0 ? (lerpPose(walked, G.turnTo(-0.82, frame), turn) as GeniusPose) : walked;
  const look = 4 * turn + 4 * sst(108, 118, frame) + 3 * sst(136, 148, frame);
  const base: GeniusPose = { ...after, pitch: after.pitch + look };
  if (frame <= ARM_KEYS[0][0] || frame >= ARM_KEYS[ARM_KEYS.length - 1][0]) return base;
  const S = geniusAnchorsLocal(0, base).shoulderL;
  const w0 = base.armL.w;
  const th0 = Math.atan2(w0[1] - S[1], w0[0] - S[0]) / deg;
  const R0 = Math.hypot(w0[0] - S[0], w0[1] - S[1]);
  let k = 0;
  while (k < ARM_KEYS.length - 2 && frame >= ARM_KEYS[k + 1][0]) k++;
  const [fa, ta, ra] = ARM_KEYS[k];
  const [fb, tb, rb] = ARM_KEYS[k + 1];
  const u = sst(fa, fb, frame);
  let th = (ta ?? th0) + ((tb ?? th0) - (ta ?? th0)) * u;
  let R = (ra ?? R0) + ((rb ?? R0) - (ra ?? R0)) * u;
  const cond = sst(118, 124, frame) * (1 - sst(132, 140, frame));
  th += 6 * Math.sin(((frame - 118) / 24) * 2 * Math.PI) * cond;
  R += 3 * Math.sin(((frame - 118) / 24) * 2 * Math.PI + 1.2) * cond;
  const on = sst(103, 107, frame) * (1 - sst(138, 143, frame));
  const w: [number, number] = [S[0] + R * Math.cos(th * deg), S[1] + R * Math.sin(th * deg)];
  const el = base.armL.elbow;
  return {
    ...base,
    armL: {
      w,
      elbow: [el[0] + (0.35 - el[0]) * on, el[1] + (1 - el[1]) * on],
      fist: base.armL.fist + (0.05 - base.armL.fist) * on,
      hand: base.armL.hand + (-14 * on - base.armL.hand) * on,
    },
  };
};

// ---- the plate over the stacks, the day names ----
export const PLATE = { X: cellX(BOARD, 1.5), Y: BOARD.top - 82.5 - 42, Z: 0, size: 20, f0: 131 };
const LABELS = DAY_NAMES.map((t, c) => (c < 4 ? t : ""));
const labelOn = (frame: number) => (c: number) => (c < 4 ? c01((frame - (134 + 2 * c)) / 10) : 0);

/** the floor under the board sinks into the dense low air toward the bottom edge (cut 3's) */
const LowAir: React.FC<{ cam: Cam }> = ({ cam }) => {
  const y0 = cam.cy + (1075 - 960) / cam.k;
  const y1 = cam.cy + (1920 - 960) / cam.k;
  const x0 = cam.cx - 600 / cam.k;
  return (
    <g>
      <defs>
        <linearGradient id="sm-low" gradientUnits="userSpaceOnUse" x1="0" y1={y0.toFixed(2)} x2="0" y2={y1.toFixed(2)}>
          <stop offset="0" stopColor={LOW_AIR} stopOpacity={0} />
          <stop offset="0.45" stopColor={LOW_AIR} stopOpacity={0.28} />
          <stop offset="1" stopColor={LOW_AIR} stopOpacity={0.55} />
        </linearGradient>
      </defs>
      <rect x={x0.toFixed(2)} y={y0.toFixed(2)} width={(1200 / cam.k).toFixed(2)} height={(y1 - y0).toFixed(2)} fill="url(#sm-low)" />
    </g>
  );
};

/** the human at his desk: the desk's back layer, the writing sheet and the pad, him, the desk's near edge */
const HumanAtDesk: React.FC<{ A: AirWorld; frame: number; k: number }> = ({ A, frame, k }) => {
  const { at, scale } = A.P.at(HUMAN.X, HUMAN.Z);
  const sheet: SheetPose = { X: HUMAN.X + HUMAN_DESK.sheet[0], Y: HUMAN_DESK.sheet[1] - 0.5, Z: HUMAN.Z, yaw: 2, pitch: 0, roll: 0, curl: 0 };
  return (
    <g>
      <OfficeDesk A={A} X={HUMAN.X} Z={HUMAN.Z} dir={1} uid="hd" layer="back" monitor={false} keyboard={false} />
      <SheetStack A={A} X={PAD.X} Z={PAD.Z} n={PAD.n} Y={PAD.Y} seed={PAD.seed} uid="pad" />
      <WorkSheet A={A} pose={sheet} uid="hws" />
      <Human variant={0} pose={HUMAN_POSES.seatedWrite(1, frame)} at={at} scale={scale} uid="hu" frame={frame} fog={A.folkFog(HUMAN.Z)} unitPx={k} />
      <OfficeDesk A={A} X={HUMAN.X} Z={HUMAN.Z} dir={1} uid="hd" layer="front" monitor={false} keyboard={false} />
    </g>
  );
};

/** the laying phase: the board's sheets as they land (on the board, far to near, with the human in depth order), the
 *  front week's MON..THU sheets drawn as cut 3's one-sheet stacks (so the compress takes over without a pop), then
 *  the flock in the air (far to near) */
const LaidSheets: React.FC<{ A: AirWorld; frame: number; human: React.ReactNode }> = ({ A, frame, human }) => {
  const { landed, flying } = layAt(frame);
  const items: { key: number; node: React.ReactNode }[] = [];
  for (const s of landed) {
    const key = rowZ(BOARD, s.r) + 0.001 * s.c;
    if (s.r === 0 && s.c < 4)
      items.push({ key, node: <CalStack key={`st${s.c}`} A={A} X={cellX(BOARD, s.c)} Z={0} n={1} Y={BOARD.top} seed={stackSeed(s.c)} uid={`css${s.c}`} /> });
    else items.push({ key, node: <WorkSheet key={`l${s.seed}`} A={A} pose={restPose(BOARD, s.r, s.c)} uid={`lay${s.seed}`} /> });
  }
  items.push({ key: HUMAN.Z, node: <g key="hum">{human}</g> });
  items.sort((a, b) => b.key - a.key);
  const fl = flying.slice().sort((a, b) => b.pose.Z - a.pose.Z);
  return (
    <g>
      {items.map((it) => it.node)}
      {fl.map(({ s, pose }) => (
        <WorkSheet key={`f${s.seed}`} A={A} pose={pose} uid={`fly${s.seed}`} />
      ))}
    </g>
  );
};

const SixMonthsInFourDays: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const { cam, depth } = kitCam(cam3At(frame));
  const A = airWorldOf({ cam, rest: REST, depth, frame, fogBy: "depth" });
  const p = pAt(frame);
  const st = compressAt(PLAN, p);
  const human = <HumanAtDesk A={A} frame={frame} k={cam.k} />;
  const gx = geniusX(frame);
  const g = A.P.at(gx, GENIUS.Z);
  const genius = (
    <g>
      <AirShadow A={A} X={gx} Z={GENIUS.Z} w={62} d={30} uid="gsh" amt={0.8} />
      <Genius variant={0} pose={geniusPoseAt(frame)} at={g.at} scale={g.scale} uid="g0" frame={frame} fog={A.folkFog(GENIUS.Z)} unitPx={cam.k} />
    </g>
  );
  // a month's plate drains into the air as its weeks leave (JAN with the second week)
  // and every plate is gone by f130, before "4 DAYS" rises into their place
  const monthDrain = (r: number) => Math.max(st.rowDim(Math.max(1, r)), Math.min(1, Math.max(0, (frame - 121) / 9)));
  return (
    <AirStage v={A.v} bloom={0.22} shafts={0.8}>
      <WorldSvg cam={cam}>
        <AirFloor A={A} x0={-3200} x1={3200} z0={-900} z1={7000} mat={MAT.ground} course={240} jointAmt={0.55} />
        <LowAir cam={cam} />
        <AirHorizonHazeW A={A} id="sm-haze" />
        <CalendarBoard A={A} g={BOARD} uid="cal" dim={st.rowDim} labels={LABELS} labelOn={labelOn(frame)} />
        {frame < COMPRESS_F0 ? (
          <LaidSheets A={A} frame={frame} human={human} />
        ) : (
          <CalendarSheets
            A={A}
            plan={PLAN}
            p={p}
            uid="cs"
            extras={[
              { Z: HUMAN.Z, node: human },
              { Z: GENIUS.Z, node: genius },
            ]}
          />
        )}
        {frame < COMPRESS_F0 ? genius : null}
        {MONTHS.map(({ t, r }) => {
          const q = monthPos(r);
          const on = plateT(frame, LAY_F0 + r * LAY_DR - 4, 12);
          const dr = monthDrain(r);
          if (on <= 0 || dr >= 1) return null;
          return (
            <g key={t} opacity={1 - dr}>
              <Plate A={A} X={q.X} Y={q.Y} Z={q.Z} text={t} t={on} uid={`mo${t}`} size={monthSize(r)} />
            </g>
          );
        })}
        <Plate A={A} X={PLATE.X} Y={PLATE.Y} Z={PLATE.Z} text="4 DAYS" t={plateT(frame, PLATE.f0, 12)} uid="pl" size={PLATE.size} />
      </WorldSvg>
    </AirStage>
  );
};

export default SixMonthsInFourDays;
