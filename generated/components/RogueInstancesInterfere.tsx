import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  BG_BASE,
  BG_DIM,
  DOT_RADIUS,
  GridBackground,
  OP_DARK,
  OP_READ,
  OP_UNREAD,
  OP_UNREAD_DOT,
  Vignette,
  WOBBLE_R,
  breath,
  clamp,
  dotStrokeWidth,
  feather,
  hash,
  idleThreads,
  runCamera,
  sway,
  wobble,
  worldTransform,
} from "./fieldShared";

export const FPS = 24;
// Ajeya Cotra, clip `Ajeya_Superhuman_Hackers`: "not only would maybe rogue
// instances of Mythos or Astro or whatever have an incentive to interfere with
// it" — "it" is the training and evaluation infrastructure built in the
// previous cut (`ConstantlyBombarding.tsx`), so the same seven-ring ink
// structure stands at world (540, 0) with its own packets already running.
//
// SRT span 0:19.940 -> 0:26.199 at 24fps.
// round((26.199 - 19.940) * 24) = round(6.259 * 24) = round(150.216) = 150
// frames of speech, plus a 16 frame tail so the resolved state holds = 166.
export const DURATION = 166;

// ---------------------------------------------------------------------------
// "Provenance and pull". Two model marks — Claude for Mythos, the OpenAI mark
// for Astro — each standing over its own fleet of instances (a rounded,
// feathered blob of ~74 hashed seats at the field's step, laid out on a 10 x 9
// lattice). Six of those instances break out, get tethered
// back to the model that made them, and lean at the human infrastructure below
// until they are inside it.
//
// Every gesture is one phrase. Nothing else happens.
//   6 rogues lift out of their seats on individual
//     arcs, leaving dim seat rings behind          — "maybe rogue"      f13-30
//                                                    lands on "instances" f30
//   the Claude mark clicks ink-bright and a
//     provenance thread draws head-led to each of
//     its 3 rogues; the threads stay               — "of Mythos"        f47-90
//   the OpenAI mark does the same to its 3         — "or Astro or"      f76-115
//   pull-back keyed f96-110, k 1.4 -> 0.95,
//     revealing the structure below                — "whatever /
//                                                     have an"          f106-110
//   the 6 rogues drift toward the structure on
//     individual shallow arcs and stop ~300 world
//     px off it, tethers stretching with them      — "incentive to"     f117-136
//   a thread fires from each rogue into its
//     nearest ring; on each arrival that ring and
//     one adjoining edge turn accent and stay
//     accent, and the rest of the structure reads
//     up from OP_UNREAD to OP_READ off the
//     arrival count                                — "interfere /
//                                                     with it"          f134-150
//   hold resolved, never fading                    — tail               f150-166
//
// ambient: each fleet's own idle thread traffic at 0.4 from f0
// (idleThreads(149) = 22 threads, scaled off the alive seat count), and the
// structure's packets — a 4px ink dot travelling one of its edges over 14
// frames, a new one every 7 frames — from f0, because the training run is
// already live when the line starts.
//
// consistency pass: accent #E0643A, feathered crowd edges
// sleek pass: OP_UNREAD_DOT (0.58) on every instance dot, because #E0643A at
// 0.45 over the grid read as rust-brown noise; the fleets re-laid 10 x 9 at
// superellipse 2.4 so each one is a rounded blob and not the thin pointed lens
// a 14 x 8 box cut down to (74 and 75 alive); rogues picked at columns 3, 5, 7;
// the structure's ink packets put back on the shared rung (opacity 1.0).
// Gestures, beats and the single camera key are unchanged.
// background pass: BG_DIM 0.42
// dot pass: 1px white stroke on every agent dot
// colour pass 2: accent #FFC543, dot stroke 1.5px
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
  markSize: z.number(),
  idleThreadCount: z.number(),
  beats: z.object({
    onlyWould: z.number(), // "only would"
    rogue: z.number(), // "maybe rogue"
    instances: z.number(), // "instances"
    mythos: z.number(), // "of Mythos"
    astro: z.number(), // "or Astro or"
    whatever: z.number(), // "whatever"
    haveAn: z.number(), // "have an"
    incentive: z.number(), // "incentive to"
    interfere: z.number(), // "interfere"
    withIt: z.number(), // "with it"
    end: z.number(), // speech ends; tail to 166
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
  markSize: 108,
  idleThreadCount: idleThreads(149), // 149 seats alive across the two fleets
  beats: {
    onlyWould: 0,
    rogue: 13,
    instances: 30,
    mythos: 47,
    astro: 76,
    whatever: 106,
    haveAn: 110,
    incentive: 117,
    interfere: 134,
    withIt: 141,
    end: 150,
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
// The infrastructure — copied exactly from ConstantlyBombarding so it is
// recognisably the same object: seven ink rings in two knots joined through a
// seventh in the middle, placed off a rough two-lobe layout by the same hashed
// offset. Rings stroke 3.5 at radius 14, edges stroke 3 clipped to the ring
// edges. It is already built and already running when this cut opens.
// ---------------------------------------------------------------------------
const STRUCT_CX = 540;
const RING_R = 14;
const RING_BASE: P[] = [
  { x: 372, y: -30 }, // left knot
  { x: 408, y: 66 },
  { x: 452, y: -88 },
  { x: 712, y: 30 }, // right knot
  { x: 654, y: -76 },
  { x: 684, y: 88 },
  { x: 548, y: 4 }, // the middle ring the two knots join through
];
const RINGS: P[] = RING_BASE.map((p, i) => ({
  x: p.x + (hash(i, 80) - 0.5) * 26,
  y: p.y + (hash(i, 81) - 0.5) * 26,
}));

type Edge = { kind: "ring" | "line"; a: number; b: number };
const STRUCTURE: Edge[] = [
  { kind: "ring", a: 0, b: 0 },
  { kind: "line", a: 0, b: 1 },
  { kind: "ring", a: 1, b: 1 },
  { kind: "line", a: 1, b: 2 },
  { kind: "ring", a: 2, b: 2 },
  { kind: "ring", a: 3, b: 3 },
  { kind: "line", a: 3, b: 4 },
  { kind: "ring", a: 4, b: 4 },
  { kind: "line", a: 4, b: 5 },
  { kind: "ring", a: 5, b: 5 },
  { kind: "line", a: 2, b: 6 },
  { kind: "line", a: 5, b: 6 },
  { kind: "ring", a: 6, b: 6 },
  { kind: "line", a: 6, b: 4 },
];
const EDGES = STRUCTURE.map((e, i) => (e.kind === "line" ? i : -1)).filter((i) => i >= 0);
const PKT_PERIOD = 7;
const PKT_LIFE = 14;
const PKT_R = 4;

// ---------------------------------------------------------------------------
// The two models and their fleets. Each mark is 108 world px square, centred
// 220 world px above its fleet; each fleet is laid out as 10 x 9 seats at
// exactly the field's step (940/39 x 440/29), jitter 0.9, radius 0.75-1.25 — an
// organic cluster, never a lattice.
//
// A fleet is not a box of agents. The 10 x 9 lattice is only where the seats
// stand; the fleet's OUTLINE is a superellipse (exponent 2.4) inscribed in that
// box, undulated by `wobble` along its perimeter and feathered across its outer
// 1.5 steps, so density falls off toward the edge and the dots that survive out
// there are smaller. 90 seats laid out per fleet, 74 and 75 alive — 149 in all.
//
// The box is nearly as tall as it is wide (241 x 137 world px) so the
// superellipse cut leaves a rounded blob. The old 14 x 8 box was so much wider
// than it was tall that the same cut produced a thin pointed lens. The fleets
// no longer need to bleed off the opening frame: at k 1.4 the frame runs world
// x 154..926 and fleet 0 spans 185..419, fleet 1 671..899, so each one stands
// clear of the edge and reads as a countable population.
// ---------------------------------------------------------------------------
const STEP_X = 940 / 39;
const STEP_Y = 440 / 29;
const F_COLS = 10;
const F_ROWS = 9;
const F_N = F_COLS * F_ROWS;

const FLEETS = [
  { cx: 300, cy: -420, mx: 300, my: -640, src: "claude.png", tint: "brightness(0) invert(1)" },
  { cx: 780, cy: -420, mx: 780, my: -640, src: "openai-chatgpt-logo.png", tint: "invert(1)" },
];

const SE_N = 2.4; // superellipse exponent: rounder than a box, flatter than an ellipse
const BLOB_AX = ((F_COLS - 1) / 2 + 0.5) * STEP_X;
const BLOB_AY = ((F_ROWS - 1) / 2 + 0.5) * STEP_Y;
const BLOB_FEATHER = 1.5; // steps, centred on the nominal boundary
const BLOB_SEED = [2.48, 2.24];

// A seat's signed distance to its fleet's nominal boundary, in grid steps —
// positive inside. The superellipse is scaled along the seat's own ray, and the
// step is measured along that ray too, so the feather is the same width in
// steps whichever way the boundary runs.
const blobInside = (dx: number, dy: number, seed: number) => {
  const L = Math.hypot(dx, dy);
  if (L < 1e-6) return 99;
  const g = Math.pow(Math.abs(dx) / BLOB_AX, SE_N) + Math.pow(Math.abs(dy) / BLOB_AY, SE_N);
  const t = Math.pow(g, 1 / SE_N); // 1 exactly on the boundary
  const stepAlong = L / Math.hypot(dx / STEP_X, dy / STEP_Y);
  return (
    (L / t - L) / stepAlong +
    wobble(Math.atan2(dy, dx) * WOBBLE_R, seed) +
    BLOB_FEATHER / 2
  );
};

type Seat = { x: number; y: number; r: number; rs: number; f: number; c: number; row: number };
const SEATS: Seat[] = (() => {
  const out: Seat[] = [];
  for (let f = 0; f < FLEETS.length; f++) {
    const F = FLEETS[f];
    for (let row = 0; row < F_ROWS; row++) {
      for (let c = 0; c < F_COLS; c++) {
        const i = f * 977 + row * F_COLS + c;
        const x = F.cx + (c - (F_COLS - 1) / 2) * STEP_X + (hash(i, 11) - 0.5) * STEP_X * 0.9;
        const y = F.cy + (row - (F_ROWS - 1) / 2) * STEP_Y + (hash(i, 12) - 0.5) * STEP_Y * 0.9;
        const d = blobInside(x - F.cx, y - F.cy, BLOB_SEED[f]);
        const fe = feather(d, BLOB_FEATHER);
        if (hash(i, 71) >= fe) continue;
        out.push({ x, y, r: 0.75 + 0.5 * hash(i, 13), rs: 0.7 + 0.3 * fe, f, c, row });
      }
    }
  }
  return out;
})();
const NSEAT = SEATS.length;

// fleet grid cell -> seat index, so idle traffic can find a neighbour without a
// search now that most cells are empty.
const SEAT_AT = new Int32Array(FLEETS.length * F_N).fill(-1);
SEATS.forEach((s, i) => {
  SEAT_AT[s.f * F_N + s.row * F_COLS + s.c] = i;
});

// ---------------------------------------------------------------------------
// The rogues: three seats out of each fleet, taken from the lowest rows that
// survived the blob cull (so nothing of their own fleet stands between them and
// the structure) and taken at columns 3, 5 and 7 of the ten — two full steps
// apart, clear of the blob's cut corners, so their tethers never cross.
// ---------------------------------------------------------------------------
// Where they stop when they lean at the run: a spread arc 300 world px off the
// structure's centre, upper half, Claude's three on the left of it and the
// OpenAI mark's three on the right, matching where they came from.
const STOP_R = 300;
const STOP_DEG = [203, 229, 255, 281, 307, 345];

type Rogue = {
  gi: number; // index into SEATS
  f: number;
  sx: number;
  sy: number;
  lx: number; // where the lift puts it
  ly: number;
  dx: number; // where the drift puts it
  dy: number;
  liftT0: number;
  liftArc: number;
  driftT0: number;
  driftArc: number;
  ring: number; // the structure ring it fires into
  edge: number; // the adjoining edge that goes with it
};

const nearestRing = (x: number, y: number) => {
  let best = 0;
  let bestD = Infinity;
  for (let k = 0; k < RINGS.length; k++) {
    const dd = Math.hypot(x - RINGS[k].x, y - RINGS[k].y);
    if (dd < bestD) {
      bestD = dd;
      best = k;
    }
  }
  return best;
};

const adjoiningEdge = (rk: number, j: number) => {
  const near = EDGES.filter((ei) => STRUCTURE[ei].a === rk || STRUCTURE[ei].b === rk);
  if (near.length === 0) return EDGES[0];
  return near[Math.min(near.length - 1, Math.floor(hash(j, 77) * near.length))];
};

const ROGUE_COLS = [3, 5, 7];

const ROGUES: Rogue[] = (() => {
  const picks: { gi: number; f: number }[] = [];
  for (let f = 0; f < FLEETS.length; f++) {
    const low = SEATS.map((s, i) => ({ s, i })).filter(({ s }) => s.f === f && s.row >= F_ROWS - 3);
    const taken = new Set<number>();
    for (const target of ROGUE_COLS) {
      // The surviving seat nearest this column, lowest row first, in a column
      // no other rogue has already taken. Nearest-the-column rather than
      // hashed: with the blob's corners gone a hashed pick can put two rogues
      // in adjoining columns, and two tethers land on top of each other.
      const free = low.filter(({ s }) => !taken.has(s.c));
      const bottom = free.filter(({ s }) => s.row >= F_ROWS - 2);
      const pool = bottom.length ? bottom : free;
      pool.sort(
        (a, b) =>
          Math.abs(a.s.c - target) - Math.abs(b.s.c - target) ||
          b.s.row - a.s.row ||
          hash(a.i, 22) - hash(b.i, 22),
      );
      taken.add(pool[0].s.c);
      picks.push({ gi: pool[0].i, f });
    }
  }
  // sort inside each fleet by x so the stop arc is assigned left to right
  picks.sort((a, b) => (a.f - b.f) || (SEATS[a.gi].x - SEATS[b.gi].x));

  return picks.map((p, j) => {
    const s = SEATS[p.gi];
    const F = FLEETS[p.f];
    const out = Math.sign(s.x - F.cx) || 1;
    // Down and slightly outward, ~115 world px of travel, each its own curve.
    // The sideways component tapers to nothing at the fleet's edge columns, so
    // the fan opens from the middle instead of pushing a rogue off frame at
    // the opening zoom.
    const taper = 1 - Math.abs(s.c - (F_COLS - 1) / 2) / ((F_COLS - 1) / 2);
    const lx = s.x + out * (14 + hash(j, 30) * 22) * taper;
    const ly = s.y + 102 + hash(j, 31) * 26;
    const th = (STOP_DEG[j] * Math.PI) / 180;
    return {
      gi: p.gi,
      f: p.f,
      sx: s.x,
      sy: s.y,
      lx,
      ly,
      dx: STRUCT_CX + STOP_R * Math.cos(th) + (hash(j, 32) - 0.5) * 34,
      dy: STOP_R * Math.sin(th) + (hash(j, 33) - 0.5) * 34,
      liftT0: 13 + hash(j, 34) * 6,
      liftArc: (hash(j, 35) - 0.5) * 44,
      driftT0: 117 + hash(j, 36) * 5,
      driftArc: (hash(j, 37) - 0.5) * 70,
      ring: 0,
      edge: 0,
    };
  }).map((r, j) => {
    const rk = nearestRing(r.dx, r.dy);
    return { ...r, ring: rk, edge: adjoiningEdge(rk, j) };
  });
})();
const ROGUE_OF = new Int32Array(NSEAT).fill(-1);
ROGUES.forEach((r, j) => {
  ROGUE_OF[r.gi] = j;
});

const LIFT_DUR = 13;
const DRIFT_DUR = 15;
const PROV_DUR = 12; // a provenance thread's draw
const FIRE_DUR = 8; // an interfere thread's draw
// The interfere threads go in the order the rogues settled, two frames apart,
// so the first arrival lands on "with it" (f141) and the last by f150.
const FIRE_ORDER = ROGUES.map((_, j) => j).sort(
  (a, b) => ROGUES[a].driftT0 - ROGUES[b].driftT0,
);
const FIRE_T0 = new Float32Array(ROGUES.length);
FIRE_ORDER.forEach((j, rank) => {
  FIRE_T0[j] = 133 + rank * 1.7;
});

// ---------------------------------------------------------------------------
// The camera. One move. It opens inside the two fleets — at k 1.4 they bleed
// off both frame edges and the structure is out of frame below — and pulls
// back to k 0.95, where the whole composition (marks at the top, structure at
// the bottom) sits in frame. cy = contentCentre + 125/k at both keys, so the
// content's centre lands at screen y 835 at either zoom.
//   f0-96     k 1.40  content centre world y -530 (marks + fleets)
//   f96-110   -> 0.95 content centre world y -300 (marks + structure);
//                     the damped tracker settles by ~f116, ahead of
//                     "incentive to" at f117
// ---------------------------------------------------------------------------
const K0 = 1.4;
const K1 = 0.95;
const CY0 = -530 + 125 / K0;
const CY1 = -300 + 125 / K1;
const CAM_F = [0, 96, 110, DURATION];
const CAM_K = [K0, K0, K1, K1];
const CAM_CY = [CY0, CY0, CY1, CY1];

const RogueInstancesInterfere: React.FC<Props> = ({
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
  markSize,
  idleThreadCount,
  beats,
}) => {
  const frame = useCurrentFrame();

  // -- the rogues: lift, then drift ------------------------------------------
  const backEase = Easing.out(Easing.back(1.6));
  const outCubic = Easing.out(Easing.cubic);
  const rogueState = ROGUES.map((r) => {
    const t1 = interpolate(frame, [r.liftT0, r.liftT0 + LIFT_DUR], [0, 1], {
      ...clamp,
      easing: backEase,
    });
    const lin1 = clamp01((frame - r.liftT0) / LIFT_DUR);
    let x = r.sx + (r.lx - r.sx) * t1;
    let y = r.sy + (r.ly - r.sy) * t1;
    {
      const vx = r.lx - r.sx;
      const vy = r.ly - r.sy;
      const L = Math.hypot(vx, vy) || 1;
      const bow = Math.sin(Math.PI * lin1) * r.liftArc;
      x += (-vy / L) * bow;
      y += (vx / L) * bow;
    }
    const t2 = interpolate(frame, [r.driftT0, r.driftT0 + DRIFT_DUR], [0, 1], {
      ...clamp,
      easing: outCubic,
    });
    if (t2 > 0) {
      const bx = r.lx;
      const by = r.ly;
      const vx = r.dx - bx;
      const vy = r.dy - by;
      const L = Math.hypot(vx, vy) || 1;
      const bow = Math.sin(Math.PI * t2) * r.driftArc;
      x = bx + vx * t2 + (-vy / L) * bow;
      y = by + vy * t2 + (vx / L) * bow;
    }
    return {
      x,
      y,
      lifted: clamp01(lin1),
      base: OP_UNREAD_DOT + (OP_READ - OP_UNREAD_DOT) * smooth(lin1),
    };
  });

  // -- the fleets ------------------------------------------------------------
  const dots = SEATS.map((s, i) => {
    const j = ROGUE_OF[i];
    if (j >= 0) return { x: rogueState[j].x, y: rogueState[j].y, base: rogueState[j].base };
    return { x: s.x, y: s.y, base: OP_UNREAD_DOT };
  });

  // -- idle traffic inside each fleet ----------------------------------------
  const lit = new Float32Array(NSEAT);
  type Th = { key: string; x1: number; y1: number; x2: number; y2: number; op: number; head: number };
  const threadEls: Th[] = [];

  const reach = 4;
  for (let j = 0; j < idleThreadCount; j++) {
    const period = 44 - 12 * hash(j, 4);
    const local = frame + hash(j, 5) * period;
    const cycle = Math.floor(local / period);
    const phase = (local - cycle * period) / period;
    const seed = j * 131 + cycle * 7;
    const a = Math.floor(hash(seed, 6) * NSEAT);
    const sa = SEATS[a];
    if (ROGUE_OF[a] >= 0) continue;
    const bc = clampi(sa.c + Math.round((hash(seed, 7) - 0.5) * 2 * reach), 0, F_COLS - 1);
    const br = clampi(sa.row + Math.round((hash(seed, 8) - 0.5) * 2 * reach), 0, F_ROWS - 1);
    const b = SEAT_AT[sa.f * F_N + br * F_COLS + bc];
    if (b < 0 || b === a || ROGUE_OF[b] >= 0) continue;
    const dn = interpolate(phase, [0, 0.3], [0, 1], { ...clamp, easing: outCubic });
    const fade = interpolate(phase, [0.55, 1], [1, 0], clamp);
    if (fade <= 0.02) continue;
    lit[a] = Math.max(lit[a], fade);
    lit[b] = Math.max(lit[b], dn * fade);
    threadEls.push({
      key: `i${j}`,
      x1: dots[a].x,
      y1: dots[a].y,
      x2: dots[a].x + (dots[b].x - dots[a].x) * dn,
      y2: dots[a].y + (dots[b].y - dots[a].y) * dn,
      op: 0.4 * fade,
      head: dn,
    });
  }

  // -- provenance threads ----------------------------------------------------
  // From the mark to each of its three rogues, head-led with a white tip,
  // staggered three frames apart. They never fade: the rogue IS of that model,
  // so the endpoint follows it every frame and stays tethered.
  const markBeat = [beats.mythos, beats.astro];
  const provThreads: Th[] = [];
  const provArrived = new Float32Array(ROGUES.length);
  ROGUES.forEach((r, j) => {
    const t0 = markBeat[r.f] + (j % 3) * 3;
    if (frame < t0) return;
    const dn = interpolate(frame, [t0, t0 + PROV_DUR], [0, 1], { ...clamp, easing: outCubic });
    provArrived[j] = dn >= 1 ? 1 : 0;
    const F = FLEETS[r.f];
    const S = rogueState[j];
    const vx = S.x - F.mx;
    const vy = S.y - F.my;
    const L = Math.hypot(vx, vy) || 1;
    const x1 = F.mx + (vx / L) * (markSize * 0.56);
    const y1 = F.my + (vy / L) * (markSize * 0.56);
    provThreads.push({
      key: `pv${j}`,
      x1,
      y1,
      x2: x1 + (S.x - x1) * dn,
      y2: y1 + (S.y - y1) * dn,
      op: 0.95,
      head: dn,
    });
  });
  // the mark clicks ink-bright for 4 frames as its threads leave
  const markClick = markBeat.map((b) => (frame >= b && frame < b + 4 ? 1 : 0));

  // -- interfere threads -----------------------------------------------------
  // One from each rogue into its nearest ring. On arrival that ring and one
  // edge adjoining it turn accent and stay accent.
  const fireThreads: Th[] = [];
  const ringAccent = new Float32Array(RINGS.length);
  const edgeAccent = new Float32Array(STRUCTURE.length);
  let arrivals = 0;
  ROGUES.forEach((r, j) => {
    const t0 = FIRE_T0[j];
    if (frame < t0) return;
    const dn = clamp01((frame - t0) / FIRE_DUR);
    const S = rogueState[j];
    const R = RINGS[r.ring];
    const vx = R.x - S.x;
    const vy = R.y - S.y;
    const L = Math.hypot(vx, vy) || 1;
    const ex = R.x - (vx / L) * RING_R;
    const ey = R.y - (vy / L) * RING_R;
    fireThreads.push({
      key: `f${j}`,
      x1: S.x,
      y1: S.y,
      x2: S.x + (ex - S.x) * dn,
      y2: S.y + (ey - S.y) * dn,
      op: 0.95,
      head: dn,
    });
    if (dn >= 1) {
      arrivals += 1;
      const a = smooth((frame - (t0 + FIRE_DUR)) / 4);
      ringAccent[r.ring] = Math.max(ringAccent[r.ring], a);
      edgeAccent[r.edge] = Math.max(edgeAccent[r.edge], a);
    }
  });

  // The rest of the structure reads up off the arrival count, not a timer, so
  // the accent parts have an ink field to read against.
  const structOp = OP_UNREAD + (OP_READ - OP_UNREAD) * smooth(arrivals / ROGUES.length);

  // -- the structure's own packets, running since frame 0 --------------------
  const packets: { key: string; x: number; y: number }[] = [];
  for (let n = 0; ; n++) {
    const sf = n * PKT_PERIOD - PKT_LIFE;
    if (sf > frame) break;
    const age = frame - sf;
    if (age < 0 || age >= PKT_LIFE) continue;
    const e = STRUCTURE[EDGES[Math.floor(hash(n, 90) * EDGES.length)]];
    const A = RINGS[e.a];
    const B = RINGS[e.b];
    const L = Math.hypot(B.x - A.x, B.y - A.y) || 1;
    const ux = (B.x - A.x) / L;
    const uy = (B.y - A.y) / L;
    const x1 = A.x + ux * RING_R;
    const y1 = A.y + uy * RING_R;
    const x2 = B.x - ux * RING_R;
    const y2 = B.y - uy * RING_R;
    const t = age / (PKT_LIFE - 1);
    const p = hash(n, 92) < 0.5 ? t : 1 - t;
    packets.push({ key: `p${n}`, x: x1 + (x2 - x1) * p, y: y1 + (y2 - y1) * p });
  }

  // -- camera ----------------------------------------------------------------
  const cam = runCamera(frame, CAM_F, CAM_CY, CAM_K);
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = STRUCT_CX + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);
  // the instances' white rim, one screen px whatever the camera is doing
  const dotStroke = dotStrokeWidth(k);

  const structLine = (e: Edge) => {
    const A = RINGS[e.a];
    const B = RINGS[e.b];
    const L = Math.hypot(B.x - A.x, B.y - A.y) || 1;
    const ux = (B.x - A.x) / L;
    const uy = (B.y - A.y) / L;
    return {
      x1: A.x + ux * RING_R,
      y1: A.y + uy * RING_R,
      x2: B.x - ux * RING_R,
      y2: B.y - uy * RING_R,
    };
  };

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
            {/* the seats the rogues left behind */}
            {ROGUES.map((r, j) =>
              rogueState[j].lifted > 0 ? (
                <circle
                  key={`s${j}`}
                  cx={r.sx}
                  cy={r.sy}
                  r={dotRadius * SEATS[r.gi].r * SEATS[r.gi].rs}
                  fill="none"
                  stroke={ink}
                  strokeWidth={1.5}
                  opacity={OP_DARK * rogueState[j].lifted}
                />
              ) : null,
            )}

            {/* the infrastructure */}
            {STRUCTURE.map((e, ei) => {
              if (e.kind === "ring") {
                const R = RINGS[e.a];
                const acc = ringAccent[e.a];
                return (
                  <g key={`e${ei}`}>
                    <circle
                      cx={R.x}
                      cy={R.y}
                      r={RING_R}
                      fill="none"
                      stroke={ink}
                      strokeWidth={3.5}
                      opacity={structOp * (1 - acc)}
                    />
                    {acc > 0 ? (
                      <circle
                        cx={R.x}
                        cy={R.y}
                        r={RING_R}
                        fill="none"
                        stroke={accent}
                        strokeWidth={3.5}
                        opacity={OP_READ * acc}
                      />
                    ) : null}
                  </g>
                );
              }
              const L = structLine(e);
              const acc = edgeAccent[ei];
              return (
                <g key={`e${ei}`}>
                  <line
                    x1={L.x1}
                    y1={L.y1}
                    x2={L.x2}
                    y2={L.y2}
                    stroke={ink}
                    strokeWidth={3}
                    strokeLinecap="round"
                    opacity={structOp * (1 - acc)}
                  />
                  {acc > 0 ? (
                    <line
                      x1={L.x1}
                      y1={L.y1}
                      x2={L.x2}
                      y2={L.y2}
                      stroke={accent}
                      strokeWidth={3}
                      strokeLinecap="round"
                      opacity={OP_READ * acc}
                    />
                  ) : null}
                </g>
              );
            })}

            {/* the structure's own packets */}
            {packets.map((p) => (
              <circle key={p.key} cx={p.x} cy={p.y} r={PKT_R} fill={ink} />
            ))}

            {/* threads: fleet traffic, provenance, then the interference */}
            {[...threadEls, ...provThreads, ...fireThreads].map((t) => (
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

            {/* the instances */}
            {dots.map((d, i) => {
              const j = ROGUE_OF[i];
              const l = Math.max(lit[i], j >= 0 ? provArrived[j] : 0);
              const s = SEATS[i];
              const r = dotRadius * s.r * s.rs * breath(frame, hash(i, 9)) * (1 + 0.35 * l);
              const op = d.base + (OP_READ + 0.1 - d.base) * l;
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
          </svg>

          {/* the two model marks */}
          {FLEETS.map((F, fi) => (
            <Img
              key={F.src}
              src={staticFile(F.src)}
              style={{
                position: "absolute",
                left: F.mx - markSize / 2,
                top: F.my - markSize / 2,
                width: markSize,
                height: markSize,
                objectFit: "contain",
                filter: F.tint,
                opacity: OP_READ + (1 - OP_READ) * markClick[fi],
              }}
            />
          ))}
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default RogueInstancesInterfere;
