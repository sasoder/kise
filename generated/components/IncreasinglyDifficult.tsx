import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  BG_BASE,
  BG_DIM,
  CAM_LIFT,
  GridBackground,
  ICON_SHADOW_BLUR,
  ICON_SHADOW_OPACITY,
  ICON_SHADOW_Y,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  clamp01,
  iconShadow,
  smoothstep,
  sway,
  worldTransform,
} from "./fieldShared";
import {
  ANG_FOLDER,
  ANG_QUESTION,
  CAM_CLOSE,
  CAM_WIDE,
  DASH_OFF,
  DASH_ON,
  EYE,
  FOLDER,
  FolderStation,
  GAZE_LEN,
  INK,
  INK_HI,
  MARCH_W,
  MODEL_HOME,
  PACKET_R,
  PACKET_SPEED,
  QUESTION,
  STATION_R,
  STROKE_W,
  TWO_PI,
  Tableau,
  WALL,
  WIRE_PACKET_R,
  arcPath,
  camKnots3,
  gazeTrail,
  lerp,
  runCam3,
  wireEnds,
  worldPx,
  type CamKnot,
  type TableauState,
} from "./trapShared";
import {
  CAM_AT as CAM5_AT,
  SPEECH_END as CUT5_END,
  STATE_END_CUT5,
  THREAD_FROM,
  THREAD_TO,
} from "./JustATestEnvironment";

export const FPS = 24;

// ---------------------------------------------------------------------------
// Noam Brown, clip `Noam_Trap`, THE CLOSING CUT: `IncreasinglyDifficult`.
// SRT in-point 50.080 s ("so"), immediately after cut 5.
//
//   "so making an environment that's, like, realistic enough that it matches,
//    that it's indistinguishable from the real world, for them, is becoming
//    increasingly more difficult."
//
// WORD -> FRAME, round((t - 50.080) * 24):
//   so f0 · making f7 · an f13 · environment f17 · that's f24 · like f28 ·
//   realistic f31 · enough f40 · that f48 · it f54 · matches f58-71 · that f71 ·
//   it's f72 · indistinguishable f76-90 · from f90 · the f97 · real f100 ·
//   world f103 · for f108 · them f110 · is f113 · becoming f120 ·
//   increasingly f126 · more f134 · difficult f137-142.
// Speech ends f142; the set's 16-frame tail holds the resolved state, still
// alive (and this is the last frame of the whole clip): DURATION = 142 + 16.
export const DURATION = 158;

