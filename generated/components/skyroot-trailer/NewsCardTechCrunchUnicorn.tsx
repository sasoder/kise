// ---------------------------------------------------------------------------
// NewsCardTechCrunchUnicorn (skyroot-trailer, news card B: a still on the stills track for 9.384-15.349 s, the
// red-labelled clip, directly after news card A, NewsCardAljazeeraLaunch). Core memory podcast style
// (styles/core-memory.md). Opaque 2048x1080, 23.976 fps, 1 frame, rendered --scale 2 to 4096x2160 (Scale 100 in Premiere).
//
// CHECK LINE: the money the host asks about is real and public: Skyroot became India's first spacetech unicorn.
//
// THE LINE (not typeset, the captions carry it): Host: "Have you raised $100 million to date?" Skyroot: "We've raised
// close to $155 million." "$155 million." The card carries only the article's own words, and (the director's call) by
// default NO figure at all: the Business Today headline's "$60 MILLION" on screen under "$155 million" spoken reads as
// a contradiction. So the default is TechCrunch's headline, which names the unicorn and no number; Business Today is
// the alt (prop `article`).
// WORD -> FRAME: none (a still).
// DURATION: 1 frame (a still).
//
// THE PICTURE: the pair of card A. The SAME SkyrootNewsCard (the user's "much more minimalistic than usual" design,
// approved on card A): one white slip on its hard shadow on generous squared paper, the outlet and the date small above
// the headline in four natural phrase lines. Only the content differs, and the slip's turn is mirrored (A -1 deg,
// B +1 deg). Both cards come out at the same height-limited type size (83 px) and the same slip height (499 px).
// LAYOUT (prop `layout`): "A" (default, as approved for card A) the slip alone; "B" the slip plus a modest print of
// the article's lead photo tucked under the slip's right edge (not delivered for this card).
// CHAIN = SKYROOT'S OWN: the headline is Skyroot's own company, so the slip carries the same thin crown as card A.
// LAYOUT "C" (preview only, the pair of card A's V2; not the default): the headline re-broken so the phrase sits on
// one line (`headlineC`), that line (`highlight`) on card A's blue marker with its purple / orange crown, the lead
// photo as a print beside the slip (kept small, `printH`, because the source is only 1080 x 720), the pair centred
// on the whole frame. Render it with --props '{"layout":"C","chain":"none"}'.
//
// SOURCES (headlines verbatim, set uppercase as house style):
// - "techcrunch" (default): TechCrunch, 7 May 2026, Jagmeet Singh, h1 "India's first space tech unicorn emerges as
//   Skyroot gears up for orbital launch",
//   https://techcrunch.com/2026/05/07/indias-first-space-tech-unicorn-emerges-as-skyroot-gears-up-for-orbital-launch/
//   Lead photo (layout B): Skyroot's Max-Q HQ at night, 1080x720, "Image Credits: Skyroot",
//   public/skyroot-trailer/newscard_techcrunch_unicorn_photo.jpg (= animation_source/assets/article_b_techcrunch_photo.jpg).
// - "businesstoday" (alt): Business Today, 7 May 2026, Arun Padmanabhan, h1 "Skyroot becomes India's first spacetech
//   unicorn with $60 million funding ahead of Vikram-1 launch",
//   https://www.businesstoday.in/technology/story/skyroot-becomes-indias-first-spacetech-unicorn-with-60-million-funding-ahead-of-vikram-1-launch-530222-2026-05-07
//   Lead photo (layout B): the two co-founders in an open Vikram-1 payload fairing, 1200x675, credit Skyroot Aerospace,
//   public/skyroot-trailer/newscard_businesstoday_unicorn_photo.jpg (= animation_source/assets/article_b_businesstoday_photo.jpg).
// ---------------------------------------------------------------------------
import React from "react";
import { z } from "zod";
import SkyrootNewsCard, { type CardPhoto } from "./SkyrootNewsCard";

