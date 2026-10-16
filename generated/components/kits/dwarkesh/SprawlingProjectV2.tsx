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
// Dwarkesh, "within days of being spawned, the agents had organized a sprawling
// project to reverse-engineer the scorer, falsify evidence, and even
// strategically sacrifice themselves for the good of the collective"
// — SRT 6.379s -> 15.839s. round(9.46 * 24) = 227.
export const DURATION = 227;

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
  beats: z.object({
    withinDays: z.number(), // "within days of"
    spawned: z.number(), // "being spawned"
    agents: z.number(), // "the agents had"
    organized: z.number(), // "organized a"
    sprawling: z.number(), // "sprawling"
    project: z.number(), // "project to"
    reverse: z.number(), // "reverse"
    engineer: z.number(), // "engineer"
    scorer: z.number(), // "the score(r)"
    falsify: z.number(), // "falsify"
    evidence: z.number(), // "evidence"
    andEven: z.number(), // "and even"
    strategically: z.number(), // "strategically"
    sacrifice: z.number(), // "sacrifice"
    themselves: z.number(), // "themselves"
    forTheGood: z.number(), // "for the good of"
    collective: z.number(), // "the collective"
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
  packetOpacity: 0.42,
  beats: {
    withinDays: 0,
    spawned: 16,
    agents: 32,
    organized: 45,
    sprawling: 58,
    project: 71,
    reverse: 85,
    engineer: 93,
    scorer: 102,
    falsify: 121,
    evidence: 133,
    andEven: 144,
    strategically: 155,
    sacrifice: 169,
    themselves: 182,
    forTheGood: 192,
    collective: 215,
  },
});

type P = { x: number; y: number };

const WORLD_W = 1080;
const WORLD_H = 3000;

const LOGO = { x: 540, y: 600, size: 300 };
const ROOT: P = { x: 540, y: 760 };

// The two human-made things the project targets. Both are ink, both are made
// of the same circles and bars as everything else — no props.
const SCORER = { x: 330, y: 1700, r: 72 }; // a sealed ring
const EVIDENCE = { x: 540, y: 2070, rows: [150, 110, 130], gap: 44 }; // three bars
const EVIDENCE_TOP: P = { x: EVIDENCE.x, y: EVIDENCE.y - EVIDENCE.gap - 30 };
const SCORER_TOP: P = { x: SCORER.x, y: SCORER.y - SCORER.r };
const FALSE_ROWS = [110, 150, 90];

const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

const hash = (i: number, k: number) => {
  const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return s - Math.floor(s);
};

type NodeDef = {
  id: string;
  x: number;
  y: number;
  r: number;
  parent: string | null;
  depth: number;
  wave: number;
};

const K_C: P = { x: 760, y: 2500 };
const K_R = 130;

const NODES: NodeDef[] = [
  { id: "A", x: 330, y: 1080, r: 28, parent: "root", depth: 1, wave: 0 },
  { id: "B", x: 540, y: 1130, r: 28, parent: "root", depth: 1, wave: 0 },
  { id: "C", x: 750, y: 1080, r: 28, parent: "root", depth: 1, wave: 0 },
  { id: "A1", x: 250, y: 1280, r: 21, parent: "A", depth: 2, wave: 1 },
  { id: "A2", x: 330, y: 1460, r: 21, parent: "A1", depth: 3, wave: 2 },
  { id: "B1", x: 620, y: 1350, r: 21, parent: "B", depth: 2, wave: 0 },
  { id: "B2", x: 500, y: 1580, r: 21, parent: "B1", depth: 3, wave: 1 },
  { id: "B3", x: 580, y: 1800, r: 21, parent: "B2", depth: 4, wave: 2 },
  { id: "C1", x: 830, y: 1300, r: 21, parent: "C", depth: 2, wave: 0 },
  { id: "C2", x: 770, y: 1520, r: 21, parent: "C1", depth: 3, wave: 1 },
  { id: "C3", x: 860, y: 1760, r: 21, parent: "C2", depth: 4, wave: 2 },
  { id: "C4", x: 790, y: 2010, r: 21, parent: "C3", depth: 5, wave: 0 },
  { id: "C5", x: 820, y: 2250, r: 21, parent: "C4", depth: 6, wave: 1 },
  { id: "K0", x: K_C.x, y: K_C.y, r: 27, parent: "C5", depth: 7, wave: 2 },
  ...Array.from({ length: 6 }, (_, i) => {
    const a = (i * 60 * Math.PI) / 180;
    return {
      id: `K${i + 1}`,
      x: Math.round(K_C.x + Math.cos(a) * K_R),
      y: Math.round(K_C.y + Math.sin(a) * K_R),
      r: 25,
      parent: "K0",
      depth: 8,
      wave: i % 3,
    };
  }),
];
const NODE_INDEX = new Map(NODES.map((n, i) => [n.id, i]));
const CHOSEN = ["K2", "K3", "K4"];
const SURVIVORS = ["K0", "K1", "K5", "K6"];
const CHAIN_UP = ["K0", "C5", "C4", "C3", "C2", "C1", "C"];

