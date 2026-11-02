// ---------------------------------------------------------------------------
// NewsCardAirboundTechCrunch (pushp-trailer, a still on the stills track for 23.941-30.948 s).
// Core memory podcast style (styles/core-memory.md). Opaque 1920x1080, 23.976 fps, 1 frame,
// rendered --scale=2 to 3840x2160 (the sequence frame, Scale 100 in Premiere).
// Pattern from generated/components/neal-stephenson-trailer/NewsCardFortuneAIPause.tsx.
//
// CHECK LINE: "The kid who moved out at 16 runs a company the press is writing about."
//
// THE LINE (Naman, not typeset, the captions carry it): "So at 16, I ended up moving out ... it was their idea."
// WORD -> FRAME: none (a still).
// DURATION: 1 frame (a still).
//
// THE PICTURE: the article as printed matter lying on the squared paper, every white object on its hard black
// copy at +4/+4, black print on white, no outlines. LAYOUT (prop `layout`):
//   "A" one sheet, turned -2 deg: the black masthead bar, the headline in two lines, a wide photo banner inset
//       below (the whole aircraft and its box), the credit under it;
//   "B" two objects: a headline sheet (masthead + four lines) turned -2.5 deg, top left, lying over the empty sky
//       of a large photo print turned +1.5 deg, right, which runs under the caption bands.
//   In both, the photo is framed so the box hangs BELOW the second caption band and only the tether, wing and sky
//   sit under the captions. DEFAULT: see `defaultProps.layout` and the hand-off for why.
// CHAIN: ONE 3-stripe crown (orange / purple / blue, 12 px steps) behind the headline sheet's top edge, at rest
// (prop `crown`).
// Headline, outlet and date sit above y 600; the bands (y 607-703, 765-821) only cross the photo.
//
// SOURCES: TechCrunch, October 14, 2025, "India's Airbound bags $8.65M to build rocket-like drones for one-cent
// deliveries" (headline verbatim),
// https://techcrunch.com/2025/10/14/indias-airbound-led-by-20-year-old-bags-8-65m-to-work-toward-one-cent-drone-deliveries-at-scale/
// Photo: public/pushp-trailer/newscard_techcrunch_airbound_photo.jpg (1920x1280), the real aircraft with its box in a
// blue sky, credit "Image Credits: Airbound". Shown as published (colour), like the house news card.
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
  /** the headline as published, one entry per line (balanced by width) */
  headlineA: z.array(z.string()),
  headlineB: z.array(z.string()),
  credit: z.string(),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({
  layout: "B",
  crown: true,
  outlet: "TechCrunch",
  date: "October 14, 2025",
  headlineA: ["India's Airbound bags $8.65M to build", "rocket-like drones for one-cent deliveries"],
  headlineB: ["India's Airbound", "bags $8.65M to build", "rocket-like drones for", "one-cent deliveries"],
  credit: "Image Credits: Airbound",
});

const W = 1920;
const H = 1080;
const CAP = 0.7; // Barlow cap height per em
const PHOTO_SRC = "pushp-trailer/newscard_techcrunch_airbound_photo.jpg";
const PHOTO_W = 1920;
const PHOTO_AR = 1280 / PHOTO_W;

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

type Win = { x: number; y: number; w: number; h: number; zoom: number; fx: number; fy: number };

/** The photo, cropped into a window: the image is `zoom` x the window width, its (fx, fy) fraction at the window's
 *  top-left. An <Img> in an HTML layer turned like its object (no bitmap inside the SVG). */
const PhotoLayer: React.FC<{ o: Obj; win: Win }> = ({ o, win }) => {
  const iw = win.w * win.zoom;
  const ih = iw * PHOTO_AR;
  return (
    <div style={turnCss(o)}>
      <div style={{ position: "absolute", left: win.x, top: win.y, width: win.w, height: win.h, overflow: "hidden" }}>
        <Img
          src={staticFile(PHOTO_SRC)}
          style={{ position: "absolute", left: -win.fx * iw, top: -win.fy * ih, width: iw, height: ih, maxWidth: "none" }}
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

// ===== LAYOUT A: one sheet, headline over a wide photo banner ===================================================
const A = (() => {
  const w = 1400;
  const m = 46;
  const mast = { y: 36, h: 52, size: 28 };
  const size = 56;
  const lead = 64;
  const capTop = mast.y + mast.h + 30;
  const lastBase = capTop + CAP * size + lead;
  const photoY = lastBase + 26;
  const photoH = 640;
  const creditBase = photoY + photoH + 30;
  const h = creditBase + 18;
  const sheet: Obj = { cx: W / 2, cy: 548, w, h, rot: -2 };
  const win: Win = { x: m, y: photoY, w: w - 2 * m, h: photoH, zoom: 1, fx: 0, fy: 190 / 1280 };
  return { sheet, m, mast, size, lead, capTop, lastBase, win, creditBase };
})();

// ===== LAYOUT B: a headline sheet over the empty sky of a photo print ===========================================
const B = (() => {
  const m = 48;
  const size = 76;
  const lead = 84;
  const mast = { y: 38, h: 58, size: 30 };
  const capTop = mast.y + mast.h + 42;
  const lastBase = capTop + CAP * size + 3 * lead;
  const w = 1010;
  const h = lastBase + 46;
  const sheet: Obj = { cx: 56 + w / 2, cy: 84 + h / 2, w, h, rot: -2.5 };
  const border = 22;
  const creditH = 46;
  const pw = 1214;
  const imgW = pw - 2 * border;
  const imgH = 903;
  const ph = border + imgH + creditH;
  const print: Obj = { cx: 1864 - pw / 2, cy: 78 + ph / 2, w: pw, h: ph, rot: 1.5 };
  const scale = 0.82; // photo px -> frame px: the aircraft clears the sheet, the box clears the bands
  const win: Win = { x: border, y: border, w: imgW, h: imgH, zoom: (PHOTO_W * scale) / imgW, fx: 0, fy: 30 / 1280 };
  return { sheet, print, m, mast, size, lead, capTop, lastBase, win, border, imgH };
})();

const NewsCardAirboundTechCrunch: React.FC<Props> = ({ layout, crown, outlet, date, headlineA, headlineB, credit }) => {
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
          <text x={print.w - border} y={border + imgH + 38} textAnchor="end" fill={BLACK} style={type(20, 800, 0.06)}>
            {credit}
          </text>
        </Body>
      </FrameSvg>
      <PhotoLayer o={print} win={win} />
      {/* the headline sheet, over its corner */}
      <FrameSvg>
        <Body o={sheet} crown={crown}>
          <Masthead x={m} y={mast.y} w={sheet.w - 2 * m} h={mast.h} outlet={outlet} date={date} size={mast.size} />
          <Headline x={m} capTop={capTop} size={size} lead={lead} lines={headlineB} />
        </Body>
      </FrameSvg>
    </AbsoluteFill>
  );
};

export default NewsCardAirboundTechCrunch;

// framing numbers for the hand-off (frame px)
export const framing = {
  A: {
    lastBaseLeft: toFrame(A.sheet, A.m, A.lastBase).y,
    sheet: A.sheet,
    widestLine: Math.max(...defaultProps.headlineA.map((l) => textWidth(l, A.size))),
  },
  B: {
    lastBaseLeft: toFrame(B.sheet, B.m, B.lastBase).y,
    sheet: B.sheet,
    print: B.print,
    widestLine: Math.max(...defaultProps.headlineB.map((l) => textWidth(l, B.size))),
  },
};
