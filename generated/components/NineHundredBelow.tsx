import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  BLACK,
  CHAIN,
  CHAIN_STAGGER,
  CHAIN_TRAVEL,
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
  camEase,
  clamp,
  runCamera2,
  sway,
  textRise,
  type,
} from "./cerroShared";
import { LIBERTY_MASK_DATA_URL, LIBERTY_MASK_H, LIBERTY_MASK_W } from "./nineHundredBelowAssets";

// ---------------------------------------------------------------------------
// CHECK LINE: "900 feet is three Statues of Liberty stacked on top of each
// other, and he hangs over all of it on one rope."
//
// "NINE HUNDRED BELOW" — Brent Underwood, Core Memory podcast, short "five days
// in the mine". 1080 x 1920 at 24000/1001 fps, sequence 17.392 - 24.066 s =
// 160 frames, rendered 168 (8 frames of trim handle after the cut). The same
// world as the Cerro Gordo cuts (cerroShared): white earth on its hard +4/+4
// shadow, paper-coloured void, the man on his rope, chain colours raw.
//
// THE WORDS (word onset -> local frame, f0 = 17.392 s):
//   So                f1
//   the idea of       f6
//   dangling          f16
//   on a rope         f28-40
//   with              f41
//   900               f47
//   foot              f53
//   of exposure       f59
//   below             f72
//   you               f78
//   is not one        f84
//   that my mind      f100-112
//   still, like       f113-128
//   enjoys            f129
//   thinking about    f145
//   speech ends       f159      (cut back to the speaker at f160)
//
// THE MOTION (revision 2) — one pull-back, the words only guide it:
//   1. f0-26: open on the man hanging on ONE plumb rope that runs up and out
//      of the top of the frame, over the mouth of the shaft: both lips and both
//      walls in frame, the shaft dropping empty out of the bottom. He swings
//      as a long pendulum (pivot 800 px above him: +-16 px sideways with a
//      slight lean, 60 f period, never stops).
//   2. f26-58: the camera eases back and straight down the shaft's axis to the
//      whole section, home by ~f62 with the floor in frame. "900 FT" and its
//      line arrive together on the first frame the label's place is in frame
//      (f52, "foot"): the label slides up as the line leaves the collar; the
//      line reaches the floor at f74.
//   3. f60-104: three Statues of Liberty rise as one continuous build, a new
//      layer leaving every 2 frames (statues at f60 / f68 / f76; orange,
//      purple, blue, white core; 22 f of travel each): the first up through
//      the floor, the next two from behind the one below. As the first white
//      core lands (f84) a short dimension line grows up the left wall beside
//      it and "305 FT" slides up: the unit. Then the picture holds, alive: his
//      swing, the paper's drift, a slow creep in to k 1.05.
//
// THE CAMERA — keyed per frame, damped by runCamera2 (CAM_STIFF / CAM_DAMP).
// It stays on the shaft's axis (cx 540); the open and the pull-back are
// ANCHORED on the man's height (the point slides straight down the screen),
// zoom eased geometrically, keyed f26-58; the closing creep (keyed from f98)
// heads for (546, 944) at k 1.06. The floor (y 1830, 90 px above the frame's
// bottom at rest) enters the frame at f59. The paper's scale is capped at 1.25
// (= 1.0x of source). THE DAMPED NUMBERS (before the +-5 px hand-held sway;
// feet / collar = his ink bottom and the bench line on screen):
//     f     k      cx      cy     feet y  collar y  frame bottom / right (world)
//     0     1.980  540.0   327.0    851      966       812 /  813
//     26    1.944  540.0   329.2    849      962       823 /  818
//     44    1.457  540.0   530.2    584      668      1189 /  911
//     58    1.042  540.0   902.5    303      363      1823 / 1058
//     72    1.000  540.0   960.2    272      330      1920 / 1080
//     108   1.001  540.1   959.8    272      330      1919 / 1080
//     160   1.045  544.6   947.7    254      314      1866 / 1061
// Fastest zoom: -2.85 % per frame at f44-47 (the collar moves 28 px/f there).
// ---------------------------------------------------------------------------

export const FPS = 24000 / 1001;
export const DURATION = 168;
export const FRAME_W = 1080;
export const FRAME_H = 1920;

