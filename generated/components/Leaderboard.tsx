import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  CAM_LIFT,
  ICON_SHADOW_BLUR,
  ICON_SHADOW_OPACITY,
  ICON_SHADOW_Y,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  SQUIRCLE_RATIO,
  SQUIRCLE_SMOOTH,
  Vignette,
  camEase,
  camMove,
  clamp01,
  iconShadow,
  runCamera,
  smoothstep,
  squirclePath,
  sway,
  worldTransform,
} from "./fieldShared";
import {
  KRAFT_BASE,
  KRAFT_BLUR,
  KRAFT_DIM,
  KRAFT_SRC,
  KraftBackground,
  MARK_SIZE,
  TILE_GRAD_BOTTOM,
  TILE_GRAD_TOP,
  TILE_SHADOW,
} from "./d1Shared";
import { ANTHROPIC, GOOGLE, OPENAI, type BrandGlyph } from "./brandGlyphs";

// ---------------------------------------------------------------------------
// "whose model scores better on this leaderboard" — V2. Cheeky Pint style on
// kraft, opaque cutaway, 1080x1920, 24fps.
//
// THE LINE (Bret Taylor, OpenAI board chair, on what he learned about the AI
// research labs):
//   "you can look at OpenAI, Google, Anthropic and say whose model scores
//    better on this leaderboard"
//
// SRT span 28.920 -> 34.039.
//   round((34.039 - 28.920) * 24) = round(5.119 * 24) = round(122.856) = 123
//   frames of speech, plus a 16-frame tail so the resolved picture holds = 139.
//
// WORD ONSETS (frames from the composition start, = 28.920 s)
//   f0 you · f6 can · f9 look · f14 at · f20 OpenAI · f36 Google ·
//   f40 Anthropic · f58 and · f59 say · f64 whose · f74 model · f81 scores ·
//   f90 better · f96 on · f102 this · f105 leaderboard ·
//   speech ends f123 · tail to f139.
//
// ---------------------------------------------------------------------------
// WHAT CHANGED FROM V1 — exactly three things, on the director's review. The
// staircase race, the tiles riding the tips with the mark knocked out, the
// launches on the names, the four swap frames, the growing step heights, the
// camera that opens tight on the empty corner and reacts, the minimal axes, the
// absence of numbers and the hold that keeps stepping are all V1's, unchanged.
//
//   1. THE AMBER IS THE WHOLE LEADING LINE. V1 trimmed the accent to the last
//      leg or two of the leader (AMBER_BACK), and behind a 108 px tile that was
//      a few pixels of amber at f64 and f138 — the clip's rule is "many
//      converge on one point, and amber is that point", and here the point is
//      the LEAD. So the leader's line is now drawn in ACCENT from the origin to
//      its tip, whole, and the other two stay ink. At a swap the amber hands
//      over on the crossing frame, hard, no fade: the crossing IS the event.
//      One line is amber on every frame from f14 (OpenAI, alone). The trim and
//      the two-leg logic are gone; the tiles stay white; the axes stay ink.
//
//   2. EVERY LINE LAUNCHES WITH A RISE. V1 gave OpenAI a 330 px "lane sprint"
//      lying ON the x-axis, which reads as moving sideways rather than scoring
//      — and with the amber now on the whole line it would have painted the
//      axis amber across half the frame. Each lab now steps UP out of the
//      origin first, to three clearly separate levels (Google 58, OpenAI 96,
//      Anthropic 134, so the three lowest runs read as three rules and not as
//      one thick one), and NO segment of
//      any line lies on the x-axis at all (`lb-check.ts` measures the furthest
//      on-axis point at 0.00 world px from the origin, contract <= 20). The
//      x fan-out is bought by per-line x-RATES across the whole climb: over the
//      cut OpenAI takes 708 world px of run, Google 532 and Anthropic 348, and
//      the lanes only ever open. It costs two things, both in DEVIATIONS below:
//      OpenAI's biggest single run is 180 px where V1's was 330, and Google
//      launches two frames further ahead of its word (Anthropic one frame less).
//
//   3. THE CHART FILLS THE FRAME. V1's resolved ink measured y 488..1212 — much
//      smaller than the hurricane cut's. The world chart is now 1.6x taller and
//      1.1x wider (max height 845 world px where V1 had 528; OpenAI's total run
//      708 where V1 had 644) and the camera was re-solved against it, so the
//      resolved ink lands on
//
//          x 133 .. 948   y 336 .. 1331   (screen, f112 onward)
//
//      inside the house 120..960 / 300..1350 box. Type sizes do not exist in
//      this cut and the tile stays MARK_SIZE 108 world px; all of the growth is
//      world geometry plus the camera. The origin is still in frame at the
//      bottom-left, and the content centre is the ink's own centre, held at
//      screen y 835 on average across the tail (see C_FINAL).
//
// ---------------------------------------------------------------------------
// THE CLIP'S ONE VISUAL RULE: many converge on one point, and amber is that
// point. Here the three labs converge on the top score, and the amber is the
// LEAD — the WHOLE line of whichever lab is currently highest.
//
// THE PICTURE. One score chart in the hurricane cut's material: kraft, two ink
// axis rules with a couple of ticks each and NO numbers, and three score lines
// climbing from one shared origin at the bottom-left as STAIRCASES — a step up
// is a model release, a flat run is waiting. Each line's tip carries that lab's
// brand mark as a house tile (white squircle, MARK_SIZE 108, the tile gradient,
// TILE_SHADOW, the mark KNOCKED OUT so the kraft shows through — the D1Mark /
// CompanyCard recipe, measured on the 24-unit box in `brandGlyphs.tsx`). The
// tile rides the tip, centred TILE_LIFT above it, so the line meets its bottom
// edge. The vertical order of the three tiles IS the leaderboard; the tiles are
// the only labels.
//
// THE SCORES ARE ILLUSTRATIVE. Nothing on this chart is data. There are no
// numbers, no dates, no title, no legend and no units anywhere in the frame,
// and none of the three staircases is taken from, or meant to represent, any
// published benchmark, leaderboard or release schedule. The picture claims
// exactly one thing, which is the thing the speaker says: three labs climb, and
// the lead keeps changing hands. The step heights and timings below were chosen
// so the lead changes ON the words, and for no other reason.
//
// THE GESTURES — every one, with its word and its frame. There are no others.
//   f0-f14   "you can look at"   the camera is parked TIGHT (k 2.2) on the empty
//                                bottom-left corner: two axis rules, a tick each
//                                way and nothing else. Alive on `sway` alone.
//   f14      (6 ahead of         OPENAI LAUNCHES — a 96 px STEP UP out of the
//            "OpenAI" f20)       origin, its tile riding out from behind the tip
//                                and scaling in over TILE_IN frames while the
//                                tip is already moving (the coin-minting recipe
//                                — never a pop at rest). It is the only line, so
//                                the amber is on it, whole.
//   f16      (2 after the tip    THE CAMERA REACTS. One damped `camMove`, warp
//            first moves)        CAM_WARP, k 2.2 -> 0.99, content centre 1173
//                                -> 851, cx 353 -> 630. Keyed two frames AFTER
//                                the leading tip moves, never ahead of it.
//   f28      (8 ahead of         GOOGLE LAUNCHES, same recipe: a 58 px step up,
//            "Google" f36)       then out into the middle lane.
//   f35      (5 ahead of         ANTHROPIC LAUNCHES, same recipe, with the
//            "Anthropic" f40)    tallest first step of the three (134) — the
//                                REACH that buys the last lane its clearance.
//   f35-f61  "and" f58,          three staircases stepping, a step every 10-16
//            "say" f59           frames per line. OpenAI holds the lead, whole
//                                line amber.
//   f61.70   (2.3 ahead of       SWAP 1. Google's step f57-64 crosses OpenAI's
//            "whose" f64)        282. The amber hands to Google on that frame.
//   f85.30   (4.7 ahead of       SWAP 2. Anthropic's step f83-93 crosses
//            "better" f90)       Google's 426. The amber hands to Anthropic.
//   f101.00  (4.0 ahead of       SWAP 3. OpenAI's step f97-105 — the tallest in
//            "leaderboard" f105) the cut, 176 — goes past both. Amber back to
//                                OpenAI.
//   f112     ("leaderboard"      THE CAMERA IS AT REST. `camMove` ends at f112,
//            f105 is spoken      so the last of the pull-back runs under the
//            while it finishes)  word; there is no frame left to land it ahead
//                                of f105 without stopping the camera early.
//   f127.30  (tail)              SWAP 4, the one allowed extra: Anthropic's last
//                                step f123-131 and OpenAI's race up together and
//                                Anthropic edges in front by 13 px. Amber hands
//                                over for the last time.
//   f112-139 (tail)              held, alive: all three keep stepping, the
//                                resolved spread is 74 px, the tiles sway, and
//                                the camera breathes CREEP_PX upward following
//                                the bunch (a creep, not a key).
//
// THE FAN. Three lines out of ONE point cannot be far apart at that point, and
// a tile is 108 px wide, so each lab steps up and then takes its own x-rate:
// OpenAI 708 px of run over 125 frames, Google 532 over 111, Anthropic 348 over
// 104, front-loaded just enough that the lanes are open by the time the third
// tile is full size. Measured over the whole cut (`lb-check.ts`, integer
// frames):
//   * from f38 on, every pair of tile centres is >= 130 world px apart
//     (minimum 133.5, f38, Google/Anthropic);
//   * across the WHOLE cut the two tiles never touch — minimum box gap 7.9
//     world px, on f35, while Anthropic's tile is still at 0.06 scale;
//   * no segment of any line lies on the x-axis (0.00 px past the origin).
//
// Anthropic's riser leaves the origin vertically, so the Y-AXIS STANDS 30 px TO
// ITS LEFT (AX_X 230, origin 260): with the axis at the origin that riser was
// drawn on top of it and vanished. All three launch legs are risers now, so all
// three need that clearance.
//
// SPEED. The cap is 45 screen px/frame. Peak tip speed, own motion, measured at
// h = 1 and h = 1/4: 41.11 px/frame on f33 and 42.46 on f30 — both Google's
// launch run under the still-tight camera, and the two agree to within 3%, so
// this is a real speed and not a sub-frame spike. Per lab, h = 1: OpenAI 40.45
// (f31), Google 41.11 (f33), Anthropic 34.53 (f40). A rise's peak is 1.5x its
// average (smoothstep), which is what sets every rise duration here: step
// heights run 40-176 world px and GROW through the cut, and their durations
// grow with the camera's k so the screen speed stays flat.
//
// PADDING. On the resolved frames (f112-f138), measured off the render with
// `lb-band.py`: see the header of `lb2/` — analytically x 133..948, y 336..1331,
// inside the 120..960 / 300..1350 box. Content centre y 835 (CAM_LIFT).
//
// ---------------------------------------------------------------------------
// DEVIATIONS from the brief, and why each one is forced by the brief's own
// rules (the 45 px/frame cap, the >= 130 px tile spacing, the padding box):
//
//   * GOOGLE LAUNCHES 8 FRAMES AHEAD OF ITS WORD AND ANTHROPIC 5, not 6 and 6.
//     Change 2 costs each lane the frames its launch rise takes, and the
//     >= 130 px tile-centre contract at f38 is decided almost entirely by how
//     much x Google can buy between its launch and f38. At the cap (45 screen
//     px/frame against k ~ 1.95 there, i.e. ~23 world px/frame) a launch at f30
//     cannot reach it; f28 can, with 42.5 px/frame of headroom to spare.
//     Anthropic moved the other way, f34 -> f35: at f34 its 6.5 px tile and
//     Google's full-size one clear each other by 0.76 world px, and one frame
//     later they clear by 7.9. Both are inside the house 4-10 frames.
//   * THE OPENING k IS K_TIGHT 2.2 AND THE CAMERA LANDS AT K_FINAL / CX_FINAL,
//     not at k 1.00 / cx 540. K_FINAL and CX_FINAL are solved against the ink
//     box (INK_X0..INK_Y1 below) so the resolved picture lands on the director's
//     x 130..950 / y 330..1320, which is the whole of change 3.
//   * THE CAMERA PANS. `camMove`/`runCamera` only carry cy and k, so cx gets its
//     own key-per-frame track through the SAME damper (`runCamera` with an inert
//     k channel) and the kraft takes cx/cxRest, which `GridBackground` already
//     supports. Inherited from the hurricane cut.
//   * C_FINAL IS THE INK'S CENTRE PLUS HALF THE TAIL CREEP (845 + 6 = 851). The
//     creep moves the camera CREEP_PX up across f112-139; centring on the ink
//     itself would put the whole tail below 835 and spend the bottom margin.
//     Offsetting by half of it makes the creep symmetric about screen y 835.
//   * CAM_WARP IS 0.55, not V1's 0.62. The camera has to be reacting hard while
//     Google's launch run is at its fastest (f30-39); at 0.62 that run peaked at
//     43.7 screen px/frame against the cap's 45, and at 0.55 it is 42.5.
//   * THE SWAPS LAND AT f61.70 / f85.30 / f101.00 / f127.30, within 0.6 frames
//     of V1's f61.7 / f85.5 / f100.4 / f127.3. Each still sits 2-5 frames ahead
//     of its word, inside the house 0-10.
// ---------------------------------------------------------------------------

