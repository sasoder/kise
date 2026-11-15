// ---------------------------------------------------------------------------
// TenfoldEveryYear (rsi-ten-earths, cut 89). Dwarkesh 3D style (styles/dwarkesh-3d.md).
// Opaque 1080x1920, 23.976 fps, 156 frames. World: the clip's shared modules (read-only): tenEarthsGenius (the
// Genius, GENIUS_POSES.front, the module's crowd sprites baked at this cut's sizes, the dot LOD) and tenEarthsHall
// (YearPlate, U). The floor is cut 3's / cut 4's warm sand hall floor with no walls: it runs on and melts into the air.
//
// CHECK LINE: "Every year there are ten times as many AIs: one, ten, a hundred, a thousand, ten thousand."
//
// THE LINE: "you should expect the population of AIs at a given level of capabilities to roughly increase tenfold
//   every year."
// WORD -> FRAME (from the composition start; Whisper may run ~0.2-0.4 s early): year, -9 · you -2 · should 0 ·
//   expect 2 · the 5 · population 15 · of 23 · AIs 32 · at 40 · a 45 · given 47 · level 52 · of 58 · capabilities 60 ·
//   to 68 · roughly 85 · increase 98 · tenfold 114 · every 132 · year. 143 · (So 155)
// DURATION: the slot 89.0890 -> 95.5955 s = 6.5065 s x 23.976 = 156 frames (f0..f155).
//
// THE MOTION: powers of ten on one bare hall floor under one continuous pull-back and rise. f0 one Genius (v0) stands
//   facing us, ~290 px (head top y ~760, feet y 1060). Every copy comes out from behind the formation at full size
//   (never a pop, a scale-in or a fade), all the same size and look all cut long ("at a given level of capabilities"):
//     x10 (f10-f31, "population ... AIs"): nine copies step out sideways, each from behind the one inside it (the
//       first pair from behind him), nearest first: a row of ten (x ~95-985 at f31);
//     x10 (f45-f67, "level of capabilities"): the row copies itself back into depth, nine rows peeling off one after
//       another, each from behind the row before, nearest first: a block of 100 (x ~280-800, y ~765-1060 at f68);
//     x10 (f94-f114, "increase tenfold"): nine blocks peel back one after another, each from behind the back row of the
//       block before, into a column of ten blocks receding into the haze: 1,000; the plate "×10" slides up in the air
//       above the horizon (f102-f114, landed on "tenfold", y ~370, 96 px type);
//     x10 (f121-f141, "every year"): every block of the column repeats sideways, its new blocks fanning out from behind
//       the column's outer files to both sides (block row b ends WIDTHS[b] blocks wide, nearest block row first): a
//       field of 10,000 that fills the box's width (x ~85-995) from the front row (feet y 1060) to the haze (y ~555):
//       sprites near, the dot LOD far, the back blocks melting into the air.
//   Living hold f141-f155: the crowd breathes and shifts its weight in a slow wave running back through it, the camera
//   creeps on.
// Orange = the AIs only (COMMON.md): every Genius and the dot LOD. Floor warm sand, the air teal, type cream.
//
// DEPTH: a physical camera on one lens (F = 800 screen px per unit at distance 1): pure dolly + crane with lens
//   shifts. The formation's front row is at Z 0 and stays there (every step grows sideways or backward). Per frame the
//   front row's scale s (= F / D, one lobe in ln s, peak f61, settled f140, then a creep), its feet's screen row Yf and
//   the horizon's row HY (one lobe, peak f45) are keyed; the eye height follows: h = (Yf - HY) / s. s 0.92 -> 0.19 (a
//   Genius 287 -> 59 px), eye 1.6 m -> ~18 m, horizon y 805 -> 470, front feet held at y 1060. The vanishing point on
//   X 66 (the block's axis, between the hero and his right neighbour); a lens shift centres the hero at f0 (gone by
//   f40). londonDepth per frame: { eyeY: -h, dRef: D, kRef: k, dolly: 0 }, k = F / D. Interior mood (eyeT 0.17, cut
//   3's), fog by world depth; the people by depth, the back blocks a further haze and fade into the air.
// LAYOUT: pitch 0.74 m across (PX 132), 1.12 m deep (PZ 200); a block = 10 files x 10 rows; 10 block rows (1.7 m
//   aisles, BZ 2300) of 3, 5, 5, 7, 9, 11, 13, 15, 15, 17 blocks (1.35 m aisles, BX 1560) = 100 blocks: each block row
//   as wide as the box allows at its depth, so no file ever has to race across the frame. The hero = block (0, 0), file
//   0, row 0. Tiers: the hero's front row of ten are live SVG Geniuses (front pose, breathing) on top; every other
//   figure is a front sprite (the module's own bake at 7 sizes x 5 looks) on one canvas, drawn far to near with each
//   copy behind its twin, crossfading to the module's dot at 13-16 px. Nothing changes tier except that crossfade.
// CHECKS (scripts/clips/rsi-ten-earths/check-tenfold-every-year.ts): one lobe in ln s; 0 faces in the caption bands
//   on any frame (all 10,000); front-row chins <= y 1014; the hero's block inside the keep-in box on every frame; the
//   plate in the box, above the horizon, clear of every figure; screen speeds <= 45 px/f for figures >= 20 px.
//
// SOURCES: x10 per year = global AI compute ~x3 per year (Epoch AI, global AI computing capacity in H100-equivalents
//   ~3.3x/yr since 2022, epoch.ai data insights) x compute needed for a given capability falling >3x per year (Epoch AI,
//   algorithmic progress in language models, Ho et al. 2024; inference price per capability). The speaker: "roughly
//   increase tenfold every year". On screen only "×10"; the counts 1 / 10 / 100 / 1,000 / 10,000 are illustrative
//   powers of ten, not any year's real number.
// ---------------------------------------------------------------------------
import React, { useMemo } from "react";
import { random, useCurrentFrame } from "remotion";
import { z } from "zod";
import { AIR, AirFloor, AirHorizonHazeW, AirStage, WorldSvg, airWorldOf, c01, hexRgb, swayCam, type AirWorld, type Cam, type DepthOpts, type Mat } from "../kits/dwarkesh-3d/dwarkesh3d";
import { U, YearPlate, yearPlateT } from "./tenEarthsHall";
import { FolkCanvas, GENIUS_POSES as G, Genius, drawGeniusDot, geniusCrowdReqs, useGeniusSprites, type FolkFog, type Sprite } from "./tenEarthsGenius";

