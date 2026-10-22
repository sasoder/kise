// DENVER_WORLD
// ===================================================================================================================
// denverWorld — THE SHARED WORLD of scott-weather-fired (Cheeky Pint S4E05, Scott Kirby, "say weather and you're
// fired"): Denver International out on the high plains at golden hour, in the Will "at sea" look carried into the AIR
// (styles/cheeky-pint.md § Realistic ocean variant; droneSeaShared's SKY, oceanShared's grade / grain / vignette and
// damped camera, stoutShared's COLOR / fonts / bloom). Cut builders import it READ-ONLY.
//
// API CONTRACT (all world units are statute MILES: x east, y north, z up; origin = the Jeppesen Terminal on the ground)
//   CAMERA (denverCamera.ts, re-exported)
//     DenCam {tx, ty, dist, pitch, heading, fov}   an orbit about a ground target (it projects to 540 x 960); pitch
//                                                 degrees below level (90 = straight down), heading 0 = north,
//                                                 fov = VERTICAL degrees. Continuous from a low oblique to top-down.
//     makeView(cam) -> DenView                    .project(x, y, z) -> {x, y, d} | null, .scaleAt, .unproject,
//                                                 .horizonY (-Infinity when straight down), .eye, .F
//     denCameraTrack / makeDenClock(start, glides, S_END, PRE)   damped keys (oceanShared CAM_STIFF / CAM_DAMP);
//                                                 DenGlide {f0, f1, dtx, dty, dist, pitch, heading, fov, warp}
//     mixCam(a, b, t), fogAt(v, x, y, z), fogRgb, HAZE, SUN, SUN_DIR, shadowOffset
//   STAGE
//     <AirStage S v cells rampActive rampTravel ground over dust highCloud terminalScale front?>
//         sky (SKY ramp, low sun glow upper left, soft drifting high cloud, horizon haze), the Front Range on the left
//         horizon, the plains (baked textures, fogged by distance, horizon haze over the ground only), the DEN airfield
//         (runways, taxiways, aprons painted on the ground; terminal tent roof, concourses, parked jets and ramp
//         vehicles standing), cloud shadows, `ground` (SVG, screen px, drawn ON the ground under every standing
//         thing), the storm cells and every standing object depth-sorted in one canvas, `over` (SVG, screen px), dust,
//         the soft-light grade, the brown vignette, stout grain on twos. Nothing black.
//         S = the story clock (frames; cut 1's f0 = S 0; see CLOCK). v = makeView(cam).
//         cells: StormState[] (see STORMS). rampActive 0..1 (1 = the ramp vehicles creep along their lanes, 0 =
//         stopped); rampTravel = the vehicles' distance clock (integrate rampActive: rampTravelAt(S, activeAt));
//         default S * rampActive. terminalScale: the terminal's plan + height exaggeration (default 2.6, so the
//         peaks read at the cut-2..4 framing; the airfield itself is true scale).
//   STORMS (denverStorms.ts, re-exported)
//     StormSpec {id, x, y, seed, vx, vy, size, anvilDir}; StormState = spec + {growth 0..1, glow 0..1, rain?}
//     cellPos(spec, S), CLOUD (heights). Growth billows (turrets out of the top, the base widens), never scales up.
//   LIGHTNING   <LightningStrike v from={x,y} to={x,y} t seed size?>  SVG (screen px). The bolt's tip draws from the
//               cell base to the ground over STRIKE.draw frames: CONTACT at t = STRIKE.contact (3). Hot core amberHot,
//               amber bloom, a ground-contact glow settling over STRIKE.settle (12) frames, the bolt fading over
//               STRIKE.fade (10) frames after contact. strikeGlow(t) = the cell's `glow` for those frames. No flash.
//   RING        <ThreeMileRing v draw lit from? label? labelIn?>  on the ground, centred on the terminal, radius
//               RING_MI (3 statute miles); draw 0..1 (a moving tip from bearing `from`, clockwise), lit 0..1 (cream
//               hairline -> solid amber band with bloom = the ramp closed), "3 MI" label (FONT_LABEL) sliding up.
//   ARRIVALS    CORNER_POSTS (NE / SE / SW / NW), <CornerPost v post narrow>, <ArrivalStream v post S rateAt jetLen>
//               (jets enter at the frame edge, pass the post, land; spacing follows the integrated rate, so a falling
//               rate opens gaps at the entry: no jet is ever deleted mid-air), <WorstCaseBlanket v cover S>.
//   CONSTANTS   DEN_CAM_ESTABLISH (cut 1's last frame), DEN_CAM_RING (cuts 2-4), DEN_CAM_AREA (cut 5, top-down),
//               CUT1 (duration, camera clock), POPUP_CELLS + popupCellsAt(S) + POPUP_END (cut 1's last frame), the
//               cell positions the cuts use (CELL_POS).
// ===================================================================================================================
import React, { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { AbsoluteFill, Img, cancelRender, continueRender, delayRender, staticFile } from "remotion";
import { GRADE, OCEAN } from "../kits/cheeky-pint/oceanShared";
import { SKY } from "../kits/cheeky-pint/droneSeaShared";
import { COLOR, FONT_LABEL, GRAIN, GROUND, Label, bloomFilter } from "../kits/cheeky-pint/stoutShared";
import {
  CX,
  CY,
  H,
  HAZE,
  HAZE_FAR,
  NEAR,
  SUN_DIR,
  W,
  clamp01,
  fogAt,
  hash01,
  hexRgb,
  lerp,
  makeDenClock,
  makeView,
  mixRgb,
  rgbCss,
  rgbHex,
  smooth,
  type DenCam,
  type DenView,
} from "./denverCamera";
import { APRONS, CONCOURSES, GARAGES, PROPERTY, RAMP_LANES, RUNWAY_NOT_IN_AERIAL, ROADS, RUNWAYS, TAXIWAYS, TERMINAL, gatesOf, type Box } from "./denverAirfield";
import { cellItems, cellShadow, paintCloudItem, resetCloudPool, type CloudItem, type StormState } from "./denverStorms";

export * from "./denverCamera";
export * from "./denverAirfield";
export * from "./denverStorms";

const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();
type P2 = { x: number; y: number };

// ===================================================================================================================
// CLOCK, CAMERAS, CELLS (the constants the cuts share)
// ===================================================================================================================
export const FPS = 24000 / 1001;
/** Story clock: S = cut 1's frame. Cut 2 opens on cut 1's last frame (S = CUT1.last) and continues S = CUT1.last + f. */
export const CUT1 = { duration: 65, last: 64 } as const;

/** Cut 1 opens low over the plains south of DEN and pushes in, descending slightly, toward DEN_CAM_ESTABLISH. */
export const CUT1_CAM_START: DenCam = { tx: 0.1, ty: 0.25, dist: 13.6, pitch: 23, heading: -25, fov: 60 };
export const CUT1_CAM_GOAL: DenCam = { tx: 0.15, ty: 0.05, dist: 9.6, pitch: 21.5, heading: -22, fov: 60 };
export const CUT1_CAM = makeDenClock(
  CUT1_CAM_START,
  [{ f0: -30, f1: 92, dist: CUT1_CAM_GOAL.dist, pitch: CUT1_CAM_GOAL.pitch, heading: CUT1_CAM_GOAL.heading, dtx: CUT1_CAM_GOAL.tx - CUT1_CAM_START.tx, dty: CUT1_CAM_GOAL.ty - CUT1_CAM_START.ty, warp: 0.9 }],
  CUT1.duration + 40,
  60,
);
export const cut1CamAt = (S: number) => CUT1_CAM.at(S);
/** cut 1's resolved view = its last frame (cut 2 opens on exactly this camera) */
export const DEN_CAM_ESTABLISH: DenCam = CUT1_CAM.at(CUT1.last);
/** cuts 2-4: the airfield and the whole 3-mile ring in frame (ring centre ~y 880, ~900 px wide), storms above it */
export const DEN_CAM_RING: DenCam = { tx: 0.25, ty: -1.05, dist: 9.5, pitch: 25, heading: -22, fov: 60 };
/** cut 5: top-down over the whole Denver area, out to ~45 nm (52 statute miles) each side */
export const DEN_CAM_AREA: DenCam = { tx: 0, ty: 0, dist: 165, pitch: 90, heading: 0, fov: 60 };

/** Cell positions the cuts share (miles, at S = 0). W = the cell that strikes in cut 2 (its base over the ring's
 *  west edge). */
export const CELL_POS = {
  W: { x: -4.3, y: 2.4 },
  NW: { x: -5.5, y: 12 },
  NE: { x: 1.9, y: 5.0 },
  SE: { x: 6.4, y: -0.6 },
} as const;
/** the storms' common drift (miles / frame): the westerlies carry them slowly east */
export const CELL_DRIFT = { vx: 0.0035, vy: 0.0006 } as const;

type PopupCell = { id: string; x: number; y: number; seed: number; size: number; g0: number; g1: number; s0: number; s1: number; anvilDir?: number; flankDir?: number };
/** Cut 1's cells: four that billow into cumulonimbus (staggered so the strongest burst lands on "pop-up", f45-53:
 *  NE, in full view right of the field, grows fastest at f53 and is still boiling at the last frame), and four small cumulus that only swell. growth = g0 -> g1 over the
 *  smoothstep S s0 -> s1 (continues past cut 1, so cut 2 can keep the clock running). */
export const POPUP_CELLS: PopupCell[] = [
  { id: "NW", ...CELL_POS.NW, seed: 11, size: 1.05, g0: 0.16, g1: 1, s0: -12, s1: 58 },
  { id: "W", ...CELL_POS.W, seed: 23, size: 0.78, g0: 0.1, g1: 0.94, s0: 0, s1: 66 },
  { id: "NE", ...CELL_POS.NE, seed: 37, size: 0.9, g0: 0.05, g1: 0.94, s0: 30, s1: 76 },
  { id: "SE", ...CELL_POS.SE, seed: 41, size: 0.6, g0: 0.08, g1: 0.8, s0: 6, s1: 66 },
  { id: "cu1", x: -1.2, y: 16, seed: 51, size: 0.9, g0: 0.1, g1: 0.24, s0: -20, s1: 90 },
  { id: "cu2", x: 10.5, y: 19, seed: 53, size: 1, g0: 0.1, g1: 0.22, s0: -20, s1: 90 },
  { id: "cu3", x: -12, y: 5, seed: 57, size: 0.9, g0: 0.08, g1: 0.2, s0: -10, s1: 100 },
  { id: "cu4", x: 3, y: 26, seed: 59, size: 1.1, g0: 0.14, g1: 0.3, s0: -30, s1: 80 },
];
/** The cut-1 storm states at story clock S (any S; past cut 1 they keep growing toward g1). */
export const popupCellsAt = (S: number): StormState[] =>
  POPUP_CELLS.map((c) => ({
    id: c.id,
    x: c.x,
    y: c.y,
    seed: c.seed,
    size: c.size,
    vx: CELL_DRIFT.vx,
    vy: CELL_DRIFT.vy,
    anvilDir: c.anvilDir,
    flankDir: c.flankDir,
    growth: lerp(c.g0, c.g1, smooth(c.s0, c.s1, S)),
  }));
/** cut 1's last frame's storms: cut 2 opens on exactly these (with S = CUT1.last) */
export const POPUP_END: StormState[] = popupCellsAt(CUT1.last);

// ===================================================================================================================
// TEXTURES (baked by scripts/clips/scott-weather-fired/bake-plains.py)
// ===================================================================================================================
export const TEX = {
  plains: { src: "scott-weather-fired/plains.jpg", mi: 16, ox: 0.37, oy: 0.21, tile: true },
  region: { src: "scott-weather-fired/region.png", mi: 160, ox: -80, oy: 80, tile: false },
  /** the USGS 2002 orthophoto of DEN registered to denverAirfield and graded warm (bake-den-aerial.py), feathered */
  aerial: { src: "scott-weather-fired/den-aerial.webp", mi: 6.674, ox: -3.535, oy: 4.544, tile: false },
} as const;
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
          // halve a 3 x 3 tiling so the level stays seamless at its edges
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
    img.onerror = () => reject(new Error(`denverWorld: could not load ${src}`));
    img.src = staticFile(src);
  });
  MIP_PROMISE.set(src, p);
  return p;
};
const useTextures = () => {
  const list = [TEX.plains, TEX.region, TEX.aerial];
  const ready = list.every((t) => MIP_READY.has(t.src));
  const [, bump] = useState(0);
  const [handle] = useState(() => (ready ? null : delayRender("denverWorld textures", { timeoutInMilliseconds: 120000 })));
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
  return ready ? { plains: MIP_READY.get(TEX.plains.src) as Mips, region: MIP_READY.get(TEX.region.src) as Mips, aerial: MIP_READY.get(TEX.aerial.src) as Mips } : null;
};

