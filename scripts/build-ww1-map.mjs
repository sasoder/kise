// Bakes the 1914 Europe + Africa map for EverybodyWants into flat SVG path
// strings, plus the two paper textures, so the Remotion component stays
// dependency-free and deterministic at render time.
//
//   bun scripts/build-ww1-map.mjs [path/to/world_1914.geojson]
//
// The 1914 polities come from aourednik/historical-basemaps (world_1914.geojson,
// a plain GeoJSON data file). Pass a local copy, or leave the argument off and
// the script fetches it; it is never committed, only what is baked below is.
//
// Writes
//   generated/components/ww1MapData.ts   land, 1914 borders, graticule (for the raster bake)
//   generated/components/ww1Overlay.ts   wants, special lines, places (drawn as vectors)
//   public/ww1/grain.png                 1080x1920 screen-space paper grain
//   public/ww1/mottle.png                512x512 world-space paper mottling
//
// THE PROJECTION is Lambert azimuthal equal-area centred on 15 E, 25 N, north
// up. A conic cannot carry southern Africa; this one holds Europe and Africa in
// one portrait frame with little shape distortion over either. Scale: the
// Europe wide (camera k 1) spans western Ireland (10.5 W) to 50 E across the
// 1080 px frame at 53.5 N, with 19.75 E / 53.5 N on screen (540, 835). World px
// == screen px at that establishing shot; every other framing is a zoom.
//
// 1914 BORDERS, NOT MODERN ONES. The historical dataset is coarse (borders at
// ~20 km vertices) and wrong in several places, so the polity at any point is a
// FIELD built from three sources, most trusted first:
//   1. hand override polygons for every place the dataset gets wrong (below),
//   2. modern Natural Earth countries wherever a modern state lay wholly inside
//      one 1914 polity (France, Germany, Croatia, Bosnia ...), which snaps those
//      borders to the crisp 10m lines,
//   3. the historical dataset elsewhere (the Polish partitions, Galicia,
//      Transylvania, Trentino, Arabia, the African colonies).
// Border candidates (modern 10m lines, dataset polygon edges, override polygon
// edges) are all side-tested against the field: a candidate is kept only where
// the polity really changes across it, then de-duplicated by source priority.
//
// HAND CORRECTIONS (each is a polygon below, applied inside the named modern
// country):
//   AL        Alsace-Lorraine German: the 1871 Frankfurt line, hand-traced from
//             Audun-le-Tiche to Pfetterhouse (the dataset puts Metz in France)
//   EUPEN     Eupen-Malmedy and St Vith German (dataset: Belgian)
//   NSCHLES   North Schleswig to the Kongeaa, with Ribe left Danish (dataset: Danish)
//   ITEAST    the 1866 line: Val Canale (Tarvisio), Gorizia-Gradisca, Grado,
//             Monfalcone and Trieste Austrian (dataset: Italian)
//   CORTINA   Ampezzo / Buchenstein Tyrolean (dataset: Italian)
//   BOKA      the Bocche di Cattaro to Spizza Austrian (dataset: Montenegrin)
//   EAST THRACE  Ottoman (dataset: Bulgarian to the Bosporus) - modern Turkey rule
//   WTHRACE   Western Thrace Bulgarian, the Nestos line (1913)
//   SDOBRUJA  South Dobruja Romanian, Tutrakan-Ekrene line (1913; dataset: Bulgarian)
//   STRUMICA  the Strumica salient Bulgarian (dataset: Serbian)
//   OUTLANDS  Tsaribrod and Bosilegrad Bulgarian (to 1920)
//   METOHIJA  Pec / Djakovica Montenegrin (1913)
//   VOJVODINA north of the Sava and Danube Austro-Hungarian
//   BESSARABIA  all of it Russian, the Prut and the Kilia arm (dataset: Romanian)
//   KARS      Kars, Ardahan, Artvin, Batum and Igdir Russian (1878; dataset: Ottoman)
//   Finland, the Baltics, Georgia, Armenia, Azerbaijan Russian; Kaliningrad and
//   Memel German; Ireland, Malta and Cyprus British; Algeria + French West and
//   Equatorial Africa one French fill (the dataset's split between the two is wrong).

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";
import { geoArea, geoAzimuthalEqualArea, geoGraticule, geoPath } from "d3-geo";
import { feature, mesh } from "topojson-client";
import polygonClipping from "polygon-clipping";

const OUT = "generated/components/ww1MapData.ts";
const OUT_OVERLAY = "generated/components/ww1Overlay.ts";
const TEX_DIR = "public/ww1";
const SRC_URL =
  "https://raw.githubusercontent.com/aourednik/historical-basemaps/master/geojson/world_1914.geojson";

// -- the 1914 dataset -----------------------------------------------------------
const hist = await (async () => {
  const p = process.argv[2];
  if (p && existsSync(p)) return JSON.parse(readFileSync(p, "utf8"));
  const res = await fetch(SRC_URL);
  if (!res.ok) throw new Error(`fetch ${SRC_URL}: ${res.status}`);
  return res.json();
})();

// -- projection -----------------------------------------------------------------
const projection = geoAzimuthalEqualArea().rotate([-15, -25]).scale(1).translate([0, 0]);
{
  const a = projection([-10.5, 53.5]);
  const b = projection([50, 53.5]);
  projection.scale(1080 / Math.hypot(b[0] - a[0], b[1] - a[1]));
  const c = projection([19.75, 53.5]);
  projection.translate([540 - c[0], 835 - c[1]]);
}
const SCALE = projection.scale();
// The widest frame is the Europe + Africa wide (k ~0.5): world x ~[-600, 1600],
// y ~[100, 4000]. The clip sits well outside it.
const CLIP = [
  [-1100, -500],
  [2200, 4600],
];
// A small-circle clip (d3's robust polygon clip) rather than a rectangle: the
// Afro-Eurasian ring, clipped to a rectangle this far from the centre, came out
// inside-out. 112 deg holds every frame of the piece.
projection.clipAngle(112).clipExtent(CLIP);

const VIEW = { lon: [-100, 125], lat: [-67, 86] };
const ringInView = (ring) => {
  let [x0, x1, y0, y1] = [Infinity, -Infinity, Infinity, -Infinity];
  for (const [lon, lat] of ring) {
    x0 = Math.min(x0, lon);
    x1 = Math.max(x1, lon);
    y0 = Math.min(y0, lat);
    y1 = Math.max(y1, lat);
  }
  return x1 >= VIEW.lon[0] && x0 <= VIEW.lon[1] && y1 >= VIEW.lat[0] && y0 <= VIEW.lat[1];
};
const polysOf = (g) => (g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : []);
const inView = (geometry) => {
  const kept = polysOf(geometry).filter((rings) => ringInView(rings[0]));
  return kept.length ? { type: "MultiPolygon", coordinates: kept } : null;
};

