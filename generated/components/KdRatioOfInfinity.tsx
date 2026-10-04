import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { ACCENT, CanvasDots, DARK, INK, INK_CONTEXT, INK_FULL, NumeralLabel, PlanPage, WorldSvg, mixColor, swayCam, type DotLayer } from "./incaShared";
import {
  CAM_TRACK,
  DEAD_OP,
  DURATION,
  FPS,
  GROUND_Y,
  HEAP_CX,
  HEAP_PLOT,
  INF_CASE,
  INF_D,
  INF_FULL,
  INF_W,
  LAST,
  MARKS,
  MARK_R,
  NUM_BASE_Y,
  NUM_PX,
  PEN_R,
  PLOT,
  PLOT_CX,
  RULE_CASE,
  RULE_W,
  RULE_W_ORANGE,
  T,
  TICK_HALF,
  colonEntrance,
  drawingInk,
  markAt,
  orangeT,
  penR,
  pensAt,
  shimmerAt,
} from "./kdMotion";

export { DURATION, FPS };

// ---------------------------------------------------------------------------
// KdRatioOfInfinity. Dwarkesh Patel with Si Sheppard, clip
// "Sheppard_Cajamarca_infinite_KD": Pizarro at Cajamarca, 16 Nov 1532. The
// speaker's punchline on the slaughter that cut A shows on the plan:
//   "...literally a K/D ratio of infinity. Of, you know, 10,000 to zero."
// DWARKESH MAP STYLE, a non-map page from the same atlas: the Peru world's
// umber page (incaShared PlanPage: world-space mottle under the camera, grain
// and vignette in screen space), one engraved figure on it. Opaque 1080x1920,
// 24 fps. The geometry, timing and camera live in kdMotion.ts.
//
// TIMELINE. In-point 23.00 s on the edit timeline; word onsets from the
// word-level re-transcription (SP/words_whisper.txt); f = round((t - 23.00) * 24):
//   literally 23.00 f0 · a 23.50 f12 · K 23.74 f18 · D 23.84 f20 ·
//   RATIO 23.94 f23 · of 24.36 f33 · INFINITY 24.66 f40 (ends 25.06 f49) ·
//   "of, you know," 25.06-~26.95 f49-f95 · TEN ~27.00 f96 (the ASR puts its
//   onset anywhere in 26.5-27.3 s, so "10,000" lands as one string ~f100) ·
//   THOUSAND 27.36 f105 · to 27.74 f114 · ZERO 27.86 f117 (ends 28.08 f122).
// DURATION: 23.00 -> 28.08 s = 5.08 s; round(5.08 * 24) = round(121.92) = 122,
// + the 16-frame house tail = 138 frames (f0..f137).
//
// REVISION 1 (the director): the figure fills the phone column (final framing
// y ~520-1110, centre of mass ~y 830); the infinity is the headline, large
// and well above the gap; two equal plots with engraved end ticks; numerals as
// big as fit; one slow push-in on the infinity through "of, you know".
// REVISION 2: every element stays >= 60 px inside the frame from f46 to f137
// (asserted in kdMotion): the plots pulled in to x 102-470 and 610-978, the
// numerals 156 px; the heap a pile with sloping sides (~2.2 : 1), its rounded
// crown a little left of the middle, flanks running down into a feathered
// skirt that thins out on the ground toward both ticks (shaped by the
// distribution, never clipped).
//
// THE PICTURE. A K/D ratio is two counts, drawn as two equal plots of ground
// on the same page (final framing, before the push-in; ground at y 930):
//   K, the killed (left plot, x 102-470): 10,000 dead marks lying in one pile
//     on a fine engraved cream rule (context rung) with an engraved end tick at
//     each end (a scale bar's serifs). The pile's crown line is a raised cosine
//     along each flank (0 at the crown, 1 just inside that side's tick), so the
//     crown is rounded, the flanks slope at ~50-55 deg and the skirt runs out
//     tangent to the ground; 140 px tall (+ a feathered fringe) over a ~350 px
//     skirt, ~2.2 : 1; the crown 22 px left of the plot's middle. Full inside,
//     densest at the base centre, thinning along the skirt to nothing before
//     the ticks; 140 strays lie on the ground beyond the skirt, their spread
//     ending inside the ticks. The dead look is builder A's (cut A,
//     HundredAgainstHundredThousand, hundredShared DEAD_OP / DEAD_R_SCALE):
//     cream INK at 0.26, radius 0.85 x a living man's dot (the plaza crowd's
//     1.95 px -> 1.66 px at the final framing, world-sized), no casing.
//     Blue-noise rest positions at a varying density; drawn as three
//     interleaved CanvasDots layers, so overlapping marks build tone (at most
//     1 - 0.74^3 = 0.59) and never go solid.
//   D, the dead of Pizarro's side (right plot, x 610-978, as wide as the
//     heap's): the orange rule (ACCENT, a touch heavier, 4.2 px, cased in
//     DARK) with orange end ticks. Nothing ever lies on it.
//   The ratio sign: an engraved colon (two cream dots) in the gap (x 470-610)
//     becomes a large orange engraved lemniscate standing well above it (a
//     stretched Bernoulli lemniscate centred on (540, 640), 440 px wide, 6 px
//     stroke cased in DARK; an SVG path, never type: IM Fell has no infinity).
//   Two numerals (incaShared NumeralLabel, cream, IM Fell English roman, the
//     house slide-up 24 px + fade, screen-sized 156 px, anchored to the page):
//     "10,000" centred under the heap, "0" (the same size) under the plot.
//     156 px is the largest that keeps "10,000" and its halo 60 px inside the
//     frame on f137 after the push-in; the old-style digits stand 0.40 em =
//     62 px ("10,000" with its comma 103 px).
//     No other text.
// COLOUR RULE: orange (ACCENT #FFB000) = PIZARRO'S SIDE only: their dead (the
// empty plot) and their ratio (the infinity). Everything Inca is cream.
//
// THE GESTURES, each with its word (one continuous motion; each starts before
// its word and lands on it):
//   1. "literally a K/D" f0-f22: open close on the heap as it forms (k 1.55, the
//      heap's centre of mass at (540, 835), its plot's ticks in frame, the
//      orange plot's first tick at the right edge). The pour runs f-12..f22 (+
//      the stragglers): each mark appears 40-120 px above its rest (on screen
//      at the open) and falls on its own hashed start and duration (an eased
//      u^1.7 fall of 4-8 f, <= ~30 px/f on screen, faint at the top of its fall
//      and full as it lands), then settles 2-3 f (a sink of <= 1.4 px and
//      back). The heap rises bottom up, self-similar: its silhouette is
//      complete on f22; 150 stragglers from the upper interior keep dropping in
//      until ~f60. The camera is already gliding right along the ground
//      (f-26..f50) toward the gap and the empty orange plot; nothing falls
//      there: the pour stops at the heap's plot.
//   2. "ratio" f23: the colon's two dots slide up (24 px) and fade in in the
//      gap at the heap's mid-height (y 815), landing on f23 (f9-f23).
//   3. "of infinity" f23.5-f46: the colon's middle rises 175 px to the
//      infinity's centre (f23.5-f40) as its dots turn 39 deg anticlockwise
//      onto the crossing's diagonal (f23.5-f27.5); then each dot is a pen
//      drawing its own loop (stroke draw-on, f25.5-f40: an even stroke eased in
//      over 3 f and out over 4.5 f) while the figure grows from 128 to 440 px
//      wide (f24.5-f39), both pens turning anticlockwise (the left loop out
//      up-left, the right loop out down-right; the pen heads peak ~55 px/f on
//      screen); the ink runs as one path from pen to pen through the crossing
//      (at first the colon's two dots linked by the crossing's diagonal; it
//      fades in f25.5-f27.5), and the pens meet head-on at the crossing on
//      "infinity" (f40) as they and their ink turn orange (an eased crossfade
//      f36-f46) and the pen heads sink into the crossing (f40-f46). Meanwhile
//      the glide runs on into one eased pull-back to the whole figure (k 1.55
//      -> 1.0, f8-f47, landing ~f46; the figure on x 540, the ground at y 930).
//   4. "of, you know," f46-f96: one slow continuous push-in on the infinity
//      (held at (540, 640)), +8 % from f46 to f137, eased in from the
//      pull-back's landing and still moving on the last frame (never a
//      plateau); one short bright highlight (a warm near-white segment,
//      visibly brighter than the orange line, no glow) leaves the crossing
//      (f44) and travels the infinity's path, circulating every 40 f to the
//      last frame; the last stragglers settle (~f60).
//   5. "10,000" ~f100: the numeral slides up under the heap (f88-f100).
//   6. "zero" f117: "0" slides up under the empty orange plot, landing on f117.
//   7. Tail f122-f137: the push-in continues, the highlight keeps travelling;
//      still moving on the last frame.
// Nothing else: no balance, arrows, rings, glows, flashes, red, crosses or
// skulls, no counters ticking, no "K", "D", "K/D" or "=".
//
// COUNTS AND SOURCES (SP/FACTS.md section 4; never on screen):
//   10,000 dead marks: the speaker's figure. The published range is 2,000 to
//     10,000 Inca dead: Xerez 2,000; Mena 6,000-7,000; Trujillo 8,000 (the
//     highest eyewitness figure); the speaker rounds up to the top of the range.
//   Zero Spanish dead: no conquistador was killed; the only Spanish wound was
//     Pizarro's hand, cut by a Spaniard's knife (Hernando Pizarro, letter of
//     Nov 1533, Markham 1872 pp.118-119; Xerez p.55); one horse slightly hurt
//     (Xerez p.57).
//
// CAMERA: one authored track (kdMotion: velocity bumps on ln k and on the world
// point held at the screen anchor (540, 640), the infinity's place; C1), the
// house sway on top. camScan over a probe grid above the caption band: max
// 24.6 px/f (f24, the pull-back), max |dv| 1.67 px/f^2 (f36); the heap's
// centre max 13.5 px/f, the infinity's centre 16.0, the plot 19.5. The
// pull-back's turn into the push-in (~f48) is the slowest moment (0.18 px/f
// before the sway); the push-in (+8.1 % f46 -> f137) runs at ~0.5-0.7 px/f
// from f60 to the end.
// Asserted every frame in kdMotion: the ground and its ticks above y 1150; the
// numerals (with the slide-up's start offset, the comma's descent and the
// sway) above y 1150, and once landed with their feet above y 1110; from f46
// on, every element (both plots with their ticks, the dead, the infinity,
// both numerals with their halo, with the sway) >= 60 px inside the frame.
// ---------------------------------------------------------------------------

