// ---------------------------------------------------------------------------
// vikAmericasShared: THE AMERICAS WORLD of the clip "Sheppard_Vikings" (Dwarkesh
// with Si Sheppard; Dwarkesh map style), shared read-only by cut A
// (LearningFromEachOther) and cut B (IncasEvenKnewTheAztecs). Once
// CF/animation_source/notes/AMERICAS_READY.md exists the existing exports never
// change; additions only (dated CHANGED: lines in that file).
//
// THE WORLD. North-up spherical MERCATOR, baked by
// scripts/build-vik-americas-map.mjs (vikAmericasMapData.ts / vikAmericasStatic.ts):
//   x = 540 + (lon + 85) * 20      y = 843 - 20 * M(lat)
//   M(lat) = (180 / pi) ln tan(pi / 4 + lat / 2)
// 20 world px per degree of longitude (0.18 world px per km at the equator).
// World px == screen px in THE WIDE, WIDE_CAM { k: 1, cx: 540, cy: 960 }: lon
// 112 W .. 58 W across the 1080 px, Mexico top-left, Hispaniola top-right, Peru
// lower-right; the Aztec realm's top on y 392, Cuzco on y 1116.
// The static map (sea, 4 engraved water-lines, 10 deg graticule, land + #6A5838
// rim, Lakes Titicaca and Poopo, cream coast; NO borders) is a tiled raster LOD
// pyramid (scripts/bake-vik-americas-rasters.mjs -> public/vik-americas/*.png,
// vikAmericasLevels.ts):
//   far   k <= 1.30         (sharp to k 1.58; any view of k >= 0.85 centred in
//                            world x 300..800, y 700..1200)
//   near  band k 1.30-1.45  (sharp to k 2.9; any subject in lon 112 W .. 58 W,
//                            lat 28 N .. 24 S anywhere in the content band)
// HOLD THE CAMERA OUTSIDE k 1.30-1.45 (crossing it in a move is fine). Check a
// track with mapSharpness(cam) (texelsPerPx >= ~0.95 = sharp).
//
// PALETTE RULE OF THIS CLIP: house orange (ACCENT #FFB000 / ACCENT_DEEP
// #D98A0C) = WHAT IS PASSED ON (the Spaniards' playbook). The native realms,
// the coasts and all context are cream (INK_FULL 0.94 in play, INK_CONTEXT 0.5).
//
// API (world px unless noted)
//   from cortesShared (re-exported, projection-free): palette SEA LAND LAND_RIM INK
//     ACCENT ACCENT_DEEP DARK INK_FULL INK_CONTEXT; FPS FRAME_W FRAME_H SCREEN_CX
//     SCREEN_CY CONTENT_Y CAM_LIFT CAPTION_TOP; type Cam { k, cx, cy }, CamKey, P2,
//     Route; screenOf(p, cam) worldOf(sp, cam) camFor(p, k, sx = 540, sy = 835)
//     viewRect(cam, marginPx) camTransform(cam) sway(frame) swayCam(cam, frame)
//     pchip(keys, heldEnds?) makeCamera(keys, heldEnds?) makeTrack(bumps, v0)
//     camScan(camAt, f0, f1, pts?) makeRoute({ pts, wpS, len }) PaperTop WorldSvg
//     CityDot MapLabel labelSlide LABEL_* fellSC clamp01 smoothstep smootherstep
//     hash mixColor
//   project(lon, lat) -> P2; unproject([x, y]) -> [lon, lat]; PX_PER_DEG (20)
//   WIDE_CAM; SITES.{santoDomingo, santiago, veracruz, tenochtitlan, panama,
//     tumbes, cajamarca, cuzco} { x, y, lon, lat }
//   MAP: <MapStack cam /> (LOD tiles + world-space mottle); <MapPage cam vignette?>
//     children </MapPage> = MapStack + children + PaperTop; levelWeights(cam);
//     mapSharpness(cam) -> { level, weight, texelsPerPx, weights }
//   REALMS (data: AZTEC_REALM, INCA_REALM = { d (evenodd, clipped to land), polys,
//     capital, rMax, centroid, box }):
//     <AztecRealm cam reveal? opacity? /> / <IncaRealm cam reveal? opacity? />
//       cream wash + fine octave-stable hatch + a 3 px cream edge over a dark
//       casing. reveal 0..1 (default 1) raises the realm behind a crisp circular
//       front spreading from its capital (Tenochtitlan / Cuzco); the front carries
//       a fine cream line while it travels. opacity (default 1) fades the group.
//     <Realm realm id cam reveal? opacity? /> the generic piece
//   THE PLAYBOOK CHAIN (CHANGED 2026-10-06: TWO CLEAN BOWS, knowledge not a ship's
//     track: leg 1 Santo Domingo -> Tenochtitlan bowing north over Cuba / the Gulf,
//     leg 2 Tenochtitlan -> Cajamarca bowing west over the open Pacific. CHAIN: a
//     Route, length CHAIN_LEN; CHAIN_S.{santoDomingo, tenochtitlan, cajamarca} =
//     arclength at each node (the santiago / veracruz / panama / tumbes entries
//     remain as the chain's nearest point to each: they are no longer on the
//     line); chainHead(progress) -> P2):
//     <PlaybookChain cam progress? frame? beads? opacity? width? nodeSize?
//       beadSpeed? beadGap? /> the orange line (dark casing under it) drawn from
//       Santo Domingo to progress x CHAIN_LEN; the three node marks (Santo
//       Domingo, Tenochtitlan, Cajamarca: a solid orange dot in a thin orange
//       ring) light as the head covers the last NODE_LEAD world px before each
//       (Santo Domingo is alight from progress 0); beads (0..1, default 1) =
//       the opacity of the travelling beads, which ride the DRAWN part only, one
//       direction, on the clock `frame` (beadSpeed world px / frame, beadGap
//       world px apart). chainWidth(k) = 6 k^0.35 and nodeSize(k) = 36 k^0.3
//       screen px are the defaults.
//     <ChainNode x y cam lit? size? /> one node mark
//   THE DEAD TIES (TIE_AZTEC, TIE_INCA: Routes on land, Pacific side):
//     <DeadTie from="aztec" | "inca" cam progress? opacity? width? /> a cream
//       dashed line (world-anchored octave dashes) that sets out from its realm
//       toward the other; along its length it thins and fades to nothing at the
//       route's end, far short of the other realm (progress 0..1 = how far the
//       pen has got; the taper is fixed to the route, not to the head)
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import {
  ACCENT,
  DARK,
  FRAME_H,
  FRAME_W,
  INK,
  INK_FULL,
  PaperTop,
  SEA,
  camTransform,
  clamp01,
  makeRoute,
  mixColor,
  smoothstep,
  viewRect,
  type Cam,
  type P2,
} from "./cortesShared";
import { LEVELS, type Level } from "./vikAmericasLevels";
import {
  AZTEC_REALM,
  CHAIN_LEN,
  CHAIN_PTS,
  CHAIN_S,
  INCA_REALM,
  PROJ,
  SITES,
  TIE_AZTEC_LEN,
  TIE_AZTEC_PTS,
  TIE_INCA_LEN,
  TIE_INCA_PTS,
  type RealmData,
} from "./vikAmericasMapData";

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
export { AZTEC_REALM, CHAIN_LEN, CHAIN_S, INCA_REALM, SITES };
export type { RealmData };

