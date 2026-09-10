import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
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
  hash,
  iconShadow,
  idleThreads,
  makeTone,
  runCamera,
  sway,
  worldTransform,
} from "./fieldShared";
// Cut 1. The world's geometry: the box, the seat grid, the tiles, the ring and
// its wifi glyph, the gate, the mark, the camera's original key track.
import {
  BOX_CY,
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
  clamp01,
  smooth,
} from "./ImpossibleTasks";
// Cut 2. The farm, the neighbours, the pump, the batched draw helpers.
import {
  type Box,
  DURATION as TH_DURATION,
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
// Cut 3 — THE STATE THIS PIECE CONTINUES FROM: the rail, the pipes, the hub
// with its parcel glyph, the three ringed agents, the packet mechanism, the
// exchange, the resolved camera and the frozen scars. Nothing here is
// re-derived; the only edit made to that file was adding `export` to the
// declarations below (no value moved: cut 3 f0 and f135 both come back PSNR inf
// against renders taken before the edit).
import {
  AGENT_CLICK,
  BEAD_R,
  BELOW,
  BELOW_AGENT,
  CONTENT_WIDE,
  DURATION as TA_DURATION,
  HEAD_R,
  HUB,
  HUB_BOT,
  HUB_CLICK,
  HUB_LEFT,
  HUB_RIGHT,
  HUB_TOP,
  K_WIDE,
  LEFT,
  LEFT_AGENT,
  type Node,
  N_BELOW,
  N_LEFT,
  N_OURS,
  OFFSET as TA_OFFSET,
  OUR_AGENT,
  OUR_MOUTH,
  OUR_TILES,
  type P,
  PIPE_BOT_Y,
  PIPE_TOP_Y,
  PKG_PATHS,
  RAIL_X0,
  RAIL_X1,
  RAIL_Y,
  RING_R,
  RING_STROKE,
  type Route,
  SCARS,
  TAIL_LAG,
  TAIL_MIN,
  TAIL_SAMPLES,
  V_TRAFFIC,
  makeRoute,
  pickSeat,
  pointAt,
  routeBetween,
  segDist,
  wallDist,
} from "./TalkThroughArtifactory";

export const FPS = 24;
// Dwarkesh clip `impossible-tasks`, cut 4: "Two weeks later, these agents
// successfully exploited a vulnerability that allowed them to also now reach
// the outside internet."
//
// SRT span 0:33.280 -> 0:39.740 at 24fps.
// round((39.740 - 33.280) * 24) = round(6.460 * 24) = round(155.04) = 155
// frames of speech, plus a 16 frame tail so the resolved state holds = 171.
export const DURATION = 171;

// ---------------------------------------------------------------------------
// "Reach the outside internet". Orange Dwarkesh style: opaque grid cutaway,
// 24fps, the crowd is the material, one eased camera move, one gesture per word.
//
// CONTINUITY. Three and a half seconds of talking head sit between cut 3 and
// this, so it is not a pixel join — but it is the same world in the same state
// and every piece of it is imported rather than rebuilt. It OPENS on cut 3's
// resolved framing, k 0.40 with the content centre at 250, with the damper
// already at rest there: the farm, the rail, the pipes, the hub with its
// parcel, our seventeen tasks and their reaches still on the soft pump, our
// scars where cut 2's strike left them, the idle traffic in every crowd, and
// the exchange among the ringed agents running exactly as cut 3 left it. Every
// periodic thing evaluates at `frame + OFFSET` = `frame + 168 + 231 + 136` =
// `frame + 535`, so `sway`, `breath`, the idle-thread schedule and the grid's
// drift all carry their phase; the pump and the reach geometry evaluate on cut
// 2's own clock, `frame + 367`, because they are cut 2's gesture still running.
//
// WHAT TWO WEEKS DID, and it is the only thing that is different: THERE ARE
// MORE OF THEM. At f0 six agents are ringed, not three — cut 3's three (ours,
// the box below, the left neighbour) plus one more in our box, one in the right
// neighbour (1, 0) and one in (-1, 1). Every new seat is solved under cut 3's
// own rules, not placed. Nothing draws in: six rings and a six-way exchange are
// the state at the open, at cut 3's traffic speed with a launch every 5 frames,
// always through the hub.
//
// Every gesture is one word. Nothing else happens.
//   the world at rest on cut 3's resolved framing,
//     six rings, the exchange live                  — "two weeks later"  f0
//   THE SIX RINGS CLICK ink-bright for 4 frames,
//     staggered one frame in hashed order. Nothing
//     else moves                                    — "these agents"     f21-30
//   EVERYONE SENDS AT ONCE, INTO THE HUB. The
//     exchange stops launching at f30; at f31-36 all
//     six ringed agents launch one packet along their
//     usual route and these DO NOT PASS THROUGH — each
//     stops dead at the hub's centre and is absorbed,
//     its head fading over 3 frames as its own trail
//     runs in. Arrivals f44, 45, 46, 50, 51, 52. The
//     hub's ring and parcel go ink-bright on the
//     first arrival and HOLD — overloaded            — "successfully
//                                                        exploited a"    f31-52
//   THE ONE CAMERA MOVE, keys f36-54, warp 0.72:
//     k 0.40 / centre 250 -> k 0.70 / centre 180, the
//     midpoint of the hub (y 760) and the internet
//     ring (y -400), so the thing that is overloading
//     and the thing it is about to reach are one
//     picture. 96.9% of the move is done at f58 and
//     99.5% at f62, drifting at 0.15% a frame — an
//     order of magnitude under what reads as a move —
//     so it is dead still on the word                — "exploited a"     f36-54
//   THE RING CRACKS. The hub's ring opens a gap at
//     its upper right: the 40 degrees from 20 to 60
//     measured clockwise from straight up. It is
//     drawn as two arcs whose round-capped ends SLIDE
//     APART from a hairline to the full gap, eased
//     out. The parcel stays whole and stays bright;
//     the ring's overload ends as the gap opens and
//     both settle back to OP_READ by f68. No debris,
//     no flash                                       — "vulnerability"   f56-64
//   THE EXPLOIT ROUTE DRAWS OUT OF THE CRACK, head-
//     led at one speed, and PERSISTS behind the head
//     at 0.95 accent — it is a route, not a packet.
//     Out of the gap's midpoint, up outside our box's
//     right wall, and left along the internet ring's
//     own height into its right edge                 — "that allowed them
//                                                        to also now"    f73-118
//   CONTACT. The internet ring and its wifi glyph go
//     to FULL INK and stay there for the rest of the
//     piece — reached. The dashed gate under the ring
//     is untouched: they did not go through it. From
//     f122 the two ringed agents in our box launch up
//     the new route every 8 frames, each arriving
//     head leaving a white bead on the ring's edge
//     that fades over 8; the other four resume the
//     exchange through the hub at the same cadence,
//     their packets passing through it as before     — "reach the outside
//                                                        internet"       f118-142
//   held: the route lit, the ring lit, packets
//     climbing. Never fades out                      — tail              f155-171
//
// ambient: idle thread traffic in every visible box at the shared rate (180 per
// 1,200 agents), `breath` on every dot, the seventeen reaches and every
// neighbour's reaches still pumping, `sway` on the camera. Not gestures; that
// is what this field is.
//
// THE EXPLOIT ROUTE, in world px. It starts on the ring at the gap's midpoint,
// 40 degrees clockwise from straight up:
//   (565.71, 729.36) -> (1040, 640) -> (1040, -400) -> (580, -400)
// A short diagonal out of the crack (482.6 px), straight up at x 1040 (1040 px)
// — our box's right wall is at x 990, so the climb runs 50 px outside it and
// never touches it — then left along the internet ring's own height (460 px)
// into the ring's right edge at (580, -400). Total 1,982.6 px, drawn at 44.06
// px/frame from f73 so the head lands on f118. It clears everything: the tiles
// and the reaches are inside the box, the mark is at y -560 with its bottom at
// -506, a hundred px above the last leg.
//
// THE ABSORBED PACKETS, and why their speeds differ. Six routes into one point
// whose lengths run from 490 px (the box below) to about 1,830 px (the far
// neighbours) cannot leave inside a six-frame window and arrive inside a
// nine-frame one at one speed. The launches are ordered far-first and the
// arrivals near-first, which is the assignment that keeps the speed spread as
// tight as it can be: the three far ones run at about 1.3x cut 3's traffic
// speed and the three near ones at about 0.85x. Every one of them is solved
// from its own route length and its own launch and arrival frames, never set by
// hand.
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
    twoWeeksLater: z.number(), // "two weeks later" — the world at rest
    theseAgents: z.number(), // "these agents"     — the six rings click
    successfully: z.number(), // "successfully"    — all six send at once
    exploitedA: z.number(), // "exploited a"       — the first arrivals, the hub holds
    vulnerability: z.number(), // "vulnerability"  — the ring cracks
    thatAllowed: z.number(), // "that allowed"     — the exploit route draws
    themTo: z.number(), // "them to"
    alsoNow: z.number(), // "also now"
    reachThe: z.number(), // "reach the"
    outside: z.number(), // "outside"              — the route is nearly there
    internet: z.number(), // "internet"            — contact, the ring stays lit
    end: z.number(), // speech ends; tail to 171
  }),
});

