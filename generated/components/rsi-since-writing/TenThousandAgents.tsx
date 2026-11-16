// ---------------------------------------------------------------------------
// TenThousandAgents (rsi-since-writing, cut 69), revision 2: THE THINKING HANDED OUT. Dwarkesh 3D style
// (styles/dwarkesh-3d.md). Opaque 1080x1920, 23.976 fps, 88 frames. One stage in the misty teal air (AirStage,
// palette A) on a one-point pinhole crane (tenThousandAgentsPlan.ts, mapped onto the kit's londonDepth perspective
// every frame), from the kit kits/dwarkesh-3d/dwarkesh3d.
//
// CHECK LINE: "The work was split across ten thousand AI agents running side by side."
//
// THE LINE: "Now, this thinking was split up across 10,000 different parallel agents,"
// WORD -> FRAME: invented -11 · Now, -1 · this 5 · thinking 15 · was 21 · split 27 · up 34 · across 38 · 10,000 43 ·
// different 58 · parallel 62 · agents, 72 · and 86 (Whisper; may run ~0.2-0.4 s early).
// DURATION: the slot 69.3610 -> 73.0313 s = 3.670 s x 23.976 = 88 frames (f0..f87).
//
// THE MOTION: "this thinking" (f0-27): it opens TIGHT on ONE BIG PIECE OF THINKING, the paper filling the frame
// while its handwriting draws itself on (every tile being written at once, a dot of fresh ink at each pen tip); one
// continuous pull-back and slight crane up (easing out by ~f35) reveals the whole slab (a glowing cream slab of
// work: 10 x 10 pads of the clip's cream sheets) hovering between us and a hall of low desks, then below and around
// it the front rows and the hall receding in the haze; at every desk a robot (the sister clip's Bot) stands switched
// off (screen dark, head tipped a little). By "split" the slab fills ~75 % of the width at y ~290-930. "split up" (f27-40): the slab cracks along its grid (f24.5-27.5) and its 100 pads fly off
// one after another, the far row first, AWAY from us over the hall, fanning out and shrinking with depth, turning
// flat; the camera cranes up and pushes in after them. "across 10,000 different" (f38-62): each pad stops over its
// block of 10 x 10 desks and deals its 100 sheets, one onto each desk (the two near pads close in front of us, so we
// watch them deal); as each sheet lands flat beside the keyboard the robot there switches on (bootUp: the bulb, the
// eyes, the smile) with a small warm flare, a wave of lit robots running back through the rows (sprites near, dots
// far). "10,000" is a cloth banner hung low over the hall between rows 9 and 10 (world space, square to the lens)
// that unrolls at f45, after the near sheets have dropped below it. "parallel agents" (f62-88): every robot types at
// once, a ripple of orange running back through the rows; the camera settles (horizon y ~330, the front robots ~220
// px at the bottom of the keep-in, each with its own sheet on its desk), still creeping in and drifting at the cut.
// Orange = the robots only; the sheets are cream (COMMON.md).
// Cause before effect: a robot boots only on the frame its own sheet lands; nothing pops: the pads leave the slab
// they were part of, the sheets leave the pad, and the robots stand there (off) from f0.
//
// DEPTH: fog by world depth (fogBy "depth"); the pinhole has F = 1000 px and no pitch; f0 the eye 2.9 m up, 7.3 m in
// front of the first desks; f87 4 m up, 5.4 m in front. The hall: 100 columns 220 apart (1.24 m) x 100 rows 300 apart
// (1.7 m), Z 0..29,700 (167 m deep).
//
// SOURCES: "10,000 parallel agents": the speaker's account of the OpenAI run (COMMON.md); no other figures.
// ---------------------------------------------------------------------------
import React, { useLayoutEffect, useState } from "react";
import { continueRender, delayRender, useCurrentFrame } from "remotion";
// @ts-expect-error react-dom ships no types for its server entry here (nothing may be installed); typed below
import * as ReactDomServer from "react-dom/server";
import { z } from "zod";
import { AirFloor, AirHorizonHazeW, AirStage, MAT, WorldSvg, airWorldOf, makeAirView, type AirWorld, type Cam, type DepthOpts } from "../kits/dwarkesh-3d/dwarkesh3d";
import { BOT_POSES, BotPaint, FolkCanvas, buildBot, botGripTo, drawBotDot, type BotPose, type FolkFog, type Sprite } from "../rsi-ten-earths/tenEarthsBot";
import { MAT_KEYS, MAT_LAMINATE, PLATE_FONT } from "../rsi-ten-earths/tenEarthsHall";
import {
  BANNER,
  BOOT,
  DESK,
  DESKS,
  DURATION as PLAN_DURATION,
  F,
  LAYERS,
  N,
  PIECE,
  SLAB,
  ROBOT_BACK,
  STACKS,
  TILES,
  bootAt,
  cam3At,
  crackAt,
  inkProgress,
  piecePose,
  restOn,
  slabPt,
  stackPose,
  sst,
  type BoxPose,
  type Cam3,
  type V3,
} from "./tenThousandAgentsPlan";

