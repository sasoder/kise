import { AbsoluteFill, useCurrentFrame } from "remotion";
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
  OP_RECEDE,
  OP_UNREAD_DOT,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  TONE_STEPS,
  Vignette,
  breath,
  camEase,
  camMove,
  hash,
  iconShadow,
  makeTone,
  runCamera,
  sway,
  worldTransform,
} from "./fieldShared";
// The shared line values of this set. Imported, never restated.
import { STROKE, TONE_DUR, clamp01 } from "./ImpossibleTasks";
import {
  EASE_ARRIVE,
  EASE_PAYOFF,
  ExperimentsSchema,
  LEGATO,
  Streak,
  Trail,
  ease,
  highlightTone,
} from "./levelUp";
// THE WORLD IS CUT 3'S. Every seat, board, mark, schedule and helper below comes
// from `SecondMessageBoard`; nothing it defines is restated here. Its frame
// functions are called with `frame + F0`, so this piece's f0 IS its f385.
import {
  BIG,
  BIG_POSTS_FLAT,
  BIG_POSTS_LEGATO,
  BOARD_BOTTOM,
  Board,
  type BoardDef,
  CAM as CAM3,
  CLICK_DUR,
  CONTENT_FINAL,
  CROWD_BAND_Y,
  CROWD_BOT,
  CROWD_TOP,
  CX_FINAL,
  DURATION as DURATION3,
  FACEBOOK,
  GROW_DUR,
  K_FINAL,
  MARK_GAP,
  MYSPACE,
  type MarkDef,
  MarkGlyph,
  NSEAT,
  POST_SPEED,
  type Post,
  type PostDraw,
  ROWS0_BIG,
  ROWS0_SMALL,
  SEATS,
  SMALL,
  SMALL_POSTS,
  THREAD_FADE,
  THREAD_LIFT,
  THREAD_SPEED,
  VIEW_H,
  VIEW_W,
  VIEW_X,
  VIEW_Y,
  bigRowsAt,
  blockCentre,
  blockK,
  idleTraffic,
  markInkBottom,
  markInkTop,
  panelH,
  panelPath,
  panelTop,
  panelX0,
  postLen,
  rowsAt,
  seatNear,
  smallRows,
} from "./SecondMessageBoard";

export const FPS = 24;
// The frame of cut 3 that this piece's frame 0 is. Cut 3 runs 386 frames, so its
// last frame is 385: every schedule, seat, board and mark below is read at
// `frame + F0`, and f0 is cut 3's resolved frame, pixel for pixel.
export const F0 = DURATION3 - 1;

// Dwarkesh clip `Ajeya_The_Investigation`. Ajeya Cotra on the OpenAI / Hugging
// Face sandbox attack, cut 4 of four:
//
//   "And then once the agents had gotten onto the internet, they were
//    communicating on the open internet in various ways, including
//    communicating on Hugging Face datasets."
//
// SRT span 1:04.920 -> 1:12.120 at 24fps.
// DURATION = round((72.120 - 64.920) * 24) = round(7.2 * 24) = round(172.8) =
// 173 frames of speech, plus a 48 frame tail so the resolved state holds and the
// editor can cut out of it wherever it wants = 221.
export const DURATION = 221;
const FRAME_PAD = 8; // a few frames past the end, for trail lookups and tables

// ---------------------------------------------------------------------------
// "The open internet". Orange Dwarkesh style, and cut 3's world continued: the
// same crowd band, the same two boards still posting, the same two marks, the
// same camera hand, one frame later. Nothing in this file redraws any of that —
// it imports the pieces and the renderer.
//
// THE NEW MATERIAL is one line and a SKY OF FOURTEEN BOARDS above it.
//   THE HORIZON is a single ink line at world y H_Y spanning x +-HORIZON_X. It
//   is the edge above which there is no board of theirs: H_Y sits HORIZON_GAP
//   world px above the Facebook mark's ink top, and that mark is still rising
//   because the big board is still posting, so the gap is measured at the frame
//   it has to hold — the last one.
//   THE SKY. v3: FOURTEEN open boards, not v2's four. Four boards standing in a
//   line on the horizon left 39% of every frame through the speech as bare
//   grid, measured, and the open internet is not four places — "in various
//   ways" is many. They stand in THREE STAGGERED ROWS, bottoms at H_Y -
//   MARK_GAP, - 520 and - 980, four on the horizon and five in each row above
//   it, on a per-row lattice with a per-row phase, a hashed jitter and hashed
//   widths, relaxed until no two edges in a row are within SKY_GAP and every
//   board's ink is inside +-SKY_X, and then MOVED until a climb can actually
//   reach it (see the sky section). They are cut 3's `Board` unit, each under
//   its own translate. v2's rule stands: A BOARD IS ESTABLISHED BY ITS FIRST
//   ARRIVAL — the outline draws head-led over the frames that climb is making
//   its last approach, and closes and clicks on the word, as the head touches
//   it. "Various ways is proportion" is now in the widths and the tempos: every
//   board is a different width and gains rows on its own hashed tempo.
//   THEIR THREADS ARE LONG CLIMBS, DRAWN AS PACKETS. An agent out in the crowd
//   goes deep -> ripe over TONE_DUR and sends a signal to a board above the
//   horizon: 2,700-3,800 world px, thirty to forty-five frames, running at
//   OPEN_SPEED and capped so the head never crosses the screen faster than
//   OPEN_SCREEN_CAP px a frame at any zoom the camera reaches. v2: what is
//   DRAWN is the head and at most CLIMB_TAIL world px of accent behind it,
//   faded along its length — the set's packet language — never the whole wire
//   from the band to the board. v3: no two launches may fall within LAUNCH_GAP
//   FOUR frames of each other (v2: eight), which is thirty-eight climbs across
//   the cut and never fewer than one packet in the air. The agent sits OUT in
//   the field rather than under the board, because a vertical climb would run
//   through the big board, the small one, or one of the thirteen other open
//   boards; the lean, the arrival point on the board's own bottom edge and the
//   agent's depth in the band are all SEARCHED against those boxes.
//   Everything after the arrival — the row growing on EASE_ARRIVE, the post
//   line drawing head-led at POST_SPEED with a white tip and a click, the agent
//   easing back to deep — is cut 3's mechanism, unchanged, because it is
//   literally cut 3's component. The packet's own tail travelling into the
//   board is what retires it, where cut 3 fades a thread out.
//
// Every gesture is one word. Nothing else happens.
//   CAMERA M0: cut 3's resolved camera, k K_FINAL, both
//     boards and the band. The big board is still gaining
//     a row per 16 frames and the Facebook mark still
//     rides up with it
//                              — (cut 3's last frame)                   f0
//   CAMERA M1: a TILT UP at cut 3's lens — k K_FINAL ->
//     K_M1 (0.533 -> 0.497, the same scale), cx CX_FINAL
//     -> 0, content 1,973 world px UP to CONTENT_M1 so the
//     horizon lands on screen y HORIZON_SCREEN_Y, warp
//     0.70, keys f9-33, landed f40, nine frames before
//     "they" f49. Their tower's upper body and its mark
//     end in the lower part of the frame with the tower
//     running off the bottom, and the crowd band out of
//     frame below it: the tower is the past
//                              — "once the agents had gotten onto"      f9-35
//   THE HORIZON DRAWS from x 0 outward both ways at one
//     speed, two heads, each with a `Streak`, and the
//     whole line clicks to ink 1.0 for CLICK_DUR frames
//     as it completes
//                              — "internet"                             f35-49
//   FOURTEEN OPEN BOARDS ARE ESTABLISHED BY THEIR FIRST
//     ARRIVAL, one or more per word — f65 x1, f80 x2,
//     f85 x2, f98 x3, f104 x3, f113 x2, f119 x1: a climb
//     is already in the frame LEGATO frames before its
//     board's outline starts drawing, the squircle draws
//     head-led at its own OUTLINE_SPEED with a white tip
//     as the head makes its last approach, and it closes
//     and clicks on the word with the head on its bottom
//     edge. Each then takes rows on its own hashed tempo,
//     as the launch cap allows. WHICH board takes which
//     word is solved outward from the Hugging Face board:
//     the farthest first, its three nearest neighbours
//     last, so the boards that appear while M2 is already
//     pushing in appear beside the board it pushes on
//                              — "on / open / internet / various /
//                                 ways / including / communicating"    f65-119
//   CAMERA M2: PUSH IN on the Hugging Face board — the
//     MIDDLE row, near the brief's x 260 — k K_M1 ->
//     K_M2, cx 0 -> its centre, warp 0.72, keys f113-124,
//     landed before "hugging" f138. Its neighbours are in
//     shot on every side: the row below, the row above,
//     and the two beside it. One among many
//                              — "including communicating on"           f113-138
//   HUGGING FACE: the mark drops MARK_DROP world px onto
//     its rest position MARK_GAP above that board's top on
//     EASE_PAYOFF — the cut's ONE overshoot — over
//     MARK_DUR frames with a Trail, seated on "face"
//                              — "Hugging Face"                         f133-147
//   THREE ROWS LAND on that board in quick succession,
//     their climbs solved backwards so the rows land on
//     the words. The first gets `highlightTone` on its
//     agent: the cut's ONE highlight
//                              — "datasets"                             f155-165
//   CAMERA M3: PULL BACK to K_END, cx -> 0, framing the
//     whole world — the sky of fourteen with the Hugging
//     Face mark in it, the horizon, their two boards with
//     their two marks, the crowd — inside screen y 220-1450,
//     warp 0.72, keys f173-205. Traffic continues on
//     every board. It never fades out
//                              — tail                                   f173-221
//
// ambient: cut 3's idle thread traffic, unchanged and continuous across the cut
// (`idleTraffic(frame + F0, 480)` — the same periods, the same hashed seats, the
// same head-led draw); cut 3's big board still posting on its own schedule;
// `breath` on every dot, `sway` on the camera, the grid's own drift. Not
// gestures; that is what this field is.
//
// EXPERIMENTS IN THIS PIECE (levelUp.tsx), each behind `experiments`:
//   EASE_ARRIVE   every arrival: the row growth, the post draw's click window,
//                 every tone ramp, the camera's own eased keys.
//   EASE_PAYOFF   exactly one landing: the Hugging Face mark, f133-147.
//   LEGATO        each open board's establishing climb is in the frame LEGATO
//                 frames before its outline starts drawing, so the packet and
//                 the board it lands on are one phrase rather than
//                 stop-then-start; cut 3's big-board posts keep their own
//                 legato solve.
//   Trail         on every climbing packet head and on the dropping mark.
//   Streak        on the two horizon heads and on every post line's head — the
//                 straight ones. The outline head turns corners, so it carries
//                 a `Trail`, whose marks sit on the path.
//   highlight     one landing, f155: the packet that brings it, for
//                 HIGHLIGHT_FRAMES frames. The brief puts it on that packet's
//                 AGENT; at M2's k the agent is 2,900 screen px below the frame,
//                 so the half-step tone rides the part of it that is in shot.
//   softFront     DECLARED AND UNUSED, as in cut 3: this cut's tone events are
//                 individual posting agents, one at a time, so a crowd-scale
//                 wave would be a gesture with no word in the line.
//   depth         DECLARED AND UNUSED — cut 1 only, per the brief.
//
// MEASURED, not asserted (`$S/oi/diag2.ts`): see the DONE file.
//
// DEVIATIONS FROM THE BRIEF, and why:
//   * H_Y. The brief solves it off the big board at f35 and expects ~-1650.
//     That number does not hold for the length of the cut: the big board keeps
//     posting on cut 3's tail tempo, a row per 16 frames, so its panel climbs
//     552 world px during these 221 frames and the Facebook mark climbs with
//     it — ink top -1379.8 at f0, -1926.6 at f221. A horizon at -1635 is
//     crossed by that mark at f95 and by the panel's top corners at f175, which
//     is the one thing the line must never allow. The RULE is the brief's and
//     the FRAME it is evaluated at is the last one, so H_Y = -2096.6: their
//     board visibly grows toward the open internet all cut and never reaches
//     it.
//   * K_M1 IS 0.4770, NOT cut 3's 0.5333. The brief asks for "k ~ 0.50 at the
//     horizon-at-835 framing" and for every board inside x +-SKY_X 1000. Those
//     two together ARE the number: 1000 world px of half-width lands on the
//     set's 60 px margin with `sway`'s 3 px to spare at k 0.4770. It is cut 3's
//     lens less 11%, and the bottom two rows sit inside the margin all through
//     the speech (measured: outermost ink on screen 62.1 and 1016.1 at f104).
//   * THE THREE ROWS ARE 4 / 5 / 5, and their widths narrow as they go up:
//     260-420 on the horizon, 200-260 and 200-250 above it. The brief's
//     "widths hashed 200-460" cannot be taken literally for five boards in a
//     row: five of a mean 330 plus the gaps they need fill +-1000 exactly, and
//     a row with no slack has only one packing, so its jitter dies, the rows
//     resolve into vertical columns, and — the real cost — a board ends up
//     standing over another with no climb able to reach it. The widths are the
//     largest that leave each row 250-400 px of slack to be staggered with.
//   * THE BOTTOM ROW IS HELD OUT OF A BAND AROUND x 0, and every board above it
//     is MOVED until a climb can reach it. Both are measured, not styled: see
//     the sky section. The consequence the brief would notice is that the
//     Hugging Face board is at x 314, not 260 — it is the middle-row board
//     nearest the brief's x, after the reachability solve has moved it.
//   * HORIZON_X 1230 and OUTLINE_SPEED 88, where v1 had 1400 and 100. Playing
//     the same gestures at this lens rather than v1's 0.38 makes every head
//     1.31x faster on screen, and 100 world px a frame is 49.7 — over the 45
//     cap. Both are the largest values that keep their heads inside it while
//     the horizon still draws in its briefed 14 frames.
//   * THE CLIMBS LEAN, and TWO OF THIRTY-EIGHT still clip a panel. The lean,
//     the arrival point and the agent's depth are all searched against every
//     box — cut 3's two boards, its two marks, and every open board at or below
//     the target — and 36 of the 38 come out clean. The two that do not are the
//     two climbs to o11, which clip o1's panel for 142 world px each (67 screen
//     px at K_M1, about three frames of a packet). o11 is the one board in the
//     sky the layout could not move any further: its row is packed against both
//     frame edges. Reported rather than hidden.
//   * "ONE OR MORE PER WORD" MEANS THE LAUNCH CAP HAS MORE EXEMPTIONS THAN v2.
//     The brief establishes up to three boards on one word, and an arrival IS a
//     launch, so the establishing climbs of a shared word leave within 0.5-4
//     frames of each other. Those are one gesture, exactly as the three
//     "datasets" launches are. Every launch that is not an establishing arrival
//     is LAUNCH_GAP 4 frames or more from every other.
//   * THE THREE "DATASETS" CLIMBS launch at f109-114, not the brief's
//     f149/154/159: a 2,900 px climb is thirty-odd frames, not six. The
//     LANDINGS are the brief's — f155, f160, f165, on the words — and the
//     launches are solved backwards from them through the same travel table
//     every other climb uses, which is how cut 3 solves its own posts.
//   * THE LAUNCH CAP HAS TWO EXEMPTIONS, both spoken. "Various" f98 and "ways"
//     f104 are six frames apart in the line and each establishes its own board
//     by its own arrival, so those two climbs leave 4.1 frames apart; and the
//     three "datasets" launches are one gesture, 2.0 and 3.6 frames apart.
//     Every other pair of launches in the cut is LAUNCH_GAP or more apart.
//   * THE ONE HIGHLIGHT rides the packet rather than its agent — see the
//     experiments list above. The crowd is off the bottom of the frame at M2's
//     k, so on the agent it would have been a payoff nobody sees.
//   * An open board's outline draws at ONE SPEED (OUTLINE_SPEED) rather than in
//     a flat 8 frames, so a 365 px board takes 9.2 frames and a 200 px one 6.4.
//     A flat 8 frames makes fourteen boards of fourteen sizes draw in the same
//     time, and puts the widest board's head over the cap. v3: the three boards
//     whose outlines draw while M2 is already pushing in draw SLOWER still —
//     one of them, o9 on f119, at 73.8 world px a frame — because 88 is 50
//     screen px a frame at the k of those frames. Every head-led draw in the
//     piece is inside 45.
//   * THE TOP OF THE FRAME IS STILL NOT FULL, and cannot be. At f104 the
//     highest ink is on screen 289, so 15.1% of the frame is bare grid above
//     it (v2: 38.7%). The three rows are where the brief puts them — H_Y - 60,
//     - 520, - 980 — and the top row's panels are 80-240 world px tall, so at
//     K_M1 the sky ends on screen 289 and there is nothing the layout can do
//     about the 289 px over it without moving the rows.
//   * MARK_DROP STAYS 160, NOT cut 3's 260, even though at this framing the
//     mark's ink top would now start inside the frame (screen 599 rather than
//     v1's off-frame): the drop lands at K_M2 0.80, where 260 world px peaks at
//     60.6 SCREEN px a frame against the set's 45. 160 peaks at 37.3. It is cut
//     3's fall seen through this lens.
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
  experiments: ExperimentsSchema,
  beats: z.object({
    then: z.number(), // "then"
    once: z.number(), // "once"                 — M1 pulls back and up
    agents: z.number(), // "agents"
    gotten: z.number(), // "gotten"
    onto: z.number(), // "onto"
    internet: z.number(), // "internet"         — the horizon draws
    they: z.number(), // "they"                 — M1 landed, the horizon clicks
    communicating: z.number(), // "communicating"
    on: z.number(), // "on"                     — the first open board
    open: z.number(), // "open"                 — the second
    internet2: z.number(), // "internet"
    various: z.number(), // "various"           — the third
    ways: z.number(), // "ways"                 — the fourth
    including: z.number(), // "including"       — M2 pushes in
    communicating2: z.number(), // "communicating"
    hugging: z.number(), // "hugging"           — M2 has landed
    face: z.number(), // "face"                 — the Hugging Face mark is seated
    data: z.number(), // "data"                 — the first of three rows lands
    sets: z.number(), // "sets"                 — the third
    end: z.number(), // speech ends; tail to 221
  }),
});

