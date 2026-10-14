// OCEAN_READY
import React, { createContext, useContext, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { AbsoluteFill, Img, cancelRender, continueRender, delayRender, staticFile } from "remotion";
import type { Cam } from "./outgrowShared";
import { COLOR as STOUT_COLOR, GRAIN, GROUND, Label, bloomFilter, clamp01, easeOutCubic, lerp, smoothstep } from "./stoutShared";

// ===========================================================================
// oceanShared — THE ULYSSES UNDERWATER WORLD (Cheeky Pint S4E02, Will O'Brien / Ulysses).
//
// The Cheeky Pint S4 grade (stoutShared: cream, ONE glowing amber, Söhne, grain on twos, a brown
// vignette, nothing black) carried into a realistic-leaning sea instead of the kraft board. The
// user: "maybe its better to kinda do more realistic looking graphics, while still keeping the
// cheeky pint vibe".
//
// THE MODEL — a pinhole camera in a 3-D sea, drawn as 2-D layers:
//   * WORLD px in all three axes; a Scene says how many world px make a metre (pxPerM).
//   * The camera `cam` (x, y, k: the house Cam) frames the WORLD PLANE z = 0, which sits focusM
//     metres from the eye. Anything at depth z (world px, + = nearer the eye, - = farther) is
//     scaled about the vanishing point by s = P / (P - z), P = focusM * pxPerM (DepthGroup does it).
//   * The vanishing point is the screen point (540, horizon): `horizon` (screen y) is the camera's
//     tilt — below 960 = looking up (the B/C platform shots), 960 = level.
//   * The eye is at world (cam.x, cam.y + (horizon - 960) / k); its depth below the surface sets the
//     water colour (WATER, by depth, + by viewing angle: looking up is shallower water).
//   * FOG: every object is pulled toward the water colour behind it by its distance from the eye:
//     fogAt(scene, metres). InFog does it to a group (the colour follows the screen gradient).
//   * The seabed and the sea surface are real planes (canvas, row by row: perspective, fog per row,
//     mip-mapped textures baked by scripts/bake-ulysses-ocean.py into public/ulysses/).
//   * Marine snow, god rays, grain, vignette are screen layers with parallax against `rest`.
//
// AMBER means ONE thing in this set: Ulysses' sensing (SonarFan, LockBracket, the scan, the
// running light). It glows with the stout bloom (bloomFilter). Nothing else is amber.
//
// UNITS. Geometry: world px (local to the current DepthGroup). Hairlines, strokes on screen, type
// and bloom: SCREEN px (convert with useOcean().a — screen px per local world px).
// ===========================================================================

export const FPS = 24000 / 1001;
export const W = 1080;
export const H = 1920;

// --- small helpers ---------------------------------------------------------------------------------
const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();
/** full precision for transforms (never rounded to 3 decimals: STOUT_FIX_1) */
const fx = (v: number) => (Math.round(v * 1e6) / 1e6).toString();
const uidOf = (raw: string) => `oc${raw.replace(/[^A-Za-z0-9_-]/g, "_")}`;
export const hash01 = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const mod = (a: number, m: number) => ((a % m) + m) % m;
export type RGB = [number, number, number];
export const hexRgb = (h: string): RGB => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
export const rgbHex = (c: RGB) => `#${c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16)).map((s) => (s.length < 2 ? "0" + s : s)).join("")}`;
export const mixRgb = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const rgba = (c: RGB, a: number) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${f3(clamp01(a))})`;
type P2 = { x: number; y: number };

// ===========================================================================
// TOKENS
// ===========================================================================
/** The water by depth (metres below the surface). A warm film grade: sunlit sea-glass at the top,
 *  a muted teal / petrol mid-water, and the deep warming toward espresso (never blue-black). */
export const WATER: readonly [number, string][] = [
  [0, "#A9C7B4"],
  [4, "#86AB9B"],
  [10, "#5F877D"],
  [18, "#466C66"],
  [28, "#375957"],
  [40, "#30494A"],
  [55, "#313E3A"],
  [72, "#363731"],
  [92, "#3D342B"],
  [130, "#3F3226"],
];
export const OCEAN = {
  cream: STOUT_COLOR.inkCream, // #F3EBDD: highlights, labels, snow, rays
  creamLo: STOUT_COLOR.inkCreamLo,
  amberTop: STOUT_COLOR.amberTop, // #FFB000
  amberFoot: STOUT_COLOR.amberFoot, // #E38E00
  amberHot: STOUT_COLOR.amberHot, // #FFE7A8
  shadow: "#22150B", // the stout family's shadow brown (AO, contact shadows)
  ink: STOUT_COLOR.inkDark, // #2E1E14
  vignette: "34,21,11",
  /** Snell's window (looking straight up through the surface) */
  sky: "#F1EEDD",
  /** painted steel of the platform (weathered grey-white), and its fouled foot */
  steelHi: "#C9C6B6",
  steelMid: "#8E8D80",
  steelLo: "#4D4D45",
  fouling: "#5B5A45",
  /** the naval mine: dark weathered steel, rust */
  mineHi: "#8E877B",
  mineMid: "#58524A",
  mineLo: "#35302A",
  mineDeep: "#28221D",
  rust: "#8A5232",
  /** the export cable: dark polyethylene sheath, armour sheen; buoyancy modules (pale, not amber) */
  cableLo: "#2D2B25",
  cableMid: "#55524A",
  cableHi: "#B3AB96",
  buoyHi: "#E2DCCB",
  buoyMid: "#A9A391",
  buoyLo: "#56524A",
  /** ghost gear: monofilament + old net twine, faded floats */
  mono: "#D9DCCB",
  twine: "#9E9A83",
  float: "#D8CDB4",
  /** animals: countershaded greys (warm-graded) */
  dolphinTop: "#4D5253",
  dolphinMid: "#878983",
  dolphinBelly: "#D3CCBC",
  whaleTop: "#393833",
  whaleMid: "#55534B",
  whaleBelly: "#9A9282",
  whaleFin: "#D6CEBB",
  /** the Mako's hull: matte black in life, a deep warm graphite here (never black), cream-rimmed */
  hullHi: "#857B6C",
  hullMid: "#302A24",
  hullLo: "#221D19",
  hullDeep: "#1B1714",
} as const;
/** Screen-px stroke weights (one family of weights across every object). */
export const STROKE_PX = { hair: 1.5, line: 2, mono: 1.8, twine: 1.6, bracket: 7, bracketHot: 2 } as const;
/** Real sizes (metres). Drawn sizes may be raised to a screen minimum (see DynamicCable). */
export const SIZE_M = {
  mine: 1.0, // sphere diameter (a moored contact mine)
  mineTether: 1.2, // chain, sphere bottom to sinker top (style frames)
  cable: 0.25, // dynamic export cable
  collar: 1.2, // buoyancy module diameter
  column: 10, // platform column diameter
  dolphin: 2.8,
  whale: 14,
  auv: 2.0, // the Mako's hull length (~18 cm across)
} as const;
/** Recommended hero sizes on screen (px) at rest. */
export const HERO_PX = { mine: 360, platform: 940, dolphin: 420, whale: 620, auv: 700 } as const;

// ===========================================================================
// SCENES
// ===========================================================================
export type Scene = {
  label: string;
  /** world px per metre (all three axes) */
  pxPerM: number;
  /** metres from the eye to the world plane z = 0 */
  focusM: number;
  /** fog: none nearer than fogNearM, then 1 - exp(-(d - near) / fogVisM), times fogMax */
  fogNearM: number;
  fogVisM: number;
  fogMax: number;
  /** world y of the sea surface and (optional) the seabed, both on the plane z = 0 */
  surfaceY: number;
  seabedY?: number;
  /** metres of water-colour change per unit tan(viewing angle) (looking up = shallower) */
  angleGainM: number;
  /** texture tile sizes (metres) */
  seabedTileM: number;
  surfaceTileM: number;
  /** caustic strength on the seabed (0..1, before depth falloff) */
  caustics: number;
  /** how much light reaches the seabed (1 = shallow; the rest sinks to the deep water's colour) */
  seabedLight: number;
  /** the seabed fogs faster than objects by this factor (deep scenes: the bed is barely there) */
  seabedFogBoost: number;
};
/** Cut A: a moored mine 2.6 m over the seabed at ~30 m, murky. 1 m = 120 world px; at k 3 the
 *  1 m sphere is 360 px. The seabed is y 0. */
export const SCENE_A: Scene = {
  label: "A mine countermeasures",
  pxPerM: 120,
  focusM: 6,
  fogNearM: 1.2,
  fogVisM: 11,
  fogMax: 0.97,
  surfaceY: -30 * 120,
  seabedY: 0,
  angleGainM: 24,
  seabedTileM: 5,
  surfaceTileM: 12,
  caustics: 0.55,
  seabedLight: 0.92,
  seabedFogBoost: 1,
};
/** Cuts B and C: the floating wind platform and its export cable. 1 m = 10 world px; the focus
 *  plane 75 m from the eye; surface y 0, seabed y 800 (80 m). The platform's centroid is world
 *  x 0, its front columns at z +200, the back column at z -400 (PLATFORM below). */
export const SCENE_BC: Scene = {
  label: "B/C platform + cable",
  pxPerM: 10,
  focusM: 75,
  fogNearM: 30,
  fogVisM: 150,
  fogMax: 0.97,
  surfaceY: 0,
  seabedY: 800,
  angleGainM: 46,
  seabedTileM: 60,
  surfaceTileM: 55,
  caustics: 0.0,
  seabedLight: 0.4,
  seabedFogBoost: 2.2,
};
/** The water gradient's reference focal length (screen px): the sea's light reads the same at any zoom. */
export const GRAD_F = 1250;
export const fogAt = (scene: Scene, distM: number) => scene.fogMax * (1 - Math.exp(-Math.max(0, distM - scene.fogNearM) / scene.fogVisM));
/** Water colour at a depth (metres below the surface). */
export const waterRgbAtDepth = (m: number): RGB => {
  if (m <= WATER[0][0]) return hexRgb(WATER[0][1]);
  for (let i = 1; i < WATER.length; i++) {
    if (m <= WATER[i][0]) {
      const t = (m - WATER[i - 1][0]) / (WATER[i][0] - WATER[i - 1][0]);
      return mixRgb(hexRgb(WATER[i - 1][1]), hexRgb(WATER[i][1]), t);
    }
  }
  return hexRgb(WATER[WATER.length - 1][1]);
};

// ===========================================================================
// THE VIEW (context): camera, perspective, fog, and the current local mapping
// ===========================================================================
export type OceanView = {
  frame: number;
  cam: Cam;
  scene: Scene;
  horizon: number;
  /** focal length, screen px (P * k) */
  F: number;
  /** world px per metre * focusM */
  P: number;
  /** eye world position (focus-plane coords) and its depth (m) */
  eye: P2;
  eyeDepthM: number;
  /** the root mapping world(z=0) -> screen: sx = a x + bx (includes sway) */
  root: { a: number; bx: number; by: number };
  /** the background water colour at a screen row */
  waterAt: (sy: number) => RGB;
};
export type OceanCtxV = OceanView & {
  /** the current local mapping (inside a DepthGroup): sx = a x + bx, sy = a y + by */
  a: number;
  bx: number;
  by: number;
  /** current depth z (world px, + nearer) and its scale s and distance (m) */
  z: number;
  s: number;
  distM: number;
};
const OceanCtx = createContext<OceanCtxV | null>(null);
export const useOcean = () => {
  const v = useContext(OceanCtx);
  if (!v) throw new Error("oceanShared: component used outside <OceanStage>");
  return v;
};

/** Build the view for a frame (also usable outside React, e.g. to aim a camera). */
export const makeView = (p: { frame: number; cam: Cam; scene: Scene; horizon?: number; sway?: P2 }): OceanView => {
  const { cam, scene } = p;
  const horizon = p.horizon ?? 960;
  const k = cam.k;
  const P = scene.focusM * scene.pxPerM;
  const F = P * k;
  const eye = { x: cam.x, y: cam.y + (horizon - 960) / k };
  const eyeDepthM = (eye.y - scene.surfaceY) / scene.pxPerM;
  const sw = p.sway ?? { x: 0, y: 0 };
  const root = { a: k, bx: 540 - cam.x * k + sw.x, by: 960 - cam.y * k + sw.y };
  // the gradient uses a fixed reference focal (GRAD_F), so a zoomed-in shot keeps the light from above
  const waterAt = (sy: number) => waterRgbAtDepth(eyeDepthM + (scene.angleGainM * (sy - horizon)) / GRAD_F);
  return { frame: p.frame, cam, scene, horizon, F, P, eye, eyeDepthM, root, waterAt };
};
/** Depth scale s for z (world px, + nearer). */
export const depthScale = (v: OceanView, z: number) => v.P / Math.max(1e-6, v.P - z);
/** Distance (m) from the eye to depth z. */
export const depthDistM = (v: OceanView, z: number) => v.scene.focusM - z / v.scene.pxPerM;
/** The mapping of depth z: screen = a * (x, y) + (bx, by). */
export const mappingAt = (v: OceanView, z: number) => {
  const s = depthScale(v, z);
  return { a: v.root.a * s, bx: 540 * (1 - s) + s * v.root.bx, by: v.horizon * (1 - s) + s * v.root.by, s };
};
/** World point (x, y) at depth z -> screen px. */
export const project = (v: OceanView, x: number, y: number, z = 0) => {
  const m = mappingAt(v, z);
  return { x: m.a * x + m.bx, y: m.a * y + m.by, a: m.a };
};
/** Screen px -> world point at depth z. */
export const unproject = (v: OceanView, sx: number, sy: number, z = 0) => {
  const m = mappingAt(v, z);
  return { x: (sx - m.bx) / m.a, y: (sy - m.by) / m.a };
};
/** A camera whose centre puts world point (wx, wy) (on z = 0) at screen point (sx, sy). */
export const camFor = (wx: number, wy: number, sx: number, sy: number, k: number): Cam => ({ x: wx - (sx - 540) / k, y: wy - (sy - 960) / k, k });

/**
 * DepthGroup — draw children at depth z (world px; + nearer the eye). Children use their own
 * world coordinates (the focus-plane coordinates they would have at z = 0); the group scales them
 * about the vanishing point, so a camera move gives them true parallax. useOcean() inside gives the
 * local mapping (a = screen px per local px) and the distance for fog.
 */
export const DepthGroup: React.FC<{ z: number; children?: React.ReactNode }> = ({ z, children }) => {
  const o = useOcean();
  const m = mappingAt(o, z);
  // relative to the parent mapping: parent(T(l)) = child(l)
  const r = m.a / o.a;
  const tx = (m.bx - o.bx) / o.a;
  const ty = (m.by - o.by) / o.a;
  const ctx: OceanCtxV = { ...o, a: m.a, bx: m.bx, by: m.by, z, s: m.s, distM: depthDistM(o, z) };
  return (
    <g transform={`matrix(${fx(r)} 0 0 ${fx(r)} ${fx(tx)} ${fx(ty)})`}>
      <OceanCtx.Provider value={ctx}>{children}</OceanCtx.Provider>
    </g>
  );
};

/** The fog amount of the current depth (optionally lifted by a light: lit 0..1). */
export const useFog = (lit = 0) => {
  const o = useOcean();
  return fogAt(o.scene, o.distM) * (1 - 0.75 * clamp01(lit));
};
/** Mix a colour toward the water at screen row sy by `amount` (for lines coloured per segment). */
export const fogHex = (o: OceanView, hex: string, amount: number, sy: number) => rgbHex(mixRgb(hexRgb(hex), o.waterAt(sy), clamp01(amount)));

/**
 * InFog — pull a group toward the water colour behind it. `amount` is a number (default: the fog of
 * the current depth) or a function of LOCAL world y (a long object that runs into the deep). The
 * colour follows the stage's water gradient on screen, so a tall object fogs into lighter water at
 * its top and darker at its foot. `blur` (screen px) softens distant things. The children are
 * rendered twice (once as the body, once as the fog's alpha mask).
 */
export const InFog: React.FC<{ amount?: number | ((y: number) => number); blur?: number; children?: React.ReactNode }> = ({ amount, blur = 0, children }) => {
  const o = useOcean();
  const uid = uidOf(useId());
  const amt = amount ?? fogAt(o.scene, o.distM);
  const x0 = (-200 - o.bx) / o.a;
  const x1 = (W + 200 - o.bx) / o.a;
  const y0 = (-200 - o.by) / o.a;
  const y1 = (H + 200 - o.by) / o.a;
  const N = 12;
  const stops = Array.from({ length: N + 1 }, (_, i) => {
    const sy = -200 + ((H + 400) * i) / N;
    const ly = (sy - o.by) / o.a;
    const a = typeof amt === "number" ? amt : amt(ly);
    return { off: i / N, c: rgbHex(o.waterAt(sy)), a: clamp01(a) };
  });
  const maxA = Math.max(...stops.map((s) => s.a));
  const style = blur > 0.05 ? { filter: `blur(${f3(blur / o.a)}px)` } : undefined;
  if (maxA < 0.003) return <g style={style}>{children}</g>;
  return (
    <g style={style}>
      <defs>
        <filter id={`${uid}w`} filterUnits="userSpaceOnUse" x={x0} y={y0} width={x1 - x0} height={y1 - y0} colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1 0" />
        </filter>
        <mask id={`${uid}m`} maskUnits="userSpaceOnUse" x={x0} y={y0} width={x1 - x0} height={y1 - y0}>
          <g filter={`url(#${uid}w)`}>{children}</g>
        </mask>
        <linearGradient id={`${uid}g`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(y0)} x2="0" y2={f3(y1)}>
          {stops.map((s, i) => (
            <stop key={i} offset={f3(s.off)} stopColor={s.c} stopOpacity={f3(s.a)} />
          ))}
        </linearGradient>
      </defs>
      {children}
      <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill={`url(#${uid}g)`} mask={`url(#${uid}m)`} />
    </g>
  );
};

