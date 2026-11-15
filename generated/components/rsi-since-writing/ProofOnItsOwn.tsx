// ---------------------------------------------------------------------------
// ProofOnItsOwn (rsi-since-writing, cut 34). Dwarkesh 3D style (styles/dwarkesh-3d.md).
// Opaque 1080x1920, 23.976 fps, 102 frames.
// One stage inside the misty teal air (AirStage, palette A, interior mood) on a londonDepth one-point perspective,
// from the kit kits/dwarkesh-3d/dwarkesh3d. The Genius is the sister clip's (rsi-ten-earths/tenEarthsGenius, v0,
// read-only); the blackboard, its handwriting (./proofOnItsOwnChalk) and the hall are cut-local.
//
// CHECK LINE: "In math, an AI can carry a big project all the way to the end on its own."
//
// THE LINE: "where AIs are actually capable of autonomously completing ambitious projects,"
// WORD -> FRAME: in -15 · math -13 · where -1 · AIs 2 · are 12 · actually 16 · capable 25 · of 32 ·
//   autonomously 45 · completing 62 · ambitious 72 · projects 81 · (you 100 · can 105)
// DURATION: the slot 34.1174 -> 38.3717 s = 4.2543 s x 23.976 = 102 frames (f0..f101).
//
// THE MOTION: an empty lecture hall; a long slate blackboard in panels, its left part already covered in his proof,
// bleeding off both sides of the frame. The Genius walks steadily right along it, writing as he goes: with the far hand
// he fills one narrow column of four lines after another (every stroke laid down by the moving chalk tip), the camera
// trucking right with him (one lobe in, constant, settle) while the near seats slide past below. On "autonomously"
// (f44) he writes into the last panel; on "completing" (f54-68) his stride closes over a last step (the walk's amount
// eases to 0, the trailing foot comes up beside the other: feet under the hips) and he writes the result standing; on
// "ambitious" (f72.5-81) he boxes it (one stroke from the bottom-right, round by the left and the top) and on
// "projects" (f81.5-86.5) ticks it in orange chalk. He leans in only for the far strokes (the box's right side, the
// tick), upright while the hand is near, so the chalk hand never comes near his face. He lowers the chalk (f87-97) and,
// planted where he stopped, turns his head and torso a little toward the boxed result: a living hold (breath, a slow
// weight shift of the torso, motes). The resolved frame centres him and the box.
// CAUSE BEFORE EFFECT: a chalk mark exists only where the tip has passed (proofOnItsOwnChalk schedule: the tip is a
// pure function of the frame; the board shows every stroke whose slot has started, the current one up to the tip).
// The tip touches the board on every writing frame (the hand IK: covidGripTo, read-only, on the far arm; the chalk
// stick runs from the solved grip to the exact tip). The feet: a planted-foot integrator (the stepOut rule, cut-local)
// moves him so the support foot never slides.
// Orange = the AI only: the Genius, and his orange tick on the result. Chalk cream, slate, plaster, timber.
//
// DEPTH: eyeY -540, dRef 1400 at kRef 1.86, dolly 0.5, fog by the eye's distance (interior mood); zoom 1.86 -> 2.0.
//   The Genius on the front plane Z 0 (feet y ~1060, ~600 px tall walking, ~650 px at the end); the board face Z 42,
//   the back wall Z 48; the seat rows Z -560 .. -905, each tier higher, the near ones filling y 1100+ as dark context.
//   Board lines ~40 px; the boxed result ~225 x 165 px, its lines ~45 px, the tick ~75 px.
//
// SOURCES: none (the chalk is decorative mathematics; no figures on screen).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { AirBox, AirFloor, AirShadow, AirStage, MAT, WorldSvg, airWorldOf, c01, mixHex, perspective, swayCam, type Cam, type DepthOpts, type Mat } from "../kits/dwarkesh-3d/dwarkesh3d";
import { GENIUS_POSES as G, Genius, buildGenius, lerpPose, type GeniusPose } from "../rsi-ten-earths/tenEarthsGenius";
import { covidGripTo } from "../kyle-covid/covidFolkBody";
import { GLYPH_H, ROW_Y, freehand, layoutLine, makeColumn, makeJob, along, pathD, tipInJob, hash01, type Job, type P2 } from "./proofOnItsOwnChalk";