export type Props = z.infer<typeof schema>;

// ---------------------------------------------------------------------------
// THE HORIZON. One ink line, and everything above it is somebody else's.
// ---------------------------------------------------------------------------
// 170, not the brief's 300: the gap is the one piece of empty grid the frame
// cannot avoid — their board's mark under the line, nothing between — and at
// the resolved k 300 world px of it is a quarter of the frame with nothing in
// it. 170 still reads as two mark-heights of clear air at the LAST frame, and
// it is 717 px at f0 and closes all cut as their board grows toward the line.
export const HORIZON_GAP = 170;
// v2: 1230, not v1's 1400 and not the brief's 1500. The line still has to draw
// in its 14 briefed frames, from "internet" f35 to the click on "they" f49, and
// v2 plays that draw at cut 3's scale rather than v1's wide: at K_M1 a half span
// of 1400 is 100 world px a frame, which is 49.7 SCREEN px a frame, over the
// set's 45 cap. 1230 is 87.9 world px a frame and 43.7 on screen. It still runs
// off both edges of the frame all through the speech (the frame is 2,174 world
// px wide at K_M1 and the line is 2,460), and at K_END its ends land inside the
// frame, outside the outermost open board — the shelf they stand on, with its
// ends in shot.
export const HORIZON_X = 1230; // the line's half span
export const BIG_ROWS_END = bigRowsAt(F0 + DURATION);
export const H_Y = markInkTop(FACEBOOK, panelTop(BIG_ROWS_END)) - HORIZON_GAP;

// It draws from x 0 outward both ways at ONE speed — the rule every line in
// this set is drawn by — and that speed is the full half span in 14 frames.
// Both heads carry a `Streak`; the whole line clicks on completion.
export const HORIZON_F0 = 35; // "internet"
export const HORIZON_DUR = 14;
export const HORIZON_SPEED = HORIZON_X / HORIZON_DUR; // = OUTLINE_SPEED, 100
export const HORIZON_CLICK = HORIZON_F0 + HORIZON_DUR; // f49, "they"

export const OBSTACLE_PAD = 34; // on cut 3's boards, as obstacles
export const OPEN_PAD = 10; // on an open board, as an obstacle
// The clear corridor either side of the big board, and the band the bottom row
// is held out of.
export const CORRIDOR_X = BIG.w / 2 + OBSTACLE_PAD + 6;
export const SKY_KEEPOUT = CORRIDOR_X + 40;

// what a climb must not cross, as boxes, each at its largest: the two panels at
// the size they end the cut at, and the two marks, which are narrow and sit
// high — keeping them separate rather than wrapping the lot in one box is worth
// 150 world px of headroom over the big board, which is exactly where the
// climbs to the middle of the sky have to cross.
export type Box = { x0: number; x1: number; y0: number; y1: number };
export const OBSTACLES: Box[] = [
  {
    x0: BIG.cx - BIG.w / 2 - OBSTACLE_PAD,
    x1: BIG.cx + BIG.w / 2 + OBSTACLE_PAD,
    y0: panelTop(BIG_ROWS_END) - OBSTACLE_PAD,
    y1: BOARD_BOTTOM + OBSTACLE_PAD,
  },
  {
    x0: BIG.cx - FACEBOOK.size / 2 - OBSTACLE_PAD,
    x1: BIG.cx + FACEBOOK.size / 2 + OBSTACLE_PAD,
    y0: markInkTop(FACEBOOK, panelTop(BIG_ROWS_END)) - OBSTACLE_PAD,
    y1: panelTop(BIG_ROWS_END),
  },
  {
    x0: SMALL.cx - SMALL.w / 2 - OBSTACLE_PAD,
    x1: SMALL.cx + SMALL.w / 2 + OBSTACLE_PAD,
    y0: panelTop(ROWS0_SMALL + 6) - OBSTACLE_PAD,
    y1: BOARD_BOTTOM + OBSTACLE_PAD,
  },
  {
    x0: SMALL.cx - MYSPACE.size / 2 - OBSTACLE_PAD,
    x1: SMALL.cx + MYSPACE.size / 2 + OBSTACLE_PAD,
    y0: markInkTop(MYSPACE, panelTop(ROWS0_SMALL + 6)) - OBSTACLE_PAD,
    y1: panelTop(ROWS0_SMALL + 6),
  },
];

