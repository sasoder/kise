import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import { INDIGO, MONO, SERIF, SERIF_WEIGHT, STOCK, THEMES } from "../works-in-progress/wipShared";

/**
 * NameTagWip: THE Works in Progress name tag (styles/works-in-progress.md, styles/name-tags.md). A quiet caption slip on
 * the printed page: one slip of the stamp's off-white stock, name in the kit's serif bold, one thin indigo rule (indigo =
 * the printed base layer, labels), job in the kit's mono 300. Both lines in the mint theme's dark ink. No perforations, no
 * postmark, square corners. Props `name`, `job`, `durationInFrames` (the Root's length; nothing here reads it).
 *
 * TRANSPARENT 1080x1920 overlay, 24 fps. House layout at full size: left 84, bottom 300; the slip hugs its text (the longer
 * line sets the width). `bun run cut --style name-tag --tag wip` bakes the 0.72x wrap to x 180, bottom y 1280.
 *
 * MOTION (the common entrance): f0-20 the slip slides up 64 px and fades in, everything printed on it riding with it;
 * f3-18 the name slides up 24 px and fades in; f6-20 the rule writes in from the left; f12-27 the job slides up 24 px and
 * fades in. f27 to the end is a completely static hold: no exit, no idle motion, and no film grain at all (the paper's own
 * baked fibre is the only texture), so the alpha and the slip cannot shimmer. At progress 1 no entrance style is left on
 * anything, so every hold frame is the same picture.
 *
 * CONTRAST: measured on the render, in the first use's header (wip-anthropic/CarnegieNameTag.tsx).
 */

export const FPS = 24;
export const schema = z.object({
  name: z.string(),
  job: z.string(),
  durationInFrames: z.number().int().positive(),
});
export type NameTagWipProps = z.infer<typeof schema>;
export const defaultProps: NameTagWipProps = schema.parse({
  name: "Andrew Carnegie",
  job: "Steel magnate and philanthropist",
  durationInFrames: 75,
});

// ---- type ----
const NAME_PX = 84;
const JOB_PX = 40;
const INK = THEMES.mint.ink;
const lineStyle = (family: string, weight: number, px: number): React.CSSProperties => ({
  fontFamily: family,
  fontWeight: weight,
  fontSize: px,
  lineHeight: 1,
  letterSpacing: 0,
  fontVariantNumeric: "lining-nums",
  whiteSpace: "nowrap",
});
const nameStyle = lineStyle(SERIF, SERIF_WEIGHT, NAME_PX);
const jobStyle = lineStyle(MONO, 300, JOB_PX);

// ---- layout: optical margins, to the capitals and the baselines (measured on the render) ----
const LEFT = 84;
const BOTTOM = 300;
const M_H = 36; // the sides, to the stems
const M_TOP = 28; // over the name's line box, which hugs the capitals: about 28 px of paper over them
const M_BOTTOM = 20; // under the job's line box: about 28 px under the baseline
const NAME_RULE = 8; // the name's baseline -> the rule: about 30 px, clearing the descenders
const RULE = 4;
const RULE_JOB = 16; // the rule -> the job's capitals: about 22 px
// A slip of paper on the page: a tight contact line and a soft low falloff, never a hard offset.
const SLIP_SHADOW = "0 1px 2px rgba(14,31,26,0.30), 0 5px 12px rgba(14,31,26,0.16)";

// ---- the entrance ----
const EASE = Easing.bezier(0.16, 1, 0.3, 1);
const progress = (frame: number, start: number, travel: number) =>
  interpolate(frame, [start, start + travel], [0, 1], { easing: EASE, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const enter = (t: number, rise: number): React.CSSProperties | undefined =>
  t >= 1 ? undefined : { opacity: t, transform: `translateY(${((1 - t) * rise).toFixed(3)}px)` };

/** A line with its in-flow sizing copy: the hidden copy sizes the box, the visible copy carries the entrance. */
const Line: React.FC<{ base: React.CSSProperties; t: number; stem?: number; children: React.ReactNode }> = ({ base, t, stem = 0, children }) => (
  // stem: the first letter's side bearing, pulled out so the ink sits on the margin
  <div style={{ position: "relative", marginLeft: -stem }}>
    <div style={{ ...base, visibility: "hidden" }}>{children}</div>
    <div style={{ ...base, position: "absolute", left: 0, top: 0, color: INK, ...enter(t, 24) }}>{children}</div>
  </div>
);

const NameTagWip: React.FC<NameTagWipProps> = ({ name, job }) => {
  const frame = useCurrentFrame();
  const rule = progress(frame, 6, 14);
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: LEFT,
          bottom: BOTTOM,
          overflow: "visible",
          backgroundColor: STOCK,
          boxShadow: SLIP_SHADOW,
          ...enter(progress(frame, 0, 20), 64),
        }}
      >
        <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
          <Img src={staticFile("wip-anthropic/stamp_paper.jpg")} style={{ position: "absolute", left: -40, top: -120, width: 900, height: 900, maxWidth: "none" }} />
        </div>
        <div style={{ position: "relative", padding: `${M_TOP}px ${M_H}px ${M_BOTTOM}px ${M_H}px` }}>
          <Line base={nameStyle} t={progress(frame, 3, 15)}>
            {name}
          </Line>
          <div style={{ height: NAME_RULE }} />
          <div style={{ height: RULE }}>
            <div style={{ height: RULE, width: `${(rule * 100).toFixed(3)}%`, backgroundColor: INDIGO }} />
          </div>
          <div style={{ height: RULE_JOB }} />
          <Line base={jobStyle} t={progress(frame, 12, 15)} stem={2}>
            {job}
          </Line>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default NameTagWip;
