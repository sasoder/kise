// ---------------------------------------------------------------------------
// booksWorld: NEAL STEPHENSON'S BOOKS and the row they land in (neal-stephenson-trailer; owner: builder B).
// Shared by cut 45 TonsOfTVShows (the books fly off his desk into the row) and cut 54 InstantExpert (opens on the row).
// Built on ./nealShared (the clip's look). Import read-only.
//
// LEGEND
//   * A BOOK = the real US first-edition dust-jacket front (refs/books/, NOT FREE: fair use, book covers) as the
//     front face of a slim 2.5D hardcover, baked to an RGBA PNG by scripts/clips/neal-stephenson-trailer/bake-books.py:
//     the thickness shows on the side the book is seen from at rest, which is also the side that trails its flight
//     (books left of centre: the page block's fore-edge on the right; right of centre: the jacket's spine on the left;
//     the centre book: only its tail), plus a sliver of tail under each (the row hangs above the eye line). Visible
//     thickness = 0.3 x the real thickness scaled by PAGE COUNT (Anathem's 937 pp = 2.03 in at 9.12 in tall).
//   * Graded NEAL_FILTER like every photo in the clip, on its hard black silhouette at +4/+4 world px (PhotoCutOut).
//   * In flight a book carries the clip's chain (NEAL'S OWN: his work) as a TRAIL: orange/purple/blue copies of its
//     silhouette stepped straight behind it, the step opening with its speed (<= 13 screen px), collapsing into the
//     cover as it lands (ChainPhotoCutOut). At rest: no chain.
//   * Units: REST px = screen px at the rest camera REST_CAM (960, 540, k 1); on a deeper plane (d > 1) a thing of
//     rest size L is drawn L / d (the same object, farther off), so at the rest camera every plane lines up.
//   * The row: COVER_ROW[i] = the landed slot of BOOKS[i] (cover centre, top, bottom; rest px on the focus plane d 1),
//     seven face-out covers in publication order left to right, COVER_H 290 tall, x ~130-1790, tops y 84, bottoms 374.
//   * Neal (NEAL): Bob Lee's 2008 portrait (CC BY 2.0), cut out with the macOS Vision foreground mask
//     (scripts/clips/neal-stephenson-trailer/neal-matte.swift + neal-cutout.py), centred, his eyes at y ~545, face
//     (head top to chin) ~220 rest px; below his shoulders he softens into the paper (NealFigure).
//   * The camera of cut 45: camAt45(f) (a dolly pull-back from his face, landing f88, creeping to f104). Cut 54 opens
//     on END_CAM45 = camAt45(104) with LandedRow + NealFigure (pass the global frame 105 + f for the bob and film life).
//
// EXPORTS
//   COVER_H, BOOKS, COVER_ROW, NEAL, NealFigure, BookCutOut, LandedRow, bookBob, REST_CAM,
//   CAM45 (constants), camAt45(f), END_CAM45, DURATION45
// ---------------------------------------------------------------------------
import React from "react";
import { ChainPhotoCutOut, type NealCam, NealPlane, PhotoCutOut, W } from "./nealShared";

// -- the books ---------------------------------------------------------------
export const COVER_H = 290; // rest px, every cover's height in the row
/** the bake: 720 bake px = one cover height (bake-books.py) */
const BAKE_H = 720;
const R = COVER_H / BAKE_H; // rest px per bake px