// ===========================================================================
// CAMERA — the house damped follower (CAM_STIFF / CAM_DAMP, cheekyPintSystem), portrait, look =
// the camera centre (the focus sits at the true middle of the frame).
// ===========================================================================
export const CAM_STIFF = 0.145;
export const CAM_DAMP = 0.59;
export type Glide = { f0: number; f1: number; dx?: number; dy?: number; k?: number; warp?: number };
export const camEase = (u: number, warp = 1) => smoothstep(Math.pow(clamp01(u), warp));
/** Superposed eased glides of x / y / ln k, then the damped follower. Camera CENTRES, f = 0..frames+2. */
export const cameraTrack = (start: Cam, glides: Glide[], frames: number): Cam[] => {
  const T: Cam[] = [];
  for (let f = 0; f <= frames + 2; f++) {
    let x = start.x;
    let y = start.y;
    let lk = Math.log(start.k);
    let kPrev = start.k;
    for (const g of glides) {
      const e = camEase((f - g.f0) / (g.f1 - g.f0), g.warp ?? 1);
      x += (g.dx ?? 0) * e;
      y += (g.dy ?? 0) * e;
      if (g.k !== undefined) {
        lk += (Math.log(g.k) - Math.log(kPrev)) * e;
        kPrev = g.k;
      }
    }
    T.push({ x, y, k: Math.exp(lk) });
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
    out.push({ ...c });
  }
  return out;
};
/** A camera track on a story clock: glides in S, a pre-roll so S 0 is settled, sampled continuously. */
export const makeClockCam = (start: Cam, glides: Glide[], S_END: number, PRE = 40) => {
  const track = cameraTrack(
    start,
    glides.map((g) => ({ ...g, f0: g.f0 + PRE, f1: g.f1 + PRE })),
    S_END + PRE + 4,
  ).slice(PRE);
  const at = (S: number): Cam => {
    const a = Math.max(0, Math.min(track.length - 2, Math.floor(S)));
    const t = Math.max(0, Math.min(1, S - a));
    const A = track[a];
    const B = track[a + 1];
    return { x: lerp(A.x, B.x, t), y: lerp(A.y, B.y, t), k: lerp(A.k, B.k, t) };
  };
  return { track, at, rest: track[0] };
};

// ===========================================================================
// TEXTURE PLANES (canvas): the seabed and the sea surface seen from below
// ===========================================================================
export const TEX = {
  seabed: "ulysses/seabed.jpg",
  caustics: "ulysses/caustics.png",
  surface: "ulysses/surface.jpg",
} as const;
type Mips = HTMLCanvasElement[];
const MIP_PROMISE = new Map<string, Promise<Mips>>();
const MIP_READY = new Map<string, Mips>();
const loadMips = (src: string): Promise<Mips> => {
  const have = MIP_PROMISE.get(src);
  if (have) return have;
  const p = new Promise<Mips>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      // a 3 x 3 tiled source per level keeps the halving seamless at the tile's edges
      const levels: HTMLCanvasElement[] = [];
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      const c0 = document.createElement("canvas");
      c0.width = w;
      c0.height = h;
      (c0.getContext("2d") as CanvasRenderingContext2D).drawImage(img, 0, 0);
      levels.push(c0);
      while (w > 16 && h > 16 && levels.length < 8) {
        const prev = levels[levels.length - 1];
        const tiled = document.createElement("canvas");
        tiled.width = prev.width * 3;
        tiled.height = prev.height * 3;
        const tc = tiled.getContext("2d") as CanvasRenderingContext2D;
        for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) tc.drawImage(prev, i * prev.width, j * prev.height);
        w = Math.max(1, Math.round(w / 2));
        h = Math.max(1, Math.round(h / 2));
        const c = document.createElement("canvas");
        c.width = w;
        c.height = h;
        const cx = c.getContext("2d") as CanvasRenderingContext2D;
        cx.imageSmoothingEnabled = true;
        cx.imageSmoothingQuality = "high";
        cx.drawImage(tiled, prev.width, prev.height, prev.width, prev.height, 0, 0, w, h);
        levels.push(c);
      }
      MIP_READY.set(src, levels);
      resolve(levels);
    };
    img.onerror = () => reject(new Error(`oceanShared: could not load ${src}`));
    img.src = staticFile(src);
  });
  MIP_PROMISE.set(src, p);
  return p;
};
const useMips = (srcs: string[]): Mips[] | null => {
  const key = srcs.join("|");
  const ready = srcs.every((s) => MIP_READY.has(s));
  const [, bump] = useState(0);
  const [handle] = useState(() => (ready ? null : delayRender(`oceanShared textures ${key}`, { timeoutInMilliseconds: 120000 })));
  useEffect(() => {
    if (handle === null) return;
    let live = true;
    Promise.all(key.split("|").map(loadMips)).then(
      () => {
        if (live) bump((n) => n + 1);
        continueRender(handle);
      },
      (e) => cancelRender(e),
    );
    return () => {
      live = false;
    };
  }, [key, handle]);
  return ready ? srcs.map((s) => MIP_READY.get(s) as Mips) : null;
};
type PlaneLayer = { mips: Mips; tileM: number; ox: number; oy: number; alpha: number; op: GlobalCompositeOperation };
/** Texture-space mapping of a plane row; returns the pattern transform per mip level. */
const drawPlaneRow = (ctx: CanvasRenderingContext2D, v: OceanView, y: number, s: number, depthM: number, L: PlaneLayer, dDistDy = 0) => {
  const { scene, cam } = v;
  const tex = L.mips[0];
  const texPerWorld = tex.width / (L.tileM * scene.pxPerM); // tex px per world px
  const latRate = texPerWorld / (cam.k * s); // tex px per screen px, laterally
  // depth rate: d(depthM)/dy = focusM / (s^2 |Y0 - horizon|) per screen row ... passed in via depthM' below
  const vRate = (dDistDy / L.tileM) * tex.height; // tex px per screen row, along the depth
  const lvl = Math.max(0, Math.min(L.mips.length - 1, Math.floor(Math.log2(Math.max(1, Math.max(latRate, vRate * 0.7))))));
  const m = L.mips[lvl];
  const sc = m.width / tex.width;
  const a = latRate * sc; // pattern px per screen px
  const c = ((v.eye.x - 540 / (cam.k * s)) * texPerWorld + L.ox) * sc; // pattern u at screen x 0
  const vRow = mod((depthM / L.tileM) * m.height + L.oy * sc, m.height);
  const pat = ctx.createPattern(m, "repeat");
  if (!pat) return;
  pat.setTransform(new DOMMatrix([1 / a, 0, 0, 1, -c / a, y - vRow]));
  ctx.globalAlpha = L.alpha;
  ctx.globalCompositeOperation = L.op;
  ctx.fillStyle = pat;
  ctx.fillRect(0, y, W, 1);
};

/**
 * The plane rows of a horizontal plane at world y `planeY` (z = 0 line): for screen row y,
 * s = (y - horizon) / (Y0 - horizon), distance = focusM / s, depth along the plane = distance - focusM.
 */
const planeRows = (v: OceanView, planeY: number) => {
  const Y0 = v.root.a * planeY + v.root.by;
  const d = Y0 - v.horizon;
  return { Y0, d };
};

/** SeabedPlane — the sandy, silty seabed (perspective, fog per row, two drifting caustic layers). */
export const SeabedPlane: React.FC<{ v: OceanView; caustics?: number }> = ({ v, caustics }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const mips = useMips([TEX.seabed, TEX.caustics]);
  useLayoutEffect(() => {
    const cv = ref.current;
    if (!cv || !mips || v.scene.seabedY === undefined) return;
    const ctx = cv.getContext("2d") as CanvasRenderingContext2D;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, W, H);
    const { d } = planeRows(v, v.scene.seabedY);
    if (d <= 2) return;
    const y0 = Math.max(0, Math.ceil(v.horizon + 1));
    const cStrength = (caustics ?? v.scene.caustics) * Math.exp(-Math.max(0, v.eyeDepthM) / 18);
    const deep = waterRgbAtDepth((v.scene.seabedY - v.scene.surfaceY) / v.scene.pxPerM + 25);
    const deepFill = `rgb(${Math.round(deep[0])},${Math.round(deep[1])},${Math.round(deep[2])})`;
    const t = v.frame;
    for (let y = y0; y < H; y++) {
      const s = (y + 0.5 - v.horizon) / d;
      if (s <= 0) continue;
      const dist = v.scene.focusM / s;
      const dd = v.scene.focusM / (s * s * Math.abs(d));
      const fog = fogAt(v.scene, dist * v.scene.seabedFogBoost);
      const water = v.waterAt(y);
      if (fog < 0.995) {
        const depthM = -(dist - v.scene.focusM); // + toward the eye; texture v runs with it
        drawPlaneRow(ctx, v, y, s, depthM, { mips: mips[0], tileM: v.scene.seabedTileM, ox: 0, oy: 0, alpha: 1, op: "source-over" }, dd);
        if (cStrength > 0.01) {
          const ca = cStrength * (1 - fog) * 0.5;
          drawPlaneRow(ctx, v, y, s, depthM, { mips: mips[1], tileM: v.scene.seabedTileM * 0.45, ox: t * 3.1, oy: t * 1.3, alpha: ca, op: "screen" }, dd);
          drawPlaneRow(ctx, v, y, s, depthM, { mips: mips[1], tileM: v.scene.seabedTileM * 0.62, ox: -t * 2.3, oy: t * 2.2 + 300, alpha: ca * 0.8, op: "screen" }, dd);
        }
        // deep water: little light reaches the bed; it sinks toward the deep water's colour
        ctx.globalCompositeOperation = "source-over";
        if (v.scene.seabedLight < 0.999) {
          ctx.globalAlpha = 1 - v.scene.seabedLight;
          ctx.fillStyle = deepFill;
          ctx.fillRect(0, y, W, 1);
        }
      }
      ctx.globalAlpha = fog;
      ctx.fillStyle = `rgb(${Math.round(water[0])},${Math.round(water[1])},${Math.round(water[2])})`;
      ctx.fillRect(0, y, W, 1);
    }
    ctx.globalAlpha = 1;
  });
  return <canvas ref={ref} width={W} height={H} style={{ position: "absolute", left: 0, top: 0, width: W, height: H }} />;
};

/** The surface's light model (see SurfacePlane). */
export const SURFACE_LOOK = {
  fogBoost: 1.9, // the surface fogs faster than objects (a long, bright, scattering path)
  window0: 0.72, // tan(elevation) where Snell's window starts to show the sky
  windowSoft: 0.45,
  grazeLift: 0.3, // the grazing surface: the water, lifted toward the sky by this much
  angleLift: 0.35,
  contrastNear: 0.15, // the ripples' strength (hard-light alpha) near / far
  contrastFar: 0.025,
  causticNear: 0.5, // refraction lines (the caustic network) screened over the near surface
  causticTileM: 9,
} as const;
/** SurfacePlane — the sea surface seen from below: rippled, bright in Snell's window overhead,
 *  reflecting the water at grazing angles, fogged by distance. Two ripple layers drift across
 *  each other (multiply). */
export const SurfacePlane: React.FC<{ v: OceanView; current?: P2 }> = ({ v, current = { x: 1, y: 0.4 } }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const mips = useMips([TEX.surface, TEX.caustics]);
  useLayoutEffect(() => {
    const cv = ref.current;
    if (!cv || !mips) return;
    const ctx = cv.getContext("2d") as CanvasRenderingContext2D;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, W, H);
    const { d } = planeRows(v, v.scene.surfaceY);
    if (d >= -2) return;
    const y1 = Math.min(H, Math.floor(v.horizon - 1));
    const t = v.frame;
    const sky = hexRgb(OCEAN.sky);
    for (let y = 0; y < y1; y++) {
      const s = (y + 0.5 - v.horizon) / d;
      if (s <= 0) continue;
      const dist = v.scene.focusM / s;
      const dd = v.scene.focusM / (s * s * Math.abs(d));
      const fog = fogAt(v.scene, dist * SURFACE_LOOK.fogBoost);
      const water = v.waterAt(y);
      if (fog < 0.995) {
        const depthM = -(dist - v.scene.focusM);
        // the light model: at grazing angles the surface mirrors the water (a little lighter);
        // steeper, Snell's window shows the sky
        const tanE = (v.horizon - y) / v.F;
        const win = smoothstep((tanE - SURFACE_LOOK.window0) / SURFACE_LOOK.windowSoft);
        const graze = mixRgb(water, sky, SURFACE_LOOK.grazeLift + SURFACE_LOOK.angleLift * clamp01(tanE));
        const base = mixRgb(graze, sky, win * 0.9);
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 1;
        ctx.fillStyle = `rgb(${Math.round(base[0])},${Math.round(base[1])},${Math.round(base[2])})`;
        ctx.fillRect(0, y, W, 1);
        // ripples: two drifting luminance layers, hard-lit, their contrast falling with distance
        const con = lerp(SURFACE_LOOK.contrastNear, SURFACE_LOOK.contrastFar, smoothstep((dist - v.scene.focusM * 0.25) / (v.scene.focusM * 1.4)));
        drawPlaneRow(ctx, v, y, s, depthM, { mips: mips[0], tileM: v.scene.surfaceTileM, ox: t * 2.2 * current.x, oy: t * 1.6, alpha: con, op: "hard-light" }, dd);
        drawPlaneRow(ctx, v, y, s, depthM, { mips: mips[0], tileM: v.scene.surfaceTileM * 0.71, ox: -t * 1.7 + 411, oy: -t * 1.1 + 207, alpha: con * 0.7, op: "hard-light" }, dd);
        const ca = SURFACE_LOOK.causticNear * (1 - smoothstep((dist - v.scene.focusM * 0.2) / (v.scene.focusM * 0.9)));
        if (ca > 0.005) {
          drawPlaneRow(ctx, v, y, s, depthM, { mips: mips[1], tileM: SURFACE_LOOK.causticTileM, ox: t * 2.6, oy: t * 1.2, alpha: ca, op: "screen" }, dd);
          drawPlaneRow(ctx, v, y, s, depthM, { mips: mips[1], tileM: SURFACE_LOOK.causticTileM * 1.37, ox: -t * 1.9 + 200, oy: t * 0.8 + 90, alpha: ca * 0.7, op: "screen" }, dd);
        }
      }
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = fog;
      ctx.fillStyle = `rgb(${Math.round(water[0])},${Math.round(water[1])},${Math.round(water[2])})`;
      ctx.fillRect(0, y, W, 1);
    }
    ctx.globalAlpha = 1;
  });
  return <canvas ref={ref} width={W} height={H} style={{ position: "absolute", left: 0, top: 0, width: W, height: H }} />;
};

// ===========================================================================
// GOD RAYS + MARINE SNOW (screen layers, parallax against `rest`)
// ===========================================================================
const RAYS = Array.from({ length: 9 }, (_, i) => ({
  x: (i - 4) * 250 + (hash01(i + 1) - 0.5) * 150,
  w0: 30 + hash01(i + 11) * 60,
  w1: 140 + hash01(i + 21) * 200,
  a: 0.45 + hash01(i + 31) * 0.55,
  ph: hash01(i + 41) * 6.283,
  len: 1500 + hash01(i + 51) * 700,
}));
/** GodRays — soft cream shafts from the surface, swaying slowly; weaker the deeper the eye. */
export const GodRays: React.FC<{ v: OceanView; rest: Cam; strength?: number; top?: number }> = ({ v, rest, strength = 1, top }) => {
  const uid = uidOf(useId());
  const depthK = Math.min(1, 1.5 * Math.exp(-Math.max(0, v.eyeDepthM) / 34));
  const S = strength * depthK;
  if (S < 0.01) return null;
  const k = v.cam.k;
  const par = 0.35;
  const shift = -(v.cam.x - rest.x) * k * par;
  const y0 = top ?? -160;
  const t = v.frame;
  const slant = 0.2;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", left: 0, top: 0, mixBlendMode: "screen" }}>
      <defs>
        <linearGradient id={`${uid}r`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={OCEAN.cream} stopOpacity="0.34" />
          <stop offset="0.4" stopColor={OCEAN.cream} stopOpacity="0.16" />
          <stop offset="1" stopColor={OCEAN.cream} stopOpacity="0" />
        </linearGradient>
        <filter id={`${uid}b`} x="-50%" y="-10%" width="200%" height="120%">
          <feGaussianBlur stdDeviation="22" />
        </filter>
      </defs>
      <g filter={`url(#${uid}b)`}>
        {RAYS.map((r, i) => {
          const cx = mod(r.x + shift + 1200, 2400) - 1200 + 540;
          const breath = 1 + 0.22 * Math.sin(t * 0.031 + r.ph);
          const al = r.a * (0.72 + 0.28 * Math.sin(t * 0.023 + r.ph * 1.7)) * S;
          const x0 = cx;
          const y1 = y0 + r.len;
          const x1 = cx + r.len * slant;
          const w0 = r.w0 * breath;
          const w1 = r.w1 * breath;
          return (
            <path
              key={i}
              d={`M${f3(x0 - w0 / 2)} ${f3(y0)}L${f3(x0 + w0 / 2)} ${f3(y0)}L${f3(x1 + w1 / 2)} ${f3(y1)}L${f3(x1 - w1 / 2)} ${f3(y1)}Z`}
              fill={`url(#${uid}r)`}
              opacity={f3(al)}
            />
          );
        })}
      </g>
    </svg>
  );
};

