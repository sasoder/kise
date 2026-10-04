import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { ACCENT, DARK, FRAME_H, FRAME_W, INK, INK_FULL, NumeralLabel, PlanPage, WorldSvg, mixColor, smoothstep, swayCam } from "./incaShared";
import {
  DURATION,
  FPS,
  HEAP_CX,
  INF_CASE,
  INF_D,
  INF_FULL,
  INF_W,
  LAST,
  MARKS,
  NUM_BASE_Y,
  NUM_PX,
  PEN_R,
  PLOT_CX,
  T,
  colonEntrance,
  drawingInk,
  markAt,
  orangeT,
  penR,
  pensAt,
  shimmerAt,
} from "./kdMotion";
import { B_CAM, COMPANY2, DEAD_DY, HEAP_ORDER_B, SLOT_MAN2, deadAngle, restOf } from "./pageMotionV2";
import { DEAD_TONE, SpriteCanvas, layerCanvas } from "./pageFigures";
import { drawCompany, drawHeap, drawToppling, type CoItem, type HeapItem } from "./AgainstAlmostHundredThousandV2";

export { DURATION, FPS };

// ---------------------------------------------------------------------------
// KdRatioOfInfinityV2. Dwarkesh Patel with Si Sheppard, clip
// "Sheppard_Cajamarca_infinite_KD": Pizarro at Cajamarca, 16 Nov 1532.
//   "...literally a K/D ratio of infinity. Of, you know, 10,000 to zero."
// V2 of KdRatioOfInfinity (V1 untouched). The user's note on the page cuts:
// "the line things under all the 'balls' ... unnecessary, and everything is
// maybe just a little bit too abstract". So: NO ground rules, plots or end
// ticks; every man an engraved FIGURE (pageFigures.tsx):
//   K, the killed (left, x 102-470): the 10,000 dead are the Inca warrior
//     lying on his side (rotated +-55..125 deg, hashed per heap slot; 30 %
//     with an arm or a leg flung out and the weapon dropped beside him), piled
//     in V1's heap (the same 10,000 slots; the lowest strewn a few px in depth
//     so the heap's foot never draws a line). R2: ONE UNIFORM PILE: every body
//     is drawn the same way, opaque at the dead tone with a DARK casing, in
//     landing order (later bodies on top, the ones under them occluded), so
//     the whole visible surface is a mosaic of toppled bodies under a jagged
//     silhouette of bodies (AgainstAlmostHundredThousandV2 drawHeap). They
//     fall as before (V1's pour: f-12..f22 + 150 stragglers to ~f60), each
//     TOPPLING as he drops (turning from 0.3 of his lying angle to all of it),
//     faint at the top of his fall and full as he lands (V1's fade).
//   D, the dead of Pizarro's side (right, centred on x 794): THE COMPANY OF 168
//     STANDING, upright and whole, from f0 (AgainstAlmostHundredThousandV2's
//     company, R1's deeper formation: 62 horsemen in four ranks facing the
//     heap, 106 foot in six
//     ranks with their pikes up, the rear rows higher and smaller). Nobody
//     lies there. It replaces the empty orange plot.
//   The ratio sign, the numerals, the highlight: V1's, unchanged (the colon in
//     the gap becomes the orange engraved lemniscate, 440 px wide on (540,
//     640); "10,000" under the heap, "0" under the company, IM Fell 156 px).
// Opaque 1080x1920, 24 fps. Geometry and timing: kdMotion.ts (V1, read-only);
// the camera: pageMotionV2 (B_CAM).
//
// TIMELINE (V1's). In-point 23.00 s on the edit timeline; f = round((t - 23.00) * 24):
//   literally f0 · a f12 · K f18 · D f20 · RATIO f23 · of f33 · INFINITY f40
//   (ends f49) · "of, you know," f49-f95 · TEN ~f96 · THOUSAND f105 · to f114 ·
//   ZERO f117 (ends f122). DURATION 122 + the 16-frame tail = 138 (f0..f137).
//
// THE GESTURES:
//   1. "literally a K/D" f0-f26: open close (k 1.55) on the heap as it forms,
//      the camera already gliding right; the company enters at the right edge
//      on f0; at "K / D" (f18-f20) the heap's flank is at left and the company
//      fills the right half; the glide LANDS ON THE COMPANY on f26 (its centre
//      at screen x 660, k 1.29): 168 men standing, nobody fallen. (Landing it
//      exactly on "D" would need > 30 px/f.)
//   2. "ratio" f23: the colon slides up in the gap (V1).
//   3. "of infinity" f23.5-f46: the pen-morph (V1, unchanged) while the
//      pull-back (k -> 1.0, V1's f8-f47) and its drift left (f26-f50) carry the
//      frame onto the whole figure (x 540, the feet at y 930).
//   4. "of, you know," f46-f96: V1's slow push-in (+8 %) on the infinity, the
//      highlight circulating; the stragglers settle (~f60); the company breathes.
//   5. "10,000" ~f100 under the heap; 6. "zero" f117: "0" under the company.
//   7. Tail f122-f137: still moving on the last frame.
// Nothing else: no rules, ticks, plots, rings, glows, red, crosses.
//
// COUNTS AND SOURCES (V1's; never on screen except the numerals): 10,000 dead
//   (the speaker's figure; the published range 2,000-10,000: Xerez 2,000; Mena
//   6,000-7,000; Trujillo 8,000). Zero Spanish dead (Hernando Pizarro, letter
//   of Nov 1533, Markham 1872 pp.118-119; Xerez p.55). 168 = 62 horse + 106
//   foot (Hemming; Lockhart, The Men of Cajamarca).
// CAMERA: V1's zoom (k 1.55 -> 1.0 f8-f47, +8 % push-in f46-f137) with the new
// glide (pageMotionV2: S on the anchor (540, 640)); camScan max 23.3 px/f,
// |dv| <= 2.7 px/f^2. Asserted every frame: the feet and the numerals above
// the caption band; from f46 every element (the dead figures, the company,
// the infinity, the numerals) >= 60 px inside the frame.
// ---------------------------------------------------------------------------

