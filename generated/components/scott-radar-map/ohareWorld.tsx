// OHARE_WORLD
// ===================================================================================================================
// ohareWorld — the Denver world of scott-weather-fired (denverWorld.tsx, imported READ-ONLY) carried to Chicago
// O'Hare on a summer afternoon, for scott-radar-map. Same camera (DenCam orbit, miles), same air (fogAt / HAZE), same
// storm cells (cellItems, the world's storm life), same sky (droneSeaShared SKY), grade, vignette and grain; a new
// ground: the Chicago suburbs (baked tile), the farmland past the Fox River and the forest preserves (baked region),
// O'Hare traced from the FAA diagram (baked field texture + painted runways + standing terminals, tower, gate jets),
// the expressways. Chicago is flat: no mountains.
//
// API
//   <OhareStage S v cells groundJets glints ground over light?>
//     S = story clock (frames), v = makeView(cam) (the Denver world's camera), cells = StormState[] (denverStorms),
//     groundJets = jets standing / rolling on the ground (drawn depth-sorted with the buildings, shadows on the
//     ground), ground = SVG children on the ground (under every standing thing), over = SVG children over the world
//     (airborne jets, contrails, labels), light = the sunlit pool over the airfield (0..1, default 1).
//   OHARE_SUN / OHARE_SUN_DIR / ohareShadow(z): the afternoon sun (south-west, 38 deg up) for the airfield's objects.
//   airJetNodes(v, key, pose, len): the 3D airliner (plan body lit from above, spine, fin) as SVG + its ground shadow.
// ===================================================================================================================
import React, { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { AbsoluteFill, Img, cancelRender, continueRender, delayRender, staticFile } from "remotion";
import { GRADE, OCEAN } from "../kits/cheeky-pint/oceanShared";
import { SKY } from "../kits/cheeky-pint/droneSeaShared";
import { COLOR, GRAIN, GROUND } from "../kits/cheeky-pint/stoutShared";
import {
  CX,
  H,
  HAZE,
  HAZE_FAR,
  NEAR,
  W,
  cellItems,
  cellShadow,
  clamp01,
  fogAt,
  hash01,
  hexRgb,
  jetPlanPoints,
  lerp,
  mixRgb,
  paintCloudItem,
  projectLine,
  projectPoly,
  resetCloudPool,
  rgbCss,
  rgbHex,
  smooth,
  type CloudItem,
  type DenView,
  type RGB,
  type StormState,
} from "../scott-weather-fired/denverWorld";
import { CONCOURSES, CRESCENT, GARAGE, ROADS, RUNWAYS, TOWER, gatesOf, type Bar } from "./ohareAirfield";

export * from "./ohareAirfield";

const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();
type P2 = { x: number; y: number };
type P3 = [number, number, number];
export const polyD = (pts: P2[]) => (pts.length > 2 ? `M${pts.map((p) => `${f3(p.x)} ${f3(p.y)}`).join("L")}Z` : "");
export const lineD = (pts: P2[]) => (pts.length > 1 ? `M${pts.map((p) => `${f3(p.x)} ${f3(p.y)}`).join("L")}` : "");

// ===================================================================================================================
// THE LIGHT: a summer afternoon sun in the south-west (upper left of the cameras that look west)
// ===================================================================================================================
const D2R = Math.PI / 180;
export const OHARE_SUN = { azimuth: 222, elevation: 38 } as const;
export const OHARE_SUN_DIR: P3 = (() => {
  const a = OHARE_SUN.azimuth * D2R;
  const e = OHARE_SUN.elevation * D2R;
  return [Math.sin(a) * Math.cos(e), Math.cos(a) * Math.cos(e), Math.sin(e)];
})();
/** ground offset (miles) of a shadow cast from height z: away from the sun (toward the north-east) */
export const ohareShadow = (z: number) => {
  const k = z / Math.tan(OHARE_SUN.elevation * D2R);
  const a = OHARE_SUN.azimuth * D2R;
  return { x: -Math.sin(a) * k, y: -Math.cos(a) * k };
};
const lambert = (n: P3) => {
  const l = Math.hypot(n[0], n[1], n[2]) || 1;
  return (n[0] * OHARE_SUN_DIR[0] + n[1] * OHARE_SUN_DIR[1] + n[2] * OHARE_SUN_DIR[2]) / l;
};

export const ORD_COLORS = {
  runway: "#ECE3D3",
  runwayEdge: "#CFC4AE",
  centre: "#FBF6EC",
  road: "#C9BC9F",
  roofLit: "#FFFBF2",
  roofMid: "#F1E8D8",
  wallLit: "#E2D6C2",
  wallShade: "#A39582",
  glass: "#7C6E5F",
  jet: "#F6F0E4",
  jetShade: "#BDB09D",
  /** the jets' outline: a warm brown so a cream jet still reads on pale concrete */
  jetLine: "#7E6D59",
  shadow: COLOR.shadow,
} as const;
/** the buildings' height exaggeration (so the terminals read at ~6-13 miles) and the runways' widening */
export const BLD_EXAG = 2.4;
export const RUNWAY_EXAG = 1.7;
export const RUNWAY_EXAG_AERIAL = 1.3;

// ===================================================================================================================
// TEXTURES (scripts/clips/scott-radar-map/bake-ohare.py)
// ===================================================================================================================
export const TEX = {
  suburbs: { src: "scott-radar-map/suburbs.jpg", mi: 8, ox: 0.31, oy: 0.17, tile: true },
  region: { src: "scott-radar-map/region.png", mi: 128, ox: -64, oy: 64, tile: false },
  /** keep in sync with bake-ohare.py OHARE_FIELD_MI / FIELD_CX / FIELD_CY */
  field: { src: "scott-radar-map/ohare-field.png", mi: 5.6, ox: -0.25 - 2.8, oy: 2.8, tile: false },
  /** the NAIP 2023 orthophoto registered to the same square (bake-ohare-aerial.py) */
  aerial: { src: "scott-radar-map/ohare-aerial.webp", mi: 5.6, ox: -0.25 - 2.8, oy: 2.8, tile: false },
} as const;
export type AirfieldLook = "aerial" | "paint";
type Mips = HTMLCanvasElement[];
const MIP_PROMISE = new Map<string, Promise<Mips>>();
const MIP_READY = new Map<string, Mips>();
const loadMips = (src: string, tile: boolean): Promise<Mips> => {
  const have = MIP_PROMISE.get(src);
  if (have) return have;
  const p = new Promise<Mips>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const levels: HTMLCanvasElement[] = [];
      const c0 = document.createElement("canvas");
      c0.width = img.naturalWidth;
      c0.height = img.naturalHeight;
      (c0.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D).drawImage(img, 0, 0);
      levels.push(c0);
      while (levels[levels.length - 1].width > 16 && levels.length < 10) {
        const prev = levels[levels.length - 1];
        const w = Math.max(1, Math.round(prev.width / 2));
        const h = Math.max(1, Math.round(prev.height / 2));
        const c = document.createElement("canvas");
        c.width = w;
        c.height = h;
        const cx = c.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D;
        cx.imageSmoothingEnabled = true;
        cx.imageSmoothingQuality = "high";
        if (tile) {
          const tiled = document.createElement("canvas");
          tiled.width = prev.width * 3;
          tiled.height = prev.height * 3;
          const tc = tiled.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D;
          for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) tc.drawImage(prev, i * prev.width, j * prev.height);
          cx.drawImage(tiled, prev.width, prev.height, prev.width, prev.height, 0, 0, w, h);
        } else {
          cx.drawImage(prev, 0, 0, prev.width, prev.height, 0, 0, w, h);
        }
        levels.push(c);
      }
      MIP_READY.set(src, levels);
      resolve(levels);
    };
    img.onerror = () => reject(new Error(`ohareWorld: could not load ${src}`));
    img.src = staticFile(src);
  });
  MIP_PROMISE.set(src, p);
  return p;
};
type Texs = { suburbs: Mips; region: Mips; field: Mips; aerial: Mips };
const useTextures = (): Texs | null => {
  const list = [TEX.suburbs, TEX.region, TEX.field, TEX.aerial];
  const ready = list.every((t) => MIP_READY.has(t.src));
  const [, bump] = useState(0);
  const [handle] = useState(() => (ready ? null : delayRender("ohareWorld textures", { timeoutInMilliseconds: 120000 })));
  useEffect(() => {
    if (handle === null) return;
    let live = true;
    Promise.all(list.map((t) => loadMips(t.src, t.tile))).then(
      () => {
        if (live) bump((n) => n + 1);
        continueRender(handle);
      },
      (e) => cancelRender(e),
    );
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handle]);
  return ready ? { suburbs: MIP_READY.get(TEX.suburbs.src) as Mips, region: MIP_READY.get(TEX.region.src) as Mips, field: MIP_READY.get(TEX.field.src) as Mips, aerial: MIP_READY.get(TEX.aerial.src) as Mips } : null;
};

