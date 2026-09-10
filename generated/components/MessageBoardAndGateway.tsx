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
  TONE_STEPS,
  Vignette,
  breath,
  camEase,
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
  TAIL_LAG,
  TAIL_MIN,
  TAIL_SAMPLES,
  V_TRAFFIC,
  makeRoute,
  pointAt,
} from "./TalkThroughArtifactory";
// Cut 4 — THE STATE THIS PIECE CONTINUES FROM: the six ringed agents and the
// exchange, the cracked hub, the exploit route, the lit internet ring, the
// climbing packets, the resolved framing and its lateral track. Nothing here is
// re-derived; the only edit made to that file was adding `export` to PAIRS6 and
// PAIRS4 (no value moved: cut 4 f0 and f170 both come back PSNR inf against
// renders taken before the edit).
import {
  CONTENT_FOLLOW,
  CRACK_A0,
  CRACK_A1,
  CRACK_MID,
  CRACK_SPLIT,
  CX_FOLLOW,
  DURATION as RO_DURATION,
  EXPLOIT_PTS,
  HUB_C,
  type Kind,
  K_PUSH,
  NODES6,
  OFFSET as RO_OFFSET,
  OUR_AGENT_2,
  OUR_NODES,
  PAIRS4,
  PAIRS6,
  RINGED_IN,
  RING_BEAD_FADE,
  RING_BEAD_R,
  ROUTES6,
  ROUTE_OP,
  TH_CLOCK as RO_TH_CLOCK,
  hubArc,
} from "./ReachTheOutsideInternet";

export const FPS = 24;
// Dwarkesh clip `impossible-tasks`, cut 5: "...to use this package manager as a
// message board and an internet gateway."
//
// SRT span 0:43.439 -> 0:47.420 at 24fps.
// round((47.420 - 43.439) * 24) = round(3.981 * 24) = round(95.544) = 96
// frames of speech, plus a 16 frame tail so the resolved state holds = 112.
export const DURATION = 112;

// ---------------------------------------------------------------------------
// "A message board and an internet gateway". Orange Dwarkesh style: opaque grid
// cutaway, 24fps, the crowd is the material, one eased camera move, one gesture
// per word.
//
// CONTINUITY. Three point seven seconds of talking head sit between cut 4 and
// this, so it is not a pixel join — but it is the same world in the state cut 4
// left it and every piece of it is imported rather than rebuilt. It OPENS on
// cut 4's RESOLVED framing, k 0.70 with the content centre at 60 and the
// lateral track at cx 590, with the damper already at rest there: the hub
// cracked with its parcel, the exploit route lit at 0.95 accent all the way
// from the crack to the internet ring, the internet ring and its wifi glyph at
// full ink, the six ringed agents, the seventeen tasks and their reaches still
// on cut 2's soft pump, our scars where cut 2's strike left them, and the idle
// traffic in every crowd. Packets are still climbing the route from our two
// ringed agents every 8 frames and the other four are still exchanging through
// the hub every 8, both on cut 4's own launch index so neither sequence jumps.
// Every periodic thing evaluates at `frame + OFFSET` = `frame + 535 + 171` =
// `frame + 706`, so `sway`, `breath`, the idle-thread schedule and the grid's
// drift all carry their phase; the pump and the reach geometry evaluate on cut
// 2's own clock, `frame + 538`, because they are cut 2's gesture still running.
//
// WHAT IS DIFFERENT, and it is the whole sentence: THE THING THEY BUILT IS NOW
// BEING USED BY EVERYONE, FOR BOTH THINGS. The rail fills with traffic in both
// directions (the message board) and the gateway starts serving every ringed
// agent, not just the two who found it (the internet gateway). No new geometry
// is drawn anywhere: the two flows are cut 4's own packet mechanism at a
// different rate over a wider set of senders.
//
// Every gesture is one word. Nothing else happens.
//   the world exactly as cut 4 left it, on cut 4's
//     resolved framing. No gesture                   — "to use this"     f0
//   THE HUB RING AND ITS PARCEL CLICK ink-bright for
//     4 frames, the same click a passing packet gives
//     it. Nothing else moves                         — "package"         f23-27
//   THE ONE CAMERA MOVE, keys f20-44, warp 0.72:
//     k 0.70 / centre 60 / cx 590 -> k 0.45 / centre
//     180 / cx 540, the lateral track easing back to
//     centre on the same keys as cut 4's follow did.
//     It pulls back until the left and right
//     neighbours each show 112 px inside the frame
//     edge, so the rail is a thing that runs between
//     sandboxes rather than a line under ours. At
//     rest: the mark's top at screen 478, the
//     internet ring centred on 574, our box 624-939,
//     the hub at 1096 and row 1's top walls at 1253,
//     under the burned-in captions. Settled before
//     "a message board"                              — "manager as"      f20-44
//   THE RAIL FILLS. From f46 the exchange among the
//     six ringed agents — every directed pair except
//     the two that share our box's pipe, in a hashed
//     order, along the manager and never box to box —
//     launches every 3 frames instead of every 8, at
//     cut 3's traffic speed, so packets run both ways
//     along the rail and through the hub continuously
//     instead of one at a time. Their hub pass keeps
//     the usual 4-frame click. This rate holds to the
//     end                                            — "a message board" f46
//   THE GATEWAY SERVES EVERYONE. From f62 a packet
//     launches every 4 frames up the exploit route to
//     the internet ring and the launching agent
//     cycles through ALL SIX ringed agents in a
//     hashed order, not just the two in our box: from
//     a neighbour it is agent -> its pipe -> along
//     the rail -> into the hub -> out through the
//     crack -> the route -> the ring. Each arrival
//     lands cut 4's white bead on the ring's edge.
//     This rate holds to the end                     — "and an internet
//                                                        gateway"        f62
//   both flows running through the one ring, the
//     board and the gateway at once. Never fades out  — tail             f96-112
//
// ambient: idle thread traffic in every visible box at the shared rate (180 per
// 1,200 agents), `breath` on every dot, the seventeen reaches and every
// neighbour's reaches still pumping, `sway` on the camera. Not gestures; that
// is what this field is.
//
// THE GATEWAY ROUTE, for a node that is not in our box: agent -> its own pipe
// mouth -> its rail point -> the hub's centre (540, 760) -> the crack's mouth
// (565.71, 729.36) -> (1040, 640) -> (1040, -400) -> the internet ring's right
// edge (580, -400). For a node in our box the rail point IS the hub's centre,
// so that leg is zero length and `makeRoute` drops it: the route reduces to
// exactly the one cut 4 built. One construction, six routes, no special case.
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
    toUseThis: z.number(), // "to use this"  — the world as cut 4 left it
    packageWord: z.number(), // "package"    — the hub ring and its parcel click
    managerAs: z.number(), // "manager as"   — the one camera move
    messageBoard: z.number(), // "a message board" — the rail fills, from f46
    andAnInternet: z.number(), // "and an internet" — the gateway serves all six, from f62
    gateway: z.number(), // "gateway"
    end: z.number(), // speech ends; tail to 112
  }),
});