// Does the segment (ax, ay) -> (bx, by) touch a box? Liang-Barsky, exact.
// Sampling it was tried and is not good enough here: a climb can clip a corner
// of the small board for 36 world px of a 2,900 px line, which a 32-sample walk
// steps straight over and the eye does not.
export const CROSSED = { len: 0 }; // the world px of the last countHits inside a box
export const countHits = (ax: number, ay: number, bx: number, by: number, boxes: Box[]) => {
  const dx = bx - ax;
  const dy = by - ay;
  const seg = Math.hypot(dx, dy);
  let hits = 0;
  CROSSED.len = 0;
  for (let o = 0; o < boxes.length; o++) {
    const b = boxes[o];
    let t0 = 0;
    let t1 = 1;
    let clipped = true;
    const edges = [
      [-dx, ax - b.x0],
      [dx, b.x1 - ax],
      [-dy, ay - b.y0],
      [dy, b.y1 - ay],
    ];
    for (let e = 0; e < 4 && clipped; e++) {
      const p = edges[e][0];
      const q = edges[e][1];
      if (p === 0) {
        if (q < 0) clipped = false;
      } else {
        const r = q / p;
        if (p < 0) {
          if (r > t1) clipped = false;
          else if (r > t0) t0 = r;
        } else {
          if (r < t0) clipped = false;
          else if (r < t1) t1 = r;
        }
      }
    }
    if (clipped && t1 > t0) {
      hits++;
      CROSSED.len += (t1 - t0) * seg;
    }
  }
  return hits;
};
export const hitsObstacle = (ax: number, ay: number, bx: number, by: number, boxes = OBSTACLES) =>
  countHits(ax, ay, bx, by, boxes) > 0;

// ---------------------------------------------------------------------------
// THE SKY OF BOARDS. v3: FOURTEEN, not four. Four boards standing in a line on
// the horizon left the top third of every frame as bare grid, and the open
// internet is not four places — "in various ways" is many. They sit in THREE
// STAGGERED ROWS above the line, bottoms at H_Y - MARK_GAP, - 520 and - 980,
// each row laid on its own loose lattice: a per-row phase, a jitter of
// SKY_JITTER of that row's pitch, widths hashed SKY_W_MIN..SKY_W_MAX, then
// relaxed until no two edges in a row are within SKY_GAP world px and every
// board's ink is inside +-SKY_X. Every one of them is cut 3's `Board` unit
// under its own translate; nothing about the panel, the post lines, the
// head-led draw or the click is re-implemented here.
//
// A BOARD IS STILL ESTABLISHED BY ITS FIRST ARRIVAL (v2's rule). `est` is the
// WORD, and it is the frame the first climb's head reaches the board's bottom
// edge AND the frame the outline closes and clicks: the squircle draws head-led
// at OUTLINE_SPEED over the frames that head is making its last approach, so
// the place a packet lands is where a board appears. The schedule is the
// brief's — f65 x1, f80 x2, f85 x2, f98 x3, f104 x3, f113 x2, f119 x1 — and
// WHICH board takes which word is solved outward from the Hugging Face board:
// the farthest board in the sky is established first and its three NEAREST
// neighbours last, on f113 and f119, so the boards that appear while M2 is
// already pushing in appear beside the board it is pushing on. "One among
// many" is the shot, so the last ones have to land inside it.
//
// ROW 0 HAS A KEEP-OUT AROUND x 0. A climb that arrives on the bottom row
// inside the big board's own x span cannot be drawn without crossing it: that
// arrival is 86% of the way along the climb, so the agent would have to sit at
// world x +-2,150 and the field ends at 1,700. The bottom row's boards are
// therefore held out of that band. The two rows above it are far enough up
// that a leaning climb clears the tower (0.26 and 0.35 of the seat's x survives
// to the tower's top edge, against row 0's 0.14), and they are not held out.
// ---------------------------------------------------------------------------
export const OPEN_BOTTOM = H_Y - MARK_GAP; // row 0's bottom edge
export const OPEN_DY = OPEN_BOTTOM - BOARD_BOTTOM; // row 0's translate
export const SKY_ROW_GAP = 460; // world px between one row's bottom and the next
// FOUR on the horizon and FIVE in each row above it. The bottom row is the one
// with the big board under it, so it carries the keep-out and has to be sparse;
// the two rows above are five. Left to a plain lattice two rows of five pack to
// the same rhythm and resolve into vertical COLUMNS, which is the grid the
// style forbids, and worse: a board standing directly over another cannot be
// climbed to at all (see the shadow rule below). So the stagger is enforced by
// the relaxation rather than left to the jitter.
export const SKY_ROW_N = [4, 5, 5]; // boards per row, from the horizon up
// The rows' lattices are offset from each other, and the middle row's phase
// puts one of its boards on the brief's own x 260 — that is the one the Hugging
// Face mark lands on. The stagger is then enforced rather than hoped for: see
// the shadow rule in the relaxation below.
export const SKY_PHASE = [0, -140, -100];
export const SKY_X = 1000; // every board's ink inside +-SKY_X
export const SKY_JITTER = 0.22; // +- this much of the row's own pitch
// PER ROW, and the range narrows as the row goes up. Two reasons, one of them
// arithmetic: five boards of ~300 px with 100 px gaps fill +-1000 exactly, and
// a row with no slack has only one packing, so its jitter dies and the shadow
// rule below has nothing to move. Narrower boards higher up leave each row
// 250-400 px of slack to be staggered with. The other is that it reads as
// depth: fewer and wider on the horizon, more and smaller far up.
export const SKY_W = [
  [260, 420],
  [200, 280],
  [200, 260],
];
export const SKY_W_MIN = 200;
export const SKY_GAP = 150; // the least any two edges in a row may be apart
export const SKY_SLACK = 120; // world px of a row left free, so the jitter has room
export const OPEN_LEAN_MIN = 260; // the lean a climb WANTS, before clearance
export const OPEN_LEAN_SPREAD = 220;
export const OPEN_LEAN_FLOOR = 90; // ...and the least it may end up with
export const OPEN_LEAN_PUSH = 50; // per clearance retry
export const OPEN_LEAN_TRIES = 46;
export const OPEN_LEAN_MAX = 1680; // the field runs to 1700
export const ARRIVE_TRIES = 7; // arrival points tried per lean, hashed one first
// THE SEARCH GOES BOTH WAYS from the lean it wants. v3's first pass only ever
// pushed the lean OUT, and measured, that is why climbs crossed panels: the
// clean path through a chimney is often STEEPER than the hashed lean, not
// flatter, and a search that only widens never sees it. The order is still by
// distance from the wanted lean, so what comes back is the nearest lean to the
// one this climb asked for that clears everything.
export const LEANS: number[] = (() => {
  const out = [0];
  for (let m = 1; m <= OPEN_LEAN_TRIES; m++) {
    out.push(m * OPEN_LEAN_PUSH);
    out.push(-m * OPEN_LEAN_PUSH);
  }
  return out;
})();
// Three depths in the band as well. A shallower agent is a steeper climb for
// the same lean, which is the only way through when the board above is nearly
// over the board below.
export const DEPTH_TRIES = [0.5, 0.12, 0.88, 0.3, 0.7];

// The sweep that decides whether a board stands where a climb can reach it.
// Coarser than the climb solver's own search, and a superset of it in lean, so
// a position that passes here is one the solver can solve.
export const REACH_ARRIVALS = 7;
export const REACH_LEAN_STEP = 40;
export const REACH_MIN = 20; // clean climbs a board's position must have
export const REACH_STEP = 10; // world px per try when a board has to be moved
export const REACH_SEARCH = 700; // ...and the farthest it may be moved
export const SKY_BOX_ROWS = 6; // the tallest an open board is ever treated as
export const skyBottom = (row: number) => OPEN_BOTTOM - row * SKY_ROW_GAP;
// v2: 88, not v1's 100. An outline head runs at OUTLINE_SPEED, and v2 plays the
// establishing at cut 3's scale: 100 world px a frame is 49.7 SCREEN px a frame
// at K_M1, over the set's 45 cap. 88 is 43.7. It puts the four draws at 6.8,
// 10.4, 7.7 and 9.1 frames, which brackets the brief's 8 and keeps the rule
// that a wider board visibly takes longer.
export const OUTLINE_SPEED = 88; // world px a frame, head-led

export type OpenDef = BoardDef & {
  row: number; // 0 = standing on the horizon, 2 = the top of the sky
  bottom: number; // its own bottom edge, world y
  dy: number; // its translate off cut 3's board unit
  est: number; // THE WORD: its outline closes and its first climb lands here
  speed: number; // the world px a frame its outline draws at
  estDur: number; // frames that draw takes, at that speed
  estStart: number; // est - estDur, the frame the outline starts drawing
  tempo: number; // frames between its landings after that
  target: number; // the rows it asks for across the cut, before the launch cap
  landings: number[]; // filled by the schedule solve below
  posts: PostDraw[]; // the rows it draws, in landing order; same solve
};

// the squircle's own perimeter, so the draw is a speed and not a duration. The
// corners are on fieldShared's 2 px floor at this size, so the four straight
// runs less the corners plus the corner arcs is exact to a third of a px.
export const outlineLen = (w: number) => 2 * (w + panelH(0)) - 8 * 2 + 2 * Math.PI * 2;

