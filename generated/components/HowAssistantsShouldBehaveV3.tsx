import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
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
  OP_UNREAD_DOT,
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
  idleThreads,
  makeTone,
  runCamera,
  smoothstep,
  sway,
  wobble,
  worldTransform,
} from "./fieldShared";
import { DARK_TRAFFIC_OPACITY, Packet, WAKE_LEAD, arriveEase, holdDriftK } from "./levelUp";

export const FPS = 24;

// Ajeya Cotra, clip `HowAssistantsShouldBehave`: "Something like deciding how
// the AI, the assistants should behave, or what it means to be helpful, or
// what's like the objective when we're doing RL from human feedback."
//
// The composition starts at SRT 6.16 s, so every beat below is
// frame = round((t - 6.16) * 24). The next word after this line ("then") lands
// at f205, so the speech runs 0..205 and a 16 frame tail holds the resolved
// state: DURATION = 205 + 16 = 221.
export const DURATION = 221;

// ---------------------------------------------------------------------------
// "People draw the shape, the orange dots fill it." The clip's rule, and this
// cut is the plainest statement of it: five white person glyphs stand above an
// orange crowd, one of them draws an ink outline down and around the crowd, and
// the crowd rearranges itself to live inside that outline. The decision is
// redrawn once (a narrower, taller shape) and the crowd follows it. Then the
// crowd gets restless inside the shape, and accent threads from the people
// settle it dot by dot.
//
// Vocabulary, fixed for the whole clip and not restated per cut:
//   people            = person.png glyphs, white, 72 world px, countable
//   assistants        = orange dots, solid, ACCENT_DEEP at rest, ACCENT lit
//   a human decision  = white ink structure that comes from the people
//   feedback          = accent threads from the people that convert what they hit
//
// Every gesture is one word. Nothing else happens.
//   the standing scene: people above, crowd below,
//     settling in over 12 f then breathing          — "something"       f0-12
//   the decision leaves the middle person: one ink
//     stroke head-led down to the crowd...          — "deciding"        f11-30
//   ...and on around it as a closed rounded shape,
//     drawn clockwise from the top, closing 7 f
//     before the word it is named on                — "how the AI,
//                                                      the assistants"  f30-66
//   camera: one slow creep down with the stroke,
//     content centre 835 -> 860, landing f~60       — (rides "deciding") f14-60
//   the dots conform: every dot slides to its own
//     seat inside the shape on its own shallow arc,
//     ring edge first and centre last, each going
//     deep -> ripe as the wave reaches it           — "behave"          f73-96
//   the shape is REDRAWN, not joined: one
//     continuous morph 560x420 -> 440x500, and each
//     dot slides in with the boundary as it reaches
//     it, landing 4 f before the word               — "means...
//                                                      helpful"         f98-116
//   the zoom: creep in on the shape, landing on
//     k 1.344, settling ahead of the word           — "objective"       f130-141
//   exploration: the crowd shuffles inside the
//     shape, ~40% of it at a time, each dot a
//     one-seat hop with a ripe -> deep -> ripe
//     flicker while it moves; it stirs on "doing"
//     and is fully restless on "RL"                 — "doing RL"        f167-205
//   the people answer: accent threads launch from
//     the five glyphs, head-led, to a dot inside the
//     shape; a dot a thread reaches stops shuffling
//     and stays ripe on its seat                    — "human feedback"  f185-221
//   tail: threads at half the rate, nothing left
//     hopping, the crowd milling and breathing      —                   f205-221
//
// ---------------------------------------------------------------------------
// V3 — THE LIVENESS PASS. On the director's note that V2 "looks much better,
// but it's still a bit static. The dots could be moving more". Every beat, word
// frame, camera landing and the picture itself are unchanged: what follows is
// life BETWEEN and UNDER the gestures above, built from this scene's own
// material. Nothing here is a new gesture on a word.
//
//   1. THE CROWD IS NEVER STILL                                     f0-221
//      * micro-drift: every dot wanders +-3 world px on two hashed
//        sines (periods ~26 and ~41 f, never in unison), at rest, in
//        the shape, in every hold and through the tail. A dot the
//        feedback has settled keeps this and nothing else.
//      * the mill, before the shape (f0 -> each dot's own conform):
//        three launches every two frames, each an exchange of two
//        neighbouring dots passing on opposite 14 f arcs, so ~42 of
//        the 156 dots are crossing the crowd at any moment. The
//        blob is saturated —
//        there is no vacant seat inside it — so a mill there is a
//        swap, not a hop.
//      * the mill, inside the shape (f117-221): one hop every 5 f to
//        a vacant neighbouring seat, on the same occupancy map the
//        restless hops and the settled dots share. It never stops.
//   2. DARK TRAFFIC                                                 f0-221
//      Idle accent threads between neighbouring dots at 0.12, no
//      heads, at the house rate, idleThreads(N). Across the
//      loose crowd before the shape, inside the shape after "behave",
//      thinning from "human feedback" as settled dots drop out.
//   3. THE DRAWING DISTURBS THE CROWD                               f30-86
//      A dot within 70 world px of the pen head is pushed up to 25 px
//      away from it and drifts back over 20 f. The line is physical.
//   4. THE STROKE HAS A HEAD                                        f11-97
//      The drawing head is screen-space (4.5 px at any k), and on
//      "behave" a single white packet with its trail runs one lap of
//      the closed outline in 24 f as the conform wave starts. No
//      packets on the outline after f97.
//   5. THE CAMERA NEVER PARKS                                       f0-221
//      Six moves through one damped runCamera, each landing 6-10 f
//      ahead of its word, and a straight-ramp hold drift of ~1 screen
//      px/frame continuing the last move after every landing:
//        f0-14    the opening creep, centre 830 -> 835
//        f14-60   creep down with the pen, centre 835 -> 860
//        f60-66   drift on, centre -> 865      (then 6 f DEAD STILL,
//                                               the held breath, as
//                                               the outline closes)
//        f73-90   settle push with the conform wave, k +0.01
//        f90-98   zoom drift on (holdDriftK)
//        f98-116  push in with the morph, k +0.02: the boundary comes
//                 toward the lens
//        f116-130 pan drift on, centre -> 883
//        f130-141 the creep-in, landing k 1.344 before "objective"
//        f141-172 zoom drift on (holdDriftK), f172-205 pan drift on
//        f205-221 the tail: a slow pull-back, k -0.04, on the settled
//                 crowd
//   6. THE PEOPLE ARE ALIVE                                         f0-221
//      Each glyph sways +-1.5 screen px on its own hashed sines, and
//      lifts 3 screen px over the 8 f BEFORE it launches a thread
//      (WAKE_LEAD), settling as the thread leaves.
//   7. FEEDBACK SPREADS                                             f185-221
//      A thread landing settles its dot AND calms its one-seat ring
//      for 6 f (hashed), so stillness visibly spreads from each hit.
//   8. ARRIVE EASE
//      Thread heads, mill swaps and mill hops decelerate over the last
//      15% of their travel (arriveEase) instead of stopping dead.
//
// Deviations from the brief, and why:
//   * The crowd's lattice is 40x40 world px, not the shared field step
//     (940/39 x 440/29 = 24.1 x 15.2). At the shared step a 318-radius blob
//     holds ~800 dots; the brief asks for ~140, which is the countable crowd
//     this cut needs, and 40x40 puts 156 of them in it — 156 dots in 176
//     seats, so the shuffle always has somewhere to hop.
//   * The outline is a rounded rectangle with circular corners at 22% of its
//     shorter side, not `squirclePath`. Two reasons: at the shared
//     SQUIRCLE_RATIO of 0.012 the shape is a rectangle with 2 px corners, and
//     the draw is head-led, which needs a closed-form arc-length
//     parameterisation that a continuous corner does not have.
//   * The threads launch at five glyphs x one per ten frames, read as a
//     per-glyph cadence. Each glyph reaches only its own column of the shape,
//     or the five fans cross into a tangle.
//   * The camera rests at k 1.20, not 1.0. At k 1.0 the whole composition —
//     a 620 px crowd under a 536 px row of people — sits in the middle of the
//     frame with 270 px of empty grid either side and reads as a small object
//     a long way off. 1.20 is the widest the crowd can be opened to with its
//     bottom edge still clear of the captions. The crowd and the shape sit at
//     world y 854 rather than 900 for the same reason.
//   * V3 only: the mill BEFORE the shape is an exchange of two dots, not a hop
//     to a vacant seat. The blob is saturated — every interior lattice cell is
//     occupied, so the only vacancies are outside its own edge, and hopping
//     into them would grow the crowd. An exchange keeps the crowd's outline
//     exactly and mills the interior, which is where a crowd mills.
//   * V3 only: a thread's flight is lengthened when the dot is far, so no head
//     crosses more than 45 screen px/frame at the zoomed k. The cadence (one
//     launch per glyph per 10 f, halving in the tail) is untouched.
//   * V3 only: the outline packet laps a ~1850 px perimeter in the 24 f the
//     brief asks for, which is 92 screen px/frame — over the set's head-speed
//     cap. It keeps the 24 f because the lap has to finish before the morph
//     starts at f98, and it carries the set's motion trail, which is exactly
//     the mitigation for a fast head at 24 fps. It is the only thing in the
//     piece above the cap.
//   * V3 only: the conform and the morph keep their approved inOut-cubic
//     easings rather than arriveEase — both already decelerate into their
//     landing, and they are the two gestures the director signed off.
// ---------------------------------------------------------------------------

