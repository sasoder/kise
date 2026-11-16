// ---------------------------------------------------------------------------
// TenfoldEveryYear (rsi-ten-earths, cut 89, REV 1). Dwarkesh 3D style (styles/dwarkesh-3d.md).
// Opaque 1080x1920, 23.976 fps, 156 frames. One stage inside the misty teal air (AirStage, palette A, interior mood);
// the cut's own world (floor grid, waves, entrances, camera) is the pure module ./tenfoldWorld.ts. The robot is the
// clip's shared tenEarthsBot (read-only): live <Bot> figures near, its baked front sprites and a bean LOD far.
//
// CHECK LINE: "One AI becomes ten, then a hundred, a thousand, ten thousand: tenfold every year, a sea of robots to the
//   horizon."
//
// THE LINE: "you should expect the population of AIs at a given level of capabilities to roughly increase tenfold
//   every year."
// WORD -> FRAME (from the composition start; Whisper may run ~0.2-0.4 s early): year, -9 · you -2 · should 0 ·
//   expect 2 · the 5 · population 15 · of 23 · AIs 32 · at 40 · a 45 · given 47 · level 52 · of 58 · capabilities 60 ·
//   to 68 · roughly 85 · increase 98 · tenfold 114 · every 132 · year. 143 · (So 155)
// DURATION: the slot 89.0890 -> 95.5955 s = 6.5065 s x 23.976 = 156 frames (f0..f155).
//
// THE MOTION: POWERS OF TEN on a raised data-center floor, under ONE continuous move, near steady in log space: the eye
//   backs off (0.85 -> 67 m from the hero) and rises (1.25 -> 30 m) and stays GRAZING (the view's centre 11 -> 20 deg
//   down, the horizon y 660 -> 594), with a slight orbit (yaw -9 -> +4.6 deg). f0: close and low on ONE robot (THE
//   Bot, v0; 399 px, eye level, breathing idle) on its floor tile. Every new robot comes up out of the floor: its tile is
//   the top of a lift, the hatch's two leaves slide apart, it rises on the lift into the light (the tile lands flush and
//   shuts the hatch) and it boots up (bootUp: the bulb lights, the eyes open, one blink, the smile). Each x10 is a FRONT
//   rippling outward from what is already there:
//     x10 (f13-f36, "population ... AIs"): 9 rise beside and behind it: a 5 x 2 of ten (226 px robots on "AIs");
//     x10 (f44-f78, "level of capabilities"): the 5 x 2 grows into the hero's 10 x 10 block of 100 (145 px on
//       "capabilities"); the ten and the hundred never spill past x 65..1015 (a hatch opens only once it fits);
//     x10 (f79-f107, "roughly increase"): from here on the field is environment: nine blocks rise around and IN FRONT of
//       the hundred (5 x 2 blocks: 1,000), their near rows big (100-200 px) below the hero's group, running off both
//       sides and back toward the haze;
//     x10 (f98-f127, "tenfold"): 90 more blocks (10 x 10 blocks: 10,000), two block rows nearer still, the front
//       sweeping toward us, off the sides and away to the horizon;
//     and on (f118-f149, "every year"): the ripple keeps going, every slot in sight, out to the horizon: the sea.
//   The far rows (closer than 4.5 px apart on screen) are a pre-filtered row texture, not sprites (no moire); the far
//   waves' hatches come in with their robots.
// CAUSE: a robot is never drawn before its hatch is open; it rises from under the floor (cropped at the hatch's near
//   edge); its contact shadow arrives as it lands; the boot starts on the frame its lift stops.
// Orange = THE AIs only (every robot); the floor warm grey (the hall's MAT_FLOOR), the hatches dark, the air teal.
//
// SOURCES: x10 per year = global AI compute ~x3 per year (Epoch AI, global AI computing capacity in H100-equivalents
//   ~3.3x/yr since 2022) x the compute needed for a given capability falling >3x per year (Epoch AI, algorithmic
//   progress in language models, Ho et al. 2024). The speaker: "roughly increase tenfold every year". No text on
//   screen; the counts 1 / 10 / 100 / 1,000 / 10,000 are illustrative powers of ten.
// ---------------------------------------------------------------------------
import React, { useMemo } from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { AIR, AirStage, c01, hexRgb, makeAirView, mixHex, mixRgb, paintHorizonHaze, type AirView, type RGB } from "../kits/dwarkesh-3d/dwarkesh3d";
import { sway } from "../kits/maps/incaShared";
import { MAT_FLOOR } from "./tenEarthsHall";
import { ACCENT, BOT_POSES, BOT_SCREEN, Bot, BotLayer, FolkCanvas, botCrowdReqs, drawBotDot, useBotSprites, type BotPose, type FolkFog, type Sprite } from "./tenEarthsBot";
import { AISLE, BOT_H, DEPTH, DURATION as DUR, FIELD, FIELD_BOTS, FPS as FPS_W, SEA, T, TILE, WAVES, aisleX, entryAt, eyeAt, risenR, seedOf, sst, t0Of, toScreen, variantOf, xOf, zOf, type Eye } from "./tenfoldWorld";

