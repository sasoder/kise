import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  BG_BASE,
  BG_DIM,
  CAM_LIFT,
  FRAME_H,
  FRAME_W,
  GridBackground,
  ICON_SHADOW_BLUR,
  ICON_SHADOW_OPACITY,
  ICON_SHADOW_Y,
  OP_READ,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  TONE_STEPS,
  Vignette,
  camMove,
  clamp01,
  feather,
  hash,
  iconShadow,
  makeTone,
  runCamera,
  smoothstep,
  sway,
  wobble,
  worldTransform,
} from "./fieldShared";

export const FPS = 24;
// John Charles Beren, clip `JohnCharlesBeren_Feels_Like_AGI`, cut 3: "that even
// if the model can write way more code than a person, it doesn't make you a
// hundred times more productive".
//
// SRT span 0:33.460 -> 0:38.859 at 24fps.
// round((38.859 - 33.460) * 24) = round(5.399 * 24) = round(129.576) = 130
// frames of speech, plus a 16 frame tail so the resolved state holds = 146.
export const DURATION = 146;

// ---------------------------------------------------------------------------
// "Sea of code". Cut 3 leaves the bar-chart world of cuts 1-2 for a new
// picture, on the same material rules: bars and the person glyph, no props and
// no text. A person sits with their own block of code, growing downward under
// their feet at their own steady pace. The model writes an ocean of code around
// them; then the whole ocean goes into the person, and what comes out the
// bottom is five more lines.
//
// IN AT THE TOP, OUT AT THE BOTTOM. The person is a pipe. A sea goes in and a
// person's worth of code comes out, and the last frame is the argument.
//
// Every gesture is one word. Nothing else happens.
//   open at k 1.8 on the person, the clearing and the
//     empty sea region — no orange yet. The person's
//     first six ink rows TYPE in UNDER THE FEET,
//     head-led left to right, ~3 frames each, done by
//     f19                                             — "that even if the"   f0-19
//   the person keeps writing: one more row types in,
//     head-led over 4 frames, at f26, f52, f78, f104
//     and f130 — eleven rows by f134. The rate never
//     changes, whatever the sea does. This IS the
//     productivity; there is no second counter        — runs throughout      f26-134
//   the model writes: one expanding front radiates
//     from the clearing edge, each bar it passes
//     drawing head-led over 4 frames in ripe and
//     settling to deep 12 frames later. Radius
//     175 -> 1900 px on 1-(1-u)^1.5 (fast early,
//     slowing), past every frame edge by f50 and the
//     corners by f54; it keeps creeping 12px/frame
//     to f145                                       — "model can write way
//                                                     more code"            f20-66
//   CAMERA 1: pull back k 1.8 -> 0.75 keyed f22-f42,
//     warp 0.7, person fixed at screen y 835. Settled
//     by f50, before "than" (f55). The sea outruns it  — the pull-back        f22-50
//   hold: the person and their block are a speck in
//     an orange sea; the block takes its f52 row       — "than a person"      f55-73
//   THE DRAIN: the entire sea contracts into the
//     person. Every bar's position is P + (p0-P)*s,
//     P the centre of the person's own column
//     with s easing from 1 at f74 to 0 at f134 on
//     1-smoothstep(u^1.3) — an ease-in-OUT, fastest
//     over "hundred times more" and gliding to a stop.
//     Density is held constant by a
//     hashed death scale per bar, so the sea reads as
//     an even disc of texture closing in from every
//     edge at once, not as a woven pile-up. Bars ripen
//     to ACCENT inside 150px of the person and fade at
//     the clearing edge: the code goes in            — "it doesn't make you a
//                                                       hundred times more"   f74-134
//   CAMERA 2: push in k 0.75 -> 1.1 keyed f104-f124,
//     warp 0.7, same content centre. Motivated by the
//     drain converging; damped still by f134, well
//     before the tail. A clean hold f50-f104 between
//     the two moves                                   — "times more"         f104-134
//   hold: the empty field, the person, eleven rows.
//     A whole sea went in; five more lines came out    — tail                 f130-145
//
// GEOMETRY
//   person   glyph 72 px at (540, 900), so x 504-576, y 864-936
//   block    every row CENTRED on the person's x (540), laid out into a 130
//            budget so rows run 114-130 wide => x 475-605, first row 16px under
//            the feet (y 952), rows on the sea's own 14px pitch growing DOWN,
//            eleven rows => y 952-1096. Person + block is one centred column on
//            one axis, and the camera's cx is that axis, 540.
//   clearing one superellipse, n 2.8, 132 x 186 at (540, 980) — the union of
//            glyph and FINAL block (x 475-605, y 864-1096, centred (540,980),
//            half-extents 65 x 116) with a 67 x 70 px margin. It never changes
//            size. The edge is wobbled and each bar carries its own hashed
//            threshold, so the sea's inner edge is ragged, never ruled.
//
// V4 NOTES (director's pass on the third preview: "like it all the way up until
// the two or three second mark, but then it kind of falls flat … the boxes …
// looks a little bit funky and not super smooth")
//   A. DELETED: the pour (the v = C/r radial flow), the two-size clearing and
//      its opening, the output squares and their ticks, the hundred faint
//      squares and their row-by-row wipe. Everything after "than a person" is
//      new. The squares were the funky part — a second kind of mark, on a ruled
//      lattice, in a style the rest of the piece does not use — and the pour
//      was a sea that drifted without ever arriving.
//   B. The person's productivity is now the ONLY thing it can honestly be: their
//      own code block, growing at a fixed rate whatever happens around it. The
//      block moved from beside the person to UNDER them so the picture is a
//      column — sea in at the top, lines out at the bottom — and so the camera
//      centres on the person again (cx 620 -> 540).
//   C. The drain replaces the pour because the pour never resolved: a v = C/r
//      flow is density-preserving but it is also SLOW at the outside, so the
//      frame stayed full of orange to the last frame and the line's "it doesn't
//      make you a hundred times more productive" had nothing to land on. A pure
//      scaling p = P + (p0-P)s DOES arrive — s hits 0 on the last word — but on
//      its own it compresses density by 1/s^2 and weaves the sea into a mat of
//      rays, which is exactly what was rejected in v3's first pass.
//      The fix is to thin the population by the same factor the area shrinks
//      by. Each bar gets a death scale s_i = sqrt(hash) in (0,1]; a uniform hash
//      makes P(s_i < s) = s^2, so the fraction of bars alive at scale s is s^2 —
//      precisely the area factor. Bars per unit area, bar length and bar height
//      are therefore all constant through the whole contraction, and the sea
//      reads as one even disc of texture shrinking onto the person rather than
//      as a starburst. A bar fades out over ~6 frames as s crosses its own s_i
//      (the fade window is the frame's own |ds/df| x 6, so it is 6 frames at
//      every speed), so nothing pops.
//      Consequence worth knowing: the row pitch scales with s while bar lengths
//      do not, so late in the drain the rows sit closer together and each row is
//      sparser. Total ink density is unchanged; the texture goes from "lines of
//      code" to "grain", which is the point at which it is going into someone.
//   D. The sea's own boundary (1900 x 2100) is off-frame at f74 and contracts
//      with everything else, so its edge enters the frame — top and bottom
//      around f111, the sides around f119 — and closes on the person over
//      f119-f128. The last bars vanish where the sea's shrinking outer edge
//      meets the fixed clearing, at s ~ 0.07 (f128), so no orange survives f130.
//   E. The clearing fade band widens with the drain's own speed, for the reason
//      v3's opening needed it: a 25px band is less than a frame's travel once
//      the bars near the clearing are moving 20+ px a frame, and a fade shorter
//      than a frame is a pop. Band = clamp(edge speed x 2 frames, 25, 120).
//   F. The one deviation from the brief: the drain converges on the COLUMN's
//      centre (569, 980) rather than the glyph's (540, 900). See DRAIN_CX — the
//      first render of this pass put the last three hundred bars in a horseshoe
//      over the person's head, because the clearing is a tall shape hung below
//      the glyph and a sea converging on the glyph hits its bottom edge long
//      before its top. On the shape's own centre the closing edge is an even
//      ring on every side.
//   G. Untouched from v3: the beats, the front and its 1.5 profile, camera 1,
//      the typing of the first six rows, the sea's material and its outer
//      boundary, the ink ladder, the per-icon shadow.
//
// V5 NOTES (director's pass on the fourth preview: "feels a little bit jittery
// … can we make the last part, when the orange code gets sucked back in,
// slightly more smooth. And can we also center the person icon and the text")
//   1. CENTRED. Each of the eleven ink rows is laid out with its own hashed
//      lengths and gaps exactly as before and then shifted so the ROW's extent
//      is centred on the person's x. Rows are 114-130 wide, so the block is
//      x 475-605 with both edges ragged and the glyph (504-576) centred inside
//      it. Half-extent 65, which is what the left-aligned block had, so the
//      clearing keeps its size and only moves: 132 x 186 at (540, 980). The
//      drain centre moves with it. Person, block, clearing, drain and camera cx
//      are now one axis, x 540, and the column is centred in the frame.
//   2. THE JITTER WAS THREE THINGS, and all three are fixed here.
//      (a) The EXITS. A bar left over ~6 frames as s crossed its death scale,
//          and five thousand six-frame fades going off at once is flicker by
//          construction. The exit is EXIT_F = 16 frames now, smoothstepped at
//          both ends so neither its start nor its finish is an event, and it is
//          a RECESSION rather than a fade: the bar's length shrinks to 15%
//          toward its own centre on the same curve as the opacity. A floor
//          under the rate that window is measured against (45% of the mean)
//          keeps it 16 frames through the fast middle and longer, never
//          shorter, at the ends. The death-scale scheme itself is untouched —
//          alive fraction is still exactly s^2, so density is still even.
//      (b) The END OF THE EASE. s = 1 - u^2 hits its top speed on the last
//          frame of the move: the final ring did not arrive, it snapped. It is
//          an ease-in-out now, s = 1 - smoothstep(u^1.3) over f74-f134. Peak
//          28.0 world px/frame at r 1000 at f112 (on "times more"), and the
//          last eight frames decelerate monotonically 13.1 -> 1.4. The 1.3 warp
//          buys four frames of late travel over a plain smoothstep, so the
//          sea's own edge is still closing at f126 instead of f123.
//      (c) SUB-PIXEL SNAP. The path string rounded x, y and w to one decimal —
//          4% of a frame's travel at the slow end, and the same rounding on
//          every bar in a row at once. Two decimals now. Nothing anywhere in
//          the drain is rounded to whole pixels.
//      Two smaller ones went with them: the clearing-edge fade and the ripe
//      ramp were LINEAR in the distance outside the edge, so every bar changed
//      slope in one frame as it crossed the top of its band; both are
//      smoothstepped now. And the opacity ladder went 16 -> 24 steps, because a
//      1/16 ladder shows its own steps over a fade that now lasts 16 frames.
//   3. THE CAMERA IS UNCHANGED at f104-f124, deliberately, and this was checked
//      rather than assumed. A bar's SCREEN radius is r0 * s * k, so a push-in
//      and a contraction partly cancel: measured per bar, the screen speed at
//      r 1000 DIPS from 18.2 to 14.0 px/frame across the middle of the move and
//      peaks at 23.3. The damper shows one acceleration lobe (f105) and one
//      deceleration lobe (f116), max dk 0.0226 at f115, still by f134, and the
//      content centre holds screen y 834.1-835.0 from f100 to the end.
//   4. Untouched: the first act (typing, the front, the pull-back), the beats,
//      DURATION 146, the five growth rows at f26/52/78/104/130, the one fixed
//      clearing, the tones, the opacity ladder and the sea's material.
// ---------------------------------------------------------------------------

