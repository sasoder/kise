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
  AgreePoint,
  ANCHOR_Y_FINAL,
  BOARD_ANCHOR,
  BOARD_H,
  BOARD_W,
  BRET_ASPECT,
  BRET_CHIN,
  BRET_H,
  BRET_HEAD,
  BRET_HEAD_Y,
  BRET_LABEL_FROM_CHIN,
  BRET_LABEL_GAP,
  BRET_TOP,
  BRET_X,
  BoardBench,
  CX_FINAL,
  CY_FINAL,
  DOT_MINT,
  DOT_R,
  DOT_X,
  DOT_Y,
  D_FINAL,
  K_FINAL,
  LABEL_HALF,
  LABEL_INK_BOT,
  LABEL_OP,
  Portrait,
  SAM_ANCHOR,
  SAM_ASPECT,
  SAM_CHIN_DX,
  SAM_H,
  SAM_LABEL_GAP,
  SAM_LABEL_HALF,
  SAM_LABEL_NUDGE,
  SAM_W,
  Thread,
  WORLD_H,
  WORLD_W,
  anchorToBoardY,
  anchorToSamHeadY,
  dotScale,
} from "./bretShared";

// ---------------------------------------------------------------------------
// "agreed upon to help mediate" — V3b. Cheeky Pint style on kraft, opaque
// cutaway, 24fps, 1080x1920. Bret Taylor on the weekend the OpenAI board fired
// Sam Altman (Nov 2023).
//
// V3b is V3 with the director's note on the V3 preview applied and NOTHING
// else. The duotone heads, the mirror triangle and its tracks, the two threads'
// launch and landing frames, the minted amber dot, the one ink click on Bret's
// label, the camera's shape, the alive hold and the velocity and padding
// discipline are all V3's. THREE THINGS CHANGED:
//
//   1. NO FLOAT AND NO CONTACT SHADOW UNDER EITHER HEAD. V3 lifted each head
//      ~88 px off a thin ellipse so two straight threads could reach a point
//      under Bret's jaw; the ellipse hung under nothing and Sam's read as a
//      stray dash. A head is a cutout, not a thing standing on the ground: it
//      sits exactly on its own alpha and takes only the house TILE_SHADOW. The
//      bench still stands, so the bench keeps its contact shadow.
//
//   2. THE THREADS RUN BEHIND BRET'S HEAD. Both threads and the dot are drawn
//      in a layer BELOW his head and above the kraft, so each one disappears
//      behind his jaw and the V's apex — with the minted dot on it — peeks out
//      12 px under his chin. The head SITS ON the apex of the V. No silhouette
//      routing, no clipping: `bretEntry` and BRET_SIL are V2's business now.
//
//   3. THE LABELS SIT TIGHT UNDER THE HEADS. "Bret Taylor" is centred 30 px
//      below the dot — so the dot sits between his chin and his name — and
//      "Sam Altman" 28 px below Sam's lowest alpha pixel.
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
// CENTRE, and two amber threads that meet at one dot just under his chin.
//
// ---------------------------------------------------------------------------
// EVERY GESTURE, WITH THE WORD IT SERVES AND THE FRAME IT RUNS ON
//
//   1. THE CREEP-IN            f0 -> f40     "basically my understanding was I"
//      The dull part. The camera is TIGHT on Bret's face (k K_TIGHT 5.15, his
//      head 1,751 screen px — 91% of the frame) and creeps in to K_TIGHT_END
//      over the whole 40 frames — a hold that is never still. The framing is
//      solved, not chosen: his hair is cropped 20 px off the top edge and his
//      name sits 27 px below the frame's foot, so there is nothing in the shot
//      but his face. Both sides are standing at their START positions and are
//      OUT of the frame: at f0 the bench's right edge is at screen x -279 and
//      Sam's left edge at 1637, on a 1080-wide frame, and the creep only
//      tightens, so they stay out for all 40 frames. Nothing else happens,
//      because nothing in those words happens.
//
//   2. THE PULL-BACK           f40 -> f94    lands ahead of "board" (f98)
//      The ONE big camera move: k K_TIGHT_END -> K_WIDE while the content
//      centre travels from his face (C_TIGHT) to the triad's (C_WIDE) and cx
//      eases 540 -> CX_FINAL, all on one `camMove` at warp CAM_WARP, damped by
//      `runCamera`. `camMove` eases k LINEARLY, which over a 6x pull-back
//      spends its first half on a small perceived change and its second half on
//      a huge one, so the move looks like it happens at once and then stops.
//      CAM_WARP 0.62 front-loads k until the SCALE moves at an even rate, which
//      is what makes it still be moving at its last frame. warp > 0.5 keeps zero
//      slope at both ends, so the damper never sees a step. "existing board"
//      (f78-98) and "Sam" (f110) are READ as the camera reveals them mid-drift
//      — nothing pops, nothing fades in, ever.
//
//      THE PAN. V2 never panned, and it paid for it: its cast was not
//      symmetric, so it had to be shoved 33 px sideways to centre. V3b's cast IS
//      symmetric about Bret's axis, but the bench (330 wide) reaches further
//      left than Sam's head and his name reach right, so the INK's centre is 7
//      px LEFT of that axis. The camera therefore opens on his face at cx 540
//      and settles at cx CX_FINAL 533 — a 7 px world move, folded into the
//      pull-back's own ease and through the same damper, so it is 0.2 px a frame
//      under a 6x zoom and cannot be seen as a pan. It buys even air: 36 / 36 px
//      analytic, 34 / 38 measured off the render.
//
//   3. THE DRIFT APART         f60 -> f125   "both the existing board and Sam"
//      The situation pulling apart. ONE TRACK, READ TWICE: the two sides are
//      always the same distance `d` from Bret's axis and always at the same
//      anchor height, so they are exact mirrors of each other on every frame.
//      d 324 -> 344 and the anchor 774.8 -> 745.5 — out AND up — one slow
//      flow-eased travel (smoothstep, zero slope at both ends, no acceleration
//      bump), under 1 world px a frame; the camera gives way with them (4).
//
//   4. THE FRAME GIVES WAY     f94 -> f132   under the drift
//      k K_WIDE -> K_SPREAD (-2%) and the content centre lifting with the two
//      rising sides. Not a move, a breath: the frame opening as they keep
//      separating, so the long hold on the camera is never a parked camera.
//
//   5. THE THREADS             f112 -> f122  "agreed" (f117) into "upon" (f125)
//      Both threads launch on the SAME frame, from mirrored sources — the
//      bench's bottom-centre and the point directly under Sam's head — and both
//      run to ONE point: the amber dot under Bret's chin. Same ease, same 10
//      frames, so they LAND TOGETHER on f122. The simultaneous landing is the
//      agreement. They are amber from the first frame; never idle, so
//      ACCENT_DEEP is unused. Geometric, source to dot, so the draw-in shortens
//      them with no second track. They are drawn BELOW his head, so each tip
//      slips behind his cheek around f117 and the apex reappears under his chin
//      at f120.5, a frame and a half before it lands.
//
//   6. THE MINT AND THE CLICK  f122 -> f127  ahead of "upon" (f125)
//      On the landing frame the dot is STRUCK where the two threads meet, just
//      under his chin — the coin recipe, a 5-frame scale-in with a zero-sloped
//      settle past 1 — and Bret's name label clicks ink 0.55 -> ACCENT 1.0 over
//      3 frames. The label is the cut's ONE single-object ink click; the dot is
//      a minted object, not a click. Nothing else changes colour, ever.
//
//   7. THE SLACK TAKEN UP      f125 -> f150  "to kind of"
//      The threads are on him, so the sides stop drifting and creep SLACK px
//      back along the line they will be pulled down. Small, continuous, and it
//      is the same motion as (8) already starting — it is what keeps the words
//      between "upon" and "help" alive without inventing a gesture for them.
//
//   8. THE PULL IN             f150 -> f168  "help mediate" (f152 / f156)
//      The drift REVERSES, mirrored: the threads pull both sides in and DOWN,
//      d 344 -> 303 and the anchor 745.5 -> 792.4, visibly moving on "mediate"
//      and settled by f168 with a PULL_OVER-px zero-sloped settle bump to f180
//      (a back(0.75) landing written as sin^2, so the damper never sees a
//      step). At rest, to within 0.6 px, by f178. Because the threads are
//      geometric they simply get shorter: the V closes on its own point.
//
//   9. THE CAMERA REACTS       f152 -> f170  two frames after (8) starts
//      A gentle tighten k K_SPREAD -> K_FINAL (+4%) and the content centre
//      settling back down with the two sides, then an 8-frame held breath
//      f170 -> f178 before the hold. It follows the pull-in rather than leading
//      it.
//
//  10. THE HOLD, ALIVE         f180 -> f200  "the situation", then the tail
//      Resolved, never faded. The threads strain — a 1.6 px sag on a 40-frame
//      period, zero-valued and zero-sloped where it starts — the three pieces
//      carry their own slow sway (mirrored, so the two sides never break the
//      symmetry), and the camera rides `sway`.
//
// Nothing else. No springs, no flashes, no ripples, no rims, no glyph
// breathing, no wash on the sides.
//
// ---------------------------------------------------------------------------
// DEVIATIONS FROM THE BRIEF, each one forced by the brief's own rules — the
// mirror, the single point, and the padding box with 30-60 px of air:
//
//   * SAM'S NAME IS NUDGED 69 WORLD PX OUTWARD. The brief expected the V3 nudge
//     to become unnecessary once the thread left from under his chin, because
//     the thread runs down-LEFT and the name would be out of its way. It is
//     not, and the geometry says it cannot be: the thread leaves his box centre
//     — which is where a name centred "on his axis" also sits — and only moves
//     0.82 px left for every px down, so over the label's own band it has
//     travelled 23 to 56 px left of his axis while the name reaches 82 px
//     either side of it. Rendered with the nudge at 0 (au3b/nudge0_f199.png) the
//     thread runs through the first letters of "Sam" and comes within ONE screen
//     px of the glyph ink. The
//     brief's fallback, starting the thread 10 px further down, cannot fix it
//     either: the label band is 30 px tall and clearing it that way needs the
//     thread to start BELOW the whole label, which moves one leg of the V 60 px
//     down and destroys the mirror the cut is built on. The mirror is what the
//     brief says to keep exactly, so the name moves. It moves OUTWARD to 69 px,
//     which is 17 px past SAM_CHIN_DX — the 52 px offset of his own lowest alpha
//     pixel, because his head is turned — so the name reads as centred under
//     his CHIN rather than under his ear, and the thread never comes closer than
//     8.9 SCREEN px to the glyphs on any frame of the cut, measured on the
//     render (au3b/thread-vs-label.txt). His gap stays the brief's 28 px; Bret's
//     name is exactly where the brief puts it, 30 px under the dot, on his
//     axis.
//
//   * THE AMBER POINT IS 12 PX UNDER HIS CHIN AND THE THREADS PASS BEHIND HIS
//     HEAD — which is the note, not a deviation, but it is worth writing down
//     that it REPLACES V3's clearance solve. V3 had to hold the point 88 px
//     below his chin because a straight line from either side to a point under
//     a head has to get past the jaw (at a head of 340 the worst ratio is 2.88
//     at 5 px below the chin, 0.75 at 45). With the threads drawn under his
//     head that whole constraint is gone: the line may cross his jaw because it
//     is BEHIND it. What is left is a look — 12 px puts the whole dot (r 7)
//     clear of his alpha with 5 px to spare, and the apex shows for about 35 px
//     either side of it.
//
//   * THE HEAD IS 340 WORLD PX AND THE SIDES STAND AT ±303 RESOLVED / ±344
//     APART. Unchanged from V3, and still solved, but only one of V3's two
//     reasons survives: the bench. At ±290 the bench's right edge and Bret's
//     head touch; ±303 leaves 12.7 px of kraft between them resolved and 53 at
//     the widest. That makes the picture WIDTH-bound against the padding box,
//     and in a width-bound picture the world size is not neutral: the bench
//     (330 x 110) and the type (30 px) are the only things that do NOT scale
//     with the head, so a bigger world makes them relatively smaller and buys
//     back real screen size (au3/sweep.py: 249 screen px at a world head of
//     260, 293 at 340, 305 at 380 — 340 is where the curve flattens).
//
//   * THE RESOLVED k IS 0.833 AND THE TIGHT k IS 5.15, re-solved for V3b's ink
//     box. Losing the float moves two things: Sam's head drops 72 px (his chin
//     is now the anchor, not his shadow) and the dot rises 76, taking Bret's
//     name up with it. So the ink is 30 px SHORTER and, because Sam's name has
//     moved out, 40 px wider: world x 72..994 about its own centre 533 and
//     y 513.6..1232 about 872.8 — the bottom measured to the "y" of "Taylor",
//     not to the CSS line box (LABEL_INK_BOT). k puts 36 / 36 px of kraft either
//     side of it inside the padding box (34 / 38 measured on the render); at the
//     widest moment (f125) the ink is 1,004 px and K_SPREAD 0.801 still holds it
//     inside x 120-960 with 18 px to spare. The tight k comes off the OPENING FRAME
//     rather than off the face: his name now hangs only 42 px below his chin,
//     so the close-up has to be tight enough to push it off the bottom edge
//     while his hair is still cropped off the top — 340 px of head plus 42 px
//     of drop must not fit in 1920, which needs k >= 5.03. 5.15 with the
//     content centre at 976 leaves 20 px of crop above and 27 px of name below
//     the frame, and keeps the pull-back's fastest content point at 43.0 screen
//     px a frame against the house cap of 45.
//
//   * THE PORTRAITS ARE HTML, NOT SVG (unchanged from V2). An SVG <image> on a
//     staticFile races frame capture and flashes (MEMORY); Remotion's <Img>
//     holds the frame until the bitmap is decoded. The portrait layers carry
//     the identical world transform, so a world px is a world px in all three.
//     The duotone is baked into the PNG for the same reason. V3b splits them:
//     Sam's portrait, then the SVG (bench, threads, dot), then Bret's portrait
//     on top — which is how the threads get behind his head.
// ---------------------------------------------------------------------------

