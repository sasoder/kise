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
// Dwarkesh, "now a very natural question to ask is whether even a single one
// of these 1,200 agents who participated in the message board attempted to
// alert humans about this ever-escalating conspiracy, which culminated in a
// felony-level crime" — SRT 38.719s -> 51.780s. round(13.061 * 24) = 313.
export const DURATION = 313;

export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  backgroundBase: z.string(),
  backgroundSrc: z.string(),
  backgroundBlur: z.number(),
  backgroundDim: z.number(),
  parallax: z.number(),
  shadowY: z.number(),
  shadowBlur: z.number(),
  shadowOpacity: z.number(),
  dotRadius: z.number(),
  threads: z.number(),
  beats: z.object({
    natural: z.number(), // "natural"
    question: z.number(), // "question"
    toAsk: z.number(), // "to ask is"
    whetherEven: z.number(), // "whether even a"
    singleOne: z.number(), // "single one"
    ofThese: z.number(), // "of these 1"
    agents: z.number(), // "200 agents who"
    participated: z.number(), // "participated"
    message: z.number(), // "in the message"
    board: z.number(), // "board attempted"
    alertHumans: z.number(), // "to alert humans"
    aboutThis: z.number(), // "about this ever"
    escalating: z.number(), // "escalating"
    conspiracy: z.number(), // "conspiracy"
    which: z.number(), // "which"
    culminated: z.number(), // "culminated in a"
    felony: z.number(), // "felony level"
    crime: z.number(), // "crime"
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
  shadowY: 2,
  shadowBlur: 9,
  shadowOpacity: 0.22,
  dotRadius: 7,
  threads: 150,
  beats: {
    natural: 11,
    question: 19,
    toAsk: 26,
    whetherEven: 38,
    singleOne: 57,
    ofThese: 74,
    agents: 87,
    participated: 110,
    message: 124,
    board: 139,
    alertHumans: 165,
    aboutThis: 190,
    escalating: 217,
    conspiracy: 228,
    which: 247,
    culminated: 255,
    felony: 285,
    crime: 301,
  },
});

type P = { x: number; y: number };

const WORLD_W = 1080;
const WORLD_H = 3300;

const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

const hash = (i: number, k: number) => {
  const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return s - Math.floor(s);
};

// ---------------------------------------------------------------------------
// The board is exactly 1,200 agents, 25 across by 48 down. Everything on it is
// a thread: a line one agent posts to another, which draws, holds, and fades.
// The human is one ink dot above the board. The law is an ink line below it,
// and the crime is the point beneath that the whole board pours into.
// ---------------------------------------------------------------------------
const COLS = 30;
const ROWS = 40;
const N = COLS * ROWS;
const FIELD_CX = 540;
const FIELD_W = 860;
const FIELD_TOP = 900;
const FIELD_H = 940;
const STEP_X = FIELD_W / (COLS - 1);
const STEP_Y = FIELD_H / (ROWS - 1);
// The agents are not a grid. Each sits near its cell but scattered off it, at
// its own size, so the board reads as a crowd, the way the spawn cloud did.
const POS = Array.from({ length: N }, (_, i) => {
  const c = i % COLS;
  const r = Math.floor(i / COLS);
  return {
    x: FIELD_CX + (c - (COLS - 1) / 2) * STEP_X + (hash(i, 11) - 0.5) * STEP_X * 0.9,
    y: FIELD_TOP + r * STEP_Y + (hash(i, 12) - 0.5) * STEP_Y * 0.9,
    r: 0.75 + 0.5 * hash(i, 13),
  };
});
const FIELD_Y0 = FIELD_TOP;
const FIELD_Y1 = FIELD_TOP + FIELD_H;
const SINGLE = { c: 15, r: 10 };
const SINGLE_I = SINGLE.r * COLS + SINGLE.c;

const HUMAN: P = { x: 540, y: 740 };
const HUMAN_SIZE = 120;
const HUMAN_R = 44; // for the listening ring
const LAW = { y: 1960, x0: 240, x1: 840 };
const CRIME: P = { x: 540, y: 2040 };

