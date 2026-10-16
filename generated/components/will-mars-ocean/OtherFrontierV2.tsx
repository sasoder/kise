import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import type { Cam } from "../kits/dwarkesh/outgrowShared";
import { BLOOM_LAYERS, COLOR, StoutStage, clamp01, mixHex } from "../kits/cheeky-pint/stoutShared";
import { pegPath } from "../kits/cheeky-pint/talentShared";
import { AMBER, WATER } from "../kits/cheeky-pint/marsOceanShared";

// ---------------------------------------------------------------------------
// OtherFrontierV2 — improvement-loop version of OtherFrontier (the delivered cut stays in OtherFrontier.tsx). Cheeky Pint S4E02 "we've mapped more of Mars than the ocean" (Will O'Brien, Ulysses).
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
  [70, "#29646B"],
  [170, "#1E4850"],
  [330, "#1B3A3D"],
  [520, "#1D2E2C"],
  [720, "#1F2724"],
  [2000, "#1F231F"], // the unknown: a deep espresso-petrol, never black; the lamps are the light down here
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
  [-1500, "#2E3A3B", 0.9],
  [-1150, "#3F4140", 1],
  [-850, "#5E4A3E", 1],
  [-600, "#8C5E3E", 1],
  [-380, "#B87A46", 1],
  [-200, "#DC9C5C", 1],
  [-80, "#F0B676", 1],
  [0, "#F4C185", 1],
];
/** the lit seafloor of NoEyesOnIt (measured swaths under amber light): warm umber .. warm sand */
const LIT = { lo: "#6A4C2C", hi: "#FFD99C" } as const;

// --- the world (world px; the waterline is y = 0; up is negative) ---------------------------------
// A camera low at the water: the horizon is at the waterline. On the shore a crowd stands along a low
// sandbank, seen from behind as a silhouette skyline against the glow; the pad stands on the horizon
// beyond them. Below: open water deepening to a faint seabed at the bottom of the final frame.
const PAD = { x: 80, y: -480 } as const; // the pad's deck, beyond the rise the crowd stands on
const SHORE = { dry: -36, wet: -15 } as const; // the dry beach the crowd stands on, the wet sand below it
const FLOOR_Y = 1840; // the seabed, far below (a broad ridge rises from it under the subs)

// --- the rocket ------------------------------------------------------------------------------------
// altitude of the nozzle above the pad deck (world px) at frame t: already climbing at frame 0 (it left
// the pad at t = -T_PRE from rest), then a steady push out of the top of frame by "space" (21-28).
const A0 = 328;
const V0 = 17;
const ACC = 0.1;
const T_PRE = (2 * A0) / V0; // from rest, constant acceleration, reaching A0 at V0 on frame 0
const ACC_PRE = V0 / T_PRE;
const alt = (t: number) => (t >= 0 ? A0 + V0 * t + 0.5 * ACC * t * t : t <= -T_PRE ? 0 : 0.5 * ACC_PRE * Math.pow(t + T_PRE, 2));
const vel = (t: number) => (t >= 0 ? V0 + ACC * t : t <= -T_PRE ? 0 : ACC_PRE * (t + T_PRE));
const tPass = (h: number) => (h <= A0 ? -T_PRE + Math.sqrt((2 * Math.max(0, h)) / ACC_PRE) : (-V0 + Math.sqrt(V0 * V0 + 2 * ACC * (h - A0))) / ACC);
const LEAN = 0.00004; // the gravity turn: x drift = LEAN h^2 (leans right)
const pathX = (h: number) => PAD.x + LEAN * h * h;
const ROCKET = { len: 300, w: 16 } as const;

