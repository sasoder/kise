// ---------------------------------------------------------------------------
// SpaceReopened (kofman-vivaldi, cut 18), revision 1 (5 Nov 2026). ChinaTalk style (newsprint) (styles/chinatalk.md;
// kit API in generated/components/kits/chinatalk/chinatalkVintage.md), on the clip's two-colour Lyman map (lymanShared,
// REVISION_1105.md). Delivered as 18_SpaceReopened.mov.
// Opaque 1080x1920, 24 fps, 80 frames.
//
// CHECK LINE: "the single front line is gone: in its place is a wide, ragged no-man's-land with gaps and pockets —
// open space again."
//
// THE LINE: "The space has reopened again. You see [a lack of cohesive defensive lines on both sides]."
// WORD -> FRAME: The 1 · space 4 · has 11 · reopened 20 · again 33 · You 52 · see 62 · (a) lack 79 · (cut back 80).
// DURATION: the slot 18.042 -> 21.375 s = 3.333 s x 24 = 80 frames (f0..f79).
//
// THE MOTION: f0 is cut 11's (LooksLikeStalemate) last frame, pixel for pixel (sway on cut 0's clock, S + 199): the
// Lyman sector, Ukrainian ground blue, Russian-held ground the grey wash + hatch, the remembered Vivaldi patch (blue,
// fine RED_DEEP edge), UKRAINE, RUSSIAN-HELD, LYMAN, and ONE heavy red front line down the blue | grey edge over the ink
// front. From f1 the red line and the ink front bleed away in place (InkDiffuse, f1-27) while a RED_DEEP wash under a
// fine red hatch soaks outward from where the line was into DeepState's grey zone of 3 Nov 2026 (on the grey side of
// the line), a wet front with the wet red just behind it (contact f1, first reaction f2); where it soaks in, the grey
// held wash lifts (the grey zone is neither side: paper + red, a third state between blue and grey). It fills the
// band's ragged width and pockets (the farthest, south of Lyman, ~f25) and has settled by "again" 33. Cut 11's creep
// carries on through the soak, then the camera turns and pushes south-west in on the widest, most broken stretch of
// the band, around Lyman (f28 -> ~f72, k 0.89 -> 1.16), and creeps to the last frame. Cut 11's labels and its "Front
// line" source line ride off the frame top with the push; "Grey zone: DeepStateMap, 3 Nov 2026" slides up in the end
// framing's upper-left as the camera settles (f62-74). The patch stays in shot (its edge at the top left at the end).
// RED = the open space between the armies (DeepState's grey zone; plus the patch's fine at-rest edge). Nothing else is
// red.
//
// SOURCES: held ground (HELD_20261103 = occupied + grey zone), its edge (MAINFRONT_20261103) and the grey zone ("unknown status",
// GREY_20261103, 194 km2 in the sector) are DeepStateMap (deepstatemap.live), snapshot of 3 Nov 2026, via
// lymanFrontData.ts (assets-src/kofman-vivaldi/build_lyman_data.py); the retaken patch: HELD 15 Aug minus HELD 15 Oct
// 2026 (DeepStateMap); the Donets: Natural Earth; Lyman: OpenStreetMap Nominatim. The SourceLine names DeepStateMap, 3 Nov 2026.
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
  vTargetAt,
} from "../kits/chinatalk/chinatalkVintage";
import type { Cam, Pt, VCamKey } from "../kits/chinatalk/chinatalkVintage";
// the house sway (the kit's own function), run on cut 0's clock as cut 11 does
import { sway } from "../kits/dwarkesh/fieldShared";
import {
  STALEMATE_CAM_KEYS,
  STALEMATE_END_CAM,
  STALEMATE_HATCH_K,
  STALEMATE_INK_FRONTS,
  STALEMATE_LABELS,
  STALEMATE_LINE,
  STALEMATE_LINE_RED,
  STALEMATE_PATCH,
  STALEMATE_PLACES,
  STALEMATE_SOURCE,
  STALEMATE_SWAY_F0,
  STALEMATE_WASH,
  DURATION as STALEMATE_DURATION,
  camAt as stalemateCamAt,
} from "./LooksLikeStalemate";
import { GREY_20261103, HELD_20261103, MAINFRONT_20261103 } from "./lymanFrontData";
import { FrontLine, LymanMap, RetakenPatch, SideLabel, toPts } from "./lymanShared";

