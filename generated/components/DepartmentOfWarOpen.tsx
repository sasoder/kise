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

// Bharat / Project Maven V3 — the opening shot (sequence frames 0–126).
// "I've had a ton of experience across the Department (f53) of War (f65) in
// different (f77) AI (f85) projects (f100)."
// A softly blurred aerial of the Pentagon, the Department of War seal arriving
// in the centre almost instantly, then ONE pan right onto a text-free
// "AI projects" badge (a chip holding a small neural network).

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
export const WORLD_GAP = 1150; // seal → icon, world px

// ── camera: one glide, raised-cosine ramps round a constant-speed middle ───
export const PAN_START = 62;
export const PAN_END = 99;
const RAMP = 0.22; // fraction of the glide spent accelerating (and braking)
const DRIFT_START = 92;
const DRIFT_PX = 10;

/** C1 (in fact C2) ease 0→1 whose peak speed is only 1/(1-RAMP) of the mean. */
const glide = (u: number): number => {
  if (u <= 0) return 0;
  if (u >= 1) return 1;
  const r = RAMP;
  const vMax = 1 / (1 - r);
  const rampDist = (x: number) =>
    // integral of vMax * (1 - cos(pi x / r)) / 2
    (vMax / 2) * (x - (r / Math.PI) * Math.sin((Math.PI * x) / r));
  if (u < r) return rampDist(u);
  if (u <= 1 - r) return rampDist(r) + vMax * (u - r);
  return 1 - rampDist(1 - u);
};

export const cameraX = (f: number): number => {
  const pan = WORLD_GAP * glide((f - PAN_START) / (PAN_END - PAN_START));
  // the held breath after the landing: a very slow continued drift right
  const d = Math.max(0, f - DRIFT_START);
  const k = 10; // frames to ease the drift in
  const driftSpeed = DRIFT_PX / (DURATION - DRIFT_START - k / 2);
  const drift = d < k ? (driftSpeed * d * d) / (2 * k) : driftSpeed * (d - k / 2);
  return pan + drift;
};

// ── photo ───────────────────────────────────────────────────────────────────
const PHOTO_H = 2300;
const PHOTO_W = 3450; // 3600x2400 source
const PHOTO_LEFT = -1215; // start framed on the Pentagon itself
const PHOTO_TOP = -290;
const PARALLAX = 0.45;

// ── palette (badge) ─────────────────────────────────────────────────────────
const NAVY = "#0B2A6B";
const GOLD = "#F6C21C";
const INK = "#F4F1EA";
const SHADOW = "0 18px 50px rgba(0,0,0,0.35)";

// ── the icon's network ──────────────────────────────────────────────────────
const LOOP = 48;
const NODES = {
  L0: [-96, -54],
  L1: [-96, 54],
  M0: [0, -100],
  M1: [0, 0],
  M2: [0, 100],
  R0: [96, -54],
  R1: [96, 54],
} as const;
type NodeId = keyof typeof NODES;

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

// A pulse leaves a left node, crosses one link, lights the middle node,
// crosses a second link and lights the right node. Staggered, never in unison.
const HOP = 15; // frames per link
const ROUTES: Array<{ path: [NodeId, NodeId, NodeId]; start: number }> = [
  { path: ["L0", "M0", "R0"], start: 0 },
  { path: ["L1", "M1", "R0"], start: 13 },
  { path: ["L1", "M2", "R1"], start: 25 },
  { path: ["L0", "M1", "R1"], start: 37 },
];

const mod = (a: number, n: number) => ((a % n) + n) % n;

/** How lit a node is: a soft attack as a pulse touches it, then a slow decay. */
const nodeGlow = (id: NodeId, t: number): number => {
  let g = 0;
  for (const r of ROUTES) {
    const i = r.path.indexOf(id);
    if (i < 0) continue;
    const since = mod(t - (r.start + i * HOP), LOOP);
    const attack = Math.min(1, (since + 1) / 3);
    const lit = attack * Math.exp(-Math.max(0, since - 2) / 7);
    // the tail of the previous loop's touch is negligible after 48 f
    g = Math.max(g, lit);
  }
  return g;
};

const PINS: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
{
  const A = 160; // chip half-size
  const B = 212; // pin tip
  const offs = [-80, 0, 80];
  // clockwise from the top-left pin
  for (const o of offs) PINS.push({ x1: o, y1: -A, x2: o, y2: -B });
  for (const o of offs) PINS.push({ x1: A, y1: o, x2: B, y2: o });
  for (const o of [...offs].reverse()) PINS.push({ x1: o, y1: A, x2: o, y2: B });
  for (const o of [...offs].reverse()) PINS.push({ x1: -A, y1: o, x2: -B, y2: o });
}
const SHIMMER_START = 90; // once, as the badge lands
const SHIMMER_STEP = 1.6;

