import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  DataFrame,
  INK,
  INK_HI,
  INK_LO,
  MLabel,
  MStage,
  M_TITLE_PX,
  M_VALUE_PX,
  M_WORD_PX,
  ModelGlyph,
  PAPER,
  RED,
  RED_DEEP,
  TILE_W,
  clamp01,
  easeOutCubic,
  enterFrom,
  enterU,
  lerp,
  exitU,
  mLabelFs,
  mLabelWidth,
  rungAt,
  smoothstep,
  tileSeed,
} from "./mavenShared";
import { tileX, tileY } from "./dataItselfGeom";
import {
  COLS,
  DURATION,
  FIELD_CX,
  FIELD_Y0,
  FPS,
  MODEL_APPEAR_F0,
  MODEL_R,
  MODEL_WORD_F,
  MODEL_Y,
  OPS_H,
  OPS_SEED,
  OPS_TARGET,
  OPS_W,
  OPS_WORD_F,
  OPS_X,
  OPS_Y,
  REST_CAM,
  ROWS,
  TARGETS_WORD_F,
  bigStrokePx,
  camAt,
  dissolveAt,
  eyeAt,
  eyeStrokePx,
  fieldStrokePx,
  fillAt,
  flightAt,
  isFlier,
  missAt,
  modelX,
  pourFrom,
  pourU,
  tileRungB,
} from "./noRelevantTargetsGeom";
import type { Eye } from "./noRelevantTargetsGeom";

export { DURATION, FPS };

// ---------------------------------------------------------------------------
// NoRelevantTargets -- Bharat, "Project Maven's data problem" (ChinaTalk), cut B
// of 5. 1920x1080, 24 fps, opaque. IN = 419 (sequence frame), DURATION = 194
// (exact slot, hard cut in and out).
//
// LINE: "(we) were getting a ton of data that, again, didn't have relevant
// targets. So then your models weren't as performant once we put those models
// into operations."
// Local word frames: were 2 · getting 5 · a 8 · ton 12 · of 16 · data 20 ·
// that 25 · again 33 · didn't 40 · have 48 · relevant 51 · targets 57 · so 66 ·
// then 70 · your 73 · models 79 · weren't 86 · as 95 · performant 108 ·
// once 121 · we 125 · put 130 · those 135 · models 141 · into 152 ·
// operations 160 (ends 180) · end 194.
//
// ONE MOTION, left to right: the field grows, the model's eye reads all of it
// and finds nothing, the eye goes home into the model, the model drinks the
// field, goes to work on a real frame and looks in the wrong place.
// ACCENT (vermilion = the relevant target): the dashed red square (the target
// the model expects) rides the eye the whole cut; the numeral 0 is RED_DEEP;
// the one real target is the solid RED seal in the operations frame, easing to
// RED_DEEP when it is missed. Five element types: data frame, the eye (bracket
// / scan line), the model, the seal, labels.
//
// GESTURES (gesture -> word -> local frames)
// 0. Open on A's picture: the 9 x 4 grid (same seeds, three searched frames at
//    0.42), DATA above it, the Bracket hunting in its fourth frame; the camera
//    already pulling out.
// 1. "getting a ton of data" (5-20) -> the pull-out goes on (camera target
//    f-10..40, k 1.08 -> 0.43) and frames POUR in: 144 new tiles slide into
//    their slots from the right (rows 1-4) and from below-right (rows 5-9), 11 f
//    each, in one wave running away from the old grid (starts f1 .. f27, done
//    f38) -> a 20 x 9 field. No tile starts while its slot is still down in the
//    caption band. DATA rides above the field's centre.
// 2. "didn't have relevant targets" (40-57) -> the Bracket leaves its frame and
//    opens into ONE vertical scan line at the field's left edge (f12-30); the
//    line sweeps the field left -> right (f30 .. field's right edge f69), soft
//    leading edge, the dashed red square riding it. Each column drops to INK_LO
//    as the line reaches it. DATA diffuses (f42-54); the readout RELEVANT
//    TARGETS + 0 (RED_DEEP) lands over the field on "targets" (f57).
// 3. "your models" (73-79) -> the line runs on past the field and folds back
//    into a Bracket (f63-76); the model's two rings write themselves round it
//    (f61-75): the eye is the model's. MODEL lands f79. The camera glides right
//    (target f51-93). The dimmed field drains toward the model from its near
//    edge (front f67 -> f90): the nearest five columns send ~23 tiles down
//    individual arcs into it, everything else dissolves in place, leaning
//    toward it. The model's inner wash fills with plain ink (f76-99).
// 4. "weren't as performant" (86-121) -> the model travels right to the edge of
//    ONE big frame (f90-111), the camera following and pushing in (target
//    f85-140, k -> 0.93). The frame has a real target (solid RED seal, there
//    from the moment it enters view, ~f70). The Bracket comes out (f101-114),
//    hunts over the terrain and commits to empty ground (f111-124), 330 px from
//    the seal; its square stays dashed. The seal eases RED -> RED_DEEP
//    (f120-138): missed.
// 5. "into operations" (152-160) -> OPERATIONS lands above the frame (f160).
//    To the end: the Bracket's small restless drift round its wrong spot, dashes
//    marching, the camera creeping in (k 0.93 -> 0.99).
// ---------------------------------------------------------------------------

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

