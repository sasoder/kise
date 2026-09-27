import React from 'react';
import {Easing, useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {
  CoreMemoryIconStack,
  coreMemoryTiming,
  LOOP_FRAMES,
  SHADOW_OFFSET,
  SPEAKING_IN_FRAMES,
  TAU,
} from './coreMemoryIcon';

// Speaking man icon — CORE MEMORY PODCAST STYLE.
//
// A sister to ClockIconCoreMemory, on the same DRAWN route: there is no source
// PNG, because the speech inside the bubble moves and the head lifts, and a
// static alpha mask cannot. Each layer of the shared stack (shadow, orange,
// purple, blue, white core) is the icon's silhouette AT THE CURRENT FRAME,
// rendered as inline SVG in one flat colour through the stack's `renderLayer`
// slot. Every layer gets the same conveyor offset, the same written lengths and
// the same head lift on a given frame, so the five copies are identical shapes
// and the chain vanishes behind the core exactly as it does for the masked
// icons. Transparent overlay asset, white ink, NO text.
//
// The icon: the house person glyph (public/person.png, rebuilt as SVG from its
// measured proportions — see PERSON_*) at lower left, facing front, and a
// rounded-rectangle speech bubble (1.6 : 1, corner radius 22 % of its height)
// at upper right with a short tapered tail aimed at the person's head. The
// speech is the clip's word-bar vocabulary (cottageShared's pill-ended bars),
// cut out of the bubble as HOLES: the footage shows through them, and every
// layer shares the same holes, so the hard shadow shows along the top and left
// inside each one, like the server's LED slots.
//
// The motion, complete — nothing else happens:
//  1. Entrance (In clip only, f0-f28). The shared core memory slide-up: orange
//     at f0, purple f2, blue f4, white core f6, each rising 130px over 22
//     frames on bezier(0.16, 1, 0.3, 1), nothing fading; hard black shadow at
//     the back on the core's timing; the colour layers are not rendered after
//     blue lands (f26). The speech is ALREADY RUNNING while it slides in: In f0
//     is loop f48, halfway through the second line being written.
//  2. Speaking (both clips), the one loop gesture: the bubble's three lines are
//     a rigid CONVEYOR, one new line every 32 frames, 3 per 96-frame loop.
//     Each beat (loop f0, f32, f64):
//       b0-b10   every line scrolls up one pitch on an ease-in-out
//                (bezier 0.45, 0, 0.25, 1; 53 % of the way by b4, 97 % by b8);
//                the top line slides out under the bubble's inner top edge
//                and is clipped there (flat cut, no fade), gone by b4.
//       b8-b26   the new line WRITES ON in the bottom slot: one written end
//                runs left to right at a constant rate, and each bar grows
//                behind it in turn, the word gaps acting as spaces. The rate
//                makes the average line take 14 f (these three take 12.9 /
//                17.9 / 11.1 f). The line is written on the conveyor's own
//                last row, already 99 % home when its first bar shows (b9),
//                so it can never overlap the line above.
//       b26-b32  hold (the breath runs through it).
//     The three lines (hashed bar lengths: 2 / 3 / 2 bars, 72 / 100 / 62 % of
//     the inner width) repeat exactly every 96 f, so the loop is seamless by
//     construction.
//  3. Head lift: as each new line starts writing (b8) the head alone lifts 1 %
//     of iconSize (5.1 units of the 512 box) over 4 f and settles back over
//     6 f, smoothstep both ways. The body never moves.
//  4. Whole-icon breath, the siblings' restrained one: a volume-preserving
//     squash (x +0.6% / y -0.9%), one cycle per loop, anchored at the foot of
//     the person (the group's base) so it breathes off the ground.
// `liveliness` multiplies the head lift and the breath. The conveyor is the
// speech itself (like the clock's hands) and always runs.
//
// Everything is driven off one normalised `cycle`. In the In clip that cycle
// runs off `frame - 48`, so In f47 is loop frame 95 and Loop f0 is loop frame
// 0: cutting from the In clip into the looping clip is an ordinary
// adjacent-frame step (a new beat's scroll begins on Loop f0 either way).

export const schema = z.object({
  iconSize: z.number().min(240).max(1040),
  /** 'in' plays the entrance once; 'loop' is the seamless rest state. */
  mode: z.enum(['in', 'loop']),
  /** Hard shadow offset in canvas px, down and right. */
  shadowOffset: z.number().min(0).max(48),
  /** Multiplies the head lift and the breath. 0 stills both; the speech runs. */
  liveliness: z.number().min(0).max(2),
});

export type SpeakingManIconCoreMemoryProps = z.infer<typeof schema>;

export const defaultProps: SpeakingManIconCoreMemoryProps = schema.parse({
  iconSize: 760,
  mode: 'loop',
  shadowOffset: SHADOW_OFFSET,
  liveliness: 1,
});

// ---------------------------------------------------------------------------
// Geometry, in the family's own 512x512 space.
const VIEW = 512;

// PERSON — public/person.png measured from its alpha (512 px, ink 40.97..471.07
// on both axes, so a 430.1 px square). As fractions of that ink width:
//   head   circle, centre (0.5, 0.2381), r 0.2380 (top touches the ink top)
//   body   top 0.5239 (gap under the head 0.0478); a flat top of half-width
//          0.05 running into two elliptical shoulders, rx 0.4500 / ry 0.4511,
//          centred 0.975 down (rms 0.06 px against the PNG's edge); sides
//          reach the ink box at 0.975; bottom 1.0 with corners r 0.0233.
const PERSON_W = 262;
const PERSON_X = 36;
const PERSON_Y = 471 - PERSON_W;
const HEAD_CX = PERSON_X + 0.5 * PERSON_W;
const HEAD_CY = PERSON_Y + 0.2381 * PERSON_W;
const HEAD_R = 0.238 * PERSON_W;
const BODY_TOP = PERSON_Y + 0.5239 * PERSON_W;
const BODY_FLAT = 0.05 * PERSON_W;
const BODY_RX = 0.45 * PERSON_W;
const BODY_RY = 0.4511 * PERSON_W;
const BODY_SIDE = PERSON_Y + 0.975 * PERSON_W;
const BODY_BOTTOM = PERSON_Y + PERSON_W;
const BODY_CORNER = 0.0233 * PERSON_W;

// BUBBLE — 1.6 : 1, corner radius 22 % of its height, at upper right.
const BUB_W = 244;
const BUB_H = BUB_W / 1.6;
const BUB_R = 0.22 * BUB_H;
const BUB_X = 476 - BUB_W;
const BUB_Y = 41;
const BUB_BOTTOM = BUB_Y + BUB_H;

// TAIL — leaves the flat bottom edge where the lower-left corner's arc ends,
// tapers to a rounded point aimed at the head's centre, and stops TAIL_AIR
// short of the head.
const TAIL_BASE_L = BUB_X + BUB_R;
const TAIL_BASE_W = 0.27 * BUB_H;
const TAIL_AIR = 0.42 * HEAD_R;
const TAIL_ROUND = 6; // stroke that rounds the tip, in 512 units
const tail = (() => {
  const bx = TAIL_BASE_L + TAIL_BASE_W / 2;
  const dx = HEAD_CX - bx;
  const dy = HEAD_CY - BUB_BOTTOM;
  const d = Math.hypot(dx, dy);
  // the stroke's half-width is part of the tail's reach
  const reach = d - HEAD_R - TAIL_AIR - TAIL_ROUND / 2;
  return {
    tipX: bx + (dx / d) * reach,
    tipY: BUB_BOTTOM + (dy / d) * reach,
  };
})();

// SPEECH — word-bars cut as holes. Even inner margin (left = top = bottom),
// bar height 13 % of the bubble's height, cottageShared's word gap ratio.
const MARGIN = 0.19 * BUB_H;
const BAR_H = 0.13 * BUB_H;
const LINE_GAP = 0.115 * BUB_H;
const PITCH = BAR_H + LINE_GAP;
const WORD_GAP = 0.7 * BAR_H;
const INNER_W = BUB_W - 2 * MARGIN;
const TEXT_X = BUB_X + MARGIN;
/** Top of the top slot, and the inner top edge the leaving line slides under. */
const TEXT_TOP = BUB_Y + MARGIN;
const CLIP_TOP = TEXT_TOP - 0.5;

// The three lines: hashed bar lengths, fixed seed (2 / 3 / 2 bars, 72 / 100 /
// 62 % of the inner width, every bar at least 1.67 bar-heights long, lengths
// within a line varying up to 2.4x so they read as words, not dashes).
const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const SEED = 874;
const LINES = [0, 1, 2].map((l) => {
  const base = SEED * 31 + l * 7;
  const n = hash(base + 1) > 0.5 ? 3 : 2;
  const raw = Array.from({length: n}, (_, j) => 0.3 + 1.4 * hash(base + 2 + j));
  const target = INNER_W * (0.55 + 0.45 * hash(base + 6));
  const k = (target - (n - 1) * WORD_GAP) / raw.reduce((a, b) => a + b, 0);
  const widths = raw.map((r) => r * k);
  const starts: number[] = [];
  let x = 0;
  for (const w of widths) {
    starts.push(x);
    x += w + WORD_GAP;
  }
  return {widths, starts, total: x - WORD_GAP};
});

// ---------------------------------------------------------------------------
// Timing, in loop frames.
const LINES_PER_LOOP = 3;
const BEAT = LOOP_FRAMES / LINES_PER_LOOP; // 32
const SCROLL_F = 10;
const WRITE_AT = 8;
/** The average line takes this long to write; the rate is constant. */
const WRITE_F_MEAN = 14;
const WRITE_RATE =
  LINES.reduce((a, l) => a + l.total, 0) / LINES.length / WRITE_F_MEAN;
const LIFT = 0.01 * VIEW;
const LIFT_UP = 4;
const LIFT_DOWN = 6;

const scrollEase = Easing.bezier(0.45, 0, 0.25, 1);
const smooth = (x: number) => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
};
const mod = (a: number, n: number) => ((a % n) + n) % n;

