// ---------------------------------------------------------------------------
// NewsCardAljazeeraLaunch (skyroot-trailer, news card A: a still on the stills track for 7.549-9.384 s, after
// 4_FirstPrivateToOrbit). Core memory podcast style (styles/core-memory.md). Opaque 2048x1080, 23.976 fps, 1 frame,
// rendered --scale 2 to 4096x2160 (Scale 100 in Premiere).
//
// CHECK LINE: the launch the speaker mentions was real news: India's first private-sector orbital rocket, July 2026.
//
// THE LINE (Skyroot, not typeset, the captions carry it): "It was just like 45 days ago."
// WORD -> FRAME: none (a still).
// DURATION: 1 frame (a still).
//
// THE PICTURE: the user's marker, "make a newscard for this but much more minimalistic than usual". SkyrootNewsCard
// (the minimal design, shared with card B, the funding, which follows directly): one white slip on its hard shadow
// on generous squared paper, AL JAZEERA and the date small above the headline in four natural phrase lines.
// LAYOUT (prop `layout`): "A" the slip alone; "B" the slip plus a modest print of the article's lead photo
// (Vikram-1 rising, its flame reflected in water), tucked under the slip's right edge. DEFAULT: see defaultProps.
// CHAIN = SKYROOT'S OWN: the headline is Skyroot's own rocket, so the slip carries a thin crown (prop `chain`).
//
// SOURCES: Al Jazeera, 18 July 2026 (AFP and Reuters), on-page h1 "India achieves milestone with launch of first
// private-sector orbital rocket" (verbatim, set uppercase as house style),
// https://www.aljazeera.com/news/2026/7/18/india-achieves-milestone-with-launch-of-first-private-sector-orbital-rocket
// Photo (layout B): the article's lead image, 2666x4000, public/skyroot-trailer/newscard_aljazeera_launch_photo.jpg
// (= animation_source/assets/article_a_aljazeera_photo.jpg), caption on page "India's Skyroot Aerospace orbital
// rocket Vikram-1 blasts off", credit "R Satish Babu/AFP".
// ---------------------------------------------------------------------------
import React from "react";
import { z } from "zod";
import SkyrootNewsCard from "./SkyrootNewsCard";

export const FPS = 24000 / 1001;
export const DURATION = 1;

export const schema = z.object({
  layout: z.enum(["A", "B"]),
  chain: z.enum(["thin", "none"]),
  rot: z.number(),
  film: z.boolean(),
  photoLook: z.enum(["colour", "grade"]),
  outlet: z.string(),
  date: z.string(),
  /** the headline as published, one entry per line (natural phrases) */
  headline: z.array(z.string()),
  credit: z.string(),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({
  layout: "A",
  chain: "thin",
  rot: -1,
  film: true,
  photoLook: "colour",
  outlet: "Al Jazeera",
  date: "18 July 2026",
  headline: ["India achieves milestone", "with launch of first", "private-sector", "orbital rocket"],
  credit: "R Satish Babu/AFP",
});

// the print's crop: a tall strip centred on the rocket (x 0.52 of the photo), from the sky above the nose to the end
// of the flame's reflection
export const PHOTO = {
  src: "skyroot-trailer/newscard_aljazeera_launch_photo.jpg",
  w: 2666,
  h: 4000,
  crop: { x0: 0.22, y0: 0.05, x1: 0.82, y1: 0.97 },
};

const NewsCardAljazeeraLaunch: React.FC<Props> = ({ layout, chain, rot, film, photoLook, outlet, date, headline, credit }) => (
  <SkyrootNewsCard
    layout={layout}
    outlet={outlet}
    date={date}
    headline={headline}
    chain={chain}
    rot={rot}
    film={film}
    photo={{ ...PHOTO, credit, look: photoLook }}
  />
);

export default NewsCardAljazeeraLaunch;
