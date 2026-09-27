import React from "react";
import { Easing, useCurrentFrame } from "remotion";
import { z } from "zod";
import { CAM_LIFT, FRAME_H, camEase, clamp01, hash, smoothstep, sway } from "./fieldShared";
import {
  BAR_GAP,
  BAR_H,
  BLACK,
  BLUE,
  ORANGE,
  PURPLE,
  SHADOW,
  WHITE,
  World,
  runCamera2,
  worldToScreen,
} from "./cottageShared";

export const FPS = 24;
// Clip "anna - elon", the line at 35.30 s on the edit timeline:
//   "I'm also not, you know, in the business of encouraging fascism to take
//    over social media."
// f0 = 35.30 s; a word at t seconds lands on frame round((t - 35.30) * 24).
// Speech ends at f115 ("media" 106-115); the next line ("So maybe he should be
// more careful") starts at f119, and the resolved frame holds under it to the
// end: 116 frames of speech + a 28-frame tail = 144.
export const DURATION = 144;

// ---------------------------------------------------------------------------
// "NOT IN THE BUSINESS" V3 — "THE FEED". Core memory podcast graphic standard
// (reference `PeakForSolar.tsx`), in the world of this speaker's clips
// (`cottageShared.tsx`, imported read-only: colours, SHADOW, BAR_H, BAR_GAP,
// the paper via World, runCamera2, worldToScreen). V2's helpers are copied in:
// the person glyph, the core memory stack, the X path.
//
// V1 (typographic placard) was rejected as word-literal; V2 (a free dot crowd
// regimented round an X) kept the style but "doesn't really convey the
// message". V3 keeps V2's no-text vocabulary and shows what she is actually
// talking about: an X feed flooded with one boosted post, except hers.
//
// RESEARCH. Under Musk, X cut moderation and reinstated banned accounts, and
// hate speech ran ~50 % higher for months (PLOS One 2025). Its "For You" feed
// algorithm boosts right-leaning content into people's feeds (Nature 2026,
// randomised experiment).
//
// NO TEXT, NO ARROWS, NO LABELS. The one mark is the X logo, as a glyph.
//
// THE BEATS (whisper word onsets, frames by the rule above):
//   not 1-15 · you know 18-28 · in 31 · the 33 · business 36 · of 40 ·
//   encouraging 46-56 · fascism 56-73 · to 73 · take 79 · over 84-90 ·
//   social 90 · media 106-115 · (next line 119)
//
// HOUSE STYLE. 1080x1920, 24 fps, OPAQUE. PaperGround (dimmed 0.88, blurred
// 3 px, parallax 0.15, drift -0.3 px/f) via cottageShared's World. White ink;
// every white element sits on a #000000 copy at +4/+4 world px, zero blur,
// drawn as an SVG copy. Chain #FFB765 / #BC37FF / #0046FF raw, on HER AVATAR
// ONLY (her verdict, "not"): never on the X, the bars or the copies. No glow,
// no springs or overshoot, no flashes, no fades.
//
// THE OBJECTS, world px, centred on x 540 (the rest camera is k ~0.71).
//   THE X — simple-icons "x", 130 x 117.5, bbox centred on x 540, top y 64.2,
//     on the hard shadow. The platform the feed belongs to; it never moves or
//     changes. 112 px under it the feed begins.
//   THE FEED — ten posts in one column x 130..950 (820), pitch 136 (post 84 +
//     gap 52), post tops 293.7 + 136 i, last post's shadow at 1605.8. Column
//     X top .. last shadow = 1541.6, centred on world y 835.
//   A POST — an AVATAR: public/person.png rebuilt as one path (V2's
//     measurements), head r 20 -> 84.0 x 84.0, on the hard shadow, its axis at
//     x 172; and 36 px right of it (x 250) two lines of white word-bars (BAR_H
//     28, pill ends, BAR_GAP 20 between words, 20 between the lines), the pair
//     centred on the avatar (lines at +4 and +52). Ordinary lines are hashed:
//     line 1 44-66 % of 700, line 2 20-50 %, split into 48-172 px words, so
//     every post differs.
//   HER POST — the 4th. An ordinary white post, its face set by hand on the
//     short side (words 56/104/40 and 84/60) so the whole post fits the close
//     open. Her avatar carries the core memory stack and keeps the 12/24/36
//     crown for the rest of the cut; her bars never change.
//   THE COPY — one fixed face in every slot it takes: the avatar filled BLACK
//     (no shadow), line 1 the full 700 (136/92/180/68/144), line 2 560 = 80 %
//     (150/72/196/82). Bars WHITE on the hard shadow. Same size as any post.
//
// THE GESTURES — one continuous evolving picture; each gesture has its words.
//   1. f0-28   "not". HER AVATAR RISES AS THE CORE MEMORY STACK, exactly as V2:
//              orange silhouette f0, purple f2, blue f4, white core + its
//              shadow f6, each rising 40 world px to its own rest on
//              Easing.bezier(0.16, 1, 0.3, 1) over 22 f (core lands f28), the
//              copies resting 36/24/12 above the core as the crown. The feed
//              around her exists, still, from f0.
//   2. f6-52   "you know, in the business of". Hold on the feed, carried by
//              the pull-back (THE CAMERA): the X enters from the top ~f28.
//   3. f46-58  "encouraging". THE TOP POST FLIPS into the copy: scaleX about
//              the column axis (x 540) = max(0.04, |cos(pi * s)|), s a
//              smoothstep of 12 f, so one ease-in-out card turn; the face
//              swaps at the midpoint (f52); the shadow turns with it and stays
//              +4/+4 of the ink.
//   4. f56-68  "fascism". The second post flips.
//   5. f80-113 "take over social media". THE CASCADE: posts 3, 5, 6, 7, 8, 9,
//              10 flip down the column in one accelerating wave, skipping hers.
//              Start = the inverse of an ease-in position clock (0.35 u +
//              0.65 u^2 over f79-100, her slot counted, so the wave pauses as
//              it passes her) + hashed jitter of +-1.5 f (seed 382):
//                80.3 · (her) · 89.2 · 92.7 · 95.3 · 97.4 · 99.2 · 100.8
//              intervals 9.0 / 3.5 / 2.6 / 2.2 / 1.8 / 1.7 f: never unison,
//              never a metronome. Posts 7-10 are revealed by the pull-back as
//              the wave reaches them; each is whole above the clip when its
//              flip starts (post 10: screen 1335..1399 at f101).
//   6. f113-143 HOLD on the resolved frame: the X, nine identical black-avatar
//              copies, her one white post with its crown. Only the camera's
//              creep and the paper's drift move.
//
// THE CAMERA — cottageShared's runCamera2 (the house CAM_STIFF / CAM_DAMP
// tracker with an x channel) on a per-frame target track of four moves. Each
// move eases log k and the SCREEN position of one anchor on one camEase curve
// and solves (cx, cy) from them: the anchor glides in a straight line on
// screen, nothing swings through a detour, the zoom reads at an even rate. The
// hand's sway on top.
//   OPEN   f0-6    k 2.5733, cx 312 (her ink, 130..494, centred: screen
//                  72..1008), her crowned post on screen y 829. The frame's
//                  top edge sits in the gap above post 2 and the clip in the
//                  gap under post 5: posts 2-5 whole, nothing cut, the X
//                  ~880 px above the frame.
//   MOVE 1 f6-42   anchor her avatar; back, up and across to MID: k 1.06,
//                  cx 540, the X and the top SIX posts (X top screen ~311,
//                  post 6 shadow ~1375, centre ~843); the clip in the gap
//                  under post 6, so post 7 is hidden just below it.
//   CREEP  f44-70  k +0.012 on the frame's centre: the held breath under
//                  "encouraging fascism".
//   MOVE 2 f70-98  warp 0.75, anchor the X (screen y 311 -> 286, monotone):
//                  back and down to REST, k 0.7148, the whole column on 835
//                  (X top 286 .. last shadow 1387, x 249..838) - the feed grows
//                  out below the X as the wave runs down it.
//   CREEP  f98-160 k -0.01 on the column's centre, still creeping at f143.
//   THE DAMPED NUMBERS (no sway):
//     f     k        cx       cy        %k/f
//     0     2.5733   312.00    778.76    0.00   open
//     28    1.6732   399.29    747.85   -3.49   the pull-back, mid-flight
//     46    1.0736   535.19    676.55   -0.59   "encouraging": landing (still f52)
//     79    0.9914   540.00    727.77   -1.63   "take": the second pull-back
//     112   0.7140   540.00   1010.16   -0.02   landed
//     143   0.7075   540.00   1011.67   -0.03   last frame
//   MEASURED, every frame, sway included: avatars move at most 32.8 screen
//   px/f (f25; 31.5 at k >= 2); bar ends crossing the frame edge up to 48.1
//   (f26, k 1.8). Pixel scan of all 144 frames: no ink below screen y 1399.
//
// THE CAPTION BAND. The feed is CLIPPED at screen y 1400 on every frame (a
// world-space clip rect recomputed from the camera). At both holds the line
// falls in a gap between posts, so nothing sits cut through a hold; posts are
// cut only while a move carries them across the line. The X is never clipped
// and stays above 1400 on every frame, and from f112 the whole column is at
// least 6 px above the line (both asserted at module load).
//
// DEVIATIONS from the brief, and why.
//   * THE CLIP AT SCREEN y 1400. A column long enough to hide posts below the
//     mid framing would otherwise sit in the caption band (at k ~1 the frame
//     shows ~1800 world px; the column is 1542). Clipping the feed on the band
//     line is what lets the pull-back reveal posts while nothing ever enters
//     the band.
//   * K_OPEN 2.57, NOT ~1.45. At 1.45 the 820 column is 1189 px wide (her
//     avatar cut at the left edge) and the X is in frame. 2.57 is set by the
//     gaps (frame top above post 2, clip under post 5), so the open is a true
//     close-up with nothing sliced; cx follows her ink, so her post is centred.
//     Neighbours' bars run off the right edge at the open, as a close-up does.
//   * MID SHOWS SIX POSTS (k 1.06), not ~5: with five, the clip cuts the sixth
//     through its neck for the whole hold and it reads as a floating dot.
//   * POST GAP 52, NOT ~40: the 36 px crown on an 84 px avatar would touch the
//     post above's shadow at 40; at 52 it clears it by 12.
//   * K_REST 0.715 -> 0.708, a touch under 0.72: the ten-post column (1542)
//     in a 1102 px span on 835 keeps the last shadow >= 13 px above 1400.
//   * RISE 40, not V2's 90: scaled to the 84 px avatar, and so the core's
//     start position clears the post below.
//   * MOVE 1 KEYED f6-42 (brief f22-50) so the damped camera has landed on
//     "encouraging" (0.59 %k/f at f46, still by f52); keyed f22 it lands ~f58.
//     It starts under "not" while the stack is still settling.
//   * MOVE 2 KEYED f70-98 (brief f80-112) so the lower posts are revealed
//     before the wave reaches them; the damped camera lands ~f104-108.
//   * A HELD-BREATH CREEP (+0.012, f44-70) between the moves, where the brief
//     names none, so the hold carries motion.
//   * HER FACE IS SET BY HAND, short (240 / 164), so her post fits the close
//     open with 72 px each side. At rest it also reads against the copies'
//     full lines.
//   * THE COPY AVATAR HAS NO SHADOW (black on black adds nothing but 4 px of
//     silhouette).
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// THE BEATS. f = round((t - 35.30) * 24).
// ---------------------------------------------------------------------------
export const BEATS = {
  not: 1,
  youKnow: 18,
  in: 31,
  the: 33,
  business: 36,
  of: 40,
  encouraging: 46,
  fascism: 56,
  to: 73,
  take: 79,
  over: 84,
  social: 90,
  media: 106,
  speechEnd: 115,
  nextLine: 119,
};

