// ---------------------------------------------------------------------------
// QuoteCard (caro-firing-moses, cut 48.792). The show's own corkboard look (paperShared.tsx), translated to 9:16.
// Opaque 1080x1920, 24 fps, 127 frames.
//
// CHECK LINE: the viewer reads, as it is spoken, an aide's line "It seemed like he was resigning about one thing or
// another about twice a day." with its source (an aide to Mayor Wagner, in The Power Broker).
//
// THE LINE: "Under Mayor Wagner, one aide said that, 'It seemed like he was resigning about one thing or another
// about twice a day.' He threatened…"
// WORD -> FRAME (composition frames; Whisper reads 2-7 f early): It -1 · seemed 5 · like 18 · he 23 · was 25 ·
// resigning 29 · about 41 · one 46 · thing 53 · or 58 · another 62 · about 68 · twice 84 · a 92 · day 97 · (He 109).
// DURATION: the slot 48.792 -> 54.083 s = 5.292 s x 24 = 127 frames (f0..f126).
//
// THE MOTION: the original's pinned card on the dark cork, re-staged tall: the card 900 px wide in the upper
// middle, its push pin top centre, the typed side sheets tucked under it above and peeking in below, cut by the
// frame. Frame 0 already holds the cork, the card, the printed grey attribution and the opening quote mark; the
// quote types on letter by letter with the voice (each word's letters inside its spoken span, "day.”" done by f100),
// under one slow push-in (k 1 -> 1.04) that runs from f0 to the last frame, then a living hold (push + grain).
//
// SOURCES: the quote and attribution are the original graphic's (Robert Caro, The Power Broker). Art lifted from
// the show's 4K frame quoteCard_seqf1171.png (assets-src/caro-firing-moses/lift_paper.py).
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  CorkPlate,
  Cutout,
  FilmGrain,
  PaperSheet,
  TYPE_FONT,
  TypedLine,
  Vignette,
  driftTransform,
  typeFrames,
} from "./paperShared";

export const FPS = 24;
export const DURATION = 127;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// world px per lifted px: the card is 2058 px wide in the 4K frame, lifted at 0.5 -> 1029, shown 900 wide
const S = 900 / 1029;

const CARD = { x: 90, y: 368, w: 900, h: 640 };
// the pin crop (4K x 1720..2060, y 240..600) has the head centre at (211, 105) 4K px = (105.5, 52.5) lifted px
const PIN = { w: 170, h: 180, cx: 105.5, cy: 52.5 };
const PIN_AT = { x: 540, y: CARD.y + 17 }; // the original's head sits 38 4K px below the card's top edge

const WORDS = [
  { text: "It", f: 1 },
  { text: "seemed", f: 5 },
  { text: "like", f: 18 },
  { text: "he", f: 23 },
  { text: "was", f: 25 },
  { text: "resigning", f: 29 },
  { text: "about", f: 41 },
  { text: "one", f: 46 },
  { text: "thing", f: 53 },
  { text: "or", f: 58 },
  { text: "another", f: 62 },
  { text: "about", f: 68 },
  { text: "twice", f: 84 },
  { text: "a", f: 92 },
  { text: "day.”", f: 97 },
];
const FRAMES = typeFrames(WORDS, 100); // "day.”" lands 97..100
const LINES = ["It seemed like he was", "resigning about one", "thing or another about", "twice a day.”"];
const LINE_FROM = LINES.map((_, i) => LINES.slice(0, i).reduce((a, l) => a + l.length + 1, 0));

const INK = "rgb(20,20,20)";
const GREY = "rgb(112,112,112)";
const FONT_SIZE = 58;
const LINE_H = 80;
const TEXT_X = 76; // in card px
const TEXT_TOP = 112;
// Cutive is lighter than the show's American Typewriter Medium: a thin stroke in the ink colour brings it up
const STROKE = 1.1;

const QuoteCard: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const cam = driftTransform(frame / (DURATION - 1), 1, 1.04, 540, 680, 0, -6);
  const sheetShadow = "drop-shadow(0 10px 12px rgba(0,0,0,0.6))";
  return (
    <AbsoluteFill style={{ backgroundColor: "rgb(30,30,30)", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transformOrigin: "0 0", transform: cam.css }}>
        <CorkPlate src="qc_cork.jpg" w={1440} h={2400} s={S} cx={540} cy={960} />
        {/* typed side sheets, cut by the frame on their outer side: lower halves above the card, tops below it */}
        <Cutout src="qc_sheetL.png" w={400} h={965} s={S} x={-44} y={CARD.y + 60 - 844} rot={-1.6} style={{ filter: sheetShadow }} />
        <Cutout src="qc_sheetR.png" w={390} h={960} s={S} x={1080 + 44 - 341} y={CARD.y + 80 - 840} rot={1.3} style={{ filter: sheetShadow }} />
        <Cutout src="qc_sheetL.png" w={400} h={965} s={S} x={-40} y={1452} rot={1.1} style={{ filter: sheetShadow }} />
        <Cutout src="qc_sheetR.png" w={390} h={960} s={S} x={1080 + 40 - 341} y={1482} rot={-1.4} style={{ filter: sheetShadow }} />
        <PaperSheet
          src="qc_paper.jpg"
          x={CARD.x}
          y={CARD.y}
          w={CARD.w}
          h={CARD.h}
          brightness={1.09}
          shadow="0 24px 34px rgba(0,0,0,0.6), 0 5px 7px rgba(0,0,0,0.55)"
          light="radial-gradient(ellipse 85% 75% at 50% 32%, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.13) 100%)"
        >
          <div
            style={{
              position: "absolute",
              left: TEXT_X,
              top: TEXT_TOP,
              fontFamily: TYPE_FONT,
              fontSize: FONT_SIZE,
              lineHeight: `${LINE_H}px`,
              WebkitTextStroke: `${STROKE}px currentColor`,
            }}
          >
            {LINES.map((l, i) => (
              <div key={i} style={{ whiteSpace: "pre" }}>
                {i === 0 ? <span style={{ color: INK }}>“</span> : null}
                <TypedLine text={l} frames={FRAMES} from={LINE_FROM[i]} frame={frame} color={INK} style={{ display: "inline" }} />
              </div>
            ))}
          </div>
          <div
            style={{
              position: "absolute",
              left: TEXT_X,
              top: TEXT_TOP + 4 * LINE_H + 44,
              fontFamily: TYPE_FONT,
              fontSize: 33,
              lineHeight: "46px",
              letterSpacing: 1.2,
              color: GREY,
              whiteSpace: "pre",
              WebkitTextStroke: `0.6px ${GREY}`,
            }}
          >
            <div>– AN AIDE TO MAYOR WAGNER,</div>
            <div>{"  IN THE POWER BROKER"}</div>
          </div>
        </PaperSheet>
        <Cutout src="qc_pinshadow.png" w={PIN.w} h={PIN.h} s={S} x={PIN_AT.x - PIN.cx * S} y={PIN_AT.y - PIN.cy * S} />
        <Cutout src="qc_pin.png" w={PIN.w} h={PIN.h} s={S} x={PIN_AT.x - PIN.cx * S} y={PIN_AT.y - PIN.cy * S} />
      </div>
      <Vignette strength={0.78} inner={38} at="50% 36%" />
      <FilmGrain frame={frame} amount={0.32} />
    </AbsoluteFill>
  );
};

export default QuoteCard;
