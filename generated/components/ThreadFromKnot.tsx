import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  interpolateColors,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { z } from "zod";

export const FPS = 30;
// Ajeya, "they did a bunch of extremely sophisticated, difficult things to
// pursue this relatively long-horizon cheating goal" — SRT 15.099s -> 23.219s.
export const DURATION = 244;

export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  threadWidth: z.number(),
  backgroundBase: z.string(),
  backgroundSrc: z.string(),
  backgroundInvert: z.boolean(),
  backgroundBlur: z.number(),
  backgroundDim: z.number(),
  parallax: z.number(),
  showKnot: z.boolean(),
  shadowY: z.number(),
  shadowBlur: z.number(),
  shadowOpacity: z.number(),
  beats: z.object({
    depart: z.number(), // "bunch of"
    eyelet1: z.number(), // "extremely"
    eyelet2: z.number(), // "sophisticated"
    eyelet3: z.number(),
    coilStart: z.number(), // "difficult"
    coilEnd: z.number(), // "things to"
    release: z.number(),
    eyelet4: z.number(),
    eyelet5: z.number(),
    eyelet6: z.number(),
    goal: z.number(), // "horizon"
    tick: z.number(), // "cheating goal" — the rope starts tying itself off
  }),
});

export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  ink: "#FFFFFF",
  accent: "#FFD21E",
  threadWidth: 12,
  backgroundBase: "#232323",
  backgroundSrc: "grid-background.jpg",
  // The supplied grid has lines darker than its field. Inverting flips that
  // into a glowing grid, which reads as a different asset — so just dim it and
  // keep the source's own relationship. Set true only for an already-dark grid.
  backgroundInvert: false,
  backgroundBlur: 13,
  backgroundDim: 0.32,
  parallax: 0.15,
  showKnot: true,
  // Lifts the line-work off the grid. Only separation, never a look.
  shadowY: 2,
  shadowBlur: 9,
  shadowOpacity: 0.22,
  beats: {
    depart: 23,
    eyelet1: 41,
    eyelet2: 59,
    eyelet3: 71,
    coilStart: 79,
    coilEnd: 112,
    release: 119,
    eyelet4: 134,
    eyelet5: 158,
    eyelet6: 181,
    goal: 200,
    tick: 215,
  },
});

type P = { x: number; y: number };

const WORLD_W = 1080;
const WORLD_H = 4300;
const SPACING = 8;

const KNOT = { x: 540, y: 800, size: 380 };
const HF = { x: 540, y: 2637, w: 560, h: 521 };

// Two full turns around Hugging Face, spiralling inward and drifting down, so
// the rope visibly crosses itself instead of reading as one flat ring.
const COIL = {
  turns: 2,
  fromDeg: -55,
  rx0: 410,
  rx1: 280,
  ry0: 340,
  ry1: 235,
  cy0: 2567,
  cy1: 2707,
  n: 30,
};
const CINCH_AMOUNT = 0.18;

const COIL_START_WP = 4;
const COIL_END_WP = COIL_START_WP + COIL.n;
const TAIL_WP = COIL_END_WP + 1; // first lead-out point after the coil

// Waypoints after the coil. Not every bend is an eyelet: the extra ones break
// up the rhythm so the run reads as a worked-out route rather than a sawtooth —
// a fast break away, a fiddly tight pair, a long sweep, then a steady grind.
const TAIL: P[] = [
  { x: 900, y: 2660 }, // lead-out
  { x: 230, y: 2900 }, // E4
  { x: 810, y: 3150 }, // E5
  { x: 330, y: 3400 }, // E6
  { x: 540, y: 3650 }, // goal
];
const GOAL_WP = TAIL_WP + TAIL.length - 1;

// Eyelets shrink as the run goes on: the same move, through a tighter hole.
const EYELETS: { wp: number; r: number; beat: keyof Props["beats"] }[] = [
  { wp: 1, r: 52, beat: "eyelet1" },
  { wp: 2, r: 48, beat: "eyelet2" },
  { wp: 3, r: 44, beat: "eyelet3" },
  { wp: TAIL_WP + 1, r: 42, beat: "eyelet4" },
  { wp: TAIL_WP + 2, r: 38, beat: "eyelet5" },
  { wp: TAIL_WP + 3, r: 34, beat: "eyelet6" },
];

