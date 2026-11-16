// ---------------------------------------------------------------------------
// SkyrootNewsPortrait (skyroot-trailer, news card A as a video: 7.549-9.384 s, after 4_FirstPrivateToOrbit).
// Core memory podcast style (styles/core-memory.md). Opaque 2048x1080, 23.976 fps, 44 frames, rendered --scale 2.
//
// CHECK LINE: the launch the speaker mentions was real news: India's first private-sector orbital rocket, July 2026,
// and the card points at the words that say so.
//
// THE LINE (Skyroot, not typeset, the captions carry it): "It was just like 45 days ago."
// WORD -> FRAME: It 0 · was 3 · just 6 · like 10 · 45 18 · days 24 · ago 32 · speech ends ~37.
// DURATION: the slot 7.549 -> 9.384 s = 1.835 s x 23.976 = 44 frames (f0..f43).
//
// THE MOTION: the user, Nov 16: "this should be a video, the highlight of the words should get drawn in". From f0 the
// card is NewsCardAljazeeraLaunch's delivered layout-C still (the same props, imported), with LAUNCH OF FIRST
// PRIVATE-SECTOR in plain black like the other lines. The marker draws left to right across that line like a pen
// stroke (SkyrootNewsCard hlDraw: constant speed, a short ease-out): orange f3-16, purple f5-18, blue f7-20, the
// text sting's order two frames apart, landing as the still's stepped stack; the type turns white exactly where the
// blue has passed (a clip at the blue's edge, no fade). Complete on f20, before "45" lands (f18-24); f20-43 the
// resolved still, alive only by the film life (grain, weave, flicker on its own frame). No creep: the resolved frame
// stays the delivered still. Nothing fades out.
// CHAIN = SKYROOT'S OWN: the highlighted phrase is Skyroot's own launch.
//
// SOURCES: as NewsCardAljazeeraLaunch (Al Jazeera, 18 July 2026, verbatim headline; lead photo R Satish Babu/AFP).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { PHOTO_C, defaultProps as cardProps } from "../skyroot-trailer/NewsCardAljazeeraLaunch";
import SkyrootNewsCard, { hlDraw } from "./SkyrootNewsCardTall";

export const FPS = 24000 / 1001;
export const DURATION = 44;

export const schema = z.object({
  /** the orange layer's first frame; purple and blue follow `stagger` frames apart, each over `travel` frames */
  drawStart: z.number(),
  travel: z.number(),
  stagger: z.number(),
  /** the film life (off only for the pixel check against the still) */
  film: z.boolean(),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ drawStart: 3, travel: 13, stagger: 2, film: true });

const SkyrootNewsPortrait: React.FC<Props> = ({ drawStart, travel, stagger, film }) => {
  const frame = useCurrentFrame();
  const c = cardProps;
  return (
    <SkyrootNewsCard
      layout="C"
      outlet={c.outlet}
      date={c.date}
      headline={c.headlineC}
      highlight={c.highlight}
      hlReveal={hlDraw(frame, drawStart, travel, stagger)}
      frame={frame}
      chain={c.chain}
      rot={c.rot}
      film={film && c.film}
      photo={{ ...PHOTO_C, credit: c.credit, look: c.photoLook }}
    />
  );
};

export default SkyrootNewsPortrait;
