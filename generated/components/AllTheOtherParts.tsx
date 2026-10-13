import React, { useId } from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import type { Cam } from "./outgrowShared";
import { COLOR, GEO, Label, METRIC, StoutStage, SWEEP, amberBandFor, camFor, clamp01, lerp, rectPath, smoothstep } from "./stoutShared";
import { BASE, Cluster, FLOOR, FreeRack, clusterH, clusterW, rackBox } from "./aiBetShared";

// ---------------------------------------------------------------------------
// AllTheOtherParts — cut 2 of the "what frontier AI training costs" clip (Cheeky Pint S4E03, Meta;
// Mark Zuckerberg), Cheeky Pint S4 "stout" style (stoutShared.tsx, palette B1; world: aiBetShared.tsx).
// 1080x1920, 23.976 fps, opaque, 159 frames.
//
// CHECK LINE: The headline training run is only half the compute; testing every change on the way
// up takes as much again.
//
// THE LINE (frames from composition start): "Then you have(9) all(13) the other(19) parts(23).
// Research(39) isn't(50) just(59) doing(67) the run(84), right?(97) It's like that's(106)
// probably(118) an equal(137) amount(143) of it(154)" (he goes on, on camera: "...because for each
// change that you make, you're testing all the ladders all the way up to the big scale").
//
// COLOUR: amber = compute that is live. Cream = hardware. Nothing black.
//
// ONE SENTENCE OF MOTION: over the lit cluster of cut 1 (THE RUN) a second plinth comes up and two
// ladders of racks climb out of it, small, medium, big, lighting as they land; then the top rack of
// each ladder steps down and the ladders level into a block exactly like the run.
//
// FRAME TABLE (see T)
//   f 0        cut 1's cluster, lit, filling the width: THE RUN (label under its plinth). Creeping.
//   f 4-58     the camera travels up and eases back a little: room over the run
//   f 8-24     a second plinth rises out from behind the run's top edge and settles over it
//              -> "all the other parts"
//   f 10-100   (the first rack is already rising out of the plinth as it comes up: it is never a
//              blank bar) two ladders climb out of its slots, a column at a time: 1, 2, 3 racks, then 1, 2, 3
//              again; each column lights amber as it lands -> "research isn't just doing the run"
//   f 27-39    TESTING EVERY CHANGE slides up under the new plinth
//   f 120-152  the camera pushes in on the pair and centres it
//   f 121-140  the levelling: the top rack of each ladder lifts, crosses and sets down on its
//              ladder's first step (contact f 137 and f 140): 12 racks in 6 x 2, the run's own block
//              -> "an equal amount"
//   f 141-152  the one light sweep, across the new block
//   f 152-158  settled: slow creep, the stage's sway and grain
// ---------------------------------------------------------------------------

export const FPS = 24000 / 1001;
export const DURATION = 159;
export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

// --- the world (WORLD px) ----------------------------------------------------------------------------
const COLS = 6;
const ROWS = 2;
const X = 400; // cut 1's cluster
const BLOCK_H = BASE.H + clusterH(ROWS); // 216
const GAP = 54; // between the run's top and the test plinth: room for its label
const RUN_TOP = FLOOR - BLOCK_H;
const TEST_FLOOR = RUN_TOP - GAP;
const LADDER = [1, 2, 3, 1, 2, 3];
const LEFT = X - clusterW(COLS) / 2 + BASE.OVER; // the racks' left edge

// --- the frame table ----------------------------------------------------------------------------------
const T = {
  cam1: [4, 58],
  plinth: [8, 24],
  start: [10, 28, 42, 60, 70, 82], // each column leaves its slot
  dur: [13, 14, 18, 10, 14, 18], // by its height
  label: 26,
  cam2: [120, 152],
  hop: [121, 124], // each ladder's top rack lifts off
  hopF: 16,
  sweep: [141, 152],
} as const;
const ENTER_F = 12;
const LABEL_PX = 64; // legible at 270 px wide
const smoother = (v: number) => {
  const u = clamp01(v);
  return u * u * u * (u * (u * 6 - 15) + 10);
};
/** Rest to rest with a long soft landing. */
const settle = (v: number) => {
  const u = clamp01(v);
  return 1 - Math.pow(1 - u, 3) * (1 + 3 * u);
};
const win = (f: number, a: readonly number[]) => (f - a[0]) / (a[1] - a[0]);

// --- the camera: up and back, a creep, then in on the pair ----------------------------------------------
const CAM_A = camFor(X, FLOOR, 540, 1290, 2.5);
const CAM_B = camFor(X, FLOOR, 540, 1610, 2.36);
const CAM_C = camFor(X, FLOOR, 540, 1530, 2.5);
const camAt = (f: number): Cam => {
  const a = smoother(win(f, T.cam1));
  const b = smoother(win(f, T.cam2));
  const creep = 1 + 0.012 * (f / (DURATION - 1));
  return {
    x: X,
    y: CAM_A.y + (CAM_B.y - CAM_A.y) * a + (CAM_C.y - CAM_B.y) * b,
    k: Math.exp(Math.log(CAM_A.k) + Math.log(CAM_B.k / CAM_A.k) * a + Math.log(CAM_C.k / CAM_B.k) * b) * creep,
  };
};

/** One specular band across a set of rects (the racks of a block): stoutShared's LightSweep, clipped
 *  to several cards at once so the band is one band. */
