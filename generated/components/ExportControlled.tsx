import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  BG_BASE,
  BG_DIM,
  CAM_LIFT,
  FRAME_H,
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
  camEase,
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
// FRAMING AND LAYOUT (client pass, then the consistency pass)
//   flag          240x160 at rx 14, world x 420..660, y 1039..1199 — which is
//                 300x200 at rx 17.5 SCREEN px at the resolved k 1.25, the size
//                 the mark takes in all three cuts of this clip. There is no
//                 floor and no other datum: the lane, the gate, the pile and
//                 the camera are all derived from these four numbers.
//   lane          world y 1119 — the flag's vertical CENTRE line. A tool's
//                 centre y is the flag's centre y, so the lane runs into the
//                 middle of the flag and the queue forms on that same line.
//   camera        ONE move, keyed f66-104, warp 0.72: k 1.6 -> 1.25 AND
//                 cx 540 -> 1140 on the same eased curve. The frame opens on
//                 the flag and ends on the pile, with the flag, the gate and
//                 the queue pushed off the left edge.
//   framing       held on the FLAG's row all the way through: the flag's centre
//                 line (world 1119) sits at SCREEN y 830 at BOTH framings and
//                 at every frame between them, so the mark neither moves
//                 vertically nor changes size between this cut's last frame and
//                 cut 3's first. cy is authored as FLAG_MID + (960 - 830)/k,
//                 which `camMove` takes as a content centre five world px below
//                 it. The pan is lateral only; nothing about the vertical
//                 framing moved for it.
//   open frame    cx 540, k 1.6: the visible world runs x 202..878, the flag
//                 240 world px wide reads 384 on screen, the pile's top edge is
//                 at screen y 542 and the flag's bottom at 958.
//   resolved      cx 1140, k 1.25: the visible world runs x 708..1572. The flag
//   frame         is GONE — its right edge sits at screen x -60 — and so is the
//                 gate, the queue, card 1 (right edge -10) and the whole left
//                 half of the piece. What is in frame is the pile (screen
//                 x 102..192, y 605..930) and the own-compute card beside it
//                 (352..752, 568..968).
//   unit          32 world px, rx 7
//   gate          x 360 = flag left edge - 60, from the flag's TOP level to its
//                 BOTTOM level: 160 tall, exactly the flag's height
//   queue         pitch 40, FOUR long, standing on the lane's line, back tool's
//                 left edge at world x 208 = 125 screen px inside the left edge
//                 at k 1.25
//   pile          left column's left edge at world x 790 = flag right + 130,
//                 column pitch 40, row pitch 38, seven rows = 260 px tall.
//                 Row 1's BOTTOM EDGE is the flag's bottom edge (1199), so the
//                 pile grows off the flag's own baseline. Its top edge is world
//                 y 939, 100 px ABOVE the flag's top. Right edge world x 862,
//                 137 screen px inside the right edge.
//   balance       the group runs world x 208..862 and its centre is 535, six
//                 screen px left of the flag's own centre at 540.
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
//   NEWS CARD 1 (`export-control.png`) rises from
//     below the frame and parks in the WORLD under
//     the flag, 320 px square on the flag's own axis
//     with its top edge 30 px below the flag's bottom
//     edge, landing on the same frame the gate closes.
//     It is anchored into the field, so the camera
//     carries it off to the left with the flag        — "export controlled"  f44-58
//     (`card1Src`)
//   the four tools already past the gate carry on
//     into the flag and are out of sight by f64;
//     every tool behind it cruises until it is 30 px
//     short of its slot and then eases the last 30
//     on its own Easing.out(Easing.cubic) over 10
//     frames — the brake is velocity-matched to the
//     lane speed, so nothing in the queue ever
//     changes speed in unison. Slot 0 is down on
//     f66, slot 2 on f72                             — "controlled"         f58-72
//   the ONE camera move: it zooms out AND pans right
//     at once, k 1.6 -> 1.25 and cx 540 -> 1140, both
//     on one warped smoothstep (warp 0.72) keyed
//     f66-104 and both damped by `runCamera`. The
//     camera leaves the gate, the queue and the flag
//     behind and arrives on the empty air the pile is
//     about to fill: at the resolve the flag's right
//     edge is at screen x -60 and the pile is at 102.
//     Inside 0.5% of its target at f109 and 0.02% at
//     f114, before "their new". The first two pile
//     tools launch while it is still running — that is
//     accepted, the camera is going to where they
//     appear. Nothing else happens while it runs      — "how fast China can
//                                                        build"            f66-104
//   NEWS CARD 2 (`own-compute.png`) comes in from
//     beyond the RIGHT edge of the resolved frame and
//     parks in the WORLD beside the pile, 320 px
//     square on the pile's own centre line with its
//     left edge 128 px clear of the pile's right edge,
//     landing on "equipment". Anchored into the field
//     like card 1, and it stays                       — "their new
//     (`card2Src`)                                       equipment"      f112-126
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
//                                                                          f175-224
//                                                    (in shot from f203)
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
//     (The consistency pass re-runs that same rule at k 1.25 and gets four.)
//     The pre-gate lane is untouched: its tools take the slots in order and the
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
//     (x 725, clear of both by 49 px), the tool moves there to its arc height,
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
//
// CONSISTENCY PASS (across the three cuts of this clip). The flag was three
// different sizes at three different heights in the three cuts; it is now one
// mark — 300 x 200 screen px at every resolve, its centre on screen y 830 at
// both of this cut's framings. Four constants moved and nothing else:
//   * K_OPEN 1.3 -> 1.6 and K_FINAL 1.0 -> 1.25, so the mark is 384 screen px
//     at the open (cut 3's open exactly) and 300 at the resolve. The keys
//     (f64-74), the warp (0.72), the damper and the pure-zoom-about-x-540 are
//     all untouched, and so is every beat and every flight in the cut.
//   * the camera's cy is authored off FLAG_MID instead of off the content box.
//   * QUEUE_MARGIN 140 -> 100. The rule did not change — the queue is still
//     every slot that fits with that much air behind it — but the resolve is
//     25% tighter, so the same rule now yields FOUR slots rather than five.
//   * PILE_GAP 100 -> 130, which is what puts the group's centre back on the
//     flag now that the queue is one tool shorter.
// The tighter resolve also brings the pile's right edge from 248 to 137 screen
// px inside the right edge and the queue's back edge from 168 to 125 inside the
// left: the composition is the same shape, held closer.
//
// CLIENT PASS 2 — the two news cards. The client asked for two headline cards
// cut into the piece: `export-control.png` on "export controlled" and
// `own-compute.png` on China's own equipment. Both are 1080 x 1080 opaque
// artwork with their own rounded corners, drawn at 320 world px square with
// Remotion `<Img src={staticFile(...)}>` so the frame waits for the image, and
// both take their path as a prop — `card1Src` and `card2Src`. The only
// treatment is the per-icon shadow `iconShadow(k)`, the same one every other
// icon in the cut carries; no border, no fade, no scale, no bounce.
//
// CLIENT PASS 3, on two notes:
//   * "The news articles should be anchored into the background — right now
//     they don't react to the zoom." They were a screen-space insert layer
//     sitting outside the world's transform. They are now OBJECTS IN THE WORLD,
//     drawn inside the world's transform after the svg — above the tools, the
//     pile, the flag and the gate, below the vignette — so they scale and
//     travel with the camera exactly like the flag does, and their shadow is
//     `iconShadow(k)` rather than a fixed one. Every number about them is world
//     px now, and both are anchored to something in the piece rather than to
//     the glass: card 1 hangs 30 px under the flag's bottom edge on the flag's
//     own axis, card 2 stands on the pile's centre line 128 px clear of its
//     right edge. The screen-space layer is gone.
//   * "Instead of the own-compute card coming from above, the whole scene pans
//     right with a smooth in and out, so only the blocks China produces are
//     visible, and next to that the own-compute article comes in." The pure
//     zoom is now a zoom AND a pan — see the camera block — and card 2 comes
//     in from beyond the right edge of the resolved frame and parks beside the
//     pile, on "equipment" instead of on "China can build". Card 1 still rises
//     from below on "controlled"; because it is in the world now, the pan
//     carries it off to the left with the flag afterwards.
//   Nothing else moved: the lane, the gate on f58, the queue, the launches,
//   #14 seating on f202, the pile and the hold are all exactly as they were.
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
  // The two news cards, 1080 x 1080 headline artwork drawn at 320 world px.
  card1Src: z.string(), // rises from below on "controlled"
  card2Src: z.string(), // comes in from the right on "equipment"
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
  card1Src: "export-control.png",
  card2Src: "own-compute.png",
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
// Consistency pass: the corridor comes 100 -> 130. The tighter resolve (k 1.25)
// makes the whole group narrower on screen, and the group has to sit on the
// flag: the queue is four tools now, so its back edge is 332 world px left of
// the flag's centre, and 130 px of corridor puts the pile's right edge 322 px
// right of it. Balanced on the flag to within 6 screen px.
const PILE_GAP = 130; // the corridor between the flag and the pile
const PILE_COL_PITCH = 40; // 32 px tool + 8
const PILE_ROW_PITCH = 38; // 32 px tool + 6
const PILE_ROWS = 7;
const PILE_X0 = FLAG_RIGHT + PILE_GAP + TOOL_HALF; // 806, the left column's centre
const ROW1_Y = FLAG_BOTTOM - TOOL_HALF; // 1183
const pileX = (col: number) => PILE_X0 + col * PILE_COL_PITCH;
const pileY = (row: number) => ROW1_Y - row * PILE_ROW_PITCH; // row is 0-based
const PILE_TOP = pileY(PILE_ROWS - 1) - TOOL_HALF; // 939, 100 px above the flag

