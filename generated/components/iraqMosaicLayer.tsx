// ---------------------------------------------------------------------------
// iraqMosaicLayer: THE MOSAIC drawn on the Iraq world (clip
// "Sheppard_Regime_change_in_Iraq_was_the_easy_part"; Dwarkesh map style). Builder M,
// Oct 5 2026. Data: iraqMosaic.ts (scripts/build-iraq-mosaic.mjs; CIA 2003 ethnoreligious
// map, vectorised + georeferenced; the regions tile W's IRAQ_RING exactly).
//
// <MosaicLayer k ... /> is an SVG <g> in WORLD PX: put it inside the world svg (the one
// carrying the camera transform). k = the camera's zoom (screen px per world px); every
// stroke and dot is sized in SCREEN px (divided by k); the hatch spacing is world-anchored.
//
// NO COLOURS: cream ink (#E9DDBF) at the house rungs. Each class has its own engraved hatch,
// one stroke weight family (1.7 screen px lines; the stipple 1.1 px dots):
// and its own VALUE (density), so the patches read apart at phone size (CHANGED 2026-10-05):
//   kurd       lines falling 45 deg                (period 5 world px: the densest)
//   sunniKurd  sunni's horizontals + kurd's -45s   (cross-hatch, 10 each: a literal mix)
//   sunni      horizontal lines                    (7: medium)
//   shiaSunni  sunni's horizontals + shia's 45s    (cross-hatch, 15 each)
//   shia       lines rising 45 deg                 (11: lighter but clear)
//   turkoman   vertical lines                      (3.5: dense, small patches)
//   sparse     a fine sparse stipple               (nearly empty; draw it at the 0.2 rung)
//
// PROPS
//   k                  camera zoom
//   classOpacity       per class, the hatch's ink opacity (default: the peoples 1.0, sparse
//                      0.2 — CHANGED 2026-10-05; 0.15 = receded). 0 hides a class.
//   classWash          per class, an optional flat cream wash under the hatch (alpha; 0)
//   reveal             per REGION id, 0..1 (default 1): the ink front. A soft-edged disc
//                      grows from the region's point nearest `revealOrigin` until it covers
//                      the region (regionFront() gives the origin + reach; revealOrder()
//                      the regions sorted by distance from an origin, for staggering)
//   revealOrigin       world px (default IRAQ centre 540, 835)
//   seamState          (seam) => { p 0..1, opacity, from? "start" | "end" | "middle" } | null:
//                      a SOLID engraved cream line over a dark casing, drawn on along the
//                      seam (p = the drawn fraction). null / p 0 = not drawn.
//   seamWidth          screen px (default 2.2)
//   idPrefix           unique id prefix for the defs (default "mz"); one per svg
//
// HELPERS: regionFront(id, origin), revealOrder(origin), seamsBetween(a, b),
//   SEAM_GROUPS { sunniShia, arabKurd, identity, desert }, REGIONS_BY_CLASS, HATCH_SPEC
// ---------------------------------------------------------------------------
import React from "react";
import { PROJ } from "./iraqMapData";
import {
  MOSAIC_CLASSES,
  MOSAIC_CLASS_D,
  MOSAIC_PROJ,
  MOSAIC_REGIONS,
  MOSAIC_SEAMS,
  type MosaicClass,
  type MosaicSeam,
  type P2,
} from "./iraqMosaic";

if (JSON.stringify(PROJ) !== JSON.stringify(MOSAIC_PROJ))
  throw new Error(
    "iraqMosaic.ts was baked under another PROJ: re-run `bun scripts/build-iraq-mosaic.mjs`",
  );

export { MOSAIC_CLASSES, MOSAIC_REGIONS, MOSAIC_SEAMS, MOSAIC_CLASS_D };
export type { MosaicClass, MosaicSeam };

const INK = "#E9DDBF";
const DARK = "#0B0907";
export const MOSAIC_RUNG = { full: 1.0, context: 0.45, receded: 0.2 };
export const LINE_W = 1.7; // screen px, every hatch line
const DOT_R = 1.1; // screen px, the stipple

