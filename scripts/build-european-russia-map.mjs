// Bakes the geometry for RailwaysInEuropeanRussia (Sarah Paine: the money spent
// on the Russo-Japanese War is money not spent "expanding its railway system in
// European Russia. That would have been really helpful fighting World War I").
//
//   bun scripts/build-european-russia-map.mjs [path/to/world_1914.geojson]
//
// Writes
//   generated/components/erStatic.ts    the heavy STATIC layers (land, lakes, 1914
//                                       borders, graticule, the idle railway),
//                                       read only by scripts/bake-european-russia-rasters.mjs
//   generated/components/erMapData.ts   the light OVERLAYS drawn as vectors: the
//                                       railway graph (orange-able edges, Moscow
//                                       distances), the coins' route, the front,
//                                       the feeders to it, the army's band slots,
//                                       label arcs
//
// THE PROJECTION is north-up Lambert conformal conic, parallels 47 / 57, centre
// meridian 38 E. The fit is solved from the railway web that turns orange (every
// line in the ORANGE set below): its bounding box is scaled to H_WEB px tall,
// centred on x 540 with its bottom on y 1135, so at the European Russia wide
// (camera k 1) world px == screen px and nothing of the web sits in the caption
// band. Every other framing is a zoom into this.
//
// 1914 BORDERS, NOT MODERN ONES. The polity at any point is the field built in
// scripts/build-ww1-map.mjs (copied here, same sources and the same hand
// corrections): modern Natural Earth 10m countries where a modern state lay inside
// one 1914 polity, the aourednik/historical-basemaps world_1914 dataset for the
// partitions of Poland, Galicia, Transylvania and Memel, and hand polygons where
// the dataset is wrong. So: the Russian Empire incl. Finland, the Baltic
// provinces, Congress Poland and all of Bessarabia; Germany incl. East Prussia,
// Memel, Posen and Silesia; Austria-Hungary incl. Galicia and Bukovina; Romania
// incl. South Dobruja; the Ottoman Empire. A line is drawn wherever the polity
// changes. THE FRONT is the Russia-Germany + Russia-Austria-Hungary part of it,
// joined into one polyline from the Baltic (Nimmersatt) south to the Russia /
// Austria-Hungary / Romania tripoint on the Prut.
//
// THE RAILWAY, 1914 trunk skeleton (not every branch). Station coordinates are
// town / station coordinates from Wikipedia and GeoNames (~0.01-0.05 deg); a line
// is drawn as a centripetal Catmull-Rom through its stations. Routings are the
// pre-1914 ones: the Nikolaev line; the Petersburg-Warsaw line via Pskov,
// Dvinsk, Vilna, Grodno and Bialystok with the Landvarovo-Kovno-Verzhbolovo
// branch to Eydtkuhnen; the Moscow-Brest line and the Warsaw-Terespol line; the
// Moscow-Kursk and Kursk-Kharkov-Azov lines; the Moscow-Kiev-Voronezh line via
// Kaluga, Bryansk, Konotop; the Kursk-Kiev line; the South-Western lines
// (Kiev-Kazatin-Zhmerinka-Birzula-Odessa, Kazatin-Berdichev-Shepetovka-
// Zdolbunov-Rovno-Kovel-Brest, Zdolbunov-Radziwillow to Brody, Zhmerinka-
// Proskurov-Volochysk to Podwoloczyska); Kiev-Korosten-Sarny-Kovel (1902); the
// Vistula railway (Mlawa-Warsaw-Ivangorod-Lublin-Chelm-Kovel); the
// Warsaw-Vienna line to Granica; Warsaw-Kutno-Aleksandrow to Thorn;
// Brest-Bialystok-Grajewo to Prostken; Riga-Dvinsk-Vitebsk-Smolensk-Bryansk-
// Oryol; Libau-Romny (Libau-Shavli-Koshedary, Vilna-Molodechno-Minsk-Bobruisk-
// Gomel-Bakhmach); Oryol-Yelets-Gryazi and Gryazi-Voronezh-Rostov; Kharkov-
// Lozovaya-Yekaterinoslav. Idle only (never bought in this cut): Moscow-Yaroslavl-
// Vologda-Arkhangelsk, Petersburg-Vologda, Danilov-Bui-Vyatka-Perm, Moscow-
// Nizhny, Ryazhsk-Kozlov-Gryazi, and the coins' route Moscow-Ryazan-Ryazhsk-
// Penza-Syzran-Samara-Ufa-Zlatoust-Chelyabinsk (the Samara-Zlatoust line, the
// Trans-Siberian's start).
//
// LAKES: Natural Earth land has no holes for Ladoga, Onega, Peipus ...; they come
// from Natural Earth 10m lakes via scripts/european-russia-lakes.json (reservoirs
// excluded: they are Soviet), and the pre-1960 Aral from scripts/transsib-lakes.json.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { geoArea, geoConicConformal, geoGraticule, geoPath } from "d3-geo";
import { feature, mesh } from "topojson-client";

const OUT_STATIC = "generated/components/erStatic.ts";
const OUT = "generated/components/erMapData.ts";
const SRC_URL =
  "https://raw.githubusercontent.com/aourednik/historical-basemaps/master/geojson/world_1914.geojson";

