import React from "react";
import { AbsoluteFill, Easing, Img, staticFile, useCurrentFrame } from "remotion";
import { loadFont as loadSourceSans3 } from "@remotion/google-fonts/SourceSans3";
import { loadFont as loadSourceSerif4 } from "@remotion/google-fonts/SourceSerif4";
import { z } from "zod";
import { DURATION as PAN_DURATION, whipSigma, windowX } from "./HuCrowdPan";

const SERIF = loadSourceSerif4("normal", { weights: ["700", "900"], subsets: ["latin"] }).fontFamily;
const SANS = loadSourceSans3("normal", { weights: ["600"], subsets: ["latin"] }).fontFamily;

/**
 * HuLiveToPrint — the real footage of Hu Jintao freezes, is "printed" into
 * newsprint from the top down, and the camera whips off it onto the crowd.
 * ONE OPAQUE baked clip, 1080x1920, 24 fps, 94 frames.
 *
 * Check line: "The footage of Hu Jintao turns into a printed picture, and the
 * camera leaves it for a crowd that never ends."
 *
 * Line: "Hu Jintao goes, making 25 million new jobs every year."
 *   Hu f1 · Jintao f2 · goes f11-18 · making f23 · 25 f27 · million f40 · new f53 ·
 *   jobs f61 · every f71 · year f80-86 · cut f94
 *
 * Pictures: jordanhu/hu_live/f01..f13.jpg are 13 frames of the video as the
 * editor frames it (f13 is the freeze). jordanhu/hu_print_pano.jpg (4369x1920,
 * drawn at NATIVE size) is the newsprint world; its window x 740..1820 is
 * hu_live/f13.jpg pixel for pixel, the same man halftoned from that very frame.
 *
 *   f0-11   the live video, frame f shows f(f+1).jpg, untouched
 *   f12     f13.jpg, untouched: the last moving frame is the freeze
 *   f13-23  the print pass: ONE soft front runs top to bottom over the frozen
 *           frame (ease-out: 350 px on the first frame, 46 on the last). Above
 *           it the print, below it the footage; in the 140 px just ahead of it
 *           the footage loses its colour and gains contrast, so the picture
 *           develops as the front arrives. The front is a 76 px feather with a
 *           slow +-12 px wobble along its length
 *   f24     the first frame that is all print
 *   f20-93  the pan: HuCrowdPan's own curve and blur rule, 74 frames, window x
 *           740 -> 3259 (2519 px; the picture ends at 4369, the window on 4339).
 *           It drifts 2.1 px/frame from f20, whips at about 172 px/frame on
 *           f37-38 ("million"), is sharp again from f66 and still slides
 *           2.4 px/frame at the cut
 *
 *   headline  what is printed in the white band above the crowd (prop headline).
 *           It is part of the picture: same plane, same whip blur, never moving
 *           on its own. Source Serif 4 Black, flat ink.
 *           "band" (default): ONE line, 25 MILLION, 364 px (cap height 238),
 *             ink from picture x 2213 to 4299, baseline y 590. The camera whips
 *             along it (first pixels on f34, "25" passes on f36-41 in the blur)
 *             and ends on its tail: LLION whole on f66, the first L cut through
 *             its stem by the left frame edge at the cut.
 *           "lockup": 25 (448 px) over MILLION (177 px, 778 wide), centred on
 *             the END window at picture x endX + 540, ink y 288..722; whole in
 *             frame from f60, 63 px to the right edge on f66, centred at the cut.
 *           "counter": the earlier 25M -> 50M -> 75M -> 100M figure (Bold 316 px,
 *             swaps on f62 / f70 / f78 with a small punch and shake) and its
 *             optional NEW JOBS · YEAR n caption (showCaption).
 *
 * The frozen footage and the front live INSIDE the panned plane, at the
 * print's own x 740, so while the drift starts under the end of the print pass
 * (f20-23) footage, front and print move as one sheet.
 */

export const FPS = 24;
export const DURATION = 94;