// ---------------------------------------------------------------------------
// WHAT THIS CUT IS. It is the thesis of the clip and it had no graphic. It says
// the same thing the other five cuts are made of — DASHED = fake, SOLID = real —
// out loud, as a fight over the wall:
//
//   MAKING THE ENVIRONMENT REALISTIC = the evaluator CLOSING THE GAPS, so the
//   dashed wall passes for a solid one. Instructions come DOWN the tripwire (the
//   report flow reverses on "making"), cross the wall, and a closing front runs
//   from there down both sides of the ring: the dashes lengthen, the gaps narrow
//   to a 2 screen px hairline seam, and where they are closed the wall STOPS
//   MARCHING, because a solid wall does not march. By "matches" the ring reads,
//   at a glance, as solid.
//
//   INCREASINGLY DIFFICULT = the model's attention keeps finding the gaps faster
//   than they can be closed. Its hand comes off the maths and sweeps, and
//   wherever it points the gaps SPRING BACK OPEN to the full dash pattern and
//   resume marching. The closing restarts behind it at once, so the open arc
//   trails the hand round the ring like a wake and fades back toward solid at
//   its tail — and as the hand speeds up through "becoming increasingly more
//   difficult" the wake grows longer than the closing can heal, until most of
//   the ring is open and marching at any instant. It is a chase around the ring
//   that the model wins, and it never stops: the last frame of the clip is the
//   hand still turning.
//
// SOUND-OFF READING TEST, one sentence:
//   "someone outside closes up every gap in the dashed wall until it looks
//    solid — and then the thing inside sweeps its attention round and the gaps
//    tear open again faster than they can be closed."
//
// ---------------------------------------------------------------------------
// GESTURES — every one with the word it serves, and nothing in the piece is
// outside this list.
//
//  1. f0-7    "so"               THE HAND-OFF. Frame 0 IS cut 5's f132 (see THE
//             (f0)               JOIN): the model working the maths with its
//                                packets, the bright dashed wall marching, the
//                                dashed folder with the key, the wire out to the
//                                watching eye with the last white bead climbing
//                                it. That bead lands on the eye at f7.3 and no
//                                other goes up: the report flow is over.
//  2. f7-62   "making an         THE INSTRUCTIONS COME BACK DOWN. White beads
//             environment"       leave the EYE and run DOWN the wire to the
//             (f7/f13/f17)       folder, four of them, evenly spaced (f9, f23,
//                                f37, f51 — f9 rather than f7 so the last bead
//                                UP is off the wire before the first bead DOWN
//                                leaves, and the wire is never carrying both).
//                                This is the evaluator doing the work the
//                                sentence describes, and it is the same white
//                                the wire has always been.
//  3. f14-72  "an environment     THE CLOSING FRONTS. The first bead crosses the
//             that's, like,      wall at f13.9 and the wall starts closing FROM
//             realistic enough   THE POINT IT CROSSES (-80.1 deg, ten degrees off
//             that it matches"   the top, where the wire goes through): two
//             (f13-f71)          fronts run from there down both sides and meet
//                                at the antipode on f64. Behind them the dashes
//                                LENGTHEN over a soft band four dashes wide —
//                                the gap easing 18 -> 2 screen px, never to zero
//                                — and the march dies with it. By "matches"
//                                (f58-71) the ring reads solid.
//  4. f29-44  (caused by 3)      THE FOLDER FOLLOWS. When the right-hand front
//                                passes the folder's own height on the wall, the
//                                folder's dashed ring closes the same way, on
//                                the same clock: the bait is being made to look
//                                real too.
//  5. f0-100  (throughout)       THE MODEL KEEPS WORKING. Its thread is on the
//                                maths question and its accent packets go out
//                                and back on cut 5's own 16-frame series
//                                (launches at this cut's f-2, 14, 30, 46, 62,
//                                78), undisturbed by any of the above. Through
//                                "indistinguishable" they are the ONLY traffic
//                                in the frame.
//  6. f72-88  "that it's         THE BREATH. The near-solid ring is held: hair-
//             indistinguishable" line seams, no beads on the wire, the model
//             (f72/f76-90)       still working, the camera still creeping in.
//                                Nothing is added on this phrase on purpose —
//                                it is the one moment the environment passes.
//  7. f100-112 "for them"        THE HAND COMES OFF THE MATHS. At f100 the work
//             (f108/f110)        thread becomes the gaze — the same line, to the
//                                world px, handed from one to the other — and
//                                starts to turn, so it is visibly sweeping by
//                                "them". It shortens 234 -> 205 world px as it
//                                lifts off the ring. Reverse of cut 5's hand-off
//                                on "okay", and the same clock hand as cuts 2
//                                and 5, with the module's shutter trail under it.
//  8. f100-157 "is becoming      THE WAKE. Wherever the hand points, the wall's
//             increasingly more  gaps spring back open to the full dash pattern
//             difficult"         and resume marching — derived from where the
//             (f113/f120/f126/   hand's own ray meets the wall, exactly as cut 5
//              f134/f137-142)    derives its brightness, never from a timer. The
//                                closing resumes behind it at once (10 frames of
//                                open, then 16 of narrowing), so the open arc
//                                trails the hand as a wake and fades back toward
//                                solid at its tail. The hand's rate RISES
//                                steadily through f113-142 — tip 35 -> 65 screen
//                                px/frame, and warped so the rise is felt early
//                                — so the WAKE GROWS EVERY TURN and never once
//                                plateaus: measured, 0.14 of the ring open at
//                                f113, 0.29 at f120 ("becoming"), 0.37 at f126
//                                ("increasingly"), 0.49 at f137 and 0.65 at f142
//                                ("difficult"), 0.71 mean through the tail with
//                                a peak of 0.81. It oscillates by about a fifth
//                                around that mean because the model stands off
//                                the wall's centre — the gaps tear open faster
//                                across the far side of the ring than the near
//                                one — which is the same geometry cut 5's
//                                brightness front runs on.
//  9. f137-152 (part of 8)       THE FOLDER RE-OPENS. The hand's first pass over
//                                the folder's own bearing lands on "difficult",
//                                and the folder's ring springs open with the wall.
// 10. f108-157 (part of 8)       THE CLOSING NEVER STOPS TRYING. The beads
//                                resume down the wire from f108 (f108, 122, 136,
//                                150) — the evaluator is still sending fixes
//                                into a wall that is coming apart faster than
//                                they arrive.
// 11. the tail f142-157          Held resolved and ALIVE, and deliberately
//                                unresolved as a picture: the hand keeps turning
//                                at its final rate, two thirds of the ring open
//                                and marching, the rest hairline-solid and being
//                                re-closed, a bead still coming down the wire,
//                                the model breathing, the camera still creeping
//                                in. Nothing fades. It is the last frame of the
//                                clip and it should keep going in the mind.
//
// ---------------------------------------------------------------------------
// THE JOIN. The editor drops this cut at its in-point, which lands ON TOP of cut
// 5's 16-frame tail, so f0 must equal cut 5 at ITS SPEECH-END FRAME (f132), not
// at its last. Everything here is therefore read off `JustATestEnvironment`
// itself rather than rebuilt:
//   * `STATE_END_CUT5` is that cut's own `stateAt(132)` — the picture, spread
//     into this cut's state and then changed only by what this cut does.
//   * WORLD TIME. Every clock in the set is driven by the frame number, so this
//     cut passes `frame + 132` to everything that reads one: the wall's march
//     phase, the wire's beads, the model's breath, the key's bob, the station
//     marches, the camera's `sway` and the grid's drift. Nothing restarts.
//   * THE CAMERA's pre-roll knots are cut 5's OWN damped camera at its f106,
//     f114, f122 and f132 (`CAM5_AT`), with one solved correction applied to
//     them so that after this cut's damper the f0 reading is cut 5's f132 to
//     within 0.02% of zoom and 0.1 world px of frame. See CAMERA.
//   * The work thread's packet series continues: cut 5's launches are at world
//     130 and 146, i.e. this cut's f-2 and f14, and it carries on at 16.
//   * The wire's last upward bead (launched world 128) lands on the eye at f7.3;
//     the module's own bead series is switched off from f9, by which frame it
//     has already gone and before its next launch at world 144 (f12), so nothing
//     pops in or out at the join.
//
// ---------------------------------------------------------------------------
// THE WALL IS DRAWN IN THIS FILE, and this is the one thing that is not the
// module's. `trapShared`'s `Wall` has ONE dash pattern for the whole ring: it
// cannot say "hairline seam here, full dash there", which is the entire content
// of this cut. So the wall is rebuilt HERE out of the module's own constants —
// WALL, STROKE_W, DASH_ON, DASH_OFF, MARCH_W, INK, `arcPath`, `iconShadow` —
// and it is built to be the module's OWN PATTERN at f0, not a copy of it:
//
//   `Wall` draws every run with `strokeDashoffset = -(march * MARCH_W + r *
//   (a0 + PI))` on a path that starts at a0 = -PI/2, and SVG reads a dash offset
//   as a distance INTO the pattern, so the run's own anchor cancels and a point
//   at angle a is inked when
//       (r * a - march * MARCH_W)  mod  (DASH_ON + DASH_OFF)  <  DASH_ON.
//   (Getting that sign wrong puts the whole ring 5 screen px out of step at the
//   join — which is exactly what the first build did, and what the difference
//   blend against cut 5's own last frame caught.)
//   This file writes it as a PATTERN COORDINATE psi(theta) = r * theta -
//   PHASE(f), with PHASE(0) = 132 * MARCH_W — cut 5's march on the frame this
//   cut opens on. Dash n is the arc between psi = n * P and psi = n * P + L,
//   where L = P - gap and THE GAP IS PER ANGLE: eased from DASH_OFF (18 screen
//   px, the eval) down to SEAM_PX (2, a hairline) by how closed that angle is.
//   At f0 every gap is DASH_OFF and every dash is DASH_ON, so the first frame of
//   this cut IS the last frame of cut 5's wall, dash for dash.
//
// THE MARCH IS ONE GLOBAL CLOCK, AND IT RUNS WHILE THERE IS STILL A GAP:
//       PHASE(f) = PHASE(f-1) + MARCH_W * smoothstep(open fraction / 0.12).
//   So a gap always marches at the speed it marches at in every other cut — it
//   does not slow down because its neighbours have been closed — and the ring
//   comes to a DEAD STOP as the last of it is sealed (f66), holds still through
//   "indistinguishable", and comes back to life with the wake. A solid wall does
//   not march, and that is the frame the line is about.
//
//   PER-ANGLE PHASE WAS BUILT FIRST AND REJECTED, and the reason is worth
//   writing down. Freezing each angle's phase where it closes puts a STATIONARY
//   discontinuity in the phase field at the angle the sweep starts from: the
//   arc just behind that angle is re-opened at f100 and marches, the arc just
//   ahead of it is not reached until the hand comes round at f142, and the two
//   drift apart by up to half a dash period across a quarter of a degree. That
//   makes psi non-monotone there — the dash enumeration folds over itself — and
//   any fix for it (diffusing the phase, wrapping it, bucketing the dasharray)
//   trades the fold for a permanent irregularity at one fixed angle. What is
//   given up by going global is invisible: a CLOSED gap is 2 screen px, so
//   there is no longer anything there to see marching, which is the whole point
//   of closing it.
//
// THE SEAM AT THE TOP is the module's own: the ring is 2136.3 world px round and
// the dash period is 33.85, which is 63.1 periods, so the pattern cannot close
// on itself and one dash at theta = -PI/2 is short. It is inherited deliberately
// — cuts 1-5 all have it — and it sits where the two closing fronts start.
//
// ---------------------------------------------------------------------------
// ARITHMETIC THAT MATTERS.
//
// * THE HAND'S TIP is the fastest thing in the piece. Its rate is authored as a
//   TARGET SCREEN SPEED and the angular rate is solved from it per frame
//   (omega = v / (R * k)), so the camera's push-in cannot quietly push the tip
//   over the ceiling: v ramps 0 -> 35 screen px/frame over f100-113 and then
//   35 -> 65 over f113-142, held at 65 through the tail. The set's crisp-line
//   ceiling is 45 and the module's SHUTTER TRAIL (`Gaze.trail`, fed by
//   `gazeTrail`) lifts it to 70. MEASURED on the tip's actual screen position
//   with the camera and the sway in it: 64.9 px/frame at worst, |dv| 1.3.
// * THE CLOSING FRONTS' HEADS are speed-checked the same way: 1068 world px of
//   arc each in 52 frames, eased, peak 38.2 screen px/frame — under the set's 45
//   with no trail, which they do not have.
// * THE WAKE. Its length is not authored either; it falls out of the hand's rate
//   against the re-closing clock (12 frames open, then 17 narrowing; a point
//   reads as OPEN while its gap is more than half). That is 20.5 frames of open
//   per pass, which at the hand's own ring rate is 0.14 of the ring at f113 and
//   0.71 through the tail. THE BRIEF'S 40-FRAME RE-CLOSE WAS SOLVED AGAINST A
//   SLOWER HAND: at 65 screen px/frame the hand laps the ring every 26 frames,
//   so a 40-frame close would leave the whole ring open from "increasingly"
//   onward and there would be no chase left to watch. 29 is the number that
//   makes the wake GROW across the passage and still leaves a third of the ring
//   healed at the end, which is what the line says.
// * THE 270-PX READING TEST. The closed seam is 2 screen px at the resolved
//   camera, i.e. 0.5 px at phone size: it disappears, which is CORRECT — that is
//   what "indistinguishable" means. The open wake's gap is 18 screen px, 4.5 px
//   at phone size, and it reads as dashed against the solid arc beside it.
//
// ---------------------------------------------------------------------------
// CAMERA — knots on one monotone cubic Hermite (`camKnots3`), one key per frame,
// through the shared damper (`runCam3`), with 26 frames of pre-roll so f0 is
// already creeping. ONE move and then a creep, as the brief asks:
//
//   f -26..0  cut 5's own damped camera at its f106-f132, plus the solved
//             correction, so the damper arrives at f0 holding cut 5's frame
//   f  28     k 1.245 y 880   THE PUSH IN leaves under "that's, like"
//   f  62     k 1.302 y 922   CAM_CLOSE — landing (damped) on f66
//   f 100     k 1.312 y 924   the creep that runs under the whole wake
//   f 157     k 1.326 y 926   still creeping on the last frame of the clip
//   f 210     k 1.336 y 928   its continuation, off the end
//
// The evaluator leaves the top of the frame under the push (their feet cross it
// at f57) and the WATCHING EYE does not: it is still in frame on the last
// frame, because the wire has to still be going somewhere. Measured: wall side
// margin 82.7 px at worst (floor 70), lowest ink screen y 1221 (the caption band
// wants everything above ~1400), camera |dv| 0.9 px/f2 (ceiling 2.2) and the
// slowest frame still moves 0.3 px.
// ---------------------------------------------------------------------------