// ---------------------------------------------------------------------------
// STATIONS (lon, lat). Wikipedia / GeoNames town and station coordinates.
// ---------------------------------------------------------------------------
const ST = {
  Moscow: [37.62, 55.75],
  // Nikolaev line
  "St Petersburg": [30.32, 59.93],
  Chudovo: [31.67, 59.12],
  "Malaya Vishera": [32.23, 58.85],
  Okulovka: [33.3, 58.39],
  Bologoye: [34.05, 57.88],
  "Vyshny Volochyok": [34.56, 57.59],
  Tver: [35.91, 56.86],
  Klin: [36.73, 56.33],
  // Petersburg - Warsaw
  Gatchina: [30.13, 59.57],
  Luga: [29.85, 58.74],
  Pskov: [28.33, 57.82],
  Ostrov: [28.35, 57.35],
  Rezhitsa: [27.33, 56.51],
  Dvinsk: [26.53, 55.87],
  Sventsiany: [25.99, 55.16],
  Vilna: [25.28, 54.69],
  Landvarovo: [25.05, 54.64],
  Orany: [24.57, 54.22],
  Grodno: [23.83, 53.68],
  Bialystok: [23.16, 53.13],
  Lapy: [22.88, 52.99],
  Malkinia: [22.03, 52.7],
  Warsaw: [21.01, 52.23],
  // Landvarovo - Verzhbolovo (to Eydtkuhnen)
  Koshedary: [24.45, 54.86],
  Kovno: [23.9, 54.9],
  "Kazlu Ruda": [23.49, 54.75],
  Verzhbolovo: [22.76, 54.64],
  // Moscow - Brest - Warsaw
  Mozhaisk: [36.03, 55.5],
  Gzhatsk: [35.0, 55.55],
  Vyazma: [34.3, 55.21],
  Smolensk: [32.05, 54.78],
  Orsha: [30.42, 54.51],
  Borisov: [28.5, 54.23],
  Minsk: [27.56, 53.9],
  Stolbtsy: [26.73, 53.48],
  Baranovichi: [26.01, 53.13],
  Brest: [23.69, 52.1],
  "Biala Podlaska": [23.13, 52.03],
  Miedzyrzec: [22.78, 51.99],
  Lukow: [22.38, 51.93],
  Siedlce: [22.29, 52.17],
  "Minsk Mazowiecki": [21.56, 52.18],
  // Moscow - Kursk - Kharkov - Rostov
  Serpukhov: [37.41, 54.92],
  Tula: [37.62, 54.19],
  Mtsensk: [36.57, 53.28],
  Oryol: [36.08, 52.97],
  Kursk: [36.19, 51.73],
  Belgorod: [36.59, 50.6],
  Kharkov: [36.23, 49.99],
  Lozovaya: [36.32, 48.89],
  Slavyansk: [37.61, 48.85],
  Nikitovka: [37.99, 48.35],
  Ilovaisk: [38.2, 47.92],
  Taganrog: [38.9, 47.22],
  Rostov: [39.71, 47.23],
  // Lozovaya - Yekaterinoslav
  Pavlograd: [35.87, 48.53],
  Sinelnikovo: [35.52, 48.32],
  Yekaterinoslav: [35.05, 48.46],
  // Moscow - Kiev
  Maloyaroslavets: [36.47, 55.01],
  Kaluga: [36.27, 54.53],
  Sukhinichi: [35.33, 54.1],
  Bryansk: [34.37, 53.25],
  "Mikhailovsky Khutor": [34.08, 52.32],
  Konotop: [33.2, 51.24],
  Bakhmach: [32.82, 51.18],
  Nezhin: [31.89, 51.05],
  Kiev: [30.52, 50.45],
  // Kursk - Kiev
  Lgov: [35.26, 51.66],
  Vorozhba: [34.2, 51.18],
  // Kiev - Odessa
  Fastov: [29.91, 50.08],
  Kazatin: [28.83, 49.72],
  Vinnitsa: [28.47, 49.23],
  Zhmerinka: [28.11, 49.04],
  Vapnyarka: [28.75, 48.53],
  Birzula: [29.87, 47.75],
  Razdelnaya: [30.08, 46.84],
  Odessa: [30.73, 46.48],
  // Kiev - Kovel
  Korosten: [28.64, 50.95],
  Sarny: [26.6, 51.34],
  Kovel: [24.71, 51.21],
  // Kazatin - Brest
  Berdichev: [28.59, 49.9],
  Shepetovka: [27.06, 50.18],
  Zdolbunov: [26.25, 50.51],
  Rovno: [26.25, 50.62],
  Kivertsi: [25.47, 50.83],
  Ratno: [24.52, 51.67],
  // Zdolbunov - Radziwillow (to Brody)
  Dubno: [25.73, 50.42],
  Radziwillow: [25.25, 50.13],
  // Zhmerinka - Volochysk (to Podwoloczyska)
  Proskurov: [26.99, 49.42],
  Volochysk: [26.25, 49.53],
  // Vistula railway
  Pilawa: [21.3, 51.96],
  Ivangorod: [21.84, 51.56],
  Lublin: [22.57, 51.25],
  Chelm: [23.47, 51.14],
  "Nowy Dwor": [20.72, 52.43],
  Nasielsk: [20.81, 52.59],
  Ciechanow: [20.62, 52.88],
  Mlawa: [20.37, 53.11],
  // Warsaw - Vienna (to Granica)
  Grodzisk: [20.63, 52.11],
  Skierniewice: [20.15, 51.96],
  Koluszki: [19.82, 51.74],
  Piotrkow: [19.7, 51.41],
  Radomsko: [19.45, 51.07],
  Czestochowa: [19.12, 50.81],
  Zawiercie: [19.42, 50.49],
  Granica: [19.27, 50.29],
  // Warsaw - Aleksandrow (to Thorn)
  Sochaczew: [20.24, 52.23],
  Lowicz: [19.94, 52.11],
  Kutno: [19.36, 52.23],
  Wloclawek: [19.07, 52.65],
  Aleksandrow: [18.7, 52.87],
  // Brest - Grajewo (to Prostken)
  Bielsk: [23.19, 52.77],
  Osowiec: [22.64, 53.48],
  Grajewo: [22.45, 53.65],
  // Riga - Oryol
  Riga: [24.12, 56.95],
  Kreuzburg: [25.86, 56.51],
  Polotsk: [28.78, 55.49],
  Vitebsk: [30.2, 55.19],
  Roslavl: [32.87, 53.95],
  // Libau - Romny
  Libau: [21.01, 56.51],
  Mazeikiai: [22.34, 56.31],
  Shavli: [23.32, 55.93],
  Radviliskis: [23.53, 55.81],
  Molodechno: [26.85, 54.31],
  Osipovichi: [28.64, 53.3],
  Bobruisk: [29.23, 53.14],
  Zhlobin: [30.02, 52.89],
  Gomel: [30.98, 52.43],
  Snovsk: [31.95, 51.82],
  // Oryol - Gryazi - Voronezh - Rostov
  Yelets: [38.5, 52.62],
  Gryazi: [39.95, 52.49],
  Voronezh: [39.2, 51.67],
  Liski: [39.5, 50.98],
  Rossosh: [39.57, 50.19],
  Millerovo: [40.4, 48.92],
  Likhaya: [40.23, 48.12],
  Novocherkassk: [40.1, 47.42],
  // idle lines
  "Sergiev Posad": [38.13, 56.3],
  Alexandrov: [38.71, 56.4],
  "Rostov Veliky": [39.42, 57.19],
  Yaroslavl: [39.87, 57.63],
  Danilov: [40.18, 58.19],
  Gryazovets: [40.21, 58.88],
  Vologda: [39.89, 59.22],
  Konosha: [40.17, 60.97],
  Nyandoma: [40.19, 61.67],
  Obozersky: [40.32, 63.45],
  Arkhangelsk: [40.54, 64.54],
  Mga: [31.07, 59.75],
  Zvanka: [32.33, 59.92],
  Babaevo: [35.93, 59.39],
  Cherepovets: [37.9, 59.13],
  Bui: [41.53, 58.48],
  Galich: [42.35, 58.38],
  Sharya: [45.51, 58.37],
  Kotelnich: [48.32, 58.3],
  Vyatka: [49.67, 58.6],
  Glazov: [52.66, 58.14],
  Vereshchagino: [54.66, 58.08],
  Perm: [56.25, 58.01],
  Vladimir: [40.41, 56.13],
  Kovrov: [41.32, 56.36],
  "Nizhny Novgorod": [43.94, 56.33],
  Kozlov: [40.49, 52.89],
  // the coins' route (the Samara-Zlatoust line, the Trans-Siberian's start)
  Kolomna: [38.78, 55.08],
  Ryazan: [39.74, 54.63],
  Ryazhsk: [40.06, 53.71],
  Morshansk: [41.81, 53.44],
  Penza: [45.0, 53.2],
  Kuznetsk: [46.6, 53.12],
  Syzran: [48.47, 53.16],
  Samara: [50.1, 53.2],
  Kinel: [50.63, 53.22],
  Buguruslan: [52.44, 53.66],
  Abdulino: [53.65, 53.68],
  Ufa: [55.97, 54.73],
  Asha: [57.26, 54.99],
  Zlatoust: [59.67, 55.17],
  Chelyabinsk: [61.4, 55.16],
};