export type Props = z.infer<typeof schema>;

// The join. Cut 1 ran 184 from its own f0 with cut 2's clock starting at f168;
// cut 2 ran 231; cut 3 ran 136; cut 4 ran 171. So cut 4's last frame is this
// piece's f0.
export const OFFSET = RO_OFFSET + RO_DURATION; // 535 + 171 = 706
// Cut 2's own clock, for the gestures of cut 2 that are still running.
export const TH_CLOCK = RO_TH_CLOCK + RO_DURATION; // 367 + 171 = 538

// ---------------------------------------------------------------------------
// The camera. ONE move, and it is "manager as": back out from cut 4's resolved
// k 0.70 / content centre 60 / cx 590 to k 0.45 / centre 180 / cx 540, with the
// lateral track easing back to the world's centre line on the same keys — the
// mirror of cut 4's follow, which took it out to 590 as the exploit route
// climbed.
//
//   screen(y) = (y - c) * k + 835 for a content centre c, because
//   cy = c + CAM_LIFT / k puts c at 960 - 125 = 835.
//   screen(x) = (x - cx) * k + 540.
//
// At rest (k 0.45 / 180 / 540): the mark's top at screen 478, the internet ring
// centred on 574, our box 624-939, the hub at 1096, row 1's top walls at 1253 —
// under the burned-in captions, which is where the bottom of this world
// belongs. Sideways, the left neighbour's right wall lands at screen x 112.5
// and the right neighbour's left wall at 967.5, i.e. each shows 112 px inside
// its frame edge, so the rail leaves our column and visibly runs into other
// sandboxes instead of off a bare edge.
//
// Keys f20-44 rather than f20-48: `runCamera` damps the target, so a track
// keyed to end on the word is still running past it. Ending at f44 leaves the
// move within 0.5% of its zoom by f48 and dead still under "a message board".
// ---------------------------------------------------------------------------
export const K_OPEN = K_PUSH; // 0.70 — cut 4's resolved zoom
export const CONTENT_OPEN = CONTENT_FOLLOW; // 60 — cut 4's resolved content centre
export const CX_OPEN = CX_FOLLOW; // 590 — cut 4's resolved lateral track
export const K_REST = 0.45;
export const CONTENT_REST = 180;
export const CX_REST = CENTRE_X; // 540
export const CAM_MOVE_F0 = 20; // local
export const CAM_MOVE_F1 = 44;
const MOVE = camMove({
  f0: OFFSET + CAM_MOVE_F0,
  f1: OFFSET + CAM_MOVE_F1,
  k0: K_OPEN,
  k1: K_REST,
  c0: CONTENT_OPEN,
  c1: CONTENT_REST,
  warp: 0.72,
});
export const MG_CAM_F = [OFFSET, ...MOVE.F, OFFSET + DURATION];
export const MG_CAM_K = [K_OPEN, ...MOVE.K, K_REST];
export const MG_CAM_CY = [CONTENT_OPEN + 125 / K_OPEN, ...MOVE.CY, CONTENT_REST + 125 / K_REST];
// The lateral track rides the same key frames so one damper pass serves it:
// `runCamera` damps whatever it is handed as CY, and k is ignored on that call.
export const MG_CAM_CX = [
  CX_OPEN,
  ...MOVE.F.map((_, i) => CX_OPEN + (CX_REST - CX_OPEN) * camEase(i / (MOVE.F.length - 1), 0.72)),
  CX_REST,
];

