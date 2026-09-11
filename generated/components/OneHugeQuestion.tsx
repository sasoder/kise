import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/google-fonts/Barlow";
import { z } from "zod";
import {
  BG_OVERSIZE,
  CAM_LIFT,
  FRAME_H,
  FRAME_W,
  camMove,
  clamp,
  runCamera,
  sway,
  worldTransform,
} from "./fieldShared";

const { fontFamily } = loadFont("normal", {
  weights: ["900"],
  subsets: ["latin"],
});

export const FPS = 24;
// Atelier Missor clip "1- Atelier Missor", SRT cues 47-51: "But there's still
// one huge question that is left unanswered".
//
// SRT span 00:00:31,320 -> 00:00:34,179 at 24fps. The composition starts on the
// onset of "there's", 31.320 s.
// round((34.179 - 31.320) * 24) = round(2.859 * 24) = round(68.616) = 69
// frames of speech, plus a 16 frame tail so the resolved state holds = 85.
export const DURATION = 85;

// ---------------------------------------------------------------------------
// "One huge question". The sibling of `ParisToBrownsville` — the next cut of
// the same clip, on the same ground, in the same colours, with the same camera
// and the same type. Its `PaperGround`, its constants and its framing maths are
// copied here verbatim rather than imported: that file is a one-off, not a
// shared module, and it is not touched by this one.
//
// THE MATERIAL IS PAPER, and this time the paper is ALL there is under the
// mark: `public/paper-supaclean-still.png`, real squared paper, dimmed
// `brightness(0.88)` and blurred `2.5px` in screen px on the image only, moving
// with the camera on `GridBackground`'s transform (parallax 0.15 in both axes,
// scale 1 + (k-1)*0.3, the same -0.3 px/frame drift, 1.8x oversize with
// objectFit cover, rotated 90 deg so the landscape photograph covers the
// portrait box with its squares still square). No map, no land, no pins.
//
// THE MARK is one glyph: a Barlow 900 question mark, ink #1A1A1A, no stroke,
// centred on world x 540 with its ink centred on world y 835 — the content
// centre this whole set frames to, which `CAM_LIFT` puts on screen y 835, above
// the captions.
//
// THE COLOURS are the CORE MEMORY logo chain, raw — no filters, no blend modes,
// no gradients, no glow:
//   orange #FFB765   purple #BC37FF   blue #0046FF   ink #1A1A1A
// and in this cut they have exactly one job between them: they are the mark's
// own chain, first stacked into it and then pulled out of it.
//
// THE GESTURES — two, and one camera move. Nothing else.
//   1. THE MARK STACKS UP — the CORE MEMORY chain entrance
//      (`VastLogoChannelSplit`, mechanism for mechanism: five
//      layers of the same glyph at the same size and the same
//      final position, each sliding UP 130 px into place over
//      22 frames on Easing.bezier(0.16, 1, 0.3, 1), nothing
//      fading, a layer simply not rendered before its own start
//      frame). Back to front and in arrival order: orange f8,
//      purple f10, blue f12, ink core f14, with the core's hard
//      readability shadow at the very back riding on the core's
//      own timing. They all land on the identical position, so
//      from ~f36 only the ink mark and its shadow are visible,
//      and because the ease is front-loaded the mark reads as
//      landed by ~f24 — three frames BEFORE "question"
//                                      — "still one huge"       f8-36
//      ("question" f27 carries no gesture of its own: the
//       arrival IS the word, and it is already there for it)
//   2. THE MARK COMES APART, and stays apart. The three colour
//      copies slide back DOWN out from behind the core in
//      reverse arrival order — blue f52, purple f54, orange f56
//      — on the same easing over the same 22 frames, and each
//      stops at its own offset and HOLDS: blue +48, purple +96,
//      orange +144 world px below the core. Nothing fades,
//      nothing scales, and the core and its shadow do not move.
//      The last frame is the ink mark with the three colours
//      hanging below it in chain order, blue nearest: a mark
//      that has been opened and never closes
//                                      — "unanswered"           f52-78
//   THE CAMERA — one move, and it is "that is left": a slow
//   push from k 1.00 to k 1.10, keys f39 -> f60, warp 0.7,
//   damped by `runCamera`, with cy = 835 + CAM_LIFT / k at every
//   key so the content centre never leaves screen y 835. See the
//   settled numbers below.
//
// Word onsets, frames from the composition's start, round((t - 31.320) * 24):
//   f0 there's | f8 still one huge | f27 question | f39 that is left |
//   f52 unanswered | f69 end of "unanswered" | f84 last frame
//
// THE FRAMING. For a content centre c, `cy = c + CAM_LIFT / k` puts c on screen
// y 960 - 125 = 835, under the captions; cx is fixed on 540, so world x 540 is
// screen x 540 at every k.
//   screen(y) = (y - cy) * k + 960      screen(x) = (x - cx) * k + 540
//
//   OPEN, k 1.00 / cy 960.0 — the glyph's ink spans world y 385 .. 1285, which
//     is screen y 385 .. 1285; the visible world box is y -0.0 .. 1920.0.
//   REST, k 1.10 / cy 948.64 — the ink spans screen y 340 .. 1330, the fanned
//     orange's bottom edge (world 1495) lands on screen 1561, and the visible
//     world box is y 75.9 .. 1821.4 and x 49.1 .. 1030.9 against an ink box of
//     y 385 .. 1285 and x 212 .. 868. Nothing in the cut is cut by the frame,
//     and the paper (1944 x 3456 against 1080 x 1920, with a largest offset of
//     0.5 px sideways and 23 px vertically) never shows an edge.
//
// THE CAMERA, damped, the numbers `runCamera` actually produces:
//     f39  k 1.0000 / cy 960.00   the move breaks here, on the word
//     f60  k 1.0947 / cy 949.20   the keys end
//     f64  k 1.0978 / cy 948.86   1.01% of the move per frame
//     f68  k 1.0997 / cy 948.67   0.24%/frame — 0.2 px per frame on a 900 px
//                                 glyph, which is still; under 0.1%/frame from
//                                 f70, and it holds to f84
//   One acceleration lobe and one settle lobe, no reversal the eye could see:
//   the damper's whole overshoot is 4.3e-5 of k, 0.04% of the move.
//
// DEVIATIONS from the brief, and why.
//   * THE GLYPH IS 900 px OF INK, NOT 1000. The brief's own fallback: with the
//     ink centred on 835 the baseline sits at 835 + h/2, so the fanned orange's
//     bottom edge is 835 + h/2 + 210 — 1545 at h 1000, which is below the
//     briefed limit of world y 1400. 900 is the briefed fallback and it is what
//     is built. It does NOT get under 1400 either (1495): no glyph above 710 px
//     of ink can, so the limit is unreachable at the briefed sizes and this is
//     reported rather than solved by shrinking the mark to two thirds. Nothing
//     is cut by the frame at either size (see REST above).
//   * THE HARD SHADOW STARTS WITH THE CORE, f14, not f8. The brief says f8 and
//     then says the shadow rides with the core's timing and to match
//     `VastLogoChannelSplit`; that file renders the shadow only from the core's
//     own delay and moves it on the core's own offset. Matched. Starting it at
//     f8 would put a grey ghost of the mark on the paper six frames before the
//     mark, which is the one thing the entrance is built not to do.
// ---------------------------------------------------------------------------

