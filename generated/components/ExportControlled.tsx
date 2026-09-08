import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  BG_BASE,
  BG_DIM,
  CAM_LIFT,
  FRAME_W,
  GridBackground,
  ICON_SHADOW_BLUR,
  ICON_SHADOW_OPACITY,
  ICON_SHADOW_Y,
  OP_READ,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  camMove,
  clamp,
  hash,
  iconShadow,
  runCamera,
  sway,
  worldTransform,
} from "./fieldShared";

export const FPS = 24;
// Dylan Patel, clip `Dylan_Hockey_Stick`, cut 2: "whether or not tools continue
// to get export controlled, how fast China can build their new equipment that
// they're starting to be able to produce domestically".
//
// SRT span 0:18.000 -> 0:27.620 at 24fps.
// round((27.620 - 18.000) * 24) = round(9.62 * 24) = round(230.88) = 231 frames
// of speech, plus a 16 frame tail so the resolved state holds = 247.
export const DURATION = 247;

// ---------------------------------------------------------------------------
// "The gate and the pile". Cut 1 left the flag of China at the centre of the
// frame; this cut keeps it there and gives it a supply line, a wall, and a
// stack. Nothing stands on a ground — there is no floor. The flag floats at the
// centre of the frame and EVERY position in the piece is measured off it.
//
// One repeated unit and nothing else: a tool is a 32px rounded square. Ink
// tools travel in from beyond the left edge along the flag's own centre line
// and go into China (they pass BEHIND the flag and are gone) — that is the
// export machine running. On "controlled" a gate drops in front of them — a
// wall exactly the height of the flag — and they pile up against it. Then China
// makes its own: RED tools, the flag's own red because they come from China,
// come out from behind the flag's right edge and build a PILE two wide and
// seven tall beside it, slowly at first and then fast. The rate IS the answer
// to "how fast" — the quantity is encoded twice, as the spacing of the launches
// and as the height of the pile, which ends up taller than the flag it grew
// out of.
//
// No text. No people. A pile 2 wide x 7 tall, a queue of five, one flag, one
// gate.
//
// FRAMING AND LAYOUT (client pass)
//   flag          240x160 at rx 14, world x 420..660, y 1039..1199. There is
//                 no floor and no other datum: the lane, the gate, the pile
//                 and the camera are all derived from these four numbers.
//   lane          world y 1119 — the flag's vertical CENTRE line. A tool's
//                 centre y is the flag's centre y, so the lane runs into the
//                 middle of the flag and the queue forms on that same line.
//   camera        pure zoom about x 540, k 1.3 -> 1.0, keyed f64-74, warp 0.72
//   content box   world y 939 (the pile's top edge) .. 1199 (the flag's bottom
//                 edge), centre 1069, which lands at SCREEN y 835 at BOTH
//                 framings — the house's 835 exactly, because cy is authored
//                 as contentCentre + CAM_LIFT/k. That puts the flag's centre
//                 (world 1119, 50 px below the content centre) at screen y 885
//                 resolved and 900 at f0.
//   unit          32 world px, rx 7
//   gate          x 360 = flag left edge - 60, from the flag's TOP level to its
//                 BOTTOM level: 160 tall, exactly the flag's height
//   queue         pitch 40, five long, standing on the lane's line, back tool's
//                 left edge at world x 168 = 168 screen px inside the left edge
//                 at k 1.0
//   pile          left column's left edge at world x 760 = flag right + 100,
//                 column pitch 40, row pitch 38, seven rows = 260 px tall.
//                 Row 1's BOTTOM EDGE is the flag's bottom edge (1199), so the
//                 pile grows off the flag's own baseline. Its top edge is world
//                 y 939, 100 px ABOVE the flag's top. Right edge world x 832,
//                 248 px inside the right edge.
//
// Every gesture is one word. Nothing else happens.
//   the foreign lane runs: a tool enters from beyond
//     the left edge every 7 frames at a constant
//     9 world px/frame and disappears behind the
//     flag. Seeded so five of them are already
//     spaced across the frame at f0 with a sixth
//     half-eaten by the flag's left edge — the world
//     is already running when the cut opens          — "whether or not tools
//                                                      continue to get"     f0-58
//   the gate draws head-led DOWNWARD from the flag's
//     top level to the flag's bottom level, a 4px
//     ink bead at its tip, closing on f58 with a
//     4-frame ink click-bright                       — "export controlled"  f50-58
//   the four tools already past the gate carry on
//     into the flag and are out of sight by f64;
//     every tool behind it cruises until it is 30 px
//     short of its slot and then eases the last 30
//     on its own Easing.out(Easing.cubic) over 10
//     frames — the brake is velocity-matched to the
//     lane speed, so nothing in the queue ever
//     changes speed in unison. Slot 0 is down on
//     f66, slot 3 on f75                             — "controlled"         f58-75
//   the ONE camera move: a PURE ZOOM about the
//     content's centre, k 1.3 -> 1.0 on one warped
//     smoothstep (warp 0.72) keyed f64-74, damped
//     inside 0.5% of its target by f84, seven frames
//     before "build". cx is CENTRE_X for the whole
//     track, so the flag holds the middle of the
//     frame from the first frame to the last, and
//     the queue and the empty air open up on either
//     side of it. Nothing new appears while it runs  — "how fast"           f64-84
//   the fourteen domestic tools leave the flag's
//     right edge AT THE FLAG'S CENTRE LINE and build
//     the pile from the flag's bottom edge up, two to
//     a row: #1 and #2 are the bottom row, #13 and
//     #14 the seventh. The launches are f91, 114,
//     126, 151, 156, 162, then 170, 174, 177, 180,
//     182, 184, 186, 188 — gaps of 23, 12, 25, 5, 6,
//     8, 4, 3, 3, 2, 2, 2, 2, so the last eight build
//     rows 4-7 in eighteen frames. Each tool slides
//     out from behind the flag along the centre line,
//     moves in the 100 px corridor between the flag
//     and the pile to 40 px above the HIGHER of its
//     start and its seat, and a quadratic arc with
//     its control point at that height carries it
//     over and sets it down — so rows 1 and 2, whose
//     seats are below the centre line, HOP DOWN, and
//     rows 3-7 lift up. Never a dip below the seat.
//     The flight is split 55% slide / 45% lift by
//     eased progress. The last one seats on
//     "domestically" exactly — its flight duration is
//     solved from that frame                         — "China can build their
//                                                      new equipment that
//                                                      they're starting to be
//                                                      able to produce
//                                                      domestically"       f91-202
//   one more foreign tool enters, crosses the frame
//     and takes the queue's last free slot at f224:
//     the lane never stopped, it just cannot get in  — tail of "domestically"
//                                                                          f179-224
//   hold resolved, never fades                       — tail              f231-247
//
// ambient on every hold: the grid's own drift and the shared `sway`. Nothing
// else — a tool is a machine, not an agent, so there is no breath on it. The
// longest stretch with no gesture is f224-247, the resolved hold itself.
//
// Deviation from the brief, and why:
//   * The foreign lane's post-gate cadence is one tool, not one every 22
//     frames — see the queue rule below.
//
// Pass 2, on the director's note that pass 1 was one thin band at screen y 1120
// with an empty sky over it. Tighter zoom (1.3 -> 1.0), unit up from 28 to 32,
// and the two rows of seven replaced by a pile 2 wide and 7 tall. What that
// forced, and why:
//   * THE QUEUE'S LENGTH IS A FRAMING RULE, not a count. The queue is as long
//     as the resolved framing can hold with its margin, and the balance pass
//     set that margin at 140 screen px so the whole group (queue, gate, flag,
//     pile) sits within ~35 px of the frame's centre: at k 1.0 the left edge is
//     world x 0, so the last slot that fits is slot 4 and the queue is five.
//     The pre-gate lane is untouched: four of its tools take slots 0-3 and the
//     ones that would have taken the slots beyond never spawn — all of them are
//     still off the left edge of the frame when the gate lands, so nothing
//     visible changes. The last slot is left for the one late arrival, which is
//     solved backwards from its landing frame the way the last domestic tool is.
//   * THE GATE CANNOT CUT A TOOL IN HALF. A tool whose body still overlaps the
//     line as the gate lands is through, and carries on into the flag. That is
//     what makes four tools pass rather than three. The alternative is a tool
//     that has to reverse into its slot.
//   * THE LIFT RISES IN THE CORRIDOR, NOT INSIDE ITS OWN COLUMN. The brief asks
//     for a tool to slide to its column and rise straight up it, "so the only
//     thing it passes is air". With the pile filled from the bottom up, that is
//     not true of any tool above row 1: its own column is full underneath it,
//     and a tool travelling to the right-hand column crosses the left-hand
//     column. So the slide stops in the corridor between the flag and the pile
//     (x 710, clear of both by 34 px), the tool moves there to its arc height,
//     and the quadratic arc carries it over the pile and sets it down. Nothing
//     ever overlaps a seated tool.
//   * WITHIN A ROW THE RIGHT COLUMN SEATS FIRST, so a tool bound for the far
//     column never has to clear a tool already sitting at its own seat height.
//   * The flight-duration band is 8-12 frames. The path lengths run 205 to 393
//     px and the fast run launches two frames apart; a longer band leaves five
//     tools stacked in the corridor and lets #14 — whose duration is forced by
//     "domestically" — overtake #13. Swept frame by frame at quarter-frame
//     resolution over the whole run: ZERO overlapping pairs anywhere, seated or
//     flying, and the landings strictly in launch order.
//
// Client pass, on three notes:
//   * "The line under the China flag isn't necessary." The floor is GONE —
//     the horizontal, its constants and its snap. Nothing stands on anything;
//     the flag floats and every datum is taken off the flag instead. The pile's
//     base is the flag's bottom edge, so the pile lands in exactly the same
//     world position it held over the old floor and still ends 100 px taller
//     than the flag.
//   * "The white blocks can come in at a middle level to the flag." The lane
//     runs at the flag's vertical centre line — a tool's centre y IS the flag's
//     centre y — and the queue forms on that line against the gate. The gate is
//     now a wall the HEIGHT OF THE FLAG: 160 world px from the flag's top level
//     to its bottom level (was 220 off the floor), same x, same head-led
//     downward draw, same click on "controlled" at f58. Moving the lane up by
//     64 px shortens every domestic flight's rise and changes every duration,
//     so the whole run was re-solved and re-swept.
//   * "Change the orange to red since they're coming from China." A domestic
//     tool is FLAG_RED, exposed as its own `domesticTool` prop. The flag's
//     stars stay the house yellow and the foreign tools stay ink, so the piece
//     still reads as one palette and the red belongs to China alone.
// ---------------------------------------------------------------------------