// Rings that cross the dateline (Afro-Eurasia via Chukotka, the dataset's Fiji)
// are fine on the sphere but not in a planar lon/lat raster: unwrap them so
// longitude is continuous (the far side then lies off the raster).
const unwrap = (ring) => {
  let off = 0;
  const out = ring.map(([lon, lat], i) => {
    if (i > 0) {
      const d = lon - ring[i - 1][0];
      if (d > 180) off -= 360;
      else if (d < -180) off += 360;
    }
    return [lon + off, lat];
  });
  // put the bulk of the ring back in [-180, 180]
  const mid = out.map(([x]) => x).sort((a, b) => a - b)[out.length >> 1];
  const shift = -360 * Math.round(mid / 360);
  return shift ? out.map(([x, y]) => [x + shift, y]) : out;
};
const unwrapPolys = (polys) => polys.map((rings) => rings.map(unwrap));
const splitAtJumps = (line) => {
  const out = [];
  let cur = [line[0]];
  for (let i = 1; i < line.length; i++) {
    if (Math.abs(line[i][0] - line[i - 1][0]) > 180) {
      out.push(cur);
      cur = [];
    }
    cur.push(line[i]);
  }
  out.push(cur);
  return out.filter((c) => c.length > 1);
};

// -- a rounding path sink: finer where the camera goes close --------------------
const Y_MED = projection([15, 34.5])[1];
const Y_NORTH = projection([15, 63])[1];
const X_EAST = projection([41, 42])[0];
const X_WEST = projection([-11, 50])[0];
const stepAt = (x, y) =>
  x < -700 || x > 1850 || y < -250 || y > 4250 ? 6 : y > Y_MED || y < Y_NORTH || x > X_EAST || x < X_WEST ? 0.9 : 0.3;
const n2 = (v) => {
  const r = Math.round(v * 20) / 20;
  return Object.is(r, -0) ? 0 : r;
};
const roundingContext = () => {
  let out = "";
  let px = 0;
  let py = 0;
  let sx = 0;
  let sy = 0;
  let pending = null;
  return {
    moveTo(x, y) {
      if (pending) {
        out += `L${n2(pending[0])},${n2(pending[1])}`;
        pending = null;
      }
      px = sx = x;
      py = sy = y;
      out += `M${n2(x)},${n2(y)}`;
    },
    lineTo(x, y) {
      if (Math.hypot(x - px, y - py) < stepAt(x, y)) {
        pending = [x, y];
        return;
      }
      pending = null;
      px = x;
      py = y;
      out += `L${n2(x)},${n2(y)}`;
    },
    closePath() {
      if (pending && Math.hypot(pending[0] - sx, pending[1] - sy) >= stepAt(sx, sy)) {
        out += `L${n2(pending[0])},${n2(pending[1])}`;
      }
      pending = null;
      out += "Z";
    },
    result() {
      return out;
    },
  };
};
const bake = (geo) => {
  const sink = roundingContext();
  geoPath(projection, sink)(geo);
  return sink.result();
};
const bakeLand = (geo) => {
  const sink = roundingContext();
  const p2 = geoAzimuthalEqualArea()
    .rotate(projection.rotate())
    .scale(projection.scale())
    .translate(projection.translate())
    .clipAngle(112);
  geoPath(p2, sink)(geo);
  return sink.result();
};
const r2 = (v) => Math.round(v * 100) / 100;
const P = (ll) => {
  const [x, y] = projection(ll);
  return { x: r2(x), y: r2(y) };
};
// Planar polygons (polygon-clipping output) are projected point by point: d3
// would read their winding spherically.
const polyD = (multi) => {
  let d = "";
  for (const poly of multi) {
    for (const ring of poly) {
      const pts = ring.map((ll) => projection(ll));
      let s = "";
      let last = null;
      for (const [x, y] of pts) {
        if (last && Math.hypot(x - last[0], y - last[1]) < 0.35) continue;
        s += `${s ? "L" : "M"}${n2(x)},${n2(y)}`;
        last = [x, y];
      }
      d += `${s}Z`;
    }
  }
  return d;
};
const lineD = (chains) =>
  chains
    .map((c) => {
      let s = "";
      let last = null;
      c.forEach((ll, i) => {
        const [x, y] = projection(ll);
        if (last && i < c.length - 1 && Math.hypot(x - last[0], y - last[1]) < 0.35) return;
        s += `${s ? "L" : "M"}${n2(x)},${n2(y)}`;
        last = [x, y];
      });
      return s;
    })
    .join("");

// -- sources ----------------------------------------------------------------------
const landTopo = JSON.parse(readFileSync("node_modules/world-atlas/land-10m.json", "utf8"));
const land = feature(landTopo, landTopo.objects.land);
// Land goes through d3's small-circle clip only (clipAngle, set above): with
// the rectangle clip as well, the Afro-Eurasian ring came out inside-out. Far
// off-frame coast is thinned hard by the sink (stepAt).
// Three degenerate 4-vertex islets in land-10m wind the wrong way (spherical
// area 4 pi) and would flood the map; they are dropped.
const LAND_D = bakeLand({
  type: "MultiPolygon",
  coordinates: land.features.flatMap((f) => polysOf(f.geometry)).filter((p) => geoArea({ type: "Polygon", coordinates: p }) < 2 * Math.PI),
});

const cTopo = JSON.parse(readFileSync("node_modules/world-atlas/countries-10m.json", "utf8"));
const countries = feature(cTopo, cTopo.objects.countries).features;
const countryGeom = (name) => {
  const f = countries.find((c) => c.properties.name === name);
  if (!f) throw new Error(`no country ${name}`);
  return polysOf(inView(f.geometry));
};

// -- rasters: the modern country and the dataset polity at every 0.02 deg ------
const RES = 0.02;
const LON0 = -34;
const LAT0 = -58;
const RW = Math.ceil((100 - LON0) / RES);
const RH = Math.ceil((84 - LAT0) / RES);
const rasterize = (raster, polys, id) => {
  const rows = new Map();
  for (const rings of polys) {
    for (const ring of rings) {
      for (let i = 0; i < ring.length - 1; i++) {
        const [x0, y0] = ring[i];
        const [x1, y1] = ring[i + 1];
        if (y0 === y1) continue;
        const ymin = Math.min(y0, y1);
        const ymax = Math.max(y0, y1);
        const j0 = Math.max(0, Math.ceil((ymin - LAT0) / RES - 0.5));
        const j1 = Math.min(RH - 1, Math.floor((ymax - LAT0) / RES - 0.5));
        for (let j = j0; j <= j1; j++) {
          const yc = LAT0 + (j + 0.5) * RES;
          if (yc < ymin || yc >= ymax) continue;
          const x = x0 + ((yc - y0) * (x1 - x0)) / (y1 - y0);
          let a = rows.get(j);
          if (!a) rows.set(j, (a = []));
          a.push(x);
        }
      }
    }
  }
  for (const [j, xs] of rows) {
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const i0 = Math.max(0, Math.ceil((xs[k] - LON0) / RES - 0.5));
      const i1 = Math.min(RW - 1, Math.floor((xs[k + 1] - LON0) / RES - 0.5));
      for (let i = i0; i <= i1; i++) raster[j * RW + i] = id;
    }
  }
};
const cell = (lon, lat) => {
  const i = Math.floor((lon - LON0) / RES);
  const j = Math.floor((lat - LAT0) / RES);
  if (i < 0 || j < 0 || i >= RW || j >= RH) return -1;
  return j * RW + i;
};

