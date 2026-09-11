import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  BG_BASE,
  BG_DIM,
  FRAME_H,
  FRAME_W,
  GridBackground,
  ICON_SHADOW_BLUR,
  ICON_SHADOW_OPACITY,
  ICON_SHADOW_Y,
  OP_READ,
  OP_RECEDE,
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
// picture, on the same material rules: bars, dots, rules and the person glyph,
// no props and no text. A person sits with their own small block of code and
// their own small run of output. The model writes an ocean of code around them
// and then pours it into them, and the output does not change rate. The last
// thing in frame is a hundred empty slots with six filled.
//
// Every gesture is one word. Nothing else happens.
//   open at k 1.8 on the person, the clearing and the
//     empty sea region — no orange yet. The person's
//     six ink rows TYPE in, head-led left to right,
//     ~3 frames each, done by f19. The first output
//     unit is already there.                          — "that even if the"   f0-19
//   the output tick: a hard placement every 26
//     frames, f26/52/78/104/130, unchanged by
//     anything else in the piece                      — runs throughout      f26-130
//   the model writes: one expanding front radiates
//     from the clearing edge, each bar it passes
//     drawing head-led over 4 frames in ripe and
//     settling to deep 12 frames later. Radius
//     175 -> 1900 px on 1-(1-u)^1.5 (fast early,
//     slowing), past every frame edge by f50 and the
//     corners by f54; it keeps creeping 12px/frame
//     to f145                                       — "model can write way
//                                                     more code"            f20-66
//   CAMERA, the one move: pull back k 1.8 -> 0.75
//     keyed f22-f42, warp 0.7, person fixed at
//     screen y 835. Settled by f50, before "than"
//     (f55). The sea outruns it                       — the pull-back        f22-50
//   hold: the person and their block are a speck in
//     an orange sea; the ticks continue               — "than a person"      f55-73
//   the pour: the whole sea drifts inward toward the
//     person on the density-preserving radial flow
//     v = C/r, 2.5 world px/frame at the clearing.
//     Bars turn ripe over the last 120px and vanish
//     at the clearing edge — the code goes into the
//     person. The output tick does not change rate    — "it doesn't make you
//                                                       a"                   f74-145
//   the clearing OPENS: the shape the sea is cut
//     around eases from the small one (just the
//     person, their block and their output row) out
//     to the full one that holds the hundred, f92 ->
//     f100. The sea is pushed back rather than
//     deleted: every bar the growing edge passes
//     ripens and dissolves exactly as a poured bar
//     does at the edge                                — into "hundred"      f92-100
//   the ghost hundred: the ninety-four empty slots
//     arrive as faint ink squares — the same 20 x 20
//     as a real unit, on the same 30px pitch, at
//     OP_RECEDE — wiped in row by row from the top
//     row down, one row a frame, no per-square
//     stagger and no fade                             — "hundred"            f99-108
//   hold: pour continues, ticks land f104 and f130,
//     the grid stays. Six lit, ninety-four faint      — "times more
//                                                       productive" + tail   f110-145
//
// V2 NOTES (director's pass on the first preview)
//   A. The output row was centred on the person and ran left of them, so the
//      first unit floated with nothing under it. The whole 10 x 10 grid moved
//      right: slot 0's centre is now x 510, directly under the person's glyph
//      (504-576), and the row runs right to x 780. The camera's horizontal
//      centre moved 540 -> 620 so the resolved composition — person, ink block
//      and grid, world x 495-795 — sits in the middle of the frame. k, cy and
//      the warp are untouched.
//   B. The clearing was sized for the pair (glyph + block) only, so the sea ran
//      straight under the grid. It now covers person + block + the whole grid
//      with ~30px of margin: a superellipse 580 x 760 at (645, 1070), n 2.8,
//      with the same wobble, the same per-bar hashed threshold and the same
//      feathered dissolve. Worst case a bar survives at q = 0.823 of the
//      nominal edge (edge min 0.925 x thr min 0.89); at that contour the
//      clearing still clears the grid by 59px at its tightest (the bottom-right
//      corner of the rows), which is more than the 35px a bar can reach from
//      its centre. Nothing orange touches the grid at any frame.
//   C. The dashed plan is gone. The ghost of the hundred is a hundred faint
//      squares — the same shape as a filled unit, one rung down — so the count
//      is read off identical marks and a lit unit is the same square turned up.
//      The rung is OP_RECEDE (0.3), not OP_DARK (0.16). Measured on f145 over
//      the #6E6E6E field: at 0.3 a faint square is 152/255 against a lit unit's
//      240 and a field of 110, so the six read instantly AND the ninety-four
//      are still countable as a hundred; at 0.16 the faint square is 131, only
//      21 levels over the field, and the hundred all but leaves the frame —
//      which costs the word the gesture is for.
//   D. The diagonal banding across the sea is the half-res preview's downscale,
//      not the frame: 1:1 crops of the full-res stills at f60 and f120 are
//      discrete bars with no chevrons in them. A 14px row pitch of 4px bars
//      aliases when it is halved. Row pitch and row y are left alone.
//
// V3 NOTES (director's pass on the second preview)
//   A. B ABOVE WAS TRUE FROM FRAME 0, and that is the note: the clearing was
//      already the full 580 x 760 at f0, so from the moment the camera settled
//      (~f50) to the wipe (f99) the frame held a big empty grey hole with a
//      speck of a person in the top of it, waiting for a hundred squares that
//      had not arrived. The clearing is now TWO SIZES.
//      SMALL, f0-f92: a superellipse 340 x 220 at (609, 933) — the union of the
//      person (504-576, 864-936), their ink block (588-718, 864-938) and their
//      output row (the slot row at y 976-1006 from x 495 rightwards) is
//      x 500-718 / y 864-1001, centred at (609, 932.5), so the shape sits 61px
//      clear of it sideways and 41px above and below. Same n (2.8), same
//      `clearingEdge` wobble, same per-bar hashed threshold, same feathered
//      dissolve. The sea runs right up under the person's own output, which is
//      the picture the line wants: they are IN it, not standing in a yard.
//      LARGE, f100 on: the 580 x 760 at (645, 1070) exactly as in V2.
//      The brief asked for about 340 x 190; 220 tall rather than 190 is the one
//      deviation, because at 190 the shape sits only 26px under the output row
//      and reads as clipped rather than as a hug.
//   B. The sea is now BUILT against the small clearing, so the bars that fill
//      the space the large one will need actually exist. The render-time test
//      takes the clearing for the CURRENT frame, which only ever grows, so the
//      build-time cull stays a superset and nothing is drawn that was not made.
//   C. The opening, f92 -> f100: one smoothstep on the centre and both
//      semi-axes, landing on f100 — as "hundred" is said and one frame before
//      the row-by-row wipe starts. Bars the growing edge passes ripen and fade
//      exactly as poured bars do at the clearing edge, so the sea reads as
//      pushed back and not as deleted. The one thing that had to move is the
//      WIDTH of that fade: the bottom edge travels 412px in 8 frames, 77px on
//      its fastest frame, and POUR_GONE's 25px band would fade a bar out in a
//      third of a frame — a pop by any other name. The band is therefore the
//      edge's own speed x 2 frames while the shape is opening (peaking at
//      154px) and back to 25 the moment it stops, and the ripe band widens with
//      it so the pushed-back sea carries the same colour as the poured sea.
//   D. Re-run of the exhaustive clearance check over all 12,879 bars x 146
//      frames (scratchpad grid-clear.mjs, taught the two-size clearing): ZERO
//      bars intersect the 10 x 10 grid rect from f99 on, and the closest any
//      bar comes to it is 73px at f99 and 66px at f119 — better than V2's 59,
//      because the opening lands a frame before the wipe rather than the sea
//      having been held off the grid the whole time. Before f99 the closest a
//      fully opaque bar comes to the person, the block or a landed output unit
//      is 16px; the single 4.7px approach is a bar at 9% opacity mid-dissolve
//      during the pour.
//   E. Untouched: the beats, the camera, the front, the pour rate, the output
//      ticks, the wipe, the ghost rung, the sea's own boundary.
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
  ghostOpacity: z.number(), // the faint hundred's rung
  beats: z.object({
    thatEven: z.number(), // "that even"
    ifThe: z.number(), // "if the"
    modelCan: z.number(), // "model can"
    write: z.number(), // "write"
    way: z.number(), // "way"
    moreCode: z.number(), // "more code"
    thanA: z.number(), // "than a"
    person: z.number(), // "person"
    itDoesnt: z.number(), // "it doesn't"
    makeYouA: z.number(), // "make you a"
    hundred: z.number(), // "hundred"
    timesMore: z.number(), // "times more"
    productive: z.number(), // "productive"
    end: z.number(), // speech ends; tail to 146
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
  ghostOpacity: OP_RECEDE,
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
// writing front radiates from them, the pour runs back into them, and the
// camera holds them at screen y 835 at every zoom.
// ---------------------------------------------------------------------------
const PX = 540;
const PY = 900;
const PERSON_SIZE = 72;

// Their own code: six rows of ink bars on the sea's own row pitch, top-aligned
// with the glyph's head, 12px to its right, no wider than 130px. Same material
// as the sea — a row of code is bars of hashed lengths with hashed gaps — only
// in ink and only six rows of it.
const ROW_PITCH = 14;
const BAR_H = 4;
const BLOCK_X0 = PX + PERSON_SIZE / 2 + 12; // 588
const BLOCK_W = 130;
const BLOCK_X1 = BLOCK_X0 + BLOCK_W; // 718
const BLOCK_Y0 = PY - PERSON_SIZE / 2; // 864, the head
const BLOCK_ROWS = 6;
const TYPE_F0 = 1;
const TYPE_PER_ROW = 3; // six rows, one after another, done by f19

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
// The output grid, declared here because the clearing is cut around it. Ink
// squares 20 x 20 on a 10-column, 30px grid, the FIRST SLOT DIRECTLY UNDER THE
// PERSON — slot 0's centre is x 510 against the glyph's 504-576 — running right
// to slot 9 at x 780. The first row starts 40px under the feet.
//
// The first pass centred the grid on the person instead (x0 390), which put the
// opening unit ~150px to their left with nothing above it: it read as a square
// that had wandered in rather than as their output.
// ---------------------------------------------------------------------------
const SLOT = 30;
const UNIT = 20;
const GRID_N = 10;
const SLOT0_CX = 510; // slot 0's centre, inside the glyph's 504-576
const GRID_X0 = SLOT0_CX - SLOT / 2; // 495
const GRID_Y0 = PY + PERSON_SIZE / 2 + 40; // 976
const GRID_X1 = GRID_X0 + GRID_N * SLOT; // 795
const GRID_Y1 = GRID_Y0 + GRID_N * SLOT; // 1276

// The clearing. Not a box: a superellipse around what the person owns,
// undulating by `wobble` and dissolved by a per-bar hashed threshold, so the
// sea's inner edge is ragged rather than ruled.
//
// TWO SIZES, because what the person owns changes on one word.
//
// SMALL (f0-f92) is the glyph, their ink block and their output row and nothing
// else: 340 x 220 at (609, 933). The union of the glyph (504-576, 864-936), the
// block (588-718, 864-938) and the output row (the slot row, y 976-1006, from
// x 495 rightwards) is x 500-718 / y 864-1001, centred at (609, 932.5) — so the
// shape hugs it by 61px sideways and 41px top and bottom, and the sea runs right
// up under the person's own output instead of leaving a yard around them.
//
// LARGE (f100 on) is the V2 shape, cut around the whole 10 x 10 grid as well:
// 580 x 760 at (645, 1070). The content it has to hold spans world x 495-795
// (grid) and y 864-1276 (head to last row), and it is sized so that its
// WORST-CASE contour still clears that: an individual bar survives at
// q >= edge * thr, whose minimum is (1 - 0.045 - 0.03) * (1 - 0.11) = 0.823 of
// the nominal superellipse, and measured over every bar and every frame the
// closest any bar comes to the grid rect is 73px at f99 and 66px at f119.
//
// n is 2.8 rather than 2.6, at both sizes, so the shape sits a little closer to
// the rectangle it has to hold without ever reading as one.
const CL_N = 2.8;
const CL_SM_CX = 609;
const CL_SM_CY = 933;
const CL_SM_RX = 170;
const CL_SM_RY = 110;
const CL_LG_CX = (GRID_X0 + GRID_X1) / 2; // 645
const CL_LG_CY = (BLOCK_Y0 + GRID_Y1) / 2; // 1070
const CL_LG_RX = 290;
const CL_LG_RY = 380;

type ClearingGeo = { cx: number; cy: number; rx: number; ry: number };
type Clearing = ClearingGeo & {
  mean: number; // for turning a q-distance back into px
  ripe: number; // px outside the edge within which a consumed bar is ripe
  gone: number; // px outside the edge within which it has faded out
};

const clearingEdge = (theta: number) =>
  1 + 0.045 * Math.sin(3 * theta + 1.2) + 0.03 * Math.sin(5 * theta - 0.4);
const clearQ = (x: number, y: number, c: ClearingGeo) => {
  const u = (x - c.cx) / c.rx;
  const v = (y - c.cy) / c.ry;
  const q = Math.pow(Math.pow(Math.abs(u), CL_N) + Math.pow(Math.abs(v), CL_N), 1 / CL_N);
  return { q, edge: clearingEdge(Math.atan2(v, u)) };
};

// The sea is BUILT against the SMALL clearing, so the bars that fill the space
// the large one will later need actually exist and can be pushed back rather
// than appearing out of nothing. The clearing only ever grows, so this cull is
// a superset of every frame's and nothing is drawn that was not made.
const CL_SMALL: ClearingGeo = { cx: CL_SM_CX, cy: CL_SM_CY, rx: CL_SM_RX, ry: CL_SM_RY };

// ---------------------------------------------------------------------------
// The camera. ONE move, the pull-back on "model can write" (f20): k 1.8 -> 0.75
// keyed f22-f44 with warp 0.7, so the hand's speed is early in the move and the
// damper settles it by f50 — 5 frames clear of "than" (f55). The content centre
// is the person's own y, fixed, and cy comes off the eased k every frame, so
// the person sits at screen y 835 from the first frame to the last.
//
// At k 0.75 the frame is 1440 x 2560 world px around the person: 720 either
// side, 1113 above, 1447 below. Everything the sea has to cover is inside a
// radius of 1616 (the bottom corners), which the front passes at f56.
// ---------------------------------------------------------------------------
const K_OPEN = 1.8;
const K_FINAL = 0.75;
// The horizontal centre. Not the person: the composition they are the left edge
// of. Person 504-576, ink block out to 718, grid 495-795 — so the frame's
// centre sits at 620 and the person reads as the left of a resolved block
// rather than as a glyph with everything hanging off one side. Was 540.
const CAM_CX = 620;
// Keyed f22-f42 rather than f22-f50: through the damper the zoom is at 0.37% a
// frame by f50 (k 0.7538, half a percent off its final value) and under 0.05%
// by f54 — still, by any reading, five frames before "than". The content centre
// sags at most 4 screen px, at the peak of the move.
const CAM = camMove({ f0: 22, f1: 42, k0: K_OPEN, k1: K_FINAL, c0: PY, c1: PY, warp: 0.7 });
const CAM_F = [0, ...CAM.F, DURATION];
const CAM_K = [K_OPEN, ...CAM.K, K_FINAL];
const CAM_CY = [PY + 125 / K_OPEN, ...CAM.CY, PY + 125 / K_FINAL];

// ---------------------------------------------------------------------------
// The sea. Code is horizontal bars: hashed lengths 20-70 on hashed gaps 10-30
// along a row, rows on a 14px pitch, bar height 4. The region is a superellipse
// 3800 x 4200 centred on the person — far bigger than any frame in the piece —
// with a feathered, wobbling outer boundary that is never seen at any camera
// position, before or after the pour has drawn it inward.
//
// Built once at module scope into flat arrays, culled to the frame at render
// time, and drawn as one <path> per tone bucket rather than one <rect> per bar:
// the visible set at the resolved camera is ~4,000 bars and 64 paths is what
// keeps that under a second a frame.
// ---------------------------------------------------------------------------
const SEA_RX = 1900;
const SEA_RY = 2100;
const SEA_N = 2.6;
const SEA_EDGE_FEATHER = 1.4; // in the 10-step units below
const SEA_SEED = 1.7;

// The writing front: 175 (the clearing edge) -> 1800 px from f20 to f66 on an
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
  const br: number[] = [];
  const ba: number[] = [];
  const bt: number[] = [];
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
        const cl = clearQ(cx, y, CL_SMALL);
        if (cl.q >= cl.edge * thr) {
          const r0 = Math.hypot(cx - PX, y - PY);
          bx.push(x);
          by.push(y);
          bw.push(len * (0.6 + 0.4 * fe));
          br.push(r0);
          ba.push(arriveAt(r0 + (hash(n, 33 + ph) - 0.5) * FRONT_BAND));
          bt.push(thr);
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
    r: Float32Array.from(br),
    a: Float32Array.from(ba),
    t: Float32Array.from(bt),
    n: bx.length,
  };
})();

