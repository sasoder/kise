import React, { useId } from "react";
import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ALPHA,
  AmberGradient,
  BLOOM_LAYERS,
  COLOR,
  EDGE,
  LightSweep,
  STROKE,
  StoutStage,
  amberBandFor,
  clamp01,
  lerp,
  mixHex,
  smoothstep,
} from "./stoutShared";
import { UnionShadow, makeClockCam, makePoolTrack, type Glide } from "./museShared";

// ---------------------------------------------------------------------------
// InsideThePint — cut 1 of 3, Cheeky Pint S4E02 "will - guinness invented the t-test" (Will O'Brien),
// in the Cheeky Pint S4 stout system (stoutShared.tsx, palette B1). 1080x1920, 23.976 fps, opaque, no text.
//
// CHECK LINE: after this cut the viewer can say "what everyone sees as just a pint of Guinness is,
// underneath, full of technical innovation — that's what the business grew on."
//
// THE ONE MOTION: the pint fills with innovation, then the stout and head cover it. Close on the empty
// Guinness glass, an amber column rises out of the slot in its base — four segments, each carrying an ink
// innovation glyph (flask, microscope, gear, bell curve) — and the camera rises with it. A stream of stout
// falls into the glass and the surge runs DOWN through it: cream-tan particles cascading, the body
// darkening, the amber sinking by tone to warm embers. The cream head settles out of the surge at the top
// while the camera pulls back to the whole pint, the harp printed on its glass; one light sweep on "Guinness".
//
// SPOKEN (just before: "A great example of a business,"): "…largely derived from technical innovations. And
// you don't think of it, you think of just like a pint of Guinness."
// WORD -> FRAME (this composition's frame 0 = sequence 1.710 s): (silence f0-26) largely 26 · derived 31 ·
// from 43 · technical 52 · innovations 62-76 · And 83 · you 87 · don't 90 · think 97 · of it 101-105 · you 106
// · think 107 · of 110 · just 114 · like 117 · a 120 · pint 123 · of 126 · Guinness 129-138 · cut back f140.
// DURATION: sequence 1.710 -> 7.549 s = 5.839 s x 23.976 = 140 frames, + a 16-frame living tail = 156.
//
//   f0-8      close on the lower half of the empty glass (k 1.94, creeping); the slot across its floor
//   f8-86     the amber column rises out of the slot: one continuous rise (ease in, constant, long landing)
//             to 584 world px (4 x 146 segments, rungs between); the camera rises and eases out with it
//   f74-106   a stream of stout falls from above the frame into the glass (constant speed), its tail follows
//   f84-106   the surge front runs down from the rim to the floor (leading at the walls); behind it cream-tan
//             particles cascade down, the haze thins, the amber sinks by tone to embers (14 f per segment)
//   f98-126   the head settles out of the haze at the top, its lower edge rising and sharpening
//   f88-142   the pull-back to the whole pint (k -> 1.0): rim ~y 285, beer mat ~y 1150-1220, harp ~y 370-555
//   f129-139  THE ONE CLICK: a light sweep across the glass on "Guinness"
//   f140-156  living tail: particles still drifting down out of the head, slow drift, grain, light pool
// ---------------------------------------------------------------------------

export const FPS = 24000 / 1001;
export const SPAN = 140;
export const DURATION = SPAN + 16;

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();

// --- the glass (world px; at the end camera k ~ 1 world ~ screen) -----------------------------------------
const CX = 540;
const RIM = 296; // the glass's top edge
const BOT = 1180; // its outer bottom (stands on the beer mat)
const FLOOR = 1124; // the inner floor: the top of the heavy glass base, where the slot is
const HG = BOT - RIM;
const WALL = 7;
/** The Guinness tulip: a narrow heavy foot, flaring to a gentle bulge ~30 % down from the rim, then a clear
 *  turn-in to the lip (half width; rim ~480, bulge ~564, foot ~340). */
const hwO = (y: number) => {
  const t = clamp01((BOT - y) / HG);
  return 170 + 70 * t + 62 * Math.sin(Math.PI * Math.pow(t, 1.9));
};
const hwI = (y: number) => hwO(y) - WALL;
/** The lip and the foot as thin ellipses (a slight look down onto the glass). */
const RIM_RY = 9;
const FOOT_RY = 10;
/** The beer mat the pint stands on: a round kraft mat seen in slight perspective (context, so board tone). */
const MAT = { cx: CX, cy: BOT - 2, rx: 300, ry: 34, thick: 6, ring: 0.8 } as const;

