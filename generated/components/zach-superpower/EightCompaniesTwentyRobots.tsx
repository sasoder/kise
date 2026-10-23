// ---------------------------------------------------------------------------
// EightCompaniesTwentyRobots (zach-superpower, cut 16). Core memory podcast style (styles/core-memory.md).
// Opaque 1080x1920, 23.976 fps, 115 frames.
// The graphic standard: flat white glyphs on their hard black shadow on squared paper. Chain echo once, at the
// payoff (ChainEcho). Core Memory edits carry burned-in captions: no label for what the speaker says.
//
// CHECK LINE: "In China it's never one company: brain implants come eight at a time, and humanoid robots come
// twenty at a time."
//
// THE LINE (host, Ashlee Vance, about China): "...even if it's brain-computer interfaces, there's like eight
// companies, you know, and humanoid robots, there's like 20."
// WORD -> FRAME (local, Whisper, may run ~0.2 s early): brain f-4 · -computer f2 · interfaces f11-f22 ·
//   there's f28 · like f32 · EIGHT f35 · companies f42-f51 · you know f54-f59 · and f59 · HUMANOID f66 ·
//   robots f83-f90 · there's f94 · like f98 · 20 f100-f109 · END f115.
// DURATION: the slot 16.7667 -> 21.5632 s (sequence frames 402 -> 517) = 4.796 s x 23.976 = 115 frames (f0..f114).
//
// THE MOTION: one camera move that opens close on ONE brain with its implant chip and is already pulling back.
// From f8 seven more brains rise beside it from behind their rule, outward right/left, each on the frame the
// pull-back brings its slot into frame (f8 .. f31), as chain-echo copies: the colours lead the rise and close up
// under the white core once it is in, so the resolved copies are plain white. The rule runs out under each slot
// just before its brain rises. The pull-back turns into a tilt down with a push in (f34-f62, k 1.0 -> ~1.09):
// one humanoid robot rises plain (f54, landed ~f61) and reads ~225 px tall on "humanoid" (f66). Then the camera
// pulls back to the resolved frame (f57-f80) while nineteen copies rise outward row by row (row 0 f64-f73,
// row 1 f79-f88), all twenty landed by ~f97, before "20" (f100). The resolved frame holds both bays (screen y
// ~280-1050) in a slow creep in (k 0.995 -> 1.025). Nothing fades.
// CHAIN = COPIES (the clip's legend): only the copies wear it, and only while they rise.
//
// THE CAMERA (eightCompaniesPlan.ts): one target track through the house damper, pre-rolled from f-14 so it is
// already moving at f0. Damped k: f0 4.24 (the brain 475 px, 44 % of the width) · f12 2.94 · f24 1.67 · f36 1.07
// · f45 1.02 · f61 1.094 (the push's top) · f66 1.08 · f81 1.0 · f114 1.025. Nothing readable enters the caption
// bands (y 1080-1250, 1360-1460) at any frame; only bare rule ends pass through 1080-1180 while they run out
// (row 0 ~f47-f52, row 1 ~f74-f79).
//
// SOURCES: none (no figures on screen). Glyph shapes, checked against animation_source/refs/: a side-view human
// brain; a flat square implant chip seated on it with four electrode threads printed down into the brain
// (bci_braingate_utah_array_ref.jpg, Neuralink-style threads); a Unitree G1 / H1 style humanoid, stylised
// (unitree_g1_fullbody_photo.jpg). Each row's rule runs out from under its first glyph as that glyph rises and
// reaches each later slot as its glyph rises, so no rule ever stands alone.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  CaptionStripDebug,
  PAPER_BASE,
  SHADOW_OFF,
  STROKE,
  TallPaper,
  WorldTall,
  sway,
} from "../kits/core-memory/deathCountShared";
import {
  BRAIN_H_RATIO,
  BRAIN_ROW,
  BrainChip,
  FIELD_CROWN_STEP,
  HumanoidRobot,
  ROBOT_H_RATIO,
  ROBOT_ROWS,
  FieldEchoRise,
} from "./superpowerField";
import { ECHO_STAGGER, ECHO_TRAVEL, RowRule, RuleClip, riseFromRule } from "./superpowerRockets";
import {
  DURATION as PLAN_DURATION,
  P_BRAIN,
  P_ROBOT,
  PAPER_REST,
  brainStart,
  cameraAt,
  isCopy,
  robotStart,
  ruleSpan,
} from "./eightCompaniesPlan";