// -- the section (world px = screen px at k 1, camera centre 540, 960) -----------
export const VOID = { x0: 360, x1: 720, top: 330, floor: 1830 } as const;
export const DROP_FT = 900;
export const PX_PER_FT = (VOID.floor - VOID.top) / DROP_FT; // 1.6667
export const STATUE_FT = 305; // ground to torch, pedestal and base included
export const STATUE_H = STATUE_FT * PX_PER_FT; // 508.33
export const STATUE_W = (STATUE_H * LIBERTY_MASK_W) / LIBERTY_MASK_H; // 274.03
export const STATUE_X = (VOID.x0 + VOID.x1) / 2 - STATUE_W / 2; // 402.98
/** top edge (the torch tip) of statue i at rest; i = 0 stands on the floor */
export const statueTop = (i: number) => VOID.floor - (i + 1) * STATUE_H; // 1321.7 / 813.3 / 305.0

// The earth: ONE white shape, flat bench at the collar on both sides, the
// shaft cut out of it. Its hard shadow shows as a 4 px black inset down the
// shaft's left wall (the same thing SectionEarth's slots do).
const EARTH_D =
  `M-4000 ${VOID.top} L${VOID.x0} ${VOID.top} L${VOID.x0} ${VOID.floor} L${VOID.x1} ${VOID.floor} ` +
  `L${VOID.x1} ${VOID.top} L5000 ${VOID.top} L5000 7000 L-4000 7000 Z`;

// -- the man and his rope ------------------------------------------------------------
// `Person` in a 142 px box (ink 120 px), body centred on the shaft's axis,
// hung from the RIGHT shoulder as in FiveDaysUnderground. ONE plumb rope comes
// down from far above the frame (world y -600: never in frame at any camera
// position) to that shoulder; nothing else is in the sky. Ink bottom at y 272:
// the top torch (y 305) ends 33 px under his feet.
export const PERSON_BOX = 142;
const ATTACH_DX = 0.31;
const ATTACH_DY = 0.646;
const INK_BOTTOM = 472 / 512;
export const FEET_Y = 272;
export const HANG_CX = (VOID.x0 + VOID.x1) / 2; // box centre, 540
export const HANG_TOP = FEET_Y - INK_BOTTOM * PERSON_BOX; // box top, 141.1
export const ATTACH = { x: HANG_CX + ATTACH_DX * PERSON_BOX, y: HANG_TOP + ATTACH_DY * PERSON_BOX };
/** the rope's top end and the pendulum's pivot */
export const PIVOT = { x: ATTACH.x, y: -600 };
/** the middle of his ink */
export const MAN = { x: HANG_CX, y: HANG_TOP + PERSON_BOX / 2 };
// A long pendulum: one sinusoid, never stops. +-SWING_PX sideways at his body,
// which at this length is a lean of +-1.1 deg.
export const SWING_PX = 16;
export const SWING_DEG = (Math.atan(SWING_PX / (MAN.y - PIVOT.y)) * 180) / Math.PI;
const SWING_PERIOD = 60;
const SWING_PHASE = 8;
export const swingAt = (f: number) => SWING_DEG * Math.sin((2 * Math.PI * (f + SWING_PHASE)) / SWING_PERIOD);

// -- the dimension ---------------------------------------------------------------------
// One black line down the right wall, collar to floor, a free-standing tick
// at each end (the top one flush under the bench line, on the white).
export const DIM_X = 760;
const TICK_HALF = 16;
const TICK_TOP_Y = VOID.top + STROKE / 2;
export const LABEL_X = 796;
export const LABEL_SIZE = 142; // cap 99 px; "900" is ~240 px wide: 796..1036
export const LABEL_BASE_1 = 700; // "900": cap top at y 600
export const LABEL_BASE_2 = 824; // "FT"
// THE UNIT: a short line up the LEFT wall spanning exactly the bottom statue,
// and "305 FT" on the wall to its left, right-aligned to the line.
export const TAG_X = 322;
const TAG_TICK_HALF = 14;
export const TAG_Y0 = statueTop(0); // 1321.7, the bottom statue's torch tip
export const TAG_Y1 = VOID.floor;
export const TAG_LABEL_X = 292; // text-anchor end: "305 FT" is ~220 px wide at 76: x 72..292
export const TAG_LABEL_SIZE = 76;
export const TAG_LABEL_BASE = (TAG_Y0 + TAG_Y1) / 2 + 0.35 * TAG_LABEL_SIZE; // centred on the statue's height

