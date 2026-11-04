// ---------------------------------------------------------------------------
// NoNever (robert-lbj-money, cut 47). Dwarkesh 3D style (styles/dwarkesh-3d.md), mood night.
// Opaque 1080x1920, 23.976 fps, 102 frames.
// The shared world ./lbjDeskWorld.tsx (Johnson's lamp-lit desk; builder 1's, imported read-only; its header is the
// API), on its V2 names (DESK_READY.md "V2": DESK_CAM_REST_V2, CUT1_STRIPS_V2, the pen hand, ELBOW_V2, handGripV2).
// This cut builds no world of its own: two telegrams, the pen hand, the camera.
//
// CHECK LINE: "Some requests Johnson just turned down — but for some men he wrote 'No, never': they were cut off for
// good."
//
// THE LINE: "Sometimes he'd write, no. But sometimes he'd write, no, never."
// WORD -> FRAME (Whisper onsets; real onsets 3-8 frames later): (sometimes he'd) -5 / 6 · write 19 · no 29 (ends 33) ·
// But sometimes 39 / 43 · he'd write 53 / 63 · no 73 (ends 79) · never 82 (ends 92) · cut back to the speaker 102
// DURATION: the slot 47.631 -> 51.885 s (sequence frames 1142 -> 1244) = 102 frames at 24000/1001 (f0..f101).
//
// THE MOTION: one continuous desk scene. f0 is cut 1's resting camera (DESK_CAM_REST_V2) on a new telegram (T1, an
// ask for $1000) square in the lamp's light, the pen already poised over its margin; in the done tray at the upper
// left lie the granted requests, cut 1's "OK $1500" and on top a "$500" (orange, faintly glowing). The nib touches at
// f19 ("write") and writes a short flat "No" in dark ink f20-31 (on "no"). The hand lifts, sets its fingers on the
// blank right half of T1 (contact f36) and shoves it aside to the right (the paper's first move f36, released f42;
// it slides on out of frame by ~f55); T2 (an ask for $2500) is already sliding in from the dark at the far side
// (f38-60, friction) into the light under the hand, while the camera eases in closer (f34-72: this one matters).
// The nib touches T2 at f66 and writes "No, never" heavier (weight 1.6): "No," f66.5-78.6, "never" f81-88.8; the pen
// returns once, lifted (f88.8-91.4), and strikes ONE heavy underline under "never" left to right f91.4-95.2 (a bit
// thicker than the downstrokes, climbing slightly, tapering as the pen lifts). The telegram stays lit to the end, its
// "No, never" crisp (the earlier going-dead dim read as the graphic fading out; user, Nov 4). The pen lifts
// and the hand sweeps off to the lower right (cut 1's flourish out, gone by ~f98); the camera keeps a slow drift.
// The pen's direction is low-passed (PEN_DIRS: 7-frame centred average, <= 5 deg/frame in 3D and <= 4.5 deg/frame
// on screen); the nib stays exactly on the stroke front.
// Orange = Johnson's money only: the grant ink in the tray. Both refusals are dark ink #2B241D, never orange.
// CAUSE -> EFFECT: the hand's fingers on T1 at f36 = its first move f36 (it moves with the hand until f42, then
// slides on, friction). T2 enters already moving (pushed from the dark at the far side, cut 1's convention).
//
// DEPTH: the world's pinhole camera, centimetres (desk top Y 0, Z away from the writer). Start = DESK_CAM_REST_V2
// {tx 0.6, tz 27.4, dist 42.5, pitch 54, yaw -3.2, f 1900, sy 730}; END (f101) = CAM_END below (closer, on the
// notation). T1 rests at TELEGRAM_REST (X 1.2, Z 28.4), T2 at T2_REST. The air fogs by the eye's distance.
//
// SOURCES: Robert A. Caro, The Path to Power (1982): John Connally on Johnson's handwritten verdicts on requests for
// campaign money in the 1940 congressional elections ("No" vs "No, never"). The amounts ($1000, $2500, $500 granted)
// are illustrative; the senders' strips are deliberately illegible (no real congressman named).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { AIR, DEAD, mixHex } from "../kits/dwarkesh-3d/dwarkesh3d";
import {
  CUT1_STRIPS_V2,
  DESK_CAM_REST_V2,
  DONE_STACK_CUT1_V2,
  DeskDark,
  DeskScene,
  DeskStage,
  DoneTray,
  ELBOW_V2,
  PEN_LEN_V2,
  PEN_REST_DIR_V2,
  PenHand,
  INK_REFUSE,
  TELEGRAM_REST,
  TG_H,
  TG_W,
  Telegram,
  camLerp,
  deskView,
  handGripV2,
  layoutNotationPen,
  telegramPoint,
  writeNotationPen,
  type DeskCam,
  type DoneItem,
  type Notation,
  type Strip,
  type TelegramPose,
  type V3,
} from "./lbjDeskWorld";

