import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  BLACK,
  CHAIN,
  CHAIN_STAGGER,
  DRIFT_H,
  EASE_LAND,
  INK,
  LEVELS,
  PaperGround,
  Person,
  SHADOW,
  SHADOW_OFF,
  STROKE,
  SectionEarth,
  World,
  camEase,
  clamp,
  runCamera2,
  sway,
  textRise,
  type,
  type Hole,
} from "./cerroShared";

export const FPS = 24;
// Trailer "POD_BRENT_EARLY_EDIT_1", Ashlee: "You rappel down this shaft and you
// have at times stayed down there for like five days straight". SRT span
// 39.581 - 47.631 s. round((47.631 - 39.581) * 24) = 193 frames of speech,
// plus a 16 frame tail so the resolved frame holds = 209.
export const DURATION = 209;

// ---------------------------------------------------------------------------
// "FIVE DAYS UNDERGROUND" — cut 6 of the Cerro Gordo trailer. The same mountain
// in section that cut 2 built (cerroShared MINE: one shaft, the levels, the
// earth as one white shape on its hard shadow, the slots paper-coloured). This
// cut follows ONE figure down that shaft, puts him in a room off the deepest
// east level, and lets the days tally up on the wall beside him.
//
// THE WORDS, trailer s -> local frame (24 fps, f0 = 39.581 s):
//   You rappel down     39.581   f0
//   this shaft          41.291   f41
//   and you have        42.501   f70
//   at times            43.710   f99
//   stayed down there   45.003   f130
//   for like            46.046   f155
//   five                46.380   f163
//   days               ~46.64    f169
//   speech end          47.631   f193   (tail to 209)
//
// v2, on the director's scale pass: the figure, his room and the tally are
// THE picture (bigger figure, room, marks; the room hold framed on them, not
// on empty earth), the whole-mountain pull-back at the end is CUT (it made
// the payoff the smallest thing in the cut) — the ending holds close and
// creeps in — and the descent's widest k is capped so he stays >= 45 px.
//
// THE WORLD is cerroShared's section, unchanged, plus local slots through
// SectionEarth's `extraHoles` hook (the shared DRIFT_H 40 cannot hold him):
//   THE ROOM: {x 49, y 1170, w 440, h 230}, opening off the shaft on the east
//   side at the 1360 level, its floor ON that level's floor (1400).
//   DRIFT_ON: the 1360 level carried on east of the room to x 760 (it would
//   otherwise end as a 41 px stub). No depth numbers, no labels, no props.
//
// THE FIGURE: `Person` (person.png, white, hard shadow) in a 100 px box — ink
// 84 px, 143 screen px at the close k 1.70, 63 at the widest (k 0.75), 210 in
// the room. Ink -42..42 in the -50..50 shaft. Hung from the RIGHT shoulder
// (the rope meets the body 0.31 box right of centre, clear of the head's
// shadow), never from the head; the rope is drawn BEHIND him, so when it
// comes in from the room's corner it passes behind his head.
// THE ROPE: one 6 px white polyline on its +4/+4 black copy: laid along the
// bench from x 230, over the collar's east lip, down the shaft at x 31 to his
// shoulder. When he swings into the room it bends round the room's top-left
// corner (inserted only while the straight line would cut the earth, so it
// never pops). After he lets go, its free end swings back to hang plumb.
// THE TALLY: four 95 px marks on a 32 px pitch at x 296..392, the strike
// (278,1368) -> (410,1247). Figure + tally centred on x 268.
//
// THE GESTURES, each with its word. Nothing else moves except the camera's
// creeps, the hand-held sway and the paper drift.
//   f0-83   HE RAPPELS DOWN, seven bounds (push off the east wall 2 px, drop,
//           catch; Easing.inOut(sin) per bound — cubic peaked at 57 px/f in
//           the wide — small at the close, long while the camera is wide).
//           Box top 4 -> 1304                                 — "You rappel down"
//   f30-50  THE CAMERA EASES BACK to the long slot (k 0.74): collar at the
//           top, the levels sliding past, the figure small but >= 45 px
//                                                             — "this shaft"
//   f68-94  THE CAMERA COMES DOWN AND IN on the room (k 2.5), ahead of him;
//           he lands his last bound into the frame             — "and you have"
//   f84-102 HE SWINGS IN off the shaft into the room and lands on its floor
//   f102-116 HE STEPS OFF: the rope's free end swings back to hang plumb in
//           the shaft (eased in-out, no overshoot)
//   f103-106 tally | (stroke-wipe top->bottom, 5 f, EASE_LAND) — "at times"
//   f123-126 tally ||                                         — "stayed"
//   f138-141 tally |||                                        — "down there"
//   f150-153 tally ||||                                       — "for like"
//   f150-162 the camera lifts 24 world px (60 screen) to make DAY 5's room
//   f154-163 THE FIFTH, the diagonal strike-through, and the cut's ONE chain
//           echo: the strike drawn on as orange f154, purple f156, blue f158,
//           white core f160 (+ its shadow, at the back, on the core's timing),
//           each an 8 f EASE_LAND wipe (visually drawn ~3 f after its start),
//           at rest a CROWN straight up in one column. DEVIATION (approved):
//           the step is one stroke (6 px), not CROWN_STEP 12. Lands on "five"
//   f157-169 DAY 5 (Barlow 900, 72 world = 180 screen px, black on the white
//           earth over the room) slides up 24 screen px, fades in — "days"
//   f150-209 the hold creeps IN, k 2.53 -> 2.66 (+5%). No pull-back.
//
// THE CAMERA — keyed per frame, damped by runCamera2 (CAM_STIFF / CAM_DAMP).
// Zoom interpolated geometrically; the push into the room is ANCHORED on his
// standing spot (165, 1350), which slides straight on screen.
//   creep  f0-30    k 1.70 -> 1.73, centre = his path, averaged, 5 f ahead
//   out    f30-50   k -> 0.74, centre -> 600 (collar to below the room)
//   creep  f50-68   k 0.74 -> 0.76, centre held: he travels down the frame
//   in     f68-94   k -> 2.50, centre -> 1280 / x 268 (room + tally)
//   creep  f94-150  k 2.50 -> 2.53
//   lift   f150-162 centre 1280 -> 1256 (room + tally + DAY 5)
//   creep  f150-209 k 2.53 -> 2.66
// Room on screen: 1100 px wide (57%), ceiling..floor y ~245..820 before the
// lift; DAY 5 cap top ~147 and floor ~880 after it.
// THE DAMPED NUMBERS (what runCamera2 produces; head = his ink top on screen):
//     f    k      cx      cy       head x,y    head px/f  %k/f
//     0    1.700     0.0     96.6    960, 396     0.0     0.00
//     20   1.716     0.0    211.0    957, 455     7.8     0.08
//     30   1.728     0.0    315.9    957, 429    17.5     0.04
//     41   1.226     0.0    527.4    958, 373    20.9    -5.46  "this shaft"
//     50   0.814     0.0    619.7    960, 465     3.8    -3.09
//     60   0.746     0.0    627.0    960, 655     4.0     0.06
//     70   0.762     3.2    632.7    957, 864    19.3     0.54  "and you have"
//     82   1.261   180.2   1019.2    732, 902    31.7     6.09
//     94   2.296   263.7   1266.2    600, 626    42.4     2.74
//     99   2.463   267.5   1284.8    700, 615     7.6     0.73  "at times"
//     106  2.502   268.1   1288.1    702, 610     0.2     0.05
//     130  2.518   268.0   1287.9    701, 611     0.1     0.03
//     150  2.529   268.0   1287.9    699, 611     0.0     0.01
//     156  2.531   268.0   1284.0    699, 621     3.6     0.02
//     163  2.538   268.0   1269.6    699, 658     4.6     0.06  "five"
//     169  2.550   268.0   1264.5    697, 671     1.1     0.09  "days"
//     190  2.612   268.0   1263.7    691, 677     0.4     0.12
//     208  2.653   268.0   1263.5    687, 679     0.1     0.04
// Fastest head anywhere: 43.1 px/f (f85, during the push-in). The photograph
// is capped at 1.0x of source (paperScale) and referenced to cy 700 / cx 130,
// so it never upscales and never shows an edge.
// ---------------------------------------------------------------------------

