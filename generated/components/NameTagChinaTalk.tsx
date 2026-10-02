import React, { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { loadFont as loadSourceSans3 } from "@remotion/google-fonts/SourceSans3";
import { loadFont as loadSourceSerif4 } from "@remotion/google-fonts/SourceSerif4";
import {
  AbsoluteFill,
  Easing,
  Img,
  cancelRender,
  continueRender,
  delayRender,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { z } from "zod";
import { CHINA_INK, CHINA_PAPER, CHINA_RED, CHINA_RED_DEEP, CHINA_RED_WET, paperShadow } from "./chinaGrowthTheme";
import { BG_OVERSIZE, FRAME_H, FRAME_W, squirclePath } from "./fieldShared";

/**
 * NameTagChinaTalk — Logan Wright's name tag for the ChinaTalk clip ("China's
 * growth is going negative"), built as FIVE options (the `variant` prop). THE
 * CLIENT PICKED sealStrips, with "only put that hes an author": the defaults are
 * sealStrips, "Logan Wright" over "AUTHOR OF BROKEN CHINA" (`job` + the italic
 * `jobItalic`), and sealStrips is the only variant that animates (the house
 * name-tag entrance, see SealStrips). The other four are the static stills of
 * the options round, kept unchanged.
 *
 * Transparent 1080x1920 overlay, 24 fps, 96 f. The house name-tag layout
 * (NameTag / NameTagCheekyPint): bottom-left at left 84 / bottom 300, a panel
 * that hugs the text, name over job, an in-flow sizing copy of each line under
 * the visible one. Proper capitalisation (the job is set in caps by CSS, the
 * ChinaTalk word style).
 *
 * ChinaTalk material (chinaGrowthTheme): rice paper CHINA_PAPER #F8F5EF with
 * the baked grain (public/china/paper.png, drawn at the Stage's scale), warm
 * ink CHINA_INK #1C1917 at the 0.90 rung, vermilion CHINA_RED #D0281C, its deep
 * CHINA_RED_DEEP #8E1A12, the warm paper shadow paperShadow(1). Name: Source
 * Serif 4 Bold 88, lining figures. Job: Source Sans 3 SemiBold caps 36, tracked
 * 0.12 em with the compensating margin (caps at 36 read like the 40 px
 * mixed-case job of the other house tags, and keep the job line narrower than
 * the name). Corners: the house squircle at each panel's measured size
 * (fieldShared.squirclePath: 1.2 % of the short side, floor 2 px), never a
 * hand-set radius. Margins are optical (to the capitals and baselines): 44 px
 * top and bottom, 42 px at the sides.
 *
 * CONTRAST (the client found an earlier tag "a lil hard to read"): the name is
 * kept >= 10:1 and the job >= 7:1 against whatever sits directly behind them
 * (measured on the renders; worst case quoted).
 * CHINA_RED cannot carry type at those ratios: its luminance (0.150) caps ANY
 * text colour at 5.25:1 (pure white); paper on it is 4.82:1. So every red
 * surface that carries type is deeper than CHINA_RED (see sealStrips and
 * vermilionBar); CHINA_RED stays on the marks (the seal, the ink line, the rule).
 * The job is ink at the 0.90 rung, never 0.42 (2.62:1 on paper).
 *
 *   paperCard     one rice-paper card, the paper shadow; a vermilion seal square
 *                 at the card's left, centred 3 px under the centre of the
 *                 name's capitals; name and job in ink 0.90 (12.2:1 on the paper,
 *                 11.2:1 on the darkest 0.1 % of its grain)
 *   sealStrips    THE PICK. The Cheeky Pint layout in ChinaTalk material: the
 *                 name on a paper strip (ink, 11.2:1), the job on a narrower
 *                 strip in CHINA_RED_DEEP with paper caps, like the white
 *                 characters of a seal impression (8.37:1; on CHINA_RED 4.82:1).
 *                 The job line "AUTHOR OF BROKEN CHINA": the title in Source
 *                 Sans 3 SemiBold Italic, same caps and tracking; the red strip
 *                 576 px under the 654 px paper strip. Animated: strips slide up
 *                 64 px + fade (f0-20, f7-27), lines slide up 24 px + fade + blur
 *                 6 -> 0 (f3-18, f12-27), hold f27-95
 *   inkCard       paperCard's dark twin (replaced the panel-less inkUnderline,
 *                 whose wash read as a smudge over the beard): one solid
 *                 CHINA_INK card, paperCard's margins, squircle and paper shadow;
 *                 the name in paper (16.1:1), directly under it the chart's
 *                 vermilion wet-ink line with its bead, the name's width (10 px
 *                 under the g's, 18 over the job), the job in paper at 0.85 (11.8:1)
 *   vermilionBar  the house bar in solid red: paper name, a paper hairline from
 *                 the L's stem to the t, the job in paper at 0.85. The red is
 *                 LACQUER = CHINA_RED_DEEP inked 25 % (#721A13), so paper type
 *                 clears 10:1 with margin (10.31:1; the job 7.81:1)
 *   bookCard      paperCard plus a third line, "Author of <book>", the title in
 *                 Source Serif 4 italic, under a short vermilion rule on the
 *                 stems (11.0:1)
 */

export const FPS = 24;
export const DURATION = 96;

export const VARIANTS = ["paperCard", "sealStrips", "inkCard", "vermilionBar", "bookCard"] as const;
export type Variant = (typeof VARIANTS)[number];

export const schema = z.object({
  name: z.string(),
  job: z.string(),
  /** an italic span set after `job` on the job line (a book title), same caps and tracking */
  jobItalic: z.string().optional(),
  /** the book's title; bookCard sets it as "Author of <book>", the title in italic */
  book: z.string().optional(),
  variant: z.enum(VARIANTS),
});
export type NameTagChinaTalkProps = z.infer<typeof schema>;
// The client's pick: sealStrips, "only put that hes an author".
export const defaultProps: NameTagChinaTalkProps = schema.parse({
  name: "Logan Wright",
  job: "Author of",
  jobItalic: "Broken China",
  book: "Broken China",
  variant: "sealStrips",
});

// ---- type ----
const SERIF = loadSourceSerif4("normal", { weights: ["600", "700"], subsets: ["latin"] });
const SERIF_ITALIC = loadSourceSerif4("italic", { weights: ["600"], subsets: ["latin"] });
const SANS = loadSourceSans3("normal", { weights: ["600"], subsets: ["latin"] });
const SANS_ITALIC = loadSourceSans3("italic", { weights: ["600"], subsets: ["latin"] });
const NAME_PX = 88;
const JOB_PX = 36;
const BOOK_PX = 34;
const LINE_HEIGHT = 1.08;
const TRACK_EM = 0.12;
// Every face the tag sets; panels are measured only once all of them load.
const FONT_FACES = [
  { family: SERIF.fontFamily, style: "normal", weight: 700, px: NAME_PX },
  { family: SERIF.fontFamily, style: "normal", weight: 600, px: BOOK_PX },
  { family: SERIF_ITALIC.fontFamily, style: "italic", weight: 600, px: BOOK_PX },
  { family: SANS.fontFamily, style: "normal", weight: 600, px: JOB_PX },
  { family: SANS_ITALIC.fontFamily, style: "italic", weight: 600, px: JOB_PX },
];
const weightCovers = (w: string, want: number) => {
  const [lo, hi = lo] = w.split(" ").map(Number);
  return lo <= want && want <= hi;
};
let fontsLoaded: Promise<void> | null = null;
/** Resolves once every face above has loaded. Rejects (failing the render) if
 *  one is missing, instead of letting Chrome fake an italic or a weight. */
const fontsReady = () => {
  fontsLoaded ??= document.fonts.ready
    .then(() =>
      Promise.all(
        FONT_FACES.map(async (f) => {
          const faces = await document.fonts.load(`${f.style} ${f.weight} ${f.px}px "${f.family}"`);
          if (!faces.some((face) => face.style === f.style && weightCovers(face.weight, f.weight))) {
            throw new Error(`NameTagChinaTalk: ${f.family} ${f.style} ${f.weight} did not load`);
          }
        }),
      ),
    )
    .then(() => undefined);
  return fontsLoaded;
};

const nameStyle: React.CSSProperties = {
  fontFamily: SERIF.fontFamily,
  fontWeight: 700,
  fontSize: NAME_PX,
  lineHeight: LINE_HEIGHT,
  letterSpacing: 0,
  fontVariantNumeric: "lining-nums",
  whiteSpace: "nowrap",
};
const jobStyle: React.CSSProperties = {
  fontFamily: SANS.fontFamily,
  fontWeight: 600,
  fontSize: JOB_PX,
  lineHeight: LINE_HEIGHT,
  letterSpacing: `${TRACK_EM}em`,
  marginRight: `${-TRACK_EM}em`, // the last letter's tracking is not part of the line
  textTransform: "uppercase",
  whiteSpace: "nowrap",
};
const bookStyle: React.CSSProperties = {
  fontFamily: SERIF.fontFamily,
  fontWeight: 600,
  fontSize: BOOK_PX,
  lineHeight: LINE_HEIGHT,
  letterSpacing: 0,
  whiteSpace: "nowrap",
};
const titleStyle: React.CSSProperties = { fontFamily: SERIF_ITALIC.fontFamily, fontStyle: "italic", fontWeight: 600 };
// The job line's italic span (a book title): Source Sans 3 SemiBold Italic, the
// same caps and tracking as the upright words before it.
const jobItalicStyle: React.CSSProperties = { fontFamily: SANS_ITALIC.fontFamily, fontStyle: "italic", fontWeight: 600 };
const jobText = (job: string, jobItalic?: string): React.ReactNode =>
  jobItalic ? (
    <>
      {job ? `${job} ` : null}
      <span style={jobItalicStyle}>{jobItalic}</span>
    </>
  ) : (
    job
  );

// ---- layout (the house name tag) ----
const LEFT = 84;
const BOTTOM = 300;
// Where the ink sits inside each line box (px from its top), measured on the
// renders: paddings are set from these so the margins are OPTICAL (to the
// capitals and the baselines), not to the line boxes.
const NAME_BOX = NAME_PX * LINE_HEIGHT; // 95.04
const NAME_CAP_TOP = 19; // cap height 59; ascenders reach 7 above, descenders 20 below the baseline
const NAME_BASE = 78;
const JOB_BOX = JOB_PX * LINE_HEIGHT; // 38.88
const JOB_CAP_TOP = 6; // cap height 24; the comma reaches 6 below the baseline
const JOB_BASE = 30;
const BOOK_BOX = BOOK_PX * LINE_HEIGHT; // 36.72
const BOOK_BASE = 29.5;
const STEM = 3; // the L of the name and the P of the job both sit 3 px inside their boxes
const END_BEARING = 1; // the last letter's ink ends ~1 px inside its box (t, P)
const M_V = 44; // optical margin above the capitals / below the last baseline
const M_H = 42; // optical margin at the sides

// ---- ChinaTalk colours ----
const rgba = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};
const mixHex = (a: string, b: string, t: number) => {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (sh: number) => Math.round(((pa >> sh) & 255) + (((pb >> sh) & 255) - ((pa >> sh) & 255)) * t);
  return `#${[ch(16), ch(8), ch(0)].map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
};
const INK_HI = rgba(CHINA_INK, 0.9);
const PAPER_JOB = rgba(CHINA_PAPER, 0.85);
/** CHINA_RED_DEEP inked 25 % (#721A13): paper type on it measures 10.35:1. */
const LACQUER = mixHex(CHINA_RED_DEEP, CHINA_INK, 0.25);
const PAPER_SHADOW = paperShadow(1);

// ---- measuring (the squircle needs the panel's size) ----
type Size = { w: number; h: number };
/** The element's layout size (offsetWidth/Height: transforms, such as Studio's
 *  preview scale or a later entrance, do not change it), taken once the tag's
 *  fonts have loaded. Holds the render until then. */
const useMeasure = <T extends HTMLElement>() => {
  const ref = useRef<T>(null);
  const [size, setSize] = useState<Size | null>(null);
  const [handle] = useState(() => delayRender("NameTagChinaTalk: measure after the fonts load"));
  const done = useRef(false);
  const release = React.useCallback(() => {
    if (done.current) return;
    done.current = true;
    continueRender(handle);
  }, [handle]);
  useLayoutEffect(() => {
    let live = true;
    fontsReady()
      .then(() => {
        if (!live || !ref.current) return;
        setSize({ w: ref.current.offsetWidth, h: ref.current.offsetHeight });
      })
      .catch((err) => cancelRender(err));
    return () => {
      live = false;
      release();
    };
  }, [release]);
  // released after the measured layout has committed, so the capture sees it
  useEffect(() => {
    if (size) release();
  }, [size, release]);
  return [ref, size] as const;
};

// ---- grounds ----
/** Rice paper exactly as the chart's Stage draws it (the grain at 1.8x the
 *  frame, cover), clipped to the panel's squircle. The clip is in bounding-box
 *  units, so it lands on the panel's exact (fractional) edges. */
const PaperGround: React.FC<{ size: Size | null }> = ({ size }) => {
  const id = `ntct-clip-${useId().replace(/[^A-Za-z0-9_-]/g, "_")}`;
  return (
    <>
      {size ? (
        <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
          <defs>
            <clipPath id={id} clipPathUnits="objectBoundingBox">
              <path d={squirclePath(size.w, size.h)} transform={`scale(${1 / size.w} ${1 / size.h})`} />
            </clipPath>
          </defs>
        </svg>
      ) : null}
      <div
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          backgroundColor: CHINA_PAPER,
          clipPath: size ? `url(#${id})` : undefined,
        }}
      >
        <Img
          src={staticFile("china/paper.png")}
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: FRAME_W * BG_OVERSIZE,
            height: FRAME_H * BG_OVERSIZE,
            objectFit: "cover",
            transform: "translate(-50%, -50%)",
          }}
        />
      </div>
    </>
  );
};