// kind: "orange" = can be bought (turns orange), "idle" = cream only,
// "route" = the coins' route (cream only). `front: true` = the last station is a
// frontier station: the line is carried on to the nearest point of the front.
const LINES = [
  { id: "nikolaev", kind: "orange", st: ["Moscow", "Klin", "Tver", "Vyshny Volochyok", "Bologoye", "Okulovka", "Malaya Vishera", "Chudovo", "St Petersburg"] },
  { id: "pbWarsaw", kind: "orange", st: ["St Petersburg", "Gatchina", "Luga", "Pskov", "Ostrov", "Rezhitsa", "Dvinsk", "Sventsiany", "Vilna", "Landvarovo", "Orany", "Grodno", "Bialystok", "Lapy", "Malkinia", "Warsaw"] },
  { id: "verzhbolovo", kind: "orange", front: true, st: ["Landvarovo", "Koshedary", "Kovno", "Kazlu Ruda", "Verzhbolovo"] },
  { id: "brest", kind: "orange", st: ["Moscow", "Mozhaisk", "Gzhatsk", "Vyazma", "Smolensk", "Orsha", "Borisov", "Minsk", "Stolbtsy", "Baranovichi", "Brest"] },
  { id: "terespol", kind: "orange", st: ["Brest", "Biala Podlaska", "Miedzyrzec", "Lukow", "Siedlce", "Minsk Mazowiecki", "Warsaw"] },
  { id: "kursk", kind: "orange", st: ["Moscow", "Serpukhov", "Tula", "Mtsensk", "Oryol", "Kursk", "Belgorod", "Kharkov"] },
  { id: "azov", kind: "orange", st: ["Kharkov", "Lozovaya", "Slavyansk", "Nikitovka", "Ilovaisk", "Taganrog", "Rostov"] },
  { id: "yekaterinoslav", kind: "orange", st: ["Lozovaya", "Pavlograd", "Sinelnikovo", "Yekaterinoslav"] },
  { id: "kiev", kind: "orange", st: ["Moscow", "Maloyaroslavets", "Kaluga", "Sukhinichi", "Bryansk", "Mikhailovsky Khutor", "Konotop", "Bakhmach", "Nezhin", "Kiev"] },
  { id: "kurskKiev", kind: "orange", st: ["Kursk", "Lgov", "Vorozhba", "Konotop"] },
  { id: "odessa", kind: "orange", st: ["Kiev", "Fastov", "Kazatin", "Vinnitsa", "Zhmerinka", "Vapnyarka", "Birzula", "Razdelnaya", "Odessa"] },
  { id: "sarny", kind: "orange", st: ["Kiev", "Korosten", "Sarny", "Kovel"] },
  { id: "kazatinBrest", kind: "orange", st: ["Kazatin", "Berdichev", "Shepetovka", "Zdolbunov", "Rovno", "Kivertsi", "Kovel", "Ratno", "Brest"] },
  { id: "radziwillow", kind: "orange", front: true, st: ["Zdolbunov", "Dubno", "Radziwillow"] },
  { id: "volochysk", kind: "orange", front: true, st: ["Zhmerinka", "Proskurov", "Volochysk"] },
  { id: "vistula", kind: "orange", st: ["Warsaw", "Pilawa", "Ivangorod", "Lublin", "Chelm", "Kovel"] },
  { id: "mlawa", kind: "orange", front: true, st: ["Warsaw", "Nowy Dwor", "Nasielsk", "Ciechanow", "Mlawa"] },
  { id: "granica", kind: "orange", front: true, st: ["Warsaw", "Grodzisk", "Skierniewice", "Koluszki", "Piotrkow", "Radomsko", "Czestochowa", "Zawiercie", "Granica"] },
  { id: "aleksandrow", kind: "orange", front: true, st: ["Warsaw", "Sochaczew", "Lowicz", "Kutno", "Wloclawek", "Aleksandrow"] },
  { id: "grajewo", kind: "orange", front: true, st: ["Brest", "Bielsk", "Bialystok", "Osowiec", "Grajewo"] },
  { id: "rigaOryol", kind: "orange", st: ["Riga", "Kreuzburg", "Dvinsk", "Polotsk", "Vitebsk", "Smolensk", "Roslavl", "Bryansk", "Oryol"] },
  { id: "libau", kind: "orange", st: ["Libau", "Mazeikiai", "Shavli", "Radviliskis", "Koshedary"] },
  { id: "vilnaMinsk", kind: "orange", st: ["Vilna", "Molodechno", "Minsk"] },
  { id: "polesie", kind: "orange", st: ["Minsk", "Osipovichi", "Bobruisk", "Zhlobin", "Gomel", "Snovsk", "Bakhmach"] },
  { id: "voronezh", kind: "orange", st: ["Oryol", "Yelets", "Gryazi", "Voronezh", "Liski", "Rossosh", "Millerovo", "Likhaya", "Novocherkassk", "Rostov"] },
  // idle
  { id: "arkhangelsk", kind: "idle", st: ["Moscow", "Sergiev Posad", "Alexandrov", "Rostov Veliky", "Yaroslavl", "Danilov", "Gryazovets", "Vologda", "Konosha", "Nyandoma", "Obozersky", "Arkhangelsk"] },
  { id: "pbVologda", kind: "idle", st: ["St Petersburg", "Mga", "Zvanka", "Babaevo", "Cherepovets", "Vologda"] },
  { id: "vyatka", kind: "idle", st: ["Danilov", "Bui", "Galich", "Sharya", "Kotelnich", "Vyatka", "Glazov", "Vereshchagino", "Perm"] },
  { id: "nizhny", kind: "idle", st: ["Moscow", "Vladimir", "Kovrov", "Nizhny Novgorod"] },
  { id: "kozlov", kind: "idle", st: ["Ryazhsk", "Kozlov", "Gryazi"] },
  // the coins' route, Moscow -> Chelyabinsk
  { id: "route", kind: "route", st: ["Moscow", "Kolomna", "Ryazan", "Ryazhsk", "Morshansk", "Penza", "Kuznetsk", "Syzran", "Samara", "Kinel", "Buguruslan", "Abdulino", "Ufa", "Asha", "Zlatoust", "Chelyabinsk"] },
];

// ---------------------------------------------------------------------------
// THE FIT
// ---------------------------------------------------------------------------
const H_WEB = 815; // the orange web's height at k 1, world == screen px
const Y_WEB_BOTTOM = 1135;
const projection = geoConicConformal().parallels([47, 57]).rotate([-38, 0]).center([0, 53]).scale(1).translate([0, 0]);
{
  const names = new Set(LINES.filter((l) => l.kind === "orange").flatMap((l) => l.st));
  let [x0, x1, y0, y1] = [Infinity, -Infinity, Infinity, -Infinity];
  for (const n of names) {
    const [x, y] = projection(ST[n]);
    x0 = Math.min(x0, x);
    x1 = Math.max(x1, x);
    y0 = Math.min(y0, y);
    y1 = Math.max(y1, y);
  }
  const s = H_WEB / (y1 - y0);
  projection.scale(s);
  projection.translate([540 - ((x0 + x1) / 2) * s, Y_WEB_BOTTOM - y1 * s]);
}
const SCALE = projection.scale();
const CLIP = [
  [-700, -700],
  [2300, 2700],
];
projection.clipExtent(CLIP);
const P = (ll) => projection(ll);
const kmPx = (() => {
  const p = P([38, 52]);
  const q = P([38, 53]);
  return Math.hypot(q[0] - p[0], q[1] - p[1]) / 111.2;
})();
console.log(`scale ${SCALE.toFixed(2)}  ${kmPx.toFixed(4)} world px per km`);

