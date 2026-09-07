import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  BG_BASE,
  BG_DIM,
  DOT_RADIUS,
  FEATHER_STEPS,
  FRAME_H,
  FRAME_W,
  GridBackground,
  OP_READ,
  OP_READ_DOT,
  OP_UNREAD_DOT,
  Vignette,
  WOBBLE_R,
  breath,
  clamp,
  dotStrokeWidth,
  hash,
  runCamera,
  sway,
  wobble,
  worldTransform,
} from "./fieldShared";

export const FPS = 24;
// Ajeya Cotra, clip `Ajeya_Superhuman_Hackers`: "the training and evaluation
// infrastructure of these AI companies is about to have tens, if not hundreds,
// of thousands of extremely superhuman hackers constantly bombarding it,
// right?"
//
// SRT span 0:04.379 -> 0:15.060 at 24fps.
// round((15.060 - 4.379) * 24) = round(10.681 * 24) = round(256.344) = 256
// frames of speech, plus a 16 frame tail so the resolved state holds = 272.
export const DURATION = 272;

// ---------------------------------------------------------------------------
// "Convergence". The infrastructure is a human-made thing, so it is ink
// geometry built from the field's own primitives: seven ink rings joined by ink
// lines, an organic cluster ~370 world px wide sitting at world (540, 0). The
// hackers are the cyan crowd at exactly the reference field's step, jitter and
// radius spread — the count is a consequence of the area it has to cover, and
// the area is the whole frame at the final camera plus a bleed on all four
// edges: 62 columns x 168 rows, 9,920 seats once the clearing is cut out.
//
// Every gesture is one word. Nothing else happens.
//   left cluster draws: 3 rings, 2 lines, head-led  — "training and"    f0-21
//   right cluster draws: 3 rings, 2 lines           — "evaluation"      f21-34
//   the joining edges cross the gap and the 7th
//     ring lands in the middle                      — "infrastructure"  f31-51
//   the structure clicks ink-bright for 4 frames
//     and settles at OP_READ                        — "AI companies"    f56-60
//   wave 1, ~24 dots, arrives from beyond the k1.8
//     frame edge on individual shallow arcs         — "to have tens"    f80-104
//   pull-back keyed f92-104, k 1.8 -> 1.15, then
//     wave 2, 720 dots, arrives the same way and
//     lands as a thick disc, not a ring             — "if not hundreds" f100-127
//   pull-back keyed f110-142, k 1.15 -> 0.8, and
//     wave 3, the remaining 9,176 dots, pours in
//     outer-seats-first and fills the frame edge to
//     edge — off the top, sides AND bottom, no bare
//     band anywhere; idle traffic starts as they
//     seat                                          — "of thousands"    f121-153
//   the crowd reads OP_UNREAD_DOT -> OP_READ as one
//     slow wave spreading out from the structure    — "extremely
//                                                     superhuman
//                                                     hackers"          f151-188
//   threads launch from random seats into the
//     nearest ring, one every ~3 frames; the ring
//     clicks ink-bright from the thread's arrival,
//     and the whole crowd recedes OP_READ ->
//     OP_UNREAD_DOT over 14 frames so the fire reads    — "constantly"      f196-210
//   the launch rate ramps to ~2.5 a frame           — "bombarding"      f214-228
//   steady state: field OP_UNREAD_DOT with the
//     launching seats at OP_READ + 0.1, structure
//     OP_READ under constant fire, held to the tail — "it, right?"      f242-272
//
// ambient: the structure's own packets, from f56 — a 4px ink dot travelling one
// of its edges over 14 frames, a new one every 7 frames, two alive at once, for
// the whole piece. Not a gesture; it is what a running thing looks like.
// No third camera move: the bombardment carries the last third on its own.
//
// consistency pass: accent #E0643A, feathered crowd edges
// sleek pass: OP_UNREAD_DOT (0.58) is the crowd's unread rung on every accent
// dot — the three waves as they land, the field, and the crowd after the recede
// — because #E0643A at 0.45 over the grid read as rust-brown dirt rather than as
// a colour. Nothing else moved: the ladder's other rungs, the gestures, the beat
// frames and the two camera keys are unchanged.
// background pass: BG_DIM 0.42
// dot pass: 1px white stroke on every agent dot
// colour pass 2: accent #FFC543, dot stroke 1.5px
// solid pass: OP_UNREAD_DOT 0.86, OP_READ_DOT 1.0
// ---------------------------------------------------------------------------

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
  dotRadius: z.number(),
  dotUnread: z.number(), // the unread rung for accent dots
  idleThreadCount: z.number(), // capped, never scaled with the seat count
  beats: z.object({
    training: z.number(), // "training and"
    evaluation: z.number(), // "evaluation"
    infrastructure: z.number(), // "infrastructure"
    ofThese: z.number(), // "of these"
    companies: z.number(), // "AI companies"
    isAbout: z.number(), // "is about"
    tens: z.number(), // "to have tens"
    hundreds: z.number(), // "if not hundreds"
    thousands: z.number(), // "of thousands"
    extremely: z.number(), // "extremely"
    superhuman: z.number(), // "superhuman"
    hackers: z.number(), // "hackers"
    constantly: z.number(), // "constantly"
    bombarding: z.number(), // "bombarding"
    itRight: z.number(), // "it, right?"
    end: z.number(), // speech ends; tail to 272
  }),
});

