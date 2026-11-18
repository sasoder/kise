import React from "react";
import { z } from "zod";
import { Pillar, StoutStage, TYPE, amberBandFor, snapLen } from "../kits/cheeky-pint/stoutShared";
import {
  DATA,
  DY,
  FIG,
  FLOOR,
  MoneyOdometer,
  PITCH,
  REST29,
  TILE_TOP,
  ValueColumn,
  X_LAKERS,
  X_MERC,
  anonFigure,
  numeralBoxOn,
  profitH,
  restCam,
  valueH,
  wAt,
} from "./worthShared";

// WorthProbe — a probe still of worthShared (builder A): `rest29` = cut 29's resolved frame (Mercedes $12B
// amber, Lakers $10B cream, at REST29); `profit` = cut 1's PROFIT scale (Cowboys $629M cream, Mercedes $300M
// amber, anonymous board field) at k 1.5625. Stills only, dy 190 as every cut. Not a cut.
export const schema = z.object({ view: z.enum(["rest29", "profit"]) });
export const defaultProps = schema.parse({ view: "rest29" });

const WorthProbe: React.FC<z.infer<typeof schema>> = ({ view }) => {
  if (view === "rest29") {
    const c = REST29.cam;
    const k = c.k;
    const band = amberBandFor(c);
    const mH = snapLen(valueH(DATA.MERC_VALUE_HI), k);
    const lH = snapLen(valueH(DATA.LAKERS_VALUE), k);
    const m = numeralBoxOn(c, X_MERC, TILE_TOP - mH, "$12B", TYPE.HERO);
    const l = numeralBoxOn(c, X_LAKERS, TILE_TOP - lH, "$10B", TYPE.SECONDARY);
    return (
      <StoutStage S={0} cam={c} pool={{ x: (X_MERC + X_LAKERS) / 2, y: TILE_TOP - 60 }} sway={false} dy={DY}>
        <ValueColumn x={X_MERC} k={k} figure={FIG.MERC} glass={mH} fill={mH} glassHi={1} amberBand={band} />
        <ValueColumn x={X_LAKERS} k={k} figure={FIG.LAKERS} glass={lH} fill={lH} fillTone="cream" glassHi={1} amberBand={band} />
        <MoneyOdometer {...wAt(c, (m.x0 + m.x1) / 2, m.base)} k={k} px={TYPE.HERO} value={12} tone="amber" glow />
        <MoneyOdometer {...wAt(c, (l.x0 + l.x1) / 2, l.base)} k={k} px={TYPE.SECONDARY} value={10} tone="cream" />
      </StoutStage>
    );
  }
  const k = 1.5625;
  const c = restCam(X_MERC - PITCH / 2, 540, 1062, k);
  const band = amberBandFor(c);
  const nodes: React.ReactNode[] = [];
  for (let j = -4; j <= 4; j++) {
    const x = X_MERC + j * PITCH;
    if (j === 0) nodes.push(<Pillar key={j} x={x} k={k} figure={FIG.MERC} bar={snapLen(profitH(DATA.MERC_PROFIT), k)} accent amberBand={band} />);
    else if (j === -1) nodes.push(<Pillar key={j} x={x} k={k} figure={FIG.COWBOYS} bar={snapLen(profitH(DATA.COWBOYS_PROFIT), k)} amberBand={band} />);
    else nodes.push(<Pillar key={j} x={x} k={k} figure={anonFigure(j + 4)} bar={snapLen(profitH(0.06 + 0.03 * ((j * 7 + 13) % 5)), k)} role="lo" amberBand={band} />);
  }
  return (
    <StoutStage S={0} cam={c} pool={{ x: X_MERC, y: FLOOR - 300 }} sway={false} dy={DY}>
      {nodes}
    </StoutStage>
  );
};
export default WorthProbe;
