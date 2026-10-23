// ---------------------------------------------------------------------------------------------------------------
// StormMovingAway (scott-weather-fired, cut 20 "20_StormMovingAway"). Cheeky Pint style, the realistic "at sea"
// variant carried into the air (styles/cheeky-pint.md § Realistic ocean variant; the shared world denverWorld.tsx,
// read-only). Opaque 1080x1920, 23.976 fps, 75 frames. The MIRROR of cut 3 (StormMovingIn, read-only): same ring
// view, same cell look and drift speed, the storm on the other side and leaving.
//
// CHECK LINE: "this storm is east of the airport and already leaving, but one lightning bolt inside the ring still
// shuts the airport down — while the sun is out on the field."
//
// THE LINE: "But if the storm is moving west to east and it happens three miles to the east of the airport,"
// (then on camera: "you don't need to close it.")
// WORD -> FRAME: (But -6) · if 3 · the 5 · storm 6 · is 9 · moving 12 · west 19 · to 28 · east 30 · and 35 · it 38 ·
//                happens 39 · three 43 · miles 48 · to 53 · the 56 · east 58 · of 61 · the 63 · airport 64 · (you 68)
// DURATION: slot 20.103 -> 23.232 s = 3.129 s x 23.976 = 75 frames (f0..f74).
//
// THE MOTION (v3, revision 2; the mirror of cut 3 v3, whose constants it imports): cut 3's ring view and creep (cut
// 2's framing: the ring ~880 px wide, a clear cream line, whole and clear of the caption bands in every frame). The
// ramp busy; ONE mature thunderstorm (cut 3's cell: size 0.72, dark slate base, rain to the ground, sunlit upper
// turrets) stands just north-east of the field at f0 (0.4 mi east, 4.3 mi north: its base and rain just over the
// ring's north-east edge, its anvil whole in frame) and sails AWAY east-south-east at cut 3's constant drift
// (0.06, -0.024) mi/f (a timelapse, ~580 px across the cut), visibly boiling the whole way (world storm life `boil`, cut 3's value: turrets rising and rolling over, the
// base churning, the anvil streaming, rain falling in streaks); three soft in-cloud flickers (f9, f27, f62), none
// within 6 f of the strike.
// DIRECTION CUE (cut 3's): a soft cream arrow on the ground UNDER the storm, its tail under the base, pointing AWAY
// along the drift and out across the ring's north-east edge, wiped out from its tail f6 -> f18 ("moving" f12);
// "W" and "E" slide up just inside the ring's west and east points, landed on "west" f19 and "east" f30.
// On "happens three miles" one bolt leaves the storm's trailing (west) low body and strikes the ground INSIDE the
// ring's east-north-east edge (bearing ~60, 2.82 mi out): strike start f43, CONTACT f46 (= the first reaction frame:
// the ground glow, the base lit from inside, the amber leaving the strike's bearing). THE NEW ENDING: the amber
// starts to spread both ways from the strike (the rule wants to close), but the fronts slow and stop short (each
// 45 deg: a quarter of the ring, f46 -> f54), hold for a beat, then retract back into the strike point (f57 -> f64)
// and drain to cream (f60 -> f66) while the storm and its rain visibly leave the ring; the ramp only slows briefly
// (f46 -> f66, to ~40 %) and keeps rolling. Resolved frame (f66 -> f74): a CREAM ring = open, sun on the field, the
// storm leaving right, the arrow still pointing away. Cut 3 ends amber (closed); cut 4 ends cream (open).
// AMBER = the weather's reach: the bolt, the ground strike, the closure that starts and gives up. Nothing else is
// amber. Text: only the compass letters W / E (cut 3's).
//
// SOURCES: DEN layout per denverAirfield.ts (LAYOUT_SOURCE); the 3-mile ramp-closure radius is the speaker's (the
// clip's earlier line). No figures on screen.
// ---------------------------------------------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { COLOR } from "../kits/cheeky-pint/stoutShared";
import {
  AirStage,
  LightningStrike,
  STORM_BOIL,
  RING_MI,
  STRIKE,
  TERMINAL,
  ThreeMileRing,
  cellPos,
  flickerAt,
  makeDenClock,
  makeView,
  rampTravelAt,
  smooth,
  strikeGlow,
  type StormSpec,
  type StormState,
} from "./denverWorld";
import {
  CompassLetters,
  CreamRing,
  STORM_IN_ARROW,
  STORM_IN_CAM_GLIDES,
  STORM_IN_CAM_START,
  STORM_IN_COMPASS,
  STORM_IN_DRIFT,
  STORM_IN_LOOK,
  STORM_IN_STRIKE,
  StormDriftArrow,
} from "./StormMovingIn";

