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
  noticedCount: z.number(),
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
  dotRadius: 5.5,
  threads: 140,
  noticedCount: 300,
  restrainedCount: 6,
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
const WORLD_H = 2400;

const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

const hash = (i: number, k: number) => {
  const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return s - Math.floor(s);
};

// ---------------------------------------------------------------------------
// The funnel, bottom to top: the crowd of 1,200; the band of those who
// noticed; the short row of the few who restrained; the one empty slot where
// an agent that alerted the humans would sit; the human.
// ---------------------------------------------------------------------------
const COLS = 40;
const ROWS = 30;
const N = COLS * ROWS;
const CROWD = { cx: 540, w: 860, top: 1400, h: 500 };
const STEP_X = CROWD.w / (COLS - 1);
const STEP_Y = CROWD.h / (ROWS - 1);
const CROWD_POS = Array.from({ length: N }, (_, i) => {
  const c = i % COLS;
  const r = Math.floor(i / COLS);
  return {
    x: CROWD.cx + (c - (COLS - 1) / 2) * STEP_X + (hash(i, 11) - 0.5) * STEP_X * 0.9,
    y: CROWD.top + r * STEP_Y + (hash(i, 12) - 0.5) * STEP_Y * 0.9,
    r: 0.75 + 0.5 * hash(i, 13),
  };
});

const BAND = { cx: 540, w: 780, top: 1130, h: 160, cols: 30 };
const ROW_Y = 960;
const ROW_GAP = 70;
const SLOT: P = { x: 540, y: 830 };
const SLOT_R = 24;
const HUMAN: P = { x: 540, y: 700 };
const HUMAN_SIZE = 120;

// Camera climbs the funnel as it forms, then opens to include the human.
const CAM_F = [0, 14, 30, 76, 90, 150, 160, 176, DURATION];
const CAM_CY = [1800, 1800, 1650, 1650, 1500, 1500, 1400, 1290, 1290];
const CAM_K = [1.0, 1.0, 0.95, 0.95, 0.9, 0.9, 0.82, 0.76, 0.76];
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

type Agent = { x: number; y: number; tier: number; lift: number; rowLift: number; hold: number; slot: number };