// ---------------------------------------------------------------------------
// The pour. From "it doesn't" (f74) every bar drifts toward the person along
// its own radius, and runs that way to the last frame. The rate eases in over
// 10 frames so the sea does not lurch into motion on the word.
//
// The brief asked for a speed PROPORTIONAL to distance, so the outer rows move
// faster and the sea never thins. Built that way it does the opposite: a radial
// field with v proportional to r is a pure scaling, so it COMPRESSES — the
// tangential spacing of a ring at r shrinks by the same factor the ring does.
// At the speeds this needs, a ring at 600px crowded by a third inside three
// seconds, and the render came back as woven fabric with a starburst of rays
// converging on the person. The sea stopped reading as code.
//
// The flow that actually keeps a 2D field's density EXACTLY constant is
// v = C / r: r dr/dt = -C, so r' = sqrt(r^2 - 2Ct) and area is conserved
// everywhere. The outer rows move slower, not faster, but nothing thins and
// nothing bunches, which is what "the sea never thins" was asking for. C = 375
// is the brief's own number at the clearing edge — 2.5 world px a frame at
// r 150, where the pour is read, because that is where the code is going in —
// falling to 0.3 at the bottom of the resolved frame and 0.18 at the sea's own
// boundary, which therefore stays hundreds of px off frame for the whole piece.
// Above and below the person the rows do spread as they converge (a radial flow
// stretches radially by exactly what it compresses tangentially); at 480 that
// showed as a thin band over the person's head, at 375 it does not.
// ---------------------------------------------------------------------------
const POUR_C = 375; // r dr/dt = -C, in world px^2 per frame
const POUR_EASE = 10;
const POUR_RIPE = 120; // a bar turns ripe over the last 120px
const POUR_GONE = 25; // and is gone by the clearing edge

