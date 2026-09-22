import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/google-fonts/RobotoCondensed";
import { z } from "zod";
import {
  ACCENT,
  BG_BASE,
  BG_DIM,
  CAM_LIFT,
  GridBackground,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  camMove,
  clamp01,
  runCamera,
  smoothstep,
  worldTransform,
} from "./fieldShared";

// ---------------------------------------------------------------------------
// ALIGNMENT DEFINITION — a dictionary card for "AI ALIGNMENT", held on screen
// for a few seconds in an alignment clip so a viewer who does not know the term
// gets one. It is Orange Dwarkesh (`fieldShared` grid, BG_DIM over BG_BASE,
// Vignette, `camMove`/`runCamera` camera, ACCENT dot) rather than an Urban
// Dictionary pastiche: no mustard, no thumbs, no author line, no box.
//
// THE WHOLE PIECE IS FOUR ELEMENTS in one left-aligned column:
//   1. the clip's own AI dot (solid ACCENT, r 16) at the column's left edge,
//      centred on the term's CAP HEIGHT, not on its line box;
//   2. the term, Roboto Condensed 700 caps;
//   3. "NOUN", the set's label style exactly (700 caps, 40 px, 0.04 em, 0.55);
//   4. a rule the width of the column, then the definition in Roboto Condensed
//      400 SENTENCE CASE — caps are for labels; a sentence set in caps is not
//      readable at the speed this card is on screen.
// Nothing else. Every temptation (pronunciation, example sentence, a card
// outline) was left out on purpose: the card is the column, not a box.
//
// MOTION is one shape used five times: slide up 24 screen px while fading 0->1
// over 12 frames, the SLIDE on an ease-out cubic and the FADE on a smoothstep
// (an ease-out cubic reaches 0.23 on its first frame, which is the one-frame
// pop the standard exists to prevent). The dot scales in f0-10, the term
// f4-16, "NOUN" f12-24, the rule draws left->right f16-26, and the definition
// writes itself one word at a time from f22, two frames apart in reading
// order, so the last word lands at f54. From f56 the state is RESOLVED and
// held to the last frame — the editor trims the tail, so there is no fade out.
//
// The hold is not static: the camera creeps k 1.00 -> 1.04 across all 168
// frames (warp 0.55 — nearly linear, zero slope at both ends so the damper
// never sees a step) and the grid rides it at 0.15 parallax with its own
// constant drift.
// ---------------------------------------------------------------------------

export const FPS = 24;
export const DURATION = 168; // 7.0 s: resolved by f56, then held

const FONT = loadFont("normal", { weights: ["400", "700"], subsets: ["latin"] });
const FONT_FAMILY = FONT.fontFamily;

// --- THE COLUMN -------------------------------------------------------------
// The brief's column is screen x 110..970. The camera creeps to k 1.04 about
// cx 540, so a WORLD column of 110..970 would be at screen 92.8..987.2 on the
// last frame — outside the margin the rule is there to protect. The world
// column is therefore the span that maps ONTO 110..970 at the widest k the
// piece ever reaches: 540 +- (540 - 110) / 1.04 = 126.54 .. 953.46, rounded in
// to 127 .. 953. At k 1.00 it sits at 127..953 and at k 1.04 at 110.1..969.9,
// so the margin holds on every frame instead of only the first.
const K_MAX = 1.04;
const SAFE = 110;
const CX = 540;
const COL_X0 = Math.ceil(CX - (CX - SAFE) / K_MAX); // 127
const COL_X1 = Math.floor(CX + (CX - SAFE) / K_MAX); // 953
const COL_W = COL_X1 - COL_X0; // 826