type Side = "fore-edge right" | "spine left" | "tail only";
export type Book = {
  key: string;
  title: string;
  year: number;
  pages: number;
  src: string;
  /** the png's size, rest px at d 1 */
  w: number;
  h: number;
  /** the cover's centre relative to the png's centre, rest px */
  cdx: number;
  cdy: number;
  /** the cover alone, rest px */
  coverW: number;
  side: Side;
};
const B = "neal-stephenson-trailer/books/";
/** [key, title, year, pages, file, png w, png h, cover x in png, cover w] (bake px; bake-books.py output) */
const RAW: [string, string, number, number, string, number, number, number, number, Side][] = [
  ["snow-crash", "Snow Crash", 1992, 470, "book_1_snow-crash.png", 494, 728, 0, 470, "fore-edge right"],
  ["diamond-age", "The Diamond Age", 1995, 455, "book_2_diamond-age.png", 495, 728, 0, 472, "fore-edge right"],
  ["cryptonomicon", "Cryptonomicon", 1999, 918, "book_3_cryptonomicon.png", 543, 736, 0, 496, "fore-edge right"],
  ["quicksilver", "Quicksilver (The Baroque Cycle)", 2003, 927, "book_4_quicksilver.png", 504, 744, 0, 504, "tail only"],
  ["anathem", "Anathem", 2008, 937, "book_5_anathem.png", 532, 737, 48, 484, "spine left"],
  ["seveneves", "Seveneves", 2015, 880, "book_6_seveneves.png", 524, 735, 45, 479, "spine left"],
  ["termination-shock", "Termination Shock", 2021, 720, "book_7_termination-shock.png", 514, 733, 37, 477, "spine left"],
];
/** Neal's seven, in publication order (= left to right in the row) */
export const BOOKS: Book[] = RAW.map(([key, title, year, pages, file, pw, ph, cx, cw, side]) => ({
  key,
  title,
  year,
  pages,
  src: B + file,
  w: pw * R,
  h: ph * R,
  cdx: (cx + cw / 2 - pw / 2) * R,
  cdy: (BAKE_H / 2 - ph / 2) * R,
  coverW: cw * R,
  side,
}));

// -- the row -----------------------------------------------------------------
const ROW_L = 130; // the row's left edge (first book's silhouette), rest px
const ROW_R = 1790;
const ROW_TOP = 84; // the covers' tops
export type Slot = { i: number; cx: number; cy: number; top: number; bottom: number; left: number; right: number };
/** the landed slot of each book: equal clear gaps between the whole silhouettes (cover + thickness) */
export const COVER_ROW: Slot[] = (() => {
  const total = BOOKS.reduce((a, b) => a + b.w, 0);
  const gap = (ROW_R - ROW_L - total) / (BOOKS.length - 1);
  let x = ROW_L;
  return BOOKS.map((b, i) => {
    const pngCx = x + b.w / 2;
    x += b.w + gap;
    const cx = pngCx + b.cdx;
    return { i, cx, cy: ROW_TOP + COVER_H / 2, top: ROW_TOP, bottom: ROW_TOP + COVER_H, left: cx - b.coverW / 2, right: cx + b.coverW / 2 };
  });
})();

/** a settled book's life: a slow bob (<= 1.4 px), each on its own phase; `since` = frames since it landed */
export const bookBob = (i: number, frame: number, since = 99) => (1 - Math.exp(-Math.max(0, since) / 8)) * 1.4 * Math.sin(frame / 9.5 + i * 2.39);

/**
 * One book in plane world px: cover centre (x, y), `scale` (1 = its row size), tilt `rotate` (deg, about the
 * cover centre). With `trail` (a unit direction pointing BEHIND it and a step in world px) it carries the chain trail.
 */
export const BookCutOut: React.FC<{
  i: number;
  x: number;
  y: number;
  scale?: number;
  rotate?: number;
  trail?: { dx: number; dy: number; step: number } | null;
}> = ({ i, x, y, scale = 1, rotate = 0, trail }) => {
  const b = BOOKS[i];
  const th = (rotate * Math.PI) / 180;
  // the png's centre: the cover centre minus the (rotated) cover offset
  const ox = b.cdx * scale;
  const oy = b.cdy * scale;
  const px = x - (ox * Math.cos(th) - oy * Math.sin(th));
  const py = y - (ox * Math.sin(th) + oy * Math.cos(th));
  const p = { src: b.src, x: px, y: py, w: b.w * scale, aspect: b.w / b.h, anchor: "center" as const, rotate };
  return trail && trail.step > 0.4 ? <ChainPhotoCutOut {...p} progress={1} dir={{ dx: trail.dx, dy: trail.dy }} step={trail.step} /> : <PhotoCutOut {...p} />;
};

/** The seven landed books on the focus plane, bobbing (`frame` = the global frame; `landedAt[i]` = local landing). */
export const LandedRow: React.FC<{ cam: NealCam; frame: number; only?: (i: number) => boolean; since?: (i: number) => number }> = ({
  cam,
  frame,
  only,
  since,
}) => (
  <NealPlane cam={cam}>
    {COVER_ROW.map((s) =>
      only && !only(s.i) ? null : <BookCutOut key={s.i} i={s.i} x={s.cx} y={s.cy + bookBob(s.i, frame, since ? since(s.i) : 99)} />,
    )}
  </NealPlane>
);

