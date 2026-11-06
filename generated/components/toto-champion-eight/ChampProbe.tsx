// ChampProbe — a probe still of champShared (toto-champion-eight): the F1 outline drawing on round a scale-1 kart, the
// filled F1 with the kid in its cockpit, the kart close at CAM_KART.k, and two stacked lanes (a board 10-year-old, a cream
// 8-year-old) with the finish line. Measurement only; never delivered.
import React from "react";
import { z } from "zod";
import { StoutStage, amberBandFor } from "../kits/cheeky-pint/stoutShared";
import { CAM_F1, CAM_KART, F1Outline, FinishLine, KID, KartWithKid, M, TrackStrip, camAt } from "./champShared";

export const schema = z.object({ draw: z.number().default(0.55) });
export const defaultProps = schema.parse({});

const k = CAM_F1.k;
const CAM = camAt(160, 0, 540, 960, k);
const gy = (sy: number) => CAM.y + (sy - 960) / k;

const ChampProbe: React.FC<z.infer<typeof schema>> = ({ draw }) => {
  const band = amberBandFor(CAM);
  const yA = gy(330);
  const yB = gy(640);
  const yC = gy(1040);
  const yD1 = gy(1330);
  const yD2 = gy(1560);
  const zoom = CAM_KART.k / k;
  const cx = 0.32 * M;
  const lane = (y: number) => <TrackStrip x0={-4000} x1={4000} top={y - 0.16 * M} bottom={y + 0.22 * M} k={k} />;
  return (
    <StoutStage S={0} cam={CAM} pool={{ x: 160, y: yC - 300 }} sway={false}>
      {lane(yA)}
      <F1Outline x={0} y={yA} k={k} draw={draw} amberBand={band} />
      <KartWithKid x={0} y={yA} k={k} />
      <F1Outline x={0} y={yA} k={k} draw={draw} amberBand={band} layer="halo" />
      {lane(yB)}
      <F1Outline x={0} y={yB} k={k} draw={1} fill={1} amberBand={band} />
      <KartWithKid x={0} y={yB} k={k} />
      <F1Outline x={0} y={yB} k={k} draw={1} fill={1} amberBand={band} layer="halo" />
      <g transform={`translate(${cx} ${yC}) scale(${zoom}) translate(${-cx} ${-yC})`}>
        {lane(yC)}
        <KartWithKid x={0} y={yC} k={CAM_KART.k} wheelSpin={30} />
      </g>
      {lane(yD1)}
      {lane(yD2)}
      <FinishLine x={1500} top={yD1 - 0.16 * M} bottom={yD1 + 0.22 * M} />
      <FinishLine x={1500} top={yD2 - 0.16 * M} bottom={yD2 + 0.22 * M} />
      <KartWithKid x={-600} y={yD1} tone="board" helmet="sage" stripe="oat" suit="plum" k={k} />
      <KartWithKid x={600} y={yD1} scale={KID.eight} helmet="terracotta" stripe="cream" suit="sage" k={k} amber={1} />
      <KartWithKid x={-600} y={yD2} scale={KID.eight} k={k} />
      <KartWithKid x={600} y={yD2} helmet="oat" stripe="rust" suit="rust" k={k} />
    </StoutStage>
  );
};
export default ChampProbe;