export const FPS = 24000 / 1001;
export const DURATION = 102;
export const schema = z.object({
  /** probe only: hold this frame's camera (-1 = the cut's) */
  camFrame: z.number().default(-1),
});
export const defaultProps = schema.parse({});

const sst = (a: number, b: number, v: number) => {
  const u = c01((v - a) / (b - a));
  return u * u * (3 - 2 * u);
};

// ===================================================================================================================
// THE PLAN (frames, world units: 178 per metre, X along the board, Z depth, Y height up -)
// ===================================================================================================================
const Z_B = 42; // the board's face
const Z_W = 48; // the back wall
const V = 5.0; // his walking speed at full stride (units per frame; ~1.3x the cast's stroll)
const STRIDE2 = 88; // the walk's advance per cycle (two steps) at amount 1
const PH_RATE = V / STRIDE2; // walk cycles per frame
const AMT_FADE = [54, 68] as const; // the last step: the stride closes (amount 1 -> 0), the trailing foot comes up
const X_STOP = 600; // where his feet come to rest (a natural stance, feet under the hips, weight settled)
const PH_OFF = 0.62; // the walk's phase offset (the stride closes on a lead step of the far foot)
/** the stride (walk amount): full, closing over the last step, then 0 (he stands) */
const walkAmt = (t: number) => 1 - sst(AMT_FADE[0], AMT_FADE[1], t);
/** the walk's phase (cycles): constant cadence, frozen once the stride has closed */
const phaseAt = (t: number) => PH_OFF + PH_RATE * Math.min(t, AMT_FADE[1]);
/** his feet's X, tabulated (pure): the walk moves him so the support foot stays planted (the stepOut rule: the left
 *  foot carries him while frac(phase) < 0.5), the advance shrinking with the stride; at rest he never moves again */
const XG_T0 = -200;
const XG_DT = 0.25;
const XG_TAB = (() => {
  const n = Math.ceil((AMT_FADE[1] + 2 - XG_T0) / XG_DT);
  const out: number[] = [0];
  const foot = (t: number) => {
    const q = G.walk(1, phaseAt(t) * 24, walkAmt(t));
    return [q.footL[0], q.footR[0]];
  };
  let x = 0;
  let prev = foot(XG_T0);
  for (let i = 1; i <= n; i++) {
    const ta = XG_T0 + (i - 1) * XG_DT;
    const tb = XG_T0 + i * XG_DT;
    const cur = foot(tb);
    const lA = (((phaseAt(ta) % 1) + 1) % 1) < 0.5;
    const lB = (((phaseAt(tb) % 1) + 1) % 1) < 0.5;
    if (lA === lB) x -= lA ? cur[0] - prev[0] : cur[1] - prev[1];
    prev = cur;
    out.push(x);
  }
  const end = out[out.length - 1];
  return out.map((v) => v - end + X_STOP);
})();
export const xgAt = (t: number) => {
  const u = Math.max(0, (t - XG_T0) / XG_DT);
  const i = Math.min(XG_TAB.length - 2, Math.floor(u));
  if (i >= XG_TAB.length - 2 && u >= XG_TAB.length - 1) return X_STOP;
  return XG_TAB[i] + (XG_TAB[i + 1] - XG_TAB[i]) * Math.min(1, u - i);
};