// --- the crowd: a silhouette skyline against the glow (the launch-viewing photo) ---------------------
// Four ranks max: the front rank biggest and darkest (deep espresso), the back ranks smaller and hazier.
// A person (seen from behind, facing the rocket): head, neck, shoulders and upper body down behind the
// sandbank. Heads tilt up toward the rocket; arms go up; many hold a phone up, its screen a small glow
// facing us; a few children ride on shoulders. Heads are spaced so the sky shows between many of them.
type Arm = { sx: number; sy: number; ex: number; ey: number; hx: number; hy: number; H: number; ph: number; phone: boolean };
type Rank = { body: string; heads: { x: number; y: number; r: number; ph: number }[]; arms: Arm[]; armW: number; color: string };
const circlePath = (x: number, y: number, r: number) => `M${f2(x + r)} ${f2(y)}A${f2(r)} ${f2(r)} 0 1 1 ${f2(x - r)} ${f2(y)}A${f2(r)} ${f2(r)} 0 1 1 ${f2(x + r)} ${f2(y)}Z`;
const RANK_SPEC = [
  { H: 288, pitch: [0.5, 0.82], base: -38, color: "#2E2017", up: 0.32, phone: 0.24, kid: 0.05 },
  { H: 238, pitch: [0.45, 0.75], base: -188, color: "#614532", up: 0.3, phone: 0.22, kid: 0.04 },
  { H: 200, pitch: [0.4, 0.68], base: -331, color: "#9A7454", up: 0.26, phone: 0.2, kid: 0.03 },
  { H: 169, pitch: [0.36, 0.6], base: -463, color: "#C49A6E", up: 0.2, phone: 0.16, kid: 0 },
] as const;
const personPath = (x: number, base: number, H: number, tilt: number) => {
  const top = base - H;
  const r = 0.145 * H;
  const hx = x + tilt * 0.04 * H;
  const hy = top + r - Math.abs(tilt) * 0.02 * H;
  const head = `M${f2(hx + r)} ${f2(hy)}A${f2(r)} ${f2(r)} 0 1 1 ${f2(hx - r)} ${f2(hy)}A${f2(r)} ${f2(r)} 0 1 1 ${f2(hx + r)} ${f2(hy)}Z`;
  const ny = top + 2 * r - 0.02 * H;
  const neck = `M${f2(x - 0.06 * H)} ${f2(ny - 0.02 * H)}h${f2(0.12 * H)}v${f2(0.07 * H)}h${f2(-0.12 * H)}Z`;
  const sh = ny + 0.04 * H;
  // rounded, sloping shoulders into the upper arms, the body continuing down behind the beach
  const body =
    `M${f2(x - 0.1 * H)} ${f2(sh)}C${f2(x - 0.3 * H)} ${f2(sh + 0.01 * H)} ${f2(x - 0.4 * H)} ${f2(sh + 0.07 * H)} ${f2(x - 0.415 * H)} ${f2(sh + 0.22 * H)}` +
    `L${f2(x - 0.4 * H)} ${f2(base + 130)}L${f2(x + 0.4 * H)} ${f2(base + 130)}L${f2(x + 0.415 * H)} ${f2(sh + 0.22 * H)}` +
    `C${f2(x + 0.4 * H)} ${f2(sh + 0.07 * H)} ${f2(x + 0.3 * H)} ${f2(sh + 0.01 * H)} ${f2(x + 0.1 * H)} ${f2(sh)}Z`;
  return { d: head + neck + body, head: { x: hx, y: hy, r }, rest: neck + body, top, sh };
};
const SKYLINE: Rank[] = RANK_SPEC.map((spec, r) => {
  let body = "";
  const heads: Rank["heads"] = [];
  const arms: Arm[] = [];
  let x = -1150 + hash01(r * 17 + 3) * spec.H * 0.6;
  let i = 0;
  while (x < 1150) {
    const h = (n: number) => hash01(r * 1000 + i * 7.31 + n * 13.7);
    const H = spec.H * (0.86 + 0.26 * h(1));
    const base = spec.base + (h(2) - 0.5) * 8;
    const toPad = Math.sign(PAD.x - x) * Math.min(1, Math.abs(PAD.x - x) / 500);
    const p = personPath(x, base, H, h(3) < 0.75 ? toPad : 0);
    body += p.rest;
    heads.push({ ...p.head, ph: h(11) * 6.28 });
    if (h(4) < spec.kid) {
      // a child on the shoulders
      const kp = personPath(x + (h(5) - 0.5) * 0.05 * H, p.sh + 0.06 * H, H * 0.56, toPad);
      body += kp.d;
      if (h(6) < 0.6) arms.push({ sx: x + 0.14 * H, sy: kp.sh + 0.04 * H, ex: x + 0.2 * H, ey: kp.sh - 0.05 * H, hx: x + 0.24 * H, hy: kp.top - 0.08 * H, H: H * 0.56, ph: h(12) * 6.28, phone: false });
    } else if (h(7) < spec.up) {
      const side = h(8) < 0.5 ? -1 : 1;
      arms.push({
        sx: x + side * 0.26 * H,
        sy: p.sh + 0.07 * H,
        ex: x + side * 0.38 * H,
        ey: p.sh - 0.2 * H,
        hx: x + side * 0.3 * H + toPad * 0.05 * H,
        hy: p.top - 0.14 * H,
        H,
        ph: h(12) * 6.28,
        phone: h(9) < spec.phone / spec.up,
      });
    }
    x += spec.H * (spec.pitch[0] + (spec.pitch[1] - spec.pitch[0]) * h(10));
    i++;
  }
  return { body, heads, arms, armW: spec.H * 0.085, color: spec.color };
});
/** the crowd's phone screens: the same warm light as the subs' portholes */
const PHONE = { fill: "#FFD9A0", glow: "rgba(255,190,110,0.9)" } as const;
// --- the handful: four submersibles, each one pilot, each one lamp -----------------------------------
// Final frame (k ~0.66, waterline at y ~715 on screen): A (640, 1300) high over the crest of a broad
// ridge, in the 1250-1360 gap; B (148, 1713), C (912, 1553), D (420, 1619) low over its flanks; hulls and
// lamps clear of y 920-1250 and 1360-1460. Every sub is first a PERSON: a warm lit porthole with the
// pilot's head and shoulders in it, its hull faintly lit by that window. A is working from the start
// (lamp 1). B, C, D glide in from the dark (below / the sides) over f62-84, windows lit, then switch
// their lamps on with the words: "fraction" f90, "of" f100, "people" f104 (lamps 2, 3, 4). Then each
// lamp sweeps the floor on its word ("actually" f108 A, "working" f115 B, "this" f126 C, "day" f129 D)
// and creeps on, laying an amber survey track that lengthens to the end: tiny against the unlit floor.
type Sub = { x: number; y: number; face: 1 | -1; aim: number; phase: number; bob: number; pool: number; vx: number; sweep: number; on: number; sweepAt: number; enter: [number, number] };
const SUBS: Sub[] = [
  { x: 150, y: 880, face: 1, aim: 1.42, phase: 0, bob: 1, pool: 1, vx: 0.35, sweep: 0.07, on: -99, sweepAt: 108, enter: [0, 0] }, // A
  { x: -590, y: 1500, face: 1, aim: 1.0, phase: 37, bob: 0.8, pool: 1, vx: 0.55, sweep: 0.16, on: 90, sweepAt: 115, enter: [-220, 160] }, // B
  { x: 560, y: 1260, face: -1, aim: 1.15, phase: 71, bob: 0.6, pool: 1, vx: -0.5, sweep: 0.12, on: 100, sweepAt: 126, enter: [240, 150] }, // C
  { x: -180, y: 1360, face: 1, aim: 1.0, phase: 19, bob: 0.5, pool: 1, vx: 0.5, sweep: 0.15, on: 104, sweepAt: 129, enter: [0, 240] }, // D
];
const ENTER = { f0: 62, f1: 84 } as const;
const SUB_SCALE = 1.35;
/** a lamp switching ON: off, then a hot white-amber point with a small bloom flare inside 1-2 frames;
 *  the beam shoots out over ~4 frames and lights the hull */
