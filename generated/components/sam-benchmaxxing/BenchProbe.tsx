// BenchProbe — benchShared's probe stills (never delivered). Frame 0: the chart row at rest (cut 1's even chart at
// EVEN_LOOK, the jet far back). Frame 1: ThingCard "science" back / mid-flip / front. Frame 2: "nice" back /
// mid-flip / front. Frame 3: the empty column, the two BenchTiles, the OpenAI tile at lean 0 and -8, every lab mark.
// Render with --gl=angle.
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { amberBandFor } from "../kits/cheeky-pint/stoutShared";
import {
  BenchColumn,
  BenchContrail,
  BenchJet,
  BenchStage,
  BenchTile,
  CUT1_JET,
  EVEN_LOOK,
  EVEN_RUNGS,
  GROUND,
  LAB_MARKS,
  LAB_MARK_OF,
  LabTile,
  OPENAI_SLOT,
  OpenAITile,
  ROW,
  ThingCard,
  rowX,
  type LabMark,
  type Look,
} from "./benchShared";

export const FPS = 24000 / 1001;
export const DURATION = 4;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const Row: React.FC<{ look: Look }> = ({ look }) => (
  <>
    {EVEN_RUNGS.map((r, i) => {
      const mark = LAB_MARK_OF[i];
      return (
        <BenchColumn
          key={i}
          x={rowX(i)}
          base={GROUND}
          rungs={r}
          fill={i === OPENAI_SLOT ? "amber" : "board"}
          k={look.k}
          band={amberBandFor(look)}
          cap={(top) =>
            mark ? <LabTile x={rowX(i)} floor={top} size={ROW.tile} k={look.k} mark={mark} /> : <OpenAITile x={rowX(i)} floor={top} size={ROW.tile} k={look.k} />
          }
        />
      );
    })}
  </>
);

const BenchProbe: React.FC = () => {
  const f = useCurrentFrame();
  if (f === 0) {
    const look = EVEN_LOOK;
    return (
      <BenchStage look={look} S={20} world={<BenchJet spec={CUT1_JET} f={20} />} under={<BenchContrail look={look} spec={CUT1_JET} f={20} />}>
        <Row look={look} />
      </BenchStage>
    );
  }
  if (f === 1 || f === 2) {
    const look: Look = { x: 540, y: 1180, k: 1 };
    const id = f === 1 ? "science" : "nice";
    const flips = [0, f === 1 ? 0.36 : 0.62, 1];
    return (
      <BenchStage look={look} S={0}>
        {flips.map((fl, i) => (
          <ThingCard key={i} id={id} x={190 + i * 350} floor={GROUND} w={300} k={look.k} flip={fl} band={amberBandFor(look)} />
        ))}
      </BenchStage>
    );
  }
  const look: Look = { x: 540, y: 1180, k: 1 };
  const marks = Object.keys(LAB_MARKS) as LabMark[];
  return (
    <BenchStage look={look} S={0}>
      <BenchColumn x={150} base={GROUND} rungs={5} fill="empty" k={1} />
      <BenchColumn x={330} base={GROUND} rungs={3} fill="board" k={1} />
      <BenchTile id="swe" x={620} floor={GROUND - 20} w={240} k={1} />
      <BenchTile id="aime" x={900} floor={GROUND - 20} w={240} k={1} />
      <OpenAITile x={330} floor={700} size={220} k={1} />
      <OpenAITile x={720} floor={700} size={220} k={1} lean={-8} pivotX={-70} glow={0.6} />
      {marks.map((m, i) => (
        <LabTile key={m} x={110 + i * 172} floor={1000} size={150} k={1} mark={m} />
      ))}
    </BenchStage>
  );
};
export default BenchProbe;
