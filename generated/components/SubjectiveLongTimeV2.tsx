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
// Dwarkesh, "again, all of this has happened a long time, at least from the
// subjective perspective of the AIs, after they had already cheated their way
// to the correct answer to their tasks" — SRT 19.820s -> 29.460s.
// round(9.64 * 24) = 231.
export const DURATION = 231;

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
  edgeWidth: z.number(),
  packetSpeed: z.number(),
  packetOpacity: z.number(),
  stretchLength: z.number(),
  beats: z.object({
    again: z.number(), // "again all"
    ofThisHas: z.number(), // "of this has"
    happened: z.number(), // "happened a"
    longTime: z.number(), // "long time"
    atLeast: z.number(), // "at least"
    subjective: z.number(), // "subjective"
    perspective: z.number(), // "perspective"
    ofTheAis: z.number(), // "of the ais"
    afterTheyHad: z.number(), // "after they had"
    alreadyCheated: z.number(), // "already cheated"
    theirWay: z.number(), // "their way"
    toTheCorrect: z.number(), // "to the correct"
    answer: z.number(), // "answer to their"
    tasks: z.number(), // "tasks"
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
  edgeWidth: 9,
  packetSpeed: 8,
  packetOpacity: 0.55,
  stretchLength: 8000,
  beats: {
    again: 0,
    ofThisHas: 18,
    happened: 27,
    longTime: 45,
    atLeast: 63,
    subjective: 76,
    perspective: 85,
    ofTheAis: 96,
    afterTheyHad: 119,
    alreadyCheated: 137,
    theirWay: 156,
    toTheCorrect: 168,
    answer: 190,
    tasks: 217,
  },
});

type P = { x: number; y: number };

const WORLD_W = 1080;
const WORLD_H = 3000;

const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

const hash = (i: number, k: number) => {
  const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return s - Math.floor(s);
};

// ---------------------------------------------------------------------------
// Opening state: the finished tree from SprawlingProjectSleek, exactly as it
// was left, so the two cuts read as one thought. Every piece of it then folds
// down onto a single timeline.
// ---------------------------------------------------------------------------
const LOGO = { x: 540, y: 600, size: 300 };
const ROOT: P = { x: 540, y: 760 };
const SCORER = { x: 330, y: 1700, r: 72 };
const EVIDENCE = { x: 540, y: 2070, rows: [110, 150, 90], gap: 44 };
const EVIDENCE_TOP: P = { x: EVIDENCE.x, y: EVIDENCE.y - EVIDENCE.gap - 30 };
const SCORER_TOP: P = { x: SCORER.x, y: SCORER.y - SCORER.r };

type NodeDef = { id: string; x: number; y: number; r: number; parent: string | null; depth: number };
const K_C: P = { x: 760, y: 2500 };
const K_R = 130;
const NODES: NodeDef[] = [
  { id: "A", x: 330, y: 1080, r: 28, parent: "root", depth: 1 },
  { id: "B", x: 540, y: 1130, r: 28, parent: "root", depth: 1 },
  { id: "C", x: 750, y: 1080, r: 28, parent: "root", depth: 1 },
  { id: "A1", x: 250, y: 1280, r: 21, parent: "A", depth: 2 },
  { id: "A2", x: 330, y: 1460, r: 21, parent: "A1", depth: 3 },
  { id: "B1", x: 620, y: 1350, r: 21, parent: "B", depth: 2 },
  { id: "B2", x: 500, y: 1580, r: 21, parent: "B1", depth: 3 },
  { id: "B3", x: 580, y: 1800, r: 21, parent: "B2", depth: 4 },
  { id: "C1", x: 830, y: 1300, r: 21, parent: "C", depth: 2 },
  { id: "C2", x: 770, y: 1520, r: 21, parent: "C1", depth: 3 },
  { id: "C3", x: 860, y: 1760, r: 21, parent: "C2", depth: 4 },
  { id: "C4", x: 790, y: 2010, r: 21, parent: "C3", depth: 5 },
  { id: "C5", x: 820, y: 2250, r: 21, parent: "C4", depth: 6 },
  { id: "K0", x: K_C.x, y: K_C.y, r: 27, parent: "C5", depth: 7 },
  ...Array.from({ length: 6 }, (_, i) => {
    const a = (i * 60 * Math.PI) / 180;
    return {
      id: `K${i + 1}`,
      x: Math.round(K_C.x + Math.cos(a) * K_R),
      y: Math.round(K_C.y + Math.sin(a) * K_R),
      r: 25,
      parent: "K0",
      depth: 8,
    };
  }),
];
const NODE_INDEX = new Map(NODES.map((n, i) => [n.id, i]));
const CHOSEN = ["K2", "K3", "K4"];

