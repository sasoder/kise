// The map tool's projections: a world's d3 projection fitted from its config,
// the same projection as TypeScript for the data module (project(lon, lat) at
// render time, no d3), and a check that the two agree.
//
// spec (config `projection`):
//   kind      "lcc" (Lambert conformal conic, the default for a region),
//             "albers" (conic equal-area: areas compared), "mercator" (ocean
//             spans), "equalEarth" (world spans). Always north-up.
//   parallels [a, b]  standard parallels (lcc, albers)
//   rotate    -112    the centre meridian, as d3's rotate lambda (112 E -> -112)
//   scale     a number, or { span: [[lon, lat], [lon, lat]], px: 1080 }: those two
//             points end up px apart (world px == screen px at k 1)
//   anchor    [[lon, lat], [x, y]]: that point lands on world (x, y)
//   tsDoc     optional: the doc comment of the emitted project()

import { geoConicConformal, geoConicEqualArea, geoEqualEarth, geoMercator } from "d3-geo";

const RAD = Math.PI / 180;
const D3 = {
  lcc: (s) => geoConicConformal().parallels(s.parallels),
  albers: (s) => geoConicEqualArea().parallels(s.parallels).center([0, 0]), // d3's default centre is 33.6 N; the TS twin assumes 0
  mercator: () => geoMercator(),
  equalEarth: () => geoEqualEarth(),
};
const CONIC = new Set(["lcc", "albers"]);

/** the d3 projection of a spec, and its params ({ kind, parallels?, rotate, scale, translate }) */
export const makeProjection = (spec) => {
  if (!D3[spec.kind]) throw new Error(`projection kind "${spec.kind}": use ${Object.keys(D3).join(", ")}`);
  if (CONIC.has(spec.kind) && !spec.parallels) throw new Error(`projection ${spec.kind} needs parallels`);
  const rotate = spec.rotate ?? 0;
  const proj = D3[spec.kind](spec)
    .rotate([rotate, 0])
    .scale(1)
    .translate([0, 0])
    .precision(spec.precision ?? 0.1);
  if (typeof spec.scale === "number") proj.scale(spec.scale);
  else if (spec.scale?.span) {
    const [a, b] = spec.scale.span.map((ll) => proj(ll));
    proj.scale(spec.scale.px / Math.hypot(b[0] - a[0], b[1] - a[1]));
  } else throw new Error("projection.scale: a number or { span, px }");
  if (spec.anchor) {
    const [ll, at] = spec.anchor;
    const c = proj(ll);
    proj.translate([at[0] - c[0], at[1] - c[1]]);
  }
  const params = CONIC.has(spec.kind)
    ? { kind: spec.kind, parallels: spec.parallels, rotate, scale: proj.scale(), translate: proj.translate() }
    : { kind: spec.kind, rotate, scale: proj.scale(), translate: proj.translate() };
  return { proj, params };
};

const centre = (rotate) => (rotate <= 0 ? `${-rotate} E` : `${rotate} W`);
const DOCS = {
  lcc: () => "lon, lat (deg) -> world px [x, y] (north-up Lambert conformal conic, = the baked map)",
  albers: () => "lon, lat (deg) -> world px [x, y] (north-up Albers equal-area conic, = the baked map)",
  mercator: (p) =>
    `lon, lat (deg) -> world px [x, y] (north-up Mercator rotated to ${centre(p.rotate)}, = the baked map).\n *  Any longitude convention works: -158 and 202 are the same place.`,
  equalEarth: (p) => `lon, lat (deg) -> world px [x, y] (Equal Earth centred on ${centre(p.rotate)}, = the baked map)`,
};