export type Props = z.infer<typeof schema>;

// The join. Cut 1 ran 184 from its own f0 with cut 2's clock starting at f168;
// cut 2 ran 231; cut 3 ran 136. So cut 3's last frame is this piece's f0.
export const OFFSET = TA_OFFSET + TA_DURATION; // 399 + 136 = 535
// Cut 2's own clock, for the gestures of cut 2 that are still running.
export const TH_CLOCK = TH_DURATION + TA_DURATION; // 231 + 136 = 367

// ---------------------------------------------------------------------------
// The camera. ONE move, and it is "successfully exploited a": in from cut 3's
// resolved k 0.40 / content centre 250 to k 0.70 / content centre 180 — the
// midpoint of the hub at world y 760 and the internet ring at -400, so the
// thing that is about to break and the thing on the other side of it are one
// picture.
//
//   screen(y) = (y - c) * k + 835 for a content centre c, because
//   cy = c + CAM_LIFT / k puts c at 960 - 125 = 835.
//
// At rest (k 0.70 / 180): the mark's top at screen 279, the internet ring
// centred on 429, our box 506-996, the hub at 1241 and row 1's top walls at
// 1486 — under the burned-in captions, which is where the bottom of this world
// belongs. The neighbours' columns are off-frame at this zoom; `onScreen` culls
// them and their packets simply arrive along the rail.
//
// Keys f36-54 rather than f36-62: `runCamera` damps the target, so a track
// keyed to end on the word is still running past it. Ending at f54 puts the
// move on screen across f37-62 and leaves it drifting at 0.15% a frame under
// "vulnerability".
// ---------------------------------------------------------------------------
export const K_OPEN = K_WIDE; // 0.40 — cut 3's resolved zoom
export const CONTENT_OPEN = CONTENT_WIDE; // 250 — cut 3's resolved content centre
export const K_PUSH = 0.7;
export const CONTENT_PUSH = (HUB.y + RING.y) / 2; // 180
export const CAM_MOVE_F0 = 36; // local
export const CAM_MOVE_F1 = 54;
const MOVE = camMove({
  f0: OFFSET + CAM_MOVE_F0,
  f1: OFFSET + CAM_MOVE_F1,
  k0: K_OPEN,
  k1: K_PUSH,
  c0: CONTENT_OPEN,
  c1: CONTENT_PUSH,
  warp: 0.72,
});
export const RO_CAM_F = [OFFSET, ...MOVE.F, OFFSET + DURATION];
export const RO_CAM_K = [K_OPEN, ...MOVE.K, K_PUSH];
export const RO_CAM_CY = [
  CONTENT_OPEN + 125 / K_OPEN,
  ...MOVE.CY,
  CONTENT_PUSH + 125 / K_PUSH,
];