// ---- the writing --------------------------------------------------------------------------------------------------
const COL_T = 8; // frames per walking column (four lines)
const COL_EVERY = 16; // a new column every 16 frames (the hop between columns: 8)
const COL_A = 112; // a column's left edge, units ahead of his feet when he starts it
const COL_W = 58;
const colStarts: number[] = [];
for (let t = -4 - COL_EVERY * 11; t <= 44; t += COL_EVERY) colStarts.push(t);
const DIAGRAM_AT = new Set([-36, 28, -100, -148]);
const columns = colStarts.map((t0, i) => {
  const x = xgAt(t0) + COL_A;
  return { t0, x, items: makeColumn(x, 101 + i * 7, DIAGRAM_AT.has(t0) ? "diagram" : "lines", COL_W) };
});
const LAST_COL = columns[columns.length - 1];
// the final column: two lines (rows 1-2) as he slows, the result (rows 3-4) when he stands, the box, the tick
const FINAL_T = 59;
const FINAL_X = xgAt(FINAL_T) + 114; // well ahead of him: the top row is above his head, the arm must clear it
const finalItems = [layoutLine("‖ω‖_∞<∞", FINAL_X, ROW_Y[0], GLYPH_H * 0.92, 501), layoutLine("∀t∈[0,T]", FINAL_X + 2, ROW_Y[1], GLYPH_H, 502)];
// the result: two lines in a bigger hand, low enough that boxing it keeps the chalk hand below and ahead of his face
const RES_H = GLYPH_H * 1.25;
const TOP_PAD = 1.3;
const RES_X = X_STOP + 93;
const RES_Y = [-216, -180] as const; // baselines
const res1 = layoutLine("u∈C^∞", RES_X, RES_Y[0], RES_H, 601);
const res2 = layoutLine("∀t>0", RES_X + 3, RES_Y[1], RES_H, 602);
const BOX = { x0: X_STOP + 84, x1: X_STOP + 193, y0: RES_Y[0] - RES_H * TOP_PAD, y1: RES_Y[1] + 10 };
const boxStroke = freehand(
  [
    // from the bottom-right (where the result ends) round by the left and the top, closing on the right where the tick
    // goes: the top-left corner (nearest his face) is passed once, in motion, never a start or an end
    [BOX.x1 - 4, BOX.y1 + 1],
    [(BOX.x0 + BOX.x1) / 2, BOX.y1 + 1],
    [BOX.x0, BOX.y1 - 1],
    [BOX.x0 - 1, (BOX.y0 + BOX.y1) / 2],
    [BOX.x0 + 1, BOX.y0],
    [(BOX.x0 + BOX.x1) / 2, BOX.y0 - 1],
    [BOX.x1, BOX.y0 + 1],
    [BOX.x1 - 1, (BOX.y0 + BOX.y1) / 2],
    [BOX.x1 - 4, BOX.y1 + 2],
    [BOX.x1 - 14, BOX.y1 + 3],
  ],
  7,
  0.5,
  4,
);
// the tick: ~1.5x the result's line height, one confident stroke whose long arm runs up over the box's right side
const TICK = { x: Math.max(res1.w, res2.w) + RES_X + 3, y: (RES_Y[0] + RES_Y[1]) / 2 - 2 };
const tickStroke = freehand(
  [
    [TICK.x, TICK.y],
    [TICK.x + 9, TICK.y + 13],
    [TICK.x + 35, TICK.y - 23],
  ],
  9,
  0.15,
  2,
);
const JOBS: Job[] = [
  ...columns.map((c) => makeJob(c.t0, DIAGRAM_AT.has(c.t0) ? COL_T + 3 : COL_T, c.items)),
  makeJob(FINAL_T, 5, finalItems.map((l) => ({ strokes: l.strokes }))),
  makeJob(66, 6, [{ strokes: res1.strokes }, { strokes: res2.strokes }]),
  makeJob(72.5, 8.5, [{ strokes: [boxStroke] }]),
  makeJob(81.5, 5, [{ strokes: [tickStroke] }], "orange"),
];
const WRITE_END = 87;
/** the chalk tip (board units) at t: on a job, or hopping between two (eased, in the air); null before/after */
export const tipAt = (t: number): { p: P2; drawing: boolean } | null => {
  for (let i = 0; i < JOBS.length; i++) {
    const j = JOBS[i];
    const r = tipInJob(j, t);
    if (r) return r;
    const n = JOBS[i + 1];
    if (n && t > j.t0 + j.T && t < n.t0) {
      const a = tipInJob(j, j.t0 + j.T)!.p;
      const b = tipInJob(n, n.t0)!.p;
      const u = sst(j.t0 + j.T, n.t0, t);
      // the arc bulges ahead (+X, away from his face) and up
      return { p: [a[0] + (b[0] - a[0]) * u + 0 * Math.sin(Math.PI * u), a[1] + (b[1] - a[1]) * u - 6 * Math.sin(Math.PI * u)], drawing: false };
    }
  }
  const last = JOBS[JOBS.length - 1];
  if (t >= last.t0 + last.T) return { p: tipInJob(last, last.t0 + last.T)!.p, drawing: false };
  return null;
};

