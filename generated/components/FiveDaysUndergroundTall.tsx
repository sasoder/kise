import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import {
  type Hole,
  BLACK,
  CHAIN,
  CHAIN_STAGGER,
  EASE_LAND,
  INK,
  PAPER_BASE,
  PAPER_BLUR,
  PAPER_DIM,
  PAPER_PARALLAX,
  PAPER_SRC,
  Person,
  SHADOW,
  SHADOW_OFF,
  STROKE,
  SectionEarth,
  camEase,
  clamp,
  runCamera2,
  sway,
  textRise,
  type,
} from "./cerroShared";
import {
  DURATION as DURATION_169,
  FLOOR,
  FPS as FPS_169,
  PERSON_BOX,
  RELEASE_F1,
  SWING_F0,
  ROPE_BENCH_X,
  ROPE_TOP,
  ROPE_X,
  STAND_X,
  STRIKE,
  SWING_F1,
  TALLY_BOTTOM,
  TALLY_TOP,
  TALLY_X,
  defaultProps as defaultProps169,
  personAt,
  schema as schema169,
  type Props,
} from "./FiveDaysUnderground";

export const FPS = FPS_169;
// The same audio as the 16:9 cut: 193 frames of speech + a 16 frame tail.
export const DURATION = DURATION_169; // 209
export const schema = schema169;
export const defaultProps = defaultProps169;

// ---------------------------------------------------------------------------
// "FIVE DAYS UNDERGROUND", 9:16 (1080 x 1920) — the tall sibling of
// `FiveDaysUnderground` (cut 6 of the Cerro Gordo set). Same world, same
// figure, rope, bounds, room, tally, strike echo and word timings: every one
// of those is IMPORTED from the 16:9 file, which is not touched. What is new
// here is the frame: the paper (rotated for portrait), the world layer and
// the camera.
//
// CHECK LINE: "He goes a long way down a shaft on a rope, and then he stays
// down there: five days, counted on the wall."
//
// THE WORDS (trailer s -> local frame, 24 fps, f0 = 39.581 s) — unchanged:
//   You rappel down f0 · this shaft f41 · and you have f70 · at times f99 ·
//   stayed down there f130 · for like f155 · five f163 · days f169 ·
//   speech end f193 (tail to 209)
//
// THE GESTURES — the 16:9 cut's, none added:
//   f0-83   he rappels down in seven bounds                — "You rappel down"
//   f30-50  the camera eases back (k 1.73 -> 1.45) and KEEPS FOLLOWING him:
//           the levels slide past, he stays on the centre column at y ~900
//           and never under 120 px                          — "this shaft"
//   f68-94  the camera comes in on the room (k 2.2)          — "and you have"
//   f84-102 he swings in and lands; f102-116 he steps off, the rope's free
//           end swings back to hang plumb in the shaft at the left edge
//   f106 / f126 / f141 / f153  tally | || ||| ||||
//                            — "at times" / "stayed" / "down there" / "for like"
//   f154-163 the fifth, the strike, with the cut's ONE chain echo — "five"
//   f150-162 the frame settles 80 px down as DAY 5 arrives (see THE HOLD)
//   f157-169 DAY 5 (Barlow 900, black on the earth over the room) slides up
//           24 screen px and fades in                         — "days"
//   f94-209 the hold creeps IN, k 2.20 -> 2.21 (to f150) -> 2.32. No pull-back.
//
// THE HOLD, 9:16 (v2, after the director's review). The room is cut 400 wide
// here and its left wall is pinned at screen x 110, so the shaft and the
// hanging rope (x ~69) stay in frame at the left to the last frame. Its FLOOR
// is keyed in screen px: y 1100 from the push-in to f150, then 1100 -> 1180 on
// f150-162 as DAY 5 arrives, held at 1180 through the creep (k 2.21 -> 2.32,
// +5%, still moving at f209). At the end: ceiling y ~646, DAY 5 baseline ~584
// (62 px clear of the ceiling line) / cap top ~394, centred on x 540; figure
// ~195 px, tally ~220 px tall, strokes 9.6 world px. Below the room the mine
// carries on: the shaft down the left side and two lower levels across the
// lower frame. The wide of the descent is capped at k 1.45 (figure 122 px).
//
// THE CAMERA — keyed per frame, damped by runCamera2 (the same rig). The
// descent's content centre (his averaged path, 5 f ahead) lands on screen
// (540, 900). THE DAMPED NUMBERS (head = his ink top on screen):
//     f    k      cx      cy      head x,y   px/f  room floor y / left wall x
//     0    1.700     0.0    120.2   540, 776    0.0   3136 / 623
//     20   1.716     0.0    234.3   537, 835    7.8   2960 / 624
//     41   1.606     0.0    498.8   537, 787   22.4   2408 / 619
//     60   1.456     0.0    881.9   540, 814   27.9   1714 / 611
//     70   1.469     0.4   1109.7   538, 884   12.5   1386 / 611
//     79   1.569    51.4   1204.5   456, 1004   46.1   1267 / 536
//     94   2.106   224.6   1322.6   292, 920   34.7   1123 / 170
//     99   2.183   241.1   1334.0   367, 919    4.8   1104 / 121
//     106  2.201   244.4   1336.4   365, 915    0.2   1100 / 110
//     153  2.210   243.6   1335.7   366, 916    1.4   1102 / 110
//     163  2.215   243.1   1309.4   367, 975    5.8   1161 / 110
//     169  2.223   242.4   1302.1   368, 991    1.1   1178 / 110
//     190  2.268   238.6   1303.0   373, 990    0.4   1180 / 110
//     208  2.310   235.1   1304.8   378, 986    0.3   1180 / 110
// ---------------------------------------------------------------------------

