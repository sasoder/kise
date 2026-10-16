// ---------------------------------------------------------------------------
// tlaxShared: THE TLAXCALA WORLD, shared read-only by the five cuts of the clip
// "Sheppard_Tlaxcalans_thought_they_used_Cortes" (Dwarkesh with Si Sheppard;
// Dwarkesh map style): CarvedOutOfTheAztecs (A), SeemedImpressive (B),
// SubordinatedPeoples (C), FlockingToHisBanner (D), HalfOfOnePercent (E). ONE
// continuous map film; each cut opens on the previous cut's last frame. Once
// SP/tlax/WORLD_READY.md exists the existing exports never change; additions only.
//
// IT IS THE CORTES WORLD (cortesShared.tsx: the projection, world px, palette,
// camera runners, the baked land) plus this clip's pieces (scripts/
// build-tlax-map.mjs -> tlaxMapData.ts / tlaxStatic.ts; scripts/
// bake-tlax-rasters.mjs -> public/tlax/*.png, tlaxLevels.ts). Never edit
// cortesShared, its data or its rasters.
//
// PALETTE RULE OF THIS CLIP: house orange (ACCENT #FFB000 / ACCENT_DEEP
// #D98A0C) = THE AZTECS' ENEMIES ONLY: Tlaxcala first, then every people who
// turns on the Aztecs (their land, their claims, their warriors). The Aztec
// empire is CREAM, and so are the conquistadors (the instrument). (cortesShared's
// comments say orange = Cortes's side: that was the previous clip; not here.)
// Cream at two rungs: INK_FULL 0.94 in play, INK_CONTEXT 0.5 context.
//
// THE CLIP CLOCK. DURATIONS { A 132, B 99, C 210, D 249, E 151 }; each cut's f0
// IS the previous cut's last frame, so CLIP_G0 { A 0, B 131, C 229, D 438,
// E 686 } (asserted below) and G(cut, f) = CLIP_G0[cut] + f. sway()/swayCam()
// and every drift take G, never f.
//
// THE MAP. <MapStack cam /> = the Cortes LOD pyramid (public/cortes) + three
// VALLEY levels on top (public/tlax), over the valley box lon 99.45 W - 97.40 W,
// lat 18.62 N - 19.95 N (Valley of Mexico, Tlaxcala, Cholula, the claim):
//   valley  band k 7.6-8.4  (sharp to k 16.8)
//   valley2 band k 15.2-16.4 (sharp to k 28.4)
//   valley3 band k 25-27    (sharp to k 44.7)
// for any subject in the box anywhere in the content band (x 240..840,
// y 640..1060). Below k 7.6 the Cortes levels serve (bands 6.6-7.2, 4.6-5.0,
// 3.3-3.6, 2.05-2.3, 1.36-1.52). HOLD THE CAMERA OUTSIDE EVERY BAND. Lake
// Texcoco in the valley levels is the SMOOTHED ring (LAKE_SMOOTH; its inner
// water-line a constant 2.0 world px inside the shore), the same ring the
// overlays cut out of the empire. mapSharpness(cam) (>= ~0.95 = sharp) and
// levelWeights(cam) cover all levels. <PaperTop /> last; <MapPage cam>.
//
// API (world px unless noted; 0.383 world px per km)
//   from cortesShared (re-exported): palette SEA LAND LAND_RIM INK ACCENT
//     ACCENT_DEEP DARK INK_FULL INK_CONTEXT; FPS FRAME_W FRAME_H SCREEN_CX
//     SCREEN_CY CONTENT_Y CAM_LIFT CAPTION_TOP; project PX_PER_KM screenOf worldOf
//     camFor viewRect camTransform sway swayCam pchip makeCamera makeTrack camScan
//     makeRoute (Route) PaperTop WorldSvg CityDot MapLabel labelSlide LABEL_*
//     fellSC clamp01 smoothstep smootherstep hash mixColor landAt; the Cortes
//     world's SITES, LAKE_TEXCOCO(_D), EMPIRE_D / EMPIRE_POLYS / EMPIRE_BORDER_D
//     (the UNSMOOTHED Cortes empire: do not draw it in this clip, use EMPIRE_T_*)
//   CLIP: DURATIONS, CLIP_G0, G(cut, f), type Cut
//   SITES_T.{tlaxcala, cholula, texcoco, tenochtitlan} { x, y, lon, lat }
//   THE EMPIRE (smoothed, clipped to land, the lake removed): EMPIRE_T_D
//     (evenodd), EMPIRE_T_POLYS, EMPIRE_REST_D (= minus the claim),
//     EMPIRE_CENTROID, EMPIRE_BOX (with the Soconusco exclave), EMPIRE_MAIN_BOX;
//     borders over land (open polylines, svg d): BORDER_OUTER_D (the outer ring
//     without the two notch edges), BORDER_SOCONUSCO_D
//   ENCLAVES.{tlaxcala, teotitlan, metztitlan, yopitzinco}: { ring (lon/lat),
//     d (world px, clipped to land), polys, border (its edge with the empire) };
//     TLAX_RING (world px). CREAM_BORDERS_D = every empire border except
//     Tlaxcala's (A/B's dashed cream line).
//   LAKE_SMOOTH (world px ring), LAKE_SMOOTH_D
//   THE CLAIM (cut A): CLAIM_D, CLAIM_POLYS, CLAIM_CENTRE, CLAIM_P1 (east, where
//     the pen starts on Tlaxcala's border), CLAIM_P2 (west, where it closes);
//     PEN (a Route: the arc P1 -> P2, length PEN_ARC_LEN, then the tie to
//     Tenochtitlan, length PEN_LEN)
//   HATCH (world-anchored, fixed angle HATCH_ANGLE, octave-stable spacing; the
//     cream and orange hatches share line positions):
//     <EmpireHatch d cam opacity? solidity? wash? /> cream hatch; solidity 0 =
//       context rung, 1 = full rung (cut B raises it); wash (default true) = the
//       flat cream wash under it at the same solidity (CHANGED 2026-10-04)
//     <EmpireWash d opacity? solidity? /> the wash alone: INK at 0 -> WASH_FULL
//       (0.17); seamless only within one path, so wash adjacent cells at one
//       solidity as ONE EmpireWash of their joined d's (and EmpireHatch wash={false})
//     <EmpireBorder d cam opacity? solidity? /> fine dashed cream (0) -> solid
//       engraved cream line, 3 px over a dark casing (1)
//     <EnemyHatch d cam opacity? /> orange hatch + deep fill (held land);
//       CLAIM_RUNG (0.62) = the claim's opacity (claimed, not held)
//     <EnemyBorder d cam opacity? /> solid orange engraved line
//     <EmpireLayer cam solidity? /> the standard state of A/B: the cream empire
//       (rest + the claim's ground), Tlaxcala orange, the cream borders. Cut A's
//       f0 and cut B's f98 are this layer (solidity 0 / 1) + <TlaxcalaClaims />.
//   PEN: <PenLine route cam s0 s1 dashed? dashFrom? width? opacity? />
//     orange engraved line along route from s0 to s1 (dashed: world-anchored
//     octave dashes phased from dashFrom); <PenNib x y cam opacity? /> the
//     6 px orange nib
//   <Fortress x y cam size progress? opacity? /> an engraved stone citadel in
//     orange outline + orange hatching on a dark ground, (x, y) = the middle of
//     its base; size = screen px of its 100-unit height; progress 0..1 draws it
//     as a pen would (outline first, then the hatching); fortressSize(k) = the
//     clip's law, FORT_S0 k^0.6 px (the Carrack's); fortressNib(progress) = the
//     pen's point in glyph units (for the nib)
//   <TlaxcalaClaims cam opacity? ... /> cut A's END state of the claim in one
//     line: the carved piece (orange, CLAIM_RUNG), its pen outline, the dashed
//     tie, the fortress on Tenochtitlan. Its optional props are cut A's
//     animation; B-E pass only cam (and opacity).
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import {
  ACCENT,
  ACCENT_DEEP,
  DARK,
  FRAME_H,
  FRAME_W,
  INK,
  INK_CONTEXT,
  INK_FULL,
  PaperTop,
  SEA,
  SCREEN_CX,
  camTransform,
  makeRoute,
  smoothstep,
  viewRect,
  type Cam,
  type P2,
} from "./cortesShared";
import { LEVELS as CORTES_LEVELS, type Level } from "./cortesLevels";
import { LEVELS as VALLEY_LEVELS } from "./tlaxLevels";
import {
  BORDER_OUTER_D,
  BORDER_SOCONUSCO_D,
  CLAIM_CENTRE,
  CLAIM_D,
  CLAIM_P1,
  CLAIM_P2,
  CLAIM_POLYS,
  EMPIRE_BOX,
  EMPIRE_CENTROID,
  EMPIRE_MAIN_BOX,
  EMPIRE_REST_D,
  EMPIRE_T_D,
  EMPIRE_T_POLYS,
  ENCLAVES,
  LAKE_SMOOTH,
  PEN_ARC_LEN,
  PEN_LEN,
  PEN_PTS,
  SITES_T,
  TLAX_RING,
} from "./tlaxMapData";

