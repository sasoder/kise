import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  BG_BASE,
  BG_DIM,
  DOT_RADIUS,
  FRAME_H,
  FRAME_W,
  GridBackground,
  OP_READ,
  OP_UNREAD_DOT,
  Vignette,
  breath,
  clamp,
  dotStrokeWidth,
  feather,
  hash,
  runCamera,
  sway,
  wobble,
  worldTransform,
} from "./fieldShared";

export const FPS = 24;
// Ajeya Cotra, clip `Ajeya_Superhuman_Hackers`: "maybe more hacking effort, and
// at a higher level of competence, will be aimed at this training
// infrastructure than has cumulatively been spent on all of hacking, maybe,
// beforehand in human history".
//
// SRT span 0:40.200 -> 0:50.799 at 24fps.
// round((50.799 - 40.200) * 24) = round(10.599 * 24) = round(254.376) = 254
// frames of speech, plus a 16 frame tail so the resolved state holds = 270.
export const DURATION = 270;

// ---------------------------------------------------------------------------
// "More than all of history". Cut 2 of this clip: the same world as
// `ConstantlyBombarding` a few seconds later, so the field, the clearing, the
// structure, the packets and the bombardment are that file's, unchanged. What
// is new is a comparison you can see: the AI effort is a field that runs off
// the top, the left and the right of the frame at every camera position, and
// all of human hacking ever is one countable block of 108 people that fits
// under it with room to spare.
//
// Every gesture is one word. Nothing else happens.
//   open inside the field at k 1.25, cut 1's steady
//     state: ~2.5 launches a frame, crowd at
//     OP_UNREAD_DOT, ink structure under fire         — "maybe more hacking
//                                                    effort"              f0
//   each thread arrival now converts the ring it
//     hits and one adjoining edge to accent; the
//     conversion spreads through the structure's
//     own graph with the arrivals until the whole
//     thing is accent — the AI is inside it       — "and at a higher level
//                                                    of competence"       f35-68
//   push in, k 1.25 -> 1.36, keyed f54-72 and
//     settled by f77, held through the phrase     — "aimed at this training
//                                                    infrastructure"      f54-77
//   pull back, k 1.36 -> 0.615, keyed f104-136 and
//     settled by f148: the field's bottom edge and
//     the empty ground below it. One long gentle
//     move; nothing new appears while it runs      — "than has"            f104-148
//   the humans arrive from the past: each glyph
//     enters from beyond the left edge at its
//     seat's height, on its own shallow arc, and
//     eases into its seat. Right-hand columns
//     first, rows hashed. The rate accelerates
//     from one every five frames to three a frame
//     so the 108th lands on "history"             — "cumulatively been
//                                                    spent on all of
//                                                    hacking, maybe,
//                                                    beforehand in human
//                                                    history"             f150-245
//   hold resolved, never fades                     — tail                  f254-270
//
// ambient: the idle traffic (180 threads at 0.3), the structure's own packets
// (a 4px ink bead running one edge every 7 frames) and the bombardment itself
// run from f0 to f270. They are not gestures; they are what this world is. The
// bombardment eases from 2.5 to 1.4 launches a frame across f68-92, once the
// conversion is complete — still constant fire, with air around the structure.
//
// consistency pass: accent #E0643A, feathered crowd edges
// sleek pass: OP_UNREAD_DOT (0.58) on the field's dots, because #E0643A at 0.45
// over the grid read as dirt; the converted structure held at opacity 1.0 (it
// is the subject) with the launch rate easing 2.5 -> 1.4 and the idle traffic
// down to 0.3, so an accent structure inside an accent field still reads; the
// two camera moves softened to k 1.36 and 0.615 on longer ramps, and the
// resolved framing dropped so the structure sits at screen y 360 and the human
// block bottom at 1446. Gestures and beats unchanged.
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
  idleThreadCount: z.number(), // capped, never scaled with the seat count
  beats: z.object({
    maybeMore: z.number(), // "maybe more"
    hackingEffort: z.number(), // "hacking effort"
    higher: z.number(), // "and at a higher"
    levelOf: z.number(), // "level of"
    competence: z.number(), // "competence"
    willBe: z.number(), // "will be"
    aimedAt: z.number(), // "aimed at this"
    training: z.number(), // "training"
    infrastructure: z.number(), // "infrastructure"
    thanHas: z.number(), // "than has"
    cumulatively: z.number(), // "cumulatively"
    beenSpent: z.number(), // "been spent"
    onAllOf: z.number(), // "on all of"
    hackingMaybe: z.number(), // "hacking, maybe"
    beforehand: z.number(), // "beforehand"
    inHuman: z.number(), // "in human"
    history: z.number(), // "history"
    end: z.number(), // speech ends; tail to 270
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
  idleThreadCount: 180,
  beats: {
    maybeMore: 0,
    hackingEffort: 17,
    higher: 35,
    levelOf: 50,
    competence: 61,
    willBe: 70,
    aimedAt: 77,
    training: 104,
    infrastructure: 111,
    thanHas: 124,
    cumulatively: 150,
    beenSpent: 165,
    onAllOf: 179,
    hackingMaybe: 201,
    beforehand: 219,
    inHuman: 235,
    history: 245,
    end: 254,
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
// The camera. Three moves, each on a word. cy = contentCentre + 125 / k, so the
// content block's centre sits at screen y 835 at every camera position.
//
//   f0-54     k 1.25  inside the field, structure centred (content centre 0)
//   f54-72    -> 1.36 the push. A gentler move on a longer ramp than the 1.45
//                     it was: the damper reaches 1.354 by "aimed at this"
//                     (f77) and 1.360 by f90, so it is settled under the word
//                     and reads as one slow lean rather than a shove.
//   f104-136  -> 0.615 the pull-back, its front lengthened by six frames so the
//                     push and the pull read as one hand and not two. Content
//                     centre moves to 772. Settles f148, ahead of
//                     "cumulatively" (f150).
//
// At the resolved frame the structure's centre sits at screen y 360, the
// field's bottom edge at 914, the human block runs 965 to 1446, and its side
// margins are 214. The block used to end at 1396 with the structure up at 260;
// dropping the whole thing is done by taking k from 0.635 to 0.615 and moving
// the content centre with it, never by moving anything in the world.
// ---------------------------------------------------------------------------
const STRUCT_CX = 540;
const K_FINAL = 0.615;
const CONTENT_CENTRE = 772;
const CY_FINAL = CONTENT_CENTRE + 125 / K_FINAL;
const CAM_F = [0, 54, 72, 104, 136, DURATION];
const CAM_K = [1.25, 1.25, 1.36, 1.36, K_FINAL, K_FINAL];
const CAM_CY = [125 / 1.25, 125 / 1.25, 125 / 1.36, 125 / 1.36, CY_FINAL, CY_FINAL];
// The frame's own extremes over the whole track: the widest zoom decides how
// far out the field has to reach sideways, the opening — tight but low —
// decides how far it has to reach up.
const K_WIDEST = Math.min(...CAM_K);
const CAM_TOP = Math.min(...CAM_K.map((k, i) => CAM_CY[i] - FRAME_H / 2 / k));

// ---------------------------------------------------------------------------
// The infrastructure, exactly as cut 1 built it: seven ink rings in two knots
// plus the middle one they join through, off a rough two-lobe layout by a
// hashed offset so it is a cluster and not a lattice. Complete from f0 here —
// this piece opens on a running thing.
// ---------------------------------------------------------------------------
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
const STRUCT_HALF_W = Math.max(...RINGS.map((r) => Math.abs(r.x - STRUCT_CX))) + RING_R;

// The clearing, cut 1's: mean radius 1.22x the structure's half-width, softened
// by +/-5% harmonics, ragged by a per-seat hash where the seats are laid out.
const KEEP_BASE = 1.22 * STRUCT_HALF_W;
const KEEP_FLOOR = STRUCT_HALF_W + 16;
const clearingAt = (theta: number) =>
  Math.max(
    KEEP_FLOOR,
    KEEP_BASE * (1 + 0.03 * Math.sin(3 * theta + 1.2) + 0.02 * Math.sin(5 * theta - 0.4)),
  );

type Elem = { kind: "ring" | "line"; a: number; b: number };
const STRUCTURE: Elem[] = [
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
const NELEM = STRUCTURE.length;
// element index of each ring, the line elements touching each ring, and each
// ring's neighbours through those lines — the graph the conversion spreads on.
const RING_ELEM: number[] = [];
STRUCTURE.forEach((e, i) => {
  if (e.kind === "ring") RING_ELEM[e.a] = i;
});
const INC_LINES = RINGS.map((_, r) =>
  STRUCTURE.map((e, i) => (e.kind === "line" && (e.a === r || e.b === r) ? i : -1)).filter(
    (i) => i >= 0,
  ),
);
const NEIGH = RINGS.map((_, r) =>
  STRUCTURE.filter((e) => e.kind === "line" && (e.a === r || e.b === r)).map((e) =>
    e.a === r ? e.b : e.a,
  ),
);

// ---------------------------------------------------------------------------
// The field. Cut 1's step (940/39 x 440/29), jitter 0.9, radius spread
// 0.75-1.25; only the area is different. It bleeds past the top, the left and
// the right of the frame at every camera in this piece, and its bottom is the
// only edge the camera ever sees.
//
// That bottom is not a ruled line. Its nominal height stays world y 900 — the
// gap to the human block is measured off it — but it undulates along x by
// `wobble` and the field dissolves into it: over the FEATHER_STEPS rows above
// the nominal edge a seat only exists if its hash falls under `feather`, and
// what survives is drawn smaller. The field thins out into the ground instead
// of stopping at a ruler. 77 x 108 seats laid out, 7,806 before the feather.
// ---------------------------------------------------------------------------
const STEP_X = 940 / 39;
const STEP_Y = 440 / 29;
const BLEED = 60;
const FIELD_BOTTOM = 900;
const EDGE_SEED = 2.1;
// the nominal bottom edge at world x, in world px
const edgeAt = (x: number) => FIELD_BOTTOM + wobble(x, EDGE_SEED) * STEP_Y;
const SEAT_X0 = STRUCT_CX - FRAME_W / 2 / K_WIDEST - BLEED;
const SEAT_X1 = STRUCT_CX + FRAME_W / 2 / K_WIDEST + BLEED;
const SEAT_Y0 = CAM_TOP - BLEED;
const COLS = Math.round((SEAT_X1 - SEAT_X0) / STEP_X) + 1;
const ROWS = Math.round((FIELD_BOTTOM - SEAT_Y0) / STEP_Y) + 1;
const GRID_X0 = (SEAT_X0 + SEAT_X1) / 2 - ((COLS - 1) * STEP_X) / 2;
const GRID_Y0 = FIELD_BOTTOM - (ROWS - 1) * STEP_Y;

type Seat = { x: number; y: number; r: number; rs: number; gc: number; gr: number };
const SEATS: Seat[] = (() => {
  const out: Seat[] = [];
  for (let gr = 0; gr < ROWS; gr++) {
    for (let gc = 0; gc < COLS; gc++) {
      const i = gr * COLS + gc;
      const x = GRID_X0 + gc * STEP_X + (hash(i, 11) - 0.5) * STEP_X * 0.9;
      const y = GRID_Y0 + gr * STEP_Y + (hash(i, 12) - 0.5) * STEP_Y * 0.9;
      // the bottom edge: undulating, and feathered over the rows above it
      const fe = feather((edgeAt(x) - y) / STEP_Y);
      if (hash(i, 71) >= fe) continue;
      const d = Math.hypot(x - STRUCT_CX, y);
      const edge = clearingAt(Math.atan2(y, x - STRUCT_CX)) * (1 + (hash(i, 60) - 0.5) * 0.13);
      if (d < edge) continue;
      out.push({ x, y, r: 0.75 + 0.5 * hash(i, 13), rs: 0.7 + 0.3 * fe, gc, gr });
    }
  }
  return out;
})();
const NSEAT = SEATS.length;

// grid cell -> seat, so idle traffic can find a neighbour without a search
const SEAT_AT = new Int32Array(COLS * ROWS).fill(-1);
SEATS.forEach((s, i) => {
  SEAT_AT[s.gr * COLS + s.gc] = i;
});

// ---------------------------------------------------------------------------
// The human ground. All of hacking, ever: 12 columns x 9 rows = 108 people,
// hashed off an 86px lattice by half a step, below the field's bottom edge.
// Empty until they arrive. A glyph is `person.png` at 72 world px, ink.
// ---------------------------------------------------------------------------
const HUM_COLS = 12;
const HUM_ROWS = 9;
const HUM_N = HUM_COLS * HUM_ROWS;
const HUM_STEP_X = 86;
const HUM_TOP = 1040;
const HUM_BOTTOM = 1730;
const HUM_STEP_Y = (HUM_BOTTOM - HUM_TOP) / (HUM_ROWS - 1);
const HUM_SIZE = 72;
const LEFT_EDGE = STRUCT_CX - FRAME_W / 2 / K_WIDEST; // world x of the frame's left edge

type Human = {
  x: number;
  y: number;
  sx: number;
  sy: number;
  arc: number;
  dur: number;
  t0: number;
  seed: number;
};

// The arrival schedule. A cumulative sum, not a metronome: the rate starts at
// one every five frames on "cumulatively" and accelerates as u^2 to ~3 a frame,
// integrating to exactly 108 launches, timed so the last glyph settles on
// "history" (f245). Fill order is right-hand columns first — nearest the
// structure — back to the left, rows hashed, so the block grows from the
// structure's side outward.
const HUMANS: Human[] = (() => {
  const seats = [] as { x: number; y: number; key: number; i: number }[];
  for (let r = 0; r < HUM_ROWS; r++) {
    for (let c = 0; c < HUM_COLS; c++) {
      const i = r * HUM_COLS + c;
      seats.push({
        x:
          STRUCT_CX +
          (c - (HUM_COLS - 1) / 2) * HUM_STEP_X +
          (hash(i, 41) - 0.5) * HUM_STEP_X * 0.5,
        y: HUM_TOP + r * HUM_STEP_Y + (hash(i, 42) - 0.5) * HUM_STEP_Y * 0.5,
        key: (HUM_COLS - 1 - c) * 9 + hash(i, 43) * 9.5,
        i,
      });
    }
  }
  seats.sort((a, b) => a.key - b.key);

  const flights = seats.map((s, n) => {
    // out of the past: beyond the left edge of the frame, and never less than
    // 500-700 world px out from its own seat
    const sx = Math.min(
      s.x - (500 + 200 * hash(s.i, 44)),
      LEFT_EDGE - 90 - 170 * hash(s.i, 45),
    );
    const sy = s.y + (hash(s.i, 46) - 0.5) * 44;
    const dist = Math.hypot(s.x - sx, s.y - sy);
    // 15-22 frames: long enough to read as a journey, short enough that the
    // block's last gaps are still gaps at f230 and not glyphs hovering over
    // their own seats
    return { ...s, n, sx, sy, dist, dur: 12 + dist / 150 };
  });

  // 146, not 150: at the opening rate the first launch is five frames after
  // the schedule starts, and it has to be crossing the frame edge on the word.
  const F_START = 146;
  const F_END = 245 - flights[flights.length - 1].dur; // the 108th lands on "history"
  const span = F_END - F_START;
  const R0 = 0.2; // one every five frames at the start
  const A = 3 * (HUM_N / span - R0); // so the rate curve integrates to 108
  const cum = (u: number) => span * (R0 * u + (A * u * u * u) / 3);

  return flights.map((f) => {
    let lo = 0;
    let hi = 1;
    for (let it = 0; it < 40; it++) {
      const mid = (lo + hi) / 2;
      if (cum(mid) < f.n + 1) lo = mid;
      else hi = mid;
    }
    return {
      x: f.x,
      y: f.y,
      sx: f.sx,
      sy: f.sy,
      arc: (hash(f.i, 47) - 0.5) * 70,
      dur: f.dur,
      t0: F_START + ((lo + hi) / 2) * span,
      seed: f.i,
    };
  });
})();

// Which ring a launch hits: the nearest, or any within 1.12x of it. Cut 1's
// rule, unchanged — it is what keeps fire off the far face of the structure.
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

// The bombardment: draw 10, hold 4, fade 8. It opens at cut 1's steady rate of
// 2.5 launches a frame, and once the conversion is complete (f68) it eases down
// to 1.4 over 24 frames and holds there for the rest of the piece. At 2.5 an
// accent structure inside an accent field is buried under its own incoming
// fire; at 1.4 the threads still read as constant bombardment and the structure
// gets air. The ease is on the rate, not on any element's opacity.
const T_DRAW = 10;
const T_HOLD = 4;
const T_FADE = 8;
const T_LIFE = T_DRAW + T_HOLD + T_FADE;
const RATE_OPEN = 2.5;
const RATE_HELD = 1.4;
const RATE_F0 = 68; // the frame the last element finishes converting
const RATE_RAMP = 24;

// How long an element takes to turn from ink to accent, and the gate on the
// spread: a ring can only be reached once the conversion next to it has
// finished travelling. Five frames puts the last element over at f68, so the
// structure is entirely accent before the push settles on "aimed at this".
const CONV_T = 5;

// The structure's own packets: an ink bead running one of its edges over 14
// frames, a new one every 7, two alive at once, for the whole piece.
const EDGES = STRUCTURE.map((e, i) => (e.kind === "line" ? i : -1)).filter((i) => i >= 0);
const PKT_PERIOD = 7;
const PKT_LIFE = 14;
const PKT_R = 4;

const MoreThanAllOfHistory: React.FC<Props> = ({
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
  idleThreadCount,
  beats,
}) => {
  const frame = useCurrentFrame();

  // -- idle traffic ----------------------------------------------------------
  // Capped at 180 threads whatever the seat count, at 0.3, so it stays ambient:
  // this piece ends with an accent structure standing in an accent field, and
  // the traffic between them has to sit below both.
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
    const sa = SEATS[a];
    const bc = clampi(sa.gc + Math.round((hash(seed, 7) - 0.5) * 2 * reach), 0, COLS - 1);
    const br = clampi(sa.gr + Math.round((hash(seed, 8) - 0.5) * 2 * reach), 0, ROWS - 1);
    const b = SEAT_AT[br * COLS + bc];
    if (b < 0 || b === a) continue;
    const sb = SEATS[b];
    const dn = interpolate(phase, [0, 0.3], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
    const fade = interpolate(phase, [0.55, 1], [1, 0], clamp);
    if (fade <= 0.02) continue;
    lit[a] = Math.max(lit[a], fade);
    lit[b] = Math.max(lit[b], dn * fade);
    threadEls.push({
      key: `i${j}`,
      x1: sa.x,
      y1: sa.y,
      x2: sa.x + (sb.x - sa.x) * dn,
      y2: sa.y + (sb.y - sa.y) * dn,
      op: 0.3 * fade,
      head: dn,
    });
  }

  // -- the bombardment, and the conversion it drives -------------------------
  // One launch schedule replayed at cut 1's steady rate, and started a full
  // thread-life before f0 so the piece opens mid-barrage. Every arrival
  // clicks the ring it lands on; from "and at a higher level" (f35) an arrival
  // also converts that ring and one edge leaving it to accent, and a converted
  // edge carries the conversion into the ring at its far end. Nothing here runs
  // on a timer: the spread is the arrivals, and the frame each element turns is
  // the frame a thread reached it.
  const ringClick = new Float32Array(RINGS.length);
  const convAt = new Float32Array(NELEM).fill(Infinity);
  let acc = 0;
  let launch = 0;
  for (let f = -T_LIFE; f <= frame; f++) {
    acc += RATE_OPEN + (RATE_HELD - RATE_OPEN) * smooth((f - RATE_F0) / RATE_RAMP);
    while (acc >= 1) {
      acc -= 1;
      const j = launch++;
      const arrive = f + T_DRAW;
      const si = Math.floor(hash(j, 71) * NSEAT);
      const S = SEATS[si];
      const rk = targetRing(S.x, S.y, j);

      if (arrive <= frame && arrive >= beats.higher) {
        // a converted edge carries the conversion into both its rings
        for (let i = 0; i < NELEM; i++) {
          if (STRUCTURE[i].kind !== "line" || convAt[i] === Infinity) continue;
          const t = convAt[i] + CONV_T;
          if (t > arrive) continue;
          for (const r of [STRUCTURE[i].a, STRUCTURE[i].b]) {
            const re = RING_ELEM[r];
            if (convAt[re] > t) convAt[re] = t;
          }
        }
        const re = RING_ELEM[rk];
        const started = convAt.some((c) => c < Infinity);
        const reached =
          !started ||
          NEIGH[rk].some((r) => convAt[RING_ELEM[r]] + CONV_T <= arrive) ||
          INC_LINES[rk].some((i) => convAt[i] + CONV_T <= arrive);
        if (convAt[re] === Infinity && reached) convAt[re] = arrive;
        if (convAt[re] <= arrive) {
          const cand = INC_LINES[rk].filter((i) => convAt[i] === Infinity);
          if (cand.length) convAt[cand[Math.floor(hash(j, 74) * cand.length)]] = arrive;
        }
      }

      const age = frame - f;
      if (age > T_LIFE) continue;
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
  const conv = Array.from(convAt, (c) => (c === Infinity ? 0 : smooth((frame - c) / CONV_T)));

  // -- the structure's own packets -------------------------------------------
  const packets: { key: string; x: number; y: number }[] = [];
  for (let n = 0; ; n++) {
    const sf = n * PKT_PERIOD - PKT_LIFE;
    if (sf > frame) break;
    const age = frame - sf;
    if (age >= PKT_LIFE || age < 0) continue;
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

  // -- the humans ------------------------------------------------------------
  // Each glyph's position and opacity come from its own arrival progress.
  const humans = HUMANS.map((h) => {
    if (frame < h.t0) return null;
    const lin = clamp01((frame - h.t0) / h.dur);
    const e = Easing.out(Easing.cubic)(lin); // eases in, never overshoots
    const dx = h.x - h.sx;
    const dy = h.y - h.sy;
    const L = Math.hypot(dx, dy) || 1;
    const bow = Math.sin(Math.PI * e) * h.arc;
    return {
      x: h.sx + dx * e + (-dy / L) * bow,
      y: h.sy + dy * e + (dx / L) * bow,
      op: OP_READ * smooth(lin / 0.18),
      seed: h.seed,
    };
  });

  // -- camera ----------------------------------------------------------------
  const cam = runCamera(frame, CAM_F, CAM_CY, CAM_K);
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = STRUCT_CX + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);
  // the field's white rim, one screen px whatever the camera is doing
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
            {/* the field */}
            {SEATS.map((s, i) => {
              const l = lit[i];
              const r = dotRadius * s.r * s.rs * breath(frame, hash(i, 9)) * (1 + 0.35 * l);
              const op = OP_UNREAD_DOT + (OP_READ + 0.1 - OP_UNREAD_DOT) * l;
              return (
                <circle
                  key={i}
                  cx={s.x}
                  cy={s.y}
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

            {/* the infrastructure: ink at OP_READ, crossfading to accent at
                the top of the ladder — once it is converted it is the subject,
                and it has to hold its own against an accent field */}
            {STRUCTURE.map((e, ei) => {
              const p = conv[ei];
              if (e.kind === "ring") {
                const R = RINGS[e.a];
                const op = Math.min(1, OP_READ + (1 - OP_READ) * ringClick[e.a]);
                return (
                  <g key={`e${ei}`}>
                    <circle
                      cx={R.x}
                      cy={R.y}
                      r={RING_R}
                      fill="none"
                      stroke={ink}
                      strokeWidth={3.5}
                      opacity={op * (1 - p)}
                    />
                    <circle
                      cx={R.x}
                      cy={R.y}
                      r={RING_R}
                      fill="none"
                      stroke={accent}
                      strokeWidth={3.5}
                      opacity={p}
                    />
                  </g>
                );
              }
              const A = RINGS[e.a];
              const B = RINGS[e.b];
              const L = Math.hypot(B.x - A.x, B.y - A.y) || 1;
              const ux = (B.x - A.x) / L;
              const uy = (B.y - A.y) / L;
              const x1 = A.x + ux * RING_R;
              const y1 = A.y + uy * RING_R;
              const x2 = B.x - ux * RING_R;
              const y2 = B.y - uy * RING_R;
              return (
                <g key={`e${ei}`}>
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={ink}
                    strokeWidth={3}
                    strokeLinecap="round"
                    opacity={OP_READ * (1 - p)}
                  />
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={accent}
                    strokeWidth={3}
                    strokeLinecap="round"
                    opacity={p}
                  />
                </g>
              );
            })}

            {/* the structure's own packets */}
            {packets.map((p) => (
              <circle key={p.key} cx={p.x} cy={p.y} r={PKT_R} fill={ink} />
            ))}
          </svg>

          {/* all of human hacking, ever */}
          {humans.map((h) =>
            h ? (
              <Img
                key={h.seed}
                src={staticFile("person.png")}
                style={{
                  position: "absolute",
                  left: h.x - HUM_SIZE / 2,
                  top: h.y - HUM_SIZE / 2,
                  width: HUM_SIZE,
                  height: HUM_SIZE,
                  filter: "brightness(0) invert(1)",
                  opacity: h.op,
                }}
              />
            ) : null,
          )}
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default MoreThanAllOfHistory;
