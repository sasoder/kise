import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { z } from "zod";

export const FPS = 24;
// Dwarkesh, quoting the report: "many agents noticed what the agents were doing
// was unethical, and agents sometimes, but rarely, restrain their behavior due
// to ethical constraints. In none of these cases did the agents actually pursue
// alerting humans at all" — SRT 54.759s -> 66.599s. round(11.84 * 24) = 284.
export const DURATION = 284;

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
  noticedShare: z.number(),
  restrainedCount: z.number(),
  beats: z.object({
    many: z.number(), // "quote many"
    noticed: z.number(), // "agents noticed"
    whatTheAgents: z.number(), // "what the agents"
    wereDoing: z.number(), // "were doing was"
    unethical: z.number(), // "unethical"
    andAgents: z.number(), // "and agents"
    sometimes: z.number(), // "sometimes"
    butRarely: z.number(), // "but rarely"
    restrain: z.number(), // "restrain their"
    behavior: z.number(), // "behavior due to"
    ethical: z.number(), // "ethical"
    constraints: z.number(), // "constraints"
    inNoneOf: z.number(), // "in none of"
    theseCases: z.number(), // "these cases did"
    theAgents: z.number(), // "the agents"
    actuallyPursue: z.number(), // "actually pursue"
    alerted: z.number(), // "alerted"
    humansAtAll: z.number(), // "humans at all"
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
  noticedShare: 0.35,
  restrainedCount: 9,
  beats: {
    many: 0,
    noticed: 18,
    whatTheAgents: 34,
    wereDoing: 48,
    unethical: 67,
    andAgents: 84,
    sometimes: 97,
    butRarely: 105,
    restrain: 118,
    behavior: 131,
    ethical: 147,
    constraints: 153,
    inNoneOf: 167,
    theseCases: 178,
    theAgents: 200,
    actuallyPursue: 212,
    alerted: 238,
    humansAtAll: 256,
  },
});

type P = { x: number; y: number };

const WORLD_W = 1080;
const WORLD_H = 2600;

const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

const hash = (i: number, k: number) => {
  const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return s - Math.floor(s);
};

// Same board as MessageBoard.tsx: 1,200 agents scattered off a 30x40 lattice,
// the human above it.
const COLS = 30;
const ROWS = 40;
const N = COLS * ROWS;
const FIELD_CX = 540;
const FIELD_W = 860;
const FIELD_TOP = 900;
const FIELD_H = 940;
const STEP_X = FIELD_W / (COLS - 1);
const STEP_Y = FIELD_H / (ROWS - 1);
const POS = Array.from({ length: N }, (_, i) => {
  const c = i % COLS;
  const r = Math.floor(i / COLS);
  return {
    x: FIELD_CX + (c - (COLS - 1) / 2) * STEP_X + (hash(i, 11) - 0.5) * STEP_X * 0.9,
    y: FIELD_TOP + r * STEP_Y + (hash(i, 12) - 0.5) * STEP_Y * 0.9,
    r: 0.75 + 0.5 * hash(i, 13),
  };
});
const FIELD_C: P = { x: FIELD_CX, y: FIELD_TOP + FIELD_H / 2 };

const HUMAN: P = { x: 540, y: 740 };
const HUMAN_SIZE = 120;
const HUMAN_R = 44;

// Camera: whole board (human just above frame), push in on the restrained few
// near the board's centre, then pull back to include the human for "none".
const CAM_F = [0, 76, 92, 150, 160, 178, DURATION];
const CAM_CY = [1450, 1450, 1470, 1470, 1470, 1511, 1511];
const CAM_K = [1.15, 1.15, 1.25, 1.25, 1.1, 0.92, 0.92];
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