// ===================================================================================================================
// GEOMETRY HELPERS (screen projection with near-plane clipping)
// ===================================================================================================================
/** Project a world polygon (z per point, default 0), clipped against the near plane. */
export const projectPoly = (v: DenView, pts: [number, number, number?][]): P2[] => {
  const cam = pts.map(([x, y, z]) => {
    const dx = x - v.eye[0];
    const dy = y - v.eye[1];
    const dz = (z ?? 0) - v.eye[2];
    return { d: dx * v.f[0] + dy * v.f[1] + dz * v.f[2], xc: dx * v.r[0] + dy * v.r[1], yc: dx * v.u[0] + dy * v.u[1] + dz * v.u[2] };
  });
  const lim = NEAR * 2;
  const out: { d: number; xc: number; yc: number }[] = [];
  for (let i = 0; i < cam.length; i++) {
    const a = cam[i];
    const b = cam[(i + 1) % cam.length];
    const ain = a.d > lim;
    const bin = b.d > lim;
    if (ain) out.push(a);
    if (ain !== bin) {
      const t = (lim - a.d) / (b.d - a.d);
      out.push({ d: lim, xc: a.xc + (b.xc - a.xc) * t, yc: a.yc + (b.yc - a.yc) * t });
    }
  }
  return out.map((c) => ({ x: CX + (v.F * c.xc) / c.d, y: CY - (v.F * c.yc) / c.d }));
};
/** A ground polyline (open) projected with clipping, as screen segments. */
export const projectLine = (v: DenView, pts: [number, number, number?][]): P2[][] => {
  const runs: P2[][] = [];
  let cur: P2[] = [];
  for (const [x, y, z] of pts) {
    const q = v.project(x, y, z ?? 0);
    if (q && q.d > NEAR * 2) cur.push({ x: q.x, y: q.y });
    else if (cur.length) {
      runs.push(cur);
      cur = [];
    }
  }
  if (cur.length) runs.push(cur);
  return runs;
};
const polyD = (pts: P2[]) => (pts.length ? `M${pts.map((p) => `${f3(p.x)} ${f3(p.y)}`).join("L")}Z` : "");
const lineD = (pts: P2[]) => (pts.length ? `M${pts.map((p) => `${f3(p.x)} ${f3(p.y)}`).join("L")}` : "");
const fillPoly = (ctx: CanvasRenderingContext2D, pts: P2[]) => {
  if (pts.length < 3) return;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
  ctx.fill();
};
/** A ribbon (a polyline with a world width) as ground quads. */
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

// ===================================================================================================================
// PALETTE (ground, pavement, buildings: local colours in the low sun; the air veils them by distance)
// ===================================================================================================================
/** The terminal's default exaggeration (plan and height) and the extra lift of its peaks, so the row of white peaks
 *  reads at the ring framing (the rest of the airfield is true scale). */
export const TERMINAL_SCALE = 3.2;
export const TERMINAL_PEAK_LIFT = 2.0;
/** The exaggerated roof keeps the real terminal's north end (so it never runs into Concourse A) and grows south. */
export const terminalCentreY = (scale: number) => TERMINAL.y + TERMINAL.len / 2 - (TERMINAL.len * scale) / 2;
/** Runways are drawn this much wider than true (150 / 200 ft) so the pinwheel reads from the cut-1 / ring distance. */
export const RUNWAY_EXAG = 3.4;
/** the runways' widening when they are re-painted over the aerial (modest, so it still looks real) */
export const RUNWAY_EXAG_AERIAL = 1.8;
export const DEN_COLORS = {
  property: "#C9BB8C",
  runway: "#EAE1D1",
  shoulder: "#CDBF94",
  runwayEdge: "#C8BCA4",
  taxi: "#CEC2A9",
  apron: "#E0D6C2",
  forecourt: "#C2B59C",
  road: "#BDB099",
  centre: "#F6F0E4",
  roofLit: "#FFFCF4",
  roofMid: "#F3EBDC",
  roofShade: "#DACDB8",
  wallLit: "#D9CDB8",
  wallShade: "#9C8E7B",
  glass: "#6E6256",
  jet: "#F3ECDF",
  jetShade: "#B9AD9B",
  vehicle: "#F2E9D8",
  mountain: "#7E7B82",
  mountainLit: "#9A8F8E",
  shadow: COLOR.shadow,
} as const;

// ===================================================================================================================
// THE FRONT RANGE (far left horizon): a ridge line west of DEN (x ~ -36..-48 mi), peaks ~1.6 mi above the plains
// (Longs Peak near (-45, 41)), drawn as a hazy blue-brown silhouette. Heights x1.35 so it reads at ~60-150 mi.
// ===================================================================================================================
const RIDGE: [number, number, number][] = (() => {
  const out: [number, number, number][] = [];
  for (let i = 0; i <= 120; i++) {
    const y = -70 + i * 2.3;
    const xBase = -40 - 4 * Math.sin(y / 23) - (y > 70 ? (y - 70) * 0.35 : 0);
    const n = 0.55 * Math.sin(y * 0.41 + 1.3) + 0.35 * Math.sin(y * 1.13 + 0.4) + 0.2 * Math.sin(y * 2.7);
    const longs = Math.exp(-Math.pow((y - 41) / 9, 2)) * 0.45;
    const fade = y > 110 ? Math.max(0.35, 1 - (y - 110) / 140) : 1;
    out.push([xBase, y, (1.05 + 0.32 * n + longs) * 1.35 * fade]);
  }
  return out;
})();

