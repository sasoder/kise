// ---------------------------------------------------------------------------
// FurtherAwayLower (sarah-insurgency, cut 96). The clip's one-off "Dwarkesh 3D map" look (COMMON.md): the
// insurgency-atlantic vintage map laid as the floor in the misty 3D air (the clip kit ./insurgencyShared, its header
// is the API). Opaque 1080x1920, 24 fps, 112 frames. RENDER WITH --gl=angle (the ground is WebGL2).
//
// CHECK LINE: a power intervening from far across an ocean has far less at stake than the people at home: the further
// away it comes from, the smaller its stake.
//
// THE LINE: "If you're intervening, the further away you're intervening from, probably the lower the value of the
// object."
// WORD -> FRAME (f0 = 96.917 s): If -4 · you're 3 · INTERVENING 6 · the 24 · FURTHER 27 · AWAY 36 · you're 42 ·
//   intervening 48 · from 59 · probably 65 · the 72 · LOWER 77 · the 83 · VALUE 87 · of 94 · the 97 · OBJECT 98
// DURATION: the slot 96.917 -> 101.583 s = 4.667 s x 24 = 112 frames (f0..f111).
//
// THE MOTION: one continuous camera from cut 91 ItsHome's END state (./itsHomeState END_KEY: the same world, the same
// farmhouse, the same tall orange value column; not a pixel join, 2 s of speaker between). f0-66 the camera cranes up
// (eye ~34 -> ~100 world) and dollies back west while the lens closes in (F 1300 -> ~2500: the orange column keeps its
// size, ~45 % of the frame) and the far haze lifts: the Atlantic opens behind the farm as a real receding floor, with
// Britain far in the haze near the horizon and a CREAM value column standing at London (a pre-1801 Union pennant on
// its staff). f6-60 "INTERVENING ... the further away you're intervening from": a cream dashed route draws itself
// from London across the ocean to the New England coast, its tip at constant speed (a short ease as it lands), and
// London's column SHRINKS in step with the tip's straight-line distance from London (height = a linear function of
// it: the visible cause). f60-111 "probably the LOWER the VALUE of the object": the payoff frame holds both: the tall
// orange column near over the farmhouse, the short cream column far in the haze; a slow living creep, smoke, motes.
// CAUSE / REACTION: the tip leaves London on f6 (contact: the route starts at the column's foot); the column's capital
// starts to drop on f7.
// Orange = home's value (the column over the farmhouse, the hearth window). Cream = the intervener (Britain's column,
// the route). No labels, no numbers, no people.
//
// DEPTH: eye from ~34 to ~100 world (1 world = ~1 km); the orange column 112 tall at ~330 from the eye at the payoff;
// London ~5800 from the eye (the real map distance). The cream column at London is a wargame piece at the map's scale
// (it has to read across ~5800 km of map): start height LON.h0, end LON.h1 world units, r LON.r. The fog: the kit's
// fogFor(cam), its distances stretched by fogK (1 at f0 = cut 91's fog, 2.5 by f30) as the haze lifts; London's
// standing piece and pennant take their own scheduled haze (lonHaze: 1 at f0, so unseen exactly as in cut 91, 0.5
// by f22, 0.3 at the payoff; its light tones lean warm ivory (warmLit); it emerges on farHaze), Britain's land a sliver under it (FarShore), the route a capped haze so it reads to
// London. The camera: one lobe f0-66 (speed peaks ~f40, settled by f68), then a creep of ~1 % in D and F.
// CAPTION BANDS: the orange column's foot, the house foot (~y 1000-1060) above band 1; London's column, pennant and
// the route's landing in the upper half. Only the open map lies in the bands.
//
// SOURCES: London 51.51 N 0.13 W (COMMON.md, the map's PLACES.london); the farmhouse and column from cut 91
// (itsHomeState, west bank of the Hudson near Kingston, NY). The landing point is the New England coast near
// Portsmouth, NH (43.07 N, 70.76 W) on the map's straight line of sight from the farm; the course across is
// illustrative (a gentle southward bow like a sailing passage), not a sourced route. Boston to London ~5,300 km, 6-8
// weeks under sail (COMMON.md; header only, nothing on screen). The field parcels are cut 91's (illustrative).
// ---------------------------------------------------------------------------
import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import { mixHex } from "../kits/dwarkesh-3d/dwarkesh3d";
import {
  ATLANTIC,
  FLAG_H,
  FLAG_INK,
  FLAG_W,
  FlagArt,
  Farmhouse,
  HorizonHaze,
  INK,
  InsurgencyStage,
  MapGround3D,
  ValueColumn,
  WorldLayer,
  camOfKey,
  camTrack,
  fogFor,
  insWorld,
  sortFarToNear,
  toScreen,
  type Cam,
  type CamKey,
  type Fog,
  type InsWorld,
  type P2,
} from "./insurgencyShared";
import {
  COLUMN,
  COLUMN_FACE,
  END_KEY,
  END_VEL,
  HOUSE,
  HUDSON,
  YAW,
  offsetFrom,
} from "./itsHomeState";
import {
  ChimneySmoke,
  FarmFields,
  River,
  chimneyTop,
  type Field,
} from "./itsHomeWorld";

