import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  BG_BASE,
  BG_DIM,
  CAM_DAMP,
  CAM_LIFT,
  CAM_STIFF,
  DOT_RADIUS,
  FRAME_H,
  GridBackground,
  ICON_SHADOW_BLUR,
  ICON_SHADOW_OPACITY,
  ICON_SHADOW_Y,
  OP_DARK,
  OP_READ,
  OP_UNREAD_DOT,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  SQUIRCLE_MIN,
  SQUIRCLE_RATIO,
  SQUIRCLE_SMOOTH,
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
// Cut 1 of this clip IS the world this piece happens in. Every constant and
// every piece of geometry is IMPORTED from it, never restated or re-derived.
import {
  BOX_H,
  BOX_PATH,
  BOX_W,
  BOX_X0,
  BOX_X1,
  BOX_Y0,
  BOX_Y1,
  CENTRE_X,
  COLS,
  CONTENT_FINAL,
  CONTENT_OPEN,
  K_FINAL,
  K_OPEN,
  LINE_SPEED,
  LINE_TIP_Y,
  MARK,
  NSEAT,
  RING,
  ROWS,
  SEATS,
  SEAT_AT,
  STROKE,
  TILES,
  TILE_HALF,
  TILE_PATH,
  TONE_DUR,
  WIFI,
  WORLD_H,
  WORLD_W,
  clamp01,
  clampi,
  smooth,
} from "./ImpossibleTasks";

export const FPS = 24;
// Dwarkesh clip `Ajeya_DC_Way`, Ajeya Cotra on the OpenAI / Hugging Face
// sandbox attack: "punishing them for, like, you know, failing to solve
// impossible tasks is a big part of the whole problem here that led to the
// desperation that, like, ultimately culminated in this attack."
//
// SRT span 0:13.960 -> 0:22.620 at 24fps.
// round((22.620 - 13.960) * 24) = round(8.660 * 24) = round(207.84) = 208
// frames of speech, plus a 48 frame tail so the editor can trim = 256.
export const DURATION = 256;

// ---------------------------------------------------------------------------
// "Led to the desperation". Orange Dwarkesh style: opaque grid cutaway, 24fps,
// 1080x1920, the crowd is the material, two tones of one warm yellow with the
// dots fully opaque, per-icon shadows, eased camera moves, one gesture per
// word.
//
// THE WORLD. This is `ImpossibleTasks.tsx`'s sandbox at the state that piece
// resolves to, and it simply IS that state at f0: the 900 x 700 ink box at
// BOX_CY 60 full of agents, the OpenAI mark above it, the internet ring outside
// with its wifi glyph, and the five task tiles landed on five agents with their
// five reaches converged on the diagonal and dead against the inside face of
// the top wall. Nothing draws in. The box, STROKE, the seat grid, SEATS, TILES
// and their converged tips, LINE_SPEED, RING, WIFI, K_OPEN / K_FINAL /
// CONTENT_OPEN / CONTENT_FINAL and TONE_DUR are all imported from cut 1; no
// geometry is re-derived here.
//
// TWO THINGS FROM CUT 1 ARE GONE, on the director's note (v4):
//   * THE DASHED GATE. Cut 1 leaves a dashed segment in the top wall at
//     x 480-600. Here the top wall is ONE CONTINUOUS SOLID LINE at STROKE 3
//     from f0, drawn exactly like the rest of the wall — "a line exactly like
//     everywhere else". Nothing else about the box changed. What opens in that
//     wall later is a break, not a door somebody left ajar.
//   * THE FOREST. v3 sent forty accent lines up out of the crowd and drew one
//     route line out of the crack. Both are deleted — the launch logic, the
//     22 px/frame speed, the route's bezier, the ring-rim landing and the "one
//     agent stays ripe" recede rule with them. The crowd itself is now the
//     pressure and the crowd itself is what gets out; nothing in this piece is
//     a line any more except the five task reaches and the idle traffic.
//
// THE STORY. The reward signal punishes the failed reaches — they are erased.
// The models try again and fail again. They are punished again: that loop is
// the problem. The pressure builds in the crowd until the lid gives, and a
// fifth of the population pours out through the break onto the internet.
//
// THE CAMERA FOLLOWS. Five moves, one track, all through the shared damper.
// Nothing pans any more: cx is 540 for the whole piece (the break is dead
// centre under the ring), so the camera only tilts and zooms, exactly as cut 1
// does, and `GridBackground` gets no cx at all.
//   M0 out to the resolved wide,
//      k 1.50 / c 140 -> k 0.95 / c -102,
//      keys f0-16 warp 0.72, landed f26   — "punishing them for"     f0-26
//   M1 IN on the lid, k 0.95 -> 1.25,
//      c -102 -> -180.5 (solved: the lid's inside face
//      at screen y 700, the box 1125 px wide, bleeding
//      off both sides). It rises WITH the five reaches,
//      keys f40-52 warp 0.72, landed f63, so "tasks"
//      lands on a still frame
//                              — "failing to solve impossible tasks" f40-65
//   M2 back OUT to k 0.95 / c -102, keys f74-82 warp
//      0.72, landed f95, so the second punishment is
//      seen whole and the loop reads as the same
//      gesture twice            — "big part of the whole problem"    f74-97
//   M3 THE CREEP. k 0.95 -> 1.90, c -102 -> -223.4,
//      solved so the LID CENTRE (540, -326: the bow's
//      apex is at the centre now) sits at screen y 640
//      at the end — one continuous even ease (warp 1.0)
//      over fifty-two frames of keys, f114-166, landed
//      f174. The riser runs under it and the lens
//      closes on the exact point that is about to give.
//      Then DEAD STILL f174-183 (0.03%/frame, sway
//      only): the freeze, and the break opens inside it
//                   — "led to the desperation that, like, ultimately" f114-174
//   M4 FOLLOW THE POUR. k 1.90 -> 1.40, c -223.4 ->
//      -203.6 (solved: the ring at screen y 560 with
//      the break still in frame below it). Keys
//      f183-195 warp 0.7 — the pull-out starts on the
//      first dot out of the gap and is still opening
//      up under "attack", one deceleration lobe that
//      decays to 0.07%/frame by f205
//                          — "culminated in this attack"             f183-205
//   M5 back to the resolved wide, k 0.95 / c -102,
//      keys f206-240, warp 0.72, landed f250, held to
//      f256                               — tail                     f206-256
//
// THE GESTURES, under it.
//   THE PUNISHMENT. From the top-wall end of each
//     reach one white ink bead runs DOWN the reach and
//     the reach ERASES behind it, from the wall end
//     down to the tile. Starts f8, 10, 12, 14, 16; one
//     speed for all five, solved so the last tile is
//     DARK on the beat (35.5 world px/frame). On
//     arrival the tile falls OP_READ -> OP_DARK over 3
//     frames and its agent ripe -> deep over TONE_DUR.
//     Resolved f26: five dark tiles on five deep
//     agents, no reaches                 — "them for"               f8-26
//   TRY AGAIN, FAIL AGAIN. The tiles come back to
//     OP_READ over 3 frames and the agents deep ->
//     ripe (f40, 43, 46, 49, 52), and two frames after
//     its own tile lights each reach draws again from
//     the tile's top edge along its converged diagonal
//     at LINE_SPEED and stops dead on the wall's inside
//     face. Last one home at f63
//                              — "failing to solve impossible tasks" f40-65
//   THE LOOP IS THE PROBLEM. The punishment repeats,
//     the same mechanism on the same five reaches at
//     the same speed: f79, 81, 83, 85, 87, all dark by
//     f97                         — "big part of the whole problem"  f79-97
//   THE WAVE. Every agent in the box goes deep -> ripe
//     from the bottom row up, f116-133. Idle traffic
//     stops launching at f116. The five dark tiles
//     light with it like everyone else
//                                    — "led to the desperation"      f116-133
//   THE RISER. The crowd IS the pressure, and every
//     part of it rides ONE curve: r(f) = ((f-118)/58)^2
//     clamped, an ease-IN, so it is barely there under
//     "desperation" and violent by "ultimately". Five
//     things read off it and nothing else happens:
//       (1) THE SHAKE — a COHERENT one (v5). Every dot
//           takes 0.55 of its own two-axis hashed
//           oscillation plus 0.45 of ONE shared
//           two-axis oscillation the whole crowd
//           leans with, on a common amplitude of
//           10 * r world px. Base rates are hashed
//           0.25-0.50 rad/frame times a multiplier
//           1 + 0.7 * r, so the fastest dot tops out
//           at 0.86 rad/frame — seven frames to a
//           cycle, so a dot can be FOLLOWED from
//           frame to frame. The riser's intensity is
//           carried by the amplitude, not by the rate.
//           A dot never crosses the box's inside
//           faces: its final position is clamped 8 px
//           inside them.
//       (2) PACK UP — the existing row-scaled lift
//           (top rows most, bottom row none, capped so
//           no dot comes within 10 px of the lid's
//           inside face at bow 0) is driven by r too.
//           The crowd does not translate, it packs.
//       (3) THE LID BOWS — the whole top run deforms
//           into a shallow arc, apex now at x 540, dead
//           centre under the ring, 36 world px at r = 1.
//       (4) THE BOX TREMBLES — the whole outline, all
//           four walls and the bow with them, takes a
//           two-axis offset 3 * r * the crowd's OWN
//           shared oscillation, so the container and
//           the mass pressing on it move together.
//           The tiles ride their agents; the mark and
//           the ring do not move.
//       (5) BREATH — the shared breath's rate goes
//           1 -> 2.2 with r, on a remapped frame so the
//           phase is continuous at f118.
//                   — "led to the desperation that, like, ultimately" f118-176
//   THE FREEZE. At f176 the jitter, the tremble and the
//     breath's extra rate all fall to zero over two
//     frames and HOLD. The crowd stands packed and dead
//     still under a fully bowed lid, the camera locked
//     since f174. Six frames of silence
//                                         — "culminated"             f176-181
//   THE BREAK. The lid splits at x 540: two round-
//     capped wall ends slide apart from a hairline to a
//     72 world px gap, eased out, f181-187 — wide
//     enough for several dots abreast. The bow stays at
//     36; the wall ends carry it
//                                         — "culminated"             f181-187
//   THE POUR. A FIFTH of the crowd gets out: the 180
//     seats nearest the break in a funnel (rank =
//     distance to the break + 0.6 * |x - 540| + hashed
//     +-45, so the hollow they leave is a cone with a
//     RAGGED edge rather than a ruled V), the five
//     tiled agents excluded. Each leaves its seat on
//     its own frame and flies its own two-cubic path:
//     up out of its seat, leaning into the centre,
//     THROUGH the gap vertically (so every path is dead
//     inside the break), then fanning out SIDEWAYS to
//     its own settle point in a HALO around the ring —
//     a 300 x 72 ellipse centred on the ring, minus a
//     clear disc of 58 so the ring stays legible in its
//     middle, hashed, feathered toward the ellipse's
//     edge, no two settled dots closer than 15 px, the
//     mark keeping 30 px of air above it. Flight
//     14-22 frames hashed, constant speed for two
//     thirds and then one decelerating lobe with a 3 px
//     overshoot, and every flight is lengthened rather
//     than sped up if it would break the 45 screen
//     px/frame close-up cap at the camera's k.
//     THE FLUX is the gesture: 0 -> 9 dots a frame over
//     f183-190, flat out to f205, decaying to a trickle
//     of one dot every six frames from f215, so the
//     tail is never still and the last few are still
//     climbing at f255. THE FIRST DOT LANDS ON THE
//     RING'S RIM AT f195, on "attack", and the ring and
//     its wifi glyph go white -> accent over the four
//     frames after it. The crowd left inside recedes
//     ripe -> deep f195-215; the escapees and the swarm
//     stay ripe and keep breathing. The hollow does not
//     refill and the lid stays bowed and open
//                              — "in this attack" and the tail      f183-256
//   held resolved, never fades out       — tail                     f195-256
//
// ambient: idle thread traffic across the crowd from f0 at the shared rate (180
// per 1,200 agents) until it stops launching at f116, `breath` on every dot,
// `sway` on the camera (the camera itself never shakes — the crowd does), the
// grid's own drift. Not gestures; that is what this field is.
// ---------------------------------------------------------------------------

