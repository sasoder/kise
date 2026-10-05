// ---------------------------------------------------------------------------
// MosaicSocieties: cut C of "Sheppard_Regime_change_in_Iraq_was_the_easy_part"
// (Dwarkesh with Si Sheppard; Dwarkesh map style) on THE IRAQ WORLD (iraqShared,
// builder W) + THE MOSAIC (iraqMosaic / iraqMosaicLayer, builder M). Builder M,
// Oct 5 2026.
//
// "And here's what really is going on. Iraq and neighbors are mosaic societies.
//  There are all these different peoples there. And certainly in Iraq, primary
//  identities seem to be associated with ethnic identities more than national
//  identities. And if you could pick a color on that map, the chances are it might
//  want to kill one or two more colors on that map, right? And vice versa."
//
// IN g599 (24.958 s), 561 frames, OUT g1160. One global clock with cuts A and B:
// frame f renders g = 599 + f, and g599 continues W's IraqABScene by one step of
// the same clock (B renders g277..598; B_END = its state from g525 on: the orange
// hatch over Iraq (+ Kuwait's at 0.3), the solid orange border, the 56 orange men,
// the Baghdad dot + orange ring + label, the slow pull-back creep). The camera is
// W's camAB track (imported) with this
// cut's moves added as deltas from B_END.camRest, all starting at g >= 600.
//
// ORANGE = WHAT AMERICA TAKES ON (Iraq is still "yours": the orange border stays).
// The peoples are cream: each class of the CIA 2003 map its own engraved hatch.
//
// GESTURES (global frames; onsets in SPD/iraq/cut_frames.md):
//  C1 "And here's what really is going on" g599-700: the orange hatch (Iraq's and
//     Kuwait's) fades out (g601-650, one eased fade), the orange men fade away
//     (staggered 14 f fades, g602-648), with them the Baghdad ring, dot and label
//     (g601-632); the solid orange border stays. The camera eases out a touch
//     (k 0.905 -> 0.875, g600-700) so the neighbours' land shows round Iraq.
//  C2 "Iraq" g654: IRAQ re-lands (W's Label, cut A's style: IM Fell SC 64 px,
//     0.5 em, at cut A's spot; slide starts g646). "neighbors" g674: the
//     neighbours' land lifts a hair: a faint warm wash over their land and a soft
//     cream rim at the 0.2 rung on their side of Iraq's border (g664-688).
//  C3 "mosaic societies" g690-726: the mosaic inks in, region by region from the
//     heart outward (each region a soft ink front from its point nearest the
//     heart; starts by distance g690-702, all drawn by g726), each people at the
//     full rung in its own hatch AND value (kurd densest, sunni medium, shia
//     lighter, mixes crossed, turkoman dense small), the desert a stipple at 0.2.
//     IRAQ recedes to 0.45 (g690-720).
//  C4 "all these different peoples there" g722-758: the camera glides in
//     (k 0.875 -> 1.4, lands g756) onto the heart where the classes meet (lon
//     44.15 E, lat 34.2 N: the Baghdad-Samarra-Kirkuk belt) at y835.
//  C5 "certainly in Iraq, primary identities ... ethnic identities" g785-901: the
//     seams between two peoples (34 identity seams) draw in as solid cream lines,
//     each from its end nearest the heart at one pen speed, starts by distance
//     g785-830, all drawn by "more" g901 (ink always travelling).
//  C6 "more than national identities" g911-950: the orange national border thins
//     (W_OBJ 4.2 -> 2.0 px) and dims to 0.35; the IRAQ label leaves with it.
//  C7 "if you could pick a color on that map" g968-1004: every class but the
//     Sunni Arab drops to 0.15 (the desert to 0.1) with its seams; the Sunni Arab
//     patches stay full and their outline completes at 1.0 (their desert edges
//     draw in from the middle, g972-1004). No names. Then one slow creep-in
//     (x1.06, g1000-1062) toward the picked patch's southern lobe.
//  C8 "kill one or two" (kill g1054, one g1059, two g1068 per the word table):
//     two short bold engraved strikes (2 -> 14 px shaft, tapered barbed head),
//     drawn on, each launched inside the Sunni Arab patch near its edge and
//     landing just inside the target: south across the Shia/Sunni belt west of
//     Baghdad into the Shia Arab patch on "one" (g1050-1059), across the Kurd
//     seam between Tikrit and Kirkuk on "two" (g1057-1068); each target and its
//     seams lift to full as it is struck (12 f) and stay lit.
//  C9 "And vice versa" (vice g1126, versa g1132): the return strikes, parallel
//     counterparts 20 world px (~30 screen px) beside the outgoing ones, run back
//     into the Sunni Arab patch (8 f, g1124-1132): two two-way exchanges.
//  C10 g1068-1159: a faint cream glint travels both ways along the struck seams
//     from each crossing; the three lit classes stay lit; the creep runs on
//     (still moving at the cut).
//
// SOURCES. CIA, "Distribution of Ethnoreligious Groups and Major Tribes"
// (761864AI 1-03, 2003; public domain), the panel of the CIA/LOC sheet "Iraq:
// Country Profile" (LOC 2003629031; Commons File:Iraq country profile. LOC
// 2003629031.jpg), vectorised + georeferenced (scripts/iraq-mosaic-vectorise.py:
// outline median 1.29 km vs Natural Earth 10m). Borders: Natural Earth 10m.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  COUNTRY_D,
  IRAQ_D,
  LAND_RIM,
  DARK,
  INK,
  Highlight,
  makeRoute,
  IRAQ_CENTROID,
  W_OBJ,
  LABEL_LEAD,
  Label,
  MapStack,
  PaperTop,
  RUNG,
  SEA,
  WorldSvg,
  clamp01,
  easeInOutSine,
  hash,
  makeCamTrack,
  project,
  smoothstep,
  swayCam,
  type Cam,
  type P2,
} from "./iraqShared";
import {
  ABLabels,
  ABOver,
  ABUnder,
  B_END,
  B_END_G,
  camAB,
  type ABFade,
} from "./iraqAB";
import { MOSAIC_REGIONS, MOSAIC_SEAMS } from "./iraqMosaic";
import {
  MosaicLayer,
  SEAM_GROUPS,
  regionFront,
  type MosaicClass,
} from "./iraqMosaicLayer";

