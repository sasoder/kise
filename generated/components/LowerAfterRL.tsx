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
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
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
  WOBBLE_R,
  worldTransform,
} from "./fieldShared";
import { CLAUDE, DEEPSEEK, MINIMAX, MOONSHOT, type BrandGlyph } from "./brandGlyphs";

export const FPS = 24;
// John / Charles / Beren, clip `JohnCharlesBeren_Claude_Distilled`, cut 1:
// "...people are distilling mostly from Claude, like all the open weight
// models, right? The diversity of their outputs is a lot lower after RL..."
//
// SRT span 0:03.259 (the word "Claude") -> 0:08.179 (the end of "RL") at 24fps.
// round((8.179 - 3.259) * 24) = round(4.920 * 24) = round(118.08) = 118 frames
// of speech, plus a 24 frame tail — longer than the usual 16, so the label
// lands and holds — = 142.
export const DURATION = 142;

// ---------------------------------------------------------------------------
// "The siphon". Claude is the source: the three open-weight models named in the
// news hang off it on threads and the distillate flows DOWN into them,
// continuously, for the whole piece. Their outputs spread out wide in two tones;
// then RL squeezes every spread into one narrow column of the same dots, all one
// tone. The count never changes — only the spread does, and that is the line.
//
// Everything is the field's own material: white glyphs with the per-icon
// shadow, accent threads at stroke 3, white packets, solid two-tone dots, one
// Söhne label. No boxes, no arrows, no props, no rings, no flashes.
//
// Every gesture is one word. Nothing else happens.
//   the Claude mark lands, opacity and scale on
//     one ease-out, camera tight on it at k 1.8    — "Claude"          f0-8
//   the ONE camera move: k 1.8 -> 1.35, content
//     centre 560 -> 900, warp 0.72, keyed f6-21;
//     through the damper it leaves f10 and lands
//     f24, eight frames ahead of "models"           — "like all the
//                                                     open weight"     f10-24
//   three threads draw head-led from Claude's
//     bottom edge down to the three marks, never
//     in unison (6, 8 and 10 frames); each mark
//     lands under its own thread's head over 6
//     frames as it arrives                         — "the open weight" f21-37
//   packets start running down the threads,
//     Claude -> model, and never stop              — "models, right?"  f40
//   64 dots per model leave the bottom edge of
//     their mark on shallow arcs and take their
//     blob seats, top seats first, bottom seats
//     last, each already in its own tone           — "the diversity of
//                                                     their outputs"   f49-68
//   THE ONE BIG MOTION: every blob dot travels to
//     its column seat on one shared smoothstep
//     (hashed delay <= 3 frames, no spring, no
//     overshoot) and every ripe dot ramps to deep
//     over the same window. Same 64 dots, same
//     radius; the spread is gone                   — "a lot lower"     f84-100
//   the label rises 10px and fades in, and holds   — "after RL"        f99-107
//   hold resolved, never fades                     — tail              f118-142
//
// ambient: `sway` on the camera, `breath` on every seated dot, and the packets
// on the threads from f40 to the last frame. They are not gestures; the siphon
// is what a running thing looks like.
//
// --- v2 pass ---------------------------------------------------------------
// Three things, and nothing else moved. Beats, gesture list, mechanisms, tone
// ramp, timings, mark sizes, thread weight, packet size and DOT_RADIUS are all
// exactly as they were.
//
//  1. THE OUTPUTS ARE A BLOB, NOT A FAN. A downward triangle of dots under a
//     mark with an asterisk above it read as a Christmas tree. The outputs are
//     now the style's fleet shape: a wide feathered superellipse (n 2.4) centred
//     on (x_mark, 1010), 230 x 180 world px, so the three leave a ~10px gap at
//     x 415/425 and 655/665. Same 64 dots, same radius, same mixed tone by hash,
//     same 16px seat separation, same arrival mechanism and timing (t0 = 49 +
//     8v, dur = 3 + 8v, 3-frame fade; measured first arrival f51.9, last f66.7,
//     the last landing on "outputs" at f66 — the feathered edge keeps the
//     deepest seat a shade off v = 1) — only the seat field changed, and with
//     it the arrival rank, which now runs top-of-blob first instead of apex
//     first.
//  2. THE COMPOSITION IS BIGGER IN FRAME. The columns went 2 wide at an 11px
//     pitch — which read as a solid bar — to 3 wide at x_mark + {-13, 0, +13}
//     with a 14px pitch, top row 920, 22 rows, bottom 1214. The label moved
//     1380 -> 1300. The content span is now 485..1320 (centre 900) instead of
//     485..1400 (centre 960), and the camera resolves at k 1.35 instead of 1.0:
//     `camMove({f0: 6, f1: 21, k0: 1.8, k1: 1.35, c0: 560, c1: 900, warp: .72})`
//     — same frames, same warp, same damper, one move still. At rest the content
//     centre lands at screen y 835 and the composition spans screen y 275..1402,
//     clear of the caption band. Nothing was scaled in world px.
//  3. THE CONTRACTION GATHERS A BLOB. Unchanged in code — one shared smoothstep
//     f84 (+ hashed 0-3) -> f100, ripe -> deep on the same window — but it now
//     folds the blob rather than a fan. Peak screen speed measured at 19.4 px
//     a frame (f93) at k 1.35, well under the 45 px/frame close-up cap.
// ---------------------------------------------------------------------------

