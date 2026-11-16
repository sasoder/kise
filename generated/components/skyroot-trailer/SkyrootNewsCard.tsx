// ---------------------------------------------------------------------------
// SkyrootNewsCard (skyroot-trailer): the MINIMAL 16:9 news card, a still. Core memory podcast style
// (styles/core-memory.md), on the clip's shared module (skyrootShared). Opaque 2048 x 1080, rendered --scale 2.
// Used by NewsCardAljazeeraLaunch (card A, the launch) and NewsCardBusinessTodayUnicorn (card B, the funding): the
// two run back to back in the edit, so they share this one design and differ only in content (and the mirrored turn).
//
// WHY MINIMAL: the user's marker on card A, "make a newscard for this but much more minimalistic than usual". The
// usual Core Memory 16:9 card (mikkel-trailer/NewsCardIEEESpectrumSceye, pushp-trailer/NewsCardAirboundTechCrunch)
// carries a black masthead bar, a five-line headline, a photo print, a credit line and a 3-stripe crown. This one is
// ONE object: a white slip on its hard black shadow (+SHADOW_OFF, zero blur) on generous squared paper, the outlet
// and the date small in black on one line above a black Barlow 900 headline in natural phrase lines, ragged right.
// One weight (900) throughout, one left edge, the date right-aligned to the slip's text measure. No bar, no rules,
// no credit line (layout A).
//
// LAYOUT (prop `layout`):
//   "A" the slip alone, centred in the frame horizontally and in the readable zone (y < 600) vertically.
//   "B" the slip plus a modest portrait photo print (white border, its credit small in the bottom border) tucked
//       under the slip's right edge (the slip's hard shadow is the line between them; the tucked part is blank
//       paper, so the visible border is even), turned the other way; the pair is centred as a group.
//   "C" (the user's note on card A, Nov 16: "add the image that was in the article ... center it ... highlight launch
//       of first private-sector ... with the core memory colors") the slip plus the article's lead photo as a REAL
//       print (white border, the credit small in its foot, turned the other way to the slip, its blank left border
//       tucked under the slip's right edge), the image window `photo.printH` px tall (default 740). The pair, as one
//       group, is centred on the whole 2048 x 1080 frame (no caption bands at 16:9: CRAFT Format) and scaled to fill
//       it inside C_MARGIN_X / C_MARGIN_Y of paper. `highlight` = the headline line index set as a marker: a BLUE
//       block behind the line with white type on its hard shadow, purple and orange stepped above it as the chain
//       crown (orange back, purple, blue = directly under the white core: the chain order). The highlighted line gets
//       extra leading for its block and crown. Layouts A and B ignore `highlight` and are unchanged.
// CHAIN (prop `chain`): "thin" = three touching thin stripes (orange / purple / blue, `chainStep` px each) behind
//   the slip's top edge, the crown of the whole slip at a fraction of the usual 12 px step; "none" = no chain.
//   The chain means SKYROOT'S OWN in this clip: both cards' stories are Skyroot's own rocket / company.
// FRAMING (A, B): every readable thing (outlet, date, headline, credit) above y 600 (the caption bands are 607-703 and
//   765-821 of 1080). `cardFraming(props)` returns the numbers for a hand-off check.
// TYPE: Barlow 900 uppercase (`type`), black on white. Sizes are derived from one headline size; `size` caps it and
//   the card shrinks it to fit the width / height budget, so a longer headline gets smaller type, never a new layout.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { BLUE, ChainEcho, INK, ORANGE, PAPER_BASE, PURPLE, SHADOW, SHADOW_OFF, SKYROOT_FILTER, SkyrootFilmLife, SkyrootPaper, type } from "./skyrootShared";

const W = 2048;
const H = 1080;
const BLACK = "#000000";
const CAP = 0.7; // Barlow cap height per em

/** the bottom of the readable zone (screen y): the first caption band starts at 607 */
export const READ_LIMIT = 600;

