// ---------------------------------------------------------------------------
// WorkOfBillions (rsi-ten-earths, cut 45). Dwarkesh 3D style (styles/dwarkesh-3d.md).
// Opaque 1080x1920, 23.976 fps, 149 frames. World: the clip's shared modules (read-only): tenEarthsHall (Desk,
// deskAnchors, YearPlate) and tenEarthsGenius (the Genius, typeAtDesk, GeniusPaint / buildGenius for this cut's own
// seated crowd sprites, the dot LOD). No walls (as cut 3): the office floor runs on and melts into the air.
//
// CHECK LINE: "By 2030 there may be enough AI to do 2.5 billion people's full-time jobs: an office floor of AI
//   workers to the horizon."
//
// THE LINE: "by 2030, there will be enough compute for AIs to do the work of about 2 .5 billion full -time human
//   workers. And"
// WORD -> FRAME (from the composition start; Whisper may run ~0.2-0.4 s early): by -2 · 2030 0 · there 14 · will 22 ·
//   be 24 · enough 27 · compute 35 · for 44 · AIs 52 · to 63 · do 67 · the 69 · work 73 · of 79 · about 83 · 2 90 ·
//   .5 95 · billion 105 · full 115 · -time 125 · human 131 · workers. 138 · And 138
// DURATION: the slot 45.0450 -> 51.2595 s = 6.2145 s x 23.976 = 149 frames (f0..f148).
//
// THE MOTION: one continuous pull-back and crane-up from one orange Genius typing at an ordinary office desk (f0:
//   ~420 px seated, his head at y ~760 against the air just above the horizon; monitor, keyboard, a cream mug). The
//   plate "2030" slides up beside his head on the word (f0-12). As the camera rises 2030 glides up out of the way on
//   one continuous path (f12-104, no fade), keeping just above the horizon, never over the figures, into the air
//   over the floor. The camera starts at once, gently, then pulls back
//   and rises hardest through "enough compute for AIs ... to do the work of" (peak ~f57): the office floor that was
//   already there (beside and behind him, hazy at f0) opens out, desk after desk, row after row, each with a Genius
//   typing, rows receding into the haze to the horizon (live figures in the first block of six rows, this cut's baked
//   seated sprites beyond, the dot LOD far off, the last rows melting into the air). On "about 2 .5 billion" the plate
//   "2.5 billion" slides up high in the air above the floor (f86 -> f100, landed before "billion" f105). The camera
//   settles by ~f118 ("full-time") into a slow pull-back creep: a living hold, every desk busy, screens glowing, the
//   typing bursts rippling back through the rows. The hero ends in the front row (head y ~1030, x ~640); the two
//   plates are one group in the air above the horizon: "2030" (~73 px, y ~340) centred just above "2.5 billion"
//   (~104 px, y ~440), a ~38 px gap, their shadows merged into one soft shadow behind the pair (70 % strength).
// Orange = the AIs only (COMMON.md): every Genius (and the dot LOD). Desks laminate and slate, chairs dusty teal,
//   screens cream, the floor warm sand (cut 3's), type cream on the medium's shadow.
//
// DEPTH: a physical camera on one lens (F = 1100 screen px per unit at distance 1): pure dolly + crane with lens
//   shifts. The vanishing point sits on the aisle at the hero's back (X -261), so no column stacks straight up behind
//   another and every screen in his column faces it. The hero at the world origin (his hips at X 0, Z 0; desk seat
//   "left", he faces +X). D = the eye's distance to Z 0: 710 -> 1719 (one log lobe, lobe(1.6, 1.7) over f0-f118,
//   then a creep of +0.11 %/frame); the horizon row 782 -> 555; his head's screen row 760 -> 1030; the horizontal
//   shift -476 px (his workstation centred) -> -100 px (VP at x ~440); the eye height follows (1.2 m -> 5.5 m), so his
//   face moves down monotonically and never reaches the caption band (chin <= 1054). londonDepth per frame:
//   { eyeY: -h, dRef: D, kRef: k, dolly: 0 }, k = F / D. Interior mood (eyeT 0.17, cut 3's), fog by world depth
//   (fogVis 4500); the people by depth (near 150, vis 2000, max 0.78), the far rows a further haze to the horizon.
// LAYOUT: one office floor, desks in profile (seat "left": chair, sitter, desk, monitor facing him) at a 3.0 m pitch
//   across (534 units, columns -40..40) and 1.8 m deep (320), with a 1.6 m cross aisle after every six rows; 72 rows
//   (to Z ~25,900; rows past Z 13,000 melt into the air). Rows 0-5: the module's <Desk> and live <Genius> (SVG).
//   Rows 6+: one canvas, far to near: each desk drawn on the module's geometry and colours (faces, outlines, the
//   desk-top rim, screen, glow) and its sitter from this cut's own baked seated sprites (typeAtDesk, 4 sizes x 5 looks
//   x 2 tap phases, the module's own paint), crossfading to the module's dot at 12-15 px (deep in the haze). Nothing
//   appears or changes tier while the camera moves; the only LOD change is that crossfade, by screen size.
// CHECKS (scratch tools/check.ts): one lobe in ln D (peak f57), 0 faces in the caption bands on any frame (all 72 x 81
//   workstations, 5 px sway margin), both plates inside the keep-in box and out of the bands on every frame
//   (2030 100 -> 72 px, 2.5 billion 103-107 px); tools/pair.ts: 2030's bottom never below the horizon.
//
// SOURCES: "2.5 billion full-time human workers" by 2030 is the SPEAKER'S OWN ESTIMATE (Dwarkesh Patel's essay, as
//   spoken), kept exactly as spoken; not a sourced figure. On screen only "2030" and "2.5 billion".
// ---------------------------------------------------------------------------
import React, { useLayoutEffect, useMemo, useState } from "react";
import { continueRender, delayRender, random, useCurrentFrame } from "remotion";
// @ts-expect-error react-dom ships no types for its server entry here (nothing may be installed); typed below
import * as ReactDomServer from "react-dom/server";
import { z } from "zod";
import {
  AIR,
  AirFloor,
  AirHorizonHazeW,
  AirStage,
  MAT,
  WorldSvg,
  airWorldOf,
  c01,
  hexRgb,
  lineOf,
  mixHex,
  swayCam,
  type AirWorld,
  type Cam,
  type DepthOpts,
  type Mat,
} from "../kits/dwarkesh-3d/dwarkesh3d";
import {
  CREAM,
  DESK,
  Desk,
  MAT_FABRIC,
  MAT_KEYS,
  MAT_LAMINATE,
  MAT_MONITOR,
  U,
  YearPlate,
  yearPlateT,
} from "./tenEarthsHall";
import {
  FolkCanvas,
  GENIUS_POSES as G,
  Genius,
  GeniusPaint,
  buildGenius,
  drawGeniusDot,
  type FolkFog,
  type GeniusPose,
} from "./tenEarthsGenius";

