import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  BRATTAHLID,
  INK,
  INK_CONTEXT,
  INK_FULL,
  Longhouse,
  MapLabel,
  MapStack,
  NorseRoute,
  PaperTop,
  PeopleDots,
  ROUTE_VINLAND,
  SEA,
  SettlementMark,
  WorldSvg,
  clamp01,
  mixColor,
  smootherstep,
  smoothstep,
  swayCam,
  type P2,
  type PersonDot,
} from "./vikAtlanticShared";
import {
  DOT_R,
  DURATION,
  F_LAND,
  HALL_AT,
  HALL_SIZE,
  N_CROWD,
  N_NORSE,
  cameraAt,
  crowdAt,
  hallWash,
  headProgress,
  norseAt,
  retractAt,
} from "./triedToColonizeMotion";

// ---------------------------------------------------------------------------
// TriedToColonize: cut D of "Sheppard_Vikings" (Dwarkesh with Si Sheppard),
// 36_TriedToColonize.mov. Dwarkesh map style on the North Atlantic world
// (vikAtlanticShared). Opaque, 1080x1920, 24 fps.
//
// THE LINE: "(... back to Leif Erikson and the Norse in Greenland,) they knew of
// the existence of North America and they tried to colonize the new world.
// Their numbers were too few, the local resistance was too fierce and they were
// forced out."
// In 36.245 s, out 44.419 s of the sequence (23.976 fps: seq f869 .. f1065) =
// 196 frames + 2 tail frames holding the last state: DURATION 198.
//
// THE MECHANISM: an orange line sails from Greenland to the far shore and
// plants a foothold; a handful of orange people there are pressed by a much
// larger cream crowd from the land; the orange flows back out the way it came.
// ORANGE = WHAT IS PASSED ON: here the Norse foothold, the would-be carrier.
// The locals, the land and the labels are cream.
//
// THE GESTURES (local frames; word onsets from cut_frames.md). Nothing else moves.
//   f0     opening state: south Greenland upper right of centre, the Eastern
//          Settlement alight (orange dot in a thin ring), GREENLAND settled on
//          the land ("Greenland," ended 2 f before the cut). No North America
//          in frame. The camera is already under way.
//   f3-58  "they knew (5) of the existence (21) of North America (32-35)": the
//          orange line leaves the settlement down the fjord, runs north-west up
//          Greenland's coast, west over Davis Strait, south past Baffin and
//          down the Labrador coast. ONE camera move follows it south-west; the
//          continent slides in as the head reaches it. NORTH AMERICA slides up
//          on the Labrador / Quebec land from f24 and has landed by f35.
//   f58    the head lands at L'Anse aux Meadows; the same move dives on into
//          the close-up on the tip of Newfoundland (lands f88).
//   f58-74 "tried (54) to colonize (66)": the turf longhouse draws on in
//          orange, just in from the landing (156 px wide at rest).
//   f75-107 "Their numbers (96) were too few (109)": nine orange people come
//          down the line, step ashore and settle in a compact group beside the
//          hall, one after another, each on its own eased road.
//   f107-158 "the local resistance (125) was too fierce (144)": 140 cream
//          people come up the peninsula from the inland south-west as one
//          packed body, fill its neck and close round the group's west and
//          south; the front reaches the nine on "fierce" (f144-150). The camera
//          eases back (f116-148) just enough to hold the whole body.
//   f158-194 "and they were forced (181) out (187)": the nine stream back to
//          the shore and away along the line as one compact body; the line's
//          end follows the last of them out to sea, leaving a faint cream
//          dashed trace; the crowd washes over the hall, which drains from
//          orange to a cream ghost as the dots reach it. The camera drifts
//          north-east a little with the leaving orange.
//   f194-198 hold: creep only.
// Hold detail (the spec's "live bead"): none needed - something of the list
// above is in motion on every frame (checked with a frame-to-frame scan).
//
// SOURCES (CLIP_SPEC.md "Verified facts"): Eastern Settlement, Brattahlid
// 61.15 N 45.52 W (founded c. 985; Leif Erikson's voyage c. 1000). L'Anse aux
// Meadows 51.596 N 55.533 W, the only confirmed Norse site in North America:
// eight turf buildings incl. three halls; occupied AD 1021 (Kuitems et al.,
// Nature 2022); room for roughly 70-90 people (Parks Canada); abandoned within
// about a decade. The saga route (Graenlendinga saga, Eiriks saga rauda):
// Greenland -> Davis Strait -> Helluland (Baffin) -> Markland (Labrador) ->
// Vinland, drawn as a sea line off the real coasts, unlabelled. The sagas give
// the attempt 60-160 settlers and attacks by the "Skraelings": FEW vs MANY is
// 9 dots against 140, no number shown. Map: Natural Earth 10m (public domain),
// no borders.
// ---------------------------------------------------------------------------
export { DURATION };
export const FPS = 24;

