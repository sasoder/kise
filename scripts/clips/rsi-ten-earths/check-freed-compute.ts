// check-freed-compute (rev 1): FreedComputeRunsCopies: the join with cut 6 (camera and state at f0 = cut 6 f141),
// every frame: visible faces clear of the caption bands, stations being written in on screen and not behind a rack,
// each generation on screen at its print, and the static footprint overlap of stations, racks, the year and the cable.
// Run: bun scripts/clips/rsi-ten-earths/check-freed-compute.ts
import { camAt7, stationAt, ON_AT, GEN_OF, worldState7 } from "../../../generated/components/rsi-ten-earths/FreedComputeRunsCopies";
import { camAt6, worldState6 } from "../../../generated/components/rsi-ten-earths/ComputePerAIFalls";
import { screenOf3, scaleAt, stationOf, RACKS, YEAR_PAINT, CABLE_PATH, HERO_ID, type BlockCam } from "../../../generated/components/rsi-ten-earths/computeBlockRev1";
import { RACK, DESK } from "../../../generated/components/rsi-ten-earths/tenEarthsHall";
const faceVis = (c: BlockCam, id: number) => {
  const an = stationOf(id).an.at;
  const E = [c.ex, -c.H, -c.Dc];
  let vis = 0, n = 0;
  for (const Y of [-160, -190, -220]) for (const dx of [-15, 15]) {
    const P = [an.X + dx, Y, an.Z];
    n++;
    let hit = false;
    for (const rk of RACKS) {
      const lo = [rk.X - RACK.w / 2, -RACK.h, rk.Z], hi = [rk.X + RACK.w / 2, 0, rk.Z + RACK.d];
      let t0 = 0, t1 = 0.999;
      for (let k = 0; k < 3; k++) {
        const d = P[k] - E[k];
        if (Math.abs(d) < 1e-9) { if (E[k] < lo[k] || E[k] > hi[k]) { t0 = 2; break; } continue; }
        let a = (lo[k] - E[k]) / d, b = (hi[k] - E[k]) / d;
        if (a > b) [a, b] = [b, a];
        t0 = Math.max(t0, a); t1 = Math.min(t1, b);
      }
      if (t0 < t1) { hit = true; break; }
    }
    if (!hit) vis++;
  }
  return vis / n;
};
const BANDS = [[1080, 1250], [1360, 1460]];
const M = 8;
// join
const a = JSON.stringify(camAt6(141)), b = JSON.stringify(camAt7(0));
console.log("camera join identical:", a === b);
const s6 = worldState6(141), s7 = worldState7(0);
console.log("state join identical:", JSON.stringify({ ...s6, power: [...s6.power].filter(([, p]) => p.power > 0) }) === JSON.stringify({ ...s7, sheen: undefined, power: [...s7.power].filter(([, p]) => p.power > 0) }), "| stations", s7.stations.length, "litS", s6.litS === s7.litS);
// per frame
let bandHits = 0, entryOut = 0, hiddenEntry = 0;
const notes: string[] = [];
for (let f = 0; f <= 261; f++) {
  const c = camAt7(f);
  const ids = [HERO_ID, ...ON_AT.keys()];
  for (const id of ids) {
    const st = id === HERO_ID ? { appear: 1 } : stationAt(id, f);
    if (st.appear <= 0) continue;
    const an = stationOf(id).an.at;
    const [x0, fy0] = screenOf3(c, an.X - 50, -235, an.Z), [x1, fy1] = screenOf3(c, an.X + 50, -140, an.Z);
    if (x1 < 0 || x0 > 1080 || fy1 < 0) continue;
    if (BANDS.some(([p, q]) => fy1 + M > p && fy0 - M < q)) { bandHits++; if (notes.length < 12) notes.push(`f${f} face of ${id} in band y${fy0.toFixed(0)}-${fy1.toFixed(0)}`); }
    // a station being written in must be on screen and inside keep-in, and its face not behind a rack
    if (st.appear > 0 && st.appear < 1) {
      if (x0 < 0 || x1 > 1080 || fy0 < 0) { entryOut++; if (notes.length < 24) notes.push(`f${f} entering ${id} (gen ${GEN_OF.get(id)}) out of frame x${x0.toFixed(0)}-${x1.toFixed(0)}`); }
      if (faceVis(c, id) < 0.5) { hiddenEntry++; if (notes.length < 60 && f % 3 === 0) notes.push(`f${f} entering ${id} (gen ${GEN_OF.get(id)}) face behind a rack`); }
    }
  }
}
console.log(`faces in caption bands: ${bandHits} | entering stations (frame-steps) off frame: ${entryOut} | entering faces behind racks: ${hiddenEntry}`);
console.log(notes.join("\n"));
// gen visibility at its print midpoint
for (let g = 1; g <= 4; g++) {
  const ids = [...GEN_OF].filter(([, gg]) => gg === g).map(([id]) => id);
  const fm = Math.round(Math.max(...ids.map((id) => (ON_AT.get(id) ?? 0) + 3 + 3)));
  const c = camAt7(fm);
  const on = ids.filter((id) => { const an = stationOf(id).an.at; const [x, y] = screenOf3(c, an.X, -190, an.Z); return x > 30 && x < 1050 && y > 0 && y < 1070; });
  const px = ids.map((id) => 235 * scaleAt(c, stationOf(id).an.at.Z));
  console.log(`gen ${g} at f${fm}: ${on.length}/${ids.length} faces on screen, robot px ${Math.min(...px).toFixed(0)}-${Math.max(...px).toFixed(0)}`);
}
// static collision: station footprint (chair x -75 .. desk +176 from the robot, desk Z span) vs racks / stations / paint / cable
type B = { x0: number; x1: number; z0: number; z1: number; n: string };
const ov = (p: B, q: B) => p.x0 < q.x1 && q.x0 < p.x1 && p.z0 < q.z1 && q.z0 < p.z1;
const sts: B[] = RACKS.map((rk) => { const s = stationOf(rk.id ?? 0); return { x0: s.an.at.X - 75, x1: s.X + DESK.d / 2, z0: s.zNear, z1: s.zFar, n: `st${rk.id}` }; });
const racks: B[] = RACKS.map((rk) => ({ x0: rk.X - RACK.w / 2, x1: rk.X + RACK.w / 2, z0: rk.Z, z1: rk.Z + RACK.d, n: `rk${rk.id}` }));
const paint: B = { x0: YEAR_PAINT.x0, x1: YEAR_PAINT.x1, z0: YEAR_PAINT.z0, z1: YEAR_PAINT.z1, n: "year" };
const cx = Math.min(...CABLE_PATH.slice(2).map((p) => p[0]));
const cable: B = { x0: cx - 9, x1: cx + 9, z0: CABLE_PATH[CABLE_PATH.length - 2][1], z1: CABLE_PATH[CABLE_PATH.length - 1][1], n: "cable" };
let hits = 0;
for (let i = 0; i < sts.length; i++) {
  for (const q of [...racks, paint, cable]) if (ov(sts[i], q)) { hits++; console.log("overlap", sts[i].n, q.n); }
  for (let j = i + 1; j < sts.length; j++) if (ov(sts[i], sts[j])) { hits++; console.log("overlap", sts[i].n, sts[j].n); }
}
console.log("static station overlaps:", hits, "(stations do not move; robots type in place)");