// ---------------------------------------------------------------------------
// THE AVATAR — public/person.png rebuilt as a path (V2's measurements).
// ---------------------------------------------------------------------------
const PNG = {
  headCy: 143.35,
  headR: 102.39,
  bodyTop: 265.8,
  foot: 471.07,
  halfW: 215,
  flatHalf: 19,
  rx: 196,
  ry: 193,
  corner: 11,
  top: 40.96,
};
export const HEAD_R = 20;
export const P_SCALE = HEAD_R / PNG.headR;
export const HEAD_UP = (PNG.foot - PNG.headCy) * P_SCALE;
export const BODY_UP = (PNG.foot - PNG.bodyTop) * P_SCALE;
export const BODY_HALF = PNG.halfW * P_SCALE;
export const FLAT_HALF = PNG.flatHalf * P_SCALE;
export const BODY_RX = PNG.rx * P_SCALE;
export const BODY_RY = PNG.ry * P_SCALE;
export const CORNER = PNG.corner * P_SCALE;
export const AV_H = (PNG.foot - PNG.top) * P_SCALE; // 84.01
export const AV_W = 2 * BODY_HALF; // 84.0

const n2 = (v: number) => Number(v.toFixed(3));
/** The glyph in local coords: x about its axis, y up from the foot (foot = 0). */
export const PERSON_D = (() => {
  const hy = -HEAD_UP;
  const bt = -BODY_UP;
  const r = HEAD_R;
  const head = `M${n2(-r)} ${n2(hy)} a${r} ${r} 0 1 0 ${n2(2 * r)} 0 a${r} ${r} 0 1 0 ${n2(-2 * r)} 0 Z`;
  const body = [
    `M${n2(-FLAT_HALF)} ${n2(bt)}`,
    `H${n2(FLAT_HALF)}`,
    `A${n2(BODY_RX)} ${n2(BODY_RY)} 0 0 1 ${n2(BODY_HALF)} ${n2(bt + BODY_RY)}`,
    `V${n2(-CORNER)}`,
    `A${n2(CORNER)} ${n2(CORNER)} 0 0 1 ${n2(BODY_HALF - CORNER)} 0`,
    `H${n2(-BODY_HALF + CORNER)}`,
    `A${n2(CORNER)} ${n2(CORNER)} 0 0 1 ${n2(-BODY_HALF)} ${n2(-CORNER)}`,
    `V${n2(bt + BODY_RY)}`,
    `A${n2(BODY_RX)} ${n2(BODY_RY)} 0 0 1 ${n2(-FLAT_HALF)} ${n2(bt)}`,
    "Z",
  ].join(" ");
  return `${head} ${body}`;
})();