const renderToStaticMarkup = (ReactDomServer as { renderToStaticMarkup: (el: React.ReactElement) => string })
  .renderToStaticMarkup;

export const FPS = 24000 / 1001;
export const DURATION = 149;
export const schema = z.object({ camFrame: z.number().default(-1) });
export const defaultProps = schema.parse({});

const PAL = AIR.A;
const sst = (a: number, b: number, v: number) => {
  const u = c01((v - a) / (b - a));
  return u * u * (3 - 2 * u);
};

// ===================================================================================================================
// THE CAMERA: a physical camera on one lens, dolly + crane + a vertical lens shift
// ===================================================================================================================
export const F_LENS = 1100;
/** the vanishing point's X: the centre of the aisle on the hero's left (his back), so no column stacks straight up
 *  behind another and the screens of his column face it */
export const XV = -261;
/** the hero's workstation centre (chair back -52 .. monitor +150) */
const HERO_CX = 50;
/** the hero's head centre height (units; typeAtDesk headC Y -231) */
const HEAD_H = 231;
const D0 = 710;
const D1 = 1719;
const HY0 = 782;
const HY1 = 555;
const YH0 = 760;
const YH1 = 1030;
export const S_END = 118;
/** the horizontal lens shift (screen px): f0 centres his workstation; at the end he sits a little right of centre
 *  (x ~640) with the aisle's vanishing point at x ~440 */
const SH0 = (-1100 * (HERO_CX - XV)) / D0;
const SH1 = -100;
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
const E_D = lobe(1.6, 1.7);
const E_Y = lobe(1.5, 1.8);
const E_H = lobe(1.5, 1.8);
/** the creep after the settle (ln D per frame), blended in over f100-f118 so the speed never steps */
const CREEP = 0.0011;
const creepAt = (f: number) => {
  const a = 100;
  const b = 118;
  if (f <= a) return 0;
  const L = b - a;
  const t = (Math.min(f, b) - a) / L;
  return CREEP * (L * (t * t * t - 0.5 * t * t * t * t) + Math.max(0, f - b));
};
export type CamState = {
  D: number;
  h: number;
  HY: number;
  yHead: number;
  shift: number;
  k: number;
  cam: Cam;
  depth: DepthOpts;
};
export const camState = (f: number): CamState => {
  const t = f / S_END;
  const D = Math.exp(Math.log(D0) + (Math.log(D1) - Math.log(D0)) * E_D(t) + creepAt(f));
  const HY = HY0 + (HY1 - HY0) * E_Y(t);
  const yHead = YH0 + (YH1 - YH0) * E_H(t);
  const h = HEAD_H + ((yHead - HY) * D) / F_LENS;
  const k = F_LENS / D;
  const eyeY = -h;
  const cam: Cam = { k, cx: XV, cy: eyeY - (HY - 960) / k };
  const shift = SH0 + (SH1 - SH0) * E_H(t);
  return {
    D,
    h,
    HY,
    yHead,
    shift,
    k,
    cam,
    depth: { eyeY, dRef: D, kRef: k, dolly: 0 },
  };
};

