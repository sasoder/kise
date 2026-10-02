import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  CORTES_ROAD,
  CityDot,
  CrowdDots,
  DARK,
  HoldRing,
  INK_CONTEXT,
  MapStack,
  PaperTop,
  SEA,
  WorldSvg,
  swayCam,
} from "./cortesShared";
import { CAM_TRACK, DURATION, FPS, LAST, ROAD_END_S, ROAD_LEN, TENOCH, campDotsAt, cityDotsAt } from "./toTheCoastMotion";

export { DURATION, FPS };

// ---------------------------------------------------------------------------
// ToTheCoast. Dwarkesh Patel with Si Sheppard, clip
// "Sheppard_Cortes_recruits_the_arrest_army", cut 4, on the shared Cortes world
// (cortesShared.tsx). Context (not rendered): "... he leaves one of his
// subordinates, the hot-blooded Alvarado, behind in charge in Tenochtitlan,"
// This cut: "takes as many men as he can to the coast." The user's ask: a quick
// establishing shot, the dots (the people) going to the coast, and the coast
// correct.
//
// TIMELINE. The SRT (media-to-srt output ..._c4_p0.5.srt) is on the EDIT
// timeline (the clip folder's .mov is a longer raw cut; never measured
// against). In-point 38.72 s = f0; frame = round((t - 38.72) * 24):
//   takes f0 · as f5 · many f9 · men as f13 · he can f19 · to the f25 ·
//   coast f31 ("coast" ends 40.479 s = f42).
// DURATION: "takes" 38.72 -> "coast" ends 40.48: round((40.48 - 38.72) * 24) =
// round(42.24) = 42, + the 16-frame house tail = 58 frames (f0..f57).
//
// DWARKESH MAP STYLE on THE CORTES WORLD (the shared LOD map: sea #1B2226, land
// #3F3428 + #6A5838 rim, cream ink #E9DDBF, engraved water-lines, graticule,
// Lake Texcoco 1519, baked mottle + grain, vignette). Opaque 1080x1920, 24 fps.
// No labels (no name is spoken in this line), no swords (the battle has not
// happened), no arrows, no numbers.
//
// COLOUR RULE: house orange (#FFB000 / #D98A0C) = CORTES'S SIDE ONLY: his 39
// men at Tenochtitlan (the 27 who go, the 12 who stay), his road, the HoldRing
// on the capital he holds. Everything else is cream #E9DDBF: Narvaez's 90 and
// the city's dot. Two rungs: full for what is in play (the men, the ring), the
// context rung (INK_CONTEXT 0.5) for the standing road, casing and all, so the
// column walking on it carries the frame. Nothing else is coloured.
//
// WORLD STATE (May 1520; agrees with cuts 1-3): Cortes's men are in
// Tenochtitlan, 39 orange dots at 1 dot = 10 men, the HoldRing on the city
// dot; Narvaez's 90 cream are camped at Cempoala on the coast at CREAM_REST
// (calm, the house micro-drift only, not moving); Cortes's road stands, in cut
// 1's width law and casing, from the city down to the edge of Narvaez's camp
// (road s 36.6: its casing ends ~0.9 world px short of the nearest cream man;
// director's review 1 extended it from cut 3's drawn end at s 71, the spot
// where Cortes's body will stand, so the column never walks past the end of
// the line). Every dot stands on land: the city stands in Lake Texcoco (its
// island is smaller than a dot here), so the crowd stands on the land at its
// gates, south-west of the city, trimmed by the lake shore, the city's ring at
// its lakeward edge (as Cempoala is at the seaward edge of the crowd at
// Cempoala). The 27 who leave are the force that stands as ORANGE_REST at
// Cempoala in the other cuts (ids 90..116); the 12 who stay are Alvarado's
// garrison (ids 117..128).
//
// THE GESTURES, each with its word (frames at 24 fps). One motion: most of the
// orange crowd pours out of the capital as a column and streams down the road
// toward the sea while the camera rises and travels with it until the real Gulf
// coast, with Narvaez's camp on it, is in frame ahead of them.
//   1. "takes as many men" f0-f13. Open close on Tenochtitlan, its lake and
//      ring at k 6.5 (dots 16 px across), the city and its crowd centred on
//      (540, 835), the camera already gliding east and out (10.8 px/f at the
//      frame centre on f0). The crowd divides: the 27
//      flow as one body toward its south-east edge and peel off as a head-led
//      column (cut 3's march: three files 3 world px apart, ranks 3.25 apart,
//      the middle file half a rank back, a hair of jitter per man; it fills a
//      rank at a time with the waiting men nearest to where the rank will land,
//      matched to its files in lateral order, so no path crosses another); the
//      head is at the formation point on f0-f1 (the march sets off at f-2,
//      1.35 world px/f after a 12-frame ramp). The column forms on land (the
//      road leaves the city across the lake on the Iztapalapa causeway and runs
//      along the southern lakes) and a C1 lead-in, south of the lakes, puts it
//      onto the road east of the lakes, its head on the road on "men as" f13.
//      The 12 gather (f-1..f13, each on his own phase) into a small packed
//      knot against the shore at the city's HoldRing and stay there, alive
//      (the house micro-drift), to the end.
//   2. "as he can to the coast" f13-f31. The column streams down CORTES_ROAD,
//      even spacing and individual jitter; the last man falls in on f28. The
//      camera makes ONE long C1 glide east with a pull-back (k 6.5 -> 4.3 on
//      "coast" f31; peak pan 13.3 px/f at the frame centre on f9), the column
//      head in the middle third throughout (screen x 437..597). On "coast"
//      f31 the frame shows the whole run (knot to water-lines 233..841 px, 56 %
//      of the width; dots 10.8 px across), its box centred on (540, 835): the
//      knot at Tenochtitlan in the left third (the city x 285), the column at
//      the Cholula bend of the road, the camp (x 618..757) and the Gulf coast
//      (x 803) with its water-lines toward the right third.
//   3. Tail f31-f57. The column keeps marching toward the coast (the head
//      reaches road s ~54 on f57, ~17 world px past the road's halfway mark,
//      ~12 short of the camp and ~17 short of the drawn road's end), the camera
//      keeps drifting east and out, its speed decaying (0.47 px/f at the frame
//      centre on f57, k 4.20), never frozen.
// Nothing else.
//
// SOURCES. scripts/cortes-geo.json (the director's sites: Tenochtitlan
// 19.435 N 99.133 W, Cempoala 19.448 N 96.405 W, San Juan de Ulua; Cortes's
// road Cempoala - Xalapa - ... - Tlaxcala - Cholula - Paso de Cortes -
// Iztapalapa - Tenochtitlan, "the same road down to Cempoala in May 1520";
// Lake Texcoco 1519; the facts: Narvaez ~900 men (90 dots), Cortes 266 at
// Cempoala (27 dots), 1 dot = 10 men, "Cortes had left ~80-200 men with
// Alvarado in Tenochtitlan"). Alvarado's garrison: 80-140 men per Diaz del
// Castillo / Prescott, ~120, drawn as 12 dots. The coast is Natural Earth 10m
// (world-atlas) in the shared bake, the same as every approved cut: on "coast"
// the framed coastline is the Veracruz coast of the Gulf of Mexico, Cempoala
// 9.8 km inland of it, San Juan de Ulua on the shore.
//
// CAMERA (with the house sway; scanned over fixed world points and a probe
// grid above the caption band): probe grid max 24.7 px/f (f10), fixed points
// max 23.8 px/f (San Juan de Ulua at the right edge, f6); max |dv| 0.94
// px/f^2 at fixed points, 1.11 on the grid; one acceleration lobe, one
// deceleration lobe, then the creep (fixed points never under 0.50 px/f). The
// map stays sharp (close level 1.17+ texels/px to f17, near 1.10+ after; the
// close -> near crossfade is passed in motion, f18-f22; k 6.5 at the open and
// 4.2 at the end are outside every crossfade band). Content centred on
// y ~835; nothing important below y 1150.
// ---------------------------------------------------------------------------