export const schema = z.object({
  ink: z.string(),
  accent: z.string(), // ripe: a lit dot
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
    punishing: z.number(), // "punishing"   — the camera move opens
    them: z.number(), // "them"             — the punishment starts
    forWord: z.number(), // "for"
    like: z.number(), // "like"
    you: z.number(), // "you"
    know: z.number(), // "know"
    failing: z.number(), // "failing"       — the tiles light again
    to: z.number(), // "to"
    solve: z.number(), // "solve"
    impossible: z.number(), // "impossible"
    tasks: z.number(), // "tasks"           — the last reach is on the wall
    isA: z.number(), // "is a"
    big: z.number(), // "big"               — the punishment repeats
    part: z.number(), // "part"
    of: z.number(), // "of"
    the: z.number(), // "the"
    whole: z.number(), // "whole"
    problem: z.number(), // "problem"       — five dark tiles, no reaches
    here: z.number(), // "here"
    that: z.number(), // "that"
    led: z.number(), // "led"               — the desperation wave starts
    toTwo: z.number(), // "to"
    theTwo: z.number(), // "the"
    desperation: z.number(), // "desperation"
    thatTwo: z.number(), // "that"
    likeTwo: z.number(), // "like"
    ultimately: z.number(), // "ultimately" — the riser is violent
    culminated: z.number(), // "culminated" — the freeze, then the break
    inWord: z.number(), // "in"
    this: z.number(), // "this"
    attack: z.number(), // "attack"         — the first dot lands on the ring
    end: z.number(), // speech ends; tail to 256
  }),
});

export type Props = z.infer<typeof schema>;

// ---------------------------------------------------------------------------
// The punishment. The five reaches are erased from their wall ends down, one
// bead per reach, and the order is LONGEST FIRST — the same solve cut 1 uses
// for its deal, for the same reason. The five start slots are two frames apart
// and every bead runs at one speed, so the last one dealt has only six frames
// to get home by the beat the gesture is cut to; ordering by descending reach
// length is what makes one speed possible at all. It is a scattered order in x
// (the reaches sit at x 389, 834, 549, 249, 689), never left to right.
// ---------------------------------------------------------------------------
export const REACH_A = TILES.map((t) => ({ x: t.x, y: t.y - TILE_HALF })); // the tile end
export const REACH_B = TILES.map((t) => ({ x: t.tipX, y: LINE_TIP_Y })); // the wall end
export const REACH_LEN = TILES.map((_, i) =>
  Math.hypot(REACH_B[i].x - REACH_A[i].x, REACH_B[i].y - REACH_A[i].y),
);

export const TILE_OP_DUR = 3; // OP_READ <-> OP_DARK
export const PUNISH_STEP = 2; // frames between two beads leaving
// The gesture is not over when the last bead lands, it is over when the last
// tile has gone dark, so both erases are solved against their beat MINUS the
// tile's own ramp: the five beads are home at f23 and f94, and the five tiles
// are dark at f26 and f97, which are the frames the words land on.
export const PUNISH1 = [0, 1, 2, 3, 4].map((s) => 8 + PUNISH_STEP * s); // "them for"
export const PUNISH1_END = 26 - TILE_OP_DUR;
export const PUNISH2 = [0, 1, 2, 3, 4].map((s) => 79 + PUNISH_STEP * s); // "big part of the whole"
export const PUNISH2_END = 97 - TILE_OP_DUR;
export const RETRY = [0, 1, 2, 3, 4].map((s) => 40 + 3 * s); // "failing to solve"
export const RETRY_LEAD = 2; // frames from a tile lighting to its reach leaving

// slot 0 = the longest reach, slot 4 = the shortest
export const PUNISH_ORDER = TILES.map((_, i) => i).sort((a, b) => REACH_LEN[b] - REACH_LEN[a]);
export const SLOT: number[] = [];
PUNISH_ORDER.forEach((i, slot) => {
  SLOT[i] = slot;
});

// One speed for every bead, in both punishments: the slowest it can be and
// still have the last reach erased on the beat. Both windows are the same
// shape, so one number serves both and the loop is literally the same gesture
// twice.
export const ERASE_SPEED = Math.max(
  ...TILES.map((_, i) =>
    Math.max(
      REACH_LEN[i] / Math.max(1, PUNISH1_END - PUNISH1[SLOT[i]]),
      REACH_LEN[i] / Math.max(1, PUNISH2_END - PUNISH2[SLOT[i]]),
    ),
  ),
);