// ---------------------------------------------------------------------------
// The camera. ONE move, on "how fast China can build": it zooms out AND pans
// right at the same time, k 1.6 -> 1.25 and cx 540 -> 1140, and it ends with
// the flag, the gate and the queue off the left edge and the empty air the pile
// is about to fill in the middle of the frame.
//
// CLIENT PASS 3. Pass 2 was a PURE ZOOM about x 540 — no lateral travel at all,
// on the reasoning that the flag carries over from cut 1 and has to hold the
// middle of the frame — and card 2 dropped in from above the frame to say
// "China builds its own". The client asked for the card to arrive beside the
// pile instead, with the scene panning right to it so that "only the blocks
// China produces are visible". That is one gesture rather than two: the move
// away from the gate IS the sentence turning from what the West withholds to
// what China makes, and the card arrives in the space the pan opened.
//
// The travel is not a second gesture. `camMove` writes k and cy as a warped
// smoothstep with a key per frame; CAM_CX below evaluates `camEase` at the same
// warp on the same frames, so cx is the same curve scaled to a different range.
// There is one deceleration lobe in the whole move, no separate pan key, and no
// stall between a zoom and a pan. `runCamera` damps cx exactly as it damps cy —
// the same second-order tracker, run a second time over the cx track — so the
// hand on the camera is one hand.
//
// Keyed f66-104, a 38-frame ramp rather than pass 2's 10: the move is doing
// twice the work now (560 world px of pan on top of the zoom) and a short ramp
// on that distance is a whip. The damper lands inside 0.5% of both targets at
// f109 and inside 0.02% at f114, before "their new" — the residual at f108 is
// 0.7%, which on the flag's 300 px mark is 0.6 screen px. The first two pile
// tools (#1 f91, #2 f114) launch while it is still moving; that is accepted,
// because the camera is travelling to exactly where they appear.
//
// CONSISTENCY PASS: the framing is authored off THE FLAG, not off the content
// box. The flag is the one element that carries through all three cuts of this
// clip, and it was resolving at a different size and a different height in each
// of them — 187 screen px at y 1275 in cut 1, 240 at 885 here, 300 at 759 in
// cut 3. It is now ONE thing: 300 x 200 SCREEN px wherever a cut resolves, and
// in cuts 2 and 3 its CENTRE is held at screen y 830 at the open AND at the
// resolve, so cut 2's last frame and cut 3's first frame are the same mark in
// the same place. That fixes both ends of this cut's camera:
//   * k. 300 screen px of a 240 world px flag is k 1.25, so the resolve moves
//     1.0 -> 1.25; the open keeps the same ratio between the two framings and
//     goes 1.3 -> 1.6, which is also cut 3's open — 384 screen px — so the two
//     cuts open on the mark at the same size.
//   * cy. Held on the flag's own centre line rather than on the content box:
//     cy = FLAG_MID + (960 - 830)/k. `camMove` writes cy as
//     contentCentre + CAM_LIFT/k, so the centre it is handed is
//     FLAG_MID + (960 - 830 - CAM_LIFT)/k — five world px below the flag's
//     centre line, which is what the house's 835 and this pass's 830 differ by.
//     Because that offset is 1/k, it is evaluated at each end of the move and
//     carried between them on the move's own eased curve; the residual against
//     the exact 1/k curve peaks at 0.08 screen px mid-move.
// The content box (the pile's top edge 939 down to the flag's bottom edge 1199)
// is no longer the datum, but it is still the whole of what is on screen: at
// the resolve its centre lands at screen y 767 and the pile's top edge, the
// highest thing in the cut, at 605.
//
// The pan is lateral only, so the flag row stays on screen y 830 at every frame
// of the move, not just at its ends: the mark slides sideways out of the frame
// without ever rising or falling in it.
//
//   f0-65     k 1.6   the flag's centre at screen y 830 and the mark 384 px
//             cx 540  wide, the pile's top at 542 and the flag's bottom at 958,
//                     the lane's tools spaced across the frame, card 1 rising
//                     under the flag.
//   f66-109   -> 1.25 the flag's centre still on screen y 830 the whole way and
//             -> 1140 the mark 300 px wide, but off the left edge: its right
//                     edge resolves at screen x -60. The pile is at screen
//                     x 102..192, y 605..930, and the air to its right — where
//                     card 2 lands — runs from 192 to the right edge.
// ---------------------------------------------------------------------------
const K_OPEN = 1.6;
const K_FINAL = 1.25;
// The lateral half of the same move: the flag's own axis at the open, and the
// pile's side of the world at the resolve.
const CX_OPEN = CENTRE_X; // 540
// 1140, not the 1100 this pass was specified at. The note the pan answers is
// "so only the blocks China produces are visible", and 1100 does not deliver
// it: the frame's left edge lands on world x 668, and card 1 — 320 px centred
// on the flag's axis — reaches to 700, so a 40 SCREEN px strip of the
// export-control artwork stays pinned to the left edge from f106 to the last
// frame. Rendered and looked at: it reads as a mistake, not as an object
// leaving. 1140 puts the frame's left edge on world 708 and takes card 1's
// right edge to screen x -10, so the card goes off with the flag exactly as
// the flag's own right edge does at 1100. It costs 40 screen px of the
// resolved framing: the pile moves from screen x 152..242 to 102..192 and the
// card from 402..802 to 352..752, which puts the card's own centre on 552 —
// within 12 px of the frame's centre — with the pile beside it.
const CX_FINAL = 1140;
const CAM_F0 = 66;
const CAM_F1 = 104;
const CAM_WARP = 0.72;
// The flag's centre, on screen, at every resolved framing in this clip.
const FLAG_SCREEN_Y = 830;
// what `camMove` has to be handed so that FLAG_MID lands on FLAG_SCREEN_Y
const contentFor = (k: number) => FLAG_MID + (FRAME_H / 2 - FLAG_SCREEN_Y - CAM_LIFT) / k;
const CONTENT_OPEN = contentFor(K_OPEN); // 1122.13
const CONTENT_FINAL = contentFor(K_FINAL); // 1123
const CY_OPEN = CONTENT_OPEN + CAM_LIFT / K_OPEN; // 1200.25
const CY_FINAL = CONTENT_FINAL + CAM_LIFT / K_FINAL; // 1223
// The pile's top edge on screen at the resolve: the highest thing in the cut,
// and the check that raising the flag has not pushed it out of the frame.
const PILE_TOP_SCREEN = FRAME_H / 2 + (PILE_TOP - CY_FINAL) * K_FINAL; // 605
if (PILE_TOP_SCREEN < 60) {
  throw new Error(`the pile's top edge is at screen y ${PILE_TOP_SCREEN.toFixed(0)}`);
}
// The left edge of the frame at the resolved ZOOM, held on the flag's own axis.
// This is the datum the queue's length is measured from and it is deliberately
// taken at cx = CENTRE_X, not at the camera's resolved cx: the queue is framed
// against the composition it forms with the flag and the gate, all of which the
// pan carries off the left edge together. Nothing about the queue changed when
// the camera learned to travel.
const WORLD_LEFT_ON_AXIS = CENTRE_X - FRAME_W / (2 * K_FINAL);
// what the resolved camera can actually see, once the pan has landed
const WORLD_RIGHT_FINAL = CX_FINAL + FRAME_W / (2 * K_FINAL); // 1532