export const FPS = 24000 / 1001;
export const DURATION = 75;
export const schema = z.object({});
export const defaultProps = schema.parse({});

/** Story clock at f0: the sequence frame of 20.103 s (482) minus cut 1's in (2.252 s = frame 54). */
export const STORM_AWAY_S0 = 428;

// ---- the camera: cut 3's own (the field in the same place, the same slight creep and push-in) -----------------------
const CAM = makeDenClock(STORM_IN_CAM_START, STORM_IN_CAM_GLIDES, DURATION + 20, 60);

// ---- the storm: cut 3's cell (look, size, shadow and rain strength, drift), north-east of the field, leaving ---------
export const STORM_AWAY_CELL_F0 = { x: 0.4, y: 4.3 } as const;
const CELL: StormSpec = {
  id: "AWAY",
  seed: STORM_IN_LOOK.seed,
  size: STORM_IN_LOOK.size,
  anvilDir: STORM_IN_LOOK.anvilDir,
  vx: STORM_IN_DRIFT.vx,
  vy: STORM_IN_DRIFT.vy,
  x: STORM_AWAY_CELL_F0.x - STORM_IN_DRIFT.vx * STORM_AWAY_S0,
  y: STORM_AWAY_CELL_F0.y - STORM_IN_DRIFT.vy * STORM_AWAY_S0,
};
/** in-cloud lightning (cut frames): three soft events spaced through the cut, none within 6 f of the strike (f43-f46) */
export const STORM_AWAY_FLICKERS = [9, 27, 62];
/** storm life (world `boil`): cut 3's choice when it sets one, else the world default */
const LOOK: typeof STORM_IN_LOOK & { boil?: number } = STORM_IN_LOOK;
export const STORM_AWAY_BOIL = LOOK.boil ?? STORM_BOIL;

// ---- the strike: start f43, contact f46; out of the storm's trailing (west) low body at cut 3's bolt height ---------
export const STORM_AWAY_STRIKE = { start: 43, contact: 43 + STRIKE.contact, to: { x: 2.45, y: 1.4 }, fromOffset: { x: -0.85, y: -0.6 }, baseZ: STORM_IN_STRIKE.baseZ, seed: STORM_IN_STRIKE.seed } as const;
const STRIKE_BEARING = (Math.atan2(STORM_AWAY_STRIKE.to.x, STORM_AWAY_STRIKE.to.y) * 180) / Math.PI;
if (Math.hypot(STORM_AWAY_STRIKE.to.x - TERMINAL.x, STORM_AWAY_STRIKE.to.y - TERMINAL.y) >= RING_MI) throw new Error("StormMovingAway: the strike must land inside the ring");

// ---- the closure that gives up (cut frames) --------------------------------------------------------------------------
/** each front's reach from the strike bearing (degrees): out fast from contact, slowing to a stop at `reach` (a quarter
 *  of the ring in all), a beat's hold, then back into the strike point; the amber drains to cream over `drain`. */
