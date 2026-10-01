import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { Carrack, MapLabel, MapStack, PaperTop, SEA, WorldSvg, screenOf, swayCam } from "./cortesShared";
import { DURATION, FPS, SHIPS, T, camAt, leadAnchor, shipAt, shipSize } from "./largerForceMotion";

export { DURATION, FPS };

// ---------------------------------------------------------------------------
// LargerForce. Dwarkesh Patel with Si Sheppard, clip
// "Sheppard_Cortes_recruits_the_arrest_army" (cut 2, on the shared Cortes world,
// cortesShared.tsx). The line: "and he sends, under Panfilo de Narvaez, a larger
// force than the one Cortes brought with him originally." (the SRT reads "and he
// sends us under penfeyel de nevarez a larger force than the one cortes brought
// with him originally").
//
// TIMELINE. The SRT (media-to-srt output ..._c4_p0.5.srt) is on the EDIT
// timeline (the mp3), not the clip folder's longer raw .mov. In-point 25.44 s.
//   frame = round((t - 25.44) * 24)
//   and he f0 · sends f9 · us f15 · under f19 · Panfilo f28 · de f47 ·
//   Narvaez f50 · a f70 · larger f72 · force f80 · than f88 · the f91 · one f93 ·
//   Cortes f98 · brought f112 · with f118 (30.339 s; the brief's f117) · him f121 ·
//   originally f124, which ends 31.079 s (f135).
// DURATION: round((31.08 - 25.44) * 24) = round(135.36) = 135, + the 16-frame
// house tail = 151 frames.
//
// DWARKESH MAP STYLE (MEMORY.md) via the shared world: the baked LOD map, mottle,
// grain, vignette, IM Fell English SC labels sliding up 24 px as they fade in,
// the shared Carrack glyph (one engraved stroke family). Opaque 1080x1920, 24 fps.
//
// COLOUR RULE: house orange (#FFB000 / #D98A0C) = CORTES'S SIDE only: his 1519
// fleet, drawn as hollow orange carracks (the remembered fleet). Everything else
// is cream #E9DDBF at the two rungs: full for what is in play (Narvaez's fleet,
// the names), ~0.5 for context (the map's ink). Nothing else is coloured.
//
// GEOGRAPHY. At this world's scale (0.383 world px / km) Cabo Catoche, Yucatan's
// NE corner, lies 84 world px west and 12 px SOUTH of Cabo San Antonio, so no
// westbound band of four files can pass south of the cape and keep west: it
// would run onto Yucatan. Both fleets therefore come in from the east through
// the Florida Straits (between Cuba's north coast and the Keys), round the
// island's western end on its north side and sail due west across the open Gulf,
// north of Catoche and of the Alacranes reef (checked against the world's land
// mask every frame, hulls and sails). The orange lane is the southern one, next
// to Cuba, as briefed (cream above, orange below).
//
// THE GESTURES, each with its word (frames at 24 fps). One continuous motion:
// words are where beats land, each gesture starts before the last one ends.
//   1. "and he sends us under" f0-f28. Open at k 3.20 on Cuba's western end (the
//      cape at the right, x 716 / y ~1150; open Gulf to the west). Cream
//      carracks come in from the right edge along Cuba's north-west coast (the
//      first three are in at f0) and round the island's western end (a 10 deg
//      bend): the lead is off Cuba's last point on "sends" (f9, world x 661) and
//      passes the cape's longitude on "under" (f20).
//      Ships keep coming at uneven intervals (3-6 f: the rows' gaps and the
//      second file's stagger wander), forming a loose convoy in two files, 10
//      north and 9 south, with wakes. The camera drifts west (k 3.20 -> 3.15).
//   2. "Panfilo de Narvaez" f28-f50. PANFILO slides up beside (above) the
//      cream lead from f38 (full f47); DE NARVAEZ 3 f behind it (full f50). The
//      two lines ride the lead ship (its anchor, not its bob).
//   3. "a larger force" f50-f88. The pour keeps coming until all 19 are in
//      (the 19th fully in frame f74, before "force" f80) while the camera eases
//      back, k 3.15 -> 2.45 (f50-f98), so the whole convoy fits, centred; the
//      convoy settles from ~3.6 to ~1.2 world px/f by f98 and then sails on
//      steadily (~0.8).
//   4. "than the one Cortes brought with him originally" f88-f135. Cortes's 1519
//      fleet, 11 HOLLOW orange carracks (6 south + 5 north), the same size and
//      file spacing, comes round Cuba's western end on the lane south of the
//      cream (first visible f81, all in by f107), closing at a steady 5.6 world
//      px/f, then sheds that along a smoothstep from f110 and keeps the cream's
//      pace from f124: its rows copy the cream's rows 4..9, so its sterns are
//      level with the cream sterns and every orange ship sails level with a
//      cream one; the cream runs 4 rows on (about 1.7x as long). CORTES slides
//      up under the orange lead from f89 (full f98) and rides it (it lands just
//      above Cuba's western end and clears the coast by ~f104). By "originally"
//      f124 the comparison is complete; the camera holds both centred (cream
//      above, orange below), travelling west with them and creeping in (k 2.45
//      -> 2.52).
//   5. Tail f135-f150: both fleets keep sailing (the map drifts beneath them,
//      bob, pitch, drift and wakes run on, hashed, never in unison).
// Nothing else: no route lines, no counts, no other labels.
//
// SIZES (screen px at k 2.45, fixed in the world): carrack 56 (64 at k 3.2;
// size ~ k^0.5), rows 80 apart, files 58 apart, the lane gap 76. Camera (with the
// house sway), scanned over fixed world points and a probe grid: max 6.5 px/f,
// max |dv| 0.51 px/f^2, never at rest (min 0.70 px/f); ships at most 23 px/f.
//
// SOURCES (scripts/cortes-geo.json): Narvaez sailed 5 March 1520 with 19 ships
// (~900 men; Wikipedia, Battle of Cempoala); Cortes had sailed in February 1519
// with 11 ships (~500 men; Wikipedia, Hernan Cortes; Diaz del Castillo). Ship
// counts are the honest comparison: exactly 19 and 11 are drawn. Geography:
// Natural Earth 10m land, baked into the shared Cortes world.
// ---------------------------------------------------------------------------

