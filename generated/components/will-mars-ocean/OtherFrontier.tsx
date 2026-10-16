import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import type { Cam } from "../kits/dwarkesh/outgrowShared";
import { BLOOM_LAYERS, COLOR, StoutStage, clamp01, mixHex } from "../kits/cheeky-pint/stoutShared";
import { pegPath } from "../kits/cheeky-pint/talentShared";
import { AMBER, WATER } from "../kits/cheeky-pint/marsOceanShared";

// ---------------------------------------------------------------------------
// OtherFrontier — Cheeky Pint S4E02 "we've mapped more of Mars than the ocean" (Will O'Brien, Ulysses).
// 1080x1920, 23.976 fps (24000/1001), opaque. The "realistic underwater, Cheeky Pint vibe" look of the
// clip (brief_common.md): stout B1 stage + grain + brown vignette, one amber = light.
//
// LINE (sequence 00:00:22:05 -> 00:00:28:07): "and now, like, okay, we're doing space — we have this
// whole other frontier here, and you're telling me there's a fraction of people actually working on this
// day to day"
// CHECK LINE: Everyone is looking up at space, but the other frontier is right here beneath the
// surface — huge — and only a handful of people are down there.
// DURATION = 145 frames (6.047 s x 23.976 = 144.98 -> 145) + 12 extra hold frames as a handle = 157.
// ONSETS (f): now 1 · okay 9 · doing 19 · space 21 · we 28 · have 37 · whole 41 · other 47 · frontier 52 ·
// here 61 · and 68 · you're 74 · telling 77 · there's 84 · fraction 90 · people 104 · actually 108 ·
// working 115 · this 126 · day 129 · to 133 · day 135-140.
//
// THE MOTION. An over/under split shot: a half-submerged camera at the surface. Above the waterline the
// beach recedes behind the water, packed edge to edge with a crowd of cream people (front ranks large,
// back ranks smaller and hazier) watching a Falcon-9-like rocket climb off its pad behind them on its own
// amber light. Below the waterline we look out into the sea: a sandy bottom just under the surface that
// falls away into haze and on down into the deep. The rocket goes up and out of frame by "space"; the
// camera tilts DOWN through the waterline on "whole other frontier here", closes on one working
// submersible ("a fraction of people"), then pulls back to both worlds: the full-width crowd across the
// top, the waterline, and a huge dark water column with only four small amber lamps in it.
// (Rounds 1-2 were a side-on cross-section; the cut-through land fought the 9:16 frame.)
// ---------------------------------------------------------------------------

export const FPS = 24000 / 1001;
export const DURATION = 157;

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

// --- small helpers -------------------------------------------------------------------------------
const f2 = (v: number) => (Math.round(v * 100) / 100).toString();
const fx = (v: number) => (Math.round(v * 1e6) / 1e6).toString();
const hash01 = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

// --- palette (WATER and AMBER are the clip's tokens, imported from marsOceanShared) ----------------
const CREAM = COLOR.cream;
/** water colour stops by depth (world px below the waterline) */
const WATER_STOPS: [number, string][] = [
  [0, WATER.surface],
  [160, "#2A6A70"],
  [450, "#245A64"],
  [900, WATER.mid],
  [1600, WATER.deep],
  [2500, WATER.darkest],
];
const waterAt = (y: number) => {
  const s = WATER_STOPS;
  if (y <= s[0][0]) return s[0][1];
  for (let i = 1; i < s.length; i++) {
    if (y <= s[i][0]) return mixHex(s[i - 1][1], s[i][1], (y - s[i - 1][0]) / (s[i][0] - s[i - 1][0]));
  }
  return s[s.length - 1][1];
};
/** an Earth dusk by height (world y, negative = up): a cool petrol-brown overhead grading to the warm amber
 *  glow at the horizon; never black; a touch of the stout kraft sheet shows through at the very top */
const SKY_STOPS: [number, string, number][] = [
  [-2800, "#2C393B", 0.85],
  [-1900, "#363D3B", 0.95],
  [-1300, "#4A4540", 1],
  [-850, "#6B5242", 1],
  [-520, "#94643F", 1],
  [-330, "#BE8148", 1],
  [-220, "#DA9F5E", 1],
  [0, "#DDA466", 1],
];
/** the lit seafloor of NoEyesOnIt (measured swaths under amber light): warm umber .. warm sand */
const LIT = { lo: "#6A4C2C", hi: "#FFD99C" } as const;
/** the haze the far beach recedes into */
const HAZE = "#C99A6C";

// --- the world (world px; the waterline is y = 0; up is negative) ---------------------------------
// Above: the far water strip, then the beach receding from its wet edge back to the dunes, a low
// distant shore with the pad. Below: the water, and the sea bottom seen receding (a backdrop plane).
const BEACH = { edge: -8, back: -178 } as const;
const DUNES = -200;
const PAD = { x: 160, y: -205 } as const; // the pad's deck, on the distant shore behind the dunes

// --- the rocket ------------------------------------------------------------------------------------
// altitude of the nozzle above the pad deck (world px) at frame t: already climbing at frame 0 (it left
// the pad at t = -T_PRE from rest), then a steady push out of the top of frame by "space" (21-28).
const A0 = 315;
const V0 = 25;
const ACC = 1.72;
const T_PRE = (2 * A0) / V0; // from rest, constant acceleration, reaching A0 at V0 on frame 0
const ACC_PRE = V0 / T_PRE;
const alt = (t: number) => (t >= 0 ? A0 + V0 * t + 0.5 * ACC * t * t : t <= -T_PRE ? 0 : 0.5 * ACC_PRE * Math.pow(t + T_PRE, 2));
const vel = (t: number) => (t >= 0 ? V0 + ACC * t : t <= -T_PRE ? 0 : ACC_PRE * (t + T_PRE));
const tPass = (h: number) => (h <= A0 ? -T_PRE + Math.sqrt((2 * Math.max(0, h)) / ACC_PRE) : (-V0 + Math.sqrt(V0 * V0 + 2 * ACC * (h - A0))) / ACC);
const LEAN = 0.00004; // the gravity turn: x drift = LEAN h^2 (leans right)
const pathX = (h: number) => PAD.x + LEAN * h * h;
const ROCKET = { len: 420, w: 22 } as const;

// --- the crowd: the house person peg (talentShared PersonPeg: head + shoulders, lit rim), in cream ---
const PEG_U = 429;
const headPath = (x: number, y: number, size: number, inset = 0) => {
  const u = size / PEG_U;
  const r = 102 * u - inset / 2;
  const cy = y - 327 * u + inset / 2;
  return `M${f2(x + r)} ${f2(cy)}A${f2(r)} ${f2(r)} 0 1 1 ${f2(x - r)} ${f2(cy)}A${f2(r)} ${f2(r)} 0 1 1 ${f2(x + r)} ${f2(cy)}Z`;
};
const shoulderPath = (x: number, y: number, size: number, inset = 0) => {
  const u = size / PEG_U;
  const q = (204 * u - inset) / (204 * u);
  const X = (a: number) => f2(x + (a - 255.5) * u);
  const Y = (b: number) => f2(y + (b - 470) * u * q);
  return (
    `M${X(41)} ${Y(458)}C${X(41)} ${Y(352)} ${X(126)} ${Y(266)} ${X(232)} ${Y(266)}L${X(279)} ${Y(266)}` +
    `C${X(385)} ${Y(266)} ${X(470)} ${Y(352)} ${X(470)} ${Y(458)}L${X(470)} ${Y(470)}L${X(41)} ${Y(470)}Z`
  );
};
/** ranks receding up the beach: front rank 55 (heads ~26 px at f0), each rank back smaller, higher and in
 *  more shade; people a little apart (pitch ~0.64 x size) so the dark between them reads; three tone
 *  buckets per rank (people wear different things); about one in six has their head tilted up toward
 *  the rocket (up and to the right). */
