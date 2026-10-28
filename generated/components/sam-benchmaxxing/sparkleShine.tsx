// ---------------------------------------------------------------------------
// sparkleShine — the shine and the glitter of cut 26 NotToBenchmax (sam-benchmaxxing), the one place in this clip
// where a sparkle is allowed (the user asked for it: "a glitter sparkle on the OpenAI logo like it's shining").
// Deterministic, driven only by the frame passed in. Drawn in SVG user units (screen px in cut 26).
//
//   ShineSweep  one diagonal band of light crossing a card face, top-left -> bottom-right, clipped to the face:
//               a hot-white core (it lifts the ink mark hard, so it reads on cream) with soft amber edges.
//   Glint       one crisp four-point star (concave arms) in amberHot / cream with a tiny cream core, a short
//               diagonal cross and a small soft amber halo; it grows fast, turns a few degrees and shrinks slower.
//   glintLife   the 0..1 envelope of a glint born at `at` that lives `life` frames.
//
// Classy and small: no lens flares, no rays across the frame, no screen-wide bloom. Amber here = the shine.
// ---------------------------------------------------------------------------
import React, { useId } from "react";
import { COLOR } from "../kits/cheeky-pint/stoutShared";

const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const uidOf = (raw: string) => `ss${raw.replace(/[^A-Za-z0-9_-]/g, "_")}`;
const smooth = (t: number) => {
  const x = c01(t);
  return x * x * (3 - 2 * x);
};

/** the shine's hot white: a warm white a step above the card's cream */
export const SHINE_WHITE = "#FFFBF2";

// ===========================================================================
// THE SWEEP
// ===========================================================================
export type ShineSweepProps = {
  /** the face the band is clipped to (its path, same units) */
  clip: string;
  /** the face's box: the band travels its diagonal */
  box: { x: number; y: number; w: number; h: number };
  /** 0..1: the band's centre from beyond the top-left corner to beyond the bottom-right corner */
  progress: number;
  /** band width as a share of the box's width (the whole soft band; the hot core is about a third of it) */
  width?: number;
  /** the band's angle from vertical, degrees (45 = a true diagonal, perpendicular to the travel) */
  angle?: number;
  /** overall strength 0..1 */
  strength?: number;
};
/**
 * ShineSweep — one diagonal band across a card face. The band's axis runs top-left -> bottom-right; its stripes are
 * perpendicular to that travel. Outside 0 < progress < 1 it draws nothing.
 */
export const ShineSweep: React.FC<ShineSweepProps> = ({ clip, box, progress, width = 0.44, angle = 45, strength = 1 }) => {
  const uid = uidOf(useId());
  if (progress <= 0 || progress >= 1 || strength <= 0.002) return null;
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  // the travel axis, unit vector, rotated `angle` from vertical toward the right-down diagonal
  const a = (angle * Math.PI) / 180;
  const ux = Math.sin(a);
  const uy = Math.cos(a);
  // half the face's extent along the axis, plus half a band so it starts and ends fully off the face
  const half = (Math.abs(ux) * box.w + Math.abs(uy) * box.h) / 2;
  const bw = width * box.w;
  const reach = half + bw * 0.6;
  const s = -reach + 2 * reach * progress;
  const mx = cx + ux * s;
  const my = cy + uy * s;
  // the gradient runs along the axis across the band
  const x1 = mx - (ux * bw) / 2;
  const y1 = my - (uy * bw) / 2;
  const x2 = mx + (ux * bw) / 2;
  const y2 = my + (uy * bw) / 2;
  const k = c01(strength);
  return (
    <g style={{ pointerEvents: "none" }}>
      <defs>
        <clipPath id={`${uid}c`}>
          <path d={clip} />
        </clipPath>
        <linearGradient id={`${uid}g`} gradientUnits="userSpaceOnUse" x1={f3(x1)} y1={f3(y1)} x2={f3(x2)} y2={f3(y2)}>
          <stop offset="0" stopColor={COLOR.amberTop} stopOpacity="0" />
          <stop offset="0.12" stopColor={COLOR.amberTop} stopOpacity={f3(0.24 * k)} />
          <stop offset="0.24" stopColor={COLOR.amberHot} stopOpacity={f3(0.72 * k)} />
          <stop offset="0.34" stopColor={SHINE_WHITE} stopOpacity={f3(0.98 * k)} />
          <stop offset="0.5" stopColor={SHINE_WHITE} stopOpacity={f3(1 * k)} />
          <stop offset="0.66" stopColor={SHINE_WHITE} stopOpacity={f3(0.96 * k)} />
          <stop offset="0.78" stopColor={COLOR.amberHot} stopOpacity={f3(0.6 * k)} />
          <stop offset="0.9" stopColor={COLOR.amberTop} stopOpacity={f3(0.2 * k)} />
          <stop offset="1" stopColor={COLOR.amberTop} stopOpacity="0" />
        </linearGradient>
      </defs>
      <g clipPath={`url(#${uid}c)`}>
        <rect x={f3(box.x - 20)} y={f3(box.y - 20)} width={f3(box.w + 40)} height={f3(box.h + 40)} fill={`url(#${uid}g)`} />
      </g>
    </g>
  );
};
/** the sweep's eased progress for a sweep that runs [f0, f0 + frames): a quick, even pass that slows a touch at the end */
export const sweepAt = (f: number, f0: number, frames: number) => {
  const t = (f - f0) / frames;
  if (t <= 0 || t >= 1) return t <= 0 ? 0 : 1;
  return 0.35 * t + 0.65 * (1 - Math.pow(1 - t, 1.8));
};

