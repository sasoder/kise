import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  BG_BASE,
  BG_DIM,
  DOT_RADIUS,
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
import {
  DARK_TRAFFIC_OPACITY,
  EASE_ARRIVE,
  Packet,
  arriveEase,
  ease,
  packetsOn,
} from "./levelUp";

export const FPS = 24;

// John Charles Beren, clip `StillDecideWhatWeWant`: "Even if the AIs can do all
// the technical work, we'll have to still do a lot of that, and decide what we
// actually want."
//
// The composition starts at SRT 19.80 s, so every beat below is
// frame = round((t - 19.80) * 24). The next word after this line ("alignment")
// lands at f133, so the speech runs 0..133 and a 16 frame tail holds the
// resolved state: DURATION = 133 + 16 = 149.
export const DURATION = 149;

// ---------------------------------------------------------------------------
// V2 — a complete rebuild. V1 (a row of four empty outlines the dots filled)
// was rejected: "way too abstract ... it's just showing agents ... nothing
// symbolizes our own stuff ... everything is weirdly centred to the top, the
// focus should be in the middle."
//
// So: the nouns are literal white glyphs, the human part is a person with a
// thought bubble, and the whole composition sits in the MIDDLE of the frame
// (content centre at screen y 960, not the set's usual 835 — see LIFT below).
//
// Vocabulary, Orange Dwarkesh on the grid, unchanged from the approved cut of
// this clip (HowAssistantsShouldBehaveV3):
//   the technical work = four white station rings in a row, each with a white
//                        Lucide OUTLINE glyph inside it — code, wrench,
//                        bar-chart-3, server — all four on the 24 grid, round
//                        caps, round joins, fill none, the same glyph box and
//                        the same world stroke weight as the ring around it.
//   the AIs            = orange dots, solid, ACCENT_DEEP at rest, ACCENT lit
//   a human            = person.png, ink white, iconShadow, 108 world px
//   a human decision   = the approved thought bubble (SubvertTheInfrastructure)
//                        growing off the head, with a Lucide `trophy` in it:
//                        the thing wanted, not a target to hit
//   the AIs taking a   = the ring, its glyph and its crowd going white ->
//     tool               ACCENT_DEEP; being given direction goes DEEP -> ACCENT
// No text, no numbers. It has to read with the sound off.
//
// GESTURES — one per word, nothing else.
//   1. the standing scene: four white tools in a row,
//      the person below, nothing else. Rings breathe,
//      the glyph sways, the camera is already creeping   "even if"       f0-12
//   2. orange dots pour in from beyond both frame edges
//      on individual hashed arcs (arriveEase, never in
//      unison) and gather as a feathered crowd around
//      each tool; each tool's ring and glyph convert
//      white -> ACCENT_DEEP over 8 f as its first dots
//      seat. code complete f24, wrench f32, chart f40,
//      rack f46, so "work" lands on the third and
//      fourth.                                           "the AIs can do
//                                                         all the technical
//                                                         work"          f12-46
//      camera: the opening glide is still running under
//      it — one slow move, k 1.07 -> 1.20, content
//      centre 940 -> 905, f0-44                                          f0-44
//   3. V4 LEAD PASS. Nothing here waits for its word any
//      more. The camera's second glide LEAVES at f44,
//      while the rack is still being taken, and runs one
//      long eased move onto the person-plus-bubble group
//      (k -> 1.62, cx -> 640, cy -> 1020). The person
//      wakes and lifts 4 px f56-64 as it comes, and the
//      thought bubble starts growing at f62 — while the
//      camera is still settling, so there is no moment
//      where one thing has stopped and the next has not
//      begun                                             "we'll have to
//                                                         still"         f44-76
//   4. the trophy draws inside the bubble head-led while
//      the bubble is still settling, in the order a trophy
//      is drawn: the cup f76-86, both handles f86-90, the
//      stem pair f90-94, the base line f94-96.
//      It is FINISHED at f96, twenty-six frames before
//      "want", so the word lands on a whole thought
//      instead of on the drawing of one                  "do a lot of
//                                                         that"          f76-96
//   5. one ink line runs head-led from the top of the
//      bubble up into the row (f100-108) and splits left
//      and right along it (f108-125.6) at one capped
//      SCREEN speed; as it reaches a tool, that tool's
//      ring, glyph AND crowd go ACCENT_DEEP -> ACCENT
//      over 5 f — chart f110.5, rack f113.7, wrench
//      f118.4, code f125.6. The camera's pull-back to
//      the whole picture (k -> 1.10, cx -> 540) starts at
//      f108 WITH the rise, so the reveal and the payoff
//      are one motion; "want" at f122 lands mid-payoff,
//      with the last two tools still lighting           "decide what we
//                                                        actually want" f100-126
//   6. tail: the pull-back's drift, the crowds milling,
//      and one packet running the bubble->row line every
//      ten frames                                        -              f126-149
//
// LIVENESS — all of V3's mechanisms, nothing new on a word:
//   * micro-drift: every dot wanders +-3 world px on two hashed sines,
//     seated, milling, at every zoom, through the tail.
//   * the mill: hops to vacant neighbouring seats inside each cluster, from the
//     frame that cluster's first dot seats through to the last frame. 338 hops
//     in the piece; 33 of the 107 dots (31%) are in flight at f60, f80, f100
//     and f140 alike, so no hold and no tail is ever a still crowd.
//   * dark traffic: idleThreads(N) accent threads between neighbouring dots at
//     0.12, no heads; a thread never touches a dot that has not landed yet.
//   * the camera never parks and never fidgets: V4 replaces V3's eleven
//     segments with four moves and two decaying drifts, and a fixed world
//     point's screen speed is a single rise-and-decay per move with a floor of
//     0.48 px/frame between them. No frame in the piece is under 0.15 px/frame
//     and the peak frame-to-frame acceleration is 2.15 px/frame^2 (budget 2.5).
//     The V3 held breath is gone: the still moment is now the natural bottom of
//     the drift's ease around f104-108, and the pull-back leaves out of it.
//   * ring breathe: each station ring's radius and its glyph box breathe +-0.6%
//     on their own hashed sines, so the standing scene of f0-12 is alive.
//   * glyph sway: the person sways +-1.5 screen px on hashed sines, and lifts
//     4 screen px over f56-64 (WAKE_LEAD, seventeen frames before "still").
//   * arriveEase on every arrival and every mill hop; screen-space heads on the
//     bubble->row line and on each of the trophy's six strokes; packets on it.
//
// DEPTH — the ladder in OP_FG / OP_MID / OP_BG below, on the note that
// "everything looks a bit too uniform". Icons, trophy, person, crowd cores and
// every line head are at 1.0; rings, the bubble's border and its trail, and
// the two ink lines are at 0.78; the back ~40% of each crowd is at 0.55, 0.8x
// radius and 1.45x micro-drift, with a hashed threshold so that band is
// feathered. Every dot also carries a +-18% hashed radius. Tone is untouched.
//
// DEVIATIONS from the brief, and why:
//   * The station row sits at world y 790 and the person at y 1120 (brief: 760
//     and 1150). The composition has to stay inside the caption-safe band
//     (lowest drawn pixel <= screen y 1290, highest >= 560) at EVERY camera
//     position, and the brief's own camera moves (cy -> 800, cy -> 1000) plus
//     k 1.26 put the person's feet at screen y 1300-1450. Pulling the two ends
//     30 px toward each other buys the camera its travel back; the picture is
//     the briefed one.
//   * The camera's y travel over the middle of the cut is 905 -> 1020 and it
//     gains an x travel of 540 -> 640: the centring pass needs the subject
//     group's own centre under the frame's centre, and that group is off the
//     column axis because the bubble is.
//   * The lowest drawn pixel still has to sit at or above screen y 1290 at
//     every camera position; the binding frame is f51 (the person's feet at
//     1265) at the bottom of the opening glide, not the centred stretch, where
//     k 1.62 about the group's own centre keeps the feet near 1200. The band's
//     TOP rule (>= 560) is deliberately broken over f60-125 only: the note
//     says the row may leave the frame while the person is the subject.
//   * LIFT = 0, not the set's CAM_LIFT = 125. The director asked for the focus
//     in the MIDDLE of the frame, so the content centre lands at screen y 960
//     instead of 835. `camMoveLift` is fieldShared's `camMove` with that one
//     constant swapped; nothing else about the camera changes.
//   * The cluster annulus is rx 68-98, squashed 0.82 in y (ry 56-80), with ~27
//     dots on a 16 px lattice rather than the briefed 22 in an r 70-120 ring.
//     The briefed ring is 240 px tall and 236 px wide against a 200 px pitch,
//     so the four crowds merge into one band AND the composition leaves the
//     safe vertical band; at 22 dots spread over it the crowd read as scattered
//     specks rather than a crowd taking a tool (measured and looked at). Tighter
//     and denser, each tool is visibly besieged and the four stay four.
//   * The split of the final line is authored in SCREEN px/frame (40, under
//     the set's 45 cap) rather than world px/frame. It runs while the camera
//     is pulling back out of k 1.64, so at a fixed world speed the head would
//     be 55+ screen px/frame on its first frames and 28 on its last. Capping
//     it by screen speed holds one legible head and lands the code station —
//     the far one — at f125.6, which is where the V4 lead pass wants it.
//   * 107 dots (~27 a tool) launch across f10-34, so the rate peaks well above
//     the briefed ~2/frame: the brief's own completion deadlines (code complete
//     by f24) do not fit at 2/frame, and a thinner crowd did not read. Launches
//     are hashed and no two are in unison. A dot that launches before f12 is
//     still beyond the visible frame edge until ~f13.
//   * The station device and the thought bubble are COPIED here from
//     TheirOwnTraining / SubvertTheInfrastructure rather than imported: those
//     modules run large seat and thread simulations at module scope and
//     importing them would run all of it for every frame of this render.
// ---------------------------------------------------------------------------

