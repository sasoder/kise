import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  BG_BASE,
  BG_DIM,
  GridBackground,
  ICON_SHADOW_BLUR,
  ICON_SHADOW_OPACITY,
  ICON_SHADOW_Y,
  OP_UNREAD_DOT,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  camMove,
  clamp01,
  hash,
  iconShadow,
  runCamera,
  smoothstep,
  sway,
  worldTransform,
} from "./fieldShared";
import { arriveEase, packetsOn } from "./levelUp";
import {
  ANN,
  ANN_R0,
  BACK_SPEED,
  CAM as MOY_CAM,
  CORE,
  CX,
  C_FIXED,
  DOT_R,
  ECON_R,
  EMIT_F1,
  K_REST,
  LANE_D,
  LANE_IN,
  LANE_RANK,
  LANE_R0,
  NL,
  OP_FG,
  R_ST,
  SEATERS,
  STATION,
  STROKE,
  WORLD_H,
  WORLD_W,
  WorldSvg,
  buildFrees,
  buildMill,
  buildWorld,
  laneGate,
  laneR1,
} from "./MillionsOfYears";

export const FPS = 24;

// ---------------------------------------------------------------------------
// John Charles Beren, clip `JohnCharlesBeren_Experience`, cut `HiveMind`. The
// interviewer's question, straight after `MillionsOfYears`:
//   "But when do you expect this kind of hive-mind kind of crazy shit to be
//    started happening?"
//
// DURATION. The composition starts at SRT 19.679 s, so every beat is
//   frame = round((t - 19.679) * 24)
//     but f0 · when f2 · do f5 · you f6 · expect f7 · this f12 · kind f15 ·
//     of f18 · hive f20 · mind f24 · kind f34 · of f46 · crazy f49 ·
//     shit f57 · to f64 · be f68 · started f72 · happening f82 ·
//     next word "i" f89
// Speech runs f0..89 and the set's 16-frame tail holds the resolved state:
// DURATION = 89 + 16 = 105.
export const DURATION = 105;

