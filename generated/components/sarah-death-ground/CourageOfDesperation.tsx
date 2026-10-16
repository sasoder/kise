// ---------------------------------------------------------------------------
// CourageOfDesperation (file 5_CourageOfDesperation; Sarah Paine, "Death
// ground: why regime change is brutal"). Dwarkesh map style, the umber page
// (no map): engraved figures, side elevation. Opaque 1080x1920, 24 fps. No text.
//
// CHECK LINE: "Death ground is a strip of land with no way out - deep water
// behind, sheer cliffs above, the enemy in front - so the army survives only by
// fighting its way forward."
//
// THE MOTION (one move): it opens close on the ORANGE army in ranks, ge
// upright, on a narrow bank, the rear rank's heels at the brink with a river
// behind and below them and a sheer hachured cliff over them. One continuous
// pull-back and drift right shows the whole trap while the CREAM enemy marches
// in from the right edge and halts across the only open side (f~38). A ripple
// runs through the orange ranks front to back (ge levelled), they charge into
// the cream line and keep driving it back to the last frame: the cream front
// rank recoils and steps back again and again, the ranks behind give ground,
// and the orange advance carries them away from the brink so the water behind
// them opens up; from ~f72 the camera pushes in (+23%) on the clash, kept near
// the frame's centre. Orange = the trapped army (on death ground); cream = the
// enemy. The river's current drifts slowly downstream (left to right).
// BEATS: f0 close on the orange (~670 px tall), heels at the brink · f~20 the
//   cream front rank crosses the right edge · f38 it halts: the trap is complete
//   · f37-58 the levelling ripple (front rank first, one step into guard; the
//   ranks behind slide their grip up the shaft so every point reaches the front)
//   · f50 the charge (short quick steps) · f58-61 the tips meet the cream shafts
//   in all four files ("courage" 61) · f61-103 the drive: the cream front rank
//   is driven back ~180 px in backward steps and still going on the last frame,
//   the ranks behind give ~165 / 145 / 120 px; the orange rear leaves the brink
//   by ~210 px (the gap is in frame f60-84) · f72-103 the push-in.
// HOW: the cast is dgFigures' Soldier (read-only); every cream man's push is
//   driven by the actual orange ge tip (dgAnchors) on his shaft, so the contact
//   is exact; the legs run / walk / step with the distance covered (no slide).
//
// DURATION: sequence 5.125-9.458 s = 4.333 s x 24 = 104 frames (frames
// 123-227 of the sequence); it fills a disabled clip, no tail.
// WORD -> FRAME: Ground 0 · in 5 · which 9 · the 11 · army 14 · survives 18 ·
//   only 29 · if 38 · it 42 · fights 45 · with 53 · courage 61 · of 69 ·
//   desperation 73 · is 85 · called 90 · death 95 · (cut at 104).
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { ACCENT, ACCENT_DEEP, DARK, INK, LAND, SEA, hash, mixColor, smootherstep, smoothstep, type Cam } from "../kits/maps/incaShared";
import { CREAM, FPS, GRIP_AT, ORANGE, POSES, RUN, Soldier, dgAnchors, idle, lerpFig, onShaft, runLegs, shadeInk, track, type ArmPose, type FigPose, type Ink } from "./dgFigures";
import { TexcocoPage, WorldSvg, makeCamera, walkPose, type P2 } from "../kits/maps/texcocoShared";

export { FPS };
export const DURATION = 104;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const P = (v: P2) => `${v[0].toFixed(1)},${v[1].toFixed(1)}`;
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const mixN = (a: number, b: number, t: number) => a + (b - a) * t;
const mix2 = (a: P2, b: P2, t: number): P2 => [mixN(a[0], b[0], t), mixN(a[1], b[1], t)];

// ---------------------------------------------------------------------------
// THE GROUND (world px). A gorge seen from the side: a sheer cliff behind, a
// narrow bank at its foot, deep water to the left of the bank and below it;
// open only to the right.
// ---------------------------------------------------------------------------
/** the cliff's foot = the bank's back edge; the bank's front lip; the water under them */
const FOOT_Y = 1092;
const LIP_Y = 1238;
const WATER_FRONT = 1272;
const WATER_BACK = 1116;
/** the bank's left end (the brink the rear rank stands on): x at its back and front edges */
const EDGE_BACK = 178;
const EDGE_FRONT = 146;
const edgeX = (y: number) => EDGE_BACK + ((EDGE_FRONT - EDGE_BACK) * (y - FOOT_Y)) / (LIP_Y - FOOT_Y);
const X_MIN = -700;
const X_MAX = 2400;