export const schema = z.object({
  ink: z.string(),
  accent: z.string(), // ripe: a tool with direction
  accentDeep: z.string(), // deep: a tool the AIs have taken
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
    even: z.number(),
    iff: z.number(),
    theAIs: z.number(),
    can: z.number(),
    doAll: z.number(),
    technical: z.number(),
    work: z.number(),
    well: z.number(),
    have: z.number(),
    still: z.number(),
    doLot: z.number(),
    that: z.number(),
    and: z.number(),
    decide: z.number(),
    what: z.number(),
    we: z.number(),
    actually: z.number(),
    want: z.number(),
    end: z.number(), // next word "alignment"; tail to 149
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
  dotRadius: DOT_RADIUS,
  dotOpacity: OP_UNREAD_DOT,
  personSrc: "person.png",
  beats: {
    even: 0,
    iff: 6,
    theAIs: 12,
    can: 21,
    doAll: 25,
    technical: 34,
    work: 42,
    well: 52,
    have: 66,
    still: 73,
    doLot: 79,
    that: 91,
    and: 96,
    decide: 100,
    what: 108,
    we: 113,
    actually: 116,
    want: 122,
    end: 133,
  },
});

const WORLD_W = 1080;
const WORLD_H = 1920;
const CX = 540;

// The director's note: the focus belongs in the MIDDLE of the frame. The set's
// CAM_LIFT of 125 puts a content centre at screen y 835, under the captions;
// this piece uses 0, so the content centre lands at screen y 960.
const LIFT = 0;

// ---------------------------------------------------------------------------
// THE WEIGHT. Director, on the delivered V3: "the weight has to increase to
// match the person icon." The person is a SOLID filled silhouette; everything
// beside it — the rings, the four tool glyphs, the bubble's border, the trophy —
// is an outline, and at 3.5 world px those outlines read as a thinner family
// sitting next to a heavy one.
//
// So the foreground outline weight goes 3.5 -> 6.0 world px. That is not an
// arbitrary number: the glyph box is 69.6 world px, so a 6.0 world stroke
// solves back to 6.0 * 24 / 69.6 = 2.07 on Lucide's own 24 grid — i.e. the
// icons are now drawn at very nearly Lucide's native stroke 2, the weight the
// shapes were designed for, so nothing crowds and no glyph box has to shrink.
// (At 3.5 they were being drawn at 1.21, which is what made them spidery.)
//
// The two ink LINES (the rise out of the bubble and the row line it splits
// along) are midground: they sit on OP_MID behind the icons, so they take 4.5
// — heavier than before, a step under the foreground, which keeps the ladder.
// The field's dark traffic stays at 3: it is the field, not an outline.
const STROKE = 3; // the dark traffic in the crowds
const LINE_STROKE = 4.5; // the rise line and the row line — midground
const RING_STROKE = 6.0; // a ring, and with it every foreground outline
const BORDER_STROKE = RING_STROKE; // the thought bubble reads as one weight with the rest

// ---------------------------------------------------------------------------
// THE DEPTH LADDER. Director: "everything looks a bit too uniform — play around
// with the opacity of the dots and the icons and the borders to give it
// slightly more depth."
//
// Three rungs, and every mark in the piece sits on exactly one of them. Depth
// here is OPACITY and SIZE only: a dot's COLOUR still means its state (deep =
// the AIs have the tool, ripe = it has a direction), so the tone ladder is
// untouched and nothing about the story is carried by these numbers.
//
//   FG  1.00  the subject: the icon inside each ring, the trophy, the person,
//             the core of each crowd, every line head and packet.
//   MID 0.78  the containers: the station rings, the thought-bubble border and
//             its trail dots, the row line and the rise line. A border is the
//             box a thing is in, not the thing.
//   BG  0.55  the back of each crowd, at 0.8x radius and a little more drift.
//
// The crowd's split is by DISTANCE FROM THE RING with a hashed jitter on the
// threshold, so the falloff is a feathered band rather than a drawn circle:
// ~40% of each cluster ends up on the back rung, and which 40% wobbles.
// ---------------------------------------------------------------------------
const OP_FG = 1.0;
const OP_MID = 0.78;
const OP_BG = 0.55;
const BG_R_SCALE = 0.8; // a back dot is smaller as well as dimmer
const BG_DRIFT = 1.45; // ...and rides ~1.4 px more micro-drift
const DEPTH_CUT = 0.52; // normalised distance from the ring at which a dot goes back (~38% do)
const DEPTH_JITTER = 0.34; // hashed, so the band is feathered and not a ring
const R_SPREAD = 0.18; // +-18% hashed per-dot radius, across every cluster