const modernNames = [null];
const modernRaster = new Uint16Array(RW * RH);
for (const f of countries) {
  const g = inView(f.geometry);
  if (!g) continue;
  modernNames.push(f.properties.name);
  rasterize(modernRaster, unwrapPolys(g.coordinates), modernNames.length - 1);
}
const modernAt = (lon, lat) => {
  const c = cell(lon, lat);
  return c < 0 ? null : modernNames[modernRaster[c]];
};

// Dataset names -> one polity each.
const MERGE = {
  "German Empire": "Germany",
  "Austro-Hungarian Empire": "AustriaHungary",
  "Russian Empire": "Russia",
  Finland: "Russia",
  Georgia: "Russia",
  Armenia: "Russia",
  Azerbaijan: "Russia",
  "Kingdom of Italy": "Italy",
  "United Kingdom of Great Britain and Ireland": "UK",
  "Ottoman Empire": "Ottoman",
  Algeria: "FrenchAfrica",
  "French West Africa": "FrenchAfrica",
  "French Equatorial Africa": "FrenchAfrica",
  "Rio De Oro": "SpanishSahara",
  "Spanish Sahara": "SpanishSahara",
  "German E. Africa (Tanganyika)": "GermanEastAfrica",
  "German South-West Africa": "GermanSouthWestAfrica",
  Togoland: "Togo",
  Kamerun: "Kamerun",
};
const histNames = [null];
const histRaster = new Uint8Array(RW * RH);
for (const f of hist.features) {
  const name = f.properties.NAME;
  if (!name) continue; // unnamed islands: the modern rules cover them
  const g = inView(f.geometry);
  if (!g) continue;
  const polity = MERGE[name] ?? name;
  let id = histNames.indexOf(polity);
  if (id < 0) {
    histNames.push(polity);
    id = histNames.length - 1;
  }
  rasterize(histRaster, unwrapPolys(g.coordinates), id);
}
const histAt0 = (lon, lat) => {
  const c = cell(lon, lat);
  return c < 0 ? null : histNames[histRaster[c]];
};
// The dataset's coast is coarse: look around a little before giving up.
const histAt = (lon, lat) => {
  const v = histAt0(lon, lat);
  if (v) return v;
  for (const r of [0.05, 0.1, 0.2, 0.35]) {
    for (let a = 0; a < 8; a++) {
      const w = histAt0(lon + r * Math.cos((a * Math.PI) / 4), lat + r * Math.sin((a * Math.PI) / 4));
      if (w) return w;
    }
  }
  return null;
};

// -- hand override polygons (lon, lat) -------------------------------------------
// The 1871 Frankfurt border, north (Luxembourg) to south (Switzerland).
const LINE_1871 = [
  [5.94, 49.49], [5.95, 49.42], [5.97, 49.34], [5.98, 49.25], [5.97, 49.17], [5.95, 49.1],
  [6.0, 49.02], [6.04, 48.97], [6.12, 48.93], [6.25, 48.92], [6.35, 48.84], [6.45, 48.77],
  [6.58, 48.71], [6.72, 48.66], [6.82, 48.62], [6.95, 48.62], [7.08, 48.55], [7.13, 48.47],
  [7.09, 48.37], [7.1, 48.27], [7.09, 48.17], [7.02, 48.06], [6.94, 47.95], [6.84, 47.82],
  [6.94, 47.74], [7.0, 47.66], [7.05, 47.58], [7.12, 47.5], [7.13, 47.46],
];
const H = {
  AL: [...LINE_1871, [7.13, 47.38], [8.6, 47.38], [8.6, 49.62], [5.94, 49.62]],
  EUPEN: [
    [6.02, 50.76], [5.97, 50.7], [5.93, 50.63], [5.97, 50.55], [5.99, 50.47], [5.98, 50.4],
    [5.99, 50.33], [6.03, 50.25], [6.08, 50.17], [6.12, 50.13], [6.6, 50.13], [6.6, 50.8], [6.02, 50.8],
  ],
  NSCHLES: [
    [8.0, 55.28], [8.6, 55.28], [8.75, 55.28], [8.88, 55.33], [8.95, 55.4], [9.05, 55.45],
    [9.25, 55.47], [9.45, 55.47], [9.58, 55.48], [9.72, 55.49], [10.3, 55.4], [10.3, 54.75], [8.0, 54.75],
  ],
  ITEAST: [
    [13.28, 46.56], [13.3, 46.5], [13.36, 46.43], [13.44, 46.36], [13.42, 46.28], [13.5, 46.2],
    [13.55, 46.13], [13.53, 46.05], [13.5, 45.98], [13.45, 45.93], [13.4, 45.88], [13.33, 45.82],
    [13.3, 45.75], [13.24, 45.7], [13.24, 45.5], [14.0, 45.5], [14.0, 46.75], [13.28, 46.75],
  ],
  CORTINA: [[11.9, 46.5], [11.95, 46.62], [12.3, 46.62], [12.3, 46.45], [12.1, 46.45]],
  BOKA: [
    [18.4, 42.62], [18.52, 42.56], [18.62, 42.52], [18.73, 42.47], [18.8, 42.42], [18.86, 42.34],
    [18.96, 42.24], [19.04, 42.15], [19.08, 42.1], [18.9, 41.95], [18.3, 42.3],
  ],
  STRUMICA: [[22.42, 41.62], [22.95, 41.62], [22.95, 41.25], [22.6, 41.2], [22.42, 41.35]],
  SDOBRUJA: [
    [26.55, 44.07], [26.95, 43.9], [27.3, 43.75], [27.55, 43.62], [27.8, 43.5], [27.95, 43.42],
    [28.08, 43.34], [28.9, 43.34], [28.9, 44.3], [26.55, 44.3],
  ],
  WTHRACE: [
    [23.83, 41.46], [23.93, 41.37], [24.12, 41.33], [24.25, 41.27], [24.35, 41.2], [24.5, 41.1],
    [24.6, 41.0], [24.72, 40.87], [24.9, 40.78], [26.2, 40.62], [26.8, 40.62], [26.8, 42.0], [23.83, 42.0],
  ],
  METOHIJA: [
    [20.05, 42.55], [20.15, 42.85], [20.45, 42.92], [20.62, 42.75], [20.58, 42.52], [20.52, 42.3],
    [20.3, 42.22], [20.05, 42.35],
  ],
  VOJVODINA: [
    [19.08, 44.87], [19.35, 44.93], [19.61, 44.96], [19.72, 44.78], [19.95, 44.72], [20.2, 44.67],
    [20.35, 44.76], [20.45, 44.83], [20.62, 44.78], [20.93, 44.69], [21.2, 44.74], [21.4, 44.78],
    [21.7, 44.75], [21.7, 46.3], [18.7, 46.3], [18.7, 44.87],
  ],
  OUTLANDS_A: [[22.6, 43.0], [22.62, 43.12], [22.75, 43.22], [23.05, 43.25], [23.05, 42.88], [22.75, 42.88]],
  OUTLANDS_B: [[22.28, 42.45], [22.35, 42.62], [22.6, 42.62], [22.7, 42.5], [22.7, 42.3], [22.4, 42.3]],
  KARS: [
    [41.5, 41.47], [41.8, 41.62], [43.0, 41.62], [44.9, 40.0], [44.6, 39.65], [44.3, 39.68],
    [43.7, 39.85], [43.3, 39.95], [43.05, 40.02], [42.75, 40.12], [42.45, 40.25], [42.2, 40.38],
    [41.95, 40.45], [41.75, 40.6], [41.65, 40.85], [41.55, 41.1], [41.55, 41.3],
  ],
};
// Want boxes (clipped to a modern country below).
const W = {
  DALMATIA: [
    [14.6, 44.95], [14.95, 44.88], [15.02, 44.62], [15.2, 44.44], [15.5, 44.3], [15.8, 44.24],
    [16.2, 44.26], [16.6, 44.0], [18.0, 43.0], [19.2, 42.0], [14.6, 42.0],
  ],
  VLORE: [[19.25, 40.62], [19.62, 40.62], [19.75, 40.42], [19.62, 40.22], [19.25, 40.22]],
  ADALIA: [
    [28.9, 36.3], [28.9, 37.2], [29.4, 37.55], [30.2, 37.85], [31.2, 37.85], [32.1, 37.55],
    [32.7, 37.05], [32.7, 36.0],
  ],
};