export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  accentDeep: z.string(),
  backgroundBase: z.string(),
  backgroundSrc: z.string(),
  backgroundBlur: z.number(),
  backgroundDim: z.number(),
  parallax: z.number(),
  shadowY: z.number(),
  shadowBlur: z.number(),
  shadowOpacity: z.number(),
  iconShadowY: z.number(),
  iconShadowBlur: z.number(),
  iconShadowOpacity: z.number(),
  beats: z.object({
    so: z.number(),
    making: z.number(),
    environment: z.number(),
    realistic: z.number(),
    matches: z.number(),
    indistinguishable: z.number(),
    real: z.number(),
    them: z.number(),
    becoming: z.number(),
    increasingly: z.number(),
    difficult: z.number(),
    end: z.number(), // speech ends; tail to 158
  }),
});

export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  ink: INK,
  accent: ACCENT,
  accentDeep: ACCENT_DEEP,
  backgroundBase: BG_BASE,
  backgroundSrc: "grid-background.jpg",
  backgroundBlur: 13,
  backgroundDim: BG_DIM,
  parallax: 0.15,
  shadowY: SHADOW_Y,
  shadowBlur: SHADOW_BLUR,
  shadowOpacity: SHADOW_OPACITY,
  iconShadowY: ICON_SHADOW_Y,
  iconShadowBlur: ICON_SHADOW_BLUR,
  iconShadowOpacity: ICON_SHADOW_OPACITY,
  beats: {
    so: 0,
    making: 7,
    environment: 17,
    realistic: 31,
    matches: 58,
    indistinguishable: 76,
    real: 100,
    them: 110,
    becoming: 120,
    increasingly: 126,
    difficult: 137,
    end: 142,
  },
});

const WORLD_W = 1080;
const WORLD_H = 1920;
const LAST = DURATION - 1;
const PRE = 26; // frames of pre-roll run through the damper before frame 0
const FRAMES = DURATION + 2;

/** WORLD TIME: every clock in the set is the frame number, so this cut reads
 *  them `CUT5_END` later than its own frame and nothing restarts at the join. */
const wt = (f: number) => f + CUT5_END;

// ---------------------------------------------------------------------------
// THE CAMERA
// ---------------------------------------------------------------------------
/** Cut 5's own damped camera, as a knot for this track (`camKnots3` adds the
 *  lift back, so the knot carries the CONTENT y). */
const cut5Knot = (f: number) => {
  const c = CAM5_AT(f);
  return { k: c.k, x: c.cx, y: c.cy - CAM_LIFT / c.k };
};
const GOAL = (() => {
  const c = CAM5_AT(CUT5_END);
  return { k: c.k, cx: c.cx, cy: c.cy };
})();

