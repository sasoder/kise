import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { z } from "zod";
import {
  INK,
  INK_HI,
  PAPER,
  PAPER_SRC,
  RED,
  RED_DEEP,
  mixHex,
} from "./chinatalkShared";

// Bharat / Project Maven V3 — the opening shot (sequence frames 0–126).
// "I've had a ton of experience across the Department (f53) of War (f65) in
// different (f77) AI (f85) projects (f100)."
// A softly blurred aerial of the Pentagon, the Department of War seal arriving
// in the centre almost instantly, and ONE continuous camera move to the right
// (a bell-shaped speed graph, never stationary) onto a text-free "AI projects"
// badge in ChinaTalk material: a neural network of chop-seal squares on rice
// paper, one vermilion output node.

export const FPS = 24;
export const DURATION = 126;

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

// ── frame / world ───────────────────────────────────────────────────────────
const W = 1080;
const CX = 540;
const CY = 835; // caption-safe centre
const BADGE = 640; // seal and icon share one diameter

// ── camera: ONE continuous move, f0 → f125, no holds ────────────────────────
// Two keyframes whose speed graph is a single smooth bell on a floor:
// v(f) = V_FLOOR + V_PEAK * gauss((f - PEAK_F) / SIGMA). The frame is drifting
// right from the first frame to the last; the fast middle falls on
// "different AI" and the icon drifts through centre as "projects" is said.
export const V_FLOOR = 1.8; // px/frame, never stationary
export const V_PEAK = 33; // px/frame added at the top of the bell
export const PEAK_F = 74;
export const SIGMA = 14;
export const SEAL_CENTRE_F = 27; // the seal drifts through centre here
export const ICON_CENTRE_F = 104; // and the icon here

export const cameraV = (f: number): number =>
  V_FLOOR + V_PEAK * Math.exp(-0.5 * Math.pow((f - PEAK_F) / SIGMA, 2));

/** camera x at every frame: the running integral of v (trapezoid rule). */
const CAM_TABLE: number[] = [0];
for (let f = 1; f <= DURATION; f++) {
  CAM_TABLE.push(CAM_TABLE[f - 1] + (cameraV(f - 1) + cameraV(f)) / 2);
}
export const cameraX = (f: number): number =>
  CAM_TABLE[Math.max(0, Math.min(DURATION, Math.round(f)))];

const SEAL_X = CX + cameraX(SEAL_CENTRE_F); // world x
const ICON_X = CX + cameraX(ICON_CENTRE_F);
export const WORLD_GAP = ICON_X - SEAL_X;

// ── photo ───────────────────────────────────────────────────────────────────
const PHOTO_H = 2300;
const PHOTO_W = 3450; // 3600x2400 source
const PHOTO_LEFT = -1215; // start framed on the Pentagon itself
const PHOTO_TOP = -290;
const PARALLAX = 0.45;

const SHADOW = "0 18px 50px rgba(0,0,0,0.35)";

// ── the icon: a neural network in ChinaTalk material ───────────────────────
// Rice-paper disc, warm-ink ring, ink links, chop-seal squares for nodes and
// exactly ONE vermilion seal: the output node.
const INK90 = mixHex(PAPER, INK, INK_HI); // opaque, so overlaps never double up
const LINE_W = 9;
const SEAL_SQ = 40;
const LOOP = 48;
const NODES = {
  L0: [-168, -88],
  L1: [-168, 88],
  M0: [0, -176],
  M1: [0, 0],
  M2: [0, 176],
  R0: [168, -88],
  R1: [168, 88],
} as const;
type NodeId = keyof typeof NODES;
const OUTPUT: NodeId = "R0";

const LINKS: Array<[NodeId, NodeId]> = [
  ["L0", "M0"],
  ["L0", "M1"],
  ["L1", "M1"],
  ["L1", "M2"],
  ["M0", "R0"],
  ["M1", "R0"],
  ["M1", "R1"],
  ["M2", "R1"],
];

// The links are being re-written in wet ink: a bead leaves a left seal, writes
// one link, presses the middle seal, writes a second link and presses the
// right one. Four routes cover all eight links; staggered, never in unison.
const HOP = 15; // frames per link
const ROUTES: Array<{ path: [NodeId, NodeId, NodeId]; start: number }> = [
  { path: ["L0", "M0", "R0"], start: 0 },
  { path: ["L1", "M1", "R0"], start: 13 },
  { path: ["L1", "M2", "R1"], start: 25 },
  { path: ["L0", "M1", "R1"], start: 37 },
];

