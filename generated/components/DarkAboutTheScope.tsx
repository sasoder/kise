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

export const FPS = 24;
// Dwarkesh, "all of this happened while humans remained more or less in the
// dark about the scope of the conspiracy." SRT 13.000s -> 17.899s.
// round(4.899 * 24) = 118 frames, plus a 16 frame tail so the last pull-back
// settles before the hold. Trim the tail if a graphic lands on the next line.
export const DURATION = 134;

export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  backgroundBase: z.string(),
  backgroundSrc: z.string(),
  backgroundBlur: z.number(),
  backgroundDim: z.number(),
  parallax: z.number(),
  humanSrc: z.string(),
  humanSize: z.number(),
  shadowY: z.number(),
  shadowBlur: z.number(),
  shadowOpacity: z.number(),
  dotRadius: z.number(),
  lineWidth: z.number(),
  threadWidth: z.number(),
  liveOpacity: z.number(),
  readOpacity: z.number(),
  darkLevel: z.number(),
  revealLevel: z.number(),
  threadBase: z.number(),
  threadDensity: z.number(),
  beats: z.object({
    rule: z.number(), // the boundary humans stand on draws
    arrive: z.number(), // "happened while" — the human comes down
    humans: z.number(), // "humans remained" — lands
    bracket: z.number(), // the box they looked through is drawn
    scanStart: z.number(), // the sweep that reads the ones inside it
    scanEnd: z.number(),
    more: z.number(), // "more" — first pull-back, and the dark starts falling
    dark: z.number(), // "the dark" — everything unlooked-at is gone
    scope: z.number(), // "scope of the" — the long pull, and the wave out
    conspiracy: z.number(), // "conspiracy" — every thread lights at once
  }),
});

export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  ink: "#FFFFFF",
  accent: "#48D9FF",
  backgroundBase: "#232323",
  backgroundSrc: "grid-background.jpg",
  backgroundBlur: 13,
  backgroundDim: 0.32,
  parallax: 0.15,
  humanSrc: "person.png",
  humanSize: 120,
  shadowY: 2,
  shadowBlur: 9,
  shadowOpacity: 0.22,
  dotRadius: 10,
  lineWidth: 5,
  threadWidth: 3,
  // Three states. What the humans read stays at 0.95 for the rest of the shot;
  // what nobody looked at falls to 0.16 and comes back only to 0.8 — enough to
  // read as a mass at the far end of the pull-back, never enough to be the same
  // state as the handful inside the box.
  liveOpacity: 0.72,
  readOpacity: 0.95,
  darkLevel: 0.16,
  revealLevel: 0.8,
  threadBase: 0.4,
  threadDensity: 0.5,
  beats: {
    rule: 6,
    arrive: 12,
    humans: 26,
    bracket: 28,
    scanStart: 36,
    scanEnd: 50,
    more: 48,
    dark: 70,
    scope: 84,
    conspiracy: 101,
  },
});

type P = { x: number; y: number };

const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

const hash = (i: number, k: number) => {
  const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return s - Math.floor(s);
};

const WORLD_W = 1080;
const WORLD_H = 3400;
const BG_OVERSIZE = 1.8;

// ---------------------------------------------------------------------------
// The field
//
// One crowd, generated off an infinite jittered lattice and then cut to an
// ellipse with a ragged edge, so it has no straight sides and no lattice to
// read. Nothing about it is authored per-agent: the whole population is a pure
// function of its cell, which is what lets the camera pull back through it
// without anything popping or drifting.
//
// It is sized so the shot can spend its first two seconds on about thirty of
// them and still finish on three hundred, because "scope" has to be a ratio you
// can see rather than a claim.
// ---------------------------------------------------------------------------
const STEP = 88;
const BLOB = { cx: 540, cy: 1980, w: 2200, h: 2100 };
const I_MIN = Math.floor((BLOB.cx - BLOB.w / 2) / STEP) - 1;
const I_MAX = Math.ceil((BLOB.cx + BLOB.w / 2) / STEP) + 1;
const J_MIN = Math.floor((BLOB.cy - BLOB.h / 2) / STEP) - 1;
const J_MAX = Math.ceil((BLOB.cy + BLOB.h / 2) / STEP) + 1;

// The boundary the humans are on, and the box they drew on the other side of it.
const RULE_Y = 900;
const RULE_HALF = 1500;
const BR = { x0: 400, x1: 680, y0: 1050, y1: 1250 };
const BR_C = { x: (BR.x0 + BR.x1) / 2, y: (BR.y0 + BR.y1) / 2 };
const HUMAN_FOOT = RULE_Y + 10;

const seedOf = (i: number, j: number) => i * 73 + j * 31;

const agentAt = (i: number, j: number) => {
  const s = seedOf(i, j);
  return {
    s,
    x: i * STEP + (hash(s, 1) - 0.5) * STEP * 1.0,
    y: j * STEP + (hash(s, 2) - 0.5) * STEP * 1.0,
    rr: 0.75 + 0.5 * hash(s, 3),
  };
};

