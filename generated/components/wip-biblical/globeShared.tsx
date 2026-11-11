// ---------------------------------------------------------------------------
// globeShared (wip-biblical). Owned by cut 43 (WiredIntoOneTribe); cut 73 (NoosphereOmegaPoint) opens on it.
// Works in Progress style, kit generated/components/kits/works-in-progress/wipShared.tsx.
//
// THE GLOBE: a real Earth (NASA Blue Marble) printed onto the page in the paper's own inks, on an orthographic globe:
// the land in deep-green ink at the photo's own tone, the ocean a pale wash, a faint indigo graticule on top. The texture
// is baked once (scripts/clips/wip-biblical/bake-globe-43.py -> public/wip-biblical/gl_earth_ink.png) and projected per
// frame onto a screen-space canvas (EarthPrint), so the globe can turn and the camera can zoom without a blurry raster.
// Everything vector (graticule, wires, ring) goes through globeProjection() with the same rotation, so it sits exactly on
// the print. World px: the settled frame of cut 43 is the kit's rest camera (world px = screen px).
//
// THE WIRES: the 1901 submarine-cable network (Eastern Telegraph Co. system map, 1901, and the Atlantic cables), as
// lon/lat waypoints. Drawn by a moving tip at one speed (wireLength / wirePartial).
// THE RING: a red circle concentric with the globe, just outside the limb (RING_R).
// ---------------------------------------------------------------------------
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cancelRender, continueRender, delayRender, staticFile } from "remotion";
// @ts-expect-error untyped module
import { geoDistance, geoGraticule, geoInterpolate, geoOrthographic, geoPath, geoRotation } from "d3-geo";
import { H, INDIGO, THEMES, W, WipCam, depthTransform, inkOn } from "../kits/works-in-progress/wipShared";

// -- the settled globe (cut 43's last frame, world px at the rest camera) -----------------------------------------------
export const GLOBE_X = 540;
export const GLOBE_Y = 495;
export const GLOBE_R = 270;
/** The red ring's radius (centre line), concentric with the globe. */
export const RING_R = 310;
/** Ink weights in world px at the settled size. */
export const WIRE_W = 4.2;
export const RING_W = 6;

/** The view: the point of the Earth at the globe's centre, and the in-plane roll (d3 rotate convention). */
export const VIEW_LON = 14;
export const VIEW_LAT = -5;
export const VIEW_ROLL = 8;
/** The slow turn: degrees of longitude per frame (the surface moves left to right as lon decreases). */
export const TURN_PER_FRAME = -0.022;
/** d3's rotate triple at a frame of cut 43 (f0 = its first frame). Joined cuts pass cut-43 frame + offset. */
export const globeRotate = (frame: number): [number, number, number] => [-(VIEW_LON + TURN_PER_FRAME * frame), -VIEW_LAT, VIEW_ROLL];

/** The orthographic projection in world px: centre (x, y), radius r. Clipped at the limb. */
export const globeProjection = (rotate: [number, number, number], x = GLOBE_X, y = GLOBE_Y, r = GLOBE_R) =>
  geoOrthographic().scale(r).translate([x, y]).rotate(rotate).clipAngle(90).precision(0.2);

/** World px of a lon/lat on the globe, and whether it faces the viewer (z > 0). */
export const globePoint = (lonlat: [number, number], rotate: [number, number, number], x = GLOBE_X, y = GLOBE_Y, r = GLOBE_R) => {
  const [l, p] = geoRotation(rotate)(lonlat) as [number, number];
  const lr = (l * Math.PI) / 180;
  const pr = (p * Math.PI) / 180;
  return { x: x + r * Math.cos(pr) * Math.sin(lr), y: y - r * Math.sin(pr), z: Math.cos(pr) * Math.cos(lr) };
};

// -- the real places (lon, lat) ------------------------------------------------------------------------------------------
export const CITIES = {
  london: [-0.13, 51.51],
  newYork: [-74.0, 40.71],
  lisbon: [-9.33, 38.69],
  bombay: [72.83, 18.93],
  singapore: [103.85, 1.29],
  sydney: [151.21, -33.87],
  capeTown: [18.42, -33.92],
  buenosAires: [-58.38, -34.6],
} as const satisfies Record<string, [number, number]>;

export type Route = { id: string; from: keyof typeof CITIES; to: keyof typeof CITIES; path: [number, number][] };
/**
 * The 1901 cables as waypoints, landing to landing (Eastern Telegraph Co. system map 1901; Atlantic: Commercial Cable Co.
 * Waterville-Canso-New York). Simplified: the line keeps to the real landings, not every repeater.
 */