export const FPS = 24;
export const IN = 599;
export const DURATION = 561;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const ramp = (g: number, a: number, b: number) =>
  easeInOutSine((g - a) / (b - a));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// ---------------------------------------------------------------------------
// THE CAMERA: W's camAB (imported, whatever it does) + this cut's own moves as deltas
// from B's resting framing (B_END.camRest), all starting at g >= 600, so at g <= 599
// the camera is exactly W's (asserted).
// ---------------------------------------------------------------------------
export const HEART: P2 = project(44.15, 34.2);
/** the C7 creep-in target: the Sunni Arab patch's southern lobe, between both strikes */
export const PICK_FOCUS: P2 = [560, 735];
const REST = B_END.camRest;
const mine = makeCamTrack(
  [
    { p: [REST.cx, REST.cy], k: REST.k, sx: 540, sy: 960 }, // B's rest (W's creep runs to it by g700)
    { p: IRAQ_CENTROID, k: 0.875, sy: 818 }, // C1: eases out a touch
    { p: HEART, k: 1.4, sy: 835 }, // C4: the heart
    { p: HEART, k: 1.46, sy: 835 }, // the creep to the end (and past it)
    { p: PICK_FOCUS, k: 1.46 * 1.06, sy: 835 }, // C7b: the slow creep-in toward the picked patch
  ],
  [
    { from: 600, to: 700 },
    { from: 722, to: 756 },
    { from: 750, to: 1200 },
    { from: 1000, to: 1062 },
  ],
);
export const camC = (g: number): Cam => {
  const a = camAB(g);
  const m = mine(g);
  return {
    k: (a.k * m.k) / REST.k,
    cx: a.cx + m.cx - REST.cx,
    cy: a.cy + m.cy - REST.cy,
  };
};
{
  for (const g of [B_END_G, B_END_G + 1]) {
    const a = camC(g);
    const b = camAB(g);
    if (
      Math.abs(a.k - b.k) > 1e-9 ||
      Math.abs(a.cx - b.cx) > 1e-6 ||
      Math.abs(a.cy - b.cy) > 1e-6
    )
      throw new Error(`camera join: C's track differs from camAB at g${g}`);
  }
}
export const camShownC = (g: number): Cam => swayCam(camC(g), g);

