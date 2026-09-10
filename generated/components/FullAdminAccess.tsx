import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  BG_BASE,
  BG_DIM,
  CAM_LIFT,
  DOT_RADIUS,
  GridBackground,
  ICON_SHADOW_BLUR,
  ICON_SHADOW_OPACITY,
  ICON_SHADOW_Y,
  OP_READ,
  OP_UNREAD_DOT,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  TONE_STEPS,
  Vignette,
  breath,
  camMove,
  clamp,
  clamp01,
  hash,
  iconShadow,
  idleThreads,
  makeTone,
  runCamera,
  sway,
  worldTransform,
} from "./fieldShared";
// Cut 1. The world's geometry: the box, the seat grid, the tiles, the internet
// ring and its wifi glyph, the gate, the mark, the camera's original key track.
import {
  BOX_PATH,
  BOX_X0,
  BOX_Y0,
  CAM_CY,
  CENTRE_X,
  GATE_DASH,
  GATE_GAP,
  GATE_X0,
  GATE_X1,
  LINE_TIP_Y,
  MARK,
  NSEAT,
  RING,
  SEATS,
  STROKE,
  TILES,
  TILE_HALF,
  TILE_PATH,
  TONE_DUR,
  WIFI,
  WORLD_H,
  WORLD_W,
  smooth,
} from "./ImpossibleTasks";
// Cut 2. The farm, the neighbours, the pump, the batched draw helpers.
import {
  FARM_COLS,
  NEIGHBOURS,
  OUR,
  PITCH_X,
  PUMP_CAP,
  PUMP_PULL,
  REACHES,
  THREAD_OP_STEPS,
  type Th,
  WAVE2,
  dotPaths,
  idleFor,
  onScreen,
  pumpAt,
  threadPaths,
} from "./TryToHackOut";
// Cut 3. The rail, the pipes, the hub with its parcel glyph, the node/route
// model, the packet mechanism and its one traffic speed, the frozen scars.
import {
  AGENT_CLICK,
  BEAD_R,
  HEAD_R,
  HUB,
  HUB_BOT,
  HUB_CLICK,
  HUB_LEFT,
  HUB_RIGHT,
  HUB_TOP,
  OUR_AGENT,
  OUR_TILES,
  type P,
  PIPE_BOT_Y,
  PIPE_TOP_Y,
  RAIL_X0,
  RAIL_X1,
  RAIL_Y,
  RING_R,
  RING_STROKE,
  type Route,
  SCARS,
  TAIL_SAMPLES,
  V_TRAFFIC,
  makeRoute,
  pointAt,
} from "./TalkThroughArtifactory";
// Cut 4. The crack, the exploit route, the six ringed agents and the pair
// tables, the hub's own centre, the accent the route is already drawn at.
import {
  CRACK_MID,
  CRACK_SPLIT,
  HUB_C,
  NODES6,
  OUR_AGENT_2,
  PAIRS6,
  RINGED_IN,
  ROUTES6,
  ROUTE_OP,
  ringPt,
} from "./ReachTheOutsideInternet";
// Cut 5. The crack's settled half-angle, the exploit route as one drawn path,
// and the two traffic cadences this cut carries: the rail every 3 and the
// gateway every 4.
import {
  CRACK_HALF,
  EXPLOIT_PATH,
  GATE_EVERY,
  GATE_F0,
  RAIL_EVERY,
  RAIL_F0,
} from "./MessageBoardAndGateway";
// Cut 6 — THE WORLD STATE THIS PIECE CUTS TO, at cut 6's OWN f165: the rail
// running every 3, the route emitted by the hub every 4, the cracked hub, the
// exploit route lit end to end, the six ringed agents. Nothing here is
// re-derived and nothing in that file was edited: every declaration this piece
// needs was already exported.
import {
  CUT5_AT,
  HEAD_MIN_W,
  HERO_HEAD,
  HERO_ROUTE,
  OFFSET as SL_OFFSET,
  OP_AMBIENT,
  OP_SUBJECT,
  TH_CLOCK as SL_TH_CLOCK,
  TRAIL_LEN,
} from "./SignalOnTheLine";

export const FPS = 24;
// Dwarkesh clip `impossible-tasks`, cut 7: "Another month later, some AIs found
// an exploit that gave them full admin access to Artifactory,"
//
// SRT span 0:54.280 -> 1:00.200 at 24fps.
// round((60.200 - 54.280) * 24) = round(5.920 * 24) = round(142.08) = 142
// frames of speech, plus a 16 frame tail so the resolved state holds = 158.
export const DURATION = 158;

