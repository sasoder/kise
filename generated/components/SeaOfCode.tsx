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
//     with s easing from 1 at f74 to 0 at f130 on
//     1-u^2 — slow start, fastest over "hundred times
//     more productive". Density is held constant by a
//     hashed death scale per bar, so the sea reads as
//     an even disc of texture closing in from every
//     edge at once, not as a woven pile-up. Bars ripen
//     to ACCENT inside 150px of the person and fade at
//     the clearing edge: the code goes in            — "it doesn't make you a
//                                                       hundred times more"   f74-130
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
//   block    left-aligned to the glyph (x 504), 130 wide, first row 16px under
//            the feet (y 952), rows on the sea's own 14px pitch growing DOWN,
//            eleven rows => y 952-1096. Person + block is one centred column,
//            so the camera's cx is the person's own x, 540.
//   clearing one superellipse, n 2.8, 132 x 186 at (569, 980) — the union of
//            glyph and FINAL block (x 504-634, y 864-1096, centred (569,980),
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
// left-aligned with the glyph and starting 16px below the feet, growing
// downward. Same material as the sea — a row of code is bars of hashed lengths
// with hashed gaps — only in ink.
//
// Six rows type in over f1-f19 at three frames a row. Then one more row at
// f26, f52, f78, f104 and f130, head-led over four frames each: the person's
// own pace, unchanged by anything the model does. Eleven rows by f134.
const ROW_PITCH = 14;
const BAR_H = 4;
const BLOCK_X0 = PX - PERSON_SIZE / 2; // 504, the glyph's own left edge
const BLOCK_W = 130;
const BLOCK_X1 = BLOCK_X0 + BLOCK_W; // 634
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
const BLOCK_BARS: InkBar[] = (() => {
  const out: InkBar[] = [];
  for (let r = 0; r < BLOCK_ROWS; r++) {
    let x = BLOCK_X0;
    let n = 0;
    while (x < BLOCK_X1 - 6) {
      const i = r * 37 + n;
      const w = Math.min(16 + hash(i, 31) * 40, BLOCK_X1 - x);
      out.push({ row: r, x, w });
      x += w + 8 + hash(i, 32) * 8;
      n++;
    }
  }
  return out;
})();

// ---------------------------------------------------------------------------
// The clearing. Not a box: a superellipse around what the person owns,
// undulating by `wobble` and dissolved by a per-bar hashed threshold, so the
// sea's inner edge is ragged rather than ruled. ONE size, for the whole piece —
// it is cut around the FINAL eleven-row block from frame 0, so nothing ever has
// to be pushed out of the way and no edge ever moves.
//
// Glyph (504-576, 864-936) + final block (504-634, 952-1096) is x 504-634,
// y 864-1096: centre (569, 980), half-extents 65 x 116. The shape is 132 x 186,
// a 67 x 70 px margin. That is a touch over the 40-60 the brief asked for, and
// it is the corners that ask for it: at n 2.8 a superellipse fitted with a
// 50px margin on both axes pinches diagonally, and a bar's WORST-CASE surviving
// contour is edge x thr >= (1 - 0.045 - 0.03) x (1 - 0.11) = 0.823 of the
// nominal shape. At 132 x 186 that worst contour still clears the content by
// ~16px at its tightest, which is v3's approved figure.
// ---------------------------------------------------------------------------
const CL_N = 2.8;
const CL_CX = (BLOCK_X0 + BLOCK_X1) / 2; // 569
const CL_CY = (PY - PERSON_SIZE / 2 + BLOCK_Y1) / 2; // 980
const CL_RX = 132;
const CL_RY = 186;
const CL_MEAN = (CL_RX + CL_RY) / 2; // for turning a q-distance back into px
const CL_GONE = 25; // px outside the edge within which a drained bar has faded out
const CL_GONE_MAX = 120;
const CL_FADE_F = 2; // frames a bar takes to fade as it crosses that band

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
// THE DRAIN. From "it doesn't" (f74) to the end of the speech (f130) the whole
// sea is scaled into the person: p(f) = P + (p0 - P) * s(f), rows staying rows,
// bars keeping their lengths, nothing rotating.
//
//   s(f) = 1 - u^2,  u = (f - 74) / 56
//
// An ease-IN: ds/du is 0 at f74 and -2 at f130, so the contraction starts as a
// drift and the fastest part of it lands on "hundred times more productive"
// (f99-f130). The sea's own boundary (1900 x 2100) crosses the frame's top and
// bottom around f111 and its sides around f119, which is the edge closing in
// from every side; the last bars go in around f128 and no orange survives f130.
//
// Scaling alone compresses the field by 1/s^2, which is what wove the first
// attempt into a mat of rays. Each bar therefore carries a death scale s_i
// (sqrt of a hash, so the alive fraction at s is s^2 — the area factor exactly)
// and fades out over ~6 frames as s crosses it. Bars per unit area, bar length
// and bar height are all constant from f74 to the end: an even disc of texture
// closing on the person.
// ---------------------------------------------------------------------------
const DRAIN_P = 2; // s = 1 - u^DRAIN_P; >= 2 is the ease-in
const DEATH_FADE_F = 6; // frames a bar takes to fade once s crosses its s_i
const DEATH_FADE_MIN = 0.004; // ...and the floor on that window, so f74 is not a divide by zero
const DRAIN_RIPE = 150; // px outside the clearing edge: inside this a bar is ACCENT, going in

