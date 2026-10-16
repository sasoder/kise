// ---------------------------------------------------------------------------
// HalfTheContinent (plague clip: Dwarkesh Patel with Kyle Harper, "Why the
// plague is so deadly to humans"). Sequence 58.325 s - 65.966 s. THE map cut.
//
// CHECK LINE: "A disease of marmots on the Central Asian steppe is what came
// west and killed half of Europe: seen from where it starts, nobody would
// guess it."
//
// SPOKEN (29.97 fps, f = round((t - 58.325) * 29.97)):
//   "you would never be like, I think that every now and then a rodent disease
//    from Central Asia is going to wipe out half of the continent."
//   you f0 · would f5 · never f9 · be f21 · like f27 · I f36 · think f39 ·
//   that f47 · every f55 · now f65 · and f72 · then f78 · a f86 · rodent f116 ·
//   disease f126 · from f136 · Central f143 · Asia f152 · is f162 ·
//   going to f168 · wipe f174 · out f184 · half f190 · of f197 · the f202 ·
//   continent f205 · speech ends f229.   DURATION = 229 + 6 = 235.
//
// THE MOTION: ONE zoom out, one eased move in the log of the scale (lnS: a
// slow drift plus a single raised-cosine swell, f90-208, fastest ~f149), four
// orders of magnitude. It opens on the umber page with Muetzel's three bobak
// marmots printed on it as a book vignette, the camera drifting toward the
// standing one; orange germs crawl out from behind its back on "rodent", walk
// off over its head and gather into ONE orange dot on the page beside it. The
// page the marmots are printed on IS the land of the map: as the camera pulls
// out the vignette simply gets smaller, a map illustration in the region where
// the animal lives, and the map's own engraving comes into view around it by
// level of detail (the hachured Tian Shan and the lakes, then coasts,
// water-lines, the ruled sea, the graticule). The zoom runs on to the whole
// Earth while an orange front leaves the dot, runs west along the steppe to
// Crimea and crosses Europe, turning exactly every other one of Europe's dots
// orange. Hold: the globe keeps turning a little, a shimmer crosses the orange.
//
// THE MAP: Natural Earth 50m land (world-atlas) on ONE orthographic projection
// whose scale is the camera (no projection switch between the regional map and
// the globe); the sphere's centre turns from the dot to about 40 E 38.5 N as it
// becomes a globe. Dwarkesh map style, as an engraving on the kit page: the
// land is the page itself, the sea is cut dark and ruled, coast an inked cream
// line with the lighter rim and water-lines, ranges as hachures, the limb an
// inked line with a band of hatch shading. No borders, no names except the one
// the speaker says.
//
// FACTS SHOWN, AND THEIR SOURCES
//   - The vignette: Gustav Muetzel, bobak marmots on the Central Asian steppe,
//     Brehms Tierleben (kit MarmotVignette). The reservoir of Yersinia pestis
//     in Central Asia is marmots and other burrowing rodents.
//   - The dot: the Chuy valley / Tian Shan near Lake Issyk-Kul (42.8 N, 75 E),
//     where the earliest Black Death burials are dated 1338-39 (Spyrou et al.
//     2022, "The source of the Black Death in fourteenth-century central
//     Eurasia", Nature 606).
//   - The route west: the steppe north of the Aral and the Caspian to Caffa in
//     Crimea (1346-47), then across Europe (1347-53). Drawn as one schematic
//     front; it is not a dated spread map (no sea routes).
//   - HALF: the Black Death (1346-53) is estimated to have killed 30-60% of
//     Europe's population, often cited as about half (e.g. Benedictow 2004,
//     "The Black Death 1346-1353: The Complete History"). The checkerboard
//     (exactly every other dot of an even lattice turns orange) is the
//     speaker's "half of the continent", NOT a regional mortality map.
//   - Lakes, ranges and rivers are placed by hand (see LAKES, RANGES, RIVER_PTS): schematic, to
//     ~0.2-0.5 deg. Lattice and route: scripts/clips/kyle-plague/build-HalfTheContinent-data.mjs.
// ---------------------------------------------------------------------------
import React from "react";
import { z } from "zod";
import { useCurrentFrame } from "remotion";
// d3-geo / topojson-client ship no type declarations in this repo
// @ts-expect-error untyped module
import { geoArea, geoContains, geoGraticule, geoOrthographic, geoPath } from "d3-geo";
// @ts-expect-error untyped module
import { feature } from "topojson-client";
import land50Topo from "world-atlas/land-50m.json";
import {
  ACCENT,
  DARK,
  FRAME_H,
  FRAME_W,
  Germs,
  INK,
  InkStroke,
  Label,
  MARMOT,
  MarmotVignetteImg,
  Page,
  SEA,
  clamp01,
  hash,
  mixColor,
  smoothstep,
} from "./plagueShared";
import { LATTICE, MAX_KM, ORIGIN, ROUTE, ROUTE_KM } from "./HalfTheContinentData";