export const FPS = 24;
export const DURATION = 112;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// ---- the camera --------------------------------------------------------------------------------------------------
/** the payoff camera (f66): the target as cut 91's, the eye up and back, a longer lens */
const PAYOFF: CamKey = {
  f: 66,
  x: END_KEY.x,
  z: END_KEY.z,
  ty: 10,
  D: 325,
  pitch: 16,
  yaw: 79.4,
  F: 2500,
};
/** one continuous camera: cut 91's slow drift carried in (f-30 -> f0 = END_VEL), the crane up and back with the lens
 *  closing in (f0-66, one lobe), then a slow living creep */
const KEYS: CamKey[] = [
  {
    ...END_KEY,
    f: -30,
    x: END_KEY.x - 30 * END_VEL.x,
    z: END_KEY.z - 30 * END_VEL.z,
    ty: (END_KEY.ty ?? 0) - 30 * END_VEL.ty,
    D: END_KEY.D - 30 * END_VEL.D,
    pitch: END_KEY.pitch - 30 * END_VEL.pitch,
    yaw: END_KEY.yaw - 30 * END_VEL.yaw,
  },
  { ...END_KEY, f: 0 },
  {
    f: 30,
    x: END_KEY.x,
    z: END_KEY.z,
    ty: 10.5,
    D: 232,
    pitch: 11.2,
    yaw: 79.4,
    F: 1780,
  },
  PAYOFF,
  {
    f: 111,
    x: END_KEY.x + 1.5,
    z: END_KEY.z - 0.5,
    ty: 10,
    D: 334,
    pitch: 16.3,
    yaw: 79.6,
    F: 2560,
  },
];
export const camAt = camTrack(KEYS, 140);
const REST = camAt(0);

const FOG_KMAX = 2.5;
/** the haze lifts: the fog's distances stretched by FOG_K (1 = cut 91's fog) */
const fogK = (frame: number) =>
  interpolate(frame, [0, 30], [1, FOG_KMAX], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.sin),
  });
const stretchFog = (f: Fog, k: number): Fog => ({
  a0: f.a0 * k,
  a1: f.a1 * k,
  m: f.m,
  b0: f.b0 * k,
  b1: f.b1 * k,
  c0: f.c0 * k,
  c1: f.c1 * k,
});

// ---- the world ---------------------------------------------------------------------------------------------------
const H: P2 = [HOUSE.x, HOUSE.z];
/** cut 91's field parcels round the farm (illustrative; copied from ItsHome.tsx, which does not export them) */
const parcel = (q: [number, number][], furrow: number): Field => ({
  q: q.map(([f, r]) => offsetFrom(H, f, r)) as Field["q"],
  furrow,
});
const FIELDS: Field[] = [
  parcel(
    [
      [-5, -17],
      [-35, -15],
      [-35, -48],
      [-5, -46],
    ],
    1.8,
  ),
  parcel(
    [
      [-7, 17],
      [-31, 15],
      [-33, 36],
      [-8, 38],
    ],
    2.0,
  ),
  parcel(
    [
      [7, -52],
      [33, -50],
      [34, -12],
      [8, -14],
    ],
    1.9,
  ),
  parcel(
    [
      [-40, -50],
      [-40, -20],
      [-68, -18],
      [-70, -52],
    ],
    2.1,
  ),
  parcel(
    [
      [-38, 10],
      [-38, 34],
      [-62, 37],
      [-63, 9],
    ],
    1.9,
  ),
  parcel(
    [
      [-74, -58],
      [-104, -56],
      [-106, -14],
      [-75, -16],
    ],
    2.2,
  ),
  parcel(
    [
      [-72, -6],
      [-72, 30],
      [-108, 33],
      [-110, -4],
    ],
    2.4,
  ),
  parcel(
    [
      [-116, -40],
      [-116, 6],
      [-160, 8],
      [-162, -43],
    ],
    2.6,
  ),
  parcel(
    [
      [-118, 16],
      [-160, 18],
      [-163, 52],
      [-120, 50],
    ],
    2.3,
  ),
];
const CHIMNEY = chimneyTop(HOUSE.x, HOUSE.z, HOUSE.size, HOUSE.face);
/** cut 91's smoke had been running ~51 f at its last frame, plus the 2 s of speaker between */
const SMOKE_FRAME0 = 130;

