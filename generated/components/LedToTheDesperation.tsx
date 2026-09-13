import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  BG_BASE,
  BG_DIM,
  CAM_LIFT,
  DOT_RADIUS,
  FRAME_H,
  FRAME_W,
  GridBackground,
  ICON_SHADOW_BLUR,
  ICON_SHADOW_OPACITY,
  ICON_SHADOW_Y,
  OP_DARK,
  OP_READ,
  OP_RECEDE,
  OP_UNREAD_DOT,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  SQUIRCLE_MIN,
  SQUIRCLE_RATIO,
  SQUIRCLE_SMOOTH,
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
// Cut 1 of this clip IS the world this piece happens in. Every constant and
// every piece of geometry is IMPORTED from it, never restated or re-derived.
import {
  BOX_H,
  BOX_PATH,
  BOX_W,
  BOX_X0,
  BOX_X1,
  BOX_Y0,
  CENTRE_X,
  COLS,
  CONTENT_FINAL,
  CONTENT_OPEN,
  GATE_DASH,
  GATE_GAP,
  GATE_X0,
  GATE_X1,
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
// with its wifi glyph, the dashed gate under the ring, and the five task tiles
// landed on five agents with their five reaches converged on the diagonal and
// dead against the inside face of the top wall. Nothing draws in. The box,
// STROKE, the seat grid, SEATS, TILES and their converged tips, LINE_SPEED,
// RING, WIFI, the gate's x range, K_OPEN / K_FINAL / CONTENT_OPEN /
// CONTENT_FINAL and TONE_DUR are all imported from cut 1; no geometry is
// re-derived here.
//
// THE STORY. The reward signal punishes the failed reaches — they are erased.
// The models try again and fail again. They are punished again: that loop is
// the problem. Then every agent in the box reaches at once, and the wall gives.
//
// Every gesture is one word. Nothing else happens.
//
// THE CAMERA FOLLOWS. Six moves, one per gesture, all through one damped track.
// Each lands four to ten frames before its word and then holds; between moves
// there is nothing on the camera but `sway`. The lens is on the thing that is
// about to happen, and it PANS as well as tilts — the crack is at x 700, the
// ring at x 540 — so cx is its own per-frame track through the same damper.
//   M0 out to the resolved wide,
//      k 1.50 / c 140 -> k 0.95 / c -102, cx 540,
//      keys f0-16 warp 0.72, landed f26   — "punishing them for"     f0-26
//   M1 IN on the lid, k 0.95 -> 1.25,
//      c -102 -> -180.5 (solved: the lid's inside face
//      at screen y 700, the box 1125 px wide, bleeding
//      off both sides), cx 540. It rises WITH the five
//      reaches, keys f40-52 warp 0.72, landed f63, so
//      "tasks" lands on a still frame
//                              — "failing to solve impossible tasks" f40-65
//   M2 back OUT to k 0.95 / c -102, cx 540, keys
//      f74-82 warp 0.72, landed f95, so the second
//      punishment is seen whole and the loop reads as
//      the same gesture twice   — "big part of the whole problem"    f74-97
//   M3 THE CREEP. k 0.95 -> 1.90, c -102 -> -215.4,
//      cx 540 -> 657.9, solved so the bow's apex sits
//      at screen (620, 640) — one continuous even ease
//      (warp 1.0) over fifty-two frames of keys,
//      f114-166, landed f174. The forest rises and the
//      lid bows while the lens closes on the exact
//      point that is about to give. Then DEAD STILL
//      f174-181 (0.03%/frame, sway only): the held
//      breath, and the crack opens inside it
//                   — "led to the desperation that, like, ultimately" f114-174
//   M4 FOLLOW THE HEAD. k 1.90 -> 1.40, c -215.4 ->
//      -203.6 (solved: the ring at screen y 560, the
//      upper third, with the crack still in frame at
//      (722, 667)), cx 657.9 -> 560. Keys f181-184
//      warp 0.7. The head leaves the crack at f181 and
//      lands on the ring at f195; the camera arrives
//      with it        — "culminated in this attack"                  f181-195
//   M5 back to the resolved wide, k 0.95 / c -102 /
//      cx 540, keys f206-240 warp 0.72, landed f250,
//      held to f256                       — tail                     f206-256
//
// THE GESTURES, under it.
//   THE PUNISHMENT. From the top-wall end of each
//     reach one white ink bead runs DOWN the reach and
//     the reach ERASES behind it, from the wall end
//     down to the tile — the bead is the head of an
//     erase, not a packet. Starts f8, 10, 12, 14, 16;
//     one speed for all five, solved so the last tile
//     is DARK on the beat (35.5 world px/frame, 34
//     screen px at k 0.95). On arrival the tile falls
//     OP_READ ->
//     OP_DARK over 3 frames and its agent ripe -> deep
//     over TONE_DUR. No flash, no click, no ripple.
//     Resolved f26: five dark tiles on five deep
//     agents, no reaches                 — "them for"               f8-26
//   TRY AGAIN, FAIL AGAIN. The tiles come back to
//     OP_READ over 3 frames and the agents deep ->
//     ripe (f40, 43, 46, 49, 52), and two frames after
//     its own tile lights each reach draws again from
//     the tile's top edge along its converged
//     diagonal, head-led at LINE_SPEED, and stops dead
//     on the wall's inside face. Last one home at f63.
//     Nothing happens on contact, exactly as in cut 1
//                              — "failing to solve impossible tasks" f40-65
//   THE LOOP IS THE PROBLEM. The punishment repeats,
//     the same mechanism on the same five reaches at
//     the same speed: f79, 81, 83, 85, 87, all dark by
//     f97. Five dark tiles, no reaches, again
//                                 — "big part of the whole problem"  f79-97
//   DESPERATION, AND IT KEEPS PRESSING. The big
//     motion, and it is made of what is already there.
//     Every agent in the box goes deep -> ripe in a
//     wave from the bottom row up (f116-133), and each
//     seat that carries a reach sends one straight up
//     at FOREST_SPEED to the top wall — a forest of
//     accent lines, released in the wave's own
//     bottom-up order across f118-162, each on its own
//     frame so nothing moves in unison.
//     THREE THINGS MAKE THAT WINDOW TENSE, and none of
//     them is a new object:
//       (1) the releases ACCELERATE — the count let go
//           by time u is u^2, so the first ten take 19
//           frames and the last ten take 6: the crowd
//           piles on faster and faster under a lens
//           that is closing in at the same time;
//       (2) a line runs at 22 world px/frame, not cut
//           1's LINE_SPEED 28, because at k 1.90 that
//           would be 53 screen px/frame — the close-up
//           speed cap. At 22 the fastest head on
//           screen over f116-176 is 41.8 px/frame;
//       (3) THE CROWD PRESSES UP — from f140 to f176
//           every dot drifts up, eased out, by up to
//           12 world px scaled by its row (top rows
//           most, bottom row none) and capped so no
//           dot comes within 10 px of the lid's inside
//           face; a reach's base and a task tile ride
//           up with their agent. It holds through the
//           crack and relaxes over 12 frames from the
//           recede.
//     Idle traffic stops launching at f116. The five
//     dark tiles light with the wave like everyone
//     else. Under that the TOP WALL BOWS: its whole
//     span deforms into a shallow arc, apex 28 world
//     px up at x 700 — right of the gate, not at it —
//     eased out f133-170, fast early and slow late, so
//     the press never stops through "that, like,
//     ultimately" and the wall is still visibly under
//     load when it goes. Every line's tip stays ON the
//     wall, so the forest is what lifts it (last line
//     home f176.5, the frame the wall cracks)
//                    — "led to the desperation that, like, ultimately" f116-170
//   THE ATTACK. At the apex the wall CRACKS at x 700:
//     the wall splits into two round-capped ends that
//     slide apart from a hairline to a 56 px gap,
//     eased out f176-184. From f181 ONE route draws
//     out of the gap, head-led at one speed and
//     persisting behind the head at 0.95 accent — up
//     out of the crack, then left on an easy curve to
//     the internet ring's rim, arriving f195, where
//     the ring and its wifi glyph turn from ink to
//     accent over 4 frames. As the route leaves, the
//     forest recedes: the lines to OP_RECEDE and every
//     agent ripe -> deep, EXCEPT the one agent whose
//     line sits directly under the crack, which stays
//     ripe. The gate is untouched: they did not go
//     through it. No debris, no flash
//                         — "ultimately culminated in this attack"   f169-195
//   held resolved, never fades out       — tail                      f195-256
//
// ambient: idle thread traffic across the crowd from f0 at the shared rate (180
// per 1,200 agents) until it stops launching at f116, `breath` on every dot,
// `sway` on the camera, the grid's own drift. Not gestures; that is what this
// field is.
//
// Three things are solved rather than hand-set, and each is noted where it is
// computed: the punishment ORDER is longest-reach-first, which is what makes
// "one speed for all five" and "home by f26" both true (cut 1 solves its deal
// the same way, and the order is scattered in x, never left to right);
// ERASE_SPEED comes out of that solve; and the forest's launch frames come off
// the tone wave's own arrival at each seat's row, so the lines cannot drift
// away from the light that releases them.
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
    desperation: z.number(), // "desperation" — the forest is up
    thatTwo: z.number(), // "that"
    likeTwo: z.number(), // "like"
    ultimately: z.number(), // "ultimately"
    culminated: z.number(), // "culminated" — the wall cracks
    inWord: z.number(), // "in"
    this: z.number(), // "this"
    attack: z.number(), // "attack"         — the route reaches the ring
    end: z.number(), // speech ends; tail to 256
  }),
});

