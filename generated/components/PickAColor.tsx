// ---------------------------------------------------------------------------
// PickAColor: "Sheppard_Regime_change_in_Iraq_was_the_easy_part" (Dwarkesh with Si
// Sheppard), the user's re-cut edit: IN f707 (29.458 s) -> OUT f865 (36.042 s), 158
// frames, jump cut in the speech at local f54 (between "map," and "chances").
// Builder M, Oct 5 2026.
//
// "And if you could pick a color on that map, the chances are it might want to kill
//  one or two more colors on that map."
//
// THE LOOK (the user, for this cut only): the CIA 2003 "Distribution of Ethnoreligious
// Groups and Major Tribes" map itself, redrawn clean from the vectorised regions
// (iraqMosaic.ts): FLAT FILLS in the CIA palette (sampled from the source), thin dark
// CIA region edges, Iraq's outline a heavier dark line, Tigris / Euphrates thin CIA blue,
// the lakes CIA pale blue (iraqLakes.ts, same georeference); outside Iraq the sheet's
// warm taupe ground with the neighbours' borders as faint dark dashes; a subtle paper
// grain + soft vignette. NO text at all (no title, legend, names, scale, table), no
// hatching, no orange. The pick and the kills are carried by the CIA colours.
//
// GESTURES (local frames; word onsets SPD/iraq/pick_frames.md). Nothing else:
//  P0 f0: the full map framed on the heart (cut C's g1000 framing), creeping from f0.
//  P1 "pick a color" f14-28: the Sunni Arab peach stays fully saturated and its dark
//     outline draws on (from each edge's middle); every other colour loses ~45 %
//     toward the taupe ground (still clearly identifiable).
//  P2 "on that map" f30-60: one slow creep-in (x1.06) toward the picked patch; a faint
//     light glint travels its outline.
//  P3 "chances are it might want to" f60-97: the hold with the creep; the peach very
//     slightly deepens (alive, never parked).
//  P4 "kill ... one" f96-105: a bold dark-ink strike (2 -> 14 px, barbed head; cut C's
//     v3 geometry) is drawn from inside the Sunni Arab patch across the belt, its head
//     landing in the Shia Arab patch on "one" f105; the Shia colour DRAINS to the
//     near-white "sparse" tone as a crisp front from the impact point (6 px feather,
//     ~20 f to cover the patch); its edges stay as thin lines, so the hole reads.
//  P5 "two" f106-114: the second strike across the Kurd seam, landing on "two" f114;
//     the same drain of the Kurd colour.
//  P6 "more colors on that map" f118-150: the camera eases back to the whole map
//     (Iraq filling the frame width, k 1.1, its centroid at y810): one strong colour, two
//     drained blanks, the rest muted. A slow creep to the end.
//
// SOURCES. CIA, "Distribution of Ethnoreligious Groups and Major Tribes" (761864AI 1-03,
// 2003; public domain), panel of "Iraq: Country Profile" (LOC 2003629031), vectorised
// and georeferenced (scripts/iraq-mosaic-vectorise.py; outline median 1.29 km vs
// Natural Earth 10m). Rivers: Natural Earth 10m (W's RIVERS_D). Borders: Natural Earth 10m.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  Highlight,
  IRAQ_CENTROID,
  IRAQ_D,
  OTHER_BORDERS_D,
  PaperTop,
  WorldSvg,
  easeInOutSine,
  hash,
  viewRect,
  makeCamTrack,
  makeRoute,
  mixColor,
  octaveDashes,
  project,
  swayCam,
  type Cam,
  type P2,
} from "./iraqShared";
import {
  MOSAIC_CLASS_D,
  MOSAIC_REGIONS,
  MOSAIC_SEAMS,
  type MosaicClass,
} from "./iraqMosaic";
import { IRAQ_LAKES_LL } from "./iraqLakes";
import { RIVERS_D } from "./iraqMapData";
import {
  OUT1,
  OUT2,
  PICK_FOCUS,
  STRIKE_KURD,
  STRIKE_SHIA,
  SUNNI_EDGE,
  StrikeArc,
  camC,
} from "./MosaicSocieties";

export const FPS = 24;
export const DURATION = 158;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const ramp = (f: number, a: number, b: number) =>
  easeInOutSine((f - a) / (b - a));

