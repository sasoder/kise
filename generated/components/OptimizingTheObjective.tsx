import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
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
  OP_UNREAD_DOT,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  WOBBLE_R,
  breath,
  camMove,
  clamp,
  clamp01,
  feather,
  hash,
  iconShadow,
  idleThreads,
  makeTone,
  runCamera,
  smoothstep,
  sway,
  wobble,
  worldTransform,
} from "./fieldShared";
import { DARK_TRAFFIC_OPACITY, Packet, arriveEase, packetsOn } from "./levelUp";

export const FPS = 24;

// ---------------------------------------------------------------------------
// John Charles Beren, clip cut 3, `OptimizingTheObjective`:
// "...actually, like achieving or optimizing the objective you've defined."
//
// DURATION. The composition starts at SRT 35.799 s, so every beat is
//   frame = round((t - 35.799) * 24)
//     actually f0 · like f15 · achieving f33 · or f49 · optimizing f55 ·
//     the f66 · objective f72 · you've f80 · defined f85 · next word "I" f98
// Speech therefore runs f0..98 and the set's 16-frame tail holds the resolved
// state: DURATION = 98 + 16 = 114.
export const DURATION = 114;

// ---------------------------------------------------------------------------
// V2 — A COMPLETE REBUILD. V1 (a person at the left, a trophy planted on a
// ground line to his right, the crowd racing sideways into a mound at its base)
// was rejected: "unfinished, half-assed, not harmonious, not thought through".
//
// This is the briefed picture instead, and it is a VERTICAL one: the person is
// in the CENTRE of the frame with his crowd of agents behind him, the objective
// is the same Lucide trophy cut 2 draws in its thought bubble, and it is 500
// world px straight ABOVE him — out of frame at the opening camera. The crowd
// leans, launches past his head, and climbs to it; the camera climbs with the
// stream; the dots seat around the trophy and the trophy lights.
//
// SOUND-OFF READING TEST — one sentence:
//   "the crowd behind the person rises to a trophy and lights it up;
//    the trophy is the person's."
//
// VOCABULARY, fixed for the clip and identical to cuts 1, 2 and 4:
//   people        = person.png, ink white, filled, iconShadow
//   the AIs       = orange dots, solid, ACCENT_DEEP at rest, ACCENT lit
//   the objective = Lucide `trophy`, outline, EXACTLY as cut 2 draws it in its
//                   bubble — the same six paths, the same ink-box rule (grid
//                   2..22 in both axes), the same GLYPH_STROKE_WORLD stroke
//                   convention. White until the AIs reach it. The head-led
//                   arc-length draw is NOT used here: the trophy is already
//                   standing when the camera finds it, and its gesture is the
//                   conversion, not a drawing.
//   the provenance= one thin ink line, person's head -> the trophy's base
// No text, no numbers, no ground line, no bubble, no other icon.
//
// ---------------------------------------------------------------------------
// GESTURES — the word each one lands on, and the frames it runs over. Every
// gesture LEADS its word and overlaps its neighbours; nothing starts from a
// dead stop and nothing in the piece is outside this list.
//
//   1. f0    "actually"      THE STANDING SCENE. The person centred, the crowd
//                            a feathered blob behind and around his lower half,
//                            drawn under the glyph so he occludes its middle.
//                            Alive from frame 0: the mill, micro-drift, dark
//                            traffic, glyph sway, and the camera's opening creep
//                            (k 1.40 -> 1.44) already running.
//   2. f10   "like" (f15)    ANTICIPATION. The crowd LEANS: every dot drifts up
//                            to 12 world px up and inward toward the trophy over
//                            f10-28, hashed starts, weighted so the dots nearest
//                            the top lean most — the blob's top edge bulges up
//                            behind the person's shoulders.
//   3. f26   "achieving"     LAUNCH, seven frames early. Dots leave upward past
//            (f33)           the person on individual hashed arcs, ~3.2/frame over
//                            f26-66, each flight speed-authored (18 world px/frame
//                            wide, 27 in the lane) and then capped against the set's
//                            45 SCREEN px/frame ceiling WITH the camera moving. The
//                            stream splits either side of his head: every flight is
//                            solved against his own head-and-shoulders ink, so no dot
//                            ever crosses the glyph in the open. arriveEase on every
//                            one, and no two neighbours in unison.
//   4. f44   "or" (f49)      THE STREAM TIGHTENS, continuously, not on a frame.
//            "optimizing"    Every flight carries one number, `mix` = smoothstep of
//            (f55) -> f66    its own launch time over f44-58: at 0 it is a wide
//                            individual arc through a waist 100-165 px off the axis,
//                            at 1 a narrow common lane at 78-92 and 50% faster. The
//                            two lanes are deliberately NOT mirrored (0.84 left,
//                            1.14 right, and they cross his head at different
//                            heights) or the stream closes into a drawn oval. By f66
//                            the whole crowd is airborne.
//   5. f55   "the objective" THE ARRIVAL, and the payoff. Dots seat in a feathered
//            (f66/f72)       annulus around the trophy from f55, bottom and sides
//                            first and the top last, going deep -> ripe as they seat.
//                            As the crowd actually REACHES it — the tenth dot down,
//                            f58.7 — the trophy's stroke converts white ->
//                            ACCENT_DEEP over 8 f; on "objective" (f72) it goes
//                            ACCENT_DEEP -> ACCENT over 6 f, so the word lands on the
//                            objective turning fully orange. All 130 seated by f98.
//   6. f76   "you've"/"defined" PROVENANCE. The person wakes (lift f72-80) and a
//            (f80/f85)       thin ink line draws head-led from the top of his head —
//                            off the bottom of the frame at this camera — straight up
//                            to the trophy's base, f76-95, screen-space head, 47%
//                            drawn on "defined". It stays; packets run it every 12 f
//                            from f97.
//   7. f92   tail -> f114    The camera's one eased pull-back resolves the whole
//                            picture: person at the bottom, the line, the orange
//                            trophy inside its crowd at the top. The annulus mills,
//                            dark traffic thins to 60%, packets run, the camera
//                            keeps drifting.
//
// ---------------------------------------------------------------------------
// LIVENESS — mechanisms, not gestures. None of them is on a word and none of
// them ever stops:
//   * micro-drift: every dot wanders +-3 world px on two hashed sines, seated,
//     milling, in flight, at every zoom, through the tail. Back-rung dots ride
//     1.45x of it.
//   * the mill: hops to vacant neighbouring seats on one shared occupancy map,
//     in the source crowd from f0 until it empties and in the annulus from the
//     first landing to the last frame (2.1 and 1.8 hops/frame; 248 hops in the
//     piece). The annulus keeps 35 blue-noise vacancies so there is always
//     somewhere to hop and the crowd still closes over the trophy.
//   * dark traffic: idleThreads(130) = 20 accent threads between neighbouring
//     dots at 0.12, no heads, never on a dot that has not landed.
//   * arriveEase on every flight and every mill hop — nothing stops dead.
//   * screen-space heads: the provenance line's head is 4.5/k, so it is one
//     size at every zoom.
//   * glyph sway: the person sways +-1.5 screen px on hashed sines and lifts
//     4 screen px over f72-80, before he acts.
//   * the trophy's idle: +-1 world px on two slow hashed sines, from frame 0.
//   * packets on the provenance line once it has landed.
//   * the camera never parks: five segments, two of them decaying drifts that
//     carry the previous move's direction rather than stopping. Measured motion
//     energy (scratchpad energy.txt) has a 12-frame-block floor of 0.380 against
//     the approved first cut of this clip's 0.327.
//
// ---------------------------------------------------------------------------
// THE DEPTH LADDER, by role — opacity and size only. TONE still carries state
// (deep at rest, ripe achieved), so nothing about the story is in these numbers.
//   FG  1.00  the trophy, the person, the cores of both crowds, the line's head
//             and its packets
//   MID 0.78  the provenance line — a claim is the container, not the thing
//   BG  0.55  the outer 40% of every crowd, by hashed distance percentile, at
//             0.80x radius (BG_R_SCALE) and 1.45x micro-drift
// Every dot also carries a +-18% hashed radius spread (R_SPREAD), and a dot's
// rung follows it from the crowd to the annulus, crossfaded across its flight.
//
// ---------------------------------------------------------------------------
// THE WEIGHT. Every weight in this cut is written as the SCREEN number from the
// clip's shared spec (harmony/spec.md §1) divided by the RESTING k, and the
// resting k is not a guess: the camera's last two keys are SOLVED at module
// scope so the damped camera resolves to exactly k 1.25 at f113. So the piece
// reads person box 118.0, outline 6.55, line 4.92, dark traffic 3.28 and a
// 14.0 px front-rung dot on the last frame by construction, and the crowd
// pitches are written as multiples of the dot so density rides with it.
//
// The camera's c-track is solved the same way: the last key is solved so the
// resolved ink centre lands on screen y 835 (the set's CAM_LIFT framing) on the
// last frame, sway included.
//
// ---------------------------------------------------------------------------
// CAMERA — one continuous C1 path, five segments, no cx axis (everything in
// this cut is on the column axis). c is the CONTENT centre; cy = c + 125/k.
//
//   f0-28    k 1.700 -> 1.820   c 1016 -> 974   warp 0.65  opening creep on the
//                                                           person and his crowd
//   f28-74   k 1.820 -> 1.300   c  974 -> 415   warp 1.05  ONE long glide up,
//                                                          following the stream
//                                                          onto the trophy
//   f74-86   k 1.300 -> 1.294   c  415 -> 404   warp 0.45  the glide's own
//                                                          direction, decaying
//   f86-110  k       -> solved  c      -> solved warp 1.0  ONE eased pull-back to
//                                                          the resolved frame
//   f110-114 k       -> -0.004  c      ->    +4  warp 0.40  decaying drift
//
// Measured on four fixed world probes (scratchpad cam.txt): max |dv| 2.201 px/f^2
// at f38 against the 2.5 budget, no frame under 0.330 px/f against the 0.15 floor,
// nothing over budget anywhere. Peak |v| is 32.4 px/f inside the glide — that IS
// the glide: the camera travels 559 world px in 46 frames to stay with the stream,
// so the crowd it leaves behind crosses the frame at that speed. Every dot head is
// budgeted separately and the fastest in the piece is 42.98 screen px/f.
//
// The trophy is fully out of the top of the frame at f0 (its centre sits at screen
// y -187, its lowest ink at -128), crosses the top edge at f40, is inside the
// caption band from f47 and is centred by f74-86.
//
// ---------------------------------------------------------------------------
// DEVIATIONS from the brief, and why. Every one was measured, not guessed; the
// measurements are in the scratchpad (measure.md, cam.txt, bounds.txt, energy.txt).
//   * THE TROPHY SITS 500 WORLD PX ABOVE THE PERSON, not the briefed 720, and the
//     pull-back's content centre is 670 rather than 600. The two are one
//     constraint: at the resolved k of 1.25 the whole picture — the annulus' top
//     rim down to the person's feet — has to fit inside the caption band with its
//     ink centre on screen y 835, which allows 455 screen px below that centre;
//     at 720 world px of separation the picture's own half-height is 555 screen px.
//     500 resolves at 412, with 48 px of bottom margin on the last frame, and
//     is still enough for the trophy to be entirely out of frame at the opening
//     camera. The briefed picture is unchanged: the objective is out of frame
//     above, and the camera climbs to it with the stream.
//   * THE OPENING k IS 1.70, not 1.40. The trophy has to be OUT of the frame at f0
//     and the person has to be in the caption-safe band, and those two fight: at
//     k 1.40 the person must sit at screen y 508 or above for the trophy's base to
//     clear the top edge, which puts the whole opening picture in the top third.
//     A TIGHTER opening pushes the trophy further out for the same framing, so
//     k 1.70 puts the person at screen 740 and the crowd's own centre at 824 — the
//     house framing — with the trophy 128 px clear above the frame. The person is
//     then 160 screen px at f0 and 118 at rest; the spec's numbers are the RESTING
//     ones and the measured frame is the last one.
//   * THE ANNULUS IS WIDER THAN 1.0-1.6x THE TROPHY'S HALF-BOX. 130 dots at the
//     spec's 14.0 screen px cannot stand in a ring of outer radius 75 world px:
//     that ring is 12,200 world px^2 and 130 dots need about 22,000 to stand
//     without overlapping. It is an ellipse rx 168 / ry 122 around the trophy with
//     the trophy's ink box (inflated 20 px) and the provenance line's lane cut out
//     of it, thinned continuously outward (ANN_THIN) so the mass is against the
//     objective and the rim dissolves, with its outer 40% on the back rung.
//   * LAUNCH RATE. 130 dots leave over f26-66 at a mean 3.25/frame on a nearly flat
//     curve, not the briefed 2.5 ramping down: at 2.5 ramping down the brief's own
//     deadline (the whole crowd airborne by f66) is out of reach. Half the crowd is
//     away by f47 rather than f55, and the first dots seat at f55 rather than f62 —
//     so the trophy's conversion is keyed to the TENTH dot down (f58.7) rather than
//     the first, which is also the more honest trigger: one dot touching down is
//     not the AIs arriving.
//   * THE PROVENANCE LINE DRAWS OVER 19 FRAMES (f76-95), not 12. It is 458 world px
//     long and it runs while the camera is at its tightest: at 12 frames its head is
//     50 screen px/f, over the set's 45 cap. At 19 frames the peak head is 41 and
//     "defined" (f85) still lands mid-stroke, 47% drawn.
//   * NO UNISON, at this density. 130 dots leave over 40 frames, so the mean gap
//     between consecutive launches is 0.31 f and a blanket 2-frame rule between
//     every pair is arithmetically impossible. It is enforced where it is visible:
//     every pair of dots within 18 world px of each other in the crowd launches at
//     least 2 f apart, and every pair of annulus seats within 14 world px lands at
//     least 2 f apart. STATS reports both achieved minima (2.03 and 2.02).
//   * THE PERSON LEAVES THE CAPTION BAND over f53-107, dropping to screen y 1501 at
//     the tightest camera. That is the cut, not an accident: the camera follows the
//     stream up to an objective 500 world px away and no camera at k 1.30 holds
//     both ends. He is never cut off by the frame itself (the lowest drawn pixel in
//     the piece is y 1549 of 1920), nothing ever leaves the SIDES (x 190..884 over
//     all 114 frames against the 40..1040 band), and the opening and resolved
//     frames both centre inside the band (823.5 and 833.5). The trophy crosses the
//     TOP edge over f35-46 as it enters, which is the gesture.
//   * THE MID-FLIGHT PICTURE was re-cut twice. Symmetric lanes and an outward-
//     pushed approach turned the stream into a closed oval on the frames where half
//     the crowd is in the air — a drawn ring, not a surge. The two lanes now run at
//     0.84 and 1.14 of the waist and cross his head at different heights, and the
//     approach control converges toward the trophy instead of swinging wide.
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------

