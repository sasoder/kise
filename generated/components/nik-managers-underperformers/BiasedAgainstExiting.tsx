// ---------------------------------------------------------------------------
// BiasedAgainstExiting (nik-managers-underperformers, cut 14). Cheeky Pint style, the picture-book world
// (styles/cheeky-pint.md). Opaque 1080x1920, 23.976 fps, 77 frames. The office is officeRoom.tsx (wall, golden
// windows, light patch, the door with its EXIT sign, desks, chairs) on officeTokens.ts; the people are officeCast.tsx.
//
// CHECK LINE: "The manager can see exactly who is not performing, and hides behind his own review sheet rather than
// show him the door."
//
// THE LINE: "(The problem is that a lot of managers are inherently) biased against exiting underperformers."
// WORD -> FRAME (brief, 23.976 fps): (inherently) 0-12 · biased 12 · against 26 · exiting 37 · underperformers 48
// (ends 74) · cut 77.
// DURATION: the slot 14.097 -> 17.309 s = 3.212 s x 23.976 = 77 frames (f0..f76).
//
// THE MOTION: one eased pull-out with a small truck right, already moving at f0 (an ease-out from a close on the
// sleeper slumped asleep on his desk, "z"s rising) to the resolved wide (settled ~f48), then a slow push back in toward
// the pair (+4 % by f76, still closing in at the cut). It brings in the manager standing over him, holding his review
// clipboard in both hands at chest height and looking down at him (in by "biased", f12), and the door with the amber
// EXIT sign at the right. On "against exiting" (f25-39) he lifts the board up across his eyes, leaning back, face turned
// up and away; its lower edge stops at the bottom of his eye (cheek, nose, tight mouth and chin below it, hair behind),
// covered from f(EYE_COVERED, below; <= f37). THE PEEK (f50-66): he lifts the board a little and drops his face, one
// eye glancing down at the sleeper; the sleeper snores (a deeper breath, one big "z" at f54); he hides again, covered by
// f65, holding to the end, the board with a tiny sway.
// CONTACT: both hands hold the board from f0 at its front (left) side, ahead of his face (the near hand over the lower
// edge by the corner, the far hand over the left edge) and never let go; the board's first move: f25. Long cream sleeves.
// AMBER = the performance decision: here the EXIT the manager will not use (the sign only); cream = the subject
// (paper, the sleeper's jumper, the "z"s), board = context. Nothing else glows; the bloom is fixed.
//
// SOURCES: none (no real figures, no logos).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { COLOR, mixHex } from "../kits/cheeky-pint/stoutShared";
import { CLOTH, HAIR, MGR, Manager, RIG, SKIN, Sleeper, boardToHip, managerEye, sleeperZSource, type Look, type ManagerPose, type P2 } from "./officeCast";
import { Desk, FloorShadow, Monitor, OfficeStage, ROOM, WALL_F, toScreen, wallPt, type OfficeCam } from "./officeRoom";
import { OFFICE } from "./officeTokens";

export const FPS = 24000 / 1001;
export const DURATION = 77;
/** castProbe (review only): the three figures at rest (the f0 poses) under the resolved wide's camera */
export const schema = z.object({ castProbe: z.boolean().default(false) });
export const defaultProps = schema.parse({});

const c01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ss = (a: number, b: number, f: number) => {
  const u = c01((f - a) / (b - a));
  return u * u * (3 - 2 * u);
};
const ss5 = (a: number, b: number, f: number) => {
  const u = c01((f - a) / (b - a));
  return u * u * u * (u * (6 * u - 15) + 10);
};
const lerpP = (a: P2, b: P2, t: number): P2 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];

// --- the layout (world px on the floor plane = screen px in the resolved wide) ---------------------------------------
const FLOOR = ROOM.floorY;
const SEAT_S = 1.25;
const MGR_S = 1.35;
const HIP_Y = FLOOR - RIG.floor * SEAT_S;
const DESK_LOCAL = -112;
const DESK_TOP = HIP_Y + DESK_LOCAL * SEAT_S;
const SLEEPER_X = 650;
const DESK = { x0: 30, x1: SLEEPER_X - 140 * SEAT_S };
/** between the sleeper's chair back and the door, a strip of wall clear on both sides of him */
const MGR_X = 846;
const MGR_HIP_Y = FLOOR + 6 - MGR.legs * MGR_S;