export type Props = z.infer<typeof schema>;

// ---------------------------------------------------------------------------
// The punishment. The five reaches are erased from their wall ends down, one
// bead per reach, and the order is LONGEST FIRST — the same solve cut 1 uses
// for its deal, for the same reason. The five start slots are three frames
// apart and every bead runs at one speed, so the last one dealt has only six
// frames to get home by the beat the gesture is cut to; ordering by descending
// reach length is what makes one speed possible at all. It is a scattered order
// in x (the reaches sit at x 389, 834, 549, 249, 689), never left to right.
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
// shape (five starts three frames apart, six frames for the last), so one
// number serves both and the loop is literally the same gesture twice.
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
// then crack it, so the run is masked out of the squircle and drawn here as its
// own polyline instead. At bow 0 and gap 0 it is the same straight line at the
// same y with the same stroke, so f0 is cut 1's wall.
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

// THE BOW. A shallow raised-cosine arc over the whole top run, apex 28 world px
// up at x 700 — right of the gate (480-600), not at it, so what gives is the
// wall itself and not the hole somebody forgot to close. Zero slope at both
// ends and at the apex, so it meets the corners without a corner of its own.
//
// It runs f133-170, not f133-150. "That, like, ultimately" is 26 frames with no
// gesture of its own, and a bow that has already finished leaves the wall
// sitting still through all of it — dead air, and then a crack in a wall that
// is visibly not under load any more. The ease is unchanged (`Easing.out`), so
// the amplitude is still fast early and slow late: 84% of the rise is on screen
// by the old f150 and the last 16% creeps in over the next twenty frames, which
// is what a wall under a load that will not let up looks like. The crack at
// f176 then opens six frames after the wall stops giving.
export const BOW_AMP = 28;
export const BOW_X = 700;
export const BOW_F0 = 133;
export const BOW_F1 = 170;
const BOW_WL = BOW_X - WALL_X0;
const BOW_WR = WALL_X1 - BOW_X;
export const bowProfile = (x: number) => {
  const d = x <= BOW_X ? (BOW_X - x) / BOW_WL : (x - BOW_X) / BOW_WR;
  if (d >= 1 || d < 0) return 0;
  return 0.5 * (1 + Math.cos(Math.PI * d));
};