/** The model's eye in any of its shapes: four ink corner marks about a w x h
 *  box (mavenShared's Bracket when w = h and line = 0), whose vertical arms
 *  grow until they meet as the box closes into the scan line; the dashed red
 *  expected-target square (Bracket's own drawing) rides its centre. */
const EyeShape: React.FC<{ eye: Eye; k: number; S: number; strokePx: number; expectSide: number }> = ({ eye, k, S, strokePx, expectSide }) => {
  const { x, y, w, h, line, glow } = eye;
  const sw = strokePx / k;
  const hw = w / 2;
  const hh = h / 2;
  const armH = 0.22 * w;
  const armV = h * (0.22 + 0.285 * smoothstep(line));
  const d: string[] = [];
  for (const [sx, sy] of [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ]) {
    const cx = x + sx * hw;
    const cy = y + sy * hh;
    d.push(`M${(cx - sx * armH).toFixed(2)} ${cy.toFixed(2)}L${cx.toFixed(2)} ${cy.toFixed(2)}L${cx.toFixed(2)} ${(cy - sy * armV).toFixed(2)}`);
  }
  const es = expectSide;
  const eh = es / 2;
  const period = (es * 4) / 12;
  const dash = period * 0.56;
  const ew = Math.max(2.2 / k, sw * 0.8);
  const gw = 150 / k;
  return (
    <g>
      {glow > 0.01 ? (
        <>
          <defs>
            <linearGradient id="nrt-glow" gradientUnits="userSpaceOnUse" x1={x.toFixed(2)} y1={0} x2={(x + gw).toFixed(2)} y2={0}>
              <stop offset={0} stopColor={INK} stopOpacity={(0.2 * glow).toFixed(4)} />
              <stop offset={0.4} stopColor={INK} stopOpacity={(0.07 * glow).toFixed(4)} />
              <stop offset={1} stopColor={INK} stopOpacity={0} />
            </linearGradient>
          </defs>
          <rect x={x.toFixed(2)} y={(y - hh).toFixed(2)} width={gw.toFixed(2)} height={h.toFixed(2)} fill="url(#nrt-glow)" />
        </>
      ) : null}
      {line > 0.5 ? <rect x={(x - eh).toFixed(2)} y={(y - eh).toFixed(2)} width={es.toFixed(2)} height={es.toFixed(2)} fill={PAPER} opacity={smoothstep((line - 0.5) * 2).toFixed(3)} /> : null}
      <path d={d.join("")} fill="none" stroke={INK} strokeOpacity={INK_HI} strokeWidth={sw.toFixed(3)} strokeLinecap="round" strokeLinejoin="round" />
      <rect
        x={(x - eh).toFixed(2)}
        y={(y - eh).toFixed(2)}
        width={es.toFixed(2)}
        height={es.toFixed(2)}
        rx={(es * 0.08).toFixed(2)}
        fill="none"
        stroke={RED}
        strokeWidth={ew.toFixed(3)}
        strokeDasharray={`${dash.toFixed(3)} ${(period - dash).toFixed(3)}`}
        strokeDashoffset={(-(((S * 0.9) / k) % period)).toFixed(3)}
      />
    </g>
  );
};

