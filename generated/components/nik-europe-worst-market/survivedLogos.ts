// survivedLogos: the survivors' marks for ThreeOrFourSurvived, as one-colour ink stamps on a cream phone face
// (styles/cheeky-pint.md, Logos: the real mark, dark parts ink, light parts the tile, the background dropped; the path
// data inline). Sources (public domain on Wikimedia Commons; the SVGs and SOURCES.txt are in
// assets-src/nik-europe-worst-market/logos/):
//   Monzo    https://commons.wikimedia.org/wiki/File:Monzo_2022_logo.svg     the lowercase "monzo" wordmark (text logo)
//   Starling https://commons.wikimedia.org/wiki/File:Starling_Bank_Logo.svg  the circle mark only (the disc with two
//            curved strokes = the app icon): an ink disc, the strokes knocked out to the tile; "STARLING BANK" dropped
//   N26      https://commons.wikimedia.org/wiki/File:N26_Logo_Black.svg      the N26 wordmark with its two bars (its
//            first path is repeated at the end of the file; drawn once here)
//   Revolut  nik-trend-friend/revolutMark.ts (the R of the 2023 mark, File:Revolut_logo.svg)
// One family by the kit's optical rule (opticalFit, stoutShared.tsx): each mark's ink box, silhouette fill and centroid
// offset (in units of the box's geometric mean) measured off a resvg raster of exactly these paths at 2400 px.
// Pure data plus one placement helper, no three.
import { opticalFit } from "../kits/cheeky-pint/stoutShared";
import { REVOLUT_R_D } from "../nik-trend-friend/revolutMark";

export type LogoId = "revolut" | "monzo" | "starling" | "n26";
export type LogoMark = {
  /** ink paths in the mark's own units */
  paths: string[];
  rule: "nonzero" | "evenodd";
  /** Starling: the disc (cx, cy, r) under the paths, which are then knocked out of it */
  disc?: [number, number, number];
  /** the ink box x, y, w, h (mark units), its silhouette fill and centroid offset (x, y) */
  box: [number, number, number, number];
  fill: number;
  cx: number;
  cy: number;
};

