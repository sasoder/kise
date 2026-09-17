import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  BG_BASE,
  BG_DIM,
  FRAME_H,
  FRAME_W,
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
  camEase,
  clamp,
  clamp01,
  feather,
  hash,
  iconShadow,
  idleThreads,
  makeTone,
  runCamera,
  smoothstep,
  squirclePath,
  sway,
  wobble,
  worldTransform,
} from "./fieldShared";
import { DARK_TRAFFIC_OPACITY, EASE_ARRIVE, arriveEase, ease } from "./levelUp";

export const FPS = 24;

// John Charles Beren, clip `AreasHowTheModelShouldBehave`: "...areas where you
// have to figure out how the model should behave."
//
// The composition starts at SRT 50.439 s, so every beat below is
// frame = round((t - 50.439) * 24):
//
//   areas   50.439 -> f0      how      52.021 -> f38
//   where   50.897 -> f11     the      52.272 -> f44
//   you     51.187 -> f18     model    52.439 -> f48
//   have    51.312 -> f21     should   52.606 -> f52
//   to      51.480 -> f25     behave   52.814 -> f57
//   figure  51.605 -> f28     "it"     53.106 -> f64
//   out     51.813 -> f33
//
// The next word after this line ("it") lands at f64, so the speech runs 0..64
// and a 16 frame tail holds the resolved state: DURATION = 64 + 16 = 80.
export const DURATION = 80;

// ---------------------------------------------------------------------------
// THE CLIP'S RULE: people draw the shape, the orange dots fill it. THIS cut:
// there are MANY areas, each one needs its own person to decide it, and until
// they do, the dots in that area just mill.
//
// Vocabulary, Orange Dwarkesh on the grid, fixed for the clip and unchanged
// from the approved cuts (HowAssistantsShouldBehaveV3, StillDecideWhatWeWantV2):
//   an area of life  = one station ring with a Lucide OUTLINE glyph in it —
//                      heart-pulse, code, graduation-cap, scale, shield,
//                      banknote. One family (lucide-static v1.46.0, ISC),
//                      24 grid, fill none, round caps, round joins, and ONE
//                      stroke weight in WORLD px shared with the rings.
//   a person         = person.png, ink white, iconShadow, 83 world px
//   "we don't know
//    yet"            = the approved thought bubble (SubvertTheInfrastructure)
//                      with Lucide `circle-help`'s inner strokes in it, the
//                      question mark from SpeedUpAiResearch
//   the AIs          = orange dots, solid, ACCENT_DEEP at rest, ACCENT lit
//   the AIs taking   = the ring's stroke going white -> ACCENT_DEEP as its
//    an area           first dots seat. The ICON stays white: the noun is ours.
// No text, no numbers. It has to read with the sound off.
//
// SOUND-OFF READING TEST: "six different areas, each with a person who doesn't
// know yet, and the AI in each just milling about."
//
// GESTURES — one per word, nothing else.
//   1. opens CLOSE on one ring and its icon (code, the
//      top-middle unit) at k 2.0; rings breathe, the
//      camera creeps in 2 frames and that creep runs
//      STRAIGHT ON into the PULL-BACK f2-22, out to
//      k 1.34 on the whole grid and across onto the
//      picture's own centre — the other five rings are
//      already standing and come into frame as the
//      camera opens. No pop-ins. The reveal IS the
//      gesture.                                          "areas"        f0-22
//   2. the people arrive, OVERLAPPING the pull-back's
//      tail rather than waiting for it: one person
//      glyph slides up into place under each ring from
//      28 px below on its own 10 f eased move with a
//      4 px settle, hashed starts f16/18/20 (top row)
//      and f22/24/26 (bottom row). All six standing by
//      f40, so the pull-back lands INTO a standing
//      picture instead of onto an empty one.             "you have to"  f16-40
//   3. the question marks, starting while the last two
//      people are still rising: one thought bubble per
//      person grows over 8 f with its two trail dots,
//      and the Lucide question mark draws head-led
//      inside it (hook then dot) as it lands. Starts
//      f26/28/30/32/34/36, never two on a frame; all
//      six up by f47. Camera: the creep in,
//      k 1.334 -> 1.39, f28-44, the grid is the
//      subject now                                       "figure out"   f26-47
//   4. the dots arrive: orange dots drift in from
//      beyond the frame edges on individual hashed
//      arcs (arriveEase, flights 10-24 f), 14 to a
//      ring, and seat inside it on an annulus r 36-56
//      that leaves the icon its own 36 px of air. Each
//      ring's stroke converts white -> ACCENT_DEEP over
//      8 f as its first dots seat; first seats
//      f45/47/49/51/53/55, full by f54-64. The six
//      rings' first launches are f27/29/31/33/35/37,
//      two frames apart, and a launched dot is still
//      beyond the visible frame edge for its first
//      frames                                           "how the model" f27-64
//   5. nothing settles: from "behave" every ring's
//      dots mill at the RESTLESS rate — one hop to a
//      vacant neighbouring seat every 2 f per ring,
//      hashed, with a deep -> ripe -> deep tone flicker
//      on each hop — and they never settle again. The
//      question marks stay. Camera: NO dead hold. The
//      creep's own direction continues and decays, and
//      the natural bottom of that ease — f56-58, on
//      "behave" — is the breath. It is 0.11-0.15 screen
//      px/frame on the subject ring and never below
//      0.24 on the corners: slowest, not stopped.       "should behave" f52-80
//   6. tail: hold drift, the mill, dark traffic, glyph
//      sway, the bubbles breathing. Nothing resolves —
//      that is the line.                                 -               f64-80
//
// LIVENESS — nothing here is a gesture on a word:
//   * micro-drift: every dot wanders +-3 world px on two hashed sines, seated,
//     milling, at every zoom, through the tail.
//   * the mill: 0.18 hops/frame per ring from that ring's first seat, and 0.5
//     (one hop per 2 f) from "behave" f57 to the last frame. It never stops.
//   * dark traffic: idleThreads(N) accent threads between neighbouring dots at
//     0.12, no heads; a thread never touches a dot that has not landed.
//   * hold drift: there is no hold. Every stretch between the three glides is
//     the last glide's OWN direction, continued and decaying, so the camera
//     never parks and never lands into a dead frame. Measured on fixed world
//     points through the resolved camera (CAM_SCAN, cam2.txt): the slowest
//     frames in the piece are f56-58 at 0.11-0.15 screen px/frame on the
//     subject ring and 0.24 on the corners — the breath, on "behave".
//   * ring breathe: each ring's radius and its glyph box breathe +-1.2% on
//     their own hashed sines, and the unit bobs 1.4 px, so f0-18 is alive.
//   * glyph sway: each person sways +-1.5 screen px on its own hashed sines.
//   * bubble breathe: a landed bubble breathes +-0.8% about its foot.
//   * arriveEase on every dot flight, every mill hop and every person slide;
//     a screen-space head on the question mark's hook while it draws.
//
// DEPTH — the ladder in OP_FG / OP_MID / OP_BG. Icons, question marks, people,
// dot cores and the stroke head are at 1.0; the station rings, the bubble
// borders and their trail dots at 0.78; the outer ~40% of each ring's dots by
// hashed distance from the ring centre at 0.55, 0.8x radius and 1.45x drift.
// Every dot also carries a +-18% hashed radius. Tone is untouched: colour
// carries state, opacity carries depth.
//
// DEVIATIONS from the brief, and why:
//   * Content centre is world y 1003.5 — the drawn picture runs from the top
//     rings' outer edge (733.7) to the bottom persons' feet (1283.9) — and the
//     INK bbox it produces lands at screen y 835, the house number (the harmony
//     pass; it was 890 / measured 870). See LIFT below: at the briefed k 1.34
//     that picture is 729 screen px tall and the measured band (y 60..1290)
//     leaves only 330 px under the frame's centre, so a centre at 960 would put
//     the persons' feet at ~1325. 900 is the lowest the band allows with slack.
//   * The camera gains a cx axis and rests on world x 571, not 540. The picture
//     is symmetric in its RINGS but not in its ink: every thought bubble hangs
//     to the right of its ring, so the drawn box is x 233..915. A camera parked
//     on the column axis leaves 128 px of margin on the left and 37 on the
//     right at k 1.34; one that ends on 571 leaves ~79 on both.
//   * k 1.34 is the brief's number and it is kept, but it does NOT give the
//     "~30 px margins" the checklist asks for: the drawn box is 682 world px
//     wide, so 30 px margins would need k 1.49. At 1.34 the margins are ~79 px
//     a side. 1.49 also fits the y band (half-height 414, centre 876), so this
//     is one constant away if the director wants it tighter.
//   * The pull-back cannot meet the |dv| <= 2.5 screen px/f^2 budget and no
//     warp fixes it: a 20-frame move that takes k from 2.02 to 1.34 while the
//     pan runs 800 -> 1003.5 carries the corner rings ~400 screen px, and a
//     zero-slope ease over 20 frames peaks at ~6 * 400 / 20^2 = 6 px/f^2. The
//     measured peak is 5.5 (f7, the glide's ramp-in) and 3.5 at its ease-out.
//     FROM f26 — the frame the pull-back lands — to the end, the peak is 1.77.
//   * The bubble is at 0.9 of the approved device (70 x 52), not 0.75: at 0.75
//     the question mark's ink is 15 world px tall and dies at phone width. At
//     the repacked pitch of 240 it still clears the next column's ring by
//     38.5 world px (the brief's floor is 24), and its own ring by 4 px at the
//     one height where they are level. The question mark itself is drawn at 0.9 of
//     the bubble height rather than the approved 0.55 x 1.25 for the same
//     reason; its ink is 11.7 x 19.5 world px, 19 screen px tall at the
//     resolved k.
//   * The bubble's two trail dots are re-placed on the line from the head to
//     the bubble's bottom-left corner (the bubble is beside the head here, not
//     over it) rather than at the approved device's offsets, which assume a
//     bubble directly above.
//   * Bubble starts are f27-37, one frame ahead of the briefed f28-38, so the
//     last question mark completes at f48 ("the model") rather than f49. The
//     brief's own "8 f growth + 6 f mark, all six up by f46" is two frames
//     short of its own arithmetic.
//   * Dot flights run 11-32 f, not 10-14: the middle column's dots come from
//     ~520 world px beyond a side edge, and arriveEase cruises at 1.3x the
//     nominal speed, so 45 screen px/frame at k 1.18 caps the nominal at 29
//     world px/frame and a 520 px flight cannot be shorter than 18 f. Launches
//     start f27 rather than f38 for the same reason, and because the six rings'
//     onsets are pulled two frames apart (LAUNCH_SHIFT). A launched dot is
//     beyond the visible frame edge for its first frames, so what a viewer
//     sees before "how" is two or three specks crossing the extreme edges from
//     about f30 — the eight-frame lead-in the set calls WAKE_LEAD, not the
//     gesture, which is the crowd reaching the rings from f45. The
//     fastest dot on screen anywhere in the piece is 42.4 px/frame (SPEED_SCAN,
//     f50), inside the set's 45 ceiling — the nominal speed is solved against
//     the new k (K_MAX_ARRIVE 1.5, ARRIVE_SPEED 23.1 world px/frame).
//   * Dark traffic runs BETWEEN NEIGHBOURING DOTS INSIDE each ring (the house
//     mechanism, V3), not between the six rings. A thread from one area to
//     another would say the areas are connected, and the whole point of the
//     line is that each one is its own problem.
//   * The ring converts white -> ACCENT_DEEP; the ICON does not. The noun is
//     ours whatever the AIs do with it, and a white icon over an orange crowd
//     is what keeps it legible at phone width.
//   * The station device, the thought bubble and the question mark are COPIED
//     here rather than imported: those modules run large seat and thread
//     simulations at module scope.
// ---------------------------------------------------------------------------