const RANKS = 6;
const FRONT = 55;
type Rank = { y: number; s: number; heads: string[]; shoulders: string[]; all: string };
const HEADS = [COLOR.cream, "#EADFCB", "#E2D2B8"]; // cream heads
const SHIRTS = ["#A98463", "#8C6C52", "#C2A07A"]; // kraft-toned clothes
const CROWD: Rank[] = (() => {
  const out: Rank[] = [];
  let y = BEACH.edge - 10;
  for (let r = 0; r < RANKS; r++) {
    const s = FRONT / (1 + 0.15 * r);
    const heads = ["", "", ""];
    const shoulders = ["", "", ""];
    let all = "";
    let x = -1120 + hash01(r * 17 + 3) * s * 0.6 + (r % 2) * s * 0.36;
    let i = 0;
    while (x < 1120) {
      const py = y + (hash01(r * 500 + i * 3.1) - 0.5) * s * 0.1;
      const ps = s * (0.9 + 0.2 * hash01(r * 900 + i * 5.7));
      const b = Math.floor(hash01(r * 77.7 + i * 1.37) * 3);
      const tilt = hash01(r * 41.3 + i * 9.1) < 0.17;
      const hd = tilt ? headPath(x + ps * 0.05, py - ps * 0.06, ps) : headPath(x, py, ps);
      const sh = shoulderPath(x, py, ps);
      heads[b] += hd;
      shoulders[b] += sh;
      all += hd + sh;
      x += s * (0.66 + 0.2 * hash01(r * 300 + i * 2.3));
      i++;
    }
    out.push({ y, s, heads, shoulders, all });
    y -= s * 0.7;
  }
  return out;
})();

// --- the handful: four submersibles, each one pilot, each one lamp -----------------------------------
// final frame (k ~0.62, waterline at y ~360 on screen): A (720, 860), B (300, 1305), C (850, 1560),
// D (400, 1760); all clear of the caption bands (1080-1250, 1360-1460); C and D light the bottom.
// A cruises slowly to the right the whole cut (vx), so the close-up keeps developing.
type Sub = { x: number; y: number; face: 1 | -1; aim: number; phase: number; bob: number; pool: number; vx: number; sweep: number };
const SUBS: Sub[] = [
  { x: 290, y: 806, face: 1, aim: 0.6, phase: 0, bob: 1, pool: 0, vx: 0.8, sweep: 0.16 }, // A: mid-water, the one the camera finds
  { x: -387, y: 1524, face: -1, aim: 0.7, phase: 37, bob: 0.8, pool: 0, vx: 0, sweep: 0.09 }, // B: mid-water, lamp down
  { x: 500, y: 1935, face: -1, aim: 0.85, phase: 71, bob: 1.1, pool: 170, vx: 0, sweep: 0.09 }, // C: lamp on the bottom
  { x: -226, y: 2258, face: 1, aim: 0.75, phase: 19, bob: 0.7, pool: 120, vx: 0, sweep: 0.09 }, // D: lamp on the bottom
];
const LAMP_HALF = 0.25; // the cone's half-angle (rad)
const LAMP_REACH = 520; // the cone fades out by here in open water
const LAMP_AT = { x: 74, y: 20 } as const; // the lamp on the sub (local, facing right)

// --- the sea bottom seen receding: ripple crests, spacing tightening with distance ------------------
const BOTTOM_END = 3300;
/** how much of the bottom shows through the water at y (near sand under the surface .. far deep floor) */
const bottomVis = (y: number) => 0.05 + 0.6 * Math.exp(-Math.max(0, y - 30) / 240);
const spacingAt = (y: number) => 7 + 64 * Math.exp(-y / 520);
const RIPPLES: { d: string; y: number; s: number }[] = (() => {
  const out: { d: string; y: number; s: number }[] = [];
  let y = 26;
  let i = 0;
  while (y < BOTTOM_END) {
    const s = spacingAt(y);
    const amp = s * 0.3;
    const lam = 70 + s * 2.4;
    const ph = hash01(i * 3.3) * 6.28;
    // broken crests: runs of sand ripple with gaps between them, never ruled lines
    let d = "";
    let x = -2600 + hash01(i * 7.1) * 300;
    let n = 0;
    while (x < 2600) {
      const run = 120 + 520 * hash01(i * 13.7 + n * 3.9);
      const gap = 30 + 220 * hash01(i * 5.3 + n * 7.7);
      const yo = (hash01(i * 2.9 + n * 1.3) - 0.5) * s * 0.5;
      for (let xx = x, first = true; xx <= x + run; xx += 30, first = false) {
        const yy = y + yo + amp * Math.sin(xx / lam + ph) + amp * 0.45 * Math.sin(xx / (lam * 0.41) + ph * 1.7);
        d += `${first ? "M" : "L"}${f2(xx)} ${f2(yy)}`;
      }
      x += run + gap;
      n++;
    }
    out.push({ d, y, s });
    y += s * (0.85 + 0.3 * hash01(i * 9.1));
    i++;
  }
  return out;
})();

// --- the camera: a keyed glide track, run through a damped follow ------------------------------------
type Glide = { f0: number; f1: number; dx?: number; dy?: number; k?: number };
const CAM_START = { x: 100, y: -660, k: 1 };
const GLIDES: Glide[] = [
  { f0: 10, f1: 70, dx: 150, dy: 1250, k: 1.04 }, // down through the waterline
  { f0: 50, f1: 100, dx: 84, dy: 324, k: 1.3 }, // on down, closing on the first pilot (who keeps cruising)
  { f0: 90, f1: 120, dx: -334, dy: 54, k: 0.625 }, // the pull-back: both worlds, established by ~125
  { f0: 118, f1: 200, dy: 12, k: 0.605 }, // the settled creep
];
const CAM_STIFF = 0.12;
const CAM_DAMP = 0.52;
const easeGlide = (u: number) => {
  const x = clamp01(u);
  return x * x * (3 - 2 * x);
};
const CAM_TRACK: Cam[] = (() => {
  const T: Cam[] = [];
  for (let f = 0; f <= DURATION + 4; f++) {
    let x = CAM_START.x;
    let y = CAM_START.y;
    let lk = Math.log(CAM_START.k);
    let kPrev = CAM_START.k;
    for (const g of GLIDES) {
      const e = easeGlide((f - g.f0) / (g.f1 - g.f0));
      x += (g.dx ?? 0) * e;
      y += (g.dy ?? 0) * e;
      if (g.k !== undefined) {
        lk += (Math.log(g.k) - Math.log(kPrev)) * e;
        kPrev = g.k;
      }
    }
    T.push({ x, y, k: lk });
  }
  const out: Cam[] = [];
  let c = { ...T[0] };
  let v = { x: 0, y: 0, k: 0 };
  for (let f = 0; f < T.length; f++) {
    if (f > 0) {
      const t = T[f];
      v = {
        x: v.x + (t.x - c.x) * CAM_STIFF - v.x * CAM_DAMP,
        y: v.y + (t.y - c.y) * CAM_STIFF - v.y * CAM_DAMP,
        k: v.k + (t.k - c.k) * CAM_STIFF - v.k * CAM_DAMP,
      };
      c = { x: c.x + v.x, y: c.y + v.y, k: c.k + v.k };
    }
    out.push({ x: c.x, y: c.y, k: Math.exp(c.k) });
  }
  return out;
})();
export const camAt = (f: number): Cam => CAM_TRACK[Math.max(0, Math.min(CAM_TRACK.length - 1, Math.round(f)))];