// Barlow 900 advance widths per em (GhostTownForSale's table, measured off Barlow-Black.ttf).
const ADV: Record<string, number> = {
  " ": 0.2, $: 0.58, ",": 0.265, ".": 0.264, "-": 0.419, "'": 0.193, "‘": 0.193, "’": 0.193, ":": 0.26,
  "0": 0.573, "1": 0.356, "2": 0.576, "3": 0.556, "4": 0.641, "5": 0.555, "6": 0.552, "7": 0.511, "8": 0.556, "9": 0.537,
  A: 0.714, B: 0.615, C: 0.609, D: 0.618, E: 0.57, F: 0.554, G: 0.611, H: 0.611, I: 0.266, J: 0.587, K: 0.636, L: 0.574, M: 0.714,
  N: 0.658, O: 0.621, P: 0.6, Q: 0.605, R: 0.615, S: 0.602, T: 0.595, U: 0.617, V: 0.645, W: 0.937, X: 0.659, Y: 0.651, Z: 0.562,
};
/** set width of an uppercase Barlow 900 string at `size` px, `tracking` em per glyph */
export const textWidth = (s: string, size: number, tracking = 0) =>
  s
    .toUpperCase()
    .split("")
    .reduce((w, c) => w + (ADV[c] ?? 0.6) + tracking, 0) * size;

export type CardPhoto = {
  /** staticFile path under public/ */
  src: string;
  /** pixel size of the source image */
  w: number;
  h: number;
  credit?: string;
  /** crop window as fractions of the photo (default the whole photo) */
  crop?: { x0: number; y0: number; x1: number; y1: number };
  /** "colour" as published (house news-card rule) or "grade" = the clip's black-and-white photo grade */
  look?: "colour" | "grade";
  /** layout C: the image window's height in frame px (default C_PRINT_H); keep it small for a small source */
  printH?: number;
};

export type SkyrootNewsCardProps = {
  layout: "A" | "B" | "C";
  outlet: string;
  date: string;
  /** the headline as published, one entry per line (natural phrases, ragged right) */
  headline: string[];
  photo?: CardPhoto;
  /** "thin" chain crown behind the slip's top edge, or "none" */
  chain?: "thin" | "none";
  /** px per chain stripe (screen); the usual crown is 12 */
  chainStep?: number;
  /** the slip's turn in degrees (card B mirrors card A's) */
  rot?: number;
  /** the print's turn in degrees (layout B) */
  printRot?: number;
  /** the headline size cap (px at 2048); the card shrinks it to fit */
  size?: number;
  /** old-film life over the still (grain, weave, flicker, vignette) */
  film?: boolean;
  /** layout C: the index of the headline line set as the chain-colour marker (none if absent) */
  highlight?: number;
};

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
/** object-local point -> frame px */
export const toFrame = (o: Obj, x: number, y: number) => {
  const r = (o.rot * Math.PI) / 180;
  const dx = x - o.w / 2;
  const dy = y - o.h / 2;
  return { x: o.cx + dx * Math.cos(r) - dy * Math.sin(r), y: o.cy + dx * Math.sin(r) + dy * Math.cos(r) };
};
/** the frame-px bounding box of an object's rectangle (local x0..x1, y0..y1) */
const boxOf = (o: Obj, x0 = 0, y0 = 0, x1 = o.w, y1 = o.h) => {
  const p = [toFrame(o, x0, y0), toFrame(o, x1, y0), toFrame(o, x0, y1), toFrame(o, x1, y1)];
  return { x0: Math.min(...p.map((q) => q.x)), x1: Math.max(...p.map((q) => q.x)), y0: Math.min(...p.map((q) => q.y)), y1: Math.max(...p.map((q) => q.y)) };
};

// -- the slip's typesetting, all derived from the headline size -------------------------------------------------------
const META_TRACK = 0.14;
const slipMetrics = (size: number, lines: number) => {
  const pad = Math.round(0.64 * size); // margin on all four sides
  const meta = Math.round(0.36 * size); // outlet + date size
  const metaBase = pad + CAP * meta;
  const capTop = metaBase + Math.round(0.6 * size);
  const lead = Math.round(1.06 * size);
  const lastBase = capTop + CAP * size + (lines - 1) * lead;
  const h = Math.round(lastBase + pad);
  const bases = Array.from({ length: lines }, (_, i) => capTop + CAP * size + i * lead);
  return { pad, meta, metaBase, capTop, lead, lastBase, h, bases };
};