// ---------------------------------------------------------------------------
// THE CIA PALETTE (sampled from the 1044 px CIA map: its legend swatches / map fills)
// ---------------------------------------------------------------------------
export const CIA: Record<MosaicClass, string> = {
  kurd: "#D0BFC4", // lilac
  sunni: "#EFD5B8", // peach
  sunniKurd: "#AA998A", // taupe-brown
  shia: "#C7D2CE", // pale blue-grey
  shiaSunni: "#98B0AD", // slate blue-grey
  turkoman: "#B8BCCB", // violet-grey
  sparse: "#ECEEE8", // near-white
};
const GROUND = "#B7AAA2"; // the sheet's warm taupe-grey outside Iraq
const EDGE = "#4A4440"; // CIA region edges
const OUTLINE = "#3A3330"; // Iraq's outline, the strikes' ink
const RIVER = "#5E87AA";
const LAKE = "#A9C1D1";
const SUNNI_DEEP = "#F2CDA6"; // P3: the picked peach, a touch richer
const MUTE = 0.45; // P1: how far the other colours fall toward the ground

// ---------------------------------------------------------------------------
// TIMING (local frames)
// ---------------------------------------------------------------------------
const T = {
  pick: [14, 28] as [number, number],
  creepIn: [30, 60] as [number, number],
  glint: [30, 64] as [number, number],
  deepen: [60, 97] as [number, number],
  arc1: [96, 105] as [number, number],
  arc2: [106, 114] as [number, number],
  drain: 20, // frames for the front to cover the struck patch
  back: [118, 150] as [number, number],
};

// ---------------------------------------------------------------------------
// THE CAMERA: cut C's g1000 framing, then this cut's moves
// ---------------------------------------------------------------------------
const C0 = camC(1000);
const cam = makeCamTrack(
  [
    { p: [C0.cx, C0.cy], k: C0.k, sx: 540, sy: 960 }, // P0: C's framing on the heart
    { p: [C0.cx, C0.cy], k: C0.k * 1.015, sx: 540, sy: 960 }, // its creep (moving at f0)
    { p: PICK_FOCUS, k: C0.k * 1.015 * 1.06, sy: 835 }, // P2: the creep-in to the pick
    { p: PICK_FOCUS, k: C0.k * 1.015 * 1.06 * 1.015, sy: 835 }, // P3: the hold's creep
    { p: IRAQ_CENTROID, k: 1.1, sy: 810 }, // P6: the whole map
    { p: IRAQ_CENTROID, k: 1.125, sy: 810 }, // its creep (still moving at the end)
  ],
  [
    { from: -30, to: 40 },
    { from: 30, to: 62 },
    { from: 55, to: 125 },
    { from: 118, to: 152 },
    { from: 140, to: 210 },
  ],
);
export const camPick = (f: number): Cam => swayCam(cam(f), 1000 + f);

// ---------------------------------------------------------------------------
// GEOMETRY
// ---------------------------------------------------------------------------
const LAKES_D = IRAQ_LAKES_LL.map(
  (r) =>
    `M${r
      .map(([lo, la]) =>
        project(lo, la)
          .map((v) => v.toFixed(2))
          .join(","),
      )
      .join("L")}Z`,
).join("");
const ALL_EDGES_D = MOSAIC_SEAMS.map((s) => s.d).join("");
const SUNNI_OUTLINE = MOSAIC_SEAMS.filter(
  (s) => s.a === "sunni" || s.b === "sunni" || SUNNI_EDGE.has(s.id),
);
const SUNNI_MAIN = MOSAIC_REGIONS.filter((r) => r.cls === "sunni").sort(
  (a, b) => b.area - a.area,
)[0];
const GLINT_ROUTE = makeRoute({
  pts: [...SUNNI_MAIN.rings[0], SUNNI_MAIN.rings[0][0]],
});
/** the glint starts on the outline where it passes nearest the creep-in's focus */
const GLINT_S0 = (() => {
  let best = { d: Infinity, s: 0 };
  for (let s = 0; s < GLINT_ROUTE.len; s += 2) {
    const p = GLINT_ROUTE.pointAt(s);
    const d = Math.hypot(p[0] - PICK_FOCUS[0], p[1] - PICK_FOCUS[1]);
    if (d < best.d) best = { d, s };
  }
  return best.s;
})();
const RIVERS_ALL = RIVERS_D.tigris + RIVERS_D.euphrates + RIVERS_D.shatt;
/** the struck classes: impact point + the radius that covers all their regions */
const DRAINS: {
  cls: MosaicClass;
  o: P2;
  t0: number;
  speed: number;
  reach: number;
  seed: number;
}[] = (
  [
    ["shia", STRIKE_SHIA, T.arc1[1]],
    ["kurd", STRIKE_KURD, T.arc2[1]],
  ] as [MosaicClass, P2, number][]
).map(([cls, o, t0]) => {
  const regs = MOSAIC_REGIONS.filter((r) => r.cls === cls).sort(
    (a, b) => b.area - a.area,
  );
  const far = (rs: typeof regs) =>
    Math.max(
      ...rs.flatMap((r) =>
        r.rings[0].map((p) => Math.hypot(p[0] - o[0], p[1] - o[1])),
      ),
    );
  const main = far([regs[0]]);
  return {
    cls,
    o,
    t0,
    speed: main / T.drain,
    reach: far(regs),
    seed: cls === "shia" ? 11 : 23,
  };
});

