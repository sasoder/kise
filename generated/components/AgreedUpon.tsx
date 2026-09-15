import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  CAM_LIFT,
  ICON_SHADOW_BLUR,
  ICON_SHADOW_OPACITY,
  ICON_SHADOW_Y,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  camEase,
  camMove,
  clamp01,
  makeTone,
  runCamera,
  sway,
  worldTransform,
} from "./fieldShared";
import { KRAFT_BASE, KraftBackground } from "./d1Shared";
import {
  BOARD_ANCHOR,
  BOARD_H,
  BOARD_W,
  BOARD_X_FINAL,
  BOARD_Y_FINAL,
  BRET_ASPECT,
  BRET_BOX_CX,
  BRET_H,
  BRET_HEAD,
  BRET_HEAD_Y,
  BRET_INK_X0,
  BRET_INK_X1,
  BRET_INK_Y0,
  BRET_INK_Y1,
  BRET_FOOT,
  BRET_W,
  BRET_X,
  BoardBench,
  K_FINAL,
  LABEL_GAP,
  LABEL_LINE,
  LABEL_OP,
  Portrait,
  SAM_ANCHOR,
  SAM_ASPECT,
  SAM_H,
  SAM_INK_X0,
  SAM_VIS_X1,
  SAM_INK_Y0,
  SAM_VIS_Y1,
  SAM_W,
  SAM_X_FINAL,
  SAM_Y_FINAL,
  Thread,
  WORLD_H,
  WORLD_W,
  bretEntry,
  chestAim,
} from "./bretShared";

