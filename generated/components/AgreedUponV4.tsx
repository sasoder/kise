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
  BRET_ASPECT,
  BRET_CHIN,
  BRET_H,
  BRET_HEAD,
  BRET_HEAD_Y,
  BRET_LABEL_FROM_CHIN,
  BRET_LABEL_GAP,
  BRET_TOP,
  BRET_W,
  BRET_X,
  BoardTable,
  CX_FINAL_V4,
  CY_FINAL,
  DOT_MINT,
  DOT_R,
  DOT_X,
  DOT_Y,
  D_FINAL_V4,
  K_FINAL_V4,
  LABEL_HALF,
  LABEL_INK_BOT,
  LABEL_INK_TOP,
  LABEL_OP,
  POP_FADE,
  POP_FROM,
  POP_MINT,
  Portrait,
  SAM_ANCHOR,
  SAM_ASPECT,
  SAM_CHIN_DX,
  SAM_H,
  SAM_LABEL_GAP,
  SAM_LABEL_HALF,
  SAM_LABEL_NUDGE,
  SAM_W,
  TABLE_ANCHOR,
  TABLE_INK_B,
  TABLE_INK_L,
  TABLE_INK_R,
  TABLE_INK_T,
  TABLE_OVAL_RX,
  TABLE_OVAL_RY,
  TABLE_SEAT,
  TABLE_SEAT_ANGLES,
  Thread,
  WORLD_H,
  WORLD_W,
  anchorToSamHeadY,
  anchorToTableY,
  dotScale,
  popFade,
  popScale,
  tableSeat,
} from "./bretShared";