export const FPS = 24;
export const DURATION = 139;

// -- the drawing surface ----------------------------------------------------
export const WORLD_W = 1080;
export const WORLD_H = 1450;

// -- the padding contract (the hurricane cut's box) -------------------------
export const PAD_X0 = 120;
export const PAD_X1 = 960;
export const PAD_Y0 = 300;
export const PAD_Y1 = 1350;

// -- the chart, in world px -------------------------------------------------
// CHANGE 3 lives in these eight numbers. The ink box they describe is
// 820 x 990 world px, which at K_FINAL is 812 x 980 screen — the director's
// x 130..950 / y 330..1320.
export const OX = 260; // the shared origin: the bottom-left corner
export const OY = 1330;
// The y-axis stands 30 px LEFT of the shared origin. Every lab's first leg is
// now a rise straight out of that origin, and with the axis at OX those risers
// are drawn exactly on top of the axis and disappear into it. Data starting a
// little inside the axis is ordinary chart practice and it buys the left-hand
// line its own stroke.
export const AX_X = 230;
export const AX_TOP = 350; // the y-axis runs up to here
export const AX_RIGHT = 1040; // the x-axis runs out to here
export const TICK = 10;
export const AXIS_OP = 0.55;
export const STROKE = 2.5; // the ONE stroke weight in the piece
// Two ticks each way, no numbers: this is not data and nothing is claimed.
export const Y_TICKS = [OY - 300, OY - 600];
export const X_TICKS = [OX + 260, OX + 520];

