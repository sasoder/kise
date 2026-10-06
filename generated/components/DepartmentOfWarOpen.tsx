import React, { useMemo } from "react";
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
  INK_LO,
  PAPER,
  PAPER_SRC,
  RED,
  RED_DEEP,
  mixHex,
} from "./chinatalkShared";
import { feather, hash, makeTone, wobble, WOBBLE_R } from "./fieldShared";

// Bharat / Project Maven V3 — the opening shot (sequence frames 0–126).
// "I've had a ton of experience across the Department (f53) of War (f65) in
// different (f77) AI (f85) projects (f100)."
// A softly blurred aerial of the Pentagon, the Department of War seal arriving
// in the centre almost instantly, and ONE continuous camera move to the right
// (a bell-shaped speed graph, never stationary). The photo gives way to rice
// paper along a wet ink-wash edge, and the move arrives on an abstract field:
// five different crowds of vermilion dots, ink rings, threads and packets.

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
// "different AI" and the field drifts through centre as "projects" is said.
export const V_FLOOR = 1.8; // px/frame, never stationary
export const V_PEAK = 33; // px/frame added at the top of the bell
export const PEAK_F = 74;
export const SIGMA = 14;
export const SEAL_CENTRE_F = 27; // the seal drifts through centre here

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

// ── photo ───────────────────────────────────────────────────────────────────
const PHOTO_H = 2300;
const PHOTO_W = 3450; // 3600x2400 source
const PHOTO_LEFT = -1215; // start framed on the Pentagon itself
const PHOTO_TOP = -290;
const PARALLAX = 0.45;

const SHADOW = "0 18px 50px rgba(0,0,0,0.35)";

// ── the paper the photo gives way to ────────────────────────────────────────
// World x of the wash edge's half-point: at the bell's peak the frame is about
// half photo, half paper; from ≈ f96 it is all paper.
const EDGE_X = 380 + cameraX(PEAK_F);
const EDGE_BLUR = 62; // px sigma → a ≈ 200–260 px feather
const PAPER_L = -260; // the paper shape, relative to EDGE_X
const PAPER_W = 2300;
const PAPER_T = -420;
const PAPER_H = 2760;

/** The wet edge: three slow harmonics, so it is never a ruled line and never still. */
const edgeOffset = (y: number, f: number) =>
  52 * Math.sin(y * 0.0047 + 0.7 + f * 0.021) +
  28 * Math.sin(y * 0.0113 + 2.1 - f * 0.034) +
  12 * Math.sin(y * 0.027 + 4.0 + f * 0.05);

const edgeClip = (f: number, shift: number) => {
  const pts: string[] = [];
  for (let y = 0; y <= PAPER_H; y += 40) {
    pts.push(`${(-PAPER_L + shift + edgeOffset(y + PAPER_T, f)).toFixed(1)}px ${y}px`);
  }
  pts.push(`${PAPER_W}px ${PAPER_H}px`, `${PAPER_W}px 0px`);
  return `polygon(${pts.join(",")})`;
};

// ── "different AI projects": five crowds ────────────────────────────────────
// The Orange Dwarkesh field in ChinaTalk material: vermilion two-tone dots
// (RED_DEEP at rest, RED lit), warm-ink rings and threads, ink packets. The
// constellation is organic: no two threads parallel, none level or plumb.
const INK90 = mixHex(PAPER, INK, INK_HI); // opaque rungs, so overlaps never double up
const INK42 = mixHex(PAPER, INK, INK_LO);
const FIELD_CENTRE_F = 108; // the constellation drifts through centre here
const FIELD_X = CX + cameraX(FIELD_CENTRE_F) + 36; // world x of its centre of mass
const FIELD_Y = 808;
const STEP = 18.5; // hex pitch
const ROW = STEP * 0.866;
const DOT_R = 6.8; // ≈ 13.6 px dots
const RING_W = 9;
const THREAD_W = 4;