export const FPS = 24000 / 1001;
export const DURATION = 102;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const LAST = DURATION - 1;
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
// THE PAPERS (CUT1_STRIPS_V2's layout: date + addressee, the ask in two big strips, a small line, a smudged sender)
// ---------------------------------------------------------------------------
const strips = (ask1: string, ask2: string, small: string, sender: string): Strip[] =>
  CUT1_STRIPS_V2.map((s, i) =>
    i === 2 ? { ...s, text: ask1, bold: undefined } : i === 3 ? { ...s, text: ask2 } : i === 4 ? { ...s, text: small } : i === 5 ? { ...s, text: sender, u: small.length * 0.62 + 1.9 } : s,
  );
const T1_STRIPS = strips("NEED $1000 FOR", "CAMPAIGN STOP", "CAN YOU HELP", "QWTRN BLXVMS KD");
const T2_STRIPS = strips("NEED $2500 FOR", "CAMPAIGN STOP", "WIRE ANSWER", "HZDVKP RTWQLN MS");
/** the granted "$500" lying on top in the tray (written at the right of its sheet, so its orange shows at the edge) */
const FIVE_HUNDRED: DoneItem = {
  strips: strips("NEED $1000 FOR", "RADIO STOP", "CAN YOU HELP", "MRKQTV PLDNWS JB"),
  notation: { text: "$500", colour: "grant", progress: 1, glow: 1, fresh: 0, at: [12.4, 12.4], size: 2.6, underline: 1, ulFrom: 0.1, hand: "pen" },
  du: 0.3,
  dv: -0.4,
  rot: 2.5,
};
const TRAY_ITEMS: DoneItem[] = [...DONE_STACK_CUT1_V2, FIVE_HUNDRED];

// T1: at rest; the hand shoves it (with the hand f36-42, accelerating), then it slides on with little friction
const T1_REST: TelegramPose = { ...TELEGRAM_REST };
const SHOVE0 = 36;
const SHOVE1 = 42;
const SHOVE_D = 5; // cm with the hand
const SLIDE_V0 = (2 * SHOVE_D) / (SHOVE1 - SHOVE0); // cm/frame at release
const SLIDE_STOP = 50; // cm it would slide on before friction stops it (it leaves the frame long before)
const SLIDE_T = (2 * SLIDE_STOP) / SLIDE_V0;
const T1_DIR: [number, number] = [0.98, -0.2]; // X, Z: to the right, a little toward the writer
/** T1's travel (cm) along T1_DIR at a frame */
const t1Travel = (f: number) => {
  if (f <= SHOVE0) return 0;
  if (f <= SHOVE1) {
    const t = (f - SHOVE0) / (SHOVE1 - SHOVE0);
    return SHOVE_D * t * t;
  }
  const t = Math.min(f - SHOVE1, SLIDE_T);
  return SHOVE_D + SLIDE_V0 * t - (SLIDE_V0 / (2 * SLIDE_T)) * t * t;
};
const t1Pose = (f: number): TelegramPose => {
  const d = t1Travel(f);
  return { ...T1_REST, X: T1_REST.X + T1_DIR[0] * d, Z: T1_REST.Z + T1_DIR[1] * d, rot: T1_REST.rot + 0.3 * d, lift: 0.12 * c01(d / 3) };
};
/** T1 is drawn until it has left the frame on the right (every corner past x 1080; checked per frame) */
const T1_GONE = 27;