export const FPS = 24000 / 1001;
export const DURATION = 156;
export const schema = z.object({ camFrame: z.number().default(-1) });
export const defaultProps = schema.parse({});

const PAL = AIR.A;
const sst = (a: number, b: number, v: number) => {
  const u = c01((v - a) / (b - a));
  return u * u * (3 - 2 * u);
};
/** an eased 0..1 with a velocity lobe t^a (1-t)^b (integrated numerically; the sisters' helper) */
const lobe = (a: number, b: number) => {
  const N = 600;
  const cum = [0];
  for (let i = 1; i <= N; i++) {
    const t = (i - 0.5) / N;
    cum.push(cum[i - 1] + Math.pow(t, a) * Math.pow(1 - t, b));
  }
  const tot = cum[N];
  return (t: number) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    const x = t * N;
    const i = Math.floor(x);
    return (cum[i] + (cum[Math.min(N, i + 1)] - cum[i]) * (x - i)) / tot;
  };
};

// ===================================================================================================================
// THE FORMATION
// ===================================================================================================================
/** pitch across / deep (units); a block is 10 files x 10 rows; aisles between blocks */
export const PX = 132;
export const PZ = 200;
export const AX = 240;
export const AZ = 300;
export const BX = 10 * PX + AX;
export const BZ = 10 * PZ + AZ;
/** files i -4..5 in a block, rows r 0..9; block rows b 0..9; block columns c -w..w in block row b, WIDTHS[b] = 2w + 1
 *  blocks (3 + 5 + 5 + 7 + 9 + 11 + 13 + 15 + 15 + 17 = 100): each block row as wide as the box allows at its depth, so
 *  on screen the field keeps the box's width from the front row to the haze (perspective narrows the far rows as fast
 *  as they widen) and no file has to race sideways across the frame */