export const schema = z.object({
  ink: z.string(),
  accent: z.string(), // ripe: a dot on the move
  accentDeep: z.string(), // deep: a dot at rest, and a ring the AIs have taken
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
  dotRadius: z.number(),
  dotOpacity: z.number(),
  personSrc: z.string(),
  beats: z.object({
    areas: z.number(),
    where: z.number(),
    you: z.number(),
    have: z.number(),
    to: z.number(),
    figure: z.number(),
    out: z.number(),
    how: z.number(),
    the: z.number(),
    model: z.number(),
    should: z.number(),
    behave: z.number(),
    end: z.number(), // next word "it"; tail to 80
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
  dotRadius: 4.92, // harmony pass: DOT_RADIUS (5.5) * 0.895, see SEAT_STEP
  dotOpacity: OP_UNREAD_DOT,
  personSrc: "person.png",
  beats: {
    areas: 0,
    where: 11,
    you: 18,
    have: 21,
    to: 25,
    figure: 28,
    out: 33,
    how: 38,
    the: 44,
    model: 48,
    should: 52,
    behave: 57,
    end: 64,
  },
});

const WORLD_W = 1080;
const WORLD_H = 1920;
const CX = 540;

// SCALE PASS. The director's note on V1: "the grid is small in the frame" —
// the six units spanned only ~45% of the frame height. The units are repacked
// (column pitch 270 -> 240, ring 58 -> 64) and the camera comes in from
// k 1.045-1.10 to a rest of 1.34, which is a 27% bigger picture.
//
// That forces LIFT off 0. The band the checklist measures is screen y 60..1290
// — 900 px above the frame's centre and only 330 below it, because the
// captions own the bottom. The drawn picture is ~544 world px tall (the top
// rings' outer edge to the bottom persons' feet), which at k 1.34 is 729
// screen px: its centre can sit no lower than 1290 - 365 = 925. So the content
// centre goes to screen y 890 (LIFT = 70) rather than the 960 V1 could afford
// at its smaller k.
//
// HARMONY PASS. The set frames on the INK bbox, not on the geometric content
// centre, and the house number is screen y 835 (fieldShared's CAM_LIFT). This
// cut measured 870 on its last frame before the pass and the bigger person
// (GLYPH 83) adds ~7 px to that, so LIFT goes 70 -> 112. LIFT is the right
// constant to move it with: screen y = 960 + (wy - c) * k - LIFT, so a change
// here is a CONSTANT SCREEN shift at every k and the camera's own velocities
// and |dv| are untouched — nothing about the move changes, only where the
// whole track sits. Measured after: last-frame ink bbox centre 835, and every
// frame from the pull-back's landing stays inside the band (y 60..1290).
const LIFT = 112;

// ---------------------------------------------------------------------------
// THE WEIGHT. Director's note, learned on StillDecideWhatWeWantV2: the outline
// weight has to match the FILLED person glyph standing next to it. That cut
// solved it at 6.0 world px against a 108 px person.
//
// HARMONY PASS. The four cuts of this clip play seconds apart in one edit, so
// what has to match between them is the SCREEN result, not the world number:
// cut 2's 108 px person at its resting k 1.0925 is 118 screen px and its 6.0
// outline is 6.55 screen px. This cut rests at k 1.4214, so the same picture
// is a person of 83 world px (72 before) and an outline of 4.6 (5.0 before).
// The dark traffic follows the same rule at half the outline: 3.28 screen =
// 2.3 world, where it was 3.
//
// One weight for every foreground outline: the station rings, the six Lucide
// icons, the question marks and the thought-bubble borders. The icons are
// drawn on Lucide's 24 grid inside a 76.8 px box (GLYPH_FRACTION is cut 2's
// 0.60 now), so the local stroke is solved back out — 4.6 * 24 / 76.8 = 1.4375
// — and the WORLD weight is exactly the ring's.
const STROKE = 2.3; // the dark traffic in the crowds — 0.5x the outline
const RING_STROKE = 4.6; // a ring, and with it every foreground outline
const BORDER_STROKE = RING_STROKE; // the bubble reads as one weight with the rest
const GLYPH_STROKE_WORLD = RING_STROKE; // icon, question mark and ring: one weight

// ---------------------------------------------------------------------------
// THE DEPTH LADDER, by role. Depth is OPACITY and SIZE only: a dot's COLOUR
// still means its state, so nothing about the story is carried by these.
//   FG  1.00  icons, question marks, people, dot cores, the stroke head
//   MID 0.78  the containers: station rings, bubble borders, bubble trail dots
//   BG  0.55  the back ~40% of each ring's crowd, at 0.8x radius
// ---------------------------------------------------------------------------
const OP_FG = 1.0;
const OP_MID = 0.78;
const OP_BG = 0.55;
const BG_R_SCALE = 0.8;
const BG_DRIFT = 1.45;
const BACK_FRACTION = 0.4; // the outer 40% of each ring's dots go on the back rung
const DEPTH_JITTER = 9; // world px of hashed jitter on that ranking, so the
// boundary between core and back is a feathered band and not a drawn circle
const R_SPREAD = 0.18; // +-18% hashed per-dot radius

// ---------------------------------------------------------------------------
// THE SIX AREAS. A 3 x 2 grid of identical UNITS: a station ring with a Lucide
// outline glyph, a person standing under it, and a question mark over the
// person's shoulder. Pitch 240 x 320 (was 270 x 320), ring R 64 (was 58).
//
// The icons are lucide-static v1.46.0 (ISC), inlined verbatim — same 24 grid,
// same commands, same order, fill none, round caps, round joins. Six areas of
// life a viewer with no idea what an AI is can still name: health, software,
// education, law, safety, money.
// ---------------------------------------------------------------------------
const ICON_HEART_PULSE =
  `<path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/><path d="M3.22 13H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/>`;
const ICON_CODE = `<path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/>`;
const ICON_GRADUATION_CAP =
  `<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>`;
const ICON_SCALE =
  `<path d="M12 3v18"/><path d="m19 8 3 8a5 5 0 0 1-6 0zV7"/><path d="M3 7h1a17 17 0 0 0 8-2 17 17 0 0 0 8 2h1"/><path d="m5 8 3 8a5 5 0 0 1-6 0zV7"/><path d="M7 21h10"/>`;
const ICON_SHIELD =
  `<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>`;
const ICON_BANKNOTE =
  `<rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/>`;

const COL_X = [300, 540, 780];
const ROW_Y = [800, 1120];

const STATION_R = 64;
const GLYPH_FRACTION = 0.6; // 76.8 world px: the icon's box inside the ring,
// cut 2's ring/icon rule (STATION_GLYPH_FRACTION) rather than this cut's own

type Unit = { x: number; y: number; glyph: string };
// Reading order, but the camera opens on unit 1 (code, top middle).
const UNITS: Unit[] = [
  { x: COL_X[0], y: ROW_Y[0], glyph: ICON_HEART_PULSE },
  { x: COL_X[1], y: ROW_Y[0], glyph: ICON_CODE },
  { x: COL_X[2], y: ROW_Y[0], glyph: ICON_GRADUATION_CAP },
  { x: COL_X[0], y: ROW_Y[1], glyph: ICON_SCALE },
  { x: COL_X[1], y: ROW_Y[1], glyph: ICON_SHIELD },
  { x: COL_X[2], y: ROW_Y[1], glyph: ICON_BANKNOTE },
];
const NU = UNITS.length;
const OPEN_UNIT = 1; // the ring the piece opens on

// -- the person -------------------------------------------------------------
// 83 px glyph standing under the ring (72 before the harmony pass: 83 world px
// at this cut's resting k 1.4214 is the set's 118 screen px box, cut 2's
// person). Ring bottom to the top of the head is 30 px of air, measured off
// person.png's own alpha box (ink 40..472 of 512) rather than off the image
// box, so the air is real air — and that air is INDEPENDENT of GLYPH, because
// PERSON_DY is solved off it: headTop = u.y + STATION_R + RING_TO_HEAD = 94
// whatever the glyph is, which clears the ring's outer edge (64 + 4.6/2 =
// 66.3) by 27.7 world px. The bubble's foot (BUB_FOOT_DY 78) is likewise 16 px
// clear of that head top at any GLYPH. What DOES move is the feet: footY =
// u.y + 94 + GLYPH * 431/512, so the bottom row's feet go 1274.6 -> 1283.9
// world, and the framing below is re-solved for it.
const GLYPH = 83;
const PERSON_INK_TOP = 40 / 512;
const PERSON_FOOT = 471 / 512;
const RING_TO_HEAD = 30;
const PERSON_DY = STATION_R + RING_TO_HEAD + GLYPH / 2 - GLYPH * PERSON_INK_TOP; // 129.02
const headTopY = (u: Unit) => u.y + PERSON_DY - GLYPH / 2 + GLYPH * PERSON_INK_TOP;
const footY = (u: Unit) => u.y + PERSON_DY - GLYPH / 2 + GLYPH * PERSON_FOOT;

// 36 in V1. At the new k a glyph 36 world px below its place puts its feet at
// screen 1298 on f26 — 8 px under the measured band's floor — for the two
// frames before the last two persons are up; 28 keeps every frame inside it.
const PERSON_RISE = 28; // how far below its place a glyph comes from
const PERSON_DUR = 10;
const PERSON_SETTLE = 4; // frames of the 4 px settle
const PERSON_T0 = [16, 18, 20, 22, 24, 26]; // top row first; never two on a frame

// -- the thought bubble, and the question mark in it ------------------------
// The approved device from SubvertTheInfrastructure at 0.9 (the units are 270
// px apart), sitting to the RIGHT of the ring and just above the head, with
// the two dots that make it a thought and not a speech balloon. Inside it,
// Lucide `circle-help`'s inner strokes only — the hook and its dot, without
// the circle, because the bubble already is the circle.
const BUB_W = 70;
const BUB_H = 52;
const BUB_RATIO = 0.22; // a thought is soft; the house 1.2% reads as a sign
const BUB_PATH = squirclePath(BUB_W, BUB_H, BUB_RATIO);
const BUB_DX = 100; // centre, right of the ring (ring's own edge is 59.75)
const BUB_FOOT_DY = 78; // its foot, 10 px above the top of the head
const bubCx = (u: Unit) => u.x + BUB_DX;
const bubY1 = (u: Unit) => u.y + BUB_FOOT_DY;
const bubY0 = (u: Unit) => u.y + BUB_FOOT_DY - BUB_H;
// the two dots, on the line from the head to the bubble's bottom-left corner
const BUB_TRAIL = [
  { dx: 28, dy: 13, r: 3.2, t: 0 },
  { dx: 48, dy: 6, r: 5, t: 2 },
];
const BUB_TRAIL_DUR = 3;
const BUB_GROW = 8;
const BUB_T0 = [28, 26, 30, 34, 32, 36]; // hashed, never two on a frame

const QM_PATHS = [
  "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3", // the hook
  "M12 17h.01", // and its dot
];
// The mark's box: 0.9 of the bubble's height. The approved 0.55 x 1.25 is tuned
// for a 58 px bubble over a 118 px person; this bubble is 52 px over an 83 px
// person and at that fraction the ink is 15 world px tall and gone at phone
// width. The stroke is divided back out so the WORLD weight is the ring's.
const QM_S = (0.9 * BUB_H) / 24;
const QM_STROKE = GLYPH_STROKE_WORLD / QM_S;
const QM_LEAD = 5; // frames after the bubble starts
const QM_HOOK = 4;
const QM_DOT = 2;
const QM_DONE = QM_LEAD + QM_HOOK + QM_DOT; // t at which a mark is finished

// The hook's stroke head. `strokeDashoffset` reveals by ARC LENGTH, so the head
// is placed by arc length too: the arc and the trailing cubic are walked once
// at module scope, in the icon's own 24 units.
const QM_WALK = (() => {
  const pts: { x: number; y: number; s: number }[] = [];
  // "M9.09 9 a3 3 0 0 1 5.83 1" — the minor arc, swept clockwise
  const x0 = 9.09;
  const y0 = 9;
  const x1 = 9.09 + 5.83;
  const y1 = 9 + 1;
  const r = 3;
  const dx = x1 - x0;
  const dy = y1 - y0;
  const d = Math.hypot(dx, dy);
  const h = Math.sqrt(Math.max(0, r * r - (d * d) / 4));
  const mx = (x0 + x1) / 2;
  const my = (y0 + y1) / 2;
  // two candidate centres; keep the one whose swept angle is the minor arc
  const cands = [
    { cx: mx + (h * dy) / d, cy: my - (h * dx) / d },
    { cx: mx - (h * dy) / d, cy: my + (h * dx) / d },
  ];
  let best = cands[0];
  let bestA0 = 0;
  let bestA1 = 0;
  let bestSpan = Infinity;
  for (const c of cands) {
    let a0 = Math.atan2(y0 - c.cy, x0 - c.cx);
    let a1 = Math.atan2(y1 - c.cy, x1 - c.cx);
    // sweep = 1: angles increase (clockwise on a y-down canvas)
    while (a1 < a0) a1 += Math.PI * 2;
    const span = a1 - a0;
    if (span < bestSpan) {
      bestSpan = span;
      best = c;
      bestA0 = a0;
      bestA1 = a1;
    }
  }
  let px = x0;
  let py = y0;
  let s = 0;
  pts.push({ x: px, y: py, s: 0 });
  for (let i = 1; i <= 16; i++) {
    const a = bestA0 + (bestA1 - bestA0) * (i / 16);
    const x = best.cx + r * Math.cos(a);
    const y = best.cy + r * Math.sin(a);
    s += Math.hypot(x - px, y - py);
    pts.push({ x, y, s });
    px = x;
    py = y;
  }
  // "c0 2 -3 3 -3 3" — relative cubic off the arc's end
  const c = [x1, y1, x1 + 0, y1 + 2, x1 - 3, y1 + 3, x1 - 3, y1 + 3];
  for (let i = 1; i <= 16; i++) {
    const t = i / 16;
    const u = 1 - t;
    const x = u * u * u * c[0] + 3 * u * u * t * c[2] + 3 * u * t * t * c[4] + t * t * t * c[6];
    const y = u * u * u * c[1] + 3 * u * u * t * c[3] + 3 * u * t * t * c[5] + t * t * t * c[7];
    s += Math.hypot(x - px, y - py);
    pts.push({ x, y, s });
    px = x;
    py = y;
  }
  return { pts, total: s };
})();

const qmHead = (u: number) => {
  const want = clamp01(u) * QM_WALK.total;
  const p = QM_WALK.pts;
  let i = 1;
  while (i < p.length - 1 && p[i].s < want) i++;
  const a = p[i - 1];
  const b = p[i];
  const t = b.s === a.s ? 0 : (want - a.s) / (b.s - a.s);
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
};

// ---------------------------------------------------------------------------
// THE CROWDS. One feathered, wobbling annulus of seats INSIDE each ring: the
// dots fill the area, and the 36 px of clear air at the centre is the icon's,
// so no dot can sit on an icon stroke and the noun stays legible with fourteen
// dots in the ring with it.
// ---------------------------------------------------------------------------
// HARMONY PASS: the dot came down 5.5 -> 4.92 world px (the set's 12.0 screen
// px front-rung dot at this k... 14.0 here, the director's number), so the seat
// pitch and the blue-noise separation come down with it by the same 0.895, and
// the fourteen-per-ring count and the crowd's density are unchanged. ANN_R0 is
// NOT scaled: the icon's 36 world px of clear air is the icon's, not the dot's.
const SEAT_STEP = 8.95;
const ANN_R0 = 36; // the icon keeps 36 world px of clear air at the centre
const ANN_R1 = 56; // and the crowd stops inside the ring at 64
const ANN_FEATHER = 1.4;
const DOTS_PER_UNIT = 14;
const SEAT_SEP = 11.635; // blue noise: how far apart two occupied seats start out

type Seat = { x: number; y: number; rr: number; r: number };

const SEATS: Seat[][] = UNITS.map((un, s) => {
  const out: Seat[] = [];
  const half = ANN_R1 + SEAT_STEP;
  const n = Math.ceil((2 * half) / SEAT_STEP) + 1;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const i = s * 997 + r * n + c;
      const x = un.x - half + c * SEAT_STEP + (hash(i, 11) - 0.5) * SEAT_STEP * 0.8;
      const y = un.y - half + r * SEAT_STEP + (hash(i, 12) - 0.5) * SEAT_STEP * 0.8;
      const dx = x - un.x;
      const dy = y - un.y;
      const rr = Math.hypot(dx, dy);
      if (rr < ANN_R0) continue;
      const rOut = ANN_R1 + wobble(Math.atan2(dy, dx) * WOBBLE_R, 1.7 + s) * 2.6;
      const f = feather((rOut - rr) / SEAT_STEP, ANN_FEATHER);
      if (hash(i, 71) >= f) continue;
      out.push({
        x,
        y,
        rr,
        r:
          (0.82 + 0.36 * hash(i, 13)) *
          (0.76 + 0.24 * f) *
          (1 + (hash(i, 27) - 0.5) * 2 * R_SPREAD),
      });
    }
  }
  return out;
});