export const schema = z.object({
  vignette: z.number(),
  deadOpacity: z.number(), // the dead mark's opacity (builder A's look: 0.26; <= 0.34)
  stackLayers: z.number().int().min(1).max(8), // interleaved layers: overlapping marks build tone
  ruleOpacity: z.number(), // the cream ground rule's rung
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({
  vignette: 0.55,
  deadOpacity: DEAD_OP,
  stackLayers: 3,
  ruleOpacity: INK_CONTEXT,
});

const FADE_LEVELS = 4;
/** the highlight: a warm near-white, visibly brighter than the orange line, no glow */
const SHIMMER = "#FFF3D2";
const SHIMMER_SEGS = [
  [120, 0.45],
  [66, 0.75],
  [28, 1],
] as const;

/** a plot: its rule with an engraved end tick at each end (one path, so the joints never double up) */
const plotD = (x0: number, x1: number, y: number) =>
  `M${x0},${y - TICK_HALF}L${x0},${y + TICK_HALF}M${x0},${y}L${x1},${y}M${x1},${y - TICK_HALF}L${x1},${y + TICK_HALF}`;
const HEAP_PLOT_D = plotD(HEAP_PLOT.x0, HEAP_PLOT.x1, GROUND_Y);
const EMPTY_PLOT_D = plotD(PLOT.x0, PLOT.x1, GROUND_Y);

const KdRatioOfInfinity: React.FC<Props> = ({ vignette, deadOpacity, stackLayers, ruleOpacity }) => {
  const frame = useCurrentFrame();
  const fi = Math.min(LAST, Math.max(0, Math.round(frame)));
  const cam = swayCam(CAM_TRACK[fi], frame);
  const k = cam.k;

  // ---- the dead: rested (interleaved stack layers) and falling (by fade) ----
  const rest: number[][] = Array.from({ length: stackLayers }, () => []);
  const fall: number[][] = Array.from({ length: FADE_LEVELS }, () => []);
  for (let i = 0; i < MARKS.length; i++) {
    const p = markAt(MARKS[i], frame);
    if (!p) continue;
    if (p.op >= 0.999) rest[i % stackLayers].push(p.x, p.y);
    else fall[Math.min(FADE_LEVELS - 1, Math.floor(p.op * FADE_LEVELS))].push(p.x, p.y);
  }
  const rPx = MARK_R * k;
  const layers: DotLayer[] = [
    ...rest.map((xy) => ({ xy, r: rPx, color: INK, opacity: deadOpacity })),
    ...fall.map((xy, b) => ({ xy, r: rPx, color: INK, opacity: (deadOpacity * (b + 0.5)) / FADE_LEVELS })),
  ];

  // ---- the ratio sign ----
  const ot = orangeT(frame);
  const ink = mixColor(INK, ACCENT, ot);
  const inkOp = INK_FULL + (1 - INK_FULL) * ot;
  const drawing = frame >= T.draw[0] && frame < T.draw[1];
  const drawn = frame >= T.draw[1];
  const live = drawing ? drawingInk(frame) : null;
  const inkD = live ? live.d : drawn ? INF_D : "";
  const inkFade = live ? live.op : 1;
  const ent = colonEntrance(frame);
  const pens = pensAt(frame);
  const pr = penR(frame);
  const penDy = ent.dy / k;
  const sh = shimmerAt(frame);

  return (
    <PlanPage cam={cam} vignette={vignette}>
      {/* the ground: two equal plots, each a rule with engraved end ticks: cream under the heap, the empty one orange */}
      <WorldSvg cam={cam}>
        <g fill="none" strokeLinecap="butt" strokeLinejoin="miter">
          <path d={HEAP_PLOT_D} stroke={DARK} strokeOpacity={0.6} strokeWidth={RULE_W + RULE_CASE} />
          <path d={EMPTY_PLOT_D} stroke={DARK} strokeOpacity={0.6} strokeWidth={RULE_W_ORANGE + RULE_CASE} />
          <path d={HEAP_PLOT_D} stroke={INK} strokeOpacity={ruleOpacity} strokeWidth={RULE_W} />
          <path d={EMPTY_PLOT_D} stroke={ACCENT} strokeWidth={RULE_W_ORANGE} />
        </g>
      </WorldSvg>

      {/* the 10,000 dead */}
      <CanvasDots cam={cam} layers={layers} />

      <WorldSvg cam={cam}>
        {/* the infinity: casing first, then the ink */}
        {inkD && inkFade > 0.002 ? (
          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d={inkD} stroke={DARK} strokeOpacity={0.6 * inkFade} strokeWidth={INF_W + INF_CASE} />
            <path d={inkD} stroke={ink} strokeOpacity={inkOp * inkFade} strokeWidth={INF_W} />
          </g>
        ) : null}
        {/* the one ornament: a short bright segment travelling the path */}
        {drawn && sh.amp > 0.01
          ? SHIMMER_SEGS.map(([len, o]) => (
              <path
                key={`sh-${len}`}
                d={INF_D}
                fill="none"
                stroke={SHIMMER}
                strokeOpacity={o * sh.amp}
                strokeWidth={INF_W}
                strokeLinecap="round"
                strokeDasharray={`${len} ${INF_FULL.len - len}`}
                strokeDashoffset={-(sh.s - len / 2)}
              />
            ))
          : null}
        {/* the colon / the two pens */}
        {ent.op > 0.002 && pr > 0.05
          ? [pens.a, pens.b].map(([x, y], i) => (
              <circle
                key={`pen-${i}`}
                cx={x}
                cy={y + penDy}
                r={pr}
                fill={ink}
                fillOpacity={inkOp * ent.op}
                stroke={DARK}
                strokeOpacity={0.65 * ent.op * (pr / PEN_R) * (pr / PEN_R)}
                strokeWidth={2}
              />
            ))
          : null}
      </WorldSvg>

      {/* the counts (screen-sized, anchored to the page) */}
      <NumeralLabel text="10,000" x={HEAP_CX} y={NUM_BASE_Y} cam={cam} frame={frame} f0={T.tenK[0]} size={NUM_PX} frames={T.tenK[1] - T.tenK[0]} fade={10} />
      <NumeralLabel text="0" x={PLOT_CX} y={NUM_BASE_Y} cam={cam} frame={frame} f0={T.zero[0]} size={NUM_PX} frames={T.zero[1] - T.zero[0]} fade={11} />
    </PlanPage>
  );
};

export default KdRatioOfInfinity;