// -- a rounding path sink ------------------------------------------------------
const MIN_STEP = 0.15;
const n2 = (v) => {
  const r = Math.round(v * 40) / 40;
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
      if (Math.hypot(x - px, y - py) < MIN_STEP) {
        pending = [x, y];
        return;
      }
      pending = null;
      px = x;
      py = y;
      out += `L${n2(x)},${n2(y)}`;
    },
    closePath() {
      if (pending && Math.hypot(pending[0] - sx, pending[1] - sy) >= MIN_STEP) out += `L${n2(pending[0])},${n2(pending[1])}`;
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
const r2 = (v) => Math.round(v * 100) / 100;

// ---------------------------------------------------------------------------
// LAND, LAKES, GRATICULE
// ---------------------------------------------------------------------------
const polysOf = (g) => (g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : []);
const VIEW = { lon: [-15, 95], lat: [28, 86] };
const ringInView = (ring) => {
  let [x0, x1, y0, y1] = [Infinity, -Infinity, Infinity, -Infinity];
  for (const [lon, lat] of ring) {
    x0 = Math.min(x0, lon);
    x1 = Math.max(x1, lon);
    y0 = Math.min(y0, lat);
    y1 = Math.max(y1, lat);
  }
  return x1 >= VIEW.lon[0] && x0 <= VIEW.lon[1] && y1 >= VIEW.lat[0] && y0 <= VIEW.lat[1] && x1 > -25;
};
const sane = (rings) => geoArea({ type: "Polygon", coordinates: [rings[0]] }) < 2 * Math.PI;
const inView = (geometry) => {
  const kept = polysOf(geometry).filter((rings) => ringInView(rings[0]) && sane(rings));
  return kept.length ? { type: "MultiPolygon", coordinates: kept } : null;
};
const landTopo = JSON.parse(readFileSync("node_modules/world-atlas/land-10m.json", "utf8"));
const land = feature(landTopo, landTopo.objects.land);
const LAND_D = bake({ type: "GeometryCollection", geometries: land.features.map((f) => inView(f.geometry)).filter(Boolean) });

const lakeSrc = JSON.parse(readFileSync("scripts/european-russia-lakes.json", "utf8"));
const aral = JSON.parse(readFileSync("scripts/transsib-lakes.json", "utf8")).aral;
const lakeGeos = [...lakeSrc.lakes.map((l) => l.rings), aral].map((rings) => {
  const g = { type: "Polygon", coordinates: rings.map((r) => [...r]) };
  if (geoArea(g) > 2 * Math.PI) g.coordinates = rings.map((r) => [...r].reverse());
  return g;
});
const LAKES_D = bake({ type: "GeometryCollection", geometries: lakeGeos });

const GRATICULE_D = bake(
  geoGraticule()
    .extent([
      [-10, 30],
      [90, 80.001],
    ])
    .step([5, 5])
    .precision(0.5)(),
);

// ---------------------------------------------------------------------------
// THE 1914 POLITY FIELD (scripts/build-ww1-map.mjs, copied)
// ---------------------------------------------------------------------------
const hist = await (async () => {
  const p = process.argv[2];
  if (p && existsSync(p)) return JSON.parse(readFileSync(p, "utf8"));
  const res = await fetch(SRC_URL);
  if (!res.ok) throw new Error(`fetch ${SRC_URL}: ${res.status}`);
  return res.json();
})();
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
const cTopo = JSON.parse(readFileSync("node_modules/world-atlas/countries-10m.json", "utf8"));
const countries = feature(cTopo, cTopo.objects.countries).features;

const RES = 0.02;
const LON0 = 2;
const LAT0 = 34;
const RW = Math.ceil((80 - LON0) / RES);
const RH = Math.ceil((76 - LAT0) / RES);
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
};
const histNames = [null];
const histRaster = new Uint8Array(RW * RH);
for (const f of hist.features) {
  const name = f.properties.NAME;
  if (!name) continue;
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
// Hand corrections (build-ww1-map.mjs): only the ones inside this map's extent.
const H = {
  SDOBRUJA: [
    [26.55, 44.07], [26.95, 43.9], [27.3, 43.75], [27.55, 43.62], [27.8, 43.5], [27.95, 43.42],
    [28.08, 43.34], [28.9, 43.34], [28.9, 44.3], [26.55, 44.3],
  ],
  VOJVODINA: [
    [19.08, 44.87], [19.35, 44.93], [19.61, 44.96], [19.72, 44.78], [19.95, 44.72], [20.2, 44.67],
    [20.35, 44.76], [20.45, 44.83], [20.62, 44.78], [20.93, 44.69], [21.2, 44.74], [21.4, 44.78],
    [21.7, 44.75], [21.7, 46.3], [18.7, 46.3], [18.7, 44.87],
  ],
  OUTLANDS_A: [[22.6, 43.0], [22.62, 43.12], [22.75, 43.22], [23.05, 43.25], [23.05, 42.88], [22.75, 42.88]],
  OUTLANDS_B: [[22.28, 42.45], [22.35, 42.62], [22.6, 42.62], [22.7, 42.5], [22.7, 42.3], [22.4, 42.3]],
  METOHIJA: [
    [20.05, 42.55], [20.15, 42.85], [20.45, 42.92], [20.62, 42.75], [20.58, 42.52], [20.52, 42.3],
    [20.3, 42.22], [20.05, 42.35],
  ],
  BOKA: [
    [18.4, 42.62], [18.52, 42.56], [18.62, 42.52], [18.73, 42.47], [18.8, 42.42], [18.86, 42.34],
    [18.96, 42.24], [19.04, 42.15], [19.08, 42.1], [18.9, 41.95], [18.3, 42.3],
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
  KARS: [
    [41.5, 41.47], [41.8, 41.62], [43.0, 41.62], [44.9, 40.0], [44.6, 39.65], [44.3, 39.68],
    [43.7, 39.85], [43.3, 39.95], [43.05, 40.02], [42.75, 40.12], [42.45, 40.25], [42.2, 40.38],
    [41.95, 40.45], [41.75, 40.6], [41.65, 40.85], [41.55, 41.1], [41.55, 41.3],
  ],
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
const SELF = new Set(["Netherlands", "Luxembourg", "Switzerland", "Norway", "Sweden", "Albania", "Iran"]);
const RULE = {
  Germany: () => "Germany",
  Denmark: (lon, lat) => (inH("NSCHLES", lon, lat) ? "Germany" : "Denmark"),
  Italy: (lon, lat) => (inH("ITEAST", lon, lat) || histAt(lon, lat) === "AustriaHungary" ? "AustriaHungary" : "Italy"),
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
  Ukraine: (lon, lat) => (histAt(lon, lat) === "AustriaHungary" ? "AustriaHungary" : "Russia"),
  Romania: (lon, lat) => (histAt(lon, lat) === "AustriaHungary" ? "AustriaHungary" : "Romania"),
  Bulgaria: (lon, lat) => (inH("SDOBRUJA", lon, lat) ? "Romania" : "Bulgaria"),
  Serbia: (lon, lat) =>
    inH("VOJVODINA", lon, lat) ? "AustriaHungary" : inH("OUTLANDS_A", lon, lat) || inH("OUTLANDS_B", lon, lat) ? "Bulgaria" : "Serbia",
  Kosovo: (lon, lat) => (inH("METOHIJA", lon, lat) ? "Montenegro" : "Serbia"),
  Montenegro: (lon, lat) => (inH("BOKA", lon, lat) ? "AustriaHungary" : "Montenegro"),
  Macedonia: () => "Serbia",
  Greece: () => "Greece",
  Turkey: (lon, lat) => (inH("KARS", lon, lat) ? "Russia" : "Ottoman"),
  Georgia: () => "Russia",
  Armenia: () => "Russia",
  Azerbaijan: () => "Russia",
  Kazakhstan: () => "Russia",
  Turkmenistan: () => "Russia",
  Uzbekistan: () => "Russia",
  Kyrgyzstan: () => "Russia",
  Tajikistan: () => "Russia",
  Syria: () => "Ottoman",
  Iraq: () => "Ottoman",
};
const polityAt = (lon, lat) => {
  const m = modernAt(lon, lat);
  if (!m) return null;
  if (SELF.has(m)) return m;
  const r = RULE[m];
  if (r) return r(lon, lat);
  return histAt(lon, lat);
};

// -- border candidates, side-tested against the field ----------------------------
const OFF = 0.04;
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
  return { m: [mlon, mlat], a: [mlon + (nx * OFF) / cl, mlat + ny * OFF], b: [mlon - (nx * OFF) / cl, mlat - ny * OFF] };
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
const densifyRing = (ring, step = 0.03) => densifyLine([...ring, ring[0]], step);
const BOX = { lon: [4, 75], lat: [36, 72] };
const lineInBox = (line) => line.some(([lon, lat]) => lon >= BOX.lon[0] && lon <= BOX.lon[1] && lat >= BOX.lat[0] && lat <= BOX.lat[1]);
const candidates = [];
const modernMesh = mesh(cTopo, cTopo.objects.countries, (a, b) => a !== b);
for (const line0 of modernMesh.coordinates) for (const line of splitAtJumps(line0)) if (lineInBox(line)) candidates.push({ pts: densifyLine(line), prio: 2 });
for (const f of hist.features) {
  if (!f.properties.NAME) continue;
  const g = inView(f.geometry);
  if (!g) continue;
  for (const rings of g.coordinates) for (const ring of rings) for (const line of splitAtJumps(ring)) if (lineInBox(line)) candidates.push({ pts: densifyLine(line), prio: 1 });
}
for (const k of Object.keys(H)) candidates.push({ pts: densifyRing(H[k]), prio: 3 });
candidates.forEach((c, i) => (c.cid = i));

const isFrontPair = (A, B) =>
  (A === "Russia" && (B === "Germany" || B === "AustriaHungary")) || (B === "Russia" && (A === "Germany" || A === "AustriaHungary"));
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
        const hi = prio === 1 ? 10 : 3;
        if (near(m, hi, (s) => s.prio > prio) || near(m, 2.5, (s) => s.prio === prio && s.cid !== cand.cid)) ok = false;
      }
      if (!ok) {
        run = null;
        continue;
      }
      const seg = { m, prio, cid: cand.cid };
      const k = gkey(...m);
      if (!grid.has(k)) grid.set(k, []);
      grid.get(k).push(seg);
      const kind = isFrontPair(A, B) ? "front" : "europe";
      if (!run || run.kind !== kind) {
        run = { kind, prio, pts: [p] };
        runs.push(run);
      }
      run.pts.push(q);
    }
  }
}
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
const finalRuns = runs.filter((r) => runLenKm(r.pts) > 4).map((r) => ({ ...r, pts: r.prio === 2 ? r.pts : chaikin(r.pts) }));
const lineD = (chains) =>
  chains
    .map((c) => {
      let s = "";
      let last = null;
      c.forEach((ll, i) => {
        const [x, y] = P(ll);
        if (last && i < c.length - 1 && Math.hypot(x - last[0], y - last[1]) < 0.3) return;
        s += `${s ? "L" : "M"}${n2(x)},${n2(y)}`;
        last = [x, y];
      });
      return s;
    })
    .join("");