// the board: its left end far out of frame, the right end just past the box; the panels: a left wing, a wide centre,
// a right wing that begins in the gutter before the last walking column
const BOARD = { x0: -1100, x1: BOX.x1 + 560, y0: -388, y1: -150 };
const DIV2 = LAST_COL.x - 9;
const DIV1 = DIV2 - 520;
const DIV3 = BOX.x1 + 34; // the next (clean) panel begins just past the result
const X_SIDE = BOARD.x1 + 600; // the hall's side wall: far out of frame

// ---- the camera -----------------------------------------------------------------------------------------------------
const K = 1.86; // the depth reference zoom (= f0)
const K0 = 1.86; // f0: close on him and the board (lines ~40 px)
const K1 = 2.0; // the settled frame: a gentle push-in on the result during the settle
const DEPTH: DepthOpts = { eyeY: -540, dRef: 1400, kRef: K, dolly: 0.5 };
const CX0 = 395;
const CX1 = 665;
/** one lobe in (f0-14), constant, one settle (f52-99): a velocity profile integrated (pure, tabulated) */
const camV = (f: number) => (0.35 + 0.65 * sst(0, 14, f)) * (1 - sst(48, 92, f));
const CAM_TAB = (() => {
  const n = 1020;
  const out: number[] = [0];
  let s = 0;
  for (let i = 1; i <= n; i++) {
    const f = ((i - 0.5) / n) * 101;
    s += camV(f) * (101 / n);
    out.push(s);
  }
  return out.map((v) => v / s);
})();
const camU = (f: number) => {
  const x = c01(f / 101) * (CAM_TAB.length - 1);
  const i = Math.min(CAM_TAB.length - 2, Math.floor(x));
  return CAM_TAB[i] + (CAM_TAB[i + 1] - CAM_TAB[i]) * (x - i);
};
/** the camera: the truck (camU) and, in log-zoom, the push-in (one lobe f36-99); the feet held at screen y 1060 */
export const camAt = (f: number): Cam => {
  const k = Math.exp(Math.log(K0) + (Math.log(K1) - Math.log(K0)) * sst(36, 99, f));
  return { k, cx: CX0 + (CX1 - CX0) * camU(f), cy: -100 / k };
};
const REST = swayCam(camAt(0), 0);

// ---- colours ----------------------------------------------------------------------------------------------------------
const SLATE: Mat = { lit: "#4D5A55", mid: "#3D4945", dark: "#2B3431" };
const PLASTER: Mat = { lit: "#B3A88F", mid: "#9A8F78", dark: "#6E6655" };
const ALU: Mat = { lit: "#A9AEAA", mid: "#7F8582", dark: "#4E5452" };
const SEAT: Mat = { lit: "#8C5A45", mid: "#6E4434", dark: "#3E261C" };
const CHALK = "#EEE7D7";
const CH: P2 = [11, -7]; // the chalk's rest vector (units, grip -> tip)
const LEAN_MAX = 20; // standing: the lean-in (degrees) when the tip is far ahead of his feet
const LEAN_FROM = [110, 170] as const; // ... from 110 to 170 units ahead (figure units)
const LEAN_WALK = 16; // walking: the lean-in, smoothed
const LEAN_SMOOTH = 2; // standing: the lean's averaging half-window (frames)

// ---- seats: tiered rows toward the camera (empty) ----------------------------------------------------------------------
const ROWS = [0, 1, 2, 3].map((r) => ({ Z: -560 - 115 * r, H: 30 * (r + 1) }));

/** the Genius at frame t under camera cam (pure): his pose, feet, scale, the chalk (grip -> tip, 2D world) and the
 *  IK error (units) of the writing hand */
