import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { ACCENT, CanvasDots, DARK, INK, INK_CONTEXT, NumeralLabel, PlanPage, WorldSvg, swayCam, type Cam, type DotLayer, type P2 } from "./incaShared";
import { DEAD_OP, RULE_CASE, RULE_W, RULE_W_ORANGE, TICK_HALF } from "./kdMotion";
import {
  A2,
  CO_R,
  COMPANY,
  FATE,
  FPS,
  GROUND_Y,
  HEAP_PLOT,
  HOST,
  HOST_R,
  HOST_X0,
  LABEL168,
  LIVE_OP,
  MARK_R,
  NUM_SIZE,
  N_RIDERS,
  PLOT,
  RIDER_IDX,
  ZERO_LABEL,
  breath,
  hostAt,
  label168Op,
  pageCam,
  pageOpeningCam,
  riderAt,
} from "./pageMotion";

export const DURATION = A2.DURATION;
export { FPS, pageOpeningCam };

// ---------------------------------------------------------------------------
// AgainstAlmostHundredThousand (A2). Dwarkesh Patel with Si Sheppard, clip
// "Sheppard_Cajamarca_infinite_KD": Pizarro at Cajamarca, 16 Nov 1532.
//   "100 something against almost 100,000. What is astonishing is that these
//    100 conquistadors kill close to 10,000 of the enemy. They suffer zero
//    casualties. This is the first encounter."
// DWARKESH MAP STYLE, the KdRatioOfInfinity page: the Peru world's umber page
// (incaShared PlanPage), KdRatioOfInfinity's world (kdMotion: the ground at
// y 930, the heap's plot x 102-470 and the orange plot x 610-978 with their
// engraved end ticks, the 10,000 heap slots), the cream ground running on to
// the left under the host. 1 dot = 1 man; cream = the Inca, orange = Pizarro's
// side; the dead = KdRatioOfInfinity's dead look (cream 0.26, 1.66 px at k 1).
// Opaque 1080x1920, 24 fps. Geometry, fates and camera: pageMotion.ts.
//
// TIMELINE. In-point 7.54 s on the edit timeline; f = round((t - 7.54) * 24):
//   100 f0 · something f8 · against f17 · almost f32 · 100,000 f40 (ends f57) ·
//   What f61 · astonishing f67 · that f93 · these f96 · 100 f101 ·
//   conquistadors f105 · KILL f119 · close f128 · 10,000 f136 · of f149 ·
//   ENEMY f156 (ends f161) · They f165 · suffer f169 · ZERO f174 · casualties
//   f180 (ends f191) · This f191 · first f200 · ENCOUNTER f205 (ends f216).
// DURATION = 216 + the 16-frame house tail = 232 frames (f0..f231).
//
// THE GESTURES (one continuous motion; each starts before its word):
//   1. "100 something" f0: close (k 3) on the company of 168 standing as a
//      hand-set orange block on its plot (18 files x 10 ranks, rounded
//      corners), centred on (540, 835), "168" standing under it (C2 landed
//      it); the camera already creeping out (pageOpeningCam, valid from f-91:
//      C2 hands over to it).
//   2. "against almost 100,000" f2-f46: one eased pull-back (k 3 -> 0.42, zoom
//      peak 6.4 %/f) with the pan left and down (x f14-f56, y f18-f62; the
//      anchor <= 25.9 px/f, the company <= 17.3 px/f): the vast cream host
//      revealed across the frame, overflowing the left edge, a stipple
//      (densest tone ~0.59), its right flank ragged and feathered (knots of men,
//      stragglers ahead of it, never a cliff face); the company a small orange
//      block at x ~820-868. The wides sit low: the ground at y ~1000 from ~f60
//      (the host's own centre of mass ~y 875-919, the frame's lower half no
//      longer empty), easing to KdRatioOfInfinity's y 930 by f172. "168"
//      drops to the context rung and fades out (f4-f28).
//   3. "What is astonishing is that" f46-f96: a held breath, a ~4 % creep in;
//      the host breathes (~0.3 px drift per man); nothing new.
//   4. "these 100 conquistadors" f86-f115: one push-in to k 0.8 (lands ~f114),
//      framing the host's near flank to the company, the ground at y 1000.
//   5. "kill" f99-f166: the 62 riders (the company's front files) leave the
//      block as a compact low wedge along the ground (three dots high, nose
//      leading), gallop left over the gap and the heap's plot and plunge into
//      the BASE of the host's flank (the nose under the flank's foot ~f118,
//      furthest in at x ~171 on f133.5), wheel (the wedge closes and reopens
//      nose-right) and gallop back along the ground into their own slots by
//      f166 (<= 21.1 screen px/f; never above the ground's first three dots,
//      asserted); the 106 foot hold the block. The undercut: a man dies when
//      the nose has passed under his column, the higher the later (the slump
//      climbs a column at 42 px/f, and runs on 24 px/f past the turn): the base
//      falls first and the men above slide down after them into the heap
//      (accelerating, a little out toward the cut), like an undercut sand bank.
//      Each of the 10,000 lands in the heap slot below where he stood (the slots
//      filled lowest first by the nearest reached man over them: at most 12 px
//      sideways) and eases to the dead look as he slides. Kills f118.1-f139.4;
//      all 10,000 have landed by f150.9, before "enemy" (asserted). The kill zone
//      held 14,406. As the slump's wave reaches them the living fall back: the
//      whole mound withdraws, its front backing off to a new uneven, leaning
//      flank, each man at his own depth and pace behind it (a feathered edge,
//      no rim), a few stragglers left ahead of it who keep trickling away. The
//      heap is left standing alone where the flank was.
//   6. f152-f174: one eased move to k 1.0, KdRatioOfInfinity's framing (the
//      plots centred on x 540, the ground at y 930). "zero" f174: "0" slides up
//      under the orange plot in KdRatioOfInfinity's exact place, landing on
//      f174. Every orange man is standing.
//   7. "This is the first encounter" f186-f231: a slow eased pull-back (-8 %
//      f191 -> f231, with a 14 px drift right), still moving on f231; the host
//      keeps withdrawing, the foot of its flank and its stragglers just visible
//      leaving at the left edge.
// Nothing else: no trails, flashes, rings, glows, arrows, red, crosses, text.
//
// CAMERA (pageMotion: velocity bumps on ln k and on the world point held at
// (540, 835); C1; the house sway on top): zoom peak 6.4 %/f (the pull-back);
// the anchor <= 25.9 px/f; the company (the subject) <= 17.3 px/f, |dv| <=
// 2.31 px/f^2. The probe grid's corners (zoom flow, ~700 px from the anchor)
// reach 71 px/f and 6.9 px/f^2 in the 7x pull-back and 48 / 5.9 in the
// push-in. Zoom reversals at f46 and f194 only; the kill (f122-f150) holds
// on a 2 % creep.
// COUNTS AND SOURCES (SP/FACTS.md; never on screen except "168" and "0"):
//   168 = 62 horse + 106 foot (Hemming; Lockhart, The Men of Cajamarca). The
//     speaker says "160, 190"; Pedro Pizarro's spy counted ~190.
//   The host: 86,000 = Hemming's "nearly 80,000" + the 6,000 in the square
//     (Hernando Pizarro, letter of Nov 1533), ~ the speaker's "almost 100,000".
//   The dead: 10,000, the speaker's figure and the top of the published
//     2,000-10,000 range (Xerez 2,000; Mena 6,000-7,000; Trujillo 8,000); the
//     same heap (the same 10,000 slots) as KdRatioOfInfinity's.
//   Spanish dead: 0 (the only Spanish wound was Pizarro's hand: Hernando
//     Pizarro, Markham 1872 pp.118-119; Xerez p.55).
// ---------------------------------------------------------------------------

