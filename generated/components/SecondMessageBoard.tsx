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
  feather,
  hash,
  iconShadow,
  makeTone,
  runCamera,
  smoothstep,
  squirclePath,
  sway,
  wobble,
  worldTransform,
} from "./fieldShared";
// The shared line values of this set. Imported, never restated.
import { LINE_SPEED, STROKE, TONE_DUR, clamp01, clampi } from "./ImpossibleTasks";
import {
  EASE_ARRIVE,
  EASE_PAYOFF,
  ExperimentsSchema,
  HIGHLIGHT_FRAMES,
  HOLD_DRIFT_PX,
  PACKET_HERO,
  PACKET_PERIOD,
  Packet,
  Streak,
  TRAIL_FRAMES,
  TRAIL_OPACITY,
  Trail,
  WAKE_LEAD,
  arriveEase,
  ease,
  highlightTone,
  holdDriftK,
  legatoStart,
  packetsOn,
  trailFactor,
} from "./levelUp";

export const FPS = 24;
// Dwarkesh clip `Ajeya_The_Investigation`. Ajeya Cotra on the OpenAI / Hugging
// Face sandbox attack, cut 3 of four:
//
//   "So this was actually the second message board established by these agents,
//    from July 7th through 13th. Five hours earlier there was a different
//    message board that had a number of agents participating, but it just
//    didn't take off as much. It was sort of like the MySpace, and this message
//    board was the Facebook."
//
// SRT span 0:50.640 -> 1:04.739 at 24fps.
// DURATION = round((64.739 - 50.640) * 24) = round(14.099 * 24) = round(338.4)
// = 338 frames of speech, plus a 48 frame tail so the resolved state holds and
// the editor can cut out of it wherever it wants = 386.
export const DURATION = 386;