// ---------------------------------------------------------------------------
// The wall. Cut 1 draws the box as one squircle path whose top edge is the
// straight run between the two top corners; this piece has to bow that run and
// then break it, so the run is masked out of the squircle and drawn here as its
// own polyline instead. At bow 0 and gap 0 it is the same straight line at the
// same y with the same stroke and the same round caps, so f0 is cut 1's wall —
// EXCEPT that cut 1's dashed gate is not drawn at all. The director's note:
// "the struck lines under the wifi icon should be a line exactly like
// everywhere else". So there is one solid run from corner to corner, and the
// only thing that ever interrupts it is the break.
//
// WALL_P is where the squircle's corners stop and its straight top edge starts.
// It is not written down: it is the same `p` `squirclePath` itself computes
// from the shared ratio, floor and smoothing, so if that rounding is ever
// re-tuned the wall follows it.
// ---------------------------------------------------------------------------
const SHORT = Math.min(BOX_W, BOX_H);
const SQ_R = Math.min(SHORT / 2, Math.max(SQUIRCLE_RATIO * SHORT, SQUIRCLE_MIN));
export const WALL_P = Math.min(SHORT / 2, (1 + SQUIRCLE_SMOOTH) * SQ_R);
export const WALL_X0 = BOX_X0 + WALL_P;
export const WALL_X1 = BOX_X1 - WALL_P;

// THE BOW. A shallow raised-cosine arc over the whole top run, apex 36 world px
// up at x 540 — dead CENTRE, under the ring, which is where the break opens.
// Zero slope at both ends and at the apex, so it meets the corners without a
// corner of its own. It is symmetric now, because the centre is equidistant
// from both corners. It is driven by the riser's own curve, not by an ease of
// its own: the lid gives because the crowd is pushing, so it has to be on the
// same clock as the shaking.
export const BOW_AMP = 36;
export const BOW_X = CENTRE_X;
const BOW_WL = BOW_X - WALL_X0;
const BOW_WR = WALL_X1 - BOW_X;
export const bowProfile = (x: number) => {
  const d = x <= BOW_X ? (BOW_X - x) / BOW_WL : (x - BOW_X) / BOW_WR;
  if (d >= 1 || d < 0) return 0;
  return 0.5 * (1 + Math.cos(Math.PI * d));
};

// THE BREAK. The same mechanism as before — two round-capped ends sliding apart
// from a hairline, eased out — moved to the CENTRE and widened from 56 to 72
// world px. 72 is set by what has to go through it: the escapees fly the gap
// vertically in a stream, a dot is up to ~10 world px across, and 72 leaves 69
// px of open field cap to cap, which is several dots abreast rather than a slot
// one dot wide.
export const CRACK_X = CENTRE_X;
export const CRACK_GAP = 72;
export const CRACK_F0 = 181;
export const CRACK_F1 = 187;

// ---------------------------------------------------------------------------
// THE CAMERA. Five moves, and every one of them follows a gesture: the lens
// goes where the thing that is about to happen is, arrives ahead of the word,
// and then holds. Between moves nothing is on the camera but `sway`. One track:
// the moves are consecutive `camMove` segments (a key per frame), the gaps
// between them are a single held key, and the whole thing goes through the
// shared damper, so a move can never start from a standstill it has not
// actually reached.
//
// NOTHING PANS. v3 panned to x 700 because the bow and the break were there;
// they are at 540 now, so cx is CENTRE_X for the whole piece and this piece
// tilts and zooms exactly like cut 1. `GridBackground` gets no cx at all, so
// the grid's parallax is purely vertical again. The director asked for the
// camera to stay smooth while the crowd shakes: the shake is in the world, and
// there is not one frame of it on the lens.
//
// Three framings are SOLVED from what has to be in the frame rather than typed:
//   M1  the lid's inside face at screen y 700 at k 1.25 (the box is 1125 screen
//       px wide there, so it bleeds ~10px off each side)
//   M3  the LID CENTRE — (540, BOX_Y0 - BOW_AMP), the fully bowed apex, which
//       is also the point the break opens at — at screen y 640 at k 1.90
//   M4  the internet ring at screen y 560 — the upper third — at k 1.40, which
//       leaves the break in frame below it
// `CAM_LIFT / k` is what puts a content centre at screen y 835 under the
// captions, and `camMove` already takes cy off the eased k, so each of these is
// a content centre = cy - CAM_LIFT / k.
//
// KEY WINDOWS: M0-M3 end BEFORE their landing, deliberately and by measurement
// (`scratchpad/seg1/scan_v4.ts`), because the damper lags its target by ~6
// frames and keys that run to the landing frame leave the camera visibly moving
// under the word. M3's keys stop at f166 and it is landed at f174 with 0.05% of
// the move left and 0.03%/frame of drift — dead still for the freeze, so the
// break opens inside a locked frame. M4 is the exception and is meant to be:
// its keys run f183-195 because it is FOLLOWING the pour rather than arriving
// ahead of it, so the frame is still opening out under "attack" and settles to
// 0.07%/frame by f205, one deceleration lobe, just before M5 takes over.
// ---------------------------------------------------------------------------
export const K_M1 = 1.25; // "failing to solve impossible tasks" — in on the lid
export const K_M3 = 1.9; // "led to the desperation ... ultimately" — the creep
export const K_M4 = 1.4; // "culminated in this attack" — out with the pour
export const LID_SCREEN_Y = 700; // M1: where the lid's inside face sits
export const APEX_SCREEN_Y = 640; // M3: where the fully bowed lid centre sits
export const RING_SCREEN_Y = 560; // M4: the ring, in the upper third

const centreFor = (worldY: number, screenY: number, k: number) =>
  worldY + (FRAME_H / 2 - screenY) / k - CAM_LIFT / k;

export const C_M1 = centreFor(BOX_Y0 + STROKE / 2, LID_SCREEN_Y, K_M1);
export const C_M3 = centreFor(BOX_Y0 - BOW_AMP, APEX_SCREEN_Y, K_M3);
export const C_M4 = centreFor(RING.y, RING_SCREEN_Y, K_M4);
export const CY_FINAL = CONTENT_FINAL + CAM_LIFT / K_FINAL;

export type CamSeg = {
  f0: number;
  f1: number;
  k0: number;
  k1: number;
  c0: number;
  c1: number;
  warp: number;
};

export const CAM_SEGS: CamSeg[] = [
  // M0 "punishing them for" — cut 1's opening framing to cut 1's resolved one
  { f0: 0, f1: 16, k0: K_OPEN, k1: K_FINAL, c0: CONTENT_OPEN, c1: CONTENT_FINAL, warp: 0.72 },
  // M1 "failing to solve impossible tasks" — push in, rising WITH the reaches
  { f0: 40, f1: 52, k0: K_FINAL, k1: K_M1, c0: CONTENT_FINAL, c1: C_M1, warp: 0.72 },
  // M2 "big part of the whole problem" — back out, so the loop is seen whole
  { f0: 74, f1: 82, k0: K_M1, k1: K_FINAL, c0: C_M1, c1: CONTENT_FINAL, warp: 0.72 },
  // M3 "led to the desperation ... ultimately" — THE CREEP, one even ease
  { f0: 114, f1: 166, k0: K_FINAL, k1: K_M3, c0: CONTENT_FINAL, c1: C_M3, warp: 1.0 },
  // M4 "culminated in this attack" — out and up, following the pour
  { f0: 183, f1: 195, k0: K_M3, k1: K_M4, c0: C_M3, c1: C_M4, warp: 0.7 },
  // M5 the tail — back to the resolved wide
  { f0: 206, f1: 240, k0: K_M4, k1: K_FINAL, c0: C_M4, c1: CONTENT_FINAL, warp: 0.72 },
];

// One track out of the five moves. `camMove` emits a key per frame inside a
// move; a gap between two moves gets ONE key, at the frame before the next move
// starts, holding the last value — which is what makes the hold a hold and not
// a slow ramp into the next key.
const CAM_TRACK = (() => {
  const F: number[] = [];
  const K: number[] = [];
  const CY: number[] = [];
  const hold = (f: number) => {
    F.push(f);
    K.push(K[K.length - 1]);
    CY.push(CY[CY.length - 1]);
  };
  CAM_SEGS.forEach((s, n) => {
    if (n > 0 && s.f0 > CAM_SEGS[n - 1].f1 + 1) hold(s.f0 - 1);
    const m = camMove(s);
    m.F.forEach((f, i) => {
      F.push(f);
      K.push(m.K[i]);
      CY.push(m.CY[i]);
    });
  });
  if (F[F.length - 1] < DURATION) hold(DURATION);
  return { F, K, CY };
})();
export const CAM_F = CAM_TRACK.F;
export const CAM_K = CAM_TRACK.K;
export const CAM_CY = CAM_TRACK.CY;