export const schema = z.object({
  ink: z.string(),
  accent: z.string(), // ripe: a dot that has reached the objective
  accentDeep: z.string(), // deep: a dot at rest in the crowd
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
  dotOpacity: z.number(),
  personSrc: z.string(),
  beats: z.object({
    actually: z.number(),
    like: z.number(),
    achieving: z.number(),
    or: z.number(),
    optimizing: z.number(),
    the: z.number(),
    objective: z.number(),
    youve: z.number(),
    defined: z.number(),
    end: z.number(), // next word "I"; tail to 114
  }),
});

export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  ink: "#FFFFFF",
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
  dotOpacity: OP_UNREAD_DOT,
  personSrc: "person.png",
  beats: {
    actually: 0,
    like: 15,
    achieving: 33,
    or: 49,
    optimizing: 55,
    the: 66,
    objective: 72,
    youve: 80,
    defined: 85,
    end: 98,
  },
});

const WORLD_W = 1080;
const WORLD_H = 1920;
const CX = 540;

// --- the depth ladder ------------------------------------------------------
const OP_FG = 1.0;
const OP_MID = 0.78;
const OP_BG = 0.55;
const BG_R_SCALE = 0.8; // a back dot is smaller as well as dimmer
const BG_DRIFT = 1.45; // ...and rides ~1.4 px more micro-drift
const DEPTH_CUT = 0.6; // percentile of a seat's distance at which it goes back
const DEPTH_JITTER = 0.34; // hashed, so the band is feathered and not a drawn ring
const R_SPREAD = 0.18; // +-18% hashed per-dot radius

// ---------------------------------------------------------------------------
// THE LAYOUT, in world px. The person is the origin of the picture; everything
// else is placed off him.
// ---------------------------------------------------------------------------
const PERSON = { x: CX, y: 960 };
const SEPARATION = 500; // person centre -> trophy centre (see DEVIATIONS)
const TROPHY = { x: CX, y: PERSON.y - SEPARATION }; // (540, 415)

// ---------------------------------------------------------------------------
// THE CAMERA. fieldShared's `camMove` verbatim — one key per frame on an eased
// curve, cy taken off the eased k, the set's CAM_LIFT of 125 — then the shared
// damper. No cx axis: the whole cut is on the column axis.
//
// The last segment's two endpoints are SOLVED rather than authored, so the
// DAMPED camera (which lags its target) lands exactly where the spec needs it:
// k 1.25 at f113, and the ink centre on screen y 835. Both solves are linear —
// runCamera is a linear filter of its target track and every key downstream of
// the unknown is affine in it — so two evaluations and one interpolation are
// exact, and the residual is asserted below.
// ---------------------------------------------------------------------------
const K_REST_TARGET = 1.25;
const LAST = DURATION - 1; // f113, the measured frame

type Seg = { f0: number; f1: number; k0: number; k1: number; c0: number; c1: number; warp: number };

