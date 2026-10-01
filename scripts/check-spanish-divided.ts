// Numeric checks for SpanishDivided + GoingBeyondHisMission (cut 1): the camera
// (pan speed, |dv| of fixed world points, map sharpness), the framing of the
// subjects, the crowd's spacing and land, the ship (middle third; its exact
// screen box never on land while it is visible), the CORTES label (never on the
// road, the lake or Tenochtitlan; above the caption line).
//   bun scripts/check-spanish-divided.ts [--frames]
import { CORTES_ROAD, LAKE_TEXCOCO, NARVAEZ_VOYAGE_RIDE, PX_PER_KM, SITES, camScan, dotRadius, hash, landAt, mapSharpness, screenOf, swayCam, type Cam, type P2 } from "../generated/components/cortesShared";
import {
  CAM_TRACK,
  GULF,
  G_IN,
  G_LAST,
  G_SHOW,
  ROAD_S0,
  SHIP_CLEAR,
  SHIP_ROCK,
  S_ANCHOR,
  S_SHOW,
  T,
  camAt,
  cortesCapY,
  dotsAt,
  kAt,
  orangeBodyAt,
  roadHeadAt,
  routeEndAt,
  shipAt,
  swordsAnchorAt,
} from "../generated/components/spanishMotion";

const cam = (g: number): Cam => swayCam(camAt(g), g);
const f1 = (v: number) => v.toFixed(1);
let failures = 0;
const fail = (msg: string) => {
  failures++;
  console.log(`  FAIL ${msg}`);
};
// 1. per-frame table
if (process.argv.includes("--frames")) {
  for (let g = 0; g <= G_LAST; g += 3) {
    const c = CAM_TRACK[g];
    const sh = shipAt(g);
    const ss = screenOf([sh.x, sh.y], c);
    const cem = screenOf([SITES.cempoala.x, SITES.cempoala.y], c);
    const san = screenOf([SITES.santiago.x, SITES.santiago.y], c);
    const te = screenOf([SITES.tenochtitlan.x, SITES.tenochtitlan.y], c);
    const rh = screenOf(CORTES_ROAD.pointAt(roadHeadAt(g)), c);
    const ms = mapSharpness(c);
    console.log(
      `g${String(g).padStart(3)} k ${c.k.toFixed(3)} c (${f1(c.cx)}, ${f1(c.cy)}) | cem (${f1(cem[0])}, ${f1(cem[1])}) san (${f1(san[0])}, ${f1(san[1])}) ship (${f1(ss[0])}, ${f1(ss[1])}) op ${sh.op.toFixed(2)} size ${sh.size.toFixed(1)} | ten (${f1(te[0])}, ${f1(te[1])}) head (${f1(rh[0])}, ${f1(rh[1])}) | ${ms.level} ${ms.texelsPerPx.toFixed(2)}`,
    );
  }
}
// 2. camera scans
const windows: [string, number, number][] = [
  ["1a g0-84", 0, 84],
  ["1b g85-321", 85, 321],
  ["pull-back g76-124", 76, 124],
  ["follow g124-206", 124, 206],
  ["road g206-321", 206, 321],
];
const pts: [string, P2][] = [
  ["Cempoala", [SITES.cempoala.x, SITES.cempoala.y]],
  ["Santiago", [SITES.santiago.x, SITES.santiago.y]],
  ["Tenochtitlan", [SITES.tenochtitlan.x, SITES.tenochtitlan.y]],
  ["Ulua", [SITES.sanJuanDeUlua.x, SITES.sanJuanDeUlua.y]],
];
const onScreen = ([x, y]: P2, c: Cam) => {
  const [sx, sy] = screenOf([x, y], c);
  return sx > -20 && sx < 1100 && sy > -20 && sy < 1940;
};
console.log("CAMERA (authored track; the sway adds <= 0.3 px/f)");
for (const [name, a, b] of windows) {
  const s = camScan(camAt, a, b);
  const pv = pts.map(([n, p]) => {
    let maxV = 0;
    let maxVf = a;
    let maxDv = 0;
    let maxDvf = a;
    let prev: P2 | null = null;
    for (let g = a; g < b; g++) {
      const c0 = camAt(g);
      const c1 = camAt(g + 1);
      if (!onScreen(p, c0) || !onScreen(p, c1)) {
        prev = null;
        continue;
      }
      const s0 = screenOf(p, c0);
      const s1 = screenOf(p, c1);
      const v: P2 = [s1[0] - s0[0], s1[1] - s0[1]];
      const sp = Math.hypot(v[0], v[1]);
      if (sp > maxV) [maxV, maxVf] = [sp, g];
      if (prev) {
        const dv = Math.hypot(v[0] - prev[0], v[1] - prev[1]);
        if (dv > maxDv) [maxDv, maxDvf] = [dv, g];
      }
      prev = v;
    }
    return `${n} v ${f1(maxV)}@${maxVf} dv ${maxDv.toFixed(2)}@${maxDvf}`;
  });
  console.log(`  ${name.padEnd(20)} grid max ${f1(s.gridMaxV)} px/f @g${s.gridMaxVf}, |dv| ${s.gridMaxDv.toFixed(2)} @g${s.gridMaxDvf} | ${pv.join(" | ")}`);
}
let maxPan = 0;
let maxPanG = 0;
let still = 0;
const stillAt: number[] = [];
for (let g = 0; g < G_LAST; g++) {
  const a = camAt(g);
  const b = camAt(g + 1);
  const v = Math.hypot(b.cx - a.cx, b.cy - a.cy) * Math.sqrt(a.k * b.k);
  if (v > maxPan) [maxPan, maxPanG] = [v, g];
  if (v + Math.abs(Math.log(b.k / a.k)) * 900 < 0.3) {
    still++;
    stillAt.push(g);
  }
}
console.log(`  pan (frame-centre translation) max ${f1(maxPan)} px/f @g${maxPanG}${maxPan > 26 ? "  <-- over 26" : ""}`);
console.log(`  frames with camera motion < 0.3 px/f (before sway): ${still} ${stillAt.join(",")}`);
let worst = { tpp: Infinity, g: 0, level: "" };
for (let g = 0; g <= G_LAST; g++) {
  const ms = mapSharpness(cam(g));
  if (ms.texelsPerPx < worst.tpp) worst = { tpp: ms.texelsPerPx, g, level: ms.level };
}
console.log(`  map sharpness: min ${worst.tpp.toFixed(2)} texels/px @g${worst.g} (${worst.level})`);