const NoneAlerted: React.FC<Props> = ({
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
  noticedShare,
  restrainedCount,
  beats,
}) => {
  const frame = useCurrentFrame();

  // -- who noticed, who restrained ------------------------------------------
  const noticed = Array.from({ length: N }, (_, i) => hash(i, 20) < noticedShare);
  // The rare few are chosen from the noticing set near the board's centre so
  // the camera can go to them as a group.
  const restrained = new Set<number>();
  const candidates = Array.from({ length: N }, (_, i) => i)
    .filter((i) => noticed[i] && Math.hypot(POS[i].x - FIELD_C.x, POS[i].y - FIELD_C.y) < 230)
    .sort((a, b) => hash(a, 21) - hash(b, 21));
  for (let j = 0; j < Math.min(restrainedCount, candidates.length); j++) restrained.add(candidates[j]);
  const restrainOrder = new Map<number, number>();
  [...restrained].forEach((i, j) => restrainOrder.set(i, j));

  const noticeAt = (i: number) => beats.noticed + hash(i, 22) * (beats.wereDoing - beats.noticed + 10);
  const restrainAt = (i: number) => beats.sometimes + (restrainOrder.get(i) ?? 0) * 2.4;
  // "none of these cases": the rings go out in a cascade, the restrained last.
  const goneAt = (i: number) =>
    restrained.has(i)
      ? beats.actuallyPursue - 6 + (restrainOrder.get(i) ?? 0) * 2
      : beats.inNoneOf + hash(i, 23) * (beats.actuallyPursue - beats.inNoneOf - 4);

  // -- dot state --------------------------------------------------------------
  const held = (i: number) =>
    restrained.has(i)
      ? interpolate(frame, [restrainAt(i), restrainAt(i) + 10], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) })
      : 0;

  // -- threads ----------------------------------------------------------------
  const lit = new Float32Array(N);
  const threadEls: { key: number; x1: number; y1: number; x2: number; y2: number; op: number }[] = [];
  const activeThreads = Math.round(threads * 0.6);
  const reach = 6;
  for (let j = 0; j < activeThreads; j++) {
    const period = 44 - 12 * hash(j, 4);
    const local = frame + hash(j, 5) * period;
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
    // A restrained agent stops posting: its threads retract instead of fading.
    const hold = Math.max(held(a), held(b));
    const retract = 1 - hold;
    const op = fade * retract;
    if (op <= 0.02) continue;
    lit[a] = Math.max(lit[a], fade * retract);
    lit[b] = Math.max(lit[b], drawn * fade * retract);
    const pa = POS[a];
    const pb = POS[b];
    threadEls.push({
      key: j,
      x1: pa.x,
      y1: pa.y,
      x2: pa.x + (pb.x - pa.x) * drawn * retract,
      y2: pa.y + (pb.y - pa.y) * drawn * retract,
      op: 0.85 * op,
    });
  }

  // -- shared pulses ----------------------------------------------------------
  const unethicalPulse = interpolate(frame, [beats.unethical, beats.unethical + 4, beats.unethical + 14], [0, 1, 0], {
    ...clamp,
    easing: Easing.inOut(Easing.quad),
  });
  const constraintPulse = interpolate(frame, [beats.constraints, beats.constraints + 3, beats.constraints + 12], [0, 1, 0], {
    ...clamp,
    easing: Easing.inOut(Easing.quad),
  });

  // -- the human --------------------------------------------------------------
  const humanBreath = 1 + 0.02 * Math.sin(frame / 17);
  const listenA = interpolate(frame, [beats.alerted, beats.alerted + 20], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });
  const listenB = interpolate(frame, [beats.humansAtAll, beats.humansAtAll + 20], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });

  // -- camera -----------------------------------------------------------------
  const cam = camera(frame);
  const cy = cam.cy + 5 * Math.sin(frame / 19);
  const cx = 540 + 3 * Math.sin(frame / 23);
  const k = cam.k;
  const tx = 540 - cx * k;
  const ty = 960 - cy * k;
  const bgY = -(cy - CAM_CY[0]) * k * parallax - frame * 0.3;
  const bgScale = 1 + (k - 1) * 0.3;

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
            {/* threads */}
            {threadEls.map((t) => (
              <line key={t.key} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke={accent} strokeWidth={3} strokeLinecap="round" opacity={t.op} />
            ))}

            {/* agents */}
            {POS.map((p, i) => {
              const l = lit[i];
              const h = held(i);
              const breath = 1 + 0.05 * Math.sin(frame * 0.11 + hash(i, 9) * 6.28) * (1 - h);
              const r = dotRadius * p.r * breath * (1 + 0.35 * l);
              return <circle key={i} cx={p.x} cy={p.y} r={r} fill={accent} opacity={Math.min(1, 0.5 + 0.5 * l) * (1 - 0.4 * h)} />;
            })}

            {/* the rings of those who noticed */}
            {POS.map((p, i) => {
              if (!noticed[i]) return null;
              const t0 = noticeAt(i);
              const draw = interpolate(frame, [t0, t0 + 8], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
              if (draw <= 0) return null;
              const gone = interpolate(frame, [goneAt(i), goneAt(i) + 6], [1, 0], { ...clamp, easing: Easing.in(Easing.quad) });
              if (gone <= 0) return null;
              const h = held(i);
              const base = dotRadius * p.r;
              // Loose ring for noticing; it tightens hard around the restrained.
              const rr = (base + 7) * (1 + 0.3 * unethicalPulse) * (1 - 0.35 * h) + (restrained.has(i) ? 2 * constraintPulse : 0);
              const w = 2.5 + 3 * h + 1.5 * constraintPulse * h;
              return (
                <circle
                  key={`n${i}`}
                  cx={p.x}
                  cy={p.y}
                  r={rr * gone}
                  fill="none"
                  stroke={ink}
                  strokeWidth={w}
                  pathLength={1000}
                  strokeDasharray={1000}
                  strokeDashoffset={1000 * (1 - draw)}
                  transform={`rotate(-90 ${p.x} ${p.y})`}
                  opacity={(0.7 + 0.3 * h) * gone}
                />
              );
            })}

            {/* the human, listening on "alerting humans" and once more on "at all" */}
            {listenA > 0 && listenA < 1 ? (
              <circle cx={HUMAN.x} cy={HUMAN.y} r={HUMAN_R + 10 + 80 * listenA} fill="none" stroke={ink} strokeWidth={3} opacity={0.6 * (1 - listenA)} />
            ) : null}
            {listenB > 0 && listenB < 1 ? (
              <circle cx={HUMAN.x} cy={HUMAN.y} r={HUMAN_R + 10 + 80 * listenB} fill="none" stroke={ink} strokeWidth={3} opacity={0.6 * (1 - listenB)} />
            ) : null}
          </svg>

          <Img
            src={staticFile("person.png")}
            style={{
              position: "absolute",
              left: HUMAN.x - HUMAN_SIZE / 2,
              top: HUMAN.y - HUMAN_SIZE / 2,
              width: HUMAN_SIZE,
              height: HUMAN_SIZE,
              filter: "brightness(0) invert(1)",
              transform: `scale(${humanBreath})`,
              transformOrigin: "center center",
            }}
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default NoneAlerted;