// ---- London and the route ----------------------------------------------------------------------------------------
const LONDON = ATLANTIC.PLACES.london;
/** the landing: the New England coast near Portsmouth, NH, on the line of sight from the farm */
const LANDING: P2 = ATLANTIC.project(-70.76, 43.07);
/** London's cream value column (world units at the map's scale): h0 at London, h1 once the route has crossed */
const LON = {
  r: 36,
  h0: 1700,
  h1: 240,
  staff: 95,
  flagW: 118,
  face: PAYOFF.yaw + 180,
} as const;
/** the course: London -> the landing with a gentle southward bow (illustrative), sampled densely */
const ROUTE: P2[] = (() => {
  const n = 160;
  const dx = LANDING[0] - LONDON[0];
  const dz = LANDING[1] - LONDON[1];
  const len = Math.hypot(dx, dz);
  // the left normal of the direction of travel (westward) points south on the map: +z
  const nx = -dz / len;
  const nz = dx / len;
  const south = nz > 0 ? 1 : -1;
  const BOW = 330;
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    const b = BOW * Math.sin(Math.PI * t) * (1 - 0.25 * t);
    return [
      LONDON[0] + dx * t + south * nx * b,
      LONDON[1] + dz * t + south * nz * b,
    ] as P2;
  });
})();
const CUM: number[] = ROUTE.reduce<number[]>(
  (a, p, i) =>
    i === 0
      ? [0]
      : [
          ...a,
          a[i - 1] + Math.hypot(p[0] - ROUTE[i - 1][0], p[1] - ROUTE[i - 1][1]),
        ],
  [],
);
const ROUTE_LEN = CUM[CUM.length - 1];
const pointAt = (s: number): P2 => {
  const v = Math.max(0, Math.min(ROUTE_LEN, s));
  let i = 1;
  while (i < CUM.length - 1 && CUM[i] < v) i++;
  const q = (v - CUM[i - 1]) / Math.max(1e-9, CUM[i] - CUM[i - 1]);
  return [
    ROUTE[i - 1][0] + (ROUTE[i][0] - ROUTE[i - 1][0]) * q,
    ROUTE[i - 1][1] + (ROUTE[i][1] - ROUTE[i - 1][1]) * q,
  ];
};
/** the tip's schedule: leaves London on DRAW.f0, constant speed, eases over the last DRAW.ease frames, lands DRAW.f1 */
const DRAW = { f0: 6, f1: 60, ease: 10 } as const;
const tipU = (frame: number) => {
  const T = DRAW.f1 - DRAW.f0;
  const t = Math.max(0, Math.min(T, frame - DRAW.f0));
  const v = 1 / (T - DRAW.ease / 2);
  const tc = T - DRAW.ease;
  if (t <= tc) return v * t;
  const e = t - tc;
  return Math.min(1, v * tc + v * (e - (e * e) / (2 * DRAW.ease)));
};
const LAND_DIST = Math.hypot(LANDING[0] - LONDON[0], LANDING[1] - LONDON[1]);
/** London's column height from the tip's straight-line distance from London (the visible cause) */
const londonHeight = (tip: P2) => {
  const d = Math.hypot(tip[0] - LONDON[0], tip[1] - LONDON[1]) / LAND_DIST;
  return LON.h0 + (LON.h1 - LON.h0) * Math.max(0, Math.min(1, d));
};
/** the dashes, laid once in world space (no crawl): each dash's length and width grow with its distance from the
 *  payoff eye, so the dashed line reads even along its length on screen */
