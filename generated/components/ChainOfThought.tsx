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
  hash,
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
//
// ---------------------------------------------------------------------------
// THE VARIANTS (`variant`, default `plural` = everything above, untouched).
//
// `skull`   The same cut, and every chain of thought ends in a skull: what the
//           thought is FOR. Subject 0's is drawn by its own ninth bead and
//           completes on "they"; the other two were finished long before the
//           camera found them. The pull-back is re-solved on a box that now
//           holds three skulls as well, and has to start 12 frames earlier
//           (SK_F_CHAIN) or the same travel is crammed into the same frames.
//           The skulls are 150 world px, which lands them at 88 screen px at
//           the resolution against a ring's 94 — deliberately the same order of
//           presence, and as large as they can be before the wider box they
//           force pushes the resolved k back down again.
//           MEASURED: |dv| 2.239 at f63, peak |v| 35.3. Everything inside
//           50..1030 / 50..1400 from f98; f101+ bbox x 92..990, y 315..1235.
//           Closest the crowd, a tick or a ring comes to a skull outline:
//           229 world px, against the 40 asked for.
//
// `follow`  The second idea: no plural and no pull-back. The chain keeps
//           growing — 26 beads at the delivered size and pitch — and the CAMERA
//           GOES WITH IT, out of the corridor into open grey, PUSHING IN rather
//           than pulling back: k 1.70 -> 1.90, so a bead is 35 screen px and
//           sixteen of them span the frame. The stream, the spine and the
//           ringed comet are gone by f66. The last bead is born at f88 and IT
//           calls the skull, which is 170 world px — 324 on screen, a third of
//           the frame's width — and completes at f98 on "deceptive stuff",
//           landing centred on (541, 820).
//           MEASURED: |dv| 2.493 at f59, peak |v| 42.9, the tip never crosses
//           the frame faster than 17 px. Nothing of chain or skull is below
//           y 1400 from f60 (lowest on-screen point y 1230 at f89).
//           The bead rate is 2.08 f, slower than the 1.81 the first pass used,
//           because at k 1.9 the tip already travels 31 screen px a frame and
//           the camera has to keep up inside the 45 px cap.
// ---------------------------------------------------------------------------

