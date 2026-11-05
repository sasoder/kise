// ---------------------------------------------------------------------------
// LooksLikeStalemate (kofman-vivaldi, cut 11), revision 1 (5 Nov 2026). ChinaTalk style (newsprint)
// (styles/chinatalk.md; kit API in generated/components/kits/chinatalk/chinatalkVintage.md), on the clip's two-colour
// Lyman map (lymanShared, REVISION_1105.md). Delivered as 11_LooksLikeStalemate.mov.
// Opaque 1080x1920, 24 fps, 56 frames.
//
// CHECK LINE: "this is what people picture: one fixed front line drawn across the map, dug in, not moving." And, from
// the revision: it is the same place as cut 0 (the retaken patch is still there).
//
// THE LINE: "[…a lot of folks who don't follow the war think that there] is a positional stalemate on the ground,"
// WORD -> FRAME: is 8 · a 19 · positional 22 · stalemate 33 · on the 43-45 · ground 48 · (cut back to the speaker 56).
// DURATION: the slot 11.375 -> 13.708 s = 2.333 s x 24 = 56 frames (f0..f55).
//
// THE MOTION: f0 is cut 0's (VivaldiTookBack) last frame exactly: the salient framing, the red retaken patch, blue
// Ukrainian ground, grey hatched Russian-held ground, the ink front, UKRAINE, LYMAN and the OPERATION VIVALDI / OCT 2026
// header (the house sway runs on cut 0's clock, S + 144, so the frames match). From f1 the camera pulls back to the
// sector (k 1.125 -> ~0.89) while the header bleeds away (f1-15) and the red patch relaxes into the remembered patch
// (blue with a fine RED_DEEP edge, f2-18). A red bead enters at the top edge and writes ONE heavy red line down the edge
// between blue and grey (the 3 Nov 2026 front, over the ink front; fast launch, settle: shootEase), slowing into the
// frame's bottom edge and landing at "stalemate" 33; the bead drains into the line. RUSSIAN-HELD rises in on the grey
// side as it opens (f26), the source line at f34. After the landing the line is still and dries; the camera creeps in.
// RED = the front line as people picture it (plus the retaken patch's fine at-rest edge). Nothing else is red.
// End state = cut 18's (SpaceReopened) start state: the STALEMATE_* exports below.
//
// SOURCES: held ground and its edge: DeepStateMap (deepstatemap.live), 3 Nov 2026 (HELD_20261103 / MAINFRONT; inside the
// frame identical to 15 Oct 2026, which cut 0 draws), via lymanFrontData.ts (assets-src/kofman-vivaldi/
// build_lyman_data.py); the retaken patch: HELD 15 Aug minus HELD 15 Oct 2026 (DeepStateMap); the Donets: Natural
// Earth; Lyman: OpenStreetMap Nominatim. The SourceLine names DeepStateMap, 3 Nov 2026.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  INK_HI,
  InkDiffuse,
  Kicker,
  Label,
  SourceLine,
  VStage,
  clamp01,
  cumLen,
  enterFrom,
  runVCamera,
  shootEase,
  smoothstep,
} from "../kits/chinatalk/chinatalkVintage";
import type { Cam, Pt, VCamKey } from "../kits/chinatalk/chinatalkVintage";
// the house sway (the kit's own function; the kit imports it from here too), run on cut 0's clock
import { sway } from "../kits/dwarkesh/fieldShared";
import { HELD_20261103 } from "./lymanFrontData";
import { FrontLine, LymanMap, RetakenPatch, SideLabel } from "./lymanShared";
import {
  DURATION as VIVALDI_DURATION,
  VIVALDI_END_CAM,
  VIVALDI_END_FRONTS,
  VIVALDI_END_LABELS,
  VIVALDI_END_PATCH,
  VIVALDI_HATCH_K,
  VIVALDI_HEADER,
  VIVALDI_PLACES,
} from "./VivaldiTookBack";

export const FPS = 24;
export const DURATION = 56;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// --- the opening: cut 0's last frame ----------------------------------------------------------------------------
/** this cut's VStage sway runs on cut 0's clock: sway(S + STALEMATE_SWAY_F0), so f0 = cut 0's f144 */
export const STALEMATE_SWAY_F0 = VIVALDI_DURATION - 1;
// the held ground drawn here (3 Nov) is cut 0's (15 Oct) inside every frame of this cut: checked by the f0 diff

