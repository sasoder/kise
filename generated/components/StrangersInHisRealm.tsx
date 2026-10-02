import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  Carrack,
  CrowdDots,
  MapStack,
  NumeralLabel,
  PaperTop,
  RealmBorder,
  RealmWash,
  SEA,
  WorldSvg,
  swayCam,
} from "./incaShared";
import {
  CAM_TRACK,
  DURATION,
  FPS,
  LAST,
  NUMERAL_DY,
  NUMERAL_F0,
  NUMERAL_SIZE,
  N_MEN,
  SHIP_SIZE,
  WAVE_FROM,
  WAVE_TO,
  WASH,
  bodyCentre,
  manAt,
  menRadius,
  shipAt,
  smoothWash,
  waveProgress,
} from "./strangersMotion";

export { DURATION, FPS };

// ---------------------------------------------------------------------------
// StrangersInHisRealm (V2, director's review 1). Dwarkesh Patel with Si
// Sheppard, clip "Sheppard_Atahualpa_ambush", cut 1 of 3, on the shared Peru
// world (incaShared.tsx). The line: "that strangers have entered his realm.
// And again, we're talking 168 men." The idea: a vast realm and a speck; the
// speck is the whole story of the line. V2: the camera is CLOSE -> WIDE ->
// CLOSE (V1 opened on a static wide with a ~40 px subject), and the 168 are a
// marching column of separate men (V1's packed ellipse read as an orange pill).
//
// TIMELINE. In-point 15.16 s ("that") = f0; frame = round((t - 15.16) * 24):
//   that f0 · strangers f7 · have f19 · entered f28 · his f37 · realm f45 ·
//   and f53 · again f57 · we're f66 · talking f70 · 168 f73 · men f96
//   ("men" ends 19.56 s = f106).
// DURATION: "that" 15.16 -> "men" ends 19.56: round(4.40 * 24) = round(105.6)
// = 106, + the 16-frame house tail = 122 frames (f0..f121).
//
// DWARKESH MAP STYLE on THE PERU WORLD (the shared LOD map: sea #1B2226, land
// #3F3428 + #6A5838 rim, cream ink #E9DDBF, engraved water-lines, graticule,
// Lago Titicaca and Poopo, baked mottle + grain, vignette). Opaque 1080x1920,
// 24 fps. The only text is the numeral 168 (no MEN, no names: none is spoken).
//
// COLOUR RULE (the clip's): house orange (#FFB000) = PIZARRO'S SIDE ONLY: his
// ship (hollow orange) and his 168 men. The realm (Tawantinsuyu) is cream: its
// wash and its dashed land border, at the context rung (0.5) until "realm",
// then the full rung (0.94).
//
// THE GESTURES, each with its word (frames at 24 fps; each starts before its
// word and lands on it; nothing starts from a dead stop):
//   1. "that" f0: CLOSE on the landing, k 2.2 (Ecuador and northern Peru, the
//      Gulf of Guayaquil, the Tumbes coast: the realm's northern third, its
//      wash and dashed border at the context rung), the landing at (400, 790);
//      the camera already easing back (k -3.5 % by f30, the pan easing in).
//   2. "strangers" f7: the HOLLOW ORANGE carrack (37.5 k^0.6 px: 60 px at k
//      2.2; facing east) is already sailing on f0 in from the open sea WNW of
//      Tumbes (the mouth of the Gulf of Guayaquil; they crossed from Puna) and
//      eases to a stop with its bow on the beach on f16.
//   3. "have entered" f19-f28: the 168 file off the bow onto the beach and
//      down the road (PIZARRO_1532), head first, one short stream (f16-f25 off
//      the ship), each easing out to his file as he reaches his place: the
//      column forms a little way inland (all in by f29) and starts its march;
//      the ship fades out (f30-f42): it has done its job.
//   4. "his realm" f37-f50: the camera PULLS BACK in one long glide (f22-f46:
//      k 2.2 -> 1.0, the speck carried from the frame's middle to its place
//      at Tumbes), so the realm is revealed round the speck exactly while the
//      border rises from the context rung to the full rung as a wave running
//      both ways round the realm from the entry point at Tumbes and meeting in
//      the far south (33 S, east of Mendoza) at f50 (~80 % lit on "realm"
//      f45; the coast stretches of the loop are the baked coast, so the land
//      border lights from its north end first, f38, and closes at 33 S); the
//      wash a touch brighter (0.05 -> 0.075). It lands on THE REALM WIDE (k
//      1.0, the world's k 1 framing) on f46 and holds there f46-f48 while the
//      wave closes in the far south. At k 1 the 168 are one small orange dash.
//   5. "and again, we're talking 168 men" f48-f80: ONE smooth dive: ln k an S
//      (a raised cosine f48-f70: k 1.0 -> 14, within 1.4 % by f68, ~5 f before
//      "168"), the column carried on its own S (f48-f68) to (540, 780). It
//      resolves into exactly 168 separate men (asserted): a column about 6
//      abreast x 28 deep along the road (343 x 86 px at k 14; ragged ranks of
//      4, 5 at the head and the tail, 6-7 in the body; each man jittered ~30 %
//      of the spacing, then relaxed apart: no two closer than 10.7 px), 12.4 px
//      between ranks and 12.6 px between files at k 14, dots 3.5 px with the
//      dark casing; marching inland at a slow, steady 1.1 px/f,
//      each man with a tiny stride bob along the march (+-0.5 px, his own
//      phase). Nothing else moves on the men.
//   6. "168" f73: the numeral 168, IM Fell English roman, cream, 110 px, slides
//      up 24 px while fading in over 12 f from f65, centred on the content axis
//      under the column (baseline <= y 1060).
//   7. Hold f80-f121: the column keeps marching, the camera follows it and
//      creeps in (k 14 -> 14.4, +3 %); the Tumbes coast and its water-lines on
//      the left give the close-up its context.
// Nothing else.
//
// SOURCES. SP/FACTS.md: 168 men = the modern standard (62 horse + 106 foot;
// Lockhart, Hemming), the landing at Inca Tumbes (the Cabeza de Vaca site,
// Corrales, -3.601 -80.492), the route's stops (section 5). The realm
// (Tawantinsuyu 1525-32): scripts/inca-geo.json (the director's georeferenced
// union of the expansion phases of the standard map, Rowe's chronology), its
// fill rebuilt on the Natural Earth 10m coast. The beach: the 10m coast point
// nearest Inca Tumbes (9.3 km). The coast: Natural Earth 10m (world-atlas).
//
// CAMERA (with the house sway; camScan over a probe grid above the caption
// band and three fixed world points: the landing, Tumbes, Poechos): three
// glides, C1, decaying into the hold. The ease-out f0-f22: max 2.9 px/f, max
// |dv| 0.13 px/f^2. THE PULL-BACK f22-f46 (k 2.2 -> 1.0 with a 390 px pan):
// grid max 82 px/f, max |dv| 9.8 (f27-29) and 11.3 (f39-41); fixed points
// <= 4.5. The breath f46-f48: k 1.000, the camera (540, 960). THE DIVE
// f48-f70 (a 14x push in 22 frames, so the grid's far corners see
// r * (ln k)''): two lobes, 42.4 px/f^2 at f52-53 and 35.5 at f62-63, zero by
// f71; fixed points <= 10.4; the column's own screen path <= 6.9. The hold
// f72-f121: max 2.2 px/f, max |dv| 0.04. No reversal inside a glide, no
// stutter. The map stays sharp (>= 1.10 texels per screen px on every frame;
// the crossfade bands are passed in motion; k 2.1-2.2, 1.0 and 14-14.4 hold
// outside every band).
// ---------------------------------------------------------------------------