export const FRAME_W = 1080;
export const FRAME_H = 1920;
const SX = FRAME_W / 2; // 540
const SY = 900; // where the descent's content centre sits on screen

// -- local copies of the 16:9 file's private constants -------------------------
const ATTACH_DX = 0.31;
const ATTACH_DY = 0.646;
const ROPE_DROP_Y = 30;
// v2 (director's review of the tall cut). LOCAL slots, through the same hook:
//   the room is 400 wide here (440 in 16:9) so that at k 2.2-2.32 its left
//   wall can sit at screen x 110 and the hanging rope (x ~69) stays well in
//   frame; the 1360 level carries on east of it; and the mine CONTINUES BELOW:
//   two lower east levels cross the frame under the room (screen y ~1440-1800)
//   beside the shaft, which already runs on down the left side.
const ROOM: Hole = { x: 49, y: 1170, w: 400, h: 230 };
const DRIFT_ON: Hole = { x: 448, y: 1360, w: 312, h: 40 };
const LOWER_LEVELS: Hole[] = [
  { x: 49, y: 1515, w: 330, h: 40 },
  { x: 49, y: 1625, w: 520, h: 40 },
];
const ROOM_CORNER = { x: 50 + STROKE / 2, y: ROOM.y + STROKE / 2 };
// The tally strokes and the strike, 1.6x the line weight: hairlines at phone
// width otherwise. Same white on the same hard shadow, same 32 px pitch.
const TALLY_STROKE = STROKE * 1.6; // 9.6
// He stands 4 px clear of the floor line, so his hard shadow shows as a black
// line under the glyph instead of the white glyph merging into the white floor.
const STAND_LIFT = SHADOW_OFF;
const MARK_WIPE = 5;
const STRIKE_STEP = TALLY_STROKE;
const STRIKE_WIPE = 8;

// DAY 5: black on the earth above the room. Cap height 80 world px.
export const DAY_SIZE = 117; // cap 82 world = 190 screen px at the end
export const DAY_BASELINE = ROOM.y - 27; // 1143: 62 screen px clear of the ceiling line
const ROOM_LEFT_SCREEN = 110;
// centred on screen x 540 at the end of the creep
export const K_ROOM = 2.2;
export const K_ROOM_CREEP = 2.21; // the held breath, f94-150
export const K_TAIL = K_ROOM_CREEP * 1.05; // 2.32 at f209: a creep you can see
export const DAY_X = ROOM.x + (SX - ROOM_LEFT_SCREEN) / K_TAIL; // 254.4

// -- the camera ------------------------------------------------------------------
export const K_CLOSE = 1.7; // figure ink 143 px
export const K_CLOSE_CREEP = 1.73;
export const K_WIDE = 1.45; // figure ink 122 px: the rappel stays readable
export const K_WIDE_CREEP = 1.47;
export const FLOOR_Y_HOLD = 1100; // the room's floor on screen until DAY 5 comes
export const FLOOR_Y_DAY = 1180; // and from then on

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
const kGeo = (k0: number, k1: number, g: number) => k0 * Math.pow(k1 / k0, g);

// The room's framing for a zoom k and a floor height on screen: content
// centre (x, c) such that the room's left wall is at ROOM_LEFT_SCREEN and its
// floor at floorY. (Screen: sx = SX + (X - x) k, sy = SY + (Y - c) k.)
const roomFrame = (k: number, floorY: number) => ({
  k,
  c: FLOOR - (floorY - SY) / k,
  x: ROOM.x + (SX - ROOM_LEFT_SCREEN) / k,
});

