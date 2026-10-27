// ---------------------------------------------------------------------------
// booksWorldPortrait: NEAL STEPHENSON'S BOOKS at 9:16 (1080 x 1920) — the two-row shelf they land in, Neal below it,
// the camera, the portrait paper and film life (neal-stephenson-trailer; owner: builder B). The portrait twin of
// ./booksWorld (which stays the 16:9 source of the books themselves: BOOKS, BookCutOut, bookBob are imported from
// it read-only). Shared by cut 45 TonsOfTVShowsPortrait (the books fly out of his head into the rows) and cut 54
// InstantExpertPortrait (opens on the rows; each subject rises out of the top of its cover). Import read-only.
// Layout written up in <working>/animation_source/notes/PORTRAIT_BOOKS.md.
//
// LEGEND
//   * Units: WORLD px = screen px at the rest camera REST_CAM_P (540, 960, k 1). One plane (the focus plane): in
//     flight a book's depth only sets its SIZE (P_SCALE x depthScale(k, d) / (d k)), never its position.
//   * THE SHELF: P_SLOTS[i] = the landed slot of BOOKS[i] (cover centre, top, bottom, left, right; world px). Two rows
//     in publication order, reading left to right then top to bottom: row 0 = Snow Crash, The Diamond Age,
//     Cryptonomicon, Quicksilver (4); row 1 = Anathem, Seveneves, Termination Shock (3), set as bricks under the gaps
//     of row 0. Covers P_COVER_H 230 tall (P_SCALE = 230 / 290 of the 16:9 row), centres P_PITCH apart.
//     HEADROOM (for cut 54's subjects, ~1-1.3x a cover): row 0 tops at y 270 (270 px of clear paper above); row 1
//     tops at y 770, 270 px below row 0's bottoms (500). Row 1's bottoms (1000) sit 80 px above the first caption
//     band (1080).
//   * Neal (NEAL_P): the same cut-out as 16:9 at 0.7 (face, head top -> chin, ~365 px; the photo 1148 wide, wider
//     than the frame, its own side edges softened just off screen), centred, head top 1043, eyes 1232, chin ~1408:
//     his head and shoulders sit in and below the caption bands, under the shelf. Below the shoulders he dissolves
//     into the paper (1690 -> 1850).
//   * Caption bands (screen y of 1920): 1080-1250 and 1360-1460 (P_CAPTION_BANDS). No cover in them.
//   * The camera of cut 45 (portrait): camAtP(f), the 16:9 dolly's shape (log k on s(u) = 1 - (1-u)^3 (1 + 1.5u),
//     u = f / 88, a log-k creep a frame) from his face (k 2.2) back to the rest centre; END_CAM_P = camAtP(104).
//   * Paper: TallPaper (kits/core-memory/deathCountShared), centred at the camera's mid travel. Film life:
//     PortraitFilmLife (nealShared's NealFilmLife with the grain tile upright).
//
// EXPORTS
//   PW, PH, P_CAPTION_BANDS, PCaptionBands, P_COVER_H, P_SCALE, P_PITCH, P_ROW_TOPS, P_SLOTS, PSlot (type),
//   NEAL_P, NealFigureP, LandedRowP, PortraitPlane, pTransform(cam), PortraitPaper, PortraitFilmLife,
//   CAMP (constants), REST_CAM_P, camAtP(f), END_CAM_P, DURATION_P
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, Img, random, staticFile } from "remotion";
import { TallPaper } from "../kits/core-memory/deathCountShared";
import { BOOKS, BookCutOut, COVER_H, bookBob } from "./booksWorld";
import { type NealCam, PAPER_BASE, PhotoCutOut, filmWeave } from "./nealShared";

export const PW = 1080;
export const PH = 1920;
export const DURATION_P = 105;

/** The user's burned-in captions at 9:16 sit in these SCREEN y ranges (of 1920): nothing readable there. */
export const P_CAPTION_BANDS: readonly (readonly [number, number])[] = [
  [1080, 1250],
  [1360, 1460],
];
/** debug overlay of the portrait caption bands (off in renders) */
export const PCaptionBands: React.FC<{ on?: boolean }> = ({ on = false }) =>
  on ? (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {P_CAPTION_BANDS.map(([a, b]) => (
        <div key={a} style={{ position: "absolute", left: 0, top: a, width: PW, height: b - a, background: "rgba(255,0,80,0.28)" }} />
      ))}
    </AbsoluteFill>
  ) : null;