export const FPS = 24;
export const DURATION = 80;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// --- the opening: exactly cut 11's last frame (one place for every opening value) ---------------------------------
/** cut 11's last frame index (its DURATION 56 - 1) */
const STALEMATE_LAST = STALEMATE_DURATION - 1;
/** the house sway runs on cut 0's clock: our f0 = cut 11's f55 = cut 0's f199 (VStage swayOn={false}) */
const SWAY_F0 = STALEMATE_SWAY_F0 + STALEMATE_LAST;
const OPEN = {
  cam: STALEMATE_END_CAM,
  line: STALEMATE_LINE,
  lineRed: STALEMATE_LINE_RED,
  wash: STALEMATE_WASH,
  hatchK: STALEMATE_HATCH_K,
  inkFronts: STALEMATE_INK_FRONTS,
  patch: STALEMATE_PATCH,
  labels: STALEMATE_LABELS,
  places: [...STALEMATE_PLACES] as string[],
  source: STALEMATE_SOURCE,
};

// --- the camera: cut 11's creep carries on, then turns and pushes in on the broken stretch around Lyman -------------
/** cut 11's keys, shifted so its last frame is our f0 */
const S11_KEYS: VCamKey[] = STALEMATE_CAM_KEYS.map((key) => ({ ...key, f: key.f - STALEMATE_LAST }));
/** cut 11's creep runs on as it is through f0..f25 (two linear keys ON its own creep segment: the target is unchanged) */
const CREEP_ON = 25;
const onCreep = (f: number): VCamKey => ({ f, ...vTargetAt(S11_KEYS, f), ease: "linear" });
/** the end framing: the grey band's widest, most broken stretch (north of Lyman to the Donets) centred on screen y ~900 */
const CAM_END: Cam = { x: 625, y: 1490, k: 1.14 };
/** the creep past the end, keyed beyond the last frame so the follower is still moving on f79 */
const CAM_CREEP: Cam = { x: 621, y: 1500, k: 1.17 };
const camAt = runVCamera(
  [
    ...S11_KEYS.filter((key) => key.f < 0),
    onCreep(0),
    onCreep(CREEP_ON),
    { f: 66, ...CAM_END },
    { f: 112, ...CAM_CREEP, ease: "linear" },
  ],
  DURATION,
);
/** the stage camera: the logical camera shifted by the house sway on cut 0's clock (as cut 11) */
const stageCam = (S: number): Cam => {
  const c = camAt(S);
  const sw = sway(S + SWAY_F0);
  return { x: c.x - sw.dx / c.k, y: c.y - sw.dy / c.k, k: c.k };
};

// --- assert the join at module load: cut 11's end state, and our camera = cut 11's camera on f0..f25 ---------------
(() => {
  const near = (a: Cam, b: Cam) => Math.abs(a.x - b.x) < 1e-6 && Math.abs(a.y - b.y) < 1e-6 && Math.abs(a.k - b.k) < 1e-9;
  if (!near(stalemateCamAt(STALEMATE_LAST), STALEMATE_END_CAM)) throw new Error("SpaceReopened: cut 11's last frame moved");
  for (let s = 0; s <= CREEP_ON; s++) {
    if (!near(camAt(s), stalemateCamAt(STALEMATE_LAST + s))) throw new Error(`SpaceReopened: camera does not continue cut 11's at f${s}`);
  }
  if (OPEN.lineRed !== true) throw new Error("SpaceReopened: cut 11's line is no longer red");
  if (OPEN.wash !== HELD_20261103) throw new Error("SpaceReopened: cut 11's held ground changed");
  if (OPEN.hatchK !== 0.95) throw new Error("SpaceReopened: cut 11's hatch pitch changed");
  if (OPEN.places.join() !== "Lyman") throw new Error("SpaceReopened: cut 11's places changed");
  if (OPEN.patch.fill !== 0 || OPEN.patch.edge !== 1) throw new Error("SpaceReopened: cut 11's patch changed");
  if (!OPEN.labels.ukraine || !OPEN.labels.russian) throw new Error("SpaceReopened: cut 11's side labels changed");
})();

