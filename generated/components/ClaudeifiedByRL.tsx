import { loadFont } from "@remotion/fonts";
import { AbsoluteFill, Easing, interpolate, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  BG_BASE,
  BG_DIM,
  CAM_LIFT,
  DOT_RADIUS,
  GridBackground,
  ICON_SHADOW_BLUR,
  ICON_SHADOW_OPACITY,
  ICON_SHADOW_Y,
  OP_READ,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  WOBBLE_R,
  breath,
  camMove,
  clamp,
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
import { CLAUDE, DEEPSEEK, MINIMAX, MOONSHOT, type BrandGlyph } from "./brandGlyphs";

export const FPS = 24;
// John / Charles / Beren, clip `JohnCharlesBeren_Claude_Distilled`, cut 3:
// "So I think that kind of diversity has definitely been cut down by RL a lot."
//
// SRT span 0:25.899 -> 0:31.079 at 24fps.
// round((31.079 - 25.899) * 24) = round(5.180 * 24) = round(124.32) = 124
// frames of speech, plus the standard 16 frame tail so the resolved state
// holds = 140.
export const DURATION = 140;

// ---------------------------------------------------------------------------
// "Claudeified". Cut 1's world, later in the same clip: the same three open
// weight marks, the same 64-dot blob of mixed-tone outputs under each one, the
// same narrow three-wide column they comb into. What is new is WHERE the change
// comes from. RL is not a label here, it is a line: one white rule across the
// field, fixed in the world, named `RL` at its left end. The three models
// descend through it in ONE continuous motion, and everything that crosses it
// is changed BY it —
//   * an output dot that crosses combs into its column seat and ramps
//     ripe -> deep;
//   * a mark that crosses is the Claude mark below the line and its own glyph
//     above it. Both are drawn at the same centre, clipped at the line's own y,
//     so the whale / the globe / the wave shrinks away from the bottom while
//     the Claude asterisk grows from the bottom. No occluder, no morph, no
//     flash: a wipe at a line.
// The camera tilts down with the descent, so the line reads as sweeping UP
// through them — "cut down".
//
// Every gesture is one word. Nothing else happens.
//   the three marks at rest, no outputs yet          — "so I think"       f0
//   the three output blobs spray out from under
//     their marks, cut 1's arrival: dots leave the
//     mark's bottom edge on individual shallow arcs,
//     top-of-blob seats first, arrivals f15 -> f36,
//     each already in its own tone; then they sit
//     and breathe                                    — "that kind of
//                                                       diversity"        f12-36
//   the RL line draws head-led across the frame,
//     left to right, one ease, 8 frames              — "been cut"         f50-58
//   THE ONE BIG MOTION: the whole group — three
//     marks and their 3 x 64 dots — descends dy
//     0 -> 560 on one smoothstep. Its consequences
//     are not separate gestures: a dot combs to its
//     column seat on a 12-frame smoothstep from the
//     frame ITS OWN world y crosses 1040 (the blob's
//     bottom around f80, its top around f92, so the
//     comb is a sweep up the blob), and the marks' centres
//     cross at dy 480 (f99) and are fully through
//     at dy 532 (f104) — all three together, one
//     flip, not three                                — "cut down"         f56-112
//   the readout `RL` rises 10px and fades in at the
//     line's left end                                — "by RL"            f96-104
//   the ONE camera move: a tilt, no zoom. Content
//     centre 664 -> 1160 at k 1.35, warp 0.72,
//     keyed f56-100 so the damper lands it by f104   — "down by RL"       f56-104
//   hold resolved, never fades                       — "a lot" / tail     f113-140
//
// ambient: `sway` on the camera and `breath` on every seated dot. Nothing else
// moves. No threads, no packets, no rings, no flashes — cut 1 owns the siphon;
// this cut owns the line.
// ---------------------------------------------------------------------------

// -- type --------------------------------------------------------------------
// Söhne Kräftig, at module scope, the way `explainerShared.tsx` loads it and the
// way cut 1 loads it, so a font failure surfaces before a single frame is drawn.
// One readout, one weight, no fallback stack: if it does not load the render is
// wrong and should look wrong.
const LABEL_FONT = "SohneKraftig";
loadFont({
  family: LABEL_FONT,
  url: staticFile("Sohne-Kraftig.otf"),
  weight: "500",
});

export const schema = z.object({
  ink: z.string(),
  accent: z.string(), // ripe: half the blob
  accentDeep: z.string(), // deep: the other half, and every dot after the line
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
  readout: z.string(),
  beats: z.object({
    soIThink: z.number(), // "so I think"
    thatKindOf: z.number(), // "that kind of"
    diversity: z.number(), // "diversity"
    has: z.number(), // "has"
    definitely: z.number(), // "definitely"
    beenCut: z.number(), // "been cut"
    downByRL: z.number(), // "down by RL"
    aLot: z.number(), // "a lot"
    end: z.number(), // speech ends; tail to 140
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
  dotRadius: DOT_RADIUS,
  readout: "RL",
  beats: {
    soIThink: 0,
    thatKindOf: 12,
    diversity: 26,
    has: 36,
    definitely: 45,
    beenCut: 53,
    downByRL: 94,
    aLot: 113,
    end: 124,
  },
});

const WORLD_W = 1080;
const WORLD_H = 2200;

// ---------------------------------------------------------------------------
// Layout, in world px. Cut 1's material at cut 1's sizes, lifted so the whole
// group has 560px of room to fall through the line without leaving the frame.
//
//   marks        104px, y 560, x 300 / 540 / 780 (cut 1's three, cut 1's size)
//   blobs        cut 1 v2's output shape: a feathered superellipse (n 2.4),
//                230 x 180, centred on (x_mark, mark_y + 170) = (x, 730), so it
//                spans y 640..820 and x +/- 115 and the three leave a ~10px gap
//   columns      three wide at x + {-13, 0, +13}, 14px pitch, top row 640,
//                22 rows to 934 — cut 1 v2's column, hung off the blob's top
//   the line     y 1040, world x -40 -> 1120, fixed; it never moves
//   the readout  `RL`, Söhne Kräftig 42 world px (56 screen px at k 1.35),
//                baseline y 1022, left-aligned at world x 190 — the left end of
//                the line AS FRAMED: at k 1.35 the frame only reaches world
//                x 140, so the brief's x 60 would be off the left edge
//
// After the descent the marks sit at y 1120 and the columns hang from 1200 to
// 1494 under them, with the line and its readout above.
// ---------------------------------------------------------------------------
const AXIS = 540;

const MARK_Y = 560;
const MARK_SIZE = 104;
const MARK_BOTTOM = MARK_Y + MARK_SIZE / 2; // 612

const MODELS: { name: string; glyph: BrandGlyph; x: number }[] = [
  { name: "DeepSeek", glyph: DEEPSEEK, x: 300 },
  { name: "Moonshot", glyph: MOONSHOT, x: AXIS },
  { name: "MiniMax", glyph: MINIMAX, x: 780 },
];

const BLOB_N = 64;
const BLOB_CY = MARK_Y + 170; // 730
const BLOB_A = 115; // half-width
const BLOB_B = 90; // half-height
const BLOB_POW = 2.4; // the superellipse exponent: the style's fleet shape
const BLOB_TOP = BLOB_CY - BLOB_B; // 640
const BLOB_BOTTOM = BLOB_CY + BLOB_B; // 820

const COL_DX = 13;
const COL_WIDE = 3;
const COL_PITCH = 14;
const COL_TOP = BLOB_TOP; // 640: the column hangs from the blob's own top
const COL_ROWS = Math.ceil(BLOB_N / COL_WIDE); // 22, three dots to a row

// The line. Snapped to a half pixel with an odd stroke width so it does not
// shimmer, and run 40px past both frame edges: at k 1.0 the frame is exactly
// 1080 world px wide and `sway` drifts the camera +/-3px sideways, so a line
// drawn from 0 to 1080 would show a few px of bare field at one end or the
// other. The clip that splits every mark is this same y, so the wipe and the
// rule are one number.
const LINE_Y = 1040.5;
const LINE_X0 = -40;
const LINE_X1 = WORLD_W + 40;
const READOUT_X = 190;
const READOUT_BASELINE = 1022;
const READOUT_SIZE = 42; // world px; 56.7 screen px at k 1.35, the brief's size

// The descent: one smoothstep, warp 1, no spring, no overshoot.
const DESC_F0 = 56;
const DESC_F1 = 112;
const DESC_DY = 560;
// How long a dot takes to glide from its blob seat to its column seat, and on
// what curve. The brief asked for an 8-frame ease-out; it is a 12-frame
// smoothstep, for two measured reasons. Cut 1 v2's column is 294 world px tall
// where the blob is 180, so the fold is a much longer journey than the 2-wide
// column it was written against — the longest is ~180 px — and an 8-frame
// ease-out front-loads a third of that into the first frame: 82 screen px a
// frame at k 1.35, nearly double the 45 px/frame cap the brief itself sets.
// A smoothstep has no such step at its start, and 12 frames brings the peak to
// 42.6 px a frame, under the cap, with the last dot seated at f103.9 — the same
// frame the marks finish crossing, so the comb and the flip resolve together.
// It is also cut 1's own contraction curve, so the two cuts fold on one easing.
const COMB_DUR = 12;

// The camera's content centre, before and after. `CAM_LIFT` puts whatever world
// y is named here at screen 835 whatever the zoom, so these two numbers are the
// framing.
//
// Both are re-derived for cut 1 v2's geometry and for k 1.35 (the brief's 780
// and 1180 were written for the triangular fan at k 1.0):
//   f0-56   the opening block is the three marks (508..612) and their blobs
//           (640..820): centre 664. At k 1.35 the frame reaches world x 140..940
//           and the blobs span 185..895, so the side margins are 61 screen px.
//   f104-   the resolved block is the readout (from 992), the line (1040.5), the
//           marks (1068..1172) and the columns (1200..1494): centre 1243.
//
// It does NOT resolve on 1243, and that is a deliberate trade. The relative
// motion — the group through the line — is 560 world px whatever the camera
// does; the camera only decides how that is split between the group going down
// and the line coming up. Keyed to the block centre the camera would travel 579
// against the group's 560, the group would be pinned on screen and the piece
// would read as a rising line with a static subject. Keyed to 1160 the camera
// travels 496: the line still sweeps 670 screen px UP through the group — which
// is what the gesture is for — and the group still descends 86 screen px, so it
// is visibly falling and not merely being tracked. The cost is that the
// resolved block centre sits at screen 947 rather than 835, with the column
// bottom at 1286 and the readout top at 608 — the whole block inside the frame
// and clear of the caption band from ~1450.
const CONTENT_0 = 664;
const CONTENT_1 = 1160;

// smoothstep's inverse, so a dot can be asked the exact frame its own world y
// crosses the line rather than being told by a parallel timer.
const invSmooth = (u: number) => 0.5 - Math.sin(Math.asin(1 - 2 * clamp01(u)) / 3);

/** how far the group has fallen at frame f */
const dropAt = (f: number) => DESC_DY * smoothstep((f - DESC_F0) / (DESC_F1 - DESC_F0));
/** the frame at which world y `y0` (a group coordinate) reaches the line */
const crossFrame = (y0: number) =>
  DESC_F0 + (DESC_F1 - DESC_F0) * invSmooth((LINE_Y - y0) / DESC_DY);

// ---------------------------------------------------------------------------
// The camera. ONE move, and it is a TILT: k never changes — it sits at 1.35,
// where cut 1 v2 resolves, so the two cuts are the same size in the edit. The
// group falls 560 and the camera follows it down 496, so the group still
// travels on screen — but the line, which is fixed in the world, rises 670
// screen px through it. That is the whole trick of the cut: "cut down" is the
// models going down, and what you watch is the line coming up.
//
// `camMove` writes it as a warped smoothstep, one key per frame, and takes cy
// from the eased k (constant here) so the composition cannot sag against its
// own zoom; `runCamera` damps it. Warp 0.72 puts the speed early, so the camera
// is already travelling under "cut" and settling under "by RL".
//
// It is keyed f56-100, not f56-104, because the damper lags its target — cut 1
// v2 re-keyed its own move for exactly this reason. Keyed to f104 the frame was
// still 12 screen px short of its landing ON f104 and did not fall under 1 px a
// frame until f110; keyed to f100 it is 3.5 px short at f104 and under 1 px a
// frame from f106, which is the landing this move was written for, seven frames
// ahead of "a lot" (f113). Same content centres, same warp, same damper, one
// move — it peaks at 22 screen px a frame and is dead still by f110.
// ---------------------------------------------------------------------------
const K_HOLD = 1.35;
const CAM = camMove({
  f0: 56,
  f1: 100,
  k0: K_HOLD,
  k1: K_HOLD,
  c0: CONTENT_0,
  c1: CONTENT_1,
  warp: 0.72,
});
const CAM_F = [0, ...CAM.F, DURATION];
const CAM_K = [K_HOLD, ...CAM.K, K_HOLD];
const CAM_CY = [CONTENT_0 + CAM_LIFT / K_HOLD, ...CAM.CY, CONTENT_1 + CAM_LIFT / K_HOLD];

// ---------------------------------------------------------------------------
// The outputs. Cut 1 v2's seat generator, unchanged apart from the blob's y:
// the same 64 seats per model in the style's fleet shape — a superellipse
// (n 2.4) 230 x 180 world px, rejection-sampled so the seats are area-uniform
// inside it rather than piling up at the centre — the same undulating feathered
// boundary (the undulation runs on the parametric angle through `WOBBLE_R`, so
// it closes on itself with no seam), the same 16px minimum separation across
// all three blobs, the same hashed half-and-half mix of ripe and deep (the mixed
// tone IS the diversity), and the same three-wide 14px-pitch column, ranked by
// depth so the blob folds into it without crossing.
//
// What is new is per seat: the frame its own world y crosses the line, and
// therefore the frame it combs. A seat at the blob's bottom crosses at f80 and
// one at its top at f92, so the comb is one continuous sweep UP the blob rather
// than a cue — and because the column is 294 tall where the blob is 180, and is
// hung from the blob's own top, every seat's column y is at or below its blob y.
// A combing dot therefore only ever travels DOWN the frame, and nothing that
// has passed under the line ever comes back up through it.
// ---------------------------------------------------------------------------
const SEAT_STEP = 11; // world px, the unit `feather` measures its falloff in
const BLOB_FEATHER = 3; // steps; ~33 world px of dissolve at the blob's edge
const MIN_SEP = 16;
const EDGE_WOBBLE = 1.8;

type Seat = {
  m: number;
  fx: number;
  fy: number;
  cx: number;
  cy: number;
  ripe: number;
  sx: number; // where it leaves the mark's bottom edge
  sy: number;
  arc: number;
  t0: number;
  dur: number;
  comb: number; // the frame its blob seat crosses the line
  seed: number;
};

const SEATS: Seat[] = (() => {
  const out: Seat[] = [];
  for (let m = 0; m < MODELS.length; m++) {
    const cxm = MODELS[m].x;
    const mine: { x: number; y: number; v: number; i: number }[] = [];
    for (let i = 0; mine.length < BLOB_N && i < 60000; i++) {
      const dx = (2 * hash(i, 20 + m * 3) - 1) * BLOB_A;
      const dy = (2 * hash(i, 21 + m * 3) - 1) * BLOB_B;
      const x = cxm + dx;
      const y = BLOB_CY + dy;
      // how far out this seat is, as a fraction of the boundary along its own
      // ray: 1 is exactly on the edge, so the distance left to the edge is
      // |d| * (1/r - 1), in world px, which is what `feather` wants
      const r = Math.pow(
        Math.pow(Math.abs(dx) / BLOB_A, BLOB_POW) + Math.pow(Math.abs(dy) / BLOB_B, BLOB_POW),
        1 / BLOB_POW,
      );
      const d = Math.hypot(dx, dy);
      const toEdge = r < 1e-6 ? BLOB_B : d * (1 / r - 1);
      // the nominal edge undulates, by angle, so it is periodic around the loop
      const inSteps =
        (toEdge + wobble(Math.atan2(dy, dx) * WOBBLE_R, 0.9 + m) * EDGE_WOBBLE) / SEAT_STEP;
      if (hash(i, 71 + m) >= feather(inSteps, BLOB_FEATHER)) continue;
      // no clumps, and no interleaving where two blobs come within 10px
      let clash = false;
      for (const s of out) {
        if (Math.hypot(s.fx - x, s.fy - y) < MIN_SEP) {
          clash = true;
          break;
        }
      }
      if (!clash) {
        for (const s of mine) {
          if (Math.hypot(s.x - x, s.y - y) < MIN_SEP) {
            clash = true;
            break;
          }
        }
      }
      if (clash) continue;
      mine.push({ x, y, v: (y - BLOB_TOP) / (2 * BLOB_B), i });
    }

    // ranked top of blob first, and each row of three ordered left to right, so
    // the fold neither crosses itself nor swaps a dot's side
    const rank = mine.map((_, n) => n).sort((a, b) => mine[a].y - mine[b].y);
    for (let r = 0; r < rank.length; r += COL_WIDE) {
      const row = rank.slice(r, r + COL_WIDE).sort((a, b) => mine[a].x - mine[b].x);
      row.forEach((n, j) => {
        rank[r + j] = n;
      });
    }

    rank.forEach((n, r) => {
      const s = mine[n];
      const row = Math.floor(r / COL_WIDE);
      const i = s.i;
      const sx = cxm + (hash(i, 30 + m) - 0.5) * 70;
      const sy = MARK_BOTTOM;
      const travel = Math.hypot(s.x - sx, s.y - sy);
      out.push({
        m,
        fx: s.x,
        fy: s.y,
        // three wide: -COL_DX, 0, +COL_DX, in the row's own left-to-right
        // order. 64 is not a multiple of three, so the last row holds one dot
        // and it is centred rather than left in the left-hand slot.
        cx:
          cxm +
          ((r % COL_WIDE) - (Math.min(COL_WIDE, rank.length - row * COL_WIDE) - 1) / 2) * COL_DX,
        cy: COL_TOP + row * COL_PITCH,
        ripe: hash(i, 33 + m) < 0.5 ? 1 : 0,
        sx,
        sy,
        // the blob's top seats first: arrivals run 15 -> 36 with depth, and the
        // three blobs are offset 0 / 1.5 / 3 frames so they never spray together
        t0: 12 + 9 * s.v + m * 1.5,
        dur: 3 + 9 * s.v + (hash(i, 34 + m) - 0.5) * 1.4,
        arc: (hash(i, 35 + m) - 0.5) * Math.min(90, travel * 0.32),
        comb: crossFrame(s.y),
        seed: i * 7 + m,
      });
    });
  }
  return out;
})();

// Two things the whole cut rests on, checked once rather than trusted: every
// model kept all 64 of its seats, and the outputs start ABOVE the line — the
// comb is the line reaching them, so a blob that already straddled it would
// have nothing to cross.
if (SEATS.length !== BLOB_N * MODELS.length) {
  throw new Error(`ClaudeifiedByRL: ${SEATS.length} seats, expected ${BLOB_N * MODELS.length}`);
}
if (BLOB_BOTTOM >= LINE_Y || COL_TOP + (COL_ROWS - 1) * COL_PITCH <= BLOB_BOTTOM) {
  throw new Error("ClaudeifiedByRL: the column must hang below a blob that starts above the line");
}

// ---------------------------------------------------------------------------
// A mark at the line. The model's own glyph and the Claude asterisk are drawn
// at the SAME centre and the same 104px em, clipped to the two sides of the
// line's y — so while the mark sinks through, one shrinks from the bottom and
// the other grows from the bottom, at exactly the same rate, with nothing
// between them.
//
// The shadow is on the WRAPPER, not on either half: a filter on a clipped half
// would cast the cut edge's own shadow along the line and read as a smudge
// under it. On the wrapper the two halves composite first and only the outside
// of the union is shadowed, which is what a mark lying on the field looks like.
//
// `clipPathUnits` is the default (userSpaceOnUse), and the rects are written in
// the same user space the paths are drawn in — the world — so the boundary is
// the line's own y and not an offset of it.
// ---------------------------------------------------------------------------
const Glyph: React.FC<{ glyph: BrandGlyph; x: number; y: number; size: number; ink: string }> = ({
  glyph,
  x,
  y,
  size,
  ink,
}) => (
  <g transform={`translate(${x} ${y.toFixed(3)}) scale(${(size / 24).toFixed(5)}) translate(-12 -12)`}>
    {glyph.paths.map((d, i) => (
      <path key={i} d={d} fill={ink} fillRule="evenodd" />
    ))}
  </g>
);

const ClaudeifiedByRL: React.FC<Props> = ({
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
  readout,
  beats,
}) => {
  const frame = useCurrentFrame();
  // 0 = deep, 1 = ripe. Built once per frame, read per dot.
  const tone = makeTone(accentDeep, accent);

  // -- the one big motion ----------------------------------------------------
  const dy = dropAt(frame);

  // -- the outputs -----------------------------------------------------------
  // A dot's position is its own arrival, then the group's fall, then its own
  // comb — and the comb starts on the frame ITS world y reaches the line, which
  // is derived from the fall, not timed alongside it.
  const dots = SEATS.map((s) => {
    if (frame < s.t0) return null;
    const lin = clamp01((frame - s.t0) / s.dur);
    const e = Easing.out(Easing.cubic)(lin);
    const dx = s.fx - s.sx;
    const dvy = s.fy - s.sy;
    const L = Math.hypot(dx, dvy) || 1;
    const bow = Math.sin(Math.PI * e) * s.arc;
    const ax = s.sx + dx * e + (-dvy / L) * bow;
    const ay = s.sy + dvy * e + (dx / L) * bow;
    const q = smoothstep((frame - s.comb) / COMB_DUR);
    return {
      x: ax + (s.cx - ax) * q,
      y: ay + (s.cy - ay) * q + dy,
      tone: s.ripe * (1 - q),
      fade: smoothstep(lin / 0.2),
      seated: lin >= 1,
      seed: s.seed,
    };
  });

  // -- the line --------------------------------------------------------------
  const drawn = interpolate(frame, [beats.beenCut - 3, beats.beenCut + 5], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  const headX = LINE_X0 + (LINE_X1 - LINE_X0) * drawn;

  // -- the readout -----------------------------------------------------------
  const readIn = interpolate(frame, [beats.downByRL + 2, beats.downByRL + 10], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });

  // -- camera ----------------------------------------------------------------
  const cam = runCamera(frame, CAM_F, CAM_CY, CAM_K);
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = AXIS + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);

  // -- the per-icon shadow ---------------------------------------------------
  // On every icon — the six glyph halves, the line, the readout. Screen px
  // divided by k, so it is the same shadow at every camera position. The dots
  // are the field, not icons, and get nothing.
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
              <clipPath id="cbr-above">
                <rect x={-400} y={-1200} width={WORLD_W + 800} height={LINE_Y + 1200} />
              </clipPath>
              <clipPath id="cbr-below">
                <rect x={-400} y={LINE_Y} width={WORLD_W + 800} height={WORLD_H} />
              </clipPath>
            </defs>

            {/* the outputs: the blobs, and then the columns they comb into */}
            {dots.map((d, i) =>
              d ? (
                <circle
                  key={i}
                  cx={d.x}
                  cy={d.y}
                  r={dotRadius * (d.seated ? breath(frame, hash(d.seed, 9)) : 1)}
                  fill={tone(d.tone)}
                  opacity={d.fade}
                />
              ) : null,
            )}

            {/* the marks: each one its own glyph above the line and the Claude
                mark below it, same centre, same em, clipped at the line's y */}
            {MODELS.map((mod) => (
              <g key={mod.name} style={{ filter: icon }}>
                <g clipPath="url(#cbr-above)">
                  <Glyph glyph={mod.glyph} x={mod.x} y={MARK_Y + dy} size={MARK_SIZE} ink={ink} />
                </g>
                <g clipPath="url(#cbr-below)">
                  <Glyph glyph={CLAUDE} x={mod.x} y={MARK_Y + dy} size={MARK_SIZE} ink={ink} />
                </g>
              </g>
            ))}

            {/* RL: one line, fixed in the world, drawn head-led and then left
                alone. It goes over the marks, so the seam of every wipe is the
                rule itself. */}
            {drawn > 0 ? (
              <g style={{ filter: icon }}>
                <line
                  x1={LINE_X0}
                  y1={LINE_Y}
                  x2={headX}
                  y2={LINE_Y}
                  stroke={ink}
                  strokeWidth={3}
                  strokeLinecap="butt"
                  opacity={OP_READ}
                />
                {drawn < 1 ? (
                  <circle cx={headX} cy={LINE_Y} r={4} fill={ink} opacity={OP_READ} />
                ) : null}
              </g>
            ) : null}

            {readIn > 0 ? (
              <g style={{ filter: icon }} opacity={readIn}>
                <text
                  x={READOUT_X}
                  y={READOUT_BASELINE + 10 * (1 - readIn)}
                  fill={ink}
                  textAnchor="start"
                  style={{
                    fontFamily: LABEL_FONT,
                    fontWeight: 500,
                    fontSize: READOUT_SIZE,
                  }}
                >
                  {readout}
                </text>
              </g>
            ) : null}
          </svg>
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default ClaudeifiedByRL;