// Camera keys lead the beats by ~10 frames. Everything is framed into the
// band above the caption zone: content centre sits at ~835px of 1920.
const CAM_F = [0, 30, 44, 56, 66, 92, 180, 200, 240, 272, 288, DURATION];
const CAM_CY = [1192, 1192, 1192, 1192, 1300, 1511, 1511, 1560, 1900, 1920, 1520, 1520];
const CAM_K = [2.4, 2.4, 2.7, 2.7, 1.6, 0.92, 0.92, 0.92, 0.95, 0.95, 0.78, 0.78];
const CAM_STIFF = 0.09;
const CAM_DAMP = 0.468;

const camera = (upto: number) => {
  let cy = CAM_CY[0];
  let k = CAM_K[0];
  let vy = 0;
  let vk = 0;
  for (let f = 1; f <= upto; f++) {
    const ty = interpolate(f, CAM_F, CAM_CY, clamp);
    const tk = interpolate(f, CAM_F, CAM_K, clamp);
    vy += (ty - cy) * CAM_STIFF - vy * CAM_DAMP;
    cy += vy;
    vk += (tk - k) * CAM_STIFF - vk * CAM_DAMP;
    k += vk;
  }
  return { cy, k };
};

const BG_OVERSIZE = 1.8;

type Dot = { x: number; y: number; x0: number; y0: number; drained: number; alive: number };

