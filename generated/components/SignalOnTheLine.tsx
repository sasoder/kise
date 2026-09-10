import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
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
  camEase,
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
  PKG_PATHS,
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
// Cut 4. The crack, the exploit route, the lit internet ring, the six ringed
// agents and the pair tables, the bead an arrival leaves on the ring.
import {
  CRACK_MID,
  CRACK_SPLIT,
  EXPLOIT_PTS,
  HUB_C,
  NODES6,
  OUR_AGENT_2,
  PAIRS4,
  PAIRS6,
  RINGED_IN,
  RING_BEAD_FADE,
  RING_BEAD_R,
  ROUTES6,
  ROUTE_OP,
  hubArc,
} from "./ReachTheOutsideInternet";
// Cut 5 — THE STATE THIS PIECE CUTS TO, at cut 5's OWN f96: the rail running at
// every 3 frames, the gateway at every 4, the six ringed agents, the cracked hub,
// the exploit route lit end to end and the internet ring at full ink. Nothing
// here is re-derived and nothing in that file was edited: every declaration this
// piece needs was already exported.
import {
  CARRY_EVERY,
  CARRY_T0,
  CRACK_HALF,
  ESCAPE6,
  ESC_ORDER,
  EXPLOIT_PATH,
  GATE_EVERY,
  GATE_F0,
  OFFSET as MG_OFFSET,
  RAIL_EVERY,
  RAIL_F0,
  TH_CLOCK as MG_TH_CLOCK,
} from "./MessageBoardAndGateway";

export const FPS = 24;
// Dwarkesh clip `impossible-tasks`, cut 6: "Because, as you might imagine, being
// able to talk to other agents and access the internet was going to help you
// score higher during training."
//
// SRT span 0:47.420 -> 0:54.280 at 24fps.
// round((54.280 - 47.420) * 24) = round(6.860 * 24) = round(164.64) = 165
// frames of speech, plus a 16 frame tail so the resolved state holds = 181.
export const DURATION = 181;