export const geniusAt = (frame: number, cam: Cam) => {
  const P = perspective(cam, DEPTH);
  const onBoard = (p: P2): P2 => P.p(p[0], p[1], Z_B);
  const XG = xgAt(frame);
  const { at, scale } = P.at(XG, 0);
  const stopAmt = 1 - walkAmt(frame);
  let q: GeniusPose = G.walk(1, phaseAt(frame) * 24, walkAmt(frame));
  // breathing, and once stopped the near arm settles to hang
  const stand = G.stand(1, frame);
  q = { ...q, armL: lerpPose(q, stand, 0.8 * stopAmt).armL, crouch: q.crouch - 0.9 * Math.sin((frame / 24 / 4.2) * 2 * Math.PI) };
  // the writing hand: the grip follows the tip (smoothed over +-1 frame), the chalk runs from the grip to the tip
  const tipNow = tipAt(frame);
  const writeAmt = frame <= WRITE_END ? 1 : 1 - sst(WRITE_END, WRITE_END + 10, frame);
  let tipW: P2 | null = null;
  let gripU: P2 | null = null;
  if (writeAmt > 0) {
    const samples = [-0.5, 0, 0.5].map((d) => tipAt(Math.min(frame + d, WRITE_END)) ?? tipAt(WRITE_END)!);
    const sm: P2 = [samples.reduce((s, v) => s + v.p[0], 0) / 3, samples.reduce((s, v) => s + v.p[1], 0) / 3];
    const tip = (tipNow ?? tipAt(WRITE_END)!).p;
    tipW = onBoard(tip);
    const smW = onBoard(sm);
    const tipU: P2 = [(tipW[0] - at[0]) / scale, (tipW[1] - at[1]) / scale];
    // the grip trails the smoothed tip by the chalk's rest vector; the chalk (grip -> exact tip) stays 8..17 units
    let g: P2 = [(smW[0] - at[0]) / scale - CH[0], (smW[1] - at[1]) / scale - CH[1]];
    const v: P2 = [tipU[0] - g[0], tipU[1] - g[1]];
    const L = Math.hypot(v[0], v[1]);
    const Lc = Math.max(8, Math.min(17, L));
    g = L > 1e-6 ? [tipU[0] - (v[0] * Lc) / L, tipU[1] - (v[1] * Lc) / L] : [tipU[0] - CH[0], tipU[1] - CH[1]];
    gripU = g;
    // standing to write he leans in only when the chalk goes far ahead (the box's right side, the tick): upright while
    // the hand is near, so his face stays back from it; the lean relaxes as he lowers the chalk
    const ew = writeAmt * writeAmt * (3 - 2 * writeAmt);
    // (the reach is looked at over +-6 frames so the lean swells and eases, never flicks with a fast stroke)
    const reachAt = (d: number) => {
      const tp = tipAt(Math.min(frame + d, WRITE_END)) ?? tipAt(WRITE_END)!;
      return sst(LEAN_FROM[0], LEAN_FROM[1], (onBoard(tp.p)[0] - at[0]) / scale);
    };
    // standing: a tent-weighted max over +-1.5 frames, averaged over +-LEAN_SMOOTH (he leans in for a far stroke and eases
    // back after it, without rocking);
    // walking: a gentler lean, the reach averaged over +-4 frames (no flicks on the fast hops between columns)
    const tentMax = (c: number) => {
      let m = 0;
      for (let e = -1.5; e <= 1.5; e += 0.5) m = Math.max(m, reachAt(c + e) * (1 - Math.abs(e) / 2.5));
      return m;
    };
    let reachS = 0;
    for (let c = -LEAN_SMOOTH; c <= LEAN_SMOOTH; c += 1) reachS += tentMax(c) / (2 * LEAN_SMOOTH + 1);
    let reachW = 0;
    for (let d = -4; d <= 4; d += 1) reachW += reachAt(d) / 9;
    q = { ...q, lean: q.lean + ew * (LEAN_MAX * stopAmt * reachS + LEAN_WALK * (1 - stopAmt) * reachW) };
    const grip = covidGripTo("officer", 3, q, { R: gripU }, [0, 0], 1);
    const restQ = q;
    q = writeAmt >= 1 ? grip : (lerpPose(restQ, grip, writeAmt * writeAmt * (3 - 2 * writeAmt)) as GeniusPose);
    const ey: P2 = [at[0] + 30 * scale, at[1] - 286 * scale];
    q = { ...q, look: [c01((tipW[0] - ey[0]) / 90) * 0.8, Math.max(-0.6, Math.min(0.5, (tipW[1] - ey[1]) / 120))] as P2, pitch: q.pitch + Math.max(-7, Math.min(6, (tipW[1] - ey[1]) / 9)) * writeAmt };
  }
  // the settled look: three-quarter toward the board, eyes on the boxed result
  const settle = sst(86, 98, frame);
  if (settle > 0) {
    const boxC = onBoard([(BOX.x0 + BOX.x1) / 2, (BOX.y0 + BOX.y1) / 2]);
    const ey: P2 = [at[0] + 30 * scale, at[1] - 286 * scale];
    q = { ...q, look: [0.75 * settle + (q.look?.[0] ?? 0) * (1 - settle), Math.min(0.5, (boxC[1] - ey[1]) / 160) * settle + (q.look?.[1] ?? 0) * (1 - settle)] as P2, yaw: q.yaw + 0.1 * settle, headYaw: q.headYaw + 0.22 * settle, mouth: 0.22 + 0.18 * settle };
    // the living hold: a slow weight shift (a small sway of the torso) under the breath
    q = { ...q, lean: q.lean + 1.4 * settle * Math.sin(((frame - 88) / 24 / 3.4) * 2 * Math.PI) };
  }
  const built = buildGenius(0, q);
  const handR = built.anchors.handR;
  const gripW: P2 = [at[0] + handR[0] * scale, at[1] + handR[1] * scale];
  const chalkTip: P2 = tipW && writeAmt >= 0.999 ? tipW : [gripW[0] + CH[0] * scale, gripW[1] + CH[1] * scale];
  const chalkBase: P2 = [gripW[0] + (chalkTip[0] - gripW[0]) * 0.25, gripW[1] + (chalkTip[1] - gripW[1]) * 0.25];
  const ikErr = gripU && writeAmt >= 0.999 ? Math.hypot(handR[0] - gripU[0], handR[1] - gripU[1]) : 0;
  return { q, XG, at, scale, chalkTip, chalkBase, gripW, ikErr, anchors: built.anchors, writeAmt };
};

