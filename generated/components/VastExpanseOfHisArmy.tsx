import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { Litter } from "./incaGlyphs";
import {
  CanvasDots,
  CrowdDots,
  INK,
  INK_CONTEXT,
  INK_FULL,
  MapLabel,
  PlanPage,
  PlazaPlan,
  ROAD_TO_CAMP,
  RouteLine,
  WorldSvg,
  hash,
  smoothstep,
  swayCam,
} from "./incaShared";
import { CAM_TRACK, DURATION, FPS, LABELS, LAST, SPANIARDS, armyLayersXY, headV, litterAt, processionXY } from "./vastArmyMotion";

export { DURATION, FPS };

// ---------------------------------------------------------------------------
// VastExpanseOfHisArmy (V2, town first). Dwarkesh Patel with Si Sheppard,
// clip "Sheppard_Atahualpa_ambush", cut 2, on the shared Peru world
// (incaShared.tsx, the Cajamarca local plan; the litter is the shared
// incaGlyphs Litter, the same drawing as cut 3). The line:
// "And then he proceeds to meet with Pizarro at Cajamarca with the vast
// expanse of his army."
//
// TIMELINE. The SRT is on the edit timeline; in-point 56.10 s = f0;
// frame = round((t - 56.10) * 24):
//   and f0 · then f7 · he f10 · proceeds f14 · to f28 · meet f35 · with f42 ·
//   Pizarro f52 · at f69 · Cajamarca f87 · with f100 · the f104 · vast f106 ·
//   expanse f112 · of his f121 · army f127 ("army" ends 61.66 s = f133).
// DURATION: "and" 56.10 -> "army" ends 61.66: round(5.56 * 24) = round(133.44)
// = 133, + the 16-frame house tail = 149 frames (f0..f148).
//
// DWARKESH MAP STYLE on THE CAJAMARCA LOCAL PLAN (incaShared PlanPage: umber
// land #3F3428, world-space mottle, grain, vignette; the 1532 plaza as an
// engraved cream plan, PlazaPlan; the causeway ROAD_TO_CAMP at the context
// rung). Opaque 1080x1920, 24 fps. 1 local unit = 1 metre; 1 dot = 1 man on
// both sides (CanvasDots for the 86,000 cream, CrowdDots for the 168).
//
// COLOUR RULE: house orange (#FFB000) = PIZARRO'S SIDE ONLY: his 168 men,
// orange dots at the full rung. Everything Inca is cream #E9DDBF: the
// procession and the litter at the full rung; the army a mid-tone stipple
// (four interleaved low-alpha layers, so overlapping dots build density and
// the densest areas reach ~0.6 of the cream, never solid); the road, and the
// labels once they have landed, at the context rung (0.5). Nothing else is
// coloured.
//
// THE GESTURES, each with its word (frames at 24 fps). One continuous motion.
//   1. f0 ("and then he"). Open on the plaza at k 2.0 (the plaza 364 px wide,
//      its box centre on (430, 826), the road leading off east to the right
//      edge): Pizarro's 168 at full orange as individual dots (5.4 px) in the
//      three halls, in their doorways, on and by the platform and inside the
//      two gates. The camera is already drifting slowly east (the plaza moves
//      left ~0.8 px/f), toward what is coming.
//   2. "proceeds" f14. The procession enters the frame from the right along
//      the road (its head on the right edge on f14; it has been coming from
//      the camp, off-frame, at ~10.7 m/f, slowing to 7.8 by f52): ONE
//      continuous organic column of men (V3), its squadrons density pulses
//      along a single ribbon (the sweepers first, three dancing squadrons,
//      the lords with Atahualpa's litter riding among their leading ranks,
//      the rest in five looser bodies), each pulse with a soft rounded head
//      and tail, joined by thin trickles of men (never a clean gap); the
//      ribbon wide where it is dense, narrow between, its edges ragged, a few
//      stragglers past them; every man a visible dot (~1.4 m apart, ~2.7 px
//      at this zoom). Its marching rhythm: a slow surge runs back along the
//      column (each squadron in turn bunches and draws out, +-1.5 m, a 30 f
//      period), and each man sways a little on his own phase; both die away
//      as it halts. The litter (the shared engraved glyph, ~70 px wide close
//      up, its bearers stepping with the column) rides inside the flow. It
//      leaves the road just short of the plaza's open-country corner and
//      comes round the outside of its SE wall (the gates open on the town
//      side) toward the SW (town-side) gate, funnelling through it.
//   3. "Pizarro" f52. PIZARRO (IM Fell English SC, MapLabel) slides up under
//      the plaza, on the orange (from f44, landing f52); the plaza now at
//      (388, 806), k 1.88, the procession's head at its SE wall.
//   4. "Cajamarca" f87. The camera has eased back (k 1.88 -> 1.0, the plaza
//      moving to (300, 826), where it then holds): CAJAMARCA lands above the
//      plaza (from f79), PIZARRO drops to the context rung (f81-f91). The
//      procession's head reaches the SW gate on f87 (it halts 24 m inside and
//      the column closes up behind it). The front of the halted army (the
//      three divisions, 0.65-1.1 km out) just edges into the far right as a
//      hint of mass.
//   5. "the vast expanse of his army" f88-f126. ONE big pull-back: a log-k
//      S-curve (its fastest, 8.6 % per frame, on f102) from k 1.0 to 0.1 on
//      f122 (5 f before "army"), anchored on the plaza, which holds its
//      screen point (300-305, 826-828) throughout, so the plain to the right
//      fills as the camera rises: the three divisions at the army's front,
//      the fields behind them back to the camp at the springs (5.9 km off),
//      the army still streaming in. Its centre of mass lands on (663, 885).
//      CAJAMARCA drops to the context rung over it (f98-f120) and rises 44 px
//      so it clears the north division; PIZARRO shifts 46 px left so it
//      clears the south one.
//   6. Tail f127-f148. The army still settling (14,600 men still walking on
//      f148), the zoom still creeping out (0.2 % per frame), never a stop.
// Nothing else: no rings, glows, flashes, arrows, numbers or a "camp" label.
//
// THE ARMY'S LOOK. Organic and feathered, never a slab: the camp at the
// springs a broad, round, thin field (an organic oval 2.3 x 3.0 km, density
// easing to a feathered edge), its western side emptying as the tail; on the
// way each man closes up toward the road (a long-tailed lateral profile, so
// the army moves as two broad feathered streams flanking the procession's
// road), and opens out into his place only as he arrives; the fields thickest
// along the road, easing outward and fraying into fingers (streaks along the
// march) and stragglers at the margins; the three divisions dense blue-noise
// masses (incaShared packCrowd) with irregular outlines (V3: a rounded
// superellipse with low harmonics, each tilted a little), wider across the
// road than deep, their fronts toward the town ragged with a few men
// straggling ahead, the edges thinning. Departures run front to rear from f-46 to
// f131 (each man at his own time, speed and pace, so no rank moves as a
// line); every dot breathes with a 0.3 px drift.
//
// NUMBERS AND SOURCES (FACTS.md, the director's fact sheet; never on screen).
//   Atahualpa's army: 80,000 dots = Hemming's "nearly 80,000" (The Conquest of
//   the Incas, 1987 p.36 / 1993 pp.31-32), popularised by Diamond (Guns,
//   Germs, and Steel, ch. 3), Mena's upper figure ("more than 80,000", the
//   captains saying 40,000 publicly; Mena p.238). The eyewitnesses' usual
//   figure is 40,000 (Xerez pp.50, 58; Pedro Pizarro p.174; Trujillo p.53).
//   The procession: 6,000 dots ON TOP of the 80,000 (the procession left the
//   camp too; director's call, V2 review): Hernando Pizarro p.117, "five or
//   six thousand Indians without arms"; order of march Xerez p.53 (sweepers
//   in chequered livery, three dancing squadrons, the lords with plates and
//   crowns, the litter "carried high on many shoulders"); 400 sweepers (Mena
//   p.240), 80 bearers (the Relacion, via Markham p.53n); the other sections'
//   sizes are not given (drawn: 3 x 250 dancers, 600 lords, the rest to
//   6,000), nor its length (drawn ~740 m, peaks of ~10 men per metre, the
//   litter 163 m behind the head). Its way in: the gates are on the town side (incaShared PLAZA:
//   Xerez's two doorways onto the streets), so it rounds the plaza's SE wall
//   to the SW gate (34 m out from the wall: the town's street; a neutral
//   choice, the town plan is not known).
//   Pizarro's 168 = 62 horse + 106 foot (Hemming; Lockhart, The Men of
//   Cajamarca): the horse in three groups, one to a hall (21 / 21 / 20: Mena
//   p.240, Trujillo p.53); 8 foot in each hall's doorways; Candia and 8
//   arquebusiers on the platform (Mena p.240); Pizarro and 24 at its foot
//   (Trujillo p.53, "en la fortaleza con 24 hombres"); the other 48 foot just
//   inside the two gates, flanking the passage (Mena p.240, "the rest guarded
//   the gates").
//   The camp: Atahualpa at the springs (Pedro Pizarro pp.174-175; Pultumarca,
//   Banos del Inca, OSM -7.1622, -78.4640 = incaShared CAMP), its tents "on
//   the skirts of a small hill, stretching for a league" (Xerez pp.47-50) /
//   "more than half a league" (Mena p.232) (orientation not given). He left
//   camp at noon (Hernando Pizarro p.117; Mena p.238); his warriors marched in
//   the fields on both sides of the road, never on it (Pedro Pizarro p.180:
//   the road is kept clear along the procession); he halted ~0.5-0.7 km from
//   the town ("half a quarter of a league") in three divisions, "the whole
//   road was full of men" (Hernando Pizarro p.117); Hemming: the main force
//   ~1-1.4 km out. Drawn: three divisions of 4,000 (the centre ~300 m deep
//   and ~600 m across the road, the wings ~280 x 480 m; 0.65-1.1 km out: the
//   centre on the road, a wing each side set back), 52,400 in the fields
//   behind them, 15,600 still in and by the camp
//   ("as full of people as if none were wanting" the next morning, Hernando
//   Pizarro p.119). The road is the world's ROAD_TO_CAMP (a gentle curve
//   between the real ends; its real course is not mapped). The plaza is the
//   world's PLAZA schematic (incaShared; FACTS section 3).
//
// CAMERA (vastArmyMotion CAM_KEYS / buildCamera; the house sway on top): the
// plaza's screen point on a monotone cubic through its keys (it holds through
// the pull-back), ln k the integral of solved cosine-tapered bumps. camScan
// (probe grid above the caption band): f0-f80 max 27.0 px/f (f79), max |dv|
// 1.54 px/f^2; the pull-back's corners peak at 81 px/f (f102) and |dv| 4.2
// px/f^2 (f117), as a zoom does (accepted by the director); the plaza point
// itself never exceeds 3.6 px/f, |dv| 0.35 px/f^2.
// ---------------------------------------------------------------------------

