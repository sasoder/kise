// ---------------------------------------------------------------------------
// vikAtlanticShared: THE NORTH ATLANTIC WORLD, shared read-only by cut D
// (TriedToColonize) and cut E (DripFeed) of the clip "Sheppard_Vikings"
// (Dwarkesh with Si Sheppard; Dwarkesh map style). Once
// CF/animation_source/notes/ATLANTIC_READY.md exists the existing exports never
// change; additions only (appended to that file as dated CHANGED: lines).
//
// THE WORLD. North-up Lambert conformal conic, parallels 50/64, centre meridian
// 52 W (scripts/build-vik-atlantic-map.mjs -> vikAtlanticMapData.ts /
// vikAtlanticStatic.ts). k = 1 is the framing in which lon 72 W .. 32 W at lat
// 56 N spans the 1080 px width with (52 W, 56 N) at (540, 835): world px ==
// screen px at k 1. 0.4405 world px per km (PX_PER_KM). The static map (sea, 4
// engraved water-lines, 10 deg graticule, land + #6A5838 rim, natural lakes,
// cream coast; NO borders) is a tiled raster LOD pyramid
// (scripts/bake-vik-atlantic-rasters.mjs -> public/vik-atlantic/*.png,
// vikAtlanticLevels.ts):
//   far (base, sharp to k 0.75) | wide 0.62-0.70 (to 1.3) | stage 1.15-1.30
//   (to 2.5) | mid 2.2-2.5 (to 4.8) | near 4.2-4.7 (to 9; Belle Isle / north
//   Newfoundland) + gnear 4.2-4.7 (to 9; the Eastern Settlement) | close 7.2-8.0
//   (to 15; the tip of Newfoundland) | tight 12.5-14 (to 26; L'Anse aux Meadows)
//   | vtight 23-25.5 (to 40; L'Anse aux Meadows)
// HOLD THE CAMERA OUTSIDE THE BANDS (0.62-0.70, 1.15-1.30, 2.2-2.5, 4.2-4.7,
// 7.2-8.0, 12.5-14, 23-25.5): inside one, two levels' water-lines ghost. Check a track
// with mapSharpness(cam) (>= ~0.95 texels per screen px = sharp).
//
// THE CAMERA (cortesShared's, re-exported). A camera is { k, cx, cy }: world
// point (cx, cy) at the frame's centre (540, 960). CAPTION-SAFE RULE: the
// subject near y 835 (CONTENT_Y): camFor(p, k) puts p at (540, 835).
//
// ACCENT RULE OF THIS CLIP: house orange (ACCENT #FFB000 / ACCENT_DEEP #D98A0C)
// = WHAT IS PASSED ON: the Norse foothold, their line across the sea, the drip
// feed. The locals, the land, the labels: cream, two rungs (INK_FULL 0.94 in
// play, INK_CONTEXT 0.5 context; INK_GHOST 0.2 only for receded context).
//
// API (world px unless noted)
//   re-exported from cortesShared (projection-free): palette SEA LAND LAND_RIM
//     INK ACCENT ACCENT_DEEP DARK INK_FULL INK_CONTEXT; FPS FRAME_W FRAME_H
//     SCREEN_CX SCREEN_CY CONTENT_Y CAM_LIFT CAPTION_TOP; screenOf worldOf camFor
//     viewRect camTransform sway swayCam pchip makeCamera makeTrack camScan
//     makeRoute (Route) PaperTop WorldSvg CityDot MapLabel labelSlide LABEL_*
//     fellSC clamp01 smoothstep smootherstep hash mixColor; types Cam CamKey Bump
//     P2 Route
//   INK_GHOST (0.2)
//   project(lon, lat) -> [x, y]; PX_PER_KM; WORLD (the far level's rect)
//   SITES.{brattahlid, lanseAuxMeadows, capeFarewell, iceland} { x, y, lon, lat };
//     BRATTAHLID, LANSE, ICELAND_LANDFALL as P2
//   ROUTE_VINLAND (Route: Eastern Settlement -> Davis Strait -> Baffin -> the
//     Labrador coast -> L'Anse aux Meadows; len 1081.8; s = 0 at Greenland),
//     ROUTE_ICELAND (Route: Eastern Settlement -> round Cape Farewell -> west
//     Iceland; len 669.5; s = 0 at Greenland)
//   norseHead(progress, retract?, leg?) -> P2, the head of the line
//   MAP: <MapStack cam /> (LOD tiles + world-space mottle), <PaperTop /> last,
//     <MapPage cam>{children}</MapPage> = both; levelWeights(cam);
//     mapSharpness(cam); landAt(x, y) (Natural Earth 10m; 1/8 world px round the
//     tip of Newfoundland, 2 world px elsewhere on the stage)
//   OVERLAYS (draw inside <WorldSvg cam>; sizes in screen px):
//     <NorseRoute cam progress? retract? leg? color? dashed? opacity? width?
//       from? head? /> the sea line. progress 0..1 = how far the head has run
//       from Greenland; retract 0..1 pulls the head back toward Greenland (the
//       line shown is s 0 .. len * progress * (1 - retract)); leg "vinland"
//       (default) | "iceland"; color (default ACCENT); dashed = world-anchored
//       octave dashes (they never crawl) for a faint trace: pass color={INK}
//       opacity={INK_CONTEXT}; width (default 3.6 solid / 3 dashed); from 0..1
//       hides the Greenland end up to that fraction; head = a nib dot at the
//       head (default false)
//     <Longhouse x y cam size? ink? draw? opacity? ground? /> an engraved turf
//       longhouse in side elevation: a long low hall, a bowed turf roof, a door;
//       (x, y) = the middle of its foot; size = its width in screen px (default
//       160; 100 glyph units wide, 31 tall); ink = its line colour (default
//       ACCENT); draw 0..1 draws it as a pen would (the outline, then the eave
//       and the door, then the turf courses); ground 0..1 = the dark ground
//       inside it (default 1) so it reads over dots and coast
//     <SettlementMark x y cam r? ring? color? opacity? progress? /> an orange
//       dot (r 7 px) in a thin ring (ring 17 px): the Greenland settlement;
//       progress 0..1 draws the ring clockwise from the top
//     <PeopleDots dots cam r? /> people as dots, screen-sized (r = radius in
//       screen px, default 6.5): dots = { x, y, t (0 cream .. 1 orange), op?,
//       r? }[]; dark casings first, then cream fills, then the orange fills on
//       top (orange always wins an overlap)
//     octaveDashes(k): the world-anchored dash periods for this zoom
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import {
  ACCENT,
  DARK,
  FRAME_H,
  FRAME_W,
  INK,
  PaperTop,
  SEA,
  camTransform,
  makeRoute,
  mixColor,
  smoothstep,
  viewRect,
  type Cam,
  type P2,
} from "./cortesShared";
import { LEVELS } from "./vikAtlanticLevels";
import { LAND_MASK_FINE, LAND_MASK_STAGE, PROJ, PX_PER_KM, ROUTE_ICELAND_DATA, ROUTE_VINLAND_DATA, SITES } from "./vikAtlanticMapData";