export const FPS = 24;
export const DURATION = 200;

// -- the padding contract ---------------------------------------------------
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

// -- THE MIRROR -------------------------------------------------------------
// One track, read twice. `d` is each side's distance from Bret's axis and
// `anchorY` the height at which both hand their thread over, so the left side
// is always the right side reflected — same easing, same frames, same distance.
export type Side = { d: number; y: number };
export const SIDE_START: Side = { d: 324, y: ANCHOR_Y_FINAL - 17.6 };
export const SIDE_APART: Side = { d: 344, y: ANCHOR_Y_FINAL - 46.9 };
export const SIDE_FINAL: Side = { d: D_FINAL, y: ANCHOR_Y_FINAL };

export const SLACK = 4.7; // px each side creeps back when the threads land
export const PULL_OVER = 2.9; // the settle past the landing, zero-sloped

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

const unit = (a: Side, b: Side) => {
  const dd = b.d - a.d;
  const dy = b.y - a.y;
  const l = Math.hypot(dd, dy) || 1;
  return { d: dd / l, y: dy / l };
};

// `start -> apart -> (slack) -> final`, plus the zero-sloped landing settle.
export const sideAt = (f: number): Side => {
  const u = unit(SIDE_APART, SIDE_FINAL);
  const slack: Side = { d: SIDE_APART.d + u.d * SLACK, y: SIDE_APART.y + u.y * SLACK };
  let d: number;
  let y: number;
  if (f <= F_DRIFT1) {
    d = travel(f, F_DRIFT0, F_DRIFT1, SIDE_START.d, SIDE_APART.d);
    y = travel(f, F_DRIFT0, F_DRIFT1, SIDE_START.y, SIDE_APART.y);
  } else if (f <= F_SLACK1) {
    d = travel(f, F_DRIFT1, F_SLACK1, SIDE_APART.d, slack.d);
    y = travel(f, F_DRIFT1, F_SLACK1, SIDE_APART.y, slack.y);
  } else {
    d = travel(f, F_PULL0, F_PULL1, slack.d, SIDE_FINAL.d);
    y = travel(f, F_PULL0, F_PULL1, slack.y, SIDE_FINAL.y);
  }
  if (f > F_PULL1 && f < F_SETTLE1) {
    const s = Math.sin((Math.PI * (f - F_PULL1)) / (F_SETTLE1 - F_PULL1));
    d += u.d * PULL_OVER * s * s;
    y += u.y * PULL_OVER * s * s;
  }
  return { d, y };
};