const FRAME_W = 1080;
const FRAME_H = 1920;
const PANO = "jordanhu/hu_print_pano.jpg";
const PANO_W = 4369;
const PRINT_X = 740; // where the frozen frame sits in the print: the pan's start
const PAPER = "#FCF4EA"; // the print's own paper; never seen, the plane always covers the frame

export const schema = z.object({
  endX: z
    .number()
    .min(PRINT_X)
    .max(PANO_W - FRAME_W)
    .default(3259),
  // what is printed in the paper above the crowd: one line across the whole band, a
  // two-line block in the end frame, or the earlier 25M -> 100M counter
  headline: z.enum(["band", "lockup", "counter"]).default("band"),
  showCaption: z.boolean().default(true), // the counter's NEW JOBS / YEAR line
});
export type HuLiveToPrintProps = z.infer<typeof schema>;
export const defaultProps = schema.parse({});

// ---- timeline ----
const LIVE_FRAMES = 13;
const FREEZE = LIVE_FRAMES - 1; // f12 shows f13.jpg and nothing else changes yet
const PRINT_DONE = 24; // the first frame that is all print
const PAN_START = DURATION - PAN_DURATION; // f20: the 74-frame pan ends on the last frame

// ---- the print front (picture px, y down) ----
const FEATHER = 76; // the soft band, 5 % to 95 %
const FEATHER_SIGMA = FEATHER / 3.29; // a Gaussian edge with that band
const WOBBLE = 12; // +- px along the front's length
const ZONE = 140; // ahead of the front the footage develops: grey and hard
// "Developed" is grayscale + contrast, with the grey ramp running from the print's ink to
// its paper instead of from pure black to white: a plain CSS contrast() crushes the suit
// below the print's ink and a black bar rides ahead of the front.
const DEVELOP_CONTRAST = 1.5;
const INK = [29, 25, 22]; // the print's black, sampled on the suit
const PAPER_RGB = [251, 244, 234]; // the print's paper
const LUMA = [0.2126, 0.7152, 0.0722]; // what CSS grayscale() weighs
const GREY_ROW = `${LUMA.map((l) => (l * DEVELOP_CONTRAST).toFixed(5)).join(" ")} 0 ${(0.5 - 0.5 * DEVELOP_CONTRAST).toFixed(5)}`;
const GREY_MATRIX = `${GREY_ROW} ${GREY_ROW} ${GREY_ROW} 0 0 0 1 0`;
// The tie keeps its red while it develops, so it passes straight from footage red to
// print red at the front (grey in between read as a smudge). The footage's own pixels go
// back over the developed ones with alpha = redness: R - 2G + B is 0.27-0.40 on the tie
// and under 0.21 on skin, lips, shirt and wall. It only applies below the collar.
const RED_FLOOR = 0.21;
const RED_GAIN = 14;
const RED_KEEP_MATRIX = `1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  ${RED_GAIN} ${-2 * RED_GAIN} ${RED_GAIN} 0 ${(-RED_FLOOR * RED_GAIN).toFixed(4)}`;
const RED_FROM_Y = 980; // the collar; the tie's knot starts at 1040
// the front's centre line starts with its whole developing zone above the frame
// and ends with its whole feather below it
const FRONT_FROM = -(FEATHER / 2 + ZONE + WOBBLE);
const FRONT_TO = FRAME_H + 3 * FEATHER_SIGMA + WOBBLE;
const FRONT_EASE = Easing.out(Easing.quad); // starts quick and settles

const smoothstep = (v: number) => {
  const x = Math.min(1, Math.max(0, v));
  return x * x * (3 - 2 * x);
};

/** y of the front's centre line at picture x: an eased fall plus a slow wobble that breathes a little as it goes. */
const frontY = (frame: number, x: number) => {
  const u = (frame - FREEZE) / (PRINT_DONE - FREEZE);
  const t = frame - FREEZE;
  const wobble =
    0.55 * Math.sin((2 * Math.PI * x) / 830 + 1.3 + 0.21 * t) +
    0.3 * Math.sin((2 * Math.PI * x) / 470 + 4.1 - 0.17 * t) +
    0.15 * Math.sin((2 * Math.PI * x) / 260 + 0.4 + 0.29 * t);
  return FRONT_FROM + (FRONT_TO - FRONT_FROM) * FRONT_EASE(Math.min(1, Math.max(0, u))) + WOBBLE * wobble;
};