// ===========================================================================
// LAYERS (all inside one world <g>, so every blend sees what is behind it)
// ===========================================================================
const Sky: React.FC = () => (
  <>
    <defs>
      <linearGradient id="ofSky" gradientUnits="userSpaceOnUse" x1="0" y1={SKY_STOPS[0][0]} x2="0" y2="0">
        {SKY_STOPS.map(([y, c, a]) => (
          <stop key={y} offset={f2((y - SKY_STOPS[0][0]) / -SKY_STOPS[0][0])} stopColor={c} stopOpacity={a} />
        ))}
      </linearGradient>
      <radialGradient id="ofDuskGlow" gradientUnits="userSpaceOnUse" cx="-900" cy="-200" r="1500" gradientTransform="translate(-900 -200) scale(1 0.32) translate(900 200)">
        <stop offset="0" stopColor="#E3AA6C" stopOpacity="0.55" />
        <stop offset="1" stopColor="#E3AA6C" stopOpacity="0" />
      </radialGradient>
    </defs>
    <rect x={-6000} y={-2800} width={12000} height={2800} fill="url(#ofSky)" />
    {/* the last of the sun, low on the left (the key light's side) */}
    <rect x={-6000} y={-1100} width={12000} height={1100} fill="url(#ofDuskGlow)" />
  </>
);

/** the distant shore behind the dunes, with the pad and its tower (hazed by distance) */
const FarShore: React.FC<{ k: number }> = ({ k }) => {
  const tx = PAD.x + 44;
  const top = PAD.y - 300;
  const lw = Math.max(1.4, 1.2 / k);
  let lattice = "";
  for (let y = PAD.y; y > top + 10; y -= 24) lattice += `M${tx - 8} ${y}L${tx + 8} ${y - 24}M${tx + 8} ${y}L${tx - 8} ${y - 24}`;
  return (
    <g>
      <path d={`M-6000 ${PAD.y + 6}L-1200 ${PAD.y + 2}Q-700 ${PAD.y - 14} -200 ${PAD.y - 4}L900 ${PAD.y - 2}Q1300 ${PAD.y - 16} 1800 ${PAD.y}L6000 ${PAD.y + 4}L6000 ${DUNES + 20}L-6000 ${DUNES + 20}Z`} fill="#8A5E3E" />
      <g stroke="#6A452D" strokeWidth={lw} fill="none">
        <path d={`M${tx - 8} ${PAD.y}V${top}M${tx + 8} ${PAD.y}V${top}${lattice}`} />
        <path d={`M${tx} ${top}V${top - 50}`} />
        <path d={`M${PAD.x - 140} ${PAD.y + 2}V${PAD.y - 330}M${PAD.x + 200} ${PAD.y + 2}V${PAD.y - 330}`} strokeWidth={lw * 0.8} />
      </g>
      <rect x={tx - 8} y={top} width={16} height={-top + PAD.y} fill="#6A452D" opacity={0.25} />
      <rect x={PAD.x - 36} y={PAD.y - 9} width={118} height={12} fill="#6A452D" />
    </g>
  );
};

/** smoke: ONE billowing ground cloud (its lobes are one shape, lit by the key light from the upper left,
 *  warmed from below by the launch, its edges broken by a slow turbulence) and a thinner rising column */
const Smoke: React.FC<{ f: number }> = ({ f }) => {
  const A = alt(f);
  const glow = Math.exp(-A / 700);
  const age0 = f + T_PRE;
  const spread = 1 - Math.exp(-age0 / 70);
  const lobes: { x: number; y: number; r: number }[] = [];
  for (let i = 0; i < 26; i++) {
    const d = hash01(i * 3.7 + 1) * 2 - 1;
    const h = hash01(i * 5.1 + 2);
    const x = PAD.x + 40 + d * (90 + 300 * spread) + 0.3 * age0;
    const r = (26 + 52 * hash01(i * 9.3 + 4)) * (0.55 + 0.6 * spread) * (1 - Math.abs(d) * 0.35);
    const y = PAD.y - r * 0.55 - h * (20 + 70 * spread) * (1 - Math.abs(d) * 0.6) - 0.06 * age0;
    lobes.push({ x, y, r });
  }
  const column: { x: number; y: number; r: number; a: number }[] = [];
  for (let h = 40; h < A - 6; h += 16) {
    const age = f - tPass(h);
    const j = hash01(h * 0.731 + 5);
    const r = Math.min(54, 8 + 3.1 * Math.sqrt(Math.max(0, age)) * (0.8 + 0.4 * j));
    const wind = 0.15 + 0.4 * Math.sin(h / 230 + 1) * Math.min(1, h / 500);
    column.push({ x: pathX(h) + age * wind + (j - 0.5) * r * 0.3, y: PAD.y - h - age * 0.04, r, a: 0.8 * Math.exp(-age / 300) });
  }
  const lobeD = lobes.map((l) => `M${f2(l.x + l.r)} ${f2(l.y)}A${f2(l.r)} ${f2(l.r)} 0 1 0 ${f2(l.x - l.r)} ${f2(l.y)}A${f2(l.r)} ${f2(l.r)} 0 1 0 ${f2(l.x + l.r)} ${f2(l.y)}Z`).join("");
  const cloudTop = Math.min(...lobes.map((l) => l.y - l.r));
  return (
    <g filter="url(#ofBillow)">
      <defs>
        <clipPath id="ofCloudClip">
          <path d={lobeD} />
        </clipPath>
        <radialGradient id="ofUnderglow" gradientUnits="userSpaceOnUse" cx={f2(PAD.x + 30)} cy={f2(PAD.y)} r={f2(220 + 200 * spread)}>
          <stop offset="0" stopColor="#FFB45A" stopOpacity={f2(0.85 * glow)} />
          <stop offset="0.5" stopColor="#E08A34" stopOpacity={f2(0.35 * glow)} />
          <stop offset="1" stopColor="#E08A34" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ofCloudShade" gradientUnits="userSpaceOnUse" x1="0" y1={f2(cloudTop)} x2="0" y2={f2(PAD.y)}>
          <stop offset="0" stopColor="#B7A592" />
          <stop offset="1" stopColor="#6F5E52" />
        </linearGradient>
      </defs>
      {/* the column: a thin, fading rope of smoke over the pad */}
      <g>
        {column.map((c, i) => (
          <circle key={i} cx={f2(c.x)} cy={f2(c.y)} r={f2(c.r)} fill="#9D8C7D" opacity={f2(c.a)} />
        ))}
        {column.map((c, i) => (
          <circle key={`l${i}`} cx={f2(c.x - c.r * 0.3)} cy={f2(c.y - c.r * 0.1)} r={f2(c.r * 0.62)} fill="#CFC0AD" opacity={f2(c.a * 0.6)} />
        ))}
      </g>
      {/* the ground cloud: one body, its billows lit from the upper left, the launch glowing under it */}
      <path d={lobeD} fill="url(#ofCloudShade)" />
      <g clipPath="url(#ofCloudClip)">
        {lobes.map((l, i) => (
          <circle key={i} cx={f2(l.x - l.r * 0.28)} cy={f2(l.y - l.r * 0.32)} r={f2(l.r * 0.72)} fill="#D9CAB6" opacity={0.42} />
        ))}
        <rect x={PAD.x - 900} y={cloudTop - 50} width={1800} height={-cloudTop + PAD.y + 60} fill="url(#ofUnderglow)" style={{ mixBlendMode: "screen" }} />
      </g>
    </g>
  );
};