const ProofOnItsOwn: React.FC<z.infer<typeof schema>> = ({ camFrame }) => {
  const frame = useCurrentFrame();
  const cf = camFrame >= 0 ? camFrame : frame;
  const cam = swayCam(camAt(cf), cf);
  const A = airWorldOf({ cam, rest: REST, depth: DEPTH, frame, scene: { mood: "interior" } });
  const P = A.P;
  const r = P.r(Z_B);
  // the board plane is parallel to the screen: board units -> 2D world is one affine map
  const bT = `translate(${(cam.cx * (1 - r)).toFixed(3)} ${(DEPTH.eyeY * (1 - r)).toFixed(3)}) scale(${r.toFixed(6)})`;
  const onBoard = (p: P2): P2 => P.p(p[0], p[1], Z_B);

  // ---- the Genius ------------------------------------------------------------------------------------------------------
  const gs = geniusAt(frame, cam);
  const { q, XG, at, scale, chalkTip, chalkBase } = gs;

  // ---- the chalk on the board: every stroke whose slot has begun (the current one up to the tip) -----------------------
  const chalkCream = A.tone(CHALK, Z_B, 250);
  const chalkOrange = A.toneO("#FFB000", Z_B, 250);
  const done: string[] = [];
  const doneO: string[] = [];
  for (const j of JOBS) {
    if (frame < j.t0) continue;
    for (let i = 0; i < j.strokes.length; i++) {
      if (frame < j.starts[i]) break;
      const pts = frame >= j.ends[i] ? j.strokes[i].pts : along(j.strokes[i].pts, (frame - j.starts[i]) / Math.max(1e-6, j.ends[i] - j.starts[i])).prefix;
      (j.color === "orange" ? doneO : done).push(pathD(pts));
    }
  }

  // ---- the hall ----------------------------------------------------------------------------------------------------------
  const wallTop = -1300;
  const wallQ = [P.p(-2000, wallTop, Z_W), P.p(X_SIDE, wallTop, Z_W), P.p(X_SIDE, 0, Z_W), P.p(-2000, 0, Z_W)];
  const sideQ = [P.p(X_SIDE, wallTop, Z_W), P.p(X_SIDE, wallTop, -1300), P.p(X_SIDE, 0, -1300), P.p(X_SIDE, 0, Z_W)];
  const poly = (pts: P2[]) => `M${pts.map((p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join("L")}Z`;
  const boardQ = [onBoard([BOARD.x0, BOARD.y0]), onBoard([BOARD.x1, BOARD.y0]), onBoard([BOARD.x1, BOARD.y1]), onBoard([BOARD.x0, BOARD.y1])];
  const lw = A.lw();

  // seat rows, far to near: seat backs (rounded tops) on each tier, sinking into the low air
  const seatEls: React.ReactNode[] = [];
  ROWS.forEach((row, ri) => {
    const pitch = 100;
    const rr = P.r(row.Z);
    const x2a = cam.cx - 700 / cam.k / rr;
    const x2b = cam.cx + 700 / cam.k / rr;
    const veil = 0.5 + 0.1 * ri;
    const tone = (hex: string, sy: number) => mixHex(A.tone(hex, row.Z, row.H), A.screenAir(sy), veil);
    // the tier's riser and its floor edge
    const yTop = -(row.H + 150);
    const riserA = P.p(x2a, -row.H, row.Z + 40);
    const riserB = P.p(x2b, 0, row.Z + 40);
    seatEls.push(<rect key={`ri${ri}`} x={riserA[0]} y={riserA[1]} width={riserB[0] - riserA[0]} height={Math.max(0, 1200 - riserA[1])} fill={tone(SEAT.dark, 1500)} />);
    for (let X = Math.floor(x2a / pitch) * pitch; X <= x2b; X += pitch) {
      const xa = X + 8;
      const xb = X + pitch - 8;
      const a0 = P.p(xa, yTop, row.Z);
      const b1 = P.p(xb, -row.H - 40, row.Z);
      const rad = (b1[0] - a0[0]) * 0.28;
      const sy = 960 + (a0[1] - cam.cy) * cam.k;
      seatEls.push(
        <g key={`s${ri}_${X}`}>
          <rect x={a0[0]} y={a0[1]} width={b1[0] - a0[0]} height={b1[1] - a0[1] + 60} rx={rad} fill={tone(SEAT.mid, sy)} />
          <rect x={a0[0] + rad * 0.3} y={a0[1] + rad * 0.15} width={(b1[0] - a0[0]) * 0.75} height={rad * 0.5} rx={rad * 0.25} fill={tone(SEAT.lit, sy)} opacity={0.55} />
        </g>,
      );
    }
  });

  return (
    <AirStage v={A.v} bloom={0.22} window={{ x: -40, y0: 180, y1: 700, beams: 3 }}>
      <WorldSvg cam={cam}>
        <defs>
          <linearGradient id="pw-wall" gradientUnits="userSpaceOnUse" x1="0" y1={P.p(0, wallTop, Z_W)[1]} x2="0" y2={P.p(0, 0, Z_W)[1]}>
            <stop offset="0" stopColor={A.tone(PLASTER.mid, Z_W, 700)} />
            <stop offset="0.6" stopColor={A.tone(PLASTER.lit, Z_W, 250)} />
            <stop offset="1" stopColor={A.tone(PLASTER.mid, Z_W, 40)} />
          </linearGradient>
          <linearGradient id="pw-side" gradientUnits="userSpaceOnUse" x1={P.p(X_SIDE, 0, Z_W)[0]} y1="0" x2={P.p(X_SIDE, 0, -900)[0]} y2="0">
            <stop offset="0" stopColor={A.tone(PLASTER.dark, Z_W, 300)} />
            <stop offset="1" stopColor={A.tone(PLASTER.mid, -600, 300)} />
          </linearGradient>
          <filter id="pw-chalk" x="-2%" y="-10%" width="104%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 2.2 -0.55" result="m" />
            <feComposite in="SourceGraphic" in2="m" operator="in" />
          </filter>
        </defs>
        {/* the back wall and the hall's right wall */}
        <path d={poly(wallQ)} fill="url(#pw-wall)" />
        <path d={poly(sideQ)} fill="url(#pw-side)" />
        {/* the floor (timber, toward the seats) */}
        <AirFloor A={A} x0={-2200} x1={X_SIDE} z0={-760} z1={Z_W} mat={MAT.timber} course={170} plank={44} jointAmt={0.6} melt={0} />
        <AirBox A={A} X0={-2200} X1={X_SIDE} Y0={-14} Y1={0} Z0={Z_W - 4} Z1={Z_W} mat={MAT.timber} uid="skirt" rim={0.4} />
        <path d={poly([P.p(X_SIDE, -14, Z_W), P.p(X_SIDE, -14, -900), P.p(X_SIDE, 0, -900), P.p(X_SIDE, 0, Z_W)])} fill={A.tone(MAT.timber.dark, -300, 10)} />
        {/* the board: slate, its panel strips, old erased chalk, the frame */}
        <path d={poly(boardQ)} fill={A.tone(SLATE.mid, Z_B, 270)} stroke={A.tone(SLATE.dark, Z_B, 270)} strokeWidth={lw} />
        <g transform={bT}>
          {Array.from({ length: 36 }, (_, i) => {
            const x = BOARD.x0 + 120 + i * 70 + 50 * hash01(i + 3);
            return <ellipse key={`gh${i}`} cx={x} cy={-280 + 110 * (hash01(i * 3 + 1) - 0.5)} rx={70 + 50 * hash01(i + 9)} ry={9 + 9 * hash01(i + 5)} fill={CHALK} opacity={0.025 + 0.025 * hash01(i + 11)} />;
          })}
          {[DIV1, DIV2, DIV3].map((X, i) => (
            <rect key={`dv${i}`} x={X - 2.5} y={BOARD.y0} width={5} height={BOARD.y1 - BOARD.y0} fill={A.tone(ALU.mid, Z_B, 270)} />
          ))}
          {[DIV1, DIV2, DIV3].map((X, i) => (
            <rect key={`dvl${i}`} x={X - 2.5} y={BOARD.y0} width={1.4} height={BOARD.y1 - BOARD.y0} fill={A.tone(ALU.lit, Z_B, 270)} opacity={0.8} />
          ))}
          <g filter="url(#pw-chalk)" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d={done.join("")} stroke={chalkCream} strokeWidth={1.7} opacity={0.93} />
            <path d={doneO.join("")} stroke={chalkOrange} strokeWidth={2.3} />
          </g>
        </g>
        <AirBox A={A} X0={BOARD.x0} X1={BOARD.x1} Y0={BOARD.y0 - 8} Y1={BOARD.y0} Z0={Z_B - 3} Z1={Z_W} mat={ALU} uid="railT" rim={0.8} />
        <AirBox A={A} X0={BOARD.x1} X1={BOARD.x1 + 7} Y0={BOARD.y0 - 8} Y1={BOARD.y1 + 6} Z0={Z_B - 3} Z1={Z_W} mat={ALU} uid="railR" rim={0.8} />
        <AirBox A={A} X0={BOARD.x0} X1={BOARD.x1 + 7} Y0={BOARD.y1} Y1={BOARD.y1 + 6} Z0={Z_B - 16} Z1={Z_W} mat={ALU} uid="ledge" rim={1} />
        {[{ x: 90, w: 9 }, { x: 228, w: 6 }, { x: 486, w: 8 }].map((c, i) => (
          <AirBox key={`ck${i}`} A={A} X0={c.x} X1={c.x + c.w} Y0={BOARD.y1 - 3} Y1={BOARD.y1} Z0={Z_B - 12} Z1={Z_B - 9} mat={{ lit: CHALK, mid: "#D9CDB4", dark: "#A89C84" }} uid={`ck${i}`} rim={0} />
        ))}
        {/* the Genius: his contact shadow, the chalk stick (in his far hand, behind his body), him */}
        <AirShadow A={A} X={XG + 4} Z={0} w={66} d={30} uid="gS" amt={0.8} />
        <path d={`M${chalkBase[0].toFixed(2)},${chalkBase[1].toFixed(2)}L${chalkTip[0].toFixed(2)},${chalkTip[1].toFixed(2)}`} stroke={A.tone(CHALK, 0, 260)} strokeWidth={3.4 * scale} strokeLinecap="round" />
        <Genius variant={0} pose={q} at={at} scale={scale} uid="g0" frame={frame} fog={A.folkFog(0)} unitPx={cam.k} />
        {/* the empty seats below, near the lens, in the low air */}
        {seatEls}
      </WorldSvg>
    </AirStage>
  );
};

export default ProofOnItsOwn;