// ---------------------------------------------------------------------------
// TIMING (global frames)
// ---------------------------------------------------------------------------
const TC = {
  hatchOut: [601, 650] as [number, number],
  baghdadOut: [601, 632] as [number, number],
  dotsOut: [602, 648] as [number, number],
  iraqLabel: 654 - LABEL_LEAD,
  rim: [664, 688] as [number, number],
  mosaic: [690, 726] as [number, number],
  iraqRecede: [690, 720] as [number, number],
  seams: [785, 901] as [number, number],
  national: [911, 950] as [number, number],
  pick: [968, 1000] as [number, number],
  outline: [972, 1004] as [number, number],
  glint: [1068, 1159] as [number, number],
  arc1: [1050, 1059] as [number, number],
  arc2: [1057, 1068] as [number, number],
  lift: 12,
  back: [1124, 1132] as [number, number],
};

// ---------------------------------------------------------------------------
// C3: the mosaic's per-region reveal (from the heart outward)
// ---------------------------------------------------------------------------
const FRONTS = MOSAIC_REGIONS.map((r) => ({
  id: r.id,
  ...regionFront(r.id, HEART),
}));
const MAX_DIST = Math.max(...FRONTS.map((q) => q.dist));
const MAX_REACH = Math.max(...FRONTS.map((q) => q.reach));
const REVEAL = FRONTS.map((q) => {
  const t0 = TC.mosaic[0] + 12 * (q.dist / MAX_DIST);
  const t1 = Math.min(TC.mosaic[1], t0 + 14 + 20 * (q.reach / MAX_REACH));
  return { id: q.id, t0, t1 };
});
const revealAt = (g: number): Record<number, number> =>
  Object.fromEntries(
    REVEAL.map((q) => [
      q.id,
      g >= TC.mosaic[1] ? 1 : smoothstep((g - q.t0) / (q.t1 - q.t0)),
    ]),
  );

// ---------------------------------------------------------------------------
// C5: the identity seams, drawn from their end nearest the heart at one pen speed;
// starts spread g785-830 by distance, so ink is travelling from "certainly" to "more"
// ---------------------------------------------------------------------------
const IDENT = new Set(SEAM_GROUPS.identity);
const SEAMS = MOSAIC_SEAMS.filter((s) => IDENT.has(s.id)).map((s) => {
  const a = s.pts[0];
  const b = s.pts[s.pts.length - 1];
  const da = Math.hypot(a[0] - HEART[0], a[1] - HEART[1]);
  const db = Math.hypot(b[0] - HEART[0], b[1] - HEART[1]);
  let near = Math.min(da, db);
  for (const p of s.pts)
    near = Math.min(near, Math.hypot(p[0] - HEART[0], p[1] - HEART[1]));
  return {
    id: s.id,
    len: s.len,
    from: (db < da ? "end" : "start") as "start" | "end",
    near,
  };
});
const SEAM_NEAR = Math.max(...SEAMS.map((s) => s.near));
const SEAM_T0 = Object.fromEntries(
  SEAMS.map((s) => [s.id, TC.seams[0] + 45 * (s.near / SEAM_NEAR)]),
);
const PEN = Math.max(
  ...SEAMS.map((s) => s.len / (TC.seams[1] - SEAM_T0[s.id])),
); // world px / f
const SEAM_BY_ID = Object.fromEntries(SEAMS.map((s) => [s.id, s]));
/** the Sunni Arab patches' edges against the desert (drawn in C7, completing the outline) */
export const SUNNI_EDGE = new Set(
  MOSAIC_SEAMS.filter(
    (s) => s.kind === "desert" && (s.a === "sunni" || s.b === "sunni"),
  ).map((s) => s.id),
);

