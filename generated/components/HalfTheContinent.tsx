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
// THE MOTION: one unbroken zoom OUT on a single log-scale track (S_KEYS), four
// orders of magnitude. It opens inside Muetzel's engraving of bobak marmots on
// the steppe, already pulling back; orange germs crawl out from behind the
// standing marmot's back on "rodent"; the plate then shrinks, lying on the map
// at the place it depicts, into ONE orange dot (the germs converge into it) as
// the map of Central Asia arrives around it. The zoom runs on to the whole
// Earth while an orange front leaves the dot, runs west along the steppe to
// Crimea and crosses Europe, turning exactly every other one of Europe's dots
// orange. Hold: the globe keeps turning a little, a shimmer crosses the orange.
//
// THE MAP: Natural Earth 50m land (world-atlas) on ONE orthographic projection
// whose scale is the camera (no projection switch between the regional map and
// the globe); the sphere's centre turns from the dot to about 40 E 38.5 N as it
// becomes a globe. Dwarkesh map style: sea, umber land with the lighter rim,
// engraved water-lines, graticule (its step is a level of detail), no borders,
// no names except the one the speaker says.
//
// FACTS SHOWN, AND THEIR SOURCES
//   - The plate: Gustav Muetzel, bobak marmots on the Central Asian steppe,
//     Brehms Tierleben. The reservoir of Yersinia pestis in Central Asia is
//     marmots and other burrowing rodents.
//   - The dot: the Chuy valley / Tian Shan near Lake Issyk-Kul (42.8 N, 75 E),
//     where the earliest Black Death burials are dated 1338-39 (Spyrou et al.
//     2022, "The source of the Black Death in fourteenth-century central
//     Eurasia", Nature 606).
//   - The route west: the steppe north of the Aral and the Caspian to Caffa in
//     Crimea (1346-47), then across Europe (1347-53). Drawn as one schematic
//     front at a steady speed; it is not a dated spread map (no sea routes).
//   - HALF: the Black Death (1346-53) is estimated to have killed 30-60% of
//     Europe's population, often cited as about half (e.g. Benedictow 2004,
//     "The Black Death 1346-1353: The Complete History"). The checkerboard
//     (exactly every other dot of an even lattice turns orange) is the
//     speaker's "half of the continent", NOT a regional mortality map.
//   Lattice and route: scripts/build-HalfTheContinent-data.mjs.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
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
  Grain,
  INK,
  LAND,
  Label,
  SEA,
  Vignette,
  clamp01,
  mixColor,
  ramp,
  runCamera,
  smoothstep,
  type CamKey,
} from "./plagueShared";
import { LATTICE, MAX_KM, ORIGIN, ROUTE, ROUTE_KM } from "./HalfTheContinentData";

export const FPS = 30000 / 1001;
export const DURATION = 235;

const SPACE = "#2B241C"; // the ground round the globe: warm dark umber, never black
const LAND_RIM = "#6A5838";
const SHIMMER = "#FFE3A6";

