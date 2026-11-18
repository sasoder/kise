// ---------------------------------------------------------------------------
// WhatIfGptTen (paul-hugging-face, cut 0): the clip's opening title, ROUND 2 (notes/REV2.md, section T). The user:
// "it should be more like the title cards we do for cheeky pint. so like a L3 kinda thing — but adjusted to the
// dwarkesh style". So: NOT a 3D scene (round 1, commit f06d317) but a strip title over the talking head, on the
// mechanics of generated/components/toto-mercedes-job/TitleCardCheekyPint.tsx (as used in
// nik-detecting-bullshit/WhatDoesRevolutsCeoDo.tsx), copied into a look-C (Dwarkesh graphite) variant here; the
// Cheeky Pint file is untouched. TRANSPARENT 1080x1920 overlay, 23.976 fps, 59 frames.
//
// CHECK LINE: "This part asks what the Hugging Face hack would look like if a far stronger AI (GPT-10) did it."
//
// THE LINE: "Take the Hugging Face incident and scale it up to GPT-10 and ask"
// WORD -> FRAME: Hugging 7 · Face 11 · incident 12 · and 20 · scale 25 · it 31 · up 34 · to 37 · GPT 38 · -10 47 ·
//   and 52 · ask 59 (out)
// DURATION: the slot 0.000 -> 2.461 s x 23.976 = 59 frames (f0..f58).
//
// THE TITLE (sentence case): "What if GPT-10 / did the Hugging / Face hack? [HF mark]" as three rows of strips; the
// first row is two strips side by side, a graphite "What if" and the ONE accent strip "GPT-10" (flat #FFB000, dark
// warm-brown ink), so the stack stays three strips tall and clear of the face. Graphite strips = the hero plate's
// dark warm graphite (slightly translucent) with cream Roboto Condensed 700 (the clip's label face, hfWorld FONT), a
// faint static grain, the Cheeky Pint tile shadow. The Hugging Face mark (its real yellow face, hfWorld HFMark) ends
// the last strip. Cap height ~92 px (font 124 px); the widest strip row ~845 px.
//
// THE MOTION (round 3, the user: "it should come in a lot faster ... from the first, maybe three frames, you should be
// able to see the entire text"): a quick snap of the name tag's entrance. Each strip and its line rise 20 px together
// over 2.5 f (ease bezier(0.16, 1, 0.3, 1)) while the opacity reaches 1 in 1.5 f (cubic ease-out); the strips follow
// each other 0.75 f apart in reading order ("What if" from f-0.75, "GPT-10" f0, "did the Hugging" f0.75, "Face hack?"
// f1.5). So f0 is already partly in, the whole title reads by f2-3 (every strip opaque by f3), the last motion ends at
// f4, and f4-f58 is a static hold: no outro, no idle motion.
//
// PLACEMENT: one centred column, stack centred at CENTER_Y over the chest (the user: graphics "down a bit like we
// usually do"); checked over notes/title_backdrop_f29.png so the top strip stays below the beard.
//
// SOURCES: the title is the user's; the HF mark from kits/dwarkesh/brandGlyphs (via hfWorld HFMark).
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import { TILE_SHADOW } from "../kits/cheeky-pint/d1Shared";
import { ACCENT, FONT, GRAPHITE, HFMark } from "./hfWorld";

export const FPS = 24000 / 1001;
export const DURATION = 59;

const Strip = z.object({ text: z.string(), accent: z.boolean(), hf: z.boolean() });
export const schema = z.object({
  /** rows of strips, top to bottom; strips in a row sit side by side */
  rows: z.array(z.array(Strip)),
});
export type WhatIfGptTenProps = z.infer<typeof schema>;
export const defaultProps: WhatIfGptTenProps = schema.parse({
  rows: [
    [
      { text: "What if", accent: false, hf: false },
      { text: "GPT-10", accent: true, hf: false },
    ],
    [{ text: "did the Hugging", accent: false, hf: false }],
    [{ text: "Face hack?", accent: false, hf: true }],
  ],
});