export const FPS = 30000 / 1001;
export const DURATION = 235;

const LAND_RIM = "#6A5838";
const SHIMMER = "#FFE3A6";

export const schema = z.object({
  label: z.string(),
  vignette: z.number(),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({
  label: "CENTRAL ASIA",
  vignette: 0.34,
});

// ---------------------------------------------------------------------------
// THE CAMERA: one analytic track.
//   s   the orthographic scale (the sphere's radius in screen px). ln s is a
//       slow steady drift plus ONE raised-cosine swell: no keys, no corners.
//   q   where the dot (42.8 N, 75 E) sits on screen.
// The vignette is W0 px wide at s = S0 and hangs off the dot (the dot is at
// DOT_F of its box), so vignette, map and globe share the one scale.
// ---------------------------------------------------------------------------
const S0 = 130000;
const S_END = 556;
const DRIFT = 0.0011; // ln s per frame, all the way through
const SWELL = [90, 208] as const;
const SWELL_L = Math.log(S0 / S_END) - DRIFT * (DURATION - 1);
export const lnS = (f: number) => {
  const u = clamp01((f - SWELL[0]) / (SWELL[1] - SWELL[0]));
  const c = u - Math.sin(2 * Math.PI * u) / (2 * Math.PI);
  return Math.log(S_END) + DRIFT * (DURATION - 1 - f) + SWELL_L * (1 - c);
};
const W0 = 1720;
const H0 = W0 / MARMOT.aspect;
/** the dot, as a fraction of the vignette box: on the bare page left of the standing marmot's nose */
const DOT_F: [number, number] = [0.2, 0.1];
// what the frame centre looks at inside the vignette (box fractions): from the
// standing marmot's chest, drifting to its shoulder and back
const FOCUS_0: [number, number] = [0.5, 0.22];
const FOCUS_1: [number, number] = [0.6, 0.26];
const Q_END: [number, number] = [775.7, 871.8]; // the dot in the lattice's final framing
const dotScreen = (f: number) => {
  const k = Math.exp(lnS(f)) / S0;
  const t = clamp01(f / 128);
  const e = 1 - (1 - t) * (1 - t);
  const fx = FOCUS_0[0] + (FOCUS_1[0] - FOCUS_0[0]) * e - DOT_F[0];
  const fy = FOCUS_0[1] + (FOCUS_1[1] - FOCUS_0[1]) * e - DOT_F[1];
  const g = smoothstep((f - 148) / (207 - 148));
  const h = clamp01((f - 196) / 40);
  const creep = h * h * (1.5 - 0.5 * h);
  return {
    x: FRAME_W / 2 - fx * W0 * k + (Q_END[0] - FRAME_W / 2) * g + 10 * creep,
    y: FRAME_H / 2 - fy * H0 * k + (Q_END[1] - FRAME_H / 2) * g - 1.2 * creep,
  };
};

// The germs, in vignette units (box width = 1000): the point E on the standing
// marmot's back they come over, their inward heading, the frame they set off
// (from GERM_BACK behind the contour, GERM_V units a frame), and the frame
// they leave the fur for the dot.
const VU = 1000;
const VH = VU / MARMOT.aspect;
const GERM_V = 3.7;
const GERM_BACK = 30;
const GERM_R = 9.5;
const GERM_FLY = 15;
const GERMS: { ex: number; ey: number; dx: number; dy: number; f0: number }[] = [
  { ex: 682, ey: 160, dx: -0.8, dy: 0.6, f0: 92 },
  { ex: 744, ey: 222, dx: -0.9, dy: 0.44, f0: 94 },
  { ex: 712, ey: 189, dx: -0.62, dy: 0.78, f0: 96 },
  { ex: 784, ey: 265, dx: -0.92, dy: 0.39, f0: 98 },
  { ex: 664, ey: 142, dx: -0.5, dy: 0.87, f0: 100 },
  { ex: 814, ey: 298, dx: -0.85, dy: 0.53, f0: 102 },
  { ex: 760, ey: 239, dx: -0.75, dy: 0.66, f0: 104 },
];
const flyAt = (i: number) => 118 + 1.5 * i;
// the kit's coarse silhouette, its back edge (points 3-7) eased out onto the engraved contour
const SIL = MARMOT.silhouette.map(([x, y], i): [number, number] => (i >= 3 && i <= 7 ? [x + 0.022, y - 0.016] : [x, y]));
const SIL_D = `M${SIL.map(([x, y]) => `${(x * VU).toFixed(1)},${(y * VH).toFixed(1)}`).join("L")}Z`;

const T = {
  label: 133, // CENTRAL ASIA slides up, landed on "Central" f143
  front: 144, // the front leaves the dot
  frontEnd: 206, // ... and has reached the farthest dot of Europe
  shimmer: [207, 238] as const,
};
// The front: steady on screen. The zoom is still running out under it, so on
// the ground it covers km as t^1.6 (a constant km/frame would outrun the frame).
const FRONT_P = 1.6;
const frontKm = (f: number) => MAX_KM * Math.pow(clamp01((f - T.front) / (T.frontEnd - T.front)), FRONT_P);
const arriveAt = (km: number) => T.front + (T.frontEnd - T.front) * Math.pow(km / MAX_KM, 1 / FRONT_P);

// ---------------------------------------------------------------------------
// GEOMETRY (module scope: decoded once per tab)
// ---------------------------------------------------------------------------
type LL = [number, number];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const topo = land50Topo as any;
// Natural Earth's land has no inland lakes. The three that place the dot on a
// map of Central Asia are cut out of the land here as plain holes (outlines
// traced by hand to ~0.2 deg; the Aral at its pre-1960 extent): Issyk-Kul,
// Balkhash, the Aral Sea.
const LAKES: LL[][] = [
  [[76.15, 42.45], [76.8, 42.62], [77.4, 42.72], [78.0, 42.78], [78.35, 42.6], [77.9, 42.35], [77.3, 42.12], [76.7, 42.18], [76.3, 42.3]],
  [[73.4, 45.0], [73.3, 45.6], [73.6, 46.3], [74.3, 46.8], [75.2, 46.7], [76.3, 46.75], [77.3, 46.6], [78.3, 46.7], [79.2, 46.75], [79.3, 46.4], [78.5, 46.3], [77.5, 46.3], [76.5, 46.35], [75.5, 46.3], [74.8, 46.0], [74.3, 45.5], [74.0, 45.0], [73.7, 44.85]],
  [[58.3, 45.5], [58.3, 44.6], [58.6, 43.7], [59.3, 43.5], [60.2, 43.7], [61.0, 44.2], [61.6, 44.9], [61.9, 45.8], [61.5, 46.4], [61.9, 46.7], [61.0, 46.8], [60.2, 46.5], [59.6, 46.3], [59.0, 46.2], [58.7, 45.9]],
];
const LAND_GEO = (() => {
  const g = feature(topo, topo.objects.land);
  const polys: LL[][][] = [];
  for (const f of g.features ?? [g]) {
    const geom = f.geometry;
    if (geom.type === "Polygon") polys.push(geom.coordinates);
    else for (const c of geom.coordinates) polys.push(c);
  }
  const asia = polys.find((rings) => geoContains({ type: "Polygon", coordinates: [rings[0]] }, [75, 45]));
  if (asia) {
    for (const lake of LAKES) {
      // two rounds of corner cutting (Chaikin) round the hand-traced outline
      let pts = lake;
      for (let k = 0; k < 2; k++) {
        const next: LL[] = [];
        pts.forEach((a, i) => {
          const b = pts[(i + 1) % pts.length];
          next.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]);
        });
        pts = next;
      }
      const ring = [...pts, pts[0]];
      // a hole winds the other way from a small outer ring
      const small = geoArea({ type: "Polygon", coordinates: [ring] }) < 2 * Math.PI;
      asia.push(small ? [...ring].reverse() : ring);
    }
  }
  return { type: "MultiPolygon", coordinates: polys };
})();
const GRAT_10 = geoGraticule().step([10, 10]).extent([
  [-180, -80.001],
  [180, 80.001],
])();
const GRAT_5 = geoGraticule().step([5, 5]).extent([
  [-180, -80.001],
  [180, 80.001],
])();
const localGrat = (half: number, step: number) => {
  const lines: LL[][] = [];
  const n = Math.round(half / step);
  const lon0 = Math.round(ORIGIN[0] / step) * step;
  const lat0 = Math.round(ORIGIN[1] / step) * step;
  for (let i = -n; i <= n; i++) {
    const lon = lon0 + i * step;
    const lat = lat0 + i * step;
    const mer: LL[] = [];
    const par: LL[] = [];
    for (let j = -n; j <= n; j++) {
      mer.push([lon, lat0 + j * step]);
      par.push([lon0 + j * step, lat]);
    }
    lines.push(mer, par);
  }
  return { type: "MultiLineString", coordinates: lines };
};
const GRAT_1 = localGrat(24, 1);