// ---------------------------------------------------------------------------
// "agreed upon to help mediate" — V4. Cheeky Pint style on kraft, opaque
// cutaway, 24fps, 1080x1920. Bret Taylor on the weekend the OpenAI board fired
// Sam Altman (Nov 2023).
//
// V4 is the approved V3b with the director's three notes on its preview applied
// and NOTHING else. The duotone heads, the mirror triangle (Bret low centre,
// the board upper-left, Sam upper-right, mirrored about x 540), the two threads
// launching f112 and landing f122 together at the amber dot minted under Bret's
// chin, the threads running behind his head, the one ink click on his name, the
// draw-in on "mediate", the alive hold, the labels, the shadows and the padding
// and velocity discipline are all V3b's. THREE THINGS CHANGED:
//
//   1. THE OPENING IS NOT A CLOSE-UP ANY MORE. Director: "you shouldn't start so
//      close up on Bret — he can be a bit close, centred on the screen, maybe
//      twice as big as in the last frame, in the middle of the screen, and then
//      it zooms out." V3b opened at k 5.15, his face filling 91% of the frame.
//      V4 opens at EXACTLY twice the resolved scale — k K_TIGHT = 2 * K_FINAL —
//      with his head centred on x 540 and its centre at screen y 900. His head
//      is 566 screen px at f0 and 283 at f199: two to one, measured.
//
//   2. THE BOARD AND SAM POP UP ON THEIR WORDS. Director: "the board and Sam
//      should pop up as he's saying this." In V3b they were STANDING from frame
//      0 and the pull-back merely revealed them, so the words "existing board"
//      and "Sam" changed nothing. In V4 neither exists until it is named: the
//      table is MINTED at f72, six frames ahead of "existing" (f78), and Sam at
//      f104, six frames ahead of "Sam" (f110). The mint is the coin recipe from
//      d1Shared — a 6-frame scale-in 0.6 -> 1 with the house's zero-sloped
//      back(0.75) settle, the opacity arriving over the first 3 frames, the
//      shadow with it. No bounce, no flash. The camera does not react: it is
//      already most of the way through its pull-back, so both land inside the
//      frame it has established and it simply keeps opening around them.
//
//   3. THE BOARD IS A BOARDROOM TABLE, SEEN FROM ABOVE. Director: "I'm not the
//      biggest fan of how you visualized the board — it's a bit boring and
//      slightly out of place." The bench (one wide tile, three user glyphs in a
//      row) is gone. `BoardTable` is an OVAL of the house tile material with the
//      OPENAI mark knocked out of its centre and SIX SEATS around it — five
//      occupied by a knocked-out "user", and the seat at the oval's RIGHT END,
//      the one nearest Sam, NOT DRAWN AT ALL. It reads at a glance as a
//      boardroom with an empty chair, which is the sentence the cut is about.
//
// THE LINE (SRT 11.859 -> 19.539):
//   "basically my understanding was I was the person that both the existing
//    board and Sam agreed upon to kind of help mediate the situation"
//
// DURATION = round((19.539 - 11.859) * 24) = 184 frames of speech, plus a
// 16-frame tail so the resolved picture holds = 200.
//
// WORD ONSETS (frames from the composition start, = 11.859 s)
//   f0 basically · f15 my · f18 understanding · f28 was · f36 I · f40 was ·
//   f45 the · f49 person · f58 that · f63 both · f71 the · f78 existing ·
//   f98 board · f106 and · f110 Sam · f117 agreed · f125 upon · f133 to ·
//   f142 kind · f148 of · f152 help · f156 mediate · f166 the · f170 situation
//   · speech ends f184 · tail to f200.
//
// THE CLIP'S ONE VISUAL RULE: MANY CONVERGE ON ONE POINT, AND AMBER IS THAT
// POINT. Two sides converge on Bret: the existing board (a boardroom table with
// one empty chair) UPPER-LEFT, Sam UPPER-RIGHT, Bret LOW and CENTRE, and two
// amber threads that meet at one dot just under his chin.
//
// ---------------------------------------------------------------------------
// EVERY GESTURE, WITH THE WORD IT SERVES AND THE FRAME IT RUNS ON
//
//   1. THE CREEP-IN            f0 -> f46     "basically my understanding was I"
//      Bret alone, centred, at twice his resolved size — close, but a portrait
//      rather than a face pressed against the lens: his whole head and his name
//      are in the frame with air around them. The camera creeps in by a further
//      4% across the whole 46 frames and rides `sway`, and he carries his own
//      slow `objectSway`. A hold that is never still. Nothing else happens,
//      because nothing in those words happens, and nothing else EXISTS yet.
//
//   2. THE PULL-BACK           f46 -> f82    lands ahead of "board" (f98)
//      The ONE big camera move: k K_CREEP -> K_WIDE while the content centre
//      travels from his head (C_TIGHT) to the triad's (C_WIDE) and cx eases from
//      his axis (540) to the resolved ink centre (CX_FINAL_V4), all on ONE
//      `camMove` at warp CAM_WARP, damped by `runCamera`. So the pull-back also
//      drifts the centre off his head and onto the triangle's — there is no pan
//      key of its own. The damper carries the scale on to f84; "existing"
//      (f78-98) is read while it is still opening.
//
//   3. THE BOARD IS MINTED     f72           ahead of "existing" (f78)
//      The table is STRUCK at its near-apart position, fully in by f78. Its
//      label — it has none — and its contact shadow arrive with it.
//
//   4. THE DRIFT APART         f72 -> f125   "both the existing board and Sam"
//      The situation pulling apart. ONE TRACK, READ TWICE: the two sides are
//      always the same distance `d` from Bret's axis and always at the same
//      anchor height, so they are exact mirrors on every frame, whether or not
//      both are drawn yet. 24 world px along the line the draw-in will later
//      come back down — d 286.3 -> 302, the anchor 763.6 -> 745.5, out AND up —
//      one flow-eased travel at 0.45 px a frame. Alive, not a travel.
//
//   5. SAM IS MINTED           f104          ahead of "Sam" (f110)
//      The same strike, at the position the drift has the right-hand side in at
//      f104, fully in by f110. His name arrives with him.
//
//   6. THE FRAME GIVES WAY     f82 -> f132   under the drift
//      k K_WIDE -> K_SPREAD (-1.6%) and the content centre lifting with the two
//      rising sides. Not a move, a breath: the frame opening as they keep
//      separating, so the long stretch between the pull-back and the draw-in is
//      never a parked camera.
//
//   7. THE THREADS             f112 -> f122  "agreed" (f117) into "upon" (f125)
//      Both threads launch on the SAME frame, from mirrored sources — the
//      oval's bottom-centre rim and the point directly under Sam's head — and
//      both run to ONE point: the amber dot under Bret's chin. Same ease, same
//      10 frames, so they LAND TOGETHER on f122. The simultaneous landing is the
//      agreement. They are drawn BELOW his head, so each tip slips behind his
//      cheek and the apex reappears under his chin a frame and a half before it
//      lands.
//
//   8. THE MINT AND THE CLICK  f122 -> f127  ahead of "upon" (f125)
//      The dot is STRUCK where the two threads meet and Bret's name clicks ink
//      0.55 -> ACCENT 1.0 over 3 frames. The label is the cut's ONE
//      single-object ink click.
//
//   9. THE SLACK TAKEN UP      f125 -> f150  "to kind of"
//      The threads are on him, so the sides stop drifting out and creep SLACK px
//      back along the line they will be pulled down.
//
//  10. THE PULL IN             f150 -> f180  "help mediate" (f152 / f156)
//      The drift REVERSES, mirrored: d 302 -> 261 and the anchor 745.5 -> 792.4,
//      visibly moving on "mediate", settled by f168 with a PULL_OVER-px
//      zero-sloped settle bump to f180. The threads are geometric, so they
//      simply get shorter: the V closes on its own point.
//
//  11. THE CAMERA REACTS       f152 -> f178  two frames after (10) starts
//      A gentle tighten k K_SPREAD -> K_FINAL (+4.9%) and the content centre
//      settling back down with the two sides, then an 8-frame held breath
//      f170 -> f178. It follows the pull-in rather than leading it.
//
//  12. THE HOLD, ALIVE         f180 -> f200  "the situation", then the tail
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
// mirror, the single point, the padding box with 30-60 px of air, and "the pops
// land inside the frame the pull-back has already established":
//
//   * THE PULL-BACK IS AUTHORED f46 -> f82, NOT f46 -> f92. This one is forced
//     arithmetic, not taste. The table's left seat sits 228 px left of the
//     oval's centre, so at the pop it is 486 world px left of the camera's cx:
//     it only clears the frame's left edge for k <= 1.11, and only clears the
//     house band (x 60) for k <= 0.99. At f72 the brief's f46-f92 move is 56% of
//     the way through, which at CAM_WARP 0.62 leaves k 1.10 — the leftmost seat
//     is 6 px OFF the left edge on the frame it is struck, which is exactly what
//     "they land inside the frame the pull-back has already established" says
//     must not happen. Getting k to 0.99 at f72 on a move ending at f92 needs
//     warp 0.39, and warp below 0.5 has a non-zero slope at u=0 — a velocity
//     step the damper rings on. So the move keeps its shape and loses ten
//     frames: authored f46-f82 at warp 0.62, the damper carries the scale to
//     f84, and the table's leftmost seat is at screen x 68 on f72, 124 on f78
//     and 151 by f86. The move still lands well ahead of "board" (f98), and the
//     frame is never parked after it: (6) runs f82 -> f132.
//
//   * THE SIDES POP 24 PX INSIDE THEIR APART-MOST POSITION, not exactly on it.
//     Same arithmetic, 14 px of it: at d 302 the leftmost seat is at world x 10
//     and is 4 px outside the house band at f72 even with the shortened
//     pull-back. Popping at d 286.3 and drifting the last 24 px out to f125 puts
//     it at 68 instead — and the drift is V3b's own gesture (4), which the brief
//     keeps, at V3b's own size (24 px against V3b's 20). It runs along the SAME
//     LINE the draw-in later comes back down, so the two sides only ever move on
//     one axis in the whole cut.
//
//   * THE RESOLVED CAMERA CENTRES 38.5 PX LEFT OF BRET'S AXIS. The table's
//     missing seat is on its RIGHT (it is the seat nearest Sam), so the table's
//     ink reaches 228 px left of the oval's centre and only 180 right: the whole
//     picture's ink centre is CX_FINAL_V4 501.5, not Bret's 540. The house rule
//     is that the camera centres the ink, and it is kept — Bret's head resolves
//     32 screen px right of the frame's centre with the five seats balancing
//     him, and the air is 45 / 45 px measured analytically inside x 120-960.
//     Centring Bret instead would put 7 px of kraft on one side and 83 on the
//     other.
//
//   * THE SIDES COME IN FROM ±303 TO ±261. The table is 408 world px wide
//     against the bench's 330, so at V3b's distance the resolved ink is 78 px
//     wider and k has to fall to 0.761 to fit the padding box — Bret's head
//     would drop from 283 screen px to 259. Nothing about the heads was supposed
//     to change, so the distance absorbs the table instead: D_FINAL_V4 261 puts
//     K_FINAL back at 0.8325 and his head back at 283 px, to the pixel. At 261
//     the oval's right rim is still 52 px clear of the top of Bret's hair and the
//     nearest seat 92 px clear of his alpha.
//
//   * THE SEAT GLYPH IS STROKED 3.0, NOT THE HOUSE 2.6. A seat is 34 px against
//     a CompanyCard's 72, so the house weight comes out at 2.17 world px —
//     1.8 screen px at the resolved k, which reads as a smudge rather than a
//     person. 3.0 puts it at 2.5 world px: the same weight as a thread, which is
//     the thinnest line this clip already draws. Everything else about the
//     knock-out is CompanyCard's exactly.
//
//   * THE MINT LANDS ON 1 RATHER THAN PASSING IT. "back(0.75)" in this house is
//     written as a zero-sloped sin^2 bump rather than a kinked max() (MEMORY),
//     which bulges the middle of the move and settles exactly on 1. A real
//     overshoot past 1 on a 34 px seat cluster is a bounce, and the brief says
//     no bounce. So `popScale` is `dotScale`'s shape read into [0.6, 1].
//
//   * V3b'S RESOLVED CONSTANTS ARE LEFT ALONE IN bretShared. D_FINAL, K_FINAL,
//     CX_FINAL, BOARD_* and `anchorToBoardY` still describe the bench world, so
//     AgreedUponV3 still renders as delivered; V4's are the _V4 / TABLE_ names
//     beside them. `BoardBench` is still exported for the same reason.
//
//   * SAM'S NAME IS STILL NUDGED 69 WORLD PX OUTWARD, and Bret's is still 30 px
//     under the dot on his axis — both unchanged from V3b, and both still
//     needed: the right thread leaves Sam's box centre and only moves 0.83 px
//     left per px down, so a name centred on his axis has the thread through its
//     first letters. Proven on the V3b render (au3b/thread-vs-label.txt) and
//     re-asserted here over the whole new track.
//
//   * BRET'S NAME IS ON SCREEN FROM f0. V3b's close-up was tight enough to push
//     it below the frame's foot; at 2x it sits at screen y 1263-1320, inside the
//     padding box. That is a gain, not a loss — the only type in the cut names
//     the speaker from the first frame, so the amber click at f122 lands on a
//     name the viewer has been reading for five seconds.
//
//   * THE PORTRAITS ARE HTML, NOT SVG (unchanged). An SVG <image> on a
//     staticFile races frame capture and flashes (MEMORY); Remotion's <Img>
//     holds the frame until the bitmap is decoded. The three layers carry the
//     identical world transform, so a world px is a world px in all of them:
//     Sam's portrait, then the SVG (table, threads, dot), then Bret's portrait
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
// The looser house band every frame has to sit inside, pops included.
export const BAND_X0 = 60;
export const BAND_X1 = 1020;

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