export const schema = z.object({
  ink: z.string(),
  accent: z.string(), // ripe: a lit dot, and every thread
  accentDeep: z.string(), // deep: a dot at rest
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
  dotUnread: z.number(), // the dot body's opacity; the state ladder is colour
  beats: z.object({
    something: z.number(), // "something"
    deciding: z.number(), // "deciding"
    how: z.number(), // "how"
    theAI: z.number(), // "the AI"
    assistants: z.number(), // "assistants"
    should: z.number(), // "should"
    behave: z.number(), // "behave"
    or: z.number(), // "or"
    means: z.number(), // "means"
    helpful: z.number(), // "helpful"
    or2: z.number(), // "or"
    objective: z.number(), // "objective"
    doing: z.number(), // "doing"
    rl: z.number(), // "RL"
    human: z.number(), // "human"
    feedback: z.number(), // "feedback"
    end: z.number(), // next word "then"; tail to 221
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
  dotUnread: OP_UNREAD_DOT,
  beats: {
    something: 0,
    deciding: 11,
    how: 22,
    theAI: 45,
    assistants: 60,
    should: 68,
    behave: 73,
    or: 81,
    means: 98,
    helpful: 120,
    or2: 127,
    objective: 147,
    doing: 167,
    rl: 173,
    human: 185,
    feedback: 190,
    end: 205,
  },
});

const WORLD_W = 1080;
const WORLD_H = 1920;

const CX = 540;
const CONTENT_C = 835; // the camera's content centre at rest; screen y 835 at k 1

// ---------------------------------------------------------------------------
// The people. A countable row of five, on the column axis, above the crowd.
// ---------------------------------------------------------------------------
const PEOPLE_N = 5;
const PEOPLE_STEP = 110;
const PEOPLE_Y = 460;
const GLYPH = 72;
const PEOPLE: { x: number; y: number }[] = Array.from({ length: PEOPLE_N }, (_, i) => ({
  x: CX + (i - (PEOPLE_N - 1) / 2) * PEOPLE_STEP,
  y: PEOPLE_Y,
}));
const MIDDLE = (PEOPLE_N - 1) / 2;

// ---------------------------------------------------------------------------
// The shape the people decide. A rounded rectangle centred on the crowd, drawn
// clockwise from top-centre so the stroke that arrives from the middle person
// carries straight on into it. State A is what "behave" is decided as; state B
// is the redraw on "what it means to be helpful" — narrower and taller, the
// same centre, one continuous morph between them.
// ---------------------------------------------------------------------------
const SHAPE_CX = 540;
const SHAPE_CY = 854;
const SHAPE_A = { w: 560, h: 420 };
const SHAPE_B = { w: 440, h: 500 };
const SHAPE_RATIO = 0.22; // corner radius as a fraction of the shorter side
const cornerR = (w: number, h: number) => SHAPE_RATIO * Math.min(w, h);

type Seg =
  | { kind: "line"; len: number; x0: number; y0: number; x1: number; y1: number }
  | { kind: "arc"; len: number; cx: number; cy: number; r: number; a0: number; a1: number };

// The outline as segments, clockwise from top-centre, so both its `d` and any
// point along it come from one description. Head-led drawing needs the second.
const shapeSegs = (w: number, h: number): Seg[] => {
  const r = cornerR(w, h);
  const L = SHAPE_CX - w / 2;
  const R = SHAPE_CX + w / 2;
  const T = SHAPE_CY - h / 2;
  const B = SHAPE_CY + h / 2;
  const q = (Math.PI * r) / 2;
  return [
    { kind: "line", len: w / 2 - r, x0: SHAPE_CX, y0: T, x1: R - r, y1: T },
    { kind: "arc", len: q, cx: R - r, cy: T + r, r, a0: -Math.PI / 2, a1: 0 },
    { kind: "line", len: h - 2 * r, x0: R, y0: T + r, x1: R, y1: B - r },
    { kind: "arc", len: q, cx: R - r, cy: B - r, r, a0: 0, a1: Math.PI / 2 },
    { kind: "line", len: w - 2 * r, x0: R - r, y0: B, x1: L + r, y1: B },
    { kind: "arc", len: q, cx: L + r, cy: B - r, r, a0: Math.PI / 2, a1: Math.PI },
    { kind: "line", len: h - 2 * r, x0: L, y0: B - r, x1: L, y1: T + r },
    { kind: "arc", len: q, cx: L + r, cy: T + r, r, a0: Math.PI, a1: (3 * Math.PI) / 2 },
    { kind: "line", len: w / 2 - r, x0: L + r, y0: T, x1: SHAPE_CX, y1: T },
  ];
};

const shapePath = (w: number, h: number) => {
  const r = cornerR(w, h);
  const L = SHAPE_CX - w / 2;
  const R = SHAPE_CX + w / 2;
  const T = SHAPE_CY - h / 2;
  const B = SHAPE_CY + h / 2;
  const n = (v: number) => Number(v.toFixed(2));
  return [
    `M${n(SHAPE_CX)} ${n(T)}`,
    `L${n(R - r)} ${n(T)}`,
    `A${n(r)} ${n(r)} 0 0 1 ${n(R)} ${n(T + r)}`,
    `L${n(R)} ${n(B - r)}`,
    `A${n(r)} ${n(r)} 0 0 1 ${n(R - r)} ${n(B)}`,
    `L${n(L + r)} ${n(B)}`,
    `A${n(r)} ${n(r)} 0 0 1 ${n(L)} ${n(B - r)}`,
    `L${n(L)} ${n(T + r)}`,
    `A${n(r)} ${n(r)} 0 0 1 ${n(L + r)} ${n(T)}`,
    "Z",
  ].join(" ");
};

const shapeLength = (segs: Seg[]) => segs.reduce((a, s) => a + s.len, 0);

const pointAt = (segs: Seg[], t: number) => {
  let d = clamp01(t) * shapeLength(segs);
  for (const s of segs) {
    if (d > s.len) {
      d -= s.len;
      continue;
    }
    const u = s.len <= 0 ? 0 : d / s.len;
    if (s.kind === "line") {
      return { x: s.x0 + (s.x1 - s.x0) * u, y: s.y0 + (s.y1 - s.y0) * u };
    }
    const a = s.a0 + (s.a1 - s.a0) * u;
    return { x: s.cx + s.r * Math.cos(a), y: s.cy + s.r * Math.sin(a) };
  }
  const last = segs[segs.length - 1] as Extract<Seg, { kind: "line" }>;
  return { x: last.x1, y: last.y1 };
};

// The pen only ever draws state A, and the outline packet only ever laps state
// A, so both come off one precomputed description.
const SEGS_A = shapeSegs(SHAPE_A.w, SHAPE_A.h);

// Is a point inside a rounded rectangle, inset by `m`?
const insideShape = (x: number, y: number, w: number, h: number, m: number) => {
  const hw = w / 2 - m;
  const hh = h / 2 - m;
  const rr = Math.max(0, cornerR(w, h) - m);
  const dx = Math.abs(x - SHAPE_CX);
  const dy = Math.abs(y - SHAPE_CY);
  if (dx > hw || dy > hh) return false;
  if (dx <= hw - rr || dy <= hh - rr) return true;
  return Math.hypot(dx - (hw - rr), dy - (hh - rr)) <= rr;
};

// ---------------------------------------------------------------------------
// The seats inside the shape. They are authored in the shape's own normalised
// space, so the SAME seat exists in state A and state B and the redraw is one
// continuous move of every seat rather than a second layout. A seat has to be
// inside BOTH states, or a dot would be left outside the boundary by the morph.
// ---------------------------------------------------------------------------
const SEAT_STEP_X = 33; // world px in state A
const SEAT_STEP_Y = 31;
const SEAT_MARGIN = 24; // so a dot never sits on the stroke
const SEAT_JITTER = 0.45;

type Seat = { u: number; v: number; ax: number; ay: number; bx: number; by: number; rad: number };

const SEATS: Seat[] = (() => {
  const du = (2 * SEAT_STEP_X) / SHAPE_A.w;
  const dv = (2 * SEAT_STEP_Y) / SHAPE_A.h;
  const nu = Math.floor(2 / du) + 1;
  const nv = Math.floor(2 / dv) + 1;
  const u0 = -1 + (2 - (nu - 1) * du) / 2;
  const v0 = -1 + (2 - (nv - 1) * dv) / 2;
  const out: Seat[] = [];
  for (let b = 0; b < nv; b++) {
    for (let a = 0; a < nu; a++) {
      const i = b * nu + a;
      const u = u0 + a * du + (hash(i, 21) - 0.5) * du * SEAT_JITTER;
      const v = v0 + b * dv + (hash(i, 22) - 0.5) * dv * SEAT_JITTER;
      const ax = SHAPE_CX + (u * SHAPE_A.w) / 2;
      const ay = SHAPE_CY + (v * SHAPE_A.h) / 2;
      const bx = SHAPE_CX + (u * SHAPE_B.w) / 2;
      const by = SHAPE_CY + (v * SHAPE_B.h) / 2;
      if (!insideShape(ax, ay, SHAPE_A.w, SHAPE_A.h, SEAT_MARGIN)) continue;
      if (!insideShape(bx, by, SHAPE_B.w, SHAPE_B.h, SEAT_MARGIN)) continue;
      out.push({ u, v, ax, ay, bx, by, rad: Math.max(Math.abs(u), Math.abs(v)) });
    }
  }
  return out;
})();

// ---------------------------------------------------------------------------
// The crowd at rest: an organic blob, feathered and undulating at its edge, one
// dot per lattice cell with the references' jitter and radius spread. Never a
// box, and never a disc someone drew with a compass either.
// ---------------------------------------------------------------------------
const CROWD_CX = 540;
const CROWD_CY = 854;
const CROWD_R = 318;
const BLOB_STEP = 40;
const BLOB_FEATHER = 1.6; // steps; the blob is small, so a 4-step feather would eat it

type Dot = { x0: number; y0: number; r: number; seed: number };

const DOTS: Dot[] = (() => {
  const out: Dot[] = [];
  const n = Math.ceil((2 * CROWD_R + 2 * BLOB_STEP) / BLOB_STEP);
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const i = r * n + c;
      const x = CROWD_CX - CROWD_R - BLOB_STEP + c * BLOB_STEP + (hash(i, 11) - 0.5) * BLOB_STEP * 0.9;
      const y = CROWD_CY - CROWD_R - BLOB_STEP + r * BLOB_STEP + (hash(i, 12) - 0.5) * BLOB_STEP * 0.9;
      const dx = x - CROWD_CX;
      const dy = y - CROWD_CY;
      const d = Math.hypot(dx, dy);
      const rEff = CROWD_R + wobble(Math.atan2(dy, dx) * WOBBLE_R, 2.3) * BLOB_STEP * 0.5;
      const f = feather((rEff - d) / BLOB_STEP, BLOB_FEATHER);
      if (hash(i, 71) >= f) continue;
      out.push({ x0: x, y0: y, r: (0.75 + 0.5 * hash(i, 13)) * (0.7 + 0.3 * f), seed: i });
    }
  }
  return out;
})();

