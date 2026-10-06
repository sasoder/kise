import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { Label, Stage, enterFrom, enterU, exitU, labelPx, labelWidth, rungAt } from "./chinatalkShared";
import { DataFrame, INK, INK_HI, INK_LO, ModelGlyph, PAPER, RED, RED_DEEP, TILE_W, clamp01, easeOutCubic, lerp, smoothstep, tileSeed } from "./mavenShared";
import {
  COLS,
  DURATION,
  FPS,
  MODEL_APPEAR_F0,
  MODEL_R,
  MODEL_WORD_F,
  OPS_SEED,
  OPS_TARGET,
  OPS_TOP,
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
  fieldTopAt,
  fillAt,
  flightAt,
  isFlier,
  missAt,
  modelAt,
  pourFrom,
  pourU,
  tileRungB,
  tileX,
  tileY,
} from "./noRelevantTargetsTallGeom";
import type { Eye } from "./noRelevantTargetsTallGeom";

export { DURATION, FPS };

// ---------------------------------------------------------------------------
// NoRelevantTargetsTall -- Bharat, "Project Maven's data problem" (ChinaTalk),
// cut B of 5, the 9:16 build: a journey DOWN the frame. 1080x1920, 24 fps,
// opaque. IN = 419 (sequence frame), DURATION = 194 (exact slot).
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
// ONE MOTION, top to bottom: the field grows, the model's eye reads all of it
// and finds nothing, the eye goes home into the model at the field's foot, the
// model drinks the field, goes down to work on a real frame and looks in the
// wrong place. ACCENT (vermilion = the relevant target): the dashed red square
// rides the eye all cut; the 0 is RED_DEEP; the one real target is the solid
// RED seal in the operations frame, easing to RED_DEEP when it is missed.
// Five element types: data frame, the eye, the model, the seal, labels.
//
// GESTURES (gesture -> word -> local frames)
// 0. Open on A's picture (5 x 7, same seeds, three searched frames at 0.42,
//    DATA above, the Bracket in its fourth frame), camera already pulling out.
// 1. "getting a ton of data" (5-20) -> the pull-out goes on (camera target
//    f-10..40, k 1.25 -> 0.54); 130 new tiles slide into their slots from above
//    and from the sides, 11 f each, in one wave running up and out from the old
//    grid (starts f1..f29) -> an 11 x 15 field, 859 px wide. DATA rides its top.
// 2. "didn't have relevant targets" (40-57) -> the Bracket rises and opens into
//    ONE horizontal scan line at the field's top (f-4..36), which sweeps the
//    field top -> bottom (f36 .. the foot ~f68), soft leading edge, the dashed
//    red square riding it; each row drops to INK_LO as the line reaches it.
//    DATA diffuses (f42-54); RELEVANT TARGETS + 0 (RED_DEEP) lands f57.
// 3. "your models" (73-79) -> below the foot the line shortens INTO a bracket's
//    width (f62-72), then opens into its four corners (f69-79) while the
//    model's rings write round it (f69-84). MODEL lands f79 beside it. The
//    camera goes down to the foot and pushes IN on the model (target f54-93,
//    k 0.54 -> 0.94: the model ~260 px across at f84, ~295 px by f96). The
//    dimmed field drains downward from its foot (front f68 -> f89): the nearest
//    four rows send ~24 tiles down individual arcs into the big model, the rest
//    dissolve leaning toward it; the inner wash fills with plain ink (f78-103).
// 4. "weren't as performant" (86-121) -> the model goes down and left (f89-119)
//    and the camera rides down with it at that closeness (target f83-123), the
//    operations frame's top edge and its solid RED seal coming up under it;
//    then the camera eases back out to the end framing (target f106-142,
//    k -> 0.63) as the Bracket comes out (f102-126), hunts, and commits to
//    empty terrain (f118-132), ~430 px from the seal; its square stays dashed.
//    The seal eases RED -> RED_DEEP (f126-144).
// 5. "into operations" (160) -> OPERATIONS lands above the frame. To the end:
//    the Bracket's restless drift, dashes marching, the camera creeping in.
// ---------------------------------------------------------------------------

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

const TITLE_PX = 60;
const WORD_PX = 46;
const VALUE_PX = 92;
/** world width of a chinatalkShared Label drawn with `minPx` at k */
const labelW = (text: string, size: "word" | "value", k: number, minPx: number) => {
  const fs0 = labelPx(size, k);
  return labelWidth(text, size, k) * (Math.max(fs0, minPx / k) / fs0);
};

/** The model's eye in any of its shapes (see Eye): four ink corner marks about
 *  a w x h box; as the box flattens into the scan line the horizontal arms
 *  grow until they meet. mavenShared's Bracket drawing when w = h, armH 0.22. */