// ---------------------------------------------------------------------------
// "The second message board". Orange Dwarkesh style: opaque grid cutaway,
// 1080x1920, 24fps, two-tone warm yellow dots fully opaque, per-icon shadows,
// eased camera moves, one gesture per word.
//
// THE WORLD, and this cut defines it — cut 4 imports every constant below.
// A BOARD IS A PANEL OF POSTS. A squircle whose BOTTOM edge is nailed to world
// y 300 and whose height is rows * ROW_PITCH + 2 * PAD, so it grows UPWARD by
// one row per post. Inside it one post per row: a horizontal ink line whose
// length is hashed 40-75% of the inner width, stable per row index, and anchored
// to the BOTTOM row, so an old post never moves and the newest is always the top
// one. Size IS count: the rows are countable and the two boards' heights are the
// comparison the line is making.
//
// A POST LANDS like this: an agent goes deep -> ripe over TONE_DUR, sends a
// thread straight up to the panel's bottom edge at LINE_SPEED, the row grows on
// arrival over GROW_DUR on EASE_ARRIVE while the post line draws left -> right
// head-led at one speed with a white tip and clicks to OP 1.0 for four frames,
// the thread fades over eight frames after the row has grown, and the agent
// eases back to deep. The posting agent's DEPTH is not placed by eye: it is
// solved so the thread's launch is the LEGATO start of the previous post's last
// frame, which is why a faster tempo posts from shallower seats.
//
// Every gesture is one word. Nothing else happens.
//   CAMERA M0: open at k 1.50 on the big board and the
//     crowd band under it, so the mechanism fills the
//     frame — posts arriving, the panel growing, threads
//     climbing. Six rows exist at f0; the seventh lands
//     at f6
//                              — "so this was actually the"             f0-36
//   "SECOND MESSAGE BOARD": nothing new is invented.
//     The arrivals carry it, and the panel's top edge
//     climbs out of the lower half into the frame's
//     upper third as the rows land
//                              — "second message board"                 f36-61
//   CAMERA M1: PULL BACK k 1.50 -> 1.00, content
//     centre CONTENT_OPEN -> CONTENT_M1, warp 0.72, keys
//     f61-72, landed f85 — the whole board and the
//     crowd it stands on
//                              — "established by these agents"          f61-94
//   TEMPO: the landings go from one per 16 frames to
//     one per 11 — the week in full swing. No dates, no
//     text; the board simply gains rows faster
//                              — "from July 7th through 13th"           f94-129
//   CAMERA M2: TRACK LEFT 900 world px at k 1.00,
//     warp 0.64, keys f117-136 — it starts moving at
//     f118, just after "13th", and is 99.4% landed by
//     f143, four frames before "there" — arriving on the
//     small board: two rows, dim, silent. The big board
//     leaves the frame to the right. cy tilts 2.6 world
//     px with it (CONTENT_M1 -> CONTENT_M2)
//                              — "five hours earlier"                   f129-147
//   CAMERA M2b: PUSH IN on the small board, k 1.00 ->
//     K_PUSH 1.28, content centre CONTENT_M2 ->
//     CONTENT_M2B, warp 0.72, keys f157-168 — it starts
//     moving at f158, on "different", and is 99.4% landed
//     by f178, five frames before "had" f183. v4: the
//     block it frames is the board's OWN top down to the
//     band's bottom edge, centred — no mark clearance in
//     it — so the board is large in the upper half with
//     the whole band under it and the six agents that are
//     about to post inside the frame
//                              — "there was a different message board"  f158-183
//   THE SMALL BOARD IS READ: its ink rises
//     OP_RECEDE -> OP_READ over 12 frames
//                              — "there was a different message board"  f160-172
//   SIX AGENTS POST: six threads leave at f186, 192,
//     198, 204, 210, 216 — the same mechanism, the
//     same speeds — and the board grows 2 -> 8 rows
//                              — "had a number of agents participating" f183-223
//   IT DIES: no more launches. The six agents ease
//     back to deep over 12 frames from f231, and the
//     board's ink recedes OP_READ -> OP_RECEDE over
//     16 frames from f238
//                              — "didn't take off as much"              f231-254
//   CAMERA M3: PULL BACK and TRACK RIGHT to frame
//     BOTH boards — the resolved Facebook mark's ink
//     top down to the crowd band's bottom edge, inside
//     screen y 220-1450 — k K_PUSH -> K_FINAL 0.533,
//     cx -900 -> -400, warp 0.72, keys f257-304. v4: it
//     starts moving at f258, BEFORE "sort of like" f261,
//     so the frame is already opening when the MySpace
//     mark falls into it, and it is 99.4% landed by f308,
//     four frames before "board" f312. 47 key frames is
//     the longest window that still lands there, and so
//     the slowest: 16.3 screen px a frame of pan
//                              — "sort of like ... and this message board" f258-312
//   MYSPACE: the mark descends MYSPACE_DROP 56.1 world
//     px onto its rest position 60 above the small
//     board's top, EASE_ARRIVE over 14 frames with a
//     Trail, seated on "myspace" — INTO the frame M3 is
//     opening above the board. v4: the drop is solved
//     against the MOVING camera at f262 rather than
//     taken from the shared MARK_DROP, which would start
//     the whole mark outside the frame's top edge
//                              — "sort of like the MySpace"             f262-276
//   FACEBOOK: the mark drops 260 world px onto its
//     rest position 60 above the big board's top on
//     EASE_PAYOFF — the cut's ONE overshoot — over 14
//     frames with a Trail, seated on "facebook". The
//     landing scheduled at f325 (the nearest scheduled
//     landing to the briefed f324) gets `highlightTone`
//     on its agent: the cut's ONE highlight
//                              — "was the Facebook"                     f310-324
//   HOLD. The big board keeps gaining a row per 16
//     frames and the Facebook mark rides up with it;
//     the small board sits dim under MySpace. It never
//     fades out — the editor controls the out
//                              — tail                                   f338-386
//
// ambient: idle thread traffic across the crowd from f0 (short, local, head-led,
// 0.4 accent), `breath` on every dot, `sway` on the camera, the grid's own
// drift. Not gestures; that is what this field is.
//
// EXPERIMENTS IN THIS PIECE (levelUp.tsx), each behind `experiments`:
//   EASE_ARRIVE   every arrival: the row growth, the post draw's click window,
//                 every tone ramp, both board ink ramps, the MySpace descent.
//   EASE_PAYOFF   exactly one landing: the Facebook mark, f310-324.
//   LEGATO        the posting agents' depths are SOLVED from it, so every
//                 thread leaves LEGATO frames before the previous post line's
//                 last frame and the run of arrivals is one phrase.
//   Trail         on every thread head and on both descending marks.
//   Streak        on the post line's head, which is the fastest thing here.
//   highlight     one landing, f325, one agent, HIGHLIGHT_FRAMES frames.
//   softFront     DECLARED AND UNUSED. This cut has no crowd-scale tone wave:
//                 its tone events are individual posting agents, one at a time.
//                 A wave would be a gesture with no word in the line.
//   depth         DECLARED AND UNUSED — cut 1 only, per the brief.
//
// MEASURED, not asserted (`diag.ts`, `camsweep.ts`, `bounds.ts` in the
// scratchpad):
//   max thread head   42.0 screen px/frame at k 1.50 (the cap is 45), 35.9 at
//                     K_PUSH on the small board's six, 14.7 at K_FINAL, where
//                     the Trail still runs at 0.42 of full
//   max post head     54.0 screen px/frame at k 1.50 on the big board, 41.0 at
//                     K_PUSH on the small board's six (POST_SPEED_SMALL, see
//                     above — 36 would be 46.1 there, still over), both
//                     carrying a Streak
//   max mark speed    36.9 screen px/frame (MySpace, f267, under the moving
//                     camera, on the solved MYSPACE_DROP) and 40.4 (Facebook,
//                     f311, K_FINAL) — both carry the ghost trail
//   peak camera       61.0 screen px/frame of pan at f127 (M2, see above),
//                     16.3 of pan and 21.9 of tilt at f271 (M3 over its 47
//                     frame window), and the push itself moves the band's
//                     bottom edge, the farthest thing from the centre, at
//                     7.1 screen px/frame at f164
//   idle traffic      68.6 screen px/frame at f255, the fastest an idle head
//                     ever gets under the pushed-in lens. The open runs the
//                     same ambient at 80 at k 1.50, so this is not a new
//                     speed, it is the same ambient one lens step wider
//   rows on screen    60 screen px a row at the open, 21.3 at K_FINAL — the
//                     count is readable in the resolved frame
//   Facebook overshoot 20.5 world px past the seat at f318, back on it at f324
//   frame bounds      the frame never reaches the crowd's side edges: over the
//                     whole damped track it sees world x -1440..683 of
//                     -1700..1700. The band's long edges are feathered, so both
//                     are meant to be seen
//   dots              a solid-region dot is 6.2-10.3 screen px of radius at f0
//
// DEVIATIONS FROM THE BRIEF, and why:
//   * v2: THE CROWD IS A BAND, y 380-900, both long edges feathered over 12
//     rows and wobbled. The brief's "the bottom bleeds off the frame at every k"
//     was withdrawn by the director: v1 honoured it, the crowd became 60% of
//     every frame and the boards floated on a sea. Below the band there is grid
//     and nothing else.
//   * A post line draws at ONE SPEED (36 world px/frame) rather than in a flat
//     6 frames: a flat 6 frames is 90 screen px/frame at the opening k 1.50.
//   * v2: ROW_PITCH 34 -> 40 and the tempo 10/7 -> 16/11, which resolves at
//     K_FINAL 0.533, 32 rows at f312, 34.6 at f338 and 37.3 at f385 — 21.3
//     screen px a row, a count rather than a barcode. The framing is still
//     solved from the LAST frame rather than f312, so the board grows into
//     headroom through the tail instead of out of the top of the frame; cut 4
//     blends against f385.
//   * The mark clearance is 60 + the mark's own ink height, which for Facebook
//     is 146.6 world px rather than the brief's 168: the ink-area sizing makes
//     the Facebook mark 86.75, not 108.
//   * The highlight lands on the scheduled landing at f325, the nearest one to
//     the brief's f324; the tempo puts no landing on f324 itself.
//   * v4: K_PUSH IS 1.28125, NOT THE BRIEFED 1.35. M2b's block — the small
//     board's own top edge at its resolved eight rows down to the band's
//     bottom — is 960 world px, which at 1.35 is 1296 screen px against a safe
//     band of 1230. The brief's own instruction is to lower K_PUSH to the k
//     that fits, floor 1.25; `blockK` gives 1.28125. Every framing in the
//     piece except M0 is now a plain centred block.
//   * v4: THE M2b FRAMING IS SOLVED ON THE BOARD'S RESOLVED EIGHT ROWS, not on
//     the two it has when the push lands, because the six posts and the recede
//     all play inside this framing and the eight-row state is the biggest one.
//     The board therefore grows UP into the frame across f186-216 and its top
//     edge arrives exactly on TOP_Y 220 at f254. At f183 there are 307 screen
//     px above it, and that is the six rows that are about to land.
//   * v4: MYSPACE_DROP IS 56.1 WORLD PX, re-solved against the MOVING camera.
//     The brief asks for the shared MARK_DROP 260 back if the mark's ink top
//     is inside the frame at f262: it is not — 260 puts it on screen -226.4,
//     the whole mark outside — and neither is v3's own 148.3, which puts it on
//     -85.9. The drop is therefore solved the way v3's was, as the fall that
//     starts the ink top MARK_EDGE 30 screen px inside the top edge, but
//     against the camera M3 is already moving. MARK_DROP is untouched, so the
//     Facebook payoff still falls the full 260.
//   * v3: THE SMALL BOARD'S SIX POSTS DRAW AT POST_SPEED_SMALL 32, not the
//     shared 36, because they are the only post lines in the piece ever drawn
//     above k 1.2 and 36 is 46.1 screen px/frame at K_PUSH 1.28125, still over
//     the 45 cap. It is the one place two post lines here do not share a speed.
//   * v4: M3 IS RE-KEYED to f257-304, the longest window at warp 0.72 whose
//     first moving frame is f258 and which is still 99.4% landed by f308.
//     Longer is slower, so this is also the calmest: 16.3 screen px/frame of
//     pan (v3: 46.3), against the 50 the brief asks for.
//   * v2: M2 IS 61.0 screen px/frame at its peak, not the brief's target of 55.
//     From f118 the damper makes the peak and the landing frame one number: the
//     swept floor is 61.0 to be 99.4% landed by f143, 55.9 by f145 and 51.3 by
//     f147. The four-frame lead before "there" is the house rule, so the landing
//     was kept and the target missed by 6 px/frame. v1 peaked at 104.8.
//   * M2 still tilts as well as tracks, but now by 2.6 world px rather than 79:
//     with the band's bottom edge anchoring the bottom of every block, M1's and
//     M2's content centres land within three px of each other.
//   * `softFront` and `depth` are DECLARED AND UNUSED — see the experiments list
//     above. Depth bands are cut 1 only by the brief; a soft tone front would be
//     a gesture with no word in this line.
//
// ---------------------------------------------------------------------------
// THE SLEEK PASS (Sep 2026), on the director's note that the delivered set looked
// "a bit unfinished ... too static". Same concept, same beats, same words, same
// camera LANDINGS. What changes is that nothing is ever parked and every live
// line carries life. No gesture was added; the six mechanisms below are all life
// on what already existed.
//
//  1 NO PARKED CAMERA. Four drift segments through the same `runCamera`, each
//    starting from the value its move landed on so the landing cannot move, and
//    each running LINEARLY (`camDrift`) rather than on `camMove`'s smoothstep,
//    which would park the camera for the ten frames either side of the landing.
//      D1  f86-116   after "agents" — the pull-back keeps opening, k 1.000 ->
//                    0.9656, and M2 does its pan at the drifted k
//      D2  f144-156  after "there"  — M2 was a TRACK, so this one keeps tracking
//                    left, cx -900 -> -917.7. A pan also carries more life per
//                    screen px than a zoom, and this is the thinnest stretch in
//                    the piece
//      D3  f179-256  the M2b hold   — the push keeps leaning in across the six
//                    posts and the recede and ARRIVES at K_PUSH, v4's own
//                    framing, as the board resolves at eight rows: f254's
//                    framing is unchanged to the pixel and f183's is 9% wider
//      D4  f309-385  the tail       — M3 pulled back AND tracked right, so the
//                    tail continues in both, k -> 0.5205 and cx -400 -> -270
//    Measured, drift alone, on a point at the safe band's corner, over the part
//    of each hold where the move before it has settled: 1.04 / 1.33 / 1.04 /
//    1.07 screen px a frame, all inside the brief's 0.8-1.5, never 0 (`sway`
//    alone is 0.25-0.97 at the quietest frame of each hold) and never over 2
//    even at the frame's own corners (1.85 at worst, which is vignette).
//  2 SIGNAL ON EVERY LIVE LINE. A board's NEWEST post line carries one hero
//    packet running its length left -> right for the frames after it lands —
//    the post being read — at PACKET_HERO 0.6, and then nothing until the next
//    post lands. Never on a dim or receded line (PACKET_READ_MIN_OP), which is
//    why the small board carries none until it is read on "different" and none
//    again after it recedes. The posting threads ARE the packets already and are
//    untouched.
//  3 DARK TRAFFIC is NOT USED and there is nothing for it to do here: this cut
//    has no OP_DARK field. Its crowd is a band of solid dots on the ACCENT_DEEP
//    rung, which already carries the idle traffic.
//  4 ARRIVE, DON'T STOP DEAD. Every thread head and every post-line head
//    decelerates into its landing on `arriveEase` and still lands on the same
//    frame. The tail is not the helper's default 0.15 everywhere: `arriveEase`
//    cruises at (1 + 2 * tail) times nominal, and this set's heads are already
//    at or over the 45 screen px/frame ceiling at the lenses they are drawn at,
//    so each head's tail is solved from the fastest k it is ever drawn at
//    (`arriveTail`). The big board's post lines over the opening k 1.50 get 0 —
//    they already run at 54 — and everything from the resolved wide onward gets
//    the full 0.15. The fastest thread went 42.0 -> 44.0, inside the cap.
//  5 MARCHING DASHES are NOT USED: there is no dashed edge in this cut.
//  6 WAKE BEFORE YOU ACT. A posting agent's tone ramp starts WAKE_LEAD 8 frames
//    before its thread launches rather than TONE_DUR 6. Measured on the small
//    board's first post: it is fully ripe at f184 and its thread leaves at f186,
//    where before it arrived at ripe ON the launch frame.
//  + THE CROWD IS BUSY WHILE A BOARD IS RECEIVING. The idle rate lifts by
//    IDLE_BUSY_LIFT 0.3 while a thread is in the air to either board and eases
//    back over IDLE_BUSY_EASE. On this cut the signal reads 0.74-1.00 and
//    averages 0.99, because the legato solve launches the next thread ~2.7
//    frames after the previous one lands: the big board is receiving for
//    essentially the whole cut, so the lift is all but permanent here. Every
//    idle head now carries the shared `Trail` as well.
//
// MEASURED ENERGY (half-res luma motion energy per 12 frames, < 0.8 is dead):
// twelve dead blocks of thirty-three before the pass, ZERO after. The floor went
// 0.48 -> 0.85 and the three stretches the brief named — f84-108 0.77/0.78,
// f180-250 0.69-0.98, f312-386 0.53-0.68 — now read 1.04/1.26, 0.85-1.17 and
// 1.10-1.16. Nothing in the piece exceeds the 45 px/frame head cap.
// ---------------------------------------------------------------------------
//
// PERFORMANCE. The field is 3,199 seats in v2 (11,736 in v1, before the band)
// and is still not 3,199 <circle>s. Every seat is emitted as a two-arc subpath
// into a bucket chosen by its TONE STEP, so the crowd is TONE_STEPS + 1 <path>s
// whatever the seat count and the per-frame DOM stays under ~1,200 nodes. The
// one highlighted agent is the only hero <circle>.
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
    was: z.number(), // "was"
    actually: z.number(), // "actually"
    second: z.number(), // "second"
    message: z.number(), // "message"
    board: z.number(), // "board"
    established: z.number(), // "established" — M1 pulls back
    these: z.number(), // "these"
    agents: z.number(), // "agents"        — M1 has landed
    from: z.number(), // "from"            — the tempo lifts to one per 7
    july: z.number(), // "july"
    seventh: z.number(), // "7th"
    through: z.number(), // "through"
    thirteenth: z.number(), // "13th"
    five: z.number(), // "five"            — M2 tracks left
    hours: z.number(), // "hours"
    earlier: z.number(), // "earlier"
    there: z.number(), // "there"          — M2 has landed on the small board
    different: z.number(), // "different"  — the small board's ink rises
    message2: z.number(), // "message"
    board2: z.number(), // "board"
    had: z.number(), // "had"              — the six agents start posting
    number: z.number(), // "number"
    agents2: z.number(), // "agents"
    participating: z.number(), // "participating"
    but: z.number(), // "but"
    didnt: z.number(), // "didn't"         — the six agents ease back to deep
    take: z.number(), // "take"            — the small board's ink recedes
    off: z.number(), // "off"
    much: z.number(), // "much"
    sortOfLike: z.number(), // "sort of like"
    the: z.number(), // "the"
    myspace: z.number(), // "myspace"      — the MySpace mark is seated
    and: z.number(), // "and"              — M3 pulls back and tracks right
    this: z.number(), // "this"
    message3: z.number(), // "message"
    board3: z.number(), // "board"         — M3 has landed, both boards in frame
    was2: z.number(), // "was"
    facebook: z.number(), // "facebook"    — the Facebook mark is seated
    end: z.number(), // speech ends; tail to 386
  }),
});

export type Props = z.infer<typeof schema>;

// The world is far wider than the frame — the small board sits at x -900 and the
// crowd runs to x +-1700 — so the drawing surface is given its own box rather
// than leaning on `overflow: visible` for seventeen hundred px of overhang. A
// world point (x, y) still lands at (x, y) inside the camera's transform.
export const VIEW_X = -1900;
export const VIEW_Y = -2200;
export const VIEW_W = 3800;
export const VIEW_H = 4400;

// ---------------------------------------------------------------------------
// THE BOARD. A squircle panel with its bottom edge nailed to BOARD_BOTTOM and a
// height that is a COUNT: rows * ROW_PITCH + 2 * PAD. It only ever grows upward.
//
// A post's row index counts from the BOTTOM (row 0 is the oldest post and never
// moves), so the panel growing is the lip lifting off the top of the stack and
// a new line appearing under it — not a list scrolling.
// ---------------------------------------------------------------------------
// v2: the pitch went 34 -> 40 and the tempo halved. At 34 px and a landing
// every 7 frames the big board reached 55 rows by f385, which at the resolved k
// is a 17 px stripe per row — a barcode, not a count you can read. 40 px on the
// slower schedule below resolves at ~21 screen px a row and ~38 rows.
export const ROW_PITCH = 40;
export const PAD = 20;
export const POST_INSET = 12; // the post's left inset INSIDE the pad
export const BOARD_BOTTOM = 300;

export type BoardDef = { key: string; cx: number; w: number; seed: number };
export const BIG: BoardDef = { key: "big", cx: 0, w: 520, seed: 3.7 };
export const SMALL: BoardDef = { key: "small", cx: -900, w: 320, seed: 8.1 };

