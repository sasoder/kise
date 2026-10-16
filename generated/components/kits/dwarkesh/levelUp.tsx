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

// ---------------------------------------------------------------------------
// v2 — the sleek pass (Sep 2026). On the director's note that the delivered set
// looked "a bit unfinished ... too static": these are LIFE ON WHAT ALREADY
// EXISTS, not new gestures. Nothing below changes anything above it.
//
// - HOLD_DRIFT_* / holdDriftK: nothing is ever parked, the camera included.
// - PACKET_* / packetsOn / Packet: signal travelling on every live line.
// - DARK_TRAFFIC_OPACITY: the unlooked-at field is unseen, not dead.
// - arriveEase / arriveDuration: a head decelerates into its landing instead
//   of stopping dead, and still lands on the same frame.
// - MARCH_PX / marchDash: a dashed (uncertain) edge keeps moving.
// - WAKE_LEAD: an agent lights BEFORE its thread launches.
// ---------------------------------------------------------------------------

// --- No parked camera ------------------------------------------------------
/** Screen px/frame a fixed world point should still move during a hold. */
export const HOLD_DRIFT_PX = 1.2;
/** Above this a "hold" reads as a move. A drift must never exceed it. */
export const HOLD_DRIFT_MAX = 1.5;

/** The k a hold should END on, so that a world point sitting `screenDist`
 *  screen px from the camera centre keeps drifting at HOLD_DRIFT_PX per frame
 *  across `frames` frames. `sign` continues the last move's direction: +1 a
 *  push that keeps closing, -1 a pull-back that keeps opening.
 *
 *  The caller feeds it to `camMove` as an EXTRA segment with warp 1.0, running
 *  from the landed value:
 *    camMove({ f0: land, f1: land + frames, k0: kLanded, k1:
 *      holdDriftK(kLanded, frames, screenDist, -1), c0, c1: c0, warp: 1 })
 *  Because it starts from the landed k, the landing itself does not move. */
export const holdDriftK = (k0: number, frames: number, screenDist: number, sign: 1 | -1) =>
  k0 * (1 + (sign * HOLD_DRIFT_PX * frames) / screenDist);

// --- Signal on every live line ---------------------------------------------
/** World px/frame, nominal — capped below so a packet never crosses the screen
 *  faster than the set's ceiling (divide by k once k > 45 / PACKET_SPEED). */
export const PACKET_SPEED = 26;
/** Frames between launches on one line. */
export const PACKET_PERIOD = 22;
export const PACKET_R = 3;
/** A hero line's packets. */
export const PACKET_HERO = 0.6;
/** An ambient line's packets. Packets never go on a dim or receded line. */
export const PACKET_AMBIENT = 0.4;

// The set's speed ceiling: a head faster than this strobes at 24 fps.
const SPEED_CAP_SCREEN = 45;

/** Every packet currently in flight on the segment from->to, in WORLD
 *  coordinates, oldest (furthest along) first. Pure.
 *
 *  Launches are `period` frames apart starting at `phase`, plus a hashed
 *  sub-period offset from `seed` so two lines handed the same phase do not
 *  march in lockstep (pass phase 0 and a seed to get the hashed phase for
 *  free). `speed` is world px/frame, capped at SPEED_CAP_SCREEN / k so the
 *  screen speed stays inside the set's ceiling. `opacity` <= 0 returns nothing:
 *  a dim (0.22) or receded line carries no signal. */
export const packetsOn = ({
  frame,
  k,
  from,
  to,
  period,
  phase,
  speed = PACKET_SPEED,
  opacity,
  seed,
}: {
  frame: number;
  k: number;
  from: { x: number; y: number };
  to: { x: number; y: number };
  period: number;
  phase: number;
  speed?: number;
  opacity: number;
  seed: number;
}): { x: number; y: number; u: number }[] => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy);
  if (len <= 0 || period <= 0 || opacity <= 0 || speed <= 0) return [];
  const v = Math.min(speed, SPEED_CAP_SCREEN / Math.max(k, 0.0001));
  const travel = len / v; // frames end to end
  const first = phase + hash(seed, 41) * period;
  // A packet stays alive for a whole frame past the end of its travel, so it is
  // drawn once at u === 1 (on the target) instead of vanishing a step short.
  const life = Math.ceil(travel);
  const nMax = Math.floor((frame - first) / period);
  const nMin = Math.max(0, Math.ceil((frame - first - life) / period));
  const out: { x: number; y: number; u: number }[] = [];
  for (let n = nMin; n <= nMax; n++) {
    const u = clamp01((frame - (first + n * period)) / travel);
    out.push({ x: from.x + dx * u, y: from.y + dy * u, u });
  }
  return out;
};