/** the drain's front: a closed outline round o whose radius wobbles with seeded,
 *  low-frequency noise (+-WOB_LOW) plus a little fine grain (+-WOB_FINE); the phases drift
 *  slowly with the radius, so the front grows like ink lifting, not a scaled stamp */
const WOB_LOW = 0.16;
const WOB_FINE = 0.03;
const inkFront = (o: P2, R: number, seed: number) => {
  const N = 220;
  const ph = (i: number) => 2 * Math.PI * hash(seed, i);
  const drift = R * 0.006;
  const pts: string[] = [];
  for (let j = 0; j < N; j++) {
    const a = (2 * Math.PI * j) / N;
    const low =
      (0.5 * Math.sin(2 * a + ph(1) + drift) +
        0.32 * Math.sin(3 * a + ph(2) - 0.7 * drift) +
        0.18 * Math.sin(5 * a + ph(3) + 1.3 * drift)) /
      1.0;
    const fine =
      0.6 * Math.sin(13 * a + ph(4) + 2 * drift) +
      0.4 * Math.sin(23 * a + ph(5) - 3 * drift);
    const rr = R * (1 + WOB_LOW * low + WOB_FINE * fine);
    pts.push(
      `${(o[0] + rr * Math.cos(a)).toFixed(2)},${(o[1] + rr * Math.sin(a)).toFixed(2)}`,
    );
  }
  return `M${pts.join("L")}Z`;
};