// ---- the headline, printed in the white band above the crowd (picture px) ----
// The band runs from the red block's right edge (x 1719) to the picture's end, between the
// lower red rule (y 234) and the first crowd flags (y 709). Whatever is printed there is part
// of the picture: it sits in the panned plane, gets the pan's blur and never moves on its own.
const FIGURE_INK = "#1C1917";
const HEAD_FONT: React.CSSProperties = { fontFamily: SERIF, fontWeight: 900, fontVariantNumeric: "lining-nums proportional-nums" };

// "band": ONE line along the band; the camera whips along it and ends on its tail.
// Size and start are set by the END frame (window x 3259..4339): the line stops 40 px short of
// its right edge and its left edge cuts the first L of MILLION through the stem, so the tail
// reads LLION, a fragment. Spanning the band from the red block (429 px) the same edge lands
// on the second L's left serif and the frame reads LION, a word of its own.
const BAND_TEXT = "25 MILLION";
const BAND_SIZE = 364; // cap height 238
const BAND_FROM = 2213.3; // where its ink starts ...
const BAND_X = BAND_FROM - 0.05 * BAND_SIZE; // ... which is the "2"'s side bearing after the text's x
const BAND_BASELINE = 590; // caps centred between the rule and the flags
const BAND_LAYER = { left: 2040, top: 240, width: 2400, height: 480 }; // the ink plus room for the whip blur

/** The band headline. */
const BandHeadline: React.FC<{ blurred: boolean }> = ({ blurred }) => (
  <div style={{ position: "absolute", left: BAND_LAYER.left, top: BAND_LAYER.top, width: BAND_LAYER.width, height: BAND_LAYER.height, filter: blurred ? "url(#hlp-whip)" : undefined }}>
    <svg width={BAND_LAYER.width} height={BAND_LAYER.height} viewBox={`${BAND_LAYER.left} ${BAND_LAYER.top} ${BAND_LAYER.width} ${BAND_LAYER.height}`} style={{ position: "absolute", left: 0, top: 0 }}>
      <text x={BAND_X} y={BAND_BASELINE} fill={FIGURE_INK} style={{ ...HEAD_FONT, fontSize: BAND_SIZE }}>
        {BAND_TEXT}
      </text>
    </svg>
  </div>
);

// "lockup": the whole phrase in the END frame, 25 over MILLION, centred on the end window
const LOCK_25_SIZE = 448; // figures 288 px tall, 482 wide
const LOCK_25_BASELINE = 576; // figures y 288..582
const LOCK_25_NUDGE = -2.5; // px, centres the ink
const LOCK_M_SIZE = 177; // cap height 116, 778 px wide: 60 px to the right frame edge from f66
const LOCK_M_TRACK = 0; // em
const LOCK_M_BASELINE = 720; // ink y 600..722, 75 px above the first solid crowd shapes
const LOCK_M_NUDGE = 0.5;
const LOCK_BOX = 1400; // the layer's width: the block plus room for the whip blur
const LOCK_TOP = 240; // the layer's rows: from under the rule to below MILLION's ink
const LOCK_HEIGHT = 540;