const segsFor = (kEnd: number, cEnd: number): Seg[] => [
  // 1. the opening creep on the person and his crowd — a push, not a park
  { f0: 0, f1: 28, k0: 1.7, k1: 1.82, c0: 1016, c1: 974, warp: 0.65 },
  // 2. ONE long glide up, following the stream onto the trophy
  { f0: 28, f1: 74, k0: 1.82, k1: 1.3, c0: 974, c1: TROPHY.y, warp: 1.05 },
  // 3. the glide's own direction, continued and decaying
  { f0: 74, f1: 86, k0: 1.3, k1: 1.294, c0: TROPHY.y, c1: TROPHY.y - 11, warp: 0.45 },
  // 4. ONE eased pull-back to the resolved picture, starting with the claim
  { f0: 86, f1: 110, k0: 1.294, k1: kEnd, c0: TROPHY.y - 11, c1: cEnd, warp: 1.0 },
  // 5. the pull-back's own direction, decaying
  { f0: 110, f1: DURATION, k0: kEnd, k1: kEnd - 0.004, c0: cEnd, c1: cEnd + 4, warp: 0.4 },
];

const trackOf = (segs: Seg[]) => {
  const F: number[] = [0];
  const K: number[] = [segs[0].k0];
  const CY: number[] = [segs[0].c0 + CAM_LIFT / segs[0].k0];
  for (const s of segs) {
    const m = camMove(s);
    for (let i = 0; i < m.F.length; i++) {
      if (m.F[i] <= F[F.length - 1]) continue;
      F.push(m.F[i]);
      K.push(m.K[i]);
      CY.push(m.CY[i]);
    }
  }
  return { F, K, CY };
};

// The zoom track does not depend on c at all, so it is solved first.
const kAtLast = (kEnd: number) => {
  const t = trackOf(segsFor(kEnd, 0));
  return runCamera(LAST, t.F, t.CY, t.K).k;
};
const K_END = (() => {
  const a = 1.2;
  const b = 1.32;
  const fa = kAtLast(a);
  const fb = kAtLast(b);
  return a + ((K_REST_TARGET - fa) * (b - a)) / (fb - fa);
})();
/** The zoom the whole piece's weights are written against. */
const K_REST = kAtLast(K_END);

// ---------------------------------------------------------------------------
// THE WEIGHTS. Straight out of the clip's shared spec, in SCREEN px, divided by
// the resting zoom. Nothing in this piece writes a world weight of its own.
// ---------------------------------------------------------------------------
const SCREEN_PERSON = 118.0; // person.png box
const SCREEN_OUTLINE = 6.55; // any closed outline: here, the trophy
const SCREEN_LINE = 4.92; // 0.75 x the outline: the provenance line
const SCREEN_TRAFFIC = 3.28; // 0.50 x the outline
const SCREEN_DOT = 14.0; // front-rung dot DIAMETER

const GLYPH = SCREEN_PERSON / K_REST;
const GLYPH_STROKE_WORLD = SCREEN_OUTLINE / K_REST;
const LINE_STROKE = SCREEN_LINE / K_REST;
const DARK_TRAFFIC_STROKE = SCREEN_TRAFFIC / K_REST;
const DOT_R = SCREEN_DOT / 2 / K_REST;

// The person's ink inside its box (measured off person.png once, in cut 2).
const PERSON_INK_TOP = 40 / 512;
const PERSON_FOOT = 471 / 512;
const HEAD_TOP_Y = PERSON.y - GLYPH / 2 + GLYPH * PERSON_INK_TOP;
const FOOT_Y = PERSON.y - GLYPH / 2 + GLYPH * PERSON_FOOT;
const PERSON_BOX = {
  x0: PERSON.x - GLYPH / 2,
  x1: PERSON.x + GLYPH / 2,
  y0: PERSON.y - GLYPH / 2,
  y1: FOOT_Y,
};

// ---------------------------------------------------------------------------
// THE OBJECTIVE. Lucide `trophy`, ISC, inlined verbatim as a 24-unit icon —
// the same six paths, in the same order, that cut 2 draws inside its thought
// bubble. Its INK box on the grid is x 2..22 (the handle arcs bulge a half
// circle past the cup) and y 2..22, i.e. 20 x 20 units, and cut 2's rule is
// that the glyph BOX is that ink box. Here the box is the person's box: the
// objective is exactly as big as the person, which is as large as it can be
// without becoming the composition on its own.
//
// The stroke follows cut 2's convention exactly: one GLYPH_STROKE_WORLD for the
// whole family, solved back out of the glyph's scale so the WORLD (and so the
// screen) weight is the spec's, whatever the box is.
// ---------------------------------------------------------------------------
const TROPHY_BOX = GLYPH; // ~1.0x the person on screen
const TR_S = TROPHY_BOX / 20; // world px per grid unit
const TROPHY_D = [
  "M6 9H4.5a2.5 2.5 0 0 1 0-5H6",
  "M18 9h1.5a2.5 2.5 0 0 0 0-5H18",
  "M4 22h16",
  "M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22",
  "M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22",
  "M18 2H6v7a6 6 0 0 0 12 0V2Z",
];
const TROPHY_TX = `translate(${(TROPHY.x - 12 * TR_S).toFixed(3)} ${(
  TROPHY.y -
  12 * TR_S
).toFixed(3)}) scale(${TR_S.toFixed(5)})`;
const TROPHY_HALF = TROPHY_BOX / 2;
const TROPHY_BASE_Y = TROPHY.y + TROPHY_HALF; // grid y 22: where the provenance line lands
const TROPHY_INK = {
  x0: TROPHY.x - TROPHY_HALF,
  x1: TROPHY.x + TROPHY_HALF,
  y0: TROPHY.y - TROPHY_HALF,
  y1: TROPHY_BASE_Y,
};

// The conversion. White until the AIs reach it; ACCENT_DEEP as the first dots
// seat; ACCENT on "objective". Nothing else about the trophy moves except its
// idle, which is the liveness every glyph in the set carries.
const DEEP_DUR = 8;
const RIPE_F0 = 72; // "objective"
const RIPE_DUR = 6;
const trophyIdle = (frame: number) => ({
  dx: 0.6 * Math.sin(frame * 0.067 + 1.7) + 0.4 * Math.sin(frame * 0.041 + 4.1),
  dy: 0.6 * Math.sin(frame * 0.053 + 0.4) + 0.4 * Math.sin(frame * 0.037 + 2.9),
});

// ---------------------------------------------------------------------------
// THE PROVENANCE. One line, head-led, from the top of the person's head to the
// trophy's base. He is off the bottom of the frame when it starts, so it comes
// up into the picture from below. See DEVIATIONS for the 19-frame draw.
// ---------------------------------------------------------------------------
const CLAIM_F0 = 76;
const CLAIM_F1 = 95;
const WAKE_F0 = 72;
const WAKE_F1 = 80;
const PACKET_F0 = 97;

// ---------------------------------------------------------------------------
// THE CROWD. A feathered, wobbling superellipse blob behind and around the
// person's lower half — never a box, and drawn UNDER the glyph so he occludes
// its middle. The lattice is hashed off its cell and the boundary undulates.
// Both pitches are written as multiples of the DOT, so the crowd's density is
// tied to the spec's dot size rather than to a number typed here.
// ---------------------------------------------------------------------------
const CROWD = { x: CX, y: 1010, rx: 200, ry: 90 };
const CROWD_STEP_X = 3.3 * DOT_R;
const CROWD_STEP_Y = 2.48 * DOT_R;
const CROWD_N = 2.4; // superellipse exponent
const CROWD_FEATHER = 0.14; // in normalised radius

type Seat = { x: number; y: number; r: number; depth: number };

const SRC_SEATS: Seat[] = (() => {
  const out: Seat[] = [];
  const cols = Math.ceil((2 * CROWD.rx) / CROWD_STEP_X) + 2;
  const rows = Math.ceil((2 * CROWD.ry) / CROWD_STEP_Y) + 2;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      const x =
        CROWD.x -
        CROWD.rx -
        CROWD_STEP_X / 2 +
        c * CROWD_STEP_X +
        (hash(i, 11) - 0.5) * CROWD_STEP_X * 0.9;
      const y =
        CROWD.y -
        CROWD.ry -
        CROWD_STEP_Y / 2 +
        r * CROWD_STEP_Y +
        (hash(i, 12) - 0.5) * CROWD_STEP_Y * 0.9;
      const nx = Math.abs(x - CROWD.x) / CROWD.rx;
      const ny = Math.abs(y - CROWD.y) / CROWD.ry;
      const rho = Math.pow(Math.pow(nx, CROWD_N) + Math.pow(ny, CROWD_N), 1 / CROWD_N);
      const edge = 1 + wobble(Math.atan2(y - CROWD.y, x - CROWD.x) * WOBBLE_R, 2.3) * 0.045;
      const f = feather((edge - rho) / CROWD_FEATHER, 1);
      if (hash(i, 71) >= f) continue;
      out.push({
        x,
        y,
        r:
          (0.85 + 0.35 * hash(i, 13)) *
          (0.72 + 0.28 * f) *
          (1 + (hash(i, 27) - 0.5) * 2 * R_SPREAD),
        depth: clamp01(rho / edge + (hash(i, 23) - 0.5) * DEPTH_JITTER),
      });
    }
  }
  return out;
})();