// Which seats start occupied. Blue noise over the seats of a ring: walk them in
// hashed order and take one only if it is SEAT_SEP away from everything taken
// so far, loosening the separation until fourteen are seated. The crowd is
// spread around the whole area rather than bunched on the side it arrived
// from, and every dot keeps vacant neighbours to mill into.
const OCCUPIED: number[][] = SEATS.map((seats, s) => {
  const order = seats.map((_, i) => i).sort((a, b) => hash(a + s * 31, 77) - hash(b + s * 31, 77));
  const taken: number[] = [];
  for (let sep = SEAT_SEP; sep > 0 && taken.length < DOTS_PER_UNIT; sep -= 2) {
    for (const i of order) {
      if (taken.length >= DOTS_PER_UNIT) break;
      if (taken.includes(i)) continue;
      if (taken.some((j) => Math.hypot(seats[i].x - seats[j].x, seats[i].y - seats[j].y) < sep))
        continue;
      taken.push(i);
    }
  }
  return taken;
});

// The depth ladder's crowd split: rank a ring's fourteen dots by their distance
// from the ring's centre with a hashed +-9 px jitter on it, and put the outer
// 40% on the back rung. The jitter is what makes it a feathered band rather
// than a drawn circle: which dots are back wobbles from ring to ring.
const BACK_SEATS: Set<number>[] = OCCUPIED.map((taken, s) => {
  const seats = SEATS[s];
  const ranked = [...taken].sort(
    (a, b) =>
      seats[b].rr +
      (hash(b + s * 41, 23) - 0.5) * 2 * DEPTH_JITTER -
      (seats[a].rr + (hash(a + s * 41, 23) - 0.5) * 2 * DEPTH_JITTER),
  );
  return new Set(ranked.slice(0, Math.round(DOTS_PER_UNIT * BACK_FRACTION)));
});