export const WIDTHS = [3, 5, 5, 7, 9, 11, 13, 15, 15, 17];
export const I0 = -4;
export const I1 = 5;
export const NR = 10;
export const NB = 10;

/** step 1: copies step out sideways, each from behind the one inside it (the first pair from behind the hero),
 *  nearest first */
export const S1 = { t0: 10, lag: 2, dur: 13 };
/** step 2: rows peel off backwards, each from behind the row before, nearest first */
export const S2 = { t0: 45, lag: 1.5, dur: 10 };
/** step 3: blocks peel off backwards, each from behind the block before (its back row), nearest first */
export const S3 = { t0: 94, lag: 1.25, dur: 10 };
/** step 4: every block of the column repeats sideways: block row b fans its new blocks out to each side from behind
 *  the column's outer files (its new files telescoping, one ease per block row), nearest block row first */
export const S4 = { t0: 121, lag: 0.5, dur: 16 };
const EASE_ROW = lobe(0.9, 0.9);
const EASE_FAN = lobe(1.1, 1.1);
const eAt = (f: number, a: number, dur: number, E = EASE_FAN) => E((f - a) / dur);
export const e1 = (f: number, i: number) => (i === 0 ? 1 : eAt(f, S1.t0 + S1.lag * (Math.abs(i) - 1), S1.dur, EASE_ROW));
/** the X of file i of the hero's block at frame f (nested: file i rides on file i -+ 1) */
export const xFile0 = (f: number, i: number): number => (i === 0 ? 0 : xFile0(f, i - Math.sign(i)) + Math.sign(i) * PX * e1(f, i));
export const e2 = (f: number, r: number) => eAt(f, S2.t0 + S2.lag * (r - 1), S2.dur, EASE_ROW);
export const e3 = (f: number, b: number) => eAt(f, S3.t0 + S3.lag * (b - 1), S3.dur, EASE_ROW);
export const e4 = (f: number, b: number) => eAt(f, S4.t0 + S4.lag * b, S4.dur, EASE_ROW);

/** the depth of row (b, r) at frame f (the formation's front row stays at Z 0) */
export const zRowsAt = (f: number): number[][] => {
  const z: number[][] = [];
  for (let b = 0; b < NB; b++) {
    const row: number[] = [];
    for (let r = 0; r < NR; r++) {
      if (b === 0) row.push(r === 0 ? 0 : row[r - 1] + PZ * e2(f, r));
      else row.push(z[b - 1][NR - 1] + (AZ + PZ + r * PZ) * e3(f, b));
    }
    z.push(row);
  }
  return z;
};
/** the X of a figure at frame f: the hero's row fans out from behind him (step 1); a side block's files telescope
 *  out from behind the column's outer file on their side (step 4) */
export const xOf = (f: number, c: number, i: number, b: number) => {
  if (c === 0) return xFile0(f, i);
  const a = xFile0(f, c > 0 ? I1 : I0);
  return a + (c * BX + i * PX - (c > 0 ? I1 : I0) * PX) * e4(f, b);
};
export type Fig = { c: number; i: number; b: number; r: number; gi: number; v: number; seed: number; gen: number; Z1: number; X1: number };
export const FIGS: Fig[] = (() => {
  const out: Fig[] = [];
  for (let b = 0; b < NB; b++)
    for (let c = -(WIDTHS[b] - 1) / 2; c <= (WIDTHS[b] - 1) / 2; c++)
      for (let i = I0; i <= I1; i++)
        for (let r = 0; r < NR; r++) {
          const gi = c * 10 + i;
          const hero = gi === 0 && b === 0 && r === 0;
          const gen = hero ? 0 : c !== 0 ? 4 : b > 0 ? 3 : r > 0 ? 2 : 1;
          out.push({
            c,
            i,
            b,
            r,
            gi,
            v: hero ? 0 : Math.floor(random(`tey-v-${gi}-${b}-${r}`) * 5),
            seed: random(`tey-s-${gi}-${b}-${r}`),
            gen,
            Z1: b * BZ + r * PZ,
            X1: c * BX + i * PX,
          });
        }
  return out;
})();
export type Placed = Fig & { X: number; Z: number; e: number };
/** every figure standing at frame f (a copy that has not started is left out: it is coincident with, and hidden
 *  behind, its twin), with its own progress e (0..1) */