export const schema = z.object({
  plateSrc: z.string(),
  mottleSrc: z.string(),
  label: z.string(),
  vignette: z.number(),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({
  plateSrc: "plague/bobak_plate.jpg",
  mottleSrc: "manchuria/mottle.png",
  label: "CENTRAL ASIA",
  vignette: 0.34,
});

// ---------------------------------------------------------------------------
// THE CAMERA: one key track, read through the kit's damped follower (it trails
// the keys by ~5 frames; the keys below are written 5 frames early).
//   k = the orthographic scale s (the sphere's radius in screen px), in log
//   x, y = where the dot (42.8 N, 75 E) sits on screen
// The plate is 1306 px wide (cover) at s = S_COVER, so its width is
// 1306 * s / S_COVER: plate, map and globe share the one scale.
// ---------------------------------------------------------------------------
const S_COVER = 100000;
const CAM: CamKey[] = [
  { f: 0, x: 540, y: 960, k: 126000 }, // inside the plate, k 1.26 over cover
  { f: 100, x: 540, y: 960, k: 100000 }, // full cover ~f105
  { f: 107, x: 540, y: 960, k: 96500 },
  { f: 113, x: 540, y: 960, k: 87000 }, // the pull-back gathers speed ("rodent" f116)
  { f: 119, x: 540, y: 960, k: 42000 },
  { f: 125, x: 540, y: 960, k: 14000 },
  { f: 131, x: 542, y: 959, k: 5600 },
  { f: 138, x: 553, y: 955, k: 2300 }, // the dot, and "Central" f143
  { f: 145, x: 576, y: 947, k: 1700 }, // the front leaves
  { f: 155, x: 621, y: 930, k: 1260 },
  { f: 171, x: 702, y: 899, k: 900 }, // Crimea ("wipe" f174)
  { f: 185, x: 749, y: 882, k: 700 },
  { f: 195, x: 769, y: 874, k: 605 }, // the Earth ("continent" f205)
  { f: 207, x: 775.7, y: 871.8, k: 572 }, // the final framing of the lattice: centre 40 E 38.5 N, disc ~1120 px
  { f: 245, x: 787, y: 870.5, k: 556 }, // hold: still turning, still receding a little
];

// The plate image (px) and the standing marmot in it.
const IMG_W = 1510;
const IMG_H = 2220;
const COVER_W = (FRAME_H * IMG_W) / IMG_H; // 1306
// The standing marmot's back, traced on the plate (image px), closed through
// its body: the germs are clipped to it, so they come out from BEHIND its back.
const MARMOT_SIL =
  "M690,1075L700,1040L760,990L830,975L900,990L960,1015L1010,1050L1055,1100L1100,1160L1160,1215L1215,1280L1270,1350L1320,1420L1360,1490L1395,1570L1420,1660L1425,1740L1300,1760L1100,1660L880,1640L860,1560L850,1450L835,1330L800,1220L760,1150L720,1110Z";
// Each germ: the point E on the back contour it comes over, its inward heading,
// its speed (image px a frame, constant) and the frame it sets off, from
// GERM_BACK px behind the contour.
const GERM_BACK = 36;
const GERM_R = 13;
const GERMS: { ex: number; ey: number; dx: number; dy: number; v: number; f0: number }[] = [
  { ex: 1035, ey: 1078, dx: -0.75, dy: 0.66, v: 5.0, f0: 92 },
  { ex: 1120, ey: 1178, dx: -0.88, dy: 0.47, v: 5.4, f0: 94 },
  { ex: 930, ey: 1002, dx: -0.1, dy: 1.0, v: 4.2, f0: 96 },
  { ex: 985, ey: 1032, dx: -0.35, dy: 0.94, v: 5.6, f0: 99 },
  { ex: 1075, ey: 1127, dx: -0.6, dy: 0.8, v: 4.6, f0: 102 },
  { ex: 1165, ey: 1220, dx: -0.95, dy: 0.3, v: 5.2, f0: 105 },
  { ex: 1100, ey: 1160, dx: -0.8, dy: 0.6, v: 4.4, f0: 109 },
];
const T = {
  germClipOff: 126, // every germ is well inside the silhouette by now
  converge: [121, 139] as const, // the germs draw together into the dot
  label: 133, // CENTRAL ASIA slides up, landed on "Central" f143
  labelPinned: 143,
  front: 146, // the front leaves the dot
  frontEnd: 203, // ... and has reached the farthest dot of Europe
  shimmer: [205, 236] as const,
};
const KM_PER_FRAME = MAX_KM / (T.frontEnd - T.front);
export const F_CAFFA = T.front + ROUTE_KM / KM_PER_FRAME;

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
const GRAT_01 = localGrat(2.4, 0.1);

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

// ---------------------------------------------------------------------------
const HalfTheContinent: React.FC<Props> = ({ plateSrc, mottleSrc, label, vignette }) => {
  const frame = useCurrentFrame();
  const cam = runCamera(CAM, frame);
  const s = cam.k;
  const qx = cam.x;
  const qy = cam.y;

  // -- the plate ---------------------------------------------------------------
  const kp = s / S_COVER;
  const plateW = COVER_W * kp;
  const plateH = FRAME_H * kp;
  // while it is larger than the frame it is framed toward the standing marmot,
  // using 65% of the slack it has over the frame edges
  const offX = -0.65 * Math.max(0, (plateW - FRAME_W) / 2);
  const offY = -0.65 * Math.max(0, (plateH - FRAME_H) / 2);
  const pcx = qx + offX;
  const pcy = qy + offY;
  const imgK = plateW / IMG_W;
  const plateLeft = pcx - plateW / 2;
  const plateTop = pcy - plateH / 2;
  const plateCovers = plateLeft <= 0 && plateTop <= 0 && plateLeft + plateW >= FRAME_W && plateTop + plateH >= FRAME_H;
  const plateOn = plateW > 5;
  const toScr = (ix: number, iy: number) => ({ x: pcx + (ix - IMG_W / 2) * imgK, y: pcy + (iy - IMG_H / 2) * imgK });

  // -- the germs, then the dot ----------------------------------------------------
  const conv = ramp(frame, T.converge[0], T.converge[1]);
  const dotR = 10 * smoothstep((96 - plateW) / (96 - 40));
  const germsOn = frame >= GERMS[0].f0 && !(dotR >= 10 && conv >= 1);
  const germR = Math.max(GERM_R * imgK, 4.6);
  const germPts = GERMS.filter((g) => frame >= g.f0).map((g, i) => {
    const t = Math.min(frame, T.converge[1]) - g.f0;
    const wig = 5 * Math.sin(frame * 0.33 + i * 1.7);
    const ix = g.ex + g.dx * (t * g.v - GERM_BACK) - g.dy * wig;
    const iy = g.ey + g.dy * (t * g.v - GERM_BACK) + g.dx * wig;
    const p = toScr(ix, iy);
    return { x: lerp(p.x, pcx, conv), y: lerp(p.y, pcy, conv), seed: i + 3 };
  });

  // -- the map --------------------------------------------------------------------
  const mapOn = !plateCovers;
  const map = React.useMemo(() => {
    if (!mapOn) return null;
    const proj = projectionFor(s, qx, qy);
    const path = geoPath(proj).digits(1);
    const land: string = path(LAND_GEO) ?? "";
    const stepPx = (deg: number) => deg * RAD * s;
    const lod = (deg: number) => smoothstep((stepPx(deg) - 34) / (90 - 34));
    const g10 = lod(10);
    const g5 = lod(5);
    const g1 = lod(1) * (s > 900 ? 1 : 0);
    const g01 = lod(0.1) * (s > 9000 ? 1 : 0);
    const grats: { d: string; op: number }[] = [];
    if (g10 > 0.01) grats.push({ d: path(GRAT_10) ?? "", op: g10 });
    if (g5 > 0.01) grats.push({ d: path(GRAT_5) ?? "", op: g5 * (1 - 0.5 * g10) });
    if (g1 > 0.01) grats.push({ d: path(GRAT_1) ?? "", op: g1 * (1 - 0.5 * g5) });
    if (g01 > 0.01) grats.push({ d: path(GRAT_01) ?? "", op: g01 * (1 - 0.5 * g1) });

    // the front: how many km it has travelled
    const km = (frame - T.front) * KM_PER_FRAME;
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
      return { x: p[0], y: p[1], on: d[2] === 1, km: d[3] };
    }).filter((p) => p.x > -10 && p.x < FRAME_W + 10 && p.y > -10 && p.y < FRAME_H + 10);
    return { land, grats, trail, head, dots, km };
  }, [mapOn, s, qx, qy, frame]);

  // levels of detail, all tied to the scale
  const lz = clamp01(Math.log(s / 560) / Math.log(2800 / 560)); // 0 = the globe, 1 = the regional map
  const wlGap = lerp(3.3, 6.5, lz);
  const wlOp = [0.3, 0.2, 0.12 * lerp(0.75, 1, lz), 0.065 * lz];
  const rimK = lerp(0.45, 1, lz);
  const coastW = lerp(1.15, 1.5, lz);
  const sphereOn = s < 1400; // the limb can be inside the frame
  const latticeOp = 1 - smoothstep((s - 1700) / (2600 - 1700));
  const latticeR = 4.2 * Math.pow(s / 560, 0.3);
  const shimmerKm = lerp(ROUTE_KM - 600, MAX_KM + 600, clamp01((frame - T.shimmer[0]) / (T.shimmer[1] - T.shimmer[0])));
  const shimmerOn = frame >= T.shimmer[0];

  // the mottle: a world-space texture kept alive across the whole zoom as two
  // octaves that cross-fade (tile size 400..1600 px and its 4x parent)
  const base = (640 * s) / 500;
  const oct = Math.floor(Math.log(base / 400) / Math.log(4));
  const tileA = base / Math.pow(4, oct);
  const mixA = Math.log(tileA / 400) / Math.log(4);
  const mottleLayer = (size: number, op: number, key: string) => {
    if (op <= 0.01) return null;
    const tiles: React.ReactNode[] = [];
    const x0 = qx - Math.ceil(qx / size) * size;
    const y0 = qy - Math.ceil(qy / size) * size;
    for (let y = y0; y < FRAME_H; y += size)
      for (let x = x0; x < FRAME_W; x += size)
        tiles.push(<Img key={`${x.toFixed(0)}_${y.toFixed(0)}`} src={staticFile(mottleSrc)} style={{ position: "absolute", left: x, top: y, width: size + 0.6, height: size + 0.6 }} />);
    return (
      <div key={key} style={{ position: "absolute", inset: 0, opacity: op * 0.9 }}>
        {tiles}
      </div>
    );
  };

  // -- the label ------------------------------------------------------------------
  const sPin = runCamera(CAM, T.labelPinned).k;
  const rho = Math.min(1, s / sPin);
  const labelOp = smoothstep((s - 1000) / (1300 - 1000));
  const labelSize = 62 * Math.pow(rho, 0.45);
  const labelY = qy - 222 * Math.pow(rho, 0.8); // clear of Lake Balkhash

  const svgStyle: React.CSSProperties = { position: "absolute", left: 0, top: 0 };
  const cx = FRAME_W / 2;
  const cy = FRAME_H / 2;

  return (
    <AbsoluteFill style={{ backgroundColor: SPACE }}>
      {map ? (
        <>
          {/* ---------------- THE MAP: sea, water-lines, graticule, land ---------------- */}
          <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} style={svgStyle}>
            <defs>
              <path id="hcLand" d={map.land} />
              <clipPath id="hcLandClip">
                <use href="#hcLand" />
              </clipPath>
              <clipPath id="hcSphere">{sphereOn ? <circle cx={cx} cy={cy} r={s} /> : <rect x={0} y={0} width={FRAME_W} height={FRAME_H} />}</clipPath>
            </defs>
            <g clipPath="url(#hcSphere)">
              <rect x={0} y={0} width={FRAME_W} height={FRAME_H} fill={SEA} />
              {[3, 2, 1, 0].map((i) =>
                wlOp[i] > 0.004 ? (
                  <React.Fragment key={`wl${i}`}>
                    <use href="#hcLand" fill="none" stroke={mixColor(SEA, INK, wlOp[i])} strokeWidth={2 * wlGap * (i + 1) + 1.1} strokeLinejoin="round" />
                    <use href="#hcLand" fill="none" stroke={SEA} strokeWidth={2 * wlGap * (i + 1) - 1.1} strokeLinejoin="round" />
                  </React.Fragment>
                ) : null,
              )}
              {map.grats.map((g, i) => (
                <path key={`gs${i}`} d={g.d} fill="none" stroke={INK} strokeOpacity={0.12 * g.op} strokeWidth={1.2} />
              ))}
              <use href="#hcLand" fill={LAND} />
              <g clipPath="url(#hcLandClip)">
                <use href="#hcLand" fill="none" stroke={LAND_RIM} strokeOpacity={0.2} strokeWidth={28 * rimK} strokeLinejoin="round" />
                <use href="#hcLand" fill="none" stroke={LAND_RIM} strokeOpacity={0.28} strokeWidth={10 * rimK} strokeLinejoin="round" />
                {map.grats.map((g, i) => (
                  <path key={`gl${i}`} d={g.d} fill="none" stroke={INK} strokeOpacity={0.075 * g.op} strokeWidth={1.2} />
                ))}
              </g>
              <use href="#hcLand" fill="none" stroke={INK} strokeOpacity={0.8} strokeWidth={coastW} strokeLinejoin="round" />
            </g>
          </svg>

          {/* ---------------- PAPER MOTTLING, world space, on the sphere only ---------------- */}
          <div style={{ position: "absolute", inset: 0, clipPath: sphereOn ? `circle(${s.toFixed(2)}px at ${cx}px ${cy}px)` : undefined }}>
            {mottleLayer(tileA, mixA, "ma")}
            {mottleLayer(tileA * 4, 1 - mixA, "mb")}
          </div>

          {/* ---------------- THE LIMB, THE FRONT'S TRAIL, EUROPE'S PEOPLE ---------------- */}
          <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} style={svgStyle}>
            {sphereOn ? <circle cx={cx} cy={cy} r={s} fill="none" stroke={INK} strokeOpacity={0.6} strokeWidth={2} /> : null}
            {latticeOp > 0.01 ? (
              <g opacity={latticeOp} stroke={DARK} strokeOpacity={0.75} strokeWidth={1}>
                {map.dots.map((d, i) => {
                  if (!d.on) return <circle key={i} cx={d.x.toFixed(1)} cy={d.y.toFixed(1)} r={latticeR} fill={INK} />;
                  const t = clamp01((map.km - d.km) / (KM_PER_FRAME * 3));
                  const pulse = Math.sin(Math.PI * clamp01((map.km - d.km) / (KM_PER_FRAME * 7)));
                  const sh = shimmerOn ? Math.exp(-Math.pow((d.km - shimmerKm) / 420, 2)) * 0.6 : 0;
                  const fill = t <= 0 ? INK : sh > 0.02 ? mixColor(ACCENT, SHIMMER, sh) : mixColor(INK, ACCENT, t);
                  return <circle key={i} cx={d.x.toFixed(1)} cy={d.y.toFixed(1)} r={latticeR * (1 + 0.28 * pulse)} fill={fill} />;
                })}
              </g>
            ) : null}
            {map.trail ? (
              <g fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d={map.trail} stroke={DARK} strokeOpacity={0.6} strokeWidth={7} />
                <path d={map.trail} stroke={ACCENT} strokeWidth={3.6} />
              </g>
            ) : null}
            {map.head && frame < F_CAFFA + 1 ? <circle cx={map.head[0]} cy={map.head[1]} r={5.2} fill={ACCENT} stroke={DARK} strokeOpacity={0.6} strokeWidth={1.6} /> : null}
          </svg>
        </>
      ) : null}

      {/* ---------------- THE PLATE (lies on the map at the place it depicts) ---------------- */}
      {plateOn ? (
        <Img
          src={staticFile(plateSrc)}
          style={{
            position: "absolute",
            left: plateLeft,
            top: plateTop,
            width: plateW,
            height: plateH,
            boxShadow: plateCovers ? undefined : `0 0 0 ${Math.max(1, Math.min(3, plateW * 0.004)).toFixed(2)}px rgba(23,18,13,0.75)`,
          }}
        />
      ) : null}

      {/* ---------------- THE GERMS, THE DOT, THE ONE NAME ---------------- */}
      <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} style={svgStyle}>
        <defs>
          <clipPath id="hcMarmot">
            <path d={MARMOT_SIL} transform={`translate(${(pcx - (IMG_W / 2) * imgK).toFixed(2)} ${(pcy - (IMG_H / 2) * imgK).toFixed(2)}) scale(${imgK.toFixed(5)})`} />
          </clipPath>
        </defs>
        {dotR > 0.05 ? <circle cx={pcx} cy={pcy} r={dotR} fill={ACCENT} stroke={DARK} strokeOpacity={0.7} strokeWidth={Math.min(2, dotR * 0.3)} /> : null}
        {germsOn ? (
          <g clipPath={frame < T.germClipOff ? "url(#hcMarmot)" : undefined}>
            <Germs points={germPts} r={germR} casing={dotR < 6} />
          </g>
        ) : null}
        {frame >= T.label && labelOp > 0.01 ? (
          <g opacity={labelOp}>
            <Label x={qx} y={labelY} size={labelSize} sc appear={T.label} frame={frame} spacing={0.3}>
              {label}
            </Label>
          </g>
        ) : null}
      </svg>

      <Grain />
      <Vignette amount={vignette} />
    </AbsoluteFill>
  );
};

export default HalfTheContinent;