const SolidGround: React.FC<{ size: Size; fill: string }> = ({ size, fill }) => (
  <svg
    viewBox={`0 0 ${size.w} ${size.h}`}
    preserveAspectRatio="none"
    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}
  >
    <path d={squirclePath(size.w, size.h)} fill={fill} />
  </svg>
);

// ---- the entrance (the house name tag's, as approved on Cheeky Pint's strips,
// plus the ChinaTalk text blur-in) ----
// A strip slides up 64 px and fades in over 20 f, its shadow with it (the
// shadow is a filter on the same layer); a line slides up 24 px, fades in and
// blurs in 6 -> 0 px over 15 f. One ease everywhere, clamped. At t = 1 no
// entrance style is left on anything, so the hold is the static tag exactly.
const EASE = Easing.bezier(0.16, 1, 0.3, 1);
const progress = (frame: number, start: number, travel: number) =>
  interpolate(frame, [start, start + travel], [0, 1], { easing: EASE, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const STRIP_TRAVEL = 20;
const STRIP_RISE = 64;
const TEXT_TRAVEL = 15;
const TEXT_RISE = 24;
const TEXT_BLUR = 6;
const stripEnter = (t?: number): React.CSSProperties | undefined =>
  t === undefined || t >= 1 ? undefined : { opacity: t, transform: `translateY(${((1 - t) * STRIP_RISE).toFixed(3)}px)` };
const textEnter = (t?: number): React.CSSProperties | undefined =>
  t === undefined || t >= 1
    ? undefined
    : {
        opacity: t,
        transform: `translateY(${((1 - t) * TEXT_RISE).toFixed(3)}px)`,
        filter: `blur(${(TEXT_BLUR * (1 - t)).toFixed(3)}px)`,
      };

/** A panel that hugs its content; its ground is a squircle of its own measured
 *  size under the warm paper shadow. `ground` is "paper" or a solid colour.
 *  `t` (optional): the strip entrance; the ground and its shadow move as one,
 *  the content keeps its place (its lines carry their own entrance). */
const Panel: React.FC<{ ground: string; padding: string; t?: number; children: React.ReactNode }> = ({
  ground,
  padding,
  t,
  children,
}) => {
  const [ref, size] = useMeasure<HTMLDivElement>();
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div style={{ position: "absolute", inset: 0, filter: PAPER_SHADOW, ...stripEnter(t) }}>
        {ground === "paper" ? <PaperGround size={size} /> : size ? <SolidGround size={size} fill={ground} /> : null}
      </div>
      <div style={{ position: "relative", padding }}>{children}</div>
    </div>
  );
};

// ---- lines ----
// A line with its in-flow sizing copy (the house pattern): the hidden copy
// sizes the box, the visible copy paints on top of it and carries the entrance
// (`t`, optional).
const Line: React.FC<{ base: React.CSSProperties; color: string; shadow?: string; t?: number; children: React.ReactNode }> = ({
  base,
  color,
  shadow,
  t,
  children,
}) => (
  <div style={{ position: "relative" }}>
    <div style={{ ...base, visibility: "hidden" }}>{children}</div>
    <div style={{ ...base, position: "absolute", left: 0, top: 0, color, textShadow: shadow, ...textEnter(t) }}>{children}</div>
  </div>
);

// ---- the seal (a chop stamped on the card: flat, as printed) ----
const SEAL = 28;
const Seal: React.FC = () => (
  <svg width={SEAL} height={SEAL} viewBox={`0 0 ${SEAL} ${SEAL}`} style={{ display: "block", flex: "none" }}>
    <path d={squirclePath(SEAL, SEAL)} fill={CHINA_RED} />
  </svg>
);

// ---- 1 paperCard / 5 bookCard ----
const SEAL_GAP = 22; // 25 px of paper between the seal and the L's stem
// The seal's centre sits 3 px under the capitals' centre: between the cap band
// and the x-height band, where a mixed-case name's weight is.
const SEAL_TOP = NAME_CAP_TOP + 59 / 2 + 3 - SEAL / 2;
const NAME_JOB_GAP = 10; // name baseline -> job capitals 33 px; the g's clear the caps by 13
const RULE_W = 44;
const RULE_H = 3;
const RULE_ABOVE = 18;
const RULE_BELOW = 14;

const PaperCard: React.FC<{ name: string; job: React.ReactNode; book?: string }> = ({ name, job, book }) => {
  const foot = book ? BOOK_BOX - BOOK_BASE : JOB_BOX - JOB_BASE;
  const pad = `${M_V - NAME_CAP_TOP}px ${M_H - END_BEARING}px ${(M_V - foot).toFixed(2)}px ${M_H}px`;
  return (
    <Panel ground="paper" padding={pad}>
      <div style={{ display: "flex", alignItems: "flex-start" }}>
        <div style={{ marginTop: SEAL_TOP, marginRight: SEAL_GAP }}>
          <Seal />
        </div>
        <div>
          <Line base={nameStyle} color={INK_HI}>
            {name}
          </Line>
          <div style={{ height: NAME_JOB_GAP }} />
          <Line base={jobStyle} color={INK_HI}>
            {job}
          </Line>
          {book ? (
            <>
              <div style={{ height: RULE_ABOVE }} />
              <div style={{ width: RULE_W, height: RULE_H, marginLeft: STEM, background: CHINA_RED }} />
              <div style={{ height: RULE_BELOW }} />
              <Line base={bookStyle} color={INK_HI}>
                Author of <span style={titleStyle}>{book}</span>
              </Line>
            </>
          ) : null}
        </div>
      </div>
    </Panel>
  );
};

// ---- 2 sealStrips ----
// Both strips start at the same x and so do both lines (36 px to the stems);
// the job strip is narrower by the width the job line is shorter. Name strip:
// 30 px over the capitals, 32 under the baseline (the g's keep 12 of it). Job
// strip: 15 over the capitals and 15 under the baseline.
const STRIP_GAP = 10;
const STRIP_SIDE = 36;
const NAME_STRIP_PAD = `${30 - NAME_CAP_TOP}px ${STRIP_SIDE - END_BEARING}px ${(32 - (NAME_BOX - NAME_BASE)).toFixed(2)}px ${STRIP_SIDE - STEM}px`;
const JOB_STRIP_PAD = `${15 - JOB_CAP_TOP}px ${STRIP_SIDE - END_BEARING}px ${(15 - (JOB_BOX - JOB_BASE)).toFixed(2)}px ${STRIP_SIDE - STEM}px`;

// The entrance (24 fps), the only variant that animates:
//   paper strip  f0-20   slide up 64 px + fade in, its shadow with it
//   name         f3-18   slide up 24 px + fade in + blur 6 -> 0 px
//   red strip    f7-27   slide up 64 px + fade in (follows, never leads)
//   job          f12-27  slide up 24 px + fade in + blur 6 -> 0 px
//   f27-95       static hold, no outro, no idle motion
const NAME_STRIP_START = 0;
const NAME_START = 3;
const JOB_STRIP_START = 7;
const JOB_START = 12;

const SealStrips: React.FC<{ name: string; job: React.ReactNode }> = ({ name, job }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: STRIP_GAP }}>
      <Panel ground="paper" padding={NAME_STRIP_PAD} t={progress(frame, NAME_STRIP_START, STRIP_TRAVEL)}>
        <Line base={nameStyle} color={INK_HI} t={progress(frame, NAME_START, TEXT_TRAVEL)}>
          {name}
        </Line>
      </Panel>
      <Panel ground={CHINA_RED_DEEP} padding={JOB_STRIP_PAD} t={progress(frame, JOB_STRIP_START, STRIP_TRAVEL)}>
        <Line base={jobStyle} color={CHINA_PAPER} t={progress(frame, JOB_START, TEXT_TRAVEL)}>
          {job}
        </Line>
      </Panel>
    </div>
  );
};

