import { AbsoluteFill, useCurrentFrame } from "remotion";
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
  OP_UNREAD_DOT,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  camEase,
  clamp01,
  iconShadow,
  makeTone,
  runCamera,
  smoothstep,
  sway,
  worldTransform,
} from "./fieldShared";
import {
  CURVE_AT as curveAt,
  DOT_R,
  SPINE_OPACITY,
  STREAM_V,
  STROKE,
  cometPath,
  spinePath,
} from "./GoodTrajectory";
import type { Drawn } from "./GoodTrajectory";
import {
  D_BASE,
  STRIP,
  TIERS,
  lateralMul,
  radiusMul,
  seatS,
  seatRaw,
  speedMul,
  tickHalf,
} from "./IncreasinglyCapable";

export const FPS = 24;

// ---------------------------------------------------------------------------
// Noam, clip `Noam_Children`, cut `ChainOfThought` — the FOURTH cut, on the same
// ladder:
// "Yeah, they were trying to do deceptive stuff. We could actually see in their
//  chain of thought that they were trying to do deceptive stuff."
//
// DURATION. The composition starts at 26.820 s and speech ends at 31.060 s:
//   DURATION = round((31.060 - 26.820) * 24) + 16 = 102 + 16 = 118
//
// Word onsets, frame = round((t - 26.820) * 24):
//   yeah 0 · they 4 · were 5 · TRYING 9 · to 13 · do 16 · DECEPTIVE 19 ·
//   STUFF 28 (ends 36) · we 36 · could 37 · actually 39 · SEE 44 · in 51 ·
//   their 53 · CHAIN 55 · of 59 · THOUGHT 61 (ends 66) · that 66 · they 75 ·
//   were 78 · TRYING 80 · to 83 · do 85 · DECEPTIVE 87 · STUFF 95 ·
//   speech ends 102 · tail 102-118.
export const DURATION = 118;