// The damped k at every integer frame, run once. The pour's speed solve needs
// to know what the lens is doing while a dot is in the air — a world speed is
// only legible as a SCREEN speed — and asking `runCamera` per flight per
// iteration would be quadratic for no reason. Same loop as `runCamera`, same
// constants, so this table IS the camera.
export const K_AT: Float64Array = (() => {
  const a = new Float64Array(DURATION + 1);
  let cy = CAM_CY[0];
  let k = CAM_K[0];
  let vy = 0;
  let vk = 0;
  a[0] = k;
  for (let f = 1; f <= DURATION; f++) {
    const ty = interpolate(f, CAM_F, CAM_CY, clamp);
    const tk = interpolate(f, CAM_F, CAM_K, clamp);
    vy += (ty - cy) * CAM_STIFF - vy * CAM_DAMP;
    cy += vy;
    vk += (tk - k) * CAM_STIFF - vk * CAM_DAMP;
    k += vk;
    a[f] = k;
  }
  return a;
})();

// ---------------------------------------------------------------------------
// THE WAVE, and then THE RISER.
//
// The wave is unchanged: bottom row to top over f116-133, a seat's own light
// arriving on its row's frame plus a hashed couple, so nothing lights in
// unison. Everybody in the box ends up ripe.
//
// The riser is the new thing and it is ONE CURVE. r(f) = ((f - 118) / 58)^2,
// clamped to 0..1, reaching 1 exactly at f176. It is an ease-IN on purpose: at
// "desperation" (f133) it is 0.067 and you can barely see it, at "that" (f146)
// 0.23, at "like" (f158) 0.48, and by "ultimately" (f169) it is 0.78 and
// climbing — the crowd gets louder and faster the whole way in, which is what a
// riser is. Jitter, the pack-up, the bow, the box's tremble and the breath rate
// all read off this one number, so they cannot drift apart.
//
// `freezeAt` is the other half: at f176 it takes the SHAKING half of that
// (jitter, tremble, the breath's extra rate) to zero over two frames and holds
// it there. The PRESSING half (the pack-up and the bow) does not relax — the
// crowd stays packed and the lid stays bowed, because nothing has let go, it is
// about to break.
// ---------------------------------------------------------------------------
export const WAVE_F0 = 116;
export const WAVE_F1 = 133;
export const RISE_F0 = 118;
export const RISE_SPAN = 58; // r = 1 at f176
export const FREEZE_F0 = 176;
export const FREEZE_DUR = 2;

export const riseAt = (f: number) => {
  const u = clamp01((f - RISE_F0) / RISE_SPAN);
  return u * u;
};
export const freezeAt = (f: number) => clamp01(1 - (f - FREEZE_F0) / FREEZE_DUR);
export const shakeAt = (f: number) => riseAt(f) * freezeAt(f);

export const waveAt = (gr: number, i: number) =>
  WAVE_F0 + (WAVE_F1 - WAVE_F0) * ((ROWS - 1 - gr) / (ROWS - 1)) + hash(i, 57) * 2.5;

export const IDLE_STOP = WAVE_F0; // idle traffic stops launching here

// THE JITTER — A COHERENT SHAKE (v5). The director on v4: "every dot is
// somewhere else each frame — the riser reads as flicker, not shaking." It did:
// the fastest dots were running at 2.4 rad/frame, so a dot crossed its whole
// amplitude between two frames and the eye could not follow any one of them.
// Two changes, and the intensity now lives in the AMPLITUDE rather than in the
// rate:
//
//   * SLOW ENOUGH TO FOLLOW. Base rates are hashed, the rate multiplier is
//     m = 1 + 0.7 * r, and the fastest dot at r = 1 runs at 0.86 rad/frame —
//     seven frames to a cycle, every frame of it a step the eye can join up.
//   * BIGGER INSTEAD. Amplitude is 10 * r world px, up from 7.
//   * AND THE CROWD SHIVERS AS A MASS. A dot's offset is 0.55 of its OWN
//     two-axis oscillation plus 0.45 of ONE shared two-axis oscillation
//     (phases 0 and 1.7) — so the whole population leans together while each
//     dot buzzes inside that lean, which is what a body of people trembling
//     looks like and what 869 independent dots never can. The box's own
//     tremble reads the SAME shared signal, so the outline and the mass it
//     contains move together.
//
// THE RATES ARE THE BRIEF'S, SCALED BY 0.72, and that is a measurement rather
// than a preference. The brief fixes the shake by ONE number — at f170 the mean
// per-frame displacement of a dot, over its amplitude, must be <= 0.45 (v4 was
// ~1.0 per axis, 1.40 as a step) — and then names rates: own 0.35-0.7 with
// m = 1 + 0.7 r, shared 0.8 and 1.05. Those rates measure 0.592 at f170: the
// own oscillation contributes 0.411 A and the shared one 0.483 A of step, and
// the shared term alone is already over the limit, because a signal every dot
// carries is not averaged away the way 869 hashed ones are. Scaling every rate
// by 0.72 — own 0.252-0.504, shared 0.576 and 0.756, the brief's ratios between
// them untouched — lands it at 0.397, with the worst frame of the whole riser
// at 0.454. The stated ceiling of 1.2 rad/frame is kept with room to spare:
// the fastest dot is at 0.86 and the shared signal at 0.756.
//
// The phase is still applied through a REMAPPED FRAME rather than by
// multiplying f, which is the one thing here that is not literally the brief's
// formula, and it has to be: sin(w * f * m(f)) has instantaneous rate
// w * (m + f * m'), and that f * m' term alone is several rad/frame — past
// Nyquist at 24fps, so the shake would alias into a crawl exactly when it is
// meant to be at its widest. `phaseTable` integrates the rate instead, so the
// instantaneous rate is exactly w * m(f) and the phase is continuous at f118
// (the table is the identity before it). The shared signal needs no table: its
// rates are constant, so plain f already has the rate it says it has.
export const JIT_AMP = 10; // world px at r = 1
export const JIT_RATE_LO = 0.252; // the brief's 0.35, x 0.72
export const JIT_RATE_HI = 0.504; // the brief's 0.7,  x 0.72
export const JIT_RATE_MUL = 0.7; // m = 1 + 0.7 * r, so w * m <= 0.86 rad/frame
export const JIT_OWN = 0.55; // the dot's own oscillation
export const JIT_COMMON = 0.45; // the crowd's, shared by every dot
export const COMMON_W1 = 0.576; // the brief's 0.8,  x 0.72
export const COMMON_W2 = 0.756; // the brief's 1.05, x 0.72
export const COMMON_P1 = 0;
export const COMMON_P2 = 1.7;
export const BREATH_MUL = 1.2; // breath rate 1 -> 2.2
export const DOT_CLEAR = 8; // world px a dot must leave inside every wall

const phaseTable = (mul: number) => {
  const a = new Float64Array(DURATION + 1);
  for (let f = 1; f <= DURATION; f++) a[f] = a[f - 1] + 1 + mul * shakeAt(f - 0.5);
  return a;
};
export const PH_JIT = phaseTable(JIT_RATE_MUL);
export const PH_BREATH = phaseTable(BREATH_MUL);
export const phAt = (t: Float64Array, f: number) => t[clampi(Math.round(f), 0, DURATION)];

const TAU = Math.PI * 2;
export const JIT_W1 = new Float32Array(NSEAT);
export const JIT_W2 = new Float32Array(NSEAT);
export const JIT_P1 = new Float32Array(NSEAT);
export const JIT_P2 = new Float32Array(NSEAT);
for (let i = 0; i < NSEAT; i++) {
  JIT_W1[i] = JIT_RATE_LO + (JIT_RATE_HI - JIT_RATE_LO) * hash(i, 81);
  JIT_W2[i] = JIT_RATE_LO + (JIT_RATE_HI - JIT_RATE_LO) * hash(i, 82);
  JIT_P1[i] = hash(i, 83) * TAU;
  JIT_P2[i] = hash(i, 84) * TAU;
}

// THE CROWD'S COMMON MODE. One two-axis oscillation, the same for every dot and
// for the box itself: the lean the whole population takes together.
export const commonMode = (f: number) => ({
  x: Math.sin(COMMON_P1 + COMMON_W1 * f),
  y: Math.sin(COMMON_P2 + COMMON_W2 * f),
});