// Returns 2Ct: subtract it from r^2 and take the root.
const pourAt = (frame: number, f0: number) => {
  let t = 0;
  for (let f = f0; f <= frame; f++) t += smoothstep((f - f0) / POUR_EASE);
  return 2 * POUR_C * t;
};

// ---------------------------------------------------------------------------
// The clearing OPENS, f92 -> f100: one smoothstep on the centre and on both
// semi-axes, landing on f100 — as "hundred" is said, one frame before the wipe
// of the faint squares starts. The sea is not deleted out of the way: a bar the
// growing edge passes ripens and fades exactly as a poured bar does at the
// clearing edge, so what reads is the sea being pushed back to make room.
//
// The one thing that has to move with the shape is the WIDTH of that fade. The
// bottom edge travels 412px in those 8 frames — 77px on its fastest frame — and
// POUR_GONE's 25px band would take a bar from solid to gone inside a third of a
// frame, which is a pop by any other name. So while the shape is opening, the
// band is the edge's own speed times CL_OPEN_FADE_F frames (peaking at ~154px)
// and it is back to POUR_GONE the moment the shape stops; the ripe band widens
// with it, so the pushed-back sea carries the same colour as the poured sea.
// d(smoothstep)/du is 6u(1-u), so the speed is exact rather than sampled.
// ---------------------------------------------------------------------------
const CL_OPEN_F0 = 92;
const CL_OPEN_F1 = 100;
const CL_OPEN_SPAN = CL_OPEN_F1 - CL_OPEN_F0;
// the fastest-moving edge, the bottom: 1450 - 1038
const CL_OPEN_TRAVEL = CL_LG_CY + CL_LG_RY - (CL_SM_CY + CL_SM_RY);
const CL_OPEN_FADE_F = 2; // frames a bar takes to fade as that edge passes it

