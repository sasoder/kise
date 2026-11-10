// ---------------------------------------------------------------------------
// PassableLimerick (rsi-another-jump, cut 2). Dwarkesh style (styles/dwarkesh.md).
// Opaque 1080x1920, 23.976 fps, 82 frames.
//
// CHECK LINE: "in 2022 the whole output of GPT-3.5 was a five-line limerick and a three-line function the human
// had started — small, and that was it."
//
// THE LINE (the clip opens on the speaker saying "GPT-3.5 was able to" just before):
//   "write a passable limerick and autocomplete a trivial Python function, but [otherwise it was mostly a
//    useless toy]" (the bracket is on the speaker).
// WORD -> FRAME (from this cut's f0): write 0 · a 7 · passable 10 · limerick 17 · and 27 · autocomplete 39 ·
//   a 52 · trivial 54 · Python 58 · function 65 · but 79.
// DURATION: the slot 2.044 -> 5.464 s = 3.420 s x 23.976 = 82 frames (sequence f49 -> f131; f0..f81).
//
// THE MOTION: one small 2022 output card, written by GPT-3.5's caret, then settled. The card (white squircle),
// the OpenAI mark in ACCENT_DEEP with a white GPT-3.5 label, and a white `def` line a person typed are there at
// f0. GPT-3.5 writes at ONE steady, unhurried token rate (0.81 frames a word-bar, a line return the same) for
// the whole card: the limerick f1-31 in its real AABBA shape (8, 8, 4, 4, 9 words; lines 1-4 whole by f23, so
// the long-long-short-short shape is up across "limerick" f17-24), a pause, the caret jumps under the `def` line
// at f35 (as at every line return), and from f38 ("autocomplete" f39) it writes the function's two indented
// orange body lines at the same rate, done f43. The camera opens close (k 1.55) and pulls back once (f0-58) to
// the whole card, which then lives (caret at rest, a slow pull-back creep toward k 0.985, sway, grid drift) to
// f81. Nothing else arrives; no fade.
// Orange = the AI, nothing else; white = people and what they build.
//
// SHARED WORLD: every constant, the layout, the schedule and the camera are in `outputShared.tsx`, which cut 7
// imports to open on this cut's resolved card (notes/OUTPUT_READY.md). This file only composes the frame.
//
// SOURCES: the OpenAI mark is brandGlyphs `OPENAI` (Simple Icons path, provenance in brandGlyphs.tsx). The
// limerick and the function are drawn as word-bars, so no text is reproduced. No figures.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  BG_BASE,
  BG_DIM,
  GridBackground,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  worldTransform,
} from "../kits/dwarkesh/fieldShared";
import {
  GRID_W0,
  OutputCard2022,
  PL_CY_REST,
  PL_DURATION,
  PL_FPS,
  plCamAt,
  plScreenAt,
  CARD_X0,
  CARD_X1,
  CARD_Y0,
  CARD_Y1,
} from "./outputShared";

export const FPS = PL_FPS;
export const DURATION = PL_DURATION;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// The caption bands, asserted at module load on every frame of the camera path: the card's bottom edge (the
// lowest thing in the picture) stays above screen y 1080, and the card never leaves the frame's width.
for (let f = 0; f < DURATION; f++) {
  const bot = plScreenAt(f, CARD_X0, CARD_Y1).y;
  const top = plScreenAt(f, CARD_X0, CARD_Y0).y;
  const l = plScreenAt(f, CARD_X0, CARD_Y0).x;
  const r = plScreenAt(f, CARD_X1, CARD_Y0).x;
  if (bot > 1080 || top < 0 || l < 20 || r > 1060) {
    throw new Error(`PassableLimerick f${f}: card at x ${l.toFixed(1)}-${r.toFixed(1)}, y ${top.toFixed(1)}-${bot.toFixed(1)}`);
  }
}

const PassableLimerick: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const { cx, cy, k } = plCamAt(frame);
  const { tx, ty } = worldTransform(cx, cy, k);
  return (
    <AbsoluteFill style={{ backgroundColor: BG_BASE }}>
      <GridBackground
        src="grid-background.jpg"
        blur={13}
        dim={BG_DIM}
        frame={GRID_W0 + frame}
        cy={cy}
        cyRest={PL_CY_REST}
        k={k}
        parallax={0.15}
      />
      <AbsoluteFill style={{ filter: `drop-shadow(0 ${SHADOW_Y}px ${SHADOW_BLUR}px rgba(0,0,0,${SHADOW_OPACITY}))` }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 1080,
            height: 1920,
            transformOrigin: "0 0",
            transform: `translate(${tx}px, ${ty}px) scale(${k})`,
          }}
        >
          <OutputCard2022 frame={frame} k={k} />
        </div>
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

export default PassableLimerick;