export const schema = z.object({
  ink: z.string(),
  accent: z.string(), // ripe: a bar the front just wrote, a bar entering the person
  accentDeep: z.string(), // deep: written code at rest
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
  beats: z.object({
    thatEven: z.number(), // "that even"
    ifThe: z.number(), // "if the"
    modelCan: z.number(), // "model can"
    write: z.number(), // "write"
    way: z.number(), // "way"
    moreCode: z.number(), // "more code"
    thanA: z.number(), // "than a"
    person: z.number(), // "person"
    itDoesnt: z.number(), // "it doesn't" — the drain starts
    makeYouA: z.number(), // "make you a"
    hundred: z.number(), // "hundred"
    timesMore: z.number(), // "times more"
    productive: z.number(), // "productive"
    end: z.number(), // speech ends, the drain lands; tail to 146
  }),
});

export type Props = z.infer<typeof schema>;

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
  beats: {
    thatEven: 0,
    ifThe: 13,
    modelCan: 20,
    write: 28,
    way: 34,
    moreCode: 44,
    thanA: 55,
    person: 60,
    itDoesnt: 74,
    makeYouA: 81,
    hundred: 99,
    timesMore: 104,
    productive: 114,
    end: 130,
  },
});

const WORLD_W = 1080;
const WORLD_H = 2200;