const EYE_REF = camOfKey(PAYOFF).C;
const DASHES: { s0: number; s1: number }[] = (() => {
  const out: { s0: number; s1: number }[] = [];
  let s = 0;
  while (s < ROUTE_LEN) {
    const p = pointAt(s);
    const dist = Math.hypot(p[0] - EYE_REF[0], EYE_REF[1], p[1] - EYE_REF[2]);
    const len = 0.04 * dist;
    out.push({ s0: s, s1: Math.min(ROUTE_LEN, s + len) });
    s += len * 1.7;
  }
  return out;
})();

/** a dash's centreline on the ground between arclengths a and b, projected (null if any point is at the lens) */
const dashLine = (A: InsWorld, a: number, b: number) => {
  const n = Math.max(2, Math.ceil((b - a) / (ROUTE_LEN / 400)));
  const pts: string[] = [];
  let sMid = 0;
  for (let i = 0; i <= n; i++) {
    const p = pointAt(a + ((b - a) * i) / n);
    const q = toScreen(A.cam, p[0], 0, p[1]);
    if (q.z < 5) return null;
    if (i === Math.floor(n / 2)) sMid = q.s;
    pts.push(`${q.x.toFixed(2)},${q.y.toFixed(2)}`);
  }
  return { d: `M${pts.join("L")}`, s: sMid };
};
/** the route's stroke (screen px) at a ground scale s (px per world unit): a little heavier near, never a hairline far */
const routePx = (s: number) => Math.min(8, 3.4 + 1.3 * s);
/** the cream dashed route, drawn to arclength `to`, with a small round tip where it is being drawn */
const Route: React.FC<{ A: InsWorld; to: number; tipOn: boolean }> = ({
  A,
  to,
  tipOn,
}) => {
  if (to <= 0) return null;
  const els: React.ReactNode[] = [];
  DASHES.forEach((d, i) => {
    if (d.s0 >= to) return;
    const b = Math.min(d.s1, to);
    const m = pointAt((d.s0 + b) / 2);
    const dist = A.dist(m[0], 0, m[1]);
    const ln = dashLine(A, d.s0, b);
    if (ln)
      els.push(
        <path
          key={i}
          d={ln.d}
          fill="none"
          stroke={A.tone(INK.cream, dist)}
          strokeWidth={routePx(ln.s).toFixed(2)}
          strokeLinecap="butt"
          strokeLinejoin="round"
        />,
      );
  });
  let tip: React.ReactNode = null;
  if (tipOn) {
    const p = pointAt(to);
    const dist = A.dist(p[0], 0, p[1]);
    const c = toScreen(A.cam, p[0], 0, p[1]);
    const rx = routePx(c.s) * 0.75;
    const ry = rx * 0.75;
    tip = (
      <ellipse
        cx={c.x.toFixed(2)}
        cy={c.y.toFixed(2)}
        rx={rx.toFixed(2)}
        ry={ry.toFixed(2)}
        fill={A.tone("#FBF3E2", dist)}
      />
    );
  }
  return (
    <g>
      {els}
      {tip}
    </g>
  );
};

/** a world with a reduced share of the haze as the fog lifts (the route's base haze, capped by minHaze) */
const clearer = (A: InsWorld, clear: number): InsWorld => {
  // the clear share of the haze is multiplied: fully hazed stays fully hazed (invisible at f0, = cut 91), thin haze
  // thins faster
  const hazeAt = (dist: number) =>
    Math.max(0, Math.min(1, 1 - (1 - A.hazeAt(dist)) * (1 + clear)));
  const mix = (hex: string, dist: number, k: number) => {
    const c = A.airAt(dist);
    return mixHex(
      hex,
      `#${c.map((q) => Math.round(q).toString(16).padStart(2, "0")).join("")}`,
      k,
    );
  };
  return {
    ...A,
    hazeAt,
    tone: (hex, dist) => mix(hex, dist, hazeAt(dist)),
    toneO: (hex, dist) => mix(hex, dist, 0.5 * hazeAt(dist)),
  };
};

const ROUTE_CLEAR = 3;
/** the haze AT London over the cut: fully hazed at f0 (= cut 91: London unseen), lifting as the camera rises (the far
 *  shore emerges f6-20), thinning a little more to the payoff */
const farHaze = (frame: number) =>
  interpolate(frame, [3, 22, 64], [1, 0.66, 0.5], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.sin),
  });
/** the haze on London's own column and pennant: thinner than the far air round it (~0.3 at the payoff), so the
 *  intervener reads as cream / ivory, still softer and lower in contrast than the near orange column */