// ---------------------------------------------------------------------------
// THE WORLD, world px, everything centred on x 540.
// ---------------------------------------------------------------------------
export const AXIS_X = 540;
export const COL_W = 820;
export const COL_L = AXIS_X - COL_W / 2; // 130
export const COL_R = AXIS_X + COL_W / 2; // 950
export const AV_CX = COL_L + BODY_HALF; // the avatar's axis
/** The bars start 120 right of the column's edge: the avatar's 84, then 36. */
export const BARS_X0 = COL_L + 120; // 250
export const BARS_MAX = COL_R - BARS_X0; // 700
export const LINE_GAP = 20;
export const POST_H = AV_H;
export const LINE1_DY = (POST_H - (2 * BAR_H + LINE_GAP)) / 2; // 4
export const LINE2_DY = LINE1_DY + BAR_H + LINE_GAP; // 52
export const POST_GAP = 52;
export const PITCH = POST_H + POST_GAP;
export const N_POSTS = 10;
export const HER = 3; // her post: the 4th from the top

// simple-icons "x" (the X logo), 24-unit viewBox — copied from V2 / TwitterToX
export const X_PATH =
  "M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z";
const X_UNITS = { x0: 0, x1: 24, y0: 1.153, y1: 22.846 };
export const X_W = 130;
export const X_SCALE = X_W / (X_UNITS.x1 - X_UNITS.x0);
export const X_H = (X_UNITS.y1 - X_UNITS.y0) * X_SCALE; // 117.5
export const HEADER_GAP = 112;