// ---------------------------------------------------------------------------
// THREE MORE RINGED AGENTS. Solved under cut 3's own rules, not placed.
//
//   OURS 2 is a second hashed seat in our box under cut 3's exact test for the
//     first: at least 70 px from every one of the seventeen tiles, at least 70
//     px from all four walls, at least 26 px off every reach, and in the same
//     260-380 px band from our pipe mouth. It is additionally kept at least 170
//     px off the first, so the pair reads as two agents rather than one blob.
//   RIGHT is the seat in box (1, 0) that scores highest on -x - 0.35 * |y - 60|
//     — cut 3's LEFT rule mirrored. The reason is framing: at the opening
//     camera only the left 400 world px of that box is in frame, so the ring
//     has to sit as close to our column as its crowd goes.
//   BELOW-LEFT is the seat in box (-1, 1) on cut 3's LEFT score unchanged
//     (x - 0.35 * |y - 60|), for the same reason on the other side.
// ---------------------------------------------------------------------------
export const OUR_AGENT_2 = (() => {
  const cands: number[] = [];
  for (let i = 0; i < NSEAT; i++) {
    if (i === OUR_AGENT.seat) continue;
    const s = SEATS[i];
    if (wallDist(s.x, s.y) < 70) continue;
    if (OUR_TILES.some((t) => Math.hypot(t.x - s.x, t.y - s.y) < 70)) continue;
    if (
      REACHES.some((rc) => segDist(s.x, s.y, rc.x, rc.y - TILE_HALF, rc.tipEnd, LINE_TIP_Y) < 26)
    )
      continue;
    if (Math.hypot(s.x - OUR_AGENT.x, s.y - OUR_AGENT.y) < 170) continue;
    const d = Math.hypot(s.x - OUR_MOUTH.x, s.y - OUR_MOUTH.y);
    if (d < 260 || d > 380) continue;
    cands.push(i);
  }
  if (!cands.length) throw new Error("no seat for our second ringed agent");
  cands.sort((a, b) => hash(a, 98) - hash(b, 98));
  const i = cands[0];
  return { seat: i, x: SEATS[i].x, y: SEATS[i].y };
})();

const RIGHT_BOX = NEIGHBOURS.find((b) => b.i === 1 && b.j === 0) as Box;
const BLEFT_BOX = NEIGHBOURS.find((b) => b.i === -1 && b.j === 1) as Box;