export const schema = z.object({
  vignette: z.number(),
  /** a falling body's alpha (before V1's faint-at-the-top fade) */
  fallAlpha: z.number(),
  /** print the draw's ms into the frame (a measurement render only) */
  timing: z.boolean(),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ vignette: 0.55, fallAlpha: DEAD_TONE, timing: false });

const FADE_LEVELS = 4;
const SHIMMER = "#FFF3D2";
const SHIMMER_SEGS = [
  [120, 0.45],
  [66, 0.75],
  [28, 1],
] as const;
const COMPANY_ITEMS = (frame: number): CoItem[] => COMPANY2.map((m, i) => ({ st: restOf(i, frame), horse: m.horse }));

const KdRatioOfInfinityV2: React.FC<Props> = ({ vignette, fallAlpha, timing }) => {
  const frame = useCurrentFrame();
  const fi = Math.min(LAST, Math.max(0, Math.round(frame)));
  const cam = swayCam(B_CAM[fi], frame);
  const k = cam.k;

  // ---- the ratio sign (V1) ----
  const ot = orangeT(frame);
  const ink = mixColor(INK, ACCENT, ot);
  const inkOp = INK_FULL + (1 - INK_FULL) * ot;
  const drawing = frame >= T.draw[0] && frame < T.draw[1];
  const drawn = frame >= T.draw[1];
  const live = drawing ? drawingInk(frame) : null;
  const inkD = live ? live.d : drawn ? INF_D : "";
  const inkFade = live ? live.op : 1;
  const ent = colonEntrance(frame);
  const pens = pensAt(frame);
  const pr = penR(frame);
  const penDy = ent.dy / k;
  const sh = shimmerAt(frame);

  return (
    <PlanPage cam={cam} vignette={vignette}>
      {/* the 10,000 dead and the 168 standing */}
      <SpriteCanvas
        draw={(ctx) => {
          const t0 = performance.now();
          const rest: HeapItem[] = [];
          const falling: { j: number; x: number; y: number; u: number; op: number }[] = [];
          for (let n = 0; n < HEAP_ORDER_B.length; n++) {
            const j = HEAP_ORDER_B[n];
            const m = MARKS[j];
            const p = markAt(m, frame);
            if (!p) continue;
            const y = p.y + DEAD_DY[j];
            if (frame < m.land) falling.push({ j, x: p.x, y, u: (frame - (m.land - m.fall)) / m.fall, op: p.op });
            else rest.push({ j, x: p.x, y, land: m.land });
          }
          // the heap: one uniform pile, in landing order (R2)
          drawHeap(ctx, cam, rest, frame, 0);
          // each falling body topples: from 0.3 of his lying angle to all of it.
          // V1's fade (faint at the top of the fall) by levels: each level laid
          // down opaque and composited at its tone, so the dense pour never
          // piles up brighter than the heap
          falling.sort((a, b) => a.y - b.y);
          const lv: CanvasRenderingContext2D[] = [];
          for (let b = 0; b < FADE_LEVELS; b++) {
            const lc = layerCanvas(4 + b).getContext("2d") as CanvasRenderingContext2D;
            lc.setTransform(1, 0, 0, 1, 0, 0);
            lc.globalAlpha = 1;
            lc.clearRect(0, 0, FRAME_W, FRAME_H);
            lv.push(lc);
          }
          for (const d of falling) {
            const a = deadAngle(d.j);
            const b = Math.min(FADE_LEVELS - 1, Math.floor(d.op * FADE_LEVELS));
            drawToppling(lv[b], cam, SLOT_MAN2[d.j], d.x, d.y, a * (0.3 + 0.7 * smoothstep(d.u)), 1, 1, 1);
          }
          for (let b = 0; b < FADE_LEVELS; b++) {
            ctx.globalAlpha = (fallAlpha * (b + 0.5)) / FADE_LEVELS;
            ctx.drawImage(layerCanvas(4 + b), 0, 0);
          }
          drawCompany(ctx, cam, COMPANY_ITEMS(frame));
          ctx.globalAlpha = 1;
          if (timing) {
            ctx.fillStyle = "#000";
            ctx.fillRect(0, 0, 330, 64);
            ctx.fillStyle = "#fff";
            ctx.font = "44px monospace";
            ctx.fillText(`${frame}: ${(performance.now() - t0).toFixed(0)}ms`, 8, 48);
          }
        }}
      />

      <WorldSvg cam={cam}>
        {inkD && inkFade > 0.002 ? (
          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d={inkD} stroke={DARK} strokeOpacity={0.6 * inkFade} strokeWidth={INF_W + INF_CASE} />
            <path d={inkD} stroke={ink} strokeOpacity={inkOp * inkFade} strokeWidth={INF_W} />
          </g>
        ) : null}
        {drawn && sh.amp > 0.01
          ? SHIMMER_SEGS.map(([len, o]) => (
              <path
                key={`sh-${len}`}
                d={INF_D}
                fill="none"
                stroke={SHIMMER}
                strokeOpacity={o * sh.amp}
                strokeWidth={INF_W}
                strokeLinecap="round"
                strokeDasharray={`${len} ${INF_FULL.len - len}`}
                strokeDashoffset={-(sh.s - len / 2)}
              />
            ))
          : null}
        {ent.op > 0.002 && pr > 0.05
          ? [pens.a, pens.b].map(([x, y], i) => (
              <circle
                key={`pen-${i}`}
                cx={x}
                cy={y + penDy}
                r={pr}
                fill={ink}
                fillOpacity={inkOp * ent.op}
                stroke={DARK}
                strokeOpacity={0.65 * ent.op * (pr / PEN_R) * (pr / PEN_R)}
                strokeWidth={2}
              />
            ))
          : null}
      </WorldSvg>

      <NumeralLabel text="10,000" x={HEAP_CX} y={NUM_BASE_Y} cam={cam} frame={frame} f0={T.tenK[0]} size={NUM_PX} frames={T.tenK[1] - T.tenK[0]} fade={10} />
      <NumeralLabel text="0" x={PLOT_CX} y={NUM_BASE_Y} cam={cam} frame={frame} f0={T.zero[0]} size={NUM_PX} frames={T.zero[1] - T.zero[0]} fade={11} />
    </PlanPage>
  );
};

export default KdRatioOfInfinityV2;