// The flag's red, which is also the colour of a tool China made itself.
const FLAG_RED = "#DE2910";

export const schema = z.object({
  ink: z.string(),
  accent: z.string(), // the flag's stars, in the house yellow
  domesticTool: z.string(), // a tool China made itself: the flag's own red
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
  beats: z.object({
    whetherOrNot: z.number(), // "whether or not"
    toolsContinue: z.number(), // "tools continue"
    toGetExport: z.number(), // "to get export"
    controlled: z.number(), // "controlled"
    howFast: z.number(), // "how fast"
    chinaCanBuild: z.number(), // "china can build"
    theirNew: z.number(), // "their new"
    equipmentThat: z.number(), // "equipment that"
    theyre: z.number(), // "they're"
    starting: z.number(), // "starting"
    toBeAble: z.number(), // "to be able"
    toProduce: z.number(), // "to produce"
    domestically: z.number(), // "domestically"
    end: z.number(), // speech ends; tail to 247
  }),
});

export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  ink: "#FFFFFF",
  accent: ACCENT,
  domesticTool: FLAG_RED,
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
    whetherOrNot: 0,
    toolsContinue: 14,
    toGetExport: 44,
    controlled: 58,
    howFast: 78,
    chinaCanBuild: 91,
    theirNew: 114,
    equipmentThat: 126,
    theyre: 151,
    starting: 156,
    toBeAble: 162,
    toProduce: 179,
    domestically: 202,
    end: 231,
  },
});