// -- the staircases ---------------------------------------------------------
// A leg is either a RUN (rightward, x) or a RISE (upward, y). They are
// contiguous, and the two profiles are chosen so the tip never stalls at a
// corner: a run is LINEAR (one level speed for its whole length) and a rise is
// a smoothstep over its window. A run that eased in and out — the obvious first
// choice — puts a zero-speed frame at BOTH ends of every step, and the tip
// visibly stops twice per step; measured, OpenAI's tip moved 0.31 px on f63
// that way. Linear runs hand the rise a moving tip, and a smoothstep rise's
// first frame is already 0.156 of the step. A rise genuinely starts from rest,
// which is what every lab's launch leg is.
export type Leg = { kind: "run" | "rise"; dur: number; d: number; ramp?: boolean };

export const RUN_RAMP = 0.2; // fraction of a ramped run spent getting to speed
export const runFrac = (u: number, ramp = false) => {
  const x = clamp01(u);
  if (!ramp) return x;
  const area = 1 - RUN_RAMP / 2;
  if (x < RUN_RAMP) {
    const g = x / RUN_RAMP;
    return (RUN_RAMP * (g * g * g - (g * g * g * g) / 2)) / area;
  }
  return (RUN_RAMP / 2 + (x - RUN_RAMP)) / area;
};