const clearingAt = (frame: number): Clearing => {
  const u = clamp01((frame - CL_OPEN_F0) / CL_OPEN_SPAN);
  const g = smoothstep(u);
  const rx = CL_SM_RX + (CL_LG_RX - CL_SM_RX) * g;
  const ry = CL_SM_RY + (CL_LG_RY - CL_SM_RY) * g;
  const speed = (CL_OPEN_TRAVEL * 6 * u * (1 - u)) / CL_OPEN_SPAN;
  const gone = Math.max(POUR_GONE, speed * CL_OPEN_FADE_F);
  return {
    cx: CL_SM_CX + (CL_LG_CX - CL_SM_CX) * g,
    cy: CL_SM_CY + (CL_LG_CY - CL_SM_CY) * g,
    rx,
    ry,
    mean: (rx + ry) / 2,
    ripe: Math.max(POUR_RIPE, gone),
    gone,
  };
};

// ---------------------------------------------------------------------------
// The output. The person's productivity, in the grid declared above: one unit
// lands at f0 (it has been there) and then one every 26 frames — f26, f52, f78,
// f104, f130 — a hard placement, no fade, left to right along the top row. It
// is the only thing in the piece that does not react to the sea, which is the
// line.
// ---------------------------------------------------------------------------
const TICKS = [0, 26, 52, 78, 104, 130];

