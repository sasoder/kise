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
  OP_READ,
  OP_UNREAD_DOT,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
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
  clamp01,
  smooth,
} from "./ImpossibleTasks";
// Cut 2. The farm, the pump, the ambient traffic helper.
import {
  FARM_COLS,
  OUR,
  PITCH_X,
  PUMP_CAP,
  PUMP_PULL,
  REACHES,
  type Th,
  WAVE2,
  idleFor,
  pumpAt,
} from "./TryToHackOut";
// Cut 3. The rail, the pipes, the hub, the packet mechanism, the frozen scars.
import {
  BEAD_R,
  HEAD_R,
  HUB_BOT,
  HUB_LEFT,
  HUB_RIGHT,
  HUB_TOP,
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
  pointAt,
  segDist,
} from "./TalkThroughArtifactory";
// Cut 4. The six ringed agents, their routes, the crack, the lit exploit route.
import {
  CRACK_A0,
  CRACK_A1,
  CRACK_MID,
  CRACK_SPLIT,
  EXPLOIT_PTS,
  HUB_C,
  NODES6,
  OUR_AGENT_2,
  ROUTES6,
  ROUTE_OP,
  hubArc,
} from "./ReachTheOutsideInternet";
// Cut 5 — THE WORLD STATE THIS PIECE CUTS TO. Only its two clocks are taken:
// this is a different camera on that same world at cut 5's own last spoken
// frame, so everything periodic evaluates at cut 5's f96. Nothing in that file
// (or in any file below it) was edited: cut 5's f0 and f111 come back PSNR inf
// against renders taken before this piece existed.
import { OFFSET as MG_OFFSET, TH_CLOCK as MG_TH_CLOCK } from "./MessageBoardAndGateway";

export const FPS = 24;
// Dwarkesh clip `impossible-tasks`, the close-up: "Because, as you might
// imagine, being able to talk to other agents and access the internet was going
// to help you score higher during training."
//
// SRT span 0:47.420 -> 0:54.280 at 24fps.
// round((54.280 - 47.420) * 24) = round(6.860 * 24) = round(164.64) = 165
// frames of speech, plus a 16 frame tail so the resolved state holds = 181.
export const DURATION = 181;