const NoneAlertedTiersV2: React.FC<Props> = ({
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
  noticedCount,
  restrainedCount,
  beats,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // -- who noticed, who restrained ------------------------------------------
  // Noticed: a hashed subset, in a stable order that also gives each its band slot.
  const order = Array.from({ length: N }, (_, i) => i).sort((a, b) => hash(a, 20) - hash(b, 20));
  const noticedSlot = new Map<number, number>();
  for (let k = 0; k < Math.min(noticedCount, N); k++) noticedSlot.set(order[k], k);
  // Restrained: the first few of the noticed, spread across the band by slot.
  const restrainedSlot = new Map<number, number>();
  for (let j = 0; j < restrainedCount; j++) {
    const pick = order[Math.floor(((j + 0.5) / restrainedCount) * Math.min(noticedCount, N))];
    restrainedSlot.set(pick, j);
  }

  const bandRows = Math.ceil(noticedCount / BAND.cols);
  const slotAgent: number[] = [];
  noticedSlot.forEach((slot, i) => {
    slotAgent[slot] = i;
  });
  const bandPos = (slot: number): P => {
    const c = slot % BAND.cols;
    const r = Math.floor(slot / BAND.cols);
    return {
      x: BAND.cx + (c - (BAND.cols - 1) / 2) * (BAND.w / (BAND.cols - 1)) + (hash(slot, 14) - 0.5) * (BAND.w / (BAND.cols - 1)) * 0.95,
      y: BAND.top + (r / Math.max(1, bandRows - 1)) * BAND.h + (hash(slot, 15) - 0.5) * (BAND.h / Math.max(1, bandRows - 1)) * 0.95,
    };
  };
  const rowPos = (j: number): P => ({ x: 540 + (j - (restrainedCount - 1) / 2) * ROW_GAP, y: ROW_Y });

  // -- agent states -----------------------------------------------------------
  const agents: Agent[] = CROWD_POS.map((p, i) => {
    const slot = noticedSlot.get(i);
    if (slot === undefined) return { x: p.x, y: p.y, tier: 0, lift: 0, rowLift: 0, hold: 0, slot: -1 };
    const liftAt = beats.noticed + hash(i, 21) * (beats.wereDoing - beats.noticed + 8);
    const lift = interpolate(frame, [liftAt, liftAt + 22], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
    const b = bandPos(slot);
    // Lifts travel on a shallow arc, each its own way, so the rise reads as a
    // crowd moving rather than a row of straight lines.
    const arc = Math.sin(Math.PI * lift) * (hash(i, 24) - 0.5) * 140;
    let x = p.x + (b.x - p.x) * lift + arc;
    let y = p.y + (b.y - p.y) * lift;
    let rowLift = 0;
    let hold = 0;
    const j = restrainedSlot.get(i);
    if (j !== undefined) {
      const rAt = beats.sometimes + j * 3.5;
      rowLift = interpolate(frame, [rAt, rAt + 20], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
      const rp = rowPos(j);
      const arc2 = Math.sin(Math.PI * rowLift) * (hash(i, 25) - 0.5) * 90;
      x = x + (rp.x - x) * rowLift + arc2;
      y = y + (rp.y - y) * rowLift;
      hold = interpolate(frame, [beats.restrain + j * 2, beats.restrain + j * 2 + 10], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.6)) });
    }
    const tier = rowLift > 0.5 ? 2 : lift > 0.5 ? 1 : 0;
    return { x, y, tier, lift, rowLift, hold, slot };
  });

  // -- threads (within a tier, never across) ----------------------------------
  const lit = new Float32Array(N);
  const threadEls: { key: number; x1: number; y1: number; x2: number; y2: number; op: number; drawn: number }[] = [];
  const reach = 5;
  for (let j = 0; j < threads; j++) {
    const period = 44 - 12 * hash(j, 4);
    const local = frame + hash(j, 5) * period;
    const cycle = Math.floor(local / period);
    const phase = (local - cycle * period) / period;
    const seed = j * 131 + cycle * 7;
    const a = Math.floor(hash(seed, 6) * N);
    let b: number;
    if (agents[a].tier === 1) {
      // In the band, neighbours are neighbours by band slot.
      const sa = agents[a].slot;
      const sc = sa % BAND.cols;
      const sr = Math.floor(sa / BAND.cols);
      const nc = Math.max(0, Math.min(BAND.cols - 1, sc + Math.round((hash(seed, 7) - 0.5) * 6)));
      const nr = Math.max(0, Math.min(bandRows - 1, sr + Math.round((hash(seed, 8) - 0.5) * 4)));
      const ns = nr * BAND.cols + nc;
      const partner = slotAgent[ns];
      if (partner === undefined) continue;
      b = partner;
    } else {
      const ac = a % COLS;
      const ar = Math.floor(a / COLS);
      const dc = Math.round((hash(seed, 7) - 0.5) * 2 * reach);
      const dr = Math.round((hash(seed, 8) - 0.5) * 2 * reach);
      const bc = Math.max(0, Math.min(COLS - 1, ac + dc));
      const br = Math.max(0, Math.min(ROWS - 1, ar + dr));
      b = br * COLS + bc;
    }
    if (b === a) continue;
    const A = agents[a];
    const B = agents[b];
    // Moving or held agents do not post; different tiers do not talk.
    const still = (g: Agent) => (g.lift > 0 && g.lift < 1) || (g.rowLift > 0 && g.rowLift < 1) || g.hold > 0;
    if (still(A) || still(B) || A.tier !== B.tier) continue;
    // In the band, a thread only reads if the endpoints are near each other.
    const drawn = interpolate(phase, [0, 0.3], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
    const fade = interpolate(phase, [0.55, 1], [1, 0], clamp);
    if (fade <= 0.02) continue;
    lit[a] = Math.max(lit[a], fade);
    lit[b] = Math.max(lit[b], drawn * fade);
    threadEls.push({ key: j, x1: A.x, y1: A.y, x2: A.x + (B.x - A.x) * drawn, y2: A.y + (B.y - A.y) * drawn, op: 0.85 * fade, drawn });
  }

  // -- pulses and the check ---------------------------------------------------
  const unethicalFlash = interpolate(frame, [beats.unethical, beats.unethical + 3, beats.unethical + 16], [0, 0.85, 0], {
    ...clamp,
    easing: Easing.inOut(Easing.quad),
  });
  const constraintPulse = interpolate(frame, [beats.constraints, beats.constraints + 3, beats.constraints + 12], [0, 1, 0], {
    ...clamp,
    easing: Easing.inOut(Easing.quad),
  });
  // "in none of these cases": a white check sweeps across every case.
  const checkT = interpolate(frame, [beats.theseCases, beats.actuallyPursue + 8], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.quad),
  });
  const checkX = 120 + 840 * checkT;
  const checkOn = frame >= beats.theseCases && frame <= beats.actuallyPursue + 8;
  const slotDraw = interpolate(frame, [beats.inNoneOf, beats.inNoneOf + 12], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const slotSpin = frame * 0.8;
  const askA = interpolate(frame, [beats.alerted, beats.alerted + 18], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });
  const askB = interpolate(frame, [beats.humansAtAll, beats.humansAtAll + 18], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });
  const humanBreath = 1 + 0.02 * Math.sin(frame / 17);

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
            {/* the seats the noticing agents left behind */}
            {agents.map((g, i) =>
              g.slot >= 0 && g.lift > 0 ? (
                <circle key={`s${i}`} cx={CROWD_POS[i].x} cy={CROWD_POS[i].y} r={dotRadius * CROWD_POS[i].r} fill="none" stroke={ink} strokeWidth={1.5} opacity={0.14 * g.lift} />
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
            {agents.map((g, i) => {
              const l = lit[i];
              const breath = 1 + 0.05 * Math.sin(frame * 0.11 + hash(i, 9) * 6.28) * (1 - g.hold);
              const r = dotRadius * CROWD_POS[i].r * breath * (1 + 0.35 * l) * (1 + 0.15 * g.lift + 1.0 * g.rowLift);
              const inBand = g.tier === 1;
              const inRow = g.tier === 2;
              // A check passing over a case reads it white for a moment.
              const checked = checkOn && (inBand || inRow) ? Math.max(0, 1 - Math.abs(checkX - g.x) / 40) : 0;
              const white = Math.max(inBand ? unethicalFlash : 0, checked);
              return (
                <g key={i}>
                  <circle cx={g.x} cy={g.y} r={r} fill={accent} opacity={Math.min(1, 0.5 + 0.5 * l + 0.25 * g.lift) * (1 - 0.3 * g.hold)} />
                  {white > 0 ? <circle cx={g.x} cy={g.y} r={r} fill={ink} opacity={white} /> : null}
                  {g.hold > 0 ? (
                    <circle
                      cx={g.x}
                      cy={g.y}
                      r={Math.max(0, r + 7 + 3 * constraintPulse + 10 * (g.hold - Math.min(1, g.hold)))}
                      fill="none"
                      stroke={ink}
                      strokeWidth={3.5 + 2 * constraintPulse}
                      pathLength={1000}
                      strokeDasharray={1000}
                      strokeDashoffset={1000 * (1 - Math.min(1, g.hold))}
                      transform={`rotate(-90 ${g.x} ${g.y})`}
                    />
                  ) : null}
                </g>
              );
            })}

            {/* the check sweeping the cases */}
            {checkOn ? (
              <line x1={checkX} y1={ROW_Y - 40} x2={checkX} y2={BAND.top + BAND.h + 30} stroke={ink} strokeWidth={3} strokeLinecap="round" opacity={0.6} />
            ) : null}

            {/* the empty slot */}
            {slotDraw > 0 ? (
              <g>
                <circle
                  cx={SLOT.x}
                  cy={SLOT.y}
                  r={SLOT_R}
                  fill="none"
                  stroke={ink}
                  strokeWidth={3}
                  pathLength={1000}
                  strokeDasharray={slotDraw >= 1 ? "45 38" : "1000 1000"}
                  strokeDashoffset={slotDraw >= 1 ? -(slotSpin % 83) : 1000 * (1 - slotDraw)}
                  transform={`rotate(-90 ${SLOT.x} ${SLOT.y})`}
                  opacity={0.5}
                />
                {askA > 0 && askA < 1 ? (
                  <circle cx={SLOT.x} cy={SLOT.y} r={SLOT_R + 70 * askA} fill="none" stroke={ink} strokeWidth={3} opacity={0.6 * (1 - askA)} />
                ) : null}
                {askB > 0 && askB < 1 ? (
                  <circle cx={SLOT.x} cy={SLOT.y} r={SLOT_R + 70 * askB} fill="none" stroke={ink} strokeWidth={3} opacity={0.6 * (1 - askB)} />
                ) : null}
              </g>
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
              transform: `scale(${humanBreath * (1 + 0.08 * (frame >= beats.alerted ? 1 - spring({ frame: frame - beats.alerted, fps, config: { damping: 9, stiffness: 180 } }) : 0))})`,
              transformOrigin: "center center",
            }}
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default NoneAlertedTiersV2;