// ---------------------------------------------------------------------------
// THE TECHNICAL WORK. Four tools in a row. The station device is the approved
// one from TheirOwnTraining: a ring of STATION_R with a Lucide glyph at 0.6 of
// its diameter inside it.
//
// ICON FAMILY PASS, on the director's note: "the weight of the technical icons
// is not consistent, some have sharp edges, some have soft edges, they look
// like they're taken from different icon packs." All four are now genuine
// Lucide 24-grid outline icons drawn under identical conventions — fill none,
// round caps, round joins, the same glyph box in every ring, and ONE stroke
// weight. The filled custom server-rack glyph (RACK_D, from TenTimesTheCost)
// is gone; Lucide `server` takes its place, so nothing in the row is a solid
// any more and the white -> deep -> ripe conversion now runs on `stroke`.
//
// The weight itself is set in WORLD px rather than in the 24 grid: Lucide's
// own stroke 2, scaled by the glyph box (69.6 / 24 = 2.9), lands at 5.8 world
// px against a ring drawn at 3.5, which is what made the glyphs read heavier
// than the circles around them. GLYPH_STROKE_WORLD ties the icon to the ring
// instead, and the local stroke is solved back out of the (breathing) box.
// At the weight pass's 6.0 that solves to 2.07 on the 24 grid: Lucide's own
// stroke, which is why the heavier ink does not crowd the server's rects or
// the wrench's head and no glyph box needed scaling down.
// ---------------------------------------------------------------------------
const GLYPH_STROKE_WORLD = RING_STROKE; // icon and ring read as one weight
const STATION_R = 58;
const STATION_Y = 790;
const STATION_X = [240, 440, 640, 840];
// The row line is masked at the rings (the Ajeya set masks its loop at the
// station rings): it runs between the tools, never through a glyph.
const RING_MASK = STATION_R + 8;
const maskedSegments = (x0: number, x1: number): [number, number][] => {
  const out: [number, number][] = [];
  let a = x0;
  for (const x of STATION_X) {
    const c0 = x - RING_MASK;
    const c1 = x + RING_MASK;
    if (c1 <= a) continue;
    if (c0 >= x1) break;
    if (c0 > a) out.push([a, c0]);
    a = Math.max(a, c1);
  }
  if (a < x1) out.push([a, x1]);
  return out;
};
const STATION_GLYPH_FRACTION = 0.6;

// Lucide, ISC, inlined verbatim as 24-unit icons (the d1Shared convention).
// Nothing here is redrawn or simplified: same grid, same commands, same order.
const ICON_CODE = `<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>`;
const ICON_WRENCH =
  `<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>`;
const ICON_CHART =
  `<path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>`;
const ICON_SERVER =
  `<rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/>`;

type Station = { x: number; glyph: string };
const STATIONS: Station[] = [
  { x: STATION_X[0], glyph: ICON_CODE },
  { x: STATION_X[1], glyph: ICON_WRENCH },
  { x: STATION_X[2], glyph: ICON_CHART },
  { x: STATION_X[3], glyph: ICON_SERVER },
];
const NST = STATIONS.length;

// ---------------------------------------------------------------------------
// THE PERSON. One glyph, on the column axis, below the row.
// ---------------------------------------------------------------------------
const GLYPH = 108;
const WAKE_LEAD = 17; // frames before "still" that he wakes — the camera is already on its way
const WAKE_DUR = 8;
const PERSON_Y = 1120; // centre of the 108 px box
const PERSON_INK_TOP = 40 / 512; // where the top of the head is in the box
const PERSON_FOOT = 471 / 512;
const HEAD_TOP_Y = PERSON_Y - GLYPH / 2 + GLYPH * PERSON_INK_TOP; // 1074.4
const FOOT_Y = PERSON_Y - GLYPH / 2 + GLYPH * PERSON_FOOT; // 1165.4

// ---------------------------------------------------------------------------
// THE THOUGHT BUBBLE. The approved device from SubvertTheInfrastructure: a
// squircle with the 22% corner (a thought is soft; the house 1.2% ratio reads
// as a sign) and the two dots that make it a thought and not a speech balloon.
// Above and to the RIGHT of the head, so the line it later sends up into the
// row lands between the chart and the rack — which is what makes those two the
// nearest tools and the code station the last.
// ---------------------------------------------------------------------------
const BUB_W = 200;
const BUB_H = 140;
const BUB_CX = 700;
const BUB_Y1 = 1058; // the bubble's foot
const BUB_Y0 = BUB_Y1 - BUB_H; // 918: its top, and where the line leaves
const BUB_RATIO = 0.22;
const BUB_PATH = squirclePath(BUB_W, BUB_H, BUB_RATIO);
// LEAD PASS. Director: "the person with the bubble and its icon can come in sooner
// — don't fit animations to word timing 1:1; think of the whole animation as
// one continuous, smooth, intentional, well-directed movement." So the bubble
// no longer waits for "do" (f79): it starts growing while the camera is still
// gliding in, and is settling as the trophy's cup starts.
const BUB_F0 = 62;
const BUB_F1 = 76;
const BUB_TRAIL = [
  { dx: -108, dy: 14, r: 7, t: 0 },
  { dx: -124, dy: 30, r: 4.5, t: 2 },
];
const BUB_TRAIL_DUR = 3;

// The decision itself. A `target` was tried here and read as an aim, a score,
// a bullseye — a thing to HIT, which is the opposite of the line. A `flag` was
// tried after it and read as a mission being set. The line is "decide what we
// actually WANT", so the thing in the bubble is now Lucide `trophy`: the prize
// itself, the thing wanted, with no instruction about how to get it.
//
// Drawn head-led, in the order a trophy is drawn, so it reads as being drawn
// and not as being switched on:
//   the cup — the closed bowl path              f76-86
//   the two handles, together                   f86-90
//   the stem pair, together                     f90-94
//   the base line                               f94-96
// It is FINISHED at f96, twenty-six frames before "want" at f122, so the word
// lands on a thought that is already whole and the payoff can be the line
// going out to the tools rather than the drawing itself. Same white ink, same
// round caps and joins, same GLYPH_STROKE_WORLD as the four tools and the
// rings, and the same glyph box (0.55 of the bubble height) the flag had.
const ICON_TROPHY_CUP = "M18 2H6v7a6 6 0 0 0 12 0V2Z";
const ICON_TROPHY_HANDLE_L = "M6 9H4.5a2.5 2.5 0 0 1 0-5H6";
const ICON_TROPHY_HANDLE_R = "M18 9h1.5a2.5 2.5 0 0 0 0-5H18";
const ICON_TROPHY_STEM_L = "M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22";
const ICON_TROPHY_STEM_R = "M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22";
const ICON_TROPHY_BASE = "M4 22h16";
// The trophy's INK box on the 24 grid: the two handle arcs bulge out to x 2
// and x 22, the cup's rim is y 2 and the base line is y 22. Unlike the flag,
// this one IS centred in its own 24 box — (12, 12) either way — but it is
// written out as the ink box so the glyph-box maths is the same everywhere.
const TROPHY_INK = { x0: 2, x1: 22, y0: 2, y1: 22 };
const TROPHY_BOX = 0.55 * BUB_H; // 77 world px tall, as the flag and the target were
const TROPHY_S = TROPHY_BOX / (TROPHY_INK.y1 - TROPHY_INK.y0); // 3.85
const TROPHY_CX = (TROPHY_INK.x0 + TROPHY_INK.x1) / 2;
const TROPHY_CYG = (TROPHY_INK.y0 + TROPHY_INK.y1) / 2;
const TARGET_CY = (BUB_Y0 + BUB_Y1) / 2; // the bubble's own centre
// Grid units -> world, for the stroke heads.
const trophyWorld = (gx: number, gy: number) => ({
  x: BUB_CX + (gx - TROPHY_CX) * TROPHY_S,
  y: TARGET_CY + (gy - TROPHY_CYG) * TROPHY_S,
});
const TR_CUP = [76, 86];
const TR_HANDLES = [86, 90];
const TR_STEMS = [90, 94];
const TR_BASE = [94, 96];

