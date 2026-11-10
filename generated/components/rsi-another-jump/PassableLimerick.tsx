// ---------------------------------------------------------------------------
// PassableLimerick (rsi-another-jump, cut 2). Dwarkesh style (styles/dwarkesh.md).
// Opaque 1080x1920, 23.976 fps, 82 frames.
//
// CHECK LINE: "in 2022 the whole output of GPT-3.5 was a five-line limerick and one line finishing a Python
// function the person had started — small, and that was it." (the brief's wording, adapted to the v2 code card)
//
// THE LINE (the clip opens on the speaker saying "GPT-3.5 was able to" just before):
//   "write a passable limerick and autocomplete a trivial Python function, but [otherwise it was mostly a
//    useless toy]" (the bracket is on the speaker).
// WORD -> FRAME (from this cut's f0): write 0 · a 7 · passable 10 · limerick 17 · and 27 · autocomplete 39 ·
//   a 52 · trivial 54 · Python 58 · function 65 · but 79.
// DURATION: the slot 2.044 -> 5.464 s = 3.420 s x 23.976 = 82 frames (sequence f49 -> f131; f0..f81).
//
// V2, on the user's note "slightly too abstract, especially with the Python thing, it's a bit hard to follow":
// real, readable text instead of word-bars (the note overrides the style's code-as-bars rule).
//
// THE MOTION: GPT-3.5's card (white squircle, the OpenAI mark in ACCENT_DEEP, a white GPT-3.5 label) is there at
// f0 with its orange caret. At ONE steady token rate (0.968 f a word) the caret streams an original limerick in
// orange Roboto Condensed, AABBA, lines 3-4 set in: lines 1-4 up by f22 (across "limerick" f17), line 5 done
// f31. A small code-editor card (white Python mark, PYTHON label, JetBrains Mono) slides up into place below it
// f30-39 with the person's white `def is_even(n):` already typed and their white cursor one indent in. On
// "autocomplete" (f39) GPT-3.5's ghost completion `return n % 2 == 0` streams in after the cursor in deep orange
// at the same token rate (done f45); on "Python" (f58) the person takes it: the cursor jumps to the line's end and
// the ghost ripens to solid ACCENT by f64. The camera opens close (k 1.30, the limerick card's sides off frame)
// and pulls back once (f0-30) to both cards, then holds alive (a creep toward k 0.985, sway, grid drift) to f81.
// No fade. Orange = the AI, nothing else; white = people and what they build.
//
// SHARED WORLD: everything is in `outputShared.tsx` (the V2 section): `OutputScene2022` draws this picture in
// world space for any frame, and cut 7 opens on its resolved state (notes/OUTPUT_READY.md, v2).
//
// SOURCES: the OpenAI mark is brandGlyphs `OPENAI`. The Python mark is Simple Icons `python.svg`
// (simple-icons@13.21.0, jsDelivr, 2026-11-10), verbatim, source kept at assets-src/rsi-another-jump/python.svg.
// The limerick is an original supplied in the director's brief. No figures.
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
  C2_X0,
  C2_X1,
  C2_Y1,
  CODE2_IN0,
  CODE2_RISE,
  F2_PULL1,
  GRID_W0,
  L2_X0,
  L2_X1,
  L2_Y1,
  LIM2_LH,
  OutputScene2022,
  PL2_CY_REST,
  PL2_SHIFT_Y,
  PL_DURATION,
  PL_FPS,
  lim2LineY,
  code2In,
  pl2CamAt,
  pl2ScreenAt,
} from "./outputShared";

export const FPS = PL_FPS;
export const DURATION = PL_DURATION;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// The caption bands, asserted at module load on every frame of the camera path. The lowest things in the
// picture are the cards' bottom edges (the code card's from its entrance on, the limerick card's before it); both
// stay above screen y 1080 + PL2_SHIFT_Y (the code card's including its entrance rise), and every limerick line's
// box too. Since round 3 the whole picture sits PL2_SHIFT_Y lower, so the code card reaches into the first caption
// band, as cuts 15 and 21 do; the second band (1360+) stays clear.
for (let f = 0; f < DURATION; f++) {
  const limBot = pl2ScreenAt(f, L2_X0, L2_Y1).y;
  const codeBot = pl2ScreenAt(f, C2_X0, C2_Y1 + CODE2_RISE * (1 - code2In(f))).y;
  const lineBot = pl2ScreenAt(f, L2_X0, lim2LineY(4) + LIM2_LH).y;
  const bot = f >= CODE2_IN0 ? Math.max(limBot, codeBot) : Math.max(lineBot, limBot);
  if (bot > 1080 + PL2_SHIFT_Y) throw new Error(`PassableLimerick f${f}: lowest edge at screen y ${bot.toFixed(1)}`);
  if (f >= CODE2_IN0) {
    const l = pl2ScreenAt(f, C2_X0, C2_Y1).x;
    const r = pl2ScreenAt(f, C2_X1, C2_Y1).x;
    if (l < 20 || r > 1060) throw new Error(`PassableLimerick f${f}: code card at x ${l.toFixed(1)}-${r.toFixed(1)}`);
  }
}
// The limerick card's side edges are fully off frame on the close open and fully in it once the pull-back has
// landed: never a parked sliver (they cross the frame edge only while the camera is moving).
for (const f of [0, ...Array.from({ length: DURATION - F2_PULL1 }, (_, i) => F2_PULL1 + i)]) {
  const r = pl2ScreenAt(f, L2_X1, L2_Y1).x;
  if (r > 1056 && r < 1084) throw new Error(`PassableLimerick f${f}: limerick card edge is a sliver at x ${r.toFixed(1)}`);
}

const PassableLimerick: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const { cx, cy, k } = pl2CamAt(frame);
  const { tx, ty } = worldTransform(cx, cy, k);
  return (
    <AbsoluteFill style={{ backgroundColor: BG_BASE }}>
      <GridBackground
        src="grid-background.jpg"
        blur={13}
        dim={BG_DIM}
        frame={GRID_W0 + frame}
        cy={cy}
        cyRest={PL2_CY_REST}
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
            transform: `translate(${tx}px, ${ty + PL2_SHIFT_Y}px) scale(${k})`,
          }}
        >
          <OutputScene2022 frame={frame} k={k} />
        </div>
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

export default PassableLimerick;