// ---------------------------------------------------------------------------
// THE GATEWAY ROUTE, for all six. Cut 4 built it for the two agents in our box;
// the same three points every route in this world is made of carry it out to
// the other four without a special case, because a neighbour's rail point is
// simply not the hub's and the leg between them is the rail itself.
// ---------------------------------------------------------------------------
export const ESCAPE6: Route[] = NODES6.map((n) =>
  makeRoute([{ x: n.x, y: n.y }, n.mouth, n.rail, HUB_C, ...EXPLOIT_PTS]),
);
// the hashed order the gateway cycles the six senders in
export const ESC_ORDER: number[] = NODES6.map((_, i) => i).sort((a, b) => hash(a, 61) - hash(b, 61));

// ---------------------------------------------------------------------------
// The packets. Cut 4's mechanism unchanged — an accent line with a small white
// head whose tail is a motion trail, the head's own position TAIL_LAG frames
// ago, the rear released once the head has arrived so nothing leaves a stub.
// Only the SCHEDULE is this piece's, and it is in three parts:
//
//   CARRIED IN. Cut 4's post-contact cadence, every 8 frames from its own f122,
//     on its own launch index m so the escape alternates our two agents and the
//     exchange walks PAIRS4 exactly where cut 4 left off. On this clock that is
//     t0 = -49 + 8m, so the packets in flight at f0 are the ones cut 4 ended
//     with. Each half stops when its own new rate takes over.
//   THE RAIL FILLS, from f46: the exchange every 3 frames over PAIRS6 — all
//     twenty-eight directed pairs among the six except the two that share our
//     box's pipe, hashed.
//   THE GATEWAY SERVES EVERYONE, from f62: an escape every 4 frames, the sender
//     cycling ESC_ORDER.
//
// Both rates hold to the end; nothing tails off.
// ---------------------------------------------------------------------------
export const CARRY_T0 = -49; // cut 4's f122 on this clock
export const CARRY_EVERY = 8; // cut 4's AFTER_EVERY
export const RAIL_F0 = 46;
export const RAIL_EVERY = 3;
export const GATE_F0 = 62;
export const GATE_EVERY = 4;

export type Packet = {
  key: string;
  route: Route;
  F: number[];
  S: number[];
  t0: number;
  arrive: number;
  to: number; // node index for an exchange packet; -1 for an escape
  kind: Kind;
};

const straight = (key: string, route: Route, t0: number, to: number, kind: Kind): Packet => {
  const arrive = t0 + route.total / V_TRAFFIC;
  return { key, route, F: [t0, arrive], S: [0, route.total], t0, arrive, to, kind };
};