// ---------------------------------------------------------------------------
// THE ANNULUS AT THE TROPHY. A feathered ellipse of seats around the glyph with
// two holes cut in it: the trophy's own ink box inflated by TROPHY_CLEAR (so no
// dot ever sits on a stroke) and a narrow lane under the base for the
// provenance line to arrive through. Seats are ordered so the crowd fills from
// the BOTTOM and the SIDES and closes over the top last.
// ---------------------------------------------------------------------------
const ANN_RX = 168;
const ANN_RY = 122;
const ANN_STEP_X = 2.46 * DOT_R;
const ANN_STEP_Y = 2.05 * DOT_R;
const ANN_FEATHER = 0.16;
const ANN_THIN = 0.45; // how much thinner the rim is than the ring at the trophy
const TROPHY_CLEAR = 20; // world px of daylight around the trophy's ink box
const LANE_CLEAR = 14; // half-width of the provenance line's lane

const ANN_SEATS: Seat[] = (() => {
  const out: Seat[] = [];
  const cols = Math.ceil((2 * ANN_RX) / ANN_STEP_X) + 2;
  const rows = Math.ceil((2 * ANN_RY) / ANN_STEP_Y) + 2;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c + 5171;
      const x =
        TROPHY.x -
        ANN_RX -
        ANN_STEP_X / 2 +
        c * ANN_STEP_X +
        (hash(i, 11) - 0.5) * ANN_STEP_X * 0.9;
      const y =
        TROPHY.y -
        ANN_RY -
        ANN_STEP_Y / 2 +
        r * ANN_STEP_Y +
        (hash(i, 12) - 0.5) * ANN_STEP_Y * 0.9;
      // the trophy's own ink, plus clearance: never a dot on a stroke
      if (
        x > TROPHY_INK.x0 - TROPHY_CLEAR &&
        x < TROPHY_INK.x1 + TROPHY_CLEAR &&
        y > TROPHY_INK.y0 - TROPHY_CLEAR &&
        y < TROPHY_INK.y1 + TROPHY_CLEAR
      ) {
        continue;
      }
      // the provenance line's lane, under the base
      if (Math.abs(x - TROPHY.x) < LANE_CLEAR && y > TROPHY.y) continue;
      const nx = (x - TROPHY.x) / ANN_RX;
      const ny = (y - TROPHY.y) / ANN_RY;
      const rho = Math.hypot(nx, ny);
      const edge = 1 + wobble(Math.atan2(ny, nx) * WOBBLE_R, 4.1) * 0.05;
      const f = feather((edge - rho) / ANN_FEATHER, 1);
      // A crowd that has REACHED something is densest against it and thins
      // outward. The rim feather alone gives a uniform disc with a soft edge,
      // which reads as a drawn field; this thins the lattice continuously from
      // the trophy out, so the mass is on the objective and the halo dissolves.
      if (hash(i, 71) >= f * (1 - ANN_THIN * clamp01(rho / edge))) continue;
      out.push({
        x,
        y,
        r:
          (0.85 + 0.35 * hash(i, 13)) *
          (0.72 + 0.28 * f) *
          (1 + (hash(i, 27) - 0.5) * 2 * R_SPREAD),
        depth: clamp01(rho / edge + (hash(i, 23) - 0.5) * DEPTH_JITTER),
      });
    }
  }
  // Bottom and sides first, top last — hashed hard enough that the boundary
  // between "filled" and "not yet" is never a drawn line.
  return out.sort(
    (a, b) =>
      -a.y - 0.3 * Math.abs(a.x - TROPHY.x) + 26 * hash(a.x, 5) -
      (-b.y - 0.3 * Math.abs(b.x - TROPHY.x) + 26 * hash(b.x, 5)),
  );
})();

const N = Math.min(130, SRC_SEATS.length - 20, ANN_SEATS.length - 22);

// WHICH ANNULUS SEATS ARE OCCUPIED. Taking the first N in fill order would
// leave every vacancy at the TOP — the crowd would fill from the bottom and
// then simply stop, with a bald patch over the trophy's cup for the whole tail.
// The vacancies are blue noise instead, as in cut 2: the highest-hashed seat
// that has no empty neighbour yet, over and over, so every gap is a single hole
// with dots all round it and the mill always has somewhere to hop. What is left
// is the occupied set, still in fill order — bottom and sides first, top last.
const ANN_USED: number[] = (() => {
  const empty = new Uint8Array(ANN_SEATS.length);
  const want = ANN_SEATS.length - N;
  const order = ANN_SEATS.map((_, i) => i).sort((a, b) => hash(b, 77) - hash(a, 77));
  const near = (a: number, b: number) =>
    Math.hypot(ANN_SEATS[a].x - ANN_SEATS[b].x, ANN_SEATS[a].y - ANN_SEATS[b].y) <
    ANN_STEP_X * 1.5;
  let dropped = 0;
  for (let pass = 0; pass < 2 && dropped < want; pass++) {
    for (const i of order) {
      if (dropped >= want) break;
      if (empty[i]) continue;
      if (pass === 0 && order.some((j) => empty[j] && near(i, j))) continue;
      empty[i] = 1;
      dropped++;
    }
  }
  return ANN_SEATS.map((_, i) => i).filter((i) => !empty[i]);
})();

// The ladder's split has to be a fraction of the CROWD, not of a radius: the
// two seat fields are different shapes, so the same raw threshold would put a
// different fraction of each on the back rung. Each seat's `depth` is replaced
// by its percentile among the seats that are actually occupied, so DEPTH_CUT
// 0.6 means "the outer 40%" in both.
const rankDepths = (seats: Seat[], which: number[]) => {
  const idx = which.slice().sort((a, b) => seats[a].depth - seats[b].depth);
  idx.forEach((i, r) => {
    seats[i].depth = r / Math.max(1, which.length - 1);
  });
};
rankDepths(
  SRC_SEATS,
  SRC_SEATS.map((_, i) => i),
);
rankDepths(ANN_SEATS, ANN_USED);

// ---------------------------------------------------------------------------
// THE FRAMING. The ink the resolved frame has to hold: the annulus' top rim
// down to the person's feet. Measured off the seats, not typed, so a change to
// the crowd re-solves the camera instead of quietly breaking the band.
// ---------------------------------------------------------------------------
const CONTENT_TOP = Math.min(
  ...ANN_USED.map((i) => ANN_SEATS[i].y - DOT_R * ANN_SEATS[i].r),
  TROPHY_INK.y0 - GLYPH_STROKE_WORLD / 2,
);
const CONTENT_BOTTOM = FOOT_Y;
const CONTENT_C = (CONTENT_TOP + CONTENT_BOTTOM) / 2;

// The c-track's last key, solved so the DAMPED camera puts CONTENT_C on screen
// y 835 at f113 — sway included, because the render adds it.
const cyAtLast = (cEnd: number) => {
  const t = trackOf(segsFor(K_END, cEnd));
  return runCamera(LAST, t.F, t.CY, t.K).cy + sway(LAST).dy;
};
const C_END = (() => {
  const want = CONTENT_C + CAM_LIFT / K_REST; // screen 960 - 125 = 835
  const a = 500;
  const b = 900;
  const fa = cyAtLast(a);
  const fb = cyAtLast(b);
  return a + ((want - fa) * (b - a)) / (fb - fa);
})();

const CAM = trackOf(segsFor(K_END, C_END));

// The resolved camera, per frame. The flights below are capped in SCREEN px and
// the camera is the only thing that knows how big a world px is — and how fast
// the world itself is moving under them.
const CAM_AT_F: { cy: number; k: number }[] = (() => {
  const out: { cy: number; k: number }[] = [];
  for (let f = 0; f <= DURATION; f++) {
    const c = runCamera(f, CAM.F, CAM.CY, CAM.K);
    out.push({ cy: c.cy + sway(f).dy, k: c.k });
  }
  return out;
})();
const screenAt = (f: number, wx: number, wy: number) => {
  const c = CAM_AT_F[Math.max(0, Math.min(DURATION, Math.round(f)))];
  return [CX + (wx - (CX + sway(f).dx)) * c.k, 960 + (wy - c.cy) * c.k];
};

// ---------------------------------------------------------------------------
// THE LEAN. Up to 12 world px up and inward over f10-28, hashed starts,
// weighted so the dots nearest the trophy lean most — the blob's top edge
// bulges up behind the person's shoulders.
// ---------------------------------------------------------------------------
const LEAN_PX = 12;
const LEAN_DUR = 14;
const LEAN_F0 = 10;

// ---------------------------------------------------------------------------
// THE FLIGHTS. One schedule; the lane closes continuously on top of it.
// ---------------------------------------------------------------------------
const LAUNCH_F0 = 26; // seven frames before "achieving"
const LAUNCH_F1 = 66; // the last dot leaves, on "the"
const LANE_F0 = 44; // the lane starts closing, five frames before "or"
const LANE_F1 = 58; // and is closed three frames after "optimizing"
const SPEED_WIDE = 18; // world px/frame at mix 0
const SPEED_LANE = 27; // world px/frame at mix 1 — 50% faster, on a shorter path
const SEAT_DUR = 6; // deep -> ripe as a dot seats
const NEIGHBOUR_R = 18; // world px: who counts as a neighbour for the unison rule
const MIN_NEIGHBOUR_GAP = 2.0; // frames
const HEAD_CAP_SCREEN = 43; // the set's ceiling is 45; 43 leaves the mill its share
const LAND_BY = 97; // every dot is seated before the pull-back is at speed
const AVOID = 26; // samples per flight, for the two clearance tests