type SnowLayer = { n: number; par: number; zoomP: number; r: [number, number]; a: [number, number]; speed: number; soft: number; seed: number };
/** far (tiny, many), mid (small, soft), near (big defocused discs) */
export const SNOW_LAYERS: readonly SnowLayer[] = [
  { n: 190, par: 0.5, zoomP: 0.25, r: [1.0, 2.0], a: [0.3, 0.62], speed: 0.45, soft: 0.3, seed: 100 },
  { n: 90, par: 1.0, zoomP: 0.6, r: [2.2, 4.2], a: [0.4, 0.75], speed: 0.8, soft: 0.55, seed: 300 },
  { n: 15, par: 1.9, zoomP: 1.0, r: [11, 26], a: [0.12, 0.24], speed: 1.5, soft: 0.85, seed: 500 },
];
const SNOW_TILE = { w: 1500, h: 2600 };
/** MarineSnow — one layer (0 far, 1 mid, 2 near) of drifting cream particulate. Deterministic. */
export const MarineSnow: React.FC<{ v: OceanView; rest: Cam; layer: 0 | 1 | 2; current?: P2; density?: number; half?: 0 | 1 }> = ({
  v,
  rest,
  layer,
  current = { x: 0.55, y: -0.12 },
  density = 1,
  half,
}) => {
  const uid = uidOf(useId());
  const L = SNOW_LAYERS[layer];
  const k = v.cam.k;
  const zl = Math.max(0.78, Math.pow(k / rest.k, L.zoomP));
  const gx = -(v.cam.x - rest.x) * k * L.par;
  const gy = -(v.cam.y - rest.y) * k * L.par;
  const t = v.frame;
  const n = Math.round(L.n * density);
  const dots: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    if (half !== undefined && i % 2 !== half) continue;
    const h = L.seed + i * 7.13;
    const u0 = hash01(h) * SNOW_TILE.w;
    const v0 = hash01(h + 1.7) * SNOW_TILE.h;
    const sp = L.speed * (0.7 + 0.6 * hash01(h + 3.1));
    const wob = 7 * Math.sin(t * (0.03 + 0.03 * hash01(h + 4.4)) + hash01(h + 5.5) * 6.28);
    const sink = 0.12 * L.speed * t; // particulate sinks slowly
    const u = mod(u0 + current.x * sp * t + wob + gx, SNOW_TILE.w) - SNOW_TILE.w / 2;
    const vv = mod(v0 + current.y * sp * t + sink + gy, SNOW_TILE.h) - SNOW_TILE.h / 2;
    const x = 540 + u * zl;
    const y = 960 + vv * zl;
    const r = lerp(L.r[0], L.r[1], hash01(h + 6.6)) * zl;
    if (x < -r * 2 || x > W + r * 2 || y < -r * 2 || y > H + r * 2) continue;
    const lit = 0.62 + 0.38 * (1 - clamp01(y / H));
    const a = lerp(L.a[0], L.a[1], hash01(h + 8.8)) * lit;
    dots.push(<circle key={i} cx={f3(x)} cy={f3(y)} r={f3(r)} fill={`url(#${uid}g)`} opacity={f3(a)} />);
  }
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", left: 0, top: 0 }}>
      <defs>
        <radialGradient id={`${uid}g`}>
          <stop offset="0" stopColor={OCEAN.cream} stopOpacity="1" />
          <stop offset={f3(1 - L.soft)} stopColor={OCEAN.cream} stopOpacity={layer === 2 ? "0.85" : "0.9"} />
          <stop offset="1" stopColor={OCEAN.cream} stopOpacity="0" />
        </radialGradient>
      </defs>
      {dots}
    </svg>
  );
};

// ===========================================================================
// THE STAGE
// ===========================================================================
/** The warm split-tone grade over the whole frame (soft-light): cream into the highlights at the top,
 *  brown into the shadows at the bottom. */
export const GRADE = { top: "rgba(243,226,196,0.55)", mid: "rgba(150,120,90,0.18)", bottom: "rgba(74,44,24,0.5)" } as const;
export type OceanStageProps = {
  frame: number;
  cam: Cam;
  scene: Scene;
  /** screen y of the vanishing point (camera tilt): 960 level, larger = looking up */
  horizon?: number;
  /** the parallax origin for snow / rays (the cut's opening camera) */
  rest?: Cam;
  current?: P2;
  /** handheld sway (off for stills) */
  sway?: boolean;
  rays?: number;
  snow?: number;
  /** the warm film grade (soft-light: cream highs, brown lows), 0..1 */
  grade?: number;
  /** drawn in WORLD coordinates (z = 0) under the camera */
  children?: React.ReactNode;
  /** world layer drawn in front of the mid snow (things very near the eye) */
  front?: React.ReactNode;
  /** SCREEN px layer above everything but the vignette and grain */
  overlay?: React.ReactNode;
};
export const OceanStage: React.FC<OceanStageProps> = ({
  frame,
  cam,
  scene,
  horizon = 960,
  rest = cam,
  current = { x: 0.55, y: -0.12 },
  sway = false,
  rays = 1,
  snow = 1,
  grade = 1,
  children,
  front,
  overlay,
}) => {
  const sw = sway ? { x: 3 * Math.sin(frame / 23), y: 5 * Math.sin(frame / 19) } : { x: 0, y: 0 };
  const v = makeView({ frame, cam, scene, horizon, sway: sw });
  const ctx: OceanCtxV = { ...v, a: v.root.a, bx: v.root.bx, by: v.root.by, z: 0, s: 1, distM: scene.focusM };
  // the water body: a vertical gradient by depth + viewing angle
  const stops = Array.from({ length: 17 }, (_, i) => {
    const y = (H * i) / 16;
    return `${rgbHex(v.waterAt(y))} ${f3((100 * i) / 16)}%`;
  }).join(", ");
  const sun = Math.min(0.5, 0.55 * Math.exp(-Math.max(0, v.eyeDepthM) / 20));
  const sunXY = { x: 330, y: Math.min(-120, v.root.a * scene.surfaceY + v.root.by - 300) };
  const g2 = Math.floor(frame / 2);
  const grx = (hash01(g2 + 1) * 2 - 1) * GRAIN.travel;
  const gry = (hash01(g2 + 7) * 2 - 1) * GRAIN.travel;
  const surfVisible = v.root.a * scene.surfaceY + v.root.by < horizon - 2;
  const bedVisible = scene.seabedY !== undefined && v.root.a * scene.seabedY + v.root.by > horizon + 2;
  const world = (content: React.ReactNode) => (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <g transform={`matrix(${fx(v.root.a)} 0 0 ${fx(v.root.a)} ${fx(v.root.bx)} ${fx(v.root.by)})`}>
        <OceanCtx.Provider value={ctx}>{content}</OceanCtx.Provider>
      </g>
    </svg>
  );
  return (
    <AbsoluteFill style={{ backgroundColor: rgbHex(v.waterAt(960)), overflow: "hidden" }}>
      <AbsoluteFill style={{ background: `linear-gradient(to bottom, ${stops})` }} />
      {sun > 0.01 ? (
        <AbsoluteFill
          style={{
            mixBlendMode: "screen",
            background: `radial-gradient(ellipse 1100px 1300px at ${sunXY.x}px ${f3(sunXY.y)}px, ${rgba(hexRgb(OCEAN.sky), sun)} 0%, ${rgba(hexRgb(OCEAN.sky), sun * 0.35)} 40%, ${rgba(hexRgb(OCEAN.sky), 0)} 100%)`,
          }}
        />
      ) : null}
      {surfVisible ? <SurfacePlane v={v} current={current} /> : null}
      {bedVisible ? <SeabedPlane v={v} /> : null}
      {rays > 0 ? <GodRays v={v} rest={rest} strength={rays} /> : null}
      {snow > 0 ? <MarineSnow v={v} rest={rest} layer={0} current={current} density={snow} /> : null}
      {snow > 0 ? <MarineSnow v={v} rest={rest} layer={1} current={current} density={snow} half={0} /> : null}
      {world(children)}
      {snow > 0 ? <MarineSnow v={v} rest={rest} layer={1} current={current} density={snow} half={1} /> : null}
      {front ? world(front) : null}
      {snow > 0 ? <MarineSnow v={v} rest={rest} layer={2} current={current} density={snow} /> : null}
      {overlay}
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

// ===========================================================================
// SHADING HELPERS — one key light from above (the surface), a cream rim on top edges, AO
// ===========================================================================
/** A rim of cream light along the TOP edges of a shape: the shape filled with the rim colour,
 *  covered by the body shifted down by `w` (local px) and softened. Use as the body's own paint. */
export const RimLit: React.FC<{ d: string; body: string; rim?: string; rimOpacity?: number; w: number; soft?: number; transform?: string }> = ({
  d,
  body,
  rim = OCEAN.cream,
  rimOpacity = 0.75,
  w,
  soft = 0.5,
  transform,
}) => {
  const uid = uidOf(useId());
  return (
    <g transform={transform}>
      <defs>
        <clipPath id={`${uid}c`}>
          <path d={d} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${uid}c)`}>
        <path d={d} fill={rim} fillOpacity={rimOpacity} />
        <path d={d} fill={body} transform={`translate(0 ${fx(w)})`} style={{ filter: soft > 0 ? `blur(${f3(w * soft)}px)` : undefined }} />
        <path d={d} fill={body} transform={`translate(0 ${fx(w * 1.6)})`} />
      </g>
    </g>
  );
};
const pathOf = (pts: P2[], close = true) => `M${pts.map((p) => `${f3(p.x)} ${f3(p.y)}`).join("L")}${close ? "Z" : ""}`;
/** A smooth closed path through points (Catmull-Rom -> cubic Bézier). */
export const smoothClosed = (pts: P2[], tension = 1) => {
  const n = pts.length;
  let d = `M${f3(pts[0].x)} ${f3(pts[0].y)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1 = { x: p1.x + ((p2.x - p0.x) / 6) * tension, y: p1.y + ((p2.y - p0.y) / 6) * tension };
    const c2 = { x: p2.x - ((p3.x - p1.x) / 6) * tension, y: p2.y - ((p3.y - p1.y) / 6) * tension };
    d += `C${f3(c1.x)} ${f3(c1.y)} ${f3(c2.x)} ${f3(c2.y)} ${f3(p2.x)} ${f3(p2.y)}`;
  }
  return d + "Z";
};
/** A smooth open path through points. */
export const smoothOpen = (pts: P2[], tension = 1) => {
  const n = pts.length;
  if (n < 2) return "";
  let d = `M${f3(pts[0].x)} ${f3(pts[0].y)}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(n - 1, i + 2)];
    const c1 = { x: p1.x + ((p2.x - p0.x) / 6) * tension, y: p1.y + ((p2.y - p0.y) / 6) * tension };
    const c2 = { x: p2.x - ((p3.x - p1.x) / 6) * tension, y: p2.y - ((p3.y - p1.y) / 6) * tension };
    d += `C${f3(c1.x)} ${f3(c1.y)} ${f3(c2.x)} ${f3(c2.y)} ${f3(p2.x)} ${f3(p2.y)}`;
  }
  return d;
};

// ===========================================================================
// SONAR FAN (amber: Ulysses' sensing) + the light it gives
// ===========================================================================
export type Fan = { x: number; y: number; angle: number; spread: number; range: number };
/** How much a fan lights a point (local coords of the fan): 0..1, soft at its edges and range. */
export const fanLight = (f: Fan, x: number, y: number) => {
  const dx = x - f.x;
  const dy = y - f.y;
  const r = Math.hypot(dx, dy);
  if (r < 1e-6) return 1;
  let da = Math.atan2(dy, dx) - f.angle;
  da = Math.atan2(Math.sin(da), Math.cos(da));
  const ang = 1 - smoothstep((Math.abs(da) - f.spread * 0.38) / (f.spread * 0.2));
  const rng = 1 - smoothstep((r - f.range * 0.7) / (f.range * 0.35));
  return clamp01(ang * rng);
};
/**
 * SonarFan — a soft, volumetric amber fan from (x, y) (local world coords) toward `angle` (rad,
 * screen convention: 0 = right, + = down), `spread` (rad) wide, `range` (local px) long. `sweep`
 * 0..1 moves a brighter beam across it (the scan); `strength` 0..1 grows it OUT of the emitter
 * (range scales with strength: never a fade from nothing). The stout bloom on its core.
 */
export const SonarFan: React.FC<Fan & { sweep?: number; strength?: number }> = ({ x, y, angle, spread, range, sweep = 0.5, strength = 1 }) => {
  const o = useOcean();
  const uid = uidOf(useId());
  const st = clamp01(strength);
  if (st <= 0.001) return null;
  const R = range * easeOutCubic(st);
  const wedge = (a0: number, a1: number, r: number) =>
    `M${f3(x)} ${f3(y)}L${f3(x + r * Math.cos(a0))} ${f3(y + r * Math.sin(a0))}A${f3(r)} ${f3(r)} 0 0 1 ${f3(x + r * Math.cos(a1))} ${f3(y + r * Math.sin(a1))}Z`;
  const px = 1 / o.a;
  const beamA = angle + (sweep - 0.5) * spread * 0.8;
  return (
    <g style={{ mixBlendMode: "screen" }}>
      <defs>
        <radialGradient id={`${uid}g`} gradientUnits="userSpaceOnUse" cx={x} cy={y} r={R}>
          <stop offset="0" stopColor={OCEAN.amberTop} stopOpacity="0.6" />
          <stop offset="0.25" stopColor={OCEAN.amberTop} stopOpacity="0.34" />
          <stop offset="0.7" stopColor={OCEAN.amberFoot} stopOpacity="0.17" />
          <stop offset="1" stopColor={OCEAN.amberFoot} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${uid}h`} gradientUnits="userSpaceOnUse" cx={x} cy={y} r={R}>
          <stop offset="0" stopColor={OCEAN.amberHot} stopOpacity="0.85" />
          <stop offset="0.4" stopColor={OCEAN.amberTop} stopOpacity="0.4" />
          <stop offset="1" stopColor={OCEAN.amberTop} stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* the volume: three nested wedges = a soft angular falloff, blurred */}
      <g style={{ filter: `blur(${f3(14 * px)}px)` }}>
        {[1, 0.78, 0.55].map((m, i) => (
          <path key={i} d={wedge(angle - (spread * m) / 2, angle + (spread * m) / 2, R)} fill={`url(#${uid}g)`} opacity={f3(0.55 * st)} />
        ))}
      </g>
      {/* the beam that sweeps the fan */}
      <g style={{ filter: `blur(${f3(6 * px)}px) ${bloomFilter(o.a)}` }}>
        <path d={wedge(beamA - spread * 0.05, beamA + spread * 0.05, R * 0.96)} fill={`url(#${uid}h)`} opacity={f3(0.75 * st)} />
      </g>
      {/* the reach: a faint arc at the range (constant, never a pulse) */}
      <path
        d={`M${f3(x + R * 0.97 * Math.cos(angle - spread * 0.42))} ${f3(y + R * 0.97 * Math.sin(angle - spread * 0.42))}A${f3(R * 0.97)} ${f3(R * 0.97)} 0 0 1 ${f3(x + R * 0.97 * Math.cos(angle + spread * 0.42))} ${f3(y + R * 0.97 * Math.sin(angle + spread * 0.42))}`}
        fill="none"
        stroke={OCEAN.amberTop}
        strokeOpacity={f3(0.2 * st)}
        strokeWidth={f3(2 * px)}
        style={{ filter: `blur(${f3(1.5 * px)}px)` }}
      />
      {/* the emitter's hot core */}
      <circle cx={x} cy={y} r={f3(7 * px)} fill={OCEAN.amberHot} style={{ filter: bloomFilter(o.a) }} opacity={f3(st)} />
    </g>
  );
};

