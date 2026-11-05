// revolutGeo: the pure maths of nik-revolut-ipo's map (no React, no three, no fonts), so a bun probe can import it.
// The tall projection is the same Miller variant as scott-nolan-uranium/nuclearWorld.tsx (projTall), restated here
// because nuclearWorld is read-only for this clip and loads fonts at module scope. nuclearProject is restated likewise.
// @ts-expect-error untyped module
import { geoProjection } from "d3-geo";
import type { NuclearCam } from "../scott-nolan-uranium/nuclearWorld";

export const WORLD_MAP_WIDTH = 1000;
const D2R = Math.PI / 180;

/** Miller-style tall map, lon -130..150 over WORLD_MAP_WIDTH units, centred on lon 10, lat 16 (as nuclearWorld's projTall). */
export const projTall = (() => {
  const p = geoProjection((l: number, f: number) => [l, 1.25 * Math.log(Math.tan(Math.PI / 4 + 0.4 * f))])
    .rotate([-10, 0])
    .scale(1)
    .translate([0, 0])
    .precision(0.2);
  const span = p([150, 0])[0] - p([-130, 0])[0];
  p.scale(WORLD_MAP_WIDTH / span);
  const c = p([10, 16]);
  p.translate([-c[0], -c[1]]);
  return p;
})();
/** lon, lat -> world [X, Z] on the tall map */
export const mapProjectTall = (lon: number, lat: number): [number, number] => {
  const q = projTall([lon, lat]);
  return [q[0], -q[1]];
};

export const eyeOf = (c: NuclearCam): [number, number, number] => {
  const sy = Math.sin(c.yaw * D2R);
  const cy = Math.cos(c.yaw * D2R);
  const sp = Math.sin(c.pitch * D2R);
  const cp = Math.cos(c.pitch * D2R);
  return [c.tx - sy * cp * c.d, c.ty + sp * c.d, c.tz - cy * cp * c.d];
};
/** world point -> screen px (same maths as nuclearProject) */
export const project = (c: NuclearCam, p: [number, number, number]) => {
  const e = eyeOf(c);
  const rx = p[0] - e[0];
  const ry = p[1] - e[1];
  const rz = p[2] - e[2];
  const sy = Math.sin(c.yaw * D2R);
  const cy = Math.cos(c.yaw * D2R);
  const sp = Math.sin(c.pitch * D2R);
  const cp = Math.cos(c.pitch * D2R);
  const d = rx * sy * cp - ry * sp + rz * cy * cp;
  const right = rx * cy - rz * sy;
  const up = rx * sy * sp + ry * cp + rz * cy * sp;
  const dd = Math.max(1e-6, d);
  return { x: c.cx + (c.f * right) / dd, y: c.cy - (c.f * up) / dd, s: c.f / dd, d };
};

// --- the facts (brief, verified by the director; see the cut's header for sources) ---------------------------------
/** ISO alpha-2 -> world-atlas (Natural Earth) numeric id */
export const ISO_NUM: Record<string, string> = {
  AT: "040", BE: "056", BG: "100", HR: "191", CY: "196", CZ: "203", DK: "208", EE: "233", FI: "246", FR: "250", DE: "276",
  GR: "300", HU: "348", IE: "372", IT: "380", LV: "428", LT: "440", LU: "442", MT: "470", NL: "528", PL: "616", PT: "620",
  RO: "642", SK: "703", SI: "705", ES: "724", SE: "752", IS: "352", LI: "438", NO: "578", GB: "826", CH: "756", AU: "036",
  NZ: "554", JP: "392", SG: "702", BR: "076", MX: "484", US: "840", CO: "170", PE: "604", AR: "032", ZA: "710", AE: "784",
  IN: "356",
};
/** where Revolut operates today: cream from f0 (EEA = EU 27 + IS, LI, NO; then GB, CH, AU, NZ, JP, SG, BR, MX, US) */
export const CURRENT_MARKETS = [
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL",
  "PT", "RO", "SK", "SI", "ES", "SE", "IS", "LI", "NO", "GB", "CH", "AU", "NZ", "JP", "SG", "BR", "MX", "US",
];
/** the expansion wave, board -> amber, in the brief's order (roughly west -> east) */
export const EXPANSION = ["CO", "PE", "AR", "ZA", "AE", "IN"];