// ---------------------------------------------------------------------------
// "Score higher during training". Orange Dwarkesh style: opaque grid cutaway,
// 24fps, the crowd is the material, one eased camera move, one gesture per word.
//
// CONTINUITY. This piece starts at 0:47.420, which is CUT 5's SPEECH-END FRAME
// (its f96). It is not a new scene and it is not a later moment: it is a
// DIFFERENT CAMERA ON THE SAME WORLD AT THE SAME INSTANT — an editorial cut
// from cut 5's wide down to a close-up inside our own box. So no framing
// continuity is wanted or attempted, and every other kind is exact:
//
//   * OFFSET = 706 + 96 = 802. Everything periodic evaluates at `frame +
//     OFFSET` — `sway`, `breath`, the idle-thread schedule, the grid's drift —
//     so the hand on the camera and the ambient traffic carry their phase
//     across the cut. TH_CLOCK = 538 + 96 = 634, cut 2's own clock, for the
//     gestures of cut 2 that are still running (the pump on the reaches).
//   * The world is imported, never rebuilt: cut 1's box, seat grid, tiles,
//     dashed gate, internet ring and mark; cut 2's reaches and their soft pump;
//     cut 3's rail, pipes, hub and frozen scars; cut 4's six ringed agents,
//     their routes, the cracked hub and the lit exploit route.
//   * WHAT IS DIFFERENT is only what a close-up is. Cut 5 ends with heavy
//     traffic through the mouth; on this cut that drops to ONE ambient packet
//     every 12 frames at 0.4 trail opacity — present, not the subject — and our
//     own agent's four packets are the subject at 0.95.
//
// THE SHOT. A close-up on ONE agent — cut 3's OUR_AGENT at world (736.9,
// 159.8), the first agent in this whole clip to find the way out — and one
// ordinary neighbour 120 px to its left. The camera opens at k 1.60 and pushes
// to k 2.00 on its one move; the lateral centre is fixed at cx 791.9 and the
// content centre at 159.8 (our agent's own y) for the whole piece, so there is
// no pan and the subject never leaves screen (430, 835).
//
//   screen(x) = (x - 791.9) * k + 540, screen(y) = (y - 159.8) * k + 835,
//   because cy = contentCentre + CAM_LIFT / k puts the content centre at
//   960 - 125 = 835, under the burned-in captions.
//
// At the resolved k 2.00: our agent at (430, 835); the box's RIGHT WALL, with
// cut 2's scars on it, at screen x 936 — inside the frame, so the close-up has
// a ground; the PIPE MOUTH (540, 410) at screen (36, 1335), the bottom-left
// corner, so the channel to everything else is in the shot; the seventeen
// reaches and ten of the tiles crossing the upper half; and cut 4's lit exploit
// route running up screen x 1036, just outside the wall. At the opening k 1.60
// the box's top wall is still in frame at screen y 115 and leaves through the
// top as the push-in runs. Nothing in the world is moved to make this frame.
//
// SIZES. Everything the field draws in world px doubles here, which is the
// point — the dots come out at 11-14 screen px and read as solid discs. The
// things cuts 3-5 drew in SCREEN px (a ring at r 14 on stroke 3.5, a packet
// head at r 4) would go the other way and shrink to half a dot, so they are
// held at `max(v / k, v)` world px: at every k in this piece that is v world
// px, i.e. a 28 screen px ring around a 22 px dot and an 8 px head.
//
// Every gesture is one word. Nothing else happens.
//   THE CUT. The close-up, already inside the crowd,
//     with the push-in running f2-24 (the only camera
//     move in the piece), settled long before its
//     word                                           — "because as"      f0-24
//   THE SCORE APPEARS. A tally rises over each of the
//     two agents — a column of ink dots, r 4, pitch
//     22, from 32 px above the dot (r 6.5) — THREE TICKS
//     EACH, fading in together over 8 frames as one
//     drawing. Ink, because a score is a human-made
//     measure. Equal: there is nothing to choose
//     between these two agents yet                   — "imagine"         f25-33
//   A MESSAGE ARRIVES. An accent packet comes up out
//     of the pipe, crosses the mouth at f51 and runs
//     the straight line mouth -> agent, landing on
//     our agent at f60; the agent and its ring click
//     ink-bright for 4 frames                        — "to talk to"      f51-60
//   THE REPLY. Our agent sends one back down the same
//     line and out through the mouth, clear of the
//     frame by f76                                   — "other agents"    f66-76
//   IT REACHES OUT. A second packet out through the
//     mouth on the same line, clear by f90           — "and access the"  f80-90
//   THE INTERNET ANSWERS. A packet comes back in
//     through the mouth at f96 and lands at f104 —
//     five frames INSIDE the word, because it is the
//     answer. Its white head is 1.5x: it came from
//     the internet ring's bead, cut 4's rule          — "internet"       f96-104
//   THE TALLY RISES. Our column stacks from three to
//     SEVEN — one new tick every 4 frames at f125,
//     129, 133, 137, each fading in over 3 frames in
//     place, no drop and no spring. The neighbour's
//     stays at three                       — "you score higher"          f125-140
//   COUNTED. Our column of seven clicks ink-bright
//     for 4 frames together. Nothing else moves       — "training"       f151-155
//   held: seven against three. Never fades out        — tail             f165-181
//
// ambient: idle thread traffic across our crowd at the shared rate (180 per
// 1,200 agents), `breath` on every dot, the seventeen reaches still pumping on
// cut 2's soft cycle, `sway` on the camera, and one packet every 12 frames
// through the mouth between our box's OTHER ringed agent and the four ringed
// neighbours, at 0.4. Not gestures; that is what this field is.
//
// THE CULL. At k 1.60-2.00 the frame is 540-675 world px wide, so every one of
// the twenty-nine neighbour boxes is off screen and `onScreen` drops all of
// them; the rail and the hub are below the bottom edge and only our column's
// pipe is drawn. What is left is our own box.
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
  idleThreadCount: z.number(),
  markSrc: z.string(), // the OpenAI mark, tinted white
  markSize: z.number(), // world px, square
  beats: z.object({
    becauseAs: z.number(), // "because as"     — the cut, and the push-in
    youMight: z.number(), // "you might"
    imagine: z.number(), // "imagine"          — both tallies appear, three each
    beingAble: z.number(), // "being able"     — the camera is settled
    toTalkTo: z.number(), // "to talk to"      — a message arrives
    otherAgents: z.number(), // "other agents" — the reply goes out
    andAccessThe: z.number(), // "and access the" — it reaches out again
    internet: z.number(), // "internet"        — the internet answers
    wasGoing: z.number(), // "was going"
    toHelp: z.number(), // "to help"
    youScore: z.number(), // "you score"       — the tally starts stacking
    higherDuring: z.number(), // "higher during"
    training: z.number(), // "training"        — the seven click together
    end: z.number(), // speech ends; tail to 181
  }),
});