// -- geometry ------------------------------------------------------------------
// v2 (director's scale pass): the figure, his room and the tally are THE
// picture — figure box 100 (ink 84), room 440 x 230, tally marks 95 tall.
export const PERSON_BOX = 100;
const INK_BOTTOM = 470 / 512;
const ATTACH_DX = 0.31; // rope meets the right shoulder, per box from centre
const ATTACH_DY = 0.646; // the shoulder's top edge there, per box from the box top
export const HANG_X = 0; // box centre while on the rope: ink -42..42 in the -50..50 shaft
export const ROPE_X = HANG_X + ATTACH_DX * PERSON_BOX; // 31
export const ROPE_TOP = { x: 53, y: -3 }; // over the collar's east lip
export const ROPE_BENCH_X = 230; // the rope's laid-out end on the bench
const ROPE_DROP_Y = 30; // where the rope comes plumb under the lip

export const LEVEL = LEVELS[4]; // { y: 1360, side: +1, len: 480 }
export const FLOOR = LEVEL.y + DRIFT_H; // 1400
export const ROOM: Hole = { x: 49, y: 1170, w: 440, h: 230 };
// The 1360 level would end 41 px past the room as a stub; it carries on east
// of the room instead (local, through the same hook).
export const DRIFT_ON: Hole = { x: 488, y: LEVEL.y, w: 272, h: DRIFT_H };
const ROOM_CORNER = { x: 50 + STROKE / 2, y: ROOM.y + STROKE / 2 };
export const STAND_X = 165; // box centre once he stands in the room
const STAND_Y = FLOOR - INK_BOTTOM * PERSON_BOX; // box top, ink bottom ON the floor
const HANG_END_Y = STAND_Y - 4.4; // box top at the end of the last bound

