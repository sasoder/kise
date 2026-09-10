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
// Cut 1. The world's geometry: the box, the seat grid, the tiles, the reaches,
// the ring and its wifi glyph, the gate, the camera constants.
import {
  BOX_CY,
  BOX_PATH,
  BOX_X0,
  BOX_X1,
  BOX_Y0,
  BOX_Y1,
  CAM_CY,
  CENTRE_X,
  CONTENT_FINAL,
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
  K_FINAL,
} from "./ImpossibleTasks";
// Cut 2. The state this piece continues from: the farm, the batched
// neighbours, the seventeen reaches, the pump, the persisted wall beads, the
// resolved camera. Nothing here is re-derived; the only edit made to that file
// was adding `export` to the declarations below (no value moved: cut 1 f100 and
// cut 2 f230 both come back PSNR inf against renders taken before the edit).
import {
  type Bead,
  type Box,
  DURATION as TH_DURATION,
  FARM_COLS,
  NEIGHBOURS,
  OFFSET as TH_OFFSET,
  OUR,
  PITCH_X,
  PITCH_Y,
  PUMP_CAP,
  PUMP_PULL,
  REACHES,
  THREAD_OP_STEPS,
  type Th,
  WAVE2,
  dotPaths,
  hackFor,
  idleFor,
  onScreen,
  pumpAt,
  threadPaths,
} from "./TryToHackOut";

export const FPS = 24;
// Dwarkesh clip `impossible-tasks`, cut 3: "By May 12th, some agents had
// figured out how to talk to each other through this package manager."
//
// SRT span 0:24.820 -> 0:29.800 at 24fps.
// round((29.800 - 24.820) * 24) = round(4.980 * 24) = round(119.52) = 120
// frames of speech, plus a 16 frame tail so the resolved state holds = 136.
export const DURATION = 136;