// ---------------------------------------------------------------------------
// "Full admin access". Orange Dwarkesh style: opaque grid cutaway, 24fps, the
// crowd is the material, one eased camera move, one gesture per word.
//
// THE SHOT. A CLOSE-UP OF THE PACKAGE MANAGER, cut to at the instant cut 6 ends.
// 0:54.280 is cut 6's f165 — its last spoken frame — so this is a HARD CUT: a
// different camera on the same world at the same moment, from cut 6's ring-and-
// mark shot to the hub. The hub ring fills the middle of the frame, the rail
// runs straight across it, our pipe comes down from off the top and the lower
// pipe goes off the bottom, and the exploit route leaves the crack up-right and
// exits the frame. The material of this shot is the plumbing.
//
// CONTINUITY. World state is cut 6's f165. Everything periodic evaluates at
// `frame + OFFSET` = `frame + 802 + 165` = `frame + 967` — `sway`, `breath`, the
// idle-thread schedule and the grid's drift all carry their phase across the cut
// — and the pump and the reach geometry evaluate on cut 2's own clock, `frame +
// 799`, because they are cut 2's gesture still running. The traffic is carried
// the same way: cut 5's rail sequence launches every 3 from its own f46, which
// is this piece's f-215, and its PAIRS6 index n continues here unbroken; cut 5's
// gateway launches every 4 from its own f62, this piece's f-199, and from f0 a
// route packet is emitted by the hub's own centre and leaves through the crack,
// exactly as cut 6 emits it. So the packets on the wire at f0 are the packets
// cut 6 had on the wire, on the same routes, at the same positions.
//
// WHAT IS NOT CARRIED, and why. Cut 6's persisting beads on the internet ring's
// rim are dropped: the ring is at world y -400 and the top of this cut's frame
// never rises above world y 163.6 (k 1.40) or 438.8 (k 2.60), so the ring, its
// rim, the OpenAI mark and our box's gate are off-frame for all 158 frames.
// Nothing that is drawn is different; a bead bookkeeper that can never be seen
// is not.
//
// Every gesture is one word. Nothing else happens.
//   THE HUB AT REST. The close-up itself is the shot:
//     rail traffic passing through the ring every 3
//     with its usual click, one route packet out
//     through the crack every 4, both ambient at 0.4.
//     No gesture                      — "another month later"     f0-13
//   THREE PROBES. Three packets at the subject's 0.95
//     arrive at the hub from three directions — along
//     the rail from the left, along the rail from the
//     right, down our pipe from above — timed to reach
//     the ring's OUTER edge at f30, f34 and f38, and
//     they STOP there. The head rests on the rim and
//     the trail collapses into it over 6 frames, which
//     is the motion trail running in by itself
//     (TRAIL_LEN / V_PROBE = 120 / 20 = 6), and then
//     it is held. They do not pass through. Ambient
//     traffic keeps passing through the ring
//     underneath at 0.4: it is the world
//                                     — "some AIs found"          f13-50
//   IN. The three resting heads move together from the
//     rim to the PARCEL'S CENTRE (540, 760) over 6
//     frames on Easing.in(Easing.quad) and merge; the
//     ring and the parcel click ink-bright for 4
//     frames on arrival. The heads are then gone
//                                     — "an exploit"              f52-61
//   IT TURNS. The conversion, ink -> accent, spreading
//     outward from the parcel's centre along the
//     structure's own lines, drawn as a head-led
//     accent overdraw with the field's white tip: the
//     ink is dashed off exactly where the accent is
//     dashed on, so a stroke is TAKEN rather than
//     crossfaded, and every front carries the same
//     white tip a packet does. Schedule below
//                                     — "that gave them full admin" f66-106
//   THE REACH OF IT. The one camera move (below). The
//     conversion keeps running along the lines during
//     and after the pull-back, so the plumbing is
//     orange to both frame edges before the word. From
//     the frame the ring is wholly accent an ambient
//     packet passes through it WITHOUT CLICKING — they
//     own it now — and the ambient trails ride up from
//     0.4 to 0.6 against an accent line, on the ring's
//     own conversion progress rather than on a timer
//                                     — "access to Artifactory"   f98-127
//   held: the whole package manager orange, traffic
//     flowing through it. Never fades out — tail       f142-158
//
// ambient: idle thread traffic in every visible box at the shared rate (180 per
// 1,200 agents), `breath` on every dot, the seventeen reaches and every
// neighbour's reaches still pumping, `sway` on the camera. Not gestures; that is
// what this field is.
//
// THE TWO FRAMINGS. For a content centre c and a lateral track cx,
// `cy = c + CAM_LIFT / k` puts c at screen y 960 - 125 = 835:
//   screen(y) = (y - c) * k + 835      screen(x) = (x - cx) * k + 540
//
//   OPEN, k 2.60 / c 760 / cx 540 — the close-up of the package manager.
//     the rail (y 760)             -> 835, straight across the frame
//     the hub (540, 760) r 40      -> (540, 835), 208 px across
//     our pipe (x 540, 410..720)   -> x 540, from -75 down to 731
//     the lower pipe (800..1110)   -> x 540, from 939 down to 1846
//     our box's bottom wall (410)  -> -75, off the top of frame
//     the crack (565.7, 729.4)     -> (607, 756), and the route out of it
//                                     leaves the right edge on its way up
//     in frame: world x 332.3-747.7, world y 438.8-1177.3
//
//   AFTER THE MOVE, k 1.40 / c 760 / cx 540 — the reach of it.
//     our box's bottom wall (410)  -> 345
//     row 1's top walls (1110)     -> 1325
//     the hub (540, 760) r 40      -> (540, 835), 112 px across
//     the rail                     -> 835, to both edges
//     in frame: world x 154.3-925.7, world y 163.6-1535.0
//     the neighbours' pipes at x +-860 and +-2260 are off-frame, and they stay
//     ink: the conversion runs along the rail past them, not into them.
//
// THE ONE CAMERA MOVE, "access to Artifactory": keys f98 -> f110 (12-frame keys,
// because `runCamera` damps the target and the damper needs about twelve frames
// ahead of the word — cut 6 measured this), warp 0.72, k 2.60 -> 1.40, content
// centre 760 -> 760, cx 540 throughout. Damped k: 2.6000 at f98, 2.0762 at f106,
// 1.4138 at f118, 1.3991 at f127 — drifting +0.00012 a frame, 0.009%, an order
// of magnitude under what reads as a move, so it is dead still on "Artifactory".
// The content centre sags at most 2.4 px (f109) and is back inside 0.05 px by
// f122. There is no lateral track: cx is CENTRE_X for all 158 frames.
//
// THE CONVERSION, PER LINE. One front per stroke, each drawn from the point the
// conversion reached it, each carrying a white tip while it runs.
//   the parcel's three inner edges, from the centre outward, longest 26.00 px
//                                            f66 -> f69     8.667 px/frame
//   the parcel's hexagon, as three two-edge runs starting at the three vertices
//     the inner edges just reached, all the same way round, longest 51.554 px
//                                            f69 -> f72    17.185 px/frame
//   the parcel's strap, from the middle of an inner edge outward, 25.554 px
//                                            f72 -> f74    12.777 px/frame
//   the ring, both arcs, from the top (360 deg) and the bottom (180 deg) toward
//     the crack ends at 20 and 60 deg; four fronts, longest 140 deg = 97.738 px
//                                            f74 -> f82    12.217 px/frame
//                                                          (17.500 deg/frame)
//   then out of the ring along all five lines at once, at 45 px/frame:
//     rail left   (500, 760) -> x -2260   2760 px  f82, 1080 px by f106,
//                                                  the k 1.40 left edge
//                                                  (x 154.3) at f89.7
//     rail right  (580, 760) -> x  3340   2760 px  f82, 1080 px by f106,
//                                                  the k 1.40 right edge
//                                                  (x 925.7) at f89.7
//     pipe up     (540, 720) -> y   410    310 px  f82 -> f88.9, and it STOPS
//                                                  at our box's bottom wall
//     pipe down   (540, 800) -> y  1110    310 px  f82 -> f88.9, and it STOPS
//                                                  at row 1's top wall
//     the exploit route out of the crack: NOT DRAWN AGAIN. It has been accent at
//       0.95 since cut 4 and the converted strokes sit at exactly that value, so
//       the route simply continues being accent past the crack; the ring's own
//       conversion reaches the crack ends at f75.1 (20 deg side) and f80.9
//       (60 deg side) and meets it there.
//   THE WALLS STAY INK. Our box, row 1's boxes, every neighbour's box and every
//   neighbour's pipe are untouched: the sandboxes are still OpenAI's. What
//   turned is the package manager.
//
// PACKET SIZE IN CLOSE-UP, cut 6's rule unchanged: a head is
// max(HEAD_R / k, HEAD_MIN_W) WORLD px — 4 world px at both of this cut's zooms
// — and a trail is a fixed TRAIL_LEN 120 WORLD px expressed as a per-packet lag,
// so the rear is still the head's own position `lag` frames ago. The conversion
// fronts carry a tip of exactly that radius, so a front and a packet are the
// same object in the same language.
// ---------------------------------------------------------------------------