// ---------------------------------------------------------------------------
// "agreed upon to help mediate" — V2. Cheeky Pint style on kraft, opaque
// cutaway, 24fps, 1080x1920. Bret Taylor on the weekend the OpenAI board fired
// Sam Altman (Nov 2023). V2 supersedes V1: same concept, same gesture list,
// same material, same one ink click — laid out as a TRIANGLE instead of a row,
// with feathered cutouts and a clean photograph of Bret.
//
// THE LINE (SRT 11.859 -> 19.539):
//   "basically my understanding was I was the person that both the existing
//    board and Sam agreed upon to kind of help mediate the situation"
//
// DURATION = round((19.539 - 11.859) * 24) = round(7.680 * 24) = round(184.3)
// = 184 frames of speech, plus a 16-frame tail so the resolved picture holds
// = 200.
//
// WORD ONSETS (frames from the composition start, = 11.859 s)
//   f0 basically · f15 my · f18 understanding · f28 was · f36 I · f40 was ·
//   f45 the · f49 person · f58 that · f63 both · f71 the · f78 existing ·
//   f98 board · f106 and · f110 Sam · f117 agreed · f125 upon · f133 to ·
//   f142 kind · f148 of · f152 help · f156 mediate · f166 the · f170 situation
//   · speech ends f184 · tail to f200.
//
// THE CLIP'S ONE VISUAL RULE: MANY CONVERGE ON ONE POINT, AND AMBER IS THAT
// POINT. Here two sides converge on Bret: the existing board (a bench of three
// knocked out of one house tile) UPPER-LEFT, Sam UPPER-RIGHT, Bret LOW and
// CENTRE, and two amber threads that come down to him and pull them both in.
//
// ---------------------------------------------------------------------------
// EVERY GESTURE, WITH THE WORD IT SERVES AND THE FRAME IT RUNS ON
//
//   1. THE CREEP-IN            f0 -> f46     "basically my understanding was I
//                                             was the person"
//      The dull part. The camera is TIGHT on Bret's face (k K_TIGHT) and creeps
//      in to K_TIGHT_END over the whole 46 frames — a hold that is never still.
//      The framing is solved, not chosen: the frame's bottom edge sits 25 world
//      px under his chin, so his collar is out of frame and his name is out of
//      frame, and there is nothing in the shot but his face. The board and Sam
//      are already standing at their START positions and are OUT of the frame
//      at this k: the frame's top edge is at world y 753 at f0, the bench's
//      contact shadow bottoms out at 708, and Sam's box bottom is 776 — only
//      his last 6% is below the edge, and the foot ramp has already taken that
//      to nothing. The creep only tightens, so both stay out for all 46 frames.
//      Nothing else happens, because nothing in those words happens.
//
//   2. THE PULL-BACK           f46 -> f92    lands ahead of "board" (f98)
//      The ONE big camera move: k K_TIGHT_END -> K_WIDE while the content
//      centre travels from Bret's face (C_TIGHT) to the triad's (C_WIDE), one
//      `camMove` on warp CAM_WARP, damped by `runCamera`. V1's pull-back was
//      visibly over by ~f78, 20 frames before its word, and the reason is that
//      `camMove` eases k LINEARLY: over a 5.5x pull-back a straight ease spends
//      its first half going 5.45 -> 3.2, which is only a 1.7x change on screen,
//      and its second half going 3.2 -> 1.0, which is 3.2x — so the move looks
//      like it happens all at once and then stops. CAM_WARP 0.62 front-loads k
//      until the SCALE moves at an even rate (5.45 -> 2.3 -> 1.0, 2.4x then
//      2.3x), which is what makes it still be moving at its last frame. warp >
//      0.5 keeps zero slope at both ends, so the damper never sees a step. The
//      window is 46 frames rather than the brief's 40 for one measured reason:
//      the house speed cap. At 40 frames the fastest thing on screen — his name
//      label, sweeping out of the bottom edge around f70 — crosses 54 screen px
//      in a frame against a cap of 45. At f46-f92 it is 42, and the scale is
//      still visibly moving at f92: it stops at f97, a frame before "board".
//      "existing board" (f78-98) and "Sam" (f110) are READ as the camera
//      reveals them mid-drift — nothing pops, nothing fades in, ever.
//
//   3. THE DRIFT APART         f60 -> f125   "both the existing board and Sam"
//      The situation pulling apart: each side travels START -> APART, outward
//      AND slightly upward, one slow flow-eased travel (smoothstep, zero slope
//      at both ends, no acceleration bump). Both go out 50 world px — the bench
//      up 45, Sam up 30 — at under 1.5 world px a frame; the camera gives way
//      with them (4).
//
//   4. THE FRAME GIVES WAY     f92 -> f132   under the drift
//      k K_WIDE -> K_SPREAD (-4%) and the content centre lifting with the two
//      rising sides. Not a move, a breath: the frame opening as they keep
//      separating, so the long hold on the camera is never a parked camera.
//      The pull-back therefore stops a little short of the widest the cut ever
//      goes, and the last of the opening belongs to the drift rather than to
//      the camera — which is also what takes the pull-back's peak speed under
//      the cap.
//
//   5. THE THREADS             f112 -> f124  "agreed upon" (f117 / f125)
//      Two threads draw TIP-FIRST from their source DOWN toward Bret — the
//      mechanism reaching him. The bench launches at f112 from its bottom-right
//      corner and arrives f119, Sam at f116 off his lower-left shoulder and
//      arrives f124, each on a flow ease. The left thread aims at Bret's LEFT
//      outline and the right one at his RIGHT, so the two come down either side
//      of his head; each stops THREAD_BITE px inside him, at the point
//      `bretEntry` finds by walking the line against his measured silhouette.
//      They are amber from the first frame; never idle, so ACCENT_DEEP is
//      unused.
//
//   6. THE INK CLICK           f124 -> f127  ahead of "upon" (f125)
//      When the SECOND thread lands, Bret's name label clicks ink 0.55 ->
//      ACCENT 1.0 over 3 frames. The ONE single-object ink click of the cut:
//      Bret is the agreed point. Nothing else changes colour, ever.
//
//   7. THE SLACK TAKEN UP      f126 -> f150  "to kind of"
//      The threads are on him, so the sides stop drifting and creep SLACK px
//      back along the line they will be pulled down. Small, continuous, and it
//      is the same motion as (8) already starting — it is what keeps the words
//      between "upon" and "help" alive without inventing a gesture for them.
//
//   8. THE PULL IN             f150 -> f168  "help mediate" (f152 / f156)
//      The drift REVERSES: the threads pull both sides in and DOWN toward Bret,
//      to BOARD_*_FINAL / SAM_*_FINAL — 70 px in and 15 / 80 px down — visibly
//      moving on "mediate" and settled
//      by f168, with a PULL_OVER-px zero-sloped settle bump to f180 (a
//      back(0.75) landing written as sin^2, so the damper never sees a step).
//      At rest, to within 0.6 px, by f178.
//
//   9. THE CAMERA REACTS       f152 -> f170  two frames after (8) starts
//      A gentle tighten k K_SPREAD -> K_FINAL, and the content centre settling
//      back down with the two sides. It follows the pull-in rather than leading
//      it. No held breath is spent: the long still stretch in (4) is already
//      the cut's one breath.
//
//  10. THE HOLD, ALIVE         f180 -> f200  "the situation", then the tail
//      Resolved, never faded. The threads strain — a 1.6 px sag on a 40-frame
//      period, zero-valued and zero-sloped where it starts — the three pieces
//      carry their own slow sway, and the camera rides `sway`.
//
// Nothing else. No springs, no flashes, no ripples, no rims, no glyph
// breathing, no wash on the sides.
//
// ---------------------------------------------------------------------------
// DEVIATIONS FROM THE BRIEF, and why each one is forced by the brief's own
// rules (the padding box with 30-60 px of air, the world band, "every piece of
// ink inside", and "the sides are out of frame at the tight k"):
//
//   * THE CAST IS SIZED BY ITS HEADS, NOT BY THE BRIEF'S BOX HEIGHTS. The two
//     photographs are framed differently — Bret's head is 63% of his crop, Sam's
//     68% — so "Bret 480 tall, Sam 400 tall" would put Sam's head BIGGER than
//     Bret's. The cut asks for a head size instead (BRET_HEAD 290 world px, Sam
//     0.82 of it) and the boxes follow: Bret 464 x 500, Sam 351 x 365. That is
//     the brief's 480 / 400 to within the difference in framing, and it is the
//     growth the brief asked for measured where it counts: Bret's head goes 187
//     -> 319 screen px, x1.7.
//
//   * THE TRIANGLE IS TALLER AND NARROWER THAN THE BRIEF'S NUMBERS. Laid out
//     exactly as written — bench (330, 640-700), Sam (800, 640-700), Bret's
//     shadow at 1180 — the picture is 750 world px wide and 695 tall, so the
//     WIDTH binds against the padding box and 300 px of the 1050-px-tall box go
//     unused. Bret's foot goes to 1210 and the two sides up to 615 / 650
//     instead, which is the same triangle stretched to the shape of the box:
//     the resolved ink now measures 752 x 874 SCREEN px inside x 120-960 /
//     y 300-1350, against V1's 810 x 390.
//
//   * THE WHOLE TRIANGLE SITS ~33 PX RIGHT OF THE BRIEF'S, AND THE LAYOUT IS
//     SOLVED AGAINST WHAT READS, NOT AGAINST ALPHA. The brief's x numbers put
//     the picture's centre left of Bret's face, and Sam's foot ramp has a long
//     10-40%-alpha tail that neither au-band.py nor the eye sees against kraft
//     (SAM_VIS_X1). Solved against the visible ink and shifted to centre on his
//     face, the resolved frame measures x 162..914 — 42 px of air left, 46
//     right, both inside the brief's 30-60. The camera still never pans: cx is
//     540 on all 200 frames.
//
//   * THE SIDES START HIGHER AND CLOSER THAN THE BRIEF'S 690, AND BOTH DRIFT
//     50 PX RATHER THAN 60 / 70. At the tight k the frame's top edge is at
//     world y 753, so anything below it is IN the opening shot; the bench
//     starts at y 645 (its shadow bottoms at 708) and Sam at 600 (his box
//     bottom is 776, and the last 6% of him is already ramped to nothing).
//     Equal 50-px drifts out and equal 70-px draws in are what keep the picture
//     centred on his face at all three keys, which is worth more than the
//     brief's unequal 60 / 70.
//
//   * THE RESOLVED k IS K_FINAL 1.10 AND THE WIDE k IS 1.00, not V1's 1.02 /
//     0.90. Both are solved. At rest the visible ink runs world 198 -> 882
//     about a camera at cx 540, so k must be <= 780/684 = 1.14 to leave 30 px
//     of air with `sway` at full throw; 1.10 leaves 42 / 46, measured off the
//     render. At the top of the drift K_SPREAD 0.96 holds the ink inside the
//     same box with 25 px to spare on each side.
//
//   * THE TIGHT k IS 5.20, not V1's 3.53, AND THE CLOSE-UP IS SOFT. Three
//     things pin it: the brief wants the chin near the bottom of the frame with
//     the collar out, and his collar is only 55 world px below his chin, so the
//     frame's foot has to fall between them; and Sam's near shoulder has to be
//     outside the frame's right edge at f0. Both hold from 5.15 up. At 5.20 his
//     head is 1508 screen px tall — and the Commons original is 2048 px wide
//     with his head 197 px in it, so the opening runs at about a 7x upscale.
//     LANCZOS plus a light unsharp mask is baked into the PNG and it reads as a
//     shallow-focus stage photograph; that is the price of the framing the
//     brief asks for, and it is sharp from the frame the pull-back starts.
//
//   * THE THREADS AIM AT HIS OUTLINE, NOT AT ONE CHEST POINT. V1's sides stood
//     beside him, so both threads could aim at one point and be clipped by a
//     single measured row. In the triangle they come down at a steep angle and
//     a thread aimed at his centre runs straight through his face, so the left
//     one aims at his left outline and the right one at his right, and each is
//     clipped where it actually meets him — `bretEntry` walks the line against
//     BRET_SIL and stops THREAD_BITE px inside.
//
//   * THE PORTRAITS ARE HTML, NOT SVG (unchanged from V1). An SVG <image> on a
//     staticFile races frame capture and flashes (MEMORY); Remotion's <Img>
//     holds the frame until the bitmap is decoded. The portrait layer carries
//     the identical world transform, so a world px is a world px in both
//     layers, and the threads (SVG, above) land exactly where the geometry says.
//     The feather is baked into the PNG for the same reason — and so is the
//     de-fringing of rembg's matte (the pink step-and-repeat and the green
//     TechCrunch word on it were a visible coloured ring at 5x) and a mild
//     pull of the magenta out of his dark pixels (the pink stage light left his
//     hair reading purple in the close-up; skin and sweater are untouched).
// ---------------------------------------------------------------------------

