// ---------------------------------------------------------------------------
// HugeWorldOfBacteria (kyle-pandemics, cut 23). Dwarkesh map style (styles/dwarkesh-map.md) drawn in the London
// depth manner (DEPTH.md). Opaque 1080x1920, 29.97 fps, 235 frames.
//
// CHECK LINE: a viewer with the sound off can say "out of a whole world of different bacteria, TB is one
// ordinary-looking rod — and it hides by slipping inside the very cell that should destroy it."
//
// THE LINE: "And it's just a weird disease. It's just a bacterial pathogen that, in the huge world of bacteria, this
// one is very— (very good at hiding)" (the speaker is back on screen at "very"; "good at hiding" plays over him).
// WORD -> FRAME (f0 = 23.023 s): it's 5 · just 17 · a 20 · WEIRD 23 · DISEASE 28 · it's 38 · just 45 · a 50 ·
//   BACTERIAL 56 · PATHOGEN 80 · that 102 · in 120 · the 146 · HUGE 153 · WORLD 172 · of 186 · BACTERIA 195 ·
//   THIS 212 · ONE 219 · is 224 · (very 237, after the cut).
// DURATION: the slot 23.023 -> 30.864 s = 7.841 s x 29.97 = 235 frames (f0..f234).
//
// THE MOTION (V2): one camera (hugeWorldScene.ts): f0-84 a low dolly (eye 3 units over 1-unit bacteria) forward
// and to the right over a living surface: cream bacteria lying spread out on the moist ground with gaps (never
// stacked; sparse and small under the lens, the crowd thickening with distance to countless at the horizon),
// engraved, not glossy: cocci, pairs, flat grape clusters, chains, plump rods (some bent, some dividing, some with
// pili), chained rods, commas, corkscrews, flagellated rods, swimmers above. It brings one ORANGE TB rod into the
// centre on "BACTERIAL PATHOGEN" (centred ~f78): slender (2.8 x 0.36 units, aspect ~8: slimmer than the plump
// cream rods, 2.3 x 0.9), blunt rounded ends, slightly curved, a rough wrinkled waxy surface with faint beading.
// f84-146 a gentle rise; on "in the HUGE WORLD of BACTERIA" one measured crane up and back (f146-192: eye 8.5 -> 29,
// 17 -> 58 units from the rod): the rod shrinks to a small orange mark (~66 px) and the field runs to the horizon in
// every direction; a clean settle (f192-199); then the ease back in onto the macrophage (f199-226) and a creep.
// The macrophage (a low soft cushion, wider than tall, lit upper left, darker at the rim, a frilly lamellipodium,
// three pseudopods, a soft darker kidney-shaped nucleus seen through the body, fine granules) crawls in off the right
// edge (~f150), parting the crowd like a hull; its leading edge meets the rod's right end: CONTACT f178 (first
// reaction f178: two pseudopod arms start round the rod's near and far sides, f178-200, curling in past its left
// end), then the membrane closes between them and the body flows over (f197-211): swallowed on "THIS ONE".
// f212-234 the cell fills ~65 % of the frame width (y ~780-1009), its edge rippling, the rod intact and orange
// inside a faint phagosome bubble, the field to the horizon round it.
// Orange = the disease (the TB bacillus) only; every other microbe and the macrophage are cream, sunk toward the
// page with distance (in play near, context far; the nearest, under the lens, a step quieter).
// Continuity: fine details (hatching, sphere arcs, flagella, pili) fade in and out with screen size instead of
// switching on at a threshold; the lamellipodium's frills fade out by a mask, not cut line ends.
//
// DEPTH: one pinhole camera, horizontal axis, VP on x 540 at the horizon (a lens shift derived so the focus, the rod
// then the macrophage's resting place, rides y 800 -> 880 -> 850 -> 870); F 1400 px; a moist ground plane (tone
// bands compressing, fibres to the VP, flecks, hazing to the page); light from the upper left on every volume,
// contact shadows, swimmers' shadows below them, painter's order by depth, parallax from the camera's real travel.
// The macrophage is the heightfield of a metaball field, toned by its (smoothed) slope under the light, darker at the rim.
// Caption bands: the rod stays in y 780-930 and the macrophage above y 1015 on every frame (checked); only the
// ground and context bacteria run through the bands, sunk in the bottom shade.
//
// SOURCES: Mycobacterium tuberculosis: a slender, slightly curved rod, ~2-4 x 0.3-0.5 um, with a thick waxy (mycolic
// acid) coat (checked against the clip's own SEM, images/23.8_WeirdDisease_MycobacteriumTuberculosisSEM.jpg, rods
// ~2-3 um x ~0.4 um, rough surfaces, blunt ends; and the acid-fast stain, 31.6_..ZiehlNeelsen.jpg, slender, faintly
// beaded); E. coli-like rods ~2 x 1 um, cocci ~1 um; engulfed by alveolar macrophages, it survives and multiplies inside them by blocking phagosome
// maturation (Pieters 2008, Cell Host & Microbe 3:399). The other forms are the textbook bacterial morphologies.
// No figures on screen.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { TexcocoPage } from "../kits/maps/texcocoShared";
import { SpriteCanvas } from "../kits/maps/pageFigures";
import {
  DURATION,
  F,
  FIELD,
  FPS,
  GRANULES,
  LEVELS,
  ARM,
  ROD,
  armExt,
  armPath,
  armSolid,
  pseudopods,
  closing,
  fromRodFrame,
  SWIMMERS,
  camAt,
  cellContours,
  cellField,
  cellGrid,
  heightOf,
  project,
  pushed,
  rodAxis,
  swimPos,
  type Bug,
  type Cam3,
  type Swimmer,
} from "./hugeWorldScene";

export { DURATION, FPS };
export const schema = z.object({});
export const defaultProps = schema.parse({});

// ---------------------------------------------------------------------------
// PALETTE (styles/dwarkesh-map.md)
// ---------------------------------------------------------------------------
const PAGE = "#3F3428";
const DARK = "#17120D";
const INK = "#E9DDBF";
const INK_DEEP = "#D3C5A2";
const INK_SHADE = "#9C8E6C";
const LAND_RIM = "#6A5838";
const ACCENT = "#FFB000";
const ACCENT_DEEP = "#D98A0C";