export {
  ACCENT,
  ACCENT_DEEP,
  CAM_LIFT,
  CAPTION_TOP,
  CONTENT_Y,
  CityDot,
  DARK,
  FPS,
  FRAME_H,
  FRAME_W,
  INK,
  INK_CONTEXT,
  INK_FULL,
  LABEL_FADE,
  LABEL_FRAMES,
  LABEL_TRAVEL,
  LAND,
  LAND_RIM,
  MapLabel,
  PaperTop,
  SCREEN_CX,
  SCREEN_CY,
  SEA,
  WorldSvg,
  camFor,
  camScan,
  camTransform,
  clamp01,
  fellSC,
  hash,
  labelSlide,
  makeCamera,
  makeRoute,
  makeTrack,
  mixColor,
  pchip,
  screenOf,
  smootherstep,
  smoothstep,
  sway,
  swayCam,
  viewRect,
  worldOf,
} from "./cortesShared";
export type { Bump, Cam, CamKey, P2, Route } from "./cortesShared";
export { PX_PER_KM, SITES };

/** the third cream rung: receded context only */
export const INK_GHOST = 0.2;

// ---------------------------------------------------------------------------
// Projection (spherical LCC, identical to d3-geo's geoConicConformal with PROJ,
// center [0, 0]; asserted against the build's projected sites below)
// ---------------------------------------------------------------------------
const RAD = Math.PI / 180;
const tany = (y: number) => Math.tan((Math.PI / 2 + y) / 2);
const Y0 = PROJ.parallels[0] * RAD;
const Y1 = PROJ.parallels[1] * RAD;
const N_ = Math.log(Math.cos(Y0) / Math.cos(Y1)) / Math.log(tany(Y1) / tany(Y0));
const F_ = (Math.cos(Y0) * Math.pow(tany(Y0), N_)) / N_;
const rawLcc = (x: number, y: number): P2 => {
  const r = F_ / Math.pow(tany(y), N_);
  return [r * Math.sin(N_ * x), F_ - r * Math.cos(N_ * x)];
};
const C0 = rawLcc(0, 0);
export const project = (lon: number, lat: number): P2 => {
  const p = rawLcc((lon + PROJ.rotate[0]) * RAD, lat * RAD);
  return [PROJ.translate[0] + PROJ.scale * (p[0] - C0[0]), PROJ.translate[1] - PROJ.scale * (p[1] - C0[1])];
};
for (const s of Object.values(SITES)) {
  const [x, y] = project(s.lon, s.lat);
  if (Math.hypot(x - s.x, y - s.y) > 0.01) throw new Error("vikAtlanticShared.project() disagrees with the build");
}
/** the world the static map is baked over (the far level's rect) */
export const WORLD = { x0: LEVELS[0].x0, y0: LEVELS[0].y0, x1: LEVELS[0].x0 + LEVELS[0].w, y1: LEVELS[0].y0 + LEVELS[0].h };