export const schema = z.object({
  vignette: z.number(),
  washOpacity: z.number(), // the realm's wash at the context rung
  washRealm: z.number(), // ... a touch brighter on "realm"
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({
  vignette: 0.55,
  washOpacity: WASH[0],
  washRealm: WASH[1],
});

const StrangersInHisRealm: React.FC<Props> = ({ vignette, washOpacity, washRealm }) => {
  const frame = useCurrentFrame();
  const fi = Math.min(LAST, Math.max(0, Math.round(frame)));
  const cam = swayCam(CAM_TRACK[fi], frame);
  const k = cam.k;
  const ship = shipAt(fi, k);
  const men = Array.from({ length: N_MEN }, (_, i) => manAt(i, fi, k))
    .filter((m) => m.op > 0.002)
    .map((m) => ({ x: m.x, y: m.y, t: 1, op: m.op }));
  const centre = bodyCentre(fi);

  return (
    <AbsoluteFill style={{ backgroundColor: SEA }}>
      <MapStack cam={cam} />
      <WorldSvg cam={cam}>
        {/* THE REALM (cream): the wash, the dashed land border and its wave */}
        <RealmWash cam={cam} opacity={smoothWash(fi, washOpacity, washRealm)} />
        <RealmBorder cam={cam} level={0} wave={{ from: WAVE_FROM, to: WAVE_TO, progress: waveProgress(fi) }} />

        {/* PIZARRO'S SIDE (orange): his ship and his 168 */}
        <Carrack x={ship.x} y={ship.y} cam={cam} frame={fi} size={SHIP_SIZE(k)} seed={3} hollow facing="east" opacity={ship.op} rock={0.6} wake={ship.wake} />
        <CrowdDots dots={men} cam={cam} radius={menRadius(k)} />
      </WorldSvg>

      {/* "168" */}
      <NumeralLabel text="168" x={centre[0]} y={centre[1]} cam={cam} frame={fi} f0={NUMERAL_F0} size={NUMERAL_SIZE} dy={NUMERAL_DY} frames={14} fade={12} />

      <PaperTop vignette={vignette} />
    </AbsoluteFill>
  );
};

export default StrangersInHisRealm;