// ---------------------------------------------------------------------------
// "Signal on the line". Orange Dwarkesh style: opaque grid cutaway, 24fps, the
// crowd is the material, authored eased camera moves, one gesture per word.
//
// THE SHOT. This is an EDITORIAL CUT, not a continuation: it starts at 0:47.420,
// which is the exact instant cut 5 ends, and it is a different camera on the
// same world at the same moment. Cut 5 was the wide — six sandboxes, the rail
// running between them. This is the close-up of THE LINE: the rail at world y
// 760 running across the frame, our pipe coming down into it, the hub ring with
// its parcel and the crack cut 4 opened at its upper right, the lower pipe going
// on down, and the exploit route already lit at 0.95 accent leaving through that
// crack. The material of this shot is the plumbing. The crowd only appears where
// a box happens to be in frame: the underside of our box's bottom wall with cut
// 2's scars on it fills the top 65 px of the opening frame, and our box comes
// back whole when the camera pulls out.
//
// CONTINUITY. World state is cut 5's f96. Everything periodic evaluates at
// `frame + OFFSET` = `frame + 706 + 96` = `frame + 802` — `sway`, `breath`, the
// idle-thread schedule and the grid's drift all carry their phase across the cut
// — and the pump and the reach geometry evaluate on cut 2's own clock, `frame +
// 634`, because they are cut 2's gesture still running. The traffic is carried
// in the same way: cut 5's rail sequence launches every 3 frames from its own
// f46, which is this piece's f-50, and its PAIRS6 index n continues here
// unbroken; cut 5's gateway launches every 4 frames from its own f62, this
// piece's f-34, on its own ESC_ORDER index g. So the packets in flight at f0 are
// cut 5's packets, on cut 5's routes, at cut 5's positions. (Cut 5's own carried
// -in `s` escapes are all dead before f0; its last `r` exchange, launched at this
// piece's f-57, is not, so it is carried too.)
//
// ONE THING CHANGES ABOUT THE ROUTE, and it is a framing decision rather than a
// world decision: from f0 on, a NEW packet on the exploit route is emitted by
// the hub's own centre and leaves through the crack, instead of starting at a
// named agent three legs earlier. Same route, same speed, same trail — it is the
// tail of the same journey, minus the legs that are neither on screen nor on the
// subject. It is what makes the route empty for the one signal at f78 (an
// agent-origin packet is on the wire for 37-57 frames and could not clear), and
// it is what fills the ring's rim inside this cut's 181 frames.
//
// Every gesture is one word. Nothing else happens.
//   THE WIRE. Cut 5's traffic, seen from a hand's
//     breadth away: packets both ways along the rail
//     and through the hub every 3 frames, each pass
//     clicking the ring and its parcel, plus one out
//     through the crack every 4 which climbs and
//     leaves frame at the right. Nothing new happens;
//     the close-up itself is the reveal. All rail
//     traffic is the subject at 0.95, because the rail
//     IS the subject; the route's packets are ambient
//     at 0.4                        — "because, as you might imagine"  f0-40
//   MOVE 1, keys f42-54, warp 0.72: cx 400 -> 540, k
//     and the content centre untouched, so the hub
//     slides to the middle of the frame. On screen
//     f43-63, and dead still 3 frames before "other
//     agents"                       — "to talk to"                     f43-63
//   A BURST THROUGH THE RING. Eleven more packets
//     cross the hub, one every 1.5 frames from f51 to
//     f66, alternating direction, so the traffic
//     through the ring doubles while the camera
//     centres it and runs both ways. Each pass clicks
//     the ring and the parcel. They are scheduled by
//     their CROSSING and their launches solved back
//     from it (see the note on the burst below), and
//     the rate is back to every 3 at f67
//                                 — "other agents"                     f51-76
//   MOVE 2, keys f74-86, warp 0.72: k 2.20 -> 0.90,
//     content centre 760 -> 180, cx 540 -> 640, so the
//     whole route from the crack to the internet ring
//     is one picture. On screen f74-98, and still
//     before "internet"           — "and access the"                   f74-98
//   ONE SIGNAL CLIMBS OUT. A single packet leaves the
//     hub through the crack at f78 — subject at 0.95,
//     its head 1.5x — and climbs the route at one
//     speed solved to land on the internet ring's edge
//     at f99, on the word. It is alone on the route:
//     the gateway's own launches stop at f46, which is
//     the last one that clears the ring before f76,
//     and the rail drops to ambient 0.4 across f66-76
//     because the rail is not the subject any more.
//     On arrival its bead lands on the rim and stays
//                                 — "internet"                         f78-99
//   THE LINE PAYS OFF. From f106 the route fills: a
//     packet out of the crack every 4 frames, ramping
//     to every 2 by f133, all climbing into the ring.
//     Every arrival lands its own bead on the rim, and
//     the beads PERSIST — down to 0.6 over 24 frames
//     and then held, the newest 40 — so the rim fills
//     with arrivals. Rail traffic keeps running at
//     ambient 0.4 underneath: they are still talking
//     to each other, that is half the sentence
//                    — "was going to help you score higher"            f106-140
//   MOVE 3, keys f110-122 (pass 2; was f128-140), warp 0.72: k 0.90 -> 1.50,
//     content centre 180 -> -480 (the midpoint of the
//     ring at -400 and the mark at -560), cx 640 ->
//     540, so the trainer is over the thing being
//     reached. On screen f129-152, and at "training"
//     the ring is drifting 1.7 screen px a frame
//                                 — "higher during"                    f129-152
//   THE TRAINER. The OpenAI mark clicks ink-bright for
//     4 frames — the same OP_READ -> 1.0 step every
//     other icon in this world clicks with. Nothing
//     else                        — "training"                         f151-155
//   held: packets streaming into the ring under the
//     mark, the rim full. Never fades out — tail                      f165-181
//
// ambient: idle thread traffic in every visible box at the shared rate (180 per
// 1,200 agents), `breath` on every dot, the seventeen reaches and every
// neighbour's reaches still pumping, `sway` on the camera. Not gestures; that is
// what this field is.
//
// THE THREE FRAMINGS, and the maths behind them. For a content centre c and a
// lateral track cx, `cy = c + CAM_LIFT / k` puts c at screen y 960 - 125 = 835:
//   screen(y) = (y - c) * k + 835      screen(x) = (x - cx) * k + 540
//
//   OPEN, k 2.20 / c 760 / cx 400 — the close-up of the line.
//     the rail (760)              -> 835, straight across the frame
//     the hub (540, 760) r 40     -> (848, 835), 88 px across
//     our pipe (x 540, 410..720)  -> x 848, from y 65 down to 747
//     the lower pipe (800..1110)  -> x 848, from 923 down to 1605
//     our box's bottom wall (410) -> 65: the underside of the sandbox, with cut
//                                    2's scars on it, along the top of the frame
//     the crack (565.7, 729.4)    -> (905, 768), and the route out of it leaves
//                                    the right edge on its way up
//     in frame: world x 154.5-645.5, world y 380.5-1253. The gap between the
//     wall and the rail is where the shot lives.
//
//   MOVE 2 AT REST, k 0.90 / c 180 / cx 640 — the whole route.
//     the hub (540, 760)          -> (450, 1357)
//     the internet ring (540,-400)-> (450, 313)
//     the climb at x 1040         -> x 900
//     our box (y -290..410)       -> 412..1042, whole and centred
//
//   MOVE 3 AT REST, k 1.50 / c -480 / cx 540 — the trainer over the internet.
//     the internet ring (540,-400)-> (540, 955), r 60
//     the OpenAI mark (540,-560)  -> (540, 715), 162 px
//     the route's climb at x 1040 -> x 1290, off the right edge, so the last leg
//                                    enters the frame from the edge at y 955
//
// Between the moves the track holds on identical keys, so a hold is a true hold
// and not a slow crawl. `sway` runs throughout; the grid takes cx/cxRest as well
// as cy/cyRest, so the lateral moves read as depth.
//
// PACKET SIZE IN CLOSE-UP. Every other cut plays at k 0.4-0.95, where a packet
// head of HEAD_R / k screen px is right. At k 2.20 that is 1.8 world px — a
// speck on a pipe drawn at stroke 3. So the head is max(HEAD_R / k, 4) WORLD px:
// 4 world px at the close-up, which is 8.8 screen px, and it falls back to the
// old screen-px rule the moment the camera is wider than k 1.0. The trail is
// likewise a fixed 120 WORLD px rather than a fixed number of frames — 264
// screen px at k 2.20 — so a packet reads as a signal running down a wire.
// It is still a motion trail: the rear is the head's own position
// TRAIL_LEN / v frames ago, so it runs in behind an arrival and the packet dies.
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
    because: z.number(), // "because, as"      — the wire, cut 5's traffic
    youMight: z.number(), // "you might"
    imagine: z.number(), // "imagine"
    beingAble: z.number(), // "being able"     — move 1 is running
    toTalkTo: z.number(), // "to talk to"      — the burst starts
    otherAgents: z.number(), // "other agents" — the burst is through the hub
    andAccessThe: z.number(), // "and access the" — move 2, the route empties
    internet: z.number(), // "internet"        — the one signal lands on the ring
    wasGoing: z.number(), // "was going"
    toHelp: z.number(), // "to help"           — the route fills
    youScore: z.number(), // "you score"
    higherDuring: z.number(), // "higher during" — move 3
    training: z.number(), // "training"        — the mark clicks
    end: z.number(), // speech ends; tail to 181
  }),
});