// ---------------------------------------------------------------------------
// SOUND-OFF READING TEST — one sentence:
//   "every instance across every kind of work gets wired to every other until
//    the whole economy is one mind, and it starts firing."
//
// VOCABULARY. Everything here is INHERITED from cut 1 and means exactly what it
// meant there — this cut adds one word and nothing else:
//   the core        = the model. The orange CLAUDE MARK on the column axis, 72
//                     world px across, inherited from cut 1 through the shared
//                     world; the six core threads land on the lanes' inner ends
//                     rather than on it, so nothing is drawn across the mark.
//   small orange dots = its instances, pouring endlessly down six lanes.
//   white rings + Lucide icons = the six kinds of work.
//   white lanes / ring = the structure; the ring is the economy.
//   NEW — a THREAD  = a thin ACCENT line between two instances, the set's
//                     "thread" from the agent-crowd language: stroke half the
//                     ink stroke (3.0 screen px against the ink's 6.0),
//                     0.95 while it is live, 0.40 idle.
// No text, no brain, no glow, no pulse ring, no new prop.
//
// ---------------------------------------------------------------------------
// CONTINUITY — THIS CUT PICKS UP THE PICTURE ALREADY STANDING.
//
// Frame 0 IS `MillionsOfYears` frame 219, to the pixel. It is not redrawn: cut
// 1's world was split into `buildWorld(worldFrame)` + `WorldSvg`, and this cut
// calls the same two with
//     worldFrame = W0 + f,   W0 = 219
// so the pour, the mill, the dark traffic, the seated annuli, the closed
// economy ring and the return packets keep their PHASE rather than restarting.
// Three things had to be handed a later end so the world can run past cut 1's
// last frame; each is a function of its end frame whose loop only appends, so
// the prefix is unchanged and cut 1 still renders bit for bit (verified: zero
// pixel difference at its f100 and f219, before and after the split):
//   * `buildFrees(EMIT_F1 + 130)` — the emission keeps going at 2.4/frame.
//   * `buildMill(W0 + DURATION + 24)` — the mill keeps hopping.
//   * the camera track is cut 1's own keys up to W0, then this cut's keys
//     appended, so `runCamera` integrating from frame 0 reads exactly cut 1's
//     value at W0 and continues with its velocity intact.
// The grid's parallax reference (`cyRest`) and its -0.3 px/frame drift are cut
// 1's, taken at the same world frame, so the background does not jump either.
//
// ---------------------------------------------------------------------------
// GESTURES — the word each lands on and the frames it runs over. Every gesture
// leads its word and overlaps the next; nothing starts from rest.
//
//  1. f0-f20  "but when do you   THE STANDING WORLD, alive exactly as it was
//             expect this kind   handed over. The camera begins its creep in at
//             of"                f0 (no pause, no re-establish) and the packets
//                                on the six lanes tick UP in rate from f8: a
//                                second train fades in over f8-24 alongside cut
//                                1's, taking the lanes from one packet every
//                                10 frames to one every 6. Anticipation builds
//                                before "hive".
//  2. f16-f56 "hive" (f20)       THE WIRING. From f16 threads sprout between
//             "mind" (f24)       neighbouring seated instances inside ONE
//                                annulus — the station on the SHORTEST lane,
//                                the first one lit in cut 1. Each thread draws
//                                head-led from a dot that ALREADY HAS ONE to
//                                its nearest unwired neighbour, so the wiring
//                                spreads by contact: the schedule is a Dijkstra
//                                over the annulus, not a timer (see MECHANISM).
//                                A dot's micro-drift HALVES as it is wired — it
//                                is held by the web.
//                                On "mind" (f24) the wiring jumps: the wired
//                                dot nearest the next station clockwise throws
//                                a long thread ACROSS the economy — an arc just
//                                inside the economy ring, never through the
//                                core — and that annulus then wires itself the
//                                same way. A station is reached every 3 frames
//                                (scheduled f24/27/30/33/36, actually reached
//                                f27/32/37/41/45 because a thrower must itself
//                                be wired first), and every one of the 156
//                                seated instances is wired by f57 — "shit".
//  3. f44-f64 "kind of crazy     DENSITY. Cross-threads keep adding inside each
//             shit" (f34-f57)    annulus until every dot carries 2-3; 2-3 more
//                                long threads run between each neighbouring
//                                pair of annuli once both are wired; and from
//                                f44 the core takes SIX threads, one from each
//                                annulus down its lane, bowed 22 world px off
//                                the axis so the wire is not lost in the pour
//                                already running there. By "shit"
//                                (f57) the picture is one web: six joined
//                                annuli, all wired to the centre. The camera's
//                                creep lands at f58 and then holds its breath.
//  4. f64-f89 "to be started     FIRING. Packets start running on the threads.
//             happening"         On "started" (f72) the first ones leave the
//             (f64/f68/f72/f82)  shortest-lane station, and the firing spreads
//                                across the web the SAME WAY the wiring did — a
//                                breadth-first walk out from that seed — so by
//                                "happening" (f82) packets are running
//                                everywhere: one per thread every 10 frames on
//                                hashed phases, ripe, 2 screen px wider than
//                                the thread they run on. The mill goes on under
//                                the web and the threads follow their dots: an
//                                endpoint is a dot's LIVE position every frame.
//  5. f89-f104 tail              The web fires, the pour goes on being absorbed
//                                at the annuli, and the camera's creep releases
//                                into one slow eased pull-back (f92-104) so the
//                                picture resolves to the full economy, wired
//                                and firing.
//
// Nothing else. No glow on the core, no pulse ring, no label.
//
// ---------------------------------------------------------------------------
// THE MECHANISM — "reaches them, not a timer".
//
// Every thread has a SOURCE end that is already wired and a TARGET end that is
// not, and a thread may not start before its source has been reached. That is
// exactly a shortest-path tree, so the schedule is built as one:
//   readyAt[seed]  = the frame the annulus is reached
//   readyAt[b]     = min over wired a of readyAt[a] + PROP * drawFrames(a,b)
// taking the (a, b) pair that minimises it at each step, which in an annulus of
// 26 dots picks nearest neighbours and therefore spreads AROUND the ring like a
// contagion, branching where the crowd branches. PROP < 1 because a dot is a
// usable source once the head has most of the way to it, not only when the line
// lands. The first annulus runs at PROP 0.70 (spread f16 -> ~f40, ~24 frames);
// the five reached later run at 0.38 so the ring closes before "shit".
// Every start carries a hashed +-0.8 frame offset and every draw length is
// derived from its own thread's length, so no two threads are ever in unison.
//
// FIRING spreads the same way: a breadth-first walk over the FINAL graph
// (threads, plus the core as a node) out from the same seed dot, with depth
// mapped linearly onto f72 ("started") -> f82 ("happening").
//
// ---------------------------------------------------------------------------
// CAMERA — cut 1's keys to W0, then one creep and one release, both eased per
// frame through `camMove` and damped by the shared `runCamera`, so velocity is
// continuous across the join by construction (the damper carries it as state).
// c stays at the core: the composition is still radially symmetric.
//
//   local f0-58    k 1.020 -> 1.115   warp 0.75  ONE creep in. Lands 6 frames
//                                               before "to" (f64) and 10 before
//                                               "be" (f68).
//   local f58-92   k 1.115 -> 1.124   warp 1.00  the held breath: the creep's
//                                               own direction, decayed to a
//                                               drift, so no frame is parked.
//   local f92-104  k       -> 1.020   warp 0.85  one eased release to the full
//                                               economy.
//   local f104-170 k       -> -0.02   warp 0.50  still running when the piece
//                                               ends, so the last frame moves.
// Both landing values are SOLVED against the damper (secant on the end key), so
// the damped k really reads 1.140 at f58 and 1.020 at f104.
//
// ---------------------------------------------------------------------------
// DEVIATIONS from the brief, with the arithmetic.
//   * A STATION IS REACHED EVERY 3 FRAMES, NOT 6. The brief asks for both "~6
//     f" and "all six wired by ~f52"; they do not fit together. Six stations at
//     6-frame spacing are only REACHED at f24..f54, and each annulus then needs
//     its own 12-30 frame spread on top of that. At 3-frame scheduling — and
//     with the thrower picked from the dots the front HAS reached rather than
//     waiting for the annulus to finish — the stations are reached
//     f27/32/37/41/45 and the last instance is wired at f57, which is what
//     "the picture is one web by f57" actually requires. Measured, not
//     authored: the numbers come out of the propagation.
//   * THE CAMERA CREEPS TO 1.115, NOT 1.14. At 1.14 (1.153 after the breath's
//     drift) the economy ring's screen radius is 527 against a half-frame of
//     540, so its side tangents sit 9 px off the frame edge and the ring reads
//     as cropped. 1.115 (1.124 after the breath) puts it at 514: the ring still
//     presses right out to the edges — 20 px of margin, against 74 at the
//     resolved 1.02 — and the band stays y 318..1352, inside 300..1370. The
//     creep is 10% rather than 12%; it reads the same and the ring survives.
//   * A DOT IS ALREADY RIPE WHEN IT IS WIRED, so "ACCENT_DEEP -> ACCENT if it
//     wasn't already" is a no-op here: every seated instance in cut 1 turned
//     ripe as it landed (its seating ramp) and the annuli have been ACCENT
//     since ~f160 of cut 1. The half of that rule that CAN fire does: a wired
//     dot's micro-drift halves over 8 frames, which is visible against its
//     neighbours as the web takes hold.
//   * "2 SCREEN PX AHEAD OF THE THREAD'S OWN COLOUR" is read as weight: a
//     packet is a ripe disc 5.0 screen px across against the thread's 3.0 px
//     stroke, i.e. 2 px prouder than the line it runs on. The thread is already
//     ACCENT, so there is no tone left to be ahead of.
//   * THE SIX CORE THREADS END AT THE LANES' INNER ENDS (LANE_IN, the mark's
//     half-box + 10 = 46 world px), because the centre is the Claude mark now.
//     The bowed curve is unchanged — it is CUT where it crosses that radius,
//     solved per frame by bisection off the thread's live endpoints — so the
//     wire still comes down its own lane, its head parks on the lane's inner
//     end, and its packets stop there too. Nothing outside 46 world px of the
//     centre moves.
//   * THE LONG THREADS ARE ARCS, not straight chords: r is interpolated between
//     the two endpoints with a +34 world px bulge, which tops out at ~450 world
//     px against the economy ring's 457, so a long thread runs just inside the
//     ring and never crosses the core.
// ---------------------------------------------------------------------------