// A dot's shake, world px, before the wall clamp: its own oscillation and the
// crowd's, both on one amplitude.
export const jitterAt = (i: number, f: number) => {
  const s = shakeAt(f);
  if (s <= 0) return { dx: 0, dy: 0 };
  const A = JIT_AMP * s;
  const pj = phAt(PH_JIT, f);
  const c = commonMode(f);
  return {
    dx: A * (JIT_OWN * Math.sin(JIT_P1[i] + JIT_W1[i] * pj) + JIT_COMMON * c.x),
    dy: A * (JIT_OWN * Math.sin(JIT_P2[i] + JIT_W2[i] * pj) + JIT_COMMON * c.y),
  };
};

// THE BOX TREMBLES. The whole outline — all four walls and the bow with them —
// takes this offset, and it is the crowd's OWN common mode, scaled: the outline
// and the mass pressing on it move together, which is what makes the tremble
// read as one body of pressure rather than as two effects. The tiles ride their
// agents; the mark and the ring are outside and do not move at all, which is
// what keeps the shake reading as pressure inside a container rather than as a
// camera.
export const TREM_AMP = 3;

// ---------------------------------------------------------------------------
// THE CROWD PACKS UP. Not a new object: the crowd that is already there,
// leaning on the lid. Every dot drifts UP by an amount scaled by its row — the
// top row the most, the bottom row not at all — so the population compresses
// against the wall it is bowing. Its task tile rides up with it, because a tile
// sits ON an agent. Driven by r(f) now, and it does NOT relax: once the lid is
// open the crowd stays where the pressure put it.
//
// A dot may never enter the lid, so LIFT_MAX is a ceiling and not a promise:
// each seat's lift is capped so that the TOP OF THE DOT — its radius at full
// breath (x1.05) and fully lit (x1.35) — stays LIFT_CLEAR under the wall's
// inside face at bow 0, which is the tightest the gap ever is (the bow only
// ever opens it). Four seats of the top row bind on that cap, and the one that
// already sits 8.4 px under the face does not move at all. The jitter on top of
// this is clamped separately, at DOT_CLEAR inside every face.
// ---------------------------------------------------------------------------
export const LIFT_MAX = 12; // world px, at the top row
export const LIFT_CLEAR = 10; // world px a dot must leave under the inside face
const DOT_MAX = 1.05 * 1.35; // breath at full, lit at full
export const LIFT_AT: Float32Array = (() => {
  const a = new Float32Array(NSEAT);
  const face = BOX_Y0 + STROKE / 2;
  for (let i = 0; i < NSEAT; i++) {
    const s = SEATS[i];
    const rowShare = (ROWS - 1 - s.gr) / (ROWS - 1); // 1 at the top row, 0 at the bottom
    const rDot = DOT_RADIUS * s.r * s.rs * DOT_MAX;
    a[i] = Math.max(0, Math.min(LIFT_MAX * rowShare, s.y - rDot - face - LIFT_CLEAR));
  }
  return a;
})();

// ---------------------------------------------------------------------------
// THE POUR. A fifth of the crowd gets out through the break.
//
// WHO. The seats nearest the break, ranked by
//   dist((x, y), (540, lid)) + 0.6 * |x - 540| + hashed +-45
// — a funnel rather than a disc, so the hollow they leave behind is a CONE
// under the break, wide at the lid and narrow at the bottom, which is the shape
// a drain leaves. The hashed term is v5: without it the rank is a smooth field
// and its level set is a RULED V, a drawn shape rather than a hole torn in a
// crowd. +-45 world px of noise on the distance puts a few stayers inside the
// cone's edge and takes a few leavers from outside it, so the edge is ragged at
// about three dot-spacings — the hollow still reads as a cone, but nobody drew
// it. The five tiled agents are excluded: the tasks stay seated. The position
// ranked is the FROZEN one (seat + pack-up), because that is where the crowd
// actually is when the lid gives.
//
// WHERE THEY GO — A HALO, NOT A DOME (v5). The director on v4: "the swarm is a
// dense dome that swallows the ring and comes within a few px of the mark." It
// was: an annulus out to ~170 in every direction, most of which sat directly
// over the ring. The settle region is now WIDE, THIN and CENTRED ON THE RING —
// an ellipse of semi-axes 300 x 72 — MINUS a clear disc of 58 around the ring's
// centre, so the ring and its wifi glyph sit in an open middle with the crowd
// spread out sideways on either side of them. Clipped top and bottom: nothing
// above the mark's bottom edge minus its 30 px of air, nothing below the lid's
// outside face plus 12. Hashed, placed by reject-and-retry at SWARM_SEP
// separation, with the density FEATHERED toward the ellipse's edge by the
// shared `feather` — measured in the ellipse's own x units, so the halo thins
// out sideways into nothing rather than stopping at a drawn line.
//
// The halo holds 194 dots at 15 px separation before it jams, so ESCAPE_N came
// down from 210 to 180 — it is the count that fits the shape the director
// asked for, with enough margin that the placer converges in 183k candidates
// instead of millions. The swarm is drawn UNDER the ring, which the draw order
// already did, and the ring goes to ACCENT over f195-199 on top of it.
//
// The FIRST settle point is not hashed: it is the point on the halo's inner
// edge directly above the break, because the first dot out has to land on the
// ring, on "attack".
//
// THE ORDER. Nearest seat first, and the settle points are handed out nearest
// the break first too, so the halo grows outward from the ring as the pour
// runs rather than appearing at its final size.
// ---------------------------------------------------------------------------
export const ESCAPE_N = 180; // a fifth of the crowd: what the halo holds
const LID_Y = BOX_Y0 - BOW_AMP; // the fully bowed lid, at the centre
export const CRACK_MOUTH = { x: CRACK_X, y: LID_Y - STROKE / 2 }; // its outside face
export const FUNNEL_W = 0.6; // the |x - 540| term that makes the hollow a cone
export const FUNNEL_NOISE = 45; // world px of hashed noise: a torn edge, not a ruled one

const TILE_SEAT = new Set(TILES.map((t) => t.seat));
export const ESCAPEES: number[] = SEATS.map((s, i) => i)
  .filter((i) => !TILE_SEAT.has(i))
  .map((i) => ({
    i,
    d:
      Math.hypot(SEATS[i].x - CRACK_X, SEATS[i].y - LIFT_AT[i] - LID_Y) +
      FUNNEL_W * Math.abs(SEATS[i].x - CRACK_X) +
      (hash(i, 96) * 2 - 1) * FUNNEL_NOISE,
  }))
  .sort((a, b) => a.d - b.d)
  .slice(0, ESCAPE_N)
  .map((e) => e.i);

export const HALO_A = 300; // horizontal semi-axis of the settle ellipse
export const HALO_B = 72; // vertical semi-axis: wide and thin
export const SWARM_IN = 58; // the clear disc around the ring: it stays legible
export const SWARM_SEP = 15; // minimum separation between two settled dots
export const SWARM_FW = 90; // feathered edge, in the ellipse's own x units
export const MARK_AIR = 30; // world px of air the mark keeps under it
const MARK_HALF = 54; // markSize / 2 at the default props
export const SWARM_Y0 = MARK.y + MARK_HALF + MARK_AIR; // -476: no higher than this
export const SWARM_Y1 = LID_Y - STROKE / 2 - 12; // -339.5: clear of the lid

export const SWARM: { x: number; y: number }[] = (() => {
  // the one that is not hashed: the inner-edge point directly above the break
  const pts = [{ x: RING.x, y: RING.y + SWARM_IN }];
  let n = 0;
  while (pts.length < ESCAPE_N && n < 2_000_000) {
    const x = RING.x + (hash(n, 91) * 2 - 1) * HALO_A;
    const y = RING.y + (hash(n, 92) * 2 - 1) * HALO_B;
    n++;
    const dx = x - RING.x;
    const dy = y - RING.y;
    const rho = Math.hypot(dx / HALO_A, dy / HALO_B); // 1 at the ellipse's edge
    if (rho > 1) continue;
    if (dx * dx + dy * dy < SWARM_IN * SWARM_IN) continue; // the ring's clear middle
    if (y < SWARM_Y0 || y > SWARM_Y1) continue;
    if (hash(n, 93) >= feather((1 - rho) * HALO_A, SWARM_FW)) continue;
    if (pts.some((p) => (p.x - x) * (p.x - x) + (p.y - y) * (p.y - y) < SWARM_SEP * SWARM_SEP)) {
      continue;
    }
    pts.push({ x, y });
  }
  const head = pts[0];
  const rest = pts
    .slice(1)
    .sort(
      (p, q) =>
        Math.hypot(p.x - CRACK_MOUTH.x, p.y - CRACK_MOUTH.y) -
        Math.hypot(q.x - CRACK_MOUTH.x, q.y - CRACK_MOUTH.y),
    );
  return [head, ...rest];
})();

