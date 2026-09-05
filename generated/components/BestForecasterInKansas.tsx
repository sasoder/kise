import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { z } from "zod";
import {
  FLASH,
  GAP,
  GLIDE,
  GROUND_LIFT,
  GROUND_O,
  GROUND_W,
  LAND,
  RISE,
  backdropStyle,
  clamp01,
  hash,
  qbez,
  runCamera,
  sgnRand as sgn,
} from "./cheekyPintSystem";

export const FPS = 24;
// Kalshi, "monitoring the situation" — 00:00:23,160 -> 00:00:34,100 of the
// source cut. round(10.94 * 24) = 263.
export const DURATION = 263;

const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ez = (e: (t: number) => number, t: number) => e(clamp01(t));

// ---------------------------------------------------------------------------
// The line
//
// "the best inflation forecaster on Kalshi over the last few years is not —
// none of the institutions or the big-name hedge funds. It's this guy who
// lives in Kansas, never traded financial markets before, just likes to read
// the news."
//
// So: a lineup on the floor, an actor above it, and one connection between
// them that goes looking. The institutions and the hedge funds are crowds of
// the house person glyph standing up on heaps of dots — the dots are their
// trades, the thing they stand on. The guy is the same glyph on the bare
// floor. A thread from the Kalshi mark sweeps the floor once for the years,
// reads each crowd white and lets it go, then lands on him and turns amber.
// "Kansas" is the pull-back that shows how far from the crowds he stands.
// "Never traded" draws an empty slot where his heap would be, against the
// heaps everyone else has. "Reads the news" fills that slot with lines, one
// at a time, and he rises on them.
// ---------------------------------------------------------------------------
const WORLD_W = 2400;
const WORLD_H = 2400;
const X0 = 1200;
const FLOOR_Y = 1500;

const PERSON = staticFile("person.png");

// One unit for a trade, one grid for every heap.
const DOT_R = 21;
const COL_STEP = 52;
const ROW_STEP = 47;

// One unit for a person. The glyph's ink fills ~84% of its box.
const P = 92;

// ---------------------------------------------------------------------------
// The lineup
//
// Two crowds and one man, on one floor. The institutions are wide and low —
// many people on a broad heap. The hedge funds are fewer people on a taller,
// narrower heap: the big name is height. The gap between the two heaps is the
// system gap; the man stands a long way to the right of both of them.
// ---------------------------------------------------------------------------
type Crowd = {
  x: number;
  cols: number;
  rows: number;
  front: number;
  back: number;
  ring: { cy: number; rx: number; ry: number };
};

const A: Crowd = { x: X0 - 500, cols: 7, rows: 3, front: 6, back: 5, ring: { cy: 1370, rx: 238, ry: 135 } };
const B: Crowd = { x: X0 - 150, cols: 5, rows: 7, front: 4, back: 3, ring: { cy: 1281, rx: 172, ry: 225 } };

const heapHalf = (c: Crowd) => ((c.cols - 1) * COL_STEP) / 2 + DOT_R;
const heapTop = (c: Crowd) => FLOOR_Y - c.rows * ROW_STEP;
// The air between the two heaps is the system gap, checked rather than eyed.
const AIR = B.x - heapHalf(B) - (A.x + heapHalf(A));
if (AIR < GAP) throw new Error(`heaps too close: ${AIR}px < ${GAP}px`);

const GX = X0 + 430;
const GUY_P = 100;
const GUY_RING_R = 100;

type Dot = { x: number; y: number; r: number; seed: number };
const heapDots = (c: Crowd, base: number): Dot[] =>
  Array.from({ length: c.cols * c.rows }, (_, i) => {
    const seed = base + i;
    const col = i % c.cols;
    const row = Math.floor(i / c.cols);
    return {
      x: c.x + (col - (c.cols - 1) / 2) * COL_STEP + sgn(seed * 3 + 1) * COL_STEP * 0.22,
      y: FLOOR_Y - row * ROW_STEP - ROW_STEP / 2 + sgn(seed * 7 + 5) * ROW_STEP * 0.18,
      r: DOT_R * (0.86 + hash(seed * 11 + 3) * 0.3),
      seed,
    };
  });