// ---------------------------------------------------------------------------
// "Talk through the package manager". Orange Dwarkesh style: opaque grid
// cutaway, 24fps, the crowd is the material, one eased camera move, one gesture
// per word.
//
// CONTINUITY. Seven seconds of talking head sit between cut 2 and this, so this
// is not a pixel join — but it is the same world in the same state, and every
// piece of it is imported rather than rebuilt.
//
//   * From CUT 1: the box (900 x 700 on stroke 3), STROKE, the seat grid and
//     SEATS, the five original tiles, RING and WIFI, the gate's x-range, MARK,
//     CONTENT_FINAL, and the camera's original key track.
//   * From CUT 2: the farm (columns -2..2, rows 0..5 on a uniform 1400 pitch)
//     as NEIGHBOURS with their own crowds, idle traffic and pinned tasks; the
//     second wave WAVE2; the seventeen REACHES already converged under the
//     ring; `pumpAt` with PUMP_PULL 56 and PUMP_CAP; `idleFor`, `dotPaths`,
//     `threadPaths` and `onScreen`; the resolved camera k 0.50 at content
//     centre -102 (K_PUSH / CONTENT_FINAL) with its whole key track TH_CAM_*.
//   * OFFSET = 168 + 231 = 399. Everything periodic evaluates at `frame +
//     OFFSET` — `sway`, `breath`, the idle-thread schedule, the grid's drift,
//     and `runCamera` over cut 2's track with this piece's one move appended —
//     so the hand on the camera and the ambient traffic carry their phase.
//     The pump and the reach geometry evaluate on CUT 2's OWN clock,
//     `frame + 231`, because they are cut 2's gesture still running.
//   * WHAT IS DIFFERENT, and it is only what time did. The hack-out strike has
//     stopped: no launching threads, no new beads. OUR BOX KEEPS ITS SCARS —
//     `hackFor` is evaluated once, at cut 2's f231 with cut 2's own strike
//     frame, and the bead set it returns is frozen and drawn every frame. The
//     seventeen reaches keep the SOFT pump (cut 2's pre-hardening cycle, 56 px)
//     — `pumpAt` is handed a harden frame of Infinity. The neighbours are back
//     at OP_READ: their recede was cut 2's emphasis and it is over.
//
// THE NEW WORLD ELEMENT, present from f0 because the sentence before this cut
// established it: THE PACKAGE MANAGER. One ink rail at world y 760 — the middle
// of the 700 px gap between row 0's floor (410) and row 1's ceiling (1110) —
// running the full width of the farm (-2260..3340) so it bleeds off both frame
// edges at every camera. Every box in row 0 drops a pipe from the middle of its
// bottom wall to the rail; every box in row 1 raises one from the middle of its
// top wall. Under our box the rail runs into THE HUB: one ink ring on the rail
// at (540, 760), r 40 on stroke 3 — cut 1's internet ring exactly — holding an
// isometric package glyph. The rail stops at x 500 and resumes at x 580, our
// pipe ends at y 720 and the lower pipe starts at y 800, so the ring's interior
// is the glyph's alone. No text, no logo.
//
// Every gesture is one word. Nothing else happens.
//   cut 2's end framing, with the rail, the pipes
//     and the hub already standing and our scars on
//     our walls. No gesture for the date; the world
//     at rest is the shot                           — "by May 12th"     f0
//   THREE AGENTS RINGED, one in our box, one in the
//     box below ours, one in the left neighbour: an
//     ink ring r 14 stroke 3.5 lands on each over 8
//     frames with Easing.out(Easing.back(1.6)) and
//     the agent under it goes deep -> ripe as the
//     ring lands. Ours on "some agents" f14; the
//     box below as the first packet lands on it f78;
//     the left box as it launches f87 (pass 2: the
//     open is tight, the others are off-frame)      — "some agents"     f14, f78, f87
//   THE FIRST THREAD FINDS THE WAY OUT. From our
//     ringed agent an accent packet — a small white
//     head with a trailing tail, MessageBoardV2's
//     thread — draws straight to our box's pipe
//     mouth at (540, 410), and PAUSES there while
//     its own tail gathers into the mouth behind it — "figured out how to"
//                                                                      f44-56
//   THE ONE CAMERA MOVE, keys f56-70, warp 0.72:
//     k 0.50 / centre -102 -> k 0.40 / centre 250,
//     so the rail, the hub, our box and the box
//     below are one picture. It is visually still
//     five frames before "each other"               — "talk to"         f56-70
//   THE ROUTE. From f57 the packet continues: down
//     our pipe, THROUGH THE HUB (the ring and its
//     package glyph click ink-bright together for 4
//     frames as the head crosses r 40, ~f66), down
//     the lower pipe into the box below and across
//     to its ringed agent, arriving exactly on the
//     word — that agent's ring clicks 4 frames and
//     it stays ripe                                 — "each other"      f78
//   THE REPLY, along the reverse route: up through
//     the hub, click, into our box, to our agent    — "through this"    f80-96
//   THE THIRD VOICE. The left agent launches to its
//     own pipe mouth (-860, 410), down its pipe,
//     ALONG THE RAIL to the hub (which clicks as the
//     head reaches it), up our pipe, to our agent.
//     Its head is on the rail across the
//     whole word                       — "through this package manager" f87-120
//   STEADY EXCHANGE. From "package manager" a new
//     packet launches every 6 frames among the three
//     ringed agents, all six directed pairs in a
//     hashed order, always via the hub and never box
//     to box. Two to four are in flight at a time;
//     the hub clicks as heads pass; the three
//     agents stay ripe                              — "package manager" f101-136
//   held under traffic, never fades out             — tail              f120-136
//
// ambient: idle thread traffic in every visible box at the shared rate (180 per
// 1,200 agents), `breath` on every dot, the seventeen reaches and every
// neighbour's reaches still pumping, `sway` on the camera. Not gestures; that
// is what this field is.
//
// THE ROUTES, as coordinate lists in world px. A route is always
// agent -> its own pipe mouth -> the rail -> the other rail point -> that
// box's mouth -> that agent, so a message never crosses a wall except at a
// pipe mouth and never goes box to box directly.
//   ours  <-> below : (736.9, 159.8) (540, 410) (540, 760) (540, 1110)
//                     (616.4, 1227.2)                         — 1,158.3 px
//   left  <-> ours  : (-473.0, 128.1) (-860, 410) (-860, 760) (540, 760)
//                     (540, 410) (736.9, 159.8)               — 2,897.2 px
//   left  <-> below : (-473.0, 128.1) (-860, 410) (-860, 760) (540, 760)
//                     (540, 1110) (616.4, 1227.2)             — 2,718.7 px
// The three ringed seats themselves are solved, not placed: see OUR_AGENT,
// BELOW_AGENT and LEFT_AGENT below, each with the rule it is solved under.
// Ours lands 318.4 px from the mouth (so 9 frames at 35.4 px/frame) and below
// lands 139.9 px from its own (so the second leg is 839.9 px, 21 frames at 40).
//
// TWO SPEEDS, and why. The discovery packet runs at 36 px/frame to the mouth
// and 40 px/frame from it, which is what the brief's f44 / f53 / f57 / f78 key
// frames are: it is deliberate because it is finding the way. Every packet
// after it runs at one traffic speed, solved so the reply lands on f96 — 72.39
// px/frame. It has to be faster: the rail alone is 1,400 px from the left
// column to the hub, so at the discovery speed the third voice would still be
// travelling at f136 and the exchange could never have two packets in flight at
// six-frame launches. The trail is a motion trail — the head's own position
// TAIL_LAG frames ago — so it is ~120 px at the discovery speed, longer when
// the traffic runs, and collapses to nothing when the packet pauses at the
// mouth. One mechanism, and the pause draws itself.
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
    byMay: z.number(), // "by May"           — the world at rest
    twelfthSome: z.number(), // "12th, some" — the three rings land off this
    agentsHad: z.number(), // "agents had"
    figured: z.number(), // "figured"        — the first packet launches
    outHowTo: z.number(), // "out how to"    — it pauses at the mouth
    talkTo: z.number(), // "talk to"         — the camera move is running
    eachOther: z.number(), // "each other"   — the packet arrives below
    throughThis: z.number(), // "through this" — the third voice launches
    packageManager: z.number(), // "package manager" — the steady exchange
    end: z.number(), // speech ends; tail to 136
  }),
});

