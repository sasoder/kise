// ---------------------------------------------------------------------------
// GradualStart (nik-trend-friend, cut 9). Cheeky Pint style (stout) (styles/cheeky-pint.md).
// Opaque 1080x1920, 23.976 fps, 50 frames. Palette B1 (the stoutShared default).
// World: betCurves.tsx (builder A's chart world, imported, never edited); the same chart as cut A, 2 s earlier.
//
// CHECK LINE: "A slow-burn product is one whose line crawls along the floor while every earlier bet has already
// climbed away above it."
//
// THE LINE (John Collison): "[Have you ever had slow-burn products that,] for whatever reason, had a gradual start,"
// WORD -> FRAME: whatever 4 · reason 11 · had 24 · a 27 · gradual 29 · start 37.
// DURATION: the slot 9.676 -> 11.762 s = 2.086 s x 23.976 = 50 frames (f0..f49).
//
// THE MOTION: the history is already drawn: all 40 earlier bets fan out of the origin to month 12, board tone, a
// little dimmed, A's leader still in the fan as a thin dull-amber line (5 px, no bloom, amber mixed toward the board:
// context that stays warmer than the pack but never outshines the cream tile). One cream Revolut product tile (the R) creeps
// right at constant speed from month 2.2 to month 5.2 (one month clock, never stops), drawing a nearly flat cream line
// just above the axis rule: the same curve shape as the pack at a fifth of its median (a scaled copy, so it never
// takes off). The camera does not pan with it: one long slight pull-back and drift (k 0.89 -> 0.79) keeps the origin
// and the whole MONTHS SINCE LAUNCH in frame, and the tile crosses the frame (x ~400 -> ~745) over the numerals 3, 4, 5
// (above them at f13, f29 "gradual", f46); the gap between it and the lowest pack line widens from
// a touch (f0) to ~60 px (f49) while the fan soars out of the top of the frame. Last frame: still creeping, camera
// still drifting; no take-off, no amber on the slow line (it has not earned it).
// AMBER = the signal that a bet is working (traction, COMMON.md); cream = the slow product; board = the pack.
//
// NO DATA: proxy shapes only. SOURCES: none (the pack is betCurves' unlabelled proxy for Nik's "historical data on
// performance of say about 100 bets"; the x unit is Nik's months since launch). Revolut's R: revolutMark.ts.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { COLOR, StoutStage, amberBandFor, mixHex } from "../kits/cheeky-pint/stoutShared";
import { UnionShadow, makeClockCam } from "../kits/cheeky-pint/museShared";
import { Axis, BetLine, PackFan, monthX, pathTo, revY, samplerOf, shapeG } from "./betCurves";
import { HERO } from "./RaceOnTheCurve";

export const FPS = 24000 / 1001;
export const DURATION = 50;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// --- the month clock: constant speed, never stops ----------------------------------------------------------------
export const M0 = 2.2;
export const M1 = 5.2;
export const monthAt = (f: number) => M0 + ((M1 - M0) * f) / (DURATION - 1);

/** The slow product: the pack's own shape at coefficient 46 (the pack's lowest line is ~82, its median 230). */
export const SLOW_A = 46;
export const SLOW = (m: number) => SLOW_A * shapeG(m);

// --- the camera: no pan with the tile, only one long slight pull-back + drift, already moving at f0 and still moving
// at f49. The origin and the whole axis title stay in frame (title left edge x 107 -> 126); the tile does the
// travelling across the frame (x 399 at f0 -> x 745 at f49).
export const CAM = makeClockCam({ x: 478, y: 30, k: 0.92 }, [{ f0: -40, f1: 90, dx: 60, dy: -25, k: 0.75 }], DURATION);

/** A's leader, kept high in the fan as a thin amber line (it worked: amber), drawn to month 12 like the history. */
const LEADER_D = pathTo(samplerOf(HERO), 12, 0.04);
const LEADER_PX = 5; // screen px: thinner than a pack line (6.5): context, never the subject
/** A dull amber: amber mixed well toward the board and sunk a little toward the ground, no bloom. Warmer than the pack
 *  lines, dimmer than the cream tile and its line (the cream product stays the brightest thing in frame). */
const LEADER_TONE = mixHex(mixHex(COLOR.amberFoot, COLOR.board, 0.5), COLOR.ground, 0.2);

const GradualStart: React.FC<z.infer<typeof schema>> = () => {
  const S = useCurrentFrame();
  const cam = CAM.at(S);
  const k = cam.k;
  const m = monthAt(S);
  const tile = { x: monthX(m), y: revY(SLOW(m)) };
  const W = LEADER_PX / k;
  return (
    <StoutStage S={S} cam={cam} rest={CAM.rest} pool={{ x: tile.x + 60, y: tile.y - 260, strength: 1.2 }}>
      <Axis k={k} yTitle={false} />
      <PackFan month={12} k={k} dim={0.2} />
      <UnionShadow sil={[{ d: LEADER_D, stroke: W }]} s={0.35} elevation="rest" />
      <path d={LEADER_D} fill="none" stroke={LEADER_TONE} strokeWidth={W} strokeLinecap="round" strokeLinejoin="round" />
      <BetLine rev={SLOW} month={m} k={k} band={amberBandFor(cam)} amber={0} />
    </StoutStage>
  );
};

export default GradualStart;