const ORANGE = "#FFB765";
const PURPLE = "#BC37FF";
const BLUE = "#0046FF";
const INK = "#1A1A1A";
// The paper's own field, behind the image, so a frame can never show through.
const PAPER_BASE = "#E9E9E9";

export const schema = z.object({
  glyph: z.string(),
  ink: z.string(),
  orange: z.string(),
  purple: z.string(),
  blue: z.string(),
  paperSrc: z.string(),
  parallax: z.number(),
  // the paper is knocked back so the mark sits in front of it. Screen px.
  paperDim: z.number(),
  paperBlur: z.number(),
  // the chain's own hard readability shadow: a pure-ink copy, zero blur,
  // offset in WORLD px so it rides the glyph at every zoom
  shadowOffset: z.number(),
  shadowOpacity: z.number(),
  // the entrance: every layer slides up this far, over this many frames
  rise: z.number(),
  beats: z.object({
    theres: z.number(), // "there's"         — nothing; the paper holds
    stillOneHuge: z.number(), // "still one huge" — the chain entrance
    question: z.number(), // "question"      — nothing; the arrival IS the word
    thatIsLeft: z.number(), // "that is left" — the one camera move
    unanswered: z.number(), // "unanswered"  — the mark comes apart
    end: z.number(), // speech ends; tail to 85
  }),
});

export type Props = z.infer<typeof schema>;