export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  accentDeep: z.string(),
  backgroundBase: z.string(),
  backgroundSrc: z.string(),
  backgroundBlur: z.number(),
  backgroundDim: z.number(),
  parallax: z.number(),
  shadowY: z.number(),
  shadowBlur: z.number(),
  shadowOpacity: z.number(),
  iconShadowY: z.number(),
  iconShadowBlur: z.number(),
  iconShadowOpacity: z.number(),
  dotOpacity: z.number(),
  beats: z.object({
    but: z.number(),
    hive: z.number(),
    mind: z.number(),
    crazy: z.number(),
    shit: z.number(),
    started: z.number(),
    happening: z.number(),
    end: z.number(), // next word "i"; tail to 105
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
  dotOpacity: OP_UNREAD_DOT,
  beats: {
    but: 0,
    hive: 20,
    mind: 24,
    crazy: 49,
    shit: 57,
    started: 72,
    happening: 82,
    end: 89,
  },
});

/** The world frame this cut opens on: `MillionsOfYears`'s last frame. */
export const W0 = 219;
const LAST = DURATION - 1;
const worldFrame = (f: number) => W0 + f;

// The pour and the mill, run on past cut 1's end. Both are prefix-identical.
const FREES_LONG = buildFrees(EMIT_F1 + 130);
const MILL_LONG = buildMill(W0 + DURATION + 24);

// ---------------------------------------------------------------------------
// THE CAMERA. Cut 1's keys up to W0 verbatim, then this cut's. `runCamera`
// integrates from frame 0, so the value at W0 is cut 1's to the last digit and
// the velocity carries across the join as the damper's own state.
// ---------------------------------------------------------------------------
const CREEP_LAND = W0 + 58;
const BREATH_END = W0 + 92;
const RELEASE_END = W0 + LAST;

const targetKAt = (f: number) => {
  // cut 1's target track, read at a world frame
  let i = 0;
  while (i + 1 < MOY_CAM.F.length && MOY_CAM.F[i + 1] <= f) i++;
  return MOY_CAM.K[i];
};
const K_JOIN = targetKAt(W0);

const trackFor = (kCreep: number, kRelease: number) => {
  const F: number[] = [];
  const K: number[] = [];
  const CY: number[] = [];
  for (let i = 0; i < MOY_CAM.F.length; i++) {
    if (MOY_CAM.F[i] > W0) break;
    F.push(MOY_CAM.F[i]);
    K.push(MOY_CAM.K[i]);
    CY.push(MOY_CAM.CY[i]);
  }
  const push = (m: { F: number[]; K: number[]; CY: number[] }) => {
    for (let i = 0; i < m.F.length; i++) {
      if (m.F[i] <= F[F.length - 1]) continue;
      F.push(m.F[i]);
      K.push(m.K[i]);
      CY.push(m.CY[i]);
    }
  };
  const seg = (f0: number, f1: number, k0: number, k1: number, warp: number) =>
    push(camMove({ f0, f1, k0, k1, c0: C_FIXED, c1: C_FIXED, warp }));
  seg(W0, CREEP_LAND, K_JOIN, kCreep, 0.75);
  seg(CREEP_LAND, BREATH_END, kCreep, kCreep + 0.008, 1.0);
  seg(BREATH_END, RELEASE_END, kCreep + 0.008, kRelease, 0.85);
  seg(RELEASE_END, RELEASE_END + 66, kRelease, kRelease - 0.02, 0.5);
  return { F, K, CY };
};

const kAtWorld = (t: { F: number[]; K: number[]; CY: number[] }, f: number) =>
  runCamera(f, t.F, t.CY, t.K).k;

/** Solve one end key so the DAMPED camera reads `want` on `atWorld`. */
const solve = (
  want: number,
  atWorld: number,
  make: (v: number) => { F: number[]; K: number[]; CY: number[] },
  a: number,
  b: number,
) => {
  const fa = kAtWorld(make(a), atWorld);
  const fb = kAtWorld(make(b), atWorld);
  return a + ((want - fa) * (b - a)) / (fb - fa);
};

const K_CREEP_TARGET = 1.115;
const K_REST_TARGET = 1.02;
const K_CREEP = solve(
  K_CREEP_TARGET,
  CREEP_LAND,
  (v) => trackFor(v, 1.0),
  1.1,
  1.25,
);
const K_RELEASE = solve(
  K_REST_TARGET,
  RELEASE_END,
  (v) => trackFor(K_CREEP, v),
  0.9,
  1.05,
);
const CAM = trackFor(K_CREEP, K_RELEASE);

const CAM_AT_F: { cy: number; k: number }[] = (() => {
  const out: { cy: number; k: number }[] = [];
  for (let f = 0; f <= DURATION; f++) {
    const c = runCamera(worldFrame(f), CAM.F, CAM.CY, CAM.K);
    out.push({ cy: c.cy + sway(worldFrame(f)).dy, k: c.k });
  }
  return out;
})();
const kAt = (f: number) => CAM_AT_F[Math.max(0, Math.min(DURATION, Math.round(f)))].k;

// ---------------------------------------------------------------------------
// THE THREAD. Half the ink stroke — 3.0 screen px against the ink's 6.0 — and
// the set's two thread opacities.
// ---------------------------------------------------------------------------
const THREAD_STROKE = STROKE / 2;
const TH_LIVE = 0.95;
const TH_IDLE = 0.4;
const THREAD_HEAD_R = 3.4; // screen px, divided by k where it is drawn
const PACKET_SCREEN_R = 2.5; // 5.0 across: 2 px prouder than the 3.0 px thread

// Which seaters belong to which station, and where their seat nominally is.
const SEAT_IDS: number[][] = Array.from({ length: NL }, (_, s) =>
  SEATERS.map((p, i) => (p.lane === s ? i : -1)).filter((i) => i >= 0),
);
const seatPos = (i: number) => {
  const p = SEATERS[i];
  const A = ANN[p.lane][p.seat];
  return { x: A.x, y: A.y };
};
const dist = (a: number, b: number) => {
  const p = seatPos(a);
  const q = seatPos(b);
  return Math.hypot(p.x - q.x, p.y - q.y);
};