const N = DOTS.length;
if (N > SEATS.length) {
  throw new Error(`HowAssistantsShouldBehaveV3: ${N} dots do not fit in ${SEATS.length} seats`);
}

// ---------------------------------------------------------------------------
// Which dot takes which seat, for the conform on "behave". Greedy over every
// (dot, seat) pair by distance, so the assignment is the short one everywhere
// it can be and no two dots ever share a seat.
// ---------------------------------------------------------------------------
// Which seats stay empty. There are more seats than dots — the shuffle needs
// somewhere to hop to — and if the spare ones are chosen at random they clump
// into holes that read as a patchy crowd. They are chosen as blue noise
// instead: the highest-hashed seat that has no empty neighbour yet, over and
// over, so every vacancy is a single gap with dots all around it.
const SEAT_EMPTY: Uint8Array = (() => {
  const empty = new Uint8Array(SEATS.length);
  const want = SEATS.length - N;
  const order = SEATS.map((_, i) => i).sort((a, b) => hash(b, 77) - hash(a, 77));
  const near = (a: number, b: number) =>
    Math.hypot(SEATS[a].ax - SEATS[b].ax, SEATS[a].ay - SEATS[b].ay) <
    1.4 * Math.hypot(SEAT_STEP_X, SEAT_STEP_Y);
  let dropped = 0;
  for (let pass = 0; pass < 2 && dropped < want; pass++) {
    for (const i of order) {
      if (dropped >= want) break;
      if (empty[i]) continue;
      if (pass === 0 && order.some((j) => empty[j] && near(i, j))) continue;
      empty[i] = 1;
      dropped++;
    }
  }
  return empty;
})();