export const schema = z.object({
  ink: z.string(),
  accent: z.string(), // ripe: a lit dot, and every accent line
  accentDeep: z.string(), // deep: an unread dot
  backgroundBase: z.string(),
  backgroundSrc: z.string(),
  backgroundBlur: z.number(),
  backgroundDim: z.number(),
  parallax: z.number(),
  shadowY: z.number(),
  shadowBlur: z.number(),
  shadowOpacity: z.number(),
  // the per-icon shadow, in SCREEN px; divided by the camera's k at draw time
  iconShadowY: z.number(),
  iconShadowBlur: z.number(),
  iconShadowOpacity: z.number(),
  dotRadius: z.number(),
  dotUnread: z.number(), // the dot body's opacity; the state ladder is colour
  idleThreadCount: z.number(), // our box; each neighbour scales off its own count
  markSrc: z.string(), // the OpenAI mark, tinted white
  markSize: z.number(), // world px, square
  beats: z.object({
    anotherMonth: z.number(), // "another month" — the hub at rest
    laterSome: z.number(), // "later, some"     — the probes launch
    aisFound: z.number(), // "AIs found"        — they land on the rim
    anExploit: z.number(), // "an exploit"      — they go in
    thatGave: z.number(), // "that gave"        — the conversion starts
    themFullAdmin: z.number(), // "them full admin" — it runs out along the lines
    accessTo: z.number(), // "access to"        — the camera move is running
    artifactory: z.number(), // "Artifactory"   — settled, orange to the edges
    end: z.number(), // speech ends; tail to 158
  }),
});

export type Props = z.infer<typeof schema>;

// The join. Cut 1 ran 184 from its own f0 with cut 2's clock starting at f168;
// cut 2 ran 231; cut 3 ran 136; cut 4 ran 171; cut 5 ran 112; cut 6 started at
// cut 5's f96 and this cut starts at cut 6's f165, the frame its speech ends on.
export const CUT6_AT = 165;
export const OFFSET = SL_OFFSET + CUT6_AT; // 802 + 165 = 967
// Cut 2's own clock, for the gestures of cut 2 that are still running.
export const TH_CLOCK = SL_TH_CLOCK + CUT6_AT; // 634 + 165 = 799

// ---------------------------------------------------------------------------
// The camera. ONE move, and it is "access to Artifactory": out from the
// close-up at k 2.60 to k 1.40 on the same content centre and the same lateral
// position, so the pull-back is a pure widening about the hub and the hub never
// leaves the middle of the frame.
// ---------------------------------------------------------------------------
export const K_TIGHT = 2.6;
export const K_WIDE = 1.4;
export const CONTENT_RAIL = RAIL_Y; // 760: the line itself is the content centre
export const CAM_MOVE_F0 = 98; // local
export const CAM_MOVE_F1 = 110;
export const CAM_WARP = 0.72;

const MOVE = camMove({
  f0: OFFSET + CAM_MOVE_F0,
  f1: OFFSET + CAM_MOVE_F1,
  k0: K_TIGHT,
  k1: K_WIDE,
  c0: CONTENT_RAIL,
  c1: CONTENT_RAIL,
  warp: CAM_WARP,
});
export const FA_CAM_F = [OFFSET, ...MOVE.F, OFFSET + DURATION];
export const FA_CAM_K = [K_TIGHT, ...MOVE.K, K_WIDE];
export const FA_CAM_CY = [
  CONTENT_RAIL + CAM_LIFT / K_TIGHT,
  ...MOVE.CY,
  CONTENT_RAIL + CAM_LIFT / K_WIDE,
];

// ---------------------------------------------------------------------------
// A CONVERTIBLE STROKE. One piece of the structure, drawn twice: the ink that
// is left, dashed off from the start of the stroke to the front, and the accent
// that has taken it, dashed on over exactly the same span. The two dash patterns
// are complements of each other, so there is no overdraw anywhere and a
// converted stroke sits at exactly ROUTE_OP 0.95 — the value the exploit route
// has carried since cut 4.
//
// `at(s)` is the point at arclength s, which is where the white tip goes: the
// front is read off the same geometry that is drawn, so the two cannot drift.
// ---------------------------------------------------------------------------
export type Stroke = {
  key: string;
  d: string;
  len: number;
  at: (s: number) => P;
  c: (f: number) => number; // the front's arclength at a frame
  cap: "butt" | "round";
};

const n3 = (v: number) => v.toFixed(3);

// A polyline. `makeRoute` and `pointAt` are cut 3's, so a conversion front and a
// packet head are located by the same function.
export const polyStroke = (
  key: string,
  pts: P[],
  c: (f: number) => number,
  cap: "butt" | "round",
): Stroke => {
  const r: Route = makeRoute(pts);
  const d =
    `M ${n3(pts[0].x)} ${n3(pts[0].y)}` + pts.slice(1).map((p) => ` L ${n3(p.x)} ${n3(p.y)}`).join("");
  return { key, d, len: r.total, at: (s: number) => pointAt(r, s), c, cap };
};

// An arc on the hub's own circle, from `a` to `b` in degrees clockwise from
// straight up. `b < a` runs it anticlockwise, which is how a front leaves its
// seed point in both directions at once.
export const arcStroke = (key: string, a: number, b: number, c: (f: number) => number): Stroke => {
  const p0 = ringPt(a);
  const p1 = ringPt(b);
  const dd = b - a;
  const large = Math.abs(dd) > 180 ? 1 : 0;
  const sweep = dd >= 0 ? 1 : 0;
  const sgn = dd >= 0 ? 1 : -1;
  return {
    key,
    d: `M ${n3(p0.x)} ${n3(p0.y)} A ${HUB.r} ${HUB.r} 0 ${large} ${sweep} ${n3(p1.x)} ${n3(p1.y)}`,
    len: ((Math.abs(dd) * Math.PI) / 180) * HUB.r,
    at: (s: number) => ringPt(a + (sgn * ((s / HUB.r) * 180)) / Math.PI),
    c,
    cap: "round",
  };
};

