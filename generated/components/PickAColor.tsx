// ---------------------------------------------------------------------------
// PickAColor (V2): "Sheppard_Regime_change_in_Iraq_was_the_easy_part" (Dwarkesh with Si
// Sheppard), the user's re-cut edit: IN f707 (29.458 s) -> OUT f865 (36.042 s), 158
// frames, jump cut in the speech at local f54 (between "map," and "chances").
// Builder M, Oct 5 2026.
//
// "And if you could pick a color on that map, the chances are it might want to kill
//  one or two more colors on that map."
//
// THE LOOK (V2, the user: "use inspiration from [the CIA map] — the main Dwarkesh map
// theme should still be the same"): cut C's Dwarkesh atlas page (W's baked map, the
// lifted Iraq land, rivers, neighbours' dashes, grain + vignette, C's camera), HAND-
// TINTED like an engraved atlas: one translucent watercolour WASH per class over the
// umber land in muted CIA-inspired colours (a darker pooled rim just inside each patch;
// the baked mottle shows through), C's engraved cream hatch (per-class densities) printed
// on top at ~0.42, C's cream seams. The desert has no wash, only C's stipple. Iraq's
// border cream (no orange in this cut). No text.
//
// GESTURES (local frames; word onsets SPD/iraq/pick_frames.md). Nothing else:
//  P0 f0: the tinted mosaic framed on the heart (cut C's g1000 framing), creeping from f0.
//  P1 "pick a color" f14-28: the Sunni Arab sand wash deepens to full and its cream
//     outline draws on at 1.0 (its desert edges from their middles); every other wash,
//     hatch and seam recedes to ~45 % (still identifiable).
//  P2 "on that map" f30-62: one slow creep-in (x1.06) toward the picked patch; a faint
//     glint travels its outline.
//  P3 "chances are it might want to" f60-97: the hold with the creep; the sand wash very
//     slightly deepens (alive, never parked).
//  P4 "kill ... one" f96-105: C's bold cream strike is drawn from inside the Sunni Arab
//     patch across the belt, landing in the Shia Arab patch on "one" f105; the Shia wash
//     and hatch LIFT OFF back to bare umber land behind an irregular ink-lift front from
//     the impact (seeded wobble, 6 px feather, ~20 f to cover the patch); its cream edges
//     stay faint (0.2) so the hole reads.
//  P5 "two" f106-114: the second strike across the Kurd seam, landing on "two" f114; the
//     same lift-off of the Kurd wash.
//  P6 "more colors on that map" f118-152: the camera eases back to the whole country
//     (k 1.1, centroid at y810): one strong colour, two bare holes, the rest muted; a
//     slow creep to the end.
//
// SOURCES. CIA, "Distribution of Ethnoreligious Groups and Major Tribes" (761864AI 1-03,
// 2003; public domain), panel of "Iraq: Country Profile" (LOC 2003629031), vectorised
// and georeferenced (scripts/iraq-mosaic-vectorise.py; outline median 1.29 km vs
// Natural Earth 10m); its palette inspired the washes. Borders, rivers: Natural Earth 10m.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  Highlight,
  INK,
  IRAQ_CENTROID,
  IraqBorder,
  MapStack,
  PaperTop,
  SEA,
  WorldSvg,
  easeInOutSine,
  hash,
  makeCamTrack,
  makeRoute,
  mixColor,
  swayCam,
  viewRect,
  type Cam,
  type P2,
} from "./iraqShared";
import { ABUnder, type ABFade } from "./iraqAB";
import { MOSAIC_CLASS_D, MOSAIC_REGIONS, type MosaicClass } from "./iraqMosaic";
import { MosaicLayer } from "./iraqMosaicLayer";
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
// THE WASHES: muted, CIA-inspired, tuned for the dark page (old watercolour, never neon;
// the sand is cream-leaning, never the house orange)
// ---------------------------------------------------------------------------
export const WASH: Record<MosaicClass, string | null> = {
  kurd: "#9A7E9C", // dusty mauve
  sunni: "#C8B17E", // warm sand
  sunniKurd: "#7E6A66", // smoky brown-mauve
  shia: "#7C949A", // slate blue-grey
  shiaSunni: "#5E7176", // deeper slate
  turkoman: "#76628C", // muted violet
  sparse: null, // bare land
};
const WASH_OP = 0.6; // a wash's body
const WASH_FULL = 0.82; // the picked wash
const POOL = 0.32; // the pooled rim's extra opacity
const MUTE = 0.45; // P1: the others recede to this fraction
const HATCH_OP = 0.42; // C's hatch printed over the washes
const CLASSES: MosaicClass[] = [
  "kurd",
  "sunni",
  "sunniKurd",
  "shia",
  "shiaSunni",
  "turkoman",
  "sparse",
];
const PEOPLED = CLASSES.filter((c) => WASH[c]);

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
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const SEAM_TOUCH = (sm: { a: MosaicClass; b: MosaicClass }, c: MosaicClass) =>
  sm.a === c || sm.b === c;