export const panelH = (rows: number) => rows * ROW_PITCH + 2 * PAD;
export const panelTop = (rows: number) => BOARD_BOTTOM - panelH(rows);
export const panelPath = (b: BoardDef, rows: number) => squirclePath(b.w, panelH(rows));
export const panelX0 = (b: BoardDef) => b.cx - b.w / 2;

// A post line: its y is fixed by its row index off the bottom, its x starts
// PAD + POST_INSET in, and its length is 40-75% of the inner width, hashed on
// the row index so it is stable for the life of the piece (and of cut 4).
export const postY = (row: number) => BOARD_BOTTOM - PAD - ROW_PITCH * row - ROW_PITCH / 2;
export const postX0 = (b: BoardDef) => panelX0(b) + PAD + POST_INSET;
export const postLen = (b: BoardDef, row: number) =>
  (0.4 + 0.35 * hash(row, b.seed)) * (b.w - 2 * PAD);

// One speed for every post line, so a longer post visibly takes longer — the
// same rule every line in this set is drawn by. 36 world px a frame draws the
// mean big-board post (276 px) in 7.7 frames and the longest (360) in 10, which
// is the brief's "over 6 frames" softened: a flat 6 frames would put the head at
// 90 SCREEN px a frame at the opening k 1.50, which strobes at 24fps. At 36 the
// fastest post head on screen is 54 px a frame, and it carries a `Streak`.
export const POST_SPEED = 36;
// v3: the six posts on the SMALL board are the only post lines ever drawn with
// the camera above k 1.2 — they land f192-221.5, inside M2b's k 1.35 hold — and
// 36 world px a frame is 48.6 SCREEN px a frame there, over the 45 cap. They
// draw at 32 instead, which is 43.2 at k 1.35. It is the one place in the piece
// where two post lines do not share a speed, and it is the camera that makes
// them differ, not the board: at the k the big board is ever drawn at, 36 is
// what keeps its heads inside the cap.
export const POST_SPEED_SMALL = 32;
export const GROW_DUR = 8; // frames the panel takes to grow one row, EASE_ARRIVE
export const CLICK_DUR = 4; // ink at OP 1.0 on completion
export const THREAD_FADE = 8; // ...after the row has grown

// A thread runs at the set's shared LINE_SPEED. At the opening k 1.50 that is 42
// screen px a frame, inside the 45 cap, so it is not reduced.
export const THREAD_SPEED = LINE_SPEED;
export const THREAD_LIFT = 12; // world px above the dot centre a thread starts

// ---------------------------------------------------------------------------
// THE LANDING SCHEDULE. Six rows exist at f0 and the seventh lands at f6; one
// per 16 frames until "from July 7th" (f94), one per 11 from there to the end
// of the speech (f338), one per 16 after. Defined out to LANDING_HORIZON so
// cut 4 can call `bigRowsAt(frame + 385)` past this piece's own duration.
// ---------------------------------------------------------------------------
export const ROWS0_BIG = 6;
export const ROWS0_SMALL = 2;
export const FIRST_LANDING = 6;
export const TEMPO_SLOW = 16;
export const TEMPO_FAST = 11;
export const TEMPO_F0 = 94; // "from July 7th"
export const TEMPO_F1 = 338; // speech ends
export const LANDING_HORIZON = 2000;

export const bigLandings: number[] = (() => {
  const out: number[] = [];
  let t = FIRST_LANDING;
  while (t < TEMPO_F0) {
    out.push(t);
    t += TEMPO_SLOW;
  }
  t = TEMPO_F0;
  while (t <= TEMPO_F1) {
    out.push(t);
    t += TEMPO_FAST;
  }
  t = out[out.length - 1] + TEMPO_SLOW;
  while (t <= LANDING_HORIZON) {
    out.push(t);
    t += TEMPO_SLOW;
  }
  return out;
})();

export const rowsAt = (frame: number, rows0: number, landings: number[]) => {
  let r = rows0;
  for (let n = 0; n < landings.length; n++) {
    if (frame <= landings[n]) break;
    r += ease((frame - landings[n]) / GROW_DUR, EASE_ARRIVE);
  }
  return r;
};
export const bigRowsAt = (frame: number) => rowsAt(frame, ROWS0_BIG, bigLandings);

// ---------------------------------------------------------------------------
// THE CROWD. The set's step in both axes, jitter 0.9, radius spread 0.75-1.25,
// deterministic hash. A BAND: x -1700..1700, y 380-900, with BOTH its long
// edges undulating by `wobble` (different seeds) and feathered over
// EDGE_FEATHER rows INTO the crowd, so the population thins away at the top
// into the gap under the boards and at the bottom into bare grid. Below
// CROWD_BOT there is grid and nothing else.
//
// v1 ran the seats down to whatever the widest camera could see, on the brief's
// "the bottom bleeds off the frame at every k". That made the crowd 60% of
// every frame and the boards small things floating on a sea. A band is 520
// world px whatever the lens does, so the boards stay the subject and the crowd
// is the ground they stand on. The band is 34 rows, so the two 12-row feathers
// leave ten rows of solid core in the middle — thinning margins, not a wash.
// ---------------------------------------------------------------------------
export const STEP_X = 940 / 39;
export const STEP_Y = 440 / 29;
export const CROWD_X0 = -1700;
export const CROWD_X1 = 1700;
export const CROWD_TOP = 380;
export const CROWD_BOT = 900;
export const CROWD_BAND_Y = CROWD_BOT; // the name the framings are solved against
export const EDGE_FEATHER = 12; // rows, as on the big field of cut 2 of the last clip
export const EDGE_R_MIN = 0.6;
export const EDGE_SEED = 2.1;
export const EDGE_SEED_BOT = 5.4; // the same treatment, a different wobble
export const WOB_AMP = 1.0; // in steps, via `wobble`
export const GRID_PAD = 2; // rows of grid headroom outside each nominal edge

// the nominal edges at world x, in world px
export const crowdTopAt = (x: number) => CROWD_TOP + wobble(x, EDGE_SEED) * WOB_AMP * STEP_Y;
export const crowdBotAt = (x: number) => CROWD_BOT + wobble(x, EDGE_SEED_BOT) * WOB_AMP * STEP_Y;

// ---------------------------------------------------------------------------
// THE MARKS. Simple Icons, 24-box, centred on (12,12), drawn white with the
// per-icon shadow. Sized by INK AREA against `si-openai.svg` at 108 world px:
// each path was rasterised into the same 24-unit box at 960x960 and its ink
// counted, so a mark is scaled by sqrt(inkOpenAI / inkMark) and the three marks
// lay down the same amount of white.
//
//   si-openai    ink 216.382 (of 576 square units)  factor 1.00000  ->  108.00
//   si-myspace   ink 220.754                        factor 0.99005  ->  106.93
//   si-facebook  ink 335.410                        factor 0.80320  ->   86.75
//
// A mark is placed by its INK bounding box, not its 24-box: MySpace's ink is
// 24 x 14.65 of its box and Facebook's is 24 x 23.95, so anchoring the box would
// float MySpace 30 px higher than Facebook over the same board. Its ink BOTTOM
// sits MARK_GAP world px above its board's top edge, and it rides up with the
// board as the board grows.
// ---------------------------------------------------------------------------
export const MARK_BASE = 108;
export const MARK_GAP = 60;
export const MARK_DROP = 260; // world px above the rest position a mark falls from
export const MARK_DUR = 14;

export type MarkDef = { d: string; ink: number; bboxH: number; size: number; factor: number };
const OPENAI_INK = 216.38224;
const markDef = (d: string, ink: number, bboxH: number): MarkDef => {
  const factor = Math.sqrt(OPENAI_INK / ink);
  return { d, ink, bboxH, factor, size: MARK_BASE * factor };
};

export const MYSPACE: MarkDef = markDef(
  "M19.802 12.274A3.811 3.811 0 0023.62 8.47c0-2.101-1.71-3.795-3.818-3.795a3.816 3.816 0 00-3.818 3.81 3.817 3.817 0 003.818 3.811zm-8.602.705a3.43 3.43 0 003.435-3.424A3.43 3.43 0 0011.2 6.13a3.44 3.44 0 00-3.436 3.436A3.436 3.436 0 0011.2 13zm-7.8.635c1.71 0 3.093-1.38 3.093-3.081 0-1.704-1.395-3.084-3.105-3.084A3.086 3.086 0 00.3 10.539c0 1.7 1.387 3.078 3.095 3.078zm0 .705c-1.96 0-3.4 1.717-3.4 3.495v1.196c0 .17.138.31.31.31h6.18a.31.31 0 00.309-.31v-1.196c0-1.779-1.437-3.5-3.398-3.5zm7.8-.56c-2.18 0-3.78 1.915-3.78 3.891v1.331c0 .188.156.344.345.344h6.87a.344.344 0 00.342-.344V17.65c0-1.976-1.598-3.891-3.777-3.891zm8.602-.617c-2.422 0-4.197 2.126-4.197 4.323v1.477c0 .21.172.381.382.381h7.63c.21 0 .383-.171.383-.381v-1.477c-.001-2.197-1.776-4.323-4.198-4.323z",
  220.75412,
  14.65,
);
export const FACEBOOK: MarkDef = markDef(
  "M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z",
  335.41019,
  23.95,
);

// the world y of a mark's ink bottom, and the 24-box's top-left, for a board top
export const markInkBottom = (boardTop: number) => boardTop - MARK_GAP;
export const markInkTop = (m: MarkDef, boardTop: number) =>
  markInkBottom(boardTop) - (m.bboxH / 24) * m.size;
export const markBoxTop = (m: MarkDef, inkBottom: number) =>
  inkBottom - ((12 + m.bboxH / 2) / 24) * m.size;