// The stroke heads. `strokeDashoffset` reveals a path by ARC LENGTH, so the
// head has to be placed by arc length too. Each path is resolved into cubic
// segments ONCE, at module scope, and walked into a length table — rather than
// asking the DOM for `getPointAtLength`, which would make the render depend on
// a live SVG element.
//
// The machinery only handles cubics, and the trophy has four quarter-circle
// arcs in it (one half-circle bowl, one half-circle per handle). Each quarter
// is converted to a single cubic with its control points 0.5523 * r along the
// tangents — the standard approximation, well under a tenth of a grid unit of
// error, which at TROPHY_S = 3.85 is under half a world pixel of head
// placement. The drawn `d` strings above still carry the real `a` commands, so
// only the head's position is approximate, never the ink.
const KAPPA = 0.5523;
// bowl: centre (12, 9), r 6, from (6,9) down through (12,15) to (18,9)
const BOWL_K = KAPPA * 6; // 3.3137
// handles: r 2.5, centres (4.5, 6.5) and (19.5, 6.5)
const HAND_K = KAPPA * 2.5; // 1.3807
const TROPHY_CUBICS: Record<string, number[][]> = {
  cup: [
    [18, 2, 18, 2, 6, 2, 6, 2], // H6
    [6, 2, 6, 2, 6, 9, 6, 9], // v7
    [6, 9, 6, 9 + BOWL_K, 12 - BOWL_K, 15, 12, 15], // a6 6, first quarter
    [12, 15, 12 + BOWL_K, 15, 18, 9 + BOWL_K, 18, 9], // ...second quarter
    [18, 9, 18, 9, 18, 2, 18, 2], // V2, then a zero-length z
  ],
  handleL: [
    [6, 9, 6, 9, 4.5, 9, 4.5, 9], // H4.5
    [4.5, 9, 4.5 - HAND_K, 9, 2, 6.5 + HAND_K, 2, 6.5], // a2.5 2.5, first quarter
    [2, 6.5, 2, 6.5 - HAND_K, 4.5 - HAND_K, 4, 4.5, 4], // ...second quarter
    [4.5, 4, 4.5, 4, 6, 4, 6, 4], // H6
  ],
  handleR: [
    [18, 9, 18, 9, 19.5, 9, 19.5, 9],
    [19.5, 9, 19.5 + HAND_K, 9, 22, 6.5 + HAND_K, 22, 6.5],
    [22, 6.5, 22, 6.5 - HAND_K, 19.5 + HAND_K, 4, 19.5, 4],
    [19.5, 4, 19.5, 4, 18, 4, 18, 4],
  ],
  stemL: [
    [10, 14.66, 10, 14.66, 10, 17, 10, 17], // V17
    [10, 17, 10, 17.55, 9.53, 17.98, 9.03, 18.21], // c0 .55 -.47 .98 -.97 1.21
    [9.03, 18.21, 7.85, 18.75, 7, 20.24, 7, 22], // C7.85 18.75 7 20.24 7 22
  ],
  stemR: [
    [14, 14.66, 14, 14.66, 14, 17, 14, 17],
    [14, 17, 14, 17.55, 14.47, 17.98, 14.97, 18.21],
    [14.97, 18.21, 16.15, 18.75, 17, 20.24, 17, 22],
  ],
  base: [[4, 22, 4, 22, 20, 22, 20, 22]], // h16
};

type Walk = { pts: { x: number; y: number; s: number }[]; total: number };
const walkCubics = (cubics: number[][]): Walk => {
  const pts: { x: number; y: number; s: number }[] = [];
  let s = 0;
  let px = cubics[0][0];
  let py = cubics[0][1];
  pts.push({ x: px, y: py, s: 0 });
  for (const c of cubics) {
    for (let i = 1; i <= 24; i++) {
      const t = i / 24;
      const u = 1 - t;
      const x = u * u * u * c[0] + 3 * u * u * t * c[2] + 3 * u * t * t * c[4] + t * t * t * c[6];
      const y = u * u * u * c[1] + 3 * u * u * t * c[3] + 3 * u * t * t * c[5] + t * t * t * c[7];
      s += Math.hypot(x - px, y - py);
      pts.push({ x, y, s });
      px = x;
      py = y;
    }
  }
  return { pts, total: s };
};
const TROPHY_WALKS: Record<string, Walk> = Object.fromEntries(
  Object.entries(TROPHY_CUBICS).map(([key, cubics]) => [key, walkCubics(cubics)]),
);
const strokeHead = (walk: Walk, u: number) => {
  const want = clamp01(u) * walk.total;
  const p = walk.pts;
  let i = 1;
  while (i < p.length - 1 && p[i].s < want) i++;
  const a = p[i - 1];
  const b = p[i];
  const t = b.s === a.s ? 0 : (want - a.s) / (b.s - a.s);
  return trophyWorld(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
};

// The six strokes, in drawing order, each with the window it is drawn in.
const TROPHY_STROKES: { key: string; d: string; win: number[] }[] = [
  { key: "cup", d: ICON_TROPHY_CUP, win: TR_CUP },
  { key: "handleL", d: ICON_TROPHY_HANDLE_L, win: TR_HANDLES },
  { key: "handleR", d: ICON_TROPHY_HANDLE_R, win: TR_HANDLES },
  { key: "stemL", d: ICON_TROPHY_STEM_L, win: TR_STEMS },
  { key: "stemR", d: ICON_TROPHY_STEM_R, win: TR_STEMS },
  { key: "base", d: ICON_TROPHY_BASE, win: TR_BASE },
];

// ---------------------------------------------------------------------------
// THE CROWDS. One feathered, wobbling annulus of seats around each tool: the
// dots press on the tool from outside its ring and never sit on it. Squashed
// 0.80 in y so four of them 200 px apart stay four crowds.
// ---------------------------------------------------------------------------
const SEAT_STEP = 16;
const ANN_R0 = 68;
const ANN_R1 = 98;
const ANN_YS = 0.82;
const ANN_FEATHER = 1.2;

type Seat = { x: number; y: number; r: number; back: boolean };

const SEATS: Seat[][] = STATIONS.map((st, s) => {
  const out: Seat[] = [];
  const half = ANN_R1 + SEAT_STEP;
  const n = Math.ceil((2 * half) / SEAT_STEP) + 1;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const i = s * 997 + r * n + c;
      const x = st.x - half + c * SEAT_STEP + (hash(i, 11) - 0.5) * SEAT_STEP * 0.85;
      const y =
        STATION_Y -
        half * ANN_YS +
        r * SEAT_STEP * ANN_YS +
        (hash(i, 12) - 0.5) * SEAT_STEP * ANN_YS * 0.85;
      const dx = x - st.x;
      const dy = (y - STATION_Y) / ANN_YS;
      const rr = Math.hypot(dx, dy);
      if (rr < ANN_R0) continue;
      const rOut = ANN_R1 + wobble(Math.atan2(dy, dx) * WOBBLE_R, 1.7 + s) * 6;
      const f = feather((rOut - rr) / SEAT_STEP, ANN_FEATHER);
      if (hash(i, 71) >= f) continue;
      // The depth ladder's crowd split: how far out of the annulus this seat
      // sits, 0 at the ring and 1 at the nominal outer edge, plus a hashed
      // jitter so the boundary between core and back is a feathered band.
      const depth = clamp01(
        (rr - ANN_R0) / (ANN_R1 - ANN_R0) + (hash(i, 23) - 0.5) * DEPTH_JITTER,
      );
      out.push({
        x,
        y,
        // the seat's own size, times the ladder's +-18% per-dot spread
        r:
          (0.78 + 0.44 * hash(i, 13)) *
          (0.72 + 0.28 * f) *
          (1 + (hash(i, 27) - 0.5) * 2 * R_SPREAD),
        back: depth > DEPTH_CUT,
      });
    }
  }
  return out;
});

