import React from "react";
import { INK_HI, INK_LO, RED, RED_DEEP, Stage, paperShadow } from "./chinatalkShared";
import type { Cam } from "./chinatalkShared";
import { CHEST_Y, COL_PITCH, ROW_PITCH, SLUMP } from "./bigSwathsGeom";
import { Body, Briefcase, BriefcaseDashed, Cap, Parcel, Tile, inkAt } from "./bigSwathsGlyphs";

// ---------------------------------------------------------------------------
// bigSwathsSheet -- a still of the BigSwathsNoJob icon family (a drawing check,
// not a deliverable): the four states at the close-up scale (k 2) with the two
// travelling items on their tiles on bare paper, and a 5 x 4 block at the final-wide
// scale (k 1).
// ---------------------------------------------------------------------------

type State = "wait" | "job" | "none" | "parcel";
const Figure: React.FC<{ state: State }> = ({ state }) => {
  const ink = inkAt(INK_HI);
  // the figure that got nothing is drawn slumped: head and cap sunk into the shoulders
  const sink = state === "none" ? SLUMP : 0;
  const body =
    state === "wait" ? <Body fill={inkAt(INK_LO)} /> : state === "job" ? <Body fill={ink} /> : state === "none" ? <Body fill={RED} headDy={sink} /> : <Body fill={RED_DEEP} />;
  return (
    <g>
      {state === "none" || state === "parcel" ? <g style={{ filter: paperShadow(1) }}>{body}</g> : body}
      <g transform={`translate(0 ${sink})`}>
        <Cap />
      </g>
      <g transform={`translate(0 ${CHEST_Y})`}>
        {state === "wait" ? <BriefcaseDashed S={0} /> : null}
        {state === "job" ? <Briefcase detail={ink} /> : null}
        {state === "parcel" ? <Parcel detail={RED_DEEP} /> : null}
      </g>
    </g>
  );
};

const CAM: Cam = { x: 540, y: 960, k: 1 };
const STATES: State[] = ["wait", "job", "none", "parcel"];

const BigSwathsGlyphSheet: React.FC = () => (
  <Stage S={0} cam={CAM} rest={CAM}>
    {/* close-up scale, k 2 */}
    {STATES.map((s, i) => (
      <g key={s} transform={`translate(${220 + (i % 2) * 2 * COL_PITCH} ${70 + Math.floor(i / 2) * 2 * ROW_PITCH}) scale(2)`}>
        <Figure state={s} />
      </g>
    ))}
    {/* the travelling items on their tiles, on bare paper, k 2 */}
    <g transform="translate(920 330) scale(2)">
      <Tile fill={inkAt(INK_HI)} />
      <Briefcase detail={inkAt(INK_HI)} />
    </g>
    <g transform="translate(920 720) scale(2)">
      <Tile fill={RED_DEEP} />
      <Parcel detail={RED_DEEP} />
    </g>
    {/* final-wide scale, k 1: one row per state */}
    {STATES.map((s, r) =>
      [0, 1, 2, 3, 4].map((c) => (
        <g key={`${s}-${c}`} transform={`translate(${540 + (c - 2) * COL_PITCH} ${1000 + r * ROW_PITCH})`}>
          <Figure state={s} />
        </g>
      )),
    )}
  </Stage>
);

export default BigSwathsGlyphSheet;