export type Props = z.infer<typeof schema>;

// The join. Cut 1 ran 184 frames from its own f0 and cut 2's clock started at
// its f168; cut 2 ran 231. So cut 2's last frame is this piece's f0.
export const OFFSET = TH_OFFSET + TH_DURATION; // 168 + 231 = 399
// Cut 2's own clock, for the gestures of cut 2 that are still running.
export const TH_CLOCK = TH_DURATION; // 231

// ---------------------------------------------------------------------------
// The camera. ONE move, and it is "talk to": out from cut 2's resolved k 0.50 /
// content centre -102 to k 0.40 / content centre 250, so the rail, the hub, our
// box and the box below it are one picture instead of our box with a farm under
// it.
//
//   screen(y) = (y - c) * k + 835 for a content centre c, because
//   cy = c + CAM_LIFT / k puts c at 960 - 125 = 835.
//
// At k 0.50 / -102 (the open, cut 2's resolved framing): the mark's top at
// screen 577, our box 315-765 across and 739-1089 down, the rail at 1266, row
// 1's top walls at 1441, columns +-1 showing 65 px at the side edges.
// At k 0.40 / 250 (the resolve): the mark's top at 489, our box's centre row at
// 759, the rail at 1039, the box below centred at 1319 with its bottom at 1459,
// and the left neighbour showing 160 px at the left edge.
//
// Keys f56-70 rather than f58-78: `runCamera` damps the target, so a track
// keyed to end on the word is still running past it. Ending at f70 puts the
// move on screen across f56-78 and dead still under "each other".
// ---------------------------------------------------------------------------
export const K_OPEN = K_FINAL; // 0.95 — director pass 2: open on cut 2's OPENING framing (tight on our box), not its end
export const K_WIDE = 0.4;
export const CONTENT_WIDE = 250;
export const CAM_MOVE_F0 = 52; // local; the move runs under "talk to" — a 2.4x zoom, so a slightly longer ramp
export const CAM_MOVE_F1 = 72;
const MOVE = camMove({
  f0: OFFSET + CAM_MOVE_F0,
  f1: OFFSET + CAM_MOVE_F1,
  k0: K_OPEN,
  k1: K_WIDE,
  c0: CONTENT_FINAL,
  c1: CONTENT_WIDE,
  warp: 0.72,
});
const CY_WIDE = CONTENT_WIDE + 125 / K_WIDE;
// The track no longer starts from cut 2's: this piece opens at k 0.95, so the
// first key IS the opening framing and the damper is at rest on it from f0.
export const TA_CAM_F = [OFFSET, ...MOVE.F, OFFSET + DURATION];
export const TA_CAM_K = [K_OPEN, ...MOVE.K, K_WIDE];
export const TA_CAM_CY = [CONTENT_FINAL + 125 / K_OPEN, ...MOVE.CY, CY_WIDE];