export type Lab = {
  key: "OPENAI" | "GOOGLE" | "ANTHROPIC";
  glyph: BrandGlyph;
  glyphFraction: number; // the 24-unit box fills this much of the 108 tile
  launch: number;
  legs: Leg[];
};

const run = (dur: number, d: number, ramp = false): Leg => ({ kind: "run", dur, d, ramp });
const rise = (dur: number, d: number): Leg => ({ kind: "rise", dur, d });

export const LABS: Lab[] = [
  {
    // OpenAI: launched first, so it takes the fastest x-rate and the far lane,
    // and it leads from f14 to f61.7. Its first leg is a step UP (change 2).
    key: "OPENAI",
    glyph: OPENAI,
    glyphFraction: 0.58,
    launch: 14,
    legs: [
      rise(8, 96), // f14-22    h  96  the step up out of the origin, from rest
      run(5, 90), // f22-27     x  90
      rise(7, 98), // f27-34    h 194  the second step, taken BEFORE the far lane
      //                          is bought: it is what keeps OpenAI's first two
      //                          runs clear of Google's and Anthropic's
      run(5, 100), // f34-39    x 190
      rise(5, 46), // f39-44    h 240
      run(8, 180), // f44-52    x 370  out into the far lane
      rise(6, 42), // f52-58    h 282  (Google's step passes this one)
      run(15, 70), // f58-73    x 440  waiting, while Google takes the lead
      rise(7, 86), // f73-80    h 368
      run(5, 66), // f80-85     x 506
      rise(7, 96), // f85-92    h 464
      run(5, 54), // f92-97     x 560  the short wait before the overtake
      rise(8, 176), // f97-105  h 640  SWAP 3 — the tallest step in the cut
      run(5, 44), // f105-110   x 604
      rise(8, 96), // f110-118  h 736
      run(5, 40), // f118-123   x 644
      rise(8, 96), // f123-131  h 832  the last climb, against Anthropic's
      run(8, 64), // f131-139   x 708
    ],
  },
  {
    // Google: the middle lane. Launched f28 (see DEVIATIONS) so its step up and
    // its run into the lane both fit before the spacing contract bites at f38.
    key: "GOOGLE",
    glyph: GOOGLE,
    glyphFraction: 0.56,
    launch: 28,
    legs: [
      rise(4, 58), // f28-32    h  58  the step up out of the origin
      run(7, 152), // f32-39    x 152  the fastest thing in the cut: 21.7 world
      //                          px/f, 42.5 screen at k 1.96
      rise(6, 54), // f39-45    h 112
      run(4, 68), // f45-49     x 220
      rise(6, 80), // f49-55    h 192
      run(2, 20), // f55-57     x 240
      rise(7, 122), // f57-64   h 314  SWAP 1 — takes the lead on f61.70
      run(2, 30), // f64-66     x 270
      rise(7, 112), // f66-73   h 426  steps again BEFORE OpenAI's f73 step, so
      //                          the lead never flickers between them
      run(15, 66), // f73-88    x 336  waiting, while Anthropic's step goes past
      rise(6, 64), // f88-94    h 490
      run(8, 56), // f94-102    x 392
      rise(8, 115), // f102-110 h 605  a big one: it keeps the tail close
      run(6, 40), // f110-116   x 432
      rise(8, 102), // f116-124 h 707
      run(4, 28), // f124-128   x 460
      rise(6, 64), // f128-134  h 771  keeps the tail a close battle
      run(5, 72), // f134-139   x 532
    ],
  },
  {
    // Anthropic: launched last, so it stays nearest the origin and its staircase
    // is the steep one. Its first leg is the tallest REACH of the three, which
    // is what puts clear air between its tile and Google's within ten frames of
    // a shared origin.
    key: "ANTHROPIC",
    glyph: ANTHROPIC,
    glyphFraction: 0.62, // its ink is 24 x 16.918, so it needs a wider box
    launch: 35,
    legs: [
      rise(10, 134), // f35-45  h 134  the REACH, and slower than OpenAI's climb
      //                          so it never takes the lead on the way up. It is
      //                          also the THIRD of the three launch levels: 58,
      //                          96 and 134, so the labs' first runs are three
      //                          clearly separate rules and not one thick one
      run(5, 60), // f45-50     x  60
      rise(6, 81), // f50-56    h 215
      run(5, 54), // f56-61     x 114
      rise(7, 89), // f61-68    h 304
      run(6, 52), // f68-74     x 166
      rise(8, 103), // f74-82   h 407
      run(1, 12), // f82-83     x 178  the shortest wait in the cut
      rise(10, 144), // f83-93  h 551  SWAP 2 — takes the lead on f85.30
      run(8, 48), // f93-101    x 226
      rise(6, 80), // f101-107  h 631
      run(7, 48), // f107-114   x 274
      rise(8, 89), // f114-122  h 720
      run(1, 12), // f122-123   x 286
      rise(8, 125), // f123-131 h 845  SWAP 4 — the tail's one extra, won by
      //                          climbing faster than OpenAI over the same 8
      //                          frames rather than by starting higher
      run(8, 62), // f131-139   x 348
    ],
  },
];