type Twig = { p: string; a: number; l: number };
const TWIGS: Twig[] = [
  { p: "A", a: 200, l: 120 },
  { p: "C", a: -20, l: 120 },
  { p: "B1", a: 20, l: 100 },
  { p: "A1", a: 190, l: 100 },
  { p: "C1", a: 0, l: 120 },
  { p: "B2", a: 190, l: 110 },
  { p: "C2", a: -30, l: 100 },
  { p: "C3", a: 10, l: 120 },
  { p: "A2", a: 210, l: 90 },
  { p: "C4", a: -25, l: 110 },
];

// ---------------------------------------------------------------------------
// The timeline is the tree's own spine: every node slides sideways onto the
// centre axis, keeping its height, so the fold is one horizontal squeeze and
// the events stay in the order they happened. Time runs downward from the
// logo; stretching the spine sends it off the bottom of the frame.
// ---------------------------------------------------------------------------
const SPINE_X = 540;
const SPINE_Y0 = ROOT.y; // leaves the logo where the tree did
const FOLD_LENGTH = 1870;
const EVENTS_FROM = 320; // spine-space offset where the first event sits
const TICK_SPACING = 48;
const SPINE_W = 12;

// The tasks sit at the very start of the timeline, before the first tick.
const TASK_ROW_Y = 960;
const TASK_XS = [380, 540, 700];
const TASK_R = 44;
const PLAYHEAD_REST = 1060;

// Camera keys lead the beats by ~10 frames.
const CAM_F = [0, 22, 42, 58, 96, 108, 124, 180, 186, 206, DURATION];
const CAM_CY = [1671, 1671, 1560, 1500, 1650, 1650, 1050, 1050, 1050, 1250, 1250];
const CAM_K = [0.66, 0.66, 0.78, 0.85, 0.85, 0.85, 1.0, 1.0, 1.0, 0.72, 0.72];
const CAM_CX = [540, 540, 540, 540, 540, 540, 540, 540, 540, 540, 540];
const CAM_STIFF = 0.09;
const CAM_DAMP = 0.468;

const camera = (upto: number) => {
  let cy = CAM_CY[0];
  let k = CAM_K[0];
  let cx = CAM_CX[0];
  let vy = 0;
  let vk = 0;
  let vx = 0;
  for (let f = 1; f <= upto; f++) {
    const ty = interpolate(f, CAM_F, CAM_CY, clamp);
    const tk = interpolate(f, CAM_F, CAM_K, clamp);
    const tx = interpolate(f, CAM_F, CAM_CX, clamp);
    vy += (ty - cy) * CAM_STIFF - vy * CAM_DAMP;
    cy += vy;
    vk += (tk - k) * CAM_STIFF - vk * CAM_DAMP;
    k += vk;
    vx += (tx - cx) * CAM_STIFF - vx * CAM_DAMP;
    cx += vx;
  }
  return { cy, k, cx };
};

const BG_OVERSIZE = 1.8;

