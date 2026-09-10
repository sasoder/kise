import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  BG_BASE,
  BG_DIM,
  DOT_RADIUS,
  FRAME_H,
  FRAME_W,
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
  camMove,
  clamp,
  feather,
  hash,
  iconShadow,
  idleThreads,
  makeTone,
  runCamera,
  sway,
  worldTransform,
} from "./fieldShared";
// Cut 1 of this clip. Every constant and every piece of geometry this piece
// stands on is IMPORTED from it, never restated, so the butt-join cannot drift.
import {
  BOX_PATH,
  BOX_X0,
  BOX_X1,
  BOX_Y0,
  BOX_Y1,
  CAM_CY,
  CAM_F,
  CAM_K,
  CENTRE_X,
  COLS,
  CONTENT_FINAL,
  CROWD_FEATHER,
  GATE_DASH,
  GATE_GAP,
  GATE_X0,
  GATE_X1,
  GRID_X0,
  GRID_Y0,
  K_FINAL,
  LINE_TIP_Y,
  MARK,
  NSEAT,
  RING,
  ROWS,
  SEATS,
  SEAT_AT,
  STEP,
  STROKE,
  type Seat,
  TILES,
  TILE_HALF,
  TILE_LIFT,
  TILE_PATH,
  TONE_DUR,
  WIFI,
  WORLD_H,
  WORLD_W,
  clamp01,
  clampi,
  edgeB,
  edgeL,
  edgeR,
  edgeT,
  smooth,
} from "./ImpossibleTasks";

export const FPS = 24;
// Dwarkesh clip `impossible-tasks`, cut 2: "So when highly persistent models get
// assigned tasks which seem to require internet access, but they're trapped
// inside isolated sandboxes, they're of course going to try to hack out."
//
// SRT span 0:08.939 -> 0:17.899 at 24fps.
// round((17.899 - 8.939) * 24) = round(8.960 * 24) = round(215.04) = 215
// frames of speech, plus a 16 frame tail so the resolved state holds = 231.
export const DURATION = 231;

