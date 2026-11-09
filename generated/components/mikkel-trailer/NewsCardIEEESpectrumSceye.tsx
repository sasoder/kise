// ---------------------------------------------------------------------------
// NewsCardIEEESpectrumSceye (mikkel-trailer, a still for the red-labelled clip, sequence 1.960-6.173 s).
// Core memory podcast style (styles/core-memory.md). Opaque 2048x1080 (the trailer is a 4096x2160 sequence),
// 23.976 fps, 1 frame, rendered --scale=2 to 4096x2160 (Scale 100 in Premiere).
// Design language from generated/components/pushp-trailer/NewsCardAirboundTechCrunch.tsx.
//
// CHECK LINE: what the speaker calls a future "new normal" is already in the news: Sceye's airship really flew to
// Japan as a floating cell tower.
//
// THE LINE (Mikkel, not typeset, the captions carry it): "(I want to make this) as normal as seeing cars in the
// street or ships in the port or trains in the tracks."
// WORD -> FRAME: none (a still).
// DURATION: 1 frame (a still).
//
// THE PICTURE: the article as printed matter lying on the squared paper, every white object on its hard black
// copy at +4/+4, black print on white, no outlines. The photo is a tall subject (the airship climbs nose-up, mast at
// 2.7 % of the photo's height, tail tip at 69 %), so both layouts keep the WHOLE airship above the first caption
// band and let the bands cross only the lower sky and the airfield. LAYOUT (prop `layout`):
//   "A" one sheet, turned -1.2 deg: the black masthead bar across the top, the headline in five lines in the left
//       column, the photo as a window in the right column, the credit under it; the whole sheet sits above the bands.
//   "B" two objects: a headline sheet (masthead + four lines) turned -2.5 deg, top left, lying over the empty left
//       sky of a large photo print turned +1.5 deg, right, which runs under the caption bands.
//   DEFAULT: B (see `defaultProps.layout` and the hand-off).
// CHAIN: ONE 3-stripe crown (orange / purple / blue, 12 px steps) behind the headline sheet's top edge, at rest
// (prop `crown`).
// Headline, outlet and date sit above y 600; the bands (y 607-703, 765-821 of 1080) only cross the photo.
//
// SOURCES: IEEE Spectrum, October 15, 2026 (article:published_time 2026-10-15T14:02:56Z, byline Tim Hornyak),
// on-page h1 "Sceye Flies Floating Cell Tower to Japan to Set Up Test 4G Network" (verbatim),
// https://spectrum.ieee.org/high-altitude-platform-station
// Photo: the article's lead image (5000x3125 original, here downscaled to 2600x1625 in
// public/mikkel-trailer/newscard_ieeespectrum_sceye_photo.jpg), the silver Sceye airship climbing nose-up over the
// New Mexico airfield, credit as shown "SoftBank". Shown as published (colour), like the house news card.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { z } from "zod";
import { BLACK, ChainEcho, CROWN_STEP, INK, PAPER_BASE, PaperGround, SHADOW, SHADOW_OFF, type } from "../kits/core-memory/cerroShared";

export const FPS = 24000 / 1001;
export const DURATION = 1;