// --- the line bleeds away in place (the red line and the ink front under it: no line is left) ----------------------
const BLEED_F0 = 1;
const BLEED_F = 26;

// --- the soak: red spreads out from where the line was, into the grey zone ------------------------------------------
/** the soak spreads from the whole front (the edge of held ground: the drawn line is its on-screen part) */
const SOAK_FROM: Pt[] = toPts(MAINFRONT_20261103);
const SOAK_F0 = 1;
/** settled: the front has passed the farthest pocket (~235 world px from the front, south of Lyman) by "again" 33 */
const SOAK_END = 34;
/** world px: the front's reach at the end (past the farthest pocket; the same pace relative to the band as before) */
const SOAK_REACH = 255;
/** the soft edge of the soak front (mask blur, world px) and the wet stretch behind it */
const SOAK_SOFT = 7;
const WET_BAND = 46;
const soakU = (S: number) => clamp01((S - SOAK_F0) / (SOAK_END - SOAK_F0));
/** ink on wet paper: off the line at once, slowing as it reaches the far pockets */
const soakEase = (u: number) => 1 - Math.pow(1 - u, 1.2);
const reachAt = (S: number) => SOAK_REACH * soakEase(soakU(S));

/** the grey zone's material: RED_DEEP wash under a fine RED_DEEP hatch, crossed against the held hatch */
const WASH = { fill: 0.4, lineOpacity: 0.78, pitch: 13, width: 3.5, angleDeg: -45 } as const;
/** the wet front: RED_WET over the wash, strongest while the front is moving fast */
const WET_OPACITY = 0.55;
const WASH_HATCH_K = 1.1;
/** where the red soaks in, the grey held wash and hatch lift off (the grey zone is neither side: a third state) */
const LIFT_HELD = true;

// --- the source lines: cut 11's rides off the top with the push; the grey zone's enters on the end framing --------
/** the end framing's upper-left (screen px at the last frame's camera): blue paper between the remembered patch's edge
 *  above and the red band to the right, clear of the bands */
const NEW_SOURCE_SCREEN: Pt = { x: 60, y: 252 };
/** enters with the kit's slide-up as the camera settles (enterFrom: f62 -> f74) */
const NEW_SOURCE_F = 62;
const NEW_SOURCE_LINES = ["Grey zone: DeepStateMap,", "3 Nov 2026"];
/** the gap between its lines, world px */
const NEW_SOURCE_LEAD = 34;
/** the grey zone's source line, in world px (screen NEW_SOURCE_SCREEN under the last frame's camera) */
const NEW_SOURCE_AT: Pt = toWorld(camAt(DURATION - 1), NEW_SOURCE_SCREEN.x, NEW_SOURCE_SCREEN.y);

const lineD = (pts: Pt[]) => pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join("");
const SOAK_D = lineD(SOAK_FROM);

/** the view (+ sway and blur margin) in world px */
const viewOf = (cam: Cam) => {
  const hw = 620 / cam.k + 60;
  const hh = 1040 / cam.k + 60;
  return { x: cam.x - hw, y: cam.y - hh, width: 2 * hw, height: 2 * hh };
};

/** The soak's reach as a mask: white within `reach` of the front (soft edge), `inner` cut out (black) for a ring. */
const SoakStroke: React.FC<{ reach: number; inner?: number; color?: string }> = ({ reach, inner = 0, color = "#FFFFFF" }) => (
  <g filter="url(#sr-soft)">
    <path d={SOAK_D} fill="none" stroke={color} strokeWidth={(2 * reach).toFixed(3)} strokeLinecap="round" strokeLinejoin="round" />
    {inner > 0.5 ? (
      <path d={SOAK_D} fill="none" stroke="#000000" strokeWidth={(2 * inner).toFixed(3)} strokeLinecap="round" strokeLinejoin="round" />
    ) : null}
  </g>
);