// --- the camera: from rest on cut 0's last camera, one pull-back to the sector, then a creep in -----------------------
/** the sector framing: Lyman below caption band 2, the whole retaken patch (but its westmost tip) and the front in frame */
const CAM_SECTOR: Cam = { x: 640, y: 860, k: 0.87 };
/** the creep past the end, keyed beyond the last frame so the follower is still moving on f55 */
const CAM_CREEP: Cam = { x: 632, y: 866, k: 0.92 };
/** the camera keys (cut 18 can rebuild this exact track from them) */
export const STALEMATE_CAM_KEYS: VCamKey[] = [
  { f: 0, ...VIVALDI_END_CAM },
  { f: 28, ...CAM_SECTOR },
  { f: DURATION + 30, ...CAM_CREEP, ease: "linear" },
];
const camAt = runVCamera(STALEMATE_CAM_KEYS, DURATION);
export { camAt };
/** the stage camera: the logical camera, shifted so the house sway runs on cut 0's clock (VStage swayOn={false}) */
const stageCam = (S: number): Cam => {
  const c = camAt(S);
  const sw = sway(S + STALEMATE_SWAY_F0);
  return { x: c.x - sw.dx / c.k, y: c.y - sw.dy / c.k, k: c.k };
};

/** the camera on the last frame (f55), full precision, without sway (the stage adds sway(S + STALEMATE_SWAY_F0)) */
export const STALEMATE_END_CAM: Cam = camAt(DURATION - 1);
/** the hatch pitch: cut 0's, locked for the whole cut */
export const STALEMATE_HATCH_K = VIVALDI_HATCH_K;
/** the held ground (Russian-held = occupied + grey zone, 3 Nov 2026): LymanMap `held`; blue is everything else */
export const STALEMATE_WASH = HELD_20261103;
/** the ink front under the red line (cut 0's three pieces, drawn as LymanMap does, under the red) */
export const STALEMATE_INK_FRONTS: Pt[][] = VIVALDI_END_FRONTS;
/** the retaken patch at rest on the last frame: RetakenPatch fill 0 (blue), fine RED_DEEP edge */
export const STALEMATE_PATCH = { fill: 0, edge: 1 } as const;
/** the one place label (dot + "word" label) */
export const STALEMATE_PLACES = VIVALDI_PLACES;
/** side labels on the last frame: UKRAINE and RUSSIAN-HELD at their SIDE_LABELS places */
export const STALEMATE_LABELS = { ukraine: true, russian: true } as const;
/** the source line on the last frame (kit SourceLine, fully in) */
export const STALEMATE_SOURCE = { text: "Front line: DeepStateMap, 3 Nov 2026", x: 150, y: 10 } as const;

// --- the line: the ink front (blue | grey edge) from above the frame top to the frame's bottom edge, north to south ------
/** fully written on this frame, the bead settling on the frame's bottom edge, at "stalemate" 33 */
const LAND = 33;
/** the line starts above the top edge of the widest frame (the sector, top world y ~ -245) */
const LINE_Y0 = -300;
/** the line ends where the bottom edge is at LAND (+ a little: the bead sits half off the edge as it drains) */
const LINE_Y_END = camAt(LAND).y + 960 / camAt(LAND).k + 10;
const [FN, FE, FS] = VIVALDI_END_FRONTS;
/** cut 0's three front pieces joined (they share their end points) */
const FRONT_JOINED: Pt[] = [...FN, ...FE.slice(1), ...FS.slice(1)];
const iFirst = FRONT_JOINED.findIndex((p) => p.y > LINE_Y0);
const iEnd = FRONT_JOINED.findIndex((p, i) => i > iFirst && p.y >= LINE_Y_END);
const cutAtY = (a: Pt, b: Pt, y: number): Pt => ({ x: a.x + ((b.x - a.x) * (y - a.y)) / (b.y - a.y), y });
/** the red line as drawn (world px, north to south); cut 18 draws the same points, fully written */
export const STALEMATE_LINE: Pt[] = [
  cutAtY(FRONT_JOINED[iFirst - 1], FRONT_JOINED[iFirst], LINE_Y0),
  ...FRONT_JOINED.slice(iFirst, iEnd),
  cutAtY(FRONT_JOINED[iEnd - 1], FRONT_JOINED[iEnd], LINE_Y_END),
];
const CUM = cumLen(STALEMATE_LINE);
const TOTAL = CUM[CUM.length - 1];
/** the line weight: the kit's red data line (RED_LINE through FrontLine red) */
export const STALEMATE_LINE_RED = true;