type Thread = {
  key: string;
  kind: "intra" | "long" | "core";
  a: number; // seater index, the SOURCE (already wired)
  b: number; // seater index, or CORE_NODE
  t0: number;
  dur: number;
  bulge: number; // long threads only: the arc's outward bow
};

const CORE_NODE = -1;
const INTRA_SPEED = 9.0; // world px/frame; an intra thread is ~29 px long
const LONG_SPEED = 28;
const CORE_DUR = 11;
/** A long thread's outward bow, so it runs just INSIDE the economy ring (the
 *  far side of the arc tops out at ~450 world px against the ring's 457) and
 *  never cuts through the core. */
const LONG_BULGE = 20;
/** A core thread's bow, perpendicular to its lane. The lane it runs down is
 *  already carrying the pour, so a thread drawn exactly on the axis is lost in
 *  the stream; 22 world px is enough for the wire to read as a wire beside the
 *  work it comes from without leaving the lane. */
const CORE_BOW = 22;

/** No upper clamp, for the same reason `longDur` has none: the rare long
 *  fallback edge (a dot with no neighbour inside NB_REACH) must draw at the
 *  same speed as a short one or its head breaks the ceiling. */
const intraDur = (len: number) => Math.max(3, Math.round(len / INTRA_SPEED));

// The clockwise station order, opening on the SHORTEST lane — the first station
// lit in cut 1, so the wiring starts where the work started.
const STATION_ORDER: number[] = (() => {
  const first = LANE_RANK.indexOf(0);
  return Array.from({ length: NL }, (_, i) => (first + i) % NL);
})();

// Reach schedule: "hive" wakes the first annulus, "mind" throws the first long
// thread, and a station is reached every 4 frames after it.
const WIRE_F0 = 16;
const LONG_F0 = 24;
const LONG_STEP = 3.0;
/** Two dots are neighbours if they are this close. 26 dots in an annulus band
 *  r 76..114 sit about 29 world px apart, so 52 is "the dot next to me" and not
 *  "any dot in the crowd" — without it the cheapest source is always the seed
 *  and the web comes out a star instead of a front. */
const NB_REACH = 56;
/** A thread's source is usable this fraction of the way through its own draw:
 *  the head is most of the way there, so the next thread leaves before the last
 *  one lands and the front is continuous rather than stepped. The first annulus
 *  runs slower (it is the gesture); the five reached later run tighter, so the
 *  ring closes while "crazy shit" is still being said. */
const SOURCE_FIRST = 0.6;
const SOURCE_LATER = 0.36;

const THREADS: Thread[] = [];
/** The frame each seated instance is reached by the web. */
const WIRED_AT = new Float64Array(SEATERS.length).fill(Infinity);
/** The adjacency of the finished web, for the firing walk. */
const ADJ = new Map<number, number[]>();
const link = (a: number, b: number) => {
  if (!ADJ.has(a)) ADJ.set(a, []);
  if (!ADJ.has(b)) ADJ.set(b, []);
  (ADJ.get(a) as number[]).push(b);
  (ADJ.get(b) as number[]).push(a);
};

const DEG = new Int32Array(SEATERS.length);
const EDGE = new Set<string>();
const edgeKey = (a: number, b: number) => (a < b ? `${a}:${b}` : `${b}:${a}`);

const addIntra = (a: number, b: number, t0: number) => {
  const d = dist(a, b);
  const dur = intraDur(d);
  THREADS.push({ key: `i${THREADS.length}`, kind: "intra", a, b, t0, dur, bulge: 0 });
  DEG[a]++;
  DEG[b]++;
  EDGE.add(edgeKey(a, b));
  link(a, b);
  return t0 + dur;
};

const nearestTo = (ids: number[], p: { x: number; y: number }) =>
  ids.reduce((best, i) => {
    const q = seatPos(i);
    const r = seatPos(best);
    return Math.hypot(q.x - p.x, q.y - p.y) < Math.hypot(r.x - p.x, r.y - p.y)
      ? i
      : best;
  }, ids[0]);

/** No upper clamp: a long thread's head must stay inside the set's 45 screen
 *  px/frame ceiling, and `arriveEase` cruises at 1.3x the average, so the draw
 *  length has to track the arc's length — 1.3 * LONG_SPEED * kMax = 40.9. */
const longDur = (d: number) => Math.max(6, Math.round((d * 1.15) / LONG_SPEED));

