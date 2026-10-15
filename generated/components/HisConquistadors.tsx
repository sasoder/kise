import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { CanvasDots, CrowdDots, INK, NumeralLabel, PlanPage, PlazaPlan, ROAD_TO_CAMP, RouteLine, WorldSvg, hash, swayCam, type DotLayer } from "./incaShared";
import { Horseman } from "./incaGlyphs";
import { HALLS, HORSE_TILT, HORSE_WAIT_M, SPANIARDS } from "./ambushMotion";
import { DEAD_OP, DEAD_R_SCALE, deadLook } from "./hundredShared";
import { LOOK, NUMERAL, armyFrame, bucketQ, op168, plazaFrame, type DotSplit } from "./hundredMotion";
import { A_OFFSET, CAM_TRACK, DURATION, FPS, HIDDEN_RUNG, LABEL_F0, LAST, ORANGE_ORDER, dotShare, musterRise, orangeAt } from "./hisMotion";

export { DURATION, FPS };

// ---------------------------------------------------------------------------
// HisConquistadors. Dwarkesh Patel with Si Sheppard, clip
// "Sheppard_Cajamarca_infinite_KD" (Pizarro at Cajamarca, 16 Nov 1532), on the
// shared Peru world, read-only (incaShared.tsx: the Cajamarca local plan, the
// camera runners, CanvasDots, NumeralLabel; incaGlyphs.tsx: the horseman;
// ambushMotion.ts: the 168 SPANIARDS with their hidden / stand posts, the
// plaza's halls, gates and platform; hundredMotion.ts: cut A, which this cut
// plays straight into). Everything new is in hisMotion.ts.
// The line: "he has some 160, 190 conquistadors".
//
// TIMELINE. In-point 3.74 s on the edit timeline (the SRT; word onsets from
// the word-level re-transcription SP/words_whisper.txt); f = round((t - 3.74)
// x 24): he f0 · has f2 · some f7 · 160 f12 (ends 4.84 s = f26) · 190 f36
// (ends 6.04 s) · CONQUISTADORS f55 (ends 6.92 s = f76) · "So," f83 · cut A's
// in-point 7.54 s = f91.
// DURATION = round((7.54 - 3.74) x 24) = round(91.2) = 91 frames (f0..f90).
// No house tail: this cut ends where cut A (HundredAgainstHundredThousand)
// begins; this cut's frame 91 would be A's frame 0.
//
// THE JOIN (one continuous shot into A). This cut's frame f is A's frame
// f - 91 (A_OFFSET). From F_JOIN (f72) the camera IS A's pre-roll, camAt(f -
// 91) (hundredMotion; valid from F_PRE), with the house sway on A's timeline
// (sway(f - 91)); before f72 it is that pre-roll plus an offset in ln k and in
// the platform's screen point that eases to zero (one cosine-tapered ramp,
// f-10..f72), so position and velocity both run into A's with no kink. Every
// layer is drawn from A's own exports with A's looks: the causeway
// (LOOK.road*), the plain's 80,000 (armyFrame; off frame at these zooms), the
// square's 6,000 (plazaFrame: A's positions and sway, the same dots in the
// same order), the plaza plan, the 168 as cased orange dots in A's order at
// A's posts with A's idle sway (footAt / riderAt, LOOK.orange*), and "168"
// (NUMERAL's anchor, size law, slide and rung op168). By f72 the only
// differences left are the ones that have converged: every man at full orange
// on his post (by ~f58), every horseman glyph a dot (by F_GLYPHS_GONE); so
// f90 is A's frame -1 and the cut hands over on one frame of A's creep.
//
// DWARKESH MAP STYLE on the Cajamarca local plan: the umber page (PlanPage),
// the 1532 plaza as an engraved cream plan (PlazaPlan), the causeway at the
// context rung. Opaque 1080x1920, 24 fps. 1 dot = 1 man.
// COLOUR RULE: orange (#FFB000 / #D98A0C) = PIZARRO'S SIDE only: his 168.
// Everything Inca is cream. Element types: the plan, the cream crowd, the
// orange men (horsemen glyphs, foot dots) and the numeral. Nothing else: no
// arrows, rings, glows, flashes, tallies, counters or ticking numbers; no
// "160" or "190" on screen.
//
// THE GESTURES, each with its word (one continuous motion):
//   1. "he has" f0-f6. Open close (k 4.2) on the platform corner: Pizarro's
//      own 25 on the platform already at full orange ("he" is Pizarro); under
//      the dark roofs of the halls the 62 horsemen wait two deep behind the
//      middle doorways, standing horse-and-rider glyphs (5.2 m, 22 px) at the
//      hidden rung (0.3); Candia's 9 at the parapet and the 72 in the streets
//      outside the two gates, dim dots at the same rung; the 6,000 packed in
//      the square in front, alive (A's sway: each man's lean toward the
//      litter and his drift). The camera is already moving (the pull-back's
//      ramp starts on f-10).
//   2. "some 160, 190 conquistadors" f7-f58. THE MUSTER WAVE: each man is
//      ticked off as the wave reaches him. It leaves Pizarro's group on
//      "some" (f7) and runs both ways round the ring of the trap
//      (ambushMotion's path: Candia's gunners beside him first, then the NE
//      and SE hall fronts, then the gates in the NW and SW corners, then the
//      west hall from both ends to its middle). Each man's moment is
//      f7 + 43 f x (half his distance round the ring + half his place in his
//      side's count), so the wave is steady, covering ground AND counting men
//      at an even pace (it neither sprints across the empty stretches nor
//      lights a gate's 36 in one burst: they tick on over ~12 f, from the
//      opening out into the street); + a hashed +-2 f each, so no rank lights
//      as a line. As it reaches him, each man rises from the hidden rung to
//      full orange over 6 f and steps to his stand post (ambushMotion's
//      hidden -> stand: the horsemen 0.8 m toward their doorways, the gate
//      foot 3.4 m in from the street, the gunners up to the parapet). The NE
//      / SE horsemen f11-f27, the gates f30-f43, the west hall f43-f52; the
//      last man full orange on f58. The camera follows with one long eased
//      pull-back pivoting on Pizarro's platform (k 4.2 -> A's opening k),
//      the far side of the ring swinging in as the wave runs out to it; the
//      wave head is in frame throughout. As the zoom shrinks them, each
//      horseman glyph crossfades into A's cased dot (hisMotion's GLYPH_PX
//      window, a hashed +-2 f each), done before f78.
//   3. "conquistadors" f55-f76. "168" lands as the count completes: A's
//      numeral (IM Fell English roman, cream, NUMERAL's anchor under the
//      plaza's box, its size law and its rung) with the house slide-up from
//      f50 (24 px, fading in over 8 f, landing f62).
//   4. f72-f90, into the join: the camera is A's pre-roll (its opening creep
//      and the house sway); the crowd keeps swaying, the 168 keep their idle
//      shift; nothing freezes on the last frame.
//
// COUNTS AND SOURCES (SP/FACTS.md; never on screen except "168").
//   168 = 62 horse + 106 foot, the modern standard (Hemming, The Conquest of
//     the Incas 1993 p.29; Lockhart, The Men of Cajamarca 1972: Xerez's muster
//     of 177 in the Piura valley less the 9 who went back, = the 168 who
//     shared Atahualpa's ransom). The speaker's "160, 190": Trujillo's "por
//     todos eramos 160" (p.53) and Atahualpa's spy's ~190 (Pedro Pizarro
//     p.172; "about two hundred", p.187).
//   Their posts (LetsOffTheAmbush / ambushMotion): the horse in three groups,
//     one per hall, 21 / 20 / 21 (Mena p.240; Trujillo p.53; Zarate via
//     Markham p.51n); Pizarro + 24 on the platform (Trujillo, "en la
//     fortaleza con 24 hombres", p.53); Candia + 8 arquebusiers at its
//     parapet (Mena p.240); the other 72 foot at the two gates (Mena p.240;
//     Xerez p.51).
//   The 6,000 in the square: "about five or six thousand Indians without
//     arms" (Hernando Pizarro, Markham 1872 p.117). The plaza is the world's
//     schematic (incaShared PLAZA; FACTS section 3).
//
// CAMERA (hisMotion; camScan over the probe grid above the caption band and
// fixed points): see the build report for the numbers.
// ---------------------------------------------------------------------------