export const schema = z.object({
  vignette: z.number(),
  roadOpacity: z.number(), // the causeway's rung (context)
  labelRest: z.number(), // the labels' resting rung
  armyMax: z.number(), // the army's cream where it is densest (never solid)
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({
  vignette: 0.55,
  roadOpacity: INK_CONTEXT,
  labelRest: INK_CONTEXT,
  armyMax: 0.6,
});

const lnk01 = (k: number, a: number, b: number) => smoothstep((Math.log(k) - Math.log(a)) / (Math.log(b) - Math.log(a)));
/** the army's dot radius (screen px): sub-pixel in the wide, resolved close */
const armyR = (k: number) => 0.7 + 0.5 * lnk01(k, 0.2, 1.2);
/** the army's per-layer alpha: low in the wide (ARMY_LAYERS overlapping layers
 *  build at most 1 - (1 - a)^4), high close up where the dots stand apart */
const armyAlpha = (k: number, max: number) => {
  const wide = 1 - Math.pow(1 - max, 1 / 2.4); // the densest areas reach ~max
  return wide + (0.62 - wide) * lnk01(k, 0.2, 1.0);
};
/** the procession's dots: resolved and full close up, a mid-tone thread in the wide */
const procR = (k: number) => 0.62 + 0.3 * lnk01(k, 0.15, 1.7);
const procAlpha = (k: number) => 0.46 + (0.82 - 0.46) * lnk01(k, 1.1, 1.85);
/** the 168: countable orange specks, legible on a phone close up */
const spaniardR = (k: number) => 1.25 + 1.45 * lnk01(k, 0.15, 1.7);
/** the litter (incaGlyphs, size = screen px per 100 units): ~70 px at k 1.9 */
const litterSize = (k: number) => 61 * Math.pow(k / 1.9, 0.62);

const VastExpanseOfHisArmy: React.FC<Props> = ({ vignette, roadOpacity, labelRest, armyMax }) => {
  const frame = useCurrentFrame();
  const fi = Math.min(LAST, Math.max(0, Math.round(frame)));
  const cam = swayCam(CAM_TRACK[fi], frame);
  const k = cam.k;

  const army = armyLayersXY(fi, k);
  const proc = processionXY(fi, k);
  const rA = armyR(k);
  const aA = armyAlpha(k, armyMax);

  const [lx, ly] = litterAt(fi);
  const gait = smoothstep(headV(fi) / 2.5);

  const rS = spaniardR(k) / k;
  const spaniards = SPANIARDS.map(([x, y], i) => {
    const a = 0.25 / k;
    return {
      x: x + a * Math.sin(fi * (0.05 + 0.04 * hash(i, 41)) + 6.283 * hash(i, 42)),
      y: y + a * Math.sin(fi * (0.05 + 0.04 * hash(i, 43)) + 6.283 * hash(i, 44)),
      t: 1,
    };
  });

  // the labels' rungs: PIZARRO full until CAJAMARCA arrives, then the context
  // rung; CAJAMARCA full until the pull-back takes the frame wide
  const pizOp = INK_FULL - (INK_FULL - labelRest) * smoothstep((fi - (LABELS.cajamarca.f0 + 2)) / 10);
  const cajOp = INK_FULL - (INK_FULL - labelRest) * smoothstep((fi - 98) / 22);
  const cajDy = LABELS.cajamarca.dy + (LABELS.cajamarca.dyWide - LABELS.cajamarca.dy) * (1 - lnk01(k, 0.1, 0.35));

  return (
    <PlanPage cam={cam} vignette={vignette}>
      <WorldSvg cam={cam}>
        <RouteLine route={ROAD_TO_CAMP} cam={cam} width={1.4} casing={2.2} opacity={roadOpacity} />
        <PlazaPlan cam={cam} />
      </WorldSvg>
      <CanvasDots
        cam={cam}
        layers={[...army.map((xy) => ({ xy, r: rA, color: INK, opacity: aA })), { xy: proc, r: procR(k), color: INK, opacity: procAlpha(k) }]}
      />
      <WorldSvg cam={cam}>
        <CrowdDots dots={spaniards} cam={cam} radius={rS} casing={1.2} />
        <Litter x={lx} y={ly} cam={cam} size={litterSize(k)} frame={frame} gait={gait} />
      </WorldSvg>
      <MapLabel
        text="PIZARRO"
        x={LABELS.pizarro.anchor[0]}
        y={LABELS.pizarro.anchor[1]}
        dy={LABELS.pizarro.dy}
        cam={cam}
        frame={frame}
        f0={LABELS.pizarro.f0}
        size={LABELS.pizarro.size}
        anchor="end"
        dx={LABELS.pizarro.dx + (LABELS.pizarro.dxWide - LABELS.pizarro.dx) * (1 - lnk01(k, 0.1, 1.0))}
        opacity={pizOp}
      />
      <MapLabel
        text="CAJAMARCA"
        x={LABELS.cajamarca.anchor[0]}
        y={LABELS.cajamarca.anchor[1]}
        dy={cajDy}
        cam={cam}
        frame={frame}
        f0={LABELS.cajamarca.f0}
        size={LABELS.cajamarca.size}
        opacity={cajOp}
      />
    </PlanPage>
  );
};

export default VastExpanseOfHisArmy;