const ignition = (f: number, on: number) => {
  const t = f - on;
  if (t < 0) return { lamp: 0, beam: 0, flare: 0, hull: 0 };
  const lamp = t < 1 ? 0.75 : 1;
  const flare = Math.exp(-Math.pow(t - 1, 2) / 3);
  const b = clamp01((t - 1) / 4);
  const beam = b * b * (3 - 2 * b);
  return { lamp, beam, flare, hull: 0.3 + 0.7 * beam };
};
const LAMP_HALF = 0.25; // the cone's half-angle (rad)
const LAMP_REACH = 760; // the cone fades out by here in open water
const LAMP_AT = { x: 74, y: 20 } as const; // the lamp on the sub (local, facing right)

// --- the seabed at the bottom of the deep: a faint sand line; ripples tighten as it recedes --------------
const floorY = (x: number) =>
  FLOOR_Y +
  12 * Math.sin(x / 170 + 0.4) +
  6 * Math.sin(x / 61 + 1.3) -
  380 * Math.exp(-Math.pow((x - 120) / 700, 2)) * (1 + 0.05 * Math.sin(x / 53)) +
  // two canyons cut into the floor, and rougher ground toward the edges
  130 * Math.exp(-Math.pow((x + 1020) / 110, 2)) +
  110 * Math.exp(-Math.pow((x - 1060) / 95, 2)) -
  40 * Math.abs(Math.sin(x / 140 + 0.7)) * clamp01((Math.abs(x - 120) - 500) / 300);
/** far ridges behind the floor (dim, receding into the dark) */
const FAR_RIDGES = [
  { base: FLOOR_Y - 250, amp: 90, w: 230, ph: 0.3, col: "#1E2622" },
  { base: FLOOR_Y - 150, amp: 70, w: 160, ph: 2.1, col: "#1B221F" },
].map((r) => {
  let d = "";
  for (let x = -3000; x <= 3000; x += 30) {
    const y = r.base - r.amp * Math.abs(Math.sin(x / r.w + r.ph)) - 0.4 * r.amp * Math.sin(x / (r.w * 0.37) + r.ph * 2);
    d += `${d ? "L" : "M"}${x} ${f2(y)}`;
  }
  return { d: `${d}L3000 ${FLOOR_Y + 900}L-3000 ${FLOOR_Y + 900}Z`, col: r.col };
});
const FLOOR_LINE = (() => {
  let d = "";
  for (let x = -3000; x <= 3000; x += 30) d += `${d ? "L" : "M"}${x} ${f2(floorY(x))}`;
  return d;
})();
const BOTTOM_END = FLOOR_Y + 900;
const RIPPLES: { d: string; y: number; s: number }[] = (() => {
  const out: { d: string; y: number; s: number }[] = [];
  let dy = 10;
  let i = 0;
  while (dy < 220) {
    const s = 5 + 11 * Math.exp(-dy / 60);
    const ph = hash01(i * 3.3) * 6.28;
    let d = "";
    let x = -3000 + hash01(i * 7.1) * 300;
    let n = 0;
    while (x < 3000) {
      const run = 120 + 420 * hash01(i * 13.7 + n * 3.9);
      const gap = 30 + 200 * hash01(i * 5.3 + n * 7.7);
      for (let xx = x, first = true; xx <= x + run; xx += 30, first = false) {
        const yy = floorY(xx) + dy + s * 0.3 * Math.sin(xx / (60 + s * 3) + ph);
        d += `${first ? "M" : "L"}${f2(xx)} ${f2(yy)}`;
      }
      x += run + gap;
      n++;
    }
    out.push({ d, y: FLOOR_Y + dy, s });
    dy += s;
    i++;
  }
  return out;
})();