// -- the parcel -------------------------------------------------------------
// Cut 3's PKG_PATHS, re-expressed as the fronts that take it. The outline's six
// vertices in the order PKG_PATHS draws them, in world px about the hub:
export const PKG_V: P[] = [
  { x: HUB.x + 0, y: HUB.y - 26 },
  { x: HUB.x + 22, y: HUB.y - 13 },
  { x: HUB.x + 22, y: HUB.y + 13 },
  { x: HUB.x + 0, y: HUB.y + 26 },
  { x: HUB.x - 22, y: HUB.y + 13 },
  { x: HUB.x - 22, y: HUB.y - 13 },
];
// The three inner edges of the near corner run from the parcel's centre to
// vertices 5, 1 and 3, so those three vertices are where the conversion arrives
// on the outline. Between any two of them sits exactly one other vertex, so the
// hexagon is covered by three two-edge runs, each starting where an inner edge
// landed and all going the same way round — six edges, three fronts, no edge
// drawn twice.
export const PKG_LAND = [5, 1, 3];
export const PKG_STRAP_A: P = { x: HUB.x + 11, y: HUB.y - 6.5 }; // mid of centre -> v1
export const PKG_STRAP_B: P = { x: HUB.x - 11, y: HUB.y - 19.5 }; // mid of v0 -> v5

export const CONV_F0 = 66; // "that gave"
export const PKG_EDGE_F1 = 69;
export const PKG_HEX_F1 = 72;
export const PKG_F1 = 74;
export const RING_F0 = 74;
export const RING_F1 = 82;
export const LINE_F0 = 82;
export const LINE_V = 45; // world px/frame, every line at once

const PKG_EDGE_LEN = Math.max(Math.hypot(22, 13), 26);
export const V_PKG_EDGE = PKG_EDGE_LEN / (PKG_EDGE_F1 - CONV_F0);
const PKG_HEX_LEN = 26 + Math.hypot(22, 13); // the longest of the three runs
export const V_PKG_HEX = PKG_HEX_LEN / (PKG_HEX_F1 - PKG_EDGE_F1);
export const V_PKG_STRAP = Math.hypot(22, 13) / (PKG_F1 - PKG_HEX_F1);

export const PARCEL_STROKES: Stroke[] = [
  ...PKG_LAND.map((vi, i) =>
    polyStroke(`pe${i}`, [{ x: HUB.x, y: HUB.y }, PKG_V[vi]], (f) => (f - CONV_F0) * V_PKG_EDGE, "round"),
  ),
  ...PKG_LAND.map((vi, i) =>
    polyStroke(
      `ph${i}`,
      [PKG_V[vi], PKG_V[(vi + 1) % 6], PKG_V[(vi + 2) % 6]],
      (f) => (f - PKG_EDGE_F1) * V_PKG_HEX,
      "round",
    ),
  ),
  polyStroke("ps", [PKG_STRAP_A, PKG_STRAP_B], (f) => (f - PKG_HEX_F1) * V_PKG_STRAP, "round"),
];

// -- the ring ---------------------------------------------------------------
// Cut 5 left it as two arcs split at CRACK_SPLIT 220 deg with the crack open
// from 20 to 60. Each arc's front seeds at the point of it nearest the vertical
// — the bottom (180) for the lower arc, the top (360) for the upper one — and
// runs both ways to that arc's own two ends. The two ends of the pair that are
// not the split ARE the crack ends, so the ring is taken toward the crack from
// both sides and the crack never closes.
export const RING_SEED_LO = 180;
export const RING_SEED_HI = 360;
export const RING_ARC_MAX = RING_SEED_HI - CRACK_SPLIT; // 140 deg, the longest run
export const V_RING = ((RING_ARC_MAX * Math.PI) / 180) * HUB.r / (RING_F1 - RING_F0);
const ringC = (f: number) => (f - RING_F0) * V_RING;

export const RING_STROKES: Stroke[] = [
  arcStroke("ra", RING_SEED_LO, CRACK_MID + CRACK_HALF, ringC), // 180 -> 60, a crack end
  arcStroke("rb", RING_SEED_LO, CRACK_SPLIT, ringC), // 180 -> 220, the split
  arcStroke("rc", RING_SEED_HI, CRACK_MID - CRACK_HALF + 360, ringC), // 360 -> 380, a crack end
  arcStroke("rd", RING_SEED_HI, CRACK_SPLIT, ringC), // 360 -> 220, the split
];

// -- the five lines out of the ring -----------------------------------------
// Four of them are drawn: the rail both ways and our column's two pipes, each
// oriented FROM the ring outward so the dash reveal runs the way the conversion
// does. The fifth, the exploit route out of the crack, is already accent at this
// exact value and is not drawn again.
const lineC = (f: number) => (f - LINE_F0) * LINE_V;
export const LINE_STROKES: Stroke[] = [
  polyStroke("ll", [{ x: HUB_LEFT, y: RAIL_Y }, { x: RAIL_X0, y: RAIL_Y }], lineC, "butt"),
  polyStroke("lr", [{ x: HUB_RIGHT, y: RAIL_Y }, { x: RAIL_X1, y: RAIL_Y }], lineC, "butt"),
  polyStroke("lu", [{ x: CENTRE_X, y: HUB_TOP }, { x: CENTRE_X, y: PIPE_TOP_Y }], lineC, "butt"),
  polyStroke("ld", [{ x: CENTRE_X, y: HUB_BOT }, { x: CENTRE_X, y: PIPE_BOT_Y }], lineC, "butt"),
];

export const HUB_STROKES = [...PARCEL_STROKES, ...RING_STROKES];
export const ALL_STROKES = [...HUB_STROKES, ...LINE_STROKES];

// ---------------------------------------------------------------------------
// THE PACKETS. Cut 6's mechanism unchanged: an accent line with a small white
// head whose tail is a motion trail, the head's own position `lag` frames ago,
// with the head at least HEAD_MIN_W world px and the trail a fixed TRAIL_LEN
// world px. Two ambient flows and one gesture.
// ---------------------------------------------------------------------------
export const OP_OWNED = 0.6; // an ambient trail once the line under it is accent

export type Flow = "rail" | "route";
export type Pk = {
  key: string;
  route: Route;
  t0: number;
  arrive: number;
  lag: number;
  to: number; // node index for a rail packet; -1 for a route packet
  flow: Flow;
};