export type Vertex = { x: number; y: number };
export type Track = { verts: Vertex[]; head: Vertex; live: boolean };

// A lab's polyline at frame `f`: every vertex it has actually turned, plus the
// head wherever it is inside the leg it is on.
export const trackAt = (lab: Lab, f: number): Track => {
  let x = OX;
  let y = OY;
  const verts: Vertex[] = [{ x, y }];
  let t = lab.launch;
  if (f < lab.launch) return { verts, head: { x, y }, live: false };
  for (const leg of lab.legs) {
    const u = (f - t) / leg.dur;
    const s = leg.kind === "run" ? runFrac(u, leg.ramp) : smoothstep(u);
    if (leg.kind === "run") x += leg.d * s;
    else y -= leg.d * s;
    if (u < 1) return { verts, head: { x, y }, live: true };
    verts.push({ x, y });
    t += leg.dur;
  }
  return { verts, head: { x, y }, live: true };
};

export const heightAt = (lab: Lab, f: number) => OY - trackAt(lab, f).head.y;

// The leader is simply the highest tip. Its WHOLE line is amber, and the amber
// hands over on the frame the crossing happens — no fade, no trim. OpenAI is
// the leader from its own launch frame, so one line is amber from f14 on.
export const leaderAt = (f: number) => {
  let best = -1;
  let h = -Infinity;
  LABS.forEach((lab, i) => {
    if (f < lab.launch) return;
    const hh = heightAt(lab, f);
    if (hh > h) {
      h = hh;
      best = i;
    }
  });
  return best;
};

// -- the tile on the tip ----------------------------------------------------
export const TILE_LIFT = MARK_SIZE / 2 + 6; // the line meets the tile's bottom edge
export const TILE_IN = 5; // frames the tile takes to scale in behind the tip
export const TILE_FROM = 0.06;

export const SWAY_AMP = 2; // world px; the tiles are never dead still
export const SWAY_PERIOD = [31, 37, 29];

// -- the camera -------------------------------------------------------------
// One damped curve. It opens parked on the empty corner and is opened up by the
// three lines, keyed two frames after OpenAI's tip first moves, and lands at
// f112 so the last of the pull-back runs under "leaderboard" (f105).
export const K_TIGHT = 2.2;
export const CX_TIGHT = 353; // the y-axis at screen x 269, the origin at y 1180
export const C_TIGHT = 1173;
// The resolved framing, solved against the analytic ink bbox below.
export const K_FINAL = 0.99;
export const CX_FINAL = 630; // = the ink box's own centre in x
export const C_FINAL = 851; // = the ink box's centre in y (845) + CREEP_PX / 2
export const CY_FINAL = C_FINAL + CAM_LIFT / K_FINAL;
export const CAM_F0 = 16;
export const CAM_F1 = 112;
export const CAM_WARP = 0.55;
// The tail's breath: a creep, not a key, following the bunch as it keeps
// climbing after the camera is at rest. C_FINAL carries half of it so the
// resolved box is centred on screen y 835 across f112-139 rather than at f112.
export const CREEP_F0 = 112;
export const CREEP_PX = 12;

// The analytic ink bbox at the resolved camera. The axes are the outer edges in
// all four directions: AX_RIGHT runs just past OpenAI's tile and AX_TOP just
// above Anthropic's.
export const INK_X0 = AX_X - TICK; // 220
export const INK_X1 = AX_RIGHT; // 1040
export const INK_Y0 = AX_TOP; // 350
export const INK_Y1 = OY + TICK; // 1340