export const FPS = 24000 / 1001;
export const DURATION = 1;

type Article = {
  outlet: string;
  date: string;
  headline: string[];
  photo: CardPhoto;
  /** layout C: the same words re-broken so the highlighted phrase sits on one line, that line's index, the print */
  headlineC: string[];
  highlight: number;
  photoC: CardPhoto;
};

/** the two articles, each as published (headline lines are natural phrases, ragged right) */
export const ARTICLES: Record<"techcrunch" | "businesstoday", Article> = {
  techcrunch: {
    outlet: "TechCrunch",
    date: "7 May 2026",
    headline: ["India’s first space tech", "unicorn emerges", "as Skyroot gears up", "for orbital launch"],
    // a tall window on the astronaut figure on the facade, the edge of the lit sign beside it
    photo: {
      src: "skyroot-trailer/newscard_techcrunch_unicorn_photo.jpg",
      w: 1080,
      h: 720,
      crop: { x0: 0.6, y0: 0.12, x1: 0.92, y1: 0.88 },
      credit: "Skyroot",
    },
    headlineC: ["India’s first space tech unicorn", "emerges as Skyroot gears up", "for orbital launch"],
    highlight: 0,
    // the full height, the left sky trimmed (the lit SKYROOT sign and its mark, the astronaut on the facade): 913 x 720
    // source px; the window 380 px tall = ~482 x 380 at 2048, ~1.05x the source at 4K, so the print stays sharp
    photoC: {
      src: "skyroot-trailer/newscard_techcrunch_unicorn_photo.jpg",
      w: 1080,
      h: 720,
      crop: { x0: 0.155, y0: 0, x1: 1, y1: 1 },
      credit: "Skyroot",
      printH: 380,
    },
  },
  businesstoday: {
    outlet: "Business Today",
    date: "7 May 2026",
    headline: ["Skyroot becomes India’s", "first spacetech unicorn", "with $60 million funding", "ahead of Vikram-1 launch"],
    // a tall window on the two founders (x 0.40-0.62 of the photo) with a sliver of each fairing half, the full height
    // (the photo is only 675 px tall: every row kept keeps the print as sharp as it can be at 4K)
    photo: {
      src: "skyroot-trailer/newscard_businesstoday_unicorn_photo.jpg",
      w: 1200,
      h: 675,
      crop: { x0: 0.355, y0: 0, x1: 0.665, y1: 1 },
      credit: "Skyroot Aerospace",
    },
    headlineC: ["Skyroot becomes", "India’s first spacetech unicorn", "with $60 million funding", "ahead of Vikram-1 launch"],
    highlight: 1,
    photoC: {
      src: "skyroot-trailer/newscard_businesstoday_unicorn_photo.jpg",
      w: 1200,
      h: 675,
      credit: "Skyroot Aerospace",
      printH: 330,
    },
  },
};

export const schema = z.object({
  article: z.enum(["techcrunch", "businesstoday"]),
  layout: z.enum(["A", "B", "C"]),
  chain: z.enum(["thin", "none"]),
  rot: z.number(),
  film: z.boolean(),
  photoLook: z.enum(["colour", "grade"]),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({
  article: "techcrunch",
  layout: "A",
  chain: "thin",
  rot: 1, // card A's -1, mirrored
  film: true,
  photoLook: "colour",
});

const NewsCardTechCrunchUnicorn: React.FC<Props> = ({ article, layout, chain, rot, film, photoLook }) => {
  const a = ARTICLES[article];
  return (
    <SkyrootNewsCard
      layout={layout}
      outlet={a.outlet}
      date={a.date}
      headline={layout === "C" ? a.headlineC : a.headline}
      highlight={layout === "C" ? a.highlight : undefined}
      chain={chain}
      rot={rot}
      film={film}
      photo={{ ...(layout === "C" ? a.photoC : a.photo), look: photoLook }}
    />
  );
};

export default NewsCardTechCrunchUnicorn;