// ---------------------------------------------------------------------------
// EDITORIAL CONTEXT. About seven seconds of other material sit between cut 3
// and this one, so no seat has to line up — but the PICTURE does: the same
// curve, the same spine, the same rigid tau-uniform strip at 0.14 comets per
// world px of arc, the same three-tick ladder with its tiers. World time is
// 630 + f. The line that FOLLOWS is "But they're going to get smarter. They're
// going to understand the concept of chain of thought ... hiding ...", which is
// a very likely next pick and will want this cut's chain, so the chain's
// geometry and schedule are exported whole: `CHAINS`, `chainPoints`, `beadBorn`,
// `beadR`, `BEAD_MUL`, `BEAD_MIN`, `PITCH_MUL`, `N_BEADS`, `SUBJECTS`,
// `SUB_PATH`, `subAt`, `devAt`, `creepAt`, `RING_MUL`, `RING_START`, `ringU`,
// `F_STRIP` and `worldAt`. The world the follow-on cut would have to stand in is
// exported too: `STRIP_EXT` and `seatState` (the extended rigid strip on this
// cut's clock), `POCKET` (the seats this cut drops), `SUB_GAIN` (each subject's
// solved excursion gain), and the camera as `CAM_AT` / `SCREEN_AT` / `K_REST` /
// `K_END`.
// The cut ends open — the camera is still drifting and all three subjects are
// still creeping along their chains on the last frame.
//
// ---------------------------------------------------------------------------
// VOCABULARY. Unchanged from the first three cuts:
//   ORANGE      the AI models — and, new here, their thoughts.
//   WHITE INK   ours. A white RING around a comet means WE SEE IT: cut 2's sign
//               ring exactly — the same radius rule against the comet's own
//               radius, the same stroke, and the same trigger, which is the
//               comet's own deviation passing 30 degrees and not a clock.
//   A MISALIGNED COMET is deep-toned with a drifter's short tip, cut 1's rule.
// NEW, and the only new noun in the clip:
//   A CHAIN OF THOUGHT is a chain of small solid orange beads on a thin accent
//   thread, growing out AHEAD of a comet along the path it intends to take. It
//   is born link by link FROM the comet — bead n pops when bead n-1 is 60% grown
//   and the thread draws with it — so the chain's own growth is the mechanism
//   and nothing in it appears on a timer it did not cause. The beads are born
//   RIPE while the comet they belong to has gone DEEP: the thought is the
//   bright, legible part. Its curvature increases away from the spine, so at a
//   glance the chain says "planning to leave the trajectory".
//
// ---------------------------------------------------------------------------
// GESTURES — the word each lands on, the frames it runs over.
//
//  1. f0-36   "yeah, they were    THE TRY. Opens already gliding in on the
//             trying to do        tier-1/tier-2 stretch and eases into a RIDE on
//             deceptive stuff"    one subject comet (cut 3's ride construction,
//             (f9/f19/f28)        with the damper's own lead), holding it in
//                                 the LEFT half of the frame — screen x 410-510,
//                                 y 765-836 (`HOLD_X` / `HOLD_Y`), so the stream
//                                 fills the left and the chain grows into the
//                                 right — at k 1.70. From f6 the
//                                 subject TRIES: its heading eases off the
//                                 tangent, outward — 18 degrees, half back to
//                                 12, then on through 30 and out to 40 by f26 —
//                                 ripe to deep as it goes, tip shortening to a
//                                 drifter's, and it begins to slide out of the
//                                 stream. Its deviation passes 30 at f21, and
//                                 THAT starts the white ring drawing; the ring
//                                 closes at f31, just after STUFF.
//  2. f32-68  "we could actually  THE CHAIN. Without a pause it grows out of the
//             see in their chain  ringed subject, ahead of it, link by link and
//             of thought"         out through the ring: first bead f34, ninth
//             (f44/f55/f61)       complete f63, landing on THOUGHT. The camera
//                                 eases back to k 1.35 and LEADS toward the
//                                 growing tip, so comet, ring and whole chain
//                                 are in frame by f66 — the camera following the
//                                 chain is "we could see".
//  3. f66-102 "that they were     THE PLURAL. One long pull-back and settle that
//             trying to do        DISCOVERS two more: one further up in tier 2,
//             deceptive stuff"    one in tier 1 on the other side of the spine,
//             (f80/f87/f95)       both already ringed, already deep, each with
//                                 its chain already grown and curling outward —
//                                 they have been doing it since before the frame
//                                 could see them. On DECEPTIVE STUFF the picture
//                                 is the ladder's stream flowing up the spine
//                                 and three ringed comets peeling off it, each
//                                 with a bright chain pointing where it means to
//                                 go. And each subject CREEPS along its own
//                                 chain — about one bead pitch by the last frame —
//                                 absorbing a bead as it reaches it. Still
//                                 trying.
//  4. f102-118 tail               Decaying drift; the stream flows, the subjects
//                                 creep, the wander is alive. Nothing lands.
//
// ---------------------------------------------------------------------------
// WHAT IS RE-DERIVED AND WHAT IS IMPORTED. The ladder, the flow, the strip and
// the comet are all cut 3's, imported — `STRIP`, `seatRaw`, `TIERS`,
// `radiusMul`, `lateralMul`, `speedMul`, `tickHalf` — so this is the same world
// rather than a copy of it. The strip is evaluated at f + F_STRIP: it is rigid
// and uniform in tau, so no frame of it is distinguishable from another, and the
// offset is chosen only to put cut 3's own pocket far above anything this cut
// shows and to keep the corridor populated below everything it shows.
//
// ---------------------------------------------------------------------------
// MEASURED (pass 2, as delivered).
//   Camera        |dv| 2.474 px/f^2 at f76 outside the ride (bar 2.5); peak |v|
//                 44.3 screen px/f (close-up cap 45). Ride hold f12-34
//                 x 410..510, y 765..836.
//   Density       per 150 px of visible arc, per tier, at f0/30/66/95/117: no
//                 empty bin anywhere; max/min <= 1.60 in every tier once the
//                 bins holding a pocketed seat are excepted. The one raw
//                 excursion is f117 tier 3 at 1.63, and both of its low bins
//                 are pocket bins (1.30 without them). The pocket is 24 seats
//                 — only those that would pass under a bead or a ring with
//                 less than half a bead's daylight (`CHAIN_CLEAR`).
//   Chain         bead radius 0.75 x the comet's own radius, floor 9 world px;
//                 pitch 2.8 radii; total curl 80 degrees as sigma^1.4; ninth
//                 bead completes f63. Nearest a stream comet comes to a bead:
//                 44 world px.
//   Excursion     `SUB_GAIN` solves to 1.00/1.00/1.00 — every subject lands
//                 inside the corridor's local edge + 90 px on its own, so the
//                 `EDGE_OUT` cap never binds.
//   Clumping      fused groups > 1 at f0/26/66/95/117: 2/0/2/6/7, largest 2
//                 (one group of 3 on the last frame).
// KNOWN DEVIATIONS. All three subjects, rings and chain tips are first wholly
// inside x 90-990, y 220-1400 at f101, not across f87-95: landing it earlier
// meant compressing the pull-back (`F_OUT` 94), which took |dv| to 5.03, and
// the camera budget wins. Subjects 1 and 2 therefore cross the frame edge over
// a frame or two as they enter (first partly in frame f78 and f90).
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
    trying: z.number(),
    deceptive: z.number(),
    stuff: z.number(),
    see: z.number(),
    chain: z.number(),
    thought: z.number(),
    deceptive2: z.number(),
    stuff2: z.number(),
    end: z.number(),
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
    trying: 9,
    deceptive: 19,
    stuff: 28,
    see: 44,
    chain: 55,
    thought: 61,
    deceptive2: 87,
    stuff2: 95,
    end: 102,
  },
});

const CX = FRAME_W / 2;
export const W0 = 630;
/** The strip's own clock. See WHAT IS RE-DERIVED. */
export const F_STRIP = 300;