type Pt = { x: number; y: number };

const WORLD_W = 1080;
const WORLD_H = 2000;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeOut = Easing.out(Easing.cubic);

// ---------------------------------------------------------------------------
// The ground truth, which is not a ground: THE FLAG. It floats at the centre of
// the frame and every other position in the piece is derived from its four
// edges and its centre line — the lane, the queue, the gate's height, the
// pile's base, the camera. Nothing is placed by eye, and nothing stands on
// anything.
// ---------------------------------------------------------------------------
const CENTRE_X = 540;

// the one line weight in the piece: the gate
const STROKE = 3;

// The one repeated unit.
const TOOL = 32;
const TOOL_HALF = TOOL / 2;
const TOOL_RX = 7;

// The flag, carried over from cut 1 — same size, same corner, same colours,
// same star geometry — floating at the centre of the frame.
const FLAG_W = 240;
const FLAG_H = 160; // 3:2
const FLAG_UNIT = FLAG_W / 30;
const FLAG_R = 14;
const FLAG_X = CENTRE_X - FLAG_W / 2; // 420
const FLAG_TOP = 1039;
const FLAG_BOTTOM = FLAG_TOP + FLAG_H; // 1199
const FLAG_MID = FLAG_TOP + FLAG_H / 2; // 1119, the centre line everything runs on
const FLAG_LEFT = FLAG_X;
const FLAG_RIGHT = FLAG_X + FLAG_W; // 660

