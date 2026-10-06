// ---------------------------------------------------------------------------
// americasShared: THE AMERICAS WORLD (Mexico to Chile, c. 1519-1532) for the
// cut HierarchicalNatureV2 of the clip "Sheppard: centralized empires fell
// fast" (Dwarkesh map style). The Aztec empire and Tawantinsuyu on one sheet.
//
// THE MAP (world px). North-up Mercator (the conformal conic's limit for a
// sheet straddling the equator), 19 px per degree of longitude
// (scripts/build-americas-map.mjs -> americasMapData.ts / americasStatic.ts).
// World px == screen px at THE WIDE (camera { k: 1, cx: 540, cy: 960 }):
// Tenochtitlan (270, 440), Cuzco (786, 1076); the frame spans lon -113 ... -56,
// lat ~+40 ... -58. The static map (sea, 4 engraved water-lines, 10 deg
// graticule, land + #6A5838 rim, cream coast; NO borders) is a tiled raster
// LOD pyramid (scripts/bake-americas-rasters.mjs -> public/americas/*.png,
// americasLevels.ts): base (the whole sheet) | mid k 1.2-1.45 | close k 2.3-2.7
// (sharp to k ~4.8, only over x 10 ... 680, y 120 ... 1130: Mesoamerica).
//
// Camera, palette, fonts, paper, labels: incaShared's (imported, re-exported).
//
// API
//   project(lon, lat) -> [x, y] world px
//   <MapStack cam /> the baked map + world-space mottle; <MapPage cam> =
//     MapStack + children + PaperTop; levelWeights(cam); mapSharpness(cam)
//   TENOCHTITLAN, CUZCO; EMPIRE_D / EMPIRE_BORDER_D / EMPIRE_BOX and REALM_D /
//     REALM_BORDER_D / REALM_BOX; AZTEC_TREE, INCA_TREE ({ name, lon, lat, x,
//     y, parent }: SCHEMATIC, see the build script)
//   <Territory id d borderD box cam level halos? /> a territory in cream line
//     hatch + its fine dashed land border; level 0 = INK_CONTEXT .. 1 =
//     INK_FULL; halos = stroked paths along which the hatch recedes to 0.3
//     (so links laid on it stay legible)
//   <TownDot x y cam r level /> a cream town (dark casing), r in screen px
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { DARK, FRAME_H, FRAME_W, INK, INK_CONTEXT, INK_FULL, Mottle, PaperTop, SEA, camTransform, clamp01, mixColor, smoothstep, viewRect, type Cam } from "./incaShared";
import { PROJ, type P2 } from "./americasMapData";
import { LEVELS } from "./americasLevels";

export type { Cam } from "./incaShared";
export type { P2, TreeNode } from "./americasMapData";
export {
  ACCENT,
  ACCENT_DEEP,
  DARK,
  FRAME_H,
  FRAME_W,
  INK,
  INK_CONTEXT,
  INK_FULL,
  MapLabel,
  PaperTop,
  SEA,
  WorldSvg,
  clamp01,
  fell,
  fellSC,
  hash,
  labelSlide,
  screenOf,
  smoothstep,
  swayCam,
} from "./incaShared";
export { AZTEC_TREE, CUZCO, EMPIRE_BORDER_D, EMPIRE_BOX, EMPIRE_D, INCA_TREE, REALM_BORDER_D, REALM_BOX, REALM_D, TENOCHTITLAN } from "./americasMapData";

const RAD = Math.PI / 180;
/** spherical Mercator, identical to d3-geo's geoMercator with PROJ */
export const project = (lon: number, lat: number): P2 => [
  PROJ.translate[0] + PROJ.scale * lon * RAD,
  PROJ.translate[1] - PROJ.scale * Math.log(Math.tan(Math.PI / 4 + (lat * RAD) / 2)),
];

// ---------------------------------------------------------------------------
// THE MAP: LOD tiles + mottle (incaShared's MapStack, on this world's levels)
// ---------------------------------------------------------------------------
const COVER_FADE = 48;
/** each level's opacity for this camera: its k band x how far the frame lies inside its rect */
export const levelWeights = (cam: Cam) => {
  const v = viewRect(cam, 16);
  return LEVELS.map((L) => {
    const kw = L.band ? smoothstep(Math.log(cam.k / L.band[0]) / Math.log(L.band[1] / L.band[0])) : 1;
    if (kw <= 0) return 0;
    if (!L.band) return 1;
    const inset = Math.min(v.x0 - L.x0, L.x0 + L.w - v.x1, v.y0 - L.y0, L.y0 + L.h - v.y1) * cam.k;
    return kw * smoothstep(inset / COVER_FADE);
  });
};
/** the level that dominates this camera's frame and its sharpness (texels per screen px; >= ~0.95 is sharp) */
export const mapSharpness = (cam: Cam) => {
  const w = levelWeights(cam);
  let top = 0;
  for (let i = 0; i < w.length; i++) if (w[i] >= 0.5) top = i;
  return { level: LEVELS[top].name, weight: w[top], texelsPerPx: LEVELS[top].s / cam.k };
};
export const MapStack: React.FC<{ cam: Cam; mottleOpacity?: number }> = ({ cam, mottleOpacity = 0.9 }) => {
  const { k } = cam;
  const { tx, ty } = camTransform(cam);
  const w = levelWeights(cam);
  const v = viewRect(cam, 24);
  return (
    <>
      {LEVELS.map((L, li) => {
        if (w[li] <= 0.001) return null;
        if (w.some((o, j) => j > li && o >= 0.999)) return null;
        const tiles = L.tiles.filter((t) => t.x0 < v.x1 && t.x0 + t.w > v.x0 && t.y0 < v.y1 && t.y0 + t.h > v.y0);
        return (
          <div key={L.name} style={{ position: "absolute", left: 0, top: 0, width: FRAME_W, height: FRAME_H, opacity: w[li] }}>
            {tiles.map((t) => (
              <Img
                key={t.f}
                src={staticFile(`americas/${t.f}`)}
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: t.W,
                  height: t.H,
                  transformOrigin: "0 0",
                  transform: `translate(${(tx + t.x0 * k).toFixed(3)}px, ${(ty + t.y0 * k).toFixed(3)}px) scale(${(k / L.s).toFixed(6)})`,
                }}
              />
            ))}
          </div>
        );
      })}
      <Mottle cam={cam} opacity={mottleOpacity} />
    </>
  );
};
export const MapPage: React.FC<{ cam: Cam; vignette?: number; children?: React.ReactNode }> = ({ cam, vignette, children }) => (
  <AbsoluteFill style={{ backgroundColor: SEA }}>
    <MapStack cam={cam} />
    {children}
    <PaperTop vignette={vignette} />
  </AbsoluteFill>
);