export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  ink: "#FFFFFF",
  accent: ACCENT,
  backgroundBase: BG_BASE,
  backgroundSrc: "grid-background.jpg",
  backgroundBlur: 13,
  backgroundDim: BG_DIM,
  parallax: 0.15,
  shadowY: 2,
  shadowBlur: 9,
  shadowOpacity: 0.22,
  dotRadius: DOT_RADIUS,
  dotUnread: OP_UNREAD_DOT,
  idleThreadCount: 180,
  beats: {
    training: 0,
    evaluation: 21,
    infrastructure: 30,
    ofThese: 43,
    companies: 56,
    isAbout: 72,
    tens: 86,
    hundreds: 112,
    thousands: 126,
    extremely: 151,
    superhuman: 171,
    hackers: 188,
    constantly: 199,
    bombarding: 218,
    itRight: 242,
    end: 256,
  },
});

type P = { x: number; y: number };

const WORLD_W = 1080;
const WORLD_H = 2200;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (v: number) => {
  const x = clamp01(v);
  return x * x * (3 - 2 * x);
};
const clampi = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// ---------------------------------------------------------------------------
// The camera. Three keyed moves at most; here two, both pull-backs, each
// landing ahead of its word. cy = 125 / k at every key, so the structure at
// world y 0 sits at screen y 835 whatever the zoom.
//
//   f0-92    k 1.8   the structure alone, drawing, the frame tight on it
//   f92-104  -> 1.15 opens ahead of "if not hundreds" (f112)
//   f110-142 -> 0.8  the reveal; longer ramp, lands under "of thousands"
// ---------------------------------------------------------------------------
const CAM_F = [0, 92, 104, 110, 142, DURATION];
const CAM_K = [1.8, 1.8, 1.15, 1.15, 0.8, 0.8];
const CAM_CY = CAM_K.map((k) => 125 / k);
const K_FINAL = 0.8;
const CY_FINAL = 125 / K_FINAL;

// ---------------------------------------------------------------------------
// The infrastructure: seven ink rings in two clusters plus one in the middle,
// placed off a rough two-lobe layout by a hashed offset so it is a cluster and
// not a lattice. Rings are the field's seat ring at ring weight — stroke 3.5,
// radius 14 world px. Lines between them are stroke 3, clipped to the ring
// edges so nothing crosses into a ring.
// ---------------------------------------------------------------------------
const STRUCT_CX = 540;
const RING_R = 14;
const RING_BASE: P[] = [
  { x: 372, y: -30 }, // left knot, drawn first
  { x: 408, y: 66 },
  { x: 452, y: -88 },
  { x: 712, y: 30 }, // right knot
  { x: 654, y: -76 },
  { x: 684, y: 88 },
  { x: 548, y: 4 }, // the middle ring the two knots join through, drawn last
];
const RINGS: P[] = RING_BASE.map((p, i) => ({
  x: p.x + (hash(i, 80) - 0.5) * 26,
  y: p.y + (hash(i, 81) - 0.5) * 26,
}));
const STRUCT_HALF_W = Math.max(...RINGS.map((r) => Math.abs(r.x - STRUCT_CX))) + RING_R;