// -- the two mints ----------------------------------------------------------
export const F_POP_BOARD = 72; // fully in by "existing" (f78)
export const F_POP_SAM = 104; // fully in by "Sam" (f110)

// -- THE MIRROR -------------------------------------------------------------
// One track, read twice, and now read on ONE LINE: the pop position, the
// apart-most position and the resolved position are collinear, so the two sides
// only ever travel out along that line and then back down it.
export type Side = { d: number; y: number };
export const SIDE_APART: Side = { d: 302, y: ANCHOR_Y_FINAL - 46.9 };
export const SIDE_FINAL: Side = { d: D_FINAL_V4, y: ANCHOR_Y_FINAL };

const unit = (a: Side, b: Side) => {
  const dd = b.d - a.d;
  const dy = b.y - a.y;
  const l = Math.hypot(dd, dy) || 1;
  return { d: dd / l, y: dy / l };
};
const U_IN = unit(SIDE_APART, SIDE_FINAL); // apart -> resolved: inward and down

export const POP_BACK = 24; // how far inside apart the two sides are struck
export const SIDE_POP: Side = {
  d: SIDE_APART.d + U_IN.d * POP_BACK, // 286.26
  y: SIDE_APART.y + U_IN.y * POP_BACK, // 763.57
};

export const SLACK = 4.7; // px each side creeps back when the threads land
export const PULL_OVER = 2.9; // the settle past the landing, zero-sloped