// An ANCHORED move: world point A slides in a straight line on screen while k
// eases geometrically (as in the 16:9 cut).
const anchored = (
  g: number,
  a: { x: number; y: number },
  from: { k: number; c: number; x: number },
  to: { k: number; c: number; x: number },
) => {
  const k = kGeo(from.k, to.k, g);
  const sy0 = SY + (a.y - from.c) * from.k;
  const sy1 = SY + (a.y - to.c) * to.k;
  const sx0 = SX + (a.x - from.x) * from.k;
  const sx1 = SX + (a.x - to.x) * to.k;
  const sy = sy0 + (sy1 - sy0) * g;
  const sx = sx0 + (sx1 - sx0) * g;
  return { k, c: a.y - (sy - SY) / k, x: a.x - (sx - SX) / k };
};
const ROOM_ANCHOR = { x: STAND_X, y: 1350 };

export const CAM_MOVES = {
  creep: [0, 30],
  out: [30, 50], // "this shaft"
  wideCreep: [50, 68],
  in: [68, 94], // "and you have"
  roomCreep: [94, 150],
  settle: [150, 162], // the floor 990 -> 1070 as DAY 5 arrives
  tail: [150, 209], // creep in
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
    k = kGeo(K_CLOSE_CREEP, K_WIDE, seg(f, 30, 50, 0.75));
    c = trend(f);
    x = 0;
  } else if (f <= 68) {
    k = kGeo(K_WIDE, K_WIDE_CREEP, seg(f, 50, 68));
    c = trend(f);
    x = 0;
  } else if (f <= 94) {
    const r = anchored(
      seg(f, 68, 94, 1.1),
      ROOM_ANCHOR,
      { k: K_WIDE_CREEP, c: trend(68), x: 0 },
      roomFrame(K_ROOM, FLOOR_Y_HOLD),
    );
    ({ k, c, x } = r);
  } else if (f <= 150) {
    ({ k, c, x } = roomFrame(kGeo(K_ROOM, K_ROOM_CREEP, seg(f, 94, 150)), FLOOR_Y_HOLD));
  } else {
    const kk = kGeo(K_ROOM_CREEP, K_TAIL, seg(f, 150, 225) / seg(209, 150, 225));
    const floorY = FLOOR_Y_HOLD + (FLOOR_Y_DAY - FLOOR_Y_HOLD) * seg(f, 150, 162);
    ({ k, c, x } = roomFrame(kk, floorY));
  }
  return { k, cy: c + (FRAME_H / 2 - SY) / k, cx: x };
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
const CY_REST = 700;
const CX_REST = 130;

// -- the ground, portrait ---------------------------------------------------------
// PeakForSolar's PaperGround: the 3864 x 2164 landscape photograph in a
// 1920*1.6 x 1080*1.6 box turned 90 deg (objectFit cover = 0.7985 of source),
// brightness 0.88 blur 3 on the image only, parallax 0.15 in both axes, drift
// -0.3 px/frame, scale 1 + (k - 1) * 0.3 CAPPED at 1.25 so it never passes
// 1.0x of source at the room's k. Worst margins: 278 px of travel against
// 960 px of slack vertically at the room; 511 px of slack at the widest.
const BG_OVERSIZE = 1.6;
const PaperGroundTall: React.FC<{ frame: number; cx: number; cy: number; k: number }> = ({ frame, cx, cy, k }) => {
  const bgY = -(cy - CY_REST) * k * PAPER_PARALLAX - frame * 0.3;
  const bgX = -(cx - CX_REST) * k * PAPER_PARALLAX;
  const bgScale = Math.min(1 + (k - 1) * 0.3, 1.25);
  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: PAPER_BASE }}>
      <Img
        src={staticFile(PAPER_SRC)}
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: FRAME_H * BG_OVERSIZE,
          height: FRAME_W * BG_OVERSIZE,
          objectFit: "cover",
          filter: `brightness(${PAPER_DIM}) blur(${PAPER_BLUR}px)`,
          transform: `translate(-50%, -50%) translate(${bgX.toFixed(2)}px, ${bgY.toFixed(2)}px) scale(${bgScale.toFixed(4)}) rotate(90deg)`,
        }}
      />
    </AbsoluteFill>
  );
};

