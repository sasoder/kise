// ---------------------------------------------------------------------------
// iraqMosaicWash: THE HAND-TINTED MATERIAL of the Iraq mosaic (clip
// "Sheppard_Regime_change_in_Iraq_was_the_easy_part"; Dwarkesh map style), shared by
// MosaicSocieties (24) and PickAColor (29) so both cuts are one map. Builder M,
// Oct 6 2026; lifted unchanged from PickAColor V2 (e82936c).
//
// One translucent watercolour WASH per class over the umber land in muted, CIA-inspired
// colours (old watercolour, never neon; the sand is cream-leaning, never the house
// orange), a darker pooled rim just inside each patch's edge, the baked paper mottle
// showing through. The desert (sparse) has no wash. iraqMosaicLayer's engraved cream
// hatch is printed over the washes at HATCH_OP, its cream seams on top.
//
// <MosaicWash cls op k /> one class's wash, an SVG <g> in WORLD PX (inside the world
//   svg); strokes are sized in SCREEN px (divided by k = the camera's zoom).
// <MosaicWashes k op reveal? revealOrigin? idPrefix? /> every peopled class's wash;
//   `reveal` (per REGION id, 0..1) blooms each region in behind the same soft ink front
//   as MosaicLayer's hatch reveal (same origin, reach and feather), so wash and hatch
//   arrive together.
// ---------------------------------------------------------------------------
import React from "react";
import { mixColor, type P2 } from "./iraqShared";
import {
  MOSAIC_CLASS_D,
  MOSAIC_REGIONS,
  type MosaicClass,
} from "./iraqMosaic";
import { REGIONS_BY_CLASS, regionFront } from "./iraqMosaicLayer";

export const WASH: Record<MosaicClass, string | null> = {
  kurd: "#9A7E9C", // dusty mauve
  sunni: "#C8B17E", // warm sand
  sunniKurd: "#7E6A66", // smoky brown-mauve
  shia: "#7C949A", // slate blue-grey
  shiaSunni: "#5E7176", // deeper slate
  turkoman: "#76628C", // muted violet
  sparse: null, // bare land
};
export const WASH_OP = 0.6; // a wash's body
export const WASH_FULL = 0.82; // the picked wash
export const POOL = 0.32; // the pooled rim's extra opacity
export const MUTE = 0.45; // the others recede to this fraction
export const HATCH_OP = 0.42; // the engraved hatch printed over the washes
export const SPARSE_HATCH_OP = 0.2; // the desert's stipple
export const MOSAIC_CLASS_LIST: MosaicClass[] = [
  "kurd",
  "sunni",
  "sunniKurd",
  "shia",
  "shiaSunni",
  "turkoman",
  "sparse",
];
export const PEOPLED = MOSAIC_CLASS_LIST.filter((c) => WASH[c]);

/** one class's watercolour wash: the body + a darker pooled rim just inside its edges.
 *  `d` / `clipId` override the class path (one region of the class, for a reveal). */
export const MosaicWash: React.FC<{
  cls: MosaicClass;
  op: number;
  k: number;
  d?: string;
  clipId?: string;
}> = ({ cls, op, k, d: dIn, clipId }) => {
  const col = WASH[cls];
  if (!col || op <= 0.002) return null;
  const d = dIn ?? MOSAIC_CLASS_D[cls];
  const id = clipId ?? `pkClip-${cls}`;
  const pool = mixColor(col, "#1A120C", 0.3);
  return (
    <g>
      <defs>
        <clipPath id={id}>
          <path d={d} clipRule="evenodd" />
        </clipPath>
      </defs>
      <path d={d} fillRule="evenodd" fill={col} fillOpacity={op} />
      <g clipPath={`url(#${id})`} fill="none" strokeLinejoin="round">
        <path
          d={d}
          stroke={pool}
          strokeOpacity={(POOL * 0.5 * op) / WASH_OP}
          strokeWidth={22 / k}
        />
        <path
          d={d}
          stroke={pool}
          strokeOpacity={(POOL * op) / WASH_OP}
          strokeWidth={7 / k}
        />
      </g>
    </g>
  );
};

const FEATHER = 46; // screen px: MosaicLayer's ink-front feather

/** every peopled class's wash; with `reveal`, each region blooms in behind MosaicLayer's
 *  ink front (a soft-edged disc growing from the region's point nearest revealOrigin) */
export const MosaicWashes: React.FC<{
  k: number;
  op: (cls: MosaicClass) => number;
  reveal?: Record<number, number>;
  revealOrigin?: P2;
  idPrefix?: string;
}> = ({ k, op, reveal, revealOrigin, idPrefix = "mw" }) => {
  const rv = (id: number) => {
    if (!reveal) return 1;
    const v = reveal[id];
    return v === undefined ? 0 : Math.max(0, Math.min(1, v));
  };
  const fr = FEATHER / k;
  return (
    <g>
      {PEOPLED.map((cls) => {
        const ids = REGIONS_BY_CLASS[cls];
        const vals = ids.map(rv);
        if (vals.every((v) => v <= 0)) return null;
        if (vals.every((v) => v >= 1))
          return (
            <MosaicWash
              key={cls}
              cls={cls}
              op={op(cls)}
              k={k}
              clipId={`${idPrefix}Clip-${cls}`}
            />
          );
        return (
          <React.Fragment key={cls}>
            {ids.map((id, i) => {
              const v = vals[i];
              if (v <= 0) return null;
              const r = MOSAIC_REGIONS[id];
              const w = (
                <MosaicWash
                  cls={cls}
                  op={op(cls)}
                  k={k}
                  d={r.d}
                  clipId={`${idPrefix}Clip-r${id}`}
                />
              );
              if (v >= 1) return <g key={id}>{w}</g>;
              const { o, reach } = regionFront(id, revealOrigin);
              const R = Math.max(1e-3, v * (reach + fr));
              const inner = Math.max(0, (R - fr) / R);
              const b = r.box;
              return (
                <g key={id}>
                  <defs>
                    <radialGradient
                      id={`${idPrefix}-g${id}`}
                      gradientUnits="userSpaceOnUse"
                      cx={o[0]}
                      cy={o[1]}
                      r={R}
                    >
                      <stop offset={inner} stopColor="#fff" />
                      <stop offset={1} stopColor="#000" />
                    </radialGradient>
                    <mask
                      id={`${idPrefix}-m${id}`}
                      maskUnits="userSpaceOnUse"
                      x={b.x0 - 4}
                      y={b.y0 - 4}
                      width={b.x1 - b.x0 + 8}
                      height={b.y1 - b.y0 + 8}
                    >
                      <rect
                        x={b.x0 - 4}
                        y={b.y0 - 4}
                        width={b.x1 - b.x0 + 8}
                        height={b.y1 - b.y0 + 8}
                        fill={`url(#${idPrefix}-g${id})`}
                      />
                    </mask>
                  </defs>
                  <g mask={`url(#${idPrefix}-m${id})`}>{w}</g>
                </g>
              );
            })}
          </React.Fragment>
        );
      })}
    </g>
  );
};
