import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { FRAME_H, FRAME_W, NumeralLabel, PlanPage, SCREEN_CX, SCREEN_CY, hash, smoothstep, swayCam, type Cam } from "./incaShared";
import { GROUND_Y, HOST, MARKS, NUM_SIZE } from "./pageMotion";
import {
  A2,
  COMPANY2,
  FATE2,
  HEAP_ORDER_A2,
  LAND_A2,
  HOST_ORDER,
  LABEL168_2,
  N_CO2,
  RIDERS2,
  ROW_DS,
  ROW_DY,
  SLOT_MAN2,
  ZERO_LABEL2,
  deadAngle,
  deadVariantOf,
  hostAt2,
  hostScale,
  incaVariant,
  label168Op2,
  ownScale,
  pageCam2,
  restOf,
  riderAt2,
  riderSlot2,
  type CoState,
} from "./pageMotionV2";
import { DEAD_ANGLES, FIG, SpriteCanvas, blit, layerCanvas, type FigKey, type HorsePose } from "./pageFigures";

export const DURATION = A2.DURATION;
export const FPS = 24;

// ---------------------------------------------------------------------------
// AgainstAlmostHundredThousandV2 (A2, V2). Dwarkesh Patel with Si Sheppard,
// clip "Sheppard_Cajamarca_infinite_KD": Pizarro at Cajamarca, 16 Nov 1532.
//   "100 something against almost 100,000. What is astonishing is that these
//    100 conquistadors kill close to 10,000 of the enemy. They suffer zero
//    casualties. This is the first encounter."
// V2 of AgainstAlmostHundredThousand (V1 untouched). The user's note on V1:
// "the line things under all the 'balls' ... unnecessary, and everything is
// maybe just a little bit too abstract". So: NO ground rules, plots or ticks
// (the masses stand on an implied common ground, their feet aligned on y 930),
// and EVERY MAN IS A SMALL ENGRAVED FIGURE (pageFigures.tsx): the Inca warrior
// in cream (llauto, chequered tunic, bare legs, star-mace or sling; 4 variants,
// a hashed +-8 % scale and +-4 deg lean), the conquistadors in orange (106 on
// foot: crested morion, breastplate, pike upright; 62 horsemen in profile with
// a lance), the dead the same warrior lying on his side at the dead tone.
// Crowds in depth: the higher a man stands in the mound the smaller (0.78x at
// the top) and the earlier he is drawn (painter's order), the nearer rows
// overlapping them; the company's rear ranks higher and smaller.
// LEVEL OF DETAIL: each man crossfades from a stipple dot (V1's look) to his
// figure as his front size (19 px x his own +-8 % x k: the recession left out,
// so the whole mound resolves together and its near rows never outshine the
// rest) grows from 9.5 to 13 px; the figure comes in before the dot goes, so
// the crowd's tone holds through the push-in. Only the wide (k ~0.42,
// f~30-f~94) resolves the host into stipple; f0-f20 and from f~100 on every
// man is a figure (at the kill framing k 1.05: the front 20 px, the top rows
// ~15.6 px).
// NO LINES: the host's near rows stand forward in uneven knots (up to ~11 px),
// and the crowd's feet are laid down a little lighter (its near rows are the
// only whole figures, so its union reads brightest along the ground); the
// lowest dead are strewn a few px in depth.
// THE HEAP (R2): one uniform pile of bodies. Every one of the 10,000 dead is
// drawn the same way, opaque at the dead tone (pageFigures DEAD_TONE, the
// cream pre-blended onto the page) with his DARK casing (0.55), in landing
// order, so later bodies lie on top and the ones underneath are occluded:
// the whole visible surface is a mosaic of toppled bodies, edge to centre,
// under a jagged silhouette of bodies; their angles spread +-55..125 deg and
// some have an arm or a leg flung out and the weapon dropped. A man just
// landed is still bright and dims onto his body over 7 f.
// Opaque 1080x1920, 24 fps. Motion: pageMotionV2.ts (on V1's pageMotion /
// kdMotion world and timeline, read-only).
//
// TIMELINE (V1's). In-point 7.54 s on the edit timeline; f = round((t - 7.54) * 24):
//   100 f0 · something f8 · against f17 · almost f32 · 100,000 f40 (ends f57) ·
//   What f61 · astonishing f67 · that f93 · these f96 · 100 f101 ·
//   conquistadors f105 · KILL f119 · close f128 · 10,000 f136 · of f149 ·
//   ENEMY f156 (ends f161) · They f165 · suffer f169 · ZERO f174 · casualties
//   f180 (ends f191) · This f191 · first f200 · ENCOUNTER f205 (ends f216).
// DURATION = 216 + the 16-frame house tail = 232 frames (f0..f231).
//
// THE GESTURES (V1's beats; one continuous motion):
//   1. "100 something" f0: close (k 2.4) on the company of 168 figures, "168"
//      standing under it (C2 landed it): the 62 horsemen in four ranks facing
//      the host (left), the 106 foot in six ranks with their pikes up (R1:
//      re-formed deeper, ~78 px tall at k 1, so at the medium and end
//      framings it reads as a band of armed men); the
//      camera already creeping out (C2 hands over to it: the join is exact).
//   2. "against almost 100,000" f2-f46: one eased pull-back (k 2.4 -> 0.42,
//      zoom peak 5.6 %/f) with the pan left and down: the vast cream host
//      revealed, a mountain-crowd of figures that resolves into stipple as it
//      shrinks below ~10 px; the company a small orange body. "168" drops to
//      the context rung and fades (f4-f28).
//   3. "What is astonishing is that" f46-f96: a held breath, a ~4 % creep in;
//      the host breathes.
//   4. "these 100 conquistadors" f84-f116: one push-in to k 1.05 (the kill
//      framing: tightened from V1's 0.8 so the host's figures stay ~16-20 px),
//      the host's near flank to the company; the stipple resolves back into
//      figures, man by man.
//   5. "kill" f99-f173: the 62 HORSEMEN gallop out as a low wedge (three rows,
//      the nose leading, each horse on his own three-pose gallop phase), over
//      the gap into the base of the host's flank (the nose under the flank's
//      foot ~f116, furthest in on f133.5), wheel (the wedge turns about its
//      middle: seen from the side each horse squeezes and flips) and gallop back
//      to the company's front, each to the free place nearest him, by f166;
//      there each turns in place to face the host again (f166-f173). The 106
//      foot hold their ranks. The undercut (V1's): a man dies when the nose
//      has passed under his column, the higher the later; each struck warrior
//      TOPPLES (rotates about his feet from upright to his lying angle while
//      his middle drops and slides into his heap slot), solid as he tumbles,
//      his raised mace or whirled sling falling with him; landed, he dims to
//      the dead tone over 7 f. The slump's front wavers (no straight crease);
//      the 10,000 have all landed by f156 ("enemy"). The living fall back: the
//      whole mound withdraws to a ragged, leaning flank, a few stragglers
//      trickling away.
//   6. f148-f176: one eased move to k 1.0 (KdRatioOfInfinityV2's framing);
//      "zero" f174: "0" slides up under the company, every orange man standing.
//   7. "This is the first encounter" f186-f231: a slow pull-back (-8 %), still
//      moving on f231: the heap of fallen warriors at left, the company at
//      right, the host's flank leaving at the left edge.
// Nothing else: no rules, plots, ticks, shadows, trails, flashes, arrows, red.
//
// COUNTS AND SOURCES (as V1; SP/FACTS.md): 168 = 62 horse + 106 foot (Hemming;
// Lockhart, The Men of Cajamarca). The host: 86,000 (Hemming's "nearly 80,000"
// + the 6,000 in the square; the speaker's "almost 100,000"). The dead: 10,000
// (the speaker's figure, the top of the published 2,000-10,000 range: Xerez
// 2,000; Mena 6,000-7,000; Trujillo 8,000). Spanish dead: 0 (Hernando
// Pizarro, Markham 1872 pp.118-119; Xerez p.55).
// ---------------------------------------------------------------------------