// ---------------------------------------------------------------------------
// THE GLYPH. Barlow 900 "?", drawn as SVG text in world space so the camera
// scales it like everything else in this set.
//
// MEASURED, not assumed. Rendered at font-size 1254 and read straight off the
// frame (every pixel whose three channels are all under 90, which is the ink
// and nothing else in this cut), the glyph's ink box is world y 394.74 ..
// 1289.74 against a baseline of 1285 and world x 216 .. 868 against an anchor
// of 543. So, per em of font-size:
//   the top of the bowl sits 0.70994 em ABOVE the baseline
//   the bottom of the dot sits 0.00378 em BELOW it — a round dot's overshoot
//   the ink is therefore 0.71372 em tall and its centre is 0.35308 em above
//   the baseline, and the ink's own centre is 1.0 px left of the advance-width
//   centre, which is what `GLYPH_X` puts back so the INK lands on x 540.
// Re-measured after the correction, off a full-res still of f36: the ink box is
// 901 x 656 world px, centred on (540.00, 835.24), spanning world y 384.74 ..
// 1285.74 — 900 px of ink, to the pixel the threshold can resolve.
// ---------------------------------------------------------------------------
export const INK_EM = 0.71372; // ink height / font-size, measured
export const INK_CENTRE_EM = 0.35308; // ink centre above the baseline, measured
export const INK_TARGET = 900; // world px of ink, the brief's fallback size
export const FONT_SIZE = Math.round(INK_TARGET / INK_EM); // 1261
export const CONTENT_C = 835; // the content centre, on screen y 835 at every k
export const BASELINE = CONTENT_C + INK_CENTRE_EM * FONT_SIZE; // 1280.23
export const GLYPH_X = FRAME_W / 2 + 1.0; // the ink's centre lands on 540

// -- the entrance (VastLogoChannelSplit, mechanism for mechanism) ------------
export const TRAVEL_FRAMES = 22;
export const RISE = 130;
export const STAGGER = 2;
const EASE_LAND = Easing.bezier(0.16, 1, 0.3, 1);

// -- the fan ----------------------------------------------------------------
// Reverse arrival order, two frames apart, each to its own resting offset.
export const FAN_STEP = 2;
// Director's trim after the preview: 70/140/210 put the orange band's bottom at
// screen y 1561, inside the caption zone; 48/96/144 keeps it at ~1490.
export const FAN_OFFSETS = { blue: 48, purple: 96, orange: 144 };

// -- the camera -------------------------------------------------------------
export const K_OPEN = 1.0;
export const K_REST = 1.1;
export const CAM_F0 = 39; // "that is left"
export const CAM_F1 = 60;
export const CAM_WARP = 0.7;

const MOVE = camMove({
  f0: CAM_F0,
  f1: CAM_F1,
  k0: K_OPEN,
  k1: K_REST,
  c0: CONTENT_C,
  c1: CONTENT_C,
  warp: CAM_WARP,
});
export const OHQ_CAM_F = [0, ...MOVE.F, DURATION];
export const OHQ_CAM_K = [K_OPEN, ...MOVE.K, K_REST];
export const OHQ_CAM_CY = [CONTENT_C + CAM_LIFT / K_OPEN, ...MOVE.CY, CONTENT_C + CAM_LIFT / K_REST];
export const CAM_CX = FRAME_W / 2;

export const defaultProps: Props = schema.parse({
  glyph: "?",
  ink: INK,
  orange: ORANGE,
  purple: PURPLE,
  blue: BLUE,
  paperSrc: "paper-supaclean-still.png",
  parallax: 0.15,
  paperDim: 0.88,
  paperBlur: 2.5,
  shadowOffset: 8,
  shadowOpacity: 0.22,
  rise: RISE,
  beats: {
    theres: 0,
    stillOneHuge: 8,
    question: 27,
    thatIsLeft: 39,
    unanswered: 52,
    end: 69,
  },
});

// ---------------------------------------------------------------------------
// THE GROUND. `ParisToBrownsville`'s `PaperGround`, verbatim: `GridBackground`'s
// transform maths — parallax off the camera's own rest in both axes, the same
// slow drift, the same 1 + (k-1)*0.3 scale, the same 1.8x oversize with
// objectFit cover — carrying `brightness(0.88) blur(2.5px)`, in screen px, on
// the image and on nothing else. The filter is INSIDE the oversized box, so the
// blur's own soft edge is hundreds of px outside the frame at every frame.
//
// THE IMAGE IS TURNED 90 deg: it is 3864 x 2164 landscape and the box is
// 1944 x 3456 portrait, so the element is laid out at the box's dimensions
// SWAPPED and `objectFit: cover` solves against the landscape source before
// `rotate(90deg)` — innermost in the transform — turns it up on end. Squares are
// square, so the turn is invisible, and the photograph's 171 px rules land at
// 154 px: seven across the frame at k 1.
// ---------------------------------------------------------------------------
const PaperGround: React.FC<{
  src: string;
  frame: number;
  cy: number;
  cyRest: number;
  cx: number;
  cxRest: number;
  k: number;
  parallax: number;
  dim: number;
  blur: number;
}> = ({ src, frame, cy, cyRest, cx, cxRest, k, parallax, dim, blur }) => {
  const bgY = -(cy - cyRest) * k * parallax - frame * 0.3;
  const bgX = -(cx - cxRest) * k * parallax;
  const bgScale = 1 + (k - 1) * 0.3;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Img
        src={staticFile(src)}
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: FRAME_H * BG_OVERSIZE,
          height: FRAME_W * BG_OVERSIZE,
          objectFit: "cover",
          filter: `brightness(${dim}) blur(${blur}px)`,
          transform: `translate(-50%, -50%) translate(${bgX.toFixed(2)}px, ${bgY.toFixed(2)}px) scale(${bgScale.toFixed(4)}) rotate(90deg)`,
        }}
      />
    </AbsoluteFill>
  );
};