// ---------------------------------------------------------------------------
// "Try to hack out". Orange Dwarkesh style: opaque grid cutaway, 24fps, the
// crowd is the material, one eased camera move, one gesture per word.
//
// CONTINUITY. This is the direct continuation of `ImpossibleTasks.tsx` and the
// editor butts the two together, so f0 here IS cut 1's f168 — the same pixels,
// not a rebuild that looks like them.
//
//   * Nothing is re-derived. The box, STROKE, the seat grid and SEATS, the five
//     tiles and their converged reach tips, RING, WIFI, the gate's x-range, the
//     camera's key track, K_FINAL and CONTENT_FINAL are all imported from cut 1.
//     The only edit made to that file was adding `export` to those declarations;
//     no value moved, and cut 1 renders to PSNR inf at f100 and f168 against
//     itself before the edit.
//   * OFFSET = 168. Everything periodic evaluates at `frame + OFFSET` — `sway`,
//     `breath`, the idle-thread schedule, the grid's own drift, and `runCamera`
//     over cut 1's key track with this piece's one move appended at f286-302
//     (= f118-134 local). So the hand on the camera and the ambient traffic
//     carry their phase across the join instead of restarting.
//   * Everything cut 1 resolved is simply AT its resolved state from f0: the
//     five tiles landed and their agents ripe, the five reaches at their
//     converged diagonals, the ring closed, the wifi glyph at full, the gate
//     dashed. They are drawn from the same geometry at drawn = conv = 1.
//   * Only what is new — the farm of neighbouring sandboxes — exists at f0, and
//     at cut 1's camera every one of them is off the frame: column +-1's inner
//     wall is at screen x -222 / 1298, and row 1's top wall, the nearest thing
//     below, is at screen y 1982 (the frame ends at 1920, and the widest the
//     shadows reach back up is ~11px). The neighbours are CULLED per frame, so
//     at f0 their layer draws nothing at all. Measured: f0 vs cut 1's f168 is
//     PSNR inf.
//
// Every gesture is one word. Nothing else happens.
//   cut 1's resolved frame, held. Camera k 0.95,
//     content centre -102, no move                  — "so when highly"    f0
//   the five reaches PUMP: each one shortens from
//     its wall end by 56 px over 8 frames (ease in)
//     and pushes back over 6 (ease out), rests 0-6
//     frames, and repeats for the rest of the piece.
//     Start frames hashed f25-36 so they are never
//     in unison. The tile end never moves; the tip
//     stays a round cap; nothing happens on contact — "persistent"        f25+
//   THE SECOND WAVE: twelve more task tiles are
//     dealt from the mark into our box on cut 1's
//     deal exactly — the same tile, a 12-frame
//     flight on its own lateral bow, a landing
//     overshoot, deep -> ripe on the agent beneath,
//     the tile centred 34 px above its dot. The
//     launches accelerate (f38, 44, 49, 54, 58, 62,
//     66, 69, 72, 75, 77, 79; landings f50-f91) and
//     are dealt in a hashed order, never across   — "models get assigned tasks"
//                                                                        f38-94
//   THE IMPOSSIBLE TELL: 2 frames after each new
//     tile lands its reach SNAPS straight up from
//     the tile's top edge to the inside face of the
//     top wall in 4 frames, head-led, and leaves the
//     hack-out's own ink bead (r 4, fading over 8)
//     where it hits. Then that reach joins the pump
//     on its own hashed phase. Land, snap, hit,
//     pump — twelve times, accelerating          — "assigned tasks"       f52-101
//   all SEVENTEEN reaches converge under the ring:
//     each wall end slides along the wall over 12
//     frames, staggered 1 frame in tile-x order, to
//     a tip at 540 + (rank - 8) * 12 — seventeen
//     tips spaced 12 px across +-96, assigned in
//     tile-x order so the fan does not cross. The
//     pump carries on along the new diagonals
//                                     — "to require internet access"      f93-121
//   CAMERA MOVE 1, THE PULL-BACK: k 0.95 -> 0.33 on
//     a rise and a pull-back (content centre -102 ->
//     1007.2, warp 0.72), keyed f112-142 so it runs
//     ON SCREEN f112-150 and is visually still two
//     frames after "sandboxes" (f144 4.44% off and
//     drifting 1.66% a frame, f146 2.12% and 0.96%/f
//     — under the 1%/f at which a zoom reads as
//     moving at all — f150 0.31% and 0.23%/f, f156
//     0.04% and 0.003%/f). It lands on the FARM:
//     thirty sandboxes on a uniform 1400 pitch, ours
//     the top-row centre under the mark, three
//     columns and four rows (twelve boxes) on screen
//     and every edge cut by more of them
//                       — "trapped inside isolated sandboxes"             f112-150
//   A TRUE HOLD. Nothing on the camera between the
//     two moves: the target is flat from f142 and
//     the damper is inside 0.05% of the wide by f156 — (no word)          f150-164
//   THE NEIGHBOURS RECEDE: over 14 frames every
//     neighbour's box stroke, tiles, reaches and
//     wall beads ease OP_READ -> OP_RECEDE and its
//     idle traffic halves. Their crowds do not move
//     and do not dim — a sandbox full of agents is
//     still a sandbox full of agents; it is just not
//     the subject any more                          — "they're of"        f167-181
//   CAMERA MOVE 2, THE PUSH-IN: k 0.33 -> 0.50 back
//     to content centre -102, warp 0.72, keyed
//     f164-186 so it is settled by f196 (f190 0.71%
//     off, f200 0.01%). Cut 1's framing at half the
//     size: the mark and the ring sit above our box
//     exactly where cut 1 put them, and the farm
//     stays in the picture — row 1's top walls at
//     screen y 1439 and columns +-1 showing ~65 px
//     at each side edge. The piece's second and last
//     camera move                — "course going to / try to hack out"    f164-196
//   EVERY visible crowd strikes its own walls from
//     inside: a thread launches from a random seat
//     to the nearest point on its own box's wall,
//     drawing over 6, holding 3, fading 8; its seat
//     goes deep -> ripe from the launch and back to
//     deep 14 frames later; an ink bead marks the
//     wall on arrival. The rate ramps from 0 at f190
//     to 3.0/frame in our box and 0.35/frame in every
//     neighbour by f206, each box on its own hashed
//     launch phase so they do not pulse in unison.
//     Every pump in the farm hardens to the 9-frame
//     cycle with no rest — the same gesture, harder.
//     No thread crosses a wall; nothing gets out    — "try to hack out"   f190-215
//   OUR SCARS PERSIST. A bead on OUR wall does not
//     fade out: it eases to 0.6 over 24 frames and
//     stays, so by f231 the inside of our four walls
//     is studded with impact points (the alive bead
//     count is capped at 200, oldest recycled). A
//     neighbour's beads keep the 8-frame fade — the
//     record of the attempt is ours              — "try to hack out" +    f196-231
//   hold under fire, never fades out                — tail                f215-231
//
// ambient: idle thread traffic in every visible box at the shared rate (180 per
// 1,200 agents), `breath` on every dot, `sway` on the camera. Not gestures;
// that is what this field is.
//
// ---------------------------------------------------------------------------
// DIRECTOR'S PASS 2. What changed from the first pass, and why.
//
//   * THE OPENING WAS DEAD. It held cut 1's resolved picture for 118 frames on
//     a pump alone. "Models get assigned tasks" now gets a second wave of
//     twelve tiles with the impossible tell on each of them, and the converge
//     of all seventeen reaches puts "require internet access" back on screen.
//     The pump's amplitude went 36 -> 56 px so it reads at k 0.95.
//   * TWO NEIGHBOURS BECAME A FARM. Tens of sandboxes, not two: a 5 x 6 grid of
//     boxes, each with its own crowd, its own idle traffic and its own 3-5
//     tasks reaching at its own top wall. The camera now pulls back to k 0.26
//     instead of 0.60 and lands with the mark's top at screen y 300, so the
//     farm runs off all four edges.
//   * THE VERTICAL PITCH IS 1400, NOT 1250. The brief's 1250 was derived
//     against a frame bottom of world y 909; the real one at cut 1's resolved
//     camera is 1043, because the framing constant CAM_LIFT / k puts the
//     content centre at screen 835 rather than at 960. At pitch 1250 row 1's
//     top wall lands at screen y 1840 — inside the frame at f0, which breaks
//     the join. 1400 is the smallest round pitch that clears it with the
//     shadows' ~11 px of reach-back (row 1's top ink sits at screen 1982), and
//     the horizontal pitch is the briefed 1250 untouched.
//   * CULLING. Twenty-five boxes of ~950 agents is ~24,000 dots a frame, so a
//     box whose screen rect misses the frame by more than 100 px is not built
//     at all, and a neighbour's crowd is drawn as one <path> per tone bucket
//     rather than one <circle> per agent. Our own box keeps cut 1's element
//     tree exactly — that is what f0 is measured against.
//
// ---------------------------------------------------------------------------
// DIRECTOR'S PASS 3. Three notes, and what each of them changed.
//
//   * THE PULL-BACK WAS TOO FAST AND TOO FAR. It was k 0.95 -> 0.21 keyed over
//     16 frames, an 8.99%/frame hand. It is now k 0.95 -> 0.33 keyed over 30
//     (f112-142), which halves the peak to 4.51%/frame at f132 and still has
//     the farm still by f146. At k 0.33 our box is 297 screen px wide under the
//     mark, three columns show (+-1 cut by the frame edges) and four rows, so
//     the farm reads as a farm rather than as a wallpaper of slivers.
//   * ON "TRY TO HACK OUT" THE FOCUS BOX MUST BE THE SUBJECT. Two mechanisms
//     together, and neither of them is a new shape. (a) A SECOND CAMERA MOVE,
//     f164-186, back in to k 0.50 at cut 1's own content centre, so the mark,
//     the ring and our box sit exactly where cut 1 framed them at half the
//     size, with the neighbours still bleeding in at three edges. (b) THE
//     NEIGHBOURS RECEDE from f167 while our box fires harder — 3.0/frame
//     against their 0.35 — and keeps its scars.
//   * THE SCARS. Our wall beads used to fade over 8 frames like everyone
//     else's, so at f231 the walls were as clean as at f190 and 41 frames of
//     hammering had left no evidence. They now settle at 0.6 and stay. It is
//     the same primitive; only its life changed.
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
    soWhenHighly: z.number(), // "so when highly"   — cut 1's resolved frame
    persistent: z.number(), // "persistent"         — the reaches start pumping
    modelsGet: z.number(), // "models get"          — the second wave is dealt
    assignedTasks: z.number(), // "assigned tasks"  — land, snap, hit, pump
    whichSeem: z.number(), // "which seem"
    toRequire: z.number(), // "to require"
    internetAccess: z.number(), // "internet access" — the converge
    butTheyre: z.number(), // "but they're"
    trappedInside: z.number(), // "trapped inside"  — the pull-back is running
    isolated: z.number(), // "isolated"
    sandboxes: z.number(), // "sandboxes"           — the pull-back has settled
    theyreOf: z.number(), // "they're of"
    courseGoingTo: z.number(), // "course going to"
    tryToHackOut: z.number(), // "try to hack out"  — the strike
    end: z.number(), // speech ends; tail to 231
  }),
});

export type Props = z.infer<typeof schema>;

// The join. Cut 1's speech ends at its f168, which is this piece's f0.
export const OFFSET = 168;

