import React from "react";
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
 */

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
  <TitleCardCheekyPint lines={lines} backdrop={false} />
);

export default WhatDoesRevolutsCeoDo;
