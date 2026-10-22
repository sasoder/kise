// ---------------------------------------------------------------------------
// NotTotallyWrong (scott-aircraft-order, cut 37). Cheeky Pint "at sea" look carried into the air (styles/cheeky-pint.md
// § Realistic ocean variant; the world: aircraftShared.tsx). Opaque 1080x1920, 23.976 fps, 89 frames. Render with
// --gl=angle (the jet and the ground are three.js).
//
// CHECK LINE: "the jet missed the exact mark, but the runway is long, so it still landed fine: you don't need to be
// exactly right."
//
// THE LINE: "We don't have to be right. We just have to be not totally wrong."
// WORD -> FRAME: We -4 · don't 4 · have 8 · to 12 · be 16 · right 22-33 · We 32 · just 38 · have 40 · to 43 · be 44 ·
// not 47 · totally 54-72 · wrong 72-81. The edit cuts back to Scott after f89.
// DURATION: the slot 37.537 -> 41.250 s = 3.712 s x 23.976 = 89 frames (f0..f88).
//
// THE MOTION: one landing seen from straight above, the runway on a diagonal (lower left to upper right). United's
// 787-9 crosses the threshold still airborne, its shadow well off to the lower right. Ahead of it, on the centreline,
// THE TARGET: one bullseye (ring + dot) at the exact spot a perfect landing touches. It comes into frame as cream
// paint and lights hot amber from the dot outward (f15 -> f22, lit on "right"). The jet drifts right of the
// centreline and floats over it still airborne (f30-40): it misses. On "just have to be" four thick amber corner
// brackets (the Will clip's lock-on bracket) grow out of the target's box (f41-44), then on "not totally" open out on
// one soft ease-out (f44 -> f68) to frame the acceptable zone: the runway's full width and a long stretch of it. The
// top corners pass the jet's nose by f54, so the jet lands INSIDE the zone. The edge lights inside it come on as the
// corners pass, a faint warm wash fills it, and the desert outside recedes by tone (f44-60). The jet touches down
// 155 m past the target and 11 m right of it and rolls on off-centre inside the brackets; the target stays in shot,
// unhit. One continuous camera, turned a constant 17 deg: close on the jet (span ~550 px), following it up the runway
// while pulling back to the payoff (span ~330 px: target and lower corners low left, the jet upper right, the upper
// corners near the top), then a slow creep.
// CONTACT: the main gear touches on f60, on "totally" (altitude 0; the shadow meets the jet). FIRST REACTION f60: two
// short tyre-smoke puffs are born at each bogie (billowing back, thinning out by ~f85) and the four tyre marks start
// drawing from the contact point; the nose comes down f62 -> f77.
// AMBER = United (its fin) and the bet's outcome: the target (the narrow "right") and the zone's brackets (the wide
// "not totally wrong"). Cream = the jet; the runway paint and the desert are context.
//
// SOURCES: 787-9 dimensions (62.8 m long, 60.1 m span; main-gear track 9.8 m) from the world's aircraftModels.ts
// (Boeing airport-planning data). Markings after ICAO Annex 14 Vol. I §5.2: a 60 m runway, 16 threshold stripes
// 1.8 x 30 m from 6 m in, centreline 30 m stripes / 20 m gaps 0.9 m wide, edge stripes 0.9 m, edge lights every 60 m.
// The bullseye and the brackets are graphics, not runway paint (they stand in for ICAO's aiming point). ONE
// COMPRESSION: ICAO puts the aiming point 400 m in on a runway this long; here the target is 190 m in, so the
// threshold, the target and the jet share the opening frames at a readable size; the jet flies ~2x real speed for the
// same reason. The altitude shadow is exaggerated (24 m over the threshold, a long float) so the gap reads from above.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { AirStage, Jet, type AirCam } from "./aircraftShared";
import { DesertDim, EdgeLights, RingTarget, RunwayPaint, RunwaySurface, TyreMarks, TyreSmoke, ZoneBrackets } from "./notTotallyWrongGround";
import { BEAT, FRAMES, JET, ROT, RWY, TYRE_XS, MARK, X_OFF, altAt, camAt, camCentre, gearS, headingAt, jetX, markReach, pitchAt, puffsAt, ringFront, toScr, zoneAt } from "./notTotallyWrongPlan";

export const FPS = 24000 / 1001;
export const DURATION = FRAMES; // 89
export const schema = z.object({});
export const defaultProps = schema.parse({});

const c01 = (v: number) => Math.max(0, Math.min(1, v));
const ss = (v: number) => {
  const u = c01(v);
  return u * u * (3 - 2 * u);
};

/** the plan camera at frame f (the cut's own track: notTotallyWrongPlan) */
export const airCamOf = (f: number): AirCam => {
  const c = camAt(f);
  const [x, zc] = camCentre(c);
  return { mode: "plan", x, z: zc, k: c.k, rot: -ROT };
};