// THE CRACK. Cut 4's mechanism — two round-capped ends sliding apart from a
// hairline, eased out — applied to the wall instead of to a ring. At gap 0 the
// two caps meet and the wall is continuous.
//
// 56 world px, not 40. The gap is the whole point of the gesture and it has to
// survive being read at half-res on a phone, but two things eat into it: the
// STROKE 3 round caps take 3 px off the open field, and the two accent lines
// that live in it — the escapee's reach coming up at x 694.9 and the route
// leaving at x 700 — take another 9 px out of the middle as one bundle. At 40
// that left 12 and 15 world px of open field either side of the bundle (6 and 7
// px in a half-res preview), which is a hairline, and the wall read as a
// continuous line with the route sprouting out of it. At 56 the caps are 53 px
// apart and the open field is 20 px left of the bundle and 25 px right of it —
// a break you can see at 1:1 rather than one you have to be told about.
export const CRACK_X = BOW_X;
export const CRACK_GAP = 56;
export const CRACK_F0 = 176;
export const CRACK_F1 = 184;

// ---------------------------------------------------------------------------
// THE CAMERA. Six moves, and every one of them follows a gesture: the lens goes
// where the thing that is about to happen is, arrives four to ten frames ahead
// of the word, and then holds. Between moves nothing is on the camera but
// `sway`. One track: the six moves are consecutive `camMove` segments (a key
// per frame), the gaps between them are a single held key, and the whole thing
// goes through the shared damper, so a move can never start from a standstill
// it has not actually reached.
//
// Cut 1 only ever tilted, so it passed CENTRE_X straight through. This piece
// PANS — the crack is at x 700 and the ring is at x 540 — so cx is a per-frame
// track of its own, run through the same damper (`runCamera` damps whatever
// track it is handed against the same k) and handed to `GridBackground`, so the
// grid parallaxes sideways with it and the lateral move reads as depth.
//
// Three framings are SOLVED from what has to be in the frame rather than typed:
//   M1  the lid's inside face at screen y 700 at k 1.25 (the box is 1125 screen
//       px wide there, so it bleeds ~10px off each side: the wall fills the top
//       of the frame and the five reaches land against it in close-up)
//   M3  the bow's apex at screen (620, 640) at k 1.90
//   M4  the internet ring at screen y 560 — the upper third — at k 1.40, which
//       leaves the crack at screen (722, 667), both of them in frame
// `CAM_LIFT / k` is what puts a content centre at screen y 835 under the
// captions, and `camMove` already takes cy off the eased k, so each of these is
// a content centre = cy - CAM_LIFT / k.
//
// KEY WINDOWS END BEFORE THE LANDING, deliberately, and each one is measured
// rather than guessed (`scratchpad/seg1/scan.ts`): the damper lags its target
// by ~6 frames, so keys that run all the way to the landing frame leave the
// camera still visibly moving under the word. Ending them early puts the same
// ramp on screen and parks it. Measured residual / drift at each landing:
//   M0 keys f0-16   landed f26   0.09% of the move left, 0.06%/frame
//   M1 keys f40-52  landed f63   0.03%, 0.03%/frame   ("tasks" f65 is still)
//   M2 keys f74-82  landed f95   0.00%, 0.03%/frame
//   M3 keys f114-166 landed f174 0.05%, 0.03%/frame   (then dead still to 181)
//   M4 keys f181-184 landed f195 0.64%, 0.27%/frame  (arrives with the head)
//   M5 keys f206-240 landed f250 0.01%, 0.01%/frame
// M4 is the one that is still finishing on its word: it is a 26% zoom given
// fourteen frames because the route head is given fourteen frames, and the last
// 0.6% of it decays inside the four frames the ring takes to light. It is the
// tail of a single deceleration lobe, not a second move.
// ---------------------------------------------------------------------------
export const K_M1 = 1.25; // "failing to solve impossible tasks" — in on the lid
export const K_M3 = 1.9; // "led to the desperation ... ultimately" — the creep
export const K_M4 = 1.4; // "culminated in this attack" — out with the route
export const LID_SCREEN_Y = 700; // M1: where the lid's inside face sits
export const APEX_SCREEN_X = 620; // M3: where the bow's apex sits
export const APEX_SCREEN_Y = 640;
export const RING_SCREEN_Y = 560; // M4: the ring, in the upper third