export const FPS = 24;
export const DURATION = 200;

// -- the padding contract ---------------------------------------------------
// On the resolved frame (f178+) every piece of ink sits inside this box, with
// PAD_AIR_MIN..PAD_AIR_MAX px of kraft between the ink and its left/right edge.
export const PAD_X0 = 120;
export const PAD_X1 = 960;
export const PAD_Y0 = 300;
export const PAD_Y1 = 1350;
export const PAD_AIR_MIN = 30;
export const PAD_AIR_MAX = 60;

// -- the beat table ---------------------------------------------------------
export const BEATS = {
  basically: 0,
  my: 15,
  understanding: 18,
  was: 28,
  i: 36,
  wasTwo: 40,
  the: 45,
  person: 49,
  that: 58,
  both: 63,
  theTwo: 71,
  existing: 78,
  board: 98,
  and: 106,
  sam: 110,
  agreed: 117,
  upon: 125,
  to: 133,
  kind: 142,
  of: 148,
  help: 152,
  mediate: 156,
  theThree: 166,
  situation: 170,
  end: 184,
} as const;

// -- the two sides' track ---------------------------------------------------
// One continuous piecewise track per side, now in TWO dimensions: the triangle
// moves out-and-up and then in-and-down. Every segment is `camEase`, which is a
// smoothstep of a warped u — zero slope at BOTH ends for warp > 0.5, so the
// joins are C1 and the velocity scan sees no step at any of them.
export type P = { x: number; y: number };
export const BOARD_START: P = { x: 343.35, y: 645 };
export const BOARD_APART: P = { x: 293.35, y: 600 };
export const BOARD_FINAL: P = { x: BOARD_X_FINAL, y: BOARD_Y_FINAL };
export const SAM_START: P = { x: 773.35, y: 600 };
export const SAM_APART: P = { x: 823.35, y: 570 };
export const SAM_FINAL: P = { x: SAM_X_FINAL, y: SAM_Y_FINAL };