export type Props = z.infer<typeof schema>;

// The join. Cut 1 ran 184 from its own f0 with cut 2's clock starting at f168;
// cut 2 ran 231; cut 3 ran 136; cut 4 ran 171; cut 5 ran 112 and this cut starts
// at cut 5's f96, the frame its speech ends on.
export const CUT5_AT = 96;
export const OFFSET = MG_OFFSET + CUT5_AT; // 706 + 96 = 802
// Cut 2's own clock, for the gestures of cut 2 that are still running.
export const TH_CLOCK = MG_TH_CLOCK + CUT5_AT; // 538 + 96 = 634

// ---------------------------------------------------------------------------
// The camera. THREE authored moves, one per phrase, each settled before its
// word, with true holds between them. The lateral track rides the same key
// frames so one damper pass serves it — cut 4's RO_CAM_CX pattern.
// ---------------------------------------------------------------------------
export const K_TIGHT = 2.2;
export const CONTENT_RAIL = RAIL_Y; // 760: the line itself is the content centre
export const CX_OPEN = 400; // the hub sits right of frame centre at the open
export const CX_HUB = CENTRE_X; // 540

export const K_ROUTE = 0.9;
export const CONTENT_ROUTE = 180; // cut 4's (HUB.y + RING.y) / 2
export const CX_ROUTE = 640;