const densifyRing = (ring, step = 0.03) => {
  const out = [];
  for (let i = 0; i < ring.length; i++) {
    const p = ring[i];
    const q = ring[(i + 1) % ring.length];
    const n = Math.max(1, Math.ceil(Math.hypot(q[0] - p[0], q[1] - p[1]) / step));
    for (let s = 0; s < n; s++) out.push([p[0] + ((q[0] - p[0]) * s) / n, p[1] + ((q[1] - p[1]) * s) / n]);
  }
  out.push(out[0]);
  return out;
};
const inPoly = (poly, lon, lat) => {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};
const inH = (k, lon, lat) => inPoly(H[k], lon, lat);

// -- the 1914 polity field ---------------------------------------------------------
const SELF = new Set([
  "Netherlands", "Luxembourg", "Switzerland", "Liechtenstein", "Spain", "Portugal", "Norway",
  "Sweden", "Albania", "Libya", "Tunisia",
]);
const RULE = {
  France: (lon, lat) => (inH("AL", lon, lat) ? "Germany" : "France"),
  Monaco: () => "France",
  Andorra: () => null,
  Germany: () => "Germany",
  Belgium: (lon, lat) => (inH("EUPEN", lon, lat) ? "Germany" : "Belgium"),
  Denmark: (lon, lat) => (inH("NSCHLES", lon, lat) ? "Germany" : "Denmark"),
  Iceland: () => "Denmark",
  "Faeroe Is.": () => "Denmark",
  Greenland: () => "Denmark",
  "United Kingdom": () => "UK",
  Ireland: () => "UK",
  "Isle of Man": () => "UK",
  Jersey: () => "UK",
  Guernsey: () => "UK",
  Gibraltar: () => "UK",
  Malta: () => "UK",
  Cyprus: () => "UK",
  "N. Cyprus": () => "UK",
  "Cyprus U.N. Buffer Zone": () => "UK",
  Akrotiri: () => "UK",
  Dhekelia: () => "UK",
  Italy: (lon, lat) =>
    inH("ITEAST", lon, lat) || inH("CORTINA", lon, lat) || histAt(lon, lat) === "AustriaHungary"
      ? "AustriaHungary"
      : "Italy",
  "San Marino": () => "Italy",
  Vatican: () => "Italy",
  Austria: () => "AustriaHungary",
  Czechia: () => "AustriaHungary",
  Slovakia: () => "AustriaHungary",
  Hungary: () => "AustriaHungary",
  Slovenia: () => "AustriaHungary",
  Croatia: () => "AustriaHungary",
  "Bosnia and Herz.": () => "AustriaHungary",
  Poland: (lon, lat) => histAt(lon, lat) ?? "Russia",
  Lithuania: (lon, lat) => (histAt(lon, lat) === "Germany" ? "Germany" : "Russia"),
  Latvia: () => "Russia",
  Estonia: () => "Russia",
  Belarus: () => "Russia",
  Finland: () => "Russia",
  "Åland": () => "Russia",
  Moldova: () => "Russia",
  Russia: (lon, lat) => (lon < 23 && lat < 56 ? "Germany" : "Russia"),
  Ukraine: (lon, lat) => {
    const h = histAt(lon, lat);
    return h === "AustriaHungary" ? "AustriaHungary" : "Russia";
  },
  Romania: (lon, lat) => (histAt(lon, lat) === "AustriaHungary" ? "AustriaHungary" : "Romania"),
  Bulgaria: (lon, lat) => (inH("SDOBRUJA", lon, lat) ? "Romania" : "Bulgaria"),
  Serbia: (lon, lat) =>
    inH("VOJVODINA", lon, lat)
      ? "AustriaHungary"
      : inH("OUTLANDS_A", lon, lat) || inH("OUTLANDS_B", lon, lat)
        ? "Bulgaria"
        : "Serbia",
  Kosovo: (lon, lat) => (inH("METOHIJA", lon, lat) ? "Montenegro" : "Serbia"),
  Montenegro: (lon, lat) => (inH("BOKA", lon, lat) ? "AustriaHungary" : "Montenegro"),
  Macedonia: (lon, lat) => (inH("STRUMICA", lon, lat) ? "Bulgaria" : "Serbia"),
  Greece: (lon, lat) => (inH("WTHRACE", lon, lat) ? "Bulgaria" : "Greece"),
  Turkey: (lon, lat) => (inH("KARS", lon, lat) ? "Russia" : "Ottoman"),
  Georgia: () => "Russia",
  Armenia: () => "Russia",
  Azerbaijan: () => "Russia",
  Kazakhstan: () => "Russia",
  Turkmenistan: () => "Russia",
  Uzbekistan: () => "Russia",
  Syria: () => "Ottoman",
  Lebanon: () => "Ottoman",
  Israel: () => "Ottoman",
  Palestine: () => "Ottoman",
  Jordan: () => "Ottoman",
  Iraq: () => "Ottoman",
  Iran: () => "Persia",
  Egypt: () => "Egypt",
  Sudan: () => "Anglo-Egyptian Sudan",
  "S. Sudan": () => "Anglo-Egyptian Sudan",
  Algeria: () => "FrenchAfrica",
  "W. Sahara": () => "SpanishSahara",
  Madagascar: () => "Madagascar",
};
const polityAt = (lon, lat) => {
  const m = modernAt(lon, lat);
  if (!m) return null;
  if (SELF.has(m)) return m;
  const r = RULE[m];
  if (r) return r(lon, lat);
  return histAt(lon, lat);
};