// ---------------------------------------------------------------------------
// THE CAMERA. Four positions on ONE damped track: the open, the pull-back that
// reveals the whole big board, the track left onto the small one, and the wide
// that holds both. cx is its own per-frame track through the same damper,
// because M2 and M3 pan 900 and 500 world px.
//
// Every framing is SOLVED from what has to be in the frame, and v2 makes the
// BLOCK the unit: the top of the subject — a mark's ink top, or a panel's top
// edge — down to the CROWD BAND'S BOTTOM EDGE, which is a real edge now that
// the crowd is a band rather than a sea. A content centre c lands at screen y
// 835 (CAM_LIFT under the middle), so a block spanning world [top, bottom] is
// centred by c = (top + bottom) / 2 and, where k is the unknown, fitted by
// k = SAFE_SPAN / (bottom - top), SAFE_SPAN 1230 being the most of screen y
// 220-1450 a block centred on 835 can use.
//
//   M0  k 1.50, the panel's six rows with their top edge at screen y 240 — the
//       four rows that land before "established" are 240 screen px of growth,
//       so the top arrives at the top of the frame on the frame M1 starts — its
//       bottom at 660, the crowd from 780 and its far edge at 1560, under the
//       captions. It is the ONE framing that is not the block solve: the block
//       is 880 world px and at k 1.50 that is 1320 screen px, 90 more than the
//       safe band holds. Its centre lands on screen 900 rather than 835 and the
//       overflow is put at the bottom, where the captions are, rather than at
//       the top, where it would take the growing panel out of frame.
//   M1  k 1.00, the big board as it is on its own landing word (11 rows at f85)
//       down to the band's bottom edge: block screen 295-1375. It grows on past
//       the band's top to screen y -36 by the frame M2 leaves
//   M2  k 1.00, cx -900, the small board as it will be at 8 rows WITH its
//       MySpace mark, down to the band: block screen 292-1378. The band's
//       bottom edge anchors both framings, so M2's tilt is now 2.6 world px
//   M2b k K_PUSH 1.28125, cx -900, the push — v4 reframes it. Its block is the
//       small board's OWN top edge at its resolved eight rows down to the
//       band's bottom, with NO mark clearance in it: 960 world px, which is
//       1296 screen px at the briefed 1.35 and so does not fit the safe band,
//       and 1230 — exactly the band — at `blockK` 1.28125. So it is a plain
//       centred block like M1 and M2: the 8-row board's top lands on TOP_Y 220
//       and the band's bottom on 1450. At two rows, which is what it has when
//       the push lands, the board runs screen 527-681, the band 784-1450 and
//       the six posting agents sit at screen 898-934. The 307 px over the
//       board is the six rows that land across f186-216
//   M3  k K_FINAL, cx -400 (the midpoint of the two boards' outer edges),
//       framing the big board at the LAST frame of the piece — the board is
//       still growing through the tail, so framing it at f312 would push the
//       Facebook mark out of the top of the frame by f386, and cut 4 blends
//       against f385. It resolves with headroom the board then grows into:
//       Facebook's ink top at screen 220 and the band's bottom at 1450.
//
// KEY WINDOWS END BEFORE THEIR LANDING. `runCamera` damps the target, so keys
// that run to the landing frame leave the camera visibly moving under the word;
// the brief's own windows (f61-84, f129-143, f286-308) all land five to twelve
// frames late through this damper. The shape, the easing and the landings are
// kept and the windows are solved backwards from them (`camsweep.ts`, `m2v2.ts`):
//   M1  keys f61-72   "agents" f85:  100.05% of the move, drifting 0.08%/frame
//   M2  keys f117-136 "there"  f147: 100.00% of the pan; 99.4% reached at f143,
//                     a four-frame lead, first moving frame f118
//   M2b keys f157-168 "had"    f183: 100.10% of the push; 99.4% reached at
//                     f178, a five-frame lead, first moving frame f158
//   M3  keys f257-304 "board"  f312:  99.93% of the move; 99.4% reached at
//                     f308, a four-frame lead, first moving frame f258
// M3 IS RE-KEYED in v4 so that it is ALREADY MOVING when the MySpace mark
// falls: its first moving frame is f258, three frames before "sort of like"
// f261 and four before the drop starts at f262, so the mark lands into a frame
// that is opening rather than into a held one. The damper is linear, so a
// move's normalised progress depends on its window and warp alone and not on
// how far it travels; swept f1 272..320 at warp 0.72 from f0 157, f257-304 is
// the LONGEST window still 99.4% landed by f308, and therefore the slowest:
// 16.3 screen px a frame of pan at f271 against v3's 46.3, and 21.9 of tilt.
// It never overshoots by more than 0.01%.
// M2 IS THE FAST MOVE and v2 opened its window: 900 world px at k 1.00 from
// f118. The damper makes peak speed and landing frame one number — swept over
// every window f117-124..170 and every warp 0.40-1.80, the floor is 61.0 screen
// px a frame to be 99.4% landed by f143, 55.9 by f145 and 51.3 by f147. The
// four-frame lead is the house rule, so this is the f143 point: 61.0 px a frame
// at f127, down from v1's 105. Every move is one deceleration lobe, monotone
// either side of its peak, no stall; see the dk table.
// ---------------------------------------------------------------------------
export const K_OPEN = 1.5;
export const K_MID = 1.0;
// K_PUSH — the push on the small board across "there was a different message
// board" — is SOLVED from its own block and so is declared with it, below.
// A block centred on screen y 835 may use 1230 px of screen y 220-1450. v2: a
// framing is now a BLOCK — the top of the subject (a mark's ink top, or a
// panel's top edge) down to the crowd band's bottom edge, which is a real edge
// now rather than a bleed. `blockCentre` is the content centre that puts that
// block on 835; `blockK` is the zoom that makes it exactly fill the safe band,
// used only where k is the unknown.
export const SAFE_SPAN = 1230;
export const TOP_Y = 835 - SAFE_SPAN / 2; // 220
export const blockCentre = (top: number, bottom: number) => (top + bottom) / 2;
export const blockK = (top: number, bottom: number) => SAFE_SPAN / (bottom - top);

export const M1_K0 = 61; // "established"
export const M1_K1 = 72;
export const M2_K0 = 117; // just after "13th" f116 — v2 opened this window
export const M2_K1 = 136;
export const M2_WARP = 0.64;
export const M2B_K0 = 157; // first moving frame f158, on "different" f160
export const M2B_K1 = 168;
// v4: M3 starts BEFORE the MySpace drop, so the mark lands into a frame that is
// already opening. Its first moving frame is f258, before "sort of like" f261,
// and the window is the LONGEST one that is still 99.4% landed by f308 — four
// frames before "board" f312 — which is also the slowest: 16.3 screen px a
// frame of pan against the 50 the brief asks for.
export const M3_K0 = 257; // first moving frame f258, before "sort of like" f261
export const M3_K1 = 304;

// ---------------------------------------------------------------------------
// SLEEK PASS — NOTHING IS EVER PARKED. Every hold and the tail carry a `camMove`
// segment of their own, authored through the same `runCamera`, starting FROM the
// value the move landed on so the landing itself cannot move. `holdDriftK` gives
// the k a hold should end on so that a world point DRIFT_REF screen px from the
// content centre keeps travelling at HOLD_DRIFT_PX a frame.
//
// A DRIFT IS AUTHORED LINEARLY, NOT EASED. `camMove` at warp 1.0 is a
// smoothstep: it starts at zero speed, swells to 1.5x its mean in the middle and
// ends at zero speed again. That is right for a MOVE and exactly wrong for a
// hold's drift — it parks the camera for the ten frames either side of the
// landing, which is the part of the hold the whole mechanism exists to fill.
// Measured that way the first version of this pass still read 0.65-0.78 of
// motion energy across f145-156, f181-192 and f313-324, all of them the slow end
// of a smoothstep. `camDrift` is `camMove`'s construction — a key per frame, cy
// taken off the key's own k so the composition cannot sag against its own zoom —
// with the ease replaced by a straight ramp, so the drift runs at ONE speed from
// the frame after the landing to the frame before the next move and the damper
// is the only thing that rounds its corners.
//
// DRIFT_REF IS 900, and the number is measured rather than chosen. A drift that
// is a zoom moves a point in proportion to its distance from the content centre,
// and this frame has two distances that matter: the safe band's corner, 780 px
// out, which is the farthest anything is ever composed, and the frame's own
// corner, 1212 px out, which is vignette. At 900 the band corner drifts at 1.04
// screen px a frame — inside the brief's 0.8-1.5 — and the frame's own corners
// at 1.62, which with `sway` on top stays under the "never > 2".
export const DRIFT_REF = 900;

// `camMove`'s construction with a LINEAR ramp in place of `camEase`. Everything
// else about it is the same: a key per frame so `interpolate` never has to guess
// between two of them, and CY taken off THIS key's k rather than interpolated
// between the endpoints.
export const camDrift = ({
  f0,
  f1,
  k0,
  k1,
  c0,
  c1,
}: {
  f0: number;
  f1: number;
  k0: number;
  k1: number;
  c0: number;
  c1: number;
}) => {
  if (f1 <= f0) throw new Error(`camDrift: f${f0}-${f1} is not a forward drift`);
  const F: number[] = [];
  const K: number[] = [];
  const CY: number[] = [];
  const span = f1 - f0;
  for (let i = 0; i <= span; i++) {
    const g = i / span;
    const k = k0 + (k1 - k0) * g;
    F.push(f0 + i);
    K.push(k);
    CY.push(c0 + (c1 - c0) * g + CAM_LIFT / k);
  }
  return { F, K, CY };
};

export const D1_F0 = 86; // after M1 lands on "agents" f85
export const D1_F1 = 116; // ...to the frame before M2's first key
export const D2_F0 = 144; // after M2 is 99.4% landed at f143
export const D2_F1 = 156; // ...to the frame before M2b's first key
export const D3_F0 = 179; // after M2b is 99.4% landed at f178
export const D3_F1 = 256; // ...to the frame before M3's first key
export const D4_F0 = 309; // after M3 is 99.4% landed at f308
export const D4_F1 = DURATION - 1; // ...the tail, to the frame cut 4 opens on

// The two holds in the first half continue M1's pull-back: the lens keeps
// opening across "these agents" and again across "hours earlier". M2 itself
// holds the drifted k and does its pan at it.
export const K_DRIFT1 = holdDriftK(K_MID, D1_F1 - D1_F0, DRIFT_REF, -1);
// D2 CONTINUES A PAN, NOT A ZOOM. M1 was a pull-back, so the hold after it keeps
// opening; M2 is a TRACK LEFT, so the hold after IT keeps tracking left. A pan
// also happens to be the drift that carries the most life per screen px: a zoom
// leaves the middle of the frame standing still and only moves its edges, and
// the stretch after "there" is a dim two-row board on a band of dots with the
// big board out of frame — the thinnest stretch in the piece, and the one v2 and
// v3 both flagged. Authored as the world px that move the frame HOLD_DRIFT_PX a
// frame at the k the hold is held at; `holdDriftK`'s screenDist has no meaning
// for a pan, because a pan moves every point in the frame by the same amount.
// DRIFT_SHORT_GAIN is the damper, not taste. `runCamera` needs about a dozen
// frames to reach a ramp's steady rate, so a thirteen-frame hold handed the
// nominal rate delivers ~0.85 of it; measured on the built track, 1.18 lands the
// drift on HOLD_DRIFT_PX. The long holds do not need it and do not get it.
export const DRIFT_SHORT_GAIN = 1.18;
export const CX_DRIFT2 =
  SMALL.cx - (HOLD_DRIFT_PX * DRIFT_SHORT_GAIN * (D2_F1 - D2_F0)) / K_DRIFT1;
// The tail's two halves are solved with K_FINAL, below, where it exists.

// The number of rows a board has FULLY gained by a frame — the count the
// framings are solved against.
export const rowsAtInt = (frame: number, rows0: number, landings: number[]) => {
  let r = rows0;
  for (let n = 0; n < landings.length; n++) {
    if (frame <= landings[n]) break;
    r += 1;
  }
  return r;
};

// M0: the panel's top edge sits where it will still be ON SCREEN at the frame
// M1 takes over. Four rows land between f0 and "established" (f61) and a row is
// ROW_PITCH * K_OPEN screen px, so the top starts exactly that far down and
// arrives at the top of the frame on the frame the pull-back starts. It is the
// one framing in the piece that is not the block solve, and this is why. It
// falls out 65 screen px below a centred block, and the 90 px the block
// overflows the safe band at this k all goes to the bottom, under the captions.
export const OPEN_LANDINGS = bigLandings.filter((f) => f < 61).length; // 4
export const OPEN_TOP_Y = OPEN_LANDINGS * ROW_PITCH * K_OPEN; // 240
export const CONTENT_OPEN = panelTop(ROWS0_BIG) + (835 - OPEN_TOP_Y) / K_OPEN;

// M1: the big board as it is ON ITS LANDING WORD, "agents" (f85), down to the
// band's bottom edge. Framing it on the state it reaches at f129 instead would
// leave 300 screen px of empty sky over it at f85 and fill only as M2 takes the
// lens away. It keeps growing after the landing and its top edge is at screen
// y -36 by the time M2 leaves — out of the frame, which is the gesture.
export const CONTENT_M1 = blockCentre(
  panelTop(rowsAtInt(85, ROWS0_BIG, bigLandings)),
  CROWD_BAND_Y,
);