// ===========================================================================
// LOCK BRACKET (amber) + its label slot
// ===========================================================================
/**
 * LockBracket — four amber corners closing on a target box (local world coords x, y = centre,
 * w, h). `t` 0..1: the corners slide in from a larger box (`from` x the final half-size; default:
 * just outside the frame) at full opacity, easing out. Arms, stroke and bloom in SCREEN px.
 * `label` (optional) enters beside the box (blur-in + 24 px slide-up) with `labelT` 0..1.
 */
export const LockBracket: React.FC<{ x: number; y: number; w: number; h: number; t: number; from?: number; label?: string; labelT?: number; labelSide?: "right" | "left" }> = ({
  x,
  y,
  w,
  h,
  t,
  from,
  label,
  labelT = 0,
  labelSide = "right",
}) => {
  const o = useOcean();
  const px = 1 / o.a;
  const sc = { x: o.a * x + o.bx, y: o.a * y + o.by };
  const autoFrom = Math.max(Math.min(((Math.max(sc.x, W - sc.x) + 60) / (o.a * w)) * 2, ((Math.max(sc.y, H - sc.y) + 60) / (o.a * h)) * 2), 1.6);
  const f0 = from ?? autoFrom;
  const e = easeOutCubic(t);
  const m = lerp(f0, 1, e);
  const hw = (w / 2) * m;
  const hh = (h / 2) * m;
  const arm = Math.min(w, h) * 0.24;
  const sw = STROKE_PX.bracket * px;
  const corners = [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ].map(([sx, sy]) => {
    const cx = x + sx * hw;
    const cy = y + sy * hh;
    return `M${f3(cx)} ${f3(cy - sy * arm)}L${f3(cx)} ${f3(cy)}L${f3(cx - sx * arm)} ${f3(cy)}`;
  });
  const d = corners.join(" ");
  if (t <= 0) return null;
  return (
    <g>
      <g fill="none" strokeLinecap="square" strokeLinejoin="miter">
        <path d={d} stroke={OCEAN.amberTop} strokeWidth={f3(sw)} style={{ filter: bloomFilter(o.a) }} />
        <path d={d} stroke={OCEAN.amberHot} strokeWidth={f3(STROKE_PX.bracketHot * px)} opacity={0.9} />
      </g>
      {label ? (
        <Label
          x={labelSide === "right" ? x + w / 2 + arm * 0.2 + 24 * px : x - w / 2 - arm * 0.2 - 24 * px}
          y={y + 11 * px}
          k={o.a}
          text={label}
          tone="cream"
          anchor={labelSide === "right" ? "start" : "end"}
          enter={labelT}
        />
      ) : null}
    </g>
  );
};

// ===========================================================================
// NAVAL MINE — a moored contact mine: horned sphere, flange seam, chain, sinker
// ===========================================================================
export type MineProps = {
  /** the anchor: the point on the seabed under the sinker's centre (local world coords) */
  x: number;
  y: number;
  /** sphere diameter (local px) */
  d: number;
  horns?: number;
  /** rotation of the horn ring about the vertical axis (rad) */
  spin?: number;
  /** chain length, sphere bottom to sinker top (local px; default SIZE_M.mineTether / SIZE_M.mine x d) */
  tether?: number;
  /** lean of the mooring in the current (rad, + = top to the right) */
  sway?: number;
  /** amber light from the sonar (0..1) and where it comes from (local coords) */
  lit?: number;
  litFrom?: P2;
  /** view elevation (rad): how much we look down on it */
  elev?: number;
};
/** Where the mine's parts are: the sphere centre and radius, the sinker box, the chain ends. */
export const mineGeometry = (p: MineProps) => {
  const R = p.d / 2;
  const tether = p.tether ?? (SIZE_M.mineTether / SIZE_M.mine) * p.d;
  const sinkW = 1.2 * R;
  const sinkH = 0.55 * R;
  const sway = p.sway ?? 0;
  const top = { x: p.x, y: p.y - sinkH };
  const L = tether + R;
  const centre = { x: top.x + L * Math.sin(sway), y: top.y - L * Math.cos(sway) };
  return { R, tether, sinkW, sinkH, top, centre, sway, bottom: { x: centre.x - R * Math.sin(sway), y: centre.y + R * Math.cos(sway) } };
};
export const NavalMine: React.FC<MineProps> = (p) => {
  const o = useOcean();
  const uid = uidOf(useId());
  const g = mineGeometry(p);
  const { R, centre: C } = g;
  const e = p.elev ?? 0.14;
  const lit = clamp01(p.lit ?? 0);
  const fog = fogAt(o.scene, o.distM) * (1 - 0.5 * lit);
  const n = p.horns ?? 6;
  const spin = p.spin ?? 0.94; // the ring's horns sit either side of the line of sight
  // 3-D: X right, Y up, Z toward the viewer; the view tilted down by e; sway rotates in the image plane
  const proj = (X: number, Y: number, Z: number) => {
    const Y1 = Y * Math.cos(e) - Z * Math.sin(e);
    const Z1 = Y * Math.sin(e) + Z * Math.cos(e);
    const sx = X;
    const sy = -Y1;
    const cs = Math.cos(g.sway);
    const sn = Math.sin(g.sway);
    return { x: C.x + R * (sx * cs - sy * sn), y: C.y + R * (sx * sn + sy * cs), z: Z1 };
  };
  const dirs: { X: number; Y: number; Z: number }[] = [{ X: 0, Y: 1, Z: 0 }];
  for (let i = 0; i < n - 1; i++) {
    const th = (52 * Math.PI) / 180;
    const ph = spin + (2 * Math.PI * i) / (n - 1);
    dirs.push({ X: Math.sin(th) * Math.cos(ph), Y: Math.cos(th), Z: Math.sin(th) * Math.sin(ph) });
  }
  const light = { x: -0.42, y: -0.9 };
  const horn = (dd: { X: number; Y: number; Z: number }, i: number) => {
    const b = proj(dd.X * 0.96, dd.Y * 0.96, dd.Z * 0.96);
    const t = proj(dd.X * 1.27, dd.Y * 1.27, dd.Z * 1.27);
    const ax = t.x - b.x;
    const ay = t.y - b.y;
    const len = Math.hypot(ax, ay);
    let pxv = len > 1e-3 ? -ay / len : 1;
    let pyv = len > 1e-3 ? ax / len : 0;
    if (pxv * light.x + pyv * light.y < 0) {
      pxv = -pxv;
      pyv = -pyv;
    }
    const hb = 0.105 * R;
    const ht = 0.072 * R;
    const pts = [
      { x: b.x + pxv * hb, y: b.y + pyv * hb },
      { x: t.x + pxv * ht, y: t.y + pyv * ht },
      { x: t.x - pxv * ht, y: t.y - pyv * ht },
      { x: b.x - pxv * hb, y: b.y - pyv * hb },
    ];
    const gid = `${uid}h${i}`;
    return (
      <g key={i}>
        <defs>
          <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1={b.x + pxv * hb} y1={b.y + pyv * hb} x2={b.x - pxv * hb} y2={b.y - pyv * hb}>
            <stop offset="0" stopColor={OCEAN.mineHi} />
            <stop offset="0.45" stopColor={OCEAN.mineMid} />
            <stop offset="1" stopColor={OCEAN.mineDeep} />
          </linearGradient>
        </defs>
        <path d={pathOf(pts)} fill={`url(#${gid})`} />
        {/* the horn's end: an ellipse foreshortened by how much it faces us, lit when it faces up */}
        <ellipse
          cx={t.x}
          cy={t.y}
          rx={ht}
          ry={Math.max(ht * 0.28, ht * Math.abs(t.z))}
          transform={`rotate(${f3((Math.atan2(pyv, pxv) * 180) / Math.PI)} ${f3(t.x)} ${f3(t.y)})`}
          fill={t.z > 0.3 ? OCEAN.mineMid : `url(#${gid})`}
        />
        <ellipse
          cx={t.x}
          cy={t.y}
          rx={ht * 0.55}
          ry={Math.max(ht * 0.15, ht * 0.55 * Math.abs(t.z))}
          transform={`rotate(${f3((Math.atan2(pyv, pxv) * 180) / Math.PI)} ${f3(t.x)} ${f3(t.y)})`}
          fill={OCEAN.mineHi}
          opacity={0.45}
        />
        <path d={`M${f3(b.x + pxv * hb * 1.15)} ${f3(b.y + pyv * hb * 1.15)}L${f3(b.x - pxv * hb * 1.15)} ${f3(b.y - pyv * hb * 1.15)}`} stroke={OCEAN.mineDeep} strokeWidth={f3(0.025 * R)} opacity={0.7} />
      </g>
    );
  };
  const hornsSorted = dirs.map((dd, i) => ({ dd, i, z: proj(dd.X, dd.Y, dd.Z).z })).sort((a, b) => a.z - b.z);
  const back = hornsSorted.filter((h) => h.z < -0.02);
  const frontH = hornsSorted.filter((h) => h.z >= -0.02);
  // flange: the equator's front half, a band with bolts
  const eq = (Yoff: number) =>
    Array.from({ length: 33 }, (_, i) => {
      const ph = Math.PI * (i / 32);
      return proj(-Math.cos(ph), Yoff, Math.sin(ph));
    });
  const bolts = Array.from({ length: 13 }, (_, i) => {
    const ph = Math.PI * ((i + 0.5) / 13);
    return proj(-Math.cos(ph) * 1.005, 0, Math.sin(ph) * 1.005);
  });
  // rust: blotches + streaks under the horns (deterministic)
  const rust = Array.from({ length: 9 }, (_, i) => {
    const ph = hash01(i + 3) * Math.PI;
    const th = 0.3 + hash01(i + 9) * 2.2;
    const q = proj(Math.sin(th) * -Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph));
    return { x: q.x, y: q.y, r: R * (0.06 + 0.1 * hash01(i + 17)), a: 0.25 + 0.25 * hash01(i + 23) };
  });
  const streaks = frontH
    .filter((h) => h.i > 0)
    .map((h) => {
      const b = proj(h.dd.X, h.dd.Y, h.dd.Z);
      return { x: b.x, y: b.y + R * 0.05, len: R * (0.35 + 0.3 * hash01(h.i + 40)), w: R * 0.05 };
    });
  // chain from the sphere's bottom to the sinker's top
  const c0 = g.bottom;
  const c1 = g.top;
  const clen = Math.hypot(c1.x - c0.x, c1.y - c0.y);
  const pitch = 0.17 * R;
  const nl = Math.max(1, Math.floor(clen / pitch));
  const cang = Math.atan2(c1.y - c0.y, c1.x - c0.x) - Math.PI / 2;
  const links = Array.from({ length: nl }, (_, i) => ({ x: lerp(c0.x, c1.x, (i + 0.5) / nl), y: lerp(c0.y, c1.y, (i + 0.5) / nl), flat: i % 2 === 0 }));
  const sw = g.sinkW;
  const sh = g.sinkH;
  const topD = 0.16 * R;
  const sx0 = p.x - sw / 2;
  const sy0 = p.y - sh;
  const sphere = `M${f3(C.x + R)} ${f3(C.y)}A${f3(R)} ${f3(R)} 0 1 1 ${f3(C.x - R)} ${f3(C.y)}A${f3(R)} ${f3(R)} 0 1 1 ${f3(C.x + R)} ${f3(C.y)}Z`;
  const lf = p.litFrom;
  const lu = lf ? (() => {
    const dx = lf.x - C.x;
    const dy = lf.y - C.y;
    const l = Math.hypot(dx, dy) || 1;
    return { x: dx / l, y: dy / l };
  })() : { x: -0.6, y: -0.8 };
  const body = (
    <g>
      <defs>
        <radialGradient id={`${uid}s`} cx="0.36" cy="0.27" r="0.86">
          <stop offset="0" stopColor={OCEAN.mineHi} />
          <stop offset="0.28" stopColor={OCEAN.mineMid} />
          <stop offset="0.68" stopColor={OCEAN.mineLo} />
          <stop offset="1" stopColor={OCEAN.mineDeep} />
        </radialGradient>
        <radialGradient id={`${uid}b`} cx="0.5" cy="1.05" r="0.6">
          <stop offset="0" stopColor="#7A6E5C" stopOpacity="0.45" />
          <stop offset="1" stopColor="#7A6E5C" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${uid}k`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5C5248" />
          <stop offset="0.25" stopColor="#463D34" />
          <stop offset="1" stopColor="#2E2620" />
        </linearGradient>
        <radialGradient id={`${uid}a`} gradientUnits="userSpaceOnUse" cx={C.x + lu.x * R * 0.85} cy={C.y + lu.y * R * 0.85} r={R * 1.0}>
          <stop offset="0" stopColor={OCEAN.amberTop} stopOpacity="0.5" />
          <stop offset="0.45" stopColor={OCEAN.amberFoot} stopOpacity="0.16" />
          <stop offset="1" stopColor={OCEAN.amberFoot} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${uid}r`} gradientUnits="userSpaceOnUse" cx={C.x + lu.x * R * 1.1} cy={C.y + lu.y * R * 1.1} r={R * 1.3}>
          <stop offset="0" stopColor={OCEAN.amberHot} stopOpacity="0.95" />
          <stop offset="0.5" stopColor={OCEAN.amberTop} stopOpacity="0.5" />
          <stop offset="1" stopColor={OCEAN.amberTop} stopOpacity="0" />
        </radialGradient>
        <clipPath id={`${uid}c`}>
          <path d={sphere} />
        </clipPath>
      </defs>
      {/* AO on the seabed under the sinker */}
      <ellipse cx={p.x} cy={p.y + 0.02 * R} rx={sw * 0.78} ry={0.13 * R} fill={OCEAN.shadow} opacity={0.55} style={{ filter: `blur(${f3(0.07 * R)}px)` }} />
      {/* the sinker: front face + top face, rust, weld line, shackle */}
      <path d={pathOf([{ x: sx0, y: sy0 }, { x: sx0 + sw, y: sy0 }, { x: sx0 + sw - 0.04 * R, y: p.y }, { x: sx0 + 0.04 * R, y: p.y }])} fill={`url(#${uid}k)`} />
      <path d={pathOf([{ x: sx0 + 0.07 * R, y: sy0 - topD }, { x: sx0 + sw - 0.07 * R, y: sy0 - topD }, { x: sx0 + sw, y: sy0 }, { x: sx0, y: sy0 }])} fill="#6A6155" />
      <path d={`M${f3(sx0)} ${f3(sy0)}H${f3(sx0 + sw)}`} stroke={OCEAN.cream} strokeOpacity={0.35} strokeWidth={f3(0.012 * R)} />
      <path d={`M${f3(sx0 + 0.02 * R)} ${f3(sy0 + sh * 0.42)}H${f3(sx0 + sw - 0.02 * R)}`} stroke={OCEAN.mineDeep} strokeOpacity={0.55} strokeWidth={f3(0.018 * R)} />
      {[0.12, 0.58, 0.8].map((u, i) => (
        <ellipse key={i} cx={sx0 + sw * u} cy={sy0 + sh * (0.3 + 0.3 * hash01(i + 71))} rx={R * (0.08 + 0.1 * hash01(i + 70))} ry={sh * (0.22 + 0.2 * hash01(i + 72))} fill={OCEAN.rust} opacity={0.4} style={{ filter: `blur(${f3(0.05 * R)}px)` }} />
      ))}
      <path
        d={`M${f3(p.x - 0.07 * R)} ${f3(sy0 - topD * 0.5)}C${f3(p.x - 0.07 * R)} ${f3(sy0 - topD * 0.5 - 0.16 * R)} ${f3(p.x + 0.07 * R)} ${f3(sy0 - topD * 0.5 - 0.16 * R)} ${f3(p.x + 0.07 * R)} ${f3(sy0 - topD * 0.5)}`}
        fill="none"
        stroke={OCEAN.mineLo}
        strokeWidth={f3(0.035 * R)}
      />
      {/* the chain */}
      <g transform={`rotate(${f3((cang * 180) / Math.PI)} ${f3(c0.x)} ${f3(c0.y)})`}>
        {links.map((l, i) => {
          const lp = { x: c0.x, y: c0.y + Math.hypot(l.x - c0.x, l.y - c0.y) };
          return l.flat ? (
            <g key={i}>
              <ellipse cx={lp.x} cy={lp.y} rx={0.055 * R} ry={0.1 * R} fill="none" stroke="#43372C" strokeWidth={f3(0.034 * R)} />
              <ellipse cx={lp.x - 0.008 * R} cy={lp.y - 0.01 * R} rx={0.055 * R} ry={0.1 * R} fill="none" stroke="#8A7560" strokeOpacity={0.55} strokeWidth={f3(0.012 * R)} strokeDasharray={`${f3(0.12 * R)} ${f3(0.5 * R)}`} />
            </g>
          ) : (
            <rect key={i} x={lp.x - 0.019 * R} y={lp.y - 0.11 * R} width={0.038 * R} height={0.22 * R} rx={0.019 * R} fill="#4B3D31" />
          );
        })}
      </g>
      {/* horns behind the sphere */}
      {back.map((h) => horn(h.dd, h.i))}
      {/* the sphere */}
      <path d={sphere} fill={`url(#${uid}s)`} />
      <g clipPath={`url(#${uid}c)`}>
        <path d={sphere} fill={`url(#${uid}b)`} />
        {rust.map((r, i) => (
          <ellipse key={i} cx={r.x} cy={r.y} rx={r.r} ry={r.r * 0.7} fill={OCEAN.rust} opacity={r.a} style={{ filter: `blur(${f3(r.r * 0.45)}px)` }} />
        ))}
        {streaks.map((s, i) => (
          <rect key={i} x={s.x - s.w / 2} y={s.y} width={s.w} height={s.len} fill={OCEAN.rust} opacity={0.32} style={{ filter: `blur(${f3(s.w * 0.4)}px)` }} />
        ))}
        {/* the flange band: a lit upper lip, the band, a dark lower line, bolts */}
        <path d={smoothOpen(eq(0.03))} fill="none" stroke={OCEAN.mineHi} strokeOpacity={0.55} strokeWidth={f3(0.018 * R)} />
        <path d={smoothOpen(eq(0))} fill="none" stroke="#5E574D" strokeWidth={f3(0.05 * R)} />
        <path d={smoothOpen(eq(-0.03))} fill="none" stroke={OCEAN.mineDeep} strokeOpacity={0.85} strokeWidth={f3(0.016 * R)} />
        {bolts.map((b, i) => (
          <circle key={i} cx={b.x} cy={b.y} r={0.014 * R} fill="#8E8678" opacity={b.z > 0.15 ? 0.8 : 0} />
        ))}
        {/* cream rim from the surface above */}
        <path d={sphere} fill="none" stroke={OCEAN.cream} strokeOpacity={0.5} strokeWidth={f3(0.05 * R)} transform={`translate(0 ${f3(0.03 * R)})`} style={{ filter: `blur(${f3(0.02 * R)}px)` }} clipPath={`url(#${uid}c)`} />
      </g>
      {frontH.map((h) => horn(h.dd, h.i))}
    </g>
  );
  return (
    <g>
      <InFog amount={fog}>{body}</InFog>
      {lit > 0.003 ? (
        <g style={{ mixBlendMode: "screen" }} opacity={f3(lit)}>
          <path d={sphere} fill={`url(#${uid}a)`} />
          <g clipPath={`url(#${uid}c)`}>
            <path d={sphere} fill="none" stroke={`url(#${uid}r)`} strokeWidth={f3(0.09 * R)} style={{ filter: `blur(${f3(0.02 * R)}px)` }} />
          </g>
        </g>
      ) : null}
    </g>
  );
};