// ---------------------------------------------------------------------------
// THE PACKAGE MANAGER. One rail, one pipe per box in the two rows either side
// of it, and the hub where our column's two pipes meet it. It was established
// in the sentence before this cut, so it is drawn from f0 and never animates —
// it is not a gesture, it is what the boxes are plugged into.
//
// DIRECTOR'S PASS 3: THE PACKAGE GLYPH. The hub used to be three bare ink rings
// on the rail (x 460 / 540 / 620, radii 24 / 34 / 24) and it did not say
// "package manager" — it said "three rings". It is now ONE ring holding a
// package, drawn exactly the way cut 1 draws the internet: RING's own numbers
// (r 40, stroke 3, ink at OP_READ, under `iconShadow`) with a glyph inside it.
// So the two things outside the sandbox — the internet and the package manager
// — are one language: a ring with a glyph in it, and you read the glyph.
//
// Nothing crosses the ring's interior except that glyph. The rail runs in from
// the left and stops at x 500, picks up again at x 580; our pipe comes down and
// stops at y 720; the lower pipe starts at y 800. Every one of those is the
// ring's own edge, so the ring is a hole in the plumbing rather than a washer
// laid over it. The route geometry is untouched — a packet still passes through
// (540, 760), it is just that the pipe is not drawn where the ring is.
// ---------------------------------------------------------------------------
export const RAIL_Y = (BOX_Y1 + (BOX_Y0 + PITCH_Y)) / 2; // 760: the middle of the gap
export const RAIL_X0 = CENTRE_X + FARM_COLS[0] * PITCH_X; // -2260
export const RAIL_X1 = CENTRE_X + FARM_COLS[FARM_COLS.length - 1] * PITCH_X; // 3340
export const PIPE_TOP_Y = BOX_Y1; // 410, row 0's floor
export const PIPE_BOT_Y = BOX_Y0 + PITCH_Y; // 1110, row 1's ceiling

// The hub: the internet ring's exact numbers, on the rail under our column.
export const HUB = { x: CENTRE_X, y: RAIL_Y, r: RING.r }; // (540, 760), r 40
export const HUB_CLICK = 4; // frames the ring and its glyph stay ink-bright
// Where the rail and the two pipes stop, so the interior is the glyph's alone.
export const HUB_LEFT = HUB.x - HUB.r; // 500
export const HUB_RIGHT = HUB.x + HUB.r; // 580
export const HUB_TOP = HUB.y - HUB.r; // 720
export const HUB_BOT = HUB.y + HUB.r; // 800

// The package, in world px about the ring's centre: an isometric parcel — a
// hexagon seen corner-on, the three edges of the near corner running out of the
// middle of it, and a strap over the top face. Same treatment as cut 1's wifi
// glyph: stroke 3, no fill, OP_READ, one <g>, under the same per-icon shadow,
// present from f0 with the ring. It does not draw in, it is simply there.
export const PKG_PATHS = [
  "M 0 -26 L 22 -13 L 22 13 L 0 26 L -22 13 L -22 -13 Z", // the outline
  "M 0 0 L -22 -13", // the three edges of the near corner
  "M 0 0 L 22 -13",
  "M 0 0 L 0 26",
  "M -11 -19.5 L 11 -6.5", // the strap across the top face
];

// ---------------------------------------------------------------------------
// THE THREE RINGED AGENTS. Solved, not placed.
//
//   OURS is a hashed seat at least 70 px from every one of the seventeen tiles,
//     at least 70 px from all four walls, at least 26 px off every reach (a
//     ring laid over a reach reads as a join that is not there), and 300-350 px
//     from our pipe mouth, so that at the briefed 36 px/frame the packet leaves
//     on "figured" and is at the mouth nine frames later.
//   BELOW is the seat in box (0, 1) whose distance from that box's pipe mouth
//     is closest to 140 px, which is what makes the second leg 840 px long and
//     therefore exactly 21 frames at 40 px/frame — leaving on f57 and landing
//     on "each other". It is clear of that box's own tiles and walls.
//   LEFT is the seat in box (-1, 0) that scores highest on x - 0.35 * |y - 60|,
//     i.e. as close to our column as its crowd goes and as near the vertical
//     middle as that allows. The reason is framing, not taste: at the opening
//     camera only 65 screen px of that box is in frame, so any seat further
//     from us has its ring cut by the left edge on "some agents". This one
//     lands whole at the edge and the camera move brings it fully in.
// ---------------------------------------------------------------------------
type P = { x: number; y: number };
export const OUR_MOUTH: P = { x: CENTRE_X, y: PIPE_TOP_Y }; // (540, 410)
// THE CONVERSATION LAYER IS DRAWN IN SCREEN PX. The agent-crowd language's
// numbers — a ring at r 14 on stroke 3.5, a thread's head at r 4 — were written
// for a field playing at k ~ 1, where world px and screen px are the same
// thing. This cut plays at k 0.50 falling to k 0.40, so taken as world px they
// come out at 5.6-7 screen px for the ring and 1.6-2 for the head: smaller than
// the gap between two agents, and measured on a first render they marked
// nothing at all. So they are divided by k at draw time and land on screen at
// exactly the size the reference gave them — the same rule `iconShadow` in
// fieldShared already applies to every icon in this style, and for the same
// reason. The packet's LINE is not treated this way: it travels inside a pipe
// drawn at stroke 3 world, and a packet wider than its own pipe is a lie.
export const RING_R = 14; // screen px
export const RING_STROKE = 3.5; // screen px
export const RING_LAND = 8; // frames