// -- type --------------------------------------------------------------------
// Söhne Kräftig, at module scope, the way `explainerShared.tsx` loads it, so a
// font failure surfaces before a single frame is drawn. One label, one weight,
// no fallback stack: if it does not load the render is wrong and should look
// wrong.
const LABEL_FONT = "SohneKraftig";
loadFont({
  family: LABEL_FONT,
  url: staticFile("Sohne-Kraftig.otf"),
  weight: "500",
});

export const schema = z.object({
  ink: z.string(),
  accent: z.string(), // ripe: half the blob, and every thread
  accentDeep: z.string(), // deep: the other half, and every dot after RL
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
  label: z.string(),
  beats: z.object({
    claude: z.number(), // "Claude"
    likeAll: z.number(), // "like all"
    openWeight: z.number(), // "the open weight"
    modelsRight: z.number(), // "models, right?"
    diversity: z.number(), // "the diversity"
    ofTheir: z.number(), // "of their"
    outputs: z.number(), // "outputs is"
    aLotLower: z.number(), // "a lot lower"
    after: z.number(), // "after"
    rl: z.number(), // "RL"
    end: z.number(), // speech ends; tail to 142
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
  label: "RL — reinforcement learning",
  beats: {
    claude: 0,
    likeAll: 9,
    openWeight: 21,
    modelsRight: 32,
    diversity: 49,
    ofTheir: 59,
    outputs: 66,
    aLotLower: 85,
    after: 97,
    rl: 105,
    end: 118,
  },
});

const WORLD_W = 1080;
const WORLD_H = 2200;

// ---------------------------------------------------------------------------
// Layout, in world px. Phone-first: ONE centred column on x = 540, nothing
// parked at an edge, every label centred on the same axis. The composition
// spans y 485 (the top of the Claude mark) to 1320 (under the label), so its
// centre is 900 — that is the camera's resolved content centre.
// ---------------------------------------------------------------------------
const AXIS = 540;

const CLAUDE_Y = 560;
const CLAUDE_SIZE = 150; // the 24-unit box scaled to 150; Claude's ink fills it
const CLAUDE_BOTTOM = CLAUDE_Y + CLAUDE_SIZE / 2; // 635

const MARK_Y = 840;
const MARK_SIZE = 104;
const MARK_BOTTOM = MARK_Y + MARK_SIZE / 2; // 892

// The three open-weight models, left to right. `drawDur` is how long that
// model's thread takes to reach it: the centre one is half the distance of the
// outer two, so they are given 6 / 8 / 10 frames rather than one speed — three
// heads arriving together reads as a machine, not as three things happening.
const MODELS: { name: string; glyph: BrandGlyph; x: number; drawDur: number }[] = [
  { name: "DeepSeek", glyph: DEEPSEEK, x: 300, drawDur: 8 },
  { name: "Moonshot", glyph: MOONSHOT, x: AXIS, drawDur: 6 },
  { name: "MiniMax", glyph: MINIMAX, x: 780, drawDur: 10 },
];

const THREAD_Y0 = CLAUDE_BOTTOM + 5; // 640, just clear of Claude's bottom edge
const THREAD_Y1 = 780; // 60px above a mark's centre, 8px above its top edge

// The outputs: a wide feathered blob under each mark — the style's fleet shape,
// a superellipse at n 2.4, 230 x 180 world px. Its top edge sits at 920, just
// under the mark, and half-width 115 leaves the three blobs a ~10px gap at
// x 415/425 and 655/665, so they read as three clouds and never touch.
const BLOB_N = 64; // dots per model
const BLOB_CY = 1010;
const BLOB_A = 115; // half-width
const BLOB_B = 90; // half-height
const BLOB_POW = 2.4; // the superellipse exponent: rounder than an ellipse, no corners
const BLOB_TOP = BLOB_CY - BLOB_B; // 920

// The column after RL: the same 64 dots, three wide at a 14px pitch. Two wide
// at 11 read as a solid bar at this zoom; three wide at 14 is a countable
// column of dots. 64 over three per row is 22 rows, 920 -> 1214.
const COL_DX = 13;
const COL_PITCH = 14;
const COL_TOP = 920;
const COL_WIDE = 3;

const LABEL_Y = 1300;
const LABEL_SIZE = 48;

const CONTENT_CENTRE = 900;

// ---------------------------------------------------------------------------
// The camera. ONE move, and it is the whole of "like all the open weight": the
// piece opens tight on the Claude mark alone at k 1.8 with the mark at the
// content centre, and pulls back to k 1.35 with the whole siphon at the content
// centre. `camMove` writes it as a warped smoothstep, one key per frame, and
// takes cy from the eased k so the composition never sags against its own zoom;
// `runCamera` damps it. Warp 0.72 puts the speed early in the move so it is
// travelling while "like all" is still being said and settling under "the open
// weight". Nothing moves the camera again — the siphon carries the rest.
//
// It is keyed f6-21, not f6-24, because the damper lags its target: keyed to
// f24 the zoom was still running at 1.3% a frame ON f24 and did not fall under
// 1% a frame — the speed at which a zoom stops reading as a move at all —
// until f26, four frames later than the landing this move is supposed to have.
// Keyed to f21 it leaves at f10 (one frame after "like all", f9), peaks at
// 2.36% a frame, and is under 1% a frame from f24: the landing frame the move
// was written for, eight frames ahead of "models" (f32). Same k, same content
// centres, same warp, same shape — one deceleration lobe and one settle lobe —
// and it is fully at rest by f31.
//
// v2: the whole move was scaled up by a third — 1.35 -> 1.0 became 1.8 -> 1.35,
// and the content centre 960 -> 900 with the label and the columns pulled up —
// because the composition sat small in the frame. The ratio k0/k1 is unchanged
// (1.333), so the move's shape, its speed profile and its landing frame are
// exactly the ones diagnosed above. At rest the content centre (900) lands at
// screen y 960 + (900 - cy) * k = 835 and the composition (485..1320) spans
// screen y 275..1402, above the caption band.
// ---------------------------------------------------------------------------
const K_OPEN = 1.8;
const K_FINAL = 1.35;
const CAM = camMove({
  f0: 6,
  f1: 21,
  k0: K_OPEN,
  k1: K_FINAL,
  c0: CLAUDE_Y,
  c1: CONTENT_CENTRE,
  warp: 0.72,
});
const CAM_F = [0, ...CAM.F, DURATION];
const CAM_K = [K_OPEN, ...CAM.K, K_FINAL];
const CAM_CY = [CLAUDE_Y + CAM_LIFT / K_OPEN, ...CAM.CY, CONTENT_CENTRE + CAM_LIFT / K_FINAL];

// ---------------------------------------------------------------------------
// The outputs. 64 seats per model inside its blob, and the same 64 re-seated in
// its column. Both are laid out once, at module scope, off the stable hash.
//
// The blob is a superellipse — |dx/a|^n + |dy/b|^n = 1 at n 2.4 — sampled by
// rejection out of its bounding box, so the density is uniform everywhere
// inside and there is no pointed end anywhere on it. Its boundary is the two
// things the style requires of every crowd edge that is ever seen: it undulates
// (`wobble` on the nominal edge, by angle so the loop has no seam) and the
// density falls off toward it (`feather`, over 3 seat steps ≈ 33 world px), so
// no row of dots ever traces the outline. Seats keep 16 world px apart ACROSS
// all three blobs, so the scatter is organic without clumping and the ~10px
// gaps at x 415/425 and 655/665 stay open.
//
// The radius is DOT_RADIUS for every seat, in both states, with no taper at the
// feathered edge: the count and the radius are what must be seen to be
// unchanged when the blob becomes the column, so only the DENSITY falls off.
// ---------------------------------------------------------------------------
const SEAT_STEP = 11; // world px, the unit `feather` measures its falloff in
const BLOB_FEATHER = 3; // steps; ~33 world px of dissolve at the blob's edge
const MIN_SEP = 16; // world px between any two seats, in any blob
const EDGE_WOBBLE = 1.8; // world px of undulation on a blob boundary

type Seat = {
  m: number; // which model
  fx: number;
  fy: number;
  cx: number; // its column seat
  cy: number;
  v: number; // 0 at the top of the blob, 1 at the bottom
  ripe: number; // 1 = ACCENT, 0 = ACCENT_DEEP — the mixed tone IS the diversity
  sx: number; // where it leaves the mark's bottom edge
  sy: number;
  arc: number; // perpendicular offset at mid-flight
  t0: number;
  dur: number;
  delay: number; // its hashed delay into the contraction
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
      // How far out this seat is, as a fraction of the boundary along its own
      // ray: 1 is exactly on the edge. The distance left to the edge is then
      // |d| * (1/r - 1), which is world px and is what `feather` wants.
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
      // no clumps, and no interleaving where two blobs come close
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
      // 0 at the top of the blob, 1 at the bottom: its arrival rank, and the
      // shape of its flight
      mine.push({ x, y, v: (y - BLOB_TOP) / (2 * BLOB_B), i });
      // pushed into `out` below, once the column seats are known
    }

    // The column: the same 64, ranked by depth so the blob folds into it
    // without crossing — the top dots take the top rows, the bottom dots the
    // bottom. Three per row, and a row keeps its dots in their own left-to-
    // right order so no two paths cross inside a row either.
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
      // it leaves the mark's own bottom edge, spread across its width
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
        v: s.v,
        ripe: hash(i, 33 + m) < 0.5 ? 1 : 0,
        sx,
        sy,
        // nearest seats first, furthest last: arrivals run 52 -> 68 with v, and
        // a deeper seat both leaves later and travels longer
        t0: 49 + 8 * s.v,
        dur: 3 + 8 * s.v + (hash(i, 34 + m) - 0.5) * 1.4,
        arc: (hash(i, 35 + m) - 0.5) * Math.min(90, travel * 0.32),
        delay: hash(i, 40 + m) * 3,
        seed: i * 7 + m,
      });
    });
  }
  return out;
})();