// The world layer, 1080 x 1920 (cerroShared's `World` is 1920 x 1080).
const WorldTall: React.FC<{ cx: number; cy: number; k: number; children: React.ReactNode }> = ({
  cx,
  cy,
  k,
  children,
}) => (
  <AbsoluteFill>
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: FRAME_W,
        height: FRAME_H,
        transformOrigin: "0 0",
        transform: `translate(${FRAME_W / 2 - cx * k}px, ${FRAME_H / 2 - cy * k}px) scale(${k})`,
      }}
    >
      <svg
        width={FRAME_W}
        height={FRAME_H}
        viewBox={`0 0 ${FRAME_W} ${FRAME_H}`}
        style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
      >
        {children}
      </svg>
    </div>
  </AbsoluteFill>
);

const lineTo = (x0: number, y0: number, x1: number, y1: number, p: number) => ({
  x2: x0 + (x1 - x0) * p,
  y2: y0 + (y1 - y0) * p,
});

const FiveDaysUndergroundTall: React.FC<Props> = ({ beats, tally, dayText }) => {
  const frame = useCurrentFrame();

  const cam = runCamera2(frame, CAM_F, CAM_CY, CAM_CX, CAM_K);
  const drift = sway(frame);
  const k = cam.k;
  const cy = cam.cy + drift.dy;
  const cx = cam.cx + drift.dx;

  // -- the figure and the rope (as the 16:9 cut) ------------------------------------
  const p0 = personAt(frame);
  const stood = interpolate(frame, [SWING_F0, SWING_F1], [0, 1], { easing: Easing.inOut(Easing.cubic), ...clamp });
  const p = { ...p0, y: p0.y - STAND_LIFT * stood };
  const boxX = p.x - PERSON_BOX / 2;
  const attach = { x: p.x + ATTACH_DX * PERSON_BOX, y: p.y + ATTACH_DY * PERSON_BOX };
  const rel = interpolate(frame, [SWING_F1, RELEASE_F1], [0, 1], { easing: Easing.inOut(Easing.sin), ...clamp });
  const releaseAt = { ...personAt(SWING_F1), y: personAt(SWING_F1).y - STAND_LIFT };
  const relX = releaseAt.x + ATTACH_DX * PERSON_BOX;
  const freeEnd = { x: relX + (ROPE_X - relX) * rel, y: releaseAt.y + ATTACH_DY * PERSON_BOX };
  const end = frame < SWING_F1 ? attach : freeEnd;
  const ropePts: Array<{ x: number; y: number }> = [
    { x: ROPE_BENCH_X, y: ROPE_TOP.y },
    ROPE_TOP,
    { x: ROPE_X, y: ROPE_DROP_Y },
  ];
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

  // -- the tally ----------------------------------------------------------------------
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
        strokeWidth={TALLY_STROKE}
        strokeLinecap="butt"
      />
    );
  };

  // THE STRIKE + THE CHAIN, as the 16:9 cut.
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
        strokeWidth={TALLY_STROKE}
        strokeLinecap="butt"
      />
    );
  };

  const dayRise = textRise(frame, beats.days - 12, k);

  return (
    <AbsoluteFill style={{ backgroundColor: PAPER_BASE }}>
      <PaperGroundTall frame={frame} cx={cx} cy={cy} k={k} />
      <WorldTall cx={cx} cy={cy} k={k}>
        <SectionEarth idPrefix="fdut" extraHoles={[ROOM, DRIFT_ON, ...LOWER_LEVELS]} />

        {marks.map((m) =>
          m.p > 0 ? (
            <g key={m.x}>
              {markLine(m.x, m.p, SHADOW, SHADOW_OFF)}
              {markLine(m.x, m.p, INK)}
            </g>
          ) : null,
        )}

        {frame >= coreStart ? strikeLine(strikeP(coreStart), SHADOW, SHADOW_OFF, SHADOW_OFF) : null}
        {CHAIN.map((c, i) =>
          frame >= strikeStarts[i] ? (
            <g key={c}>{strikeLine(strikeP(strikeStarts[i]), c, 0, -STRIKE_STEP * (3 - i))}</g>
          ) : null,
        )}
        {frame >= coreStart ? strikeLine(strikeP(coreStart), INK, 0, 0) : null}

        <g transform={`translate(${SHADOW_OFF} ${SHADOW_OFF})`}>{rope(SHADOW)}</g>
        {rope(INK)}
        <g transform={`rotate(${p.tilt.toFixed(3)} ${attach.x.toFixed(2)} ${attach.y.toFixed(2)})`}>
          <Person x={boxX} y={p.y} size={PERSON_BOX} idPrefix="fdut" />
        </g>

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
      </WorldTall>
    </AbsoluteFill>
  );
};

export default FiveDaysUndergroundTall;