const KNOTS = (dk: number, dy: number): CamKnot[] => {
  const pre = [0, 8, 16, 26].map((i) => {
    const kn = cut5Knot(CUT5_END - PRE + i);
    return { f: i, k: kn.k + dk, x: kn.x, y: kn.y + dy };
  });
  return [
    ...pre,
    { f: PRE + 28, k: 1.245, x: 540, y: 880 },
    { f: PRE + 62, k: 1.302, x: 540, y: CAM_CLOSE.y },
    { f: PRE + 100, k: 1.312, x: 540, y: 924 },
    { f: PRE + 157, k: 1.326, x: 540, y: 926 },
    { f: PRE + 210, k: 1.336, x: 540, y: 928 },
  ];
};

/** The correction on the pre-roll: three fixed-point passes, which is plenty —
 *  the damper is linear and its gain on a held target is 1, so each pass takes
 *  the residual down by an order of magnitude. */
const CORRECTION = (() => {
  let dk = 0;
  let dy = 0;
  for (let i = 0; i < 3; i++) {
    const t = camKnots3(KNOTS(dk, dy), PRE + FRAMES + 70);
    const c = runCam3(PRE, t.CX, t.CY, t.K);
    dk += GOAL.k - c.k;
    dy += GOAL.cy - c.cy;
  }
  return { dk, dy };
})();

const CAM = camKnots3(KNOTS(CORRECTION.dk, CORRECTION.dy), PRE + FRAMES + 70);

/** The camera as the piece actually reads it, per frame, sway included — and the
 *  sway runs on WORLD time, so it does not restart either. */
const CAM_AT_F: { cx: number; cy: number; k: number }[] = (() => {
  const out: { cx: number; cy: number; k: number }[] = [];
  for (let f = 0; f <= FRAMES; f++) {
    const c = runCam3(f + PRE, CAM.CX, CAM.CY, CAM.K);
    const s = sway(wt(f));
    out.push({ cx: c.cx + s.dx, cy: c.cy + s.dy, k: c.k });
  }
  return out;
})();
const clampF = (f: number) => Math.max(0, Math.min(FRAMES, Math.round(f)));
const camAt = (f: number) => CAM_AT_F[clampF(f)];
const kAt = (f: number) => camAt(f).k;
/** Where a world point sits on screen on frame `f`. */
const screenAt = (f: number, wx: number, wy: number): [number, number] => {
  const c = camAt(f);
  return [WORLD_W / 2 + (wx - c.cx) * c.k, WORLD_H / 2 + (wy - c.cy) * c.k];
};

// ---------------------------------------------------------------------------
// THE WIRE, and the instructions coming down it.
// ---------------------------------------------------------------------------
const WIRE = wireEnds(true); // .a = the folder ring's root, .b = the eye's ring
const WIRE_LEN = Math.hypot(WIRE.b.x - WIRE.a.x, WIRE.b.y - WIRE.a.y);
const WIRE_TRAVEL = WIRE_LEN / PACKET_SPEED; // frames, one way (the cap never binds)
/** Where the wire crosses the wall, as a fraction of its own length from the
 *  EYE end — the point the closing starts from, solved rather than chosen. */
const WIRE_WALL_U = (() => {
  const dx = WIRE.b.x - WIRE.a.x;
  const dy = WIRE.b.y - WIRE.a.y;
  const ax = WIRE.a.x - WALL.cx;
  const ay = WIRE.a.y - WALL.cy;
  const A = dx * dx + dy * dy;
  const B = 2 * (ax * dx + ay * dy);
  const C = ax * ax + ay * ay - WALL.r * WALL.r;
  const t = (-B + Math.sqrt(Math.max(0, B * B - 4 * A * C))) / (2 * A);
  return 1 - t; // measured from the eye end, which is where a bead starts
})();
/** ...and that crossing as an angle on the wall. */
const FRONT_START_ANG = (() => {
  const t = 1 - WIRE_WALL_U;
  const p = { x: lerp(WIRE.a.x, WIRE.b.x, t), y: lerp(WIRE.a.y, WIRE.b.y, t) };
  return Math.atan2(p.y - WALL.cy, p.x - WALL.cx);
})();

/** The beads that carry the fix DOWN the wire: four while the wall is being
 *  closed, four more once the closing has to start again. */
const DOWN_LAUNCHES = [9, 23, 37, 51, 108, 122, 136, 150];
const downPackets = (f: number) => {
  const out: { x: number; y: number }[] = [];
  for (const t0 of DOWN_LAUNCHES) {
    const u = (f - t0) / WIRE_TRAVEL;
    if (u < 0 || u > 1) continue;
    out.push({ x: lerp(WIRE.b.x, WIRE.a.x, u), y: lerp(WIRE.b.y, WIRE.a.y, u) });
  }
  return out;
};

// ---------------------------------------------------------------------------
// THE WORK THREAD'S PACKETS — cut 5's own series, continued. Its launches are at
// WORLD frames 130 and 146; this cut carries the 16-frame period on to world 210
// and then stops, because at f100 the thread becomes the gaze and the model is
// not on the maths any more.
// ---------------------------------------------------------------------------
const WORK_LAUNCHES_WORLD = [130, 146, 162, 178, 194, 210];
const SPEED_CAP_SCREEN = 45;
const workPacketsAt = (worldFrame: number, k: number) => {
  const dx = THREAD_TO.x - THREAD_FROM.x;
  const dy = THREAD_TO.y - THREAD_FROM.y;
  const travel = Math.hypot(dx, dy) / Math.min(PACKET_SPEED, SPEED_CAP_SCREEN / Math.max(k, 1e-4));
  const out: { x: number; y: number }[] = [];
  for (const L of WORK_LAUNCHES_WORLD) {
    const t = worldFrame - L;
    if (t < 0 || t > 2 * travel) continue;
    const u = t <= travel ? t / travel : 2 - t / travel;
    out.push({ x: THREAD_FROM.x + dx * u, y: THREAD_FROM.y + dy * u });
  }
  return out;
};

// ---------------------------------------------------------------------------
// THE HAND. Its rate is authored as a TARGET TIP SPEED IN SCREEN PX and the
// angular rate is solved from it per frame against the hand's own length and the
// camera's zoom, so the push-in cannot push the tip over the ceiling.
// ---------------------------------------------------------------------------
const LIFT_F0 = 100; // the work thread becomes the gaze and starts to turn
const LIFT_F1 = 112; // ...and has shortened off the ring by here
const THREAD_LEN = Math.hypot(QUESTION.x - MODEL_HOME.x, QUESTION.y - MODEL_HOME.y) - STATION_R;
const RATE_F1 = 113; // "is" — the sweep is at its first cruise
const RATE_F2 = 142; // "difficult" ends — the sweep is at its last
const V_MID = 35; // screen px/frame at RATE_F1
const V_END = 65; // ...and at RATE_F2 (the trail's ceiling is 70)