// ===========================================================================
// FLOATING PLATFORM — a semi-submersible wind foundation, three columns, pontoons, mooring lines
// ===========================================================================
/** The platform's 3-D layout (metres, relative to its centroid at the surface): x lateral,
 *  z depth (+ toward the eye), y down. Used by FloatingPlatform and to hang the cable. */
export const PLATFORM = {
  columns: [
    { x: -36, z: 20, d: 11, turbine: false },
    { x: 36, z: 20, d: 11, turbine: true },
    { x: 0, z: -40, d: 11, turbine: false },
  ],
  draft: 20, // column bottoms below the surface (m)
  pontoon: 5, // pontoon height (m), along the column bottoms
  heavePlate: 1.0, // heave plate thickness (m)
  heavePlateD: 16, // heave plate diameter (m)
  brace: 1.8, // upper brace diameter (m), just under the surface
  braceDepth: 4, // m below the surface
  freeboard: 12, // column height above the surface (m)
} as const;
/** A point of the platform (metres, relative to its centroid) as a world point + depth z. */
export const platformPoint = (o: OceanView, at: P2, xm: number, ym: number, zm: number) => ({
  x: at.x + xm * o.scene.pxPerM,
  y: at.y + ym * o.scene.pxPerM,
  z: zm * o.scene.pxPerM,
});
/** Where the export cable hangs off (world point + z): under the turbine column's heave plate. */
export const cableHangOff = (o: OceanView, at: P2) => {
  const c = PLATFORM.columns[1];
  return platformPoint(o, at, c.x - c.d * 0.2, PLATFORM.draft + PLATFORM.heavePlate, c.z);
};
/**
 * FloatingPlatform — seen from below the surface: three steel columns breaking the surface (the
 * turbine column's tower faint above the waterline, through the surface), heave plates and
 * pontoons at their feet, upper braces, three catenary mooring lines down into the fog. `at` =
 * the centroid on the surface (world, z = 0 line). Draw it at the stage root (it places its own
 * parts in depth). `heave` 0..1 a slow bob (metres: 0.4).
 */
export const FloatingPlatform: React.FC<{ at: P2; frame?: number; heave?: number }> = ({ at, frame = 0, heave = 1 }) => {
  const o = useOcean();
  const uid = uidOf(useId());
  const M = o.scene.pxPerM;
  const bob = heave * 0.4 * Math.sin(frame / 41);
  const pl = (xm: number, ym: number, zm: number) => platformPoint(o, at, xm, ym + bob, zm);
  const scr = (q: { x: number; y: number; z: number }) => project(o, q.x, q.y, q.z);
  const cols = PLATFORM.columns;
  const drawColumn = (ci: number) => {
    const c = cols[ci];
    const top = scr(pl(c.x, -PLATFORM.freeboard * 0.0, c.z));
    const bot = scr(pl(c.x, PLATFORM.draft, c.z));
    const rx = (c.d / 2) * M * top.a;
    // the surface line at this column's depth: the ceiling meets it there (columns end there)
    const surfY = top.y;
    const id = `${uid}c${ci}`;
    const plateR = (PLATFORM.heavePlateD / 2) * M * bot.a;
    const plateT = PLATFORM.heavePlate * M * bot.a;
    // looking up at the plate: its underside shows as a flat ellipse
    const eyeDy = Math.max(0.05, (o.eye.y - (at.y + PLATFORM.draft * M)) / (depthDistM(o, c.z * M) * M));
    const under = Math.min(0.32, eyeDy);
    const fog = fogAt(o.scene, depthDistM(o, c.z * M));
    return (
      <InFog key={ci} amount={fog}>
        <g transform={`matrix(${fx(1 / o.a)} 0 0 ${fx(1 / o.a)} ${fx(-o.bx / o.a)} ${fx(-o.by / o.a)})`}>
          <defs>
            <linearGradient id={`${id}x`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#77756A" />
              <stop offset="0.2" stopColor={OCEAN.steelHi} />
              <stop offset="0.32" stopColor="#E0DCCB" />
              <stop offset="0.55" stopColor={OCEAN.steelMid} />
              <stop offset="0.85" stopColor={OCEAN.steelLo} />
              <stop offset="1" stopColor="#3E3D36" />
            </linearGradient>
            <linearGradient id={`${id}y`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#000" stopOpacity="0" />
              <stop offset="0.55" stopColor={OCEAN.fouling} stopOpacity="0.25" />
              <stop offset="1" stopColor={OCEAN.fouling} stopOpacity="0.7" />
            </linearGradient>
            <linearGradient id={`${id}p`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={OCEAN.steelHi} />
              <stop offset="0.35" stopColor={OCEAN.steelMid} />
              <stop offset="1" stopColor={OCEAN.steelLo} />
            </linearGradient>
          </defs>
          {/* the column, from the surface down */}
          <rect x={top.x - rx} y={surfY} width={rx * 2} height={bot.y - surfY} fill={`url(#${id}x)`} />
          <rect x={top.x - rx} y={surfY} width={rx * 2} height={bot.y - surfY} fill={`url(#${id}y)`} />
          {/* where it pierces the surface: the surface's bright meniscus round the column */}
          <ellipse cx={top.x} cy={surfY} rx={rx * 1.5} ry={Math.max(3, rx * 0.16)} fill={OCEAN.sky} opacity={0.55} style={{ filter: `blur(${f3(Math.max(2, rx * 0.12))}px)` }} />
          {/* the heave plate: a thin wide disc seen from a little below */}
          <ellipse cx={bot.x} cy={bot.y + plateT} rx={plateR} ry={plateR * under} fill={OCEAN.steelLo} />
          <rect x={bot.x - plateR} y={bot.y} width={plateR * 2} height={plateT} fill={`url(#${id}p)`} />
          <ellipse cx={bot.x} cy={bot.y} rx={plateR} ry={plateR * under * 0.35} fill={OCEAN.steelHi} opacity={0.55} />
          {/* an AO line where the column meets the plate */}
          <ellipse cx={bot.x} cy={bot.y} rx={rx * 1.05} ry={rx * under * 0.5} fill={OCEAN.shadow} opacity={0.35} style={{ filter: `blur(${f3(rx * 0.08)}px)` }} />
        </g>
      </InFog>
    );
  };
  // pontoons between column feet and braces near the surface, as projected bars
  const bar = (a: number, b: number, ym: number, hm: number, key: string, kind: "pontoon" | "brace") => {
    const A = cols[a];
    const B = cols[b];
    const N = 14;
    const ptsT: P2[] = [];
    const ptsB: P2[] = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      const xm = lerp(A.x, B.x, u);
      const zm = lerp(A.z, B.z, u);
      const t = scr(pl(xm, ym - hm / 2, zm));
      const bt = scr(pl(xm, ym + hm / 2, zm));
      ptsT.push({ x: t.x, y: t.y });
      ptsB.push({ x: bt.x, y: bt.y });
    }
    const d = pathOf([...ptsT, ...ptsB.reverse()]);
    const zmid = ((A.z + B.z) / 2) * M;
    const fog = fogAt(o.scene, depthDistM(o, zmid));
    const id = `${uid}${key}`;
    const yTop = Math.min(...ptsT.map((p) => p.y));
    const yBot = Math.max(...ptsB.map((p) => p.y));
    return (
      <InFog key={key} amount={fog}>
        <g transform={`matrix(${fx(1 / o.a)} 0 0 ${fx(1 / o.a)} ${fx(-o.bx / o.a)} ${fx(-o.by / o.a)})`}>
          <defs>
            <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="0" y1={yTop} x2="0" y2={yBot}>
              <stop offset="0" stopColor={OCEAN.steelMid} />
              <stop offset="0.18" stopColor={kind === "pontoon" ? "#E0DCCB" : OCEAN.steelHi} />
              <stop offset="0.45" stopColor={OCEAN.steelMid} />
              <stop offset="0.85" stopColor={OCEAN.steelLo} />
              <stop offset="1" stopColor="#3E3D36" />
            </linearGradient>
          </defs>
          <path d={d} fill={`url(#${id})`} />
        </g>
      </InFog>
    );
  };
  // mooring lines: catenaries from each column's foot outward and down into the fog
  const moorings = cols.map((c, ci) => {
    const outX = c.x === 0 ? 0 : Math.sign(c.x);
    const outZ = c.z > 0 ? -0.3 : -1; // outward and away (never toward the eye)
    const len = Math.hypot(outX, outZ) || 1;
    const ux = outX / len;
    const uz = outZ / len;
    const N = 40;
    const pts: { x: number; y: number; s: number; fog: number }[] = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      const r = u * 420; // metres outward
      const yy = PLATFORM.draft + 2 + (o.scene.seabedY !== undefined ? (o.scene.seabedY / M - PLATFORM.draft) : 60) * Math.pow(u, 1.6) * 1.05;
      const q = pl(c.x + ux * (c.d / 2 + r), yy, c.z + uz * r);
      const s = scr(q);
      pts.push({ x: s.x, y: s.y, s: s.a / o.root.a, fog: fogAt(o.scene, depthDistM(o, q.z)) });
    }
    return (
      <g key={`m${ci}`} transform={`matrix(${fx(1 / o.a)} 0 0 ${fx(1 / o.a)} ${fx(-o.bx / o.a)} ${fx(-o.by / o.a)})`}>
        {pts.slice(0, -1).map((p, i) => {
          const q = pts[i + 1];
          const w = Math.max(1.3, 3.2 * p.s);
          return <line key={i} x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke={fogHex(o, "#4C4A42", p.fog, p.y)} strokeWidth={w} strokeLinecap="round" />;
        })}
      </g>
    );
  });
  // the tower: faint, above the surface (seen through it), over the turbine column
  const tc = cols[1];
  const tb = scr(pl(tc.x, 0, tc.z));
  const towerW = 6 * M * tb.a;
  return (
    <g>
      {moorings[2]}
      {drawColumn(2)}
      {bar(0, 2, PLATFORM.draft - PLATFORM.pontoon / 2, PLATFORM.pontoon, "p02", "pontoon")}
      {bar(1, 2, PLATFORM.draft - PLATFORM.pontoon / 2, PLATFORM.pontoon, "p12", "pontoon")}
      {bar(0, 2, PLATFORM.braceDepth, PLATFORM.brace, "b02", "brace")}
      {bar(1, 2, PLATFORM.braceDepth, PLATFORM.brace, "b12", "brace")}
      {moorings[0]}
      {moorings[1]}
      {bar(0, 1, PLATFORM.draft - PLATFORM.pontoon / 2, PLATFORM.pontoon, "p01", "pontoon")}
      {bar(0, 1, PLATFORM.braceDepth, PLATFORM.brace, "b01", "brace")}
      {drawColumn(0)}
      {drawColumn(1)}
      <g transform={`matrix(${fx(1 / o.a)} 0 0 ${fx(1 / o.a)} ${fx(-o.bx / o.a)} ${fx(-o.by / o.a)})`} opacity={0.16} style={{ mixBlendMode: "multiply", filter: `blur(${f3(towerW * 0.25)}px)` }}>
        <path d={pathOf([{ x: tb.x - towerW / 2, y: tb.y }, { x: tb.x - towerW * 0.3, y: tb.y - 900 }, { x: tb.x + towerW * 0.3, y: tb.y - 900 }, { x: tb.x + towerW / 2, y: tb.y }])} fill={OCEAN.steelLo} />
      </g>
    </g>
  );
};

// ===========================================================================
// DYNAMIC CABLE — the lazy-wave export cable, its path API and its drawing
// ===========================================================================
export type CableSpec = {
  /** hang-off point (world, on the cable's plane) */
  hang: P2;
  /** the cable's depth plane (world px, + nearer) */
  z?: number;
  /** seabed y (world) */
  seabedY: number;
  /** horizontal distance from the hang-off to the touchdown (world px); sign = direction */
  span: number;
  /** how far the sag bend drops below the hang-off (world px) */
  sag: number;
  /** how far the hog bend (the buoyant arch) rises above the sag bend (world px) */
  hump: number;
  /** length of cable lying on the seabed past the touchdown (world px) */
  tail?: number;
  /** real diameters (m) */
  diaM?: number;
  collarM?: number;
  /** number of buoyancy modules */
  collars?: number;
};
export type CablePoint = { x: number; y: number; z: number; tx: number; ty: number; nx: number; ny: number };
export type Cable = {
  spec: CableSpec;
  z: number;
  /** dense polyline (world, on the cable's plane) and the arc length table */
  pts: P2[];
  cum: number[];
  length: number;
  /** s 0..1 (arc length) -> point, unit tangent (toward s+), unit normal pointing UP (toward the light) */
  at: (s: number) => CablePoint;
  /** arc-length fraction of the named bends */
  sSag: number;
  sHog: number;
  sTouch: number;
  /** the buoyancy section [s0, s1] and each module's centre s */
  buoy: [number, number];
  collarS: number[];
};
/** makeCable — the lazy-wave profile through hang-off -> sag bend -> hog bend -> touchdown -> seabed. */
export const makeCable = (spec: CableSpec): Cable => {
  const { hang, seabedY, span, sag, hump } = spec;
  const tail = spec.tail ?? Math.abs(span) * 0.6;
  const dir = Math.sign(span) || 1;
  const sp = Math.abs(span);
  const sagP = { x: hang.x + dir * sp * 0.3, y: hang.y + sag };
  const hogP = { x: hang.x + dir * sp * 0.52, y: hang.y + sag - hump };
  const touch = { x: hang.x + dir * sp * 0.88, y: seabedY };
  const ctrl: P2[] = [
    hang,
    { x: hang.x + dir * sp * 0.05, y: hang.y + sag * 0.42 },
    { x: hang.x + dir * sp * 0.15, y: hang.y + sag * 0.85 },
    sagP,
    { x: hang.x + dir * sp * 0.41, y: hang.y + sag - hump * 0.72 },
    hogP,
    { x: hang.x + dir * sp * 0.64, y: hang.y + sag - hump * 0.82 },
    { x: hang.x + dir * sp * 0.76, y: lerp(hang.y + sag - hump, seabedY, 0.55) },
    touch,
    { x: touch.x + dir * tail * 0.5, y: seabedY },
    { x: touch.x + dir * tail, y: seabedY },
  ];
  // Catmull-Rom (centripetal-ish, uniform here) sampling
  const pts: P2[] = [];
  const ctrlIdx: number[] = [];
  const per = 60;
  for (let i = 0; i < ctrl.length - 1; i++) {
    const p0 = ctrl[Math.max(0, i - 1)];
    const p1 = ctrl[i];
    const p2 = ctrl[i + 1];
    const p3 = ctrl[Math.min(ctrl.length - 1, i + 2)];
    ctrlIdx.push(pts.length);
    for (let j = 0; j < per; j++) {
      const t = j / per;
      const t2 = t * t;
      const t3 = t2 * t;
      const x = 0.5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);
      const y = 0.5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);
      pts.push({ x, y: Math.min(y, seabedY) });
    }
  }
  ctrlIdx.push(pts.length);
  pts.push(ctrl[ctrl.length - 1]);
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  const length = cum[cum.length - 1];
  const sOfIdx = (i: number) => cum[Math.min(cum.length - 1, i)] / length;
  const at = (s: number): CablePoint => {
    const L = clamp01(s) * length;
    let lo = 0;
    let hi = cum.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (cum[mid] <= L) lo = mid;
      else hi = mid;
    }
    const seg = cum[hi] - cum[lo] || 1;
    const t = (L - cum[lo]) / seg;
    const a = pts[lo];
    const b = pts[hi];
    // tangent from a wider stencil (smooth)
    const i0 = Math.max(0, lo - 2);
    const i1 = Math.min(pts.length - 1, hi + 2);
    let tx = pts[i1].x - pts[i0].x;
    let ty = pts[i1].y - pts[i0].y;
    const tl = Math.hypot(tx, ty) || 1;
    tx /= tl;
    ty /= tl;
    let nx = ty;
    let ny = -tx;
    if (ny > 0) {
      nx = -nx;
      ny = -ny;
    }
    return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), z: spec.z ?? 0, tx, ty, nx, ny };
  };
  const sSag = sOfIdx(ctrlIdx[3]);
  const sHog = sOfIdx(ctrlIdx[5]);
  const sTouch = sOfIdx(ctrlIdx[8]);
  const b0 = sSag + (sHog - sSag) * 0.35;
  const b1 = sHog + (sTouch - sHog) * 0.38;
  const nC = spec.collars ?? 9;
  const collarS = Array.from({ length: nC }, (_, i) => lerp(b0, b1, nC === 1 ? 0.5 : i / (nC - 1)));
  return { spec, z: spec.z ?? 0, pts, cum, length, at, sSag, sHog, sTouch, buoy: [b0, b1], collarS };
};
/** The drawn widths (local px) of the cable and its modules: real size, raised to a screen minimum. */
export const cableWidths = (o: OceanCtxV, c: Cable) => {
  const M = o.scene.pxPerM;
  const w = Math.max((c.spec.diaM ?? SIZE_M.cable) * M, 9 / o.a);
  const cw = Math.max((c.spec.collarM ?? SIZE_M.collar) * M, 24 / o.a);
  return { w, collar: cw };
};
/**
 * DynamicCable — the cable as a shaded tube with helical armour, the buoyancy modules on its
 * hump. Wrap it in <DepthGroup z={cable.z}>. `upTo` 0..1 draws only the first part (s <= upTo);
 * `deepFog` adds fog toward the seabed (the cable running into the deep).
 */