export const F_DRIFT0 = F_POP_BOARD;
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

// `pop -> apart -> (slack) -> resolved`, plus the zero-sloped landing settle.
export const sideAt = (f: number): Side => {
  const slack: Side = { d: SIDE_APART.d + U_IN.d * SLACK, y: SIDE_APART.y + U_IN.y * SLACK };
  let d: number;
  let y: number;
  if (f <= F_DRIFT1) {
    d = travel(f, F_DRIFT0, F_DRIFT1, SIDE_POP.d, SIDE_APART.d);
    y = travel(f, F_DRIFT0, F_DRIFT1, SIDE_POP.y, SIDE_APART.y);
  } else if (f <= F_SLACK1) {
    d = travel(f, F_DRIFT1, F_SLACK1, SIDE_APART.d, slack.d);
    y = travel(f, F_DRIFT1, F_SLACK1, SIDE_APART.y, slack.y);
  } else {
    d = travel(f, F_PULL0, F_PULL1, slack.d, SIDE_FINAL.d);
    y = travel(f, F_PULL0, F_PULL1, slack.y, SIDE_FINAL.y);
  }
  if (f > F_PULL1 && f < F_SETTLE1) {
    const s = Math.sin((Math.PI * (f - F_PULL1)) / (F_SETTLE1 - F_PULL1));
    d += U_IN.d * PULL_OVER * s * s;
    y += U_IN.y * PULL_OVER * s * s;
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
export const K_TIGHT = 2 * K_FINAL_V4; // 1.665 — his head at exactly twice its resolved size
export const K_CREEP = K_TIGHT * 1.04; // 1.7316
// Solved, not chosen: it puts his head's CENTRE (world y 980) at screen y 900.
export const OPEN_HEAD_SCREEN_Y = 900;
export const C_TIGHT = BRET_HEAD_Y - (OPEN_HEAD_SCREEN_Y - (960 - CAM_LIFT)) / K_TIGHT; // 940.96
export const K_WIDE = 0.8065;
export const K_SPREAD = 0.7935;
export const C_WIDE = 857.54;
export const C_SPREAD = 849.35;
export const C_FINAL = CY_FINAL;
export const CAM_WARP = 0.62;
export const CAM_PULL0 = 46;
export const CAM_PULL1 = 82;
export const CAM_SPREAD0 = 82;
export const CAM_SPREAD1 = 132;
export const CAM_TIGHTEN0 = 152;
export const CAM_TIGHTEN1 = 170;
export const CAM_BREATH1 = 178; // the one held breath, 8 frames
export const CX_TIGHT = BRET_X; // f0 is centred on his head

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
  push(camMove({ f0: 0, f1: CAM_PULL0, k0: K_TIGHT, k1: K_CREEP, c0: C_TIGHT, c1: C_TIGHT }));
  push(camMove({ f0: CAM_PULL0, f1: CAM_PULL1, k0: K_CREEP, k1: K_WIDE, c0: C_TIGHT, c1: C_WIDE, warp: CAM_WARP }));
  push(camMove({ f0: CAM_SPREAD0, f1: CAM_SPREAD1, k0: K_WIDE, k1: K_SPREAD, c0: C_WIDE, c1: C_SPREAD }));
  push(camMove({ f0: CAM_SPREAD1, f1: CAM_TIGHTEN0, k0: K_SPREAD, k1: K_SPREAD, c0: C_SPREAD, c1: C_SPREAD }));
  push(camMove({ f0: CAM_TIGHTEN0, f1: CAM_TIGHTEN1, k0: K_SPREAD, k1: K_FINAL_V4, c0: C_SPREAD, c1: C_FINAL, warp: 0.8 }));
  push(camMove({ f0: CAM_TIGHTEN1, f1: CAM_BREATH1, k0: K_FINAL_V4, k1: K_FINAL_V4, c0: C_FINAL, c1: C_FINAL }));
  F.push(DURATION);
  K.push(K_FINAL_V4);
  CY.push(C_FINAL + CAM_LIFT / K_FINAL_V4);
  return { F, K, CY };
})();
export const CAM_F = CAM_TRACK.F;
export const CAM_K = CAM_TRACK.K;
export const CAM_CY = CAM_TRACK.CY;