export const schema = z.object({
  vignette: z.number(),
  /** level of detail: below lodLo px tall a man is a dot, above lodHi a figure */
  lodLo: z.number(),
  lodHi: z.number(),
  /** a page-time offset: render tau = frame + tauOffset (0 normally; -1 renders the opening state for the join test) */
  tauOffset: z.number(),
  /** report ms / frame to the console */
  timing: z.boolean(),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ vignette: 0.55, lodLo: 9.5, lodHi: 13, tauOffset: 0, timing: false });
export type SceneOpts = Pick<Props, "lodLo" | "lodHi">;

// ---------------------------------------------------------------------------
// SPRITE KEYS (one object per key: the sprite cache is keyed by object)
// ---------------------------------------------------------------------------
const LEANS = [-1, 0, 1] as const;
/** inca keys [variant 0..5][lean + 1]: the living (crowd ink) and the struck (the heap's ink: a DARK casing) */
const INCA_KEYS: FigKey[][] = [0, 1, 2, 3, 4, 5].map((v) => LEANS.map((lean) => ({ kind: "inca", v, lean, look: "cream" }) as FigKey));
const INCA_SKIN_KEYS: FigKey[][] = [0, 1, 2, 3, 4, 5].map((v) => LEANS.map((lean) => ({ kind: "inca", v, lean, look: "cream", ink: "skin" }) as FigKey));
const leanOf = (i: number) => Math.floor(hash(i, 702) * 3) - 1; // as pageFigures.incaKey
const MAN_KEY: FigKey[] = Array.from({ length: HOST.n }, (_, i) => INCA_KEYS[incaVariant(i)][leanOf(i) + 1]);
const DEAD_KEYS = new Map<string, FigKey>();
const deadKeyOf = (v: number, a: number, ink: number): FigKey => {
  const s = `${v}_${a}_${ink}`;
  let k = DEAD_KEYS.get(s);
  if (!k) {
    k = { kind: "dead", v, a: DEAD_ANGLES.includes(a) ? a : 90, ink };
    DEAD_KEYS.set(s, k);
  }
  return k;
};
/** slot j's lying body (opaque, the dead tone) and his scale */
export const SLOT_KEY: FigKey[] = MARKS.map((_, j) => deadKeyOf(deadVariantOf(j), deadAngle(j), 0));
/** ... and as he lands in A2, still bright (the composited cream look, laid over him as he dims) */
const SLOT_FRESH_KEY: FigKey[] = MARKS.map((_, j) => deadKeyOf(deadVariantOf(j), deadAngle(j), 1));
export const SLOT_SCALE: Float32Array = Float32Array.from(MARKS.map((_, j) => ownScale(SLOT_MAN2[j])));
const FOOT_KEYS: FigKey[] = [0, 1, 2].map((pose) => ({ kind: "foot", pose }) as FigKey);
const HORSE_POSES: HorsePose[] = ["stand", "walk0", "walk1", "gallop0", "gallop1", "gallop2"];
const HORSE_KEYS = new Map<string, FigKey>(HORSE_POSES.flatMap((pose) => [true, false].map((left) => [`${pose}${left}`, { kind: "horse", pose, left } as FigKey])));
const horseKey = (pose: HorsePose, left: boolean) => HORSE_KEYS.get(`${pose}${left}`) as FigKey;