const SEAT_OF: Int32Array = (() => {
  const pairs: { d: number; i: number; s: number }[] = [];
  for (let i = 0; i < N; i++) {
    for (let s = 0; s < SEATS.length; s++) {
      if (SEAT_EMPTY[s]) continue;
      pairs.push({ d: Math.hypot(DOTS[i].x0 - SEATS[s].ax, DOTS[i].y0 - SEATS[s].ay), i, s });
    }
  }
  pairs.sort((a, b) => a.d - b.d);
  const seatOf = new Int32Array(N).fill(-1);
  const taken = new Uint8Array(SEATS.length);
  let done = 0;
  for (const p of pairs) {
    if (done === N) break;
    if (seatOf[p.i] >= 0 || taken[p.s]) continue;
    seatOf[p.i] = p.s;
    taken[p.s] = 1;
    done++;
  }
  return seatOf;
})();

// ---------------------------------------------------------------------------
// The conform, the redraw, and the shuffle, as three schedules. All three are
// derived from the seat each dot is on, so nothing runs on a timer of its own.
// ---------------------------------------------------------------------------
const CONFORM_F = 73; // "behave"
const CONFORM_SPREAD = 11; // edge seats leave first, centre seats last
const CONFORM_DUR = 12; // last dot lands at f96

const MORPH_F0 = 98; // "means"
const MORPH_SPREAD = 8;
const MORPH_DUR = 10; // last dot lands at f116, four frames before "helpful"

const CONFORM: { t0: number; dur: number; arc: number }[] = DOTS.map((d, i) => {
  const s = SEATS[SEAT_OF[i]];
  const t0 =
    CONFORM_F +
    Math.max(
      0,
      Math.min(CONFORM_SPREAD, (1 - s.rad) * CONFORM_SPREAD + (hash(i, 31) - 0.5) * 1.6),
    );
  const travel = Math.hypot(d.x0 - s.ax, d.y0 - s.ay);
  return { t0, dur: CONFORM_DUR, arc: (hash(i, 32) - 0.5) * Math.min(46, travel * 0.3) };
});

const MORPH: { t0: number; dur: number }[] = DOTS.map((_, i) => {
  const s = SEATS[SEAT_OF[i]];
  // the boundary sweeps in from the sides, so the outermost seats are reached first
  const t0 = MORPH_F0 + (1 - Math.abs(s.u)) * MORPH_SPREAD;
  return { t0, dur: MORPH_DUR };
});

// ---------------------------------------------------------------------------
// LIVENESS 1a — the mill before the shape. The blob has no vacant seat in it,
// so two neighbouring dots exchange places instead, passing on opposite arcs.
// One launch every two frames, each 14 frames long, so ~14 of the 134 dots are
// crossing the crowd at any moment and none of them in unison with another.
// A dot stops taking part once its own conform is within reach.
// ---------------------------------------------------------------------------
const MILL_DUR = 14;
const MILL_RATE = 1.5; // launches per frame; one launch moves two dots
const MILL_REACH = BLOB_STEP * 1.6;

type Swap = { t0: number; fx: number; fy: number; tx: number; ty: number; bow: number };

const MILLS: Swap[][] = DOTS.map(() => []);
(() => {
  const px = DOTS.map((d) => d.x0);
  const py = DOTS.map((d) => d.y0);
  const busy = new Float64Array(N).fill(-1);
  const NB0: number[][] = DOTS.map((d) => {
    const out: number[] = [];
    for (let j = 0; j < N; j++) {
      if (DOTS[j] === d) continue;
      if (Math.hypot(DOTS[j].x0 - d.x0, DOTS[j].y0 - d.y0) <= MILL_REACH) out.push(j);
    }
    return out;
  });
  const last = Math.max(...CONFORM.map((c) => c.t0));
  let acc = 0;
  let id = 0;
  for (let f = 0; f <= last; f++) {
    acc += MILL_RATE;
    while (acc >= 1) {
      acc -= 1;
      const j = id++;
      const free = (c: number) => busy[c] <= f && CONFORM[c].t0 > f + MILL_DUR + 1;
      const start = Math.floor(hash(j, 91) * N);
      let a = -1;
      for (let n = 0; n < N; n++) {
        const c = (start + n) % N;
        if (!free(c)) continue;
        a = c;
        break;
      }
      if (a < 0) break;
      const cands = NB0[a].filter(free);
      if (cands.length === 0) continue;
      const b = cands[Math.floor(hash(j, 92) * cands.length) % cands.length];
      // the two partners swing around each other, never through each other
      const bow = (hash(j, 93) > 0.5 ? 1 : -1) * (8 + 8 * hash(j, 94));
      MILLS[a].push({ t0: f, fx: px[a], fy: py[a], tx: px[b], ty: py[b], bow });
      MILLS[b].push({ t0: f, fx: px[b], fy: py[b], tx: px[a], ty: py[a], bow: -bow });
      const sx = px[a];
      const sy = py[a];
      px[a] = px[b];
      py[a] = py[b];
      px[b] = sx;
      py[b] = sy;
      busy[a] = f + MILL_DUR;
      busy[b] = f + MILL_DUR;
    }
  }
})();

/** Where dot i is standing in the loose crowd at frame f, mill included.
 *  `u` is -1 when it is not mid-swap. Pure. */