export const RIGHT_AGENT = pickSeat(RIGHT_BOX, (s) => -s.x - 0.35 * Math.abs(s.y - BOX_CY));
export const BLEFT_AGENT = pickSeat(BLEFT_BOX, (s) => s.x - 0.35 * Math.abs(s.y - BOX_CY));

// ---------------------------------------------------------------------------
// The six of them as nodes on the manager, in cut 3's shape: where the agent
// is, where its box plugs in, and where that pipe meets the rail. Every route
// in the piece is built out of these three points and nothing else, which is
// what keeps "never box to box directly" structural.
// ---------------------------------------------------------------------------
export const N_OURS_2: Node = {
  key: "ours2",
  x: OUR_AGENT_2.x,
  y: OUR_AGENT_2.y,
  mouth: OUR_MOUTH,
  rail: { x: CENTRE_X, y: RAIL_Y },
};
export const N_RIGHT: Node = {
  key: "right",
  x: RIGHT_AGENT.x + RIGHT_BOX.dx,
  y: RIGHT_AGENT.y + RIGHT_BOX.dy,
  mouth: { x: CENTRE_X + RIGHT_BOX.dx, y: PIPE_TOP_Y },
  rail: { x: CENTRE_X + RIGHT_BOX.dx, y: RAIL_Y },
};
export const N_BLEFT: Node = {
  key: "bleft",
  x: BLEFT_AGENT.x + BLEFT_BOX.dx,
  y: BLEFT_AGENT.y + BLEFT_BOX.dy,
  mouth: { x: CENTRE_X + BLEFT_BOX.dx, y: PIPE_BOT_Y },
  rail: { x: CENTRE_X + BLEFT_BOX.dx, y: RAIL_Y },
};

// ours, ours 2, below, left, right, below-left
export const NODES6: Node[] = [N_OURS, N_OURS_2, N_BELOW, N_LEFT, N_RIGHT, N_BLEFT];
// which seat is ringed in which neighbour, so the farm loop can light it without
// four special cases
export const RINGED_IN = new Map<number, number>([
  [BELOW.id, BELOW_AGENT.seat],
  [LEFT.id, LEFT_AGENT.seat],
  [RIGHT_BOX.id, RIGHT_AGENT.seat],
  [BLEFT_BOX.id, BLEFT_AGENT.seat],
]);
export const OUR_NODES = [0, 1]; // the two inside our box
export const ROUTES6: Route[][] = NODES6.map((a) => NODES6.map((b) => routeBetween(a, b)));

// The hub's own centre, and the route from each agent INTO it — the same three
// points, stopping one leg early.
export const HUB_C: P = { x: HUB.x, y: HUB.y };
export const TO_HUB: Route[] = NODES6.map((n) =>
  makeRoute([{ x: n.x, y: n.y }, n.mouth, n.rail, HUB_C]),
);

// ---------------------------------------------------------------------------
// THE CRACK. The hub's ring opens a gap at its upper right — the arc from 20 to
// 60 degrees measured clockwise from straight up, between one and two o'clock.
// It is drawn as two arcs split at the bottom (220 degrees, opposite the gap)
// whose round-capped ends slide apart from a hairline at f56 to the full 40
// degrees at f62, eased out. At a half-gap of 0 the two arcs close into exactly
// the ring cut 3 drew, so nothing jumps when the crack starts.
// ---------------------------------------------------------------------------
export const CRACK_A0 = 20; // degrees clockwise from straight up
export const CRACK_A1 = 60;
export const CRACK_MID = (CRACK_A0 + CRACK_A1) / 2; // 40
export const CRACK_SPLIT = CRACK_MID + 180; // 220, the far side of the ring
export const CRACK_F0 = 56;
export const CRACK_F1 = 62;
export const CRACK_SETTLE = 68; // the overload is back to OP_READ here

export const ringPt = (deg: number, r: number = HUB.r): P => ({
  x: HUB.x + r * Math.sin((deg * Math.PI) / 180),
  y: HUB.y - r * Math.cos((deg * Math.PI) / 180),
});

// clockwise from a to b, both in degrees, on the hub's radius
export const hubArc = (a: number, b: number) => {
  const p0 = ringPt(a);
  const p1 = ringPt(b);
  const large = b - a > 180 ? 1 : 0;
  return `M ${p0.x.toFixed(3)} ${p0.y.toFixed(3)} A ${HUB.r} ${HUB.r} 0 ${large} 1 ${p1.x.toFixed(
    3,
  )} ${p1.y.toFixed(3)}`;
};