/** The whole column, X top to the last post's shadow. */
export const COLUMN_H = X_H + HEADER_GAP + N_POSTS * POST_H + (N_POSTS - 1) * POST_GAP + SHADOW;
/** World y of the column's centre (world = screen at k 1 on the rest centre). */
export const COLUMN_C = 835;
export const X_TOP = COLUMN_C - COLUMN_H / 2;
export const X_BOTTOM = X_TOP + X_H;
export const X_CY = X_TOP + X_H / 2;
const X_TX = AXIS_X - ((X_UNITS.x0 + X_UNITS.x1) / 2) * X_SCALE;
const X_TY = X_CY - ((X_UNITS.y0 + X_UNITS.y1) / 2) * X_SCALE;
export const FEED_TOP = X_BOTTOM + HEADER_GAP;
export const postTop = (i: number) => FEED_TOP + i * PITCH;
export const COLUMN_BOTTOM = postTop(N_POSTS - 1) + POST_H + SHADOW;

// ---------------------------------------------------------------------------
// THE POSTS. A face is two lines of word-bar widths.
// ---------------------------------------------------------------------------
export type Face = { l1: number[]; l2: number[] };
export const WORD_MIN = 48;
export const WORD_SPAN = 124;
/** A line `len` long, split into hashed words (48..172) on BAR_GAP gaps; the
 *  last word takes up the rest, so the line ends exactly at `len`. */