// ---------------------------------------------------------------------------
// THE ARRIVAL. Every dot comes from beyond a frame edge on its own arc. The
// nearest seat is taken first, so each ring fills from the side it came from.
// A ring's stroke starts converting white -> ACCENT_DEEP the moment its first
// dot seats.
// ---------------------------------------------------------------------------
const LAND_FIRST = [45, 53, 47, 49, 55, 51]; // per unit; sorted they are 2 apart
const LAND_SPAN = 9;
const DEEP_DUR = 8; // white -> ACCENT_DEEP, the approved conversion
const SPEED_CAP_SCREEN = 45;
const K_MAX_ARRIVE = 1.5;
const ARRIVE_TAIL = 0.15;
// arriveEase cruises at (1 + 2 * tail) of the average speed, so the NOMINAL
// speed that keeps the head inside the set's cap is the cap divided by both.
const ARRIVE_SPEED = SPEED_CAP_SCREEN / (K_MAX_ARRIVE * (1 + 2 * ARRIVE_TAIL)); // 23.1

type Dot = {
  un: number;
  seat: number;
  ex: number;
  ey: number;
  land: number;
  launch: number;
  bow: number;
  r: number;
  back: boolean;
};

const DOTS: Dot[] = [];
SEATS.forEach((seats, s) => {
  const taken = OCCUPIED[s];
  const un = UNITS[s];
  // the side of the frame this dot comes from: the outer columns from their own
  // side, the middle column hashed left or right
  const side = (i: number) =>
    un.x < CX ? 20 : un.x > CX ? 1060 : hash(i + s * 313, 37) < 0.5 ? 20 : 1060;
  // The entry band is ABOVE the unit's own line, never below it: a dot that
  // comes in level or from above cannot fly through the thought bubble, which
  // hangs 26-78 px below the ring's centre on its right. (A bubble is an
  // outline with no fill, so a dot crossing behind one reads as a dot INSIDE
  // the thought, which is the one thing this picture must not say.)
  const entryY = (i: number) => un.y - 125 + hash(i + s * 313, 33) * 150;
  const withDist = taken.map((i) => ({
    i,
    ex: side(i),
    ey: entryY(i),
    d: Math.hypot(seats[i].x - side(i), seats[i].y - entryY(i)),
  }));
  withDist.sort((a, b) => a.d - b.d);
  const n = withDist.length;
  withDist.forEach((w, rank) => {
    const land = Math.round(LAND_FIRST[s] + (LAND_SPAN * rank) / Math.max(1, n - 1));
    const flight =
      Math.max(10, Math.ceil(w.d / ARRIVE_SPEED)) + Math.floor(hash(w.i + s * 71, 34) * 6);
    DOTS.push({
      un: s,
      seat: w.i,
      ex: w.ex,
      ey: w.ey,
      land,
      launch: land - flight,
      bow: (hash(w.i + s * 53, 35) - 0.5) * 110,
      r: seats[w.i].r,
      back: BACK_SEATS[s].has(w.i),
    });
  });
});
// NO UNISON, between the rings as well as inside them. Two rings whose first
// dot leaves on the same frame read as one pour in two places, so the six
// onsets are pulled apart to at least two frames — always EARLIER, never
// later, so a flight only ever gets longer and the speed cap cannot be broken
// by this pass. A dot is beyond the visible frame edge for its first frames
// whatever it does, so nothing about the picture changes.
const LAUNCH_SHIFT = (() => {
  const first = UNITS.map((_, s) => Math.min(...DOTS.filter((d) => d.un === s).map((d) => d.launch)));
  const order = UNITS.map((_, s) => s).sort((a, b) => first[b] - first[a]);
  const shift = new Array(NU).fill(0);
  let prev = Infinity;
  for (const u of order) {
    const want = Math.min(first[u], prev - 2);
    shift[u] = want - first[u];
    prev = want;
  }
  return shift;
})();
for (const d of DOTS) d.launch += LAUNCH_SHIFT[d.un];