export const schema = z.object({
  vignette: z.number().min(0).max(1),
  labelGreenland: z.string(),
  labelAmerica: z.tuple([z.string(), z.string()]),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ vignette: 0.55, labelGreenland: "GREENLAND", labelAmerica: ["NORTH", "AMERICA"] });

// label anchors (world px)
const GREENLAND_AT: P2 = [BRATTAHLID[0] - 2, BRATTAHLID[1] - 96];
const AMERICA_AT: P2 = [204, 800]; // Labrador / Quebec, inland of the coast the line runs down
const LINE_W = 5.4; // screen px, the orange line at every zoom
const F_AMERICA = 24; // slides up from here, landed by f35 ("North" 32, "America" 35)

const TriedToColonize: React.FC<Props> = ({ vignette, labelGreenland, labelAmerica }) => {
  const frame = useCurrentFrame();
  const cam = swayCam(cameraAt(frame), frame);
  const k = cam.k;

  // the line
  const progress = headProgress(frame);
  const retract = retractAt(frame);
  const nib = 1 - smoothstep((frame - F_LAND) / 6);

  // the hall: grows with the dive, 210 px wide from k 9.4 on (a symbol, not to scale); drains as the crowd washes over it
  const hallSize = HALL_SIZE * Math.min(1, Math.pow(k / 9.4, 0.75));
  const hallDraw = smootherstep((frame - F_LAND) / 16);
  const wash = hallWash(frame);

  // the people. The nine pass BEHIND the hall on their way in and out: a dot inside the hall's
  // outline is drawn under it; everywhere else orange is on top of everything.
  const crowd: PersonDot[] = [];
  for (let i = 0; i < N_CROWD; i++) {
    const p = crowdAt(i, frame);
    if (p.op > 0.002) crowd.push({ x: p.x, y: p.y, t: 0, op: INK_FULL * p.op });
  }
  const norseUnder: PersonDot[] = [];
  const norseOver: PersonDot[] = [];
  for (let i = 0; i < N_NORSE; i++) {
    const p = norseAt(i, frame);
    if (p.op <= 0.002) continue;
    const gx = ((p.x - HALL_AT[0]) * k) / (hallSize / 100);
    const gy = ((p.y - HALL_AT[1]) * k) / (hallSize / 100);
    const behind = hallDraw > 0.5 && Math.abs(gx) < 53 && gy > -34 && gy < 4;
    (behind ? norseUnder : norseOver).push({ x: p.x, y: p.y, t: 1, op: p.op });
  }

  return (
    <AbsoluteFill style={{ backgroundColor: SEA }}>
      <MapStack cam={cam} />
      <WorldSvg cam={cam}>
        {/* the trace the retreating line leaves: faint cream dashes from its end to the shore */}
        {retract > 0.00001 ? <NorseRoute cam={cam} from={1 - retract} color={INK} dashed opacity={INK_CONTEXT} width={3.4} /> : null}
        {/* the orange sea line, Greenland -> the far shore */}
        <NorseRoute cam={cam} progress={progress} retract={retract} width={LINE_W} />
        {nib > 0.002 && progress > 0.0005 ? (
          <NorseRoute cam={cam} progress={progress} from={Math.max(0, progress - 0.5 / ROUTE_VINLAND.len)} head opacity={nib} width={LINE_W} />
        ) : null}
        <SettlementMark x={BRATTAHLID[0]} y={BRATTAHLID[1]} cam={cam} r={8.5} ring={20} />
        <PeopleDots dots={norseUnder} cam={cam} r={DOT_R} />
        <Longhouse
          x={HALL_AT[0]}
          y={HALL_AT[1]}
          cam={cam}
          size={hallSize}
          draw={hallDraw}
          ink={wash <= 0.001 ? ACCENT : mixColor(ACCENT, INK, wash)}
          opacity={1 - (1 - 0.42) * clamp01(wash)}
        />
        <PeopleDots dots={crowd} cam={cam} r={DOT_R} />
        <PeopleDots dots={norseOver} cam={cam} r={DOT_R} />
      </WorldSvg>
      <MapLabel text={labelGreenland} x={GREENLAND_AT[0]} y={GREENLAND_AT[1]} cam={cam} frame={frame} f0={-40} size={42} />
      <MapLabel text={labelAmerica[0]} x={AMERICA_AT[0]} y={AMERICA_AT[1]} cam={cam} frame={frame} f0={F_AMERICA} size={42} dy={-28} />
      <MapLabel text={labelAmerica[1]} x={AMERICA_AT[0]} y={AMERICA_AT[1]} cam={cam} frame={frame} f0={F_AMERICA + 1} size={42} dy={28} />
      <PaperTop vignette={vignette} />
    </AbsoluteFill>
  );
};

export default TriedToColonize;
