// ---------------------------------------------------------------------------
// NewsCardAimNaman (shruti-trailer, the red-labelled clip, sequence 59.601-67.067 s; a still for the stills track).
// Core memory podcast style (styles/core-memory.md). Opaque 1920x1080, 23.976 fps, 1 frame,
// rendered --scale=2 to 3840x2160 (the sequence frame, Scale 100 in Premiere).
// Paper, shadow, Barlow advance table and type helpers from generated/components/pushp-trailer/NewsCardAirboundTechCrunch.tsx
// (and NewsCardFortuneAIPause / NewsCardIEEESpectrumSceye); the layouts are this card's own.
// The animated version (179 f, the same scene under a slow push-in, film life and the highlighter) is
// NewsCardAimNamanAnim.tsx, which imports `NewsCardAimNamanScene` from here.
//
// CHECK LINE: the kid Shruti met at 16 is now in the press as a 20-year-old building delivery drones — the "fully
// formed" teenager turned out to be real.
//
// THE LINE (Shruti, not typeset, the captions carry it): "Naman at 16 sounded, it was like he had hatched out of an
// egg or something. Like he just came out as this fully formed person."
// WORD -> FRAME: none (a still; the animation's table is in NewsCardAimNamanAnim.tsx).
// DURATION: 1 frame (a still).
//
// THE PICTURE: the article as printed matter lying on the squared paper, every white object on its hard black copy
// at +4/+4, black print on white, no outlines. LAYOUT (prop `layout`):
//   "A" ONE PAGE, two columns, turned -1.2 deg: the black masthead bar across the top; the headline in five lines
//       (80 px) in the left column with the byline under it; the photo window (16:9, the whole aircraft and Naman)
//       in the right column, the credit under it. The sheet sits centred on the frame's middle.
//   "B" A PRINT AND A SLIP: a large photo print (the whole photo, 1320 px wide) turned -1.5 deg, upper left; a
//       headline slip (masthead + four lines, 74 px) turned +2 deg lying over the print's lower-right corner, on the
//       empty wall right of Naman's arm, running off the print onto the paper. The two masses balance on a diagonal
//       through the frame's middle.
//   DEFAULT: A (approved by the director; B delivered as the alt).
// CHAIN = India's outliers (COMMON.md legend); Naman is one, so ONE 3-stripe crown (orange / purple / blue, 12 px
// steps) behind the headline sheet's top edge, at rest (prop `crown`).
// HIGHLIGHT (prop `highlight`, 0..1, the still default 0): a flat chain-orange block behind "20-YEAR-OLD", wiped on
// left to right; the animation draws it on at f24.
// No caption bands (16:9 trailer): composed for the whole 1920x1080, balanced round the middle.
//
// SOURCES: Analytics India Magazine, October 11, 2025 (article:published_time 2025-10-11T05:30+05:30), byline Sanjana
// Gupta, "This 20-Year-Old is Building Drones to Bring Delivery Costs Down to Just ₹1" (headline verbatim, set
// uppercase), https://analyticsindiamag.com/deep-tech/this-20-year-old-is-building-drones-to-bring-delivery-costs-down-to-just-rs1
// Photo: the article's lead image (Naman holding the Airbound aircraft over his head). AIM's copy is 1600x900; the
// same photo at 1920x1080 (Outlook Business, sharper, a slightly tighter crop that keeps the whole aircraft) is the
// one used: public/shruti-trailer/newscard_aim_naman_photo_1920.jpg. Credit "Photo: Airbound" (as Outlook Business
// credits it; AIM shows none). Shown as published (colour), like the house card: the photo is near-neutral already.
// FONT: Barlow (Google, latin) has no ₹ glyph (U+20B9 checked in the cmap of Barlow-900.otf); the ₹ falls back to
// Roboto Black (public/shruti-trailer/fonts/Roboto-Black.ttf, Apache 2.0, from ~/Library/Fonts), the nearest local
// heavy grotesque that has it.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile } from "remotion";
import { loadFont } from "@remotion/fonts";
import { z } from "zod";
import {
  BLACK,
  ChainEcho,
  CROWN_STEP,
  INK,
  ORANGE,
  PAPER_BASE,
  PaperGround,
  SHADOW,
  SHADOW_OFF,
  fontFamily,
  type,
} from "../kits/core-memory/cerroShared";

export const FPS = 24000 / 1001;
export const DURATION = 1;

const RUPEE_FAMILY = "AimNamanRupee";
loadFont({ family: RUPEE_FAMILY, url: staticFile("shruti-trailer/fonts/Roboto-Black.ttf"), weight: "900", unicodeRange: "U+20B9" });