// ---- the vermilion ink line (3 inkCard) ----
// The chart's line at name-tag scale: DATA_W : DOT_R = 9 : 11.5, the wet
// stretch (the last 70 px, RED -> RED_WET and 15 % thicker toward the tip), the
// bead (bloom 2.6x at 0.22, a paper specular up-left), the paper shadow.
const INK_W = 6;
const BEAD_R = INK_W * (11.5 / 9);
const WET_LEN = 70;
const WET_STEP = 5;
// The line's row sits under the name's box: the line keeps 10 px under the g's
// and 18 px over the job's capitals. It runs from the L's stem to the t, the
// bead's edge on the t's edge.
const UNDERLINE_Y = Math.round(NAME_BASE + 20 + 10 + INK_W / 2 - NAME_BOX); // 16: the line's centre in its row
const UNDERLINE_BOX = UNDERLINE_Y + INK_W / 2 + 18 - JOB_CAP_TOP; // 31: the row's height
const smoothstep = (u: number) => {
  const x = Math.min(1, Math.max(0, u));
  return x * x * (3 - 2 * x);
};

const InkLine: React.FC<{ width: number }> = ({ width }) => {
  const y = UNDERLINE_Y;
  const x0 = STEM - 0.5 + INK_W / 2;
  const tip = width - END_BEARING - BEAD_R;
  const segs: React.ReactNode[] = [];
  for (let s0 = Math.max(x0, tip - WET_LEN); s0 < tip - 0.01; s0 += WET_STEP) {
    const s1 = Math.min(tip, s0 + WET_STEP);
    const wet = 1 - smoothstep((tip - (s0 + s1) / 2) / WET_LEN);
    segs.push(
      <line
        key={s0.toFixed(1)}
        x1={s0}
        y1={y}
        x2={s1}
        y2={y}
        stroke={mixHex(CHINA_RED, CHINA_RED_WET, wet)}
        strokeWidth={INK_W * (1 + 0.15 * wet)}
        strokeLinecap="round"
      />,
    );
  }
  return (
    <svg width={width} height={UNDERLINE_BOX} style={{ display: "block", overflow: "visible" }}>
      <defs>
        <radialGradient id="ntct-bead-bloom">
          <stop offset={0} stopColor={CHINA_RED} stopOpacity={0.22} />
          <stop offset={0.45} stopColor={CHINA_RED} stopOpacity={0.11} />
          <stop offset={1} stopColor={CHINA_RED} stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx={tip} cy={y} r={2.6 * BEAD_R} fill="url(#ntct-bead-bloom)" />
      <g style={{ filter: PAPER_SHADOW }}>
        <line x1={x0} y1={y} x2={tip} y2={y} stroke={CHINA_RED} strokeWidth={INK_W} strokeLinecap="round" />
        {segs}
        <circle cx={tip} cy={y} r={BEAD_R} fill={CHINA_RED} />
        <circle cx={tip - 0.36 * BEAD_R} cy={y - 0.36 * BEAD_R} r={0.28 * BEAD_R} fill={CHINA_PAPER} opacity={0.5} />
      </g>
    </svg>
  );
};