// --- the contagion, station by station -------------------------------------
const SEED_OF = new Int32Array(NL).fill(-1);
const SPREAD_DEPTH = new Int32Array(NL);
(() => {
  let prevStation = -1;
  STATION_ORDER.forEach((s, order) => {
    const ids = SEAT_IDS[s];
    let seed: number;
    let reach: number;
    if (order === 0) {
      // the first annulus wakes at the dot nearest the core: the pour arrives
      // there, so that is where the web starts
      seed = nearestTo(ids, CORE);
      reach = WIRE_F0;
    } else {
      // On schedule, the WIRED dot of the previous annulus that is nearest this
      // one throws the long thread. It is picked from the dots the front has
      // already reached, so the jump is caused by the wiring and never waits
      // for the whole annulus to finish.
      const t0 = LONG_F0 + LONG_STEP * (order - 1);
      const target = STATION[s];
      const ready = SEAT_IDS[prevStation].filter((i) => WIRED_AT[i] + 0.5 <= t0);
      // if the front has not reached anything by the scheduled frame, the dot
      // that IS wired earliest throws it — still a wired dot, never a timer
      const src = ready.length
        ? nearestTo(ready, target)
        : SEAT_IDS[prevStation].reduce((a, b) => (WIRED_AT[a] <= WIRED_AT[b] ? a : b));
      const start = Math.max(t0, WIRED_AT[src] + 0.5);
      const dst = nearestTo(ids, seatPos(src));
      const d = Math.hypot(
        seatPos(src).x - seatPos(dst).x,
        seatPos(src).y - seatPos(dst).y,
      );
      const dur = longDur(d);
      THREADS.push({
        key: `L${THREADS.length}`,
        kind: "long",
        a: src,
        b: dst,
        t0: start,
        dur,
        bulge: LONG_BULGE,
      });
      DEG[src]++;
      DEG[dst]++;
      EDGE.add(edgeKey(src, dst));
      link(src, dst);
      seed = dst;
      reach = start + dur * SOURCE_LATER;
    }

    // The front inside the annulus: at every step the (wired, unwired) NEIGHBOUR
    // pair that can be reached soonest takes the thread, which walks the web
    // round the ring and out through the band instead of fanning from the seed.
    const srcAt = order === 0 ? SOURCE_FIRST : SOURCE_LATER;
    WIRED_AT[seed] = Math.min(WIRED_AT[seed], reach);
    const depth = new Map<number, number>([[seed, 0]]);
    const wired = [seed];
    const rest = ids.filter((i) => i !== seed);
    while (rest.length) {
      let bi = -1;
      let ba = -1;
      let bt = Infinity;
      // Three passes, each a relaxation of the last: a neighbour of a dot that
      // is not already a hub, then any neighbour, then anything at all. The cap
      // keeps the web a FRONT — without it the earliest dot is the cheapest
      // source for everything and the annulus comes out a star.
      for (let pass = 0; pass < 3 && bi < 0; pass++) {
        for (let r = 0; r < rest.length; r++) {
          const b = rest[r];
          for (const a of wired) {
            const d = dist(a, b);
            if (pass === 0 && DEG[a] >= 3) continue;
            if (pass < 2 && d > NB_REACH) continue;
            const t =
              WIRED_AT[a] +
              srcAt * intraDur(d) +
              d / 400 +
              (hash(a * 131 + b, 45) - 0.5) * 1.6;
            if (t < bt) {
              bt = t;
              bi = r;
              ba = a;
            }
          }
        }
      }
      const b = rest[bi];
      rest.splice(bi, 1);
      const start = Math.max(WIRED_AT[ba], reach);
      const end = addIntra(ba, b, start);
      WIRED_AT[b] = start + (end - start) * srcAt;
      depth.set(b, (depth.get(ba) as number) + 1);
      wired.push(b);
    }
    SPREAD_DEPTH[s] = Math.max(...Array.from(depth.values()));
    SEED_OF[s] = seed;
    prevStation = s;
  });
})();

const STATION_WIRED = Array.from({ length: NL }, (_, s) =>
  Math.max(...SEAT_IDS[s].map((i) => WIRED_AT[i])),
);

// --- the density pass: cross-threads until every dot carries 2-3 ------------
// Two passes, both by contact and both inside the annulus: first every dot the
// tree left with one thread gets a second, then the shortest remaining pairs
// get a third. A start never precedes either end being wired.
const DENSE_F0 = 44;
const DENSE_F1 = 58;
(() => {
  const schedule = (a: number, b: number) => {
    const ready = Math.max(WIRED_AT[a], WIRED_AT[b]) + 2;
    return Math.max(ready, DENSE_F0 + (DENSE_F1 - DENSE_F0) * hash(a * 17 + b, 46));
  };
  for (let s2 = 0; s2 < NL; s2++) {
    const ids = SEAT_IDS[s2];
    const pairs: { a: number; b: number; d: number }[] = [];
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const d = dist(ids[i], ids[j]);
        if (d > NB_REACH * 1.2) continue;
        if (EDGE.has(edgeKey(ids[i], ids[j]))) continue;
        pairs.push({ a: ids[i], b: ids[j], d });
      }
    }
    pairs.sort((p, q) => p.d - q.d);
    // pass 1: nobody is left on one thread
    for (const p of pairs) {
      if (DEG[p.a] >= 2 && DEG[p.b] >= 2) continue;
      if (DEG[p.a] >= 4 || DEG[p.b] >= 4) continue;
      if (EDGE.has(edgeKey(p.a, p.b))) continue;
      addIntra(p.a, p.b, schedule(p.a, p.b));
    }
    // pass 2: thicken, to a cap of three threads a dot
    let added = 0;
    for (const p of pairs) {
      if (added >= 10) break;
      if (DEG[p.a] >= 3 || DEG[p.b] >= 3) continue;
      if (EDGE.has(edgeKey(p.a, p.b))) continue;
      addIntra(p.a, p.b, schedule(p.a, p.b));
      added++;
    }
  }
})();

// --- long threads between neighbouring annuli, once both are wired ----------
(() => {
  for (let o = 0; o < NL; o++) {
    const sA = STATION_ORDER[o];
    const sB = STATION_ORDER[(o + 1) % NL];
    const cands: { a: number; b: number; d: number }[] = [];
    for (const a of SEAT_IDS[sA]) {
      for (const b of SEAT_IDS[sB]) {
        if (EDGE.has(edgeKey(a, b))) continue;
        cands.push({
          a,
          b,
          d: Math.hypot(seatPos(a).x - seatPos(b).x, seatPos(a).y - seatPos(b).y),
        });
      }
    }
    cands.sort((p, q) => p.d - q.d);
    const want = 2 + (hash(o, 47) < 0.5 ? 0 : 1);
    let added = 0;
    const used = new Set<number>();
    for (const c of cands) {
      if (added >= want) break;
      if (used.has(c.a) || used.has(c.b)) continue;
      used.add(c.a);
      used.add(c.b);
      THREADS.push({
        key: `X${THREADS.length}`,
        kind: "long",
        a: c.a,
        b: c.b,
        t0:
          Math.max(
            Math.max(WIRED_AT[c.a], WIRED_AT[c.b]) + 2,
            DENSE_F0 + 2,
          ) +
          hash(c.a + c.b, 48) * 5,
        dur: longDur(c.d),
        bulge: LONG_BULGE,
      });
      DEG[c.a]++;
      DEG[c.b]++;
      EDGE.add(edgeKey(c.a, c.b));
      link(c.a, c.b);
      added++;
    }
  }
})();