// ---------------------------------------------------------------------------
// The person is the origin of everything: the sea is centred on them, the
// writing front radiates from them, the drain runs back into them, and the
// camera holds them at screen y 835 at every zoom.
// ---------------------------------------------------------------------------
const PX = 540;
const PY = 900;
const PERSON_SIZE = 72;

// Their own code, UNDER them: rows of ink bars on the sea's own row pitch,
// starting 16px below the feet and growing downward. Same material as the sea —
// a row of code is bars of hashed lengths with hashed gaps — only in ink.
//
// V5: CENTRED. Every row is laid out from 0 with its own hashed lengths and
// gaps exactly as before, and then the whole row is shifted so its extent is
// centred on the person's own x (540). Rows are 114-130 wide, so the block sits
// in x 475-605 with a ragged right edge and a ragged left one, and the glyph
// (504-576) is centred inside it. Person, block, clearing, drain and camera are
// now all on one axis, x 540.
//
// Six rows type in over f1-f19 at three frames a row. Then one more row at
// f26, f52, f78, f104 and f130, head-led over four frames each: the person's
// own pace, unchanged by anything the model does. Eleven rows by f134.
const ROW_PITCH = 14;
const BAR_H = 4;
const BLOCK_W = 130; // the width budget a row is laid out into
const BLOCK_Y0 = PY + PERSON_SIZE / 2 + 16; // 952, 16px under the feet
const TYPE_ROWS = 6;
const TYPE_F0 = 1;
const TYPE_PER_ROW = 3; // six rows, one after another, done by f19
const GROW_F = [26, 52, 78, 104, 130]; // and one more row on each of these
const GROW_T = 4; // head-led over four frames
const BLOCK_ROWS = TYPE_ROWS + GROW_F.length; // 11
const BLOCK_Y1 = BLOCK_Y0 + (BLOCK_ROWS - 1) * ROW_PITCH + BAR_H; // 1096