// THE LATTICE. Per row: a pitch, a phase, a hashed jitter and hashed widths,
// then a relaxation that enforces the minimum edge gap, the +-SKY_X bound and
// (row 0 only) the keep-out around x 0. Nothing here is placed by eye.
export type SkySeat = { row: number; cx: number; w: number };
export const SKY_SEATS: SkySeat[] = (() => {
  const out: SkySeat[] = [];
  SKY_ROW_N.forEach((n, row) => {
    const pitch = (2 * SKY_X) / n;
    const [wMin, wMax] = SKY_W[row];
    const w: number[] = [];
    for (let i = 0; i < n; i++) w.push(wMin + hash(i, 3.1 + row) * (wMax - wMin));
    // a row can only hold so much ink and still keep its gaps and its jitter
    const budget = 2 * SKY_X - (n - 1) * SKY_GAP - SKY_SLACK;
    const sum = w.reduce((a, z) => a + z, 0);
    if (sum > budget) {
      const s = (budget - n * SKY_W_MIN) / (sum - n * SKY_W_MIN);
      for (let i = 0; i < n; i++) w[i] = SKY_W_MIN + (w[i] - SKY_W_MIN) * s;
    }
    const cx: number[] = [];
    for (let i = 0; i < n; i++) {
      const lat = -SKY_X + pitch * (i + 0.5) + SKY_PHASE[row];
      cx.push(lat + (hash(i, 7.7 + row) - 0.5) * 2 * SKY_JITTER * pitch);
    }

    // the gap, the bound, and (row 0) the keep-out over the big board
    const relax = (iters: number) => {
      for (let it = 0; it < iters; it++) {
        if (row === 0) {
          for (let i = 0; i < n; i++) {
            const need = SKY_KEEPOUT - (w[i] - 48) / 2;
            if (Math.abs(cx[i]) < need) cx[i] = (cx[i] < 0 ? -1 : 1) * need;
          }
        }
        const ord = cx.map((_, i) => i).sort((a, z) => cx[a] - cx[z]);
        for (let j = 0; j + 1 < n; j++) {
          const a = ord[j];
          const z = ord[j + 1];
          const ov = cx[a] + w[a] / 2 + SKY_GAP - (cx[z] - w[z] / 2);
          if (ov > 0) {
            cx[a] -= ov / 2;
            cx[z] += ov / 2;
          }
        }
        for (let i = 0; i < n; i++) {
          if (cx[i] - w[i] / 2 < -SKY_X) cx[i] = -SKY_X + w[i] / 2;
          if (cx[i] + w[i] / 2 > SKY_X) cx[i] = SKY_X - w[i] / 2;
        }
      }
    };
    relax(600);

    // A BOARD STANDS WHERE A CLIMB CAN REACH IT. This is not a nicety: it is
    // measured. A climb is a straight segment from an agent in the band to a
    // point on the board's bottom edge, and over the last 330 world px — the
    // gap between the row below's top edge and this board's bottom — a lean of
    // L moves the head only 0.09 L sideways, while the big board caps L for
    // anything near the middle. So a board in the wrong place is not "hard to
    // reach", it is UNREACHABLE: an earlier pass of v3 put one board over
    // another and swept every arrival point, every seat depth and every lean in
    // the field for it — 5,000 segments — and not one of them was clean; the
    // best crossed a panel for 140 world px. The sky therefore has CHIMNEYS in
    // it, and every board above row 0 is moved to the nearest x where a clean
    // climb exists, by the same clearance test the climbs themselves are solved
    // with. `reachable` is a coarse sweep of that space; the climb solver's own
    // search is finer, so what passes here is solvable there.
    if (row > 0) {
      const boxes = [
        ...OBSTACLES,
        ...out.map((s2) => ({
          x0: s2.cx - s2.w / 2 - OPEN_PAD,
          x1: s2.cx + s2.w / 2 + OPEN_PAD,
          y0: skyBottom(s2.row) - panelH(SKY_BOX_ROWS) - OPEN_PAD,
          y1: skyBottom(s2.row) + OPEN_PAD,
        })),
      ];
      const by = skyBottom(row);
      // HOW MANY clean climbs a position has, not just whether it has one: a
      // board with two clean segments in the whole field is one seat-snap away
      // from having none, and the solver snaps every seat to a real agent. The
      // sweep stops counting at REACH_MIN, so a good position is cheap to
      // score and only a bad one pays for the whole space.
      const seen = new Map<number, number>();
      const score = (cxi: number, wi: number) => {
        const key = Math.round(cxi / 5) * 5 + Math.round(wi) * 1e5;
        const had = seen.get(key);
        if (had !== undefined) return had;
        const h = (wi - 48) / 2;
        let ok = 0;
        for (let j = 0; j < REACH_ARRIVALS && ok < REACH_MIN; j++) {
          const bx = cxi - h + (2 * h * j) / (REACH_ARRIVALS - 1);
          for (let d = 0; d < DEPTH_TRIES.length && ok < REACH_MIN; d++) {
            const ay = CROWD_TOP + DEPTH_TRIES[d] * (CROWD_BOT - CROWD_TOP) - THREAD_LIFT;
            for (let L = -OPEN_LEAN_MAX; L <= OPEN_LEAN_MAX; L += REACH_LEAN_STEP) {
              if (countHits(bx + L, ay, bx, by, boxes) === 0) ok++;
            }
          }
        }
        seen.set(key, ok);
        return ok;
      };
      for (let round = 0; round < 5; round++) {
        const bad = cx.map((_, i) => i).filter((i) => score(cx[i], w[i]) < REACH_MIN);
        if (bad.length === 0) break;
        let moved = false;
        bad.forEach((i) => {
          let bestT = cx[i];
          let bestS = score(cx[i], w[i]);
          for (let step = REACH_STEP; step <= REACH_SEARCH; step += REACH_STEP) {
            for (const dir of [1, -1]) {
              const t = cx[i] + dir * step;
              if (Math.abs(t) + w[i] / 2 > SKY_X) continue;
              const sc = score(t, w[i]);
              if (sc > bestS) {
                bestS = sc;
                bestT = t;
              }
              if (bestS >= REACH_MIN) break;
            }
            if (bestS >= REACH_MIN) break;
          }
          if (bestT === cx[i]) return;
          const save = cx.slice();
          cx[i] = bestT;
          relax(300);
          if (score(cx[i], w[i]) > score(save[i], w[i])) {
            moved = true;
            return;
          }
          for (let j = 0; j < n; j++) cx[j] = save[j];
        });
        if (!moved) break;
      }
      relax(300);
    }
    for (let i = 0; i < n; i++) out.push({ row, cx: cx[i], w: w[i] });
  });
  return out;
})();

// The three rows that land on "datasets", on the board M2 pushes in on.
export const DATA_LANDINGS = [155, 160, 165];
// The brief's establishment schedule: one or more boards per word.
export const EST_FRAMES = [65, 80, 80, 85, 85, 98, 98, 98, 104, 104, 104, 113, 113, 119];
export const HF_X = 260; // the brief: the pushed-on board is in the MIDDLE row, near here
export const HF_EST = 98;
export const HF_TARGET = 5; // its own row, the three "datasets" rows, and one more
export const SKY_TEMPO_MIN = 14; // the brief's own range
export const SKY_TEMPO_MAX = 30;
export const SKY_TARGET_MIN = 2; // ...and its own: most end on 2-5 rows, none over 6
export const SKY_TARGET_SPREAD = 4;

const skyDist = (a: { cx: number; row: number }, b: { cx: number; row: number }) =>
  Math.hypot(a.cx - b.cx, (a.row - b.row) * SKY_ROW_GAP);

const SKY = (() => {
  const defs: OpenDef[] = SKY_SEATS.map((s, i) => ({
    key: `o${i + 1}`,
    cx: s.cx,
    w: s.w,
    seed: 1.7 + 2.3 * i,
    row: s.row,
    bottom: skyBottom(s.row),
    dy: OPEN_DY - s.row * SKY_ROW_GAP,
    est: 0,
    speed: OUTLINE_SPEED,
    estDur: outlineLen(s.w) / OUTLINE_SPEED,
    estStart: 0,
    tempo: Math.round(SKY_TEMPO_MIN + hash(i, 5.5) * (SKY_TEMPO_MAX - SKY_TEMPO_MIN)),
    target: SKY_TARGET_MIN + Math.floor(hash(i, 8.3) * SKY_TARGET_SPREAD),
    landings: [],
    posts: [],
  }));
  const hf = defs
    .filter((d) => d.row === 1)
    .reduce((a, z) => (Math.abs(z.cx - HF_X) < Math.abs(a.cx - HF_X) ? z : a));
  hf.est = HF_EST;
  hf.target = HF_TARGET;
  // Every other board takes a word, FARTHEST FIRST, so the sky fills inward and
  // the three boards established during M2's push are the ones beside it.
  const frames = EST_FRAMES.slice();
  frames.splice(frames.indexOf(HF_EST), 1);
  defs
    .filter((d) => d !== hf)
    .sort((a, z) => skyDist(z, hf) - skyDist(a, hf) || a.cx - z.cx)
    .forEach((d, i) => {
      d.est = frames[i];
    });
  defs.forEach((d) => {
    d.estStart = d.est - d.estDur;
  });
  return { defs, hf };
})();
export const OPEN: OpenDef[] = SKY.defs;
export const HF_BOARD = SKY.hf;

// Every landing a board's own tempo asks for, before the cap. `must` is the two
// gestures the brief names by frame — the establishing arrival on the word, and
// the three "datasets" rows — which the cap may not drop and which are exempt
// from it among themselves: the burst IS the gesture.
// `seed` is the row index the post's LENGTH and arrival point are hashed on. It
// is the candidate's own index, fixed before the cap runs, so that a landing the
// cap moves or drops never changes another post's length — the row a panel
// DRAWS a post on is its position in the accepted list, and the two are
// deliberately not the same number.
export type Cand = { b: OpenDef; landing: number; must: boolean; seed: number };
export const CANDIDATES: Cand[] = (() => {
  const out: Cand[] = [];
  OPEN.forEach((b) => {
    const own: { landing: number; must: boolean }[] = [{ landing: b.est, must: true }];
    if (b === HF_BOARD) DATA_LANDINGS.forEach((landing) => own.push({ landing, must: true }));
    // its own tempo, until it has asked for `target` rows. The Hugging Face
    // board's tempo stands aside around the "datasets" burst: those three rows
    // are its gesture and it does not also post over them.
    for (let t = b.est + b.tempo; own.length < b.target && t <= DURATION; t += b.tempo) {
      const inBurst =
        b === HF_BOARD && t > DATA_LANDINGS[0] - GROW_DUR && t < DATA_LANDINGS[2] + b.tempo;
      if (!inBurst) own.push({ landing: t, must: false });
    }
    own.sort((a, z) => a.landing - z.landing);
    own.forEach((o, i) => out.push({ b, landing: o.landing, must: o.must, seed: i }));
  });
  out.sort((a, z) => a.landing - z.landing);
  return out;
})();

// The row count a board has by a frame BEFORE the cap has run. The camera's
// framings are solved from this, because the cap is solved from the camera (a
// launch is read backwards through the camera's own travel table) and the two
// cannot both wait for the other. The cap only ever removes rows, so a framing
// solved on the nominal schedule is the roomier of the two; the resolved
// difference is measured in the DONE file.
export const nominalRows = (b: OpenDef, frame: number) =>
  CANDIDATES.filter((c) => c.b === b && c.landing <= frame).length;

export const openClose = (b: OpenDef) => b.est;
export const openRows = (b: OpenDef, frame: number) => rowsAt(frame, 0, b.landings);
export const openPanelTop = (b: OpenDef, rows: number) => panelTop(rows) + b.dy;

// A point on a panel's outline at 0..1 of its perimeter, for the head-led draw:
// clockwise from the top-right corner, which is where `squirclePath` starts.
// The corners are 2 world px, so the outline is walked as the rectangle it is.
// In the open boards' OWN frame — add OPEN_DY for a world y.
export const outlinePointAt = (b: OpenDef, u: number) => {
  const w = b.w;
  const h = panelH(0);
  const d = clamp01(u) * 2 * (w + h);
  const x0 = panelX0(b);
  const y0 = panelTop(0);
  if (d < h) return { x: x0 + w, y: y0 + d };
  if (d < h + w) return { x: x0 + w - (d - h), y: y0 + h };
  if (d < 2 * h + w) return { x: x0, y: y0 + h - (d - h - w) };
  return { x: x0 + (d - 2 * h - w), y: y0 };
};