export const LOGOS: Record<LogoId, LogoMark> = {
  revolut: { paths: [REVOLUT_R_D], rule: "evenodd", box: [0, 0, 25.32, 31.73], fill: 0.57, cx: -0.047, cy: -0.028 },
  monzo: {
    paths: [
      "M0 19.3V.7h4.958v2.493a5.505 5.505 0 0 1 5.063-2.84 5.671 5.671 0 0 1 5.166 2.98c1.941-2.045 3.432-2.98 5.756-2.98 4.195 0 6.553 2.354 6.553 6.686V19.3h-5.34V9.222c0-2.598-.554-3.776-2.6-3.776-2.08 0-3.19 1.281-3.19 3.776V19.3h-5.374V9.222c0-2.598-.555-3.776-2.601-3.776-2.08 0-3.19 1.281-3.19 3.776V19.3H0ZM33.82 3.124a9.832 9.832 0 0 1 16.816 6.76 9.47 9.47 0 0 1-2.808 6.997 9.655 9.655 0 0 1-7.074 2.91 9.208 9.208 0 0 1-7.038-2.98 9.716 9.716 0 0 1-2.74-6.859 9.528 9.528 0 0 1 2.844-6.828Zm6.969 11.467a4.6 4.6 0 0 0 4.387-2.701 4.59 4.59 0 0 0-3.234-6.381 4.602 4.602 0 0 0-4.776 1.933 4.592 4.592 0 0 0-.78 2.577 4.487 4.487 0 0 0 4.403 4.572ZM54.118 19.3V.7h5.2l-.068 2.494a5.788 5.788 0 0 1 5.34-2.84c3.848 0 6.344 2.424 6.344 6.685V19.3h-5.478V9.222c0-2.598-.555-3.776-2.67-3.776-2.15 0-3.294 1.281-3.294 3.776V19.3h-5.374ZM94.18 3.122A9.832 9.832 0 0 1 104.835.916a9.822 9.822 0 0 1 6.16 8.965 9.47 9.47 0 0 1-2.808 6.997 9.664 9.664 0 0 1-7.074 2.91 9.208 9.208 0 0 1-7.038-2.98 9.716 9.716 0 0 1-2.74-6.858 9.529 9.529 0 0 1 2.843-6.828Zm6.97 11.467a4.602 4.602 0 0 0 4.387-2.702 4.59 4.59 0 0 0-.879-5.073 4.598 4.598 0 0 0-5.04-1.073 4.598 4.598 0 0 0-2.871 4.276 4.488 4.488 0 0 0 4.403 4.572ZM74.926 19.3V15.42l7.663-9.91h-7.663V.699h13.835v4.4l-6.762 9.388h6.9v4.812H74.927Z",
    ],
    rule: "nonzero",
    box: [0.03, 0.22, 110.92, 19.57],
    fill: 0.568,
    cx: -0.011,
    cy: -0.008,
  },
  starling: {
    // the two strokes in the SVG's own frame (its translate(-109.17 -146.73) folded into the disc's centre)
    paths: [
      "M593.31,333.55H616.2a89.74,89.74,0,0,1,89.74-89.74v-22.9A112.63,112.63,0,0,0,593.31,333.55Z",
      "M706,333.55h-22.9a89.77,89.77,0,0,1-89.77,89.77v22.91A112.67,112.67,0,0,0,706,333.55Z",
    ],
    rule: "nonzero",
    disc: [649.64, 333.91, 187.18],
    box: [462.46, 146.73, 374.36, 374.36],
    fill: 0.734,
    cx: 0,
    cy: 0,
  },
  n26: {
    paths: [
      "M302.29,179.3V494.88h0c0,27.93.65,44.83,1.95,61.07h-1.3c-6.83-18.6-14.88-34.9-26.89-56.12L89.41,179.3H4.11V640.6H70.57V325h0c0-27.94-.65-44.83-1.94-61.08H70c6.82,18.6,14.87,34.89,26.89,56.1L283.47,640.6h84.4V179.3Z",
      "M1060.44,333.69c-55,0-94.27,25.44-114.12,63.1,0-89,31-166.47,104.7-166.47,46.84,0,65.43,26.95,75.36,71.14l68.22-13.65c-16-76.29-64.53-113.37-143.1-113.37-98.72,0-172.58,75.8-172.58,245.69,0,150.81,61.59,225.35,167.71,225.35,87.69,0,153.37-59.88,153.37-158.55C1200,409.84,1158.9,333.69,1060.44,333.69ZM1046.8,589.74c-54.42,0-92.1-50-98.62-116.39,16.53-56.63,53.18-84.84,96.52-84.84,55.71,0,87.14,41.14,87.14,99.63C1131.84,550.92,1096,589.74,1046.8,589.74Z",
      "M577.29,580.84c34.73-24,84.52-63.87,106.61-86,25.11-25.12,96.59-89.69,96.59-181.74,0-95.15-62-138.7-145.85-138.7C533,174.44,482.81,237,482.81,308.57A146.72,146.72,0,0,0,487.36,345L557,351.7a185.21,185.21,0,0,1-4.55-39.63c0-53.6,35.47-79.25,79.88-79.25,43.3,0,75.35,24.26,75.35,82.6,0,59.29-29,99.7-73.16,143.91C588.35,505.53,514.55,560.65,479,586V640.6H785.67V580.84Z",
      "M372,760.14v59.77H0V760.14Z",
      "M372,0V59.77H0V0Z",
    ],
    rule: "nonzero",
    box: [0.17, 0.17, 1199.67, 819.43],
    fill: 0.281,
    cx: -0.073,
    cy: 0.002,
  },
};

/** Where a mark lands on a square texture of `size` px that spans the phone screen's width (the screen is taller, so
 *  the square sits at its middle): the scale (mark units -> px) and the translate that puts the mark's box centre on
 *  the optical centre (the kit's rule in y; the same half-correction in x, as the R always had). */
export const logoPlacement = (id: LogoId, size: number) => {
  const m = LOGOS[id];
  const [bx, by, bw, bh] = m.box;
  const fit = opticalFit(bw, bh, m.fill, m.cy, size);
  const gmPx = fit.sc * Math.sqrt(bw * bh);
  const cxPx = fit.cx - 0.5 * m.cx * gmPx;
  return { sc: fit.sc, tx: cxPx - (bx + bw / 2) * fit.sc, ty: fit.cy - (by + bh / 2) * fit.sc };
};