// The tally on the room's back wall, east of him: 95 tall, 32 pitch (26 px
// of paper between strokes, 4 of it the shadow).
export const TALLY_X = [296, 328, 360, 392];
export const TALLY_TOP = 1260;
export const TALLY_BOTTOM = 1355;
export const STRIKE = { x0: 278, y0: 1368, x1: 410, y1: 1247 };
// figure ink left 123 .. strike right 413 -> the group's centre
export const GROUP_X = 268;

// DAY 5, centred over the group, black on the white earth above the room.
export const DAY_X = GROUP_X;
export const DAY_BASELINE = ROOM.y - 14; // 1156
export const DAY_SIZE = 72; // world px: 180 screen px at the room's k 2.5

// -- the descent ---------------------------------------------------------------
// [start frame, frames, drop in world px]. The sum is HANG_END_Y - Y0. He is
// down by f83 so the push-in never has to chase a falling figure.
const B = [70, 100, 140, 200, 260, 300];
export const BOUNDS: ReadonlyArray<readonly [number, number, number]> = [
  [1, 10, B[0]],
  [13, 10, B[1]],
  [25, 10, B[2]],
  [37, 10, B[3]],
  [49, 11, B[4]],
  [61, 11, B[5]],
  [73, 10, HANG_END_Y - 4 - B.reduce((x, y) => x + y, 0)],
];
const Y0 = 4;
const PUSH = 2; // world px off the east wall per bound (the bigger figure has 8 px of room)
const TILT = 1.5; // deg about the shoulder per bound
const EASE_DROP = Easing.inOut(Easing.sin); // peak speed 1.57x the mean (cubic was 3x: 57 px/f in the wide)
const EASE_SWING = Easing.inOut(Easing.cubic);
export const SWING_F0 = 84;
export const SWING_F1 = 102;
export const RELEASE_F1 = 116;