export const figsAt = (f: number): Placed[] => {
  const zr = zRowsAt(f);
  const out: Placed[] = [];
  for (const g of FIGS) {
    const e = g.gen === 0 ? 1 : g.gen === 1 ? e1(f, g.i) : g.gen === 2 ? e2(f, g.r) : g.gen === 3 ? e3(f, g.b) : e4(f, g.b);
    if (e <= 0) continue;
    out.push({ ...g, X: xOf(f, g.c, g.i, g.b), Z: zr[g.b][g.r], e });
  }
  return out;
};

// ===================================================================================================================
// THE CAMERA: a physical camera on one lens, dolly + crane + lens shifts
// ===================================================================================================================
export const F_LENS = 800;
/** the vanishing point's X: between the hero (X 0) and his right neighbour: the row's and the block's axis */
export const XV = 0.5 * PX;
const S0 = 0.92;
const S1F = 0.19;
const YF0 = 1060;
const YF1 = 1060;
const HY0 = 805;
const HY1 = 470;
export const S_END = 140;
const E_S = lobe(0.7, 0.9);
const E_Y = lobe(0.9, 1.9);
const E_X = lobe(1.0, 1.6);
const X_END = 40;
/** the creep after the settle (ln s per frame), blended in over f124-f140 so the speed never steps */
const CREEP = -0.0012;
const creepAt = (f: number) => {
  const a = 124;
  const b = 140;
  if (f <= a) return 0;
  const L = b - a;
  const t = (Math.min(f, b) - a) / L;
  return CREEP * (L * (t * t * t - 0.5 * t * t * t * t) + Math.max(0, f - b));
};
export type CamState = { s: number; D: number; h: number; HY: number; Yf: number; shift: number; k: number; cam: Cam; depth: DepthOpts };
export const camState = (f: number): CamState => {
  const ls = Math.log(S0) + (Math.log(S1F) - Math.log(S0)) * E_S(f / S_END) + creepAt(f);
  const s = Math.exp(ls);
  const D = F_LENS / s;
  const ey = E_Y(f / S_END);
  const HY = HY0 + (HY1 - HY0) * ey;
  const Yf = YF0 + (YF1 - YF0) * ey;
  const h = (Yf - HY) / s;
  const k = s;
  // f0: the hero (X 0) at x 540; then the row's axis (the VP) on the centre
  const shift = s * XV * (1 - E_X(f / X_END));
  const eyeY = -h;
  const cam: Cam = { k, cx: XV, cy: eyeY - (HY - 960) / k };
  return { s, D, h, HY, Yf, shift, k, cam, depth: { eyeY, dRef: D, kRef: k, dolly: 0 } };
};
/** a world point on screen (no sway): the checks' projection */
export const screenOf = (C: CamState, X: number, Y: number, Z: number) => {
  const d = C.D + Z;
  return { x: 540 + C.shift + (F_LENS * (X - XV)) / d, y: C.HY + (F_LENS * (C.h + Y)) / d, s: F_LENS / d };
};

// ===================================================================================================================
// THE PLATE: "×10" in the air above the horizon, deep and high (world space), landed on "tenfold"
// ===================================================================================================================
export const PLATE_F0 = 102;
export const PLATE_DUR = 12;
const plateAt = (f: number, sx: number, sy: number, px: number, Z: number) => {
  const C = camState(f);
  const d = C.D + Z;
  return { X: XV + ((sx - 540 - C.shift) * d) / F_LENS, Y: -(C.h - ((sy - C.HY) * d) / F_LENS), Z, size: (px * d) / F_LENS };
};
export const PLATE = plateAt(S_END, 540, 370, 96, 26000);