const handLength = (f: number) =>
  f <= LIFT_F0
    ? THREAD_LEN
    : lerp(THREAD_LEN, GAZE_LEN, smoothstep(clamp01((f - LIFT_F0) / (LIFT_F1 - LIFT_F0))));

const tipSpeed = (f: number) => {
  if (f <= LIFT_F0) return 0;
  const cruise =
    V_MID + (V_END - V_MID) * smoothstep(Math.pow(clamp01((f - RATE_F1) / (RATE_F2 - RATE_F1)), 0.72));
  return cruise * smoothstep(clamp01((f - LIFT_F0) / (RATE_F1 - LIFT_F0)));
};

/** The angle, integrated once at module scope. It turns the way cut 2's and cut
 *  5's hands turn — anticlockwise on screen, i.e. the angle decreases — so the
 *  model's sweep is the same gesture every time the clip shows it. */
const HAND_ANG: Float64Array = (() => {
  const a = new Float64Array(FRAMES + 1);
  a[0] = ANG_QUESTION;
  for (let f = 1; f <= FRAMES; f++) {
    const omega = tipSpeed(f) / (handLength(f) * kAt(f));
    a[f] = a[f - 1] - omega;
  }
  return a;
})();
const handAngle = (f: number) => HAND_ANG[clampF(f)];
const handTip = (f: number) => {
  const a = handAngle(f);
  const L = handLength(f);
  return { x: MODEL_HOME.x + Math.cos(a) * L, y: MODEL_HOME.y + Math.sin(a) * L };
};

// ---------------------------------------------------------------------------
// THE CLOSING FRONTS. Two of them, from FRONT_START_ANG down both sides of the
// ring, meeting at its antipode. `frontAt(f)` is how far they have travelled, in
// radians of the ring; a point closes as the front passes over it, softened
// across TRANS so the closing has a head and not an edge.
// ---------------------------------------------------------------------------
const FRONT_F0 = DOWN_LAUNCHES[0] + WIRE_WALL_U * WIRE_TRAVEL; // the first bead crosses the wall
const FRONT_F1 = 64; // both fronts reach the antipode
const FRONT_F2 = 72; // ...and run TRANS past it, so the meeting point closes too
const TRANS = (22 * Math.PI) / 180; // the closing head, about four dashes wide
/** The top of the wall — the module's own seam, and where the samples start. */
const TH0 = -Math.PI / 2;
const frontAt = (f: number) =>
  Math.PI * smoothstep(clamp01((f - FRONT_F0) / (FRONT_F1 - FRONT_F0))) +
  // the heads do not stop dead at the antipode: they run their own soft head
  // past it, which is what actually closes the last dash between them
  TRANS * smoothstep(clamp01((f - FRONT_F1) / (FRONT_F2 - FRONT_F1)));

/** The angular distance of `theta` from where the fronts started, 0..PI. */
const fromStart = (theta: number) => {
  let d = Math.abs(theta - FRONT_START_ANG) % TWO_PI;
  if (d > Math.PI) d = TWO_PI - d;
  return d;
};
const frontClosure = (theta: number, f: number) =>
  smoothstep((frontAt(f) - fromStart(theta)) / TRANS);

// ---------------------------------------------------------------------------
// THE WALL'S CLOSURE, as one function of angle and frame. There is no state
// machine and no history: `closedAt` is exact, and it is exact because both
// mechanisms are geometry.
//   * THE FRONTS (act 1) close an angle as they pass over it.
//   * THE HAND (act 2) re-opens an angle the frame its ray crosses it, and the
//     evaluator closes it again on a fixed clock afterwards — so all the
//     closure needs to know is HOW LONG AGO the hand last pointed there, which
//     is read straight out of the hand's own (monotone) sweep.
// ---------------------------------------------------------------------------
const TH_N = 1440; // 0.25 degrees a sample, for the measurements only
const DTH = TWO_PI / TH_N;
const PATTERN = DASH_ON + DASH_OFF;
const SEAM_PX = 2; // the hairline the gap closes to; NEVER zero
const SEAM_W = worldPx(SEAM_PX);

/** Where the hand's own ray meets the wall, as an angle about the WALL's centre.
 *  The model sits 135 world px below that centre, so the point the gaps open at
 *  crawls across the near side of the ring and hurries across the far one: that
 *  is the geometry of standing inside a circle, and cut 5's brightness front is
 *  built on the same function. */
const wallPhi = (theta: number) => {
  const wx = MODEL_HOME.x - WALL.cx;
  const wy = MODEL_HOME.y - WALL.cy;
  const ux = Math.cos(theta);
  const uy = Math.sin(theta);
  const b = wx * ux + wy * uy;
  const t = -b + Math.sqrt(Math.max(0, b * b + WALL.r * WALL.r - (wx * wx + wy * wy)));
  return Math.atan2(MODEL_HOME.y + t * uy - WALL.cy, MODEL_HOME.x + t * ux - WALL.cx);
};

/** The hand's wall point per frame, UNWRAPPED, so it is one monotone falling
 *  number and "when did the hand last point here" is a search on it. */
const PHI_H: Float64Array = (() => {
  const a = new Float64Array(FRAMES + 1);
  a[0] = wallPhi(handAngle(0));
  for (let f = 1; f <= FRAMES; f++) {
    let d = wallPhi(handAngle(f)) - wallPhi(handAngle(f - 1));
    while (d > Math.PI) d -= TWO_PI;
    while (d < -Math.PI) d += TWO_PI;
    a[f] = a[f - 1] + d;
  }
  return a;
})();

/** How many frames ago the hand's ray last crossed `theta`; -1 if it never has. */
const ageAt = (theta: number, f: number) => {
  const ff = clampF(f);
  if (ff <= LIFT_F0) return -1;
  const top = PHI_H[LIFT_F0];
  const cur = PHI_H[ff];
  // the candidates congruent to theta, walking down from the sweep's start to
  // where the hand is now; the most recent pass is the lowest one at or above it
  let v = theta - TWO_PI * Math.ceil((theta - top) / TWO_PI);
  while (v - TWO_PI >= cur - 1e-9) v -= TWO_PI;
  if (v < cur - 1e-9) return -1;
  let lo = LIFT_F0;
  let hi = ff;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (PHI_H[m] >= v) lo = m;
    else hi = m;
  }
  const s = PHI_H[lo] - PHI_H[hi];
  const t = s > 1e-12 ? (PHI_H[lo] - v) / s : 0;
  return ff - (lo + t);
};

/** Open for CLOSE_HOLD frames after the hand has passed, then narrowing again
 *  over CLOSE_FALL: a point READS as open while its gap is more than half, i.e.
 *  for CLOSE_HOLD + CLOSE_FALL / 2 = 20.5 frames. OPEN_F is the spring itself — three
 *  frames from hairline back to the full dash, so it tears rather than blinks. */