// ---------------------------------------------------------------------------
// THE HUGGING FACE MARK. Sized the way cut 3 sized MySpace and Facebook: every
// mark in the set lays down the same amount of white, so the factor is the
// square root of the ink-area ratio against the OpenAI mark at MARK_BASE. That
// reference is not restated here — it is read back off cut 3's own FACEBOOK
// mark, so all four marks are on one scale by construction.
//
//   rasterised in the same 24-unit box at 960x960, ink counted:
//   si-openai       ink 216.343   factor 1.00000  ->  108.00 world px
//   si-facebook     ink 335.495   factor 0.80302  ->   86.73   (cut 3: 0.80320)
//   si-myspace      ink 220.749   factor 0.98997  ->  106.92   (cut 3: 0.99005)
//   si-huggingface  ink 334.561   factor 0.80422  ->   86.86 world px, and its
//                                 ink is 21.75 of the 24 box high, so 78.71
//                                 world px of ink sits over the board
// ---------------------------------------------------------------------------
const HF_INK = 334.56068;
export const HUGGINGFACE: MarkDef = (() => {
  const factor = FACEBOOK.factor * Math.sqrt(FACEBOOK.ink / HF_INK);
  return {
    d: "M12.025 1.13c-5.77 0-10.449 4.647-10.449 10.378 0 1.112.178 2.181.503 3.185.064-.222.203-.444.416-.577a.96.96 0 0 1 .524-.15c.293 0 .584.124.84.284.278.173.48.408.71.694.226.282.458.611.684.951v-.014c.017-.324.106-.622.264-.874s.403-.487.762-.543c.3-.047.596.06.787.203s.31.313.4.467c.15.257.212.468.233.542.01.026.653 1.552 1.657 2.54.616.605 1.01 1.223 1.082 1.912.055.537-.096 1.059-.38 1.572.637.121 1.294.187 1.967.187.657 0 1.298-.063 1.921-.178-.287-.517-.44-1.041-.384-1.581.07-.69.465-1.307 1.081-1.913 1.004-.987 1.647-2.513 1.657-2.539.021-.074.083-.285.233-.542.09-.154.208-.323.4-.467a1.08 1.08 0 0 1 .787-.203c.359.056.604.29.762.543s.247.55.265.874v.015c.225-.34.457-.67.683-.952.23-.286.432-.52.71-.694.257-.16.547-.284.84-.285a.97.97 0 0 1 .524.151c.228.143.373.388.43.625l.006.04a10.3 10.3 0 0 0 .534-3.273c0-5.731-4.678-10.378-10.449-10.378M8.327 6.583a1.5 1.5 0 0 1 .713.174 1.487 1.487 0 0 1 .617 2.013c-.183.343-.762-.214-1.102-.094-.38.134-.532.914-.917.71a1.487 1.487 0 0 1 .69-2.803m7.486 0a1.487 1.487 0 0 1 .689 2.803c-.385.204-.536-.576-.916-.71-.34-.12-.92.437-1.103.094a1.487 1.487 0 0 1 .617-2.013 1.5 1.5 0 0 1 .713-.174m-10.68 1.55a.96.96 0 1 1 0 1.921.96.96 0 0 1 0-1.92m13.838 0a.96.96 0 1 1 0 1.92.96.96 0 0 1 0-1.92M8.489 11.458c.588.01 1.965 1.157 3.572 1.164 1.607-.007 2.984-1.155 3.572-1.164.196-.003.305.12.305.454 0 .886-.424 2.328-1.563 3.202-.22-.756-1.396-1.366-1.63-1.32q-.011.001-.02.006l-.044.026-.01.008-.03.024q-.018.017-.035.036l-.032.04a1 1 0 0 0-.058.09l-.014.025q-.049.088-.11.19a1 1 0 0 1-.083.116 1.2 1.2 0 0 1-.173.18q-.035.029-.075.058a1.3 1.3 0 0 1-.251-.243 1 1 0 0 1-.076-.107c-.124-.193-.177-.363-.337-.444-.034-.016-.104-.008-.2.022q-.094.03-.216.087-.06.028-.125.063l-.13.074q-.067.04-.136.086a3 3 0 0 0-.135.096 3 3 0 0 0-.26.219 2 2 0 0 0-.12.121 2 2 0 0 0-.106.128l-.002.002a2 2 0 0 0-.09.132l-.001.001a1.2 1.2 0 0 0-.105.212q-.013.036-.024.073c-1.139-.875-1.563-2.317-1.563-3.203 0-.334.109-.457.305-.454m.836 10.354c.824-1.19.766-2.082-.365-3.194-1.13-1.112-1.789-2.738-1.789-2.738s-.246-.945-.806-.858-.97 1.499.202 2.362c1.173.864-.233 1.45-.685.64-.45-.812-1.683-2.896-2.322-3.295s-1.089-.175-.938.647 2.822 2.813 2.562 3.244-1.176-.506-1.176-.506-2.866-2.567-3.49-1.898.473 1.23 2.037 2.16c1.564.932 1.686 1.178 1.464 1.53s-3.675-2.511-4-1.297c-.323 1.214 3.524 1.567 3.287 2.405-.238.839-2.71-1.587-3.216-.642-.506.946 3.49 2.056 3.522 2.064 1.29.33 4.568 1.028 5.713-.624m5.349 0c-.824-1.19-.766-2.082.365-3.194 1.13-1.112 1.789-2.738 1.789-2.738s.246-.945.806-.858.97 1.499-.202 2.362c-1.173.864.233 1.45.685.64.451-.812 1.683-2.896 2.322-3.295s1.089-.175.938.647-2.822 2.813-2.562 3.244 1.176-.506 1.176-.506 2.866-2.567 3.49-1.898-.473 1.23-2.037 2.16c-1.564.932-1.686 1.178-1.464 1.53s3.675-2.511 4-1.297c.323 1.214-3.524 1.567-3.287 2.405.238.839 2.71-1.587 3.216-.642.506.946-3.49 2.056-3.522 2.064-1.29.33-4.568 1.028-5.713-.624",
    ink: HF_INK,
    bboxH: 21.75,
    factor,
    size: (FACEBOOK.size / FACEBOOK.factor) * factor,
  };
})();

// Cut 3 dropped both of its marks MARK_DROP 260 world px, at k 0.53-1.00: 139
// to 260 SCREEN px of fall. This one lands while the camera is pushed in to
// K_M2, so the same world drop would be 208 screen px and peak at 60 screen px
// a frame, well over the set's 45. 160 world px is 128 screen px of fall and a
// 37 px/frame peak — cut 3's fall, seen through this lens.
export const MARK_DROP = 160;
export const MARK_DUR = 14;
export const HF_SEAT = 147; // "face"
export const HF_F0 = HF_SEAT - MARK_DUR;

// ---------------------------------------------------------------------------
// THE CAMERA. Three moves on ONE damped track that STARTS where cut 3's ended:
// its camera is fully settled by f385 (k within 1e-12 of K_FINAL, cx on
// CX_FINAL, cy on CONTENT_FINAL + CAM_LIFT / K_FINAL), so this track opens on
// that state with zero velocity and f0 is its f385 to the pixel.
//
// Every framing is cut 3's BLOCK solve, `blockCentre` / `blockK`: the top of the
// subject down to the crowd band's bottom edge, centred on screen y 835, fitted
// into the 1230 px of screen y 220-1450 wherever k is the unknown.
//
//   M1  k K_M1, cx 0, the horizon on screen y HORIZON_SCREEN_Y. This one is
//       framed on the LINE rather than as a block, because the sky over it is
//       not empty space — it is where the four boards are about to be. It is
//       solved instead against the two things that bound it: the band's far
//       edge stays clear of the burnt-in captions (it lands on 1515) and the
//       line keeps 375 px of sky, more than twice what its boards use while
//       this framing holds. See the note on K_M1 below for the measurement.
//   M2  k K_M2, cx on the third board, framed on that board plus its mark. The
//       horizon then sits at screen 970 and the big board's own Facebook mark
//       at 1343 — the comparison the line is making, in one frame.
//   M3  k K_END, cx 0, framed on the WHOLE world at the LAST frame: the tallest
//       open board's top edge down to the crowd band's bottom. Everything is
//       still growing through the tail, so the framing is solved on the state it
//       ends in rather than the state it starts the move in.
//
// KEY WINDOWS END BEFORE THEIR LANDING, as cut 3 found: `runCamera` damps the
// target, so keys that run to the landing frame leave the camera visibly moving
// under the word. The windows below are solved backwards from the landings
// (`camsweep.ts` in the scratchpad) and each move is one deceleration lobe.
// ---------------------------------------------------------------------------
// v2: M1 IS A TILT, NOT A PULL-BACK. v1 pulled back to k 0.38 so that the whole
// world fitted under a horizon that has to clear a tower which is still growing,
// and everything after it played at a third of cut 3's scale. v2 keeps cut 3's
// lens and moves the centre 1,973 world px UP instead: the horizon lands on the
// content centre itself, screen y 835, their tower's upper body and its Facebook
// mark are in the lower part of the frame with the tower running off the bottom,
// and the crowd band is out of frame below it. The tower is the past; the open
// internet is the subject, and it is played large.
//
// k is set by the BOTTOM TWO ROWS, per the brief: they are held inside the
// frame with the set's SIDE_MARGIN and `sway`'s drift to spare, and the top row
// is allowed to run past the frame's edge. It happens not to — every board's
// ink is inside +-SKY_X by construction — so OPEN_HALF is the same number
// whichever rows are counted, and the rule is written down rather than the
// number.
export const SIDE_MARGIN = 60;
export const SWAY_X = 3;
export const OPEN_HALF = Math.max(
  ...OPEN.filter((b) => b.row <= 1).map((b) => Math.abs(b.cx) + b.w / 2),
);
export const K_M1 = Math.min(K_FINAL, (540 - SIDE_MARGIN - SWAY_X) / OPEN_HALF);
export const K_M2 = 0.8;
export const HORIZON_SCREEN_Y = 835; // the content centre: the line IS the subject
// the content centre that puts a world y on a screen y at a given k
export const centreFor = (y: number, screenY: number, k: number) =>
  y + (960 - CAM_LIFT - screenY) / k;
export const CONTENT_M1 = centreFor(H_Y, HORIZON_SCREEN_Y, K_M1);

// M2: the Hugging Face board WITH ITS MARK, at the size it reaches at the end
// of the "datasets" burst — the three rows land inside this framing and the
// board grows up into it, which is cut 3's v4 rule: frame the state the gesture
// ends in. v3: it is a board in the MIDDLE row, so the block is centred on it
// and the frame k 0.80 leaves around it holds its neighbours on every side —
// the row below, the row above, and the two beside it. That is the shot: one
// among many.
export const HF_ROWS_M2 = nominalRows(HF_BOARD, DATA_LANDINGS[2]);
export const CONTENT_M2 = blockCentre(
  markInkTop(HUGGINGFACE, openPanelTop(HF_BOARD, HF_ROWS_M2)),
  HF_BOARD.bottom,
);

// M3: the whole world at the last frame. The block's top is the highest ink in
// the frame — every open board's top edge, and the Hugging Face mark's ink top
// over its own.
export const OPEN_TOP_END = (() => {
  let top = Infinity;
  OPEN.forEach((b) => {
    const t = openPanelTop(b, nominalRows(b, DURATION));
    top = Math.min(top, b === HF_BOARD ? markInkTop(HUGGINGFACE, t) : t);
  });
  return top;
})();
export const K_END = blockK(OPEN_TOP_END, CROWD_BAND_Y);
export const CONTENT_END = blockCentre(OPEN_TOP_END, CROWD_BAND_Y);
export const CX_END = 0;

export const M1_K0 = 9; // "once"
export const M1_K1 = 33;
export const M2_K0 = 113; // "including"
export const M2_K1 = 124;
export const M3_K0 = 173; // the speech ends
export const M3_K1 = 205;

export type CamSeg = {
  f0: number;
  f1: number;
  k0: number;
  k1: number;
  c0: number;
  c1: number;
  x0: number;
  x1: number;
  warp: number;
};

export const CAM_SEGS: CamSeg[] = [
  // M1 "once the agents had gotten onto the internet" — out and up onto the line
  {
    f0: M1_K0,
    f1: M1_K1,
    k0: K_FINAL,
    k1: K_M1,
    c0: CONTENT_FINAL,
    c1: CONTENT_M1,
    x0: CX_FINAL,
    x1: 0,
    warp: 0.7,
  },
  // M2 "including communicating on" — push in on the Hugging Face board
  {
    f0: M2_K0,
    f1: M2_K1,
    k0: K_M1,
    k1: K_M2,
    c0: CONTENT_M1,
    c1: CONTENT_M2,
    x0: 0,
    x1: HF_BOARD.cx,
    warp: 0.72,
  },
  // M3 the tail — the pull-back that holds the whole world
  {
    f0: M3_K0,
    f1: M3_K1,
    k0: K_M2,
    k1: K_END,
    c0: CONTENT_M2,
    c1: CONTENT_END,
    x0: HF_BOARD.cx,
    x1: CX_END,
    warp: 0.72,
  },
];