type Figure = { x: number; base: number; w: number; o: number; seed: number };
const crowdPeople = (c: Crowd, base: number): Figure[] => {
  const top = heapTop(c);
  const span = (c.cols - 1) * COL_STEP;
  const row = (n: number, y: number, scale: number, o: number, off: number): Figure[] =>
    Array.from({ length: n }, (_, i) => {
      const seed = base + off + i;
      const t = n === 1 ? 0.5 : i / (n - 1);
      return {
        x: c.x + (t - 0.5) * span * 0.92 + sgn(seed * 5 + 2) * 9,
        base: y + sgn(seed * 9 + 4) * 4,
        w: P * scale * (0.94 + hash(seed * 13 + 6) * 0.12),
        o,
        seed,
      };
    });
  // The back row is drawn first, a little smaller and a little dimmer, so the
  // crowd has depth without a second material.
  return [...row(c.back, top - 26, 0.9, 0.82, 100), ...row(c.front, top + 8, 1, 1, 200)];
};

const A_DOTS = heapDots(A, 1000);
const B_DOTS = heapDots(B, 2000);
const A_PEOPLE = crowdPeople(A, 3000);
const B_PEOPLE = crowdPeople(B, 4000);

// ---------------------------------------------------------------------------
// The news
//
// Five lines, one per beat of the drop, each the width of the slot. They
// stack where his heap would have been, and he rises one line at a time.
// ---------------------------------------------------------------------------
const LINE_W = 130;
const LINE_H = 9;
const LINE_STEP = 22;
const N_LINES = 5;
const LINE_FALL = 7;
const LINE_EVERY = 5;
const SLOT_HALF = 74;
const SLOT_H = N_LINES * LINE_STEP + 14;

// The Kalshi mark — drawn to the same rules as a Simple Icons mark, a solid
// monochrome K on a 24-box centred on (12,12), at half opacity because it is
// drawn rather than the brand's own.
const MARK_Y = 800;
const MARK_INK_BOTTOM = MARK_Y + ((21 - 12) / 24) * 150;
const K_D = "M6.2 3V21M6.6 13.6L17.6 3M10 10.4L18.8 21";

export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  backgroundBase: z.string(),
  backgroundSrc: z.string(),
  backgroundBlur: z.number(),
  backgroundDim: z.number(),
  shadowY: z.number(),
  shadowBlur: z.number(),
  shadowOpacity: z.number(),
  markOpacity: z.number(),
  markSize: z.number(),
  // Beat frames lifted from the SRT at 24fps, f0 = 00:00:23,160:
  //   0 "the best"  10 "inflation forecaster"  24 "on kalshi"
  //   36 "over the last few"  48 "years is"  72 "not none of the"
  //   94 "institutions"  105 "or the big"  127 "name hedge"  137 "funds"
  //   143 "it's this"  162 "guy who"  170 "lives in"  176 "kansas never"
  //   201 "traded"  206 "financial"  213 "markets before"  235 "just likes"
  //   246 "to read"  252 "the news"  263 end
  beats: z.object({
    kalshi: z.number().int(),
    years: z.number().int(),
    none: z.number().int(),
    institutions: z.number().int(),
    or: z.number().int(),
    hedge: z.number().int(),
    guy: z.number().int(),
    kansas: z.number().int(),
    traded: z.number().int(),
    markets: z.number().int(),
    likes: z.number().int(),
    news: z.number().int(),
  }),
});

export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  ink: "#FFFFFF",
  accent: "#FFC543",
  backgroundBase: "#2B2118",
  backgroundSrc: "brown-paper-backdrop.jpg",
  backgroundBlur: 16,
  backgroundDim: 0.68,
  shadowY: 2,
  shadowBlur: 9,
  shadowOpacity: 0.22,
  markOpacity: 0.5,
  markSize: 150,
  beats: {
    kalshi: 24,
    years: 36,
    none: 72,
    institutions: 94,
    or: 105,
    hedge: 127,
    guy: 143,
    kansas: 176,
    traded: 201,
    markets: 213,
    likes: 235,
    news: 252,
  },
});

type Beats = Props["beats"];

// ---------------------------------------------------------------------------
// The thread
//
// One endpoint, one authored track. It draws down from the mark to the far
// left of the floor, sweeps the whole floor once for the years, swings onto
// the institutions, holds, swings onto the hedge funds, holds, and swings
// onto him. Every read state below is derived from where this endpoint is,
// so nothing can land early or late relative to the thread that causes it.
// ---------------------------------------------------------------------------
type Key = { f: number; x: number; y: number };
const threadKeys = (b: Beats, guyHead: number): Key[] => [
  { f: b.years + 10, x: X0 - 840, y: FLOOR_Y },
  { f: b.years + 30, x: X0 + 560, y: FLOOR_Y },
  { f: b.none + 4, x: A.x, y: A.ring.cy },
  { f: b.or, x: A.x, y: A.ring.cy },
  { f: b.or + 8, x: B.x, y: B.ring.cy },
  { f: b.guy, x: B.x, y: B.ring.cy },
  { f: b.guy + 9, x: GX, y: guyHead },
];