// ---------------------------------------------------------------------------
// THE PROJECTION
// ---------------------------------------------------------------------------
export const PX_PER_DEG = PROJ.pxPerDeg;
const mercDeg = (lat: number) => (180 / Math.PI) * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
export const project = (lon: number, lat: number): P2 => [PROJ.x0 + (lon - PROJ.lon0) * PROJ.pxPerDeg, PROJ.yEq - PROJ.pxPerDeg * mercDeg(lat)];
export const unproject = ([x, y]: P2): P2 => [
  PROJ.lon0 + (x - PROJ.x0) / PROJ.pxPerDeg,
  (Math.atan(Math.exp(((PROJ.yEq - y) / PROJ.pxPerDeg) * (Math.PI / 180))) * 360) / Math.PI - 90,
];
/** THE WIDE: both realms + Hispaniola; world px == screen px */
export const WIDE_CAM: Cam = { k: 1, cx: 540, cy: 960 };

// ---------------------------------------------------------------------------
// THE MAP (cortesShared's MapStack over this world's levels)
// ---------------------------------------------------------------------------
const COVER_FADE = 48;
export const levelWeights = (cam: Cam) => {
  const v = viewRect(cam, 16);
  return (LEVELS as Level[]).map((L) => {
    const kw = L.band ? smoothstep(Math.log(cam.k / L.band[0]) / Math.log(L.band[1] / L.band[0])) : 1;
    if (kw <= 0) return 0;
    if (!L.band) return 1;
    const inset = Math.min(v.x0 - L.x0, L.x0 + L.w - v.x1, v.y0 - L.y0, L.y0 + L.h - v.y1) * cam.k;
    return kw * smoothstep(inset / COVER_FADE);
  });
};
/** the level that dominates this camera's frame and its sharpness (texels per screen px; >= ~0.95 sharp) */
export const mapSharpness = (cam: Cam) => {
  const w = levelWeights(cam);
  let top = 0;
  for (let i = 0; i < w.length; i++) if (w[i] >= 0.5) top = i;
  return { level: LEVELS[top].name, weight: w[top], texelsPerPx: LEVELS[top].s / cam.k, weights: w };
};
export const MapStack: React.FC<{ cam: Cam; mottleOpacity?: number; mottleSrc?: string }> = ({
  cam,
  mottleOpacity = 0.9,
  mottleSrc = "manchuria/mottle.png",
}) => {
  const { k } = cam;
  const { tx, ty } = camTransform(cam);
  const w = levelWeights(cam);
  const v = viewRect(cam, 24);
  const layers = (LEVELS as Level[]).map((L, li) => {
    if (w[li] <= 0.001) return null;
    if (w.some((o, j) => j > li && o >= 0.999)) return null;
    const tiles = L.tiles.filter((t) => t.x0 < v.x1 && t.x0 + t.w > v.x0 && t.y0 < v.y1 && t.y0 + t.h > v.y0);
    return (
      <div key={L.name} style={{ position: "absolute", left: 0, top: 0, width: FRAME_W, height: FRAME_H, opacity: w[li] }}>
        {tiles.map((t) => (
          <Img
            key={t.f}
            src={staticFile(`vik-americas/${t.f}`)}
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
// THE REALMS. One engraved family (tlaxShared's): a flat cream wash, a
// world-anchored line hatch at a fixed angle, octave-stable (the spacing stays
// HATCH_PX .. 2 HATCH_PX on screen through any zoom), a 3 px cream edge over a
// dark casing.
// ---------------------------------------------------------------------------
export const HATCH_ANGLE = 45;
export const HATCH_PX = 8; // screen px between lines when the mid line is full
export const REALM_WASH = 0.27; // the flat cream wash
export const REALM_HATCH = 0.62; // the hatch's opacity
export const REALM_EDGE = 3; // screen px
const hatchGeom = (k: number) => {
  const L2 = Math.log2(k);
  const o = Math.floor(L2);
  return { P: (2 * HATCH_PX) / Math.pow(2, o), mid: L2 - o };
};
export const Realm: React.FC<{ realm: RealmData; id: string; cam: Cam; reveal?: number; opacity?: number; edge?: number }> = ({
  realm,
  id,
  cam,
  reveal = 1,
  opacity = 1,
  edge = REALM_EDGE,
}) => {
  const rv = clamp01(reveal);
  if (opacity <= 0.002 || rv <= 0.0005) return null;
  const px = (v: number) => v / cam.k;
  const { P, mid } = hatchGeom(cam.k);
  const R = rv * realm.rMax * 1.015;
  const [cx, cy] = realm.capital;
  const partial = rv < 0.9995;
  const frontOp = partial ? 0.9 * (1 - smoothstep((rv - 0.8) / 0.2)) : 0;
  return (
    <g opacity={opacity < 0.999 ? opacity : undefined}>
      <defs>
        <pattern id={`vikHatch-${id}`} patternUnits="userSpaceOnUse" width={P} height={P} patternTransform={`rotate(${HATCH_ANGLE})`}>
          <line x1={0} y1={-1} x2={0} y2={P + 1} stroke={INK} strokeWidth={px(1.3)} />
          <line x1={P / 2} y1={-1} x2={P / 2} y2={P + 1} stroke={INK} strokeWidth={px(1.3)} strokeOpacity={mid} />
          <line x1={P} y1={-1} x2={P} y2={P + 1} stroke={INK} strokeWidth={px(1.3)} />
        </pattern>
        {partial ? (
          <>
            <clipPath id={`vikFront-${id}`}>
              <circle cx={cx} cy={cy} r={R} />
            </clipPath>
            <clipPath id={`vikBody-${id}`}>
              <path d={realm.d} clipRule="evenodd" />
            </clipPath>
          </>
        ) : null}
      </defs>
      <g clipPath={partial ? `url(#vikFront-${id})` : undefined}>
        <path d={realm.d} fillRule="evenodd" fill={INK} fillOpacity={REALM_WASH} />
        <path d={realm.d} fillRule="evenodd" fill={`url(#vikHatch-${id})`} opacity={REALM_HATCH} />
        <path d={realm.d} fill="none" stroke={DARK} strokeOpacity={0.5} strokeWidth={px(edge + 3)} strokeLinejoin="round" />
        <path d={realm.d} fill="none" stroke={INK} strokeOpacity={INK_FULL} strokeWidth={px(edge)} strokeLinejoin="round" />
      </g>
      {frontOp > 0.003 ? (
        <g clipPath={`url(#vikBody-${id})`}>
          <circle cx={cx} cy={cy} r={R} fill="none" stroke={INK} strokeOpacity={frontOp} strokeWidth={px(2.2)} />
        </g>
      ) : null}
    </g>
  );
};
/** CHANGED 2026-10-06: the (small) Aztec realm carries a 4 px edge by default */
export const AZTEC_EDGE = 4;
export const AztecRealm: React.FC<{ cam: Cam; reveal?: number; opacity?: number; edge?: number }> = (p) => <Realm realm={AZTEC_REALM} id="aztec" edge={AZTEC_EDGE} {...p} />;
export const IncaRealm: React.FC<{ cam: Cam; reveal?: number; opacity?: number; edge?: number }> = (p) => <Realm realm={INCA_REALM} id="inca" {...p} />;

// ---------------------------------------------------------------------------
// THE PLAYBOOK CHAIN
// ---------------------------------------------------------------------------
export const CHAIN = makeRoute({
  pts: CHAIN_PTS as P2[],
  wpS: [CHAIN_S.santoDomingo, CHAIN_S.santiago, CHAIN_S.veracruz, CHAIN_S.tenochtitlan, CHAIN_S.panama, CHAIN_S.tumbes, CHAIN_S.cajamarca],
  len: CHAIN_LEN,
});
export const chainHead = (progress: number): P2 => CHAIN.pointAt(clamp01(progress) * CHAIN_LEN);
/** the chain's line width (screen px) at zoom k */
export const chainWidth = (k: number) => 6 * Math.pow(k, 0.35);
/** a node mark's ring diameter (screen px) at zoom k */
export const nodeSize = (k: number) => 36 * Math.pow(k, 0.3);
export const NODE_LEAD = 45; // world px of the head's approach over which a node lights
/** scale = the node's size as a share of nodeSize(k) (CHANGED 2026-10-06: Tenochtitlan's is
 *  smaller, a ~30 px ring at k 1.25, so the Aztec realm reads round it) */
export const CHAIN_NODES: { key: "santoDomingo" | "tenochtitlan" | "cajamarca"; s: number; scale: number }[] = [
  { key: "santoDomingo", s: CHAIN_S.santoDomingo, scale: 1 },
  { key: "tenochtitlan", s: CHAIN_S.tenochtitlan, scale: 0.78 },
  { key: "cajamarca", s: CHAIN_S.cajamarca, scale: 1 },
];
/** how alight node i is for a head at progress (0..1) */
export const nodeLit = (i: number, progress: number) => smoothstep((clamp01(progress) * CHAIN_LEN - (CHAIN_NODES[i].s - NODE_LEAD)) / NODE_LEAD);
/** a node mark: a solid orange dot in a thin orange ring on a dark ground; size = the ring's diameter in screen px */
export const ChainNode: React.FC<{ x: number; y: number; cam: Cam; lit?: number; size?: number }> = ({ x, y, cam, lit = 1, size }) => {
  if (lit <= 0.003) return null;
  const R = ((size ?? nodeSize(cam.k)) / 2 / cam.k) * (0.72 + 0.28 * lit);
  const px = (v: number) => v / cam.k;
  return (
    <g opacity={lit}>
      <circle cx={x} cy={y} r={R + px(2.6)} fill={DARK} fillOpacity={0.62} />
      <circle cx={x} cy={y} r={R - px(1.5)} fill="none" stroke={ACCENT} strokeWidth={px(3)} />
      <circle cx={x} cy={y} r={R * 0.5} fill={ACCENT} />
    </g>
  );
};
export const PlaybookChain: React.FC<{
  cam: Cam;
  progress?: number;
  frame?: number;
  beads?: number;
  opacity?: number;
  width?: number;
  nodeSize?: number;
  beadSpeed?: number;
  beadGap?: number;
}> = ({ cam, progress = 1, frame = 0, beads = 1, opacity = 1, width, nodeSize: nodeSz, beadSpeed = 8, beadGap = 236 }) => {
  if (opacity <= 0.002) return null;
  const p = clamp01(progress);
  const head = p * CHAIN_LEN;
  const w = width ?? chainWidth(cam.k);
  const px = (v: number) => v / cam.k;
  const d = head > 0.05 ? CHAIN.partialD(0, head) : "";
  const beadEls: React.ReactNode[] = [];
  if (beads > 0.003 && head > 20) {
    const n = Math.ceil(CHAIN_LEN / beadGap);
    const span = n * beadGap;
    const END = 26; // world px over which a bead rises out of / sinks into a node
    for (let i = 0; i < n; i++) {
      const s = (((frame * beadSpeed + i * beadGap) % span) + span) % span;
      if (s > Math.min(head, CHAIN_LEN)) continue;
      const a = beads * smoothstep(s / END) * smoothstep((Math.min(head, CHAIN_LEN) - s) / END);
      if (a <= 0.01) continue;
      const [bx, by] = CHAIN.pointAt(s);
      beadEls.push(
        <g key={`b-${i}`} opacity={a}>
          <circle cx={bx} cy={by} r={px(w * 0.98 + 1.8)} fill={DARK} fillOpacity={0.7} />
          <circle cx={bx} cy={by} r={px(w * 0.98)} fill={ACCENT} />
          <circle cx={bx} cy={by} r={px(w * 0.42)} fill={mixColor(ACCENT, INK, 0.62)} />
        </g>,
      );
    }
  }
  return (
    <g opacity={opacity < 0.999 ? opacity : undefined}>
      {d ? (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d={d} stroke={DARK} strokeOpacity={0.62} strokeWidth={px(w + 3.6)} />
          <path d={d} stroke={ACCENT} strokeWidth={px(w)} />
        </g>
      ) : null}
      {beadEls}
      {CHAIN_NODES.map((nd, i) => (
        <ChainNode key={nd.key} x={SITES[nd.key].x} y={SITES[nd.key].y} cam={cam} lit={nodeLit(i, p)} size={(nodeSz ?? nodeSize(cam.k)) * nd.scale} />
      ))}
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE DEAD TIES
// ---------------------------------------------------------------------------
export const TIE_AZTEC = makeRoute({ pts: TIE_AZTEC_PTS as P2[], wpS: [0, TIE_AZTEC_LEN], len: TIE_AZTEC_LEN });
export const TIE_INCA = makeRoute({ pts: TIE_INCA_PTS as P2[], wpS: [0, TIE_INCA_LEN], len: TIE_INCA_LEN });
const TIE_DASH = 28; // screen px dash period at the bottom of an octave of k (60 % on)
const TIE_SEGS = 18;
/** world-anchored dashes that hold their screen size through a zoom: a period per octave of k (tlaxShared's) */
const tieDashes = (k: number) => {
  const L2 = Math.log2(k);
  const o = Math.floor(L2);
  const t = smoothstep((L2 - o - 0.25) / 0.5);
  const a = TIE_DASH / Math.pow(2, o);
  return [
    { p: a, op: 1 - t },
    { p: a / 2, op: t },
  ].filter((x) => x.op > 0.001);
};
export const DeadTie: React.FC<{ from: "aztec" | "inca"; cam: Cam; progress?: number; opacity?: number; width?: number }> = ({
  from,
  cam,
  progress = 1,
  opacity = 1,
  width = 8,
}) => {
  const route = from === "aztec" ? TIE_AZTEC : TIE_INCA;
  const head = clamp01(progress) * route.len;
  if (opacity <= 0.002 || head < 0.05) return null;
  const px = (v: number) => v / cam.k;
  const dashes = tieDashes(cam.k);
  const els: React.ReactNode[] = [];
  for (let i = 0; i < TIE_SEGS; i++) {
    const a = (route.len * i) / TIE_SEGS;
    const b = Math.min(head, (route.len * (i + 1)) / TIE_SEGS);
    if (b - a < 0.01) break;
    const t = (i + 0.5) / TIE_SEGS; // the taper belongs to the route, not to the head
    const op = INK_FULL * (1 - smoothstep((t - 0.58) / 0.42));
    if (op <= 0.01) continue;
    const w = width * (1 - 0.38 * t);
    const d = route.partialD(a, b);
    dashes.forEach((q) =>
      els.push(
        <path
          key={`t-${i}-${q.p}`}
          d={d}
          stroke={INK}
          strokeOpacity={op * q.op}
          strokeWidth={px(w)}
          strokeDasharray={`${(q.p * 0.6).toFixed(4)} ${(q.p * 0.4).toFixed(4)}`}
          strokeDashoffset={a.toFixed(4)}
        />,
      ),
    );
  }
  return (
    <g fill="none" strokeLinecap="butt" strokeLinejoin="round" opacity={opacity < 0.999 ? opacity : undefined}>
      {els}
    </g>
  );
};