// ===================================================================================================================
// THE GROUND CANVAS: plains + region textures in perspective (row by row), the airfield painted, cloud shadows, the
// air by distance, the horizon haze over the ground, the Front Range.
// ===================================================================================================================
type TexLayer = { mips: Mips; mi: number; ox: number; oy: number; repeat: boolean };
/** a fresh pattern per draw call: a cached CanvasPattern carries state between frames inside one render tab, which
 *  made a frame rendered after others differ (by up to 5/255) from the same frame rendered fresh (cut joins must be
 *  pixel-exact) */
const patOf = (ctx: CanvasRenderingContext2D, c: HTMLCanvasElement, repeat: boolean) => ctx.createPattern(c, repeat ? "repeat" : "no-repeat");
/** fill one screen row [y, y + h) with a texture layer under the row's affine mapping */
const texRow = (ctx: CanvasRenderingContext2D, L: TexLayer, A: P2, B: P2, D: P2, yc: number, y: number, h: number) => {
  const base = L.mips[0];
  const s = base.width / L.mi; // texels per mile at level 0
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

type GroundOpts = { S: number; cells: StormState[]; textures: { plains: Mips; region: Mips; aerial: Mips }; airfield: AirfieldLook };
const drawGround = (ctx: CanvasRenderingContext2D, v: DenView, o: GroundOpts) => {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  ctx.filter = "none";
  ctx.clearRect(0, 0, W, H);
  const hor = v.horizonY;
  const y0 = Math.max(0, Math.floor(Number.isFinite(hor) ? hor + 1 : 0));
  if (y0 >= H) return;
  const plains: TexLayer = { mips: o.textures.plains, mi: TEX.plains.mi, ox: TEX.plains.ox, oy: TEX.plains.oy, repeat: true };
  const region: TexLayer = { mips: o.textures.region, mi: TEX.region.mi, ox: TEX.region.ox, oy: TEX.region.oy, repeat: false };
  const aerial: TexLayer = { mips: o.textures.aerial, mi: TEX.aerial.mi, ox: TEX.aerial.ox, oy: TEX.aerial.oy, repeat: false };
  const aerialOn = o.airfield === "aerial";
  // rows: 1 px near the horizon, 2 px where the ground changes slowly
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
  // 1. the textures
  for (const r of rows) {
    if (r.dist > 600) continue;
    texRow(ctx, plains, r.A, r.B, r.D, r.yc, r.y, r.h);
    texRow(ctx, region, r.A, r.B, r.D, r.yc, r.y, r.h);
    if (aerialOn) texRow(ctx, aerial, r.A, r.B, r.D, r.yc, r.y, r.h);
  }
  // 1b. the section roads (a 1-mile grid), drawn as lines where the texture can no longer resolve them (high views)
  const kMid = v.scaleAt(v.cam.tx, v.cam.ty, 0);
  const gridA = smooth(48, 18, kMid) * smooth(2.5, 5, kMid) * 0.32;
  if (gridA > 0.01) {
    const corners = [v.unproject(0, Math.max(y0, 0)), v.unproject(W, Math.max(y0, 0)), v.unproject(0, H), v.unproject(W, H)].filter(Boolean) as P2[];
    if (corners.length === 4) {
      const gx0 = Math.floor(Math.min(...corners.map((p) => p.x)) - TEX.plains.ox);
      const gx1 = Math.ceil(Math.max(...corners.map((p) => p.x)) - TEX.plains.ox);
      const gy0 = Math.floor(Math.min(...corners.map((p) => p.y)) - TEX.plains.oy);
      const gy1 = Math.ceil(Math.max(...corners.map((p) => p.y)) - TEX.plains.oy);
      if (gx1 - gx0 < 400 && gy1 - gy0 < 400) {
        ctx.strokeStyle = "#D6C49C";
        ctx.globalAlpha = gridA;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let gx = gx0; gx <= gx1; gx++) {
          const a = v.project(gx + TEX.plains.ox, gy0 + TEX.plains.oy, 0);
          const b = v.project(gx + TEX.plains.ox, gy1 + TEX.plains.oy, 0);
          if (a && b) {
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
          }
        }
        for (let gy = gy0; gy <= gy1; gy++) {
          const a = v.project(gx0 + TEX.plains.ox, gy + TEX.plains.oy, 0);
          const b = v.project(gx1 + TEX.plains.ox, gy + TEX.plains.oy, 0);
          if (a && b) {
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
          }
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }
  }
  // 2. the airfield, painted on the ground (true scale)
  const paint = (pts: [number, number][], col: string) => {
    ctx.fillStyle = col;
    fillPoly(ctx, projectPoly(v, pts.map(([x, y]) => [x, y, 0])));
  };
  // the airport's own ground: mowed, paler grass around the runways, feathered (concentric fills, no canvas blur)
  if (!aerialOn) {
    const steps = 10;
    ctx.fillStyle = DEN_COLORS.property;
    ctx.globalAlpha = 1 - Math.pow(1 - 0.42, 1 / steps);
    for (let k = 0; k < steps; k++) {
      const f = 1.12 - (k / (steps - 1)) * 0.22;
      fillPoly(
        ctx,
        projectPoly(
          v,
          PROPERTY.map(([x, y]) => [x * f, y * f, 0]),
        ),
      );
    }
    ctx.globalAlpha = 1;
  }
  // with the aerial on, the photo carries the roads, aprons, taxiways and runways; only what it lacks is painted
  for (const r of aerialOn ? ROADS.slice(1) : ROADS) for (const q of ribbon(r.pts, r.w)) paint(q, DEN_COLORS.road);
  if (!aerialOn) for (const ap of APRONS.slice(1).concat([APRONS[0]])) paint(ap, ap === APRONS[1] ? DEN_COLORS.forecourt : DEN_COLORS.apron);
  // a minimum on-screen width so the strips stay legible at grazing angles (the true-width ribbon covers it when wider)
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
  for (const t of aerialOn ? [] : TAXIWAYS) {
    for (const q of ribbon(t.pts, t.w)) paint(q, DEN_COLORS.taxi);
    minLine(t.pts, 1, DEN_COLORS.taxi, 0.7);
  }
  // on the aerial, the runways are re-painted lightly (modestly widened) so the pinwheel reads at the wide cameras;
  // 16R/34L, a dirt strip in the 2002 photo, is painted fully
  for (const rw of RUNWAYS) {
    const lite = aerialOn && rw.id !== RUNWAY_NOT_IN_AERIAL;
    const rwW = rw.w * (aerialOn ? RUNWAY_EXAG_AERIAL : RUNWAY_EXAG);
    ctx.globalAlpha = 1;
    const baseAlpha = lite ? 0.78 : 1;
    minLine(
      [
        [rw.x0, rw.y0],
        [rw.x1, rw.y1],
      ],
      1.6,
      DEN_COLORS.runway,
      baseAlpha,
    );
    // a soft shoulder (graded grass and blast pads), then the concrete strip
    ctx.globalAlpha = lite ? 0 : 0.2;
    for (const q of ribbon(
      [
        [rw.x0, rw.y0],
        [rw.x1, rw.y1],
      ],
      rwW * 1.9,
    ))
      paint(q, DEN_COLORS.shoulder);
    ctx.globalAlpha = baseAlpha;
    for (const q of ribbon(
      [
        [rw.x0, rw.y0],
        [rw.x1, rw.y1],
      ],
      rwW,
    ))
      paint(q, DEN_COLORS.runway);
    ctx.globalAlpha = 1;
    // the centreline: dashed, only where the runway is wide enough on screen
    const mid = v.project((rw.x0 + rw.x1) / 2, (rw.y0 + rw.y1) / 2, 0);
    if (mid && v.F / mid.d > 60) {
      const L = Math.hypot(rw.x1 - rw.x0, rw.y1 - rw.y0);
      const n = Math.floor(L / 0.05);
      ctx.fillStyle = DEN_COLORS.centre;
      ctx.globalAlpha = clamp01((v.F / mid.d - 60) / 80) * 0.8;
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
  // 4. the air: every row veiled by its distance; the far rows converge on the horizon's haze
  for (const r of rows) {
    const fog = r.dist > 600 ? 1 : fogAt(v, r.gx, r.gy, 0);
    const nearHor = Number.isFinite(hor) ? smooth(140, 0, r.y - hor) : 0;
    const col = mixRgb(HAZE, HAZE_FAR, nearHor);
    ctx.fillStyle = rgbCss(col, Math.max(fog, 0.0));
    ctx.fillRect(0, r.y, W, r.h);
  }
  // 4a. cloud shadows (soft dark patches toward the east-north-east), laid over the air so they read through the haze
  for (const c of o.cells) {
    const sh = cellShadow(v, c, o.S);
    if (!sh) continue;
    // soft edge without a canvas blur filter (large filter radii are unreliable in the headless renderer): concentric
    // fills shrinking toward the centre, each adding a little darkness
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
  ctx.filter = "none";
  // 4b. seen from high up the fields merge into one warm grassland: a calm veil growing with altitude
  const calm = smooth(12, 120, v.eye[2]) * 0.18;
  if (calm > 0.005) {
    ctx.fillStyle = rgbCss(hexRgb("#AE9C6C"), calm);
    ctx.fillRect(0, y0, W, H - y0);
  }
  // 5. the horizon haze over the ground only (a soft zone, no step)
  if (Number.isFinite(hor) && hor < H) {
    const g = ctx.createLinearGradient(0, hor, 0, hor + 90);
    g.addColorStop(0, rgbCss(HAZE_FAR, 0.85));
    g.addColorStop(0.4, rgbCss(HAZE_FAR, 0.35));
    g.addColorStop(1, rgbCss(HAZE_FAR, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, Math.max(0, hor), W, 90);
  }
  // 6. the Front Range: a hazy silhouette on the far left horizon (fades out as the camera tips to top-down)
  const mFade = smooth(55, 30, v.cam.pitch);
  if (mFade > 0.01 && Number.isFinite(hor)) {
    const top: P2[] = [];
    const foot: P2[] = [];
    for (const [x, y, z] of RIDGE) {
      const q = v.project(x, y, z);
      const qf = v.project(x + 6, y, 0);
      if (!q || !qf) continue;
      top.push({ x: q.x, y: q.y });
      foot.push({ x: qf.x, y: qf.y });
    }
    if (top.length > 2) {
      const pts = [...top, ...foot.reverse()];
      const mid = RIDGE[60];
      const fog = fogAt(v, mid[0], mid[1], 0.6, 0.32);
      const col = mixRgb(hexRgb(DEN_COLORS.mountain), HAZE_FAR, fog);
      ctx.globalAlpha = mFade;
      const gr = ctx.createLinearGradient(0, hor - 40, 0, hor + 6);
      gr.addColorStop(0, rgbCss(mixRgb(col, hexRgb(DEN_COLORS.mountainLit), 0.25), 1));
      gr.addColorStop(1, rgbCss(mixRgb(col, HAZE_FAR, 0.6), 1));
      ctx.fillStyle = gr;
      fillPoly(ctx, pts);
      ctx.filter = "none";
      ctx.globalAlpha = 1;
    }
  }
};

// ===================================================================================================================
// THE STANDING CANVAS: the terminal (tent roof), concourses, garages, parked jets, ramp vehicles, storm cells, rain;
// one depth-sorted list, painted far to near.
// ===================================================================================================================
type Tri = { d: number; pts: P2[]; col: string };
type Item = CloudItem | { type: "tris"; d: number; tris: Tri[] } | { type: "dots"; d: number; draw: (ctx: CanvasRenderingContext2D) => void };

const lambert = (n: [number, number, number]) => {
  const l = Math.hypot(n[0], n[1], n[2]) || 1;
  return (n[0] * SUN_DIR[0] + n[1] * SUN_DIR[1] + n[2] * SUN_DIR[2]) / l;
};
const shadeCol = (lit: string, mid: string, dark: string, ndl: number, fog: number) => {
  const a = hexRgb(lit);
  const b = hexRgb(mid);
  const c = hexRgb(dark);
  const t = clamp01(ndl * 1.6 + 0.15);
  const col = t > 0.5 ? mixRgb(b, a, (t - 0.5) * 2) : mixRgb(c, b, t * 2);
  return rgbHex(mixRgb(col, HAZE, fog));
};

/** The tent roof's height at plan point (u along the long N-S axis, w across), in units of the roof's own size. */
const MASTS = (() => {
  const out: { u: number; w: number; h: number }[] = [];
  const n = 6;
  for (let i = 0; i < n; i++) {
    const u = -0.4 + (0.8 * i) / (n - 1);
    const h = 0.86 + 0.14 * Math.cos(u * Math.PI);
    out.push({ u, w: -0.2, h }, { u: u + 0.0, w: 0.2, h: h * 0.97 });
  }
  return out;
})();
const roofZ = (u: number, w: number) => {
  // 0 at the eave, 1 at the tallest peak; tent cones around each mast, the fabric sagging between them
  let z = 0;
  for (const m of MASTS) {
    const d = Math.hypot((u - m.u) * 2.1, (w - m.w) * 1.0) / 0.27;
    z = Math.max(z, m.h * Math.pow(Math.max(0, 1 - d), 1.05));
  }
  const edge = Math.min(0.5 - Math.abs(u), 0.5 - Math.abs(w)) / 0.5;
  return Math.max(0, z) * smooth(0, 0.08, edge);
};

const terminalTris = (v: DenView, scale: number): Tri[] => {
  const T = { ...TERMINAL, y: terminalCentreY(scale) };
  const L = T.len * scale;
  const Wd = T.wid * scale;
  const eave = T.eave * scale;
  const peak = T.peak * scale * TERMINAL_PEAK_LIFT;
  const pc = v.project(T.x, T.y, eave);
  if (!pc) return [];
  const pxSize = (L * v.F) / pc.d;
  const nu = pxSize > 200 ? 110 : pxSize > 120 ? 72 : pxSize > 50 ? 44 : 24;
  const nw = pxSize > 200 ? 26 : pxSize > 120 ? 16 : pxSize > 50 ? 10 : 6;
  const fog = fogAt(v, T.x, T.y, eave);
  const tris: Tri[] = [];
  const world = (u: number, w: number, z: number): [number, number, number] => [T.x + w * Wd, T.y + u * L, z];
  // the building body under the roof: four walls (glass-and-concrete), the near ones visible
  const bodyIn = 0.94;
  const corners = [
    [-0.5, -0.5],
    [0.5, -0.5],
    [0.5, 0.5],
    [-0.5, 0.5],
  ];
  for (let i = 0; i < 4; i++) {
    const [u0, w0] = corners[i];
    const [u1, w1] = corners[(i + 1) % 4];
    const a = world(u0 * bodyIn, w0 * bodyIn, 0);
    const b = world(u1 * bodyIn, w1 * bodyIn, 0);
    const c = world(u1 * bodyIn, w1 * bodyIn, eave);
    const d = world(u0 * bodyIn, w0 * bodyIn, eave);
    const nrm: [number, number, number] = [b[1] - a[1], -(b[0] - a[0]), 0];
    const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const toEye = [v.eye[0] - mid[0], v.eye[1] - mid[1]];
    if (nrm[0] * toEye[0] + nrm[1] * toEye[1] <= 0) continue;
    const pts = projectPoly(v, [a, b, c, d]);
    const q = v.project(mid[0], mid[1], eave / 2);
    if (!q) continue;
    tris.push({ d: q.d + 0.02, pts, col: shadeCol(DEN_COLORS.wallLit, DEN_COLORS.glass, "#4E443B", lambert(nrm) * 0.8, fog) });
  }
  // the roof: a heightfield mesh, triangles shaded by the sun
  const grid: [number, number, number][][] = [];
  for (let i = 0; i <= nu; i++) {
    const row: [number, number, number][] = [];
    for (let j = 0; j <= nw; j++) {
      const u = -0.5 + i / nu;
      const w = -0.5 + j / nw;
      row.push(world(u, w, eave + (peak - eave) * roofZ(u, w)));
    }
    grid.push(row);
  }
  for (let i = 0; i < nu; i++) {
    for (let j = 0; j < nw; j++) {
      const a = grid[i][j];
      const b = grid[i + 1][j];
      const c = grid[i + 1][j + 1];
      const d = grid[i][j + 1];
      for (const tri of [
        [a, b, c],
        [a, c, d],
      ] as [number, number, number][][]) {
        const [p, q, r] = tri;
        const e1 = [q[0] - p[0], q[1] - p[1], q[2] - p[2]];
        const e2 = [r[0] - p[0], r[1] - p[1], r[2] - p[2]];
        let n: [number, number, number] = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
        if (n[2] < 0) n = [-n[0], -n[1], -n[2]];
        const cx = (p[0] + q[0] + r[0]) / 3;
        const cy = (p[1] + q[1] + r[1]) / 3;
        const cz = (p[2] + q[2] + r[2]) / 3;
        const pr = v.project(cx, cy, cz);
        if (!pr) continue;
        const pts = projectPoly(v, [p, q, r]);
        // the fabric: bright where it faces the low sun, a soft warm grey on the far slopes (translucent, never dark)
        const ndl = lambert(n);
        tris.push({ d: pr.d, pts, col: shadeCol(DEN_COLORS.roofLit, DEN_COLORS.roofMid, DEN_COLORS.roofShade, ndl * 1.5 + 0.12, fog) });
      }
    }
  }
  return tris;
};

/** A low box (concourse, garage) as its visible faces. */
const boxTris = (v: DenView, b: Box, hScale: number, roof: string, fogBoost = 1): Tri[] => {
  const h = b.h * hScale;
  const fog = fogAt(v, (b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2, h, fogBoost);
  const tris: Tri[] = [];
  const P = [
    [b.x0, b.y0],
    [b.x1, b.y0],
    [b.x1, b.y1],
    [b.x0, b.y1],
  ];
  for (let i = 0; i < 4; i++) {
    const [x0, y0] = P[i];
    const [x1, y1] = P[(i + 1) % 4];
    const nrm: [number, number, number] = [y1 - y0, -(x1 - x0), 0];
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
      col: shadeCol(DEN_COLORS.wallLit, DEN_COLORS.wallShade, "#6F6255", lambert(nrm) * 1.4, fog),
    });
  }
  const q = v.project((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2, h);
  if (q)
    tris.push({
      d: q.d - 0.001,
      pts: projectPoly(v, [
        [b.x0, b.y0, h],
        [b.x1, b.y0, h],
        [b.x1, b.y1, h],
        [b.x0, b.y1, h],
      ]),
      col: rgbHex(mixRgb(hexRgb(roof), HAZE, fog)),
    });
  return tris;
};

/** A plan-view jet outline (nose +y), unit length 1. */
const JET_PLAN: [number, number][] = [
  // a twin-jet airliner seen from above, nose +y: slim fuselage, swept wings, swept tailplane
  [0, 0.5],
  [0.035, 0.45],
  [0.045, 0.36],
  [0.05, 0.12],
  [0.46, -0.12],
  [0.47, -0.17],
  [0.05, -0.05],
  [0.04, -0.33],
  [0.17, -0.45],
  [0.17, -0.49],
  [0.02, -0.45],
  [0, -0.5],
  [-0.02, -0.45],
  [-0.17, -0.49],
  [-0.17, -0.45],
  [-0.04, -0.33],
  [-0.05, -0.05],
  [-0.47, -0.17],
  [-0.46, -0.12],
  [-0.05, 0.12],
  [-0.045, 0.36],
  [-0.035, 0.45],
];
export const jetPlanPoints = (x: number, y: number, headingRad: number, len: number, z = 0): [number, number, number][] =>
  JET_PLAN.map(([a, b]) => {
    const s = Math.sin(headingRad);
    const c = Math.cos(headingRad);
    // heading: 0 = nose north; rotate clockwise
    return [x + (a * c + b * s) * len, y + (-a * s + b * c) * len, z];
  });

const RAMP_VEHICLES = [
  { lane: 0, at: 0.05, speed: 1, carts: 3 },
  { lane: 1, at: 0.4, speed: 0.8, carts: 2 },
  { lane: 2, at: 0.7, speed: 1.1, carts: 0 },
  { lane: 0, at: 0.62, speed: 0.9, carts: 0 },
  { lane: 1, at: 0.9, speed: 1.2, carts: 3 },
];
const laneLen = (lane: [number, number][]) => lane.reduce((a, p, i) => a + Math.hypot(lane[(i + 1) % lane.length][0] - p[0], lane[(i + 1) % lane.length][1] - p[1]), 0);
const lanePoint = (lane: [number, number][], s: number) => {
  const L = laneLen(lane);
  let d = ((s % L) + L) % L;
  for (let i = 0; i < lane.length; i++) {
    const a = lane[i];
    const b = lane[(i + 1) % lane.length];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (d <= l) {
      const t = d / l;
      return { x: lerp(a[0], b[0], t), y: lerp(a[1], b[1], t), h: Math.atan2(b[0] - a[0], b[1] - a[1]) };
    }
    d -= l;
  }
  return { x: lane[0][0], y: lane[0][1], h: 0 };
};
/** The ramp vehicles' distance clock for a varying activity: integrate activeAt(s) for s in 0..S. */
export const rampTravelAt = (S: number, activeAt: (s: number) => number) => {
  let t = 0;
  for (let s = 0; s < S; s++) t += activeAt(s + 0.5) * Math.min(1, S - s);
  return t;
};

const airfieldItems = (v: DenView, o: { terminalScale: number; rampTravel: number; airfield: AirfieldLook }): Item[] => {
  const items: Item[] = [];
  const tris: Tri[] = [];
  const aerialOn = o.airfield === "aerial";
  tris.push(...terminalTris(v, o.terminalScale));
  if (!aerialOn) for (const c of CONCOURSES) tris.push(...boxTris(v, c, 2.6, DEN_COLORS.roofLit));
  // the garages flank the (exaggerated) terminal east and west
  const half = (TERMINAL.wid * o.terminalScale) / 2;
  for (const g of aerialOn ? [] : GARAGES) {
    const sgn = g.x0 < 0 ? -1 : 1;
    const w = g.x1 - g.x0;
    const x0 = sgn < 0 ? -half - 0.02 - w : half + 0.02;
    const yc = terminalCentreY(o.terminalScale);
    tris.push(...boxTris(v, { ...g, x0, x1: x0 + w, y0: yc - 0.2, y1: yc + 0.2 }, 2.6, "#CFC4B1"));
  }
  // the bridge from the terminal to Concourse A
  if (!aerialOn) tris.push(...boxTris(v, { name: "bridge", x0: -0.008, y0: TERMINAL.len * 0.5 * o.terminalScale * 0.9, x1: 0.008, y1: CONCOURSES[0].y0, h: 0.006 }, 2.6, DEN_COLORS.roofMid));
  // painter's order inside the airfield group
  tris.sort((a, b) => b.d - a.d);
  const pc = v.project(0, 0.5, 0);
  if (pc) items.push({ type: "tris", d: pc.d, tris });
  // parked jets at the gates + ramp vehicles: tiny lit shapes on the apron (one flat item, drawn under the buildings
  // of nearer concourses by depth)
  for (const c of CONCOURSES) {
    const gates = gatesOf(c);
    const q = v.project((c.x0 + c.x1) / 2, (c.y0 + c.y1) / 2, 0);
    if (!q) continue;
    const k = v.F / q.d;
    if (k < 12) continue;
    const fog = fogAt(v, (c.x0 + c.x1) / 2, (c.y0 + c.y1) / 2, 0);
    items.push({
      type: "dots",
      d: q.d + 0.03,
      draw: (ctx) => {
        const len = 0.024 * 2.6; // x2.6 so the gate jets read as tiny airliners
        for (let gi = 0; gi < (aerialOn ? 0 : gates.length); gi++) {
          if (hash01(gi * 3.3 + c.x0 * 10) < 0.22) continue; // a few empty gates
          const gt = gates[gi];
          const hd = gt.dir > 0 ? Math.PI : 0;
          const cy = gt.y + gt.dir * (len / 2 + 0.006);
          ctx.fillStyle = rgbCss(hexRgb(COLOR.shadow), 0.35 * (1 - fog));
          fillPoly(ctx, projectPoly(v, jetPlanPoints(gt.x + 0.004, cy - 0.003, hd, len, 0)));
          ctx.fillStyle = rgbCss(mixRgb(hexRgb(DEN_COLORS.jet), HAZE, fog), 1);
          fillPoly(ctx, projectPoly(v, jetPlanPoints(gt.x, cy, hd, len, 0.002)));
        }
        // ramp vehicles (x3 so they read as moving specks): a tug and its carts along the service lanes
        for (const rv of RAMP_VEHICLES) {
          const lane = RAMP_LANES[rv.lane];
          const s0 = rv.at * laneLen(lane) + o.rampTravel * 0.0016 * rv.speed;
          for (let j = 0; j <= rv.carts; j++) {
            const p = lanePoint(lane, s0 - j * 0.014);
            const L = j === 0 ? 0.012 : 0.009;
            const Wd = 0.007;
            const s = Math.sin(p.h);
            const cc = Math.cos(p.h);
            const pts: [number, number, number][] = [
              [-Wd / 2, -L / 2],
              [Wd / 2, -L / 2],
              [Wd / 2, L / 2],
              [-Wd / 2, L / 2],
            ].map(([a, b]) => [p.x + a * cc + b * s, p.y - a * s + b * cc, 0.002]);
            ctx.fillStyle = rgbCss(mixRgb(hexRgb(j === 0 ? DEN_COLORS.vehicle : "#D8C9AE"), HAZE, fog), 1);
            fillPoly(ctx, projectPoly(v, pts));
          }
        }
      },
    });
  }
  return items;
};

type StandingOpts = { S: number; cells: StormState[]; terminalScale: number; rampTravel: number; airfield: AirfieldLook };
const drawStanding = (ctx: CanvasRenderingContext2D, v: DenView, o: StandingOpts) => {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  ctx.filter = "none";
  ctx.clearRect(0, 0, W, H);
  const items: Item[] = [];
  resetCloudPool();
  for (const c of o.cells) items.push(...cellItems(v, c, o.S));
  items.push(...airfieldItems(v, o));
  items.sort((a, b) => b.d - a.d);
  for (const it of items) {
    if (it.type === "tris") {
      for (const t of it.tris) {
        ctx.fillStyle = t.col;
        ctx.strokeStyle = t.col;
        ctx.lineWidth = 0.6;
        ctx.lineJoin = "round";
        if (t.pts.length < 3) continue;
        ctx.beginPath();
        ctx.moveTo(t.pts[0].x, t.pts[0].y);
        for (let i = 1; i < t.pts.length; i++) ctx.lineTo(t.pts[i].x, t.pts[i].y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    } else if (it.type === "dots") {
      it.draw(ctx);
    } else {
      paintCloudItem(ctx, it);
    }
  }
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

export type AirfieldLook = "aerial" | "paint";
export type AirStageProps = {
  /** story clock (frames) */
  S: number;
  v: DenView;
  cells?: StormState[];
  rampActive?: number;
  rampTravel?: number;
  terminalScale?: number;
  /** the airfield's ground: "aerial" (default: the registered USGS photo, graded; 16R/34L and the terminal roof drawn
   *  on it) or "paint" (the painted diagram: runways, taxiways, aprons, concourses, gate jets) */
  airfield?: AirfieldLook;
  /** SVG children (screen px) drawn on the ground, under every standing object */
  ground?: React.ReactNode;
  /** SVG children (screen px) over the world, under the grade */
  over?: React.ReactNode;
  dust?: number;
  highCloud?: number;
  grade?: number;
};

const Canvas: React.FC<{ draw: (ctx: CanvasRenderingContext2D) => void; deps: unknown[] }> = ({ draw, deps }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    // willReadFrequently pins the canvas to the software rasteriser: Chrome otherwise promotes a canvas that is redrawn
    // every frame to the GPU part-way through a render, which shifts pattern sampling by a few levels (a join between
    // cuts would then not be pixel-exact)
    // reset the canvas (backing store and every context state) so each frame draws exactly as a fresh one
    cv.width = W;
    cv.height = H;
    draw(cv.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return <canvas ref={ref} width={W} height={H} style={{ position: "absolute", left: 0, top: 0, width: W, height: H }} />;
};

export const AirStage: React.FC<AirStageProps> = ({ S, v, cells = [], rampActive = 1, rampTravel, terminalScale = TERMINAL_SCALE, airfield = "aerial", ground, over, dust = 1, highCloud = 1, grade = 1 }) => {
  const uid = `den${useId().replace(/[^A-Za-z0-9_-]/g, "_")}`;
  const tex = useTextures();
  const hor = v.horizonY;
  const skyOn = Number.isFinite(hor) && hor > -40;
  const travel = rampTravel ?? S * rampActive;
  const g2 = Math.floor(S / 2);
  const grx = (hash01(g2 + 1) * 2 - 1) * GRAIN.travel;
  const gry = (hash01(g2 + 7) * 2 - 1) * GRAIN.travel;
  const key = JSON.stringify([v.cam, S, cells, travel, terminalScale, airfield]);
  return (
    <AbsoluteFill style={{ backgroundColor: rgbHex(HAZE), overflow: "hidden" }}>
      {/* the sky: SKY ramp keyed to the horizon, the low sun's glow upper left, soft high cloud banks */}
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
                const cx = ((c.x + S * c.v - v.cam.heading * 18) % 1700 + 1700) % 1700 - 300;
                return <ellipse key={i} cx={f3(cx)} cy={f3(hor - c.h)} rx={c.w} ry={c.t} fill={c.h > 420 ? SKY.cloudHi : SKY.cloudLo} opacity={c.a} />;
              })}
            </g>
          ) : null}
          <rect x={0} y={f3(hor - 90)} width={W} height={92} fill={SKY.haze} opacity={0.55} style={{ filter: "blur(20px)" }} />
        </svg>
      ) : null}
      {tex ? <Canvas deps={[key, "g"]} draw={(ctx) => drawGround(ctx, v, { S, cells, textures: tex, airfield })} /> : null}
      {ground ? (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          {ground}
        </svg>
      ) : null}
      <Canvas deps={[key, "s"]} draw={(ctx) => drawStanding(ctx, v, { S, cells, terminalScale, rampTravel: travel, airfield })} />
      {over ? (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          {over}
        </svg>
      ) : null}
      {dust > 0 ? <Dust S={S} v={v} amount={dust} /> : null}
      {/* the warm film grade, the brown vignette, stout grain on twos */}
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
        <Img
          src={staticFile(GROUND.grain)}
          style={{ position: "absolute", left: (W - GROUND.W) / 2 + grx, top: (H - GROUND.H) / 2 + gry, width: GROUND.W, height: GROUND.H }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Gentle drifting dust in the golden air (screen layer, slow, a little parallax with the camera's target). */
const Dust: React.FC<{ S: number; v: DenView; amount: number }> = ({ S, v, amount }) => {
  const motes = Array.from({ length: 46 }, (_, i) => {
    const h1 = hash01(i * 3.7 + 11);
    const h2 = hash01(i * 5.1 + 12);
    const h3 = hash01(i * 7.9 + 13);
    const depth = 0.3 + 0.7 * h3;
    const x = ((h1 * 1300 + S * (0.35 + 0.5 * h3) - v.cam.tx * 40 * depth) % 1300 + 1300) % 1300 - 110;
    const y = ((h2 * 2100 - S * 0.12 * depth + v.cam.ty * 30 * depth + 12 * Math.sin(S / 37 + i)) % 2100 + 2100) % 2100 - 90;
    const r = 0.9 + 2.2 * depth * hash01(i + 0.5);
    return <circle key={i} cx={f3(x)} cy={f3(y)} r={f3(r)} fill={OCEAN.cream} opacity={f3(amount * (0.1 + 0.22 * depth))} style={depth > 0.85 ? { filter: "blur(1.2px)" } : undefined} />;
  });
  return (
    <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
      {motes}
    </svg>
  );
};

// ===================================================================================================================
// LIGHTNING
// ===================================================================================================================
/** Frame convention (t = frames since the strike began): the tip reaches the ground at t = contact. */
export const STRIKE = { draw: 3, contact: 3, fade: 10, settle: 12 } as const;
/** The cell's `glow` during a strike (lit from inside from the first frame, easing off with the bolt). */
export const strikeGlow = (t: number) => (t < 0 ? 0 : t < STRIKE.contact ? 0.6 + (0.4 * t) / STRIKE.contact : clamp01(1 - (t - STRIKE.contact) / (STRIKE.fade + 6)));

const boltPath = (a: P2, b: P2, seed: number, depth: number, rough: number): P2[] => {
  let pts: P2[] = [a, b];
  for (let lvl = 0; lvl < depth; lvl++) {
    const next: P2[] = [pts[0]];
    for (let i = 0; i < pts.length - 1; i++) {
      const p = pts[i];
      const q = pts[i + 1];
      const l = Math.hypot(q.x - p.x, q.y - p.y);
      const off = (hash01(seed * 13.1 + lvl * 7.3 + i * 3.7) - 0.5) * l * rough;
      const nx = -(q.y - p.y) / (l || 1);
      const ny = (q.x - p.x) / (l || 1);
      const t = 0.4 + 0.2 * hash01(seed + lvl * 3 + i);
      next.push({ x: lerp(p.x, q.x, t) + nx * off, y: lerp(p.y, q.y, t) + ny * off }, q);
    }
    pts = next;
  }
  return pts;
};
const partial = (pts: P2[], f: number): P2[] => {
  if (f >= 1) return pts;
  if (f <= 0) return [pts[0]];
  const segs = pts.slice(1).map((p, i) => Math.hypot(p.x - pts[i].x, p.y - pts[i].y));
  const tot = segs.reduce((a, b) => a + b, 0);
  let want = tot * f;
  const out: P2[] = [pts[0]];
  for (let i = 0; i < segs.length; i++) {
    if (want <= segs[i]) {
      const t = want / segs[i];
      out.push({ x: lerp(pts[i].x, pts[i + 1].x, t), y: lerp(pts[i].y, pts[i + 1].y, t) });
      return out;
    }
    want -= segs[i];
    out.push(pts[i + 1]);
  }
  return out;
};
/** LightningStrike — SVG (screen px). from = the cell's ground position (the bolt leaves its base at CLOUD.baseZ),
 *  to = the ground point it hits. t = frames since the strike began. */
export const LightningStrike: React.FC<{ v: DenView; from: P2; to: P2; t: number; seed?: number; baseZ?: number }> = ({ v, from, to, t, seed = 7, baseZ = 1.05 }) => {
  if (t < 0) return null;
  const a = v.project(from.x, from.y, baseZ);
  const b = v.project(to.x, to.y, 0);
  if (!a || !b) return null;
  const L = Math.hypot(b.x - a.x, b.y - a.y);
  const main = boltPath(a, b, seed, 6, 0.42);
  const reveal = clamp01((t + 1) / (STRIKE.draw + 1));
  const fade = t <= STRIKE.contact ? 1 : clamp01(1 - (t - STRIKE.contact) / STRIKE.fade);
  if (fade <= 0.001 && t > STRIKE.contact + STRIKE.settle + 4) return null;
  const branches = [0.22, 0.38, 0.55].map((u, i) => {
    const k = Math.floor(u * (main.length - 1));
    const p = main[k];
    const dir = hash01(seed * 5 + i) > 0.5 ? 1 : -1;
    const end = { x: p.x + dir * L * (0.12 + 0.08 * hash01(seed + i * 9)), y: p.y + L * (0.14 + 0.1 * hash01(seed * 3 + i)) };
    return { at: u, pts: boltPath(p, end, seed * 11 + i, 4, 0.5) };
  });
  const core = Math.max(4.5, Math.min(7, L / 36));
  const k = 1;
  const contactT = t - STRIKE.contact;
  const glowA = contactT < 0 ? 0 : contactT < 2 ? 0.9 : 0.9 * Math.pow(clamp01(1 - (contactT - 2) / STRIKE.settle), 1.4) + 0.08 * clamp01(1 - (contactT - 2) / (STRIKE.settle + 10));
  const gs = v.scaleAt(to.x, to.y, 0);
  const pool = Math.max(70, gs * 0.8); // the ground-contact pool (screen px), large enough to read on a phone
  const shown = partial(main, reveal);
  return (
    <g>
      {glowA > 0.003 ? (
        <g style={{ filter: bloomFilter(k) }}>
          <ellipse cx={f3(b.x)} cy={f3(b.y)} rx={f3(pool)} ry={f3(pool * 0.42)} fill={COLOR.amberTop} opacity={f3(glowA * 0.6)} style={{ filter: `blur(${f3(pool * 0.22)}px)` }} />
          <ellipse cx={f3(b.x)} cy={f3(b.y)} rx={f3(pool * 0.3)} ry={f3(pool * 0.3 * 0.42)} fill={COLOR.amberHot} opacity={f3(glowA)} style={{ filter: `blur(${f3(pool * 0.06)}px)` }} />
        </g>
      ) : null}
      {fade > 0.003 ? (
        <g opacity={f3(fade)} style={{ filter: bloomFilter(k) }}>
          {branches.map((br, i) =>
            reveal > br.at ? (
              <path key={i} d={lineD(partial(br.pts, clamp01((reveal - br.at) / (1 - br.at)) * 1.2))} fill="none" stroke={COLOR.amberTop} strokeWidth={f3(core * 0.55)} strokeLinecap="round" strokeLinejoin="round" />
            ) : null,
          )}
          <path d={lineD(shown)} fill="none" stroke={COLOR.amberTop} strokeWidth={f3(core * 5)} strokeLinecap="round" strokeLinejoin="round" opacity={0.28} style={{ filter: `blur(${f3(core * 1.2)}px)` }} />
          <path d={lineD(shown)} fill="none" stroke={COLOR.amberTop} strokeWidth={f3(core * 2.2)} strokeLinecap="round" strokeLinejoin="round" opacity={0.8} />
          <path d={lineD(shown)} fill="none" stroke={COLOR.amberHot} strokeWidth={f3(core)} strokeLinecap="round" strokeLinejoin="round" />
          <path d={lineD(shown)} fill="none" stroke="#FFF9EC" strokeWidth={f3(core * 0.42)} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      ) : null}
    </g>
  );
};

// ===================================================================================================================
// THE 3-MILE RING
// ===================================================================================================================
export const RING_MI = 3;
/** ThreeMileRing — on the ground around the terminal. draw 0..1 from bearing `from` (degrees, clockwise from north);
 *  lit 0..1: a cream hairline -> a solid amber band (bloom) = the ramp closed. label: "3 MI" at the ring's near
 *  (south) point, sliding up while fading in with labelIn 0..1. */
/** the shared "3 MI" size for cuts 2-4 (screen px font size) */
export const RING_LABEL_PX = 34;
/** the big "3 MI" (cuts pass it as labelPx) */
export const RING_LABEL_PX_BIG = 52;
export const ThreeMileRing: React.FC<{ v: DenView; draw?: number; lit?: number; from?: number; label?: boolean; labelIn?: number; labelAt?: number; labelPx?: number }> = ({
  v,
  draw = 1,
  lit = 0,
  from = 270,
  label = false,
  labelIn = 1,
  labelAt = 118,
  labelPx = RING_LABEL_PX,
}) => {
  const N = 240;
  const d = clamp01(draw);
  if (d <= 0.0005 && !label) return null;
  const pt = (bearingDeg: number, r: number): [number, number, number] => {
    const a = (bearingDeg * Math.PI) / 180;
    return [TERMINAL.x + Math.sin(a) * r, TERMINAL.y + Math.cos(a) * r, 0];
  };
  const n = Math.max(2, Math.ceil(N * d));
  const arc: [number, number, number][] = [];
  for (let i = 0; i <= n; i++) arc.push(pt(from + (360 * d * i) / n, RING_MI));
  const runs = projectLine(v, arc);
  // the band: an annulus segment on the ground (perspective-true thickness)
  const bw = 0.07 + 0.05 * lit;
  const outer: [number, number, number][] = [];
  const inner: [number, number, number][] = [];
  for (let i = 0; i <= n; i++) {
    outer.push(pt(from + (360 * d * i) / n, RING_MI + bw / 2));
    inner.push(pt(from + (360 * d * i) / n, RING_MI - bw / 2));
  }
  const band = projectPoly(v, [...outer, ...inner.reverse()]);
  const hair = 2;
  const tip = v.project(...pt(from + 360 * d, RING_MI));
  const lb = v.project(...pt(labelAt, RING_MI + 0.32));
  const cream = OCEAN.cream;
  return (
    <g>
      {lit < 0.999 ? (
        <g opacity={f3(1 - lit)}>
          {runs.map((r, i) => (
            <path key={i} d={lineD(r)} fill="none" stroke={cream} strokeWidth={hair} strokeLinecap="round" opacity={0.92} />
          ))}
        </g>
      ) : null}
      {lit > 0.001 ? (
        <g opacity={f3(lit)} style={{ filter: bloomFilter(1) }}>
          <path d={polyD(band)} fill={COLOR.amberTop} />
          {runs.map((r, i) => (
            <path key={i} d={lineD(r)} fill="none" stroke={COLOR.amberHot} strokeWidth={1.4} opacity={0.85} />
          ))}
        </g>
      ) : null}
      {tip && d < 0.999 && d > 0.001 ? <circle cx={f3(tip.x)} cy={f3(tip.y)} r={3.2} fill={lit > 0.5 ? COLOR.amberHot : cream} /> : null}
      {label && lb ? <Label x={lb.x} y={lb.y + labelPx * 0.9} k={1} text="3 MI" tone="cream" enter={labelIn} px={labelPx} /> : null}
    </g>
  );
};

// ===================================================================================================================
// ARRIVALS: corner posts, streams, the worst-case blanket (cut 5)
// ===================================================================================================================
/** The four arrival corner posts (bearing from DEN, degrees true; distance 40 nm = 46 statute miles). */
export const CORNER_POSTS = {
  NE: { id: "NE", bearing: 45, dist: 46 },
  SE: { id: "SE", bearing: 135, dist: 46 },
  SW: { id: "SW", bearing: 225, dist: 46 },
  NW: { id: "NW", bearing: 315, dist: 46 },
} as const;
export type PostId = keyof typeof CORNER_POSTS;
export const postXY = (id: PostId) => {
  const p = CORNER_POSTS[id];
  const a = (p.bearing * Math.PI) / 180;
  return { x: Math.sin(a) * p.dist, y: Math.cos(a) * p.dist };
};

/** CornerPost — a small cream gate: two posts across the corridor; narrow 0..1 closes the gap. */
export const CornerPost: React.FC<{ v: DenView; post: PostId; narrow?: number; size?: number }> = ({ v, post, narrow = 0, size = 1 }) => {
  const P = postXY(post);
  const a = (CORNER_POSTS[post].bearing * Math.PI) / 180;
  // across the corridor
  const ax = Math.cos(a);
  const ay = -Math.sin(a);
  const gap = (3.2 - 2.0 * clamp01(narrow)) * size;
  const postW = 0.9 * size;
  const postL = 1.4 * size;
  const h = 1.6 * size;
  const out: React.ReactNode[] = [];
  [-1, 1].forEach((s) => {
    const cx = P.x + ax * s * (gap / 2 + postW / 2);
    const cy = P.y + ay * s * (gap / 2 + postW / 2);
    const fx = Math.sin(a);
    const fy = Math.cos(a);
    const corners = [
      [-postW / 2, -postL / 2],
      [postW / 2, -postL / 2],
      [postW / 2, postL / 2],
      [-postW / 2, postL / 2],
    ].map(([u, w]) => [cx + ax * u + fx * w, cy + ay * u + fy * w] as [number, number]);
    const shadow = projectPoly(
      v,
      corners.map(([x, y]) => [x + 0.5 * size, y - 0.1 * size, 0]),
    );
    const top = projectPoly(
      v,
      corners.map(([x, y]) => [x, y, h]),
    );
    const sides = corners.map((c0, i) => {
      const c1 = corners[(i + 1) % 4];
      return projectPoly(v, [
        [c0[0], c0[1], 0],
        [c1[0], c1[1], 0],
        [c1[0], c1[1], h],
        [c0[0], c0[1], h],
      ]);
    });
    out.push(
      <g key={s}>
        <path d={polyD(shadow)} fill={COLOR.shadow} opacity={0.35} style={{ filter: "blur(2px)" }} />
        {sides.map((sd, i) => (
          <path key={i} d={polyD(sd)} fill={i === 3 ? COLOR.cream : COLOR.creamFoot} />
        ))}
        <path d={polyD(top)} fill={COLOR.cream} />
      </g>,
    );
  });
  return <g>{out}</g>;
};

/** The path a stream flies (world miles): from far beyond the post, through it, to a runway end at the field. */
export const streamPath = (post: PostId): [number, number][] => {
  const P = postXY(post);
  const a = (CORNER_POSTS[post].bearing * Math.PI) / 180;
  const far = { x: Math.sin(a) * 110, y: Math.cos(a) * 110 };
  // after the post: toward the field, turning onto a north-south final (the field lands north or south)
  const finX = post === "NE" || post === "SE" ? 2.05 : -2.05;
  const finY = post === "NE" || post === "NW" ? 14 : -14;
  return [
    [far.x, far.y],
    [P.x, P.y],
    [finX + (P.x - finX) * 0.35, finY + (P.y - finY) * 0.35],
    [finX, finY],
    [finX, finY * 0.2],
  ];
};
const pathLen = (pts: [number, number][]) => pts.slice(1).reduce((a, p, i) => a + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0);
const pathAt = (pts: [number, number][], s: number) => {
  let d = s;
  for (let i = 0; i < pts.length - 1; i++) {
    const l = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
    if (d <= l) {
      const t = d / l;
      return { x: lerp(pts[i][0], pts[i + 1][0], t), y: lerp(pts[i][1], pts[i + 1][1], t), h: Math.atan2(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]) };
    }
    d -= l;
  }
  const n = pts.length - 1;
  return { x: pts[n][0], y: pts[n][1], h: Math.atan2(pts[n][0] - pts[n - 1][0], pts[n][1] - pts[n - 1][1]) };
};
/** Stream speed (miles per frame: a timelapse, so motion reads at the area view). */
export const STREAM_SPEED = 0.16;
/** ArrivalStream — jets along a corridor. rateAt(S) = jets per 24 frames entering at the far end (a visual rate);
 *  entry times come from the integrated rate, so a falling rate spaces the jets out at the entry and nothing pops.
 *  Jets fade only on landing (the last 2 miles of the runway). */
export const ArrivalStream: React.FC<{ v: DenView; post: PostId; S: number; rateAt: (S: number) => number; jetLen?: number; S0?: number }> = ({ v, post, S, rateAt, jetLen = 1.6, S0 = -400 }) => {
  const path = streamPath(post);
  const L = pathLen(path);
  // entry times: cumulative count N(s) = sum rate/24; jet i enters when N crosses i (stagger per post)
  const offset = { NE: 0.1, SE: 0.55, SW: 0.3, NW: 0.8 }[post];
  const entries: number[] = [];
  let N = offset;
  for (let s = S0; s <= S; s += 0.5) {
    const before = N;
    N += (rateAt(s) / 24) * 0.5;
    if (Math.floor(N) > Math.floor(before)) entries.push(s);
  }
  const jets: React.ReactNode[] = [];
  entries.forEach((t0, i) => {
    const s = (S - t0) * STREAM_SPEED;
    if (s > L) return;
    const p = pathAt(path, s);
    const land = smooth(L - 2.5, L, s);
    const fog = fogAt(v, p.x, p.y, 0.3);
    const op = 1 - land;
    if (op <= 0.002) return;
    const body = projectPoly(v, jetPlanPoints(p.x, p.y, p.h, jetLen, 0.3));
    const sh = projectPoly(v, jetPlanPoints(p.x + 0.25, p.y - 0.12, p.h, jetLen, 0));
    jets.push(
      <g key={i} opacity={f3(op)}>
        <path d={polyD(sh)} fill={COLOR.shadow} opacity={0.32} />
        <path d={polyD(body)} fill={rgbHex(mixRgb(hexRgb(COLOR.cream), HAZE, fog * 0.6))} stroke={DEN_COLORS.jetShade} strokeWidth={0.6} strokeLinejoin="round" />
      </g>,
    );
  });
  return <g>{jets}</g>;
};

/** The forecast cells the FAA assumes (miles): a scatter of cells over the whole area (seeded), each a lumpy
 *  outline; as `cover` grows they swell and merge into one broad forecast field. */
export const BLANKET_CELLS: { x: number; y: number; r: number; seed: number }[] = (() => {
  const out: { x: number; y: number; r: number; seed: number }[] = [];
  for (let i = 0; i < 40; i++) {
    const a = hash01(i * 3.17 + 0.4) * Math.PI * 2;
    const d = 4 + 50 * Math.sqrt(hash01(i * 5.31 + 1.2));
    out.push({ x: Math.cos(a) * d, y: Math.sin(a) * d, r: 6 + 7 * hash01(i * 7.7 + 2.1), seed: i });
  }
  out.push({ x: 0, y: 0, r: 9, seed: 99 });
  return out;
})();
/** WorstCaseBlanket — the FAA's worst-case forecast: soft cell outlines that swell (and slowly breathe) with `cover`
 *  and merge (~0.5-0.6) into one broad, irregular amber-tinted field over most of the area, its edge a feathered
 *  amber glow (amber = the weather's reach). SVG (screen px); put it in AirStage `ground`. */
export const WorstCaseBlanket: React.FC<{ v: DenView; cover: number; S: number }> = ({ v, cover, S }) => {
  const uid = `blk${useId().replace(/[^A-Za-z0-9_-]/g, "_")}`;
  const c = clamp01(cover);
  if (c <= 0.001) return null;
  const k = v.scaleAt(0, 0, 0);
  const blur = Math.max(4, 2.6 * k);
  const shapes = BLANKET_CELLS.map((b, i) => {
    const r = b.r * (0.25 + 1.6 * c) * (1 + 0.04 * Math.sin(S / 37 + i * 1.3));
    const pts: [number, number, number][] = [];
    for (let j = 0; j < 56; j++) {
      const a = (j / 56) * Math.PI * 2;
      const wob = 1 + 0.12 * Math.sin(a * 3 + b.seed * 1.7) + 0.07 * Math.sin(a * 5 + b.seed * 0.9) + 0.04 * Math.sin(a * 9 + b.seed);
      pts.push([b.x + Math.cos(a) * r * wob, b.y + Math.sin(a) * r * wob, 0]);
    }
    return projectPoly(v, pts);
  });
  const edgeW = Math.max(2, 0.8 * k);
  return (
    <g>
      <defs>
        <filter id={`${uid}m`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={f3(blur)} />
          <feComponentTransfer>
            <feFuncA type="linear" slope="10" intercept="-4.2" />
          </feComponentTransfer>
          <feGaussianBlur stdDeviation={f3(Math.max(1.5, 0.25 * k))} result="shape" />
          <feMorphology in="shape" operator="erode" radius={f3(edgeW)} result="inner" />
          <feComposite in="shape" in2="inner" operator="out" result="edge" />
          <feFlood floodColor={COLOR.amberTop} floodOpacity={f3(0.1 + 0.12 * c)} />
          <feComposite in2="shape" operator="in" result="fill" />
          <feFlood floodColor={COLOR.amberTop} floodOpacity="0.6" />
          <feComposite in2="edge" operator="in" result="edgeCol" />
          <feGaussianBlur in="edgeCol" stdDeviation={f3(Math.max(3, edgeW * 2))} result="edgeSoft" />
          <feMerge>
            <feMergeNode in="fill" />
            <feMergeNode in="edgeSoft" />
          </feMerge>
        </filter>
      </defs>
      <g filter={`url(#${uid}m)`}>
        {shapes.map((sh, i) => (
          <path key={i} d={polyD(sh)} fill="#FFFFFF" />
        ))}
      </g>
    </g>
  );
};

// ===================================================================================================================
// a world label (FONT_LABEL caps, cream) at a ground point
// ===================================================================================================================
export const WorldLabel: React.FC<{ v: DenView; x: number; y: number; z?: number; text: string; enter?: number; px?: number; dy?: number; halo?: number }> = ({ v, x, y, z = 0, text, enter = 1, px = 30, dy = 0, halo = 0 }) => {
  const q = v.project(x, y, z);
  if (!q) return null;
  return (
    <g>
      {halo > 0 ? (
        // a soft deep-brown shadow under the letters (elevation style: offset down-right, blurred), never a box
        <g opacity={f3(0.7 * halo)} style={{ filter: `blur(${f3(px * 0.12)}px)` }} transform={`translate(${f3(px * 0.04)} ${f3(px * 0.08)})`}>
          <Label x={q.x} y={q.y + dy} k={1} text={text} tone="dark" enter={enter} px={px} />
        </g>
      ) : null}
      <Label x={q.x} y={q.y + dy} k={1} text={text} tone="cream" enter={enter} px={px} />
    </g>
  );
};

export { FONT_LABEL };
// ---- module-load checks ---------------------------------------------------------------------------------------------
if (Math.abs(makeView(DEN_CAM_RING).horizonY) > 4000) throw new Error("denverWorld: ring camera horizon out of range");
