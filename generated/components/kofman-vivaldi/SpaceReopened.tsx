// ---------------------------------------------------------------------------
// SpaceReopened (kofman-vivaldi, cut 18). ChinaTalk style (newsprint) (styles/chinatalk.md; kit API in
// generated/components/kits/chinatalk/chinatalkVintage.md). Delivered as 18_SpaceReopened.mov.
// Opaque 1080x1920, 24 fps, 80 frames.
//
// CHECK LINE: "the single front line is gone: in its place is a wide, ragged no-man's-land with gaps and pockets —
// open space again."
//
// THE LINE: "The space has reopened again. You see [a lack of cohesive defensive lines on both sides]."
// WORD -> FRAME: The 1 · space 4 · has 11 · reopened 20 · again 33 · You 52 · see 62 · (a) lack 79 · (cut back 80).
// DURATION: the slot 18.042 -> 21.375 s = 3.333 s x 24 = 80 frames (f0..f79).
//
// THE MOTION: f0 is cut 11's (LooksLikeStalemate) last frame, pixel for pixel: the Lyman sector, Russian-occupied
// ground an ink wash under the house hatch on the right, ONE heavy red front line down its edge, LYMAN. From f1 the
// red line bleeds away in place (InkDiffuse) while a RED_DEEP wash under a fine red hatch soaks outward from where it
// was into DeepState's grey zone of 3 Nov 2026, a wet front with the wet red just behind it (contact f1, first
// reaction f2); it fills the band's ragged width and pockets (the last finger north of Lyman ~f25) and has settled
// by "again" 33. Cut 11's "Front line" source line stays put and rides off the frame top with the push; "Grey zone:
// DeepStateMap, 3 Nov 2026" slides up in the end framing's upper-left bare paper as the camera settles (f62-74).
// Cut 11's slow push carries on through the soak, then the camera turns
// and pushes south-west in on the widest, most broken stretch of the band, around Lyman (f28 -> ~f72, k 0.96 -> 1.16),
// and creeps to the last frame. RED = the open space between the armies (DeepState's grey zone). Nothing else is red.
//
// SOURCES: the occupied ground (OCC_20261103), its edge (MAINFRONTOCC_20261103) and the grey zone ("unknown status",
// GREY_20261103, 194 km2 in the sector) are DeepStateMap (deepstatemap.live), snapshot of 3 Nov 2026, via
// lymanFrontData.ts (assets-src/kofman-vivaldi/build_lyman_data.py); the Donets: Natural Earth; Lyman: OpenStreetMap
// Nominatim. The SourceLine names DeepStateMap, 3 Nov 2026.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  HatchFill,
  RED_DEEP,
  RED_WET,
  SourceLine,
  VStage,
  clamp01,
  enterFrom,
  runVCamera,
  smoothstep,
  toWorld,
} from "../kits/chinatalk/chinatalkVintage";
import type { Cam, Pt } from "../kits/chinatalk/chinatalkVintage";
import {
  STALEMATE_END_CAM,
  STALEMATE_HATCH_K,
  STALEMATE_LINE,
  STALEMATE_LINE_RED,
  STALEMATE_PLACES,
  STALEMATE_WASH,
  camAt as stalemateCamAt,
} from "./LooksLikeStalemate";
import { GREY_20261103, MAINFRONTOCC_20261103, OCC_20261103 } from "./lymanFrontData";
import { FrontLine, LymanMap, toPts } from "./lymanShared";

export const FPS = 24;
export const DURATION = 80;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// --- the opening: exactly cut 11's last frame (one place for every opening value) ---------------------------------
/** cut 11's last frame index (its DURATION 56 - 1) */
const STALEMATE_LAST = 55;
/** cut 11's camera keys, shifted so that its last frame is our f0 (its keys are not exported: asserted below) */
const S11_OPEN: Cam = { x: 700, y: 870, k: 0.86 };
const S11_PUSH: Cam = { x: 712, y: 905, k: 1.0 };
const OPEN = {
  cam: STALEMATE_END_CAM,
  line: STALEMATE_LINE,
  lineRed: STALEMATE_LINE_RED,
  wash: STALEMATE_WASH,
  hatchK: STALEMATE_HATCH_K,
  places: [...STALEMATE_PLACES] as string[],
  /** cut 11's source line: same text, place and size */
  sourceText: "Front line: DeepStateMap, 3 Nov 2026",
  sourceAt: { x: 230, y: 70 } as Pt,
};