// THE RANGES, as an engraver draws them: short hachure strokes falling away on
// both sides of a blank crest. Crest lines placed by hand (schematic). `near`
// ranges (the Tian Shan round the dot) also get a fine set for the close stage.
const RANGES: { pts: LL[]; near?: boolean }[] = [
  { pts: [[72.6, 42.45], [74.0, 42.5], [75.3, 42.42], [76.2, 42.05]], near: true }, // Kyrgyz Ala-Too
  { pts: [[75.6, 43.05], [77.0, 43.05], [78.4, 42.95], [79.6, 42.75]], near: true }, // Trans-Ili / Kungey Alatau
  { pts: [[76.3, 41.95], [77.6, 41.85], [79.0, 42.05], [80.3, 42.1]], near: true }, // Terskey Alatau
  { pts: [[70.6, 42.3], [72.0, 42.25], [73.0, 41.5], [74.1, 40.7]], near: true }, // Talas / Fergana ranges
  { pts: [[80.3, 42.1], [82.0, 42.5], [84.0, 43.0], [86.2, 43.3], [88.5, 43.5], [91, 43.2]] }, // eastern Tian Shan
  { pts: [[69.8, 39.6], [72.0, 39.6], [74.2, 39.4], [76, 39.0]] }, // Alay
  { pts: [[71.5, 38.3], [73.5, 37.6], [75.2, 37.2]] }, // Pamir
  { pts: [[65.5, 34.9], [68.5, 35.4], [71.5, 36.2], [74, 36.4]] }, // Hindu Kush
  { pts: [[74.5, 35.6], [77, 33.6], [80, 30.9], [84, 28.6], [88, 27.8], [92, 27.8], [95.5, 28.6]] }, // Himalaya
  { pts: [[76.5, 36.4], [80, 36.0], [85, 36.1], [90, 36.0], [95, 35.7]] }, // Kunlun
  { pts: [[84, 50.2], [87, 49.4], [90, 48], [93, 46.4], [96, 45]] }, // Altai
  { pts: [[58.8, 51.5], [59.3, 55], [59.6, 59], [60.2, 62.5], [63, 66], [66, 67.8]] }, // Urals
  { pts: [[37.5, 44.4], [41, 43.4], [44.5, 42.6], [48.3, 41.1]] }, // Caucasus
  { pts: [[45.5, 36.5], [48.5, 34], [51.5, 31.5], [54.5, 29]] }, // Zagros
  { pts: [[6.6, 44.6], [7.6, 46.0], [10, 46.7], [12.5, 47.1], [15, 47.4]] }, // Alps
  { pts: [[18, 49.3], [21.5, 49.2], [24.5, 47.9], [26.2, 46], [25, 45.4], [22.8, 45.4]] }, // Carpathians
  { pts: [[-1.6, 43.0], [0.5, 42.7], [2.6, 42.45]] }, // Pyrenees
  { pts: [[6.8, 60.2], [9.5, 62], [13.5, 64.5], [16.5, 67], [19.5, 68.8]] }, // Scandes
];
const hachures = (pts: LL[], step: number, len: number, seed: number) => {
  const lines: LL[][] = [];
  let n = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i];
    const [bx, by] = pts[i + 1];
    const kx = Math.cos(((ay + by) / 2) * (Math.PI / 180)); // a degree of longitude is shorter
    const dx = (bx - ax) * kx;
    const dy = by - ay;
    const segLen = Math.hypot(dx, dy);
    const count = Math.max(1, Math.round(segLen / step));
    const nx = -dy / segLen;
    const ny = dx / segLen;
    for (let j = 0; j < count; j++, n++) {
      const u = (j + 0.5 + (hash(seed + n, 1) - 0.5) * 0.5) / count;
      const px = ax + (bx - ax) * u;
      const py = ay + (by - ay) * u;
      for (const side of [-1, 1]) {
        const l = len * (0.55 + 0.6 * hash(seed + n, side + 3));
        const lean = (hash(seed + n, side + 6) - 0.5) * 0.5;
        const ox = (nx + (dx / segLen) * lean) * side;
        const oy = (ny + (dy / segLen) * lean) * side;
        const g0 = len * 0.16;
        lines.push([
          [px + (ox * g0) / kx, py + oy * g0],
          [px + (ox * (g0 + l)) / kx, py + oy * (g0 + l)],
        ]);
      }
    }
  }
  return lines;
};
// THE RIVERS of the region, as inked lines (courses placed by hand, schematic).
const RIVER_PTS: LL[][] = [
  [[73.5, 40.9], [71.5, 40.6], [69.3, 40.2], [68.3, 41.5], [67.5, 43], [65.5, 44.8], [63, 45.6], [61.4, 46.0]], // Syr Darya
  [[71.5, 37.2], [68.5, 37.2], [66, 37.4], [64, 39], [62, 40.8], [60.5, 42], [59.4, 43.5]], // Amu Darya
  [[75.9, 42.75], [75.2, 43.0], [73.5, 43.8], [71.5, 44.8], [69.6, 45.2]], // Chu
  [[82, 43.6], [80, 43.8], [77.5, 43.9], [76, 44.8], [74.4, 45.3]], // Ili
  [[86, 47.8], [83.5, 49.5], [80, 50.5], [76.5, 52.5], [74.5, 54.5], [73, 57], [69, 59.5], [68.8, 61]], // Irtysh
  [[77, 39.5], [80, 40.6], [84, 41.1], [87, 40.6], [88.5, 40.2]], // Tarim
  [[59, 52], [55, 51.5], [51.6, 51.2], [51.5, 48.5], [51.9, 47.2]], // Ural
  [[33, 57], [38, 57.5], [44, 56.3], [49, 55.8], [48, 53], [45.5, 50.5], [44.5, 48.7], [47.6, 46.3]], // Volga
  [[38.5, 53.5], [39.5, 51], [42.5, 49], [43.8, 48.3], [39.6, 47.2]], // Don
  [[33, 55], [31, 52], [31.5, 50], [35, 48.3], [32.7, 46.7]], // Dnieper
  [[9, 48], [13, 48.6], [17, 48], [19, 47.6], [19, 45.5], [22.5, 44.5], [26, 43.9], [28, 45.3], [29.5, 45.2]], // Danube
  [[79, 32], [75, 35.5], [72.5, 34], [71, 31], [69, 27.5], [67.7, 24.2]], // Indus
  [[78, 30], [80, 27], [84, 25.6], [88, 24.8], [90, 23.2]], // Ganges
];
// densified, with a slow seeded meander so no course is ruler-straight
const RIVERS = {
  type: "MultiLineString",
  coordinates: RIVER_PTS.map((pts, r) => {
    const out: LL[] = [];
    let n = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, ay] = pts[i];
      const [bx, by] = pts[i + 1];
      const len = Math.hypot(bx - ax, by - ay);
      const steps = Math.max(2, Math.ceil(len / 0.25));
      for (let j = i === 0 ? 0 : 1; j <= steps; j++, n++) {
        const u = j / steps;
        const edge = i === 0 && j === 0 ? 0 : i === pts.length - 2 && j === steps ? 0 : 1;
        const w = edge * 0.11 * (Math.sin(n * 0.9 + r * 2.1) + 0.6 * Math.sin(n * 2.3 + r));
        out.push([ax + (bx - ax) * u - ((by - ay) / len) * w, ay + (by - ay) * u + ((bx - ax) / len) * w]);
      }
    }
    return out;
  }),
};
const HACH_WIDE = { type: "MultiLineString", coordinates: RANGES.flatMap((r, i) => hachures(r.pts, 0.24, 0.5, i * 97)) };
const HACH_NEAR = { type: "MultiLineString", coordinates: RANGES.filter((r) => r.near).flatMap((r, i) => hachures(r.pts, 0.045, 0.15, 5000 + i * 131)) };