export const PACKETS: Packet[] = (() => {
  const out: Packet[] = [];
  for (let m = 0; ; m++) {
    const t0 = CARRY_T0 + m * CARRY_EVERY;
    if (t0 >= GATE_F0 && t0 >= RAIL_F0) break;
    if (t0 < GATE_F0) {
      out.push(straight(`s${m}`, ESCAPE6[OUR_NODES[m % OUR_NODES.length]], t0, -1, "escape"));
    }
    if (t0 < RAIL_F0) {
      const [a, b] = PAIRS4[m % PAIRS4.length];
      out.push(straight(`r${m}`, ROUTES6[a][b], t0, b, "exchange"));
    }
  }
  let n = 0;
  for (let t0 = RAIL_F0; t0 <= DURATION; t0 += RAIL_EVERY, n++) {
    const [a, b] = PAIRS6[n % PAIRS6.length];
    out.push(straight(`x${n}`, ROUTES6[a][b], t0, b, "exchange"));
  }
  let g = 0;
  for (let t0 = GATE_F0; t0 <= DURATION; t0 += GATE_EVERY, g++) {
    out.push(straight(`g${g}`, ESCAPE6[ESC_ORDER[g % ESC_ORDER.length]], t0, -1, "escape"));
  }
  return out;
})();

const headAt = (p: Packet, f: number) => interpolate(f, p.F, p.S, clamp);

// The exploit route is finished and lit from f0, so it is one static polyline —
// the same points, the same round joins, the same 0.95 accent cut 4 left it at.
export const EXPLOIT_PATH = EXPLOIT_PTS.map(
  (p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`,
).join(" ");

// The crack is fully open from f0 and never moves again.
export const CRACK_HALF = (CRACK_A1 - CRACK_A0) / 2; // 20
export const PKG_CLICK = 4; // frames the hub ring and its parcel stay ink-bright

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
    toUseThis: 0,
    packageWord: 23,
    managerAs: 28,
    messageBoard: 48,
    andAnInternet: 64,
    gateway: 82,
    end: 96,
  },
});

const MessageBoardAndGateway: React.FC<Props> = ({
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
  const cam = runCamera(F, MG_CAM_F, MG_CAM_CY, MG_CAM_K);
  const camX = runCamera(F, MG_CAM_F, MG_CAM_CX, MG_CAM_K);
  const drift = sway(F);
  const cy = cam.cy + drift.dy;
  const cx = camX.cy + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);

  // -- the packets -----------------------------------------------------------
  // Every brightening is taken FROM THE HEAD, never from a parallel timer.
  let hubClick = 0;
  const agentClick = new Float32Array(NODES6.length);
  const ringBeads: { key: string; op: number }[] = [];
  type Draw = {
    key: string;
    segs: { x1: number; y1: number; x2: number; y2: number; op: number }[];
    head: P | null;
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
        op: ROUTE_OP * (0.2 + 0.8 * ((i + 1) / TAIL_SAMPLES)),
      });
    }
    draws.push({
      key: p.key,
      segs,
      head: sHead < p.route.total ? pointAt(p.route, sHead) : null,
    });

    // the hub clicks for the frames a head is inside its ring — cut 3's test,
    // unchanged
    for (let dt = 0; dt < HUB_CLICK; dt++) {
      const f = frame - dt;
      if (f < p.t0) break;
      const hp = pointAt(p.route, headAt(p, f));
      if (Math.hypot(hp.x - HUB.x, hp.y - HUB.y) <= HUB.r) hubClick = 1;
    }
    if (p.kind === "exchange" && frame >= p.arrive && frame < p.arrive + AGENT_CLICK) {
      agentClick[p.to] = 1;
    }
    // an escaping packet lands its own white bead on the internet ring
    if (p.kind === "escape" && frame >= p.arrive && frame < p.arrive + RING_BEAD_FADE) {
      ringBeads.push({ key: p.key, op: 1 - (frame - p.arrive) / RING_BEAD_FADE });
    }
  }

  // -- the hub ---------------------------------------------------------------
  // Cracked and settled since cut 4. Its one gesture is "package": the same
  // four-frame ink click a passing packet gives it, on the ring and the parcel
  // together.
  const pkgClick =
    frame >= beats.packageWord && frame < beats.packageWord + PKG_CLICK ? 1 : 0;
  const hubOp = Math.min(1, OP_READ + (1 - OP_READ) * Math.max(hubClick, pkgClick));

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

      {/* OUR SANDBOX. Cut 4's layer, its tree in cut 4's order. */}
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
              <mask id="mg-gate" maskUnits="userSpaceOnUse" x={-400} y={-900} width={1900} height={1900}>
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
              <g mask="url(#mg-gate)">
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

      {/* THE BOARD AND THE GATEWAY. Above everything, because it is the subject:
          the six rings, the exploit route cut 4 left lit, and every packet in
          flight — all in world coordinates, so a route can cross from one box
          to another through the manager and out of it. */}
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
                    <circle cx={d.head.x} cy={d.head.y} r={HEAD_R / k} fill={ink} />
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

export default MessageBoardAndGateway;