const AFRICA = new Set([
  "FrenchAfrica", "SpanishSahara", "Morocco", "Spanish Morocco", "Tunisia", "Libya", "Egypt",
  "Anglo-Egyptian Sudan", "Abyssinia", "Eritrea", "Djibouti", "British Somaliland",
  "Italian Somaliland", "British East Africa", "Uganda", "GermanEastAfrica", "Belgian Congo",
  "Angola", "Mozambique", "Malawi", "Rhodesia", "Botswana", "GermanSouthWestAfrica",
  "South Africa", "Lesotho", "Swaziland", "Kamerun", "Togo", "Nigeria", "Gold Coast", "Liberia",
  "Sierra Leone", "Portuguese Guinea", "Gambia, The", "Equatorial Guinea", "Madagascar",
]);

// -- border candidates, side-tested against the field ------------------------------
const OFF = 0.04; // ~4.4 km either side
const KM = (dLon, dLat, lat) => Math.hypot(dLon * Math.cos((lat * Math.PI) / 180), dLat) * 111.2;
const sides = (p, q) => {
  const mlon = (p[0] + q[0]) / 2;
  const mlat = (p[1] + q[1]) / 2;
  const cl = Math.cos((mlat * Math.PI) / 180);
  let tx = (q[0] - p[0]) * cl;
  let ty = q[1] - p[1];
  const tl = Math.hypot(tx, ty) || 1;
  tx /= tl;
  ty /= tl;
  const nx = -ty;
  const ny = tx;
  const a = [mlon + (nx * OFF) / cl, mlat + ny * OFF];
  const b = [mlon - (nx * OFF) / cl, mlat - ny * OFF];
  return { m: [mlon, mlat], a, b };
};
const densifyLine = (line, step = 0.03) => {
  const out = [line[0]];
  for (let i = 1; i < line.length; i++) {
    const p = line[i - 1];
    const q = line[i];
    const n = Math.max(1, Math.ceil(Math.hypot(q[0] - p[0], q[1] - p[1]) / step));
    for (let s = 1; s <= n; s++) out.push([p[0] + ((q[0] - p[0]) * s) / n, p[1] + ((q[1] - p[1]) * s) / n]);
  }
  return out;
};

const lineInView = (line) => line.some(([lon, lat]) => lon >= VIEW.lon[0] && lon <= VIEW.lon[1] && lat >= VIEW.lat[0] && lat <= VIEW.lat[1]);
const candidates = []; // { pts, prio, src }
// 2: modern 10m borders
const modernMesh = mesh(cTopo, cTopo.objects.countries, (a, b) => a !== b);
for (const line0 of modernMesh.coordinates)
  for (const line of splitAtJumps(line0)) if (lineInView(line)) candidates.push({ pts: densifyLine(line), prio: 2, src: "modern" });
// 1: the dataset's polygon edges
for (const f of hist.features) {
  if (!f.properties.NAME) continue;
  const g = inView(f.geometry);
  if (!g) continue;
  for (const rings of g.coordinates)
    for (const ring of rings) for (const line of splitAtJumps(ring)) candidates.push({ pts: densifyLine(line), prio: 1, src: "hist" });
}
// 3: the hand polygons' edges
for (const k of Object.keys(H)) candidates.push({ pts: densifyRing(H[k]), prio: 3, src: `hand:${k}` });

const BOSNIA_EAST = new Set(["Serbia", "Montenegro"]);
const kept = []; // accepted segments
const grid = new Map();
const gkey = (lon, lat) => `${Math.floor(lon / 0.1)},${Math.floor(lat / 0.1)}`;
const near = (m, radKm, pred) => {
  const i0 = Math.floor(m[0] / 0.1);
  const j0 = Math.floor(m[1] / 0.1);
  for (let di = -2; di <= 2; di++)
    for (let dj = -2; dj <= 2; dj++) {
      const a = grid.get(`${i0 + di},${j0 + dj}`);
      if (!a) continue;
      for (const s of a) if (pred(s) && KM(s.m[0] - m[0], s.m[1] - m[1], m[1]) < radKm) return true;
    }
  return false;
};
const runs = [];
candidates.forEach((c, i) => (c.cid = i));
for (const prio of [3, 2, 1]) {
  for (const cand of candidates.filter((c) => c.prio === prio)) {
    let run = null;
    for (let i = 1; i < cand.pts.length; i++) {
      const p = cand.pts[i - 1];
      const q = cand.pts[i];
      const { m, a, b } = sides(p, q);
      const A = polityAt(...a);
      const B = polityAt(...b);
      let ok = A && B && A !== B;
      if (ok) {
        // de-duplicate: a higher-priority line nearby wins; same priority within 3 km is a copy
        const hi = prio === 1 ? 10 : 3;
        if (near(m, hi, (s) => s.prio > prio) || near(m, 2.5, (s) => s.prio === prio && s.cid !== cand.cid)) ok = false;
      }
      if (!ok) {
        run = null;
        continue;
      }
      let special = null;
      if (cand.src === "modern") {
        const ma = modernAt(...a);
        const mb = modernAt(...b);
        if ((ma === "Bosnia and Herz." && BOSNIA_EAST.has(mb)) || (mb === "Bosnia and Herz." && BOSNIA_EAST.has(ma))) special = "bosniaEast";
      }
      const colonial = AFRICA.has(A) || AFRICA.has(B);
      const seg = { m, prio, A, B, cid: cand.cid };
      const k = gkey(...m);
      if (!grid.has(k)) grid.set(k, []);
      grid.get(k).push(seg);
      const kind = special ?? (colonial ? "colonial" : "europe");
      if (!run || run.kind !== kind) {
        run = { kind, prio, pts: [p] };
        runs.push(run);
      }
      run.pts.push(q);
    }
  }
}

// Chaikin, twice, for the coarse sources (endpoints stay put).
const chaikin = (pts, it = 2) => {
  let a = pts;
  for (let k = 0; k < it; k++) {
    if (a.length < 3) return a;
    const out = [a[0]];
    for (let i = 0; i < a.length - 1; i++) {
      const [x0, y0] = a[i];
      const [x1, y1] = a[i + 1];
      out.push([0.75 * x0 + 0.25 * x1, 0.75 * y0 + 0.25 * y1], [0.25 * x0 + 0.75 * x1, 0.25 * y0 + 0.75 * y1]);
    }
    out.push(a[a.length - 1]);
    a = out;
  }
  return a;
};
// Snap the loose ends of dataset runs onto the nearest other run within 12 km, so
// a coarse line meets the crisp one it runs into instead of stopping short.
const allPts = [];
runs.forEach((r, ri) => r.pts.forEach((p) => allPts.push({ p, ri })));
const snapEnd = (r, ri, end) => {
  const e = end ? r.pts[r.pts.length - 1] : r.pts[0];
  let best = null;
  let bd = 12;
  for (const { p, ri: rj } of allPts) {
    if (rj === ri) continue;
    const d = KM(p[0] - e[0], p[1] - e[1], e[1]);
    if (d > 0.3 && d < bd) {
      bd = d;
      best = p;
    }
  }
  if (best) {
    if (end) r.pts.push(best);
    else r.pts.unshift(best);
  }
};
runs.forEach((r, ri) => {
  if (r.prio !== 1) return;
  snapEnd(r, ri, false);
  snapEnd(r, ri, true);
});
const runLenKm = (pts) => {
  let s = 0;
  for (let i = 1; i < pts.length; i++) s += KM(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][1]);
  return s;
};
const finalRuns = runs
  .filter((r) => runLenKm(r.pts) > 4)
  .map((r) => ({ ...r, pts: r.prio === 2 ? r.pts : chaikin(r.pts) }));
