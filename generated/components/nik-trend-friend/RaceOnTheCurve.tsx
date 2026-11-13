// ---------------------------------------------------------------------------
// RaceOnTheCurve (nik-trend-friend, cut 3). Cheeky Pint style (stout board) (styles/cheeky-pint.md).
// Opaque 1080x1920, 23.976 fps, 109 frames. Palette B1 (the stoutShared default).
//
// CHECK LINE: "Every Revolut product is plotted from its launch month against all the earlier ones, and its job is to
// climb to the front of that pack."
//
// THE LINE (John Collison): "well on a revenue cohort curve, where it's a little like a race,"
// WORD -> FRAME: well 10 · on 20 · a 30 · revenue 37 · cohort 48 · curve 59 · where 71 · it's 82 · a little 88 ·
// like 91 · a race 98.
// DURATION: the slot 3.045 -> 7.591 s = 4.546 s x 23.976 = 109 frames (f0..f108).
//
// REV 1 (director's review, approved 2026-11-13): rivals as tiles, a close front group passed one by one.
// THE MOTION: one month clock runs from f0 to the last frame (month 2 -> 6.5, constant speed): all 40 earlier bets
// draw themselves out of the origin at the same age, each tipped by a small board product tile, and Revolut's new
// product (the cream R tile, its cream line) draws among them, mid-pack. REV 2 (safe zones, user's note Nov 13): the
// camera opens on the origin (x ~230) with the axis rule at y ~946, numerals 1-6 and MONTHS SINCE LAUNCH inside the
// keep-in box (title foot <= y 1067 through f19) and the R tile above them (x ~500-530, y ~480 -> ~360), pulling back
// on the axis (k 0.90 -> 0.70); from ~f16 it rises, the axis sinks out through the bottom (below y 1440 by ~f48)
// and the tips become a column of runners; then one long rise with a slow push-in on the race (k 0.70 -> 0.83).
// Above the pack run five front runners close together; from f30 the cream tile passes them one after another, each runner's tile going
// behind it and coming out below: f39, f50, f58, f68, f79. The last pass (LEAD, derived from the curves: f79) turns
// its line and tile amber over 12 f (f79 -> f91, seven frames before "race" f98). It ends at the front OF the pack, a
// nose ahead of the runners stacked under it, the rest trailing down to the bottom, all still climbing, the camera
// still creeping. Pass-through, not a camera hold: the hero sits y ~480-620 through the passes (inside the keep-in
// box, y 290-1070, on every frame, with the runner being passed) and ends at y ~480, x ~705 by f108.
// AMBER = the signal that a bet is working (traction); cream = the new product; board = the pack (earlier bets).
//
// NO DATA: proxy shapes only. SOURCES: none. The pack is an unlabelled proxy shape for "historical data on performance of say about 100 bets"
// (Nik, same episode, ~19:00); no numbers on screen. The x unit (months since launch) is Nik's ("month one after
// launch ... month two, month three, month four, month 12"). Revolut's R: revolutMark.ts (Wikimedia Commons, PD).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { StoutStage, amberBandFor, smoothstep } from "../kits/cheeky-pint/stoutShared";
import { makeClockCam } from "../kits/cheeky-pint/museShared";
import { Axis, BET_TILE, BetLine, PackFan, keyedRev, monthX, packTipSize, packTop, revY } from "./betCurves";

export const FPS = 24000 / 1001;
export const DURATION = 109;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// --- the month clock: constant speed, never stops ------------------------------------------------------------------
export const M0 = 2;
export const M1 = 6.5;
export const monthAt = (f: number) => M0 + ((M1 - M0) * f) / (DURATION - 1);

// --- the new product: starts mid-pack, climbs through the pack, then passes the five front runners one by one ------
// Its coefficient is keyed so that each front runner comes out below its tile ~10 f after the last: f39, f50, f58,
// f68, f79 (each key = that runner's coefficient + the clearance at that month). After the last pass it settles to
// the pack's own shape: it leads the front group by one runner's spacing, a nose, all still climbing.
export const HERO_KEYS: readonly [number, number][] = [
  [0.8, 262], // the climb starts before the cut, so the line has no knee in frame
  [2, 325],
  [3.583, 442],
  [4.0, 469],
  [4.417, 496.5],
  [4.833, 524.5],
  [5.25, 556],
  [5.9, 568], // the settle is spread over a month and a half: no elbow where it stops gaining
  [6.8, 574],
];
export const HERO = keyedRev(HERO_KEYS);

/** The tone change, caused by taking the lead: cream -> amber over 12 f from LEAD. */
const TONE_F = 12;
const amberAt = (f: number) => smoothstep((f - LEAD) / TONE_F);

// --- the camera (REV 2, safe zones): one continuous move. A pull-back anchored on the axis (k ~0.90 -> 0.70, the rule
// held at y ~946, so the numerals and MONTHS SINCE LAUNCH sit inside the keep-in box through f19 with the R tile above
// them); a rise that starts under the pull-back's tail (f15.5) and sinks the axis out through the bottom; then one long
// rise with a slow push-in on the race (k 0.70 -> ~0.83) that carries the hero to y ~480 at the end. The delivered path
// (k 1.26 -> 0.85) cannot be rejoined: at k >= 0.85 the hero and the axis title only fit the box together until ~f12
// (they are 830 world px apart by f20), so the passes run at k ~0.70-0.80 instead of ~1.08-0.90.
export const CAM = makeClockCam(
  { x: 317, y: 16, k: 0.95 },
  [
    { f0: -14, f1: 24, dx: 140, k: 0.695 },
    { f0: 15.5, f1: 56, dx: 80, dy: -960 },
    { f0: 30, f1: 122, dx: 265, dy: -1130, k: 0.85 },
  ],
  DURATION,
);

/** LEAD: the first frame the product has CLEARED the pack: the highest pack tip (the last front runner) has come out
 *  from under the product's tile (tile half + tip half below the tile's centre). Derived from the curves: f79.
 *  The tip's world size depends on k; it is measured at LEAD_K, the delivered camera's k at the pass (0.9), so the
 *  approved beat stays f79 under the REV 2 camera (at its k ~0.77 the tip is 2 world px larger: ~1.5 screen px). */
const LEAD_K = 0.9;
export const LEAD = (() => {
  for (let f = 0; f < DURATION; f++) {
    const m = monthAt(f);
    if (HERO(m) - packTop(m) > BET_TILE / 2 + packTipSize(LEAD_K) / 2) return f;
  }
  return DURATION;
})();
if (LEAD !== 79) throw new Error(`RaceOnTheCurve: LEAD moved to f${LEAD} (approved f79)`);

const RaceOnTheCurve: React.FC<z.infer<typeof schema>> = () => {
  const S = useCurrentFrame();
  const cam = CAM.at(S);
  const k = cam.k;
  const m = monthAt(S);
  const hero = { x: monthX(m), y: revY(HERO(m)) };
  return (
    <StoutStage S={S} cam={cam} rest={CAM.rest} pool={{ x: hero.x - 40, y: hero.y + 260, strength: 1.4 }}>
      {/* no REVENUE up the origin: at the opening it would stand in the lower caption band (y 1320-1470) */}
      <Axis k={k} yTitle={false} />
      <PackFan month={m} k={k} />
      <BetLine rev={HERO} month={m} k={k} band={amberBandFor(cam)} amber={amberAt(S)} lift={0.5} />
    </StoutStage>
  );
};

export default RaceOnTheCurve;