export const schema = z.object({
  labels: z.object({
    narvaez1: z.string(),
    narvaez2: z.string(),
    cortes: z.string(),
  }),
  labelSize: z.number(),
  wakeCream: z.number(),
  wakeOrange: z.number(),
  vignette: z.number(),
});
export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  labels: { narvaez1: "PÁNFILO", narvaez2: "DE NARVÁEZ", cortes: "CORTÉS" },
  labelSize: 40,
  wakeCream: 0.6,
  wakeOrange: 0.5,
  vignette: 0.55,
});

const LINE = 1.12; // line height of the two-line label, in label sizes

const LargerForce: React.FC<Props> = ({ labels, labelSize, wakeCream, wakeOrange, vignette }) => {
  const frame = useCurrentFrame();
  const cam = swayCam(camAt(frame), frame);
  const size = shipSize(cam.k);

  // the ships in view, drawn north -> south (the nearer file in front)
  const ships = SHIPS.map((sd) => {
    const [x, y] = shipAt(sd, frame);
    return { sd, x, y };
  })
    .filter(({ x, y }) => {
      const [sx, sy] = screenOf([x, y], cam);
      return sx > -0.6 * size && sx < 1080 + 1.2 * size && sy > -20 && sy < 1920 + size;
    })
    .sort((a, b) => a.y - b.y);

  // the labels ride their lead ship (no drift, no bob)
  const cl = leadAnchor("cream", frame);
  const ol = leadAnchor("orange", frame);
  const bow = -0.55 * size; // the lead's bowsprit, screen px from its anchor
  const above = -(0.82 * size + 10); // baseline of the lower line, just over the pennant
  const below = 0.066 * size + 8 + 0.68 * labelSize; // baseline just under the keel

  return (
    <AbsoluteFill style={{ backgroundColor: SEA }}>
      <MapStack cam={cam} />
      <WorldSvg cam={cam}>
        {ships.map(({ sd, x, y }) => (
          <Carrack
            key={`${sd.fleet}-${sd.j}`}
            x={x}
            y={y}
            cam={cam}
            frame={frame}
            size={size}
            seed={sd.seed}
            hollow={sd.fleet === "orange"}
            wake={sd.fleet === "orange" ? wakeOrange : wakeCream}
          />
        ))}
      </WorldSvg>
      <MapLabel text={labels.narvaez1} x={cl[0]} y={cl[1]} cam={cam} frame={frame} f0={T.narvaezLabel} size={labelSize} anchor="start" dx={bow} dy={above - LINE * labelSize} />
      <MapLabel text={labels.narvaez2} x={cl[0]} y={cl[1]} cam={cam} frame={frame} f0={T.narvaezLabel2} size={labelSize} anchor="start" dx={bow} dy={above} />
      <MapLabel text={labels.cortes} x={ol[0]} y={ol[1]} cam={cam} frame={frame} f0={T.cortesLabel} size={labelSize} anchor="start" dx={bow} dy={below} />
      <PaperTop vignette={vignette} />
    </AbsoluteFill>
  );
};

export default LargerForce;