export const DynamicCable: React.FC<{ cable: Cable; upTo?: number; deepFog?: number; lit?: number }> = ({ cable, upTo = 1, deepFog = 0.35, lit = 0 }) => {
  const o = useOcean();
  const uid = uidOf(useId());
  const { w, collar } = cableWidths(o, cable);
  const N = Math.max(60, Math.round((cable.length * o.a) / 6));
  const sMax = clamp01(upTo);
  const samp = Array.from({ length: N + 1 }, (_, i) => cable.at((i / N) * sMax));
  const off = (k: number) => samp.map((p) => ({ x: p.x + p.nx * k * w, y: p.y + p.ny * k * w }));
  const line = (pts: P2[]) => `M${pts.map((p) => `${f3(p.x)} ${f3(p.y)}`).join("L")}`;
  // armour: short diagonal ticks along the cable
  const pitch = w * 0.85;
  const nt = Math.floor((cable.length * sMax) / pitch);
  const ticks: string[] = [];
  for (let i = 0; i < nt; i++) {
    const p = cable.at((i * pitch) / cable.length);
    const a = { x: p.x + p.nx * 0.42 * w - p.tx * 0.22 * w, y: p.y + p.ny * 0.42 * w - p.ty * 0.22 * w };
    const b = { x: p.x - p.nx * 0.42 * w + p.tx * 0.22 * w, y: p.y - p.ny * 0.42 * w + p.ty * 0.22 * w };
    ticks.push(`M${f3(a.x)} ${f3(a.y)}L${f3(b.x)} ${f3(b.y)}`);
  }
  const base = fogAt(o.scene, o.distM) * (1 - 0.75 * clamp01(lit));
  const y0 = cable.spec.hang.y;
  const y1 = cable.spec.seabedY;
  const amount = (y: number) => clamp01(base + (1 - base) * deepFog * smoothstep((y - y0) / Math.max(1, y1 - y0)));
  const collars = cable.collarS.filter((s) => s <= sMax).map((s, i) => {
    const p = cable.at(s);
    const ang = (Math.atan2(p.ty, p.tx) * 180) / Math.PI;
    const L = collar * 1.05;
    const D = collar;
    const gid = `${uid}m${i}`;
    // the module's "up" in its own frame: the normal (pointing up) rotated back by -ang
    return (
      <g key={i} transform={`translate(${fx(p.x)} ${fx(p.y)}) rotate(${fx(ang)})`}>
        <defs>
          <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1="0" y1={f3(p.tx >= 0 ? -D / 2 : D / 2)} x2="0" y2={f3(p.tx >= 0 ? D / 2 : -D / 2)}>
            <stop offset="0" stopColor={OCEAN.buoyMid} />
            <stop offset="0.16" stopColor={OCEAN.buoyHi} />
            <stop offset="0.45" stopColor={OCEAN.buoyMid} />
            <stop offset="0.9" stopColor={OCEAN.buoyLo} />
            <stop offset="1" stopColor="#3E3B34" />
          </linearGradient>
        </defs>
        <rect x={-L / 2} y={-D / 2} width={L} height={D} rx={D * 0.12} fill={`url(#${gid})`} />
        {/* the end faces in shadow, the clamp straps, a lit band along the top */}
        <rect x={-L / 2} y={-D / 2} width={L * 0.07} height={D} rx={D * 0.06} fill={OCEAN.buoyLo} opacity={0.45} />
        <rect x={L / 2 - L * 0.07} y={-D / 2} width={L * 0.07} height={D} rx={D * 0.06} fill={OCEAN.buoyLo} opacity={0.45} />
        <rect x={-L * 0.22 - D * 0.035} y={-D / 2} width={D * 0.07} height={D} fill={OCEAN.buoyLo} opacity={0.7} />
        <rect x={L * 0.22 - D * 0.035} y={-D / 2} width={D * 0.07} height={D} fill={OCEAN.buoyLo} opacity={0.7} />
        <rect x={-L / 2 + D * 0.1} y={p.tx >= 0 ? -D / 2 + D * 0.08 : D / 2 - D * 0.08 - D * 0.1} width={L - D * 0.2} height={D * 0.1} rx={D * 0.05} fill={OCEAN.cream} opacity={0.5} />
      </g>
    );
  });
  return (
    <InFog amount={amount}>
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d={line(samp)} stroke={OCEAN.cableLo} strokeWidth={f3(w)} />
        <path d={line(off(0.13))} stroke={OCEAN.cableMid} strokeWidth={f3(w * 0.62)} />
        <path d={ticks.join("")} stroke={OCEAN.cableLo} strokeOpacity={0.5} strokeWidth={f3(w * 0.09)} strokeLinecap="butt" />
        <path d={line(off(0.27))} stroke={OCEAN.cableHi} strokeOpacity={0.55} strokeWidth={f3(w * 0.16)} />
      </g>
      {collars}
    </InFog>
  );
};

// ===========================================================================
// GHOST GEAR — abandoned monofilament + a torn net fragment with floats
// ===========================================================================
export type GhostLineProps = {
  /** where the gear is caught (local world coords): usually cable.at(s) */
  anchor: P2;
  /** the cable's tangent at the anchor (unit) and its drawn width (local px), for the wrap */
  tangent?: P2;
  cableW?: number;
  /** 0..1: how far the line has wound round the cable (0 = drifting free past it) */
  wrap?: number;
  /** drift of the free end (local px per frame at the end of the line) */
  current?: P2;
  frame?: number;
  seed?: number;
  /** length of the main strand (local px) */
  length?: number;
  strands?: number;
  /** net fragment at the end of the main strand */
  net?: { w: number; h: number } | null;
  /** where along the main strand the net hangs (0..1, default 1 = its end) */
  netAt?: number;
  /** tie the main strand's end to a point (an entangled animal), tension 0..1 */
  to?: P2 | null;
  tie?: number;
  /** how far upstream of the anchor the line still is while wrap < 1 (local px; 0 = already there) */
  approach?: number;
  /** "back": only the coil halves behind the cable; "front": everything else; "all" */
  layer?: "back" | "front" | "all";
};
/** The main strand's points (local), so a builder can attach things to its end. */
export const ghostStrand = (p: GhostLineProps, idx = 0): P2[] => {
  const len = p.length ?? 600;
  const N = 36;
  const seed = (p.seed ?? 1) + idx * 17.3;
  const cur = p.current ?? { x: 1, y: 0.35 };
  const cl = Math.hypot(cur.x, cur.y) || 1;
  const dir = { x: cur.x / cl, y: cur.y / cl };
  const perp = { x: -dir.y, y: dir.x };
  const t = p.frame ?? 0;
  const wrap = clamp01(p.wrap ?? 1);
  // before the snag the anchor is upstream: the line drifts toward the cable
  const ap = (p.approach ?? 0) * (1 - wrap);
  const start = { x: p.anchor.x - dir.x * ap, y: p.anchor.y - dir.y * ap };
  const lenI = len * (idx === 0 ? 1 : 0.45 + 0.3 * hash01(seed));
  const pts: P2[] = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const wav = Math.sin(u * 7.5 + t * 0.06 + seed) * 0.06 + Math.sin(u * 3.1 - t * 0.035 + seed * 2.1) * 0.08 + (hash01(seed + 3) - 0.5) * 0.4 * u;
    const sag = u * u * 0.25;
    pts.push({
      x: start.x + dir.x * lenI * u + perp.x * lenI * wav * u + 0,
      y: start.y + dir.y * lenI * u + perp.y * lenI * wav * u + lenI * sag * 0.3,
    });
  }
  if (p.to && (p.tie ?? 0) > 0 && idx === 0) {
    const tie = clamp01(p.tie ?? 0);
    const a = pts[0];
    const b = p.to;
    const L = Math.hypot(b.x - a.x, b.y - a.y);
    return pts.map((q, i) => {
      const u = i / N;
      const bx = lerp(a.x, b.x, u);
      const by = lerp(a.y, b.y, u) + Math.sin(Math.PI * u) * L * 0.12 + Math.sin(u * 9 + t * 0.08) * L * 0.012;
      return { x: lerp(q.x, bx, tie), y: lerp(q.y, by, tie) };
    });
  }
  return pts;
};
export const GhostLine: React.FC<GhostLineProps> = (p) => {
  const o = useOcean();
  const uid = uidOf(useId());
  const layer = p.layer ?? "all";
  const wrap = clamp01(p.wrap ?? 1);
  const tan = p.tangent ?? { x: 1, y: 0 };
  const nrm = { x: tan.y, y: -tan.x };
  const cw = p.cableW ?? 20;
  const px = 1 / o.a;
  const t = p.frame ?? 0;
  const fog = fogAt(o.scene, o.distM);
  const mono = STROKE_PX.mono * px;
  // the coils: turns round the cable centred on the anchor; a turn shows once wrap passes it
  const turns = 4;
  const coilBack: string[] = [];
  const coilFront: string[] = [];
  for (let i = 0; i < turns; i++) {
    const show = clamp01(wrap * turns - i);
    if (show <= 0) continue;
    const off = (i - (turns - 1) / 2) * cw * 0.42;
    const c = { x: p.anchor.x + tan.x * off, y: p.anchor.y + tan.y * off };
    const r = cw * 0.62;
    const lean = cw * 0.22;
    // an ellipse round the cable's section: front half goes one way, back half the other
    const top = { x: c.x + nrm.x * r - tan.x * lean, y: c.y + nrm.y * r - tan.y * lean };
    const bot = { x: c.x - nrm.x * r + tan.x * lean, y: c.y - nrm.y * r + tan.y * lean };
    const ctrlF = { x: c.x + tan.x * cw * 0.45, y: c.y + tan.y * cw * 0.45 };
    const ctrlB = { x: c.x - tan.x * cw * 0.45, y: c.y - tan.y * cw * 0.45 };
    const endF = { x: lerp(top.x, bot.x, show), y: lerp(top.y, bot.y, show) };
    coilFront.push(`M${f3(top.x)} ${f3(top.y)}Q${f3(ctrlF.x)} ${f3(ctrlF.y)} ${f3(endF.x)} ${f3(endF.y)}`);
    if (show > 0.5) coilBack.push(`M${f3(bot.x)} ${f3(bot.y)}Q${f3(ctrlB.x)} ${f3(ctrlB.y)} ${f3(top.x)} ${f3(top.y)}`);
  }
  const strands = Array.from({ length: p.strands ?? 3 }, (_, i) => ghostStrand(p, i));
  const main = strands[0];
  const net = p.net === undefined ? { w: 260, h: 200 } : p.net;
  // the net: a torn fragment of diamond mesh hanging from the main strand (at netAt along it),
  // its head rope along the line, its body sagging under its weight and billowing in the current
  const netEls: React.ReactNode[] = [];
  if (net && layer !== "back") {
    const at = clamp01(p.netAt ?? 1);
    const idx = Math.round(at * (main.length - 1));
    const hook = main[idx];
    const pa = main[Math.max(0, idx - 4)];
    const pb = main[Math.min(main.length - 1, idx + 4)];
    let ang = Math.atan2(pb.y - pa.y, pb.x - pa.x);
    if (Math.cos(ang) < 0) ang += Math.PI;
    const ax = { x: Math.cos(ang), y: Math.sin(ang) };
    const cols = 9;
    const rows = 9;
    const seed = (p.seed ?? 1) * 13.7;
    const cur = p.current ?? { x: 1, y: 0.35 };
    const node = (i: number, j: number): P2 => {
      const u = (i + (j % 2) * 0.5) / cols - 0.5;
      const vv = j / rows;
      const pinch = 1 - 0.42 * vv;
      const jit = (hash01(seed + i * 3.1 + j * 7.7) - 0.5) * 0.22;
      const billow = Math.sin(u * 4.2 + t * 0.05 + vv * 1.7) * 0.07 + Math.sin(u * 9 - t * 0.03) * 0.025;
      const lx = (u + jit / cols) * net.w * pinch + cur.x * vv * vv * net.w * 0.18 + Math.sin(vv * 2.4 + t * 0.04) * net.w * 0.035;
      const ly = vv * net.h * (0.9 + 0.2 * Math.cos(u * 3.14)) + billow * net.h + jit * net.h * 0.06;
      return { x: hook.x + ax.x * lx + 0 * ly, y: hook.y + ax.y * lx + ly };
    };
    // a ragged lower edge: each column ends at its own row
    const lastRow = (i: number) => rows - 1 - Math.floor(hash01(seed + i * 5.3) * 3.2) - (Math.abs(i - cols / 2) > cols * 0.38 ? 2 : 0);
    const segs: string[] = [];
    for (let j = 0; j < rows - 1; j++) {
      for (let i = 0; i <= cols; i++) {
        if (j >= lastRow(i)) continue;
        const a = node(i, j);
        const nb = j % 2 === 0 ? [i - 1, i] : [i, i + 1];
        nb.forEach((ii, q) => {
          if (ii < 0 || ii > cols || j + 1 > lastRow(ii)) return;
          const torn = hash01(seed + i * 11.3 + j * 3.7 + q * 1.9) < 0.07 + 0.2 * (j / rows) * (j / rows);
          if (torn) return;
          const b = node(ii, j + 1);
          segs.push(`M${f3(a.x)} ${f3(a.y)}L${f3(b.x)} ${f3(b.y)}`);
        });
      }
    }
    const tw = STROKE_PX.twine * px;
    netEls.push(<path key="net" d={segs.join("")} fill="none" stroke={OCEAN.twine} strokeWidth={f3(Math.max(tw, net.w * 0.006))} strokeLinecap="round" opacity={0.9} />);
    netEls.push(
      <path
        key="rope"
        d={smoothOpen(Array.from({ length: cols + 1 }, (_, i) => node(i, 0)))}
        fill="none"
        stroke={OCEAN.twine}
        strokeWidth={f3(Math.max(tw * 2.4, net.w * 0.016))}
        strokeLinecap="round"
      />,
    );
    [1, cols - 1].forEach((i, n) => {
      const q = node(i, 0);
      const fr = Math.max(net.w * 0.05, 6 * px);
      netEls.push(
        <g key={`f${n}`}>
          <defs>
            <radialGradient id={`${uid}f${n}`} cx="0.38" cy="0.3" r="0.8">
              <stop offset="0" stopColor={OCEAN.cream} />
              <stop offset="0.45" stopColor={OCEAN.float} />
              <stop offset="1" stopColor="#6B6252" />
            </radialGradient>
          </defs>
          <ellipse cx={q.x} cy={q.y - fr * 0.45} rx={fr * 1.3} ry={fr} fill={`url(#${uid}f${n})`} />
        </g>,
      );
    });
  }
  const strandEls =
    layer === "back"
      ? null
      : strands.map((s, i) => (
          <g key={i}>
            <path d={smoothOpen(s)} fill="none" stroke={OCEAN.mono} strokeOpacity={0.75} strokeWidth={f3(mono * (i === 0 ? 1.15 : 0.9))} strokeLinecap="round" />
          </g>
        ));
  const coilStyle = { fill: "none", stroke: OCEAN.mono, strokeWidth: f3(mono * 1.25), strokeLinecap: "round" as const };
  return (
    <InFog amount={fog}>
      {layer !== "front" ? <path d={coilBack.join("")} {...coilStyle} strokeOpacity={0.55} /> : null}
      {layer !== "back" ? (
        <>
          {strandEls}
          {netEls}
          <path d={coilFront.join("")} {...coilStyle} strokeOpacity={0.9} />
        </>
      ) : null}
    </InFog>
  );
};