// T2: already sliding in from the far side at f38 (off frame at the top), friction to rest at f60
const T2_IN0 = 38;
const T2_IN1 = 60;
const T2_REST: TelegramPose = { X: 1.0, Z: 28.2, rot: -1.6, lift: 0, curl: 1 };
const T2_FROM: TelegramPose = { X: 8.5, Z: 68, rot: 9, lift: 0.45, curl: 1 };
const t2Pose = (f: number): TelegramPose => {
  const t = c01((f - T2_IN0) / (T2_IN1 - T2_IN0));
  const e = 1 - (1 - t) * (1 - t);
  return {
    X: lerp(T2_FROM.X, T2_REST.X, e),
    Z: lerp(T2_FROM.Z, T2_REST.Z, e),
    rot: lerp(T2_FROM.rot, T2_REST.rot, e),
    lift: T2_FROM.lift * Math.pow(1 - t, 1.6),
    curl: 1,
  };
};

// ---------------------------------------------------------------------------
// THE NOTATIONS (the world's V2 pen hand): frame -> progress through the glyph and underline marks (piecewise
// linear; a joined glyph's p0 is the previous glyph's p1, so its span simply follows on)
// ---------------------------------------------------------------------------
const NO: Notation = { text: "No", colour: "refuse", progress: 0, weight: 1.1, size: 3.0, at: [1.3, 15.3], hand: "pen" };
const NEVER: Notation = { text: "No, never", colour: "refuse", progress: 0, weight: 1.6, size: 2.9, at: [1.2, 15.35], hand: "pen" };
const keysOf = (n: Notation, spans: [number, number][]) => {
  const L = layoutNotationPen(n);
  const marks = [...L.glyphs.filter((g) => g.p1 > g.p0), ...L.underline];
  if (marks.length !== spans.length) throw new Error(`NoNever: ${n.text} has ${marks.length} marks, ${spans.length} spans`);
  const keys: [number, number][] = [];
  marks.forEach((m, i) => {
    keys.push([spans[i][0], m.p0]);
    keys.push([spans[i][1], m.p1]);
  });
  return keys;
};
const progOf = (keys: [number, number][]) => (f: number) => {
  if (f <= keys[0][0]) return 0;
  for (let i = 1; i < keys.length; i++) {
    if (f <= keys[i][0]) {
      const df = keys[i][0] - keys[i - 1][0];
      return df <= 1e-9 ? keys[i][1] : lerp(keys[i - 1][1], keys[i][1], (f - keys[i - 1][0]) / df);
    }
  }
  return 1;
};
// "No" on "no": N f20-25.5, o f26-31
const NO_TOUCH = 19;
const NO_INK = 20;
const NO_DONE = 31;
const progNo = progOf(keysOf(NO, [[NO_INK, 25.5], [26, NO_DONE]]));
// "No, never": N o , on "no" (f66.5-78.6), n e v e r on "never" (f81-88.8); then ONE heavy underline under "never"
// (this cut's own stroke, below): the pen returns once, lifted, to its start (f88.8-91.4) and strikes it left to
// right in one pass (f91.4-95.2)
const NV_TOUCH = 66;
const NV_INK = 66.5;
const NV_WORDS = 88.8;
const UL0 = 91.4;
const NV_DONE = 95.2;
const progNever = progOf(
  keysOf(NEVER, [
    [NV_INK, 71.5],
    [72, 76],
    [76.8, 78.6],
    [81, 82.6],
    [82.6, 84.2],
    [84.2, 85.8],
    [85.8, 87.4],
    [87.4, NV_WORDS],
  ]),
);