/** the rocket: a Falcon-9-like stack lit by its own exhaust, with its plume, bloom and light */
const Rocket: React.FC<{ f: number; k: number }> = ({ f, k }) => {
  const A = alt(f);
  const v = vel(f);
  const x = pathX(A);
  const y = PAD.y - A;
  const tilt = (Math.atan(2 * LEAN * A) * 180) / Math.PI;
  const { len, w } = ROCKET;
  const hw = w / 2;
  const flick = 1 + 0.05 * Math.sin(f * 2.1) + 0.035 * Math.sin(f * 3.7 + 1);
  const pl = (90 + Math.min(150, A * 0.06)) * flick; // plume length grows as the air thins
  const pw = 13 + Math.min(16, A * 0.007);
  const blur = Math.min(26, 0.17 * v);
  const plume = `M${-hw + 2} 0C${-pw} ${pl * 0.25} ${-pw * 0.8} ${pl * 0.7} 0 ${pl}C${pw * 0.8} ${pl * 0.7} ${pw} ${pl * 0.25} ${hw - 2} 0Z`;
  const core = `M${-hw + 4} 0C${-hw} ${pl * 0.2} ${-4} ${pl * 0.45} 0 ${pl * 0.55}C4 ${pl * 0.45} ${hw} ${pl * 0.2} ${hw - 4} 0Z`;
  const fairing = `M${-hw - 3} -${len - 70}V-${len - 34}C${-hw - 3} -${len - 12} -5 -${len} 0 -${len + 4}C5 -${len} ${hw + 3} -${len - 12} ${hw + 3} -${len - 34}V-${len - 70}Z`;
  return (
    <g transform={`translate(${fx(x)} ${fx(y)}) rotate(${fx(tilt)})`}>
      <defs>
        <linearGradient id="ofBody" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#CDBFAE" />
          <stop offset="0.28" stopColor={CREAM} />
          <stop offset="0.62" stopColor="#D9CDBC" />
          <stop offset="1" stopColor="#8E7E6E" />
        </linearGradient>
        <linearGradient id="ofUnder" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="-170">
          <stop offset="0" stopColor={AMBER.top} stopOpacity="0.75" />
          <stop offset="1" stopColor={AMBER.top} stopOpacity="0" />
        </linearGradient>
        <linearGradient id="ofPlume" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={f2(pl)}>
          <stop offset="0" stopColor="#FFF7E2" />
          <stop offset="0.22" stopColor={AMBER.hot} />
          <stop offset="0.55" stopColor={AMBER.top} stopOpacity="0.9" />
          <stop offset="1" stopColor={AMBER.foot} stopOpacity="0" />
        </linearGradient>
        <radialGradient id="ofEngineGlow">
          <stop offset="0" stopColor="#FFC060" stopOpacity="0.55" />
          <stop offset="0.35" stopColor="#FFA030" stopOpacity="0.2" />
          <stop offset="1" stopColor="#FF9020" stopOpacity="0" />
        </radialGradient>
        <filter id="ofMotion" x="-200%" y="-60%" width="500%" height="220%">
          <feGaussianBlur stdDeviation={`${f2(Math.max(0.01, 0.6 / k))} ${f2(Math.max(0.01, blur))}`} />
        </filter>
      </defs>
      {/* its light on the sky, the smoke and the people */}
      <circle cx={0} cy={pl * 0.3} r={420} fill="url(#ofEngineGlow)" style={{ mixBlendMode: "screen" }} />
      <g filter={blur > 0.6 ? "url(#ofMotion)" : undefined}>
        <g style={{ filter: BLOOM_LAYERS.map((l) => `drop-shadow(0 0 ${f2(l.blur / k)}px ${l.color})`).join(" ") }}>
          <path d={plume} fill="url(#ofPlume)" />
          <path d={core} fill="#FFFBF0" opacity={0.9} />
        </g>
        <path d={`M${-hw + 1} 0L${-hw} -16H${hw}L${hw - 1} 0Z`} fill="#5E4B3E" />
        <rect x={-hw} y={-(len - 120)} width={w} height={len - 136} fill="url(#ofBody)" />
        <path d={`M${-hw} -16V-92M${hw} -16V-92`} stroke="#4E3E33" strokeWidth={3} />
        <rect x={-hw} y={-(len - 100)} width={w} height={20} fill="#3E3029" />
        <rect x={-hw - 5} y={-(len - 104)} width={5} height={7} fill="#4E3E33" />
        <rect x={hw} y={-(len - 104)} width={5} height={7} fill="#4E3E33" />
        <rect x={-hw} y={-(len - 70)} width={w} height={30} fill="url(#ofBody)" />
        <path d={fairing} fill="url(#ofBody)" />
        <rect x={-hw - 3} y={-170} width={w + 6} height={170} fill="url(#ofUnder)" style={{ mixBlendMode: "screen" }} />
      </g>
    </g>
  );
};

/** the beach seen from the water: the far water strip, sand receding to the dunes, and the crowd on it
 *  in ranks (back first), each rank further back in more shade; one shadow per rank on the sand. A person:
 *  a dark gap line around them, the lit rim of the key light (upper left), the body under it. */