/** one class's watercolour wash: the body + a darker pooled rim just inside its edges */
const Wash: React.FC<{ cls: MosaicClass; op: number; k: number }> = ({
  cls,
  op,
  k,
}) => {
  const col = WASH[cls];
  if (!col || op <= 0.002) return null;
  const d = MOSAIC_CLASS_D[cls];
  const pool = mixColor(col, "#1A120C", 0.3);
  return (
    <g>
      <defs>
        <clipPath id={`pkClip-${cls}`}>
          <path d={d} clipRule="evenodd" />
        </clipPath>
      </defs>
      <path d={d} fillRule="evenodd" fill={col} fillOpacity={op} />
      <g clipPath={`url(#pkClip-${cls})`} fill="none" strokeLinejoin="round">
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

export const PickScene: React.FC<{ f: number }> = ({ f }) => {
  const c = camPick(f);
  const k = c.k;
  const pick = ramp(f, ...T.pick);
  const deepen = ramp(f, ...T.deepen);
  const washOp = (cls: MosaicClass) =>
    cls === "sunni"
      ? lerp(WASH_OP, WASH_FULL, pick) + 0.06 * deepen
      : WASH_OP * lerp(1, MUTE, pick);
  const hatchOp = (cls: MosaicClass) =>
    cls === "sunni"
      ? HATCH_OP + 0.06 * deepen
      : (cls === "sparse" ? 0.2 : HATCH_OP) * lerp(1, MUTE, pick);
  const drainP = (cls: MosaicClass) => {
    const d = DRAINS.find((q) => q.cls === cls);
    return d ? clamp01((f - d.t0) / T.drain) : 0;
  };
  const struck = DRAINS.filter((d) => f > d.t0);
  const v = viewRect(c, 60);
  const fade: ABFade = { hatch: 0, men: () => 0, baghdad: 0 };
  // seams: the picked outline at 1.0 (its desert edges draw on from the middle), the rest
  // recede with their colours; a drained patch's edges settle to 0.2
  const outlineP = pick;
  const seamState = (sm: {
    id: number;
    a: MosaicClass;
    b: MosaicClass;
    kind: string;
  }) => {
    if (SUNNI_EDGE.has(sm.id))
      return outlineP > 0.001
        ? { p: outlineP, opacity: 1, from: "middle" as const }
        : null;
    if (sm.kind !== "identity") return null;
    if (SEAM_TOUCH(sm, "sunni")) return { p: 1, opacity: 1 };
    let op = lerp(1, MUTE, pick);
    for (const d of DRAINS)
      if (SEAM_TOUCH(sm, d.cls)) op = lerp(op, 0.2, drainP(d.cls));
    return { p: 1, opacity: op };
  };
  const live = Object.fromEntries(
    CLASSES.map((cls) => [
      cls,
      struck.some((d) => d.cls === cls) ? 0 : hatchOp(cls),
    ]),
  ) as Record<MosaicClass, number>;
  const liftedOnly = Object.fromEntries(
    CLASSES.map((cls) => [
      cls,
      struck.some((d) => d.cls === cls) ? hatchOp(cls) : 0,
    ]),
  ) as Record<MosaicClass, number>;
  const none = Object.fromEntries(CLASSES.map((cls) => [cls, 0])) as Record<
    MosaicClass,
    number
  >;
  const gU = (f - T.glint[0]) / (T.glint[1] - T.glint[0]);
  return (
    <AbsoluteFill style={{ backgroundColor: SEA }}>
      <MapStack cam={c} />
      <WorldSvg cam={c}>
        {/* the page of cut C: the lifted Iraq land, rivers, the neighbours' dashes */}
        <ABUnder g={1159} cam={c} fade={fade} />
        {/* the masks that keep everything but what each struck wash's front has lifted */}
        <defs>
          {struck.map((d) => {
            const R = Math.max(
              1e-3,
              Math.min(
                (f - d.t0) * d.speed,
                (d.reach + 20) / (1 - WOB_LOW - WOB_FINE),
              ),
            );
            return (
              <React.Fragment key={d.cls}>
                <filter
                  id={`pkLiftF-${d.cls}`}
                  filterUnits="userSpaceOnUse"
                  x={v.x0}
                  y={v.y0}
                  width={v.x1 - v.x0}
                  height={v.y1 - v.y0}
                >
                  <feGaussianBlur stdDeviation={6 / k / 2.5} />
                </filter>
                <mask
                  id={`pkKeep-${d.cls}`}
                  maskUnits="userSpaceOnUse"
                  x={v.x0}
                  y={v.y0}
                  width={v.x1 - v.x0}
                  height={v.y1 - v.y0}
                >
                  <rect
                    x={v.x0}
                    y={v.y0}
                    width={v.x1 - v.x0}
                    height={v.y1 - v.y0}
                    fill="#fff"
                  />
                  <path
                    d={inkFront(d.o, R, d.seed)}
                    fill="#000"
                    filter={`url(#pkLiftF-${d.cls})`}
                  />
                </mask>
              </React.Fragment>
            );
          })}
        </defs>
        {/* the washes (a struck one only where its front has not reached) */}
        {PEOPLED.map((cls) => {
          const w = <Wash key={cls} cls={cls} op={washOp(cls)} k={k} />;
          return struck.some((d) => d.cls === cls) ? (
            <g key={cls} mask={`url(#pkKeep-${cls})`}>
              {w}
            </g>
          ) : (
            w
          );
        })}
        {/* C's engraved hatch printed over the washes */}
        <MosaicLayer k={k} idPrefix="pkH" classOpacity={live} />
        {struck.map((d) => (
          <g key={d.cls} mask={`url(#pkKeep-${d.cls})`}>
            <MosaicLayer
              k={k}
              idPrefix={`pkH${d.cls}`}
              classOpacity={{ ...none, [d.cls]: liftedOnly[d.cls] }}
            />
          </g>
        ))}
        {/* the seams, cream at C's weights, on top */}
        <MosaicLayer
          k={k}
          idPrefix="pkS"
          classOpacity={none}
          seamState={seamState}
        />
        {/* Iraq's border, cream */}
        <IraqBorder cam={c} />
        {/* P2: a faint glint travels the picked outline */}
        {gU > 0 && gU < 1 ? (
          <Highlight
            cam={c}
            route={GLINT_ROUTE}
            s={GLINT_S0 + 200 * gU}
            len={140}
            opacity={0.55 * Math.sin(Math.PI * gU)}
            width={4.2}
            color={INK}
          />
        ) : null}
        {/* P4 / P5: C's cream strikes */}
        <StrikeArc pts={OUT1} k={k} u={ramp(f, ...T.arc1)} />
        <StrikeArc pts={OUT2} k={k} u={ramp(f, ...T.arc2)} />
      </WorldSvg>
      <PaperTop />
    </AbsoluteFill>
  );
};

const PickAColor: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  return <PickScene f={f} />;
};
export default PickAColor;