const BORDERS_D = lineD(finalRuns.filter((r) => r.kind === "europe").map((r) => r.pts));
const COLONIAL_D = lineD(finalRuns.filter((r) => r.kind === "colonial").map((r) => r.pts));
const BOSNIA_EAST_D = lineD(finalRuns.filter((r) => r.kind === "bosniaEast").map((r) => r.pts));

// Modern lines by pair (for the Sava line and the pre-1871 French border).
const pairLines = (p, q) => {
  const out = [];
  const m = mesh(
    cTopo,
    cTopo.objects.countries,
    (a, b) => (a.properties.name === p && b.properties.name === q) || (a.properties.name === q && b.properties.name === p),
  );
  for (const line of m.coordinates) out.push(line);
  return out;
};
const SAVA_D = lineD(pairLines("Bosnia and Herz.", "Croatia"));
// The pre-1871 French border == today's France-Germany line (Rhine, Lauter, Saar):
// ordered from Basel north then west to the Luxembourg tripoint, as one polyline.
const fg = pairLines("France", "Germany");
const joinChains = (chains) => {
  let out = chains[0].slice();
  const rest = chains.slice(1);
  while (rest.length) {
    const end = out[out.length - 1];
    let bi = 0;
    let bd = Infinity;
    let rev = false;
    rest.forEach((c, i) => {
      const d0 = Math.hypot(c[0][0] - end[0], c[0][1] - end[1]);
      const d1 = Math.hypot(c[c.length - 1][0] - end[0], c[c.length - 1][1] - end[1]);
      if (d0 < bd) [bd, bi, rev] = [d0, i, false];
      if (d1 < bd) [bd, bi, rev] = [d1, i, true];
    });
    const c = rest.splice(bi, 1)[0];
    out = out.concat(rev ? c.slice().reverse() : c);
  }
  return out;
};
let fgLine = joinChains(fg);
if (fgLine[0][1] > fgLine[fgLine.length - 1][1]) fgLine = fgLine.reverse();
const FRANCE_1870_PTS = fgLine.map((ll) => {
  const [x, y] = projection(ll);
  return [r2(x), r2(y)];
});

// -- the wants: polygons in lon/lat, clipped with polygon-clipping ------------------
const box = (ring) => [[densifyRing(ring, 0.05)]];
const hist1914 = (name) => {
  const f = hist.features.find((x) => x.properties.NAME === name);
  return polysOf(inView(f.geometry));
};
const U = (...gs) => polygonClipping.union(...gs);
const I = (a, b) => polygonClipping.intersection(a, b);
const D = (a, ...b) => polygonClipping.difference(a, ...b);
const C = countryGeom;

const WANTS = {
  alsaceLorraine: I(C("France"), box(H.AL)),
  dalmatia: U(I(C("Croatia"), box(W.DALMATIA)), I(C("Montenegro"), box(H.BOKA))),
  vlore: I(C("Albania"), box(W.VLORE)),
  adalia: I(C("Turkey"), box(W.ADALIA)),
  balkans: D(
    U(C("Serbia"), C("Kosovo"), C("Macedonia"), C("Montenegro"), C("Bulgaria"), I(C("Greece"), box(H.WTHRACE))),
    box(H.VOJVODINA),
    box(H.BOKA),
    box(H.SDOBRUJA),
  ),
  bosnia: C("Bosnia and Herz."),
  // the dataset parts cut to real land (its coast is coarse), so no clip is needed at render time
  togo: U(I(hist1914("Togoland"), U(C("Ghana"), C("Togo"), C("Benin"), C("Burkina Faso"))), C("Togo")),
  kamerun: U(
    I(hist1914("Kamerun"), U(C("Cameroon"), C("Nigeria"), C("Chad"), C("Central African Rep."), C("Congo"), C("Gabon"), C("Eq. Guinea"))),
    C("Cameroon"),
  ),
  swAfrica: C("Namibia"),
  eastAfrica: U(C("Tanzania"), C("Rwanda"), C("Burundi")),
  congo: C("Dem. Rep. Congo"),
  angola: C("Angola"),
};
// Douglas-Peucker in world px, to what each want's closest framing needs
// (~0.5 screen px at its largest k): Alsace-Lorraine is seen at k 5.4, the
// Adriatic/Balkan wants at <= 2.9, the colonies at <= 0.9.
const TOL = { alsaceLorraine: 0.09, dalmatia: 0.17, vlore: 0.17, adalia: 0.17, balkans: 0.17, bosnia: 0.17 };
const tolOf = (k) => TOL[k] ?? 0.55;
const dp = (pts, tol) => {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const [ax, ay] = pts[a];
    const [bx, by] = pts[b];
    const L = Math.hypot(bx - ax, by - ay) || 1e-9;
    let md = -1;
    let mi = -1;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs((bx - ax) * (ay - pts[i][1]) - (ax - pts[i][0]) * (by - ay)) / L;
      if (d > md) [md, mi] = [d, i];
    }
    if (md > tol) {
      keep[mi] = 1;
      stack.push([a, mi], [mi, b]);
    }
  }
  return pts.filter((_, i) => keep[i]);
};
const fmt = (pts) => pts.map(([x, y], i) => `${i ? "L" : "M"}${n2(x)},${n2(y)}`).join("");
// A closed run (first point == last) is split at its far point first, or DP
// would measure everything against a zero-length chord.
const dpAny = (pts, tol) => {
  const [x0, y0] = pts[0];
  const [x1, y1] = pts[pts.length - 1];
  if (Math.hypot(x1 - x0, y1 - y0) > 1e-6) return dp(pts, tol);
  let far = 0;
  let fd = -1;
  pts.forEach(([x, y], i) => {
    const dd = Math.hypot(x - x0, y - y0);
    if (dd > fd) [fd, far] = [dd, i];
  });
  return dp(pts.slice(0, far + 1), tol).concat(dp(pts.slice(far), tol).slice(1));
};
const polyDS = (multi, tol) => {
  let d = "";
  for (const poly of multi)
    for (const ring of poly) {
      const out = dpAny(ring.map((ll) => projection(ll)), tol);
      if (out.length >= 4) d += `${fmt(out)}Z`;
    }
  return d;
};
const lineDS = (chains, tol) => chains.map((c) => fmt(dpAny(c.map((ll) => projection(ll)), tol))).join("");
const WANT_D = Object.fromEntries(Object.entries(WANTS).map(([k, v]) => [k, polyDS(v, tolOf(k))]));
// Each want's edge, over land only (the coast is already drawn).
const landAt = (lon, lat) => modernAt(lon, lat) !== null;
const edgeD = (multi) => {
  const chains = [];
  for (const poly of multi)
    for (const ring of poly) {
      const pts = densifyLine(ring, 0.03);
      let run = null;
      for (let i = 1; i < pts.length; i++) {
        const { a, b } = sides(pts[i - 1], pts[i]);
        if (landAt(...a) && landAt(...b)) {
          if (!run) chains.push((run = [pts[i - 1]]));
          run.push(pts[i]);
        } else run = null;
      }
    }
  return chains.filter((c) => runLenKm(c) > 3);
};
const WANT_EDGE_D = Object.fromEntries(Object.entries(WANTS).map(([k, v]) => [k, lineDS(edgeD(v), tolOf(k))]));
const WANT_BOX = Object.fromEntries(
  Object.entries(WANTS).map(([k, v]) => {
    let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
    for (const poly of v)
      for (const [lon, lat] of poly[0]) {
        const [x, y] = projection([lon, lat]);
        x0 = Math.min(x0, x);
        y0 = Math.min(y0, y);
        x1 = Math.max(x1, x);
        y1 = Math.max(y1, y);
      }
    return [k, { x0: r2(x0), y0: r2(y0), x1: r2(x1), y1: r2(y1) }];
  }),
);