// A flight is a CUBIC, because it has two jobs: get past the person's head on
// its own side, and come into its seat from outside the trophy. P1 is the waist
// beside the head — wide and individual at mix 0, a narrow common lane at mix 1
// — and P2 is the approach, pushed outward and downward the higher the seat is,
// so a dot bound for the top of the annulus goes AROUND the objective.
const WAIST_Y = PERSON.y - 30;
const WAIST_WIDE = [100, 165]; // world px either side of the axis, hashed
const WAIST_LANE = [78, 92]; // ...and what the closed lane leaves of it
const APPR_WIDE = 45;
const APPR_LANE = 22;
const APPR_TOP = 130; // extra swing for a seat above the trophy's waist
const APPR_DROP = [120, 90]; // how far below its seat a flight comes in from

type Dot = {
  src: number;
  dst: number;
  launch: number;
  land: number;
  sx: number; // the leaned launch point
  sy: number;
  p1x: number;
  p1y: number;
  p2x: number;
  p2y: number;
  lean: number;
  leanAt: number;
};

/** The cubic a dot flies, in world px. */
export const flightPoint = (d: Dot, D: Seat, u: number) => {
  const v = 1 - u;
  const a = v * v * v;
  const b = 3 * v * v * u;
  const c = 3 * v * u * u;
  const e = u * u * u;
  return [
    a * d.sx + b * d.p1x + c * d.p2x + e * D.x,
    a * d.sy + b * d.p1y + c * d.p2y + e * D.y,
  ];
};

const FLIGHT_STATS = { pushes: 0, headHits: 0, trophyHits: 0, peakHead: 0 };

const DOTS: Dot[] = (() => {
  // which seats the crowd occupies: hashed, so the vacancies the mill hops into
  // are scattered through the blob rather than ringed around its edge
  const order = SRC_SEATS.map((_, i) => i).sort((a, b) => hash(a, 81) - hash(b, 81));
  const taken = order.slice(0, N);

  const dTrophy = (i: number) =>
    Math.hypot(SRC_SEATS[i].x - TROPHY.x, SRC_SEATS[i].y - TROPHY.y);
  const dMin = Math.min(...taken.map(dTrophy));
  const dMax = Math.max(...taken.map(dTrophy));
  const norm = (i: number) => (dTrophy(i) - dMin) / Math.max(1, dMax - dMin);

  // The FAR side of the blob goes first, hashed hard enough that it reads as a
  // crowd surging rather than as a wipe. It is a timing rule as much as a
  // framing one: the far dots have the longest flights, so sending them first
  // makes the landings arrive in a steady stream from f62 rather than in a
  // clump, and the blob contracts up and inward as it empties.
  const key = (i: number) => 0.44 * hash(i, 3) - 0.56 * norm(i);
  const seq = taken.slice().sort((a, b) => key(a) - key(b));

  // The rate: 130 dots over f26-66, very slightly ramping (exponent 0.95).
  const times: number[] = seq.map(
    (_, i) =>
      LAUNCH_F0 + (LAUNCH_F1 - LAUNCH_F0) * Math.pow(i / Math.max(1, N - 1), 0.95),
  );

  // NO UNISON, the launch end. `times` is fixed to the schedule index, so the
  // repair permutes WHICH dot holds which index — the rate curve is untouched.
  const seatNb: number[][] = taken.map((a) =>
    taken.filter(
      (b) =>
        b !== a &&
        Math.hypot(SRC_SEATS[a].x - SRC_SEATS[b].x, SRC_SEATS[a].y - SRC_SEATS[b].y) <=
          NEIGHBOUR_R,
    ),
  );
  const nbOf = new Map<number, number[]>();
  taken.forEach((a, i) => nbOf.set(a, seatNb[i]));
  const at = new Map<number, number>();
  seq.forEach((seat, i) => at.set(seat, i));
  const wouldBad = (i: number, seat: number) =>
    (nbOf.get(seat) ?? []).some((nb) => {
      const j = at.get(nb);
      return j !== undefined && j !== i && Math.abs(times[j] - times[i]) < MIN_NEIGHBOUR_GAP;
    });
  for (let sweep = 0; sweep < 400; sweep++) {
    let fixed = 0;
    for (let i = 0; i < N; i++) {
      if (!wouldBad(i, seq[i])) continue;
      for (let t = 1; t < N; t++) {
        const q = (i + t * 37) % N;
        if (q === i) continue;
        const a = seq[i];
        const b = seq[q];
        if (wouldBad(i, b) || wouldBad(q, a)) continue;
        seq[i] = b;
        seq[q] = a;
        at.set(b, i);
        at.set(a, q);
        fixed++;
        break;
      }
    }
    if (fixed === 0) break;
  }

  // The two clearance tests a flight has to pass.
  //   * the HEAD: the stream splits either side of the person. The test is on
  //     his head and shoulders — the top 45% of the glyph box — because below
  //     that a dot is inside the crowd and behind him, and the glyph is drawn
  //     over the dots, so a dot down there is simply occluded.
  //   * the OBJECTIVE: no flight crosses the trophy's ink box. A dot never
  //     passes over a stroke, and it never seats on one either.
  // Measured off person.png once: the upper 45% of the glyph — the head and
  // shoulders, which is what the stream has to split around — is only 0.2012 of
  // the box wide either side of the axis. (The silhouette's full 0.84 width is
  // its arms and legs, and those are down inside the crowd where a dot is
  // behind him anyway.)
  const HEAD_Y1 = PERSON_BOX.y0 + 0.45 * GLYPH;
  const HEAD_CLEAR = 0.2012 * GLYPH + 10 + DOT_R;
  const TROPHY_PAD = 6 + DOT_R;
  const hitsHead = (x: number, y: number) =>
    y > PERSON_BOX.y0 - 6 && y < HEAD_Y1 && Math.abs(x - CX) < HEAD_CLEAR;
  const hitsTrophy = (x: number, y: number) =>
    x > TROPHY_INK.x0 - TROPHY_PAD &&
    x < TROPHY_INK.x1 + TROPHY_PAD &&
    y > TROPHY_INK.y0 - TROPHY_PAD &&
    y < TROPHY_INK.y1 + TROPHY_PAD;

  // WHICH SEAT A DOT IS FOR. The annulus is already in fill order (bottom and
  // sides first, top last); the dots are in launch order. Pairing them straight
  // off sends a dot that went up the RIGHT of the person's head to a seat on the
  // LEFT of the trophy, which is a whipping S across the frame and the fastest
  // heads in the piece. So the seats are dealt from two queues — left and right
  // — and a dot takes the next one in fill order on its OWN side, falling back
  // to the other queue only when its side is exhausted. The fill order is
  // untouched: each queue is still in it.
  // The two queues are BALANCED to the seats before anything is dealt: the
  // left queue is exactly as long as the number of dots that will go left. The
  // dots nearest the column axis are the ones whose side is decided by the
  // balance rather than by where they stand, so the only dots that ever cross
  // the axis are the ones already on it — and a crossing is a few px, not a
  // sweep across the frame. (Dealing by the dot's own side and falling back
  // when a queue empties was tried first: the fallbacks all land at the END of
  // the piece, and a late dot sent to a top seat on the far side has the
  // fastest head in the cut by 40%.)
  const qL: number[] = [];
  const qR: number[] = [];
  ANN_USED.forEach((j) => (ANN_SEATS[j].x >= TROPHY.x ? qR : qL).push(j));
  const SIDE_OF = new Map<number, number>();
  seq
    .slice()
    .sort((a, b) => SRC_SEATS[a].x - SRC_SEATS[b].x)
    .forEach((s, rank) => SIDE_OF.set(s, rank < qL.length ? -1 : 1));
  const sideOf = (s: number) => SIDE_OF.get(s) ?? 1;
  const DST_OF: number[] = [];
  let iL = 0;
  let iR = 0;
  seq.forEach((s) => {
    DST_OF.push(sideOf(s) > 0 ? qR[iR++] : qL[iL++]);
  });

  const list = seq.map((s, i) => {
    // The lane closes CONTINUOUSLY: `mix` is 0 for a dot that leaves before
    // LANE_F0 and 1 for one that leaves after LANE_F1, and everything about the
    // flight — its control point, its bow, its speed — is that one number.
    const mix = smoothstep((times[i] - LANE_F0) / (LANE_F1 - LANE_F0));
    const S = SRC_SEATS[s];
    const dstIdx = DST_OF[i];
    const D = ANN_SEATS[dstIdx];
    // Which side of the person's head this dot goes up: its own side of the
    // crowd, hashed near the axis so the two lanes are not a hard split.
    const side = sideOf(s);
    const lean = clamp01(1 - norm(s) * 0.85);
    const ang = Math.atan2(TROPHY.y - S.y, TROPHY.x - S.x);
    const sx = S.x + Math.cos(ang) * LEAN_PX * lean;
    const sy = S.y + Math.sin(ang) * LEAN_PX * lean;

    // the waist beside his head: wide and individual, closing to a common lane
    const wWide = WAIST_WIDE[0] + hash(s, 36) * (WAIST_WIDE[1] - WAIST_WIDE[0]);
    const wLane = WAIST_LANE[0] + hash(s, 37) * (WAIST_LANE[1] - WAIST_LANE[0]);
    // A dot whose seat is on the OTHER side of the axis from its own place in
    // the crowd (the hashed side rule puts the dots near the axis on either
    // lane) crosses LOW, at his knees, where he is in front of them — never
    // across his head.
    const crossing = Math.sign(S.x - CX) !== side;
    // The two lanes are NOT mirror images. Symmetric waists turn the whole
    // stream into one closed oval on the frames where the crowd is half away —
    // a drawn ring rather than a surge — so the left lane runs 0.84 of the
    // waist and the right 1.14, and the two sides cross the head at different
    // heights. The stream is lopsided, which is what a crowd looks like.
    const lane = side < 0 ? 0.84 : 1.14;
    const p1 = {
      x: CX + side * lane * (wWide + (wLane - wWide) * mix),
      y: crossing
        ? PERSON.y + 28 + (hash(s, 38) - 0.5) * 20
        : WAIST_Y - side * 26 + (hash(s, 38) - 0.5) * 80 * (1 - 0.55 * mix),
    };
    // the approach: outward and from below, and further around the higher the
    // seat is, so a dot bound for the top of the annulus goes around the glyph
    const topness = clamp01((TROPHY.y + 10 - D.y) / ANN_RY);
    const p2 = {
      x:
        D.x +
        side * (APPR_WIDE + (APPR_LANE - APPR_WIDE) * mix + APPR_TOP * topness),
      y: D.y + APPR_DROP[0] + (APPR_DROP[1] - APPR_DROP[0]) * mix + 80 * topness,
    };

    const sample = (t: number) => {
      const v = 1 - t;
      const a = v * v * v;
      const b = 3 * v * v * t;
      const c = 3 * v * t * t;
      const e = t * t * t;
      return [
        a * sx + b * p1.x + c * p2.x + e * D.x,
        a * sy + b * p1.y + c * p2.y + e * D.y,
      ];
    };
    // Enforced, not hoped for: the two controls are pushed outward on the dot's
    // own side until no sample of the cubic is inside either exclusion.
    // A dot that STARTS behind him (the crowd is behind his lower half, and the
    // glyph is drawn over the dots) is allowed to be inside the head region on
    // its first frames — it is occluded there — as long as it is out by 35% of
    // its path and never comes back.
    const clash = () => {
      let head = false;
      let troph = false;
      let exited = !hitsHead(sx, sy);
      for (let t = 1; t < AVOID; t++) {
        const u = t / AVOID;
        const p = sample(u);
        const inHead = hitsHead(p[0], p[1]);
        if (!exited) {
          if (!inHead) exited = true;
          else if (u > 0.35) head = true;
        } else if (inHead) {
          head = true;
        }
        if (hitsTrophy(p[0], p[1])) troph = true;
      }
      return { head, troph };
    };
    for (let g = 0; g < 30; g++) {
      const c = clash();
      if (!c.head && !c.troph) break;
      if (c.head) p1.x += side * 10;
      if (c.troph) p2.x += side * 12;
      FLIGHT_STATS.pushes++;
    }
    const left = clash();
    if (left.head) FLIGHT_STATS.headHits++;
    if (left.troph) FLIGHT_STATS.trophyHits++;

    // path length of the cubic, so the flight is speed-authored
    let len = 0;
    let px = sx;
    let py = sy;
    for (let t = 1; t <= 20; t++) {
      const p = sample(t / 20);
      len += Math.hypot(p[0] - px, p[1] - py);
      px = p[0];
      py = p[1];
    }

    // Speed-authored, then SCREEN-speed capped WITH THE CAMERA MOVING: the head
    // is measured where it actually is on the frame, so the long glide up — which
    // carries the whole world down the screen under the stream — is part of the
    // budget. The duration is lengthened a frame at a time until the peak is
    // inside the cap.
    const headAt = (f: number, fl: number) => {
      const u = arriveEase(clamp01((f - times[i]) / fl));
      const p = sample(u);
      return screenAt(f, p[0], p[1]);
    };
    const peak = (fl: number) => {
      let mx = 0;
      for (let f = Math.ceil(times[i]) + 1; f <= times[i] + fl; f++) {
        const a = headAt(f - 1, fl);
        const b = headAt(f, fl);
        mx = Math.max(mx, Math.hypot(b[0] - a[0], b[1] - a[1]));
      }
      return mx;
    };
    // a hashed +-1.6 frames, so two dots that leave together do not land together
    let flight = Math.max(
      10,
      len / (SPEED_WIDE + (SPEED_LANE - SPEED_WIDE) * mix) + (hash(s, 39) - 0.5) * 3.2,
    );
    // The lengthening is bounded, and not only by patience: past LAND_BY a
    // flight is landing inside the pull-back, where the camera itself is moving
    // 20 screen px/frame and a dot near the top of the frame gains speed from
    // the zoom as well — so stretching such a flight to slow its head down
    // makes it faster, not slower. Bounding the landing breaks that runaway.
    const maxFlight = Math.max(12, Math.min(48, LAND_BY - times[i]));
    while (flight < maxFlight && peak(flight) > HEAD_CAP_SCREEN) flight += 1;
    FLIGHT_STATS.peakHead = Math.max(FLIGHT_STATS.peakHead, peak(flight));

    return {
      src: s,
      dst: dstIdx,
      launch: times[i],
      land: times[i] + flight,
      sx,
      sy,
      p1x: p1.x,
      p1y: p1.y,
      p2x: p2.x,
      p2y: p2.y,
      lean,
      leanAt: LEAN_F0 + hash(s, 44) * 6,
    };
  });

  // NO UNISON, the landing end. Two dots on neighbouring SEATS must not settle
  // on the same frame. Landings are pushed later (never earlier, so the speed
  // cap above still holds) in 1.1 frame steps.
  for (let pass = 0; pass < 16; pass++) {
    let fixed = 0;
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const A = ANN_SEATS[list[i].dst];
        const B = ANN_SEATS[list[j].dst];
        if (Math.hypot(A.x - B.x, A.y - B.y) > 14) continue;
        if (Math.abs(list[i].land - list[j].land) >= 2) continue;
        const later = list[i].land >= list[j].land ? i : j;
        list[later].land += 1.1;
        fixed++;
      }
    }
    if (fixed === 0) break;
  }
  return list;
})();