// ---- layout ----
export const CENTER_Y = 1160;
const TITLE_PX = 124;
const GAP = 10;
const RADIUS = 2;
const PAD = "12px 30px 20px 30px";

// ---- look C material ----
const STRIP_BG = "linear-gradient(180deg, rgba(78,75,71,0.94) 0%, rgba(58,55,52,0.94) 100%)";
const STRIP_INK = GRAPHITE.cream;
const ACCENT_INK = "#2A1C0F";
const TILE_FILTER = TILE_SHADOW(1);
/** a faint static grain over each strip (feTurbulence, as a data URI so it never races frame capture) */
const GRAIN = `url("data:image/svg+xml;utf8,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' seed='7' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 1.1 -0.3'/></filter><rect width='240' height='240' filter='url(%23n)'/></svg>",
).replace(/%2523/g, "%23")}")`;

// ---- the name tag's entrance (TitleCardCheekyPint's mechanics) ----
const EASE = Easing.bezier(0.16, 1, 0.3, 1);
const progress = (frame: number, start: number, travel: number) =>
  interpolate(frame, [start, start + travel], [0, 1], { easing: EASE, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const fadeIn = (frame: number, start: number, travel: number) =>
  interpolate(frame, [start, start + travel], [0, 1], { easing: Easing.out(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const STAGGER = 0.75;
const FIRST = -0.75;
const RISE_TRAVEL = 2.5;
const FADE_TRAVEL = 1.5;
const RISE = 20;
/** the k-th strip in reading order starts at FIRST + k * STAGGER */
const startOf = (k: number) => FIRST + k * STAGGER;

const TitleStrip: React.FC<{ text: string; accent: boolean; hf: boolean; start: number }> = ({ text, accent, hf, start }) => {
  const frame = useCurrentFrame();
  // strip and line move as one: the rise eases out over RISE_TRAVEL, the opacity is full after FADE_TRAVEL
  const rise = (1 - progress(frame, start, RISE_TRAVEL)) * RISE;
  const op = fadeIn(frame, start, FADE_TRAVEL);
  const ink = accent ? ACCENT_INK : STRIP_INK;
  const mark = TITLE_PX * 0.86;
  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: accent ? ACCENT : STRIP_BG,
          borderRadius: RADIUS,
          filter: TILE_FILTER,
          opacity: op,
          transform: `translateY(${rise.toFixed(3)}px)`,
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", inset: 0, backgroundImage: GRAIN, opacity: accent ? 0.05 : 0.09, mixBlendMode: "overlay" }} />
      </div>
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          padding: PAD,
          fontFamily: FONT,
          fontWeight: 700,
          fontSize: TITLE_PX,
          lineHeight: 1.0,
          letterSpacing: 0,
          whiteSpace: "nowrap",
          color: ink,
          opacity: op,
          transform: `translateY(${rise.toFixed(3)}px)`,
        }}
      >
        {text}
        {hf ? (
          <svg width={mark} height={mark} viewBox={`0 0 ${mark} ${mark}`} style={{ marginLeft: TITLE_PX * 0.2, marginTop: TITLE_PX * 0.04, overflow: "visible" }}>
            <HFMark x={mark / 2} y={mark / 2} size={mark} />
          </svg>
        ) : null}
      </div>
    </div>
  );
};

const WhatIfGptTen: React.FC<WhatIfGptTenProps> = ({ rows }) => (
  <AbsoluteFill>
    <div
      style={{
        position: "absolute",
        left: 0,
        width: 1080,
        top: CENTER_Y,
        transform: "translateY(-50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: GAP,
      }}
    >
      {rows.map((row, r) => (
        <div key={r} style={{ display: "flex", flexDirection: "row", gap: GAP }}>
          {row.map((l, i) => (
            <TitleStrip key={i} text={l.text} accent={l.accent} hf={l.hf} start={startOf(rows.slice(0, r).reduce((n, row) => n + row.length, 0) + i)} />
          ))}
        </div>
      ))}
    </div>
  </AbsoluteFill>
);

export default WhatIfGptTen;