// One track: a key per frame inside a move, one held key in each gap, so a hold
// is a hold and not a slow ramp into the next key. It opens on cut 3's resolved
// camera rather than on a framing of its own.
export const CAM = (() => {
  const F: number[] = [0];
  const K: number[] = [K_FINAL];
  const CY: number[] = [CONTENT_FINAL + CAM_LIFT / K_FINAL];
  const CX: number[] = [CX_FINAL];
  const hold = (f: number) => {
    F.push(f);
    K.push(K[K.length - 1]);
    CY.push(CY[CY.length - 1]);
    CX.push(CX[CX.length - 1]);
  };
  CAM_SEGS.forEach((s) => {
    if (s.f0 > F[F.length - 1] + 1) hold(s.f0 - 1);
    const m = camMove(s);
    m.F.forEach((f, i) => {
      F.push(f);
      K.push(m.K[i]);
      CY.push(m.CY[i]);
      CX.push(s.x0 + (s.x1 - s.x0) * camEase(i / (s.f1 - s.f0), s.warp));
    });
  });
  if (F[F.length - 1] < DURATION + FRAME_PAD) hold(DURATION + FRAME_PAD);
  for (let i = 1; i < F.length; i++) {
    if (F[i] <= F[i - 1]) {
      throw new Error(`OpenInternet: the camera's moves overlap at f${F[i]}`);
    }
  }
  return { F, K, CY, CX };
})();

// The damped track, resolved once at module scope rather than per frame: the
// long climbs are solved against the camera's own k, so every frame's k has to
// exist before a single thread can be placed.
export type CamAt = { k: number; cy: number; cx: number };
export const CAM_AT: CamAt[] = (() => {
  const out: CamAt[] = [];
  for (let f = 0; f <= DURATION + FRAME_PAD; f++) {
    const a = runCamera(f, CAM.F, CAM.CY, CAM.K);
    const b = runCamera(f, CAM.F, CAM.CX, CAM.K);
    out.push({ k: a.k, cy: a.cy, cx: b.cy });
  }
  return out;
})();
export const camAt = (f: number) =>
  CAM_AT[f < 0 ? 0 : f > DURATION + FRAME_PAD ? DURATION + FRAME_PAD : Math.round(f)];

// THE OUTLINE DRAW IS RE-SOLVED AGAINST THE CAMERA, now that there is one. An
// outline head runs at OUTLINE_SPEED world px a frame, which is 42 screen px at
// K_M1 — but three of the fourteen boards close on f113 and f119, while M2 is
// already pushing in, and at the k of those frames the same world speed is 50
// screen px, over the set's 45 cap. Their outlines draw slower instead, so
// every head-led draw in the piece is inside the cap at the lens it is drawn
// at. The estDur this gives is what the render uses, so the draw still closes
// exactly on its word.
export const OUTLINE_SCREEN_CAP = 42;
OPEN.forEach((b) => {
  let k = 0;
  for (let f = Math.floor(b.estStart); f <= b.est; f++) k = Math.max(k, camAt(f).k);
  b.speed = Math.min(OUTLINE_SPEED, OUTLINE_SCREEN_CAP / k);
  b.estDur = outlineLen(b.w) / b.speed;
  b.estStart = b.est - b.estDur;
});

// ---------------------------------------------------------------------------
// THE LONG CLIMBS. Cut 3's posting thread with two things solved rather than
// assumed.
//
// SPEED. A climb is ~3,000 world px, ten times a post on the big board, so it
// runs at OPEN_SPEED — three times the set's LINE_SPEED — and is then CAPPED so
// its head never crosses the screen faster than OPEN_SCREEN_CAP px a frame at
// the k of that frame. The camera pushes to K_M2 on "including", so the cap
// bites there and the climbs visibly slow while the lens is in. `TRAVEL[f]` is
// the world px a climb has covered by frame f, so a head is a lookup rather
// than a per-frame integration, and a LAUNCH is solved backwards from its
// landing through the same table — which is how cut 3 solves its own posts.
//
// LEAN. The agent does not sit under the board: a vertical climb from under an
// open board would run through the big board's panel (520 wide, 2,080 tall by
// the end) and through the small one. It sits OUT in the field, on the far side
// of the board's own centre, and the lean is pushed further out until the
// segment clears every box with its pad to spare. v3: the sky is fourteen
// boards deep, so the boxes now include EVERY OTHER OPEN BOARD at or below the
// one being climbed to, at the tallest it ever gets, and the search runs over
// the ARRIVAL POINT as well as the lean — a climb to the top row has to thread
// two rows of boards and a tower, and moving the arrival 100 px along the
// board's own bottom edge moves the crossing point 80, where moving the seat
// 100 px moves it 14. The streams therefore converge as they rise and no two
// of them run parallel.
// ---------------------------------------------------------------------------
export const OPEN_SPEED = 3 * THREAD_SPEED; // 84 world px a frame
export const OPEN_SCREEN_CAP = 42; // screen px a frame, under the set's 45

export const TRAVEL: number[] = (() => {
  const out = [0];
  for (let f = 1; f <= DURATION + FRAME_PAD; f++) {
    out.push(out[f - 1] + Math.min(OPEN_SPEED, OPEN_SCREEN_CAP / CAM_AT[f].k));
  }
  return out;
})();
export const travelAt = (f: number) => {
  if (f <= 0) return TRAVEL[0] + f * (TRAVEL[1] - TRAVEL[0]);
  const last = TRAVEL.length - 1;
  if (f >= last) return TRAVEL[last] + (f - last) * (TRAVEL[last] - TRAVEL[last - 1]);
  const i = Math.floor(f);
  return TRAVEL[i] + (TRAVEL[i + 1] - TRAVEL[i]) * (f - i);
};
// the frame a climb of `dist` has to leave on to arrive at `landing`
export const launchFor = (landing: number, dist: number) => {
  const target = travelAt(landing) - dist;
  let f = landing;
  while (f > -400 && travelAt(f) > target) f -= 1;
  const a = travelAt(f);
  const b = travelAt(f + 1);
  return b === a ? f : f + (target - a) / (b - a);
};

// Every open board is a box too, at the tallest it ever gets — and, for the
// Hugging Face board, its mark's box as well. A climb is tested against the
// boards AT OR BELOW its own, which are the only ones a rising segment ending
// on its bottom edge can reach.
export const OPEN_BOXES: { b: OpenDef; box: Box }[] = [];
OPEN.forEach((b) => {
  OPEN_BOXES.push({
    b,
    box: {
      x0: b.cx - b.w / 2 - OPEN_PAD,
      x1: b.cx + b.w / 2 + OPEN_PAD,
      y0: b.bottom - panelH(b.target) - OPEN_PAD,
      y1: b.bottom + OPEN_PAD,
    },
  });
});
OPEN_BOXES.push({
  b: HF_BOARD,
  box: {
    x0: HF_BOARD.cx - HUGGINGFACE.size / 2 - OPEN_PAD,
    x1: HF_BOARD.cx + HUGGINGFACE.size / 2 + OPEN_PAD,
    y0: markInkTop(HUGGINGFACE, openPanelTop(HF_BOARD, HF_BOARD.target)) - OPEN_PAD,
    y1: openPanelTop(HF_BOARD, HF_BOARD.target),
  },
});
export const climbBoxes = (target: OpenDef): Box[] => [
  ...OBSTACLES,
  ...OPEN_BOXES.filter((o) => o.b !== target && o.b.bottom >= target.bottom).map((o) => o.box),
];

// v2: A CLIMB IS A PACKET, NOT A LINE. v1 drew the whole thread from the band to
// the board, which at this scale is a 3,000 world px accent line standing in the
// frame for thirty-odd frames, and thirty-nine of them across the cut. The
// set's own packet language draws the head with a tail of at most CLIMB_TAIL
// world px behind it, faded along its length in CLIMB_TAIL_SAMPLES steps, so
// what crosses the frame is a signal travelling rather than a wire being laid.
// The tail also retires the arrival: once the head is on the board the tail
// keeps travelling into it and the packet is absorbed over CLIMB_TAIL / speed
// frames, which is where cut 3's THREAD_FADE would have been.
export const CLIMB_TAIL = 400;
export const CLIMB_TAIL_SAMPLES = 6;
export const PACKET_OP = 0.95; // cut 3's thread opacity, at the head
// The brief's v3 cap: ONE launch per LAUNCH_GAP frames across the whole sky.
// Four, not v2's eight — fourteen boards need the traffic.
export const LAUNCH_GAP = 4;

export type Climb = Post & {
  open: OpenDef;
  bx: number; // where it arrives on the board's bottom edge
  dist: number;
  tries: number;
  hits: number; // boxes the solved segment still crosses; 0 for every one of them
};

// The arrival points tried, the hashed one first and then alternates either
// side of it. A bottom-row board's arrivals are held outside the big board's
// own x span — at that altitude the arrival is 86% of the way along the climb,
// so an arrival inside the tower cannot be reached from any seat in the field.
// The rows above it are far enough up that the lean alone clears the tower.
export const arrivalXs = (b: OpenDef, row: number) => {
  const half = (b.w - 48) / 2;
  let lo = b.cx - half;
  let hi = b.cx + half;
  if (b.row === 0) {
    if (b.cx < 0) hi = Math.min(hi, -CORRIDOR_X);
    else lo = Math.max(lo, CORRIDOR_X);
    if (hi <= lo) {
      lo = b.cx - half;
      hi = b.cx + half;
    }
  }
  const nominal = lo + hash(row, b.seed + 31) * (hi - lo);
  const step = (hi - lo) / ARRIVE_TRIES;
  const out = [nominal];
  for (let i = 1; out.length < ARRIVE_TRIES; i++) {
    [nominal + i * step, nominal - i * step].forEach((x) => {
      if (x >= lo && x <= hi && out.length < ARRIVE_TRIES) out.push(x);
    });
    if (i > ARRIVE_TRIES) break;
  }
  return out;
};