export const K_NET = 1.5;
export const CONTENT_NET = (RING.y + MARK.y) / 2; // -480
export const CX_NET = CENTRE_X; // 540

export const M1_F0 = 42; // local; "to talk to ... other agents"
export const M1_F1 = 54;
export const M2_F0 = 74; // "and access the ... internet"
export const M2_F1 = 86;
export const M3_F0 = 110; // director pass 2: keyed ~1.5 beats earlier (was 128) — on screen from f111, under "to help", settled before "higher during"
export const M3_F1 = 122;
export const CAM_WARP = 0.72;

const M1 = camMove({
  f0: OFFSET + M1_F0,
  f1: OFFSET + M1_F1,
  k0: K_TIGHT,
  k1: K_TIGHT,
  c0: CONTENT_RAIL,
  c1: CONTENT_RAIL,
  warp: CAM_WARP,
});
const M2 = camMove({
  f0: OFFSET + M2_F0,
  f1: OFFSET + M2_F1,
  k0: K_TIGHT,
  k1: K_ROUTE,
  c0: CONTENT_RAIL,
  c1: CONTENT_ROUTE,
  warp: CAM_WARP,
});
const M3 = camMove({
  f0: OFFSET + M3_F0,
  f1: OFFSET + M3_F1,
  k0: K_ROUTE,
  k1: K_NET,
  c0: CONTENT_ROUTE,
  c1: CONTENT_NET,
  warp: CAM_WARP,
});

export const SL_CAM_F = [OFFSET, ...M1.F, ...M2.F, ...M3.F, OFFSET + DURATION];
export const SL_CAM_K = [K_TIGHT, ...M1.K, ...M2.K, ...M3.K, K_NET];
export const SL_CAM_CY = [
  CONTENT_RAIL + CAM_LIFT / K_TIGHT,
  ...M1.CY,
  ...M2.CY,
  ...M3.CY,
  CONTENT_NET + CAM_LIFT / K_NET,
];
// The lateral track: the same eased curve `camMove` writes for k, evaluated at
// the same key frames, so the pan and the zoom are one hand.
const lat = (m: { F: number[] }, x0: number, x1: number) =>
  m.F.map((_, i) => x0 + (x1 - x0) * camEase(i / (m.F.length - 1), CAM_WARP));
export const SL_CAM_CX = [
  CX_OPEN,
  ...lat(M1, CX_OPEN, CX_HUB),
  ...lat(M2, CX_HUB, CX_ROUTE),
  ...lat(M3, CX_ROUTE, CX_NET),
  CX_NET,
];