const BlockSweep: React.FC<{ rects: { x: number; y: number; w: number; h: number }[]; k: number; t: number }> = ({ rects, k, t }) => {
  const id = `ap${useId().replace(/[^A-Za-z0-9_-]/g, "_")}`;
  if (t <= 0 || t >= 1 || rects.length === 0) return null;
  const x0 = Math.min(...rects.map((r) => r.x));
  const x1 = Math.max(...rects.map((r) => r.x + r.w));
  const y0 = Math.min(...rects.map((r) => r.y));
  const y1 = Math.max(...rects.map((r) => r.y + r.h));
  const band = SWEEP.band / k;
  const h = y1 - y0;
  const skew = Math.tan((SWEEP.angle * Math.PI) / 180) * h;
  const cx = lerp(x0 - band - skew, x1 + band + skew, t);
  return (
    <g>
      <defs>
        <clipPath id={id}>
          {rects.map((r, i) => (
            <path key={i} d={rectPath(r.x, r.y, r.w, r.h, GEO.RADIUS)} />
          ))}
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        <path
          d={`M${cx - band / 2} ${y1}L${cx - band / 2 + skew} ${y0}L${cx + band / 2 + skew} ${y0}L${cx + band / 2} ${y1}Z`}
          fill={COLOR.amberHot}
          fillOpacity={SWEEP.alpha}
          style={{ filter: `blur(${SWEEP.soft / k}px)` }}
        />
      </g>
    </g>
  );
};

const AllTheOtherParts: React.FC<Props> = () => {
  const uid = `ao${useId().replace(/[^A-Za-z0-9_-]/g, "_")}`;
  const f = useCurrentFrame();
  const cam = camAt(f);
  const k = cam.k;
  const band = amberBandFor(cam);

  // --- the second plinth: out from behind the run's top edge
  const pe = settle(win(f, T.plinth));
  const plinthDy = (1 - pe) * (GAP + BASE.H);
  const plinthLift = pe > 0 && pe < 1 ? Math.sin(Math.PI * pe) : 0;

  // --- the ladders
  const rise = (col: number) => settle((f - T.start[col]) / T.dur[col]);
  const landed = (col: number) => T.start[col] + T.dur[col];
  const hops = [0, 1].map((j) => {
    const t = clamp01((f - T.hop[j]) / T.hopF);
    const from = rackBox(X, TEST_FLOOR, COLS, j * 3 + 2, 2);
    const to = rackBox(X, TEST_FLOOR, COLS, j * 3, 1);
    const xe = smoother(t / 0.8);
    const ye = smoother((t - 0.55) / 0.45);
    const up = 18 * Math.sin(Math.PI * smoothstep(t / 0.9));
    return { t, flying: t > 0 && t < 1, done: t >= 1, x: lerp(from.x, to.x, xe), y: lerp(from.y, to.y, ye) - (t < 1 ? up : 0), lift: Math.sin(Math.PI * t) };
  });
  const heights = LADDER.map((n, col) => {
    const j = col < 3 ? 0 : 1;
    if (!hops[j].done) return n;
    return 2;
  });
  const hidden = (col: number, row: number) => {
    const j = col < 3 ? 0 : 1;
    return hops[j].flying && col === j * 3 + 2 && row === 2;
  };
  const lit = (col: number, row: number) => {
    const j = col < 3 ? 0 : 1;
    if (hops[j].done) return 1;
    return smoothstep((f - (landed(col) - 3 + row * 2)) / 7);
  };

  // --- labels: each under its own plinth
  const labelDrop = (24 + METRIC.cap * LABEL_PX) / k;
  const sweepT = win(f, T.sweep);
  const sweepRects = sweepT > 0 && sweepT < 1 ? [0, 1, 2, 3, 4, 5].flatMap((c) => [0, 1].map((r) => rackBox(X, TEST_FLOOR, COLS, c, r))) : [];
  const poolA = smoother(win(f, T.cam1));
  return (
    <StoutStage S={f} cam={cam} rest={CAM_A} pool={{ x: X, y: lerp(FLOOR - BLOCK_H / 2, RUN_TOP - GAP / 2, poolA) }}>
      <defs>
        {/* the new plinth shows only above the run's top edge while it comes up from behind it */}
        <clipPath id={`${uid}up`}>
          <rect x={X - 2000} y={RUN_TOP - 6000} width={4000} height={6000} />
        </clipPath>
      </defs>
      <g clipPath={pe < 1 ? `url(#${uid}up)` : undefined}>
        {pe > 0 ? (
          <Cluster
            x={X}
            floor={TEST_FLOOR}
            k={k}
            cols={COLS}
            rows={3}
            heights={heights}
            rise={(col) => (hops[col < 3 ? 0 : 1].done ? 1 : rise(col))}
            lit={lit}
            hidden={hidden}
            dy={plinthDy}
            elevation="rest"
            lift={plinthLift}
            plinthDim={0}
            amberBand={band}
          />
        ) : null}
      </g>
      <Cluster x={X} k={k} cols={COLS} rows={ROWS} lit={1} amberBand={band} />
      {hops.map((h, j) => (h.flying ? <FreeRack key={j} x={h.x} y={h.y} k={k} lit={1} lift={h.lift} amberBand={band} /> : null))}
      <BlockSweep rects={sweepRects} k={k} t={sweepT} />

      <Label x={LEFT} y={FLOOR + labelDrop} k={k} text="THE RUN" px={LABEL_PX} anchor="start" />
      <Label x={LEFT} y={TEST_FLOOR + labelDrop} k={k} text="TESTING EVERY CHANGE" px={LABEL_PX} anchor="start" enter={clamp01((f - T.label) / ENTER_F)} />
    </StoutStage>
  );
};

export default AllTheOtherParts;