// --- and the core takes six, one down each lane -----------------------------
const CORE_F0 = 44;
const CORE_STEP = 1.3;
(() => {
  STATION_ORDER.forEach((s, order) => {
    // the innermost dot of that annulus: the one the lane already runs to
    const a = SEAT_IDS[s].reduce((best, i) => {
      const p = seatPos(i);
      const q = seatPos(best);
      return Math.hypot(p.x - CORE.x, p.y - CORE.y) <
        Math.hypot(q.x - CORE.x, q.y - CORE.y)
        ? i
        : best;
    }, SEAT_IDS[s][0]);
    const t0 = Math.max(WIRED_AT[a] + 1, CORE_F0 + CORE_STEP * order);
    THREADS.push({
      key: `C${THREADS.length}`,
      kind: "core",
      a,
      b: CORE_NODE,
      t0,
      dur: CORE_DUR,
      bulge: CORE_BOW,
    });
    DEG[a]++;
    link(a, CORE_NODE);
  });
})();

// ---------------------------------------------------------------------------
// THE FIRING. A breadth-first walk over the finished web out from the same seed
// the wiring started at, with depth mapped linearly onto "started" -> "happening".
// ---------------------------------------------------------------------------
const FIRE_F0 = 72; // "started"
const FIRE_F1 = 82; // "happening"
const DEPTH = new Map<number, number>();
(() => {
  const start = SEED_OF[STATION_ORDER[0]];
  DEPTH.set(start, 0);
  const q = [start];
  for (let h = 0; h < q.length; h++) {
    const n = q[h];
    const d = DEPTH.get(n) as number;
    for (const m of ADJ.get(n) ?? []) {
      if (DEPTH.has(m)) continue;
      DEPTH.set(m, d + 1);
      q.push(m);
    }
  }
})();
const MAX_DEPTH = Math.max(...Array.from(DEPTH.values()));
const FIRE_AT = THREADS.map((t) => {
  const da = DEPTH.get(t.a) ?? MAX_DEPTH;
  const db = DEPTH.get(t.b) ?? MAX_DEPTH;
  const d = Math.min(da, db);
  return FIRE_F0 + ((FIRE_F1 - FIRE_F0) * d) / Math.max(1, MAX_DEPTH);
});

// The lane packets tick up: a SECOND train fades in over f8-24 beside cut 1's,
// so a lane goes from one packet every 10 frames to one every 6.
const TICK_F0 = 8;
const TICK_F1 = 24;
const TICK_PERIOD = 15; // 1/10 + 1/15 = 1/6

// ---------------------------------------------------------------------------

/** A core thread: the straight run down its lane, bowed off the axis so it does
 *  not disappear into the pour already running there. */
const bowPoint = (
  A: { x: number; y: number },
  B: { x: number; y: number },
  bow: number,
  u: number,
) => {
  const dx = B.x - A.x;
  const dy = B.y - A.y;
  const L = Math.hypot(dx, dy) || 1;
  const o = bow * Math.sin(Math.PI * u);
  return { x: A.x + dx * u + (-dy / L) * o, y: A.y + dy * u + (dx / L) * o };
};

const arcPoint = (
  A: { x: number; y: number },
  B: { x: number; y: number },
  bulge: number,
  u: number,
) => {
  const rA = Math.hypot(A.x - CORE.x, A.y - CORE.y);
  const rB = Math.hypot(B.x - CORE.x, B.y - CORE.y);
  const aA = Math.atan2(A.y - CORE.y, A.x - CORE.x);
  let aB = Math.atan2(B.y - CORE.y, B.x - CORE.x);
  while (aB - aA > Math.PI) aB -= 2 * Math.PI;
  while (aB - aA < -Math.PI) aB += 2 * Math.PI;
  const r = rA + (rB - rA) * u + bulge * Math.sin(Math.PI * u);
  const a = aA + (aB - aA) * u;
  return { x: CORE.x + Math.cos(a) * r, y: CORE.y + Math.sin(a) * r };
};

/** A CORE thread ends at its lane's INNER END, not at the centre: the mark is
 *  there now. The curve itself is untouched — the same bowed run from the
 *  annulus' innermost dot toward the core — and it is simply cut where it
 *  crosses LANE_IN, so the wire lands on the lane's inner end and nothing is
 *  drawn across the mark. Solved per frame off the thread's LIVE endpoints, by
 *  bisection on a distance that falls monotonically along the bow. */
const CORE_END_STEPS = 22;