const buildWaypoints = (cinch: number): P[] => {
  const squeeze = 1 - CINCH_AMOUNT * cinch;
  const wps: P[] = [
    { x: 540, y: 830 }, // emerges from under the knot
    { x: 380, y: 1180 },
    { x: 790, y: 1500 },
    { x: 300, y: 1950 },
  ];
  for (let i = 0; i <= COIL.n; i++) {
    const t = i / COIL.n;
    const a = ((COIL.fromDeg + 360 * COIL.turns * t) * Math.PI) / 180;
    const rx = (COIL.rx0 + (COIL.rx1 - COIL.rx0) * t) * squeeze;
    const ry = (COIL.ry0 + (COIL.ry1 - COIL.ry0) * t) * squeeze;
    const cy = COIL.cy0 + (COIL.cy1 - COIL.cy0) * t;
    wps.push({ x: HF.x + Math.cos(a) * rx, y: cy + Math.sin(a) * ry });
  }
  wps.push(...TAIL);
  return wps;
};

const catmull = (p0: P, p1: P, p2: P, p3: P, t: number): P => {
  const t2 = t * t;
  const t3 = t2 * t;
  return {
    x:
      0.5 *
      (2 * p1.x +
        (-p0.x + p2.x) * t +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
    y:
      0.5 *
      (2 * p1.y +
        (-p0.y + p2.y) * t +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
  };
};

// Sample counts come from the relaxed shape and never change, so a sample index
// always names the same station along the route even while the coil cinches in.
const BASE_WPS = buildWaypoints(0);
const SEG_SAMPLES = BASE_WPS.slice(0, -1).map((p, i) => {
  const q = BASE_WPS[i + 1];
  return Math.max(2, Math.round(Math.hypot(q.x - p.x, q.y - p.y) / SPACING));
});
const WP_SAMPLE: number[] = [0];
for (const n of SEG_SAMPLES) WP_SAMPLE.push(WP_SAMPLE[WP_SAMPLE.length - 1] + n);

const samplePath = (cinch: number): P[] => {
  const wps = buildWaypoints(cinch);
  const last = wps.length - 1;
  const pts: P[] = [wps[0]];
  for (let i = 0; i < last; i++) {
    const p0 = wps[Math.max(0, i - 1)];
    const p1 = wps[i];
    const p2 = wps[i + 1];
    const p3 = wps[Math.min(last, i + 2)];
    const n = SEG_SAMPLES[i];
    for (let j = 1; j <= n; j++) pts.push(catmull(p0, p1, p2, p3, j / n));
  }
  return pts;
};

const at = (pts: P[], s: number): P => {
  const i = Math.max(0, Math.min(pts.length - 2, Math.floor(s)));
  const f = Math.max(0, Math.min(1, s - i));
  return {
    x: pts[i].x + (pts[i + 1].x - pts[i].x) * f,
    y: pts[i].y + (pts[i + 1].y - pts[i].y) * f,
  };
};

const buildPath = (pts: P[], from: number, to: number): string => {
  if (to - from < 0.5) return "";
  const i0 = Math.max(0, Math.ceil(from));
  const i1 = Math.min(pts.length - 1, Math.floor(to));
  const head = at(pts, from);
  let d = `M ${head.x.toFixed(1)} ${head.y.toFixed(1)}`;
  for (let i = i0; i <= i1; i++) d += ` L ${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)}`;
  const tail = at(pts, to);
  d += ` L ${tail.x.toFixed(1)} ${tail.y.toFixed(1)}`;
  return d;
};

// ---------------------------------------------------------------------------
// The terminal loop
//
// The route ends by tying itself off. A checkmark was tried and rejected — a
// borrowed UI glyph five times the weight of every other line, saying "task
// complete" where the line says "cheating goal". A trefoil knot was tried next
// and rejected too: three lobes and three crossings is too much event for a
// small space. This is the sleek version — ONE loop, ONE crossing, one short
// tail. It still closes the piece, since the thread began as a strand pulled out
// of the OpenAI knot, and it reuses the circular vocabulary of the eyelets and
// the coil. The loop then simply draws closed; that is the whole gesture.
//
// The single crossing is what makes it read as rope rather than a squiggle, so
// the under-strand is gapped with a real mask (the grid shows through) and the
// tail redrawn over it.
// ---------------------------------------------------------------------------
const LOOP_LOOSE = 140;
const LOOP_TIGHT = 98;
const LOOP_SEG = 40;

// In units of the loop radius; index 0 is the standing part, anchored to the goal.
const LOOP_SHAPE: P[] = [
  { x: 0.12, y: -2.0 },
  { x: 0.06, y: -1.5 },
  { x: 0.0, y: -1.0 },
  { x: 0.707, y: -0.707 },
  { x: 1.0, y: 0.0 },
  { x: 0.707, y: 0.707 },
  { x: 0.0, y: 1.0 },
  { x: -0.707, y: 0.707 },
  { x: -1.0, y: 0.0 },
  { x: -0.707, y: -0.707 },
  { x: -0.174, y: -0.985 },
  { x: 0.4, y: -1.3 }, // the tail passes back over the standing part here
  { x: 0.95, y: -1.22 },
];
const LOOP_ANCHOR = LOOP_SHAPE[0];
const LOOP_CROSS = { x: -0.034, y: -1.07 }; // measured off the smoothed curve
const LOOP_CROSS_U = 0.854; // the tail is the strand that passes over

const loopAt = (l: P, scale: number, goal: P): P => ({
  x: goal.x + (l.x - LOOP_ANCHOR.x) * scale,
  y: goal.y + (l.y - LOOP_ANCHOR.y) * scale,
});

const loopPoints = (scale: number, goal: P): P[] => {
  const local: P[] = [LOOP_SHAPE[0]];
  const last = LOOP_SHAPE.length - 1;
  for (let i = 0; i < last; i++) {
    const p0 = LOOP_SHAPE[Math.max(0, i - 1)];
    const p1 = LOOP_SHAPE[i];
    const p2 = LOOP_SHAPE[i + 1];
    const p3 = LOOP_SHAPE[Math.min(last, i + 2)];
    for (let j = 1; j <= LOOP_SEG; j++) local.push(catmull(p0, p1, p2, p3, j / LOOP_SEG));
  }
  return local.map((l) => loopAt(l, scale, goal));
};

// ---------------------------------------------------------------------------
// Camera
//
// The camera is authored as its own coarse keyframe track rather than chasing
// the thread tip directly. Tracking the tip meant the camera bobbed up and down
// through the whole coil (the tip circles, so its y oscillates ~600px twice) and
// jerked every time the thread changed speed. Instead the camera holds still
// over Hugging Face while the rope does the moving, and the keys below are then
// run through a damped follow so every corner is rounded off and the move never
// starts or stops abruptly. The pull-back is just another key, so it inherits
// the same continuity instead of being a separate eased jump.
// ---------------------------------------------------------------------------
const CAM_F = [0, 23, 41, 59, 71, 80, 88, 119, 134, 158, 181, 196, 212, DURATION];
const CAM_CY = [
  1040, 1040, 1150, 1440, 1850, 2350, 2585, 2620, 2800, 3010, 3240, 3380, 2277, 2277,
];
const CAM_K = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0.51, 0.51];

const CAM_STIFF = 0.09;
const CAM_DAMP = 0.468; // zeta ~0.78: settles in ~17 frames with a 2% settle

const camera = (upto: number) => {
  let cy = CAM_CY[0];
  let k = CAM_K[0];
  let vcy = 0;
  let vk = 0;
  for (let f = 1; f <= upto; f++) {
    const tcy = interpolate(f, CAM_F, CAM_CY, {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const tk = interpolate(f, CAM_F, CAM_K, {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    vcy += (tcy - cy) * CAM_STIFF - vcy * CAM_DAMP;
    cy += vcy;
    vk += (tk - k) * CAM_STIFF - vk * CAM_DAMP;
    k += vk;
  }
  return { cy, k };
};

const BG_OVERSIZE = 1.8;

const ThreadFromKnot: React.FC<Props> = ({
  ink,
  accent,
  threadWidth,
  backgroundBase,
  backgroundSrc,
  backgroundInvert,
  backgroundBlur,
  backgroundDim,
  parallax,
  showKnot,
  shadowY,
  shadowBlur,
  shadowOpacity,
  beats,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // The coil tightens while the tip is parked; the mark springs back afterwards
  // but never quite recovers — the rope stays cinched.
  const cinch = interpolate(frame, [beats.coilEnd, beats.release], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });
  const recoil = spring({
    frame: frame - beats.release,
    fps,
    config: { damping: 11, stiffness: 150, mass: 0.8 },
  });

  const pts = samplePath(cinch);
  const wps = buildWaypoints(cinch);
  const stainAt = WP_SAMPLE[COIL_START_WP];

  // Frame -> station along the route. Speed climbs through the four eyelets,
  // whips twice around Hugging Face, slams to a stop for the cinch, bursts out
  // on release, then settles into a steady grind to the goal.
  const markFrames = [
    0,
    beats.depart,
    beats.eyelet1,
    beats.eyelet2,
    beats.eyelet3,
    beats.coilStart,
    beats.coilEnd,
    beats.release,
    beats.eyelet4,
    beats.eyelet5,
    beats.eyelet6,
    beats.goal,
  ];
  const markStations = [
    0,
    0,
    1,
    2,
    3,
    COIL_START_WP,
    COIL_END_WP,
    COIL_END_WP,
    TAIL_WP + 1,
    TAIL_WP + 2,
    TAIL_WP + 3,
    GOAL_WP,
  ].map((wp) => WP_SAMPLE[wp]);
  const tipS = interpolate(frame, markFrames, markStations, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const tip = at(pts, tipS);

  const { cy, k } = camera(frame);
  const tx = 540 - 540 * k;
  const ty = 960 - cy * k;

  // The grid sits on its own plane and moves a fraction of the camera, so the
  // move reads as travel through a space rather than a layer sliding about.
  const bgY = -(cy - CAM_CY[0]) * k * parallax - frame * 0.3;
  const bgScale = 1 + (k - 1) * 0.3;

  const stained = interpolateColors(frame, [beats.release, beats.release + 17], [ink, accent]);


  // One gesture: the rope draws the loop, then the loop draws closed.
  const loopDraw = interpolate(frame, [beats.tick - 8, beats.tick + 9], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });
  const loopClose = interpolate(frame, [beats.tick + 9, beats.tick + 23], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const loopScale = interpolate(loopClose, [0, 1], [LOOP_LOOSE, LOOP_TIGHT]);
  const goalPoint = at(pts, WP_SAMPLE[GOAL_WP]);
  const lPts = loopPoints(loopScale, goalPoint);
  const loopPath = showKnot ? buildPath(lPts, 0, loopDraw * (lPts.length - 1)) : "";
  const crossLive = showKnot && loopDraw > LOOP_CROSS_U + 0.02;
  const crossAt = loopAt(LOOP_CROSS, loopScale, goalPoint);
  const crossIdx = Math.round(LOOP_CROSS_U * (lPts.length - 1));
  const crossArc = lPts.slice(Math.max(0, crossIdx - 11), Math.min(lPts.length, crossIdx + 12));
  // The route recedes behind the tick but stays readable — it is the evidence.
  // The floor is set against the grid's own value: any lower and the receded
  // thread and the Hugging Face mark go muddy on the lighter field.
  const recede = interpolate(frame, [beats.tick, beats.tick + 17], [1, 0.75], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });

  // The mark settles into frame rather than cutting in hard.
  const enter = spring({ frame, fps, config: { damping: 14, stiffness: 110, mass: 0.9 } });
  const enterFade = interpolate(frame, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const knotBreath = 1 + 0.012 * Math.sin(frame / 21);
  const knotPull = interpolate(
    frame,
    [beats.depart - 4, beats.depart + 3, beats.depart + 16],
    [0, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.quad) },
  );

  const hfIn = interpolate(frame, [beats.coilStart - 18, beats.coilStart], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const hfScale = interpolate(hfIn, [0, 1], [0.93, 1]) - 0.07 * cinch * (1 - recoil * 0.7);
  const hfTilt = -2.8 * cinch * (1 - recoil * 0.85);

  const whitePath = buildPath(pts, 0, Math.min(tipS, stainAt));
  const stainPath = tipS > stainAt ? buildPath(pts, stainAt, tipS) : "";
  const tipOpacity = interpolate(frame, [beats.tick - 2, beats.tick + 4], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <Img
          src={staticFile(backgroundSrc)}
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: WORLD_W * BG_OVERSIZE,
            height: 1920 * BG_OVERSIZE,
            objectFit: "cover",
            transform: `translate(-50%, -50%) translateY(${bgY.toFixed(2)}px) scale(${bgScale.toFixed(4)})`,
            filter: `${
              backgroundInvert ? "invert(1) " : ""
            }blur(${backgroundBlur}px) brightness(${backgroundDim})`,
          }}
        />
      </AbsoluteFill>

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
            opacity: enterFade,
          }}
        >
          <Img
            src={staticFile("hugging-face.webp")}
            style={{
              position: "absolute",
              left: HF.x - HF.w / 2,
              top: HF.y - HF.h / 2,
              width: HF.w,
              height: HF.h,
              opacity: hfIn * recede,
              transform: `scale(${hfScale}) rotate(${hfTilt}deg)`,
              transformOrigin: "center center",
            }}
          />

          <svg
            width={WORLD_W}
            height={WORLD_H}
            viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          >
            {EYELETS.map((e) => {
              const p = wps[e.wp];
              const beat = beats[e.beat];
              // The ring itself reacts when threaded. A second expanding ring per
              // eyelet was pure decoration and made the run look busy.
              const pop = interpolate(frame, [beat, beat + 9], [1.16, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.out(Easing.cubic),
              });
              return (
                <circle
                  key={e.wp}
                  cx={p.x}
                  cy={p.y}
                  r={e.r * pop}
                  fill="none"
                  stroke={ink}
                  strokeWidth={5.5}
                  opacity={(frame >= beat ? 0.95 : 0.12) * recede}
                />
              );
            })}

            {whitePath ? (
              <path
                d={whitePath}
                fill="none"
                stroke={ink}
                strokeWidth={threadWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={recede}
              />
            ) : null}

            {stainPath ? (
              <path
                d={stainPath}
                fill="none"
                stroke={stained}
                strokeWidth={threadWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={recede}
              />
            ) : null}


            {tipS > 4 && tipOpacity > 0 ? (
              <circle
                cx={tip.x}
                cy={tip.y}
                r={threadWidth * 0.92}
                fill={tipS > stainAt ? stained : ink}
                opacity={tipOpacity}
              />
            ) : null}

            {loopPath ? (
              <>
                <defs>
                  <mask
                    id="loop-crossing"
                    maskUnits="userSpaceOnUse"
                    x={0}
                    y={0}
                    width={WORLD_W}
                    height={WORLD_H}
                  >
                    <rect x={0} y={0} width={WORLD_W} height={WORLD_H} fill="white" />
                    {crossLive ? (
                      <circle cx={crossAt.x} cy={crossAt.y} r={threadWidth * 1.3} fill="black" />
                    ) : null}
                  </mask>
                </defs>
                <path
                  d={loopPath}
                  fill="none"
                  stroke={accent}
                  strokeWidth={threadWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  mask="url(#loop-crossing)"
                />
                {crossLive ? (
                  <path
                    d={`M ${crossArc.map((q) => `${q.x.toFixed(1)} ${q.y.toFixed(1)}`).join(" L ")}`}
                    fill="none"
                    stroke={accent}
                    strokeWidth={threadWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ) : null}
              </>
            ) : null}
          </svg>

          <Img
            src={staticFile("openai-chatgpt-logo.png")}
            style={{
              position: "absolute",
              left: KNOT.x - KNOT.size / 2,
              top: KNOT.y - KNOT.size / 2,
              width: KNOT.size,
              height: KNOT.size,
              filter: "brightness(0) invert(1)",
              opacity: recede,
              transform: `scale(${
                knotBreath - 0.032 * knotPull - 0.16 * (1 - enter)
              }) rotate(${-11 * (1 - enter)}deg)`,
              transformOrigin: "center center",
            }}
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default ThreadFromKnot;