// --- TYPE -------------------------------------------------------------------
// Roboto Condensed's vertical metrics (unitsPerEm 2048, hhea ascent 1900,
// descent 500, cap height 1456), as ems. They are here so the block can be
// centred on its INK rather than on its line boxes: a 116 px line box carries
// 15 px of leading above the caps and a definition whose last line has no
// descenders carries ~17 px of empty below the baseline, and centring the
// boxes would sit the visible block 16 px low.
const ASC = 1900 / 2048;
const CONTENT_EM = (1900 + 500) / 2048;
const CAP_EM = 1456 / 2048;
/** Where the baseline sits inside a line box of this size and line-height. */
const baselineIn = (size: number, lineHeight: number) =>
  size * ((lineHeight - CONTENT_EM) / 2 + ASC);

const TERM_PX = 116; // 124 was tried: "AI ALIGNMENT" overruns the column
const TERM_TRACK = 0.02;
const LABEL_PX = 40; // the set's label size, from alignShared
const LABEL_TRACK = 0.04;
const DEF_PX = 58;
const DEF_LH = 1.32;

const DOT_R = 16;
const DOT_GAP = 44; // from the dot's right edge to the term's left edge
const TERM_X = COL_X0 + 2 * DOT_R + DOT_GAP;

const GAP_TERM_META = 20;
const GAP_META_RULE = 28;
const GAP_RULE_DEF = 36;
const RULE_W = 3;

// The four rows, stacked from the term's box top.
const TERM_BOX_H = TERM_PX; // line-height 1
const META_TOP = TERM_BOX_H + GAP_TERM_META;
const META_BOX_H = LABEL_PX; // line-height 1
const RULE_Y = META_TOP + META_BOX_H + GAP_META_RULE;
const DEF_TOP = RULE_Y + GAP_RULE_DEF;
const DEF_LINE_H = DEF_PX * DEF_LH;

// --- THE INK BLOCK, CENTRED ON y 835 ----------------------------------------
// Top of the ink: the term's cap top, or the dot's top, whichever is higher.
const TERM_BASE = baselineIn(TERM_PX, 1);
const TERM_CAP_TOP = TERM_BASE - CAP_EM * TERM_PX;
const TERM_CAP_MID = TERM_BASE - (CAP_EM * TERM_PX) / 2;
const INK_TOP = Math.min(TERM_CAP_TOP, TERM_CAP_MID - DOT_R);
// Bottom of the ink: the last definition line's baseline. "values and
// standards" has no descender, so the baseline IS the lowest ink.
const INK_BOTTOM = DEF_TOP + 2 * DEF_LINE_H + baselineIn(DEF_PX, DEF_LH);
/** Measured on the delivered f167: the model above puts the ink block's centre
 *  within a pixel of 835, so this stays 0. It is the one dial to turn if the
 *  font's metrics ever move under us. */
const BLOCK_NUDGE_Y = 0;
const BLOCK_TOP = 835 - (INK_TOP + INK_BOTTOM) / 2 + BLOCK_NUDGE_Y;

const CONTENT_CY = 835; // the content centre the camera pins to screen y 835

// --- COPY -------------------------------------------------------------------
// Broken by hand at the column width rather than left to wrap: a greedy break
// gives "... human values / and standards" and ends the card on a two-word
// orphan. These three lines are balanced and each clause survives intact.
const TERM = "AI ALIGNMENT";
const META = "NOUN";
const DEF_LINES = [
  "Ensuring that AI goals and",
  "objectives match human",
  "values and standards",
];
const DEF_WORDS = DEF_LINES.map((l) => l.split(" "));

// --- MOTION -----------------------------------------------------------------
const ENTER_F = 12;
const RISE = 24; // screen px
const easeOutCubic = (u: number) => 1 - Math.pow(1 - clamp01(u), 3);

const DOT_F0 = 0;
const DOT_F1 = 10;
const TERM_F0 = 4;
const META_F0 = 12;
const RULE_F0 = 16;
const RULE_F1 = 26;
const DEF_F0 = 22;
const DEF_STAGGER = 2;

/** The standard entrance: `rise` in SCREEN px (so it is divided by k where it
 *  is used inside the world), `o` the fade. */