const rowStart = (row: number) => (row < TYPE_ROWS ? TYPE_F0 + row * TYPE_PER_ROW : GROW_F[row - TYPE_ROWS]);
const rowSpan = (row: number) => (row < TYPE_ROWS ? TYPE_PER_ROW : GROW_T);

type InkBar = { row: number; x: number; w: number };
// Per-row left edge and width, so the head-led reveal runs from each row's own
// left edge rather than from a shared one.
const BLOCK_ROW_X0: number[] = [];
const BLOCK_ROW_W: number[] = [];
const BLOCK_BARS: InkBar[] = (() => {
  const out: InkBar[] = [];
  for (let r = 0; r < BLOCK_ROWS; r++) {
    const seg: { x: number; w: number }[] = [];
    let x = 0;
    let n = 0;
    while (x < BLOCK_W - 6) {
      const i = r * 37 + n;
      const w = Math.min(16 + hash(i, 31) * 40, BLOCK_W - x);
      seg.push({ x, w });
      x += w + 8 + hash(i, 32) * 8;
      n++;
    }
    const rowW = seg[seg.length - 1].x + seg[seg.length - 1].w;
    const x0 = PX - rowW / 2; // the row's extent, centred on the person
    BLOCK_ROW_X0.push(x0);
    BLOCK_ROW_W.push(rowW);
    for (const b of seg) out.push({ row: r, x: x0 + b.x, w: b.w });
  }
  return out;
})();
// The block's own extent comes out at x 475-605 — half-extent 65 on the
// person's axis, the same half-extent the left-aligned block had, which is why
// the clearing below keeps its size and only moves.

// ---------------------------------------------------------------------------
// The clearing. Not a box: a superellipse around what the person owns,
// undulating by `wobble` and dissolved by a per-bar hashed threshold, so the
// sea's inner edge is ragged rather than ruled. ONE size, for the whole piece —
// it is cut around the FINAL eleven-row block from frame 0, so nothing ever has
// to be pushed out of the way and no edge ever moves.
//
// Glyph (504-576, 864-936) + final block (475-605, 952-1096) is x 475-605,
// y 864-1096: centre (540, 980), half-extents 65 x 116 — the same half-extents
// the left-aligned block had, moved onto the person's own axis. The shape is
// 132 x 186, a 67 x 70 px margin. That is a touch over the 40-60 asked for, and
// it is the corners that ask for it: at n 2.8 a superellipse fitted with a
// 50px margin on both axes pinches diagonally, and a bar's WORST-CASE surviving
// contour is edge x thr >= (1 - 0.045 - 0.03) x (1 - 0.11) = 0.823 of the
// nominal shape. At 132 x 186 that worst contour still clears the content by
// ~16px at its tightest, which is v3's approved figure.
// ---------------------------------------------------------------------------
const CL_N = 2.8;
const CL_CX = PX; // 540 — the person's own axis, which the block is now centred on
const CL_CY = (PY - PERSON_SIZE / 2 + BLOCK_Y1) / 2; // 980
const CL_RX = 132;
const CL_RY = 186;
const CL_MEAN = (CL_RX + CL_RY) / 2; // for turning a q-distance back into px
const CL_GONE = 25; // px outside the edge within which a drained bar has faded out
const CL_GONE_MAX = 200;
const CL_FADE_F = 3; // frames a bar takes to fade as it crosses that band

const clearingEdge = (theta: number) =>
  1 + 0.045 * Math.sin(3 * theta + 1.2) + 0.03 * Math.sin(5 * theta - 0.4);
const clearQ = (x: number, y: number) => {
  const u = (x - CL_CX) / CL_RX;
  const v = (y - CL_CY) / CL_RY;
  const q = Math.pow(Math.pow(Math.abs(u), CL_N) + Math.pow(Math.abs(v), CL_N), 1 / CL_N);
  return { q, edge: clearingEdge(Math.atan2(v, u)) };
};

