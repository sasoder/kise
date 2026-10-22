// ---------------------------------------------------------------------------
// DoTheOpposite (scott-aircraft-order, cut 14). Cheeky Pint "at sea" look carried into the air (aircraftShared: the
// yard at golden hour). Opaque 1080x1920, 23.976 fps, 116 frames. RENDER WITH --gl=angle.
//
// CHECK LINE: with the sound off, a viewer says "while everyone else parked their jets, United went the other way
// and ordered an enormous line of brand-new ones."
//
// THE LINE: "And it's just a huge opportunity to do the opposite, do the biggest aircraft order in history, which we
// did."
// WORD -> FRAME: And f-2 · it's f4 · just f9 · a f13 · huge f18 · opportunity f28-44 · to f44 · do f51 · the f54 ·
// opposite f57-65 · do f68 · the f71 · biggest f73 · aircraft f80 · order f89 · in f96 · history f99-104 · which
// f106 · we f108 · did f110-114 (notes/word_frames.txt, S2).
// DURATION: the slot 14.640 -> 19.478 s = 4.838 s x 23.976 = 116 frames (f0..f115).
//
// THE MOTION: one camera on the world's damped follower. It opens on cut 1's last look (its end camera, a little
// wider: the drained, covered row receding up the frame, United's amber-finned 787-10 lit in front), then cranes up
// and swings left around United (f0-26) until the final-assembly hangar fills the middle across the apron (~600 px),
// United below it, the stored row's pale tails at the right edge. "Opportunity" (f26-44): the hangar's doors telescope
// open and its bays' warm light spills down the apron, showing a column of new United 787-9s queued nose to tail
// inside; the camera glides in over United toward the door (f28-62). Cause before effect: the column starts rolling at
// f34 (10-frame ease from rest), the lead's nose clears the door frame at ~f44, its wings reach the door plane at
// ~f51 with the doors fully open since f44; then ONE constant speed (5 m a frame, a brisk time-lapse taxi), even 68 m
// spacing, along the lane toward the camera, the opposite way to the stored row. Queued jets join deep in the bay, out of
// sight through the door. "Do the opposite" (f57-65): the lead rolls at us and grows to ~250-330 px span
// (f63-80). "The biggest aircraft order in history" (f64-116): the camera rises (85 -> 260 m) and pulls back to the V
// while the jets keep coming out: the line from the hangar's door to the lower left, United at the apex, the stored
// row receding to the right; the lead holds ~300 px and leaves the frame at the left (f88-100) instead of shrinking.
// "Which we did": the settled V, the camera still creeping, the line still rolling.
// THE HANGAR (cut-local): cut 1 never shows it, so this cut mounts the world's <Hangar> 250 m up a lane from APEX (just
// left of United's nose) instead of the world's ~1 km: the jets taxi at a plausible time-lapse speed and still reach
// the foreground. Each new jet wears an amber crown stripe (doTheOppositeParts CrownStripes, fogged like its jet) so
// the oncoming line reads amber-tipped where its fins are near edge-on.
// AMBER = UNITED (its fins: the stored row is cream and drained, every new jet has United's amber fin).
//
// SOURCES: the yard and the stored row are cut 1's (AllRetiredButUnited: ALL_RETIRED_ROW, its end state and end
// camera); the order is 787s (FACTS.md: 100 firm + 100 options, Dec 2022). No numbers, no text.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { ALL_RETIRED_END_CAM, ALL_RETIRED_END_STATE, ALL_RETIRED_ROW } from "./AllRetiredButUnited";
import { AirStage, Hangar, JET_POINTS, Jet, TaxiLine, airCamAt, airTrack, hangarToWorld, jetPoint, type AirCam, type SideCam } from "./aircraftShared";
import { CrownStripes } from "./doTheOppositeParts";

export const FPS = 24000 / 1001;
export const DURATION = 116;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const c01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (t: number) => {
  const c = c01(t);
  return c * c * (3 - 2 * c);
};

// ---------------------------------------------------------------------------
// THE DOORS — open on "opportunity" (f26-44): the panels telescope aside, the bay's warm light spills out
// ---------------------------------------------------------------------------
export const DOORS = { f0: 26, f1: 44 } as const;
export const doorsAt = (f: number) => smooth((f - DOORS.f0) / (DOORS.f1 - DOORS.f0));

// ---------------------------------------------------------------------------
// THE HANGAR AND ITS LANE (cut-local) — cut 1 never shows the hangar, so this cut places the world's <Hangar> closer:
// its lane passes APEX (just left of United's nose: the new jets' port wingtips clear it by ~13 m) and runs 250 m up
// to the door, ~400 m from the foreground, on the horizon side across the apron from the stored row (its right end
// stays ~80 m clear of the row's noses). LANE.at(s): s metres from 150 m inside the centre bay, the door at s 150
// (the world's lane convention, on this hangar).
// ---------------------------------------------------------------------------
const APEX: [number, number] = [-95, 172];
const LANE_HEADING = 184;
const DOOR_TO_APEX = 250;
const H = LANE_HEADING * (Math.PI / 180);
export const HANGAR_AT: [number, number] = [APEX[0] - Math.sin(H) * DOOR_TO_APEX, APEX[1] - Math.cos(H) * DOOR_TO_APEX];
export const LANE = {
  heading: LANE_HEADING,
  at: (s: number): [number, number] => {
    const p = hangarToWorld(HANGAR_AT, LANE_HEADING, [0, 0, 150 - s]);
    return [p[0], p[2]];
  },
};