// ---- 3 inkCard ----
// paperCard's dark twin: one solid CHINA_INK card with paperCard's optical
// margins (44 over the capitals and under the last baseline, 42 at the sides;
// the L's stem stands where the seal stands on paperCard), the same squircle
// and paper shadow. Paper type, flat as printed; the vermilion line with its
// bead directly under the name, the name's width.
const INK_CARD_PAD = `${M_V - NAME_CAP_TOP}px ${M_H - END_BEARING}px ${(M_V - (JOB_BOX - JOB_BASE)).toFixed(2)}px ${M_H - STEM}px`;

const InkCard: React.FC<{ name: string; job: React.ReactNode }> = ({ name, job }) => {
  const [nameRef, nameSize] = useMeasure<HTMLDivElement>();
  return (
    <Panel ground={CHINA_INK} padding={INK_CARD_PAD}>
      <div ref={nameRef} style={{ width: "fit-content" }}>
        <Line base={nameStyle} color={CHINA_PAPER}>
          {name}
        </Line>
      </div>
      <div style={{ height: UNDERLINE_BOX }}>{nameSize ? <InkLine width={nameSize.w} /> : null}</div>
      <Line base={jobStyle} color={PAPER_JOB}>
        {job}
      </Line>
    </Panel>
  );
};