const HiveMind: React.FC<Props> = ({
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
  dotOpacity,
  beats,
}) => {
  const frame = useCurrentFrame();
  const wf = worldFrame(frame);

  // -- camera: cut 1's, continued -------------------------------------------
  const cam = runCamera(wf, CAM.F, CAM.CY, CAM.K);
  const drift = sway(wf);
  const cy = cam.cy + drift.dy;
  const cx = CX + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);

  // -- the standing world, one frame further on ------------------------------
  const world = buildWorld(wf, {
    frees: FREES_LONG,
    mill: MILL_LONG,
    econBeat: 191, // cut 1's "economy": the dark traffic is already thinned
    // a wired dot is HELD by the web: its micro-drift halves over 8 frames
    damp: (i) => 1 - 0.5 * smoothstep(clamp01((frame - WIRED_AT[i]) / 8)),
  });

  // Where every seated instance actually is this frame — a thread endpoint is
  // its dot's LIVE position, so the web follows the mill instead of floating.
  const at = new Map<number, { x: number; y: number }>();
  at.set(CORE_NODE, { x: CORE.x, y: CORE.y });
  for (const d of world.live) {
    if (d.key.charCodeAt(0) !== 115) continue; // "s" — a seater
    at.set(Number(d.key.slice(1)), { x: d.x, y: d.y });
  }

  // -- the web ---------------------------------------------------------------
  type Drawn = {
    t: Thread;
    A: { x: number; y: number };
    B: { x: number; y: number };
    u: number;
    op: number;
    fire: number;
    idx: number;
  };
  const drawn: Drawn[] = [];
  THREADS.forEach((t, idx) => {
    if (frame < t.t0) return;
    const A = at.get(t.a);
    const B = at.get(t.b);
    if (!A || !B) return;
    const u = arriveEase(clamp01((frame - t.t0) / t.dur));
    // live while it is drawing and for 8 frames after, and live again the
    // moment signal starts running on it
    const settle = 1 - smoothstep(clamp01((frame - (t.t0 + t.dur)) / 8));
    const fire = clamp01((frame - FIRE_AT[idx]) / 6);
    const act = Math.max(u < 1 ? 1 : settle, fire);
    drawn.push({ t, A, B, u, op: TH_IDLE + (TH_LIVE - TH_IDLE) * act, fire, idx });
  });

  const pointOn = (d: Drawn, u: number) =>
    d.t.kind === "long"
      ? arcPoint(d.A, d.B, d.t.bulge, u)
      : d.t.kind === "core"
        ? bowPoint(d.A, d.B, d.t.bulge, u)
        : { x: d.A.x + (d.B.x - d.A.x) * u, y: d.A.y + (d.B.y - d.A.y) * u };

  /** The draw parameter at which a core thread meets LANE_IN. 1 for every
   *  other kind, so nothing else is clipped. */
  const endU = (d: Drawn) => {
    if (d.t.kind !== "core") return 1;
    const rAt = (u: number) => {
      const p = pointOn(d, u);
      return Math.hypot(p.x - CORE.x, p.y - CORE.y);
    };
    let lo = 0;
    let hi = 1;
    if (rAt(0) <= LANE_IN) return 0;
    for (let i = 0; i < CORE_END_STEPS; i++) {
      const m = (lo + hi) / 2;
      if (rAt(m) > LANE_IN) lo = m;
      else hi = m;
    }
    return lo;
  };

  const pathOf = (d: Drawn) => {
    if (d.t.kind === "intra") {
      const p = pointOn(d, d.u);
      return `M${d.A.x.toFixed(2)} ${d.A.y.toFixed(2)}L${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
    }
    // The curve itself is the one cut 1's world drew: the same 12 vertices over
    // the same span. A core thread is CUT at LANE_IN by a clip, not by dropping
    // vertices — a stroked path is rasterised into a mask aligned to its own
    // bounding box, so shortening the geometry re-aligns that mask and shows up
    // as a hairline seam along the WHOLE thread (measured: 4,999 changed pixels
    // against 401 when the path is left alone). A clip leaves the mask where it
    // was and removes only what is inside the disc.
    const steps = 12;
    let s = "";
    for (let i = 0; i <= steps; i++) {
      const p = pointOn(d, (i / steps) * d.u);
      s += `${i === 0 ? "M" : "L"}${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
    }
    return s;
  };
  const headOf = (d: Drawn) => pointOn(d, Math.min(d.u, endU(d)));

  /** Everything but a disc of LANE_IN around the centre: where the mark is, no
   *  thread and no signal is drawn. Applied per element, so paint order is
   *  exactly the order it was. */
  const CORE_CLIP = "hm-core-clip";
  const clipD =
    `M-2000 -2000H3080V3920H-2000Z ` +
    `M${(CORE.x - LANE_IN).toFixed(2)} ${CORE.y}` +
    `A${LANE_IN} ${LANE_IN} 0 1 0 ${(CORE.x + LANE_IN).toFixed(2)} ${CORE.y}` +
    `A${LANE_IN} ${LANE_IN} 0 1 0 ${(CORE.x - LANE_IN).toFixed(2)} ${CORE.y}Z`;

  const web = (
    <g>
      <defs>
        <clipPath id={CORE_CLIP} clipRule="evenodd">
          <path d={clipD} clipRule="evenodd" />
        </clipPath>
      </defs>
      {drawn.map((d) => (
        <path
          key={d.t.key}
          d={pathOf(d)}
          fill="none"
          stroke={accent}
          strokeWidth={THREAD_STROKE}
          strokeLinecap="round"
          opacity={d.op}
          clipPath={d.t.kind === "core" ? `url(#${CORE_CLIP})` : undefined}
        />
      ))}
      {drawn.map((d) =>
        d.u < 1 ? (
          <circle
            key={`h${d.t.key}`}
            cx={headOf(d).x}
            cy={headOf(d).y}
            r={THREAD_HEAD_R / k}
            fill={accent}
            opacity={OP_FG}
          />
        ) : null,
      )}
    </g>
  );

  // -- the firing, and the lanes' second packet train ------------------------
  const tick = smoothstep(clamp01((frame - TICK_F0) / (TICK_F1 - TICK_F0)));
  const firing = (
    <g>
      {drawn.map((d) => {
        if (d.u < 1 || d.fire <= 0) return null;
        // A packet crosses its own thread in ~6 frames whatever the thread's
        // length, so a SHORT thread is not empty for nine frames out of ten:
        // an intra thread is ~29 world px and at a flat 22 px/frame a packet
        // would be on it for one frame in ten and the web would read as dead.
        const len =
          Math.hypot(d.B.x - d.A.x, d.B.y - d.A.y) * (d.t.kind === "intra" ? 1 : 1.15);
        const ps = packetsOn({
          frame,
          k,
          from: d.A,
          to: d.B,
          period: 10,
          phase: FIRE_AT[d.idx],
          speed: Math.min(22, Math.max(3, len / 6)),
          opacity: 1,
          seed: d.idx + 11,
        });
        const uMax = endU(d);
        return ps.map((p, n) => {
          if (p.u > uMax) return null; // a core thread's signal ends at the lane's inner end
          const q = pointOn(d, p.u);
          return (
            <circle
              key={`fp${d.t.key}-${n}`}
              cx={q.x}
              cy={q.y}
              r={PACKET_SCREEN_R / k}
              fill={accent}
              opacity={
                OP_FG * d.fire * (1 - smoothstep(clamp01((p.u - 0.88) / 0.12)))
              }
            />
          );
        });
      })}
      {tick > 0
        ? LANE_D.map((d, s) => {
            const from = { x: CORE.x + d.x * laneR1(s), y: CORE.y + d.y * laneR1(s) };
            const to = { x: CORE.x + d.x * LANE_R0, y: CORE.y + d.y * LANE_R0 };
            const ps = packetsOn({
              frame: wf,
              k,
              from,
              to,
              period: TICK_PERIOD,
              phase: 191,
              speed: BACK_SPEED,
              opacity: tick,
              seed: s + 57,
            });
            return ps.map((p, n) => (
              <circle
                key={`tp${s}-${n}`}
                cx={p.x}
                cy={p.y}
                r={DOT_R * 0.8}
                fill={accent}
                opacity={
                  OP_FG *
                  tick *
                  laneGate(p.x, p.y) *
                  (1 - smoothstep(clamp01((p.u - 0.85) / 0.15)))
                }
              />
            ));
          })
        : null}
    </g>
  );

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <GridBackground
        src={backgroundSrc}
        blur={backgroundBlur}
        dim={backgroundDim}
        frame={wf}
        cy={cy}
        cyRest={MOY_CAM.CY[0]}
        cx={cx}
        cxRest={CX}
        k={k}
        parallax={parallax}
      />

      <AbsoluteFill
        style={{
          filter: `drop-shadow(0 ${shadowY}px ${shadowBlur}px rgba(0,0,0,${shadowOpacity}))`,
        }}
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
          <WorldSvg
            frame={wf}
            k={k}
            world={world}
            ink={ink}
            accent={accent}
            accentDeep={accentDeep}
            dotOpacity={dotOpacity}
            icon={icon}
            afterTraffic={web}
            afterDots={firing}
          />
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default HiveMind;

// Referenced so the beats object is a real contract and not decoration.
export const BEAT_CHECK = {
  hive: defaultProps.beats.hive,
  mind: defaultProps.beats.mind,
  shit: defaultProps.beats.shit,
  started: defaultProps.beats.started,
  happening: defaultProps.beats.happening,
  end: defaultProps.beats.end,
};

export const STATS = (() => {
  const intra = THREADS.filter((t) => t.kind === "intra");
  const long = THREADS.filter((t) => t.kind === "long");
  const core = THREADS.filter((t) => t.kind === "core");
  const kk = Array.from({ length: DURATION }, (_, f) => kAt(f));
  // camera continuity, measured on a world point 420 screen px from the centre
  const P = { x: CORE.x, y: CORE.y - 400 };
  const sp = Array.from({ length: DURATION }, (_, f) => {
    const c = CAM_AT_F[f];
    return 960 + (P.y - c.cy) * c.k;
  });
  const v = sp.slice(1).map((y, i) => y - sp[i]);
  const a = v.slice(1).map((x, i) => Math.abs(x - v[i]));
  // the widest ink, on screen, at the tightest zoom
  const kMax = Math.max(...kk);
  return {
    threads: THREADS.length,
    intra: intra.length,
    long: long.length,
    core: core.length,
    degMean: Number((DEG.reduce((s, d) => s + d, 0) / DEG.length).toFixed(2)),
    degMin: Math.min(...Array.from(DEG)),
    degMax: Math.max(...Array.from(DEG)),
    degHist: [0, 1, 2, 3, 4, 5].map(
      (d) => Array.from(DEG).filter((v) => (d === 5 ? v >= 5 : v === d)).length,
    ),
    spreadDepth: Array.from(SPREAD_DEPTH),
    seedWired: STATION_ORDER.map((s) => Number(WIRED_AT[SEED_OF[s]].toFixed(1))),
    hopStats: (() => {
      const h = THREADS.filter((t) => t.kind === "intra").map((t) => t.dur);
      return { durMin: Math.min(...h), durMax: Math.max(...h), n: h.length };
    })(),
    wiredSpanStation0: [
      Number(Math.min(...SEAT_IDS[STATION_ORDER[0]].map((i) => WIRED_AT[i])).toFixed(1)),
      Number(Math.max(...SEAT_IDS[STATION_ORDER[0]].map((i) => WIRED_AT[i])).toFixed(1)),
    ],
    stationWired: STATION_ORDER.map((s) => Number(STATION_WIRED[s].toFixed(1))),
    allWiredBy: Number(Math.max(...Array.from(WIRED_AT)).toFixed(1)),
    lastThreadLands: Number(Math.max(...THREADS.map((t) => t.t0 + t.dur)).toFixed(1)),
    fireDepthMax: MAX_DEPTH,
    fireSpan: [
      Number(Math.min(...FIRE_AT).toFixed(1)),
      Number(Math.max(...FIRE_AT).toFixed(1)),
    ],
    kJoin: Number(K_JOIN.toFixed(5)),
    kCreepKey: Number(K_CREEP.toFixed(5)),
    kReleaseKey: Number(K_RELEASE.toFixed(5)),
    kAt0: Number(kk[0].toFixed(4)),
    kAt50: Number(kk[50].toFixed(4)),
    kAt58: Number(kk[58].toFixed(4)),
    kAt64: Number(kk[64].toFixed(4)),
    kAt92: Number(kk[92].toFixed(4)),
    kLast: Number(kk[DURATION - 1].toFixed(4)),
    kMax: Number(kMax.toFixed(4)),
    camAccelMax: Number(Math.max(...a).toFixed(3)),
    camSpeedMin: Number(Math.min(...v.map(Math.abs)).toFixed(3)),
    // thread head speeds, screen px/frame
    headMax: Number(
      Math.max(
        ...THREADS.map((t, i) => {
          const A = seatPos(t.a);
          const B = t.b === CORE_NODE ? { x: CORE.x, y: CORE.y } : seatPos(t.b);
          const len =
            t.kind === "long"
              ? Math.hypot(B.x - A.x, B.y - A.y) * 1.15
              : Math.hypot(B.x - A.x, B.y - A.y);
          // arriveEase cruises at 1.3x the average
          return (1.3 * len * kAt(t.t0 + t.dur / 2)) / t.dur + 0 * i;
        }),
      ).toFixed(2),
    ),
    // the outermost ink on screen at the tightest zoom: the economy ring
    econScreenR: Number((ECON_R * kMax).toFixed(1)),
    bandY: [
      Number((835 - ECON_R * kMax - 6).toFixed(1)),
      Number((835 + ECON_R * kMax + 6).toFixed(1)),
    ],
    marginX: Number((540 - ECON_R * kMax - 4).toFixed(1)),
    annOuterScreenR: Number(((Math.max(...R_ST) + ANN_R0 + 38) * kMax).toFixed(1)),
    frees: FREES_LONG.length,
    millHops: MILL_LONG.reduce((s, h) => s + h.length, 0),
    seatersWired: Array.from(WIRED_AT).filter((v2) => isFinite(v2)).length,
    kRestCut1: K_REST,
  };
})();