// No seat inside the clearing: the crowd stands close around the structure.
// Mean radius 1.22x the structure's half-width (~232 world px around a 381-wide
// structure) — any wider and the hole reads as a shape someone drew. The
// harmonics are held to +/-5% so the boundary is only softened, never sculpted;
// the raggedness comes from the per-seat hash applied where seats are laid out.
// Wave membership is measured off this same boundary.
const KEEP_BASE = 1.22 * STRUCT_HALF_W;
const KEEP_FLOOR = STRUCT_HALF_W + 16; // a guard, never reached by the harmonics
const clearingAt = (theta: number) =>
  Math.max(
    KEEP_FLOOR,
    KEEP_BASE * (1 + 0.03 * Math.sin(3 * theta + 1.2) + 0.02 * Math.sin(5 * theta - 0.4)),
  );

type Draw = { kind: "ring" | "line"; a: number; b: number; beat: "l" | "r" | "j"; off: number; dur: number };
const STRUCTURE: Draw[] = [
  // "training and" — three rings and the two lines between them, one after another
  { kind: "ring", a: 0, b: 0, beat: "l", off: 0, dur: 5 },
  { kind: "line", a: 0, b: 1, beat: "l", off: 4, dur: 5 },
  { kind: "ring", a: 1, b: 1, beat: "l", off: 8, dur: 5 },
  { kind: "line", a: 1, b: 2, beat: "l", off: 12, dur: 5 },
  { kind: "ring", a: 2, b: 2, beat: "l", off: 16, dur: 5 },
  // "evaluation" — the same, on the other side, faster
  { kind: "ring", a: 3, b: 3, beat: "r", off: 0, dur: 5 },
  { kind: "line", a: 3, b: 4, beat: "r", off: 2, dur: 5 },
  { kind: "ring", a: 4, b: 4, beat: "r", off: 4, dur: 5 },
  { kind: "line", a: 4, b: 5, beat: "r", off: 6, dur: 5 },
  { kind: "ring", a: 5, b: 5, beat: "r", off: 8, dur: 5 },
  // "infrastructure" — two edges cross the gap into empty middle ground, the
  // seventh ring lands where they meet, and a third edge leaves it
  { kind: "line", a: 2, b: 6, beat: "j", off: 1, dur: 8 },
  { kind: "line", a: 5, b: 6, beat: "j", off: 5, dur: 8 },
  { kind: "ring", a: 6, b: 6, beat: "j", off: 12, dur: 7 },
  { kind: "line", a: 6, b: 4, beat: "j", off: 16, dur: 6 },
];

// ---------------------------------------------------------------------------
// The crowd. Exactly the reference field's step (940/39 x 440/29), jitter 0.9
// and radius spread 0.75-1.25; only the area is different. The area is fixed by
// the final camera: the seats bleed past all four frame edges at k 0.8, so the
// field covers the whole frame and is cut off nowhere. Left, right and top run
// 60 world px out; the bottom runs 60 SCREEN px out (75 world px), which is the
// same overrun measured the way the director watches it. 62 x 168 = 9,920
// seats. Count is whatever that area holds at that step.
// ---------------------------------------------------------------------------
const STEP_X = 940 / 39;
const STEP_Y = 440 / 29;
const BLEED = 60;
const SEAT_X0 = STRUCT_CX - FRAME_W / 2 / K_FINAL - BLEED;
const SEAT_X1 = STRUCT_CX + FRAME_W / 2 / K_FINAL + BLEED;
const SEAT_Y0 = CY_FINAL - FRAME_H / 2 / K_FINAL - BLEED;
const SEAT_Y1 = CY_FINAL + (FRAME_H / 2 + BLEED) / K_FINAL;
const COLS = Math.round((SEAT_X1 - SEAT_X0) / STEP_X) + 1;
const ROWS = Math.round((SEAT_Y1 - SEAT_Y0) / STEP_Y) + 1;
const GRID_X0 = (SEAT_X0 + SEAT_X1) / 2 - ((COLS - 1) * STEP_X) / 2;
const GRID_Y0 = SEAT_Y1 - (ROWS - 1) * STEP_Y;
// The bottom is a straight cut, ragged only from the seats' own jitter, and it
// lies off the frame: world y 1431.25, screen y 1980 at the final camera.
const BOTTOM_Y = SEAT_Y1;