// ---------------------------------------------------------------------------
// The camera. TWO moves, with a clean 54-frame hold between them.
//
// 1. the pull-back on "model can write" (f20): k 1.8 -> 0.75 keyed f22-f42 with
//    warp 0.7, so the hand's speed is early in the move and the damper settles
//    it by f50 — 5 frames clear of "than" (f55). Unchanged from v3.
// 2. the push-in on "times more" (f104): k 0.75 -> 1.1 keyed f104-f124, same
//    warp. It is the drain arriving: the sea is closing on the person and the
//    frame closes with it. The damper has it still by f134, well before the
//    speech ends at f130... which is to say the move is over before the hold.
//
// The content centre is the person's own y, fixed, and cy comes off the eased k
// every frame, so the person sits at screen y 835 from the first frame to the
// last. cx is the person's own x: person and block are one centred column.
//
// At k 0.75 the frame is 1440 x 2560 world px around the person: 720 either
// side, 1113 above, 1447 below. Everything the sea has to cover is inside a
// radius of 1616 (the bottom corners), which the front passes at f56.
// ---------------------------------------------------------------------------
const K_OPEN = 1.8;
const K_REST = 0.75;
const K_CLOSE = 1.1;
const CAM_CX = PX;
const CAM1 = camMove({ f0: 22, f1: 42, k0: K_OPEN, k1: K_REST, c0: PY, c1: PY, warp: 0.7 });
const CAM2 = camMove({ f0: 104, f1: 124, k0: K_REST, k1: K_CLOSE, c0: PY, c1: PY, warp: 0.7 });
const CAM_F = [0, ...CAM1.F, ...CAM2.F, DURATION];
const CAM_K = [K_OPEN, ...CAM1.K, ...CAM2.K, K_CLOSE];
const CAM_CY = [PY + CAM_LIFT / K_OPEN, ...CAM1.CY, ...CAM2.CY, PY + CAM_LIFT / K_CLOSE];

// ---------------------------------------------------------------------------
// The sea. Code is horizontal bars: hashed lengths 20-70 on hashed gaps 10-30
// along a row, rows on a 14px pitch, bar height 4. The region is a superellipse
// 3800 x 4200 centred on the person — far bigger than any frame in the piece —
// with a feathered, wobbling outer boundary that is off every frame until the
// drain brings it in.
//
// Built once at module scope into flat arrays, culled to the frame at render
// time on the bar's MOVED position, and drawn as one <path> per (tone, opacity)
// bucket rather than one <rect> per bar.
// ---------------------------------------------------------------------------
const SEA_RX = 1900;
const SEA_RY = 2100;
const SEA_N = 2.6;
const SEA_EDGE_FEATHER = 1.4; // in the 10-step units below
const SEA_SEED = 1.7;

// The writing front: 175 (the clearing edge) -> 1900 px from f20 to f66 on an
// ease-out — fast early, slowing — and then a constant 12px/frame creep that
// runs to the last frame. `arriveAt` is its exact inverse, so every bar knows
// the frame the front reaches it without anything searching per frame.
const FRONT_F0 = 20;
const FRONT_F1 = 66;
const FRONT_R0 = 175;
const FRONT_R1 = 1900;
const FRONT_EXP = 1.5; // r = R0 + (R1-R0)(1 - (1-u)^EXP): fast early, slowing
const FRONT_CREEP = 12;
const FRONT_BAND = 60; // the front is a soft band, not a circle
const DRAW_T = 4; // a bar draws head-led over 4 frames
const SETTLE_T = 12; // and settles ripe -> deep 12 frames later

// The first profile tried was (1-u)^2. It put the front past the corners of the
// opening frame by f30 — ten frames into a gesture that has to run to f66 — so
// "the model writes" was over before the camera had started moving and the
// pull-back revealed a sea that was already finished. 1.5 keeps the front INSIDE
// the frame the whole way: it is still eating the corners of the resolved frame
// at f54, and it passes the frame's four edges at f50, as the camera settles.
const arriveAt = (r: number) => {
  if (r <= FRONT_R0) return FRONT_F0;
  if (r >= FRONT_R1) return FRONT_F1 + (r - FRONT_R1) / FRONT_CREEP;
  const e = (r - FRONT_R0) / (FRONT_R1 - FRONT_R0);
  return FRONT_F0 + (FRONT_F1 - FRONT_F0) * (1 - Math.pow(1 - e, 1 / FRONT_EXP));
};

