// workOfBillionsParts: the drawing of cut 45 WorkOfBillions (rsi-ten-earths, revision 1), on the world and camera of
// workOfBillionsWorld.ts. Everything here is pure per frame (seek-safe): the air on the shift-lens eye, the seated
// robot sprites (this cut's bake of BOT_POSES.typeAtDesk with the module's own BotPaint), the office storeys seen
// through the glass, the hero's building, the city of blocks (LOD by screen size), the cloud layer, the city lights on
// the globe. Shared modules are imported read-only (tenEarthsBot, tenEarthsHall, tenEarthsGlobe, the kit).
import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import { continueRender, delayRender } from "remotion";
// @ts-expect-error react-dom ships no types for its server entry here (nothing may be installed); typed below
import * as ReactDomServer from "react-dom/server";
import { AIR, ACCENT, ACCENT_DEEP, MAT, c01, hexRgb, lineOf, makeAirView, mixHex, rgbHex, type AirScene, type AirWorld, type Cam, type DepthOpts, type Mat } from "../kits/dwarkesh-3d/dwarkesh3d";
import { perspective } from "../kits/dwarkesh-3d/dwarkesh3d";
import { CREAM, MAT_FABRIC, MAT_FLOOR, MAT_HALLWALL, MAT_KEYS, MAT_LAMINATE, MAT_MONITOR, MAT_OATMEAL, MAT_ROOF, MAT_UNIT } from "./tenEarthsHall";
import { BOT_POSES, BotPaint, blitBot, buildBot, drawBotDot, type FolkFog, type Sprite } from "./tenEarthsBot";
import { drawGlobe, globePoint, type GlobeSpec } from "./tenEarthsGlobe";
import { LIGHTS_B64, LIGHTS_N } from "./workOfBillionsLights";
import {
  BLOCK,
  BPITCH,
  COL0,
  COL1,
  DESK_DX,
  F,
  H_BLD,
  LIVE_COLS,
  LOT,
  MULLION_PITCH,
  NROWS,
  PILLAR_M,
  PILLAR_ROWS,
  PILLAR_W,
  SILL0,
  STOREY_MAX,
  STOREY_MIN,
  YS,
  LAMBDA_SWAP,
  glassBottom,
  X_B0,
  X_B1,
  X_I0,
  X_I1,
  Z_BACK,
  Z_BB,
  Z_FACADE,
  Z_GLASS,
  blockAlive,
  blockX0,
  blockZ0,
  colX,
  hash01,
  lotBuilding,
  mullionXs,
  pillarX,
  rowZ,
  sst,
  storeyCeil,
  storeyFloor,
  type Bld,
  type Eye,
} from "./workOfBillionsWorld";

const renderToStaticMarkup = (ReactDomServer as { renderToStaticMarkup: (el: React.ReactElement) => string }).renderToStaticMarkup;
const PAL = AIR.A;
type Q = [number, number];

// ===================================================================================================================
// THE AIR ON THE EYE (the kit's airWorldOf, with the fog scaled to the eye's distance: one medium at every power of ten)
// ===================================================================================================================
/** the backdrop's horizon row (the medium's light gradient; the geometric horizon is the eye's own) */
export const AIR_HORIZON = 700;
export const camOfEye = (e: Eye): { cam: Cam; depth: DepthOpts } => {
  const k = F / e.Dr;
  return { cam: { k, cx: 0, cy: -e.He - (e.yh - 960) / k }, depth: { eyeY: -e.He, dRef: e.Dr, kRef: k, dolly: 0 } };
};
export const airOfEye = (e: Eye, frame: number, o: { fogMul?: number; eyeT?: number; motes?: { y: number; z: number }; horizon?: number } = {}): AirWorld => {
  const { cam, depth } = camOfEye(e);
  const P = perspective(cam, depth);
  const scene: AirScene = {
    look: "A",
    mood: "day",
    F,
    fogNear: 0.45 * e.Dr,
    fogVis: 3.2 * e.Dr * (o.fogMul ?? 1),
    fogMax: 0.9,
    hLow: 0,
    hHigh: Math.max(1250, 2 * e.He + 600),
    moteUnit: 1,
    eyeT: o.eyeT,
  };
  const v = makeAirView({ scene, frame, horizon: o.horizon ?? AIR_HORIZON, cam: { x: 0, y: o.motes?.y ?? 0, z: o.motes?.z ?? 0 }, rest: { x: 0, y: 0, z: 0 } });
  const Dc = P.Dc;
  const fog = (Z: number) => c01(v.fogAt(Dc + Z));
  const airHex = (Z: number, h = 0) => rgbHex(v.airAt(Dc + Z, h));
  const tone = (hex: string, Z: number, h = 0) => mixHex(hex, airHex(Z, h), fog(Z));
  const toneO = (hex: string, Z: number, h = 0) => mixHex(hex, airHex(Z, h), 0.5 * fog(Z));
  const ff = { near: 300, vis: 2600, max: 0.7 };
  const figFog = (Z: number) => ff.max * (1 - Math.exp(-Math.max(0, Z - ff.near) / ff.vis));
  const folkFog = (Z: number, feetH = 0): FolkFog => ({ rgb: airHex(Z, feetH + 150), amount: Math.max(figFog(Z), fog(Z)) });
  const toSY = (wy: number) => 960 + (wy - cam.cy) * cam.k;
  return {
    v,
    P,
    cam,
    Dc,
    k: cam.k,
    fog,
    airHex,
    tone,
    toneO,
    screenAir: (wy) => rgbHex(v.airAtScreen(toSY(wy))),
    figFog,
    folkFog,
    workerInks: () => {
      throw new Error("not used");
    },
    lw: (b = 1.1) => b / Math.pow(cam.k, 0.6),
  } as AirWorld;
};

// ===================================================================================================================
// A CPU CANVAS (thousands of small polygons raster faster on the CPU path, as the globe found)
// ===================================================================================================================
export const CpuCanvas: React.FC<{ draw: (ctx: CanvasRenderingContext2D) => void; style?: React.CSSProperties }> = ({ draw, style }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, 1080, 1920);
    draw(ctx);
    ctx.globalAlpha = 1;
  });
  return <canvas ref={ref} width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, ...style }} />;
};