// The ghost of the hundred, on "hundred" (f99). Not a plan drawn over the
// output any more: a hundred faint squares, each the same 20 x 20 as a real
// unit and in the same slot, at the ladder's dim rung. Six of them are lit and
// ninety-four are not, and the count is read off one shape.
//
// The first pass drew a dashed 10 x 10 lattice instead. It was a second kind of
// mark — a plan laid over the output rather than the output's own empties — and
// the six filled squares had to be read against a mesh instead of against their
// own ninety-four.
//
// ONE group move: a wipe from the top row down, one row a frame over f99-f108.
// No stagger inside a row and no per-square fade: a square is either there or
// it is not, exactly like a real unit landing.
// No per-icon shadow on these. A shadow is what makes a mark read as a thing
// lying on the field, and an empty slot is an absence, not a thing.

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
  ghostOpacity,
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

  // -- the sea ---------------------------------------------------------------
  // Cull to the frame first, then test the clearing, then bucket by tone. Only
  // the handful of bars actually dissolving at the clearing edge carry their own
  // opacity and are drawn on their own.
  const vx0 = cx - FRAME_W / 2 / k - 90;
  const vx1 = cx + FRAME_W / 2 / k + 90;
  const vy0 = cy - FRAME_H / 2 / k - 90;
  const vy1 = cy + FRAME_H / 2 / k + 90;

  // The pour and the plan are keyed off the beats prop, so a retime moves them
  // with the words; the front and the sea are precomputed off the same numbers.
  const pour = frame >= beats.itDoesnt ? pourAt(frame, beats.itDoesnt) : 0;
  const ripeGate = smoothstep((frame - beats.itDoesnt) / 8);
  // the clearing for THIS frame: small, opening, or large
  const cl0 = clearingAt(frame);

  const buckets: string[][] = [];
  const dissolving: { key: number; d: string; t: number; op: number }[] = [];
  for (let i = 0; i < SEA.n; i++) {
    const arrive = SEA.a[i];
    if (frame < arrive) continue;
    const p = clamp01((frame - arrive) / DRAW_T);
    let w = SEA.w[i] * p;
    if (w < 0.6) continue;

    let x = SEA.x[i];
    let y = SEA.y[i];
    if (pour > 0) {
      const r2 = SEA.r[i] * SEA.r[i] - pour;
      if (r2 <= 0) continue;
      const s = Math.sqrt(r2) / SEA.r[i];
      x = PX + (x - PX) * s;
      y = PY + (y - PY) * s;
      // The bar keeps its length. Scaling it by s as well was tried and it is
      // what makes the sea look like it is thinning around the person: the flow
      // already conserves the number of bars per unit area, so shortening each
      // one on top of that takes the ink density down by s — 29% at the
      // clearing edge by f120 — and the clearing reads as a hole opening up.
    }
    if (x + w < vx0 || x > vx1 || y < vy0 || y > vy1) continue;

    const cl = clearQ(x + w / 2, y, cl0);
    const edge = cl.edge * SEA.t[i];
    if (cl.q < edge) continue;
    const near = (cl.q / edge - 1) * cl0.mean; // px outside the clearing edge

    let t = 1 - smoothstep((frame - arrive - DRAW_T) / SETTLE_T);
    let op = 1;
    if (near < cl0.ripe && ripeGate > 0) {
      t = Math.max(t, ripeGate * (1 - near / cl0.ripe));
      if (near < cl0.gone) op = 1 - ripeGate * (1 - near / cl0.gone);
    }
    const d = `M${x.toFixed(1)} ${y.toFixed(1)}h${w.toFixed(1)}v${BAR_H}h${(-w).toFixed(1)}z`;
    if (op < 0.995) {
      dissolving.push({ key: i, d, t, op });
      continue;
    }
    const b = Math.round(clamp01(t) * TONE_STEPS);
    if (!buckets[b]) buckets[b] = [];
    buckets[b].push(d);
  }

  // -- the person's own code, typed in ---------------------------------------
  const blockReveal = (row: number) =>
    clamp01((frame - (TYPE_F0 + row * TYPE_PER_ROW)) / TYPE_PER_ROW);

  // -- the output ------------------------------------------------------------
  const units = TICKS.filter((t) => frame >= t).map((t, n) => ({
    key: t,
    x: GRID_X0 + n * SLOT + (SLOT - UNIT) / 2,
    y: GRID_Y0 + (SLOT - UNIT) / 2,
  }));

  // -- the faint hundred -----------------------------------------------------
  // The wipe: rows 0..9 turn on one a frame from f99. A row is one flat group,
  // so nothing inside it staggers and nothing fades.
  const ghostRows = Math.min(GRID_N, Math.max(0, frame - beats.hundred + 1));
  const ghost: { key: number; x: number; y: number }[] = [];
  for (let r = 0; r < ghostRows; r++) {
    for (let c = 0; c < GRID_N; c++) {
      ghost.push({
        key: r * GRID_N + c,
        x: GRID_X0 + c * SLOT + (SLOT - UNIT) / 2,
        y: GRID_Y0 + r * SLOT + (SLOT - UNIT) / 2,
      });
    }
  }

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
            {/* the sea: one path per tone bucket, then the bars dissolving into
                the person, which carry their own opacity */}
            {buckets.map((d, b) =>
              d ? <path key={b} d={d.join("")} fill={tone(b / TONE_STEPS)} /> : null,
            )}
            {dissolving.map((d) => (
              <path key={`x${d.key}`} d={d.d} fill={tone(d.t)} opacity={d.op} />
            ))}

            {/* the faint hundred: no shadow, they are absences */}
            <g opacity={ghostOpacity}>
              {ghost.map((s) => (
                <rect key={s.key} x={s.x} y={s.y} width={UNIT} height={UNIT} fill={ink} />
              ))}
            </g>

            {/* the output units */}
            <g style={{ filter: icon }}>
              {units.map((u) => (
                <rect
                  key={u.key}
                  x={u.x}
                  y={u.y}
                  width={UNIT}
                  height={UNIT}
                  fill={ink}
                  opacity={OP_READ}
                />
              ))}
            </g>

            {/* the person's own code, typed in row by row */}
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