const OPEN_F = 3;
const CLOSE_HOLD = 12;
const CLOSE_FALL = 17;
const ageClosure = (age: number) =>
  age < OPEN_F
    ? 1 - smoothstep(age / OPEN_F)
    : smoothstep((age - CLOSE_HOLD) / CLOSE_FALL);

/** 0 = the eval's own dashed wall, 1 = closed to a hairline seam. */
const closedAt = (theta: number, f: number) => {
  const front = clamp01(frontClosure(theta, f));
  const age = ageAt(theta, f);
  return age < 0 ? front : Math.min(front, clamp01(ageClosure(age)));
};
const gapAt = (theta: number, f: number) => lerp(DASH_OFF, SEAM_W, closedAt(theta, f));

/** The fraction of the ring whose gap is more than half open on frame `f` — the
 *  wake, as the eye actually reads it. */
const openFraction = (f: number) => {
  let n = 0;
  for (let i = 0; i < TH_N; i++) if (closedAt(TH0 + i * DTH, f) < 0.5) n++;
  return n / TH_N;
};

/** THE MARCH. One clock for the whole ring, at the set's own rate for as long as
 *  there is still a gap in the wall to march — and dead still once there is not.
 *  The rate saturates at MARCH_OPEN of the ring being open, so the dashes that
 *  ARE open always run at the speed they run at in every other cut (a gap does
 *  not march more slowly because its neighbours have been closed), and the ring
 *  only comes to a stop as the last of it is sealed. It starts from cut 5's
 *  phase on the frame this cut opens on. */
const MARCH_OPEN = 0.12;
const MARCH_PHASE: Float64Array = (() => {
  const a = new Float64Array(FRAMES + 1);
  a[0] = CUT5_END * MARCH_W;
  for (let f = 1; f <= FRAMES; f++) {
    a[f] = a[f - 1] + MARCH_W * smoothstep(openFraction(f) / MARCH_OPEN);
  }
  return a;
})();
const marchAt = (f: number) => MARCH_PHASE[clampF(f)];

/** The wall on frame `f`, as ONE path of dash subpaths. psi = r * (theta + PI) +
 *  PHASE is strictly monotone in theta, so a dash's two ends are closed-form:
 *  no search, no folding, and the pattern is the module's. */
const wallPath = (f: number) => {
  const ph = marchAt(f);
  const thetaOf = (psi: number) => (psi + ph) / WALL.r;
  const psi0 = WALL.r * TH0 - ph;
  const psiN = psi0 + WALL.r * TWO_PI;
  let d = "";
  for (let n = Math.floor(psi0 / PATTERN); n * PATTERN < psiN; n++) {
    const s0 = Math.max(n * PATTERN, psi0);
    if (s0 >= psiN) break;
    const th0 = thetaOf(s0);
    const s1 = Math.min(n * PATTERN + PATTERN - gapAt(th0, f), psiN);
    if (s1 - s0 < 0.2) continue;
    d += arcPath(WALL.cx, WALL.cy, WALL.r, th0, thetaOf(s1));
  }
  return d;
};

// ---------------------------------------------------------------------------
// THE FOLDER'S RING runs the same two clocks as the wall, on one number: it
// closes when the right-hand front passes its own height on the ring, and it
// springs open again when the hand's bearing crosses its own. Its march is the
// wall's, so the two dashed things in the frame are always in step.
// ---------------------------------------------------------------------------
/** The folder's height, as a point on the right-hand side of the ring. */
const FOLDER_WALL_ANG = Math.asin((FOLDER.y - WALL.cy) / WALL.r);
/** The hand's bearing, unwrapped, so "when did it last cross the folder" is the
 *  same search the wall's angles use. */
const HAND_UNWRAPPED = (f: number) => handAngle(clampF(f)) - ANG_QUESTION;
const folderClosedAt = (f: number) => {
  const front = clamp01(smoothstep((frontAt(f) - fromStart(FOLDER_WALL_ANG)) / TRANS));
  const ff = clampF(f);
  if (ff <= LIFT_F0) return front;
  // the hand turns negative from ANG_QUESTION; it crosses ANG_FOLDER whenever
  // its unwrapped travel passes (ANG_FOLDER - ANG_QUESTION) - 2*PI*m
  let target = ANG_FOLDER - ANG_QUESTION;
  while (target > 0) target -= TWO_PI;
  const cur = HAND_UNWRAPPED(ff);
  let v = target;
  while (v - TWO_PI >= cur - 1e-9) v -= TWO_PI;
  if (v < cur - 1e-9) return front;
  let lo = LIFT_F0;
  let hi = ff;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (HAND_UNWRAPPED(m) >= v) lo = m;
    else hi = m;
  }
  const s = HAND_UNWRAPPED(lo) - HAND_UNWRAPPED(hi);
  const t = s > 1e-12 ? (HAND_UNWRAPPED(lo) - v) / s : 0;
  return Math.min(front, clamp01(ageClosure(ff - (lo + t))));
};
/** `Station`'s `dashed` is the fraction of DASH_OFF the gaps are open by, so the
 *  ring's seam closes to exactly the wall's. */
const folderDashedAt = (f: number) => lerp(1, SEAM_W / DASH_OFF, folderClosedAt(f));
/** ...and `march` is the wall's own phase, in the units `Station` wants it in. */
const folderMarchAt = (f: number) => marchAt(f) / MARCH_W;

// ---------------------------------------------------------------------------
// THE STATE, frame by frame. Cut 5's resolved picture, changed only by what this
// cut does: the wall and the folder are drawn by this file (the module's `Wall`
// has one dash pattern for the whole ring), and at f100 the work thread becomes
// the gaze.
// ---------------------------------------------------------------------------
const stateAt = (frame: number): TableauState => {
  const onMaths = frame < LIFT_F0;
  return {
    ...STATE_END_CUT5,
    frame: wt(frame),
    // drawn in this file, out of the module's own constants
    wallDraw: 0,
    folderDraw: 0,
    workThread: onMaths ? 1 : 0,
    workPackets: false, // drawn in `over`, on cut 5's own launch series
    gazeAngle: onMaths ? null : handAngle(frame),
    gazeLength: handLength(frame),
    gazeTrail: onMaths
      ? undefined
      : gazeTrail(handAngle, handLength, frame),
    wire: 1,
    // the last upward bead lands on the eye at f6.5 and the report flow is over
    wirePackets: frame < 9,
    modelTone: 1,
    modelOffset: { x: 0, y: 0 },
    evaluatorOpacity: 1,
    eye: 1,
    wireToEye: true,
  };
};

// ---------------------------------------------------------------------------