const SEA = (() => {
  const bx: number[] = [];
  const by: number[] = [];
  const bw: number[] = [];
  const ba: number[] = [];
  const bt: number[] = [];
  const bd: number[] = [];
  const rows = Math.floor(SEA_RY / ROW_PITCH);
  for (let j = -rows; j <= rows; j++) {
    const y = PY + j * ROW_PITCH + (hash(j, 21) - 0.5) * 3;
    const vy = Math.abs((y - PY) / SEA_RY);
    if (vy >= 1) continue;
    const halfW = SEA_RX * Math.pow(1 - Math.pow(vy, SEA_N), 1 / SEA_N);
    // Every row gets its own hash PHASE rather than its own index offset: a
    // constant index stride between rows lines the hashed lengths up column by
    // column and the sea grows faint vertical seams.
    const rr = j + rows;
    const ph = rr * 0.137;
    let x = PX - halfW - 80 + hash(rr, 22) * 75;
    let n = 0;
    while (x < PX + halfW + 60) {
      const len = 20 + hash(n, 31 + ph) * 50;
      const gap = 10 + hash(n, 32 + ph) * 20;
      const cx = x + len / 2;
      // the outer boundary: undulating, and the field dissolves into it
      const u = (cx - PX) / SEA_RX;
      const v = (y - PY) / SEA_RY;
      const q =
        Math.pow(Math.pow(Math.abs(u), SEA_N) + Math.pow(Math.abs(v), SEA_N), 1 / SEA_N) -
        0.012 * wobble(Math.atan2(v, u) * 100, SEA_SEED);
      const fe = feather((1 - q) * 10, SEA_EDGE_FEATHER);
      if (fe > 0 && hash(n, 71 + ph) < fe) {
        const thr = 1 + (hash(n, 60 + ph) - 0.5) * 0.22; // this bar's own clearing edge
        const cl = clearQ(cx, y);
        if (cl.q >= cl.edge * thr) {
          const r0 = Math.hypot(cx - PX, y - PY);
          bx.push(x);
          by.push(y);
          bw.push(len * (0.6 + 0.4 * fe));
          ba.push(arriveAt(r0 + (hash(n, 33 + ph) - 0.5) * FRONT_BAND));
          bt.push(thr);
          // The death scale. sqrt of a uniform hash, so P(s_i < s) = s^2 and the
          // fraction of the sea alive at scale s is exactly the area factor.
          bd.push(Math.sqrt(Math.max(hash(n, 91 + ph), 1e-4)));
        }
      }
      x += len + gap;
      n++;
    }
  }
  return {
    x: Float32Array.from(bx),
    y: Float32Array.from(by),
    w: Float32Array.from(bw),
    a: Float32Array.from(ba),
    t: Float32Array.from(bt),
    d: Float32Array.from(bd),
    n: bx.length,
  };
})();

// ---------------------------------------------------------------------------
// THE DRAIN. From "it doesn't" (f74) the whole sea is scaled into the person:
// p(f) = P + (p0 - P) * s(f), rows staying rows, bars keeping their lengths,
// nothing rotating.
//
//   s(f) = 1 - smoothstep(u^1.3),  u = (f - 74) / 60,  s(134) = 0
//
// V5, on "make the last part slightly more smooth": this is an ease-in-OUT, not
// the ease-in it was. v4's s = 1 - u^2 reaches its MAXIMUM speed at the last
// frame of the move, so the final ring did not arrive, it snapped — 36 world px
// a frame and still accelerating when it hit zero. A smoothstep is fast in the
// middle and flat at both ends: the peak is 28 world px/frame at r 1000 (f112,
// on "times more") and the last eight frames decelerate monotonically to 1.4,
// so the last bars glide into the person. The 1.3 warp puts the peak a little
// later than a plain smoothstep would and keeps the sea's own boundary in the
// frame to f126 rather than f123; the curve still lands at f134, eleven frames
// clear of the end and on the frame the eleventh ink row finishes.
//
// Scaling alone compresses the field by 1/s^2, which is what wove the first
// attempt into a mat of rays. Each bar therefore carries a death scale s_i
// (sqrt of a hash, so the alive fraction at s is s^2 — the area factor exactly)
// and RECEDES as s crosses it: over EXIT_F frames its length shrinks toward its
// own centre and its opacity goes to zero on the same smoothstep. Bars per unit
// area, bar length and bar height are all constant from f74 to the end: an even
// disc of texture closing on the person.
// ---------------------------------------------------------------------------
const DRAIN_TAIL = 4; // the drain lands DRAIN_TAIL frames after `beats.end`: f134
const DRAIN_WARP = 1.3; // s = 1 - smoothstep(u^DRAIN_WARP)
// V5: a bar's exit was six frames, and thousands of six-frame fades going off at
// once is exactly what read as flicker. Sixteen, eased, and a recession rather
// than a blink — the bar shrinks to 15% of its length as it fades.
const EXIT_F = 16;
const EXIT_SHRINK = 0.85;
// ...and a floor under |ds/df| when the window is measured, so the exit does not
// collapse at the two ends of the curve where the true rate goes to zero. At
// 45% of the mean rate the window is 16 frames through the fast middle and
// LONGER (to ~34) at the ends, never shorter.
const EXIT_RATE_FLOOR = 0.45;
const DRAIN_RIPE = 150; // px outside the clearing edge: inside this a bar is ACCENT, going in