// ---------------------------------------------------------------------------
// C8 / C9: the strike-arcs
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
const classAt = (p: P2): MosaicClass | null => {
  for (const r of MOSAIC_REGIONS)
    if (inRing(p, r.rings[0]) && !r.rings.slice(1).some((h) => inRing(p, h)))
      return r.cls;
  return null;
};
// short, seam-crossing strikes: each launches inside the Sunni Arab patch near its edge
// and lands just inside the target patch. Shia: straight south across the narrow
// Shia/Sunni belt west of Baghdad (the patches' closest approach there, 50 world px).
// Kurd: across the Kurd|Sunni Arab seam between Tikrit and Kirkuk.
export const STRIKE_S1: P2 = [551, 754.5]; // 1.5x the first cut (crossing midpoint 551.5, 819 kept)
export const STRIKE_SHIA: P2 = [552, 883.5];
/** the Kurd|Sunni Arab seam point nearest a probe between Tikrit and Kirkuk where both
 *  sides are clean for 34 world px (no mix / Turkoman pocket in the way) */
const KURD_SEAM = (() => {
  const probe = project(44.1, 35.2);
  let best = { d: Infinity, p: [0, 0] as P2, n: [1, 0] as P2 };
  for (const sm of MOSAIC_SEAMS) {
    if ([sm.a, sm.b].sort().join("|") !== "kurd|sunni") continue;
    for (let i = 2; i < sm.pts.length - 2; i++) {
      const q = sm.pts[i];
      const d = Math.hypot(q[0] - probe[0], q[1] - probe[1]);
      if (d >= best.d) continue;
      const a = sm.pts[i - 2];
      const b = sm.pts[i + 2];
      const l = Math.hypot(b[0] - a[0], b[1] - a[1]);
      let n: P2 = [-(b[1] - a[1]) / l, (b[0] - a[0]) / l];
      const at = (dd: number): P2 => [q[0] + n[0] * dd, q[1] + n[1] * dd];
      if (classAt(at(10)) !== "kurd") n = [-n[0], -n[1]];
      if (
        [10, 25, 40, 51].every(
          (dd) => classAt(at(dd)) === "kurd" && classAt(at(-dd)) === "sunni",
        )
      )
        best = { d, p: q, n };
    }
  }
  return best;
})();
const KURD_N = KURD_SEAM.n;
export const STRIKE_S2: P2 = [
  KURD_SEAM.p[0] - KURD_N[0] * 51,
  KURD_SEAM.p[1] - KURD_N[1] * 51,
];
export const STRIKE_KURD: P2 = [
  KURD_SEAM.p[0] + KURD_N[0] * 51,
  KURD_SEAM.p[1] + KURD_N[1] * 51,
];
if (
  classAt(STRIKE_S1) !== "sunni" ||
  classAt(STRIKE_S2) !== "sunni" ||
  classAt(STRIKE_SHIA) !== "shia" ||
  classAt(STRIKE_KURD) !== "kurd"
)
  throw new Error("strike points must lie in their classes");

/** a gentle arc a -> b (bulge = the control point's offset, a fraction of the chord),
 *  resampled evenly by arclength */
const arcCurve = (a: P2, b: P2, bulge: number, n = 72): P2[] => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const L = Math.hypot(dx, dy);
  const c: P2 = [
    (a[0] + b[0]) / 2 + (-dy / L) * bulge * L,
    (a[1] + b[1]) / 2 + (dx / L) * bulge * L,
  ];
  const dense = Array.from({ length: 300 }, (_, i) => {
    const t = i / 299;
    return [
      (1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0],
      (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1],
    ] as P2;
  });
  const cum = [0];
  for (let i = 1; i < dense.length; i++)
    cum.push(
      cum[i - 1] +
        Math.hypot(
          dense[i][0] - dense[i - 1][0],
          dense[i][1] - dense[i - 1][1],
        ),
    );
  const tot = cum[cum.length - 1];
  return Array.from({ length: n }, (_, j) => {
    const s = (tot * j) / (n - 1);
    let i = cum.findIndex((v) => v >= s);
    if (i <= 0) i = 1;
    const u = (s - cum[i - 1]) / Math.max(1e-9, cum[i] - cum[i - 1]);
    return [
      dense[i - 1][0] + (dense[i][0] - dense[i - 1][0]) * u,
      dense[i - 1][1] + (dense[i][1] - dense[i - 1][1]) * u,
    ] as P2;
  });
};
/** the return arc: the outgoing curve shifted sideways by `off` world px, run backwards
 *  (a parallel counterpart, never a lens) */