// The point everything contracts to is the COLUMN's centre — the clearing's own
// (569, 980) — and not the glyph's (540, 900). The brief said the person's
// centre, and the first render is why it is not: the clearing is a tall shape
// hung 80px below the glyph (it has to hold the eleven-row block), so a sea
// contracting onto the glyph reaches the clearing's bottom edge long before its
// top and the last three hundred bars land as a HORSESHOE arching over the
// person's head. Converging on the shape's own centre makes the closing edge an
// even ring on every side, which is the gesture. It is the same point by any
// reading that matters: the centre of the person and the code they own.
const DRAIN_CX = CL_CX;
const DRAIN_CY = CL_CY;

const OP_STEPS = 16; // opacity quantisation, so a fading bar joins a bucket

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
  const drainSpan = beats.end - beats.itDoesnt;
  const du = clamp01((frame - beats.itDoesnt) / drainSpan);
  const s = 1 - Math.pow(du, DRAIN_P);
  const rate = (DRAIN_P * Math.pow(du, DRAIN_P - 1)) / drainSpan; // |ds/df|
  const draining = frame > beats.itDoesnt && s < 1;
  const dsFade = Math.max(rate * DEATH_FADE_F, DEATH_FADE_MIN);
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

    // dead: s has passed this bar's death scale and its fade is over
    let op = 1;
    if (draining) {
      const sd = SEA.d[i];
      if (s <= sd - dsFade) continue;
      if (s < sd) op = (s - (sd - dsFade)) / dsFade;
    }

    const p = clamp01((frame - arrive) / DRAW_T);
    const w = SEA.w[i] * p;
    if (w < 0.6) continue;

    let x = SEA.x[i];
    let y = SEA.y[i];
    if (draining) {
      // the bar TRANSLATES toward the person and keeps its length: scale its
      // centre, not its ends. Scaling the length as well takes the ink density
      // down by another factor of s and the sea reads as thinning out.
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
    if (draining) {
      const near = (cl.q / edge - 1) * CL_MEAN; // px outside the clearing edge
      if (near < clGone) op *= clamp01(near / clGone);
      // ripe over the last stretch before it goes in, exactly as the pour was:
      // the band widens with the fade band so a fast bar still carries colour.
      const ripeBand = Math.max(DRAIN_RIPE, clGone);
      if (near < ripeBand) t = Math.max(t, ripeGate * (1 - near / ripeBand));
    }

    const o = op >= 0.995 ? OP_STEPS : Math.round(clamp01(op) * OP_STEPS);
    if (o <= 0) continue;
    const b = Math.round(clamp01(t) * TONE_STEPS);
    const key = b * (OP_STEPS + 1) + o;
    const bucket = buckets.get(key);
    const d = `M${x.toFixed(1)} ${y.toFixed(1)}h${w.toFixed(1)}v${BAR_H}h${(-w).toFixed(1)}z`;
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
                const reveal = BLOCK_X0 + BLOCK_W * blockReveal(b.row);
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