const N = DOTS.length;

// ---------------------------------------------------------------------------
// THE MILL. A hop to a vacant neighbouring seat, per ring: 0.18 a frame from
// that ring's first seat, and 0.5 — one hop every two frames — from "behave"
// to the last frame. It never stops; there is no hold in this piece where a
// crowd is still. Simulated once at module scope so the occupancy map is
// shared and no two dots ever sit on one seat.
// ---------------------------------------------------------------------------
const MILL_CALM = 0.18;
const MILL_RESTLESS = 0.5;
const RESTLESS_F0 = 57; // "behave"
const MILL_DUR = 10;
const HOP_REACH = SEAT_STEP * 1.7;

type Hop = { from: number; to: number; t0: number };

const HOPS: Hop[][] = DOTS.map(() => []);
(() => {
  SEATS.forEach((seats, s) => {
    const nb: number[][] = seats.map((a) =>
      seats
        .map((b, j) => ({ b, j }))
        .filter(({ b, j }) => b !== a && Math.hypot(b.x - a.x, b.y - a.y) <= HOP_REACH)
        .map(({ j }) => j),
    );
    const mine = DOTS.map((d, i) => ({ d, i })).filter(({ d }) => d.un === s);
    const seatOf = new Int32Array(mine.length);
    const occupied = new Int32Array(seats.length).fill(-1);
    mine.forEach((m, j) => {
      seatOf[j] = m.d.seat;
    });
    const busyUntil = new Float64Array(mine.length).fill(-1);
    let acc = 0;
    let id = 0;
    for (let f = LAND_FIRST[s]; f <= DURATION; f++) {
      mine.forEach((m, j) => {
        if (m.d.land === f) occupied[seatOf[j]] = j;
      });
      acc += f >= RESTLESS_F0 ? MILL_RESTLESS : MILL_CALM;
      while (acc >= 1) {
        acc -= 1;
        const jj = id++;
        // Scan for a dot that is free to move AND has a vacant neighbouring
        // seat: vacancies are blue noise, so most dots have none, and taking
        // the first free dot and giving up when it is boxed in throttles the
        // mill to a fraction of its rate.
        const start = Math.floor(hash(jj + s * 17, 51) * mine.length);
        let pick = -1;
        let free: number[] = [];
        for (let t = 0; t < mine.length; t++) {
          const c = (start + t) % mine.length;
          if (mine[c].d.land > f - 2 || busyUntil[c] > f) continue;
          const cand = nb[seatOf[c]].filter((q) => occupied[q] < 0);
          if (cand.length === 0) continue;
          pick = c;
          free = cand;
          break;
        }
        if (pick < 0) break;
        const from = seatOf[pick];
        const to = free[Math.floor(hash(jj + s * 23, 52) * free.length) % free.length];
        occupied[from] = -1;
        occupied[to] = pick;
        seatOf[pick] = to;
        busyUntil[pick] = f + MILL_DUR;
        HOPS[mine[pick].i].push({ from, to, t0: f });
      }
    }
  });
})();

// ---------------------------------------------------------------------------
// DARK TRAFFIC. Idle accent threads between neighbouring dots at 0.12, at the
// house rate. A dot that has not landed carries none.
// ---------------------------------------------------------------------------
const TRAFFIC_N = idleThreads(N);
const TRAFFIC_REACH = 38;

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
// WHERE A DOT IS. One pure function of (dot, frame), so the piece draws and the
// speed scan below measures exactly the same motion: the seat the mill has it
// on, the flight it is still on, and the micro-drift on top of both.
// ---------------------------------------------------------------------------
type DotState = {
  x: number;
  y: number;
  un: number;
  r: number;
  back: boolean;
  moving: number;
  flick: number;
  fade: number;
  landed: boolean;
};

const dotAt = (d: Dot, i: number, frame: number): DotState | null => {
  if (frame < d.launch) return null;
  const seats = SEATS[d.un];

  // where its seat is right now — the mill moves it from seat to seat
  let sx: number;
  let sy: number;
  let moving = 0;
  let flick = 0;
  const hs = HOPS[i];
  let cur = d.seat;
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
    sx = A.x + dx * e + (-dy / L) * bow;
    sy = A.y + dy * e + (dx / L) * bow;
    moving = clamp01(Math.min(u, 1 - u) / 0.2);
    // deep -> ripe -> deep while it moves: a dot on the move is a lit dot
    flick = Math.sin(Math.PI * u);
  } else {
    sx = seats[cur].x;
    sy = seats[cur].y;
  }

  let x = sx;
  let y = sy;
  let fade = 1;
  if (frame < d.land) {
    const u = clamp01((frame - d.launch) / (d.land - d.launch));
    const e = arriveEase(u, ARRIVE_TAIL);
    const dx = sx - d.ex;
    const dy = sy - d.ey;
    const L = Math.hypot(dx, dy) || 1;
    const bow = Math.sin(Math.PI * e) * d.bow;
    x = d.ex + dx * e + (-dy / L) * bow;
    y = d.ey + dy * e + (dx / L) * bow;
    moving = clamp01(Math.min(u, 1 - u) / 0.18);
    flick = Math.sin(Math.PI * u) * 0.8;
    fade = clamp01((frame - d.launch) / 2);
  }

  const md = micro(i, frame);
  const dm = d.back ? BG_DRIFT : 1;
  return {
    x: x + md.dx * dm,
    y: y + md.dy * dm,
    un: d.un,
    r: d.r * (d.back ? BG_R_SCALE : 1),
    back: d.back,
    moving,
    flick,
    fade,
    landed: frame >= d.land,
  };
};