/** The lockup headline at picture x cx. */
const LockupHeadline: React.FC<{ cx: number; blurred: boolean }> = ({ cx, blurred }) => {
  const left = cx - LOCK_BOX / 2;
  return (
    <div style={{ position: "absolute", left, top: LOCK_TOP, width: LOCK_BOX, height: LOCK_HEIGHT, filter: blurred ? "url(#hlp-whip)" : undefined }}>
      <svg width={LOCK_BOX} height={LOCK_HEIGHT} viewBox={`${left} ${LOCK_TOP} ${LOCK_BOX} ${LOCK_HEIGHT}`} style={{ position: "absolute", left: 0, top: 0 }}>
        <text x={cx + LOCK_25_NUDGE} y={LOCK_25_BASELINE} textAnchor="middle" fill={FIGURE_INK} style={{ ...HEAD_FONT, fontSize: LOCK_25_SIZE }}>
          25
        </text>
        <text
          x={cx + LOCK_M_NUDGE + (LOCK_M_TRACK * LOCK_M_SIZE) / 2}
          y={LOCK_M_BASELINE}
          textAnchor="middle"
          fill={FIGURE_INK}
          style={{ ...HEAD_FONT, fontSize: LOCK_M_SIZE, letterSpacing: `${LOCK_M_TRACK}em` }}
        >
          MILLION
        </text>
      </svg>
    </div>
  );
};

// "counter": 25M -> 50M -> 75M -> 100M in the end frame
// 316 px, cap height 212: the largest size that keeps 60 px to the right frame edge on f78,
// where "100M" lands 8 % big while the picture still has 40 px to drift
const FIGURE_SIZE = 316;
const FIGURE_BASELINE = 640; // between the lower red rule (234) and the crowd (795)
const CAPTION_SIZE = 44;
const CAPTION_TRACK = 0.12; // em
const CAPTION_BASELINE = 345;
// One more year of 25 million jobs per step; the figure grows a little each time. nudge (em)
// centres the INK on the figure's x: tabular figures carry their side bearings, the "1" most.
const STEPS = [
  { from: 0, label: "25M", year: 1, scale: 0.85, nudge: -0.011 },
  { from: 62, label: "50M", year: 2, scale: 0.9, nudge: -0.005 },
  { from: 70, label: "75M", year: 3, scale: 0.95, nudge: -0.014 },
  { from: 78, label: "100M", year: 4, scale: 1, nudge: -0.024 },
];
const PUNCH = 0.08; // the swap lands 8 % big ...
const PUNCH_FRAMES = 5; // ... and settles in five frames
const PUNCH_EASE = Easing.out(Easing.cubic);
const SHAKE_PX = 6;
const SHAKE_DEG = 0.7;
const SHAKE_FRAMES = 7;
const FIGURE_BOX = 1400; // the layer's width: the widest figure plus room for the whip blur

/** The figure and its caption at picture x cx. They are part of the print: same plane, same blur. */
const Figure: React.FC<{ frame: number; cx: number; blurred: boolean; showCaption: boolean }> = ({ frame, cx, blurred, showCaption }) => {
  let step = STEPS[0];
  for (const s of STEPS) if (frame >= s.from) step = s;
  // the first figure is simply printed there; each later one is a hard swap with a small punch and shake
  const t = frame - step.from;
  const swapped = step.from > 0;
  const punch = swapped && t < PUNCH_FRAMES ? 1 + PUNCH * (1 - PUNCH_EASE(t / PUNCH_FRAMES)) : 1;
  const shake = swapped && t <= SHAKE_FRAMES ? Math.exp(-t / 2) : 0;
  const dx = SHAKE_PX * shake * Math.cos(2.2 * t);
  const deg = SHAKE_DEG * shake * Math.sin(2.2 * t);
  const left = cx - FIGURE_BOX / 2;
  return (
    <div style={{ position: "absolute", left, top: 0, width: FIGURE_BOX, height: FRAME_H, filter: blurred ? "url(#hlp-whip)" : undefined }}>
      <svg width={FIGURE_BOX} height={FRAME_H} viewBox={`${left} 0 ${FIGURE_BOX} ${FRAME_H}`} style={{ position: "absolute", left: 0, top: 0 }}>
        {showCaption ? (
          <text
            x={cx + (CAPTION_TRACK * CAPTION_SIZE) / 2}
            y={CAPTION_BASELINE}
            textAnchor="middle"
            fill={FIGURE_INK}
            style={{ fontFamily: SANS, fontWeight: 600, fontSize: CAPTION_SIZE, letterSpacing: `${CAPTION_TRACK}em`, fontVariantNumeric: "lining-nums tabular-nums" }}
          >
            {`NEW JOBS \u00B7 YEAR ${step.year}`}
          </text>
        ) : null}
        {/* scaled and shaken about the centre of its baseline, so the baseline never moves */}
        <text
          x={step.nudge * FIGURE_SIZE}
          y={0}
          textAnchor="middle"
          fill={FIGURE_INK}
          transform={`translate(${(cx + dx).toFixed(3)} ${FIGURE_BASELINE}) rotate(${deg.toFixed(4)}) scale(${(step.scale * punch).toFixed(5)})`}
          style={{ fontFamily: SERIF, fontWeight: 700, fontSize: FIGURE_SIZE, fontVariantNumeric: "lining-nums tabular-nums" }}
        >
          {step.label}
        </text>
      </svg>
    </div>
  );
};