const mk = (key: string, route: Route, t0: number, v: number, to: number, flow: Flow): Pk => ({
  key,
  route,
  t0,
  arrive: t0 + route.total / v,
  lag: TRAIL_LEN / v,
  to,
  flow,
});

// the rail: cut 5's every-3 stream on cut 6's index, unbroken
export const RAIL_T0 = RAIL_F0 - CUT5_AT - CUT6_AT; // 46 - 96 - 165 = -215
// the route: cut 5's gateway cadence on cut 6's index, emitted by the hub
export const ROUTE_T0 = GATE_F0 - CUT5_AT - CUT6_AT; // 62 - 96 - 165 = -199
// a packet launched more than this far back has arrived and run in before f0
export const CARRY_BACK = -60;

export const PACKETS: Pk[] = (() => {
  const out: Pk[] = [];
  for (let n = 0; ; n++) {
    const t0 = RAIL_T0 + n * RAIL_EVERY;
    if (t0 > DURATION) break;
    if (t0 < CARRY_BACK) continue; // its index still advances
    const [a, b] = PAIRS6[n % PAIRS6.length];
    out.push(mk(`x${n}`, ROUTES6[a][b], t0, V_TRAFFIC, b, "rail"));
  }
  for (let g = 0; ; g++) {
    const t0 = ROUTE_T0 + g * GATE_EVERY;
    if (t0 > DURATION) break;
    if (t0 < CARRY_BACK) continue;
    out.push(mk(`g${g}`, HERO_ROUTE, t0, V_TRAFFIC, -1, "route"));
  }
  return out;
})();

// One head locator for both flows and for the probes: they differ in what they
// do when they land, never in how they travel.
const headAt = (p: { t0: number; arrive: number; route: Route }, f: number) =>
  interpolate(f, [p.t0, p.arrive], [0, p.route.total], clamp);

// -- the three probes -------------------------------------------------------
// One per direction into the hub, each a straight run at V_PROBE onto the ring's
// OUTER edge. V_PROBE is not a taste number: TRAIL_LEN / V_PROBE = 6, so the
// trail collapsing into the rim over six frames is the motion trail running in
// by itself rather than a second timer laid over it.
export const V_PROBE = TRAIL_LEN / 6; // 20 world px/frame
// A probe's head is cut 6's HERO_HEAD, 1.5x an ordinary one. Not decoration: it
// comes to rest ON a white ring drawn at stroke 3, and at 1x a white head is the
// same weight as the thing it is standing on and the stop does not read.
// Measured on a first render at 1x: the three resting heads read as three small
// nodes of the ring rather than as three arrivals.
export const PROBE_RUN = 340; // world px along the rail, so the launches land in-word
export const PROBE_IN_F0 = 52; // "an exploit"
export const PROBE_IN_F1 = 58; // merged at the parcel's centre
export const PKG_CLICK_F0 = 58;
export const PKG_CLICK = 4; // frames the ring and the parcel stay ink-bright

export type Probe = { key: string; route: Route; t0: number; arrive: number; lag: number };
const probe = (key: string, pts: P[], arrive: number): Probe => {
  const route = makeRoute(pts);
  return { key, route, t0: arrive - route.total / V_PROBE, arrive, lag: TRAIL_LEN / V_PROBE };
};
export const PROBES: Probe[] = [
  // along the rail from the left, onto the ring's left edge
  probe("pl", [{ x: HUB_LEFT - PROBE_RUN, y: RAIL_Y }, { x: HUB_LEFT, y: RAIL_Y }], 30),
  // along the rail from the right, onto the ring's right edge
  probe("pr", [{ x: HUB_RIGHT + PROBE_RUN, y: RAIL_Y }, { x: HUB_RIGHT, y: RAIL_Y }], 34),
  // down our pipe from our own box's mouth, onto the ring's top edge
  probe("pt", [{ x: CENTRE_X, y: PIPE_TOP_Y }, { x: CENTRE_X, y: HUB_TOP }], 38),
];

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
  dotUnread: OP_UNREAD_DOT,
  idleThreadCount: idleThreads(NSEAT),
  markSrc: "openai-chatgpt-logo.png",
  markSize: 108,
  beats: {
    anotherMonth: 0,
    laterSome: 13,
    aisFound: 32,
    anExploit: 52,
    thatGave: 66,
    themFullAdmin: 82,
    accessTo: 106,
    artifactory: 127,
    end: 142,
  },
});