const track = (frame: number, keys: Key[]) => {
  if (frame <= keys[0].f) return { x: keys[0].x, y: keys[0].y };
  for (let i = 0; i < keys.length - 1; i++) {
    const k0 = keys[i];
    const k1 = keys[i + 1];
    if (frame <= k1.f) {
      const t = ez(GLIDE, (frame - k0.f) / Math.max(1, k1.f - k0.f));
      return { x: k0.x + (k1.x - k0.x) * t, y: k0.y + (k1.y - k0.y) * t };
    }
  }
  const last = keys[keys.length - 1];
  return { x: last.x, y: last.y };
};

// ---------------------------------------------------------------------------
// Camera
//
// Four moves, damped: open on the whole lineup with him at the right edge; a
// slight push left onto the two crowds while they are read; a track right
// onto him for "this guy"; then one long pull-back from "Kansas" that holds
// to the cut with everything in the band above the captions. cy is a
// function of the zoom so the content centre sits at screen y 835.
// ---------------------------------------------------------------------------
const CONTENT_CY = 1110;
const camF = (b: Beats) => [0, b.none + 8, b.institutions + 6, b.hedge + 3, b.guy + 7, b.guy + 22, b.kansas + 40, DURATION];
const CAM_K = [0.8, 0.8, 1.0, 1.0, 1.0, 1.0, 0.74, 0.74];
const CAM_CX = [X0 - 100, X0 - 100, X0 - 330, X0 - 300, X0 + 250, X0 + 250, X0 - 50, X0 - 50];
const cyOf = (k: number) => CONTENT_CY + 125 / k;