export const SLACK = 4; // px each side creeps back when its thread lands
export const PULL_OVER = 2.5; // the settle past the landing, zero-sloped

export const F_DRIFT0 = 60;
export const F_DRIFT1 = 125;
export const F_SLACK1 = 150;
export const F_PULL0 = 150;
export const F_PULL1 = 168;
export const F_SETTLE1 = 180;

export const travel = (f: number, f0: number, f1: number, a: number, b: number, warp = 1) => {
  if (f <= f0) return a;
  if (f >= f1) return b;
  return a + (b - a) * camEase((f - f0) / (f1 - f0), warp);
};

const unit = (a: P, b: P) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const l = Math.hypot(dx, dy) || 1;
  return { x: dx / l, y: dy / l };
};

// `start -> apart -> (slack) -> final`, plus the zero-sloped landing settle.
export const sideAt = (f: number, start: P, apart: P, final: P): P => {
  const u = unit(apart, final);
  const slack: P = { x: apart.x + u.x * SLACK, y: apart.y + u.y * SLACK };
  let x: number;
  let y: number;
  if (f <= F_DRIFT1) {
    x = travel(f, F_DRIFT0, F_DRIFT1, start.x, apart.x);
    y = travel(f, F_DRIFT0, F_DRIFT1, start.y, apart.y);
  } else if (f <= F_SLACK1) {
    x = travel(f, F_DRIFT1, F_SLACK1, apart.x, slack.x);
    y = travel(f, F_DRIFT1, F_SLACK1, apart.y, slack.y);
  } else {
    x = travel(f, F_PULL0, F_PULL1, slack.x, final.x);
    y = travel(f, F_PULL0, F_PULL1, slack.y, final.y);
  }
  // the landing settle: PULL_OVER px past the final position and back, along
  // the line it arrived on, as sin^2 over F_PULL1..F_SETTLE1 — zero value AND
  // zero slope at both ends.
  if (f > F_PULL1 && f < F_SETTLE1) {
    const s = Math.sin((Math.PI * (f - F_PULL1)) / (F_SETTLE1 - F_PULL1));
    x += u.x * PULL_OVER * s * s;
    y += u.y * PULL_OVER * s * s;
  }
  return { x, y };
};