// The trophy's white -> deep conversion starts when the crowd has actually
// REACHED it, which is the tenth dot down rather than the single first: one dot
// touching down is not the AIs arriving, and keying the conversion to a
// straggler makes the objective start changing before anything has visibly
// gathered. DEEP_AT is measured off the landings, so retiming the flights
// retimes the conversion with them.
const LAND_SORTED = DOTS.map((d) => d.land).sort((a, b) => a - b);
const DEEP_AT = LAND_SORTED[9];

// ---------------------------------------------------------------------------
// THE MILL. One simulation over both seat systems: the source crowd from f0
// until it empties, and the annulus from the first landing to the last frame.
// A dot only hops to a VACANT neighbouring seat and never starts a hop it would
// still be inside when it launches, so a launch always comes off a real seat.
// ---------------------------------------------------------------------------
const MILL_DUR = 11;
const MILL_RATE_SRC = 2.1;
const MILL_RATE_DST = 1.8;
const HOP_REACH_SRC = 30;
const HOP_REACH_DST = 17;

type Hop = { from: number; to: number; t0: number; dst: boolean };

const neighbours = (seats: Seat[], reach: number) =>
  seats.map((a, i) =>
    seats
      .map((b, j) => ({ b, j }))
      .filter(({ b, j }) => j !== i && Math.hypot(b.x - a.x, b.y - a.y) <= reach)
      .map(({ j }) => j),
  );
const NB_SRC = neighbours(SRC_SEATS, HOP_REACH_SRC);
const NB_DST = neighbours(ANN_SEATS, HOP_REACH_DST);