const hexRgb = (h: string): [number, number, number] => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mixC = (a: string, b: string, t: number) => {
  const pa = hexRgb(a);
  const pb = hexRgb(b);
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(",")})`;
};
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const sstep = (v: number) => {
  const u = c01(v);
  return u * u * (3 - 2 * u);
};

type InkSet = { out: string; shade: string; deep: string; main: string; spec: string; specA: number };
const INKS: InkSet[] = [];
for (let i = 0; i <= 100; i++) {
  const t = i / 100;
  INKS.push({
    out: mixC(PAGE, DARK, 0.35 + 0.65 * t),
    shade: mixC(PAGE, INK_SHADE, t),
    deep: mixC(PAGE, INK_DEEP, t),
    main: mixC(PAGE, INK, t),
    spec: "#FBF5E6",
    specA: 0.5 * t,
  });
}
const inkAt = (t: number) => INKS[Math.round(c01(t) * 100)];

/** atmospheric depth: the cream level at distance D (in play near, context mid, toward the page far) */
const toneAt = (D: number) => (0.12 + 0.72 / (1 + Math.pow(D / 55, 1.3))) * (1 - 0.3 * (1 - c01((D - 2) / 4.5)));
// (the nearest, passing under the lens, are a step quieter: they sink toward the frame's shaded bottom)
/** the context recede as the camera rises (CRAFT: recede the context before the cell arrives) */
const recedeAt = (f: number) => 1 - 0.2 * sstep((f - 110) / 60);

// the light, from the upper left (screen)
const LX = -0.55;
const LY = -0.835;

type Pt = [number, number];
const poly = (ctx: CanvasRenderingContext2D, pts: Pt[], dx = 0, dy = 0) => {
  ctx.beginPath();
  ctx.moveTo(pts[0][0] + dx, pts[0][1] + dy);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0] + dx, pts[i][1] + dy);
};
const strokePoly = (ctx: CanvasRenderingContext2D, pts: Pt[], w: number, col: string, dx = 0, dy = 0, a = 1) => {
  poly(ctx, pts, dx, dy);
  ctx.lineWidth = w;
  ctx.strokeStyle = col;
  ctx.globalAlpha = a;
  ctx.stroke();
  ctx.globalAlpha = 1;
};

/** the TB rod's (and the membrane arms') tube: lit stripe and waxy sheen */
const waxTube = (ctx: CanvasRenderingContext2D, pts: Pt[], w: number, ink: InkSet, waxy = false) => {
  if (pts.length < 2) return;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (w < 1.6) {
    strokePoly(ctx, pts, Math.max(0.7, w), ink.deep, 0, 0, Math.min(1, w + 0.2));
    return;
  }
  const ow = Math.max(0.9, Math.min(3.2, 0.09 * w + 0.6));
  strokePoly(ctx, pts, w + 2 * ow, ink.out);
  strokePoly(ctx, pts, w, ink.shade);
  strokePoly(ctx, pts, w * 0.74, ink.deep, LX * w * 0.11, LY * w * 0.11);
  strokePoly(ctx, pts, w * 0.44, ink.main, LX * w * 0.2, LY * w * 0.2);
  if (w > 9) {
    if (waxy) strokePoly(ctx, pts, w * 0.24, ink.spec, LX * w * 0.24, LY * w * 0.24, 0.3);
    strokePoly(ctx, pts, Math.max(0.8, w * 0.08), ink.spec, LX * w * 0.29, LY * w * 0.29, ink.specA);
  }
  if (w > 16) {
    const hw = Math.max(0.7, w * 0.035);
    strokePoly(ctx, pts, hw, ink.out, -LX * w * 0.28, -LY * w * 0.28, 0.5);
    strokePoly(ctx, pts, hw, ink.out, -LX * w * 0.38, -LY * w * 0.38, 0.6);
  }
};
/** the TB bacillus (after the clip's SEM and acid-fast stain): a slender rod with blunt rounded ends, a fine outline,
 *  the shade side hatched like the others, a soft waxy sheen (no hard highlight), a slightly rough, wrinkled surface
 *  and faint beading across it */
const tbRod = (ctx: CanvasRenderingContext2D, pts: Pt[], w: number) => {
  if (pts.length < 2) return;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const ow = Math.max(0.8, Math.min(2.2, 0.06 * w + 0.5));
  strokePoly(ctx, pts, w + 2 * ow, DARK);
  strokePoly(ctx, pts, w, "#A8640B");
  strokePoly(ctx, pts, w * 0.72, ACCENT_DEEP, LX * w * 0.13, LY * w * 0.13);
  strokePoly(ctx, pts, w * 0.42, ACCENT, LX * w * 0.2, LY * w * 0.2);
  if (w < 5) return;
  // the waxy sheen: broad and soft
  strokePoly(ctx, pts, w * 0.22, "#FFE7B0", LX * w * 0.23, LY * w * 0.23, 0.32);
  // walk the axis: normals for the wrinkles, the beading and the hatching
  const n = pts.length;
  const nrm: Pt[] = pts.map((_, i) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(n - 1, i + 1)];
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    let nx = -(b[1] - a[1]) / L;
    let ny = (b[0] - a[0]) / L;
    if (nx * -LX + ny * -LY < 0) {
      nx = -nx;
      ny = -ny;
    }
    return [nx, ny];
  });
  const at = (u: number): { p: Pt; nn: Pt; t: Pt } => {
    const x = u * (n - 1);
    const i = Math.min(n - 2, Math.floor(x));
    const f = x - i;
    const p: Pt = [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f];
    const L = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]) || 1;
    return { p, nn: nrm[i], t: [(pts[i + 1][0] - pts[i][0]) / L, (pts[i + 1][1] - pts[i][1]) / L] };
  };
  if (w > 9) {
    // faint beading: darker bands across the body
    ctx.beginPath();
    [0.2, 0.36, 0.53, 0.68, 0.83].forEach((u) => {
      const { p, nn } = at(u);
      ctx.moveTo(p[0] - nn[0] * w * 0.4, p[1] - nn[1] * w * 0.4);
      ctx.lineTo(p[0] + nn[0] * w * 0.4, p[1] + nn[1] * w * 0.4);
    });
    ctx.lineWidth = w * 0.13;
    ctx.strokeStyle = "#B36A0A";
    ctx.globalAlpha = 0.18 * c01((w - 9) / 6);
    ctx.stroke();
    // the rough, wrinkled surface: two fine wavering lines along it
    ctx.beginPath();
    [-0.12, 0.16].forEach((o, j) => {
      for (let k = 0; k <= 40; k++) {
        const u = 0.08 + (0.84 * k) / 40;
        const { p, nn } = at(u);
        const off = w * (o + 0.025 * Math.sin(k * 0.55 + j * 2.3) + 0.012 * Math.sin(k * 1.3 + j));
        if (k === 0) ctx.moveTo(p[0] + nn[0] * off, p[1] + nn[1] * off);
        else ctx.lineTo(p[0] + nn[0] * off, p[1] + nn[1] * off);
      }
    });
    ctx.lineWidth = Math.max(0.6, w * 0.025);
    ctx.strokeStyle = "#8A4F08";
    ctx.globalAlpha = 0.3 * c01((w - 9) / 6);
    ctx.stroke();
    // hatching across the shade side
    ctx.beginPath();
    for (let k = 0; k <= 30; k++) {
      const u = 0.1 + (0.8 * k) / 30;
      const { p, nn, t } = at(u);
      const a0 = w * (k % 2 === 0 ? 0.12 : 0.24);
      ctx.moveTo(p[0] + nn[0] * a0 - t[0] * w * 0.04, p[1] + nn[1] * a0 - t[1] * w * 0.04);
      ctx.lineTo(p[0] + nn[0] * w * 0.46 + t[0] * w * 0.04, p[1] + nn[1] * w * 0.46 + t[1] * w * 0.04);
    }
    ctx.lineWidth = Math.max(0.6, w * 0.022);
    ctx.strokeStyle = DARK;
    ctx.globalAlpha = 0.4 * c01((w - 9) / 6);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
};
/** an engraved body along a screen polyline, width w px: a fine outline, a flat lit side and shade side, and short
 *  hatch strokes across the body on its shade side (no gloss) */
const tube = (ctx: CanvasRenderingContext2D, pts: Pt[], w: number, ink: InkSet) => {
  if (pts.length < 2) return;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (w < 1.6) {
    strokePoly(ctx, pts, Math.max(0.7, w), ink.deep, 0, 0, Math.min(1, w + 0.2));
    return;
  }
  const ow = Math.max(0.7, Math.min(2.0, 0.05 * w + 0.5));
  strokePoly(ctx, pts, w + 2 * ow, ink.out);
  strokePoly(ctx, pts, w, ink.shade);
  strokePoly(ctx, pts, w * 0.66, ink.deep, LX * w * 0.16, LY * w * 0.16);
  if (w < 6) return;
  // the hatching: short strokes across the shade half, walking the axis
  let total = 0;
  const segL: number[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const l = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
    segL.push(l);
    total += l;
  }
  const sp = Math.max(2.3, Math.min(6.5, w * 0.06));
  const end = w * 0.3;
  let n = 0;
  ctx.beginPath();
  let k = 0;
  let acc = 0;
  for (let d = end; d < total - end; d += sp) {
    while (k < segL.length - 1 && d > acc + segL[k]) acc += segL[k++];
    k = Math.min(k, segL.length - 1);
    const t = segL[k] > 0 ? (d - acc) / segL[k] : 0;
    const p0 = pts[k];
    const p1 = pts[k + 1];
    const px = p0[0] + (p1[0] - p0[0]) * t;
    const py = p0[1] + (p1[1] - p0[1]) * t;
    const tx = (p1[0] - p0[0]) / (segL[k] || 1);
    const ty = (p1[1] - p0[1]) / (segL[k] || 1);
    let nx = -ty;
    let ny = tx;
    if (nx * -LX + ny * -LY < 0) {
      nx = -nx;
      ny = -ny;
    }
    // graded: the strokes reach further into the body every other one, so the shade turns
    const a0 = w * (n++ % 2 === 0 ? 0.08 : 0.22);
    const a1 = w * 0.46;
    ctx.moveTo(px + nx * a0 - tx * w * 0.04, py + ny * a0 - ty * w * 0.04);
    ctx.lineTo(px + nx * a1 + tx * w * 0.04, py + ny * a1 + ty * w * 0.04);
  }
  ctx.lineWidth = Math.max(0.6, Math.min(2.2, w * 0.018));
  ctx.strokeStyle = ink.out;
  ctx.globalAlpha = 0.42 * c01((w - 6) / 5); // fades in as the body grows (no pop)
  ctx.stroke();
  ctx.globalAlpha = 1;
};
/** an engraved sphere, radius r px: a fine outline, the lit cap, arcs of hatching on the shade side */
const sphere = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, ink: InkSet) => {
  const circ = (cx: number, cy: number, rr: number, col: string, a = 1) => {
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(0.3, rr), 0, Math.PI * 2);
    ctx.fillStyle = col;
    ctx.globalAlpha = a;
    ctx.fill();
    ctx.globalAlpha = 1;
  };
  if (r < 0.9) {
    circ(x, y, Math.max(0.5, r), ink.deep, Math.min(1, r + 0.3));
    return;
  }
  const ow = Math.max(0.7, Math.min(2, 0.05 * r * 2 + 0.5));
  circ(x, y, r + ow, ink.out);
  circ(x, y, r, ink.shade);
  circ(x + LX * r * 0.16, y + LY * r * 0.16, r * 0.76, ink.deep);
  if (r > 3.5) {
    const a0 = Math.atan2(-LY, -LX);
    ctx.lineWidth = Math.max(0.6, r * 0.04);
    ctx.strokeStyle = ink.out;
    const rings = [0.58, 0.68, 0.78, 0.88];
    const inner = c01((r - 9) / 4);
    const outer = c01((r - 3.5) / 3);
    rings.forEach((kk, i) => {
      const span = 0.75 + 0.18 * i;
      ctx.globalAlpha = (0.35 + 0.1 * i) * (i % 2 === 0 ? inner : outer);
      ctx.beginPath();
      ctx.arc(x, y, r * kk, a0 - span, a0 + span);
      ctx.stroke();
    });
    ctx.globalAlpha = 1;
  }
};
/** a thin flagellum along a screen polyline */
const flag = (ctx: CanvasRenderingContext2D, pts: Pt[], w: number, ink: InkSet, a = 1) => {
  if (pts.length < 2 || a < 0.01) return;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  strokePoly(ctx, pts, w + 1.2, ink.out, 0, 0, 0.8 * a);
  strokePoly(ctx, pts, w, ink.deep, 0, 0, a);
};

// ---------------------------------------------------------------------------
// THE BUGS IN 3D -> drawing calls
// ---------------------------------------------------------------------------
type Item = { D: number; draw: (ctx: CanvasRenderingContext2D) => void };
type Sh = { D: number; draw: (ctx: CanvasRenderingContext2D) => void };

const rot = (x: number, z: number, a: number): [number, number] => [x * Math.cos(a) - z * Math.sin(a), x * Math.sin(a) + z * Math.cos(a)];

/** the 3D axis of a rod-like body: centre (X, Z), heading a, length L, radius R, bow b */
const rod3 = (X: number, Z: number, Y: number, a: number, L: number, b: number, n = 8): [number, number, number][] => {
  const out: [number, number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const u = -L / 2 + (L * i) / n;
    const s = (2 * u) / L;
    const v = b * (1 - s * s);
    const [dx, dz] = rot(u, v, a);
    out.push([X + dx, Y, Z + dz]);
  }
  return out;
};

const addBug = (b: Bug, c: Cam3, f: number, items: Item[], shadows: Sh[], tone: number) => {
  const [X, Z] = pushed(b, f);
  const D = Z - c.z;
  if (D < 0.5) return;
  const reach = 3.8 * b.size + 1;
  // cull: the bug's centre well outside the frame
  const p = project(c, X, 0.4, Z);
  const s = F / D; // px per unit at this depth
  if (p[0] < -reach * s || p[0] > 1080 + reach * s || p[1] < -reach * s || p[1] > 1920 + reach * s) return;
  const ink = inkAt(tone * toneAt(D));
  const pr = (x: number, y: number, z: number): Pt => {
    const q = project(c, x, y, z);
    return [q[0], q[1]];
  };
  /** a 3D polyline on screen: the longest run of its points safely in front of the lens */
  const prLine = (pts: [number, number, number][], dy = 0, dx = 0, dz = 0): Pt[] => {
    let best: Pt[] = [];
    let cur: Pt[] = [];
    pts.forEach((q) => {
      if (q[2] + dz - c.z < 0.35) {
        if (cur.length > best.length) best = cur;
        cur = [];
        return;
      }
      cur.push(pr(q[0] + dx, dy < 0 ? q[1] : dy, q[2] + dz));
    });
    return cur.length > best.length ? cur : best;
  };
  const g = f / FPS;
  const near = s > 40;
  // a living twitch for the near ones
  const a = b.ang + (near ? 0.03 * Math.sin(g * 1.3 + b.seed) : 0);
  if (s < 2.2) {
    // far: one mark in the band
    const col = ink.deep;
    items.push({
      D,
      draw: (ctx) => {
        ctx.fillStyle = col;
        ctx.globalAlpha = 0.9;
        const w = b.kind === "spiro" ? 3.5 * s : b.kind === "bacillus" || b.kind === "chainrod" || b.kind === "flagrod" ? 2 * s : 1.1 * s;
        ctx.fillRect(p[0] - w / 2, p[1] - 0.45, Math.max(0.8, w), Math.max(0.8, 0.8 * s));
        ctx.globalAlpha = 1;
      },
    });
    return;
  }
  const S = b.size;
  // shadows (on the ground, offset toward the lower right: +X, -Z)
  const shOff: [number, number] = [0.14, -0.12];
  if (b.balls) {
    const balls = b.balls.map(([bx, by, bz, br]) => {
      const [rx, rz] = rot(bx * S, bz * S, a);
      return { x: X + rx, y: by * S, z: Z + rz, r: br * S };
    });
    shadows.push({
      D,
      draw: (ctx) => {
        balls.forEach((q) => {
          if (q.z - c.z - q.r < 0.4) return;
          const cp = project(c, q.x + shOff[0], 0, q.z + shOff[1]);
          const rx = (F * q.r * 1.05) / (q.z - c.z);
          const ry = Math.max(0.6, (F * c.h) / (q.z - c.z - q.r) - (F * c.h) / (q.z - c.z + q.r)) / 2;
          ctx.beginPath();
          ctx.ellipse(cp[0], cp[1], rx, Math.abs(ry) * 1.05, 0, 0, Math.PI * 2);
          ctx.fill();
        });
      },
    });
    items.push({
      D,
      draw: (ctx) => {
        const list = balls.map((q) => ({ q, d: q.z - c.z })).sort((u, v) => v.d - u.d);
        list.forEach(({ q, d }) => {
          if (d < 0.5) return;
          const pp = project(c, q.x, q.y, q.z);
          sphere(ctx, pp[0], pp[1], (F * q.r) / d, ink);
        });
      },
    });
    return;
  }
  // rod-like bodies
  type Body = { axis: [number, number, number][]; R: number };
  const bodies: Body[] = [];
  const flags: [number, number, number][][] = [];
  let piliA = 0;
  if (b.kind === "bacillus") {
    if (b.divide) {
      // dividing: two daughter cells end to end, pinched at the waist
      const [dx, dz] = rot(0.6 * S, 0, a);
      bodies.push({ axis: rod3(X - dx, Z - dz, 0.45 * S, a + b.bend * 0.3, 1.18 * S, 0.02, 4), R: 0.45 * S });
      bodies.push({ axis: rod3(X + dx, Z + dz, 0.45 * S, a - b.bend * 0.3, 1.18 * S, 0.02, 4), R: 0.45 * S });
    } else bodies.push({ axis: rod3(X, Z, 0.45 * S, a, 2.3 * S, b.bend * 0.5, 6), R: 0.45 * S });
    if (b.pili && b.seed % 2 < 1 && s > 22 && s < 170) {
      // (a fine fringe at mid scale; under the lens the hairs would read as legs, so they fade out there)
      piliA = c01((s - 22) / 10) * c01((170 - s) / 50);
      // pili: a fringe of fine short hairs round the body
      for (let k = 0; k < 22; k++) {
        const u = (-1 + (2 * (k >> 1)) / 10) * 1.05 * S;
        const side = k % 2 === 0 ? 1 : -1;
        const l = (0.13 + 0.06 * Math.sin(k * 3.1 + b.seed)) * S;
        const p0 = rot(u, side * 0.44 * S, a);
        const p1 = rot(u + 0.08 * S * Math.sin(k + b.seed), side * (0.44 * S + l), a);
        flags.push([
          [X + p0[0], 0.3 * S, Z + p0[1]],
          [X + p1[0], 0.12 * S, Z + p1[1]],
        ]);
      }
    }
  }
  else if (b.kind === "chainrod") {
    for (let i = 0; i < b.n; i++) {
      const off = (i - (b.n - 1) / 2) * 2.05 * S;
      const kink = 0.12 * Math.sin(i * 2.3 + b.seed);
      const [dx, dz] = rot(off, 0, a);
      bodies.push({ axis: rod3(X + dx, Z + dz, 0.4 * S, a + kink, 1.85 * S, b.bend * 0.25, 5), R: 0.4 * S });
    }
  } else if (b.kind === "flagrod") {
    bodies.push({ axis: rod3(X, Z, 0.4 * S, a, 2.0 * S, 0.0, 5), R: 0.4 * S });
    if (s > 4) {
      for (let k = 0; k < b.n; k++) {
        // peritrichous: from points along the body, trailing back with a wave
        const u0 = (-0.8 + (1.6 * k) / (b.n - 1)) * S;
        const side = k % 2 === 0 ? 1 : -1;
        const pts: [number, number, number][] = [];
        for (let i = 0; i <= 14; i++) {
          const t = i / 14;
          const along = u0 - t * 3.2 * S;
          const lat = side * (0.4 * S + t * 1.2 * S) + 0.28 * S * Math.sin(t * 9 - g * 9 + k + b.seed);
          const [dx, dz] = rot(along, lat, a);
          pts.push([X + dx, 0.06, Z + dz]);
        }
        flags.push(pts);
      }
    }
  } else if (b.kind === "vibrio") {
    bodies.push({ axis: rod3(X, Z, 0.3 * S, a, 1.8 * S, 0.32 * S, 7), R: 0.3 * S });
    if (s > 4) {
      const pts: [number, number, number][] = [];
      for (let i = 0; i <= 14; i++) {
        const t = i / 14;
        const along = 0.9 * S + t * 2.6 * S;
        const lat = 0.2 * S * Math.sin(t * 8 - g * 10 + b.seed) * t;
        const [dx, dz] = rot(along, lat, a);
        pts.push([X + dx, 0.12 + 0.15 * t, Z + dz]);
      }
      flags.push(pts);
    }
  } else if (b.kind === "spiro") {
    // a corkscrew lying on the ground along a gentle curve, its coil turning (the wave runs along it)
    const L = 7.5 * S;
    const hr = 0.3 * S;
    const R = 0.15 * S;
    const axis: [number, number, number][] = [];
    const N = Math.max(16, Math.min(90, Math.round(L * s * 0.25)));
    for (let i = 0; i <= N; i++) {
      const u = -L / 2 + (L * i) / N;
      const ph = (u / (0.95 * S)) * Math.PI * 2 - g * 5 + b.seed;
      const bend = 0.6 * Math.sin(u * 0.35 + b.seed);
      const [dx, dz] = rot(u, bend + hr * Math.cos(ph), a);
      axis.push([X + dx, hr + R + hr * Math.sin(ph), Z + dz]);
    }
    bodies.push({ axis, R });
  }
  shadows.push({
    D,
    draw: (ctx) => {
      bodies.forEach((bd) => {
        const pts = prLine(bd.axis, 0, shOff[0], shOff[1]);
        if (pts.length < 2) return;
        ctx.lineWidth = Math.max(0.8, (F * bd.R * 2.1) / D);
        ctx.lineCap = "round";
        poly(ctx, pts);
        ctx.stroke();
      });
    },
  });
  items.push({
    D,
    draw: (ctx) => {
      flags.forEach((fl) => flag(ctx, prLine(fl, -1), b.kind === "bacillus" ? Math.min(1.2, Math.max(0.6, (F * 0.02) / D)) : Math.max(0.6, (F * 0.045) / D), ink, b.kind === "bacillus" ? piliA : c01((s - 4) / 4)));
      bodies.forEach((bd) =>
        tube(
          ctx,
          prLine(bd.axis, -1),
          (F * bd.R * 2) / D,
          ink,
        ),
      );
    },
  });
};

const addSwimmer = (sw: Swimmer, c: Cam3, f: number, items: Item[], shadows: Sh[], tone: number) => {
  const [X, Z] = swimPos(sw, f);
  const D = Z - c.z;
  if (D < 1.2) return;
  const s = F / D;
  const p = project(c, X, sw.y, Z);
  if (p[0] < -6 * s || p[0] > 1080 + 6 * s || p[1] < -6 * s || p[1] > 1920 + 6 * s) return;
  const g = f / FPS;
  const ink = inkAt(tone * toneAt(D));
  const S = sw.size;
  const a = sw.ang;
  const pitch = 0.12 * Math.sin(g * 0.8 + sw.seed);
  const pr = (u: number, lat: number, up: number): Pt => {
    const [dx, dz] = rot(u, lat, a);
    const q = project(c, X + dx, sw.y + up + u * pitch, Z + dz);
    return [q[0], q[1]];
  };
  const L = sw.kind === "flagrod" ? 2.0 * S : 1.8 * S;
  const R = sw.kind === "flagrod" ? 0.38 * S : 0.29 * S;
  const bow = sw.kind === "vibrio" ? 0.32 * S : 0;
  const axis: Pt[] = [];
  for (let i = 0; i <= 7; i++) {
    const u = -L / 2 + (L * i) / 7;
    const q = (2 * u) / L;
    axis.push(pr(u, bow * (1 - q * q), 0));
  }
  const flags: Pt[][] = [];
  if (s > 5) {
    const nf = sw.kind === "flagrod" ? sw.n : 1;
    for (let k = 0; k < nf; k++) {
      const pts: Pt[] = [];
      const lat0 = sw.kind === "flagrod" ? ((k / Math.max(1, nf - 1)) * 2 - 1) * 0.3 * S : 0;
      for (let i = 0; i <= 14; i++) {
        const t = i / 14;
        const u = -L / 2 - t * 3.0 * S;
        const lat = lat0 * (1 + t) + 0.3 * S * t * Math.sin(t * 9 - g * 11 + k * 0.8 + sw.seed);
        const up = 0.25 * S * t * Math.cos(t * 9 - g * 11 + k * 0.8 + sw.seed);
        pts.push(pr(u, lat, up));
      }
      flags.push(pts);
    }
  }
  // its shadow, soft and below, weaker the higher it swims
  shadows.push({
    D,
    draw: (ctx) => {
      const pts: Pt[] = [];
      for (let i = 0; i <= 6; i++) {
        const u = -L / 2 + (L * i) / 6;
        const [dx, dz] = rot(u, 0, a);
        const q = project(c, X + dx + 0.25 * sw.y, 0, Z + dz - 0.2 * sw.y);
        pts.push([q[0], q[1]]);
      }
      const ga = ctx.globalAlpha;
      ctx.globalAlpha = ga * Math.max(0.15, 0.6 - sw.y * 0.13);
      ctx.lineWidth = Math.max(1, (F * R * 2.6) / D);
      ctx.lineCap = "round";
      poly(ctx, pts);
      ctx.stroke();
      ctx.globalAlpha = ga;
    },
  });
  items.push({
    D,
    draw: (ctx) => {
      flags.forEach((fl) => flag(ctx, fl, Math.max(0.6, (F * 0.045) / D), ink, c01((s - 4) / 4)));
      tube(ctx, axis, (F * R * 2) / D, ink);
    },
  });
};

// ---------------------------------------------------------------------------
// THE GROUND PLANE: tone bands from near to far, fine fibres running to the VP, moist flecks, the haze at the horizon
// ---------------------------------------------------------------------------
const FLECKS: [number, number, number][] = (() => {
  const out: [number, number, number][] = [];
  let s = 99;
  const rnd = () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
  for (let i = 0; i < 2600; i++) {
    const Z = -34 + Math.pow(rnd(), 1.8) * 300;
    const half = 0.42 * (Z + 36) + 8;
    out.push([(rnd() * 2 - 1) * half, Z, 0.5 + rnd()]);
  }
  return out;
})();
const drawGround = (ctx: CanvasRenderingContext2D, c: Cam3) => {
  const zNear = c.z + 0.35;
  const hs = c.hs;
  // the haze just above the horizon (a breath of the far ground's light)
  const hz = ctx.createLinearGradient(0, hs - 240, 0, hs + 4);
  hz.addColorStop(0, "rgba(233,221,191,0)");
  hz.addColorStop(1, "rgba(233,221,191,0.05)");
  ctx.fillStyle = hz;
  ctx.fillRect(0, Math.max(0, hs - 240), 1080, 244);
  // tone bands (flat steps, engraved, not airbrushed)
  const fade = (D: number) => 1 / (1 + Math.pow(D / 70, 1.5));
  const NB = 26;
  for (let i = 0; i < NB; i++) {
    const za = zNear + Math.pow(i / NB, 2.2) * 700;
    const zb = zNear + Math.pow((i + 1) / NB, 2.2) * 700;
    const ya = Math.min(1920, project(c, 0, 0, za)[1]);
    const yb = project(c, 0, 0, zb)[1];
    if (ya <= yb) continue;
    ctx.fillStyle = LAND_RIM;
    ctx.globalAlpha = 0.34 * fade((za + zb) / 2 - c.z);
    ctx.fillRect(0, yb, 1080, ya - yb + 0.6);
  }
  ctx.globalAlpha = 1;
  // fibres: wavering lines along Z, converging to the VP, thinning and fading with depth
  const chunks = [0, 4, 10, 22, 45, 90, 180, 400];
  ctx.lineCap = "round";
  ctx.strokeStyle = DARK;
  for (let k = 0; k < chunks.length - 1; k++) {
    const za = Math.max(zNear, c.z + chunks[k] + 0.35);
    const zb = c.z + chunks[k + 1] + 0.35;
    if (zb <= za) continue;
    const Dm = (za + zb) / 2 - c.z;
    const half = 0.4 * (zb - c.z) + 4;
    ctx.globalAlpha = 0.22 * fade(Dm);
    ctx.lineWidth = Math.max(0.5, Math.min(2.2, (F * 0.05) / Dm));
    ctx.beginPath();
    const step = 1.9;
    for (let X = Math.floor((c.x - half) / step) * step; X <= c.x + half; X += step) {
      const n = Math.round(X / step);
      for (let i = 0; i <= 6; i++) {
        const Z = za + ((zb - za) * i) / 6;
        const x = X + 0.32 * Math.sin(Z * 0.33 + n * 1.7) + 0.18 * Math.sin(Z * 0.9 + n * 0.6);
        const q = project(c, x, 0, Z);
        if (i === 0) ctx.moveTo(q[0], q[1]);
        else ctx.lineTo(q[0], q[1]);
      }
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // moist flecks: little elongated glints lying on the surface
  ctx.fillStyle = INK;
  FLECKS.forEach(([X, Z, w]) => {
    const D = Z - c.z;
    if (D < 0.6) return;
    const q = project(c, X, 0, Z);
    if (q[0] < -40 || q[0] > 1120 || q[1] > 1940 || q[1] < hs) return;
    const rx = (F * 0.16 * w) / D;
    const ry = Math.max(0.3, ((F * c.h) / (D - 0.05) - (F * c.h) / (D + 0.05)) * w);
    ctx.globalAlpha = 0.09 * fade(D);
    ctx.beginPath();
    ctx.ellipse(q[0], q[1], Math.max(0.5, rx), ry, 0, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
};

// ---------------------------------------------------------------------------
// THE TB ROD
// ---------------------------------------------------------------------------
const rodItems = (c: Cam3, f: number, items: Item[], shadows: Sh[]) => {
  const ax = rodAxis(14);
  const D = 0 - c.z;
  const g = f / FPS;
  void g;
  shadows.push({
    D,
    draw: (ctx) => {
      const pts = ax.map((q) => project(c, q[0] + 0.14, 0, q[2] - 0.12)).map((q) => [q[0], q[1]] as Pt);
      ctx.lineWidth = (F * ROD.R * 2.2) / D;
      ctx.lineCap = "round";
      poly(ctx, pts);
      ctx.stroke();
    },
  });
  items.push({
    D,
    draw: (ctx) => {
      const pts = ax.map((q) => project(c, q[0], q[1], q[2])).map((q) => [q[0], q[1]] as Pt);
      tbRod(ctx, pts, (F * ROD.R * 2) / D);
    },
  });
};

// ---------------------------------------------------------------------------
// THE MACROPHAGE: one translucent volume, drawn as the heightfield of its field (heightOf): quads painted far to near,
// each a flat tone from its slope under the one light (upper left, in front), so the dome is lit upper left and turns
// away lower right in engraved steps. Two passes: the whole cell faint (the thin ruffled skirt, the lamellipodium) and
// the body (above the skirt) denser; each clipped below by its own contour (smooth edges, the dome free above). Inside:
// granules, vacuoles and the kidney-shaped nucleus, then the rod seen through the upper membrane. Then contour hatching
// on the shade side, the body's dark outline (a dilated ring) and the skirt's membrane line.
// ---------------------------------------------------------------------------
const CELL_TONES = (() => {
  const out: string[] = [];
  const N = 26;
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    out.push(t < 0.5 ? mixC("#8A7C5F", "#D4C7A8", t * 2) : mixC("#D4C7A8", "#F6EFDC", (t - 0.5) * 2));
  }
  return out;
})();
const NUC = "#6F6249";
// the arms are the cell's own membrane: a light membrane line, no hard casing, no sheen
const ARM_INK: InkSet = { out: "#F1E8D0", shade: "#B9AB8B", deep: "#D3C7AA", main: "#E9DFC6", spec: "#FBF5E6", specA: 0 };
const MEMB = "#F1E8D0";
const L3 = (() => {
  const v = [-0.55, 0.72, -0.42];
  const n = Math.hypot(v[0], v[1], v[2]);
  return v.map((q) => q / n);
})();
const layers: HTMLCanvasElement[] = [];
const layer = (i: number) => {
  while (layers.length <= i) {
    const cv = document.createElement("canvas");
    cv.width = 1080;
    cv.height = 1920;
    layers.push(cv);
  }
  const cv = layers[i];
  const lc = cv.getContext("2d") as CanvasRenderingContext2D;
  lc.setTransform(1, 0, 0, 1, 0, 0);
  lc.globalAlpha = 1;
  lc.globalCompositeOperation = "source-over";
  lc.clearRect(0, 0, 1080, 1920);
  return { cv, lc };
};
const cellItems = (c: Cam3, f: number, items: Item[], shadows: Sh[], rodD: number, inner: (ctx: CanvasRenderingContext2D) => void) => {
  if (f < 128) return;
  const cf = cellField(f);
  const grid = cellGrid(cf);
  const loops = cellContours(cf, grid);
  const D = cf.cz - c.z;
  const proj = (lp: [number, number][], y: number): Pt[] =>
    lp.map(([x, z]) => {
      const q = project(c, x, y, z);
      return [q[0], q[1]];
    });
  const sl = loops.map((ls, i) => ls.map((lp) => proj(lp, LEVELS[i].y)));
  if (!sl[0].length) return;
  let bx0 = Infinity;
  let bx1 = -Infinity;
  sl[0].forEach((pts) =>
    pts.forEach((q) => {
      bx0 = Math.min(bx0, q[0]);
      bx1 = Math.max(bx1, q[0]);
    }),
  );
  if (bx0 > 1100 || bx1 < -20) return;
  const px = F / D; // px per unit at the cell
  shadows.push({
    D,
    draw: (ctx) => {
      const ga = ctx.globalAlpha;
      ctx.globalAlpha = ga * 0.22;
      (loops[1].length ? loops[1] : loops[0]).forEach((lp) => {
        poly(ctx, proj(lp.map(([x, z]) => [x + 0.45, z - 0.35] as [number, number]), 0));
        ctx.closePath();
        ctx.fill();
      });
      ctx.globalAlpha = ga;
    },
  });
  const path = (ctx: CanvasRenderingContext2D, lps: Pt[][]) => {
    ctx.beginPath();
    lps.forEach((pts) => {
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.closePath();
    });
  };
  const g = f / FPS;
  items.push({
    D: Math.min(D, rodD - 0.01),
    draw: (ctx) => {
      // the heightfield, projected
      const { x0, z0, nx, nz, step, val } = grid;
      const H = new Float32Array(nx * nz);
      for (let k = 0; k < H.length; k++) H[k] = heightOf(val[k]);
      const SX = new Float32Array(nx * nz);
      const SY = new Float32Array(nx * nz);
      for (let j = 0; j < nz; j++)
        for (let i = 0; i < nx; i++) {
          const k = j * nx + i;
          const q = project(c, x0 + i * step, H[k], z0 + j * step);
          SX[k] = q[0];
          SY[k] = q[1];
        }
      // the slope of each quad from a wide stencil (smooth form, no per-quad flicker), toned under the light
      // the shading reads a blurred height (the ruffle shapes the edge, not the light)
      const Hb = new Float32Array(nx * nz);
      const tmp = new Float32Array(nx * nz);
      const RB = 6;
      for (let j = 0; j < nz; j++)
        for (let i = 0; i < nx; i++) {
          let a = 0;
          for (let k = -RB; k <= RB; k++) a += H[j * nx + Math.max(0, Math.min(nx - 1, i + k))];
          tmp[j * nx + i] = a / (2 * RB + 1);
        }
      for (let j = 0; j < nz; j++)
        for (let i = 0; i < nx; i++) {
          let a = 0;
          for (let k = -RB; k <= RB; k++) a += tmp[Math.max(0, Math.min(nz - 1, j + k)) * nx + i];
          Hb[j * nx + i] = a / (2 * RB + 1);
        }
      const vv = [c.x - cf.cx, c.h - 2, c.z - cf.cz];
      const vn = Math.hypot(vv[0], vv[1], vv[2]);
      const VV = vv.map((q) => q / vn);
      const Hc = (i: number, j: number) => Hb[Math.max(0, Math.min(nz - 1, j)) * nx + Math.max(0, Math.min(nx - 1, i))];
      const toneOf = (i: number, j: number) => {
        const dHdx = (Hc(i + 3, j) + Hc(i + 3, j + 1) - Hc(i - 2, j) - Hc(i - 2, j + 1)) / (10 * step);
        const dHdz = (Hc(i, j + 3) + Hc(i + 1, j + 3) - Hc(i, j - 2) - Hc(i + 1, j - 2)) / (10 * step);
        const nl = Math.hypot(dHdx, 1, dHdz);
        const lam = Math.max(0, (-dHdx * L3[0] + L3[1] - dHdz * L3[2]) / nl);
        // the rim: where the membrane curves away from the eye it darkens
        const ndv = Math.max(0, (-dHdx * VV[0] + VV[1] - dHdz * VV[2]) / nl);
        const t = Math.pow(lam, 1.4) * (1 - 0.62 * Math.pow(1 - ndv, 1.6));
        return CELL_TONES[Math.max(0, Math.min(CELL_TONES.length - 1, Math.floor(t * CELL_TONES.length)))];
      };
      const paint = (lc: CanvasRenderingContext2D, iso: number) => {
        lc.lineJoin = "round";
        lc.lineWidth = 1.1;
        const hIso = heightOf(iso + 1e-6);
        const corner = (k: number, gi: number, gj: number) => ({ v: val[k], sx: SX[k], sy: SY[k], gi, gj });
        for (let j = nz - 2; j >= 0; j--)
          for (let i = 0; i < nx - 1; i++) {
            const a = j * nx + i;
            const b = a + 1;
            const cc = a + nx + 1;
            const d = a + nx;
            const vmax = Math.max(val[a], val[b], val[cc], val[d]);
            if (vmax < iso) continue;
            const tone = toneOf(i, j);
            lc.beginPath();
            const vmin = Math.min(val[a], val[b], val[cc], val[d]);
            if (vmin >= iso) {
              lc.moveTo(SX[a], SY[a]);
              lc.lineTo(SX[b], SY[b]);
              lc.lineTo(SX[cc], SY[cc]);
              lc.lineTo(SX[d], SY[d]);
            } else {
              // the quad clipped to the inside of the iso line (linear along each edge): a smooth boundary
              const cs = [corner(a, i, j), corner(b, i + 1, j), corner(cc, i + 1, j + 1), corner(d, i, j + 1)];
              let first = true;
              for (let e = 0; e < 4; e++) {
                const p0 = cs[e];
                const p1 = cs[(e + 1) % 4];
                if (p0.v >= iso) {
                  if (first) lc.moveTo(p0.sx, p0.sy);
                  else lc.lineTo(p0.sx, p0.sy);
                  first = false;
                }
                if (p0.v >= iso !== p1.v >= iso) {
                  const t = (iso - p0.v) / (p1.v - p0.v);
                  const q = project(c, x0 + (p0.gi + (p1.gi - p0.gi) * t) * step, hIso, z0 + (p0.gj + (p1.gj - p0.gj) * t) * step);
                  if (first) lc.moveTo(q[0], q[1]);
                  else lc.lineTo(q[0], q[1]);
                  first = false;
                }
              }
            }
            lc.closePath();
            lc.fillStyle = tone;
            lc.strokeStyle = tone;
            lc.fill();
            lc.stroke();
          }
      };
      // 1. the whole cell, faint (the skirt reads as a thin sheet)
      const sk = layer(1);
      paint(sk.lc, 0.45);
      ctx.globalAlpha = 0.38;
      ctx.drawImage(sk.cv, 0, 0);
      // the skirt's membrane line (dark casing, cream line), under the body; its far side, seen through the body,
      // only faintly (it would read as a crease across the cell)
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      const runs = (far: boolean) => {
        ctx.beginPath();
        loops[0].forEach((lp, li) => {
          const pts = sl[0][li];
          let pen = false;
          for (let k = 0; k <= lp.length; k++) {
            const kk = k % lp.length;
            const isFar = lp[kk][1] > cf.cz + 0.8;
            if (isFar === far) {
              if (!pen) ctx.moveTo(pts[kk][0], pts[kk][1]);
              else ctx.lineTo(pts[kk][0], pts[kk][1]);
              pen = true;
            } else pen = false;
          }
        });
      };
      [false, true].forEach((far) => {
        runs(far);
        ctx.strokeStyle = DARK;
        ctx.globalAlpha = far ? 0.15 : 0.5;
        ctx.lineWidth = Math.max(1.6, px * 0.1);
        ctx.stroke();
        ctx.strokeStyle = MEMB;
        ctx.globalAlpha = far ? 0.3 : 0.85;
        ctx.lineWidth = Math.max(0.9, px * 0.045);
        ctx.stroke();
      });
      ctx.globalAlpha = 1;
      // the frills of the lamellipodium: fold lines along the leading (left) edge, rippling with it; laid down whole
      // on a layer and faded out toward the sides and back by a mask (no line ends popping as the ruffle moves)
      {
        const fl = layer(7);
        [2, 3].forEach((li) => {
          path(fl.lc, sl[li]);
          fl.lc.lineJoin = "round";
          fl.lc.strokeStyle = DARK;
          fl.lc.globalAlpha = 0.25;
          fl.lc.lineWidth = Math.max(1.4, px * 0.07);
          fl.lc.stroke();
          fl.lc.strokeStyle = MEMB;
          fl.lc.globalAlpha = 0.55;
          fl.lc.lineWidth = Math.max(0.8, px * 0.032);
          fl.lc.stroke();
        });
        fl.lc.globalAlpha = 1;
        fl.lc.globalCompositeOperation = "destination-in";
        const xa = project(c, cf.cx - 4.6, 0, cf.cz)[0];
        const xb = project(c, cf.cx - 1.6, 0, cf.cz)[0];
        const gx = fl.lc.createLinearGradient(xa, 0, xb, 0);
        gx.addColorStop(0, "rgba(0,0,0,1)");
        gx.addColorStop(1, "rgba(0,0,0,0)");
        fl.lc.fillStyle = gx;
        fl.lc.fillRect(0, 0, 1080, 1920);
        const ya = project(c, cf.cx, 0, cf.cz + 1.2)[1];
        const yb = project(c, cf.cx, 0, cf.cz + 3.6)[1];
        const gy = fl.lc.createLinearGradient(0, ya, 0, yb);
        gy.addColorStop(0, "rgba(0,0,0,1)");
        gy.addColorStop(1, "rgba(0,0,0,0)");
        fl.lc.fillStyle = gy;
        fl.lc.fillRect(0, 0, 1080, 1920);
        ctx.drawImage(fl.cv, 0, 0);
      }
      // the pseudopods reaching out along the ground (membrane fingers, tapering), their roots under the body
      pseudopods(f).forEach((pp3) => {
        const pts = pp3.map(([x, z]) => {
          const q = project(c, x, 0.3, z);
          return [q[0], q[1]] as Pt;
        });
        const pl = layer(5);
        const w0 = (F * 0.42 * 2) / D;
        const n = pts.length;
        const k1 = Math.floor(n * 0.5);
        const k2 = Math.floor(n * 0.78);
        waxTube(pl.lc, pts.slice(0, k1 + 1), w0, ARM_INK);
        waxTube(pl.lc, pts.slice(k1, k2 + 1), w0 * 0.72, ARM_INK);
        waxTube(pl.lc, pts.slice(k2), w0 * 0.45, ARM_INK);
        ctx.globalAlpha = 0.55;
        ctx.drawImage(pl.cv, 0, 0);
        ctx.globalAlpha = 1;
      });
      let nuc: HTMLCanvasElement | null = null;
      // the nucleus: a soft darker kidney-shaped mass low in the cell, off-centre toward the back left, seen THROUGH
      // the body (laid down before it, edges softened, no rim line: nothing reads as an opening)
      {
        const nx2 = cf.cx - 0.6;
        const nz2 = cf.cz + 1.3;
        const NY = 1.0;
        const nl = layer(6);
        const npts: Pt[] = [];
        for (let k = 0; k < 64; k++) {
          const t = (k / 64) * Math.PI * 2;
          const dent = 0.38 * Math.pow(Math.max(0, Math.cos(t + 1.75)), 5);
          const r2 = 1 - dent + 0.025 * Math.sin(t * 4 + g * 0.8);
          const q = project(c, nx2 + Math.cos(t) * 2.4 * r2, NY, nz2 + Math.sin(t) * 2.5 * r2);
          npts.push([q[0], q[1]]);
        }
        path(nl.lc, [npts]);
        nl.lc.fillStyle = NUC;
        nl.lc.fill();
        // chromatin texture inside it
        nl.lc.save();
        nl.lc.clip();
        for (let k = 0; k < 46; k++) {
          const t = k * 2.39996;
          const r2 = Math.sqrt((k + 0.5) / 46) * 1.9;
          const q = project(c, nx2 + Math.cos(t) * r2 * 1.15, NY, nz2 + Math.sin(t) * r2 * 1.2);
          nl.lc.beginPath();
          nl.lc.arc(q[0], q[1], Math.max(0.7, px * (0.07 + 0.04 * ((k * 7) % 3))), 0, Math.PI * 2);
          nl.lc.fillStyle = DARK;
          nl.lc.globalAlpha = 0.4;
          nl.lc.fill();
        }
        nl.lc.restore();
        nuc = nl.cv;
      }
      // 2. the body, denser
      const body = layer(2);
      paint(body.lc, 0.8);
      ctx.globalAlpha = 0.6;
      ctx.drawImage(body.cv, 0, 0);
      ctx.globalAlpha = 1;
      // the nucleus through the body: veiled, its edge soft (no rim line)
      if (nuc) {
        ctx.save();
        ctx.filter = `blur(${Math.max(1.2, px * 0.06).toFixed(1)}px)`;
        ctx.globalAlpha = 0.55;
        ctx.drawImage(nuc, 0, 0);
        ctx.restore();
      }
      // 3. inside: granules and vacuoles, the nucleus
      GRANULES.forEach((q, k) => {
        const X = cf.cx + q.dx + 0.12 * Math.sin(g * 0.7 + k);
        const Z = cf.cz + q.dz + 0.1 * Math.cos(g * 0.6 + k * 1.3);
        const pp = project(c, X, q.y, Z);
        const r = (F * q.r) / (Z - c.z);
        ctx.beginPath();
        ctx.arc(pp[0], pp[1], Math.max(0.6, r), 0, Math.PI * 2);
        if (q.vac) {
          ctx.strokeStyle = "#8F8062";
          ctx.lineWidth = Math.max(0.7, r * 0.3);
          ctx.globalAlpha = 0.65;
          ctx.stroke();
        } else {
          ctx.fillStyle = NUC;
          ctx.globalAlpha = 0.5;
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      });
      // 4. the arms round the rod (far arm, then the rod seen inside, then the near arm in front of it)
      const e = armExt(f);
      const solid = armSolid(f);
      const arm = (side: 1 | -1) => {
        if (e < 0.02 || solid < 0.01) return;
        const path3 = armPath(side, ARM.off, e);
        const pts = path3.map(([x, z]) => {
          const q = project(c, x, ARM.R * 0.9, z);
          return [q[0], q[1]] as Pt;
        });
        const al = layer(5);
        const w = (F * ARM.R * 2) / rodD;
        const n = pts.length;
        const k1 = Math.floor(n * 0.62);
        const k2 = Math.floor(n * 0.84);
        waxTube(al.lc, pts.slice(0, k1 + 1), w, ARM_INK);
        waxTube(al.lc, pts.slice(k1, k2 + 1), w * 0.8, ARM_INK);
        waxTube(al.lc, pts.slice(k2), w * 0.58, ARM_INK);
        ctx.globalAlpha = 0.6 * solid;
        ctx.drawImage(al.cv, 0, 0);
        ctx.globalAlpha = 1;
      };
      // the far arm is the one on the far side of the rod (larger Z): side +1 in rod frame points to +Z
      arm(1);
      inner(ctx);
      arm(-1);
      // the pocket it now lies in (the phagosome): the closed arms' inner membrane, a faint loop round the rod
      const cl = closing(f);
      if (cl > 0.01) {
        const loop: Pt[] = [];
        for (let k = 0; k <= 40; k++) {
          const t = (k / 40) * Math.PI * 2;
          const u = Math.cos(t) * (ROD.L / 2 + 0.55);
          const v = Math.sin(t) * 0.62 + ROD.bow * (1 - Math.min(1, ((2 * u) / ROD.L) ** 2));
          const [x, z] = fromRodFrame(u, v);
          const q = project(c, x, 0.3, z);
          loop.push([q[0], q[1]]);
        }
        path(ctx, [loop]);
        ctx.fillStyle = "#FBF5E6";
        ctx.globalAlpha = 0.12 * cl;
        ctx.fill();
        ctx.globalAlpha = 1;
        strokePoly(ctx, loop, Math.max(1, px * 0.05), MEMB, 0, 0, 0.55 * cl);
      }
      // 5. the body's dark outline: its layer dilated, darkened, its interior removed
      {
        const ol = layer(3);
        const r = Math.max(1.6, px * 0.09);
        for (let k = 0; k < 8; k++) ol.lc.drawImage(body.cv, Math.cos((k * Math.PI) / 4) * r, Math.sin((k * Math.PI) / 4) * r);
        ol.lc.globalCompositeOperation = "source-in";
        ol.lc.fillStyle = DARK;
        ol.lc.fillRect(0, 0, 1080, 1920);
        ol.lc.globalCompositeOperation = "destination-out";
        ol.lc.drawImage(body.cv, 0, 0);
        ctx.globalAlpha = 0.45;
        ctx.drawImage(ol.cv, 0, 0);
        ctx.globalAlpha = 1;
      }
    },
  });
};

// ---------------------------------------------------------------------------
// THE FRAME
// ---------------------------------------------------------------------------
let SHADOW: HTMLCanvasElement | null = null;
let RODL: HTMLCanvasElement | null = null;
const rodLayer = () => {
  if (!RODL) {
    RODL = document.createElement("canvas");
    RODL.width = 1080;
    RODL.height = 1920;
  }
  return RODL;
};
const shadowLayer = () => {
  if (!SHADOW) {
    SHADOW = document.createElement("canvas");
    SHADOW.width = 1080;
    SHADOW.height = 1920;
  }
  return SHADOW;
};
export const drawFrame = (ctx: CanvasRenderingContext2D, f: number) => {
  const c = camAt(f);
  drawGround(ctx, c);
  const items: Item[] = [];
  const shadows: Sh[] = [];
  const tone = recedeAt(f);
  FIELD.forEach((b) => addBug(b, c, f, items, shadows, tone));
  SWIMMERS.forEach((s) => addSwimmer(s, c, f, items, shadows, tone));
  const rodD = 0 - c.z;
  rodItems(c, f, items, shadows);
  const rodInside = (ctx: CanvasRenderingContext2D) => {
    // the whole rod laid down on its own layer, then seen through the upper membrane at one alpha
    const R = rodLayer();
    const rc = R.getContext("2d") as CanvasRenderingContext2D;
    rc.setTransform(1, 0, 0, 1, 0, 0);
    rc.clearRect(0, 0, 1080, 1920);
    const pts = rodAxis(14)
      .map((q) => project(c, q[0], q[1], q[2]))
      .map((q) => [q[0], q[1]] as Pt);
    tbRod(rc, pts, (F * ROD.R * 2) / rodD);
    ctx.save();
    ctx.globalAlpha = 0.62;
    ctx.drawImage(R, 0, 0);
    ctx.restore();
  };
  cellItems(c, f, items, shadows, rodD, rodInside);
  // shadows: one layer, softened, laid on the ground before any volume
  const L = shadowLayer();
  const lc = L.getContext("2d") as CanvasRenderingContext2D;
  lc.setTransform(1, 0, 0, 1, 0, 0);
  lc.clearRect(0, 0, 1080, 1920);
  lc.fillStyle = DARK;
  lc.strokeStyle = DARK;
  shadows.forEach((s) => {
    lc.globalAlpha = Math.min(1, 0.75 * (0.35 + 0.65 / (1 + s.D / 60)));
    s.draw(lc);
  });
  lc.globalAlpha = 1;
  ctx.save();
  ctx.filter = `blur(${(4 * (c.h < 3 ? 1.3 : 1)).toFixed(1)}px)`;
  ctx.globalAlpha = 0.62;
  ctx.drawImage(L, 0, 0);
  ctx.restore();
  // the volumes, far to near
  items.sort((a, b) => b.D - a.D);
  items.forEach((it) => it.draw(ctx));
  // the near ground sinks into shade toward the frame's bottom (quiet under the captions)
  const bs = ctx.createLinearGradient(0, 990, 0, 1920);
  bs.addColorStop(0, "rgba(14,11,8,0)");
  bs.addColorStop(0.45, "rgba(14,11,8,0.36)");
  bs.addColorStop(1, "rgba(14,11,8,0.62)");
  ctx.fillStyle = bs;
  ctx.fillRect(0, 990, 1080, 930);
};

const STILL_CAM = { k: 1, cx: 540, cy: 960 };
const HugeWorldOfBacteria: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  return (
    <TexcocoPage cam={STILL_CAM}>
      <SpriteCanvas draw={(ctx) => drawFrame(ctx, frame)} />
    </TexcocoPage>
  );
};

export default HugeWorldOfBacteria;