// ===================================================================================================================
// THE CROWD SPRITES (the module's bake at this cut's sizes: front view, 5 looks) AND THEIR FOG
// ===================================================================================================================
const SIZES = [16, 26, 42, 68, 110, 176, 280];
const SPRITE_FOG = 0.6;
const FOGGED = new Map<string, HTMLCanvasElement>();
const foggedOf = (key: string, src: HTMLCanvasElement, fog: FolkFog): HTMLCanvasElement => {
  const amt = Math.round(c01(fog.amount * SPRITE_FOG) * 40) / 40;
  if (amt <= 0) return src;
  const rgb = (typeof fog.rgb === "string" ? hexRgb(fog.rgb) : fog.rgb).map((v) => Math.round(v / 6) * 6);
  const k = `${key}|${amt}|${rgb.join(",")}`;
  const hit = FOGGED.get(k);
  if (hit) return hit;
  if (FOGGED.size > 5000) FOGGED.clear();
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
  c.height = 20;
  const g = c.getContext("2d") as CanvasRenderingContext2D;
  const gr = g.createRadialGradient(32, 10, 0, 32, 10, 32);
  const sh = hexRgb(PAL.shadow).join(",");
  gr.addColorStop(0, `rgba(${sh},0.5)`);
  gr.addColorStop(0.6, `rgba(${sh},0.26)`);
  gr.addColorStop(1, `rgba(${sh},0)`);
  g.fillStyle = gr;
  g.save();
  g.scale(1, 10 / 32);
  g.beginPath();
  g.arc(32, 32, 32, 0, Math.PI * 2);
  g.fill();
  g.restore();
  SHADOW = c;
  return c;
};
/** the Genius's height (feet to crown, units) the LOD and the sprites are judged by */
const GH = 312;

// ===================================================================================================================
// THE AIR
// ===================================================================================================================
const FOG_VIS = 11000;
const FIG_FOG = { near: 400, vis: 9000, max: 0.8 };
/** the people's fog plus the deep haze: the back blocks sink into the air toward the horizon */
const figFogOf = (A: AirWorld, Z: number): FolkFog => ({ ...A.folkFog(Z), amount: Math.min(1, A.figFog(Z) + 0.45 * sst(5000, 22000, Z)) });
/** the very back melts away (alpha) */
const meltOf = (Z: number) => 1 - 0.85 * sst(9000, 23000, Z);
const MAT_SAND: Mat = { lit: "#A8966F", mid: "#8E7C5C", dark: "#5E5242" };
/** the living hold: breath and weight shifts, ramped in over the last beats (scaled by each figure's own progress, so
 *  a copy still coincident with its twin never moves off it) */
const LIFE = { a: 130, b: 148 };

const isLive = (g: Fig) => g.c === 0 && g.b === 0 && g.r === 0;