// The contraction: ONE shared smoothstep for all 192 dots, hashed delay only.
const SQUEEZE_F0 = 84;
const SQUEEZE_F1 = 100;

// The siphon. A 5px ink dot every 6 frames down each thread, 14 frames per
// transit, the three threads offset by 2 frames so they never pulse together.
const PKT_START = 40;
const PKT_PERIOD = 6;
const PKT_LIFE = 14;
const PKT_R = 5;

// A brand mark, drawn as its own paths inside the world SVG. Uniform scale
// about the 24-unit box's centre, so `size` is the box and every mark is on the
// same em. `landed` is its arrival: opacity 0 -> 1 and scale 0.94 -> 1.
const Mark: React.FC<{
  glyph: BrandGlyph;
  x: number;
  y: number;
  size: number;
  landed: number;
  ink: string;
  shadow: string;
}> = ({ glyph, x, y, size, landed, ink, shadow }) => {
  if (landed <= 0) return null;
  const s = (0.94 + 0.06 * landed) * (size / 24);
  return (
    <g style={{ filter: shadow }} opacity={landed}>
      <g transform={`translate(${x} ${y}) scale(${s.toFixed(5)}) translate(-12 -12)`}>
        {glyph.paths.map((d, i) => (
          <path key={i} d={d} fill={ink} fillRule="evenodd" />
        ))}
      </g>
    </g>
  );
};