const HOPS: Hop[][] = DOTS.map(() => []);
const LAUNCH_SEAT: number[] = DOTS.map((d) => d.src);
(() => {
  const srcOcc = new Int32Array(SRC_SEATS.length).fill(-1);
  const dstOcc = new Int32Array(ANN_SEATS.length).fill(-1);
  const seatSrc = DOTS.map((d) => d.src);
  const seatDst = DOTS.map((d) => d.dst);
  DOTS.forEach((d, i) => {
    srcOcc[d.src] = i;
  });
  const busy = new Float64Array(N).fill(-1);
  let accS = 0;
  let accD = 0;
  let id = 0;
  for (let f = 0; f <= DURATION; f++) {
    DOTS.forEach((d, i) => {
      if (f >= d.launch && f - 1 < d.launch) {
        LAUNCH_SEAT[i] = seatSrc[i];
        srcOcc[seatSrc[i]] = -1;
      }
      if (f >= d.land && f - 1 < d.land) dstOcc[seatDst[i]] = i;
    });

    const run = (
      rate: number,
      acc: number,
      occ: Int32Array,
      nb: number[][],
      seatOf: number[],
      isDst: boolean,
    ) => {
      acc += rate;
      while (acc >= 1) {
        acc -= 1;
        const jj = id++;
        const start = Math.floor(hash(jj, 51) * N);
        let pick = -1;
        let free: number[] = [];
        for (let t = 0; t < N; t++) {
          const c = (start + t) % N;
          const inSrc = f < DOTS[c].launch;
          const inDst = f >= DOTS[c].land + 1;
          if (isDst ? !inDst : !inSrc) continue;
          if (busy[c] > f) continue;
          if (!isDst && DOTS[c].launch < f + MILL_DUR) continue;
          const cand = nb[seatOf[c]].filter((q) => occ[q] < 0);
          if (cand.length === 0) continue;
          pick = c;
          free = cand;
          break;
        }
        if (pick < 0) break;
        const from = seatOf[pick];
        const to = free[Math.floor(hash(jj, 52) * free.length) % free.length];
        occ[from] = -1;
        occ[to] = pick;
        seatOf[pick] = to;
        busy[pick] = f + MILL_DUR;
        HOPS[pick].push({ from, to, t0: f, dst: isDst });
      }
      return acc;
    };

    accS = run(MILL_RATE_SRC, accS, srcOcc, NB_SRC, seatSrc, false);
    accD = run(MILL_RATE_DST, accD, dstOcc, NB_DST, seatDst, true);
  }
})();

// ---------------------------------------------------------------------------
// DARK TRAFFIC, at the house rate: idle accent threads between neighbouring
// dots at 0.12, no heads. Thins to 60% across the tail.
// ---------------------------------------------------------------------------
const TRAFFIC_N = idleThreads(N);
const TRAFFIC_REACH = 60;

// THE MICRO-DRIFT. Two hashed sines per axis, +-3 world px, never in unison.
const micro = (i: number, f: number) => ({
  dx:
    1.8 * Math.sin(f * 0.2417 + hash(i, 17) * 6.283) +
    1.2 * Math.sin(f * 0.1533 + hash(i, 19) * 6.283),
  dy:
    1.7 * Math.sin(f * 0.2094 + hash(i, 18) * 6.283) +
    1.3 * Math.sin(f * 0.1396 + hash(i, 20) * 6.283),
});

// ---------------------------------------------------------------------------

const OptimizingTheObjective: React.FC<Props> = ({
  ink,
  accent,
  accentDeep,
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
  dotOpacity,
  personSrc,
  beats,
}) => {
  const frame = useCurrentFrame();
  const toDeep = makeTone(ink, accentDeep); // white -> the AIs are on it
  const toRipe = makeTone(accentDeep, accent); // -> and it is achieved

  // -- camera ----------------------------------------------------------------
  const cam = runCamera(frame, CAM.F, CAM.CY, CAM.K);
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = CX + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);

  // -- the objective's two conversions ---------------------------------------
  const deepT = clamp01((frame - DEEP_AT) / DEEP_DUR);
  const ripeT = clamp01((frame - RIPE_F0) / RIPE_DUR);
  const trophyColour = ripeT > 0 ? toRipe(smoothstep(ripeT)) : toDeep(smoothstep(deepT));

  // -- the dots --------------------------------------------------------------
  const seatPos = (seats: Seat[], i: number, dst: boolean) => {
    const hs = HOPS[i].filter((h) => h.dst === dst);
    let cur = dst ? DOTS[i].dst : DOTS[i].src;
    let live: Hop | null = null;
    for (const h of hs) {
      if (frame >= h.t0 + MILL_DUR) cur = h.to;
      else if (frame >= h.t0) {
        live = h;
        break;
      } else break;
    }
    if (live) {
      const u = clamp01((frame - live.t0) / MILL_DUR);
      const e = arriveEase(u);
      const A = seats[live.from];
      const B = seats[live.to];
      const dx = B.x - A.x;
      const dy = B.y - A.y;
      const L = Math.hypot(dx, dy) || 1;
      const bow = Math.sin(Math.PI * e) * (hash(i, 61) - 0.5) * 7;
      return {
        x: A.x + dx * e + (-dy / L) * bow,
        y: A.y + dy * e + (dx / L) * bow,
        moving: clamp01(Math.min(u, 1 - u) / 0.2),
      };
    }
    return { x: seats[cur].x, y: seats[cur].y, moving: 0 };
  };

  const dots = DOTS.map((d, i) => {
    const flying = frame >= d.launch && frame < d.land;
    const landed = frame >= d.land;

    let x: number;
    let y: number;
    let moving = 0;
    let depthT: number;

    if (!flying && !landed) {
      // waiting, and leaning toward the objective
      const p = seatPos(SRC_SEATS, i, false);
      const leanU = smoothstep((frame - d.leanAt) / LEAN_DUR);
      const ang = Math.atan2(TROPHY.y - p.y, TROPHY.x - p.x);
      const amt = LEAN_PX * d.lean * leanU;
      x = p.x + Math.cos(ang) * amt;
      y = p.y + Math.sin(ang) * amt;
      moving = p.moving;
      depthT = 0;
    } else if (landed) {
      const p = seatPos(ANN_SEATS, i, true);
      x = p.x;
      y = p.y;
      moving = p.moving;
      depthT = 1;
    } else {
      // The mill may have moved the dot off its designed launch seat, so the
      // cubic is rigidly translated onto the seat it actually left from.
      const S = SRC_SEATS[LAUNCH_SEAT[i]];
      const ox = S.x - SRC_SEATS[d.src].x;
      const oy = S.y - SRC_SEATS[d.src].y;
      const u = arriveEase(clamp01((frame - d.launch) / (d.land - d.launch)));
      const p = flightPoint(d, ANN_SEATS[d.dst], u);
      const back = 1 - smoothstep(clamp01(u / 0.45)); // the offset eases out
      x = p[0] + ox * back;
      y = p[1] + oy * back;
      moving = clamp01(Math.min(u, 1 - u) / 0.18);
      depthT = smoothstep(u);
    }

    // the ladder follows the dot from the crowd to the annulus
    const backA = SRC_SEATS[d.src].depth > DEPTH_CUT;
    const backB = ANN_SEATS[d.dst].depth > DEPTH_CUT;
    const a0 = backA ? OP_BG : OP_FG;
    const a1 = backB ? OP_BG : OP_FG;
    const r0 = backA ? BG_R_SCALE : 1;
    const r1 = backB ? BG_R_SCALE : 1;
    const m0 = backA ? BG_DRIFT : 1;
    const m1 = backB ? BG_DRIFT : 1;
    const seatR =
      SRC_SEATS[d.src].r + (ANN_SEATS[d.dst].r - SRC_SEATS[d.src].r) * depthT;

    const md = micro(i, frame);
    const dm = m0 + (m1 - m0) * depthT;
    return {
      x: x + md.dx * dm,
      y: y + md.dy * dm,
      r: seatR * (r0 + (r1 - r0) * depthT),
      op: a0 + (a1 - a0) * depthT,
      back: (backA ? 1 : 0) + ((backB ? 1 : 0) - (backA ? 1 : 0)) * depthT > 0.5,
      moving,
      ripe: clamp01((frame - d.land) / SEAT_DUR),
      landed,
    };
  });

  // -- dark traffic ----------------------------------------------------------
  type Th = { key: string; x1: number; y1: number; x2: number; y2: number; op: number };
  const traffic: Th[] = [];
  const trafficCount = Math.round(TRAFFIC_N * (frame < beats.end ? 1 : 0.6));
  for (let j = 0; j < trafficCount; j++) {
    const period = 40 - 12 * hash(j, 4);
    const local = frame + hash(j, 5) * period;
    const cycle = Math.floor(local / period);
    const phase = (local - cycle * period) / period;
    const seed = j * 131 + cycle * 7;
    const a = Math.floor(hash(seed, 6) * N);
    const A = dots[a];
    if (!A) continue;
    let b = -1;
    for (let n = 0; n < 12; n++) {
      const cnd = Math.floor(hash(seed + n * 17, 8) * N);
      const C = dots[cnd];
      if (cnd === a || !C) continue;
      if (C.landed !== A.landed) continue;
      if (Math.hypot(C.x - A.x, C.y - A.y) <= TRAFFIC_REACH) {
        b = cnd;
        break;
      }
    }
    if (b < 0) continue;
    const B = dots[b];
    const dn = arriveEase(clamp01(phase / 0.35));
    const fade = interpolate(phase, [0.6, 1], [1, 0], clamp);
    if (fade <= 0.02) continue;
    traffic.push({
      key: `d${j}`,
      x1: A.x,
      y1: A.y,
      x2: A.x + (B.x - A.x) * dn,
      y2: A.y + (B.y - A.y) * dn,
      op: DARK_TRAFFIC_OPACITY * fade,
    });
  }

  // -- the objective's idle --------------------------------------------------
  const tIdle = trophyIdle(frame);

  // -- the provenance line ---------------------------------------------------
  const claimFrom = { x: CX, y: HEAD_TOP_Y };
  const claimTo = { x: TROPHY.x + tIdle.dx, y: TROPHY_BASE_Y + tIdle.dy };
  const claim = arriveEase(clamp01((frame - CLAIM_F0) / (CLAIM_F1 - CLAIM_F0)));
  const claimHead = {
    x: claimFrom.x + (claimTo.x - claimFrom.x) * claim,
    y: claimFrom.y + (claimTo.y - claimFrom.y) * claim,
  };
  const packetAt = (f: number) => {
    if (f < PACKET_F0) return null;
    const p = packetsOn({
      frame: f,
      k,
      from: claimFrom,
      to: claimTo,
      period: 12,
      phase: PACKET_F0,
      speed: 16,
      opacity: 1,
      seed: 3,
    });
    return p.length === 0 ? null : p[0];
  };

  // -- the person ------------------------------------------------------------
  const swayX = (1.5 / k) * Math.sin(frame * 0.083 + 0.9);
  const swayY = (1.2 / k) * Math.sin(frame * 0.061 + 2.4);
  const lift = 4 * smoothstep((frame - WAKE_F0) / (WAKE_F1 - WAKE_F0));

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <GridBackground
        src={backgroundSrc}
        blur={backgroundBlur}
        dim={backgroundDim}
        frame={frame}
        cy={cy}
        cyRest={CAM.CY[0]}
        cx={cx}
        cxRest={CX}
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
          <svg
            width={WORLD_W}
            height={WORLD_H}
            viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          >
            {/* dark traffic: the crowd is unlooked-at, not dead. No heads. */}
            {traffic.map((t) => (
              <line
                key={t.key}
                x1={t.x1}
                y1={t.y1}
                x2={t.x2}
                y2={t.y2}
                stroke={accent}
                strokeWidth={DARK_TRAFFIC_STROKE}
                strokeLinecap="round"
                opacity={t.op}
              />
            ))}

            {/* the AIs, on the depth ladder: the back of the crowd first and
                dimmer, then its core over the top. Tone means state; only
                opacity and size say how far back a dot is. */}
            {[true, false].map((backPass) =>
              dots.map((d, i) =>
                d.back !== backPass ? null : (
                  <circle
                    key={`${backPass ? "b" : "c"}${i}`}
                    cx={d.x}
                    cy={d.y}
                    r={DOT_R * d.r * breath(frame, hash(i, 9)) * (1 + 0.22 * d.moving)}
                    fill={toRipe(d.ripe)}
                    opacity={dotOpacity * d.op}
                  />
                ),
              ),
            )}

            {/* the provenance: his head to the objective's base. A claim is a
                container, so it sits one rung back from the things it joins. */}
            {claim > 0 ? (
              <g style={{ filter: icon }}>
                <line
                  x1={claimFrom.x}
                  y1={claimFrom.y}
                  x2={claimHead.x}
                  y2={claimHead.y}
                  stroke={ink}
                  strokeWidth={LINE_STROKE}
                  strokeLinecap="round"
                  opacity={OP_MID}
                />
                {claim < 1 ? (
                  <circle cx={claimHead.x} cy={claimHead.y} r={4.5 / k} fill={ink} opacity={OP_FG} />
                ) : null}
              </g>
            ) : null}

            {/* the objective. White until the AIs reach it, deep as they seat,
                ripe on the word. Same paths, same stroke convention as cut 2. */}
            <g
              style={{ filter: icon }}
              fill="none"
              stroke={trophyColour}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={OP_FG}
            >
              <g transform={`translate(${tIdle.dx.toFixed(3)} ${tIdle.dy.toFixed(3)})`}>
                <g transform={TROPHY_TX} strokeWidth={GLYPH_STROKE_WORLD / TR_S}>
                  {TROPHY_D.map((d) => (
                    <path key={d} d={d} />
                  ))}
                </g>
              </g>
            </g>

            {/* signal on the landed claim */}
            {claim >= 1 ? <Packet frame={frame} k={k} at={packetAt} opacity={0.6} /> : null}
          </svg>

          {/* the person: white, over his own crowd, with the small shadow that
              makes a glyph read as a thing standing on the field. Sways, and
              lifts before he acts. */}
          <Img
            src={staticFile(personSrc)}
            style={{
              position: "absolute",
              left: PERSON.x - GLYPH / 2 + swayX,
              top: PERSON.y - GLYPH / 2 + swayY - lift / k,
              width: GLYPH,
              height: GLYPH,
              filter: `brightness(0) invert(1) ${icon}`,
              opacity: OP_FG,
            }}
          />
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default OptimizingTheObjective;

