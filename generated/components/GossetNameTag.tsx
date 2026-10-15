import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { StoutNameTag, TAG_ADV_EM, TAG_IN } from "./stoutShared";

// ---------------------------------------------------------------------------
// GossetNameTag — William Sealy Gosset's name tag over his 1908 portrait
// (Cheeky Pint S4E02, "Will — Guinness invented the t-test", sequence
// 46.880-48.882 s). TRANSPARENT 1080x1920 overlay at 23.976 fps, 64 f
// (the 48 f portrait + a 16 f handle in which the tag stays gone).
//
// THE TAG is stoutShared's StoutNameTag, untouched: cream name strip (TAG 96,
// house title case), amber job strip (TAG_SUB 36, house sentence case), 8 px
// apart, one lifted shadow. Only its placement and its clock are this clip's:
//
// PLACEMENT. The house spot (left 84 / bottom 300) does not work here:
//   - the name strip would sit at y 1420-1548, across the user's second caption
//     band (~1360-1460); so the tag drops to bottom 240: name strip 1480-1608,
//     job strip 1616-1680, clear of both caption bands (1080-1250, 1360-1460)
//     and well below his face (y ~350-1000), over the jacket;
//   - "William Sealy Gosset" is a long name: 992 px of strip at TAG 96, so it
//     is near-centred at left 40 (48 px right margin, the shadow falls right)
//     instead of running 4 px from the right edge at left 84.
//   The name's advance is measured (HarfBuzz, kerned: 9.615 em) and registered
//   in TAG_ADV_EM, as the house tag does for its own names, so the strip fits
//   the type instead of the 0.55 em/char estimate (which overflows the frame).
//
// CLOCK. The house entrance (TAG_IN) settles at f27 and has no exit; a 48 f
// still cannot hold a 27 f entrance plus a 27 f reversed exit. So the SAME
// choreography (cream strip, name, amber strip, job; same distances, same
// ease) runs at 27/7 speed: settled by f7 (visually complete at f6), held,
// then the exit reverses the entrance at the same speed f39-46 (job leaves
// first, the cream strip last); nothing from f46 on.
// ---------------------------------------------------------------------------

export const FPS = 24000 / 1001;
export const STILL_F = 48; // the portrait on screen
export const DURATION = STILL_F + 16; // + handle (tag gone)
export const IN_F = 7; // entrance length (house 27 f, compressed)
export const OUT_END = 46; // exit finished
export const SPEED = TAG_IN.hold / IN_F;

const NAME = "William Sealy Gosset";
// measured advance (em) with hb-shape on public/Sohne-Dreiviertelfett.otf
TAG_ADV_EM[NAME] = 9.615;

export const schema = z.object({
  name: z.string(),
  job: z.string(),
  left: z.number(),
  bottom: z.number(),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ name: NAME, job: "Head brewer, Guinness", left: 40, bottom: 240 });

/** The house tag's own frame for clip frame f: entrance, hold, reversed entrance as the exit. */
export const tagFrame = (f: number) => Math.max(0, Math.min(TAG_IN.hold, f * SPEED, (OUT_END - f) * SPEED));

const GossetNameTag: React.FC<Props> = ({ name, job, left, bottom }) => {
  const frame = useCurrentFrame();
  const t = tagFrame(frame);
  return <AbsoluteFill>{t > 0 ? <StoutNameTag name={name} job={job} left={left} bottom={bottom} frame={t} /> : null}</AbsoluteFill>;
};
export default GossetNameTag;
