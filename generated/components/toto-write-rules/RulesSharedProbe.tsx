// RulesSharedProbe — a probe still of rulesShared (toto-write-rules), rev 1: the F1Car standard, fully upgraded and
// half-way through its fits, and the rival tones, on the golden-hour haze. Measurement only; never delivered.
import React from "react";
import { AbsoluteFill } from "remotion";
import { z } from "zod";
import { COLOR, mixHex } from "../kits/cheeky-pint/stoutShared";
import { SKY } from "../kits/cheeky-pint/droneSeaShared";
import { F1Car, M } from "./rulesShared";

export const FPS = 25;
export const DURATION = 1;
export const schema = z.object({ half: z.number().default(0.5) });
export const defaultProps = schema.parse({});

const k = 0.42;
const band: [number, number] = [0, 1920 / k];

const RulesSharedProbe: React.FC<z.infer<typeof schema>> = ({ half }) => {
  const W = (sx: number) => sx / k;
  const row = (sy: number) => sy / k;
  const cx = W(540) - 0.4 * M;
  return (
    <AbsoluteFill style={{ background: `linear-gradient(${SKY.glow}, ${SKY.haze} 60%, ${mixHex(SKY.haze, COLOR.board, 0.5)})` }}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <g transform={`scale(${k})`}>
          <F1Car x={cx} y={row(330)} k={k} amberBand={band} />
          <F1Car x={cx} y={row(640)} k={k} amberBand={band} upgrade={{ frontWing: 1, sidepod: 1, rearWing: 1 }} />
          <F1Car x={cx} y={row(950)} k={k} amberBand={band} upgrade={{ frontWing: half, sidepod: half * 0.6, rearWing: half * 0.3 }} />
          <F1Car x={cx} y={row(1260)} k={k} amberBand={band} tone="denim" driver="#E2CFAA" wheelSpin={300} />
          <F1Car x={cx} y={row(1540)} k={k} amberBand={band} tone="terracotta" driver="#949A6A" />
          <F1Car x={cx} y={row(1820)} k={k} amberBand={band} tone="green" driver="#C47B5A" />
        </g>
      </svg>
    </AbsoluteFill>
  );
};
export default RulesSharedProbe;