export {
  ACCENT,
  ACCENT_DEEP,
  CAM_LIFT,
  CAPTION_TOP,
  CONTENT_Y,
  CityDot,
  DARK,
  EMPIRE_BORDER_D,
  EMPIRE_D,
  EMPIRE_POLYS,
  FPS,
  FRAME_H,
  FRAME_W,
  INK,
  INK_CONTEXT,
  INK_FULL,
  LABEL_FADE,
  LABEL_FRAMES,
  LABEL_TRAVEL,
  LAKE_TEXCOCO,
  LAKE_TEXCOCO_D,
  LAND,
  LAND_RIM,
  MapLabel,
  PX_PER_KM,
  PaperTop,
  SCREEN_CX,
  SCREEN_CY,
  SEA,
  SITES,
  WorldSvg,
  camFor,
  camScan,
  camTransform,
  clamp01,
  fellSC,
  hash,
  labelSlide,
  landAt,
  makeCamera,
  makeRoute,
  makeTrack,
  mixColor,
  pchip,
  project,
  screenOf,
  smootherstep,
  smoothstep,
  sway,
  swayCam,
  viewRect,
  worldOf,
} from "./cortesShared";
export type { Bump, Cam, CamKey, P2, Route } from "./cortesShared";
export {
  BORDER_OUTER_D,
  BORDER_SOCONUSCO_D,
  CLAIM_CENTRE,
  CLAIM_D,
  CLAIM_P1,
  CLAIM_P2,
  CLAIM_POLYS,
  EMPIRE_BOX,
  EMPIRE_CENTROID,
  EMPIRE_MAIN_BOX,
  EMPIRE_REST_D,
  EMPIRE_T_D,
  EMPIRE_T_POLYS,
  ENCLAVES,
  LAKE_SMOOTH,
  PEN_ARC_LEN,
  PEN_LEN,
  SITES_T,
  TLAX_RING,
};