// M2: the small board at its resolved eight rows, with MySpace sitting over it
export const SMALL_ROWS_FINAL = ROWS0_SMALL + 6;
export const SMALL_BLOCK_TOP = markInkTop(MYSPACE, panelTop(SMALL_ROWS_FINAL));
export const CONTENT_M2 = blockCentre(SMALL_BLOCK_TOP, CROWD_BAND_Y);

// M2b: the push. v4 makes its block the small board's OWN top edge down to the
// band's bottom — the mark's clearance is NOT in it. v3 reserved that clearance
// and it cost 185 world px of sky the mark did not arrive in until f276; the
// mark now lands into the frame M3 is already opening (see M3 below), so the
// push can frame the thing that is actually happening: the board and the band
// the six agents post from.
//
// The block is 960 world px, which at the briefed k 1.35 is 1296 screen px
// against a safe band of 1230 — it does not fit — so the push stops at the k
// that DOES fit, `blockK` = 1.28125, inside the brief's floor of 1.25. That
// makes it a plain centred block, the only framing rule in the piece: the
// RESOLVED eight-row board's top edge lands exactly on TOP_Y 220 and the band's
// bottom edge exactly on 1450. At two rows the board sits at screen 527-681
// with the band at 784-1450 under it, and the 307 px above it is the six rows
// that land across f186-216 — growth room, filled by the gesture, not sky.
export const M2B_BLOCK_TOP = panelTop(SMALL_ROWS_FINAL);
export const K_PUSH = Math.min(1.35, blockK(M2B_BLOCK_TOP, CROWD_BAND_Y));
export const CONTENT_M2B = blockCentre(M2B_BLOCK_TOP, CROWD_BAND_Y);

// SLEEK PASS — THE PUSH LANDS SHORT AND KEEPS LEANING IN. M2b's framing is
// exactly full: the resolved eight-row board's top edge lands on TOP_Y 220 and
// the band's bottom edge on 1450, so a push drift ON TOP of K_PUSH would take
// both out of the safe band. It is inverted instead: M2b lands on K_PUSH_LAND,
// which is K_PUSH less the drift, and the hold across the six posts and the
// recede carries it the rest of the way, arriving at K_PUSH — the framing v4
// solved — exactly as the board resolves at eight rows. The camera leans in on
// the posts, which is what the hold is for, and f254 ("much") is the frame it
// was solved for, unchanged. K_PUSH itself is untouched, so nothing that imports
// it moves.
export const K_PUSH_LAND = K_PUSH / (1 + (HOLD_DRIFT_PX * (D3_F1 - D3_F0)) / DRIFT_REF);

// M3: the big board at the LAST frame of the piece, with Facebook over it. This
// is the one framing where k is the unknown: the block runs from the mark's ink
// top down to the crowd band's bottom edge and has to fit the safe band.
export const BIG_ROWS_END = rowsAtInt(DURATION, ROWS0_BIG, bigLandings);
export const CONTENT_TOP_FINAL = markInkTop(FACEBOOK, panelTop(BIG_ROWS_END));
export const K_FINAL = blockK(CONTENT_TOP_FINAL, CROWD_BAND_Y);
export const CONTENT_FINAL = blockCentre(CONTENT_TOP_FINAL, CROWD_BAND_Y);
export const CX_FINAL = (SMALL.cx - SMALL.w / 2 + (BIG.cx + BIG.w / 2)) / 2;

// SLEEK PASS — THE TAIL. M3 pulled back AND tracked right, so the tail continues
// in both its axes and the drift budget is split between them. The zoom carries
// the brief's own K_FINAL -> ~0.52, a 2.4% open, which on its own is 0.3 screen
// px a frame at DRIFT_REF over these 76 frames; the pan carries the rest, and it
// costs the framing nothing because a pan moves every point in the frame by the
// same amount instead of shrinking the board. `holdDriftK` on its own would have
// asked for a 9.1% open here, which takes a row from 21.3 screen px down to
// 19.4 and undoes cut 3's own v2 pass. Measured at f385: the small board's left
// edge is 144 screen px inside the frame, the big board's right edge 831, the
// block 244-1426 inside the safe band, and a row is 20.5 screen px.
export const TAIL_OPEN = 0.024; // the fraction of K_FINAL the tail keeps opening by
export const K_TAIL = K_FINAL * (1 - TAIL_OPEN);
export const TAIL_PAN = 130; // world px further right, continuing M3's own track
export const CX_TAIL = CX_FINAL + TAIL_PAN;

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
  // SLEEK PASS — a hold's drift, run through `camDrift` (a straight ramp) rather
  // than `camMove` (a smoothstep), so it does not park at either end. Optional;
  // a segment without it is the eased move it always was.
  drift?: boolean;
};

export const CAM_SEGS: CamSeg[] = [
  // M1 "established by these agents" — the pull-back onto the whole board
  {
    f0: M1_K0,
    f1: M1_K1,
    k0: K_OPEN,
    k1: K_MID,
    c0: CONTENT_OPEN,
    c1: CONTENT_M1,
    x0: BIG.cx,
    x1: BIG.cx,
    warp: 0.72,
  },
  // D1 the hold after "agents" — the pull-back keeps opening
  {
    f0: D1_F0,
    f1: D1_F1,
    k0: K_MID,
    k1: K_DRIFT1,
    c0: CONTENT_M1,
    c1: CONTENT_M1,
    x0: BIG.cx,
    x1: BIG.cx,
    warp: 1,
    drift: true,
  },
  // M2 "five hours earlier" — track left onto the small board, at the drifted k
  {
    f0: M2_K0,
    f1: M2_K1,
    k0: K_DRIFT1,
    k1: K_DRIFT1,
    c0: CONTENT_M1,
    c1: CONTENT_M2,
    x0: BIG.cx,
    x1: SMALL.cx,
    warp: M2_WARP,
  },
  // D2 the hold after "there" — the track keeps going left, into the push
  {
    f0: D2_F0,
    f1: D2_F1,
    k0: K_DRIFT1,
    k1: K_DRIFT1,
    c0: CONTENT_M2,
    c1: CONTENT_M2,
    x0: SMALL.cx,
    x1: CX_DRIFT2,
    warp: 1,
    drift: true,
  },
  // M2b "there was a different message board" — the push onto the small board
  {
    f0: M2B_K0,
    f1: M2B_K1,
    k0: K_DRIFT1,
    k1: K_PUSH_LAND,
    c0: CONTENT_M2,
    c1: CONTENT_M2B,
    x0: CX_DRIFT2,
    x1: SMALL.cx,
    warp: 0.72,
  },
  // D3 the hold across the six posts and the recede — the push keeps leaning in,
  // arriving at K_PUSH, v4's own framing, as the board resolves at eight rows
  {
    f0: D3_F0,
    f1: D3_F1,
    k0: K_PUSH_LAND,
    k1: K_PUSH,
    c0: CONTENT_M2B,
    c1: CONTENT_M2B,
    x0: SMALL.cx,
    x1: SMALL.cx,
    warp: 1,
    drift: true,
  },
  // M3 "and this message board" — out and right, both boards in one frame
  {
    f0: M3_K0,
    f1: M3_K1,
    k0: K_PUSH,
    k1: K_FINAL,
    c0: CONTENT_M2B,
    c1: CONTENT_FINAL,
    x0: SMALL.cx,
    x1: CX_FINAL,
    warp: 0.72,
  },
  // D4 the tail — the pull-back keeps opening and the track keeps going right
  {
    f0: D4_F0,
    f1: D4_F1,
    k0: K_FINAL,
    k1: K_TAIL,
    c0: CONTENT_FINAL,
    c1: CONTENT_FINAL,
    x0: CX_FINAL,
    x1: CX_TAIL,
    warp: 1,
    drift: true,
  },
];

// One track: a key per frame inside a move, one held key in each gap, so a hold
// is a hold and not a slow ramp into the next key.
export const CAM = (() => {
  const F: number[] = [0];
  const K: number[] = [K_OPEN];
  const CY: number[] = [CONTENT_OPEN + CAM_LIFT / K_OPEN];
  const CX: number[] = [BIG.cx];
  const hold = (f: number) => {
    F.push(f);
    K.push(K[K.length - 1]);
    CY.push(CY[CY.length - 1]);
    CX.push(CX[CX.length - 1]);
  };
  CAM_SEGS.forEach((s) => {
    if (s.f0 > F[F.length - 1] + 1) hold(s.f0 - 1);
    // a drift ramps straight; a move is eased. Both emit a key per frame into
    // the same track, and cx takes the same profile as k and cy.
    const m = s.drift ? camDrift(s) : camMove(s);
    m.F.forEach((f, i) => {
      const g = i / (s.f1 - s.f0);
      F.push(f);
      K.push(m.K[i]);
      CY.push(m.CY[i]);
      CX.push(s.x0 + (s.x1 - s.x0) * (s.drift ? g : camEase(g, s.warp)));
    });
  });
  if (F[F.length - 1] < DURATION) hold(DURATION);
  for (let i = 1; i < F.length; i++) {
    if (F[i] <= F[i - 1]) {
      throw new Error(`SecondMessageBoard: the camera's moves overlap at f${F[i]}`);
    }
  }
  return { F, K, CY, CX };
})();

// SLEEK PASS — the damped track, resolved once at module scope. The arrive-eases
// below have to know the lens a head is drawn at before the head exists, and the
// tail's last frame is what cut 4 opens on, so both are read off this table
// rather than off the frame.
export const CAM_K: number[] = (() => {
  const out: number[] = [];
  for (let f = 0; f <= DURATION; f++) out.push(runCamera(f, CAM.F, CAM.CY, CAM.K).k);
  return out;
})();
export const camK = (f: number) => CAM_K[clampi(Math.round(f), 0, DURATION)];
export const kMaxOver = (f0: number, f1: number) => {
  let m = 0;
  for (let f = Math.floor(f0); f <= Math.ceil(f1); f++) m = Math.max(m, camK(f));
  return m;
};

// THE LAST FRAME'S CAMERA. Cut 4 opens on it, and with the tail drifting it is
// no longer K_FINAL / CONTENT_FINAL / CX_FINAL. Exported so cut 4 opens on the
// state this piece actually ends in rather than on the state it was framed for.
export const CAM_LAST = (() => {
  const a = runCamera(DURATION - 1, CAM.F, CAM.CY, CAM.K);
  const b = runCamera(DURATION - 1, CAM.F, CAM.CX, CAM.K);
  return { k: a.k, cy: a.cy, cx: b.cy };
})();
export const CONTENT_LAST = CAM_LAST.cy - CAM_LIFT / CAM_LAST.k;

// SLEEK PASS — ARRIVE, DON'T STOP DEAD, AND THE CEILING THAT DECIDES HOW MUCH.
// `arriveEase(u, tail)` cruises at (1 + 2 * tail) times the nominal speed and
// then decelerates over the last `tail` of the DISTANCE, landing on the same
// frame. At the default tail 0.15 the cruise is 1.3x — and this set's heads are
// already at or over the 45 screen px/frame ceiling at the lenses they are drawn
// at, so the tail is solved per head from the fastest k it is ever drawn at
// rather than taken as 0.15 everywhere. A head that already runs at the ceiling
// gets no ease at all, and that is arithmetic, not taste: the only other way to
// decelerate it is to start it earlier, which moves the launch.
// 44, one px under the set's own 45: a tail solved exactly to the ceiling puts
// the cruise ON it, and a head that reads as "at the cap" is not the same thing
// as one inside it. At 44 the fastest thread in the piece runs 44.0 rather than
// the 42.0 it ran before the ease, and it now decelerates into the panel.
export const SPEED_CAP = 44;
export const ARRIVE_TAIL_MAX = 0.15;
export const arriveTail = (speed: number, kMax: number) =>
  Math.max(0, Math.min(ARRIVE_TAIL_MAX, (SPEED_CAP / (speed * kMax) - 1) / 2));