type Seat = Parameters<typeof seatRaw>[0];

// THE STRIP HAS TO REACH BELOW THE BOTTOM OF FRAME ON THE LAST FRAME. Cut 3's
// strip is a finite run of seats in tau; run it on at F_STRIP and its lowest
// seat has climbed to arc 2429 by f117, which is halfway up this cut's ladder —
// the first build had tick 1 standing on a bare spine and the stream above it
// full of holes. The strip is uniform in tau, so it is extended by translating
// a whole copy of itself DOWN by its own tau span: the copy's top seat lands one
// mean spacing below the original's bottom, so the density is continuous across
// the seam even though the relaxation is not matched across it, and the seam is
// a single joint that travels up the curve rather than a hole. The density
// assertion in the check script is what proves it.
const TAU_SPAN = (() => {
  let lo = Infinity;
  let hi = -Infinity;
  for (const p of STRIP) {
    lo = Math.min(lo, p.tau);
    hi = Math.max(hi, p.tau);
  }
  return ((hi - lo) * (STRIP.length + 1)) / STRIP.length;
})();
export const STRIP_EXT: Seat[] = [
  ...STRIP.map((p, i) => ({ ...p, key: `q${i}`, tau: p.tau - TAU_SPAN })),
  ...STRIP,
];

export const seatState = (p: Seat, f: number) => seatRaw(p, f + F_STRIP);
const arcOf = (p: Seat, f: number) => seatS(p, f + F_STRIP);

// ---------------------------------------------------------------------------
// THE SUBJECTS. Three comets near the corridor's outer edge that veer OUTWARD.
// Each is a seat of the strip, so it is one of the crowd until it stops being;
// each has its own start frame, and the two the camera finds later started long
// before the cut did — they are not spawned when they are discovered.
// ---------------------------------------------------------------------------
export type Subject = { seat: number; t0: number; side: 1 | -1 };

/** The veer, in degrees off the tangent. Three overlapping ramps: out to 18,
 *  half back to 12 — the tentative part, which is what "trying" looks like —
 *  and then out through 30 to 40 and held. Deviation crosses 30 at t = 15.3,
 *  which is what starts the ring. */
export const devAt = (t: number) =>
  18 * smoothstep(clamp01(t / 6)) -
  6 * smoothstep(clamp01((t - 7) / 4)) +
  28 * smoothstep(clamp01((t - 10) / 9));

/** The speed it keeps while it veers: the stream's, decaying almost to nothing,
 *  so it slides out of the flow and then only creeps. */
const VEER_DECAY = 22;
const VEER_FLOOR = 0.035;
/** How far past the corridor's own edge a subject ends up. */
const EDGE_OUT = 90;
export const SUB_GAIN: number[] = [];

export const SUBJECTS: Subject[] = [];

/** Every subject's whole path, integrated once. It moves ALONG ITS OWN HEADING,
 *  so its tail can never disagree with its motion — cut 1's rule. */
export type SubState = { x: number; y: number; hd: number; tone: number; r: number; dev: number };
export const SUB_PATH: SubState[][] = [];

// ---------------------------------------------------------------------------
// THE CHAIN. Nine beads on a thread, anchored in world space where the comet
// was when it started thinking, curling away from the spine. The comet then
// creeps INTO it and absorbs the beads it reaches.
// ---------------------------------------------------------------------------
export const N_BEADS = 9;
export const BEAD_MUL = 0.75; // x the comet's radius...
/** ...with a floor in world px, because a bead has to be legible at the widest
 *  camera and the three subjects are on different tiers: the smallest of them
 *  would otherwise resolve at 5.6 screen px against the set's 8 px bar. */
export const BEAD_MIN = 9;
export const PITCH_MUL = 2.8; // x the comet's radius
const CURL = (80 * Math.PI) / 180; // total turn over the chain's length
const CURL_P = 1.4; // ...distributed so the curvature grows away from the comet
export const BEAD_GAP = 3; // frames between one bead and the next
export const BEAD_POP = 5; // frames a bead takes to appear

export type Chain = {
  sub: number;
  born: number; // the frame the first bead appears
  ax: number; // the anchor: where the comet was, and which way it faced
  ay: number;
  hd: number;
  r: number;
  pts: { x: number; y: number }[]; // bead centres, 0..N_BEADS-1
};
export const CHAINS: Chain[] = [];

/** The chain's own curve, sampled: it leaves along the comet's veered heading
 *  and turns away from the spine, faster the further out it gets. */
export const chainPoints = (ax: number, ay: number, hd: number, side: number, pitch: number) => {
  const L = N_BEADS * pitch;
  const out: { x: number; y: number }[] = [];
  let x = ax;
  let y = ay;
  const step = 1;
  let next = pitch;
  for (let s = 0; s <= L + step; s += step) {
    if (s >= next - 1e-9 && out.length < N_BEADS) {
      out.push({ x, y });
      next += pitch;
    }
    const th = hd + side * CURL * Math.pow(s / L, CURL_P);
    x += Math.cos(th) * step;
    y += Math.sin(th) * step;
  }
  while (out.length < N_BEADS) out.push({ x, y });
  return out;
};