export const schema = z.object({
  layout: z.enum(["A", "B"]),
  crown: z.boolean(),
  /** the highlighter behind "20-YEAR-OLD": 0 = none, 1 = drawn on */
  highlight: z.number().min(0).max(1),
  outlet: z.string(),
  date: z.string(),
  byline: z.string(),
  /** the headline as published, one entry per line; line 0 starts with HIGHLIGHT_LEAD + HIGHLIGHT_WORD */
  headlineA: z.array(z.string()),
  headlineB: z.array(z.string()),
  credit: z.string(),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({
  layout: "A",
  crown: true,
  highlight: 0,
  outlet: "Analytics India Magazine",
  date: "October 11, 2025",
  byline: "By Sanjana Gupta",
  headlineA: ["This 20-Year-Old", "is Building", "Drones to Bring", "Delivery Costs", "Down to Just ₹1"],
  headlineB: ["This 20-Year-Old is", "Building Drones to", "Bring Delivery Costs", "Down to Just ₹1"],
  credit: "Photo: Airbound",
});
const HIGHLIGHT_LEAD = "This ";
const HIGHLIGHT_WORD = "20-Year-Old";

export const W = 1920;
export const H = 1080;
const CAP = 0.7; // Barlow cap height per em
const PHOTO_SRC = "shruti-trailer/newscard_aim_naman_photo_1920.jpg";
const PHOTO_AR = 1080 / 1920; // height / width

// Barlow 900 advance widths per em (GhostTownForSale's table, measured off Barlow-Black.ttf); ₹ is Roboto Black's.
const ADV: Record<string, number> = {
  " ": 0.2, $: 0.58, ",": 0.265, ".": 0.264, "-": 0.419, "'": 0.193, "‘": 0.193, "’": 0.193, ":": 0.26, "₹": 0.53,
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

const headStyle = (size: number) => ({ ...type(size, 900), fontFamily: `${fontFamily}, ${RUPEE_FAMILY}` });

/** The highlighter: a flat ORANGE block behind HIGHLIGHT_WORD on line 0, wiped on left to right (p 0..1). */
const Highlight: React.FC<{ x: number; capTop: number; size: number; p: number }> = ({ x, capTop, size, p }) => {
  if (p <= 0) return null;
  const padX = size * 0.1;
  const x0 = x - size * 0.04 + textWidth(HIGHLIGHT_LEAD, size) - padX;
  const fullW = textWidth(HIGHLIGHT_WORD, size) + 2 * padX;
  const y0 = capTop - size * 0.13;
  const y1 = capTop + CAP * size + size * 0.13;
  return <rect x={x0} y={y0} width={fullW * Math.min(1, p)} height={y1 - y0} fill={ORANGE} />;
};

const Headline: React.FC<{ x: number; capTop: number; size: number; lead: number; lines: string[]; highlight: number }> = ({
  x,
  capTop,
  size,
  lead,
  lines,
  highlight,
}) => (
  <g>
    <Highlight x={x} capTop={capTop} size={size} p={highlight} />
    {lines.map((line, i) => (
      <text key={i} x={x - size * 0.04} y={capTop + CAP * size + i * lead} fill={BLACK} style={headStyle(size)}>
        {line}
      </text>
    ))}
  </g>
);

const Credit: React.FC<{ x: number; y: number; text: string }> = ({ x, y, text }) => (
  <text x={x} y={y} textAnchor="end" fill={BLACK} style={type(20, 800, 0.06)}>
    {text}
  </text>
);

// ===== LAYOUT A: one page, headline column left, photo window right =============================================
export const LAYOUT_A = (() => {
  const m = 50;
  const gap = 52;
  const colW = 700; // the headline column
  const size = 80;
  const lead = 88;
  const photoW = 880;
  const photoH = Math.round(photoW * PHOTO_AR); // 495, the whole photo
  const w = m + colW + gap + photoW + m;
  const mast = { y: 40, h: 58, size: 30 };
  const bodyY = mast.y + mast.h + 40;
  const capTop = bodyY + 6;
  const lastBase = capTop + CAP * size + 4 * lead;
  const bylineBase = bodyY + photoH; // the byline's baseline on the photo's bottom edge
  const creditBase = bodyY + photoH + 32;
  const h = creditBase + 26;
  const sheet: Obj = { cx: W / 2, cy: H / 2 + 6, w, h, rot: -1.2 };
  const photoX = m + colW + gap;
  const win: Win = { x: photoX, y: bodyY, w: photoW, h: photoH, zoom: 1, fx: 0, fy: 0 };
  return { sheet, m, mast, size, lead, capTop, lastBase, bylineBase, win, creditBase, photoX, photoW };
})();

// ===== LAYOUT B: a large photo print, a headline slip over its lower-right corner ===============================
export const LAYOUT_B = (() => {
  const border = 22;
  const imgW = 1320;
  const imgH = Math.round(imgW * PHOTO_AR); // 743, the whole photo
  const creditH = 46;
  const pw = imgW + 2 * border;
  const ph = border + imgH + creditH;
  const print: Obj = { cx: 52 + pw / 2, cy: 48 + ph / 2, w: pw, h: ph, rot: -1.5 };
  const win: Win = { x: border, y: border, w: imgW, h: imgH, zoom: 1, fx: 0, fy: 0 };

  const m = 46;
  const size = 74;
  const lead = 82;
  const mast = { y: 38, h: 56, size: 29 };
  const capTop = mast.y + mast.h + 40;
  const lastBase = capTop + CAP * size + 3 * lead;
  const w = 900;
  const h = lastBase + 44;
  const sheet: Obj = { cx: 1872 - w / 2, cy: 1036 - h / 2, w, h, rot: 2 };
  return { print, win, border, imgH, sheet, m, mast, size, lead, capTop, lastBase };
})();

/** The card's picture (no ground, no film life): the objects in frame px at k 1. */
export const NewsCardAimNamanScene: React.FC<Props> = ({
  layout,
  crown,
  highlight,
  outlet,
  date,
  byline,
  headlineA,
  headlineB,
  credit,
}) => {
  if (layout === "A") {
    const { sheet, m, mast, size, lead, capTop, bylineBase, win, creditBase, photoX, photoW } = LAYOUT_A;
    return (
      <>
        <FrameSvg>
          <Body o={sheet} crown={crown}>
            <Masthead x={m} y={mast.y} w={sheet.w - 2 * m} h={mast.h} outlet={outlet} date={date} size={mast.size} />
            <Headline x={m} capTop={capTop} size={size} lead={lead} lines={headlineA} highlight={highlight} />
            <text x={m} y={bylineBase} fill={BLACK} style={type(24, 800, 0.06)}>
              {byline}
            </text>
            <Credit x={photoX + photoW} y={creditBase} text={credit} />
          </Body>
        </FrameSvg>
        <PhotoLayer o={sheet} win={win} />
      </>
    );
  }

  const { print, win, border, imgH, sheet, m, mast, size, lead, capTop } = LAYOUT_B;
  return (
    <>
      {/* the photo print, under */}
      <FrameSvg>
        <Body o={print} crown={false}>
          <Credit x={print.w - border} y={border + imgH + 32} text={credit} />
        </Body>
      </FrameSvg>
      <PhotoLayer o={print} win={win} />
      {/* the headline slip, over its lower-right corner */}
      <FrameSvg>
        <Body o={sheet} crown={crown}>
          <Masthead x={m} y={mast.y} w={sheet.w - 2 * m} h={mast.h} outlet={outlet} date={date} size={mast.size} />
          <Headline x={m} capTop={capTop} size={size} lead={lead} lines={headlineB} highlight={highlight} />
        </Body>
      </FrameSvg>
    </>
  );
};

const NewsCardAimNaman: React.FC<Props> = (props) => (
  <AbsoluteFill style={{ backgroundColor: PAPER_BASE }}>
    <PaperGround frame={0} cx={W / 2} cy={H / 2} cxRest={W / 2} cyRest={H / 2} k={1} />
    <NewsCardAimNamanScene {...props} />
  </AbsoluteFill>
);

export default NewsCardAimNaman;

/** highlighter progress for a frame: drawn on over `len` frames from `start`, eased out (a marker slowing at the end) */
export const highlightAt = (frame: number, start: number, len: number) =>
  interpolate(frame, [start, start + len], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.35, 0.2, 0.3, 1),
  });

// framing numbers for the hand-off (frame px)
export const framing = {
  A: {
    sheet: LAYOUT_A.sheet,
    widestLine: Math.max(...defaultProps.headlineA.map((l) => textWidth(l, LAYOUT_A.size))),
    lastBaseLeft: toFrame(LAYOUT_A.sheet, LAYOUT_A.m, LAYOUT_A.lastBase).y,
  },
  B: {
    print: LAYOUT_B.print,
    sheet: LAYOUT_B.sheet,
    widestLine: Math.max(...defaultProps.headlineB.map((l) => textWidth(l, LAYOUT_B.size))),
  },
};