export const schema = z.object({
  layout: z.enum(["A", "B"]),
  crown: z.boolean(),
  outlet: z.string(),
  date: z.string(),
  /** the headline as published, one entry per line (natural phrases, ragged right) */
  headlineA: z.array(z.string()),
  headlineB: z.array(z.string()),
  credit: z.string(),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({
  layout: "B",
  crown: true,
  outlet: "IEEE Spectrum",
  date: "October 15, 2026",
  headlineA: ["Sceye flies", "floating cell", "tower to Japan", "to set up test", "4G network"],
  headlineB: ["Sceye flies floating", "cell tower to Japan", "to set up test", "4G network"],
  credit: "Image Credits: SoftBank",
});

const W = 2048;
const H = 1080;
const CAP = 0.7; // Barlow cap height per em
const PHOTO_SRC = "mikkel-trailer/newscard_ieeespectrum_sceye_photo.jpg";
const PHOTO_AR = 1625 / 2600; // height / width
// the airship in the photo, as fractions of its width / height (measured on the 2600 px copy)
export const SHIP = { x0: 0.44, x1: 0.6, y0: 0.027, finBottom: 0.581, y1: 0.69 };

// Barlow 900 advance widths per em (GhostTownForSale's table, measured off Barlow-Black.ttf).
const ADV: Record<string, number> = {
  " ": 0.2, $: 0.58, ",": 0.265, ".": 0.264, "-": 0.419, "'": 0.193, "‘": 0.193, "’": 0.193, ":": 0.26,
  "0": 0.573, "1": 0.356, "2": 0.576, "3": 0.556, "4": 0.641, "5": 0.555, "6": 0.552, "7": 0.511, "8": 0.556, "9": 0.537,
  A: 0.714, B: 0.615, C: 0.609, D: 0.618, E: 0.57, F: 0.554, G: 0.611, H: 0.611, I: 0.266, J: 0.587, K: 0.636, L: 0.574, M: 0.714,
  N: 0.658, O: 0.621, P: 0.6, Q: 0.605, R: 0.615, S: 0.602, T: 0.595, U: 0.617, V: 0.645, W: 0.937, X: 0.659, Y: 0.651, Z: 0.562,
};
export const textWidth = (s: string, size: number, tracking = 0) =>
  s
    .toUpperCase()
    .split("")
    .reduce((w, c) => w + (ADV[c] ?? 0.6) + tracking, 0) * size;

// -- an object on the paper: a w x h rectangle, centre (cx, cy) in frame px, turned `rot` deg about its centre -----
type Obj = { cx: number; cy: number; w: number; h: number; rot: number };
const turn = (o: Obj) => `translate(${o.cx - o.w / 2} ${o.cy - o.h / 2}) rotate(${o.rot} ${o.w / 2} ${o.h / 2})`;
const turnCss = (o: Obj): React.CSSProperties => ({
  position: "absolute",
  left: o.cx - o.w / 2,
  top: o.cy - o.h / 2,
  width: o.w,
  height: o.h,
  transformOrigin: "50% 50%",
  transform: `rotate(${o.rot}deg)`,
});
/** object-local point -> frame px (for the framing checks) */
export const toFrame = (o: Obj, x: number, y: number) => {
  const r = (o.rot * Math.PI) / 180;
  const dx = x - o.w / 2;
  const dy = y - o.h / 2;
  return { x: o.cx + dx * Math.cos(r) - dy * Math.sin(r), y: o.cy + dx * Math.sin(r) + dy * Math.cos(r) };
};

/** a photo window in object-local px: the photo is `iw` px wide, its (fx, fy) fraction at the window's top-left */
type Win = { x: number; y: number; w: number; h: number; iw: number; fx: number; fy: number };
/** a point of the photo (fractions) -> object-local px through a window */
const inWin = (win: Win, u: number, v: number) => ({
  x: win.x + (u - win.fx) * win.iw,
  y: win.y + (v - win.fy) * win.iw * PHOTO_AR,
});

/** The photo, cropped into a window: an <Img> in an HTML layer turned like its object (no bitmap inside the SVG). */
const PhotoLayer: React.FC<{ o: Obj; win: Win }> = ({ o, win }) => {
  const ih = win.iw * PHOTO_AR;
  return (
    <div style={turnCss(o)}>
      <div style={{ position: "absolute", left: win.x, top: win.y, width: win.w, height: win.h, overflow: "hidden" }}>
        <Img
          src={staticFile(PHOTO_SRC)}
          style={{ position: "absolute", left: -win.fx * win.iw, top: -win.fy * ih, width: win.iw, height: ih, maxWidth: "none" }}
        />
      </div>
    </div>
  );
};

const FrameSvg: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
    {children}
  </svg>
);

/** shadow (+4/+4 on screen), the crown behind the top edge, the white body */
const Body: React.FC<{ o: Obj; crown: boolean; children?: React.ReactNode }> = ({ o, crown, children }) => (
  <>
    <g transform={`translate(${SHADOW_OFF} ${SHADOW_OFF})`}>
      <g transform={turn(o)}>
        <rect x={0} y={0} width={o.w} height={o.h} fill={SHADOW} />
      </g>
    </g>
    <g transform={turn(o)}>
      {crown ? (
        <ChainEcho
          frame={0}
          start={-100}
          core="none"
          step={CROWN_STEP}
          render={(fill) => <rect x={0} y={0} width={o.w} height={30} fill={fill} />}
        />
      ) : null}
      <rect x={0} y={0} width={o.w} height={o.h} fill={INK} />
      {children}
    </g>
  </>
);

/** the masthead: a black bar with the outlet (white, tracked) at left and the date at right */
const Masthead: React.FC<{ x: number; y: number; w: number; h: number; outlet: string; date: string; size: number }> = ({
  x,
  y,
  w,
  h,
  outlet,
  date,
  size,
}) => {
  const base = y + h / 2 + (CAP * size) / 2;
  const pad = (h - CAP * size) / 2 + 6;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={BLACK} />
      <text x={x + pad} y={base} fill={INK} style={type(size, 900, 0.08)}>
        {outlet}
      </text>
      <text x={x + w - pad} y={base} textAnchor="end" fill={INK} style={type(size * 0.88, 800, 0.06)}>
        {date}
      </text>
    </g>
  );
};