const CAM_TRACK = (() => {
  const F: number[] = [0];
  const K: number[] = [K_TIGHT];
  const CY: number[] = [C_TIGHT + CAM_LIFT / K_TIGHT];
  F.push(CAM_F0 - 1);
  K.push(K[0]);
  CY.push(CY[0]);
  const m = camMove({
    f0: CAM_F0,
    f1: CAM_F1,
    k0: K_TIGHT,
    k1: K_FINAL,
    c0: C_TIGHT,
    c1: C_FINAL,
    warp: CAM_WARP,
  });
  m.F.forEach((f, i) => {
    F.push(f);
    K.push(m.K[i]);
    CY.push(m.CY[i]);
  });
  F.push(DURATION);
  K.push(K_FINAL);
  CY.push(CY_FINAL);
  return { F, K, CY };
})();
export const CAM_F = CAM_TRACK.F;
export const CAM_K = CAM_TRACK.K;
export const CAM_CY = CAM_TRACK.CY;

// cx through the SAME damper, as the hurricane cut does it: `runCamera` damps
// its middle channel against a key-per-frame target, so handing it the cx keys
// and an inert k channel gives the pan exactly the weight of the zoom.
const CAMX_TRACK = (() => {
  const F: number[] = [0, CAM_F0 - 1];
  const X: number[] = [CX_TIGHT, CX_TIGHT];
  const span = CAM_F1 - CAM_F0;
  for (let i = 0; i <= span; i++) {
    F.push(CAM_F0 + i);
    X.push(CX_TIGHT + (CX_FINAL - CX_TIGHT) * camEase(i / span, CAM_WARP));
  }
  F.push(DURATION);
  X.push(CX_FINAL);
  return { F, X, K: F.map(() => 1) };
})();
export const CAMX_F = CAMX_TRACK.F;
export const CAMX_X = CAMX_TRACK.X;
export const CAMX_K = CAMX_TRACK.K;

export const creepAt = (f: number) =>
  -CREEP_PX * smoothstep((f - CREEP_F0) / (DURATION - CREEP_F0));

export const camAt = (f: number) => {
  const c = runCamera(f, CAM_F, CAM_CY, CAM_K);
  const x = runCamera(f, CAMX_F, CAMX_X, CAMX_K).cy;
  return { k: c.k, cy: c.cy + creepAt(f), cx: x };
};

// The resolved picture a later cut inherits: the three tips at f139.
export const RESOLVED_TIPS = LABS.map((lab) => {
  const t = trackAt(lab, DURATION);
  return { key: lab.key, x: Number(t.head.x.toFixed(2)), y: Number(t.head.y.toFixed(2)) };
});

// -- the beat table ---------------------------------------------------------
export const BEATS = {
  you: 0,
  can: 6,
  look: 9,
  at: 14,
  openai: 20,
  google: 36,
  anthropic: 40,
  and: 58,
  say: 59,
  whose: 64,
  model: 74,
  scores: 81,
  better: 90,
  on: 96,
  thisWord: 102,
  leaderboard: 105,
  end: 123,
} as const;

export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  backgroundBase: z.string(),
  backgroundSrc: z.string(),
  backgroundBlur: z.number(),
  backgroundDim: z.number(),
  parallax: z.number(),
  shadowY: z.number(),
  shadowBlur: z.number(),
  shadowOpacity: z.number(),
  iconShadowY: z.number(),
  iconShadowBlur: z.number(),
  iconShadowOpacity: z.number(),
  vignette: z.number(),
  beats: z.object({
    you: z.number(),
    can: z.number(),
    look: z.number(),
    at: z.number(), // OpenAI's line steps up here, 6 ahead of its name
    openai: z.number(),
    google: z.number(),
    anthropic: z.number(),
    and: z.number(),
    say: z.number(),
    whose: z.number(), // swap 1 lands just ahead of this
    model: z.number(),
    scores: z.number(),
    better: z.number(), // swap 2 lands just ahead of this
    on: z.number(),
    thisWord: z.number(),
    leaderboard: z.number(), // swap 3 ahead of it; the camera settles under it
    end: z.number(), // speech ends; tail to 139
  }),
});

export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  ink: "#FFFFFF",
  accent: ACCENT,
  backgroundBase: KRAFT_BASE,
  backgroundSrc: KRAFT_SRC,
  backgroundBlur: KRAFT_BLUR,
  backgroundDim: KRAFT_DIM,
  parallax: 0.15,
  shadowY: SHADOW_Y,
  shadowBlur: SHADOW_BLUR,
  shadowOpacity: SHADOW_OPACITY,
  iconShadowY: ICON_SHADOW_Y,
  iconShadowBlur: ICON_SHADOW_BLUR,
  iconShadowOpacity: ICON_SHADOW_OPACITY,
  vignette: 0.55,
  beats: BEATS,
});