// The slow life every standing thing carries, so a hold is never a freeze. The
// two sides share ONE sway, applied outward on each, so breathing never breaks
// the mirror.
export const objectSway = (f: number, seed: number) => ({
  dx: 1.2 * Math.sin(f / 29 + seed),
  dy: 0.7 * Math.sin(f / 23 + seed * 1.7),
});

// -- the threads ------------------------------------------------------------
export const F_THREAD = 112; // BOTH launch here
export const THREAD_DRAW = 10; // BOTH land here
export const F_LAND = F_THREAD + THREAD_DRAW; // 122, ahead of "upon" (f125)
export const CLICK_FADE = 3; // the ink click's cross, in frames
export const SAG_AMP = 1.6;
export const SAG_PERIOD = 40;
export const threadSag = (f: number) => {
  if (f <= F_LAND + 2) return 0;
  const t = f - (F_LAND + 2);
  return SAG_AMP * 0.5 * (1 - Math.cos((2 * Math.PI * t) / SAG_PERIOD));
};

// -- the camera -------------------------------------------------------------
// One damped curve. Six authored segments, every one a key-per-frame `camMove`
// so the damper never sees a corner: creep in, the one big pull-back, the frame
// giving way under the drift, a hold, the tighten that reacts to the pull-in,
// and its 8-frame held breath.
export const K_TIGHT = 5.15;
export const K_TIGHT_END = 5.4;
export const K_WIDE = 0.8174;
export const K_SPREAD = 0.801;
export const C_TIGHT = 976; // the close-up's content centre, solved against the frame
export const C_WIDE = 856.2;
export const C_SPREAD = 849.7;
export const C_FINAL = CY_FINAL;
export const CAM_WARP = 0.62;
export const CAM_PULL0 = 40;
export const CAM_PULL1 = 94;
export const CAM_SPREAD0 = 94;
export const CAM_SPREAD1 = 132;
export const CAM_TIGHTEN0 = 152;
export const CAM_TIGHTEN1 = 170;
export const CAM_BREATH1 = 178; // the one held breath, 8 frames
export const CX_TIGHT = 540; // his face, for the close-up

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
  push(camMove({ f0: CAM_TIGHTEN1, f1: CAM_BREATH1, k0: K_FINAL, k1: K_FINAL, c0: C_FINAL, c1: C_FINAL }));
  F.push(DURATION);
  K.push(K_FINAL);
  CY.push(C_FINAL + CAM_LIFT / K_FINAL);
  return { F, K, CY };
})();
export const CAM_F = CAM_TRACK.F;
export const CAM_K = CAM_TRACK.K;
export const CAM_CY = CAM_TRACK.CY;

