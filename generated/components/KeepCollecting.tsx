import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  Baseline,
  Bead,
  INK,
  INK_HI,
  INK_LO,
  KLabel,
  Slab,
  Stage,
  WetStroke,
  clamp01,
  easeOutCubic,
  growAt,
  labelDrop,
  startAt,
  ENTER_F,
  Label,
  PAPER,
  labelScreenPx,
  lerp,
  lineW,
  polyD,
  rungAt,
  smoothstep,
} from "./mavenKit";
import {
  BASE_HALF,
  BASE_Y,
  DURATION,
  FALL,
  FPS,
  FRAME_F,
  FRAME_F0,
  N_INK,
  N_SLABS,
  OPEN_F,
  REST_CAM,
  RING_R,
  SLAB_H,
  SLAB_W,
  W_DATA,
  W_MODEL,
  W_RELEVANT,
  arcPts,
  camAt,
  fallEase,
  framePts,
  headAngle,
  releaseF,
  ringPt,
  slotY,
} from "./keepCollectingGeom";

export { DURATION, FPS };

// ---------------------------------------------------------------------------
// KeepCollecting -- Bharat, "Project Maven's data problem" (ChinaTalk), V3 cut C.
// 1080x1920, 24 fps, opaque. Built only from mavenKit.
//
// LINE: "we have to continuously collect data and relevant data so then we could
// build some of those models."
// IN = seq 686, DURATION = 133 f (exact slot, hard cut both ends).
// Local word frames: have 1 · to 6 · continuously 11-30 · collect 30 · data 42 ·
// and 53 · relevant 69 · data 76 · so 83 · then 93 · we 98 · could 101 ·
// build 103 · some 108 · of 112 · those 115 · models 119-127.
//
// IDEA: one cycle that keeps turning and a stack that grows in its middle.
// VERMILION = relevant data (the third slab onward). Four element types: the
// ring line, slabs, the model outline, labels (+ the hair baseline).
//
// SCHEDULE (one clock, keepCollectingGeom.ts): lap 44 f with TWO opposite wet
// heads, so a head passes the top every 22 f (f 12 + 22 n) and releases a slab;
// fall 13 f; landings f -19, 3, 25, 47 (ink) · 69, 91, 113 (vermilion) · (135).
//
// GESTURES (gesture -> word -> local frames)
// 1. the closed ring is re-written by two opposite wet heads (bead + a 70 deg
//    tapering comet of wet ink), clockwise, 63 px/f, for the whole cut ->
//    "continuously" -> f 0-133. Camera: opens a little close and high (k 1.08),
//    eases to the whole ring f -6-38.
// 2. each pass of the top releases a slab that hangs from the line as it opens
//    (6 f) and drops down the middle onto the stack. The cycle was running before
//    the cut: at f 0 one hatched INK slab is seated and the second is falling
//    (lands f 3); two more ink slabs -> "collect data" -> released f 12 / 34,
//    landing f 25 / 47; DATA is fully in on f 42 inside the bottom slab.
// 3. the next three are solid VERMILION -> "relevant data ... so then we could" ->
//    released f 56 / 78 / 100, landing f 69 ("relevant") / 91 / 113; RELEVANT (the
//    clip's one paper-coloured label) rides the first red slab and is fully in as
//    it lands f 69; the DATA label eases to ink 0.42 (f 61-73).
// 4. as the seventh slab seats, a LINE_W ink outline is written from the baseline
//    up and over the stack (wet bead) -> "build some of those models" -> f 111-128;
//    MODEL is fully in on f 119 under the baseline. Camera creeps in f 82-133.
// 5. the orbit never stops: an eighth (vermilion) slab is released f 122 and is
//    still falling on the last frame.
// ---------------------------------------------------------------------------

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

/** the comet of wet ink behind each head, radians (70 deg of arc, ~8.5 f of travel) */
const COMET = (70 * Math.PI) / 180;
const COMET_N = 28;

/** One wet head: the bead and its long tapering comet (ink, full and 1.35x thick at
 *  the head, drying back to the line's own weight). */