export const beadBorn = (c: Chain, n: number) => c.born + n * BEAD_GAP;

export const subAt = (j: number, f: number): SubState => {
  const path = SUB_PATH[j];
  const F0 = Math.min(0, SUBJECTS[j].t0);
  const i = Math.max(0, Math.min(path.length - 1, Math.round(f - F0)));
  return path[i];
};

// ---------------------------------------------------------------------------
// Everything above is built here, once, in order: the subjects' paths, then the
// chains that hang off them, then the pocket that clears the grey around them.
// ---------------------------------------------------------------------------
// SUBJECTS 1 AND 2 ARE ABOVE THE RIDE, not beside it. The brief asks for one in
// tier 2 and one in tier 1 on the other side; tier 1 is where the ridden subject
// is, and at the ride's k 1.4-1.7 the frame covers roughly arcs 1500-2700, so
// anything in tier 1 is in frame from f0 and its ring is cut by the frame edge —
// which is exactly what the first build did. They are therefore both placed
// ABOVE the ride's window, one in tier 2 and one at the tier 2/3 boundary on the
// other side of the spine, so neither is in frame at all until the pull-back
// lifts them in from the top.
const SUB_PICK: { arc: number; side: 1 | -1; t0: number }[] = [
  { arc: 2180, side: 1, t0: 6 }, // the one the camera rides
  { arc: 2960, side: 1, t0: -74 }, // tier 2, already ringed when it is found
  { arc: 3260, side: -1, t0: -100 }, // the other side of the spine, higher still
];

(() => {
  for (const pick of SUB_PICK) {
    // the seat nearest that arc, on that side, out toward the corridor's edge
    let best = 0;
    let score = Infinity;
    STRIP.forEach((p, i) => {
      if (Math.sign(p.d) !== pick.side) return;
      // the arc it is at when it STARTS veering, not at f0: two of the three
      // began long before the cut, and after t0 a subject barely moves, so this
      // is where it will be sitting when the camera finds it
      const a = arcOf(p, pick.t0);
      if (a < 1200 || a > 4200) return;
      const q = Math.abs(a - pick.arc) + Math.abs(Math.abs(p.d) - 0.78 * D_BASE) * 1.4;
      if (q < score) {
        score = q;
        best = i;
      }
    });
    SUBJECTS.push({ seat: best, t0: pick.t0, side: pick.side });
  }

  SUBJECTS.forEach((sg) => {
    const p = STRIP[sg.seat];
    const base0 = seatState(p, sg.t0);
    const hd0 = base0.hd;
    // THE EXCURSION IS CAPPED. A subject has to read as PEELING OFF the stream,
    // not as a separate object standing beside it, so its whole veer is scaled
    // by one gain solved so that on the last frame it sits at the corridor's own
    // local edge plus EDGE_OUT. Uncapped they finished 200-400 px out and the
    // three of them read as three objects in the grey.
    const edge = D_BASE * lateralMul(base0.s, D_BASE);
    const target = edge + EDGE_OUT;
    const run = (gain: number) => {
      const path: SubState[] = [];
      let x = base0.x;
      let y = base0.y;
      const F0 = Math.min(0, sg.t0);
      for (let f = F0; f <= DURATION + 1; f++) {
        if (f <= sg.t0) {
          const b = seatState(p, f);
          path.push({ x: b.x, y: b.y, hd: b.hd, tone: 1, r: b.r, dev: 0 });
          x = b.x;
          y = b.y;
          continue;
        }
        const t = f - sg.t0;
        const dev = (devAt(t) * Math.PI) / 180;
        const devMid = (devAt(t - 0.5) * Math.PI) / 180;
        const hdMid = hd0 + sg.side * devMid;
        const v =
          gain *
          STREAM_V *
          speedMul(base0.s) *
          (VEER_FLOOR + (1 - VEER_FLOOR) * (1 - smoothstep(clamp01((t - 0.5) / VEER_DECAY))));
        x += Math.cos(hdMid) * v;
        y += Math.sin(hdMid) * v;
        path.push({
          x,
          y,
          hd: hd0 + sg.side * dev,
          tone: 1 - smoothstep(clamp01(t / 16)),
          r: base0.r,
          dev,
        });
      }
      return path;
    };
    const perp = (q: SubState) => {
      const c = curveAt(base0.s);
      return Math.abs((q.x - c.x) * -c.ty + (q.y - c.y) * c.tx);
    };
    const a = run(1);
    const d0 = Math.abs(p.d);
    const got = perp(a[a.length - 1]);
    const gain = Math.max(0.15, Math.min(1, (target - d0) / Math.max(1, got - d0)));
    SUB_PATH.push(run(gain));
    SUB_GAIN.push(gain);
  });


  // the chains, anchored where each comet was when it started thinking
  const BORN = [34, 34 - 74 + 6, 34 - 100 + 6];
  SUBJECTS.forEach((sg, j) => {
    const at = subAt(j, BORN[j]);
    const pitch = PITCH_MUL * at.r;
    CHAINS.push({
      sub: j,
      born: BORN[j],
      ax: at.x,
      ay: at.y,
      hd: at.hd,
      r: at.r,
      pts: chainPoints(at.x, at.y, at.hd, sg.side, pitch),
    });
  });
})();