// cx has no CAM_LIFT term, so it is authored on its own and pushed through the
// same damper (runCamera damps its second argument against its third). It is
// the SAME window and the SAME ease as the pull-back's k — the centre drifting
// off his head and onto the triangle's is part of that one move, not a pan.
export const panTarget = (f: number) =>
  travel(f, CAM_PULL0, CAM_PULL1, CX_TIGHT, CX_FINAL_V4, CAM_WARP);
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
    existing: z.number(), // the table is struck six frames ahead of it
    board: z.number(),
    and: z.number(),
    sam: z.number(), // Sam is struck six frames ahead of it
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

const AgreedUponV4: React.FC<Props> = ({
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
  const tableX = BRET_X - d;
  const samX = BRET_X + d;
  const tableY = anchorToTableY(anchorY);
  const samY = anchorToSamHeadY(anchorY);
  const bretX = BRET_X + bretSway.dx * 0.5;
  const bretChin = BRET_CHIN + bretSway.dy * 0.5;

  // -- the two mints --------------------------------------------------------
  const tablePop = popScale(frame, F_POP_BOARD);
  const tableFade = popFade(frame, F_POP_BOARD);
  const samPop = popScale(frame, F_POP_SAM);
  const samFade = popFade(frame, F_POP_SAM);

  // -- the threads ----------------------------------------------------------
  // The dot hangs off his chin, so it breathes with him.
  const dot = { x: DOT_X + bretSway.dx * 0.5, y: bretChin + (DOT_Y - BRET_CHIN) };
  const tableFrom = TABLE_ANCHOR(tableX, tableY);
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
        {/* Sam: HTML, world transform, struck at f104 — the scale is about his
            own head's centre, so he is minted rather than slid in. His name is
            centred under his chin and arrives with him. */}
        {samFade > 0 && (
          <div style={worldStyle}>
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: WORLD_W,
                height: WORLD_H,
                transformOrigin: `${samX}px ${samY}px`,
                transform: `scale(${samPop})`,
                opacity: samFade,
              }}
            >
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
          </div>
        )}

        {/* the table, the threads and the point: SVG, the same world transform.
            This layer is UNDER Bret's head, which is the whole gesture: each
            thread runs behind his jaw and the V's apex shows below his chin. */}
        <div style={worldStyle}>
          <svg
            width={WORLD_W}
            height={WORLD_H}
            viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          >
            <BoardTable x={tableX} y={tableY} k={k} pop={tablePop} fade={tableFade} />
            {tableFade > 0 && (
              <Thread from={tableFrom} to={dot} reach={reach} sag={sag} color={accent} k={k} />
            )}
            {samFade > 0 && (
              <Thread from={samFrom} to={dot} reach={reach} sag={sag} color={accent} k={k} />
            )}
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

export default AgreedUponV4;

// ---------------------------------------------------------------------------
// The joins the cut rests on, asserted so a change to a window, an ease or a
// distance cannot quietly slide a landing off its word, break the mirror, put a
// thread through Sam's name, strike an object outside the frame, or lose the
// two-to-one the opening is built on.
// ---------------------------------------------------------------------------
const screenX = (x: number, f: number) => 540 + (x - camXAt(f)) * camAt(f).k;
const screenY = (y: number, f: number) => 960 + (y - camAt(f).cy) * camAt(f).k;

