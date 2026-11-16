// PlanetsOfGeniuses (rsi-ten-earths, cut 27) per-frame checks: the building's framing along the camera path; every
// Earth's emergence (first frame = its top on the back parapet's line, inside the parapet's span while any of it is
// still hidden: no side slivers), keep-in box x 65-1015 / y 290-1070 and the caption bands once it is clear of the
// roof, screen speed, landing frames, the gaps between Earths (no two touching at rest; no overlap during flight between
// two Earths of the same rank, i.e. nothing crosses another at its own depth), and the camera's speed lobe.
// Run: bun scripts/clips/rsi-ten-earths/check-planets-of-geniuses.ts
import { DURATION, EX0, EX1, EZ0, HALL, PARA_Y, PLANETS, camAt, eyeAt, parapetAt, sceneAt, toScreen, glintsAt, glintStart } from "../../../generated/components/rsi-ten-earths/PlanetsOfGeniuses";

const issues: string[] = [];
const log: string[] = [];
const bands = (y0: number, y1: number) => (y1 > 1080 && y0 < 1250) || (y1 > 1360 && y0 < 1460);
const ROOF_Y = -(HALL.Hc + HALL.roof);

log.push("planet      Z      fe     T     land   r@settle");
for (const p of PLANETS) log.push(`${p.i} ${p.key.padEnd(4)} ${p.near ? "near" : "far "} ${p.Z.toFixed(0).padStart(5)}  ${p.fe.toFixed(1).padStart(5)}  ${p.T.toFixed(1).padStart(4)}  ${p.fl.toFixed(1).padStart(5)}  ${p.rpx}`);

