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
  packetSpeed: 13,
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
const ROOT: P = { x: 540, y: 760 }; // where the tree leaves the logo

const BOX = { x: 330, y: 1680, w: 300, h: 220 }; // the scorer
const DOC = { x: 540, y: 2060, w: 240, h: 310 }; // the evidence
const BOX_TOP: P = { x: BOX.x, y: BOX.y - BOX.h / 2 };
const DOC_TOP: P = { x: DOC.x, y: DOC.y - DOC.h / 2 };

const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

const hash = (i: number, k: number) => {
  const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return s - Math.floor(s);
};

// ---------------------------------------------------------------------------
// The tree
//
// Every agent is a dot. They are all ejected from the logo in three waves
// ("within days" — three days, three bursts), drift as a loose cloud, and then
// snap into a tree when "organized" lands. The tree is laid out as a staircase
// descending left-to-right so the camera keeps travelling downward as it visits
// each branch, and the pull-back reveals one sprawling structure.
// ---------------------------------------------------------------------------
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
const CHOSEN = ["K2", "K3", "K4"]; // the three that get sacrificed
const SURVIVORS = ["K0", "K1", "K5", "K6"];
// The chain the sacrificed energy runs back up, leaf first.
const CHAIN_UP = ["K0", "C5", "C4", "C3", "C2", "C1", "C"];

// Twigs keep sprouting off the structure for the rest of the piece, so the
// tree is never finished — it just keeps sprawling. `f` is relative to the
// "sprawling" beat.
type Twig = { p: string; a: number; l: number; f: number };
const TWIGS: Twig[] = [
  { p: "A", a: 200, l: 130, f: 0 },
  { p: "C", a: -20, l: 130, f: 2 },
  { p: "A1", a: 180, l: 100, f: 5 },
  { p: "B1", a: 20, l: 110, f: 8 },
  { p: "C1", a: 0, l: 140, f: 10 },
  { p: "A2", a: 210, l: 100, f: 14 },
  { p: "B2", a: 190, l: 120, f: 17 },
  { p: "C2", a: -30, l: 110, f: 20 },
  { p: "A1", a: 230, l: 80, f: 26 },
  { p: "C3", a: 10, l: 130, f: 32 },
  { p: "B3", a: 20, l: 100, f: 40 },
  { p: "C4", a: -25, l: 120, f: 50 },
  { p: "B", a: 160, l: 100, f: 60 },
  { p: "C5", a: 0, l: 110, f: 70 },
  { p: "A2", a: 160, l: 90, f: 82 },
  { p: "B2", a: 0, l: 90, f: 92 },
  { p: "C3", a: 40, l: 90, f: 104 },
  { p: "B3", a: 200, l: 110, f: 118 },
  { p: "C1", a: -60, l: 100, f: 138 },
  { p: "A", a: 150, l: 100, f: 148 },
];

// ---------------------------------------------------------------------------
// Camera — its own keyed track, damped, never chasing the subject. Keys lead
// the beats by ~10 frames so the follow has settled when each branch's action
// starts; the pull-back is a ramped key on the same track.
// ---------------------------------------------------------------------------
const CAM_F = [0, 14, 26, 36, 48, 60, 68, 74, 96, 106, 114, 128, 136, 146, 176, 180, 204, DURATION];
const CAM_CY = [
  980, 980, 1020, 1120, 1300, 1380, 1520, 1650, 1670, 1850, 2040, 2060, 2250, 2470, 2500, 2500,
  1560, 1560,
];
const CAM_K = [1.25, 1.25, 1.2, 1.0, 0.82, 0.8, 1.2, 1.5, 1.5, 1.3, 1.5, 1.5, 1.3, 1.45, 1.4, 1.4, 0.74, 0.74];
const CAM_CX = [540, 540, 540, 540, 540, 540, 420, 360, 360, 460, 540, 540, 640, 740, 740, 740, 540, 540];
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

type NodeState = {
  x: number;
  y: number;
  scale: number;
  opacity: number;
  arrive: number;
};