export type Props = z.infer<typeof schema>;

// The join. Cut 5's clock is `frame + 706`; this piece cuts to its f96, the
// frame its speech ends on, so every periodic thing here runs 96 frames later.
export const OFFSET = MG_OFFSET + 96; // 706 + 96 = 802
export const TH_CLOCK = MG_TH_CLOCK + 96; // 538 + 96 = 634

// ---------------------------------------------------------------------------
// The camera. ONE move, and it is the cut itself: a push from k 1.60 to k 2.00
// keyed f2-24, warp 0.72, with the lateral centre and the content centre both
// nailed down for the whole piece — cx 791.9 and 159.8, our agent's own y — so
// the push is the only thing that happens to the frame. Keys ending at f24 put
// the move on screen across f2-30 and leave it dead still under "being able"
// (f40), sixteen frames before the first packet.
//
// cx 791.9 is 55 px to the RIGHT of our agent: it buys 110 screen px at k 2, so
// the box's right wall lands inside the frame at 936 instead of 1046 hard
// against the edge, and the pipe mouth still sits in frame at the bottom-left.
// ---------------------------------------------------------------------------
export const K_OPEN = 1.6;
export const K_CLOSE = 2.0;
export const CONTENT = OUR_AGENT.y; // 159.8 — the subject holds screen y 835
export const CX_FIXED = OUR_AGENT.x + 55; // 791.9
export const CAM_MOVE_F0 = 2; // local
export const CAM_MOVE_F1 = 24;
const MOVE = camMove({
  f0: OFFSET + CAM_MOVE_F0,
  f1: OFFSET + CAM_MOVE_F1,
  k0: K_OPEN,
  k1: K_CLOSE,
  c0: CONTENT,
  c1: CONTENT,
  warp: 0.72,
});
export const SH_CAM_F = [OFFSET, ...MOVE.F, OFFSET + DURATION];
export const SH_CAM_K = [K_OPEN, ...MOVE.K, K_CLOSE];
export const SH_CAM_CY = [CONTENT + 125 / K_OPEN, ...MOVE.CY, CONTENT + 125 / K_CLOSE];

// A size the field wrote in SCREEN px, held so it can never come out smaller
// than the reference gave it: at k below 1 it is v / k world px, exactly as
// cuts 3-5 drew it; at the k of this close-up it is v world px, so it grows
// with the dots instead of shrinking against them.
export const heldPx = (v: number, k: number) => Math.max(v / k, v);

// ---------------------------------------------------------------------------
// THE COMPARISON PAIR. Our ringed agent — cut 3's OUR_AGENT, the subject of the
// whole second half of this clip — and ONE ORDINARY NEIGHBOUR, solved rather
// than placed: a seat 110-150 world px to its LEFT, on the same row of the
// crowd as it, not one of the six ringed agents, and at least 60 px clear of
// every tile.
//
// "ROUGHLY THE SAME Y" IS A HARD 10 PX HERE, and it is the gesture that makes
// it so: the two tallies are read against each other, so they have to stand on
// one baseline. A seat a step up or down the grid (24 px, 48 screen px at this
// zoom) puts the short column floating halfway up the tall one, and "seven
// against three" stops being a height at all. 10 px is inside a single hashed
// jitter, so the band still holds several seats.
//
// THE ONE RELAXATION, and it is the world's fault rather than the rule's: the
// brief also asks for 60 px of clearance from every reach, and there is no seat
// in that band that has it. The seventeen reaches converge on a point under the
// internet ring, so they ALL lean in over the crowd immediately left of our
// agent; the best clearance anywhere in the band is 38.4 px, and 28.2 among the
// seats that also share our agent's row. So the tile rule stands as a hard
// constraint and the reach rule becomes the score: the seat picked is the one
// in the band FURTHEST from any reach. That is seat 575 at (608.8, 160.5) —
// 128.1 px left, 0.7 px below, 102.9 px off the nearest tile and 28.2 off the
// nearest reach, with all three of its ticks 30 px clear.
// ---------------------------------------------------------------------------
export const NB_DX_MIN = 110;
export const NB_DX_MAX = 150;
export const NB_DY_MAX = 10;
export const NB_TILE_CLEAR = 60;