// -- layout C: the highlight marker (em of the headline size, screen px for the crown step) -------------------------
const HL_PAD_X = 0.26; // the block runs this far past the line's ink at each end
const HL_PAD_Y = 0.2; // and this far above the cap height and below the baseline
const HL_STEP = 8; // px per crown stripe (purple, then orange, above the blue block)
const HL_ABOVE = 0.32; // extra leading above the highlighted line (its pad and crown)
const HL_BELOW = 0.14; // and below it (its pad)
const HL_SHADOW = 3; // the white type's hard shadow on the blue block
/** layout C's slip metrics: the slipMetrics ladder with extra leading around the highlighted line */
const slipMetricsC = (size: number, lines: number, hl: number) => {
  const base = slipMetrics(size, lines);
  const above = Math.round(HL_ABOVE * size);
  const below = Math.round(HL_BELOW * size);
  const bases: number[] = [];
  let b = base.capTop + CAP * size;
  for (let i = 0; i < lines; i++) {
    if (i === hl) b += above;
    bases.push(b);
    if (i === hl) b += below;
    b += base.lead;
  }
  const lastBase = bases[lines - 1];
  return { ...base, bases, lastBase, h: Math.round(lastBase + base.pad) };
};

// -- layout constants (frame px) ----------------------------------------------------------------------------------------
const ZONE_TOP = 84; // the slip's top edge stays at or below this
const ZONE_BOTTOM = 584; // and its bottom edge at or above this (the type ends ~a margin higher)
const SIZE_A = 92;
const SIZE_B = SIZE_A; // the same type in both layouts (and both cards)
const MAX_W_A = 1460; // the slip's widest (CRAFT: an inset keeps clear padding, ~70 % of the frame width)
const MAX_W_B = 1400; // layout B: the slip's widest (the print adds ~250)
// the print (layout B)
const PRINT_BORDER = 16;
const PRINT_FOOT = 40; // the bottom border, with the credit
const PRINT_TUCK = 30; // how far the print's left edge runs under the slip (blank paper: the photo starts after it)
const PRINT_DROP = 4; // the print sits this much lower than the slip's centre
const PRINT_EXTRA = 16; // and this much taller than the slip
// layout C (the whole frame, no caption bands)
const C_MARGIN_X = 100; // the group's widest: the frame less this much paper at each side
const C_MARGIN_Y = 110; // the print's tallest: the frame less this much paper above and below
const SIZE_C = 76;
export const C_PRINT_H = 740; // the default image window height (frame px)
const C_BORDER = 18;
const C_FOOT = 46;
const C_TUCK = 30;
const C_CREDIT = 17;
type PrintFrame = { border: number; foot: number; tuck: number; credit: number };
const FRAME_AB: PrintFrame = { border: PRINT_BORDER, foot: PRINT_FOOT, tuck: PRINT_TUCK, credit: 15 };
const FRAME_C: PrintFrame = { border: C_BORDER, foot: C_FOOT, tuck: C_TUCK, credit: C_CREDIT };