const renderToStaticMarkup = (ReactDomServer as { renderToStaticMarkup: (el: React.ReactElement) => string }).renderToStaticMarkup;

export const FPS = 24000 / 1001;
export const DURATION = 88;
export const schema = z.object({});
export const defaultProps = schema.parse({});
if (PLAN_DURATION !== DURATION) throw new Error("plan duration");

const c01 = (v: number) => Math.max(0, Math.min(1, v));
const hexRgb = (h: string): [number, number, number] => [1, 3, 5].map((k) => parseInt(h.slice(k, k + 2), 16)) as [number, number, number];
const parseCol = (s: string): [number, number, number] => {
  if (s.startsWith("#")) return hexRgb(s);
  const m = s.match(/[\d.]+/g);
  return m ? [Number(m[0]), Number(m[1]), Number(m[2])] : [0, 0, 0];
};

// ---- the camera on the kit: the pinhole as a londonDepth perspective (Dc = d, k = F / d, the horizon at hy) ----
const kitCam = (c: Cam3): { cam: Cam; depth: DepthOpts } => {
  const k = F / c.d;
  return { cam: { k, cx: c.cx, cy: (960 - c.hy) / k - c.h }, depth: { eyeY: -c.h, dRef: c.d, kRef: k, dolly: 1 } };
};
const FIG_FOG = { near: 600, vis: 9000, max: 0.85 };
const SCENE = { fogVis: 7000, hHigh: 2600 };
const C0 = cam3At(0);

// ---- the robots' sprites: switching on (BOOT_STEPS) and typing (TYPE_FRAMES), five looks, five sizes ----
const SIZES = [24, 48, 96, 192, 384];
const BOOT_STEPS = 12;
const TYPE_FRAMES = 8;
/** facing us behind its desk, the mittens on the keyboard at the desk's back edge; k = the typing frame (-1 = still) */
const typePose = (k: number): BotPose => {
  const base = BOT_POSES.front(0) as BotPose;
  const ph = (2 * Math.PI * k) / TYPE_FRAMES;
  const tl = k < 0 ? 0 : 7 * Math.max(0, Math.sin(ph));
  const tr = k < 0 ? 0 : 7 * Math.max(0, Math.sin(ph + Math.PI));
  return botGripTo(base, { L: [-25, -90 - tl], R: [25, -90 - tr] });
};
/** the switched-off look: the bootUp pose part way in (screen dark, the head only tipped a little) */
const OFF_T = 0.22;
const posesFor = (kind: "b" | "t", i: number): BotPose => (kind === "b" ? ({ ...typePose(-1), boot: OFF_T + ((1 - OFF_T) * i) / (BOOT_STEPS - 1) } as BotPose) : typePose(i));
type Req = { key: string; variant: number; kind: "b" | "t"; i: number; hPx: number };
const REQS: Req[] = (() => {
  const out: Req[] = [];
  for (const hPx of SIZES)
    for (let v = 0; v < 5; v++) {
      for (let i = 0; i < BOOT_STEPS; i++) out.push({ key: `ta|${v}|b|${i}|${hPx}`, variant: v, kind: "b", i, hPx });
      for (let i = 0; i < TYPE_FRAMES; i++) out.push({ key: `ta|${v}|t|${i}|${hPx}`, variant: v, kind: "t", i, hPx });
    }
  return out;
})();
const SPR = new Map<string, Sprite>();
const bakeOne = (r: Req): Promise<void> => {
  const scale = r.hPx / 240;
  const pad = Math.ceil(10 + r.hPx * 0.05);
  const W = Math.ceil(130 * scale * 2 + pad * 2);
  const H = Math.ceil(300 * scale + pad * 2);
  const ax = W / 2;
  const ay = H - pad;
  const shapes = buildBot(r.variant, posesFor(r.kind, r.i)).shapes;
  const svg = renderToStaticMarkup(
    <svg xmlns="http://www.w3.org/2000/svg" width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <BotPaint shapes={shapes} at={[ax, ay]} scale={scale} uid={`tab${r.variant}${r.kind}${r.i}s${r.hPx}`} />
    </svg>,
  );
  return new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = W;
      c.height = H;
      (c.getContext("2d") as CanvasRenderingContext2D).drawImage(img, 0, 0);
      SPR.set(r.key, { c, ax, ay, px: r.hPx, unitsPerPx: 1 / scale });
      resolve();
    };
    img.onerror = () => resolve();
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
};
const useSprites = () => {
  const [handle] = useState(() => (REQS.every((r) => SPR.has(r.key)) ? null : delayRender("baking desk robots", { timeoutInMilliseconds: 300000 })));
  const [, setTick] = useState(0);
  useLayoutEffect(() => {
    if (handle === null) return;
    let alive = true;
    (async () => {
      for (const r of REQS) if (!SPR.has(r.key)) await bakeOne(r);
    })().then(() => {
      if (alive) setTick((t) => t + 1);
      continueRender(handle);
    });
    return () => {
      alive = false;
    };
  }, [handle]);
};
// a tint (switched off: toward the petrol shade) combined with the air's fog, cached per quantised step
type Tint = { rgb: [number, number, number]; amount: number };
const OFF_RGB: [number, number, number] = [70, 52, 40];
const WARM_RGB: [number, number, number] = [255, 226, 160];
const combine = (off: number, fog: FolkFog, fogStrength: number, warm = 0): Tint => {
  const fr = typeof fog.rgb === "string" ? parseCol(fog.rgb) : fog.rgb;
  const a2 = c01(fog.amount * fogStrength);
  const a1 = off > 0 ? off : warm;
  const tintRgb = off > 0 ? OFF_RGB : WARM_RGB;
  const amt = 1 - (1 - a1) * (1 - a2);
  if (amt <= 0.001) return { rgb: fr, amount: 0 };
  const w1 = (a1 * (1 - a2)) / amt;
  const w2 = a2 / amt;
  return { rgb: [0, 1, 2].map((k) => tintRgb[k] * w1 + fr[k] * w2) as [number, number, number], amount: amt };
};
const TINTED = new Map<string, HTMLCanvasElement>();
const tinted = (key: string, src: HTMLCanvasElement, t: Tint) => {
  const amt = Math.round(t.amount * 40) / 40;
  if (amt <= 0) return src;
  const rgb = t.rgb.map((v) => Math.round(v / 8) * 8);
  const k = `${key}|${amt}|${rgb.join(",")}`;
  const hit = TINTED.get(k);
  if (hit) return hit;
  if (TINTED.size > 9000) TINTED.clear();
  const c = document.createElement("canvas");
  c.width = src.width;
  c.height = src.height;
  const g = c.getContext("2d") as CanvasRenderingContext2D;
  g.drawImage(src, 0, 0);
  g.globalCompositeOperation = "source-atop";
  g.fillStyle = `rgba(${rgb.join(",")},${amt})`;
  g.fillRect(0, 0, c.width, c.height);
  TINTED.set(k, c);
  return c;
};
let GLOW: HTMLCanvasElement | null = null;
const glowSprite = () => {
  if (GLOW) return GLOW;
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 64;
  const g = c.getContext("2d") as CanvasRenderingContext2D;
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, "rgba(255,176,0,0.55)");
  gr.addColorStop(0.45, "rgba(255,160,20,0.22)");
  gr.addColorStop(1, "rgba(255,150,30,0)");
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
  GLOW = c;
  return c;
};