// ---- 4 vermilionBar ----
const BAR_PAD = `${M_V - NAME_CAP_TOP}px ${M_H - END_BEARING}px ${(M_V - (JOB_BOX - JOB_BASE)).toFixed(2)}px ${M_H - STEM}px`;
// The hairline keeps 12 px under the g's and 16 px over the job's capitals.
const HAIRLINE = 2;
const HAIRLINE_ABOVE = Math.round(NAME_BASE + 20 + 12 - NAME_BOX); // 15
const HAIRLINE_BELOW = 16 - JOB_CAP_TOP; // 10

const VermilionBar: React.FC<{ name: string; job: React.ReactNode }> = ({ name, job }) => (
  <Panel ground={LACQUER} padding={BAR_PAD}>
    <Line base={nameStyle} color={CHINA_PAPER}>
      {name}
    </Line>
    <div style={{ height: HAIRLINE_ABOVE }} />
    <div style={{ height: HAIRLINE, margin: `0 ${END_BEARING}px 0 ${STEM}px`, background: CHINA_PAPER, opacity: 0.45 }} />
    <div style={{ height: HAIRLINE_BELOW }} />
    <Line base={jobStyle} color={PAPER_JOB}>
      {job}
    </Line>
  </Panel>
);

const NameTagChinaTalk: React.FC<NameTagChinaTalkProps> = ({ name, job, jobItalic, book, variant }) => {
  const jobLine = jobText(job, jobItalic);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: LEFT, bottom: BOTTOM, display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
        {variant === "paperCard" ? <PaperCard name={name} job={jobLine} /> : null}
        {variant === "sealStrips" ? <SealStrips name={name} job={jobLine} /> : null}
        {variant === "inkCard" ? <InkCard name={name} job={jobLine} /> : null}
        {variant === "vermilionBar" ? <VermilionBar name={name} job={jobLine} /> : null}
        {variant === "bookCard" ? <PaperCard name={name} job={jobLine} book={book} /> : null}
      </div>
    </AbsoluteFill>
  );
};

export default NameTagChinaTalk;