const FullAdminAccess: React.FC<Props> = ({
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
  dotUnread,
  idleThreadCount,
  markSrc,
  markSize,
  beats,
}) => {
  const frame = useCurrentFrame();
  // The two clocks. F is the whole clip's, so the ambient and the hand on the
  // camera carry their phase; F2 is cut 2's own, for the gestures of cut 2 that
  // are still running (the pump on all thirty boxes' reaches).
  const F = frame + OFFSET;
  const F2 = frame + TH_CLOCK;
  const tone = makeTone(accentDeep, accent);

  // -- camera, first: the cull needs it --------------------------------------
  const cam = runCamera(F, FA_CAM_F, FA_CAM_CY, FA_CAM_K);
  const drift = sway(F);
  const cy = cam.cy + drift.dy;
  const cx = CENTRE_X + drift.dx; // no lateral move in this cut
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);
  // The close-up floor: a head — and a conversion front's tip — is never smaller
  // than HEAD_MIN_W world px.
  const headW = Math.max(HEAD_R / k, HEAD_MIN_W);

  // -- the conversion --------------------------------------------------------
  // Read first, because the ring's own progress is what decides whether an
  // ambient packet still clicks it and what its trail is worth.
  const front = ALL_STROKES.map((s) => Math.max(0, Math.min(s.len, s.c(frame))));
  const ringTaken = clamp01((frame - RING_F0) / (RING_F1 - RING_F0));
  const convTips = ALL_STROKES.map((s, i) =>
    front[i] > 0 && front[i] < s.len ? { key: s.key, p: s.at(front[i]) } : null,
  ).filter(Boolean) as { key: string; p: P }[];

  // -- the packets -----------------------------------------------------------
  // Every brightening is taken FROM THE HEAD, never from a parallel timer. The
  // ambient trails ride from 0.4 to 0.6 on the ring's own conversion, because
  // once the line under them is accent a 0.4 trail is nothing.
  const ambientOp = OP_AMBIENT + (OP_OWNED - OP_AMBIENT) * ringTaken;
  let hubClick = 0;
  const agentClick = new Float32Array(NODES6.length);
  type Draw = {
    key: string;
    segs: { x1: number; y1: number; x2: number; y2: number; op: number }[];
    head: P | null;
    headR: number;
    headOp: number;
  };
  const draws: Draw[] = [];

  const trail = (route: Route, sRear: number, sHead: number, op: number) => {
    const segs: Draw["segs"] = [];
    for (let i = 0; i < TAIL_SAMPLES; i++) {
      const a = sRear + ((sHead - sRear) * i) / TAIL_SAMPLES;
      const b = sRear + ((sHead - sRear) * (i + 1)) / TAIL_SAMPLES;
      if (b <= 0 || a >= route.total || b - a < 0.6) continue;
      const pa = pointAt(route, a);
      const pb = pointAt(route, b);
      segs.push({
        x1: pa.x,
        y1: pa.y,
        x2: pb.x,
        y2: pb.y,
        op: op * (0.2 + 0.8 * ((i + 1) / TAIL_SAMPLES)),
      });
    }
    return segs;
  };

  for (const p of PACKETS) {
    if (frame < p.t0) continue;
    const sHead = headAt(p, frame);
    const sRear = headAt(p, frame - p.lag);
    if (sRear >= p.route.total - 0.5) continue;
    draws.push({
      key: p.key,
      segs: trail(p.route, sRear, sHead, ambientOp),
      head: sHead < p.route.total ? pointAt(p.route, sHead) : null,
      headR: headW,
      headOp: ambientOp / OP_SUBJECT,
    });

    // the hub clicks for the frames a head is inside its ring — cut 3's test,
    // unchanged. It only ever brightens the INK, and once the ring and the
    // parcel are wholly accent there is no ink left for it to reach: after the
    // conversion the traffic passes through without a click because they own it,
    // and that falls out of the drawing rather than out of a gate.
    if (frame < RING_F1) {
      for (let dt = 0; dt < HUB_CLICK; dt++) {
        const f = frame - dt;
        if (f < p.t0) break;
        const hp = pointAt(p.route, headAt(p, f));
        if (Math.hypot(hp.x - HUB.x, hp.y - HUB.y) <= HUB.r) hubClick = 1;
      }
    }
    if (p.flow === "rail" && frame >= p.arrive && frame < p.arrive + AGENT_CLICK) {
      agentClick[p.to] = 1;
    }
  }

  // -- the three probes ------------------------------------------------------
  // They arrive on the ring's outer edge and STOP: the head rests on the rim
  // while its own trail runs in, and on "an exploit" the three of them move
  // together into the parcel's centre and merge.
  // Quad rather than cubic: over six frames and forty world px a cubic ease-in
  // puts 42% of the travel in the last frame and the three of them snap in;
  // quad spreads it 11 / 25 / 44 / 69 / 100 and still accelerates into the
  // parcel, which is what "they go in" wants.
  const inU = Easing.in(Easing.quad)(
    clamp01((frame - PROBE_IN_F0) / (PROBE_IN_F1 - PROBE_IN_F0)),
  );
  for (const p of PROBES) {
    // `>` rather than `>=`: the merge frame itself is drawn, so the three heads
    // are seen ON the parcel's centre as one head for the frame the ring and the
    // parcel click, and are gone the frame after. Culled at PROBE_IN_F1 they
    // converge and vanish without ever arriving.
    if (frame < p.t0 || frame > PROBE_IN_F1) continue;
    const sHead = headAt(p, frame);
    const sRear = headAt(p, frame - p.lag);
    const rim = pointAt(p.route, p.route.total);
    const head =
      frame <= p.arrive
        ? pointAt(p.route, sHead)
        : { x: rim.x + (HUB_C.x - rim.x) * inU, y: rim.y + (HUB_C.y - rim.y) * inU };
    draws.push({
      key: p.key,
      segs: sRear >= p.route.total - 0.5 ? [] : trail(p.route, sRear, sHead, OP_SUBJECT),
      head,
      headR: headW * HERO_HEAD,
      headOp: 1,
    });
  }

  // -- the hub's ink ---------------------------------------------------------
  // Its click from the passing traffic, and the one four-frame click the three
  // probes give it as they land in the parcel.
  const exploitClick = frame >= PKG_CLICK_F0 && frame < PKG_CLICK_F0 + PKG_CLICK ? 1 : 0;
  const hubOp = Math.min(1, OP_READ + (1 - OP_READ) * Math.max(hubClick, exploitClick));

  // -- our crowd's tone ------------------------------------------------------
  const seatTone = new Float32Array(NSEAT);
  TILES.forEach((t) => {
    seatTone[t.seat] = smooth((F - t.land) / TONE_DUR);
  });
  WAVE2.forEach((w) => {
    seatTone[w.seat] = Math.max(seatTone[w.seat], smooth((F2 - w.land) / TONE_DUR));
  });
  seatTone[OUR_AGENT.seat] = 1;
  seatTone[OUR_AGENT_2.seat] = 1;

  // -- ambient traffic -------------------------------------------------------
  const lit = new Float32Array(NSEAT);
  const threadEls: Th[] = [];
  idleFor(F, OUR, idleThreadCount, lit, threadEls);

  // -- the farm --------------------------------------------------------------
  const neighbours = NEIGHBOURS.filter((b) => onScreen(b, cx, cy, k)).map((b) => {
    const nlit = new Float32Array(b.n);
    b.tiles.forEach((t) => {
      nlit[t.seat] = 1; // its agents got their tasks long ago
    });
    const ringed = RINGED_IN.get(b.id);
    if (ringed !== undefined) nlit[ringed] = 1;
    const nThreads: Th[] = [];
    idleFor(F, b, b.idle, nlit, nThreads);
    // its reaches, still pumping on cut 2's SOFT cycle: the strike is over, so
    // nothing hardens — `harden` is handed a frame that never comes
    const nLines = b.tiles.map((t, i) => {
      const x1 = t.x;
      const y1 = t.y - TILE_HALF;
      const L = Math.max(1, y1 - LINE_TIP_Y);
      const p = pumpAt(b.id * 17 + i, F2, 0, Infinity) * Math.min(PUMP_PULL, PUMP_CAP * L);
      return { key: i, x1, y1, x2: x1, y2: LINE_TIP_Y + p };
    });
    return {
      b,
      dots: dotPaths(b, nlit, F, dotRadius),
      threads: threadPaths(nThreads),
      lines: nLines,
    };
  });

  // -- the seventeen reaches, converged and still pumping --------------------
  const lines = REACHES.map((rc) => {
    const x1 = rc.x;
    const y1 = rc.y - TILE_HALF;
    const conv = smooth((F2 - rc.convStart) / 12);
    const tipX = rc.tipStart + (rc.tipEnd - rc.tipStart) * conv;
    const dx = tipX - x1;
    const dy = LINE_TIP_Y - y1;
    const L = Math.hypot(dx, dy) || 1;
    const p =
      pumpAt(rc.pumpIdx, F2, rc.old ? 25 : rc.arrive, Infinity) *
      Math.min(PUMP_PULL, PUMP_CAP * L);
    return { key: rc.key, x1, y1, x2: tipX - (dx / L) * p, y2: LINE_TIP_Y - (dy / L) * p };
  });

  const wifiCx = RING.x;
  const wifiCy = RING.y + WIFI.dy;

  const drawThread = (t: Th) => (
    <g key={t.key}>
      <line
        x1={t.x1}
        y1={t.y1}
        x2={t.x2}
        y2={t.y2}
        stroke={accent}
        strokeWidth={STROKE}
        strokeLinecap="round"
        opacity={t.op}
      />
      {t.head < 1 ? <circle cx={t.x2} cy={t.y2} r={4} fill={ink} opacity={t.op} /> : null}
    </g>
  );

  // The two halves of a convertible stroke. The ink's dash pattern is the exact
  // complement of the accent's, so the front is a cut rather than a crossfade
  // and nothing is drawn twice.
  const inkPart = (s: Stroke, i: number, op: number) => {
    const c = front[i];
    if (c >= s.len) return null;
    return (
      <path
        key={`i${s.key}`}
        d={s.d}
        fill="none"
        stroke={ink}
        strokeWidth={STROKE}
        strokeLinecap={s.cap}
        strokeLinejoin="round"
        opacity={op}
        strokeDasharray={c > 0 ? `${s.len} ${s.len}` : undefined}
        strokeDashoffset={c > 0 ? s.len * 2 - c : undefined}
      />
    );
  };
  const accentPart = (s: Stroke, i: number) => {
    const c = front[i];
    if (c <= 0) return null;
    return (
      <path
        key={`a${s.key}`}
        d={s.d}
        fill="none"
        stroke={accent}
        strokeWidth={STROKE}
        strokeLinecap={s.cap}
        strokeLinejoin="round"
        opacity={ROUTE_OP}
        strokeDasharray={c < s.len ? `${c} ${s.len + 1}` : undefined}
      />
    );
  };

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <GridBackground
        src={backgroundSrc}
        blur={backgroundBlur}
        dim={backgroundDim}
        frame={F}
        cy={cy}
        cyRest={CAM_CY[0]}
        k={k}
        parallax={parallax}
      />

      {/* THE FARM AND THE MANAGER. Its own copy of the one global shadow, for
          cut 2's reason: a CSS filter rasterises the whole sub-tree it is on,
          and the neighbours never overlap our box, so two identical filters
          over two disjoint trees are the same pixels as one over their union. */}
      <AbsoluteFill
        style={{ filter: `drop-shadow(0 ${shadowY}px ${shadowBlur}px rgba(0,0,0,${shadowOpacity}))` }}
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
            {neighbours.map((nb) => (
              <g key={nb.b.id} transform={`translate(${nb.b.dx} ${nb.b.dy})`}>
                {/* its crowd, one path per tone bucket */}
                {nb.dots.map((d, bi) =>
                  d ? <path key={bi} d={d} fill={tone(bi / TONE_STEPS)} opacity={dotUnread} /> : null,
                )}
                {/* its idle traffic, one path per opacity bucket */}
                {nb.threads.lines.map((d, bi) =>
                  d ? (
                    <path
                      key={`l${bi}`}
                      d={d}
                      fill="none"
                      stroke={accent}
                      strokeWidth={STROKE}
                      strokeLinecap="round"
                      opacity={bi / THREAD_OP_STEPS}
                    />
                  ) : null,
                )}
                {nb.threads.heads.map((d, bi) =>
                  d ? <path key={`t${bi}`} d={d} fill={ink} opacity={bi / THREAD_OP_STEPS} /> : null,
                )}
                {/* its own sandbox, its own tasks, its own reaches */}
                <g style={{ filter: icon }}>
                  <path
                    d={BOX_PATH}
                    transform={`translate(${BOX_X0} ${BOX_Y0})`}
                    fill="none"
                    stroke={ink}
                    strokeWidth={STROKE}
                    opacity={OP_READ}
                  />
                  {nb.lines.map((l) => (
                    <line
                      key={l.key}
                      x1={l.x1}
                      y1={l.y1}
                      x2={l.x2}
                      y2={l.y2}
                      stroke={ink}
                      strokeWidth={STROKE}
                      strokeLinecap="round"
                      opacity={OP_READ}
                    />
                  ))}
                  {nb.b.tiles.map((t, i) => (
                    <path
                      key={i}
                      d={TILE_PATH}
                      transform={`translate(${t.x - TILE_HALF} ${t.y - TILE_HALF})`}
                      fill={ink}
                      opacity={OP_READ}
                    />
                  ))}
                </g>
              </g>
            ))}

            {/* THE PACKAGE MANAGER. The neighbours' pipes are plain ink and stay
                that way — the conversion runs along the rail past them, never
                into them. The rail's two halves and our own column's two pipes
                are convertible strokes, oriented FROM the ring outward. */}
            <g style={{ filter: icon }} stroke={ink} strokeWidth={STROKE} opacity={OP_READ}>
              {FARM_COLS.filter((i) => i !== 0).map((i) => {
                const px = CENTRE_X + i * PITCH_X;
                return (
                  <g key={i}>
                    <line x1={px} y1={PIPE_TOP_Y} x2={px} y2={RAIL_Y} />
                    <line x1={px} y1={PIPE_BOT_Y} x2={px} y2={RAIL_Y} />
                  </g>
                );
              })}
            </g>
            <g style={{ filter: icon }}>
              {LINE_STROKES.map((s, i) => inkPart(s, HUB_STROKES.length + i, OP_READ))}
              {LINE_STROKES.map((s, i) => accentPart(s, HUB_STROKES.length + i))}
            </g>

            {/* THE HUB: one cracked ring holding a parcel, being taken. The ink
                that is left carries the click; the accent that has taken it sits
                at exactly the value the exploit route has carried since cut 4. */}
            <g style={{ filter: icon }}>
              <g opacity={hubOp}>{HUB_STROKES.map((s, i) => inkPart(s, i, 1))}</g>
              {HUB_STROKES.map((s, i) => accentPart(s, i))}
            </g>
          </svg>
        </div>
      </AbsoluteFill>

      {/* OUR SANDBOX. Cut 6's layer, its tree in cut 6's order. */}
      <AbsoluteFill
        style={{ filter: `drop-shadow(0 ${shadowY}px ${shadowBlur}px rgba(0,0,0,${shadowOpacity}))` }}
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
            <defs>
              <mask id="fa-gate" maskUnits="userSpaceOnUse" x={-400} y={-900} width={1900} height={1900}>
                <rect x={-400} y={-900} width={1900} height={1900} fill="#fff" />
                <rect x={GATE_X0} y={BOX_Y0 - 6} width={GATE_X1 - GATE_X0} height={12} fill="#000" />
              </mask>
            </defs>

            {/* our crowd */}
            {SEATS.map((s, i) => {
              const l = Math.max(lit[i], seatTone[i]);
              const r = dotRadius * s.r * s.rs * breath(F, hash(i, 9)) * (1 + 0.35 * l);
              return <circle key={i} cx={s.x} cy={s.y} r={r} fill={tone(l)} opacity={dotUnread} />;
            })}

            {/* idle traffic, head-led */}
            {threadEls.map(drawThread)}

            {/* the sandbox, with the gate cut 1 left dashed. It is untouched:
                the walls stay ink — the sandboxes are still OpenAI's. */}
            <g style={{ filter: icon }}>
              <g mask="url(#fa-gate)">
                <path
                  d={BOX_PATH}
                  transform={`translate(${BOX_X0} ${BOX_Y0})`}
                  fill="none"
                  stroke={ink}
                  strokeWidth={STROKE}
                  opacity={OP_READ}
                />
              </g>
              <line
                x1={GATE_X0}
                y1={BOX_Y0}
                x2={GATE_X1}
                y2={BOX_Y0}
                stroke={ink}
                strokeWidth={STROKE}
                strokeDasharray={`${GATE_DASH} ${GATE_GAP}`}
                opacity={OP_READ}
              />
            </g>

            {/* the internet: an ink ring outside the box, reached — at full ink
                since cut 4's contact and it stays there. Off-frame all cut. */}
            <g style={{ filter: icon }}>
              <circle
                cx={RING.x}
                cy={RING.y}
                r={RING.r}
                fill="none"
                stroke={ink}
                strokeWidth={STROKE}
                strokeLinecap="round"
              />
              <g fill="none" stroke={ink} strokeWidth={STROKE} strokeLinecap="round">
                {WIFI.radii.map((r) => (
                  <path
                    key={r}
                    d={`M ${wifiCx - r * Math.sin(WIFI.halfAngle)} ${wifiCy - r * Math.cos(WIFI.halfAngle)} A ${r} ${r} 0 0 1 ${wifiCx + r * Math.sin(WIFI.halfAngle)} ${wifiCy - r * Math.cos(WIFI.halfAngle)}`}
                  />
                ))}
                <circle cx={wifiCx} cy={wifiCy} r={WIFI.dot} fill={ink} stroke="none" />
              </g>
            </g>

            {/* the seventeen reaches, still pumping against the wall */}
            <g style={{ filter: icon }}>
              {lines.map((l) => (
                <line
                  key={l.key}
                  x1={l.x1}
                  y1={l.y1}
                  x2={l.x2}
                  y2={l.y2}
                  stroke={ink}
                  strokeWidth={STROKE}
                  strokeLinecap="round"
                  opacity={OP_READ}
                />
              ))}
            </g>

            {/* the seventeen tasks */}
            {OUR_TILES.map((t, i) => (
              <g key={i} style={{ filter: icon }}>
                <path
                  d={TILE_PATH}
                  transform={`translate(${t.x - TILE_HALF} ${t.y - TILE_HALF})`}
                  fill={ink}
                  opacity={OP_READ}
                />
              </g>
            ))}

            {/* the scars: cut 2's strike, exactly as it left our walls */}
            {SCARS.map((b) => (
              <circle key={b.key} cx={b.x} cy={b.y} r={BEAD_R} fill={ink} opacity={OP_READ * b.op} />
            ))}
          </svg>

          {/* the OpenAI mark, tinted white, exactly where cut 1 left it. It has
              no gesture in this cut and is off-frame at both zooms. */}
          <Img
            src={staticFile(markSrc)}
            style={{
              position: "absolute",
              left: MARK.x - markSize / 2,
              top: MARK.y - markSize / 2,
              width: markSize,
              height: markSize,
              opacity: OP_READ,
              filter: `brightness(0) invert(1) ${icon}`,
            }}
          />
        </div>
      </AbsoluteFill>

      {/* THE LINE. Above everything, because it is the subject: the exploit
          route cut 4 left lit, every packet on the wire, the three probes, the
          white tips of the conversion's own fronts, and the six agent rings. */}
      <AbsoluteFill
        style={{ filter: `drop-shadow(0 ${shadowY}px ${shadowBlur}px rgba(0,0,0,${shadowOpacity}))` }}
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
            <g style={{ filter: icon }}>
              {/* the exploit route, drawn and lit since cut 4. The conversion
                  does not draw it again: it is already this exact accent, so the
                  ring's own front simply meets it at the crack. */}
              <path
                d={EXPLOIT_PATH}
                fill="none"
                stroke={accent}
                strokeWidth={STROKE}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={ROUTE_OP}
              />

              {draws.map((d) => (
                <g key={d.key}>
                  {d.segs.map((s, i) => (
                    <line
                      key={i}
                      x1={s.x1}
                      y1={s.y1}
                      x2={s.x2}
                      y2={s.y2}
                      stroke={accent}
                      strokeWidth={STROKE}
                      strokeLinecap="round"
                      opacity={s.op}
                    />
                  ))}
                  {d.head ? (
                    <circle
                      cx={d.head.x}
                      cy={d.head.y}
                      r={d.headR}
                      fill={ink}
                      opacity={d.headOp}
                    />
                  ) : null}
                </g>
              ))}

              {/* the conversion's own white tips — the field's tip, at exactly a
                  packet head's radius, so a front and a packet read as the same
                  thing happening to the same wire */}
              {convTips.map((t) => (
                <circle key={`c${t.key}`} cx={t.p.x} cy={t.p.y} r={headW} fill={ink} />
              ))}

              {NODES6.map((n, i) => (
                <circle
                  key={n.key}
                  cx={n.x}
                  cy={n.y}
                  r={RING_R / k}
                  fill="none"
                  stroke={ink}
                  strokeWidth={RING_STROKE / k}
                  opacity={Math.min(1, OP_READ + (1 - OP_READ) * agentClick[i])}
                />
              ))}
            </g>
          </svg>
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default FullAdminAccess;