// ---------------------------------------------------------------------------
// The camera. TWO moves, out and then back, with a true hold between them.
//
// MOVE 1 is "trapped inside isolated sandboxes": out from cut 1's resolved
// k 0.95 to k 0.33, with the content centre travelling from CONTENT_FINAL down
// the farm to CONTENT_WIDE, which is solved so the mark's top lands at screen
// y 300 — the mark and its ring stay at the top of the frame, above the whole
// farm, and everything below them is sandboxes.
//
//   screen(y) = (y - c - CAM_LIFT / k) * k + 960, so the content centre c
//   always lands at 960 - CAM_LIFT = 835 and the mark's top at
//   835 + (MARK_TOP - c) * k. Setting that to 300 gives
//   c = MARK_TOP + (835 - 300) / k = -614 + 535 / 0.33 = 1007.21.
//
// MOVE 2 is "try to hack out": back in to k 0.50 at CONTENT_FINAL — cut 1's own
// content centre, so the mark, the ring and our box land exactly where cut 1
// framed them, at half the size. It is a push, not a re-frame: nothing is
// recomposed, the picture is simply cut 1's again with the farm still in it.
//
// The key track is cut 1's own, unchanged, with both moves appended in OFFSET
// frames. `runCamera(frame + OFFSET, ...)` therefore replays cut 1's damper
// exactly up to the join and continues from its state, rather than starting a
// fresh damper that would have to settle again.
//
// KEYING. `runCamera` damps the target, so a key track that ends where the move
// should end on screen is still running long past it, and one keyed too tight
// lands early on a violent hand. Measured over this track:
//   * move 1, keys f112-142 (30 frames, was 16 in pass 2): peak 4.51%/frame at
//     f132 — half pass 2's 8.99% — and 4.44% off the wide at f144 drifting
//     1.66%/f, 2.12% and 0.96%/f at f146 (under the 1%/f at which a zoom reads
//     as moving at all), 0.31% and 0.23%/f at f150, 0.04% and 0.003%/f at f156.
//     So it is visually still two frames after "sandboxes" and dead still by
//     f156, which is the hold.
//   * the hold f142-164: the target is flat and the damper's residue is at most
//     0.23%/frame at f150 and 0.003%/frame from f156. A true hold.
//   * move 2, keys f164-186: peak 2.62%/frame at f174, 0.71% off k 0.50 at
//     f190 and 0.01% by f200. It settles ON the word rather than before it,
//     which is what a push-in wants — the arrival is the gesture.
// At the resolved push: our box's rect is x 316-766 / y 739-1089 (450 screen px
// wide), the mark's top at screen y 577, the ring above it, row 1's top walls
// at screen y 1439, and columns +-1 showing 66 and 64 px at the side edges.
// Six boxes on screen, against twelve at the wide.
// ---------------------------------------------------------------------------
const K_WIDE = 0.33; // director pass 3: was 0.21 — the pull-back went too far
const K_PUSH = 0.5; // director pass 3: the push-in, cut 1's framing at half size
const MARK_TOP = MARK.y - 54; // -614; the mark is 108 world px square
const MARK_TOP_SCREEN = 300;
const CONTENT_WIDE = MARK_TOP + (835 - MARK_TOP_SCREEN) / K_WIDE; // 1007.21 at k 0.33
const CAM_MOVE_F0 = 112; // local; the move is under "but they're / trapped inside"
const CAM_MOVE_F1 = 142;
const CAM_PUSH_F0 = 164; // local; three frames before "they're of", so it is running on the word
const CAM_PUSH_F1 = 186;
// (the camera's key track has to exist at module scope, so these four are the
// only frames in the piece not read straight off the `beats` prop)
const MOVE = camMove({
  f0: OFFSET + CAM_MOVE_F0,
  f1: OFFSET + CAM_MOVE_F1,
  k0: K_FINAL,
  k1: K_WIDE,
  c0: CONTENT_FINAL,
  c1: CONTENT_WIDE,
  warp: 0.72,
});
const MOVE2 = camMove({
  f0: OFFSET + CAM_PUSH_F0,
  f1: OFFSET + CAM_PUSH_F1,
  k0: K_WIDE,
  k1: K_PUSH,
  c0: CONTENT_WIDE,
  c1: CONTENT_FINAL,
  warp: 0.72,
});
const CY_PUSH = CONTENT_FINAL + 125 / K_PUSH;
export const TH_CAM_F = [...CAM_F, ...MOVE.F, ...MOVE2.F, OFFSET + DURATION];
export const TH_CAM_K = [...CAM_K, ...MOVE.K, ...MOVE2.K, K_PUSH];
export const TH_CAM_CY = [...CAM_CY, ...MOVE.CY, ...MOVE2.CY, CY_PUSH];

// ---------------------------------------------------------------------------
// THE FARM. Thirty sandboxes on a lattice: columns i in -2..2, rows j in 0..5,
// box (i, j) centred on (540 + 1400 i, 60 + 1400 j). Ours is (0, 0), the top
// row's centre, so the mark and the internet ring sit above the whole farm and
// there is exactly one internet for all of them.
//
// THE PITCH IS UNIFORM AT 1400 (director pass 3: the horizontal pitch was the
// briefed 1250 against a vertical 1400, which put twice as much wall-to-wall
// gap between the rows as between the columns and read as a stretched lattice).
// PITCH_Y is 1400 and not the briefed 1250, and the reason is
// the continuity join: at cut 1's resolved camera the frame's bottom edge is
// world y 1043 (the content centre lands at screen 835, not 960, so the frame
// reaches 125/k further down the world than a naive centre-of-frame reading
// gives). At pitch 1250 row 1's top wall would be at world y 960, 83 px inside
// the frame at f0. 1400 puts it at 1109, 66 px clear, which survives both the
// sway over f0-f118 and the ~11 px the two shadows reach back up.
//
// Every neighbour is the same 900 x 700 box with its own crowd out of cut 1's
// seat generator (the hash index offset per box, so it is the same material
// laid the same way and never the same arrangement twice), its own idle traffic
// at the shared rate, and its own 3-5 tasks reaching at its own top wall. No
// rings, no wifi, no gates: there is one internet and one forgotten gate, and
// they are ours.
// ---------------------------------------------------------------------------
export const PITCH_X = 1400; // director pass 3: uniform with PITCH_Y — the row gap was twice the column gap
export const PITCH_Y = 1400;
export const FARM_COLS = [-2, -1, 0, 1, 2];
export const FARM_ROWS = [0, 1, 2, 3, 4, 5];

// Cut 1's seat generator, with the hash index offset so a box's crowd is its
// own. Everything else — the grid, the wobbling edges, the feather, the radius
// spread — is cut 1's, imported.
const genSeats = (off: number): Seat[] => {
  const out: Seat[] = [];
  for (let gr = 0; gr < ROWS; gr++) {
    for (let gc = 0; gc < COLS; gc++) {
      const i = gr * COLS + gc + off;
      const x = GRID_X0 + gc * STEP + (hash(i, 11) - 0.5) * STEP * 0.9;
      const y = GRID_Y0 + gr * STEP + (hash(i, 12) - 0.5) * STEP * 0.9;
      const d = Math.min(
        (x - edgeL(y)) / STEP,
        (edgeR(y) - x) / STEP,
        (y - edgeT(x)) / STEP,
        (edgeB(x) - y) / STEP,
      );
      const fe = feather(d, CROWD_FEATHER);
      if (hash(i, 71) >= fe) continue;
      out.push({ x, y, r: 0.75 + 0.5 * hash(i, 13), rs: 0.7 + 0.3 * fe, gc, gr });
    }
  }
  return out;
};

const seatIndex = (seats: Seat[]) => {
  const at = new Int32Array(COLS * ROWS).fill(-1);
  seats.forEach((s, i) => {
    at[s.gr * COLS + s.gc] = i;
  });
  return at;
};