/** everything the card draws, in frame px */
export const cardGeometry = (p: SkyrootNewsCardProps) => {
  const n = p.headline.length;
  const widestEm = Math.max(...p.headline.map((l) => textWidth(l, 1)));
  const metaEm = (textWidth(p.outlet, 1, META_TRACK) + textWidth(p.date, 1, META_TRACK)) * 0.36 + 1.2; // + a gap
  if (p.layout === "C") return cardGeometryC(p, n, widestEm, metaEm);
  const B = p.layout === "B" && !!p.photo;
  const cap = p.size ?? (B ? SIZE_B : SIZE_A);
  const maxW = B ? MAX_W_B : MAX_W_A;
  // width: 2 pads (1.28 em) + the widest of the headline and the meta line
  const fitW = maxW / (1.28 + Math.max(widestEm, metaEm));
  // height: the slip from ZONE_TOP to ZONE_BOTTOM at most
  const hEm = slipMetrics(100, n).h / 100;
  const fitH = (ZONE_BOTTOM - ZONE_TOP) / hEm;
  const size = Math.floor(Math.min(cap, fitW, fitH));
  const m = slipMetrics(size, n);
  const textW = Math.ceil(Math.max(widestEm * size, metaEm * size));
  const slipW = textW + 2 * m.pad;
  const rot = p.rot ?? -1;
  const cy = (ZONE_TOP + ZONE_BOTTOM) / 2;

  if (!B || !p.photo) {
    const slip: Obj = { cx: W / 2, cy, w: slipW, h: m.h, rot };
    return { size, m, textW, slip, print: null, win: null, pf: FRAME_AB };
  }
  const ph = p.photo;
  const crop = ph.crop ?? { x0: 0, y0: 0, x1: 1, y1: 1 };
  const cropAR = ((crop.x1 - crop.x0) * ph.w) / ((crop.y1 - crop.y0) * ph.h); // width / height of the crop
  const imgH = Math.round(m.h + PRINT_EXTRA - PRINT_BORDER - PRINT_FOOT);
  const imgW = Math.round(imgH * cropAR);
  const printW = imgW + 2 * PRINT_BORDER + PRINT_TUCK;
  const printH = imgH + PRINT_BORDER + PRINT_FOOT;
  const groupW = slipW + printW - PRINT_TUCK;
  const left = W / 2 - groupW / 2;
  const slip: Obj = { cx: left + slipW / 2, cy, w: slipW, h: m.h, rot };
  const print: Obj = { cx: left + slipW - PRINT_TUCK + printW / 2, cy: cy + PRINT_DROP, w: printW, h: printH, rot: p.printRot ?? -2.2 * rot };
  // the photo inside the print: iw = the full photo's width in px, (fx, fy) its fraction at the window's top-left
  const iw = imgW / (crop.x1 - crop.x0);
  const win = { x: PRINT_TUCK + PRINT_BORDER, y: PRINT_BORDER, w: imgW, h: imgH, iw, fx: crop.x0, fy: crop.y0 };
  return { size, m, textW, slip, print, win, pf: FRAME_AB };
};

/** layout C: the slip and the print as one group centred on the whole frame, the type as big as the width allows */
const cardGeometryC = (p: SkyrootNewsCardProps, n: number, widestEm: number, metaEm: number) => {
  const hl = p.highlight ?? -1;
  const ph = p.photo;
  const rot = p.rot ?? -1;
  const crop = ph?.crop ?? { x0: 0, y0: 0, x1: 1, y1: 1 };
  const cropAR = ph ? ((crop.x1 - crop.x0) * ph.w) / ((crop.y1 - crop.y0) * ph.h) : 1;
  const imgH = ph ? Math.round(Math.min(ph.printH ?? C_PRINT_H, H - 2 * C_MARGIN_Y - C_BORDER - C_FOOT)) : 0;
  const imgW = Math.round(imgH * cropAR);
  const printW = ph ? imgW + 2 * C_BORDER + C_TUCK : 0;
  const printH = imgH + C_BORDER + C_FOOT;
  const printAdd = ph ? printW - C_TUCK : 0; // what the print adds to the group's width
  const cap = p.size ?? SIZE_C;
  const fitW = (W - 2 * C_MARGIN_X - printAdd) / (1.28 + Math.max(widestEm, metaEm));
  const fitH = (H - 2 * C_MARGIN_Y) / (slipMetricsC(100, n, hl).h / 100);
  const size = Math.floor(Math.min(cap, fitW, fitH));
  const m = slipMetricsC(size, n, hl);
  const textW = Math.ceil(Math.max(widestEm * size, metaEm * size));
  const slipW = textW + 2 * m.pad;
  const left = W / 2 - (slipW + printAdd) / 2;
  const slip: Obj = { cx: left + slipW / 2, cy: H / 2, w: slipW, h: m.h, rot };
  if (!ph) return { size, m, textW, slip, print: null, win: null, pf: FRAME_C };
  const print: Obj = { cx: left + slipW - C_TUCK + printW / 2, cy: H / 2, w: printW, h: printH, rot: p.printRot ?? -rot };
  const iw = imgW / (crop.x1 - crop.x0);
  const win = { x: C_TUCK + C_BORDER, y: C_BORDER, w: imgW, h: imgH, iw, fx: crop.x0, fy: crop.y0 };
  return { size, m, textW, slip, print, win, pf: FRAME_C };
};