const NotTotallyWrong: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const cam = airCamOf(f);
  const g = gearS(f);
  const hd = headingAt(f);
  const hr = (hd * Math.PI) / 180;
  // the fuselage centre sits JET.GEAR_X behind the main gear along the heading
  const at: [number, number] = [jetX(f) - Math.sin(hr) * JET.GEAR_X, g - Math.cos(hr) * JET.GEAR_X];
  const zone = zoneAt(f);
  const dim = ss((f - BEAT.dim[0]) / (BEAT.dim[1] - BEAT.dim[0]));
  return (
    <AirStage
      cam={cam}
      S={f}
      rest={airCamOf(0)}
      ground={{ aprons: [] }}
      world={
        <>
          <DesertDim amount={dim} />
          <RunwaySurface />
          <RunwayPaint />
          <RingTarget front={ringFront(f)} />
          <ZoneBrackets x={zone.x} s0={zone.s0} s1={zone.s1} arm={zone.arm} wash={0.1 * zone.open} k={camAt(f).k} />
          <EdgeLights front={zone.on > 0 ? zone.s1 : -1e4} lo={zone.s0} />
          <TyreMarks s0={MARK.s0} reach={markReach(f)} xs={TYRE_XS} len={MARK.len} />
          <TyreSmoke puffs={puffsAt(f)} />
          <Jet type="B787_9" airline="united" at={at} heading={hd} alt={altAt(f)} pitch={pitchAt(f)} detail="hi" />
        </>
      }
    />
  );
};

export default NotTotallyWrong;

// ---------------------------------------------------------------------------
// Load-time checks: the rules the cut rests on.
// ---------------------------------------------------------------------------
{
  const fail = (m: string) => {
    throw new Error(`NotTotallyWrong: ${m}`);
  };
  if (altAt(BEAT.touch) !== 0 || altAt(BEAT.touch - 1) <= 0) fail("the contact is not on BEAT.touch");
  const R = RWY.RING;
  if (gearS(BEAT.touch) - JET.TAIL < R.s + R.R + R.w) fail("the jet is not clear past the target at touchdown");
  if (MARK.s0 < R.s + R.R + 60 || X_OFF < R.R + R.w) fail("the tyre marks do not start clearly away from the target");
  const WING_S = 16.7; // the wing tips sit 16.7 m behind the main gear
  for (let f = 0; f < FRAMES; f++) {
    const c = camAt(f);
    const gS = gearS(f);
    // the jet stays in frame; its fin and its lower wing tip stay out of the first caption band
    const nose = toScr(c, jetX(f), gS + JET.NOSE);
    const tail = toScr(c, jetX(f), gS - JET.TAIL);
    const jx = jetX(f);
    const tipR = toScr(c, jx + JET.SPAN / 2, gS - WING_S);
    const tipL = toScr(c, jx - JET.SPAN / 2, gS - WING_S);
    if (nose.y < 40 || nose.x > 1040 || tipL.x < 20 || tipR.x > 1060) fail(`the jet nears the frame edge on f${f}`);
    if (tail.y > 1080 || tipR.y > 1080) fail(`the jet enters the caption band on f${f} (tail ${tail.y.toFixed(0)}, tip ${tipR.y.toFixed(0)})`);
  }
  // the payoff (f72 .. the end): the target and the zone's four corners wholly in frame, out of both caption bands;
  // the jet inside the zone
  for (let f = 72; f < FRAMES; f++) {
    const c = camAt(f);
    const z = zoneAt(f);
    const pts = [
      ...[-1, 1].flatMap((sx) => [z.s0, z.s1].map((s) => ({ x: sx * (z.x + 1), s }))),
      ...[0, 1, 2, 3].map((i) => ({ x: Math.cos((i * Math.PI) / 2) * (R.R + R.w), s: R.s + Math.sin((i * Math.PI) / 2) * (R.R + R.w) })),
    ];
    for (const q of pts) {
      const p = toScr(c, q.x, q.s);
      const inBand = (p.y > 1080 && p.y < 1250) || (p.y > 1360 && p.y < 1460);
      if (inBand || p.y < 30 || p.y > 1890 || p.x < 20 || p.x > 1060) fail(`a zone corner / the target sits at ${p.x.toFixed(0)}, ${p.y.toFixed(0)} on f${f}`);
    }
    if (gearS(f) + JET.NOSE > z.s1 - 2) fail(`the jet's nose leaves the zone on f${f}`);
  }
  if (X_OFF + JET.GEAR_Z + 0.75 > RWY.W / 2 - 2) fail("the off-centre landing puts a bogie off the runway");
  // the brackets: never near the frame's edge, no corner faster than ~60 screen px a frame, past the nose before contact
  let passed = -1;
  for (let f = 0; f < FRAMES; f++) {
    const z0 = zoneAt(f);
    if (z0.on <= 0) continue;
    const z1 = zoneAt(f + 1);
    const c0 = camAt(f);
    const c1 = camAt(f + 1);
    for (const sx of [-1, 1])
      for (const k of ["s0", "s1"] as const) {
        const a = toScr(c0, sx * z0.x, z0[k]);
        const b = toScr(c1, sx * z1.x, z1[k]);
        if (a.x < 40 || a.x > 1040 || a.y < 40 || a.y > 1880) fail(`a zone corner nears the frame edge on f${f} (${a.x.toFixed(0)}, ${a.y.toFixed(0)})`);
        if (Math.hypot(b.x - a.x, b.y - a.y) > 60) fail(`a zone corner moves ${Math.hypot(b.x - a.x, b.y - a.y).toFixed(0)} px on f${f}`);
      }
    if (passed < 0 && z0.s1 > gearS(f) + JET.NOSE + 2) passed = f;
  }
  if (passed < 0 || passed >= BEAT.touch) fail(`the zone's top corners pass the jet only on f${passed}`);
}