const millPos = (i: number, f: number) => {
  let x = DOTS[i].x0;
  let y = DOTS[i].y0;
  for (const m of MILLS[i]) {
    if (f >= m.t0 + MILL_DUR) {
      x = m.tx;
      y = m.ty;
      continue;
    }
    if (f < m.t0) break;
    const u = clamp01((f - m.t0) / MILL_DUR);
    const e = arriveEase(u);
    const dx = m.tx - m.fx;
    const dy = m.ty - m.fy;
    const L = Math.hypot(dx, dy) || 1;
    const bow = Math.sin(Math.PI * e) * m.bow;
    return { x: m.fx + dx * e + (-dy / L) * bow, y: m.fy + dy * e + (dx / L) * bow, u };
  }
  return { x, y, u: -1 };
};

// ---------------------------------------------------------------------------
// The shuffle and the feedback, simulated once at module scope so the two can
// share one occupancy map: a hop needs a vacant seat, and a dot a thread has
// reached is out of the pool for good. 176 seats for 134 dots, so there are
// always seats to hop into.
//
// LIVENESS 1b: the same simulation now carries the mill INSIDE the shape, at
// one hop every five frames from f117 (the frame the morph finishes) right
// through to the last frame. The restless hops of "doing RL" are that mill
// escalated and then decayed back to it — the crowd settles to a mill, never
// to a freeze.
//
// LIVENESS 7: a thread landing also calms the dots on its seat's own ring for
// six hashed frames, so the stillness spreads out from every hit.
// ---------------------------------------------------------------------------
const MILL_IN_F0 = 117; // the morph has landed; the seats are in state B
const MILL_IN_RATE = 0.2; // one hop every five frames, for ever
const MILL_IN_DUR = 14;

const HOP_F0 = 167; // "doing"; the crowd is already stirring when "RL" lands at 173
const HOP_DUR = 12;
const HOP_CONC = 0.4; // never more than this fraction of the crowd moving at once
const HOP_RATE_0 = 4.2; // launches per frame while it is restless
const HOP_STOP = 205;

const THREAD_F0 = 185; // "human"
const THREAD_GLYPHS = PEOPLE_N;
const THREAD_PERIOD = 10; // frames between launches, per glyph
const THREAD_PERIOD_TAIL = 24; // from f205
const THREAD_FLIGHT = 10; // plus 0-4 hashed, plus whatever the speed cap asks
const THREAD_HOLD = 2;
const THREAD_FADE = 5;
const CALM_FRAMES = 6; // a hit dot's ring stops hopping for this long

// The set's head-speed ceiling, and the tightest k this cut ever reaches, so a
// thread's flight can be stretched until its head is under the cap.
const SPEED_CAP_SCREEN = 45;
const K_MAX = 1.41;
const THREAD_SPEED_MAX = SPEED_CAP_SCREEN / K_MAX; // world px per frame

type Hop = { dot: number; from: number; to: number; t0: number; dur: number; dip: number };
type Thread = { id: number; glyph: number; dot: number; t0: number; flight: number };

const SIM: { hops: Hop[][]; threads: Thread[]; settledAt: Float64Array } = (() => {
  const seatOf = Int32Array.from(SEAT_OF);
  const occupied = new Int32Array(SEATS.length).fill(-1);
  for (let i = 0; i < N; i++) occupied[seatOf[i]] = i;

  // seat adjacency in state B, where every hop happens
  const NB: number[][] = SEATS.map(() => []);
  const reach = Math.hypot(SEAT_STEP_X * (SHAPE_B.w / SHAPE_A.w), SEAT_STEP_Y * (SHAPE_B.h / SHAPE_A.h)) * 1.25;
  for (let a = 0; a < SEATS.length; a++) {
    for (let b = 0; b < SEATS.length; b++) {
      if (a === b) continue;
      if (Math.hypot(SEATS[a].bx - SEATS[b].bx, SEATS[a].by - SEATS[b].by) <= reach) NB[a].push(b);
    }
  }

  const hops: Hop[][] = DOTS.map(() => []);
  const threads: Thread[] = [];
  const settledAt = new Float64Array(N).fill(Infinity);
  const busyUntil = new Float64Array(N).fill(-1);
  const calmUntil = new Float64Array(N).fill(-1);
  const targeted = new Uint8Array(N);

  let hopAcc = 0;
  let threadAcc = 0;
  let hopId = 0;
  let threadId = 0;

  for (let f = MILL_IN_F0; f <= DURATION; f++) {
    // 1. threads that land this frame take their dot out of the pool, and calm
    //    the ring of seats around it: settling spreads from every hit
    for (const t of threads) {
      if (t.t0 + t.flight !== f) continue;
      settledAt[t.dot] = f;
      for (const s of NB[seatOf[t.dot]]) {
        const nb = occupied[s];
        if (nb < 0) continue;
        calmUntil[nb] = Math.max(calmUntil[nb], f + CALM_FRAMES * (0.6 + 0.8 * hash(nb, 95)));
      }
    }

    // 2. the people answer: five glyphs, one launch each every ten frames,
    //    halving in the tail
    if (f >= THREAD_F0) {
      threadAcc += THREAD_GLYPHS / (f >= HOP_STOP ? THREAD_PERIOD_TAIL : THREAD_PERIOD);
      while (threadAcc >= 1) {
        threadAcc -= 1;
        const j = threadId++;
        const glyph = j % THREAD_GLYPHS;
        // A person answers the part of the crowd they are standing over: the
        // dot has to be in that glyph's own column of the shape. Letting any
        // glyph reach any dot draws five fans across each other and the last
        // third of the cut ends on a tangle instead of on a settled crowd.
        // The column is only relaxed when that column has nothing left.
        let pick = -1;
        const start = Math.floor(hash(j, 41) * N);
        for (let pass = 0; pass < 2 && pick < 0; pass++) {
          for (let n = 0; n < N; n++) {
            const c = (start + n) % N;
            if (settledAt[c] <= f || targeted[c]) continue;
            if (pass === 0) {
              const u = SEATS[seatOf[c]].u;
              const col = Math.round(((u + 1) / 2) * (THREAD_GLYPHS - 1));
              if (col !== glyph) continue;
            }
            pick = c;
            break;
          }
        }
        if (pick < 0) continue;
        targeted[pick] = 1;
        const seat = SEATS[seatOf[pick]];
        const dist = Math.hypot(PEOPLE[glyph].x - seat.bx, PEOPLE[glyph].y + GLYPH / 2 - 8 - seat.by);
        threads.push({
          id: j,
          glyph,
          dot: pick,
          t0: f,
          // long enough that the head never breaks the set's speed cap
          flight: Math.max(
            THREAD_FLIGHT + Math.floor(hash(j, 42) * 5),
            Math.ceil(dist / THREAD_SPEED_MAX),
          ),
        });
      }
    }

    // 3. the mill inside the shape, and the shuffle on top of it. The mill
    //    never stops; the shuffle stirs on "doing", is fully restless by "RL",
    //    and decays back into the mill across the feedback — the crowd settles
    //    because it is settled, not because the shuffle was switched off.
    const restless =
      f >= HOP_F0 && f < HOP_STOP
        ? HOP_RATE_0 *
          interpolate(f, [HOP_F0, 174], [0.3, 1], clamp) *
          (f < THREAD_F0 ? 1 : interpolate(f, [THREAD_F0, HOP_STOP], [1, 0], clamp))
        : 0;
    hopAcc += MILL_IN_RATE + restless;
    let busy = 0;
    for (let i = 0; i < N; i++) if (busyUntil[i] > f) busy++;
    while (hopAcc >= 1) {
      hopAcc -= 1;
      if (busy >= HOP_CONC * N) break;
      const j = hopId++;
      const start = Math.floor(hash(j, 51) * N);
      let dot = -1;
      for (let n = 0; n < N; n++) {
        const c = (start + n) % N;
        if (settledAt[c] <= f || busyUntil[c] > f || calmUntil[c] > f) continue;
        dot = c;
        break;
      }
      if (dot < 0) break;
      const from = seatOf[dot];
      const free = NB[from].filter((s) => occupied[s] < 0);
      if (free.length === 0) continue;
      const to = free[Math.floor(hash(j, 52) * free.length) % free.length];
      occupied[from] = -1;
      occupied[to] = dot;
      seatOf[dot] = to;
      const dur = restless > 0.5 ? HOP_DUR : MILL_IN_DUR;
      busyUntil[dot] = f + dur;
      busy++;
      hops[dot].push({ dot, from, to, t0: f, dur, dip: restless > 0.5 ? 0.85 : 0.3 });
    }
  }

  return { hops, threads, settledAt };
})();

