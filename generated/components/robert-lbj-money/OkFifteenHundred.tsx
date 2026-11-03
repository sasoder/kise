// ---------------------------------------------------------------------------
// OkFifteenHundred (robert-lbj-money, cut 40). Dwarkesh 3D style (styles/dwarkesh-3d.md), mood night.
// Opaque 1080x1920, 23.976 fps, 115 frames. REV 2 (director's rev 1 notes): closer, lower rest camera
// (DESK_CAM_REST_V2), the typed ask ~2.15x larger (CUT1_STRIPS_V2), a joined fountain-pen scrawl (Notation hand
// "pen"), the arm from the lower right under the typed lines (ELBOW_V2, PEN_REST_DIR_V2, PEN_LEN_V2, handGripV2).
// The shared world ./lbjDeskWorld.tsx (Johnson's desk at dusk, 1940: one brass-and-slate lamp at the upper left, a
// leather blotter, a 1940 Western Union telegram, his gouache pen hand). Cut 2 (NoNever) opens on this cut's last
// camera, DESK_CAM_REST_V2, with this telegram lying in the done tray (DONE_STACK_CUT1_V2).
//
// CHECK LINE: "A congressman wired Johnson asking for $1,500, and Johnson just wrote 'OK $1500' on the telegram —
// the money was his to hand out."
//
// THE LINE: "If the guy asked for $1,500, Johnson would write, OK, $1,500."
// WORD -> FRAME (Whisper onsets, comp start = 40.791 s; real onsets 3-8 frames later): the guy 0 / 4 · asked for 7 /
// 16 · $1,500 20 (ends 38) · Johnson 50 · would write 59 / 66 · OK 74 (ends 83) · $1,500 87 (ends 108) · slot end 115
// DURATION: the slot 40.791 -> 45.587 s = sequence frames 978 -> 1093 = 115 frames at 24000/1001.
//
// THE MOTION: one continuous camera: f0 a low, slightly wide three-quarter view over the lamp-lit desk (lamp at the
// upper left, the empty done tray, the dusk window behind) with the telegram already sliding in across the blotter
// toward the lamp's pool (it decelerates and settles square in the light by f22, lift to 0). The camera eases in and
// tilts down (pitch 30° -> 53°, a zoom 1550 -> 1900 with the dolly; main move f0-48) so the typed ask
// NEED $1500 FOR / CAMPAIGN STOP / CAN YOU HELP reads from ~f12 ($1500 typed darker, ~262 px wide at rest), then
// creeps on slowly to DESK_CAM_REST_V2 at f114. No typed line enters the caption band (y 1080+) on any frame (worst
// ~1032 at f12). Johnson's pen hand comes in from the lower right (f41-66; in frame from ~f52, the sleeve running
// off the lower right) and the nib touches the empty lower part of the sheet at f71 (CONTACT f71; first ink f73.5).
// He writes OK $1500 in one fast, joined fountain-pen scrawl in glowing orange: O f73.5-79 running into K f79-84 (on
// "OK"), $ f86.5-90.8, 1 f91.3-93, 5 f93.6-97 whose hat runs into the 0s f97-102.6, a quick underline flick under
// "$1500" f105.2-108. The flick's momentum carries the lifting pen and hand off to the lower right (gone from f109),
// leaving the granted telegram clean: the fresh ink cools to the settled orange, its glow breathes faintly, lamp
// motes drift, the camera creeps. Idea complete by f108. (The hand leaving after the flick, not resting, is accepted.)
// Orange = Johnson's money: only the grant's ink is orange. Everything else muted umber, leather, cream, slate.
//
// DEPTH: centimetres, a pinhole (lbjDeskWorld DeskCam). START {target (-3, 0, 36), dist 70, pitch 30, yaw -5, f 1550,
// target at sy 1010}; ARRIVE (f48) {(0.5, 0, 27.6), 44.2, 53.2, -3.4, f 1900, sy 726}; END = DESK_CAM_REST_V2 {(0.6,
// 0, 27.4), 42.5, 54, -3.2, sy 730}. The telegram rests at TELEGRAM_REST (X 1.2, Z 28.4, rot -2.5); at the end it
// spans y ~405-1071 and x ~20-1060, the ask ~y 560-800, the notation ~y 820-990 with its underline ~985 (strokes
// ~5-24 px, thick-thin by a 32° nib and downstroke pressure). Fog by the eye's distance (near 70 cm): the room behind
// (wall at 330 cm) sinks into the air.
//
// SOURCES: 1940 congressional elections; requests for campaign money from Democratic candidates reached Johnson by
// telegram and letter (Robert A. Caro, The Path to Power, 1982). The $1500 is the speaker's example. The telegram is
// an illustrative Western Union blank (1940): date strip "1940 OCT", addressee "HON LYNDON B JOHNSON WASHINGTON DC",
// the sender's strip deliberately illegible (no real congressman named).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  CUT1_STRIPS_V2,
  DESK_CAM_REST_V2,
  DeskDark,
  DeskScene,
  DeskStage,
  DoneTray,
  ELBOW_V2,
  PEN_LEN_V2,
  PEN_REST_DIR_V2,
  PenHand,
  TELEGRAM_REST,
  Telegram,
  camLerp,
  deskView,
  handGripV2,
  layoutNotationPen,
  telegramPoint,
  writeNotationPen,
  type DeskCam,
  type Notation,
  type TelegramPose,
  type V3,
} from "./lbjDeskWorld";