const SLEEPER_LOOK: Look = { skin: SKIN.light, hair: HAIR.chestnut, hairStyle: "curly", top: CLOTH.oat, pants: CLOTH.denim };
/** the manager: a cream shirt with the sleeves rolled, a dark blue-grey waistcoat and trousers, a plum tie (he separates
 *  from the caramel wall in value, and his cream arm from his dark waistcoat) */
const SUIT = mixHex(CLOTH.denim, COLOR.shadow, 0.3);
const MGR_LOOK: Look = { skin: SKIN.tan, hair: HAIR.grey, hairStyle: "part", top: CLOTH.cream, vest: SUIT, pants: SUIT, tie: CLOTH.plum };

// --- the camera ----------------------------------------------------------------------------------------------------
/** close on the sleeper's head (screen ~522, 880 at k 2.4) -> the resolved wide; then a slow push back in */
const SLEEPER_HEAD: P2 = [SLEEPER_X - 190 * SEAT_S, HIP_Y - 208 * SEAT_S];
const CLOSE = { k: 2.4, x: SLEEPER_HEAD[0] + (540 - 522) / 2.4, y: SLEEPER_HEAD[1] + (960 - 880) / 2.4 };
/** the resolved wide: the sleeper's head at screen x ~250, the manager ~620-800, the door and its sign right of him;
 *  feet at ~y 1540 */
const WIDE = { k: 1.2, x: 654, y: 917 };
const PULL_END = 48;
/** an ease-out from f0 (the move is already under way when the cut opens) */
const pullU = (f: number) => 1 - Math.pow(1 - c01(f / PULL_END), 3);
/** the push back in: its rate ramps up over f40-56 and holds, so the frame is still closing in at the cut (the
 *  integral of the ramp, normalised to 1 at f76); +PUSH in scale by f76, about the screen point PUSH_AT */
const PUSH = 0.04;
const PUSH_AT: P2 = [850, 800];
const PUSH_TABLE = (() => {
  const t = [0];
  for (let f = 1; f <= DURATION + 1; f++) t.push(t[f - 1] + ss(40, 56, f - 0.5));
  return t.map((v) => v / t[DURATION - 1]);
})();
const pushP = (f: number) => {
  const i = Math.max(0, Math.min(DURATION, Math.floor(f)));
  return lerp(PUSH_TABLE[i], PUSH_TABLE[i + 1], c01(f - i));
};
export const camAt = (f: number): OfficeCam => {
  const u = pullU(f);
  const k0 = Math.exp(lerp(Math.log(CLOSE.k), Math.log(WIDE.k), u));
  const x0 = lerp(CLOSE.x, WIDE.x, u);
  const y0 = lerp(CLOSE.y, WIDE.y, u);
  const k = k0 * (1 + PUSH * pushP(f));
  // the world point under PUSH_AT stays put
  const d = 1 / k0 - 1 / k;
  return { k, x: x0 + (PUSH_AT[0] - 540) * d, y: y0 + (PUSH_AT[1] - 960) * d };
};

// --- the manager's gesture -----------------------------------------------------------------------------------------
const RAISE = [25, 39] as const;
/** at rest: the board held in both hands at chest height, tipped toward the sleeper, his face down to him */
const REST_BOARD = { x: -112, y: -118, a: -14 };
/** the pose he ends in (leaning back a touch, his face turned up and away) */
const UP_TURN = { lean: 0, tilt: 6, look: [5, -4] as P2 };
/** the raised board covers his eyes, brow and forehead: its lower edge at the bottom of his eye, a little ahead of his
 *  face, so the cheek and its blush, the nose, the tight mouth and the chin stay visible below it */
