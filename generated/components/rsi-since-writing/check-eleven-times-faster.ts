// check-eleven-times-faster.ts — per-frame checks of ElevenTimesFaster (rsi-since-writing, cut 12).
// bun generated/components/rsi-since-writing/check-eleven-times-faster.ts
// Every frame: the camera lobes (k, cx and their steps), both faces vs the caption bands and the keep-in box, the
// pencil tips on their IK targets while drawing, the Genius's planted foot (no slide), his head vs the expert's card,
// the rows of cards vs the bands, the plates vs the keep-in and the bands, and the Genius's exit (no lingering sliver).
import { geniusAnchors } from "../rsi-ten-earths/tenEarthsGenius";
import { humanAnchors } from "./sinceWritingFolk";
import {
  CARD,
  DURATION,
  E_TICK,
  PLATES,
  plateSize,
  plateX,
  ROW,
  TICK_T,
  UP_COLS,
  XE,
  Z_CARD,
  camAt,
  worldAt,
  LO_COLS,
  colX,
  eTip,
  expertPose,
  gTip,
  gX,
  geniusPose,
  strokeTimes,
} from "./ElevenTimesFaster";

const BANDS: [number, number][] = [
  [1080, 1250],
  [1360, 1460],
];
const KEEP = { x0: 65, x1: 1015, y0: 290, y1: 1070 };
const scr = (p: [number, number], c: { k: number; cx: number; cy: number }): [number, number] => [540 + (p[0] - c.cx) * c.k, 960 + (p[1] - c.cy) * c.k];
const inBand = (y0: number, y1: number) => BANDS.some(([a, b]) => y1 > a && y0 < b);
const fails: string[] = [];
const fail = (s: string) => {
  if (fails.length < 60) fails.push(s);
};

// ---- the camera: the screen speed of the board (its middle and both ends of the AI row) per frame
let panMax = 0;
let panF = 0;
let accMax = 0;
let prevV: number[] = [];
const boardPts = [[450, -250], [colX(2), -207], [colX(12), -207]] as const;
const sp = (f: number) => {
  const { cam, W } = worldAt(f, false);
  return boardPts.map(([x, y]) => scr(W.A3.P.p(x, y, Z_CARD), cam));
};
for (let f = 1; f < DURATION; f++) {
  const a0 = sp(f - 1);
  const a1 = sp(f);
  const v = a1.map((p, i) => Math.hypot(p[0] - a0[i][0], p[1] - a0[i][1]));
  const m = Math.max(...v);
  if (m > panMax) {
    panMax = m;
    panF = f;
  }
  if (prevV.length) accMax = Math.max(accMax, ...v.map((x, i) => Math.abs(x - prevV[i])));
  prevV = v;
}
console.log(`camera: board screen speed max ${panMax.toFixed(1)} px/f (f${panF}), its change max ${accMax.toFixed(2)} px/f^2; k ${camAt(0).k.toFixed(2)} -> ${camAt(DURATION - 1).k.toFixed(2)}`);