// The lean is SEARCHED, not set: the smallest one either side of the arrival
// that clears every box, over every arrival point in turn. Either side, because
// the world below is not symmetrical — a board can come up the gap between the
// two towers leaning left where its neighbour has to come from outside the
// small one altogether. The best candidate is kept even when it is not clean,
// so a climb is never placed by a fallback that was never scored.
// The GEOMETRY of a climb depends on its board and its row index alone — every
// hash in the solve is on those two — so it is cached. Only the launch moves
// when the schedule defers a landing, and the cap defers a lot of them: without
// this the search would be re-run a hundred times for the same answer.
const GEOM = new Map<string, { seat: number; bx: number; hits: number; tries: number }>();
const solveGeom = (b: OpenDef, row: number) => {
  const key = `${b.key}:${row}`;
  const had = GEOM.get(key);
  if (had) return had;
  const boxes = climbBoxes(b);
  const arrivals = arrivalXs(b, row);
  const first = hash(row, b.seed + 61) < 0.5 ? -1 : 1;
  const depth0 = 0.25 + 0.5 * hash(row, b.seed + 53);
  const lean0 = OPEN_LEAN_MIN + hash(row, b.seed + 43) * OPEN_LEAN_SPREAD;
  const ayOf = (u: number) => CROWD_TOP + u * (CROWD_BOT - CROWD_TOP);
  let best = {
    seat: seatNear(arrivals[0], ayOf(depth0)),
    bx: arrivals[0],
    hits: Infinity,
    crossed: Infinity,
    lean: Infinity,
    tries: 0,
  };
  let tries = 0;
  for (let i = 0; i < LEANS.length && best.hits > 0; i++) {
    const mag = lean0 + LEANS[i];
    if (mag < OPEN_LEAN_FLOOR || mag > OPEN_LEAN_MAX) continue;
    for (let a = 0; a < arrivals.length && best.hits > 0; a++) {
      for (let p = 0; p < DEPTH_TRIES.length && best.hits > 0; p++) {
        for (let d = 0; d < 2 && best.hits > 0; d++) {
          const side = d === 0 ? first : -first;
          const bx = arrivals[a];
          const ay = ayOf(p === 0 ? depth0 : DEPTH_TRIES[p]);
          const want = Math.max(-OPEN_LEAN_MAX, Math.min(OPEN_LEAN_MAX, bx + side * mag));
          const cand = seatNear(want, ay);
          const c = SEATS[cand];
          const n = countHits(c.x, c.y - THREAD_LIFT, bx, b.bottom, boxes);
          const crossed = CROSSED.len;
          const lean = Math.abs(bx - c.x);
          tries++;
          // fewest boxes crossed, then the shortest crossing, then the lean
          // nearest the one this climb asked for
          if (
            n < best.hits ||
            (n === best.hits && crossed < best.crossed - 1) ||
            (n === best.hits &&
              crossed < best.crossed + 1 &&
              Math.abs(lean - lean0) < Math.abs(best.lean - lean0))
          ) {
            best = { seat: cand, bx, hits: n, crossed, lean, tries };
          }
        }
      }
    }
  }
  const out = { seat: best.seat, bx: best.bx, hits: best.hits, tries };
  GEOM.set(key, out);
  return out;
};

const solveClimb = (b: OpenDef, row: number, landing: number): Climb => {
  const len = postLen(b, row);
  const best = solveGeom(b, row);
  const tries = best.tries;
  const s = SEATS[best.seat];
  const baseY = s.y - THREAD_LIFT;
  const bx = best.bx;
  const dist = Math.hypot(bx - s.x, b.bottom - baseY);
  return {
    board: b,
    open: b,
    row,
    len,
    seat: best.seat,
    x: s.x,
    y: s.y,
    baseY,
    bx,
    dist,
    tries,
    hits: best.hits,
    launch: launchFor(landing, dist),
    landing,
    end: landing + len / POST_SPEED,
  };
};

// THE CAP, and the schedule it leaves behind. Every candidate landing is solved
// into a real climb — seat, lean, distance, and the launch read backwards
// through the camera's own travel table — and no two launches may fall within
// LAUNCH_GAP frames of each other. The seven landings the brief names by frame
// are placed FIRST and never move: the four establishing arrivals and the three
// "datasets" rows, which are one gesture and so are exempt from the gap among
// themselves. Every other landing is then DEFERRED, a frame at a time, until its
// launch finds a slot — so the cap thins the traffic without starving a board of
// rows, which a plain drop did: it left the fourth board a one-row stub for the
// whole cut. A candidate that finds no slot inside DEFER_MAX is dropped.
// v3: 60, not v2's 24. Seventeen of the cut's landings are spoken for by the
// brief and they all sit inside f65-165, so at one launch per four frames the
// window their tempos ask for is full and a deferral that can only move a row
// 24 frames leaves half the sky on one row. Sixty reaches the open launch
// window after "hugging", which is the tail — where the brief wants the traffic
// anyway ("the sky keeps moving").
export const DEFER_MAX = 60;
export const CLIMBS: Climb[] = [];
export const DROPPED: { key: string; landing: number }[] = [];
(() => {
  const taken: number[] = [];
  const free = (launch: number) => !taken.some((t) => Math.abs(t - launch) < LAUNCH_GAP);
  const accept = (c: Cand, climb: Climb) => {
    taken.push(climb.launch);
    CLIMBS.push(climb);
    c.b.landings.push(climb.landing);
  };
  CANDIDATES.filter((c) => c.must).forEach((c) => accept(c, solveClimb(c.b, c.seed, c.landing)));
  // WEIGHTED FAIR, not landing order. There are only about thirteen launch slots
  // whose landing can still fall inside the speech and seven of them are spoken
  // for, so handing the rest out in landing order gives them to whichever board
  // was established first and leaves the fourth board a one-row stub for the
  // whole cut. A candidate's priority is instead its own index on its board
  // times that board's tempo — the classic weighted-fair key — so the boards
  // take turns and the turns are shared in the ratio the tempos state. THAT is
  // where "in various ways is proportion" is actually enforced: the widest and
  // fastest board takes the most slots, the Hugging Face board comes last
  // because its three "datasets" rows have already been served, and all four
  // grow while the line is still being spoken.
  CANDIDATES.filter((c) => !c.must)
    .slice()
    .sort(
      (a, z) =>
        a.seed - z.seed ||
        (a.seed + 1) * a.b.tempo - (z.seed + 1) * z.b.tempo ||
        a.landing - z.landing,
    )
    .forEach((c) => {
      // the NEAREST frame whose launch has room, either side: a forward-only
      // search cannot reach a gap that opened behind the candidate and starves
      // whichever board's tempo happens to put it just past one.
      for (let d = 0; d <= DEFER_MAX; d++) {
        for (const s of d === 0 ? [0] : [-d, d]) {
          const landing = c.landing + s;
          if (landing > DURATION || landing <= c.b.est + GROW_DUR) continue;
          const climb = solveClimb(c.b, c.seed, landing);
          if (free(climb.launch)) {
            accept(c, climb);
            return;
          }
        }
      }
      DROPPED.push({ key: c.b.key, landing: c.landing });
    });
  CLIMBS.sort((a, z) => a.landing - z.landing);
  OPEN.forEach((b) => {
    b.landings.sort((a, z) => a - z);
    b.posts = CLIMBS.filter((c) => c.open === b).map((c, n) => ({
      row: n,
      len: c.len,
      from: c.landing,
    }));
  });
})();

// The legato the brief asks for between a climb and the board it establishes:
// the head is in the frame LEGATO frames before its outline starts drawing, so
// the first climb of the cut is visible on "communicating" f52 and the outline
// it lands into starts at f57.
export const openLegatoIn = (b: OpenDef) => b.estStart - LEGATO;

// where a climb's head is at a frame, in world coordinates
export const climbAt = (c: Climb, f: number) => {
  if (f < c.launch) return null;
  const u = clamp01((travelAt(f) - travelAt(c.launch)) / c.dist);
  return { x: c.x + (c.bx - c.x) * u, y: c.baseY + (c.open.bottom - c.baseY) * u };
};

// The one highlight in the cut: the agent behind the first row that lands on
// "data".
export const HIGHLIGHT_LANDING = DATA_LANDINGS[0];

// ---------------------------------------------------------------------------

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
  // cut 3's count, unchanged: the ambient has to BE its ambient, the same
  // periods on the same seats, one frame later
  idleThreadCount: 480,
  experiments: {},
  beats: {
    then: 2,
    once: 9,
    agents: 18,
    gotten: 26,
    onto: 32,
    internet: 35,
    they: 49,
    communicating: 52,
    on: 65,
    open: 80,
    internet2: 85,
    various: 98,
    ways: 104,
    including: 113,
    communicating2: 119,
    hugging: 138,
    face: 147,
    data: 155,
    sets: 163,
    end: 173,
  },
});

