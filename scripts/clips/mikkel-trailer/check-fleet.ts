// Per-frame geometry checks for NewNormalFleet: every pair of airships kept apart on screen (hull ellipses + a margin),
// near ones clear of the caption bands, and how much of each is inside the frame.   bun scripts/clips/mikkel-trailer/check-fleet.ts
import { CAPTION_BANDS, H, W, depthTransform } from "../../../generated/components/mikkel-trailer/mikkelShared";
import { DURATION, FLEET, PIECES, type Ship, camAt, shipAt } from "../../../generated/components/mikkel-trailer/NewNormalFleet";

const MARGIN = 24; // screen px of clear paper wanted between two hulls
const ell = (s: Ship, f: number) => {
  const p = PIECES[s.piece];
  const t = depthTransform(camAt(f), s.d);
  const q = shipAt(s, f);
  const c = t.toScreen(q.x, q.y);
  const w = s.len * t.k;
  const h = (s.len * p.h * t.k) / p.w;
  // the photo's hull fills ~0.9 of the PNG along the axis and ~0.75 across (fins); for the turned pieces the axes swap
  const nose = ((s.flip ? 180 - p.axis : p.axis) * Math.PI) / 180;
  const vertical = Math.abs(Math.sin(nose)) > 0.7;
  const along = (vertical ? h : w) * 0.47;
  const across = (vertical ? w : h) * 0.4;
  const ang = vertical ? ((q.rot + 90) * Math.PI) / 180 : (q.rot * Math.PI) / 180;
  return { cx: c.x, cy: c.y, a: along, b: across, ang, d: s.d };
};
type E = ReturnType<typeof ell>;
const pts = (e: E, grow: number) => {
  const out: [number, number][] = [];
  for (let i = 0; i < 48; i++) {
    const t = (i / 48) * 2 * Math.PI;
    const x = (e.a + grow) * Math.cos(t);
    const y = (e.b + grow) * Math.sin(t);
    out.push([e.cx + x * Math.cos(e.ang) - y * Math.sin(e.ang), e.cy + x * Math.sin(e.ang) + y * Math.cos(e.ang)]);
  }
  return out;
};
const inside = (e: E, x: number, y: number) => {
  const dx = x - e.cx;
  const dy = y - e.cy;
  const u = dx * Math.cos(e.ang) + dy * Math.sin(e.ang);
  const v = -dx * Math.sin(e.ang) + dy * Math.cos(e.ang);
  return (u / e.a) ** 2 + (v / e.b) ** 2 <= 1;
};
const name = (i: number) => `#${i} ${FLEET[i].piece} d${FLEET[i].d} @(${FLEET[i].x},${FLEET[i].y})`;
const hits = new Map<string, number[]>();
for (let f = 0; f < DURATION; f++) {
  const es = FLEET.map((s) => ell(s, f));
  for (let i = 0; i < es.length; i++)
    for (let j = i + 1; j < es.length; j++) {
      if (pts(es[i], MARGIN).some(([x, y]) => inside(es[j], x, y)) || pts(es[j], MARGIN).some(([x, y]) => inside(es[i], x, y))) {
        const k = `${name(i)}  x  ${name(j)}`;
        hits.set(k, [...(hits.get(k) ?? []), f]);
      }
    }
}
for (const [k, fs] of hits) console.log(`OVERLAP ${k}: f${fs[0]}-f${fs[fs.length - 1]} (${fs.length} frames)`);
if (!hits.size) console.log(`no two airships within ${MARGIN} px, f0-f${DURATION - 1}`);
// near ones and the caption bands; frame coverage
FLEET.forEach((s, i) => {
  let band = 0;
  let minIn = 1;
  for (let f = 0; f < DURATION; f++) {
    const e = ell(s, f);
    const ps = pts(e, 0);
    const ys = ps.map((p) => p[1]);
    const y0 = Math.min(...ys);
    const y1 = Math.max(...ys);
    if (s.d < 1 && CAPTION_BANDS.some(([a, b]) => y1 > a && y0 < b)) band++;
    const inF = ps.filter(([x, y]) => x >= 0 && x <= W && y >= 0 && y <= H).length / ps.length;
    minIn = Math.min(minIn, inF);
  }
  const e0 = ell(s, 0);
  const e1 = ell(s, DURATION - 1);
  console.log(
    `${name(i)}: screen (${e0.cx.toFixed(0)},${e0.cy.toFixed(0)}) -> (${e1.cx.toFixed(0)},${e1.cy.toFixed(0)}), ${((e1.cx - e0.cx) / (DURATION - 1)).toFixed(2)} px/f, len ${(2 * e0.a).toFixed(0)}${band ? `, IN CAPTION BAND ${band} f` : ""}${minIn < 1 ? `, min in-frame ${(minIn * 100).toFixed(0)} %` : ""}`,
  );
});