// How far from the structure a ray in direction (ux, uy) leaves the frame at
// zoom k. Arrivals start beyond this, so every dot comes in from off-screen.
const exitRadius = (ux: number, uy: number, k: number) => {
  const halfW = FRAME_W / 2 / k;
  const halfH = FRAME_H / 2 / k;
  const camY = 125 / k;
  const tx = Math.abs(ux) < 1e-6 ? Infinity : halfW / Math.abs(ux);
  let ty = Infinity;
  if (Math.abs(uy) > 1e-6) ty = uy > 0 ? (camY + halfH) / uy : (camY - halfH) / uy;
  return Math.min(tx, ty);
};

type Seat = {
  x: number;
  y: number;
  r: number;
  gc: number;
  gr: number;
  d: number;
  dRel: number; // distance out from the clearing's edge
  wave: number; // 1 tens, 2 hundreds, 3 thousands
  sx: number; // where it flies in from
  sy: number;
  arc: number; // perpendicular offset at mid-flight
  dNorm: number; // 0 innermost .. 1 outermost, within wave 3
};

const WAVE_K = [0, 1.8, 1.15, K_FINAL]; // the zoom each wave arrives at
const W1_N = 24; // "tens"
const W2_N = 720; // "hundreds"

// ---------------------------------------------------------------------------
// The wave boundaries. The field's outer extent is never seen — it bleeds off
// all four edges at the final camera — but waves 1 and 2 ARE seen arriving, and
// a ring of arrivals whose outer edge is a plain distance threshold lands as a
// disc someone drew with a compass. So each wave's boundary undulates (wobble,
// scaled down where the boundary is closer in than the undulation is deep) and
// is feathered across FEATHER_STEPS.
//
// It is done by re-measuring each seat's distance rather than by deleting: a
// seat's key is its dRel pushed out by the wobble and jittered across the
// feather by its own hash, with the jitter drawn from `feather`'s own profile
// (invSmooth is smoothstep inverted, so the jitter has exactly the
// distribution "in if hash(i, k) < feather(d)"). Ranking on that key and taking
// the first N is that same soft boundary with N preserved — a seat near it goes
// to the neighbouring wave instead of vanishing. No seat is lost: 9,920 in, 24
// on "tens", 720 on "hundreds", the rest on "thousands".
// ---------------------------------------------------------------------------
const invSmooth = (u: number) => 0.5 - Math.sin(Math.asin(1 - 2 * clamp01(u)) / 3);
const stepOn = (dx: number, dy: number) => {
  const L = Math.hypot(dx, dy) || 1;
  return L / Math.hypot(dx / STEP_X, dy / STEP_Y);
};