const lineOf = (len: number, seed: number) => {
  const out: number[] = [];
  let x = 0;
  for (let j = 0; j < 20; j++) {
    const w = WORD_MIN + WORD_SPAN * hash(seed, j + 1);
    if (x + w + BAR_GAP + WORD_MIN > len) {
      out.push(len - x);
      break;
    }
    out.push(w);
    x += w + BAR_GAP;
  }
  return out;
};
export const lineLen = (line: number[]) => line.reduce((a, w) => a + w, 0) + (line.length - 1) * BAR_GAP;

/** Ordinary line lengths, as fractions of BARS_MAX. */
export const L1_RANGE = [0.44, 0.66] as const;
export const L2_RANGE = [0.2, 0.5] as const;
/** Her post: an ordinary face, set by hand on the short side of the range so
 *  her whole post fits the close open. */
export const HER_FACE: Face = { l1: [56, 104, 40], l2: [84, 60] };
export const POSTS: Face[] = Array.from({ length: N_POSTS }, (_, i) =>
  i === HER
    ? HER_FACE
    : {
        l1: lineOf(BARS_MAX * (L1_RANGE[0] + (L1_RANGE[1] - L1_RANGE[0]) * hash(i, 31)), i * 7 + 1),
        l2: lineOf(BARS_MAX * (L2_RANGE[0] + (L2_RANGE[1] - L2_RANGE[0]) * hash(i, 37)), i * 7 + 2),
      },
);

/** THE COPY — one fixed face, identical in every slot it takes: line 1 the
 *  full 700, line 2 at 80 %. */
export const COPY: Face = {
  l1: [136, 92, 180, 68, 144],
  l2: [150, 72, 196, 82],
};
if (Math.abs(lineLen(COPY.l1) - BARS_MAX) > 1e-6 || Math.abs(lineLen(COPY.l2) - 0.8 * BARS_MAX) > 1e-6) {
  throw new Error("NotInTheBusinessV3: the copy's lines are not 100 % / 80 %");
}

// ---------------------------------------------------------------------------
// THE FLIPS.
// ---------------------------------------------------------------------------
export const FLIP_F = 12;
export const FLIP_MIN = 0.04;
export const WAVE_F0 = BEATS.take; // 79
export const WAVE_F1 = 100;
/** The wave's position down the column is LIN * x + (1 - LIN) * x^2 of its
 *  clock: an ease-in, sparse then fast. */
export const WAVE_LIN = 0.35;
export const WAVE_JITTER = 1.5;
export const WAVE_SEED = 382;
const waveTime = (u: number) => {
  const a = 1 - WAVE_LIN;
  const b = WAVE_LIN;
  const x = (-b + Math.sqrt(b * b + 4 * a * u)) / (2 * a);
  return WAVE_F0 + (WAVE_F1 - WAVE_F0) * x;
};
export const FLIP_START: (number | null)[] = POSTS.map((_, i) => {
  if (i === HER) return null;
  if (i === 0) return BEATS.encouraging;
  if (i === 1) return BEATS.fascism;
  const u = (i - 2) / (N_POSTS - 1 - 2);
  return waveTime(u) + WAVE_JITTER * (2 * hash(i, WAVE_SEED) - 1);
});