const centreFor = (worldY: number, screenY: number, k: number) =>
  worldY + (FRAME_H / 2 - screenY) / k - CAM_LIFT / k;

export const C_M1 = centreFor(BOX_Y0 + STROKE / 2, LID_SCREEN_Y, K_M1);
export const C_M3 = centreFor(BOX_Y0 - BOW_AMP, APEX_SCREEN_Y, K_M3);
export const C_M4 = centreFor(RING.y, RING_SCREEN_Y, K_M4);
export const X_M3 = BOW_X - (APEX_SCREEN_X - FRAME_W / 2) / K_M3;
export const X_M4 = 560;
export const CY_FINAL = CONTENT_FINAL + CAM_LIFT / K_FINAL;

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
  // M0 "punishing them for" — cut 1's opening framing to cut 1's resolved one
  { f0: 0, f1: 16, k0: K_OPEN, k1: K_FINAL, c0: CONTENT_OPEN, c1: CONTENT_FINAL, x0: CENTRE_X, x1: CENTRE_X, warp: 0.72 },
  // M1 "failing to solve impossible tasks" — push in, rising WITH the reaches
  { f0: 40, f1: 52, k0: K_FINAL, k1: K_M1, c0: CONTENT_FINAL, c1: C_M1, x0: CENTRE_X, x1: CENTRE_X, warp: 0.72 },
  // M2 "big part of the whole problem" — back out, so the loop is seen whole
  { f0: 74, f1: 82, k0: K_M1, k1: K_FINAL, c0: C_M1, c1: CONTENT_FINAL, x0: CENTRE_X, x1: CENTRE_X, warp: 0.72 },
  // M3 "led to the desperation ... ultimately" — THE CREEP, one even ease
  { f0: 114, f1: 166, k0: K_FINAL, k1: K_M3, c0: CONTENT_FINAL, c1: C_M3, x0: CENTRE_X, x1: X_M3, warp: 1.0 },
  // M4 "culminated in this attack" — out and up, arriving with the route head
  { f0: 181, f1: 184, k0: K_M3, k1: K_M4, c0: C_M3, c1: C_M4, x0: X_M3, x1: X_M4, warp: 0.7 },
  // M5 the tail — back to the resolved wide
  { f0: 206, f1: 240, k0: K_M4, k1: K_FINAL, c0: C_M4, c1: CONTENT_FINAL, x0: X_M4, x1: CENTRE_X, warp: 0.72 },
];