/** The figure: box centre x, box top y, tilt (deg) about the shoulder. */
export const personAt = (f: number) => {
  let y = Y0;
  let dx = 0;
  let tilt = 0;
  for (const [s, d, drop] of BOUNDS) {
    const u = Math.max(0, Math.min(1, (f - s) / d));
    y += drop * EASE_DROP(u);
    const bump = Math.sin(Math.PI * u);
    dx -= PUSH * bump;
    tilt += TILT * bump;
  }
  const w = interpolate(f, [SWING_F0, SWING_F1], [0, 1], { easing: EASE_SWING, ...clamp });
  const x = HANG_X + dx + (STAND_X - HANG_X) * w;
  y = y + (STAND_Y - HANG_END_Y) * w - 12 * Math.sin(Math.PI * w);
  return { x, y, tilt };
};

// -- the camera ------------------------------------------------------------------
// The content centre is keyed, not chased: during the close descent it is the
// figure's own path averaged over a 17-frame window centred 5 frames AHEAD
// (so the damper's lag puts him on the centre, and the bounds read as his,
// not the camera's); during the wide it is a fixed centre on the long slot;
// at the room it is the room + tally, lifted 24 world px (60 screen) on
// f150-162 to take DAY 5; then a slow creep IN to the end. No pull-back.
export const K_CLOSE = 1.7;
export const K_CLOSE_CREEP = 1.73;
export const K_WIDE = 0.74; // figure ink 62 screen px at the widest
export const K_WIDE_CREEP = 0.76;
export const K_ROOM = 2.5; // room 1100 px = 57% of the frame, figure 210, tally 238
export const K_ROOM_CREEP = 2.53;
export const K_TAIL = K_ROOM_CREEP * 1.05; // +5% over f150-209
export const C_WIDE = 600;
export const X_WIDE = 0;
export const C_ROOM = 1280; // room + tally: ceiling 1170 .. floor shadow 1404
export const C_DAY = 1256; // DAY 5 cap top 1105 .. floor shadow 1404
export const X_ROOM = GROUP_X;
const LIFT = 20; // cerroShared CAM_LIFT_169: the content centre lands on screen y 520

const trend = (f: number) => {
  let s = 0;
  let n = 0;
  for (let i = f - 3; i <= f + 13; i++) {
    s += personAt(Math.max(0, i)).y + PERSON_BOX / 2;
    n++;
  }
  return s / n;
};

const seg = (f: number, f0: number, f1: number, warp = 1) => camEase((f - f0) / (f1 - f0), warp);
// Zoom is interpolated geometrically, so the perceived speed of a big move is
// one even lobe rather than a lurch at the tight end.
const kGeo = (k0: number, k1: number, g: number) => k0 * Math.pow(k1 / k0, g);

// An ANCHORED move: a world point A slides in a straight line on screen from
// where it sits at the start to where it sits at the end, while k eases. Without
// it a big push swings A out toward the frame edge mid-move and back.
// Screen position of world (X, Y) for content centre (cx, c) and zoom k:
//   sx = 960 + (X - cx) k,   sy = 520 + (Y - c) k.
const anchored = (
  g: number,
  a: { x: number; y: number },
  from: { k: number; c: number; x: number },
  to: { k: number; c: number; x: number },
) => {
  const k = kGeo(from.k, to.k, g);
  const sy0 = 520 + (a.y - from.c) * from.k;
  const sy1 = 520 + (a.y - to.c) * to.k;
  const sx0 = 960 + (a.x - from.x) * from.k;
  const sx1 = 960 + (a.x - to.x) * to.k;
  const sy = sy0 + (sy1 - sy0) * g;
  const sx = sx0 + (sx1 - sx0) * g;
  return { k, c: a.y - (sy - 520) / k, x: a.x - (sx - 960) / k };
};
// the room anchor: the figure where he stands
const ROOM_ANCHOR = { x: STAND_X, y: 1350 };