export const FPS = FPS_W;
export const DURATION = DUR;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const PAL = AIR.A;
const SHADOW_RGB = hexRgb(PAL.shadow);

// ===================================================================================================================
// THE VIEW: the eye, the house sway, the air
// ===================================================================================================================
export type View = {
  e: Eye;
  dx: number;
  dy: number;
  v: AirView;
  /** a world point on screen (sway included) */
  P: (X: number, Y: number, Z: number) => { x: number; y: number; s: number; d: number } | null;
  /** the eye's distance to its target (3D: the air thickens with the eye's height too) */
  Dt: number;
  /** the texture LOD's depth: beyond it a row of robots is closer than RP_TEX px to the next (they would beat into
   *  moire), so the robots fade out over dTex / LOD_BAND .. dTex and the far texture takes over */
  dTex: number;
  fog: (d: number) => number;
  air: (d: number, h?: number) => RGB;
  figFog: (d: number) => number;
};
const E0 = eyeAt(0);
/** the screen pitch (px) between rows of robots below which they go to the far texture */
const RP_TEX = 4.5;
/** the robots fade out (and the texture in) over dTex / LOD_BAND .. dTex */
const LOD_BAND = 1.3;
const moteCam = (e: Eye) => ({ x: 0, y: 4 * 178 * Math.log(e.He / E0.He), z: -4 * 178 * Math.log(e.F / e.S / (E0.F / E0.S)) });
export const viewAt = (f: number): View => {
  const e = eyeAt(f);
  const sw = sway(f);
  const Dt = Math.hypot(e.F / e.S, e.He);
  const scene = { look: "A" as const, mood: "interior" as const, F: e.F, fogNear: 0.8 * Dt, fogVis: 1.4 * Dt + 2500, fogMax: 0.9, hLow: 0, hHigh: 2300, moteUnit: 178, eyeT: 0.17 };
  const v = makeAirView({ scene, frame: f, horizon: e.Hy + sw.dy, cam: moteCam(e), rest: moteCam(E0) });
  const P = (X: number, Y: number, Z: number) => {
    const p = toScreen(e, X, Y, Z);
    return p ? { ...p, x: p.x + sw.dx, y: p.y + sw.dy } : null;
  };
  const near = 1.05 * Dt;
  const vis = 1.15 * Dt + 2500;
  const dTex = Math.sqrt((e.He * e.F * T) / RP_TEX);
  return { e, dx: sw.dx, dy: sw.dy, v, P, Dt, dTex, fog: (d) => c01(v.fogAt(d)), air: (d, h = 0) => v.airAt(d, h), figFog: (d) => 0.8 * (1 - Math.exp(-Math.max(0, d - near) / vis)) };
};