// THE FLUX. The gesture of the pour is not any one dot, it is the RATE: it
// ramps up, runs flat out, and then decays to a trickle that keeps the tail
// alive. The profile below is integrated and then scaled so that exactly
// ESCAPE_N dots leave inside it, which is what turns "~9 a frame" into the
// launch frame of every individual dot without any of them being typed.
export const POUR_F0 = 183;
export const POUR_PEAK = 9; // dots per frame at full flux
export const POUR_TRICKLE = 1 / 6; // one dot every six frames
export const POUR_FLAT0 = 190; // the ramp is over
export const POUR_FLAT1 = 205; // the decay begins
export const POUR_DECAY1 = 215; // the trickle begins
export const POUR_END = 254; // the last dot leaves, six frames before the cut
export const POUR_FIRST_LAND = 195; // "attack": the first dot is on the rim

const fluxAt = (f: number) => {
  if (f < POUR_F0 || f > POUR_END) return 0;
  if (f < POUR_FLAT0) return (POUR_PEAK * (f - POUR_F0)) / (POUR_FLAT0 - POUR_F0);
  if (f < POUR_FLAT1) return POUR_PEAK;
  if (f < POUR_DECAY1)
    return (
      POUR_PEAK +
      ((POUR_TRICKLE - POUR_PEAK) * (f - POUR_FLAT1)) / (POUR_DECAY1 - POUR_FLAT1)
    );
  return POUR_TRICKLE;
};

const POUR_SOLVE = (() => {
  const step = 0.25;
  const F: number[] = [];
  const C: number[] = [];
  let acc = 0;
  for (let f = POUR_F0; f <= POUR_END + step; f += step) {
    F.push(f);
    C.push(acc);
    acc += fluxAt(f + step / 2) * step;
  }
  const scale = ESCAPE_N / acc; // so exactly ESCAPE_N dots leave inside it
  const launch: number[] = [];
  let idx = 0;
  for (let j = 0; j < ESCAPE_N; j++) {
    const target = j / scale;
    while (idx < C.length - 2 && C[idx + 1] <= target) idx++;
    const t = C[idx + 1] > C[idx] ? (target - C[idx]) / (C[idx + 1] - C[idx]) : 0;
    launch.push(F[idx] + t * step);
  }
  return { launch, scale };
})();
export const POUR_LAUNCH: number[] = POUR_SOLVE.launch;
export const POUR_FLUX_PEAK = POUR_PEAK * POUR_SOLVE.scale; // dots/frame, measured

// THE FLIGHT. Two cubics, joined at the mouth of the break with a VERTICAL
// tangent on both sides, so every path goes through the gap dead straight and
// none of them clips a wall end: the "control point that keeps every path
// inside the gap" is simply the mouth itself, approached and left at x 540.
// Before it the path leans out of its seat toward the centre; after it the path
// fans out to the dot's own settle point. Both halves are sampled to a polyline
// so the dot travels at a controlled ARC LENGTH per frame rather than at a
// controlled parameter, which is the difference between a flock and a set of
// tweens.
//
// THE SPEED PROFILE. Constant for the first two thirds, then one decelerating
// lobe with a small overshoot — "they arrive and settle". The lobe is
// `easeOutBack`, and its back amount `s` is SOLVED per dot so the overshoot is
// FLIGHT_OVERSHOOT world px whatever the path length is, rather than a fixed
// fraction that would fling the long flights 15 px past the ring. The constant
// leg's speed `Pa / a` is then pinned by C1 continuity at the join, so the
// whole profile has one number in it and no corner.
//
// THE CAP. Flight time is hashed 14-22 frames, and then LENGTHENED — never
// sped up — until the fastest frame of the flight is under SPEED_CAP screen
// px/frame at the camera's own k while the dot is in the air. A far seat
// leaving at f185 is under k 1.87; the same seat leaving at f240 is under 1.2,
// so the same path is allowed to be quicker late in the pour. That is the
// close-up speed rule applied to a crowd instead of to a camera.
export const FLIGHT_T0 = 14;
export const FLIGHT_T1 = 22;
export const FLIGHT_A = 2 / 3; // the constant-speed share of a flight
export const FLIGHT_OVERSHOOT = 3; // world px past the settle point
export const SPEED_CAP = 45; // screen px/frame, the house close-up cap
const CUBIC_N = 20;

// C1 at the join: Pa / a = (1 - Pa) * (s + 3) / (1 - a), solved for Pa. At
// s = 0 (no overshoot at all) it is 6/7, and the constant leg then runs at
// 1.286 times the flight's average speed.
const paOf = (s: number) => (FLIGHT_A * (s + 3)) / (1 - FLIGHT_A + FLIGHT_A * (s + 3));
const overshootOf = (s: number, L: number) =>
  (L * (1 - paOf(s)) * (4 * s * s * s)) / (27 * (s + 1) * (s + 1));

export const progressAt = (u: number, pa: number, s: number) => {
  if (u <= FLIGHT_A) return (pa * u) / FLIGHT_A;
  const t = Math.min(1, (u - FLIGHT_A) / (1 - FLIGHT_A));
  const v = t - 1;
  return pa + (1 - pa) * (1 + (s + 1) * v * v * v + s * v * v);
};

export type Flight = {
  seat: number;
  launch: number;
  dur: number;
  pa: number;
  back: number;
  len: number;
  px: Float32Array;
  py: Float32Array;
  cum: Float32Array;
  settle: { x: number; y: number };
};

const cubicAt = (
  p0: { x: number; y: number },
  c1: { x: number; y: number },
  c2: { x: number; y: number },
  p3: { x: number; y: number },
  t: number,
) => {
  const u = 1 - t;
  return {
    x: u * u * u * p0.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * p3.x,
    y: u * u * u * p0.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * p3.y,
  };
};

export const FLIGHTS: Flight[] = ESCAPEES.map((i, j) => {
  const s = SEATS[i];
  const P0 = { x: s.x, y: s.y - LIFT_AT[i] }; // where the freeze left it
  const M = CRACK_MOUTH;
  const P3 = SWARM[j];
  const dy = P0.y - M.y;
  const A1 = { x: P0.x + 0.35 * (CRACK_X - P0.x), y: P0.y - 0.35 * dy };
  const A2 = { x: CRACK_X, y: M.y + 0.45 * dy }; // straight below the mouth
  const DY = M.y - P3.y;
  const B1 = { x: CRACK_X, y: M.y - 0.45 * DY }; // straight above it
  const B2 = { x: P3.x + 0.35 * (CRACK_X - P3.x), y: P3.y + 0.35 * DY };

  const xs: number[] = [];
  const ys: number[] = [];
  for (let n = 0; n <= CUBIC_N; n++) {
    const p = cubicAt(P0, A1, A2, M, n / CUBIC_N);
    xs.push(p.x);
    ys.push(p.y);
  }
  for (let n = 1; n <= CUBIC_N; n++) {
    const p = cubicAt(M, B1, B2, P3, n / CUBIC_N);
    xs.push(p.x);
    ys.push(p.y);
  }
  const cum = new Float32Array(xs.length);
  for (let n = 1; n < xs.length; n++) {
    cum[n] = cum[n - 1] + Math.hypot(xs[n] - xs[n - 1], ys[n] - ys[n - 1]);
  }
  const len = cum[cum.length - 1];

  // the back amount that gives exactly FLIGHT_OVERSHOOT world px, by bisection
  let lo = 0;
  let hi = 8;
  for (let it = 0; it < 40; it++) {
    const m = (lo + hi) / 2;
    if (overshootOf(m, len) < FLIGHT_OVERSHOOT) lo = m;
    else hi = m;
  }
  const back = (lo + hi) / 2;
  const pa = paOf(back);

  const launch = POUR_LAUNCH[j];
  let dur = FLIGHT_T0 + Math.round(hash(i, 95) * (FLIGHT_T1 - FLIGHT_T0));
  for (let it = 0; it < 8; it++) {
    let kmax = 0;
    const f1 = launch + dur * FLIGHT_A;
    for (let f = Math.floor(launch); f <= Math.ceil(f1); f++) {
      kmax = Math.max(kmax, K_AT[clampi(f, 0, DURATION)]);
    }
    const need = ((len * pa) / FLIGHT_A) * (kmax / SPEED_CAP);
    if (need <= dur) break;
    dur = Math.ceil(need);
  }
  // the first one out is solved to land on the rim on "attack", not hashed
  if (j === 0) dur = POUR_FIRST_LAND - POUR_F0;
  return {
    seat: i,
    launch,
    dur,
    pa,
    back,
    len,
    px: Float32Array.from(xs),
    py: Float32Array.from(ys),
    cum,
    settle: P3,
  };
});