/** line direction in degrees (0 = horizontal, 45 = rising to the right), period in world px */
export const HATCH_SPEC: Record<
  MosaicClass,
  { lines: { dir: number; period: number }[]; stipple?: boolean }
> = {
  sunni: { lines: [{ dir: 0, period: 7 }] },
  shia: { lines: [{ dir: 45, period: 11 }] },
  kurd: { lines: [{ dir: -45, period: 5 }] },
  shiaSunni: {
    lines: [
      { dir: 0, period: 15 },
      { dir: 45, period: 15 },
    ],
  },
  sunniKurd: {
    lines: [
      { dir: 0, period: 10 },
      { dir: -45, period: 10 },
    ],
  },
  turkoman: { lines: [{ dir: 90, period: 3.5 }] },
  sparse: { lines: [], stipple: true },
};
const CLASS_IDS = MOSAIC_CLASSES.map((c) => c.id);
// the stipple tile: a few dots, irregular, kept off the tile's edges (world px)
const STIP_T = 30;
const STIP: P2[] = [
  [4.5, 6],
  [19, 3.5],
  [11, 15.5],
  [25.5, 13],
  [6.5, 24],
  [18.5, 25.5],
];

export const REGIONS_BY_CLASS: Record<MosaicClass, number[]> =
  Object.fromEntries(
    CLASS_IDS.map((c) => [
      c,
      MOSAIC_REGIONS.filter((r) => r.cls === c).map((r) => r.id),
    ]),
  ) as Record<MosaicClass, number[]>;

export const IRAQ_CENTRE: P2 = [540, 835];

// ---------------------------------------------------------------------------
// fronts
// ---------------------------------------------------------------------------
const inRing = ([x, y]: P2, ring: P2[]) => {
  let c = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [ax, ay] = ring[i];
    const [bx, by] = ring[j];
    if (ay > y !== by > y && x < ((bx - ax) * (y - ay)) / (by - ay) + ax)
      c = !c;
  }
  return c;
};
const inRegion = (p: P2, rings: P2[][]) =>
  inRing(p, rings[0]) && !rings.slice(1).some((h) => inRing(p, h));
const frontCache = new Map<string, { o: P2; reach: number; dist: number }>();
/** where region `id`'s ink front starts for a reveal from `origin` (its nearest vertex, or the
 *  origin itself when inside), the radius that covers it (reach), and its distance from origin */
export const regionFront = (id: number, origin: P2 = IRAQ_CENTRE) => {
  const key = `${id}:${origin[0].toFixed(1)},${origin[1].toFixed(1)}`;
  const hit = frontCache.get(key);
  if (hit) return hit;
  const r = MOSAIC_REGIONS[id];
  let o: P2 = origin;
  let dist = 0;
  if (!inRegion(origin, r.rings)) {
    dist = Infinity;
    for (const p of r.rings[0]) {
      const d = Math.hypot(p[0] - origin[0], p[1] - origin[1]);
      if (d < dist) [dist, o] = [d, p];
    }
  }
  let reach = 0;
  for (const p of r.rings[0])
    reach = Math.max(reach, Math.hypot(p[0] - o[0], p[1] - o[1]));
  const v = { o, reach, dist };
  frontCache.set(key, v);
  return v;
};
/** region ids sorted by their distance from origin (the centre outward) */
export const revealOrder = (origin: P2 = IRAQ_CENTRE) =>
  MOSAIC_REGIONS.map((r) => ({
    id: r.id,
    dist: regionFront(r.id, origin).dist,
  })).sort((a, b) => a.dist - b.dist);

// ---------------------------------------------------------------------------
// seams
// ---------------------------------------------------------------------------
const pairKey = (a: MosaicClass, b: MosaicClass) => [a, b].sort().join("|");
export const seamsBetween = (a: MosaicClass, b: MosaicClass) =>
  MOSAIC_SEAMS.filter((s) => pairKey(s.a, s.b) === pairKey(a, b)).map(
    (s) => s.id,
  );