export const NEIGHBOUR = (() => {
  let best = -1;
  let bestScore = -Infinity;
  for (let i = 0; i < NSEAT; i++) {
    const s = SEATS[i];
    const dx = OUR_AGENT.x - s.x; // positive: the seat is to the LEFT
    if (dx < NB_DX_MIN || dx > NB_DX_MAX) continue;
    if (Math.abs(s.y - OUR_AGENT.y) > NB_DY_MAX) continue;
    if (NODES6.some((n) => Math.hypot(n.x - s.x, n.y - s.y) < 1)) continue; // never a ringed one
    if (OUR_TILES.some((t) => Math.hypot(t.x - s.x, t.y - s.y) < NB_TILE_CLEAR)) continue;
    const reachClear = Math.min(
      ...REACHES.map((rc) => segDist(s.x, s.y, rc.x, rc.y - TILE_HALF, rc.tipEnd, LINE_TIP_Y)),
    );
    if (reachClear > bestScore) {
      bestScore = reachClear;
      best = i;
    }
  }
  if (best < 0) throw new Error("no ordinary neighbour for the comparison pair");
  return { seat: best, x: SEATS[best].x, y: SEATS[best].y, reachClear: bestScore };
})();

// ---------------------------------------------------------------------------
// THE TALLIES. A score is a human-made measure, so it is ink, and it is made of
// the field's own primitives: a column of dots. Tick n sits TALLY_LIFT + n *
// TALLY_PITCH world px above its agent's dot, r TALLY_R, at OP_READ under the
// per-icon shadow.
//
// At the resolved k 2 our seventh tick lands at screen y 835 - 2 * (28 + 6 *
// 16) = 587 and the neighbour's third at 651, both well inside the 200-1460
// band the captions leave.
// ---------------------------------------------------------------------------
export const TALLY_R = 6.5; // director pass: was 4 — a tick must hold its own against a 22 px dot at k 2
export const TALLY_LIFT = 32;
export const TALLY_PITCH = 22;
export const TALLY_BASE = 3; // what both start with
export const TALLY_FINAL = 7; // what ours ends with
export const TALLY_IN_DUR = 8; // the base three, fading in as one drawing
export const TICK_IN_DUR = 3; // a stacked tick, fading in where it lands
export const TICK_EVERY = 4;
export const CLICK = 4; // the shared four-frame ink click

// ---------------------------------------------------------------------------
// OUR AGENT'S FOUR PACKETS. Cut 3's mechanism unchanged — an accent line whose
// tail is a motion trail, the head's own position TAIL_LAG frames ago — pointed
// down the straight line between our agent and its own pipe mouth, with a stub
// of the pipe on the far side of the mouth so a packet visibly comes OUT of the
// plumbing and goes back INTO it rather than appearing on a wall.
//
// The two speeds are solved from the brief's frames, not chosen:
//   IN  — the mouth-to-agent leg is 318.4 px and it is asked to cross it in 9
//         frames (mouth at f51, landing f60), so 35.38 px/frame. The route
//         starts TAIL_LAG frames of that below the mouth, so at f51 the head is
//         exactly at the mouth with its whole trail still in the pipe.
//   OUT — the same leg plus the pipe run-out, asked to be COMPLETELY clear of
//         the frame's bottom edge (world y 639.8 at k 2, arclength 548.2) ten
//         frames after it launches. The trail's rear is the head TAIL_LAG
//         frames back, so 548.2 = 7 * v and v = 78.31 px/frame — near the
//         world's own traffic speed, which is what these packets are.
//   ANSWER — 318.4 px in 8 frames (mouth at f96, landing f104), 39.80 px/frame,
//         with the same pipe lead-in.
// ---------------------------------------------------------------------------
export const AGENT_P: P = { x: OUR_AGENT.x, y: OUR_AGENT.y };
export const LEG = Math.hypot(AGENT_P.x - OUR_MOUTH.x, AGENT_P.y - OUR_MOUTH.y); // 318.391