// ===================================================================================================================
// THE FLOOR: one tone by distance (screen rows), melting into the air toward the horizon, and the tile joints
// ===================================================================================================================
const FLOOR_LOCAL = mixHex(MAT_FLOOR.mid, MAT_FLOOR.dark, 0.18);
const JOINT = mixHex(MAT_FLOOR.dark, PAL.shadow, 0.45);
const floorMelt = (V: View, d: number) => Math.pow(sst(4 * V.Dt + 20000, 14 * V.Dt + 90000, d), 0.8);
const rgbStr = (c: RGB, a = 1) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a.toFixed(3)})`;
const toneRgb = (V: View, hex: string, d: number, h = 0) => mixRgb(hexRgb(hex), V.air(d, h), V.fog(d));
const drawFloor = (ctx: CanvasRenderingContext2D, V: View) => {
  const { e, v } = V;
  const hy = e.Hy + V.dy;
  const y0 = Math.max(0, Math.floor(hy));
  for (let y = y0; y < 1920; y += 3) {
    const ym = Math.max(hy + 0.5, y + 1.5);
    const d = (e.F * e.He) / (ym - hy);
    const c = mixRgb(toneRgb(V, FLOOR_LOCAL, d), v.airAtScreen(ym), floorMelt(V, d));
    ctx.fillStyle = rgbStr(c);
    ctx.fillRect(0, y, 1080, 3.6);
  }
  // the tile joints: lines along X (into depth) and across, each faded by its depth and by its screen spacing
  const bins = [0, 0.6, 1, 1.6, 2.6, 4.2, 7, 12, 20].map((m) => m * V.Dt);
  const dMin = (e.F * e.He) / (1960 - hy);
  const lw = (d: number) => Math.max(0.5, Math.min(2.2, (1.5 * e.F) / d));
  for (let b = 0; b < bins.length - 1; b++) {
    const da = Math.max(dMin, bins[b]);
    const db = bins[b + 1];
    if (db <= da) continue;
    const dm = (da + db) / 2;
    const spacing = (TILE * e.F) / dm;
    const rowSpacing = (e.He * e.F * TILE) / (dm * dm);
    const aX = 0.38 * (1 - V.fog(dm)) * (1 - floorMelt(V, dm)) * sst(2.5, 7, spacing);
    const aZ = 0.38 * (1 - V.fog(dm)) * (1 - floorMelt(V, dm)) * sst(2.5, 7, rowSpacing);
    if (aX < 0.01 && aZ < 0.01) continue;
    ctx.strokeStyle = rgbStr(toneRgb(V, JOINT, dm));
    ctx.lineWidth = lw(dm);
    // lines along Z (X = (i + 0.5) T) between depths da and db
    if (aX >= 0.01) {
      ctx.globalAlpha = aX;
      ctx.beginPath();
      const halfW = (620 * db) / e.F;
      const cx = e.Xe + db * e.sn;
      const i0 = Math.floor((cx - halfW / Math.max(0.5, e.cs)) / TILE) - 2;
      const i1 = Math.ceil((cx + halfW / Math.max(0.5, e.cs)) / TILE) + 2;
      for (let i = i0; i <= i1; i++) {
        const X = i * TILE;
        const Za = e.Ze + (da - (X - e.Xe) * e.sn) / e.cs;
        const Zb = e.Ze + (db - (X - e.Xe) * e.sn) / e.cs;
        const p = V.P(X, 0, Za);
        const q = V.P(X, 0, Zb);
        if (!p || !q) continue;
        if ((p.x < -50 && q.x < -50) || (p.x > 1130 && q.x > 1130)) continue;
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(q.x, q.y);
      }
      ctx.stroke();
    }
    // lines across (Z = (j + 0.5) T) whose depth at the screen centre lies in this bin
    if (aZ >= 0.01) {
      ctx.globalAlpha = aZ;
      ctx.beginPath();
      const j0 = Math.floor((e.Ze + da * e.cs) / TILE);
      const j1 = Math.ceil((e.Ze + db * e.cs) / TILE);
      for (let j = j0; j <= j1; j++) {
        const Z = j * TILE;
        const dz = (Z - e.Ze) / e.cs;
        if (dz < da || dz >= db) continue;
        const Xc = e.Xe + (Z - e.Ze) * (e.sn / e.cs);
        const half = (700 * dz) / e.F;
        const p = V.P(Xc - half, 0, Z);
        const q = V.P(Xc + half, 0, Z);
        if (!p || !q) continue;
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(q.x, q.y);
      }
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
  // the far floor's haze: a deep band under a low horizon; a short one while the view tips down (the floor reads as
  // floor, not as more sky)
  paintHorizonHaze(ctx, v, 110 + 120 * sst(350, 550, e.Hy), 1);
};

// ===================================================================================================================
// THE ROBOTS ON THE CANVAS (sprites near-mid, a bean LOD far, a texture for the farthest sea) and their hatches
// ===================================================================================================================
const SIZES = [12, 18, 26, 38, 56, 80, 112];
/** live SVG robots at and above LIVE_HI px (crossfading from the sprite over LIVE_LO..LIVE_HI): the hero, the ten,
 *  the hundred; the field's near rows (often hundreds of robots of 60-200 px) stay sprites until they are big */
const LIVE_LO = 96;
const LIVE_HI = 120;
const FOGGED = new Map<string, HTMLCanvasElement>();
const foggedOf = (key: string, src: HTMLCanvasElement, fog: FolkFog): HTMLCanvasElement => {
  const amt = Math.round(c01(fog.amount) * 24) / 24;
  if (amt <= 0) return src;
  const rgb = (typeof fog.rgb === "string" ? hexRgb(fog.rgb) : fog.rgb).map((c) => Math.round(c / 6) * 6);
  const k = `${key}|${amt}|${rgb.join(",")}`;
  const hit = FOGGED.get(k);
  if (hit) return hit;
  if (FOGGED.size > 4000) FOGGED.clear();
  const c = document.createElement("canvas");
  c.width = src.width;
  c.height = src.height;
  const g = c.getContext("2d") as CanvasRenderingContext2D;
  g.drawImage(src, 0, 0);
  g.globalCompositeOperation = "source-atop";
  g.fillStyle = `rgba(${rgb.join(",")},${amt})`;
  g.fillRect(0, 0, c.width, c.height);
  FOGGED.set(k, c);
  return c;
};
let SHADOW: HTMLCanvasElement | null = null;
const shadowSprite = () => {
  if (SHADOW) return SHADOW;
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 64;
  const g = c.getContext("2d") as CanvasRenderingContext2D;
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, rgbStr(SHADOW_RGB, 0.62));
  gr.addColorStop(0.6, rgbStr(SHADOW_RGB, 0.34));
  gr.addColorStop(1, rgbStr(SHADOW_RGB, 0));
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
  SHADOW = c;
  return c;
};

/** one robot to draw this frame */
export type Item = { X: number; Z: number; L: number; v: number; seed: number; t0: number; d: number; lod: number; x: number; yFloor: number; yFeet: number; yNear: number; s: number; h: number; open: number; rise: number; boot: number; u: number };
const HATCH = T / 2 - 7;
const itemOf = (V: View, f: number, X: number, Z: number, L: number, v: number, seed: number, t0: number): Item | null => {
  const en = entryAt(f, t0, L);
  if (L > 0 && en.u <= 0) return null;
  const p = V.P(X, 0, Z);
  if (!p) return null;
  if (p.d >= V.dTex) return null;
  const below = (1 - en.rise) * DEPTH;
  const near = V.P(X, 0, Z - HATCH);
  return { X, Z, L, v, seed, t0, d: p.d, lod: 1 - sst(V.dTex / LOD_BAND, V.dTex, p.d), x: p.x, yFloor: p.y, yFeet: p.y + below * p.s, yNear: near ? near.y : p.y + HATCH * p.s, s: p.s, h: BOT_H * p.s, open: L === 0 ? 1 : en.open, rise: L === 0 ? 1 : en.rise, boot: L === 0 ? 1 : en.boot, u: en.u };
};
/** the robot's fog: the air by its depth, darkened by the shaft while it is still under the floor */
const fogOfItem = (V: View, it: Item): FolkFog => {
  const air = V.air(it.d, 150);
  const a = V.figFog(it.d);
  const dark = it.rise >= 1 ? 0 : 0.55 * Math.pow(1 - it.rise, 0.7);
  if (dark <= 0) return { rgb: air, amount: a };
  const rgb = mixRgb(air, SHADOW_RGB, dark / Math.max(1e-3, dark + a));
  return { rgb, amount: Math.min(0.95, a + dark * (1 - a)) };
};

/** every robot in sight this frame: the field (L0..L4) and, from the sea's wave on, the sea's slots in view */
export const itemsAt = (V: View, f: number): Item[] => {
  const out: Item[] = [];
  for (const r of FIELD_BOTS) {
    const it = itemOf(V, f, r.X, r.Z, r.L, r.v, r.seed, r.t0);
    if (it && it.x > -80 && it.x < 1160 && it.yFloor < 2000) out.push(it);
  }
  if (f < WAVES[5].start) return out;
  const { e } = V;
  const hy = e.Hy + V.dy;
  const dMin = (e.F * e.He) / (1990 - hy);
  const xEdge = (Zr: number, x: number) => {
    const rz = Zr - e.Ze;
    const a = x - 540 - V.dx;
    return e.Xe + (rz * (e.sn * e.F + a * e.cs)) / (e.cs * e.F - a * e.sn);
  };
  for (let j = SEA.j0; j <= SEA.j1; j++) {
    const Z = zOf(j);
    if (Z - e.Ze < 200) continue;
    const xa = xEdge(Z, -70);
    const xb = xEdge(Z, 1150);
    const dc = (e.Xt - e.Xe) * e.sn + (Z - e.Ze) * e.cs;
    if (dc < dMin * 0.9) continue;
    // far rows go to the texture (drawFarTexture)
    if (dc > V.dTex * 1.05) break;
    const i0 = Math.floor(Math.min(xa, xb) / (T + AISLE / 10)) - 2;
    const i1 = Math.ceil(Math.max(xa, xb) / (T + AISLE / 10)) + 2;
    const inField = j >= FIELD.j0 && j <= FIELD.j1;
    for (let i = i0; i <= i1; i++) {
      if (inField && i >= FIELD.i0 && i <= FIELD.i1) continue;
      const t0 = t0Of(i, j, 5);
      if (f <= t0) continue;
      const it = itemOf(V, f, xOf(i), Z, 5, variantOf(i, j), seedOf(i, j), t0);
      if (it && it.yFloor < 2000 && it.yFloor > hy) out.push(it);
    }
  }
  return out;
};

/** the hatch: the opening (its leaves sliding apart under the floor) and the lift's top coming up the shaft */
const drawHatch = (ctx: CanvasRenderingContext2D, V: View, it: Item) => {
  if (it.open <= 0 || it.rise >= 1) return;
  const w = HATCH * it.open;
  const q = [V.P(it.X - w, 0, it.Z - HATCH), V.P(it.X + w, 0, it.Z - HATCH), V.P(it.X + w, 0, it.Z + HATCH), V.P(it.X - w, 0, it.Z + HATCH)];
  if (q.some((p) => !p)) return;
  const pts = q as { x: number; y: number }[];
  const span = Math.abs(pts[1].x - pts[0].x);
  if (span < 0.6) return;
  const a = 1 - V.fog(it.d);
  // the far waves' hatches (the 1,000, the 10,000, the sea: a few px each) come in with their robots, never as a bare
  // dark grid ahead of them
  const withBot = it.L >= 3 ? sst(0, 0.45, it.rise) : 1;
  ctx.globalAlpha = (0.55 + 0.45 * sst(14, 40, it.h)) * withBot * it.lod;
  if (ctx.globalAlpha < 0.01) return;
  ctx.fillStyle = rgbStr(mixRgb(mixRgb(SHADOW_RGB, hexRgb(FLOOR_LOCAL), 0.22), V.air(it.d, 0), 1 - a));
  ctx.beginPath();
  pts.forEach((p, k) => (k ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.closePath();
  ctx.fill();
  // the lift's top (the tile) seen down the shaft as it comes up, clipped to the opening
  if (it.rise > 0.02 && span > 2) {
    const yb = (1 - it.rise) * DEPTH;
    const t = [V.P(it.X - HATCH, yb, it.Z - HATCH), V.P(it.X + HATCH, yb, it.Z - HATCH), V.P(it.X + HATCH, yb, it.Z + HATCH), V.P(it.X - HATCH, yb, it.Z + HATCH)];
    if (t.every((p) => p)) {
      ctx.save();
      ctx.clip();
      const lit = mixRgb(SHADOW_RGB, toneRgb(V, FLOOR_LOCAL, it.d), Math.pow(it.rise, 1.6));
      ctx.fillStyle = rgbStr(lit);
      ctx.beginPath();
      (t as { x: number; y: number }[]).forEach((p, k) => (k ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }
  ctx.globalAlpha = 1;
};
const drawShadow = (ctx: CanvasRenderingContext2D, V: View, it: Item) => {
  const a = 0.85 * (1 - V.fog(it.d)) * sst(0.7, 1, it.rise) * it.lod;
  if (a < 0.02 || it.h < 2) return;
  const rx = 56 * it.s;
  const ry = Math.max(0.6, (26 * it.s * V.e.He) / Math.max(1, it.d));
  const cx = it.x + 0.18 * rx;
  const cy = it.yFloor + 0.2 * ry;
  ctx.globalAlpha = a;
  ctx.drawImage(shadowSprite(), cx - rx, cy - ry, 2 * rx, 2 * ry);
  ctx.globalAlpha = 1;
};
/** the bean LOD (a barrel, a wider head block, the screen band): plain rects, cropped at the floor's near line */
const drawBean = (ctx: CanvasRenderingContext2D, x: number, y: number, h: number, crop: number, body: string, screen: string, alpha: number) => {
  if (alpha <= 0.01) return;
  ctx.globalAlpha = alpha;
  const rect = (x0: number, y0: number, x1: number, y1: number, c: string) => {
    const b = Math.min(y1, crop);
    if (b <= y0) return;
    ctx.fillStyle = c;
    ctx.fillRect(x0, y0, x1 - x0, b - y0);
  };
  rect(x - 0.16 * h, y - 0.56 * h, x + 0.16 * h, y - 0.03 * h, body);
  rect(x - 0.23 * h, y - 0.97 * h, x + 0.23 * h, y - 0.58 * h, body);
  if (h > 4.5) rect(x - 0.15 * h, y - 0.9 * h, x + 0.15 * h, y - 0.69 * h, screen);
  ctx.globalAlpha = 1;
};
type Get = (key: string) => Sprite | undefined;
const drawBody = (ctx: CanvasRenderingContext2D, V: View, get: Get, it: Item) => {
  const liveA = it.L === 0 && it.h >= LIVE_LO ? 1 : sst(LIVE_LO, LIVE_HI, it.h);
  if (liveA >= 0.999 || it.rise <= 0) return;
  const crop = it.rise >= 1 ? 1e9 : it.yNear;
  const fog = fogOfItem(V, it);
  const fogRgb = typeof fog.rgb === "string" ? hexRgb(fog.rgb) : fog.rgb;
  const spriteA = sst(10, 14, it.h) * it.lod;
  const beanA = (1 - sst(12, 15, it.h)) * it.lod;
  if (beanA > 0.01) {
    if (it.rise >= 1) drawBotDot(ctx, it.x, it.yFeet, it.h, beanA, { rgb: fogRgb, amount: fog.amount });
    else {
      const body = rgbStr(mixRgb(hexRgb(ACCENT), fogRgb, 0.5 * fog.amount));
      const scr = rgbStr(mixRgb(hexRgb(BOT_SCREEN), fogRgb, fog.amount));
      drawBean(ctx, it.x, it.yFeet, it.h, crop, body, scr, beanA);
    }
  }
  if (spriteA <= 0.01) return;
  const size = SIZES.find((q) => q >= it.h / 1.15) ?? SIZES[SIZES.length - 1];
  const key = `bt|${it.v}|front|0|${size}`;
  const sp = get(key);
  if (!sp) return;
  const src = foggedOf(key, sp.c, { rgb: fogRgb, amount: 0.5 * fog.amount });
  const k = it.h / sp.px;
  const dw = sp.c.width * k;
  const dh = sp.c.height * k;
  const x0 = it.x - sp.ax * k;
  const y0 = it.yFeet - sp.ay * k;
  const vis = Math.min(dh, crop - y0);
  if (vis <= 0.2) return;
  ctx.globalAlpha = spriteA;
  ctx.drawImage(src, 0, 0, sp.c.width, (vis / dh) * sp.c.height, x0, y0, dw, vis);
  ctx.globalAlpha = 1;
};

/** the far robots as a texture by screen row (a pre-filtered LOD: the rows of robots beyond V.dTex sit closer than
 *  RP_TEX px apart and would beat into moire). Each pixel row at its depth is filled where its world line crosses the
 *  risen robots: the 10,000's rectangle within the 10,000's risen radius, and the sea's risen ring outside the field;
 *  with gaps at the block aisles, fogged and melting into the air at the horizon; it fades in over the band where the
 *  robots fade out (dTex / LOD_BAND .. dTex) */
const SEA_TONE = mixHex(ACCENT, "#B8790C", 0.35);
type Span = [number, number];
const FIELD_X: Span = [xOf(FIELD.i0) - T / 2, xOf(FIELD.i1) + T / 2];
const FIELD_Z: Span = [zOf(FIELD.j0) - T / 2, zOf(FIELD.j1) + T / 2];
const drawFarTexture = (ctx: CanvasRenderingContext2D, V: View, f: number) => {
  const R4 = f >= WAVES[4].start ? risenR(4, f) : 0;
  const R5 = f >= WAVES[5].start ? risenR(5, f) : 0;
  if (R4 <= 0 && R5 <= 0) return;
  const { e } = V;
  const hy = e.Hy + V.dy;
  const dStart = V.dTex / LOD_BAND;
  const yCut = hy + (e.F * e.He) / dStart;
  // the mean of robots and the floor between their files: a shade under the robots' orange
  const tone = mixRgb(hexRgb(SEA_TONE), SHADOW_RGB, 0.14);
  for (let y = Math.floor(hy) + 1; y < Math.min(1920, yCut); y++) {
    const d = (e.F * e.He) / (y + 0.5 - hy);
    const texA = sst(dStart, V.dTex, d);
    if (texA <= 0.01) continue;
    // the screen row's world line: X(x) = bx + ax x, Z(x) = bz + az x
    const Xr = (x: number) => e.Xe + (((x - 540 - V.dx) * d) / e.F) * e.cs + d * e.sn;
    const Zr = (x: number) => e.Ze - (((x - 540 - V.dx) * d) / e.F) * e.sn + d * e.cs;
    const bx = Xr(0);
    const bz = Zr(0);
    const ax = Xr(1) - bx;
    const az = Zr(1) - bz;
    const disc = (R: number): Span | null => {
      if (R <= 0) return null;
      if (!Number.isFinite(R)) return [-10, 1090];
      const A = ax * ax + az * az;
      const B = 2 * (ax * bx + az * bz);
      const C = bx * bx + bz * bz - R * R;
      const q = B * B - 4 * A * C;
      if (q <= 0) return null;
      return [(-B - Math.sqrt(q)) / (2 * A), (-B + Math.sqrt(q)) / (2 * A)];
    };
    /** the screen x span where the line's coordinate (b + a x) lies in [lo, hi] */
    const band = (b0: number, a0: number, [lo, hi]: Span): Span | null => {
      if (Math.abs(a0) < 1e-9) return b0 >= lo && b0 <= hi ? [-1e9, 1e9] : null;
      const p = (lo - b0) / a0;
      const q = (hi - b0) / a0;
      return [Math.min(p, q), Math.max(p, q)];
    };
    const cut = (u: Span | null, v: Span | null): Span | null => {
      if (!u || !v) return null;
      const r: Span = [Math.max(u[0], v[0], -10), Math.min(u[1], v[1], 1090)];
      return r[1] > r[0] ? r : null;
    };
    const rect = cut(band(bx, ax, FIELD_X), band(bz, az, FIELD_Z));
    const field = cut(rect, disc(R4));
    const sea = cut(disc(R5), [-10, 1090]);
    const seaParts: Span[] = [];
    if (sea) {
      if (!rect || rect[1] <= sea[0] || rect[0] >= sea[1]) seaParts.push(sea);
      else {
        if (rect[0] > sea[0]) seaParts.push([sea[0], rect[0]]);
        if (rect[1] < sea[1]) seaParts.push([rect[1], sea[1]]);
      }
    }
    if (!field && !seaParts.length) continue;
    const fogA = V.figFog(d);
    const air = V.air(d, 120);
    const melt = Math.pow(sst(6 * V.Dt + 30000, 14 * V.Dt + 110000, d), 0.7);
    ctx.fillStyle = rgbStr(mixRgb(mixRgb(tone, air, 0.5 * fogA + 0.1), V.v.airAtScreen(y), melt));
    const base = 0.66 * (1 - 0.85 * melt) * texA;
    // a ring's front: its robots are still coming up (a soft edge, not a line)
    const rMid = Math.hypot(Xr(540), Zr(540));
    const frontA = (R: number) => (Number.isFinite(R) ? 0.25 + 0.75 * sst(R, R * 0.8, rMid) : 1);
    // the block aisles (files with (i + 4) mod 11 = 10) as gaps
    const gapPx = (AISLE * e.F) / (d * Math.max(0.5, e.cs));
    const xOfX = (X: number) => 540 + V.dx + ((X - e.Xe - d * e.sn) / e.cs) * (e.F / d);
    const fillSpan = ([xs0, xs1]: Span, alpha: number) => {
      ctx.globalAlpha = alpha;
      const c0 = Math.floor(Math.min(Xr(xs0), Xr(xs1)) / (10 * T + AISLE)) - 1;
      const c1 = Math.ceil(Math.max(Xr(xs0), Xr(xs1)) / (10 * T + AISLE)) + 1;
      const gaps: number[] = [];
      for (let cc = c0; cc <= c1; cc++) gaps.push(xOfX(aisleX(cc)));
      gaps.sort((p, q) => p - q);
      let prev = xs0;
      for (const g of gaps) {
        const a0 = Math.max(prev, xs0);
        const b0 = Math.min(g - gapPx / 2, xs1);
        if (b0 > a0) ctx.fillRect(a0, y, b0 - a0, 1);
        prev = Math.max(prev, g + gapPx / 2);
      }
      if (xs1 > prev) ctx.fillRect(prev, y, xs1 - prev, 1);
    };
    if (field) fillSpan(field, base * frontA(R4));
    for (const sp of seaParts) fillSpan(sp, base * frontA(R5));
  }
  ctx.globalAlpha = 1;
};

// ===================================================================================================================
// THE LIVE ROBOTS (SVG): the hero always while it is big, every robot of 54+ px, crossfading into its sprite below 70
// ===================================================================================================================
const livePose = (it: Item, frame: number): BotPose => {
  const q = BOT_POSES.front(frame, it.L === 0 ? 0 : it.seed * 40);
  return it.L === 0 ? q : { ...q, boot: it.boot };
};
const LiveBots: React.FC<{ V: View; items: Item[]; frame: number }> = ({ V, items, frame }) => {
  const live = items.filter((it) => it.rise > 0 && it.h >= LIVE_LO);
  if (!live.length) return null;
  // groups of similar size share one gouache filter (BotLayer); groups run far to near, as the items do
  const groups: { key: number; s: number; its: Item[] }[] = [];
  for (const it of live) {
    const key = it.L === 0 ? -1 : Math.floor(Math.log(it.h) / Math.log(1.18));
    const g = groups[groups.length - 1];
    if (g && g.key === key) g.its.push(it);
    else groups.push({ key, s: it.s, its: [it] });
  }
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0 }}>
      {groups.map((g, gi) => {
        const figs = g.its.map((it) => {
          const a = it.L === 0 ? 1 : sst(LIVE_LO, LIVE_HI, it.h);
          const uid = `tfb${it.X / T}_${it.Z / T}`.replace(/-/g, "m");
          const clip = it.rise < 1;
          return (
            <g key={uid} opacity={a}>
              {clip ? (
                <defs>
                  <clipPath id={`${uid}c`}>
                    <rect x={it.x - 400} y={-4000} width={800} height={it.yNear + 4000} />
                  </clipPath>
                </defs>
              ) : null}
              <g clipPath={clip ? `url(#${uid}c)` : undefined}>
                <Bot variant={it.v} pose={livePose(it, frame)} at={[it.x, it.yFeet]} scale={it.s} uid={uid} frame={frame} fog={fogOfItem(V, it)} unitPx={1} texture={g.key === -1 ? undefined : false} />
              </g>
            </g>
          );
        });
        return g.key === -1 ? (
          <g key={`g${gi}`}>{figs}</g>
        ) : (
          <BotLayer key={`g${gi}`} uid={`tfl${gi}`} unitPx={g.s}>
            {figs}
          </BotLayer>
        );
      })}
    </svg>
  );
};

// ===================================================================================================================
// THE CUT
// ===================================================================================================================
export const TenfoldScene: React.FC<{ frame: number }> = ({ frame }) => {
  const reqs = useMemo(() => botCrowdReqs(["front"], SIZES), []);
  const get = useBotSprites(reqs);
  const V = viewAt(frame);
  const items = itemsAt(V, frame).sort((a, b) => b.d - a.d);
  const draw = (ctx: CanvasRenderingContext2D) => {
    drawFloor(ctx, V);
    drawFarTexture(ctx, V, frame);
    for (const it of items) {
      drawHatch(ctx, V, it);
      drawShadow(ctx, V, it);
      drawBody(ctx, V, get, it);
    }
    // the far crowd melts into the air at the horizon (no hard top edge to the sea)
    paintHorizonHaze(ctx, V.v, 150, 0.85);
  };
  return (
    <AirStage v={V.v} bloom={0.22} shafts={0.35}>
      <FolkCanvas draw={draw} />
      <LiveBots V={V} items={items} frame={frame} />
    </AirStage>
  );
};

const TenfoldEveryYear: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  return <TenfoldScene frame={frame} />;
};

export default TenfoldEveryYear;