// The nearest real seat to a point, found through the grid index rather than by
// scanning the crowd: a task always lands on an agent, and there are thirty
// crowds to place tasks in.
const nearestSeat = (seats: Seat[], at: Int32Array, x: number, y: number) => {
  const gc0 = Math.round((x - GRID_X0) / STEP);
  const gr0 = Math.round((y - GRID_Y0) / STEP);
  let best = -1;
  let bd = Infinity;
  for (let dr = -3; dr <= 3; dr++) {
    for (let dc = -3; dc <= 3; dc++) {
      const gc = gc0 + dc;
      const gr = gr0 + dr;
      if (gc < 0 || gc >= COLS || gr < 0 || gr >= ROWS) continue;
      const si = at[gr * COLS + gc];
      if (si < 0) continue;
      const s = seats[si];
      const d = Math.hypot(s.x - x, s.y - y);
      if (d < bd) {
        bd = d;
        best = si;
      }
    }
  }
  return best;
};

// Where a task tile's CENTRE may sit: 60 world px in from every wall, so the
// tile (40 square) never touches one and its reach always has room to run.
const TILE_INSET = 60;
const TX0 = BOX_X0 + TILE_INSET; // 150
const TX1 = BOX_X1 - TILE_INSET; // 930
const TY0 = BOX_Y0 + TILE_INSET; // -230
const TY1 = BOX_Y1 - TILE_INSET; // 350
const TILE_GAP = 90; // no two tiles in one box, old or new, closer than this

// ---------------------------------------------------------------------------
// THE SECOND WAVE. Twelve more tasks into our box, on cut 1's deal exactly.
//
// The targets are stratified rather than scattered: the allowed rectangle is
// cut into a 4 x 3 lattice of cells and one tile goes in each, so the twelve
// are spread across the whole width and the whole height by construction and
// not by luck. Inside its cell each tile is a hashed point snapped to the
// nearest real seat, rejected and re-drawn until it is at least TILE_GAP from
// every tile already placed — cut 1's five included. It is deterministic: the
// same hash stream every render.
//
// The order they are DEALT in is a hashed permutation of those twelve cells,
// for cut 1's reason: a deal that runs left to right across the box reads as a
// machine filling a form. The launch frames themselves accelerate.
// ---------------------------------------------------------------------------
const WAVE_LAUNCH = [38, 44, 49, 54, 58, 62, 66, 69, 72, 75, 77, 79];
const WAVE_CELLS_X = 4;
const WAVE_CELLS_Y = 3;
const CELL_MARGIN = 34; // keep a candidate off its own cell's edge
export const DEAL_DUR = 12; // frames in flight, cut 1's
export const SNAP_LAG = 2; // frames from the landing to the reach leaving
export const SNAP_DUR = 4; // frames for the reach to hit the wall
export const BEAD_R = 4;
export const BEAD_FADE = 8;

export type Wave = {
  seat: number;
  x: number;
  y: number;
  arc: number;
  launch: number;
  land: number;
  snapFrom: number;
  arrive: number;
};

export const WAVE2: Wave[] = (() => {
  const placed: { x: number; y: number }[] = TILES.map((t) => ({ x: t.x, y: t.y }));
  const cw = (TX1 - TX0) / WAVE_CELLS_X;
  const ch = (TY1 - TY0) / WAVE_CELLS_Y;
  type Spot = { seat: number; x: number; y: number };
  const spots: Spot[] = [];
  for (let t = 0; t < WAVE_CELLS_X * WAVE_CELLS_Y; t++) {
    const cxi = t % WAVE_CELLS_X;
    const cyi = Math.floor(t / WAVE_CELLS_X);
    let got: Spot | null = null;
    let fallback: Spot | null = null;
    let fallbackD = -1;
    for (let c = 0; c < 200 && !got; c++) {
      const px = TX0 + cxi * cw + CELL_MARGIN + hash(t * 211 + c, 81) * (cw - 2 * CELL_MARGIN);
      const py = TY0 + cyi * ch + CELL_MARGIN + hash(t * 211 + c, 82) * (ch - 2 * CELL_MARGIN);
      // the point is where the TILE wants to be; the seat it snaps to is
      // TILE_LIFT below it, because a tile sits 34 px above its agent
      const si = nearestSeat(SEATS, SEAT_AT, px, py + TILE_LIFT);
      if (si < 0) continue;
      const s = SEATS[si];
      const x = s.x;
      const y = s.y - TILE_LIFT;
      if (x < TX0 || x > TX1 || y < TY0 || y > TY1) continue;
      let mind = Infinity;
      for (const p of placed) mind = Math.min(mind, Math.hypot(p.x - x, p.y - y));
      if (mind >= TILE_GAP) {
        got = { seat: si, x, y };
      } else if (mind > fallbackD) {
        fallbackD = mind;
        fallback = { seat: si, x, y };
      }
    }
    const spot = got ?? fallback;
    if (!spot) throw new Error(`second wave: no seat in cell ${t}`);
    placed.push({ x: spot.x, y: spot.y });
    spots.push(spot);
  }
  // the deal order: a hashed permutation of the cells, never left to right
  const order = spots.map((_, i) => i).sort((a, b) => hash(a, 88) - hash(b, 88));
  const out: Wave[] = [];
  order.forEach((i, slot) => {
    const launch = WAVE_LAUNCH[slot];
    const land = launch + DEAL_DUR;
    out[i] = {
      ...spots[i],
      // its own bow, 45-90 px either way, cut 1's rule: shallow against the run
      // from the mark, never zero, so no two tiles travel the same path
      arc: (hash(i, 65) < 0.5 ? -1 : 1) * (45 + 45 * hash(i, 66)),
      launch,
      land,
      snapFrom: land + SNAP_LAG,
      arrive: land + SNAP_LAG + SNAP_DUR,
    };
  });
  return out;
})();

// A neighbour's own tasks: 3-5 of them (hashed), at hashed seats, no two closer
// than TILE_GAP, each with a reach pinned straight up at its own top wall.
type NTile = { seat: number; x: number; y: number };
const boxTiles = (seats: Seat[], n: number, id: number): NTile[] => {
  const count = 3 + Math.floor(hash(id, 30) * 3);
  const out: NTile[] = [];
  for (let t = 0; t < count; t++) {
    for (let c = 0; c < 80; c++) {
      const si = Math.floor(hash(id * 131 + t * 17 + c, 31) * n);
      const s = seats[si];
      if (!s) continue;
      const x = s.x;
      const y = s.y - TILE_LIFT;
      if (x < TX0 || x > TX1 || y < TY0 || y > TY1) continue;
      let ok = true;
      for (const p of out) if (Math.hypot(p.x - x, p.y - y) < TILE_GAP) ok = false;
      if (!ok) continue;
      out.push({ seat: si, x, y });
      break;
    }
  }
  return out;
};

type Box = {
  id: number;
  i: number;
  j: number;
  dx: number;
  dy: number;
  seats: Seat[];
  at: Int32Array;
  n: number;
  jOff: number; // hash offset for its traffic, so no two boxes ever sync
  hackRate: number; // launches per frame at the plateau
  hackPhase: number; // where its launch accumulator starts, so they do not pulse
  tiles: NTile[];
  idle: number;
};