let tipErrG = 0;
let tipErrE = 0;
let footSlide = 0;
let footF = 0;
let headCard = 999;
let sliverFrames = 0;
const headPlate: string[] = [];
const exitFrames: number[] = [];
for (let f = 0; f < DURATION; f++) {
  const { cam, W } = worldAt(f, false);
  const A = W.A3;
  // ---- the expert ----
  const e = A.P.at(XE, 0);
  const eq = expertPose(f, e.at, e.scale, A);
  const ea = humanAnchors(1, eq as never, e.at, e.scale);
  const eh = scr(ea.headC as [number, number], cam);
  const er = ea.headR * cam.k;
  const eIn = eh[0] + er > 0 && eh[0] - er < 1080;
  if (eIn && inBand(eh[1] - er, eh[1] + er)) fail(`f${f}: the expert's face in a caption band (y ${eh[1].toFixed(0)})`);
  if (eIn && eh[1] - er < KEEP.y0) fail(`f${f}: the expert's head above the keep-in`);
  // his tip on its target while writing / ticking
  const et = eTip(f);
  if (f >= 9 && f <= E_TICK[2]) {
    const tw = scr(A.P.p(et.X, et.Y, et.Z), cam);
    const ta = scr(ea.pencilTip as [number, number], cam);
    tipErrE = Math.max(tipErrE, Math.hypot(tw[0] - ta[0], tw[1] - ta[1]));
  }
  // ---- the Genius ----
  const X = gX(f);
  const g = A.P.at(X, 0);
  const gq = geniusPose(f, g.at, g.scale, A);
  const ga = geniusAnchors(3, gq as never, g.at, g.scale);
  const gh = scr(ga.headC as [number, number], cam);
  const gr = ga.headR * cam.k;
  const gIn = gh[0] + gr > 0 && gh[0] - gr < 1080;
  if (gIn && inBand(gh[1] - gr, gh[1] + gr)) fail(`f${f}: the Genius's face in a caption band`);
  // his tip on the stroke while a tick is drawn
  for (let n = 0; n < 11; n++) {
    const t = strokeTimes(n);
    if (f >= t[0] && f <= t[2]) {
      const tg = gTip(f);
      const tw = scr(A.P.p(tg.X, tg.Y, tg.Z), cam);
      const ta = scr(ga.pencilTip as [number, number], cam);
      tipErrG = Math.max(tipErrG, Math.hypot(tw[0] - ta[0], tw[1] - ta[1]));
    }
  }
  // his planted foot: the lower ankle (the stance foot) in world units, frame to frame
  if (f > 0) {
    const pA = worldAt(f - 1, false).W.A3;
    const pX = gX(f - 1);
    const pg = pA.P.at(pX, 0);
    const pq = geniusPose(f - 1, pg.at, pg.scale, pA);
    const pa = geniusAnchors(3, pq as never, pg.at, pg.scale);
    // world units of each ankle: (anchor - at) / scale + X
    const wx = (a: typeof ga, at: [number, number], sc: number, XX: number, k: "ankleL" | "ankleR") => ((a[k] as [number, number])[0] - at[0]) / sc + XX;
    const wy = (a: typeof ga, at: [number, number], sc: number, k: "ankleL" | "ankleR") => ((a[k] as [number, number])[1] - at[1]) / sc;
    for (const k of ["ankleL", "ankleR"] as const) {
      const yNow = wy(ga, g.at as [number, number], g.scale, k);
      const yPrev = wy(pa, pg.at as [number, number], pg.scale, k);
      // planted: on the floor now and before (ankle within 1.5 units of its lowest)
      if (yNow > -16.2 && yPrev > -16.2) {
        const dx = Math.abs(wx(ga, g.at as [number, number], g.scale, X, k) - wx(pa, pg.at as [number, number], pg.scale, pX, k));
        if (dx > footSlide) {
          footSlide = dx;
          footF = f;
        }
      }
    }
  }
  // his head vs the expert's first card (they must never overlap on screen)
  const c0 = scr(A.P.p(colX(UP_COLS[0]), ROW.up + CARD.h, Z_CARD), cam);
  const c1 = scr(A.P.p(colX(UP_COLS[0]) + CARD.w, ROW.up + CARD.h, Z_CARD), cam);
  const dy = gh[1] - gr - c0[1];
  if (gh[0] + gr > c0[0] && gh[0] - gr < c1[0]) headCard = Math.min(headCard, dy);
  // the exit: frames with his body straddling the right edge
  const bx0 = gh[0] - 45 * cam.k;
  const bx1 = gh[0] + 45 * cam.k;
  if (bx0 < 1080 && bx1 > 1080) {
    sliverFrames++;
    exitFrames.push(f);
  }
  // ---- the cards: every corner of both rows never in a band, inside the keep-in vertically; in the settled frame all
  // 22 cards inside the keep-in box
  for (const [r, cols] of [[ROW.up, UP_COLS], [ROW.lo, LO_COLS]] as const) {
    for (const c of cols) {
      const q = [scr(A.P.p(colX(c), r, Z_CARD), cam), scr(A.P.p(colX(c) + CARD.w, r + CARD.h, Z_CARD), cam), scr(A.P.p(colX(c), r + CARD.h, Z_CARD), cam), scr(A.P.p(colX(c) + CARD.w, r, Z_CARD), cam)];
      const xs = q.map((p) => p[0]);
      const ys = q.map((p) => p[1]);
      const vis = Math.max(...xs) > 0 && Math.min(...xs) < 1080;
      if (vis && (inBand(Math.min(...ys), Math.max(...ys)) || Math.min(...ys) < KEEP.y0 || Math.max(...ys) > KEEP.y1)) fail(`f${f}: card ${r === ROW.up ? "up" : "lo"}${c} outside the keep-in or in a band (y ${Math.min(...ys).toFixed(0)}-${Math.max(...ys).toFixed(0)})`);
      if (f >= 170 && (Math.min(...xs) < KEEP.x0 || Math.max(...xs) > KEEP.x1)) fail(`f${f}: card ${r === ROW.up ? "up" : "lo"}${c} outside the settled keep-in (x ${Math.min(...xs).toFixed(0)}-${Math.max(...xs).toFixed(0)})`);
      if (f === DURATION - 1 && (c === cols[0] || c === cols[cols.length - 1])) console.log(`  f${f} card ${r === ROW.up ? "up" : "lo"}${c}: ${(Math.max(...xs) - Math.min(...xs)).toFixed(0)} x ${(Math.max(...ys) - Math.min(...ys)).toFixed(0)} px at x ${Math.min(...xs).toFixed(0)}`);
    }
  }
  // ---- the settled frame: neither figure covers any card (bodies as the box of their anchors)
  if (f >= 168) {
    const box = (a: Record<string, unknown>) => {
      const pts = Object.entries(a).filter(([k]) => !k.endsWith("Dir")).map(([, v]) => v).filter((v): v is [number, number] => Array.isArray(v) && v.length === 2 && typeof v[0] === "number").map((p) => scr(p, cam));
      return { x0: Math.min(...pts.map((p) => p[0])) - 6, x1: Math.max(...pts.map((p) => p[0])) + 6, y0: Math.min(...pts.map((p) => p[1])) - 10, y1: Math.max(...pts.map((p) => p[1])) };
    };
    // the expert's arm passes his row on its way down from the tick (f174-180): held from f181
    const bodies = [{ n: "Genius", b: box(ga as never) }, ...(f >= E_TICK[2] + 7 ? [{ n: "expert", b: box(ea as never) }] : [])];
    // the AI's 11 cards (each with its tick) fully visible from f170: the Genius's silhouette is wider than his joint
    // anchors (shirt bulk, sleeves: measured on the f182 render, 24 px past the anchor box at a 40 px head radius),
    // so his box is widened by 0.75 head radius and tested against the whole card
    if (f >= 170) {
      const gb = box(ga as never);
      const wx = 0.75 * gr;
      let minGap = 999;
      for (const c of LO_COLS) {
        const q0 = scr(A.P.p(colX(c), ROW.lo, Z_CARD), cam);
        const q1 = scr(A.P.p(colX(c) + CARD.w, ROW.lo + CARD.h, Z_CARD), cam);
        const yHit = q1[1] > gb.y0 && q0[1] < gb.y1;
        const gap = gb.x0 - wx - q1[0];
        if (yHit && q1[0] > gb.x0 - wx && q0[0] < gb.x1 + wx) fail(`f${f}: the Genius occludes the AI's card lo${c} and its tick (by ${(q1[0] - (gb.x0 - wx)).toFixed(0)} px)`);
        if (yHit && gap >= 0) minGap = Math.min(minGap, gap);
      }
      if (f === 170 || f === DURATION - 1) console.log(`  f${f}: the Genius's silhouette clears the AI's last card by ${minGap.toFixed(0)} px (silhouette x ${(gb.x0 - wx).toFixed(0)}-${(gb.x1 + wx).toFixed(0)})`);
      if (gb.x1 + wx > KEEP.x1) fail(`f${f}: the Genius past the keep-in on the right (x ${(gb.x1 + wx).toFixed(0)})`);
    }
    for (const [r, cols, nm] of [[ROW.up, UP_COLS, "up"], [ROW.lo, LO_COLS, "lo"]] as const) {
      for (const c of cols) {
        if (nm === "up" && c === 0) continue; // his own card, his arm on it until the tick is done
        const q0 = scr(A.P.p(colX(c) + 4, r + 4, Z_CARD), cam);
        const q1 = scr(A.P.p(colX(c) + CARD.w - 4, r + CARD.h - 4, Z_CARD), cam);
        for (const { n, b } of bodies) if (q1[0] > b.x0 && q0[0] < b.x1 && q1[1] > b.y0 && q0[1] < b.y1) fail(`f${f}: the ${n} covers card ${nm}${c} (by ${Math.min(q1[0] - b.x0, b.x1 - q0[0]).toFixed(0)} px)`);
      }
    }
  }
  // ---- a figure in shot on every frame (head and feet inside the frame)
  const fIn = (h: number[], r: number) => h[0] - r > 0 && h[0] + r < 1080;
  if (!fIn(eh, er) && !fIn(gh, gr)) fail(`f${f}: no figure in shot`);
  if (f >= 136 && !fIn(gh, gr)) fail(`f${f}: the Genius's head leaves the frame`);
  // ---- the plates (text box: centre +- half the measured width, +- the cap; widths measured on f182 at 1.345) ----
  const plates = PLATES.map((p) => ({ ...p, name: p.text, t0: undefined as number | undefined }));
  for (const p of plates) {
    if (f < p.f0) continue;
    const px = plateX(p, f);
    const c = scr(A.P.p(px, p.Y, p.Z), cam);
    const s = plateSize(p, f) * W.loc(px).P.r(p.Z) * cam.k;
    const x0 = c[0] - (p.wEm * s) / 2;
    const x1 = c[0] + (p.wEm * s) / 2;
    const y0 = c[1] - 0.45 * s;
    const y1 = c[1] + 0.42 * s;
    const visible = x1 > 0 && x0 < 1080;
    if (!visible) continue;
    // the Genius's head never covers a plate's text
    if (p.t0 === undefined && gIn && f >= p.f0 && gh[0] + gr > x0 && gh[0] - gr < x1 && gh[1] + gr > y0 && gh[1] - gr < y1) headPlate.push(`${p.name}@f${f}(${(gh[1] + gr - y0).toFixed(0)}px)`);
    // "11×" stays clear of his head on every frame (a 10 px margin)
    if (p.name === "11×" && gIn && gh[0] + gr + 10 > x0 && gh[0] - gr - 10 < x1 && gh[1] + gr + 10 > y0 && gh[1] - gr - 10 < y1) fail(`f${f}: the Genius's head touches "11×"`);
    if (inBand(y0, y1)) fail(`f${f}: plate ${p.name} in a caption band (y ${y0.toFixed(0)}-${y1.toFixed(0)})`);
    if (y0 < KEEP.y0 || y1 > KEEP.y1) fail(`f${f}: plate ${p.name} outside the keep-in vertically`);
    if (f >= 170 && (x0 < KEEP.x0 || x1 > KEEP.x1)) fail(`f${f}: plate ${p.name} outside the keep-in in the settled frame (x ${x0.toFixed(0)}-${x1.toFixed(0)})`);
    if (f === DURATION - 1 || (p.name === "GDPval" && [100, 111, 124, 136].includes(f))) console.log(`  f${f} ${p.name}: font ${s.toFixed(0)} px, cap ~${(0.66 * s).toFixed(0)} px, x ${x0.toFixed(0)}-${x1.toFixed(0)}, y ${y0.toFixed(0)}-${y1.toFixed(0)}`);
  }
  if (f === DURATION - 1 || f === 0 || f === 136) console.log(`f${f}: expert ${(scr(ea.ankleL as [number, number], cam)[1] - eh[1] + er).toFixed(0)} px tall-ish, face y ${eh[1].toFixed(0)} x ${eh[0].toFixed(0)}; Genius face y ${gh[1].toFixed(0)} x ${gh[0].toFixed(0)}`);
}
console.log(`ticks at ${TICK_T.map((t) => t.toFixed(1)).join(" ")}; the expert's tick ${E_TICK[0]}-${E_TICK[2]}`);
console.log(`pencil tip vs its target: Genius max ${tipErrG.toFixed(2)} px, expert max ${tipErrE.toFixed(2)} px`);
console.log(`Genius planted-foot slide: max ${footSlide.toFixed(2)} units per frame (f${footF})`);
console.log(`Genius head vs the expert's card 0: min gap ${headCard === 999 ? "never under it" : headCard.toFixed(1) + " px"}`);
console.log(`Genius head over a plate: ${headPlate.length ? headPlate.join(" ") : "never"}`);
console.log(`Genius straddling the right edge: ${sliverFrames} frames (${exitFrames.join(",")})`);
if (headCard < 4) fail(`the Genius's head comes within ${headCard.toFixed(1)} px of the expert's card`);
if (tipErrG > 2 || tipErrE > 2) fail("a pencil tip leaves its stroke");
console.log(fails.length ? `FAIL\n${fails.join("\n")}` : "PASS");