export const ROUTES: Route[] = [
  {
    id: "atlantic",
    from: "london",
    to: "newYork",
    // London - Waterville (Kerry) overland and across the Irish Sea, the Atlantic to Canso (Nova Scotia), down to New York
    path: [[-0.13, 51.51], [-4.2, 51.9], [-10.17, 51.83], [-30, 51.0], [-50, 47.4], [-61.0, 45.33], [-68.5, 42.6], [-74.0, 40.71]],
  },
  {
    id: "suez",
    from: "london",
    to: "bombay",
    // Porthcurno - Carcavelos (Lisbon) - Gibraltar - Malta - Alexandria - Suez - Aden - Bombay (Eastern Telegraph, 1870)
    path: [
      [-0.13, 51.51], [-5.67, 50.04], [-9.6, 46.5], [-9.9, 42.8], [-9.33, 38.69], [-8.5, 36.4], [-5.35, 36.0], [1.5, 37.2], [10.5, 37.6],
      [14.51, 35.9], [22.5, 33.6], [29.92, 31.2], [32.55, 29.97], [34.2, 27.0], [38.5, 20.5], [42.6, 13.7], [45.03, 12.8], [57.0, 15.0], [72.83, 18.93],
    ],
  },
  {
    id: "westafrica",
    from: "lisbon",
    to: "capeTown",
    // Carcavelos - Madeira - St Vincent (Cape Verde) - Ascension - St Helena - Cape Town (Eastern & South African, 1899-1901)
    path: [[-9.33, 38.69], [-16.9, 32.65], [-24.98, 16.89], [-14.4, -7.93], [-5.7, -15.93], [18.42, -33.92]],
  },
  {
    id: "eastern",
    from: "bombay",
    to: "sydney",
    // Bombay - Madras (overland) - Penang - Singapore - Batavia - Banyuwangi - Port Darwin, the overland line to Adelaide, Sydney
    path: [
      [72.83, 18.93], [80.27, 13.08], [92.0, 9.0], [100.33, 5.42], [103.85, 1.29], [106.85, -6.2], [114.37, -8.2], [123.0, -10.5],
      [130.84, -12.46], [133.88, -23.7], [138.6, -34.93], [145.0, -37.8], [151.21, -33.87],
    ],
  },
  {
    id: "southamerica",
    from: "newYork",
    to: "buenosAires",
    // New York - Havana - Santiago de Cuba - Puerto Rico - Martinique - Demerara - Para - Pernambuco - Bahia - Rio - Montevideo -
    // Buenos Aires (West India & Panama, Western & Brazilian, River Plate cables)
    path: [
      [-74.0, 40.71], [-74.0, 35.5], [-78.5, 27.5], [-79.8, 24.4], [-82.4, 23.1], [-77.5, 21.4], [-75.8, 20.0], [-71.0, 19.4], [-66.1, 18.45],
      [-61.0, 14.6], [-57.0, 8.5], [-52.0, 5.5], [-47.5, 1.2], [-41.0, -1.5], [-34.6, -8.05], [-36.4, -13.4], [-37.4, -18.5], [-39.6, -23.2],
      [-43.2, -23.2], [-45.6, -25.8], [-47.4, -28.6], [-50.4, -33.6], [-54.8, -35.6], [-56.16, -34.9], [-58.38, -34.6],
    ],
  },
];
export const routeById = (id: string) => {
  const r = ROUTES.find((q) => q.id === id);
  if (!r) throw new Error(`globeShared: no route ${id}`);
  return r;
};

/** A route's length in world px on a globe of radius r (geodesic, so a tip at constant speed runs at constant speed over the Earth). */
export const wireLength = (path: [number, number][], r = GLOBE_R) => {
  let s = 0;
  for (let i = 1; i < path.length; i++) s += geoDistance(path[i - 1], path[i]) * r;
  return s;
};
/** The first `s` world px of a route as a GeoJSON LineString (great-circle legs), and its tip. */
export const wirePartial = (path: [number, number][], s: number, r = GLOBE_R) => {
  const coords: [number, number][] = [path[0]];
  let left = s;
  for (let i = 1; i < path.length; i++) {
    const leg = geoDistance(path[i - 1], path[i]) * r;
    if (left >= leg) {
      coords.push(path[i]);
      left -= leg;
      continue;
    }
    const tip = geoInterpolate(path[i - 1], path[i])(Math.max(0, left / leg)) as [number, number];
    coords.push(tip);
    return { line: { type: "LineString", coordinates: coords }, tip, done: false };
  }
  return { line: { type: "LineString", coordinates: coords }, tip: path[path.length - 1], done: true };
};