// ===================================================================================================================
// THE OFFICE FLOOR
// ===================================================================================================================
export const PITCH_X = 534;
export const PITCH_Z = 320;
const BLOCK = 6;
const CROSS = 285;
export const NROWS = 72;
const COL0 = -40;
const COL1 = 40;
/** rows 0..TIER_A-1 are live SVG (the module's Desk + Genius); the rest are drawn on one canvas */
export const TIER_A = 6;
/** a workstation by its sitter: at = the floor under his hips (deskAnchors "left": the desk's centre is +114.5) */
export const rowZ = (r: number) => r * PITCH_Z + Math.floor(r / BLOCK) * CROSS;
export const colX = (c: number) => c * PITCH_X;
const DESK_DX = DESK.d / 2 + 52;
const lookOf = (r: number, c: number) => (r === 0 && c === 0 ? 0 : Math.floor(random(`wob-v-${r}-${c}`) * 5));
/** the typing seed: the bursts travel back through the rows (a faint ripple), a little jitter across */
const seedOf = (r: number, c: number) => -0.55 * r + 0.9 * random(`wob-s-${r}-${c}`);
/** the burst envelope of typeAtDesk (its own formula), for the canvas tier's tap phase and screen */
const burstOf = (frame: number, seed: number) => sst(0.25, 0.45, 0.5 + 0.5 * Math.sin(frame * 0.09 + seed * 2));

// ===================================================================================================================
// SEATED CROWD SPRITES (this cut's: typeAtDesk baked with the module's own paint, once per render tab)
// ===================================================================================================================
type Sprite = { c: HTMLCanvasElement; ax: number; ay: number; sc: number };
/** baked scales (screen px per unit): a seated Genius ~275 units tall -> 16, 33, 66, 132 px */
const SPRITE_SC = [0.06, 0.12, 0.24, 0.48];
const PHASE_FRAMES = [30, 33];
type SpriteReq = { key: string; v: number; ph: number; sc: number };
const spriteReqs = (): SpriteReq[] => {
  const out: SpriteReq[] = [];
  for (const sc of SPRITE_SC)
    for (let v = 0; v < 5; v++)
      for (let ph = 0; ph < PHASE_FRAMES.length; ph++) out.push({ key: `ws|${v}|${ph}|${sc}`, v, ph, sc });
  return out;
};
const SPRITES = new Map<string, Sprite>();
const SHAPES = new Map<string, ReturnType<typeof buildGenius>["shapes"]>();
const shapesOf = (v: number, ph: number) => {
  const k = `${v}|${ph}`;
  let s = SHAPES.get(k);
  if (!s) {
    s = buildGenius(v, G.typeAtDesk(1, PHASE_FRAMES[ph], 0)).shapes;
    SHAPES.set(k, s);
  }
  return s;
};
const bakeOne = (r: SpriteReq): Promise<void> => {
  if (SPRITES.has(r.key)) return Promise.resolve();
  const pad = 6;
  const ax = Math.ceil(80 * r.sc + pad);
  const ay = Math.ceil(300 * r.sc + pad);
  const W = Math.ceil(ax + 140 * r.sc + pad);
  const H = Math.ceil(ay + 12 * r.sc + pad);
  const svg = renderToStaticMarkup(
    <svg xmlns="http://www.w3.org/2000/svg" width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <GeniusPaint
        shapes={shapesOf(r.v, r.ph)}
        at={[ax, ay]}
        scale={r.sc}
        uid={`wobsp${r.v}${r.ph}${Math.round(r.sc * 100)}`}
      />
    </svg>,
  );
  return new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = W;
      c.height = H;
      (c.getContext("2d") as CanvasRenderingContext2D).drawImage(img, 0, 0);
      SPRITES.set(r.key, { c, ax, ay, sc: r.sc });
      resolve();
    };
    img.onerror = () => resolve();
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
};
const useSeatedSprites = () => {
  const reqs = useMemo(() => spriteReqs(), []);
  const ready = reqs.every((r) => SPRITES.has(r.key));
  const [handle] = useState(() =>
    ready
      ? null
      : delayRender("baking seated genius sprites", {
          timeoutInMilliseconds: 240000,
        }),
  );
  const [, setTick] = useState(0);
  useLayoutEffect(() => {
    if (handle === null) return;
    let alive = true;
    (async () => {
      for (const r of reqs) {
        await new Promise<void>((res) => setTimeout(res, 0));
        await bakeOne(r);
      }
    })().then(() => {
      if (alive) setTick((t) => t + 1);
      continueRender(handle);
    });
    return () => {
      alive = false;
    };
  }, [handle, reqs]);
};
/** fogged copies, cached by sprite x fog step. A baked sprite cannot fog its face fully and its cloth by half (as the
 *  live Genius does), so it takes 0.7 of the fog over all: rows 5 (live) and 6 (sprites) then read alike */