// THE MYSPACE DROP is solved from the framing the mark actually falls through,
// and in v4 that framing is MOVING: M3 starts at f258 and the mark is drawn from
// f262, so the camera is four frames into its pull-back when the drop begins and
// the whole gesture is "the frame opens and the mark lands into it".
//
// At f262 the camera is k 1.2576 on content centre 398.73, so the mark's RESTING
// ink top — world -185.27, 60 world px of air over the eight-row board — is on
// screen y 100.6, and there is only that much frame above it. The shared
// MARK_DROP 260 would start the ink top on screen -226.4, the whole mark outside
// the frame for the first frames of its fall; v3's own solve, 148.3 world px at
// the old K_PUSH, would start it on -85.9, still outside. So MARK_DROP is NOT
// restored for MySpace: the drop is re-solved against the real camera at f262 to
// the fall that starts its ink top MARK_EDGE screen px INSIDE the top edge,
// which is 56.1 world px. On screen the mark still travels 476 px across its
// fourteen frames — 70 of them its own fall, the rest the frame opening under
// it — and peaks at 36.9 screen px a frame, inside the 45 cap. MARK_DROP itself
// is untouched: the Facebook drop, the one EASE_PAYOFF, still falls the full 260
// at K_FINAL.
//
// MARK_EDGE 30 also carries `sway`, which is 5.9 screen px at f262: the mark's
// ink top is measured on screen 24.1 in the rendered frame, still inside.
export const MARK_EDGE = 30; // screen px of clearance inside the frame's top
export const MYSPACE_F0 = 276 - MARK_DUR; // "myspace" f276 less the descent
export const MYSPACE_DROP = (() => {
  const c = runCamera(MYSPACE_F0, CAM.F, CAM.CY, CAM.K);
  const centre = c.cy - CAM_LIFT / c.k;
  const rest = markInkTop(MYSPACE, panelTop(SMALL_ROWS_FINAL));
  return rest - (centre + (MARK_EDGE - 835) / c.k);
})();

// The grid the band is cut out of: GRID_PAD rows of headroom outside each
// nominal edge, so both wobbles always have seats to take and the feather is
// never truncated by the lattice running out.
export const SEAT_Y0 = CROWD_TOP - GRID_PAD * STEP_Y;
export const SEAT_Y1 = CROWD_BOT + GRID_PAD * STEP_Y;

export const COLS = Math.round((CROWD_X1 - CROWD_X0) / STEP_X) + 1;
export const GRID_X0 = (CROWD_X0 + CROWD_X1) / 2 - ((COLS - 1) * STEP_X) / 2;
export const GRID_Y0 = SEAT_Y0;
export const ROWS = Math.round((SEAT_Y1 - GRID_Y0) / STEP_Y) + 1;

export type Seat = { x: number; y: number; r: number; rs: number; gc: number; gr: number };
export const SEATS: Seat[] = (() => {
  const out: Seat[] = [];
  for (let gr = 0; gr < ROWS; gr++) {
    for (let gc = 0; gc < COLS; gc++) {
      const i = gr * COLS + gc;
      const x = GRID_X0 + gc * STEP_X + (hash(i, 11) - 0.5) * STEP_X * 0.9;
      const y = GRID_Y0 + gr * STEP_Y + (hash(i, 12) - 0.5) * STEP_Y * 0.9;
      // both long edges, same treatment, different wobble: the nearer edge wins
      const fe = Math.min(
        feather((y - crowdTopAt(x)) / STEP_Y, EDGE_FEATHER),
        feather((crowdBotAt(x) - y) / STEP_Y, EDGE_FEATHER),
      );
      if (hash(i, 71) >= fe) continue;
      out.push({
        x,
        y,
        r: 0.75 + 0.5 * hash(i, 13),
        rs: EDGE_R_MIN + (1 - EDGE_R_MIN) * fe,
        gc,
        gr,
      });
    }
  }
  return out;
})();
export const NSEAT = SEATS.length;

// grid cell -> seat, so idle traffic and the post solver can find a seat without
// a search over the whole field
export const SEAT_AT = new Int32Array(COLS * ROWS).fill(-1);
SEATS.forEach((s, i) => {
  SEAT_AT[s.gr * COLS + s.gc] = i;
});

// the nearest real seat to a world point, by a short spiral out from its cell
export const seatNear = (x: number, y: number) => {
  const gc0 = clampi(Math.round((x - GRID_X0) / STEP_X), 0, COLS - 1);
  const gr0 = clampi(Math.round((y - GRID_Y0) / STEP_Y), 0, ROWS - 1);
  let best = -1;
  let bestD = Infinity;
  for (let rad = 0; rad < 14 && best < 0; rad++) {
    for (let dr = -rad; dr <= rad; dr++) {
      for (let dc = -rad; dc <= rad; dc++) {
        if (Math.max(Math.abs(dr), Math.abs(dc)) !== rad) continue;
        const gc = gc0 + dc;
        const gr = gr0 + dr;
        if (gc < 0 || gc >= COLS || gr < 0 || gr >= ROWS) continue;
        const i = SEAT_AT[gr * COLS + gc];
        if (i < 0) continue;
        const d = Math.hypot(SEATS[i].x - x, SEATS[i].y - y);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      }
    }
  }
  return best < 0 ? 0 : best;
};

// ---------------------------------------------------------------------------
// THE POSTS. One per landing. The agent's x is hashed across the board's own
// width (so the thread is always under the panel it posts to) and its DEPTH is
// SOLVED rather than placed: the thread has to leave LEGATO frames before the
// previous post line's last frame, so the travel it needs is
//   travel = landing(n) - (landing(n-1) + len(n-1) / POST_SPEED - LEGATO)
// and the agent sits that many frames of THREAD_SPEED below the panel. A faster
// tempo therefore posts from SHALLOWER seats, which is the tempo encoded twice.
// The travel is clamped to TRAVEL_MIN..TRAVEL_MAX so the agent is always inside
// the crowd, and the launch is then re-read off the seat the solve actually
// snapped to, never off the number that was asked for.
// ---------------------------------------------------------------------------
export const TRAVEL_MIN = 6;
export const TRAVEL_MAX = 13;
export const TRAVEL_FLAT = 5; // when legato is off, and for the first post

export type Post = {
  board: BoardDef;
  row: number;
  landing: number; // the frame the row grows and the post line starts drawing
  launch: number; // the frame the thread leaves its agent
  seat: number;
  x: number;
  y: number; // the agent's seat
  baseY: number; // where the thread starts, THREAD_LIFT above the dot
  len: number; // the post line's length
  end: number; // the frame the post line finishes
};

const solvePost = (b: BoardDef, row: number, launch: number, wantTravel: number) => {
  const len = postLen(b, row);
  const travel = Math.max(TRAVEL_MIN, Math.min(TRAVEL_MAX, wantTravel));
  const wantX = b.cx + (hash(row, b.seed + 17) - 0.5) * (b.w - 48);
  const wantY = BOARD_BOTTOM + travel * THREAD_SPEED + THREAD_LIFT;
  const seat = seatNear(wantX, wantY);
  const s = SEATS[seat];
  const baseY = s.y - THREAD_LIFT;
  // the launch and the landing are re-read off the seat the solve actually
  // snapped to, never off the travel that was asked for
  const actual = (baseY - BOARD_BOTTOM) / THREAD_SPEED;
  const landing = launch + actual;
  return { row, len, seat, x: s.x, y: s.y, baseY, launch, landing, end: landing + len / POST_SPEED };
};

// The big board: the LANDINGS are the schedule, so the launch is solved back
// from them through the legato rule.
const buildBigPosts = (legato: boolean): Post[] => {
  const out: Post[] = [];
  bigLandings.forEach((landing, n) => {
    const row = ROWS0_BIG + n;
    const want =
      legato && n > 0 ? landing - legatoStart(out[n - 1].end) : TRAVEL_FLAT;
    const p = solvePost(BIG, row, 0, want);
    // solvePost worked in travel; place it on this landing
    const actual = (p.baseY - BOARD_BOTTOM) / THREAD_SPEED;
    out.push({ ...p, board: BIG, launch: landing - actual, landing, end: landing + p.len / POST_SPEED });
  });
  return out;
};

// The small board: the brief fixes the frames its threads LEAVE, so its
// landings are read off the seats instead of the other way round.
export const SMALL_LAUNCH = [186, 192, 198, 204, 210, 216];
export const SMALL_POSTS: Post[] = SMALL_LAUNCH.map((launch, n) => {
  const p = solvePost(SMALL, ROWS0_SMALL + n, launch, TRAVEL_FLAT);
  // `end` is re-read off the speed these six actually draw at, so the export
  // stays true: they are the piece's only posts on POST_SPEED_SMALL.
  return { ...p, board: SMALL, end: p.landing + p.len / POST_SPEED_SMALL };
});
export const smallLandings = SMALL_POSTS.map((p) => p.landing);
export const smallRows = (frame: number) => rowsAt(frame, ROWS0_SMALL, smallLandings);

export const BIG_POSTS_LEGATO = buildBigPosts(true);
export const BIG_POSTS_FLAT = buildBigPosts(false);

// SLEEK PASS — the arrive tail of every head in the piece, solved once from the
// fastest k that head is ever drawn at. Index-aligned with the arrays above.
//
// CUT 4 IMPORTS THESE FOR CUT 3'S OWN POSTS rather than solving them against its
// own camera, so the two cuts draw the shared big board's newest post line
// IDENTICALLY on the frame they share. Past this piece's own duration `camK`
// clamps to the tail's k 0.520; cut 4's fastest lens is K_M2 0.80-0.84, and both
// land on the full 0.15 for every post after ~f120, so the clamp costs nothing.
const threadTails = (posts: Post[]) =>
  posts.map((p) => arriveTail(THREAD_SPEED, kMaxOver(p.launch, p.landing)));
export const BIG_THREAD_TAIL_LEGATO = threadTails(BIG_POSTS_LEGATO);
export const BIG_THREAD_TAIL_FLAT = threadTails(BIG_POSTS_FLAT);
export const BIG_POST_TAIL = BIG_POSTS_LEGATO.map((p) =>
  arriveTail(POST_SPEED, kMaxOver(p.landing, p.end)),
);
export const SMALL_THREAD_TAIL = threadTails(SMALL_POSTS);
export const SMALL_POST_TAIL = SMALL_POSTS.map((p) =>
  arriveTail(POST_SPEED_SMALL, kMaxOver(p.landing, p.end)),
);

// The one highlight in the cut: the agent of the landing scheduled nearest the
// briefed f324, which on this tempo is f325.
export const HIGHLIGHT_LANDING = bigLandings.reduce((a, b) =>
  Math.abs(b - 324) < Math.abs(a - 324) ? b : a,
);