const NoRelevantTargets: React.FC<Props> = () => {
  const S = useCurrentFrame();
  const cam = camAt(S);
  const k = cam.k;
  const spF = fieldStrokePx(k);
  const spB = bigStrokePx(k);
  const eye = eyeAt(S, k);
  const mx = modelX(S);

  // --- the field ---
  const tiles: React.ReactNode[] = [];
  const fliers: React.ReactNode[] = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const p = pourU(col, row, S);
      if (p <= 0) continue;
      const rung = tileRungB(col, row, S);
      const seed = tileSeed(col, row);
      if (isFlier(col, row)) {
        const fl = flightAt(col, row, S);
        if (!fl) continue;
        const node = (
          <g key={`${col}-${row}`} opacity={fl.opacity < 1 ? fl.opacity.toFixed(3) : undefined}>
            <DataFrame x={fl.x} y={fl.y} w={TILE_W * fl.scale} k={k} seed={seed} rung={rung} strokePx={spF} />
          </g>
        );
        if (fl.scale < 1) fliers.push(node);
        else tiles.push(node);
        continue;
      }
      const ds = dissolveAt(col, row, S);
      if (ds.u >= 1) continue;
      let x = tileX(col);
      let y = tileY(row);
      let op = 1;
      if (p < 1) {
        const from = pourFrom(col, row);
        const e = 1 - easeOutCubic(p);
        x += from.x * e;
        y += from.y * e;
        op = smoothstep(p * 1.5);
      }
      if (ds.u > 0) {
        const dx = mx - x;
        const dy = MODEL_Y - y;
        const dl = Math.hypot(dx, dy) || 1;
        x += (dx / dl) * ds.lean;
        y += (dy / dl) * ds.lean;
      }
      const node = <DataFrame key={`${col}-${row}`} x={x} y={y} w={TILE_W} k={k} seed={seed} rung={rung} strokePx={spF} diffuse={clamp01(ds.u)} />;
      tiles.push(op < 1 ? <g key={`${col}-${row}`} opacity={op.toFixed(3)}>{node}</g> : node);
    }
  }

  // --- labels ---
  const titleY = FIELD_Y0 - 71 / k;
  const labelX = FIELD_CX * smoothstep((S + 10) / 50);
  const fsW = mLabelFs(M_WORD_PX, k);
  const fsV = mLabelFs(M_VALUE_PX, k);
  const wW = mLabelWidth("RELEVANT TARGETS", "word", fsW);
  const wV = mLabelWidth("0", "value", fsV);
  const gap = 30 / k;
  const rx0 = FIELD_CX - (wW + gap + wV) / 2;

  // the dashed square: 30 % of the bracket, a steady 44 screen px while it rides the scan line
  const expectSide = lerp(eye.w * 0.3, 44 / k, smoothstep(eye.line));
  const opsTop = OPS_Y - OPS_H / 2;

  return (
    <MStage S={S} cam={cam} rest={REST_CAM}>
      {tiles}

      {/* operations: the real world, with a real target */}
      <DataFrame x={OPS_X} y={OPS_Y} w={OPS_W} k={k} seed={OPS_SEED} target="red" deep={missAt(S)} tx={OPS_TARGET.tx} ty={OPS_TARGET.ty} strokePx={spB} />

      {/* the model */}
      <ModelGlyph id="nrt-model" x={mx} y={MODEL_Y} r={MODEL_R} k={k} S={S} fill={fillAt(S)} tint={0} eye={false} appear={(S - MODEL_APPEAR_F0) / 15} strokePx={spB} />
      {fliers}

      {/* the model's eye */}
      <EyeShape eye={eye} k={k} S={S} strokePx={eyeStrokePx(S, k)} expectSide={expectSide} />

      <MLabel text="data" x={labelX} y={titleY} k={k} px={M_TITLE_PX} diffuse={exitU(S, 42, 12)} />
      <MLabel text="relevant targets" x={rx0} y={titleY} k={k} px={M_WORD_PX} anchor="start" appear={enterU(S, TARGETS_WORD_F)} diffuse={exitU(S, 78, 12)} />
      <MLabel text="0" x={rx0 + wW + gap} y={titleY} k={k} kind="value" anchor="start" color={RED_DEEP} rung={1} appear={enterFrom(S, TARGETS_WORD_F - 6)} diffuse={exitU(S, 79, 12)} />
      <MLabel text="model" x={mx} y={MODEL_Y - MODEL_R - 62 / k} k={k} rung={rungAt(S, 138, INK_HI, INK_LO)} appear={enterU(S, MODEL_WORD_F)} />
      <MLabel text="operations" x={OPS_X} y={opsTop - 66 / k} k={k} appear={enterU(S, OPS_WORD_F)} />
    </MStage>
  );
};

export default NoRelevantTargets;