export const schema = z.object({
  vignette: z.number(),
  hiddenRung: z.number(), // the 168's rung before the wave reaches them
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({
  vignette: 0.55,
  hiddenRung: HIDDEN_RUNG,
});

/** a DotSplit as CanvasDots layers (A's: the dead first, then the dying, then the living) */
const layersOf = (sp: DotSplit, r: number, op: number, casing: number): DotLayer[] => [
  { xy: sp.dead, r: r * DEAD_R_SCALE, color: INK, opacity: DEAD_OP },
  ...sp.dying.map((xy, b) => {
    const l = deadLook(bucketQ(b), r, op, casing);
    return { xy, r: l.r, color: INK, opacity: l.op, casing: l.casing > 0.05 ? l.casing : undefined };
  }),
  ...sp.living.map((xy) => ({ xy, r, color: INK, opacity: op, casing: casing > 0 ? casing : undefined })),
];

const HisConquistadors: React.FC<Props> = ({ vignette, hiddenRung }) => {
  const frame = useCurrentFrame();
  const fi = Math.min(LAST, Math.max(0, Math.round(frame)));
  const fa = fi - A_OFFSET; // cut A's timeline
  const cam = swayCam(CAM_TRACK[fi], frame - A_OFFSET);
  const k = cam.k;

  // the plain (off frame at these zooms) and the square: A's dots and looks
  const army = armyFrame(fa, k);
  const plaza = plazaFrame(fa);
  const layers = [
    ...layersOf(army, LOOK.armyR(k), LOOK.armyAlpha(k, LOOK.armyMax), 0),
    ...layersOf(plaza, LOOK.crowdR(k), LOOK.crowdOpacity, LOOK.crowdCasing),
  ];

  // the 168: A's dots in A's order, each at his rung; the horse as glyphs while they read
  const rung = (id: number) => hiddenRung + (1 - hiddenRung) * musterRise(id, fi);
  const pts = ORANGE_ORDER.map((o) => ({ o, p: orangeAt(o, fi) }));
  const orange = pts.map(({ o, p }) => ({ x: p[0], y: p[1], t: 1, op: rung(o.id) * (o.rider >= 0 ? dotShare(o.id, fi) : 1) }));
  const glyphs = pts
    .filter(({ o }) => o.rider >= 0)
    .map(({ o, p }) => {
      const man = SPANIARDS[o.id];
      const n = HALLS[man.hall].doorways[man.door].n;
      // LetsOffTheAmbush's slow shift of weight, on the same phases
      const idle = 1.3 * Math.sin(fi * (0.045 + 0.025 * hash(o.id, 91)) + 6.28 * hash(o.id, 92));
      return { id: o.id, x: p[0], y: p[1], heading: Math.atan2(n[1], n[0]), pitch: idle, op: rung(o.id) * (1 - dotShare(o.id, fi)) };
    })
    .filter((g) => g.op > 0.002)
    .sort((a, b) => a.y - b.y);

  const nSize = NUMERAL.size(k);
  const [ax, ay] = NUMERAL.anchor;

  return (
    <PlanPage cam={cam} vignette={vignette}>
      <WorldSvg cam={cam}>
        <RouteLine route={ROAD_TO_CAMP} cam={cam} width={LOOK.roadWidth} casing={LOOK.roadCasing} opacity={LOOK.roadOpacity} />
      </WorldSvg>
      <CanvasDots cam={cam} layers={layers} />
      <WorldSvg cam={cam}>
        <PlazaPlan cam={cam} />
        {/* the horsemen, waiting in their halls (standing pose, facing their doorways) */}
        {glyphs.map((g) => (
          <Horseman
            key={`h${g.id}`}
            x={g.x}
            y={g.y}
            cam={cam}
            size={HORSE_WAIT_M * k}
            heading={g.heading}
            stand
            pitch={g.pitch}
            tilt={HORSE_TILT.gain}
            maxTilt={HORSE_TILT.max}
            opacity={g.op}
          />
        ))}
        {/* the 168 as A draws them: cased orange dots */}
        <CrowdDots dots={orange} cam={cam} radius={LOOK.orangeR(k) / k} casing={LOOK.orangeCasing} />
      </WorldSvg>
      <NumeralLabel
        text="168"
        x={ax}
        y={ay}
        cam={cam}
        frame={fi}
        f0={LABEL_F0}
        size={nSize}
        dy={NUMERAL.dy(k)}
        frames={NUMERAL.frames}
        fade={NUMERAL.fade}
        opacity={op168(fa)}
      />
    </PlanPage>
  );
};

export default HisConquistadors;