/** The graticule (every 20 degrees, poles kept clear) as one GeoJSON MultiLineString. */
export const GRATICULE = geoGraticule().step([20, 20]).extentMinor([[-180, -80], [180, 80.01]])();

/** SVG path d of a GeoJSON object through a projection. */
export const geoD = (projection: unknown, obj: unknown): string => (geoPath(projection)(obj) as string | null) ?? "";

// -- the print: the baked Earth, projected per frame onto a screen-space canvas ------------------------------------------
export const EARTH_SRC = "wip-biblical/gl_earth_ink.png";
/** The ocean's pale wash and the land's ink, as they land on the paper (mint). */
export const OCEAN_ON_PAPER = "#B9CFCB";
export const LAND_INK = THEMES.mint.ink;

type Level = { w: number; h: number; land: Uint8Array; sea: Uint8Array };
type Tex = Level[];
const texCache = new Map<string, Promise<Tex>>();
const doneTex = new Map<string, Tex>();

const halve = (l: Level): Level => {
  const w = l.w >> 1;
  const h = l.h >> 1;
  const land = new Uint8Array(w * h);
  const sea = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    const r0 = 2 * y * l.w;
    const r1 = r0 + l.w;
    for (let x = 0; x < w; x++) {
      const i = 2 * x;
      land[y * w + x] = (l.land[r0 + i] + l.land[r0 + i + 1] + l.land[r1 + i] + l.land[r1 + i + 1] + 2) >> 2;
      sea[y * w + x] = (l.sea[r0 + i] + l.sea[r0 + i + 1] + l.sea[r1 + i] + l.sea[r1 + i + 1] + 2) >> 2;
    }
  }
  return { w, h, land, sea };
};

const loadTex = (src: string): Promise<Tex> => {
  const hit = texCache.get(src);
  if (hit) return hit;
  const p = (async () => {
    const blob = await (await fetch(staticFile(src))).blob();
    const bmp = await createImageBitmap(blob, { colorSpaceConversion: "none", premultiplyAlpha: "none" });
    const c = new OffscreenCanvas(bmp.width, bmp.height);
    const ctx = c.getContext("2d", { willReadFrequently: true }) as OffscreenCanvasRenderingContext2D;
    ctx.drawImage(bmp, 0, 0);
    const px = ctx.getImageData(0, 0, bmp.width, bmp.height).data;
    const n = bmp.width * bmp.height;
    const land = new Uint8Array(n);
    const sea = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      land[i] = px[4 * i];
      sea[i] = px[4 * i + 1];
    }
    const levels: Tex = [{ w: bmp.width, h: bmp.height, land, sea }];
    while (levels[levels.length - 1].w > 512) levels.push(halve(levels[levels.length - 1]));
    doneTex.set(src, levels);
    return levels;
  })();
  texCache.set(src, p);
  return p;
};

const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16) / 255);
const PAPER = hex(THEMES.mint.paper);
/** An ink's multiply factor per channel on the mint paper (1 = no change). */
const factor = (c: string) => hex(c).map((v, i) => Math.min(1, v / PAPER[i]));

/** World cartesian of a lon/lat in degrees. */
const cart = ([l, p]: [number, number]) => {
  const lr = (l * Math.PI) / 180;
  const pr = (p * Math.PI) / 180;
  return [Math.cos(pr) * Math.cos(lr), Math.cos(pr) * Math.sin(lr), Math.sin(pr)];
};

/**
 * Draws the globe's print for one frame into `canvas` (W x H, screen space). (sx, sy) the globe's centre on screen, rs
 * its radius in screen px. Inks as multiply factors, alpha = coverage at the limb (the canvas is composited multiply).
 */