// where the pipe stub ends, below the mouth: past the frame's bottom edge at
// k 2 (world y 639.8) and short of the hub's ring (720)
export const PIPE_OUT_Y = 700;
export const FRAME_BOTTOM_Y = CONTENT + 960 / K_CLOSE; // 639.8

export const IN_AT_MOUTH = 51;
export const IN_ARRIVE = 60;
export const V_IN = LEG / (IN_ARRIVE - IN_AT_MOUTH); // 35.377
export const ANSWER_AT_MOUTH = 96;
export const ANSWER_ARRIVE = 104;
export const V_ANSWER = LEG / (ANSWER_ARRIVE - ANSWER_AT_MOUTH); // 39.799

export const OUT_SPAN = 10; // frames from launch to completely gone
export const OUT_CLEAR_S = LEG + (FRAME_BOTTOM_Y - OUR_MOUTH.y); // 548.191
export const V_OUT = OUT_CLEAR_S / (OUT_SPAN - TAIL_LAG); // 78.313
export const OUT_1 = 66; // "other agents" — the reply
export const OUT_2 = 80; // "and access the" — it reaches out

const inboundRoute = (v: number) =>
  makeRoute([{ x: OUR_MOUTH.x, y: OUR_MOUTH.y + TAIL_LAG * v }, OUR_MOUTH, AGENT_P]);
export const OUT_ROUTE = makeRoute([AGENT_P, OUR_MOUTH, { x: OUR_MOUTH.x, y: PIPE_OUT_Y }]);

export type Pk = {
  key: string;
  route: Route;
  F: number[];
  S: number[];
  t0: number;
  arrive: number;
  op: number; // the trail's opacity ceiling
  headMul: number; // 1.5 for the one that came back from the internet ring
  lands: boolean; // does it end on our agent
};

const oneSpeed = (
  key: string,
  route: Route,
  t0: number,
  v: number,
  op: number,
  headMul: number,
  lands: boolean,
): Pk => {
  const arrive = t0 + route.total / v;
  return { key, route, F: [t0, arrive], S: [0, route.total], t0, arrive, op, headMul, lands };
};

// ---------------------------------------------------------------------------
// THE AMBIENT. Cut 5 ends with the rail full — a packet every 3 frames along it
// and one out to the internet every 4 — and this cut steps down to ONE every
// 12, on the eight routes that actually pass our mouth: our box's OTHER ringed
// agent (cut 4's OUR_AGENT_2, off the left of this frame) to and from the four
// ringed neighbours. Nothing routed to or from OUR agent is ambient; those four
// packets are the subject. Trails at 0.4, the shared ambient ceiling.
//
// The schedule starts far enough back that the packets in flight at f0 are the
// ones that were already running — a route is up to 2,939 px, 41 frames at the
// traffic speed, so 48 frames of run-up covers the longest of them.
// ---------------------------------------------------------------------------
export const AMB_EVERY = 12;
export const AMB_OP = 0.4;
export const AMB_T0 = -48;
export const AMB_ROUTES: Route[] = (() => {
  const out: Route[] = [];
  for (let j = 2; j < NODES6.length; j++) {
    out.push(ROUTES6[1][j]);
    out.push(ROUTES6[j][1]);
  }
  return out;
})();
export const AMB_ORDER = AMB_ROUTES.map((_, i) => i).sort((a, b) => hash(a, 43) - hash(b, 43));