/** One packet: a white head of PACKET_R with the existing `Trail` behind it.
 *  WORLD coordinates — put it inside the world transform, over its line. */
export const Packet: React.FC<{
  frame: number;
  k: number;
  at: At;
  opacity: number;
  enabled?: boolean;
}> = ({ frame, k, at, opacity, enabled = true }) => {
  if (!enabled) return null;
  const p = at(frame);
  if (!p) return null;
  return (
    <>
      <Trail frame={frame} k={k} at={at} r={PACKET_R} fill="#FFFFFF" opacity={opacity} />
      <circle cx={p.x} cy={p.y} r={PACKET_R} fill="#FFFFFF" opacity={opacity} />
    </>
  );
};

// --- Dark traffic ----------------------------------------------------------
/** Idle threads over an unlooked-at (OP_DARK) field: accent, no heads. The
 *  field is unseen, not dead. A seat's traffic becomes normal traffic the
 *  moment the wave lights it. */
export const DARK_TRAFFIC_OPACITY = 0.12;

// --- Arrive, don't stop dead -----------------------------------------------
/** Travel fraction for a head that cruises at a constant speed and then
 *  decelerates on EASE_ARRIVE over the last `tail` of its TRAVEL (distance).
 *
 *  `u` is the fraction of the gesture's duration, the result the fraction of
 *  its distance. The cruise lasts t1 = (1 - tail) / (1 + 2 * tail) of the
 *  duration; the cruise speed is (1 + 2 * tail) x the average, which is the
 *  scale that makes the two halves meet with no step in speed AND keeps the
 *  total duration equal to the constant-speed one. C0 (and C1), monotone,
 *  arriveEase(0) === 0, arriveEase(1) === 1.
 *
 *  Check the cruise speed against the 45 screen px/frame ceiling: it is
 *  1.3 x the nominal speed at the default tail. */
export const arriveEase = (u: number, tail = 0.15) => {
  const t = clamp01(tail);
  if (t <= 0) return clamp01(u);
  const x = clamp01(u);
  const t1 = (1 - t) / (1 + 2 * t);
  if (x <= t1) return x * (1 + 2 * t);
  return 1 - t + t * ease((x - t1) / (1 - t1), EASE_ARRIVE);
};

/** Frames a head needs to cover `dist` with `arriveEase` at nominal `speed`.
 *  The ease redistributes the speed inside the gesture and does not lengthen
 *  it, so this IS dist / speed: a landing keeps its frame. `tail` is accepted
 *  so a caller states the pair it is using in one place. */
export const arriveDuration = (dist: number, speed: number, tail = 0.15) => {
  if (speed <= 0) return 0;
  if (Math.abs(arriveEase(1, tail) - 1) > 1e-9) {
    throw new Error(`arriveEase(1, ${tail}) must be 1`);
  }
  return dist / speed;
};

// --- Uncertain edges move --------------------------------------------------
/** World px a dashed edge's dashes advance per frame. */
export const MARCH_PX = 0.6;

/** `strokeDashoffset` for a dashed edge that marches in the direction it was
 *  drawn, from the frame `f0` it finished. 0 before that. */
export const marchDash = (frame: number, f0: number) =>
  frame <= f0 ? 0 : -(frame - f0) * MARCH_PX;

// --- Wake before you act ---------------------------------------------------
/** Frames an agent goes deep -> ripe BEFORE its thread launches, so the crowd
 *  wakes into the gesture instead of on it. LEGATO, applied to the tone. */
export const WAKE_LEAD = 8;

// --- The shared prop -------------------------------------------------------
export const ExperimentsSchema = z.object({
  trails: z.boolean().default(true),
  legato: z.boolean().default(true),
  softFront: z.boolean().default(true),
  highlight: z.boolean().default(true),
  depth: z.boolean().default(true),
  drift: z.boolean().default(true),
  packets: z.boolean().default(true),
  darkTraffic: z.boolean().default(true),
  arrive: z.boolean().default(true),
  march: z.boolean().default(true),
  wake: z.boolean().default(true),
});
export type Experiments = z.infer<typeof ExperimentsSchema>;