// Which seats stay empty, so the mill always has somewhere to hop. Blue noise,
// as in V3: the highest-hashed seat that has no empty neighbour yet, over and
// over, so every vacancy is a single gap with dots all around it.
const SPARE_PER_STATION = 14;
const NEAR = SEAT_STEP * 1.5;

const EMPTY: Uint8Array[] = SEATS.map((seats, s) => {
  const empty = new Uint8Array(seats.length);
  const want = Math.min(SPARE_PER_STATION, Math.max(0, seats.length - 8));
  const order = seats.map((_, i) => i).sort((a, b) => hash(b + s * 31, 77) - hash(a + s * 31, 77));
  const near = (a: number, b: number) =>
    Math.hypot(seats[a].x - seats[b].x, (seats[a].y - seats[b].y) / ANN_YS) < NEAR;
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
  return empty;
});

// ---------------------------------------------------------------------------
// THE ARRIVAL. Every dot comes from beyond a frame edge on its own arc. The
// nearest seat is taken first, so each crowd fills from the side it came from.
// Each station completes on its own frame; a station's ring and glyph start
// converting white -> ACCENT_DEEP the moment its first dot seats.
// ---------------------------------------------------------------------------
const LAND_FIRST = [18, 24, 31, 37];
const LAND_LAST = [24, 32, 40, 46];
const ENTRY_X = [20, 20, 1060, 1060]; // off-frame at every camera position
const DEEP_DUR = 8; // white -> ACCENT_DEEP, the approved conversion
const SPEED_CAP_SCREEN = 45;
const K_MAX_ARRIVE = 1.24;
const ARRIVE_SPEED = SPEED_CAP_SCREEN / K_MAX_ARRIVE; // 36.3 world px/frame

type Dot = {
  st: number;
  seat: number; // index into SEATS[st]
  ex: number;
  ey: number;
  land: number;
  launch: number;
  bow: number;
  r: number;
  back: boolean; // on the depth ladder's back rung: dimmer, smaller, driftier
};

const DOTS: Dot[] = [];
const FIRST_SEAT: number[] = [];
SEATS.forEach((seats, s) => {
  const taken = seats.map((_, i) => i).filter((i) => !EMPTY[s][i]);
  const ex = ENTRY_X[s];
  const entryY = (i: number) => 660 + hash(i + s * 313, 33) * 280;
  const withDist = taken.map((i) => ({
    i,
    ey: entryY(i),
    d: Math.hypot(seats[i].x - ex, seats[i].y - entryY(i)),
  }));
  withDist.sort((a, b) => a.d - b.d);
  const n = withDist.length;
  withDist.forEach((w, rank) => {
    const land = Math.round(
      LAND_FIRST[s] + ((LAND_LAST[s] - LAND_FIRST[s]) * rank) / Math.max(1, n - 1),
    );
    const flight =
      Math.max(6, Math.ceil(w.d / ARRIVE_SPEED)) + Math.floor(hash(w.i + s * 71, 34) * 4);
    DOTS.push({
      st: s,
      seat: w.i,
      ex,
      ey: w.ey,
      land,
      launch: land - flight,
      bow: (hash(w.i + s * 53, 35) - 0.5) * 90,
      r: seats[w.i].r,
      back: seats[w.i].back,
    });
  });
  FIRST_SEAT.push(LAND_FIRST[s]);
});
const N = DOTS.length;

// ---------------------------------------------------------------------------
// THE MILL. One hop to a vacant neighbouring seat every five frames PER
// CLUSTER, from the frame that cluster's first dot seats through to the last
// frame. It never stops; there is no hold in this piece where the crowds are
// still. Simulated once at module scope so the occupancy map is shared.
// ---------------------------------------------------------------------------
const MILL_RATE = 0.7; // per cluster: a hop every ~2 frames (see the energy audit)
const MILL_DUR = 12;
const HOP_REACH = SEAT_STEP * 1.55;

type Hop = { from: number; to: number; t0: number };