// The lane's line: a tool's centre y is the flag's centre y.
const LANE_Y = FLAG_MID;

// The pile's grid, declared here because the camera is framed on it: two
// columns 100 px clear of the flag's right edge, seven rows, and row 1's BOTTOM
// EDGE on the flag's bottom edge — the pile grows off the flag's own baseline
// rather than off a floor.
const PILE_GAP = 100; // the corridor between the flag and the pile
const PILE_COL_PITCH = 40; // 32 px tool + 8
const PILE_ROW_PITCH = 38; // 32 px tool + 6
const PILE_ROWS = 7;
const PILE_X0 = FLAG_RIGHT + PILE_GAP + TOOL_HALF; // 776, the left column's centre
const ROW1_Y = FLAG_BOTTOM - TOOL_HALF; // 1183
const pileX = (col: number) => PILE_X0 + col * PILE_COL_PITCH;
const pileY = (row: number) => ROW1_Y - row * PILE_ROW_PITCH; // row is 0-based
const PILE_TOP = pileY(PILE_ROWS - 1) - TOOL_HALF; // 939, 100 px above the flag

// ---------------------------------------------------------------------------
// The camera. ONE move, on "how fast": a PURE ZOOM about the content's centre,
// k 1.3 -> 1.0, which opens the gate's side and the pile's side at once.
// `camMove` writes it as a warped smoothstep with a key per frame and takes cy
// off the eased k, so the framing settles with the zoom instead of sagging
// through it.
//
// There is no lateral travel — cx is CENTRE_X from f0 to f247 — because the
// flag is the one thing in this cut that carries over from the last one and it
// has to hold the middle of the frame throughout.
//
// Keyed f64-74 rather than f66-84: this damper lags its target by about ten
// frames, and the move has to be settled before the first domestic tool leaves
// the flag at f91.
//
// With the floor gone, the framing is authored off the CONTENT BOX, which is
// the pile's top edge (939) down to the flag's bottom edge (1199) — nothing in
// the piece is above or below those. Its centre is world 1069, and because
// `camMove` writes cy as contentCentre + CAM_LIFT/k, that centre sits at SCREEN
// y 835 — the house's number, exactly — at every k the move passes through.
// The flag's centre is 50 px below the content's, so it lands at screen y 885
// resolved and 900 at f0.
//
//   f0-63    k 1.3   the flag's centre at screen y 900, the pile's top at 666
//                    and the flag's bottom at 1004, the lane's tools spaced
//                    across the frame.
//   f64-84   -> 1.0  the flag's centre at screen y 885, the settled queue's
//                    back tool 168 px inside the left edge and the pile's right
//                    column 248 px inside the right.
// ---------------------------------------------------------------------------
const K_OPEN = 1.3;
const K_FINAL = 1.0;
const CAM_F0 = 64;
const CAM_F1 = 74;
const CAM_WARP = 0.72;
// the content box: the pile's top edge down to the flag's bottom edge
const CONTENT_C = (PILE_TOP + FLAG_BOTTOM) / 2; // 1069
const CY_OPEN = CONTENT_C + CAM_LIFT / K_OPEN;
const CY_FINAL = CONTENT_C + CAM_LIFT / K_FINAL;
// what the resolved camera can see, which is what decides how long the queue is
const WORLD_LEFT_FINAL = CENTRE_X - FRAME_W / (2 * K_FINAL);

// ---------------------------------------------------------------------------
// The foreign lane. Tools travel right at a constant speed and are swallowed by
// the flag. Everything about the queue falls out of that one speed: the brake
// distance is velocity-matched to it, and which tools queue is decided by where
// they happen to be when the gate closes, not by a list.
// ---------------------------------------------------------------------------
const LANE_SPEED = 9; // world px per frame
const LANE_PERIOD = 7; // one tool every 7 frames while the gate is open
// The lane's phase, unchanged from pass 1. A 7-frame cadence at 9 px/frame puts
// a tool every 63 px, so where the cadence starts decides where the tools
// happen to be standing when the gate lands.
const LANE_PHASE = -2.5;
// beyond the left edge of the WIDEST framing (world 0), by more than half a
// tool, so nothing ever pops into being inside the frame
const LANE_SPAWN_X = -160;
// a tool that has travelled this far is entirely inside the flag and done —
// short of the domestic spawn, so the two lanes never occupy the same px even
// where nobody can see them
const LANE_KILL_X = 612;