const wallDist = (x: number, y: number) =>
  Math.min(x - BOX_X0, BOX_X1 - x, y - BOX_Y0, BOX_Y1 - y);

// point to segment, for the reach clearance
const segDist = (px: number, py: number, ax: number, ay: number, bx: number, by: number) => {
  const dx = bx - ax;
  const dy = by - ay;
  const L2 = dx * dx + dy * dy || 1;
  const t = clamp01(((px - ax) * dx + (py - ay) * dy) / L2);
  return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
};

const OUR_TILES: P[] = [
  ...TILES.map((t) => ({ x: t.x, y: t.y })),
  ...WAVE2.map((w) => ({ x: w.x, y: w.y })),
];

export const OUR_AGENT = (() => {
  const cands: number[] = [];
  for (let i = 0; i < NSEAT; i++) {
    const s = SEATS[i];
    if (wallDist(s.x, s.y) < 70) continue;
    if (OUR_TILES.some((t) => Math.hypot(t.x - s.x, t.y - s.y) < 70)) continue;
    if (
      REACHES.some(
        (rc) => segDist(s.x, s.y, rc.x, rc.y - TILE_HALF, rc.tipEnd, LINE_TIP_Y) < 26,
      )
    )
      continue;
    const d = Math.hypot(s.x - OUR_MOUTH.x, s.y - OUR_MOUTH.y);
    if (d < 300 || d > 350) continue;
    cands.push(i);
  }
  if (!cands.length) throw new Error("no seat for our ringed agent");
  cands.sort((a, b) => hash(a, 97) - hash(b, 97));
  const i = cands[0];
  return { seat: i, x: SEATS[i].x, y: SEATS[i].y };
})();

const BELOW = NEIGHBOURS.find((b) => b.i === 0 && b.j === 1) as Box;
const LEFT = NEIGHBOURS.find((b) => b.i === -1 && b.j === 0) as Box;

// A neighbour's ringed seat, under a score of the caller's choosing. `want` is
// the local-space target the score is measured against.
const pickSeat = (box: Box, score: (s: { x: number; y: number }) => number) => {
  let best = -1;
  let bs = -Infinity;
  for (let i = 0; i < box.n; i++) {
    const s = box.seats[i];
    if (wallDist(s.x, s.y) < 45) continue;
    if (box.tiles.some((t) => Math.hypot(t.x - s.x, t.y - s.y) < 70)) continue;
    const v = score(s);
    if (v > bs) {
      bs = v;
      best = i;
    }
  }
  if (best < 0) throw new Error("no seat for a ringed neighbour agent");
  return { seat: best, x: box.seats[best].x, y: box.seats[best].y };
};

// its pipe mouth, in ITS OWN local space: row 1 plugs in through its ceiling
export const BELOW_MOUTH_LOCAL: P = { x: CENTRE_X, y: BOX_Y0 };
export const BELOW_AGENT = pickSeat(
  BELOW,
  (s) => -Math.abs(Math.hypot(s.x - BELOW_MOUTH_LOCAL.x, s.y - BELOW_MOUTH_LOCAL.y) - 140),
);
export const LEFT_AGENT = pickSeat(LEFT, (s) => s.x - 0.35 * Math.abs(s.y - BOX_CY));

// ---------------------------------------------------------------------------
// The three of them as nodes on the manager: where the agent is, where its box
// plugs in, and where that pipe meets the rail. Every route in the piece is
// built out of these three points and nothing else, which is what makes "never
// box to box directly" structural rather than a thing to remember.
// ---------------------------------------------------------------------------
export type Node = { key: string; x: number; y: number; mouth: P; rail: P };
export const N_OURS: Node = {
  key: "ours",
  x: OUR_AGENT.x,
  y: OUR_AGENT.y,
  mouth: OUR_MOUTH,
  rail: { x: CENTRE_X, y: RAIL_Y },
};
export const N_BELOW: Node = {
  key: "below",
  x: BELOW_AGENT.x + BELOW.dx,
  y: BELOW_AGENT.y + BELOW.dy,
  mouth: { x: CENTRE_X + BELOW.dx, y: PIPE_BOT_Y },
  rail: { x: CENTRE_X + BELOW.dx, y: RAIL_Y },
};
export const N_LEFT: Node = {
  key: "left",
  x: LEFT_AGENT.x + LEFT.dx,
  y: LEFT_AGENT.y + LEFT.dy,
  mouth: { x: CENTRE_X + LEFT.dx, y: PIPE_TOP_Y },
  rail: { x: CENTRE_X + LEFT.dx, y: RAIL_Y },
};
export const NODES = [N_OURS, N_BELOW, N_LEFT];