// ===========================================================================
// ANIMALS — dolphin (bottlenose) and humpback whale: shaded, backlit, a body-wave swim cycle
// ===========================================================================
type Profile = readonly (readonly [number, number, number])[]; // u, top, bottom (fractions of L)
const DOLPHIN_PROFILE: Profile = [
  [0, 0.004, 0.004],
  [0.03, 0.018, 0.016],
  [0.065, 0.024, 0.026],
  [0.085, 0.05, 0.034],
  [0.12, 0.075, 0.05],
  [0.19, 0.094, 0.076],
  [0.3, 0.108, 0.096],
  [0.4, 0.11, 0.098],
  [0.5, 0.1, 0.087],
  [0.6, 0.083, 0.068],
  [0.7, 0.06, 0.048],
  [0.8, 0.038, 0.03],
  [0.88, 0.024, 0.02],
  [0.94, 0.017, 0.014],
];
const WHALE_PROFILE: Profile = [
  [0, 0.012, 0.014],
  [0.04, 0.03, 0.05],
  [0.1, 0.048, 0.08],
  [0.18, 0.062, 0.1],
  [0.26, 0.078, 0.112],
  [0.34, 0.088, 0.112],
  [0.44, 0.09, 0.1],
  [0.54, 0.084, 0.082],
  [0.64, 0.072, 0.062],
  [0.72, 0.054, 0.045],
  [0.8, 0.036, 0.031],
  [0.86, 0.025, 0.022],
  [0.91, 0.018, 0.016],
];
const profAt = (P: Profile, u: number) => {
  if (u <= P[0][0]) return { top: P[0][1], bot: P[0][2] };
  for (let i = 1; i < P.length; i++) {
    if (u <= P[i][0]) {
      const t = (u - P[i - 1][0]) / (P[i][0] - P[i - 1][0]);
      const e = smoothstep(t) * 0.5 + t * 0.5;
      return { top: lerp(P[i - 1][1], P[i][1], e), bot: lerp(P[i - 1][2], P[i][2], e) };
    }
  }
  const l = P[P.length - 1];
  return { top: l[1], bot: l[2] };
};
type Body = {
  spine: (u: number) => P2;
  nrm: (u: number) => P2; // up
  tan: (u: number) => P2; // toward the tail
  top: (u: number) => P2;
  bot: (u: number) => P2;
  outline: string;
  uEnd: number;
};
const makeBody = (P: Profile, L: number, phase: number, amp: number, bend: number, uEnd: number): Body => {
  const sy = (u: number) => amp * L * (0.12 + 0.88 * Math.pow(u, 2.2)) * Math.sin(phase - 2 * Math.PI * 0.85 * u) + bend * L * Math.pow(u - 0.3, 2) * Math.sign(u - 0.3);
  const spine = (u: number) => ({ x: (0.5 - u) * L, y: sy(u) });
  const tan = (u: number) => {
    const a = spine(u - 0.004);
    const b = spine(u + 0.004);
    const l = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    return { x: (b.x - a.x) / l, y: (b.y - a.y) / l };
  };
  const nrm = (u: number) => {
    const t = tan(u);
    return { x: -t.y, y: t.x }; // tangent (-1, 0) -> (0, -1): up
  };
  const top = (u: number) => {
    const s = spine(u);
    const n = nrm(u);
    const w = profAt(P, u).top * L;
    return { x: s.x + n.x * w, y: s.y + n.y * w };
  };
  const bot = (u: number) => {
    const s = spine(u);
    const n = nrm(u);
    const w = profAt(P, u).bot * L;
    return { x: s.x - n.x * w, y: s.y - n.y * w };
  };
  const N = 40;
  const us = Array.from({ length: N + 1 }, (_, i) => (i / N) * uEnd);
  const tops = us.map(top);
  const bots = us.map(bot).reverse();
  const nose = spine(0);
  const outline = smoothClosed([{ x: nose.x + L * 0.004, y: nose.y }, ...tops.slice(1), ...bots.slice(0, -1)], 0.9);
  return { spine, nrm, tan, top, bot, outline, uEnd };
};
/** A fluke pair at the tail end: two swept lobes; `open` 0..1 how much of the planform shows. */
const flukePath = (b: Body, L: number, span: number, open: number, serrate = 0) => {
  const u = b.uEnd;
  const p = b.spine(u);
  const t = b.tan(u);
  const n = b.nrm(u);
  const sp = span * L;
  const back = 0.085 * L;
  const lobe = (sgn: number) => {
    const reach = sp * (0.18 + 0.82 * open) * sgn;
    const tip = { x: p.x + t.x * back * 1.25 + n.x * reach, y: p.y + t.y * back * 1.25 + n.y * reach };
    const lead = { x: p.x + t.x * back * 0.15 + n.x * reach * 0.55, y: p.y + t.y * back * 0.15 + n.y * reach * 0.55 };
    const trail = { x: p.x + t.x * back * 0.85 + n.x * reach * 0.45, y: p.y + t.y * back * 0.85 + n.y * reach * 0.45 };
    const notch = { x: p.x + t.x * back * 0.62, y: p.y + t.y * back * 0.62 };
    const pts: P2[] = [p, lead, tip];
    if (serrate > 0) {
      for (let i = 1; i <= 5; i++) {
        const q = i / 6;
        const base = { x: lerp(tip.x, notch.x, q), y: lerp(tip.y, notch.y, q) };
        const bulge = (i % 2 ? 1 : -1) * serrate * L * 0.006;
        pts.push({ x: lerp(base.x, trail.x, 0.4) + t.x * bulge, y: lerp(base.y, trail.y, 0.4) + t.y * bulge });
      }
    } else pts.push(trail);
    pts.push(notch);
    return pts;
  };
  return smoothClosed([...lobe(1), ...lobe(-1).reverse()], 0.7);
};
export type AnimalProps = {
  x: number;
  y: number;
  /** body length (local px) */
  L: number;
  /** 1 = facing right, -1 = facing left */
  facing?: 1 | -1;
  /** heading tilt (rad, + = nose down) */
  tilt?: number;
  frame?: number;
  /** swim cycle period (frames) and body-wave amplitude (fraction of L) */
  period?: number;
  amp?: number;
  /** a static bend of the body (entangled / turning), fraction of L */
  bend?: number;
  /** fog override (default: the current depth's) */
  fog?: number;
};
/** Dolphin — a bottlenose in profile: beak, melon, falcate dorsal fin, flipper, flukes; countershaded,
 *  a cream rim from the surface. Recognisable at ~250 px long; hero ~420 px. */
export const Dolphin: React.FC<AnimalProps> = ({ x, y, L, facing = 1, tilt = 0, frame = 0, period = 22, amp = 0.045, bend = 0, fog }) => {
  const o = useOcean();
  const uid = uidOf(useId());
  const ph = (2 * Math.PI * frame) / period;
  const b = makeBody(DOLPHIN_PROFILE, L, ph, amp, bend, 0.94);
  // dorsal fin: falcate, from u .40 to .58, swept back
  const df0 = b.top(0.4);
  const df1 = b.top(0.585);
  const n50 = b.nrm(0.52);
  const t50 = b.tan(0.52);
  const tip = { x: b.top(0.52).x + n50.x * 0.11 * L + t50.x * 0.085 * L, y: b.top(0.52).y + n50.y * 0.11 * L + t50.y * 0.085 * L };
  const dorsal = `M${f3(df0.x)} ${f3(df0.y)}C${f3(df0.x + n50.x * 0.07 * L + t50.x * 0.01 * L)} ${f3(df0.y + n50.y * 0.07 * L + t50.y * 0.01 * L)} ${f3(tip.x - t50.x * 0.06 * L)} ${f3(tip.y - t50.y * 0.06 * L)} ${f3(tip.x)} ${f3(tip.y)}C${f3(tip.x - n50.x * 0.05 * L - t50.x * 0.005 * L)} ${f3(tip.y - n50.y * 0.05 * L - t50.y * 0.005 * L)} ${f3(df1.x - n50.x * 0.0 * L + 0)} ${f3(df1.y - n50.y * 0.01 * L)} ${f3(df1.x)} ${f3(df1.y + 0)}Z`;
  // flipper: from u .22 low on the flank, pointing back and down
  const pb = b.spine(0.235);
  const nb = b.nrm(0.235);
  const tb = b.tan(0.235);
  const f0 = { x: pb.x - nb.x * 0.035 * L, y: pb.y - nb.y * 0.035 * L };
  const ftip = { x: f0.x + tb.x * 0.13 * L - nb.x * 0.085 * L, y: f0.y + tb.y * 0.13 * L - nb.y * 0.085 * L };
  const flipper = `M${f3(f0.x - tb.x * 0.02 * L)} ${f3(f0.y - tb.y * 0.02 * L)}Q${f3(f0.x + tb.x * 0.05 * L - nb.x * 0.07 * L)} ${f3(f0.y + tb.y * 0.05 * L - nb.y * 0.07 * L)} ${f3(ftip.x)} ${f3(ftip.y)}Q${f3(f0.x + tb.x * 0.09 * L - nb.x * 0.02 * L)} ${f3(f0.y + tb.y * 0.09 * L - nb.y * 0.02 * L)} ${f3(f0.x + tb.x * 0.05 * L)} ${f3(f0.y + tb.y * 0.05 * L)}Z`;
  const flukeOpen = 0.55 + 0.35 * Math.cos(ph - 2 * Math.PI * 0.85);
  const fluke = flukePath(b, L, 0.15, flukeOpen);
  const eye = b.spine(0.115);
  const n12 = b.nrm(0.115);
  const eyeP = { x: eye.x + n12.x * 0.006 * L, y: eye.y + n12.y * 0.006 * L };
  const mouth0 = b.spine(0.0);
  const mouth1 = b.spine(0.09);
  const m1n = b.nrm(0.09);
  const fogA = fog ?? fogAt(o.scene, o.distM);
  const rimW = Math.max(0.012 * L, 1.6 / o.a);
  const dorsalLead = `M${f3(df0.x)} ${f3(df0.y)}C${f3(df0.x + n50.x * 0.07 * L + t50.x * 0.01 * L)} ${f3(df0.y + n50.y * 0.07 * L + t50.y * 0.01 * L)} ${f3(tip.x - t50.x * 0.06 * L)} ${f3(tip.y - t50.y * 0.06 * L)} ${f3(tip.x)} ${f3(tip.y)}`;
  const g = `${uid}g`;
  return (
    <InFog amount={fogA}>
      <g transform={`translate(${fx(x)} ${fx(y)}) rotate(${fx((tilt * 180) / Math.PI * facing)}) scale(${facing} 1)`}>
        <defs>
          <linearGradient id={g} gradientUnits="userSpaceOnUse" x1="0" y1={f3(-0.12 * L)} x2="0" y2={f3(0.11 * L)}>
            <stop offset="0" stopColor={OCEAN.dolphinTop} />
            <stop offset="0.42" stopColor={OCEAN.dolphinMid} />
            <stop offset="0.62" stopColor={OCEAN.dolphinMid} />
            <stop offset="0.8" stopColor={OCEAN.dolphinBelly} />
            <stop offset="1" stopColor={OCEAN.dolphinBelly} />
          </linearGradient>
        </defs>
        <path d={fluke} fill={OCEAN.dolphinTop} />
        <path d={dorsal} fill={`url(#${g})`} />
        <RimLit d={b.outline} body={`url(#${g})`} w={rimW} rimOpacity={0.7} />
        <path d={flipper} fill={OCEAN.dolphinMid} />
        <path d={flipper} fill="none" stroke={OCEAN.dolphinTop} strokeOpacity={0.6} strokeWidth={f3(rimW * 0.6)} />
        <path
          d={`M${f3(mouth0.x)} ${f3(mouth0.y + 0.004 * L)}Q${f3(lerp(mouth0.x, mouth1.x, 0.6))} ${f3(lerp(mouth0.y, mouth1.y, 0.6) + 0.012 * L)} ${f3(mouth1.x - m1n.x * 0.004 * L)} ${f3(mouth1.y - m1n.y * 0.004 * L)}`}
          fill="none"
          stroke={OCEAN.dolphinTop}
          strokeWidth={f3(Math.max(0.006 * L, 1.2 / o.a))}
          strokeLinecap="round"
        />
        <ellipse cx={eyeP.x} cy={eyeP.y} rx={0.009 * L} ry={0.007 * L} fill="#2B2722" />
        <path d={dorsalLead} fill="none" stroke={OCEAN.cream} strokeOpacity={0.45} strokeWidth={f3(rimW * 0.7)} strokeLinecap="round" />
      </g>
    </InFog>
  );
};

/** Whale — a humpback in profile: knobbly rostrum, throat pleats, very long pale flipper, small
 *  dorsal on a hump, broad serrated flukes. Slow swim. Readable as a shape deep in the fog. */