// 3. framing: the opening crowd width, the Gulf wide
console.log("FRAMING");
{
  const g = 0;
  const c = cam(g);
  const d = dotsAt(g, c.k).map((p) => screenOf([p.x, p.y], c));
  const r = dotRadius(c.k) * c.k;
  const x0 = Math.min(...d.map((p) => p[0])) - r;
  const x1 = Math.max(...d.map((p) => p[0])) + r;
  const ys = d.map((p) => p[1]);
  console.log(`  g0: the crowd spans x ${f1(x0)}..${f1(x1)} = ${(((x1 - x0) / 1080) * 100).toFixed(1)} % of the width, centre y ${f1((Math.min(...ys) + Math.max(...ys)) / 2)} (k ${c.k.toFixed(2)})`);
  for (const gg of [40, 62, 78]) {
    const cc = cam(gg);
    const dd = dotsAt(gg, cc.k).map((p) => screenOf([p.x, p.y], cc));
    const xa = Math.min(...dd.map((p) => p[0]));
    const xb = Math.max(...dd.map((p) => p[0]));
    const coast = screenOf([166, 865], cc)[0];
    console.log(`  g${gg}: dots x ${f1(xa)}..${f1(xb)}, the coast near x ${f1(coast)} (k ${cc.k.toFixed(2)})`);
  }
  const cg = cam(118);
  const grp = dotsAt(118, cg.k).map((p) => screenOf([p.x, p.y], cg));
  const gx = grp.reduce((a, p) => a + p[0], 0) / grp.length;
  const san = screenOf([SITES.santiago.x, SITES.santiago.y], cg);
  console.log(`  g118 Gulf wide: k ${cg.k.toFixed(3)}, the Cempoala group centre x ${f1(gx)} (want 130-160), Santiago x ${f1(san[0])} y ${f1(san[1])} (want 920-950)`);
  if (gx < 130 || gx > 160) fail("the group is outside x 130-160 at g118");
  if (san[0] < 920 || san[0] > 950) fail("Santiago is outside x 920-950 at g118");
}