export const FPS = 24000 / 1001;
export const DURATION = 115;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const c01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ss = (a: number, b: number, x: number) => {
  const t = c01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const eio = (u: number, p = 2) => {
  const v = c01(u);
  return v < 0.5 ? Math.pow(2 * v, p) / 2 : 1 - Math.pow(2 * (1 - v), p) / 2;
};
/** a progress 0..1 integrated from a velocity profile over [0, F] */
const profile = (vel: (f: number) => number, F: number) => {
  const N = 4000;
  const cum = [0];
  let prev = vel(0);
  for (let i = 1; i <= N; i++) {
    const v = vel((F * i) / N);
    cum.push(cum[i - 1] + (prev + v) / 2);
    prev = v;
  }
  const tot = cum[N];
  return (f: number) => {
    const x = (Math.max(0, Math.min(F, f)) / F) * N;
    const i = Math.min(N - 1, Math.floor(x));
    return lerp(cum[i], cum[i + 1], x - i) / tot;
  };
};

// ---------------------------------------------------------------------------
// THE CAMERA: the main move (already moving at f0, easing out f20-48) and the creep (easing in f34-60, then constant
// to f114) on one track: START -> ARRIVE by sMain, ARRIVE -> END by sCreep (END = DESK_CAM_REST at f114)
// ---------------------------------------------------------------------------
const LAST = DURATION - 1;
const START: DeskCam = { tx: -3, ty: 0, tz: 36, dist: 70, pitch: 30, yaw: -5, f: 1550, sx: 540, sy: 1010 };
const ARRIVE: DeskCam = { tx: 0.5, ty: 0, tz: 27.6, dist: 44.2, pitch: 53.2, yaw: -3.4, f: 1900, sx: 540, sy: 726 };
const END: DeskCam = DESK_CAM_REST_V2;
const sMain = profile((f) => (0.35 + 0.65 * ss(0, 8, f)) * (1 - ss(20, 48, f)), 48);
const sCreep = profile((f) => ss(34, 60, f), LAST);
export const camAt = (f: number): DeskCam => {
  const a = camLerp(START, ARRIVE, sMain(f));
  const c = sCreep(f);
  const d = (k: keyof DeskCam, log = false) => (log ? Math.exp(Math.log(a[k]) + (Math.log(END[k]) - Math.log(ARRIVE[k])) * c) : a[k] + (END[k] - ARRIVE[k]) * c);
  return { tx: d("tx"), ty: d("ty"), tz: d("tz"), dist: d("dist", true), pitch: d("pitch"), yaw: d("yaw"), f: d("f", true), sx: d("sx"), sy: d("sy") };
};
// cut 2 opens on this cut's last frame: assert the join
{
  const e = camAt(LAST);
  const bad = (Object.keys(END) as (keyof DeskCam)[]).filter((k) => Math.abs(e[k] - END[k]) > 1e-6);
  if (bad.length) throw new Error(`OkFifteenHundred: camAt(${LAST}) != DESK_CAM_REST_V2 (${bad.join(", ")})`);
}

// ---------------------------------------------------------------------------
// THE TELEGRAM: already sliding at f0 (pushed across the blotter), constant friction to rest at f22
// ---------------------------------------------------------------------------
const SLIDE_END = 22;
const POSE0: TelegramPose = { X: 6, Z: 40, rot: -10, lift: 0.4, curl: 1 };
const poseAt = (f: number): TelegramPose => {
  const t = c01(f / SLIDE_END);
  const e = 1 - (1 - t) * (1 - t);
  return {
    X: lerp(POSE0.X, TELEGRAM_REST.X, e),
    Z: lerp(POSE0.Z, TELEGRAM_REST.Z, e),
    rot: lerp(POSE0.rot, TELEGRAM_REST.rot, e),
    lift: POSE0.lift * Math.pow(1 - t, 1.6),
    curl: 1,
  };
};

// ---------------------------------------------------------------------------
// THE NOTATION: frame -> progress through the glyph marks (piecewise linear: even speed inside each glyph)
// ---------------------------------------------------------------------------
const NOTE: Notation = { text: "OK $1500", colour: "grant", progress: 0, underline: 1, ulFrom: 0.4, hand: "pen" };
const LAY = layoutNotationPen(NOTE);
const G = LAY.glyphs;
const UL = LAY.underline[0];
const F_CONTACT = 71;
const F_INK = 73.5;
const F_DONE = 108;
// the pen hand joins O into K, the 5's hat into the first 0 and the 0s (no pause at a join: K.p0 = O.p1 etc.)
const KEYS: [number, number][] = [
  [F_INK, G[0].p0],
  [79, G[0].p1],
  [84, G[1].p1],
  [86.5, G[3].p0],
  [90.8, G[3].p1],
  [91.3, G[4].p0],
  [93, G[4].p1],
  [93.6, G[5].p0],
  [97.0, G[5].p1],
  [99.8, G[6].p1],
  [102.6, G[7].p1],
  [105.2, UL.p0],
  [F_DONE, UL.p1],
];
{
  for (let i = 1; i < KEYS.length; i++) if (KEYS[i][1] < KEYS[i - 1][1] - 1e-9) throw new Error(`OkFifteenHundred: KEYS not monotone at ${i}`);
}
const progAt = (f: number) => {
  if (f <= KEYS[0][0]) return 0;
  for (let i = 1; i < KEYS.length; i++) if (f <= KEYS[i][0]) return lerp(KEYS[i - 1][1], KEYS[i][1], (f - KEYS[i - 1][0]) / (KEYS[i][0] - KEYS[i - 1][0]));
  return 1;
};

// ---------------------------------------------------------------------------
// THE PEN: off the right edge until f41, comes in (f41-66) to above the O's first point, touches at f71, writes,
// flourishes off the right edge from f108
// ---------------------------------------------------------------------------
const first = writeNotationPen(NOTE, 1e-6).tip;
const last = writeNotationPen(NOTE, 1).tip;
const F_IN0 = 41;
const F_IN1 = 66;
// off frame at the lower right (below the sheet's near edge, right of it): the arm comes from the writer's side
const OFF: [number, number, number] = [25, 19.8, 3.6];
const nibAt = (f: number): V3 => {
  const P = TELEGRAM_REST;
  if (f < F_IN0) return telegramPoint(P, OFF[0], OFF[1], OFF[2]);
  if (f < F_IN1) {
    const e = eio((f - F_IN0) / (F_IN1 - F_IN0), 2.2);
    return telegramPoint(P, lerp(OFF[0], first[0], e), lerp(OFF[1], first[1] - 0.4, e), lerp(OFF[2], 1.0, e) + 1.6 * Math.sin(Math.PI * e));
  }
  if (f < F_CONTACT) {
    const e = ss(F_IN1, F_CONTACT, f);
    return telegramPoint(P, first[0], lerp(first[1] - 0.4, first[1], e), lerp(1.0, 0, e));
  }
  if (f < F_INK) return telegramPoint(P, first[0], first[1], 0);
  if (f < F_DONE) {
    const w = writeNotationPen(NOTE, progAt(f));
    return telegramPoint(P, w.tip[0], w.tip[1], w.h);
  }
  // the flourish out: the flick's momentum carries on, the pen lifts and the hand sweeps off to the lower right (back
  // toward the writer; gone by ~f111), leaving the granted telegram clean
  const t = f - F_DONE;
  const ex = 1.5 * t + 0.4 * t * t;
  return telegramPoint(P, last[0] + ex, last[1] + 0.45 * ex, Math.min(3.5, 0.5 * t + 0.08 * t * t));
};
// the hand's lag behind the fingers: none while it travels with the pen, ~1 frame while it writes, little through the
// long return to the underline's start and the flourish out (so the pen never stretches)
const lagAt = (f: number) => lerp(0.01, 1.0, ss(F_CONTACT - 2, F_INK + 2, f)) * (1 - 0.95 * ss(101.8, 103.0, f));

const OkFifteenHundred: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const V = deskView(cam, frame);
  const pose = poseAt(frame);
  const prog = progAt(frame);
  // after the last stroke the fresh ink cools to the settled orange and the glow breathes a little
  const fresh = 0.05 * (1 - ss(F_DONE, F_DONE + 6, frame));
  const glow = 1 + 0.12 * ss(F_DONE - 2, F_DONE + 4, frame) * Math.sin(((frame - F_DONE) / 20) * Math.PI * 2);
  const n: Notation = { ...NOTE, progress: prog, glow, fresh };
  const nib = nibAt(frame);
  const grip = handGripV2(nibAt, frame, lagAt(frame), 0.7);
  // the hand is drawn while any of it can be in frame (everything of it lies right of / below the nib)
  const pn = V.p(nib);
  const handOn = frame >= F_IN0 - 1 && (frame <= F_DONE || (pn[0] < 1080 + 40 && pn[1] < 1920 + 40));
  return (
    <DeskStage V={V}>
      <DeskScene V={V} />
      <DoneTray V={V} uid="tray" items={[]} />
      <Telegram V={V} pose={pose} strips={CUT1_STRIPS_V2} notation={prog > 0 ? n : undefined} uid="tg" />
      {handOn ? <PenHand V={V} nib={nib} grip={grip} uid="hand" ink="grant" elbow={ELBOW_V2} restDir={PEN_REST_DIR_V2} penLen={PEN_LEN_V2} /> : null}
      <DeskDark V={V} uid="dark" />
    </DeskStage>
  );
};

export default OkFifteenHundred;