// The slow life every standing thing carries, so a hold is never a freeze.
export const objectSway = (f: number, seed: number) => ({
  dx: 1.2 * Math.sin(f / 29 + seed),
  dy: 0.7 * Math.sin(f / 23 + seed * 1.7),
});

// -- the threads ------------------------------------------------------------
export const F_THREAD_BOARD = 112;
export const F_THREAD_SAM = 116;
export const THREAD_DRAW_BOARD = 7; // arrives f119
export const THREAD_DRAW_SAM = 8; // arrives f124, ahead of "upon" (f125)
export const F_LAND = F_THREAD_SAM + THREAD_DRAW_SAM; // 124
export const CLICK_FADE = 3; // the ink click's cross, in frames
export const SAG_AMP = 1.6;
export const SAG_PERIOD = 40;
export const threadSag = (f: number) => {
  if (f <= F_LAND + 2) return 0;
  const t = f - (F_LAND + 2);
  return SAG_AMP * 0.5 * (1 - Math.cos((2 * Math.PI * t) / SAG_PERIOD));
};

// -- the camera -------------------------------------------------------------
// One damped curve. Five authored segments, every one a key-per-frame `camMove`
// so the damper never sees a corner: creep in, the one big pull-back, the frame
// giving way under the drift, a hold, and the tighten that reacts to the
// pull-in. cx never moves: Bret's face and the resolved picture share x 540.
export const K_TIGHT = 5.2;
export const K_TIGHT_END = 5.45;
export const K_WIDE = 1.0;
export const K_SPREAD = 0.96;
export const C_TIGHT = 913; // content centre of the close-up: 25 px under his chin is the frame's foot
export const C_WIDE = 852;
export const C_SPREAD = 845;
export const C_FINAL = 894;
export const CAM_WARP = 0.62;
export const CAM_PULL0 = 46;
export const CAM_PULL1 = 92;
export const CAM_SPREAD0 = 92;
export const CAM_SPREAD1 = 132;
export const CAM_TIGHTEN0 = 152;
export const CAM_TIGHTEN1 = 170;
export const CX = 540; // constant for all 200 frames — the cut never pans