const BORDERS_D = lineD(finalRuns.map((r) => r.pts));

// -- THE FRONT: the Russia-Germany + Russia-Austria-Hungary runs joined N -> S ---
const frontRuns = finalRuns.filter((r) => r.kind === "front").map((r) => r.pts);
console.log(`front runs: ${frontRuns.length} (${frontRuns.map((r) => runLenKm(r).toFixed(0)).join(", ")} km)`);
const FRONT_LL = (() => {
  const rest = frontRuns.map((r) => r.slice());
  // start at the northernmost endpoint (the Baltic)
  let bi = 0;
  let rev = false;
  let by = -Infinity;
  rest.forEach((r, i) => {
    if (r[0][1] > by) [by, bi, rev] = [r[0][1], i, false];
    if (r[r.length - 1][1] > by) [by, bi, rev] = [r[r.length - 1][1], i, true];
  });
  let out = rest.splice(bi, 1)[0];
  if (rev) out.reverse();
  const gaps = [];
  while (rest.length) {
    const e = out[out.length - 1];
    let bj = -1;
    let bd = Infinity;
    let brev = false;
    rest.forEach((r, i) => {
      const d0 = KM(r[0][0] - e[0], r[0][1] - e[1], e[1]);
      const d1 = KM(r[r.length - 1][0] - e[0], r[r.length - 1][1] - e[1], e[1]);
      if (d0 < bd) [bd, bj, brev] = [d0, i, false];
      if (d1 < bd) [bd, bj, brev] = [d1, i, true];
    });
    if (bd > 40) {
      console.log(`  dropping ${rest.length} front runs ${bd.toFixed(1)} km off the chain (${rest.map((r) => runLenKm(r).toFixed(0)).join(",")} km)`);
      break;
    }
    const r = rest.splice(bj, 1)[0];
    if (brev) r.reverse();
    gaps.push(bd.toFixed(1));
    out = out.concat(r);
  }
  console.log(`  front joins, gaps km: ${gaps.join(" ")}`);
  return out;
})();
// in world px, resampled evenly (2 world px) and lightly smoothed
const resample = (pts, step) => {
  const c = [0];
  for (let i = 1; i < pts.length; i++) c.push(c[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const L = c[c.length - 1];
  const n = Math.max(2, Math.round(L / step));
  const out = [];
  let j = 0;
  for (let i = 0; i <= n; i++) {
    const s = (L * i) / n;
    while (j < c.length - 2 && c[j + 1] < s) j++;
    const u = (s - c[j]) / (c[j + 1] - c[j] || 1);
    out.push([pts[j][0] + (pts[j + 1][0] - pts[j][0]) * u, pts[j][1] + (pts[j + 1][1] - pts[j][1]) * u]);
  }
  return out;
};
const smoothPts = (pts, w, passes) => {
  let a = pts;
  for (let p = 0; p < passes; p++)
    a = a.map((q, i) => {
      if (i === 0 || i === a.length - 1) return q;
      let x = 0;
      let y = 0;
      let c = 0;
      for (let j = Math.max(0, i - w); j <= Math.min(a.length - 1, i + w); j++) {
        x += a[j][0];
        y += a[j][1];
        c++;
      }
      return [x / c, y / c];
    });
  return a;
};
const FRONT = smoothPts(resample(FRONT_LL.map((ll) => P(ll)), 1.5), 2, 2);
const cumOf = (pts) => {
  const c = [0];
  for (let i = 1; i < pts.length; i++) c.push(c[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return c;
};
const FRONT_CUM = cumOf(FRONT);
const FRONT_LEN = FRONT_CUM[FRONT_CUM.length - 1];
console.log(`front: ${FRONT.length} pts, ${FRONT_LEN.toFixed(0)} world px; N end ${FRONT_LL[0].map((v) => v.toFixed(2))}, S end ${FRONT_LL[FRONT_LL.length - 1].map((v) => v.toFixed(2))}`);
// nearest point on the front (world px)
const nearestOnFront = (x, y) => {
  let best = { d: Infinity, s: 0, x: 0, y: 0, i: 0, t: 0 };
  for (let i = 1; i < FRONT.length; i++) {
    const [ax, ay] = FRONT[i - 1];
    const [bx, by] = FRONT[i];
    const dx = bx - ax;
    const dy = by - ay;
    const l2 = dx * dx + dy * dy || 1e-9;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / l2));
    const qx = ax + t * dx;
    const qy = ay + t * dy;
    const d = Math.hypot(x - qx, y - qy);
    if (d < best.d) best = { d, s: FRONT_CUM[i - 1] + t * Math.sqrt(l2), x: qx, y: qy, i, t };
  }
  return best;
};

// ---------------------------------------------------------------------------
// THE RAILWAY
// ---------------------------------------------------------------------------
const catmull = (pts, perSeg = 10) => {
  const ext = [
    [2 * pts[0][0] - pts[1][0], 2 * pts[0][1] - pts[1][1]],
    ...pts,
    [2 * pts[pts.length - 1][0] - pts[pts.length - 2][0], 2 * pts[pts.length - 1][1] - pts[pts.length - 2][1]],
  ];
  const out = [pts[0]];
  const idx = [0];
  const knot = (p, q) => Math.pow(Math.hypot(q[0] - p[0], q[1] - p[1]), 0.5) || 1e-6;
  for (let i = 1; i < ext.length - 2; i++) {
    const [p0, p1, p2, p3] = [ext[i - 1], ext[i], ext[i + 1], ext[i + 2]];
    const t0 = 0;
    const t1 = t0 + knot(p0, p1);
    const t2 = t1 + knot(p1, p2);
    const t3 = t2 + knot(p2, p3);
    for (let s = 1; s <= perSeg; s++) {
      const t = t1 + ((t2 - t1) * s) / perSeg;
      const lerp = (A, B, ta, tb) => [
        ((tb - t) / (tb - ta)) * A[0] + ((t - ta) / (tb - ta)) * B[0],
        ((tb - t) / (tb - ta)) * A[1] + ((t - ta) / (tb - ta)) * B[1],
      ];
      const A1 = lerp(p0, p1, t0, t1);
      const A2 = lerp(p1, p2, t1, t2);
      const A3 = lerp(p2, p3, t2, t3);
      const B1 = lerp(A1, A2, t0, t2);
      const B2 = lerp(A2, A3, t1, t3);
      out.push(lerp(B1, B2, t1, t2));
    }
    idx.push(out.length - 1);
  }
  return { pts: out, idx };
};
const polyLen = (pts) => cumOf(pts)[pts.length - 1];
const edges = []; // { a, b, pts, len, kind }
const edgeKey = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);
const edgeIndex = new Map();
const frontEnds = []; // { line, station, node, pt, s, gapKm }
let ROUTE_PTS = null;
const ROUTE_STATION_S = {};
for (const line of LINES) {
  const names = [...line.st];
  const pts = names.map((n) => {
    if (!ST[n]) throw new Error(`no station ${n}`);
    return P(ST[n]);
  });
  if (line.front) {
    const last = pts[pts.length - 1];
    const q = nearestOnFront(last[0], last[1]);
    frontEnds.push({ line: line.id, station: names[names.length - 1], node: `FRONT:${line.id}`, pt: [q.x, q.y], s: q.s, gapKm: q.d / kmPx });
    names.push(`FRONT:${line.id}`);
    pts.push([q.x, q.y]);
  }
  const cm = catmull(pts, 10);
  if (line.kind === "route") {
    ROUTE_PTS = cm.pts;
    const rc = cumOf(cm.pts);
    names.forEach((n, i) => (ROUTE_STATION_S[n] = r2(rc[cm.idx[i]])));
  }
  for (let i = 1; i < names.length; i++) {
    const a = names[i - 1];
    const b = names[i];
    const key = edgeKey(a, b);
    const seg = cm.pts.slice(cm.idx[i - 1], cm.idx[i] + 1);
    if (edgeIndex.has(key)) {
      const e = edges[edgeIndex.get(key)];
      if (line.kind === "orange") e.kind = "orange";
      continue;
    }
    edgeIndex.set(key, edges.length);
    edges.push({ a, b, pts: seg, len: polyLen(seg), kind: line.kind });
  }
}
for (const fe of frontEnds) console.log(`frontier end ${fe.station.padEnd(12)} -> front ${fe.gapKm.toFixed(1)} km away, front s ${fe.s.toFixed(0)}`);

// Dijkstra from Moscow over the orange edges
const orangeEdges = edges.filter((e) => e.kind === "orange");
const adj = new Map();
orangeEdges.forEach((e, i) => {
  for (const [u, v] of [
    [e.a, e.b],
    [e.b, e.a],
  ]) {
    if (!adj.has(u)) adj.set(u, []);
    adj.get(u).push({ v, i });
  }
});
const dist = new Map([["Moscow", 0]]);
const prev = new Map();
const todo = new Set(["Moscow"]);
while (todo.size) {
  let u = null;
  let du = Infinity;
  for (const n of todo) if (dist.get(n) < du) [u, du] = [n, dist.get(n)];
  todo.delete(u);
  for (const { v, i } of adj.get(u) ?? []) {
    const nd = du + orangeEdges[i].len;
    if (nd < (dist.get(v) ?? Infinity)) {
      if (!dist.has(v)) todo.add(v);
      else todo.add(v);
      dist.set(v, nd);
      prev.set(v, { u, i });
    }
  }
}
for (const e of orangeEdges) if (!dist.has(e.a) || !dist.has(e.b)) throw new Error(`orange edge ${e.a}-${e.b} not reachable from Moscow`);
// the farthest point of the orange network
let D_MAX = 0;
let C_TOTAL = 0;
for (const e of orangeEdges) {
  const da = dist.get(e.a);
  const db = dist.get(e.b);
  // the meeting point on the edge: da + x = db + len - x
  const x = Math.max(0, Math.min(e.len, (db + e.len - da) / 2));
  D_MAX = Math.max(D_MAX, da + x);
  C_TOTAL += e.len;
}
console.log(`orange: ${orangeEdges.length} edges, ${C_TOTAL.toFixed(0)} world px (${(C_TOTAL / kmPx).toFixed(0)} km), farthest point ${D_MAX.toFixed(0)} px from Moscow`);
for (const fe of frontEnds) console.log(`  ${fe.station.padEnd(12)} reached at d ${dist.get(fe.node).toFixed(0)}`);
const farthest = [...dist.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
console.log(`  farthest nodes: ${farthest.map(([n, d]) => `${n} ${d.toFixed(0)}`).join(", ")}`);

// The feeders: the shortest path Moscow -> each frontier end, as one polyline.
const feeders = frontEnds.map((fe) => {
  const chain = [];
  let n = fe.node;
  while (n !== "Moscow") {
    const { u, i } = prev.get(n);
    const e = orangeEdges[i];
    const seg = e.a === u ? e.pts : [...e.pts].reverse();
    chain.unshift(seg);
    n = u;
  }
  const pts = chain.reduce((acc, seg) => (acc.length ? acc.concat(seg.slice(1)) : seg.slice()), []);
  return { line: fe.line, station: fe.station, pts, len: polyLen(pts), frontS: fe.s };
});

// ---------------------------------------------------------------------------
// THE ARMY'S BAND: the house dot-army (reuniteMotion.ts): blue-noise slots at
// SLOT_S = 1.3 x the dot (9.5 k^0.35 px at the front's k 1.73 = 6.55 world px),
// in one even band behind the front on the Russian side only, a clear gap of
// BAND_GAP world px from the line, BAND_ROWS hex rows deep, swelling to
// BAND_ROWS + BAND_SWELL rows where a frontier line meets the front.
// ---------------------------------------------------------------------------
const BAND_GAP = 8.5;
const SLOT_S = 8.5;
const BAND_ROWS = 3;
const BAND_SWELL = 1.0;
const ROW_H = 0.866 * SLOT_S;
const endS = frontEnds.map((fe) => fe.s);
const bandDepth = (s) => {
  let b = 0;
  for (const e of endS) b = Math.max(b, Math.exp(-(((s - e) / 70) ** 2)));
  return (BAND_ROWS + BAND_SWELL * b) * ROW_H;
};
const BAND_D = (BAND_ROWS + BAND_SWELL) * ROW_H;
const MASK_RES = 0.5;
let [bx0, bx1, by0, by1] = [Infinity, -Infinity, Infinity, -Infinity];
for (const [x, y] of FRONT) {
  bx0 = Math.min(bx0, x);
  bx1 = Math.max(bx1, x);
  by0 = Math.min(by0, y);
  by1 = Math.max(by1, y);
}
const PADB = BAND_GAP + BAND_D + 4;
bx0 = Math.floor(bx0 - PADB);
by0 = Math.floor(by0 - PADB);
bx1 = Math.ceil(bx1 + PADB);
by1 = Math.ceil(by1 + PADB);
const MW = Math.ceil((bx1 - bx0) / MASK_RES);
const MH = Math.ceil((by1 - by0) / MASK_RES);
// front segments bucketed for the distance query
const BUCK = 16;
const buckets = new Map();
for (let i = 1; i < FRONT.length; i++) {
  const [ax, ay] = FRONT[i - 1];
  const [cx2, cy2] = FRONT[i];
  const i0 = Math.floor((Math.min(ax, cx2) - PADB) / BUCK);
  const i1 = Math.floor((Math.max(ax, cx2) + PADB) / BUCK);
  const j0 = Math.floor((Math.min(ay, cy2) - PADB) / BUCK);
  const j1 = Math.floor((Math.max(ay, cy2) + PADB) / BUCK);
  for (let bi = i0; bi <= i1; bi++)
    for (let bj = j0; bj <= j1; bj++) {
      const k = `${bi},${bj}`;
      if (!buckets.has(k)) buckets.set(k, []);
      buckets.get(k).push(i);
    }
}
const frontDist = (x, y) => {
  const segs = buckets.get(`${Math.floor(x / BUCK)},${Math.floor(y / BUCK)}`);
  if (!segs) return { d: Infinity, end: true, s: 0 };
  let best = Infinity;
  let bi = 1;
  let bt = 0;
  for (const i of segs) {
    const [ax, ay] = FRONT[i - 1];
    const [cx2, cy2] = FRONT[i];
    const dx = cx2 - ax;
    const dy = cy2 - ay;
    const l2 = dx * dx + dy * dy || 1e-9;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / l2));
    const d = Math.hypot(x - ax - t * dx, y - ay - t * dy);
    if (d < best) [best, bi, bt] = [d, i, t];
  }
  const end = (bi === 1 && bt === 0) || (bi === FRONT.length - 1 && bt === 1);
  return { d: best, end, s: FRONT_CUM[bi - 1] + bt * (FRONT_CUM[bi] - FRONT_CUM[bi - 1]) };
};
const mask = new Uint8Array(MW * MH);
let maskArea = 0;
for (let j = 0; j < MH; j++)
  for (let i = 0; i < MW; i++) {
    const x = bx0 + (i + 0.5) * MASK_RES;
    const y = by0 + (j + 0.5) * MASK_RES;
    const q = frontDist(x, y);
    if (q.end || q.d < BAND_GAP || q.d > BAND_GAP + bandDepth(q.s)) continue;
    // keep a little clear of both ends of the front
    if (q.s < 6 || q.s > FRONT_LEN - 6) continue;
    const ll = projection.invert([x, y]);
    if (polityAt(ll[0], ll[1]) !== "Russia") continue;
    mask[j * MW + i] = 1;
    maskArea += MASK_RES * MASK_RES;
  }