const SPRITE_FOG = 0.7;
const FOGGED = new Map<string, HTMLCanvasElement>();
const foggedOf = (key: string, src: HTMLCanvasElement, fog: FolkFog): HTMLCanvasElement => {
  const amt = Math.round(c01(fog.amount * SPRITE_FOG) * 32) / 32;
  if (amt <= 0) return src;
  const rgb = (typeof fog.rgb === "string" ? hexRgb(fog.rgb) : fog.rgb).map((v) => Math.round(v / 6) * 6);
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
/** the seated height (units) the LOD is judged by */
const SEATED_H = 275;
/** one seated Genius at screen (x, y) = the floor under his hips, s = screen px per unit; sprite -> dot by size */
const blitSeated = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  v: number,
  ph: number,
  fog: FolkFog,
  ra = 1,
) => {
  const hPx = SEATED_H * s;
  const spriteA = sst(10, 14, hPx);
  const dotA = 1 - sst(12, 15, hPx);
  // the dot: the module's bean at the seated height, centred on his body (+20 units)
  if (dotA > 0.003) drawGeniusDot(ctx, x + 20 * s, y, hPx, dotA * ra, fog);
  ctx.globalAlpha = ra;
  if (spriteA <= 0.003) return;
  const sc = SPRITE_SC.find((q) => q >= s / 1.15) ?? SPRITE_SC[SPRITE_SC.length - 1];
  const key = `ws|${v}|${ph}|${sc}`;
  const sp = SPRITES.get(key);
  if (!sp) return;
  const src = foggedOf(key, sp.c, fog);
  const f = s / sp.sc;
  ctx.globalAlpha = spriteA * ra;
  ctx.drawImage(src, x - sp.ax * f, y - sp.ay * f, sp.c.width * f, sp.c.height * f);
  ctx.globalAlpha = ra;
};

// ---- the screen glow (a cream radial, baked once) ----
let GLOW: HTMLCanvasElement | null = null;
const glowSprite = () => {
  if (GLOW) return GLOW;
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 64;
  const g = c.getContext("2d") as CanvasRenderingContext2D;
  const cr = hexRgb(CREAM).join(",");
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, `rgba(${cr},1)`);
  gr.addColorStop(0.5, `rgba(${cr},0.35)`);
  gr.addColorStop(1, `rgba(${cr},0)`);
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
  GLOW = c;
  return c;
};

// ===================================================================================================================
// THE CANVAS TIER: desks on the module's geometry (Desk, seat "left") and colours, drawn per row far to near
// ===================================================================================================================
type Q = [number, number];
const SCREEN = mixHex(CREAM, "#E9E0C8", 0.4);
/** the colours of one row (every part fogged by the row's depth and the part's height, as AirBox does) */
const rowInks = (A: AirWorld, Z: number) => {
  const t = (hex: string, h: number) => A.tone(hex, Z, h);
  const iron = MAT.iron;
  const shadeDark = (m: Mat) => mixHex(m.dark, PAL.shadow, 0.2);
  return {
    fog: A.fog(Z),
    lamTop: t(MAT_LAMINATE.lit, 131),
    lamFront: t(MAT_LAMINATE.mid, 131),
    lamLeft: t(mixHex(MAT_LAMINATE.lit, MAT_LAMINATE.mid, 0.35), 131),
    lamRight: t(shadeDark(MAT_LAMINATE), 131),
    lamLine: t(lineOf(MAT_LAMINATE), 131),
    legFront: t(iron.mid, 64),
    legLeft: t(mixHex(iron.lit, iron.mid, 0.35), 64),
    legRight: t(shadeDark(iron), 64),
    ironLine: t(lineOf(iron), 64),
    ironDark: t(iron.dark, 30),
    fabTop: t(MAT_FABRIC.lit, 76),
    fabFront: t(MAT_FABRIC.mid, 76),
    fabLeft: t(mixHex(MAT_FABRIC.lit, MAT_FABRIC.mid, 0.35), 172),
    fabRight: t(shadeDark(MAT_FABRIC), 172),
    fabLine: t(lineOf(MAT_FABRIC), 120),
    monFront: t(MAT_MONITOR.mid, 192),
    monRight: t(shadeDark(MAT_MONITOR), 192),
    monLine: t(lineOf(MAT_MONITOR), 192),
    keys: t(MAT_KEYS.lit, 136),
    screen: A.tone(SCREEN, Z, 190),
    mug: A.tone("#EDE3CF", Z, 143),
    // the people's fog, plus the deep haze: the far rows sink fully into the air toward the horizon
    fig: { ...A.folkFog(Z), amount: Math.min(1, A.figFog(Z) + 0.6 * sst(3000, 20000, Z)) },
  };
};
type Inks = ReturnType<typeof rowInks>;