const SubjectiveLongTimeV2: React.FC<Props> = ({
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
  edgeWidth,
  packetSpeed,
  packetOpacity,
  stretchLength,
  beats,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // -- the spine ------------------------------------------------------------
  const barDraw = interpolate(frame, [beats.happened, beats.longTime], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const stretch = interpolate(frame, [beats.longTime, beats.ofTheAis], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.quad),
  });
  const barLength = (FOLD_LENGTH + (stretchLength - FOLD_LENGTH) * stretch) * barDraw;
  const barEnd = SPINE_Y0 + barLength;
  const slotY = (frac: number) =>
    SPINE_Y0 + EVENTS_FROM + (Math.max(barLength, FOLD_LENGTH) - EVENTS_FROM) * frac;

  // -- the playhead ---------------------------------------------------------
  const playIn = interpolate(frame, [beats.afterTheyHad - 10, beats.afterTheyHad - 4], [0, 1], clamp);
  // The playhead comes up from just below the frame and eases into place,
  // rather than whipping in from the far end of the spine.
  const scrub = interpolate(frame, [beats.afterTheyHad, beats.alreadyCheated], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  const playStart = PLAYHEAD_REST + 1500;
  const playY = playStart + (PLAYHEAD_REST - playStart) * scrub;

  // -- folding --------------------------------------------------------------
  const foldOf = (depth: number, extra = 0) =>
    interpolate(frame, [beats.happened + depth * 1.6 + extra, beats.happened + depth * 1.6 + extra + 14], [0, 1], {
      ...clamp,
      easing: Easing.inOut(Easing.cubic),
    });
  // Where a node sits in time is where it already sits in the tree.
  const fracOfY = (y: number) => Math.max(0, Math.min(1, (y - 1080) / 1550));

  type NodeState = { x: number; y: number; r: number; fold: number; frac: number };
  const states: NodeState[] = NODES.map((n, i) => {
    const fold = foldOf(n.depth);
    const frac = fracOfY(n.y + (hash(i, 5) - 0.5) * 40);
    const sy = slotY(frac);
    const breath = 1 + 0.04 * Math.sin(frame * 0.12 + hash(i, 6) * 6.28);
    // Passing playhead lights each event it crosses.
    const near = playIn > 0 ? Math.max(0, 1 - Math.abs(playY - sy) / 40) : 0;
    const r0 = CHOSEN.includes(n.id) ? 0 : n.r;
    // A little sag mid-fold so the slide onto the spine has weight.
    const sag = Math.sin(Math.PI * fold) * 26;
    return {
      x: n.x + (SPINE_X - n.x) * fold,
      y: n.y + (sy - n.y) * fold + sag,
      r: (r0 + (12 - r0) * fold) * breath * (1 + 0.5 * near),
      fold,
      frac,
    };
  });
  const posOf = (id: string): P =>
    id === "root" ? ROOT : { x: states[NODE_INDEX.get(id)!].x, y: states[NODE_INDEX.get(id)!].y };

  const logoFold = foldOf(0);
  const logoSize = LOGO.size;
  const logoPos = { x: LOGO.x, y: LOGO.y };
  const enter = spring({ frame, fps, config: { damping: 14, stiffness: 110, mass: 0.9 } });
  const logoBreath = 1 + 0.012 * Math.sin(frame / 21) - 0.03 * logoFold;

  const scorerFold = foldOf(4, 2);
  const scorerSlot = slotY(fracOfY(SCORER.y));
  const scorerPos = { x: SCORER.x + (SPINE_X - SCORER.x) * scorerFold, y: SCORER.y + (scorerSlot - SCORER.y) * scorerFold };
  const scorerR = SCORER.r + (12 - SCORER.r) * scorerFold;

  const evFold = foldOf(5, 2);
  const evSlot = slotY(fracOfY(EVIDENCE.y));
  const evPos = { x: EVIDENCE.x, y: EVIDENCE.y + (evSlot - EVIDENCE.y) * evFold };

  const edgesGone = interpolate(frame, [beats.happened + 4, beats.happened + 18], [1, 0], clamp);
  const ghostGone = interpolate(frame, [beats.happened, beats.happened + 10], [0.16, 0], clamp);

  // -- the tasks ------------------------------------------------------------
  const taskDraw = (i: number) =>
    interpolate(frame, [beats.alreadyCheated + i * 4, beats.alreadyCheated + i * 4 + 10], [0, 1], {
      ...clamp,
      easing: Easing.out(Easing.cubic),
    });
  // The cheat comes down the spine into the centre ring ("their way"), the
  // ring fills ("correct answer"), then the line runs out both ways and the
  // outer rings fill ("tasks"). Centre first, then symmetric.
  const wayT = interpolate(frame, [beats.theirWay, beats.toTheCorrect], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  const outT = interpolate(frame, [beats.answer, beats.answer + 10], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  const FILL_AT = [beats.tasks, beats.toTheCorrect, beats.tasks];
  const fillOf = (i: number) =>
    spring({ frame: frame - FILL_AT[i], fps, config: { damping: 11, stiffness: 170, mass: 0.8 } });

  // -- camera ---------------------------------------------------------------
  const cam = camera(frame);
  const cy = cam.cy + 5 * Math.sin(frame / 19);
  const cx = cam.cx + 3 * Math.sin(frame / 23);
  const k = cam.k;
  const tx = 540 - cx * k;
  const ty = 960 - cy * k;
  const bgY = -(cy - CAM_CY[0]) * k * parallax - frame * 0.3;
  const bgX = -(cx - CAM_CX[0]) * k * parallax;
  const bgScale = 1 + (k - 1) * 0.3;

  const packetOffset = (phase: number) => -((frame * packetSpeed + phase * 1000) % 500);

  const edgeEl = (key: string, from: P, to: P, opacity: number, phase: number, width = edgeWidth) => {
    if (opacity <= 0) return null;
    const d = `M ${from.x.toFixed(1)} ${from.y.toFixed(1)} L ${to.x.toFixed(1)} ${to.y.toFixed(1)}`;
    return (
      <g key={key}>
        <path d={d} fill="none" stroke={accent} strokeWidth={width} strokeLinecap="round" opacity={0.8 * opacity} />
        <path
          d={d}
          fill="none"
          stroke={ink}
          strokeWidth={width}
          strokeLinecap="round"
          pathLength={1000}
          strokeDasharray="22 478"
          strokeDashoffset={packetOffset(phase)}
          opacity={packetOpacity * opacity}
        />
      </g>
    );
  };

  const tickFrom = SPINE_Y0 + EVENTS_FROM;
  const tickCount = Math.max(0, Math.floor((barEnd - tickFrom) / TICK_SPACING));
  const ticksOn = interpolate(frame, [beats.longTime, beats.longTime + 6], [0, 1], clamp);

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
            transform: `translate(-50%, -50%) translate(${bgX.toFixed(2)}px, ${bgY.toFixed(2)}px) scale(${bgScale.toFixed(4)})`,
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
            {/* tree edges, fading as everything folds flat */}
            {NODES.map((n, i) => {
              if (!n.parent) return null;
              const chosen = CHOSEN.includes(n.id);
              return edgeEl(`e${n.id}`, posOf(n.parent), posOf(n.id), edgesGone * (chosen ? 0.15 : 1), hash(i, 7));
            })}
            {edgeEl("eScorer", posOf("A2"), { x: SCORER_TOP.x, y: SCORER_TOP.y }, edgesGone, 0.31)}
            {edgeEl("eEv", posOf("B3"), EVIDENCE_TOP, edgesGone, 0.77)}

            {/* twigs fold into their parent */}
            {TWIGS.map((t, i) => {
              const parent = NODES[NODE_INDEX.get(t.p)!];
              const st = states[NODE_INDEX.get(t.p)!];
              const a = (t.a * Math.PI) / 180;
              const tip0 = { x: parent.x + Math.cos(a) * t.l, y: parent.y + Math.sin(a) * t.l };
              const tip = { x: tip0.x + (st.x - tip0.x) * st.fold, y: tip0.y + (st.y - tip0.y) * st.fold };
              const op = 1 - st.fold;
              if (op <= 0) return null;
              const leafBreath = 1 + 0.05 * Math.sin(frame * 0.13 + hash(i, 8) * 6.28);
              return (
                <g key={`t${i}`} opacity={op}>
                  <line x1={st.x} y1={st.y} x2={tip.x} y2={tip.y} stroke={accent} strokeWidth={5} strokeLinecap="round" opacity={0.8} />
                  <circle cx={tip.x} cy={tip.y} r={10 * leafBreath} fill={accent} />
                </g>
              );
            })}

            {/* the spine, ticks and packets — cut out of the centre task ring */}
            <defs>
              <mask id="spine-hole" maskUnits="userSpaceOnUse" x={0} y={0} width={WORLD_W} height={WORLD_H + 8000}>
                <rect x={0} y={0} width={WORLD_W} height={WORLD_H + 8000} fill="white" />
                <circle cx={TASK_XS[1]} cy={TASK_ROW_Y} r={(TASK_R - 4) * taskDraw(1)} fill="black" />
              </mask>
            </defs>
            {barLength > 1 ? (
              <g mask="url(#spine-hole)">
                <line x1={SPINE_X} y1={SPINE_Y0} x2={SPINE_X} y2={barEnd} stroke={accent} strokeWidth={SPINE_W} strokeLinecap="round" opacity={0.8} />
                <line
                  x1={SPINE_X}
                  y1={SPINE_Y0}
                  x2={SPINE_X}
                  y2={barEnd}
                  stroke={ink}
                  strokeWidth={SPINE_W}
                  strokeLinecap="round"
                  strokeDasharray={`26 ${Math.max(80, barLength / 6)}`}
                  strokeDashoffset={-((frame * packetSpeed * 2) % (barLength / 6 + 26))}
                  opacity={packetOpacity}
                />
                {Array.from({ length: tickCount }, (_, i) => {
                  const y = tickFrom + i * TICK_SPACING;
                  const op = interpolate(barEnd - y, [0, 40], [0, 0.7], clamp) * ticksOn;
                  if (op <= 0) return null;
                  return <line key={`tk${i}`} x1={SPINE_X - 20} y1={y} x2={SPINE_X + 20} y2={y} stroke={accent} strokeWidth={5} strokeLinecap="round" opacity={op} />;
                })}
              </g>
            ) : null}

            {/* the scorer folding to a dot */}
            <g>
              <circle cx={scorerPos.x} cy={scorerPos.y} r={scorerR} fill="none" stroke={ink} strokeWidth={8 - 4 * scorerFold} opacity={0.62 * (1 - scorerFold)} />
              <circle cx={scorerPos.x} cy={scorerPos.y} r={46 * (1 - scorerFold) + 12 * scorerFold} fill="none" stroke={accent} strokeWidth={7} opacity={1 - scorerFold} />
              <circle cx={scorerPos.x} cy={scorerPos.y} r={22 * (1 - scorerFold) + 12 * scorerFold} fill="none" stroke={accent} strokeWidth={7} opacity={1 - scorerFold} />
              <circle cx={scorerPos.x} cy={scorerPos.y} r={8 + 4 * scorerFold} fill={accent} />
            </g>

            {/* the evidence bars folding to a dot */}
            {EVIDENCE.rows.map((w, i) => {
              const y0 = EVIDENCE.y + (i - 1) * EVIDENCE.gap;
              const y = y0 + (evPos.y - y0) * evFold;
              const ww = w * (1 - evFold) + 24 * evFold;
              return (
                <line key={`ev${i}`} x1={evPos.x - ww / 2} y1={y} x2={evPos.x + ww / 2} y2={y} stroke={accent} strokeWidth={9} strokeLinecap="round" opacity={i === 1 ? 1 : 1 - evFold} />
              );
            })}

            {/* ghosts of the sacrificed */}
            {CHOSEN.map((id) => {
              const n = NODES[NODE_INDEX.get(id)!];
              if (ghostGone <= 0) return null;
              return <circle key={`g${id}`} cx={n.x} cy={n.y} r={25} fill="none" stroke={ink} strokeWidth={4} strokeDasharray="10 9" opacity={ghostGone} />;
            })}

            {/* the agents, folding to event dots */}
            {NODES.map((n, i) => {
              const st = states[i];
              if (st.r <= 0.5) return null;
              return <circle key={n.id} cx={st.x} cy={st.y} r={st.r} fill={accent} />;
            })}

            {/* the playhead */}
            {playIn > 0 ? (
              <rect x={SPINE_X - 40} y={playY - 6} width={80} height={12} rx={5} fill={ink} opacity={playIn} />
            ) : null}

            {/* the cheat: a bright run down the spine, then out both ways */}
            {wayT > 0 && wayT < 1 ? (
              <line
                x1={SPINE_X}
                y1={SPINE_Y0 + (TASK_ROW_Y - TASK_R - SPINE_Y0) * Math.max(0, wayT - 0.25)}
                x2={SPINE_X}
                y2={SPINE_Y0 + (TASK_ROW_Y - TASK_R - SPINE_Y0) * wayT}
                stroke={ink}
                strokeWidth={SPINE_W + 2}
                strokeLinecap="round"
              />
            ) : null}
            {outT > 0
              ? [-1, 1].map((dir) => (
                  <line
                    key={`out${dir}`}
                    x1={SPINE_X + dir * TASK_R}
                    y1={TASK_ROW_Y}
                    x2={SPINE_X + dir * (TASK_R + (TASK_XS[2] - TASK_XS[1] - 2 * TASK_R) * outT)}
                    y2={TASK_ROW_Y}
                    stroke={accent}
                    strokeWidth={SPINE_W}
                    strokeLinecap="round"
                  />
                ))
              : null}
            {TASK_XS.map((x, i) => {
              const draw = taskDraw(i);
              if (draw <= 0) return null;
              const fill = frame >= FILL_AT[i] ? fillOf(i) : 0;
              const breath = 1 + 0.03 * Math.sin(frame * 0.1 + i * 2.1);
              return (
                <g key={`task${i}`}>
                  <circle
                    cx={x}
                    cy={TASK_ROW_Y}
                    r={TASK_R * breath}
                    fill="none"
                    stroke={ink}
                    strokeWidth={8}
                    pathLength={1000}
                    strokeDasharray={1000}
                    strokeDashoffset={1000 * (1 - draw)}
                    transform={`rotate(-90 ${x} ${TASK_ROW_Y})`}
                    opacity={1 - 0.38 * fill}
                  />
                  {fill > 0 ? <circle cx={x} cy={TASK_ROW_Y} r={(TASK_R - 12) * fill * breath} fill={accent} /> : null}
                </g>
              );
            })}
          </svg>

          <Img
            src={staticFile("openai-chatgpt-logo.png")}
            style={{
              position: "absolute",
              left: logoPos.x - logoSize / 2,
              top: logoPos.y - logoSize / 2,
              width: logoSize,
              height: logoSize,
              filter: "brightness(0) invert(1)",
              transform: `scale(${logoBreath * (1 - 0.16 * (1 - enter))}) rotate(${-11 * (1 - enter)}deg)`,
              transformOrigin: "center center",
            }}
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default SubjectiveLongTimeV2;