const OneHugeQuestion: React.FC<Props> = ({
  glyph,
  ink,
  orange,
  purple,
  blue,
  paperSrc,
  parallax,
  paperDim,
  paperBlur,
  shadowOffset,
  shadowOpacity,
  rise,
  beats,
}) => {
  const frame = useCurrentFrame();

  // -- the camera, first -----------------------------------------------------
  const cam = runCamera(frame, OHQ_CAM_F, OHQ_CAM_CY, OHQ_CAM_K);
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = CAM_CX + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);

  // -- the entrance ----------------------------------------------------------
  // One shared slide, sampled at a different start frame per layer: quick off
  // the mark, then a long ease into place. Nothing fades, so a layer simply
  // does not exist until its turn.
  const riseAt = (f0: number) => {
    const t = interpolate(frame, [f0, f0 + TRAVEL_FRAMES], [0, 1], {
      easing: EASE_LAND,
      ...clamp,
    });
    return (1 - t) * rise;
  };

  // -- the fan ---------------------------------------------------------------
  // The same easing and the same 22 frames, the other way, and it holds.
  const fanAt = (f0: number, distance: number) =>
    interpolate(frame, [f0, f0 + TRAVEL_FRAMES], [0, distance], {
      easing: EASE_LAND,
      ...clamp,
    });

  const coreStart = beats.stillOneHuge + 3 * STAGGER; // f14
  const coreDy = riseAt(coreStart);

  // Back to front: orange, purple, blue. In, on their own frames; out, in
  // reverse, to their own resting offsets.
  const layers = [
    {
      color: orange,
      start: beats.stillOneHuge, // f8
      fanStart: beats.unanswered + 2 * FAN_STEP, // f56
      fan: FAN_OFFSETS.orange,
    },
    {
      color: purple,
      start: beats.stillOneHuge + STAGGER, // f10
      fanStart: beats.unanswered + FAN_STEP, // f54
      fan: FAN_OFFSETS.purple,
    },
    {
      color: blue,
      start: beats.stillOneHuge + 2 * STAGGER, // f12
      fanStart: beats.unanswered, // f52
      fan: FAN_OFFSETS.blue,
    },
  ];

  const type = {
    fontFamily,
    fontWeight: 900,
    fontSize: FONT_SIZE,
  } as const;

  const mark = (fill: string, dy: number, dx = 0, opacity = 1) => (
    <text
      x={GLYPH_X + dx}
      y={BASELINE + dy}
      textAnchor="middle"
      fill={fill}
      opacity={opacity}
      style={type}
    >
      {glyph}
    </text>
  );

  return (
    <AbsoluteFill style={{ backgroundColor: PAPER_BASE }}>
      <PaperGround
        src={paperSrc}
        frame={frame}
        cy={cy}
        cyRest={OHQ_CAM_CY[0]}
        cx={cx}
        cxRest={CAM_CX}
        k={k}
        parallax={parallax}
        dim={paperDim}
        blur={paperBlur}
      />

      <AbsoluteFill>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: FRAME_W,
            height: FRAME_H,
            transformOrigin: "0 0",
            transform: `translate(${tx}px, ${ty}px) scale(${k})`,
          }}
        >
          <svg
            width={FRAME_W}
            height={FRAME_H}
            viewBox={`0 0 ${FRAME_W} ${FRAME_H}`}
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          >
            {/* The hard readability shadow, at the very back so it never
                darkens the colours: a pure-ink copy, zero blur, offset right
                and down, riding the core's own timing and the core's own
                offset. */}
            {frame >= coreStart
              ? mark(INK, coreDy + shadowOffset, shadowOffset, shadowOpacity)
              : null}

            {/* The three colours. Listed back to front and stacked the same
                way, so the fan reads as a chain with blue nearest the core. */}
            {layers.map((l) =>
              frame >= l.start ? (
                <g key={l.color}>{mark(l.color, riseAt(l.start) + fanAt(l.fanStart, l.fan))}</g>
              ) : null,
            )}

            {/* The core: the mark itself, on top of all of them. */}
            {frame >= coreStart ? mark(ink, coreDy) : null}
          </svg>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default OneHugeQuestion;