// --- the camera: a keyed glide track, run through a damped follow ------------------------------------
type Glide = { f0: number; f1: number; dx?: number; dy?: number; k?: number };
const CAM_START = { x: 80, y: -800, k: 1.2 };
const GLIDES: Glide[] = [
  // ONE move: down through the waterline and out to the split at the same time; it never climbs back
  { f0: 16, f1: 84, dx: -80, dy: 1156, k: 0.665 },
  { f0: 82, f1: 220, dy: 12, k: 0.66 }, // the hold: a slow drift, still downward
];
const CAM_STIFF = 0.12;
const CAM_DAMP = 0.7; // critically damped: the move lands without bouncing back
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

/** the far shore on the horizon: a low land line, the pad and its tower (hazed by distance) */
const FarShore: React.FC<{ k: number }> = ({ k }) => {
  const tx = PAD.x + 34;
  const top = PAD.y - 380;
  const lw = Math.max(1.2, 1.1 / k);
  let lattice = "";
  for (let y = PAD.y; y > top + 10; y -= 20) lattice += `M${tx - 7} ${y}L${tx + 7} ${y - 20}M${tx + 7} ${y}L${tx - 7} ${y - 20}`;
  return (
    <g>
      <path d="M-6000 0L-6000 -6Q-2000 -10 -600 -7T900 -9T6000 -6L6000 0Z" fill="#9A6A44" />
      <g stroke="#7A5236" strokeWidth={lw} fill="none">
        <path d={`M${tx - 7} ${PAD.y}V${top}M${tx + 7} ${PAD.y}V${top}${lattice}`} />
        <path d={`M${tx} ${top}V${top - 40}`} />
        <path d={`M${PAD.x - 130} ${PAD.y}V${PAD.y - 410}M${PAD.x + 180} ${PAD.y}V${PAD.y - 410}`} strokeWidth={lw * 0.8} />
      </g>
      <rect x={PAD.x - 30} y={PAD.y - 7} width={100} height={9} fill="#7A5236" />
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
    const x = PAD.x + 40 + d * (160 + 520 * spread) + 0.3 * age0;
    const r = 1.8 * (26 + 52 * hash01(i * 9.3 + 4)) * (0.55 + 0.6 * spread) * (1 - Math.abs(d) * 0.35);
    const y = PAD.y - r * 0.55 - h * (40 + 130 * spread) * (1 - Math.abs(d) * 0.6) - 0.06 * age0;
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
          {[0, 0.08, 0.18, 0.3, 0.44, 0.6, 0.78, 1].map((o) => (
            <stop key={o} offset={o} stopColor="#FFB04A" stopOpacity={f2(0.5 * Math.exp(-4.2 * o * o))} />
          ))}
        </radialGradient>
        <filter id="ofMotion" x="-200%" y="-60%" width="500%" height="220%">
          <feGaussianBlur stdDeviation={`${f2(Math.max(0.01, 0.6 / k))} ${f2(Math.max(0.01, blur))}`} />
        </filter>
      </defs>
      {/* its light on the sky, the smoke and the people */}
      <circle cx={0} cy={pl * 0.3} r={230} fill="url(#ofEngineGlow)" style={{ mixBlendMode: "screen" }} />
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

/** the shore: the crowd's silhouette skyline (back rank first), raised arms, phone screens, and the
 *  sandbank in front of them at the waterline */
const Shore: React.FC<{ f: number; k: number }> = ({ f, k }) => {
  const A = alt(f);
  const glow = clamp01(1.2 * Math.exp(-(A - 400) / 800)); // the launch light on the crowd's backs, fading
  return (
    <g>
      {[...SKYLINE].reverse().map((rk, ri) => {
        const col = mixHex(rk.color, "#7A4A26", glow * 0.25 * (ri / 3));
        return (
          <g key={ri}>
            <path d={rk.body} fill={col} />
            {/* heads: a tiny bob, each in its own time */}
            <path d={rk.heads.map((hd) => circlePath(hd.x, hd.y + hd.r * 0.09 * Math.sin(f / 10 + hd.ph), hd.r)).join("")} fill={col} />
            {/* raised arms: a slight sway; phones held up glow and flicker softly */}
            <path
              d={rk.arms
                .map((a) => {
                  const sway = a.H * 0.035 * Math.sin(f / 13 + a.ph);
                  return `M${f2(a.sx)} ${f2(a.sy)}L${f2(a.ex + sway * 0.5)} ${f2(a.ey)}L${f2(a.hx + sway)} ${f2(a.hy)}`;
                })
                .join("")}
              fill="none"
              stroke={col}
              strokeWidth={f2(rk.armW)}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <g style={{ filter: `drop-shadow(0 0 ${f2(Math.max(2.5, rk.armW * 0.6))}px ${PHONE.glow})` }}>
              {rk.arms
                .filter((a) => a.phone)
                .map((a, j) => {
                  const sway = a.H * 0.035 * Math.sin(f / 13 + a.ph);
                  const w = 0.085 * a.H;
                  const ph = 0.13 * a.H;
                  const flick = 0.72 + 0.28 * (0.5 + 0.5 * Math.sin(f / 3.1 + a.ph * 3)) * (0.6 + 0.4 * Math.sin(f / 7.3 + a.ph));
                  return <rect key={j} x={f2(a.hx + sway - w / 2)} y={f2(a.hy - ph * 0.85)} width={f2(w)} height={f2(ph)} fill={PHONE.fill} opacity={f2(flick)} />;
                })}
            </g>
          </g>
        );
      })}
      {/* the beach in front of the crowd: dry sand lit by the glow, wet sand mirroring it, a line of surf */}
      <defs>
        <linearGradient id="ofDry" gradientUnits="userSpaceOnUse" x1="0" y1={SHORE.dry - 6} x2="0" y2={SHORE.wet}>
          <stop offset="0" stopColor="#6E4C33" />
          <stop offset="0.35" stopColor="#9C7048" />
          <stop offset="1" stopColor="#B8875A" />
        </linearGradient>
        <linearGradient id="ofWet" gradientUnits="userSpaceOnUse" x1="0" y1={SHORE.wet} x2="0" y2="0">
          <stop offset="0" stopColor="#7A5A42" />
          <stop offset="0.45" stopColor="#C99566" />
          <stop offset="1" stopColor="#E9B57C" />
        </linearGradient>
      </defs>
      <path d={`M-6000 0L-6000 ${SHORE.dry + 4}Q-3000 ${SHORE.dry - 4} -1200 ${SHORE.dry + 2}T600 ${SHORE.dry}T2400 ${SHORE.dry + 3}T6000 ${SHORE.dry}L6000 0Z`} fill="url(#ofDry)" />
      <rect x={-6000} y={SHORE.wet} width={12000} height={-SHORE.wet} fill="url(#ofWet)" />
      {/* the sky's glow in the wet sand: a few soft horizontal streaks */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect key={i} x={-1400 + i * 470 + 60 * Math.sin(f / 37 + i)} y={-9 + (i % 3) * 3} width={180 + 90 * hash01(i * 2.7)} height={1.4 / k + 1} fill="#FFE3B4" opacity={0.35} />
      ))}
      {/* the surf: a thin foam line that moves a little */}
      <path
        d={(() => {
          let d = "";
          for (let x = -2400; x <= 2400; x += 40) d += `${d ? "L" : "M"}${x} ${f2(-2.5 + 1.6 * Math.sin(x / 90 + f / 7) + 1.1 * Math.sin(x / 37 - f / 5))}`;
          return d;
        })()}
        fill="none"
        stroke="#F6EBDA"
        strokeWidth={Math.max(2, 2.4 / k)}
        strokeOpacity={0.8}
        strokeLinecap="round"
      />
    </g>
  );
};