export const schema = z.object({
  vignette: z.number(),
  deadOpacity: z.number(),
  /** a page-time offset: render tau = frame + tauOffset (0 normally; -1 renders the opening state for the join test) */
  tauOffset: z.number(),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ vignette: 0.55, deadOpacity: DEAD_OP, tauOffset: 0 });

// ---------------------------------------------------------------------------
// THE PAGE (shared with ConquistadorsMuster)
// ---------------------------------------------------------------------------
const HOST_LAYERS = 4;
const FALL_LEVELS = 4;
const DEAD_LAYERS = 3; // KdRatioOfInfinity's stack (by heap-slot index)
/** a stroke or tick drawn at size s (screen px at k 1) scales as k^0.5 on screen */
const lineK = (k: number) => Math.pow(k, -0.5);
/** the living host's look at a zoom: resolved full-rung dots close up, a
 *  multi-layer stipple in the wide (densest areas <= ~0.7) */
export const hostLook = (k: number) => {
  const t = smooth01((Math.log(k) - Math.log(0.45)) / (Math.log(0.78) - Math.log(0.45)));
  return { r: Math.max(0.55, HOST_R * k), op: 0.8 + (LIVE_OP - 0.8) * t };
};
const smooth01 = (v: number) => {
  const x = Math.max(0, Math.min(1, v));
  return x * x * (3 - 2 * x);
};
/** the company's dot (screen px) and casing */
const coLook = (k: number) => {
  const r = Math.max(1.7, CO_R * k);
  return { r, casing: Math.min(1.1, 0.4 * r) };
};
/** the company at tau: the foot standing (breathing), the riders riding or standing */
export const companyAt = (tau: number): P2[] => {
  const out: P2[] = COMPANY.map((s, i) => {
    const [bx, by] = breath(i, tau, 7);
    return [s.x + bx, s.y + by] as P2;
  });
  for (let k = 0; k < N_RIDERS; k++) {
    const p = riderAt(k, tau);
    if (p) out[RIDER_IDX[k]] = p;
  }
  return out;
};