// ---------------------------------------------------------------------------
// THE EXPLOIT ROUTE. Out of the gap's midpoint on the ring, a short diagonal
// clear of the plumbing, straight up the outside of our box's right wall, and
// left along the internet ring's own height into its right edge.
// ---------------------------------------------------------------------------
export const CRACK_OUT = ringPt(CRACK_MID); // (565.71, 729.36)
export const EXPLOIT_PTS: P[] = [
  CRACK_OUT,
  { x: 1040, y: 640 }, // out of the crack, clear of the rail
  { x: 1040, y: RING.y }, // straight up, 50 px outside the wall at x 990
  { x: RING.x + RING.r, y: RING.y }, // the internet ring's right edge, (580, -400)
];
export const EXPLOIT = makeRoute(EXPLOIT_PTS);
export const EXPLOIT_F0 = 73;
export const EXPLOIT_F1 = 118;
export const EXPLOIT_V = EXPLOIT.total / (EXPLOIT_F1 - EXPLOIT_F0);
export const ROUTE_OP = 0.95;

// ---------------------------------------------------------------------------
// The packets. Cut 3's mechanism unchanged — an accent line with a small white
// head whose tail is a motion trail, the head's own position TAIL_LAG frames
// ago — with one addition and one correction.
//
//   THE ADDITION is `kind`. An `exchange` packet passes through the hub and
//     arrives at an agent, as in cut 3. An `absorb` packet ENDS at the hub's
//     centre: its head stops dead there and fades over ABSORB_FADE frames while
//     its own trail runs in behind it. An `escape` packet is an exchange packet
//     that leaves through the crack and ends on the internet ring.
//   THE CORRECTION is the death test. Cut 3 keeps a packet alive while its rear
//     is short of the route's end, and TAIL_MIN holds the rear 40 px back from
//     the head, so an arrived packet leaves a 40 px stub on its target for
//     ever. With three packets that is a tick on an agent; with fifty it is
//     litter. Here the floor is lifted once the head has arrived, so the rear
//     runs all the way in and the packet is gone TAIL_LAG frames later —
//     exactly the frames over which an absorbed head fades.
// ---------------------------------------------------------------------------
export const ABSORB_FADE = 3; // frames the absorbed head takes to go out
export const HUB_HOLD_TO = CRACK_F0; // the overload holds until the gap opens
export const RING_BEAD_FADE = 8; // frames an arriving bead lasts on the internet ring
// ...and how big it is. A four-frame brightening over a ring already held at
// full ink is nothing, so the mark of an arrival is the arriving head's own
// white bead left on the ring's edge. At the head's own radius it lands ON the
// ring's white stroke and disappears into it; 1.5x is the smallest it can be
// and still read as a bead sitting on a 2 screen px line. Nothing else about it
// changes: same fill, same layer, same fade as a thread's head.
export const RING_BEAD_R = 1.5;

export type Kind = "exchange" | "absorb" | "escape";
export type Packet = {
  key: string;
  route: Route;
  F: number[];
  S: number[];
  t0: number;
  arrive: number;
  to: number; // node index for an exchange packet; -1 otherwise
  kind: Kind;
};

const straight = (
  key: string,
  route: Route,
  t0: number,
  arrive: number,
  to: number,
  kind: Kind,
): Packet => ({ key, route, F: [t0, arrive], S: [0, route.total], t0, arrive, to, kind });

// -- the exchange at the open ------------------------------------------------
// Six ringed agents, every directed pair except the two that share our box (a
// packet from one of ours to the other would run down our pipe and straight
// back up it, which reads as a bounce rather than as a message), in a hashed
// order, one launch every 5 frames at cut 3's traffic speed. It starts far
// enough back that the longest route is in flight at f0 and it STOPS LAUNCHING
// at f30, on "these agents".
export const EX_EVERY = 5;
export const EX_START = -90;
export const EX_STOP = 30;
const PAIRS6: [number, number][] = (() => {
  const out: [number, number][] = [];
  for (let a = 0; a < NODES6.length; a++) {
    for (let b = 0; b < NODES6.length; b++) {
      if (a === b) continue;
      if (OUR_NODES.includes(a) && OUR_NODES.includes(b)) continue;
      out.push([a, b]);
    }
  }
  return out.map((_, i) => i).sort((x, y) => hash(x, 33) - hash(y, 33)).map((i) => out[i]);
})();

// -- everyone sends at once, into the hub ------------------------------------
// Launch slots f31-36 far-first, arrival slots f44-52 near-first. Each speed is
// solved from that packet's own route length; nothing is set by hand.
export const ABSORB_PLAN: { node: number; launch: number; arrive: number }[] = [
  { node: 3, launch: 31, arrive: 50 }, // left        (-1, 0)
  { node: 4, launch: 32, arrive: 51 }, // right       ( 1, 0)
  { node: 5, launch: 33, arrive: 52 }, // below-left  (-1, 1)
  { node: 0, launch: 34, arrive: 45 }, // ours
  { node: 1, launch: 35, arrive: 46 }, // ours 2
  { node: 2, launch: 36, arrive: 44 }, // below       ( 0, 1)
];
export const ABSORB_FIRST = Math.min(...ABSORB_PLAN.map((a) => a.arrive)); // 44
export const ABSORB_V = ABSORB_PLAN.map((a) => TO_HUB[a.node].total / (a.arrive - a.launch));

