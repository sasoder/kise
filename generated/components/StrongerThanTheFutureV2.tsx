import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  BG_BASE,
  BG_DIM,
  FRAME_H,
  FRAME_W,
  GridBackground,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  camEase,
  clamp01,
  smoothstep,
  worldTransform,
} from "./fieldShared";
import { CARET_H, CARET_LEAD, CARET_W, GAP } from "./punishShared";
import {
  COL_X0,
  FRESH_F,
  GRID_REST,
  GRID_W0,
  INK,
  INK_HI,
  INK_LO,
  LINES,
  WORD_H,
  buildCamTable,
  screenOf,
} from "./incidentSharedV2";

// ---------------------------------------------------------------------------
// Noam_Airgapping, FILM A, cut 4 V2 — `35_StrongerThanTheFuture_V2`
// "while we had chain of thought that was, like, stronger than it's going to be
//  in the future"
// SRT 35.719s -> 38.840s ("historically" onset). DURATION = round(3.121 * 24) + 16
// = 75 + 16 = 91. Global G0 652 (for the grid's drift only).
//
// The user on V1: "this does not at all do a good job of telling the story …
// just have like text being written." So this cut is ONLY text being written:
// the look of cut 1's opening (AprilToAugust f0) — big legible white word-bars
// at k ~1.7, fresh words INK_HI settling to INK_LO over FRESH_F, the solid white
// caret, a continuous smooth scroll with the writing line at screen y ~835.
// No month rail, no labels, no orange, no stations, no NOW line, no breaking-up.
//
// It does NOT sit on the world's clock (the world's post-August text is too
// slow here and time-lapses at G699). It draws the world's own column — the
// SAME `LINES` geometry (lines 37-52, unlabelled paragraphs after AUG, no
// plan-lines among them), the same bar, caret and freshness rules as
// `IncidentWorld` — driven by its OWN steady word clock, shifted up in world y
// by `SHIFT` so the grid's parallax stays small.
//
// GESTURES (the cut is one continuous motion; each with the words it serves):
//  1. f0-91  "while we had chain of thought that was, like, stronger than it's
//            going to be in the future": the caret writes at a steady, lively
//            RATE (0.20 words/f, ~4.8 words a second, 6 lines in the cut —
//            clearly generating the whole time); the page scrolls up at ONE
//            constant speed (~7.5 screen px/f), so each new line enters below and
//            the writing line rides a gentle sawtooth round screen y ~1170
//            (1107-1236) — the page above fills the frame to its top edge.
//  2. f-30-93 one slow continuous creep-in over the whole cut (already moving
//            at f0), k 1.62 -> 1.78 about the writing line, x easing 6 px left
//            with the ragged right edge. Plus fieldShared sway via buildCamTable.
// Nothing else.
// MEASURED (out/airgap-v2/v2t/probe35.ts): scroll |dv| <= 0.03 px/f^2, caret
// <= 51 screen px/f (a drawing tip), lowest ink 1275, column air >= 60 px.
// ---------------------------------------------------------------------------

export const FPS = 24;
export const WIDTH = FRAME_W;
export const HEIGHT = FRAME_H;
export const DURATION = 91;
/** the film's clock at f0 — used only so the grid drift is continuous */
export const G0 = 652;

// --- the page ---------------------------------------------------------------------
/** the first line of the world's column this cut writes on (lines above exist) */
export const LINE0 = 45;
/** first line drawn (the page above the writing line) */
const LINE_TOP = 27;
const LINE_END = 60;
/** world-y shift: line LINE0 is drawn at y 700 */
export const SHIFT = LINES[LINE0].y0 - 700;
const lineTopS = (i: number) => LINES[i].y0 - SHIFT;

// --- the word clock ---------------------------------------------------------------
export const RATE = 0.2; // words / frame (cut 1 opens at 0.165; the future burst is 0.2)
const GI0 = LINES[LINE0].words[0].gi;
/** words emitted at frame f (continuous, and linear back into the past so the
 *  lines above have a history of freshness) */