export const Whale: React.FC<AnimalProps> = ({ x, y, L, facing = 1, tilt = 0, frame = 0, period = 70, amp = 0.025, bend = 0, fog }) => {
  const o = useOcean();
  const uid = uidOf(useId());
  const ph = (2 * Math.PI * frame) / period;
  const b = makeBody(WHALE_PROFILE, L, ph, amp, bend, 0.91);
  // knobs (tubercles) along the top of the head
  const knobs = Array.from({ length: 7 }, (_, i) => {
    const u = 0.02 + i * 0.024;
    const q = b.top(u);
    return { x: q.x, y: q.y, r: 0.0065 * L * (1 - i * 0.06) };
  });
  // throat pleats: lines along the underside
  const pleats = Array.from({ length: 5 }, (_, i) => {
    const off = 0.012 + i * 0.012;
    return smoothOpen(
      Array.from({ length: 10 }, (_, j) => {
        const u = 0.05 + (j / 9) * 0.38;
        const q = b.bot(u);
        const n = b.nrm(u);
        return { x: q.x + n.x * off * L, y: q.y + n.y * off * L };
      }),
    );
  });
  // dorsal hump + small fin at u .64
  const h0 = b.top(0.6);
  const h1 = b.top(0.7);
  const nh = b.nrm(0.65);
  const th = b.tan(0.65);
  const htip = { x: b.top(0.65).x + nh.x * 0.035 * L + th.x * 0.02 * L, y: b.top(0.65).y + nh.y * 0.035 * L + th.y * 0.02 * L };
  const dorsal = `M${f3(h0.x)} ${f3(h0.y)}Q${f3(htip.x - th.x * 0.03 * L)} ${f3(htip.y - th.y * 0.03 * L)} ${f3(htip.x)} ${f3(htip.y)}Q${f3(htip.x + th.x * 0.005 * L - nh.x * 0.02 * L)} ${f3(htip.y + th.y * 0.005 * L - nh.y * 0.02 * L)} ${f3(h1.x)} ${f3(h1.y)}Z`;
  // pectoral flipper: ~0.3 L, from u .27, sweeping back-down, knobbly leading edge
  const pb = b.spine(0.28);
  const nb = b.nrm(0.28);
  const tb = b.tan(0.28);
  const sw = Math.sin(ph * 0.5) * 0.04;
  const dirF = { x: tb.x * Math.cos(0.75 + sw) - nb.x * Math.sin(0.75 + sw), y: tb.y * Math.cos(0.75 + sw) - nb.y * Math.sin(0.75 + sw) };
  const pf = { x: -dirF.y, y: dirF.x };
  const root = { x: pb.x - nb.x * 0.03 * L, y: pb.y - nb.y * 0.03 * L };
  const flen = 0.31 * L;
  const fpts: P2[] = [];
  const NB = 9;
  for (let i = 0; i <= NB; i++) {
    const u = i / NB;
    const wdt = 0.032 * L * (1 - 0.75 * u) * (1 + (i % 2 ? 0.25 : 0) * (u > 0.15 ? 1 : 0));
    fpts.push({ x: root.x + dirF.x * flen * u + pf.x * wdt, y: root.y + dirF.y * flen * u + pf.y * wdt });
  }
  for (let i = NB; i >= 0; i--) {
    const u = i / NB;
    const wdt = 0.03 * L * (1 - 0.8 * u);
    fpts.push({ x: root.x + dirF.x * flen * u - pf.x * wdt, y: root.y + dirF.y * flen * u - pf.y * wdt });
  }
  const flipper = smoothClosed(fpts, 0.8);
  const flukeOpen = 0.6 + 0.3 * Math.cos(ph - 2 * Math.PI * 0.85);
  const fluke = flukePath(b, L, 0.16, flukeOpen, 1);
  const fogA = fog ?? fogAt(o.scene, o.distM);
  const rimW = Math.max(0.008 * L, 1.6 / o.a);
  const g = `${uid}g`;
  const gf = `${uid}f`;
  const eyeP = b.spine(0.2);
  return (
    <InFog amount={fogA}>
      <g transform={`translate(${fx(x)} ${fx(y)}) rotate(${fx((tilt * 180) / Math.PI * facing)}) scale(${facing} 1)`}>
        <defs>
          <linearGradient id={g} gradientUnits="userSpaceOnUse" x1="0" y1={f3(-0.1 * L)} x2="0" y2={f3(0.12 * L)}>
            <stop offset="0" stopColor={OCEAN.whaleTop} />
            <stop offset="0.5" stopColor={OCEAN.whaleMid} />
            <stop offset="0.85" stopColor={OCEAN.whaleBelly} />
            <stop offset="1" stopColor={OCEAN.whaleBelly} />
          </linearGradient>
          <linearGradient id={gf} gradientUnits="userSpaceOnUse" x1={f3(root.x)} y1={f3(root.y)} x2={f3(root.x + dirF.x * flen)} y2={f3(root.y + dirF.y * flen)}>
            <stop offset="0" stopColor={OCEAN.whaleMid} />
            <stop offset="0.35" stopColor={OCEAN.whaleFin} />
            <stop offset="1" stopColor={OCEAN.whaleFin} />
          </linearGradient>
        </defs>
        <path d={fluke} fill={OCEAN.whaleMid} />
        <path d={fluke} fill="none" stroke={OCEAN.cream} strokeOpacity={0.3} strokeWidth={f3(rimW * 0.8)} />
        <path d={dorsal} fill={OCEAN.whaleMid} />
        <RimLit d={b.outline} body={`url(#${g})`} w={rimW} rimOpacity={0.55} />
        {knobs.map((k2, i) => (
          <circle key={i} cx={k2.x} cy={k2.y} r={k2.r} fill={OCEAN.whaleTop} />
        ))}
        <g fill="none" stroke={OCEAN.whaleBelly} strokeOpacity={0.55} strokeWidth={f3(Math.max(0.0025 * L, 1 / o.a))}>
          {pleats.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
        <ellipse cx={eyeP.x} cy={eyeP.y + 0.012 * L} rx={0.006 * L} ry={0.005 * L} fill="#26231E" />
        <path d={flipper} fill={`url(#${gf})`} />
      </g>
    </InFog>
  );
};

// ===========================================================================
// ULYSSES VEHICLE — the Mako AUV (Ulysses Maritime): a long slender graphite tube (~11 x its
// diameter), hemispherical nose with sensor windows, a sonar pod under the nose (the fan comes
// out of it), two mushroom-capped masts on top, snap-together sections, two recessed side
// thruster ports, a carbon-weave band, a stubby shrouded tail thruster with small cross fins,
// and the amber shield on its flank (amber = Ulysses). Side view, nose leading.
// ===========================================================================
export type VehicleProps = {
  /** the hull's centre (local world coords), its length (local px) */
  x: number;
  y: number;
  L: number;
  /** 1 = nose right, -1 = nose left; tilt (rad, + = nose down) */
  facing?: 1 | -1;
  tilt?: number;
  frame?: number;
  /** the amber running light on the fore mast (0..1) */
  light?: number;
  /** lifted out of the fog by its own light / the scene (0..1) */
  lit?: number;
};
/** The Mako's proportions, in hull lengths (local frame: nose at +L/2, y down). */
export const MAKO = {
  D: 1 / 11, // hull diameter
  pod: { x: 0.36, w: 0.05, h: 0.032 }, // the sonar pod under the nose: centre x, width, depth below the hull
  masts: [0.38, -0.4], // the two masts' x
  mastH: 0.07,
  capW: 0.05,
  seams: [0.33, 0.18, 0.02, -0.16, -0.3],
  ports: [0.25, -0.22], // the side thruster ports' x
  weave: [-0.1, 0.0], // the carbon-weave band
  logo: 0.1, // the shield's x
} as const;
/** Where the vehicle's parts are, in local world coords (rotation and facing applied). */
export const vehicleGeometry = (p: VehicleProps) => {
  const f = p.facing ?? 1;
  const tl = p.tilt ?? 0;
  const c = Math.cos(tl);
  const s = Math.sin(tl);
  const rot = (lx: number, ly: number) => ({ x: p.x + f * (lx * c - ly * s), y: p.y + lx * s + ly * c });
  const L = p.L;
  const D = L * MAKO.D;
  return {
    D,
    nose: rot(L / 2, 0),
    /** the sonar pod's face: where the SonarFan starts */
    emitter: rot(L * MAKO.pod.x, D / 2 + L * MAKO.pod.h * 0.9),
    /** the running light on the fore mast's cap */
    light: rot(L * MAKO.masts[0], -D / 2 - L * MAKO.mastH - L * 0.012),
    tail: rot(-L / 2, 0),
    /** heading (rad, screen convention) and the "down" direction of the hull (for aiming the fan) */
    heading: f > 0 ? tl : Math.PI - tl,
    down: f > 0 ? tl + Math.PI / 2 : Math.PI / 2 - tl,
  };
};
export const UlyssesVehicle: React.FC<VehicleProps> = (p) => {
  const o = useOcean();
  const uid = uidOf(useId());
  const { L } = p;
  const f = p.facing ?? 1;
  const D = L * MAKO.D;
  const r = D / 2;
  // matte black in life: the fog greys it less than the painted steel (it stays the darkest thing in frame)
  const fogA = fogAt(o.scene, o.distM) * 0.35 * (1 - 0.5 * clamp01(p.lit ?? 0));
  const light = clamp01(p.light ?? 1);
  const t = p.frame ?? 0;
  const tf = `translate(${fx(p.x)} ${fx(p.y)}) rotate(${fx(((p.tilt ?? 0) * 180) / Math.PI * f)}) scale(${f} 1)`;
  const px = 1 / o.a;
  const hairW = Math.max(STROKE_PX.hair * px, D * 0.02);
  // hull: hemispherical nose at +x, a short taper at the tail into the thruster
  const nx = L / 2 - r;
  const tx0 = -L / 2 + L * 0.04;
  const hull = `M${f3(tx0)} ${f3(-r * 0.86)}L${f3(tx0 + L * 0.02)} ${f3(-r)}L${f3(nx)} ${f3(-r)}A${f3(r)} ${f3(r)} 0 0 1 ${f3(nx)} ${f3(r)}L${f3(tx0 + L * 0.02)} ${f3(r)}L${f3(tx0)} ${f3(r * 0.86)}Z`;
  const g = `${uid}h`;
  const gm = `${uid}m`;
  // the tail thruster: a shroud ring + four small cross fins (two seen)
  const sx = -L / 2;
  const shroudR = r * 1.18;
  const mast = (mx: number, key: string) => {
    const mh = L * MAKO.mastH;
    const cw = L * MAKO.capW;
    const y0 = -r + D * 0.05;
    const y1 = y0 - mh;
    return (
      <g key={key}>
        <path d={pathOf([{ x: mx - D * 0.34, y: y0 }, { x: mx - D * 0.17, y: y1 + mh * 0.25 }, { x: mx + D * 0.17, y: y1 + mh * 0.25 }, { x: mx + D * 0.34, y: y0 }])} fill={`url(#${gm})`} />
        <rect x={mx - D * 0.14} y={y1 + mh * 0.05} width={D * 0.28} height={mh * 0.3} fill={OCEAN.hullLo} />
        <rect x={mx - cw / 2} y={y1 - mh * 0.1} width={cw} height={mh * 0.22} rx={mh * 0.08} fill={`url(#${gm})`} />
        <path d={`M${f3(mx - cw / 2 + mh * 0.06)} ${f3(y1 - mh * 0.1 + hairW / 2)}H${f3(mx + cw / 2 - mh * 0.06)}`} stroke={OCEAN.cream} strokeOpacity={0.55} strokeWidth={f3(hairW)} />
      </g>
    );
  };
  // carbon weave: a band of fine diagonal hatching
  const [w0, w1] = MAKO.weave;
  const weave: string[] = [];
  const wp = D * 0.07;
  for (let x = w0 * L - D; x < w1 * L; x += wp) {
    weave.push(`M${f3(x)} ${f3(r)}L${f3(x + D)} ${f3(-r)}`);
    weave.push(`M${f3(x + D)} ${f3(r)}L${f3(x)} ${f3(-r)}`);
  }
  // the amber shield (the Ulysses mark), on the forward section
  const lx = L * MAKO.logo;
  const lh = D * 0.56;
  const lw = lh * 0.82;
  const shield = `M${f3(lx - lw / 2)} ${f3(-lh / 2)}H${f3(lx + lw / 2)}V${f3(lh * 0.02)}Q${f3(lx + lw / 2)} ${f3(lh * 0.36)} ${f3(lx)} ${f3(lh / 2)}Q${f3(lx - lw / 2)} ${f3(lh * 0.36)} ${f3(lx - lw / 2)} ${f3(lh * 0.02)}Z`;
  const fin = `M${f3(lx - lw * 0.05)} ${f3(lh * 0.22)}L${f3(lx + lw * 0.04)} ${f3(-lh * 0.28)}L${f3(lx + lw * 0.2)} ${f3(lh * 0.22)}Z`;
  const prop = (Math.sin(t * 2.3) + 1) / 2;
  const mastCap = { x: L * MAKO.masts[0], y: -r + D * 0.05 - L * MAKO.mastH - L * 0.012 };
  return (
    <g>
      <InFog amount={fogA}>
        <g transform={tf}>
          <defs>
            <linearGradient id={g} gradientUnits="userSpaceOnUse" x1="0" y1={f3(-r)} x2="0" y2={f3(r)}>
              <stop offset="0" stopColor={OCEAN.hullHi} />
              <stop offset="0.14" stopColor={OCEAN.hullMid} />
              <stop offset="0.5" stopColor={OCEAN.hullLo} />
              <stop offset="1" stopColor={OCEAN.hullDeep} />
            </linearGradient>
            <linearGradient id={gm} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor={OCEAN.hullMid} />
              <stop offset="0.35" stopColor={OCEAN.hullHi} />
              <stop offset="1" stopColor={OCEAN.hullDeep} />
            </linearGradient>
          </defs>
          {/* the far cross fin, the masts behind the hull's top line */}
          <path d={pathOf([{ x: sx + L * 0.05, y: -r * 0.6 }, { x: sx + L * 0.025, y: -r * 1.75 }, { x: sx + L * 0.005, y: -r * 1.75 }, { x: sx + L * 0.012, y: -r * 0.5 }])} fill={OCEAN.hullLo} />
          {MAKO.masts.map((m, i) => mast(m * L, `m${i}`))}
          {/* the hull */}
          <RimLit d={hull} body={`url(#${g})`} w={Math.max(r * 0.1, 1.6 * px)} rimOpacity={0.85} />
          {/* section seams */}
          <g stroke={OCEAN.hullDeep} strokeWidth={f3(hairW)} opacity={0.9}>
            {MAKO.seams.map((sx2, i) => (
              <path key={i} d={`M${f3(sx2 * L)} ${f3(-r + hairW)}V${f3(r - hairW)}`} />
            ))}
          </g>
          <g stroke={OCEAN.hullHi} strokeWidth={f3(hairW * 0.7)} opacity={0.35}>
            {MAKO.seams.map((sx2, i) => (
              <path key={i} d={`M${f3(sx2 * L + hairW * 1.2)} ${f3(-r + hairW)}V${f3(-r * 0.2)}`} />
            ))}
          </g>
          {/* the carbon-weave band */}
          <g stroke={OCEAN.hullDeep} strokeWidth={f3(hairW * 0.6)} opacity={0.55}>
            <defs>
              <clipPath id={`${uid}w`}>
                <rect x={w0 * L} y={-r} width={(w1 - w0) * L} height={D} />
              </clipPath>
            </defs>
            <path d={weave.join("")} clipPath={`url(#${uid}w)`} />
          </g>
          {/* recessed side thruster ports */}
          {MAKO.ports.map((px2, i) => (
            <g key={i}>
              <ellipse cx={px2 * L} cy={r * 0.05} rx={D * 0.36} ry={D * 0.3} fill={OCEAN.hullDeep} />
              <ellipse cx={px2 * L + D * 0.04} cy={r * 0.12} rx={D * 0.2} ry={D * 0.16} fill={OCEAN.hullLo} />
              <path d={`M${f3(px2 * L - D * 0.3)} ${f3(-r * 0.32)}A${f3(D * 0.36)} ${f3(D * 0.3)} 0 0 1 ${f3(px2 * L + D * 0.3)} ${f3(-r * 0.32)}`} fill="none" stroke={OCEAN.hullHi} strokeOpacity={0.5} strokeWidth={f3(hairW)} />
            </g>
          ))}
          {/* nose sensor windows */}
          <ellipse cx={nx + r * 0.55} cy={-r * 0.18} rx={r * 0.13} ry={r * 0.2} fill={OCEAN.hullDeep} />
          <ellipse cx={nx + r * 0.4} cy={r * 0.38} rx={r * 0.1} ry={r * 0.15} fill={OCEAN.hullDeep} />
          <ellipse cx={nx + r * 0.53} cy={-r * 0.24} rx={r * 0.05} ry={r * 0.07} fill={OCEAN.hullHi} opacity={0.6} />
          {/* the sonar pod under the nose */}
          <rect x={L * (MAKO.pod.x - MAKO.pod.w / 2)} y={r - D * 0.08} width={L * MAKO.pod.w} height={L * MAKO.pod.h} rx={L * MAKO.pod.h * 0.45} fill={OCEAN.hullLo} />
          <rect x={L * (MAKO.pod.x - MAKO.pod.w / 2) + D * 0.08} y={r + L * MAKO.pod.h * 0.55} width={L * MAKO.pod.w - D * 0.16} height={L * MAKO.pod.h * 0.3} rx={L * 0.004} fill={OCEAN.hullDeep} />
          {/* the tail: taper, shroud ring, near fin, thruster blur */}
          <rect x={sx} y={-shroudR} width={L * 0.04} height={shroudR * 2} rx={D * 0.12} fill={`url(#${g})`} />
          <rect x={sx + L * 0.006} y={-shroudR} width={L * 0.006} height={shroudR * 2} fill={OCEAN.hullDeep} opacity={0.8} />
          <ellipse cx={sx - L * 0.004} cy={0} rx={L * 0.006} ry={shroudR * (0.55 + 0.2 * prop)} fill={OCEAN.hullLo} opacity={0.5} />
          <path d={pathOf([{ x: sx + L * 0.05, y: r * 0.6 }, { x: sx + L * 0.025, y: r * 1.75 }, { x: sx + L * 0.005, y: r * 1.75 }, { x: sx + L * 0.012, y: r * 0.5 }])} fill={OCEAN.hullMid} />
          {/* the light's housing on the fore mast */}
          <rect x={mastCap.x - D * 0.12} y={mastCap.y - D * 0.02} width={D * 0.24} height={D * 0.12} fill={OCEAN.hullDeep} />
        </g>
      </InFog>
      {/* amber, outside the fog: the shield on the flank and the running light */}
      <g transform={tf}>
        <g style={{ filter: bloomFilter(o.a * 2) }}>
          <path d={shield} fill={OCEAN.amberTop} />
        </g>
        <path d={fin} fill={OCEAN.hullDeep} opacity={0.8} />
        {light > 0.003 ? (
          <g style={{ filter: bloomFilter(o.a) }} opacity={f3(light)}>
            <ellipse cx={mastCap.x} cy={mastCap.y - D * 0.06} rx={D * 0.11} ry={D * 0.08} fill={OCEAN.amberTop} />
            <ellipse cx={mastCap.x - D * 0.02} cy={mastCap.y - D * 0.09} rx={D * 0.04} ry={D * 0.03} fill={OCEAN.amberHot} />
          </g>
        ) : null}
      </g>
    </g>
  );
};

// re-exports a cut needs from the stout system (one import site)
export { Label, bloomFilter, clamp01, easeOutCubic, lerp, smoothstep };
export type { Cam };