const Beach: React.FC<{ f: number; k: number }> = ({ f, k }) => {
  const A = alt(f);
  const warm = clamp01(1.25 * Math.exp(-(A - 200) / 700)); // the rocket's light on the crowd, fading as it climbs
  return (
    <g>
      <defs>
        <linearGradient id="ofSand" gradientUnits="userSpaceOnUse" x1="0" y1={DUNES} x2="0" y2={BEACH.edge}>
          <stop offset="0" stopColor="#6E4E34" />
          <stop offset="0.12" stopColor={mixHex("#B98E62", HAZE, 0.3)} />
          <stop offset="0.75" stopColor="#B08559" />
          <stop offset="0.92" stopColor="#94704E" />
          <stop offset="1" stopColor="#7E6046" />
        </linearGradient>
        <linearGradient id="ofFarSea" gradientUnits="userSpaceOnUse" x1="0" y1={BEACH.edge} x2="0" y2="0">
          <stop offset="0" stopColor="#B49276" />
          <stop offset="1" stopColor="#5E837E" />
        </linearGradient>
        <filter id="ofRankShadow" x="-5%" y="-50%" width="110%" height="200%">
          <feGaussianBlur stdDeviation={2} />
        </filter>
        {CROWD.map((rk, r) =>
          [0, 1, 2].map((b) => (
            <React.Fragment key={`${r}-${b}`}>
              <clipPath id={`ofHead${r}_${b}`}>
                <path d={rk.heads[b]} />
              </clipPath>
              <clipPath id={`ofSh${r}_${b}`}>
                <path d={rk.shoulders[b]} />
              </clipPath>
            </React.Fragment>
          )),
        )}
      </defs>
      {/* dunes and the beach */}
      <path
        d={`M-6000 ${DUNES + 6}Q-4000 ${DUNES - 10} -2400 ${DUNES + 2}T-600 ${DUNES - 2}T1200 ${DUNES + 4}T3000 ${DUNES - 4}T6000 ${DUNES + 2}L6000 ${BEACH.edge}L-6000 ${BEACH.edge}Z`}
        fill="url(#ofSand)"
      />
      {/* the crowd, back rank first */}
      {[...CROWD].reverse().map((rk, ri) => {
        const r = RANKS - 1 - ri;
        const back = r / (RANKS - 1);
        const shadeOf = (c: string) => mixHex(mixHex(c, "#8F6E52", back * 0.62), "#FFD9A6", warm * 0.45 * (1 - back * 0.6));
        const e = rk.s * 0.085;
        return (
          <g key={r}>
            <path d={rk.all} fill={COLOR.shadow} opacity={0.28} transform={`translate(${f2(rk.s * 0.14)} ${f2(rk.s * 0.05)})`} filter="url(#ofRankShadow)" />
            {/* the dark between people */}
            <path d={rk.all} fill="none" stroke={mixHex(COLOR.shadow, "#5A3F2A", 0.3)} strokeOpacity={0.55} strokeWidth={Math.max(rk.s * 0.07, 1 / k)} strokeLinejoin="round" />
            {/* each person: shoulders in their own clothes (kraft tones), a cream head; both rimmed by the key
                light from the upper left (the body is the same shape, nudged down-right, inside it) */}
            {[0, 1, 2].map((b) => (
              <g key={b}>
                <path d={rk.shoulders[b]} fill={shadeOf(mixHex(SHIRTS[b], "#FFFFFF", 0.32))} />
                <g clipPath={`url(#ofSh${r}_${b})`}>
                  <path d={rk.shoulders[b]} transform={`translate(${f2(e * 0.55)} ${f2(e)})`} fill={shadeOf(SHIRTS[b])} />
                </g>
              </g>
            ))}
            {[0, 1, 2].map((b) => (
              <g key={`h${b}`}>
                <path d={rk.heads[b]} fill={shadeOf(mixHex(HEADS[b], "#FFFFFF", 0.5))} />
                <g clipPath={`url(#ofHead${r}_${b})`}>
                  <path d={rk.heads[b]} transform={`translate(${f2(e * 0.45)} ${f2(e * 0.8)})`} fill={shadeOf(HEADS[b])} />
                </g>
              </g>
            ))}
          </g>
        );
      })}
      {/* the far water between us and the beach, catching the sky */}
      <rect x={-6000} y={BEACH.edge} width={12000} height={-BEACH.edge} fill="url(#ofFarSea)" />
      <rect x={-6000} y={BEACH.edge} width={12000} height={Math.max(1, 1.2 / k)} fill="#F3E6CF" opacity={0.45} />
    </g>
  );
};

/** the water volume and its light shafts; the bottom seen receding; the waterline */
const Water: React.FC<{ f: number }> = ({ f }) => {
  const shafts: { d: string; a: number }[] = [];
  for (let i = 0; i < 26; i++) {
    const x0 = -2200 + i * 170 + (hash01(i * 4.1) - 0.5) * 120 + 26 * Math.sin(f / 46 + i * 1.7);
    const w0 = 30 + 110 * hash01(i * 7.7 + 1);
    const L = 380 + 440 * hash01(i * 2.9 + 3);
    const sl = 0.27;
    const sp = 0.35 * w0;
    shafts.push({
      d: `M${f2(x0)} 0L${f2(x0 + w0)} 0L${f2(x0 + w0 + sl * L + sp)} ${f2(L)}L${f2(x0 + sl * L - sp)} ${f2(L)}Z`,
      a: (0.1 + 0.14 * hash01(i * 3.3 + 9)) * (0.75 + 0.25 * Math.sin(f / 31 + i * 2.3)),
    });
  }
  return (
    <g>
      <defs>
        <linearGradient id="ofWater" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={WATER_STOPS[WATER_STOPS.length - 1][0]}>
          {WATER_STOPS.map(([y, c]) => (
            <stop key={y} offset={f2(y / WATER_STOPS[WATER_STOPS.length - 1][0])} stopColor={c} />
          ))}
        </linearGradient>
        <linearGradient id="ofShaft" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="1080">
          <stop offset="0" stopColor="#D9EEDD" stopOpacity="1" />
          <stop offset="0.45" stopColor="#B7DCCF" stopOpacity="0.35" />
          <stop offset="1" stopColor="#B7DCCF" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="ofUnderside" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="46">
          <stop offset="0" stopColor="#86B7AE" stopOpacity="0.32" />
          <stop offset="1" stopColor="#86B7AE" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x={-6000} y={0} width={12000} height={7000} fill="url(#ofWater)" />
      <g filter="url(#ofShaftBlur)" style={{ mixBlendMode: "screen" }}>
        {shafts.map((s, i) => (
          <path key={i} d={s.d} fill="url(#ofShaft)" opacity={f2(s.a)} />
        ))}
      </g>
    </g>
  );
};
const Waterline: React.FC<{ k: number }> = ({ k }) => (
  <g>
    {/* the surface seen from just below (a bright band) and from just above (the meniscus line) */}
    <rect x={-6000} y={0} width={12000} height={46} fill="url(#ofUnderside)" style={{ mixBlendMode: "screen" }} />
    <rect x={-6000} y={-1.6 / k} width={12000} height={4 / k} fill="#E8F0E4" opacity={0.28} />
    <rect x={-6000} y={-0.7 / k} width={12000} height={1.4 / k} fill="#F2F5EC" opacity={0.7} />
  </g>
);

type Pool = { x: number; y: number; rx: number; ry: number; a: number };
/** the sea bottom seen receding behind the water: sand under the surface, falling away into the haze
 *  of the deep; ripples tighten with distance; lamp pools warm it where a light reaches it */