const mod = (a: number, n: number) => ((a % n) + n) % n;
const smooth = (u: number) => {
  const c = Math.max(0, Math.min(1, u));
  return c * c * (3 - 2 * c);
};

/** Frames since a bead last touched this node (smallest over the routes). */
const sinceTouch = (id: NodeId, t: number): number => {
  let best = LOOP;
  for (const r of ROUTES) {
    const i = r.path.indexOf(id);
    if (i < 0) continue;
    best = Math.min(best, mod(t - (r.start + i * HOP), LOOP));
  }
  return best;
};

/** The seal presses in very slightly as the bead arrives: 1 → 1.06 → 1, 10 f. */
const press = (since: number) =>
  since < 10 ? 1 + 0.06 * Math.pow(Math.sin((Math.PI * since) / 10), 2) : 1;

/** The red seal: one eased crossfade up to full vermilion, then a slow settle. */
const redGlow = (t: number): number => {
  let g = 0;
  for (const r of ROUTES) {
    const i = r.path.indexOf(OUTPUT);
    if (i < 0) continue;
    const since = mod(t - (r.start + i * HOP), LOOP);
    g = Math.max(g, smooth(since / 9) * (1 - smooth((since - 9) / 30)));
  }
  return g;
};

const AiBadge: React.FC<{ frame: number }> = ({ frame }) => {
  const t = frame;
  return (
    <div
      style={{
        position: "relative",
        width: BADGE,
        height: BADGE,
        borderRadius: "50%",
        overflow: "hidden",
        backgroundColor: PAPER,
      }}
    >
      {/* the rice paper and its fibre grain */}
      <Img
        src={staticFile(PAPER_SRC)}
        style={{
          position: "absolute",
          left: -280,
          top: -700,
          width: 1200,
          height: 2100,
          maxWidth: "none",
        }}
      />
      {/* a faint warm inner vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background:
            "radial-gradient(circle at 50% 50%, rgba(70,35,15,0) 55%, rgba(70,35,15,0.09) 100%)",
        }}
      />
      <svg
        width={BADGE}
        height={BADGE}
        viewBox="-320 -320 640 640"
        style={{ position: "absolute", left: 0, top: 0, display: "block" }}
      >
        {/* the disc's edge: a warm-ink ring */}
        <circle r={320 - LINE_W / 2} fill="none" stroke={INK90} strokeWidth={LINE_W} />

        {/* links, dry */}
        {LINKS.map(([a, b], i) => (
          <line
            key={i}
            x1={NODES[a][0]}
            y1={NODES[a][1]}
            x2={NODES[b][0]}
            y2={NODES[b][1]}
            stroke={INK90}
            strokeWidth={LINE_W}
            strokeLinecap="round"
          />
        ))}

        {/* the wet stretch and its bead, riding each link left to right */}
        {ROUTES.map((r, ri) => {
          const local = mod(t - r.start, LOOP);
          const hop = Math.floor(local / HOP);
          if (hop > 1) return null;
          const u = Easing.inOut(Easing.sin)((local - hop * HOP) / HOP);
          const a = NODES[r.path[hop]];
          const b = NODES[r.path[hop + 1]];
          const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
          const tail = Math.max(0, u - 70 / len); // the freshest ~70 px is wet
          const px = (k: number) => a[0] + (b[0] - a[0]) * k;
          const py = (k: number) => a[1] + (b[1] - a[1]) * k;
          // the bead swells out of one seal and sinks into the next
          const swell = smooth(u / 0.18) * (1 - smooth((u - 0.82) / 0.18));
          const R = 9.5 * (0.6 + 0.4 * swell);
          return (
            <g key={ri}>
              <line
                x1={px(tail)}
                y1={py(tail)}
                x2={px(u)}
                y2={py(u)}
                stroke={INK}
                strokeWidth={LINE_W * 1.18}
                strokeLinecap="round"
              />
              <circle cx={px(u)} cy={py(u)} r={R * 2.6} fill={INK} fillOpacity={0.2 * swell} />
              <circle cx={px(u)} cy={py(u)} r={R} fill={INK} />
              <circle
                cx={px(u) - R * 0.34}
                cy={py(u) - R * 0.34}
                r={R * 0.25}
                fill={PAPER}
                fillOpacity={0.9 * swell}
              />
            </g>
          );
        })}

        {/* nodes: chop-seal squares; the output node is the one vermilion */}
        {(Object.keys(NODES) as NodeId[]).map((id) => {
          const [x, y] = NODES[id];
          const s = press(sinceTouch(id, t));
          const isOut = id === OUTPUT;
          const fill = isOut ? mixHex(RED_DEEP, RED, 0.5 + 0.5 * redGlow(t)) : INK90;
          return (
            <rect
              key={id}
              x={-SEAL_SQ / 2}
              y={-SEAL_SQ / 2}
              width={SEAL_SQ}
              height={SEAL_SQ}
              rx={3}
              fill={fill}
              transform={`translate(${x} ${y}) scale(${s})`}
              style={
                isOut
                  ? { filter: "drop-shadow(0 4px 8px rgba(70,35,15,0.16))" }
                  : undefined
              }
            />
          );
        })}
      </svg>
    </div>
  );
};