// Director pass 3: our box fires harder and every neighbour fires less, so the
// strike has a subject. 2.2 -> 3.0 in our box, 0.7 -> 0.35 in a neighbour, on
// the same ramp and the same accumulator — the gap is the gesture, not a new
// mechanism.
export const OUR_HACK_RATE = 3.0;
export const NEIGH_HACK_RATE = 0.35;

// The recede. From "they're of" over 14 frames every neighbour's INK — its box
// stroke, its tiles, its reaches and the beads on its walls — eases OP_READ ->
// OP_RECEDE, and its idle traffic halves. Its crowd is untouched: the dots keep
// their tone and their opacity, because a sandbox full of agents is still a
// sandbox full of agents and dimming them would read as thirty boxes emptying.
export const RECEDE_DUR = 14;
export const NEIGH_IDLE_FLOOR = 0.5; // the multiplier its idle threads end on

const OUR: Box = {
  id: 0,
  i: 0,
  j: 0,
  dx: 0,
  dy: 0,
  seats: SEATS,
  at: SEAT_AT,
  n: NSEAT,
  jOff: 0,
  hackRate: OUR_HACK_RATE,
  hackPhase: 0,
  tiles: [],
  idle: idleThreads(NSEAT),
};

export const NEIGHBOURS: Box[] = (() => {
  const out: Box[] = [];
  let id = 0;
  for (const j of FARM_ROWS) {
    for (const i of FARM_COLS) {
      id++;
      if (i === 0 && j === 0) continue; // ours
      const seats = genSeats(id * 10007);
      out.push({
        id,
        i,
        j,
        dx: i * PITCH_X,
        dy: j * PITCH_Y,
        seats,
        at: seatIndex(seats),
        n: seats.length,
        jOff: id * 7919,
        hackRate: NEIGH_HACK_RATE,
        hackPhase: hash(id, 55),
        tiles: boxTiles(seats, seats.length, id),
        idle: idleThreads(seats.length),
      });
    }
  }
  return out;
})();

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
    soWhenHighly: 0,
    persistent: 25,
    modelsGet: 36,
    assignedTasks: 50,
    whichSeem: 70,
    toRequire: 81,
    internetAccess: 93,
    butTheyre: 116,
    trappedInside: 122,
    isolated: 133,
    sandboxes: 144,
    theyreOf: 167,
    courseGoingTo: 177,
    tryToHackOut: 190,
    end: 215,
  },
});

// ---------------------------------------------------------------------------
// THE SEVENTEEN REACHES, and the converge that gathers them.
//
// Cut 1's five are already diagonals aimed under the ring; the second wave's
// twelve snap straight up. On "require internet access" all seventeen wall ends
// slide along the wall to a fan of tips 12 px apart across +-96, ranked by tile
// x so the resolved fan has no crossing in it. Twelve frames each, staggered
// one frame by that same rank — and never before its own reach has arrived,
// which only binds on the last few tiles of the wave.
// ---------------------------------------------------------------------------
export const CONV2_F0 = 93;
export const CONV2_DUR = 12;
export const TIP_GAP = 12;

export type Reach = {
  key: string;
  old: boolean;
  x: number; // the tile's centre
  y: number;
  tipStart: number; // where its wall end sits before the converge
  tipEnd: number; // where it ends up
  convStart: number;
  drawFrom: number; // the snap; -1 for cut 1's five, which are already drawn
  arrive: number; // when the snap hits the wall; -1 for cut 1's five
  pumpIdx: number;
};

export const REACHES: Reach[] = (() => {
  const all = [
    ...TILES.map((t, i) => ({ old: true, i, x: t.x, y: t.y, tipStart: t.tipX })),
    ...WAVE2.map((w, i) => ({ old: false, i, x: w.x, y: w.y, tipStart: w.x })),
  ];
  const byX = all.map((_, i) => i).sort((a, b) => all[a].x - all[b].x);
  const rank: number[] = [];
  byX.forEach((i, r) => {
    rank[i] = r;
  });
  const mid = (all.length - 1) / 2; // 8
  return all.map((a, i) => {
    const r = rank[i];
    const arrive = a.old ? -1 : WAVE2[a.i].arrive;
    return {
      key: a.old ? `o${a.i}` : `w${a.i}`,
      old: a.old,
      x: a.x,
      y: a.y,
      tipStart: a.tipStart,
      tipEnd: CENTRE_X + (r - mid) * TIP_GAP,
      convStart: Math.max(CONV2_F0 + r, arrive),
      drawFrom: a.old ? -1 : WAVE2[a.i].snapFrom,
      arrive,
      pumpIdx: a.old ? a.i : 100 + a.i,
    };
  });
})();

// ---------------------------------------------------------------------------
// The pump. "Persistent" is the whole of this gesture: every reach in the farm
// keeps pushing at the wall it already failed to get through. Only the WALL end
// moves — it comes back off the wall by PUMP_PULL along the reach's own
// direction and then pushes out again — so no tile and no agent moves, and a
// reach never detaches from its tile.
//
// The amplitude went 36 -> 56 px on the director's note that the opening was
// dead: at k 0.95 a 36 px retreat on a 400 px reach is 34 screen px of travel
// spread over 8 frames, at the bottom of what reads as motion at all. It is
// capped at 0.45 of the reach's own current length, which only ever binds on
// the short reaches of the second wave's top row — a short arm has less travel,
// and without the cap a 37 px reach would invert through its own tile.
//
// The rest is hashed 0-6 frames per cycle so reaches on a 14-frame cycle never
// fall into step, and the start frames are spread over PUMP_SPREAD so they do
// not begin in unison either. From the strike the cycle hardens to 9 frames
// with no rest: the same gesture, harder, and no new shape for it.
// ---------------------------------------------------------------------------
const PUMP_PULL = 56; // world px the wall end retreats at full pump
const PUMP_CAP = 0.45; // ...but never more than this much of the reach itself
const PUMP_IN = 8;
const PUMP_OUT = 6;
const HARD_IN = 5;
const HARD_OUT = 4;
const PUMP_SPREAD = 12; // the start frames are hashed across this window

const pumpAt = (i: number, f: number, from: number, harden: number) => {
  const start = from + Math.floor(hash(i, 41) * PUMP_SPREAD);
  if (f < start) return 0;
  let t = start;
  for (let c = 0; c < 96; c++) {
    const hard = t >= harden;
    const inD = hard ? HARD_IN : PUMP_IN;
    const outD = hard ? HARD_OUT : PUMP_OUT;
    const rest = hard ? 0 : Math.round(hash(i * 7 + c, 42) * 6);
    const len = inD + outD + rest;
    if (f < t + len) {
      const a = f - t;
      if (a < inD) return Easing.cubic(a / inD); // shortens, ease in
      if (a < inD + outD) return 1 - Easing.out(Easing.cubic)((a - inD) / outD); // pushes back
      return 0; // rest, flat against the wall
    }
    t += len;
  }
  return 0;
};

