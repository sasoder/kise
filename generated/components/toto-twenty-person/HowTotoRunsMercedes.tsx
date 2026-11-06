import React from "react";
import { z } from "zod";
import TitleCardCheekyPint from "../toto-mercedes-job/TitleCardCheekyPint";

/**
 * HowTotoRunsMercedes — the clip's opening title (the user's "for kise" marker, 0.000-2.160 s:
 * `a textbox saying "How Toto runs Mercedes F1"`), in the same look as the "how he got the Mercedes job" title
 * (user, Nov 6: "the text box should look more like the one we did for how toto got his mercedes job video").
 * It IS that title card (TitleCardCheekyPint: name-tag strips, white strips + one amber strip, Söhne
 * Dreiviertelfett, strips slide up one after the other, then a static hold, no outro), with this clip's lines,
 * at the sequence's 25 fps and the marker's 54 frames. Transparent 1080x1920 overlay.
 */

export const FPS = 25;
export const DURATION = 54;

export const schema = z.object({
  lines: z.array(z.object({ text: z.string(), accent: z.boolean() })),
});
export type HowTotoRunsMercedesProps = z.infer<typeof schema>;
export const defaultProps: HowTotoRunsMercedesProps = schema.parse({
  lines: [
    { text: "How Toto runs", accent: false },
    { text: "Mercedes F1", accent: true },
  ],
});

const HowTotoRunsMercedes: React.FC<HowTotoRunsMercedesProps> = ({ lines }) => (
  <TitleCardCheekyPint lines={lines} backdrop={false} />
);

export default HowTotoRunsMercedes;