// ---------------------------------------------------------------------------
// The two news cards (client pass 3). Every number here is WORLD px: the cards
// are anchored INTO the field now, so the camera scales and travels them the
// way it scales and travels the flag. Each one is anchored to something in the
// piece rather than to the glass — card 1 to the flag it is about, card 2 to
// the pile it is about — and each comes in from beyond the edge of the frame
// its own camera is showing at the time.
// ---------------------------------------------------------------------------
const CARD = 320; // world px; the artwork is 1080 square
const CARD_SLIDE = 14; // frames of Easing.out(Easing.cubic), the same for both

// Card 1 hangs under the flag on the flag's own axis, 30 px below its bottom
// edge, so it reads as a caption on the thing the sentence is about.
const CARD1_GAP = 30;
const CARD1_X = CENTRE_X - CARD / 2; // 380..700
const CARD1_TOP = FLAG_BOTTOM + CARD1_GAP; // 1229..1549
// It rises from below the frame at the OPENING camera, so its top edge starts
// on the world y that the bottom of the frame is looking at while k is 1.6.
const CARD1_FROM = CY_OPEN + FRAME_H / (2 * K_OPEN); // 1800.25

// Card 2 stands beside the pile on the pile's own centre line, in the air the
// pan opens up to the right of it.
const PILE_MID = (PILE_TOP + FLAG_BOTTOM) / 2; // 1069
const CARD2_X = 990; // 990..1310
const CARD2_TOP = PILE_MID - CARD / 2; // 909..1229
// It comes in from beyond the RIGHT edge of the RESOLVED frame, which is where
// the camera is by the time it moves.
const CARD2_FROM = 1600; // beyond the resolved frame's right edge at 1572
// The corridor between the pile and the card. Asserted rather than trusted: if
// the pile ever grows a column this fails at import time instead of quietly
// touching the card.
const CARD2_GAP = CARD2_X - (pileX(1) + TOOL_HALF); // 990 - 862 = 128
if (CARD2_GAP < 40) {
  throw new Error(`card 2 clears the pile's right edge by only ${CARD2_GAP.toFixed(0)} world px`);
}
if (CARD2_FROM < WORLD_RIGHT_FINAL) {
  throw new Error(`card 2 starts inside the resolved frame (${WORLD_RIGHT_FINAL.toFixed(0)})`);
}

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
// that fits in front of that. Director's balance pass: the margin was 140 so
// the queue was FIVE — the group (queue, gate, flag, pile) then sat within
// ~35 px of the frame's centre, where six put it 105 px left of it.
//
// Consistency pass: the resolve is k 1.25 now, not 1.0, so the same margin in
// SCREEN px buys fewer slots — the rule is unchanged, the framing under it
// moved. At 1.25 the frame's left edge is world x 108, and a 100 px margin
// leaves room for four slots (the fifth would stand its back edge 47 screen px
// inside the edge, which is not air, it is a tool falling off the frame). So
// the queue is FOUR, its back edge at world 208 = screen 125, and the group is
// balanced on the flag by the pile's corridor instead — see PILE_GAP. 100 is
// the middle of the band that gives four: anything from 75 to just under 125.
const QUEUE_MARGIN = 100; // screen px
const QUEUE_MAX =
  Math.floor(
    (QUEUE_X0 - TOOL_HALF - WORLD_LEFT_ON_AXIS - QUEUE_MARGIN / K_FINAL) / QUEUE_PITCH,
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
// The middle of the corridor: a tool standing here is 49 px clear of the flag
// and 49 px clear of the pile (34 before the corridor came to 130).
const LIFT_X = FLAG_RIGHT + PILE_GAP / 2; // 725
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
  c0: CONTENT_OPEN,
  c1: CONTENT_FINAL,
  warp: CAM_WARP,
});
const CAM_FF = [0, ...CAM.F, DURATION];
const CAM_K = [K_OPEN, ...CAM.K, K_FINAL];
const CAM_CY = [CY_OPEN, ...CAM.CY, CY_FINAL];
// the sideways half of the same move, on the same eased curve at the same warp,
// evaluated on the same frames — so cx is k's curve scaled to another range
const CAM_CX = [
  CX_OPEN,
  ...CAM.F.map((_, i) => CX_OPEN + (CX_FINAL - CX_OPEN) * camEase(i / (CAM_F1 - CAM_F0), CAM_WARP)),
  CX_FINAL,
];

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
  card1Src,
  card2Src,
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
  // the same damper, run a second time over the cx track, so the lateral half
  // of the move has exactly the weight the zoom does
  const camX = runCamera(frame, CAM_FF, CAM_CX, CAM_K).cy;
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = camX + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);

  // Everything in this cut is an icon lying on the field, so everything takes
  // the small per-icon shadow, in screen px, at every zoom — the two news cards
  // included, now that they are objects in the world rather than inserts.
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);

  // -- the two news cards ----------------------------------------------------
  // Both slides are read off the beats, not off literal frames, so a retime
  // moves them with the words: card 1 lands the frame the gate closes, card 2
  // lands on "equipment". Card 1 travels in y (up from below the frame), card 2
  // in x (left from beyond the right edge); each is 14 frames of easeOut.
  const card1Top =
    CARD1_FROM +
    (CARD1_TOP - CARD1_FROM) *
      easeOut(clamp01((frame - beats.toGetExport) / (beats.controlled - beats.toGetExport)));
  const card2Left =
    CARD2_FROM +
    (CARD2_X - CARD2_FROM) *
      easeOut(clamp01((frame - (beats.equipmentThat - CARD_SLIDE)) / CARD_SLIDE));

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
        cxRest={CAM_CX[0]}
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

          {/* The two news cards, INSIDE the world's transform (client pass 3):
              they scale and travel with the camera like every other icon, and
              they take the same per-icon shadow. Drawn after the svg, so they
              are above the tools, the pile, the flag and the gate — and below
              the vignette, which is still last in the tree. The world div does
              not clip, so a card is free to sit outside it while it is off
              frame. */}
          <Img
            src={staticFile(card1Src)}
            style={{
              position: "absolute",
              left: CARD1_X,
              top: card1Top,
              width: CARD,
              height: CARD,
              filter: icon,
            }}
          />
          <Img
            src={staticFile(card2Src)}
            style={{
              position: "absolute",
              left: card2Left,
              top: CARD2_TOP,
              width: CARD,
              height: CARD,
              filter: icon,
            }}
          />
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default ExportControlled;