type Crowd = {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  n: number; // superellipse exponent
  seed: number;
  ring: [number, number, number]; // ring centre (relative to the crowd) and radius
  speed: number; // how fast a read-wave spreads, px/frame
};
const CROWDS: Crowd[] = [
  // the largest, left of centre and slightly low: the one the clip is about to name
  { cx: -45, cy: 60, rx: 228, ry: 236, n: 2.3, seed: 1.3, ring: [-30, 22, 60], speed: 19 },
  // wide, upper right
  { cx: 215, cy: -405, rx: 185, ry: 115, n: 2.6, seed: 4.1, ring: [34, -6, 42], speed: 9 },
  // tall, far right
  { cx: 352, cy: 300, rx: 82, ry: 170, n: 2.2, seed: 7.7, ring: [2, 34, 36], speed: 8 },
  // squarish, lower left
  { cx: -322, cy: 455, rx: 116, ry: 114, n: 3.4, seed: 2.9, ring: [-8, 10, 38], speed: 7 },
  // small and round, top left
  { cx: -310, cy: -390, rx: 100, ry: 96, n: 2, seed: 9.2, ring: [-6, -4, 30], speed: 6 },
];
const ringOf = (c: number) => {
  const k = CROWDS[c];
  return { x: k.cx + k.ring[0], y: k.cy + k.ring[1], r: k.ring[2] };
};

// Threads between neighbours, from crowd EDGE to crowd EDGE. A packet's
// ARRIVAL at a crowd's edge starts that crowd's next read-wave from that point,
// so each crowd pulses on its own period, never in unison.
type Thread = { from: number; to: number; period: number; arrive: number };
const THREADS: Thread[] = [
  { from: 0, to: 1, period: 52, arrive: 5 },
  { from: 1, to: 2, period: 61, arrive: 20 },
  { from: 0, to: 3, period: 44, arrive: 33 },
  { from: 0, to: 4, period: 67, arrive: 12 },
  { from: 2, to: 0, period: 48, arrive: 26 }, // lands on the central crowd at f74
];
const PACKET_SPEED = 8; // px/frame
const FINAL_WAVE_F = 74; // from this arrival the central crowd stays lit

/** Where a crowd's feather begins along a direction from its centre. */
const edgePoint = (c: number, ux: number, uy: number) => {
  const k = CROWDS[c];
  const t =
    1 / Math.pow(Math.pow(Math.abs(ux / k.rx), k.n) + Math.pow(Math.abs(uy / k.ry), k.n), 1 / k.n);
  const w = 0.55 * wobble(Math.atan2(uy, ux) * WOBBLE_R, k.seed);
  const se = 1 + ((w + 0.9) * STEP) / Math.min(k.rx, k.ry);
  return { x: k.cx + ux * t * se, y: k.cy + uy * t * se };
};
const threadGeo = (t: Thread) => {
  const a = CROWDS[t.from];
  const b = CROWDS[t.to];
  const len = Math.hypot(b.cx - a.cx, b.cy - a.cy);
  const ux = (b.cx - a.cx) / len;
  const uy = (b.cy - a.cy) / len;
  const p1 = edgePoint(t.from, ux, uy);
  const p2 = edgePoint(t.to, -ux, -uy);
  return { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, len: Math.hypot(p2.x - p1.x, p2.y - p1.y) };
};
const THREAD_GEO = THREADS.map(threadGeo);
/** Each crowd's entry point: where its incoming thread meets its edge. */
const ENTRY = CROWDS.map((_, c) => {
  const i = THREADS.findIndex((t) => t.to === c);
  return { x: THREAD_GEO[i].x2, y: THREAD_GEO[i].y2 };
});

/** Every arrival at each crowd's ring, from well before f0 to the end. */
const ARRIVALS: number[][] = CROWDS.map(() => []);
THREADS.forEach((t) => {
  for (let a = t.arrive - t.period * 6; a <= DURATION + 4; a += t.period) {
    ARRIVALS[t.to].push(a);
  }
});

const smooth01 = (u: number) => {
  const c = Math.max(0, Math.min(1, u));
  return c * c * (3 - 2 * c);
};
/** A read-wave passing one dot: up in 5 f, a short hold, back down over 20 f. */
const pulse = (s: number) => (s <= 0 ? 0 : smooth01(s / 5) * (1 - smooth01((s - 9) / 20)));

