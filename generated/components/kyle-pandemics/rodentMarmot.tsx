// ---------------------------------------------------------------------------
// rodentMarmot: the MARK of RodentFromCentralAsia (kyle-pandemics, cut 1). The marmot, its burrow, the seep and the
// tufts are real 3D volumes (rodentSteppe3D.tsx); once the marmot is smaller than ~24 px it becomes this mark, a small
// cream dot on a dark casing at the origin (a crossfade at the same size, 24 -> 12 px).
// ---------------------------------------------------------------------------
import React from "react";
import { MOUND, toScreen, type Cam } from "./rodentCamera";
import { markAt } from "./rodentSteppe3D";

const INK = "#E9DDBF";
const DARK = "#17120D";

export const OriginMark: React.FC<{ cam: Cam }> = ({ cam }) => {
  const t = markAt(cam);
  if (t <= 0) return null;
  const c = toScreen(cam, MOUND.c[0], 0, MOUND.c[1]);
  return (
    <g opacity={t}>
      <circle cx={c.x} cy={c.y} r={6.4} fill={DARK} />
      <circle cx={c.x} cy={c.y} r={4.2} fill={INK} />
    </g>
  );
};