// Referenced so the beats object is a real contract and not decoration.
export const BEAT_CHECK = {
  like: defaultProps.beats.like,
  achieving: defaultProps.beats.achieving,
  optimizing: defaultProps.beats.optimizing,
  objective: defaultProps.beats.objective,
  defined: defaultProps.beats.defined,
  end: defaultProps.beats.end,
};
export const CAM_AT = (f: number) => runCamera(f, CAM.F, CAM.CY, CAM.K);
export const STATS = {
  kRest: Number(K_REST.toFixed(5)),
  kEnd: Number(K_END.toFixed(5)),
  cEnd: Number(C_END.toFixed(2)),
  glyph: Number(GLYPH.toFixed(3)),
  outlineWorld: Number(GLYPH_STROKE_WORLD.toFixed(3)),
  lineWorld: Number(LINE_STROKE.toFixed(3)),
  trafficWorld: Number(DARK_TRAFFIC_STROKE.toFixed(3)),
  dotR: Number(DOT_R.toFixed(3)),
  trophyGridStroke: Number((GLYPH_STROKE_WORLD / TR_S).toFixed(3)),
  contentTop: Number(CONTENT_TOP.toFixed(1)),
  contentBottom: Number(CONTENT_BOTTOM.toFixed(1)),
  contentC: Number(CONTENT_C.toFixed(1)),
  dots: N,
  srcSeats: SRC_SEATS.length,
  annSeats: ANN_SEATS.length,
  hops: HOPS.reduce((a, h) => a + h.length, 0),
  backSrc: DOTS.filter((d) => SRC_SEATS[d.src].depth > DEPTH_CUT).length,
  backAnn: DOTS.filter((d) => ANN_SEATS[d.dst].depth > DEPTH_CUT).length,
  annVacancies: ANN_SEATS.length - N,
  launchedBy: [46, 55, 66].map((f) => DOTS.filter((d) => d.launch <= f).length),
  firstLand: Number(LAND_SORTED[0].toFixed(1)),
  deepAt: Number(DEEP_AT.toFixed(1)),
  landQuartiles: [0.25, 0.5, 0.75].map((q) => {
    const a = DOTS.map((d) => d.land).sort((x, y) => x - y);
    return Number(a[Math.floor(q * (a.length - 1))].toFixed(1));
  }),
  lastLand: Number(Math.max(...DOTS.map((d) => d.land)).toFixed(1)),
  flight: [
    Number(Math.min(...DOTS.map((d) => d.land - d.launch)).toFixed(1)),
    Number(Math.max(...DOTS.map((d) => d.land - d.launch)).toFixed(1)),
  ],
  flightPushes: FLIGHT_STATS.pushes,
  flightHeadHits: FLIGHT_STATS.headHits,
  flightTrophyHits: FLIGHT_STATS.trophyHits,
  peakHeadScreen: Number(FLIGHT_STATS.peakHead.toFixed(2)),
  minLaunchGap18: (() => {
    let m = 1e9;
    for (let i = 0; i < DOTS.length; i++)
      for (let j = i + 1; j < DOTS.length; j++) {
        const A = SRC_SEATS[DOTS[i].src];
        const B = SRC_SEATS[DOTS[j].src];
        if (Math.hypot(A.x - B.x, A.y - B.y) > NEIGHBOUR_R) continue;
        m = Math.min(m, Math.abs(DOTS[i].launch - DOTS[j].launch));
      }
    return Number(m.toFixed(2));
  })(),
  minLandGap14: (() => {
    let m = 1e9;
    for (let i = 0; i < DOTS.length; i++)
      for (let j = i + 1; j < DOTS.length; j++) {
        const A = ANN_SEATS[DOTS[i].dst];
        const B = ANN_SEATS[DOTS[j].dst];
        if (Math.hypot(A.x - B.x, A.y - B.y) > 14) continue;
        m = Math.min(m, Math.abs(DOTS[i].land - DOTS[j].land));
      }
    return Number(m.toFixed(2));
  })(),
};
export const WORLD_INK = {
  trophy: TROPHY_INK,
  person: { ...PERSON_BOX, headTop: HEAD_TOP_Y },
  crowd: CROWD,
  annulus: { x: TROPHY.x, y: TROPHY.y, rx: ANN_RX, ry: ANN_RY },
  claim: { from: { x: CX, y: HEAD_TOP_Y }, to: { x: CX, y: TROPHY_BASE_Y } },
};
export const DOTS_DEBUG = DOTS.map((d, i) => ({
  i,
  src: SRC_SEATS[d.src],
  dst: ANN_SEATS[d.dst],
  launch: d.launch,
  land: d.land,
  p1: [d.p1x, d.p1y],
  p2: [d.p2x, d.p2y],
  lean: d.lean,
  leanAt: d.leanAt,
}));