type Seg = { x: number; y: number; ux: number; uy: number; len: number; s0: number };
export type Route = { segs: Seg[]; total: number };

const makeRoute = (pts: P[]): Route => {
  const segs: Seg[] = [];
  let s0 = 0;
  for (let i = 0; i + 1 < pts.length; i++) {
    const dx = pts[i + 1].x - pts[i].x;
    const dy = pts[i + 1].y - pts[i].y;
    const len = Math.hypot(dx, dy);
    if (len < 0.5) continue; // ours and below share a rail point; the leg is nothing
    segs.push({ x: pts[i].x, y: pts[i].y, ux: dx / len, uy: dy / len, len, s0 });
    s0 += len;
  }
  return { segs, total: s0 };
};

const pointAt = (r: Route, s: number): P => {
  const t = Math.max(0, Math.min(r.total, s));
  for (const g of r.segs) {
    if (t <= g.s0 + g.len) return { x: g.x + g.ux * (t - g.s0), y: g.y + g.uy * (t - g.s0) };
  }
  const g = r.segs[r.segs.length - 1];
  return { x: g.x + g.ux * g.len, y: g.y + g.uy * g.len };
};

const routeBetween = (a: Node, b: Node) =>
  makeRoute([{ x: a.x, y: a.y }, a.mouth, a.rail, b.rail, b.mouth, { x: b.x, y: b.y }]);

// every ordered pair, both ways, built once
export const ROUTES: Route[][] = NODES.map((a) => NODES.map((b) => routeBetween(a, b)));

// ---------------------------------------------------------------------------
// The packets. A packet is MessageBoardV2's thread pointed down a route: an
// accent line with a small white head, except that here it travels rather than
// draws, so its tail is a motion trail — the head's own position TAIL_LAG
// frames ago. That one rule gives a ~120 px tail at the discovery speed, a
// longer streak at the traffic speed, and a tail that collapses into the mouth
// while the packet pauses there. Nothing is timed separately.
// ---------------------------------------------------------------------------
export const TAIL_LAG = 3; // frames; 3 * 40 px/frame = the briefed ~120 px tail
// ...but never shorter than this, so the packet is still a packet while it is
// stopped at the mouth. Without a floor the trail runs all the way into a
// paused head and the pause is a single dot on a wall, which is not a pause,
// it is nothing. At 40 world px it is a short stub with the head on the end.
export const TAIL_MIN = 40;
export const TAIL_SAMPLES = 6;
export const HEAD_R = 4; // screen px, divided by k at draw time
export const V_FIND = 40; // px/frame, the second leg of the discovery packet
export const AGENT_CLICK = 4; // frames a receiving agent's ring stays ink-bright

export type Pk = {
  key: string;
  route: Route;
  F: number[]; // frames
  S: number[]; // arclength at those frames, non-decreasing
  t0: number;
  arrive: number;
  to: number; // index into NODES
};

const simplePk = (key: string, from: number, to: number, t0: number, v: number): Pk => {
  const route = ROUTES[from][to];
  const arrive = t0 + route.total / v;
  return { key, route, F: [t0, arrive], S: [0, route.total], t0, arrive, to };
};

// -- the discovery packet ----------------------------------------------------
// Leg 1: our agent to our pipe mouth, leaving on "figured" (f44) and there nine
// frames later, which is the ~36 px/frame the brief asks for by construction.
// Then it holds at the mouth — "figured out how to" — while its own trail runs
// into it. Leg 2 leaves late enough that 40 px/frame lands the head on the
// agent below EXACTLY on "each other".
export const FIND_LAUNCH = 44;
export const FIND_AT_MOUTH = 53;
export const FIND_ARRIVE = 78;
const FIND_ROUTE = ROUTES[0][1];
export const FIND_L1 = Math.hypot(N_OURS.x - OUR_MOUTH.x, N_OURS.y - OUR_MOUTH.y);
export const V_FIND_1 = FIND_L1 / (FIND_AT_MOUTH - FIND_LAUNCH);
export const FIND_RESUME = FIND_ARRIVE - (FIND_ROUTE.total - FIND_L1) / V_FIND;
export const FIND_PK: Pk = {
  key: "find",
  route: FIND_ROUTE,
  F: [FIND_LAUNCH, FIND_AT_MOUTH, FIND_RESUME, FIND_ARRIVE],
  S: [0, FIND_L1, FIND_L1, FIND_ROUTE.total],
  t0: FIND_LAUNCH,
  arrive: FIND_ARRIVE,
  to: 1,
};