const ARAB: MosaicClass[] = ["sunni", "shia", "shiaSunni"];
export const SEAM_GROUPS = {
  /** Sunni Arab against Shia Arab: sunni|shiaSunni, shiaSunni|shia (+ sunni|shia where they touch) */
  sunniShia: MOSAIC_SEAMS.filter((s) =>
    ["shiaSunni|sunni", "shia|shiaSunni", "shia|sunni"].includes(
      pairKey(s.a, s.b),
    ),
  ).map((s) => s.id),
  /** Arab against Kurd: kurd against any Arab class, and the Sunni Arab/Kurd mix against the Arabs */
  arabKurd: MOSAIC_SEAMS.filter(
    (s) =>
      (s.a === "kurd" && ARAB.includes(s.b)) ||
      (s.b === "kurd" && ARAB.includes(s.a)) ||
      (s.a === "sunniKurd" && ARAB.includes(s.b)) ||
      (s.b === "sunniKurd" && ARAB.includes(s.a)),
  ).map((s) => s.id),
  /** every seam between two peoples (no desert edges) */
  identity: MOSAIC_SEAMS.filter((s) => s.kind === "identity").map((s) => s.id),
  /** a people's edge against the sparsely populated class */
  desert: MOSAIC_SEAMS.filter((s) => s.kind === "desert").map((s) => s.id),
};

// ---------------------------------------------------------------------------
// the layer
// ---------------------------------------------------------------------------
export type SeamDraw = {
  p: number;
  opacity: number;
  from?: "start" | "end" | "middle";
} | null;
export type MosaicLayerProps = {
  k: number;
  classOpacity?: Partial<Record<MosaicClass, number>>;
  classWash?: Partial<Record<MosaicClass, number>>;
  reveal?: Record<number, number> | number[];
  revealOrigin?: P2;
  seamState?: (s: MosaicSeam) => SeamDraw;
  seamWidth?: number;
  idPrefix?: string;
};

const HatchPatterns: React.FC<{ k: number; px: string }> = ({ k, px }) => (
  <defs>
    {CLASS_IDS.map((c) => (
      <React.Fragment key={c}>
        {HATCH_SPEC[c].lines.map((l, i) => (
          <pattern
            key={i}
            id={`${px}-${c}-${i}`}
            patternUnits="userSpaceOnUse"
            width={l.period}
            height={l.period}
            patternTransform={`rotate(${-l.dir - 90})`}
          >
            <line
              x1={l.period / 2}
              y1={-1}
              x2={l.period / 2}
              y2={l.period + 1}
              stroke={INK}
              strokeWidth={LINE_W / k}
            />
          </pattern>
        ))}
        {HATCH_SPEC[c].stipple ? (
          <pattern
            id={`${px}-${c}-s`}
            patternUnits="userSpaceOnUse"
            width={STIP_T}
            height={STIP_T}
          >
            {STIP.map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r={DOT_R / k} fill={INK} />
            ))}
          </pattern>
        ) : null}
      </React.Fragment>
    ))}
  </defs>
);

/** the hatch fills of one class over path d (evenodd) */
const ClassFill: React.FC<{
  cls: MosaicClass;
  d: string;
  px: string;
  wash: number;
}> = ({ cls, d, px, wash }) => (
  <>
    {wash > 0.002 ? (
      <path d={d} fillRule="evenodd" fill={INK} fillOpacity={wash} />
    ) : null}
    {HATCH_SPEC[cls].lines.map((_, i) => (
      <path key={i} d={d} fillRule="evenodd" fill={`url(#${px}-${cls}-${i})`} />
    ))}
    {HATCH_SPEC[cls].stipple ? (
      <path d={d} fillRule="evenodd" fill={`url(#${px}-${cls}-s)`} />
    ) : null}
  </>
);

const FEATHER = 46; // screen px, the soft edge of the ink front

