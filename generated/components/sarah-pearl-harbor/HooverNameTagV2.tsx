import React, { useEffect, useState } from "react";
import { loadFont as loadFell } from "@remotion/google-fonts/IMFellEnglish";
import { loadFont as loadFellSC } from "@remotion/google-fonts/IMFellEnglishSC";
import { AbsoluteFill, Easing, cancelRender, continueRender, delayRender, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";

/**
 * HooverNameTagV2 — cold-review V2 of 15_HooverNameTag_SP (Sarah Pearl Harbor, smooth pass, marker
 * "make a name tag for this guy"). A copy (not an edit) of the house Dwarkesh map-style tag
 * (generated/components/kits/name-tags/NameTagMapStyle.tsx) for the Herbert Hoover portrait
 * 15.7_WontHelpUs_HerbertHoover1928.jpg (V4 seq 377..445, still at ~66.3 -> 67.1 %).
 *
 * Check: transparent 1080x1920 overlay, 24 fps, 81 frames (timeline uses 0..68; 69..80 hold handle).
 * Line: "...and it's going to really hurt trade globally. It won't help us."
 *   and 2, it's 5, going 8, really 14, hurt 19, trade 25, globally 32, It 49, won't 51, help 56, us 64.
 * DURATION: 69 used frames (seq 377..445 at 24 fps) + 12 hold = 81, the delivered native length.
 * Text: identification only — "Herbert Hoover" / "President of the United States".
 *
 * V2 changes (cold reviewers r0 6.5/10, r1 7/10):
 *  - Phone legibility: name 1.2x and descriptor 1.5x the delivered size, then the whole tag 1.15x
 *    (83.5 / 49.7 px vs 60 / 29); descriptor small-cap height measured 23 px, full caps 36 px.
 *  - Placement: plate x 96-934, y 1488-1662 — under the lower caption band (ends y 1460), out of the
 *    phone's bottom UI zone. It covers the shirt/tie tip outright (the wedge's lit edge spans x 618-705
 *    at y 1500 and ends ~y 1620; the plate runs ~230 px past it), so no tangent.
 *  - Separation: a lifted warm umber plate (#403226, was #2A221A; name ~9:1 over the suit), a cream
 *    hairline inset 6 px (2.5 px at 0.62) and a soft deep-brown shadow (#17120D, never black), so it
 *    reads as a card at 270 px wide.
 *  - Entrance: the style's own (styles/name-tags.md "keep each component's own entrance"), exactly
 *    NameTagMapStyle's timings and easing: plate 0-12 slides up + fades, rule 2-14 draws top to bottom,
 *    name 4-16 and descriptor 9-21 slide up + fade (rises scaled to this size). Settled by f21 (before
 *    "hurt" f19 finishes); static hold to the last frame, no drift, no exit.
 * Glyph check before frame 0, as in the kit.
 */

export const FPS = 24;
export const DURATION = 81;

export const schema = z.object({
  name: z.string(),
  job: z.string(),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({
  name: "Herbert Hoover",
  job: "President of the United States",
});

// ---- type (kit 84 / 40 px at the delivered 0.72x, then 1.2x / 1.5x) ----
const FELL = loadFell("normal", { weights: ["400"], subsets: ["latin"] });
const FELL_SC = loadFellSC("normal", { weights: ["400"], subsets: ["latin"] });
const G = 1.15; // r2: whole tag 1.15x for the descriptor's cap height
const K = 0.72 * 1.2 * G; // layout scale vs the kit (follows the name)
const NAME_PX = 84 * 0.72 * 1.2 * G;
const JOB_PX = 40 * 0.72 * 1.5 * G;
const JOB_TRACK_EM = 0.06;

// ---- colours ----
const CREAM = "#E9DDBF";
const PLATE = "rgba(64,50,38,0.97)"; // #403226, lifted from the kit's #2A221A for a value step over the suit
const HAIRLINE = "rgba(233,221,191,0.62)";
const HAIRLINE_W = 2.5;
const HAIRLINE_INSET = 6;
const SHADOW = "0px 14px 34px 6px rgba(23,18,13,0.95), 0px 3px 8px rgba(23,18,13,0.85)"; // #17120D
const ORANGE = "#FFB000";

// ---- layout (1080x1920 px) ----
const LEFT = 96;
const PLATE_TOP = 1488;
const RULE_W = 7;
const PAD_LEFT = Math.round(30 * G);
const PAD_RIGHT = Math.round(34 * G);
const NAME_TOP = 14;
const NAME_BOX = Math.round(NAME_PX * 1.06);
const GAP = 2;
const JOB_BOX = Math.round(JOB_PX * 1.12);
const PAD_BOTTOM = 16;
const PLATE_H = NAME_TOP + NAME_BOX + GAP + JOB_BOX + PAD_BOTTOM;

// ---- entrance (NameTagMapStyle's) ----
const EASE = Easing.out(Easing.cubic);
const PLATE_RISE = 48 * K;
const TEXT_RISE = 24 * K;

const missingGlyphs = (family: string, text: string): string[] => {
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return [];
  const width = (ch: string, fallback: string) => {
    ctx.font = `100px "${family}", ${fallback}`;
    return ctx.measureText(ch).width;
  };
  return [...new Set(text)].filter((ch) => ch !== " " && width(ch, "monospace") !== width(ch, "serif"));
};

const HooverNameTagV2: React.FC<Props> = ({ name, job }) => {
  const frame = useCurrentFrame();
  const [handle] = useState(() => delayRender("HooverNameTagV2: glyph check"));
  useEffect(() => {
    Promise.all([FELL.waitUntilDone(), FELL_SC.waitUntilDone()])
      .then(() => {
        const missing = [...missingGlyphs(FELL.fontFamily, name), ...missingGlyphs(FELL_SC.fontFamily, job)];
        if (missing.length > 0) throw new Error(`HooverNameTagV2: no glyph for ${missing.join(", ")}`);
        continueRender(handle);
      })
      .catch((err) => cancelRender(err));
  }, [handle, name, job]);

  const enter = (from: number, to: number) =>
    interpolate(frame, [from, to], [0, 1], { easing: EASE, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
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
          <div style={{ position: "absolute", inset: 0, backgroundColor: PLATE, boxShadow: SHADOW }} />
          <div
            style={{
              position: "absolute",
              top: HAIRLINE_INSET,
              bottom: HAIRLINE_INSET,
              left: RULE_W + HAIRLINE_INSET,
              right: HAIRLINE_INSET,
              border: `${HAIRLINE_W}px solid ${HAIRLINE}`,
            }}
          />
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
              marginTop: GAP,
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

export default HooverNameTagV2;