const enter = (frame: number, f0: number) => {
  const u = clamp01((frame - f0) / ENTER_F);
  return { o: smoothstep(u), rise: (1 - easeOutCubic(u)) * RISE };
};

// --- THE CAMERA -------------------------------------------------------------
// One move, the whole piece: a creep that never reads as a move but leaves no
// frame identical to the one before it.
//
// THE EASE RUNS PAST THE LAST FRAME ON PURPOSE. A `camMove` that lands on
// f167 has zero slope there, which is right for a move that settles onto a
// word and wrong for the only motion in a five-second hold: measured on the
// transparent variant, the last frames of that version changed SEVEN pixels
// between them — a dead stretch exactly where the card is doing nothing else.
// So the ease is authored over 2x the duration and the piece only ever sees
// its first half, which is the near-constant-rate part. `K_END` is still
// reached exactly on f167: the damper is linear in (k1 - k0), so one probe
// pass at k1 = 2 gives the gain A = k(167) - 1 and the real k1 is solved from
// it rather than guessed. The creep is therefore still running on the last
// frame at ~1.6e-4 /frame, about 0.06 screen px at the block's outer edge.
const CAM_SPAN = 2 * DURATION;
const camTrack = (k1: number) =>
  camMove({ f0: 0, f1: CAM_SPAN, k0: 1.0, k1, c0: CONTENT_CY, c1: CONTENT_CY, warp: 0.55 });
const K_END = 1.04;
const PROBE = camTrack(2);
const CAM_GAIN = runCamera(DURATION - 1, PROBE.F, PROBE.CY, PROBE.K).k - 1;
const CAM = camTrack(1 + (K_END - 1) / CAM_GAIN);
// The column's margins are solved against K_MAX, so the creep may never pass
// it. It is monotone and lands on K_END, but say so rather than assume it.
const K_LAST = runCamera(DURATION - 1, CAM.F, CAM.CY, CAM.K).k;
if (Math.abs(K_LAST - K_END) > 1e-6 || K_LAST > K_MAX + 1e-9) {
  throw new Error(`AlignmentDefinition: camera lands at k ${K_LAST}, expected ${K_END}`);
}
const CY_REST = CONTENT_CY + CAM_LIFT / 1.0;

export const schema = z.object({
  transparent: z.boolean(),
  term: z.string(),
  meta: z.string(),
});

export const defaultProps = schema.parse({
  transparent: false,
  term: TERM,
  meta: META,
});