const CAM_TRACK = (() => {
  const F: number[] = [];
  const K: number[] = [];
  const CY: number[] = [];
  const push = (m: { F: number[]; K: number[]; CY: number[] }) => {
    m.F.forEach((f, i) => {
      if (F.length && F[F.length - 1] === f) return; // segments share their join frame
      F.push(f);
      K.push(m.K[i]);
      CY.push(m.CY[i]);
    });
  };
  push(camMove({ f0: 0, f1: CAM_PULL0, k0: K_TIGHT, k1: K_TIGHT_END, c0: C_TIGHT, c1: C_TIGHT }));
  push(camMove({ f0: CAM_PULL0, f1: CAM_PULL1, k0: K_TIGHT_END, k1: K_WIDE, c0: C_TIGHT, c1: C_WIDE, warp: CAM_WARP }));
  push(camMove({ f0: CAM_SPREAD0, f1: CAM_SPREAD1, k0: K_WIDE, k1: K_SPREAD, c0: C_WIDE, c1: C_SPREAD }));
  push(camMove({ f0: CAM_SPREAD1, f1: CAM_TIGHTEN0, k0: K_SPREAD, k1: K_SPREAD, c0: C_SPREAD, c1: C_SPREAD }));
  push(camMove({ f0: CAM_TIGHTEN0, f1: CAM_TIGHTEN1, k0: K_SPREAD, k1: K_FINAL, c0: C_SPREAD, c1: C_FINAL, warp: 0.8 }));
  F.push(DURATION);
  K.push(K_FINAL);
  CY.push(C_FINAL + CAM_LIFT / K_FINAL);
  return { F, K, CY };
})();
export const CAM_F = CAM_TRACK.F;
export const CAM_K = CAM_TRACK.K;
export const CAM_CY = CAM_TRACK.CY;
export const camAt = (f: number) => runCamera(f, CAM_F, CAM_CY, CAM_K);

export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  accentDeep: z.string(), // never used here: a thread in this cut is never idle
  backgroundBase: z.string(),
  parallax: z.number(),
  shadowY: z.number(),
  shadowBlur: z.number(),
  shadowOpacity: z.number(),
  iconShadowY: z.number(),
  iconShadowBlur: z.number(),
  iconShadowOpacity: z.number(),
  // the two cutouts, as public/ paths, so the user can swap in their own
  bretSrc: z.string(),
  samSrc: z.string(),
  bretLabel: z.string(),
  samLabel: z.string(),
  beats: z.object({
    basically: z.number(),
    my: z.number(),
    understanding: z.number(),
    was: z.number(),
    i: z.number(),
    wasTwo: z.number(),
    the: z.number(),
    person: z.number(),
    that: z.number(),
    both: z.number(),
    theTwo: z.number(),
    existing: z.number(), // the bench is read mid-drift as the camera opens
    board: z.number(),
    and: z.number(),
    sam: z.number(), // Sam is read the same way
    agreed: z.number(), // the threads are drawing
    upon: z.number(), // the ink click lands one frame ahead of it
    to: z.number(),
    kind: z.number(),
    of: z.number(),
    help: z.number(), // the pull-in is under way
    mediate: z.number(), // the sides are visibly moving inward
    theThree: z.number(),
    situation: z.number(), // settled, holding, alive
    end: z.number(),
  }),
});

export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  ink: "#FFFFFF",
  accent: ACCENT,
  accentDeep: ACCENT_DEEP,
  backgroundBase: KRAFT_BASE,
  parallax: 0.15,
  shadowY: SHADOW_Y,
  shadowBlur: SHADOW_BLUR,
  shadowOpacity: SHADOW_OPACITY,
  iconShadowY: ICON_SHADOW_Y,
  iconShadowBlur: ICON_SHADOW_BLUR,
  iconShadowOpacity: ICON_SHADOW_OPACITY,
  bretSrc: "heads/bret.png",
  samSrc: "heads/sam.png",
  bretLabel: "Bret Taylor",
  samLabel: "Sam Altman",
  beats: BEATS,
});