// ---------------------------------------------------------------------------
// THE PACKETS. Cut 3's mechanism, with the two close-up corrections above: the
// head is at least 4 world px and the trail is a fixed 120 world px, expressed
// as a per-packet lag so the rear is still the head's own past position.
// ---------------------------------------------------------------------------
export const TRAIL_LEN = 120; // world px
export const HEAD_MIN_W = 4; // world px, the close-up floor under HEAD_R / k
export const HERO_HEAD = 1.5; // the one signal's head, x the ordinary one
export const OP_SUBJECT = ROUTE_OP; // 0.95
export const OP_AMBIENT = 0.4;
// The rail hands the subject over to the route: it is the subject at 0.95 while
// the shot is on it, and ambient from f76 when the one signal owns the frame.
export const RAIL_DIM_F0 = 66; // "other agents" ends
export const RAIL_DIM_F1 = 76; // move 2 starts

export type Flow = "rail" | "route";
export type Pk = {
  key: string;
  route: Route;
  t0: number;
  arrive: number;
  lag: number; // frames of trail, = TRAIL_LEN / v
  to: number; // node index for a rail packet; -1 for a route packet
  flow: Flow;
  op: number; // 0 = take the rail's per-frame opacity
  hero: boolean;
  bead: number; // rim slot for a persisting bead; -1 = cut 5's transient bead
};

const mk = (
  key: string,
  route: Route,
  t0: number,
  v: number,
  to: number,
  flow: Flow,
  op: number,
  hero = false,
  bead = -1,
): Pk => ({
  key,
  route,
  t0,
  arrive: t0 + route.total / v,
  lag: TRAIL_LEN / v,
  to,
  flow,
  op,
  hero,
  bead,
});

// -- the rail ---------------------------------------------------------------
// Cut 5's every-3 exchange among the six ringed agents, continuing its PAIRS6
// index. Its f46 is this piece's f-50.
export const RAIL_T0 = RAIL_F0 - CUT5_AT; // -50
//
// THE BURST IS SCHEDULED BY ITS PASSES THROUGH THE RING, not by its launches,
// and that is a consequence of the close-up rather than a liberty. At k 2.20
// the visible rail is world x 154-646: 490 px of a 5,600 px line, which a packet
// crosses in 4.8 frames. A packet's LAUNCH is 10 frames upstream of the hub when
// it starts in our own column and 29 when it starts in a neighbour's, and 1,400
// px of that is off screen — so doubling the launch rate at f51 puts nothing
// extra through the ring until about f80, twenty frames after the word. Measured
// on a first render of exactly that: across f51-67 the visible rail carried
// 1.4 packets on average against 1.1 before the burst, and it fell to zero at
// f59, f60 and f61.
//
// So each burst packet's t0 is SOLVED BACKWARDS from the frame its head is to
// cross (540, 760) — `hubS` is that crossing's own arclength on its own route —
// and the crossings are laid out one every 1.5 frames from f51 to f66,
// alternating direction. Every launch still lands inside this cut (f22-f42), at
// cut 3's one traffic speed, on cut 3's routes; only the bookkeeping is
// backwards. The ones that start in our own column come DOWN our pipe and UP the
// lower one into the ring, which is the shot.
export const BURST_CROSS_F0 = 51; // "to talk to"
export const BURST_CROSS_EVERY = 1.5;
export const BURST_N = 11; // f51 .. f66; every 3 again from f67
// which directed pairs cross the hub, and which way they are going as they do.
// A pair whose two rail points are the same x (the left column's two agents)
// never reaches the hub at all and is not in either list.
const railDx = (p: [number, number]) => NODES6[p[1]].rail.x - NODES6[p[0]].rail.x;
export const RAIL_RIGHT = PAIRS6.filter((p) => railDx(p) > 0);
export const RAIL_LEFT = PAIRS6.filter((p) => railDx(p) < 0);
// the arclength at which a route from `a` passes the hub: down (or up) to its
// own pipe mouth, along the pipe to the rail, then along the rail to x 540.
export const hubS = (a: number) =>
  Math.hypot(NODES6[a].x - NODES6[a].mouth.x, NODES6[a].y - NODES6[a].mouth.y) +
  Math.hypot(NODES6[a].mouth.x - NODES6[a].rail.x, NODES6[a].mouth.y - NODES6[a].rail.y) +
  Math.abs(NODES6[a].rail.x - HUB.x);

