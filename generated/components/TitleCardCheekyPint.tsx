import React from "react";
import { loadFont } from "@remotion/fonts";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import { ACCENT } from "./wolffShared";
import { TILE_SHADOW } from "./d1Shared";

/**
 * TitleCardCheekyPint — an opening title in the material of the chosen Cheeky
 * Pint name tag (NameTagCheekyPint "strips"): each line on its own hard-cornered
 * strip with the tile shadow, white strips for the sentence and ONE flat amber
 * strip for the word that matters, near-black warm brown Söhne Dreiviertelfett.
 * Built for "How Toto Wolff / got his job at / Mercedes" (the "how he got the
 * Mercedes job" clip, placed at 0:00 over the talking head).
 *
 * Transparent 1080x1920 overlay, 24 fps, 96 f. One centred column (phone-first),
 * strips stacked like cards, centred on the frame's vertical axis at CENTER_Y —
 * over the chest, clear of the face above and the captions below.
 *
 * Entrance = the name tag's, one strip after the other (STAGGER 6 f):
 *   strip  slides up 64 px + fades in over 20 f
 *   line   slides up 24 px + fades in over 15 f, 3 f behind its strip
 *   then a static hold to f95: no outro, no idle motion (the editor cuts away).
 * `backdrop` draws the clip's opening frame under the title for review only.
 */

export const FPS = 24;
export const DURATION = 96;

export const schema = z.object({
  lines: z.array(z.object({ text: z.string(), accent: z.boolean() })),
  /** review only: the footage still under the title */
  backdrop: z.boolean(),
});
export type TitleCardCheekyPintProps = z.infer<typeof schema>;
export const defaultProps: TitleCardCheekyPintProps = schema.parse({
  lines: [
    { text: "How Toto Wolff", accent: false },
    { text: "got his job at", accent: false },
    { text: "Mercedes", accent: true },
  ],
  backdrop: false,
});

const FONT = "TitleCardSohneDreiviertelfett";
loadFont({ family: FONT, url: staticFile("Sohne-Dreiviertelfett.otf"), weight: "700" });

const CENTER_Y = 1310;
const TITLE_PX = 92;
const GAP = 10;
const RADIUS = 2;
const STRIP_INK = "#1A130D";
const STRIP_GRAD = "linear-gradient(180deg, #FFFFFF 0%, #F1EDE6 100%)";
const TILE_FILTER = TILE_SHADOW(1);

const EASE = Easing.bezier(0.16, 1, 0.3, 1);
const progress = (frame: number, start: number, travel: number) =>
  interpolate(frame, [start, start + travel], [0, 1], { easing: EASE, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const STAGGER = 6;
const STRIP_TRAVEL = 20;
const STRIP_RISE = 64;
const TEXT_LAG = 3;
const TEXT_TRAVEL = 15;
const TEXT_RISE = 24;

const lineStyle: React.CSSProperties = {
  fontFamily: FONT,
  fontWeight: 700,
  fontSize: TITLE_PX,
  lineHeight: 1.08,
  letterSpacing: -1,
  whiteSpace: "nowrap",
  color: STRIP_INK,
};

const TitleStrip: React.FC<{ text: string; accent: boolean; start: number }> = ({ text, accent, start }) => {
  const frame = useCurrentFrame();
  const s = progress(frame, start, STRIP_TRAVEL);
  const t = progress(frame, start + TEXT_LAG, TEXT_TRAVEL);
  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: accent ? ACCENT : STRIP_GRAD,
          borderRadius: RADIUS,
          filter: TILE_FILTER,
          opacity: s,
          transform: `translateY(${((1 - s) * STRIP_RISE).toFixed(3)}px)`,
        }}
      />
      <div
        style={{
          ...lineStyle,
          position: "relative",
          padding: "20px 40px 24px 40px",
          opacity: t,
          transform: `translateY(${((1 - t) * TEXT_RISE).toFixed(3)}px)`,
        }}
      >
        {text}
      </div>
    </div>
  );
};

const TitleCardCheekyPint: React.FC<TitleCardCheekyPintProps> = ({ lines, backdrop }) => (
  <AbsoluteFill>
    {backdrop ? (
      <Img src={staticFile("cheekypint2/toto_job_backdrop_9x16.jpg")} style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920 }} />
    ) : null}
    <div
      style={{
        position: "absolute",
        left: 0,
        width: 1080,
        top: CENTER_Y,
        transform: "translateY(-50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: GAP,
      }}
    >
      {lines.map((l, i) => (
        <TitleStrip key={i} text={l.text} accent={l.accent} start={i * STAGGER} />
      ))}
    </div>
  </AbsoluteFill>
);

export default TitleCardCheekyPint;