/** Brattahlid, the Eastern Settlement of Norse Greenland (61.15 N 45.52 W) */
export const BRATTAHLID: P2 = [SITES.brattahlid.x, SITES.brattahlid.y];
/** L'Anse aux Meadows, the north tip of Newfoundland (51.596 N 55.533 W) */
export const LANSE: P2 = [SITES.lanseAuxMeadows.x, SITES.lanseAuxMeadows.y];
/** the Iceland end of ROUTE_ICELAND (Snaefellsnes, west Iceland) */
export const ICELAND_LANDFALL: P2 = [SITES.iceland.x, SITES.iceland.y];

// ---------------------------------------------------------------------------
// THE MAP: LOD tiles (vikAtlanticLevels.ts), world-space mottle, paper on top
// (cortesShared's MapStack over this world's levels)
// ---------------------------------------------------------------------------
const COVER_FADE = 48; // screen px: a level fades out as the frame's edge nears its rect's
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
  return { level: LEVELS[top].name, weight: w[top], texelsPerPx: LEVELS[top].s / cam.k, weights: w };
};
/** the baked map under the camera (no grain / vignette: see PaperTop) */
export const MapStack: React.FC<{ cam: Cam; mottleOpacity?: number; mottleSrc?: string }> = ({
  cam,
  mottleOpacity = 0.9,
  mottleSrc = "manchuria/mottle.png",
}) => {
  const { k } = cam;
  const { tx, ty } = camTransform(cam);
  const w = levelWeights(cam);
  const v = viewRect(cam, 24);
  const layers = LEVELS.map((L, li) => {
    if (w[li] <= 0.001) return null;
    // hidden under an opaque level above (an opaque weight implies full cover)
    if (w.some((o, j) => j > li && o >= 0.999)) return null;
    const tiles = L.tiles.filter((t) => t.x0 < v.x1 && t.x0 + t.w > v.x0 && t.y0 < v.y1 && t.y0 + t.h > v.y0);
    return (
      <div key={L.name} style={{ position: "absolute", left: 0, top: 0, width: FRAME_W, height: FRAME_H, opacity: w[li] }}>
        {tiles.map((t) => (
          <Img
            key={t.f}
            src={staticFile(`vik-atlantic/${t.f}`)}
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
  });
  // mottle tiles, world space, in octaves: stains keep ~ the same screen size through a zoom
  const L2m = Math.log2(k);
  const om = Math.floor(L2m);
  const tm = L2m - om;
  const mt: { x: number; y: number; s: number; o: number }[] = [];
  [
    { o: om, op: 1 - tm },
    { o: om + 1, op: tm },
  ].forEach(({ o, op }) => {
    if (op < 0.01) return;
    const S = 640 / Math.pow(2, o);
    const ox = ((((o * 173) % 640) + 640) % 640) - 320;
    const oy = ((((o * 311) % 640) + 640) % 640) - 320;
    const x0 = Math.floor((v.x0 - ox) / S) * S + ox;
    const y0 = Math.floor((v.y0 - oy) / S) * S + oy;
    for (let y = y0; y < v.y1; y += S) for (let x = x0; x < v.x1; x += S) mt.push({ x, y, s: S, o: op });
  });
  return (
    <>
      {layers}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: FRAME_W,
          height: FRAME_H,
          transformOrigin: "0 0",
          transform: `translate(${tx}px, ${ty}px) scale(${k})`,
          opacity: mottleOpacity,
        }}
      >
        {mt.map((t, i) => (
          <Img
            key={`m-${i}`}
            src={staticFile(mottleSrc)}
            style={{ position: "absolute", left: t.x, top: t.y, width: t.s * 1.002, height: t.s * 1.002, opacity: t.o }}
          />
        ))}
      </div>
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
// Land (bitmasks baked by the build)
// ---------------------------------------------------------------------------
type Mask = { x0: number; y0: number; s: number; w: number; h: number; b64: string };
const decode = (m: Mask) => {
  const bin = atob(m.b64);
  const a = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i);
  return a;
};
const MASKS = [LAND_MASK_FINE, LAND_MASK_STAGE].map((m) => ({ m: m as Mask, bits: decode(m as Mask) }));
/** is the world point on land (Natural Earth 10m)? false outside the stage */
export const landAt = (x: number, y: number) => {
  for (const { m, bits } of MASKS) {
    const i = Math.floor((x - m.x0) * m.s);
    const j = Math.floor((y - m.y0) * m.s);
    if (i < 0 || j < 0 || i >= m.w || j >= m.h) continue;
    const q = j * m.w + i;
    return ((bits[q >> 3] >> (q & 7)) & 1) === 1;
  }
  return false;
};

// ---------------------------------------------------------------------------
// THE NORSE ROUTES
// ---------------------------------------------------------------------------
/** Eastern Settlement -> Davis Strait -> Baffin -> the Labrador coast -> L'Anse aux Meadows (s = 0 at Greenland) */
export const ROUTE_VINLAND = makeRoute(ROUTE_VINLAND_DATA);
/** Eastern Settlement -> round Cape Farewell -> west Iceland (s = 0 at Greenland) */
export const ROUTE_ICELAND = makeRoute(ROUTE_ICELAND_DATA);
export type NorseLeg = "vinland" | "iceland";
const legRoute = (leg: NorseLeg) => (leg === "iceland" ? ROUTE_ICELAND : ROUTE_VINLAND);
const clamp = (v: number) => Math.max(0, Math.min(1, v));
/** the head of the Norse line at progress (0..1 from Greenland), pulled back by retract (0..1) */
export const norseHead = (progress: number, retract = 0, leg: NorseLeg = "vinland"): P2 => {
  const R = legRoute(leg);
  return R.pointAt(R.len * clamp(progress) * (1 - clamp(retract)));
};

const DASH = 11; // screen px dash period at the bottom of an octave (the Cortes clip's, 58 % on)
/** world-anchored dashes that hold their screen size through a zoom: a period per octave of k */
export const octaveDashes = (k: number) => {
  const L2 = Math.log2(k);
  const o = Math.floor(L2);
  const t = smoothstep((L2 - o - 0.25) / 0.5);
  const a = DASH / Math.pow(2, o);
  return [
    { p: a, op: 1 - t },
    { p: a / 2, op: t },
  ].filter((x) => x.op > 0.001);
};
/** THE NORSE SEA LINE (see the header). Draw inside <WorldSvg cam>. */
export const NorseRoute: React.FC<{
  cam: Cam;
  progress?: number;
  retract?: number;
  leg?: NorseLeg;
  color?: string;
  dashed?: boolean;
  opacity?: number;
  width?: number;
  from?: number;
  head?: boolean;
}> = ({ cam, progress = 1, retract = 0, leg = "vinland", color = ACCENT, dashed = false, opacity = 1, width, from = 0, head = false }) => {
  const R = legRoute(leg);
  const s0 = R.len * clamp(from);
  const s1 = R.len * clamp(progress) * (1 - clamp(retract));
  if (opacity <= 0.002 || s1 - s0 < 0.01) return null;
  const px = (v: number) => v / cam.k;
  const w = width ?? (dashed ? 3 : 3.6);
  const d = R.partialD(s0, s1);
  const [hx, hy] = R.pointAt(s1);
  const nib = head ? (
    <g>
      <circle cx={hx} cy={hy} r={px(w * 0.95 + 1.6)} fill={DARK} fillOpacity={0.6 * opacity} />
      <circle cx={hx} cy={hy} r={px(w * 0.95)} fill={color} fillOpacity={opacity} />
    </g>
  ) : null;
  if (!dashed)
    return (
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d={d} stroke={DARK} strokeOpacity={0.55 * opacity} strokeWidth={px(w + 2.8)} />
        <path d={d} stroke={color} strokeOpacity={opacity} strokeWidth={px(w)} />
        {nib}
      </g>
    );
  // the path starts at s0: shift the dashes back to s = 0's phase, so they never crawl
  return (
    <g fill="none" strokeLinecap="butt" strokeLinejoin="round">
      {octaveDashes(cam.k).map((q) => (
        <path
          key={`nd-${q.p}`}
          d={d}
          stroke={color}
          strokeOpacity={opacity * q.op}
          strokeWidth={px(w)}
          strokeDasharray={`${(q.p * 0.58).toFixed(5)} ${(q.p * 0.42).toFixed(5)}`}
          strokeDashoffset={s0}
        />
      ))}
      {nib}
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE LONGHOUSE: a Norse turf hall in side elevation, in the Fortress's
// engraved manner (one stroke family; a dark casing under coloured lines).
// Glyph units: 100 = `size` screen px wide; x -50 .. 50, y -31 (the ridge) .. 0
// (the foot); (0, 0) = the middle of its foot. The OUTLINE is one line a pen
// draws without lifting: along the foot from the middle to the west corner, up
// the low battered turf wall, over the long bowed roof, down the east wall and
// back along the foot. Then the eave and the door, then the turf courses.
// ---------------------------------------------------------------------------
const LH_OUTLINE = "M0,0 L-50,0 L-47.5,-9 C-41,-22 -27,-30 0,-31 C27,-30 41,-22 47.5,-9 L50,0 L0,0";
const LH_BODY = "M-50,0 L-47.5,-9 C-41,-22 -27,-30 0,-31 C27,-30 41,-22 47.5,-9 L50,0 Z";
const LH_DETAIL: { d: string; w: number; o: number }[] = [
  // the eave (the top of the turf wall), broken by the door
  { d: "M-47.5,-9 L-15,-9 M-1,-9 L47.5,-9", w: 1, o: 1 },
  // the door: a low porch in the long wall, west of the middle
  { d: "M-15,0 L-15,-11.5 C-15,-15.5 -1,-15.5 -1,-11.5 L-1,0", w: 1, o: 1 },
  // turf courses: two bowed lines under the ridge
  { d: "M-38,-13.5 C-30,-21 -17,-24.6 0,-25 C17,-24.6 30,-21 38,-13.5", w: 0.72, o: 0.8 },
  { d: "M-27,-12.5 C-20,-17.5 -10,-19.4 0,-19.6 C10,-19.4 20,-17.5 27,-12.5", w: 0.72, o: 0.8 },
  // the wall's turf blocks: short uprights along the long wall
  { d: "M-38,-1.2 L-38,-7.6 M-27,-1.2 L-27,-7.6 M9,-1.2 L9,-7.6 M20,-1.2 L20,-7.6 M31,-1.2 L31,-7.6 M41,-1.2 L41,-7.6", w: 0.72, o: 0.8 },
];
/** an engraved turf longhouse (see the header). Draw inside <WorldSvg cam>. */
export const Longhouse: React.FC<{
  x: number;
  y: number;
  cam: Cam;
  size?: number;
  ink?: string;
  draw?: number;
  opacity?: number;
  ground?: number;
}> = ({ x, y, cam, size = 160, ink = ACCENT, draw = 1, opacity = 1, ground = 1 }) => {
  if (opacity <= 0.002 || draw <= 0.0005) return null;
  const u = size / 100 / cam.k; // world px per glyph unit
  const sw = 100 / size; // 1 screen px in glyph units
  const pO = Math.min(1, draw / 0.6);
  const pD = clamp((draw - 0.5) / 0.5);
  const nD = LH_DETAIL.length;
  const detail = (i: number) => clamp(pD * (nD * 0.6 + 0.4) - i * 0.6);
  const groundOp = smoothstep((draw - 0.3) / 0.4) * ground;
  const W = 3.3; // screen px, the outline
  return (
    <g transform={`translate(${x} ${y}) scale(${u})`} strokeLinejoin="round" strokeLinecap="round">
      {/* the dark ground inside the hall, laid as the outline closes (not faded with the ink) */}
      {groundOp > 0.002 ? <path d={LH_BODY} fill={DARK} fillOpacity={0.62 * groundOp} stroke="none" /> : null}
      <g opacity={opacity}>
        <path d={LH_OUTLINE} fill="none" stroke={DARK} strokeOpacity={0.6} strokeWidth={(W + 2.6) * sw} pathLength={1} strokeDasharray={pO >= 1 ? undefined : `${pO} 1`} />
        <path d={LH_OUTLINE} fill="none" stroke={ink} strokeWidth={W * sw} pathLength={1} strokeDasharray={pO >= 1 ? undefined : `${pO} 1`} />
        {LH_DETAIL.map((q, i) => {
          const t = detail(i);
          if (t <= 0.001) return null;
          const da = t >= 1 ? undefined : `${t} 1`;
          return (
            <g key={`lh-${i}`}>
              <path d={q.d} fill="none" stroke={DARK} strokeOpacity={0.5} strokeWidth={(W * q.w + 2) * sw} pathLength={1} strokeDasharray={da} />
              <path d={q.d} fill="none" stroke={ink} strokeOpacity={q.o} strokeWidth={W * q.w * sw} pathLength={1} strokeDasharray={da} />
            </g>
          );
        })}
      </g>
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE SETTLEMENT MARK and PEOPLE
// ---------------------------------------------------------------------------
/** an orange dot in a thin ring: the Greenland settlement. progress 0..1 draws the ring clockwise from the top */
export const SettlementMark: React.FC<{
  x: number;
  y: number;
  cam: Cam;
  r?: number;
  ring?: number;
  color?: string;
  opacity?: number;
  progress?: number;
}> = ({ x, y, cam, r = 7, ring = 17, color = ACCENT, opacity = 1, progress = 1 }) => {
  if (opacity <= 0.002) return null;
  const px = (v: number) => v / cam.k;
  const R = px(ring);
  const C = 2 * Math.PI * R;
  const dash = progress >= 0.999 ? undefined : `${(C * clamp(progress)).toFixed(4)} ${C.toFixed(4)}`;
  return (
    <g opacity={opacity}>
      {progress > 0.001 ? (
        <g transform={`rotate(-90 ${x} ${y})`} fill="none" strokeLinecap="round">
          <circle cx={x} cy={y} r={R} stroke={DARK} strokeOpacity={0.55} strokeWidth={px(4.6)} strokeDasharray={dash} />
          <circle cx={x} cy={y} r={R} stroke={color} strokeWidth={px(2.6)} strokeDasharray={dash} />
        </g>
      ) : null}
      <circle cx={x} cy={y} r={px(r + 1.7)} fill={DARK} fillOpacity={0.62} />
      <circle cx={x} cy={y} r={px(r)} fill={color} />
    </g>
  );
};

export type PersonDot = { x: number; y: number; t: number; op?: number; r?: number };
/** people as dots, screen-sized: dark casings first, then cream fills, then the orange fills on top */
export const PeopleDots: React.FC<{ dots: PersonDot[]; cam: Cam; r?: number }> = ({ dots, cam, r = 6.5 }) => {
  const px = (v: number) => v / cam.k;
  const cas = 1.7;
  const vis = dots.filter((d) => (d.op ?? 1) > 0.002);
  const fill = (d: PersonDot, i: number, key: string) => (
    <circle key={`${key}${i}`} cx={d.x} cy={d.y} r={px(d.r ?? r)} fill={d.t <= 0.001 ? INK : d.t >= 0.999 ? ACCENT : mixColor(INK, ACCENT, d.t)} fillOpacity={d.op ?? 1} />
  );
  return (
    <g>
      {vis.map((d, i) => (
        <circle key={`c${i}`} cx={d.x} cy={d.y} r={px((d.r ?? r) + cas)} fill={DARK} fillOpacity={0.62 * (d.op ?? 1)} />
      ))}
      {vis.filter((d) => d.t < 0.5).map((d, i) => fill(d, i, "f"))}
      {vis.filter((d) => d.t >= 0.5).map((d, i) => (
        <circle key={`oc${i}`} cx={d.x} cy={d.y} r={px((d.r ?? r) + cas)} fill={DARK} fillOpacity={0.62 * (d.op ?? 1)} />
      ))}
      {vis.filter((d) => d.t >= 0.5).map((d, i) => fill(d, i, "o"))}
    </g>
  );
};