const sideYs = (y0: number, y1: number, n = 48) => Array.from({ length: n + 1 }, (_, i) => lerp(y0, y1, i / n));
/** A region between y0 and y1 bounded by a half-width profile. */
const bandPath = (y0: number, y1: number, hw: (y: number) => number) => {
  const ys = sideYs(y0, y1);
  const right = ys.map((y) => `${f3(CX + hw(y))} ${f3(y)}`);
  const left = [...ys].reverse().map((y) => `${f3(CX - hw(y))} ${f3(y)}`);
  return `M${right.join("L")}L${left.join("L")}Z`;
};
const HB = hwO(BOT);
const OUTLINE_D = (() => {
  // the outer glass: sides from the rim down to the foot, closed by the foot ellipse's front arc
  const ys = sideYs(RIM, BOT - FOOT_RY);
  const right = ys.map((y) => `${f3(CX + hwO(y))} ${f3(y)}`).join("L");
  const left = [...ys]
    .reverse()
    .map((y) => `${f3(CX - hwO(y))} ${f3(y)}`)
    .join("L");
  return `M${right}A${f3(HB)} ${FOOT_RY} 0 0 1 ${f3(CX - HB)} ${f3(BOT - FOOT_RY)}L${left}Z`;
})();
/** The heavy glass base: from the inner floor down to the foot's front arc. */
const BASE_SOLID_D = (() => {
  const ys = sideYs(FLOOR, BOT - FOOT_RY, 12);
  const right = ys.map((y) => `${f3(CX + hwO(y))} ${f3(y)}`).join("L");
  const left = [...ys]
    .reverse()
    .map((y) => `${f3(CX - hwO(y))} ${f3(y)}`)
    .join("L");
  return `M${f3(CX - hwO(FLOOR))} ${FLOOR}L${right}A${f3(HB)} ${FOOT_RY} 0 0 1 ${f3(CX - HB)} ${f3(BOT - FOOT_RY)}L${left}Z`;
})();
/** The one specular streak down the lit (left) side: a narrow band hugging the outer wall. */
const STREAK_D = (() => {
  const y0 = RIM + 34;
  const y1 = FLOOR - 70;
  const ys = sideYs(y0, y1, 40);
  const w = (y: number) => 4 + 7 * Math.sin(Math.PI * clamp01((y - y0) / (y1 - y0)));
  const inset = 16;
  const outer = ys.map((y) => `${f3(CX - hwO(y) + inset)} ${f3(y)}`);
  const inner = [...ys].reverse().map((y) => `${f3(CX - hwO(y) + inset + w(y))} ${f3(y)}`);
  return `M${outer.join("L")}L${inner.join("L")}Z`;
})();
const INTERIOR_D = bandPath(RIM, FLOOR, hwI);
const sidePath = (side: -1 | 1, y0: number, y1: number, inset = 0) =>
  `M${sideYs(y0, y1)
    .map((y) => `${f3(CX + side * (hwI(y) - inset))} ${f3(y)}`)
    .join("L")}`;

// --- the amber column: four segments rising out of the slot -------------------------------------------------
const SEG_H = 146;
const N_SEG = 4;
const H_MAX = SEG_H * N_SEG; // 584: the column's top lands at y 540, ~70 % of the glass, right under the harp
type GlyphName = "flask" | "microscope" | "gear" | "bell";
/** Top (first out of the slot) to bottom (last). */
const SEG_GLYPH: GlyphName[] = ["flask", "microscope", "gear", "bell"];
const GLYPH_SIZE = 88;
/** The rise: velocity eases in (f8-20), holds, and lands softly (f68-86). Integrated, normalised to H_MAX. */
const RISE = { f0: 8, up: 12, d0: 68, down: 18 } as const;
const H_TABLE = (() => {
  const step = 1 / 16;
  const vel = (f: number) => smoothstep((f - RISE.f0) / RISE.up) * (1 - smoothstep((f - RISE.d0) / RISE.down));
  const out: number[] = [];
  let acc = 0;
  for (let i = 0; i <= (DURATION + 2) * 16; i++) {
    const f = i * step;
    if (i > 0) acc += ((vel(f - step) + vel(f)) / 2) * step;
    out.push(acc);
  }
  return out.map((v) => (v / acc) * H_MAX);
})();
const riseH = (f: number) => {
  const i = Math.max(0, Math.min(H_TABLE.length - 2, Math.floor(f * 16)));
  return lerp(H_TABLE[i], H_TABLE[i + 1], clamp01(f * 16 - i));
};

// --- the stout -------------------------------------------------------------------------------------------
const RUBY = "#5C1A12"; // the deep ruby the stout leans toward (light through a Guinness)
const STOUT = mixHex(COLOR.shadow, RUBY, 0.3); // the body: shadow brown toward ruby, never black
const STOUT_TOP = mixHex(STOUT, RUBY, 0.18);
const RUBY_GLOW = mixHex("#8A2614", COLOR.amberFoot, 0.15);
const EMBER_BODY = mixHex(STOUT, COLOR.amberFoot, 0.025);
const EMBER_GLYPH = mixHex(STOUT, COLOR.amberTop, 0.7); // embers: warm glyphs glowing through the stout, well under the amber
const EMBER_RUNG = mixHex(STOUT, COLOR.rung, 0.2);
const HAZE = mixHex(COLOR.creamFoot, COLOR.board, 0.55);
const HAZE_A = 0.16;
const SPECK = mixHex(COLOR.creamFoot, COLOR.board, 0.3);
/** The stream: its head falls from above the frame to the rim (constant speed), its tail follows. */
const STREAM = { x: 556, w: 32, from: -260, v: 52, head0: 73.3, tail0: 95 } as const;
/** The surge front: from just above the rim to just past the floor; it leads at the walls. */
const FRONT = { f0: 84, f1: 106, lead: 12, blur: 20, band: 0.26 } as const;
/** The front's ragged edge (world y offset at x, frame f): a soft lead at the walls and two slow, small waves. */
const frontEdge = (x: number, f: number, hw: number) =>
  FRONT.lead * Math.pow(Math.min(1, Math.abs(x - CX) / hw), 2) + 9 * Math.sin(x / 27 + f * 0.35) + 6 * Math.sin(x / 13 - f * 0.6 + 1.3);