// ===================================================================================================================
// GROUND CANVAS
// ===================================================================================================================
const fillPoly = (ctx: CanvasRenderingContext2D, pts: P2[]) => {
  if (pts.length < 3) return;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
  ctx.fill();
};
const ribbon = (pts: [number, number][], w: number): [number, number][][] => {
  const quads: [number, number][][] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    const l = Math.hypot(x1 - x0, y1 - y0) || 1;
    const nx = (-(y1 - y0) / l) * (w / 2);
    const ny = ((x1 - x0) / l) * (w / 2);
    const ex = ((x1 - x0) / l) * (w / 2);
    const ey = ((y1 - y0) / l) * (w / 2);
    quads.push([
      [x0 - nx - ex, y0 - ny - ey],
      [x1 - nx + ex, y1 - ny + ey],
      [x1 + nx + ex, y1 + ny + ey],
      [x0 + nx - ex, y0 + ny - ey],
    ]);
  }
  return quads;
};
type TexLayer = { mips: Mips; mi: number; ox: number; oy: number; repeat: boolean };
const patOf = (ctx: CanvasRenderingContext2D, c: HTMLCanvasElement, repeat: boolean) => ctx.createPattern(c, repeat ? "repeat" : "no-repeat");
const texRow = (ctx: CanvasRenderingContext2D, L: TexLayer, A: P2, B: P2, D: P2, yc: number, y: number, h: number) => {
  const base = L.mips[0];
  const s = base.width / L.mi;
  const ax = B.x * s;
  const ay = -B.y * s;
  const nx = D.x * s;
  const ny = -D.y * s;
  const rate = Math.max(Math.hypot(ax, ay), 0.4 * Math.hypot(nx, ny));
  const lvl = Math.max(0, Math.min(L.mips.length - 1, Math.floor(Math.log2(Math.max(1, rate)))));
  const m = L.mips[lvl];
  const sc = m.width / base.width;
  const px = (A.x - L.ox) * s * sc;
  const py = (L.oy - A.y) * s * sc;
  const pat = patOf(ctx, m, L.repeat);
  if (!pat) return;
  const inv = new DOMMatrix([ax * sc, ay * sc, nx * sc, ny * sc, px - nx * sc * yc, py - ny * sc * yc]);
  pat.setTransform(inv.inverse());
  ctx.fillStyle = pat;
  ctx.fillRect(0, y, W, h);
};

/** the ground's extra haze over the Denver world's air (a humid Midwest summer: the suburbs soften with distance) */
export const GROUND_AIR = 1.25;
/** the field's centre (for the sunlit pool) */
export const FIELD_CENTRE = { x: -0.25, y: 0.1 } as const;