const Bottom: React.FC<{ cam: Cam; pools: Pool[] }> = ({ cam, pools }) => {
  const k = cam.k;
  const vy0 = cam.y - 1040 / k;
  const vy1 = cam.y + 1040 / k;
  const rows = RIPPLES.filter((r) => r.y > vy0 - 40 && r.y < vy1 + 40 && bottomVis(r.y) > 0.12);
  const sand = (y: number) => mixHex("#C2A57A", "#5E5A4C", clamp01(y / 900));
  return (
    <g>
      <defs>
        <linearGradient id="ofBottom" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={BOTTOM_END}>
          {[0, 40, 120, 260, 500, 900, 1600, 2400, BOTTOM_END].map((y) => (
            <stop key={y} offset={f2(y / BOTTOM_END)} stopColor={sand(y)} stopOpacity={f2(y < 20 ? 0 : bottomVis(y))} />
          ))}
        </linearGradient>
        {pools.map((p, i) => (
          <radialGradient key={i} id={`ofPool${i}`} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor={LIT.hi} stopOpacity={f2(0.9 * p.a)} />
            <stop offset="0.35" stopColor={mixHex(LIT.hi, LIT.lo, 0.45)} stopOpacity={f2(0.7 * p.a)} />
            <stop offset="0.7" stopColor={LIT.lo} stopOpacity={f2(0.3 * p.a)} />
            <stop offset="1" stopColor={LIT.lo} stopOpacity="0" />
          </radialGradient>
        ))}
        <radialGradient id="ofPoolMask" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.45" stopColor="#8A8A8A" />
          <stop offset="1" stopColor="#000000" />
        </radialGradient>
        <mask id="ofReveal" maskUnits="userSpaceOnUse" x="-3000" y="0" width="6000" height="3400">
          {pools.map((p, i) => (
            <ellipse key={i} cx={f2(p.x)} cy={f2(p.y)} rx={f2(p.rx * 1.8)} ry={f2(p.ry * 2.2)} fill="url(#ofPoolMask)" opacity={f2(p.a)} />
          ))}
        </mask>
        <mask id="ofPools" maskUnits="userSpaceOnUse" x="-3000" y="0" width="6000" height="3400">
          {pools.map((p, i) => (
            <ellipse key={i} cx={f2(p.x)} cy={f2(p.y)} rx={f2(p.rx)} ry={f2(p.ry)} fill="url(#ofPoolMask)" opacity={f2(p.a)} />
          ))}
        </mask>
      </defs>
      <rect x={-6000} y={0} width={12000} height={BOTTOM_END} fill="url(#ofBottom)" />
      {/* ripple crests (lit faces toward the upper-left key) and their shadowed backs */}
      {rows.map((r, i) => {
        const v = bottomVis(r.y);
        return (
          <g key={i} fill="none">
            <path d={r.d} transform={`translate(0 ${f2(r.s * 0.28)})`} stroke="#2A2620" strokeOpacity={f2(0.22 * v)} strokeWidth={f2(Math.min(6, r.s * 0.12))} strokeLinecap="round" />
            <path d={r.d} stroke="#F1DDB4" strokeOpacity={f2(0.3 * v)} strokeWidth={f2(Math.min(3.5, r.s * 0.07))} strokeLinecap="round" />
          </g>
        );
      })}
      {/* where a lamp reaches the bottom, the floor shows around it: dim sand and its ripples, fading out */}
      <g mask="url(#ofReveal)">
        <rect x={-3000} y={0} width={6000} height={BOTTOM_END} fill="#55594C" opacity={0.3} />
        {RIPPLES.filter((r) => pools.some((p) => Math.abs(r.y - p.y) < p.ry * 2.2)).map((r, i) => (
          <g key={i} fill="none" strokeLinecap="round">
            <path d={r.d} transform={`translate(0 ${f2(r.s * 0.3)})`} stroke="#241F19" strokeOpacity={0.45} strokeWidth={f2(Math.max(r.s * 0.16, 1.4 / k))} />
            <path d={r.d} stroke="#B9A684" strokeOpacity={0.5} strokeWidth={f2(Math.max(r.s * 0.09, 1 / k))} />
          </g>
        ))}
      </g>
      {/* the lamp pools: warm sand on the bottom, its ripples lit */}
      {pools.map((p, i) => (
        <ellipse key={i} cx={f2(p.x)} cy={f2(p.y)} rx={f2(p.rx)} ry={f2(p.ry)} fill={`url(#ofPool${i})`} />
      ))}
      <g mask="url(#ofPools)" fill="none">
        {RIPPLES.filter((r) => pools.some((p) => Math.abs(r.y - p.y) < p.ry)).map((r, i) => (
          <path key={i} d={r.d} stroke={LIT.hi} strokeOpacity={0.5} strokeWidth={f2(Math.max(r.s * 0.14, 1.4 / k))} strokeLinecap="round" />
        ))}
      </g>
    </g>
  );
};

type LampState = { sub: Sub; x: number; y: number; px: number; py: number; dx: number; dy: number; reach: number; hit: boolean };
const lampState = (s: Sub, f: number): LampState => {
  const t = f + s.phase;
  const x = s.x + s.vx * (f - 156) + 6 * Math.sin(t / 41) * s.bob;
  const y = s.y + 5 * Math.sin(t / 27) * s.bob;
  const aim = s.aim + s.sweep * Math.sin(t / 21) + 0.04 * Math.sin(t / 9.7);
  const dx = s.face * Math.cos(aim);
  const dy = Math.sin(aim);
  const px = x + s.face * LAMP_AT.x;
  const py = y + LAMP_AT.y;
  // a lamp on the bottom reaches it where its axis meets the bottom's level under the sub
  const hit = s.pool > 0;
  const reach = hit ? s.pool / Math.max(0.2, dy) : LAMP_REACH;
  return { sub: s, x, y, px, py, dx, dy, reach, hit };
};

/** a lamp's light in the water: a halo and a soft cone (drawn before the subs, screen) */
const LampLight: React.FC<{ l: LampState; i: number }> = ({ l, i }) => {
  const far = l.reach;
  const ax = l.px + l.dx * far;
  const ay = l.py + l.dy * far;
  const spread = Math.tan(LAMP_HALF) * far;
  const nx = -l.dy;
  const ny = l.dx;
  return (
    <g style={{ mixBlendMode: "screen" }}>
      <defs>
        <linearGradient id={`ofCone${i}`} gradientUnits="userSpaceOnUse" x1={f2(l.px)} y1={f2(l.py)} x2={f2(l.px + l.dx * LAMP_REACH)} y2={f2(l.py + l.dy * LAMP_REACH)}>
          <stop offset="0" stopColor={AMBER.hot} stopOpacity="0.62" />
          <stop offset="0.3" stopColor={AMBER.top} stopOpacity="0.3" />
          <stop offset="0.82" stopColor={AMBER.foot} stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`ofHalo${i}`} gradientUnits="userSpaceOnUse" cx={f2(l.px)} cy={f2(l.py)} r="230">
          <stop offset="0" stopColor="#FFC25A" stopOpacity="0.34" />
          <stop offset="0.3" stopColor="#FFA82A" stopOpacity="0.1" />
          <stop offset="0.65" stopColor="#FFA82A" stopOpacity="0.03" />
          <stop offset="1" stopColor="#FF9A20" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx={f2(l.px)} cy={f2(l.py)} r={230} fill={`url(#ofHalo${i})`} />
      <path
        d={`M${f2(l.px + nx * 4)} ${f2(l.py + ny * 4)}L${f2(ax + nx * spread)} ${f2(ay + ny * spread)}L${f2(ax - nx * spread)} ${f2(ay - ny * spread)}L${f2(l.px - nx * 4)} ${f2(l.py - ny * 4)}Z`}
        fill={`url(#ofCone${i})`}
        filter="url(#ofConeBlur)"
      />
    </g>
  );
};

/** an Alvin-like submersible: white hull lit from the upper left, a sail, a warm viewport with its pilot,
 *  a skid, a stern thruster, and the amber lamp on its bar (faces right; `face` mirrors it) */