const AgreedUpon: React.FC<Props> = ({
  ink,
  accent,
  backgroundBase,
  parallax,
  shadowY,
  shadowBlur,
  shadowOpacity,
  bretSrc,
  samSrc,
  bretLabel,
  samLabel,
}) => {
  const frame = useCurrentFrame();

  // -- the camera -----------------------------------------------------------
  const cam = camAt(frame);
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = CX + drift.dx;
  const k = cam.k;
  const { tx: wx, ty: wy } = worldTransform(cx, cy, k);
  const worldStyle: React.CSSProperties = {
    position: "absolute",
    left: 0,
    top: 0,
    width: WORLD_W,
    height: WORLD_H,
    transformOrigin: "0 0",
    transform: `translate(${wx}px, ${wy}px) scale(${k})`,
  };

  // -- the cast -------------------------------------------------------------
  const boardSway = objectSway(frame, 1.7);
  const samSway = objectSway(frame, 4.1);
  const bretSway = objectSway(frame, 2.6);
  const boardP = sideAt(frame, BOARD_START, BOARD_APART, BOARD_FINAL);
  const samP = sideAt(frame, SAM_START, SAM_APART, SAM_FINAL);
  const board = { x: boardP.x + boardSway.dx, y: boardP.y + boardSway.dy };
  const sam = { x: samP.x + samSway.dx, y: samP.y + samSway.dy };
  const bretBoxCx = BRET_BOX_CX + bretSway.dx * 0.5;
  const bretFoot = BRET_FOOT + bretSway.dy * 0.5;
  const bretBoxTop = bretFoot - BRET_H;
  const bretBoxLeft = bretBoxCx - BRET_W / 2;

  // -- the threads ----------------------------------------------------------
  const boardFrom = BOARD_ANCHOR(board.x, board.y);
  const samFrom = SAM_ANCHOR(sam.x, sam.y);
  const aimL = chestAim(bretBoxCx, bretBoxTop, true);
  const aimR = chestAim(bretBoxCx, bretBoxTop, false);
  const reachBoard = camEase(clamp01((frame - F_THREAD_BOARD) / THREAD_DRAW_BOARD), 0.8);
  const reachSam = camEase(clamp01((frame - F_THREAD_SAM) / THREAD_DRAW_SAM), 0.8);
  const sag = threadSag(frame);

  // -- the one ink click ----------------------------------------------------
  const click = clamp01((frame - F_LAND) / CLICK_FADE);
  const clickTone = makeTone(ink, accent);
  const bretLabelColor = clickTone(click);
  const bretLabelOpacity = LABEL_OP + (1 - LABEL_OP) * click;

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <KraftBackground
        frame={frame}
        cy={cy}
        cyRest={CAM_CY[0]}
        cx={cx}
        cxRest={CX}
        k={k}
        parallax={parallax}
      />

      <AbsoluteFill
        style={{ filter: `drop-shadow(0 ${shadowY}px ${shadowBlur}px rgba(0,0,0,${shadowOpacity}))` }}
      >
        {/* the portraits: HTML, world transform, under the threads */}
        <div style={worldStyle}>
          {/* Sam first: he is the further of the two, so Bret's head covers
              his near shoulder rather than the other way round. */}
          <Portrait
            src={samSrc}
            x={sam.x}
            footY={sam.y + SAM_H / 2}
            height={SAM_H}
            aspect={SAM_ASPECT}
            label={samLabel}
            k={k}
            labelColor={ink}
            labelOpacity={LABEL_OP}
          />
          <Portrait
            src={bretSrc}
            x={bretBoxCx}
            footY={bretFoot}
            height={BRET_H}
            aspect={BRET_ASPECT}
            label={bretLabel}
            labelX={BRET_X + bretSway.dx * 0.5}
            k={k}
            labelColor={bretLabelColor}
            labelOpacity={bretLabelOpacity}
          />
        </div>

        {/* the bench and the threads: SVG, the same world transform */}
        <div style={worldStyle}>
          <svg
            width={WORLD_W}
            height={WORLD_H}
            viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          >
            <BoardBench x={board.x} y={board.y} k={k} />
            <Thread
              from={boardFrom}
              to={aimL}
              reach={reachBoard}
              clip={bretEntry(boardFrom, aimL, bretBoxLeft, bretBoxTop)}
              sag={sag}
              color={accent}
              k={k}
            />
            <Thread
              from={samFrom}
              to={aimR}
              reach={reachSam}
              clip={bretEntry(samFrom, aimR, bretBoxLeft, bretBoxTop)}
              sag={sag}
              color={accent}
              k={k}
            />
          </svg>
        </div>
      </AbsoluteFill>

      <Vignette strength={0.55} />
    </AbsoluteFill>
  );
};

export default AgreedUpon;