/** the water volume and its light shafts; the bottom seen receding; the waterline */
const Water: React.FC<{ f: number }> = ({ f }) => {
  const shafts: { d: string; a: number }[] = [];
  for (let i = 0; i < 26; i++) {
    const x0 = -2200 + i * 170 + (hash01(i * 4.1) - 0.5) * 120 + 26 * Math.sin(f / 46 + i * 1.7);
    const w0 = 30 + 110 * hash01(i * 7.7 + 1);
    const L = 110 + 160 * hash01(i * 2.9 + 3); // the shafts die out within the top of the water
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
/** the seabed at the bottom of the deep: a faint sand line and receding ripples; where a lamp reaches it,
 *  the floor shows around the pool and its ripples light up */
type Trail = { x0: number; x1: number };
const Bottom: React.FC<{ cam: Cam; pools: Pool[]; trails: Trail[] }> = ({ cam, pools, trails }) => {
  const k = cam.k;
  const vy1 = cam.y + 1040 / k;
  if (vy1 < FLOOR_Y - 820) return null;
  return (
    <g>
      <defs>
        <linearGradient id="ofFloor" gradientUnits="userSpaceOnUse" x1="0" y1={FLOOR_Y - 760} x2="0" y2={FLOOR_Y + 260}>
          <stop offset="0" stopColor="#222925" />
          <stop offset="0.45" stopColor="#1C211E" />
          <stop offset="1" stopColor="#181C1A" />
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
        <mask id="ofReveal" maskUnits="userSpaceOnUse" x="-3000" y={FLOOR_Y - 1000} width="6000" height="2000">
          {pools.map((p, i) => (
            <ellipse key={i} cx={f2(p.x)} cy={f2(p.y)} rx={f2(p.rx * 1.8)} ry={f2(p.ry * 2.2)} fill="url(#ofPoolMask)" opacity={f2(p.a)} />
          ))}
        </mask>
        <mask id="ofPools" maskUnits="userSpaceOnUse" x="-3000" y={FLOOR_Y - 1000} width="6000" height="2000">
          {pools.map((p, i) => (
            <ellipse key={i} cx={f2(p.x)} cy={f2(p.y)} rx={f2(p.rx)} ry={f2(p.ry)} fill="url(#ofPoolMask)" opacity={f2(p.a)} />
          ))}
        </mask>
      </defs>
      {FAR_RIDGES.map((r, i) => (
        <path key={i} d={r.d} fill={r.col} />
      ))}
      <path d={`${FLOOR_LINE}L3000 ${BOTTOM_END}L-3000 ${BOTTOM_END}Z`} fill="url(#ofFloor)" />
      <path d={FLOOR_LINE} fill="none" stroke="#7E8C7C" strokeOpacity={0.12} strokeWidth={Math.max(1.5, 1.6 / k)} />
      {RIPPLES.map((r, i) => (
        <path key={i} d={r.d} fill="none" stroke="#6F7C6C" strokeOpacity={f2(0.06 * Math.exp(-(r.y - FLOOR_Y) / 120))} strokeWidth={f2(Math.max(1, r.s * 0.14))} strokeLinecap="round" />
      ))}
      {/* where a lamp reaches the bottom, the floor shows around it */}
      <g mask="url(#ofReveal)">
        <path d={`${FLOOR_LINE}L3000 ${BOTTOM_END}L-3000 ${BOTTOM_END}Z`} fill="#6B6A55" opacity={0.45} />
        {RIPPLES.map((r, i) => (
          <g key={i} fill="none" strokeLinecap="round">
            <path d={r.d} transform={`translate(0 ${f2(r.s * 0.3)})`} stroke="#241F19" strokeOpacity={0.45} strokeWidth={f2(Math.max(r.s * 0.16, 1.4 / k))} />
            <path d={r.d} stroke="#B9A684" strokeOpacity={0.55} strokeWidth={f2(Math.max(r.s * 0.09, 1 / k))} />
          </g>
        ))}
      </g>
      {/* the lit trails on the seafloor: a thin line of warm sand, brightest where the light is now */}
      {trails.map((t, i) => {
        const a = Math.min(t.x0, t.x1);
        const b = Math.max(t.x0, t.x1);
        if (b - a < 2) return null;
        let d = "";
        for (let x = a; x <= b; x += 8) d += `${d ? "L" : "M"}${f2(x)} ${f2(floorY(x) + 3)}`;
        d += `L${f2(b)} ${f2(floorY(b) + 3)}`;
        return (
          <g key={`t${i}`}>
            <defs>
              <linearGradient id={`ofTrail${i}`} gradientUnits="userSpaceOnUse" x1={f2(t.x0)} y1="0" x2={f2(t.x1)} y2="0">
                <stop offset="0" stopColor={mixHex(LIT.hi, AMBER.top, 0.5)} stopOpacity="0.55" />
                <stop offset="1" stopColor={LIT.hi} stopOpacity="0.95" />
              </linearGradient>
            </defs>
            <path d={d} fill="none" stroke={`url(#ofTrail${i})`} strokeWidth={Math.max(24, 13.5 / k)} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 ${f2(7 / k)}px rgba(255,180,80,0.75))` }} />
          </g>
        );
      })}
      {pools.map((p, i) => (
        <ellipse key={i} cx={f2(p.x)} cy={f2(p.y)} rx={f2(p.rx)} ry={f2(p.ry)} fill={`url(#ofPool${i})`} />
      ))}
      <g mask="url(#ofPools)" fill="none">
        {RIPPLES.map((r, i) => (
          <path key={i} d={r.d} stroke={LIT.hi} strokeOpacity={0.55} strokeWidth={f2(Math.max(r.s * 0.14, 1.4 / k))} strokeLinecap="round" />
        ))}
      </g>
    </g>
  );
};

type LampState = { sub: Sub; x: number; y: number; px: number; py: number; dx: number; dy: number; reach: number; hit: boolean; lamp: number; beam: number; flare: number; hull: number };
const lampState = (s: Sub, f: number): LampState => {
  const t = f + s.phase;
  // gliding in from the dark (ease out, settled by ENTER.f1); then creeping on from its sweep onwards
  const g = clamp01((f - ENTER.f0) / (ENTER.f1 - ENTER.f0));
  const arrive = 1 - Math.pow(1 - g, 3);
  const x = s.x + s.enter[0] * (1 - arrive) + s.vx * (Math.max(f, s.sweepAt) - 156) + 6 * Math.sin(t / 41) * s.bob;
  const y = s.y + s.enter[1] * (1 - arrive) + 5 * Math.sin(t / 27) * s.bob;
  // a slow sweep, out and back over 26 frames, on its word; otherwise a small working wobble
  const sw = clamp01((f - s.sweepAt) / 26);
  const aim = s.aim + s.sweep * Math.sin(Math.PI * sw) * -1 + 0.035 * Math.sin(t / 9.7) + 0.03 * Math.sin(t / 23);
  const dx = s.face * Math.cos(aim);
  const dy = Math.sin(aim);
  const px = x + s.face * LAMP_AT.x * SUB_SCALE;
  const py = y + LAMP_AT.y * SUB_SCALE;
  const { lamp, beam, flare, hull } = s.on < 0 ? { lamp: 1, beam: 1, flare: 0, hull: 1 } : ignition(f, s.on);
  // a lamp aimed at the seafloor reaches it where its axis meets the floor; the beam reaches out as it
  // switches on
  let full = LAMP_REACH;
  if (s.pool > 0) {
    for (let d = 20; d < 900; d += 4) {
      if (py + dy * d >= floorY(px + dx * d)) {
        full = d;
        break;
      }
    }
  }
  const reach = full * (0.2 + 0.8 * beam);
  const hit = s.pool > 0 && beam > 0.6;
  return { sub: s, x, y, px, py, dx, dy, reach, hit, lamp, beam, flare, hull };
};

/** a lamp's light in the water: a halo and a soft cone (drawn before the subs, screen) */
const LampLight: React.FC<{ l: LampState; i: number }> = ({ l, i }) => {
  if (l.lamp <= 0) return null;
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
      <circle cx={f2(l.px)} cy={f2(l.py)} r={f2(230 * (1 + 0.5 * l.flare))} fill={`url(#ofHalo${i})`} opacity={f2(Math.min(1, l.lamp * (1 + 1.4 * l.flare)))} />
      {/* the lamp itself: a hot white-amber point, with a small bloom flare as it switches on */}
      <circle cx={f2(l.px)} cy={f2(l.py)} r={f2(5 + 12 * l.flare)} fill="#FFF4DC" opacity={f2(Math.min(1, 0.85 + l.flare))} style={{ filter: `blur(${f2(2 + 6 * l.flare)}px)` }} />
      <circle cx={f2(l.px)} cy={f2(l.py)} r={3.2} fill="#FFFFFF" />
      <path
        opacity={f2(l.beam)}
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
  // in the dark (lamp off) the hull is a dim shape catching faint light from above; its own lamp
  // lights it when it switches on
  const night = 1 - l.lamp;
  const fog = (base: number) => base + (0.5 - base) * night;
  const lit = mixHex(CREAM, deep, fog(0.18));
  const mid = mixHex("#CFC5B5", deep, fog(0.25));
  const dark = mixHex("#7D7466", deep, fog(0.35));
  const metal = mixHex("#4A443C", deep, fog(0.25));
  const aimDeg = (Math.atan2(l.dy, Math.abs(l.dx)) * 180) / Math.PI;
  const hair = Math.max(1, 1.2 / k);
  return (
    <g transform={`translate(${fx(l.x)} ${fx(l.y)}) scale(${fx(s.face * SUB_SCALE)} ${fx(SUB_SCALE)})`}>
    <g opacity={f2(l.lamp > 0 ? Math.max(0.4, l.hull) : 0.4)}>
      <defs>
        <linearGradient id={`ofHull${i}`} gradientUnits="userSpaceOnUse" x1="-30" y1="-40" x2="20" y2="30">
          <stop offset="0" stopColor={lit} />
          <stop offset="0.55" stopColor={mid} />
          <stop offset="1" stopColor={dark} />
        </linearGradient>
        <radialGradient id={`ofPort${i}`} gradientUnits="userSpaceOnUse" cx="40" cy="-2" r="16">
          <stop offset="0" stopColor="#FFF2D2" />
          <stop offset="0.55" stopColor="#FFC066" />
          <stop offset="1" stopColor="#D0782C" />
        </radialGradient>
        <radialGradient id={`ofWin${i}`} gradientUnits="userSpaceOnUse" cx="40" cy="2" r="46">
          <stop offset="0" stopColor="#FFC27A" stopOpacity="0.5" />
          <stop offset="1" stopColor="#FFC27A" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`ofSpill${i}`} gradientUnits="userSpaceOnUse" cx="70" cy="18" r="60">
          <stop offset="0" stopColor="#FFC870" stopOpacity="0.55" />
          <stop offset="1" stopColor="#FFC870" stopOpacity="0" />
        </radialGradient>
        <clipPath id={`ofPortClip${i}`}>
          <circle cx={40} cy={2} r={14} />
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
      <path d={HULL} fill={`url(#ofSpill${i})`} style={{ mixBlendMode: "screen" }} opacity={f2(l.lamp)} />
      {/* the viewport, warm from inside, with the pilot (only legible in the close-up) */}
      {/* its own window's warm light on the hull */}
      <circle cx={40} cy={2} r={46} fill={`url(#ofWin${i})`} style={{ mixBlendMode: "screen" }} />
    </g>
      {/* the porthole: a warm lit window with the pilot's head and shoulders in it (always lit: a person) */}
      <circle cx={40} cy={2} r={16.5} fill={metal} />
      <g style={{ filter: `drop-shadow(0 0 ${f2(7 / (k * SUB_SCALE))}px rgba(255,190,110,0.85))` }}>
        <circle cx={40} cy={2} r={14} fill={`url(#ofPort${i})`} />
      </g>
      <g clipPath={`url(#ofPortClip${i})`}>
        <path d={pegPath(40, 17, 24)} fill="#2A1A10" />
      </g>
      {/* the lamp on its bar */}
      <path d={`M60 22L${LAMP_AT.x} ${LAMP_AT.y}`} stroke={metal} strokeWidth={3.5} />
      <g transform={`translate(${LAMP_AT.x} ${LAMP_AT.y}) rotate(${fx(aimDeg)})`}>
        <rect x={-5} y={-5} width={10} height={10} rx={2} fill={metal} />
        <g style={l.lamp > 0 ? { filter: BLOOM_LAYERS.map((b) => `drop-shadow(0 0 ${f2(b.blur / k)}px ${b.color})`).join(" ") } : undefined}>
          <rect x={4} y={-4.5} width={3.5} height={9} rx={1.5} fill={AMBER.hot} opacity={f2(l.lamp)} />
        </g>
      </g>
    </g>
  );
};

/** a few small fish crossing the first pilot's beam during the close-up (dark, lit where the beam is) */
const FISH_PASS = (() => {
  const l = lampState(SUBS[0], 70);
  return { x: l.px + l.dx * 90, y: l.py + l.dy * 90 };
})();
const FISH = [
  { dx: 0, dy: 0, s: 1, ph: 0 },
  { dx: 34, dy: -18, s: 0.8, ph: 1.7 },
  { dx: -26, dy: 20, s: 0.9, ph: 3.1 },
];
const Fish: React.FC<{ f: number; lamp: LampState }> = ({ f, lamp }) => (
  <g>
    {FISH.map((q, i) => {
      const x = FISH_PASS.x + q.dx - 2.4 * (f - 70);
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
      if (y < 14 || y > floorY(x) - 4) continue;
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
          if (across < edge) glow = Math.max(glow, (1 - along / LAMP_REACH) * (1 - across / edge) * 1.6 * l.beam);
        }
        const dd = Math.hypot(rx, ry);
        if (dd < 230) glow = Math.max(glow, 0.5 * (1 - dd / 230) * l.lamp);
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

const OtherFrontierV2: React.FC<Props> = () => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const k = cam.k;
  const sw = { dx: 3 * Math.sin(frame / 23), dy: 5 * Math.sin(frame / 19) };
  const tx = 540 - cam.x * k + sw.dx;
  const ty = 960 - cam.y * k + sw.dy;
  const lamps = SUBS.map((s) => lampState(s, frame));
  const pools: Pool[] = lamps
    .filter((l) => l.hit)
    .map((l) => ({ x: l.px + l.dx * l.reach, y: l.py + l.dy * l.reach, rx: 150 + l.reach * 0.2, ry: 36, a: 0.9 * clamp01((l.beam - 0.6) / 0.4) }));
  // the strip of floor each sweep has lit (what that pilot has seen): from the farthest point swept to now
  const trails: Trail[] = lamps
    .filter((l) => l.hit && frame > l.sub.sweepAt)
    .map((l) => {
      const now = l.px + l.dx * l.reach;
      let far = now;
      for (let g = l.sub.sweepAt; g < frame; g += 1) {
        const m = lampState(l.sub, g);
        const x = m.px + m.dx * m.reach;
        if (Math.abs(x - now) > Math.abs(far - now)) far = x;
      }
      return { x0: far, x1: now };
    });
  const top = cam.y - 1000 / k;
  const showSky = top < 0;
  const showRocket = alt(frame) < 4000;
  // caustic light near the surface: a tileable caustic net stretched down and slanted, two copies
  const TILE = 760;
  const caus = (dir: number, speed: number, op: number, seed: number) => {
    const off = (((frame * speed * dir + seed) % TILE) + TILE) % TILE;
    return (
      <div key={seed} style={{ position: "absolute", left: -3800 + off, top: 0, width: TILE * 11, height: 380, display: "flex", opacity: op }}>
        {Array.from({ length: 11 }, (_, i) => (
          <Img key={i} src={staticFile("ulysses/caustics.png")} style={{ width: TILE, height: 380, flex: "none" }} />
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
                    <Shore f={frame} k={k} />
                  </>
                ) : null}
                <Water f={frame} />
                <Bottom cam={cam} pools={pools} trails={trails} />
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
                  height: 380,
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

export default OtherFrontierV2;