/** the TS twin of the projection (reads `PROJ`, which the module writes just above it) */
export const projectionTs = (params, doc) => {
  const d = `/** ${doc ?? DOCS[params.kind](params)} */`;
  const lam = `  let l = (lon + PROJ.rotate) * RAD;\n  l = Math.atan2(Math.sin(l), Math.cos(l));`;
  if (params.kind === "lcc")
    return `
const RAD = Math.PI / 180;
const tany = (y: number) => Math.tan((Math.PI / 2 + y) / 2);
const Y0 = PROJ.parallels[0] * RAD;
const Y1 = PROJ.parallels[1] * RAD;
const N_ = Math.log(Math.cos(Y0) / Math.cos(Y1)) / Math.log(tany(Y1) / tany(Y0));
const F_ = (Math.cos(Y0) * Math.pow(tany(Y0), N_)) / N_;
${d}
export const project = (lon: number, lat: number): [number, number] => {
${lam}
  const r = F_ / Math.pow(tany(lat * RAD), N_);
  return [PROJ.translate[0] + PROJ.scale * r * Math.sin(N_ * l), PROJ.translate[1] - PROJ.scale * (F_ - r * Math.cos(N_ * l))];
};`;
  if (params.kind === "albers")
    return `
const RAD = Math.PI / 180;
const SY0 = Math.sin(PROJ.parallels[0] * RAD);
const N_ = (SY0 + Math.sin(PROJ.parallels[1] * RAD)) / 2;
const C_ = 1 + SY0 * (2 * N_ - SY0);
const R0_ = Math.sqrt(C_) / N_;
${d}
export const project = (lon: number, lat: number): [number, number] => {
${lam}
  const r = Math.sqrt(C_ - 2 * N_ * Math.sin(lat * RAD)) / N_;
  return [PROJ.translate[0] + PROJ.scale * r * Math.sin(N_ * l), PROJ.translate[1] - PROJ.scale * (R0_ - r * Math.cos(N_ * l))];
};`;
  if (params.kind === "mercator")
    return `
const RAD = Math.PI / 180;
${d}
export const project = (lon: number, lat: number): [number, number] => {
${lam}
  return [PROJ.translate[0] + PROJ.scale * l, PROJ.translate[1] - PROJ.scale * Math.log(Math.tan(Math.PI / 4 + (lat * RAD) / 2))];
};
/** world px -> lon (-180..180), lat */
export const unproject = (x: number, y: number): [number, number] => {
  const l = (x - PROJ.translate[0]) / PROJ.scale / RAD - PROJ.rotate;
  const lon = ((((l + 180) % 360) + 360) % 360) - 180;
  return [lon, (2 * Math.atan(Math.exp((PROJ.translate[1] - y) / PROJ.scale)) - Math.PI / 2) / RAD];
};`;
  return `
const RAD = Math.PI / 180;
const M_ = Math.sqrt(3) / 2;
${d}
export const project = (lon: number, lat: number): [number, number] => {
${lam}
  const t = Math.asin(M_ * Math.sin(lat * RAD));
  const t2 = t * t;
  const t6 = t2 * t2 * t2;
  const x = (l * Math.cos(t)) / (M_ * (1.340264 + 3 * -0.081106 * t2 + t6 * (7 * 0.000893 + 9 * 0.003796 * t2)));
  const y = t * (1.340264 + -0.081106 * t2 + t6 * (0.000893 + 0.003796 * t2));
  return [PROJ.translate[0] + PROJ.scale * x, PROJ.translate[1] - PROJ.scale * y];
};`;
};

/** a JS twin of projectionTs (same maths), to check it against d3 */
const projectionJs = (p) => {
  const lam = (lon) => {
    const l = (lon + p.rotate) * RAD;
    return Math.atan2(Math.sin(l), Math.cos(l));
  };
  const out = (x, y) => [p.translate[0] + p.scale * x, p.translate[1] - p.scale * y];
  if (p.kind === "lcc") {
    const tany = (y) => Math.tan((Math.PI / 2 + y) / 2);
    const [Y0, Y1] = p.parallels.map((v) => v * RAD);
    const N = Math.log(Math.cos(Y0) / Math.cos(Y1)) / Math.log(tany(Y1) / tany(Y0));
    const F = (Math.cos(Y0) * Math.pow(tany(Y0), N)) / N;
    return (lon, lat) => {
      const l = lam(lon);
      const r = F / Math.pow(tany(lat * RAD), N);
      return out(r * Math.sin(N * l), F - r * Math.cos(N * l));
    };
  }
  if (p.kind === "albers") {
    const sy0 = Math.sin(p.parallels[0] * RAD);
    const N = (sy0 + Math.sin(p.parallels[1] * RAD)) / 2;
    const C = 1 + sy0 * (2 * N - sy0);
    const R0 = Math.sqrt(C) / N;
    return (lon, lat) => {
      const l = lam(lon);
      const r = Math.sqrt(C - 2 * N * Math.sin(lat * RAD)) / N;
      return out(r * Math.sin(N * l), R0 - r * Math.cos(N * l));
    };
  }
  if (p.kind === "mercator") return (lon, lat) => out(lam(lon), Math.log(Math.tan(Math.PI / 4 + (lat * RAD) / 2)));
  const M = Math.sqrt(3) / 2;
  return (lon, lat) => {
    const l = lam(lon);
    const t = Math.asin(M * Math.sin(lat * RAD));
    const t2 = t * t;
    const t6 = t2 * t2 * t2;
    return out((l * Math.cos(t)) / (M * (1.340264 + 3 * -0.081106 * t2 + t6 * (7 * 0.000893 + 9 * 0.003796 * t2))), t * (1.340264 + -0.081106 * t2 + t6 * (0.000893 + 0.003796 * t2)));
  };
};

/** throws if the TS projection strays > 1e-3 world px from d3 on a grid over the clip box */
export const checkProjection = (W) => {
  const js = projectionJs(W.params);
  let worst = 0;
  for (let i = 0; i <= 8; i++)
    for (let j = 0; j <= 8; j++) {
      const lon = W.clip.lon[0] + ((W.clip.lon[1] - W.clip.lon[0]) * i) / 8;
      const lat = Math.max(-80, Math.min(80, W.clip.lat[0] + ((W.clip.lat[1] - W.clip.lat[0]) * j) / 8));
      const a = W.proj([lon, lat]);
      const b = js(lon, lat);
      worst = Math.max(worst, Math.hypot(a[0] - b[0], a[1] - b[1]));
    }
  console.log(`${W.name}: TS projection vs d3, worst ${worst.toExponential(2)} px`);
  if (!(worst <= 1e-3)) throw new Error(`${W.name}: TS projection does not match d3`);
};