// Every launch frame a glyph has, so it can wake before it acts (LIVENESS 6).
const GLYPH_LAUNCH: number[][] = PEOPLE.map((_, g) =>
  SIM.threads.filter((t) => t.glyph === g).map((t) => t.t0),
);

// ---------------------------------------------------------------------------
// The camera. Six moves, each a warped smoothstep keyed per frame and damped by
// `runCamera`, with a straight-ramp hold drift continuing the last move after
// every landing so nothing is ever parked — and exactly one dead-still stretch,
// the held breath as the outline closes. `cy` comes off the eased k, so the
// framing and the zoom settle together.
//
//   f0-14     centre 830 -> 835    the standing scene, already creeping
//   f14-60    centre -> 860        the creep down, riding the stroke
//   f60-66    centre -> 865        hold drift, 1 screen px/frame
//   f66-73    DEAD STILL           the held breath; the outline closes at f66
//   f73-90    k -> 1.23, c -> 868  the settle push with the conform wave
//   f90-98    k -> 1.250           hold drift (holdDriftK, +1)
//   f98-116   k -> 1.290, c -> 872 the push in with the morph
//   f116-130  centre -> 883        hold drift, 1 screen px/frame
//   f130-141  k -> 1.344, c -> 885 the creep-in, landing 6 f before f147
//   f141-172  k -> 1.427           hold drift (holdDriftK, +1)
//   f172-205  centre -> 910        hold drift under the restless crowd
//   f205-221  k -> 1.387, c -> 906 the tail: a slow pull-back on the settled
//                                  crowd
// ---------------------------------------------------------------------------
const K_REST = 1.2;
const K_ZOOM = K_REST * 1.14; // the landing on "objective": the biggest beat, kept ~+8% over the pushes
// A fixed world point in this composition sits ~600 screen px from the camera
// centre on average, which is the distance a hold drift is measured at.
const DRIFT_DIST = 600;
const K_C = 1.21;
const K_C2 = holdDriftK(K_C, 8, DRIFT_DIST, 1);
const K_D = K_C2 + 0.02;
const K_E2 = holdDriftK(K_ZOOM, 31, DRIFT_DIST, 1);
const K_TAIL = K_E2 - 0.04;

const CAM_SEGS = [
  // the opening is not parked either: the camera is already creeping when the
  // stroke leaves the middle person, in the direction the creep goes
  camMove({ f0: 0, f1: 14, k0: K_REST, k1: K_REST, c0: 830, c1: CONTENT_C, warp: 1 }),
  camMove({ f0: 14, f1: 60, k0: K_REST, k1: K_REST, c0: CONTENT_C, c1: 860 }),
  camMove({ f0: 60, f1: 66, k0: K_REST, k1: K_REST, c0: 860, c1: 865, warp: 1 }),
  camMove({ f0: 73, f1: 90, k0: K_REST, k1: K_C, c0: 865, c1: 868, warp: 0.8 }),
  camMove({ f0: 90, f1: 98, k0: K_C, k1: K_C2, c0: 868, c1: 868, warp: 1 }),
  camMove({ f0: 98, f1: 116, k0: K_C2, k1: K_D, c0: 868, c1: 872, warp: 0.75 }),
  camMove({ f0: 116, f1: 130, k0: K_D, k1: K_D, c0: 872, c1: 883, warp: 1 }),
  camMove({ f0: 130, f1: 141, k0: K_D, k1: K_ZOOM, c0: 883, c1: 885, warp: 0.75 }),
  camMove({ f0: 141, f1: 172, k0: K_ZOOM, k1: K_E2, c0: 885, c1: 887, warp: 1 }),
  camMove({ f0: 172, f1: 205, k0: K_E2, k1: K_E2, c0: 887, c1: 910, warp: 1 }),
  camMove({ f0: 205, f1: DURATION, k0: K_E2, k1: K_TAIL, c0: 910, c1: 906, warp: 0.8 }),
];

const CAM = (() => {
  const F = [0];
  const K = [K_REST];
  const CY = [830 + CAM_LIFT / K_REST];
  for (const m of CAM_SEGS) {
    for (let i = 0; i < m.F.length; i++) {
      if (m.F[i] <= F[F.length - 1]) continue;
      F.push(m.F[i]);
      K.push(m.K[i]);
      CY.push(m.CY[i]);
    }
  }
  return { F, K, CY };
})();

const seatOfDot = (i: number) => SEATS[SEAT_OF[i]];

const OPEN_DUR = 12; // the scene settles in over "something"

// LIVENESS 3 — the pen pushes the crowd aside.
const PUSH_R = 70; // world px: how close the pen has to come
const PUSH_AMT = 25; // world px: how far the dot is shoved
const PUSH_BACK = 20; // frames it takes to drift back

// LIVENESS 4 — one packet laps the closed outline as the conform starts.
const LAP_F0 = 73;
const LAP_DUR = 24;

// LIVENESS 2 — dark traffic between neighbouring dots, at the house rate.
const TRAFFIC_N = idleThreads(N);
const TRAFFIC_REACH = 82; // world px: a thread only ever joins neighbours