const AlignmentDefinition: React.FC<z.infer<typeof schema>> = ({
  transparent,
  term,
  meta,
}) => {
  const frame = useCurrentFrame();
  const { cy, k } = runCamera(frame, CAM.F, CAM.CY, CAM.K);
  const { tx, ty } = worldTransform(CX, cy, k);

  const dotS = easeOutCubic(clamp01((frame - DOT_F0) / (DOT_F1 - DOT_F0)));
  const termIn = enter(frame, TERM_F0);
  const metaIn = enter(frame, META_F0);
  const ruleT = easeOutCubic(clamp01((frame - RULE_F0) / (RULE_F1 - RULE_F0)));

  // One shadow on the whole card group. Over the grid it is the set's global
  // shadow; over arbitrary footage it is the Dwarkesh overlay shadow, which is
  // heavier because the footage underneath can be any value. Both are SCREEN
  // px, so both are divided by the live k.
  const shadow = transparent
    ? `drop-shadow(0 ${(2 / k).toFixed(3)}px ${(6 / k).toFixed(3)}px rgba(0,0,0,0.28))`
    : `drop-shadow(0 ${(SHADOW_Y / k).toFixed(3)}px ${(SHADOW_BLUR / k).toFixed(
        3,
      )}px rgba(0,0,0,${SHADOW_OPACITY}))`;

  const ruleY = Math.round(BLOCK_TOP + RULE_Y) + 0.5;

  let wordIndex = 0;

  return (
    <AbsoluteFill
      style={{ backgroundColor: transparent ? "transparent" : BG_BASE }}
    >
      {transparent ? null : (
        <GridBackground
          src="grid-background.jpg"
          blur={13}
          dim={BG_DIM}
          frame={frame}
          cy={cy}
          cyRest={CY_REST}
          k={k}
          parallax={0.15}
        />
      )}

      <AbsoluteFill
        style={{
          transform: `translate(${tx.toFixed(3)}px, ${ty.toFixed(3)}px) scale(${k.toFixed(5)})`,
          transformOrigin: "0 0",
        }}
      >
        <div style={{ position: "absolute", left: 0, top: 0, filter: shadow }}>
          {/* The dot and the rule: SVG, so the rule can be snapped to a half
              pixel with an odd stroke and the dot is a true circle. */}
          <svg
            width={1080}
            height={1920}
            viewBox="0 0 1080 1920"
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          >
            {dotS > 0 ? (
              <circle
                cx={COL_X0 + DOT_R}
                cy={BLOCK_TOP + TERM_CAP_MID}
                r={DOT_R * dotS}
                fill={ACCENT}
              />
            ) : null}
            {ruleT > 0 ? (
              <line
                x1={COL_X0}
                x2={COL_X0 + COL_W * ruleT}
                y1={ruleY}
                y2={ruleY}
                stroke="#FFFFFF"
                strokeWidth={RULE_W}
                opacity={0.3}
              />
            ) : null}
          </svg>

          {/* The term. */}
          <div
            style={{
              position: "absolute",
              left: TERM_X,
              top: BLOCK_TOP + termIn.rise / k,
              fontFamily: FONT_FAMILY,
              fontWeight: 700,
              fontSize: TERM_PX,
              lineHeight: 1,
              textTransform: "uppercase",
              letterSpacing: `${TERM_TRACK}em`,
              marginRight: `${-TERM_TRACK}em`,
              color: "#FFFFFF",
              opacity: termIn.o,
              whiteSpace: "nowrap",
            }}
          >
            {term}
          </div>

          {/* The meta line, in the set's label style exactly. */}
          <div
            style={{
              position: "absolute",
              left: TERM_X,
              top: BLOCK_TOP + META_TOP + metaIn.rise / k,
              fontFamily: FONT_FAMILY,
              fontWeight: 700,
              fontSize: LABEL_PX,
              lineHeight: 1,
              textTransform: "uppercase",
              letterSpacing: `${LABEL_TRACK}em`,
              marginRight: `${-LABEL_TRACK}em`,
              color: "#FFFFFF",
              opacity: 0.55 * metaIn.o,
              whiteSpace: "nowrap",
            }}
          >
            {meta}
          </div>

          {/* The definition, one word at a time. */}
          <div
            style={{
              position: "absolute",
              left: TERM_X,
              top: BLOCK_TOP + DEF_TOP,
              width: COL_W,
              fontFamily: FONT_FAMILY,
              fontWeight: 400,
              fontSize: DEF_PX,
              lineHeight: DEF_LH,
              color: "#FFFFFF",
              whiteSpace: "nowrap",
            }}
          >
            {DEF_WORDS.map((words, li) => (
              <div key={li} style={{ height: DEF_LINE_H }}>
                {words.map((w, wi) => {
                  const e = enter(frame, DEF_F0 + DEF_STAGGER * wordIndex++);
                  return (
                    <React.Fragment key={wi}>
                      <span
                        style={{
                          display: "inline-block",
                          opacity: 0.92 * e.o,
                          transform: `translateY(${(e.rise / k).toFixed(3)}px)`,
                        }}
                      >
                        {w}
                      </span>
                      {wi < words.length - 1 ? " " : null}
                    </React.Fragment>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </AbsoluteFill>

      {transparent ? null : <Vignette />}
    </AbsoluteFill>
  );
};

export default AlignmentDefinition;