const UP_EYE = managerEye(UP_TURN).eye;
const UP_BOARD = { x: UP_EYE[0] - 32, y: UP_EYE[1] + 8 - MGR.board.h / 2, a: 3 };
/** THE PEEK: f50-56 he lifts the board a little and drops his face toward the sleeper (one eye shows, glancing down at
 *  him), f60-66 he hides again */
const PEEK_IN = [50, 56] as const;
const PEEK_OUT = [60, 66] as const;
const peekAt = (f: number) => ss5(PEEK_IN[0], PEEK_IN[1], f) * (1 - ss5(PEEK_OUT[0], PEEK_OUT[1], f));
const PEEK_TURN = { tilt: -6, look: [-5, 7] as P2 };
/** the hands, both at the board's front (left) side, ahead of his face: the near hand over its lower edge by the
 *  corner, the far hand over its left edge a little higher (board-local); so no hand or forearm sits over his face */
const NEAR_GRIP: P2 = [-MGR.board.w / 2 + 16, MGR.board.h / 2 - 2];
const FAR_GRIP: P2 = [-MGR.board.w / 2 + 1, MGR.board.h / 2 - 38];
export const managerPose = (f: number): ManagerPose => {
  const u = ss5(RAISE[0], RAISE[1], f);
  const settle = ss(RAISE[1] - 2, RAISE[1] + 10, f);
  const sway = Math.sin((f - RAISE[1]) * 0.13) * settle;
  const idle = Math.sin(f * 0.16) * (1 - u);
  const pk = peekAt(f);
  const board = {
    x: lerp(REST_BOARD.x, UP_BOARD.x, u) - 16 * Math.sin(Math.PI * u) + 0.6 * sway,
    y: lerp(REST_BOARD.y, UP_BOARD.y, u) + 1.4 * idle + 0.8 * sway - 16 * pk,
    a: lerp(REST_BOARD.a, UP_BOARD.a, u) + 0.5 * sway,
  };
  const turn = ss5(26, 40, f);
  return {
    lean: lerp(-5, UP_TURN.lean, ss5(25, 41, f)) + 0.25 * sway,
    tilt: lerp(lerp(-14, UP_TURN.tilt, turn), PEEK_TURN.tilt, pk),
    board,
    nearHand: boardToHip(board, NEAR_GRIP),
    farHand: boardToHip(board, FAR_GRIP),
    nearGrip: NEAR_GRIP,
    farGrip: FAR_GRIP,
    // the eyes close as the board comes up and open for the peek
    closed: ss(36, 40, f) * (1 - ss(50, 54, f) * (1 - ss(62, 66, f))),
    look: lerpP(lerpP([-2, 6], UP_TURN.look, turn), PEEK_TURN.look, pk),
    mouth: "flat",
  };
};