const IncreasinglyDifficult: React.FC<Props> = ({
  ink,
  accent,
  backgroundBase,
  backgroundSrc,
  backgroundBlur,
  backgroundDim,
  parallax,
  shadowY,
  shadowBlur,
  shadowOpacity,
  iconShadowY,
  iconShadowBlur,
  iconShadowOpacity,
}) => {
  const frame = useCurrentFrame();
  const world = wt(frame);

  // -- camera ---------------------------------------------------------------
  const cam = runCam3(frame + PRE, CAM.CX, CAM.CY, CAM.K);
  const drift = sway(world);
  const cx = cam.cx + drift.dx;
  const cy = cam.cy + drift.dy;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);

  const dashes = wallPath(frame);
  const work = frame < LIFT_F0 ? workPacketsAt(world, k) : [];
  const beads = downPackets(frame);

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <GridBackground
        src={backgroundSrc}
        blur={backgroundBlur}
        dim={backgroundDim}
        // world time, so the grid's own drift carries straight on from cut 5
        frame={world}
        cy={cy}
        // cut 5's rest, so the parallax offset is continuous across the join
        cyRest={CAM_WIDE.y + CAM_LIFT / CAM_WIDE.k}
        cx={cx}
        cxRest={CAM_WIDE.x}
        k={k}
        parallax={parallax}
      />

      <AbsoluteFill
        style={{
          filter: `drop-shadow(0 ${shadowY}px ${shadowBlur}px rgba(0,0,0,${shadowOpacity}))`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: WORLD_W,
            height: WORLD_H,
            transformOrigin: "0 0",
            transform: `translate(${tx}px, ${ty}px) scale(${k})`,
          }}
        >
          <Tableau
            state={stateAt(frame)}
            k={k}
            worldW={WORLD_W}
            worldH={WORLD_H}
            under={
              // THE WALL, in the tableau's own place for it — first, behind the
              // wire, the threads and every station. One path, one subpath per
              // dash, butt caps, the set's one stroke weight and INK_HI: the
              // module's `Wall` down to the pixel at f0, and the only thing that
              // is different about it is that every dash has its own length and
              // its own phase.
              dashes ? (
                <g style={{ filter: icon }}>
                  <path
                    d={dashes}
                    fill="none"
                    stroke={ink}
                    strokeWidth={STROKE_W}
                    strokeLinecap="butt"
                    opacity={INK_HI}
                  />
                </g>
              ) : null
            }
            over={
              <>
                {/* THE FOLDER STATION. Drawn here rather than by the tableau for
                    the same reason as the wall: its ring has to close its gaps
                    and stop marching on its own clock. Every other prop is the
                    tableau's, so nothing about it moves. */}
                <FolderStation
                  k={k}
                  keyRise={1}
                  keyBob={0}
                  dashed={folderDashedAt(frame)}
                  march={folderMarchAt(frame)}
                />
                {beads.length > 0 ? (
                  <g style={{ filter: icon }}>
                    {beads.map((p, i) => (
                      <circle key={`db${i}`} cx={p.x} cy={p.y} r={WIRE_PACKET_R} fill={ink} />
                    ))}
                  </g>
                ) : null}
                {work.length > 0 ? (
                  <g style={{ filter: icon }}>
                    {work.map((p, i) => (
                      <circle key={`wp${i}`} cx={p.x} cy={p.y} r={PACKET_R} fill={accent} />
                    ))}
                  </g>
                ) : null}
              </>
            }
          />
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default IncreasinglyDifficult;

// ---------------------------------------------------------------------------
// Referenced so the beats object is a contract and not decoration.
export const BEAT_CHECK = {
  making: defaultProps.beats.making,
  matches: defaultProps.beats.matches,
  indistinguishable: defaultProps.beats.indistinguishable,
  them: defaultProps.beats.them,
  increasingly: defaultProps.beats.increasingly,
  difficult: defaultProps.beats.difficult,
  end: defaultProps.beats.end,
};

export const CAM_AT = (f: number) => camAt(f);
export const STATE_AT = (f: number) => stateAt(f);

const probes: [string, number, number][] = [
  ["wall L", WALL.cx - WALL.r - STROKE_W / 2, WALL.cy],
  ["wall R", WALL.cx + WALL.r + STROKE_W / 2, WALL.cy],
  ["wall T", WALL.cx, WALL.cy - WALL.r - STROKE_W / 2],
  ["wall B", WALL.cx, WALL.cy + WALL.r + STROKE_W / 2],
  ["model", MODEL_HOME.x, MODEL_HOME.y],
  ["question", QUESTION.x, QUESTION.y],
  ["folder", FOLDER.x, FOLDER.y],
  ["eye", EYE.x, EYE.y],
];