// ---------------------------------------------------------------------------
// THE UNDERLINE: one heavy stroke under "never", left to right, climbing slightly, a little thicker than the
// letters' downstrokes, the pressure tapering off at its end (the pen lifts while still moving). The world's pen
// underline is a thin horizontal hairline in its nib model, so this cut draws its own ribbon in the same ink.
// ---------------------------------------------------------------------------
type UV = [number, number];
const NV_H = NEVER.size ?? 2.9;
const NV_WT = NEVER.weight ?? 1.6;
const NV_LAY = layoutNotationPen(NEVER);
const nGlyph = NV_LAY.glyphs.find((g, i) => g.ch === "n" && i > 3);
if (!nGlyph) throw new Error("NoNever: no 'n' in never");
const nStart = writeNotationPen(NEVER, nGlyph.p0 + 1e-4).tip; // the n's lead-in (0.42 cap above the baseline)
const rEnd = writeNotationPen(NEVER, 1).tip; // the r's end (0.5 cap above the baseline)
const UL_A: UV = [nStart[0] - 0.35, nStart[1] + 0.42 * NV_H + 0.2 * NV_H];
const UL_B: UV = [rEnd[0] + 0.7, rEnd[1] + 0.5 * NV_H + 0.2 * NV_H - 0.45];
/** the stroke's centre line at t (0..1): A -> B with a slight sag (toward the writer, + v) */
const ulPt = (t: number): UV => {
  const sag = 0.18 * Math.sin(Math.PI * t);
  return [lerp(UL_A[0], UL_B[0], t), lerp(UL_A[1], UL_B[1], t) + sag];
};
/** its width (cm) at t: a blunt start, full pressure, then the taper as the pen lifts */
const DOWNSTROKE_W = NV_WT * NV_H * (0.024 + 0.096 * Math.abs(Math.sin((58 * Math.PI) / 180)) + 0.032);
const UL_W = 1.15 * DOWNSTROKE_W;
const ulW = (t: number) => UL_W * (0.78 + 0.22 * ss(0, 0.07, t)) * (1 - 0.88 * Math.pow(ss(0.5, 1, t), 1.15));
/** how far along the stroke the nib is at a frame (eased) */
const ulT = (f: number) => eio((f - UL0) / (NV_DONE - UL0), 1.35);
const UnderlineInk: React.FC<{ V: ReturnType<typeof deskView>; pose: TelegramPose; t: number; dim: number }> = ({ V, pose, t, dim }) => {
  if (t <= 0.004) return null;
  const N = Math.max(2, Math.ceil(60 * t));
  const L: string[] = [];
  const R: string[] = [];
  const P = (q: UV) => V.p(telegramPoint(pose, q[0], q[1]));
  const q2s = (q: [number, number]) => `${q[0].toFixed(2)},${q[1].toFixed(2)}`;
  for (let i = 0; i <= N; i++) {
    const ti = (t * i) / N;
    const a = ulPt(Math.max(0, ti - 0.005));
    const b = ulPt(Math.min(1, ti + 0.005));
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const nx = -(b[1] - a[1]) / d;
    const ny = (b[0] - a[0]) / d;
    const q = ulPt(ti);
    const hw = ulW(ti) / 2;
    L.push(q2s(P([q[0] + nx * hw, q[1] + ny * hw])));
    R.push(q2s(P([q[0] - nx * hw, q[1] - ny * hw])));
  }
  // round ends (the pen's touch and its lift)
  const ends = [0, t].map((ti) => {
    const q = ulPt(ti);
    return { c: P(q), r: (ulW(ti) / 2) * V.s(telegramPoint(pose, q[0], q[1])) };
  });
  const d = `M${L.join("L")}L${R.reverse().join("L")}Z`;
  const centre = telegramPoint(pose, TG_W / 2, TG_H / 2);
  // the world's refuse ink and its dim (NotationInk), plus the dead veil the Telegram lays over its own contents
  const base = mixHex(mixHex(INK_REFUSE, DEAD, 0.25 * dim), V.tone(mixHex(DEAD, AIR.A.shadow, 0.3), centre), 0.35 * dim);
  return (
    <g>
      <path d={d} fill="none" stroke={INK_REFUSE} strokeWidth={0.5} strokeOpacity={0.4} strokeLinejoin="round" />
      <path d={d} fill={base} />
      {ends.map((e, i) => (
        <circle key={i} cx={e.c[0]} cy={e.c[1]} r={e.r} fill={base} />
      ))}
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE PEN: poised over T1 at f0, writes "No", shoves T1 aside, travels to T2, writes "No, never", lifts and rests
// ---------------------------------------------------------------------------
const noFirst = writeNotationPen(NO, 1e-6).tip;
const noLast = writeNotationPen(NO, 1).tip;
const nvFirst = writeNotationPen(NEVER, 1e-6).tip;
/** where the fingers press T1 to shove it (paper u, v) and the nib's height then */
const PUSH: [number, number, number] = [9.6, 14.2, 0.55];
const sway = (f: number, a = 0.05) => a * Math.sin(f / 4.3) + 0.6 * a * Math.sin(f / 7.1 + 1.3);
const nibAt = (f: number): V3 => {
  if (f < NO_TOUCH) {
    // poised just above the margin, a living sway; down onto the paper f11-19
    const e = ss(11, NO_TOUCH, f);
    return telegramPoint(T1_REST, noFirst[0] + 0.35 * (1 - e) + sway(f) * (1 - e), noFirst[1] - 0.45 * (1 - e), 1.25 * (1 - e));
  }
  if (f < NO_INK) return telegramPoint(T1_REST, noFirst[0], noFirst[1], 0);
  if (f < NO_DONE) {
    const w = writeNotationPen(NO, progNo(f));
    return telegramPoint(T1_REST, w.tip[0], w.tip[1], w.h);
  }
  if (f < SHOVE0) {
    // lift off the "o" and over to the blank right half (an arc)
    const e = eio((f - NO_DONE) / (SHOVE0 - NO_DONE), 2);
    return telegramPoint(T1_REST, lerp(noLast[0], PUSH[0], e), lerp(noLast[1], PUSH[1], e), lerp(0, PUSH[2], e) + 0.8 * Math.sin(Math.PI * e));
  }
  if (f < SHOVE1) return telegramPoint(t1Pose(f), PUSH[0], PUSH[1], PUSH[2]);
  // released: the hand rises off T1 and travels back over to T2's margin (T2 is still sliding in: aim at its rest)
  const from = telegramPoint(t1Pose(SHOVE1), PUSH[0], PUSH[1], PUSH[2]);
  if (f < NV_TOUCH - 5) {
    const e = eio((f - SHOVE1) / (NV_TOUCH - 5 - SHOVE1), 2.1);
    const to = telegramPoint(T2_REST, nvFirst[0] + 0.3, nvFirst[1] - 0.5, 1.2);
    return [lerp(from[0], to[0], e), lerp(from[1], to[1], e) + 2.2 * Math.sin(Math.PI * e), lerp(from[2], to[2], e)];
  }
  if (f < NV_TOUCH) {
    const e = ss(NV_TOUCH - 5, NV_TOUCH, f);
    return telegramPoint(T2_REST, nvFirst[0] + 0.3 * (1 - e), nvFirst[1] - 0.5 * (1 - e), 1.2 * (1 - e));
  }
  if (f < NV_INK) return telegramPoint(T2_REST, nvFirst[0], nvFirst[1], 0);
  if (f < NV_WORDS) {
    const w = writeNotationPen(NEVER, progNever(f));
    return telegramPoint(T2_REST, w.tip[0], w.tip[1], w.h);
  }
  if (f < UL0) {
    // the one return: lifted off the "r", back and down to the underline's start (an arc)
    const e = eio((f - NV_WORDS) / (UL0 - NV_WORDS), 1.2);
    return telegramPoint(T2_REST, lerp(rEnd[0], UL_A[0], e), lerp(rEnd[1], UL_A[1], e), 0.9 * Math.sin(Math.PI * e));
  }
  if (f < NV_DONE) {
    // on the stroke; lifting off the paper through the taper
    const t = ulT(f);
    const q = ulPt(t);
    return telegramPoint(T2_REST, q[0], q[1], 0.25 * Math.pow(ss(0.7, 1, t), 2));
  }
  // the flourish out (cut 1's): the underline's momentum carries on, the pen lifts and the hand sweeps off to the
  // lower right (back toward the writer; gone by ~f98), leaving the dead telegram alone in the light
  const t = f - NV_DONE;
  const ex = 1.5 * t + 0.4 * t * t;
  return telegramPoint(T2_REST, UL_B[0] + ex, UL_B[1] + 0.45 * ex, 0.25 + Math.min(3.5, 0.5 * t + 0.08 * t * t));
};
/** the wrist's lag behind the nib: calm while writing, with the pen while it travels */
const lagAt = (f: number) => {
  const w1 = ss(NO_TOUCH - 2, NO_INK + 1, f) * (1 - ss(NO_DONE, NO_DONE + 3, f));
  const w2 = ss(NV_TOUCH - 2, NV_INK + 1, f);
  return lerp(0.01, 1, Math.max(w1, w2)) * (1 - 0.95 * ss(NV_DONE - 1.2, NV_DONE, f));
};
const MAX_OFF = 0.7; // cut 1's cap on the hand's offset from the nib

// ---------------------------------------------------------------------------
// THE PEN'S DIRECTION, LOW-PASSED (director rev 1: the world hand's pen swung 25-48 deg frame to frame on fast
// letters). The raw direction is the world's own (the nib to the pinch of handGripV2's lagging hand); this cut takes
// it per frame, averages it over 7 frames (centred), then turns it toward that average at most PEN_TURN_MAX per
// frame AND at most PEN_SCREEN_MAX per frame as seen on screen (the pen leans toward the camera, so a small 3D
// turn can read as a big one in the picture). PenHand gets the exact nib, grip = the nib and restDir = this
// direction, so its pinch sits GRIP_DIST along it: the pen points along the smoothed direction and the hand rides
// with the fingers (the nib stays exactly on the stroke front).
// ---------------------------------------------------------------------------
const RAW_GRIP_DIST = 3.1; // the world's GRIP_DIST (internal): only scales the raw direction's lever
const PEN_TURN_MAX = (5 * Math.PI) / 180;
const PEN_SCREEN_MAX = 4.5; // deg per frame, on screen
const PEN_AVG = 3; // +- frames
const unit = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
const rawDir = (f: number): V3 => {
  const n = nibAt(f);
  const g = handGripV2(nibAt, f, lagAt(f), MAX_OFF);
  return unit([g[0] + PEN_REST_DIR_V2[0] * RAW_GRIP_DIST - n[0], g[1] + PEN_REST_DIR_V2[1] * RAW_GRIP_DIST - n[1], g[2] + PEN_REST_DIR_V2[2] * RAW_GRIP_DIST - n[2]]);
};
/** a unit vector turned from a toward b by the fraction k of the angle between them */
const slerpTo = (a: V3, b: V3, k: number): V3 => {
  const c = Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
  const th = Math.acos(c);
  if (th < 1e-9 || k >= 1) return b;
  const s = Math.sin(th);
  const wa = Math.sin((1 - k) * th) / s;
  const wb = Math.sin(k * th) / s;
  return unit([a[0] * wa + b[0] * wb, a[1] * wa + b[1] * wb, a[2] * wa + b[2] * wb]);
};
/** the pen's on-screen angle (deg) at frame f for direction d */
const screenAng = (f: number, d: V3): number => {
  const V = deskView(camAt(f), f);
  const n = nibAt(f);
  const a = V.p(n);
  const b = V.p([n[0] + d[0] * RAW_GRIP_DIST, n[1] + d[1] * RAW_GRIP_DIST, n[2] + d[2] * RAW_GRIP_DIST]);
  return (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
};
const angDiff = (x: number, y: number) => Math.abs((((x - y) % 360) + 540) % 360 - 180);
const F0 = -12;
let PEN_DIRS_MEMO: V3[] | null = null;
/** the pen's direction (nib -> pinch, world) at each frame f, index f - F0 (built on first use: it needs camAt) */
export const penDirs = (): V3[] => {
  if (PEN_DIRS_MEMO) return PEN_DIRS_MEMO;
  const raw: V3[] = [];
  for (let f = F0 - PEN_AVG; f <= DURATION + PEN_AVG; f++) raw.push(rawDir(f));
  const avg: V3[] = [];
  for (let i = PEN_AVG; i < raw.length - PEN_AVG; i++) {
    const s: V3 = [0, 0, 0];
    for (let k = -PEN_AVG; k <= PEN_AVG; k++) for (let j = 0; j < 3; j++) s[j] += raw[i + k][j];
    avg.push(unit(s));
  }
  const out: V3[] = [avg[0]];
  for (let i = 1; i < avg.length; i++) {
    const f = F0 + i;
    const prev = out[i - 1];
    const tgt = avg[i];
    const th = Math.acos(Math.max(-1, Math.min(1, prev[0] * tgt[0] + prev[1] * tgt[1] + prev[2] * tgt[2])));
    let k = th > PEN_TURN_MAX ? PEN_TURN_MAX / th : 1;
    // the on-screen cap, against the previous frame's on-screen angle (camera and nib move too)
    const aPrev = screenAng(f - 1, prev);
    if (angDiff(screenAng(f, slerpTo(prev, tgt, k)), aPrev) > PEN_SCREEN_MAX) {
      let lo = 0;
      let hi = k;
      for (let it = 0; it < 24; it++) {
        const m = (lo + hi) / 2;
        if (angDiff(screenAng(f, slerpTo(prev, tgt, m)), aPrev) > PEN_SCREEN_MAX) hi = m;
        else lo = m;
      }
      k = lo;
    }
    out.push(slerpTo(prev, tgt, k));
  }
  PEN_DIRS_MEMO = out;
  return out;
};
export const penDirAt = (f: number): V3 => {
  const d = penDirs();
  return d[Math.max(0, Math.min(d.length - 1, Math.round(f) - F0))];
};
export const nibOf = (f: number): V3 => nibAt(f);

// ---------------------------------------------------------------------------
// THE CAMERA: one track. A slow creep from DESK_CAM_REST_V2 (cut 1's last frame), the push in closer on T2's
// notation (f34-72, one lobe), then the creep again to the last frame.
// ---------------------------------------------------------------------------
export const CAM_END: DeskCam = { tx: 0.9, ty: 0, tz: 25.6, dist: 39.6, pitch: 55.5, yaw: -3.4, f: 1900, sx: 540, sy: 786 };
const sCam = profile((f) => 0.14 + ss(34, 48, f) * (1 - ss(56, 72, f)), LAST);
export const camAt = (f: number): DeskCam => camLerp(DESK_CAM_REST_V2, CAM_END, sCam(f));
{
  const e = camAt(0);
  const bad = (Object.keys(DESK_CAM_REST_V2) as (keyof DeskCam)[]).filter((k) => Math.abs(e[k] - DESK_CAM_REST_V2[k]) > 1e-9);
  if (bad.length) throw new Error(`NoNever: camAt(0) != DESK_CAM_REST_V2 (${bad.join(", ")})`);
}

const NoNever: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const V = deskView(cam, frame);
  const p1 = t1Pose(frame);
  const p2 = t2Pose(frame);
  const nNo: Notation = { ...NO, progress: progNo(frame) };
  const nNever: Notation = { ...NEVER, progress: progNever(frame) };
  // no going-dead dim: it read as a fade-out (user, Nov 4)
  const dim = 0;
  const nib = nibAt(frame);
  const t1On = t1Travel(frame) < T1_GONE;
  const t2On = frame >= T2_IN0;
  // the hand is drawn while any of it can be in frame (everything of it lies right of / below the nib)
  const pn = V.p(nib);
  const handOn = frame <= NV_DONE || (pn[0] < 1080 + 40 && pn[1] < 1920 + 40);
  return (
    <DeskStage V={V}>
      <DeskScene V={V} />
      <DoneTray V={V} uid="tray" items={TRAY_ITEMS} />
      {t1On ? <Telegram V={V} pose={p1} strips={T1_STRIPS} notation={nNo.progress > 0 ? nNo : undefined} uid="tg1" /> : null}
      {t2On ? <Telegram V={V} pose={p2} strips={T2_STRIPS} notation={nNever.progress > 0 ? nNever : undefined} dim={dim} uid="tg2" /> : null}
      {t2On ? <UnderlineInk V={V} pose={p2} t={frame <= UL0 ? 0 : frame >= NV_DONE ? 1 : ulT(frame)} dim={dim} /> : null}
      {handOn ? <PenHand V={V} nib={nib} grip={nib} uid="hand" ink="refuse" elbow={ELBOW_V2} restDir={penDirAt(frame)} penLen={PEN_LEN_V2} /> : null}
      <DeskDark V={V} uid="dark" />
    </DeskStage>
  );
};

export default NoNever;