// --- the "z"s: card letters rising from the back of his head, draining into the wall tone as they go -----------------
const Z_PERIOD = 22;
const Z_LIFE = 88;
/** THE SNORE: a deeper breath in (f44-53) and out, and one big "z" leaves at SNORE_Z */
const SNORE_Z = 54;
const breathAt = (f: number) => {
  const base = Math.sin((f / 60) * Math.PI * 2 + 0.6);
  const deep = lerp(1.25, -1.1, ss(52, 60, f));
  return lerp(base, deep, ss(44, 52, f) * (1 - ss(60, 70, f)));
};
const zSourceWorld = (f: number): P2 => {
  const p = sleeperZSource(breathAt(f));
  return [SLEEPER_X + p[0] * SEAT_S, HIP_Y + p[1] * SEAT_S];
};
const Zs: React.FC<{ f: number }> = ({ f }) => {
  const out: React.ReactNode[] = [];
  for (let i = -6; i < 7; i++) {
    const big = i === 6;
    const birth = big ? SNORE_Z : i * Z_PERIOD;
    const age = f - birth;
    if (age < 0 || age > Z_LIFE) continue;
    const src = zSourceWorld(birth);
    const x = src[0] + age * (big ? 2.4 : 2.1) + 10 * Math.sin(age * 0.08 + i * 1.7);
    const y = src[1] - age * 2.7;
    const size = (30 + age * 0.4) * (big ? 1.5 : 1);
    const a = -14 + 9 * Math.sin(age * 0.06 + i);
    const drain = ss(34, Z_LIFE, age);
    const fill = mixHex(COLOR.cream, OFFICE.wallTop, drain);
    const t = size * 0.27;
    const w = size * 0.8;
    const h = size;
    const d = `M${-w / 2} ${-h / 2}L${w / 2} ${-h / 2}L${-w / 2} ${h / 2}L${w / 2} ${h / 2}`;
    out.push(
      <g key={i} transform={`translate(${x.toFixed(3)} ${y.toFixed(3)}) rotate(${a.toFixed(3)})`}>
        <path d={d} transform="translate(2 4)" stroke={COLOR.shadow} strokeWidth={t} strokeLinejoin="round" strokeLinecap="round" fill="none" opacity={0.18 * (1 - drain)} style={{ filter: "blur(2px)" }} />
        <path d={d} stroke={fill} strokeWidth={t} strokeLinejoin="round" strokeLinecap="round" fill="none" />
      </g>,
    );
  }
  return <g>{out}</g>;
};

// --- probes (screen space) -----------------------------------------------------------------------------------------
const mgrWorld = (p: P2): P2 => [MGR_X + p[0] * MGR_S, MGR_HIP_Y + p[1] * MGR_S];
const boardCornersWorld = (pose: ManagerPose) => {
  const { w, h } = MGR.board;
  return ([[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]] as P2[]).map((q) => mgrWorld(boardToHip(pose.board, q)));
};
const inPoly = (p: P2, poly: P2[]) => {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};
/** the eye (with its dot's radius) wholly behind the board */
const eyeCovered = (f: number) => {
  const pose = managerPose(f);
  const e = mgrWorld(managerEye(pose).eye);
  const poly = boardCornersWorld(pose);
  const r = 0.095 * RIG.R * MGR.headK * MGR_S + 2;
  return [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]].every(([dx, dy]) => inPoly([e[0] + dx, e[1] + dy], poly));
};
export const EYE_COVERED = (() => {
  for (let f = 0; f < DURATION; f++) if (eyeCovered(f) && eyeCovered(f + 1)) return f;
  return -1;
})();

export const debugAt = (f: number) => {
  const cam = camAt(f);
  const pose = managerPose(f);
  const S = (p: P2, wf = 1) => toScreen(cam, p[0], p[1], wf).map((v) => Math.round(v));
  const sg = ROOM.sign;
  const D = ROOM.door;
  return {
    cam,
    sleeperHead: S(SLEEPER_HEAD),
    managerEye: S(mgrWorld(managerEye(pose).eye)),
    managerHead: S(mgrWorld(managerEye(pose).head)),
    board: boardCornersWorld(pose).map((p) => S(p)),
    sign: [S(wallPt(sg.cx - sg.w / 2, sg.y0), WALL_F), S(wallPt(sg.cx + sg.w / 2, sg.y0 + sg.h), WALL_F)],
    doorLeft: S(wallPt(D.x0 - 18, D.y0), WALL_F)[0],
    /** the sleeper's chair back (right edge) and the manager's front shoe tip / back (screen x) */
    chairBack: S([SLEEPER_X + 46 * SEAT_S, HIP_Y])[0],
    mgrFront: S(mgrWorld([-94, 0]))[0],
    mgrBack: S(mgrWorld([30, 0]))[0],
    eyeCovered: eyeCovered(f),
  };
};