const LIVE_ALPHA = 0.94; // INK_FULL: the living
const LAND_FADE = 7; // frames a landed man takes to dim to the dead tone (A2)
const camT = (cam: Cam) => ({ k: cam.k, tx: SCREEN_CX - cam.cx * cam.k, ty: SCREEN_CY - cam.cy * cam.k });

// ---------------------------------------------------------------------------
// THE HEAP (R2): one uniform pile. Each landed body is blitted opaque (the
// dead tone pre-blended, a DARK casing) straight onto the page, in landing
// order: later bodies on top. In A2 a man just landed carries a bright
// overlay of himself that fades out over freshF frames.
// ---------------------------------------------------------------------------
export type HeapItem = { j: number; x: number; y: number; land: number };
export const drawHeap = (ctx: CanvasRenderingContext2D, cam: Cam, items: HeapItem[], t: number, freshF: number) => {
  const { k, tx, ty } = camT(cam);
  for (const it of items) {
    const sx = tx + it.x * k;
    const sy = ty + it.y * k;
    if (sx < -30 || sx > FRAME_W + 30 || sy < -30 || sy > FRAME_H + 30) continue;
    const h = FIG.dead * SLOT_SCALE[it.j] * k;
    blit(ctx, SLOT_KEY[it.j], sx, sy, h, 1);
    const age = t - it.land;
    if (freshF > 0 && age < freshF) blit(ctx, SLOT_FRESH_KEY[it.j], sx, sy, h, 0.92 * (1 - smoothstep(age / freshF)));
  }
  ctx.globalAlpha = 1;
};
/** the fraction of the living host's foot band taken out of its layer */
const HOST_FOOT_CUT = 0.4;
const HOST_LAYER = 9;
/** take a fraction of a layer out below screen y g0, ramping in to g1 */
const footCut = (lc: CanvasRenderingContext2D, g0: number, g1: number, cut: number) => {
  const gr = lc.createLinearGradient(0, g0, 0, g1);
  gr.addColorStop(0, "rgba(0,0,0,0)");
  gr.addColorStop(1, `rgba(0,0,0,${cut})`);
  lc.globalCompositeOperation = "destination-out";
  lc.globalAlpha = 1;
  lc.fillStyle = gr;
  lc.fillRect(0, g0, FRAME_W, FRAME_H - g0);
  lc.globalCompositeOperation = "source-over";
};
/** a toppling warrior: his middle at (x, y), turned rot deg about his feet;
 *  q 0..1 from the living (his own variant, lean, scale, 0.94) to the dead
 *  (his lying variant, scale and tone) */