// -- graticule ------------------------------------------------------------------------
const GRATICULE_D = bake(
  geoGraticule()
    .extent([
      [-100, -65],
      [125, 85.01],
    ])
    .step([5, 5])
    .precision(0.5)(),
);

// -- places ------------------------------------------------------------------------------
const CITIES = {
  london: P([-0.13, 51.51]),
  paris: P([2.35, 48.86]),
  berlin: P([13.4, 52.52]),
  vienna: P([16.37, 48.21]),
  rome: P([12.5, 41.9]),
  stPetersburg: P([30.32, 59.94]),
  constantinople: P([28.98, 41.01]),
};
const PLACES = {
  // region labels
  britain: P([-1.6, 52.7]),
  france: P([3.2, 47.4]),
  germany: P([8.6, 50.4]),
  austriaHungary: P([19.6, 47.4]),
  russia: P([31.0, 52.0]),
  italy: P([12.9, 42.6]),
  ottoman: P([29.3, 39.0]),
  // seas
  northSea: P([3.2, 56.2]),
  mediterranean: P([18.6, 34.6]),
  // "eastern Mediterranean" (Italy's act): south-east of Crete, clear of the Adalia hatch
  easternMed: P([28.6, 34.5]),
  adriatic: P([16.7, 42.25]),
  blackSea: P([34.3, 43.35]),
  // wants
  alsaceLorraine: P([7.05, 49.72]),
  label1871: P([6.3, 48.33]),
  dalmatia: P([15.6, 43.55]),
  adalia: P([31.0, 35.95]),
  balkans: P([23.8, 42.95]),
  bosnia: P([18.1, 44.6]),
  togo: P([0.9, 11.4]),
  kamerun: P([13.2, 6.0]),
  swAfrica: P([17.6, -21.5]),
  eastAfrica: P([34.8, -6.5]),
  congo: P([22.8, -2.6]),
  angola: P([17.6, -12.4]),
  // fronts and arrows
  ancona: P([13.52, 43.62]),
  odessa: P([30.73, 46.48]),
  alTarget: P([7.25, 48.72]),
  dalmatiaTarget: P([16.25, 43.75]),
  adaliaTarget: P([30.6, 37.1]),
  balkansTarget: P([21.8, 43.5]),
  eastAfricaTarget: P([34.4, -5.6]),
  // camera shots (content centres)
  shotEurope: P([18.5, 51.2]),
  shotBritain: P([1.2, 52.0]),
  shotAlsace: P([5.9, 48.6]),
  shotItalyA: P([15.6, 42.5]),
  shotItalyB: P([25.5, 38.6]),
  shotBalkans: P([24.2, 44.6]),
  shotAfrica: P([19.0, -9.0]),
  // the payoff: the Europe wide again (k 1.25), Balkans near y 835, Kamerun off the bottom
  shotWide: P([18.5, 43.5]),
  // Berlin's desire-arrow bows west over the Alps, down the Tyrrhenian between
  // Sardinia and Italy, over Tunisia and Libya and off the bottom edge toward
  // the colonies: it touches no other want and never crosses Rome's arrow
  berlinVia1: P([10.6, 48.9]),
  berlinVia2: P([10.5, 45.6]),
  berlinVia3: P([11.1, 41.0]),
  berlinVia4: P([11.0, 34.0]),
  berlinVia5: P([12.5, 22.0]),
  berlinVia6: P([20.0, 6.0]),
  // the four claimants' names at the payoff wide, clear of dots, hatches and heads
  wFrance: P([4.48, 45.63]),
  wGermany: P([9.6, 54.4]),
  wItaly: P([15.21, 40.02]),
  wRussia: P([34.95, 53.13]),
};
// ITALY is set along the peninsula.
const lineOf = (pts) => {
  const d = pts.map((ll) => projection(ll));
  return `M${d.map(([x, y]) => `${r2(x)},${r2(y)}`).join("L")}`;
};
const ITALY_ARC_D = lineOf([
  [10.9, 44.15],
  [12.4, 43.05],
  [14.2, 41.75],
  [16.1, 40.5],
]);

// -- checks ------------------------------------------------------------------------------
const kmPx = (() => {
  const p = projection([10, 48]);
  const q = projection([10, 49]);
  return Math.hypot(q[0] - p[0], q[1] - p[1]) / 111.2;
})();
console.log(`scale ${SCALE.toFixed(2)}  px/km at 48N ${kmPx.toFixed(4)}`);
const probe = {
  Metz: [6.18, 49.12], Strasbourg: [7.75, 48.58], Nancy: [6.18, 48.69], Belfort: [6.86, 47.64],
  Eupen: [6.03, 50.63], Aabenraa: [9.42, 55.04], Ribe: [8.77, 55.33], Trieste: [13.77, 45.65],
  Gorizia: [13.62, 45.94], Trento: [11.12, 46.07], Cortina: [12.14, 46.54], Udine: [13.23, 46.06],
  Kotor: [18.77, 42.42], Bar: [19.1, 42.1], Sarajevo: [18.41, 43.86], Split: [16.44, 43.51],
  Lviv: [24.03, 49.84], Krakow: [19.94, 50.06], Warsaw: [21.0, 52.23], Poznan: [16.93, 52.41],
  Chernivtsi: [25.94, 48.29], Chisinau: [28.85, 47.0], Izmail: [28.84, 45.35], Khotyn: [26.5, 48.5],
  Cluj: [23.6, 46.77], Bucharest: [26.1, 44.43], Dobrich: [27.83, 43.57], Edirne: [26.56, 41.68],
  Istanbul: [28.9, 41.05], Xanthi: [24.88, 41.13], Kavala: [24.4, 40.94], Strumica: [22.64, 41.44],
  Skopje: [21.43, 42.0], Pec: [20.29, 42.66], Novi_Sad: [19.84, 45.25], Belgrade: [20.46, 44.8],
  Dimitrovgrad: [22.78, 43.02], Tirana: [19.82, 41.33], Kars: [43.1, 40.6], Batumi: [41.64, 41.64],
  Helsinki: [24.94, 60.17], Riga: [24.1, 56.95], Klaipeda: [21.13, 55.71], Kaliningrad: [20.5, 54.7],
  Dublin: [-6.26, 53.35], Tangier: [-5.8, 35.77], Tripoli: [13.19, 32.88], Cairo: [31.23, 30.04],
  Lome: [1.22, 6.13], Douala: [9.7, 4.05], Windhoek: [17.08, -22.56], Dar: [39.2, -6.8],
  Kigali: [30.06, -1.95], Kinshasa: [15.3, -4.33], Luanda: [13.23, -8.84],
};
console.log(Object.entries(probe).map(([k, v]) => `${k}:${polityAt(...v)}`).join("  "));
for (const [k, v] of Object.entries(WANT_D)) console.log(`want ${k}: ${v.length} chars, edge ${WANT_EDGE_D[k].length}`);