type Dot = { x: number; y: number; r: number; c: number; d: number; h1: number; h2: number };
const buildDots = (): Dot[] => {
  const dots: Dot[] = [];
  CROWDS.forEach((k, c) => {
    const ring = ringOf(c);
    const minR = Math.min(k.rx, k.ry);
    let i = c * 10000;
    const rows = Math.ceil((k.ry + 60) / ROW);
    const cols = Math.ceil((k.rx + 60) / STEP);
    for (let row = -rows; row <= rows; row++) {
      for (let col = -cols; col <= cols; col++) {
        i++;
        const lx = col * STEP + (row & 1 ? STEP / 2 : 0) + (hash(i, 3) - 0.5) * 5;
        const ly = row * ROW + (hash(i, 5) - 0.5) * 5;
        // signed distance to the superellipse boundary, in grid steps
        const se = Math.pow(
          Math.pow(Math.abs(lx / k.rx), k.n) + Math.pow(Math.abs(ly / k.ry), k.n),
          1 / k.n,
        );
        const theta = Math.atan2(ly, lx);
        const inside = ((1 - se) * minR) / STEP + 0.55 * wobble(theta * WOBBLE_R, k.seed);
        const fe = feather(inside, 2.6);
        if (hash(i, 71) >= fe) continue;
        const x = k.cx + lx;
        const y = k.cy + ly;
        // the ring keeps a small clear halo; nothing else is cut out of the crowd
        const dRing = Math.hypot(x - ring.x, y - ring.y);
        if (Math.abs(dRing - ring.r) < RING_W / 2 + DOT_R + 3.5) continue;
        dots.push({
          x,
          y,
          r: DOT_R * (0.7 + 0.3 * fe),
          c,
          d: Math.hypot(x - ENTRY[c].x, y - ENTRY[c].y),
          h1: hash(i, 11),
          h2: hash(i, 13),
        });
      }
    }
  });
  return dots;
};

const tone = makeTone(RED_DEEP, RED);