// ---------------------------------------------------------------------------
// THE SCENE at local frame f
// ---------------------------------------------------------------------------
export const PickScene: React.FC<{ f: number }> = ({ f }) => {
  const c = camPick(f);
  const k = c.k;
  const px = (v: number) => v / k;
  const pick = ramp(f, ...T.pick);
  const deepen = ramp(f, ...T.deepen);
  const fill = (cls: MosaicClass) =>
    cls === "sunni"
      ? mixColor(CIA.sunni, SUNNI_DEEP, 0.6 * deepen)
      : mixColor(CIA[cls], GROUND, MUTE * pick);
  const outlineP = ramp(f, T.pick[0], T.pick[1]);
  const gU = (f - T.glint[0]) / (T.glint[1] - T.glint[0]);
  return (
    <AbsoluteFill style={{ backgroundColor: GROUND }}>
      <WorldSvg cam={c}>
        {/* the neighbours' borders: faint dark dashes, as on the sheet */}
        {octaveDashes(k).map((q) => (
          <path
            key={q.p}
            d={OTHER_BORDERS_D}
            fill="none"
            stroke={EDGE}
            strokeOpacity={0.4 * q.op}
            strokeWidth={px(1.3)}
            strokeDasharray={`${(q.p * 0.55).toFixed(4)} ${(q.p * 0.45).toFixed(4)}`}
          />
        ))}
        {/* the classes: flat CIA fills */}
        {(Object.keys(CIA) as MosaicClass[]).map((cls) => (
          <path
            key={cls}
            d={MOSAIC_CLASS_D[cls]}
            fillRule="evenodd"
            fill={fill(cls)}
          />
        ))}
        {/* P4 / P5: the struck colours drain to the near-white behind an irregular front
            from the impact (ink lifting off paper), feathered <= 6 px */}
        <defs>
          {DRAINS.map((d) => {
            const r = Math.max(0, (f - d.t0) * d.speed);
            const R = Math.max(
              1e-3,
              Math.min(r, (d.reach + 20) / (1 - WOB_LOW - WOB_FINE)),
            );
            const v = viewRect(c, 40);
            return (
              <React.Fragment key={d.cls}>
                <filter
                  id={`pkDrF-${d.cls}`}
                  filterUnits="userSpaceOnUse"
                  x={v.x0}
                  y={v.y0}
                  width={v.x1 - v.x0}
                  height={v.y1 - v.y0}
                >
                  <feGaussianBlur stdDeviation={px(6) / 2.5} />
                </filter>
                <mask
                  id={`pkDr-${d.cls}`}
                  maskUnits="userSpaceOnUse"
                  x={v.x0}
                  y={v.y0}
                  width={v.x1 - v.x0}
                  height={v.y1 - v.y0}
                >
                  <path
                    d={inkFront(d.o, R, d.seed)}
                    fill="#fff"
                    filter={`url(#pkDrF-${d.cls})`}
                  />
                </mask>
              </React.Fragment>
            );
          })}
        </defs>
        {DRAINS.map((d) =>
          f > d.t0 ? (
            <path
              key={d.cls}
              d={MOSAIC_CLASS_D[d.cls]}
              fillRule="evenodd"
              fill={CIA.sparse}
              mask={`url(#pkDr-${d.cls})`}
            />
          ) : null,
        )}
        {/* the lakes */}
        <path
          d={LAKES_D}
          fill={mixColor(LAKE, GROUND, 0.25 * pick)}
          stroke={EDGE}
          strokeOpacity={0.45}
          strokeWidth={px(0.9)}
        />
        {/* every region edge: thin dark CIA lines */}
        <path
          d={ALL_EDGES_D}
          fill="none"
          stroke={EDGE}
          strokeOpacity={0.7}
          strokeWidth={px(1.3)}
          strokeLinejoin="round"
        />
        {/* the rivers: thin CIA blue */}
        <path
          d={RIVERS_ALL}
          fill="none"
          stroke={RIVER}
          strokeOpacity={0.85}
          strokeWidth={px(1.5)}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Iraq's outline */}
        <path
          d={IRAQ_D}
          fill="none"
          stroke={OUTLINE}
          strokeOpacity={0.9}
          strokeWidth={px(2.8)}
          strokeLinejoin="round"
        />
        {/* P1: the picked patches' outline draws on from each edge's middle */}
        {outlineP > 0.001
          ? SUNNI_OUTLINE.map((s) => (
              <path
                key={s.id}
                d={s.d}
                pathLength={1}
                fill="none"
                stroke={OUTLINE}
                strokeWidth={px(3.4)}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={outlineP >= 1 ? undefined : `${outlineP} 1`}
                strokeDashoffset={outlineP >= 1 ? 0 : -(1 - outlineP) / 2}
              />
            ))
          : null}
        {/* P2: a faint light glint travels the outline */}
        {gU > 0 && gU < 1 ? (
          <Highlight
            cam={c}
            route={GLINT_ROUTE}
            s={GLINT_S0 + 200 * gU}
            len={140}
            opacity={0.75 * Math.sin(Math.PI * gU)}
            width={4.4}
            color="#FFF9EF"
          />
        ) : null}
        {/* P4 / P5: the strikes, dark ink over a pale paper casing */}
        <StrikeArc
          pts={OUT1}
          k={k}
          u={ramp(f, ...T.arc1)}
          color={OUTLINE}
          casing={CIA.sparse}
          casingOpacity={0.7}
        />
        <StrikeArc
          pts={OUT2}
          k={k}
          u={ramp(f, ...T.arc2)}
          color={OUTLINE}
          casing={CIA.sparse}
          casingOpacity={0.7}
        />
      </WorldSvg>
      <PaperTop vignette={0.32} grainOpacity={0.55} />
    </AbsoluteFill>
  );
};

const PickAColor: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  return <PickScene f={f} />;
};
export default PickAColor;