export const schema = z.object({
  vignette: z.number(),
  roadOpacity: z.number(), // the standing road's rung (the context rung: the column walks on it)
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({
  vignette: 0.55,
  roadOpacity: INK_CONTEXT,
});

// the road (cut 1's width law and casing), from the edge of Narvaez's camp to the city
const ROAD_D = CORTES_ROAD.partialD(ROAD_END_S, ROAD_LEN);

const ToTheCoast: React.FC<Props> = ({ vignette, roadOpacity }) => {
  const frame = useCurrentFrame();
  const fi = Math.min(LAST, Math.max(0, Math.round(frame)));
  const cam = swayCam(CAM_TRACK[fi], frame);
  const k = cam.k;
  const px = (v: number) => v / k;
  const RW = 3.6 * Math.pow(k, 0.1); // cut 1's road width (screen px)
  const dots = [...campDotsAt(fi, k), ...cityDotsAt(fi, k)];

  return (
    <AbsoluteFill style={{ backgroundColor: SEA }}>
      <MapStack cam={cam} />
      <WorldSvg cam={cam}>
        {/* CORTES'S ROAD, standing, at the context rung */}
        <g fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={roadOpacity}>
          <path d={ROAD_D} stroke={DARK} strokeOpacity={0.6} strokeWidth={px(RW + 3.2)} />
          <path d={ROAD_D} stroke={ACCENT} strokeWidth={px(RW)} />
        </g>

        {/* what he holds */}
        <CityDot x={TENOCH[0]} y={TENOCH[1]} cam={cam} />
        <HoldRing x={TENOCH[0]} y={TENOCH[1]} cam={cam} />

        {/* the men: Narvaez's camp, Cortes's column and Alvarado's garrison */}
        <CrowdDots dots={dots} cam={cam} />
      </WorldSvg>
      <PaperTop vignette={vignette} />
    </AbsoluteFill>
  );
};

export default ToTheCoast;