// -- the shelf -------------------------------------------------------------------
export const P_COVER_H = 230;
/** world px per 16:9 rest px for a book (BookCutOut's `scale` at rest) */
export const P_SCALE = P_COVER_H / COVER_H;
/** cover centre to cover centre, along a row */
export const P_PITCH = 236;
/** the covers' tops, row 0 and row 1 */
export const P_ROW_TOPS = [270, 770] as const;
export type PSlot = { i: number; row: number; cx: number; cy: number; top: number; bottom: number; left: number; right: number };
const ROW_OF = [0, 0, 0, 0, 1, 1, 1];
const COL_OF = [-1.5, -0.5, 0.5, 1.5, -1, 0, 1];
export const P_SLOTS: PSlot[] = BOOKS.map((b, i) => {
  const row = ROW_OF[i];
  const cx = PW / 2 + COL_OF[i] * P_PITCH;
  const top = P_ROW_TOPS[row];
  const hw = (b.coverW * P_SCALE) / 2;
  return { i, row, cx, cy: top + P_COVER_H / 2, top, bottom: top + P_COVER_H, left: cx - hw, right: cx + hw };
});

// -- the plane -------------------------------------------------------------------
/** the focus plane's transform at a camera: world (x, y) -> screen (tx + x k, ty + y k) */
export const pTransform = (cam: NealCam) => {
  const tx = PW / 2 - cam.x * cam.k;
  const ty = PH / 2 - cam.y * cam.k;
  return { k: cam.k, tx, ty, transform: `translate(${tx}px, ${ty}px) scale(${cam.k})`, toScreen: (x: number, y: number) => ({ x: tx + x * cam.k, y: ty + y * cam.k }) };
};
/** the focus plane: children absolutely positioned in world px (top-left origin) */
export const PortraitPlane: React.FC<{ cam: NealCam; children: React.ReactNode }> = ({ cam, children }) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: PW, height: PH, transformOrigin: "0 0", transform: pTransform(cam).transform }}>
    {children}
  </div>
);

/** The seven landed books, bobbing (`frame` = the global frame; `since(i)` = frames since book i landed). */
export const LandedRowP: React.FC<{ cam: NealCam; frame: number; only?: (i: number) => boolean; since?: (i: number) => number }> = ({
  cam,
  frame,
  only,
  since,
}) => (
  <PortraitPlane cam={cam}>
    {P_SLOTS.map((s) =>
      only && !only(s.i) ? null : (
        <BookCutOut key={s.i} i={s.i} x={s.cx} y={s.cy + bookBob(s.i, frame, since ? since(s.i) : 99)} scale={P_SCALE} />
      ),
    )}
  </PortraitPlane>
);