const drawRowCanvas = (ctx: CanvasRenderingContext2D, A: AirWorld, r: number, frame: number, shift: number) => {
  const Z = rowZ(r);
  const P = A.P;
  const cam = A.cam;
  const k = cam.k;
  const sp = (X: number, Y: number, Zz: number): Q => {
    const w = P.p(X, Y, Zz);
    return [540 + shift + (w[0] - cam.cx) * k, 960 + (w[1] - cam.cy) * k];
  };
  const s = P.r(Z) * k;
  const seatedPx = SEATED_H * s;
  if (seatedPx < 1.2) return;
  const ink: Inks = rowInks(A, Z);
  // the last rows melt into the air (no edge to the floor of desks)
  const fade = 1 - sst(13000, rowZ(NROWS - 1), Z);
  if (fade <= 0.003) return;
  const RA = fade;
  ctx.globalAlpha = RA;
  const vx = P.vp[0];
  const outline = 1.1 * Math.pow(k, 0.4) * c01((s - 0.06) / 0.2);
  const rimA = (1 - ink.fog) * 0.6;
  const poly = (q: Q[], fill: string, line?: string) => {
    ctx.beginPath();
    ctx.moveTo(q[0][0], q[0][1]);
    for (let i = 1; i < q.length; i++) ctx.lineTo(q[i][0], q[i][1]);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    if (line && outline > 0.05) {
      ctx.strokeStyle = line;
      ctx.lineWidth = outline;
      ctx.lineJoin = "round";
      ctx.stroke();
    }
  };
  /** an AirBox's visible faces (top lit, left side lit-mid, right side dark, front mid) */
  const box = (
    X0: number,
    X1: number,
    Y0: number,
    Y1: number,
    Z0: number,
    Z1: number,
    c: {
      top: string;
      front: string;
      left: string;
      right: string;
      line: string;
    },
    rim = 0,
  ) => {
    if (X0 > vx) poly([sp(X0, Y0, Z0), sp(X0, Y0, Z1), sp(X0, Y1, Z1), sp(X0, Y1, Z0)], c.left, c.line);
    if (X1 < vx) poly([sp(X1, Y0, Z0), sp(X1, Y0, Z1), sp(X1, Y1, Z1), sp(X1, Y1, Z0)], c.right, c.line);
    if (Y0 > P.horizonY) poly([sp(X0, Y0, Z0), sp(X1, Y0, Z0), sp(X1, Y0, Z1), sp(X0, Y0, Z1)], c.top, c.line);
    poly([sp(X0, Y0, Z0), sp(X1, Y0, Z0), sp(X1, Y1, Z0), sp(X0, Y1, Z0)], c.front, c.line);
    if (rim > 0 && rimA * rim > 0.01 && s > 0.08) {
      const a = sp(X0, Y0, Z0);
      const b = sp(X1, Y0, Z0);
      const d = sp(X0, Y0, Z1);
      ctx.beginPath();
      ctx.moveTo(b[0], b[1]);
      ctx.lineTo(a[0], a[1]);
      ctx.lineTo(d[0], d[1]);
      ctx.strokeStyle = CREAM;
      ctx.globalAlpha = rimA * rim * RA;
      ctx.lineWidth = Math.max(0.6, outline * 1.1);
      ctx.lineCap = "round";
      ctx.stroke();
      ctx.globalAlpha = RA;
    }
  };
  const lam = {
    top: ink.lamTop,
    front: ink.lamFront,
    left: ink.lamLeft,
    right: ink.lamRight,
    line: ink.lamLine,
  };
  const leg = {
    top: ink.legLeft,
    front: ink.legFront,
    left: ink.legLeft,
    right: ink.legRight,
    line: ink.ironLine,
  };
  const fab = {
    top: ink.fabTop,
    front: ink.fabFront,
    left: ink.fabLeft,
    right: ink.fabRight,
    line: ink.fabLine,
  };
  const mon = {
    top: ink.monFront,
    front: ink.monFront,
    left: ink.monFront,
    right: ink.monRight,
    line: ink.monLine,
  };
  const glow = glowSprite();
  const shadowA = 1 - ink.fog;
  const DH = Math.round(DESK.h);
  for (let c = COL0; c <= COL1; c++) {
    const sx = colX(c);
    // cull: the workstation's screen span (chair back -60 .. desk end +180)
    const xa = sp(sx - 60, 0, Z)[0];
    const xb = sp(sx + 180, 0, Z)[0];
    if (xb < -30 || xa > 1110) continue;
    const X = sx + DESK_DX;
    const dx0 = X - DESK.d / 2;
    const dx1 = X + DESK.d / 2;
    const dz0 = Z - DESK.w / 2;
    const dz1 = Z + DESK.w / 2;
    const seed = seedOf(r, c);
    const burst = burstOf(frame, seed);
    // shadows on the floor: the desk's and the chair's
    ctx.fillStyle = PAL.shadow;
    ctx.globalAlpha = 0.16 * shadowA * RA;
    {
      const q = [
        sp(dx0 - 6, 0, dz0 - 10),
        sp(dx1 + 30, 0, dz0 - 10),
        sp(dx1 + 30, 0, dz1 + 10),
        sp(dx0 - 6, 0, dz1 + 10),
      ];
      ctx.beginPath();
      ctx.moveTo(q[0][0], q[0][1]);
      for (const v of q.slice(1)) ctx.lineTo(v[0], v[1]);
      ctx.closePath();
      ctx.fill();
      const cc = sp(sx + 10, 0, Z);
      ctx.globalAlpha = 0.2 * shadowA * RA;
      ctx.beginPath();
      ctx.ellipse(cc[0], cc[1], Math.max(0.5, 60 * s), Math.max(0.3, 22 * s), 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = RA;
    if (s > 0.05) {
      // the chair: base, column, seat, post, back (the back on the -X side: seat "left")
      if (s > 0.1) {
        box(sx - 52, sx + 52, -16, -10, Z - 4, Z + 4, leg);
        box(sx - 4, sx + 4, -16, -10, Z - 52, Z + 52, leg);
        box(sx - 4, sx + 4, -DESK.seat + 12, -16, Z - 4, Z + 4, leg);
      }
      box(sx - 44, sx + 44, -DESK.seat, -DESK.seat + 12, Z - 44, Z + 44, fab);
      box(sx - 52, sx - 44, -120, -DESK.seat, Z - 3, Z + 3, leg);
      box(sx - 52, sx - 44, -232, -112, Z - 40, Z + 40, fab);
      // the desk: two slate panel legs (near and far), the laminate top with its rim
      box(dx0 + 8, dx1 - 8, -DH + 6, 0, dz0 + 2, dz0 + 8, leg);
      box(dx0 + 8, dx1 - 8, -DH + 6, 0, dz1 - 8, dz1 - 2, leg);
      box(dx0, dx1, -DH, -DH + 6, dz0, dz1, lam, 1);
      // the keyboard, the mug
      const kbX = X - (DESK.d / 2 - 30);
      if (s > 0.08) {
        poly(
          [
            sp(kbX - 12, -DH - 4, Z - 39),
            sp(kbX + 12, -DH - 4, Z - 39),
            sp(kbX + 12, -DH - 4, Z + 39),
            sp(kbX - 12, -DH - 4, Z + 39),
          ],
          ink.keys,
          ink.ironLine,
        );
        const m = sp(kbX + 10, -DH - 9, Z + 66);
        ctx.fillStyle = ink.mug;
        ctx.fillRect(m[0] - 7.2 * s, m[1] - 9 * s, 14.4 * s, 18 * s);
      }
      // the monitor: foot, neck, panel (its screen faces the sitter, -X: seen only right of the vanishing point)
      const scX = X + 32;
      box(scX - 14, scX + 14, -DH - 2, -DH, Z - 22, Z + 22, mon);
      box(scX + 5, scX + 11, -163, -DH - 2, Z - 5, Z + 5, mon);
      const sy0 = -222;
      const sy1 = -163;
      if (scX > vx) {
        poly(
          [sp(scX, sy0, Z - 49), sp(scX, sy0, Z + 49), sp(scX, sy1, Z + 49), sp(scX, sy1, Z - 49)],
          ink.monFront,
          ink.monLine,
        );
        poly(
          [sp(scX, sy0 + 3, Z - 46), sp(scX, sy0 + 3, Z + 46), sp(scX, sy1 - 3, Z + 46), sp(scX, sy1 - 3, Z - 46)],
          ink.screen,
        );
      } else if (scX + 4 < vx) {
        poly(
          [sp(scX + 4, sy0, Z - 49), sp(scX + 4, sy0, Z + 49), sp(scX + 4, sy1, Z + 49), sp(scX + 4, sy1, Z - 49)],
          ink.monRight,
          ink.monLine,
        );
      }
      poly(
        [sp(scX, sy0, Z - 49), sp(scX + 4, sy0, Z - 49), sp(scX + 4, sy1, Z - 49), sp(scX, sy1, Z - 49)],
        ink.monFront,
        ink.monLine,
      );
    } else {
      // tiny: the desk top as a pale stroke and the screen as a cream tick
      const a = sp(dx0, -DH, Z);
      const b = sp(dx1, -DH, Z);
      ctx.strokeStyle = ink.lamTop;
      ctx.lineWidth = Math.max(0.8, 6 * s * 3);
      ctx.beginPath();
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(b[0], b[1]);
      ctx.stroke();
    }
    // the screen's glow in the air (the module's: 150 units, 0.28 at the centre), the typing ripple lifts it a little
    {
      const g = sp(X + 32, -192, Z);
      const R = Math.max(1.5, 150 * s);
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = 0.28 * (0.82 + 0.18 * burst) * (1 - ink.fog) * RA;
      ctx.drawImage(glow, g[0] - R, g[1] - R * 0.85, 2 * R, 1.7 * R);
      ctx.globalAlpha = RA;
      ctx.globalCompositeOperation = "source-over";
    }
    // the sitter (typing taps in bursts; the bursts ripple back through the rows)
    const ph = burst > 0.5 && Math.floor((frame + 7 * c + 3 * r) / 3) % 2 === 1 ? 1 : 0;
    const at = sp(sx, 0, Z);
    blitSeated(ctx, at[0], at[1], s, lookOf(r, c), ph, ink.fig, RA);
  }
};

// ===================================================================================================================
// THE LIVE TIER (rows 0-5): the module's Desk and live Geniuses
// ===================================================================================================================
const liveRow = (A: AirWorld, r: number, frame: number, shift: number): React.ReactNode[] => {
  const Z = rowZ(r);
  const P = A.P;
  const out: React.ReactNode[] = [];
  const cam = A.cam;
  const k = cam.k;
  const scr = (X: number) => 540 + shift + (P.p(X, 0, Z)[0] - cam.cx) * k;
  for (let c = COL0; c <= COL1; c++) {
    const sx = colX(c);
    if (scr(sx + 180) < -30 || scr(sx - 60) > 1110) continue;
    const X = sx + DESK_DX;
    const dz = Z - DESK.w / 2;
    const seed = seedOf(r, c);
    const burst = burstOf(frame, seed);
    const pose: GeniusPose = G.typeAtDesk(1, frame, seed);
    const { at, scale } = P.at(sx, Z);
    out.push(
      <g key={`l${r}_${c}`}>
        <Desk
          A={A}
          X={X}
          Z={dz}
          seat="left"
          uid={`wobd${r}_${c}`}
          layer="back"
          frame={frame}
          screen={0.82 + 0.18 * burst}
        />
        <Genius
          variant={lookOf(r, c)}
          pose={pose}
          at={at}
          scale={scale}
          uid={`wobg${r}_${c}`}
          frame={frame}
          fog={A.folkFog(Z)}
          unitPx={k}
        />
      </g>,
    );
  }
  return out;
};

// ===================================================================================================================
// THE PLATES (world space, YearPlate): "2030" beside the hero's head at f0, "2.5 billion" high above the floor
// ===================================================================================================================
/** 2030: deep in the air to the left (Z 4000, 2.5 m up): at f0 left of his head, ~100 px; at the end ~85 px */
/** a plate placed by where it sits on screen at a frame: (sx, sy) its centre, px its type size, Z its depth */
const plateAt = (f: number, sx: number, sy: number, px: number, Z: number) => {
  const C = camState(f);
  const d = C.D + Z;
  return {
    X: XV + ((sx - 540 - C.shift) * d) / F_LENS,
    Y: -(C.h - ((sy - C.HY) * d) / F_LENS),
    Z,
    size: (px * d) / F_LENS,
  };
};
export const PLATE_2030 = {
  ...plateAt(0, 235, 735, 100, 4000),
  f0: 0,
  dur: 12,
};
/** 2.5 billion: far and high above the floor (Z 6000, 10 m up), centred over the field at the end, ~100 px */
export const PLATE_BN = {
  ...plateAt(S_END, 540, 440, 104, 6000),
  f0: 86,
  dur: 14,
};
/** the pair: 2030 at rest centred just above "2.5 billion" at the settle (~73 px, the same depth), one group in the
 *  air. As the camera rises 2030 glides there on one continuous path (no fade): its screen place is eased from where
 *  its f0 anchor projects to where the rest anchor projects, frame by frame, so it rides the move and stays above the
 *  horizon (the far rows) the whole way. */
export const PLATE_2030_END = plateAt(S_END, 540, 340, 73, 6000);
export const GLIDE_2030: [number, number] = [12, 104];
const screenOf = (f: number, p: { X: number; Y: number; Z: number; size: number }) => {
  const C = camState(f);
  const d = C.D + p.Z;
  return {
    x: 540 + C.shift + (F_LENS * (p.X - XV)) / d,
    y: C.HY + (F_LENS * (C.h + p.Y)) / d,
    px: (p.size * F_LENS) / d,
  };
};
const smoother = (v: number) => v * v * v * (v * (v * 6 - 15) + 10);
export const plate2030At = (f: number) => {
  const u = smoother(c01((f - GLIDE_2030[0]) / (GLIDE_2030[1] - GLIDE_2030[0])));
  if (u <= 0) return PLATE_2030;
  const a = screenOf(f, PLATE_2030);
  const b = screenOf(f, PLATE_2030_END);
  const L = (p: number, q: number) => p + (q - p) * u;
  return { ...PLATE_2030, ...plateAt(f, L(a.x, b.x), L(a.y, b.y), L(a.px, b.px), L(PLATE_2030.Z, PLATE_2030_END.Z)) };
};
/** one soft shadow behind the pair: each plate's shadow as YearPlate draws it (same gradient, lift and fade), drawn
 *  together in one group whose alpha is capped at the single-plate peak, so where they overlap they merge into one
 *  shadow instead of stacking into a dark blob (apart, each is exactly the YearPlate shadow) */
const plateW = (t: string) =>
  [...t].reduce((a, ch) => a + (ch === " " ? 0.27 : /[0-9]/.test(ch) ? 0.62 : /[.,]/.test(ch) ? 0.28 : 0.52), 0);
const easeOut3 = (t: number) => 1 - Math.pow(1 - c01(t), 3);
const sstep01 = (t: number) => {
  const u = c01(t);
  return u * u * (3 - 2 * u);
};
/** the merged shadow at 70 % of a single YearPlate shadow, so the pair sits on soft air, not a dark band */
const PAIR_SHADOW = 0.7;
const PairShadow: React.FC<{
  A: AirWorld;
  plates: { X: number; Y: number; Z: number; size: number; text: string; t: number }[];
}> = ({ A, plates }) => {
  const P = A.P;
  return (
    <g filter="url(#wob-pair-cap)" opacity={PAIR_SHADOW}>
      <defs>
        <radialGradient id="wob-pair-pl">
          <stop offset="0" stopColor={PAL.shadow} stopOpacity={0.6} />
          <stop offset="0.6" stopColor={PAL.shadow} stopOpacity={0.42} />
          <stop offset="1" stopColor={PAL.shadow} stopOpacity={0} />
        </radialGradient>
        <filter id="wob-pair-cap" x="-20%" y="-40%" width="140%" height="180%" colorInterpolationFilters="sRGB">
          <feComponentTransfer>
            <feFuncA type="table" tableValues="0 0.1 0.2 0.3 0.4 0.5 0.6 0.63 0.65 0.66 0.66" />
          </feComponentTransfer>
        </filter>
      </defs>
      {plates.map((p, i) => {
        if (p.t <= 0) return null;
        const c = P.p(p.X, p.Y, p.Z);
        const s = p.size * P.r(p.Z);
        const lift = 0.5 * s * (1 - easeOut3(p.t));
        const tw = plateW(p.text) * s;
        return (
          <ellipse
            key={i}
            cx={c[0]}
            cy={c[1] + lift}
            rx={tw * 0.72 + s * 0.75}
            ry={s * 0.92}
            fill="url(#wob-pair-pl)"
            opacity={sstep01(p.t)}
          />
        );
      })}
    </g>
  );
};

// ===================================================================================================================
// THE CUT
// ===================================================================================================================
/** the floor: the style's warm sand one step lighter (cut 3's MAT_SAND), so the desks and figures read on it */
/** the hall's fog by world depth, and the people's (local colour survives on the hero's row; the rows behind sink a
 *  step at a time into the air, the orange keeping half) */
const FOG_VIS = 4500;
const FIG_FOG = { near: 150, vis: 2000, max: 0.78 };
const MAT_SAND: Mat = { lit: "#A8966F", mid: "#8E7C5C", dark: "#5E5242" };

const WorkOfBillions: React.FC<z.infer<typeof schema>> = ({ camFrame }) => {
  const frame = useCurrentFrame();
  const cf = camFrame >= 0 ? camFrame : frame;
  useSeatedSprites();
  const C = camState(cf);
  const R0 = camState(0);
  const cam = swayCam(C.cam, cf);
  const rest = swayCam(R0.cam, 0);
  const A = airWorldOf({
    cam,
    rest,
    depth: C.depth,
    frame,
    scene: { mood: "interior", eyeT: 0.17, fogVis: FOG_VIS },
    fogBy: "depth",
    figFog: FIG_FOG,
  });
  const draw = (ctx: CanvasRenderingContext2D) => {
    for (let r = NROWS - 1; r >= TIER_A; r--) drawRowCanvas(ctx, A, r, frame, C.shift);
  };
  const live: React.ReactNode[] = [];
  for (let r = TIER_A - 1; r >= 0; r--) live.push(...liveRow(A, r, frame, C.shift));
  const tr = `translate(${(C.shift / C.k).toFixed(4)} 0)`;
  const p2030 = plate2030At(cf);
  const t2030 = yearPlateT(frame, PLATE_2030.f0, PLATE_2030.dur);
  const tBn = yearPlateT(frame, PLATE_BN.f0, PLATE_BN.dur);
  return (
    <AirStage v={A.v} bloom={0.22} shafts={0.3}>
      <WorldSvg cam={cam}>
        <g transform={tr}>
          <AirFloor
            A={A}
            x0={-24000}
            x1={24000}
            z0={-20000}
            z1={30000}
            mat={MAT_SAND}
            course={0.6 * U}
            plank={0.6 * U}
            jointAmt={0.6}
            melt={0.5}
          />
        </g>
        <AirHorizonHazeW A={A} id="wob-haze" />
      </WorldSvg>
      <FolkCanvas draw={draw} />
      {/* the horizon haze again over the canvas rows: the far desks sink into the air at the horizon */}
      <WorldSvg cam={cam}>
        <AirHorizonHazeW A={A} id="wob-haze2" strength={0.75} />
      </WorldSvg>
      <WorldSvg cam={cam}>
        <g transform={tr}>{live}</g>
      </WorldSvg>
      <WorldSvg cam={cam}>
        <g transform={tr}>
          <PairShadow
            A={A}
            plates={[
              { ...p2030, text: "2030", t: t2030 },
              { ...PLATE_BN, text: "2.5 billion", t: tBn },
            ]}
          />
          <YearPlate
            A={A}
            X={PLATE_BN.X}
            Y={PLATE_BN.Y}
            Z={PLATE_BN.Z}
            text="2.5 billion"
            t={tBn}
            uid="wob-pbn"
            size={PLATE_BN.size}
            plate={0}
          />
          <YearPlate
            A={A}
            X={p2030.X}
            Y={p2030.Y}
            Z={p2030.Z}
            text="2030"
            t={t2030}
            uid="wob-p2030"
            size={p2030.size}
            plate={0}
          />
        </g>
      </WorldSvg>
    </AirStage>
  );
};

export default WorkOfBillions;