const liveSrc = (n: number) => staticFile(`jordanhu/hu_live/f${String(n).padStart(2, "0")}.jpg`);
const full: React.CSSProperties = { position: "absolute", left: 0, top: 0, width: FRAME_W, height: FRAME_H };

/** The frozen frame under the print front: gone above it, developing just ahead of it, untouched below. */
const FrozenUnderFront: React.FC<{ frame: number }> = ({ frame }) => {
  // everything under the front, as one shape; its top edge is the front
  const pts: string[] = [];
  for (let x = -20; x <= FRAME_W + 20; x += 20) pts.push(`${x} ${frontY(frame, x).toFixed(2)}`);
  const under = `M${pts.join("L")}L${FRAME_W + 20} ${FRAME_H + 400}L-20 ${FRAME_H + 400}Z`;
  // the developing zone hangs under the feather: full at the front, fading out ZONE px further down
  const zoneTop = frontY(frame, FRAME_W / 2) + FEATHER / 2;
  const stops: React.ReactNode[] = [];
  for (let i = 0; i <= 6; i++) {
    stops.push(<stop key={i} offset={(i / 6).toFixed(4)} stopColor="#FFFFFF" stopOpacity={(1 - smoothstep(i / 6)).toFixed(4)} />);
  }
  const frozen = liveSrc(LIVE_FRAMES);
  // The picture goes in as an HTML <Img> inside <foreignObject>: Remotion holds the frame
  // until an <Img> has loaded, which it does not do for an SVG <image>.
  return (
    <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} style={{ position: "absolute", left: PRINT_X, top: 0 }}>
      <defs>
        <filter id="hlp-feather" filterUnits="userSpaceOnUse" x={-40} y={-600} width={FRAME_W + 80} height={FRAME_H + 1200} colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation={`0 ${FEATHER_SIGMA.toFixed(3)}`} />
        </filter>
        <mask id="hlp-front" maskUnits="userSpaceOnUse" x={0} y={0} width={FRAME_W} height={FRAME_H} style={{ maskType: "alpha" }}>
          <path d={under} fill="#FFFFFF" filter="url(#hlp-feather)" />
        </mask>
        <linearGradient id="hlp-zone-g" gradientUnits="userSpaceOnUse" x1={0} y1={zoneTop.toFixed(2)} x2={0} y2={(zoneTop + ZONE).toFixed(2)}>
          {stops}
        </linearGradient>
        <mask id="hlp-zone" maskUnits="userSpaceOnUse" x={0} y={0} width={FRAME_W} height={FRAME_H} style={{ maskType: "alpha" }}>
          <rect x={0} y={0} width={FRAME_W} height={FRAME_H} fill="url(#hlp-zone-g)" />
        </mask>
        <filter id="hlp-develop" colorInterpolationFilters="sRGB" x="0%" y="0%" width="100%" height="100%">
          <feColorMatrix in="SourceGraphic" type="matrix" values={GREY_MATRIX} />
          <feComponentTransfer result="grey">
            <feFuncR type="linear" slope={(PAPER_RGB[0] - INK[0]) / 255} intercept={INK[0] / 255} />
            <feFuncG type="linear" slope={(PAPER_RGB[1] - INK[1]) / 255} intercept={INK[1] / 255} />
            <feFuncB type="linear" slope={(PAPER_RGB[2] - INK[2]) / 255} intercept={INK[2] / 255} />
          </feComponentTransfer>
          <feColorMatrix in="SourceGraphic" type="matrix" values={RED_KEEP_MATRIX} x={0} y={RED_FROM_Y} width={FRAME_W} height={FRAME_H - RED_FROM_Y} result="red" />
          <feMerge>
            <feMergeNode in="grey" />
            <feMergeNode in="red" />
          </feMerge>
        </filter>
      </defs>
      <g mask="url(#hlp-front)">
        <foreignObject x={0} y={0} width={FRAME_W} height={FRAME_H}>
          <Img src={frozen} style={full} />
        </foreignObject>
        <g mask="url(#hlp-zone)">
          <foreignObject x={0} y={0} width={FRAME_W} height={FRAME_H}>
            <Img src={frozen} style={{ ...full, filter: "url(#hlp-develop)" }} />
          </foreignObject>
        </g>
      </g>
    </svg>
  );
};