// ---------------------------------------------------------------------------
// A TERRITORY: cream line hatch (world-anchored, 45 deg, a period per octave
// of k: 12-24 screen px apart) + the fine dashed land border
// ---------------------------------------------------------------------------
const HATCH_PX = 6;
const HATCH_W = 1.5;
const DASH = 11;
const octaveDashes = (k: number) => {
  const L2 = Math.log2(k);
  const o = Math.floor(L2);
  const t = smoothstep((L2 - o - 0.25) / 0.5);
  const a = DASH / Math.pow(2, o);
  return [
    { p: a, op: 1 - t },
    { p: a / 2, op: t },
  ].filter((x) => x.op > 0.001);
};
export type Halo = { d: string; width: number; dash?: string; offset?: number };
export const Territory: React.FC<{
  id: string;
  d: string;
  borderD: string;
  box: { x0: number; x1: number; y0: number; y1: number };
  cam: Cam;
  /** 0 = INK_CONTEXT .. 1 = INK_FULL */
  level?: number;
  /** paths (world px; width in screen px) along which the hatch recedes to `sunk` */
  halos?: Halo[];
  sunk?: number;
}> = ({ id, d, borderD, box, cam, level = 0, halos, sunk = 0.3 }) => {
  const k = cam.k;
  const L2 = Math.log2(k);
  const o = Math.floor(L2);
  const P = (2 * HATCH_PX * 2) / Math.pow(2, o);
  const mid = smoothstep((L2 - o - 0.2) / 0.6);
  const rung = INK_CONTEXT + (INK_FULL - INK_CONTEXT) * clamp01(level);
  const g = Math.round(255 * sunk);
  const masked = !!halos && halos.length > 0;
  const M = 30;
  return (
    <g>
      <defs>
        <pattern id={`${id}-hatch`} patternUnits="userSpaceOnUse" width={P} height={P} patternTransform="rotate(45)">
          <line x1={0} y1={-1} x2={0} y2={P + 1} stroke={INK} strokeWidth={HATCH_W / k} />
          <line x1={P / 2} y1={-1} x2={P / 2} y2={P + 1} stroke={INK} strokeWidth={HATCH_W / k} strokeOpacity={mid} />
          <line x1={P} y1={-1} x2={P} y2={P + 1} stroke={INK} strokeWidth={HATCH_W / k} />
        </pattern>
        {masked ? (
          <mask id={`${id}-mask`} maskUnits="userSpaceOnUse" x={box.x0 - M} y={box.y0 - M} width={box.x1 - box.x0 + 2 * M} height={box.y1 - box.y0 + 2 * M}>
            <rect x={box.x0 - M} y={box.y0 - M} width={box.x1 - box.x0 + 2 * M} height={box.y1 - box.y0 + 2 * M} fill="#fff" />
            <g fill="none" stroke={`rgb(${g},${g},${g})`} strokeLinecap="round" strokeLinejoin="round">
              {halos.map((h, i) => (
                <path key={i} d={h.d} strokeWidth={h.width / k} strokeDasharray={h.dash} strokeDashoffset={h.offset} />
              ))}
            </g>
          </mask>
        ) : null}
      </defs>
      <path d={d} fillRule="evenodd" fill={`url(#${id}-hatch)`} opacity={rung} mask={masked ? `url(#${id}-mask)` : undefined} />
      <g fill="none" strokeLinecap="butt" strokeLinejoin="round">
        {octaveDashes(k).map((q) => (
          <path key={q.p} d={borderD} stroke={INK} strokeOpacity={rung * q.op} strokeWidth={1.7 / k} strokeDasharray={`${(q.p * 0.58).toFixed(5)} ${(q.p * 0.42).toFixed(5)}`} />
        ))}
      </g>
    </g>
  );
};
/** a cream town; level 1 = INK_FULL .. 0 = INK_CONTEXT; r in screen px */
export const TownDot: React.FC<{ x: number; y: number; cam: Cam; r: number; level?: number }> = ({ x, y, cam, r, level = 1 }) => {
  const k = cam.k;
  const op = INK_CONTEXT + (INK_FULL - INK_CONTEXT) * clamp01(level);
  return (
    <g>
      <circle cx={x} cy={y} r={(r + 1.4) / k} fill={DARK} fillOpacity={0.66} />
      <circle cx={x} cy={y} r={r / k} fill={mixColor(DARK, INK, 0.3 + 0.7 * op)} />
    </g>
  );
};
