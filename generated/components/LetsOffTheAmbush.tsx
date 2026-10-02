import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { CanvasDots, CrowdDots, INK, INK_FULL, PlanPage, PlazaPlan, WorldSvg, swayCam, type Cam } from "./incaShared";
import { Horseman, LITTER_UNITS, Litter } from "./incaGlyphs";
import { Falconet, MuzzleFlash, SmokeDefs, SmokePuff, falconetMuzzle } from "./ambushGlyphs";
import {
  ARQ_SHOTS,
  CAM_TRACK,
  DURATION,
  FPS,
  GUNS,
  GUN_LEN_M,
  HIDDEN_RUNG,
  HORSE_TILT,
  LAST,
  LITTER,
  PUFFS,
  RIDERS,
  SPANIARDS,
  crowdAt,
  crowdR,
  gunRecoil,
  manAt,
  manR,
  puffAt,
  riderGlyph,
  riseOf,
} from "./ambushMotion";

export { DURATION, FPS };

// ---------------------------------------------------------------------------
// LetsOffTheAmbush. Dwarkesh Patel with Si Sheppard, clip
// "Sheppard_Atahualpa_ambush" (Pizarro and Atahualpa, Cajamarca, 16 Nov 1532),
// cut 3, on the shared Peru world (incaShared.tsx, the Cajamarca local plan).
// The line: "That's when Pizarro lets off the ambush. He lets fly with all his
// artillery and all his musketry for the shock value, unleashes his horses."
//
// TIMELINE. In-point 71.94 s on the edit timeline (the SRT); frame =
// round((t - 71.94) * 24): that's f0 · when f9 · Pizarro f11 · lets f19 ·
// off f25 · the f31 · AMBUSH f33 · he f46 · lets f49 · fly f53 · with f59 ·
// all f62 · his f67 · ARTILLERY f75 · and f83 · all f88 · his f90 ·
// MUSKETRY f92 · for f102 · the f106 · SHOCK f112 · value f118 ·
// UNLEASHES f135 · his f145 · HORSES f149 ("horses" ends 78.70 s = f162).
// DURATION: 71.94 -> 78.70 s = 6.76 s; round(6.76 * 24) = round(162.24) = 162,
// + the 16-frame house tail = 178 frames (f0..f177).
//
// DWARKESH MAP STYLE on the Peru world's local plan: the umber page (PlanPage:
// mottle, grain, vignette), the plaza as an engraved cream plan (PlazaPlan:
// the wall, three halls with dark roofs and 20 doorways each, the two gates,
// the ushnu platform = "fortress" with its stair). Opaque 1080x1920, 24 fps.
// No labels (Pizarro was named in cut 2), no arrows, no rings, no red, no
// screen shake, no whole-frame flash. Five element types: crowd dots, orange
// foot (dots), horsemen, guns (+ their flashes), smoke; the litter belongs to
// the crowd's world. The litter (with its bearers) and the horseman are the
// clip's shared glyphs (incaGlyphs.tsx, the same as cut 2's litter); the
// falconet, flash and smoke are this cut's (ambushGlyphs.tsx).
//
// COLOUR RULE: orange (#FFB000 / #D98A0C) = PIZARRO'S SIDE only: his 168 men
// (the 62 horsemen and the 106 foot, hidden at the 0.3 rung until the wave),
// his two guns and every muzzle flash. Everything Inca is cream: the 6,000
// (full rung, 0.86) and the litter with its bearers. Gun smoke is cream at a low rung (each puff 0.08..0.11, ~0.2..0.3
// where puffs overlap), thinning to ~a third by the end.
//
// THE GESTURES, each with its word (one continuous motion; frames at 24 fps):
//   1. "that's when Pizarro lets off" f0-f30. The packed square is alive: each
//      man presses a little toward the litter (<= 0.75 m by f60) and sways (a
//      0.19 m lean toward / away from the litter and a 0.13 m drift, each on
//      his own hashed phase); the camera creeps in toward the litter (k 4.45 ->
//      4.8, the litter on the frame's axis, the plaza's box in the
//      caption-safe band). Already there, dim under the dark roofs at the
//      hidden rung (0.3): the 62 horsemen saddled and waiting in their three
//      halls, horse-and-rider glyphs (5.2 m = 23 px) standing two deep behind
//      the middle doorways, facing them, each shifting his weight on his own
//      slow phase; the foot as dim dots at the gates and on the platform.
//      Tension before the release.
//   2. "ambush" f33. The trap opens: one fast wave leaves Pizarro's group on
//      the platform on "lets" (f19) and runs along the halls (the NE and SE
//      fronts from the platform, the gates at the corners, then the west hall
//      from both ends) to its last doorway on f27 (8 f end to end); as it
//      reaches him each man rises from the hidden rung to full orange over 6 f
//      and steps up: the horsemen 0.8 m toward their doorways (the front man's
//      nose at the opening), the gate foot into the gate openings, Pizarro's
//      men toward the square. The last lands on "ambush" (f33): the halls are
//      visibly full of orange horsemen and the whole ring of the trap reads at
//      a glance. Held breath f33-f39 (nothing new; the camera barely moving).
//   3. "artillery" f75. The camera glides to the platform and the near crowd
//      (k 7.5 by f68). Candia's two falconets fire on f73 and f77: a 5-frame
//      flash each (seven short engraved orange rays and a small star at the
//      muzzle, no glow), the gun runs back and returns, and nine cream puffs
//      roll out over the crowd from each muzzle, billow, drift on a slow wind
//      and thin out for the rest of the cut.
//   4. "musketry" f92. From the same platform, the same framing (a 4 % push-in
//      holds it): the eight arquebusiers at the stair's head (two ranks of
//      four) fire in a ripple f85..f92, a 4-frame flash of five rays and two
//      small puffs each, landing on "musketry".
//   5. "for the shock value" f102-f125. The crowd recoils: a fear front leaves
//      the guns on f97 and crosses the square at 5 m/f (to ~f124); each man,
//      as it reaches him, flees radially from the guns (40 m at the guns,
//      falling to nothing at 172 m), parting round the litter's block and
//      closing in behind it (potential flow past a 6.5 m cylinder), off the
//      doorways (2.4 m) and toward the nearest gate (7 m within 55 m of it);
//      the men shove into each other (the spacing tightens to 0.76 of the
//      packing's) and press to the far side and the gates; the walls hold (the
//      breach is a later cut). Physics from smoothed inputs (a spring toward
//      each man's moving target, speed-capped; position-based spacing, walls
//      and footprints; gaussian-smoothed in time). The camera pulls back to
//      hold the whole square (k 4.33 by f136, the litter at (540, 745)).
//   6. "unleashes his horses" f135-f162. The payoff is the release of what we
//      saw waiting: the burst sets off on f132, just before "unleashes", and
//      the same 62 glyphs break into the gallop and ride straight out of their
//      own doorways (the man behind ~1.6 f after the man in front), growing from
//      their waiting size to the charging size (6.8 m = 30 px at k 4.4) as they
//      leave; every rider leaves his hall at the full burst: 32 out by f140,
//      all 62 by f145, before "horses" (f149). Each hall's riders then gather
//      on curving paths into one loose body (a charging line two or three
//      deep: even blue-noise slots in a broad ellipse, 17 m half-width, 8.5 m
//      half-depth, on the litter's line), all on one clock (the group's nose
//      from 14 to 50 m into the square, late enough that they have spread in
//      depth before they close up, so no rider crosses another), the body
//      deepening as its back rows drop to half the nose's pace once past their
//      doorways (nobody ever runs backward): 2.0 m/f out of the doors,
//      bleeding to 0.4 m/f in the crush (time compressed ~3x, as the whole
//      line is). The glyph: an engraved horse and rider in profile, mirrored to
//      face its travel and tilted toward it (0.45 of its angle, <= 22 deg:
//      steeper, the diagonal groups read as diving or rearing), a 3-pose
//      gallop (3 f a pose). The crowd parts ahead of each rider (a bow wave,
//      each glyph's footprint kept clear), streams away and is left with the
//      lanes the horses cut. The camera follows the charge: a gentle push-in
//      pivoting on the litter (held at (540, 745)), eased in from the
//      pull-back's end (k 4.33 at f136) to k 4.96 on f177 (+13.5 % from f132,
//      +14.5 % from f136), still gathering speed on the last frame.
//   7. Tail f162-f177: still charging (the groups' noses ~10 m from the litter
//      on f177), the smoke still drifting, the crowd still breaking; no stop.
// The foot stay at the doors, gates and platform (Pizarro's own rush to the
// litter is a later cut). Nothing else.
//
// COUNTS AND SOURCES (SP/FACTS.md; never on screen).
//   6,000 in the square, 1 dot = 1 man: "about five or six thousand Indians
//     without arms" (Hernando Pizarro, letter of Nov 1533, Markham 1872
//     p.117); the same 5,000-6,000 in Prescott (III.5), Hemming (1993
//     pp.40-41) and Guilmartin ("reasonably estimated", n.20).
//   80 of them the litter's bearers: "borne by eighty chiefs" (Relacion, in
//     Markham p.53n; Prescott III.5 n.15).
//   168 Spaniards = 62 horse + 106 foot (asserted): Hemming; Lockhart, The Men
//     of Cajamarca (Xerez's muster of 177 less the 9 who went back).
//   The horse in three groups, one per hall, under Hernando Pizarro, Soto and
//     Benalcazar (Mena p.240; Trujillo p.53, the three galpones; Zarate's
//     "three squadrons of 20" via Markham p.51n): 21 / 20 / 21.
//   Pizarro + 24 foot on the platform: Trujillo, "en la fortaleza con 24
//     hombres" (p.53) (Pedro Pizarro has him in a hall; the world's plaza
//     data has one platform, so Trujillo).
//   Candia + 8 arquebusiers with the guns on the platform: Mena "8-9
//     escopeteros" (p.240); Candia in the fortress with the pieces (Pedro
//     Pizarro p.178).
//   The other 72 foot at the two gates: Mena ("the rest guarded the gates",
//     p.240); Xerez ("others were posted in the streets", p.51).
//   Two guns fired, drawn as falconets: Markham (p.47n) and Prescott (III.5),
//     two falconets; Mena: four small pieces, only two fired (pp.240, 242).
//   The order: sign, guns, cavalry out of the halls, then Pizarro to the
//     litter (Pedro Pizarro pp.183-184; Mena p.244). The plaza is the world's
//     schematic (incaShared PLAZA; FACTS section 3).
//
// CAMERA (four long C1 glides, cosine-tapered velocity bumps, the house sway on
// top; camScan over a probe grid above the caption band and fixed points):
// grid max 24.4 px/f (f105, the pull-back), max |dv| 2.26 px/f^2 (f96, the
// pull-back's first frames); the litter max 19.2 px/f, the platform 9.0 px/f;
// the push-in f128-f177 at most 9.6 px/f on the grid. Fastest elements on
// screen: the orange foot 31.2 px/f (f105, the pull-back), the waiting
// horsemen 27.3 (the same pan), smoke 26.6, the crowd 26.5, the charging
// horsemen 8.8 px/f: all under the ~45 px/f close-framing cap. Content in the
// caption-safe band (y ~190..1150) at every framing; in the push-in's last
// frames only the SW gate's foot (not in play) dips below y 1150 (the riders
// y 588..909 and the litter y 745 on f177).
// ---------------------------------------------------------------------------

