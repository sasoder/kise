// Bakes the two point tables of HalfTheContinent (plague clip) into
// generated/components/kyle-plague/HalfTheContinentData.ts:
//
//   bun scripts/clips/kyle-plague/build-HalfTheContinent-data.mjs
//
//   LATTICE  an even lattice of dots over EUROPE (the continent: west of the
//            Urals / the Ural river / the Caspian, north of the Caucasus, incl.
//            the Mediterranean shores, Britain, Ireland and Scandinavia; no
//            Iceland, Svalbard, Anatolia or North Africa). The lattice is square
//            in the FINAL framing (orthographic, centre 40 E 38.5 N, sphere radius
//            560 px): PITCH px apart there. Each dot: [lon, lat, parity, km],
//            parity = checkerboard (i + j) & 1, km = how far the front has to
//            travel to reach it (along the steppe route, then straight on).
//   ROUTE    the front's own route east of Europe, densified, with running km:
//            Chuy valley / Issyk-Kul (42.8 N, 75 E; earliest dated Black Death
//            burials, 1338-39: Spyrou et al. 2022, Nature 606) -> the steppe
//            north of the Aral and the Caspian -> the lower Volga -> Caffa in
//            Crimea (35.4 E, 45.0 N).
// Natural Earth 50m countries from the installed world-atlas.

import { readFileSync, writeFileSync } from "node:fs";
import { geoBounds, geoContains, geoDistance, geoInterpolate, geoOrthographic } from "d3-geo";
import { feature } from "topojson-client";

const OUT = "generated/components/kyle-plague/HalfTheContinentData.ts";
const PITCH = 12; // px between dots at the final framing
const R_KM = 6371;
const FINAL = { rotate: [-40, -38.5], scale: 560, translate: [540, 960] };

const topo = JSON.parse(readFileSync("node_modules/world-atlas/countries-50m.json", "utf8"));
const countries = feature(topo, topo.objects.countries).features;

// name -> extra test on (lon, lat); true = the whole country
const all = () => true;
const EUROPE = {
  Albania: all, Andorra: all, Austria: all, Belarus: all, Belgium: all, "Bosnia and Herz.": all, Bulgaria: all,
  Croatia: all, Czechia: all, Estonia: all, Finland: all, Germany: all, Greece: all, Hungary: all, Ireland: all,
  Italy: all, Kosovo: all, Latvia: all, Liechtenstein: all, Lithuania: all, Luxembourg: all, Macedonia: all,
  "North Macedonia": all, Malta: all, Moldova: all, Monaco: all, Montenegro: all, Poland: all, Romania: all,
  "San Marino": all, Serbia: all, Slovakia: all, Slovenia: all, Sweden: all, Switzerland: all, Ukraine: all,
  "Isle of Man": all, Jersey: all, Guernsey: all, "Åland": all, Aland: all,
  Denmark: (lon) => lon > 0,
  Netherlands: (lon) => lon > 0,
  France: (lon, lat) => lon > -6 && lon < 10 && lat > 41 && lat < 52,
  Spain: (lon, lat) => lat > 35.9,
  Portugal: (lon) => lon > -10,
  "United Kingdom": (lon, lat) => lon > -9 && lat > 49,
  Norway: (lon, lat) => lat < 71.3,
  Russia: (lon) => lon > 0 && lon < 60,
  Kazakhstan: (lon, lat) => lon < 51.5 && lat > 46.5,
  Turkey: (lon, lat) => lon < 28.9 && lat > 40.3,
};
const picked = countries
  .filter((c) => EUROPE[c.properties.name])
  .map((c) => ({ f: c, test: EUROPE[c.properties.name], b: geoBounds(c), name: c.properties.name }));
console.log(`countries: ${picked.map((p) => p.name).join(", ")}`);

// -- the route --------------------------------------------------------------------
const ORIGIN = [75, 42.8];
const CAFFA = [35.4, 45.0];
const KEYS = [ORIGIN, [66, 44.6], [58.5, 47.0], [51.5, 47.9], [46, 48.3], [40.5, 47.2], CAFFA];
const route = [];
let km = 0;
for (let i = 0; i < KEYS.length - 1; i++) {
  const a = KEYS[i];
  const b = KEYS[i + 1];
  const it = geoInterpolate(a, b);
  const seg = geoDistance(a, b) * R_KM;
  const n = Math.ceil(seg / 40);
  for (let j = i === 0 ? 0 : 1; j <= n; j++) {
    const p = it(j / n);
    route.push([+p[0].toFixed(3), +p[1].toFixed(3), +(km + (seg * j) / n).toFixed(1)]);
  }
  km += seg;
}
const ROUTE_KM = km;

// -- the lattice -------------------------------------------------------------------
const proj = geoOrthographic().rotate(FINAL.rotate).scale(FINAL.scale).translate(FINAL.translate);
const lattice = [];
let maxKm = 0;
for (let j = 0, y = 468; y <= 1140; y += PITCH, j++) {
  for (let i = 0, x = 0; x <= 864; x += PITCH, i++) {
    const ll = proj.invert([x, y]);
    if (!ll || !isFinite(ll[0]) || Math.hypot(x - 540, y - 960) > FINAL.scale - 5) continue;
    const [lon, lat] = ll;
    if (lon < -11 || lon > 60 || lat < 34.5 || lat > 71.5) continue;
    const hit = picked.some((c) => {
      const [[w, s], [e, n]] = c.b;
      const inLon = w <= e ? lon >= w && lon <= e : lon >= w || lon <= e;
      return inLon && lat >= s && lat <= n && c.test(lon, lat) && geoContains(c.f, ll);
    });
    if (!hit) continue;
    let d = Infinity;
    for (const r of route) d = Math.min(d, r[2] + geoDistance([r[0], r[1]], ll) * R_KM);
    maxKm = Math.max(maxKm, d);
    lattice.push([+lon.toFixed(3), +lat.toFixed(3), (i + j) & 1, Math.round(d)]);
  }
}
const orange = lattice.filter((p) => p[2] === 1).length;
console.log(`lattice ${lattice.length} dots, ${orange} orange (${((100 * orange) / lattice.length).toFixed(1)}%), route ${ROUTE_KM.toFixed(0)} km, farthest dot ${maxKm.toFixed(0)} km`);

writeFileSync(
  OUT,
  `// Baked by scripts/clips/kyle-plague/build-HalfTheContinent-data.mjs: do not edit by hand.
/** the final framing the lattice is square in (d3 geoOrthographic) */
export const FINAL = ${JSON.stringify(FINAL)} as const;
export const PITCH = ${PITCH};
export const ORIGIN: [number, number] = ${JSON.stringify(ORIGIN)};
export const CAFFA: [number, number] = ${JSON.stringify(CAFFA)};
/** [lon, lat, km from the origin] */
export const ROUTE: [number, number, number][] = ${JSON.stringify(route)};
export const ROUTE_KM = ${ROUTE_KM.toFixed(1)};
/** the farthest lattice dot, km the front travels to reach it */
export const MAX_KM = ${Math.ceil(maxKm)};
/** [lon, lat, parity (1 = turns orange), km the front travels to reach it] */
export const LATTICE: [number, number, number, number][] = ${JSON.stringify(lattice)};
`,
);
console.log(`Wrote ${OUT}; the origin dot sits at ${proj(ORIGIN).map((v) => v.toFixed(1))} in the final framing`);
