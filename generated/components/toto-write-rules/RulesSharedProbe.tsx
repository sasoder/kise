// RulesSharedProbe — a probe still of rulesShared (toto-write-rules): the WildCar with every part at 0 and at 1, the
// half-way state, three CardCars in team tones, the three engineers (rest / hand up / delighted) and the three idea
// bubbles, on the golden-hour haze. Measurement only; never delivered.
import React from "react";
import { AbsoluteFill } from "remotion";
import { z } from "zod";
import { COLOR, mixHex } from "../kits/cheeky-pint/stoutShared";
import { SKY } from "../kits/cheeky-pint/droneSeaShared";
import { CardCar, ENGINEERS, Engineer, IdeaBubble, M, WildCar, engineerHead, restPose } from "./rulesShared";

export const FPS = 25;
export const DURATION = 1;
export const schema = z.object({ half: z.number().default(0.5) });
export const defaultProps = schema.parse({});

const k = 0.17;
const band: [number, number] = [0, 1920 / k];

const RulesSharedProbe: React.FC<z.infer<typeof schema>> = ({ half }) => {
  const W = (sx: number) => sx / k;
  const row = (sy: number) => sy / k;
  const size = 2.5;
  const eY = row(1880);
  return (
    <AbsoluteFill style={{ background: `linear-gradient(${SKY.glow}, ${SKY.haze} 60%, ${mixHex(SKY.haze, COLOR.board, 0.5)})` }}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <g transform={`scale(${k})`}>
          {[0, 1].map((i) => (
            <rect key={i} x={0} y={row([520, 1040][i])} width={W(1080)} height={4 / k} fill={COLOR.board} opacity={0.4} />
          ))}
          {/* row 1: WildCar all 0 (left) and all 1 (right) */}
          <WildCar x={W(240)} y={row(330)} k={k} amberBand={band} />
          <WildCar x={W(780)} y={row(330)} k={k} amberBand={band} wing={1} wing2={1} fan={1} wheels={1} fanSpin={20} />
          {/* row 2: half-way, and all 1 at speed with a driver (wing2 0) */}
          <WildCar x={W(240)} y={row(640)} k={k} amberBand={band} wing={half} fan={half} wheels={half} lift={0.25 * M} />
          <WildCar x={W(780)} y={row(640)} k={k} amberBand={band} wing={1} fan={1} wheels={1} fanSpin={10} fanSpeed={30} wheelSpeed={140} driver={"#C47B5A"} />
          {/* row 3: three CardCars in team tones (one dimmed) */}
          <CardCar x={W(240)} y={row(860)} k={k} tone="sage" driver={"#E2CFAA"} />
          <CardCar x={W(780)} y={row(860)} k={k} tone="denim" driver={"#C47B5A"} />
          <CardCar x={W(240)} y={row(1020)} k={k} tone="terracotta" driver={"#949A6A"} />
          <CardCar x={W(780)} y={row(1020)} k={k} tone="plum" dim={0.5} driver={"#E2CFAA"} />
          {/* row 4: the crew and their ideas */}
          {(() => {
            const pe = [
              { spec: ENGINEERS.lead, x: W(180), face: 1 as const, pose: restPose(), kind: "wing" as const },
              { spec: ENGINEERS.mech, x: W(540), face: -1 as const, pose: restPose({ hand: [-130, -200], smile: 0.6 }), kind: "fan" as const },
              { spec: ENGINEERS.designer, x: W(900), face: -1 as const, pose: restPose({ hand: [-150, -230], farHand: [80, -280], smile: 1, happy: 1, lean: -4, bob: 10 }), kind: "wheels" as const },
            ];
            return pe.map((e, i) => {
              const h = engineerHead(e.x, eY, size, e.face, e.pose);
              return (
                <g key={i}>
                  <Engineer x={e.x} y={eY} size={size} face={e.face} spec={e.spec} pose={e.pose} />
                  <IdeaBubble x={h[0] + 0.3 * M} y={h[1] - 1.1 * M} r={0.45 * M} kind={e.kind} k={k} amberBand={band} from={h} />
                </g>
              );
            });
          })()}
        </g>
      </svg>
    </AbsoluteFill>
  );
};
export default RulesSharedProbe;