export const FPS = 24000 / 1001;
export const DURATION = 115;
export const schema = z.object({ debugCaptions: z.boolean() });
export const defaultProps = schema.parse({ debugCaptions: false });

// the plan and the field module must agree on the layout
if (
  PLAN_DURATION !== DURATION ||
  P_BRAIN.ruleY !== BRAIN_ROW.ruleY ||
  P_BRAIN.pitch !== BRAIN_ROW.pitch ||
  P_BRAIN.size !== BRAIN_ROW.size ||
  P_BRAIN.hRatio !== BRAIN_H_RATIO ||
  P_ROBOT.ruleYs.join() !== ROBOT_ROWS.ruleYs.join() ||
  P_ROBOT.pitch !== ROBOT_ROWS.pitch ||
  P_ROBOT.size !== ROBOT_ROWS.size ||
  Math.abs(P_ROBOT.hRatio - ROBOT_H_RATIO) > 1e-9
) {
  throw new Error("EightCompaniesTwentyRobots: eightCompaniesPlan and superpowerField disagree on the layout");
}

const BRAIN_H = BRAIN_ROW.size * BRAIN_H_RATIO;
const ROBOT_H = ROBOT_ROWS.size * ROBOT_H_RATIO;
/** a chain copy starts this far below its rest: the core and all three colours wholly behind the rule */
const BRAIN_DROP = BRAIN_H + 3 * FIELD_CROWN_STEP + SHADOW_OFF + STROKE + 8;
const ROBOT_DROP = ROBOT_H + 3 * FIELD_CROWN_STEP + SHADOW_OFF + STROKE + 8;
/** how far a rule reaches past the middle of its outermost glyph */
const BRAIN_RULE_HALF = BRAIN_ROW.size / 2 + 18;
const ROBOT_RULE_HALF = ROBOT_ROWS.size / 2 + 18;
const BRAIN_SLOTS: [number, number][] = BRAIN_ROW.xs.map((x, i) => [x, brainStart(i)]);
const ROBOT_SLOTS: [number, number][][] = ROBOT_ROWS.ruleYs.map((_, r) =>
  ROBOT_ROWS.xs.map((x, c): [number, number] => [x, robotStart(r, c)]),
);

const spanProps = ([x0, x1]: [number, number]) => ({ x0, x1 });

/** the brain row: the first brain stands there from f0; seven copies rise as chain echoes */
const BrainRow: React.FC<{ frame: number; id: string }> = ({ frame, id }) => (
  <g>
    <defs>
      <RuleClip id={`${id}-brains`} x0={-4000} x1={5000} y={BRAIN_ROW.ruleY} />
    </defs>
    <g clipPath={`url(#${id}-brains)`}>
      {BRAIN_ROW.xs.map((x, i) => {
        if (i === BRAIN_ROW.first) {
          return <BrainChip key={i} x={x} y={BRAIN_ROW.base} size={BRAIN_ROW.size} />;
        }
        const s = brainStart(i);
        if (frame < s) return null;
        return (
          <FieldEchoRise
            key={i}
            Glyph={BrainChip}
            frame={frame}
            start={s}
            stagger={ECHO_STAGGER}
            travel={ECHO_TRAVEL}
            x={x}
            y={BRAIN_ROW.base}
            size={BRAIN_ROW.size}
            drop={BRAIN_DROP}
          />
        );
      })}
    </g>
    <RowRule {...spanProps(ruleSpan(frame, BRAIN_SLOTS, BRAIN_RULE_HALF))} y={BRAIN_ROW.ruleY} />
  </g>
);

