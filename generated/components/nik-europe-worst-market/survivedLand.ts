// survivedLand: the land ThreeOrFourSurvived's slab keeps (pure: no React, no three, no fonts), shared by survivedSlab.tsx
// and the bun probe that checks every tile's footprint stands on it. Which land is Europe (lit) and which islands drop.
// @ts-expect-error untyped module
import { geoPath } from "d3-geo";
// @ts-expect-error untyped module
import { feature } from "topojson-client";
import countries50 from "world-atlas/countries-50m.json";
import { projTall } from "../nik-revolut-ipo/revolutGeo";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;
/** island rings smaller than this (sq world units) are left out (Mallorca 5.8, Euboea 5.5 go; Cyprus 8.1, Crete 12 stay) */
export const ISLAND_MIN = 6.5;
/** land enclosed by its neighbours always stays (dropping it would leave a hole in the slab): Luxembourg, Andorra,
 *  Liechtenstein, San Marino, the Vatican, Monaco, Gibraltar, and the features with no id (Kosovo, N. Cyprus ...) */
const ENCLOSED = new Set(["442", "020", "438", "674", "336", "492", "292"]);
/** islands left out by box (lon0, lat0, lon1, lat1): Corsica, Sardinia */
export const DROP_BOX: [number, number, number, number][] = [
  [8.4, 41.3, 9.7, 43.1],
  [8.0, 38.8, 9.9, 41.3],
];
// --- which land is Europe (world-atlas / ISO 3166 numeric ids) ---------------------------------------------------------
const EUROPE = new Set([
  "008", "020", "040", "112", "056", "070", "100", "191", "196", "203", "208", "233", "246", "250", "276", "300", "348", "352",
  "372", "380", "428", "438", "440", "442", "470", "498", "492", "499", "528", "807", "578", "616", "620", "642", "674", "688",
  "703", "705", "724", "752", "756", "804", "826", "336", "234", "833", "832", "831", "248", "292",
]);
/** home boxes: a European country's overseas land (French Guiana, Svalbard, the Canaries, the Azores ...) is not Europe */
const HOME_BOX: Record<string, [number, number, number, number]> = {
  "250": [-6, 41, 10, 52],
  "528": [3, 50, 8, 54],
  "826": [-9, 49, 2, 61],
  "578": [3, 57, 32, 72],
  "724": [-10, 35, 5, 44],
  "620": [-10, 36, -6, 43],
  "208": [7, 54, 16, 58],
};
/** features with no id: Kosovo is Europe (the others, N. Cyprus, Somaliland ..., are not) */
const NO_ID_EUROPE = (lon: number, lat: number) => lon > 19 && lon < 22 && lat > 41.5 && lat < 43.5;

export type Ring = [number, number][];
export const ringArea = (r: Ring) => {
  let a = 0;
  for (let i = 0; i < r.length; i++) {
    const p = r[i];
    const q = r[(i + 1) % r.length];
    a += p[0] * q[1] - q[0] * p[1];
  }
  return a / 2;
};
export const pointIn = (pt: [number, number], r: Ring) => {
  let inside = false;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    if (r[i][1] > pt[1] !== r[j][1] > pt[1] && pt[0] < ((r[j][0] - r[i][0]) * (pt[1] - r[i][1])) / (r[j][1] - r[i][1]) + r[i][0]) inside = !inside;
  }
  return inside;
};
/** the land outlines on the tall map, as kept by this slab (shared with the probe so tiles are checked on the same land) */
export const slabRings = (): { outer: Ring; holes: Ring[]; europe: boolean }[] => {
  const fc = feature(countries50 as Any, (countries50 as Any).objects.countries) as Any;
  const out: { outer: Ring; holes: Ring[]; europe: boolean }[] = [];
  for (const f of fc.features) {
    const cid = String(f.id ?? "");
    if (cid === "010") continue; // Antarctica: off the crop
    const polys: Any[] = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
    for (const coords of polys) {
      const ll0 = coords[0][0] as [number, number];
      if (DROP_BOX.some((b) => coords[0].every(([lon, lat]: [number, number]) => lon >= b[0] && lon <= b[2] && lat >= b[1] && lat <= b[3]))) continue;
      const home = HOME_BOX[cid];
      const isHome = !home || (ll0[0] >= home[0] && ll0[0] <= home[2] && ll0[1] >= home[1] && ll0[1] <= home[3]);
      const europe = cid ? EUROPE.has(cid) && isHome : NO_ID_EUROPE(ll0[0], ll0[1]);
      const rings: Ring[] = [];
      let cur: Ring | null = null;
      const ctx = {
        beginPath() {},
        moveTo(x: number, y: number) {
          cur = [[x, -y]];
          rings.push(cur);
        },
        lineTo(x: number, y: number) {
          if (cur) cur.push([x, -y]);
        },
        closePath() {},
        arc() {},
      };
      geoPath(projTall, ctx)({ type: "Polygon", coordinates: coords });
      if (!rings.length) continue;
      const clean = rings
        .map((r) => {
          const o: Ring = [];
          for (const p of r) {
            const l = o[o.length - 1];
            if (!l || Math.hypot(p[0] - l[0], p[1] - l[1]) > 0.02) o.push(p);
          }
          if (o.length > 1 && Math.hypot(o[0][0] - o[o.length - 1][0], o[0][1] - o[o.length - 1][1]) < 0.02) o.pop();
          return o;
        })
        .filter((r) => r.length >= 3 && (ENCLOSED.has(cid) || !cid || Math.abs(ringArea(r)) > ISLAND_MIN));
      if (!clean.length) continue;
      clean.sort((a, b) => Math.abs(ringArea(b)) - Math.abs(ringArea(a)));
      const sign = Math.sign(ringArea(clean[0]));
      const outers: { outer: Ring; holes: Ring[]; europe: boolean }[] = [];
      for (const r of clean) {
        if (Math.sign(ringArea(r)) === sign) outers.push({ outer: r, holes: [], europe });
        else {
          const host = outers.find((o) => pointIn(r[0], o.outer));
          if (host) host.holes.push(r);
        }
      }
      out.push(...outers);
    }
  }
  return out;
};