// 4. the ship: its exact screen box keeps SHIP_CLEAR world px off land at every frame it is seen;
//    it fades in once and out once (never dims in between, never flickers); the dashed route
//    trails it exactly and only grows; its motion is smooth; it holds the middle third in the follow
console.log("SHIP");
{
  let out3 = 0;
  let range = [Infinity, -Infinity];
  let minClear = Infinity;
  let minClearG = 0;
  let firstVis = -1;
  let lastVis = -1;
  const sizes: string[] = [];
  const seed = 1520;
  const exactBox = (g: number) => {
    const c = cam(g);
    const sh = shipAt(g);
    // the Carrack's transform: translate(x y) scale(u) translate(0 bob) rotate(rock) translate(-50 0)
    const u = sh.size / 100 / c.k;
    const bob = 1.1 * Math.sin(g * (0.105 + 0.02 * hash(seed, 5)) + 6.283 * hash(seed, 3));
    const rock = ((SHIP_ROCK * Math.sin(g * (0.083 + 0.015 * hash(seed, 6)) + 6.283 * hash(seed, 4)) + sh.pitch) * Math.PI) / 180;
    const corners: P2[] = [
      [-6.5, -81.6],
      [96, -81.6],
      [96, 6.6],
      [-6.5, 6.6],
    ].map(([lx, ly]) => {
      const x = lx - 50;
      const rx = x * Math.cos(rock) - ly * Math.sin(rock);
      const ry = x * Math.sin(rock) + ly * Math.cos(rock) + bob;
      return [sh.x + rx * u, sh.y + ry * u];
    });
    return {
      x0: Math.min(...corners.map((p) => p[0])),
      x1: Math.max(...corners.map((p) => p[0])),
      y0: Math.min(...corners.map((p) => p[1])),
      y1: Math.max(...corners.map((p) => p[1])),
    };
  };
  const landIn = (b: { x0: number; x1: number; y0: number; y1: number }, m: number) => {
    for (let y = b.y0 - m; y <= b.y1 + m + 1e-9; y += 0.5) for (let x = b.x0 - m; x <= b.x1 + m + 1e-9; x += 0.5) if (landAt(x, y)) return true;
    return false;
  };
  let opPrev = 0;
  let notMonotone = 0;
  let dimmed = 0;
  let routePrev = 0;
  let routeBack = 0;
  let routeAhead = 0;
  let maxA = 0;
  let maxAg = 0;
  for (let g = T.depart; g <= T.shipOut[1] + 4; g++) {
    const c = cam(g);
    const sh = shipAt(g);
    if (sh.op > 0.001) {
      if (firstVis < 0) firstVis = g;
      lastVis = g;
      const b = exactBox(g);
      let m = 0;
      if (landIn(b, 0)) m = -1;
      else while (m < 12 && !landIn(b, m + 0.25)) m += 0.25;
      if (m < minClear) [minClear, minClearG] = [m, g];
    }
    // one fade in, one fade out
    if (g < T.shipOut[0] ? sh.op < opPrev - 1e-9 : sh.op > opPrev + 1e-9) notMonotone++;
    if (g >= G_SHOW + 7 && g <= T.shipOut[0] && sh.op < 0.999) dimmed++;
    opPrev = sh.op;
    // the route: only grows; never ahead of the ship while it sails
    const re = routeEndAt(g, c.k);
    if (re < routePrev - 1e-6) routeBack++;
    if (g < T.ashore[0] && re > sh.s + 1e-6) routeAhead++;
    routePrev = re;
    // motion against the map (screen px / f^2)
    if (sh.op > 0.001 && g > T.depart) {
      const p0 = shipAt(g - 1);
      const p2 = shipAt(g + 1);
      const a = Math.hypot(p2.x - 2 * sh.x + p0.x, p2.y - 2 * sh.y + p0.y) * c.k;
      if (a > maxA) [maxA, maxAg] = [a, g];
    }
    if (g >= 151 && g <= T.anchor && sh.op > 0.5) {
      const [sx] = screenOf([sh.x, sh.y], c);
      range = [Math.min(range[0], sx), Math.max(range[1], sx)];
      if (sx < 360 || sx > 720) out3++;
    }
    if ([140, 150, 160, 170, 180, 190, T.anchor].includes(g)) sizes.push(`g${g} ${sh.size.toFixed(1)} px (k ${c.k.toFixed(2)})`);
  }
  const anc = NARVAEZ_VOYAGE_RIDE.pointAt(S_ANCHOR);
  console.log(
    `  shows from s ${S_SHOW.toFixed(1)} (g${G_SHOW.toFixed(1)}, ${(S_SHOW / PX_PER_KM).toFixed(0)} km out of Santiago), rides at anchor at s ${S_ANCHOR.toFixed(1)} of ${NARVAEZ_VOYAGE_RIDE.len.toFixed(1)} (${f1(anc[0] - SITES.sanJuanDeUlua.x)} world px east of San Juan de Ulua) from g${T.anchor}`,
  );
  console.log(`  visible g${firstVis}..g${lastVis}; sizes ${sizes.join(", ")}`);
  console.log(`  exact screen box: least clearance from land while visible ${minClear.toFixed(2)} world px @g${minClearG} (want >= ${SHIP_CLEAR - 1})`);
  if (minClear < SHIP_CLEAR - 1) fail(`the ship's box comes within ${minClear.toFixed(2)} world px of land while visible`);
  console.log(`  opacity: one fade in (g${G_SHOW.toFixed(1)} + 7 f), one fade out (g${T.shipOut[0]}-${T.shipOut[1]}); frames out of order ${notMonotone}, frames dimmed in between ${dimmed}`);
  if (notMonotone || dimmed) fail("the ship's opacity flickers");
  console.log(`  route: frames it shrinks ${routeBack}, frames it runs ahead of the ship ${routeAhead}; ship |a| against the map max ${maxA.toFixed(2)} px/f^2 @g${maxAg}`);
  if (routeBack || routeAhead) fail("the dashed route does not trail the ship");
  if (maxA > 4) fail("the ship turns too sharply");
  console.log(`  follow lock from g${G_IN.toFixed(1)}; ship screen x g151+ ${f1(range[0])}..${f1(range[1])}, frames outside the middle third ${out3}`);
  if (out3) fail("the ship leaves the middle third in the follow");
}