const HOPS: Hop[][] = DOTS.map(() => []);
(() => {
  SEATS.forEach((seats, s) => {
    const nb: number[][] = seats.map((a) =>
      seats
        .map((b, j) => ({ b, j }))
        .filter(({ b, j }) => b !== a && Math.hypot(b.x - a.x, (b.y - a.y) / ANN_YS) <= HOP_REACH)
        .map(({ j }) => j),
    );
    const mine = DOTS.map((d, i) => ({ d, i })).filter(({ d }) => d.st === s);
    const seatOf = new Int32Array(mine.length);
    const occupied = new Int32Array(seats.length).fill(-1);
    mine.forEach((m, j) => {
      seatOf[j] = m.d.seat;
    });
    const busyUntil = new Float64Array(mine.length).fill(-1);
    let acc = 0;
    let id = 0;
    for (let f = LAND_FIRST[s]; f <= DURATION; f++) {
      // a dot only joins the mill once it has actually landed
      mine.forEach((m, j) => {
        if (m.d.land === f) occupied[seatOf[j]] = j;
      });
      acc += MILL_RATE;
      while (acc >= 1) {
        acc -= 1;
        const jj = id++;
        // Scan for a dot that is free to move AND has a vacant neighbouring
        // seat. Vacancies are blue noise, so most dots have none; taking the
        // first free dot and giving up when it is boxed in throttles the mill
        // to a fraction of its rate, and the holds go dead.
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
// THE DECISION'S LINE. Up out of the bubble into the row, then left and right
// along it. As the head reaches a tool, that tool (ring, glyph and crowd) goes
// ACCENT_DEEP -> ACCENT: they now have a direction.
// ---------------------------------------------------------------------------
// LEAD PASS: the rise leaves the bubble at f100 and reaches the row at f108,
// and the split runs f108 to ~f126 — so "want" (f122) lands in the MIDDLE of
// the payoff, with the last two tools still lighting, instead of starting it.
// The pull-back begins at f108 with the rise, so the reveal and the payoff are
// one motion and not two.
const RISE_F0 = 100;
const RISE_F1 = 108;
const JUNC_X = BUB_CX;
const RIPE_DUR = 5;
const PACKET_F0 = 128;
// The split's speed is authored in SCREEN px/frame, not world px/frame. It runs
// while the camera is pulling back out of the centred stretch, so a fixed world
// speed is a head that is far over the set's 45 screen px/frame cap on the
// first frames and far under it on the last. HEAD_CAP holds the head at one
// legible screen speed and lets the world speed rise as k falls, with
// SPLIT_MAX as a ceiling so it never outruns a plain line. Integrated frame by
// frame (SPREAD, below the camera, because it needs k), that holds one legible
// head at any centred k, which is what lets the camera be rekeyed without
// moving a single one of the row's landings by hand.
const HEAD_CAP = 40; // screen px/frame for the split head
const SPLIT_MAX = 36; // world px/frame ceiling

// ---------------------------------------------------------------------------
// DARK TRAFFIC. Idle accent threads between neighbouring dots at 0.12, at the
// house rate. A dot that has not landed carries none.
// ---------------------------------------------------------------------------
const TRAFFIC_N = idleThreads(N);
const TRAFFIC_REACH = 74;

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
// THE CAMERA. fieldShared's `camMove`, with CAM_LIFT swapped for this piece's
// LIFT of 0 (the director wants the focus in the middle of the frame), and
// with a THIRD axis: cx. The set's cameras only ever tilt, so `camMove` only
// ever wrote cy — but the subject of the middle of this cut (the person AND
// the bubble that grows off his head) has its centre at world x 686, not on
// the column axis at 540, so a camera that only tilts cannot put that group in
// the middle of the frame. cx runs through the same eased key-per-frame track
// and the same damper, so it is the same move, sideways.
//
// CENTRING PASS, on the director's note that the old tilt "lands with the
// person low and the row still dominant": from the landing through the whole
// trophy draw, the SUBJECT GROUP — the person glyph plus the thought
// bubble, as one thing — is centred at screen (540, 960).
//
//   measured group bounds, once the bubble is up:
//     x 571.5 (the far trail dot) .. 800 (the bubble's right edge)
//     y 918   (the bubble's top)  .. 1174 (the foot of the person's box)
//   centre (686, 1046); GROUP_X / GROUP_Y are the V4 numbers (640, 1020),
//   which puts the person well inside the left of the frame and the bubble a
//   little right of centre — the group reads as a pair rather than as one
//   object pinned to the middle.
//
//   k over the centred stretch is 1.62: the group's framing box — world
//   x 470-850, the person and the bubble with their breathing room — is then
//   616 screen px, 57% of the frame width. The row of tools leaves the top and
//   the left of the frame here; that is the trade.
//
// SMOOTHNESS PASS. Director, on the delivered V3: "camera movement still a
// little janky." V3's track was ELEVEN segments — two creeps, a 14-frame
// reframe carrying a cx jump, four hold drifts that each changed direction, a
// six-frame dead stop, a push, a pull-back and a tail. Every one of those
// joins was smooth on its own (camMove's ease has zero slope at both ends) and
// the sum still read as fidgeting, because the camera kept changing its MIND:
// eleven decisions in 149 frames is a hand that never commits.
//
// This is the same cut as FOUR decisions, and the hand commits to each one:
//
//   f0-44     k 1.07 -> 1.20,  x 540,       c 940 -> 905   ONE slow glide,
//                                                          riding the tools
//                                                          being taken.
//                                                          warp 0.65 (see below)
//   f44-70    k -> 1.62,       x -> 640,    c -> 1020      ONE long eased glide
//                                                          onto the person and
//                                                          his bubble. warp
//                                                          0.85 puts the speed
//                                                          early and leaves a
//                                                          long ease-out, so
//                                                          there is no landing
//                                                          click — it begins
//                                                          while the last tool
//                                                          is still being taken
//                                                          and is still settling
//                                                          as the bubble grows.
//   f70-108   k -> 1.642,      x -> 645,    c -> 1027      the SAME direction,
//                                                          continued as a drift
//                                                          and decaying (warp
//                                                          0.6: the speed is in
//                                                          the first third and
//                                                          it eases out). No
//                                                          push, no dead stop.
//                                                          The only still moment
//                                                          is the natural bottom
//                                                          of this ease, around
//                                                          f104-108, and it runs
//                                                          straight into
//   f108-140  k -> 1.10,       x -> 540,    c -> 931       ONE long eased
//                                                          pull-back to the
//                                                          whole picture,
//                                                          starting exactly as
//                                                          the line rises out of
//                                                          the bubble. warp 0.8.
//   f140-149  k -> 1.086,      x -> 536,    c -> 928       the pull-back's own
//                                                          direction, decaying.
//
// Every join is C1: camMoveLift emits a key per frame on an eased curve whose
// slope is zero at both ends for warp > 0.5, and consecutive segments share
// their endpoint value, so the damper's target has no corner anywhere. Measured
// on the code ring as a fixed world point (scratchpad cam4.txt): peak frame-to-
// frame acceleration is 0.55 screen px/frame^2 over the whole piece, against a
// budget of 2.5.
//
// K_CENTRE comes down 1.70 -> 1.62 with the brief: the group's framing box
// (world x 470-850) is then 616 screen px, 57% of the frame width, and GROUP_X
// 680 -> 640 leaves the person a little further into the frame at the wider k.
// ---------------------------------------------------------------------------
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

const GROUP_X = 640; // the person + bubble group's centre, at the centred k
const GROUP_Y = 1020;
const K_CENTRE = 1.62; // the group at ~57% of the frame width
// The hold between the glide and the pull-back is not a hold: it is the glide's
// own direction, continued and decaying. Small deltas, because ~0.6 screen
// px/frame over 38 frames is only about fifteen screen px of travel.
const DRIFT_K = 0.022;
const DRIFT_X = 5;
const DRIFT_Y = 7;

const CAM_SEGS = [
  // 1. one slow glide, riding the tools being taken
  // warp 0.65, not the briefed 1: a plain smoothstep over 44 frames idles for
  // its first ten (0.31 screen px/frame at f1-4), and the standing scene went
  // measurably deader than the approved cut there — motion energy 0.198 against
  // its 0.327 floor. 0.65 is still zero-slope at both ends, so nothing about
  // the join changes; it just puts the creep's speed where the brief's word
  // "linear-ish" asks for it. Peak |dv| over the whole 44 frames is 0.16.
  camMoveLift({ f0: 0, f1: 44, k0: 1.07, k1: 1.2, c0: 940, c1: 905, x0: CX, x1: CX, warp: 0.65 }),
  // 2. one long eased glide onto the person and his bubble
  camMoveLift({
    f0: 44,
    f1: 70,
    k0: 1.2,
    k1: K_CENTRE,
    c0: 905,
    c1: GROUP_Y,
    x0: CX,
    x1: GROUP_X,
    warp: 0.85,
  }),
  // 3. the same direction, continued and decaying
  camMoveLift({
    f0: 70,
    f1: 108,
    k0: K_CENTRE,
    k1: K_CENTRE + DRIFT_K,
    c0: GROUP_Y,
    c1: GROUP_Y + DRIFT_Y,
    x0: GROUP_X,
    x1: GROUP_X + DRIFT_X,
    warp: 0.6,
  }),
  // 4. one long eased pull-back to the whole picture, starting with the rise
  camMoveLift({
    f0: 108,
    f1: 140,
    k0: K_CENTRE + DRIFT_K,
    k1: 1.1,
    c0: GROUP_Y + DRIFT_Y,
    c1: 931,
    x0: GROUP_X + DRIFT_X,
    x1: CX,
    warp: 0.8,
  }),
  // 5. the pull-back's own direction, decaying
  camMoveLift({
    f0: 140,
    f1: DURATION,
    k0: 1.1,
    k1: 1.086,
    c0: 931,
    c1: 928,
    x0: CX,
    x1: 536,
    warp: 0.6,
  }),
];

const CAM = (() => {
  const F = [0];
  const K = [1.07];
  const CY = [940 + LIFT / 1.07];
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

// The resolved zoom, per frame — the split below is authored in screen px and
// the camera is the only thing that knows how big a world px is.
const K_AT: number[] = (() => {
  const out: number[] = [];
  for (let f = 0; f <= DURATION; f++) out.push(runCamera(f, CAM.F, CAM.CY, CAM.K).k);
  return out;
})();

// How far the split has travelled along the row, integrated frame by frame at
// HEAD_CAP screen px/frame (SPLIT_MAX world px/frame once the camera is wide
// enough that the cap stops binding). REACHED is the fractional frame each
// station's crowd starts going ripe.
const SPREAD: number[] = (() => {
  const out: number[] = [];
  for (let f = 0; f <= DURATION; f++) {
    out.push(f <= RISE_F1 ? 0 : out[f - 1] + Math.min(SPLIT_MAX, HEAD_CAP / K_AT[f]));
  }
  return out;
})();
const spreadAt = (f: number) => SPREAD[Math.max(0, Math.min(DURATION, Math.round(f)))];
const REACHED = STATION_X.map((x) => {
  const d = Math.abs(x - JUNC_X);
  for (let f = RISE_F1 + 1; f <= DURATION; f++) {
    if (SPREAD[f] >= d) return f - 1 + (d - SPREAD[f - 1]) / (SPREAD[f] - SPREAD[f - 1]);
  }
  return DURATION;
});
const SPLIT_END = Math.max(...REACHED);

// ---------------------------------------------------------------------------

const StillDecideWhatWeWantV2: React.FC<Props> = ({
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
  const toDeep = makeTone(ink, accentDeep); // white -> the AIs have it
  const toRipe = makeTone(accentDeep, accent); // -> and now it has a direction

  // -- camera ----------------------------------------------------------------
  const cam = runCamera(frame, CAM.F, CAM.CY, CAM.K);
  // The same damper, handed the cx track: `runCamera` damps whatever it is
  // given as its "cy", so one more call is the sideways half of the move.
  const camX = runCamera(frame, CAM.F, CAM.CX, CAM.K).cy;
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = camX + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);

  // -- the tools' two conversions --------------------------------------------
  const deepT = STATIONS.map((_, s) => clamp01((frame - FIRST_SEAT[s]) / DEEP_DUR));
  const ripeT = STATIONS.map((_, s) => clamp01((frame - REACHED[s]) / RIPE_DUR));
  const stationColour = (s: number) =>
    ripeT[s] > 0 ? toRipe(ripeT[s]) : toDeep(smoothstep(deepT[s]));

  // -- the dots --------------------------------------------------------------
  const dots = DOTS.map((d, i) => {
    if (frame < d.launch) return null;
    const seats = SEATS[d.st];

    // where its seat is right now — the mill moves it from seat to seat
    let sx: number;
    let sy: number;
    let moving = 0;
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
      const bow = Math.sin(Math.PI * e) * (hash(i, 61) - 0.5) * 8;
      sx = A.x + dx * e + (-dy / L) * bow;
      sy = A.y + dy * e + (dx / L) * bow;
      moving = clamp01(Math.min(u, 1 - u) / 0.2);
    } else {
      sx = seats[cur].x;
      sy = seats[cur].y;
    }

    let x = sx;
    let y = sy;
    let fade = 1;
    if (frame < d.land) {
      // still in flight: its own arc, decelerating into the seat
      const u = clamp01((frame - d.launch) / (d.land - d.launch));
      const e = arriveEase(u);
      const dx = sx - d.ex;
      const dy = sy - d.ey;
      const L = Math.hypot(dx, dy) || 1;
      const bow = Math.sin(Math.PI * e) * d.bow;
      x = d.ex + dx * e + (-dy / L) * bow;
      y = d.ey + dy * e + (dx / L) * bow;
      moving = clamp01(Math.min(u, 1 - u) / 0.18);
      fade = clamp01((frame - d.launch) / 2);
    }

    // the depth ladder: a back dot rides a little more of the drift
    const md = micro(i, frame);
    const dm = d.back ? BG_DRIFT : 1;
    return {
      x: x + md.dx * dm,
      y: y + md.dy * dm,
      st: d.st,
      r: d.r * (d.back ? BG_R_SCALE : 1),
      back: d.back,
      moving,
      fade,
      landed: frame >= d.land,
    };
  });

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

  // -- the bubble ------------------------------------------------------------
  const bub = ease((frame - BUB_F0) / (BUB_F1 - BUB_F0), EASE_ARRIVE);
  // it grows out of the head: the scale origin is the bubble corner nearest it
  const bubOrigin = { x: BUB_CX - BUB_W / 2, y: BUB_Y1 };

  // -- the trophy ------------------------------------------------------------
  // Six strokes, drawn head-led in order: cup, handles, stems, base.
  const trophy = TROPHY_STROKES.map((st) => ({
    ...st,
    u: clamp01((frame - st.win[0]) / (st.win[1] - st.win[0])),
  }));

  // -- the decision's line ---------------------------------------------------
  const rise = clamp01((frame - RISE_F0) / (RISE_F1 - RISE_F0));
  const riseY = BUB_Y0 + (STATION_Y - BUB_Y0) * rise;
  const spread = spreadAt(frame);
  const leftX = Math.max(STATION_X[0], JUNC_X - spread);
  const rightX = Math.min(STATION_X[NST - 1], JUNC_X + spread);
  const lineHead =
    rise > 0 && rise < 1
      ? { x: JUNC_X, y: riseY }
      : frame >= RISE_F1 && frame < SPLIT_END
        ? { x: leftX, y: STATION_Y }
        : null;

  // one packet running the landed line, bubble -> row, every ten frames
  const packetAt = (f: number) => {
    if (f < PACKET_F0) return null;
    const p = packetsOn({
      frame: f,
      k,
      from: { x: JUNC_X, y: BUB_Y0 },
      to: { x: JUNC_X, y: STATION_Y },
      period: 10,
      phase: PACKET_F0,
      speed: 14,
      opacity: 1,
      seed: 3,
    });
    return p.length === 0 ? null : p[0];
  };

  // -- the person ------------------------------------------------------------
  const swayX = (1.5 / k) * Math.sin(frame * 0.083 + 0.9);
  const swayY = (1.2 / k) * Math.sin(frame * 0.061 + 2.4);
  // Wake. LEAD PASS: the person lifts f56-64, seventeen frames before "still"
  // and while the camera is still gliding onto him, so he is already awake when
  // the bubble starts growing at f62 rather than reacting to the word.
  const wakeF0 = beats.still - WAKE_LEAD; // 56
  const wakeF1 = wakeF0 + WAKE_DUR; // 64
  const lift =
    frame < wakeF1
      ? 4 * smoothstep((frame - wakeF0) / WAKE_DUR)
      : 4 * (1 - smoothstep((frame - wakeF1) / WAKE_DUR));

  const glyphBox = 2 * STATION_R * STATION_GLYPH_FRACTION;

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
            {/* dark traffic: the crowds are unlooked-at, not dead. No heads. */}
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
                dimmer, then its core over the top of it. Tone still means
                state — only opacity and size say how far back a dot is. */}
            {[true, false].map((backPass) =>
              dots.map((d, i) =>
                d === null || d.back !== backPass ? null : (
                  <circle
                    key={`${backPass ? "b" : "c"}${i}`}
                    cx={d.x}
                    cy={d.y}
                    r={dotRadius * d.r * breath(frame, hash(i, 9)) * (1 + 0.22 * d.moving)}
                    fill={ripeT[d.st] > 0 ? toRipe(ripeT[d.st]) : accentDeep}
                    opacity={dotOpacity * (d.back ? OP_BG : OP_FG) * d.fade}
                  />
                ),
              ),
            )}

            {/* the decision's line: up out of the bubble, then along the row */}
            <g style={{ filter: icon }}>
              {rise > 0 ? (
                <line
                  x1={JUNC_X}
                  y1={BUB_Y0}
                  x2={JUNC_X}
                  y2={riseY}
                  stroke={ink}
                  strokeWidth={LINE_STROKE}
                  strokeLinecap="round"
                  opacity={OP_MID}
                />
              ) : null}
              {frame >= RISE_F1
                ? maskedSegments(leftX, rightX).map(([a, b], i) => (
                    <line
                      key={i}
                      x1={a}
                      y1={STATION_Y}
                      x2={b}
                      y2={STATION_Y}
                      stroke={ink}
                      strokeWidth={LINE_STROKE}
                      strokeLinecap="round"
                      opacity={OP_MID}
                    />
                  ))
                : null}
              {lineHead ? (
                <circle cx={lineHead.x} cy={lineHead.y} r={4.5 / k} fill={ink} />
              ) : null}
              {frame >= RISE_F1 && frame < SPLIT_END ? (
                <circle cx={rightX} cy={STATION_Y} r={4.5 / k} fill={ink} />
              ) : null}
            </g>

            {/* the tools. White until the AIs take them, deep until the person
                gives them a direction. */}
            <g style={{ filter: icon }}>
              {STATIONS.map((st, s) => {
                const colour = stationColour(s);
                const br = 1 + 0.012 * Math.sin(frame * 0.09 + hash(s, 44) * 6.283);
                const bob = 1.4 * Math.sin(frame * 0.072 + hash(s, 45) * 6.283);
                const g = glyphBox * br;
                return (
                  <g key={s}>
                    {/* the ring is the container: one rung back from its icon */}
                    <circle
                      cx={st.x}
                      cy={STATION_Y + bob}
                      r={STATION_R * br}
                      fill="none"
                      stroke={colour}
                      strokeWidth={RING_STROKE}
                      opacity={OP_MID}
                    />
                    {/* the icon: genuine Lucide on the 24 grid, identical
                        conventions in all four rings, and a local stroke
                        solved so the WORLD weight equals the ring's */}
                    <g
                      transform={`translate(${st.x - g / 2} ${STATION_Y + bob - g / 2}) scale(${g / 24})`}
                      fill="none"
                      stroke={colour}
                      strokeWidth={(GLYPH_STROKE_WORLD * 24) / g}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity={OP_FG}
                      dangerouslySetInnerHTML={{ __html: st.glyph }}
                    />
                  </g>
                );
              })}
            </g>

            {/* the thought bubble, and the target the person decides in it */}
            {bub > 0 ? (
              <g style={{ filter: icon }}>
                {BUB_TRAIL.map((p, j) => {
                  const s = smoothstep((frame - BUB_F0 - p.t) / BUB_TRAIL_DUR);
                  return s <= 0 ? null : (
                    <circle
                      key={j}
                      cx={BUB_CX + p.dx}
                      cy={BUB_Y1 + p.dy}
                      r={p.r * s}
                      fill={ink}
                      opacity={OP_MID}
                    />
                  );
                })}
                <g
                  transform={`translate(${bubOrigin.x} ${bubOrigin.y}) scale(${(0.06 + 0.94 * bub).toFixed(4)}) translate(${-bubOrigin.x} ${-bubOrigin.y})`}
                  opacity={clamp01(bub / 0.18)}
                >
                  <path
                    d={BUB_PATH}
                    transform={`translate(${BUB_CX - BUB_W / 2} ${BUB_Y0})`}
                    fill="none"
                    stroke={ink}
                    strokeWidth={BORDER_STROKE}
                    strokeLinecap="round"
                    opacity={OP_MID}
                  />
                  {/* the thing wanted. Cup, then handles, then stems, then base. */}
                  <g
                    transform={`translate(${BUB_CX} ${TARGET_CY}) scale(${TROPHY_S}) translate(${-TROPHY_CX} ${-TROPHY_CYG})`}
                    fill="none"
                    stroke={ink}
                    strokeWidth={GLYPH_STROKE_WORLD / TROPHY_S}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={OP_FG}
                  >
                    {trophy.map((st) =>
                      st.u > 0 ? (
                        <path
                          key={st.key}
                          d={st.d}
                          pathLength={1}
                          strokeDasharray="1 1"
                          strokeDashoffset={1 - st.u}
                        />
                      ) : null,
                    )}
                  </g>
                  {/* the stroke heads, in screen-space radius */}
                  {trophy.map((st) => {
                    if (st.u <= 0 || st.u >= 1) return null;
                    const h = strokeHead(TROPHY_WALKS[st.key], st.u);
                    return <circle key={st.key} cx={h.x} cy={h.y} r={4 / k} fill={ink} />;
                  })}
                </g>
              </g>
            ) : null}

            {/* signal on the landed line */}
            <Packet frame={frame} k={k} at={packetAt} opacity={0.6} />
          </svg>

          {/* the person: white, with the small shadow that makes a glyph read
              as a thing standing on the field. Sways, and lifts before it
              acts. */}
          <Img
            src={staticFile(personSrc)}
            style={{
              position: "absolute",
              left: CX - GLYPH / 2 + swayX,
              top: PERSON_Y - GLYPH / 2 + swayY - lift / k,
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

export default StillDecideWhatWeWantV2;

// Referenced so the beats object is a real contract and not decoration: the
// piece reads `beats.still` for the person's wake, and these are the frames
// every gesture above is keyed to.
export const BEAT_CHECK = {
  arrive: defaultProps.beats.theAIs,
  work: defaultProps.beats.work,
  still: defaultProps.beats.still,
  that: defaultProps.beats.that,
  decide: defaultProps.beats.decide,
  want: defaultProps.beats.want,
  end: defaultProps.beats.end,
};
export const CAM_AT = (f: number) => runCamera(f, CAM.F, CAM.CY, CAM.K);
export const MILL_STATS = {
  hops: HOPS.reduce((a, h) => a + h.length, 0),
  inFlightAt: [60, 80, 100, 140].map((f) =>
    HOPS.filter((h) => h.some((q) => f >= q.t0 && f < q.t0 + MILL_DUR)).length,
  ),
};
export const DEPTH_STATS = {
  fg: OP_FG,
  mid: OP_MID,
  bg: OP_BG,
  backDots: DOTS.filter((d) => d.back).length,
  total: N,
  perStation: SEATS.map((_, s) => {
    const mine = DOTS.filter((d) => d.st === s);
    return `${mine.filter((d) => d.back).length}/${mine.length}`;
  }),
  glyphStrokeWorld: GLYPH_STROKE_WORLD,
  ringStrokeWorld: RING_STROKE,
  reached: REACHED.map((r) => Number(r.toFixed(1))),
};
export const DRAWN_BOUNDS = {
  top: STATION_Y - ANN_R1 * ANN_YS,
  bottom: FOOT_Y,
  left: STATION_X[0] - ANN_R1,
  right: STATION_X[NST - 1] + ANN_R1,
  headTop: HEAD_TOP_Y,
  dots: N,
  seats: SEATS.map((s) => s.length),
};