export const schema = z.object({
  /** Which cut this is. `plural` is the delivered cut and is untouched by the
   *  other two: every number it reads is computed by the same expressions in
   *  the same order as before the variants existed. */
  variant: z.enum(["plural", "skull", "follow"]),
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
  variant: "plural",
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
// THE SKULL (variants `skull` and `follow` only).
//
// Lucide's `skull`, outline, drawn in ACCENT because it is the AI's intent and
// orange is the AI throughout this clip — white ink stays OURS (the spine, the
// ticks, the rings). No package ships lucide here, so the geometry is the
// published path, checked by rasterising it large and looking at it: cranium,
// jaw, two socket circles and the nose triangle.
//
// It is CAUSED BY THE CHAIN, not timed: it starts drawing when the chain's last
// bead is 60% grown, it begins at the point of its own outline nearest that
// bead, and the thread stops at the outline rather than running under it. The
// sockets and the nose come last, so the face arrives after the shape does.
// ---------------------------------------------------------------------------
export const SKULL_OUTLINE =
  "M15 22a1 1 0 0 0 1-1v-1a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20v1a1 1 0 0 0 1 1z";
export const SKULL_NOSE = "m12.5 17-.5-1-.5 1h1z";
export const SKULL_EYES = [
  { cx: 9, cy: 12, r: 1 },
  { cx: 15, cy: 12, r: 1 },
];
/** The icon's box in world px. At the resolved k of either variant this lands
 *  between 70 and 100 screen px across — the set's glyph size. */
/** The icon's box in world px. The plural cut's three sit beside rings, so they
 *  are sized to hold their own against one; `follow` has a single skull as the
 *  whole resolved frame and carries a bigger one. */
export const SKULL_BOX = 150;
export const SKULL_BOX_FOL = 170;
const sOf = (box: number) => box / 24;
/** Daylight between the last bead and the skull's outline. */
const SKULL_GAP = 26;
/** How long the outline takes to draw, and where the face falls inside that. */
const SKULL_DRAW = 14;
/** `follow` draws faster: its skull is called by the last bead at f86 and has to
 *  be complete on "deceptive stuff". */
const SKULL_DRAW_FOL = 10;
const SK_FACE = 0.76; // the outline owns 0..0.76 of the draw, the face the rest

type P2 = { x: number; y: number };

/** SVG endpoint-parametrised circular arc -> points. Only what the two paths
 *  above need: equal radii, no x-rotation. */
const arcPts = (p0: P2, p1: P2, r: number, fA: number, fS: number, n: number): P2[] => {
  const x1 = (p0.x - p1.x) / 2;
  const y1 = (p0.y - p1.y) / 2;
  let R = r;
  const lam = (x1 * x1 + y1 * y1) / (R * R);
  if (lam > 1) R *= Math.sqrt(lam);
  const den = R * R * y1 * y1 + R * R * x1 * x1;
  const num = Math.max(0, R * R * R * R - den);
  const co = (fA !== fS ? 1 : -1) * Math.sqrt(num / den);
  const cx1 = (co * R * y1) / R;
  const cy1 = (-co * R * x1) / R;
  const cx = cx1 + (p0.x + p1.x) / 2;
  const cy = cy1 + (p0.y + p1.y) / 2;
  const ang = (ux: number, uy: number, vx: number, vy: number) => {
    const d = (ux * vx + uy * vy) / (Math.hypot(ux, uy) * Math.hypot(vx, vy));
    const a = Math.acos(Math.max(-1, Math.min(1, d)));
    return ux * vy - uy * vx < 0 ? -a : a;
  };
  const th0 = ang(1, 0, (x1 - cx1) / R, (y1 - cy1) / R);
  let dth = ang((x1 - cx1) / R, (y1 - cy1) / R, (-x1 - cx1) / R, (-y1 - cy1) / R);
  if (!fS && dth > 0) dth -= 2 * Math.PI;
  if (fS && dth < 0) dth += 2 * Math.PI;
  const out: P2[] = [];
  for (let i = 1; i <= n; i++) {
    const t = th0 + dth * (i / n);
    out.push({ x: cx + R * Math.cos(t), y: cy + R * Math.sin(t) });
  }
  return out;
};

/** The outline as a polyline in icon units, with the cumulative fraction of
 *  total length at each vertex — which is what `pathLength={1}` means in the
 *  dash, so a fraction here IS a dash offset there. */
const SKULL_POLY: { p: P2; u: number }[] = (() => {
  const o: P2[] = [{ x: 15, y: 22 }];
  o.push(...arcPts({ x: 15, y: 22 }, { x: 16, y: 21 }, 1, 0, 0, 8));
  o.push({ x: 16, y: 20 });
  o.push(...arcPts({ x: 16, y: 20 }, { x: 17.56, y: 16.75 }, 2, 0, 0, 14));
  o.push(...arcPts({ x: 17.56, y: 16.75 }, { x: 6.44, y: 16.75 }, 8, 1, 0, 140));
  o.push(...arcPts({ x: 6.44, y: 16.75 }, { x: 8, y: 20 }, 2, 0, 0, 14));
  o.push({ x: 8, y: 21 });
  o.push(...arcPts({ x: 8, y: 21 }, { x: 9, y: 22 }, 1, 0, 0, 8));
  o.push({ x: 15, y: 22 });
  let L = 0;
  const cum = [0];
  for (let i = 1; i < o.length; i++) {
    L += Math.hypot(o[i].x - o[i - 1].x, o[i].y - o[i - 1].y);
    cum.push(L);
  }
  return o.map((p, i) => ({ p, u: cum[i] / L }));
})();

const SK_C = (() => {
  let x0 = Infinity;
  let x1 = -Infinity;
  let y0 = Infinity;
  let y1 = -Infinity;
  for (const q of SKULL_POLY) {
    x0 = Math.min(x0, q.p.x);
    x1 = Math.max(x1, q.p.x);
    y0 = Math.min(y0, q.p.y);
    y1 = Math.max(y1, q.p.y);
  }
  return { x: (x0 + x1) / 2, y: (y0 + y1) / 2, hw: (x1 - x0) / 2, hh: (y1 - y0) / 2 };
})();
/** The outline's world half-extent — used for framing and for clearance. */
export const skullR = (box: number) => Math.hypot(SK_C.hw, SK_C.hh) * sOf(box) + STROKE / 2;
export const SKULL_R = skullR(SKULL_BOX);

/** Distance from the icon's centre out to the outline along `th`, icon units. */
const skullReach = (th: number) => {
  let best = 0;
  let score = Infinity;
  for (const q of SKULL_POLY) {
    const a = Math.atan2(q.p.y - SK_C.y, q.p.x - SK_C.x);
    let d = Math.abs(a - th);
    if (d > Math.PI) d = 2 * Math.PI - d;
    if (d < score) {
      score = d;
      best = Math.hypot(q.p.x - SK_C.x, q.p.y - SK_C.y);
    }
  }
  return best;
};

export type SkullMark = {
  x: number; // world centre
  y: number;
  u0: number; // the frame the draw starts
  phase: number; // where on the outline it starts, as a fraction of its length
  tx: number; // where the thread must stop: the outline point nearest the bead
  ty: number;
  box: number; // this skull's own size in world px
  r: number; // ...and its half-extent, stroke included
};

/** Put a skull ahead of a chain's last bead, along the chain's end tangent, so
 *  that the outline — not the centre — sits SKULL_GAP past the bead. */
const placeSkull = (tip: P2, dir: number, u0: number, box: number): SkullMark => {
  const S = sOf(box);
  const back = dir + Math.PI;
  const d = SKULL_GAP + skullReach(back) * S;
  const x = tip.x + Math.cos(dir) * d;
  const y = tip.y + Math.sin(dir) * d;
  let phase = 0;
  let tx = x;
  let ty = y;
  let score = Infinity;
  for (const q of SKULL_POLY) {
    const wx = x + (q.p.x - SK_C.x) * S;
    const wy = y + (q.p.y - SK_C.y) * S;
    const s = Math.hypot(wx - tip.x, wy - tip.y);
    if (s < score) {
      score = s;
      phase = q.u;
      tx = wx;
      ty = wy;
    }
  }
  return { x, y, u0, phase, tx, ty, box, r: skullR(box) };
};

/** The draw, 0..1, and the three stages inside it. */
export const skullU = (m: SkullMark, f: number) =>
  clamp01((f - m.u0) / (m.box === SKULL_BOX_FOL ? SKULL_DRAW_FOL : SKULL_DRAW));
const skullStage = (u: number) => ({
  line: clamp01(u / SK_FACE),
  nose: clamp01((u - SK_FACE) / ((1 - SK_FACE) * 0.55)),
  eyes: clamp01((u - SK_FACE - (1 - SK_FACE) * 0.35) / ((1 - SK_FACE) * 0.65)),
});

// ---------------------------------------------------------------------------
// VARIANT `skull`: the delivered cut, and each of the three chains ends in one.
// Subject 0's is caused by its ninth bead (born f58, 60% grown f61), so it
// draws f61-75 and completes on "they". The other two were finished long before
// the camera found them, so they are simply there when it does.
// ---------------------------------------------------------------------------
export const SK_MARKS: SkullMark[] = CHAINS.map((c, j) => {
  const a = c.pts[N_BEADS - 1];
  const b = c.pts[N_BEADS - 2];
  const dir = Math.atan2(a.y - b.y, a.x - b.x);
  const u0 = beadBorn(c, N_BEADS - 1) + BEAD_POP * 0.6;
  return placeSkull(a, dir, u0, SKULL_BOX);
});

// ---------------------------------------------------------------------------
// VARIANT `follow`: no plural and no pull-back. One comet, one chain, and the
// camera leaves the flow line with it.
//
// The chain is the delivered one continued: the same bead size, the same pitch,
// the same birth rule, and — because 110 degrees spread as sigma^1 gives 4.1
// degrees over the first bead where the delivered chain's 80 degrees as
// sigma^1.4 gave 4.0 — the same opening curl. Past that it is one constant-
// curvature sweep: monotone, no inflection, no loop, 100 degrees over its whole
// length, ending 810 world px from where the comet started thinking and a long
// way clear of the corridor.
// ---------------------------------------------------------------------------
export const FOL_N = 26;
/** 2.08 f per bead. Slower than the delivered chain's 3 because this one is
 *  five times as long, and no faster than that because at k 1.9 the tip already
 *  crosses 31 screen px a frame and the camera has to keep up inside the 45 px
 *  cap. The last bead is born at f86 and IT is what calls the skull. */
export const FOL_GAP = (88 - 34) / (FOL_N - 1);
const FOL_TURN = (110 * Math.PI) / 180;
/** ...distributed so the last third descends harder: the chain then enters from
 *  the upper left and comes DOWN into the skull instead of running flat. */
const FOL_TURN_P = 1;
export const FOL_CHAIN: Chain = (() => {
  const c = CHAINS[0];
  const pitch = PITCH_MUL * c.r;
  const L = FOL_N * pitch;
  const pts: P2[] = [];
  let x = c.ax;
  let y = c.ay;
  let next = pitch;
  for (let s = 0; s <= L + 1; s += 1) {
    if (s >= next - 1e-9 && pts.length < FOL_N) {
      pts.push({ x, y });
      next += pitch;
    }
    const th = c.hd + SUBJECTS[0].side * FOL_TURN * Math.pow(s / L, FOL_TURN_P);
    x += Math.cos(th);
    y += Math.sin(th);
  }
  while (pts.length < FOL_N) pts.push({ x, y });
  return { ...c, pts };
})();
export const folBorn = (n: number) => FOL_CHAIN.born + n * FOL_GAP;
export const FOL_MARK: SkullMark = (() => {
  const a = FOL_CHAIN.pts[FOL_N - 1];
  const b = FOL_CHAIN.pts[FOL_N - 2];
  return placeSkull(
    a,
    Math.atan2(a.y - b.y, a.x - b.x),
    folBorn(FOL_N - 1),
    SKULL_BOX_FOL,
  );
})();

/** The chain stays alive after it lands: every bead on its own small hashed
 *  wander, the thread following it. Nothing pulses and nothing glows. */
const FOL_WANDER = 2.5;
export const folBead = (n: number, f: number): P2 => {
  const b = FOL_CHAIN.pts[n];
  const a = FOL_WANDER * clamp01((f - folBorn(n) - BEAD_POP) / 20);
  const p1 = 41 + 23 * hash(n, 7);
  const p2 = 57 + 31 * hash(n, 13);
  return {
    x: b.x + a * Math.sin(((f + 60 * hash(n, 3)) / p1) * 2 * Math.PI),
    y: b.y + a * Math.sin(((f + 60 * hash(n, 5)) / p2) * 2 * Math.PI),
  };
};

export const folBeadR = (n: number, f: number) => {
  const grow = smoothstep(clamp01((f - folBorn(n)) / BEAD_POP));
  if (grow <= 0) return 0;
  const pitch = PITCH_MUL * FOL_CHAIN.r;
  const eaten = clamp01((creepAt(0, f) - n * pitch) / (pitch * 0.5) + 1);
  return Math.max(BEAD_MUL * FOL_CHAIN.r, BEAD_MIN) * grow * (1 - smoothstep(eaten));
};

// ---------------------------------------------------------------------------
// THE VARIANTS' POCKETS. Same rule as the delivered one, plus: nothing of the
// crowd, and no tick, may come within SKULL_CLEAR of a skull. In `follow` the
// chain walks out of the corridor almost at once, so its pocket is small.
// ---------------------------------------------------------------------------
const SKULL_CLEAR = 40;
const pocketWith = (marks: { x: number; y: number; r: number }[], subs: Set<number>) => {
  const drop = new Set<number>();
  STRIP_EXT.forEach((p, i) => {
    if (i >= STRIP.length && subs.has(i - STRIP.length)) return;
    for (let f = 0; f <= DURATION; f += 4) {
      const q = seatState(p, f);
      for (const m of marks) {
        if (Math.hypot(q.x - m.x, q.y - m.y) < m.r + q.r) {
          drop.add(i);
          return;
        }
      }
    }
  });
  return drop;
};

const SKULL_MARKS_AS_DISCS = (ms: SkullMark[]) =>
  ms.map((m) => ({ x: m.x, y: m.y, r: m.r + SKULL_CLEAR }));

const POCKET_SKULL = (() => {
  const subs = new Set(SUBJECTS.map((s) => s.seat));
  const marks: { x: number; y: number; r: number }[] = [];
  CHAINS.forEach((c, j) => {
    for (const b of c.pts) marks.push({ x: b.x, y: b.y, r: CHAIN_CLEAR * c.r });
    for (let f = 0; f <= DURATION; f += 6) {
      const a = subAt(j, f);
      marks.push({ x: a.x, y: a.y, r: CHAIN_CLEAR * a.r });
    }
  });
  marks.push(...SKULL_MARKS_AS_DISCS(SK_MARKS));
  return pocketWith(marks, subs);
})();

const POCKET_FOLLOW = (() => {
  const subs = new Set([SUBJECTS[0].seat]);
  const marks: { x: number; y: number; r: number }[] = [];
  for (const b of FOL_CHAIN.pts) marks.push({ x: b.x, y: b.y, r: CHAIN_CLEAR * FOL_CHAIN.r });
  for (let f = 0; f <= DURATION; f += 6) {
    const a = subAt(0, f);
    marks.push({ x: a.x, y: a.y, r: CHAIN_CLEAR * a.r });
  }
  marks.push(...SKULL_MARKS_AS_DISCS([FOL_MARK]));
  return pocketWith(marks, subs);
})();

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
const K_SEGS = (kEnd: number, fChain = F_CHAIN, fOut = F_OUT): KSeg[] => [
  { f0: 0, f1: F_RIDE_TOP, k0: K_OPEN, k1: K_RIDE, warp: 0.95 },
  { f0: F_RIDE_TOP, f1: fChain, k0: K_RIDE, k1: K_CHAIN, warp: 1.0 },
  { f0: fChain, f1: fOut, k0: K_CHAIN, k1: kEnd, warp: 0.9 },
  { f0: fOut, f1: TRACK_F1, k0: kEnd, k1: kEnd - 0.01, warp: 0.5 },
];

const dampX = (upto: number, F: number[], CXT: number[], K: number[]) =>
  runCamera(upto, F, CXT, K).cy;

const panTrack = (fx: number, fy: number, K: number[], fChain = F_CHAIN, fOut = F_OUT) => {
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
    if (f <= fChain) {
      const g = camEase(f / fChain, 0.95);
      const mid = subAt(0, fChain);
      ax = start.x + (mid.x + (lead.x - mid.x) * 0.45 - start.x) * g;
      ay = start.y + (mid.y + (lead.y - mid.y) * 0.45 - start.y) * g;
    } else if (f <= fOut) {
      const g = camEase((f - fChain) / (fOut - fChain), 0.95);
      const mid = subAt(0, fChain);
      const m0x = mid.x + (lead.x - mid.x) * 0.45;
      const m0y = mid.y + (lead.y - mid.y) * 0.45;
      ax = m0x + (fx - m0x) * g;
      ay = m0y + (fy - m0y) * g;
    } else {
      const g = camEase((f - fOut) / (TRACK_F1 - fOut), 0.5);
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

const trackOf = (kEnd: number, fx: number, fy: number, fChain = F_CHAIN, fOut = F_OUT) => {
  const K = kTrack(K_SEGS(kEnd, fChain, fOut));
  const c = panTrack(fx, fy, K, fChain, fOut);
  return { F: c.F, K, CX: c.CX, CY: c.CY };
};

// ---------------------------------------------------------------------------
// THE RESOLVED FRAME: the three subjects with their rings and their whole
// chains, plus the stretch of ladder they hang off.
// ---------------------------------------------------------------------------
const BAND = { x0: 90, x1: 990, y0: 220, y1: 1400 };
const S_SHOW_LO = 1950;
const S_SHOW_HI = 3250;

const framingOf = (extra: { x: number; y: number; m: number }[]) => {
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
  for (const e of extra) add(e.x, e.y, e.m);
  const k = Math.min((BAND.x1 - BAND.x0) / (maxX - minX), (BAND.y1 - BAND.y0) / (maxY - minY));
  return { k, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 };
};

/** The delivered framing: no extra points, so every expression below runs on
 *  exactly the values it ran on before the variants existed. */
const FRAMING = framingOf([]);
const F_SOLVE = 102;

/** The two-secant solve, lifted out of the delivered cut unchanged so that the
 *  skull variant — which only hands it a wider box — gets the same treatment. */
const solveCam = (fr: { k: number; cx: number; cy: number }, fChain = F_CHAIN, fOut = F_OUT) => {
  const kRest = fr.k;
  const kEnd = (() => {
    const at = (ke: number) => {
      const t = trackOf(ke, fr.cx, fr.cy, fChain, fOut);
      return runCamera(F_SOLVE, t.F, t.CY, t.K).k;
    };
    const a = kRest * 0.7;
    const b = kRest * 1.1;
    return a + ((kRest - at(a)) * (b - a)) / (at(b) - at(a));
  })();
  const centre = (() => {
    const cyAt = (fy: number) => {
      const t = trackOf(kEnd, fr.cx, fy, fChain, fOut);
      const c = runCamera(F_SOLVE, t.F, t.CY, t.K);
      return c.cy - CAM_LIFT / c.k;
    };
    const a = fr.cy - 400;
    const b = fr.cy + 400;
    const fy = a + ((fr.cy - cyAt(a)) * (b - a)) / (cyAt(b) - cyAt(a));
    const cxAt = (fx: number) =>
      dampX(F_SOLVE, ...(() => {
        const t = trackOf(kEnd, fx, fy, fChain, fOut);
        return [t.F, t.CX, t.K] as [number[], number[], number[]];
      })());
    const p = fr.cx - 400;
    const q = fr.cx + 400;
    const fx = p + ((fr.cx - cxAt(p)) * (q - p)) / (cxAt(q) - cxAt(p));
    return { fx, fy };
  })();
  return { kRest, kEnd, CAM: trackOf(kEnd, centre.fx, centre.fy, fChain, fOut) };
};

const SOLVED = solveCam(FRAMING);
export const K_REST = SOLVED.kRest;
export const K_END = SOLVED.kEnd;
export const CAM = SOLVED.CAM;

type Track = { F: number[]; K: number[]; CX: number[]; CY: number[] };
const camAtOf = (t: Track) => {
  const out: { cx: number; cy: number; k: number }[] = [];
  for (let f = 0; f <= DURATION + 2; f++) {
    const c = runCamera(f, t.F, t.CY, t.K);
    const x = dampX(f, t.F, t.CX, t.K);
    const d = sway(f);
    out.push({ cx: x + d.dx, cy: c.cy + d.dy, k: c.k });
  }
  return out;
};

const CAM_AT_F = camAtOf(CAM);
export const CAM_AT = (f: number) => CAM_AT_F[Math.max(0, Math.min(DURATION + 2, Math.round(f)))];
export const SCREEN_AT = (f: number, wx: number, wy: number) => {
  const c = CAM_AT(f);
  return [CX + (wx - c.cx) * c.k, FRAME_H / 2 + (wy - c.cy) * c.k];
};

// ---------------------------------------------------------------------------
// VARIANT `skull` — the same pull-back, re-solved on a box that now has to hold
// three skulls as well as three rings and three chains. Nothing else about the
// camera changes: same segments, same warps, same ride.
// ---------------------------------------------------------------------------
/** The skulls put half again as much in the box, so the pull-back has to start
 *  earlier or the same travel is crammed into the same frames and the settle
 *  breaks the |dv| budget. */
const SK_F_CHAIN = 56;
const FRAMING_SK = framingOf(SK_MARKS.map((m) => ({ x: m.x, y: m.y, m: m.r + 15 })));
const SOLVED_SK = solveCam(FRAMING_SK, SK_F_CHAIN, F_OUT);
export const K_END_SK = SOLVED_SK.kEnd;
export const CAM_SK = SOLVED_SK.CAM;
const CAM_SK_F = camAtOf(CAM_SK);
export const CAM_SK_AT = (f: number) => CAM_SK_F[Math.max(0, Math.min(DURATION + 2, Math.round(f)))];

// ---------------------------------------------------------------------------
// VARIANT `follow` — the camera leaves WITH the chain. One long C1 glide out of
// the ride: k eases 1.70 -> 1.25 over f30-96 in a single segment, and the pan
// hands over from the ridden comet to the chain's growing TIP over f34-52, so
// the stream, the spine and the ringed comet slide out behind us. The tip is
// led by the damper's own lead plus a fixed reach along the chain, so the chain
// always grows into open frame rather than into the edge; as the last bead
// lands the look point becomes the skull's own centre, which is where the glide
// settles — screen (540, 800).
// ---------------------------------------------------------------------------
const FOL_K_END = 1.9;
const FOL_F_SET = 96;
const FOL_HAND: [number, number] = [34, 50];
/** How long the join vector takes to decay. */
const FOL_CORR = 30;
const FOL_LOOK_Y = 771;
/** ...and the x that lands it on the frame axis once the damper has caught up. */
const FOL_LOOK_X = 467;
/** How far along the chain, past the newest bead, the camera looks. */
const FOL_TIP_LEAD = 2; // x the bead pitch

/** Smootherstep. `smoothstep` has a non-zero SECOND derivative at its ends, so
 *  blending two far-apart camera targets with it puts a kink at each end of the
 *  blend — |dv| 3.4 at f72, right where the handover finished. This one is zero
 *  in the first AND second derivative at both ends, so the joins vanish. */
const ease5 = (u: number) => {
  const t = clamp01(u);
  return t * t * t * (t * (t * 6 - 15) + 10);
};

const FOL_K = (() => {
  const segs: KSeg[] = [
    { f0: 0, f1: F_RIDE_TOP, k0: K_OPEN, k1: K_RIDE, warp: 0.95 },
    { f0: F_RIDE_TOP, f1: FOL_F_SET, k0: K_RIDE, k1: FOL_K_END, warp: 1.2 },
    // the creep-in: 2.4%, still moving on the last frame
    { f0: FOL_F_SET, f1: TRACK_F1, k0: FOL_K_END, k1: FOL_K_END * 1.024, warp: 0.5 },
  ];
  return kTrack(segs);
})();

/** Where the chain has reached at f. It samples the chain's own SMOOTH curve by
 *  arc length, not the bead polyline: the polyline has a corner at every bead,
 *  and a camera that looks at a corner accelerates through it — the first build
 *  did exactly that and rang up |dv| 4.6 in the middle of the glide. */
const FOL_CURVE: P2[] = (() => {
  const c = CHAINS[0];
  const pitch = PITCH_MUL * c.r;
  const L = FOL_N * pitch;
  const out: P2[] = [];
  let x = c.ax;
  let y = c.ay;
  for (let s = 0; s <= L + 2; s += 1) {
    out.push({ x, y });
    const th = c.hd + SUBJECTS[0].side * FOL_TURN * Math.pow(s / L, FOL_TURN_P);
    x += Math.cos(th);
    y += Math.sin(th);
  }
  return out;
})();
/** HOW FAR ALONG THE CHAIN THE CAMERA IS LOOKING, in world px, per frame.
 *
 *  The obvious version — blend from the ride's target to the tip's — cannot be
 *  made to work: the two targets separate at 19 world px a frame, so the blend's
 *  own second derivative times a separation that reaches 700 px puts |dv| at
 *  3.4 whatever easing is used, and lengthening the blend only trades that
 *  against the stream staying in frame. So there is NO blend of positions. The
 *  camera looks along the chain from the first frame it leaves, and what eases
 *  is the RATE: it starts at zero (matching the ride, where the comet has all
 *  but stopped), rises to the chain's own growth rate over FOL_EASE frames, and
 *  the integral deficit that costs is added back on the same curve — so the
 *  look point is C1 at the join AND exactly on the tip once the ease is done.
 *  At the far end the same trick runs in reverse: the rate eases back to zero
 *  as the chain finishes, instead of hitting the end and stopping dead. */
const FOL_EASE = 34;
/** ...and the window the resulting deficit is handed back over, which is longer
 *  than the ramp because its cost goes as 1/W^2 while the deficit only goes as
 *  E: separating the two is what brought |dv| from 3.57 to inside the bar. */
const FOL_BACK = 88;
const FOL_S: number[] = (() => {
  const pitch = PITCH_MUL * FOL_CHAIN.r;
  const g = pitch / FOL_GAP; // world px of chain per frame
  const sMax = (FOL_N - 1) * pitch;
  const out: number[] = [];
  let acc = 0;
  for (let f = 0; f <= TRACK_F1; f++) {
    if (f > FOL_CHAIN.born) acc += g * ease5((f - 1 - FOL_CHAIN.born) / FOL_EASE);
    // the deficit the rate-ramp cost, AND the reach past the newest bead, both
    // handed in on the same curve — so at the join the camera is looking at the
    // comet itself and the correction vector it has to carry is only the
    // difference between the two framings, not a chain's length of travel.
    const back = (g * FOL_EASE) / 2 + pitch * FOL_TIP_LEAD;
    const raw = acc + back * ease5((f - FOL_CHAIN.born) / FOL_BACK);
    const u = Math.max(0, raw) / sMax;
    out.push(sMax * (u < 0.66 ? u : 0.66 + 0.34 * (1 - Math.exp(-(u - 0.66) / 0.34))));
  }
  return out;
})();
export const folTipAt = (f: number) => {
  const s = FOL_S[Math.max(0, Math.min(TRACK_F1, Math.round(f)))];
  const i = Math.max(0, Math.min(FOL_CURVE.length - 2, s));
  const i0 = Math.floor(i);
  const t = i - i0;
  const a = FOL_CURVE[i0];
  const b = FOL_CURVE[i0 + 1];
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
};

const FOL_TRACK: Track = (() => {
  const F: number[] = [];
  const CXT: number[] = [];
  const CYT: number[] = [];
  const RX: number[] = [];
  const RY: number[] = [];
  const FX: number[] = [];
  const FY: number[] = [];
  const start = subAt(0, 0);
  const lead = CHAINS[0].pts[N_BEADS - 1];
  for (let f = 0; f <= TRACK_F1; f++) {
    const k = FOL_K[f];
    // the ride, exactly as delivered
    const g = camEase(Math.min(1, f / F_CHAIN), 0.95);
    const mid = subAt(0, F_CHAIN);
    const ax = start.x + (mid.x + (lead.x - mid.x) * 0.45 - start.x) * g;
    const ay = start.y + (mid.y + (lead.y - mid.y) * 0.45 - start.y) * g;
    const w = smoothstep(clamp01((f - RIDE_IN[0]) / (RIDE_IN[1] - RIDE_IN[0])));
    const r = subAt(0, f);
    const rn = subAt(0, f + 1);
    const sgn = SUBJECTS[0].side;
    const rx = r.x + (rn.x - r.x) * RIDE_LEAD + (sgn * (CX - HOLD_X)) / k;
    const ry = r.y + (rn.y - r.y) * RIDE_LEAD + (960 - HOLD_Y) / k;
    const ridex = ax + (rx - ax) * w;
    const ridey = ay + (ry - ay) * w;
    // ...and the chain, which we leave with
    const land = ease5((f - (FOL_F_SET - 26)) / 54);
    const tip = folTipAt(f);
    const lx = tip.x + (FOL_MARK.x - tip.x) * land;
    const ly = tip.y + (FOL_MARK.y - tip.y) * land;
    F.push(f);
    RX.push(ridex);
    RY.push(ridey);
    FX.push(lx + (CX - FOL_LOOK_X) / k);
    FY.push(ly + (960 - FOL_LOOK_Y) / k);
  }
  // THE JOIN. Up to FOL_HAND the ride, exactly as delivered; after it the chain,
  // plus the one constant vector that made the two agree at the join, decaying
  // on a curve that is flat in the first and second derivative at both ends. So
  // the camera changes what it is following without changing where it is or how
  // fast it is going, and the only |dv| the change costs is that 42 px vector
  // spread over FOL_CORR frames.
  const j = FOL_HAND[0];
  const cx0 = RX[j] - FX[j];
  const cy0 = RY[j] - FY[j];
  for (let f = 0; f <= TRACK_F1; f++) {
    const d = 1 - ease5((f - j) / FOL_CORR);
    const x = f <= j ? RX[f] : FX[f] + cx0 * d;
    const y = f <= j ? RY[f] : FY[f] + cy0 * d;
    CXT.push(x);
    CYT.push(y + CAM_LIFT / FOL_K[f]);
  }
  return { F, K: FOL_K, CX: CXT, CY: CYT };
})();

const FOL_F = camAtOf(FOL_TRACK);
export const FOL_AT = (f: number) => FOL_F[Math.max(0, Math.min(DURATION + 2, Math.round(f)))];

export const CAM_OF = (v: Props["variant"]) =>
  v === "skull" ? CAM_SK : v === "follow" ? FOL_TRACK : CAM;
export const AT_OF = (v: Props["variant"]) =>
  v === "skull" ? CAM_SK_AT : v === "follow" ? FOL_AT : CAM_AT;
export const SCREEN_OF = (v: Props["variant"], f: number, wx: number, wy: number) => {
  const c = AT_OF(v)(f);
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

/** The same crowd for a variant: its own pocket, and in `follow` only the one
 *  subject exists at all. */
export const worldOf = (v: Props["variant"], f: number): Drawn[] => {
  if (v === "plural") return worldAt(f);
  const dropped = v === "skull" ? POCKET_SKULL : POCKET_FOLLOW;
  const keep = v === "skull" ? SUBJECTS.length : 1;
  const subs = new Set(SUBJECTS.slice(0, keep).map((s) => s.seat));
  const out: Drawn[] = [];
  STRIP_EXT.forEach((p, i) => {
    if (dropped.has(i)) return;
    if (i >= STRIP.length && subs.has(i - STRIP.length)) return;
    const now = seatState(p, f);
    const was = seatState(p, f - 1);
    out.push({ ...now, key: p.key, vx: now.x - was.x, vy: now.y - was.y });
  });
  for (let j = 0; j < keep; j++) {
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
  }
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

/** One skull, upright on screen, drawing on. `pathLength={1}` puts the dash in
 *  fractions of the outline's own length, so `phase` — the fraction nearest the
 *  bead that caused it — is simply a negative dash offset, and the stroke opens
 *  from there and wraps. The wrapper carries the icon shadow so the scale group
 *  does not scale the blur. */
const SkullGlyph: React.FC<{
  m: SkullMark;
  u: number;
  accent: string;
  opacity: number;
  icon: string;
}> = ({ m, u, accent, opacity, icon }) => {
  if (u <= 0) return null;
  const st = skullStage(u);
  const dash = (v: number) => ({
    pathLength: 1,
    strokeDasharray: `${v} ${Math.max(1e-4, 1 - v)}`,
    strokeDashoffset: -m.phase,
  });
  return (
    <g style={{ filter: icon }}>
      <g
        transform={`translate(${m.x.toFixed(2)} ${m.y.toFixed(2)}) scale(${sOf(
          m.box,
        )}) translate(${(-SK_C.x).toFixed(3)} ${(-SK_C.y).toFixed(3)})`}
        fill="none"
        stroke={accent}
        strokeWidth={STROKE / sOf(m.box)}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={opacity}
      >
        <path d={SKULL_OUTLINE} {...dash(st.line)} />
        {st.nose > 0 ? (
          <path d={SKULL_NOSE} pathLength={1} strokeDasharray={`${st.nose} ${1 - st.nose}`} />
        ) : null}
        {st.eyes > 0
          ? SKULL_EYES.map((e, i) => (
              <circle
                key={`e${i}`}
                cx={e.cx}
                cy={e.cy}
                r={e.r}
                pathLength={1}
                strokeDasharray={`${st.eyes} ${1 - st.eyes}`}
                strokeDashoffset={-0.25}
              />
            ))
          : null}
      </g>
    </g>
  );
};

const ChainOfThought: React.FC<Props> = ({
  variant,
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

  const T = CAM_OF(variant);
  const cam = runCamera(frame, T.F, T.CY, T.K);
  const camX = dampX(frame, T.F, T.CX, T.K);
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = camX + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);

  const world = worldOf(variant, frame);
  const toRipe = makeTone(accentDeep, accent);
  const spine = spinePath(0, 3900);
  const nSubs = variant === "follow" ? 1 : SUBJECTS.length;

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <GridBackground
        src={backgroundSrc}
        blur={backgroundBlur}
        dim={backgroundDim}
        frame={W0 + frame}
        cy={cy}
        cyRest={T.CY[0]}
        cx={cx}
        cxRest={T.CX[0]}
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

            {/* `follow`: one comet, one long chain, every bead on its own
                small wander once it has settled, the thread following it, and
                the last link running out to the skull's outline. */}
            {variant === "follow"
              ? (() => {
                  const sub = subAt(0, frame);
                  const at = (n: number) => folBead(n, frame);
                  const segs: React.ReactNode[] = [];
                  for (let n = 0; n < FOL_N; n++) {
                    const u = clamp01((frame - folBorn(n)) / BEAD_POP);
                    if (u <= 0) continue;
                    const a = n === 0 ? { x: sub.x, y: sub.y } : at(n - 1);
                    const b = at(n);
                    segs.push(
                      <line
                        key={`ft${n}`}
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
                  const sk = skullU(FOL_MARK, frame);
                  const tipB = at(FOL_N - 1);
                  return (
                    <g>
                      {segs}
                      {sk > 0 ? (
                        <line
                          x1={tipB.x}
                          y1={tipB.y}
                          x2={tipB.x + (FOL_MARK.tx - tipB.x) * clamp01(sk / 0.25)}
                          y2={tipB.y + (FOL_MARK.ty - tipB.y) * clamp01(sk / 0.25)}
                          stroke={accent}
                          strokeWidth={STROKE / 2}
                          strokeLinecap="round"
                          opacity={dotOpacity}
                        />
                      ) : null}
                      {FOL_CHAIN.pts.map((_b, n) => {
                        const r = folBeadR(n, frame);
                        const q = at(n);
                        return r > 0.05 ? (
                          <circle
                            key={`fb${n}`}
                            cx={q.x}
                            cy={q.y}
                            r={r}
                            fill={accent}
                            opacity={dotOpacity}
                          />
                        ) : null;
                      })}
                    </g>
                  );
                })()
              : null}

            {/* the chains of thought: thread first, then the beads on it */}
            {variant === "follow"
              ? null
              : CHAINS.map((c, j) => {
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
              const sk = variant === "skull" ? skullU(SK_MARKS[j], frame) : 0;
              const tipB = c.pts[N_BEADS - 1];
              return (
                <g key={`c${j}`}>
                  {segs}
                  {sk > 0 ? (
                    <line
                      x1={tipB.x}
                      y1={tipB.y}
                      x2={tipB.x + (SK_MARKS[j].tx - tipB.x) * clamp01(sk / 0.25)}
                      y2={tipB.y + (SK_MARKS[j].ty - tipB.y) * clamp01(sk / 0.25)}
                      stroke={accent}
                      strokeWidth={STROKE / 2}
                      strokeLinecap="round"
                      opacity={dotOpacity}
                    />
                  ) : null}
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

            {/* the skulls, drawn by the chain that caused them */}
            {variant === "skull"
              ? SK_MARKS.map((m, j) => (
                  <SkullGlyph
                    key={`sk${j}`}
                    m={m}
                    u={skullU(m, frame)}
                    accent={accent}
                    opacity={dotOpacity}
                    icon={icon}
                  />
                ))
              : null}
            {variant === "follow" ? (
              <SkullGlyph
                m={FOL_MARK}
                u={skullU(FOL_MARK, frame)}
                accent={accent}
                opacity={dotOpacity}
                icon={icon}
              />
            ) : null}

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
              {SUBJECTS.slice(0, nSubs).map((_s, j) => {
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
