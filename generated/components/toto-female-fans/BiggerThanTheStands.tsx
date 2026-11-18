// ---------------------------------------------------------------------------
// BiggerThanTheStands (toto-female-fans, cut 44). Cheeky Pint style, the picture-book world (styles/cheeky-pint.md).
// Opaque 1080x1920, 25 fps, 119 frames. World: fansWorld.tsx (the grandstand, its screen, the steep bank, the track
// in front; the fans in the cabinCast grammar), shared with cut 55 FortyTwoPercent. Revision 3 (the end framing raised).
//
// CHECK LINE: "F1's crowd grew far bigger than the grandstands were built for."
//
// THE LINE: "...that's why we've | attracted audience in sheer size that we didn't expect before. | Our strongest
// growing..."
// WORD -> FRAME (from the composition start, notes/brief_A_fans.md): attracted 2 · audience 7 · that 18 · in 28 ·
// sheer 51 · size 59 · that 73 · we 83 · didn't 85 · expect 92 · before 98 (ends ~104) · Our 106.
// DURATION: the slot 44.200 -> 48.960 s = 4.76 s x 25 = 119 frames (f0..f118).
//
// THE MOTION: f0 close on the modest grandstand (five tiers stepping up and back, stairs in three aisles, a cantilever
// roof on thin posts; ~840 px wide), tiers 0-2 seated, the top two tiers' sage seats still empty, a file of fans
// climbing each side aisle's stairs out of the concourse behind the front wall and filing into its half-tier; each
// block sits down together (tier 3 ~f7, tier 4 ~f19: the stand is full before "in"). On the big screen above the
// roof the race is live: a cream F1 car crosses the screen's track every 44 frames. From f20 the bank beside and behind
// the stand fills, row by row from the bottom: each row a file walking in from beyond both frame edges at one
// constant pace (BANK_V 46 px/f, an eased 4-frame stop), the rows level with the stand stopping tucked against its
// stepped side, the higher rows meeting behind the screen; each row stops 4 frames after the pulling-out frame
// first shows its height, so the crowd keeps climbing out of the top of the frame. Last, a row walks in along the
// boarded railing at the track (stops f98), waist up over the boards. The camera holds close, then runs ONE eased
// pull-out f22 -> f106 (k 0.95 -> 0.50) over a slow drift out, and ends on the drift. r3: from f40 the camera also
// tilts down onto the world (the stand's middle eases from r2's path to its rest over f40 -> f88; f0-f39 are r2's,
// pixel for pixel), so at rest the stand ~395 px wide stands with its screen at y ~700-1066 (clear of the caption
// band from f88 on), a cream island in a bank of fans that climbs to the crest at y ~195 and runs off both frame
// edges, a thin band of trees and sky above, the track thinned below; flags waving, bodies swaying, the race still
// running on the screen.
// CAUSE: every fan arrives on foot (up the stairs out of the concourse, or walking in from beyond the frame edge);
// nobody appears in place. Nothing passes over a seated fan (each half-tier fills an empty tier).
// AMBER = F1's fans (every fan's scarf); cream = the stand (what was built), board = context. No text, no numbers.
//
// SOURCES: none on screen (no text, no numbers, no logo).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { clamp01 } from "../kits/cheeky-pint/stoutShared";
import { FansStage, type FanCam, type Terrace } from "./fansWorld";

export const FPS = 25;
export const DURATION = 119;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// --- the camera ------------------------------------------------------------------------------------------------
export const CAM44 = {
  /** f0: the stand ~840 px wide; the ground line under it at y 1330 (the composition +190) */
  k0: 0.95,
  /** the pull's end (before the drift): the stand ~395 px wide at f118 */
  k1: 0.5,
  gy: 1330,
  pullFrom: 22,
  pullTo: 106,
  /** the drift (log k per frame) that runs under the whole cut */
  drift: -0.001,
  /** r3 tilt: the camera's final framing sits higher on the world (the stand clear of the caption band y 1080+, the
   * bank climbing to near the top, the track thinner). The screen y of a stand anchor (the stand's middle, world
   * height TILT_H) blends from r2's path to its rest position over f40 -> f88 (every frame before f40 is r2's); at
   * rest the ground line under the stand is at gyEnd (f118), so it is out of the band on every frame from f~88 on. */
  gyEnd: 1066,
  tiltH: 300,
  tiltFrom: 40,
  tiltTo: 88,
  /** the screen y whose world height times each bank row's stop: r2's 330, rising with the tilt to 100 */
  refY0: 330,
  refY1: 100,
} as const;
const smoother = (u: number) => {
  const t = clamp01(u);
  return t * t * t * (t * (6 * t - 15) + 10);
};
export const pullAt = (f: number) => smoother((f - CAM44.pullFrom) / (CAM44.pullTo - CAM44.pullFrom));
/** the tilt's progress: 0 until f40, 1 from f88 */
export const tiltAt = (f: number) => smoother((f - CAM44.tiltFrom) / (CAM44.tiltTo - CAM44.tiltFrom));
const kAtF = (f: number) => Math.exp(Math.log(CAM44.k0) + (Math.log(CAM44.k1) - Math.log(CAM44.k0)) * pullAt(f) + CAM44.drift * f);
/** the anchor's rest screen y: the ground at gyEnd on the last frame */
const ANCHOR_REST = CAM44.gyEnd - CAM44.tiltH * kAtF(DURATION - 1);
export const camAt = (f: number): FanCam => {
  const p = pullAt(f);
  const k = kAtF(f);
  // r2's ground line; the anchor's screen y on it, blended to its rest; the ground line back from the anchor
  const gy2 = CAM44.gy + 70 * p;
  const w = tiltAt(f);
  const anchor = (gy2 - CAM44.tiltH * k) * (1 - w) + ANCHOR_REST * w;
  const gy = w > 0 ? anchor + CAM44.tiltH * k : gy2;
  return { x: 6 - 0.12 * f, k, gy, dx: 0.8 * Math.sin(f / 13.1), dy: 0.6 * Math.sin(f / 10.3) };
};

// --- the bank's schedule: each row stops 4 frames after the frame first shows its height (screen y 330, rising
// with the tilt to y 100 so the rows up to the crest arrive) ----------------------------------------------------------
const firstShows = (H: number) => {
  for (let f = 0; f <= DURATION; f += 0.25) {
    const c = camAt(f);
    const refY = CAM44.refY0 + (CAM44.refY1 - CAM44.refY0) * tiltAt(f);
    if ((c.gy - refY) / c.k >= H) return f;
  }
  return DURATION;
};
const scheduleCache = new Map<number, number>();
export const hillT44 = (t: Terrace) => {
  const hit = scheduleCache.get(t.j);
  if (hit !== undefined) return hit;
  const v = Math.max(18 + 1.8 * t.j, firstShows(t.H) + 4);
  scheduleCache.set(t.j, v);
  return v;
};

const BiggerThanTheStands: React.FC<z.infer<typeof schema>> = () => {
  const S = useCurrentFrame();
  return <FansStage S={S} T={S} cam={camAt(S)} screenLit={0} hillT={hillT44} />;
};

export default BiggerThanTheStands;