const SEATS: Seat[] = (() => {
  const raw: {
    x: number;
    y: number;
    r: number;
    gc: number;
    gr: number;
    d: number;
    dRel: number;
    hi: number;
  }[] = [];
  for (let gr = 0; gr < ROWS; gr++) {
    for (let gc = 0; gc < COLS; gc++) {
      const i = gr * COLS + gc;
      const x = GRID_X0 + gc * STEP_X + (hash(i, 11) - 0.5) * STEP_X * 0.9;
      const y = GRID_Y0 + gr * STEP_Y + (hash(i, 12) - 0.5) * STEP_Y * 0.9;
      if (y > BOTTOM_Y) continue;
      const d = Math.hypot(x - STRUCT_CX, y);
      // distance measured from the clearing's own edge, not from a circle
      const edge = clearingAt(Math.atan2(y, x - STRUCT_CX)) * (1 + (hash(i, 60) - 0.5) * 0.13);
      if (d < edge) continue;
      raw.push({ x, y, r: 0.75 + 0.5 * hash(i, 13), gc, gr, d, dRel: d - edge, hi: i });
    }
  }
  const order = raw.map((_, i) => i).sort((a, b) => raw[a].dRel - raw[b].dRel);
  // where each boundary nominally sits, before it is softened
  const D1 = raw[order[W1_N - 1]].dRel;
  const D2 = raw[order[W1_N + W2_N - 1]].dRel;
  const waveKey = (n: number, seed: number, nominal: number, hk: number) => {
    const s = raw[n];
    const st = stepOn(s.x - STRUCT_CX, s.y);
    const along = Math.atan2(s.y, s.x - STRUCT_CX) * WOBBLE_R;
    // an undulation cannot be deeper than the boundary's own stand-off, or the
    // "tens" break into lobes instead of reading as a soft ring
    const amp = Math.min(1, nominal / (2 * STEP_Y));
    const jitter = FEATHER_STEPS * invSmooth(hash(s.hi, hk));
    return s.dRel - (wobble(along, seed) * amp + FEATHER_STEPS / 2 - jitter) * st;
  };
  const k2 = raw.map((_, n) => waveKey(n, 2.9, D2, 71));
  const k1 = raw.map((_, n) => waveKey(n, 1.3, D1, 72));
  const wave = new Int8Array(raw.length).fill(3);
  const in12 = raw.map((_, n) => n).sort((a, b) => k2[a] - k2[b]).slice(0, W1_N + W2_N);
  in12.sort((a, b) => k1[a] - k1[b]);
  // the nearest are "tens"; the next 720 are "hundreds" — enough seats that
  // they land as a thick disc around the structure and not a two-seat annulus.
  in12.forEach((n, rank) => {
    wave[n] = rank < W1_N ? 1 : 2;
  });

  let w3min = Infinity;
  let w3max = 0;
  for (let i = 0; i < raw.length; i++) {
    if (wave[i] !== 3) continue;
    w3min = Math.min(w3min, raw[i].dRel);
    w3max = Math.max(w3max, raw[i].dRel);
  }

  return raw.map((s, i) => {
    const ux = (s.x - STRUCT_CX) / s.d;
    const uy = s.y / s.d;
    const w = wave[i];
    const mult = 1.6 + 0.4 * hash(i, 61);
    const eR = exitRadius(ux, uy, WAVE_K[w]);
    // far enough out to be off-frame — that term always wins — and otherwise
    // 1.6-2.0x its seat distance, capped so the outer seats do not spend the
    // whole beat crossing ground the camera has not reached yet
    const travel = Math.max(Math.min(s.d * (mult - 1), 340), eR + 70 - s.d, 120);
    const startR = s.d + travel;
    return {
      x: s.x,
      y: s.y,
      r: s.r,
      gc: s.gc,
      gr: s.gr,
      d: s.d,
      dRel: s.dRel,
      wave: w,
      sx: STRUCT_CX + ux * startR,
      sy: uy * startR,
      arc: (hash(i, 65) - 0.5) * Math.min(150, travel * 0.32),
      dNorm: w === 3 ? clamp01((s.dRel - w3min) / Math.max(1, w3max - w3min)) : 0,
    };
  });
})();

const NSEAT = SEATS.length;
const DREL_MAX = Math.max(...SEATS.map((s) => s.dRel));

// grid cell -> seat, so idle traffic can find a neighbour without a search
const SEAT_AT = new Int32Array(COLS * ROWS).fill(-1);
SEATS.forEach((s, i) => {
  SEAT_AT[s.gr * COLS + s.gc] = i;
});

// Arrival timing per wave: lead before the beat, hash spread, travel. A group
// starts outside the frame, so the lead has to cover the time it spends
// off-screen — the word wants to land while they are streaming in, not while
// they are still out of shot.
const W1 = { lead: 6, spread: 10, dur: 14 }; // in frame f88-104, word at f86
const W2 = { lead: 12, spread: 12, dur: 15 }; // in frame f106-127, word at f112
// Wave 3 needs the longest lead of the three: its dots start furthest out AND
// the camera is still narrow when they set off, so they spend several frames
// crossing ground that is not on screen yet. Leading it 10 frames puts the
// visible pour on the word instead of eight frames behind it.
const W3 = { lead: 10, spread: 14, jitter: 4, dur: 16 }; // in frame f126-150

// Which ring a launch hits: the nearest one, or any within 1.12x of it — from
// far out that is the two or three rings on the near face, from close in it is
// the single ring on that side. Strict nearest left four of the seven rings
// never hit; a wider tolerance let fire cross the whole structure.
const targetRing = (x: number, y: number, j: number) => {
  let bestD = Infinity;
  for (let k = 0; k < RINGS.length; k++) {
    const dd = Math.hypot(x - RINGS[k].x, y - RINGS[k].y);
    if (dd < bestD) bestD = dd;
  }
  const near: number[] = [];
  for (let k = 0; k < RINGS.length; k++) {
    if (Math.hypot(x - RINGS[k].x, y - RINGS[k].y) <= bestD * 1.12) near.push(k);
  }
  return near[Math.min(near.length - 1, Math.floor(hash(j, 73) * near.length))];
};