const HULL = "M-66 4C-66 -14 -50 -24 -26 -24L30 -24C54 -24 68 -8 68 8C68 22 56 28 40 28L-46 28C-60 28 -66 18 -66 4Z";
const SAIL = "M-26 -23L-21 -37Q-19 -42 -13 -42L8 -42Q14 -42 14 -36L16 -23Z";
const Submersible: React.FC<{ l: LampState; k: number; i: number }> = ({ l, k, i }) => {
  const s = l.sub;
  const deep = waterAt(s.y);
  const lit = mixHex(CREAM, deep, 0.18);
  const mid = mixHex("#CFC5B5", deep, 0.25);
  const dark = mixHex("#7D7466", deep, 0.35);
  const metal = mixHex("#4A443C", deep, 0.25);
  const aimDeg = (Math.atan2(l.dy, Math.abs(l.dx)) * 180) / Math.PI;
  const hair = Math.max(1, 1.2 / k);
  return (
    <g transform={`translate(${fx(l.x)} ${fx(l.y)}) scale(${s.face} 1)`}>
      <defs>
        <linearGradient id={`ofHull${i}`} gradientUnits="userSpaceOnUse" x1="-30" y1="-40" x2="20" y2="30">
          <stop offset="0" stopColor={lit} />
          <stop offset="0.55" stopColor={mid} />
          <stop offset="1" stopColor={dark} />
        </linearGradient>
        <radialGradient id={`ofPort${i}`} gradientUnits="userSpaceOnUse" cx="49" cy="9" r="8">
          <stop offset="0" stopColor="#FFE2A8" />
          <stop offset="0.6" stopColor="#F2A846" />
          <stop offset="1" stopColor="#8A4E1C" />
        </radialGradient>
        <radialGradient id={`ofSpill${i}`} gradientUnits="userSpaceOnUse" cx="70" cy="18" r="60">
          <stop offset="0" stopColor="#FFC870" stopOpacity="0.55" />
          <stop offset="1" stopColor="#FFC870" stopOpacity="0" />
        </radialGradient>
        <clipPath id={`ofPortClip${i}`}>
          <circle cx={49} cy={9} r={7} />
        </clipPath>
      </defs>
      {/* skid + sample basket */}
      <g stroke={metal} strokeWidth={3.2} fill="none" strokeLinecap="round">
        <path d="M-48 40H50M-36 27V40M30 27V40" />
        <path d="M44 30H66V40H44" strokeWidth={2.2} />
      </g>
      {/* stern thruster */}
      <rect x={-82} y={-3} width={18} height={14} rx={4} fill={metal} />
      <ellipse cx={-84} cy={4} rx={2.2} ry={11} fill={metal} />
      {/* hull and sail */}
      <path d={SAIL} fill={`url(#ofHull${i})`} />
      <path d={HULL} fill={`url(#ofHull${i})`} />
      {/* the lower hull: the frame and syntactic foam, a darker band; a seam; a hatch on the sail */}
      <path d="M-64 12C-62 22 -54 28 -46 28L40 28C54 28 64 22 67 13Z" fill={metal} opacity={0.55} />
      <path d="M-64 11H67" stroke={dark} strokeWidth={hair} strokeOpacity={0.8} />
      <path d="M-2 -42Q-2 -48 4 -48Q10 -48 10 -42Z" fill={mid} />
      <path d="M-50 -8H-30M-50 0H-30" stroke={dark} strokeWidth={hair} strokeOpacity={0.6} />
      {/* a folded manipulator arm under the bow */}
      <path d="M36 28L48 34L60 30" stroke={metal} strokeWidth={3} fill="none" strokeLinejoin="round" />
      <path d="M-60 -6C-54 -18 -42 -23 -26 -23L30 -23" fill="none" stroke="#FFFFFF" strokeOpacity={0.55} strokeWidth={hair} />
      {/* its own lamp's spill on the bow */}
      <path d={HULL} fill={`url(#ofSpill${i})`} style={{ mixBlendMode: "screen" }} />
      {/* the viewport, warm from inside, with the pilot (only legible in the close-up) */}
      <circle cx={49} cy={9} r={8.6} fill={metal} />
      <circle cx={49} cy={9} r={7} fill={`url(#ofPort${i})`} />
      <g clipPath={`url(#ofPortClip${i})`}>
        <path d={pegPath(47.5, 17, 12.5)} fill="#3A2416" opacity={0.85} />
      </g>
      <circle cx={58} cy={18} r={3.4} fill={metal} />
      <circle cx={58} cy={18} r={2.4} fill="#E59A3E" />
      {/* the lamp on its bar */}
      <path d={`M60 22L${LAMP_AT.x} ${LAMP_AT.y}`} stroke={metal} strokeWidth={3.5} />
      <g transform={`translate(${LAMP_AT.x} ${LAMP_AT.y}) rotate(${fx(aimDeg)})`}>
        <rect x={-5} y={-5} width={10} height={10} rx={2} fill={metal} />
        <g style={{ filter: BLOOM_LAYERS.map((b) => `drop-shadow(0 0 ${f2(b.blur / k)}px ${b.color})`).join(" ") }}>
          <rect x={4} y={-4.5} width={3.5} height={9} rx={1.5} fill={AMBER.hot} />
        </g>
      </g>
    </g>
  );
};

/** a few small fish crossing the first pilot's beam during the close-up (dark, lit where the beam is) */
const FISH_PASS = (() => {
  const l = lampState(SUBS[0], 100);
  return { x: l.px + l.dx * 230, y: l.py + l.dy * 230 };
})();
const FISH = [
  { dx: 0, dy: 0, s: 1, ph: 0 },
  { dx: 34, dy: -18, s: 0.8, ph: 1.7 },
  { dx: -26, dy: 20, s: 0.9, ph: 3.1 },
];
const Fish: React.FC<{ f: number; lamp: LampState }> = ({ f, lamp }) => (
  <g>
    {FISH.map((q, i) => {
      const x = FISH_PASS.x + q.dx - 2.4 * (f - 100);
      const y = FISH_PASS.y + q.dy + 8 * Math.sin(f / 11 + q.ph);
      const rx = x - lamp.px;
      const ry = y - lamp.py;
      const along = rx * lamp.dx + ry * lamp.dy;
      const across = Math.abs(-rx * lamp.dy + ry * lamp.dx);
      const edge = along * Math.tan(LAMP_HALF) * 1.2;
      const lit = along > 0 && along < lamp.reach && across < edge ? clamp01((1 - across / edge) * 1.6) * (1 - along / LAMP_REACH) : 0;
      const tail = 5 * Math.sin(f * 0.9 + q.ph);
      const L = 34 * q.s;
      return (
        <path
          key={i}
          d={`M${f2(x)} ${f2(y)}C${f2(x + L * 0.25)} ${f2(y - L * 0.2)} ${f2(x + L * 0.7)} ${f2(y - L * 0.18)} ${f2(x + L * 0.82)} ${f2(y)}L${f2(x + L)} ${f2(y - L * 0.16 + tail * q.s)}L${f2(x + L)} ${f2(y + L * 0.16 + tail * q.s)}L${f2(x + L * 0.82)} ${f2(y)}C${f2(x + L * 0.7)} ${f2(y + L * 0.18)} ${f2(x + L * 0.25)} ${f2(y + L * 0.2)} ${f2(x)} ${f2(y)}Z`}
          fill={mixHex("#173236", "#E3B06A", lit)}
          opacity={0.85}
        />
      );
    })}
  </g>
);