// Placement: the group's ink box is centred in the 512 box (x 36..476, y
// 41..471), but its mass sits low and left (the person outweighs the holed
// bubble): the white-ink centroid of a rest frame (Loop f95) is 10.1 px left
// of and 8.1 px below the canvas centre at iconSize 760. Half of that is taken
// back, as a fraction of iconSize — optical, not geometric, centring, as the
// hammer and sickle does.
const OPTICAL_X = 0.0067;
const OPTICAL_Y = -0.0053;

// Foot of the person (the group's base), the breath's anchor.
const FOOT_X = 0.5;
const FOOT_Y = BODY_BOTTOM / VIEW;

const svgBox: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  overflow: 'visible',
};

const bodyPath = [
  `M ${HEAD_CX - BODY_FLAT} ${BODY_TOP}`,
  `L ${HEAD_CX + BODY_FLAT} ${BODY_TOP}`,
  `A ${BODY_RX} ${BODY_RY} 0 0 1 ${PERSON_X + PERSON_W} ${BODY_SIDE}`,
  `L ${PERSON_X + PERSON_W} ${BODY_BOTTOM - BODY_CORNER}`,
  `A ${BODY_CORNER} ${BODY_CORNER} 0 0 1 ${PERSON_X + PERSON_W - BODY_CORNER} ${BODY_BOTTOM}`,
  `L ${PERSON_X + BODY_CORNER} ${BODY_BOTTOM}`,
  `A ${BODY_CORNER} ${BODY_CORNER} 0 0 1 ${PERSON_X} ${BODY_BOTTOM - BODY_CORNER}`,
  `L ${PERSON_X} ${BODY_SIDE}`,
  `A ${BODY_RX} ${BODY_RY} 0 0 1 ${HEAD_CX - BODY_FLAT} ${BODY_TOP}`,
  'Z',
].join(' ');

