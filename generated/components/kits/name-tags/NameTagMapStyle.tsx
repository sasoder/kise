import React, { useEffect, useState } from "react";
import { loadFont as loadFell } from "@remotion/google-fonts/IMFellEnglish";
import { loadFont as loadFellSC } from "@remotion/google-fonts/IMFellEnglishSC";
import { AbsoluteFill, Easing, cancelRender, continueRender, delayRender, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";

/**
 * NameTagMapStyle — the house name tag (name on top, descriptor below,
 * left-aligned, a plate that hugs its text) in the Dwarkesh map style, for
 * portraits of historical people. Transparent 1080x1920 overlay, 24000/1001 fps.
 *
 * An engraved caption plate: the name in IM Fell English roman 84 px, the
 * descriptor in IM Fell English SC 40 px, tracked, both cream #E9DDBF, on a
 * solid dark-umber plate with hard corners and a 6 px house-orange rule down
 * its left edge. No shadow, no gradient. The plate spans y 1330-1500 (below the
 * caption strip at y 1080-1250), its left edge at x 84.
 *
 * CONTRAST (>= 10:1 on both lines over ANY painting, worst case pure white
 * behind the plate): #2A221A at 0.92 with the descriptor at 85 % cream gives
 * 9.1:1 and 7.1:1, so the plate is #2A221A at 0.97 and BOTH lines are full
 * cream: 10.65:1 over white, 11.9:1 over black. The hierarchy is carried by
 * size and by the small caps, not by a dimmer descriptor.
 *
 * Entrance (frames; no outro, the tag holds to the last frame):
 *   plate       0-12   slides up 48 px + fades in
 *   orange rule 2-14   draws top to bottom
 *   name        4-16   slides up 24 px + fades in
 *   descriptor  9-21   slides up 24 px + fades in
 * A tag shorter than 30 frames compresses the whole entrance to end by frame 12.
 *
 * Every character is checked against the two faces before the first frame: a
 * glyph the font lacks fails the render instead of falling back silently.
 */

export const FPS = 24000 / 1001;

export const schema = z.object({
  name: z.string(),
  job: z.string(),
  durationInFrames: z.number().int().positive(),
});
export type NameTagMapStyleProps = z.infer<typeof schema>;
export const defaultProps: NameTagMapStyleProps = {
  name: "Robert Clive",
  job: "East India Company commander",
  durationInFrames: 84,
};

// ---- type ----
const FELL = loadFell("normal", { weights: ["400"], subsets: ["latin"] });
const FELL_SC = loadFellSC("normal", { weights: ["400"], subsets: ["latin"] });
const NAME_PX = 84;
const JOB_PX = 40;
const JOB_TRACK_EM = 0.08;

// ---- colours (Dwarkesh map style) ----
const CREAM = "#E9DDBF";
const PLATE = "rgba(42,34,26,0.97)"; // #2A221A
const ORANGE = "#FFB000";

// ---- layout ----
const LEFT = 84;
const PLATE_TOP = 1330;
const PLATE_H = 170;
const RULE_W = 6;
const PAD_LEFT = 34; // rule -> the name's first stem
const PAD_RIGHT = 40;
// Line boxes inside the plate, measured on the renders: the ascenders of the
// name start 15 px under the plate's top, the descriptor's baseline sits 27 px
// over its bottom, and a j or g of the name keeps 14 px over the small caps.
const NAME_TOP = 9;
const NAME_BOX = 92;
const JOB_TOP = 110;
const JOB_BOX = 46;

// ---- entrance ----
const EASE = Easing.out(Easing.cubic);
const SHORT_TAG = 30;
const FULL_ENTRANCE = 21;
const SHORT_ENTRANCE = 12;
const PLATE_RISE = 48;
const TEXT_RISE = 24;

/** Fails the render if `family` has no glyph for a character of `text`: with
 *  the glyph present the two fallbacks never matter and the widths agree. */
const missingGlyphs = (family: string, text: string): string[] => {
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return [];
  const width = (ch: string, fallback: string) => {
    ctx.font = `100px "${family}", ${fallback}`;
    return ctx.measureText(ch).width;
  };
  return [...new Set(text)].filter((ch) => ch !== " " && width(ch, "monospace") !== width(ch, "serif"));
};

const NameTagMapStyle: React.FC<NameTagMapStyleProps> = ({ name, job, durationInFrames }) => {
  const frame = useCurrentFrame();
  const [handle] = useState(() => delayRender("NameTagMapStyle: glyph check"));

  useEffect(() => {
    Promise.all([FELL.waitUntilDone(), FELL_SC.waitUntilDone()])
      .then(() => {
        const missing = [
          ...missingGlyphs(FELL.fontFamily, name).map((ch) => `"${ch}" (IM Fell English)`),
          ...missingGlyphs(FELL_SC.fontFamily, job).map((ch) => `"${ch}" (IM Fell English SC)`),
        ];
        if (missing.length > 0) {
          throw new Error(`NameTagMapStyle: no glyph for ${missing.join(", ")}`);
        }
        continueRender(handle);
      })
      .catch((err) => cancelRender(err));
  }, [handle, name, job]);

  const k = durationInFrames < SHORT_TAG ? SHORT_ENTRANCE / FULL_ENTRANCE : 1;
  const enter = (from: number, to: number) =>
    interpolate(frame, [from * k, to * k], [0, 1], { easing: EASE, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const plate = enter(0, 12);
  const rule = enter(2, 14);
  const nameT = enter(4, 16);
  const jobT = enter(9, 21);
  const rise = (t: number, px: number): React.CSSProperties => ({
    opacity: t,
    transform: t >= 1 ? undefined : `translateY(${((1 - t) * px).toFixed(3)}px)`,
  });

  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: LEFT, top: PLATE_TOP, height: PLATE_H }}>
        <div style={{ position: "absolute", inset: 0, ...rise(plate, PLATE_RISE) }}>
          <div style={{ position: "absolute", inset: 0, backgroundColor: PLATE }} />
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: RULE_W,
              height: "100%",
              backgroundColor: ORANGE,
              transformOrigin: "50% 0%",
              transform: `scaleY(${rule.toFixed(4)})`,
            }}
          />
        </div>
        <div style={{ position: "relative", height: "100%", paddingLeft: RULE_W + PAD_LEFT, paddingRight: PAD_RIGHT, color: CREAM, whiteSpace: "nowrap" }}>
          <div
            style={{
              paddingTop: NAME_TOP,
              height: NAME_TOP + NAME_BOX,
              boxSizing: "border-box",
              fontFamily: FELL.fontFamily,
              fontSize: NAME_PX,
              lineHeight: `${NAME_BOX}px`,
              ...rise(nameT, TEXT_RISE),
            }}
          >
            {name}
          </div>
          <div
            style={{
              position: "relative",
              marginTop: JOB_TOP - NAME_TOP - NAME_BOX,
              fontFamily: FELL_SC.fontFamily,
              fontSize: JOB_PX,
              lineHeight: `${JOB_BOX}px`,
              letterSpacing: `${JOB_TRACK_EM}em`,
              marginRight: `${-JOB_TRACK_EM}em`,
              ...rise(jobT, TEXT_RISE),
            }}
          >
            {job}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default NameTagMapStyle;