const Headline: React.FC<{ x: number; capTop: number; size: number; lead: number; lines: string[] }> = ({
  x,
  capTop,
  size,
  lead,
  lines,
}) => (
  <g>
    {lines.map((line, i) => (
      <text key={i} x={x - size * 0.04} y={capTop + CAP * size + i * lead} fill={BLACK} style={type(size, 900)}>
        {line}
      </text>
    ))}
  </g>
);

// ===== LAYOUT A: one sheet, the headline column beside the photo window =========================================
const A = (() => {
  const m = 44;
  const w = 1440;
  const mast = { y: 36, h: 56, size: 30 };
  const size = 64;
  const lead = 70;
  const capTop = mast.y + mast.h + 40;
  const lastBase = capTop + CAP * size + 4 * lead;
  const colW = 570; // the headline column (widest line "TOWER TO JAPAN" ~527 at 64)
  const winX = m + colW + 28;
  const winY = mast.y + mast.h + 18;
  const winW = w - m - winX;
  const winH = lastBase + 8 - winY;
  const creditBase = winY + winH + 28;
  const h = creditBase + 18;
  const sheet: Obj = { cx: W / 2, cy: 72 + h / 2, w, h, rot: -1.2 };
  // the photo scaled so mast..tail fills the window with a little sky above, the airship centred across the window
  const iw = (winH / (SHIP.y1 + 0.03)) / PHOTO_AR;
  const shipCx = (SHIP.x0 + SHIP.x1) / 2;
  const win: Win = { x: winX, y: winY, w: winW, h: winH, iw, fx: shipCx - winW / 2 / iw, fy: 0 };
  return { sheet, m, mast, size, lead, capTop, lastBase, win, creditBase };
})();

// ===== LAYOUT B: a headline sheet over the empty left sky of a photo print =======================================
const B = (() => {
  const m = 48;
  const size = 66;
  const lead = 74;
  const mast = { y: 38, h: 58, size: 30 };
  const capTop = mast.y + mast.h + 40;
  const lastBase = capTop + CAP * size + 3 * lead;
  const w = 812;
  const h = lastBase + 46;
  const sheet: Obj = { cx: 304 + w / 2, cy: 116 + h / 2, w, h, rot: -2.5 };
  const border = 22;
  const creditH = 44;
  const iw = 1120; // photo px -> frame px: mast to tail tip in y ~120-605, clear of the first band
  const fx = 0.06;
  const imgW = Math.round((0.94 - fx) * iw);
  const imgH = Math.round(iw * PHOTO_AR);
  const pw = imgW + 2 * border;
  const ph = border + imgH + creditH;
  const print: Obj = { cx: 1746 - pw / 2, cy: 92 + ph / 2, w: pw, h: ph, rot: 1.5 };
  const win: Win = { x: border, y: border, w: imgW, h: imgH, iw, fx, fy: 0 };
  return { sheet, print, m, mast, size, lead, capTop, lastBase, win, border, imgH };
})();