const plotD = (x0: number, x1: number, y: number, tick: number) =>
  `M${x0},${y - tick}L${x0},${y + tick}M${x0},${y}L${x1},${y}M${x1},${y - tick}L${x1},${y + tick}`;

export type SceneProps = {
  tau: number;
  /** the company's 168 positions (default: companyAt(tau)) */
  company?: P2[];
  /** "168": its opacity and the NumeralLabel frame / f0 (slide) */
  label168: { op: number; frame: number; f0: number };
  /** "0" (A2 only) */
  zero?: { frame: number };
  vignette: number;
  deadOpacity: number;
  /** the camera (default: A2's at tau) */
  cam?: Cam;
};
/** every layer of the page at page time tau (A2's frame) */
export const PageScene: React.FC<SceneProps> = ({ tau, company, label168, zero, vignette, deadOpacity, cam: camIn }) => {
  const cam = swayCam(camIn ?? pageCam(tau), tau);
  const k = cam.k;
  const lk = lineK(k);

  // ---- the host: living (interleaved stipple layers), falling, dead ----
  const live: number[][] = Array.from({ length: HOST_LAYERS }, () => []);
  const fall: number[][] = Array.from({ length: FALL_LEVELS }, () => []);
  const dead: number[][] = Array.from({ length: DEAD_LAYERS }, () => []);
  for (let i = 0; i < HOST.n; i++) {
    const m = hostAt(i, tau);
    if (m.state === 0) live[i % HOST_LAYERS].push(m.x, m.y);
    else if (m.state === 1) fall[Math.min(FALL_LEVELS - 1, Math.floor(m.q * FALL_LEVELS))].push(m.x, m.y);
    else dead[FATE.slot[i] % DEAD_LAYERS].push(m.x, m.y); // KdRatioOfInfinity's layer of that slot
  }
  const hl = hostLook(k);
  const deadR = MARK_R * k;
  const layers: DotLayer[] = [
    ...dead.map((xy) => ({ xy, r: deadR, color: INK, opacity: deadOpacity })),
    ...live.map((xy) => ({ xy, r: hl.r, color: INK, opacity: hl.op })),
    ...fall.map((xy, b) => {
      const q = (b + 0.5) / FALL_LEVELS;
      return { xy, r: hl.r + (deadR - hl.r) * q, color: INK, opacity: hl.op + (deadOpacity - hl.op) * q };
    }),
  ];
  // ---- the company ----
  const co = company ?? companyAt(tau);
  const cl = coLook(k);
  const coXY: number[] = [];
  for (const [x, y] of co) coXY.push(x, y);

  const tick = TICK_HALF * lk;
  return (
    <PlanPage cam={cam} vignette={vignette}>
      {/* the ground: the cream ground running on under the host, the heap's plot, the empty orange plot */}
      <WorldSvg cam={cam}>
        <defs>
          <linearGradient id="pg-runL" gradientUnits="userSpaceOnUse" x1={HOST_X0 - 900} y1={0} x2={HOST_X0 - 300} y2={0}>
            <stop offset="0" stopColor={INK} stopOpacity={0} />
            <stop offset="1" stopColor={INK} stopOpacity={INK_CONTEXT} />
          </linearGradient>
        </defs>
        <g fill="none" strokeLinecap="butt" strokeLinejoin="miter">
          <path d={`M${HOST_X0 - 900},${GROUND_Y}L${HEAP_PLOT.x0},${GROUND_Y}`} stroke={DARK} strokeOpacity={0.45} strokeWidth={(RULE_W + RULE_CASE) * lk} />
          <path d={plotD(HEAP_PLOT.x0, HEAP_PLOT.x1, GROUND_Y, tick)} stroke={DARK} strokeOpacity={0.6} strokeWidth={(RULE_W + RULE_CASE) * lk} />
          <path d={plotD(PLOT.x0, PLOT.x1, GROUND_Y, tick)} stroke={DARK} strokeOpacity={0.6} strokeWidth={(RULE_W_ORANGE + RULE_CASE) * lk} />
          <path d={`M${HOST_X0 - 900},${GROUND_Y}L${HEAP_PLOT.x0},${GROUND_Y}`} stroke="url(#pg-runL)" strokeWidth={RULE_W * lk} />
          <path d={plotD(HEAP_PLOT.x0, HEAP_PLOT.x1, GROUND_Y, tick)} stroke={INK} strokeOpacity={INK_CONTEXT} strokeWidth={RULE_W * lk} />
          <path d={plotD(PLOT.x0, PLOT.x1, GROUND_Y, tick)} stroke={ACCENT} strokeWidth={RULE_W_ORANGE * lk} />
        </g>
      </WorldSvg>

      {/* the dead, the living host, the falling */}
      <CanvasDots cam={cam} layers={layers} />
      {/* Pizarro's company */}
      <CanvasDots cam={cam} layers={[{ xy: coXY, r: cl.r, color: ACCENT, opacity: 1, casing: cl.casing }]} />

      {/* the counts */}
      {label168.op > 0.002 ? (
        <NumeralLabel
          text="168"
          x={LABEL168.x}
          y={LABEL168.y}
          dy={LABEL168.dy}
          cam={cam}
          frame={label168.frame}
          f0={label168.f0}
          size={NUM_SIZE}
          frames={14}
          fade={12}
          opacity={label168.op}
        />
      ) : null}
      {zero ? (
        <NumeralLabel text="0" x={ZERO_LABEL.x} y={ZERO_LABEL.y} cam={cam} frame={zero.frame} f0={ZERO_LABEL.f0} size={NUM_SIZE} frames={ZERO_LABEL.frames} fade={ZERO_LABEL.fade} />
      ) : null}
    </PlanPage>
  );
};

const AgainstAlmostHundredThousand: React.FC<Props> = ({ vignette, deadOpacity, tauOffset }) => {
  const frame = useCurrentFrame();
  const tau = frame + tauOffset;
  return (
    <PageScene
      tau={tau}
      label168={{ op: label168Op(tau), frame: 1000, f0: 0 }}
      zero={{ frame: tau }}
      vignette={vignette}
      deadOpacity={deadOpacity}
    />
  );
};

export default AgainstAlmostHundredThousand;