// The bombardment: draw 10, hold 4, fade 8.
const T_DRAW = 10;
const T_HOLD = 4;
const T_FADE = 8;
const T_LIFE = T_DRAW + T_HOLD + T_FADE;

// The structure's own packets. Training and evaluation infrastructure is a
// running thing, so from the frame it completes an ink dot travels one of its
// edges over 14 frames, one new packet every 7 frames, two alive at once. It is
// the same primitive as this file's other tips — r 4, ink, full — because it
// rides ON a line that is already ink at OP_READ: at the ambient 0.4 it was
// rendered and disappeared into the line. It reads as a bead on a wire.
// No trails, no flashes, nothing brightens from it.
const EDGES = STRUCTURE.map((e, i) => (e.kind === "line" ? i : -1)).filter((i) => i >= 0);
const PKT_PERIOD = 7;
const PKT_LIFE = 14;
const PKT_R = 4;

const ConstantlyBombarding: React.FC<Props> = ({
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
  dotRadius,
  dotUnread,
  idleThreadCount,
  beats,
}) => {
  const frame = useCurrentFrame();

  // -- the structure ---------------------------------------------------------
  const beatOf = { l: beats.training, r: beats.evaluation, j: beats.infrastructure };
  const drawn = STRUCTURE.map((e) =>
    interpolate(frame, [beatOf[e.beat] + e.off, beatOf[e.beat] + e.off + e.dur], [0, 1], {
      ...clamp,
      easing: Easing.out(Easing.cubic),
    }),
  );
  // one short click-bright on "AI companies", then it settles and stays there
  const completeClick = frame >= beats.companies && frame < beats.companies + 4 ? 1 : 0;

  // -- the crowd -------------------------------------------------------------
  // Each dot's opacity and radius come from its own arrival progress and from
  // the read wave's radius; nothing here runs on a timer of its own.
  const readR = interpolate(
    frame,
    [beats.extremely, beats.hackers],
    [-150, DREL_MAX + 170],
    clamp,
  );
  // From the first launch the crowd goes back down to OP_UNREAD_DOT as one field —
  // no wave, no stagger. It is the light going down on the crowd so the fire
  // over it can be seen; a seat with a thread on it still brightens.
  const recede = smooth((frame - (beats.constantly - 3)) / 14);

  const dots = SEATS.map((s, i) => {
    let t0: number;
    if (s.wave === 1) t0 = beats.tens - W1.lead + hash(i, 62) * W1.spread;
    else if (s.wave === 2) t0 = beats.hundreds - W2.lead + hash(i, 63) * W2.spread;
    else t0 = beats.thousands - W3.lead + (1 - s.dNorm) * W3.spread + hash(i, 64) * W3.jitter;
    const dur = s.wave === 3 ? W3.dur : s.wave === 2 ? W2.dur : W1.dur;

    if (frame < t0) return null;
    const lin = clamp01((frame - t0) / dur);
    const e = Easing.out(Easing.cubic)(lin);
    const px = s.sx + (s.x - s.sx) * e;
    const py = s.sy + (s.y - s.sy) * e;
    // the arc is perpendicular to the run, so a dot coming from above swings
    // sideways exactly as one coming from the side swings up
    const dx = s.x - s.sx;
    const dy = s.y - s.sy;
    const L = Math.hypot(dx, dy) || 1;
    const bow = Math.sin(Math.PI * e) * s.arc;
    const read = smooth((readR - s.dRel) / 150);
    const level = dotUnread + (OP_READ_DOT - dotUnread) * read * (1 - recede);
    return {
      x: px + (-dy / L) * bow,
      y: py + (dx / L) * bow,
      base: level * smooth(lin / 0.2),
      moving: lin < 1,
      fly: clamp01(Math.min(lin, 1 - lin) / 0.14),
    };
  });

  // -- idle traffic ----------------------------------------------------------
  // Capped at 180 threads whatever the seat count, at 0.4, so it stays ambient.
  const lit = new Float32Array(NSEAT);
  type Th = { key: string; x1: number; y1: number; x2: number; y2: number; op: number; head: number };
  const threadEls: Th[] = [];

  const reach = 5;
  for (let j = 0; j < idleThreadCount; j++) {
    const period = 44 - 12 * hash(j, 4);
    const local = frame + hash(j, 5) * period;
    const cycle = Math.floor(local / period);
    const phase = (local - cycle * period) / period;
    const seed = j * 131 + cycle * 7;
    const a = Math.floor(hash(seed, 6) * NSEAT);
    const A = dots[a];
    if (!A || A.moving) continue;
    const sa = SEATS[a];
    const bc = clampi(sa.gc + Math.round((hash(seed, 7) - 0.5) * 2 * reach), 0, COLS - 1);
    const br = clampi(sa.gr + Math.round((hash(seed, 8) - 0.5) * 2 * reach), 0, ROWS - 1);
    const b = SEAT_AT[br * COLS + bc];
    if (b < 0 || b === a) continue;
    const B = dots[b];
    if (!B || B.moving) continue;
    const dn = interpolate(phase, [0, 0.3], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
    const fade = interpolate(phase, [0.55, 1], [1, 0], clamp);
    if (fade <= 0.02) continue;
    lit[a] = Math.max(lit[a], fade);
    lit[b] = Math.max(lit[b], dn * fade);
    threadEls.push({
      key: `i${j}`,
      x1: A.x,
      y1: A.y,
      x2: A.x + (B.x - A.x) * dn,
      y2: A.y + (B.y - A.y) * dn,
      op: 0.4 * fade,
      head: dn,
    });
  }

  // -- the bombardment -------------------------------------------------------
  // A launch schedule accumulated off one rate curve: one every ~3 frames on
  // "constantly", ramping to ~2.5 a frame across "bombarding" and holding.
  const bombFrom = beats.constantly - 3; // in flight on "constantly", not leaving then
  const rateAt = (f: number) =>
    interpolate(f, [bombFrom, beats.bombarding - 4, beats.bombarding + 10], [1 / 3, 1 / 3, 2.5], clamp);
  const ringClick = new Float32Array(RINGS.length);
  let acc = 0;
  let launch = 0;
  for (let f = bombFrom; f <= frame; f++) {
    acc += rateAt(f);
    while (acc >= 1) {
      acc -= 1;
      const age = frame - f;
      const j = launch++;
      if (age > T_LIFE) continue;
      const si = Math.floor(hash(j, 71) * NSEAT);
      const S = dots[si];
      if (!S) continue;
      const rk = targetRing(S.x, S.y, j);
      const R = RINGS[rk];
      const vx = R.x - S.x;
      const vy = R.y - S.y;
      const vl = Math.hypot(vx, vy) || 1;
      const ex = R.x - (vx / vl) * RING_R;
      const ey = R.y - (vy / vl) * RING_R;
      const dn = clamp01(age / T_DRAW); // linear: it is fire, not a drawn line
      const fade = interpolate(age, [T_DRAW + T_HOLD, T_LIFE], [1, 0], clamp);
      if (fade <= 0.02) continue;
      lit[si] = Math.max(lit[si], fade);
      // the ring clicks from the thread's arrival, not from a parallel timer
      if (age >= T_DRAW && age < T_DRAW + 4) ringClick[rk] = 1;
      threadEls.push({
        key: `b${j}`,
        x1: S.x,
        y1: S.y,
        x2: S.x + (ex - S.x) * dn,
        y2: S.y + (ey - S.y) * dn,
        op: 0.95 * fade,
        head: dn,
      });
    }
  }

  // -- the structure's own packets -------------------------------------------
  // Ambient, from the frame the structure completes, unchanged under fire.
  const packets: { key: string; x: number; y: number }[] = [];
  for (let n = 0; ; n++) {
    const sf = beats.companies + n * PKT_PERIOD;
    if (sf > frame) break;
    const age = frame - sf;
    if (age >= PKT_LIFE) continue;
    const e = STRUCTURE[EDGES[Math.floor(hash(n, 90) * EDGES.length)]];
    const A = RINGS[e.a];
    const B = RINGS[e.b];
    const ux = (B.x - A.x) / (Math.hypot(B.x - A.x, B.y - A.y) || 1);
    const uy = (B.y - A.y) / (Math.hypot(B.x - A.x, B.y - A.y) || 1);
    const x1 = A.x + ux * RING_R;
    const y1 = A.y + uy * RING_R;
    const x2 = B.x - ux * RING_R;
    const y2 = B.y - uy * RING_R;
    const t = age / (PKT_LIFE - 1);
    const p = hash(n, 92) < 0.5 ? t : 1 - t; // either way along the edge
    packets.push({ key: `p${n}`, x: x1 + (x2 - x1) * p, y: y1 + (y2 - y1) * p });
  }

  // -- camera ----------------------------------------------------------------
  const cam = runCamera(frame, CAM_F, CAM_CY, CAM_K);
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = STRUCT_CX + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);
  // the dots' white rim, one screen px whatever the camera is doing
  const dotStroke = dotStrokeWidth(k);

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
            {/* the crowd */}
            {dots.map((d, i) => {
              if (!d || d.base <= 0.01) return null;
              const l = lit[i];
              const s = SEATS[i];
              const r =
                dotRadius * s.r * breath(frame, hash(i, 9)) * (1 + 0.35 * l) * (1 + 0.3 * d.fly);
              const op = d.base + (OP_READ_DOT - d.base) * l;
              return (
                <circle
                  key={i}
                  cx={d.x}
                  cy={d.y}
                  r={r}
                  fill={accent}
                  stroke={ink}
                  strokeWidth={dotStroke}
                  opacity={op}
                />
              );
            })}

            {/* threads: idle traffic, then the bombardment. Both head-led. */}
            {threadEls.map((t) => (
              <g key={t.key}>
                <line
                  x1={t.x1}
                  y1={t.y1}
                  x2={t.x2}
                  y2={t.y2}
                  stroke={accent}
                  strokeWidth={3}
                  strokeLinecap="round"
                  opacity={t.op}
                />
                {t.head < 1 ? <circle cx={t.x2} cy={t.y2} r={4} fill={ink} opacity={t.op} /> : null}
              </g>
            ))}

            {/* the infrastructure */}
            {STRUCTURE.map((e, ei) => {
              const d = drawn[ei];
              if (d <= 0) return null;
              const op = OP_READ + (1 - OP_READ) * completeClick;
              if (e.kind === "ring") {
                const R = RINGS[e.a];
                const C = 2 * Math.PI * RING_R;
                const th = -Math.PI / 2 + 2 * Math.PI * d;
                const ringOp = Math.min(1, op + (1 - op) * ringClick[e.a]);
                return (
                  <g key={`e${ei}`}>
                    <circle
                      cx={R.x}
                      cy={R.y}
                      r={RING_R}
                      fill="none"
                      stroke={ink}
                      strokeWidth={3.5}
                      strokeLinecap="round"
                      strokeDasharray={C}
                      strokeDashoffset={C * (1 - d)}
                      opacity={ringOp}
                    />
                    {d < 1 ? (
                      <circle
                        cx={R.x + RING_R * Math.cos(th)}
                        cy={R.y + RING_R * Math.sin(th)}
                        r={4}
                        fill={ink}
                      />
                    ) : null}
                  </g>
                );
              }
              const A = RINGS[e.a];
              const B = RINGS[e.b];
              const ux = (B.x - A.x) / (Math.hypot(B.x - A.x, B.y - A.y) || 1);
              const uy = (B.y - A.y) / (Math.hypot(B.x - A.x, B.y - A.y) || 1);
              const x1 = A.x + ux * RING_R;
              const y1 = A.y + uy * RING_R;
              const x2 = B.x - ux * RING_R;
              const y2 = B.y - uy * RING_R;
              const hx = x1 + (x2 - x1) * d;
              const hy = y1 + (y2 - y1) * d;
              return (
                <g key={`e${ei}`}>
                  <line
                    x1={x1}
                    y1={y1}
                    x2={hx}
                    y2={hy}
                    stroke={ink}
                    strokeWidth={3}
                    strokeLinecap="round"
                    opacity={op}
                  />
                  {d < 1 ? <circle cx={hx} cy={hy} r={4} fill={ink} /> : null}
                </g>
              );
            })}

            {/* the structure's own packets */}
            {packets.map((p) => (
              <circle key={p.key} cx={p.x} cy={p.y} r={PKT_R} fill={ink} />
            ))}
          </svg>
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default ConstantlyBombarding;