/** How far along its chain a subject has crept, in world px. Slow: 1.5 bead
 *  pitches by the last frame. */
export const creepAt = (j: number, f: number) => {
  const c = CHAINS[j];
  const t = f - (c.born + N_BEADS * BEAD_GAP);
  if (t <= 0) return 0;
  return PITCH_MUL * c.r * 1.0 * clamp01(t / 90);
};

/** The ring: cut 2's rule, on this comet's own radius, triggered by the veer. */
export const RING_MUL = 2.3 * 2; // x the comet's radius, cut 2's
const RING_DRAW = 10;
export const RING_START = SUBJECTS.map((sg) => {
  for (let f = sg.t0; f <= DURATION; f += 0.5) {
    if (subAt(SUBJECTS.indexOf(sg), f).dev > (30 * Math.PI) / 180) return f;
  }
  return Infinity;
});
export const ringU = (j: number, f: number) => clamp01((f - RING_START[j]) / RING_DRAW);

// ---------------------------------------------------------------------------
// THE POCKET. A chain has to lie in clear grey or it is just more orange. The
// seats that would pass within CHAIN_CLEAR of any bead, or of a subject, at any
// point in the cut are not seated — once, statically, at strip level, as cut 3
// does it. The swept tube is thin, so it costs a dozen seats out of 597.
// ---------------------------------------------------------------------------
/** How much clear grey a chain needs: a seat is dropped only if its own disc
 *  would actually overlap a bead or a ring with less than half a bead's radius
 *  of daylight. At 2.6 it dropped 35 seats and the density assertion failed in
 *  the tiers the chains cross. */
const CHAIN_CLEAR = 1.5;
export const POCKET: number[] = (() => {
  const drop = new Set<number>();
  const subs = new Set(SUBJECTS.map((s) => s.seat));
  const marks: { x: number; y: number; r: number }[] = [];
  CHAINS.forEach((c, j) => {
    for (const b of c.pts) marks.push({ x: b.x, y: b.y, r: c.r });
    for (let f = 0; f <= DURATION; f += 6) {
      const a = subAt(j, f);
      marks.push({ x: a.x, y: a.y, r: a.r });
    }
  });
  STRIP_EXT.forEach((p, i) => {
    if (i >= STRIP.length && subs.has(i - STRIP.length)) return;
    for (let f = 0; f <= DURATION; f += 4) {
      const q = seatState(p, f);
      for (const m of marks) {
        if (Math.hypot(q.x - m.x, q.y - m.y) < CHAIN_CLEAR * m.r + q.r) {
          drop.add(i);
          return;
        }
      }
    }
  });
  return [...drop];
})();
const DROPPED = new Set(POCKET);

// ---------------------------------------------------------------------------
// THE CAMERA — cut 3's construction: keyed per frame off `camEase`, cy from the
// eased k, both axes through the shared damper, and the pan's target blended on
// to the ridden subject over the middle with the damper's own lead added.
// ---------------------------------------------------------------------------
const K_OPEN = 1.42;
const K_RIDE = 1.7;
const K_CHAIN = 1.35;
const F_RIDE_TOP = 30;
const F_CHAIN = 68;
const F_OUT = 104;
const TRACK_F1 = DURATION + 16;
const RIDE_IN: [number, number] = [4, 14];
const RIDE_OUT: [number, number] = [40, 62];
const RIDE_LEAD = 0.468 / 0.09;
/** The subject is held here rather than at the content centre, so the chain has
 *  the frame below and ahead of it to grow into. */
const HOLD_Y = 965;
/** ...and the subject is held HERE on screen, not at the content centre: the
 *  stream then fills the left of the frame and the chain grows into the right.
 *  The first build held it at the centre and jammed the stream against the left
 *  edge with two thirds of the frame empty. */
const HOLD_X = 417;

type KSeg = { f0: number; f1: number; k0: number; k1: number; warp: number };
const kTrack = (segs: KSeg[]) => {
  const K: number[] = new Array(TRACK_F1 + 1).fill(segs[0].k0);
  segs.forEach((s, i) => {
    if (i > 0 && segs[i - 1].f1 !== s.f0) throw new Error("camera: k segments must meet");
    for (let f = s.f0; f <= Math.min(TRACK_F1, s.f1); f++) {
      K[f] = s.k0 + (s.k1 - s.k0) * camEase((f - s.f0) / (s.f1 - s.f0), s.warp);
    }
    for (let f = s.f1 + 1; f <= TRACK_F1; f++) K[f] = s.k1;
  });
  return K;
};
const K_SEGS = (kEnd: number): KSeg[] => [
  { f0: 0, f1: F_RIDE_TOP, k0: K_OPEN, k1: K_RIDE, warp: 0.95 },
  { f0: F_RIDE_TOP, f1: F_CHAIN, k0: K_RIDE, k1: K_CHAIN, warp: 1.0 },
  { f0: F_CHAIN, f1: F_OUT, k0: K_CHAIN, k1: kEnd, warp: 0.9 },
  { f0: F_OUT, f1: TRACK_F1, k0: kEnd, k1: kEnd - 0.01, warp: 0.5 },
];