const HuLiveToPrint: React.FC<HuLiveToPrintProps> = ({ endX, headline, showCaption }) => {
  const frame = useCurrentFrame();

  // the video, then its freeze frame: nothing but the picture
  if (frame <= FREEZE) {
    return (
      <AbsoluteFill style={{ backgroundColor: PAPER, overflow: "hidden" }}>
        <Img src={liveSrc(Math.min(LIVE_FRAMES, Math.max(1, Math.floor(frame) + 1)))} style={full} />
      </AbsoluteFill>
    );
  }

  const panFrame = frame - PAN_START; // before f20 the pan's own curve holds on PRINT_X
  const x = windowX(panFrame, PRINT_X, endX);
  const sigma = whipSigma(panFrame, PRINT_X, endX, PANO_W);
  // the lockup and the counter sit centred on the END window, so they glide to the middle of
  // the frame at the cut; the band is fixed in the picture. None is drawn before the window
  // (and its blur) can reach it, so the frames before that are the bare print.
  const endCentre = endX + FRAME_W / 2;
  const reach = x + FRAME_W + 3 * sigma;
  const blurred = sigma > 0;
  let printed: React.ReactNode = null;
  if (headline === "band" && reach > BAND_FROM) printed = <BandHeadline blurred={blurred} />;
  else if (headline === "lockup" && reach > endCentre - LOCK_BOX / 2) printed = <LockupHeadline cx={endCentre} blurred={blurred} />;
  else if (headline === "counter" && reach > endCentre - FIGURE_BOX / 2) printed = <Figure frame={frame} cx={endCentre} blurred={blurred} showCaption={showCaption} />;

  return (
    <AbsoluteFill style={{ backgroundColor: PAPER, overflow: "hidden" }}>
      <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
        <defs>
          {/* the region is the whole plane, so the blur samples picture well past the frame's edges */}
          <filter id="hlp-whip" colorInterpolationFilters="sRGB" x="0%" y="0%" width="100%" height="100%">
            <feGaussianBlur stdDeviation={`${sigma} 0`} />
          </filter>
        </defs>
      </svg>
      {/* the image plane: the print, and on it (while the pass lasts) the frozen frame it was made from */}
      <div style={{ position: "absolute", left: 0, top: 0, width: PANO_W, height: FRAME_H, transform: `translateX(${-x}px)` }}>
        <Img
          src={staticFile(PANO)}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: PANO_W,
            height: FRAME_H,
            filter: sigma > 0 ? "url(#hlp-whip)" : undefined,
          }}
        />
        {printed}
        {frame < PRINT_DONE ? <FrozenUnderFront frame={frame} /> : null}
      </div>
    </AbsoluteFill>
  );
};

export default HuLiveToPrint;