export const flipAt = (i: number, f: number) => {
  const s = FLIP_START[i];
  if (s === null) return { scale: 1, copy: false };
  const u = clamp01((f - s) / FLIP_F);
  const th = Math.PI * smoothstep(u);
  return { scale: Math.max(FLIP_MIN, Math.abs(Math.cos(th))), copy: u >= 0.5 };
};

// ---------------------------------------------------------------------------
// HER — the core memory stack on her avatar.
// ---------------------------------------------------------------------------
export const CROWN_STEP = 12;
export const CROWN = 3 * CROWN_STEP;
export const RISE = 40;
export const RISE_F = 22;
export const STAGGER = 2;
const EASE_LAND = Easing.bezier(0.16, 1, 0.3, 1);
export const STACK = [
  { key: "orange", color: ORANGE, start: 0, up: 3 * CROWN_STEP },
  { key: "purple", color: PURPLE, start: STAGGER, up: 2 * CROWN_STEP },
  { key: "blue", color: BLUE, start: 2 * STAGGER, up: CROWN_STEP },
] as const;
export const CORE_START = 3 * STAGGER;
export const riseAt = (f: number, start: number) => RISE * (1 - EASE_LAND(clamp01((f - start) / RISE_F)));

// ---------------------------------------------------------------------------
// THE CAMERA.
// ---------------------------------------------------------------------------
export const CLIP_Y = 1400; // screen y: the feed is clipped here (caption band)
export const HER_TOP = postTop(HER);
export const HER_INK_R = BARS_X0 + lineLen(POSTS[HER].l1) + SHADOW;
/** OPEN: close on her post. The frame's top edge sits in the middle of the
 *  gap above the 2nd post and the clip in the middle of the gap under the 5th,
 *  so the open shows posts 2-5 whole and cuts nothing; her crowned post lands
 *  on screen y ~829. Her ink is centred across. */
const gapMid = (i: number) => (postTop(i) + POST_H + SHADOW + postTop(i + 1)) / 2;
export const OPEN_FIRST = 1;
export const OPEN_LAST = 4;
export const K_OPEN = (CLIP_Y - 0) / (gapMid(OPEN_LAST) - gapMid(OPEN_FIRST - 1));
export const C_OPEN = gapMid(OPEN_FIRST - 1) + (FRAME_H / 2 - CAM_LIFT) / K_OPEN;
export const HER_C = (HER_TOP - CROWN + HER_TOP + POST_H + SHADOW) / 2;
export const CX_OPEN = (COL_L + HER_INK_R) / 2;
/** MID: the X and the top six posts; the clip falls in the gap under the
 *  sixth, so the seventh is hidden just below it. */
export const K_MID = 1.06;
export const MID_LAST = 5;
export const K_HOLD = 0.012; // the held breath
export const MID_CUT_Y = postTop(MID_LAST) + POST_H + SHADOW + (POST_GAP - SHADOW) / 2;
export const C_MID = MID_CUT_Y - (CLIP_Y - FRAME_H / 2 + CAM_LIFT) / (K_MID + K_HOLD / 2);
/** REST: the whole column on 835. */
export const REST_SPAN = 1102;
export const K_REST = REST_SPAN / COLUMN_H;
export const C_REST = COLUMN_C;
export const K_CREEP_OUT = -0.01;

/** A camera state; `c` is the world y put on screen y 835. */
type Shot = { k: number; cx: number; c: number };
export const SHOT_OPEN: Shot = { k: K_OPEN, cx: CX_OPEN, c: C_OPEN };
export const SHOT_MID: Shot = { k: K_MID, cx: AXIS_X, c: C_MID };
export const SHOT_HELD: Shot = { k: K_MID + K_HOLD, cx: AXIS_X, c: C_MID };
export const SHOT_REST: Shot = { k: K_REST, cx: AXIS_X, c: C_REST };
export const SHOT_END: Shot = { k: K_REST + K_CREEP_OUT, cx: AXIS_X, c: C_REST };
const screenOf = (x: number, y: number, s: Shot) => ({
  x: AXIS_X + (x - s.cx) * s.k,
  y: FRAME_H / 2 - CAM_LIFT + (y - s.c) * s.k,
});
/** Each move eases log k and the SCREEN position of one world anchor on one
 *  curve, and solves the camera from the two, so the anchor travels a
 *  straight line on screen, nothing swings through a detour, and the zoom
 *  reads at an even rate however far it goes. */
