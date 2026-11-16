import React, { useEffect, useState } from "react";
import { loadFont as loadCaslon } from "@remotion/google-fonts/LibreCaslonText";
import { AbsoluteFill, Easing, cancelRender, continueRender, delayRender, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import { AIR, Paint } from "../dwarkesh-3d/dwarkesh3d";

/**
 * NameTagDwarkesh3d: THE Dwarkesh 3D name tag (styles/dwarkesh-3d.md, styles/name-tags.md). The house tag (name over a
 * one-line descriptor, a panel that hugs the text) in the medium's own materials: a slab of the deep petrol air, lit
 * softly from above like the style's volumes (a little lighter at its top, a thin cream rim along the top edge), with
 * the kit's gouache texture (Paint.folkTexDefs: grain, dry-brush mottling, a hand-wobbly edge) over the panel only,
 * a soft cast shadow in the medium's shadow colour to its lower right, and soft rounded corners.
 *
 * TYPE: the clip's plate face (Libre Caslon Text, PLATE_FONT / YearPlate in rsi-ten-earths/tenEarthsHall.tsx), loaded
 * here with latin-ext for names like Erdős: the name in 700 at 84 px, the descriptor in 400 at 42 px, both the medium's
 * cream #F3EBDD (hierarchy by size and weight, not by a dimmer line). No orange: in these clips orange means AIs only.
 *
 * PROPS: name, job, durationInFrames (the Root's length; nothing here reads it), align "left" (default: the panel's
 * left edge at x 84, text left-aligned) or "right" (mirrored for a second person standing on the right: the panel's
 * right edge at x 996, text right-aligned). Bottom 300 either way.
 *
 * TRANSPARENT 1080x1920 overlay, 24000/1001 fps (FPS). House layout at full size as above; a Root bakes the 0.72x wrap
 * (styles/name-tags.md "Size and position"): `wrapFor(align)` gives the transform that puts the panel's outer bottom
 * corner on x 180 (or x 900 for right) at y 1280.
 *
 * MOTION (the common entrance, Easing.bezier(0.16, 1, 0.3, 1)): f0-20 the panel slides up 64 px and fades in; f3-18
 * the name slides up 24 px and fades in; f12-27 the descriptor the same. Settled by f27, then a completely static hold
 * to the last frame: no exit, no idle motion, the texture is seeded and frozen, and at progress 1 no entrance style is
 * left on anything, so every hold frame is the same picture.
 *
 * Every character is checked against the face before the first frame: a glyph the font lacks fails the render instead
 * of falling back silently.
 *
 * CONTRAST: measured on the render (src/Root.NameTagSinceWriting.tsx header).
 */

export const FPS = 24000 / 1001;
export const schema = z.object({
  name: z.string(),
  job: z.string(),
  durationInFrames: z.number().int().positive(),
  align: z.enum(["left", "right"]),
});
export type NameTagDwarkesh3dProps = z.infer<typeof schema>;
export const defaultProps: NameTagDwarkesh3dProps = schema.parse({
  name: "Paul Erdős",
  job: "Mathematician",
  durationInFrames: 98,
  align: "left",
});

// ---- type ----
const CASLON = loadCaslon("normal", { weights: ["400", "700"], subsets: ["latin", "latin-ext"] });
const NAME_PX = 84;
const JOB_PX = 42;

// ---- colours (palette A of the medium) ----
const PAL = AIR.A;
const CREAM = PAL.cream; // #F3EBDD
const PANEL_TOP = "#273F40"; // the deep petrol air, lit a little from above
const PANEL_BOTTOM = "#1D2F30";
const SHADOW = PAL.shadow; // #22180F

// ---- layout (full size) ----
const SIDE = 84;
const BOTTOM = 300;
const RADIUS = 16;
const PAD_TOP = 24;
const PAD_BOTTOM = 27;
const PAD_H = 40;
const GAP = 10; // the name's line box -> the descriptor's
export const TAG_SCALE = 0.72;

/** the 0.72x house wrap (transform on a full-frame AbsoluteFill, origin 0 0): the panel's outer bottom corner at
 *  x 180 (left) or 900 (right), y 1280 + dy */
export const wrapFor = (align: "left" | "right", dy = 0): React.CSSProperties => {
  const fromX = align === "right" ? 1080 - SIDE : SIDE;
  const toX = align === "right" ? 1080 - 180 : 180;
  const fromY = 1920 - BOTTOM;
  const toY = 1280 + dy;
  return {
    transformOrigin: "0 0",
    transform: `translate(${toX - TAG_SCALE * fromX}px, ${toY - TAG_SCALE * fromY}px) scale(${TAG_SCALE})`,
  };
};

// ---- the entrance ----
const EASE = Easing.bezier(0.16, 1, 0.3, 1);
const progress = (frame: number, start: number, travel: number) =>
  interpolate(frame, [start, start + travel], [0, 1], { easing: EASE, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const enter = (t: number, rise: number): React.CSSProperties | undefined =>
  t >= 1 ? undefined : { opacity: t, transform: `translateY(${((1 - t) * rise).toFixed(3)}px)` };

/** Fails the render if `family` has no glyph for a character of `text`. */
const missingGlyphs = (family: string, weight: number, text: string): string[] => {
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return [];
  const width = (ch: string, fallback: string) => {
    ctx.font = `${weight} 100px "${family}", ${fallback}`;
    return ctx.measureText(ch).width;
  };
  return [...new Set(text)].filter((ch) => ch !== " " && width(ch, "monospace") !== width(ch, "serif"));
};

const lineStyle = (weight: number, px: number): React.CSSProperties => ({
  fontFamily: CASLON.fontFamily,
  fontWeight: weight,
  fontSize: px,
  lineHeight: 1.06,
  fontVariantNumeric: "lining-nums",
  whiteSpace: "nowrap",
});

/** A line with its in-flow sizing copy: the hidden copy sizes the box, the visible copy carries the entrance. */
const Line: React.FC<{ base: React.CSSProperties; t: number; right: boolean; children: React.ReactNode }> = ({ base, t, right, children }) => (
  <div style={{ position: "relative", textAlign: right ? "right" : "left" }}>
    <div style={{ ...base, visibility: "hidden" }}>{children}</div>
    <div style={{ ...base, position: "absolute", left: 0, right: 0, top: 0, color: CREAM, ...enter(t, 24) }}>{children}</div>
  </div>
);

/** The panel: a soft cast shadow, the petrol slab with its rim, the gouache texture over the slab only. */
const Panel: React.FC<{ uid: string }> = ({ uid }) => (
  <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, overflow: "visible" }}>
    <defs>
      <linearGradient id={`${uid}g`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={PANEL_TOP} />
        <stop offset="1" stopColor={PANEL_BOTTOM} />
      </linearGradient>
      <linearGradient id={`${uid}r`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor={CREAM} stopOpacity={0} />
        <stop offset="0.12" stopColor={CREAM} stopOpacity={0.32} />
        <stop offset="0.88" stopColor={CREAM} stopOpacity={0.32} />
        <stop offset="1" stopColor={CREAM} stopOpacity={0} />
      </linearGradient>
      <filter id={`${uid}s`} x="-20%" y="-40%" width="140%" height="180%">
        <feGaussianBlur stdDeviation={10} />
      </filter>
      {Paint.folkTexDefs(uid, 0.55)}
    </defs>
    <rect x={6} y={10} width="100%" height="100%" rx={RADIUS} fill={SHADOW} opacity={0.42} filter={`url(#${uid}s)`} />
    <g filter={`url(#${uid}tx)`}>
      <rect x={0} y={0} width="100%" height="100%" rx={RADIUS} fill={`url(#${uid}g)`} />
      <rect x={0} y={2.5} width="100%" height={2.5} fill={`url(#${uid}r)`} />
    </g>
  </svg>
);

const NameTagDwarkesh3d: React.FC<NameTagDwarkesh3dProps> = ({ name, job, align }) => {
  const frame = useCurrentFrame();
  const right = align === "right";
  const [handle] = useState(() => delayRender("NameTagDwarkesh3d: glyph check"));

  useEffect(() => {
    CASLON.waitUntilDone()
      .then(() => {
        const missing = [
          ...missingGlyphs(CASLON.fontFamily, 700, name).map((ch) => `"${ch}" (name)`),
          ...missingGlyphs(CASLON.fontFamily, 400, job).map((ch) => `"${ch}" (job)`),
        ];
        if (missing.length > 0) throw new Error(`NameTagDwarkesh3d: Libre Caslon Text has no glyph for ${missing.join(", ")}`);
        continueRender(handle);
      })
      .catch((err) => cancelRender(err));
  }, [handle, name, job]);

  const uid = `nt3d-${align}`;
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          ...(right ? { right: SIDE } : { left: SIDE }),
          bottom: BOTTOM,
          ...enter(progress(frame, 0, 20), 64),
        }}
      >
        <Panel uid={uid} />
        <div style={{ position: "relative", padding: `${PAD_TOP}px ${PAD_H}px ${PAD_BOTTOM}px ${PAD_H}px` }}>
          <Line base={lineStyle(700, NAME_PX)} t={progress(frame, 3, 15)} right={right}>
            {name}
          </Line>
          <div style={{ height: GAP }} />
          <Line base={lineStyle(400, JOB_PX)} t={progress(frame, 12, 15)} right={right}>
            {job}
          </Line>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default NameTagDwarkesh3d;