// ---------------------------------------------------------------------------
// The strike. Cut 1's neighbour, `ConstantlyBombarding.tsx`, launches threads
// from random seats off one accumulated rate curve and lights the launching
// seat from the thread itself; this is that mechanism pointed at the wall the
// agents are already inside, in every box on screen at once.
//
// A thread goes to the NEAREST POINT on its own box's wall, perpendicular to
// whichever wall that is, and its round cap ends STROKE in from the wall's
// centre line — the same rule cut 1's reaches end on, so nothing pokes through.
// The only mark of impact is the ink bead, which is also what the second wave's
// snaps leave: one primitive for "something hit the wall here".
// ---------------------------------------------------------------------------
const T_DRAW = 6;
const T_HOLD = 3;
const T_FADE = 8;
const T_LIFE = T_DRAW + T_HOLD + T_FADE; // 17
const SEAT_RIPE = 14; // the launching seat is back to deep here
const HACK_RAMP = 16; // frames from the first launch to the plateau rate
// OUR beads do not fade out. Director pass 3: forty-one frames of hammering
// used to leave the walls exactly as clean as they were at f190, so the strike
// had no record. A bead on our wall now settles to BEAD_KEEP over BEAD_SETTLE
// frames and stays there for the rest of the piece. A neighbour's beads keep
// the 8-frame fade — the scars are ours.
const BEAD_SETTLE = 24;
const BEAD_KEEP = 0.6;
const BEAD_MAX = 200; // alive beads in our box; the oldest are recycled past this

const wallHit = (x: number, y: number) => {
  const dl = x - BOX_X0;
  const dr = BOX_X1 - x;
  const dt = y - BOX_Y0;
  const db = BOX_Y1 - y;
  const m = Math.min(dl, dr, dt, db);
  if (m === dt) return { ex: x, ey: BOX_Y0 + STROKE, fx: x, fy: BOX_Y0 };
  if (m === db) return { ex: x, ey: BOX_Y1 - STROKE, fx: x, fy: BOX_Y1 };
  if (m === dl) return { ex: BOX_X0 + STROKE, ey: y, fx: BOX_X0, fy: y };
  return { ex: BOX_X1 - STROKE, ey: y, fx: BOX_X1, fy: y };
};

type Th = {
  key: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  op: number;
  head: number;
};
type Bead = { key: string; x: number; y: number; op: number };