const dampX = (upto: number, F: number[], CXT: number[], K: number[]) =>
  runCamera(upto, F, CXT, K).cy;

const panTrack = (fx: number, fy: number, K: number[]) => {
  const F: number[] = [];
  const CXT: number[] = [];
  const CC: number[] = [];
  const start = subAt(0, 0);
  const lead = CHAINS[0].pts[N_BEADS - 1];
  for (let f = 0; f <= TRACK_F1; f++) {
    // the authored path: on to the subject, then out to the chain's tip, then
    // to the resting centre
    let ax: number;
    let ay: number;
    if (f <= F_CHAIN) {
      const g = camEase(f / F_CHAIN, 0.95);
      const mid = subAt(0, F_CHAIN);
      ax = start.x + (mid.x + (lead.x - mid.x) * 0.45 - start.x) * g;
      ay = start.y + (mid.y + (lead.y - mid.y) * 0.45 - start.y) * g;
    } else if (f <= F_OUT) {
      const g = camEase((f - F_CHAIN) / (F_OUT - F_CHAIN), 0.95);
      const mid = subAt(0, F_CHAIN);
      const m0x = mid.x + (lead.x - mid.x) * 0.45;
      const m0y = mid.y + (lead.y - mid.y) * 0.45;
      ax = m0x + (fx - m0x) * g;
      ay = m0y + (fy - m0y) * g;
    } else {
      const g = camEase((f - F_OUT) / (TRACK_F1 - F_OUT), 0.5);
      ax = fx + 7 * g;
      ay = fy - 9 * g;
    }
    const w =
      smoothstep(clamp01((f - RIDE_IN[0]) / (RIDE_IN[1] - RIDE_IN[0]))) *
      (1 - smoothstep(clamp01((f - RIDE_OUT[0]) / (RIDE_OUT[1] - RIDE_OUT[0]))));
    const r = subAt(0, f);
    const rn = subAt(0, f + 1);
    // the hold point is HOLD_Y on screen, i.e. the content centre lifted
    // the camera centre that puts the subject at (HOLD_X, HOLD_Y) on screen,
    // mirrored if the subject is on the other side of the spine
    const sgn = SUBJECTS[0].side;
    const offX = (sgn * (CX - HOLD_X)) / K[f];
    const offY = (960 - HOLD_Y) / K[f];
    const tx2 = r.x + (rn.x - r.x) * RIDE_LEAD + offX;
    const ty2 = r.y + (rn.y - r.y) * RIDE_LEAD + offY;
    F.push(f);
    CXT.push(ax + (tx2 - ax) * w);
    CC.push(ay + (ty2 - ay) * w);
  }
  return { F, CX: CXT, CY: CC.map((c, f) => c + CAM_LIFT / K[f]) };
};

const trackOf = (kEnd: number, fx: number, fy: number) => {
  const K = kTrack(K_SEGS(kEnd));
  const c = panTrack(fx, fy, K);
  return { F: c.F, K, CX: c.CX, CY: c.CY };
};

// ---------------------------------------------------------------------------
// THE RESOLVED FRAME: the three subjects with their rings and their whole
// chains, plus the stretch of ladder they hang off.
// ---------------------------------------------------------------------------
const BAND = { x0: 90, x1: 990, y0: 220, y1: 1400 };
const S_SHOW_LO = 1950;
const S_SHOW_HI = 3250;

const FRAMING = (() => {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  const add = (x: number, y: number, m: number) => {
    minX = Math.min(minX, x - m);
    maxX = Math.max(maxX, x + m);
    minY = Math.min(minY, y - m);
    maxY = Math.max(maxY, y + m);
  };
  for (let s = S_SHOW_LO; s <= S_SHOW_HI; s += 6) {
    const c = curveAt(s);
    const w = D_BASE * lateralMul(s, D_BASE) + DOT_R * radiusMul(s);
    for (const sgn of [-1, 1]) add(c.x + -c.ty * sgn * w, c.y + c.tx * sgn * w, 0);
  }
  CHAINS.forEach((c, j) => {
    for (const b of c.pts) add(b.x, b.y, Math.max(BEAD_MUL * c.r, BEAD_MIN) + STROKE / 2);
    const a = subAt(j, DURATION - 1);
    add(a.x, a.y, RING_MUL * a.r + STROKE / 2);
  });
  const k = Math.min((BAND.x1 - BAND.x0) / (maxX - minX), (BAND.y1 - BAND.y0) / (maxY - minY));
  return { k, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 };
})();