const AiBadge: React.FC<{ frame: number }> = ({ frame }) => {
  const t = frame;
  return (
    <svg
      width={BADGE}
      height={BADGE}
      viewBox="-320 -320 640 640"
      style={{ display: "block", overflow: "visible" }}
    >
      <defs>
        <radialGradient id="dowDisc" cx="50%" cy="38%" r="75%">
          <stop offset="0%" stopColor="#103480" />
          <stop offset="70%" stopColor={NAVY} />
          <stop offset="100%" stopColor="#09245D" />
        </radialGradient>
      </defs>
      {/* disc: gold rim, navy field, fine inner keyline — the seal's sibling */}
      <circle r={320} fill={GOLD} />
      <circle r={320} fill="none" stroke="#C99A0A" strokeWidth={3} strokeOpacity={0.55} />
      <circle r={305} fill="url(#dowDisc)" />
      <circle r={282} fill="none" stroke={GOLD} strokeWidth={4} strokeOpacity={0.9} />

      {/* pins */}
      {PINS.map((p, i) => {
        const s = frame - (SHIMMER_START + i * SHIMMER_STEP);
        const sh = s <= 0 ? 0 : Math.min(1, s / 2.5) * Math.exp(-Math.max(0, s - 2.5) / 5);
        return (
          <line
            key={i}
            {...p}
            stroke={sh > 0.02 ? "#FFFFFF" : INK}
            strokeOpacity={0.9 + 0.1 * sh}
            strokeWidth={15 + 1.5 * sh}
            strokeLinecap="round"
          />
        );
      })}

      {/* chip body */}
      <rect
        x={-160}
        y={-160}
        width={320}
        height={320}
        rx={50}
        fill="#0E2F78"
        stroke={INK}
        strokeWidth={15}
        strokeLinejoin="round"
      />

      {/* links at rest */}
      {LINKS.map(([a, b], i) => (
        <line
          key={i}
          x1={NODES[a][0]}
          y1={NODES[a][1]}
          x2={NODES[b][0]}
          y2={NODES[b][1]}
          stroke={INK}
          strokeOpacity={0.5}
          strokeWidth={7}
          strokeLinecap="round"
        />
      ))}

      {/* pulses: a short bright streak riding each link, left to right */}
      {ROUTES.map((r, ri) => {
        const local = mod(t - r.start, LOOP);
        const hop = Math.floor(local / HOP);
        if (hop > 1) return null;
        const u0 = (local - hop * HOP) / HOP;
        const u = Easing.inOut(Easing.sin)(u0);
        const a = NODES[r.path[hop]];
        const b = NODES[r.path[hop + 1]];
        const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
        const half = 15 / len; // streak half-length as a fraction of the link
        const h0 = Math.max(0, u - half);
        const h1 = Math.min(1, u + half);
        const px = (k: number) => a[0] + (b[0] - a[0]) * k;
        const py = (k: number) => a[1] + (b[1] - a[1]) * k;
        return (
          <line
            key={ri}
            x1={px(h0)}
            y1={py(h0)}
            x2={px(h1)}
            y2={py(h1)}
            stroke="#FFFFFF"
            strokeWidth={9}
            strokeLinecap="round"
          />
        );
      })}

      {/* nodes: each brightens as a pulse reaches it */}
      {(Object.keys(NODES) as NodeId[]).map((id) => {
        const g = nodeGlow(id, t);
        const [x, y] = NODES[id];
        return (
          <g key={id}>
            <circle cx={x} cy={y} r={19 + 2.5 * g} fill="#0E2F78" />
            <circle
              cx={x}
              cy={y}
              r={19 + 2.5 * g}
              fill={g > 0.02 ? "#FFFFFF" : INK}
              fillOpacity={0.8 + 0.2 * g}
            />
          </g>
        );
      })}
    </svg>
  );
};

const DepartmentOfWarOpen: React.FC<Props> = () => {
  const frame = useCurrentFrame();
  const cam = cameraX(frame);

  // background: blurred from f0, easing to a softer hold; slow push throughout
  const blur = interpolate(frame, [0, 20], [14, 6], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const push = interpolate(frame, [0, DURATION - 1], [1, 1.022]);
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

  const sealVisible = CX - cam + BADGE / 2 + 120 > 0;
  const iconVisible = CX + WORLD_GAP - cam - BADGE / 2 - 120 < W;

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

      {/* the seal (world x = 540) */}
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
            transform: `translate3d(${-cam}px, ${sealY}px, 0) rotate(${sealRot}deg) scale(${0.92 + 0.08 * sealIn})`,
          }}
        >
          <Img
            src={staticFile("maven/dow_seal.png")}
            style={{ width: BADGE, height: BADGE, display: "block" }}
          />
        </div>
      ) : null}

      {/* the "AI projects" badge (world x = 540 + 1150) */}
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
            transform: `translate3d(${WORLD_GAP - cam}px, ${iconY}px, 0) rotate(${iconRot}deg)`,
          }}
        >
          <AiBadge frame={frame} />
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export default DepartmentOfWarOpen;