const EyeShape: React.FC<{ eye: Eye; k: number; S: number; strokePx: number; expectSide: number }> = ({ eye, k, S, strokePx, expectSide }) => {
  const { x, y, w, h, armH, line, glow } = eye;
  const sw = strokePx / k;
  const hw = w / 2;
  const hh = h / 2;
  const aH = armH * w;
  const aV = 0.22 * h;
  const d: string[] = [];
  for (const [sx, sy] of [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ]) {
    const cx = x + sx * hw;
    const cy = y + sy * hh;
    d.push(`M${(cx - sx * aH).toFixed(2)} ${cy.toFixed(2)}L${cx.toFixed(2)} ${cy.toFixed(2)}L${cx.toFixed(2)} ${(cy - sy * aV).toFixed(2)}`);
  }
  const es = expectSide;
  const eh = es / 2;
  const period = (es * 4) / 12;
  const dash = period * 0.56;
  const ew = Math.max(2.4 / k, sw * 0.8);
  const gh = 150 / k;
  return (
    <g>
      {glow > 0.01 ? (
        <>
          <defs>
            <linearGradient id="nrtt-glow" gradientUnits="userSpaceOnUse" x1={0} y1={y.toFixed(2)} x2={0} y2={(y + gh).toFixed(2)}>
              <stop offset={0} stopColor={INK} stopOpacity={(0.2 * glow).toFixed(4)} />
              <stop offset={0.4} stopColor={INK} stopOpacity={(0.07 * glow).toFixed(4)} />
              <stop offset={1} stopColor={INK} stopOpacity={0} />
            </linearGradient>
          </defs>
          <rect x={(x - hw).toFixed(2)} y={y.toFixed(2)} width={w.toFixed(2)} height={gh.toFixed(2)} fill="url(#nrtt-glow)" />
        </>
      ) : null}
      <path d={d.join("")} fill="none" stroke={INK} strokeOpacity={INK_HI} strokeWidth={sw.toFixed(3)} strokeLinecap="round" strokeLinejoin="round" />
      {line > 0.3 ? <rect x={(x - eh).toFixed(2)} y={(y - eh).toFixed(2)} width={es.toFixed(2)} height={es.toFixed(2)} fill={PAPER} opacity={smoothstep((line - 0.3) / 0.5).toFixed(3)} /> : null}
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

const NoRelevantTargetsTall: React.FC<Props> = () => {
  const S = useCurrentFrame();
  const cam = camAt(S);
  const k = cam.k;
  const spF = fieldStrokePx(k);
  const spB = bigStrokePx(k);
  const eye = eyeAt(S, k);
  const model = modelAt(S);

  const tiles: React.ReactNode[] = [];
  const fliers: React.ReactNode[] = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const p = pourU(col, row, S);
      if (p <= 0) continue;
      const rung = tileRungB(col, row, S);
      const seed = tileSeed(col - 3, row - 8);
      const key = `${col}-${row}`;
      if (isFlier(col, row)) {
        const fl = flightAt(col, row, S);
        if (!fl) continue;
        const node = (
          <g key={key} opacity={fl.opacity < 1 ? fl.opacity.toFixed(3) : undefined}>
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
        const dx = model.x - x;
        const dy = model.y - y;
        const dl = Math.hypot(dx, dy) || 1;
        x += (dx / dl) * ds.lean;
        y += (dy / dl) * ds.lean;
      }
      const node = <DataFrame key={key} x={x} y={y} w={TILE_W} k={k} seed={seed} rung={rung} strokePx={spF} diffuse={clamp01(ds.u)} />;
      tiles.push(op < 1 ? <g key={key} opacity={op.toFixed(3)}>{node}</g> : node);
    }
  }

  // labels: one centred column
  const titleY = fieldTopAt(S) - 76 / k;
  const wW = labelW("RELEVANT TARGETS", "word", k, WORD_PX);
  const wV = labelW("0", "value", k, VALUE_PX);
  const gap = 28 / k;
  const rx0 = -(wW + gap + wV) / 2;
  // the dashed square: 30 % of the bracket, a steady 46 screen px while it rides the scan line
  const expectSide = lerp(Math.min(eye.w, Math.max(eye.h, eye.w * 0.5)) * 0.3, 46 / k, smoothstep(eye.line));

  // MODEL stays proportionate to the model through the push-in (60 px in the wide, ~82 px close)
  const modelPx = Math.max(TITLE_PX, Math.min(84, TITLE_PX * Math.pow(k / 0.63, 0.75)));

  return (
    <Stage S={S} cam={cam} rest={REST_CAM}>
      {tiles}

      {/* operations: the real world, with a real target */}
      <DataFrame x={OPS_X} y={OPS_Y} w={OPS_W} k={k} seed={OPS_SEED} target="red" deep={missAt(S)} tx={OPS_TARGET.tx} ty={OPS_TARGET.ty} strokePx={spB} />

      {/* the model */}
      <ModelGlyph id="nrtt-model" x={model.x} y={model.y} r={MODEL_R} k={k} S={S} fill={fillAt(S)} tint={0} eye={false} appear={(S - MODEL_APPEAR_F0) / 15} strokePx={spB} />
      {fliers}

      {/* the model's eye */}
      <EyeShape eye={eye} k={k} S={S} strokePx={eyeStrokePx(S, k)} expectSide={expectSide} />

      <Label text="data" x={0} y={titleY} k={k} size="word" minPx={TITLE_PX} diffuse={exitU(S, 42, 12)} />
      <Label text="relevant targets" x={rx0} y={titleY} k={k} size="word" minPx={WORD_PX} anchor="start" appear={enterU(S, TARGETS_WORD_F)} diffuse={exitU(S, 76, 12)} />
      <Label text="0" x={rx0 + wW + gap} y={titleY} k={k} size="value" minPx={VALUE_PX} anchor="start" color={RED_DEEP} rung={1} appear={enterFrom(S, TARGETS_WORD_F - 6)} diffuse={exitU(S, 77, 12)} />
      <Label text="model" x={model.x + MODEL_R + 34 / k} y={model.y} k={k} size="word" minPx={modelPx} anchor="start" rung={rungAt(S, 138, INK_HI, INK_LO)} appear={enterU(S, MODEL_WORD_F)} />
      <Label text="operations" x={OPS_X} y={OPS_TOP - 70 / k} k={k} size="word" minPx={TITLE_PX} appear={enterU(S, OPS_WORD_F)} />
    </Stage>
  );
};

export default NoRelevantTargetsTall;