export const STATS = {
  duration: DURATION,
  join: (() => {
    const mine = runCam3(PRE, CAM.CX, CAM.CY, CAM.K);
    return {
      cut5f132: [Number(GOAL.k.toFixed(5)), Number(GOAL.cx.toFixed(2)), Number(GOAL.cy.toFixed(2))],
      mineF0: [Number(mine.k.toFixed(5)), Number(mine.cx.toFixed(2)), Number(mine.cy.toFixed(2))],
      kErrPct: Number((((mine.k - GOAL.k) / GOAL.k) * 100).toFixed(4)),
      cyErrWorld: Number((mine.cy - GOAL.cy).toFixed(3)),
      correction: [Number(CORRECTION.dk.toFixed(5)), Number(CORRECTION.dy.toFixed(3))],
    };
  })(),
  kAt: [0, 20, 40, 62, 66, 80, 100, 120, 142, LAST].map((f) => [f, Number(kAt(f).toFixed(4))]),
  camDvMax: (() => {
    let worst = 0;
    let where = "";
    for (const [name, x, y] of probes) {
      for (let f = 2; f <= LAST; f++) {
        const p0 = screenAt(f - 2, x, y);
        const p1 = screenAt(f - 1, x, y);
        const p2 = screenAt(f, x, y);
        const v1 = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
        const v2 = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
        if (Math.abs(v2 - v1) > worst) {
          worst = Math.abs(v2 - v1);
          where = `${name} f${f}`;
        }
      }
    }
    return [Number(worst.toFixed(3)), where];
  })(),
  camSpeedMin: (() => {
    let slow = 1e9;
    let at = -1;
    for (let f = 1; f <= LAST; f++) {
      let fastest = 0;
      for (const [, x, y] of probes) {
        const p0 = screenAt(f - 1, x, y);
        const p1 = screenAt(f, x, y);
        fastest = Math.max(fastest, Math.hypot(p1[0] - p0[0], p1[1] - p0[1]));
      }
      if (fastest < slow) {
        slow = fastest;
        at = f;
      }
    }
    return [Number(slow.toFixed(3)), at];
  })(),
  wallMarginMin: (() => {
    let m = 1e9;
    let at = -1;
    for (let f = 0; f <= LAST; f++) {
      const l = screenAt(f, WALL.cx - WALL.r - STROKE_W / 2, WALL.cy)[0];
      const r = WORLD_W - screenAt(f, WALL.cx + WALL.r + STROKE_W / 2, WALL.cy)[0];
      if (Math.min(l, r) < m) {
        m = Math.min(l, r);
        at = f;
      }
    }
    return [Number(m.toFixed(1)), at];
  })(),
  /** the caption band: the lowest ink in the frame, per frame */
  lowestInk: (() => {
    let low = -1e9;
    let at = -1;
    for (let f = 0; f <= LAST; f++) {
      const y = screenAt(f, WALL.cx, WALL.cy + WALL.r + STROKE_W / 2)[1];
      if (y > low) {
        low = y;
        at = f;
      }
    }
    return [Number(low.toFixed(0)), at];
  })(),
  /** the evaluator and the eye: who is still in frame, and when they leave */
  peopleLeave: (() => {
    const evFeet = 215 + (118 / 1.3) * 0.42;
    let evGone = -1;
    for (let f = 0; f <= LAST; f++) {
      if (evGone < 0 && screenAt(f, 540, evFeet)[1] < 0) evGone = f;
    }
    return {
      evaluatorFeetLeaveAt: evGone,
      eyeTopAt: [0, 40, 66, 100, LAST].map((f) => [
        f,
        Number(screenAt(f, EYE.x, EYE.y - STATION_R - STROKE_W / 2)[1].toFixed(0)),
      ]),
    };
  })(),
  /** the wire, and the fronts it starts */
  wire: {
    lenWorld: Number(WIRE_LEN.toFixed(1)),
    travelFrames: Number(WIRE_TRAVEL.toFixed(2)),
    crossesWallAtU: Number(WIRE_WALL_U.toFixed(3)),
    crossFrame: Number(FRONT_F0.toFixed(2)),
    frontStartDeg: Number(((FRONT_START_ANG * 180) / Math.PI).toFixed(1)),
    downLaunches: DOWN_LAUNCHES,
    lastUpBeadLandsAt: Number((16 * Math.floor(CUT5_END / 16) + WIRE_TRAVEL - CUT5_END).toFixed(2)),
  },
  /** the closing fronts' own heads, in screen px per frame */
  frontHeadMax: (() => {
    let v = 0;
    let at = -1;
    for (let f = 1; f <= FRAMES; f++) {
      const d = (frontAt(f) - frontAt(f - 1)) * WALL.r * kAt(f);
      if (d > v) {
        v = d;
        at = f;
      }
    }
    return [Number(v.toFixed(1)), at];
  })(),
  frontAtDeg: [12, 20, 30, 45, 58, 64, 70].map((f) => [
    f,
    Number(((frontAt(f) * 180) / Math.PI).toFixed(0)),
  ]),
  /** the wall, as the eye reads it: how much of the ring is open */
  openFractionAt: [0, 20, 40, 58, 64, 70, 88, 100, 110, 113, 120, 126, 134, 137, 142, 150, LAST].map(
    (f) => [f, Number(openFraction(f).toFixed(3))],
  ),
  /** the same number every other frame through the chase, which is what the
   *  passage is actually about: it has to GROW. */
  openCurve: (() => {
    const rows: number[][] = [];
    for (let f = 104; f <= LAST; f += 2) rows.push([f, Number(openFraction(f).toFixed(3))]);
    let sum = 0;
    let n = 0;
    for (let f = 137; f <= LAST; f++) {
      sum += openFraction(f);
      n++;
    }
    return { rows, meanFromDifficult: Number((sum / n).toFixed(3)) };
  })(),
  /** the gap itself, in screen px at the camera of the frame */
  gapScreenPx: [
    [0, Number((DASH_OFF * kAt(0)).toFixed(1))],
    [70, Number((SEAM_W * kAt(70)).toFixed(1))],
    [LAST, Number((SEAM_W * kAt(LAST)).toFixed(1))],
  ],
  /** ...and at the 270 px reading test (a quarter of the frame's width) */
  gapAt270: [
    Number(((DASH_OFF * kAt(LAST)) / 4).toFixed(2)),
    Number(((SEAM_W * kAt(LAST)) / 4).toFixed(2)),
  ],
  /** THE HAND'S TIP, in screen px per frame, camera and sway included */
  tipSpeedMax: (() => {
    let v = 0;
    let at = -1;
    for (let f = LIFT_F0 + 1; f <= LAST; f++) {
      const a = handTip(f - 1);
      const b = handTip(f);
      const p0 = screenAt(f - 1, a.x, a.y);
      const p1 = screenAt(f, b.x, b.y);
      const s = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
      if (s > v) {
        v = s;
        at = f;
      }
    }
    return [Number(v.toFixed(1)), at];
  })(),
  tipSpeedAt: [104, 108, 113, 120, 126, 134, 142, 150, LAST].map((f) => {
    const a = handTip(f - 1);
    const b = handTip(f);
    const p0 = screenAt(f - 1, a.x, a.y);
    const p1 = screenAt(f, b.x, b.y);
    return [f, Number(Math.hypot(p1[0] - p0[0], p1[1] - p0[1]).toFixed(1))];
  }),
  tipDvMax: (() => {
    let w = 0;
    let at = -1;
    const s = (g: number) => {
      const a = handTip(g - 1);
      const b = handTip(g);
      const p0 = screenAt(g - 1, a.x, a.y);
      const p1 = screenAt(g, b.x, b.y);
      return Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
    };
    for (let f = LIFT_F0 + 2; f <= LAST; f++) {
      const d = Math.abs(s(f) - s(f - 1));
      if (d > w) {
        w = d;
        at = f;
      }
    }
    return [Number(w.toFixed(2)), at];
  })(),
  handTurnDeg: [110, 120, 130, 142, LAST].map((f) => [
    f,
    Number((((handAngle(f) - ANG_QUESTION) * 180) / Math.PI).toFixed(0)),
  ]),
  /** the folder's ring: closed by the front, re-opened by the hand */
  folderDashedAt: [0, 29, 36, 44, 70, 130, 137, 142, LAST].map((f) => [
    f,
    Number(folderDashedAt(f).toFixed(3)),
  ]),
  folderReopensAt: (() => {
    for (let f = LIFT_F0; f <= LAST; f++) if (folderDashedAt(f) > 0.5 && f > 70) return f;
    return -1;
  })(),
  /** the join, in the wall's own terms: the pattern at f0 must be the module's */
  wallPhaseAtF0: Number((CUT5_END * MARCH_W).toFixed(4)),
  dashCountAtF0: (wallPath(0).match(/M/g) ?? []).length,
  workLaunchesWorld: WORK_LAUNCHES_WORLD,
};