// 5. the crowd: spacing (k >= 2), land, caption band; the swords on the seam
console.log("CROWD");
{
  let minD = Infinity;
  let minG = 0;
  let sea = 0;
  let below = 0;
  for (let g = 0; g <= G_LAST; g++) {
    const c = camAt(g);
    const d = dotsAt(g, c.k);
    for (let i = 0; i < d.length; i++) {
      if (!landAt(d[i].x, d[i].y)) sea++;
      if (screenOf([d[i].x, d[i].y], c)[1] > 1150) below++;
      if (c.k < 2) continue;
      for (let j = i + 1; j < d.length; j++) {
        const q = Math.hypot(d[i].x - d[j].x, d[i].y - d[j].y);
        if (q < minD) [minD, minG] = [q, g];
      }
    }
  }
  console.log(`  min centre distance ${minD.toFixed(2)} world px @g${minG} (2r = ${(2 * dotRadius(8)).toFixed(2)} at k >= 2); dot-frames at sea ${sea}; below y1150 ${below}`);
  if (minD < 2 * dotRadius(8) - 0.05) fail("dots overlap at k >= 2");
  const sw = screenOf(swordsAnchorAt(60), camAt(60));
  console.log(`  swords anchor (the seam's top) at g60: (${f1(sw[0])}, ${f1(sw[1])})`);
}