const drawEarth = (
  canvas: HTMLCanvasElement,
  tex: Tex,
  rotate: [number, number, number],
  sx: number,
  sy: number,
  rs: number,
  landInk: string,
  oceanOnPaper: string,
  landStrength: number,
) => {
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const sc = canvas.width / W; // backing px per screen px
  const cx = sx * sc;
  const cy = sy * sc;
  const r = rs * sc;
  const x0 = Math.max(0, Math.floor(cx - r - 1));
  const x1 = Math.min(canvas.width, Math.ceil(cx + r + 1));
  const y0 = Math.max(0, Math.floor(cy - r - 1));
  const y1 = Math.min(canvas.height, Math.ceil(cy + r + 1));
  if (x1 <= x0 || y1 <= y0) return;
  const bw = x1 - x0;
  const bh = y1 - y0;
  const img = ctx.createImageData(bw, bh);
  const out = img.data;
  // view basis -> world: columns are the world vectors of the view's depth, right and up axes
  const inv = geoRotation(rotate).invert as (p: [number, number]) => [number, number];
  const ex = cart(inv([0, 0]));
  const ey = cart(inv([90, 0]));
  const ez = cart(inv([0, 90]));
  const fl = factor(landInk).map((v) => 1 - v);
  const fo = factor(oceanOnPaper).map((v) => 1 - v);
  const base = tex[0];
  const twoPi = Math.PI * 2;
  for (let py = 0; py < bh; py++) {
    const Y = -((y0 + py + 0.5 - cy) / r);
    for (let px = 0; px < bw; px++) {
      const X = (x0 + px + 0.5 - cx) / r;
      const rho2 = X * X + Y * Y;
      const rho = Math.sqrt(rho2);
      const cover = Math.min(1, Math.max(0, (1 - rho) * r + 0.5));
      if (cover <= 0) continue;
      const D = Math.sqrt(Math.max(0, 1 - Math.min(1, rho2)));
      const wx = ex[0] * D + ey[0] * X + ez[0] * Y;
      const wy = ex[1] * D + ey[1] * X + ez[1] * Y;
      const wz = ex[2] * D + ey[2] * X + ez[2] * Y;
      const lon = Math.atan2(wy, wx);
      const lat = Math.asin(Math.max(-1, Math.min(1, wz)));
      // texture footprint: base texels per screen px, opened up by the foreshortening toward the limb
      const foot = base.w / twoPi / (r * Math.max(0.08, D)) * 1.15;
      const lvf = Math.max(0, Math.min(tex.length - 1.001, Math.log2(Math.max(1, foot))));
      const li = Math.floor(lvf);
      const lt = lvf - li;
      let land = 0;
      let sea = 0;
      for (let k = 0; k < 2; k++) {
        const wgt = k === 0 ? 1 - lt : lt;
        if (wgt <= 0) continue;
        const L = tex[li + k];
        const u = ((lon + Math.PI) / twoPi) * L.w - 0.5;
        const v = ((Math.PI / 2 - lat) / Math.PI) * L.h - 0.5;
        const iu = Math.floor(u);
        const iv = Math.floor(v);
        const fu = u - iu;
        const fv = v - iv;
        const u0 = ((iu % L.w) + L.w) % L.w;
        const u1 = (u0 + 1) % L.w;
        const v0 = Math.max(0, Math.min(L.h - 1, iv));
        const v1 = Math.max(0, Math.min(L.h - 1, iv + 1));
        const a = v0 * L.w;
        const b = v1 * L.w;
        land += wgt * ((L.land[a + u0] * (1 - fu) + L.land[a + u1] * fu) * (1 - fv) + (L.land[b + u0] * (1 - fu) + L.land[b + u1] * fu) * fv);
        sea += wgt * ((L.sea[a + u0] * (1 - fu) + L.sea[a + u1] * fu) * (1 - fv) + (L.sea[b + u0] * (1 - fu) + L.sea[b + u1] * fu) * fv);
      }
      const dl = (land / 255) * landStrength;
      const ds = sea / 255;
      const o = 4 * (py * bw + px);
      out[o] = 255 * (1 - dl * fl[0]) * (1 - ds * fo[0]);
      out[o + 1] = 255 * (1 - dl * fl[1]) * (1 - ds * fo[1]);
      out[o + 2] = 255 * (1 - dl * fl[2]) * (1 - ds * fo[2]);
      out[o + 3] = 255 * cover;
    }
  }
  ctx.putImageData(img, x0, y0);
};

/**
 * The Earth printed on the page, in screen space (place it in the stack where a plane would go; it multiplies into the
 * paper and everything under it). `cam` the kit camera, (x, y, r) the globe in d = 1 world px, `rotate` from globeRotate().
 * The canvas's backing store follows `scale` (1 for finals; the preview's --scale is applied by the browser).
 */