// The gate is a WALL THE HEIGHT OF THE FLAG: it starts at the flag's top level
// and closes at the flag's bottom level, so the thing that stops the lane is
// exactly as tall as the thing the lane was feeding.
const GATE_X = FLAG_LEFT - 60; // 360 (director's balance pass: was -90)
const GATE_TOP = FLAG_TOP;
const GATE_BOTTOM = FLAG_BOTTOM;
const GATE_F0 = 50;
const GATE_F1 = 58; // it closes on "controlled"
const GATE_CLICK = 4;

// The queue. Slot 0's right edge touches the gate; the pitch is 40, so a tool
// stands 8 px behind the one in front.
const QUEUE_PITCH = 40;
const QUEUE_X0 = GATE_X - TOOL_HALF; // 344
const slotX = (slot: number) => QUEUE_X0 - slot * QUEUE_PITCH;

// How long the queue is: not a number, a framing rule. The back tool keeps
// this much air behind it at the resolved camera, and the queue is every slot
// that fits in front of that. Director's balance pass: the margin is 140 so
// the queue is FIVE — the group (queue, gate, flag, pile) then sits within
// ~35 px of the frame's centre, where six put it 105 px left of it.
const QUEUE_MARGIN = 140; // screen px
const QUEUE_MAX =
  Math.floor(
    (QUEUE_X0 - TOOL_HALF - WORLD_LEFT_FINAL - QUEUE_MARGIN / K_FINAL) / QUEUE_PITCH,
  ) + 1;

// The brake. Easing.out(Easing.cubic) leaves its start at 3x its average speed,
// so a brake of D px over T frames starts at 3D/T; matching that to LANE_SPEED
// gives T = 3D / LANE_SPEED and the tool decelerates out of the cruise with no
// kink in its velocity at all. Each tool starts its own brake the frame it
// comes within BRAKE_D of its own slot, which is 40/9 = 4.4 frames after the
// one in front — so the queue compresses from a 63 px pitch to a 40 px one
// without any two of them ever easing together, and without ever closing below
// 40.
const BRAKE_D = 30;
const brakeTime = (d: number) => (3 * d) / LANE_SPEED; // 10 frames at d = 30

// The one late arrival, solved backwards from the frame it lands on the way the
// last domestic tool is solved from "domestically".
const LATE_LAND = 224;

type Foreign = { t0: number; slot: number | null; brake: number; bd: number; bt: number };

const FOREIGN: Foreign[] = (() => {
  const spawns: number[] = [];
  // Seeded: every tool that is still alive at f0 is already in flight, so the
  // lane is running when the cut opens rather than starting to run. The first
  // index is the last one that has not yet been eaten by the flag at f0.
  const nMin = -Math.floor((LANE_KILL_X - LANE_SPAWN_X) / (LANE_SPEED * LANE_PERIOD));
  const nMax = Math.floor((GATE_F1 - LANE_PHASE) / LANE_PERIOD);
  for (let n = nMin; n <= nMax; n++) spawns.push(n * LANE_PERIOD + LANE_PHASE);

  const out: Foreign[] = [];
  let slot = 0;
  for (const t0 of spawns) {
    const atGate = LANE_SPAWN_X + LANE_SPEED * (GATE_F1 - t0);
    // A gate cannot cut a tool in half: a tool whose body still overlaps the
    // line as it lands is through, and carries on into the flag.
    if (atGate + TOOL_HALF > GATE_X) {
      out.push({ t0, slot: null, brake: Infinity, bd: 0, bt: 1 });
      continue;
    }
    // The queue is full but for its last slot, which the late arrival takes.
    // The two tools this drops are both still off the left edge of the frame
    // when the gate lands, so the lane you can see is untouched.
    if (slot >= QUEUE_MAX - 1) continue;
    const s = slot++;
    const brake = Math.max(GATE_F1, t0 + (slotX(s) - BRAKE_D - LANE_SPAWN_X) / LANE_SPEED);
    const bd = slotX(s) - (LANE_SPAWN_X + LANE_SPEED * (brake - t0));
    out.push({ t0, slot: s, brake, bd, bt: brakeTime(bd) });
  }

  const lastSlot = QUEUE_MAX - 1;
  const lateBrake = LATE_LAND - brakeTime(BRAKE_D);
  const lateT0 = lateBrake - (slotX(lastSlot) - BRAKE_D - LANE_SPAWN_X) / LANE_SPEED;
  out.push({
    t0: lateT0,
    slot: lastSlot,
    brake: lateBrake,
    bd: BRAKE_D,
    bt: brakeTime(BRAKE_D),
  });
  return out;
})();