// -- the traffic -------------------------------------------------------------
// One speed for every packet after the discovery, solved so the reply leaves on
// "through this" + 2 and lands on the brief's f96.
export const REPLY_LAUNCH = 80;
export const REPLY_ARRIVE = 96;
export const V_TRAFFIC = ROUTES[1][0].total / (REPLY_ARRIVE - REPLY_LAUNCH);
export const THIRD_LAUNCH = 87;
export const EXCHANGE_F0 = 101;
export const EXCHANGE_EVERY = 6;

// all six directed pairs, in a hashed order, so the exchange uses every pair
// exactly once across the six launches and never runs the same one twice
const DIRECTED: [number, number][] = [
  [0, 1],
  [1, 0],
  [0, 2],
  [2, 0],
  [1, 2],
  [2, 1],
];
const EX_ORDER = DIRECTED.map((_, i) => i).sort((a, b) => hash(a, 33) - hash(b, 33));

export const PACKETS: Pk[] = (() => {
  const out: Pk[] = [FIND_PK];
  out.push(simplePk("reply", 1, 0, REPLY_LAUNCH, V_TRAFFIC)); // "through this"
  out.push(simplePk("third", 2, 0, THIRD_LAUNCH, V_TRAFFIC)); // the left agent joins
  for (let n = 0; ; n++) {
    const t0 = EXCHANGE_F0 + n * EXCHANGE_EVERY;
    if (t0 > DURATION) break;
    const [a, b] = DIRECTED[EX_ORDER[n % EX_ORDER.length]];
    out.push(simplePk(`x${n}`, a, b, t0, V_TRAFFIC));
  }
  return out;
})();

const headAt = (p: Pk, f: number) => interpolate(f, p.F, p.S, clamp);

// ---------------------------------------------------------------------------
// OUR SCARS. Cut 2's strike ran from its f190 and its beads settle to 0.6 and
// stay; this evaluates that exact function at cut 2's LAST frame and freezes
// the set. Nothing new lands on our walls in this cut — the strike is over —
// but what it left is still there.
// ---------------------------------------------------------------------------
export const SCARS: Bead[] = (() => {
  const lit = new Float32Array(NSEAT);
  const th: Th[] = [];
  const beads: Bead[] = [];
  hackFor(TH_CLOCK, 190, OUR, lit, th, beads, true);
  return beads;
})();
export const BEAD_R = 4;

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
    byMay: 0,
    twelfthSome: 11,
    agentsHad: 31,
    figured: 44,
    outHowTo: 50,
    talkTo: 67,
    eachOther: 78,
    throughThis: 87,
    packageManager: 101,
    end: 120,
  },
});