// ---- the robot at frame f: its sprite (switching on, then typing in sync with a ripple back through the rows) ----
const robotFrame = (i: number, f: number): { kind: "b" | "t"; idx: number; on: number; glow: number; warm: number } => {
  const d = DESKS[i];
  const b = bootAt(d, f);
  if (b < 1) {
    const flare = sst(0.1, 0.35, b) * 0.24;
    return { kind: "b", idx: Math.round(b * (BOOT_STEPS - 1)), on: b, glow: flare, warm: 0 };
  }
  // typing: one beat for all (in sync), offset a little by the row so a ripple runs back through the hall
  const tf = f - d.r * 0.22;
  const idx = (((Math.floor(tf * 1.0) % TYPE_FRAMES) + TYPE_FRAMES) % TYPE_FRAMES) as number;
  const since = f - d.land - BOOT;
  const flare = 0.24 * (1 - sst(0, 10, since));
  const ripple = sst(54, 66, f) * Math.pow(0.5 + 0.5 * Math.sin((2 * Math.PI * (f - d.r * 0.45)) / 24), 2);
  return { kind: "t", idx, on: 1, glow: Math.max(flare, 0.05 + 0.12 * ripple), warm: ripple };
};

// ---- drawing helpers ----
type Pr = (X: number, Y: number, Z: number) => [number, number];
const poly = (ctx: CanvasRenderingContext2D, pts: [number, number][], fill: string, stroke?: string, lw = 1) => {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let k = 1; k < pts.length; k++) ctx.lineTo(pts[k][0], pts[k][1]);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lw;
    ctx.stroke();
  }
};
// the ink: faint lines of handwriting across the slab's face (tile-local u 0..w, v 0..l), one pattern per tile
const INK: [number, number, number][][] = (() => {
  const out: [number, number, number][][] = [];
  let seed = 7;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let t = 0; t < TILES * TILES; t++) {
    const segs: [number, number, number][] = [];
    for (let v = 5; v < PIECE.l - 3; v += 7.5) {
      let u = rnd() * 3;
      while (u < PIECE.w - 2) {
        const len = 4 + rnd() * 11;
        segs.push([u, Math.min(PIECE.w - 1, u + len), v]);
        u += len + 2 + rnd() * 3;
      }
    }
    out.push(segs);
  }
  return out;
})();
/** the pen length along each tile's lines (each segment, a lift between segments, a return between lines) */
const INK_AT: number[][] = INK.map((segs) => {
  const at: number[] = [];
  let acc = 0;
  let lastV = -1;
  for (const [u0, u1, v] of segs) {
    if (lastV >= 0) acc += v !== lastV ? 14 : 3;
    at.push(acc);
    acc += u1 - u0;
    lastV = v;
  }
  return at;
});
const INK_LEN: number[] = INK.map((segs, k) => (segs.length ? INK_AT[k][segs.length - 1] + segs[segs.length - 1][1] - segs[segs.length - 1][0] : 1));
const CREAM = "#F2E9D4";
const CREAM_LO = "#D8CBB0";
const INK_COL = "#6E6254";