// -- the camera ------------------------------------------------------------------------
// It never leaves the shaft's axis (cx 540) until the closing creep. The open
// and the pull-back are ANCHORED on the man's height on that axis: the point
// slides in a straight line down the screen while k eases geometrically.
export const K_OPEN = 1.98;
export const K_OPEN_END = 1.93;
export const K_REST = 1;
export const K_END = 1.06;
const AXIS = { x: FRAME_W / 2, y: MAN.y };
const C_OPEN_Y = 330; // the camera's centre at the end of the open: the collar
const S_OPEN_Y = FRAME_H / 2 + (AXIS.y - C_OPEN_Y) * K_OPEN_END; // AXIS on screen at the open
const END_CENTRE = { x: 546, y: 944 }; // where the closing creep is heading
export const CAM_MOVES = { open: [0, 26], back: [26, 58], creep: [98, 168] } as const;
const BACK_WARP = 0.94;

const seg = (f: number, f0: number, f1: number, warp = 1) => camEase((f - f0) / (f1 - f0), warp);
const kGeo = (k0: number, k1: number, g: number) => k0 * Math.pow(k1 / k0, g);

const camKey = (f: number) => {
  const [, backStart] = CAM_MOVES.open;
  const [, backEnd] = CAM_MOVES.back;
  if (f <= backStart) {
    const u = f / backStart;
    const k = kGeo(K_OPEN, K_OPEN_END, u * u);
    return { k, cx: AXIS.x, cy: AXIS.y - (S_OPEN_Y - FRAME_H / 2) / k };
  }
  if (f <= backEnd) {
    const g = seg(f, backStart, backEnd, BACK_WARP);
    const k = kGeo(K_OPEN_END, K_REST, g);
    const sy = S_OPEN_Y + (AXIS.y - S_OPEN_Y) * g;
    return { k, cx: AXIS.x, cy: AXIS.y - (sy - FRAME_H / 2) / k };
  }
  // the hold creeps IN, about one fixed point, still moving at the last frame
  const [creepStart] = CAM_MOVES.creep;
  const g = f <= creepStart ? 0 : seg(f, creepStart, 215) / seg(DURATION, creepStart, 215);
  const k = kGeo(K_REST, K_END, g);
  const h = (1 - 1 / k) / (1 - 1 / K_END);
  return { k, cx: FRAME_W / 2 + (END_CENTRE.x - FRAME_W / 2) * h, cy: FRAME_H / 2 + (END_CENTRE.y - FRAME_H / 2) * h };
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
export const cameraAt = (f: number) => {
  const cam = runCamera2(f, CAM_F, CAM_CY, CAM_CX, CAM_K);
  const drift = sway(f);
  return { k: cam.k, cx: cam.cx + drift.dx, cy: cam.cy + drift.dy };
};

// -- the ground, portrait (FiveDaysUndergroundTall's) ------------------------------------
// The 3864 x 2164 landscape photograph in a 1920*1.6 x 1080*1.6 box turned
// 90 deg (objectFit cover = 0.7985 of source), brightness 0.88 blur 3 on the
// image only, parallax 0.15, drift -0.3 px/frame, scale 1 + (k - 1) * 0.3
// CAPPED at 1.25 so it never passes 1.0x of source at the close open.
const BG_OVERSIZE = 1.6;
const CY_REST = 620;
const CX_REST = 540;
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

const WORLD_SVG: React.CSSProperties = { position: "absolute", left: 0, top: 0, overflow: "visible" };

// -- the statues ---------------------------------------------------------------------------
// One node per layer: the silhouette PNG as a CSS mask over a flat colour.
const MASK: React.CSSProperties = {
  WebkitMaskImage: `url(${LIBERTY_MASK_DATA_URL})`,
  maskImage: `url(${LIBERTY_MASK_DATA_URL})`,
  WebkitMaskSize: "100% 100%",
  maskSize: "100% 100%",
  WebkitMaskRepeat: "no-repeat",
  maskRepeat: "no-repeat",
};
const StatueLayer: React.FC<{ x: number; y: number; color: string }> = ({ x, y, color }) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      top: 0,
      width: STATUE_W,
      height: STATUE_H,
      backgroundColor: color,
      transform: `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px)`,
      ...MASK,
    }}
  />
);
/** Everything inside is cut off below world y `bottom` (the pit floor). */
const FloorClip: React.FC<{ bottom: number; children: React.ReactNode }> = ({ bottom, children }) => (
  <div style={{ position: "absolute", left: -2000, top: -4000, width: 6000, height: 4000 + bottom, overflow: "hidden" }}>
    <div style={{ position: "absolute", left: 2000, top: 4000 }}>{children}</div>
  </div>
);