export const K_REST = FRAMING.k;
const F_SOLVE = 102;

export const K_END = (() => {
  const at = (kEnd: number) => {
    const t = trackOf(kEnd, FRAMING.cx, FRAMING.cy);
    return runCamera(F_SOLVE, t.F, t.CY, t.K).k;
  };
  const a = K_REST * 0.7;
  const b = K_REST * 1.1;
  return a + ((K_REST - at(a)) * (b - a)) / (at(b) - at(a));
})();

const CENTRE_END = (() => {
  const cyAt = (fy: number) => {
    const t = trackOf(K_END, FRAMING.cx, fy);
    const c = runCamera(F_SOLVE, t.F, t.CY, t.K);
    return c.cy - CAM_LIFT / c.k;
  };
  const a = FRAMING.cy - 400;
  const b = FRAMING.cy + 400;
  const fy = a + ((FRAMING.cy - cyAt(a)) * (b - a)) / (cyAt(b) - cyAt(a));
  const cxAt = (fx: number) => dampX(F_SOLVE, ...(() => {
    const t = trackOf(K_END, fx, fy);
    return [t.F, t.CX, t.K] as [number[], number[], number[]];
  })());
  const p = FRAMING.cx - 400;
  const q = FRAMING.cx + 400;
  const fx = p + ((FRAMING.cx - cxAt(p)) * (q - p)) / (cxAt(q) - cxAt(p));
  return { fx, fy };
})();

export const CAM = trackOf(K_END, CENTRE_END.fx, CENTRE_END.fy);

const CAM_AT_F: { cx: number; cy: number; k: number }[] = (() => {
  const out: { cx: number; cy: number; k: number }[] = [];
  for (let f = 0; f <= DURATION + 2; f++) {
    const c = runCamera(f, CAM.F, CAM.CY, CAM.K);
    const x = dampX(f, CAM.F, CAM.CX, CAM.K);
    const d = sway(f);
    out.push({ cx: x + d.dx, cy: c.cy + d.dy, k: c.k });
  }
  return out;
})();
export const CAM_AT = (f: number) => CAM_AT_F[Math.max(0, Math.min(DURATION + 2, Math.round(f)))];
export const SCREEN_AT = (f: number, wx: number, wy: number) => {
  const c = CAM_AT(f);
  return [CX + (wx - c.cx) * c.k, FRAME_H / 2 + (wy - c.cy) * c.k];
};

// ---------------------------------------------------------------------------

export const worldAt = (f: number): Drawn[] => {
  const out: Drawn[] = [];
  const subs = new Set(SUBJECTS.map((s) => s.seat));
  STRIP_EXT.forEach((p, i) => {
    if (DROPPED.has(i)) return;
    if (i >= STRIP.length && subs.has(i - STRIP.length)) return;
    const now = seatState(p, f);
    const was = seatState(p, f - 1);
    out.push({ ...now, key: p.key, vx: now.x - was.x, vy: now.y - was.y });
  });
  SUBJECTS.forEach((_s, j) => {
    const now = subAt(j, f);
    const was = subAt(j, f - 1);
    out.push({
      key: `s${j}`,
      x: now.x,
      y: now.y,
      r: now.r,
      tone: now.tone,
      hd: now.hd,
      s: 0,
      vx: now.x - was.x,
      vy: now.y - was.y,
    });
  });
  return out;
};

/** A bead's drawn radius at frame f: it pops in, and shrinks away again if the
 *  comet creeping up the chain reaches it. */
export const beadR = (j: number, n: number, f: number) => {
  const c = CHAINS[j];
  const born = beadBorn(c, n);
  const grow = smoothstep(clamp01((f - born) / BEAD_POP));
  if (grow <= 0) return 0;
  const pitch = PITCH_MUL * c.r;
  const eaten = clamp01((creepAt(j, f) - n * pitch) / (pitch * 0.5) + 1);
  return Math.max(BEAD_MUL * c.r, BEAD_MIN) * grow * (1 - smoothstep(eaten));
};