// 6. the CORTES label: never on the drawn road, the lake or Tenochtitlan; above y1150
console.log("CORTES LABEL");
{
  const W_EST = 200; // CORTÉS, IM Fell English SC 38 px, 0.22 em tracking (~198 px measured off a render)
  const CAP = 0.66 * 38;
  const lake = LAKE_TEXCOCO as P2[];
  let worstRoad = Infinity;
  let worstRoadG = 0;
  let lakeHit = 0;
  let lowY = 0;
  for (let g = T.cortes; g <= G_LAST; g++) {
    const c = cam(g);
    const ob = orangeBodyAt(g);
    const capY = cortesCapY(g, c.k);
    const [sx, sy] = screenOf([ob.cx, capY], c);
    const box = { x0: sx - W_EST / 2, x1: sx + W_EST / 2, y0: sy, y1: sy + CAP };
    lowY = Math.max(lowY, box.y1);
    // the road drawn so far (screen polyline, stroke half-width + casing ~4 px)
    if (g >= T.road[0]) {
      const head = roadHeadAt(g);
      for (let s = ROAD_S0; s <= head; s += 0.25) {
        const [px, py] = screenOf(CORTES_ROAD.pointAt(s), c);
        const dx = Math.max(box.x0 - px, 0, px - box.x1);
        const dy = Math.max(box.y0 - py, 0, py - box.y1);
        const d = Math.hypot(dx, dy) - 4;
        if (d < worstRoad) [worstRoad, worstRoadG] = [d, g];
      }
    }
    for (const p of [...lake, [SITES.tenochtitlan.x, SITES.tenochtitlan.y] as P2]) {
      const [px, py] = screenOf(p, c);
      if (px > box.x0 - 6 && px < box.x1 + 6 && py > box.y0 - 6 && py < box.y1 + 6) {
        lakeHit++;
        break;
      }
    }
  }
  console.log(`  nearest the drawn road comes to the label box: ${f1(worstRoad)} px @g${worstRoadG}; frames on the lake / Tenochtitlan: ${lakeHit}; lowest label edge y ${f1(lowY)}`);
  if (worstRoad < 0) fail("the CORTES label touches the road");
  if (lakeHit) fail("the CORTES label sits on the lake or Tenochtitlan");
  if (lowY > 1150) fail("the CORTES label goes below y1150");
  const ob = orangeBodyAt(T.cortes + 10);
  const c = cam(T.cortes + 10);
  const gap = (cortesCapY(T.cortes + 10, c.k) - ob.bottom) * c.k;
  const cEnd = cam(G_LAST);
  const gapEnd = (cortesCapY(G_LAST, cEnd.k) - orangeBodyAt(G_LAST).bottom) * cEnd.k;
  console.log(`  gap under the orange body: ${f1(gap)} px at g${T.cortes + 10} (k ${c.k.toFixed(2)}), ${f1(gapEnd)} px at g${G_LAST} (k ${cEnd.k.toFixed(2)})`);
}
console.log(`GULF targets: k ${GULF.k}, cx ${f1(GULF.cx)}, group x ${f1(GULF.groupX)}; k(118) ${kAt(118).toFixed(3)}`);
console.log(failures ? `${failures} check(s) FAILED` : "all checks passed");