// LIVENESS 1 — the micro-drift. Two hashed sines per axis, periods ~26 and ~41
// frames, +-3 world px in total and never two dots in phase.
const micro = (i: number, f: number) => ({
  dx: 1.8 * Math.sin(f * 0.2417 + hash(i, 17) * 6.283) + 1.2 * Math.sin(f * 0.1533 + hash(i, 19) * 6.283),
  dy: 1.7 * Math.sin(f * 0.2094 + hash(i, 18) * 6.283) + 1.3 * Math.sin(f * 0.1396 + hash(i, 20) * 6.283),
});

const HowAssistantsShouldBehaveV3: React.FC<Props> = ({
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
  dotUnread,
  beats,
}) => {
  const frame = useCurrentFrame();
  const tone = makeTone(accentDeep, accent);

  // -- the shape -------------------------------------------------------------
  // One continuous morph, state A -> state B, on "what it means".
  const morph = interpolate(frame, [MORPH_F0, MORPH_F0 + MORPH_SPREAD + MORPH_DUR], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  const shapeW = SHAPE_A.w + (SHAPE_B.w - SHAPE_A.w) * morph;
  const shapeH = SHAPE_A.h + (SHAPE_B.h - SHAPE_A.h) * morph;
  const segs = shapeSegs(shapeW, shapeH);
  const perim = shapeLength(segs);

  // the stroke: down from the middle person, then clockwise around the crowd
  const stemAt = (f: number) =>
    interpolate(f, [beats.deciding, 30], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const ringAt = (f: number) =>
    interpolate(f, [30, 66], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const stem = stemAt(frame);
  const ringDraw = ringAt(frame);
  const stemX = PEOPLE[MIDDLE].x;
  const stemY0 = PEOPLE_Y + GLYPH / 2 - 4;
  const stemY1 = SHAPE_CY - shapeH / 2;
  const head =
    ringDraw > 0 && ringDraw < 1
      ? pointAt(segs, ringDraw)
      : stem > 0 && stem < 1
        ? { x: stemX, y: stemY0 + (stemY1 - stemY0) * stem }
        : null;

  // -- the pen's wake --------------------------------------------------------
  // Where the pen has been over the last PUSH_BACK frames, so a dot can be
  // shoved out of its way and drift back after it has gone.
  const penTrack: { x: number; y: number; lag: number }[] = [];
  for (let lag = 0; lag <= PUSH_BACK; lag++) {
    const f = frame - lag;
    const rd = ringAt(f);
    if (rd <= 0 || rd >= 1) continue;
    const p = pointAt(SEGS_A, rd);
    penTrack.push({ x: p.x, y: p.y, lag });
  }
  const penPush = (x: number, y: number) => {
    let best = 0;
    let bx = 0;
    let by = 0;
    for (const p of penTrack) {
      const dx = x - p.x;
      const dy = y - p.y;
      const d = Math.hypot(dx, dy) || 1;
      if (d > PUSH_R) continue;
      const amp = PUSH_AMT * smoothstep(1 - d / PUSH_R) * (1 - smoothstep(p.lag / PUSH_BACK));
      if (amp <= best) continue;
      best = amp;
      bx = (dx / d) * amp;
      by = (dy / d) * amp;
    }
    return { x: bx, y: by };
  };

  // -- the crowd -------------------------------------------------------------
  // The scene is already standing at f0 — it does not fade up out of nothing.
  // The opening is a settle: the crowd eases the last 3.5% of its own spread in.
  const settleAt = (f: number) => 1 - smoothstep(f / OPEN_DUR);
  // Where a dot stands in the loose crowd: its mill position, the opening
  // settle, and the shove the pen gave it.
  const restAt = (i: number, f: number) => {
    const m = millPos(i, f);
    const s = 1 + settleAt(f) * 0.035;
    const x = CROWD_CX + (m.x - CROWD_CX) * s;
    const y = CROWD_CY + (m.y - CROWD_CY) * s;
    return { x, y, u: m.u };
  };

  const dots = DOTS.map((d, i) => {
    let x: number;
    let y: number;
    let t = 0; // deep -> ripe
    let moving = 0;

    const c = CONFORM[i];
    if (frame < c.t0) {
      const r = restAt(i, frame);
      const p = penPush(r.x, r.y);
      x = r.x + p.x;
      y = r.y + p.y;
      if (r.u >= 0) {
        // a dot crossing the crowd is a shade brighter while it travels
        moving = clamp01(Math.min(r.u, 1 - r.u) / 0.2) * 0.55;
        t = 0.15 * Math.sin(Math.PI * r.u);
      }
    } else if (frame < c.t0 + c.dur) {
      const lin = clamp01((frame - c.t0) / c.dur);
      const e = Easing.inOut(Easing.cubic)(lin);
      const r = restAt(i, c.t0);
      const p = penPush(r.x, r.y);
      // the shove goes with the dot and is spent by the time it is seated
      const sx = r.x + p.x * (1 - e);
      const sy = r.y + p.y * (1 - e);
      const dx = seatOfDot(i).ax - sx;
      const dy = seatOfDot(i).ay - sy;
      const L = Math.hypot(dx, dy) || 1;
      const bow = Math.sin(Math.PI * e) * c.arc;
      x = sx + dx * e + (-dy / L) * bow;
      y = sy + dy * e + (dx / L) * bow;
      t = smoothstep(lin / 0.8);
      moving = clamp01(Math.min(lin, 1 - lin) / 0.16);
    } else {
      const seat = seatOfDot(i);
      t = 1;
      // the redraw: the seat itself travels from state A to state B, and the
      // dot goes with it when the boundary reaches it
      const m = MORPH[i];
      const mp = clamp01((frame - m.t0) / m.dur);
      const me = Easing.inOut(Easing.cubic)(mp);
      let bx = seat.ax + (seat.bx - seat.ax) * me;
      let by = seat.ay + (seat.by - seat.ay) * me;
      if (mp > 0 && mp < 1) moving = clamp01(Math.min(mp, 1 - mp) / 0.2);

      // the mill and the shuffle: one-seat hops, in state B
      const hs = SIM.hops[i];
      if (hs.length > 0 && frame >= hs[0].t0) {
        let cur = hs[0].from;
        let live: Hop | null = null;
        for (const h of hs) {
          if (frame >= h.t0 + h.dur) cur = h.to;
          else if (frame >= h.t0) {
            live = h;
            break;
          } else break;
        }
        if (live) {
          const u = clamp01((frame - live.t0) / live.dur);
          const e = arriveEase(u);
          const A = SEATS[live.from];
          const B = SEATS[live.to];
          const dx = B.bx - A.bx;
          const dy = B.by - A.by;
          const L = Math.hypot(dx, dy) || 1;
          const bow = Math.sin(Math.PI * e) * (hash(i, 61) - 0.5) * 8;
          bx = A.bx + dx * e + (-dy / L) * bow;
          by = A.by + dy * e + (dx / L) * bow;
          // ripe -> deep -> ripe while it hops
          t = 1 - live.dip * Math.sin(Math.PI * u);
          moving = clamp01(Math.min(u, 1 - u) / 0.2);
        } else {
          bx = SEATS[cur].bx;
          by = SEATS[cur].by;
        }
      }
      x = bx;
      y = by;
    }

    const settled = SIM.settledAt[i] <= frame;
    if (settled) t = 1;

    // the micro-drift: the crowd is never dead, at rest, seated, or settled
    const md = micro(i, frame);
    return { x: x + md.dx, y: y + md.dy, t, moving, r: d.r, seed: d.seed, settled };
  });

  // -- dark traffic ----------------------------------------------------------
  // Idle accent threads between neighbouring dots, no heads, at 0.12. They run
  // across the loose crowd before the shape and inside it after, because a
  // thread only ever joins two dots that are currently near each other. They
  // thin as the feedback settles the crowd: a settled dot carries no traffic.
  type Th = { key: string; x1: number; y1: number; x2: number; y2: number; op: number };
  const traffic: Th[] = [];
  for (let j = 0; j < TRAFFIC_N; j++) {
    const period = 40 - 12 * hash(j, 4);
    const local = frame + hash(j, 5) * period;
    const cycle = Math.floor(local / period);
    const phase = (local - cycle * period) / period;
    const seed = j * 131 + cycle * 7;
    const a = Math.floor(hash(seed, 6) * N);
    const A = dots[a];
    if (A.settled) continue;
    let b = -1;
    for (let n = 0; n < 12; n++) {
      const cnd = Math.floor(hash(seed + n * 17, 8) * N);
      if (cnd === a || dots[cnd].settled) continue;
      if (Math.hypot(dots[cnd].x - A.x, dots[cnd].y - A.y) <= TRAFFIC_REACH) {
        b = cnd;
        break;
      }
    }
    if (b < 0) continue;
    const B = dots[b];
    const dn = arriveEase(clamp01(phase / 0.35));
    const fade = interpolate(phase, [0.6, 1], [1, 0], clamp);
    if (fade <= 0.02) continue;
    traffic.push({
      key: `d${j}`,
      x1: A.x,
      y1: A.y,
      x2: A.x + (B.x - A.x) * dn,
      y2: A.y + (B.y - A.y) * dn,
      op: DARK_TRAFFIC_OPACITY * fade,
    });
  }

  // -- the feedback threads --------------------------------------------------
  const threadEls = SIM.threads
    .map((th) => {
      const age = frame - th.t0;
      if (age < 0) return null;
      const life = th.flight + THREAD_HOLD + THREAD_FADE;
      if (age >= life) return null;
      const p = PEOPLE[th.glyph];
      const target = dots[th.dot];
      const dn = arriveEase(clamp01(age / th.flight));
      const fade = interpolate(age, [th.flight + THREAD_HOLD, life], [1, 0], clamp);
      if (fade <= 0.02) return null;
      const x1 = p.x;
      const y1 = p.y + GLYPH / 2 - 8;
      return {
        key: `t${th.id}`,
        x1,
        y1,
        x2: x1 + (target.x - x1) * dn,
        y2: y1 + (target.y - y1) * dn,
        op: 0.95 * fade,
        head: dn,
      };
    })
    .filter(Boolean) as {
    key: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    op: number;
    head: number;
  }[];

  // -- camera ----------------------------------------------------------------
  const cam = runCamera(frame, CAM.F, CAM.CY, CAM.K);
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = CX + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);

  // the packet that laps the outline once as the conform wave starts
  const lapAt = (f: number) => {
    if (f < LAP_F0 || f > LAP_F0 + LAP_DUR) return null;
    return pointAt(SEGS_A, (f - LAP_F0) / LAP_DUR);
  };

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <GridBackground
        src={backgroundSrc}
        blur={backgroundBlur}
        dim={backgroundDim}
        frame={frame}
        cy={cy}
        cyRest={CAM.CY[0]}
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
            {/* dark traffic: the crowd is unlooked-at, not dead. No heads. */}
            {traffic.map((t) => (
              <line
                key={t.key}
                x1={t.x1}
                y1={t.y1}
                x2={t.x2}
                y2={t.y2}
                stroke={accent}
                strokeWidth={3}
                strokeLinecap="round"
                opacity={t.op}
              />
            ))}

            {/* the assistants */}
            {dots.map((d, i) => (
              <circle
                key={i}
                cx={d.x}
                cy={d.y}
                r={dotRadius * d.r * breath(frame, hash(i, 9)) * (1 + 0.22 * d.moving)}
                fill={tone(d.t)}
                opacity={dotUnread}
              />
            ))}

            {/* human feedback: head-led threads from the people */}
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

            {/* the decision: the provenance stroke and the shape it draws */}
            <g style={{ filter: icon }}>
              {stem > 0 ? (
                <line
                  x1={stemX}
                  y1={stemY0}
                  x2={stemX}
                  y2={stemY0 + (stemY1 - stemY0) * stem}
                  stroke={ink}
                  strokeWidth={3}
                  strokeLinecap="round"
                  opacity={OP_READ}
                />
              ) : null}
              {ringDraw > 0 ? (
                <path
                  d={shapePath(shapeW, shapeH)}
                  fill="none"
                  stroke={ink}
                  strokeWidth={3.5}
                  strokeLinecap="round"
                  strokeDasharray={perim}
                  strokeDashoffset={perim * (1 - ringDraw)}
                  opacity={OP_READ}
                />
              ) : null}
              {/* the drawing head, in screen px so it is the same size at any k */}
              {head ? <circle cx={head.x} cy={head.y} r={4.5 / k} fill={ink} /> : null}
            </g>

            {/* one lap of the closed outline, as the conform wave starts */}
            <Packet frame={frame} k={k} at={lapAt} opacity={0.9} />
          </svg>

          {/* the people. Pure white, with the small shadow that makes a glyph
              read as a thing lying on the field. Each one sways on its own
              hashed sines and lifts before it launches a thread. */}
          {PEOPLE.map((p, i) => {
            const sx = (1.5 / k) * Math.sin(frame * 0.083 + hash(i, 81) * 6.283);
            const sy = (1.2 / k) * Math.sin(frame * 0.061 + hash(i, 82) * 6.283);
            let lift = 0;
            for (const t0 of GLYPH_LAUNCH[i]) {
              if (frame < t0 - WAKE_LEAD || frame >= t0 + 6) continue;
              lift =
                frame < t0
                  ? 3 * smoothstep((frame - (t0 - WAKE_LEAD)) / WAKE_LEAD)
                  : 3 * (1 - smoothstep((frame - t0) / 6));
              break;
            }
            return (
              <Img
                key={i}
                src={staticFile("person.png")}
                style={{
                  position: "absolute",
                  left: p.x - GLYPH / 2 + sx,
                  top: p.y - GLYPH / 2 + sy - lift / k,
                  width: GLYPH,
                  height: GLYPH,
                  filter: `brightness(0) invert(1) ${icon}`,
                  opacity: OP_READ,
                }}
              />
            );
          })}
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default HowAssistantsShouldBehaveV3;
