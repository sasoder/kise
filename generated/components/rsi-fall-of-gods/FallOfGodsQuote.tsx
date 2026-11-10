// ---------------------------------------------------------------------------
// FallOfGodsQuote (rsi-fall-of-gods, cut 25). Dwarkesh style (styles/dwarkesh.md).
// Opaque 1080x1920, 23.976 fps, 134 frames.
//
// CHECK LINE: the viewer reads Steinbeck's line from East of Eden as it is spoken, as a paper pinned on the wall, and
// knows where it comes from.
//
// THE LINE: "And there is one sure thing about the fall of gods. They do not fall a little. They crash and shatter."
// WORD -> FRAME (composition frames from f0; Whisper reads 2-7 f early): And -1 · there 3 · is 6 · one 9 · sure 14 ·
// thing 20 · about 26 · the 40 · fall 45 · of 50 · gods 55 · They 68 · do 73 · not 76 · fall 80 · a 86 · little 90 ·
// They 98 · crash 103 · and 110 · shatter 120 · (Now 133).
// DURATION: the slot 25.901 -> 31.490 s = 5.589 s x 23.976 = 134 frames (f0..f133).
//
// THE MOTION: the clip's quote wall (quoteShared.tsx): the dimmed grid with one white paper card pinned at the true
// middle (centre y 950), a light-grey pushpin at its top centre, three receded sheets peeking in from the frame edges.
// Frame 0 already holds the wall, the card, the pin, the rule, the attribution and the opening quote mark; the quote
// types on letter by letter with the voice, each word's letters inside its spoken span ("And" from f1, the onset
// moved off f-1 so f0 holds only the opening mark; "shatter.”" lands f120-f127, inked by f128), under one slow push
// (k 1 -> 1.04) from f0 to the last frame plus the sway and the grid drift: a living hold, no fade.
//
// SOURCES: the quote and its line breaks are the show's own printed card (q1.jpg, the 16:9 episode's burned-in quote):
// John Steinbeck, East of Eden (1952), ch. 39.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { QuoteWall, checkWords, type QuoteWord } from "./quoteShared";

export const FPS = 24000 / 1001;
export const DURATION = 134;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// the show's four lines (q1.jpg), the opening mark printed from f0 by the card
const LINES = [
  "And there is one sure thing",
  "about the fall of gods:",
  "they do not fall a little;",
  "they crash and shatter.”",
];

const WORDS: QuoteWord[] = [
  { text: "And", f: 1 },
  { text: "there", f: 3 },
  { text: "is", f: 6 },
  { text: "one", f: 9 },
  { text: "sure", f: 14 },
  { text: "thing", f: 20 },
  { text: "about", f: 26 },
  { text: "the", f: 40 },
  { text: "fall", f: 45 },
  { text: "of", f: 50 },
  { text: "gods:", f: 55 },
  { text: "they", f: 68 },
  { text: "do", f: 73 },
  { text: "not", f: 76 },
  { text: "fall", f: 80 },
  { text: "a", f: 86 },
  { text: "little;", f: 90 },
  { text: "they", f: 98 },
  { text: "crash", f: 103 },
  { text: "and", f: 110 },
  { text: "shatter.”", f: 120 },
];
const END = 128; // "shatter.”" spreads over f120..f127
checkWords(LINES, WORDS);

const ATTRIBUTION = ["John Steinbeck, East of Eden"];

const FallOfGodsQuote: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  return (
    <QuoteWall
      frame={frame}
      duration={DURATION}
      lines={LINES}
      words={WORDS}
      end={END}
      attribution={ATTRIBUTION}
    />
  );
};

export default FallOfGodsQuote;
