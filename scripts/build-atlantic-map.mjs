// Bakes Natural Earth LAND (no country borders) into flat SVG path strings for
// ParisToBrownsville, so the Remotion component stays dependency-free and
// deterministic at render time.
//
//   bun scripts/build-atlantic-map.mjs [diagnostic.svg]
//
// THE PROJECTION IS NORTH-UP AND FLAT. `geoMercator().rotate([45, 0])`: the
// centre meridian is 45 W, so the North Atlantic sits in the middle of the
// canvas with Western Europe, Iberia and North Africa down the right, the US
// East and Gulf coasts, Florida, the Caribbean and Mexico down the left and
// Greenland, Newfoundland and Canada across the top. Every meridian is a
// vertical line, so France is France and Texas is Texas — no roll, no tilt.
//
// WHY MERCATOR AND NOT THE BRIEFED CONIC. A conic fans its meridians out of the
// apex at n = sin(standard parallel)-ish per degree of longitude, so a point
// Δλ off the centre meridian has its own north rotated by n·Δλ. Paris is 47.4
// off 45 W, so on `geoConicConformal().parallels([30, 55]).rotate([45, 0])`
// Europe leans 32.3 deg counter-clockwise and Texas leans 35.8 deg the other
// way — measured, both printed by the exploration pass. That lean is the exact
// fault this rebuild exists to remove, and it cannot be tuned out: flattening
// the fan enough to kill it (n -> 0) IS a cylindrical projection. Mercator is
// the cylindrical one that keeps local shape (it is conformal), so coastlines
// still look like themselves. Measured tilt at both cities: 0.0 deg.
//
// THE FIT. Two anchors, solved rather than guessed: `scale` is set so the two
// cities are PARIS_XY[0] - BROWNSVILLE_X = 780 px apart in x, then `translate`
// puts Paris on PARIS_XY. Brownsville's y then falls where the world says it
// falls, and the script prints it.
//
// Land is post-clipped to the canvas plus MARGIN, which is past anything the
// camera can reach at either end of its move, so no clip edge is ever in frame.

import { readFileSync, writeFileSync } from "node:fs";
import { geoInterpolate, geoMercator, geoPath } from "d3-geo";
import { feature } from "topojson-client";

const OUT = "generated/components/atlanticMapData.ts";
const DIAG = process.argv[2] ?? null;

const PARIS_LL = [2.3522, 48.8566];
const BROWNSVILLE_LL = [-97.4975, 25.9017];
// Paris top right, Brownsville bottom left, and the great circle bowing up
// between them through Newfoundland. PARIS_XY[1] is chosen so that apex lands
// on y 540: the bow is 54 px above Paris at this scale, and the brief asks for
// 540.
const PARIS_XY = [930, 594];
const BROWNSVILLE_X = 150;
const SPAN_X = PARIS_XY[0] - BROWNSVILLE_X; // 780 px between the two cities
const CENTRE_MERIDIAN = 45; // deg W
const SAMPLES = 160; // >= 96 samples of the great circle
// The canvas plus a margin. The two ends of the camera move see world x
// 685..1176 / y 215..1088 (the k 2.2 close-up on Paris) and the whole canvas
// (k 1.0), so 250 px of slack on every side is past anything a frame reaches.
const MARGIN = 250;
const CLIP = [
  [-MARGIN, -MARGIN],
  [1080 + MARGIN, 1920 + MARGIN],
];

const projection = geoMercator().rotate([CENTRE_MERIDIAN, 0]);

// -- the fit ----------------------------------------------------------------
projection.scale(1).translate([0, 0]);
const unitP = projection(PARIS_LL);
const unitB = projection(BROWNSVILLE_LL);
const SCALE = SPAN_X / (unitP[0] - unitB[0]);
projection.scale(SCALE);
const at0 = projection(PARIS_LL);
projection.translate([PARIS_XY[0] - at0[0], PARIS_XY[1] - at0[1]]);

const paris = projection(PARIS_LL);
const brownsville = projection(BROWNSVILLE_LL);

// -- the great circle -------------------------------------------------------
const gi = geoInterpolate(PARIS_LL, BROWNSVILLE_LL);
const route = [];
for (let i = 0; i <= SAMPLES; i++) route.push(projection(gi(i / SAMPLES)));

let routeLen = 0;
for (let i = 1; i < route.length; i++) {
  routeLen += Math.hypot(route[i][0] - route[i - 1][0], route[i][1] - route[i - 1][1]);
}
const apex = route.reduce((m, p) => (p[1] < m[1] ? p : m), route[0]);

// The angle local north makes with the page, at each city: 0 is north up.
const tiltAt = (ll) => {
  const a = projection(ll);
  const b = projection([ll[0], ll[1] + 0.5]);
  return (Math.atan2(b[0] - a[0], a[1] - b[1]) * 180) / Math.PI;
};

const r1 = (n) => Math.round(n * 10) / 10;
const r3 = (n) => Math.round(n * 1000) / 1000;

console.log(`projection    geoMercator().rotate([${CENTRE_MERIDIAN}, 0])   scale ${r3(SCALE)}`);
console.log(`translate     ${r1(projection.translate()[0])}, ${r1(projection.translate()[1])}`);
console.log(`Paris         ${r1(paris[0])}, ${r1(paris[1])}   (want ${PARIS_XY})`);
console.log(`Brownsville   ${r1(brownsville[0])}, ${r1(brownsville[1])}   (want x ${BROWNSVILLE_X})`);
console.log(`route apex    ${r1(apex[0])}, ${r1(apex[1])}      arclength ${r1(routeLen)} px`);
console.log(`north tilt    Paris ${r3(tiltAt(PARIS_LL))} deg   Brownsville ${r3(tiltAt(BROWNSVILLE_LL))} deg`);