const inMask = (x, y) => {
  const i = Math.floor((x - bx0) / MASK_RES);
  const j = Math.floor((y - by0) / MASK_RES);
  return i >= 0 && j >= 0 && i < MW && j < MH && mask[j * MW + i] === 1;
};
const ARMY_N = Math.round(maskArea / (0.866 * SLOT_S * SLOT_S));
console.log(`band area ${maskArea.toFixed(0)} world px^2 -> ${ARMY_N} slots at ${SLOT_S} px`);
let seed = 1914;
const rand = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};
const cellsIn = [];
for (let j = 0; j < MH; j++) for (let i = 0; i < MW; i++) if (mask[j * MW + i]) cellsIn.push([bx0 + (i + 0.5) * MASK_RES, by0 + (j + 0.5) * MASK_RES]);
const slots = [];
for (let n = 0; n < ARMY_N; n++) {
  let best = null;
  let bd = -1;
  for (let c = 0; c < 24; c++) {
    const p = cellsIn[Math.floor(rand() * cellsIn.length)];
    let d = Infinity;
    for (const q of slots) d = Math.min(d, Math.hypot(q[0] - p[0], q[1] - p[1]));
    if (d > bd) [bd, best] = [d, p];
  }
  slots.push([best[0], best[1]]);
}
for (let it = 0; it < 90; it++) {
  const s = SLOT_S * 1.04;
  for (let i = 0; i < slots.length; i++) {
    let fx = 0;
    let fy = 0;
    for (let j = 0; j < slots.length; j++) {
      if (i === j) continue;
      const dx = slots[i][0] - slots[j][0];
      const dy = slots[i][1] - slots[j][1];
      if (Math.abs(dx) > s || Math.abs(dy) > s) continue;
      const d = Math.hypot(dx, dy) || 1e-6;
      if (d >= s) continue;
      fx += (dx / d) * (s - d) * 0.5;
      fy += (dy / d) * (s - d) * 0.5;
    }
    const nx = slots[i][0] + fx;
    const ny = slots[i][1] + fy;
    if (inMask(nx, ny)) slots[i] = [nx, ny];
    else if (inMask(slots[i][0] + fx * 0.3, slots[i][1] + fy * 0.3)) slots[i] = [slots[i][0] + fx * 0.3, slots[i][1] + fy * 0.3];
  }
}
{
  const nn = slots.map((p, i) => Math.min(...slots.map((q, j) => (i === j ? Infinity : Math.hypot(q[0] - p[0], q[1] - p[1])))));
  nn.sort((a, b) => a - b);
  console.log(`slot nearest-neighbour: min ${nn[0].toFixed(2)}, p10 ${nn[Math.floor(nn.length * 0.1)].toFixed(2)}, median ${nn[nn.length >> 1].toFixed(2)}, p90 ${nn[Math.floor(nn.length * 0.9)].toFixed(2)}`);
}
const ARMY_SLOTS = slots.map(([x, y]) => [r2(x), r2(y), r2(frontDist(x, y).s)]);