const NewsCardIEEESpectrumSceye: React.FC<Props> = ({ layout, crown, outlet, date, headlineA, headlineB, credit }) => {
  const ground = <PaperGround frame={0} cx={W / 2} cy={H / 2} cxRest={W / 2} cyRest={H / 2} k={1} />;

  if (layout === "A") {
    const { sheet, m, mast, size, lead, capTop, win, creditBase } = A;
    return (
      <AbsoluteFill style={{ backgroundColor: PAPER_BASE }}>
        {ground}
        <FrameSvg>
          <Body o={sheet} crown={crown}>
            <Masthead x={m} y={mast.y} w={sheet.w - 2 * m} h={mast.h} outlet={outlet} date={date} size={mast.size} />
            <Headline x={m} capTop={capTop} size={size} lead={lead} lines={headlineA} />
            <text x={sheet.w - m} y={creditBase} textAnchor="end" fill={BLACK} style={type(20, 800, 0.06)}>
              {credit}
            </text>
          </Body>
        </FrameSvg>
        <PhotoLayer o={sheet} win={win} />
      </AbsoluteFill>
    );
  }

  const { sheet, print, m, mast, size, lead, capTop, win, border, imgH } = B;
  return (
    <AbsoluteFill style={{ backgroundColor: PAPER_BASE }}>
      {ground}
      {/* the photo print, under */}
      <FrameSvg>
        <Body o={print} crown={false}>
          <text x={print.w - border} y={border + imgH + 32} textAnchor="end" fill={BLACK} style={type(20, 800, 0.06)}>
            {credit}
          </text>
        </Body>
      </FrameSvg>
      <PhotoLayer o={print} win={win} />
      {/* the headline sheet, over the print's left sky */}
      <FrameSvg>
        <Body o={sheet} crown={crown}>
          <Masthead x={m} y={mast.y} w={sheet.w - 2 * m} h={mast.h} outlet={outlet} date={date} size={mast.size} />
          <Headline x={m} capTop={capTop} size={size} lead={lead} lines={headlineB} />
        </Body>
      </FrameSvg>
    </AbsoluteFill>
  );
};

export default NewsCardIEEESpectrumSceye;

// framing numbers for the hand-off (frame px)
const shipBox = (o: Obj, win: Win) => {
  const pts = [
    inWin(win, SHIP.x0, SHIP.y0),
    inWin(win, SHIP.x1, SHIP.y0),
    inWin(win, SHIP.x0, SHIP.y1),
    inWin(win, SHIP.x1, SHIP.y1),
  ].map((p) => toFrame(o, p.x, p.y));
  const fin = inWin(win, SHIP.x1, SHIP.finBottom);
  return {
    x0: Math.min(...pts.map((p) => p.x)),
    x1: Math.max(...pts.map((p) => p.x)),
    y0: Math.min(...pts.map((p) => p.y)),
    y1: Math.max(...pts.map((p) => p.y)),
    finBottom: toFrame(o, fin.x, fin.y).y,
  };
};
export const framing = {
  A: {
    lastBaseLeft: toFrame(A.sheet, A.m, A.lastBase).y,
    sheetBottomLeft: toFrame(A.sheet, 0, A.sheet.h).y,
    sheetBottomRight: toFrame(A.sheet, A.sheet.w, A.sheet.h).y,
    sheet: A.sheet,
    widestLine: Math.max(...defaultProps.headlineA.map((l) => textWidth(l, A.size))),
    ship: shipBox(A.sheet, A.win),
  },
  B: {
    lastBaseLeft: toFrame(B.sheet, B.m, B.lastBase).y,
    sheetRightTop: toFrame(B.sheet, B.sheet.w, 0),
    sheetRightBottom: toFrame(B.sheet, B.sheet.w, B.sheet.h),
    sheet: B.sheet,
    print: B.print,
    widestLine: Math.max(...defaultProps.headlineB.map((l) => textWidth(l, B.size))),
    ship: shipBox(B.print, B.win),
  },
};