const FrameSvg: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
    {children}
  </svg>
);

/** a white object: its hard shadow (+SHADOW_OFF on screen, not turned), the optional thin crown, the white body */
const Body: React.FC<{ o: Obj; chainStep?: number; children?: React.ReactNode }> = ({ o, chainStep, children }) => (
  <>
    <g transform={`translate(${SHADOW_OFF} ${SHADOW_OFF})`}>
      <g transform={turn(o)}>
        <rect x={0} y={0} width={o.w} height={o.h} fill={SHADOW} />
      </g>
    </g>
    <g transform={turn(o)}>
      {chainStep ? (
        <ChainEcho
          frame={0}
          start={-100}
          core="none"
          step={chainStep}
          render={(fill) => <rect x={0} y={0} width={o.w} height={4 * chainStep} fill={fill} />}
        />
      ) : null}
      <rect x={0} y={0} width={o.w} height={o.h} fill={INK} />
      {children}
    </g>
  </>
);

const SkyrootNewsCard: React.FC<SkyrootNewsCardProps> = (props) => {
  const { outlet, date, headline, photo, chain = "thin", chainStep = 5, film = true } = props;
  const g = cardGeometry(props);
  const { size, m, slip, print, win, pf } = g;
  const hl = props.layout === "C" && props.highlight !== undefined && props.highlight >= 0 && props.highlight < headline.length ? props.highlight : -1;
  const lineX = m.pad - size * 0.04;
  // the marker block on line `hl`: the line's ink (the advance less ~0.04 em side bearing at each end) plus its pads
  const hlBox =
    hl >= 0
      ? {
          x: m.pad - HL_PAD_X * size,
          y: m.bases[hl] - CAP * size - HL_PAD_Y * size,
          w: textWidth(headline[hl], size) - 0.08 * size + 2 * HL_PAD_X * size,
          h: (CAP + 2 * HL_PAD_Y) * size,
        }
      : null;
  const right = m.pad + g.textW;

  const slipNode = (
    <FrameSvg>
      <Body o={slip} chainStep={chain === "thin" ? chainStep : undefined}>
        <text x={m.pad - m.meta * 0.04} y={m.metaBase} fill={BLACK} style={type(m.meta, 900, META_TRACK)}>
          {outlet}
        </text>
        {/* the date's last glyph ends where the widest headline line's ink ends: the trailing tracking hangs past the
            glyph (add it back), the headline's side bearings (~0.06 em of the headline) pull its ink in (take them off) */}
        <text x={right + m.meta * META_TRACK - 0.06 * size} y={m.metaBase} textAnchor="end" fill={BLACK} style={type(m.meta, 900, META_TRACK)}>
          {date}
        </text>
        {hlBox ? (
          <>
            {/* the chain crown above the marker: orange (back) two steps up, purple one, the blue block itself */}
            <rect x={hlBox.x} y={hlBox.y - 2 * HL_STEP} width={hlBox.w} height={hlBox.h} fill={ORANGE} />
            <rect x={hlBox.x} y={hlBox.y - HL_STEP} width={hlBox.w} height={hlBox.h} fill={PURPLE} />
            <rect x={hlBox.x} y={hlBox.y} width={hlBox.w} height={hlBox.h} fill={BLUE} />
            <text x={lineX + HL_SHADOW} y={m.bases[hl] + HL_SHADOW} fill={SHADOW} style={type(size, 900)}>
              {headline[hl]}
            </text>
          </>
        ) : null}
        {headline.map((line, i) => (
          <text key={i} x={lineX} y={m.bases[i]} fill={i === hl ? INK : BLACK} style={type(size, 900)}>
            {line}
          </text>
        ))}
      </Body>
    </FrameSvg>
  );

  const printNode =
    print && win && photo ? (
      <>
        <FrameSvg>
          <Body o={print}>
            {photo.credit ? (
              <text
                x={print.w - pf.border + pf.credit * 0.1}
                y={pf.border + win.h + pf.foot / 2 + (CAP * pf.credit) / 2}
                textAnchor="end"
                fill={BLACK}
                style={type(pf.credit, 900, 0.1)}
              >
                {photo.credit}
              </text>
            ) : null}
          </Body>
        </FrameSvg>
        <div style={turnCss(print)}>
          <div style={{ position: "absolute", left: win.x, top: win.y, width: win.w, height: win.h, overflow: "hidden" }}>
            <Img
              src={staticFile(photo.src)}
              style={{
                position: "absolute",
                left: -win.fx * win.iw,
                top: -win.fy * win.iw * (photo.h / photo.w),
                width: win.iw,
                height: win.iw * (photo.h / photo.w),
                maxWidth: "none",
                filter: photo.look === "grade" ? SKYROOT_FILTER : undefined,
              }}
            />
          </div>
        </div>
      </>
    ) : null;

  const scene = (
    <AbsoluteFill style={{ backgroundColor: PAPER_BASE }}>
      <SkyrootPaper frame={0} cam={{ x: W / 2, y: H / 2, k: 1 }} />
      {printNode}
      {slipNode}
    </AbsoluteFill>
  );
  return film ? <SkyrootFilmLife frame={0}>{scene}</SkyrootFilmLife> : scene;
};