const Head: React.FC<{ id: string; a: number; k: number }> = ({ id, a, k }) => {
  const lw = lineW(k);
  const segs: React.ReactNode[] = [];
  for (let i = 0; i < COMET_N; i++) {
    const a0 = a - COMET + (COMET * i) / COMET_N;
    const a1 = a - COMET + (COMET * (i + 1)) / COMET_N;
    const u = (i + 0.5) / COMET_N;
    const wet = u * u * (3 - 2 * u) * u;
    segs.push(
      <path
        key={i}
        d={polyD(arcPts(a0, a1 + 0.004, 1))}
        fill="none"
        stroke={INK}
        strokeOpacity={Math.min(1, wet * 1.6).toFixed(4)}
        strokeWidth={(lw * (1 + 0.35 * wet)).toFixed(3)}
        strokeLinecap={i === COMET_N - 1 ? "round" : "butt"}
      />,
    );
  }
  const head = ringPt(a);
  return (
    <g>
      {segs}
      <Bead id={id} x={head.x} y={head.y} r={1.28 * lw} color={INK} opacity={INK_HI} />
    </g>
  );
};

/** The cycle: a closed line that two opposite wet heads keep re-writing. */
const Ring: React.FC<{ f: number; k: number }> = ({ f, k }) => {
  const aH = headAngle(f);
  return (
    <g>
      <WetStroke id="kc-ring" points={arcPts(0, 2 * Math.PI)} k={k} />
      <Head id="kc-head-a" a={aH} k={k} />
      <Head id="kc-head-b" a={aH + Math.PI} k={k} />
    </g>
  );
};

/** One collected slab: peels off the head at the top, opens, falls, lands. */
const Collected: React.FC<{ i: number; f: number; k: number }> = ({ i, f, k }) => {
  const rel = releaseF(i);
  if (f < rel) return null;
  const lw = lineW(k);
  const open = easeOutCubic((f - rel) / OPEN_F);
  const fall = fallEase((f - rel) / FALL);
  // opens from the blob (the bead's diameter)
  const w = lerp(2.56 * lw, SLAB_W, open);
  const h = lerp(2.56 * lw, SLAB_H, open);
  // it hangs from the line as it opens (its top edge leaves the ring's top), then falls
  const y = lerp(-RING_R + h / 2 - 1.28 * lw, slotY(i, lw), fall);
  const blob = 1 - smoothstep((f - rel) / 4);
  const red = i >= N_INK;
  return (
    <g>
      <Slab
        id={`kc-slab-${i}`}
        x={0}
        y={y}
        w={w}
        h={h}
        kind={red ? "red" : "ink"}
        k={k}
        S={f}
        wet={red ? 1 - smoothstep((f - rel - FALL) / 18) : 0}
        label={i === 0 ? "DATA" : undefined}
        labelAppear={startAt(f, W_DATA - ENTER_F)}
        labelRung={rungAt(f, W_RELEVANT - 8, INK_HI, INK_LO)}
      />
      {/* the one paper-coloured label of the clip (director's exception: dark ink on vermilion reads muddy) */}
      {i === N_INK ? (
        <Label
          text="RELEVANT"
          x={0}
          y={y}
          k={k}
          size="word"
          color={PAPER}
          rung={1}
          appear={startAt(f, W_RELEVANT - ENTER_F)}
          minPx={labelScreenPx("word", k)}
        />
      ) : null}
      {blob > 0.01 ? <Bead id={`kc-blob-${i}`} x={0} y={y - h / 2 + 1.28 * lw} r={1.28 * lw} color={INK} opacity={blob * INK_HI} bloom={false} /> : null}
    </g>
  );
};

const KeepCollecting: React.FC<Props> = () => {
  const f = useCurrentFrame();
  const cam = camAt(f);
  const k = cam.k;
  const lw = lineW(k);
  const frame = framePts(lw);
  const frameDraw = growAt(f, FRAME_F0, FRAME_F);
  return (
    <Stage S={f} cam={cam} rest={REST_CAM}>
      <Baseline x0={-BASE_HALF} x1={BASE_HALF} y={BASE_Y} k={k} />
      {Array.from({ length: N_SLABS }, (_, i) => (
        <Collected key={i} i={i} f={f} k={k} />
      ))}
      <WetStroke
        id="kc-model"
        points={frame}
        k={k}
        draw={frameDraw}
        wet={1 - smoothstep((f - FRAME_F0 - FRAME_F) / 10)}
        bead={clamp01((f - FRAME_F0) / 2) * (1 - smoothstep((f - FRAME_F0 - FRAME_F + 3) / 6))}
      />
      <Ring f={f} k={k} />
      <KLabel text="MODEL" x={0} y={BASE_Y + labelDrop(k)} k={k} appear={startAt(f, W_MODEL - ENTER_F)} />
    </Stage>
  );
};

export default KeepCollecting;
