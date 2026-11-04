// ---------------------------------------------------------------------------
// LooksLikeStalemate (kofman-vivaldi, cut 11). ChinaTalk style (newsprint) (styles/chinatalk.md; kit API in
// generated/components/kits/chinatalk/chinatalkVintage.md). Delivered as 11_LooksLikeStalemate.mov.
// Opaque 1080x1920, 24 fps, 56 frames.
//
// CHECK LINE: "this is what people picture: one fixed front line drawn across the map, dug in, not moving."
//
// THE LINE: "[…a lot of folks who don't follow the war think that there] is a positional stalemate on the ground,"
// WORD -> FRAME: is 8 · a 19 · positional 22 · stalemate 33 · on the 43-45 · ground 48 · (cut back to the speaker 56).
// DURATION: the slot 11.375 -> 13.708 s = 2.333 s x 24 = 56 frames (f0..f55).
//
// THE MOTION: f0 is the real Lyman sector on 3 Nov 2026: Russian-occupied ground an ink wash under the house hatch on
// the right, Ukrainian ground bare paper, the Donets a hair, LYMAN. A red bead, already a third of the way down the
// frame at f0, writes ONE heavy red line down the real edge of the occupied ground (fast launch, settle: shootEase); it
// slows into the frame's bottom edge at f27-29 and has landed at "stalemate" 33, where the bead drains into the line.
// From there the line is still and dries; only the camera moves: one slow linear push from f0 to the last frame
// (k 0.885 -> 0.959, centre drifting 6 px east, 18 px south), keeping LYMAN below caption band 2 (screen y ~1503-1530).
// RED = the front line as people picture it. Nothing else is red.
// End state = cut 18's (SpaceReopened) start state: STALEMATE_END_CAM, STALEMATE_LINE, STALEMATE_WASH,
// STALEMATE_HATCH_K, STALEMATE_PLACES below.
//
// SOURCES: the occupied ground (OCC_20261103) and its edge (MAINFRONTOCC_20261103) are DeepStateMap (deepstatemap.live),
// snapshot of 3 Nov 2026, via lymanFrontData.ts (assets-src/kofman-vivaldi/build_lyman_data.py); the Donets: Natural
// Earth; Lyman: OpenStreetMap Nominatim. The SourceLine names DeepStateMap, 3 Nov 2026.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { SourceLine, VStage, clamp01, cumLen, enterFrom, runVCamera, shootEase, smoothstep } from "../kits/chinatalk/chinatalkVintage";
import type { Cam, Pt } from "../kits/chinatalk/chinatalkVintage";
import { MAINFRONTOCC_20261103, OCC_20261103 } from "./lymanFrontData";
import { FrontLine, LymanMap, toPts } from "./lymanShared";

export const FPS = 24;
export const DURATION = 56;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// --- the camera: one slow push from f0 to the last frame ------------------------------------------------
/** f0: ~55 km of front top to bottom, the occupied wash on the right ~third of the frame, Lyman below band 2 */
const CAM_OPEN: Cam = { x: 700, y: 870, k: 0.86 };
/** the push's target, keyed past the end so the follower is still creeping on the last frame */
const CAM_PUSH: Cam = { x: 712, y: 905, k: 1.0 };
const camAt = runVCamera(
  [
    { f: -24, ...CAM_OPEN },
    { f: DURATION + 24, ...CAM_PUSH, ease: "linear" },
  ],
  DURATION,
);
export { camAt };

/** the camera on the last frame (f55), full precision: cut 18 opens on it (add the house sway: VStage does) */
export const STALEMATE_END_CAM: Cam = camAt(DURATION - 1);
/** the hatch pitch is fixed at the push's middle zoom so the hatch stays locked to the world */
export const STALEMATE_HATCH_K = 0.92;
/** the wash: Russian-occupied ground, 3 Nov 2026, house hatch at rung 1 (its edge is the red line) */
export const STALEMATE_WASH = OCC_20261103;
/** the one place label (dot + "word" label) */
export const STALEMATE_PLACES = ["Lyman"] as const;