export const schema = z.object({
  /** frame each statue's orange layer leaves (bottom, middle, top) */
  statues: z.array(z.number()).length(3).default([60, 68, 76]),
  /** "900 FT": the label slides up and the line leaves the collar together */
  lineStart: z.number().default(54),
  /** the line reaches the floor */
  lineEnd: z.number().default(74),
  /** "305 FT": the unit tag beside the bottom statue, as its white core lands */
  tagStart: z.number().default(84),
  label: z.string().default("900"),
  unit: z.string().default("FT"),
  tag: z.string().default("305 FT"),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

const NineHundredBelow: React.FC<Props> = ({ statues, lineStart, lineEnd, tagStart, label, unit, tag }) => {
  const frame = useCurrentFrame();
  const { k, cx, cy } = cameraAt(frame);

  // -- the man: a long pendulum on one rope ---------------------------------------------
  const deg = swingAt(frame);
  const rad = (deg * Math.PI) / 180;
  const ax = ATTACH.x - PIVOT.x;
  const ay = ATTACH.y - PIVOT.y;
  const attach = {
    x: PIVOT.x + ax * Math.cos(rad) - ay * Math.sin(rad),
    y: PIVOT.y + ax * Math.sin(rad) + ay * Math.cos(rad),
  };
  const rope = (fill: string) => (
    <line
      x1={PIVOT.x}
      y1={PIVOT.y}
      x2={attach.x.toFixed(2)}
      y2={attach.y.toFixed(2)}
      stroke={fill}
      strokeWidth={STROKE}
      strokeLinecap="butt"
    />
  );

  // -- the stack ---------------------------------------------------------------------
  // Each statue travels one statue height on EASE_LAND: orange, purple, blue,
  // then the white core (and its shadow), 2 frames apart. The bottom one comes
  // up through the shaft floor; the next two start exactly behind the statue
  // below (same silhouette, so they are hidden there) and rise out of it.
  // Once a core is home (within 0.75 px: EASE_LAND's tail is long) its colours
  // are gone, so no fringe shows through the core's edge: a layer exists or it
  // does not.
  const rise = (start: number) =>
    (1 - interpolate(frame, [start, start + CHAIN_TRAVEL], [0, 1], { easing: EASE_LAND, ...clamp })) * STATUE_H;
  const statue = (i: number) => {
    const s0 = statues[i];
    const coreStart = s0 + 3 * CHAIN_STAGGER;
    const landed = frame > coreStart && rise(coreStart) < 0.75;
    const top = statueTop(i);
    const colours = landed
      ? null
      : CHAIN.map((c, j) => {
          const s = s0 + j * CHAIN_STAGGER;
          return frame > s ? <StatueLayer key={c} x={STATUE_X} y={top + rise(s)} color={c} /> : null;
        });
    const coreIn = frame > coreStart;
    const coreY = top + rise(coreStart);
    const shadow = coreIn ? <StatueLayer x={STATUE_X + SHADOW_OFF} y={coreY + SHADOW_OFF} color={SHADOW} /> : null;
    const core = coreIn ? <StatueLayer x={STATUE_X} y={coreY} color={INK} /> : null;
    return { shadow, colours, core };
  };
  const s1 = statue(0);
  const s2 = statue(1);
  const s3 = statue(2);

  // -- the dimension --------------------------------------------------------------------
  const lineP = interpolate(frame, [lineStart, lineEnd], [0, 1], { easing: Easing.inOut(Easing.sin), ...clamp });
  const tipY = VOID.top + (VOID.floor - VOID.top) * lineP;
  // the ticks grow sideways out of the line: the top one as it leaves the
  // collar, the bottom one as its tip lands on the floor level
  const topTickP = interpolate(frame, [lineStart - 3, lineStart + 3], [0, 1], { easing: EASE_LAND, ...clamp });
  const tickP = interpolate(frame, [lineEnd - 1, lineEnd + 6], [0, 1], { easing: EASE_LAND, ...clamp });
  const labelRise = textRise(frame, lineStart, k);
  // THE UNIT: bottom tick, then the line up the wall beside the landed statue,
  // then the top tick at its torch; the label slides up with it.
  const tagTick0 = interpolate(frame, [tagStart, tagStart + 5], [0, 1], { easing: EASE_LAND, ...clamp });
  const tagP = interpolate(frame, [tagStart + 1, tagStart + 11], [0, 1], { easing: Easing.inOut(Easing.sin), ...clamp });
  const tagTick1 = interpolate(frame, [tagStart + 10, tagStart + 16], [0, 1], { easing: EASE_LAND, ...clamp });
  const tagRise = textRise(frame, tagStart, k);
  const hTick = (x: number, y: number, half: number, p: number) => (
    <line x1={x - half * p} y1={y} x2={x + half * p} y2={y} stroke={BLACK} strokeWidth={STROKE} strokeLinecap="butt" />
  );

  return (
    <AbsoluteFill style={{ backgroundColor: PAPER_BASE }}>
      <PaperGroundTall frame={frame} cx={cx} cy={cy} k={k} />
      {/* warms the mask's image before the first statue layer is drawn */}
      <Img src={LIBERTY_MASK_DATA_URL} style={{ position: "absolute", left: -8, top: -8, width: 2, height: 2 }} />
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
          {/* THE EARTH: one white shape on its hard shadow. */}
          <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} style={WORLD_SVG}>
            <g transform={`translate(${SHADOW_OFF} ${SHADOW_OFF})`}>
              <path d={EARTH_D} fill={SHADOW} />
            </g>
            <path d={EARTH_D} fill={INK} />
          </svg>

          {/* THE STACK, top statue at the back so each rises from behind the one below. */}
          {s3.shadow}
          {s3.colours}
          {s3.core}
          {s2.shadow}
          {s2.colours}
          {s2.core}
          <FloorClip bottom={VOID.floor + SHADOW_OFF}>{s1.shadow}</FloorClip>
          <FloorClip bottom={VOID.floor}>
            {s1.colours}
            {s1.core}
          </FloorClip>

          <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} style={WORLD_SVG}>
            {/* THE DIMENSION: black on the white wall, collar to floor. */}
            {lineP > 0 ? (
              <line
                x1={DIM_X}
                y1={VOID.top}
                x2={DIM_X}
                y2={tipY}
                stroke={BLACK}
                strokeWidth={STROKE}
                strokeLinecap="butt"
              />
            ) : null}
            {topTickP > 0 ? (
              <line
                x1={DIM_X - TICK_HALF * topTickP}
                y1={TICK_TOP_Y}
                x2={DIM_X + TICK_HALF * topTickP}
                y2={TICK_TOP_Y}
                stroke={BLACK}
                strokeWidth={STROKE}
                strokeLinecap="butt"
              />
            ) : null}
            {tickP > 0 ? (
              <line
                x1={DIM_X - TICK_HALF * tickP}
                y1={VOID.floor}
                x2={DIM_X + TICK_HALF * tickP}
                y2={VOID.floor}
                stroke={BLACK}
                strokeWidth={STROKE}
                strokeLinecap="butt"
              />
            ) : null}
            {labelRise.opacity > 0 ? (
              <g opacity={labelRise.opacity} fill={BLACK}>
                <text x={LABEL_X} y={LABEL_BASE_1 + labelRise.dy} style={type(LABEL_SIZE, 900)}>
                  {label}
                </text>
                <text x={LABEL_X} y={LABEL_BASE_2 + labelRise.dy} style={type(LABEL_SIZE, 900)}>
                  {unit}
                </text>
              </g>
            ) : null}

            {/* THE UNIT TAG, on the left wall beside the bottom statue. */}
            {frame > tagStart ? hTick(TAG_X, TAG_Y1, TAG_TICK_HALF, tagTick0) : null}
            {tagP > 0 ? (
              <line
                x1={TAG_X}
                y1={TAG_Y1}
                x2={TAG_X}
                y2={TAG_Y1 + (TAG_Y0 - TAG_Y1) * tagP}
                stroke={BLACK}
                strokeWidth={STROKE}
                strokeLinecap="butt"
              />
            ) : null}
            {tagTick1 > 0 ? hTick(TAG_X, TAG_Y0 + STROKE / 2, TAG_TICK_HALF, tagTick1) : null}
            {tagRise.opacity > 0 ? (
              <text
                x={TAG_LABEL_X}
                y={TAG_LABEL_BASE + tagRise.dy}
                textAnchor="end"
                fill={BLACK}
                opacity={tagRise.opacity}
                style={type(TAG_LABEL_SIZE, 900)}
              >
                {tag}
              </text>
            ) : null}

            {/* THE ROPE, plumb from far above the frame, and the man in front of
                it, swinging with it. */}
            <g transform={`translate(${SHADOW_OFF} ${SHADOW_OFF})`}>{rope(SHADOW)}</g>
            {rope(INK)}
            <g transform={`rotate(${deg.toFixed(3)} ${PIVOT.x} ${PIVOT.y})`}>
              <Person x={HANG_CX - PERSON_BOX / 2} y={HANG_TOP} size={PERSON_BOX} idPrefix="nhb" />
            </g>
          </svg>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default NineHundredBelow;