const RAD = Math.PI / 180;
const PAD = 90;

/** the projection of a frame: scale s, the dot on screen at (qx, qy), north up */
const projectionFor = (s: number, qx: number, qy: number) => {
  const proj = geoOrthographic()
    .scale(s)
    .translate([FRAME_W / 2, FRAME_H / 2])
    .clipExtent([
      [-PAD, -PAD],
      [FRAME_W + PAD, FRAME_H + PAD],
    ])
    .precision(0.6);
  let lon = ORIGIN[0];
  let lat = ORIGIN[1];
  for (let i = 0; i < 12; i++) {
    proj.rotate([-lon, -lat]);
    const p = proj(ORIGIN) as LL;
    const ex = qx - p[0];
    const ey = qy - p[1];
    if (Math.abs(ex) + Math.abs(ey) < 0.01) break;
    lon -= ex / (s * Math.cos(ORIGIN[1] * RAD)) / RAD;
    lat += ey / s / RAD;
  }
  proj.rotate([-lon, -lat]);
  return proj;
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;


/** 0 below a, 1 above b, eased, on the log of the scale */
const lodUp = (s: number, a: number, b: number) => smoothstep(Math.log(s / a) / Math.log(b / a));

// ---------------------------------------------------------------------------
const HalfTheContinent: React.FC<Props> = ({ label, vignette }) => {
  const frame = useCurrentFrame();
  const s = Math.exp(lnS(frame));
  const { x: qx, y: qy } = dotScreen(frame);

  // -- the vignette (printed on the page; the dot is at DOT_F of its box) --------------
  const vw = (W0 * s) / S0;
  const vh = vw / MARMOT.aspect;
  const vx = qx - DOT_F[0] * vw;
  const vy = qy - DOT_F[1] * vh;
  const vk = vw / VU;
  const vigOp = smoothstep((vw - 20) / (42 - 20));

  // -- the germs, then the dot ----------------------------------------------------
  const germR = Math.max(GERM_R * vk, 5.5);
  const DOT_R = 11;
  let arrived = 0;
  const crawling: { x: number; y: number; seed: number }[] = [];
  const flying: { x: number; y: number; seed: number }[] = [];
  GERMS.forEach((g, i) => {
    if (frame < g.f0) return;
    const tFly = flyAt(i);
    const t = Math.min(frame, tFly) - g.f0;
    const wig = 3.5 * Math.sin(Math.min(frame, tFly) * 0.33 + i * 1.7);
    const ux = g.ex + g.dx * (t * GERM_V - GERM_BACK) - g.dy * wig;
    const uy = g.ey + g.dy * (t * GERM_V - GERM_BACK) + g.dx * wig;
    const px = vx + ux * vk;
    const py = vy + uy * vk;
    if (frame <= tFly) {
      crawling.push({ x: px, y: py, seed: i + 3 });
      return;
    }
    const u = smoothstep((frame - tFly) / GERM_FLY);
    if (u >= 1) {
      arrived++;
      return;
    }
    // a shallow arc over the marmot's head to the dot
    const arc = Math.sin(Math.PI * u) * 46 * vk;
    flying.push({ x: lerp(px, qx, u), y: lerp(py, qy, u) - arc, seed: i + 3 });
  });
  const lastIn = flyAt(GERMS.length - 1) + GERM_FLY;
  const firstIn = flyAt(0) + GERM_FLY;
  const dotR = DOT_R * Math.sqrt(clamp01((frame - firstIn + 1.5) / (lastIn - firstIn + 1.5))) * (arrived > 0 || frame > firstIn - 1.5 ? 1 : 0);

  // -- the map --------------------------------------------------------------------
  const mapOn = s < 100000;
  const map = React.useMemo(() => {
    if (!mapOn) return null;
    const proj = projectionFor(s, qx, qy);
    const path = geoPath(proj).digits(1);
    const land: string = path(LAND_GEO) ?? "";
    const stepPx = (deg: number) => deg * RAD * s;
    const lod = (deg: number) => smoothstep((stepPx(deg) - 34) / (90 - 34));
    const gAll = 1 - lodUp(s, 9000, 30000); // the graticule comes in last
    const g10 = lod(10);
    const g5 = lod(5);
    const g1 = lod(1) * (s > 900 ? 1 : 0);
    const grats: { d: string; op: number }[] = [];
    if (gAll > 0.01) {
      if (g10 > 0.01) grats.push({ d: path(GRAT_10) ?? "", op: gAll * g10 });
      if (g5 > 0.01) grats.push({ d: path(GRAT_5) ?? "", op: gAll * g5 * (1 - 0.5 * g10) });
      if (g1 > 0.01) grats.push({ d: path(GRAT_1) ?? "", op: gAll * g1 * (1 - 0.5 * g5) });
    }
    // hachures: the fine set near the dot first, then the wide set
    const nearOp = (1 - lodUp(s, 45000, 85000)) * lodUp(s, 2600, 6500);
    const wideOp = (1 - lodUp(s, 5000, 13000)) * lerp(0.32, 1, lodUp(s, 650, 1800));
    const hNear: string = nearOp > 0.01 ? (path(HACH_NEAR) ?? "") : "";
    const hWide: string = wideOp > 0.01 ? (path(HACH_WIDE) ?? "") : "";
    const riverOp = (1 - lodUp(s, 14000, 40000)) * lerp(0.5, 1, lodUp(s, 650, 1800));
    const rivers: string = riverOp > 0.01 ? (path(RIVERS) ?? "") : "";

    // the front
    const km = frontKm(frame);
    let trail = "";
    let head: LL | null = null;
    if (km > 0) {
      const pts: LL[] = [];
      for (let i = 0; i < ROUTE.length; i++) {
        const r = ROUTE[i];
        if (r[2] <= km) pts.push([r[0], r[1]]);
        else {
          const q = ROUTE[i - 1];
          const u = (km - q[2]) / (r[2] - q[2]);
          pts.push([lerp(q[0], r[0], u), lerp(q[1], r[1], u)]);
          break;
        }
      }
      if (pts.length > 1) {
        trail = pts.map((p, i) => `${i ? "L" : "M"}${(proj(p) as LL).map((v) => v.toFixed(1)).join(",")}`).join("");
        head = proj(pts[pts.length - 1]) as LL;
      }
    }
    const dots = LATTICE.map((d) => {
      const p = proj([d[0], d[1]]) as LL;
      return { x: p[0], y: p[1], on: d[2] === 1, km: d[3], at: arriveAt(d[3]) };
    }).filter((p) => p.x > -10 && p.x < FRAME_W + 10 && p.y > -10 && p.y < FRAME_H + 10);
    return { land, grats, trail, head, dots, km, hNear, hWide, nearOp, wideOp, rivers, riverOp };
  }, [mapOn, s, qx, qy, frame]);

  // levels of detail, all tied to the scale
  const lz = clamp01(Math.log(s / 560) / Math.log(2800 / 560)); // 0 = the globe, 1 = the regional map
  const wlGap = lerp(3.3, 6.5, lz);
  const wlOp = [0.32, 0.22, 0.13 * lerp(0.75, 1, lz), 0.07 * lz];
  const rimK = lerp(0.45, 1, lz);
  const coastW = lerp(1.3, 1.9, lz);
  const sphereOn = s < 1400; // the limb can be inside the frame
  const shadeOp = 1 - lodUp(s, 700, 1150);
  const latticeOp = 1 - smoothstep((s - 1700) / (2600 - 1700));
  const latticeR = 4.2 * Math.pow(s / 560, 0.3);
  const shimmerKm = lerp(ROUTE_KM - 600, MAX_KM + 600, clamp01((frame - T.shimmer[0]) / (T.shimmer[1] - T.shimmer[0])));
  const shimmerOn = frame >= T.shimmer[0];
  const caffaAt = arriveAt(ROUTE_KM);

  // -- the label: rides above the dot, clear of the vignette (which hangs right and below) --
  const labelOp = lodUp(s, 2000, 2700);

  const svgStyle: React.CSSProperties = { position: "absolute", left: 0, top: 0 };
  const cx = FRAME_W / 2;
  const cy = FRAME_H / 2;
  const sphere = sphereOn ? <circle cx={cx} cy={cy} r={s} /> : <rect x={0} y={0} width={FRAME_W} height={FRAME_H} />;

  return (
    <Page vignette={vignette}>
      {map ? (
        <>
          {/* ---------------- THE MAP, engraved on the page: the land is the page ---------------- */}
          <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} style={svgStyle}>
            <defs>
              <path id="hcLand" d={map.land} />
              <clipPath id="hcLandClip">
                <use href="#hcLand" />
              </clipPath>
              <clipPath id="hcSphere">{sphere}</clipPath>
              {/* the sea: the sphere less the land */}
              <mask id="hcSea" maskUnits="userSpaceOnUse" x={0} y={0} width={FRAME_W} height={FRAME_H}>
                <g fill="#fff">{sphere}</g>
                <use href="#hcLand" fill="#000" />
              </mask>
              <pattern id="hcRule" patternUnits="userSpaceOnUse" width={64} height={6}>
                <line x1={-1} y1={3} x2={65} y2={3} stroke={INK} strokeWidth={1.1} strokeOpacity={0.085} />
              </pattern>
              <pattern id="hcShadeA" patternUnits="userSpaceOnUse" width={64} height={7} patternTransform="rotate(-45)">
                <line x1={-1} y1={3.5} x2={65} y2={3.5} stroke={INK} strokeWidth={1.2} strokeOpacity={0.2} />
              </pattern>
              <pattern id="hcShadeB" patternUnits="userSpaceOnUse" width={64} height={7} patternTransform="rotate(-45) translate(0 3.5)">
                <line x1={-1} y1={3.5} x2={65} y2={3.5} stroke={INK} strokeWidth={1.2} strokeOpacity={0.2} />
              </pattern>
              <clipPath id="hcCrescentA">
                <path clipRule="evenodd" d={`M${cx - s},${cy}a${s},${s} 0 1 0 ${2 * s},0a${s},${s} 0 1 0 ${-2 * s},0ZM${cx - 46 - s},${cy - 46}a${s},${s} 0 1 0 ${2 * s},0a${s},${s} 0 1 0 ${-2 * s},0Z`} />
              </clipPath>
              <clipPath id="hcCrescentB">
                <path clipRule="evenodd" d={`M${cx - s},${cy}a${s},${s} 0 1 0 ${2 * s},0a${s},${s} 0 1 0 ${-2 * s},0ZM${cx - 20 - s},${cy - 20}a${s},${s} 0 1 0 ${2 * s},0a${s},${s} 0 1 0 ${-2 * s},0Z`} />
              </clipPath>
            </defs>
            {/* the page round the globe, a shade down (never black) */}
            {sphereOn ? <path fillRule="evenodd" d={`M0,0H${FRAME_W}V${FRAME_H}H0ZM${cx - s},${cy}a${s},${s} 0 1 0 ${2 * s},0a${s},${s} 0 1 0 ${-2 * s},0Z`} fill={DARK} fillOpacity={0.42} /> : null}
            <g mask="url(#hcSea)">
              <rect x={0} y={0} width={FRAME_W} height={FRAME_H} fill={SEA} />
              <rect x={0} y={0} width={FRAME_W} height={FRAME_H} fill="url(#hcRule)" />
              {[3, 2, 1, 0].map((i) =>
                wlOp[i] > 0.004 ? (
                  <React.Fragment key={`wl${i}`}>
                    <use href="#hcLand" fill="none" stroke={mixColor(SEA, INK, wlOp[i])} strokeWidth={2 * wlGap * (i + 1) + 1.2} strokeLinejoin="round" />
                    <use href="#hcLand" fill="none" stroke={SEA} strokeWidth={2 * wlGap * (i + 1) - 1.2} strokeLinejoin="round" />
                  </React.Fragment>
                ) : null,
              )}
              {map.grats.map((g, i) => (
                <path key={`gs${i}`} d={g.d} fill="none" stroke={INK} strokeOpacity={0.13 * g.op} strokeWidth={1.2} />
              ))}
            </g>
            <g clipPath="url(#hcSphere)">
              <g clipPath="url(#hcLandClip)">
                <use href="#hcLand" fill="none" stroke={LAND_RIM} strokeOpacity={0.22} strokeWidth={28 * rimK} strokeLinejoin="round" />
                <use href="#hcLand" fill="none" stroke={LAND_RIM} strokeOpacity={0.3} strokeWidth={10 * rimK} strokeLinejoin="round" />
                {map.grats.map((g, i) => (
                  <path key={`gl${i}`} d={g.d} fill="none" stroke={INK} strokeOpacity={0.08 * g.op} strokeWidth={1.2} />
                ))}
                {map.rivers ? <path d={map.rivers} fill="none" stroke={INK} strokeOpacity={0.5 * map.riverOp} strokeWidth={lerp(1.2, 2, lz)} strokeLinecap="round" strokeLinejoin="round" /> : null}
                {map.hNear ? <path d={map.hNear} fill="none" stroke={INK} strokeOpacity={0.5 * map.nearOp} strokeWidth={1.3} strokeLinecap="round" /> : null}
                {map.hWide ? <path d={map.hWide} fill="none" stroke={INK} strokeOpacity={0.46 * map.wideOp} strokeWidth={1.2} strokeLinecap="round" /> : null}
              </g>
              <use href="#hcLand" fill="none" stroke={DARK} strokeOpacity={0.55} strokeWidth={coastW + 1.8} strokeLinejoin="round" />
              <use href="#hcLand" fill="none" stroke={INK} strokeOpacity={0.86} strokeWidth={coastW} strokeLinejoin="round" />
              {/* engraved sphere shading: a band of hatch inside the limb, lower right */}
              {sphereOn && shadeOp > 0.01 ? (
                <g opacity={shadeOp}>
                  <rect x={0} y={0} width={FRAME_W} height={FRAME_H} fill="url(#hcShadeA)" clipPath="url(#hcCrescentA)" />
                  <rect x={0} y={0} width={FRAME_W} height={FRAME_H} fill="url(#hcShadeB)" clipPath="url(#hcCrescentB)" />
                </g>
              ) : null}
            </g>
            {sphereOn ? (
              <>
                <circle cx={cx} cy={cy} r={s} fill="none" stroke={DARK} strokeOpacity={0.6} strokeWidth={4.4} />
                <circle cx={cx} cy={cy} r={s} fill="none" stroke={INK} strokeOpacity={0.72} strokeWidth={2.2} />
              </>
            ) : null}
          </svg>

          {/* ---------------- EUROPE'S PEOPLE, THE FRONT'S TRAIL ---------------- */}
          <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} style={svgStyle}>
            {latticeOp > 0.01 ? (
              <g opacity={latticeOp} stroke={DARK} strokeOpacity={0.75} strokeWidth={1}>
                {map.dots.map((d, i) => {
                  if (!d.on) return <circle key={i} cx={d.x.toFixed(1)} cy={d.y.toFixed(1)} r={latticeR} fill={INK} />;
                  const t = clamp01((frame - d.at) / 3);
                  const pulse = Math.sin(Math.PI * clamp01((frame - d.at) / 7));
                  const sh = shimmerOn ? Math.exp(-Math.pow((d.km - shimmerKm) / 420, 2)) * 0.6 : 0;
                  const fill = t <= 0 ? INK : sh > 0.02 ? mixColor(ACCENT, SHIMMER, sh) : mixColor(INK, ACCENT, t);
                  return <circle key={i} cx={d.x.toFixed(1)} cy={d.y.toFixed(1)} r={latticeR * (1 + 0.25 * pulse)} fill={fill} />;
                })}
              </g>
            ) : null}
            {map.trail ? <InkStroke d={map.trail} width={6.5} tone={1} /> : null}
            {map.head && frame < caffaAt + 1 ? <circle cx={map.head[0]} cy={map.head[1]} r={6} fill={ACCENT} stroke={DARK} strokeOpacity={0.6} strokeWidth={1.6} /> : null}
          </svg>
        </>
      ) : null}

      {/* ---------------- THE MARMOTS, printed on the page that is the land ---------------- */}
      {vigOp > 0.01 ? <MarmotVignetteImg x={vx} y={vy} w={vw} opacity={vigOp} /> : null}

      {/* ---------------- THE GERMS, THE DOT, THE ONE NAME ---------------- */}
      <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} style={svgStyle}>
        <defs>
          <clipPath id="hcMarmot">
            <path d={SIL_D} transform={`translate(${vx.toFixed(2)} ${vy.toFixed(2)}) scale(${vk.toFixed(5)})`} />
          </clipPath>
        </defs>
        {dotR > 0.05 ? <circle cx={qx} cy={qy} r={dotR} fill={ACCENT} stroke={DARK} strokeOpacity={0.7} strokeWidth={Math.min(2, dotR * 0.3)} /> : null}
        {crawling.length ? (
          <g clipPath="url(#hcMarmot)">
            <Germs points={crawling} r={germR} />
          </g>
        ) : null}
        {flying.length ? <Germs points={flying} r={germR} /> : null}
        {frame >= T.label && labelOp > 0.01 ? (
          <g opacity={labelOp}>
            <Label x={FRAME_W / 2 + (qx - FRAME_W / 2) * 0.5} y={qy - 215} size={62} sc appear={T.label} frame={frame} spacing={0.3}>
              {label}
            </Label>
          </g>
        ) : null}
      </svg>
    </Page>
  );
};

export default HalfTheContinent;