const foreignX = (t: Foreign, f: number): number | null => {
  if (f < t.t0) return null;
  const free = LANE_SPAWN_X + LANE_SPEED * (f - t.t0);
  if (t.slot === null) return free > LANE_KILL_X ? null : free;
  if (f <= t.brake) return free;
  const target = slotX(t.slot);
  return target - t.bd + t.bd * easeOut(clamp01((f - t.brake) / t.bt));
};

// ---------------------------------------------------------------------------
// The pile's flights. The grid itself is up with the flag, since the camera is
// framed on it; this is how a tool gets to its seat.
//
// A tool is born fully hidden behind the flag's right edge AT THE FLAG'S CENTRE
// LINE — the same height the foreign tools come in at, mirrored — slides out
// along that line into the corridor between the flag and the pile, moves there
// to 40 px above the HIGHER of its start and its seat, and a quadratic arc with
// its control point at that height carries it over and sets it down. Rows 1 and
// 2 sit below the centre line, so their arc is a hop DOWN; rows 3-7 sit above
// it and lift up. Taking the arc height off the higher endpoint is what keeps
// it a hop either way: 40 px above the seat alone would put the "arc" of a
// descending flight below its own seat.
//
// The right column of each row seats before the left one. That is what keeps
// every flight clear of every seated tool — see the header.
// ---------------------------------------------------------------------------
// Its right edge is exactly the flag's right edge and it sits on the flag's
// centre line, so it is entirely occluded until it moves.
const DOM_SPAWN_X = FLAG_RIGHT - TOOL_HALF; // 644
// The middle of the corridor: a tool standing here is 34 px clear of the flag
// and 34 px clear of the pile.
const LIFT_X = FLAG_RIGHT + PILE_GAP / 2; // 710
const LIFT_RISE = 40; // the control point, 40 px above the higher endpoint

const DOM_LAUNCH = [91, 114, 126, 151, 156, 162, 170, 174, 177, 180, 182, 184, 186, 188];
if (DOM_LAUNCH.length !== PILE_ROWS * 2) {
  throw new Error(`the pile is ${PILE_ROWS} x 2 and needs ${PILE_ROWS * 2} launches`);
}
const DOM_DUR_MIN = 8;
const DOM_DUR_MAX = 12;
// How much of the flight, by distance, is the slide out from behind the flag.
const SLIDE_SHARE = 0.55;