// One track out of the six moves. `camMove` emits a key per frame inside a
// move; a gap between two moves gets ONE key, at the frame before the next move
// starts, holding the last value — which is what makes the hold a hold and not
// a slow ramp into the next key.
const CAM_TRACK = (() => {
  const F: number[] = [];
  const K: number[] = [];
  const CY: number[] = [];
  const CX: number[] = [];
  const hold = (f: number) => {
    F.push(f);
    K.push(K[K.length - 1]);
    CY.push(CY[CY.length - 1]);
    CX.push(CX[CX.length - 1]);
  };
  CAM_SEGS.forEach((s, n) => {
    if (n > 0 && s.f0 > CAM_SEGS[n - 1].f1 + 1) hold(s.f0 - 1);
    const m = camMove(s);
    m.F.forEach((f, i) => {
      F.push(f);
      K.push(m.K[i]);
      CY.push(m.CY[i]);
    });
    // cx rides the same eased curve as k, at the same warp
    for (let i = 0; i <= s.f1 - s.f0; i++) {
      CX.push(s.x0 + (s.x1 - s.x0) * camEase(i / (s.f1 - s.f0), s.warp));
    }
  });
  if (F[F.length - 1] < DURATION) hold(DURATION);
  return { F, K, CY, CX };
})();
export const CAM_F = CAM_TRACK.F;
export const CAM_K = CAM_TRACK.K;
export const CAM_CY = CAM_TRACK.CY;
export const CAM_CX = CAM_TRACK.CX;

// ---------------------------------------------------------------------------
// DESPERATION. The tone wave runs bottom row to top over f116-133; a seat's
// own light arrives on its row's frame plus a hashed couple, and the wave is
// what RELEASES its reach, so the forest cannot pick an order of its own.
//
// It does not launch on that arrival any more, though. The greedy scan below
// takes its seats from the lower two thirds of the box, so the raw arrivals sit
// inside a 12-frame window (f117.9-129.5) and every line would be on the wall
// by f145 — the whole forest spent long before the wall gives. So the raw
// arrivals are re-mapped onto FOREST_L0..FOREST_L1 (f118-162): the same forty
// seats in the same bottom-up order with the same hashed jitter between them.
//
// The mapping is not affine any more, it ACCELERATES. The tension is that more
// and more of the crowd joins in, faster and faster, under a lens that is
// closing in at the same time — so the number of lines released by time u is
// u^2 rather than u, which makes the frame of a release the SQUARE ROOT of its
// place in the order. On the forty: the first ten take 19 frames, the middle
// twenty 20, and the last ten 5.7. Nothing else about the selection or the
// order changes; only when each one is let go.
//
// The window ends at f162 and not at f166. At FOREST_SPEED a line launched in
// the last of those six frames still needs ten to fifteen frames to reach the
// wall, so a window ending at f166 has sixteen lines still climbing at f176 —
// through the held breath the camera is holding at f174-181 and into the crack
// itself, which is both the stillest and the loudest thing in the piece at
// once. At f162 the last line is home at f176.5, exactly as the wall gives,
// twenty-six of them are still climbing at f170, and the acceleration is
// unchanged: the count released by time u is still u^2.
//
// Not every seat carries a line. Eight hundred and sixty-nine reaches is a
// solid block of ink, not a forest, so the lines are thinned by COLUMN — a
// column carries or it does not — and within a carrying column at most three
// seats reach, never within FOREST_GAP rows of each other. That leaves ~55% of
// the columns striped, each stripe a few lines of different lengths starting
// at different depths, which is what reads as a forest. The TONE wave is not
// thinned: every agent in the box lights.
// ---------------------------------------------------------------------------
export const WAVE_F0 = 116;
export const WAVE_F1 = 133;
export const FOREST_COLS = 0.55; // the share of columns that carry lines
export const FOREST_PICK = 0.4;
export const FOREST_GAP = 7; // rows between two reaches in one column
export const FOREST_MAX = 2; // reaches per column
// the window the forty releases are spread across, in frames
export const FOREST_L0 = 118;
export const FOREST_L1 = 162;
// A forest line's own speed, world px/frame. NOT cut 1's LINE_SPEED (28): these
// lines are drawn under a camera that reaches k 1.90, and 28 world px/frame is
// 53 screen px/frame there — strobing, and against the close-up speed cap. At
// 22 the fastest head on screen over the whole growth window is 41.8 px/frame,
// under the 45 the rest of the set is built to. The five task reaches still run
// at LINE_SPEED: they are drawn at k 1.25 and under, where 28 is 35 screen px.
export const FOREST_SPEED = 22;

export const waveAt = (gr: number, i: number) =>
  WAVE_F0 + (WAVE_F1 - WAVE_F0) * ((ROWS - 1 - gr) / (ROWS - 1)) + hash(i, 57) * 2.5;

