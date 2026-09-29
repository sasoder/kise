import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { ACCENT, DARK, FrontHatch, KoreaPage, Parallel38, WorldSvg, dotScreen } from "./koreaShared";
import { DURATION, FPS, camAt, frontAtFrame, unDotsAt } from "./reuniteMotion";

export { DURATION, FPS };

// ---------------------------------------------------------------------------
// ReuniteTheWholeThing: Sarah Paine, "Both sides overreached in Korea", cut 4
// (delivered as 37_ReuniteTheWholeThing.mov). Dwarkesh map style, on the shared
// 1950 Korea world (koreaShared.tsx, read-only). After Inchon, MacArthur:
//   "So his idea is, hey, we're going to reunite the whole thing, right?
//    Because it's militarily possible."
// IN 37.420 s = f0. Speech 4.379 s: DURATION = round(4.379 x 24) + 16 = 105 + 16
// = 121 frames, 24 fps, 1080x1920, opaque.
// Word onsets (frames): so his 0 · idea 10 · is hey 17 · we're 30 · going 34 ·
//   to 36 · reunite 38 · the 49 · whole 53 · thing 58 · right? 67 · because 72 ·
//   it's 76 · militarily 80 · possible 92.
//
// ORANGE = MacArthur's UN front, the overreach going north: the same orange
// the North used rolling south in cut 1. The UN holds everything SOUTH of its
// front (orange hatch south of the line, dashed orange edge over land); the
// North is plain land. No labels (no place is named in this line).
//
// THE GESTURES, each with its word:
//   1. "so his idea is, hey" f0-30: the 30 Sep front (~the 38th), the camera
//      on the middle of the peninsula (k 2.09 -> 2.16, a slow creep in), the
//      38th on y ~845. The whole South is orange hatch; the orange army (141
//      dots) stands as one even band on the line; the dashed 38th is bright.
//   2. "we're going to reunite" f28-46: the front leaves the 30 Sep line just
//      before "we're" and crosses the 38th; <Parallel38 swallowedBy> erases
//      the dashed line wherever the hatch has passed over it, from the
//      crossing east of the middle outward to the Ongjin tip: 17 % gone f32,
//      49 % on "reunite" f38, 90 % f44, gone f46. One sweep, geometry-driven.
//   3. "the whole thing" f46-74: the front rolls north, every point ONLY
//      north (a per-point latitude morph on one longitude grid): 30 Sep ->
//      19 Oct (Pyongyang) on "thing" f58 -> toward FARTHEST_ADVANCE (the UN's
//      composite high-water line): u 0.45 f66, 0.72 f74. The Chosan and
//      Hyesan thrusts grow toward the Yalu. The camera travels north with it
//      (f34-86, peak 23.4 screen px/f) and pulls back a little (k 2.16 ->
//      1.81 by f62) so the whole north is in shot.
//   4. "because it's militarily possible" f74-120: the front decelerates and
//      keeps inching toward the river (u 0.84 f84, 0.895 f98, END_U 0.92 on
//      f120, still moving at du/df 0.00115); the Chosan and Hyesan spikes stop
//      just short of the Yalu. The camera lands ~f86 (6 f before
//      "possible"), then creeps (k 1.90 -> 1.93) and is still moving on the
//      last frame, which is EXACTLY NORTH_FRAME (the whole north-west incl. the
//      Sinuiju corner and the Yalu mouth is in shot) with unFrontAt(END_U).
//      Nearly the whole peninsula is orange.
//   Always moving: the army's breath (~1.1 px per dot, never in unison), the
//   camera (no plateau), the front from f20 to past the end.
//
// THE FRONT'S TARGET: FARTHEST_ADVANCE (reuniteMotion.ts), the UN's composite
// high-water line, Oct-Nov 1950: ~30 km short of Sinuiju (US 21st Inf at
// Chonggo-dong) past Chongju / Sonchon; the Yalu at Chosan (ROK 6th Div,
// 26 Oct); round the Chosin reservoir (1st Marine Div at Yudam-ni); the Yalu
// at Hyesan (US 17th Inf, 21 Nov); the NE coast past Chongjin (ROK Capital
// Div). The farthest point reached on each stretch, not one day's front.
// Traced from the "farthest advance" maps of Appleman (South to the Naktong,
// North to the Yalu) and Mossman (Ebb and Flow, map 1) and the West Point
// Atlas vol. II; approximate to ~0.1 deg.
//
// THE ARMY: UN Command ground forces in Korea, 423,313 on 23 Nov 1950 (ROK
// 223,950, US 178,464, others ~20,900; Mossman, "Ebb and Flow", ch. 2, via
// korea1950Fronts UN_GROUND_LATE_NOV_1950) / MEN_PER_DOT 3,000 = 141 dots, as
// ONE even blue-noise band of constant depth hugging the front (5 world px
// behind it), spacing 1.3 dot diameters. The depth is solved per frame from
// the LAND area behind the line so the 141 fit at that spacing: ~41 world px
// on the 30 Sep line, ~21 (2-3 rows) along the long northern line. The dots
// are simulated once (carried with the front, relaxed for spacing, the band's
// edges and land), then smoothed in time (reuniteMotion.ts, unDotsAt).
//
// SOURCES: fronts and figures in korea1950Fronts.ts and reuniteMotion.ts,
//   ~0.1 deg, hand-traced: Appleman, "South to the Naktong, North to the Yalu",
//   US Army CMH 1961 (30 Sep, Pyongyang 19 Oct, Chosan 26 Oct, the farthest
//   advance); Mossman, "Ebb and Flow, November 1950-July 1951", US Army CMH
//   1990 (map 1, the late-Nov line; UN strength); West Point Atlas vol. II
//   Korea maps; Wikipedia "UN offensive into North Korea" (423,000 UN troops).
//
// CHECKS (scratchpad check scripts): camera max 23.4 screen px/f (f54),
// |dv| 1.79 px/f^2 (f43); front points never move south; every dot <= ~19
// screen px/f; spacing median 1.25-1.34 d, p90 <= 1.45 d; no dot ahead of the
// line; lowest army ink y 1020, lowest front edge on land y 997; nothing
// important below y1150.
// ---------------------------------------------------------------------------

export const schema = z.object({
  vignette: z.number(),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ vignette: 0.55 });

const ReuniteTheWholeThing: React.FC<Props> = ({ vignette }) => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const front = frontAtFrame(frame);
  const dots = unDotsAt(frame, cam.k);
  const r = dotScreen(cam.k) / 2 / cam.k;
  return (
    <KoreaPage cam={cam} vignette={vignette}>
      <WorldSvg cam={cam}>
        <FrontHatch front={front} side="south" cam={cam} id="un" />
        <Parallel38 cam={cam} swallowedBy={front} side="south" bright={1} />
        <g>
          {dots.map((d) => (
            <circle key={d.id} cx={d.x} cy={d.y} r={r} fill={ACCENT} stroke={DARK} strokeOpacity={0.6} strokeWidth={1.6 / cam.k} />
          ))}
        </g>
      </WorldSvg>
    </KoreaPage>
  );
};

export default ReuniteTheWholeThing;