// -- Neal --------------------------------------------------------------------
/** the cut-out: 1640 x 1245 px; head top at src y 38, eyes y ~308, face centre x ~850, chin ~560 */
const NEAL_SRC = { w: 1640, h: 1245, headTop: 38, eyes: 308, faceCx: 850, chin: 560 };
const NEAL_S = 0.42; // rest px per source px: face (head top -> chin) = 220 rest px
export const NEAL = {
  src: "neal-stephenson-trailer/neal/neal_2008_cutout.png",
  s: NEAL_S,
  x: W / 2 - NEAL_SRC.faceCx * NEAL_S, // the cut-out's top-left, rest px
  y: 545 - NEAL_SRC.eyes * NEAL_S,
  w: NEAL_SRC.w * NEAL_S,
  aspect: NEAL_SRC.w / NEAL_SRC.h,
  /** rest-px landmarks */
  headTop: 545 - (NEAL_SRC.eyes - NEAL_SRC.headTop) * NEAL_S,
  eyesY: 545,
  chin: 545 + (NEAL_SRC.chin - NEAL_SRC.eyes) * NEAL_S,
  /** a point on his brow (books are born behind it), rest px */
  brow: { x: W / 2 - 10, y: 545 - 70 * NEAL_S },
};
/** below the shoulders he dissolves into the paper: the photo fades out over 760 -> 900 (rest y; its bottom edge is
 *  at ~940). A plain fade, no blurred copy (on the light paper a blurred dark vest reads as a glow). */
const DISSOLVE = [760, 900];
const gradMask = (a: number, b: number): React.CSSProperties => {
  const g = `linear-gradient(to bottom, #000 0px, #000 ${a}px, rgba(0,0,0,0) ${b}px)`;
  return { WebkitMaskImage: g, maskImage: g, WebkitMaskSize: "100% 100%", maskSize: "100% 100%", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat" };
};
/** Neal on the focus plane (d 1): his photo on its hard shadow, dissolving into the paper below the shoulders. */
export const NealFigure: React.FC<{ cam: NealCam }> = ({ cam }) => (
  <NealPlane cam={cam}>
    <div style={{ position: "absolute", left: -400, top: 0, width: W + 800, height: 1200, ...gradMask(DISSOLVE[0], DISSOLVE[1]) }}>
      <div style={{ position: "absolute", left: 400, top: 0 }}>
        <PhotoCutOut src={NEAL.src} x={NEAL.x} y={NEAL.y} w={NEAL.w} aspect={NEAL.aspect} anchor="top-left" />
      </div>
    </div>
  </NealPlane>
);

// -- the camera of cut 45 ------------------------------------------------------
/**
 * An analytic dolly pull-back (already moving at f0): log k eases from K0 to 1 on s(u) = 1 - (1-u)^3 (1 + 1.5u),
 * u = f / F_LAND (speed 1.5 at f0, peak ~f15, ONE deceleration lobe to f88), plus a log-k creep of CREEP a frame
 * over the whole cut so it never stops; (x, y) ride the same s from his face to the rest centre, then drift.
 */
export const CAM45 = { F_LAND: 88, K0: 2.6, CREEP: 0.0006, X0: 972, Y0: 575, X1: W / 2, Y1: 540, DRIFT_X: 0.2 };
export const REST_CAM: NealCam = { x: W / 2, y: 540, k: 1, x0: W / 2, y0: 540 };
export const DURATION45 = 105;
const camS = (f: number) => {
  const u = Math.min(1, Math.max(0, f / CAM45.F_LAND));
  return 1 - Math.pow(1 - u, 3) * (1 + 1.5 * u);
};
export const camAt45 = (f: number): NealCam => {
  const s = camS(f);
  const lk = Math.log(CAM45.K0) * (1 - s) + CAM45.CREEP * (CAM45.F_LAND - f);
  return {
    x: CAM45.X0 + (CAM45.X1 - CAM45.X0) * s + CAM45.DRIFT_X * Math.max(0, f - CAM45.F_LAND),
    y: CAM45.Y0 + (CAM45.Y1 - CAM45.Y0) * s,
    k: Math.exp(lk),
    x0: REST_CAM.x0,
    y0: REST_CAM.y0,
  };
};
/** cut 45's last frame's camera: cut 54 opens here */
export const END_CAM45 = camAt45(DURATION45 - 1);