// -- the land ---------------------------------------------------------------
// `land-50m` stores land as a GeometryCollection, so `feature` hands back a
// FeatureCollection; geoPath wants one geometry, so they go back together.
const topo = JSON.parse(readFileSync("node_modules/world-atlas/land-50m.json", "utf8"));
const land = feature(topo, topo.objects.land);
const landGeometry = {
  type: "GeometryCollection",
  geometries: land.features.map((f) => f.geometry),
};

// A path sink that rounds to a tenth of a pixel and drops any vertex closer
// than MIN_STEP to the one before it. The 50m coastline carries far more
// detail than 8 px per degree can show, and the raw string is most of a
// megabyte of repeated points; this is the same shape at a fraction the size.
const MIN_STEP = 0.5;
const roundingContext = () => {
  let out = "";
  let px = 0;
  let py = 0;
  let sx = 0;
  let sy = 0;
  let pending = null;
  const n = (v) => {
    const r = Math.round(v * 10) / 10;
    return Object.is(r, -0) ? 0 : r;
  };
  return {
    moveTo(x, y) {
      if (pending) {
        out += `L${n(pending[0])},${n(pending[1])}`;
        pending = null;
      }
      px = x;
      py = y;
      sx = x;
      sy = y;
      out += `M${n(x)},${n(y)}`;
    },
    lineTo(x, y) {
      if (Math.hypot(x - px, y - py) < MIN_STEP) {
        pending = [x, y]; // remember it, in case it is the last of the ring
        return;
      }
      pending = null;
      px = x;
      py = y;
      out += `L${n(x)},${n(y)}`;
    },
    closePath() {
      // The ring's last vertex matters: dropping it can leave a visible chord.
      if (pending && Math.hypot(pending[0] - sx, pending[1] - sy) >= MIN_STEP) {
        out += `L${n(pending[0])},${n(pending[1])}`;
      }
      pending = null;
      out += "Z";
    },
    result() {
      return out;
    },
  };
};

projection.clipExtent(CLIP);
const sink = roundingContext();
geoPath(projection, sink)(landGeometry);
const landD = sink.result();

const routeD =
  `M ${r1(route[0][0])} ${r1(route[0][1])}` +
  route
    .slice(1)
    .map(([x, y]) => ` L ${r1(x)} ${r1(y)}`)
    .join("");

const body = `// Generated by scripts/build-atlantic-map.mjs — do not edit by hand.
// Natural Earth land (public domain, land-50m, no country borders) on a
// north-up Mercator centred on 45 W, fitted to a 1080x1920 canvas so that the
// Paris -> Brownsville great circle runs diagonally across the top third.
//
//   projection    geoMercator().rotate([${CENTRE_MERIDIAN}, 0])   scale ${r3(SCALE)}
//   Paris         (${r1(paris[0])}, ${r1(paris[1])})
//   Brownsville   (${r1(brownsville[0])}, ${r1(brownsville[1])})
//   route apex    (${r1(apex[0])}, ${r1(apex[1])})   arclength ${r1(routeLen)} px
//   north tilt    ${r3(tiltAt(PARIS_LL))} deg at Paris, ${r3(tiltAt(BROWNSVILLE_LL))} deg at Brownsville
//   land clipped to ${JSON.stringify(CLIP)}

export type Pt = { x: number; y: number };

/** The whole landmass as one path. Holes would be lakes, so it is filled evenodd. */
export const LAND_D = ${JSON.stringify(landD)};

export const PARIS: Pt = { x: ${r1(paris[0])}, y: ${r1(paris[1])} };
export const BROWNSVILLE: Pt = { x: ${r1(brownsville[0])}, y: ${r1(brownsville[1])} };

/** The great circle, ${SAMPLES + 1} projected samples. */
export const ROUTE_PTS: Pt[] = ${JSON.stringify(route.map(([x, y]) => ({ x: r1(x), y: r1(y) })))};

export const ROUTE_D = ${JSON.stringify(routeD)};
export const ROUTE_LEN = ${r3(routeLen)};
export const ROUTE_APEX: Pt = { x: ${r1(apex[0])}, y: ${r1(apex[1])} };
`;

writeFileSync(OUT, body);
console.log(`Wrote ${OUT}: land path ${landD.length} chars, ${route.length} route samples.`);

if (DIAG) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
  <rect width="1080" height="1920" fill="#E9E9E9"/>
  <path d="${landD}" fill="#FFFFFF" fill-rule="evenodd"/>
  <path d="${routeD}" fill="none" stroke="#0046FF" stroke-width="7" stroke-linecap="round"/>
  <circle cx="${r1(paris[0])}" cy="${r1(paris[1])}" r="20" fill="#BC37FF"/>
  <circle cx="${r1(brownsville[0])}" cy="${r1(brownsville[1])}" r="20" fill="#BC37FF"/>
  <rect x="0" y="0" width="1080" height="1920" fill="none" stroke="#FF0000" stroke-width="3"/>
</svg>`;
  writeFileSync(DIAG, svg);
  console.log(`Wrote ${DIAG}`);
}