// --- the write: the bead sits just above the top edge at f0 (nothing red on cut 0's frame) and enters at f1 -----------
const TIP_Y_F0 = camAt(0).y - 960 / camAt(0).k - 24;
const LEN_F0 = CUM[STALEMATE_LINE.findIndex((p) => p.y >= TIP_Y_F0) - 1];
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

// --- cut 0's leftovers ---------------------------------------------------------------------------------------------
/** the OPERATION VIVALDI / OCT 2026 header and cut 0's source line bleed away like ink */
const HEADER_BLEED_F0 = 1;
const HEADER_BLEED_F = 14;
const HEADER_C: Pt = { x: 290, y: 220 };
/** the red patch relaxes into the remembered patch: fill 1 -> 0 (the blue shows), RED_DEEP edge 0 -> 1 */
const RELAX_F0 = 2;
const RELAX_F = 16;
/** RUSSIAN-HELD rises in on the grey side once the pull-back has opened it */
const RUSSIAN_F = 26;
const SOURCE_F = 34;

const LooksLikeStalemate: React.FC<z.infer<typeof schema>> = () => {
  const S = useCurrentFrame();
  const cam = stageCam(S);
  const k = cam.k;
  const bead = S < 1 ? 0 : 1 - smoothstep(clamp01((S - LAND) / BEAD_DRAIN_F));
  const relax = smoothstep(clamp01((S - RELAX_F0) / RELAX_F));
  const patch = {
    fill: VIVALDI_END_PATCH.fill + (STALEMATE_PATCH.fill - VIVALDI_END_PATCH.fill) * relax,
    edge: VIVALDI_END_PATCH.edge + (STALEMATE_PATCH.edge - VIVALDI_END_PATCH.edge) * relax,
  };
  const headerBleed = clamp01((S - HEADER_BLEED_F0) / HEADER_BLEED_F);
  const H = VIVALDI_HEADER;
  return (
    <VStage S={S} cam={cam} swayOn={false}>
      {/* cut 0's VivaldiEndMap, layer for layer (blue, held, rivers, patch, ink fronts, Lyman), with the red line
          written over the ink fronts and under the place mark */}
      <LymanMap id="vtb" k={k} hatchK={STALEMATE_HATCH_K} held={STALEMATE_WASH} places={[...STALEMATE_PLACES]}>
        <RetakenPatch id="vtb-patch" k={k} fill={patch.fill} edge={patch.edge} />
        {STALEMATE_INK_FRONTS.map((f, i) => (
          <FrontLine key={i} id={`vtb-front-${i}`} points={f} k={k} />
        ))}
        {S >= 1 ? <FrontLine id="lls-front" points={STALEMATE_LINE} k={k} red len={lenAt(S)} ageAt={(s) => S - frameOfLen(s)} bead={bead} /> : null}
      </LymanMap>
      {VIVALDI_END_LABELS.ukraine ? <SideLabel which="ukraine" k={k} /> : null}
      <SideLabel which="russian" k={k} appear={enterFrom(S, RUSSIAN_F)} />
      <InkDiffuse u={headerBleed} k={k} cx={HEADER_C.x} cy={HEADER_C.y}>
        <Kicker text={H.kicker.text} x={H.kicker.x} y={H.kicker.y} k={k} width={H.kicker.width} />
        <Label text={H.date.text} x={H.date.x} y={H.date.y} k={k} size="head" anchor="start" rung={INK_HI} />
        <SourceLine text={H.source.text} x={H.source.x} y={H.source.y} k={k} />
      </InkDiffuse>
      <SourceLine text={STALEMATE_SOURCE.text} x={STALEMATE_SOURCE.x} y={STALEMATE_SOURCE.y} k={k} appear={enterFrom(S, SOURCE_F)} />
    </VStage>
  );
};

export default LooksLikeStalemate;