export const MosaicLayer: React.FC<MosaicLayerProps> = ({
  k,
  classOpacity = {},
  classWash = {},
  reveal,
  revealOrigin = IRAQ_CENTRE,
  seamState,
  seamWidth = 2.2,
  idPrefix = "mz",
}) => {
  const px = idPrefix;
  const rv = (id: number) => {
    if (!reveal) return 1;
    const v = (reveal as Record<number, number>)[id];
    return v === undefined ? 0 : Math.max(0, Math.min(1, v));
  };
  const fr = FEATHER / k;
  const masks: React.ReactNode[] = [];
  const classes = CLASS_IDS.map((cls) => {
    const op = classOpacity[cls] ?? (cls === "sparse" ? MOSAIC_RUNG.receded : MOSAIC_RUNG.full);
    if (op <= 0.002) return null;
    const wash = (classWash[cls] ?? 0) * 1;
    const ids = REGIONS_BY_CLASS[cls];
    const vals = ids.map(rv);
    if (vals.every((v) => v <= 0)) return null;
    const allDone = vals.every((v) => v >= 1);
    const done = ids.filter((_, i) => vals[i] >= 1);
    const partial = ids.filter((_, i) => vals[i] > 0 && vals[i] < 1);
    for (const id of partial) {
      const { o, reach } = regionFront(id, revealOrigin);
      const R = Math.max(1e-3, rv(id) * (reach + fr));
      const inner = Math.max(0, (R - fr) / R);
      const b = MOSAIC_REGIONS[id].box;
      masks.push(
        <React.Fragment key={`m${id}`}>
          <radialGradient
            id={`${px}-g${id}`}
            gradientUnits="userSpaceOnUse"
            cx={o[0]}
            cy={o[1]}
            r={R}
          >
            <stop offset={inner} stopColor="#fff" />
            <stop offset={1} stopColor="#000" />
          </radialGradient>
          <mask
            id={`${px}-m${id}`}
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
              fill={`url(#${px}-g${id})`}
            />
          </mask>
        </React.Fragment>,
      );
    }
    return (
      <g key={cls} opacity={op}>
        {allDone ? (
          <ClassFill cls={cls} d={MOSAIC_CLASS_D[cls]} px={px} wash={wash} />
        ) : (
          <>
            {done.length ? (
              <ClassFill
                cls={cls}
                d={done.map((id) => MOSAIC_REGIONS[id].d).join("")}
                px={px}
                wash={wash}
              />
            ) : null}
            {partial.map((id) => (
              <g key={id} mask={`url(#${px}-m${id})`}>
                <ClassFill
                  cls={cls}
                  d={MOSAIC_REGIONS[id].d}
                  px={px}
                  wash={wash}
                />
              </g>
            ))}
          </>
        )}
      </g>
    );
  });
  const seamEls: React.ReactNode[] = [];
  if (seamState)
    for (const s of MOSAIC_SEAMS) {
      const st = seamState(s);
      if (!st || st.p <= 0.0005 || st.opacity <= 0.002) continue;
      const p = Math.min(1, st.p);
      const dash = p >= 1 ? undefined : `${p} 1`;
      const off =
        p >= 1
          ? 0
          : st.from === "end"
            ? -(1 - p)
            : st.from === "middle"
              ? -(1 - p) / 2
              : 0;
      const common = {
        d: s.d,
        pathLength: 1,
        strokeDasharray: dash,
        strokeDashoffset: off,
        fill: "none",
      } as const;
      seamEls.push(
        <g key={s.id} strokeLinecap="round" strokeLinejoin="round">
          <path
            {...common}
            stroke={DARK}
            strokeOpacity={0.55 * st.opacity}
            strokeWidth={(seamWidth + 2.6) / k}
          />
          <path
            {...common}
            stroke={INK}
            strokeOpacity={st.opacity}
            strokeWidth={seamWidth / k}
          />
        </g>,
      );
    }
  return (
    <g>
      <HatchPatterns k={k} px={px} />
      {masks.length ? <defs>{masks}</defs> : null}
      {classes}
      {seamEls}
    </g>
  );
};