// ===========================================================================
// THE GLINTS
// ===========================================================================
/**
 * glintLife — the size envelope of a glint born at `at` living `life` frames: 0 before and after; a smooth grow to
 * full over the first ~38 % and a smooth, longer shrink over the rest.
 */
export const glintLife = (f: number, at: number, life: number) => {
  const u = (f - at) / life;
  if (u <= 0 || u >= 1) return 0;
  const peak = 0.38;
  return u < peak ? smooth(u / peak) : 1 - smooth((u - peak) / (1 - peak));
};
/** a four-point star with concave arms: arm length r, waist w (fraction of r) */
export const starPath = (r: number, waist = 0.13) => {
  const w = r * waist;
  return (
    `M0 ${f3(-r)}` +
    `Q${f3(w)} ${f3(-w)} ${f3(r)} 0` +
    `Q${f3(w)} ${f3(w)} 0 ${f3(r)}` +
    `Q${f3(-w)} ${f3(w)} ${f3(-r)} 0` +
    `Q${f3(-w)} ${f3(-w)} 0 ${f3(-r)}Z`
  );
};
export type GlintSpec = {
  /** offset from the anchor (the card's centre) in units of the card's half size */
  u: number;
  v: number;
  /** birth frame and life in frames */
  at: number;
  life: number;
  /** full arm length in px at the card's reference size */
  r: number;
  /** start angle (deg) and the turn over its life */
  rot?: number;
  spin?: number;
  /** "hot" = amberHot arms; "cream" = cream arms */
  tone?: "hot" | "cream";
  /** a small 45-degree cross behind the main star (off for the tiny secondary sparkles) */
  cross?: boolean;
};
export type GlintProps = { x: number; y: number; r: number; life01: number; t01: number; rot?: number; spin?: number; tone?: "hot" | "cream"; cross?: boolean };
/**
 * Glint — one star at (x, y), arm length r x the envelope `life01`; `t01` = its age 0..1 (for the turn).
 */
export const Glint: React.FC<GlintProps> = ({ x, y, r, life01, t01, rot = 0, spin = 18, tone = "hot", cross = true }) => {
  const uid = uidOf(useId());
  if (life01 <= 0.001) return null;
  const R = r * life01;
  const arm = tone === "hot" ? COLOR.amberHot : COLOR.cream;
  const ang = rot + spin * t01;
  return (
    <g transform={`translate(${f3(x)} ${f3(y)})`} style={{ pointerEvents: "none" }}>
      <defs>
        <radialGradient id={`${uid}h`}>
          <stop offset="0" stopColor={COLOR.amberTop} stopOpacity={f3(0.55 * life01)} />
          <stop offset="0.45" stopColor={COLOR.amberTop} stopOpacity={f3(0.2 * life01)} />
          <stop offset="1" stopColor={COLOR.amberTop} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${uid}a`} gradientUnits="userSpaceOnUse" cx="0" cy="0" r={f3(R)}>
          <stop offset="0" stopColor={SHINE_WHITE} />
          <stop offset="0.3" stopColor={arm} />
          <stop offset="1" stopColor={tone === "hot" ? COLOR.amberTop : COLOR.amberHot} />
        </radialGradient>
      </defs>
      {/* the small soft halo: about half the arm, never larger */}
      <circle r={f3(R * 0.55)} fill={`url(#${uid}h)`} />
      <g transform={`rotate(${f3(ang)})`}>
        {cross ? <path d={starPath(R * 0.42, 0.16)} transform="rotate(45)" fill={arm} opacity={0.85} /> : null}
        <path d={starPath(R)} fill={`url(#${uid}a)`} />
      </g>
      <circle r={f3(Math.max(1.2, R * 0.085))} fill={SHINE_WHITE} />
    </g>
  );
};
/**
 * Glitter — a set of glints anchored on a card: centre (cx, cy), half size `half` (px), each spec placed at
 * (u, v) x half, arm length r x `scale`.
 */
export const Glitter: React.FC<{ specs: readonly GlintSpec[]; f: number; cx: number; cy: number; half: number; scale?: number }> = ({ specs, f, cx, cy, half, scale = 1 }) => (
  <g>
    {specs.map((g, i) => {
      const L = glintLife(f, g.at, g.life);
      if (L <= 0) return null;
      return (
        <Glint
          key={i}
          x={cx + g.u * half}
          y={cy + g.v * half}
          r={g.r * scale}
          life01={L}
          t01={c01((f - g.at) / g.life)}
          rot={g.rot ?? 0}
          spin={g.spin ?? 18}
          tone={g.tone ?? "hot"}
          cross={g.cross ?? true}
        />
      );
    })}
  </g>
);
