// ---------------------------------------------------------------------------
// paperShared: the show's "paper on a corkboard" look (caro-firing-moses: QuoteCard, ResignForm), rebuilt in 9:16
// from the original 16:9 graphics' 4K frames (<clip>/animation_source/notes/reference/quoteCard_seqf*.png,
// resignForm_seqf*.png).
//
// Lifted art (assets-src/caro-firing-moses/lift_paper.py writes it into public/caro-firing-moses/):
//   qc_*  QuoteCard world: the dark, contrasty cork, the card paper, its push pin + cast shadow, the two typed side
//         sheets; lifted at 0.5 x the 4K frame and shown at QC_S (the card's 2058 px at 4K -> 900 px).
//   rf_*  ResignForm world: the lighter, warm cork, the form paper, its white pin; lifted at 0.42 x the 4K frame.
// The cork plates are quilted (min-cut seams) from the free cork in those frames after their light falloff was
// divided out, so they fill 1080x1920 with no tiling seam; light and vignette are put back here, in CSS.
//
// Sampled from the 4K PNGs: QuoteCard paper ~180/255 neutral, type ~22, attribution grey ~115, cork 63 at the top
// edge falling to ~19 in the bottom corners (strong vignette), fine moving grain. ResignForm paper ~(193,189,186),
// type ~8, cork ~(112,107,98), soft vignette.
//
// Typing: typeFrames() turns the spoken word table into one landing frame per character; TypedLine draws a fixed
// line of text whose characters exist from the start (so nothing reflows) and are inked on their frame — the
// typewriter look of the originals. Fonts (closest Google faces to the originals): the quote card's rounded
// typewriter face (ITC American Typewriter in the show) -> Cutive; the form's book serif -> EB Garamond.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { loadFont as loadCutive } from "@remotion/google-fonts/Cutive";
import { loadFont as loadGaramond } from "@remotion/google-fonts/EBGaramond";

export const TYPE_FONT = loadCutive("normal", { weights: ["400"], subsets: ["latin"] }).fontFamily;
export const FORM_FONT = loadGaramond("normal", { weights: ["500", "600", "700"], subsets: ["latin"] }).fontFamily;

const n = (v: number) => Math.round(v * 1000) / 1000;
export const asset = (f: string) => staticFile(`caro-firing-moses/${f}`);

// ---------------------------------------------------------------------------------------------------------------
// Typing
// ---------------------------------------------------------------------------------------------------------------

export type Word = { text: string; f: number };

// One landing frame per character of words.map(text).join(" "). A word's letters start on its onset and are spread
// over its spoken span (to the next onset, or `end` for the last word) at 0.5..2 frames per letter; spaces land
// with the letter before them.
export const typeFrames = (words: Word[], end?: number): number[] => {
  const out: number[] = [];
  words.forEach((w, i) => {
    const next = i + 1 < words.length ? words[i + 1].f : (end ?? w.f + 2 * w.text.length);
    const span = Math.max(1, next - w.f);
    const r = Math.min(2, Math.max(0.5, span / w.text.length));
    for (let j = 0; j < w.text.length; j++) out.push(w.f + Math.floor(j * r));
    if (i + 1 < words.length) out.push(out[out.length - 1]); // the space
  });
  return out;
};

// A fixed line: chars [from, from + text.length) of a typed string. Untyped characters keep their advance
// (transparent), so the line never reflows.
export const TypedLine: React.FC<{
  text: string;
  frames: number[];
  from: number;
  frame: number;
  color: string;
  style?: React.CSSProperties;
}> = ({ text, frames, from, frame, color, style }) => (
  <div style={{ whiteSpace: "pre", ...style }}>
    {Array.from(text).map((ch, i) => (
      <span key={i} style={{ color: frame >= frames[from + i] ? color : "transparent" }}>
        {ch}
      </span>
    ))}
  </div>
);

// ---------------------------------------------------------------------------------------------------------------
// Ground pieces (all in world px; the caller wraps them in one camera transform)
// ---------------------------------------------------------------------------------------------------------------