const BestForecasterInKansas: React.FC<Props> = ({
  ink,
  accent,
  backgroundBase,
  backgroundSrc,
  backgroundBlur,
  backgroundDim,
  shadowY,
  shadowBlur,
  shadowOpacity,
  markOpacity,
  markSize,
  beats: b,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // -- the news, and how high he stands ------------------------------------
  const lineAt = (i: number) => b.likes + i * LINE_EVERY;
  const landed = Array.from({ length: N_LINES }, (_, i) => frame - (lineAt(i) + LINE_FALL));
  const lift = landed.reduce((acc, age) => acc + (age < 0 ? 0 : LINE_STEP * ez(LAND, age / 8)), 0);
  const guyBase = FLOOR_Y - lift;
  const guyHead = guyBase - GUY_P * 0.56;

  // -- the thread -----------------------------------------------------------
  const keys = React.useMemo(() => threadKeys(b, guyHead), [b, guyHead]);
  const end = track(frame, keys);
  const drawn = ez(RISE, (frame - b.years) / 10);
  const p0 = { x: X0, y: MARK_INK_BOTTOM + 6 };
  const ctrl = { x: (p0.x + end.x) / 2, y: p0.y * 0.4 + end.y * 0.6 };
  const threadD = `M ${p0.x} ${p0.y} Q ${ctrl.x} ${ctrl.y} ${end.x} ${end.y}`;
  const tip = { x: qbez(p0.x, ctrl.x, end.x, drawn), y: qbez(p0.y, ctrl.y, end.y, drawn) };
  const threadOn = frame >= b.years;

  const onA = frame >= keys[2].f && frame < keys[3].f;
  const onB = frame >= keys[4].f && frame < keys[5].f;
  const onGuy = frame >= keys[6].f;
  const readA = ez(RISE, (frame - keys[2].f + 2) / 8);
  const readB = ez(RISE, (frame - keys[4].f + 2) / 8);
  const leaveA = ez(GLIDE, (frame - keys[3].f) / 10);
  const leaveB = ez(GLIDE, (frame - keys[5].f) / 10);
  const found = frame - keys[6].f;
  const readGuy = ez(RISE, (found + 2) / 6);

  // Thread: ink while it is looking, amber once it has found him. The colour
  // steps through ink at full for the click, then settles.
  const threadFlash = found >= 0 && found < FLASH;
  const threadColor = onGuy && !threadFlash ? accent : ink;
  const threadO = threadOn ? (onGuy ? (threadFlash ? 1 : 0.9) : 0.55) : 0;

  // Moving-tip highlight: the heaps read the tip going by, which is the years
  // of trading the thread is sweeping over.
  const tipMoving = threadOn && !onA && !onB && !onGuy && (frame < keys[2].f || (frame > keys[3].f && frame < keys[4].f) || frame > keys[5].f);
  const nearTip = (x: number, y: number) => {
    if (!tipMoving) return 0;
    const d = Math.hypot(x - tip.x, y - tip.y);
    return Math.exp(-(d / 95) * (d / 95));
  };

  // "Financial markets": a read runs left to right through the heaps, because
  // the heaps are the markets everyone but him has traded in.
  const marketWave = (x: number) => {
    const w = frame - (b.markets - 8) - (x - (A.x - 220)) / 40;
    return 0.32 * Math.exp(-(w / 4) * (w / 4));
  };

  // -- rings ---------------------------------------------------------------
  const ringIn = (at: number) => ez(LAND, (frame - at) / 10);
  const ringA = ringIn(b.institutions - 4) * (1 - leaveA);
  const ringB = ringIn(b.hedge - 4) * (1 - leaveB);
  const ringG = ringIn(keys[6].f + 4);

  // -- states ---------------------------------------------------------------
  const unknown = 0.14;
  const crowdO = (read: number, leave: number) => unknown + (0.88 - unknown) * read - (0.88 - 0.3) * leave;
  const heapO = (read: number, leave: number) => unknown + (0.7 - unknown) * read - (0.7 - 0.24) * leave;
  const aO = crowdO(readA, leaveA);
  const bO = crowdO(readB, leaveB);
  const aH = heapO(readA, leaveA);
  const bH = heapO(readB, leaveB);

  const guyFlash = found >= 0 && found < FLASH;
  const guyColor = readGuy > 0 && !guyFlash && found >= FLASH ? accent : ink;
  const guyO = unknown + (1 - unknown) * readGuy;

  // -- the floor and the slot -----------------------------------------------
  const floorO = interpolate(frame, [0, 8, b.traded, b.traded + 10], [0, GROUND_O, GROUND_O, GROUND_LIFT], CLAMP);
  // The floor draws out from the centre at the open, so the first second is
  // a move and not a still.
  const floorDraw = ez(GLIDE, frame / 16);
  const slotDraw = ez(GLIDE, (frame - (b.traded + 2)) / 14);
  const slotSpin = Math.max(0, frame - b.markets);

  // -- the mark ---------------------------------------------------------------
  const markIn = spring({ frame: frame - b.kalshi, fps, config: { damping: 15, stiffness: 180, mass: 0.7 } });

  // -- camera -----------------------------------------------------------------
  const F = React.useMemo(() => camF(b), [b]);
  const { cy, k } = React.useMemo(() => runCamera(frame, F, CAM_K, cyOf), [frame, F]);
  const cx = React.useMemo(() => runCamera(frame, F, CAM_K, CAM_CX).cy, [frame, F]);
  const tx = 540 - cx * k;
  const ty = 960 - cy * k;

  const glyph = (x: number, base: number, w: number, o: number, color: string, sway: number): React.CSSProperties => ({
    position: "absolute",
    left: x - w / 2 + sway,
    top: base - w,
    width: w,
    height: w,
    backgroundColor: color,
    maskImage: `url(${PERSON})`,
    WebkitMaskImage: `url(${PERSON})`,
    maskSize: "100% 100%",
    WebkitMaskSize: "100% 100%",
    maskRepeat: "no-repeat",
    WebkitMaskRepeat: "no-repeat",
    opacity: o,
  });

  const idle = (seed: number) => Math.sin(frame / 23 + hash(seed) * 6.28) * 1.6;

  const crowdDots = (dots: Dot[], o: number) =>
    dots.map((d) => (
      <circle
        key={d.seed}
        cx={d.x}
        cy={d.y}
        r={d.r}
        fill={ink}
        opacity={Math.min(1, o + 0.04 * Math.sin(frame / 31 + hash(d.seed) * 6.28) + 0.4 * nearTip(d.x, d.y) + marketWave(d.x))}
      />
    ));

  const crowdFigs = (people: Figure[], o: number, color: string) =>
    people.map((p) => <div key={p.seed} style={glyph(p.x, p.base, p.w, Math.min(1, o * p.o), color, idle(p.seed))} />);

  const slotTop = FLOOR_Y - SLOT_H;

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <Img
          src={staticFile(backgroundSrc)}
          style={backdropStyle(frame, cy, k, cyOf(CAM_K[0]), backgroundBlur, backgroundDim)}
        />
      </AbsoluteFill>

      {/* Gates every frame on the glyph being loaded. */}
      <Img src={PERSON} style={{ position: "absolute", width: 1, height: 1, opacity: 0 }} />

      <AbsoluteFill
        style={{
          filter: `drop-shadow(0 ${shadowY}px ${shadowBlur}px rgba(0,0,0,${shadowOpacity}))`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: WORLD_W,
            height: WORLD_H,
            transformOrigin: "0 0",
            transform: `translate(${tx}px, ${ty}px) scale(${k})`,
          }}
        >
          <svg
            width={WORLD_W}
            height={WORLD_H}
            viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          >
            <rect x={X0 - 920 * floorDraw} y={FLOOR_Y} width={1840 * floorDraw} height={GROUND_W} fill={ink} opacity={floorO} />

            {/* The heaps: what the crowds stand on. */}
            {crowdDots(A_DOTS, aH)}
            {crowdDots(B_DOTS, bH)}

            {/* The mark. */}
            <g
              transform={`translate(${X0} ${MARK_Y}) scale(${(markIn * markSize) / 24}) translate(-12 -12)`}
              opacity={markOpacity * clamp01((frame - b.kalshi) / 5)}
            >
              <path d={K_D} fill="none" stroke={ink} strokeWidth={4.4} strokeLinecap="butt" strokeLinejoin="miter" />
            </g>

            {/* The thread. */}
            {threadOn ? (
              <>
                <path
                  d={threadD}
                  fill="none"
                  stroke={threadColor}
                  strokeWidth={5.5}
                  strokeLinecap="round"
                  opacity={threadO}
                  pathLength={1000}
                  strokeDasharray={1000}
                  strokeDashoffset={1000 * (1 - drawn)}
                />
                {!onGuy ? <circle cx={tip.x} cy={tip.y} r={9} fill={ink} opacity={0.95} /> : null}
              </>
            ) : null}

            {/* The slot where his heap would be. */}
            {slotDraw > 0 ? (
              <rect
                x={GX - SLOT_HALF}
                y={slotTop}
                width={SLOT_HALF * 2}
                height={SLOT_H}
                rx={8}
                fill="none"
                stroke={ink}
                strokeWidth={3}
                pathLength={1000}
                strokeDasharray={slotDraw >= 1 ? "40 30" : "1000 1000"}
                strokeDashoffset={slotDraw >= 1 ? -(slotSpin * 0.6) : 1000 * (1 - slotDraw)}
                opacity={0.5}
              />
            ) : null}

            {/* The news, falling into the slot. */}
            {Array.from({ length: N_LINES }, (_, i) => {
              const t0 = lineAt(i);
              if (frame < t0) return null;
              const restY = FLOOR_Y - 9 - i * LINE_STEP;
              const fall = ez(Easing.in(Easing.quad), (frame - t0) / LINE_FALL);
              const age = frame - (t0 + LINE_FALL);
              const y = age < 0 ? -320 + (restY + 320) * fall : restY;
              const pop = age < 0 ? 1 : interpolate(age, [0, 4, 9], [1.16, 0.97, 1], CLAMP);
              return (
                <rect
                  key={`n-${i}`}
                  x={GX - (LINE_W * pop) / 2}
                  y={y - LINE_H / 2}
                  width={LINE_W * pop}
                  height={LINE_H}
                  rx={LINE_H / 2}
                  fill={ink}
                  opacity={age < 0 ? 0.9 : 0.92}
                />
              );
            })}

            {/* Rings. */}
            {ringA > 0 ? (
              <ellipse cx={A.x} cy={A.ring.cy} rx={A.ring.rx * (1.35 - 0.35 * ringA)} ry={A.ring.ry * (1.35 - 0.35 * ringA)} fill="none" stroke={ink} strokeWidth={4} opacity={0.9 * clamp01(ringA * 1.5)} />
            ) : null}
            {ringB > 0 ? (
              <ellipse cx={B.x} cy={B.ring.cy} rx={B.ring.rx * (1.35 - 0.35 * ringB)} ry={B.ring.ry * (1.35 - 0.35 * ringB)} fill="none" stroke={ink} strokeWidth={4} opacity={0.9 * clamp01(ringB * 1.5)} />
            ) : null}
            {ringG > 0 ? (
              <circle cx={GX} cy={guyBase - GUY_P * 0.5} r={GUY_RING_R * (1.35 - 0.35 * ringG)} fill="none" stroke={accent} strokeWidth={4} opacity={clamp01(ringG * 1.5)} />
            ) : null}
          </svg>

          {/* The people, drawn over the thread so it lands behind them. */}
          {crowdFigs(A_PEOPLE, aO, ink)}
          {crowdFigs(B_PEOPLE, bO, ink)}
          <div style={glyph(GX, guyBase, GUY_P, guyO, guyColor, idle(77))} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default BestForecasterInKansas;
