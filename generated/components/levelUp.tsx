import React from "react";
import { Easing } from "remotion";
import { z } from "zod";
import { clamp01, hash, smoothstep } from "./fieldShared";

// ---------------------------------------------------------------------------
// Sep 2026 experiments on the Orange Dwarkesh style, tried on
// Ajeya_The_Investigation. Dialable; nothing here is written into fieldShared yet.
//
// - EASE_ARRIVE / EASE_MOVE / EASE_PAYOFF / ease: the only three curves a piece
//   in this set may use — arrivals, self-propelled travel and camera, and the
//   one overshoot landing per cut.
// - LEGATO / legatoStart: the overlap that turns a run of arrivals into one
//   phrase instead of stop-then-start.
// - TRAIL_* / trailFactor / Trail / Streak: motion smear on a moving head,
//   scaled by its SCREEN speed, so a fast gesture reads at 24 fps.
// - WAVE_FRONT_* / softFront: a tone wave crosses a crowd over ~3 rows on a
//   smoothstep instead of snapping row by row.
// - HIGHLIGHT / HIGHLIGHT_FRAMES / highlightTone: the half-step brighter tone,
//   two frames, on the ONE payoff a brief names.
// - DEPTH_BANDS / depthBand / depthK: cut 1 only — three parallax bands, so a
//   camera move separates near dots from far ones by a hair.
// - ExperimentsSchema / Experiments: the prop every piece in the set declares,
//   so any experiment can be switched off without touching the piece.
// ---------------------------------------------------------------------------

// --- Eases -----------------------------------------------------------------
/** Things that arrive or land: a thread's head reaching its target, a line
 *  drawing to completion, a mark settling, a panel growing. */
export const EASE_ARRIVE = Easing.out(Easing.cubic);
/** The camera, and things that travel under their own power. */
export const EASE_MOVE = Easing.inOut(Easing.cubic);
/** Exactly one landing per cut. The only overshoot in the piece. */
export const EASE_PAYOFF = Easing.out(Easing.back(1.5));
/** Apply an ease to a raw progress, clamped to 0..1 first. */
export const ease = (u: number, fn: (v: number) => number) => fn(clamp01(u));

// --- Legato ----------------------------------------------------------------
/** Frames of overlap between consecutive gestures. */
export const LEGATO = 5;
/** The frame gesture n+1 starts, if gesture n ends at `fEnd`. */
export const legatoStart = (fEnd: number) => fEnd - LEGATO;

// --- Trails ----------------------------------------------------------------
// All speeds are SCREEN px/frame: the caller passes the camera's k, because a
// head crossing the world slowly is still fast on screen when pushed in.
export const TRAIL_FRAMES = 3;
export const TRAIL_OPACITY = [0.45, 0.22, 0.08];
export const TRAIL_MIN_SPEED = 8;
export const TRAIL_FULL_SPEED = 24;

/** 0 below TRAIL_MIN_SPEED, 1 at or above TRAIL_FULL_SPEED. */
export const trailFactor = (speedScreen: number) =>
  clamp01((speedScreen - TRAIL_MIN_SPEED) / (TRAIL_FULL_SPEED - TRAIL_MIN_SPEED));

type At = (f: number) => { x: number; y: number } | null;

const screenSpeed = (at: At, frame: number, k: number) => {
  const now = at(frame);
  const prev = at(frame - 1);
  if (!now || !prev) return null;
  return Math.hypot(now.x - prev.x, now.y - prev.y) * k;
};

/** The last TRAIL_FRAMES positions of a dot or thread head, at falling opacity
 *  and radius. Drawn in WORLD coordinates — put it inside the world transform.
 *  Pure function of frame; no state. */
export const Trail: React.FC<{
  frame: number;
  k: number;
  at: At;
  r: number;
  fill: string;
  opacity?: number;
  enabled?: boolean;
}> = ({ frame, k, at, r, fill, opacity = 1, enabled = true }) => {
  if (!enabled) return null;
  const speed = screenSpeed(at, frame, k);
  if (speed === null) return null;
  const factor = trailFactor(speed);
  if (factor === 0) return null;
  return (
    <>
      {TRAIL_OPACITY.map((op, i) => {
        const p = at(frame - (i + 1));
        if (!p) return null;
        return (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={r * (1 - 0.15 * (i + 1))}
            fill={fill}
            opacity={opacity * op * factor}
          />
        );
      })}
    </>
  );
};

/** The same smear for a fast LINE head: one streak from where it was
 *  TRAIL_FRAMES ago to where it is now. World coordinates. */
export const Streak: React.FC<{
  frame: number;
  k: number;
  at: At;
  stroke: string;
  width: number;
  opacity?: number;
  enabled?: boolean;
}> = ({ frame, k, at, stroke, width, opacity = 1, enabled = true }) => {
  if (!enabled) return null;
  const speed = screenSpeed(at, frame, k);
  if (speed === null) return null;
  const factor = trailFactor(speed);
  if (factor === 0) return null;
  const now = at(frame);
  const back = at(frame - TRAIL_FRAMES);
  if (!now || !back) return null;
  return (
    <line
      x1={back.x}
      y1={back.y}
      x2={now.x}
      y2={now.y}
      stroke={stroke}
      strokeWidth={width}
      strokeLinecap="round"
      opacity={opacity * 0.35 * factor}
    />
  );
};

// --- Soft wave front -------------------------------------------------------
export const WAVE_FRONT_ROWS = 3;
// The field's nominal row pitch is 440/29 world px; it is not exported from
// fieldShared, so it is written out once here and nowhere else in this module.
export const WAVE_FRONT_WIDTH = WAVE_FRONT_ROWS * (440 / 29);

/** 0 ahead of the front, 1 behind it, smooth across `width` world px. */
export const softFront = (dist: number, front: number, width: number = WAVE_FRONT_WIDTH) =>
  smoothstep(clamp01((front - dist) / width));

// --- Highlight -------------------------------------------------------------
/** Half a step brighter than ACCENT. The one payoff per cut, nowhere else. */
export const HIGHLIGHT = "#FFD98A";
export const HIGHLIGHT_FRAMES = 2;

export const highlightTone = (frame: number, f0: number, base: string, enabled = true) =>
  enabled && frame >= f0 && frame < f0 + HIGHLIGHT_FRAMES ? HIGHLIGHT : base;

// --- Depth bands (cut 1 only) ----------------------------------------------
export const DEPTH_BANDS = [0.97, 1.0, 1.03] as const;

/** A stable band per seat, from the field's own hash. */
export const depthBand = (seed: number) => DEPTH_BANDS[Math.floor(hash(seed, 9) * 3) % 3];

/** A band's dots are drawn with `worldTransform(cx, cy, depthK(k, band))`, so
 *  nearer dots move and scale a hair more than farther ones during a move. */
export const depthK = (k: number, band: number, enabled = true) => (enabled ? k * band : k);

// --- The shared prop -------------------------------------------------------
export const ExperimentsSchema = z.object({
  trails: z.boolean().default(true),
  legato: z.boolean().default(true),
  softFront: z.boolean().default(true),
  highlight: z.boolean().default(true),
  depth: z.boolean().default(true),
});
export type Experiments = z.infer<typeof ExperimentsSchema>;