export const wordsAt = (f: number) => GI0 + 1.4 + RATE * f;
/** the frame word gi finishes (the next word starts) */
const doneAt = (gi: number) => (gi + 1 - (GI0 + 1.4)) / RATE;

const WORDS = LINES.slice(LINE_TOP, LINE_END + 1).flatMap((l) => l.words);
const byGi = new Map(WORDS.map((w) => [w.gi, w]));

/** the head: x (world), line (int), lineF (continuous, for the scroll) */
export const headAt = (f: number) => {
  const w = wordsAt(f);
  const gi = Math.floor(w);
  const wd = byGi.get(gi);
  if (!wd) throw new Error(`StrongerThanTheFutureV2: word ${gi} is outside lines ${LINE_TOP}-${LINE_END}`);
  const g = clamp01(w - gi);
  const l = LINES[wd.line];
  const kIdx = wd.gi - l.words[0].gi;
  // exactly the world's head: the caret crosses the word AND the gap after it,
  // so it never jumps a gap (incidentShared.headAt)
  const span = kIdx < l.words.length - 1 ? wd.w + GAP : wd.w;
  return { x: COL_X0 + wd.x + span * g, line: wd.line, lineF: wd.line + (kIdx + g) / l.words.length };
};
/** the world's growth rule for a bar (IncidentWorld): it grows at the caret's
 *  pace across word + gap, so the bar's end and the caret stay locked */
const grownOf = (W: number, gi: number) => {
  const wd = byGi.get(gi)!;
  const l = LINES[wd.line];
  const spanW = gi - l.words[0].gi < l.words.length - 1 ? wd.w + GAP : wd.w;
  return clamp01(((W - gi) * spanW) / wd.w);
};
const lineTopSF = (t: number) => {
  const i = Math.floor(t);
  return lineTopS(i) + (lineTopS(i + 1) - lineTopS(i)) * (t - i);
};

// --- the camera -----------------------------------------------------------------
/** the text column's centre: text COL_X0 .. ~COL_X0 + 374 (ragged right) */
export const CX = COL_X0 + 192;
const K_A = 1.62;
const K_B = 1.78;
/** the scroll: ONE constant velocity — the least-squares line through the
 *  writing head's y over the cut (+-12 f). The text rises at a steady rate and
 *  each new line enters below; the writing line rides a gentle sawtooth round
 *  WRITE_Y (it climbs as a line is written, drops a pitch at the wrap), which
 *  is what a page being written looks like. A gaussian-smoothed follow was
 *  tried first: it half-chased every wrap (scroll speed wobbling 4-5.3 px/f). */
export const SCROLL = (() => {
  let n = 0, sx = 0, sy = 0, sxx = 0, sxy = 0;
  for (let f = -12; f <= DURATION + 12; f++) {
    const y = lineTopSF(headAt(f).lineF) + WORD_H / 2;
    n++; sx += f; sy += y; sxx += f * f; sxy += f * y;
  }
  const v = (n * sxy - sx * sy) / (n * sxx - sx * sx);
  return { y0: (sy - v * sx) / n, v };
})();
const smoothHeadY = (f: number) => SCROLL.y0 + SCROLL.v * f;
// buildCamTable works in "G"; here G = frame. Content centre = the writing line,
// so it lands at screen y 835. Started 30 f early so f0 is already in motion.
/** screen y of the writing line (the caret). The page above fills the frame
 *  to its top edge, so a writing line at 835 left the lower half empty (the
 *  user's V4 note on this language: "put the writing line at ~1270-1300 when
 *  nothing is below it"); 1200 centres the visible page and keeps the caret
 *  well above the caption band. */