// --- polyline arithmetic, shared by every domestic flight -------------------
const cumulative = (pts: Pt[]) => {
  const c = [0];
  for (let i = 1; i < pts.length; i++) {
    c.push(c[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  }
  return c;
};
const atLength = (pts: Pt[], cum: number[], s: number): Pt => {
  if (s <= 0) return pts[0];
  if (s >= cum[cum.length - 1]) return pts[pts.length - 1];
  let i = 1;
  while (cum[i] < s) i++;
  const t = (s - cum[i - 1]) / (cum[i] - cum[i - 1] || 1);
  return {
    x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * t,
    y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * t,
  };
};

// pts[0] -> pts[1] is always the slide along the flag's centre line; everything
// after it is the lift.
const domPath = (sx: number, row: number): Pt[] => {
  const seatY = pileY(row);
  // 40 px above the HIGHER of the two ends, so the path is always a hop and
  // never dips below the seat on the way to a row under the centre line.
  const top = Math.min(seatY, LANE_Y) - LIFT_RISE;
  const pts: Pt[] = [
    { x: DOM_SPAWN_X, y: LANE_Y },
    { x: LIFT_X, y: LANE_Y },
    { x: LIFT_X, y: top },
  ];
  const p0 = { x: LIFT_X, y: top };
  const p1 = { x: sx, y: top }; // the control point, at the arc's height
  const p2 = { x: sx, y: seatY };
  const N = 12;
  for (let i = 1; i <= N; i++) {
    const t = i / N;
    const m = 1 - t;
    pts.push({
      x: m * m * p0.x + 2 * m * t * p1.x + t * t * p2.x,
      y: m * m * p0.y + 2 * m * t * p1.y + t * t * p2.y,
    });
  }
  return pts;
};

type Domestic = {
  pts: Pt[];
  cum: number[];
  slide: number;
  lift: number;
  t0: number;
  dur: number;
  land: number;
};

const DOMESTIC: Domestic[] = (() => {
  const raw = DOM_LAUNCH.map((t0, j) => {
    const row = Math.floor(j / 2);
    const col = j % 2 === 0 ? 1 : 0; // the right column of a row seats first
    const pts = domPath(pileX(col), row);
    const cum = cumulative(pts);
    const len = cum[cum.length - 1];
    return { pts, cum, slide: cum[1], lift: len - cum[1], len, t0 };
  });
  const lens = raw.map((r) => r.len);
  const lo = Math.min(...lens);
  const hi = Math.max(...lens);
  return raw.map((r, j) => {
    // Duration goes with the distance, so the whole line moves at about one
    // speed and the landings come in launch order — nothing overtakes anything
    // in the corridor. The hash is small for the same reason.
    const dur =
      DOM_DUR_MIN + (DOM_DUR_MAX - DOM_DUR_MIN) * ((r.len - lo) / (hi - lo)) + 0.8 * hash(j, 31);
    return { ...r, dur, land: r.t0 + dur };
  });
})();
// Solve the last flight so it seats on "domestically" exactly, the way cut 1
// solves its pour's span.
const DOM_LAST = DOMESTIC.length - 1;
DOMESTIC[DOM_LAST].dur = defaultProps.beats.domestically - DOMESTIC[DOM_LAST].t0;
DOMESTIC[DOM_LAST].land = defaultProps.beats.domestically;

// Where a tool is at eased progress g: the slide gets SLIDE_SHARE of the
// distance budget and the lift the rest, so a tool with a 36 px slide and a 358
// px lift still reads as coming OUT from behind the flag before it goes up.
const domAt = (d: Domestic, g: number): Pt => {
  const s =
    d.lift === 0
      ? g * d.slide
      : g < SLIDE_SHARE
        ? (g / SLIDE_SHARE) * d.slide
        : d.slide + ((g - SLIDE_SHARE) / (1 - SLIDE_SHARE)) * d.lift;
  return atLength(d.pts, d.cum, s);
};

const CAM = camMove({
  f0: CAM_F0,
  f1: CAM_F1,
  k0: K_OPEN,
  k1: K_FINAL,
  c0: CONTENT_C,
  c1: CONTENT_C,
  warp: CAM_WARP,
});
const CAM_FF = [0, ...CAM.F, DURATION];
const CAM_K = [K_OPEN, ...CAM.K, K_FINAL];
const CAM_CY = [CY_OPEN, ...CAM.CY, CY_FINAL];

// ---------------------------------------------------------------------------
// The flag of China. Copied from cut 1 rather than imported, so cut 1 is never
// touched: same 240x160 at rx 14, same red, the same official 30x20 unit star
// grid at 8 world px to the unit — the large star at (5,5) with a circumscribed
// radius of 3 units and a point straight up, four small stars of radius 1 unit
// at (10,2), (12,4), (12,7) and (10,9), each turned so one of its points aims
// at the large star's centre — and the same accent fill, so the mark belongs to
// the palette rather than sitting outside it.
//
// The one difference is its entrance: it has none. It is the carry-over from
// cut 1 and it is floating at the centre of the frame from the first frame.
// ---------------------------------------------------------------------------
const flagPt = (ux: number, uy: number): Pt => ({
  x: FLAG_X + ux * FLAG_UNIT,
  y: FLAG_TOP + uy * FLAG_UNIT,
});

const STAR_INNER = 0.382;
const starPts = (c: Pt, r: number, a0: number): Pt[] =>
  Array.from({ length: 10 }, (_, i) => {
    const rr = i % 2 === 0 ? r : r * STAR_INNER;
    const a = a0 + (i * Math.PI) / 5;
    return { x: c.x + rr * Math.cos(a), y: c.y + rr * Math.sin(a) };
  });

const FLAG_BIG_STAR = starPts(flagPt(5, 5), 3 * FLAG_UNIT, -Math.PI / 2);
const FLAG_SMALL_STARS = [
  [10, 2],
  [12, 4],
  [12, 7],
  [10, 9],
].map(([ux, uy]) => starPts(flagPt(ux, uy), FLAG_UNIT, Math.atan2(5 - uy, 5 - ux)));
const FLAG_CLIP = "ec-flag-clip";

const path = (pts: Pt[]) =>
  pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ");

const Tool: React.FC<{ x: number; y: number; fill: string; opacity: number }> = ({
  x,
  y,
  fill,
  opacity,
}) => (
  <rect
    x={x - TOOL_HALF}
    y={y - TOOL_HALF}
    width={TOOL}
    height={TOOL}
    rx={TOOL_RX}
    ry={TOOL_RX}
    fill={fill}
    opacity={opacity}
  />
);

const ExportControlled: React.FC<Props> = ({
  ink,
  accent,
  domesticTool,
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
  beats,
}) => {
  const frame = useCurrentFrame();

  // -- the foreign lane and its queue ---------------------------------------
  const foreign = FOREIGN.map((t, i) => {
    const x = foreignX(t, frame);
    return x === null ? null : { x, key: i };
  });

  // -- the gate --------------------------------------------------------------
  // Head-led downward from the flag's top level to the flag's bottom level, a
  // bead at the tip, one 4-frame ink click as it lands.
  const gateHead = interpolate(frame, [GATE_F0, beats.controlled], [GATE_TOP, GATE_BOTTOM], clamp);
  const gateDrawing = frame > GATE_F0 && frame < beats.controlled;
  const gateClick = frame >= beats.controlled && frame < beats.controlled + GATE_CLICK ? 1 : 0;
  const gateOp = Math.min(1, OP_READ + (1 - OP_READ) * gateClick);

  // -- the pile --------------------------------------------------------------
  const domestic = DOMESTIC.map((d, i) => {
    if (frame < d.t0) return null;
    const p = domAt(d, easeOut(clamp01((frame - d.t0) / d.dur)));
    return { x: p.x, y: p.y, key: i };
  });

  // -- camera ----------------------------------------------------------------
  const cam = runCamera(frame, CAM_FF, CAM_CY, CAM_K);
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = CENTRE_X + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);

  // Everything in this cut is an icon lying on the field, so everything takes
  // the small per-icon shadow, in screen px, at every zoom.
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <GridBackground
        src={backgroundSrc}
        blur={backgroundBlur}
        dim={backgroundDim}
        frame={frame}
        cy={cy}
        cyRest={CAM_CY[0]}
        cx={cx}
        cxRest={CENTRE_X}
        k={k}
        parallax={parallax}
      />

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
            {/* the foreign lane, on the flag's centre line and BELOW it, so it
                is swallowed by the flag */}
            <g style={{ filter: icon }}>
              {foreign.map((t) =>
                t ? <Tool key={`i${t.key}`} x={t.x} y={LANE_Y} fill={ink} opacity={OP_READ} /> : null,
              )}
            </g>

            {/* the pile, BELOW the flag so it is born out of it */}
            <g style={{ filter: icon }}>
              {domestic.map((d) =>
                d ? <Tool key={`d${d.key}`} x={d.x} y={d.y} fill={domesticTool} opacity={1} /> : null,
              )}
            </g>

            {/* the flag, floating at the centre of the frame */}
            <g style={{ filter: icon }}>
              <defs>
                <clipPath id={FLAG_CLIP}>
                  <rect
                    x={FLAG_X}
                    y={FLAG_TOP}
                    width={FLAG_W}
                    height={FLAG_H}
                    rx={FLAG_R}
                    ry={FLAG_R}
                  />
                </clipPath>
              </defs>
              <rect
                x={FLAG_X}
                y={FLAG_TOP}
                width={FLAG_W}
                height={FLAG_H}
                rx={FLAG_R}
                ry={FLAG_R}
                fill={FLAG_RED}
              />
              <g clipPath={`url(#${FLAG_CLIP})`}>
                {[FLAG_BIG_STAR, ...FLAG_SMALL_STARS].map((s, i) => (
                  <path key={`f${i}`} d={`${path(s)} Z`} fill={accent} />
                ))}
              </g>
            </g>

            {/* the gate, in front of the queue */}
            {frame > GATE_F0 ? (
              <g style={{ filter: icon }}>
                <line
                  x1={GATE_X}
                  y1={GATE_TOP}
                  x2={GATE_X}
                  y2={gateHead}
                  stroke={ink}
                  strokeWidth={STROKE}
                  strokeLinecap="round"
                  opacity={gateOp}
                />
                {gateDrawing ? (
                  <circle cx={GATE_X} cy={gateHead} r={4} fill={ink} opacity={OP_READ} />
                ) : null}
              </g>
            ) : null}
          </svg>
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default ExportControlled;
