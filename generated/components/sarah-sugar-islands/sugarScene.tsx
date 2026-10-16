// ---------------------------------------------------------------------------
// sugarScene: THE ONE SCENE of "SarahWar_Britain_let_America_go_to_keep_its_sugar_islands"
// (Dwarkesh map style). Every cut (A ThirteenColonies, B DeathGround, C DownAPeg,
// D GlobalWar, E KeepTheCaribbean) renders <SugarScene g={IN + frame}/>.
//
// It composes the ACT modules in story order: sugarAB (builder W), sugarCD (builder
// CD), sugarE (builder E). Each exports an Act { cam, Under, Over, Labels }:
//   cam    the act's FULL camera track = the previous act's track extended with
//          extendCamTrack(prev, framings, moves); the scene uses the LAST act's track
//   Under  fills / hatches, inside the world svg (all acts' Unders first)
//   Over   lines, arrows, dots, glyphs, inside the world svg (after the period borders)
//   Labels screen-space type (after the world svg)
// Acts draw their own elements at every story frame (they persist) unless handed off
// (HANDOFF in sugarShared). Owned by W: change it only through W (log in WORLD_READY.md).
//
// CHANGED 2026-10-05 (Fable): CAMERA MOTION BLUR. When the camera's on-screen speed
// (max displacement per frame over a full-frame probe grid, zoom included) exceeds
// BLUR_FROM = 24 px/frame, the frame is the average of N = clamp(ceil(speed / 12), 2, 8)
// sub-frame copies of the whole page (map rasters + overlays + labels, each at its own
// story time) across a 180-degree shutter (s - 0.25 .. s + 0.25), accumulated with
// opacities 1, 1/2, 1/3 ... (= equal weights). Below the threshold N = 1 (no cost).
// Deterministic and seek-safe (a pure function of g). Every copy gets its own uid.
// The background (and every copy's) is PAGE, the colour the rasters fade into, so a
// frame wider / taller than the rasters never shows an edge. The accumulation is an
// exact average: every copy is an opaque page and copy i sits at opacity 1/(i+1), so
// text and lines come out at 1/N per sample (a label moving fast smears, it never
// doubles at full strength).
// POLAR PAGE FADE: the overlays are masked by PolarMaskDefs when the frame reaches
// beyond lat 64 N / 35 S (the rasters carry their own baked fade).
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill } from "remotion";
import { ACT_AB } from "./sugarAB";
import { ACT_CD } from "./sugarCD";
import { ACT_E } from "./sugarE";
import {
  type Act,
  type Cam,
  FRAME_H,
  FRAME_W,
  MapStack,
  PaperTop,
  PeriodBorders,
  PAGE,
  PolarMaskDefs,
  S,
  WorldSvg,
  camTransform,
  polarNeeded,
  screenOf,
  swayCam,
  worldOf,
  type P2,
} from "./sugarShared";

export const ACTS: Act[] = [ACT_AB, ACT_CD, ACT_E];
/** the authored camera at story frame s (no sway) */
export const camAt = (s: number): Cam => ACT_E.cam(s);
/** the camera as rendered (the house sway on the story clock) */
export const camShown = (s: number): Cam => swayCam(camAt(s), s);

// ---------------------------------------------------------------------------
// MOTION BLUR
// ---------------------------------------------------------------------------
export const BLUR_FROM = 24; // px / frame
export const BLUR_STEP = 12; // px / frame per extra sample
export const BLUR_MAX = 8;
export const SHUTTER = 0.5; // frames (180 degrees)
const PROBES: P2[] = [];
for (let sy = 120; sy <= 1800; sy += 280) for (let sx = 60; sx <= 1020; sx += 240) PROBES.push([sx, sy]);
/** the camera's on-screen speed at story frame s (px / frame, max over the probe grid) */
export const camSpeed = (s: number) => {
  const a = camShown(s - 0.5);
  const b = camShown(s + 0.5);
  let m = 0;
  for (const p of PROBES) {
    const q = screenOf(worldOf(p, a), b);
    m = Math.max(m, Math.hypot(q[0] - p[0], q[1] - p[1]));
  }
  return m;
};
/** how many sub-frame samples frame s gets (1 = no blur) */
export const blurN = (s: number) => {
  const v = camSpeed(s);
  return v <= BLUR_FROM ? 1 : Math.max(2, Math.min(BLUR_MAX, Math.ceil(v / BLUR_STEP)));
};

/** one opaque copy of the page at story time s (map + overlays + labels; no paper) */
const Page: React.FC<{ s: number; g: number; cam: Cam; uid: string }> = ({ s, g, cam, uid }) => {
  const p = { s, g, cam, uid };
  const polar = polarNeeded(cam);
  const mid = `polar${uid}`;
  return (
    <AbsoluteFill style={{ backgroundColor: PAGE }}>
      <MapStack cam={cam} />
      <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} style={{ position: "absolute", left: 0, top: 0 }}>
        <g transform={camTransform(cam).svg}>
          {polar ? <PolarMaskDefs id={mid} cam={cam} /> : null}
          <g mask={polar ? `url(#${mid})` : undefined}>
            {ACTS.map((a) => (a.Under ? <a.Under key={`u-${a.name}`} {...p} /> : null))}
            <PeriodBorders cam={cam} />
            {ACTS.map((a) => (a.Over ? <a.Over key={`o-${a.name}`} {...p} /> : null))}
          </g>
        </g>
      </svg>
      {ACTS.map((a) => (a.Labels ? <a.Labels key={`l-${a.name}`} {...p} /> : null))}
    </AbsoluteFill>
  );
};

/** the whole page at global frame g */
export const SugarScene: React.FC<{ g: number; vignette?: number; cam?: Cam; blur?: boolean }> = ({ g, vignette = 0.55, cam, blur = true }) => {
  const s = S(g);
  const n = cam || !blur ? 1 : blurN(s);
  const copies =
    n === 1
      ? [<Page key="p0" s={s} g={g} cam={cam ?? camShown(s)} uid="" />]
      : Array.from({ length: n }, (_, i) => {
          const si = s + ((i + 0.5) / n - 0.5) * SHUTTER;
          return (
            <AbsoluteFill key={`p${i}`} style={{ opacity: 1 / (i + 1) }}>
              <Page s={si} g={g + (si - s)} cam={camShown(si)} uid={`_${i}`} />
            </AbsoluteFill>
          );
        });
  return (
    <AbsoluteFill style={{ backgroundColor: PAGE }}>
      {copies}
      <PaperTop vignette={vignette} />
    </AbsoluteFill>
  );
};
/** kept for acts that want the plain world svg */
export { WorldSvg };
