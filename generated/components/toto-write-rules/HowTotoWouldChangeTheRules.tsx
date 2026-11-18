import React from "react";
import { z } from "zod";
import TitleCardCheekyPint from "../toto-mercedes-job/TitleCardCheekyPint";

/**
 * HowTotoWouldChangeTheRules — the clip's opening title (the user's "for kise" marker, 0.000-2.040 s:
 * `text box that says "How Toto would change the F1 rules"`), in the same look as the sister clip's title
 * (toto-twenty-person/HowTotoRunsMercedes) and the "how he got the Mercedes job" title.
 * It IS that title card (TitleCardCheekyPint: name-tag strips, white strip + one amber strip, Söhne
 * Dreiviertelfett, strips slide up one after the other, then a static hold, no outro), with this clip's lines,
 * at the sequence's 25 fps. Transparent 1080x1920 overlay.
 *
 * Check: both strips inside the keep-in x 65-1015 at full width. "How Toto would change" / "the F1 rules" put the
 * first strip at x 10-1069 (too wide), so per the brief it splits as "How Toto would" (x 173-906) / "change the
 * F1 rules" (amber, x 104-975); strips span y 1162-1458 at the hold, the sister title's placement.
 * Line: the title text from the marker; no speech is timed to it.
 * DURATION: the marker's 2.040 s x 25 fps = 51 frames.
 * Motion: strip 1 slides up 64 px and fades in over 20 f from f0, its text 3 f behind; strip 2 (amber) the same
 * from f6; static hold to f50. No real figures.
 */

export const FPS = 25;
export const DURATION = 51;

export const schema = z.object({
  lines: z.array(z.object({ text: z.string(), accent: z.boolean() })),
});
export type HowTotoWouldChangeTheRulesProps = z.infer<typeof schema>;
export const defaultProps: HowTotoWouldChangeTheRulesProps = schema.parse({
  lines: [
    { text: "How Toto would", accent: false },
    { text: "change the F1 rules", accent: true },
  ],
});

const HowTotoWouldChangeTheRules: React.FC<HowTotoWouldChangeTheRulesProps> = ({ lines }) => (
  <TitleCardCheekyPint lines={lines} backdrop={false} />
);

export default HowTotoWouldChangeTheRules;