// ---------------------------------------------------------------------------
// The small board's two opacity ramps, and the six agents' recede.
// ---------------------------------------------------------------------------
export const SMALL_READ_DUR = 12; // OP_RECEDE -> OP_READ, on "different"
export const SMALL_DIM_DUR = 16; // OP_READ -> OP_RECEDE, on "take"
export const SMALL_RECEDE_SPREAD = 12 - TONE_DUR; // the six go dark across this

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
  // The shared rate, 180 threads per 1,200 agents, applied to the band's 3,199
  // seats: no cap needed any more. v1's field was 11,736 seats and had to be
  // capped; a band is small enough to carry the standard rate outright, and any
  // one camera position holds about a third of it.
  idleThreadCount: 480,
  experiments: {},
  beats: {
    was: 9,
    actually: 12,
    second: 36,
    message: 44,
    board: 55,
    established: 61,
    these: 78,
    agents: 85,
    from: 94,
    july: 99,
    seventh: 105,
    through: 113,
    thirteenth: 116,
    five: 129,
    hours: 133,
    earlier: 138,
    there: 147,
    different: 160,
    message2: 166,
    board2: 172,
    had: 183,
    number: 189,
    agents2: 196,
    participating: 201,
    but: 223,
    didnt: 231,
    take: 238,
    off: 241,
    much: 251,
    sortOfLike: 261,
    the: 270,
    myspace: 276,
    and: 286,
    this: 294,
    message3: 300,
    board3: 312,
    was2: 318,
    facebook: 324,
    end: 338,
  },
});

// ---------------------------------------------------------------------------
// THE IDLE TRAFFIC, as an exported schedule rather than a loop inside the
// component, because cut 4 opens on this same crowd one frame after this piece
// ends and its ambient has to BE this ambient: the same periods, the same hashed
// seats, the same head-led draw, the same 0.4 accent. Cut 4 calls it with
// `frame + 385`.
// ---------------------------------------------------------------------------
export type IdleThread = {
  key: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  op: number;
  head: number;
  // SLEEK PASS — where this thread's head was, so it can carry the shared
  // `Trail` like every other moving head in the set. Null outside its own cycle,
  // which is what `Trail` wants for a head that did not exist yet.
  at: (f: number) => { x: number; y: number } | null;
};

export const IDLE_REACH = 5; // cells, so a thread is always short and local
export const IDLE_OP = 0.4;

// SLEEK PASS — THE CROWD IS BUSY WHILE A BOARD IS RECEIVING. The idle rate lifts
// by IDLE_BUSY_LIFT while a thread is in the air to a board and eases back to 1x
// over IDLE_BUSY_EASE frames either side of it. The lift is a POOL of extra
// threads appended past `count`, each gated by the same signal, so the first
// `count` threads are bit-for-bit the threads this field has always had and a
// boost of 0 reproduces the old call exactly.
//
// Cut 4 computes the same signal from the same flights, so the shared frame is
// the same frame in both pieces.
export const IDLE_BUSY_LIFT = 0.3;
export const IDLE_BUSY_EASE = 6;
export type Flight = { launch: number; landing: number };
export const busyAt = (frame: number, flights: Flight[]) => {
  let v = 0;
  for (let i = 0; i < flights.length && v < 1; i++) {
    const f = flights[i];
    const d = frame < f.launch ? f.launch - frame : frame > f.landing ? frame - f.landing : 0;
    if (d < IDLE_BUSY_EASE) v = Math.max(v, smoothstep(1 - d / IDLE_BUSY_EASE));
  }
  return v;
};

export const idleTraffic = (frame: number, count: number, boost = 0) => {
  const lit = new Float32Array(NSEAT);
  const threadEls: IdleThread[] = [];
  const total = count + Math.round(count * IDLE_BUSY_LIFT);
  for (let j = 0; j < total; j++) {
    // the first `count` threads are the field's own; the rest are the busy pool
    const gate = j < count ? 1 : boost;
    if (gate <= 0.02) continue;
    const period = 44 - 12 * hash(j, 4);
    const local = frame + hash(j, 5) * period;
    const cycle = Math.floor(local / period);
    const phase = (local - cycle * period) / period;
    const seed = j * 131 + cycle * 7;
    const a = Math.floor(hash(seed, 6) * NSEAT);
    const sa = SEATS[a];
    const bc = clampi(sa.gc + Math.round((hash(seed, 7) - 0.5) * 2 * IDLE_REACH), 0, COLS - 1);
    const br = clampi(sa.gr + Math.round((hash(seed, 8) - 0.5) * 2 * IDLE_REACH), 0, ROWS - 1);
    const b = SEAT_AT[br * COLS + bc];
    if (b < 0 || b === a) continue;
    const sb = SEATS[b];
    const dn = ease(phase / 0.3, EASE_ARRIVE);
    const fade = clamp01((1 - phase) / 0.45);
    if (fade <= 0.02) continue;
    lit[a] = Math.max(lit[a], fade * gate);
    lit[b] = Math.max(lit[b], dn * fade * gate);
    threadEls.push({
      key: `i${j}`,
      x1: sa.x,
      y1: sa.y,
      x2: sa.x + (sb.x - sa.x) * dn,
      y2: sa.y + (sb.y - sa.y) * dn,
      op: IDLE_OP * fade * gate,
      head: dn,
      // this thread's head at any frame INSIDE its own cycle; null outside it,
      // where the pair of seats it runs between is a different pair
      at: (f: number) => {
        const lf = f + hash(j, 5) * period;
        if (Math.floor(lf / period) !== cycle) return null;
        const ph = (lf - cycle * period) / period;
        const d = ease(ph / 0.3, EASE_ARRIVE);
        return { x: sa.x + (sb.x - sa.x) * d, y: sa.y + (sb.y - sa.y) * d };
      },
    });
  }
  return { threadEls, lit };
};