export const STORM_AWAY_CLOSURE = { reach: 45, out: { f0: 46, f1: 54 }, back: { f0: 57, f1: 64 }, drain: { f0: 60, f1: 66 } } as const;
export const closureReachAt = (f: number) => {
  const C = STORM_AWAY_CLOSURE;
  if (f < C.out.f0) return 0;
  const u = Math.min(1, (f - C.out.f0 + 1) / (C.out.f1 - C.out.f0 + 1));
  return C.reach * Math.sin((u * Math.PI) / 2) * (1 - smooth(C.back.f0, C.back.f1, f));
};
const litAt = (f: number) => (f < STORM_AWAY_CLOSURE.out.f0 ? 0 : 1 - smooth(STORM_AWAY_CLOSURE.drain.f0, STORM_AWAY_CLOSURE.drain.f1, f));
/** the ramp: a brief slow while the rule fires, then rolling again (never stops) */
const rampActive = (f: number) => 1 - 0.6 * (smooth(46, 52, f) - smooth(58, 66, f));

// ---- the arrow: cut 3's arrow (look, size, draw timing), on the ground UNDER the storm as in cut 3: its tail under the
// storm's base / in its shadow while it draws (f6-f18), pointing AWAY along the drift (east-south-east); the storm
// rolls along it as it leaves ---------------------------------------------------------------------------------------
const ARROW = { ...STORM_IN_ARROW, tail: { x: 0.9, y: 3.75 } };

// ---- the compass letters: W on "west" (f19), E on "east" (f30) --------------------------------------------------------
const COMPASS = { W: { f0: 11, f1: 19 }, E: { f0: 22, f1: 30 } } as const;

const cellAt = (f: number): StormState => ({
  ...CELL,
  growth: STORM_IN_LOOK.growth,
  shadowStrength: STORM_IN_LOOK.shadowStrength,
  rainStrength: STORM_IN_LOOK.rainStrength,
  boil: STORM_AWAY_BOIL,
  glow: strikeGlow(f - STORM_AWAY_STRIKE.start),
  flicker: flickerAt(f, STORM_AWAY_FLICKERS),
});

const ringPoint = (bearing: number) => {
  const a = (bearing * Math.PI) / 180;
  return { x: TERMINAL.x + Math.sin(a) * RING_MI, y: TERMINAL.y + Math.cos(a) * RING_MI };
};

const StormMovingAway: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const S = STORM_AWAY_S0 + f;
  const v = makeView(CAM.at(f));
  const cell = cellAt(f);
  const c = cellPos(cell, S);
  const from = { x: c.x + STORM_AWAY_STRIKE.fromOffset.x, y: c.y + STORM_AWAY_STRIKE.fromOffset.y };
  const h = closureReachAt(f);
  const lit = litAt(f);
  const showArc = h > 0.05 && lit > 0.001;
  const back = STRIKE_BEARING - h; // the counter-clockwise front
  const bp = ringPoint(back);
  const backDot = showArc ? v.project(bp.x, bp.y, 0) : null;
  const rampTravel = rampTravelAt(S, (s) => rampActive(s - STORM_AWAY_S0));
  return (
    <AirStage
      S={S}
      v={v}
      cells={[cell]}
      rampTravel={rampTravel}
      ground={
        <>
          <CreamRing v={v} />
          <ThreeMileRing v={v} draw={1} lit={0} />
          <StormDriftArrow v={v} {...ARROW} draw={smooth(ARROW.draw.f0, ARROW.draw.f1, f)} opacity={ARROW.opacity} />
          {showArc ? <ThreeMileRing v={v} draw={(2 * h) / 360} lit={lit} from={back} /> : null}
          {backDot ? <circle cx={backDot.x} cy={backDot.y} r={3.2} fill={COLOR.amberHot} opacity={lit} /> : null}
        </>
      }
      over={
        <>
          <CompassLetters v={v} w={smooth(COMPASS.W.f0, COMPASS.W.f1, f)} e={smooth(COMPASS.E.f0, COMPASS.E.f1, f)} r={STORM_IN_COMPASS.r} px={STORM_IN_COMPASS.px} />
          <LightningStrike v={v} from={from} to={STORM_AWAY_STRIKE.to} t={f - STORM_AWAY_STRIKE.start} seed={STORM_AWAY_STRIKE.seed} baseZ={STORM_AWAY_STRIKE.baseZ} />
        </>
      }
    />
  );
};

export default StormMovingAway;