type GroundOpts = { S: number; cells: StormState[]; textures: Texs; light: number; gloomX: number; airfield: AirfieldLook };
const drawGround = (ctx: CanvasRenderingContext2D, v: DenView, o: GroundOpts) => {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  ctx.filter = "none";
  ctx.clearRect(0, 0, W, H);
  const hor = v.horizonY;
  const y0 = Math.max(0, Math.floor(Number.isFinite(hor) ? hor + 1 : 0));
  if (y0 >= H) return;
  const sub: TexLayer = { mips: o.textures.suburbs, mi: TEX.suburbs.mi, ox: TEX.suburbs.ox, oy: TEX.suburbs.oy, repeat: true };
  const reg: TexLayer = { mips: o.textures.region, mi: TEX.region.mi, ox: TEX.region.ox, oy: TEX.region.oy, repeat: false };
  const aerialOn = o.airfield === "aerial";
  const fld: TexLayer = aerialOn
    ? { mips: o.textures.aerial, mi: TEX.aerial.mi, ox: TEX.aerial.ox, oy: TEX.aerial.oy, repeat: false }
    : { mips: o.textures.field, mi: TEX.field.mi, ox: TEX.field.ox, oy: TEX.field.oy, repeat: false };
  type Row = { y: number; h: number; A: P2; B: P2; D: P2; yc: number; dist: number; gx: number; gy: number };
  const rows: Row[] = [];
  for (let y = y0; y < H; ) {
    const yc = y + 0.5;
    const A = v.unproject(0, yc);
    const A1 = v.unproject(1, yc);
    const A2 = v.unproject(0, yc + 1);
    const C = v.unproject(CX, yc);
    if (!A || !A1 || !A2 || !C) {
      y += 1;
      continue;
    }
    const B = { x: A1.x - A.x, y: A1.y - A.y };
    const D = { x: A2.x - A.x, y: A2.y - A.y };
    const dist = Math.hypot(C.x - v.eye[0], C.y - v.eye[1]);
    const h = Math.hypot(D.x, D.y) < 0.02 && y > hor + 60 ? 2 : 1;
    rows.push({ y, h, A, B, D, yc, dist, gx: C.x, gy: C.y });
    y += h;
  }
  // 1. the textures (suburbs, region, the field)
  for (const r of rows) {
    if (r.dist > 600) continue;
    texRow(ctx, sub, r.A, r.B, r.D, r.yc, r.y, r.h);
    texRow(ctx, reg, r.A, r.B, r.D, r.yc, r.y, r.h);
    if (r.dist < 40) texRow(ctx, fld, r.A, r.B, r.D, r.yc, r.y, r.h);
  }
  const paint = (pts: [number, number][], col: string) => {
    ctx.fillStyle = col;
    fillPoly(ctx, projectPoly(v, pts.map(([x, y]) => [x, y, 0])));
  };
  const minLine = (pts: [number, number][], px: number, col: string, alpha: number) => {
    ctx.strokeStyle = col;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = px;
    ctx.lineCap = "butt";
    for (const run of projectLine(
      v,
      pts.map(([x, y]) => [x, y, 0]),
    )) {
      if (run.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(run[0].x, run[0].y);
      for (let i = 1; i < run.length; i++) ctx.lineTo(run[i].x, run[i].y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  };
  // 2. the expressways (pale ribbons with a minimum on-screen width)
  for (const r of ROADS) {
    const dense: [number, number][] = [];
    for (let i = 0; i < r.pts.length - 1; i++) {
      const [ax, ay] = r.pts[i];
      const [bx, by] = r.pts[i + 1];
      const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / 0.5));
      for (let k = 0; k < n; k++) dense.push([lerp(ax, bx, k / n), lerp(ay, by, k / n)]);
    }
    dense.push(r.pts[r.pts.length - 1]);
    for (const q of ribbon(dense, r.w)) paint(q, ORD_COLORS.road);
    minLine(dense, 1.2, ORD_COLORS.road, 0.75);
  }
  // 3. the runways: concrete strips (modestly widened), dashed centrelines where wide enough
  for (const rw of RUNWAYS) {
    const seg: [number, number][] = [
      [rw.x0, rw.y0],
      [rw.x1, rw.y1],
    ];
    // on the photo the runways are re-painted lightly (so they read at the wide cameras); on the diagram, fully
    ctx.globalAlpha = 1;
    minLine(seg, 1.4, ORD_COLORS.runway, aerialOn ? 0.55 : 0.9);
    ctx.globalAlpha = aerialOn ? 0.62 : 1;
    for (const q of ribbon(seg, rw.w * (aerialOn ? RUNWAY_EXAG_AERIAL : RUNWAY_EXAG))) paint(q, ORD_COLORS.runway);
    ctx.globalAlpha = 1;
    const mid = v.project((rw.x0 + rw.x1) / 2, (rw.y0 + rw.y1) / 2, 0);
    if (mid && v.F / mid.d > 60) {
      const L = Math.hypot(rw.x1 - rw.x0, rw.y1 - rw.y0);
      const n = Math.floor(L / 0.05);
      ctx.fillStyle = ORD_COLORS.centre;
      ctx.globalAlpha = clamp01((v.F / mid.d - 60) / 80) * 0.75;
      for (let i = 1; i < n - 1; i += 2) {
        const a = i / n;
        const b = (i + 0.6) / n;
        for (const q of ribbon(
          [
            [lerp(rw.x0, rw.x1, a), lerp(rw.y0, rw.y1, a)],
            [lerp(rw.x0, rw.x1, b), lerp(rw.y0, rw.y1, b)],
          ],
          3 * (1 / 5280) * 3,
        ))
          fillPoly(ctx, projectPoly(v, q.map(([x, y]) => [x, y, 0])));
      }
      ctx.globalAlpha = 1;
    }
  }
  // 4. the air: every row veiled by its distance
  for (const r of rows) {
    const fog = r.dist > 600 ? 1 : fogAt(v, r.gx, r.gy, 0, GROUND_AIR);
    const nearHor = Number.isFinite(hor) ? smooth(140, 0, r.y - hor) : 0;
    const col = mixRgb(HAZE, HAZE_FAR, nearHor);
    ctx.fillStyle = rgbCss(col, fog);
    ctx.fillRect(0, r.y, W, r.h);
  }
  // 4a. the gloom under the storm line: the ground west of gloomX darkens (the anvils' shade, the rain), so the
  // sunlit airfield reads by contrast; a soft gradient across the ground in world x (rows run across the view)
  if (o.gloomX > -999) {
    for (const r of rows) {
      const gl = smooth(o.gloomX + 9, o.gloomX - 2, r.gx) * (1 - 0.45 * fogAt(v, r.gx, r.gy, 0));
      if (gl < 0.004) continue;
      ctx.fillStyle = rgbCss(hexRgb("#4E3E30"), 0.58 * gl);
      ctx.fillRect(0, r.y, W, r.h);
    }
  }
  // 4b. cloud shadows (concentric fills, no canvas blur)
  for (const c of o.cells) {
    const sh = cellShadow(v, c, o.S);
    if (!sh) continue;
    const cx = sh.pts.reduce((a, p) => a + p.x, 0) / sh.pts.length;
    const cy = sh.pts.reduce((a, p) => a + p.y, 0) / sh.pts.length;
    const steps = 12;
    ctx.fillStyle = rgbCss(hexRgb("#3A2A1E"), 1 - Math.pow(1 - sh.a, 1 / steps));
    for (let k = 0; k < steps; k++) {
      const f = 1.25 - (k / (steps - 1)) * 0.75;
      fillPoly(
        ctx,
        sh.pts.map((p) => ({ x: cx + (p.x - cx) * f, y: cy + (p.y - cy) * f })),
      );
    }
  }
  // 4c. the sun on the airport: the ground away from the airfield settles a touch darker, the airfield's own ground is
  // drawn again over the air (crisper, more contrast: the near air is clear in the sun), and a warm pool of light
  // (screen, concentric world ellipses round the field, perspective-true) lifts it, so it reads lighter than its
  // surroundings
  if (o.light > 0.01) {
    ctx.fillStyle = rgbCss(hexRgb("#4A3828"), 0.16 * o.light);
    ctx.fillRect(0, y0, W, H - y0);
    ctx.globalAlpha = 0.62 * o.light;
    for (const r of rows) if (r.dist < 40) texRow(ctx, fld, r.A, r.B, r.D, r.yc, r.y, r.h);
    ctx.globalAlpha = 1;
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const steps = 14;
    ctx.fillStyle = rgbCss(hexRgb("#6A5230"), 1 - Math.pow(1 - 0.62 * o.light, 1 / steps));
    for (let k = 0; k < steps; k++) {
      const f = 1.35 - (k / (steps - 1)) * 0.95;
      const ring: [number, number, number][] = [];
      for (let i = 0; i < 48; i++) {
        const a = (i / 48) * Math.PI * 2;
        ring.push([FIELD_CENTRE.x + Math.cos(a) * 1.9 * f, FIELD_CENTRE.y + Math.sin(a) * 2.5 * f, 0]);
      }
      fillPoly(ctx, projectPoly(v, ring));
    }
    ctx.restore();
  }
  // 5. the horizon haze over the ground
  if (Number.isFinite(hor) && hor < H) {
    const g = ctx.createLinearGradient(0, hor, 0, hor + 90);
    g.addColorStop(0, rgbCss(HAZE_FAR, 0.85));
    g.addColorStop(0.4, rgbCss(HAZE_FAR, 0.35));
    g.addColorStop(1, rgbCss(HAZE_FAR, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, Math.max(0, hor), W, 90);
  }
};

// ===================================================================================================================
// STANDING CANVAS: storm cells, terminals, tower, gate jets, ground jets; one depth-sorted list
// ===================================================================================================================
type Tri = { d: number; pts: P2[]; col: string };
type Item = CloudItem | { type: "tris"; d: number; tris: Tri[] } | { type: "draw"; d: number; draw: (ctx: CanvasRenderingContext2D) => void };

const shadeCol = (lit: string, mid: string, dark: string, ndl: number, fog: number) => {
  const a = hexRgb(lit);
  const b = hexRgb(mid);
  const c = hexRgb(dark);
  const t = clamp01(ndl * 1.6 + 0.15);
  const col = t > 0.5 ? mixRgb(b, a, (t - 0.5) * 2) : mixRgb(c, b, t * 2);
  return rgbHex(mixRgb(col, HAZE, fog));
};
/** a prism over a ground polygon (CCW in world), height h: its visible walls and its roof */
const prismTris = (v: DenView, poly: [number, number][], h: number, roof: string): Tri[] => {
  const tris: Tri[] = [];
  const cx = poly.reduce((a, p) => a + p[0], 0) / poly.length;
  const cy = poly.reduce((a, p) => a + p[1], 0) / poly.length;
  const fog = fogAt(v, cx, cy, h);
  for (let i = 0; i < poly.length; i++) {
    const [x0, y0] = poly[i];
    const [x1, y1] = poly[(i + 1) % poly.length];
    const nrm: P3 = [y1 - y0, -(x1 - x0), 0];
    const mx = (x0 + x1) / 2;
    const my = (y0 + y1) / 2;
    if (nrm[0] * (v.eye[0] - mx) + nrm[1] * (v.eye[1] - my) <= 0) continue;
    const q = v.project(mx, my, h / 2);
    if (!q) continue;
    tris.push({
      d: q.d,
      pts: projectPoly(v, [
        [x0, y0, 0],
        [x1, y1, 0],
        [x1, y1, h],
        [x0, y0, h],
      ]),
      col: shadeCol(ORD_COLORS.wallLit, ORD_COLORS.wallShade, "#76685A", lambert(nrm) * 1.3, fog),
    });
  }
  const q = v.project(cx, cy, h);
  if (q) tris.push({ d: q.d - 0.002, pts: projectPoly(v, poly.map(([x, y]) => [x, y, h])), col: rgbHex(mixRgb(hexRgb(roof), HAZE, fog)) });
  return tris;
};
const barPoly = (b: Bar): [number, number][] => {
  const L = Math.hypot(b.x1 - b.x0, b.y1 - b.y0) || 1;
  const nx = (-(b.y1 - b.y0) / L) * (b.w / 2);
  const ny = ((b.x1 - b.x0) / L) * (b.w / 2);
  const pts: [number, number][] = [
    [b.x0 - nx, b.y0 - ny],
    [b.x1 - nx, b.y1 - ny],
    [b.x1 + nx, b.y1 + ny],
    [b.x0 + nx, b.y0 + ny],
  ];
  // counter-clockwise
  const area = pts.reduce((a, p, i) => a + (p[0] * pts[(i + 1) % 4][1] - pts[(i + 1) % 4][0] * p[1]), 0);
  return area >= 0 ? pts : pts.reverse();
};
const crescentPolys = (): [number, number][][] => {
  const out: [number, number][][] = [];
  const n = 9;
  for (let i = 0; i < n; i++) {
    const a = (CRESCENT.a0 + ((CRESCENT.a1 - CRESCENT.a0) * i) / n) * D2R;
    const b = (CRESCENT.a0 + ((CRESCENT.a1 - CRESCENT.a0) * (i + 1)) / n) * D2R;
    const ri = CRESCENT.r - CRESCENT.w / 2;
    const ro = CRESCENT.r + CRESCENT.w / 2;
    out.push([
      [CRESCENT.cx + Math.cos(a) * ri, CRESCENT.cy + Math.sin(a) * ri],
      [CRESCENT.cx + Math.cos(a) * ro, CRESCENT.cy + Math.sin(a) * ro],
      [CRESCENT.cx + Math.cos(b) * ro, CRESCENT.cy + Math.sin(b) * ro],
      [CRESCENT.cx + Math.cos(b) * ri, CRESCENT.cy + Math.sin(b) * ri],
    ].reverse() as [number, number][]);
  }
  return out.map((p) => {
    const area = p.reduce((a, q, i) => a + (q[0] * p[(i + 1) % p.length][1] - p[(i + 1) % p.length][0] * q[1]), 0);
    return area >= 0 ? p : p.slice().reverse();
  });
};
const CRESCENT_POLYS = crescentPolys();

/** a jet standing or rolling on the ground (world miles; heading rad, 0 = nose north) */
export type GroundJet = { key: string; x: number; y: number; h: number; len: number; glint?: number };
const CREAM = hexRgb(COLOR.cream);
const CREAM_FOOT = hexRgb(COLOR.creamFoot);

const groundJetDraw = (v: DenView, j: GroundJet) => (ctx: CanvasRenderingContext2D) => {
  const fog = fogAt(v, j.x, j.y, 0);
  const zb = j.len * 0.06;
  const sh = ohareShadow(zb + j.len * 0.05);
  ctx.fillStyle = rgbCss(hexRgb(COLOR.shadow), 0.38 * (1 - fog));
  fillPoly(ctx, projectPoly(v, jetPlanPoints(j.x + sh.x, j.y + sh.y, j.h, j.len, 0)));
  const s = Math.sin(j.h);
  const c = Math.cos(j.h);
  const W3 = (a: number, b: number, zz: number): P3 => [j.x + (a * c + b * s) * j.len, j.y + (-a * s + b * c) * j.len, zb + zz * j.len];
  ctx.fillStyle = rgbHex(mixRgb(mixRgb(CREAM_FOOT, CREAM, 0.55), HAZE, fog));
  ctx.strokeStyle = rgbHex(mixRgb(hexRgb(ORD_COLORS.jetLine), HAZE, fog));
  ctx.lineWidth = 0.9;
  const plan = projectPoly(v, jetPlanPoints(j.x, j.y, j.h, j.len, zb));
  fillPoly(ctx, plan);
  ctx.beginPath();
  plan.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.closePath();
  ctx.stroke();
  ctx.fillStyle = rgbHex(mixRgb(CREAM, HAZE, fog));
  fillPoly(ctx, projectPoly(v, [W3(-0.045, 0.43, 0.04), W3(0.045, 0.43, 0.04), W3(0.05, -0.38, 0.04), W3(-0.05, -0.38, 0.04)]));
  const fin = projectPoly(v, [W3(0, -0.3, 0.04), W3(0, -0.47, 0.04), W3(0, -0.5, 0.22), W3(0, -0.42, 0.22)]);
  ctx.fillStyle = rgbHex(mixRgb(mixRgb(CREAM_FOOT, CREAM, 0.6), HAZE, fog));
  fillPoly(ctx, fin);
  ctx.stroke();
  // a glint of sun on the fuselage (a soft cream-white spark)
  const gl = clamp01(j.glint ?? 0);
  if (gl > 0.02) {
    const q = v.project(...W3(0, 0.12, 0.06));
    if (q) {
      const k = (j.len * v.F) / q.d;
      const r = Math.max(3, k * 0.32);
      const g = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, r);
      g.addColorStop(0, `rgba(255,251,240,${f3(0.95 * gl)})`);
      g.addColorStop(0.35, `rgba(255,240,205,${f3(0.45 * gl)})`);
      g.addColorStop(1, "rgba(255,240,205,0)");
      ctx.fillStyle = g;
      ctx.fillRect(q.x - r, q.y - r, r * 2, r * 2);
    }
  }
};

/** the storm wall's tone: the line's world x, its tops' and its base's heights (miles), the darkening 0..1 */
export type StormShade = { x: number; zTop: number; zBase: number; amount: number };
type StandingOpts = { S: number; cells: RankedStorm[]; groundJets: GroundJet[]; gateGlint: (i: number) => number; stormShade?: StormShade; anvils?: Anvil[]; squall?: Squall };
const airfieldItems = (v: DenView, o: StandingOpts): Item[] => {
  const items: Item[] = [];
  const tris: Tri[] = [];
  for (const p of CRESCENT_POLYS) tris.push(...prismTris(v, p, CRESCENT.h * BLD_EXAG, ORD_COLORS.roofLit));
  for (const b of CONCOURSES) tris.push(...prismTris(v, barPoly(b), b.h * BLD_EXAG, ORD_COLORS.roofLit));
  tris.push(...prismTris(v, barPoly(GARAGE), GARAGE.h * BLD_EXAG, ORD_COLORS.roofMid));
  // the tower: a shaft and a wider cab
  const sq = (x: number, y: number, r: number): [number, number][] => [
    [x - r, y - r],
    [x + r, y - r],
    [x + r, y + r],
    [x - r, y + r],
  ];
  const towerH = TOWER.h * BLD_EXAG;
  for (const t of prismTris(v, sq(TOWER.x, TOWER.y, TOWER.shaft / 2), towerH * 0.86, ORD_COLORS.roofMid)) tris.push(t);
  const cab = prismTris(v, sq(TOWER.x, TOWER.y, TOWER.cab / 2), towerH, ORD_COLORS.roofLit).map((t) => ({ ...t, d: t.d - 0.01 }));
  tris.push(...cab);
  tris.sort((a, b) => b.d - a.d);
  const pc = v.project(0, 0, 0);
  if (pc) items.push({ type: "tris", d: pc.d, tris });
  // gate jets round the concourses (one item per concourse, drawn just behind its building)
  let gi = 0;
  for (const b of CONCOURSES) {
    const q = v.project((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2, 0);
    if (!q) continue;
    if (v.F / q.d < 30) continue;
    const gates = gatesOf(b, b.name === "T5" ? 0.07 : 0.05);
    const jets: GroundJet[] = [];
    for (const g of gates) {
      gi++;
      if (hash01(gi * 3.3 + 0.7) < 0.2) continue;
      const len = 0.06;
      jets.push({ key: `g${gi}`, x: g.x + Math.sin(g.h) * -len * 0.5, y: g.y + Math.cos(g.h) * -len * 0.5, h: g.h, len, glint: o.gateGlint(gi) });
    }
    for (const j of jets) {
      const qj = v.project(j.x, j.y, 0);
      if (qj) items.push({ type: "draw", d: qj.d, draw: groundJetDraw(v, j) });
    }
  }
  for (const j of o.groundJets) {
    const qj = v.project(j.x, j.y, 0);
    if (qj) items.push({ type: "draw", d: qj.d, draw: groundJetDraw(v, j) });
  }
  return items;
};

/** An anvil: a flat-topped shelf spreading from a big tower's top along the line (world centre x, y, its top z, its
 *  thickness and half-length in miles), tapering to thin wispy ends; sunlit cream on top, shaded warm grey below,
 *  veiled by the air; its edges stream slowly on the story clock. Drawn behind the cells (the tower rises into it). */
export type Anvil = { x: number; y: number; zTop: number; thick: number; half: number; seed: number; rankX?: number };
const anvilNoise = (t: number, seed: number) =>
  0.5 * Math.sin(t * 0.9 + seed) + 0.3 * Math.sin(t * 2.3 + seed * 1.7) + 0.2 * Math.sin(t * 5.1 + seed * 0.3);
const drawAnvil = (ctx: CanvasRenderingContext2D, v: DenView, a: Anvil, S: number) => {
  const n = 64;
  const top: P2[] = [];
  const bot: P2[] = [];
  for (let i = 0; i <= n; i++) {
    const u = -1 + (2 * i) / n;
    const y = a.y + u * a.half;
    const flow = S * 0.008;
    const taper = Math.pow(Math.max(0, 1 - u * u), 0.6);
    const zt = a.zTop + 0.12 * anvilNoise(y * 1.3 + flow, a.seed) * taper - 0.25 * u * u;
    const zb = zt - a.thick * taper * (0.75 + 0.25 * anvilNoise(y * 1.7 - flow, a.seed + 3.1));
    const qt = v.project(a.x, y, zt);
    const qb = v.project(a.x + 0.6, y, zb);
    if (!qt || !qb) continue;
    top.push({ x: qt.x, y: qt.y });
    bot.push({ x: qb.x, y: qb.y });
  }
  if (top.length < 3) return;
  const fog = fogAt(v, a.x, a.y, a.zTop - a.thick / 2);
  const yT = Math.min(...top.map((p) => p.y));
  const yB = Math.max(...bot.map((p) => p.y));
  const g = ctx.createLinearGradient(0, yT, 0, yB);
  g.addColorStop(0, rgbCss(mixRgb(hexRgb("#FFF1D8"), HAZE, fog), 1));
  g.addColorStop(0.5, rgbCss(mixRgb(hexRgb("#E6CFAE"), HAZE, fog), 1));
  g.addColorStop(1, rgbCss(mixRgb(hexRgb("#A48D77"), HAZE, fog), 1));
  ctx.save();
  ctx.filter = "blur(1.2px)";
  ctx.fillStyle = g;
  ctx.beginPath();
  top.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  for (let i = bot.length - 1; i >= 0; i--) ctx.lineTo(bot[i].x, bot[i].y);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
};

/** The squall line's base: one continuous dark warm-slate shelf along the line in front of the cells' bases (its top
 *  edge lumpy, churning slowly on the story clock), and rain curtains hanging from it to the ground, heavier in places,
 *  streaked, falling (the streaks travel down on the clock), veiled by the air. */
export type Squall = { x: number; y0: number; y1: number; zTop: number; zBot: number; seed: number; rankX?: number };
const drawSquall = (ctx: CanvasRenderingContext2D, v: DenView, q: Squall, S: number) => {
  const n = 220;
  const top: P2[] = [];
  const bot: P2[] = [];
  const gnd: P2[] = [];
  const heavy: number[] = [];
  for (let i = 0; i <= n; i++) {
    const y = lerp(q.y0, q.y1, i / n);
    const xs = q.x + 0.05 * y;
    const zt = q.zTop + 0.18 * anvilNoise(y * 1.9 + S * 0.01, q.seed) + 0.08 * anvilNoise(y * 5.3 - S * 0.02, q.seed + 2);
    const zb = q.zBot + 0.06 * anvilNoise(y * 3.1 + S * 0.015, q.seed + 5);
    const a = v.project(xs + 1.2, y, zt);
    const b = v.project(xs + 1.5, y, zb);
    const g = v.project(xs + 2.3, y, 0);
    if (!a || !b || !g) continue;
    top.push({ x: a.x, y: a.y });
    bot.push({ x: b.x, y: b.y });
    gnd.push({ x: g.x, y: g.y });
    heavy.push(clamp01(0.55 + 0.6 * anvilNoise(y * 0.8 + 1.3, q.seed + 9)));
  }
  if (top.length < 3) return;
  const fog = fogAt(v, q.x + 1.5, v.cam.ty, q.zBot);
  const slate = mixRgb(hexRgb("#4F443C"), HAZE, fog * 0.8);
  const slateLit = mixRgb(hexRgb("#6B5D51"), HAZE, fog * 0.8);
  const rain = mixRgb(hexRgb("#4A4039"), HAZE, fog * 0.6);
  ctx.save();
  // rain curtains: strips between the shelf's underside and the ground, their weight varying along the line
  for (let i = 0; i < top.length - 1; i++) {
    const w = heavy[i];
    const gr = ctx.createLinearGradient(0, bot[i].y, 0, gnd[i].y);
    gr.addColorStop(0, rgbCss(rain, 0.8 * w));
    gr.addColorStop(0.7, rgbCss(rain, 0.55 * w));
    gr.addColorStop(1, rgbCss(rain, 0.2 * w));
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.moveTo(bot[i].x - 0.5, bot[i].y);
    ctx.lineTo(bot[i + 1].x + 0.5, bot[i + 1].y);
    ctx.lineTo(gnd[i + 1].x + 0.5, gnd[i + 1].y);
    ctx.lineTo(gnd[i].x - 0.5, gnd[i].y);
    ctx.closePath();
    ctx.fill();
  }
  // falling streaks
  ctx.lineWidth = 1.2;
  for (let k = 0; k < 140; k++) {
    const i = Math.floor(hash01(k * 3.7 + q.seed) * (top.length - 1));
    const w = heavy[i];
    if (w < 0.25) continue;
    const hS = gnd[i].y - bot[i].y;
    if (hS < 6) continue;
    const dash = Math.max(4, hS * (0.1 + 0.08 * hash01(k * 1.3)));
    ctx.setLineDash([dash, dash * 0.8]);
    ctx.lineDashOffset = -(S * hS * 0.04 * (0.8 + 0.4 * hash01(k * 2.9))) - hash01(k + 4) * dash * 2;
    ctx.strokeStyle = rgbCss(rain, 0.35 * w);
    ctx.beginPath();
    ctx.moveTo(bot[i].x, bot[i].y);
    ctx.lineTo(gnd[i].x + (gnd[i].x - bot[i].x) * 0.1, gnd[i].y);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  // the shelf: a dark band, a little lighter along its lumpy top edge (caught by the light under the towers)
  const yT = Math.min(...top.map((p) => p.y));
  const yB = Math.max(...bot.map((p) => p.y));
  const g = ctx.createLinearGradient(0, yT, 0, yB);
  g.addColorStop(0, rgbCss(slateLit, 0.95));
  g.addColorStop(0.35, rgbCss(slate, 0.97));
  g.addColorStop(1, rgbCss(mixRgb(slate, hexRgb("#3E3530"), 0.5), 0.98));
  ctx.filter = "blur(1.2px)";
  ctx.fillStyle = g;
  ctx.beginPath();
  top.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  for (let i = bot.length - 1; i >= 0; i--) ctx.lineTo(bot[i].x, bot[i].y);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
};

/** the offscreen canvas the storm cells are painted on (so their lower bodies can be toned as one wall) */
let CELLS_CV: HTMLCanvasElement | null = null;
const drawStanding = (ctx: CanvasRenderingContext2D, v: DenView, o: StandingOpts) => {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  ctx.filter = "none";
  ctx.clearRect(0, 0, W, H);
  resetCloudPool();
  // 1. the storm cells (all far behind the airfield): painted far -> near on their own canvas, then the wall's lower
  // body toned down to a heavy warm slate (screen-vertical gradient between the line's tops and its base)
  // ONE STABLE BACK-TO-FRONT ORDER for the whole cut (never a per-frame depth sort, which flips neighbouring towers
  // as the camera pans and tilts): every storm element is ranked by a fixed world key (its x: the cameras always look
  // west, so a smaller x is farther), farthest first. Each tower's anvil is drawn just before its own tower (behind its
  // dome, in front of every farther tower), each tower's rain just after it, the squall shelf and its curtains at the
  // shelf's own key (behind the nearest rank of towers, in front of the far rank).
  type Op = { key: number; sub: number; draw: (cc: CanvasRenderingContext2D) => void };
  const ops: Op[] = [];
  o.cells.forEach((c, i) => {
    const its = cellItems(v, c, o.S);
    const key = c.rankX ?? c.x;
    ops.push({ key, sub: 1 + i * 1e-3, draw: (cc) => its.forEach((it) => paintCloudItem(cc, it)) });
  });
  (o.anvils ?? []).forEach((an, i) => ops.push({ key: an.rankX ?? an.x, sub: 0 + i * 1e-3, draw: (cc) => drawAnvil(cc, v, an, o.S) }));
  if (o.squall) {
    const sq = o.squall;
    ops.push({ key: sq.rankX ?? sq.x + 1.0, sub: 2, draw: (cc) => drawSquall(cc, v, sq, o.S) });
  }
  ops.sort((a, b) => a.key - b.key || a.sub - b.sub);
  if (ops.length) {
    if (!CELLS_CV) CELLS_CV = document.createElement("canvas");
    const cv = CELLS_CV;
    cv.width = W;
    cv.height = H;
    const cc = cv.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D;
    for (const op of ops) op.draw(cc);
    const sh = o.stormShade;
    if (sh) {
      const a = v.project(sh.x, v.cam.ty, sh.zTop);
      const b = v.project(sh.x, v.cam.ty, sh.zBase);
      const g0 = v.project(sh.x, v.cam.ty, 0);
      if (a && b && g0) {
        cc.globalCompositeOperation = "source-atop";
        const gr = cc.createLinearGradient(0, a.y, 0, g0.y);
        const col = hexRgb("#4E4239");
        const span = g0.y - a.y || 1;
        const tb = clamp01((b.y - a.y) / span);
        gr.addColorStop(0, rgbCss(col, 0));
        gr.addColorStop(clamp01(tb * 0.45), rgbCss(col, 0));
        gr.addColorStop(clamp01(tb * 0.8), rgbCss(col, 0.55 * sh.amount));
        gr.addColorStop(tb, rgbCss(col, 0.72 * sh.amount));
        gr.addColorStop(1, rgbCss(col, 0.55 * sh.amount));
        cc.fillStyle = gr;
        cc.fillRect(0, 0, W, H);
        cc.globalCompositeOperation = "source-over";
      }
    }
    ctx.drawImage(cv, 0, 0);
  }
  // 2. the airfield (buildings, gate jets, ground jets), depth-sorted
  const items = airfieldItems(v, o);
  items.sort((a, b) => b.d - a.d);
  for (const it of items) {
    if (it.type === "tris") {
      for (const t of it.tris) {
        if (t.pts.length < 3) continue;
        ctx.fillStyle = t.col;
        ctx.strokeStyle = t.col;
        ctx.lineWidth = 0.6;
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(t.pts[0].x, t.pts[0].y);
        for (let i = 1; i < t.pts.length; i++) ctx.lineTo(t.pts[i].x, t.pts[i].y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    } else if (it.type === "draw") {
      it.draw(ctx);
    } else {
      paintCloudItem(ctx, it);
    }
  }
};

// ===================================================================================================================
// THE AIRBORNE JET (SVG): plan body lit from above, a spine, the fin; its soft ground shadow separately
// ===================================================================================================================
export type AirPose = { x: number; y: number; z: number; h: number; bank?: number };
export const airJetNodes = (v: DenView, key: string, p: AirPose, len: number, opacity = 1, glint = 0): { body: { d: number; node: React.ReactNode } | null; shadow: React.ReactNode } => {
  const q = v.project(p.x, p.y, p.z);
  if (!q) return { body: null, shadow: null };
  const fog = fogAt(v, p.x, p.y, p.z);
  const s = Math.sin(p.h);
  const c = Math.cos(p.h);
  const bank = p.bank ?? 0;
  // jet-local (a across to the right, b forward, z up) -> world; a bank tips the wings (right wing down for + bank)
  const W3 = (a: number, b: number, zz: number): P3 => {
    const za = zz * Math.cos(bank) - a * Math.sin(bank);
    const aa = a * Math.cos(bank) + zz * Math.sin(bank);
    return [p.x + (aa * c + b * s) * len, p.y + (-aa * s + b * c) * len, p.z + za * len];
  };
  const fogged = (col: RGB) => mixRgb(col, HAZE, fog);
  const planPts = jetPlanPointsBanked(p, len, bank);
  const plan = projectPoly(v, planPts);
  const spine = projectPoly(v, [W3(-0.045, 0.43, 0.035), W3(0.045, 0.43, 0.035), W3(0.05, -0.38, 0.035), W3(-0.05, -0.38, 0.035)]);
  const fin = projectPoly(v, [W3(0, -0.3, 0.03), W3(0, -0.47, 0.03), W3(0, -0.5, 0.22), W3(0, -0.42, 0.22)]);
  const finN: P3 = [c, -s, 0];
  const finLit = Math.abs(finN[0] * OHARE_SUN_DIR[0] + finN[1] * OHARE_SUN_DIR[1]);
  const sh = ohareShadow(p.z);
  const shadowPts = projectPoly(v, jetPlanPoints(p.x + sh.x, p.y + sh.y, p.h, len, 0));
  const shOp = 0.45 * (1 - fog) * lerp(1, 0.25, clamp01(p.z / 1.2)) * opacity;
  const stroke = rgbHex(fogged(hexRgb(ORD_COLORS.jetLine)));
  // a glint of sun on the fuselage (soft cream-white, a few frames)
  const gq = glint > 0.02 ? v.project(...W3(0, 0.12, 0.05)) : null;
  const gR = gq ? Math.max(4, ((len * v.F) / gq.d) * 0.3) : 0;
  return {
    shadow: shOp > 0.004 ? <path key={`s${key}`} d={polyD(shadowPts)} fill={COLOR.shadow} opacity={f3(shOp)} /> : null,
    body: {
      d: q.d,
      node: (
        <g key={`j${key}`} opacity={f3(opacity)}>
          <path d={polyD(plan)} fill={rgbHex(fogged(mixRgb(CREAM_FOOT, CREAM, 0.55)))} stroke={stroke} strokeWidth={1.1} strokeLinejoin="round" />
          <path d={polyD(spine)} fill={rgbHex(fogged(CREAM))} />
          <path d={polyD(fin)} fill={rgbHex(fogged(mixRgb(CREAM_FOOT, CREAM, clamp01(0.3 + finLit))))} stroke={stroke} strokeWidth={0.6} strokeLinejoin="round" />
          {gq ? <circle cx={f3(gq.x)} cy={f3(gq.y)} r={f3(gR)} fill="#FFFBF0" opacity={f3(0.9 * glint)} style={{ filter: `blur(${f3(gR * 0.45)}px)` }} /> : null}
        </g>
      ),
    },
  };
};
const jetPlanPointsBanked = (p: AirPose, len: number, bank: number): P3[] => {
  const base = jetPlanPoints(0, 0, 0, 1, 0); // nose +y, unit length
  const s = Math.sin(p.h);
  const c = Math.cos(p.h);
  return base.map(([a, b]) => {
    const za = -a * Math.sin(bank);
    const aa = a * Math.cos(bank);
    return [p.x + (aa * c + b * s) * len, p.y + (-aa * s + b * c) * len, p.z + za * len];
  });
};

// ===================================================================================================================
// THE STAGE
// ===================================================================================================================
const HIGH_CLOUDS = [
  { x: 80, h: 620, w: 460, t: 24, a: 0.26, v: 0.16 },
  { x: 860, h: 520, w: 540, t: 20, a: 0.22, v: 0.12 },
  { x: 480, h: 400, w: 640, t: 16, a: 0.24, v: 0.1 },
  { x: 1300, h: 300, w: 500, t: 12, a: 0.2, v: 0.08 },
  { x: 260, h: 210, w: 720, t: 10, a: 0.24, v: 0.06 },
  { x: 1080, h: 820, w: 400, t: 28, a: 0.18, v: 0.2 },
] as const;

const Canvas: React.FC<{ draw: (ctx: CanvasRenderingContext2D) => void; deps: unknown[] }> = ({ draw, deps }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    cv.width = W;
    cv.height = H;
    draw(cv.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return <canvas ref={ref} width={W} height={H} style={{ position: "absolute", left: 0, top: 0, width: W, height: H }} />;
};

/** a storm cell with its fixed layer rank (world x key; smaller = farther = drawn first); default its x */
export type RankedStorm = StormState & { rankX?: number };
export type OhareStageProps = {
  S: number;
  v: DenView;
  cells?: RankedStorm[];
  groundJets?: GroundJet[];
  /** glint strength 0..1 of gate jet i (default none) */
  gateGlint?: (i: number) => number;
  ground?: React.ReactNode;
  over?: React.ReactNode;
  /** the sunlit pool over the airfield */
  light?: number;
  /** the airfield's ground: "aerial" (default: the registered NAIP photo, graded, runways re-painted lightly) or
   *  "paint" (the FAA diagram's pavement, painted) */
  airfield?: AirfieldLook;
  /** the storm wall's lower-body tone (see StormShade) */
  stormShade?: StormShade;
  anvils?: Anvil[];
  squall?: Squall;
  /** world x west of which the ground lies in the storms' gloom (default -16) */
  gloomX?: number;
  dust?: number;
  highCloud?: number;
  grade?: number;
};

const NO_GLINT = () => 0;
export const OhareStage: React.FC<OhareStageProps> = ({ S, v, cells = [], groundJets = [], gateGlint = NO_GLINT, ground, over, light = 1, airfield = "aerial", gloomX = -16, stormShade, anvils, squall, dust = 1, highCloud = 1, grade = 1 }) => {
  const uid = `ord${useId().replace(/[^A-Za-z0-9_-]/g, "_")}`;
  const tex = useTextures();
  const hor = v.horizonY;
  const skyOn = Number.isFinite(hor) && hor > -40;
  const g2 = Math.floor(S / 2);
  const grx = (hash01(g2 + 1) * 2 - 1) * GRAIN.travel;
  const gry = (hash01(g2 + 7) * 2 - 1) * GRAIN.travel;
  const glints = Array.from({ length: 160 }, (_, i) => gateGlint(i));
  const key = JSON.stringify([v.cam, S, cells, groundJets, glints, light, gloomX, stormShade, anvils, squall, airfield]);
  return (
    <AbsoluteFill style={{ backgroundColor: rgbHex(HAZE), overflow: "hidden" }}>
      {skyOn ? (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", left: 0, top: 0 }}>
          <defs>
            <linearGradient id={`${uid}sky`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(hor - 1250)} x2="0" y2={f3(hor)}>
              <stop offset="0" stopColor={SKY.top} />
              <stop offset="0.24" stopColor={SKY.upper} />
              <stop offset="0.46" stopColor={SKY.amber} />
              <stop offset="0.66" stopColor={SKY.mid} />
              <stop offset="0.83" stopColor={SKY.low} />
              <stop offset="0.93" stopColor={SKY.glow} />
              <stop offset="1" stopColor={SKY.haze} />
            </linearGradient>
            <radialGradient id={`${uid}sun`} gradientUnits="userSpaceOnUse" cx={-60} cy={f3(hor - 260)} r={980}>
              <stop offset="0" stopColor={SKY.sun} stopOpacity="0.78" />
              <stop offset="0.3" stopColor={SKY.sun} stopOpacity="0.3" />
              <stop offset="1" stopColor={SKY.sun} stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect x={0} y={0} width={W} height={f3(Math.min(H, Math.max(0, hor + 4)))} fill={`url(#${uid}sky)`} />
          <rect x={0} y={0} width={W} height={f3(Math.min(H, Math.max(0, hor + 4)))} fill={`url(#${uid}sun)`} />
          {highCloud > 0 ? (
            <g style={{ filter: "blur(16px)" }} opacity={highCloud}>
              {HIGH_CLOUDS.map((c, i) => {
                const cx = ((((c.x + S * c.v - v.cam.heading * 18) % 1700) + 1700) % 1700) - 300;
                return <ellipse key={i} cx={f3(cx)} cy={f3(hor - c.h)} rx={c.w} ry={c.t} fill={c.h > 420 ? SKY.cloudHi : SKY.cloudLo} opacity={c.a} />;
              })}
            </g>
          ) : null}
          <rect x={0} y={f3(hor - 90)} width={W} height={92} fill={SKY.haze} opacity={0.55} style={{ filter: "blur(20px)" }} />
        </svg>
      ) : null}
      {tex ? <Canvas deps={[key, "g"]} draw={(ctx) => drawGround(ctx, v, { S, cells, textures: tex, light, gloomX, airfield })} /> : null}
      {ground ? (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          {ground}
        </svg>
      ) : null}
      <Canvas deps={[key, "s"]} draw={(ctx) => drawStanding(ctx, v, { S, cells, groundJets, gateGlint, stormShade, anvils, squall })} />
      {over ? (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          {over}
        </svg>
      ) : null}
      {dust > 0 ? <Dust S={S} v={v} amount={dust} /> : null}
      {grade > 0 ? (
        <AbsoluteFill
          style={{
            mixBlendMode: "soft-light",
            opacity: grade,
            background: `linear-gradient(to bottom, ${GRADE.top} 0%, ${GRADE.mid} 45%, ${GRADE.bottom} 100%)`,
          }}
        />
      ) : null}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 104% 100% at 50% 46%, rgba(${OCEAN.vignette},0) 45%, rgba(${OCEAN.vignette},0.14) 72%, rgba(${OCEAN.vignette},0.3) 100%)`,
        }}
      />
      <AbsoluteFill style={{ mixBlendMode: GRAIN.blend, opacity: GRAIN.opacity }}>
        <Img src={staticFile(GROUND.grain)} style={{ position: "absolute", left: (W - GROUND.W) / 2 + grx, top: (H - GROUND.H) / 2 + gry, width: GROUND.W, height: GROUND.H }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Dust: React.FC<{ S: number; v: DenView; amount: number }> = ({ S, v, amount }) => {
  const motes = Array.from({ length: 46 }, (_, i) => {
    const h1 = hash01(i * 3.7 + 11);
    const h2 = hash01(i * 5.1 + 12);
    const h3 = hash01(i * 7.9 + 13);
    const depth = 0.3 + 0.7 * h3;
    const x = ((((h1 * 1300 + S * (0.35 + 0.5 * h3) - v.cam.tx * 40 * depth) % 1300) + 1300) % 1300) - 110;
    const y = ((((h2 * 2100 - S * 0.12 * depth + v.cam.ty * 30 * depth + 12 * Math.sin(S / 37 + i)) % 2100) + 2100) % 2100) - 90;
    const r = 0.9 + 2.2 * depth * hash01(i + 0.5);
    return <circle key={i} cx={f3(x)} cy={f3(y)} r={f3(r)} fill={OCEAN.cream} opacity={f3(amount * (0.1 + 0.22 * depth))} style={depth > 0.85 ? { filter: "blur(1.2px)" } : undefined} />;
  });
  return (
    <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
      {motes}
    </svg>
  );
};

/** keep the near-plane constant visible to cut builders (a jet closer than this is not drawn) */
export const ORD_NEAR = NEAR;