// -- the route --------------------------------------------------------------
// From f0 a new packet on the exploit route is emitted by the hub and leaves
// through the crack: the same route, starting at the hub's own centre.
export const HERO_ROUTE = makeRoute([HUB_C, ...EXPLOIT_PTS]);
export const GATE_T0 = GATE_F0 - CUT5_AT; // -34: cut 5's gateway phase, locally
// The last gateway launch that has cleared the internet ring — head and trail —
// before move 2 starts, so the route is empty for the one signal.
export const ROUTE_CLEAR = 76; // the last one clears the ring at f75.6
export const HERO_F0 = 78;
export const HERO_F1 = 99; // "internet"
export const HERO_V = HERO_ROUTE.total / (HERO_F1 - HERO_F0);
// The payoff: every 4 frames from f106, ramping to every 2 by f133, held to the
// end. The gap is read off the launch's own frame, so the ramp is the schedule.
export const PAYOFF_F0 = 106;
export const PAYOFF_F1 = 133;
export const PAYOFF_EVERY0 = 4;
export const PAYOFF_EVERY1 = 2;

// -- what an arrival leaves on the ring --------------------------------------
// Cut 4's bead, with the one thing this cut needs it to do: from the one signal
// onward it PERSISTS. It falls to BEAD_FLOOR over BEAD_FADE frames and stays
// there, and each one takes its own slot on the rim — the golden angle from the
// route's own landing point at the ring's right edge — so successive arrivals
// spread rather than stack and the rim fills. The newest BEAD_CAP survive.
// A carried-in gateway arrival from cut 5 keeps cut 5's transient bead, because
// before the line pays off an arrival is traffic, not a mark.
export const BEAD_FADE = 24;
export const BEAD_FLOOR = 0.6;
export const BEAD_CAP = 40;
export const BEAD_GOLDEN = 137.5077640500378; // degrees
export const beadPt = (slot: number): P => {
  // 90 degrees clockwise from straight up IS the ring's right edge (580, -400),
  // where the exploit route lands, so slot 0 is exactly cut 4's bead.
  const a = ((90 + BEAD_GOLDEN * slot) * Math.PI) / 180;
  return { x: RING.x + RING.r * Math.sin(a), y: RING.y - RING.r * Math.cos(a) };
};

export const PACKETS: Pk[] = (() => {
  const out: Pk[] = [];

  // Cut 5's own carried-in exchange, on ITS clock, for the last few launches
  // that are still on the wire at this cut's f0. (Its carried-in escapes are all
  // dead by then, so there is nothing to carry there.)
  for (let m = 0; ; m++) {
    const t0 = CARRY_T0 + m * CARRY_EVERY; // cut 5's clock
    if (t0 >= RAIL_F0) break;
    const local = t0 - CUT5_AT;
    if (local < -60) continue; // arrived and run in long before f0
    const [a, b] = PAIRS4[m % PAIRS4.length];
    out.push(mk(`c${m}`, ROUTES6[a][b], local, V_TRAFFIC, b, "rail", 0));
  }

  // the rail: cut 5's every-3 stream, its index unbroken
  for (let n = 0; ; n++) {
    const t0 = RAIL_T0 + n * RAIL_EVERY;
    if (t0 > DURATION) break;
    const [a, b] = PAIRS6[n % PAIRS6.length];
    out.push(mk(`x${n}`, ROUTES6[a][b], t0, V_TRAFFIC, b, "rail", 0));
  }
  // the burst: one more pass through the ring every 1.5 frames, alternating
  // direction, each solved back from the frame it is to cross the hub
  for (let j = 0; j < BURST_N; j++) {
    const cross = BURST_CROSS_F0 + j * BURST_CROSS_EVERY;
    const list = j % 2 === 0 ? RAIL_RIGHT : RAIL_LEFT;
    const [a, b] = list[Math.floor(j / 2) % list.length];
    out.push(mk(`b${j}`, ROUTES6[a][b], cross - hubS(a) / V_TRAFFIC, V_TRAFFIC, b, "rail", 0));
  }

  // the gateway, carried in: the packets cut 5 had in flight keep cut 5's own
  // agent-origin routes and its ESC_ORDER index
  let g = 0;
  for (; ; g++) {
    const t0 = GATE_T0 + g * GATE_EVERY;
    if (t0 >= 0) break;
    out.push(mk(`g${g}`, ESCAPE6[ESC_ORDER[g % ESC_ORDER.length]], t0, V_TRAFFIC, -1, "route", OP_AMBIENT));
  }
  // and from f0 it is emitted by the hub, on the same cadence and the same
  // index, up to the last launch that clears the ring before move 2
  for (; ; g++) {
    const t0 = GATE_T0 + g * GATE_EVERY;
    if (t0 + (HERO_ROUTE.total + TRAIL_LEN) / V_TRAFFIC > ROUTE_CLEAR) break;
    out.push(mk(`g${g}`, HERO_ROUTE, t0, V_TRAFFIC, -1, "route", OP_AMBIENT));
  }

  // the one signal
  let slot = 0;
  out.push(mk("hero", HERO_ROUTE, HERO_F0, HERO_V, -1, "route", OP_SUBJECT, true, slot++));

  // the payoff
  for (let t0 = PAYOFF_F0; t0 <= DURATION; slot++) {
    out.push(mk(`p${slot}`, HERO_ROUTE, t0, V_TRAFFIC, -1, "route", OP_SUBJECT, false, slot));
    t0 += interpolate(t0, [PAYOFF_F0, PAYOFF_F1], [PAYOFF_EVERY0, PAYOFF_EVERY1], clamp);
  }
  return out;
})();