export const FLIGHT_OF = (() => {
  const a = new Int32Array(NSEAT).fill(-1);
  FLIGHTS.forEach((fl, j) => {
    a[fl.seat] = j;
  });
  return a;
})();

export const flightPos = (fl: Flight, frame: number) => {
  const u = clamp01((frame - fl.launch) / fl.dur);
  const p = progressAt(u, fl.pa, fl.back);
  const arc = p * fl.len;
  const last = fl.cum.length - 1;
  if (arc >= fl.len) {
    const ex = fl.px[last] - fl.px[last - 1];
    const ey = fl.py[last] - fl.py[last - 1];
    const d = Math.hypot(ex, ey) || 1;
    const o = arc - fl.len;
    return { x: fl.px[last] + (ex / d) * o, y: fl.py[last] + (ey / d) * o };
  }
  let lo = 0;
  let hi = last;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (fl.cum[m] <= arc) lo = m;
    else hi = m;
  }
  const t = fl.cum[hi] > fl.cum[lo] ? (arc - fl.cum[lo]) / (fl.cum[hi] - fl.cum[lo]) : 0;
  return { x: fl.px[lo] + (fl.px[hi] - fl.px[lo]) * t, y: fl.py[lo] + (fl.py[hi] - fl.py[lo]) * t };
};

// The crowd that did NOT get out goes back to deep over the twenty frames after
// the first dot lands. The escapees — in the air, already settled, or still
// queued in their seat — stay ripe.
export const RECEDE_F0 = 195;
export const RECEDE_DUR = 20;
export const RING_LIT_DUR = 4; // white -> accent, from the first landing

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
    punishing: 0,
    them: 7,
    forWord: 15,
    like: 26,
    you: 36,
    know: 37,
    failing: 40,
    to: 46,
    solve: 49,
    impossible: 55,
    tasks: 65,
    isA: 73,
    big: 79,
    part: 81,
    of: 85,
    the: 89,
    whole: 94,
    problem: 97,
    here: 106,
    that: 111,
    led: 116,
    toTwo: 121,
    theTwo: 125,
    desperation: 133,
    thatTwo: 146,
    likeTwo: 158,
    ultimately: 169,
    culminated: 176,
    inWord: 189,
    this: 192,
    attack: 195,
    end: 208,
  },
});