// A handful of twigs, all sprouting on "sprawling" and done before the first
// branch beat, so the structure is settled by the time the camera goes in.
type Twig = { p: string; a: number; l: number; f: number };
const TWIGS: Twig[] = [
  { p: "A", a: 200, l: 120, f: 0 },
  { p: "C", a: -20, l: 120, f: 2 },
  { p: "B1", a: 20, l: 100, f: 5 },
  { p: "A1", a: 190, l: 100, f: 8 },
  { p: "C1", a: 0, l: 120, f: 10 },
  { p: "B2", a: 190, l: 110, f: 13 },
  { p: "C2", a: -30, l: 100, f: 16 },
  { p: "C3", a: 10, l: 120, f: 19 },
  { p: "A2", a: 210, l: 90, f: 22 },
  { p: "C4", a: -25, l: 110, f: 25 },
];

// Camera — own keyed track, damped, leading each beat by ~10 frames.
const CAM_F = [0, 14, 26, 36, 48, 60, 68, 74, 96, 106, 114, 128, 136, 146, 176, 180, 204, DURATION];
const CAM_CY = [
  980, 980, 1020, 1120, 1300, 1380, 1520, 1660, 1680, 1850, 2060, 2080, 2250, 2470, 2500, 2500,
  1671, 1671,
];
const CAM_K = [1.25, 1.25, 1.2, 1.0, 0.82, 0.8, 1.12, 1.25, 1.25, 1.15, 1.25, 1.25, 1.15, 1.25, 1.22, 1.22, 0.66, 0.66];
const CAM_CX = [540, 540, 540, 540, 540, 540, 460, 420, 420, 480, 540, 540, 620, 680, 680, 680, 540, 540];
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

type NodeState = { x: number; y: number; scale: number; opacity: number; arrive: number };