// 1. THE OPENING. Twice the resolved size, centred, and alone.
if (Math.abs(K_TIGHT / K_FINAL_V4 - 2) > 1e-9) {
  throw new Error("AgreedUponV4: the opening must be exactly twice the resolved scale");
}
{
  const h0 = BRET_HEAD * camAt(0).k;
  const h1 = BRET_HEAD * camAt(DURATION).k;
  if (Math.abs(h0 / h1 - 2) > 0.02) {
    throw new Error(`AgreedUponV4: his head is ${h0.toFixed(0)} px at f0 and ${h1.toFixed(0)} at the end — not two to one`);
  }
  const midY = screenY(BRET_HEAD_Y, 0);
  const midX = screenX(BRET_X, 0);
  if (Math.abs(midY - OPEN_HEAD_SCREEN_Y) > 12 || Math.abs(midX - 540) > 12) {
    throw new Error(`AgreedUponV4: f0 puts his head at screen (${midX.toFixed(0)}, ${midY.toFixed(0)}), not (540, ${OPEN_HEAD_SCREEN_Y})`);
  }
  if (screenY(BRET_TOP, 0) < 0 || screenY(BRET_CHIN, 0) > 1920) {
    throw new Error("AgreedUponV4: his whole head must be inside the opening frame");
  }
  if (screenY(DOT_Y + BRET_LABEL_GAP + LABEL_INK_BOT, 0) > PAD_Y1) {
    throw new Error("AgreedUponV4: his name must sit inside the padding box at f0");
  }
  if (F_POP_BOARD <= 0 || F_POP_SAM <= 0) {
    throw new Error("AgreedUponV4: nothing but Bret may exist at f0");
  }
}

// 2. THE POPS. Each is struck ahead of its word and finished by it, and each
// lands INSIDE the house band on the frame it is struck — which is what the
// pull-back's window is solved against.
if (F_POP_BOARD >= BEATS.existing || F_POP_BOARD + POP_MINT > BEATS.existing) {
  throw new Error(`AgreedUponV4: the board must be struck ahead of "existing" (f${BEATS.existing}) and be in by it`);
}
if (F_POP_SAM >= BEATS.sam || F_POP_SAM + POP_MINT > BEATS.sam) {
  throw new Error(`AgreedUponV4: Sam must be struck ahead of "Sam" (f${BEATS.sam}) and be in by it`);
}
if (POP_FADE > POP_MINT) {
  throw new Error("AgreedUponV4: a mint may not finish fading in after it has finished scaling");
}
if (popScale(F_POP_BOARD, F_POP_BOARD) !== POP_FROM || Math.abs(popScale(F_POP_BOARD + POP_MINT, F_POP_BOARD) - 1) > 1e-9) {
  throw new Error("AgreedUponV4: the mint must run 0.6 -> 1 over POP_MINT frames");
}
{
  for (const [f, label] of [[F_POP_BOARD, "the table"], [F_POP_SAM, "Sam"]] as [number, string][]) {
    const s = sideAt(f);
    const l = f === F_POP_BOARD ? screenX(BRET_X - s.d - TABLE_INK_L, f) : screenX(BRET_X + s.d - SAM_W / 2, f);
    const r =
      f === F_POP_BOARD
        ? screenX(BRET_X - s.d + TABLE_INK_R, f)
        : screenX(BRET_X + s.d + SAM_LABEL_NUDGE + SAM_LABEL_HALF, f);
    if (l < BAND_X0 || r > BAND_X1) {
      throw new Error(`AgreedUponV4: ${label} is struck at screen x ${l.toFixed(0)}..${r.toFixed(0)}, outside the band ${BAND_X0}-${BAND_X1}`);
    }
  }
}

// 3. THE THREADS, THE MINT AND THE CLICK — all V3b's frames.
if (F_THREAD < F_POP_SAM + POP_MINT) {
  throw new Error("AgreedUponV4: a thread may not leave a side that is still being struck");
}
if (F_LAND > BEATS.upon || BEATS.upon - F_LAND > 10) {
  throw new Error(`AgreedUponV4: the threads land on f${F_LAND}, not just ahead of "upon" (f${BEATS.upon})`);
}
if (F_LAND + DOT_MINT > BEATS.to) {
  throw new Error('AgreedUponV4: the dot must finish minting inside "upon"');
}

// 4. THE DRAW-IN AND THE CAMERA THAT FOLLOWS IT.
if (F_PULL0 > BEATS.mediate || F_PULL1 < BEATS.mediate) {
  throw new Error(`AgreedUponV4: the pull-in must be running on "mediate" (f${BEATS.mediate})`);
}
if (CAM_TIGHTEN0 - F_PULL0 !== 2) {
  throw new Error("AgreedUponV4: the camera must react two frames after the pull-in starts, never lead it");
}
if (CAM_BREATH1 - CAM_TIGHTEN1 > 8) {
  throw new Error("AgreedUponV4: the held breath may not run longer than 8 frames");
}
if (CAM_PULL1 > BEATS.board - 4) {
  throw new Error(`AgreedUponV4: the pull-back must land ahead of "board" (f${BEATS.board})`);
}
if (CAM_WARP <= 0.5) {
  throw new Error("AgreedUponV4: a warp at or below 0.5 hands the damper a velocity step");
}