/** one piece (a cream card) given its centre and axes; ink when it is big enough and its face is toward us */
const drawPiece = (ctx: CanvasRenderingContext2D, c: Cam3, A: AirWorld, C: V3, a: V3, b: V3, tile: number, warm = 0) => {
  const hw = PIECE.w / 2;
  const hl = PIECE.l / 2;
  const pr = (u: number, v: number): [number, number] => {
    const X = C[0] + a[0] * u + b[0] * v;
    const Y = C[1] + a[1] * u + b[1] * v;
    const Z = C[2] + a[2] * u + b[2] * v;
    const s = F / Math.max(1, Z + c.d);
    return [540 + (X - c.cx) * s, c.hy + (Y + c.h) * s];
  };
  const pts = [pr(-hw, -hl), pr(hw, -hl), pr(hw, hl), pr(-hw, hl)];
  const n: V3 = [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const toCam: V3 = [c.cx - C[0], -c.h - C[1], -c.d - C[2]];
  const front = n[0] * toCam[0] + n[1] * toCam[1] + n[2] * toCam[2] > 0;
  const hgt = -C[1];
  const sz = Math.hypot(pts[2][0] - pts[0][0], pts[2][1] - pts[0][1]);
  if (sz < 0.6) return;
  const base = front ? CREAM : CREAM_LO;
  poly(ctx, pts, A.tone(base, C[2], hgt), sz > 6 ? A.tone("#B5A68A", C[2], hgt) : undefined, Math.max(0.4, sz * 0.012));
  if (warm > 0) {
    ctx.globalAlpha = warm;
    poly(ctx, pts, "rgba(255,214,140,0.5)");
    ctx.globalAlpha = 1;
  }
  if (front && sz > 18) {
    ctx.strokeStyle = A.tone(INK_COL, C[2], hgt);
    ctx.globalAlpha = 0.42 * sst(18, 40, sz);
    ctx.lineWidth = Math.max(0.6, sz * 0.012);
    ctx.lineCap = "round";
    ctx.beginPath();
    for (const [u0, u1, v] of INK[tile]) {
      const p0 = pr(u0 - hw, v - hl);
      const p1 = pr(u1 - hw, v - hl);
      ctx.moveTo(p0[0], p0[1]);
      ctx.lineTo(p1[0], p1[1]);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
};

/** a desk (a laminate top on four slim legs, its keyboard at the back edge) with, once its piece has landed, the
 *  piece on it */
const TOP_T = 8;
const LEG = 9;
const drawDesk = (ctx: CanvasRenderingContext2D, c: Cam3, A: AirWorld, i: number, f: number, pr: Pr) => {
  const d = DESKS[i];
  const x0 = d.X - DESK.w / 2;
  const x1 = d.X + DESK.w / 2;
  const z0 = d.Z;
  const z1 = d.Z + DESK.d;
  const y = -DESK.h;
  const tl = pr(x0, y, z0);
  const tr = pr(x1, y, z0);
  const wPx = tr[0] - tl[0];
  if (tr[0] < -20 || tl[0] > 1100 || tl[1] > 1940) return;
  const bl = pr(x0, y, z1);
  const br = pr(x1, y, z1);
  const fog = A.fog(d.Z);
  // its shadow on the floor
  if (wPx > 3) {
    const s0 = pr(x0 - 6, 0, z0 + 4);
    const s1 = pr(x1 + 16, 0, z0 + 4);
    const s2 = pr(x1 + 16, 0, z1 + 26);
    const s3 = pr(x0 - 6, 0, z1 + 26);
    ctx.globalAlpha = 0.22 * (1 - fog);
    poly(ctx, [s0, s1, s2, s3], "#2A231B");
    ctx.globalAlpha = 1;
  }
  const legCol = A.tone("#5B6264", d.Z, DESK.h * 0.5);
  if (wPx > 6) {
    // the four slim legs (the back pair first)
    for (const [lx, lz] of [
      [x0 + 6, z1 - 6],
      [x1 - 6 - LEG, z1 - 6],
      [x0 + 6, z0 + 6],
      [x1 - 6 - LEG, z0 + 6],
    ] as [number, number][]) {
      const p0 = pr(lx, 0, lz);
      const p1 = pr(lx + LEG, y + TOP_T, lz);
      ctx.fillStyle = legCol;
      ctx.fillRect(p0[0], p1[1], Math.max(0.6, p1[0] - p0[0]), p0[1] - p1[1]);
    }
  }
  // the top: its upper face, its edge toward the lens, its front edge
  if (wPx > 2.5 && Math.abs(d.X - c.cx) > DESK.w / 2) {
    const sx = d.X < c.cx ? x1 : x0;
    poly(ctx, [pr(sx, y + TOP_T, z0), pr(sx, y, z0), pr(sx, y, z1), pr(sx, y + TOP_T, z1)], A.tone(MAT_LAMINATE.dark, d.Z, DESK.h));
  }
  poly(ctx, [tl, tr, br, bl], A.tone(MAT_LAMINATE.lit, d.Z, DESK.h));
  const fl = pr(x0, y + TOP_T, z0);
  const fr = pr(x1, y + TOP_T, z0);
  poly(ctx, [fl, fr, tr, tl], A.tone(MAT_LAMINATE.mid, d.Z, DESK.h));
  if (wPx > 10) {
    // the keyboard at the back edge
    const k0 = pr(d.X - 34, y - 0.5, z1 - 26);
    const k1 = pr(d.X + 34, y - 0.5, z1 - 26);
    const k2 = pr(d.X + 34, y - 0.5, z1 - 8);
    const k3 = pr(d.X - 34, y - 0.5, z1 - 8);
    poly(ctx, [k0, k1, k2, k3], A.tone(MAT_KEYS.mid, d.Z, DESK.h));
  }
  if (f >= d.land) {
    const C = restOn(d.X, d.Z);
    const warm = 0.55 * sst(0, 2, f - d.land) * (1 - sst(2, 10, f - d.land));
    drawPiece(ctx, c, A, C, [1, 0, 0], [0, 0, 1], d.k, warm);
  }
};

/** a robot standing behind its desk (sprite or dot), switched off or on, its warm glow */
const drawRobot = (ctx: CanvasRenderingContext2D, c: Cam3, A: AirWorld, i: number, f: number) => {
  const d = DESKS[i];
  const Z = d.Z + ROBOT_BACK;
  const s = F / (Z + c.d);
  const x = 540 + (d.X - c.cx) * s;
  const y = c.hy + c.h * s;
  const hPx = 240 * s;
  if (x < -hPx || x > 1080 + hPx || y - 1.2 * hPx > 1940 || y < -10) return;
  const rf = robotFrame(i, f);
  const fog = A.folkFog(Z);
  const off = 0.16 * (1 - sst(0.05, 0.6, rf.on));
  const ga = rf.glow * (1 - fog.amount * 0.9) * sst(30, 130, hPx);
  if (ga > 0.01) {
    const g = glowSprite();
    const r = hPx * 0.9;
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = c01(ga);
    ctx.drawImage(g, x - r, y - hPx * 0.55 - r, 2 * r, 2 * r);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }
  if (hPx < 15) {
    const t = combine(off, fog, 0.5, rf.warm * 0.3);
    drawBotDot(ctx, x, y, hPx, 1, { rgb: t.rgb, amount: t.amount });
    if (hPx < 12) return;
  }
  const size = SIZES.find((sz) => sz >= hPx / 1.15) ?? SIZES[SIZES.length - 1];
  const key = `ta|${d.variant}|${rf.kind}|${rf.idx}|${size}`;
  const sp = SPR.get(key);
  if (!sp) return;
  const src = tinted(key, sp.c, combine(off, fog, 0.5, rf.warm * 0.3));
  const k = hPx / sp.px;
  ctx.globalAlpha = sst(11, 15, hPx);
  ctx.drawImage(src, x - sp.ax * k, y - sp.ay * k, sp.c.width * k, sp.c.height * k);
  ctx.globalAlpha = 1;
};

/** one stack of sheets as a box (its inked top sheet, its paper edges); hide(dir) skips a side that a neighbour in
 *  the slab covers (dir 0..3 = -a, +a, -b, +b) */
const STACK_TOP = "#F6EEDC";
const STACK_SIDE = "#E4D9C2";
const STACK_SIDE2 = "#DCD0B6";
const STACK_EDGE = "#A4957A";
const drawBox = (ctx: CanvasRenderingContext2D, c: Cam3, A: AirWorld, P: BoxPose, k: number, crack: number, hide?: (dir: number) => boolean, write = 1) => {
  const hw = PIECE.w / 2;
  const hl = PIECE.l / 2;
  const ht = P.thick / 2;
  const { C, a, b, n } = P;
  const at = (u: number, v: number, w: number): V3 => [C[0] + a[0] * u + b[0] * v + n[0] * w, C[1] + a[1] * u + b[1] * v + n[1] * w, C[2] + a[2] * u + b[2] * v + n[2] * w];
  const pr = (p: V3): [number, number] => {
    const s = F / Math.max(1, p[2] + c.d);
    return [540 + (p[0] - c.cx) * s, c.hy + (p[1] + c.h) * s];
  };
  const cam: V3 = [c.cx, -c.h, -c.d];
  const seen = (nrm: V3, p: V3) => nrm[0] * (cam[0] - p[0]) + nrm[1] * (cam[1] - p[1]) + nrm[2] * (cam[2] - p[2]) > 0;
  const hz = -C[1];
  const sz = (PIECE.w * F) / Math.max(1, C[2] + c.d);
  if (sz < 0.5) return;
  const edge = A.tone(STACK_EDGE, C[2], hz);
  const lw = Math.max(0.5, sz * 0.012);
  // the sides (paper edges): -a, +a, -b, +b
  const sides: [V3, [number, number][]][] = [
    [[-a[0], -a[1], -a[2]], [[-hw, -hl], [-hw, hl]]],
    [[a[0], a[1], a[2]], [[hw, -hl], [hw, hl]]],
    [[-b[0], -b[1], -b[2]], [[-hw, -hl], [hw, -hl]]],
    [[b[0], b[1], b[2]], [[-hw, hl], [hw, hl]]],
  ];
  sides.forEach(([nrm, [[u0, v0], [u1, v1]]], dir) => {
    if (hide && hide(dir)) return;
    const mid = at((u0 + u1) / 2, (v0 + v1) / 2, 0);
    if (!seen(nrm, mid)) return;
    const q = [pr(at(u0, v0, ht)), pr(at(u1, v1, ht)), pr(at(u1, v1, -ht)), pr(at(u0, v0, -ht))];
    poly(ctx, q, A.tone(dir < 2 ? STACK_SIDE2 : STACK_SIDE, C[2], hz), sz > 8 ? edge : undefined, lw);
    // the sheets' edges: fine lines along the side
    const tPx = Math.hypot(q[3][0] - q[0][0], q[3][1] - q[0][1]);
    if (tPx > 7) {
      const nL = Math.min(8, Math.floor(tPx / 4));
      ctx.strokeStyle = edge;
      ctx.globalAlpha = 0.28;
      ctx.lineWidth = Math.max(0.5, lw * 0.7);
      ctx.beginPath();
      for (let m = 1; m < nL; m++) {
        const w = ht - (2 * ht * m) / nL;
        const p0 = pr(at(u0, v0, w));
        const p1 = pr(at(u1, v1, w));
        ctx.moveTo(p0[0], p0[1]);
        ctx.lineTo(p1[0], p1[1]);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  });
  // the bottom sheet (seen from below while it flies high)
  const nb: V3 = [-n[0], -n[1], -n[2]];
  if (seen(nb, at(0, 0, -ht))) poly(ctx, [pr(at(-hw, -hl, -ht)), pr(at(hw, -hl, -ht)), pr(at(hw, hl, -ht)), pr(at(-hw, hl, -ht))], A.tone(CREAM_LO, C[2], hz), sz > 8 ? edge : undefined, lw);
  // the top sheet: the writing, and its grid edge once the slab has cracked
  const tc = at(0, 0, ht);
  if (!seen(n, tc)) return;
  const face = [pr(at(-hw, -hl, ht)), pr(at(hw, -hl, ht)), pr(at(hw, hl, ht)), pr(at(-hw, hl, ht))];
  const top = A.tone(STACK_TOP, C[2], hz);
  poly(ctx, face, top, top, 1.2);
  if (sz > 14) {
    ctx.strokeStyle = A.tone(INK_COL, C[2], hz);
    ctx.globalAlpha = 0.5 * sst(14, 34, sz);
    ctx.lineWidth = Math.min(3.4, Math.max(0.7, sz * 0.014));
    ctx.lineCap = "round";
    ctx.beginPath();
    // the pen: the lines in reading order, up to `write` of the tile's pen length; the line being written ends in a
    // short partial stroke, with a dot of fresh ink at its tip
    const segs = INK[k];
    const lim = write * INK_LEN[k];
    let tip: [number, number] | null = null;
    for (let q = 0; q < segs.length; q++) {
      const [u0, u1, v] = segs[q];
      const s0 = INK_AT[k][q];
      if (s0 >= lim) break;
      const ue = Math.min(u1, u0 + (lim - s0));
      const p0 = pr(at(u0 - hw, hl - v, ht));
      if (sz > 70) {
        // close up it is handwriting: a cursive wobble along the line (tile units)
        const nP = Math.max(2, Math.ceil((ue - u0) / 0.7));
        ctx.moveTo(p0[0], p0[1]);
        let pl = p0;
        for (let j = 1; j <= nP; j++) {
          const u = u0 + ((ue - u0) * j) / nP;
          const wob = 1.25 * Math.sin(u * 2.3 + v * 1.7) * Math.abs(Math.sin(u * 0.55 + q));
          pl = pr(at(u - hw, hl - v + wob, ht));
          ctx.lineTo(pl[0], pl[1]);
        }
        if (ue < u1) tip = pl;
      } else {
        const p1 = pr(at(ue - hw, hl - v, ht));
        ctx.moveTo(p0[0], p0[1]);
        ctx.lineTo(p1[0], p1[1]);
        if (ue < u1) tip = p1;
      }
    }
    ctx.stroke();
    if (tip && write < 1) {
      ctx.globalAlpha = 0.8 * sst(14, 34, sz);
      ctx.fillStyle = A.tone("#4A4036", C[2], hz);
      ctx.beginPath();
      ctx.arc(tip[0], tip[1], ctx.lineWidth * 0.9, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  if (crack > 0.01) {
    ctx.globalAlpha = 0.85 * crack;
    ctx.strokeStyle = edge;
    ctx.lineWidth = Math.max(0.8, sz * 0.022);
    ctx.beginPath();
    ctx.moveTo(face[0][0], face[0][1]);
    for (let q = 1; q <= 4; q++) ctx.lineTo(face[q % 4][0], face[q % 4][1]);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
};

/** the slab: the stacks still in it, far to near, its glow in the air (fading as it empties) */
const drawSlab = (ctx: CanvasRenderingContext2D, c: Cam3, A: AirWorld, f: number, poses: (BoxPose | null)[]) => {
  const inSlab = poses.map((p) => !!p && p.inSlab);
  const left = inSlab.filter(Boolean).length;
  if (left === 0) return;
  const cam: V3 = [c.cx, -c.h, -c.d];
  // the glow: around the slab's middle, fading as it empties
  const m = slabPt(0, (TILES * PIECE.l) / 2, (LAYERS * SLAB.lt) / 2, f);
  const s = F / Math.max(1, m[2] + c.d);
  const mx = 540 + (m[0] - c.cx) * s;
  const my = c.hy + (m[1] + c.h) * s;
  const R = TILES * PIECE.l * 0.75 * s;
  const gl = Math.pow(left / 100, 1.5) * (0.85 + 0.15 * Math.sin(f / 5));
  const gr = ctx.createRadialGradient(mx, my, R * 0.25, mx, my, R * 1.3);
  // full-strength stops faded by globalAlpha (tiny alphas in the stops band into colour rings)
  gr.addColorStop(0, "rgba(255,246,222,0.6)");
  gr.addColorStop(0.45, "rgba(252,236,204,0.26)");
  gr.addColorStop(1, "rgba(250,232,196,0)");
  ctx.globalAlpha = gl > 0.03 ? gl : 0;
  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = gr;
  ctx.fillRect(mx - R * 1.35, my - R * 1.35, R * 2.7, R * 2.7);
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
  const order: number[] = [];
  for (let k = 0; k < STACKS.length; k++) if (inSlab[k]) order.push(k);
  const dist = (k: number) => {
    const p = poses[k] as BoxPose;
    return Math.hypot(p.C[0] - cam[0], p.C[1] - cam[1], p.C[2] - cam[2]);
  };
  order.sort((x, y) => dist(y) - dist(x));
  for (const k of order) {
    const S = STACKS[k];
    const nb = (di: number, dj: number) => {
      const i2 = S.ti + di;
      const j2 = S.tj + dj;
      if (i2 < 0 || j2 < 0 || i2 >= TILES || j2 >= TILES) return false;
      return inSlab[i2 * TILES + j2];
    };
    // dir 0..3 = -a (left), +a (right), -b (down the face: the near edge), +b (up the face)
    const hide = (dir: number) => (dir === 0 ? nb(-1, 0) : dir === 1 ? nb(1, 0) : dir === 2 ? nb(0, -1) : nb(0, 1));
    const u = (S.ti - TILES / 2 + 0.5) * PIECE.w;
    const v = (S.tj + 0.5) * PIECE.l;
    drawBox(ctx, c, A, poses[k] as BoxPose, k, crackAt(u, v, f), hide, inkProgress(k, f));
  }
};

// ---- the painter: everything at depth > zMin and <= zMax, far to near ----
type Item = { z: number; kind: 0 | 1 | 2 | 3 | 4; i: number };
const drawWorld = (ctx: CanvasRenderingContext2D, A: AirWorld, c: Cam3, f: number, zMin: number, zMax: number) => {
  const pr: Pr = (X, Y, Z) => {
    const s = F / Math.max(1, Z + c.d);
    return [540 + (X - c.cx) * s, c.hy + (Y + c.h) * s];
  };
  const items: Item[] = [];
  for (let i = 0; i < N; i++) {
    const d = DESKS[i];
    const zr = d.Z + ROBOT_BACK;
    if (zr > zMin && zr <= zMax) items.push({ z: zr, kind: 0, i });
    const zd = d.Z + DESK.d / 2;
    if (zd > zMin && zd <= zMax) items.push({ z: zd, kind: 1, i });
  }
  const poses: (ReturnType<typeof piecePose> | null)[] = new Array(N).fill(null);
  for (let i = 0; i < N; i++) {
    const p = piecePose(DESKS[i], f);
    if (!p) continue;
    // a piece just above its desk draws over the desk (it is landing on its top)
    const d = DESKS[i];
    const zk = Math.abs(p.C[2] - (d.Z + DESK.d / 2)) < DESK.d && p.C[1] < -DESK.h + 2 ? d.Z + DESK.d / 2 - 0.5 : p.C[2];
    if (zk > zMin && zk <= zMax) {
      poses[i] = p;
      items.push({ z: zk, kind: 2, i });
    }
  }
  // the stacks: those still in the slab as one item (the slab), the flying ones each at its depth
  const sp = STACKS.map((_, k) => stackPose(k, f));
  let slabZ = -1e9;
  sp.forEach((p, k) => {
    if (!p) return;
    if (p.inSlab) slabZ = Math.max(slabZ, p.C[2]);
    else if (p.C[2] > zMin && p.C[2] <= zMax) items.push({ z: p.C[2], kind: 4, i: k });
  });
  if (slabZ > -1e9 && slabZ > zMin && slabZ <= zMax) items.push({ z: slabZ, kind: 3, i: 0 });
  items.sort((a, b) => b.z - a.z || a.kind - b.kind);
  for (const it of items) {
    if (it.kind === 0) drawRobot(ctx, c, A, it.i, f);
    else if (it.kind === 1) drawDesk(ctx, c, A, it.i, f, pr);
    else if (it.kind === 2) {
      const p = poses[it.i];
      const d = DESKS[it.i];
      if (p) drawPiece(ctx, c, A, p.C, p.a, p.b, d.k);
    } else if (it.kind === 4) drawBox(ctx, c, A, sp[it.i] as BoxPose, it.i, 0);
    else drawSlab(ctx, c, A, f, sp);
  }
};

// ---- the banner: a slate cloth hung over the hall on two cords, unrolling down on "10,000" ----
const Banner: React.FC<{ A: AirWorld; c: Cam3; f: number }> = ({ A, c, f }) => {
  const t = c01((f - BANNER.f0) / BANNER.dur);
  if (t <= 0) return null;
  const e = 1 - Math.pow(1 - t, 2.4);
  const s = F / (BANNER.Z + c.d);
  const pr = (X: number, Y: number): [number, number] => [540 + (X - c.cx) * s, c.hy + (Y + c.h) * s];
  const [xl, yt] = pr(BANNER.X - BANNER.w / 2, BANNER.top);
  const [xr] = pr(BANNER.X + BANNER.w / 2, BANNER.top);
  const hFull = BANNER.h * s;
  const yb = yt + hFull * e;
  const hz = -BANNER.top;
  // the banner keeps half the fog of its depth (the plate must read)
  const cloth = A.tone("#3E4B4C", BANNER.Z * 0.45, hz);
  const clothLo = A.tone("#2F3A3B", BANNER.Z * 0.45, hz);
  const cream = A.tone("#F2E9D4", BANNER.Z * 0.45, hz);
  const cord = A.tone("#2A2F2E", BANNER.Z * 0.45, hz);
  const fs = BANNER.h * 0.72 * s;
  const rod = Math.max(2, 22 * s);
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
      <defs>
        <clipPath id="ta-cloth">
          <rect x={xl} y={yt} width={xr - xl} height={Math.max(0, yb - yt)} />
        </clipPath>
        <linearGradient id="ta-clothg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={cloth} />
          <stop offset="1" stopColor={clothLo} />
        </linearGradient>
      </defs>
      <line x1={xl + (xr - xl) * 0.08} y1={-10} x2={xl + (xr - xl) * 0.08} y2={yt} stroke={cord} strokeWidth={Math.max(1, 8 * s)} strokeOpacity={0.8} />
      <line x1={xr - (xr - xl) * 0.08} y1={-10} x2={xr - (xr - xl) * 0.08} y2={yt} stroke={cord} strokeWidth={Math.max(1, 8 * s)} strokeOpacity={0.8} />
      <rect x={xl - rod} y={yt - rod * 0.6} width={xr - xl + 2 * rod} height={rod * 1.2} rx={rod * 0.6} fill={cord} />
      <g clipPath="url(#ta-cloth)">
        <rect x={xl} y={yt} width={xr - xl} height={hFull} fill="url(#ta-clothg)" />
        <text x={(xl + xr) / 2} y={yt + hFull * 0.5 + fs * 0.34} textAnchor="middle" fill={cream} style={{ fontFamily: PLATE_FONT, fontWeight: 700, fontSize: fs, letterSpacing: 0.02 * fs, fontVariantNumeric: "lining-nums" }}>
          10,000
        </text>
      </g>
      <rect x={xl - rod * 0.4} y={yb - rod * 0.7} width={xr - xl + rod * 0.8} height={rod * 1.4} rx={rod * 0.7} fill={clothLo} />
    </svg>
  );
};

const TenThousandAgents: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  useSprites();
  const c = cam3At(frame);
  const { cam, depth } = kitCam(c);
  const rest = kitCam(C0);
  const A = airWorldOf({ cam, rest: rest.cam, depth, frame, fogBy: "depth", scene: SCENE, figFog: FIG_FOG });
  const v = makeAirView({
    scene: { ...A.v.scene },
    frame,
    horizon: c.hy,
    cam: { x: c.cx, y: c.h, z: -c.d },
    rest: { x: C0.cx, y: C0.h, z: -C0.d },
  });
  return (
    <AirStage v={v} bloom={0.22}>
      <WorldSvg cam={cam}>
        <AirFloor A={A} x0={-16000} x1={16000} z0={-1500} z1={34000} mat={MAT.ground} course={300} jointAmt={0.3} melt={0.45} />
        <AirHorizonHazeW A={A} id="ta-haze" />
      </WorldSvg>
      <FolkCanvas draw={(ctx) => drawWorld(ctx, A, c, frame, BANNER.Z, 1e9)} />
      <Banner A={A} c={c} f={frame} />
      <FolkCanvas draw={(ctx) => drawWorld(ctx, A, c, frame, -1e9, BANNER.Z)} />
    </AirStage>
  );
};

export default TenThousandAgents;