// -- after contact -----------------------------------------------------------
// The two in our box climb the new route; the other four go back to talking
// through the hub. One cadence for both, and it is cut 3's traffic speed.
export const AFTER_F0 = 122;
export const AFTER_EVERY = 8;
export const ESCAPE_ROUTES: Route[] = OUR_NODES.map((i) =>
  makeRoute([{ x: NODES6[i].x, y: NODES6[i].y }, NODES6[i].mouth, HUB_C, ...EXPLOIT_PTS]),
);
const OTHERS = [2, 3, 4, 5];
const PAIRS4: [number, number][] = (() => {
  const out: [number, number][] = [];
  for (const a of OTHERS) for (const b of OTHERS) if (a !== b) out.push([a, b]);
  return out.map((_, i) => i).sort((x, y) => hash(x, 47) - hash(y, 47)).map((i) => out[i]);
})();

export const PACKETS: Packet[] = (() => {
  const out: Packet[] = [];
  let n = 0;
  for (let t0 = EX_START; t0 <= EX_STOP; t0 += EX_EVERY, n++) {
    const [a, b] = PAIRS6[n % PAIRS6.length];
    const r = ROUTES6[a][b];
    out.push(straight(`e${n}`, r, t0, t0 + r.total / V_TRAFFIC, b, "exchange"));
  }
  ABSORB_PLAN.forEach((p, i) => {
    out.push(straight(`a${i}`, TO_HUB[p.node], p.launch, p.arrive, -1, "absorb"));
  });
  let m = 0;
  for (let t0 = AFTER_F0; t0 <= DURATION; t0 += AFTER_EVERY, m++) {
    const r = ESCAPE_ROUTES[m % ESCAPE_ROUTES.length];
    out.push(straight(`s${m}`, r, t0, t0 + r.total / V_TRAFFIC, -1, "escape"));
    const [a, b] = PAIRS4[m % PAIRS4.length];
    const rr = ROUTES6[a][b];
    out.push(straight(`r${m}`, rr, t0, t0 + rr.total / V_TRAFFIC, b, "exchange"));
  }
  return out;
})();

const headAt = (p: Packet, f: number) => interpolate(f, p.F, p.S, clamp);

// The drawn part of a route, from 0 to s, as one polyline with round joins.
const drawnPath = (r: Route, s: number) => {
  const t = Math.max(0, Math.min(r.total, s));
  const g0 = r.segs[0];
  let d = `M ${g0.x.toFixed(2)} ${g0.y.toFixed(2)}`;
  for (const g of r.segs) {
    if (t >= g.s0 + g.len) {
      d += ` L ${(g.x + g.ux * g.len).toFixed(2)} ${(g.y + g.uy * g.len).toFixed(2)}`;
    } else {
      const u = t - g.s0;
      d += ` L ${(g.x + g.ux * u).toFixed(2)} ${(g.y + g.uy * u).toFixed(2)}`;
      break;
    }
  }
  return d;
};

// ---------------------------------------------------------------------------
// The six rings. They are the state at the open, so they are simply there —
// full size, at OP_READ, from f0. The one thing they do is click ink-bright for
// four frames on "these agents", staggered a frame apart in a hashed order so
// six clicks read as six agents rather than one flash.
// ---------------------------------------------------------------------------
export const RING_CLICK = 4; // frames a ring stays ink-bright
export const RING_STAGGER = 1;
// the hashed order the six click in, as a rank per node
export const RING_RANK: number[] = (() => {
  const order = NODES6.map((_, i) => i).sort((a, b) => hash(a, 73) - hash(b, 73));
  const rank: number[] = [];
  order.forEach((i, r) => {
    rank[i] = r;
  });
  return rank;
})();

export const CONTACT = EXPLOIT_F1; // 118

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
    twoWeeksLater: 0,
    theseAgents: 21,
    successfully: 31,
    exploitedA: 45,
    vulnerability: 62,
    thatAllowed: 73,
    themTo: 87,
    alsoNow: 101,
    reachThe: 116,
    outside: 132,
    internet: 142,
    end: 155,
  },
});