const inField = (p: { x: number; y: number; s: number }) => {
  if (p.y < 960) return false; // never above the boundary the humans stand on
  const dx = (p.x - BLOB.cx) / (BLOB.w / 2);
  const dy = (p.y - BLOB.cy) / (BLOB.h / 2);
  return dx * dx + dy * dy <= 1 + (hash(p.s, 4) - 0.5) * 0.34;
};

const inBracket = (p: P) => p.x > BR.x0 && p.x < BR.x1 && p.y > BR.y0 && p.y < BR.y1;

// ---------------------------------------------------------------------------
// Camera
//
// Four stages, and the last two are one accelerating move rather than two
// stops, because scope that keeps outrunning you reads bigger than scope you
// can measure on the first look. Tight on the group, out once when the dark
// falls to show how much was never looked at, then the long pull.
// ---------------------------------------------------------------------------
const CAM_F = [0, 48, 62, 84, 100, 112, DURATION];
const CAM_CY = [1072, 1072, 1269, 1269, 1560, 2223, 2223];
const CAM_K = [2.4, 2.4, 1.05, 1.05, 0.62, 0.4, 0.4];

const CAM_STIFF = 0.13;
const CAM_DAMP = 0.56;

const camera = (upto: number) => {
  let cy = CAM_CY[0];
  let k = CAM_K[0];
  let vcy = 0;
  let vk = 0;
  for (let f = 1; f <= upto; f++) {
    const tcy = interpolate(f, CAM_F, CAM_CY, clamp);
    const tk = interpolate(f, CAM_F, CAM_K, clamp);
    vcy += (tcy - cy) * CAM_STIFF - vcy * CAM_DAMP;
    cy += vcy;
    vk += (tk - k) * CAM_STIFF - vk * CAM_DAMP;
    k += vk;
  }
  return { cy, k };
};