// ---------------------------------------------------------------------------
// LABELS: parallels the names are set along (arcs run well past the text so
// textPath never clips it; the text is centred on the arc's middle).
// ---------------------------------------------------------------------------
const toD = (pts) => `M${pts.map(([x, y]) => `${r2(x)},${r2(y)}`).join("L")}`;
const parallelD = (lat, lon0, lon1, steps = 60) => {
  const pts = [];
  for (let i = 0; i <= steps; i++) pts.push(P([lon0 + ((lon1 - lon0) * i) / steps, lat]));
  return toD(pts);
};
// EUROPEAN / RUSSIA: two rows on parallels ROW_DLAT apart, centred on the web
// where pass 1 set them (31.3 E, 57.2 / 56.45 N), nudged so every orange line
// that meets a row passes through a letter gap, never through a glyph. Glyph
// ink intervals along the baseline (px from the row's centre, IM Fell English
// SC at 34 px, 0.34 em tracking, caps 25 px) were measured off a probe render;
// a tracking change of ds em moves glyph i by (i - (n - 1) / 2) * ds * 34 px
// (checked against a 0.306 em probe). Candidates: the centre within ~2 deg of
// pass 1, tracking 90-100 % of 0.34 em; the one nearest pass 1 wins.
const ROW_DLAT = 0.75;
const GLYPHS = [
  [[-146, -125], [-112, -84], [-71, -45], [-34, -8], [5, 23], [36, 58], [70, 94], [106, 134]],
  [[-97, -71], [-61, -33], [-20, -6], [9, 23], [37, 50], [62, 86]],
];
const CAP = 25;
const LINE_HALF = 7.5; // the orange symbol's half width with its dark casing (5.5 px) + 2 px air
const orangeSamples = [];
for (const e of edges) if (e.kind === "orange") for (const q of resample(e.pts, 1)) orangeSamples.push(q);
const rowFrame = (lat, lon) => {
  const c = P([lon, lat]);
  const c2 = P([lon + 0.5, lat]);
  const tl = Math.hypot(c2[0] - c[0], c2[1] - c[1]);
  const t = [(c2[0] - c[0]) / tl, (c2[1] - c[1]) / tl];
  return { c, t, up: [t[1], -t[0]] };
};
const rowGlyphsClear = (lat, lon, glyphs, spacing) => {
  const { c, t, up } = rowFrame(lat, lon);
  const n = glyphs.length;
  const g = glyphs.map(([g0, g1], i) => {
    const sh = (i - (n - 1) / 2) * (spacing - 0.34) * 34;
    return [g0 + sh - LINE_HALF, g1 + sh + LINE_HALF];
  });
  const lo = g[0][0];
  const hi = g[n - 1][1];
  for (const [x, y] of orangeSamples) {
    const dx = x - c[0];
    const dy = y - c[1];
    const u = dx * up[0] + dy * up[1];
    if (u < -2 || u > CAP + 2) continue;
    const a = dx * t[0] + dy * t[1];
    if (a < lo || a > hi) continue;
    for (const [g0, g1] of g) if (a > g0 && a < g1) return false;
  }
  return true;
};
const PASS1 = P([31.3, 56.825]);
let euroBest = null;
for (const f of [1, 0.975, 0.95, 0.925, 0.9]) {
  const spacing = 0.34 * f;
  for (let lon = 29.3; lon <= 33.3; lon += 0.02)
    for (let lat = 56.2; lat <= 58.3; lat += 0.01) {
      const m = P([lon, lat - ROW_DLAT / 2]);
      const dc = Math.hypot(m[0] - PASS1[0], m[1] - PASS1[1]) + (1 - f) * 200; // prefer the house tracking
      if (euroBest && dc >= euroBest.dc) continue;
      if (!rowGlyphsClear(lat, lon, GLYPHS[0], spacing) || !rowGlyphsClear(lat - ROW_DLAT, lon, GLYPHS[1], spacing)) continue;
      euroBest = { lat, lon, dc, spacing };
    }
}
if (!euroBest) throw new Error("no letter-gap place for EUROPEAN RUSSIA");
console.log(
  `EUROPEAN RUSSIA at ${euroBest.lon.toFixed(2)} E, ${euroBest.lat.toFixed(3)} / ${(euroBest.lat - ROW_DLAT).toFixed(3)} N, tracking ${euroBest.spacing.toFixed(3)} em, ${euroBest.dc.toFixed(0)} px (score) from pass 1`,
);
const LABELS = {
  euro1: { lat: euroBest.lat, lon: euroBest.lon, half: 11 },
  euro2: { lat: euroBest.lat - ROW_DLAT, lon: euroBest.lon, half: 11 },
  wwi: { lat: 53.8, lon: 17.8, half: 9 },
};
const arcs = Object.fromEntries(Object.entries(LABELS).map(([k, v]) => [k, parallelD(v.lat, v.lon - v.half, v.lon + v.half)]));
const L = (ll) => {
  const [x, y] = P(ll);
  return { x: r2(x), y: r2(y) };
};