export default SkyrootNewsCard;

/** framing numbers for a hand-off check (frame px): every readable thing must end above READ_LIMIT */
export const cardFraming = (p: SkyrootNewsCardProps) => {
  const g = cardGeometry(p);
  const lastLine = boxOf(g.slip, g.m.pad, g.m.capTop, g.m.pad + g.textW, g.m.lastBase);
  const slipBox = boxOf(g.slip);
  const boxes = g.print ? [slipBox, boxOf(g.print)] : [slipBox];
  const gx0 = Math.min(...boxes.map((q) => q.x0));
  const gx1 = Math.max(...boxes.map((q) => q.x1));
  const gy0 = Math.min(...boxes.map((q) => q.y0));
  const gy1 = Math.max(...boxes.map((q) => q.y1));
  const groupBox = { x0: gx0, x1: gx1, y0: gy0, y1: gy1, cx: (gx0 + gx1) / 2, cy: (gy0 + gy1) / 2 };
  // the credit's ink (15 px caps centred in the foot), not the print's edge
  const creditY =
    g.print && g.win && p.photo?.credit
      ? boxOf(g.print, g.print.w / 2, g.win.y + g.win.h + g.pf.foot / 2 - (CAP * g.pf.credit) / 2, g.print.w - g.pf.border, g.win.y + g.win.h + g.pf.foot / 2 + (CAP * g.pf.credit) / 2).y1
      : null;
  return {
    size: g.size,
    meta: g.m.meta,
    slip: { ...g.slip, box: slipBox },
    typeBottom: lastLine.y1,
    print: g.print ? { ...g.print, box: boxOf(g.print), creditBottom: creditY } : null,
    // A, B: the type above the caption bands; C (no bands at 16:9): the group centred on the frame, on the paper
    ok:
      p.layout === "C"
        ? Math.abs(groupBox.cx - W / 2) < 2 && Math.abs(groupBox.cy - H / 2) < 2 && groupBox.x0 > 60 && groupBox.y0 > 60
        : lastLine.y1 < READ_LIMIT && (creditY === null || creditY < READ_LIMIT),
    group: groupBox,
  };
};