// --- the line: MAINFRONTOCC_20261103 from above the frame top to the frame's bottom edge, north to south --------------
/** fully written on this frame, the bead settling on the frame's bottom edge, at "stalemate" 33 */
const LAND = 33;
const LINE_Y0 = -460;
/** the line ends where the bottom edge is at LAND (+ a little: the bead sits half off the edge as it drains) */
const LINE_Y_END = camAt(LAND).y + 960 / camAt(LAND).k + 10;
const OCC_FRONT: Pt[] = toPts(MAINFRONTOCC_20261103);
const iFirst = OCC_FRONT.findIndex((p) => p.y > LINE_Y0);
const iEnd = OCC_FRONT.findIndex((p, i) => i > iFirst && p.y >= LINE_Y_END);
const endPt = (() => {
  const a = OCC_FRONT[iEnd - 1];
  const b = OCC_FRONT[iEnd];
  const t = (LINE_Y_END - a.y) / (b.y - a.y);
  return { x: a.x + (b.x - a.x) * t, y: LINE_Y_END };
})();
/** the red line as drawn (world px, north to south); cut 18 draws the same points, fully written */
export const STALEMATE_LINE: Pt[] = [...OCC_FRONT.slice(iFirst - 1, iEnd), endPt];
const CUM = cumLen(STALEMATE_LINE);
const TOTAL = CUM[CUM.length - 1];
/** the line weight: the kit's red data line (RED_LINE through FrontLine red) */
export const STALEMATE_LINE_RED = true;

// --- the write: a bead, already a third of the way down the frame at f0, settles on the bottom edge at LAND ---------
/** the bead's tip at f0 sits a third of the way down the frame (screen y 640) */
const TIP_Y_F0 = camAt(0).y + (640 - 960) / camAt(0).k;
const LEN_F0 = CUM[STALEMATE_LINE.findIndex((p) => p.y >= TIP_Y_F0)];
const shootInv = (e: number) => {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 40; i++) {
    const m = (lo + hi) / 2;
    if (shootEase(m) < e) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
};
/** the write's virtual start (a negative frame), so that the write is LEN_F0 along at f0 and moving */
const U0 = shootInv(LEN_F0 / TOTAL);
const WRITE_F0 = -(U0 * LAND) / (1 - U0);
export const lenAt = (S: number) => TOTAL * shootEase((S - WRITE_F0) / (LAND - WRITE_F0));
const frameOfLen = (s: number) => WRITE_F0 + shootInv(s / TOTAL) * (LAND - WRITE_F0);
/** the bead drains into the line once it has landed */
const BEAD_DRAIN_F = 6;

// --- the source line: top left, on the Ukrainian (bare paper) side, clear of both caption bands --------------------
const SOURCE: Pt = { x: 230, y: 70 };
const SOURCE_F = 34;

const LooksLikeStalemate: React.FC<z.infer<typeof schema>> = () => {
  const S = useCurrentFrame();
  const cam = camAt(S);
  const k = cam.k;
  const bead = 1 - smoothstep(clamp01((S - LAND) / BEAD_DRAIN_F));
  return (
    <VStage S={S} cam={cam}>
      <LymanMap id="lls" k={k} hatchK={STALEMATE_HATCH_K} held={STALEMATE_WASH} places={[...STALEMATE_PLACES]}>
        <FrontLine id="lls-front" points={STALEMATE_LINE} k={k} red len={lenAt(S)} ageAt={(s) => S - frameOfLen(s)} bead={bead} />
      </LymanMap>
      <SourceLine text="Front line: DeepStateMap, 3 Nov 2026" x={SOURCE.x} y={SOURCE.y} k={k} appear={enterFrom(S, SOURCE_F)} />
    </VStage>
  );
};

export default LooksLikeStalemate;