// A lab's mark as a house tile: the white squircle with the tile gradient and
// TILE_SHADOW, and the brand mark KNOCKED OUT of it so the kraft shows through
// — the D1Mark / CompanyCard recipe, on the 24-unit box `brandGlyphs.tsx`
// documents. Uniform scale: `glyphFraction` of the tile, about the box centre.
const MarkTile: React.FC<{
  lab: Lab;
  x: number;
  y: number;
  k: number;
  scale: number;
}> = ({ lab, x, y, k, scale }) => {
  const size = MARK_SIZE;
  const tile = squirclePath(size, size, SQUIRCLE_RATIO, SQUIRCLE_SMOOTH);
  const g = size * lab.glyphFraction;
  const s = g / 24;
  const o = (size - g) / 2;
  const id = `lb-${lab.key}`;
  return (
    <g
      transform={`translate(${x} ${y}) scale(${scale.toFixed(4)}) translate(${-size / 2} ${-size / 2})`}
      style={{ filter: TILE_SHADOW(k * scale) }}
    >
      <defs>
        <mask id={id} maskUnits="userSpaceOnUse" x={0} y={0} width={size} height={size}>
          <rect width={size} height={size} fill="#fff" />
          <g transform={`translate(${o} ${o}) scale(${s})`} fill="#000">
            {lab.glyph.paths.map((d, i) => (
              <path key={i} d={d} fillRule="evenodd" />
            ))}
          </g>
        </mask>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={TILE_GRAD_TOP} />
          <stop offset="100%" stopColor={TILE_GRAD_BOTTOM} />
        </linearGradient>
      </defs>
      <path d={tile} fill={`url(#${id}-g)`} mask={`url(#${id})`} />
    </g>
  );
};