// A cork plate centred on (cx, cy), shown at scale s (world px per asset px).
export const CorkPlate: React.FC<{ src: string; w: number; h: number; s: number; cx: number; cy: number }> = ({
  src,
  w,
  h,
  s,
  cx,
  cy,
}) => (
  <Img
    src={asset(src)}
    style={{
      position: "absolute",
      left: n(cx - (w * s) / 2),
      top: n(cy - (h * s) / 2),
      width: n(w * s),
      height: n(h * s),
    }}
  />
);

// A sheet of paper: the lifted paper texture (background, cover), a lift shadow on the cork, optional rotation
// about its centre, and a soft light falloff across it. Children are laid out in the sheet's own px (0,0 = top left).
export const PaperSheet: React.FC<{
  src: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rot?: number;
  brightness?: number;
  shadow: string;
  light?: string;
  children?: React.ReactNode;
}> = ({ src, x, y, w, h, rot = 0, brightness = 1, shadow, light, children }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w,
      height: h,
      transform: rot ? `rotate(${rot}deg)` : undefined,
      boxShadow: shadow,
      overflow: "hidden",
    }}
  >
    <Img
      src={asset(src)}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        filter: brightness !== 1 ? `brightness(${brightness})` : undefined,
      }}
    />
    {light ? <div style={{ position: "absolute", inset: 0, background: light }} /> : null}
    {children}
  </div>
);

// A lifted RGBA cut-out (sheet, pin, pin shadow) with its top-left at (x, y), scale s, optional rotation.
export const Cutout: React.FC<{
  src: string;
  w: number;
  h: number;
  x: number;
  y: number;
  s: number;
  rot?: number;
  style?: React.CSSProperties;
}> = ({ src, w, h, x, y, s, rot = 0, style }) => (
  <Img
    src={asset(src)}
    style={{
      position: "absolute",
      left: n(x),
      top: n(y),
      width: n(w * s),
      height: n(h * s),
      transform: rot ? `rotate(${rot}deg)` : undefined,
      transformOrigin: "50% 50%",
      ...style,
    }}
  />
);

// ---------------------------------------------------------------------------------------------------------------
// Screen-space finish: vignette and moving film grain
// ---------------------------------------------------------------------------------------------------------------

export const Vignette: React.FC<{ strength: number; inner?: number; at?: string }> = ({
  strength,
  inner = 45,
  at = "50% 42%",
}) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse 80% 62% at ${at}, rgba(0,0,0,0) ${inner}%, rgba(0,0,0,${strength}) 100%)`,
      pointerEvents: "none",
    }}
  />
);

// Two-sided grain (overlay blend around mid grey), a new pattern every frame: lightens and darkens like film.
export const FilmGrain: React.FC<{ frame: number; amount: number; freq?: number }> = ({ frame, amount, freq = 0.9 }) => {
  const k = amount;
  const off = n(0.5 - 0.5 * k);
  const row = `${k} 0 0 0 ${off}`;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, mixBlendMode: "overlay" }}>
      <filter id={`paperGrain${frame}`} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency={freq} numOctaves={1} seed={frame + 11} result="t" />
        <feColorMatrix in="t" type="matrix" values={`${row}  ${row}  ${row}  0 0 0 0 1`} />
      </filter>
      <rect x={0} y={0} width={1080} height={1920} filter={`url(#paperGrain${frame})`} />
    </svg>
  );
};

// The slow camera: a push-in about a focus point plus a small drift, all one smooth curve from f0 to the last
// frame (no hold-move-hold). Returns the CSS transform for the world container (world = 1080x1920 at k 1).
export const driftTransform = (t: number, k0: number, k1: number, fx: number, fy: number, dx: number, dy: number) => {
  // ease-in at the start only, then a steady creep that is still moving on the last frame
  const e = t < 0.25 ? (t * t) / 0.5 : t - 0.125;
  const u = e / 0.875;
  const k = k0 + (k1 - k0) * u;
  const tx = fx - fx * k + dx * u;
  const ty = fy - fy * k + dy * u;
  return { k, css: `translate(${n(tx)}px, ${n(ty)}px) scale(${n(k)})` };
};