/** Defs shared by the soak and the held-wash lift: the grey-zone clip, the soft edge, the held mask. */
const SoakDefs: React.FC<{ S: number; cam: Cam }> = ({ S, cam }) => {
  const reach = reachAt(S);
  const fr = viewOf(cam);
  return (
    <defs>
      <clipPath id="sr-grey-clip">
        <path d={GREY_20261103} clipRule="evenodd" />
      </clipPath>
      <filter id="sr-soft" filterUnits="userSpaceOnUse" {...fr}>
        <feGaussianBlur stdDeviation={SOAK_SOFT.toFixed(3)} />
      </filter>
      <mask id="sr-held" maskUnits="userSpaceOnUse" {...fr}>
        <rect {...fr} fill="#FFFFFF" />
        {LIFT_HELD && reach > 0.5 ? (
          <g clipPath="url(#sr-grey-clip)">
            <SoakStroke reach={reach} color="#000000" />
          </g>
        ) : null}
      </mask>
    </defs>
  );
};

/** The grey zone in red, revealed by a mask of everything within `reach` of the front. */
const GreyZoneSoak: React.FC<{ S: number; cam: Cam }> = ({ S, cam }) => {
  const reach = reachAt(S);
  if (reach <= 0.5) return null;
  const fr = viewOf(cam);
  const rect: Pt[] = [
    { x: fr.x, y: fr.y },
    { x: fr.x + fr.width, y: fr.y },
    { x: fr.x + fr.width, y: fr.y + fr.height },
    { x: fr.x, y: fr.y + fr.height },
  ];
  const u = soakU(S);
  // the wet stretch dries as the spread slows (gone once the soak has settled)
  const wet = WET_OPACITY * (1 - smoothstep(u)) * smoothstep(clamp01(reach / 20));
  const inner = Math.max(0, reach - WET_BAND);
  return (
    <g>
      <defs>
        <mask id="sr-soak" maskUnits="userSpaceOnUse" {...fr}>
          <SoakStroke reach={reach} />
        </mask>
        {wet > 0.004 ? (
          <mask id="sr-wet" maskUnits="userSpaceOnUse" {...fr}>
            <SoakStroke reach={reach} inner={inner} />
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
  const cam = stageCam(S);
  const k = cam.k;
  const bleed = clamp01((S - BLEED_F0) / BLEED_F);
  return (
    <VStage S={S} cam={cam} swayOn={false}>
      <SoakDefs S={S} cam={cam} />
      {/* cut 11's map, layer for layer (blue, held, rivers, patch, ink fronts, red line, Lyman), with the soak under
          the fronts; the held wash lifts where the soak has reached */}
      <LymanMap id="vtb" k={k} hatchK={OPEN.hatchK} held={OPEN.wash} places={OPEN.places} heldMask={LIFT_HELD ? "url(#sr-held)" : undefined}>
        <RetakenPatch id="vtb-patch" k={k} fill={OPEN.patch.fill} edge={OPEN.patch.edge} />
        <GreyZoneSoak S={S} cam={cam} />
        {bleed < 1
          ? OPEN.inkFronts.map((f, i) => <FrontLine key={i} id={`vtb-front-${i}`} points={f} k={k} diffuse={bleed} />)
          : null}
        {bleed < 1 ? <FrontLine id="lls-front" points={OPEN.line} k={k} red={OPEN.lineRed} diffuse={bleed} /> : null}
      </LymanMap>
      <SideLabel which="ukraine" k={k} />
      <SideLabel which="russian" k={k} />
      <SourceLine text={OPEN.source.text} x={OPEN.source.x} y={OPEN.source.y} k={k} />
      {NEW_SOURCE_LINES.map((t, i) => (
        <SourceLine key={t} text={t} x={NEW_SOURCE_AT.x} y={NEW_SOURCE_AT.y + i * NEW_SOURCE_LEAD} k={k} appear={enterFrom(S, NEW_SOURCE_F)} />
      ))}
    </VStage>
  );
};

export default SpaceReopened;