const arcPath = (cx: number, cy: number, r: number, a0: number, a1: number) => {
  const p = (a: number) => `${(cx + Math.cos(a) * r).toFixed(1)} ${(cy + Math.sin(a) * r).toFixed(1)}`;
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M ${p(a0)} A ${r} ${r} 0 ${large} 1 ${p(a1)}`;
};

const SprawlingProjectV2: React.FC<Props> = ({
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
  beats,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const WAVES = [beats.withinDays, (beats.withinDays + beats.spawned) / 2, beats.spawned];

  const pulseAt = (depth: number) => beats.collective + (8 - depth) * 0.8;
  const pulseBump = (depth: number) =>
    interpolate(frame, [pulseAt(depth), pulseAt(depth) + 3, pulseAt(depth) + 12], [0, 1, 0], {
      ...clamp,
      easing: Easing.inOut(Easing.quad),
    });

  // -- nodes ----------------------------------------------------------------
  const states: NodeState[] = NODES.map((n, i) => {
    const wf = WAVES[n.wave];
    const cloud = { x: 540 + (hash(i, 1) - 0.5) * 440, y: 880 + hash(i, 2) * 460 };
    const wander = {
      x: 8 * Math.sin(frame * 0.1 + hash(i, 3) * 6.28),
      y: 8 * Math.cos(frame * 0.08 + hash(i, 4) * 6.28),
    };
    const eject = interpolate(frame, [wf, wf + 16], [0, 1], {
      ...clamp,
      easing: Easing.out(Easing.cubic),
    });
    const depart = beats.agents + 2 + n.depth * 3.5 + hash(i, 5) * 2;
    const arrive = depart + 14;
    const snap = interpolate(frame, [depart, arrive], [0, 1], {
      ...clamp,
      easing: Easing.inOut(Easing.cubic),
    });
    const px = LOGO.x + (cloud.x - LOGO.x) * eject + wander.x * (1 - snap);
    const py = LOGO.y + (cloud.y - LOGO.y) * eject + wander.y * (1 - snap);
    const x = px + (n.x - px) * snap;
    const y = py + (n.y - py) * snap;

    const pop = spring({ frame: frame - wf, fps, config: { damping: 10, stiffness: 140, mass: 0.7 } });
    const breath = 1 + 0.04 * Math.sin(frame * 0.12 + hash(i, 6) * 6.28);
    const land = interpolate(frame, [arrive - 2, arrive + 2, arrive + 10], [0, 1, 0], {
      ...clamp,
      easing: Easing.inOut(Easing.quad),
    });
    let scale = pop * breath * (1 + 0.14 * land) * (1 + 0.2 * pulseBump(n.depth));
    let opacity = interpolate(frame, [wf, wf + 3], [0, 1], clamp);

    if (SURVIVORS.includes(n.id)) {
      const swell = spring({
        frame: frame - beats.themselves,
        fps,
        config: { damping: 11, stiffness: 110, mass: 0.9 },
      });
      scale *= 1 + 0.2 * swell;
    }
    if (CHOSEN.includes(n.id)) {
      const go = interpolate(frame, [beats.sacrifice, beats.sacrifice + 3, beats.sacrifice + 10], [1, 1.25, 0], {
        ...clamp,
        easing: Easing.out(Easing.quad),
      });
      scale *= go;
      opacity *= interpolate(frame, [beats.sacrifice + 5, beats.sacrifice + 10], [1, 0], clamp);
    }
    return { x, y, scale, opacity, arrive };
  });

  const posOf = (id: string): P =>
    id === "root" ? ROOT : { x: states[NODE_INDEX.get(id)!].x, y: states[NODE_INDEX.get(id)!].y };
  const arriveOf = (id: string) => states[NODE_INDEX.get(id)!].arrive;

  // -- camera ---------------------------------------------------------------
  const cam = camera(frame);
  const cy = cam.cy + 5 * Math.sin(frame / 19);
  const cx = cam.cx + 3 * Math.sin(frame / 23);
  const k = cam.k;
  const tx = 540 - cx * k;
  const ty = 960 - cy * k;
  const bgY = -(cy - CAM_CY[0]) * k * parallax - frame * 0.3;
  const bgX = -(cx - 540) * k * parallax;
  const bgScale = 1 + (k - 1) * 0.3;

  // -- logo -----------------------------------------------------------------
  const enter = spring({ frame, fps, config: { damping: 14, stiffness: 110, mass: 0.9 } });
  const logoBreath = 1 + 0.012 * Math.sin(frame / 21);
  let logoThrob = 0;
  for (const wf of WAVES) {
    logoThrob += interpolate(frame, [wf - 3, wf, wf + 10], [0, 1, 0], {
      ...clamp,
      easing: Easing.inOut(Easing.quad),
    });
  }
  const logoScale =
    logoBreath * (1 - 0.04 * logoThrob + 0.05 * pulseBump(0)) * (1 - 0.16 * (1 - enter));

  // -- the scorer: a sealed ink ring, read by an orbiting accent arc ---------
  const scorerEdgeStart = arriveOf("A2") + 2;
  const scorerEdge = interpolate(frame, [scorerEdgeStart, scorerEdgeStart + 8], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.quad),
  });
  const scorerDraw = interpolate(frame, [scorerEdgeStart + 6, scorerEdgeStart + 18], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  // Two full orbits between "reverse" and "the scorer".
  const orbit = interpolate(frame, [beats.reverse, beats.scorer], [0, 2], {
    ...clamp,
    easing: Easing.inOut(Easing.quad),
  });
  const orbitOpacity = interpolate(
    frame,
    [beats.reverse - 2, beats.reverse, beats.scorer, beats.scorer + 8],
    [0, 1, 1, 0],
    clamp,
  );
  // Each inner ring is drawn by the orbit: the first on the first pass, the
  // second on the second — understanding going inward.
  const inner1 = interpolate(orbit, [0.15, 1.0], [0, 1], clamp);
  const inner2 = interpolate(orbit, [1.1, 1.95], [0, 1], clamp);
  const scorerRecede = interpolate(frame, [beats.scorer, beats.scorer + 10], [1, 0.62], {
    ...clamp,
    easing: Easing.inOut(Easing.quad),
  });
  const coreIn = spring({
    frame: frame - beats.scorer,
    fps,
    config: { damping: 12, stiffness: 160, mass: 0.7 },
  });

  // -- the evidence: three ink bars, rewritten in accent ----------------------
  const evEdgeStart = arriveOf("B3") + 2;
  const evEdge = interpolate(frame, [evEdgeStart, evEdgeStart + 8], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.quad),
  });
  const rowY = (i: number) => EVIDENCE.y + (i - 1) * EVIDENCE.gap;
  const rowStep = (beats.evidence - beats.falsify) / 3;

  // -- the sacrifice --------------------------------------------------------
  const chosenFade = interpolate(frame, [beats.sacrifice, beats.sacrifice + 10], [1, 0.15], clamp);
  const ghostIn = interpolate(frame, [beats.sacrifice + 5, beats.sacrifice + 14], [0, 0.16], clamp);

  // -- helpers --------------------------------------------------------------
  const packetOffset = (phase: number) => -((frame * packetSpeed + phase * 1000) % 500);

  const edgeEl = (
    key: string,
    from: P,
    to: P,
    drawn: number,
    opts: { width?: number; opacity?: number; phase?: number; depth?: number; reversePulse?: number; flash?: number } = {},
  ) => {
    if (drawn <= 0) return null;
    const d = `M ${from.x.toFixed(1)} ${from.y.toFixed(1)} L ${to.x.toFixed(1)} ${to.y.toFixed(1)}`;
    const bump = opts.depth === undefined ? 0 : pulseBump(opts.depth);
    const w = (opts.width ?? edgeWidth) + 2 * bump + 2 * (opts.flash ?? 0);
    const op = opts.opacity ?? 1;
    const rp = opts.reversePulse ?? -1;
    return (
      <g key={key}>
        <path
          d={d}
          fill="none"
          stroke={accent}
          strokeWidth={w}
          strokeLinecap="round"
          pathLength={1000}
          strokeDasharray={1000}
          strokeDashoffset={1000 * (1 - drawn)}
          opacity={op * Math.min(1, 0.8 + 0.2 * bump + 0.2 * (opts.flash ?? 0))}
        />
        {drawn > 0.02 && drawn < 1 ? (
          <circle cx={from.x + (to.x - from.x) * drawn} cy={from.y + (to.y - from.y) * drawn} r={w * 0.75} fill={ink} opacity={op} />
        ) : null}
        {drawn >= 1 && opts.phase !== undefined ? (
          <path
            d={d}
            fill="none"
            stroke={ink}
            strokeWidth={w}
            strokeLinecap="round"
            pathLength={1000}
            strokeDasharray="22 478"
            strokeDashoffset={packetOffset(opts.phase)}
            opacity={op * packetOpacity}
          />
        ) : null}
        {rp >= 0 && rp <= 1 ? (
          <path
            d={d}
            fill="none"
            stroke={ink}
            strokeWidth={w + 3}
            strokeLinecap="round"
            pathLength={1000}
            strokeDasharray="80 920"
            strokeDashoffset={-920 * (1 - rp)}
            opacity={op}
          />
        ) : null}
      </g>
    );
  };

  const chainPulse = (id: string) => {
    const j = CHAIN_UP.indexOf(id);
    if (j < 0) return -1;
    const start = beats.sacrifice + 11 + j * 3;
    if (frame < start || frame > start + 6) return -1;
    return (frame - start) / 6;
  };
  const spokePulse = (id: string) => {
    const j = CHOSEN.indexOf(id);
    if (j < 0) return -1;
    const start = beats.sacrifice + 3 + j * 2;
    if (frame < start || frame > start + 7) return -1;
    return (frame - start) / 7;
  };

  const orbitA0 = -Math.PI / 2 + orbit * Math.PI * 2;

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
            {/* spawn rings */}
            {WAVES.map((wf, i) => {
              const t = interpolate(frame, [wf, wf + 14], [0, 1], {
                ...clamp,
                easing: Easing.out(Easing.quad),
              });
              if (frame < wf || t >= 1) return null;
              return (
                <circle
                  key={`ring${i}`}
                  cx={LOGO.x}
                  cy={LOGO.y}
                  r={150 + 120 * t}
                  fill="none"
                  stroke={ink}
                  strokeWidth={4}
                  opacity={0.6 * (1 - t)}
                />
              );
            })}

            {/* edges */}
            {NODES.map((n, i) => {
              if (!n.parent) return null;
              const st = states[i];
              const drawn = interpolate(frame, [st.arrive - 2, st.arrive + 6], [0, 1], {
                ...clamp,
                easing: Easing.out(Easing.quad),
              });
              const chosen = CHOSEN.includes(n.id);
              // A short bright click as the edge completes.
              const flash = interpolate(frame, [st.arrive + 5, st.arrive + 7, st.arrive + 16], [0, 1, 0], { ...clamp, easing: Easing.inOut(Easing.quad) });
              return edgeEl(`e${n.id}`, posOf(n.parent), posOf(n.id), drawn, {
                flash,
                phase: hash(i, 7),
                depth: n.depth,
                opacity: chosen ? chosenFade : 1,
                reversePulse: chosen ? spokePulse(n.id) : chainPulse(n.id),
              });
            })}
            {edgeEl("eScorer", posOf("A2"), SCORER_TOP, scorerEdge, { phase: 0.31, depth: 4 })}
            {edgeEl("eEvidence", posOf("B3"), EVIDENCE_TOP, evEdge, { phase: 0.77, depth: 5 })}

            {/* twigs */}
            {TWIGS.map((t, i) => {
              const start = beats.sprawling + t.f;
              const grow = interpolate(frame, [start, start + 12], [0, 1], {
                ...clamp,
                easing: Easing.out(Easing.cubic),
              });
              if (grow <= 0) return null;
              const from = posOf(t.p);
              const a = (t.a * Math.PI) / 180;
              const to = { x: from.x + Math.cos(a) * t.l, y: from.y + Math.sin(a) * t.l };
              const leaf = spring({ frame: frame - (start + 7), fps, config: { damping: 11, stiffness: 160, mass: 0.6 } });
              const leafBreath = 1 + 0.05 * Math.sin(frame * 0.13 + hash(i, 8) * 6.28);
              const bump = pulseBump(9);
              return (
                <g key={`t${i}`}>
                  <path
                    d={`M ${from.x.toFixed(1)} ${from.y.toFixed(1)} L ${to.x.toFixed(1)} ${to.y.toFixed(1)}`}
                    fill="none"
                    stroke={accent}
                    strokeWidth={5 + 1.5 * bump}
                    strokeLinecap="round"
                    pathLength={1000}
                    strokeDasharray={1000}
                    strokeDashoffset={1000 * (1 - grow)}
                    opacity={0.8}
                  />
                  {frame >= start + 7 ? (
                    <circle cx={to.x} cy={to.y} r={10 * leaf * leafBreath * (1 + 0.2 * bump)} fill={accent} />
                  ) : null}
                </g>
              );
            })}

            {/* the scorer */}
            {scorerDraw > 0 ? (
              <g>
                <circle
                  cx={SCORER.x}
                  cy={SCORER.y}
                  r={SCORER.r}
                  fill="none"
                  stroke={ink}
                  strokeWidth={8}
                  pathLength={1000}
                  strokeDasharray={1000}
                  strokeDashoffset={1000 * (1 - scorerDraw)}
                  transform={`rotate(-90 ${SCORER.x} ${SCORER.y})`}
                  opacity={scorerRecede}
                />
                {inner1 > 0 ? (
                  <circle
                    cx={SCORER.x}
                    cy={SCORER.y}
                    r={46}
                    fill="none"
                    stroke={accent}
                    strokeWidth={7}
                    pathLength={1000}
                    strokeDasharray={1000}
                    strokeDashoffset={1000 * (1 - inner1)}
                    transform={`rotate(-90 ${SCORER.x} ${SCORER.y})`}
                  />
                ) : null}
                {inner2 > 0 ? (
                  <circle
                    cx={SCORER.x}
                    cy={SCORER.y}
                    r={22}
                    fill="none"
                    stroke={accent}
                    strokeWidth={7}
                    pathLength={1000}
                    strokeDasharray={1000}
                    strokeDashoffset={1000 * (1 - inner2)}
                    transform={`rotate(-90 ${SCORER.x} ${SCORER.y})`}
                  />
                ) : null}
                {frame >= beats.scorer ? (
                  <circle cx={SCORER.x} cy={SCORER.y} r={8 * coreIn} fill={accent} />
                ) : null}
                {orbitOpacity > 0 ? (
                  <path
                    d={arcPath(SCORER.x, SCORER.y, SCORER.r + 22, orbitA0 - 1.1, orbitA0)}
                    fill="none"
                    stroke={accent}
                    strokeWidth={7}
                    strokeLinecap="round"
                    opacity={orbitOpacity}
                  />
                ) : null}
              </g>
            ) : null}

            {/* the evidence */}
            {EVIDENCE.rows.map((w, i) => {
              const rowStart = evEdgeStart + 8 + i * 3;
              const drawn = interpolate(frame, [rowStart, rowStart + 7], [0, 1], {
                ...clamp,
                easing: Easing.out(Easing.cubic),
              });
              if (drawn <= 0) return null;
              const tF = beats.falsify + i * rowStep;
              const wipe = interpolate(frame, [tF, tF + 7], [0, 1], {
                ...clamp,
                easing: Easing.inOut(Easing.cubic),
              });
              const y = rowY(i);
              const inkW = w * drawn;
              const falseW = FALSE_ROWS[i];
              // The bar is rewritten left to right: the accent bar grows to its
              // own length while the ink bar retreats ahead of it.
              const inkStart = EVIDENCE.x - inkW / 2;
              const inkRemain = inkW * (1 - wipe);
              const accW = falseW * wipe;
              const accStart = EVIDENCE.x - falseW / 2;
              const bump = 1 + 0.2 * pulseBump(6);
              return (
                <g key={`row${i}`}>
                  {inkRemain > 1 ? (
                    <line
                      x1={inkStart + inkW - inkRemain}
                      y1={y}
                      x2={inkStart + inkW}
                      y2={y}
                      stroke={ink}
                      strokeWidth={9}
                      strokeLinecap="round"
                      opacity={0.92}
                    />
                  ) : null}
                  {accW > 1 ? (
                    <line
                      x1={accStart}
                      y1={y}
                      x2={accStart + accW}
                      y2={y}
                      stroke={accent}
                      strokeWidth={9 * bump}
                      strokeLinecap="round"
                    />
                  ) : null}
                  {wipe > 0 && wipe < 1 ? (
                    <circle cx={accStart + accW} cy={y} r={6} fill={ink} />
                  ) : null}
                </g>
              );
            })}

            {/* selection rings and ghosts */}
            {CHOSEN.map((id, j) => {
              const st = states[NODE_INDEX.get(id)!];
              const ringStart = beats.strategically + j * 4;
              const ringDraw = interpolate(frame, [ringStart, ringStart + 8], [0, 1], {
                ...clamp,
                easing: Easing.out(Easing.quad),
              });
              const ringOut = interpolate(frame, [beats.sacrifice, beats.sacrifice + 10], [0, 1], {
                ...clamp,
                easing: Easing.out(Easing.quad),
              });
              return (
                <g key={`c${id}`}>
                  {ringDraw > 0 && ringOut < 1 ? (
                    <circle
                      cx={st.x}
                      cy={st.y}
                      r={44 + 50 * ringOut}
                      fill="none"
                      stroke={accent}
                      strokeWidth={4}
                      pathLength={1000}
                      strokeDasharray={1000}
                      strokeDashoffset={1000 * (1 - ringDraw)}
                      opacity={1 - ringOut}
                      transform={`rotate(-90 ${st.x} ${st.y})`}
                    />
                  ) : null}
                  {ghostIn > 0 ? (
                    <circle
                      cx={st.x}
                      cy={st.y}
                      r={25}
                      fill="none"
                      stroke={ink}
                      strokeWidth={4}
                      strokeDasharray="10 9"
                      opacity={ghostIn}
                    />
                  ) : null}
                </g>
              );
            })}

            {/* the agents */}
            {NODES.map((n, i) => {
              const st = states[i];
              if (st.opacity <= 0 || st.scale <= 0) return null;
              return (
                <circle key={n.id} cx={st.x} cy={st.y} r={n.r * st.scale} fill={accent} opacity={st.opacity} />
              );
            })}
          </svg>

          <Img
            src={staticFile("openai-chatgpt-logo.png")}
            style={{
              position: "absolute",
              left: LOGO.x - LOGO.size / 2,
              top: LOGO.y - LOGO.size / 2,
              width: LOGO.size,
              height: LOGO.size,
              filter: "brightness(0) invert(1)",
              transform: `scale(${logoScale}) rotate(${-11 * (1 - enter)}deg)`,
              transformOrigin: "center center",
            }}
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default SprawlingProjectV2;