const LowerAfterRL: React.FC<Props> = ({
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
  label,
  beats,
}) => {
  const frame = useCurrentFrame();
  // 0 = deep, 1 = ripe. Built once per frame, read per dot.
  const tone = makeTone(accentDeep, accent);

  // -- the Claude mark -------------------------------------------------------
  const claudeIn = interpolate(frame, [beats.claude, beats.claude + 8], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });

  // -- the threads and the marks they carry ----------------------------------
  // Each thread draws head-led from Claude's bottom edge to its mark, and the
  // mark lands from the frame its own head arrives — not from a parallel timer.
  const threads = MODELS.map((mod) => {
    const t0 = beats.openWeight;
    const drawn = interpolate(frame, [t0, t0 + mod.drawDur], [0, 1], {
      ...clamp,
      easing: Easing.out(Easing.cubic),
    });
    const arrive = t0 + mod.drawDur;
    const landed = interpolate(frame, [arrive, arrive + 6], [0, 1], {
      ...clamp,
      easing: Easing.out(Easing.cubic),
    });
    return { x: mod.x, glyph: mod.glyph, drawn, landed };
  });

  // -- the siphon ------------------------------------------------------------
  // Packets run DOWN, Claude -> model, from f40 to the last frame. Direction is
  // the whole point of the gesture, so they are placed off their own age and
  // nothing else.
  const packets: { key: string; x: number; y: number }[] = [];
  MODELS.forEach((mod, t) => {
    for (let n = 0; ; n++) {
      const sf = PKT_START + t * 2 + n * PKT_PERIOD;
      if (sf > frame) break;
      const age = frame - sf;
      if (age >= PKT_LIFE) continue;
      const p = age / (PKT_LIFE - 1);
      packets.push({
        key: `p${t}-${n}`,
        x: AXIS + (mod.x - AXIS) * p,
        y: THREAD_Y0 + (THREAD_Y1 - THREAD_Y0) * p,
      });
    }
  });

  // -- the outputs -----------------------------------------------------------
  // A dot's position is its own arrival progress, then the one shared squeeze.
  // Nothing here runs on a timer that could drift from the words.
  const dots = SEATS.map((s) => {
    if (frame < s.t0) return null;
    const lin = clamp01((frame - s.t0) / s.dur);
    const e = Easing.out(Easing.cubic)(lin);
    const dx = s.fx - s.sx;
    const dy = s.fy - s.sy;
    const L = Math.hypot(dx, dy) || 1;
    const bow = Math.sin(Math.PI * e) * s.arc;
    const ax = s.sx + dx * e + (-dy / L) * bow;
    const ay = s.sy + dy * e + (dx / L) * bow;
    // the squeeze: one smoothstep, per-dot delay <= 3 frames, no overshoot
    const q = smoothstep((frame - (SQUEEZE_F0 + s.delay)) / (SQUEEZE_F1 - (SQUEEZE_F0 + s.delay)));
    return {
      x: ax + (s.cx - ax) * q,
      y: ay + (s.cy - ay) * q,
      // every ripe dot ramps to deep across the same window
      tone: s.ripe * (1 - q),
      // a fixed 3-frame ramp, not a fraction of `dur`: an apex seat's flight is
      // only 3 frames long, and a fade over a fifth of that is a dot appearing
      // at full strength in one frame — a pop
      fade: smoothstep((frame - s.t0) / 3),
      seated: lin >= 1,
      seed: s.seed,
    };
  });

  // -- the label -------------------------------------------------------------
  const labelIn = interpolate(frame, [beats.after + 2, beats.rl + 2], [0, 1], {
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
  // On every icon — the four marks, the packets, the label. Its lengths are
  // screen px divided by the camera's k, so it is the same shadow at k 1.35 on
  // the Claude mark alone and at k 1.0 on the whole siphon. The dots and the
  // threads are the field, not icons, and get nothing.
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
            {/* the threads, head-led, then held at 0.95 for the whole piece */}
            {threads.map((t, i) =>
              t.drawn > 0 ? (
                <g key={`t${i}`}>
                  <line
                    x1={AXIS}
                    y1={THREAD_Y0}
                    x2={AXIS + (t.x - AXIS) * t.drawn}
                    y2={THREAD_Y0 + (THREAD_Y1 - THREAD_Y0) * t.drawn}
                    stroke={accent}
                    strokeWidth={3}
                    strokeLinecap="round"
                    opacity={0.95}
                  />
                  {t.drawn < 1 ? (
                    <circle
                      cx={AXIS + (t.x - AXIS) * t.drawn}
                      cy={THREAD_Y0 + (THREAD_Y1 - THREAD_Y0) * t.drawn}
                      r={4}
                      fill={ink}
                    />
                  ) : null}
                </g>
              ) : null,
            )}

            {/* the siphon: white beads running down the wires, Claude -> model */}
            <g style={{ filter: icon }}>
              {packets.map((p) => (
                <circle key={p.key} cx={p.x} cy={p.y} r={PKT_R} fill={ink} />
              ))}
            </g>

            {/* the outputs: the blobs, and then the columns */}
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

            {/* the marks */}
            <Mark
              glyph={CLAUDE}
              x={AXIS}
              y={CLAUDE_Y}
              size={CLAUDE_SIZE}
              landed={claudeIn}
              ink={ink}
              shadow={icon}
            />
            {threads.map((t, i) => (
              <Mark
                key={`m${i}`}
                glyph={t.glyph}
                x={t.x}
                y={MARK_Y}
                size={MARK_SIZE}
                landed={t.landed}
                ink={ink}
                shadow={icon}
              />
            ))}
          </svg>

          {/* the cause, named once. Söhne Kräftig, white, centred on the same
              column axis as everything else, with the marks' own shadow. */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: LABEL_Y + 10 * (1 - labelIn),
              width: WORLD_W,
              transform: "translateY(-50%)",
              textAlign: "center",
              fontFamily: LABEL_FONT,
              fontSize: LABEL_SIZE,
              lineHeight: 1,
              letterSpacing: "-0.01em",
              color: ink,
              opacity: labelIn,
              filter: icon,
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </div>
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default LowerAfterRL;