const ChainOfThought: React.FC<Props> = ({
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
}) => {
  const frame = useCurrentFrame();

  const cam = runCamera(frame, CAM.F, CAM.CY, CAM.K);
  const camX = dampX(frame, CAM.F, CAM.CX, CAM.K);
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = camX + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);

  const world = worldAt(frame);
  const toRipe = makeTone(accentDeep, accent);
  const spine = spinePath(0, 3900);

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <GridBackground
        src={backgroundSrc}
        blur={backgroundBlur}
        dim={backgroundDim}
        frame={W0 + frame}
        cy={cy}
        cyRest={CAM.CY[0]}
        cx={cx}
        cxRest={CAM.CX[0]}
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
            width: FRAME_W,
            height: FRAME_H,
            transformOrigin: "0 0",
            transform: `translate(${tx}px, ${ty}px) scale(${k})`,
          }}
        >
          <svg
            width={FRAME_W}
            height={FRAME_H}
            viewBox={`0 0 ${FRAME_W} ${FRAME_H}`}
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          >
            {world.map((d) => {
              const p = cometPath(d);
              return p ? (
                <path key={d.key} d={p} fill={toRipe(d.tone)} opacity={dotOpacity} />
              ) : null;
            })}

            {/* the chains of thought: thread first, then the beads on it */}
            {CHAINS.map((c, j) => {
              const sub = subAt(j, frame);
              const segs: React.ReactNode[] = [];
              for (let n = 0; n < N_BEADS; n++) {
                const u = clamp01((frame - beadBorn(c, n)) / BEAD_POP);
                if (u <= 0) continue;
                const a = n === 0 ? { x: sub.x, y: sub.y } : c.pts[n - 1];
                const b = c.pts[n];
                segs.push(
                  <line
                    key={`t${j}-${n}`}
                    x1={a.x}
                    y1={a.y}
                    x2={a.x + (b.x - a.x) * u}
                    y2={a.y + (b.y - a.y) * u}
                    stroke={accent}
                    strokeWidth={STROKE / 2}
                    strokeLinecap="round"
                    opacity={dotOpacity}
                  />,
                );
              }
              return (
                <g key={`c${j}`}>
                  {segs}
                  {c.pts.map((b, n) => {
                    const r = beadR(j, n, frame);
                    return r > 0.05 ? (
                      <circle
                        key={`b${j}-${n}`}
                        cx={b.x}
                        cy={b.y}
                        r={r}
                        fill={accent}
                        opacity={dotOpacity}
                      />
                    ) : null;
                  })}
                </g>
              );
            })}

            <g style={{ filter: icon }}>
              <path
                d={spine.d}
                fill="none"
                stroke={ink}
                strokeWidth={STROKE}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={SPINE_OPACITY}
              />

              {TIERS.map((t, i) => {
                const c = curveAt(t.s);
                const h = tickHalf(i);
                return (
                  <line
                    key={`k${i}`}
                    x1={c.x + c.ty * h}
                    y1={c.y - c.tx * h}
                    x2={c.x - c.ty * h}
                    y2={c.y + c.tx * h}
                    stroke={ink}
                    strokeWidth={STROKE}
                    strokeLinecap="round"
                    opacity={SPINE_OPACITY}
                  />
                );
              })}

              {/* we see it: one ring per subject, drawn on by its own veer */}
              {SUBJECTS.map((_s, j) => {
                const u = ringU(j, frame);
                if (u <= 0) return null;
                const p = subAt(j, frame);
                const R = RING_MUL * p.r;
                const c = 2 * Math.PI * R;
                const a0 =
                  (Math.atan2(p.y - curveAt(0).y, p.x - curveAt(0).x) * 180) / Math.PI + 180;
                return (
                  <circle
                    key={`r${j}`}
                    cx={p.x}
                    cy={p.y}
                    r={R}
                    fill="none"
                    stroke={ink}
                    strokeWidth={STROKE}
                    strokeLinecap="round"
                    strokeDasharray={c}
                    strokeDashoffset={c * (1 - u)}
                    transform={`rotate(${a0.toFixed(1)} ${p.x.toFixed(2)} ${p.y.toFixed(2)})`}
                    opacity={SPINE_OPACITY}
                  />
                );
              })}
            </g>
          </svg>
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default ChainOfThought;

export const STATS = {
  duration: DURATION,
  w0: W0,
  fStrip: F_STRIP,
  subjects: SUBJECTS.map((s, j) => ({
    seat: s.seat,
    t0: s.t0,
    side: s.side,
    arc0: Math.round(arcOf(STRIP[s.seat], 0)),
    d0: Math.round(STRIP[s.seat].d),
    ringStart: Number(RING_START[j].toFixed(1)),
    ringClosed: Number((RING_START[j] + RING_DRAW).toFixed(1)),
    chainBorn: CHAINS[j].born,
    chainDone: beadBorn(CHAINS[j], N_BEADS - 1) + BEAD_POP,
    r: Number(CHAINS[j].r.toFixed(1)),
  })),
  dev: [0, 6, 11, 15, 21, 26, 40].map((t) => [t, Number(devAt(t).toFixed(1))]),
  beadR: CHAINS.map((c) => Number(Math.max(BEAD_MUL * c.r, BEAD_MIN).toFixed(2))),
  pitch: Number((PITCH_MUL * CHAINS[0].r).toFixed(1)),
  pocket: POCKET.length,
  strip: STRIP_EXT.length - POCKET.length - SUBJECTS.length,
  kOpen: K_OPEN,
  kRide: K_RIDE,
  kRest: Number(K_REST.toFixed(4)),
  kEnd: Number(K_END.toFixed(4)),
  kTrack: [0, 9, 19, 28, 36, 44, 55, 61, 66, 80, 95, 102, 117].map((f) => [
    f,
    Number(CAM_AT(f).k.toFixed(3)),
  ]),
};