// A mark, with its own trail. `Trail` draws CIRCLES at a head's last positions,
// which on a 90 px brand mark reads as a stray dot rather than a smear, so the
// mark smears with GHOSTS OF ITSELF instead — the same TRAIL_FRAMES positions at
// the same TRAIL_OPACITY ladder, scaled by the same `trailFactor` of its screen
// speed. Nothing about the smear is invented; only the shape being smeared.
export const MarkGlyph: React.FC<{
  mark: MarkDef;
  cx: number;
  at: (f: number) => number; // the ink bottom at a frame
  frame: number;
  k: number;
  ink: string;
  icon: string;
  trails: boolean;
}> = ({ mark, cx, at, frame, k, ink, icon, trails }) => {
  // anchored on the INK BOTTOM at every scale, so a ghost shrinks toward the
  // point the mark is aiming at rather than drifting off it
  const place = (y: number, scale: number) => {
    const size = mark.size * scale;
    return `translate(${cx - size / 2} ${y - ((12 + mark.bboxH / 2) / 24) * size}) scale(${
      size / 24
    })`;
  };
  const speed = Math.abs(at(frame) - at(frame - 1)) * k;
  const factor = trails ? trailFactor(speed) : 0;
  return (
    <g style={{ filter: icon }}>
      {factor > 0
        ? TRAIL_OPACITY.slice(0, TRAIL_FRAMES).map((op, i) => (
            <path
              key={i}
              d={mark.d}
              transform={place(at(frame - (i + 1)), 1 - 0.06 * (i + 1))}
              fill={ink}
              opacity={op * factor}
            />
          ))
        : null}
      <path d={mark.d} transform={place(at(frame), 1)} fill={ink} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE PANEL, as a component, because cut 4 draws the same two boards. It owns
// the squircle, every post line, the head-led draw at one speed, the white tip,
// the click and the `Streak` — everything about a board that must not drift
// between the two cuts.
// ---------------------------------------------------------------------------
// SLEEK PASS — `tail` is the arrive-ease this post line's head decelerates over,
// solved by the caller from the fastest k the line is drawn at (see
// `arriveTail`). Optional and defaulting to 0, so a `PostDraw` written before
// this field existed draws exactly as it did.
export type PostDraw = { row: number; len: number; from: number; tail?: number };

// SLEEK PASS — SIGNAL ON THE NEWEST POST. A board's newest post line, for the
// frames after it finishes drawing, carries ONE hero packet running its length
// left -> right: the post being read. Then nothing, until the next post lands.
// `PACKET_PERIOD` is the window rather than a rate — the packet's own travel
// (a post is 112-360 world px at PACKET_SPEED 26, so 4.3-13.8 frames) is always
// shorter than it, so `packetsOn` fires exactly once inside the window and the
// next launch it would make falls outside it. The phase cancels the helper's own
// hashed offset so the launch lands on the frame the line finished.
export const PACKET_READ_MIN_OP = 0.6; // no signal on a dim or receded line

export const Board: React.FC<{
  board: BoardDef;
  rows: number; // fractional: the panel's height while a row is growing
  posts: PostDraw[];
  inkOp: number;
  ink: string;
  icon: string;
  frame: number;
  k: number;
  trails: boolean;
  // v3: the small board's six posts draw slower, because they are the only post
  // lines in the piece ever drawn with the camera above k 1.2. Optional, and it
  // defaults to the shared POST_SPEED, so a board drawn without it is the board
  // that was drawn before this argument existed.
  speed?: number;
  // SLEEK PASS — the two experiment switches this unit honours. `packets` is
  // OPT-IN and defaults to OFF: this component is shared with pieces that are
  // not this pair's, and a default of on would put a packet on their boards
  // without their asking. `arrive` defaults to on because it is a no-op unless
  // the caller also supplies a `tail` on the post. Both left out is exactly the
  // board this component drew before either existed.
  packets?: boolean;
  arrive?: boolean;
}> = ({
  board,
  rows,
  posts,
  inkOp,
  ink,
  icon,
  frame,
  k,
  trails,
  speed = POST_SPEED,
  packets = false,
  arrive = true,
}) => {
  const x0 = postX0(board);
  // the newest post on this board: the only one that ever carries a packet
  let newest = -Infinity;
  posts.forEach((p) => {
    if (p.from > newest) newest = p.from;
  });
  return (
    <g style={{ filter: icon }}>
      <path
        d={panelPath(board, rows)}
        transform={`translate(${panelX0(board)} ${panelTop(rows)})`}
        fill="none"
        stroke={ink}
        strokeWidth={STROKE}
        opacity={inkOp}
      />
      {posts.map((p) => {
        const dur = p.len / speed;
        const tail = arrive ? (p.tail ?? 0) : 0;
        const prog = (f: number) => {
          const u = clamp01((f - p.from) / dur);
          return tail > 0 ? arriveEase(u, tail) : u;
        };
        const drawn = prog(frame);
        if (drawn <= 0) return null;
        const done = p.from + dur;
        const click = frame >= done && frame < done + CLICK_DUR ? 1 : 0;
        const y = postY(p.row);
        const at = (f: number) => ({ x: x0 + p.len * prog(f), y });
        // the read: one hero packet, once, over the post that just landed. `at`
        // asks the helper for the packet's position at any frame, so the shared
        // `Trail` behind the head is the helper's own travel and nothing here
        // restates its speed or its cap.
        const live =
          packets && p.from === newest && inkOp >= PACKET_READ_MIN_OP && frame >= done;
        const packAt = (f: number) => {
          const r = packetsOn({
            frame: f,
            k,
            from: { x: x0, y },
            to: { x: x0 + p.len, y },
            period: PACKET_PERIOD,
            phase: done - hash(p.row, 41) * PACKET_PERIOD,
            opacity: PACKET_HERO,
            seed: p.row,
          });
          return r.length ? { x: r[0].x, y: r[0].y } : null;
        };
        return (
          <g key={p.row}>
            {drawn < 1 ? (
              <Streak
                frame={frame}
                k={k}
                at={at}
                stroke={ink}
                width={STROKE}
                enabled={trails}
              />
            ) : null}
            <line
              x1={x0}
              y1={y}
              x2={x0 + p.len * drawn}
              y2={y}
              stroke={ink}
              strokeWidth={STROKE}
              strokeLinecap="round"
              opacity={inkOp + (1 - inkOp) * click}
            />
            {drawn < 1 ? <circle cx={x0 + p.len * drawn} cy={y} r={4} fill={ink} /> : null}
            {live && packAt(frame) ? (
              <Packet frame={frame} k={k} at={packAt} opacity={PACKET_HERO} />
            ) : null}
          </g>
        );
      })}
    </g>
  );
};

// ---------------------------------------------------------------------------

const SecondMessageBoard: React.FC<Props> = ({
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
  beats,
}) => {
  const frame = useCurrentFrame();
  // 0 = deep (at rest), 1 = ripe (posting). Built once per frame, read per dot.
  const tone = makeTone(accentDeep, accent);
  const bigPosts = experiments.legato ? BIG_POSTS_LEGATO : BIG_POSTS_FLAT;

  // -- camera ----------------------------------------------------------------
  // Two passes of the same damper over the same track: one for the tilt and the
  // zoom, one for the pan, so cx cannot lag differently from cy.
  const cam = runCamera(frame, CAM.F, CAM.CY, CAM.K);
  const pan = runCamera(frame, CAM.F, CAM.CX, CAM.K);
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = pan.cy + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);

  // -- the two boards --------------------------------------------------------
  const bigRows = bigRowsAt(frame);
  const smRows = smallRows(frame);
  const bigThreadTail = experiments.legato ? BIG_THREAD_TAIL_LEGATO : BIG_THREAD_TAIL_FLAT;
  const bigDraw: PostDraw[] = [];
  for (let r = 0; r < ROWS0_BIG; r++) bigDraw.push({ row: r, len: postLen(BIG, r), from: -1000 });
  bigPosts.forEach((p, n) => {
    if (frame >= p.landing)
      bigDraw.push({ row: p.row, len: p.len, from: p.landing, tail: BIG_POST_TAIL[n] });
  });
  const smallDraw: PostDraw[] = [];
  for (let r = 0; r < ROWS0_SMALL; r++)
    smallDraw.push({ row: r, len: postLen(SMALL, r), from: -1000 });
  SMALL_POSTS.forEach((p, n) => {
    if (frame >= p.landing)
      smallDraw.push({ row: p.row, len: p.len, from: p.landing, tail: SMALL_POST_TAIL[n] });
  });

  // the small board's ink: dim, read on "different", dim again on "take"
  const smallOp =
    OP_RECEDE +
    (OP_READ - OP_RECEDE) *
      (ease((frame - beats.different) / SMALL_READ_DUR, EASE_ARRIVE) -
        ease((frame - beats.take) / SMALL_DIM_DUR, EASE_ARRIVE));

  // -- the crowd's tone ------------------------------------------------------
  // Only a posting agent ever leaves the deep tone: it comes up over TONE_DUR
  // before its thread leaves and goes back down over TONE_DUR once the thread
  // has faded. The six on the small board go back down as a group instead, on
  // "didn't", spread across SMALL_RECEDE_SPREAD by their x under the board.
  // SLEEK PASS — WAKE BEFORE YOU ACT. The ramp starts WAKE_LEAD frames before the
  // thread launches rather than TONE_DUR before it, so the agent is already ripe
  // when its thread leaves instead of arriving at ripe on the launch frame.
  const seatTone = new Float32Array(NSEAT);
  const lead = experiments.wake ? WAKE_LEAD : TONE_DUR;
  const litPost = (p: Post, downAt: number) => {
    const up = ease((frame - (p.launch - lead)) / TONE_DUR, EASE_ARRIVE);
    const down = ease((frame - downAt) / TONE_DUR, EASE_ARRIVE);
    const v = clamp01(up - down);
    if (v > seatTone[p.seat]) seatTone[p.seat] = v;
  };
  bigPosts.forEach((p) => {
    if (frame < p.launch - WAKE_LEAD - TONE_DUR - 1) return;
    litPost(p, p.landing + GROW_DUR + THREAD_FADE);
  });
  SMALL_POSTS.forEach((p, n) => {
    const acrossBoard = (p.x - (SMALL.cx - SMALL.w / 2)) / SMALL.w;
    litPost(p, beats.didnt + SMALL_RECEDE_SPREAD * clamp01(acrossBoard) + 0 * n);
  });

  // -- idle traffic ----------------------------------------------------------
  // SLEEK PASS — the band runs at IDLE_BUSY_LIFT above the standard rate while a
  // thread is in the air to either board, and eases back to the standard rate
  // when nothing is. Cut 4 reads the same signal off the same flights.
  const busy = experiments.packets ? busyAt(frame, [...bigPosts, ...SMALL_POSTS]) : 0;
  const { threadEls, lit } = idleTraffic(frame, idleThreadCount, busy);

  // -- the posting threads ---------------------------------------------------
  // Straight up at one speed, head-led, dead stop on the panel's bottom edge,
  // then a fade that starts once the row it brought has finished growing.
  type Live = { key: string; x: number; y1: number; y2: number; op: number; head: number };
  const live: Live[] = [];
  const heads: { key: string; at: (f: number) => { x: number; y: number } | null }[] = [];
  const addThread = (p: Post, key: string, tail: number) => {
    const fadeF0 = p.landing + GROW_DUR;
    if (frame < p.launch || frame > fadeF0 + THREAD_FADE) return;
    // SLEEK PASS — the head cruises and then decelerates into the panel's bottom
    // edge instead of stopping dead on it. `arriveEase` keeps the landing frame:
    // it redistributes the speed inside the same window.
    const dur = (p.baseY - BOARD_BOTTOM) / THREAD_SPEED;
    const at = (f: number) => {
      if (f < p.launch) return null;
      const u = clamp01((f - p.launch) / dur);
      const d = tail > 0 ? arriveEase(u, tail) : u;
      return { x: p.x, y: p.baseY + (BOARD_BOTTOM - p.baseY) * d };
    };
    const now = at(frame);
    if (!now) return;
    const drawn = (p.baseY - now.y) / (p.baseY - BOARD_BOTTOM);
    const op = 0.95 * (1 - ease((frame - fadeF0) / THREAD_FADE, EASE_ARRIVE));
    if (op <= 0.02) return;
    live.push({ key, x: p.x, y1: p.baseY, y2: now.y, op, head: drawn });
    if (drawn < 1) heads.push({ key, at });
  };
  const tailOn = (t: number) => (experiments.arrive ? t : 0);
  bigPosts.forEach((p, n) => addThread(p, `b${n}`, tailOn(bigThreadTail[n])));
  SMALL_POSTS.forEach((p, n) => addThread(p, `s${n}`, tailOn(SMALL_THREAD_TAIL[n])));

  // -- the two marks ---------------------------------------------------------
  // Each falls MARK_DROP world px onto a rest position that is itself moving,
  // because the board under it is still growing: the target is read every frame
  // and the drop is the offset above it, so the mark rides the board up both
  // before and after it lands.
  const markAt =
    (rowsOf: (f: number) => number, f0: number, payoff: boolean, drop: number) =>
    (f: number) => {
      const rest = markInkBottom(panelTop(rowsOf(f)));
      const e = ease((f - f0) / MARK_DUR, payoff ? EASE_PAYOFF : EASE_ARRIVE);
      return { x: 0, y: rest - drop * (1 - e) };
    };
  const msF0 = beats.myspace - MARK_DUR;
  const fbF0 = beats.facebook - MARK_DUR;
  // MySpace falls inside M2b's pushed-in frame, so its drop is the one solved
  // from that framing; Facebook falls at K_FINAL and takes the shared MARK_DROP.
  const msAt = markAt(smallRows, msF0, false, MYSPACE_DROP);
  const fbAt = markAt(bigRowsAt, fbF0, true, MARK_DROP);

  // -- the crowd, bucketed by tone step -------------------------------------
  // One <path> of circle arcs per tone step: TONE_STEPS + 1 nodes for the whole
  // field, whatever the seat count. The one highlighted agent is drawn on its
  // own, because it is the only dot in the piece that is not on the ramp.
  const hi = bigPosts.find((p) => p.landing === HIGHLIGHT_LANDING);
  const heroSeat = hi ? hi.seat : -1;
  const heroFill = highlightTone(frame, HIGHLIGHT_LANDING, accent, experiments.highlight);
  const buckets: string[][] = [];
  for (let s = 0; s <= TONE_STEPS; s++) buckets.push([]);
  let hero: { x: number; y: number; r: number } | null = null;
  const n1 = (v: number) => Math.round(v * 10) / 10;
  for (let i = 0; i < NSEAT; i++) {
    const s = SEATS[i];
    const l = Math.max(lit[i], seatTone[i]);
    const r = dotRadius * s.r * s.rs * breath(frame, hash(i, 9)) * (1 + 0.35 * l);
    if (i === heroSeat && frame >= HIGHLIGHT_LANDING && frame < HIGHLIGHT_LANDING + HIGHLIGHT_FRAMES) {
      hero = { x: s.x, y: s.y, r };
      continue;
    }
    const step = Math.round(clamp01(l) * TONE_STEPS);
    const rr = n1(r);
    buckets[step].push(`M${n1(s.x - r)} ${n1(s.y)}a${rr} ${rr} 0 1 0 ${n1(2 * r)} 0a${rr} ${rr} 0 1 0 ${n1(-2 * r)} 0`);
  }

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
            {hero ? <circle cx={hero.x} cy={hero.y} r={hero.r} fill={heroFill} /> : null}

            {/* idle traffic, head-led, every moving head on the shared Trail */}
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
                {t.head < 1 ? (
                  <>
                    <Trail
                      frame={frame}
                      k={k}
                      at={t.at}
                      r={4}
                      fill={ink}
                      opacity={t.op}
                      enabled={experiments.trails}
                    />
                    <circle cx={t.x2} cy={t.y2} r={4} fill={ink} opacity={t.op} />
                  </>
                ) : null}
              </g>
            ))}

            {/* the posting threads, with a trail on every head */}
            <g style={{ filter: icon }}>
              {live.map((l) => (
                <line
                  key={l.key}
                  x1={l.x}
                  y1={l.y1}
                  x2={l.x}
                  y2={l.y2}
                  stroke={accent}
                  strokeWidth={STROKE}
                  strokeLinecap="round"
                  opacity={l.op}
                />
              ))}
              {heads.map((h) => (
                <Trail
                  key={h.key}
                  frame={frame}
                  k={k}
                  at={h.at}
                  r={4}
                  fill={ink}
                  enabled={experiments.trails}
                />
              ))}
              {live.map((l) =>
                l.head < 1 ? (
                  <circle key={`h${l.key}`} cx={l.x} cy={l.y2} r={4} fill={ink} opacity={l.op} />
                ) : null,
              )}
            </g>

            {/* the two boards */}
            <Board
              board={SMALL}
              rows={smRows}
              posts={smallDraw}
              inkOp={smallOp}
              ink={ink}
              icon={icon}
              frame={frame}
              k={k}
              trails={experiments.trails}
              speed={POST_SPEED_SMALL}
              packets={experiments.packets}
              arrive={experiments.arrive}
            />
            <Board
              board={BIG}
              rows={bigRows}
              posts={bigDraw}
              inkOp={OP_READ}
              ink={ink}
              icon={icon}
              frame={frame}
              k={k}
              trails={experiments.trails}
              packets={experiments.packets}
              arrive={experiments.arrive}
            />

            {/* the two marks, white, each sitting MARK_GAP above its board */}
            {frame >= msF0 ? (
              <MarkGlyph
                mark={MYSPACE}
                cx={SMALL.cx}
                at={(f) => msAt(f).y}
                frame={frame}
                k={k}
                ink={ink}
                icon={icon}
                trails={experiments.trails}
              />
            ) : null}
            {frame >= fbF0 ? (
              <MarkGlyph
                mark={FACEBOOK}
                cx={BIG.cx}
                at={(f) => fbAt(f).y}
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

export default SecondMessageBoard;