const HEAD = `// Generated by scripts/build-ww1-map.mjs — do not edit by hand.
// Natural Earth (public domain, 10m) + 1914 polities (aourednik/historical-basemaps,
// hand-corrected; see the script header) on a north-up Lambert azimuthal equal-area
// centred 15 E, 25 N, scale ${SCALE.toFixed(2)}. World px == screen px at the Europe
// wide (camera k 1). ${kmPx.toFixed(4)} world px per km at 48 N.
`;
// The heavy static geometry: read only by scripts/bake-ww1-rasters.mjs, which
// turns it into the raster LOD pyramid. The component never imports it.
const staticBody = `${HEAD}
/** All land, one path (evenodd). */
export const LAND_D = ${JSON.stringify(LAND_D)};
/** 1914 borders in Europe and the Near East. */
export const BORDERS_D = ${JSON.stringify(BORDERS_D)};
/** 1914 colonial borders in Africa. */
export const COLONIAL_D = ${JSON.stringify(COLONIAL_D)};
/** 5 degree graticule. */
export const GRATICULE_D = ${JSON.stringify(GRATICULE_D)};
`;
// The light overlay geometry the component draws as vectors.
const overlayBody = `${HEAD}
export type Pt = { x: number; y: number };
export type Box = { x0: number; y0: number; x1: number; y1: number };

export const PX_PER_KM = ${kmPx.toFixed(5)};

/** Austria-Hungary's border round Bosnia (with Serbia and Montenegro); not in BORDERS_D. */
export const BOSNIA_EAST_D = ${JSON.stringify(BOSNIA_EAST_D)};
/** Bosnia's line with Croatia-Slavonia and Dalmatia (the Sava, the Una, the Dinaric crest). */
export const SAVA_D = ${JSON.stringify(SAVA_D)};
/** The pre-1871 French border (Rhine, Lauter, the Saar line), Basel -> Luxembourg. */
export const FRANCE_1870_PTS: [number, number][] = ${JSON.stringify(FRANCE_1870_PTS)};

export type WantKey = ${Object.keys(WANTS).map((k) => JSON.stringify(k)).join(" | ")};
/** Wanted territory, land only (evenodd), simplified to its closest framing. */
export const WANT_D: Record<WantKey, string> = ${JSON.stringify(WANT_D)};
/** Each want's edge over land only. */
export const WANT_EDGE_D: Record<WantKey, string> = ${JSON.stringify(WANT_EDGE_D)};
export const WANT_BOX: Record<WantKey, Box> = ${JSON.stringify(WANT_BOX)};

export const CITIES: Record<${Object.keys(CITIES).map((k) => JSON.stringify(k)).join(" | ")}, Pt> = ${JSON.stringify(CITIES)};
export const PLACES: Record<${Object.keys(PLACES).map((k) => JSON.stringify(k)).join(" | ")}, Pt> = ${JSON.stringify(PLACES)};
export const ITALY_ARC_D = ${JSON.stringify(ITALY_ARC_D)};
`;
writeFileSync(OUT, staticBody);
writeFileSync(OUT_OVERLAY, overlayBody);
console.log(`Wrote ${OUT} (${staticBody.length}) and ${OUT_OVERLAY} (${overlayBody.length})`);

// -- textures (the Manchuria generator, reseeded) -----------------------------------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
};
const writePng = (file, w, h, rgba) => {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
  writeFileSync(file, png);
};
let seed = 1914;
const rand = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};
const boxBlur = (src, w, h, r) => {
  const tmp = new Float32Array(w * h);
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    let acc = 0;
    for (let x = -r; x <= r; x++) acc += src[y * w + ((x + w) % w)];
    for (let x = 0; x < w; x++) {
      tmp[y * w + x] = acc / (2 * r + 1);
      acc += src[y * w + ((x + r + 1) % w)] - src[y * w + ((x - r + w) % w)];
    }
  }
  for (let x = 0; x < w; x++) {
    let acc = 0;
    for (let y = -r; y <= r; y++) acc += tmp[((y + h) % h) * w + x];
    for (let y = 0; y < h; y++) {
      out[y * w + x] = acc / (2 * r + 1);
      acc += tmp[((y + r + 1) % h) * w + x] - tmp[((y - r + h) % h) * w + x];
    }
  }
  return out;
};
const normalise = (a) => {
  let m = 0;
  let s = 0;
  for (const v of a) m += v;
  m /= a.length;
  for (const v of a) s += (v - m) * (v - m);
  s = Math.sqrt(s / a.length) || 1;
  for (let i = 0; i < a.length; i++) a[i] = (a[i] - m) / s;
  return a;
};
mkdirSync(TEX_DIR, { recursive: true });
{
  const w = 1080;
  const h = 1920;
  const fine = new Float32Array(w * h);
  for (let i = 0; i < fine.length; i++) fine[i] = rand() - 0.5;
  const coarse = normalise(boxBlur(fine.map(() => rand() - 0.5), w, h, 2));
  normalise(fine);
  const rgba = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const v = fine[i] * 0.6 + coarse[i] * 0.55;
    const light = v > 0;
    rgba[i * 4] = light ? 0xf2 : 0x0c;
    rgba[i * 4 + 1] = light ? 0xe6 : 0x09;
    rgba[i * 4 + 2] = light ? 0xc8 : 0x06;
    rgba[i * 4 + 3] = Math.round(Math.min(1, Math.abs(v) * 0.05) * 255);
  }
  writePng(`${TEX_DIR}/grain.png`, w, h, rgba);
}
{
  const w = 512;
  const h = 512;
  let acc = new Float32Array(w * h);
  for (const [r, amp] of [
    [40, 1.0],
    [18, 0.55],
    [7, 0.3],
  ]) {
    const n = new Float32Array(w * h);
    for (let i = 0; i < n.length; i++) n[i] = rand() - 0.5;
    const bl = normalise(boxBlur(boxBlur(n, w, h, r), w, h, r));
    for (let i = 0; i < acc.length; i++) acc[i] += bl[i] * amp;
  }
  acc = normalise(acc);
  const rgba = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    rgba[i * 4] = 0x0a;
    rgba[i * 4 + 1] = 0x07;
    rgba[i * 4 + 2] = 0x04;
    rgba[i * 4 + 3] = Math.round(Math.min(1, Math.max(0, acc[i]) * 0.16) * 255);
  }
  writePng(`${TEX_DIR}/mottle.png`, w, h, rgba);
}
console.log(`Wrote ${TEX_DIR}/grain.png and ${TEX_DIR}/mottle.png`);