const SprawlingProject: React.FC<Props> = ({
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
  beats,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const WAVES = [beats.withinDays, (beats.withinDays + beats.spawned) / 2, beats.spawned];

  // Depth-ordered pulse for the final "collective" beat: leaves first, then the
  // wave runs up to the root.
  const pulseAt = (depth: number) => beats.collective + (8 - depth) * 0.8;
  const pulseBump = (depth: number) =>
    interpolate(frame, [pulseAt(depth), pulseAt(depth) + 3, pulseAt(depth) + 11], [0, 1, 0], {
      ...clamp,
      easing: Easing.inOut(Easing.quad),
    });

  // -- node states ----------------------------------------------------------
  const states: NodeState[] = NODES.map((n, i) => {
    const wf = WAVES[n.wave];
    const cloud = {
      x: 540 + (hash(i, 1) - 0.5) * 440,
      y: 880 + hash(i, 2) * 460,
    };
    const wander = {
      x: 9 * Math.sin(frame * 0.11 + hash(i, 3) * 6.28),
      y: 9 * Math.cos(frame * 0.09 + hash(i, 4) * 6.28),
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

    const pop = spring({ frame: frame - wf, fps, config: { damping: 10, stiffness: 160, mass: 0.7 } });
    const breath = 1 + 0.05 * Math.sin(frame * 0.13 + hash(i, 6) * 6.28);
    const land = interpolate(frame, [arrive - 2, arrive + 2, arrive + 9], [0, 1, 0], {
      ...clamp,
      easing: Easing.inOut(Easing.quad),
    });
    let scale = pop * breath * (1 + 0.22 * land) * (1 + 0.3 * pulseBump(n.depth));
    let opacity = interpolate(frame, [wf, wf + 3], [0, 1], clamp);

    if (SURVIVORS.includes(n.id)) {
      const swell = spring({
        frame: frame - beats.themselves,
        fps,
        config: { damping: 9, stiffness: 120, mass: 0.9 },
      });
      scale *= 1 + 0.25 * swell;
    }
    if (CHOSEN.includes(n.id)) {
      const blinkOn = frame >= beats.sacrifice - 4 && frame < beats.sacrifice;
      const blink = blinkOn ? (Math.floor((frame - (beats.sacrifice - 4)) / 2) % 2 === 0 ? 0.3 : 1) : 1;
      const go = interpolate(frame, [beats.sacrifice, beats.sacrifice + 3, beats.sacrifice + 9], [1, 1.35, 0], {
        ...clamp,
        easing: Easing.out(Easing.quad),
      });
      scale *= go;
      opacity *= blink * interpolate(frame, [beats.sacrifice + 5, beats.sacrifice + 9], [1, 0], clamp);
    }
    return { x, y, scale, opacity, arrive };
  });

  const posOf = (id: string): P =>
    id === "root" ? ROOT : { x: states[NODE_INDEX.get(id)!].x, y: states[NODE_INDEX.get(id)!].y };
  const arriveOf = (id: string) => states[NODE_INDEX.get(id)!].arrive;

  // -- camera ---------------------------------------------------------------
  const cam = camera(frame);
  const cy = cam.cy + 6 * Math.sin(frame / 19);
  const cx = cam.cx + 4 * Math.sin(frame / 23);
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
  const logoPulse = pulseBump(0);
  const logoScale = logoBreath * (1 - 0.05 * logoThrob + 0.06 * logoPulse) * (1 - 0.16 * (1 - enter));

  // -- box A: the scorer, x-rayed -------------------------------------------
  const boxEdgeStart = arriveOf("A2") + 2;
  const boxEdge = interpolate(frame, [boxEdgeStart, boxEdgeStart + 8], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.quad),
  });
  const boxDraw = interpolate(frame, [boxEdgeStart + 6, boxEdgeStart + 18], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  const scanT = interpolate(frame, [beats.reverse, beats.scorer], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.quad),
  });
  const scanY = BOX.y - BOX.h / 2 + 8 + (BOX.h - 16) * scanT;
  const scanOpacity = interpolate(
    frame,
    [beats.reverse - 2, beats.reverse, beats.scorer, beats.scorer + 6],
    [0, 1, 1, 0],
    clamp,
  );
  const boxRecede = interpolate(frame, [beats.scorer, beats.scorer + 8], [1, 0.62], {
    ...clamp,
    easing: Easing.inOut(Easing.quad),
  });
  const gearSpin = Math.max(0, frame - beats.engineer) * 1.3;
  const bigGear = { x: BOX.x - 32, y: BOX.y + 6, r: 46, teeth: 8, hub: 16 };
  const smallGear = { x: BOX.x + 56, y: BOX.y + 34, r: 28, teeth: 6, hub: 10 };
  const scorerPulse = interpolate(frame, [beats.scorer, beats.scorer + 12], [0, 1], clamp);

  // -- doc B: the evidence, rewritten ---------------------------------------
  const docEdgeStart = arriveOf("B3") + 2;
  const docEdge = interpolate(frame, [docEdgeStart, docEdgeStart + 8], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.quad),
  });
  const docDraw = interpolate(frame, [docEdgeStart + 6, docEdgeStart + 18], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  const ROW_W = [150, 120, 160, 110, 140, 90];
  const ROW_W2 = [110, 160, 90, 150, 120, 140];
  const rowY = (i: number) => DOC.y - DOC.h / 2 + 44 + i * 42;
  const rowX = DOC.x - DOC.w / 2 + 30;
  const rowStep = (beats.evidence - beats.falsify) / 5.5;
  const cursorY = interpolate(
    frame,
    [beats.falsify - 2, beats.evidence + 1],
    [rowY(0) - 26, rowY(5) + 26],
    { ...clamp, easing: Easing.inOut(Easing.quad) },
  );
  const cursorOpacity = interpolate(
    frame,
    [beats.falsify - 4, beats.falsify - 2, beats.evidence + 2, beats.evidence + 6],
    [0, 1, 1, 0],
    clamp,
  );
  const retype = interpolate(frame, [beats.evidence + 8, beats.evidence + 18], [0, 1], clamp);
  const seal = spring({
    frame: frame - beats.evidence,
    fps,
    config: { damping: 11, stiffness: 220, mass: 0.8 },
  });
  const sealOpacity = interpolate(frame, [beats.evidence, beats.evidence + 2], [0, 1], clamp);
  const docThump = spring({
    frame: frame - beats.evidence,
    fps,
    config: { damping: 8, stiffness: 240, mass: 0.7 },
  });
  const docScale = frame >= beats.evidence ? 1 - 0.04 * (1 - docThump) : 1;

  // -- cluster C: the sacrifice ---------------------------------------------
  const chosenFade = interpolate(frame, [beats.sacrifice, beats.sacrifice + 9], [1, 0.15], clamp);
  const ghostIn = interpolate(frame, [beats.sacrifice + 4, beats.sacrifice + 12], [0, 0.16], clamp);
  const blastT = interpolate(frame, [beats.sacrifice, beats.sacrifice + 12], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.quad),
  });

  // -- rendering helpers ----------------------------------------------------
  const packetOffset = (phase: number) => -((frame * packetSpeed + phase * 1000) % 500);

  const edgeEl = (
    key: string,
    from: P,
    to: P,
    drawn: number,
    opts: {
      width?: number;
      opacity?: number;
      phase?: number;
      depth?: number;
      reversePulse?: number; // 0..1 progress of a pulse travelling child->parent, or -1
    } = {},
  ) => {
    if (drawn <= 0) return null;
    const d = `M ${from.x.toFixed(1)} ${from.y.toFixed(1)} L ${to.x.toFixed(1)} ${to.y.toFixed(1)}`;
    const bump = opts.depth === undefined ? 0 : pulseBump(opts.depth);
    const w = (opts.width ?? edgeWidth) + 3 * bump;
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
          opacity={op * (0.62 + 0.38 * Math.max(bump, drawn >= 1 ? 0.5 : 0))}
        />
        {drawn >= 1 && opts.phase !== undefined ? (
          <path
            d={d}
            fill="none"
            stroke={ink}
            strokeWidth={w + 1}
            strokeLinecap="round"
            pathLength={1000}
            strokeDasharray="28 472"
            strokeDashoffset={packetOffset(opts.phase)}
            opacity={op * 0.9}
          />
        ) : null}
        {rp >= 0 && rp <= 1 ? (
          <path
            d={d}
            fill="none"
            stroke={ink}
            strokeWidth={w + 5}
            strokeLinecap="round"
            pathLength={1000}
            strokeDasharray="70 930"
            strokeDashoffset={-930 * (1 - rp)}
            opacity={op}
          />
        ) : null}
      </g>
    );
  };

  const gearEl = (g: typeof bigGear, dir: number) => {
    const rot = gearSpin * dir * (46 / g.r);
    const teeth = Array.from({ length: g.teeth }, (_, i) => {
      const a = ((i * 360) / g.teeth + rot) * (Math.PI / 180);
      return (
        <line
          key={i}
          x1={g.x + Math.cos(a) * g.r}
          y1={g.y + Math.sin(a) * g.r}
          x2={g.x + Math.cos(a) * (g.r + 13)}
          y2={g.y + Math.sin(a) * (g.r + 13)}
          stroke={accent}
          strokeWidth={7}
          strokeLinecap="round"
        />
      );
    });
    const spokes = Array.from({ length: 3 }, (_, i) => {
      const a = ((i * 120) + rot) * (Math.PI / 180);
      return (
        <line
          key={`s${i}`}
          x1={g.x + Math.cos(a) * g.hub}
          y1={g.y + Math.sin(a) * g.hub}
          x2={g.x + Math.cos(a) * (g.r - 8)}
          y2={g.y + Math.sin(a) * (g.r - 8)}
          stroke={accent}
          strokeWidth={5}
          strokeLinecap="round"
        />
      );
    });
    return (
      <g>
        <circle cx={g.x} cy={g.y} r={g.r} fill="none" stroke={accent} strokeWidth={6} />
        <circle cx={g.x} cy={g.y} r={g.hub} fill="none" stroke={accent} strokeWidth={5} />
        {teeth}
        {spokes}
      </g>
    );
  };

  // Which edge of the sacrifice chain is carrying the pulse right now.
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
            <defs>
              <clipPath id="box-scan">
                <rect
                  x={BOX.x - BOX.w / 2}
                  y={BOX.y - BOX.h / 2}
                  width={BOX.w}
                  height={Math.max(0, scanY - (BOX.y - BOX.h / 2))}
                />
              </clipPath>
            </defs>

            {/* spawn rings off the logo, one per wave */}
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
                  r={150 + 130 * t}
                  fill="none"
                  stroke={ink}
                  strokeWidth={5}
                  opacity={0.7 * (1 - t)}
                />
              );
            })}

            {/* main edges */}
            {NODES.map((n, i) => {
              if (!n.parent) return null;
              const st = states[i];
              const drawn = interpolate(frame, [st.arrive - 2, st.arrive + 6], [0, 1], {
                ...clamp,
                easing: Easing.out(Easing.quad),
              });
              const chosen = CHOSEN.includes(n.id);
              return edgeEl(`e${n.id}`, posOf(n.parent), posOf(n.id), drawn, {
                phase: hash(i, 7),
                depth: n.depth,
                opacity: chosen ? chosenFade : 1,
                reversePulse: chosen ? spokePulse(n.id) : chainPulse(n.id),
                width: SURVIVORS.includes(n.id) && n.id !== "K0"
                  ? edgeWidth +
                    2 * spring({ frame: frame - beats.themselves, fps, config: { damping: 12, stiffness: 120 } })
                  : undefined,
              });
            })}

            {/* icon edges */}
            {edgeEl("eBox", posOf("A2"), BOX_TOP, boxEdge, { phase: 0.31, depth: 4 })}
            {edgeEl("eDoc", posOf("B3"), DOC_TOP, docEdge, { phase: 0.77, depth: 5 })}

            {/* twigs */}
            {TWIGS.map((t, i) => {
              const start = beats.sprawling + t.f;
              const grow = interpolate(frame, [start, start + 10], [0, 1], {
                ...clamp,
                easing: Easing.out(Easing.cubic),
              });
              if (grow <= 0) return null;
              const from = posOf(t.p);
              const a = (t.a * Math.PI) / 180;
              const to = { x: from.x + Math.cos(a) * t.l, y: from.y + Math.sin(a) * t.l };
              const leaf = spring({ frame: frame - (start + 6), fps, config: { damping: 9, stiffness: 180, mass: 0.6 } });
              const leafBreath = 1 + 0.06 * Math.sin(frame * 0.15 + hash(i, 8) * 6.28);
              const bump = pulseBump(9);
              return (
                <g key={`t${i}`}>
                  <path
                    d={`M ${from.x.toFixed(1)} ${from.y.toFixed(1)} L ${to.x.toFixed(1)} ${to.y.toFixed(1)}`}
                    fill="none"
                    stroke={accent}
                    strokeWidth={5 + 2 * bump}
                    strokeLinecap="round"
                    pathLength={1000}
                    strokeDasharray={1000}
                    strokeDashoffset={1000 * (1 - grow)}
                    opacity={0.85}
                  />
                  {frame >= start + 6 ? (
                    <circle
                      cx={to.x}
                      cy={to.y}
                      r={10 * leaf * leafBreath * (1 + 0.3 * bump)}
                      fill={accent}
                    />
                  ) : null}
                </g>
              );
            })}

            {/* box A — the scorer */}
            {boxDraw > 0 ? (
              <g>
                <rect
                  x={BOX.x - BOX.w / 2}
                  y={BOX.y - BOX.h / 2}
                  width={BOX.w}
                  height={BOX.h}
                  rx={18}
                  fill="none"
                  stroke={ink}
                  strokeWidth={8}
                  pathLength={1000}
                  strokeDasharray={1000}
                  strokeDashoffset={1000 * (1 - boxDraw)}
                  opacity={boxRecede}
                />
                {scanT > 0 ? (
                  <g clipPath="url(#box-scan)">
                    {gearEl(bigGear, 1)}
                    {gearEl(smallGear, -1)}
                  </g>
                ) : null}
                {scanOpacity > 0 ? (
                  <line
                    x1={BOX.x - BOX.w / 2 + 10}
                    y1={scanY}
                    x2={BOX.x + BOX.w / 2 - 10}
                    y2={scanY}
                    stroke={accent}
                    strokeWidth={5}
                    strokeLinecap="round"
                    opacity={scanOpacity}
                  />
                ) : null}
                {scorerPulse > 0 && scorerPulse < 1 ? (
                  <rect
                    x={BOX.x - BOX.w / 2 - 30 * scorerPulse}
                    y={BOX.y - BOX.h / 2 - 30 * scorerPulse}
                    width={BOX.w + 60 * scorerPulse}
                    height={BOX.h + 60 * scorerPulse}
                    rx={18 + 20 * scorerPulse}
                    fill="none"
                    stroke={accent}
                    strokeWidth={4}
                    opacity={0.7 * (1 - scorerPulse)}
                  />
                ) : null}
              </g>
            ) : null}

            {/* doc B — the evidence */}
            {docDraw > 0 ? (
              <g transform={`translate(${DOC.x} ${DOC.y}) scale(${docScale}) translate(${-DOC.x} ${-DOC.y})`}>
                <rect
                  x={DOC.x - DOC.w / 2}
                  y={DOC.y - DOC.h / 2}
                  width={DOC.w}
                  height={DOC.h}
                  rx={14}
                  fill="none"
                  stroke={ink}
                  strokeWidth={8}
                  pathLength={1000}
                  strokeDasharray={1000}
                  strokeDashoffset={1000 * (1 - docDraw)}
                />
                {ROW_W.map((w, i) => {
                  const rowStart = docEdgeStart + 14 + i * 2;
                  const drawn = interpolate(frame, [rowStart, rowStart + 5], [0, 1], {
                    ...clamp,
                    easing: Easing.out(Easing.quad),
                  });
                  const tF = beats.falsify + i * rowStep;
                  const wipeOut = interpolate(frame, [tF, tF + 5], [1, 0], {
                    ...clamp,
                    easing: Easing.inOut(Easing.quad),
                  });
                  const wipeIn = interpolate(frame, [tF + 2, tF + 8], [0, 1], {
                    ...clamp,
                    easing: Easing.out(Easing.cubic),
                  });
                  const jitter = retype * 14 * Math.sin(frame * 0.07 + i * 1.7);
                  const inkW = w * drawn * wipeOut;
                  const accW = (ROW_W2[i] + jitter) * wipeIn;
                  return (
                    <g key={`row${i}`}>
                      {inkW > 1 ? (
                        <line
                          x1={rowX}
                          y1={rowY(i)}
                          x2={rowX + inkW}
                          y2={rowY(i)}
                          stroke={ink}
                          strokeWidth={8}
                          strokeLinecap="round"
                          opacity={0.9}
                        />
                      ) : null}
                      {accW > 1 ? (
                        <line
                          x1={rowX}
                          y1={rowY(i)}
                          x2={rowX + accW}
                          y2={rowY(i)}
                          stroke={accent}
                          strokeWidth={8}
                          strokeLinecap="round"
                        />
                      ) : null}
                    </g>
                  );
                })}
                {cursorOpacity > 0 ? (
                  <rect
                    x={rowX - 22}
                    y={cursorY - 17}
                    width={7}
                    height={34}
                    rx={3}
                    fill={accent}
                    opacity={cursorOpacity}
                  />
                ) : null}
                {sealOpacity > 0 ? (
                  <g
                    transform={`translate(${DOC.x + DOC.w / 2 - 44} ${DOC.y + DOC.h / 2 - 44}) scale(${
                      1.9 - 0.9 * seal
                    })`}
                    opacity={sealOpacity}
                  >
                    <circle cx={0} cy={0} r={36} fill="none" stroke={accent} strokeWidth={7} />
                    <circle cx={0} cy={0} r={13} fill={accent} />
                  </g>
                ) : null}
              </g>
            ) : null}

            {/* selection rings + ghosts + blasts on the chosen three */}
            {CHOSEN.map((id, j) => {
              const st = states[NODE_INDEX.get(id)!];
              const ringStart = beats.strategically + j * 4;
              const ringDraw = interpolate(frame, [ringStart, ringStart + 7], [0, 1], {
                ...clamp,
                easing: Easing.out(Easing.quad),
              });
              const ringFade = interpolate(frame, [beats.sacrifice, beats.sacrifice + 6], [1, 0], clamp);
              return (
                <g key={`c${id}`}>
                  {ringDraw > 0 && ringFade > 0 ? (
                    <circle
                      cx={st.x}
                      cy={st.y}
                      r={46}
                      fill="none"
                      stroke={accent}
                      strokeWidth={4}
                      pathLength={1000}
                      strokeDasharray={ringDraw >= 1 ? "60 40" : "1000 1000"}
                      strokeDashoffset={ringDraw >= 1 ? -(frame * 6) % 100 : 1000 * (1 - ringDraw)}
                      opacity={ringFade}
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
                  {blastT > 0 && blastT < 1 ? (
                    <circle
                      cx={st.x}
                      cy={st.y}
                      r={25 + 85 * blastT}
                      fill="none"
                      stroke={accent}
                      strokeWidth={5}
                      opacity={0.8 * (1 - blastT)}
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
                <circle
                  key={n.id}
                  cx={st.x}
                  cy={st.y}
                  r={n.r * st.scale}
                  fill={accent}
                  opacity={st.opacity}
                />
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

export default SprawlingProject;