(() => {
  // BAE_PROBE=1 (probe scripts only): print instead of throwing
  const probe = typeof process !== "undefined" && !!process.env?.BAE_PROBE;
  const fail = (m: string) => {
    if (probe) console.log(`CHECK: ${m}`);
    else throw new Error(`BiasedAgainstExiting: ${m}`);
  };
  if (EYE_COVERED < 30 || EYE_COVERED > 37) fail(`the clipboard covers his eyes at f${EYE_COVERED} (must be by f37)`);
  // covered from then on, except inside the peek window; the eye shows in the peek and is covered again by f68
  for (let f = EYE_COVERED; f < DURATION; f++) {
    const inPeek = f > PEEK_IN[0] && f < PEEK_OUT[1] + 2;
    if (!inPeek && !eyeCovered(f)) fail(`his eye shows at f${f}, outside the peek`);
  }
  if (eyeCovered(57) || eyeCovered(59)) fail("the eye does not show in the peek (f57-59)");
  for (let f = 68; f < DURATION; f++) if (!eyeCovered(f)) fail(`the eye is not covered again at f${f}`);
  const inBand = (y: number) => (y > 1080 && y < 1250) || (y > 1360 && y < 1460);
  for (let f = 0; f < DURATION; f++) {
    const d = debugAt(f);
    if (inBand(d.sleeperHead[1]) || inBand(d.managerHead[1])) fail(`a face in a caption band at f${f}`);
    for (const p of d.board) if (p[0] > 0 && p[0] < 1080 && inBand(p[1])) fail(`the clipboard in a caption band at f${f}`);
    for (const p of d.sign) if (inBand(p[1])) fail(`the sign in a caption band at f${f}`);
  }
  // the door stays wholly hidden in the opening frame (its bloom included)
  if (debugAt(0).doorLeft < 1080 + 60) fail("the door shows at f0");
  // the resolved wide: the sign in frame with >= 40 px of wall to its right, the door clear of him, wall between the
  // chair back and his feet, the sleeper's face clear of the left edge
  for (let f = 48; f < DURATION; f++) {
    const d = debugAt(f);
    const [a, b] = d.sign;
    if (a[0] < 0 || b[0] > 1040) fail(`the EXIT sign is within 40 px of the right edge at f${f} (${b[0]})`);
    if (b[0] - a[0] < 170) fail(`the EXIT sign is only ${b[0] - a[0]} px wide at f${f}`);
    if (d.doorLeft < d.mgrBack + 8) fail(`he stands in front of the door at f${f}`);
    if (d.mgrFront < d.chairBack + 12) fail(`no wall between the chair back and his feet at f${f}`);
    if (d.sleeperHead[0] < 200) fail(`the sleeper's head is near the left edge at f${f}`);
  }
})();

// --- the cut -------------------------------------------------------------------------------------------------------
const BiasedAgainstExiting: React.FC<z.infer<typeof schema>> = ({ castProbe }) => {
  const frame = useCurrentFrame();
  const f = castProbe ? 0 : frame;
  const cam = castProbe ? camAt(PULL_END) : camAt(f);
  const breath = breathAt(f);
  const pose = managerPose(f);
  return (
    <OfficeStage S={f} cam={cam}>
      {/* the floor shadows (one per object group) */}
      <FloorShadow x0={DESK.x0 - 160} x1={DESK.x1 + 10} y={FLOOR} a={0.28} />
      <FloorShadow x0={SLEEPER_X - 190} x1={SLEEPER_X + 70} y={FLOOR} a={0.3} />
      <FloorShadow x0={MGR_X - 140} x1={MGR_X + 40} y={FLOOR + 6} a={0.32} />
      {/* his desk and his monitor (a line chart that sags and runs flat, toward him) */}
      <Desk x0={DESK.x0 - 400} x1={DESK.x1} top={DESK_TOP} floor={FLOOR} />
      <Monitor x={318} top={DESK_TOP} face={1} w={92} line="flat" />
      <Zs f={f} />
      <Sleeper x={SLEEPER_X} y={HIP_Y} s={SEAT_S} look={SLEEPER_LOOK} desk={DESK_LOCAL} breath={breath} />
      <Manager x={MGR_X} y={MGR_HIP_Y} s={MGR_S} look={MGR_LOOK} pose={pose} />
    </OfficeStage>
  );
};

export default BiasedAgainstExiting;
