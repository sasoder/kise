// check-eleven-times-faster.ts — per-frame checks of ElevenTimesFaster (rsi-since-writing, cut 12).
// bun generated/components/rsi-since-writing/check-eleven-times-faster.ts
// Every frame: the camera lobes (k, cx and their steps), both faces vs the caption bands and the keep-in box, the
// pencil tips on their IK targets while drawing, the robot's planted feet (no slide), its head vs the expert's card,
// the rows of cards vs the bands, the labels (on the board plane: each text line's projected ink box and cap height)
// vs the keep-in, the bands and the figures (never covered), and in the settled frame the AI's 11 cards clear of the
// robot; "11×" clear of the robot's head and of every dust mote by 80 px from f140; from f140 the expert's hands,
// wrists and pencil tip below his chest on every frame.
import { botAnchors } from "../rsi-ten-earths/tenEarthsBot";
import { humanAnchors } from "./sinceWritingFolk";
import {
  CARD,
  DURATION,
  E_TICK,
  LABELS,
  labelBox,
  labelT,
  clipMotes,
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
  aiPose,
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
const boardPts = [[450, -250], [colX(LO_COLS[0]), ROW.lo], [colX(LO_COLS[10]), ROW.lo]] as const;
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
let moteGap = { d: 1e9, f: 0, id: "" };
let paintHead = { d: 1e9, f: 0 };
const textGap: Record<string, { d: number; f: number; by: string }> = {};
const exitFrames: number[] = [];
const handAudit: string[] = [];
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
  // round 3: from f140 (his tick done out of shot) his hands, wrists and pencil tip stay below his chest every frame
  if (f >= 140) {
    const cy = scr(ea.chest as [number, number], cam)[1];
    const parts = ["handL", "handR", "wristL", "wristR", "pencilTip"] as const;
    const ys = parts.map((k) => scr(ea[k] as [number, number], cam)[1] - cy);
    const m = Math.min(...ys);
    const xr = Math.max(...Object.values(ea).filter((v) => Array.isArray(v) && typeof v[0] === "number").map((v) => scr(v as [number, number], cam)[0]));
    handAudit.push(`f${f} ${m.toFixed(0)}${xr < 0 ? "o" : ""}`);
    if (m <= 0) fail(`f${f}: the expert's ${parts[ys.indexOf(m)]} at or above his chest (${m.toFixed(0)} px)`);
  }
  // ---- the robot ----
  const X = gX(f);
  const g = A.P.at(X, 0);
  const gq = aiPose(f, g.at, g.scale, A);
  const ga = botAnchors(4, gq as never, g.at, g.scale);
  const gh = scr(ga.headC as [number, number], cam);
  const gr = 1.25 * ga.headR * cam.k; // the head box is wider than its radius (+ ear discs)
  const gIn = gh[0] + gr > 0 && gh[0] - gr < 1080;
  if (gIn && inBand(gh[1] - gr, gh[1] + gr)) fail(`f${f}: the robot's face in a caption band`);
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
    const pq = aiPose(f - 1, pg.at, pg.scale, pA);
    const pa = botAnchors(4, pq as never, pg.at, pg.scale);
    // world units of each ankle: (anchor - at) / scale + X
    const wx = (a: typeof ga, at: [number, number], sc: number, XX: number, k: "ankleL" | "ankleR") => ((a[k] as [number, number])[0] - at[0]) / sc + XX;
    const wy = (a: typeof ga, at: [number, number], sc: number, k: "ankleL" | "ankleR") => ((a[k] as [number, number])[1] - at[1]) / sc;
    for (const k of ["ankleL", "ankleR"] as const) {
      const yNow = wy(ga, g.at as [number, number], g.scale, k);
      const yPrev = wy(pa, pg.at as [number, number], pg.scale, k);
      // planted: on the floor now and before (ankle within ~0.7 units of its lowest, -6.5)
      if (yNow > -7.2 && yPrev > -7.2) {
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
    const bodies = [{ n: "robot", b: box(ga as never) }, ...(f >= E_TICK[2] + 7 ? [{ n: "expert", b: box(ea as never) }] : [])];
    // the AI's 11 cards (each with its tick) fully visible from f170: the robot's silhouette is wider than its joint
    // anchors (the head box and its ear discs: measured on the f170/f182 renders, 18-28 px past the anchor box at a
    // 41 px head radius), so its box is widened by 0.7 head radius and tested against the whole card
    if (f >= 170) {
      const gb = box(ga as never);
      const wx = 0.7 * ga.headR * cam.k;
      let minGap = 999;
      for (const c of LO_COLS) {
        const q0 = scr(A.P.p(colX(c), ROW.lo, Z_CARD), cam);
        const q1 = scr(A.P.p(colX(c) + CARD.w, ROW.lo + CARD.h, Z_CARD), cam);
        const yHit = q1[1] > gb.y0 && q0[1] < gb.y1;
        const gap = gb.x0 - wx - q1[0];
        if (yHit && q1[0] > gb.x0 - wx && q0[0] < gb.x1 + wx) fail(`f${f}: the robot occludes the AI's card lo${c} and its tick (by ${(q1[0] - (gb.x0 - wx)).toFixed(0)} px)`);
        if (yHit && gap >= 0) minGap = Math.min(minGap, gap);
      }
      if (f === 170 || f === DURATION - 1) console.log(`  f${f}: the robot's silhouette clears the AI's last card by ${minGap.toFixed(0)} px (silhouette x ${(gb.x0 - wx).toFixed(0)}-${(gb.x1 + wx).toFixed(0)})`);
      if (gb.x1 + wx > KEEP.x1) fail(`f${f}: the robot past the keep-in on the right (x ${(gb.x1 + wx).toFixed(0)})`);
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
  if (f >= 136 && !fIn(gh, gr)) fail(`f${f}: the robot's head leaves the frame`);
  // ---- the figures as occluders (screen): head discs and limb / torso capsules from their anchors (world px)
  type Cap = { a: number[]; b: number[]; r: number; who: string };
  const P = (a: unknown) => scr(a as [number, number], cam);
  const occ: Cap[] = [];
  const limb = (who: string, pts: unknown[], r: number) => {
    for (let i = 0; i + 1 < pts.length; i++) occ.push({ a: P(pts[i]), b: P(pts[i + 1]), r, who });
  };
  {
    const k = cam.k;
    occ.push({ a: eh, b: eh, r: 1.15 * er, who: "expert head" });
    const eSh = Math.hypot(P(ea.shoulderR)[0] - P(ea.shoulderL)[0], P(ea.shoulderR)[1] - P(ea.shoulderL)[1]) / 2;
    const midS = [(P(ea.shoulderL)[0] + P(ea.shoulderR)[0]) / 2, (P(ea.shoulderL)[1] + P(ea.shoulderR)[1]) / 2];
    occ.push({ a: midS, b: P(ea.hip), r: eSh + 4, who: "expert body" });
    limb("expert arm", [ea.shoulderL, ea.wristL, ea.handL], 10 * e.scale * k);
    limb("expert arm", [ea.shoulderR, ea.wristR, ea.handR], 10 * e.scale * k);
    limb("expert leg", [ea.hip, ea.kneeL, ea.ankleL], 12 * e.scale * k);
    limb("expert leg", [ea.hip, ea.kneeR, ea.ankleR], 12 * e.scale * k);
    occ.push({ a: gh, b: gh, r: 1.35 * ga.headR * k, who: "robot head" });
    const gHem = Math.abs(P(ga.hemR)[0] - P(ga.hemL)[0]) / 2;
    occ.push({ a: P(ga.chest), b: P(ga.hip), r: gHem + 3, who: "robot body" });
    limb("robot arm", [ga.shoulderL, ga.wristL, ga.mittenL], 9 * g.scale * k);
    limb("robot arm", [ga.shoulderR, ga.wristR, ga.mittenR], 9 * g.scale * k);
  }
  const boxGap = (x0: number, x1: number, y0: number, y1: number, c: Cap) => {
    // the distance from a capsule's axis to the box, less its radius (sampled along the axis)
    let d = 1e9;
    for (let i = 0; i <= 8; i++) {
      const px = c.a[0] + ((c.b[0] - c.a[0]) * i) / 8;
      const py = c.a[1] + ((c.b[1] - c.a[1]) * i) / 8;
      d = Math.min(d, Math.hypot(Math.max(x0 - px, 0, px - x1), Math.max(y0 - py, 0, py - y1)) - c.r);
    }
    return d;
  };
  // ---- the labels: on the board plane, each text line's ink box (the measured width x the cap band) projected
  // through the turned world; the cap height on screen at each end of each line (the far end is the smaller)
  for (const lb of LABELS) {
    if (labelT(lb, f) <= 0) continue;
    const name = lb.lines.join(" ");
    const bx = labelBox(lb);
    const quad = (u0: number, u1: number, v0: number, v1: number) => [scr(A.P.p(u0, v0, bx.Z), cam), scr(A.P.p(u1, v0, bx.Z), cam), scr(A.P.p(u1, v1, bx.Z), cam), scr(A.P.p(u0, v1, bx.Z), cam)];
    const ext = (q: number[][]) => [Math.min(...q.map((c) => c[0])), Math.max(...q.map((c) => c[0])), Math.min(...q.map((c) => c[1])), Math.max(...q.map((c) => c[1]))];
    const [x0, x1, y0, y1] = ext(quad(bx.tx0, bx.tx1, bx.cy0, bx.cy1));
    let capPx = 1e9;
    let capL = 0;
    let capR = 0;
    for (const l of bx.lines) {
      const q = quad(l.x0, l.x1, l.cy0, l.cy1);
      capL = q[3][1] - q[0][1];
      capR = q[2][1] - q[1][1];
      capPx = Math.min(capPx, capL, capR);
      // the figures never cover a card label's text (wholly visible lines only: the camera crops them at the edges)
      const [lx0, lx1, ly0, ly1] = ext(q);
      if (lb.kind === "card" && lx0 > 0 && lx1 < 1080) {
        for (const c of occ) {
          const d = boxGap(lx0, lx1, ly0, ly1, c);
          const key = l.text;
          if (!textGap[key] || d < textGap[key].d) textGap[key] = { d, f, by: c.who };
          if (d < 0) fail(`f${f}: the ${c.who} covers "${l.text}" (by ${(-d).toFixed(0)} px)`);
        }
      }
    }
    const visible = x1 > 0 && x0 < 1080;
    if (!visible) continue;
    // the robot's head never over the painted part of "11×" (a 10 px margin; the paint wipes on left to right over
    // 12 frames, as LabelOnBoard draws it)
    if (lb.kind === "paint") {
      const rev = Math.min(bx.tx1, bx.x0 + (labelT(lb, f) ** 2 * (3 - 2 * labelT(lb, f))) * bx.w);
      const [px0, px1, py0, py1] = ext(quad(bx.tx0, rev, bx.cy0, bx.cy1));
      const gap = Math.hypot(Math.max(px0 - gh[0], 0, gh[0] - px1), Math.max(py0 - gh[1], 0, gh[1] - py1)) - gr;
      if (gIn && rev > bx.tx0 && gap < paintHead.d) paintHead = { d: gap, f };
      if (gIn && rev > bx.tx0 && gap < 10) fail(`f${f}: the robot's head within ${gap.toFixed(0)} px of the painted "11×"`);
    }
    if (inBand(y0, y1)) fail(`f${f}: label ${name} in a caption band (y ${y0.toFixed(0)}-${y1.toFixed(0)})`);
    if (y0 < KEEP.y0 || y1 > KEEP.y1) fail(`f${f}: label ${name} outside the keep-in vertically (y ${y0.toFixed(0)}-${y1.toFixed(0)})`);
    if (f >= 170 && (x0 < KEEP.x0 || x1 > KEEP.x1)) fail(`f${f}: label ${name} outside the keep-in in the settled frame (x ${x0.toFixed(0)}-${x1.toFixed(0)})`);
    const minCap = lb.kind === "paint" ? 45 : 34;
    if (f >= 170 && capPx < minCap) fail(`f${f}: label ${name} cap ${capPx.toFixed(0)} px < ${minCap}`);
    // no dust mote within 80 px of "11×" from f140 (the motes as drawn: the swayed view, the mid layer's odd half and
    // the near layer, which sit over the world; each mote's full radius, the soft edge included)
    if (lb.kind === "paint" && f >= 140) {
      const sw = worldAt(f, true);
      const cs = [[bx.tx0, bx.cy0], [bx.tx1, bx.cy0], [bx.tx1, bx.cy1], [bx.tx0, bx.cy1]].map(([u, w]) => scr(sw.W.A3.P.p(u, w, bx.Z), sw.cam));
      const [sx0, sx1] = [Math.min(...cs.map((c) => c[0])), Math.max(...cs.map((c) => c[0]))];
      const [sy0, sy1] = [Math.min(...cs.map((c) => c[1])), Math.max(...cs.map((c) => c[1]))];
      for (const m of [...clipMotes(sw.W.A.v, 1, 1), ...clipMotes(sw.W.A.v, 2)]) {
        const d = Math.hypot(Math.max(sx0 - m.x, 0, m.x - sx1), Math.max(sy0 - m.y, 0, m.y - sy1)) - m.r;
        if (d < moteGap.d) moteGap = { d, f, id: m.id };
        if (d < 80) fail(`f${f}: mote ${m.id} ${d.toFixed(0)} px from "11×" (x ${m.x.toFixed(0)}, y ${m.y.toFixed(0)})`);
      }
    }
    if (f === DURATION - 1 || f === 20 || f === 111) console.log(`  f${f} ${name}: cap ${capPx.toFixed(0)} px min (last line ${capL.toFixed(0)} -> ${capR.toFixed(0)}), x ${x0.toFixed(0)}-${x1.toFixed(0)}, y ${y0.toFixed(0)}-${y1.toFixed(0)}`);
  }
  if (f === DURATION - 1 || f === 0 || f === 136) console.log(`f${f}: expert ${(scr(ea.ankleL as [number, number], cam)[1] - eh[1] + er).toFixed(0)} px tall-ish, face y ${eh[1].toFixed(0)} x ${eh[0].toFixed(0)}; robot face y ${gh[1].toFixed(0)} x ${gh[0].toFixed(0)}`);
}
console.log(`ticks at ${TICK_T.map((t) => t.toFixed(1)).join(" ")}; the expert's tick ${E_TICK[0]}-${E_TICK[2]}`);
console.log(`expert hands below his chest, f140-182 (min px below the chest; o = out of shot): ${handAudit.join(" ")}`);
console.log(`pencil tip vs its target: robot max ${tipErrG.toFixed(2)} px, expert max ${tipErrE.toFixed(2)} px`);
console.log(`robot planted-foot slide: max ${footSlide.toFixed(2)} units per frame (f${footF})`);
console.log(`robot head vs the expert's card 0: min gap ${headCard === 999 ? "never under it" : headCard.toFixed(1) + " px"}`);
console.log(`robot head vs the painted "11×": min gap ${paintHead.d.toFixed(0)} px (f${paintHead.f})`);
console.log(`nearest dust mote to "11×" from f140: ${moteGap.d.toFixed(0)} px (${moteGap.id} at f${moteGap.f})`);
console.log(`label text vs the figures (min gap, px): ${Object.entries(textGap).map(([k, v]) => `${k} ${v.d.toFixed(0)} (f${v.f}, ${v.by})`).join("; ")}`);
console.log(`robot straddling the right edge: ${sliverFrames} frames (${exitFrames.join(",")})`);
if (headCard < 4) fail(`the robot's head comes within ${headCard.toFixed(1)} px of the expert's card`);
if (tipErrG > 2 || tipErrE > 2) fail("a pencil tip leaves its stroke");
console.log(fails.length ? `FAIL\n${fails.join("\n")}` : "PASS");