export const drawToppling = (ctx: CanvasRenderingContext2D, cam: Cam, i: number, x: number, y: number, rot: number, q: number, scFrom: number, alpha: number) => {
  const { k, tx, ty } = camT(cam);
  const sc = scFrom + (ownScale(i) - scFrom) * q;
  const hW = FIG.inca * sc;
  const th = (rot * Math.PI) / 180;
  const fx = x - Math.sin(th) * hW * 0.5;
  const fy = y + Math.cos(th) * hW * 0.5;
  const sx = tx + fx * k;
  const sy = ty + fy * k;
  if (sx < -40 || sx > FRAME_W + 40 || sy < -40 || sy > FRAME_H + 40) return;
  const lean = leanOf(i);
  const rotDeg = rot - lean * 4 * q;
  const v = incaVariant(i);
  const dv = deadVariantOf(FATE2.slot[i]);
  // a struck man is drawn in the heap's ink (a DARK casing): tumbling bodies separate
  if (v === dv) blit(ctx, INCA_SKIN_KEYS[v][lean + 1], sx, sy, hW * k, alpha, rotDeg);
  else {
    const c = smoothstep(q / 0.7);
    blit(ctx, INCA_SKIN_KEYS[v][lean + 1], sx, sy, hW * k, alpha * (1 - c), rotDeg);
    blit(ctx, INCA_SKIN_KEYS[dv][lean + 1], sx, sy, hW * k, alpha * c, rotDeg);
  }
};

// ---------------------------------------------------------------------------
// THE COMPANY: 168 figures in painter's order (the higher, further rows first)
// ---------------------------------------------------------------------------
export type CoItem = { st: CoState; horse: boolean };
const scaleOfY = (y: number) => Math.max(0.78, Math.min(1, 1 - (ROW_DS * (GROUND_Y - y)) / ROW_DY));
export const drawCompany = (ctx: CanvasRenderingContext2D, cam: Cam, items: CoItem[]) => {
  const { k, tx, ty } = camT(cam);
  const order = items.map((_, i) => i).sort((a, b) => items[a].st.y - items[b].st.y || items[a].st.x - items[b].st.x);
  for (const n of order) {
    const { st, horse } = items[n];
    const sx = tx + st.x * k;
    const sy = ty + st.y * k;
    if (sx < -80 || sx > FRAME_W + 80 || sy < -80 || sy > FRAME_H + 80) continue;
    const s = scaleOfY(st.y);
    if (horse) {
      const pose: HorsePose = st.moving ? (st.pose >= 2 ? HORSE_POSES[3 + ((st.pose - 2) % 3)] : st.pose === 1 ? "walk1" : "walk0") : "stand";
      blit(ctx, horseKey(pose, st.flip > 0), sx, sy, FIG.horse * s * k, 1, 0, Math.max(0.22, Math.abs(st.flip)));
    } else blit(ctx, FOOT_KEYS[Math.max(0, Math.min(2, st.pose))], sx, sy, FIG.foot * s * k, 1);
  }
};
/** A2's company at tau: the foot in their ranks, the horsemen riding or in their places */
export const companyAt2 = (tau: number): CoItem[] => {
  const out: CoItem[] = [];
  for (let i = 0; i < N_CO2; i++) if (!COMPANY2[i].horse) out.push({ st: restOf(i, tau), horse: false });
  for (let kk = 0; kk < RIDERS2.length; kk++) out.push({ st: riderAt2(kk, tau) ?? restOf(riderSlot2(kk, tau), tau), horse: true });
  return out;
};