// --- the camera: cut 11's push carries on, then turns and pushes in on the broken stretch around Lyman -------------
/** the end framing: the grey band's widest, most broken stretch (north of Lyman to the Donets) centred on screen y ~900 */
const CAM_END: Cam = { x: 625, y: 1490, k: 1.14 };
/** the creep past the end, keyed beyond the last frame so the follower is still moving on f79 */
const CAM_CREEP: Cam = { x: 621, y: 1500, k: 1.17 };
const camAt = runVCamera(
  [
    { f: -24 - STALEMATE_LAST, ...S11_OPEN },
    { f: 80 - STALEMATE_LAST, ...S11_PUSH, ease: "linear" },
    { f: 66, ...CAM_END },
    { f: 112, ...CAM_CREEP, ease: "linear" },
  ],
  DURATION,
);

// --- assert the join at module load: cut 11's end constants, and our camera = cut 11's camera on f0..f20 -----------
(() => {
  const near = (a: Cam, b: Cam) => Math.abs(a.x - b.x) < 1e-6 && Math.abs(a.y - b.y) < 1e-6 && Math.abs(a.k - b.k) < 1e-9;
  if (!near(stalemateCamAt(STALEMATE_LAST), STALEMATE_END_CAM)) throw new Error("SpaceReopened: cut 11's last frame moved");
  for (let s = 0; s <= 20; s++) {
    if (!near(camAt(s), stalemateCamAt(STALEMATE_LAST + s))) throw new Error(`SpaceReopened: camera does not continue cut 11's at f${s}`);
  }
  if (OPEN.lineRed !== true) throw new Error("SpaceReopened: cut 11's line is no longer red");
  if (OPEN.wash !== OCC_20261103) throw new Error("SpaceReopened: cut 11's wash changed");
  if (OPEN.hatchK !== 0.92) throw new Error("SpaceReopened: cut 11's hatch pitch changed");
  if (OPEN.places.join() !== "Lyman") throw new Error("SpaceReopened: cut 11's places changed");
})();

// --- the line bleeds away in place --------------------------------------------------------------------------------
const BLEED_F0 = 1;
const BLEED_F = 26;

// --- the soak: red spreads out from where the line was, into the grey zone ------------------------------------------
/** the soak spreads from the whole occupied edge (the drawn line is its on-screen part; the rest lies off frame) */
const SOAK_FROM: Pt[] = toPts(MAINFRONTOCC_20261103);
const SOAK_F0 = 1;
/** settled: the front has passed the farthest pocket (~290 world px from the edge, north of Lyman) by "again" 33 */
const SOAK_END = 34;
/** world px: the front's reach at the end (past the farthest pocket) */
const SOAK_REACH = 315;
/** the soft edge of the soak front (mask blur, world px) and the wet stretch behind it */
const SOAK_SOFT = 7;
const WET_BAND = 46;
const soakU = (S: number) => clamp01((S - SOAK_F0) / (SOAK_END - SOAK_F0));
/** ink on wet paper: off the line at once, slowing as it reaches the far pockets */
const soakEase = (u: number) => 1 - Math.pow(1 - u, 1.2);
const reachAt = (S: number) => SOAK_REACH * soakEase(soakU(S));

/** the grey zone's material: RED_DEEP wash under a fine RED_DEEP hatch, crossed against the occupied hatch */
const WASH = { fill: 0.4, lineOpacity: 0.78, pitch: 13, width: 3.5, angleDeg: -45 } as const;
/** the wet front: RED_WET over the wash, strongest while the front is moving fast */
const WET_OPACITY = 0.55;
const WASH_HATCH_K = 1.1;

// --- the source lines: cut 11's rides off the top with the push; the grey zone's enters on the end framing --------
/** the end framing's upper-left bare paper (screen px at the last frame's camera), clear of the red, hatch and bands */
const NEW_SOURCE_SCREEN: Pt = { x: 60, y: 196 };
/** enters with the kit's slide-up as the camera settles (enterFrom: f62 -> f74) */
const NEW_SOURCE_F = 62;
const NEW_SOURCE_LINES = ["Grey zone: DeepStateMap,", "3 Nov 2026"];
/** the gap between its lines, world px */
const NEW_SOURCE_LEAD = 34;
/** the grey zone's source line, in world px (screen NEW_SOURCE_SCREEN under the last frame's camera) */
const NEW_SOURCE_AT: Pt = toWorld(camAt(DURATION - 1), NEW_SOURCE_SCREEN.x, NEW_SOURCE_SCREEN.y);