const Field: React.FC<{ frame: number }> = ({ frame }) => {
  const dots = useMemo(buildDots, []);
  // a very slow collective drift
  const gx = 5 * Math.sin(frame * 0.021 + 1);
  const gy = 4 * Math.sin(frame * 0.017);
  const lift = smooth01((frame - 100) / 12);
  return (
    <svg
      width={1}
      height={1}
      style={{ position: "absolute", left: FIELD_X, top: FIELD_Y, overflow: "visible" }}
    >
      <g transform={`translate(${gx.toFixed(2)} ${gy.toFixed(2)})`}>
        {/* threads between neighbours */}
        {THREAD_GEO.map((g, i) => (
          <line
            key={i}
            x1={g.x1}
            y1={g.y1}
            x2={g.x2}
            y2={g.y2}
            stroke={INK42}
            strokeWidth={THREAD_W}
            strokeLinecap="round"
          />
        ))}

        {/* the crowds; only the central one, once fully lit, lifts off the page */}
        {CROWDS.map((k, c) => (
          <g
            key={c}
            style={
              c === 0 && lift > 0.01
                ? { filter: `drop-shadow(0 4px 8px rgba(70,35,15,${(0.16 * lift).toFixed(3)}))` }
                : undefined
            }
          >
            {dots.map((d, i) => {
              if (d.c !== c) return null;
              let lit = 0;
              let swell = 0;
              for (const ta of ARRIVALS[c]) {
                const sw = frame - ta - d.d / k.speed;
                if (sw <= 0) continue;
                swell = Math.max(swell, pulse(sw));
                // the central crowd's last wave does not fall back
                lit = Math.max(lit, c === 0 && ta >= FINAL_WAVE_F ? smooth01(sw / 6) : pulse(sw));
              }
              const x = d.x + 1.8 * Math.sin(frame * 0.07 + d.h1 * 6.283);
              const y = d.y + 1.8 * Math.cos(frame * 0.06 + d.h2 * 6.283);
              return (
                <circle
                  key={i}
                  cx={x.toFixed(2)}
                  cy={y.toFixed(2)}
                  r={(d.r * (1 + 0.09 * swell)).toFixed(2)}
                  fill={tone(lit)}
                />
              );
            })}
          </g>
        ))}

        {/* packets: ink beads on the threads */}
        {THREADS.map((t, i) => {
          const g = THREAD_GEO[i];
          const T = g.len / PACKET_SPEED;
          const u = (((frame - t.arrive) % t.period) + t.period) % t.period; // frames since the last arrival
          const left = t.period - u; // frames until the next
          if (left > T) return null;
          const p = 1 - left / T;
          const grow = smooth01(p / 0.12) * (1 - smooth01((p - 0.9) / 0.1));
          return (
            <circle
              key={i}
              cx={g.x1 + (g.x2 - g.x1) * p}
              cy={g.y1 + (g.y2 - g.y1) * p}
              r={9 * (0.4 + 0.6 * grow)}
              fill={INK90}
            />
          );
        })}

        {/* each crowd's ring; it takes the packet with a very small press */}
        {CROWDS.map((_, c) => {
          const ring = ringOf(c);
          // the press comes when the wave reaches the ring
          const lag = Math.hypot(ring.x - ENTRY[c].x, ring.y - ENTRY[c].y) / CROWDS[c].speed;
          let since = 999;
          for (const ta of ARRIVALS[c]) {
            if (frame >= ta + lag) since = Math.min(since, frame - ta - lag);
          }
          const bump = since < 12 ? Math.pow(Math.sin((Math.PI * since) / 12), 2) : 0;
          return (
            <circle
              key={c}
              cx={ring.x}
              cy={ring.y}
              r={ring.r * (1 + 0.05 * bump)}
              fill="none"
              stroke={INK90}
              strokeWidth={RING_W}
            />
          );
        })}
      </g>
    </svg>
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


  const sealVisible = SEAL_X - cam + BADGE / 2 + 120 > 0;
  const paperVisible = EDGE_X + PAPER_L - cam < W + 80;
  // a slight continuous pull-back over the second half, so the field opens
  const fieldK = 1.06 - 0.06 * smooth01((frame - 63) / (DURATION - 1 - 63));

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

      {/* the paper world: parallax 1.0, opening slightly as we arrive */}
      {paperVisible ? (
        <AbsoluteFill
          style={{ transform: `scale(${fieldK})`, transformOrigin: `${CX}px ${CY}px` }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              transform: `translate3d(${-cam}px, 0, 0)`,
            }}
          >
            {/* a faint ink wash running ahead of the paper's wet edge */}
            <div
              style={{
                position: "absolute",
                left: EDGE_X + PAPER_L,
                top: PAPER_T,
                width: PAPER_W,
                height: PAPER_H,
                filter: `blur(${EDGE_BLUR * 0.8}px)`,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundColor: "rgba(28,25,23,0.16)",
                  clipPath: edgeClip(frame + 40, -70),
                }}
              />
            </div>
            {/* the paper itself, feathered along the wobbling edge */}
            <div
              style={{
                position: "absolute",
                left: EDGE_X + PAPER_L,
                top: PAPER_T,
                width: PAPER_W,
                height: PAPER_H,
                filter: `blur(${EDGE_BLUR}px)`,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundColor: PAPER,
                  clipPath: edgeClip(frame, 0),
                }}
              />
            </div>
            {/* its fibre grain, faded in behind the edge */}
            <Img
              src={staticFile(PAPER_SRC)}
              style={{
                position: "absolute",
                left: EDGE_X + 40,
                top: -600,
                width: 1800,
                height: 3150,
                maxWidth: "none",
                maskImage: "linear-gradient(to right, transparent 0px, black 240px)",
                WebkitMaskImage: "linear-gradient(to right, transparent 0px, black 240px)",
              }}
            />
            <Field frame={frame} />
          </div>
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};

export default DepartmentOfWarOpen;
