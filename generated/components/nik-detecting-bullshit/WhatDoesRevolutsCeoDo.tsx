import React from "react";
import { AbsoluteFill } from "remotion";
import { z } from "zod";
import TitleCardCheekyPint from "../toto-mercedes-job/TitleCardCheekyPint";

/**
 * WhatDoesRevolutsCeoDo — the clip's opening title (the user's "for kise" marker, 0.000-2.544 s of
 * "nik - my job is detecting bullshit", Cheeky Pint S4E06, Nik Storonsky:
 * `title card here saying "What does Revolut's CEO do?"`), in the approved sister-clip look.
 * Check line: a viewer who has just scrolled in knows in one glance what this clip answers: what Revolut's CEO
 * actually does.
 * It IS that title card (TitleCardCheekyPint: name-tag strips, a white strip + ONE amber strip, Söhne
 * Dreiviertelfett, strips slide up one after the other, then a static hold, no outro), with this clip's lines,
 * at the sequence's 23.976 fps. DURATION = 2.544208 s x 24000/1001 = 61 frames. Transparent 1080x1920 overlay;
 * the kit's entrance is timed in frames (last strip settles by ~f26), so the hold runs ~35 frames.
 *
 * Placement: the kit centres its stack at y 1310 (the Toto cards), which puts these strips at y 1162-1458, below the
 * 9:16 keep-in box and across both caption bands. The Nov 13 safe-zone ruling (CRAFT.md Framing: keep-in box
 * x 65-1015, y 290-1070) supersedes that centre, so this wrapper lifts the whole card by LIFT without touching the
 * kit: strips y 757-1053 (centre ~905, soft shadow to ~1068), over Nik's chest, clear of the face and the bands.
 * The stack is ~296 px tall, so the bottom edge (not the ~930 centre target) sets LIFT.
 */

/** px the kit's card is lifted (its centre y 1310 -> ~905) */
const LIFT = 405;

export const FPS = 24000 / 1001;
export const DURATION = 61;

export const schema = z.object({
  lines: z.array(z.object({ text: z.string(), accent: z.boolean() })),
});
export type WhatDoesRevolutsCeoDoProps = z.infer<typeof schema>;
export const defaultProps: WhatDoesRevolutsCeoDoProps = schema.parse({
  lines: [
    { text: "What does", accent: false },
    { text: "Revolut’s CEO do?", accent: true },
  ],
});

const WhatDoesRevolutsCeoDo: React.FC<WhatDoesRevolutsCeoDoProps> = ({ lines }) => (
  <AbsoluteFill style={{ transform: `translateY(${-LIFT}px)` }}>
    <TitleCardCheekyPint lines={lines} backdrop={false} />
  </AbsoluteFill>
);

export default WhatDoesRevolutsCeoDo;