type Move = { f0: number; f1: number; warp: number; from: Shot; to: Shot; ax: number; ay: number };
export const HER_AV_CY = HER_TOP + POST_H / 2;
export const MOVES: Move[] = [
  // "you know, in the business of": back and up off her, to the X and the top
  // of the feed; anchored on her avatar
  { f0: 6, f1: 42, warp: 1, from: SHOT_OPEN, to: SHOT_MID, ax: AV_CX, ay: HER_AV_CY },
  // the held breath under "encouraging fascism": creep in on the frame's centre
  { f0: 44, f1: 70, warp: 1, from: SHOT_MID, to: SHOT_HELD, ax: AXIS_X, ay: C_MID },
  // "take over social media": back and down to the whole column; anchored on
  // the X, which barely moves while the feed grows out below it
  { f0: 70, f1: 98, warp: 0.75, from: SHOT_HELD, to: SHOT_REST, ax: AXIS_X, ay: X_CY },
  // the hold: creep out on the column's centre, still creeping on the last frame
  { f0: 98, f1: 160, warp: 1, from: SHOT_REST, to: SHOT_END, ax: AXIS_X, ay: C_REST },
];
const shotAt = (f: number): Shot => {
  let m = MOVES[0];
  for (const mv of MOVES) if (f >= mv.f0) m = mv;
  if (f < MOVES[0].f0) return SHOT_OPEN;
  const e = camEase((f - m.f0) / (m.f1 - m.f0), m.warp);
  const k = m.from.k * Math.pow(m.to.k / m.from.k, e); // zoom evenly: k eases in log space
  const p0 = screenOf(m.ax, m.ay, m.from);
  const p1 = screenOf(m.ax, m.ay, m.to);
  const px = p0.x + (p1.x - p0.x) * e;
  const py = p0.y + (p1.y - p0.y) * e;
  return { k, cx: m.ax - (px - AXIS_X) / k, c: m.ay - (py - (FRAME_H / 2 - CAM_LIFT)) / k };
};
const TRACK = (() => {
  const F: number[] = [];
  const K: number[] = [];
  const CY: number[] = [];
  const CX: number[] = [];
  for (let f = 0; f <= DURATION + 24; f++) {
    const s = shotAt(f);
    F.push(f);
    K.push(s.k);
    CY.push(s.c + CAM_LIFT / s.k);
    CX.push(s.cx);
  }
  return { F, K, CY, CX };
})();
export const NIB3_CAM_F = TRACK.F;
export const NIB3_CAM_K = TRACK.K;
export const NIB3_CAM_CY = TRACK.CY;
export const NIB3_CAM_CX = TRACK.CX;
export const nib3Camera = (f: number) => runCamera2(f, NIB3_CAM_F, NIB3_CAM_CY, NIB3_CAM_CX, NIB3_CAM_K);
export const nib3CameraSway = (f: number) => {
  const c = nib3Camera(f);
  const s = sway(f);
  return { cx: c.cx + s.dx, cy: c.cy + s.dy, k: c.k };
};
const REST = { cx: NIB3_CAM_CX[0], cy: NIB3_CAM_CY[0] };
/** The clip line in world y for a camera. */
export const clipWorldY = (cam: { cy: number; k: number }) => cam.cy + (CLIP_Y - FRAME_H / 2) / cam.k;

// CAPTION SAFETY, asserted. The feed is clipped at screen y 1400 on every
// frame; the X (never clipped) stays above it; and from f112 on the whole
// column is above the clip, so the resolved frame has nothing cut.
export const captionProblems = () => {
  const out: string[] = [];
  for (let f = 0; f < DURATION; f++) {
    const cam = nib3CameraSway(f);
    const xb = worldToScreen(AXIS_X, X_BOTTOM + SHADOW, cam).y;
    if (xb > CLIP_Y) out.push(`the X reaches screen y ${xb.toFixed(1)} at f${f}`);
    if (f >= 112) {
      const b = worldToScreen(AXIS_X, COLUMN_BOTTOM, cam).y;
      if (b > CLIP_Y - 6) out.push(`the column bottom is at screen y ${b.toFixed(1)} at f${f}`);
    }
  }
  return out;
};
if (!(globalThis as { __NIB3_MEASURE?: boolean }).__NIB3_MEASURE) {
  const p = captionProblems();
  if (p.length) throw new Error(`NotInTheBusinessV3: ${p[0]}`);
}