const headAt = (p: Pk, f: number) =>
  interpolate(f, [p.t0, p.arrive], [0, p.route.total], clamp);

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
    because: 0,
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

export const MARK_CLICK = 4; // frames the OpenAI mark stays ink-bright

const SignalOnTheLine: React.FC<Props> = ({
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
  const cam = runCamera(F, SL_CAM_F, SL_CAM_CY, SL_CAM_K);
  const camX = runCamera(F, SL_CAM_F, SL_CAM_CX, SL_CAM_K);
  const drift = sway(F);
  const cy = cam.cy + drift.dy;
  const cx = camX.cy + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);
  // The close-up floor: a head is never smaller than HEAD_MIN_W world px.
  const headW = Math.max(HEAD_R / k, HEAD_MIN_W);

  // -- the packets -----------------------------------------------------------
  // Every brightening is taken FROM THE HEAD, never from a parallel timer.
  const railOp = interpolate(frame, [RAIL_DIM_F0, RAIL_DIM_F1], [OP_SUBJECT, OP_AMBIENT], clamp);
  let hubClick = 0;
  const agentClick = new Float32Array(NODES6.length);
  const beads: { key: string; x: number; y: number; op: number }[] = [];
  type Draw = {
    key: string;
    segs: { x1: number; y1: number; x2: number; y2: number; op: number }[];
    head: P | null;
    headR: number;
    headOp: number;
  };
  const draws: Draw[] = [];

  for (const p of PACKETS) {
    // an arrival's mark on the ring outlives the packet, so it is read first
    if (p.bead >= 0 && frame >= p.arrive) {
      const age = frame - p.arrive;
      const pt = beadPt(p.bead);
      beads.push({
        key: p.key,
        x: pt.x,
        y: pt.y,
        op: 1 - (1 - BEAD_FLOOR) * clamp01(age / BEAD_FADE),
      });
    }
    if (frame < p.t0) continue;
    const sHead = headAt(p, frame);
    // the trail's rear: the head's own position `lag` frames ago, so it is
    // TRAIL_LEN world px behind while the packet travels and runs all the way in
    // once the head has arrived
    const sRear = headAt(p, frame - p.lag);
    if (sRear >= p.route.total - 0.5) continue;
    const op = p.flow === "rail" ? railOp : p.op;
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
        op: op * (0.2 + 0.8 * ((i + 1) / TAIL_SAMPLES)),
      });
    }
    draws.push({
      key: p.key,
      segs,
      head: sHead < p.route.total ? pointAt(p.route, sHead) : null,
      headR: headW * (p.hero ? HERO_HEAD : 1),
      headOp: op / OP_SUBJECT,
    });

    // the hub clicks for the frames a head is inside its ring — cut 3's test,
    // unchanged
    for (let dt = 0; dt < HUB_CLICK; dt++) {
      const f = frame - dt;
      if (f < p.t0) break;
      const hp = pointAt(p.route, headAt(p, f));
      if (Math.hypot(hp.x - HUB.x, hp.y - HUB.y) <= HUB.r) hubClick = 1;
    }
    if (p.flow === "rail" && frame >= p.arrive && frame < p.arrive + AGENT_CLICK) {
      agentClick[p.to] = 1;
    }
    // a carried-in gateway arrival keeps cut 5's transient bead
    if (
      p.flow === "route" &&
      p.bead < 0 &&
      frame >= p.arrive &&
      frame < p.arrive + RING_BEAD_FADE
    ) {
      const pt = beadPt(0);
      beads.push({
        key: p.key,
        x: pt.x,
        y: pt.y,
        op: 1 - (frame - p.arrive) / RING_BEAD_FADE,
      });
    }
  }
  // the newest BEAD_CAP survive
  const shownBeads = beads.slice(-BEAD_CAP);

  // -- the hub ---------------------------------------------------------------
  // Cracked and settled since cut 4. Its only brightening in this cut is the
  // four-frame click a passing packet gives it, and the burst gives it many.
  const hubOp = Math.min(1, OP_READ + (1 - OP_READ) * hubClick);

  // -- the trainer -----------------------------------------------------------
  const markOp =
    frame >= beats.training && frame < beats.training + MARK_CLICK ? 1 : OP_READ;

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
        cxRest={CENTRE_X}
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
            {/* the hub: one cracked ring holding a package. The gap cut 4 opened
                at its upper right is where it was left; the parcel is whole. */}
            <g style={{ filter: icon }} opacity={hubOp}>
              <g fill="none" stroke={ink} strokeWidth={STROKE} strokeLinecap="round">
                <path d={hubArc(CRACK_MID + CRACK_HALF, CRACK_SPLIT)} />
                <path d={hubArc(CRACK_SPLIT, CRACK_MID - CRACK_HALF + 360)} />
              </g>
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
              <mask id="sl-gate" maskUnits="userSpaceOnUse" x={-400} y={-900} width={1900} height={1900}>
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
              <g mask="url(#sl-gate)">
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

            {/* the internet: an ink ring outside the box, closed, and reached —
                at full ink since cut 4's contact and it stays there */}
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

          {/* the OpenAI mark, tinted white, exactly where cut 1 left it. Its one
              gesture is "training": the same OP_READ -> 1.0 four-frame click
              every other icon in this world uses. */}
          <Img
            src={staticFile(markSrc)}
            style={{
              position: "absolute",
              left: MARK.x - markSize / 2,
              top: MARK.y - markSize / 2,
              width: markSize,
              height: markSize,
              opacity: markOp,
              filter: `brightness(0) invert(1) ${icon}`,
            }}
          />
        </div>
      </AbsoluteFill>

      {/* THE LINE. Above everything, because it is the subject: the exploit
          route cut 4 left lit, every packet on the wire, the beads the arrivals
          leave on the ring's rim, and the six rings — all in world coordinates,
          so a route can cross from one box to another through the manager and
          out of it. */}
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

              {/* what the arrivals leave on the internet ring's rim */}
              {shownBeads.map((b) => (
                <circle
                  key={b.key}
                  cx={b.x}
                  cy={b.y}
                  r={(HEAD_R * RING_BEAD_R) / k}
                  fill={ink}
                  opacity={b.op}
                />
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

export default SignalOnTheLine;