// The joins the cut rests on, asserted so a change to a window or an ease
// cannot quietly slide a landing off its word or turn one motion into two.
if (F_LAND > BEATS.upon || BEATS.upon - F_LAND > 10) {
  throw new Error(
    `AgreedUpon: the second thread lands on f${F_LAND}, not just ahead of "upon" (f${BEATS.upon})`,
  );
}
if (F_THREAD_BOARD + THREAD_DRAW_BOARD >= F_LAND) {
  throw new Error("AgreedUpon: the bench's thread must land before Sam's, so the click is the SECOND landing");
}
if (F_PULL0 > BEATS.mediate || F_PULL1 < BEATS.mediate) {
  throw new Error(`AgreedUpon: the pull-in must be running on "mediate" (f${BEATS.mediate})`);
}
if (CAM_TIGHTEN0 - F_PULL0 !== 2) {
  throw new Error("AgreedUpon: the camera must react two frames after the pull-in starts, never lead it");
}
if (CAM_PULL1 > BEATS.board - 4) {
  throw new Error(`AgreedUpon: the pull-back must land ahead of "board" (f${BEATS.board})`);
}
// The resolved picture must fit the padding box at K_FINAL with real air on
// both sides, measured off the analytic ink bbox (the render is measured too —
// see au-band.py). The labels are the only thing here that is not a measured
// rectangle, so they carry a generous half-width.
{
  const LBL_HALF = 82;
  const x0 = Math.min(
    BOARD_X_FINAL - BOARD_W / 2,
    BRET_BOX_CX + (BRET_INK_X0 - 0.5) * BRET_W,
    BRET_X - LBL_HALF,
    SAM_X_FINAL + (SAM_INK_X0 - 0.5) * SAM_W,
    SAM_X_FINAL - LBL_HALF,
  );
  const x1 = Math.max(
    BOARD_X_FINAL + BOARD_W / 2,
    BRET_BOX_CX + (BRET_INK_X1 - 0.5) * BRET_W,
    BRET_X + LBL_HALF,
    SAM_X_FINAL + (SAM_VIS_X1 - 0.5) * SAM_W,
    SAM_X_FINAL + LBL_HALF,
  );
  const y0 = Math.min(
    BOARD_Y_FINAL - BOARD_H / 2,
    BRET_FOOT - BRET_H + BRET_INK_Y0 * BRET_H,
    SAM_Y_FINAL - SAM_H / 2 + SAM_INK_Y0 * SAM_H,
  );
  const y1 = Math.max(
    BRET_FOOT - BRET_H + BRET_INK_Y1 * BRET_H,
    SAM_Y_FINAL - SAM_H / 2 + SAM_VIS_Y1 * SAM_H,
    BRET_FOOT + LABEL_GAP + LABEL_LINE,
    SAM_Y_FINAL + SAM_H / 2 + LABEL_GAP + LABEL_LINE,
  );
  const left = 540 - (CX - x0) * K_FINAL;
  const right = 540 + (x1 - CX) * K_FINAL;
  const top = 960 - CAM_LIFT + (y0 - C_FINAL) * K_FINAL;
  const bottom = 960 - CAM_LIFT + (y1 - C_FINAL) * K_FINAL;
  const airL = left - PAD_X0;
  const airR = PAD_X1 - right;
  if (airL < PAD_AIR_MIN || airR < PAD_AIR_MIN || airL > PAD_AIR_MAX || airR > PAD_AIR_MAX) {
    throw new Error(
      `AgreedUpon: the resolved ink runs screen x ${left.toFixed(1)}..${right.toFixed(1)} — air ${airL.toFixed(
        1,
      )} / ${airR.toFixed(1)}, wanted ${PAD_AIR_MIN}-${PAD_AIR_MAX}`,
    );
  }
  if (top < PAD_Y0 || bottom > PAD_Y1) {
    throw new Error(
      `AgreedUpon: the resolved ink runs screen y ${top.toFixed(1)}..${bottom.toFixed(1)}, outside ${PAD_Y0}..${PAD_Y1}`,
    );
  }
}
// The close-up must be a close-up: his collar below the frame, his head big.
{
  const frameFoot = C_TIGHT + (1920 - (960 - CAM_LIFT)) / K_TIGHT;
  const chinScreen = 960 - CAM_LIFT + (BRET_HEAD_Y + BRET_HEAD / 2 - C_TIGHT) * K_TIGHT;
  if (chinScreen < 1650 || chinScreen > 1880) {
    throw new Error(`AgreedUpon: the opening chin sits at screen y ${chinScreen.toFixed(0)}, not near the frame's foot`);
  }
  if (frameFoot < BRET_HEAD_Y) {
    throw new Error("AgreedUpon: the opening frame must reach past his face");
  }
}