// cx has no CAM_LIFT term, so it is authored on its own and pushed through the
// same damper (runCamera damps its second argument against its third).
export const panTarget = (f: number) =>
  travel(f, CAM_PULL0, CAM_PULL1, CX_TIGHT, CX_FINAL, CAM_WARP);
export const CAM_CX = CAM_F.map(panTarget);

export const camAt = (f: number) => runCamera(f, CAM_F, CAM_CY, CAM_K);
export const camXAt = (f: number) => runCamera(f, CAM_F, CAM_CX, CAM_K).cy;

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
    upon: z.number(), // the mint and the ink click land three frames ahead of it
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

const AgreedUponV3: React.FC<Props> = ({
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
  const cx = camXAt(frame) + drift.dx;
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
  // ONE sway for the two sides, mirrored, so the symmetry is exact on every
  // frame: the same dy, and a dx that pushes each of them OUTWARD.
  const sideBreath = objectSway(frame, 1.7);
  const bretSway = objectSway(frame, 2.6);
  const side = sideAt(frame);
  const d = side.d + sideBreath.dx;
  const anchorY = side.y + sideBreath.dy;
  const boardX = BRET_X - d;
  const samX = BRET_X + d;
  const boardY = anchorToBoardY(anchorY);
  const samY = anchorToSamHeadY(anchorY);
  const bretX = BRET_X + bretSway.dx * 0.5;
  const bretChin = BRET_CHIN + bretSway.dy * 0.5;

  // -- the threads ----------------------------------------------------------
  // The dot hangs off his chin, so it breathes with him.
  const dot = { x: DOT_X + bretSway.dx * 0.5, y: bretChin + (DOT_Y - BRET_CHIN) };
  const boardFrom = BOARD_ANCHOR(boardX, boardY);
  const samFrom = SAM_ANCHOR(samX, samY);
  const reach = camEase(clamp01((frame - F_THREAD) / THREAD_DRAW), 0.8);
  const sag = threadSag(frame);

  // -- the mint and the one ink click ---------------------------------------
  const mint = dotScale(frame, F_LAND);
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
        cxRest={CX_TIGHT}
        k={k}
        parallax={parallax}
      />

      <AbsoluteFill
        style={{ filter: `drop-shadow(0 ${shadowY}px ${shadowBlur}px rgba(0,0,0,${shadowOpacity}))` }}
      >
        {/* Sam: HTML, world transform. His name is centred under his chin. */}
        <div style={worldStyle}>
          <Portrait
            src={samSrc}
            x={samX}
            footY={samY + SAM_H / 2}
            height={SAM_H}
            aspect={SAM_ASPECT}
            label={samLabel}
            labelX={samX + SAM_LABEL_NUDGE}
            labelGap={SAM_LABEL_GAP}
            k={k}
            labelColor={ink}
            labelOpacity={LABEL_OP}
          />
        </div>

        {/* the bench, the threads and the point: SVG, the same world transform.
            This layer is UNDER Bret's head, which is the whole gesture: each
            thread runs behind his jaw and the V's apex shows below his chin. */}
        <div style={worldStyle}>
          <svg
            width={WORLD_W}
            height={WORLD_H}
            viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          >
            <BoardBench x={boardX} y={boardY} k={k} />
            <Thread from={boardFrom} to={dot} reach={reach} sag={sag} color={accent} k={k} />
            <Thread from={samFrom} to={dot} reach={reach} sag={sag} color={accent} k={k} />
            <AgreePoint x={dot.x} y={dot.y} scale={mint} k={k} />
          </svg>
        </div>

        {/* Bret, ON TOP of the threads: he sits on the apex of the V. */}
        <div style={worldStyle}>
          <Portrait
            src={bretSrc}
            x={bretX}
            footY={bretChin}
            height={BRET_H}
            aspect={BRET_ASPECT}
            label={bretLabel}
            labelGap={BRET_LABEL_FROM_CHIN}
            k={k}
            labelColor={bretLabelColor}
            labelOpacity={bretLabelOpacity}
          />
        </div>
      </AbsoluteFill>

      <Vignette strength={0.55} />
    </AbsoluteFill>
  );
};