const lineD = (pts: Pt[]) => pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join("");
const SOAK_D = lineD(SOAK_FROM);

/** The grey zone in red, revealed by a mask of everything within `reach` of the occupied edge. */
const GreyZoneSoak: React.FC<{ S: number; cam: Cam }> = ({ S, cam }) => {
  const reach = reachAt(S);
  if (reach <= 0.5) return null;
  // the view (+ sway and blur margin) in world px
  const hw = 620 / cam.k + 60;
  const hh = 1040 / cam.k + 60;
  const view = { x0: cam.x - hw, y0: cam.y - hh, x1: cam.x + hw, y1: cam.y + hh };
  const rect: Pt[] = [
    { x: view.x0, y: view.y0 },
    { x: view.x1, y: view.y0 },
    { x: view.x1, y: view.y1 },
    { x: view.x0, y: view.y1 },
  ];
  const u = soakU(S);
  // the wet stretch dries as the spread slows (gone once the soak has settled)
  const wet = WET_OPACITY * (1 - smoothstep(u)) * smoothstep(clamp01(reach / 20));
  const inner = Math.max(0, reach - WET_BAND);
  const soft = SOAK_SOFT;
  const fr = { x: view.x0, y: view.y0, width: view.x1 - view.x0, height: view.y1 - view.y0 };
  return (
    <g>
      <defs>
        <clipPath id="sr-grey-clip">
          <path d={GREY_20261103} clipRule="evenodd" />
        </clipPath>
        <filter id="sr-soft" filterUnits="userSpaceOnUse" {...fr}>
          <feGaussianBlur stdDeviation={soft.toFixed(3)} />
        </filter>
        <mask id="sr-soak" maskUnits="userSpaceOnUse" {...fr}>
          <path
            d={SOAK_D}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={(2 * reach).toFixed(3)}
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#sr-soft)"
          />
        </mask>
        {wet > 0.004 ? (
          <mask id="sr-wet" maskUnits="userSpaceOnUse" {...fr}>
            <g filter="url(#sr-soft)">
              <path d={SOAK_D} fill="none" stroke="#FFFFFF" strokeWidth={(2 * reach).toFixed(3)} strokeLinecap="round" strokeLinejoin="round" />
              {inner > 0.5 ? (
                <path d={SOAK_D} fill="none" stroke="#000000" strokeWidth={(2 * inner).toFixed(3)} strokeLinecap="round" strokeLinejoin="round" />
              ) : null}
            </g>
          </mask>
        ) : null}
      </defs>
      <g clipPath="url(#sr-grey-clip)">
        <g mask="url(#sr-soak)">
          <HatchFill id="sr-wash" region={rect} k={WASH_HATCH_K} color={RED_DEEP} anchor={{ x: 0, y: 0 }} {...WASH} />
        </g>
        {wet > 0.004 ? (
          <g mask="url(#sr-wet)">
            <rect {...fr} fill={RED_WET} opacity={wet.toFixed(4)} />
          </g>
        ) : null}
      </g>
    </g>
  );
};

const SpaceReopened: React.FC<z.infer<typeof schema>> = () => {
  const S = useCurrentFrame();
  const cam = camAt(S);
  const k = cam.k;
  const bleed = clamp01((S - BLEED_F0) / BLEED_F);
  return (
    <VStage S={S} cam={cam}>
      <LymanMap id="lls" k={k} hatchK={OPEN.hatchK} held={OPEN.wash} places={OPEN.places}>
        <GreyZoneSoak S={S} cam={cam} />
        {bleed < 1 ? <FrontLine id="lls-front" points={OPEN.line} k={k} red={OPEN.lineRed} diffuse={bleed} /> : null}
      </LymanMap>
      <SourceLine text={OPEN.sourceText} x={OPEN.sourceAt.x} y={OPEN.sourceAt.y} k={k} />
      {NEW_SOURCE_LINES.map((t, i) => (
        <SourceLine key={t} text={t} x={NEW_SOURCE_AT.x} y={NEW_SOURCE_AT.y + i * NEW_SOURCE_LEAD} k={k} appear={enterFrom(S, NEW_SOURCE_F)} />
      ))}
    </VStage>
  );
};

export default SpaceReopened;