// ===================================================================================================================
// SEATED ROBOT SPRITES (typeAtDesk, facing +X, the module's own paint baked once per render tab)
// ===================================================================================================================
const SPRITE_SC = [0.06, 0.12, 0.24, 0.48, 0.96, 1.5];
const PHASE_FRAMES = [30, 33, 36];
type SeatSprite = { c: HTMLCanvasElement; ax: number; ay: number; sc: number };
const SEATS = new Map<string, SeatSprite>();
type SeatReq = { key: string; v: number; ph: number; sc: number };
const seatReqs = (): SeatReq[] => {
  const out: SeatReq[] = [];
  for (const sc of SPRITE_SC) for (let v = 1; v < 5; v++) for (let ph = 0; ph < PHASE_FRAMES.length; ph++) out.push({ key: `wb|${v}|${ph}|${sc}`, v, ph, sc });
  return out;
};
const bakeSeat = (r: SeatReq): Promise<void> => {
  if (SEATS.has(r.key)) return Promise.resolve();
  const pad = 6;
  const ax = Math.ceil(72 * r.sc + pad);
  const ay = Math.ceil(300 * r.sc + pad);
  const W = Math.ceil(ax + 96 * r.sc + pad);
  const H = Math.ceil(ay + 8 * r.sc + pad);
  const shapes = buildBot(r.v, BOT_POSES.typeAtDesk(1, PHASE_FRAMES[r.ph], 0), { frame: PHASE_FRAMES[r.ph] }).shapes;
  const svg = renderToStaticMarkup(
    <svg xmlns="http://www.w3.org/2000/svg" width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <BotPaint shapes={shapes} at={[ax, ay]} scale={r.sc} uid={`wbs${r.v}${r.ph}${Math.round(r.sc * 100)}`} unitPx={1} />
    </svg>,
  );
  return new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = W;
      c.height = H;
      (c.getContext("2d") as CanvasRenderingContext2D).drawImage(img, 0, 0);
      SEATS.set(r.key, { c, ax, ay, sc: r.sc });
      resolve();
    };
    img.onerror = () => resolve();
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
};
export const useSeatSprites = () => {
  const reqs = useMemo(() => seatReqs(), []);
  const ready = reqs.every((r) => SEATS.has(r.key));
  const [handle] = useState(() => (ready ? null : delayRender("baking seated robot sprites", { timeoutInMilliseconds: 240000 })));
  const [, setTick] = useState(0);
  useLayoutEffect(() => {
    if (handle === null) return;
    let alive = true;
    (async () => {
      for (const r of reqs) {
        await new Promise<void>((res) => setTimeout(res, 0));
        await bakeSeat(r);
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
const FOGGED = new Map<string, HTMLCanvasElement>();
const foggedOf = (key: string, src: HTMLCanvasElement, fog: FolkFog, mul: number): HTMLCanvasElement => {
  const amt = Math.round(c01(fog.amount * mul) * 32) / 32;
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
/** the seated height (soles of the chair to the head top, units) the LOD is judged by */
const SEATED_H = 275;
/** one seated robot: (x, y) = the floor under its hips on screen, s = px per unit */
const blitSeated = (ctx: CanvasRenderingContext2D, x: number, y: number, s: number, v: number, ph: number, fog: FolkFog, a = 1) => {
  const hPx = SEATED_H * s;
  if (hPx < 5) {
    // a speck of orange (the robot's body) at its seat
    ctx.globalAlpha = a * sst(1.2, 5, hPx);
    ctx.fillStyle = mixHex(ACCENT, typeof fog.rgb === "string" ? fog.rgb : rgbHex(fog.rgb), 0.5 * fog.amount);
    const w = Math.max(0.8, 60 * s);
    ctx.fillRect(x - w * 0.3, y - 210 * s, w, 130 * s + 0.6);
    ctx.globalAlpha = a;
    return;
  }
  const sc = SPRITE_SC.find((q) => q >= s / 1.15) ?? SPRITE_SC[SPRITE_SC.length - 1];
  const key = `wb|${v}|${ph}|${sc}`;
  const sp = SEATS.get(key);
  if (!sp) return;
  const src = foggedOf(key, sp.c, fog, 0.6);
  const f = s / sp.sc;
  ctx.globalAlpha = a;
  ctx.drawImage(src, x - sp.ax * f, y - sp.ay * f, sp.c.width * f, sp.c.height * f);
};

// ---- the screen glow (a cream radial) and the window light (an orange radial), baked once ----
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
// THE PAINTER (projection, near clipping, polygons) for one frame
// ===================================================================================================================
type V3 = [number, number, number];
export type Painter = {
  e: Eye;
  A: AirWorld;
  dmin: number;
  sp: (X: number, Y: number, Z: number) => Q;
  sc: (Z: number) => number;
  poly: (ctx: CanvasRenderingContext2D, pts: V3[], fill: string, line?: string, lw?: number) => boolean;
};
export const painterOf = (e: Eye, A: AirWorld): Painter => {
  const dmin = Math.max(4, 0.015 * e.Dr);
  const sp = (X: number, Y: number, Z: number): Q => {
    const s = F / (e.Dr + Z);
    return [540 + X * s, e.yh + (Y + e.He) * s];
  };
  const sc = (Z: number) => F / (e.Dr + Z);
  const clip = (pts: V3[]): V3[] => {
    const out: V3[] = [];
    const lim = dmin - e.Dr;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      const ina = a[2] >= lim;
      const inb = b[2] >= lim;
      if (ina) out.push(a);
      if (ina !== inb) {
        const t = (lim - a[2]) / (b[2] - a[2]);
        out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, lim]);
      }
    }
    return out;
  };
  const poly = (ctx: CanvasRenderingContext2D, pts: V3[], fill: string, line?: string, lw = 1) => {
    let q = pts;
    if (pts.some((p) => p[2] < dmin - e.Dr)) {
      q = clip(pts);
      if (q.length < 3) return false;
    }
    ctx.beginPath();
    for (let i = 0; i < q.length; i++) {
      const p = sp(q[i][0], q[i][1], q[i][2]);
      if (i === 0) ctx.moveTo(p[0], p[1]);
      else ctx.lineTo(p[0], p[1]);
    }
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    if (line && lw > 0.05) {
      ctx.strokeStyle = line;
      ctx.lineWidth = lw;
      ctx.lineJoin = "round";
      ctx.stroke();
    }
    return true;
  };
  return { e, A, dmin, sp, sc, poly };
};
const shadeDark = (m: Mat) => mixHex(m.dark, PAL.shadow, 0.2);

/** an air-lit box (AirBox's faces, on the canvas): top lit, inner side mid-lit / dark, front mid; near-clipped */
const boxC = (ctx: CanvasRenderingContext2D, Pn: Painter, X0: number, X1: number, Y0: number, Y1: number, Z0: number, Z1: number, c: { top: string; front: string; left: string; right: string; line?: string }, lw = 0) => {
  const e = Pn.e;
  if (e.Dr + Z1 < Pn.dmin) return;
  if (X0 > 0) Pn.poly(ctx, [[X0, Y0, Z0], [X0, Y0, Z1], [X0, Y1, Z1], [X0, Y1, Z0]], c.left, c.line, lw);
  if (X1 < 0) Pn.poly(ctx, [[X1, Y0, Z0], [X1, Y0, Z1], [X1, Y1, Z1], [X1, Y1, Z0]], c.right, c.line, lw);
  if (Y0 > -e.He) Pn.poly(ctx, [[X0, Y0, Z0], [X1, Y0, Z0], [X1, Y0, Z1], [X0, Y0, Z1]], c.top, c.line, lw);
  if (e.Dr + Z0 >= Pn.dmin) Pn.poly(ctx, [[X0, Y0, Z0], [X1, Y0, Z0], [X1, Y1, Z0], [X0, Y1, Z0]], c.front, c.line, lw);
};

// ===================================================================================================================
// THE OFFICE STOREY (seen through the glass, clipped to its opening)
// ===================================================================================================================
const SCREEN = mixHex(CREAM, "#E9E0C8", 0.4);
/** the warm light the robots of the other storeys sink into (an orange, so the silhouettes stay the AIs' colour) */
const GLASS_WARM = mixHex(ACCENT, "#E8A048", 0.5);
/** the window's glass opening of storey i on screen (x0, y0, x1, y1) */
export const openingOf = (Pn: Painter, i: number) => {
  const yTop = storeyCeil(i);
  const yBot = glassBottom(i);
  const a = Pn.sp(X_I0, yTop, Z_GLASS);
  const b = Pn.sp(X_I1, yBot, Z_GLASS);
  return { x0: a[0], y0: a[1], x1: b[0], y1: b[1] };
};
export const burstOf = (frame: number, seed: number) => sst(0.25, 0.45, 0.5 + 0.5 * Math.sin(frame * 0.09 + seed * 2));
/** the crowd's looks (v1..v4: v0 is THE robot, the hero's alone) */
export const lookOf = (j: number, c: number, i: number) => 1 + Math.floor(hash01(j * 13.1 + c * 7.3 + i * 3.7 + 0.4) * 4);
export const seedOf = (j: number, c: number, i: number) => -0.55 * j + 0.9 * hash01(j * 5.7 + c * 11.3 + i * 2.1);

/** the shell of a storey: back wall, side walls, ceiling (from below), floor (from above) */
const drawShell = (ctx: CanvasRenderingContext2D, Pn: Painter, i: number) => {
  const { A, e } = Pn;
  const yf = storeyFloor(i);
  const yc = storeyCeil(i);
  const hm = -(yf + yc) / 2;
  const zm = (Z_GLASS + Z_BACK) / 2;
  // back wall (a light oatmeal plaster)
  Pn.poly(ctx, [[X_I0, yc, Z_BACK], [X_I1, yc, Z_BACK], [X_I1, yf, Z_BACK], [X_I0, yf, Z_BACK]], A.tone(mixHex(MAT_OATMEAL.mid, MAT_OATMEAL.lit, 0.3), Z_BACK, hm));
  // side walls' inner faces
  Pn.poly(ctx, [[X_I0, yc, Z_GLASS], [X_I0, yc, Z_BACK], [X_I0, yf, Z_BACK], [X_I0, yf, Z_GLASS]], A.tone(MAT_OATMEAL.mid, zm, hm));
  Pn.poly(ctx, [[X_I1, yc, Z_GLASS], [X_I1, yc, Z_BACK], [X_I1, yf, Z_BACK], [X_I1, yf, Z_GLASS]], A.tone(mixHex(MAT_OATMEAL.mid, MAT_OATMEAL.dark, 0.35), zm, hm));
  // the ceiling, seen from below, with rows of linear cream lights
  if (yc < -e.He) {
    const N = 6;
    for (let k = 0; k < N; k++) {
      const za = Z_GLASS + ((Z_BACK - Z_GLASS) * k) / N;
      const zb = Z_GLASS + ((Z_BACK - Z_GLASS) * (k + 1)) / N;
      Pn.poly(ctx, [[X_I0, yc, za], [X_I1, yc, za], [X_I1, yc, zb + 2], [X_I0, yc, zb + 2]], A.tone(mixHex(MAT_HALLWALL.mid, MAT_OATMEAL.mid, 0.5), (za + zb) / 2, -yc));
    }
    for (let z = Z_GLASS + 420; z < Z_BACK - 100; z += 640) {
      const s = Pn.sc(z);
      if (s * 30 < 0.4) continue;
      Pn.poly(ctx, [[X_I0 + 300, yc + 1, z - 16], [X_I1 - 300, yc + 1, z - 16], [X_I1 - 300, yc + 1, z + 16], [X_I0 + 300, yc + 1, z + 16]], A.tone(CREAM, z, -yc));
    }
  }
  // the floor, seen from above (0.6 m tiles: a tone by depth, joints only near)
  if (yf > -e.He) {
    const N = 10;
    for (let k = 0; k < N; k++) {
      const za = Z_GLASS + ((Z_BACK - Z_GLASS) * Math.pow(k / N, 1.3));
      const zb = Z_GLASS + ((Z_BACK - Z_GLASS) * Math.pow((k + 1) / N, 1.3));
      Pn.poly(ctx, [[X_I0, yf, za], [X_I1, yf, za], [X_I1, yf, zb + 2], [X_I0, yf, zb + 2]], A.tone(mixHex(MAT_FLOOR.lit, MAT_FLOOR.mid, 0.35), (za + zb) / 2, -yf));
    }
    const s0 = Pn.sc(Z_GLASS);
    if (s0 * 107 > 6) {
      ctx.strokeStyle = A.tone(lineOf(MAT_FLOOR), 800, -yf);
      ctx.globalAlpha = 0.3 * sst(6, 20, s0 * 107);
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = Math.ceil(X_I0 / 107) * 107; x < X_I1; x += 107) {
        const a = Pn.sp(x, yf, Math.max(Z_GLASS, -e.Dr + Pn.dmin));
        const b = Pn.sp(x, yf, Z_BACK);
        ctx.moveTo(a[0], a[1]);
        ctx.lineTo(b[0], b[1]);
      }
      for (let z = Z_GLASS + 107; z < Z_BACK; z += 107) {
        if (Pn.sc(z) * 107 < 3) break;
        const a = Pn.sp(X_I0, yf, z);
        const b = Pn.sp(X_I1, yf, z);
        ctx.moveTo(a[0], a[1]);
        ctx.lineTo(b[0], b[1]);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }
};

/** one workstation on the canvas (the module's Desk "left" geometry and colours), its robot after it */
const drawWorkstation = (ctx: CanvasRenderingContext2D, Pn: Painter, Xr: number, Z: number, yf: number, frame: number, look: number, seed: number, glassy = false) => {
  const { A } = Pn;
  const s = Pn.sc(Z);
  const t = (hex: string, h: number) => A.tone(hex, Z, h - yf);
  const iron = MAT.iron;
  const X = Xr + DESK_DX;
  const dx0 = X - 62.5;
  const dx1 = X + 62.5;
  const dz0 = Z - 124.5;
  const dz1 = Z + 124.5;
  const burst = burstOf(frame, seed);
  const lam = { top: t(MAT_LAMINATE.lit, 131), front: t(MAT_LAMINATE.mid, 131), left: t(mixHex(MAT_LAMINATE.lit, MAT_LAMINATE.mid, 0.35), 131), right: t(shadeDark(MAT_LAMINATE), 131), line: t(lineOf(MAT_LAMINATE), 131) };
  const leg = { top: t(mixHex(iron.lit, iron.mid, 0.35), 64), front: t(iron.mid, 64), left: t(mixHex(iron.lit, iron.mid, 0.35), 64), right: t(shadeDark(iron), 64), line: t(lineOf(iron), 64) };
  const fab = { top: t(MAT_FABRIC.lit, 76), front: t(MAT_FABRIC.mid, 76), left: t(mixHex(MAT_FABRIC.lit, MAT_FABRIC.mid, 0.35), 172), right: t(shadeDark(MAT_FABRIC), 172), line: t(lineOf(MAT_FABRIC), 120) };
  const monC = t(MAT_MONITOR.mid, 192);
  const mon = { top: monC, front: monC, left: monC, right: t(shadeDark(MAT_MONITOR), 192), line: t(lineOf(MAT_MONITOR), 192) };
  const lw = s > 0.12 ? 1.1 * Math.pow(s, 0.4) : 0;
  const Y = (y: number) => yf + y;
  if (s * 125 < 2.5) {
    // tiny: the desk top as a pale stroke
    const a = Pn.sp(dx0, Y(-134), Z);
    const b = Pn.sp(dx1, Y(-134), Z);
    ctx.strokeStyle = lam.top;
    ctx.lineWidth = Math.max(0.7, 18 * s);
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.stroke();
  } else {
    // shadows on the floor (the desk's and the chair's)
    ctx.globalAlpha = 0.16 * (1 - A.fog(Z));
    Pn.poly(ctx, [[dx0 - 6, Y(0), dz0 - 10], [dx1 + 30, Y(0), dz0 - 10], [dx1 + 30, Y(0), dz1 + 10], [dx0 - 6, Y(0), dz1 + 10]], PAL.shadow);
    ctx.globalAlpha = 1;
    if (s > 0.1) {
      boxC(ctx, Pn, Xr - 52, Xr + 52, Y(-16), Y(-10), Z - 4, Z + 4, leg, lw);
      boxC(ctx, Pn, Xr - 4, Xr + 4, Y(-16), Y(-10), Z - 52, Z + 52, leg, lw);
      boxC(ctx, Pn, Xr - 4, Xr + 4, Y(-70), Y(-16), Z - 4, Z + 4, leg, lw);
    }
    boxC(ctx, Pn, Xr - 44, Xr + 44, Y(-82), Y(-70), Z - 44, Z + 44, fab, lw);
    boxC(ctx, Pn, Xr - 52, Xr - 44, Y(-120), Y(-82), Z - 3, Z + 3, leg, lw);
    boxC(ctx, Pn, Xr - 52, Xr - 44, Y(-232), Y(-112), Z - 40, Z + 40, fab, lw);
    boxC(ctx, Pn, dx0 + 8, dx1 - 8, Y(-128), Y(0), dz0 + 2, dz0 + 8, leg, lw);
    boxC(ctx, Pn, dx0 + 8, dx1 - 8, Y(-128), Y(0), dz1 - 8, dz1 - 2, leg, lw);
    boxC(ctx, Pn, dx0, dx1, Y(-134), Y(-128), dz0, dz1, lam, lw);
    if (s > 0.08) {
      const kbX = X - 32.5;
      Pn.poly(ctx, [[kbX - 12, Y(-138), Z - 39], [kbX + 12, Y(-138), Z - 39], [kbX + 12, Y(-138), Z + 39], [kbX - 12, Y(-138), Z + 39]], t(MAT_KEYS.lit, 136), leg.line, lw);
      const m = Pn.sp(kbX + 10, Y(-143), Z + 66);
      ctx.fillStyle = t("#EDE3CF", 143);
      ctx.fillRect(m[0] - 7.2 * s, m[1] - 9 * s, 14.4 * s, 18 * s);
    }
    const scX = X + 32;
    boxC(ctx, Pn, scX - 14, scX + 14, Y(-136), Y(-134), Z - 22, Z + 22, mon, lw);
    boxC(ctx, Pn, scX + 5, scX + 11, Y(-163), Y(-136), Z - 5, Z + 5, mon, lw);
    if (scX > 0) {
      Pn.poly(ctx, [[scX, Y(-222), Z - 49], [scX, Y(-222), Z + 49], [scX, Y(-163), Z + 49], [scX, Y(-163), Z - 49]], mon.front, mon.line, lw);
      Pn.poly(ctx, [[scX, Y(-219), Z - 46], [scX, Y(-219), Z + 46], [scX, Y(-166), Z + 46], [scX, Y(-166), Z - 46]], A.tone(SCREEN, Z, 190 - yf));
    } else {
      Pn.poly(ctx, [[scX + 4, Y(-222), Z - 49], [scX + 4, Y(-222), Z + 49], [scX + 4, Y(-163), Z + 49], [scX + 4, Y(-163), Z - 49]], mon.right, mon.line, lw);
    }
    Pn.poly(ctx, [[scX, Y(-222), Z - 49], [scX + 4, Y(-222), Z - 49], [scX + 4, Y(-163), Z - 49], [scX, Y(-163), Z - 49]], mon.front, mon.line, lw);
  }
  // the screen's glow in the air
  {
    const g = Pn.sp(X + 32, Y(-192), Z);
    const R = Math.max(1.5, 150 * s);
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = 0.26 * (0.82 + 0.18 * burst) * (1 - A.fog(Z));
    ctx.drawImage(glowSprite(), g[0] - R, g[1] - R * 0.85, 2 * R, 1.7 * R);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }
  // the robot (tapping in bursts that ripple back through the rows)
  const ph = burst > 0.5 ? Math.floor((frame + 7 * look + seed * 9) / 3) % 3 : 0;
  const at = Pn.sp(Xr, Y(0), Z);
  // the other storeys are seen through their glass in the warm light of the room: the robots read as warm orange
  // silhouettes (no faces: they may cross the caption bands), the hero's storey alone in full detail
  const ff = A.folkFog(Z, -yf);
  blitSeated(ctx, at[0], at[1], s, look, ph, glassy ? { rgb: GLASS_WARM, amount: Math.max(ff.amount / 0.6, 1.5) } : ff);
};

/** a structural pillar (concrete, oatmeal) from floor to ceiling */
const drawPillar = (ctx: CanvasRenderingContext2D, Pn: Painter, X: number, Z: number, yf: number, yc: number) => {
  const { A } = Pn;
  const hm = -(yf + yc) / 2;
  const m = MAT_OATMEAL;
  const c = { top: A.tone(m.lit, Z, hm), front: A.tone(mixHex(m.mid, m.lit, 0.25), Z, hm), left: A.tone(mixHex(m.lit, m.mid, 0.35), Z, hm), right: A.tone(shadeDark(m), Z, hm), line: A.tone(lineOf(m), Z, hm) };
  boxC(ctx, Pn, X - PILLAR_W / 2, X + PILLAR_W / 2, yc, yf, Z - PILLAR_W / 2, Z + PILLAR_W / 2, c, Pn.sc(Z) > 0.1 ? 1 : 0);
};

/** the interior of storey i through its glass (clipped); `skipLive`: the hero row's live columns and pillar */
export const drawStorey = (ctx: CanvasRenderingContext2D, Pn: Painter, i: number, frame: number, skipLive: boolean) => {
  const o = openingOf(Pn, i);
  const oh = o.y1 - o.y0;
  if (oh < 10 || o.y1 < 0 || o.y0 > 1920 || o.x1 < 0 || o.x0 > 1080) return;
  const yf = storeyFloor(i);
  const yc = storeyCeil(i);
  ctx.save();
  ctx.beginPath();
  ctx.rect(o.x0, Math.max(-10, o.y0), o.x1 - o.x0, Math.min(1930, o.y1) - Math.max(-10, o.y0));
  ctx.clip();
  drawShell(ctx, Pn, i);
  const e = Pn.e;
  for (let j = NROWS - 1; j >= 0; j--) {
    const Z = rowZ(j);
    const s = Pn.sc(Z);
    // the row's screen band (floor .. head top) against the opening
    const yA = e.yh + (yf - 300 + e.He) * s;
    const yB = e.yh + (yf + e.He) * s;
    if (yB < o.y0 - 2 || yA > o.y1 + 2) continue;
    const items: { X: number; draw: () => void }[] = [];
    for (let c = COL0; c <= COL1; c++) {
      const Xr = colX(c, j);
      if (Xr - 60 < X_I0 || Xr + 180 > X_I1) continue;
      if (skipLive && j === 0 && LIVE_COLS.includes(c)) continue;
      const xa = 540 + (Xr - 60) * s;
      const xb = 540 + (Xr + 180) * s;
      if (xb < o.x0 - 4 || xa > o.x1 + 4) continue;
      items.push({ X: Xr + 60, draw: () => drawWorkstation(ctx, Pn, Xr, Z, yf, frame, lookOf(j, c, i), seedOf(j, c, i), i !== 0) });
    }
    if (PILLAR_ROWS.includes(j))
      for (const m of PILLAR_M) {
        if (skipLive && j === 0 && m === 0) continue;
        const X = pillarX(m);
        items.push({ X, draw: () => drawPillar(ctx, Pn, X, Z, yf, yc) });
      }
    // outside-in toward the vanishing point (X = 0)
    items.sort((a, b) => Math.abs(b.X) - Math.abs(a.X));
    for (const it of items) it.draw();
  }
  ctx.restore();
};

// ===================================================================================================================
// WINDOW BANDS (every other building, and the hero's storeys once small): warm light, rows of little robots
// ===================================================================================================================
/** the rooms behind the glass: a dim warm neutral (the robots are the only orange in them) */
const WIN_ROOM = "#6E6456";
type BotGet = (key: string) => Sprite | undefined;
/** one storey's window band on a front face at depth Z, screen rect (x0..x1, y0..y1): a dim room, its robots standing
 *  in it with their backs to us (orange); too small for figures, a row of orange specks */
const drawBand = (ctx: CanvasRenderingContext2D, A: AirWorld, get: BotGet | null, Z: number, h: number, x0: number, x1: number, y0: number, y1: number, s: number, seed: number, frame: number) => {
  const bh = y1 - y0;
  if (bh <= 0.25 || x1 - x0 <= 0.25) return;
  ctx.fillStyle = A.tone(WIN_ROOM, Z, h);
  ctx.fillRect(x0, y0, x1 - x0, bh);
  const pitch = 320 * s;
  if (bh < 7 || !get || pitch < 3.5) {
    // specks: one per robot place, every ~1.8 m (at least 3 px apart)
    const step = Math.max(3, pitch);
    const sz = Math.max(0.8, Math.min(bh * 0.55, 0.3 * step));
    ctx.fillStyle = A.toneO(ACCENT, Z, h);
    let k = 0;
    for (let x = x0 + step * (0.3 + 0.4 * hash01(seed)); x < x1 - 0.5; x += step) {
      k++;
      if (hash01(seed + k * 1.3) < 0.25) continue;
      ctx.fillRect(x - sz / 2, y1 - bh * 0.1 - sz * 1.4, sz, sz * 1.4);
    }
    return;
  }
  // the ceiling light line
  ctx.fillStyle = A.tone(mixHex(CREAM, WIN_ROOM, 0.3), Z, h);
  ctx.globalAlpha = 0.5;
  ctx.fillRect(x0, y0, x1 - x0, Math.max(0.6, bh * 0.06));
  ctx.globalAlpha = 1;
  // robots, every ~1.8 m along the band, standing (backs to the glass), feet on the band's floor
  const hPx = bh * 0.48;
  if (hPx < 4) return;
  const fog = A.folkFog(Z, h);
  let k = 0;
  for (let x = x0 + pitch * (0.35 + 0.3 * hash01(seed)); x < x1 - pitch * 0.2; x += pitch) {
    k++;
    const jit = (hash01(seed + k * 1.7) - 0.5) * pitch * 0.4;
    blitBot(ctx, get, x + jit, y1 - bh * 0.04, hPx * (0.92 + 0.12 * hash01(seed + k * 3.3)), { view: "back", variant: 1 + Math.floor(hash01(seed + k * 2.9) * 4), fog });
  }
  void frame;
};

// ---- the city's windows: a baked tile of 4 x 3 window cells (dim rooms, a robot speck in most), at mip sizes ---------
const WCOLS = 4;
const WROWS = 3;
const WIN_MIPS = [4, 8, 16, 32, 64];
const WIN_TILES = new Map<number, HTMLCanvasElement>();
const winTile = (cell: number) => {
  const hit = WIN_TILES.get(cell);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = cell * WCOLS;
  c.height = cell * WROWS;
  const g = c.getContext("2d") as CanvasRenderingContext2D;
  for (let r = 0; r < WROWS; r++)
    for (let q = 0; q < WCOLS; q++) {
      const x0 = q * cell + 0.16 * cell;
      const w = 0.68 * cell;
      const y0 = r * cell + 0.18 * cell;
      const h = 0.62 * cell;
      g.fillStyle = WIN_ROOM;
      g.fillRect(x0, y0, w, h);
      g.fillStyle = mixHex(CREAM, WIN_ROOM, 0.35);
      g.fillRect(x0, y0, w, Math.max(0.5, 0.07 * h));
      const hv = hash01(r * 7.1 + q * 3.3 + 0.1);
      if (hv < 0.22) continue;
      // a robot: an orange bean with a head block (the dot LOD's shape), standing in the room
      const bx = x0 + w * (0.22 + 0.56 * hash01(r * 5.3 + q * 9.1 + 0.7));
      const bw = Math.max(1.6, 0.26 * cell);
      const bh = Math.max(2, 0.36 * cell);
      const yb = y0 + h;
      g.fillStyle = ACCENT;
      g.fillRect(bx - bw / 2, yb - bh, bw, bh);
      g.fillStyle = ACCENT_DEEP;
      g.fillRect(bx - bw * 0.6, yb - bh - 0.14 * cell, bw * 1.2, Math.max(0.6, 0.15 * cell));
    }
  WIN_TILES.set(cell, c);
  return c;
};
const WIN_PATS = new WeakMap<CanvasRenderingContext2D, Map<number, CanvasPattern>>();
const winPattern = (ctx: CanvasRenderingContext2D, cell: number) => {
  let m = WIN_PATS.get(ctx);
  if (!m) {
    m = new Map();
    WIN_PATS.set(ctx, m);
  }
  let p = m.get(cell);
  if (!p) {
    p = ctx.createPattern(winTile(cell), "repeat") as CanvasPattern;
    m.set(cell, p);
  }
  return p;
};
/** a facade's windows on screen: rect x0..x1, yT..yB, window cells cw x ch px (a storey high); orange = the robots */
const drawWindows = (ctx: CanvasRenderingContext2D, A: AirWorld, Z: number, h: number, x0: number, x1: number, yT: number, yB: number, cw: number, ch: number, seed: number) => {
  const w = x1 - x0;
  const hh = yB - yT;
  if (w <= 0.5 || hh <= 0.5) return;
  const big = Math.max(cw, ch);
  const aPat = sst(3, 5, big);
  if (aPat < 1) {
    // specks only: a few robots' worth per facade, stable per building
    const n = Math.min(80, Math.floor((w * hh) / 32));
    const sz = Math.max(2.1, Math.min(3, 0.7 * cw));
    ctx.globalAlpha = 1 - aPat;
    ctx.fillStyle = A.toneO(ACCENT, Z, h);
    for (let k = 0; k < n; k++) {
      const u = hash01(seed + k * 1.618);
      const v = hash01(seed * 0.7 + k * 2.414 + 0.3);
      ctx.fillRect(x0 + u * (w - sz), yT + v * (hh - sz), sz, sz * 1.3);
    }
    ctx.globalAlpha = 1;
  }
  if (aPat <= 0) return;
  const cell = WIN_MIPS.find((m) => m >= big) ?? WIN_MIPS[WIN_MIPS.length - 1];
  const pat = winPattern(ctx, cell);
  const ox = x0 - cw * (Math.floor(hash01(seed + 0.5) * WCOLS));
  const oy = yB - ch * (WROWS + Math.floor(hash01(seed + 0.9) * WROWS));
  pat.setTransform(new DOMMatrix([cw / cell, 0, 0, ch / cell, ox, oy]));
  ctx.globalAlpha = aPat;
  ctx.fillStyle = pat;
  ctx.fillRect(x0, yT, w, hh);
  // the air over them, as over everything at that depth (the orange keeps half)
  const fg = A.fog(Z);
  if (fg > 0.01) {
    ctx.globalAlpha = aPat * 0.75 * fg;
    ctx.fillStyle = A.airHex(Z, h);
    ctx.fillRect(x0, yT, w, hh);
  }
  ctx.globalAlpha = 1;
};

// ===================================================================================================================
// THE HERO'S BUILDING: its facade (spandrels, piers, mullions, the glass), roof and rooftop units
// ===================================================================================================================
export const drawHeroExterior = (ctx: CanvasRenderingContext2D, Pn: Painter, get: BotGet, frame: number) => {
  const { A, e } = Pn;
  const s = Pn.sc(Z_FACADE);
  const sx = (X: number) => 540 + X * s;
  const sy = (Y: number) => e.yh + (Y + e.He) * s;
  const stone = MAT_OATMEAL;
  const front = (h: number) => A.tone(mixHex(stone.mid, stone.lit, 0.3), Z_FACADE, h);
  const bx0 = sx(X_B0);
  const bx1 = sx(X_B1);
  // the roof (seen from above): its top, parapet and a few rooftop units
  const yRoof = -H_BLD;
  if (yRoof > -e.He) {
    Pn.poly(ctx, [[X_B0, yRoof, Z_FACADE], [X_B1, yRoof, Z_FACADE], [X_B1, yRoof, Z_BB], [X_B0, yRoof, Z_BB]], A.tone(mixHex(MAT_ROOF.mid, MAT_ROOF.lit, 0.3), (Z_FACADE + Z_BB) / 2, H_BLD));
    const units = [
      [-2600, -1400, 900, 1900, 300],
      [-900, 600, 1200, 2400, 420],
      [1300, 2700, 800, 1700, 260],
      [-2900, -2200, 2800, 3600, 200],
      [1900, 3000, 2700, 3700, 330],
    ];
    const u = MAT_UNIT;
    const cu = (h: number, z: number) => ({ top: A.tone(u.lit, z, h), front: A.tone(u.mid, z, h), left: A.tone(mixHex(u.lit, u.mid, 0.35), z, h), right: A.tone(shadeDark(u), z, h), line: A.tone(lineOf(u), z, h) });
    for (const [x0, x1, z0, z1, hh] of units.sort((a, b) => b[2] - a[2])) boxC(ctx, Pn, x0, x1, yRoof - hh, yRoof, z0, z1, cu(H_BLD + hh, z0), s > 0.05 ? 1 : 0);
    // the parapet along the front and the sides
    const pc = { top: A.tone(stone.lit, Z_FACADE, H_BLD), front: front(H_BLD), left: A.tone(mixHex(stone.lit, stone.mid, 0.35), 2000, H_BLD), right: A.tone(shadeDark(stone), 2000, H_BLD), line: A.tone(lineOf(stone), Z_FACADE, H_BLD) };
    boxC(ctx, Pn, X_B0, X_B0 + 60, yRoof - 80, yRoof, Z_FACADE, Z_BB, pc, 0);
    boxC(ctx, Pn, X_B1 - 60, X_B1, yRoof - 80, yRoof, Z_FACADE, Z_BB, pc, 0);
    boxC(ctx, Pn, X_B0, X_B1, yRoof - 80, yRoof, Z_BB - 60, Z_BB, pc, 0);
    boxC(ctx, Pn, X_B0, X_B1, yRoof - 80, yRoof, Z_FACADE, Z_FACADE + 60, pc, 0);
  }
  if (e.Dr + Z_FACADE < Pn.dmin) return;
  // the facade: piers at both ends, a spandrel over every storey, the ground storey's plinth
  ctx.fillStyle = front(H_BLD / 2);
  const pierW = 80 * s;
  ctx.fillRect(bx0, sy(-H_BLD), sx(X_I0) - bx0 + 0.5, sy(YS) - sy(-H_BLD));
  ctx.fillRect(sx(X_I1) - 0.5, sy(-H_BLD), bx1 - sx(X_I1) + 0.5, sy(YS) - sy(-H_BLD));
  for (let i = STOREY_MIN; i <= STOREY_MAX; i++) {
    const yT = i === STOREY_MAX ? -H_BLD : storeyFloor(i + 1);
    const yB = storeyCeil(i);
    ctx.fillStyle = front(-(yT + yB) / 2);
    ctx.fillRect(bx0, sy(yT), bx1 - bx0, sy(yB) - sy(yT) + 0.4);
  }
  ctx.fillStyle = A.tone(mixHex(stone.mid, stone.dark, 0.35), Z_FACADE, 10);
  ctx.fillRect(bx0, sy(SILL0), bx1 - bx0, sy(YS) - sy(SILL0));
  // the spandrels' cream rim (light from above) and a darker line under each
  if (s * 783 > 14) {
    ctx.globalAlpha = 0.45 * (1 - A.fog(Z_FACADE));
    ctx.fillStyle = CREAM;
    for (let i = STOREY_MIN + 1; i <= STOREY_MAX; i++) ctx.fillRect(bx0, sy(storeyFloor(i)) - 0.5, bx1 - bx0, Math.max(0.8, 6 * s));
    ctx.fillRect(bx0, sy(-H_BLD), bx1 - bx0, Math.max(0.8, 6 * s));
    ctx.globalAlpha = 1;
  }
  void pierW;
  // the hero's storeys once small: the window band (crossfaded over the interior by the opening's height)
  for (let i = STOREY_MIN; i <= STOREY_MAX; i++) {
    const o = openingOf(Pn, i);
    const oh = o.y1 - o.y0;
    const wBand = 1 - sst(14, 34, oh);
    if (wBand <= 0.003) continue;
    ctx.globalAlpha = wBand;
    drawBand(ctx, A, get, Z_GLASS, -(storeyFloor(i) + storeyCeil(i)) / 2, o.x0, o.x1, o.y0, o.y1, s, 900 + i * 17, frame);
    ctx.globalAlpha = 1;
  }
  // the warm window light over the interiors (the robots' glow), stronger as the storeys shrink
  for (let i = STOREY_MIN; i <= STOREY_MAX; i++) {
    const o = openingOf(Pn, i);
    const oh = o.y1 - o.y0;
    if (oh < 0.5 || o.y1 < 0 || o.y0 > 1920) continue;
    const a = 0.08;
    const g = ctx.createLinearGradient(0, o.y0, 0, o.y1);
    const c = hexRgb(ACCENT).join(",");
    g.addColorStop(0, `rgba(${c},${(a * 0.5).toFixed(3)})`);
    g.addColorStop(1, `rgba(${c},${a.toFixed(3)})`);
    ctx.fillStyle = g;
    ctx.globalCompositeOperation = "soft-light";
    ctx.fillRect(o.x0, Math.max(-5, o.y0), o.x1 - o.x0, Math.min(1925, o.y1) - Math.max(-5, o.y0));
    ctx.globalCompositeOperation = "source-over";
  }
  // the mullions (slender slate), the glass's faint sheen
  const mlw = Math.max(0.6, 11 * s);
  const ml = A.tone(mixHex(MAT.iron.mid, MAT.iron.dark, 0.3), Z_FACADE, H_BLD / 2);
  ctx.fillStyle = ml;
  for (const x of mullionXs()) {
    const X = sx(x);
    if (X < -mlw || X > 1080 + mlw) continue;
    for (let i = STOREY_MIN; i <= STOREY_MAX; i++) {
      const y0 = sy(storeyCeil(i));
      const y1 = sy(glassBottom(i));
      if (y1 < 0 || y0 > 1920) continue;
      ctx.fillRect(X - mlw / 2, y0, mlw, y1 - y0);
    }
  }
  if (s > 0.05) {
    ctx.globalAlpha = 0.07 * sst(0.05, 0.4, s) * (1 - A.fog(Z_FACADE));
    ctx.fillStyle = CREAM;
    for (let i = STOREY_MIN; i <= STOREY_MAX; i++) {
      const o = openingOf(Pn, i);
      if (o.y1 < 0 || o.y0 > 1920) continue;
      ctx.save();
      ctx.beginPath();
      ctx.rect(o.x0, o.y0, o.x1 - o.x0, o.y1 - o.y0);
      ctx.clip();
      // two soft diagonal streaks per pane, fixed to the glass
      for (let x = X_B0; x < X_B1; x += MULLION_PITCH) {
        const a = Pn.sp(x + 90, storeyCeil(i), Z_GLASS);
        const b = Pn.sp(x + 210, storeyCeil(i), Z_GLASS);
        const hgt = o.y1 - o.y0;
        ctx.beginPath();
        ctx.moveTo(a[0], o.y0);
        ctx.lineTo(b[0], o.y0);
        ctx.lineTo(b[0] - hgt * 0.35, o.y1);
        ctx.lineTo(a[0] - hgt * 0.35, o.y1);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }
};

// ===================================================================================================================
// THE GROUND (the streets and the square, one continuous tone by distance melting into the air at the horizon)
// ===================================================================================================================
const ASPHALT = "#5E574C";
const PAVING = "#8C8270";
export const drawGround = (ctx: CanvasRenderingContext2D, Pn: Painter) => {
  const { A, e } = Pn;
  const zA = -e.Dr + Pn.dmin;
  const zB = 12 * e.Dr;
  const N = 40;
  const X0 = -40 * e.Dr;
  const X1 = 40 * e.Dr;
  for (let k = 0; k < N; k++) {
    const za = zA + (zB - zA) * Math.pow(k / N, 2.2);
    const zb = zA + (zB - zA) * Math.pow((k + 1) / N, 2.2);
    const zm = (za + zb) / 2;
    const y = Pn.sp(0, YS, zm)[1];
    const melt = sst(2.5 * e.Dr, 10 * e.Dr, e.Dr + zm);
    ctx.fillStyle = mixHex(A.tone(ASPHALT, zm, 0), A.screenAir(0) && rgbHex(A.v.airAtScreen(y)), melt);
    Pn.poly(ctx, [[X0, YS, za], [X1, YS, za], [X1, YS, zb * 1.002 + 1], [X0, YS, zb * 1.002 + 1]], ctx.fillStyle as string);
  }
  // the sidewalk along the front of block (0, 0)
  const zw0 = Z_FACADE - 600;
  if (e.Dr + Z_FACADE > Pn.dmin) Pn.poly(ctx, [[-BLOCK / 2 - 300, YS, zw0], [BLOCK / 2 + 300, YS, zw0], [BLOCK / 2 + 300, YS, Z_FACADE], [-BLOCK / 2 - 300, YS, Z_FACADE]], A.tone(PAVING, Z_FACADE - 300, 0));
};

// ===================================================================================================================
// THE CITY: every lot row far to near, outside-in toward the vanishing point; LOD by the block's size on screen
// ===================================================================================================================
const ROOF_C = mixHex(MAT_ROOF.mid, MAT_ROOF.lit, 0.35);
/** the city's stone: cream, warm grey and stone, by building */
const FACADES = [mixHex(MAT_OATMEAL.lit, CREAM, 0.25), mixHex(MAT_OATMEAL.mid, MAT_HALLWALL.lit, 0.4), MAT_OATMEAL.mid, mixHex(MAT_HALLWALL.lit, MAT_OATMEAL.lit, 0.5)];
const facadeOf = (seed: number) => FACADES[Math.floor(hash01(seed + 9.7) * FACADES.length)];
/** a city building (box): neutral stone, its windows small and distinct, the robots in them the only orange */
const drawBld = (ctx: CanvasRenderingContext2D, Pn: Painter, get: BotGet, b: Bld, frame: number, detail: number) => {
  const { A, e } = Pn;
  const d0 = e.Dr + b.z0;
  if (e.Dr + b.z1 < Pn.dmin) return;
  const zm = (b.z0 + b.z1) / 2;
  const fog = A.fog(zm);
  if (fog > 0.885) return;
  const s0 = F / Math.max(d0, Pn.dmin);
  const hh = b.h / 2;
  const stone = facadeOf(b.seed);
  const roof = A.tone(ROOF_C, zm, b.h);
  const fac = A.tone(stone, b.z0, hh);
  // the side face toward the vanishing point (in shade)
  if (b.x1 < 0) Pn.poly(ctx, [[b.x1, YS - b.h, b.z0], [b.x1, YS - b.h, b.z1], [b.x1, YS, b.z1], [b.x1, YS, b.z0]], A.tone(mixHex(stone, PAL.shadow, 0.38), zm, hh));
  if (b.x0 > 0) Pn.poly(ctx, [[b.x0, YS - b.h, b.z0], [b.x0, YS - b.h, b.z1], [b.x0, YS, b.z1], [b.x0, YS, b.z0]], A.tone(mixHex(stone, PAL.shadow, 0.22), zm, hh));
  if (YS - b.h > -e.He) {
    const yr = YS - b.h;
    Pn.poly(ctx, [[b.x0, yr, b.z0], [b.x1, yr, b.z0], [b.x1, yr, b.z1], [b.x0, yr, b.z1]], roof);
    // skylights over the top floor (a dim room, a robot under most), when the roof is big enough to show them
    const cell = 900;
    const nx = Math.max(1, Math.round((b.x1 - b.x0) / cell));
    const nz = Math.max(1, Math.round((b.z1 - b.z0) / cell));
    const cw = (b.x1 - b.x0) / nx;
    const cd = (b.z1 - b.z0) / nz;
    const sMid = F / Math.max(Pn.dmin, e.Dr + zm);
    if (cw * sMid > 6) {
      const sky = A.tone(WIN_ROOM, zm, b.h);
      const bot = A.toneO(ACCENT, zm, b.h);
      for (let kz = 0; kz < nz; kz++)
        for (let kx = 0; kx < nx; kx++) {
          const hv = hash01(b.seed + kx * 3.1 + kz * 7.7);
          if (hv < 0.2) continue;
          const xa = b.x0 + kx * cw + cw * 0.3;
          const xb = xa + cw * 0.4;
          const za = b.z0 + kz * cd + cd * 0.34;
          const zb = za + cd * 0.32;
          Pn.poly(ctx, [[xa, yr - 1, za], [xb, yr - 1, za], [xb, yr - 1, zb], [xa, yr - 1, zb]], sky);
          if (hv > 0.4) {
            const xc = (xa + xb) / 2;
            const zc = (za + zb) / 2;
            Pn.poly(ctx, [[xc - cw * 0.05, yr - 2, zc - cd * 0.06], [xc + cw * 0.05, yr - 2, zc - cd * 0.06], [xc + cw * 0.05, yr - 2, zc + cd * 0.06], [xc - cw * 0.05, yr - 2, zc + cd * 0.06]], bot);
          }
        }
    }
  }
  if (d0 < Pn.dmin) return;
  // the front: the stone, then its windows (a storey high, every 3 m across)
  const x0 = 540 + b.x0 * s0;
  const x1 = 540 + b.x1 * s0;
  const yT = e.yh + (YS - b.h + e.He) * s0;
  const yB = e.yh + (YS + e.He) * s0;
  if (x1 < -2 || x0 > 1082 || yB < -2 || yT > 1922) return;
  ctx.fillStyle = fac;
  ctx.fillRect(x0, yT, x1 - x0, yB - yT);
  const inset = Math.min((x1 - x0) * 0.06, 90 * s0);
  if (detail >= 0.5) drawWindows(ctx, A, b.z0, hh, x0 + inset, x1 - inset, yT + 0.4 * b.sh * s0, yB, MULLION_PITCH * s0, b.sh * s0, b.seed);
  if (b.sh * s0 > 10) {
    ctx.globalAlpha = 0.4 * (1 - fog);
    ctx.fillStyle = CREAM;
    ctx.fillRect(x0, yT, x1 - x0, Math.max(0.7, 5 * s0));
    ctx.globalAlpha = 1;
  }
  void get;
  void frame;
};
/** a whole block as one mass (far LOD): stone, a few robots' specks */
const drawBlockMass = (ctx: CanvasRenderingContext2D, Pn: Painter, bx: number, bz: number) => {
  const { A, e } = Pn;
  const x0 = blockX0(bx) + 400;
  const x1 = x0 + BLOCK - 800;
  const z0 = blockZ0(bz) + 400;
  const z1 = z0 + BLOCK - 800;
  const d0 = e.Dr + z0;
  if (d0 < Pn.dmin) return;
  const fog = A.fog(z0);
  if (fog > 0.885) return;
  // the block's mean height (from its centre lot's seed: cheap, stable)
  const b = lotBuilding(bx, bz, 1, 1) ?? lotBuilding(bx, bz, 0, 0);
  const h = b ? b.h * 0.85 : 2400;
  const s = F / d0;
  const xa = 540 + x0 * s;
  const xb = 540 + x1 * s;
  const yT = e.yh + (YS - h + e.He) * s;
  const yB = e.yh + (YS + e.He) * s;
  if (xb < -2 || xa > 1082 || yB < -2 || yT > 1922) return;
  const s1 = F / (e.Dr + z1);
  const yR = e.yh + (YS - h + e.He) * s1;
  ctx.fillStyle = A.tone(ROOF_C, z0, h);
  ctx.beginPath();
  ctx.moveTo(xa, yT);
  ctx.lineTo(xb, yT);
  ctx.lineTo(540 + x1 * s1, yR);
  ctx.lineTo(540 + x0 * s1, yR);
  ctx.closePath();
  ctx.fill();
  const seed = bx * 71.9 + bz * 33.1;
  ctx.fillStyle = A.tone(facadeOf(seed), z0, h / 2);
  ctx.fillRect(xa, yT, xb - xa, Math.max(0.8, yB - yT));
  drawWindows(ctx, A, z0, h / 2, xa, xb, yT, yB, MULLION_PITCH * s, 700 * s, seed);
};
export const drawCity = (ctx: CanvasRenderingContext2D, Pn: Painter, get: BotGet, frame: number, part: "behind" | "front") => {
  const { e } = Pn;
  const zFar = 9 * e.Dr;
  const bzMin = Math.floor((-e.Dr - Z_FACADE) / BPITCH) - 1;
  const bzMax = Math.ceil((zFar - Z_FACADE) / BPITCH);
  const b0 = part === "behind" ? Math.max(0, bzMin) : bzMin;
  const b1 = part === "behind" ? bzMax : -1;
  for (let bz = b1; bz >= b0; bz--) {
    const zRow = blockZ0(bz);
    const dRow = e.Dr + zRow + BLOCK;
    if (dRow < Pn.dmin) continue;
    const sRow = F / Math.max(Pn.dmin, e.Dr + zRow);
    const pitchPx = BPITCH * sRow;
    // visible blocks across (the frustum at the row's far edge, plus tall buildings leaning in)
    const half = (620 * Math.max(Pn.dmin, e.Dr + zRow + BLOCK)) / F;
    const bxA = Math.floor((-half - BLOCK / 2) / BPITCH);
    const bxB = Math.ceil((half + BLOCK / 2) / BPITCH);
    const order: number[] = [];
    for (let bx = bxA; bx <= bxB; bx++) order.push(bx);
    order.sort((a, b) => Math.abs(b) - Math.abs(a));
    if (pitchPx < 22) {
      for (const bx of order) if (blockAlive(bx, bz)) drawBlockMass(ctx, Pn, bx, bz);
      continue;
    }
    // near: lot rows back to front, outside-in
    for (let lz = 2; lz >= 0; lz--) {
      const items: { X: number; b: Bld }[] = [];
      for (const bx of order) {
        if (!blockAlive(bx, bz) && !(bx === 0 && bz === 0)) continue;
        for (let lx = 0; lx < 3; lx++) {
          const b = lotBuilding(bx, bz, lx, lz);
          if (b) items.push({ X: (b.x0 + b.x1) / 2, b });
        }
      }
      items.sort((a, b) => Math.abs(b.X) - Math.abs(a.X));
      for (const it of items) drawBld(ctx, Pn, get, it.b, frame, 1);
    }
  }
};
void LOT;
void Z_BB;

// ===================================================================================================================
// THE CLOUD LAYER (the air thickens and lightens like cloud; above it the deck breaks up and falls away)
// ===================================================================================================================
const vnoise = (() => {
  const P = new Float32Array(512);
  for (let i = 0; i < 512; i++) P[i] = hash01(i * 3.17 + 0.5);
  const at = (ix: number, iy: number) => P[(((ix * 31 + iy * 17) % 512) + 512) % 512];
  return (x: number, y: number) => {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = x - ix;
    const fy = y - iy;
    const ux = fx * fx * (3 - 2 * fx);
    const uy = fy * fy * (3 - 2 * fy);
    const a = at(ix, iy);
    const b = at(ix + 1, iy);
    const c = at(ix, iy + 1);
    const d = at(ix + 1, iy + 1);
    return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
  };
})();
let CLOUD_C: HTMLCanvasElement | null = null;
/** the cloud: veil (0..1, a uniform light air) and the deck (cover 0..1 of puffs) zooming out round (ax, ay) at the
 *  given log zoom */
export const drawCloud = (ctx: CanvasRenderingContext2D, veil: number, cover: number, lam: number, ax: number, ay: number, frame: number) => {
  if (veil <= 0.003 && cover <= 0.003) return;
  const lit = hexRgb(mixHex(PAL.ramp[0][1], CREAM, 0.35));
  const mid = hexRgb(mixHex(PAL.ramp[1][1], PAL.ramp[0][1], 0.5));
  const low = hexRgb(mixHex(PAL.ramp[1][1], PAL.ramp[0][1], 0.25));
  if (veil > 0.003) {
    const g = ctx.createLinearGradient(0, 0, 0, 1920);
    g.addColorStop(0, `rgba(${lit.join(",")},${veil.toFixed(3)})`);
    g.addColorStop(0.6, `rgba(${mixRgbS(lit, mid, 0.5)},${veil.toFixed(3)})`);
    g.addColorStop(1, `rgba(${mid.join(",")},${veil.toFixed(3)})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 1080, 1920);
  }
  if (cover <= 0.003) return;
  const W = 270;
  const H = 480;
  if (!CLOUD_C) {
    CLOUD_C = document.createElement("canvas");
    CLOUD_C.width = W;
    CLOUD_C.height = H;
  }
  const g = CLOUD_C.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D;
  const img = g.createImageData(W, H);
  const data = img.data;
  // the deck's scale: one puff ~ S px, shrinking as the zoom climbs (the deck falls away below)
  const dl = lam - LAMBDA_SWAP;
  const S = 640 * Math.exp(-(dl < 0 ? 0.6 * dl : dl));
  const th = 1 - cover;
  const drift = frame * 0.012;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const px = x * 4 + 2;
      const py = y * 4 + 2;
      const u = (px - ax) / S + 37.3 + drift;
      const v = (py - ay) / S + 11.9;
      let n = 0.55 * vnoise(u, v) + 0.28 * vnoise(u * 2.1 + 5.2, v * 2.1 + 1.3) + 0.17 * vnoise(u * 4.3 + 9.1, v * 4.3 + 3.7);
      n = n * 1.12 - 0.06;
      const a = 0.8 * c01((n - th + 0.18) / 0.36);
      const sh = c01((n - th) / 0.35);
      const i = (y * W + x) * 4;
      const c0 = sh;
      data[i] = low[0] + (lit[0] - low[0]) * (0.45 + 0.55 * c0);
      data[i + 1] = low[1] + (lit[1] - low[1]) * (0.45 + 0.55 * c0);
      data[i + 2] = low[2] + (lit[2] - low[2]) * (0.45 + 0.55 * c0);
      data[i + 3] = 255 * a;
    }
  }
  g.putImageData(img, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.filter = "blur(5px)";
  ctx.drawImage(CLOUD_C, 0, 0, W, H, 0, 0, 1080, 1920);
  ctx.filter = "none";
};
const mixRgbS = (a: number[], b: number[], t: number) => a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(",");

// ===================================================================================================================
// THE PLANET: the module's EarthGlobe, then this cut's city lights on it (each a lit building full of robots)
// ===================================================================================================================
type Lights = { lon: Float32Array; lat: Float32Array; w: Float32Array; xyz: Float32Array; ph: Float32Array };
let LIGHTS: Lights | null = null;
const lights = (): Lights => {
  if (LIGHTS) return LIGHTS;
  const bin = atob(LIGHTS_B64);
  const u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  const dv = new DataView(u8.buffer);
  const lon = new Float32Array(LIGHTS_N);
  const lat = new Float32Array(LIGHTS_N);
  const w = new Float32Array(LIGHTS_N);
  const xyz = new Float32Array(LIGHTS_N * 3);
  const ph = new Float32Array(LIGHTS_N);
  const D2R = Math.PI / 180;
  for (let i = 0; i < LIGHTS_N; i++) {
    lon[i] = dv.getInt16(i * 5, true) / 100;
    lat[i] = dv.getInt16(i * 5 + 2, true) / 100;
    w[i] = dv.getUint8(i * 5 + 4) / 255;
    const l = lon[i] * D2R;
    const f = lat[i] * D2R;
    xyz[i * 3] = Math.cos(f) * Math.cos(l);
    xyz[i * 3 + 1] = Math.cos(f) * Math.sin(l);
    xyz[i * 3 + 2] = Math.sin(f);
    ph[i] = hash01(i * 0.731 + 0.2) * Math.PI * 2;
  }
  LIGHTS = { lon, lat, w, xyz, ph };
  return LIGHTS;
};
/** the globe's rotation as a matrix, read off the module's own globePoint (so the lights sit exactly on its land) */
const basisOf = (g: GlobeSpec) => {
  const u = { ...g, cx: 0, cy: 0, r: 1 };
  const a = globePoint(u, 0, 0);
  const b = globePoint(u, 90, 0);
  const c = globePoint(u, 0, 90);
  // screen x = cx + r (a.x X + b.x Y + c.x Z); y likewise; front likewise
  return { xx: [a.x, b.x, c.x], yy: [a.y, b.y, c.y], ff: [a.front, b.front, c.front] };
};
/** the robots on the planet: specks drawn with the robot's own dot LOD (an orange bean with a head block), clustered
 *  where the cities are; partial coverage (cut 99 covers China, then the Earth, later). A few more arrive through the
 *  hold (f104-146), each growing in over 5 frames; all of them twinkle softly. */
export const FILL_IN: [number, number] = [104, 146];
const shownAt = (i: number, w: number, frame: number) => {
  const h = hash01(i * 0.917 + 0.33);
  const base = 0.3 + 0.45 * w;
  if (h < base) return 1;
  const extra = (h - base) / 0.16;
  if (extra >= 1) return 0;
  const f0 = FILL_IN[0] + extra * (FILL_IN[1] - FILL_IN[0]);
  return sst(f0, f0 + 5, frame);
};
export const drawPlanet = (ctx: CanvasRenderingContext2D, g: GlobeSpec, frame: number, amount = 1) => {
  drawGlobe(ctx, g);
  if (amount <= 0.003) return;
  const L = lights();
  const B = basisOf(g);
  const zoom = Math.max(0.85, Math.min(3, Math.pow(g.r / 300, 0.55)));
  ctx.save();
  ctx.beginPath();
  ctx.arc(g.cx, g.cy, g.r, 0, Math.PI * 2);
  ctx.clip();
  for (let i = 0; i < LIGHTS_N; i++) {
    const X = L.xyz[i * 3];
    const Y = L.xyz[i * 3 + 1];
    const Z = L.xyz[i * 3 + 2];
    const fr = B.ff[0] * X + B.ff[1] * Y + B.ff[2] * Z;
    if (fr <= 0.03) continue;
    const x = g.cx + g.r * (B.xx[0] * X + B.xx[1] * Y + B.xx[2] * Z);
    const y = g.cy + g.r * (B.yy[0] * X + B.yy[1] * Y + B.yy[2] * Z);
    if (x < -30 || x > 1110 || y < -30 || y > 1960) continue;
    const w = L.w[i];
    const on = shownAt(i, w, frame);
    if (on <= 0.01) continue;
    const tw = 0.8 + 0.2 * Math.sin(frame * (0.07 + 0.09 * hash01(i * 1.3)) + L.ph[i]);
    const limb = sst(0.03, 0.3, fr);
    const hPx = (4.4 + 3.2 * w) * zoom * (0.55 + 0.45 * Math.sqrt(fr)) * (0.4 + 0.6 * on);
    drawBotDot(ctx, x, y + 0.5 * hPx, hPx, c01(amount * limb * tw * on));
  }
  ctx.restore();
  ctx.globalAlpha = 1;
};