const lonHaze = (frame: number) =>
  interpolate(frame, [3, 22, 64], [1, 0.5, 0.3], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.sin),
  });
/** the warm light on London's cream: its light tones (the lit side, the abacus top, the rims) lean ivory */
const WARM_IVORY = "#FFD27E";
const lumOf = (hex: string) => {
  const n = parseInt(hex.slice(1, 7), 16);
  return (
    (0.2126 * ((n >> 16) & 255) +
      0.7152 * ((n >> 8) & 255) +
      0.0722 * (n & 255)) /
    255
  );
};
const warmLit = (hex: string) =>
  hex.startsWith("#") && hex.length >= 7
    ? mixHex(
        hex,
        WARM_IVORY,
        0.9 * Math.max(0, Math.min(1, (lumOf(hex) - 0.42) / 0.3)),
      )
    : hex;
/** London's far world: the same air, the haze at London set by a schedule (fogged toward the air there); warm =
 *  its light tones catch the warm light */
const farWorld = (A: InsWorld, hz: number, warm = false): InsWorld => {
  const hazeAt = () => hz;
  const mix = (hex0: string, dist: number, k: number) => {
    const c = A.airAt(dist);
    const hex = warm ? warmLit(hex0) : hex0;
    return mixHex(
      hex,
      `#${c.map((q) => Math.round(q).toString(16).padStart(2, "0")).join("")}`,
      k,
    );
  };
  return {
    ...A,
    hazeAt,
    tone: (hex, dist) => mix(hex, dist, hz),
    toneO: (hex, dist) => mix(hex, dist, 0.5 * hz),
  };
};

/** a world whose haze never exceeds `cap` (the route reads as far as London does) */
const minHaze = (A: InsWorld, cap: number): InsWorld => {
  const hazeAt = (dist: number) => Math.min(cap, A.hazeAt(dist));
  const mix = (hex: string, dist: number, k: number) => {
    const c = A.airAt(dist);
    return mixHex(
      hex,
      `#${c.map((q) => Math.round(q).toString(16).padStart(2, "0")).join("")}`,
      k,
    );
  };
  return {
    ...A,
    hazeAt,
    tone: (hex, dist) => mix(hex, dist, hazeAt(dist)),
    toneO: (hex, dist) => mix(hex, dist, 0.5 * hazeAt(dist)),
  };
};

/** the Union pennant on its staff over London's column (the pre-1801 Union, two-tone), billboarded to the lens */
const Pennant: React.FC<{
  A: InsWorld;
  x: number;
  z: number;
  y0: number;
  frame: number;
}> = ({ A, x, z, y0, frame }) => {
  const dist = A.dist(x, y0, z);
  const fz = A.hazeAt(dist);
  const foot = toScreen(A.cam, x, y0, z);
  const top = toScreen(A.cam, x, y0 + LON.staff, z);
  const sc = (LON.flagW * top.s) / FLAG_W;
  const air = A.airAt(dist);
  const airHex = `#${air.map((q) => Math.round(q).toString(16).padStart(2, "0")).join("")}`;
  const sway = 1.6 * Math.sin(frame * 0.17);
  const sw = Math.max(1.2, LON.r * 0.22 * top.s);
  return (
    <g>
      <line
        x1={foot.x.toFixed(2)}
        y1={foot.y.toFixed(2)}
        x2={top.x.toFixed(2)}
        y2={(top.y - 0.6 * sw).toFixed(2)}
        stroke={A.tone("#4A3E30", dist)}
        strokeWidth={sw.toFixed(2)}
        strokeLinecap="round"
      />
      <g
        transform={`translate(${(top.x + sw * 0.4).toFixed(2)},${top.y.toFixed(2)}) skewY(${sway.toFixed(3)}) scale(${sc.toFixed(4)})`}
      >
        <FlagArt kind="union1606" id="fal-union" />
        <rect
          x={0}
          y={0}
          width={FLAG_W}
          height={FLAG_H}
          fill={airHex}
          opacity={fz.toFixed(3)}
        />
        <rect
          x={0.2}
          y={0.2}
          width={FLAG_W - 0.4}
          height={FLAG_H - 0.4}
          fill="none"
          stroke={mixHex(FLAG_INK.edge, airHex, fz)}
          strokeWidth={0.5}
        />
      </g>
    </g>
  );
};