/** marine snow: one particle per world cell, sinking slowly; lit where a lamp reaches it */
const Snow: React.FC<{ f: number; cam: Cam; lamps: LampState[] }> = ({ f, cam, lamps }) => {
  const k = cam.k;
  const CELL = 92;
  const x0 = cam.x - 560 / k;
  const x1 = cam.x + 560 / k;
  const sink = 0.42;
  const y0 = Math.max(16, cam.y - 980 / k);
  const y1 = cam.y + 980 / k;
  if (y1 < 16) return null;
  const i0 = Math.floor(x0 / CELL);
  const i1 = Math.ceil(x1 / CELL);
  const j0 = Math.floor((y0 - sink * f) / CELL) - 1;
  const j1 = Math.ceil((y1 - sink * f) / CELL);
  const dim: React.ReactNode[] = [];
  const lit: React.ReactNode[] = [];
  for (let j = j0; j <= j1; j++) {
    for (let i = i0; i <= i1; i++) {
      const h = hash01(i * 73.13 + j * 157.7);
      if (h > 0.82) continue;
      const h2 = hash01(i * 19.9 + j * 41.3 + 7);
      const h3 = hash01(i * 5.3 + j * 13.1 + 3);
      const x = (i + h2) * CELL + 7 * Math.sin(f / 33 + h * 40);
      const y = (j + h3) * CELL + sink * f * (0.7 + 0.6 * h);
      if (y < 14 || y > BOTTOM_END) continue;
      const sr = 0.9 + 1.5 * h2 * h2; // screen px
      const daylight = 0.16 + 0.5 * Math.exp(-y / 800);
      let glow = 0;
      for (const l of lamps) {
        const rx = x - l.px;
        const ry = y - l.py;
        const along = rx * l.dx + ry * l.dy;
        const across = Math.abs(-rx * l.dy + ry * l.dx);
        if (along > 0 && along < l.reach) {
          const edge = along * Math.tan(LAMP_HALF) * 1.15;
          if (across < edge) glow = Math.max(glow, (1 - along / LAMP_REACH) * (1 - across / edge) * 1.6);
        }
        const dd = Math.hypot(rx, ry);
        if (dd < 230) glow = Math.max(glow, 0.5 * (1 - dd / 230));
      }
      const r = (sr * (1 + glow * 0.6)) / k;
      if (glow > 0.05) {
        lit.push(<circle key={`${i},${j}`} cx={f2(x)} cy={f2(y)} r={f2(r)} fill={AMBER.hot} opacity={f2(Math.min(1, 0.25 + glow))} />);
      } else {
        dim.push(<circle key={`${i},${j}`} cx={f2(x)} cy={f2(y)} r={f2(r)} fill="#D4E6DC" opacity={f2(daylight * (0.5 + h))} />);
      }
    }
  }
  return (
    <>
      <g>{dim}</g>
      <g style={{ filter: `drop-shadow(0 0 ${f2(3 / k)}px rgba(255,190,90,0.6))` }}>{lit}</g>
    </>
  );
};

// ===========================================================================
// THE CUT
// ===========================================================================
const CAMERA_REST: Cam = { x: CAM_START.x, y: CAM_START.y, k: CAM_START.k };

const OtherFrontier: React.FC<Props> = () => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const k = cam.k;
  const sw = { dx: 3 * Math.sin(frame / 23), dy: 5 * Math.sin(frame / 19) };
  const tx = 540 - cam.x * k + sw.dx;
  const ty = 960 - cam.y * k + sw.dy;
  const lamps = SUBS.map((s) => lampState(s, frame));
  const pools: Pool[] = lamps
    .filter((l) => l.hit)
    .map((l) => ({ x: l.px + l.dx * l.reach, y: l.py + l.dy * l.reach, rx: 190 + l.reach * 0.25, ry: 64 + l.reach * 0.08, a: 0.85 }));
  const top = cam.y - 1000 / k;
  const showSky = top < 0;
  const showRocket = alt(frame) < 4000;
  // caustic light near the surface: a tileable caustic net stretched down and slanted, two copies
  const TILE = 760;
  const caus = (dir: number, speed: number, op: number, seed: number) => {
    const off = (((frame * speed * dir + seed) % TILE) + TILE) % TILE;
    return (
      <div key={seed} style={{ position: "absolute", left: -3800 + off, top: 0, width: TILE * 11, height: 1300, display: "flex", opacity: op }}>
        {Array.from({ length: 11 }, (_, i) => (
          <Img key={i} src={staticFile("ulysses/caustics.png")} style={{ width: TILE, height: 1300, flex: "none" }} />
        ))}
      </div>
    );
  };
  return (
    <AbsoluteFill style={{ backgroundColor: WATER.mid }}>
      <StoutStage
        S={frame}
        cam={cam}
        rest={CAMERA_REST}
        pool={null}
        sway
        overlay={
          <>
            <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0 }}>
              <defs>
                <filter id="ofBillow" x="-20%" y="-20%" width="140%" height="140%">
                  <feTurbulence type="fractalNoise" baseFrequency="0.016" numOctaves={3} seed={7} result="n" />
                  <feDisplacementMap in="SourceGraphic" in2="n" scale={34} xChannelSelector="R" yChannelSelector="G" result="d" />
                  <feGaussianBlur in="d" stdDeviation={3.2} />
                </filter>
                <filter id="ofShaftBlur" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation={16} />
                </filter>
                <filter id="ofConeBlur" x="-40%" y="-40%" width="180%" height="180%">
                  <feGaussianBlur stdDeviation={10} />
                </filter>
              </defs>
              <g transform={`translate(${fx(tx)} ${fx(ty)}) scale(${fx(k)})`}>
                {showSky ? (
                  <>
                    <Sky />
                    <FarShore k={k} />
                    <Smoke f={frame} />
                    {showRocket ? <Rocket f={frame} k={k} /> : null}
                    <Beach f={frame} k={k} />
                  </>
                ) : null}
                <Water f={frame} />
                <Bottom cam={cam} pools={pools} />
                {lamps.map((l, i) => (
                  <LampLight key={i} l={l} i={i} />
                ))}
                <Snow f={frame} cam={cam} lamps={lamps} />
                <Fish f={frame} lamp={lamps[0]} />
                {lamps.map((l, i) => (
                  <Submersible key={i} l={l} k={k} i={i} />
                ))}
                <Waterline k={k} />
              </g>
            </svg>
            {/* caustic light near the surface (screen), in world space under the same camera */}
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                transformOrigin: "0 0",
                transform: `translate(${fx(tx)}px, ${fx(ty)}px) scale(${fx(k)})`,
                mixBlendMode: "screen",
                opacity: 0.32,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: -3800,
                  top: 0,
                  width: 7600,
                  height: 1300,
                  overflow: "hidden",
                  transform: "skewX(-15deg)",
                  transformOrigin: "0 0",
                  WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.55) 25%, rgba(0,0,0,0) 85%)",
                  maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.55) 25%, rgba(0,0,0,0) 85%)",
                }}
              >
                {caus(1, 0.9, 0.7, 0)}
                {caus(-1, 0.6, 0.6, 333)}
              </div>
            </div>
          </>
        }
      />
    </AbsoluteFill>
  );
};

export default OtherFrontier;