// The point everything contracts to is the COLUMN's centre — the clearing's own
// (540, 980) — and not the glyph's (540, 900). V4's first render is why: the
// clearing is a tall shape hung 80px below the glyph (it has to hold the
// eleven-row block), so a sea contracting onto the glyph reaches the clearing's
// bottom edge long before its top and the last three hundred bars land as a
// HORSESHOE arching over the person's head. Converging on the shape's own
// centre makes the closing edge an even ring on every side, which is the
// gesture. Since V5 centred the block this is on the person's own x anyway: the
// drain, the clearing, the block and the camera are all on 540.
const DRAIN_CX = CL_CX;
const DRAIN_CY = CL_CY;

// Opacity quantisation, so a fading bar joins a bucket. V5 takes it 16 -> 24:
// an exit is sixteen frames now instead of six, so a 1/16 ladder would show its
// own steps in a fade that lasts two thirds of a second.
const OP_STEPS = 24;

const SeaOfCode: React.FC<Props> = ({
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
  beats,
}) => {
  const frame = useCurrentFrame();
  const tone = makeTone(accentDeep, accent);

  // -- camera ----------------------------------------------------------------
  const cam = runCamera(frame, CAM_F, CAM_CY, CAM_K);
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = CAM_CX + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);

  // -- the drain -------------------------------------------------------------
  // Keyed off the beats prop, so a retime moves the drain with the words.
  const drainSpan = beats.end + DRAIN_TAIL - beats.itDoesnt; // 60 frames, f74 -> f134
  const du = clamp01((frame - beats.itDoesnt) / drainSpan);
  const dw = Math.pow(du, DRAIN_WARP);
  const s = 1 - smoothstep(dw);
  // |ds/df| of that curve, floored so the exit window never collapses where the
  // curve itself is flat (the first frames, and the landing).
  const rateRaw = du <= 0 ? 0 : (6 * dw * (1 - dw) * DRAIN_WARP * Math.pow(du, DRAIN_WARP - 1)) / drainSpan;
  const rate = Math.max(rateRaw, EXIT_RATE_FLOOR / drainSpan);
  const draining = frame > beats.itDoesnt && s < 1;
  const dsFade = rate * EXIT_F; // the exit window, in s
  const ripeGate = smoothstep((frame - beats.itDoesnt) / 8);
  // The fade band at the clearing edge is the drain's own speed there times two
  // frames: a 25px band is less than one frame's travel once the bars arriving
  // at the clearing are moving 20+ px a frame, and a fade shorter than a frame
  // is a pop by another name.
  const edgeSpeed = draining ? (CL_MEAN / Math.max(s, 0.02)) * rate : 0;
  const clGone = Math.min(Math.max(edgeSpeed * CL_FADE_F, CL_GONE), CL_GONE_MAX);

  // -- the sea ---------------------------------------------------------------
  // Cull to the frame on the MOVED position, then test the clearing, then
  // bucket by (tone, opacity) so a thousand bars mid-fade are still a handful
  // of paths.
  const vx0 = cx - FRAME_W / 2 / k - 90;
  const vx1 = cx + FRAME_W / 2 / k + 90;
  const vy0 = cy - FRAME_H / 2 / k - 90;
  const vy1 = cy + FRAME_H / 2 / k + 90;

  const buckets = new Map<number, string[]>();
  for (let i = 0; i < SEA.n; i++) {
    const arrive = SEA.a[i];
    if (frame < arrive) continue;

    // The exit. Once s passes this bar's death scale the bar RECEDES over
    // EXIT_F frames — its length shrinks toward its own centre and it fades on
    // the same eased curve — rather than winking out over six. Both ends of the
    // smoothstep are flat, so neither the start nor the finish of an exit is an
    // event you can see; a thousand of them at once is a softening, not a
    // flicker.
    let op = 1;
    let lenF = 1;
    if (draining) {
      const sd = SEA.d[i];
      if (s <= sd - dsFade) continue;
      if (s < sd) {
        const e = smoothstep((sd - s) / dsFade);
        op = 1 - e;
        lenF = 1 - EXIT_SHRINK * e;
      }
    }

    const p = clamp01((frame - arrive) / DRAW_T);
    const w = SEA.w[i] * p * lenF;
    if (w < 0.6) continue;

    let x = SEA.x[i];
    let y = SEA.y[i];
    if (draining) {
      // the bar TRANSLATES toward the person and keeps its length: scale its
      // centre, not its ends. Scaling the length as well takes the ink density
      // down by another factor of s and the sea reads as thinning out. (The
      // exit's own shrink is the one exception, and it is around this same
      // centre — the bar recedes into itself as it leaves.)
      const bcx = SEA.x[i] + SEA.w[i] / 2;
      x = DRAIN_CX + (bcx - DRAIN_CX) * s - w / 2;
      y = DRAIN_CY + (y - DRAIN_CY) * s;
    }
    if (x + w < vx0 || x > vx1 || y < vy0 || y > vy1) continue;

    const mx = x + w / 2;
    const cl = clearQ(mx, y);
    const edge = cl.edge * SEA.t[i];
    if (cl.q < edge) continue;

    let t = 1 - smoothstep((frame - arrive - DRAW_T) / SETTLE_T);
    const near = (cl.q / edge - 1) * CL_MEAN; // px outside the clearing edge
    // V5: both of these ramps are smoothstepped rather than linear. A linear
    // ramp has a corner at the top of the band — a bar crossing it changes
    // slope in one frame — and at these speeds a corner per bar is a step per
    // bar. A smoothstep is flat at both ends, so nothing has an onset.
    //
    // V6: the fade band is ALWAYS on, not only while draining. Gating it on the
    // drain meant every bar sitting inside the 25px band at rest went from
    // full opacity to near zero on the drain's first frame — a ring of code
    // around the person vanishing in one frame (the user saw it at ~3s). With
    // the band always applied the rest state already carries the soft edge,
    // and the drain's first frame changes nothing it did not change smoothly.
    if (near < clGone) op *= smoothstep(near / clGone);
    if (draining) {
      // ripe over the last stretch before it goes in, exactly as the pour was:
      // the band widens with the fade band so a fast bar still carries colour.
      const ripeBand = Math.max(DRAIN_RIPE, clGone);
      if (near < ripeBand) t = Math.max(t, ripeGate * smoothstep(1 - near / ripeBand));
    }

    const o = op >= 0.995 ? OP_STEPS : Math.round(clamp01(op) * OP_STEPS);
    if (o <= 0) continue;
    const b = Math.round(clamp01(t) * TONE_STEPS);
    const key = b * (OP_STEPS + 1) + o;
    const bucket = buckets.get(key);
    // TWO decimals, not one and never an integer: a bar crossing the frame at
    // 25 px a frame snapped to whole px is a bar that stutters, and 0.1 px is
    // still a visible 4% of a frame's travel at the slow end of the drain.
    const d = `M${x.toFixed(2)} ${y.toFixed(2)}h${w.toFixed(2)}v${BAR_H}h${(-w).toFixed(2)}z`;
    if (bucket) bucket.push(d);
    else buckets.set(key, [d]);
  }
  const paths = Array.from(buckets.entries()).sort((a, b) => a[0] - b[0]);

  // -- the person's own code, typed in ---------------------------------------
  const blockReveal = (row: number) => clamp01((frame - rowStart(row)) / rowSpan(row));

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
            {/* the sea: one path per (tone, opacity) bucket */}
            {paths.map(([key, d]) => {
              const o = key % (OP_STEPS + 1);
              const b = (key - o) / (OP_STEPS + 1);
              return (
                <path
                  key={key}
                  d={d.join("")}
                  fill={tone(b / TONE_STEPS)}
                  opacity={o >= OP_STEPS ? 1 : o / OP_STEPS}
                />
              );
            })}

            {/* the person's own code, typed in row by row, under their feet */}
            <g style={{ filter: icon }}>
              {BLOCK_BARS.map((b, i) => {
                const reveal =
                  BLOCK_ROW_X0[b.row] + BLOCK_ROW_W[b.row] * blockReveal(b.row);
                const w = Math.min(b.w, reveal - b.x);
                if (w <= 0.5) return null;
                return (
                  <rect
                    key={i}
                    x={b.x}
                    y={BLOCK_Y0 + b.row * ROW_PITCH}
                    width={w}
                    height={BAR_H}
                    fill={ink}
                    opacity={OP_READ}
                  />
                );
              })}
            </g>
          </svg>

          {/* the person */}
          <Img
            src={staticFile("person.png")}
            style={{
              position: "absolute",
              left: PX - PERSON_SIZE / 2,
              top: PY - PERSON_SIZE / 2,
              width: PERSON_SIZE,
              height: PERSON_SIZE,
              filter: `brightness(0) invert(1) ${icon}`,
              opacity: OP_READ,
            }}
          />
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default SeaOfCode;