// ---------------------------------------------------------------------------
// THE HOST: living (figures / stipple by size), toppling, dead
// ---------------------------------------------------------------------------
const NB = 6; // dot alpha bins for the crossfade (+ 4 interleaved full layers)
const FIG_I = new Int32Array(HOST.n);
const FIG_X = new Float32Array(HOST.n);
const FIG_Y = new Float32Array(HOST.n);
const FIG_H = new Float32Array(HOST.n);
const FIG_A = new Float32Array(HOST.n);
const DEAD_Y = new Float32Array(MARKS.length);
const HOST_X_MAX = (() => {
  let m = -Infinity;
  for (let i = 0; i < HOST.n; i++) m = Math.max(m, HOST.x[i]);
  return m;
})();
export const drawHost = (ctx: CanvasRenderingContext2D, cam: Cam, tau: number, o: SceneOpts) => {
  const { k, tx, ty } = camT(cam);
  const wx0 = (-40 - tx) / k;
  const wx1 = (FRAME_W + 40 - tx) / k;
  const wy0 = (-40 - ty) / k;
  if (wx0 > HOST_X_MAX + 30) return; // the host and the heap lie left of the frame
  const dots: number[][] = Array.from({ length: NB + 4 }, () => []);
  const dead: HeapItem[] = [];
  DEAD_Y.fill(NaN);
  const fallers: { i: number; x: number; y: number; rot: number; q: number }[] = [];
  let nF = 0;
  const span = Math.max(0.01, o.lodHi - o.lodLo);
  const dotR = Math.max(0.55, 1.15 * k);
  const dotOp = 0.8;
  for (let n = 0; n < HOST.n; n++) {
    const i = HOST_ORDER[n];
    const x0 = HOST.x[i];
    if (x0 + 24 < wx0) continue; // the living only move left; the dead slide <= 12 px
    const slot = FATE2.slot[i];
    if (slot < 0 && HOST.y[i] + 2 < wy0) continue;
    const sc = hostScale(i);
    const hW = FIG.inca * sc;
    const st = hostAt2(i, tau, hW);
    if (st.state === 2) {
      DEAD_Y[st.j] = st.y;
      continue;
    }
    if (st.state === 1) {
      fallers.push({ i, x: st.x, y: st.y, rot: st.rot, q: st.q });
      continue;
    }
    if (st.x + 16 < wx0 || st.x - 16 > wx1) continue;
    const hPx = hW * k;
    // his level of detail by his own size at the front (no recession), so the
    // whole mound resolves together and its near rows never outshine the rest
    const t = smoothstep((FIG.inca * ownScale(i) * k - o.lodLo) / span);
    const sx = tx + st.x * k;
    const sy = ty + st.y * k;
    // the figure comes in before the dot goes (a complementary crossfade dips:
    // a dot and a figure cover the page differently)
    const tf = smoothstep(t / 0.65);
    const td = 1 - smoothstep((t - 0.35) / 0.65);
    if (td > 0) {
      const a = td;
      const bin = a >= 0.999 ? NB + (i & 3) : Math.min(NB - 1, Math.floor(a * NB));
      dots[bin].push(sx, sy - 0.5 * hPx);
    }
    if (tf > 0) {
      FIG_I[nF] = i;
      FIG_X[nF] = sx;
      FIG_Y[nF] = sy;
      FIG_H[nF] = hPx;
      FIG_A[nF] = LIVE_ALPHA * tf;
      nF++;
    }
  }
  // the stipple (V1's look: squares of the disc's area when small)
  ctx.fillStyle = "#E9DDBF";
  for (let b = 0; b < dots.length; b++) {
    const xy = dots[b];
    if (!xy.length) continue;
    ctx.globalAlpha = b >= NB ? dotOp : (dotOp * (b + 0.5)) / NB;
    ctx.beginPath();
    if (dotR < 0.9) {
      const side = dotR * 1.7725;
      const h = side / 2;
      for (let p = 0; p < xy.length; p += 2) ctx.rect(xy[p] - h, xy[p + 1] - h, side, side);
    } else
      for (let p = 0; p < xy.length; p += 2) {
        ctx.moveTo(xy[p] + dotR, xy[p + 1]);
        ctx.arc(xy[p], xy[p + 1], dotR, 0, Math.PI * 2);
      }
    ctx.fill();
  }
  // the figures, in painter's order, on their own layer: the near rows are
  // the only whole figures (behind them only heads and shoulders show), so
  // the crowd is brightest along its feet and reads as a rule on the ground;
  // their feet are laid down lighter
  if (nF) {
    const hl = layerCanvas(HOST_LAYER).getContext("2d") as CanvasRenderingContext2D;
    hl.setTransform(1, 0, 0, 1, 0, 0);
    hl.globalAlpha = 1;
    hl.clearRect(0, 0, FRAME_W, FRAME_H);
    for (let p = 0; p < nF; p++) blit(hl, MAN_KEY[FIG_I[p]], FIG_X[p], FIG_Y[p], FIG_H[p], FIG_A[p]);
    footCut(hl, ty + (GROUND_Y - 21) * k, ty + (GROUND_Y - 8) * k, HOST_FOOT_CUT);
    ctx.globalAlpha = 1;
    ctx.drawImage(layerCanvas(HOST_LAYER), 0, 0);
  }
  // the heap, in landing order
  for (let n = 0; n < HEAP_ORDER_A2.length; n++) {
    const j = HEAP_ORDER_A2[n];
    const y = DEAD_Y[j];
    if (y !== y) continue;
    dead.push({ j, x: MARKS[j].x, y, land: LAND_A2[j] });
  }
  drawHeap(ctx, cam, dead, tau, LAND_FADE);
  // the toppling, higher first: a struck man stays solid while he tumbles
  fallers.sort((a, b) => a.y - b.y);
  for (const f of fallers) drawToppling(ctx, cam, f.i, f.x, f.y, f.rot, f.q, hostScale(f.i), LIVE_ALPHA);
  ctx.globalAlpha = 1;
};