// 5. THE MIRROR. `sideAt` returning one (d, y) makes it exact by construction,
// so what is checked is the shape of the track: struck inside apart, out and up
// to f125, then in and down, ending inside where it was struck — all on one line.
if (!(SIDE_POP.d < SIDE_APART.d && SIDE_POP.y > SIDE_APART.y)) {
  throw new Error("AgreedUponV4: the drift must go out AND up");
}
if (!(SIDE_FINAL.d < SIDE_POP.d && SIDE_FINAL.y > SIDE_POP.y)) {
  throw new Error("AgreedUponV4: the draw-in must end inside and below where the sides were struck");
}
{
  const cross = (SIDE_APART.d - SIDE_POP.d) * (SIDE_FINAL.y - SIDE_POP.y) - (SIDE_APART.y - SIDE_POP.y) * (SIDE_FINAL.d - SIDE_POP.d);
  if (Math.abs(cross) > 1e-6) {
    throw new Error("AgreedUponV4: the pop, apart and resolved positions must be collinear");
  }
}

// 6. THE APEX MUST SHOW under his chin — the whole disc, not just its centre.
if (DOT_Y - DOT_R <= BRET_CHIN + 2) {
  throw new Error("AgreedUponV4: the dot must sit clear of his chin, not on it");
}

// 7. THE TABLE MUST NOT TOUCH BRET. Their BOXES overlap by design — the oval's
// right rim reaches 44 px into the column of his head box and the lowest seats
// hang 15 px into the top of it — so the box test is the wrong test and would
// only be passable by pushing the sides back out and shrinking everyone. What
// has to be true is that no INK meets: the oval's rim, sampled all the way
// round, and each of the five seat tiles, against his head box, walked over
// every frame the table is drawn on. (His head box is itself conservative: at
// the height where the nearest seat passes, his alpha is another 90 px away.)
{
  const bx0 = BRET_X - BRET_W / 2;
  const bx1 = BRET_X + BRET_W / 2;
  const toBox = (px: number, py: number) =>
    Math.hypot(Math.max(bx0 - px, 0, px - bx1), Math.max(BRET_TOP - py, 0, py - BRET_CHIN));
  let gap = Infinity;
  let at = 0;
  for (let f = F_POP_BOARD; f <= DURATION; f++) {
    const s = sideAt(f);
    const tx = BRET_X - s.d;
    const ty = anchorToTableY(s.y);
    for (let i = 0; i < 360; i++) {
      const t = (i * Math.PI) / 180;
      const dRim = toBox(tx + TABLE_OVAL_RX * Math.cos(t), ty + TABLE_OVAL_RY * Math.sin(t));
      if (dRim < gap) {
        gap = dRim;
        at = f;
      }
    }
    for (const a of TABLE_SEAT_ANGLES) {
      const c = tableSeat(a);
      for (const sx of [-TABLE_SEAT / 2, TABLE_SEAT / 2]) {
        for (const sy of [-TABLE_SEAT / 2, TABLE_SEAT / 2]) {
          const dSeat = toBox(tx + c.x + sx, ty + c.y + sy);
          if (dSeat < gap) {
            gap = dSeat;
            at = f;
          }
        }
      }
    }
  }
  if (gap < 10) {
    throw new Error(`AgreedUponV4: the table's ink comes within ${gap.toFixed(1)} world px of Bret's head box at f${at}`);
  }
}

// 8. THE THREAD MUST NOT TOUCH SAM'S NAME. Walked over the whole track: the
// right thread runs from his box centre down-left to the dot, and the label box
// is SAM_LABEL_HALF either side of (his axis + the nudge). The binding point is
// always the label's TOP-LEFT corner, because the thread only moves further
// left as it falls. V3b measured that corner on the CSS LINE BOX; here it is
// measured on the INK (LABEL_INK_TOP, 6 px lower), because the sides now stand
// 42 px closer in and the thread therefore falls 14% steeper, which costs 3 px
// at the box's top and none at all where the cap of the "S" actually is. The
// render is measured too — au4/thread-vs-label.py.
{
  let worst = Infinity;
  for (let f = 0; f <= DURATION; f++) {
    const s = sideAt(f);
    const sx = BRET_X + s.d;
    const run = DOT_Y - s.y;
    const left = sx + SAM_LABEL_NUDGE - SAM_LABEL_HALF;
    for (const dy of [SAM_LABEL_GAP + LABEL_INK_TOP, SAM_LABEL_GAP + LABEL_INK_BOT]) {
      const x = sx - (s.d * dy) / run;
      worst = Math.min(worst, left - x);
    }
  }
  if (worst < 8) {
    throw new Error(`AgreedUponV4: the right thread passes within ${worst.toFixed(1)} world px of Sam's name`);
  }
}