const OpenInternet: React.FC<Props> = ({
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
  experiments,
}) => {
  const frame = useCurrentFrame();
  // cut 3's clock. Everything that belongs to cut 3's world — its seats, its
  // schedule, its boards, its marks, its ambient — is read at F, so this piece
  // continues that piece rather than restarting it.
  const F = frame + F0;
  // 0 = deep (at rest), 1 = ripe (posting). Built once per frame, read per dot.
  const tone = makeTone(accentDeep, accent);
  const bigPosts = experiments.legato ? BIG_POSTS_LEGATO : BIG_POSTS_FLAT;

  // -- camera ----------------------------------------------------------------
  const cam = camAt(frame);
  const drift = sway(F);
  const cy = cam.cy + drift.dy;
  const cx = cam.cx + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);

  // -- cut 3's two boards, still posting -------------------------------------
  const bigRows = bigRowsAt(F);
  const smRows = smallRows(F);
  const bigDraw: PostDraw[] = [];
  for (let r = 0; r < ROWS0_BIG; r++) bigDraw.push({ row: r, len: postLen(BIG, r), from: -1000 });
  bigPosts.forEach((p) => {
    if (F >= p.landing) bigDraw.push({ row: p.row, len: p.len, from: p.landing });
  });
  const smallDraw: PostDraw[] = [];
  for (let r = 0; r < ROWS0_SMALL; r++)
    smallDraw.push({ row: r, len: postLen(SMALL, r), from: -1000 });
  SMALL_POSTS.forEach((p) => {
    if (F >= p.landing) smallDraw.push({ row: p.row, len: p.len, from: p.landing });
  });
  // The small board's ink: cut 3's ramps both resolved long before its f385
  // (read on "different" f160, dim again on "take" f238), so it sits on the
  // bottom rung for the whole of this cut.
  const smallOp = OP_RECEDE;

  // -- the horizon -----------------------------------------------------------
  const hReach = Math.min(HORIZON_X, Math.max(0, (frame - HORIZON_F0) * HORIZON_SPEED));
  const hClick = frame >= HORIZON_CLICK && frame < HORIZON_CLICK + CLICK_DUR ? 1 : 0;
  const hOp = OP_READ + (1 - OP_READ) * hClick;
  const hHeadAt = (dir: number) => (f: number) => ({
    x: dir * Math.min(HORIZON_X, Math.max(0, (f - HORIZON_F0) * HORIZON_SPEED)),
    y: H_Y,
  });

  // -- the crowd's tone ------------------------------------------------------
  // Only a posting agent ever leaves the deep tone: it comes up over TONE_DUR
  // before its thread leaves and goes back down over TONE_DUR once the thread
  // has faded. Cut 3's posts run on cut 3's clock, the climbs on this one.
  const seatTone = new Float32Array(NSEAT);
  const litPost = (seat: number, now: number, launch: number, downAt: number) => {
    const up = ease((now - (launch - TONE_DUR)) / TONE_DUR, EASE_ARRIVE);
    const down = ease((now - downAt) / TONE_DUR, EASE_ARRIVE);
    const v = clamp01(up - down);
    if (v > seatTone[seat]) seatTone[seat] = v;
  };
  bigPosts.forEach((p) => {
    if (F < p.launch - TONE_DUR - 1) return;
    litPost(p.seat, F, p.launch, p.landing + GROW_DUR + THREAD_FADE);
  });
  CLIMBS.forEach((c) => {
    if (frame < c.launch - TONE_DUR - 1) return;
    litPost(c.seat, frame, c.launch, c.landing + GROW_DUR + THREAD_FADE);
  });

  // -- idle traffic ----------------------------------------------------------
  const { threadEls, lit } = idleTraffic(F, idleThreadCount);

  // -- the posting threads, cut 3's and this cut's ---------------------------
  type Live = {
    key: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    op: number;
    stroke: string;
  };
  const live: Live[] = [];
  // every white tip in the piece, cut 3's post threads and this cut's packets
  const headDots: { key: string; x: number; y: number; op?: number }[] = [];
  // each head carries the clock it is read on: cut 3's posts run on F, the
  // climbs on this piece's own frame
  const heads: {
    key: string;
    now: number;
    at: (f: number) => { x: number; y: number } | null;
  }[] = [];
  // cut 3's: straight up at one speed, dead stop on the panel's bottom edge
  const addPost = (p: Post, key: string) => {
    const fadeF0 = p.landing + GROW_DUR;
    if (F < p.launch || F > fadeF0 + THREAD_FADE) return;
    const at = (f: number) => {
      if (f < p.launch) return null;
      const d = clamp01(((f - p.launch) * THREAD_SPEED) / (p.baseY - BOARD_BOTTOM));
      return { x: p.x, y: p.baseY + (BOARD_BOTTOM - p.baseY) * d };
    };
    const now = at(F);
    if (!now) return;
    const drawn = (p.baseY - now.y) / (p.baseY - BOARD_BOTTOM);
    const op = 0.95 * (1 - ease((F - fadeF0) / THREAD_FADE, EASE_ARRIVE));
    if (op <= 0.02) return;
    live.push({ key, x1: p.x, y1: p.baseY, x2: p.x, y2: now.y, op, stroke: accent });
    if (drawn < 1) {
      heads.push({ key, now: F, at });
      headDots.push({ key, x: p.x, y: now.y, op });
    }
  };
  bigPosts.forEach((p, n) => addPost(p, `b${n}`));
  // this cut's: the long climbs, as packets — a head with at most CLIMB_TAIL
  // world px of accent behind it, faded along its length, leaning past the two
  // boards below and capped in screen speed
  CLIMBS.forEach((c, n) => {
    const travelled = travelAt(frame) - travelAt(c.launch);
    if (travelled <= 0 || travelled - CLIMB_TAIL >= c.dist) return;
    const hU = clamp01(travelled / c.dist);
    const tU = clamp01((travelled - CLIMB_TAIL) / c.dist);
    if (hU <= tU) return;
    const at = (u: number) => ({
      x: c.x + (c.bx - c.x) * u,
      y: c.baseY + (c.open.bottom - c.baseY) * u,
    });
    const key = `c${n}`;
    // THE ONE HIGHLIGHT. The brief puts it on the AGENT behind the first row of
    // "datasets"; at M2's k that agent is 2,900 screen px below the frame — the
    // crowd is a long way under the open internet by then — so the half-step
    // tone rides the packet it sent, which is the part of it in the frame. Same
    // two frames, same tone, one payoff.
    const hl =
      c.landing === HIGHLIGHT_LANDING && c.open === HF_BOARD
        ? highlightTone(frame, HIGHLIGHT_LANDING, accent, experiments.highlight)
        : accent;
    for (let i = 0; i < CLIMB_TAIL_SAMPLES; i++) {
      const a = at(tU + ((hU - tU) * i) / CLIMB_TAIL_SAMPLES);
      const b = at(tU + ((hU - tU) * (i + 1)) / CLIMB_TAIL_SAMPLES);
      live.push({
        key: `${key}s${i}`,
        x1: a.x,
        y1: a.y,
        x2: b.x,
        y2: b.y,
        op: PACKET_OP * (0.2 + 0.8 * ((i + 1) / CLIMB_TAIL_SAMPLES)),
        stroke: hl,
      });
    }
    if (hU < 1) {
      const head = at(hU);
      heads.push({ key, now: frame, at: (f: number) => climbAt(c, f) });
      headDots.push({ key, x: head.x, y: head.y });
    }
  });

  // -- the marks -------------------------------------------------------------
  // MySpace and Facebook are cut 3's, read on cut 3's clock: MySpace is seated
  // on a board that stopped growing, Facebook rides the big board up all cut.
  const msAt = (f: number) => markInkBottom(panelTop(smallRows(f)));
  const fbAt = (f: number) => markInkBottom(panelTop(bigRowsAt(f)));
  // Hugging Face drops onto a board that is itself still growing, so the rest
  // position is read every frame and the drop is the offset above it.
  const hfAt = (f: number) => {
    const rest = markInkBottom(openPanelTop(HF_BOARD, openRows(HF_BOARD, f)));
    const e = ease((f - HF_F0) / MARK_DUR, EASE_PAYOFF);
    return rest - MARK_DROP * (1 - e);
  };

  // -- the crowd, bucketed by tone step -------------------------------------
  // One <path> of circle arcs per tone step: TONE_STEPS + 1 nodes for the whole
  // field, whatever the seat count. The one highlighted agent is drawn on its
  // own, because it is the only dot in the piece that is not on the ramp.
  const buckets: string[][] = [];
  for (let s = 0; s <= TONE_STEPS; s++) buckets.push([]);
  const n1 = (v: number) => Math.round(v * 10) / 10;
  for (let i = 0; i < NSEAT; i++) {
    const s = SEATS[i];
    const l = Math.max(lit[i], seatTone[i]);
    const r = dotRadius * s.r * s.rs * breath(F, hash(i, 9)) * (1 + 0.35 * l);
    const step = Math.round(clamp01(l) * TONE_STEPS);
    const rr = n1(r);
    buckets[step].push(
      `M${n1(s.x - r)} ${n1(s.y)}a${rr} ${rr} 0 1 0 ${n1(2 * r)} 0a${rr} ${rr} 0 1 0 ${n1(-2 * r)} 0`,
    );
  }

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <GridBackground
        src={backgroundSrc}
        blur={backgroundBlur}
        dim={backgroundDim}
        frame={F}
        cy={cy}
        cyRest={CAM3.CY[0]}
        cx={cx}
        cxRest={CAM3.CX[0]}
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
            width: 0,
            height: 0,
            transformOrigin: "0 0",
            transform: `translate(${tx}px, ${ty}px) scale(${k})`,
          }}
        >
          <svg
            width={VIEW_W}
            height={VIEW_H}
            viewBox={`${VIEW_X} ${VIEW_Y} ${VIEW_W} ${VIEW_H}`}
            style={{ position: "absolute", left: VIEW_X, top: VIEW_Y, overflow: "visible" }}
          >
            {/* the crowd, one path per tone step */}
            {buckets.map((d, s) =>
              d.length ? (
                <path key={s} d={d.join("")} fill={tone(s / TONE_STEPS)} opacity={dotUnread} />
              ) : null,
            )}

            {/* idle traffic, head-led */}
            {threadEls.map((t) => (
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
            ))}

            {/* the posting threads and the long climbs, a trail on every head */}
            <g style={{ filter: icon }}>
              {live.map((l) => (
                <line
                  key={l.key}
                  x1={l.x1}
                  y1={l.y1}
                  x2={l.x2}
                  y2={l.y2}
                  stroke={l.stroke}
                  strokeWidth={STROKE}
                  strokeLinecap="round"
                  opacity={l.op}
                />
              ))}
              {heads.map((h) => (
                <Trail
                  key={h.key}
                  frame={h.now}
                  k={k}
                  at={h.at}
                  r={4}
                  fill={ink}
                  enabled={experiments.trails}
                />
              ))}
              {headDots.map((h) => (
                <circle key={`h${h.key}`} cx={h.x} cy={h.y} r={4} fill={ink} opacity={h.op ?? 1} />
              ))}
            </g>

            {/* the horizon: the edge above which there is no board of theirs */}
            {hReach > 0 ? (
              <g style={{ filter: icon }}>
                <line
                  x1={-hReach}
                  y1={H_Y}
                  x2={hReach}
                  y2={H_Y}
                  stroke={ink}
                  strokeWidth={STROKE}
                  strokeLinecap="round"
                  opacity={hOp}
                />
                {[-1, 1].map((dir) => (
                  <g key={dir}>
                    <Streak
                      frame={frame}
                      k={k}
                      at={hHeadAt(dir)}
                      stroke={ink}
                      width={STROKE}
                      enabled={experiments.trails}
                    />
                    {hReach < HORIZON_X ? (
                      <circle cx={dir * hReach} cy={H_Y} r={4} fill={ink} />
                    ) : null}
                  </g>
                ))}
              </g>
            ) : null}

            {/* cut 3's two boards */}
            <Board
              board={SMALL}
              rows={smRows}
              posts={smallDraw}
              inkOp={smallOp}
              ink={ink}
              icon={icon}
              frame={F}
              k={k}
              trails={experiments.trails}
            />
            <Board
              board={BIG}
              rows={bigRows}
              posts={bigDraw}
              inkOp={OP_READ}
              ink={ink}
              icon={icon}
              frame={F}
              k={k}
              trails={experiments.trails}
            />

            {/* the sky: fourteen boards in three rows, each under its own
                translate off cut 3's board unit */}
            <>
              {OPEN.map((b) => {
                if (frame < b.estStart) return null;
                const close = openClose(b);
                if (frame < close) {
                  const u = clamp01((frame - b.estStart) / b.estDur);
                  const head = outlinePointAt(b, u);
                  const at = (f: number) => outlinePointAt(b, clamp01((f - b.estStart) / b.estDur));
                  return (
                    <g key={b.key} transform={`translate(0 ${b.dy})`} style={{ filter: icon }}>
                      <path
                        d={panelPath(b, 0)}
                        transform={`translate(${panelX0(b)} ${panelTop(0)})`}
                        fill="none"
                        stroke={ink}
                        strokeWidth={STROKE}
                        strokeLinecap="round"
                        opacity={OP_READ}
                        pathLength={1}
                        strokeDasharray={`${u} ${1 - u}`}
                      />
                      {/* A `Streak` is a straight smear between two positions,
                          which is right for a line head and wrong for this one:
                          the head turns four corners, and the smear drew a
                          chord across the panel. `Trail` puts its marks ON the
                          path instead, so the smear goes round the corner with
                          the head. */}
                      <Trail
                        frame={frame}
                        k={k}
                        at={at}
                        r={4}
                        fill={ink}
                        enabled={experiments.trails}
                      />
                      <circle cx={head.x} cy={head.y} r={4} fill={ink} />
                    </g>
                  );
                }
                const click = frame < close + CLICK_DUR ? 1 : 0;
                const draw = b.posts.filter((p) => frame >= p.from);
                return (
                  <g key={b.key} transform={`translate(0 ${b.dy})`}>
                    <Board
                      board={b}
                      rows={openRows(b, frame)}
                      posts={draw}
                      inkOp={OP_READ + (1 - OP_READ) * click}
                      ink={ink}
                      icon={icon}
                      frame={frame}
                      k={k}
                      trails={experiments.trails}
                    />
                  </g>
                );
              })}
            </>

            {/* the three marks, white, each MARK_GAP above its own board */}
            <MarkGlyph
              mark={MYSPACE}
              cx={SMALL.cx}
              at={msAt}
              frame={F}
              k={k}
              ink={ink}
              icon={icon}
              trails={experiments.trails}
            />
            <MarkGlyph
              mark={FACEBOOK}
              cx={BIG.cx}
              at={fbAt}
              frame={F}
              k={k}
              ink={ink}
              icon={icon}
              trails={experiments.trails}
            />
            {frame >= HF_F0 ? (
              <MarkGlyph
                mark={HUGGINGFACE}
                cx={HF_BOARD.cx}
                at={hfAt}
                frame={frame}
                k={k}
                ink={ink}
                icon={icon}
                trails={experiments.trails}
              />
            ) : null}
          </svg>
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default OpenInternet;