const DepartmentOfWarOpen: React.FC<Props> = () => {
  const frame = useCurrentFrame();
  const cam = cameraX(frame);

  // background: blurred from f0, easing to a softer blur
  const blur = interpolate(frame, [0, 20], [14, 6], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  // the slow push rides the same curve as the camera
  const push = 1 + 0.022 * (cam / cameraX(DURATION - 1));
  const photoX = PHOTO_LEFT - cam * PARALLAX;

  // seal: in over f2–f14, one ease-out
  const sealIn = interpolate(frame, [2, 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const sealY = 3.5 * Math.sin((2 * Math.PI * (frame - 14)) / 84);
  const sealRot = 0.35 * Math.sin((2 * Math.PI * (frame - 4)) / 110);

  const iconY = 3.5 * Math.sin((2 * Math.PI * (frame + 20)) / 84);
  const iconRot = 0.3 * Math.sin((2 * Math.PI * (frame + 40)) / 110);

  const sealVisible = SEAL_X - cam + BADGE / 2 + 120 > 0;
  const iconVisible = ICON_X - cam - BADGE / 2 - 120 < W;

  return (
    <AbsoluteFill style={{ backgroundColor: "#1B2433", overflow: "hidden" }}>
      {/* the photo, overscanned on every side so the blur never finds an edge */}
      <AbsoluteFill
        style={{
          transform: `scale(${push})`,
          transformOrigin: `${CX}px ${CY}px`,
        }}
      >
        <Img
          src={staticFile("maven/pentagon.jpg")}
          style={{
            position: "absolute",
            left: 0,
            top: PHOTO_TOP,
            width: PHOTO_W,
            height: PHOTO_H,
            maxWidth: "none",
            transform: `translate3d(${photoX}px, 0, 0)`,
            filter: `blur(${blur}px) saturate(0.92)`,
          }}
        />
      </AbsoluteFill>
      {/* navy scrim + a soft vignette so the light objects pop */}
      <AbsoluteFill style={{ backgroundColor: "rgba(10, 24, 56, 0.18)" }} />
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 85% 62% at ${CX}px ${CY}px, rgba(6,14,34,0) 45%, rgba(6,14,34,0.34) 100%)`,
        }}
      />

      {/* the seal, drifting through centre at SEAL_CENTRE_F */}
      {sealVisible ? (
        <div
          style={{
            position: "absolute",
            left: CX - BADGE / 2,
            top: CY - BADGE / 2,
            width: BADGE,
            height: BADGE,
            borderRadius: "50%",
            boxShadow: SHADOW,
            opacity: sealIn,
            filter: sealIn < 1 ? `blur(${6 * (1 - sealIn)}px)` : undefined,
            transform: `translate3d(${SEAL_X - CX - cam}px, ${sealY}px, 0) rotate(${sealRot}deg) scale(${0.92 + 0.08 * sealIn})`,
          }}
        >
          <Img
            src={staticFile("maven/dow_seal.png")}
            style={{ width: BADGE, height: BADGE, display: "block" }}
          />
        </div>
      ) : null}

      {/* the "AI projects" badge, drifting through centre at ICON_CENTRE_F */}
      {iconVisible ? (
        <div
          style={{
            position: "absolute",
            left: CX - BADGE / 2,
            top: CY - BADGE / 2,
            width: BADGE,
            height: BADGE,
            borderRadius: "50%",
            boxShadow: SHADOW,
            transform: `translate3d(${ICON_X - CX - cam}px, ${iconY}px, 0) rotate(${iconRot}deg)`,
          }}
        >
          <AiBadge frame={frame} />
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export default DepartmentOfWarOpen;