const MessageBoardV2: React.FC<Props> = ({
  ink,
  accent,
  backgroundBase,
  backgroundSrc,
  backgroundBlur,
  backgroundDim,
  parallax,
  shadowY,
  shadowBlur,
  shadowOpacity,
  dotRadius,
  threads,
  beats,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // One escalation curve drives everything: thread count, reach, tempo,
  // brightness and vibration all climb on it from "about this ever" to "which".
  const esc = interpolate(frame, [beats.aboutThis, beats.which], [0, 1], {
    ...clamp,
    easing: Easing.in(Easing.quad),
  });
  // Warped clock for the threads so their tempo rises smoothly with escalation.
  const tw = frame + (frame > beats.aboutThis ? ((frame - beats.aboutThis) ** 2) / 60 : 0);
  const activeThreads = Math.round(
    interpolate(frame, [0, beats.participated, beats.board, beats.aboutThis, beats.which], [
      threads * 0.28,
      threads * 0.4,
      threads * 0.62,
      threads * 0.72,
      threads,
    ], clamp),
  );
  const reach = interpolate(frame, [0, beats.board, beats.which], [4, 6, 14], clamp);
  const jitter = 6 * esc;

  // -- dot positions --------------------------------------------------------
  let arrived = 0;
  const dots: Dot[] = Array.from({ length: N }, (_, i) => {
    const r = Math.floor(i / COLS);
    const x0 = POS[i].x;
    const y0 = POS[i].y;
    const jx = jitter * Math.sin(frame * 0.9 + hash(i, 1) * 6.28);
    const jy = jitter * Math.cos(frame * 0.8 + hash(i, 2) * 6.28);
    // The pour: bottom rows first, accelerating into the crime.
    const d = beats.culminated + (ROWS - 1 - r) * 0.6 + hash(i, 3) * 8;
    const t = interpolate(frame, [d, d + 18], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
    if (t >= 1) arrived += 1;
    // Each agent takes its own curve into the crime, so the pour swirls.
    const swirl = Math.sin(Math.PI * t) * (hash(i, 4) - 0.5) * 160;
    return {
      x: x0 + jx + (CRIME.x - x0 - jx) * t + swirl,
      y: y0 + jy + (CRIME.y - y0 - jy) * t,
      x0,
      y0,
      drained: t,
      alive: interpolate(t, [0.85, 1], [1, 0], clamp),
    };
  });

  // -- threads --------------------------------------------------------------
  const lit = new Float32Array(N);
  const threadEls: { key: number; x1: number; y1: number; x2: number; y2: number; op: number; drawn: number }[] = [];
  for (let j = 0; j < activeThreads; j++) {
    const period = 44 - 12 * hash(j, 4);
    const local = tw + hash(j, 5) * period;
    const cycle = Math.floor(local / period);
    const phase = (local - cycle * period) / period;
    const seed = j * 131 + cycle * 7;
    const a = Math.floor(hash(seed, 6) * N);
    const ac = a % COLS;
    const ar = Math.floor(a / COLS);
    const dc = Math.round((hash(seed, 7) - 0.5) * 2 * reach);
    const dr = Math.round((hash(seed, 8) - 0.5) * 2 * reach);
    const bc = Math.max(0, Math.min(COLS - 1, ac + dc));
    const br = Math.max(0, Math.min(ROWS - 1, ar + dr));
    const b = br * COLS + bc;
    if (b === a) continue;
    const drawn = interpolate(phase, [0, 0.3], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
    const fade = interpolate(phase, [0.55, 1], [1, 0], clamp);
    const da = dots[a];
    const db = dots[b];
    const op = fade * Math.min(da.alive, db.alive) * Math.max(0, 1 - 4 * Math.max(da.drained, db.drained));
    if (op <= 0.02) continue;
    lit[a] = Math.max(lit[a], fade);
    lit[b] = Math.max(lit[b], drawn * fade);
    threadEls.push({
      key: j,
      x1: da.x,
      y1: da.y,
      x2: da.x + (db.x - da.x) * drawn,
      y2: da.y + (db.y - da.y) * drawn,
      op: 0.85 * op,
      drawn,
    });
  }

  // -- the single one -------------------------------------------------------
  const ringDraw = interpolate(frame, [beats.whetherEven, beats.whetherEven + 12], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const ringOut = interpolate(frame, [beats.agents, beats.agents + 10], [1, 0], clamp);
  const singleD = dots[SINGLE_I];

  // -- the scan and the human -----------------------------------------------
  const scanT = interpolate(frame, [beats.board, beats.aboutThis], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.quad),
  });
  const scanY = FIELD_Y0 - 24 + (FIELD_Y1 - FIELD_Y0 + 48) * scanT;
  const scanOpacity = interpolate(
    frame,
    [beats.board - 3, beats.board, beats.aboutThis, beats.aboutThis + 8],
    [0, 0.85, 0.85, 0],
    clamp,
  );
  const humanIn = spring({ frame: frame - beats.alertHumans, fps, config: { damping: 11, stiffness: 150, mass: 0.8 } });
  const humanBreath = 1 + 0.02 * Math.sin(frame / 17);
  const listen = (frame - beats.alertHumans) % 40;
  const listenT = frame >= beats.alertHumans + 4 ? listen / 40 : -1;

  // -- the law and the crime ------------------------------------------------
  const lawDraw = interpolate(frame, [beats.which, beats.culminated + 4], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const felony = spring({ frame: frame - beats.felony, fps, config: { damping: 10, stiffness: 160, mass: 0.8 } });
  const lawW = 10 + 6 * (frame >= beats.felony ? felony : 0);
  const crimeR = 6 + 60 * (arrived / N);
  const crimeHit = spring({ frame: frame - beats.crime, fps, config: { damping: 8, stiffness: 200, mass: 0.8 } });
  const crimeRing = interpolate(frame, [beats.crime, beats.crime + 14], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.quad),
  });

  // -- camera ---------------------------------------------------------------
  const cam = camera(frame);
  const cy = cam.cy + 5 * Math.sin(frame / 19);
  const cx = 540 + 3 * Math.sin(frame / 23);
  const k = cam.k;
  const tx = 540 - cx * k;
  const ty = 960 - cy * k;
  const bgY = -(cy - CAM_CY[0]) * k * parallax - frame * 0.3;
  const bgScale = 1 + (k - 1) * 0.3;

  const baseBright = 0.5 + 0.3 * esc;

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
        style={{ filter: `drop-shadow(0 ${shadowY}px ${shadowBlur}px rgba(0,0,0,${shadowOpacity}))` }}
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
            {/* the empty board left behind */}
            {dots.map((d, i) =>
              d.drained >= 1 ? (
                <circle key={`g${i}`} cx={d.x0} cy={d.y0} r={dotRadius * POS[i].r * 0.8} fill="none" stroke={ink} strokeWidth={2} opacity={0.12} />
              ) : null,
            )}

            {/* threads */}
            {threadEls.map((t) => (
              <g key={t.key}>
                <line x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke={accent} strokeWidth={3} strokeLinecap="round" opacity={t.op} />
                {t.drawn < 1 ? <circle cx={t.x2} cy={t.y2} r={4} fill={ink} opacity={t.op} /> : null}
              </g>
            ))}

            {/* agents */}
            {dots.map((d, i) => {
              if (d.alive <= 0.01) return null;
              const l = lit[i];
              const scanNear = scanOpacity > 0 ? Math.max(0, 1 - Math.abs(scanY - d.y) / 30) : 0;
              const breath = 1 + 0.05 * Math.sin(frame * 0.11 + hash(i, 9) * 6.28);
              const r = dotRadius * POS[i].r * breath * (1 + 0.35 * l + 0.4 * scanNear);
              return (
                <g key={i}>
                  <circle cx={d.x} cy={d.y} r={r} fill={accent} opacity={Math.min(1, baseBright + 0.5 * l) * d.alive} />
                  {scanNear > 0 ? <circle cx={d.x} cy={d.y} r={r} fill={ink} opacity={0.9 * scanNear * d.alive} /> : null}
                </g>
              );
            })}

            {/* the ring on the single one */}
            {ringDraw > 0 && ringOut > 0 ? (
              <circle
                cx={singleD.x}
                cy={singleD.y}
                r={18}
                fill="none"
                stroke={ink}
                strokeWidth={3}
                pathLength={1000}
                strokeDasharray={1000}
                strokeDashoffset={1000 * (1 - ringDraw)}
                transform={`rotate(-90 ${singleD.x} ${singleD.y})`}
                opacity={ringOut}
              />
            ) : null}

            {/* the scan */}
            {scanOpacity > 0 ? (
              <line x1={FIELD_CX - FIELD_W / 2 - 40} y1={scanY} x2={FIELD_CX + FIELD_W / 2 + 40} y2={scanY} stroke={ink} strokeWidth={5} strokeLinecap="round" opacity={scanOpacity} />
            ) : null}

            {/* the human, listening */}
            {frame >= beats.alertHumans && listenT >= 0 && listenT < 0.6 ? (
              <circle cx={HUMAN.x} cy={HUMAN.y} r={HUMAN_R + 10 + 70 * (listenT / 0.6)} fill="none" stroke={ink} strokeWidth={3} opacity={0.55 * (1 - listenT / 0.6)} />
            ) : null}

            {/* the law */}
            {lawDraw > 0 ? (
              <line
                x1={LAW.x0 + (LAW.x1 - LAW.x0) * 0.5 * (1 - lawDraw)}
                y1={LAW.y}
                x2={LAW.x1 - (LAW.x1 - LAW.x0) * 0.5 * (1 - lawDraw)}
                y2={LAW.y}
                stroke={ink}
                strokeWidth={lawW}
                strokeLinecap="round"
              />
            ) : null}

            {/* the crime */}
            {frame >= beats.culminated ? (
              <g>
                {crimeRing > 0 && crimeRing < 1 ? (
                  <circle cx={CRIME.x} cy={CRIME.y} r={crimeR + 140 * crimeRing} fill="none" stroke={accent} strokeWidth={6} opacity={0.9 * (1 - crimeRing)} />
                ) : null}
                <circle cx={CRIME.x} cy={CRIME.y} r={crimeR * (1 + (frame >= beats.crime ? 0.35 * (1 - crimeHit) : 0))} fill={accent} />
              </g>
            ) : null}
          </svg>

          {frame >= beats.alertHumans ? (
            <Img
              src={staticFile("person.png")}
              style={{
                position: "absolute",
                left: HUMAN.x - HUMAN_SIZE / 2,
                top: HUMAN.y - HUMAN_SIZE / 2,
                width: HUMAN_SIZE,
                height: HUMAN_SIZE,
                filter: "brightness(0) invert(1)",
                transform: `scale(${humanIn * humanBreath})`,
                transformOrigin: "center center",
              }}
            />
          ) : null}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default MessageBoardV2;