const crossRank = new Set<string>();
const prev = new Map<number, { x: number; y: number }>();
for (let f = 0; f < DURATION; f++) {
  const cam = camAt(f);
  const e = eyeAt(f);
  const s = sceneAt(f);
  const pa = parapetAt(f);
  const fl = toScreen(cam, e, EX0, PARA_Y, EZ0);
  const fr = toScreen(cam, e, EX1, PARA_Y, EZ0);
  const foot = toScreen(cam, e, 0, 0, EZ0);
  const sky = toScreen(cam, e, 0, ROOF_Y - 44, 475);
  const skyB = toScreen(cam, e, 0, ROOF_Y - 44, 701);
  if (f % 8 === 0 || f === DURATION - 1)
    log.push(`f${f} D ${e.D.toFixed(0)} E ${e.E.toFixed(0)} H ${e.H.toFixed(0)} | front x ${fl[0].toFixed(0)}-${fr[0].toFixed(0)} parapetTop ${fl[1].toFixed(0)} foot ${foot[1].toFixed(0)} | back line y ${pa.y.toFixed(0)} x ${pa.x0.toFixed(0)}-${pa.x1.toFixed(0)} | skylights y ${skyB[1].toFixed(0)}-${sky[1].toFixed(0)} | n ${s.globes.length}`);
  if (fl[0] < 0 || fr[0] > 1080) issues.push(`f${f} building wider than frame`);
  for (const g of s.globes) {
    const p = PLANETS[g.i];
    const top = g.cy - g.r;
    const bot = g.cy + g.r;
    const hidden = bot > pa.y;
    if (f === Math.ceil(p.fe)) log.push(`  f${f} planet ${g.i} first frame: top ${top.toFixed(1)} vs line ${pa.y.toFixed(1)} (visible ${(pa.y - top).toFixed(1)} px)`);
    if (Math.ceil(p.fe) === f && pa.y - top > 30) issues.push(`f${f} planet ${g.i} pops: ${(pa.y - top).toFixed(0)} px already out on its first frame`);
    if (hidden && (g.cx - g.r < pa.x0 + 4 || g.cx + g.r > pa.x1 - 4)) issues.push(`f${f} planet ${g.i} partly hidden but outside the parapet span (${(g.cx - g.r).toFixed(0)}-${(g.cx + g.r).toFixed(0)} vs ${pa.x0.toFixed(0)}-${pa.x1.toFixed(0)})`);
    if (!hidden) {
      if (g.cx - g.r < 65 || g.cx + g.r > 1015 || top < 290 || bot > 1070) issues.push(`f${f} planet ${g.i} out of the keep-in box (${(g.cx - g.r).toFixed(0)}-${(g.cx + g.r).toFixed(0)}, ${top.toFixed(0)}-${bot.toFixed(0)})`);
    }
    if (bands(top, Math.min(bot, pa.y))) issues.push(`f${f} planet ${g.i} visible in a caption band`);
    const q = prev.get(g.i);
    if (q) {
      const v = Math.hypot(g.cx - q.x, g.cy - q.y);
      if (v > 42) issues.push(`f${f} planet ${g.i} fast ${v.toFixed(1)} px/f`);
    }
    prev.set(g.i, { x: g.cx, y: g.cy });
  }
  // overlaps between Earths: same rank never; across ranks only counted (a far one passing behind a near one)
  for (let a = 0; a < s.globes.length; a++)
    for (let b = a + 1; b < s.globes.length; b++) {
      const ga = s.globes[a];
      const gb = s.globes[b];
      const gap = Math.hypot(ga.cx - gb.cx, ga.cy - gb.cy) - ga.r - gb.r;
      const same = PLANETS[ga.i].near === PLANETS[gb.i].near;
      if (same && gap < 0) issues.push(`f${f} ${PLANETS[ga.i].key} and ${PLANETS[gb.i].key} (same rank) overlap ${(-gap).toFixed(0)} px`);
      if (!same && gap < 0) crossRank.add(`${PLANETS[ga.i].key}/${PLANETS[gb.i].key}`);
      if (f >= 97 && gap < 25) issues.push(`f${f} ${PLANETS[ga.i].key} and ${PLANETS[gb.i].key} gap ${gap.toFixed(0)} < 25 at rest`);
      if (f === DURATION - 1 && gap < 70) log.push(`  rest gap ${PLANETS[ga.i].key}-${PLANETS[gb.i].key} ${gap.toFixed(0)}`);
    }
  if (f === DURATION - 1 || f === 96) {
    const gs = [...s.globes].sort((a, b) => a.cx - b.cx);
    let line = `f${f} earths:`;
    for (let i = 0; i < gs.length; i++) {
      const g = gs[i];
      line += ` ${PLANETS[g.i].key}(${g.cx.toFixed(0)},${g.cy.toFixed(0)}) r${g.r.toFixed(0)}`;
    }
    log.push(line);
    const x0 = Math.min(...gs.map((g) => g.cx - g.r));
    const x1 = Math.max(...gs.map((g) => g.cx + g.r));
    const y0 = Math.min(...gs.map((g) => g.cy - g.r));
    const y1 = Math.max(...gs.map((g) => g.cy + g.r));
    log.push(`  extent x ${x0.toFixed(0)}-${x1.toFixed(0)} y ${y0.toFixed(0)}-${y1.toFixed(0)}`);
  }
}
console.log(log.join("\n"));
let cv = "camera dlnD/frame x1000:";
for (let f = 0; f < DURATION; f += 4) cv += ` ${f}:${((Math.log(eyeAt(f + 1).D) - Math.log(eyeAt(f).D)) * 1000).toFixed(2)}`;
console.log(cv);
console.log("far passing behind near during flight:", [...crossRank].join(" ") || "none");
// rev 1: the glint on "geniuses": every star (arm 0.4 r at full bloom, centred on the upper-left limb) inside the
// keep-in box and off the bands; the order left to right; the window f93-f119 and nothing outside it
{
  const starts: string[] = [];
  let first = 1e9;
  let last = -1;
  for (let f = 0; f < DURATION; f++) {
    const s = sceneAt(f);
    const gl = glintsAt(f, s.globes);
    if (gl.length) {
      first = Math.min(first, f);
      last = Math.max(last, f);
    }
    for (const g of gl) {
      const L = 0.4 * g.r * (0.35 + 0.65 * g.star);
      const x = g.cx - 0.66 * g.r;
      const y = g.cy - 0.66 * g.r;
      if (x - L < 65 || x + L > 1015 || y - L < 290 || y + L > 1070) issues.push(`f${f} glint star of ${g.i} outside the box`);
    }
  }
  const s96 = sceneAt(96);
  for (const g of [...s96.globes].sort((a, b) => a.cx - b.cx)) starts.push(`${g.i}@x${g.cx.toFixed(0)}:f${glintStart(g.cx).toFixed(1)}`);
  log.push(`glint window f${first}-f${last}; starts ${starts.join(" ")}`);
  console.log(log[log.length - 1]);
}
console.log("ISSUES", issues.length);
console.log(issues.slice(0, 60).join("\n"));