export const PACKETS: Pk[] = (() => {
  const out: Pk[] = [];
  // the subject: in, out, out, back in
  out.push(
    oneSpeed("in", inboundRoute(V_IN), IN_AT_MOUTH - TAIL_LAG, V_IN, ROUTE_OP, 1, true),
    oneSpeed("out1", OUT_ROUTE, OUT_1, V_OUT, ROUTE_OP, 1, false),
    oneSpeed("out2", OUT_ROUTE, OUT_2, V_OUT, ROUTE_OP, 1, false),
    oneSpeed(
      "answer",
      inboundRoute(V_ANSWER),
      ANSWER_AT_MOUTH - TAIL_LAG,
      V_ANSWER,
      ROUTE_OP,
      1.5,
      true,
    ),
  );
  // the ambient
  let n = 0;
  for (let t0 = AMB_T0; t0 <= DURATION; t0 += AMB_EVERY, n++) {
    const r = AMB_ROUTES[AMB_ORDER[n % AMB_ORDER.length]];
    out.push(oneSpeed(`a${n}`, r, t0, V_TRAFFIC, AMB_OP, 1, false));
  }
  return out;
})();

const headAt = (p: Pk, f: number) => interpolate(f, p.F, p.S, clamp);

// The exploit route, drawn and lit since cut 4, runs up world x 1040 — inside
// this frame's right edge at screen x 1036. It is one static polyline.
export const EXPLOIT_PATH = EXPLOIT_PTS.map(
  (p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`,
).join(" ");
export const CRACK_HALF = (CRACK_A1 - CRACK_A0) / 2; // 20

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
    becauseAs: 0,
    youMight: 20,
    imagine: 25,
    beingAble: 40,
    toTalkTo: 51,
    otherAgents: 66,
    andAccessThe: 79,
    internet: 99,
    wasGoing: 106,
    toHelp: 118,
    youScore: 125,
    higherDuring: 133,
    training: 151,
    end: 165,
  },
});

const ScoreHigherCloseUp: React.FC<Props> = ({
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
  // camera carry their phase across the cut; F2 is cut 2's own, for the pump on
  // the seventeen reaches, which is cut 2's gesture still running.
  const F = frame + OFFSET;
  const F2 = frame + TH_CLOCK;
  const tone = makeTone(accentDeep, accent);

  // -- camera ----------------------------------------------------------------
  const cam = runCamera(F, SH_CAM_F, SH_CAM_CY, SH_CAM_K);
  const drift = sway(F);
  const cy = cam.cy + drift.dy;
  const cx = CX_FIXED + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);

  // -- the packets -----------------------------------------------------------
  // Every brightening is taken FROM THE HEAD, never from a parallel timer.
  let agentClick = 0;
  type Draw = {
    key: string;
    segs: { x1: number; y1: number; x2: number; y2: number; op: number }[];
    head: P | null;
    headR: number;
    op: number;
  };
  const draws: Draw[] = [];

  for (const p of PACKETS) {
    if (frame < p.t0) continue;
    const sHead = headAt(p, frame);
    const rear = headAt(p, frame - TAIL_LAG);
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
        op: p.op * (0.2 + 0.8 * ((i + 1) / TAIL_SAMPLES)),
      });
    }
    draws.push({
      key: p.key,
      segs,
      head: sHead < p.route.total ? pointAt(p.route, sHead) : null,
      headR: heldPx(HEAD_R, k) * p.headMul,
      op: p.op,
    });
    if (p.lands && frame >= p.arrive && frame < p.arrive + CLICK) agentClick = 1;
  }

  // -- the tallies -----------------------------------------------------------
  // Ours goes three -> seven, one tick every four frames from "you score"; the
  // neighbour's stays at three. A tick's opacity is its own fade and nothing
  // else — no drop, no spring, no travel.
  const tallyIn = smooth((frame - beats.imagine) / TALLY_IN_DUR);
  const tallyClick = frame >= beats.training && frame < beats.training + CLICK ? 1 : 0;
  const tickOp = (n: number) => {
    if (n < TALLY_BASE) return tallyIn;
    return clamp01((frame - (beats.youScore + (n - TALLY_BASE) * TICK_EVERY)) / TICK_IN_DUR);
  };
  type Tick = { key: string; x: number; y: number; op: number };
  const ticks: Tick[] = [];
  const column = (key: string, sx: number, sy: number, n: number, click: number) => {
    for (let i = 0; i < n; i++) {
      const op = tickOp(i);
      if (op <= 0.001) continue;
      ticks.push({
        key: `${key}${i}`,
        x: sx,
        y: sy - TALLY_LIFT - i * TALLY_PITCH,
        op: (OP_READ + (1 - OP_READ) * click) * op,
      });
    }
  };
  column("o", OUR_AGENT.x, OUR_AGENT.y, TALLY_FINAL, tallyClick);
  column("n", NEIGHBOUR.x, NEIGHBOUR.y, TALLY_BASE, 0);

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

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <GridBackground
        src={backgroundSrc}
        blur={backgroundBlur}
        dim={backgroundDim}
        frame={F}
        cy={cy}
        cyRest={CAM_CY[0]}
        cx={cx}
        cxRest={CX_FIXED}
        k={k}
        parallax={parallax}
      />

      {/* THE MANAGER. Every neighbour box is off screen at this zoom, so the
          farm loop draws nothing; the rail and the hub are below the bottom
          edge. What is left in frame is our own column's pipe, which is where
          the packets come from and go. Its own copy of the one global shadow,
          for cut 2's reason: a CSS filter rasterises the sub-tree it is on, and
          these two trees never overlap. */}
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
            {/* the hub: cracked since cut 4, its parcel whole. Below the frame
                at this zoom, drawn because it is the world. */}
            <g style={{ filter: icon }} opacity={OP_READ}>
              <g fill="none" stroke={ink} strokeWidth={STROKE} strokeLinecap="round">
                <path d={hubArc(CRACK_MID + CRACK_HALF, CRACK_SPLIT)} />
                <path d={hubArc(CRACK_SPLIT, CRACK_MID - CRACK_HALF + 360)} />
              </g>
              <g
                transform={`translate(${HUB_C.x} ${HUB_C.y})`}
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

      {/* OUR SANDBOX. Cut 5's layer, its tree in cut 5's order. */}
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
              <mask id="sh-gate" maskUnits="userSpaceOnUse" x={-400} y={-900} width={1900} height={1900}>
                <rect x={-400} y={-900} width={1900} height={1900} fill="#fff" />
                <rect x={GATE_X0} y={BOX_Y0 - 6} width={GATE_X1 - GATE_X0} height={12} fill="#000" />
              </mask>
            </defs>

            {/* our crowd. The subject's own dot goes ink for the four frames a
                packet lands on it — the shared click, on the dot as well as its
                ring, because at this zoom the dot IS the agent. */}
            {SEATS.map((s, i) => {
              const l = Math.max(lit[i], seatTone[i]);
              const r = dotRadius * s.r * s.rs * breath(F, hash(i, 9)) * (1 + 0.35 * l);
              const clicked = i === OUR_AGENT.seat && agentClick > 0;
              return (
                <circle
                  key={i}
                  cx={s.x}
                  cy={s.y}
                  r={r}
                  fill={clicked ? ink : tone(l)}
                  opacity={dotUnread}
                />
              );
            })}

            {/* idle traffic, head-led */}
            {threadEls.map(drawThread)}

            {/* the sandbox, with the gate cut 1 left dashed */}
            <g style={{ filter: icon }}>
              <g mask="url(#sh-gate)">
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

            {/* the internet: an ink ring outside the box, closed and reached */}
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

      {/* THE SCORE. Above everything, because it is the subject: the lit exploit
          route cut 4 left running up the right of this frame, every packet in
          flight, the ringed agents, and the two tallies. */}
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
              {/* the exploit route, drawn and lit since cut 4 */}
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
                    <circle cx={d.head.x} cy={d.head.y} r={d.headR} fill={ink} opacity={d.op} />
                  ) : null}
                </g>
              ))}

              {NODES6.map((n, i) => (
                <circle
                  key={n.key}
                  cx={n.x}
                  cy={n.y}
                  r={heldPx(RING_R, k)}
                  fill="none"
                  stroke={ink}
                  strokeWidth={heldPx(RING_STROKE, k)}
                  opacity={Math.min(1, OP_READ + (1 - OP_READ) * (i === 0 ? agentClick : 0))}
                />
              ))}

              {/* the two tallies */}
              {ticks.map((t) => (
                <circle key={t.key} cx={t.x} cy={t.y} r={TALLY_R} fill={ink} opacity={t.op} />
              ))}
            </g>
          </svg>
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default ScoreHigherCloseUp;