export default AgreedUponV3;

// ---------------------------------------------------------------------------
// The joins the cut rests on, asserted so a change to a window, an ease or a
// distance cannot quietly slide a landing off its word, break the mirror, put a
// thread through Sam's name, or let the opening frame show his name.
// ---------------------------------------------------------------------------
if (F_LAND > BEATS.upon || BEATS.upon - F_LAND > 10) {
  throw new Error(
    `AgreedUponV3: the threads land on f${F_LAND}, not just ahead of "upon" (f${BEATS.upon})`,
  );
}
if (F_LAND + DOT_MINT > BEATS.to) {
  throw new Error("AgreedUponV3: the dot must finish minting inside \"upon\"");
}
if (F_PULL0 > BEATS.mediate || F_PULL1 < BEATS.mediate) {
  throw new Error(`AgreedUponV3: the pull-in must be running on "mediate" (f${BEATS.mediate})`);
}
if (CAM_TIGHTEN0 - F_PULL0 !== 2) {
  throw new Error("AgreedUponV3: the camera must react two frames after the pull-in starts, never lead it");
}
if (CAM_BREATH1 - CAM_TIGHTEN1 > 8) {
  throw new Error("AgreedUponV3: the held breath may not run longer than 8 frames");
}
if (CAM_PULL1 > BEATS.board - 4) {
  throw new Error(`AgreedUponV3: the pull-back must land ahead of "board" (f${BEATS.board})`);
}
// THE MIRROR. Every frame, the two sides are the same distance from Bret's axis
// and at the same anchor height — that is what `sideAt` returning one (d, y)
// guarantees by construction, so what is checked here is that the track is the
// shape the cut describes: out and up, then in and down, ending inside its own
// start.
if (!(SIDE_APART.d > SIDE_START.d && SIDE_APART.y < SIDE_START.y)) {
  throw new Error("AgreedUponV3: the drift must go out AND up");
}
if (!(SIDE_FINAL.d < SIDE_START.d && SIDE_FINAL.y > SIDE_START.y)) {
  throw new Error("AgreedUponV3: the draw-in must end inside and below where it started");
}
// THE APEX MUST SHOW. The threads pass behind his head on purpose, so the only
// thing that has to be true is that the point they meet at is clear of his
// alpha — the whole disc, not just its centre.
if (DOT_Y - DOT_R <= BRET_CHIN + 2) {
  throw new Error("AgreedUponV3: the dot must sit clear of his chin, not on it");
}
// THE THREAD MUST NOT TOUCH SAM'S NAME. Walked over the whole track: the right
// thread runs from his box centre down-left to the dot, and the label box is
// SAM_LABEL_HALF either side of (his axis + the nudge). The binding point is
// always the label's TOP-LEFT corner, because the thread only moves further
// left as it falls.
{
  let worst = Infinity;
  for (let f = 0; f <= DURATION; f++) {
    const s = sideAt(f);
    const samX = BRET_X + s.d;
    const run = DOT_Y - s.y; // the thread's total drop
    const left = samX + SAM_LABEL_NUDGE - SAM_LABEL_HALF;
    for (const dy of [SAM_LABEL_GAP, SAM_LABEL_GAP + LABEL_INK_BOT]) {
      const x = samX - (s.d * dy) / run;
      worst = Math.min(worst, left - x);
    }
  }
  if (worst < 8) {
    throw new Error(
      `AgreedUponV3: the right thread passes within ${worst.toFixed(1)} world px of Sam's name`,
    );
  }
}
// The resolved picture must fit the padding box at K_FINAL with real air on
// both sides, measured off the analytic ink bbox (the render is measured too —
// see au-band.py).
{
  const x0 = Math.min(BRET_X - SIDE_FINAL.d - BOARD_W / 2, BRET_X - LABEL_HALF);
  const x1 = Math.max(
    BRET_X + SIDE_FINAL.d + SAM_W / 2,
    BRET_X + SIDE_FINAL.d + SAM_LABEL_NUDGE + SAM_LABEL_HALF,
    BRET_X + LABEL_HALF,
  );
  const y0 = Math.min(SIDE_FINAL.y - BOARD_H, anchorToSamHeadY(SIDE_FINAL.y) - SAM_H / 2);
  const y1 = Math.max(DOT_Y + BRET_LABEL_GAP + LABEL_INK_BOT, SIDE_FINAL.y + SAM_LABEL_GAP + LABEL_INK_BOT);
  const left = 540 + (x0 - CX_FINAL) * K_FINAL;
  const right = 540 + (x1 - CX_FINAL) * K_FINAL;
  const top = 960 - CAM_LIFT + (y0 - C_FINAL) * K_FINAL;
  const bottom = 960 - CAM_LIFT + (y1 - C_FINAL) * K_FINAL;
  const airL = left - PAD_X0;
  const airR = PAD_X1 - right;
  if (airL < PAD_AIR_MIN || airR < PAD_AIR_MIN || airL > PAD_AIR_MAX || airR > PAD_AIR_MAX) {
    throw new Error(
      `AgreedUponV3: the resolved ink runs screen x ${left.toFixed(1)}..${right.toFixed(1)} — air ${airL.toFixed(
        1,
      )} / ${airR.toFixed(1)}, wanted ${PAD_AIR_MIN}-${PAD_AIR_MAX}`,
    );
  }
  if (top < PAD_Y0 || bottom > PAD_Y1) {
    throw new Error(
      `AgreedUponV3: the resolved ink runs screen y ${top.toFixed(1)}..${bottom.toFixed(1)}, outside ${PAD_Y0}..${PAD_Y1}`,
    );
  }
  if (Math.abs((x0 + x1) / 2 - CX_FINAL) > 1) {
    throw new Error("AgreedUponV3: CX_FINAL is not the resolved ink centre any more");
  }
  if (Math.abs((y0 + y1) / 2 - CY_FINAL) > 1) {
    throw new Error("AgreedUponV3: CY_FINAL is not the resolved content centre any more");
  }
}
// The close-up must be a close-up, and it must hold nothing but his face: his
// hair off the top edge, his NAME below the frame's foot — the tightest of the
// two, now that the name hangs only 42 px under his chin — and both sides
// outside the frame's left and right edges.
{
  const screenY = (y: number, kk: number) => 960 - CAM_LIFT + (y - C_TIGHT) * kk;
  const screenX = (x: number, kk: number) => 540 + (x - CX_TIGHT) * kk;
  if (screenY(BRET_TOP, K_TIGHT) > 0 || BRET_HEAD * K_TIGHT < 0.8 * 1920) {
    throw new Error("AgreedUponV3: the opening frame must be tight on his face");
  }
  if (screenY(BRET_CHIN, K_TIGHT) < 1400 || screenY(BRET_HEAD_Y, K_TIGHT) > 1000) {
    throw new Error("AgreedUponV3: the opening is not on his face");
  }
  if (screenY(BRET_CHIN + BRET_LABEL_FROM_CHIN, K_TIGHT) < 1920) {
    throw new Error("AgreedUponV3: his name must be below the opening frame");
  }
  if (screenX(BRET_X - SIDE_START.d + BOARD_W / 2, K_TIGHT) > 0) {
    throw new Error("AgreedUponV3: the bench must be outside the opening frame");
  }
  if (screenX(BRET_X + SIDE_START.d - SAM_W / 2, K_TIGHT) < 1080) {
    throw new Error("AgreedUponV3: Sam must be outside the opening frame");
  }
}
// SAM_CHIN_DX is a measurement of his cutout, not a free parameter: the nudge
// must stay within a few px of it or his name stops reading as under his chin.
if (Math.abs(SAM_LABEL_NUDGE - SAM_CHIN_DX) > 18) {
  throw new Error("AgreedUponV3: Sam's name has drifted off his chin");
}