/** the robot bay: each rule runs out under its robots just before they rise; the first robot rises plain, nineteen copies as chain echoes */
const RobotRows: React.FC<{ frame: number; id: string }> = ({ frame, id }) => (
  <g>
    {ROBOT_ROWS.ruleYs.map((ruleY, r) => {
      const base = ROBOT_ROWS.bases[r];
      return (
        <g key={r}>
          <defs>
            <RuleClip id={`${id}-robots-${r}`} x0={-4000} x1={5000} y={ruleY} />
          </defs>
          <g clipPath={`url(#${id}-robots-${r})`}>
            {ROBOT_ROWS.xs.map((x, c) => {
              const s = robotStart(r, c);
              if (frame < s) return null;
              if (!isCopy(r, c)) {
                const rise = riseFromRule(frame, s, ROBOT_H + SHADOW_OFF + STROKE + 8);
                return <HumanoidRobot key={c} x={x} y={base + rise.dy} size={ROBOT_ROWS.size} />;
              }
              return (
                <FieldEchoRise
                  key={c}
                  Glyph={HumanoidRobot}
                  frame={frame}
                  start={s}
                  stagger={ECHO_STAGGER}
                  travel={ECHO_TRAVEL}
                  x={x}
                  y={base}
                  size={ROBOT_ROWS.size}
                  drop={ROBOT_DROP}
                />
              );
            })}
          </g>
          <RowRule {...spanProps(ruleSpan(frame, ROBOT_SLOTS[r], ROBOT_RULE_HALF))} y={ruleY} />
        </g>
      );
    })}
  </g>
);

const EightCompaniesTwentyRobots: React.FC<z.infer<typeof schema>> = ({ debugCaptions }) => {
  const frame = useCurrentFrame();
  const cam = cameraAt(frame);
  const s = sway(frame); // screen px
  const k = cam.k;
  const cx = cam.cx - s.dx / k;
  const cy = cam.cy - s.dy / k;
  return (
    <AbsoluteFill style={{ backgroundColor: PAPER_BASE }}>
      <TallPaper frame={frame} cx={cx} cy={cy} k={k} cxRest={PAPER_REST.cx} cyRest={PAPER_REST.cy} />
      <WorldTall cx={cx} cy={cy} k={k} id="ectr">
        <BrainRow frame={frame} id="ectr" />
        <RobotRows frame={frame} id="ectr" />
      </WorldTall>
      <CaptionStripDebug on={debugCaptions} />
    </AbsoluteFill>
  );
};

export default EightCompaniesTwentyRobots;

// ---------------------------------------------------------------------------
// PROBE (stills only): f0 the brain alone, big; f1 the robot alone, big; f2
// the resolved rows at k 1; f3 a brain and a robot at row size, mid-rise
// with their crowns, at k 3.
// ---------------------------------------------------------------------------
export const PROBE_DURATION = 4;
export const FieldProbe: React.FC = () => {
  const frame = useCurrentFrame();
  const big = (node: React.ReactNode) => (
    <WorldTall cx={540} cy={960} k={1} id="probe">
      {node}
    </WorldTall>
  );
  return (
    <AbsoluteFill style={{ backgroundColor: PAPER_BASE }}>
      <TallPaper frame={0} cx={540} cy={960} k={1} />
      {frame === 0 ? big(<BrainChip x={540} y={1240} size={680} />) : null}
      {frame === 1 ? big(<HumanoidRobot x={540} y={1560} size={540} />) : null}
      {frame === 2 ? (
        <WorldTall cx={540} cy={960} k={1} id="probe2">
          <BrainRow frame={400} id="probe2" />
          <RobotRows frame={400} id="probe2" />
        </WorldTall>
      ) : null}
      {frame === 3 ? (
        <WorldTall cx={540} cy={800} k={3} id="probe3">
          <FieldEchoRise Glyph={BrainChip} frame={10} start={0} x={460} y={860} size={112} drop={200} />
          <FieldEchoRise Glyph={HumanoidRobot} frame={10} start={0} x={620} y={860} size={84} drop={300} />
          <RowRule x0={400} x1={680} y={860} />
        </WorldTall>
      ) : null}
    </AbsoluteFill>
  );
};