export const EarthPrint: React.FC<{
  cam: WipCam;
  rotate: [number, number, number];
  x?: number;
  y?: number;
  r?: number;
  src?: string;
  landInk?: string;
  oceanOnPaper?: string;
  landStrength?: number;
}> = ({ cam, rotate, x = GLOBE_X, y = GLOBE_Y, r = GLOBE_R, src = EARTH_SRC, landInk = LAND_INK, oceanOnPaper = OCEAN_ON_PAPER, landStrength = 1 }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [tex, setTex] = useState<Tex | null>(() => doneTex.get(src) ?? null);
  const handle = useRef<number | null>(null);
  if (handle.current === null && !tex) handle.current = delayRender(`EarthPrint ${src}`);
  useEffect(() => {
    if (tex) return;
    loadTex(src)
      .then(setTex)
      .catch((e) => cancelRender(e));
  }, [src, tex]);
  const t = depthTransform(cam, 1);
  const s = t.toScreen(x, y);
  const rs = r * t.k;
  useLayoutEffect(() => {
    if (!tex || !ref.current) return;
    drawEarth(ref.current, tex, rotate, s.x, s.y, rs, landInk, oceanOnPaper, landStrength);
    if (handle.current !== null && handle.current >= 0) {
      continueRender(handle.current);
      handle.current = -1;
    }
  });
  return (
    <canvas
      ref={ref}
      width={W}
      height={H}
      style={{ position: "absolute", left: 0, top: 0, width: W, height: H, mixBlendMode: "multiply", pointerEvents: "none" }}
    />
  );
};

/** The graticule's ink colour on the page: indigo, light. */
export const GRATICULE_INK = INDIGO;
export const graticuleColour = () => inkOn(INDIGO);

const seedNum = (seed: string) => {
  let h = 7;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 9973;
  return 1 + h;
};
/**
 * Thin ink lines (wires, the ring) printed on the page: the kit's rough edge and ink gain plus a faint second strike, but
 * no worn mask, so a line never breaks (a broken ring means something else in this clip). Children draw with
 * `currentColor`. Put it on an `ink` WipPlane. (x, y, w, h) the box in world px; children use the box's own px.
 */
export const InkLines: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  ink?: string;
  seed?: string;
  rough?: number;
  misregister?: number;
  children: React.ReactNode;
}> = ({ x, y, w, h, ink = INDIGO, seed = "lines", rough = 1, misregister = 0.9, children }) => {
  const id = `gl-ink-${seed.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const colour = inkOn(ink);
  const a = (seedNum(seed) % 360) * (Math.PI / 180);
  const layer = (key: string, opacity: number, dx: number, dy: number) => (
    <svg
      key={key}
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      style={{ position: "absolute", left: dx, top: dy, overflow: "visible", opacity, color: colour }}
    >
      <g filter={`url(#${id})`}>{children}</g>
    </svg>
  );
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, mixBlendMode: "multiply" }}>
      <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
        <defs>
          <filter id={id} filterUnits="userSpaceOnUse" x={-20} y={-20} width={w + 40} height={h + 40} colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.11" numOctaves={2} seed={seedNum(seed)} result="edge" />
            <feDisplacementMap in="SourceGraphic" in2="edge" scale={rough * 2} xChannelSelector="R" yChannelSelector="G" result="wobble" />
            <feGaussianBlur in="wobble" stdDeviation={Math.min(0.7, 0.2 + rough * 0.22)} result="soft" />
            <feComponentTransfer in="soft">
              <feFuncA type="linear" slope={2.6} intercept={-0.62} />
            </feComponentTransfer>
          </filter>
        </defs>
      </svg>
      {misregister > 0 ? layer("ghost", 0.26, Math.cos(a) * misregister, Math.sin(a) * misregister) : null}
      {layer("main", 1, 0, 0)}
    </div>
  );
};

/**
 * Where a route leaves the visible face (the first sample that turns away), or its end if the end faces the viewer.
 * `s` is the world px along the route to that point. Sampled every ~2 world px.
 */
export const routeExit = (path: [number, number][], rotate: [number, number, number], r = GLOBE_R) => {
  const total = wireLength(path, r);
  const n = Math.max(8, Math.ceil(total / 2));
  let last: { lonlat: [number, number]; s: number } = { lonlat: path[0], s: 0 };
  for (let i = 0; i <= n; i++) {
    const s = (total * i) / n;
    const tip = wirePartial(path, s, r).tip as [number, number];
    if (globePoint(tip, rotate, 0, 0, 1).z <= 0.002) return { ...last, hidden: true };
    last = { lonlat: tip, s };
  }
  return { ...last, hidden: false };
};