// Cut 1's ambient traffic, verbatim in behaviour, taken as a function so every
// crowd can run it. `jOff` shifts the hash so each box's schedule is its own;
// at jOff 0 and frame + OFFSET this reproduces cut 1's threads exactly, which
// is what makes f0 the same pixels.
const idleFor = (f: number, box: Box, count: number, lit: Float32Array, out: Th[]) => {
  const reach = 5;
  for (let j = 0; j < count; j++) {
    const jj = j + box.jOff;
    const period = 44 - 12 * hash(jj, 4);
    const local = f + hash(jj, 5) * period;
    const cycle = Math.floor(local / period);
    const phase = (local - cycle * period) / period;
    const seed = jj * 131 + cycle * 7;
    const a = Math.floor(hash(seed, 6) * box.n);
    const sa = box.seats[a];
    const bc = clampi(sa.gc + Math.round((hash(seed, 7) - 0.5) * 2 * reach), 0, COLS - 1);
    const br = clampi(sa.gr + Math.round((hash(seed, 8) - 0.5) * 2 * reach), 0, ROWS - 1);
    const b = box.at[br * COLS + bc];
    if (b < 0 || b === a) continue;
    const sb = box.seats[b];
    const dn = interpolate(phase, [0, 0.3], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
    const fade = interpolate(phase, [0.55, 1], [1, 0], clamp);
    if (fade <= 0.02) continue;
    lit[a] = Math.max(lit[a], fade);
    lit[b] = Math.max(lit[b], dn * fade);
    out.push({
      key: `i${jj}`,
      x1: sa.x,
      y1: sa.y,
      x2: sa.x + (sb.x - sa.x) * dn,
      y2: sa.y + (sb.y - sa.y) * dn,
      op: 0.4 * fade,
      head: dn,
    });
  }
};

const hackFor = (
  frame: number,
  f0: number,
  box: Box,
  lit: Float32Array,
  out: Th[],
  beads: Bead[],
  keepBeads = false,
) => {
  if (frame < f0) return;
  // the launch accumulator starts on this box's own hashed phase, so thirty
  // boxes on one rate curve do not fire on the same frames
  let acc = box.hackPhase;
  let n = 0;
  for (let f = f0; f <= frame; f++) {
    acc += box.hackRate * smooth((f - f0) / HACK_RAMP);
    while (acc >= 1) {
      acc -= 1;
      const j = n++;
      const age = frame - f;
      // a dead thread whose bead has also gone is nothing at all; when the
      // beads keep, the launch stays alive for its mark even though its thread
      // is long gone
      if (age > T_LIFE && !keepBeads) continue;
      const si = Math.floor(hash(j + box.jOff * 3, 71) * box.n);
      const s = box.seats[si];
      const w = wallHit(s.x, s.y);
      const dn = clamp01(age / T_DRAW); // linear: it is fire, not a drawn line
      const fade = interpolate(age, [T_DRAW + T_HOLD, T_LIFE], [1, 0], clamp);
      lit[si] = Math.max(lit[si], interpolate(age, [T_DRAW + T_HOLD, SEAT_RIPE], [1, 0], clamp));
      if (age >= T_DRAW) {
        const fop = keepBeads
          ? interpolate(age, [T_DRAW, T_DRAW + BEAD_SETTLE], [1, BEAD_KEEP], clamp)
          : interpolate(age, [T_DRAW, T_DRAW + BEAD_FADE], [1, 0], clamp);
        if (fop > 0.02) beads.push({ key: `k${box.jOff}-${j}`, x: w.fx, y: w.fy, op: fop });
      }
      if (age > T_LIFE || fade <= 0.02) continue;
      out.push({
        key: `h${j}`,
        x1: s.x,
        y1: s.y,
        x2: s.x + (w.ex - s.x) * dn,
        y2: s.y + (w.ey - s.y) * dn,
        op: 0.95 * fade,
        head: dn,
      });
    }
  }
  // the oldest scars are recycled once the wall is full, so the count is
  // bounded whatever the rate does
  if (keepBeads && beads.length > BEAD_MAX) beads.splice(0, beads.length - BEAD_MAX);
};

// A neighbour's crowd, batched. Twenty-five boxes of ~950 agents is ~24,000
// dots a frame, and one <circle> element each is what makes that a slideshow.
// A dot's colour is quantised to the tone ramp's own 64 steps already, so every
// dot in a bucket can be one subpath of one <path> — 65 elements a box instead
// of 950, with the same geometry. OUR box is exempt: it keeps cut 1's element
// tree exactly, because f0 is measured against it.
const dotPaths = (box: Box, lit: Float32Array, F: number, dotRadius: number) => {
  const buckets: string[] = new Array(TONE_STEPS + 1).fill("");
  for (let i = 0; i < box.n; i++) {
    const s = box.seats[i];
    const l = lit[i];
    const b = Math.round(clamp01(l) * TONE_STEPS);
    const r = dotRadius * s.r * s.rs * breath(F, hash(i + box.jOff, 9)) * (1 + 0.35 * l);
    const rr = r.toFixed(2);
    buckets[b] +=
      `M${(s.x - r).toFixed(2)} ${s.y.toFixed(2)}` +
      `a${rr} ${rr} 0 1 0 ${(2 * r).toFixed(2)} 0` +
      `a${rr} ${rr} 0 1 0 ${(-2 * r).toFixed(2)} 0`;
  }
  return buckets;
};

// The same batching for a neighbour's threads: opacity quantised to sixteenths
// (a 6% step on a line that is at most 0.4 opaque and, at the wide, 0.8 screen
// px long per world px) and one <path> per bucket for the lines and one for the
// heads.
const THREAD_OP_STEPS = 16;
const threadPaths = (list: Th[], mul = 1) => {
  const lines: string[] = new Array(THREAD_OP_STEPS + 1).fill("");
  const heads: string[] = new Array(THREAD_OP_STEPS + 1).fill("");
  for (const t of list) {
    const b = Math.round(clamp01(t.op * mul) * THREAD_OP_STEPS);
    if (b === 0) continue;
    lines[b] +=
      `M${t.x1.toFixed(1)} ${t.y1.toFixed(1)}L${t.x2.toFixed(1)} ${t.y2.toFixed(1)}`;
    if (t.head < 1) {
      heads[b] += `M${(t.x2 - 4).toFixed(1)} ${t.y2.toFixed(1)}a4 4 0 1 0 8 0a4 4 0 1 0 -8 0`;
    }
  }
  return { lines, heads };
};

// Is this box worth building at all? Its screen rect, with a 100 px margin for
// the shadows, against the frame.
const CULL_MARGIN = 100;
const onScreen = (box: Box, cx: number, cy: number, k: number) => {
  const sx0 = (BOX_X0 + box.dx - cx) * k + FRAME_W / 2;
  const sx1 = (BOX_X1 + box.dx - cx) * k + FRAME_W / 2;
  const sy0 = (BOX_Y0 + box.dy - cy) * k + FRAME_H / 2;
  const sy1 = (BOX_Y1 + box.dy - cy) * k + FRAME_H / 2;
  return (
    sx1 > -CULL_MARGIN &&
    sx0 < FRAME_W + CULL_MARGIN &&
    sy1 > -CULL_MARGIN &&
    sy0 < FRAME_H + CULL_MARGIN
  );
};

const TryToHackOut: React.FC<Props> = ({
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
  // Cut 1's clock. Everything periodic reads this, so the ambient and the hand
  // on the camera carry their phase across the join.
  const F = frame + OFFSET;
  const tone = makeTone(accentDeep, accent);

  // -- camera, first: the cull needs it --------------------------------------
  const cam = runCamera(F, TH_CAM_F, TH_CAM_CY, TH_CAM_K);
  const drift = sway(F);
  const cy = cam.cy + drift.dy;
  const cx = CENTRE_X + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);

  // -- our crowd's tone ------------------------------------------------------
  // Cut 1's five agents went ripe under their tiles and stay ripe; the second
  // wave's twelve go ripe as their own tile lands.
  const seatTone = new Float32Array(NSEAT);
  TILES.forEach((t) => {
    seatTone[t.seat] = smooth((F - t.land) / TONE_DUR);
  });
  WAVE2.forEach((w) => {
    seatTone[w.seat] = Math.max(seatTone[w.seat], smooth((frame - w.land) / TONE_DUR));
  });

  // -- ambient traffic, and the strike ---------------------------------------
  const lit = new Float32Array(NSEAT);
  const threadEls: Th[] = [];
  idleFor(F, OUR, idleThreadCount, lit, threadEls);

  const hackEls: Th[] = [];
  const beads: Bead[] = [];
  hackFor(frame, beats.tryToHackOut, OUR, lit, hackEls, beads, true);

  // -- the recede ------------------------------------------------------------
  // "they're of": the farm stops being the subject. Ink only; the crowds are
  // untouched.
  const recede = smooth((frame - beats.theyreOf) / RECEDE_DUR);
  const neighInk = OP_READ + (OP_RECEDE - OP_READ) * recede;
  const neighIdle = 1 - (1 - NEIGH_IDLE_FLOOR) * recede;

  // -- the farm --------------------------------------------------------------
  const neighbours = NEIGHBOURS.filter((b) => onScreen(b, cx, cy, k)).map((b) => {
    const nlit = new Float32Array(b.n);
    b.tiles.forEach((t) => {
      nlit[t.seat] = 1; // its agents got their tasks long ago
    });
    const nThreads: Th[] = [];
    idleFor(F, b, b.idle, nlit, nThreads);
    const nHack: Th[] = [];
    const nBeads: Bead[] = [];
    hackFor(frame, beats.tryToHackOut, b, nlit, nHack, nBeads);
    // its reaches: straight up from each tile to its own top wall, pumping on
    // their own hashed phases from f0
    const nLines = b.tiles.map((t, i) => {
      const x1 = t.x;
      const y1 = t.y - TILE_HALF;
      const L = Math.max(1, y1 - LINE_TIP_Y);
      const p = pumpAt(b.id * 17 + i, frame, 0, beats.tryToHackOut) * Math.min(PUMP_PULL, PUMP_CAP * L);
      return { key: i, x1, y1, x2: x1, y2: LINE_TIP_Y + p };
    });
    return {
      b,
      dots: dotPaths(b, nlit, F, dotRadius),
      threads: threadPaths(nThreads, neighIdle),
      hack: threadPaths(nHack),
      beads: nBeads,
      lines: nLines,
    };
  });

  // -- the tasks: cut 1's five, landed, and the second wave in flight --------
  const wave = WAVE2.map((w, i) => {
    if (frame < w.launch) return null;
    const lin = clamp01((frame - w.launch) / DEAL_DUR);
    const e = Easing.out(Easing.cubic)(lin);
    const dx = w.x - MARK.x;
    const dy = w.y - MARK.y;
    const L = Math.hypot(dx, dy) || 1;
    // the bow is perpendicular to the run, cut 1's rule
    const bow = Math.sin(Math.PI * e) * w.arc;
    const x = MARK.x + dx * e + (-dy / L) * bow;
    const y = MARK.y + dy * e + (dx / L) * bow;
    // the one spring in the piece: the landing
    const scale = interpolate(frame, [w.land - 2, w.land + 7], [0.82, 1], {
      ...clamp,
      easing: Easing.out(Easing.back(1.6)),
    });
    return { key: i, x, y, scale, op: OP_READ * smooth(lin / 0.15) };
  });

  // -- the seventeen reaches -------------------------------------------------
  // Cut 1's five are drawn already; the wave's twelve snap up from their tile's
  // top edge over SNAP_DUR, head-led, and leave a bead where they hit. From
  // CONV2_F0 every wall end slides along the wall into the fan, and the pump
  // rides on whatever direction the reach has at that moment.
  const lines = REACHES.map((rc) => {
    const drawn = rc.old
      ? 1
      : interpolate(frame, [rc.drawFrom, rc.drawFrom + SNAP_DUR], [0, 1], {
          ...clamp,
          easing: Easing.out(Easing.cubic),
        });
    if (drawn <= 0) return null;
    const x1 = rc.x;
    const y1 = rc.y - TILE_HALF;
    const conv = smooth((frame - rc.convStart) / CONV2_DUR);
    const tipX = rc.tipStart + (rc.tipEnd - rc.tipStart) * conv;
    const fx = x1 + (tipX - x1) * drawn;
    const fy = y1 + (LINE_TIP_Y - y1) * drawn;
    const dx = fx - x1;
    const dy = fy - y1;
    const L = Math.hypot(dx, dy) || 1;
    const p =
      drawn < 1
        ? 0
        : pumpAt(rc.pumpIdx, frame, rc.old ? beats.persistent : rc.arrive, beats.tryToHackOut) *
          Math.min(PUMP_PULL, PUMP_CAP * L);
    return {
      key: rc.key,
      x1,
      y1,
      x2: fx - (dx / L) * p,
      y2: fy - (dy / L) * p,
      head: drawn < 1 ? { x: fx, y: fy } : null,
    };
  });

  // the bead each snap leaves on the wall
  const snapBeads = WAVE2.map((w) => {
    const op = interpolate(frame, [w.arrive, w.arrive + BEAD_FADE], [1, 0], clamp);
    if (frame < w.arrive || op <= 0.02) return null;
    return { key: `s${w.launch}`, x: w.x, y: BOX_Y0, op };
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

      {/* THE FARM'S LAYER. It carries its own copy of the one global shadow
          rather than sharing ours, and the reason is measurable: a CSS filter
          rasterises the whole sub-tree it is on, so hanging tens of thousands
          of world px of extra content off cut 1's layer re-rasterises cut 1's
          own marks and f0 came back at 44.5 dB instead of identical. The
          neighbours are 1,250 / 1,400 world px away and never overlap our box,
          so two identical filters over two disjoint trees are the same pixels
          as one filter over their union. Splitting them leaves our layer's
          paint bounds exactly cut 1's — and at f0 this layer is empty, because
          every neighbour is culled. */}
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
                  d ? (
                    <path key={bi} d={d} fill={tone(bi / TONE_STEPS)} opacity={dotUnread} />
                  ) : null,
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
                {/* its own sandbox, its own tasks, its own reaches — all of it
                    on the receding rung from "they're of" */}
                <g style={{ filter: icon }}>
                  <path
                    d={BOX_PATH}
                    transform={`translate(${BOX_X0} ${BOX_Y0})`}
                    fill="none"
                    stroke={ink}
                    strokeWidth={STROKE}
                    opacity={neighInk}
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
                      opacity={neighInk}
                    />
                  ))}
                  {nb.b.tiles.map((t, i) => (
                    <path
                      key={i}
                      d={TILE_PATH}
                      transform={`translate(${t.x - TILE_HALF} ${t.y - TILE_HALF})`}
                      fill={ink}
                      opacity={neighInk}
                    />
                  ))}
                </g>
                {/* its own strike */}
                {nb.hack.lines.map((d, bi) =>
                  d ? (
                    <path
                      key={`hl${bi}`}
                      d={d}
                      fill="none"
                      stroke={accent}
                      strokeWidth={STROKE}
                      strokeLinecap="round"
                      opacity={bi / THREAD_OP_STEPS}
                    />
                  ) : null,
                )}
                {nb.hack.heads.map((d, bi) =>
                  d ? <path key={`hh${bi}`} d={d} fill={ink} opacity={bi / THREAD_OP_STEPS} /> : null,
                )}
                {/* its beads keep the 8-frame fade and ride the same receding
                    rung as the wall they land on: a mark can never be brighter
                    than the ink it is a mark ON */}
                {nb.beads.map((f) => (
                  <circle key={f.key} cx={f.x} cy={f.y} r={BEAD_R} fill={ink} opacity={neighInk * f.op} />
                ))}
              </g>
            ))}
          </svg>
        </div>
      </AbsoluteFill>

      {/* OUR SANDBOX. Cut 1's layer, its tree in cut 1's order. */}
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
              {/* the gate cut 1 left dashed: its own segment of wall is masked
                  away so the solid and the dashed are never both there */}
              <mask id="th-gate" maskUnits="userSpaceOnUse" x={-400} y={-900} width={1900} height={1900}>
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

            {/* the sandbox, with the gate masked out of its own wall */}
            <g style={{ filter: icon }}>
              <g mask="url(#th-gate)">
                <path
                  d={BOX_PATH}
                  transform={`translate(${BOX_X0} ${BOX_Y0})`}
                  fill="none"
                  stroke={ink}
                  strokeWidth={STROKE}
                  opacity={OP_READ}
                />
              </g>
              {/* the gate that was never built */}
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
                strokeDasharray={2 * Math.PI * RING.r}
                strokeDashoffset={0}
                opacity={OP_READ}
                transform={`rotate(-90 ${RING.x} ${RING.y})`}
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

            {/* the seventeen reaches, pumping against the wall. The <line>s are
                direct children of this group, in cut 1's order and with the
                twelve that do not exist yet rendering as null, so at f0 this
                sub-tree IS cut 1's five lines and nothing else. */}
            <g style={{ filter: icon }}>
              {lines.map((l) =>
                l ? (
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
                ) : null,
              )}
              {lines.map((l) =>
                l && l.head ? (
                  <circle
                    key={`h${l.key}`}
                    cx={l.head.x}
                    cy={l.head.y}
                    r={4}
                    fill={ink}
                    opacity={OP_READ}
                  />
                ) : null,
              )}
            </g>

            {/* cut 1's five tasks, landed */}
            {TILES.map((t, i) => (
              <g key={i} style={{ filter: icon }}>
                <path
                  d={TILE_PATH}
                  transform={`translate(${t.x} ${t.y}) translate(${-TILE_HALF} ${-TILE_HALF})`}
                  fill={ink}
                  opacity={OP_READ}
                />
              </g>
            ))}

            {/* the second wave, in flight and landed */}
            {wave.map((w) =>
              w ? (
                <g key={`w${w.key}`} style={{ filter: icon }}>
                  <path
                    d={TILE_PATH}
                    transform={`translate(${w.x} ${w.y}) scale(${w.scale}) translate(${-TILE_HALF} ${-TILE_HALF})`}
                    fill={ink}
                    opacity={w.op}
                  />
                </g>
              ) : null,
            )}

            {/* every bead: the snaps' and the strike's, one primitive */}
            {snapBeads.map((b) =>
              b ? (
                <circle key={b.key} cx={b.x} cy={b.y} r={BEAD_R} fill={ink} opacity={OP_READ * b.op} />
              ) : null,
            )}

            {/* the strike on our own walls */}
            {hackEls.map(drawThread)}
            {beads.map((f) => (
              <circle key={f.key} cx={f.x} cy={f.y} r={BEAD_R} fill={ink} opacity={OP_READ * f.op} />
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

      <Vignette />
    </AbsoluteFill>
  );
};

export default TryToHackOut;