// 9. THE RESOLVED PICTURE must fit the padding box at K_FINAL_V4 with real air
// on both sides, measured off the analytic ink bbox (the render is measured too
// — see au4/band-robust.py).
{
  const x0 = Math.min(BRET_X - SIDE_FINAL.d - TABLE_INK_L, BRET_X - LABEL_HALF);
  const x1 = Math.max(
    BRET_X + SIDE_FINAL.d + SAM_W / 2,
    BRET_X + SIDE_FINAL.d + SAM_LABEL_NUDGE + SAM_LABEL_HALF,
    BRET_X + LABEL_HALF,
  );
  const y0 = Math.min(
    anchorToTableY(SIDE_FINAL.y) - TABLE_INK_T,
    anchorToSamHeadY(SIDE_FINAL.y) - SAM_H / 2,
  );
  const y1 = Math.max(
    DOT_Y + BRET_LABEL_GAP + LABEL_INK_BOT,
    SIDE_FINAL.y + SAM_LABEL_GAP + LABEL_INK_BOT,
  );
  const left = 540 + (x0 - CX_FINAL_V4) * K_FINAL_V4;
  const right = 540 + (x1 - CX_FINAL_V4) * K_FINAL_V4;
  const top = 960 - CAM_LIFT + (y0 - C_FINAL) * K_FINAL_V4;
  const bottom = 960 - CAM_LIFT + (y1 - C_FINAL) * K_FINAL_V4;
  const airL = left - PAD_X0;
  const airR = PAD_X1 - right;
  if (airL < PAD_AIR_MIN || airR < PAD_AIR_MIN || airL > PAD_AIR_MAX || airR > PAD_AIR_MAX) {
    throw new Error(
      `AgreedUponV4: the resolved ink runs screen x ${left.toFixed(1)}..${right.toFixed(1)} — air ${airL.toFixed(
        1,
      )} / ${airR.toFixed(1)}, wanted ${PAD_AIR_MIN}-${PAD_AIR_MAX}`,
    );
  }
  if (top < PAD_Y0 || bottom > PAD_Y1) {
    throw new Error(
      `AgreedUponV4: the resolved ink runs screen y ${top.toFixed(1)}..${bottom.toFixed(1)}, outside ${PAD_Y0}..${PAD_Y1}`,
    );
  }
  if (Math.abs((x0 + x1) / 2 - CX_FINAL_V4) > 1) {
    throw new Error("AgreedUponV4: CX_FINAL_V4 is not the resolved ink centre any more");
  }
  if (Math.abs((y0 + y1) / 2 - C_FINAL) > 1) {
    throw new Error("AgreedUponV4: C_FINAL is not the resolved content centre any more");
  }
}

// 10. THE HOUSE SPEED CAP, on the real content points, for every frame a thing
// is actually drawn on.
{
  const pts = (f: number) => {
    const s = sideAt(f);
    const tx = BRET_X - s.d;
    const sx = BRET_X + s.d;
    const ty = anchorToTableY(s.y);
    const sy = anchorToSamHeadY(s.y);
    const out: [number, number, number][] = [
      [BRET_X - BRET_W / 2, BRET_TOP, 0],
      [BRET_X + BRET_W / 2, BRET_CHIN, 0],
      [DOT_X, DOT_Y, F_LAND],
      [tx - TABLE_INK_L, ty - TABLE_INK_T, F_POP_BOARD],
      [tx + TABLE_INK_R, ty + TABLE_INK_B, F_POP_BOARD],
      [tx, ty + TABLE_OVAL_RY, F_POP_BOARD],
      [sx - SAM_W / 2, sy - SAM_H / 2, F_POP_SAM],
      [sx + SAM_W / 2, sy + SAM_H / 2, F_POP_SAM],
      [sx + SAM_LABEL_NUDGE + SAM_LABEL_HALF, s.y + SAM_LABEL_GAP + LABEL_INK_BOT, F_POP_SAM],
    ];
    return out;
  };
  let worst = 0;
  let at = 0;
  for (let f = 1; f <= DURATION; f++) {
    const a = pts(f - 1);
    const b = pts(f);
    a.forEach(([x0, y0, from], i) => {
      if (f - 1 < from) return;
      const [x1, y1] = b[i];
      const v = Math.hypot(screenX(x1, f) - screenX(x0, f - 1), screenY(y1, f) - screenY(y0, f - 1));
      if (v > worst) {
        worst = v;
        at = f;
      }
    });
  }
  if (worst > 45) {
    throw new Error(`AgreedUponV4: a content point moves ${worst.toFixed(1)} screen px at f${at} — the cap is 45`);
  }
}

// 11. SAM_CHIN_DX is a measurement of his cutout, not a free parameter: the
// nudge must stay within a few px of it or his name stops reading as under his
// chin.
if (Math.abs(SAM_LABEL_NUDGE - SAM_CHIN_DX) > 18) {
  throw new Error("AgreedUponV4: Sam's name has drifted off his chin");
}