// ---------------------------------------------------------------------------
// THE CAMERA. Rebuilt on StillDecideWhatWeWantV2's, the approved cut: FEW LONG
// GLIDES, C1 joins, and every "hold" authored as the last move's own direction
// continued and decaying rather than as a stop. V1's track landed the
// pull-back, parked, pushed, then went DEAD STILL for eight frames — the held
// breath — and the stop is what read as janky.
//
// fieldShared's `camMove` with CAM_LIFT swapped for this piece's LIFT of 60,
// and with a THIRD axis, cx, exactly as the previous cut does. The camera
// needs it because the picture is NOT symmetric about the column axis: the
// thought bubbles all hang to the right of their rings, so the drawn box runs
// world x 227 (a top-left dot's outer drift) to 915 (the bottom-right bubble's
// edge) and its centre is 571, not 540. A camera parked on 540 puts 128 px of
// margin on the left and 37 on the right at the new k; one that ends on 571
// puts ~79 on both. It opens on 540 — the code ring, dead centre — and the
// pull-back carries it across, so the lateral move is part of the one
// movement and never a correction of its own.
//
//   f0-2    k 2.00 -> 2.02   c 800 -> 799.4   x 540        the opening creep,
//                                                          on the code ring,
//                                                          flowing straight into
//   f2-22   k -> 1.34        c -> 1003.5      x -> 571     THE PULL-BACK, warp
//                                                          0.8: six units, the
//                                                          rest zoom, and the
//                                                          slide onto the
//                                                          picture's own centre
//   f22-28  k -> 1.334       c -> +3          x -> +1.5    the pull-back's own
//                                                          direction, decaying
//                                                          (warp 0.6)
//   f28-44  k -> 1.39        c -> +5          x -> +2      the creep in, +0.05,
//                                                          warp 0.85: speed
//                                                          early, a long
//                                                          ease-out, no click
//   f44-54  k -> 1.400       c -> +9          x -> +2.5    the creep's own
//                                                          direction, decaying
//                                                          (warp 0.55). The
//                                                          bottom of THIS ease,
//                                                          around f50-56, is the
//                                                          breath — the camera
//                                                          is at its slowest
//                                                          under "should" and
//                                                          "behave" and it is
//                                                          still moving.
//   f54-80  k -> 1.424       c -> +20         x -> +3.5    the tail, the same
//                                                          direction again
//                                                          (warp 0.9)
//
// The ZOOM turns around once, at f28 (outward drift -> inward creep), and the
// PAN never does: c climbs from the end of the pull-back to the last frame, so
// the picture is travelling through the turnaround rather than passing through
// a dead frame. Every join is C1 — camMoveLift emits a key per frame on an
// eased curve whose slope is zero at both ends for warp > 0.5, and consecutive
// segments share their endpoint — so the damper's target has no corner in it.
//
// The damper lags its target by about four frames, so the pull-back keyed to
// f22 settles at ~f26, two frames before "figure" at f28, and the creep keyed
// to f44 is still easing out under "should" at f52.
// ---------------------------------------------------------------------------
const CONTENT_C = 1003.5; // the drawn picture's centre of mass, in world y
const CX_REST = 571; // ...and in world x: the bubbles pull it off 540
const K_OPEN = 2.0;
const K_REST = 1.34; // after the pull-back
const K_GRID = 1.39; // the creep's +0.05
// The three decaying continuations. Small deltas: ~0.5-1 screen px/frame over
// a dozen frames is only a handful of screen px of travel, which is the point.
const DRIFT_K_OUT = 0.006;
const K_TAIL = K_GRID + 0.034;

const camMoveLift = ({
  f0,
  f1,
  k0,
  k1,
  c0,
  c1,
  x0,
  x1,
  warp = 1,
}: {
  f0: number;
  f1: number;
  k0: number;
  k1: number;
  c0: number;
  c1: number;
  x0: number;
  x1: number;
  warp?: number;
}) => {
  const F: number[] = [];
  const K: number[] = [];
  const CY: number[] = [];
  const CXs: number[] = [];
  const span = f1 - f0;
  for (let i = 0; i <= span; i++) {
    const g = camEase(i / span, warp);
    const k = k0 + (k1 - k0) * g;
    F.push(f0 + i);
    K.push(k);
    CY.push(c0 + (c1 - c0) * g + LIFT / k);
    CXs.push(x0 + (x1 - x0) * g);
  }
  return { F, K, CY, CXs };
};

const CAM_SEGS = [
  // 1. the opening creep, on the code ring
  camMoveLift({
    f0: 0,
    f1: 2,
    k0: K_OPEN,
    k1: 2.02,
    c0: ROW_Y[0],
    c1: ROW_Y[0] - 0.6,
    x0: CX,
    x1: CX,
    warp: 1,
  }),
  // 2. THE PULL-BACK — one long glide, and the slide onto the picture's centre
  camMoveLift({
    f0: 2,
    f1: 22,
    k0: 2.02,
    k1: K_REST,
    c0: ROW_Y[0] - 0.6,
    c1: CONTENT_C,
    x0: CX,
    x1: CX_REST,
    warp: 0.8,
  }),
  // 3. its own direction, decaying
  camMoveLift({
    f0: 22,
    f1: 28,
    k0: K_REST,
    k1: K_REST - DRIFT_K_OUT,
    c0: CONTENT_C,
    c1: CONTENT_C + 3,
    x0: CX_REST,
    x1: CX_REST + 1.5,
    warp: 0.6,
  }),
  // 4. the creep in on the grid
  camMoveLift({
    f0: 28,
    f1: 44,
    k0: K_REST - DRIFT_K_OUT,
    k1: K_GRID,
    c0: CONTENT_C + 3,
    c1: CONTENT_C + 5,
    x0: CX_REST + 1.5,
    x1: CX_REST + 2,
    warp: 0.85,
  }),
  // 5. the creep's own direction, decaying — its bottom is the breath
  camMoveLift({
    f0: 44,
    f1: 54,
    k0: K_GRID,
    k1: K_GRID + 0.010,
    c0: CONTENT_C + 5,
    c1: CONTENT_C + 9,
    x0: CX_REST + 2,
    x1: CX_REST + 2.5,
    warp: 0.55,
  }),
  // 6. the tail, the same direction again
  camMoveLift({
    f0: 54,
    f1: DURATION,
    k0: K_GRID + 0.010,
    k1: K_TAIL,
    c0: CONTENT_C + 9,
    c1: CONTENT_C + 20,
    x0: CX_REST + 2.5,
    x1: CX_REST + 3.5,
    warp: 0.9,
  }),
];

const CAM = (() => {
  const F = [0];
  const K = [K_OPEN];
  const CY = [ROW_Y[0] + LIFT / K_OPEN];
  const CXs = [CX];
  for (const m of CAM_SEGS) {
    for (let i = 0; i < m.F.length; i++) {
      if (m.F[i] <= F[F.length - 1]) continue;
      F.push(m.F[i]);
      K.push(m.K[i]);
      CY.push(m.CY[i]);
      CXs.push(m.CXs[i]);
    }
  }
  return { F, K, CY, CX: CXs };
})();

// ---------------------------------------------------------------------------