const TenfoldEveryYear: React.FC<z.infer<typeof schema>> = ({ camFrame }) => {
  const frame = useCurrentFrame();
  const cf = camFrame >= 0 ? camFrame : frame;
  const reqs = useMemo(() => geniusCrowdReqs(["front"], SIZES), []);
  const get = useGeniusSprites(reqs);
  const C = camState(cf);
  const R0 = camState(0);
  const cam = swayCam(C.cam, cf);
  const rest = swayCam(R0.cam, 0);
  const A = airWorldOf({ cam, rest, depth: C.depth, frame, scene: { mood: "interior", eyeT: 0.17, fogVis: FOG_VIS }, fogBy: "depth", figFog: FIG_FOG });
  const P = A.P;
  const k = A.cam.k;
  const sp = (X: number, Y: number, Z: number): [number, number] => {
    const w = P.p(X, Y, Z);
    return [540 + C.shift + (w[0] - A.cam.cx) * k, 960 + (w[1] - A.cam.cy) * k];
  };
  const figs = figsAt(frame);
  const life = sst(LIFE.a, LIFE.b, frame);
  // weight shifts: a slow wave running back through the crowd (by depth and across), each figure a little off phase
  const sway = (g: Placed) => life * g.e * 7 * Math.sin(frame * 0.11 - g.Z1 * 0.00035 - g.X1 * 0.0002 + g.seed * 1.6);
  const breath = (g: Placed) => 1 + g.e * 0.008 * Math.sin((frame / 101) * 6.283 + g.seed * 6.283);
  const canvasFigs = figs.filter((g) => !isLive(g));
  // far to near; at a tie (a copy still coincident with its twin) the copy first: its target deeper / farther out
  canvasFigs.sort((p, q) => q.Z - p.Z || q.Z1 - p.Z1 || Math.abs(q.gi) - Math.abs(p.gi));
  const draw = (ctx: CanvasRenderingContext2D) => {
    const sh = shadowSprite();
    // the contact shadows first (every figure's, the live row's too): on the floor under everyone
    for (const g of figs) {
      const s = P.r(g.Z) * k;
      const hPx = GH * s;
      if (hPx < 5) continue;
      const fog = A.figFog(g.Z);
      const a = (1 - fog) * g.e * g.e * meltOf(g.Z);
      if (a <= 0.01) continue;
      const [x, y] = sp(g.X + sway(g), 0, g.Z);
      const w = hPx * 0.42;
      ctx.globalAlpha = a;
      ctx.drawImage(sh, x - w * 0.38, y - w * 0.12, w, w * (20 / 64));
    }
    ctx.globalAlpha = 1;
    for (const g of canvasFigs) {
      const s = P.r(g.Z) * k;
      const hPx = GH * s;
      if (hPx < 1.2) continue;
      const [x, y] = sp(g.X + sway(g), 0, g.Z);
      if (x < -60 || x > 1140 || y < 200) continue;
      const fog = figFogOf(A, g.Z);
      const ra = meltOf(g.Z);
      const spriteA = sst(11, 15, hPx);
      const dotA = 1 - sst(13, 16, hPx);
      if (dotA > 0.003) drawGeniusDot(ctx, x, y, hPx, dotA * ra, fog);
      if (spriteA <= 0.003) continue;
      const size = SIZES.find((q) => q >= hPx / 1.15) ?? SIZES[SIZES.length - 1];
      const key = `ge|${g.v}|front|0|${size}`;
      const spr: Sprite | undefined = get(key);
      if (!spr) continue;
      const src = foggedOf(key, spr.c, fog);
      const fx = hPx / spr.px;
      const fy = fx * breath(g);
      ctx.globalAlpha = spriteA * ra;
      ctx.drawImage(src, x - spr.ax * fx, y - spr.ay * fy, spr.c.width * fx, spr.c.height * fy);
    }
    ctx.globalAlpha = 1;
  };
  // the live row (the hero's front row of ten), outer copies first so each comes out from behind the one inside it
  const live = figs.filter(isLive).sort((p, q) => Math.abs(q.gi) - Math.abs(p.gi));
  const tr = `translate(${(C.shift / C.k).toFixed(4)} 0)`;
  const tPlate = yearPlateT(frame, PLATE_F0, PLATE_DUR);
  return (
    <AirStage v={A.v} bloom={0.22} shafts={0.3}>
      <WorldSvg cam={cam}>
        <g transform={tr}>
          <AirFloor A={A} x0={-30000} x1={30000} z0={-20000} z1={42000} mat={MAT_SAND} course={0.6 * U} plank={0.6 * U} jointAmt={0.6} melt={0.5} />
        </g>
        <AirHorizonHazeW A={A} id="tey-haze" />
      </WorldSvg>
      <FolkCanvas draw={draw} />
      <WorldSvg cam={cam}>
        <AirHorizonHazeW A={A} id="tey-haze2" strength={0.6} />
      </WorldSvg>
      <WorldSvg cam={cam}>
        <g transform={tr}>
          {live.map((g) => {
            const { at, scale } = P.at(g.X + sway(g), g.Z);
            return <Genius key={`l${g.gi}`} variant={g.v} pose={G.front(frame, g.seed * 40 * g.e)} at={at} scale={scale} uid={`tey${g.gi + 10}`} frame={frame} fog={A.folkFog(g.Z)} unitPx={k} />;
          })}
        </g>
      </WorldSvg>
      <WorldSvg cam={cam}>
        <g transform={tr}>
          <YearPlate A={A} X={PLATE.X} Y={PLATE.Y} Z={PLATE.Z} text="×10" t={tPlate} uid="tey-plate" size={PLATE.size} plate={0.55} />
        </g>
      </WorldSvg>
    </AirStage>
  );
};

export default TenfoldEveryYear;