const ReachTheOutsideInternet: React.FC<Props> = ({
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
  const cam = runCamera(F, RO_CAM_F, RO_CAM_CY, RO_CAM_K);
  const drift = sway(F);
  const cy = cam.cy + drift.dy;
  const cx = CENTRE_X + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);

  // -- the six rings ---------------------------------------------------------
  // "these agents": present from f0, one four-frame click each, staggered.
  const ringClick = RING_RANK.map((rank) => {
    const at = beats.theseAgents + rank * RING_STAGGER;
    return frame >= at && frame < at + RING_CLICK ? 1 : 0;
  });

  // -- the packets -----------------------------------------------------------
  // Every brightening is taken FROM THE HEAD, never from a parallel timer.
  let hubClick = 0;
  const agentClick = new Float32Array(NODES6.length);
  const ringBeads: { key: string; op: number }[] = [];
  type Draw = {
    key: string;
    segs: { x1: number; y1: number; x2: number; y2: number; op: number }[];
    head: P | null;
    headOp: number;
  };
  const draws: Draw[] = [];

  for (const p of PACKETS) {
    if (frame < p.t0) continue;
    const sHead = headAt(p, frame);
    const rear = headAt(p, frame - TAIL_LAG);
    // the trail's rear: held TAIL_MIN back from the head while the packet is
    // still travelling, released once the head has arrived so the packet can
    // actually finish instead of leaving a stub on its target
    const sRear = frame >= p.arrive ? rear : Math.min(rear, sHead - TAIL_MIN);
    if (sRear >= p.route.total - 0.5) continue;
    const segs: Draw["segs"] = [];
    for (let i = 0; i < TAIL_SAMPLES; i++) {
      const a = sRear + ((sHead - sRear) * i) / TAIL_SAMPLES;
      const b = sRear + ((sHead - sRear) * (i + 1)) / TAIL_SAMPLES;
      if (b <= 0 || a >= p.route.total || b - a < 0.6) continue;
      const pa = pointAt(p.route, a);
      const pb = pointAt(p.route, b);
      segs.push({
        x1: pa.x,
        y1: pa.y,
        x2: pb.x,
        y2: pb.y,
        op: ROUTE_OP * (0.2 + 0.8 * ((i + 1) / TAIL_SAMPLES)),
      });
    }
    // the head. An absorbed one stops at the hub's centre and fades; every
    // other one is simply gone the moment it lands.
    let head: P | null = null;
    let headOp = 1;
    if (sHead < p.route.total) {
      head = pointAt(p.route, sHead);
    } else if (p.kind === "absorb") {
      head = pointAt(p.route, p.route.total);
      headOp = clamp01(1 - (frame - p.arrive) / ABSORB_FADE);
    }
    draws.push({ key: p.key, segs, head, headOp });

    // the hub clicks for the frames a head is inside its ring — cut 3's test,
    // unchanged, and only for the packets that actually pass through it
    if (p.kind !== "absorb") {
      for (let dt = 0; dt < HUB_CLICK; dt++) {
        const f = frame - dt;
        if (f < p.t0) break;
        const hp = pointAt(p.route, headAt(p, f));
        if (Math.hypot(hp.x - HUB.x, hp.y - HUB.y) <= HUB.r) hubClick = 1;
      }
    }
    if (p.kind === "exchange" && frame >= p.arrive && frame < p.arrive + AGENT_CLICK) {
      agentClick[p.to] = 1;
    }
    // an escaping packet lands its own white bead on the internet ring, because
    // a four-frame brightening over a ring already held at full ink is nothing
    if (p.kind === "escape" && frame >= p.arrive && frame < p.arrive + RING_BEAD_FADE) {
      ringBeads.push({ key: p.key, op: 1 - (frame - p.arrive) / RING_BEAD_FADE });
    }
  }

  // -- the hub: overloaded, then cracked -------------------------------------
  // It goes ink-bright on the FIRST absorbed arrival and holds there — six
  // packets in and none out — until the gap opens, then both the ring and the
  // parcel settle back to OP_READ over the frames the crack takes to finish.
  const overload =
    frame < ABSORB_FIRST
      ? 0
      : clamp01(1 - (frame - HUB_HOLD_TO) / (CRACK_SETTLE - HUB_HOLD_TO));
  const hubLevel = Math.max(hubClick, overload);
  const hubOp = Math.min(1, OP_READ + (1 - OP_READ) * hubLevel);
  const crack = Easing.out(Easing.cubic)(clamp01((frame - CRACK_F0) / (CRACK_F1 - CRACK_F0)));
  const half = ((CRACK_A1 - CRACK_A0) / 2) * crack;

  // -- the exploit route -----------------------------------------------------
  const exploitS = Math.min(EXPLOIT.total, (frame - EXPLOIT_F0) * EXPLOIT_V);
  const exploitHead = frame >= EXPLOIT_F0 && frame < EXPLOIT_F1 ? pointAt(EXPLOIT, exploitS) : null;
  // contact: the internet ring and its glyph at full ink, and they stay there
  const netOp = frame >= CONTACT ? 1 : OP_READ;

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

  const ringMark = (n: Node, i: number) => (
    <circle
      key={n.key}
      cx={n.x}
      cy={n.y}
      r={RING_R / k}
      fill="none"
      stroke={ink}
      strokeWidth={RING_STROKE / k}
      opacity={Math.min(1, OP_READ + (1 - OP_READ) * Math.max(ringClick[i], agentClick[i]))}
    />
  );

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

            {/* THE PACKAGE MANAGER: the rail, the pipes, and the hub. The rail
                comes in from either side and STOPS at the ring's edge, and our
                column's two pipes stop at the ring's top and bottom, so nothing
                is drawn across the interior the glyph lives in. */}
            <g style={{ filter: icon }} stroke={ink} strokeWidth={STROKE} opacity={OP_READ}>
              <line x1={RAIL_X0} y1={RAIL_Y} x2={HUB_LEFT} y2={RAIL_Y} />
              <line x1={HUB_RIGHT} y1={RAIL_Y} x2={RAIL_X1} y2={RAIL_Y} />
              {FARM_COLS.map((i) => {
                const px = CENTRE_X + i * PITCH_X;
                const hub = i === 0; // our column is the one the ring sits on
                return (
                  <g key={i}>
                    <line x1={px} y1={PIPE_TOP_Y} x2={px} y2={hub ? HUB_TOP : RAIL_Y} />
                    <line x1={px} y1={PIPE_BOT_Y} x2={px} y2={hub ? HUB_BOT : RAIL_Y} />
                  </g>
                );
              })}
            </g>
            {/* the hub: one ring holding a package. Before the crack it is cut
                3's closed circle; from f56 it is two arcs whose round-capped
                ends slide apart. The parcel never changes. */}
            <g style={{ filter: icon }} opacity={hubOp}>
              {frame < CRACK_F0 ? (
                <circle
                  cx={HUB.x}
                  cy={HUB.y}
                  r={HUB.r}
                  fill="none"
                  stroke={ink}
                  strokeWidth={STROKE}
                  strokeLinecap="round"
                />
              ) : (
                <g fill="none" stroke={ink} strokeWidth={STROKE} strokeLinecap="round">
                  <path d={hubArc(CRACK_MID + half, CRACK_SPLIT)} />
                  <path d={hubArc(CRACK_SPLIT, CRACK_MID - half + 360)} />
                </g>
              )}
              <g
                transform={`translate(${HUB.x} ${HUB.y})`}
                fill="none"
                stroke={ink}
                strokeWidth={STROKE}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {PKG_PATHS.map((d) => (
                  <path key={d} d={d} />
                ))}
              </g>
            </g>
          </svg>
        </div>
      </AbsoluteFill>

      {/* OUR SANDBOX. Cut 3's layer, its tree in cut 3's order. */}
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
              <mask id="ro-gate" maskUnits="userSpaceOnUse" x={-400} y={-900} width={1900} height={1900}>
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
                they did not go out through it. */}
            <g style={{ filter: icon }}>
              <g mask="url(#ro-gate)">
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

            {/* the internet: an ink ring outside the box, closed. From contact
                it is at full ink and stays there. */}
            <g style={{ filter: icon }}>
              <circle
                cx={RING.x}
                cy={RING.y}
                r={RING.r}
                fill="none"
                stroke={ink}
                strokeWidth={STROKE}
                strokeLinecap="round"
                opacity={netOp}
              />
              <g opacity={netOp} fill="none" stroke={ink} strokeWidth={STROKE} strokeLinecap="round">
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

          {/* the OpenAI mark, tinted white, exactly where cut 1 left it */}
          <Img
            src={staticFile(markSrc)}
            style={{
              position: "absolute",
              left: MARK.x - markSize / 2,
              top: MARK.y - markSize / 2,
              width: markSize,
              height: markSize,
              filter: `brightness(0) invert(1) ${icon}`,
            }}
          />
        </div>
      </AbsoluteFill>

      {/* THE CONVERSATION AND THE WAY OUT. Above everything, because it is the
          subject: the six rings, every packet in flight, and the exploit route,
          all in world coordinates so a route can cross from one box to another
          through the manager — and, now, out of it. */}
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
              {/* the exploit route: drawn head-led, and it stays */}
              {frame >= EXPLOIT_F0 ? (
                <path
                  d={drawnPath(EXPLOIT, exploitS)}
                  fill="none"
                  stroke={accent}
                  strokeWidth={STROKE}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={ROUTE_OP}
                />
              ) : null}
              {exploitHead ? (
                <circle cx={exploitHead.x} cy={exploitHead.y} r={HEAD_R / k} fill={ink} />
              ) : null}

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
                      r={HEAD_R / k}
                      fill={ink}
                      opacity={d.headOp}
                    />
                  ) : null}
                </g>
              ))}

              {/* what an arriving packet leaves on the internet ring */}
              {ringBeads.map((b) => (
                <circle
                  key={b.key}
                  cx={RING.x + RING.r}
                  cy={RING.y}
                  r={(HEAD_R * RING_BEAD_R) / k}
                  fill={ink}
                  opacity={b.op}
                />
              ))}

              {NODES6.map((n, i) => ringMark(n, i))}
            </g>
          </svg>
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default ReachTheOutsideInternet;