// ---------------------------------------------------------------------------
// THE CLIP CLOCK
// ---------------------------------------------------------------------------
export type Cut = "A" | "B" | "C" | "D" | "E";
export const DURATIONS: Record<Cut, number> = { A: 132, B: 99, C: 210, D: 249, E: 151 };
export const CLIP_G0: Record<Cut, number> = { A: 0, B: 131, C: 229, D: 438, E: 686 };
{
  const order: Cut[] = ["A", "B", "C", "D", "E"];
  for (let i = 1; i < order.length; i++) {
    const p = order[i - 1];
    const c = order[i];
    if (CLIP_G0[c] !== CLIP_G0[p] + DURATIONS[p] - 1) throw new Error(`CLIP_G0.${c} must be CLIP_G0.${p} + DURATIONS.${p} - 1`);
  }
}
/** the clip clock: global frame of cut's frame f */
export const G = (cut: Cut, f: number) => CLIP_G0[cut] + f;

// ---------------------------------------------------------------------------
// THE MAP: the Cortes pyramid + the valley levels
// ---------------------------------------------------------------------------
type LevelT = Level & { dir: string };
export const ALL_LEVELS: LevelT[] = [...CORTES_LEVELS.map((L) => ({ ...L, dir: "cortes" })), ...VALLEY_LEVELS.map((L) => ({ ...L, dir: "tlax" }))];
const COVER_FADE = 48; // screen px (cortesShared's)
/** each level's opacity for this camera (cortesShared's rule, over all levels) */
export const levelWeights = (cam: Cam) => {
  const v = viewRect(cam, 16);
  return ALL_LEVELS.map((L) => {
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
  return { level: ALL_LEVELS[top].name, weight: w[top], texelsPerPx: ALL_LEVELS[top].s / cam.k, weights: w };
};
/** the baked map under the camera (cortesShared's MapStack over ALL_LEVELS; no grain / vignette: see PaperTop) */
export const MapStack: React.FC<{ cam: Cam; mottleOpacity?: number; mottleSrc?: string }> = ({
  cam,
  mottleOpacity = 0.9,
  mottleSrc = "manchuria/mottle.png",
}) => {
  const { k } = cam;
  const { tx, ty } = camTransform(cam);
  const w = levelWeights(cam);
  const v = viewRect(cam, 24);
  const layers = ALL_LEVELS.map((L, li) => {
    if (w[li] <= 0.001) return null;
    if (w.some((o, j) => j > li && o >= 0.999)) return null;
    const tiles = L.tiles.filter((t) => t.x0 < v.x1 && t.x0 + t.w > v.x0 && t.y0 < v.y1 && t.y0 + t.h > v.y0);
    return (
      <div key={`${L.dir}-${L.name}`} style={{ position: "absolute", left: 0, top: 0, width: FRAME_W, height: FRAME_H, opacity: w[li] }}>
        {tiles.map((t) => (
          <Img
            key={t.f}
            src={staticFile(`${L.dir}/${t.f}`)}
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
// SHAPES
// ---------------------------------------------------------------------------
const dOf = (pts: P2[], close = false) =>
  pts.length ? `M${pts.map(([x, y]) => `${x.toFixed(3)},${y.toFixed(3)}`).join("L")}${close ? "Z" : ""}` : "";
export const LAKE_SMOOTH_D = dOf(LAKE_SMOOTH as P2[], true);
/** every empire border except Tlaxcala's: the outer ring, Soconusco, and the edges of
 *  Teotitlan, Metztitlan and Yopitzinco (A/B's dashed cream line) */
export const CREAM_BORDERS_D = [BORDER_OUTER_D, BORDER_SOCONUSCO_D, ENCLAVES.teotitlan.border, ENCLAVES.metztitlan.border, ENCLAVES.yopitzinco.border].join("");
/** the pen's polyline as a route: arc P1 -> P2 (s 0 .. PEN_ARC_LEN), then the tie (.. PEN_LEN) */
export const PEN = makeRoute({ pts: PEN_PTS as P2[], wpS: [0, PEN_ARC_LEN, PEN_LEN], len: PEN_LEN });

// ---------------------------------------------------------------------------
// HATCH + BORDERS. One engraved family: world-anchored line hatch at a fixed
// angle; octave-stable (a period per octave of k, the mid line fading in
// across it: EmpireAtMyDisposal / koreaShared), so the spacing stays HATCH_PX ..
// 2 HATCH_PX on screen through any zoom. Cream and orange share the lines.
// ---------------------------------------------------------------------------
export const HATCH_ANGLE = 45; // degrees
export const HATCH_PX = 9; // screen px between lines when the mid line is full
const HATCH_W_INK = 1.35; // screen px, the cream line
const HATCH_W_ACC = 1.9; // screen px, the orange line
export const HATCH_INK_RUNG = { context: 0.42, full: 0.82 }; // the cream hatch's opacity at solidity 0 / 1
export const CLAIM_RUNG = 0.62; // the claim (claimed, not held): one rung under Tlaxcala
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
const hatchGeom = (k: number) => {
  const L2 = Math.log2(k);
  const o = Math.floor(L2);
  return { P: (2 * HATCH_PX) / Math.pow(2, o), mid: L2 - o };
};
/** the two hatch patterns (ids tlxHatchInk / tlxHatchAcc); identical for every svg of a frame */
const HatchDefs: React.FC<{ cam: Cam }> = ({ cam }) => {
  const { P, mid } = hatchGeom(cam.k);
  const lines = (color: string, w: number) => (
    <>
      <line x1={0} y1={-1} x2={0} y2={P + 1} stroke={color} strokeWidth={w / cam.k} />
      <line x1={P / 2} y1={-1} x2={P / 2} y2={P + 1} stroke={color} strokeWidth={w / cam.k} strokeOpacity={mid} />
      <line x1={P} y1={-1} x2={P} y2={P + 1} stroke={color} strokeWidth={w / cam.k} />
    </>
  );
  return (
    <defs>
      <pattern id="tlxHatchInk" patternUnits="userSpaceOnUse" width={P} height={P} patternTransform={`rotate(${HATCH_ANGLE})`}>
        {lines(INK, HATCH_W_INK)}
      </pattern>
      <pattern id="tlxHatchAcc" patternUnits="userSpaceOnUse" width={P} height={P} patternTransform={`rotate(${HATCH_ANGLE})`}>
        {lines(ACCENT, HATCH_W_ACC)}
      </pattern>
    </defs>
  );
};
/** CHANGED 2026-10-04 (Fable's B review): solidity also drives a flat cream WASH inside
 *  the empire, under the hatch (INK at 0 -> WASH_FULL), so at solidity 1 the empire reads
 *  as one solid block at phone size. At solidity 0 nothing is drawn for it (cut A unchanged). */
export const WASH_FULL = 0.17;
/** the flat cream wash at `solidity` over d (evenodd). It tiles seamlessly only within ONE
 *  path: to wash many adjacent cells at the same solidity, pass their d's joined into one
 *  string (`cells.map((c) => c.d).join("")`), never one EmpireWash per cell (anti-aliased
 *  shared edges would show as faint lines). */
export const EmpireWash: React.FC<{ d: string; opacity?: number; solidity?: number }> = ({ d, opacity = 1, solidity = 0 }) => {
  const a = opacity * WASH_FULL * Math.max(0, Math.min(1, solidity));
  if (a <= 0.002 || !d) return null;
  return <path d={d} fillRule="evenodd" fill={INK} fillOpacity={a} />;
};
/** cream engraved hatch over d (evenodd); solidity 0 = the context rung, 1 = the full rung.
 *  With wash (default true) the flat cream wash at the same solidity is drawn under it
 *  (EmpireWash); per-cell drawing passes wash={false} and washes the cells once (see EmpireWash). */
export const EmpireHatch: React.FC<{ d: string; cam: Cam; opacity?: number; solidity?: number; wash?: boolean }> = ({
  d,
  cam,
  opacity = 1,
  solidity = 0,
  wash = true,
}) => {
  const op = opacity * (HATCH_INK_RUNG.context + (HATCH_INK_RUNG.full - HATCH_INK_RUNG.context) * solidity);
  if (op <= 0.002 || !d) return null;
  return (
    <g>
      <HatchDefs cam={cam} />
      {wash ? <EmpireWash d={d} opacity={opacity} solidity={solidity} /> : null}
      <path d={d} fillRule="evenodd" fill="url(#tlxHatchInk)" opacity={op} />
    </g>
  );
};
/** the empire's border: fine dashed cream at the context rung (solidity 0) -> a solid
 *  engraved cream line over a dark casing at the full rung (1). CHANGED 2026-10-04: the
 *  solid line is heavier (1.7 -> 3.0 screen px, its casing 2.6 -> 3.4 px wider) */
export const EmpireBorder: React.FC<{ d: string; cam: Cam; opacity?: number; solidity?: number }> = ({ d, cam, opacity = 1, solidity = 0 }) => {
  if (opacity <= 0.002 || !d) return null;
  const s = Math.max(0, Math.min(1, solidity));
  const px = (v: number) => v / cam.k;
  const op = opacity * (INK_CONTEXT + (INK_FULL - INK_CONTEXT) * s);
  const w = px(1.7 + 1.3 * s);
  return (
    <g fill="none" strokeLinecap="butt" strokeLinejoin="round">
      {s > 0.002 ? <path d={d} stroke={DARK} strokeOpacity={0.55 * s * opacity} strokeWidth={w + px(2.6 + 0.8 * s)} /> : null}
      {s >= 0.999 ? (
        <path d={d} stroke={INK} strokeOpacity={op} strokeWidth={w} />
      ) : (
        octaveDashes(cam.k).map((q) => (
          <path
            key={`eb-${q.p}`}
            d={d}
            stroke={INK}
            strokeOpacity={op * q.op}
            strokeWidth={w}
            strokeDasharray={`${(q.p * (0.58 + 0.42 * s)).toFixed(5)} ${(q.p * 0.42 * (1 - s)).toFixed(5)}`}
          />
        ))
      )}
    </g>
  );
};
/** orange hatch + a deep fill: the land of the Aztecs' enemies */
export const EnemyHatch: React.FC<{ d: string; cam: Cam; opacity?: number }> = ({ d, cam, opacity = 1 }) => {
  if (opacity <= 0.002 || !d) return null;
  return (
    <g>
      <HatchDefs cam={cam} />
      <path d={d} fillRule="evenodd" fill={ACCENT_DEEP} fillOpacity={0.2 * opacity} />
      <path d={d} fillRule="evenodd" fill="url(#tlxHatchAcc)" opacity={0.85 * opacity} />
    </g>
  );
};
/** a solid orange engraved line over a dark casing (an enemy's border, the pen's line) */
export const EnemyBorder: React.FC<{ d: string; cam: Cam; opacity?: number; width?: number }> = ({ d, cam, opacity = 1, width = 2.3 }) => {
  if (opacity <= 0.002 || !d) return null;
  const px = (v: number) => v / cam.k;
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} stroke={DARK} strokeOpacity={0.55 * opacity} strokeWidth={px(width + 2.8)} />
      <path d={d} stroke={ACCENT} strokeOpacity={opacity} strokeWidth={px(width)} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE PEN
// ---------------------------------------------------------------------------
export const PEN_W = 3.2; // screen px, the pen's orange line
/** the orange engraved line along `route` from s0 to s1; dashed = world-anchored octave
 *  dashes phased from arclength dashFrom (so they never crawl as the head extends) */
export const PenLine: React.FC<{
  route: ReturnType<typeof makeRoute>;
  cam: Cam;
  s0: number;
  s1: number;
  dashed?: boolean;
  dashFrom?: number;
  width?: number;
  opacity?: number;
}> = ({ route, cam, s0, s1, dashed = false, dashFrom = s0, width = PEN_W, opacity = 1 }) => {
  if (opacity <= 0.002 || s1 - s0 < 0.01) return null;
  const px = (v: number) => v / cam.k;
  const d = route.partialD(s0, s1);
  if (!dashed)
    return (
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d={d} stroke={DARK} strokeOpacity={0.55 * opacity} strokeWidth={px(width + 2.8)} />
        <path d={d} stroke={ACCENT} strokeOpacity={opacity} strokeWidth={px(width)} />
      </g>
    );
  const off = s0 - dashFrom; // the path starts at s0: shift the dashes back to dashFrom's phase
  return (
    <g fill="none" strokeLinecap="butt" strokeLinejoin="round">
      {octaveDashes(cam.k).map((q) => (
        <g key={`pd-${q.p}`} opacity={q.op}>
          <path d={d} stroke={DARK} strokeOpacity={0.55 * opacity} strokeWidth={px(width + 2.8)} strokeDasharray={`${q.p * 0.62 + px(2.8)} ${q.p * 0.38 - px(2.8)}`} strokeDashoffset={off + px(1.4)} />
          <path d={d} stroke={ACCENT} strokeOpacity={opacity} strokeWidth={px(width)} strokeDasharray={`${q.p * 0.62} ${q.p * 0.38}`} strokeDashoffset={off} />
        </g>
      ))}
    </g>
  );
};
/** the pen's nib: a small orange dot (~6 px) on a dark ring, screen-sized */
export const PenNib: React.FC<{ x: number; y: number; cam: Cam; opacity?: number; r?: number }> = ({ x, y, cam, opacity = 1, r = 3.3 }) =>
  opacity > 0.002 ? (
    <g opacity={opacity}>
      <circle cx={x} cy={y} r={(r + 1.6) / cam.k} fill={DARK} fillOpacity={0.6} />
      <circle cx={x} cy={y} r={r / cam.k} fill={ACCENT} />
    </g>
  ) : null;

// ---------------------------------------------------------------------------
// THE FORTRESS: a stone citadel, front elevation, in the Carrack's engraved manner
// (one stroke family; dark casing under orange lines). Glyph units: 100 = `size`
// screen px; x -45 .. 45, y -76 (the keep's merlons) .. 0 (the base line), (0, 0)
// = the middle of the base, where the tie arrives. The OUTLINE is one polyline a
// pen draws without lifting: from the middle of the base west along the ground,
// up the west tower and over its merlons, along the crenellated curtain wall, up
// and over the keep, the east wall, the east tower, and down to the ground. Then
// the DETAILS, one after another: the base's east half, the gate, the slits, the
// string courses, the stone courses and the shade hatching on the east faces.
// ---------------------------------------------------------------------------
const FORT_OUTLINE: P2[] = [
  [0, 0],
  [-45, 0],
  // the west tower and its two merlons
  [-45, -55],
  [-41, -55],
  [-41, -50],
  [-35, -50],
  [-35, -55],
  [-31, -55],
  [-31, -36],
  // the west curtain wall
  [-27, -36],
  [-27, -40],
  [-23, -40],
  [-23, -36],
  [-19, -36],
  [-19, -40],
  [-15, -40],
  [-15, -36],
  [-13, -36],
  // the keep and its three merlons
  [-13, -76],
  [-7, -76],
  [-7, -70],
  [-3, -70],
  [-3, -76],
  [3, -76],
  [3, -70],
  [7, -70],
  [7, -76],
  [13, -76],
  [13, -36],
  // the east curtain wall
  [15, -36],
  [15, -40],
  [19, -40],
  [19, -36],
  [23, -36],
  [23, -40],
  [27, -40],
  [27, -36],
  [31, -36],
  // the east tower
  [31, -55],
  [35, -55],
  [35, -50],
  [41, -50],
  [41, -55],
  [45, -55],
  [45, 0],
];
const FORT_DETAIL: string[] = [
  // the base's east half
  "M45,0 L0,0",
  // the gate: an arch in the keep
  "M-5.5,0 L-5.5,-11 C-5.5,-18 5.5,-18 5.5,-11 L5.5,0",
  // the keep's slit and the towers'
  "M0,-46 L0,-57 M-38,-30 L-38,-40 M38,-30 L38,-40",
  // the keep's cornice, the towers' string courses
  "M-13,-66 L13,-66 M-45,-45 L-31,-45 M31,-45 L45,-45",
  // stone courses on the curtain walls
  "M-31,-12 L-13,-12 M-31,-24 L-13,-24 M13,-12 L31,-12 M13,-24 L31,-24",
  // shade: vertical hatching on the east faces (the keep's east third, the walls, the east tower)
  "M9,-3 L9,-30 M11,-3 L11,-62 M27,-15 L27,-33 M29,-15 L29,-33 M42,-3 L42,-46 M44,-3 L44,-48",
];
const FORT_CUM = (() => {
  const c = [0];
  for (let i = 1; i < FORT_OUTLINE.length; i++)
    c.push(c[i - 1] + Math.hypot(FORT_OUTLINE[i][0] - FORT_OUTLINE[i - 1][0], FORT_OUTLINE[i][1] - FORT_OUTLINE[i - 1][1]));
  return c;
})();
/** the outline's length in glyph units (the pen's path over the fortress) */
export const FORT_LEN = FORT_CUM[FORT_CUM.length - 1];
const FORT_OUTLINE_D = `M${FORT_OUTLINE.map(([x, y]) => `${x},${y}`).join("L")}`;
export const FORT_OUTLINE_SHARE = 0.75; // of progress: the outline; the rest draws the details
/** the pen's point on the fortress outline at progress p (glyph units); null once the outline is done */
export const fortressNib = (p: number): P2 | null => {
  const q = p / FORT_OUTLINE_SHARE;
  if (q <= 0 || q >= 1) return null;
  const s = q * FORT_LEN;
  let i = 1;
  while (i < FORT_CUM.length - 1 && FORT_CUM[i] < s) i++;
  const u = (s - FORT_CUM[i - 1]) / (FORT_CUM[i] - FORT_CUM[i - 1] || 1);
  const a = FORT_OUTLINE[i - 1];
  const b = FORT_OUTLINE[i];
  return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
};
export const FORT_S0 = 28; // fortressSize(k) = FORT_S0 k^0.6 screen px (the Carrack's law): 106 px at k 9.27, 47 px at k 2.4
export const fortressSize = (k: number) => FORT_S0 * Math.pow(k, 0.6);
export const Fortress: React.FC<{ x: number; y: number; cam: Cam; size: number; progress?: number; opacity?: number }> = ({
  x,
  y,
  cam,
  size,
  progress = 1,
  opacity = 1,
}) => {
  if (opacity <= 0.002 || progress <= 0.0005) return null;
  const u = size / 100 / cam.k; // world px per glyph unit
  const sw = 1 / (size / 100); // 1 screen px in glyph units
  const pO = Math.min(1, progress / FORT_OUTLINE_SHARE);
  const pD = Math.max(0, (progress - FORT_OUTLINE_SHARE) / (1 - FORT_OUTLINE_SHARE));
  const groundOp = smoothstep((progress - 0.35) / 0.55);
  // the details draw one after another across pD (each on its own slice)
  const nD = FORT_DETAIL.length;
  const detail = (i: number) => Math.max(0, Math.min(1, pD * nD - i * 0.8));
  return (
    <g opacity={opacity} transform={`translate(${x} ${y}) scale(${u})`} strokeLinejoin="round" strokeLinecap="round">
      {/* the stone's dark ground, laid as the outline closes */}
      {groundOp > 0.002 ? <path d={`${FORT_OUTLINE_D}Z`} fill={DARK} fillOpacity={0.5 * groundOp} stroke="none" /> : null}
      {/* the outline: casing + orange, drawn by the pen */}
      <path d={FORT_OUTLINE_D} fill="none" stroke={DARK} strokeOpacity={0.6} strokeWidth={4.6 * sw} pathLength={1} strokeDasharray={pO >= 1 ? undefined : `${pO} 1`} />
      <path d={FORT_OUTLINE_D} fill="none" stroke={ACCENT} strokeWidth={2.3 * sw} pathLength={1} strokeDasharray={pO >= 1 ? undefined : `${pO} 1`} />
      {FORT_DETAIL.map((dd, i) => {
        const q = detail(i);
        if (q <= 0.001) return null;
        const da = q >= 1 ? undefined : `${q} 1`;
        const isHatch = i === nD - 1 || i === nD - 2;
        return (
          <g key={`fd-${i}`}>
            <path d={dd} fill="none" stroke={DARK} strokeOpacity={0.5} strokeWidth={(isHatch ? 3.2 : 3.8) * sw} pathLength={1} strokeDasharray={da} />
            <path d={dd} fill="none" stroke={ACCENT} strokeOpacity={isHatch ? 0.85 : 1} strokeWidth={(isHatch ? 1.2 : 1.7) * sw} pathLength={1} strokeDasharray={da} />
          </g>
        );
      })}
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE STANDARD LAYERS
// ---------------------------------------------------------------------------
/** the empire as A and B show it: the cream hatch (the empire minus the claim; the claim's ground while it
 *  is cream), Tlaxcala in orange, the cream borders, Tlaxcala's orange border.
 *  The claim's ground is NOT here: TlaxcalaClaims draws it orange (cut A draws its
 *  cream ground under a mask until the sweep). */
export const EmpireLayer: React.FC<{ cam: Cam; solidity?: number; tlaxOpacity?: number }> = ({ cam, solidity = 0, tlaxOpacity = 1 }) => (
  <>
    <EmpireHatch d={EMPIRE_REST_D} cam={cam} solidity={solidity} />
    <EnemyHatch d={ENCLAVES.tlaxcala.d} cam={cam} opacity={tlaxOpacity} />
    <EmpireBorder d={CREAM_BORDERS_D} cam={cam} solidity={solidity} />
    <EnemyBorder d={ENCLAVES.tlaxcala.border} cam={cam} opacity={tlaxOpacity} />
  </>
);
/** cut A's END state of the claim: the carved piece (orange at CLAIM_RUNG), its pen outline,
 *  the dashed tie, the fortress on Tenochtitlan. The optional props are cut A's animation
 *  (defaults = the end state): penS (pen head, arclength on PEN), sweep (0..1 the claim's
 *  orange), fortress (0..1). */
export const TlaxcalaClaims: React.FC<{
  cam: Cam;
  opacity?: number;
  penS?: number;
  sweep?: number;
  sweepMask?: string;
  fortress?: number;
}> = ({ cam, opacity = 1, penS = PEN_LEN, sweep = 1, sweepMask, fortress = 1 }) => {
  if (opacity <= 0.002) return null;
  const [tx, ty] = PEN_PTS[PEN_PTS.length - 1] as P2;
  return (
    <g opacity={opacity < 0.999 ? opacity : undefined}>
      {sweep > 0.001 ? (
        <g mask={sweepMask ? `url(#${sweepMask})` : undefined}>
          <EnemyHatch d={CLAIM_D} cam={cam} opacity={CLAIM_RUNG} />
        </g>
      ) : null}
      <PenLine route={PEN} cam={cam} s0={0} s1={Math.min(penS, PEN_ARC_LEN)} />
      {penS > PEN_ARC_LEN ? <PenLine route={PEN} cam={cam} s0={PEN_ARC_LEN} s1={penS} dashed dashFrom={PEN_ARC_LEN} /> : null}
      <Fortress x={tx} y={ty} cam={cam} size={fortressSize(cam.k)} progress={fortress} />
    </g>
  );
};

/** for checks: the screen x of the frame centre (cortesShared's SCREEN_CX) */
export const FRAME_CX = SCREEN_CX;
/** the claim's pen arc and tie end points for builders */
export const TENOCH: P2 = [SITES_T.tenochtitlan.x, SITES_T.tenochtitlan.y];
export const CLAIM_MID: P2 = CLAIM_CENTRE as P2;
export { CLAIM_P1 as PEN_START, CLAIM_P2 as PEN_CLOSE };
export const VALLEY_BOX_LL = { lon: [-99.45, -97.4] as [number, number], lat: [18.62, 19.95] as [number, number] };