const frontY = (f: number) => {
  const u = clamp01((f - FRONT.f0) / (FRONT.f1 - FRONT.f0));
  return lerp(RIM - 44, FLOOR + 50, lerp(u, smoothstep(u), 0.5));
};
/** The frame the front's centre passes world y. */
const frontAt = (y: number) => {
  let lo: number = FRONT.f0;
  let hi: number = FRONT.f1;
  for (let i = 0; i < 30; i++) {
    const m = (lo + hi) / 2;
    if (frontY(m) < y) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
};
const SINK_F = 14; // frames a segment takes to sink by tone once the front has passed its top
const HAZE_F = 20; // frames the haze takes to thin behind the front
const HEAD = { f0: 98, f1: 126, b0: 476, b1: 382, feather0: 70, feather1: 7, apex: 274, wallY: 300 } as const;
const headAmt = (f: number) => smoothstep((f - HEAD.f0) / (HEAD.f1 - HEAD.f0));

// --- the surge particles ---------------------------------------------------------------------------------
type Speck = { u: number; y0: number; tb: number; v: number; r: number; a: number; w: number; ph: number };
/** Born on the front as it passes (the stout brings them), then cascading down; most of them near the walls. */
const FRONT_SPECKS: Speck[] = Array.from({ length: 300 }, (_, i) => {
  const y0 = lerp(RIM + 12, FLOOR - 16, random(`ys${i}`));
  const side = random(`sd${i}`) < 0.5 ? -1 : 1;
  const u = side * Math.pow(random(`ux${i}`), 0.55) * 0.94;
  return {
    u,
    y0,
    tb: frontAt(y0) + random(`tb${i}`) * 2,
    v: lerp(2.4, 6.2, random(`v${i}`)),
    r: lerp(1.4, 2.8, random(`r${i}`)),
    a: lerp(0.45, 0.95, random(`a${i}`)),
    w: lerp(2, 6, random(`w${i}`)),
    ph: random(`ph${i}`) * Math.PI * 2,
  };
});
/** Born out of the head's lower edge once it forms: the few that still drift down in the end frame. */
const HEAD_SPECKS: Speck[] = Array.from({ length: 70 }, (_, i) => {
  const side = random(`hs${i}`) < 0.5 ? -1 : 1;
  return {
    u: side * Math.pow(random(`hu${i}`), 0.6) * 0.9,
    y0: 0,
    tb: lerp(102, 156, random(`ht${i}`)),
    v: lerp(2.2, 4.6, random(`hv${i}`)),
    r: lerp(1.3, 2.4, random(`hr${i}`)),
    a: lerp(0.4, 0.85, random(`ha${i}`)),
    w: lerp(2, 5, random(`hw${i}`)),
    ph: random(`hp${i}`) * Math.PI * 2,
  };
});
/** Carried in the front itself: a particle-rich band riding the settling edge (most just behind it). */
const BAND_SPECKS = Array.from({ length: 260 }, (_, i) => {
  const side = random(`bs${i}`) < 0.5 ? -1 : 1;
  return {
    u: side * Math.pow(random(`bu${i}`), 0.7) * 0.95,
    o: 10 - 80 * Math.pow(random(`bo${i}`), 1.5),
    r: lerp(1.4, 3, random(`br${i}`)),
    a: lerp(0.5, 1, random(`ba${i}`)),
    w: lerp(3, 9, random(`bw${i}`)),
    ph: random(`bp${i}`) * Math.PI * 2,
  };
});
/** The surge's density: dense through the pour, thinning to a few as it settles. */
const density = (f: number) => lerp(1, 0.22, smoothstep((f - 100) / 40));

// --- the camera and the light ---------------------------------------------------------------------------
const START = { x: CX, y: 1100, k: 1.94 };
const GLIDES: Glide[] = [
  // the opening creep: already moving on f0, easing up as the first block comes out
  { f0: -30, f1: 26, k: 1.84, dy: -30 },
  // ride the rising column up and ease out
  { f0: 14, f1: 92, k: 1.34, dy: -290 },
  // the pull-back to the whole pint while the head settles
  { f0: 88, f1: 142, k: 1.0, dy: 195 },
  // the tail's drift
  { f0: 128, f1: 180, k: 0.975, dy: -12, warp: 0.8 },
];
export const CAM = makeClockCam(START, GLIDES, DURATION + 4);
const POOL = makePoolTrack(
  { x: CX, y: 1060 },
  [
    { f0: 8, f1: 86, x: CX, y: 720 },
    { f0: 88, f1: 136, x: CX - 10, y: 660 },
  ],
  DURATION + 4,
);
const SWEEP_F: [number, number] = [129, 140];

// --- the harp, printed on the glass (a clean redraw of the Brian Boru harp, facing right) -----------------
// Filled bands, as on the real glass: a broad sound box on the left running from under the scroll down to the
// foot, an S-curved neck along the top ending in a knob at its upper left, an outward-bowed forepillar on the
// right meeting the sound box in a point at the foot, strings between. Box units; ~136 x 172 ink (0.79 : 1).
type Pt = [number, number];
const cubicAt = (c: Pt[], t: number): Pt => {
  const m = 1 - t;
  return [0, 1].map((i) => m * m * m * c[0][i] + 3 * m * m * t * c[1][i] + 3 * m * t * t * c[2][i] + t * t * t * c[3][i]) as Pt;
};
/** A filled band of width w(t) along a cubic (its two offset edges joined). */
const bandAlong = (c: Pt[], w: (t: number) => number, n = 40) => {
  const L: string[] = [];
  const R: string[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const p = cubicAt(c, t);
    const q = cubicAt(c, Math.min(1, t + 0.01));
    const o = cubicAt(c, Math.max(0, t - 0.01));
    const dx = q[0] - o[0];
    const dy = q[1] - o[1];
    const d = Math.hypot(dx, dy) || 1;
    const h = w(t) / 2;
    L.push(`${f3(p[0] - (dy / d) * h)} ${f3(p[1] + (dx / d) * h)}`);
    R.push(`${f3(p[0] + (dy / d) * h)} ${f3(p[1] - (dx / d) * h)}`);
  }
  return `M${L.join("L")}L${R.reverse().join("L")}Z`;
};
const H_NECK: Pt[] = [
  [18, 22],
  [52, -4],
  [86, 42],
  [124, 16],
];
const H_PILLAR: Pt[] = [
  [124, 16],
  [146, 70],
  [128, 140],
  [84, 179],
];
const H_BOX: Pt[] = [
  [20, 24],
  [40, 82],
  [62, 140],
  [84, 179],
];
const boxW = (t: number) => (22 + 10 * smoothstep(t / 0.22)) * (1 - 0.9 * Math.pow(t, 2.6));
const HARP_D = [
  bandAlong(H_NECK, (t) => 13 - 2 * t),
  bandAlong(H_PILLAR, (t) => 15 - 12 * Math.pow(t, 3)),
  bandAlong(H_BOX, boxW),
].join("");
/** The strings: from the sound box's inner edge, leaning a touch right, up to the neck's underside. */
const HARP_STRINGS = (() => {
  const neck = Array.from({ length: 201 }, (_, i) => cubicAt(H_NECK, i / 200));
  const neckY = (x: number) => neck.reduce((b, p) => (Math.abs(p[0] - x) < Math.abs(b[0] - x) ? p : b), neck[0])[1];
  return [0.12, 0.22, 0.32, 0.42, 0.52, 0.62, 0.72, 0.82].map((t) => {
    const p = cubicAt(H_BOX, t);
    const q = cubicAt(H_BOX, t + 0.01);
    const dx = q[0] - p[0];
    const dy = q[1] - p[1];
    const d = Math.hypot(dx, dy);
    const x0 = p[0] + (dy / d) * (boxW(t) / 2 - 1);
    const y0 = p[1] - (dx / d) * (boxW(t) / 2 - 1);
    let y = y0;
    while (y > 0 && y > neckY(x0 + 0.18 * (y0 - y)) + 5) y -= 0.5;
    return `M${f3(x0)} ${f3(y0)}L${f3(x0 + 0.18 * (y0 - y))} ${f3(y)}`;
  });
})();
const HARP = { scale: 1.06, top: 376, cx: 72, inkTop: 8 } as const;
const HarpPrint: React.FC<{ color: string; opacity: number }> = ({ color, opacity }) => {
  const s = HARP.scale;
  return (
    <g transform={`translate(${f3(CX - HARP.cx * s)} ${f3(HARP.top - HARP.inkTop * s)}) scale(${s})`} opacity={opacity}>
      <path d={HARP_D} fill={color} />
      {/* the scroll: a knob at the neck's upper-left end, over the sound box's head */}
      <circle cx={14} cy={20} r={10} fill={color} />
      {/* the joint where the neck turns down into the forepillar */}
      <circle cx={124} cy={16} r={6.6} fill={color} />
      <path d={HARP_STRINGS.join("")} fill="none" stroke={color} strokeWidth={3.4} strokeLinecap="round" />
    </g>
  );
};

// --- the innovation glyphs (Lucide grammar, one weight) ------------------------------------------------------
const gearD = (() => {
  const n = 8;
  const p = (Math.PI * 2) / n;
  const pt = (r: number, a: number) => `${f3(12 + r * Math.cos(a))} ${f3(12 + r * Math.sin(a))}`;
  let d = "";
  for (let i = 0; i < n; i++) {
    const a = i * p - Math.PI / 2;
    d += `${i === 0 ? "M" : "L"}${pt(7.2, a - 0.3 * p)}L${pt(10, a - 0.17 * p)}L${pt(10, a + 0.17 * p)}L${pt(7.2, a + 0.3 * p)}`;
    d += `A7.2 7.2 0 0 1 ${pt(7.2, a + 0.7 * p)}`;
  }
  return `${d}Z`;
})();
/** A true bell: a wide gaussian hump (sigma 4.3) from x 1.5 to 22.5, long flat tails, a rounded top. */
const BELL_D = `M${Array.from({ length: 43 }, (_, i) => {
  const x = 1.5 + i * 0.5;
  return `${f3(x)} ${f3(18.8 - 11.6 * Math.exp(-Math.pow((x - 12) / 4.3, 2)))}`;
}).join("L")}`;
const GLYPHS: Record<GlyphName, string[]> = {
  // Lucide "flask-conical"
  flask: [
    "M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2",
    "M8.5 2h7",
    "M7 16h10",
  ],
  // Lucide "microscope"
  microscope: [
    "M6 18h8",
    "M3 22h18",
    "M14 22a7 7 0 1 0 0-14h-1",
    "M9 14h2",
    "M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z",
    "M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3",
  ],
  // an eight-tooth gear with its hub
  gear: [gearD, "M15 12a3 3 0 1 1-6 0a3 3 0 1 1 6 0Z"],
  // the bell curve on its axis (the t-test's)
  bell: ["M5 21.6h14", BELL_D],
};
const Glyph: React.FC<{ name: GlyphName; cy: number; color: string; glow?: number }> = ({ name, cy, color, glow = 0 }) => {
  const s = GLYPH_SIZE / 24;
  return (
    <g
      transform={`translate(${f3(CX - 12 * s)} ${f3(cy - 12 * s)}) scale(${f3(s)})`}
      fill="none"
      stroke={color}
      strokeWidth={2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={glow > 0.01 ? { filter: `drop-shadow(0 0 ${f3(4 / s)}px rgba(255,178,40,${f3(0.6 * glow)}))` } : undefined}
    >
      {GLYPHS[name].map((d, i) => (
        <path key={i} d={d} />
      ))}
    </g>
  );
};

/** The house bloom with its strength scaled (the amber's glow goes with its tone). */
const bloomScaled = (k: number, s: number) =>
  BLOOM_LAYERS.map((l) => {
    const m = /rgba\((\d+),(\d+),(\d+),([\d.]+)\)/.exec(l.color);
    const c = m ? `rgba(${m[1]},${m[2]},${m[3]},${f3(Number(m[4]) * s)})` : l.color;
    return `drop-shadow(0 0 ${f3(l.blur / k)}px ${c})`;
  }).join(" ");

const InsideThePint: React.FC<Props> = () => {
  const frame = useCurrentFrame();
  const raw = useId().replace(/[^A-Za-z0-9_-]/g, "_");
  const id = (s: string) => `itp${raw}${s}`;
  const cam = CAM.at(frame);
  const k = cam.k;
  const band = amberBandFor(cam);
  const pool = POOL(frame);

  // the column
  const H = riseH(frame);
  const top = FLOOR - H;
  const segs = Array.from({ length: N_SEG }, (_, i) => {
    const y0 = top + i * SEG_H;
    const cy = y0 + SEG_H / 2;
    const sink = smoothstep((frame - frontAt(Math.max(RIM, y0))) / SINK_F);
    return { i, y0, cy, sink, visible: y0 < FLOOR };
  });
  const rungs = segs.slice(1).map((s) => s.y0).filter((y) => y < FLOOR - 0.5);

  // the stout
  const F = frontY(frame);
  const poured = frame >= FRONT.f0;
  const ha = headAmt(frame);
  const hb = lerp(HEAD.b0, HEAD.b1, ha);
  const feather = lerp(HEAD.feather0, HEAD.feather1, ha);
  const frontD = (() => {
    const xs = Array.from({ length: 81 }, (_, i) => CX - 400 + i * 10);
    const hw = hwI(Math.min(FLOOR, Math.max(RIM, F)));
    const pts = xs.map((x) => `${f3(x)} ${f3(F + frontEdge(x, frame, hw))}`);
    return `M${CX - 400} ${RIM - 400}H${CX + 400}L${[...pts].reverse().join("L")}Z`;
  })();
  // the haze behind the front, thinning; the top band holds until the head takes it over
  const hazeStops = sideYs(RIM, FLOOR, 64).map((y) => {
    // measured from the front at the walls (it leads there), so no un-hazed band trails it
    const since = frame - frontAt(Math.max(RIM, y - FRONT.lead)) + 2;
    let a = since < 0 ? 0 : HAZE_A * (1 - smoothstep(since / HAZE_F));
    const w = 1 - smoothstep((y - (HEAD.b1 - 10)) / 140);
    if (since >= 0) a = Math.max(a, w * HAZE_A * (1 - ha));
    // the surge band: a lighter tan riding the front itself, a few tens of px deep
    const s0 = frame - frontAt(y);
    a += FRONT.band * smoothstep(s0 + 1) * (1 - smoothstep(s0 / 3));
    return { o: (y - RIM) / (FLOOR - RIM), a: a * (0.6 + 0.4 * density(frame)) };
  });

  // the stream
  const sHead = STREAM.from + STREAM.v * (frame - STREAM.head0);
  const sTail = STREAM.from + STREAM.v * (frame - STREAM.tail0);
  const sBottom = Math.min(sHead, RIM + 26);
  const streamOn = sHead > STREAM.from && sTail < RIM + 26;

  // the shadow: glass (faint) and its contents (heavier as it fills): one object
  const contentA = lerp(0.42, 0.7, smoothstep((frame - FRONT.f0) / (FRONT.f1 - FRONT.f0)));
  const sil = [
    { d: OUTLINE_D, a: 0.3 },
    // the poured stout above the column, and the column
    // (counted once the front has reached the column: above empty glass its offset shadow would smudge through)
    ...(poured && F > top ? [{ d: bandPath(RIM, Math.min(top, FLOOR), hwI), a: 0.7 * smoothstep((F - top) / 60) }] : []),
    ...(H > 0.5 ? [{ d: bandPath(top, FLOOR, hwI), a: contentA }] : []),
  ];

  const hair = STROKE.HAIRLINE / k;
  // the base refracts what is above it: amber while the column stands lit, a ruby glow once the stout is down
  const sunkFloor = smoothstep((frame - frontAt(FLOOR - 20)) / SINK_F);
  const baseTint = mixHex(COLOR.amberTop, RUBY_GLOW, sunkFloor);
  const baseA = (H > 0.3 ? smoothstep(H / 40) : 0) * lerp(0.32, 0.5, sunkFloor);
  // the hot highlight on the lip's front arc, on its lit (left) quarter
  const lipHotD = (() => {
    const rx = hwO(RIM);
    const pts = Array.from({ length: 21 }, (_, i) => {
      const a = Math.PI * (0.8 + 0.17 * (i / 20)); // angle along the front arc: its lit left end
      return `${f3(CX + rx * Math.cos(a))} ${f3(RIM + RIM_RY * Math.sin(a))}`;
    });
    return `M${pts.join("L")}`;
  })();
  const sweepT = (frame - SWEEP_F[0]) / (SWEEP_F[1] - SWEEP_F[0]);

  const specks = (list: Speck[], head: boolean) => (
    <g fill={SPECK}>
      {list.map((p, i) => {
        if (frame < p.tb) return null;
        const t = frame - p.tb;
        // a speck is born on the front (or just inside the head's lower edge) and cascades down
        const y = (head ? hb - 6 : p.y0) + p.v * t;
        if (y > FLOOR + 4) return null;
        const x = CX + p.u * hwI(y) + p.w * Math.sin(p.ph + t / 9);
        // the surge thins as it settles; the few out of the head keep their strength
        const a = p.a * (head ? 1 : density(frame));
        return <circle key={i} cx={f3(x)} cy={f3(y)} r={f3(p.r)} opacity={f3(clamp01(a))} />;
      })}
    </g>
  );

  return (
    <AbsoluteFill>
      <StoutStage S={frame} cam={cam} rest={CAM.rest} pool={{ x: pool.x, y: pool.y, strength: pool.strength }}>
        <defs>
          <clipPath id={id("in")}>
            <path d={INTERIOR_D} />
          </clipPath>
          <clipPath id={id("out")}>
            <path d={OUTLINE_D} />
          </clipPath>
          <filter id={id("fb")} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={FRONT.blur} />
          </filter>
          {/* the surge front: white above it (the poured stout), black below (still lit amber / air) */}
          <mask id={id("above")} maskUnits="userSpaceOnUse" x={CX - 420} y={RIM - 500} width={840} height={FLOOR - RIM + 700}>
            <rect x={CX - 420} y={RIM - 500} width={840} height={FLOOR - RIM + 700} fill="#000" />
            {poured ? <path d={frontD} fill="#fff" filter={`url(#${id("fb")})`} /> : null}
          </mask>
          <mask id={id("below")} maskUnits="userSpaceOnUse" x={CX - 420} y={RIM - 500} width={840} height={FLOOR - RIM + 700}>
            <rect x={CX - 420} y={RIM - 500} width={840} height={FLOOR - RIM + 700} fill="#fff" />
            {poured ? <path d={frontD} fill="#000" filter={`url(#${id("fb")})`} /> : null}
          </mask>
          {/* the ruby edge exists only where the stout is: it trails the front's centre */}
          <linearGradient id={id("rubyG")} gradientUnits="userSpaceOnUse" x1="0" y1={f3(F - 150)} x2="0" y2={f3(F - 30)}>
            <stop offset="0" stopColor="#fff" />
            <stop offset="1" stopColor="#000" />
          </linearGradient>
          <mask id={id("rubyM")} maskUnits="userSpaceOnUse" x={CX - 420} y={RIM - 100} width={840} height={FLOOR - RIM + 200}>
            <rect x={CX - 420} y={RIM - 100} width={840} height={FLOOR - RIM + 200} fill={`url(#${id("rubyG")})`} />
          </mask>
          <AmberGradient id={id("amb")} y0={band[0]} y1={band[1]} />
          <linearGradient id={id("hotf")} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={COLOR.amberHot} stopOpacity={ALPHA.hotFall} />
            <stop offset="1" stopColor={COLOR.amberHot} stopOpacity="0" />
          </linearGradient>
          <linearGradient id={id("stout")} gradientUnits="userSpaceOnUse" x1="0" y1={RIM} x2="0" y2={FLOOR}>
            <stop offset="0" stopColor={STOUT_TOP} />
            <stop offset="0.45" stopColor={STOUT} />
            <stop offset="1" stopColor={STOUT} />
          </linearGradient>
          <linearGradient id={id("haze")} gradientUnits="userSpaceOnUse" x1="0" y1={RIM} x2="0" y2={FLOOR}>
            {hazeStops.map((s, i) => (
              <stop key={i} offset={f3(s.o)} stopColor={HAZE} stopOpacity={f3(s.a)} />
            ))}
          </linearGradient>
          <linearGradient id={id("head")} gradientUnits="userSpaceOnUse" x1="0" y1={HEAD.apex} x2="0" y2={hb}>
            <stop offset="0" stopColor={mixHex(HAZE, COLOR.cream, ha)} />
            <stop offset={f3(clamp01(1 - feather / (hb - HEAD.apex)))} stopColor={mixHex(HAZE, COLOR.creamFoot, ha)} />
            <stop offset="1" stopColor={mixHex(HAZE, COLOR.creamFoot, ha)} stopOpacity="0" />
          </linearGradient>
          <linearGradient id={id("mat")} gradientUnits="userSpaceOnUse" x1="0" y1={MAT.cy - MAT.ry} x2="0" y2={MAT.cy + MAT.ry}>
            <stop offset="0" stopColor={COLOR.boardFoot} />
            <stop offset="1" stopColor={COLOR.board} />
          </linearGradient>
          <linearGradient id={id("base")} gradientUnits="userSpaceOnUse" x1="0" y1={FLOOR} x2="0" y2={BOT}>
            <stop offset="0" stopColor={COLOR.glass} stopOpacity="0.26" />
            <stop offset="0.35" stopColor={COLOR.glass} stopOpacity="0.1" />
            <stop offset="1" stopColor={COLOR.glass} stopOpacity="0.18" />
          </linearGradient>
          <linearGradient id={id("streak")} gradientUnits="userSpaceOnUse" x1="0" y1={RIM + 34} x2="0" y2={FLOOR - 70}>
            <stop offset="0" stopColor={COLOR.edge} stopOpacity="0" />
            <stop offset="0.2" stopColor={COLOR.edge} stopOpacity="0.42" />
            <stop offset="0.6" stopColor={COLOR.edge} stopOpacity="0.3" />
            <stop offset="1" stopColor={COLOR.edge} stopOpacity="0" />
          </linearGradient>
          <linearGradient id={id("ruby")} gradientUnits="userSpaceOnUse" x1={CX - 300} y1="0" x2={CX + 300} y2="0">
            <stop offset="0" stopColor={RUBY_GLOW} stopOpacity="0.62" />
            <stop offset="1" stopColor={RUBY_GLOW} stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id={id("stream")} gradientUnits="userSpaceOnUse" x1={STREAM.x - STREAM.w / 2} y1="0" x2={STREAM.x + STREAM.w / 2} y2="0">
            <stop offset="0" stopColor={RUBY_GLOW} />
            <stop offset="0.35" stopColor={STOUT_TOP} />
            <stop offset="1" stopColor={STOUT} />
          </linearGradient>
        </defs>

        {/* 1. the beer mat on the ground: its one shadow, its thickness, its face, a printed inner ring */}
        <ellipse cx={MAT.cx + 3} cy={MAT.cy + MAT.thick + 4} rx={MAT.rx} ry={MAT.ry} fill={COLOR.shadow} opacity={0.42} style={{ filter: "blur(5px)" }} />
        <ellipse cx={MAT.cx} cy={MAT.cy + MAT.thick} rx={MAT.rx} ry={MAT.ry} fill={mixHex(COLOR.boardFoot, COLOR.shadow, 0.35)} />
        <rect x={MAT.cx - MAT.rx} y={MAT.cy} width={MAT.rx * 2} height={MAT.thick} fill={mixHex(COLOR.boardFoot, COLOR.shadow, 0.35)} />
        <ellipse cx={MAT.cx} cy={MAT.cy} rx={MAT.rx} ry={MAT.ry} fill={`url(#${id("mat")})`} />
        <ellipse cx={MAT.cx} cy={MAT.cy} rx={MAT.rx * MAT.ring} ry={MAT.ry * MAT.ring} fill="none" stroke={COLOR.cream} strokeOpacity={0.55} strokeWidth={f3(2 / k)} />
        <path d={`M${MAT.cx - MAT.rx} ${MAT.cy}A${MAT.rx} ${MAT.ry} 0 0 0 ${MAT.cx + MAT.rx} ${MAT.cy}`} fill="none" stroke={COLOR.edge} strokeOpacity={0.35} strokeWidth={f3(EDGE.CREAM / k)} />

        {/* 2. the pint's one shadow (glass + contents), and its contact shadow on the mat under the foot */}
        <UnionShadow sil={sil} s={2.4} elevation="rest" contact={null} />
        <ellipse cx={CX + 14} cy={BOT - 1} rx={HB * 1.06} ry={FOOT_RY * 1.4} fill={COLOR.shadow} opacity={0.62} style={{ filter: "blur(5px)" }} />

        {/* 3. the glass body: a faint tint, the heavy base a little more */}
        <path d={OUTLINE_D} fill={COLOR.glass} fillOpacity={ALPHA.glassTint} />
        {/* the lip's back arc, seen through the glass */}
        <path d={`M${f3(CX - hwO(RIM))} ${RIM}A${f3(hwO(RIM))} ${RIM_RY} 0 0 1 ${f3(CX + hwO(RIM))} ${RIM}`} fill="none" stroke={COLOR.glass} strokeOpacity={ALPHA.glassLo} strokeWidth={f3(hair)} />
        {/* the heavy base: solid glass, lighter than the body; the liquid above it refracts down into it */}
        <path d={BASE_SOLID_D} fill={`url(#${id("base")})`} />
        {H > 0.3 || poured ? (
          <path d={BASE_SOLID_D} fill={baseTint} fillOpacity={f3(baseA)} style={{ mixBlendMode: "screen" }} />
        ) : null}
        <path d={`M${f3(CX - HB)} ${f3(BOT - FOOT_RY)}A${f3(HB)} ${FOOT_RY} 0 0 1 ${f3(CX + HB)} ${f3(BOT - FOOT_RY)}`} fill="none" stroke={COLOR.glass} strokeOpacity={ALPHA.glassLo} strokeWidth={f3(hair)} />

        {/* 4. the amber column, lit (below the front): one glow pass */}
        {H > 0.3 ? (
          <g style={{ filter: bloomScaled(k, 1) }}>
            <g mask={`url(#${id("below")})`}>
              <g clipPath={`url(#${id("in")})`}>
                <rect x={CX - 320} y={f3(top)} width={640} height={f3(H)} fill={`url(#${id("amb")})`} />
                <rect x={CX - 320} y={f3(top)} width={640} height={f3(EDGE.HOT_FALL / k)} fill={`url(#${id("hotf")})`} />
                <line x1={CX - 320} x2={CX + 320} y1={f3(top + EDGE.HOT / k / 2)} y2={f3(top + EDGE.HOT / k / 2)} stroke={COLOR.amberHot} strokeWidth={f3(EDGE.HOT / k)} />
                <g stroke={COLOR.rung} strokeWidth={f3(hair)}>
                  {rungs.map((y) => (
                    <line key={y} x1={CX - 320} x2={CX + 320} y1={f3(y)} y2={f3(y)} />
                  ))}
                </g>
                {segs.map((s) => (s.visible ? <Glyph key={s.i} name={SEG_GLYPH[s.i]} cy={s.cy} color={COLOR.inkDark} /> : null))}
              </g>
            </g>
          </g>
        ) : null}

        {/* 5. the poured stout (above the front): body, the sunk column, the ruby edge, the haze, the specks */}
        {poured ? (
          <g mask={`url(#${id("above")})`}>
            <g clipPath={`url(#${id("in")})`}>
              <rect x={CX - 320} y={RIM - 4} width={640} height={FLOOR - RIM + 8} fill={`url(#${id("stout")})`} />
              {segs.map((s) =>
                s.visible ? (
                  <rect
                    key={s.i}
                    x={CX - 320}
                    y={f3(s.y0)}
                    width={640}
                    height={f3(Math.min(SEG_H, FLOOR - s.y0))}
                    fill={mixHex(mixHex(COLOR.amberTop, COLOR.amberFoot, s.i / (N_SEG - 1)), EMBER_BODY, lerp(0.68, 1, s.sink))}
                  />
                ) : null,
              )}
              <g stroke={EMBER_RUNG} strokeWidth={f3(hair)}>
                {rungs.map((y) => (
                  <line key={y} x1={CX - 320} x2={CX + 320} y1={f3(y)} y2={f3(y)} />
                ))}
              </g>
              {segs.map((s) =>
                s.visible ? <Glyph key={s.i} name={SEG_GLYPH[s.i]} cy={s.cy} color={mixHex(COLOR.inkDark, EMBER_GLYPH, smoothstep(s.sink * 2))} glow={s.sink} /> : null,
              )}
              <g fill="none" stroke={`url(#${id("ruby")})`} strokeWidth={40} style={{ filter: "blur(12px)" }} mask={`url(#${id("rubyM")})`}>
                <path d={sidePath(-1, RIM, FLOOR)} />
                <path d={sidePath(1, RIM, FLOOR)} />
              </g>
              <rect x={CX - 320} y={RIM - 4} width={640} height={FLOOR - RIM + 8} fill={`url(#${id("haze")})`} />
              {specks(FRONT_SPECKS, false)}
              {specks(HEAD_SPECKS, true)}
            </g>
          </g>
        ) : null}

        {/* 5b. the surge band's particles, riding the front itself */}
        {poured && frame < FRONT.f1 + 6 ? (
          <g clipPath={`url(#${id("in")})`} fill={SPECK}>
            {BAND_SPECKS.map((p, i) => {
              const hwF = hwI(Math.min(FLOOR, Math.max(RIM, F)));
              const x0 = CX + p.u * hwF;
              // the band keeps falling at the front's speed once the front is through, so it leaves through the floor
              const Fb = F + Math.max(0, frame - FRONT.f1) * 40;
              const y = Fb + frontEdge(x0, frame, hwF) + p.o + 3 * Math.sin(p.ph + frame / 3);
              if (y < RIM + 2 || y > FLOOR) return null;
              const x = CX + p.u * hwI(y) + p.w * Math.sin(p.ph + frame / 7);
              return <circle key={i} cx={f3(x)} cy={f3(y)} r={f3(p.r)} opacity={f3(p.a)} />;
            })}
          </g>
        ) : null}

        {/* 6. the head, settling out of the surge at the top (domed a touch above the rim) */}
        {ha > 0.001 ? (
          <path
            d={`M${f3(CX - hwI(HEAD.wallY))} ${HEAD.wallY}Q${CX} ${HEAD.apex} ${f3(CX + hwI(HEAD.wallY))} ${HEAD.wallY}${sidePath(1, HEAD.wallY, hb).replace("M", "L")}L${sideYs(HEAD.wallY, hb)
              .reverse()
              .map((y) => `${f3(CX - hwI(y))} ${f3(y)}`)
              .join("L")}Z`}
            fill={`url(#${id("head")})`}
            fillOpacity={f3(ha)}
          />
        ) : null}
        {ha > 0.001 ? (
          <path
            d={`M${f3(CX - hwI(HEAD.wallY) + 6)} ${f3(HEAD.wallY - 0.8)}Q${CX} ${f3(HEAD.apex + EDGE.CREAM / k / 2)} ${f3(CX + hwI(HEAD.wallY) - 6)} ${f3(HEAD.wallY - 0.8)}`}
            fill="none"
            stroke={COLOR.edge}
            strokeOpacity={f3(ALPHA.edge * smoothstep((ha - 0.5) / 0.5))}
            strokeWidth={f3(EDGE.CREAM / k)}
          />
        ) : null}

        {/* 7. the stream of stout falling into the glass */}
        {streamOn ? (
          <path
            d={`M${STREAM.x - STREAM.w / 2} ${f3(Math.max(sTail, STREAM.from - 40) + STREAM.w / 2)}A${STREAM.w / 2} ${STREAM.w / 2} 0 0 1 ${STREAM.x + STREAM.w / 2} ${f3(Math.max(sTail, STREAM.from - 40) + STREAM.w / 2)}V${f3(sBottom - STREAM.w / 2)}A${STREAM.w / 2} ${STREAM.w / 2} 0 0 1 ${STREAM.x - STREAM.w / 2} ${f3(sBottom - STREAM.w / 2)}Z`}
            fill={`url(#${id("stream")})`}
          />
        ) : null}

        {/* 8. the slot across the floor, the floor's hairline, the column's foot occlusion */}
        <rect x={f3(CX - hwI(FLOOR) - 2 / k)} y={f3(FLOOR - EDGE.SLOT / k / 2)} width={f3(2 * hwI(FLOOR) + 4 / k)} height={f3(EDGE.SLOT / k)} fill={COLOR.inkDark} fillOpacity={ALPHA.slot} />
        {H > 0.3 && !(poured && F > FLOOR) ? (
          <g clipPath={`url(#${id("in")})`}>
            <rect x={CX - 320} y={f3(FLOOR - Math.min(H, EDGE.FOOT_AO / k))} width={640} height={f3(Math.min(H, EDGE.FOOT_AO / k))} fill={COLOR.shadow} fillOpacity={ALPHA.footAO} />
          </g>
        ) : null}

        {/* 9. the glass: the wall's inner face, the one specular streak, the hairline, the lip, the harp printed on it */}
        <g fill="none" stroke={COLOR.glass} strokeOpacity={0.22} strokeWidth={f3(hair)}>
          <path d={sidePath(-1, RIM + RIM_RY, FLOOR)} />
          <path d={sidePath(1, RIM + RIM_RY, FLOOR)} />
        </g>
        <path d={STREAK_D} fill={`url(#${id("streak")})`} style={{ filter: "blur(1.2px)" }} />
        <path d={OUTLINE_D} fill="none" stroke={COLOR.glass} strokeOpacity={ALPHA.glassHi} strokeWidth={f3(hair)} strokeLinejoin="round" />
        <path d={`M${f3(CX - hwI(FLOOR))} ${FLOOR}H${f3(CX + hwI(FLOOR))}`} stroke={COLOR.glass} strokeOpacity={ALPHA.glassHi} strokeWidth={f3(hair)} />
        {/* the lip: its front arc, with the hot highlight where the key light catches it (upper left) */}
        <path d={`M${f3(CX + hwO(RIM))} ${RIM}A${f3(hwO(RIM))} ${RIM_RY} 0 0 1 ${f3(CX - hwO(RIM))} ${RIM}`} fill="none" stroke={COLOR.glass} strokeOpacity={ALPHA.glassHi} strokeWidth={f3(hair * 1.4)} />
        <path d={lipHotD} fill="none" stroke={COLOR.edge} strokeOpacity={0.9} strokeWidth={f3((EDGE.HOT * 1.2) / k)} strokeLinecap="round" />
        <HarpPrint color={COLOR.inkCream} opacity={0.92} />

        {/* 10. THE ONE CLICK: a light sweep across the glass on "Guinness" */}
        <g clipPath={`url(#${id("out")})`}>
          <LightSweep x={CX - 300} y={HEAD.apex - 4} w={600} h={BOT - HEAD.apex + 4} k={k} t={sweepT} on="cream" r={0} />
        </g>
      </StoutStage>
    </AbsoluteFill>
  );
};

export default InsideThePint;