// -- Neal --------------------------------------------------------------------------
/** the cut-out: 1640 x 1245 px; head top at src y 38, eyes y ~308, face centre x ~850, chin ~560 (as booksWorld) */
const NEAL_SRC = { w: 1640, h: 1245, headTop: 38, eyes: 308, faceCx: 850, chin: 560 };
const NEAL_S = 0.7;
const EYES = 1232;
export const NEAL_P = {
  src: "neal-stephenson-trailer/neal/neal_2008_cutout.png",
  s: NEAL_S,
  x: PW / 2 - NEAL_SRC.faceCx * NEAL_S, // the cut-out's top-left, world px
  y: EYES - NEAL_SRC.eyes * NEAL_S,
  w: NEAL_SRC.w * NEAL_S,
  aspect: NEAL_SRC.w / NEAL_SRC.h,
  headTop: EYES - (NEAL_SRC.eyes - NEAL_SRC.headTop) * NEAL_S,
  eyesY: EYES,
  chin: EYES + (NEAL_SRC.chin - NEAL_SRC.eyes) * NEAL_S,
  /** a point on his brow (books are born behind it), world px */
  brow: { x: PW / 2 - 6, y: EYES - 70 * NEAL_S },
};
const DISSOLVE = [1690, 1850];
const gradMask = (a: number, b: number): React.CSSProperties => {
  const g = `linear-gradient(to bottom, #000 0px, #000 ${a}px, rgba(0,0,0,0) ${b}px)`;
  return { WebkitMaskImage: g, maskImage: g, WebkitMaskSize: "100% 100%", maskSize: "100% 100%", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat" };
};
const SIDE_FADE = 40;
const sideMask = (w: number): React.CSSProperties => {
  const g = `linear-gradient(to right, rgba(0,0,0,0) 0px, #000 ${w}px, #000 calc(100% - ${w}px), rgba(0,0,0,0) 100%)`;
  return { WebkitMaskImage: g, maskImage: g, WebkitMaskSize: "100% 100%", maskSize: "100% 100%", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat" };
};
/** Neal on the focus plane: his photo on its hard shadow, dissolving into the paper below the shoulders. */
export const NealFigureP: React.FC<{ cam: NealCam }> = ({ cam }) => (
  <PortraitPlane cam={cam}>
    <div style={{ position: "absolute", left: -400, top: 0, width: PW + 800, height: 2000, ...gradMask(DISSOLVE[0], DISSOLVE[1]) }}>
      {/* the photo's own side edges (its shoulders run off the source frame) soften over SIDE_FADE px, just off screen */}
      <div style={{ position: "absolute", left: 400 + NEAL_P.x, top: 0, width: NEAL_P.w, height: 2000, ...sideMask(SIDE_FADE) }}>
        <div style={{ position: "absolute", left: -NEAL_P.x, top: 0 }}>
          <PhotoCutOut src={NEAL_P.src} x={NEAL_P.x} y={NEAL_P.y} w={NEAL_P.w} aspect={NEAL_P.aspect} anchor="top-left" />
        </div>
      </div>
    </div>
  </PortraitPlane>
);

// -- the camera of cut 45 (portrait) --------------------------------------------------
/** As camAt45: log k eases K0 -> 1 on s(u), u = f / F_LAND (one acceleration, one long deceleration), plus a log-k
 *  creep so it never stops; (x, y) ride the same s from his face to the rest centre, then drift. */
export const CAMP = { F_LAND: 88, K0: 2.2, CREEP: 0.0006, X0: 545, Y0: 1268, X1: PW / 2, Y1: PH / 2, DRIFT_Y: -0.15 };
export const REST_CAM_P: NealCam = { x: PW / 2, y: PH / 2, k: 1, x0: PW / 2, y0: PH / 2 };
const camS = (f: number) => {
  const u = Math.min(1, Math.max(0, f / CAMP.F_LAND));
  return 1 - Math.pow(1 - u, 3) * (1 + 1.5 * u);
};
export const camAtP = (f: number): NealCam => {
  const s = camS(f);
  const lk = Math.log(CAMP.K0) * (1 - s) + CAMP.CREEP * (CAMP.F_LAND - f);
  return {
    x: CAMP.X0 + (CAMP.X1 - CAMP.X0) * s,
    y: CAMP.Y0 + (CAMP.Y1 - CAMP.Y0) * s + CAMP.DRIFT_Y * Math.max(0, f - CAMP.F_LAND),
    k: Math.exp(lk),
    x0: REST_CAM_P.x0,
    y0: REST_CAM_P.y0,
  };
};
/** cut 45 portrait's last frame's camera: cut 54 portrait opens here */
export const END_CAM_P = camAtP(DURATION_P - 1);

// -- paper and film life ------------------------------------------------------------------
/** the portrait squared paper under a camera, its photograph centred at the camera's mid travel */
export const PortraitPaper: React.FC<{ frame: number; cam: NealCam }> = ({ frame, cam }) => (
  <TallPaper frame={frame} cx={cam.x} cy={cam.y} k={cam.k} cxRest={PW / 2} cyRest={(CAMP.Y0 + CAMP.Y1) / 2} />
);

const GRAIN = "cerro/shaft/grain_tile.png";
const GRAIN_W = 1216;
const GRAIN_H = 2048;
/** NealFilmLife at 9:16 (the grain tile upright, 1216 x 2048 > 1080 x 1920): gate weave, flicker, vignette, grain. */
export const PortraitFilmLife: React.FC<{
  frame: number;
  children?: React.ReactNode;
  grain?: number;
  weave?: number;
  flicker?: number;
  vignette?: number;
  seed?: string;
}> = ({ frame, children, grain = 0.16, weave = 0.8, flicker = 0.015, vignette = 0.3, seed = "neal" }) => {
  const f = Math.floor(frame);
  const wv = filmWeave(frame, weave);
  const gx = Math.floor(random(`${seed}-gx-${f}`) * (GRAIN_W - PW));
  const gy = Math.floor(random(`${seed}-gy-${f}`) * (GRAIN_H - PH));
  const fx = random(`${seed}-gfx-${f}`) < 0.5 ? -1 : 1;
  const fy = random(`${seed}-gfy-${f}`) < 0.5 ? -1 : 1;
  const n = Math.max(-1, Math.min(1, 0.45 * Math.sin((2 * Math.PI * frame) / 9.3 + 0.4) + 0.55 * (2 * random(`${seed}-fl-${f}`) - 1)));
  const veil = flicker * (1 + n);
  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: PAPER_BASE }}>
      {children ? (
        <AbsoluteFill style={{ transform: `translate(${wv.dx}px, ${wv.dy}px) scale(1.0025)`, transformOrigin: "50% 50%" }}>{children}</AbsoluteFill>
      ) : null}
      <AbsoluteFill style={{ background: `rgba(0,0,0,${veil})` }} />
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse farthest-corner at 50% 46%, rgba(0,0,0,0) 46%, rgba(0,0,0,${0.35 * vignette}) 72%, rgba(0,0,0,${vignette}) 100%)`,
        }}
      />
      <AbsoluteFill style={{ overflow: "hidden", mixBlendMode: "overlay", opacity: grain }}>
        <div style={{ position: "absolute", left: -gx, top: -gy, width: GRAIN_W, height: GRAIN_H, transform: `scale(${fx}, ${fy})` }}>
          <Img src={staticFile(GRAIN)} style={{ position: "absolute", left: 0, top: 0, width: GRAIN_W, height: GRAIN_H, maxWidth: "none" }} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