const parallelBack = (pts: P2[], off: number): P2[] => {
  const a = pts[0];
  const b = pts[pts.length - 1];
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const n: P2 = [-(b[1] - a[1]) / L, (b[0] - a[0]) / L];
  return pts.map((p) => [p[0] + n[0] * off, p[1] + n[1] * off] as P2).reverse();
};
const OFF = 20; // world px (~30 screen px at k 1.5)
export const OUT1 = arcCurve(STRIKE_S1, STRIKE_SHIA, 0.14);
export const OUT2 = arcCurve(STRIKE_S2, STRIKE_KURD, -0.14);
const ARCS: { pts: P2[]; t: [number, number] }[] = [
  { pts: OUT1, t: TC.arc1 },
  { pts: OUT2, t: TC.arc2 },
  { pts: parallelBack(OUT1, OFF), t: TC.back },
  { pts: parallelBack(OUT2, -OFF), t: TC.back },
];

/** a bold engraved strike drawn on along pts to fraction u: the shaft swells from ~2 px at
 *  the tail to ~9 px at the head end, then a tapered barbed arrowhead (screen px) */
export const StrikeArc: React.FC<{
  pts: P2[];
  u: number;
  k: number;
  opacity?: number;
  /** additions for PickAColor (defaults = this cut's cream over a dark casing) */
  color?: string;
  casing?: string;
  casingOpacity?: number;
}> = ({ pts, u, k, opacity = 1, color = INK, casing = DARK, casingOpacity = 0.55 }) => {
  if (u <= 0.001) return null;
  const cum = [0];
  for (let i = 1; i < pts.length; i++)
    cum.push(
      cum[i - 1] +
        Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]),
    );
  const tot = cum[cum.length - 1];
  const sHead = tot * clamp01(u);
  const at = (s: number): { p: P2; t: P2 } => {
    let i = cum.findIndex((v) => v >= s);
    if (i <= 0) i = 1;
    const a = pts[i - 1];
    const b = pts[i];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const w = clamp01((s - cum[i - 1]) / Math.max(1e-9, cum[i] - cum[i - 1]));
    return {
      p: [a[0] + (b[0] - a[0]) * w, a[1] + (b[1] - a[1]) * w],
      t: [(b[0] - a[0]) / l, (b[1] - a[1]) / l],
    };
  };
  const px = (v: number) => v / k;
  const grow = clamp01(sHead / px(60)); // the head grows in over the first 60 px drawn
  const HEAD = px(44) * grow;
  const BARB = px(19) * grow;
  const sBase = Math.max(0, sHead - HEAD);
  const N = 40;
  const left: P2[] = [];
  const right: P2[] = [];
  for (let j = 0; j <= N; j++) {
    const s = (sBase * j) / N;
    const { p, t } = at(s);
    const w = px(2 + 12 * (sBase > 0 ? s / Math.max(sBase, px(1)) : 0)) / 2;
    left.push([p[0] - t[1] * w, p[1] + t[0] * w]);
    right.push([p[0] + t[1] * w, p[1] - t[0] * w]);
  }
  const shaft = `M${[...left, ...right.reverse()].map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join("L")}Z`;
  const base = at(sBase);
  const tip = at(sHead).p;
  const back = at(Math.max(0, sBase - px(6) * grow)).p;
  const n: P2 = [-base.t[1], base.t[0]];
  const notch: P2 = [
    base.p[0] + base.t[0] * px(4.5) * grow,
    base.p[1] + base.t[1] * px(4.5) * grow,
  ];
  const head = [
    [back[0] + n[0] * BARB, back[1] + n[1] * BARB],
    tip,
    [back[0] - n[0] * BARB, back[1] - n[1] * BARB],
    notch,
  ] as P2[];
  const headD = `M${head.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join("L")}Z`;
  return (
    <g strokeLinejoin="round">
      <path
        d={shaft + headD}
        fill={casing}
        fillOpacity={casingOpacity * opacity}
        stroke={casing}
        strokeOpacity={casingOpacity * opacity}
        strokeWidth={px(2.6)}
      />
      <path d={shaft} fill={color} fillOpacity={opacity} />
      <path d={headD} fill={color} fillOpacity={opacity} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// C10: the struck seams (the ones each strike crosses) carry a faint travelling glint
// both ways from the crossing, g1068-1159
// ---------------------------------------------------------------------------
const segX = (a: P2, b: P2, c: P2, d: P2) => {
  const r: P2 = [b[0] - a[0], b[1] - a[1]];
  const q: P2 = [d[0] - c[0], d[1] - c[1]];
  const den = r[0] * q[1] - r[1] * q[0];
  if (Math.abs(den) < 1e-12) return null;
  const t = ((c[0] - a[0]) * q[1] - (c[1] - a[1]) * q[0]) / den;
  const v = ((c[0] - a[0]) * r[1] - (c[1] - a[1]) * r[0]) / den;
  return t >= 0 && t <= 1 && v >= 0 && v <= 1 ? t : null;
};
const STRUCK = [OUT1, OUT2].flatMap((arc) =>
  MOSAIC_SEAMS.flatMap((sm) => {
    let acc = 0;
    for (let i = 1; i < sm.pts.length; i++) {
      const seg = Math.hypot(
        sm.pts[i][0] - sm.pts[i - 1][0],
        sm.pts[i][1] - sm.pts[i - 1][1],
      );
      for (let j = 1; j < arc.length; j++) {
        const t = segX(sm.pts[i - 1], sm.pts[i], arc[j - 1], arc[j]);
        if (t !== null)
          return [{ route: makeRoute({ pts: sm.pts }), s: acc + t * seg }];
      }
      acc += seg;
    }
    return [];
  }),
);
if (STRUCK.length < 2)
  throw new Error("each strike should cross at least one seam");

// ---------------------------------------------------------------------------
// C2: the neighbours lift a hair: their land a faint LAND_RIM wash (W's IraqLand
// vocabulary at a fraction of its strength) and a soft cream rim at the 0.2 rung on
// their side of Iraq's border
// ---------------------------------------------------------------------------
const NEIGHBOURS = [
  "saudi",
  "jordan",
  "syria",
  "turkey",
  "iran",
  "kuwait",
] as const;
const NEIGH_D = NEIGHBOURS.map((n) => COUNTRY_D[n]).join("");
const NeighbourLift: React.FC<{ k: number; opacity: number }> = ({
  k,
  opacity,
}) => {
  if (opacity <= 0.002) return null;
  return (
    <g>
      <defs>
        <clipPath id="msNeigh">
          <path d={NEIGH_D} clipRule="evenodd" />
        </clipPath>
      </defs>
      <path
        d={NEIGH_D}
        fillRule="evenodd"
        fill={LAND_RIM}
        fillOpacity={0.09 * opacity}
      />
      <g clipPath="url(#msNeigh)" fill="none" strokeLinejoin="round">
        <path
          d={IRAQ_D}
          stroke={INK}
          strokeOpacity={0.08 * opacity}
          strokeWidth={22 / k}
        />
        <path
          d={IRAQ_D}
          stroke={INK}
          strokeOpacity={RUNG.low * opacity}
          strokeWidth={8 / k}
        />
      </g>
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE STATE at global frame g
// ---------------------------------------------------------------------------
const PEOPLES: MosaicClass[] = [
  "kurd",
  "sunni",
  "sunniKurd",
  "shia",
  "shiaSunni",
  "turkoman",
  "sparse",
];
const IRAQ_LABEL_AT: P2 = [600, 870]; // cut A's spot (iraqAB)

export const MosaicScene: React.FC<{ g: number }> = ({ g }) => {
  const cam = camShownC(g);
  const k = cam.k;
  // C1
  const bOut = 1 - ramp(g, ...TC.baghdadOut);
  // C2
  const rim = ramp(g, ...TC.rim);
  // C3 / C7 / C8: the classes' rungs (peoples at full from C3; the desert at 0.2)
  const pick = ramp(g, ...TC.pick);
  const hit1 = ramp(g, TC.arc1[1] - 2, TC.arc1[1] - 2 + TC.lift);
  const hit2 = ramp(g, TC.arc2[1] - 2, TC.arc2[1] - 2 + TC.lift);
  const lit = (c: MosaicClass) =>
    c === "sunni" ? 1 : c === "shia" ? hit1 : c === "kurd" ? hit2 : 0;
  const classOpacity = Object.fromEntries(
    PEOPLES.map((c) => {
      const rest = c === "sparse" ? RUNG.low : RUNG.full;
      const low = c === "sparse" ? 0.1 : 0.15;
      return [c, lerp(rest, lerp(low, rest, lit(c)), pick)];
    }),
  ) as Record<MosaicClass, number>;
  const reveal = g >= TC.mosaic[0] ? revealAt(g) : null;
  // C5 (+ C7: the seams not touching a lit class recede to 0.15; the Sunni Arab patches'
  // desert edges draw in, so the pick has its whole outline at full)
  const seamState = (sm: { id: number; a: MosaicClass; b: MosaicClass }) => {
    const on = lerp(1, lerp(0.15, 1, Math.max(lit(sm.a), lit(sm.b))), pick);
    const q = SEAM_BY_ID[sm.id];
    if (q) {
      const p = clamp01(((g - SEAM_T0[q.id]) * PEN) / q.len);
      return p > 0 ? { p, opacity: on, from: q.from } : null;
    }
    if (SUNNI_EDGE.has(sm.id)) {
      const p = ramp(g, ...TC.outline);
      return p > 0 ? { p, opacity: 1, from: "middle" as const } : null;
    }
    return null;
  };
  const glint = (g - TC.glint[0]) / (TC.glint[1] - TC.glint[0] + 1);
  // C6
  const nat = ramp(g, ...TC.national);
  const borderW = lerp(W_OBJ, 2.0, nat);
  const borderOp = lerp(1, 0.35, nat);
  // IRAQ label: lands (C2), recedes (C3), dims with the border (C6)
  const iraqOp = lerp(1, RUNG.mid, ramp(g, ...TC.iraqRecede)) * (1 - nat);
  const fade: ABFade = {
    hatch: 1 - ramp(g, ...TC.hatchOut),
    men: (i: number) =>
      1 -
      smoothstep(
        (g -
          (TC.dotsOut[0] + (TC.dotsOut[1] - TC.dotsOut[0] - 14) * hash(i, 7))) /
          14,
      ),
    baghdad: bOut,
    borderOpacity: borderOp,
    borderWidth: borderW,
  };
  return (
    <AbsoluteFill style={{ backgroundColor: SEA }}>
      <MapStack cam={cam} />
      <WorldSvg cam={cam}>
        {/* B's under-layers (land lift, rivers, neighbours' borders, the orange hatches fading: C1) */}
        <ABUnder g={g} cam={cam} fade={fade} />
        <NeighbourLift k={k} opacity={rim} />
        {/* the mosaic (C3-C9) */}
        {reveal ? (
          <MosaicLayer
            k={k}
            idPrefix="msMz"
            classOpacity={classOpacity}
            reveal={reveal}
            revealOrigin={HEART}
            seamState={seamState}
          />
        ) : null}
        {/* B's over-layers: the orange border (thinning: C6), Baghdad and the men (fading: C1) */}
        <ABOver g={g} cam={cam} fade={fade} />
        {/* the strike-arcs (C8, C9) */}
        {ARCS.map((q, i) => (
          <StrikeArc key={i} pts={q.pts} k={k} u={ramp(g, ...q.t)} />
        ))}
        {/* C10: a faint glint travelling both ways along the struck seams */}
        {glint > 0 && glint < 1
          ? STRUCK.flatMap((st, i) =>
              [-1, 1].map((dir) => (
                <Highlight
                  key={`${i}${dir}`}
                  cam={cam}
                  route={st.route}
                  s={st.s + dir * 160 * glint}
                  len={90}
                  opacity={0.55 * Math.sin(Math.PI * glint)}
                  width={4.2}
                  color={INK}
                />
              )),
            )
          : null}
      </WorldSvg>
      <ABLabels g={g} cam={cam} baghdadOpacity={bOut} />
      {g >= TC.iraqLabel ? (
        <Label
          text="IRAQ"
          x={IRAQ_LABEL_AT[0]}
          y={IRAQ_LABEL_AT[1]}
          cam={cam}
          frame={g}
          f0={TC.iraqLabel}
          size={64}
          spacing={0.5}
          dy={22}
          opacity={iraqOp}
        />
      ) : null}
      <PaperTop />
    </AbsoluteFill>
  );
};

const MosaicSocieties: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  return <MosaicScene g={IN + f} />;
};
export default MosaicSocieties;