const LedToTheDesperation: React.FC<Props> = ({
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
  // 0 = unread (deep), 1 = lit (ripe). Built once per frame, read per dot.
  const tone = makeTone(accentDeep, accent);
  // the ring's own ramp, ink -> accent, on the first dot's landing
  const inkToAccent = makeTone(ink, accent);

  // -- the schedule, off the words ------------------------------------------
  const SLOTS = [0, 1, 2, 3, 4];
  const p1 = SLOTS.map((s) => beats.them + 1 + PUNISH_STEP * s); // 8, 10, 12, 14, 16
  const rt = SLOTS.map((s) => beats.failing + 3 * s); // 40, 43, 46, 49, 52
  const p2 = SLOTS.map((s) => beats.big + PUNISH_STEP * s); // 79, 81, 83, 85, 87
  const waveShift = beats.led - WAVE_F0; // 0 at the default beats
  const crackF0 = beats.culminated + (CRACK_F0 - FREEZE_F0); // 181
  const crackF1 = crackF0 + (CRACK_F1 - CRACK_F0); // 187

  // -- the riser -------------------------------------------------------------
  const press = riseAt(frame); // the pack-up and the bow; never relaxes
  const shake = shakeAt(frame); // jitter, tremble, breath rate; zero after f178
  const common = commonMode(frame); // the lean the whole crowd takes together
  const tremX = TREM_AMP * shake * common.x;
  const tremY = TREM_AMP * shake * common.y;

  // -- the wall's shape this frame ------------------------------------------
  const wallY = (x: number) => BOX_Y0 - BOW_AMP * bowProfile(x) * press;
  const wallPath = (x0: number, x1: number) => {
    const n = Math.max(2, Math.ceil(Math.abs(x1 - x0) / 12));
    let d = "";
    for (let i = 0; i <= n; i++) {
      const x = x0 + ((x1 - x0) * i) / n;
      d += `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${wallY(x).toFixed(2)}`;
    }
    return d;
  };
  const gap =
    CRACK_GAP *
    interpolate(frame, [crackF0, crackF1], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });

  // -- a dot's position inside the box --------------------------------------
  // seat + pack-up + jitter, then clamped so it can never cross a wall. The
  // clamp is against the UNTREMBLED faces: the tremble is 3 px at its worst and
  // DOT_CLEAR is 8, so a dot still has five px of wall even at the extreme of
  // the shake.
  const X_LO = BOX_X0 + STROKE / 2 + DOT_CLEAR;
  const X_HI = BOX_X1 - STROKE / 2 - DOT_CLEAR;
  const Y_HI = BOX_Y1 - STROKE / 2 - DOT_CLEAR;
  const seatPos = (i: number) => {
    const s = SEATS[i];
    let x = s.x;
    let y = s.y - LIFT_AT[i] * press;
    if (shake > 0) {
      const j = jitterAt(i, frame);
      x += j.dx;
      y += j.dy;
      x = Math.max(X_LO, Math.min(X_HI, x));
      y = Math.max(wallY(x) + STROKE / 2 + DOT_CLEAR, Math.min(Y_HI, y));
    }
    return { x, y };
  };

  // -- where every agent actually is this frame ------------------------------
  // An escapee that has launched is on its flight; everybody else is in its
  // seat. A seat a dot has left stays empty: the hollow does not refill.
  const POS: { x: number; y: number }[] = new Array(NSEAT);
  const GONE = new Uint8Array(NSEAT);
  for (let i = 0; i < NSEAT; i++) POS[i] = seatPos(i);
  FLIGHTS.forEach((fl) => {
    if (frame >= fl.launch) {
      POS[fl.seat] = flightPos(fl, frame);
      GONE[fl.seat] = 1;
    }
  });

  // -- the crowd's tone ------------------------------------------------------
  // Three things write to a seat's tone and they are stacked in the order they
  // happen: the five task agents' punish -> retry -> punish loop, the
  // desperation wave over everybody, and the recede after the escape.
  const recede = smooth((frame - RECEDE_F0) / RECEDE_DUR);
  const seatTone = new Float32Array(NSEAT);
  const tileTone: number[] = [];
  TILES.forEach((t, i) => {
    const s = SLOT[i];
    // the disjoint ramps of the loop, added: 1 at f0, 0 after each punishment
    const lvl = (dur: number) =>
      clamp01(
        1 -
          smooth((frame - (p1[s] + REACH_LEN[i] / ERASE_SPEED)) / dur) +
          smooth((frame - rt[s]) / dur) -
          smooth((frame - (p2[s] + REACH_LEN[i] / ERASE_SPEED)) / dur),
      );
    seatTone[t.seat] = lvl(TONE_DUR);
    tileTone[i] = lvl(TILE_OP_DUR);
  });
  for (let i = 0; i < NSEAT; i++) {
    const wave = smooth((frame - (waveAt(SEATS[i].gr, i) + waveShift)) / TONE_DUR);
    let v = Math.max(seatTone[i], wave);
    if (FLIGHT_OF[i] < 0) v *= 1 - recede; // the ones who got out stay ripe
    seatTone[i] = v;
  }
  // the five dark tiles come back up with the wave like everyone else
  TILES.forEach((t, i) => {
    tileTone[i] = Math.max(
      tileTone[i],
      smooth((frame - (waveAt(SEATS[t.seat].gr, t.seat) + waveShift)) / TONE_DUR),
    );
  });

  // -- idle traffic ----------------------------------------------------------
  // Cut 1's ambient, unchanged, with one addition: a thread whose cycle would
  // BEGIN at or after f116 never launches. The ones already running finish, and
  // they ride the crowd's jitter, because a thread is between two agents.
  const lit = new Float32Array(NSEAT);
  type Th = { key: string; x1: number; y1: number; x2: number; y2: number; op: number; head: number };
  const threadEls: Th[] = [];

  const reach = 5;
  for (let j = 0; j < idleThreadCount; j++) {
    const period = 44 - 12 * hash(j, 4);
    const local = frame + hash(j, 5) * period;
    const cycle = Math.floor(local / period);
    if (cycle * period - hash(j, 5) * period >= beats.led) continue;
    const phase = (local - cycle * period) / period;
    const seed = j * 131 + cycle * 7;
    const a = Math.floor(hash(seed, 6) * NSEAT);
    const sa = SEATS[a];
    const bc = clampi(sa.gc + Math.round((hash(seed, 7) - 0.5) * 2 * reach), 0, COLS - 1);
    const br = clampi(sa.gr + Math.round((hash(seed, 8) - 0.5) * 2 * reach), 0, ROWS - 1);
    const b = SEAT_AT[br * COLS + bc];
    if (b < 0 || b === a) continue;
    const dn = interpolate(phase, [0, 0.3], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
    const fade = interpolate(phase, [0.55, 1], [1, 0], clamp);
    if (fade <= 0.02) continue;
    lit[a] = Math.max(lit[a], fade);
    lit[b] = Math.max(lit[b], dn * fade);
    const pa = POS[a];
    const pb = POS[b];
    threadEls.push({
      key: `i${j}`,
      x1: pa.x,
      y1: pa.y,
      x2: pa.x + (pb.x - pa.x) * dn,
      y2: pa.y + (pb.y - pa.y) * dn,
      op: 0.4 * fade,
      head: dn,
    });
  }

  // -- the five reaches: erased, redrawn, erased ----------------------------
  // One extent per reach, measured from the TILE end. It starts at 1 (cut 1
  // left it against the wall), the first erase takes it to 0, the retry draws
  // it back to 1, the second erase takes it to 0 again. The three ramps never
  // overlap, so they simply add.
  const reaches = TILES.map((_, i) => {
    const s = SLOT[i];
    const dur = REACH_LEN[i] / ERASE_SPEED;
    const u1 = clamp01((frame - p1[s]) / dur);
    const u2 = clamp01((frame - p2[s]) / dur);
    const drawn = clamp01(((frame - (rt[s] + RETRY_LEAD)) * LINE_SPEED) / REACH_LEN[i]);
    const e = clamp01(1 - u1 + drawn - u2);
    const A = REACH_A[i];
    const B = REACH_B[i];
    // a bead only exists while an erase is actually running
    const erasing = u1 > 0 && u1 < 1 ? u1 : u2 > 0 && u2 < 1 ? u2 : -1;
    return {
      key: i,
      x1: A.x,
      y1: A.y,
      x2: A.x + (B.x - A.x) * e,
      y2: A.y + (B.y - A.y) * e,
      on: e > 0.002,
      bead: erasing < 0 ? null : { x: B.x + (A.x - B.x) * erasing, y: B.y + (A.y - B.y) * erasing },
    };
  });

  const ringLit = smooth((frame - beats.attack) / RING_LIT_DUR);
  const ringCol = inkToAccent(ringLit);

  // -- the internet ring (cut 1 left it closed and its glyph at full) --------
  const RING_C = 2 * Math.PI * RING.r;
  const wifiCx = RING.x;
  const wifiCy = RING.y + WIFI.dy;

  // -- camera ----------------------------------------------------------------
  const cam = runCamera(frame, CAM_F, CAM_CY, CAM_K);
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = CENTRE_X + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);

  // -- the per-icon shadow ---------------------------------------------------
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);

  const bFrame = phAt(PH_BREATH, frame);

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <GridBackground
        src={backgroundSrc}
        blur={backgroundBlur}
        dim={backgroundDim}
        frame={frame}
        cy={cy}
        cyRest={CAM_CY[0]}
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
            <defs>
              {/* the squircle's straight top run is always drawn by hand below,
                  so it can bow and break; at bow 0 / gap 0 the two are the same
                  line and f0 is cut 1's wall */}
              <mask id="ltd-top" maskUnits="userSpaceOnUse" x={-400} y={-900} width={1900} height={1900}>
                <rect x={-400} y={-900} width={1900} height={1900} fill="#fff" />
                <rect
                  x={WALL_X0}
                  y={BOX_Y0 - STROKE}
                  width={WALL_X1 - WALL_X0}
                  height={2 * STROKE}
                  fill="#000"
                />
              </mask>
            </defs>

            {/* the crowd: in its seat, or on its way out */}
            {SEATS.map((s, i) => {
              const out = GONE[i] === 1;
              const l = out ? 1 : Math.max(lit[i] * (1 - recede), seatTone[i]);
              const p = POS[i];
              const r =
                dotRadius * s.r * s.rs * breath(bFrame, hash(i, 9)) * (1 + 0.35 * l);
              return <circle key={i} cx={p.x} cy={p.y} r={r} fill={tone(l)} opacity={dotUnread} />;
            })}

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

            {/* the sandbox: the squircle with its top run masked away, and that
                run drawn here so it can bow and break. The whole outline
                trembles with the pressure inside it. */}
            <g transform={`translate(${tremX.toFixed(3)} ${tremY.toFixed(3)})`}>
              <g style={{ filter: icon }}>
                <g mask="url(#ltd-top)">
                  <path
                    d={BOX_PATH}
                    transform={`translate(${BOX_X0} ${BOX_Y0})`}
                    fill="none"
                    stroke={ink}
                    strokeWidth={STROKE}
                    opacity={OP_READ}
                  />
                </g>
                <g fill="none" stroke={ink} strokeWidth={STROKE} opacity={OP_READ}>
                  {/* one continuous solid lid, split only by the break */}
                  <path d={wallPath(WALL_X0, CRACK_X - gap / 2)} strokeLinecap="round" />
                  <path d={wallPath(CRACK_X + gap / 2, WALL_X1)} strokeLinecap="round" />
                </g>
              </g>
            </g>

            {/* the internet: cut 1's ring and glyph, ink until the first dot */}
            <g style={{ filter: icon }}>
              <circle
                cx={RING.x}
                cy={RING.y}
                r={RING.r}
                fill="none"
                stroke={ringCol}
                strokeWidth={STROKE}
                strokeLinecap="round"
                strokeDasharray={RING_C}
                opacity={OP_READ + (1 - OP_READ) * ringLit}
                transform={`rotate(-90 ${RING.x} ${RING.y})`}
              />
              <g
                opacity={OP_READ + (1 - OP_READ) * ringLit}
                fill="none"
                stroke={ringCol}
                strokeWidth={STROKE}
                strokeLinecap="round"
              >
                {WIFI.radii.map((r) => (
                  <path
                    key={r}
                    d={`M ${wifiCx - r * Math.sin(WIFI.halfAngle)} ${wifiCy - r * Math.cos(WIFI.halfAngle)} A ${r} ${r} 0 0 1 ${wifiCx + r * Math.sin(WIFI.halfAngle)} ${wifiCy - r * Math.cos(WIFI.halfAngle)}`}
                  />
                ))}
                <circle cx={wifiCx} cy={wifiCy} r={WIFI.dot} fill={ringCol} stroke="none" />
              </g>
            </g>

            {/* the five task reaches, and the bead that erases one */}
            <g style={{ filter: icon }}>
              {reaches.map((l) =>
                l.on ? (
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
              {reaches.map((l) =>
                l.bead ? (
                  <circle key={`b${l.key}`} cx={l.bead.x} cy={l.bead.y} r={4} fill={ink} />
                ) : null,
              )}
            </g>

            {/* the tasks, each riding its own agent */}
            {TILES.map((t, i) => {
              const p = POS[t.seat];
              return (
                <g key={i} style={{ filter: icon }}>
                  <path
                    d={TILE_PATH}
                    transform={`translate(${p.x.toFixed(2)} ${(p.y - (SEATS[t.seat].y - t.y)).toFixed(2)}) translate(${-TILE_HALF} ${-TILE_HALF})`}
                    fill={ink}
                    opacity={OP_DARK + (OP_READ - OP_DARK) * tileTone[i]}
                  />
                </g>
              );
            })}
          </svg>

          {/* the OpenAI mark, tinted white, present from f0 */}
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

export default LedToTheDesperation;