const TalkThroughArtifactory: React.FC<Props> = ({
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
  // are still running (the pump, the converge, the tone under the tiles).
  const F = frame + OFFSET;
  const F2 = frame + TH_CLOCK;
  const tone = makeTone(accentDeep, accent);

  // -- camera, first: the cull needs it --------------------------------------
  const cam = runCamera(F, TA_CAM_F, TA_CAM_CY, TA_CAM_K);
  const drift = sway(F);
  const cy = cam.cy + drift.dy;
  const cx = CENTRE_X + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);

  // -- the three rings -------------------------------------------------------
  // "some agents": three of them, one to a box. The ring lands with the shared
  // overshoot; the agent under it goes deep -> ripe on the same eight frames.
  // director pass 2: the open is tight on our box, so only our agent can ring on
  // "some agents"; the other two ring the moment they speak — below as the first
  // packet lands on it (f78), left as it launches (f87).
  const ringAt = [beats.twelfthSome + 3, FIND_ARRIVE, THIRD_LAUNCH];
  const ringScale = ringAt.map((at) =>
    interpolate(frame, [at, at + RING_LAND], [0.5, 1], {
      ...clamp,
      easing: Easing.out(Easing.back(1.6)),
    }),
  );
  const ringIn = ringAt.map((at) => clamp01((frame - at) / 4));
  const ringTone = ringAt.map((at) => smooth((frame - at) / RING_LAND));

  // -- the packets -----------------------------------------------------------
  // Alive when the trail's rear has not yet run off the end of the route. The
  // hub ring and the receiving agents' rings both click FROM THE HEAD, never
  // from a parallel timer.
  let hubClick = 0;
  const agentClick = [0, 0, 0];
  type Draw = { key: string; segs: { x1: number; y1: number; x2: number; y2: number; op: number }[]; head: P | null };
  const draws: Draw[] = [];

  for (const p of PACKETS) {
    if (frame < p.t0) continue;
    const sHead = headAt(p, frame);
    const sRear = Math.min(headAt(p, frame - TAIL_LAG), sHead - TAIL_MIN);
    if (sRear >= p.route.total) continue; // arrived, and its trail has run in
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
        op: 0.95 * (0.2 + 0.8 * ((i + 1) / TAIL_SAMPLES)),
      });
    }
    const head = sHead < p.route.total ? pointAt(p.route, sHead) : null;
    draws.push({ key: p.key, segs, head });

    // the hub is bright for HUB_CLICK frames from the frame a head first fell
    // inside the ring — the same test the middle ring used, on the one ring
    for (let dt = 0; dt < HUB_CLICK; dt++) {
      const f = frame - dt;
      if (f < p.t0) break;
      const hp = pointAt(p.route, headAt(p, f));
      if (Math.hypot(hp.x - HUB.x, hp.y - HUB.y) <= HUB.r) hubClick = 1;
    }
    if (frame >= p.arrive && frame < p.arrive + AGENT_CLICK) agentClick[p.to] = 1;
  }

  // -- our crowd's tone ------------------------------------------------------
  // The seventeen agents under a tile have been ripe since cut 2; our ringed
  // agent goes ripe as its ring lands.
  const seatTone = new Float32Array(NSEAT);
  TILES.forEach((t) => {
    seatTone[t.seat] = smooth((F - t.land) / TONE_DUR);
  });
  WAVE2.forEach((w) => {
    seatTone[w.seat] = Math.max(seatTone[w.seat], smooth((F2 - w.land) / TONE_DUR));
  });
  seatTone[OUR_AGENT.seat] = Math.max(seatTone[OUR_AGENT.seat], ringTone[0]);

  // -- ambient traffic -------------------------------------------------------
  const lit = new Float32Array(NSEAT);
  const threadEls: Th[] = [];
  idleFor(F, OUR, idleThreadCount, lit, threadEls);

  // -- the farm --------------------------------------------------------------
  // Back at OP_READ: the recede was cut 2's emphasis on our box and it is over.
  const neighbours = NEIGHBOURS.filter((b) => onScreen(b, cx, cy, k)).map((b) => {
    const nlit = new Float32Array(b.n);
    b.tiles.forEach((t) => {
      nlit[t.seat] = 1; // its agents got their tasks long ago
    });
    if (b === BELOW) nlit[BELOW_AGENT.seat] = Math.max(nlit[BELOW_AGENT.seat], ringTone[1]);
    if (b === LEFT) nlit[LEFT_AGENT.seat] = Math.max(nlit[LEFT_AGENT.seat], ringTone[2]);
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

  // -- the internet ring, closed, with its glyph -----------------------------
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

  const ringMark = (key: string, x: number, y: number, i: number) =>
    ringIn[i] <= 0 ? null : (
      <circle
        key={key}
        cx={x}
        cy={y}
        r={(RING_R / k) * ringScale[i]}
        fill="none"
        stroke={ink}
        strokeWidth={RING_STROKE / k}
        opacity={Math.min(1, OP_READ + (1 - OP_READ) * agentClick[i]) * ringIn[i]}
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
            {/* the hub: one ring holding a package, on the internet ring's own
                numbers, ring and glyph clicking together */}
            <g
              style={{ filter: icon }}
              opacity={Math.min(1, OP_READ + (1 - OP_READ) * hubClick)}
            >
              <circle
                cx={HUB.x}
                cy={HUB.y}
                r={HUB.r}
                fill="none"
                stroke={ink}
                strokeWidth={STROKE}
                strokeLinecap="round"
              />
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

      {/* OUR SANDBOX. Cut 2's layer, its tree in cut 2's order. */}
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
              <mask id="ta-gate" maskUnits="userSpaceOnUse" x={-400} y={-900} width={1900} height={1900}>
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

            {/* the sandbox, with the gate cut 1 left dashed */}
            <g style={{ filter: icon }}>
              <g mask="url(#ta-gate)">
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

            {/* the internet: an ink ring outside the box, closed */}
            <g style={{ filter: icon }}>
              <circle
                cx={RING.x}
                cy={RING.y}
                r={RING.r}
                fill="none"
                stroke={ink}
                strokeWidth={STROKE}
                strokeLinecap="round"
                opacity={OP_READ}
              />
              <g opacity={OP_READ} fill="none" stroke={ink} strokeWidth={STROKE} strokeLinecap="round">
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

      {/* THE CONVERSATION. Above everything, because it is the subject: the
          three rings and every packet in flight, all in world coordinates so a
          route can cross from one box to another through the manager. */}
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
              {ringMark("r0", N_OURS.x, N_OURS.y, 0)}
              {ringMark("r1", N_BELOW.x, N_BELOW.y, 1)}
              {ringMark("r2", N_LEFT.x, N_LEFT.y, 2)}
            </g>
          </svg>
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default TalkThroughArtifactory;
