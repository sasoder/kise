import React from "react";
import { TallPaper } from "../kits/core-memory/deathCountShared";
import { CaptionBands as CaptionBands9x16, FilmLife } from "../zach-kelly-johnson/archiveShared";

// ---------------------------------------------------------------------------
// NEAL STEPHENSON TRAILER — the 9:16 companion of nealShared.tsx (owner: builder A). New file; nealShared.tsx is
// untouched and stays the clip's look. Same legend (paper, white ink on its hard shadow, the chain = NEAL'S OWN, film
// life over everything), laid out for 1080 x 1920, 24000/1001 fps. Import the tokens (GRAPH_STROKE, Inked, CHAIN, …)
// from nealShared; this file only adds what is frame-size dependent.
//
// EXPORTS
//   W9, H9 (1080 x 1920), CAPTION_BANDS_9x16 ([1080,1250],[1360,1460]), inCaptionBand9x16(y0, y1), CaptionBands9x16
//   TallCam (type), NealTallPaper (the paper turned 90 deg: deathCountShared's TallPaper driven by a TallCam),
//   NealTallPlane (a W9 x H9 SVG world under the camera), NealFilmLife9x16 (archiveShared's FilmLife, seed "neal").
// ---------------------------------------------------------------------------

export const W9 = 1080;
export const H9 = 1920;

/** Portrait caption bands (screen y of 1920): nothing readable in them. */
export const CAPTION_BANDS_9x16: readonly (readonly [number, number])[] = [
  [1080, 1250],
  [1360, 1460],
];
export const inCaptionBand9x16 = (y0: number, y1: number) => CAPTION_BANDS_9x16.some(([a, b]) => y1 > a && y0 < b);
/** Preview aid: the portrait bands as translucent red strips. Never on in a final. */
export { CaptionBands9x16 };

/** A camera: (x, y) = the world point at the frame's centre, k = scale; (x0, y0) = the rest point (the opening camera)
 *  the paper's parallax is measured from. */
export type TallCam = { x: number; y: number; k: number; x0: number; y0: number };

/** The squared paper turned 90 deg (deathCountShared's TallPaper: parallax 0.15, drift -0.3 px/frame, brightness 0.88,
 *  blur 3 px). Draw it first, inside NealFilmLife9x16. */
export const NealTallPaper: React.FC<{ frame: number; cam: TallCam }> = ({ frame, cam }) => (
  <TallPaper frame={frame} cx={cam.x} cy={cam.y} k={cam.k} cxRest={cam.x0} cyRest={cam.y0} />
);

/** World layer: an SVG in world px (W9 x H9 viewBox, overflow visible) under translate + scale(k). */
export const NealTallPlane: React.FC<{ cam: TallCam; children: React.ReactNode }> = ({ cam, children }) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      top: 0,
      width: W9,
      height: H9,
      transformOrigin: "0 0",
      transform: `translate(${W9 / 2 - cam.x * cam.k}px, ${H9 / 2 - cam.y * cam.k}px) scale(${cam.k})`,
    }}
  >
    <svg width={W9} height={H9} viewBox={`0 0 ${W9} ${H9}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      {children}
    </svg>
  </div>
);

/** Film life at 9:16 (grain, weave <= 0.8 px, flicker +-1.5 %, vignette 0.3): archiveShared's FilmLife, which is
 *  natively 1080 x 1920, with the clip's seed and vignette. */
export const NealFilmLife9x16: React.FC<{ frame: number; children?: React.ReactNode }> = ({ frame, children }) => (
  <FilmLife frame={frame} seed="neal" vignette={0.3}>
    {children}
  </FilmLife>
);