const CLIFF_FILL = "#2C251C";
const CLIFF_DEEP = "#211B14";
const BANK_TOP = "#4B3E2E";
const BANK_FACE = "#2A2219";
const STROKE = { fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

/** the cliff's lip: a broken skyline */
const cliffTop = (x: number) => 196 + 84 * Math.sin(x / 300 + 0.6) + 40 * Math.sin(x / 117 + 2.1) + 14 * Math.sin(x / 41 + 0.3);
const CLIFF = (() => {
  const top: P2[] = [];
  for (let x = X_MIN, i = 0; x <= X_MAX; x += 12, i++) top.push([x, cliffTop(x) + (hash(i, 31) - 0.5) * 10]);
  const outline = `M${top.map(P).join("L")}L${X_MAX},${WATER_BACK + 6}L${X_MIN},${WATER_BACK + 6}Z`;
  const lip = `M${top.map(P).join("L")}`;
  const inside = (x: number, y: number) => y > cliffTop(x) + 12 && y < WATER_BACK - 6;
  // hachures hanging from the lip
  let hang = "";
  for (let x = X_MIN + 3, i = 0; x < X_MAX; x += 6, i++) {
    const xx = x + (hash(i, 41) - 0.5) * 2.5;
    const L = 14 + 64 * hash(i, 42) * hash(i, 43);
    hang += `M${xx.toFixed(1)},${(cliffTop(xx) + 5).toFixed(1)}l${((hash(i, 45) - 0.5) * 2).toFixed(1)},${L.toFixed(1)}`;
  }
  // lit facets: patches of steep cream hatching, ragged at both ends
  let facet = "";
  for (let i = 0; i < 150; i++) {
    const cx = X_MIN + (X_MAX - X_MIN) * hash(i, 401);
    const cy = mixN(cliffTop(cx) + 60, WATER_BACK - 90, hash(i, 402));
    const w = 40 + 110 * hash(i, 403);
    const h = 70 + 200 * hash(i, 404);
    const ang = ((hash(i, 405) - 0.5) * 30 * Math.PI) / 180;
    const dx = Math.sin(ang);
    for (let o = -w / 2, n = 0; o < w / 2; o += 5 + 2 * hash(n, i + 406), n++) {
      const rag = 1 - Math.pow(Math.abs(o) / (w / 2), 2);
      const L = h * (0.35 + 0.65 * rag) * (0.6 + 0.4 * hash(n, i + 407));
      const y0 = cy - L / 2 + (hash(n, i + 408) - 0.5) * 20;
      const x0 = cx + o - (dx * L) / 2;
      if (!inside(x0, y0) || !inside(x0 + dx * L, y0 + L)) continue;
      facet += `M${x0.toFixed(1)},${y0.toFixed(1)}l${(dx * L).toFixed(1)},${L.toFixed(1)}`;
    }
  }
  // fissures: wavering, tilted, some branching; a shadow hatch along their left side
  let fiss = "";
  let shade = "";
  for (let i = 0; i < 230; i++) {
    let x = X_MIN + (X_MAX - X_MIN) * hash(i, 411);
    let y = mixN(cliffTop(x) + 14, WATER_BACK - 60, hash(i, 412) * hash(i, 412));
    const len = 60 + 300 * hash(i, 413);
    const ang = ((hash(i, 414) - 0.5) * (hash(i, 415) < 0.7 ? 34 : 80) * Math.PI) / 180;
    const steps = Math.max(3, Math.round(len / 22));
    let d = `M${x.toFixed(1)},${y.toFixed(1)}`;
    const pts: P2[] = [[x, y]];
    for (let s = 1; s <= steps; s++) {
      const a = ang + (hash(i * 13 + s, 416) - 0.5) * 0.7;
      x += Math.sin(a) * (len / steps);
      y += Math.cos(a) * (len / steps);
      if (!inside(x, y)) break;
      d += `L${x.toFixed(1)},${y.toFixed(1)}`;
      pts.push([x, y]);
    }
    if (pts.length < 2) continue;
    fiss += d;
    const n = 1 + Math.floor(4 * hash(i, 417));
    for (let o = 1; o <= n; o++) {
      const off = -3.5 * o;
      const k0 = Math.floor((pts.length - 1) * 0.1 * o);
      const seg = pts.slice(k0, Math.max(k0 + 2, pts.length - o));
      if (seg.length < 2) continue;
      shade += `M${seg.map(([px, py]) => `${(px + off).toFixed(1)},${(py + 2 * o).toFixed(1)}`).join("L")}`;
    }
  }
  // ledges: short sloping breaks with a lit top and light hanging under them
  let ledge = "";
  let ledgeLit = "";
  let hangFaint = "";
  for (let i = 0; i < 130; i++) {
    const x0 = X_MIN + (X_MAX - X_MIN) * hash(i, 421);
    const y0 = mixN(cliffTop(x0) + 50, WATER_BACK - 30, hash(i, 422));
    const L = 40 + 110 * hash(i, 423) * hash(i, 424);
    const sl = (hash(i, 425) - 0.5) * 0.16;
    if (!inside(x0, y0) || !inside(x0 + L, y0 + L * sl)) continue;
    ledge += `M${x0.toFixed(1)},${y0.toFixed(1)}l${(L * 0.5).toFixed(1)},${(L * 0.5 * sl + (hash(i, 426) - 0.5) * 4).toFixed(1)}L${(x0 + L).toFixed(1)},${(y0 + L * sl).toFixed(1)}`;
    ledgeLit += `M${(x0 + 2).toFixed(1)},${(y0 - 2.6).toFixed(1)}l${(L - 5).toFixed(1)},${((L - 5) * sl).toFixed(1)}`;
    for (let hx = 3, n = 0; hx < L - 3; hx += 5 + 3 * hash(n, i + 427), n++) {
      const hl = 6 + 22 * hash(n, i + 428) * hash(n, i + 429);
      hangFaint += `M${(x0 + hx).toFixed(1)},${(y0 + 4 + hx * sl).toFixed(1)}l${((hash(n, i + 430) - 0.5) * 1.5).toFixed(1)},${hl.toFixed(1)}`;
    }
  }
  // the deep shadow at the cliff's foot
  let foot = "";
  for (let fx = X_MIN, i = 0; fx < X_MAX; fx += 4.5, i++) foot += `M${fx.toFixed(1)},${(WATER_BACK - 50 - 60 * hash(i, 81)).toFixed(1)}L${(fx + 1).toFixed(1)},${(WATER_BACK + 4).toFixed(1)}`;
  return { outline, lip, hang, facet, fiss, shade, ledge, ledgeLit, hangFaint, foot };
})();

const Cliff: React.FC = () => (
  <g>
    <path d={CLIFF.outline} fill={CLIFF_FILL} />
    <path d={CLIFF.facet} stroke={INK} strokeOpacity={0.11} strokeWidth={1.4} {...STROKE} />
    <path d={CLIFF.foot} stroke={DARK} strokeOpacity={0.3} strokeWidth={2} {...STROKE} />
    <path d={CLIFF.hangFaint} stroke={INK} strokeOpacity={0.24} strokeWidth={1.4} {...STROKE} />
    <path d={CLIFF.shade} stroke={DARK} strokeOpacity={0.45} strokeWidth={1.7} {...STROKE} />
    <path d={CLIFF.fiss} stroke={DARK} strokeOpacity={0.85} strokeWidth={2.3} {...STROKE} />
    <path d={CLIFF.ledgeLit} stroke={INK} strokeOpacity={0.26} strokeWidth={1.5} {...STROKE} />
    <path d={CLIFF.ledge} stroke={DARK} strokeOpacity={0.7} strokeWidth={2.1} {...STROKE} />
    <path d={CLIFF.hang} stroke={INK} strokeOpacity={0.4} strokeWidth={1.6} {...STROKE} />
    {/* the lip: a firm dark edge and a cream light along it */}
    <path d={CLIFF.lip} stroke={DARK} strokeWidth={4} {...STROKE} />
    <path d={CLIFF.lip} stroke={INK} strokeOpacity={0.62} strokeWidth={1.8} transform="translate(0 3)" {...STROKE} />
  </g>
);

// ---- the river: engraved current lines in world space, drifting downstream (left to right), crests near the bank
/** the current's pattern repeats every RIVER_P world px, so its drift wraps without a seam */
const RIVER_P = 640;
type RiverRow = { d: string; crest: string; o: number; w: number; v: number };
const RIVER: RiverRow[] = (() => {
  const rows: RiverRow[] = [];
  const k0 = Math.floor((X_MIN - RIVER_P) / RIVER_P);
  for (let r = 0; ; r++) {
    const y = WATER_BACK + 6 + 7 * r + 0.3 * r * r;
    if (y > 2300) break;
    const near = c01((y - WATER_BACK) / 650);
    // one period of the row: long current strokes, each a gentle swell
    const dashes: { x: number; L: number; a: number; dy: number }[] = [];
    let x = 30 * hash(r, 91);
    for (let i = 0; ; i++) {
      const L = (34 + 150 * hash(i + r * 57, 92) * hash(i + r * 57, 89)) * (0.7 + 1.2 * near);
      if (x + L > RIVER_P - 8) break;
      dashes.push({ x, L, a: (1 + 2.6 * near) * (hash(i + r * 57, 94) < 0.5 ? 1 : -1), dy: (hash(i, r + 95) - 0.5) * 2.5 });
      x += L + (8 + 34 * hash(i + r * 57, 93)) * (0.8 + 1.1 * near);
    }
    // crests: short bright curls in the rows just below the bank, where the current breaks along it
    const crests: { x: number; s: number }[] = [];
    const nCrest = y > WATER_FRONT + 4 && y < WATER_FRONT + 100 ? 10 : y > WATER_FRONT + 100 ? 3 : 0;
    for (let i = 0; i < nCrest; i++) if (hash(i + r * 13, 97) < (nCrest > 3 ? 0.5 : 0.35)) crests.push({ x: RIVER_P * hash(i + r * 13, 98), s: (5 + 7 * hash(i + r * 13, 99)) * (0.8 + near) });
    let d = "";
    let crest = "";
    for (let k = k0; k * RIVER_P < X_MAX + RIVER_P; k++) {
      for (const q of dashes) {
        const xx = k * RIVER_P + q.x;
        d += `M${xx.toFixed(1)},${(y + q.dy).toFixed(1)}q${(q.L / 4).toFixed(1)},${(-q.a).toFixed(1)} ${(q.L / 2).toFixed(1)},0t${(q.L / 2).toFixed(1)},0`;
      }
      for (const c of crests) {
        const xx = k * RIVER_P + c.x;
        crest += `M${xx.toFixed(1)},${(y - 1).toFixed(1)}q${(c.s * 0.7).toFixed(1)},${(-c.s * 0.6).toFixed(1)} ${(c.s * 1.7).toFixed(1)},${(-c.s * 0.12).toFixed(1)}q${(-c.s * 0.35).toFixed(1)},${(c.s * 0.05).toFixed(1)} ${(-c.s * 0.55).toFixed(1)},${(c.s * 0.32).toFixed(1)}`;
      }
    }
    const bright = hash(r, 96) < 0.2 ? 1.7 : 1;
    rows.push({ d, crest, o: Math.min(0.46, (0.15 + 0.17 * near) * (0.75 + 0.5 * hash(r, 100)) * bright), w: 1.3 + 1.0 * near, v: 0.3 + 0.9 * near });
  }
  return rows;
})();

// ---- the bank: a ragged, bulging lip, a crumbling brink at its left end
const lipY = (x: number) => LIP_Y + 6 * Math.sin(x / 97 + 1) + 2.6 * Math.sin(x / 31) + 1.2 * Math.sin(x / 8.7);
const shoreY = (x: number) => WATER_FRONT + 5 * Math.sin(x / 71 + 2) + 2 * Math.sin(x / 19) + 1 * Math.sin(x / 7.1);
/** the brink, back to front (ragged), and the rise to the water under each point */
const BRINK: P2[] = Array.from({ length: 13 }, (_, i) => {
  const t = i / 12;
  const y = mixN(FOOT_Y, LIP_Y, t);
  return [edgeX(y) + (i === 0 || i === 12 ? 0 : (hash(i, 131) - 0.5) * 6) + 3 * Math.sin(t * 7), y];
});
const riseAt = (y: number) => mixN(WATER_BACK - FOOT_Y, WATER_FRONT - LIP_Y, (y - FOOT_Y) / (LIP_Y - FOOT_Y));
const BANK = (() => {
  const lipPts: P2[] = [];
  const shorePts: P2[] = [];
  for (let x = EDGE_FRONT; x <= X_MAX; x += 9) {
    lipPts.push([x, lipY(x)]);
    shorePts.push([x, shoreY(x)]);
  }
  const top = `M${BRINK.map(P).join("L")}L${lipPts.map(P).join("L")}L${X_MAX},${FOOT_Y}Z`;
  const face = `M${lipPts.map(P).join("L")}L${shorePts
    .slice()
    .reverse()
    .map(P)
    .join("L")}L${EDGE_FRONT - 5},${WATER_FRONT}Z`;
  const endBottom = BRINK.map(([x, y]): P2 => [x - 6 - 2 * hash(y, 141), y + riseAt(y)]);
  const end = `M${BRINK.map(P).join("L")}L${endBottom.slice().reverse().map(P).join("L")}Z`;
  // the ground: broken strokes, closer together toward the cliff
  let ground = "";
  for (let r = 0; r < 10; r++) {
    const y = FOOT_Y + 8 + (LIP_Y - FOOT_Y - 14) * Math.pow(r / 9, 1.3);
    let x = edgeX(y) + 12 + 26 * hash(r, 101);
    for (let i = 0; x < X_MAX; i++) {
      const L = (10 + 34 * hash(i + r * 77, 102)) * (0.8 + 0.5 * (r / 9));
      ground += `M${x.toFixed(1)},${(y + (hash(i, r + 103) - 0.5) * 3).toFixed(1)}l${L.toFixed(1)},${((hash(i, r + 104) - 0.5) * 1.5).toFixed(1)}`;
      x += L + 12 + 42 * hash(i + r * 77, 105);
    }
  }
  // the face: vertical strokes of earth; the end: strokes down its slope
  let faceH = "";
  for (let x = EDGE_FRONT + 3, i = 0; x < X_MAX; x += 4.5 + 3 * hash(i, 113), i++) {
    const y0 = lipY(x) + 3 + 3 * hash(i, 111);
    faceH += `M${x.toFixed(1)},${y0.toFixed(1)}l${((hash(i, 114) - 0.5) * 2).toFixed(1)},${((shoreY(x) - y0 - 3) * (0.35 + 0.6 * hash(i, 112))).toFixed(1)}`;
  }
  let endH = "";
  for (let i = 1; i < BRINK.length - 1; i++) {
    for (let o = 0; o < 2; o++) {
      const a = mix2(BRINK[i], BRINK[i + 1], 0.5 * o);
      endH += `M${P([a[0] - 1.5, a[1] + 3])}l${(-3 - 2 * hash(i, o + 151)).toFixed(1)},${(riseAt(a[1]) * (0.5 + 0.4 * hash(i, o + 152))).toFixed(1)}`;
    }
  }
  // the cliff's shadow across the back of the bank
  let shadow = "";
  for (let x = EDGE_BACK, i = 0; x < X_MAX; x += 4.5, i++) shadow += `M${x.toFixed(1)},${FOOT_Y + 1}l${(-2 - 3 * hash(i, 121)).toFixed(1)},${(8 + 20 * hash(i, 122)).toFixed(1)}`;
  // stones at the waterline
  const stones: { c: P2; rx: number; ry: number }[] = [];
  for (let i = 0; i < 70; i++) {
    const x = EDGE_FRONT + 20 + i * 34 + 20 * hash(i, 161);
    if (hash(i, 162) < 0.4) continue;
    const big = hash(i, 167) < 0.22;
    stones.push({ c: [x, shoreY(x) + (big ? 3 : -2)], rx: big ? 12 + 7 * hash(i, 163) : 4 + 6 * hash(i, 163), ry: big ? 7 + 3 * hash(i, 164) : 3 + 3 * hash(i, 164) });
  }
  for (let i = 2; i < BRINK.length; i += 3) {
    const b = endBottom[i];
    stones.push({ c: [b[0] - 2, b[1] - 2], rx: 4 + 4 * hash(i, 165), ry: 3 + 2 * hash(i, 166) });
  }
  // reed clumps standing in the shallows at the foot of the bank, and grass hanging over its lip
  let reeds = "";
  let reedsDark = "";
  for (let i = 0; i < 26; i++) {
    const x = EDGE_FRONT + 40 + i * 92 + 50 * hash(i, 181);
    if (hash(i, 182) < 0.3) continue;
    const base = shoreY(x) + 6;
    const n = 4 + Math.floor(5 * hash(i, 183));
    for (let k = 0; k < n; k++) {
      const bx = x + (k - n / 2) * 4.5 + (hash(k, i + 184) - 0.5) * 3;
      const h = 22 + 34 * hash(k, i + 185);
      const lean = (hash(k, i + 186) - 0.4) * 18;
      const seg = `M${bx.toFixed(1)},${base.toFixed(1)}q${(lean * 0.3).toFixed(1)},${(-h * 0.6).toFixed(1)} ${lean.toFixed(1)},${(-h).toFixed(1)}`;
      reedsDark += seg;
      reeds += seg;
    }
  }
  let fringe = "";
  for (let x = EDGE_FRONT + 6, i = 0; x < X_MAX; x += 5 + 6 * hash(i, 191), i++) {
    if (hash(i, 192) < 0.35) continue;
    const y = lipY(x) - 1;
    fringe += `M${x.toFixed(1)},${y.toFixed(1)}q${(2 + 3 * hash(i, 193)).toFixed(1)},${(5 + 4 * hash(i, 194)).toFixed(1)} ${(1 + 4 * hash(i, 195)).toFixed(1)},${(9 + 10 * hash(i, 196)).toFixed(1)}`;
  }
  return { top, face, end, ground, faceH, endH, shadow, stones, reeds, reedsDark, fringe, lip: `M${BRINK.map(P).join("L")}L${lipPts.map(P).join("L")}`, endBottom };
})();
/** the bank's waterline, offset d out into the water (to the left of the end, below the face) */
const shoreLine = (d: number) => {
  const pts: P2[] = [];
  for (let x = EDGE_FRONT - 6 - d * 0.9; x <= X_MAX; x += 12) pts.push([x, shoreY(Math.max(EDGE_FRONT, x)) + d]);
  return `M${pts.map(P).join("L")}`;
};
/** where the water meets the bank's left end: short level laps along its foot, longer and fainter further out */
const LAPS = BANK.endBottom.slice(1).flatMap(([x, y], i) =>
  [0, 1, 2].map((o) => {
    const L = (10 + 16 * hash(i * 3 + o, 171)) * (1 + 0.5 * o);
    const x1 = x - 5 - o * 15 - 6 * hash(i * 3 + o, 172);
    return { d: `M${x1.toFixed(1)},${(y + 1).toFixed(1)}l${(-L).toFixed(1)},0`, o: [0.5, 0.32, 0.18][o], ph: i * 0.9 + o * 1.7 };
  }),
);

const Water: React.FC<{ f: number }> = ({ f }) => (
  <g>
    <rect x={X_MIN} y={WATER_BACK} width={X_MAX - X_MIN} height={2400 - WATER_BACK} fill={SEA} />
    {RIVER.map((r, i) => (
      <g key={i} transform={`translate(${((r.v * f) % RIVER_P).toFixed(2)} 0)`}>
        <path d={r.d} stroke={INK} strokeOpacity={r.o} strokeWidth={r.w} {...STROKE} />
        {r.crest ? <path d={r.crest} stroke={INK} strokeOpacity={0.5} strokeWidth={1.6} {...STROKE} /> : null}
      </g>
    ))}
  </g>
);
/** the lines round the bank, fading outward; they lap a little (drawn after the bank) */
const ShoreLines: React.FC<{ f: number }> = ({ f }) => (
  <g>
    {[6, 14, 24, 37].map((d, i) => (
      <path
        key={i}
        d={shoreLine(d + 1.5 * Math.sin(f / 13 + i * 1.3))}
        stroke={INK}
        strokeOpacity={[0.5, 0.36, 0.24, 0.14][i]}
        strokeWidth={1.8 - 0.2 * i}
        strokeDasharray={i === 0 ? undefined : `${26 + 10 * i} ${7 + 5 * i}`}
        {...STROKE}
      />
    ))}
    {LAPS.map((l, i) => (
      <path key={`l${i}`} d={l.d} transform={`translate(${(-2 * (1 + Math.sin(f / 13 + l.ph))).toFixed(2)} 0)`} stroke={INK} strokeOpacity={l.o} strokeWidth={1.6} {...STROKE} />
    ))}
  </g>
);

const Bank: React.FC = () => (
  <g>
    <path d={BANK.end} fill={CLIFF_DEEP} stroke={DARK} strokeWidth={2.4} strokeLinejoin="round" />
    <path d={BANK.endH} stroke={INK} strokeOpacity={0.3} strokeWidth={1.3} {...STROKE} />
    <path d={BANK.face} fill={BANK_FACE} stroke={DARK} strokeWidth={2.4} strokeLinejoin="round" />
    <path d={BANK.faceH} stroke={INK} strokeOpacity={0.24} strokeWidth={1.3} {...STROKE} />
    <path d={BANK.top} fill={BANK_TOP} stroke={DARK} strokeWidth={2.6} strokeLinejoin="round" />
    <path d={BANK.ground} stroke={INK} strokeOpacity={0.22} strokeWidth={1.5} {...STROKE} />
    <path d={BANK.shadow} stroke={DARK} strokeOpacity={0.45} strokeWidth={1.8} {...STROKE} />
    {BANK.stones.map((s, i) => (
      <g key={i}>
        <ellipse cx={s.c[0]} cy={s.c[1]} rx={s.rx} ry={s.ry} fill={BANK_FACE} stroke={DARK} strokeWidth={1.8} />
        <path d={`M${(s.c[0] - s.rx * 0.6).toFixed(1)},${(s.c[1] - s.ry * 0.35).toFixed(1)}q${(s.rx * 0.5).toFixed(1)},${(-s.ry * 0.5).toFixed(1)} ${(s.rx * 1.1).toFixed(1)},${(-s.ry * 0.2).toFixed(1)}`} stroke={INK} strokeOpacity={0.45} strokeWidth={1.2} {...STROKE} />
      </g>
    ))}
    {/* the brink and the lip, lit, grass hanging over it */}
    <path d={BANK.lip} stroke={INK} strokeOpacity={0.6} strokeWidth={2} transform="translate(1.5 -1.5)" {...STROKE} />
    <path d={BANK.fringe} stroke={INK} strokeOpacity={0.42} strokeWidth={1.4} {...STROKE} />
    {/* the reeds in the shallows */}
    <path d={BANK.reedsDark} stroke={DARK} strokeWidth={3.6} {...STROKE} />
    <path d={BANK.reeds} stroke={INK} strokeOpacity={0.62} strokeWidth={1.5} {...STROKE} />
  </g>
);

// ---------------------------------------------------------------------------
// THE FIGURES: dgFigures' Soldier (the module draws his ge). Figure-local
// units, a man ~310 tall; dir 1 = facing right.
// ---------------------------------------------------------------------------
const CARRY = POSES.carry(1);
const GUARD_0 = POSES.guard(1);
/** the hedge stance reached with ONE step: the rear foot stays planted, the front foot steps forward */
const GUARD: FigPose = { ...GUARD_0, footL: CARRY.footL, footR: [CARRY.footR[0] + 46, 0] };
/** the charge's body without its running legs (they are laid on with the distance covered) */
const CHARGE_BODY: FigPose = (() => {
  const q = POSES.charge(1, 0);
  return { ...q, crouch: q.crouch - 11, lean: q.lean - 3, footL: GUARD.footL, footR: GUARD.footR, liftL: GUARD.liftL, liftR: GUARD.liftR, hem: q.hem + 4 };
})();
/** pressing in: leaning into the shafts, the feet wide */
const PRESS: FigPose = { ...GUARD_0, lean: GUARD_0.lean + 7, crouch: GUARD_0.crouch + 5, brow: 1, mouth: -0.6, footL: [-30, 0], footR: [34, 0] };
const C_CARRY = POSES.carry(-1);
const C_RECOIL = POSES.recoil(-1);
/** where the cream man's upright shaft stands in front of him (units, his feet at 0): the orange tips meet it here */
const MEET_OFF = dgAnchors("soldier", C_CARRY, [0, 0], 1).grip[0] - 6;
/** the near (rear) fist's grip runs along the shaft this far to the far fist in the two-handed poses */
const ALONG = 104;
const lerpArm = (a: ArmPose, b: ArmPose, t: number): ArmPose => ({ w: mix2(a.w, b.w, t), elbow: mix2(a.elbow, b.elbow, t), fist: mixN(a.fist, b.fist, t), hand: mixN(a.hand, b.hand, t) });

// ---------------------------------------------------------------------------
// THE HOSTS. Four files deep on the bank (far to near); ranks along it.
// ---------------------------------------------------------------------------
/** px per unit of the near file in world px (a man ~310 units: ~225 world px; x1.4 on screen at the widest) */
const SC = 0.72;
/** the vanishing line of the ground: a file's scale is (y - Y_H) / (near y - Y_H) */
const Y_H = 400;
const FILES = [1120, 1149, 1179, 1210].map((y, j) => ({ y, s: (y - Y_H) / (1210 - Y_H), tone: [0.8, 0.88, 0.94, 1][j], j }));
const NF = FILES.length;
const shadeOrange = (t: number): Ink => ({ main: mixColor(LAND, ACCENT, t), deep: mixColor(LAND, ACCENT_DEEP, t), hair: mixColor(LAND, "#B87108", t) });
const OR_INKS = FILES.map((F) => (F.tone >= 1 ? ORANGE : shadeOrange(F.tone)));
const CR_INKS = FILES.map((F) => (F.tone >= 1 ? CREAM : shadeInk(F.tone)));

// ---- the orange army: 4 ranks, the rear rank's heels at the brink
const O_RANKS = 4;
const O_SPACE = 38;
/** the feet stand this far (units) in front of the brink */
const HEEL = 21;
/** the charge's stride (units): short quick steps, a rush of ranks in close order (RUN.stride is a free run) */
const O_STRIDE = Math.round(RUN.stride * 0.62);
type OMan = { id: string; j: number; r: number; x0: number; y: number; sc: number; lv: number; c0: number; seed: number; grip: number };
/** where the rank's rear fist holds the shaft once levelled (units up from the butt): the ranks behind slide their
 *  grip forward, so every rank's points reach the front of the hedge and the butts stay short behind them */
const RANK_GRIP = [GRIP_AT.ge, GRIP_AT.ge - 40, GRIP_AT.ge - 80, GRIP_AT.ge - 115];
const OMEN: OMan[] = FILES.flatMap((F) =>
  Array.from({ length: O_RANKS }, (_, r): OMan => {
    const sc = SC * F.s;
    const rear = edgeX(F.y) + HEEL * sc;
    const i = F.j * 10 + r;
    return {
      id: `o${F.j}${r}`,
      j: F.j,
      r,
      x0: rear + (O_RANKS - 1 - r) * O_SPACE * F.s + (r < O_RANKS - 1 ? (hash(i, 201) - 0.5) * 6 : 0),
      y: F.y + (hash(i, 202) - 0.5) * 4,
      sc,
      // the levelling ripple runs front to back; the charge goes front first
      lv: 37 + 3.1 * r + 0.8 * (NF - 1 - F.j) + 1.2 * hash(i, 203),
      c0: 50 + 1.4 * r + 0.8 * hash(i, 204),
      seed: i,
      grip: RANK_GRIP[r],
    };
  }),
);
/** the charge and the drive: px advanced (near-file world px) since its start. A rush to the cream shafts, then a
 *  steady drive that is still going on the last frame (the last key lies past the cut, so nothing parks) */
const CHARGE = track([
  [0, 0],
  [4, 7],
  [9, 30],
  [13, 46],
  [20, 74],
  [30, 114],
  [40, 153],
  [50, 190],
  [70, 258],
]);
const oAdvance = (m: OMan, f: number) => CHARGE(f - m.c0) * FILES[m.j].s * (1 + 0.05 * m.r);
/** the legs of b laid over a (the arms, the head and the weapon stay a's) */
const blendLegs = (a: FigPose, b: FigPose, t: number): FigPose => ({
  ...a,
  crouch: mixN(a.crouch, b.crouch, t),
  lean: mixN(a.lean, b.lean, t),
  footL: mix2(a.footL, b.footL, t),
  footR: mix2(a.footR, b.footR, t),
  liftL: mixN(a.liftL, b.liftL, t),
  liftR: mixN(a.liftR, b.liftR, t),
  hem: mixN(a.hem, b.hem, t),
});
/** the drive's stride (units): driving steps once they are pushing (no flight phase) */
const D_STRIDE = 40;
const oState = (m: OMan, f: number) => {
  const lv = smootherstep((f - m.lv) / 11);
  const t = f - m.c0;
  const run = smoothstep(t / 5);
  // from the contact on they drive: lean into the shafts, driving steps
  const drive = smoothstep((t - 7) / 12);
  let q = lerpFig(CARRY, GUARD, lv);
  // the step into guard: the front foot lifts as it goes
  const stepUp = Math.sin(Math.PI * lv);
  q = { ...q, footR: [q.footR[0], q.footR[1] - 13 * stepUp], liftR: q.liftR + 10 * stepUp };
  q = lerpFig(q, CHARGE_BODY, run * (1 - drive));
  q = lerpFig(q, PRESS, drive);
  // driving: the rear fist works the shaft, so the tips bob
  if (drive > 0.01) {
    const b = drive * (2.6 * Math.sin(f / 7.5 + m.seed * 1.9) + 1.3 * Math.sin(f / 4.3 + m.seed));
    q = { ...q, armL: { ...q.armL, w: [q.armL.w[0], q.armL.w[1] + b] } };
  }
  // the far fist closes on the shaft as it comes down (and stays on it)
  q = { ...q, armR: lerpArm(q.armR, onShaft(q, ALONG).armR, smoothstep((lv - 0.2) / 0.55)) };
  const adv = oAdvance(m, f);
  const at: P2 = [m.x0 + adv, m.y];
  // the legs run with the distance covered (a planted foot does not slide); they settle as he slows
  const speed = oAdvance(m, f + 0.5) - oAdvance(m, f - 0.5);
  const amt = c01(speed / (1.8 * FILES[m.j].s));
  const ph = 0.5 * hash(m.seed, 205);
  const ran = runLegs(q, adv / ((O_STRIDE / 0.4) * m.sc) + ph, amt, O_STRIDE);
  const walked = walkPose(q, adv / (2 * D_STRIDE * m.sc) + ph, amt, D_STRIDE);
  q = blendLegs(ran, walked, drive);
  q = idle(q, f, m.seed, 0.8);
  // the grip slides up the shaft as the weapon comes down (upright, the butt rests near the ground)
  return { pose: q, at, gripAt: mixN(GRIP_AT.ge, m.grip, smoothstep((lv - 0.15) / 0.75)) };
};
const tipX = (j: number, f: number) => {
  const m = OMEN.find((o) => o.j === j && o.r === 0) as OMan;
  const s = oState(m, f);
  return dgAnchors("soldier", s.pose, s.at, m.sc).tip[0];
};

// ---- the cream enemy: marching in from the right at a constant pace, halting across the bank
const C_RANKS = 12;
const C_SPACE = 46;
/** each file halts with the same small gap (22 px, near file) between its orange front man's levelled tip and its
 *  own front shaft */
const C_HALT_X = FILES.map((F) => {
  const m = OMEN.find((o) => o.j === F.j && o.r === 0) as OMan;
  const tip = dgAnchors("soldier", onShaft(GUARD, ALONG), [m.x0, m.y], m.sc).tip[0];
  return tip + 22 * F.s - MEET_OFF * m.sc;
});
const T_HALT = 38;
const C_V = 5.4;
const C_WALK = { stride: 58 };
/** px still to walk at frame f (near-file px): constant speed, easing to a halt over the last 9 frames */
const C_LEFT = (() => {
  const sp = (f: number) => C_V * (1 - smoothstep((f - (T_HALT - 9)) / 9));
  const out: number[] = [];
  let acc = 0;
  for (let f = 200; f >= -60; f--) {
    out[f + 60] = acc;
    acc += (sp(f - 1) + sp(f)) / 2;
  }
  return (f: number) => {
    const x = Math.max(-60, Math.min(200, f));
    const i = Math.floor(x);
    return mixN(out[i + 60], out[Math.min(260, i + 61)] ?? out[i + 60], x - i);
  };
})();
type CMan = { id: string; j: number; r: number; x0: number; y: number; sc: number; seed: number };
const CMEN: CMan[] = FILES.flatMap((F) =>
  Array.from({ length: C_RANKS }, (_, r): CMan => {
    const i = 100 + F.j * 20 + r;
    return { id: `c${F.j}${r}`, j: F.j, r, x0: C_HALT_X[F.j] + r * C_SPACE * F.s + (r ? (hash(i, 301) - 0.5) * 8 : 0), y: F.y + (hash(i, 302) - 0.5) * 4, sc: SC * F.s, seed: i };
  }),
);
/** a soft max(0, d): the shaft gives as the tip arrives, without a jolt */
const softPos = (d: number, e = 7) => Math.max(0, (d + Math.sqrt(d * d + e * e)) / 2 - e / 2);
/** how far each cream man of file j has been driven back at frame f (world px): the front rank by the orange tip
 *  on his shaft, each rank behind by the man backing into him */
const PUSH_CACHE = new Map<string, number[]>();
const pushesAt = (j: number, f: number): number[] => {
  const key = `${j}:${f}`;
  const had = PUSH_CACHE.get(key);
  if (had) return had;
  const F = FILES[j];
  const tip = tipX(j, f);
  const men = CMEN.filter((c) => c.j === j).sort((a, b) => a.r - b.r);
  let prevX = -1e9;
  const out = men.map((c) => {
    const marchX = c.x0 + C_LEFT(f) * F.s;
    const pushed = c.r === 0 ? softPos(tip - (marchX + MEET_OFF * c.sc)) : softPos(prevX + C_SPACE * F.s * 0.72 - marchX, 9);
    prevX = marchX + pushed;
    return pushed;
  });
  PUSH_CACHE.set(key, out);
  return out;
};
const cState = (c: CMan, f: number) => {
  const F = FILES[c.j];
  const marchX = c.x0 + C_LEFT(f) * F.s;
  const pushed = pushesAt(c.j, f)[c.r];
  const pushV = pushed - pushesAt(c.j, f - 1)[c.r];
  const rec = smoothstep(pushed / ((c.r === 0 ? 30 : 26) * F.s)) * (c.r === 0 ? 1 : c.r === 1 ? 0.45 : 0.12);
  let q = lerpFig(C_CARRY, C_RECOIL, rec);
  // the recoil's step back: the rear foot lifts as it goes
  const stepUp = c.r === 0 ? Math.sin(Math.PI * rec) : 0;
  q = { ...q, footL: [q.footL[0], q.footL[1] - 12 * stepUp], liftL: q.liftL - 8 * stepUp };
  // marching: the walk's phase from the distance walked, its amount from the pace
  const walked = (C_LEFT(-60) - C_LEFT(f)) * F.s;
  const speed = (C_LEFT(f - 0.5) - C_LEFT(f + 0.5)) * F.s;
  q = walkPose(q, walked / (2 * C_WALK.stride * c.sc) + 0.13 * c.j + 0.04 * hash(c.seed, 303), c01(speed / (0.5 * C_V * F.s)), C_WALK.stride);
  // driven back: steps backward with the distance pushed, rocking back on each step
  const backPh = -pushed / (2 * 40 * c.sc);
  if (pushed > 0.2) q = walkPose(q, backPh, c01(pushV / (1.2 * F.s)) * 0.9, 40);
  q = { ...q, lean: q.lean + 5 * rec * c01(pushV / (1.5 * F.s)) * Math.abs(Math.sin(2 * Math.PI * backPh)) };
  q = { ...q, armL: lerpFig(C_CARRY, C_RECOIL, rec).armL, armR: lerpFig(C_CARRY, C_RECOIL, rec).armR };
  if (rec > 0.01) q = { ...q, armL: lerpArm(q.armL, onShaft(q, 62).armL, smoothstep((rec - 0.15) / 0.6)) };
  q = idle(q, f, c.seed, 0.7);
  return { pose: q, at: [marchX + pushed, c.y] as P2 };
};

// ---------------------------------------------------------------------------
// THE CAMERA: close on the rear ranks at the brink; one continuous pull-back
// and drift right to the whole trap; it eases right with the charge (the
// water opening behind them), then from ~f70 a gentle push-in (k +20%) that
// keeps the clash near the frame's centre as the drive carries it right.
// ---------------------------------------------------------------------------
const camAt = makeCamera([
  { f: 0, k: 3.0, wx: 275, wy: 1081, sx: 540, sy: 960 },
  { f: 12, k: 2.5, wx: 305, wy: 1062, sx: 540, sy: 960 },
  { f: 26, k: 1.8, wx: 382, wy: 1043, sx: 540, sy: 960 },
  { f: 40, k: 1.46, wx: 455, wy: 1022, sx: 540, sy: 960 },
  { f: 56, k: 1.4, wx: 480, wy: 1016, sx: 540, sy: 960 },
  { f: 72, k: 1.33, wx: 492, wy: 1014, sx: 540, sy: 960 },
  { f: 84, k: 1.45, wx: 552, wy: 1020, sx: 540, sy: 960 },
  { f: 94, k: 1.56, wx: 604, wy: 1028, sx: 540, sy: 960 },
  { f: 103, k: 1.64, wx: 640, wy: 1035, sx: 540, sy: 960 },
]);

/** is a man (feet at x, y; his ge reaching ~330 units either way) in the frame? */
const visible = (cam: Cam, x: number, y: number, sc: number) => {
  const sx = 540 + (x - cam.cx) * cam.k;
  const sy = 960 + (y - cam.cy) * cam.k;
  const w = 340 * sc * cam.k;
  return sx > -w && sx < 1080 + w && sy - 520 * sc * cam.k < 1920 && sy > -40;
};

const CourageOfDesperation: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const cam = camAt(f);
  type Item = { key: string; j: number; o: number; el: React.ReactNode };
  const items: Item[] = [];
  for (const c of CMEN) {
    const s = cState(c, f);
    if (!visible(cam, s.at[0], s.at[1], c.sc)) continue;
    items.push({ key: c.id, j: c.j, o: -c.r, el: <Soldier key={c.id} pose={s.pose} at={s.at} scale={c.sc} ink={CR_INKS[c.j]} uid={`cd-${c.id}`} seed={c.seed} /> });
  }
  for (const m of OMEN) {
    const s = oState(m, f);
    if (!visible(cam, s.at[0], s.at[1], m.sc)) continue;
    items.push({ key: m.id, j: m.j, o: 100 - m.r, el: <Soldier key={m.id} pose={s.pose} at={s.at} scale={m.sc} ink={OR_INKS[m.j]} uid={`cd-${m.id}`} seed={m.seed} gripAt={s.gripAt} /> });
  }
  // painter's order: far file first; in a file the cream (rear first), then the orange (rear first)
  items.sort((a, b) => a.j - b.j || a.o - b.o);
  return (
    <AbsoluteFill>
      <TexcocoPage cam={cam}>
        <WorldSvg cam={cam}>
          <Cliff />
          <Water f={f} />
          <Bank />
          <ShoreLines f={f} />
          {items.map((it) => it.el)}
        </WorldSvg>
      </TexcocoPage>
    </AbsoluteFill>
  );
};

export default CourageOfDesperation;