// ---------------------------------------------------------------------------
// THE PAGE (shared with ConquistadorsMusterV2)
// ---------------------------------------------------------------------------
export type SceneProps2 = {
  tau: number;
  /** the company's 168 (default: companyAt2(tau)) */
  company?: CoItem[];
  /** "168": its opacity and the NumeralLabel frame / f0 (slide) */
  label168: { op: number; frame: number; f0: number };
  /** "0" (A2 only) */
  zero?: { frame: number };
  vignette: number;
  opts: SceneOpts;
  /** the camera (default: A2's at tau) */
  cam?: Cam;
  timing?: boolean;
};
export const PageSceneV2: React.FC<SceneProps2> = ({ tau, company, label168, zero, vignette, opts, cam: camIn, timing }) => {
  const cam = swayCam(camIn ?? pageCam2(tau), tau);
  const co = company ?? companyAt2(tau);
  return (
    <PlanPage cam={cam} vignette={vignette}>
      <SpriteCanvas
        draw={(ctx) => {
          const t0 = performance.now();
          drawHost(ctx, cam, tau, opts);
          drawCompany(ctx, cam, co);
          if (timing) {
            // the draw's cost, printed into the frame (a measurement render only)
            ctx.globalAlpha = 1;
            ctx.fillStyle = "#000";
            ctx.fillRect(0, 0, 330, 64);
            ctx.fillStyle = "#fff";
            ctx.font = "44px monospace";
            ctx.fillText(`${Math.round(tau)}: ${(performance.now() - t0).toFixed(0)}ms`, 8, 48);
          }
        }}
      />
      {label168.op > 0.002 ? (
        <NumeralLabel
          text="168"
          x={LABEL168_2.x}
          y={LABEL168_2.y}
          dy={LABEL168_2.dy}
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
        <NumeralLabel text="0" x={ZERO_LABEL2.x} y={ZERO_LABEL2.y} cam={cam} frame={zero.frame} f0={ZERO_LABEL2.f0} size={NUM_SIZE} frames={ZERO_LABEL2.frames} fade={ZERO_LABEL2.fade} />
      ) : null}
    </PlanPage>
  );
};
const AgainstAlmostHundredThousandV2: React.FC<Props> = ({ vignette, lodLo, lodHi, tauOffset, timing }) => {
  const frame = useCurrentFrame();
  const tau = frame + tauOffset;
  return (
    <PageSceneV2
      tau={tau}
      label168={{ op: label168Op2(tau), frame: 1000, f0: 0 }}
      zero={{ frame: tau }}
      vignette={vignette}
      opts={{ lodLo, lodHi }}
      timing={timing}
    />
  );
};

export default AgainstAlmostHundredThousandV2;