const sstep = (a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
/** Britain's land, a sliver lying at the far horizon: the map's own BRITAIN region (umber land) drawn
 *  over the ground with the far pieces' thinner haze, so London's column stands on a shore */
const BRITAIN_POLYS: P2[][] = ATLANTIC.BRITAIN.d
  .split("M")
  .filter(Boolean)
  .map((q) =>
    q
      .replace(/Z/g, "")
      .split("L")
      .map((t) => t.split(",").map(Number) as P2),
  )
  .filter((poly) => poly.length > 12);
const BRITAIN_EXTRA = 0.12;
const FarShore: React.FC<{ A: InsWorld }> = ({ A }) => {
  const dist = A.dist(LONDON[0], 0, LONDON[1]);
  if (A.hazeAt(dist) > 0.995) return null;
  const d = BRITAIN_POLYS.map(
    (poly) =>
      `M${poly
        .map((p) => toScreen(A.cam, p[0], 0, p[1]))
        .map((q) => `${q.x.toFixed(2)},${q.y.toFixed(2)}`)
        .join("L")}Z`,
  ).join("");
  return (
    <g>
      <path d={d} fill={A.tone("#3F3428", dist)} />
    </g>
  );
};

type Item = { at: P2; el: (A: InsWorld) => React.ReactNode };

const FurtherAwayLower: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const cam: Cam = camAt(frame);
  const fog = stretchFog(fogFor(cam), fogK(frame));
  const A = insWorld({ cam, rest: REST, frame, fog });
  const u = tipU(frame);
  const to = u * ROUTE_LEN;
  const tip = pointAt(to);
  const lonH = londonHeight(to > 0 ? tip : LONDON);
  // London's piece, its pennant and the route clear as the haze lifts (at f0 exactly cut 91's haze: invisible)
  const AR0 = clearer(A, (ROUTE_CLEAR * (fogK(frame) - 1)) / (FOG_KMAX - 1));
  const AR = minHaze(AR0, Math.max(0, farHaze(frame) - 0.12));
  const AL = farWorld(A, lonHaze(frame), true);
  const AB = farWorld(A, Math.min(1, farHaze(frame) + BRITAIN_EXTRA));
  const londonVis = sstep(0, 0.3, 1 - farHaze(frame));
  const hazeBelow = interpolate(frame, [0, 44], [420, 250], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.sin),
  });
  const items: Item[] = [
    {
      at: LONDON,
      el: () => (
        <g opacity={londonVis.toFixed(3)}>
          <ValueColumn
            A={AL}
            x={LONDON[0]}
            z={LONDON[1]}
            r={LON.r}
            height={lonH}
            color="cream"
            face={LON.face}
            uid="lon"
          />
          <Pennant A={AL} x={LONDON[0]} z={LONDON[1]} y0={lonH} frame={frame} />
        </g>
      ),
    },
    {
      at: H,
      el: (A) => (
        <Farmhouse
          A={A}
          x={HOUSE.x}
          z={HOUSE.z}
          size={HOUSE.size}
          face={HOUSE.face}
          warm={1}
          uid="farm"
        />
      ),
    },
    {
      at: [COLUMN.x, COLUMN.z],
      el: (A) => (
        <ValueColumn
          A={A}
          x={COLUMN.x}
          z={COLUMN.z}
          r={COLUMN.r}
          height={COLUMN.height}
          color="orange"
          face={COLUMN_FACE}
          uid="vc"
        />
      ),
    },
  ];
  return (
    <InsurgencyStage A={A}>
      <MapGround3D world="atlantic" cam={cam} air={A.ground} fog={A.fog} />
      <HorizonHaze A={A} below={hazeBelow} id="hz96" />
      <WorldLayer>
        <FarShore A={AB} />
        <FarmFields A={A} fields={FIELDS} />
        <River A={A} pts={HUDSON} w={5} />
        <Route A={AR} to={to} tipOn={u > 0 && u < 1} />
        {sortFarToNear(A, items, (it) => it.at).map((it, i) => (
          <React.Fragment key={i}>{it.el(A)}</React.Fragment>
        ))}
        <ChimneySmoke
          A={A}
          frame={frame + SMOKE_FRAME0}
          at={CHIMNEY}
          start={31}
          windYaw={YAW + 100}
          scale={HOUSE.size * 0.09}
          uid="smoke"
        />
      </WorldLayer>
    </InsurgencyStage>
  );
};

export default FurtherAwayLower;