export const schema = z.object({
  vignette: z.number(),
  crowdOpacity: z.number(), // the crowd's rung (cream, in play)
  hiddenRung: z.number(), // the Spaniards' rung while hidden
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({
  vignette: 0.55,
  crowdOpacity: INK_FULL * 0.92,
  hiddenRung: HIDDEN_RUNG,
});

/** the litter (incaGlyphs, with its bearers): 100 glyph units = 13 m; its
 *  anchor is the ground under its middle, so it stands 45 units below the
 *  litter's point to centre the glyph on it */
const LITTER_100_M = 13;
const LITTER_DY_M = (45.2 / LITTER_UNITS) * LITTER_100_M;
const FLASH_M = 4.8; // a falconet's longest ray (m)
const ARQ_FLASH_M = 2.7; // an arquebus's longest ray (m)

const LetsOffTheAmbush: React.FC<Props> = ({ vignette, crowdOpacity, hiddenRung }) => {
  const frame = useCurrentFrame();
  const fi = Math.min(LAST, Math.max(0, Math.round(frame)));
  const cam: Cam = swayCam(CAM_TRACK[fi], frame);
  const k = cam.k;
  const crowd = crowdAt(fi);

  // the 106 foot as dots: hidden (the 0.3 rung) until the wave, then standing
  const men = SPANIARDS.filter((s) => s.role !== "horse").map((s) => {
    const [x, y] = manAt(s, fi);
    return { x, y, t: 1, op: hiddenRung + (1 - hiddenRung) * riseOf(s, fi) };
  });
  // the 62 horse as glyphs: waiting in their halls (hidden, then revealed),
  // then charging; painted top to bottom so the nearer rider overlaps
  const horse = RIDERS.map((r) => ({ r, g: riderGlyph(r, fi) })).sort((a, b) => a.g.y - b.g.y);

  // the falconets rise with the platform's men (Candia is the first of the wave)
  const candia = SPANIARDS.find((s) => s.role === "candia")!;
  const gunOp = hiddenRung + (1 - hiddenRung) * riseOf(candia, fi);

  return (
    <PlanPage cam={cam} vignette={vignette}>
      {/* the crowd: 6,000 men, the bearers among them */}
      <CanvasDots cam={cam} layers={[{ xy: crowd, r: crowdR(k) * k, color: INK, opacity: crowdOpacity, casing: 0.9 }]} />
      <WorldSvg cam={cam}>
        <SmokeDefs />
        <PlazaPlan cam={cam} />

        {/* Atahualpa's litter, carried high by its bearers */}
        <Litter x={LITTER[0]} y={LITTER[1] + LITTER_DY_M} cam={cam} size={LITTER_100_M * k} />

        {/* Pizarro's side: the men, the guns */}
        <CrowdDots dots={men} cam={cam} radius={manR(k)} casing={1.3} />
        {GUNS.map((g, i) => (
          <Falconet key={`g${i}`} x={g.p[0]} y={g.p[1]} cam={cam} size={GUN_LEN_M * k} heading={g.heading} tilt={1} maxTilt={30} recoil={gunRecoil(g.shot, fi)} opacity={gunOp} />
        ))}

        {/* the horsemen: saddled and waiting in their halls, then the charge */}
        {horse.map(({ r, g }) => (
          <Horseman
            key={`r${r.id}`}
            x={g.x}
            y={g.y}
            cam={cam}
            size={g.size * k}
            heading={g.heading}
            pose={g.pose}
            stand={g.stand}
            pitch={g.pitch}
            tilt={HORSE_TILT.gain}
            maxTilt={HORSE_TILT.max}
            opacity={hiddenRung + (1 - hiddenRung) * g.rise}
          />
        ))}

        {/* the smoke, rolling out over the square */}
        {PUFFS.map((q, i) => {
          const s = puffAt(q, fi);
          if (!s) return null;
          return <SmokePuff key={`p${i}`} x={s.p[0]} y={s.p[1]} cam={cam} r={s.r} opacity={s.op} seed={q.seed} roll={s.roll} />;
        })}

        {/* the fire: two falconets, then the arquebusiers' ripple */}
        {GUNS.map((g, i) => {
          const m = falconetMuzzle(g.p[0], g.p[1], cam, GUN_LEN_M * k, g.heading, 1, 30, gunRecoil(g.shot, fi));
          return <MuzzleFlash key={`f${i}`} x={m.x} y={m.y} cam={cam} dir={m.dir} age={fi - g.shot} size={FLASH_M * k} seed={i + 1} rays={7} />;
        })}
        {ARQ_SHOTS.map((s, i) => {
          const d = s.dir;
          return (
            <MuzzleFlash key={`a${i}`} x={s.p[0] + d[0] * 0.6} y={s.p[1] + d[1] * 0.6} cam={cam} dir={d} age={(fi - s.f) * 1.25} size={ARQ_FLASH_M * k} seed={20 + i} rays={5} casing={2.2} />
          );
        })}
      </WorldSvg>
    </PlanPage>
  );
};

export default LetsOffTheAmbush;