export const CAM_MOVES = {
  creep: [0, 30],
  out: [30, 50], // "this shaft"
  wideCreep: [50, 68],
  in: [68, 94], // "and you have" — down and in on the room
  roomCreep: [94, 150],
  lift: [150, 162], // DAY 5's slot, as it arrives
  tail: [150, 209], // creep in to the end
} as const;

const camKey = (f: number) => {
  let k: number;
  let c: number;
  let x: number;
  if (f <= 30) {
    k = kGeo(K_CLOSE, K_CLOSE_CREEP, seg(f, 0, 30));
    c = trend(f);
    x = 0;
  } else if (f <= 50) {
    const g = seg(f, 30, 50, 0.75);
    k = kGeo(K_CLOSE_CREEP, K_WIDE, g);
    c = trend(f) + (C_WIDE - trend(f)) * g;
    x = X_WIDE * g;
  } else if (f <= 68) {
    k = kGeo(K_WIDE, K_WIDE_CREEP, seg(f, 50, 68));
    c = C_WIDE;
    x = X_WIDE;
  } else if (f <= 94) {
    const r = anchored(
      seg(f, 68, 94, 0.85),
      ROOM_ANCHOR,
      { k: K_WIDE_CREEP, c: C_WIDE, x: X_WIDE },
      { k: K_ROOM, c: C_ROOM, x: X_ROOM },
    );
    ({ k, c, x } = r);
  } else if (f <= 150) {
    k = kGeo(K_ROOM, K_ROOM_CREEP, seg(f, 94, 150));
    c = C_ROOM;
    x = X_ROOM;
  } else {
    k = kGeo(K_ROOM_CREEP, K_TAIL, seg(f, 150, 209));
    c = C_ROOM + (C_DAY - C_ROOM) * seg(f, 150, 162);
    x = X_ROOM;
  }
  return { k, cy: c + LIFT / k, cx: x };
};

export const CAM_F: number[] = [];
export const CAM_K: number[] = [];
export const CAM_CY: number[] = [];
export const CAM_CX: number[] = [];
for (let f = 0; f <= DURATION; f++) {
  const key = camKey(f);
  CAM_F.push(f);
  CAM_K.push(key.k);
  CAM_CY.push(key.cy);
  CAM_CX.push(key.cx);
}
// The paper's parallax reference: the middle of the camera's vertical travel,
// so the 0.15 parallax never pulls an edge of the oversized photograph in.
const CY_REST = 700;
const CX_REST = 130;
// The photograph never goes above 1.0x of source: cerroShared's own scale
// 1 + (k - 1) * 0.3, capped at 1.25 (0.7985 * 1.252 = 1.0). The room's k 2.5+
// would otherwise take it to 1.16x.
const paperScale = (k: number) => Math.min(1 + (k - 1) * 0.3, 1.25);

// -- timings ---------------------------------------------------------------------
const MARK_WIPE = 5;
// The strike's crown step. CROWN_STEP (12) on a 6 px line leaves paper between
// the colours and reads as four separate lines; a step of one stroke width
// stacks them edge to edge into one band — the crown, at line scale.
const STRIKE_STEP = STROKE;
const STRIKE_WIPE = 8;

