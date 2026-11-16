// ---------------------------------------------------------------------------
// NewsCardTechCrunchUnicornAnim (skyroot-trailer, news card B as a video, the ALT to the delivered still: 9.384-15.349
// s, the red-labelled clip, directly after NewsCardAljazeeraLaunchAnim). Core memory podcast style. Opaque 2048x1080,
// 23.976 fps, 143 frames, rendered --scale 2. Delivered to graphics/alt/ for the user to swap in; the default card B
// (NewsCardTechCrunchUnicorn, layout A) is untouched.
//
// CHECK LINE: the money the host asks about is real and public: Skyroot became India's first spacetech unicorn.
//
// THE LINE (not typeset): Host: "Have you raised $100 million to date?" Skyroot: "We've raised close to $155 million."
// "$155 million." WORD -> FRAME: none used (the draw-on runs on card A's timing so the pair matches).
// DURATION: the slot 9.384 -> 15.349 s = 5.965 s x 23.976 = 143 frames (f0..f142).
//
// THE MOTION: the pair of card A's draw-on: NewsCardTechCrunchUnicorn's layout C (the TechCrunch article's own props,
// imported), INDIA'S FIRST SPACE TECH UNICORN starting in plain black; the marker draws left to right on f3-20
// (orange f3-16, purple f5-18, blue f7-20), the type turning white behind the blue's edge; then the resolved card,
// alive by the film life only, to the cut.
// CHAIN = SKYROOT'S OWN: the highlighted phrase is Skyroot's own company.
//
// SOURCES: as NewsCardTechCrunchUnicorn (TechCrunch, 7 May 2026, verbatim headline; lead photo credit Skyroot).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { ARTICLES } from "./NewsCardTechCrunchUnicorn";
import SkyrootNewsCard, { hlDraw } from "./SkyrootNewsCard";

export const FPS = 24000 / 1001;
export const DURATION = 143;

export const schema = z.object({
  drawStart: z.number(),
  travel: z.number(),
  stagger: z.number(),
  rot: z.number(),
  photoLook: z.enum(["colour", "grade"]),
});
export type Props = z.infer<typeof schema>;
// rot +1 = card A's -1 mirrored; the graded photo, as card A
export const defaultProps: Props = schema.parse({ drawStart: 3, travel: 13, stagger: 2, rot: 1, photoLook: "grade" });

const NewsCardTechCrunchUnicornAnim: React.FC<Props> = ({ drawStart, travel, stagger, rot, photoLook }) => {
  const frame = useCurrentFrame();
  const a = ARTICLES.techcrunch;
  return (
    <SkyrootNewsCard
      layout="C"
      outlet={a.outlet}
      date={a.date}
      headline={a.headlineC}
      highlight={a.highlight}
      hlReveal={hlDraw(frame, drawStart, travel, stagger)}
      frame={frame}
      chain="none"
      rot={rot}
      film
      photo={{ ...a.photoC, look: photoLook }}
    />
  );
};

export default NewsCardTechCrunchUnicornAnim;