export const WRITE_Y = 1200;
export const CAM = buildCamTable(-30, DURATION + 2, (f) => {
  const u = camEase((f + 30) / (DURATION + 32), 1);
  const k = K_A + (K_B - K_A) * u;
  return { x: CX - 6 * u, y: smoothHeadY(f) - (WRITE_Y - 835) / k, k };
});

// --- proofs -------------------------------------------------------------------------
export const MEASURE = (() => {
  let yMin = 1e9;
  let yMax = -1e9;
  let low = 0;
  for (let f = 0; f < DURATION; f++) {
    const cam = CAM.at(f);
    const h = headAt(f);
    const y = screenOf(cam, 0, lineTopS(h.line) + WORD_H / 2).y;
    yMin = Math.min(yMin, y);
    yMax = Math.max(yMax, y);
    low = Math.max(low, screenOf(cam, 0, lineTopS(h.line) + WORD_H / 2 + CARET_H / 2).y);
    const l = screenOf(cam, COL_X0, 0).x;
    const r = screenOf(cam, COL_X0 + 400, 0).x;
    if (l < 60 || r > FRAME_W - 60) throw new Error(`StrongerThanTheFutureV2: column edge air on f${f}`);
  }
  if (low > 1400) throw new Error(`StrongerThanTheFutureV2: ink at ${low.toFixed(0)}`);
  // the page above must run off the top of the frame on every frame (no top edge)
  for (let f = 0; f < DURATION; f++) {
    const top = screenOf(CAM.at(f), 0, lineTopS(LINE_TOP) + WORD_H).y;
    if (top > -40) throw new Error(`StrongerThanTheFutureV2: page top visible on f${f} (${top.toFixed(0)})`);
  }
  return { writingLineScreenY: [yMin, yMax], lowest: low };
})();

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

const n2 = (v: number) => Number(v.toFixed(2));

const StrongerThanTheFutureV2: React.FC<Props> = () => {
  const f = useCurrentFrame();
  const cam = CAM.at(f);
  const { cx, cy, k } = cam;
  const { tx, ty } = worldTransform(cx, cy, k);
  const W = wordsAt(f);
  const head = headAt(f);
  const bars: React.ReactNode[] = [];
  for (let li = LINE_TOP; li <= head.line; li++) {
    const y0 = lineTopS(li);
    for (const wd of LINES[li].words) {
      const grown = grownOf(W, wd.gi);
      if (grown <= 0.001) continue;
      const w = wd.w * grown;
      if (w < 0.5) continue;
      const fresh = 1 - smoothstep((f - doneAt(wd.gi)) / FRESH_F);
      bars.push(
        <rect
          key={`w${wd.gi}`}
          x={n2(COL_X0 + wd.x)}
          y={n2(y0)}
          width={n2(w)}
          height={WORD_H}
          rx={WORD_H / 2}
          fill={INK}
          opacity={n2(INK_LO + (INK_HI - INK_LO) * fresh)}
        />,
      );
    }
  }
  const caretX = head.x + CARET_LEAD;
  const caretY = lineTopS(head.line) + WORD_H / 2;
  return (
    <AbsoluteFill style={{ backgroundColor: BG_BASE }}>
      <GridBackground
        src="grid-background.jpg"
        blur={13}
        dim={BG_DIM}
        frame={GRID_W0 + G0 + f}
        cy={cy}
        cyRest={GRID_REST.cy}
        cx={cx}
        cxRest={GRID_REST.cx}
        k={k}
        parallax={0.15}
      />
      <AbsoluteFill style={{ filter: `drop-shadow(0 ${SHADOW_Y}px ${SHADOW_BLUR}px rgba(0,0,0,${SHADOW_OPACITY}))` }}>
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
            {bars}
            <rect
              x={n2(caretX - CARET_W / 2)}
              y={n2(caretY - CARET_H / 2)}
              width={CARET_W}
              height={CARET_H}
              rx={CARET_W / 2}
              fill={INK}
            />
          </svg>
        </div>
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

export default StrongerThanTheFutureV2;
