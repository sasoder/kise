// Builds generated/components/iraqEFGData.ts for cuts E/F/G of the Sheppard Iraq clip
// (builder N): the region's land borders split by country pair (so each neighbour's
// borders can take its own rung), and the border crossings the darts press on, snapped
// to IRAQ_ROUTE. Run: bun scripts/build-iraq-efg.ts
import { writeFileSync } from "fs";
import { COUNTRY_D, IRAQ_RING, OTHER_BORDERS_D, PROJ } from "../generated/components/iraqMapData";

type P2 = [number, number];
const parse = (d: string): P2[][] => {
  const out: P2[][] = [];
  for (const sub of d.split("M").filter(Boolean)) {
    const pts = sub
      .replace(/Z/g, "")
      .split("L")
      .filter(Boolean)
      .map((q) => q.split(",").map(Number) as P2);
    out.push(pts);
  }
  return out;
};
// projection (as iraqShared)
const RAD = Math.PI / 180;
const tany = (y: number) => Math.tan((Math.PI / 2 + y) / 2);
const Y0 = PROJ.parallels[0] * RAD;
const Y1 = PROJ.parallels[1] * RAD;
const N_ = Math.log(Math.cos(Y0) / Math.cos(Y1)) / Math.log(tany(Y1) / tany(Y0));
const F_ = (Math.cos(Y0) * Math.pow(tany(Y0), N_)) / N_;
const raw = (x: number, y: number): P2 => {
  const r = F_ / Math.pow(tany(y), N_);
  return [r * Math.sin(N_ * x), F_ - r * Math.cos(N_ * x)];
};
const C0 = raw(0, 0);
const project = (lon: number, lat: number): P2 => {
  const p = raw((lon + PROJ.rotate[0]) * RAD, lat * RAD);
  return [PROJ.translate[0] + PROJ.scale * (p[0] - C0[0]), PROJ.translate[1] - PROJ.scale * (p[1] - C0[1])];
};

const KEYS = ["iraq", "kuwait", "saudi", "jordan", "syria", "turkey", "iran"] as const;
const polys = KEYS.map((k) => {
  const rings = parse((COUNTRY_D as Record<string, string>)[k]);
  const xs = rings.flat().map((p) => p[0]);
  const ys = rings.flat().map((p) => p[1]);
  return { k, rings, box: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)] };
});
const inside = (rings: P2[][], x: number, y: number) => {
  let c = false;
  for (const r of rings)
    for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
      const [xi, yi] = r[i];
      const [xj, yj] = r[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
    }
  return c;
};
const who = (x: number, y: number) => {
  for (const p of polys) {
    if (x < p.box[0] || x > p.box[2] || y < p.box[1] || y > p.box[3]) continue;
    if (inside(p.rings, x, y)) return p.k;
  }
  return "x";
};
const pairs: Record<string, P2[][]> = {};
for (const line of parse(OTHER_BORDERS_D)) {
  let cur: P2[] = [];
  let curKey = "";
  for (let i = 1; i < line.length; i++) {
    const a = line[i - 1];
    const b = line[i];
    const mx = (a[0] + b[0]) / 2;
    const my = (a[1] + b[1]) / 2;
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const nx = -(b[1] - a[1]) / l;
    const ny = (b[0] - a[0]) / l;
    let ks: string[] = [];
    for (const off of [0.8, 1.6, 3]) {
      ks = [who(mx + nx * off, my + ny * off), who(mx - nx * off, my - ny * off)];
      if (ks[0] !== "x" && ks[1] !== "x") break;
    }
    const key = ks.sort().join("-");
    if (key !== curKey) {
      if (cur.length > 1) (pairs[curKey] ||= []).push(cur);
      cur = [a];
      curKey = key;
    }
    cur.push(b);
  }
  if (cur.length > 1) (pairs[curKey] ||= []).push(cur);
}
const dOf = (pts: P2[]) => `M${pts.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join("L")}`;
const PAIR_D: Record<string, string> = {};
for (const [k, ls] of Object.entries(pairs)) PAIR_D[k] = ls.map(dOf).join("");
console.log(Object.fromEntries(Object.entries(pairs).map(([k, v]) => [k, v.reduce((s, l) => s + l.length, 0)])));

// crossings, snapped to the ring
const cum = [0];
for (let i = 1; i < IRAQ_RING.length; i++) cum.push(cum[i - 1] + Math.hypot(IRAQ_RING[i][0] - IRAQ_RING[i - 1][0], IRAQ_RING[i][1] - IRAQ_RING[i - 1][1]));
const snap = (p: P2) => {
  let best = { d: 1e9, s: 0 };
  for (let i = 1; i < IRAQ_RING.length; i++) {
    const a = IRAQ_RING[i - 1];
    const b = IRAQ_RING[i];
    const vx = b[0] - a[0];
    const vy = b[1] - a[1];
    const L2 = vx * vx + vy * vy || 1;
    const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * vx + (p[1] - a[1]) * vy) / L2));
    const q = [a[0] + vx * t, a[1] + vy * t];
    const d = Math.hypot(p[0] - q[0], p[1] - q[1]);
    if (d < best.d) best = { d, s: cum[i - 1] + Math.sqrt(L2) * t };
  }
  return best;
};
// sources: Wikipedia coordinates (Trebil, Arar border crossing, Ibrahim Khalil border
// crossing, Haji Omeran, Shalamcheh); Al-Qaim/Husaybah, Mehran-Zurbatiyah and
// Munthiriya-Khosravi from their towns (Wikipedia / GeoNames)
const CROSS: { name: string; lon: number; lat: number }[] = [
  { name: "alQaim", lon: 40.99, lat: 34.39 },
  { name: "trebil", lon: 39.0, lat: 32.74 },
  { name: "arar", lon: 41.443, lat: 31.358 },
  { name: "shalamcheh", lon: 48.07, lat: 30.5 },
  { name: "mehran", lon: 46.08, lat: 33.1 },
  { name: "munthiriya", lon: 45.47, lat: 34.45 },
  { name: "hajiOmaran", lon: 45.046, lat: 36.675 },
  { name: "habur", lon: 42.566, lat: 37.145 },
];
const CROSSINGS = CROSS.map((c) => {
  const p = project(c.lon, c.lat);
  const sn = snap(p);
  return { name: c.name, lon: c.lon, lat: c.lat, s: +sn.s.toFixed(2), off: +sn.d.toFixed(2) };
});
console.log(CROSSINGS);

const out = `// Generated by scripts/build-iraq-efg.ts - do not edit by hand.
// Cuts E/F/G (builder N): the region's land borders (iraqMapData OTHER_BORDERS_D) split by
// the pair of countries they divide ("saudi-jordan", "iran-x" = Iran and a country outside
// the seven), and the border crossings the darts press on (s = arclength on IRAQ_ROUTE).
export const PAIR_D: Record<string, string> = ${JSON.stringify(PAIR_D)};
export const CROSSINGS: { name: string; lon: number; lat: number; s: number; off: number }[] = ${JSON.stringify(CROSSINGS)};
`;
writeFileSync(new URL("../generated/components/iraqEFGData.ts", import.meta.url), out);