// The tail's base sits 2 units inside the bubble so the join is seamless.
const tailPath = [
  `M ${TAIL_BASE_L} ${BUB_BOTTOM - 2}`,
  `L ${TAIL_BASE_L + TAIL_BASE_W} ${BUB_BOTTOM - 2}`,
  `L ${tail.tipX} ${tail.tipY}`,
  'Z',
].join(' ');

type Bar = {x: number; y: number; w: number};

/** Every hole on screen at this loop frame: the conveyor, one clock. */
const speechBars = (loopFrame: number): Bar[] => {
  const k = Math.floor(loopFrame / BEAT);
  const b = loopFrame - k * BEAT;
  const s = scrollEase(Math.min(1, Math.max(0, b / SCROLL_F)));
  const written = Math.max(0, (b - WRITE_AT) * WRITE_RATE);
  const bars: Bar[] = [];
  // line n is written in beat n; after beat k's scroll it sits in slot
  // 2 - (k - n) (0 = top). The one in slot -1 is leaving under the top edge.
  for (let n = k - 3; n <= k; n++) {
    const line = LINES[mod(n, LINES_PER_LOOP)];
    const slot = 2 - (k - n) + (1 - s);
    const y = TEXT_TOP + slot * PITCH;
    const L = n === k ? Math.min(written, line.total) : line.total;
    line.widths.forEach((w, j) => {
      const grown = Math.max(0, Math.min(w, L - line.starts[j]));
      if (grown > 0.01) bars.push({x: TEXT_X + line.starts[j], y, w: grown});
    });
  }
  return bars;
};