const Leaderboard: React.FC<Props> = ({
  ink,
  accent,
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
  vignette,
}) => {
  const frame = useCurrentFrame();

  const cam = camAt(frame);
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = cam.cx + drift.dx;
  const k = cam.k;
  const { tx: wx, ty: wy } = worldTransform(cx, cy, k);
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);

  const lead = leaderAt(frame);
  const tracks = LABS.map((lab) => trackAt(lab, frame));
  const pathOf = (i: number) => {
    const t = tracks[i];
    const pts = [...t.verts, t.head];
    return pts.map((p, j) => `${j === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ");
  };
  // The leader is drawn LAST so the amber passes OVER the line it is crossing:
  // the crossing frame is the event, and the amber has to win the pixel.
  const order = [0, 1, 2].filter((i) => i !== lead).concat(lead >= 0 ? [lead] : []);

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <KraftBackground
        frame={frame}
        cy={cy}
        cyRest={CAM_CY[0]}
        cx={cx}
        cxRest={CX_TIGHT}
        k={k}
        parallax={parallax}
      />

      <AbsoluteFill
        style={{
          filter: `drop-shadow(0 ${shadowY}px ${shadowBlur}px rgba(0,0,0,${shadowOpacity}))`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: WORLD_W,
            height: WORLD_H,
            transformOrigin: "0 0",
            transform: `translate(${wx}px, ${wy}px) scale(${k})`,
          }}
        >
          <svg
            width={WORLD_W}
            height={WORLD_H}
            viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          >
            {/* the axes: two rules, four ticks, no numbers, no grid, no box */}
            <g style={{ filter: icon }} stroke={ink} strokeOpacity={AXIS_OP} strokeWidth={STROKE} strokeLinecap="butt">
              <line x1={AX_X} y1={OY} x2={AX_X} y2={AX_TOP} />
              <line x1={AX_X} y1={OY} x2={AX_RIGHT} y2={OY} />
              {Y_TICKS.map((y) => (
                <line key={`yt${y}`} x1={AX_X} y1={y} x2={AX_X - TICK} y2={y} />
              ))}
              {X_TICKS.map((x) => (
                <line key={`xt${x}`} x1={x} y1={OY} x2={x} y2={OY + TICK} />
              ))}
            </g>

            {/* the three score lines. One stroke weight; the WHOLE line of
                whichever lab is currently highest is accent, the other two ink.
                The hand-over is a hard switch on the crossing frame. */}
            {order.map((i) => {
              const lab = LABS[i];
              if (!tracks[i].live) return null;
              return (
                <g key={`line-${lab.key}`} style={{ filter: icon }}>
                  <path
                    d={pathOf(i)}
                    fill="none"
                    stroke={lead === i ? accent : ink}
                    strokeWidth={STROKE}
                    strokeLinejoin="miter"
                    strokeLinecap="butt"
                  />
                </g>
              );
            })}

            {/* the tiles ride the tips: the vertical order IS the leaderboard */}
            {LABS.map((lab, i) => {
              const t = tracks[i];
              if (!t.live) return null;
              const inScale =
                TILE_FROM + (1 - TILE_FROM) * smoothstep((frame - lab.launch) / TILE_IN);
              const s = SWAY_AMP * Math.sin((frame / SWAY_PERIOD[i]) * 2 * Math.PI + i * 2.1);
              return (
                <MarkTile
                  key={`tile-${lab.key}`}
                  lab={lab}
                  x={t.head.x + s * 0.4}
                  y={t.head.y - TILE_LIFT + s}
                  k={k}
                  scale={inScale}
                />
              );
            })}
          </svg>
        </div>
      </AbsoluteFill>

      <Vignette strength={vignette} />
    </AbsoluteFill>
  );
};

export default Leaderboard;

// ---------------------------------------------------------------------------
// The joins the cut rests on, asserted so a change to a step cannot quietly
// move a swap off its word, let a lab run away with it, or put a line back on
// the x-axis.
// ---------------------------------------------------------------------------
const swapFrames = (() => {
  const out: { f: number; to: string }[] = [];
  let prev = leaderAt(0);
  for (let f = 0.05; f <= DURATION; f += 0.05) {
    const l = leaderAt(f);
    if (l !== prev && l >= 0) {
      out.push({ f: Number(f.toFixed(2)), to: LABS[l].key });
      prev = l;
    } else if (l !== prev) prev = l;
  }
  return out;
})();
export const SWAPS = swapFrames;

// Swap 1 hands the lead to Google just ahead of "whose" (f64); swap 2 to
// Anthropic just ahead of "better" (f90); swap 3 back to OpenAI just ahead of
// "leaderboard" (f105). The house rule is 0-10 frames ahead of the word.
const wantSwaps: { to: string; word: number }[] = [
  { to: "GOOGLE", word: BEATS.whose },
  { to: "ANTHROPIC", word: BEATS.better },
  { to: "OPENAI", word: BEATS.leaderboard },
];
const realSwaps = SWAPS.filter((s) => s.f > 20);
wantSwaps.forEach((w, i) => {
  const s = realSwaps[i];
  if (!s || s.to !== w.to) {
    throw new Error(
      `Leaderboard: swap ${i + 1} should hand the lead to ${w.to}; got ${s ? `${s.to} on f${s.f}` : "nothing"} (all: ${JSON.stringify(SWAPS)})`,
    );
  }
  const lead = w.word - s.f;
  if (lead < 0 || lead > 10) {
    throw new Error(
      `Leaderboard: swap ${i + 1} on f${s.f} does not land 0-10 frames ahead of its word (f${w.word})`,
    );
  }
});
// CHANGE 1: exactly one line is amber on every frame from OpenAI's launch on.
for (let f = LABS[0].launch; f <= DURATION; f++) {
  if (leaderAt(f) < 0) {
    throw new Error(`Leaderboard: no line is amber on f${f}; one has to be, from f${LABS[0].launch}`);
  }
}
// CHANGE 2: every lab's first leg is a RISE, and no segment of any line lies on
// the x-axis further than 20 world px from the origin.
LABS.forEach((lab) => {
  if (lab.legs[0].kind !== "rise") {
    throw new Error(`Leaderboard: ${lab.key} launches with a ${lab.legs[0].kind}; every line launches with a rise`);
  }
  const t = trackAt(lab, DURATION);
  const pts = [...t.verts, t.head];
  for (let j = 1; j < pts.length; j++) {
    const a = pts[j - 1];
    const b = pts[j];
    if (Math.abs(a.y - OY) < 1 && Math.abs(b.y - OY) < 1 && Math.max(a.x, b.x) - OX > 20) {
      throw new Error(
        `Leaderboard: ${lab.key} has a segment lying on the x-axis out to ${(Math.max(a.x, b.x) - OX).toFixed(1)} world px from the origin`,
      );
    }
  }
});
// The tail is a close battle: no line runs away from the other two. The bound is
// 144 rather than 96 because a step is itself 40-176 px tall — while one lab is
// halfway up a step the three cannot be inside 96 — and the SETTLED spread,
// which is what the eye reads, is held under 96 (74 on the last frame). Both
// bounds are V1's (90 / 60) scaled by the same 1.6 the chart grew by.
for (let f = CAM_F1; f <= DURATION; f++) {
  const hs = LABS.map((l) => heightAt(l, f));
  const spread = Math.max(...hs) - Math.min(...hs);
  if (spread > 144) {
    throw new Error(`Leaderboard: the tips are ${spread.toFixed(1)} px apart on f${f}; the tail holds them inside 144`);
  }
}
{
  const hs = LABS.map((l) => heightAt(l, DURATION));
  const spread = Math.max(...hs) - Math.min(...hs);
  if (spread > 96) {
    throw new Error(`Leaderboard: the resolved tips are ${spread.toFixed(1)} px apart; the last frame holds them inside 96`);
  }
}
// Nothing is static: every live tip is moving at every frame, and no tip ever
// crawls for two frames together (which is what a corner would do if a run
// eased in).
for (let f = 1; f <= DURATION; f++) {
  LABS.forEach((lab) => {
    if (f <= lab.launch + 1) return;
    const a = trackAt(lab, f - 1).head;
    const b = trackAt(lab, f).head;
    if (Math.hypot(b.x - a.x, b.y - a.y) < 0.6) {
      throw new Error(`Leaderboard: ${lab.key}'s tip is static on f${f}`);
    }
  });
}