export const schema = z.object({
  beats: z.object({
    rappel: z.number(), // "You rappel down"
    shaft: z.number(), // "this shaft"
    andYouHave: z.number(), // "and you have"
    atTimes: z.number(), // "at times"      — tally 1
    stayed: z.number(), // "stayed"         — tally 2
    downThere: z.number(), // "down there"  — tally 3
    forLike: z.number(), // "for like"      — tally 4
    five: z.number(), // "five"             — the strike + chain
    days: z.number(), // "days"             — DAY 5 lands
    end: z.number(),
  }),
  tally: z.array(z.number()), // the frame each of the four marks is complete
  dayText: z.string(),
});
export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  beats: {
    rappel: 0,
    shaft: 41,
    andYouHave: 70,
    atTimes: 99,
    stayed: 130,
    downThere: 141,
    forLike: 155,
    five: 163,
    days: 169,
    end: 193,
  },
  tally: [106, 126, 141, 153],
  dayText: "DAY 5",
});

// A line drawn on from (x0,y0) toward (x1,y1), `p` of the way.
const lineTo = (x0: number, y0: number, x1: number, y1: number, p: number) => ({
  x2: x0 + (x1 - x0) * p,
  y2: y0 + (y1 - y0) * p,
});

const FiveDaysUnderground: React.FC<Props> = ({ beats, tally, dayText }) => {
  const frame = useCurrentFrame();

  // -- the camera, first ----------------------------------------------------------
  const cam = runCamera2(frame, CAM_F, CAM_CY, CAM_CX, CAM_K);
  const drift = sway(frame);
  const k = cam.k;
  const cy = cam.cy + drift.dy;
  const cx = cam.cx + drift.dx;

  // -- the figure and the rope ----------------------------------------------------
  const p = personAt(frame);
  const boxX = p.x - PERSON_BOX / 2;
  const attach = { x: p.x + ATTACH_DX * PERSON_BOX, y: p.y + ATTACH_DY * PERSON_BOX };
  // After he lets go, the rope's free end swings back to hang plumb.
  const rel = interpolate(frame, [SWING_F1, RELEASE_F1], [0, 1], { easing: Easing.inOut(Easing.sin), ...clamp });
  const releaseAt = personAt(SWING_F1);
  const freeEnd = {
    x: releaseAt.x + ATTACH_DX * PERSON_BOX + (ROPE_X - (releaseAt.x + ATTACH_DX * PERSON_BOX)) * rel,
    y: releaseAt.y + ATTACH_DY * PERSON_BOX,
  };
  const end = frame < SWING_F1 ? attach : freeEnd;
  const ropePts: Array<{ x: number; y: number }> = [
    { x: ROPE_BENCH_X, y: ROPE_TOP.y },
    ROPE_TOP,
    { x: ROPE_X, y: ROPE_DROP_Y },
  ];
  // Round the room's top-left corner only while a straight rope would cut
  // through the earth above the room — it binds and unbinds continuously.
  if (end.y > ROOM_CORNER.y) {
    const t = (ROOM_CORNER.y - ROPE_DROP_Y) / (end.y - ROPE_DROP_Y);
    const xAtCorner = ROPE_X + (end.x - ROPE_X) * t;
    if (xAtCorner > ROOM_CORNER.x) ropePts.push(ROOM_CORNER);
  }
  ropePts.push(end);
  const ropeD = ropePts.map((q, i) => `${i === 0 ? "M" : "L"}${q.x.toFixed(2)} ${q.y.toFixed(2)}`).join(" ");
  const rope = (fill: string) => (
    <path d={ropeD} fill="none" stroke={fill} strokeWidth={STROKE} strokeLinejoin="round" strokeLinecap="butt" />
  );

  // -- the tally --------------------------------------------------------------------
  const markP = (done: number) =>
    interpolate(frame, [done - 3, done - 3 + MARK_WIPE], [0, 1], { easing: EASE_LAND, ...clamp });
  const marks = TALLY_X.map((x, i) => ({ x, p: frame >= tally[i] - 3 ? markP(tally[i]) : 0 }));
  const markLine = (x: number, pr: number, fill: string, off = 0) => {
    const l = lineTo(x, TALLY_TOP, x, TALLY_BOTTOM, pr);
    return (
      <line
        x1={x + off}
        y1={TALLY_TOP + off}
        x2={l.x2 + off}
        y2={l.y2 + off}
        stroke={fill}
        strokeWidth={STROKE}
        strokeLinecap="butt"
      />
    );
  };

  // THE STRIKE + THE CHAIN: orange, purple, blue, then the white core, each a
  // wipe along the same diagonal, each resting STRIKE_STEP higher than the next.
  const coreStart = beats.five - 3;
  const strikeStarts = [coreStart - 3 * CHAIN_STAGGER, coreStart - 2 * CHAIN_STAGGER, coreStart - CHAIN_STAGGER];
  const strikeP = (s: number) => interpolate(frame, [s, s + STRIKE_WIPE], [0, 1], { easing: EASE_LAND, ...clamp });
  const strikeLine = (pr: number, fill: string, dx: number, dy: number) => {
    const l = lineTo(STRIKE.x0, STRIKE.y0, STRIKE.x1, STRIKE.y1, pr);
    return (
      <line
        x1={STRIKE.x0 + dx}
        y1={STRIKE.y0 + dy}
        x2={l.x2 + dx}
        y2={l.y2 + dy}
        stroke={fill}
        strokeWidth={STROKE}
        strokeLinecap="butt"
      />
    );
  };

  // -- DAY 5 ------------------------------------------------------------------------
  const dayRise = textRise(frame, beats.days - 12, k);

  return (
    <AbsoluteFill style={{ backgroundColor: "#C0C0C0" }}>
      <PaperGround
        frame={frame}
        cx={cx}
        cy={cy}
        cxRest={CX_REST}
        cyRest={CY_REST}
        k={k}
        scale={paperScale(k)}
      />
      <World cx={cx} cy={cy} k={k}>
        <SectionEarth idPrefix="fdu" extraHoles={[ROOM, DRIFT_ON]} />

        {/* THE TALLY: four marks, each on its hard shadow. */}
        {marks.map((m) =>
          m.p > 0 ? (
            <g key={m.x}>
              {markLine(m.x, m.p, SHADOW, SHADOW_OFF)}
              {markLine(m.x, m.p, INK)}
            </g>
          ) : null,
        )}

        {/* THE FIFTH: the crown, shadow at the very back on the core's timing. */}
        {frame >= coreStart ? strikeLine(strikeP(coreStart), SHADOW, SHADOW_OFF, SHADOW_OFF) : null}
        {CHAIN.map((c, i) =>
          frame >= strikeStarts[i] ? (
            <g key={c}>{strikeLine(strikeP(strikeStarts[i]), c, 0, -STRIKE_STEP * (3 - i))}</g>
          ) : null,
        )}
        {frame >= coreStart ? strikeLine(strikeP(coreStart), INK, 0, 0) : null}

        {/* THE ROPE, behind the figure: it meets him at the shoulder and,
            when it comes in from the room's corner, passes behind his head. */}
        <g transform={`translate(${SHADOW_OFF} ${SHADOW_OFF})`}>{rope(SHADOW)}</g>
        {rope(INK)}
        <g transform={`rotate(${p.tilt.toFixed(3)} ${attach.x.toFixed(2)} ${attach.y.toFixed(2)})`}>
          <Person x={boxX} y={p.y} size={PERSON_BOX} idPrefix="fdu" />
        </g>

        {/* DAY 5 — black, ON the white earth, so it carries no shadow. */}
        {dayRise.opacity > 0 ? (
          <text
            x={DAY_X}
            y={DAY_BASELINE + dayRise.dy}
            textAnchor="middle"
            fill={BLACK}
            opacity={dayRise.opacity}
            style={type(DAY_SIZE, 900)}
          >
            {dayText}
          </text>
        ) : null}
      </World>
    </AbsoluteFill>
  );
};

export default FiveDaysUnderground;