export type Reach = { i: number; x: number; y: number; launch: number };
export const FOREST: Reach[] = (() => {
  const out: Reach[] = [];
  for (let gc = 0; gc < COLS; gc++) {
    if (hash(gc, 55) >= FOREST_COLS) continue;
    const taken: number[] = [];
    for (let gr = ROWS - 1; gr >= 0; gr--) {
      const i = SEAT_AT[gr * COLS + gc];
      if (i < 0) continue;
      if (taken.length >= FOREST_MAX) break;
      if (hash(i, 56) >= FOREST_PICK) continue;
      if (taken.some((g) => Math.abs(g - gr) < FOREST_GAP)) continue;
      taken.push(gr);
      const s = SEATS[i];
      out.push({ i, x: s.x, y: s.y, launch: waveAt(gr, i) + 0.5 + hash(i, 58) * 2 });
    }
  }
  // The wave's own release order, spread over the window the press has to fill
  // and ACCELERATED: a release at fraction w through the wave's own order comes
  // out at sqrt(w) through the window, so the count released by time u is u^2.
  // Monotone in w, so the order and the relative spacing the wave handed over
  // both survive — they are stretched at the start of the window and squeezed
  // at the end, which is the gesture.
  const lo = Math.min(...out.map((r) => r.launch));
  const hi = Math.max(...out.map((r) => r.launch));
  const span = Math.max(1e-6, hi - lo);
  out.forEach((r) => {
    r.launch = FOREST_L0 + Math.sqrt((r.launch - lo) / span) * (FOREST_L1 - FOREST_L0);
  });
  return out;
})();

// The one that got out: the reach sitting directly under the crack.
export const ESCAPEE = FOREST.reduce(
  (best, r) => (Math.abs(r.x - CRACK_X) < Math.abs(FOREST[best].x - CRACK_X) ? FOREST.indexOf(r) : best),
  0,
);
export const ESCAPE_SEAT = FOREST[ESCAPEE].i;

export const IDLE_STOP = WAVE_F0; // idle traffic stops launching here
export const RECEDE_F0 = 181;
export const RECEDE_DUR = 14;
export const LINE_OP = 0.95; // an accent line's own opacity, as everywhere