/** The head's lift at this loop frame: up 4 f, settle 6 f, from WRITE_AT. */
const headLift = (loopFrame: number) => {
  const t = mod(loopFrame, BEAT) - WRITE_AT;
  if (t <= 0 || t >= LIFT_UP + LIFT_DOWN) return 0;
  return t <= LIFT_UP ? smooth(t / LIFT_UP) : 1 - smooth((t - LIFT_UP) / LIFT_DOWN);
};

const SpeakingManIconCoreMemory: React.FC<SpeakingManIconCoreMemoryProps> = ({
  iconSize,
  mode,
  shadowOffset,
  liveliness,
}) => {
  const frame = useCurrentFrame();
  const timing = coreMemoryTiming(mode, frame, SPEAKING_IN_FRAMES);
  const {cycle} = timing;
  const loopFrame = cycle * LOOP_FRAMES;

  const bars = speechBars(loopFrame);
  const lift = headLift(loopFrame) * LIFT * liveliness;

  /**
   * The silhouette at this frame in one flat colour. Called once per layer with
   * that layer's colour, so all five copies are the same shape with the same
   * holes.
   */
  const renderLayer = (color: string) => {
    const id = `smi-${color.replace('#', '')}`;
    return (
      <svg style={svgBox} viewBox={`0 0 ${VIEW} ${VIEW}`}>
        <defs>
          <clipPath id={`${id}-vp`}>
            <rect
              x={BUB_X}
              y={CLIP_TOP}
              width={BUB_W}
              height={BUB_BOTTOM - CLIP_TOP}
            />
          </clipPath>
          <mask
            id={`${id}-holes`}
            maskUnits="userSpaceOnUse"
            x={-VIEW}
            y={-VIEW}
            width={3 * VIEW}
            height={3 * VIEW}
          >
            <rect
              x={-VIEW}
              y={-VIEW}
              width={3 * VIEW}
              height={3 * VIEW}
              fill="#FFFFFF"
            />
            <g clipPath={`url(#${id}-vp)`}>
              {bars.map((bar, i) => (
                <rect
                  key={i}
                  x={bar.x}
                  y={bar.y}
                  width={bar.w}
                  height={BAR_H}
                  rx={Math.min(BAR_H / 2, bar.w / 2)}
                  fill="#000000"
                />
              ))}
            </g>
          </mask>
        </defs>
        <g mask={`url(#${id}-holes)`} fill={color}>
          <rect
            x={BUB_X}
            y={BUB_Y}
            width={BUB_W}
            height={BUB_H}
            rx={BUB_R}
          />
          <path
            d={tailPath}
            stroke={color}
            strokeWidth={TAIL_ROUND}
            strokeLinejoin="round"
          />
          <circle cx={HEAD_CX} cy={HEAD_CY - lift} r={HEAD_R} />
          <path d={bodyPath} />
        </g>
      </svg>
    );
  };

  // Volume-preserving breathing squash off the foot, one cycle per loop.
  const breath = Math.sin(TAU * cycle) * liveliness;
  const sx = 1 + breath * 0.006;
  const sy = 1 - breath * 0.009;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          translate: `${OPTICAL_X * iconSize}px ${OPTICAL_Y * iconSize}px`,
        }}
      >
        <CoreMemoryIconStack
          iconSize={iconSize}
          frame={frame}
          timing={timing}
          shadowOffset={shadowOffset}
          transformOrigin={`${FOOT_X * 100}% ${FOOT_Y * 100}%`}
          transform={`scale(${sx}, ${sy})`}
          flair={null}
          renderLayer={renderLayer}
        />
      </div>
    </div>
  );
};

export default SpeakingManIconCoreMemory;