// ---------------------------------------------------------------------------
// THE NEW LINE — United 787-9s queued nose to tail in the centre bay; the whole column starts rolling once the doors
// are wide (one 10-frame ease from rest), then taxis at one constant speed toward the camera along the world's lane.
// Jet k sits at s = lead(f) - k * SPACING on LANE.
// ---------------------------------------------------------------------------
export const LINE = { v: 5, spacing: 68, go: 34, accel: 10, s0: 92.6, count: 12 } as const;
export const leadS = (f: number) => {
  const t = f - LINE.go;
  if (t <= 0) return LINE.s0;
  if (t < LINE.accel) return LINE.s0 + (LINE.v * t * t) / (2 * LINE.accel);
  return LINE.s0 + LINE.v * (t - LINE.accel / 2);
};
export const jetS = (f: number, k: number) => leadS(f) - k * LINE.spacing;
/** a queued jet joins the column deep in the bay (centre 170 m inside, its tail at the back wall): from every camera
 *  of this cut the door shows at most ~110 m of the bay's floor (the lowest look in, f28-40), so it is never seen
 *  arriving; nothing waits behind the building, where the high end camera would see it over the roof */
const S_MIN = -20;

// ---------------------------------------------------------------------------
// CAMERA — from cut 1's last look (the stored row, United's fin) a turn and pull to the left to the yard wide, a
// push on the hangar as the doors open, then a rise and pull back as the line comes out
// ---------------------------------------------------------------------------
const START: SideCam = { ...ALL_RETIRED_END_CAM, f: 2700, horizon: 280, yaw: 32.5 };
export const TRACK: AirCam[] = airTrack(
  START,
  [
    { f0: -2, f1: 26, to: { x: 0, y: 120, z: 30, f: 820, horizon: 420, yaw: -9 } },
    { f0: 28, f1: 62, to: { x: -35, y: 85, z: 215, f: 760, horizon: 520, yaw: -14 } },
    { f0: 64, f1: 116, to: { x: 30, y: 260, z: -40, f: 1000, horizon: 140, yaw: -6 } },
  ],
  DURATION,
);

// ---------------------------------------------------------------------------
// THE YARD — this cut's hangar (doors) and lane, cut 1's packed storage row (drained, under covers) with its stand lines and
// United lit at its front, the lane's centreline, the new line on the lane
// ---------------------------------------------------------------------------
const ROW_JETS = [ALL_RETIRED_ROW.united, ...ALL_RETIRED_ROW.slots];
const YardWorld: React.FC<{ f: number }> = ({ f }) => {
  const items: { at: [number, number]; heading: number }[] = [];
  for (let k = 0; k < LINE.count; k++) {
    const s = jetS(f, k);
    if (s >= S_MIN) items.push({ at: LANE.at(s), heading: LANE.heading });
  }
  return (
    <>
      <Hangar at={HANGAR_AT} heading={LANE.heading} doors={doorsAt(f)} />
      <TaxiLine pts={[LANE.at(140), LANE.at(900)]} width={0.6} />
      {ROW_JETS.map((s, i) => {
        const nose = jetPoint(s.type, s.at, s.heading, JET_POINTS[s.type].nose);
        const tail = jetPoint(s.type, s.at, s.heading, JET_POINTS[s.type].tail);
        return <TaxiLine key={`l${i}`} pts={[[nose[0] - 14, nose[2]], [tail[0] + 6, tail[2]]]} width={0.4} />;
      })}
      {ALL_RETIRED_ROW.slots.map((s, i) => (
        <Jet key={`r${i}`} type={s.type} airline={s.airline} at={s.at} heading={s.heading} drain={ALL_RETIRED_END_STATE.drain} stored={ALL_RETIRED_END_STATE.stored} />
      ))}
      <Jet type={ALL_RETIRED_ROW.united.type} airline="united" at={ALL_RETIRED_ROW.united.at} heading={ALL_RETIRED_ROW.united.heading} />
      {items.map((it, k) => (
        <Jet key={`n${k}`} type="B787_9" airline="united" at={it.at} heading={it.heading} />
      ))}
      <CrownStripes type="B787_9" items={items} capacity={LINE.count} />
    </>
  );
};

/** the near clip (m): out to 60 for the high end camera, where nothing is nearer than ~140 m; a deeper near plane keeps
 *  the far hangar's floor, light spills and ground from z-fighting (they flickered at 3).
 *  REVISION 1 (one-frame glitches at f10 and f32): the world's ground is one 160 km plane of two triangles, and its
 *  depth, interpolated across those huge near-clipped triangles, lands a few cm too near on some camera states, over a
 *  screen region with straight edges. Whatever sits just above the ground then loses the depth test there: at f10 a
 *  hard-edged rectangle of United's contact shadow (0.06 m) and its stand line (0.04 m) vanished; at f32 the hangar's
 *  lit floor (0.1 m) vanished behind the door gaps. The margin between the ground and those layers grows with the near
 *  plane, so the opening (near 3) now holds the near plane at 20 m (nothing is nearer than ~57 m there: the ground at
 *  the frame's foot, United ~73 m) and hands back to the original ramp by f47; f47 on is unchanged. */
const nearOrig = (f: number) => 3 + 12 * smooth((f - 28) / 34) + 45 * smooth((f - 64) / 52);
const nearAt = (f: number) => Math.max(nearOrig(f), 20 * (1 - smooth((f - 36) / 20)));

const DoTheOpposite: React.FC<z.infer<typeof schema>> = () => {
  const S = useCurrentFrame();
  const cam = { ...(airCamAt(TRACK, S) as SideCam), near: nearAt(S) };
  return <AirStage cam={cam} S={S} rest={START} world={<YardWorld f={S} />} />;
};

export default DoTheOpposite;