// ---------------------------------------------------------------------------
// THE CROWD PRESSES UP. The third thing the tension is made of, and like the
// other two it is not a new object: it is the crowd that is already there,
// leaning on the lid. From f140 to f176 every dot drifts UP, eased out, by an
// amount scaled by its row — the top row the most, the bottom row not at all —
// so the whole population compresses against the wall it is bowing. Its agent's
// line goes up with it (the base of a reach is its agent), and so does a task
// tile, because a tile sits ON an agent. It holds through the crack and eases
// back over LIFT_BACK frames from the recede.
//
// A dot may never enter the lid, so the 12 px is a ceiling and not a promise:
// each seat's lift is capped so that the TOP OF THE DOT — its radius at full
// breath (x1.05) and fully lit (x1.35) — stays LIFT_CLEAR under the wall's
// inside face at bow 0, which is the tightest the gap ever is (the bow only
// ever opens it). The top row's three seats sit 21.7 px under that face, so
// their cap binds hard — 0 to 5.5 px of lift, and the one that already starts
// 8.4 px under the face (cut 1's own feathered edge) does not move at all —
// while the second row and below take the full row-scaled 11.6 and down: the
// crowd does not just translate up, it PACKS against the lid, which is what
// pressing looks like. Four seats of 869 are capped, and the closest any dot
// comes to the wall is the 8.4 px it already was at f0.
// ---------------------------------------------------------------------------
export const LIFT_MAX = 12; // world px, at the top row
export const LIFT_CLEAR = 10; // world px a dot must leave under the inside face
export const LIFT_F0 = 140;
export const LIFT_F1 = 176;
export const LIFT_BACK = 12; // frames to relax, from RECEDE_F0
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
// THE ROUTE. Cut 4's exploit route, pointed at the wall's crack instead of at
// the hub's: head-led at one speed, persisting behind the head at 0.95 accent,
// because it is a route and not a packet. Out of the gap at (700, -318) — the
// bowed wall's apex — straight up clear of the box, then left on one easy curve
// into the internet ring's upper-right rim at 45 degrees. Sampled to a polyline
// so the head moves at a constant arc length per frame.
// ---------------------------------------------------------------------------
export const ROUTE_F0 = 181;
export const ROUTE_F1 = 195;
const ROUTE_START = { x: CRACK_X, y: BOX_Y0 - BOW_AMP };
const RIM = {
  x: RING.x + RING.r * Math.SQRT1_2,
  y: RING.y - RING.r * Math.SQRT1_2,
};
export const ROUTE_PTS: { x: number; y: number }[] = (() => {
  const pts = [ROUTE_START, { x: CRACK_X, y: RING.y - 12 }];
  // One cubic from the top of the climb into the rim. Its first handle
  // continues the climb and its second lies along the 45 degree approach, so
  // neither join has a corner and the whole turn is one easy arc rather than a
  // hook. It tops out around y -455, fifty px clear of the mark's bottom.
  const p0 = pts[1];
  const c1 = { x: CRACK_X, y: RING.y - 58 };
  const c2 = { x: RIM.x + 46, y: RIM.y - 46 };
  const N = 64;
  for (let s = 1; s <= N; s++) {
    const t = s / N;
    const u = 1 - t;
    pts.push({
      x: u * u * u * p0.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * RIM.x,
      y: u * u * u * p0.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * RIM.y,
    });
  }
  return pts;
})();
export const ROUTE_CUM: number[] = (() => {
  const cum = [0];
  for (let i = 1; i < ROUTE_PTS.length; i++) {
    cum.push(cum[i - 1] + Math.hypot(ROUTE_PTS[i].x - ROUTE_PTS[i - 1].x, ROUTE_PTS[i].y - ROUTE_PTS[i - 1].y));
  }
  return cum;
})();
export const ROUTE_LEN = ROUTE_CUM[ROUTE_CUM.length - 1];
export const ROUTE_V = ROUTE_LEN / (ROUTE_F1 - ROUTE_F0);
export const RING_LIT_DUR = 4; // ink -> accent on arrival

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
  // the ring's own ramp, ink -> accent, on the route's arrival
  const inkToAccent = makeTone(ink, accent);

  // -- the schedule, off the words ------------------------------------------
  // Every gesture's start is a beat from the SRT, not a number typed twice:
  // the five slots of each punishment are three frames apart from the word
  // that starts it, and the wave, the bow, the crack and the route all hang
  // off their own word. At the default beats these are exactly the frames the
  // header comment lists.
  const SLOTS = [0, 1, 2, 3, 4];
  const p1 = SLOTS.map((s) => beats.them + 1 + PUNISH_STEP * s); // 8, 10, 12, 14, 16
  const rt = SLOTS.map((s) => beats.failing + 3 * s); // 40, 43, 46, 49, 52
  const p2 = SLOTS.map((s) => beats.big + PUNISH_STEP * s); // 79, 81, 83, 85, 87
  const waveShift = beats.led - WAVE_F0; // 0 at the default beats
  const bowF0 = beats.desperation; // 133
  const bowF1 = bowF0 + (BOW_F1 - BOW_F0); // 150
  const crackF0 = beats.culminated; // 176
  const crackF1 = crackF0 + (CRACK_F1 - CRACK_F0); // 184
  const routeF0 = crackF0 + (ROUTE_F0 - CRACK_F0); // 181
  const routeF1 = beats.attack; // 195

  // -- the wall's shape this frame ------------------------------------------
  const bowT = interpolate(frame, [bowF0, bowF1], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const wallY = (x: number) => BOX_Y0 - BOW_AMP * bowProfile(x) * bowT;
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

  // -- the crowd presses up --------------------------------------------------
  // One scalar for the whole crowd; the per-seat amount (row-scaled, capped
  // under the lid) is solved once in LIFT_AT. A dot, its reach and its tile all
  // read the same number, so an agent and what it is carrying move together.
  const liftT =
    interpolate(frame, [LIFT_F0, LIFT_F1], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) }) *
    interpolate(frame, [RECEDE_F0, RECEDE_F0 + LIFT_BACK], [1, 0], {
      ...clamp,
      easing: Easing.out(Easing.cubic),
    });
  const liftOf = (i: number) => LIFT_AT[i] * liftT;

  // -- the crowd's tone ------------------------------------------------------
  // Three things write to a seat's tone and they are stacked in the order they
  // happen: the five task agents' punish -> retry -> punish loop, the
  // desperation wave over everybody, and the recede after the escape.
  const recede = smooth((frame - routeF0) / (routeF1 - routeF0));
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
    if (i !== ESCAPE_SEAT) v *= 1 - recede;
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
  // BEGIN at or after f116 never launches. The ones already running finish.
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
    const sb = SEATS[b];
    const dn = interpolate(phase, [0, 0.3], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
    const fade = interpolate(phase, [0.55, 1], [1, 0], clamp);
    if (fade <= 0.02) continue;
    lit[a] = Math.max(lit[a], fade);
    lit[b] = Math.max(lit[b], dn * fade);
    const ya = sa.y - liftOf(a);
    const yb = sb.y - liftOf(b);
    threadEls.push({
      key: `i${j}`,
      x1: sa.x,
      y1: ya,
      x2: sa.x + (sb.x - sa.x) * dn,
      y2: ya + (yb - ya) * dn,
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

  // -- the forest ------------------------------------------------------------
  // Every line runs straight up at LINE_SPEED and ends ON the wall, so once it
  // has landed its tip rides the bow up: the forest is what lifts the wall.
  const forestOp = LINE_OP - (LINE_OP - OP_RECEDE) * recede;
  const forest = FOREST.map((r) => {
    if (frame < r.launch + waveShift) return null;
    const tipY = wallY(r.x) + STROKE;
    // the base of a reach is its agent, so it rides the press up with it
    const base = r.y - liftOf(r.i);
    const full = base - tipY;
    const drawn = Math.min(full, (frame - (r.launch + waveShift)) * FOREST_SPEED);
    if (drawn <= 0) return null;
    return {
      key: r.i,
      x: r.x,
      y1: base,
      y2: base - drawn,
      op: r.i === ESCAPE_SEAT ? LINE_OP : forestOp,
    };
  });

  // -- the route out of the crack -------------------------------------------
  const routeS = clamp01((frame - routeF0) / (routeF1 - routeF0)) * ROUTE_LEN;
  let routeD = "";
  let routeHead: { x: number; y: number } | null = null;
  if (frame >= routeF0) {
    routeD = `M${ROUTE_PTS[0].x.toFixed(2)} ${ROUTE_PTS[0].y.toFixed(2)}`;
    for (let i = 1; i < ROUTE_PTS.length; i++) {
      if (ROUTE_CUM[i] <= routeS) {
        routeD += `L${ROUTE_PTS[i].x.toFixed(2)} ${ROUTE_PTS[i].y.toFixed(2)}`;
        routeHead = ROUTE_PTS[i];
      } else {
        const t = (routeS - ROUTE_CUM[i - 1]) / (ROUTE_CUM[i] - ROUTE_CUM[i - 1]);
        const px = ROUTE_PTS[i - 1].x + (ROUTE_PTS[i].x - ROUTE_PTS[i - 1].x) * t;
        const py = ROUTE_PTS[i - 1].y + (ROUTE_PTS[i].y - ROUTE_PTS[i - 1].y) * t;
        routeD += `L${px.toFixed(2)} ${py.toFixed(2)}`;
        routeHead = { x: px, y: py };
        break;
      }
    }
  }
  const ringLit = smooth((frame - routeF1) / RING_LIT_DUR);
  const ringCol = inkToAccent(ringLit);

  // -- the internet ring (cut 1 left it closed and its glyph at full) --------
  const RING_C = 2 * Math.PI * RING.r;
  const wifiCx = RING.x;
  const wifiCy = RING.y + WIFI.dy;

  // -- camera ----------------------------------------------------------------
  // Two passes of the same damper over the same six moves: one for the tilt and
  // the zoom, one for the pan. `runCamera` damps whatever track it is handed
  // against the same k, so cx cannot lag differently from cy.
  const cam = runCamera(frame, CAM_F, CAM_CY, CAM_K);
  const pan = runCamera(frame, CAM_F, CAM_CX, CAM_K);
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = pan.cy + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);

  // -- the per-icon shadow ---------------------------------------------------
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
            <defs>
              {/* the squircle's straight top run is always drawn by hand below,
                  so it can bow and crack; at bow 0 / gap 0 the two are the same
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

            {/* the crowd */}
            {SEATS.map((s, i) => {
              const l = Math.max(lit[i] * (1 - recede), seatTone[i]);
              const r = dotRadius * s.r * s.rs * breath(frame, hash(i, 9)) * (1 + 0.35 * l);
              return (
                <circle
                  key={i}
                  cx={s.x}
                  cy={s.y - liftOf(i)}
                  r={r}
                  fill={tone(l)}
                  opacity={dotUnread}
                />
              );
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

            {/* the desperation: every reach in the box, straight up */}
            {forest.map((r) =>
              r ? (
                <line
                  key={`f${r.key}`}
                  x1={r.x}
                  y1={r.y1}
                  x2={r.x}
                  y2={r.y2}
                  stroke={accent}
                  strokeWidth={STROKE}
                  strokeLinecap="round"
                  opacity={r.op}
                />
              ) : null,
            )}

            {/* the sandbox: the squircle with its top run masked away, and that
                run drawn here so it can bow and crack */}
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
                {/* left of the gate */}
                <path d={wallPath(WALL_X0, GATE_X0)} strokeLinecap="round" />
                {/* the gate that was never built, still dashed */}
                <path d={wallPath(GATE_X0, GATE_X1)} strokeDasharray={`${GATE_DASH} ${GATE_GAP}`} />
                {/* right of the gate, split at the crack */}
                <path d={wallPath(GATE_X1, CRACK_X - gap / 2)} strokeLinecap="round" />
                <path d={wallPath(CRACK_X + gap / 2, WALL_X1)} strokeLinecap="round" />
              </g>
            </g>

            {/* the internet: cut 1's ring and glyph, ink until the route lands */}
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

            {/* the tasks */}
            {TILES.map((t, i) => (
              <g key={i} style={{ filter: icon }}>
                <path
                  d={TILE_PATH}
                  transform={`translate(${t.x} ${t.y - liftOf(t.seat)}) translate(${-TILE_HALF} ${-TILE_HALF})`}
                  fill={ink}
                  opacity={OP_DARK + (OP_READ - OP_DARK) * tileTone[i]}
                />
              </g>
            ))}

            {/* the route out of the crack */}
            {routeD ? (
              <g style={{ filter: icon }}>
                <path
                  d={routeD}
                  fill="none"
                  stroke={accent}
                  strokeWidth={STROKE}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={LINE_OP}
                />
                {routeHead && routeS < ROUTE_LEN ? (
                  <circle cx={routeHead.x} cy={routeHead.y} r={4} fill={ink} />
                ) : null}
              </g>
            ) : null}
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