const DarkAboutTheScope: React.FC<Props> = ({
  ink,
  accent,
  backgroundBase,
  backgroundSrc,
  backgroundBlur,
  backgroundDim,
  parallax,
  humanSrc,
  humanSize,
  shadowY,
  shadowBlur,
  shadowOpacity,
  dotRadius,
  lineWidth,
  threadWidth,
  liveOpacity,
  readOpacity,
  darkLevel,
  revealLevel,
  threadBase,
  threadDensity,
  beats,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { cy, k } = camera(frame);
  const tx = 540 - 540 * k;
  const ty = 960 - cy * k;
  const bgY = -(cy - CAM_CY[0]) * k * parallax - frame * 0.25;
  const bgScale = 1 + (k - 1) * 0.3;

  // The sweep that reads the agents inside the box. A dot's read state comes off
  // the bar's own position, so the two can never drift apart when retimed.
  const scanY = interpolate(
    frame,
    [beats.scanStart, beats.scanEnd],
    [BR.y0 - 24, BR.y1 + 24],
    clamp,
  );
  const scanFade = interpolate(
    frame,
    [beats.scanStart - 3, beats.scanStart, beats.scanEnd, beats.scanEnd + 7],
    [0, 1, 1, 0],
    clamp,
  );

  const dkT = interpolate(frame, [beats.more + 4, beats.dark], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.quad),
  });
  const waveR = interpolate(frame, [beats.scope, beats.scope + 34], [0, 2400], {
    ...clamp,
    easing: Easing.out(Easing.quad),
  });
  const surge = interpolate(frame, [beats.conspiracy, beats.conspiracy + 12], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });

  // One visibility function for every agent and every thread, so the field can
  // never fall out of step with itself.
  const vis = (x: number, y: number) => {
    const rv = interpolate(waveR - Math.hypot(x - BR_C.x, y - BR_C.y), [0, 170], [0, 1], clamp);
    let v = 1 + (darkLevel - 1) * dkT;
    v += (revealLevel - v) * rv;
    return v;
  };

  // Only the cells the camera can actually see are built, so the pull-back can
  // open onto hundreds of agents without ever holding more than it needs.
  const halfW = 540 / k;
  const halfH = 960 / k;
  const i0 = Math.max(I_MIN, Math.floor((540 - halfW) / STEP) - 1);
  const i1 = Math.min(I_MAX, Math.ceil((540 + halfW) / STEP) + 1);
  const j0 = Math.max(J_MIN, Math.floor((cy - halfH) / STEP) - 1);
  const j1 = Math.min(J_MAX, Math.ceil((cy + halfH) / STEP) + 1);

  type Agent = { s: number; x: number; y: number; r: number; op: number };
  const agents: Agent[] = [];
  const threads: { key: string; a: P; b: P; op: number }[] = [];

  for (let i = i0; i <= i1; i++) {
    for (let j = j0; j <= j1; j++) {
      const p = agentAt(i, j);
      if (!inField(p)) continue;

      const sampled = inBracket(p);
      const read = sampled ? interpolate(scanY - p.y, [0, 5], [0, 1], clamp) : 0;
      const flash = sampled ? interpolate(scanY - p.y, [0, 5, 34], [0, 1, 0], clamp) : 0;
      const base = liveOpacity + (readOpacity - liveOpacity) * read;
      const op = base * (sampled ? 1 : vis(p.x, p.y));
      const breath = 1 + 0.05 * Math.sin(frame * 0.11 + hash(p.s, 6) * 6.28);

      agents.push({
        s: p.s,
        x: p.x,
        y: p.y,
        r: dotRadius * p.rr * breath * (1 + 0.3 * flash),
        op,
      });

      // Edges run right and down off each cell, so every thread is owned once.
      for (const [di, dj, kk] of [
        [1, 0, 7],
        [0, 1, 8],
      ] as const) {
        if (hash(p.s, kk) > threadDensity) continue;
        const q = agentAt(i + di, j + dj);
        if (!inField(q)) continue;
        const mx = (p.x + q.x) / 2;
        const my = (p.y + q.y) / 2;
        // Each thread keeps its own traffic cycle, so the board is never still
        // and never all on at once — until the last beat, when it is.
        const cyc = (frame * 0.011 + hash(p.s, kk + 4)) % 1;
        const blink = interpolate(cyc, [0, 0.07, 0.42, 0.52], [0, 1, 1, 0], clamp);
        const both = inBracket(p) && inBracket(q);
        const level = both ? 1 : vis(mx, my);
        const op2 = threadBase * Math.max(blink, surge) * level;
        if (op2 < 0.008) continue;
        threads.push({ key: `${i}_${j}_${kk}`, a: p, b: q, op: op2 });
      }
    }
  }

  const ruleDraw = interpolate(frame, [beats.rule, beats.rule + 12], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const land = spring({
    frame: frame - beats.arrive,
    fps,
    config: { damping: 13, stiffness: 118, mass: 0.9 },
  });
  const humanFoot = interpolate(land, [0, 1], [HUMAN_FOOT - 380, HUMAN_FOOT]);
  const humanIn = interpolate(frame, [beats.arrive, beats.arrive + 7], [0, 1], clamp);

  const brDraw = interpolate(frame, [beats.bracket, beats.bracket + 12], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  // The box draws out from the middle of its own top edge in both directions at
  // once. Running a single dash clockwise from a corner leaves it an L for six
  // frames, which reads as a broken shape rather than a frame being placed.
  const brHalf = BR.x1 - BR.x0 + (BR.y1 - BR.y0);
  const brCx = (BR.x0 + BR.x1) / 2;
  const tether = interpolate(frame, [beats.bracket + 2, beats.bracket + 10], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
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
            filter: `blur(${backgroundBlur}px) brightness(${backgroundDim})`,
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
          }}
        >
          <Img
            src={staticFile(humanSrc)}
            style={{
              position: "absolute",
              left: 540 - humanSize / 2,
              top: humanFoot - humanSize,
              width: humanSize,
              height: humanSize,
              filter: "brightness(0) invert(1)",
              opacity: humanIn,
            }}
          />

          <svg
            width={WORLD_W}
            height={WORLD_H}
            viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          >
            <line
              x1={540 - RULE_HALF * ruleDraw}
              y1={RULE_Y}
              x2={540 + RULE_HALF * ruleDraw}
              y2={RULE_Y}
              stroke={ink}
              strokeWidth={lineWidth}
              strokeLinecap="round"
              opacity={0.45 * ruleDraw}
            />

            {threads.map((t) => (
              <line
                key={t.key}
                x1={t.a.x}
                y1={t.a.y}
                x2={t.b.x}
                y2={t.b.y}
                stroke={accent}
                strokeWidth={threadWidth}
                strokeLinecap="round"
                opacity={t.op}
              />
            ))}

            {agents.map((a) => (
              <circle key={a.s} cx={a.x} cy={a.y} r={a.r} fill={accent} opacity={a.op} />
            ))}

            {tether > 0 ? (
              <line
                x1={540}
                y1={HUMAN_FOOT}
                x2={540}
                y2={HUMAN_FOOT + (BR.y0 - HUMAN_FOOT) * tether}
                stroke={ink}
                strokeWidth={lineWidth}
                strokeLinecap="round"
                opacity={0.4}
              />
            ) : null}

            {brDraw > 0
              ? [BR.x0, BR.x1].map((edge) => (
                  <path
                    key={`br${edge}`}
                    d={`M ${brCx} ${BR.y0} L ${edge} ${BR.y0} L ${edge} ${BR.y1} L ${brCx} ${BR.y1}`}
                    fill="none"
                    stroke={ink}
                    strokeWidth={lineWidth}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    strokeDasharray={`${(brDraw * brHalf).toFixed(1)} ${brHalf.toFixed(1)}`}
                    opacity={0.8}
                  />
                ))
              : null}

            {scanFade > 0.01 ? (
              <g opacity={scanFade}>
                <line
                  x1={BR.x0 + 10}
                  y1={scanY}
                  x2={BR.x1 - 10}
                  y2={scanY}
                  stroke={ink}
                  strokeWidth={lineWidth}
                  strokeLinecap="round"
                />
                <circle cx={BR.x0 + 10} cy={scanY} r={7} fill={ink} />
                <circle cx={BR.x1 - 10} cy={scanY} r={7} fill={ink} />
              </g>
            ) : null}
          </svg>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default DarkAboutTheScope;