// -- checks -----------------------------------------------------------------------
for (const n of ["Moscow", "St Petersburg", "Warsaw", "Kiev", "Odessa", "Rostov", "Samara", "Ufa", "Penza", "Syzran", "Granica", "Libau", "Arkhangelsk", "Chelyabinsk"]) {
  const [x, y] = P(ST[n]);
  console.log(`${n.padEnd(14)} (${x.toFixed(0)}, ${y.toFixed(0)})`);
}
console.log(`route: ${ROUTE_PTS.length} pts, ${polyLen(ROUTE_PTS).toFixed(0)} world px; station s ${JSON.stringify(ROUTE_STATION_S)}`);

// ---------------------------------------------------------------------------
// WRITE
// ---------------------------------------------------------------------------
const railAll = edges.map((e) => toD(e.pts)).join("");
writeFileSync(
  OUT_STATIC,
  `// Generated by scripts/build-european-russia-map.mjs — do not edit by hand.
// The STATIC layers of RailwaysInEuropeanRussia, read only by
// scripts/bake-european-russia-rasters.mjs. Natural Earth (public domain, 10m) +
// 1914 polities on a north-up Lambert conformal conic, parallels 47/57, centre
// meridian 38 E, scale ${SCALE.toFixed(2)}. World px == screen px at the k 1
// European Russia wide. Clipped to ${JSON.stringify(CLIP)}.

/** Land, one path (evenodd; the Caspian, the Black Sea are holes). */
export const LAND_D = ${JSON.stringify(LAND_D)};
/** Natural lakes (Natural Earth 10m; no Soviet reservoirs) + the pre-1960 Aral. */
export const LAKES_D = ${JSON.stringify(LAKES_D)};
/** 1914 borders (every polity change, the front included). */
export const BORDERS_D = ${JSON.stringify(BORDERS_D)};
/** 5 degree graticule. */
export const GRATICULE_D = ${JSON.stringify(GRATICULE_D)};
/** The whole 1914 trunk network (idle cream, ~0.5 in the bake). */
export const RAIL_ALL_D = ${JSON.stringify(railAll)};
`,
);
const rp = (pts) => pts.map(([x, y]) => [r2(x), r2(y)]);
writeFileSync(
  OUT,
  `// Generated by scripts/build-european-russia-map.mjs — do not edit by hand.
// The light OVERLAYS of RailwaysInEuropeanRussia. Lambert conformal conic,
// parallels 47/57, centre meridian 38 E, scale ${SCALE.toFixed(2)}. World px ==
// screen px at the k 1 European Russia wide. ${kmPx.toFixed(4)} world px per km.

export type Pt = { x: number; y: number };
export type P2 = [number, number];
export type Edge = { a: string; b: string; pts: P2[]; len: number; da: number; db: number };

export const PX_PER_KM = ${kmPx.toFixed(4)};

/** The orange-able network: every edge with its polyline (a -> b), its length
 *  and the shortest network distance from Moscow to each end (world px). */
export const ORANGE_EDGES: Edge[] = ${JSON.stringify(
    orangeEdges.map((e) => ({ a: e.a, b: e.b, pts: rp(e.pts), len: r2(e.len), da: r2(dist.get(e.a)), db: r2(dist.get(e.b)) })),
  )};
/** Total orange length and the farthest network distance from Moscow. */
export const ORANGE_TOTAL = ${r2(C_TOTAL)};
export const ORANGE_DMAX = ${r2(D_MAX)};

/** The coins' route, Moscow -> Chelyabinsk (the same polyline the idle network draws). */
export const ROUTE_PTS: P2[] = ${JSON.stringify(rp(ROUTE_PTS))};
export const ROUTE_STATION_S: Record<string, number> = ${JSON.stringify(ROUTE_STATION_S)};

/** THE FRONT: Russia's 1914 border with Germany and Austria-Hungary, Baltic -> Prut, world px. */
export const FRONT_PTS: P2[] = ${JSON.stringify(rp(FRONT))};
export const FRONT_LEN = ${r2(FRONT_LEN)};

/** The frontier lines: shortest path Moscow -> the point where the line meets the front. */
export const FEEDERS: { line: string; station: string; pts: P2[]; len: number; frontS: number }[] = ${JSON.stringify(
    feeders.map((f) => ({ line: f.line, station: f.station, pts: rp(f.pts), len: r2(f.len), frontS: r2(f.frontS) })),
  )};

/** The army's blue-noise band slots behind the front: [x, y, arclength of the nearest front point]. */
export const ARMY_SLOTS: [number, number, number][] = ${JSON.stringify(ARMY_SLOTS)};
export const BAND = { gap: ${BAND_GAP}, rows: ${BAND_ROWS}, swellRows: ${BAND_SWELL}, spacing: ${SLOT_S} };

export const MOSCOW: Pt = ${JSON.stringify(L(ST.Moscow))};

/** Parallels the names are set along. */
export const EURO1_ARC_D = ${JSON.stringify(arcs.euro1)};
export const EURO2_ARC_D = ${JSON.stringify(arcs.euro2)};
export const WWI_ARC_D = ${JSON.stringify(arcs.wwi)};
/** EUROPEAN RUSSIA tracking (em), set by the letter-gap search. */
export const EURO_SPACING = ${euroBest.spacing.toFixed(4)};
export const LABEL_MID: Record<string, Pt> = ${JSON.stringify(Object.fromEntries(Object.entries(LABELS).map(([k, v]) => [k, L([v.lon, v.lat])])))};
`,
);
console.log(`Wrote ${OUT_STATIC} (land ${LAND_D.length}, lakes ${LAKES_D.length}, borders ${BORDERS_D.length}, rail ${railAll.length}) and ${OUT}`);