export const schema = z.object({
  sway: z.boolean(),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ sway: true });

const barsOf = (face: Face, y0: number, fill: string) => {
  const out: React.ReactNode[] = [];
  [face.l1, face.l2].forEach((line, li) => {
    let x = BARS_X0;
    const y = y0 + (li === 0 ? LINE1_DY : LINE2_DY);
    line.forEach((w, j) => {
      out.push(<rect key={`${li}-${j}`} x={x} y={y} width={w} height={BAR_H} rx={BAR_H / 2} fill={fill} />);
      x += w + BAR_GAP;
    });
  });
  return out;
};

const avatar = (y0: number, fill: string, dy = 0) => (
  <path d={PERSON_D} fill={fill} transform={`translate(${AV_CX} ${y0 + POST_H + dy})`} />
);

const flipT = (s: number) => `translate(${AXIS_X} 0) scale(${s} 1) translate(${-AXIS_X} 0)`;

const Post: React.FC<{ i: number; frame: number }> = ({ i, frame }) => {
  const y0 = postTop(i);
  const { scale, copy } = flipAt(i, frame);
  const face = copy ? COPY : POSTS[i];
  return (
    <g>
      <g transform={`translate(${SHADOW} ${SHADOW}) ${flipT(scale)}`}>
        {copy ? null : avatar(y0, BLACK)}
        {barsOf(face, y0, BLACK)}
      </g>
      <g transform={flipT(scale)}>
        {avatar(y0, copy ? BLACK : WHITE)}
        {barsOf(face, y0, WHITE)}
      </g>
    </g>
  );
};

const HerPost: React.FC<{ frame: number }> = ({ frame }) => {
  const y0 = HER_TOP;
  return (
    <g>
      <g transform={`translate(${SHADOW} ${SHADOW})`}>{barsOf(POSTS[HER], y0, BLACK)}</g>
      {barsOf(POSTS[HER], y0, WHITE)}
      {/* the core's shadow at the back, the chain, the white core */}
      {frame >= CORE_START ? (
        <g transform={`translate(${SHADOW} ${SHADOW})`}>{avatar(y0, BLACK, riseAt(frame, CORE_START))}</g>
      ) : null}
      {STACK.map((l) =>
        frame >= l.start ? <g key={l.key}>{avatar(y0, l.color, riseAt(frame, l.start) - l.up)}</g> : null,
      )}
      {frame >= CORE_START ? avatar(y0, WHITE, riseAt(frame, CORE_START)) : null}
    </g>
  );
};

const CLIP_ID = "nib3-caption-band";

const NotInTheBusinessV3: React.FC<Props> = ({ sway: withSway }) => {
  const frame = useCurrentFrame();
  const cam = withSway ? nib3CameraSway(frame) : nib3Camera(frame);
  const yClip = clipWorldY(cam);
  const xShape = (off: number, fill: string) => (
    <path d={X_PATH} fill={fill} transform={`translate(${X_TX + off} ${X_TY + off}) scale(${X_SCALE})`} />
  );
  return (
    <World frame={frame} cam={cam} rest={REST}>
      <defs>
        <clipPath id={CLIP_ID}>
          <rect x={-6000} y={-6000} width={13000} height={6000 + yClip} />
        </clipPath>
      </defs>

      {/* THE X — the platform the feed belongs to. It never moves. */}
      {xShape(SHADOW, BLACK)}
      {xShape(0, WHITE)}

      {/* THE FEED, clipped at the caption band */}
      <g clipPath={`url(#${CLIP_ID})`}>
        {POSTS.map((_, i) => (i === HER ? null : <Post key={i} i={i} frame={frame} />))}
        <HerPost frame={frame} />
      </g>
    </World>
  );
};

export default NotInTheBusinessV3;