const AreasHowTheModelShouldBehave: React.FC<Props> = ({
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
  dotRadius,
  dotOpacity,
  personSrc,
  beats,
}) => {
  const frame = useCurrentFrame();
  const toDeep = makeTone(ink, accentDeep); // a ring: white -> the AIs have it
  const toRipe = makeTone(accentDeep, accent); // a dot: at rest -> on the move

  // -- camera ----------------------------------------------------------------
  const cam = runCamera(frame, CAM.F, CAM.CY, CAM.K);
  // cx runs through the same damper on the same key track — the same move,
  // sideways, exactly as the previous cut does it.
  const camX = runCamera(frame, CAM.F, CAM.CX, CAM.K).cy;
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = camX + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);

  // -- each ring's conversion ------------------------------------------------
  const deepT = UNITS.map((_, s) => clamp01((frame - LAND_FIRST[s]) / DEEP_DUR));

  // -- the dots --------------------------------------------------------------
  const dots = DOTS.map((d, i) => dotAt(d, i, frame));

  // -- dark traffic ----------------------------------------------------------
  type Th = { key: string; x1: number; y1: number; x2: number; y2: number; op: number };
  const traffic: Th[] = [];
  for (let j = 0; j < TRAFFIC_N; j++) {
    const period = 40 - 12 * hash(j, 4);
    const local = frame + hash(j, 5) * period;
    const cycle = Math.floor(local / period);
    const phase = (local - cycle * period) / period;
    const seed = j * 131 + cycle * 7;
    const a = Math.floor(hash(seed, 6) * N);
    const A = dots[a];
    if (!A || !A.landed) continue;
    let b = -1;
    for (let n = 0; n < 12; n++) {
      const cnd = Math.floor(hash(seed + n * 17, 8) * N);
      const C = dots[cnd];
      if (cnd === a || !C || !C.landed) continue;
      if (Math.hypot(C.x - A.x, C.y - A.y) <= TRAFFIC_REACH) {
        b = cnd;
        break;
      }
    }
    if (b < 0) continue;
    const B = dots[b];
    if (!B) continue;
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

  const glyphBox = 2 * STATION_R * GLYPH_FRACTION;
  const qmBox = 24 * QM_S;

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
        cxRest={CAM.CX[0]}
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
            {/* dark traffic inside the crowds: unlooked-at, not dead. No heads. */}
            {traffic.map((t) => (
              <line
                key={t.key}
                x1={t.x1}
                y1={t.y1}
                x2={t.x2}
                y2={t.y2}
                stroke={accent}
                strokeWidth={STROKE}
                strokeLinecap="round"
                opacity={t.op}
              />
            ))}

            {/* the AIs, on the depth ladder: the back of each crowd first and
                dimmer, then its core over the top. Tone means state — only
                opacity and size say how far back a dot is. */}
            {[true, false].map((backPass) =>
              dots.map((d, i) =>
                d === null || d.back !== backPass ? null : (
                  <circle
                    key={`${backPass ? "b" : "c"}${i}`}
                    cx={d.x}
                    cy={d.y}
                    r={dotRadius * d.r * breath(frame, hash(i, 9)) * (1 + 0.2 * d.moving)}
                    fill={toRipe(d.flick)}
                    opacity={dotOpacity * (d.back ? OP_BG : OP_FG) * d.fade}
                  />
                ),
              ),
            )}

            {/* the rings: the container each area is. One rung back from the
                icon inside it, and white until the AIs take the area. Drawn
                ABOVE the crowds (harmony pass — cut 2 draws both ring and icon
                over its dots), so a ring reads at the container rung in both
                cuts instead of one rung further back in this one. */}
            <g style={{ filter: icon }}>
              {UNITS.map((un, s) => {
                const br = 1 + 0.012 * Math.sin(frame * 0.09 + hash(s, 44) * 6.283);
                const bob = 1.4 * Math.sin(frame * 0.072 + hash(s, 45) * 6.283);
                return (
                  <circle
                    key={`r${s}`}
                    cx={un.x}
                    cy={un.y + bob}
                    r={STATION_R * br}
                    fill="none"
                    stroke={toDeep(smoothstep(deepT[s]))}
                    strokeWidth={RING_STROKE}
                    opacity={OP_MID}
                  />
                );
              })}
            </g>

            {/* the nouns. Genuine Lucide, identical conventions in all six
                rings, a local stroke solved so the WORLD weight equals the
                ring's, and drawn ABOVE the dots so an area stays readable
                however full of AI it is. */}
            <g style={{ filter: icon }}>
              {UNITS.map((un, s) => {
                const br = 1 + 0.012 * Math.sin(frame * 0.09 + hash(s, 44) * 6.283);
                const bob = 1.4 * Math.sin(frame * 0.072 + hash(s, 45) * 6.283);
                const g = glyphBox * br;
                return (
                  <g
                    key={`g${s}`}
                    transform={`translate(${un.x - g / 2} ${un.y + bob - g / 2}) scale(${g / 24})`}
                    fill="none"
                    stroke={ink}
                    strokeWidth={(GLYPH_STROKE_WORLD * 24) / g}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={OP_FG}
                    dangerouslySetInnerHTML={{ __html: un.glyph }}
                  />
                );
              })}
            </g>

            {/* the question marks: one person per area, and not one of them
                knows yet. They go up and they never change. */}
            <g style={{ filter: icon }}>
              {UNITS.map((un, s) => {
                const t = frame - BUB_T0[s];
                if (t < 0) return null;
                const grow = ease(t / BUB_GROW, EASE_ARRIVE);
                const hook = clamp01((t - QM_LEAD) / QM_HOOK);
                const dot = clamp01((t - QM_LEAD - QM_HOOK) / QM_DOT);
                const cxb = bubCx(un);
                const y0 = bubY0(un);
                const y1 = bubY1(un);
                // it grows out of the head: the origin is the corner nearest it
                const ox = cxb - BUB_W / 2;
                const oy = y1;
                // and once it is up it breathes about that same corner
                const bb = t > BUB_GROW ? 1 + 0.008 * Math.sin(frame * 0.1 + hash(s, 46) * 6.283) : 1;
                const hp = qmHead(hook);
                return (
                  <g key={`q${s}`}>
                    {BUB_TRAIL.map((p, j) => {
                      const sc = smoothstep((t - p.t) / BUB_TRAIL_DUR);
                      return sc <= 0 ? null : (
                        <circle
                          key={j}
                          cx={un.x + p.dx}
                          cy={y1 + p.dy}
                          r={p.r * sc}
                          fill={ink}
                          opacity={OP_MID}
                        />
                      );
                    })}
                    <g
                      transform={`translate(${ox} ${oy}) scale(${((0.06 + 0.94 * grow) * bb).toFixed(4)}) translate(${-ox} ${-oy})`}
                      opacity={clamp01(grow / 0.18)}
                    >
                      <path
                        d={BUB_PATH}
                        transform={`translate(${cxb - BUB_W / 2} ${y0})`}
                        fill="none"
                        stroke={ink}
                        strokeWidth={BORDER_STROKE}
                        strokeLinecap="round"
                        opacity={OP_MID}
                      />
                      {hook > 0 ? (
                        <g
                          transform={`translate(${cxb - qmBox / 2} ${y0 + BUB_H / 2 - qmBox / 2}) scale(${QM_S})`}
                          fill="none"
                          stroke={ink}
                          strokeWidth={QM_STROKE}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          opacity={OP_FG}
                        >
                          <path
                            d={QM_PATHS[0]}
                            pathLength={1}
                            strokeDasharray="1 1"
                            strokeDashoffset={1 - hook}
                          />
                          {dot > 0 ? (
                            <path
                              d={QM_PATHS[1]}
                              transform={`translate(12 17) scale(${dot.toFixed(3)}) translate(-12 -17)`}
                            />
                          ) : null}
                          {/* the stroke head, in screen-space radius */}
                          {hook < 1 ? (
                            <circle cx={hp.x} cy={hp.y} r={2.4 / (k * QM_S)} fill={ink} />
                          ) : null}
                        </g>
                      ) : null}
                    </g>
                  </g>
                );
              })}
            </g>
          </svg>

          {/* the people: one under each ring, white, with the small shadow that
              makes a glyph read as a thing standing on the field. Each slides
              up into its place, settles, and then sways. */}
          {UNITS.map((un, s) => {
            const t = frame - PERSON_T0[s];
            if (t < 0) return null;
            const u = clamp01(t / PERSON_DUR);
            const e = arriveEase(u);
            // the 4 px settle: it arrives 4 px high and sinks onto its place
            const settle = 4 * (1 - smoothstep((t - PERSON_DUR) / PERSON_SETTLE));
            const rise = PERSON_RISE * (1 - e) - settle;
            const swayX = (1.5 / k) * Math.sin(frame * 0.083 + hash(s, 47) * 6.283);
            const swayY = (1.2 / k) * Math.sin(frame * 0.061 + hash(s, 48) * 6.283);
            return (
              <Img
                key={`p${s}`}
                src={staticFile(personSrc)}
                style={{
                  position: "absolute",
                  left: un.x - GLYPH / 2 + swayX,
                  top: un.y + PERSON_DY - GLYPH / 2 + swayY + rise,
                  width: GLYPH,
                  height: GLYPH,
                  filter: `brightness(0) invert(1) ${icon}`,
                  opacity: OP_FG * clamp01(t / 3),
                }}
              />
            );
          })}
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default AreasHowTheModelShouldBehave;

// Referenced so the beats object is a real contract and not decoration: these
// are the frames every gesture above is keyed to.
export const BEAT_CHECK = {
  areas: defaultProps.beats.areas,
  you: defaultProps.beats.you,
  figure: defaultProps.beats.figure,
  how: defaultProps.beats.how,
  behave: defaultProps.beats.behave,
  end: defaultProps.beats.end,
};
export const CAM_AT = (f: number) => runCamera(f, CAM.F, CAM.CY, CAM.K);
export const MILL_STATS = {
  hops: HOPS.reduce((a, h) => a + h.length, 0),
  inFlightAt: [50, 57, 64, 72, 79].map((f) =>
    HOPS.filter((h) => h.some((q) => f >= q.t0 && f < q.t0 + MILL_DUR)).length,
  ),
};
export const DEPTH_STATS = {
  fg: OP_FG,
  mid: OP_MID,
  bg: OP_BG,
  backDots: DOTS.filter((d) => d.back).length,
  total: N,
  perUnit: SEATS.map((_, s) => {
    const mine = DOTS.filter((d) => d.un === s);
    return `${mine.filter((d) => d.back).length}/${mine.length}`;
  }),
  seats: SEATS.map((s) => s.length),
  glyphStrokeWorld: GLYPH_STROKE_WORLD,
  ringStrokeWorld: RING_STROKE,
  qmStrokeWorld: QM_STROKE * QM_S,
  flights: DOTS.map((d) => d.land - d.launch),
  launchFirst: Math.min(...DOTS.map((d) => d.launch)),
  landLast: Math.max(...DOTS.map((d) => d.land)),
  qmDone: BUB_T0.map((t) => t + QM_DONE),
  openUnit: OPEN_UNIT,
};
// The set's speed ceiling, measured rather than asserted: the fastest any dot
// moves on SCREEN, over every dot and every frame, through the same `dotAt`
// the piece draws with and the same damped camera.
export const SPEED_SCAN = (() => {
  let worst = { frame: 0, dot: 0, screenPxPerFrame: 0 };
  for (let f = 1; f <= DURATION; f++) {
    const k = runCamera(f, CAM.F, CAM.CY, CAM.K).k;
    for (let i = 0; i < N; i++) {
      const a = dotAt(DOTS[i], i, f - 1);
      const b = dotAt(DOTS[i], i, f);
      if (!a || !b) continue;
      const v = Math.hypot(b.x - a.x, b.y - a.y) * k;
      if (v > worst.screenPxPerFrame) worst = { frame: f, dot: i, screenPxPerFrame: v };
    }
  }
  return worst;
})();

// The camera, per frame: how far a fixed world point 400 screen px out of the
// frame's centre moves. It proves there is no parked stretch outside the one
// held breath, and that every landing is a landing.
export const CAM_SCAN = (() => {
  // Four FIXED world points — the four corner rings' centres — put through the
  // resolved camera. A fixed point is the honest probe: it carries the pan, the
  // zoom about the frame's centre and the lateral move at once, and at the one
  // frame where the zoom turns around a single probe can sit exactly where two
  // of them cancel, which reads as a stall that is not one.
  const PROBES: [number, number][] = [
    [UNITS[OPEN_UNIT].x, UNITS[OPEN_UNIT].y],
    [COL_X[0], ROW_Y[0]],
    [COL_X[2], ROW_Y[0]],
    [COL_X[0], ROW_Y[1]],
    [COL_X[2], ROW_Y[1]],
  ];
  const at = (f: number) => {
    const c = runCamera(f, CAM.F, CAM.CY, CAM.K);
    // `sway` is part of the camera — it is the hand on it — so the probe
    // carries it, exactly as the drawn frame does.
    const d = sway(f);
    const x = runCamera(f, CAM.F, CAM.CX, CAM.K).cy + d.dx;
    const cyF = c.cy + d.dy;
    return PROBES.map(([wx, wy]) => ({
      x: FRAME_W / 2 + (wx - x) * c.k,
      y: FRAME_H / 2 + (wy - cyF) * c.k,
      k: c.k,
      cy: cyF,
      cx: x,
    }));
  };
  const rows: {
    f: number;
    k: number;
    cy: number;
    cx: number;
    drift: number;
    dv: number;
    open: number;
    openDv: number;
  }[] = [];
  const speeds = (f: number) => {
    const c = at(f);
    const p = at(f - 1);
    const d = c.map((q, i) => Math.hypot(q.x - p[i].x, q.y - p[i].y));
    // [0] is the OPEN ring — the cut's subject, and the only probe on screen
    // during the close-up; the rest are the corners, which the zoom whips.
    return { open: d[0], worst: Math.max(...d.slice(1)) };
  };
  let prev = speeds(1);
  for (let f = 1; f <= DURATION; f++) {
    const now = speeds(f);
    const c = at(f);
    rows.push({
      f,
      k: c[0].k,
      cy: c[0].cy,
      cx: c[0].cx,
      drift: now.worst,
      dv: Math.abs(now.worst - prev.worst),
      open: now.open,
      openDv: Math.abs(now.open - prev.open),
    });
    prev = now;
  }
  return rows;
})();

// No unison: the smallest gap between any two units' person slides, bubble
// growths and first dot launches.
export const UNISON = (() => {
  const gap = (a: number[]) => {
    const s = [...a].sort((x, y) => x - y);
    let m = Infinity;
    for (let i = 1; i < s.length; i++) m = Math.min(m, s[i] - s[i - 1]);
    return m;
  };
  const firstLaunch = UNITS.map((_, s) =>
    Math.min(...DOTS.filter((d) => d.un === s).map((d) => d.launch)),
  );
  return {
    personSlides: gap(PERSON_T0),
    bubbleGrowths: gap(BUB_T0),
    firstLaunchPerUnit: gap(firstLaunch),
    launchesInUnison: (() => {
      const byFrame = new Map<number, number>();
      for (const d of DOTS) byFrame.set(d.launch, (byFrame.get(d.launch) ?? 0) + 1);
      return Math.max(...byFrame.values());
    })(),
  };
})();

export const LAUNCH_DEBUG = {
  firstLaunchPerUnit: UNITS.map((_, s) =>
    Math.min(...DOTS.filter((d) => d.un === s).map((d) => d.launch)),
  ),
  byFrame: (() => {
    const m = new Map<number, number>();
    for (const d of DOTS) m.set(d.launch, (m.get(d.launch) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => a[0] - b[0]);
  })(),
};

export const DRAWN_BOUNDS = {
  top: ROW_Y[0] - STATION_R - RING_STROKE / 2,
  bottom: footY(UNITS[NU - 1]),
  left: COL_X[0] - STATION_R - RING_STROKE / 2,
  right: bubCx(UNITS[NU - 1]) + BUB_W / 2,
  cxRest: CX_REST,
  kRest: K_REST,
  kGrid: K_GRID,
  kTail: K_TAIL,
  lift: LIFT,
  bubbleToNextRing: COL_X[1] - COL_X[0] - (BUB_DX + BUB_W / 2) - STATION_R - RING_STROKE / 2,
  headTop: headTopY(UNITS[0]),
  contentCentre: CONTENT_C,
  dots: N,
};
