// Framing check for MachinesAndOutputV4 (kyle-london, cut 42): caption bands (y 1080-1250, 1360-1460), labels cut at
// the frame edges, and the orange tip inside the frame, every frame of the camera. Prints only problems (or every
// frame with `v`). Usage: bun scripts/clips/kyle-london/check-machines-v4-framing.ts [step] [v]
const K = import.meta.dir + "/../../../generated/components/kyle-london/";
const P = await import(K + "machinesAndOutputPlanV4.ts");
const scr = (p: number[], c: any) => [540 + (p[0] - c.cx) * c.k, 960 + (p[1] - c.cy) * c.k];
const B = [[1080, 1250], [1360, 1460]];
const hits = (y0: number, y1: number) => B.some(([a, b]) => y1 > a && y0 < b);
const step = Number(process.argv[2] ?? 1);
const verbose = process.argv[3] === "v";
const LW = 110, LH = 34;
const labels = [
  { t: "1687", at: P.P1687, dx: 14, dy: 40, anchor: "start", f0: P.LABEL_F0.y1687, out: P.LABEL_1687_OUT, back: P.LABEL_1687_BACK },
  { t: "1781", at: P.A1781, dx: 14, dy: 48, anchor: "start", f0: P.LABEL_F0.y1781 },
  { t: "1900", at: P.pointAtYear(1900), dx: -24, dy: 58, anchor: "end", f0: P.LABEL_F0.y1900 },
];
// objects: [name, x0, x1, yTop, yBottom] world
const engTop = P.engineToWorld([0, -800])[1];
const objs = [
  ["astro", P.SLAB_X0, P.SLAB_X1, P.SLAB_TOP - 330, P.SLAB_TOP],
  ["astroSlab", P.SLAB_X0, P.SLAB_X1, P.SLAB_TOP, P.SLAB_TOP + P.SLAB_T],
  ["crew+engine", P.BED_WX0, P.BED_WX1, engTop, P.CREW_FEET_Y],
  ["bed", P.BED_WX0, P.BED_WX1, P.CREW_FEET_Y, P.CREW_FEET_Y + P.BED_T * P.ENGINE_S],
];
for (let g = 0; g < 336; g += step) {
  const c = P.camAtG(g);
  const issues: string[] = [];
  for (const [n, x0, x1, yt, yb] of objs as any) {
    const a = scr([x0, yt], c), b = scr([x1, yb], c);
    if (b[0] < 0 || a[0] > 1080 || b[1] < 0 || a[1] > 1920) continue;
    if (hits(a[1], b[1])) issues.push(`${n}[${a[1].toFixed(0)},${b[1].toFixed(0)}]`);
  }
  const tip = P.orangeTipYear(g);
  const pts = P.polyline(1781, tip);
  for (const p of pts) { const s = scr(p, c); if (s[0] < 0 || s[0] > 1080) { if (tip > 1782) issues.push(`orangeOff`); continue; } if (hits(s[1] - 6, s[1] + 6)) issues.push(`orange@${s[1].toFixed(0)}`); }
  for (const L of labels) {
    if (g < L.f0) continue; if ((L as any).out && g >= (L as any).out + 8 && g < (L as any).back) continue;
    const sl = (f0: number) => { const t = Math.min(1, Math.max(0, (g - f0) / 14)); const e = 1 - Math.pow(1 - t, 3); return { dy: (lb.back !== undefined && g >= lb.back ? 9.6 : 24) * (1 - e), op: Math.min(1, Math.max(0, (g - f0) / 9)) }; };
    const lb: any = L; const sd = lb.back !== undefined && g >= lb.back ? sl(lb.back) : sl(L.f0);
    if (sd.op < 0.3) continue;
    const s = scr(L.at, c); const x = s[0] + L.dx; const y = s[1] + L.dy + sd.dy;
    const x0 = L.anchor === "end" ? x - LW : L.anchor === "middle" ? x - LW / 2 : x; const x1 = x0 + LW;
    const inside = x0 >= 0 && x1 <= 1080 && y - LH >= 0 && y <= 1920; const outside = x1 <= 0 || x0 >= 1080 || y <= 0 || y - LH >= 1920;
    if (!inside && !outside) issues.push(`label${L.t}cut@${x0.toFixed(0)}`);
    if (!outside && hits(y - LH, y)) issues.push(`label${L.t}band@${y.toFixed(0)}`);
  }
  const ast = scr([P.ASTRO_X, P.SLAB_TOP], c), crew = scr([0, P.CREW_FEET_Y], c);
  if (verbose || issues.length) console.log(`g${g} k${c.k.toFixed(3)} astroFeet(${ast[0].toFixed(0)},${ast[1].toFixed(0)}) crewFeet(${crew[0].toFixed(0)},${crew[1].toFixed(0)}) ${issues.slice(0, 5).join(" ")}`);
}
// the orange tip and the nib: in frame (margin 40 px) whenever it is drawn
for (let g = P.ORANGE_RUN[0]; g < 336; g++) {
  const c = P.camAtG(g); const s = scr(P.pointAtYear(P.orangeTipYear(g)), c);
  if (s[0] < 40 || s[0] > 1040 || s[1] < 40 || s[1] > 1880) console.log(`g${g} TIP out (${s[0].toFixed(0)},${s[1].toFixed(0)})`);
}
// the 1687 label's screen position through the out/back window
for (let g = 140; g < 336; g += 4) { const c = P.camAtG(g); const s = scr(P.P1687, c); if (g < 200 || (g > 230 && g < 300)) process.stdout.write(`1687@g${g}:(${(s[0]+14).toFixed(0)},${(s[1]+40).toFixed(0)}) `); }
console.log();
