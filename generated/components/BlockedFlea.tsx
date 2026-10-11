// ---------------------------------------------------------------------------
// BlockedFlea: the centrepiece of the plague clip (Dwarkesh Patel with Kyle
// Harper, "Why the plague is so deadly to humans"). Sequence 12.779-22.956 s.
//
// CHECK LINE: "The plague plugs the flea's gut so no blood gets through; the
// starving flea bites again and again and each time flushes bacteria back
// into whatever it bites."
//
// SPOKEN: "It's really weird. It forms this biofilm in the gut of the flea
// that, like, chokes it and makes the flea feel like it's starving. And so the
// flea just starts feeding and feeding and feeding, and meanwhile it's
// regurgitating bacteria."
// WORD -> FRAME (29.97 fps, f = round((t - 12.779) * 29.97)):
//   It's f0 · really f5 · weird f10 · It f17 · forms f24 · this f32 ·
//   biofilm f37 · in f53 · the f61 · gut f64 · of the f69 · flea f77 ·
//   that f86 · like f91 · chokes f98 · it f106 · and f111 · makes f115 ·
//   the flea f121 · feel f133 · like it's f137 · starving f147 · And f162 ·
//   so the flea f166 · just f179 · starts f183 · feeding f191 · and f203 ·
//   feeding f209 · and f218 · feeding f224 · and meanwhile f236 · it's f245 ·
//   regurgitating f248 · bacteria f272 · speech ends f305.
// DURATION = 305 + 6 handle frames = 311.
//
// THE MOTION: one camera move in, through and out. It opens on Hooke's flea
// with an anatomical section cut along its gut and pushes into the
// proventriculus; there the orange germs on the valve spines bud into one
// solid plug, the blood stream piles up before it and the midgut behind it
// drains and slackens. The camera pulls back out of the same window as the
// flea tips head-down and drives its proboscis into the skin; three slugs of
// blood are sucked up, stop at the plug, and the column flushes back down
// into the vessel carrying germs torn from the plug.
//
// FACTS SHOWN, AND THEIR SOURCES:
//   - The flea: Robert Hooke, Micrographia (1665), Schem. XXXIV.
//   - Anatomy (mouthparts -> narrow oesophagus through head and thorax ->
//     the proventriculus, a bulb-shaped valve lined with rows of
//     inward-pointing spines where thorax meets abdomen -> the wide midgut)
//     and the mechanism (Y. pestis grows as a biofilm on the proventricular
//     spines until it blocks the valve; blood cannot reach the midgut; the
//     flea starves, bites repeatedly, and blood mixed with bacteria is flushed
//     back into the bite): A.W. Bacot & C.J. Martin, "Observations on the
//     mechanism of the transmission of plague by fleas", J. Hygiene 13
//     (Plague Suppl. III), 1914; B.J. Hinnebusch & D.L. Erickson, "Yersinia
//     pestis biofilm in the flea vector and its role in the transmission of
//     plague", Curr. Top. Microbiol. Immunol. 322, 2008; D.M. Bland et al.,
//     PLoS Pathog. 14 (2018) e1006859.
//   - Not to scale: the proboscis is drawn long so the vessel sits below the
//     caption strip; germs and blood droplets are drawn far larger than life.
//   No labels, no numbers. Orange = the plague bacteria only. Blood is cream.
// ---------------------------------------------------------------------------
import React from "react";
import { Img, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  type CamKey,
  DARK,
  FPS as KIT_FPS,
  INK,
  INK_DEEP,
  Page,
  WorldDiv,
  WorldSvg,
  clamp01,
  germ,
  hash,
  ramp,
  runCamera,
  smoothstep,
} from "./plagueShared";

export const FPS = KIT_FPS;
export const DURATION = 311;

export const schema = z.object({
  plateSrc: z.string(),
  vignette: z.number(),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ plateSrc: "plague/flea_hooke_clean.png", vignette: 0.34 });

// ---------------------------------------------------------------------------
// FLEA SPACE = pixels of the plate (3541 x 2690, head right). The gut is drawn
// here, at its true place, and shares the plate's transform into the world.
// ---------------------------------------------------------------------------
const PLATE_W = 3541;
const PLATE_H = 2690;
const PIVOT = { x: 2290, y: 790 }; // the proventriculus: the flea tips about it
const S = 0.27; // world px per plate px
const TILT = 26; // degrees, head-down, when feeding
const PIVOT_W = { x: 660, y: 602 }; // where the proventriculus sits in the world (feeding pose)
const LIFT = -72; // standing pose: the flea rides this much higher so its hind claws rest on the skin
const MOUTH = { x: 3375, y: 1215 };
const SKIN_Y = 1030;
const TIP_Y = 1292; // the proboscis tip, inside the vessel
const VES_TOP = 1217;
const VES_BOT = 1404;

const rad = (d: number) => (d * Math.PI) / 180;
type Mat = [number, number, number, number, number, number];
/** plate px -> world px for a tilt (deg), a lift (world px) and a small pump rotation about the bite */
const fleaMat = (tilt: number, lift: number, pump: number, bite: { x: number; y: number }): Mat => {
  const c = Math.cos(rad(tilt)) * S;
  const s = Math.sin(rad(tilt)) * S;
  const e = PIVOT_W.x - (c * PIVOT.x - s * PIVOT.y);
  const f = PIVOT_W.y + lift - (s * PIVOT.x + c * PIVOT.y);
  const pc = Math.cos(rad(pump));
  const ps = Math.sin(rad(pump));
  // world' = bite + R(pump) (world - bite)
  return [
    pc * c - ps * s,
    ps * c + pc * s,
    pc * -s - ps * c,
    ps * -s + pc * c,
    bite.x + pc * (e - bite.x) - ps * (f - bite.y),
    bite.y + ps * (e - bite.x) + pc * (f - bite.y),
  ];
};
const apply = (m: Mat, x: number, y: number) => ({ x: m[0] * x + m[2] * y + m[4], y: m[1] * x + m[3] * y + m[5] });

// the proboscis runs straight down in the WORLD when the flea is tilted, so in plate px it leans by the tilt
const PROB_DIR = { x: Math.sin(rad(TILT)), y: Math.cos(rad(TILT)) };
const M_FEED0 = fleaMat(TILT, 0, 0, { x: 0, y: 0 });
const MOUTH_W = apply(M_FEED0, MOUTH.x, MOUTH.y);
const PROB_LEN = (TIP_Y - MOUTH_W.y) / S; // plate px
const BITE = { x: MOUTH_W.x, y: SKIN_Y };
const TIP_W = { x: MOUTH_W.x, y: TIP_Y };

// ---------------------------------------------------------------------------
// THE ALIMENTARY CANAL: one axis, measured by arc length s (plate px) from the
// proboscis tip (s = 0) to the blind end of the midgut.
// ---------------------------------------------------------------------------
const CTRL: Array<[number, number]> = [
  [MOUTH.x + PROB_DIR.x * PROB_LEN, MOUTH.y + PROB_DIR.y * PROB_LEN],
  [MOUTH.x + PROB_DIR.x * PROB_LEN * 0.66, MOUTH.y + PROB_DIR.y * PROB_LEN * 0.66],
  [MOUTH.x + PROB_DIR.x * PROB_LEN * 0.33, MOUTH.y + PROB_DIR.y * PROB_LEN * 0.33],
  [MOUTH.x + PROB_DIR.x * 90, MOUTH.y + PROB_DIR.y * 90],
  [MOUTH.x, MOUTH.y], // 4: the mouth
  [3295, 1128],
  [3140, 1010],
  [2960, 905],
  [2760, 830],
  [2560, 795],
  [2405, 790], // 10: into the proventriculus
  [2290, 790],
  [2180, 790], // 12: out of it, into the midgut
  [1700, 818],
  [1250, 850], // 14: the blind end drawn
];
const DS = 3;
const AXIS = (() => {
  const pts: Array<[number, number]> = [];
  const ctrlAt: number[] = [];
  const P = (i: number) => CTRL[Math.max(0, Math.min(CTRL.length - 1, i))];
  for (let i = 0; i < CTRL.length - 1; i++) {
    ctrlAt.push(pts.length);
    const [p0, p1, p2, p3] = [P(i - 1), P(i), P(i + 1), P(i + 2)];
    for (let j = 0; j < 60; j++) {
      const t = j / 60;
      const t2 = t * t;
      const t3 = t2 * t;
      const q = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      pts.push([q(p0[0], p1[0], p2[0], p3[0]), q(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  ctrlAt.push(pts.length);
  pts.push(CTRL[CTRL.length - 1]);
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const total = cum[cum.length - 1];
  const n = Math.floor(total / DS);
  const xs: number[] = [];
  const ys: number[] = [];
  let k = 0;
  for (let i = 0; i <= n; i++) {
    const s = i * DS;
    while (k < cum.length - 2 && cum[k + 1] < s) k++;
    const u = (s - cum[k]) / Math.max(1e-6, cum[k + 1] - cum[k]);
    xs.push(pts[k][0] + (pts[k + 1][0] - pts[k][0]) * u);
    ys.push(pts[k][1] + (pts[k + 1][1] - pts[k][1]) * u);
  }
  return { xs, ys, total: n * DS, sAt: ctrlAt.map((i) => cum[Math.min(i, cum.length - 1)]) };
})();
const S_M = AXIS.sAt[4];
const S_E = AXIS.sAt[10];
const S_X = AXIS.sAt[12];
const S_END = AXIS.total;
const S_PLUG = S_E + 6; // the face of the plug the blood meets

/** point, unit tangent (toward the midgut) and unit normal of the axis at s */
const at = (s: number) => {
  const f = Math.max(0, Math.min(AXIS.xs.length - 1.001, s / DS));
  const i = Math.floor(f);
  const u = f - i;
  const i0 = Math.max(0, i - 2);
  const i1 = Math.min(AXIS.xs.length - 1, i + 3);
  let tx = AXIS.xs[i1] - AXIS.xs[i0];
  let ty = AXIS.ys[i1] - AXIS.ys[i0];
  const l = Math.hypot(tx, ty) || 1;
  tx /= l;
  ty /= l;
  return { x: AXIS.xs[i] + (AXIS.xs[i + 1] - AXIS.xs[i]) * u, y: AXIS.ys[i] + (AXIS.ys[i + 1] - AXIS.ys[i]) * u, tx, ty, nx: ty, ny: -tx };
};
/** a point of the canal: s along, `lat` plate px to the side */
const pt = (s: number, lat: number) => {
  const a = at(s);
  return { x: a.x + a.nx * lat, y: a.y + a.ny * lat, tx: a.tx, ty: a.ty };
};

const TUBE = 34; // half-width of proboscis and oesophagus
const BULB = 94; // extra half-width of the proventriculus bulb
const SAC = 182; // half-width of the full midgut
/** half-width of the canal at s. sag 0..1 slackens the midgut; `swell` fattens the oesophagus behind sBack */
const halfW = (s: number, side: number, sag = 0, swell = 0, sBack = S_E): number =>
  halfW0(s, side, sag, swell, sBack) + (s <= S_M ? 0.4 : 1) * (1.9 * Math.sin(s * 0.027 + side * 1.7) + 1.2 * Math.sin(s * 0.071 + side * 4.1));
const halfW0 = (s: number, side: number, sag = 0, swell = 0, sBack = S_E) => {
  if (s <= S_M) return TUBE;
  if (s < S_E) {
    const base = TUBE - 3 * ((s - S_M) / (S_E - S_M));
    if (swell <= 0) return base;
    return base * (1 + 0.24 * swell * smoothstep((s - (sBack - 70)) / 70) * (1 - smoothstep((s - (S_E - 26)) / 26) * 0.6));
  }
  if (s < S_X) {
    const u = (s - S_E) / (S_X - S_E);
    return TUBE - 3 + 8 * u + BULB * Math.pow(Math.sin(Math.PI * u), 0.75);
  }
  const v = clamp01((s - S_X) / (S_END - S_X));
  const shape = Math.pow(Math.sin(Math.PI * Math.pow(v, 0.72)), 0.62);
  const slack = 1 - 0.34 * sag * smoothstep(v / 0.25);
  return (TUBE + 5) * (1 - v) + SAC * slack * shape + sag * 9 * Math.sin(v * 31 + side * 1.9) * shape;
};

/** the closed outline of the canal from sFrom to S_END (pointed where a growing proboscis ends) */
const canalD = (sFrom: number, sag: number, swell: number, sBack: number) => {
  const top: string[] = [];
  const bot: string[] = [];
  const pointed = sFrom < S_M - 1;
  for (let s = sFrom; ; s += 6) {
    const ss = Math.min(s, S_END);
    const taper = pointed ? Math.pow(clamp01((ss - sFrom) / 110), 0.7) * 0.86 + 0.14 : 1;
    const a = pt(ss, halfW(ss, 1, sag, swell, sBack) * taper);
    const b = pt(ss, -halfW(ss, -1, sag, swell, sBack) * taper);
    top.push(`${a.x.toFixed(1)},${a.y.toFixed(1)}`);
    bot.push(`${b.x.toFixed(1)},${b.y.toFixed(1)}`);
    if (ss >= S_END) break;
  }
  return `M${top.join("L")}L${bot.reverse().join("L")}Z`;
};

// THE WINDOW: the section is cut along the canal, so it is the canal's own outline let out by a margin.
const winRaw = (s: number) => {
  let sum = 0;
  let n = 0;
  for (let q = s - 190; q <= s + 190; q += 19, n++) sum += halfW(Math.max(S_M, Math.min(S_END, q)), 0);
  return Math.max(halfW(s, 0) + 12, sum / n) * 1.12;
};
const winHalf = (s: number) => winRaw(s) + 84 * smoothstep((s - S_M) / 230) + 10 + 5 * Math.sin(s * 0.013) + 3 * Math.sin(s * 0.041 + 1);
const BAND = 24; // the cut body wall around the window, in section
const windowRing = (off: number) => {
  const top: Array<[number, number]> = [];
  const bot: Array<[number, number]> = [];
  for (let s = S_M; s <= S_END; s += 8) {
    const grow = off * smoothstep((s - S_M) / 120); // the band closes to nothing at the mouth
    const a = pt(s, winHalf(s) + grow);
    const b = pt(s, -winHalf(s) - grow);
    top.push([a.x, a.y]);
    bot.push([b.x, b.y]);
  }
  const e = at(S_END);
  const r = winHalf(S_END) + off;
  const cap: Array<[number, number]> = [];
  for (let i = 1; i < 40; i++) {
    const a = (i / 40) * Math.PI;
    cap.push([e.x + e.nx * r * Math.cos(a) + e.tx * r * Math.sin(a), e.y + e.ny * r * Math.cos(a) + e.ty * r * Math.sin(a)]);
  }
  return [...top, ...cap, ...bot.reverse()];
};
const ringD = (pts: Array<[number, number]>) => `M${pts.map((q) => `${q[0].toFixed(1)},${q[1].toFixed(1)}`).join("L")}Z`;
const RING_IN = windowRing(0);
const RING_OUT = windowRing(BAND);
const WINDOW_D = ringD(RING_IN);
const WINDOW_OUT_D = ringD(RING_OUT);
// short hatch across the cut wall, and a little stipple in it
const BAND_TICKS = (() => {
  let d = "";
  for (let i = 0; i < RING_IN.length - 1; i++) {
    const a = RING_IN[i];
    const b = RING_OUT[i + 1];
    const k = 0.5 + 0.3 * hash(i, 91);
    d += `M${(a[0] + (b[0] - a[0]) * 0.1).toFixed(1)},${(a[1] + (b[1] - a[1]) * 0.1).toFixed(1)}L${(a[0] + (b[0] - a[0]) * k).toFixed(1)},${(a[1] + (b[1] - a[1]) * k).toFixed(1)}`;
  }
  return d;
})();
const BAND_STIPPLE = (() => {
  let d = "";
  for (let i = 0; i < RING_IN.length; i += 1) {
    const a = RING_IN[i];
    const b = RING_OUT[i];
    const k = 0.7 + 0.2 * hash(i, 92);
    d += `M${(a[0] + (b[0] - a[0]) * k).toFixed(1)},${(a[1] + (b[1] - a[1]) * k).toFixed(1)}h0.01`;
  }
  return d;
})();
/** ruled engraver's lines: nearly straight, each with a little life in it */
const ruled = (x0: number, x1: number, y0: number, y1: number, spacing: number, slope: number, seed: number, step = 130) => {
  let d = "";
  let n = 0;
  for (let y = y0; y < y1; y += spacing, n++) {
    for (let x = x0, i = 0; x <= x1; x += step, i++) {
      const yy = y + slope * (x - x0) + (hash(n * 53 + i, seed) - 0.5) * spacing * 0.3;
      d += `${i === 0 ? "M" : "L"}${x.toFixed(0)},${yy.toFixed(1)}`;
    }
  }
  return d;
};
// the section ground: fine ruled hatch across the body cavity, cross-hatched toward the cut edge
const CAVITY_HATCH = ruled(1000, 3500, 300, 1460, 9, 0.024, 3);
const CAVITY_CROSS = ruled(1000, 3500, -1300, 1460, 11, 0.62, 4);
const LUMEN_HATCH = ruled(-400, 3600, 200, 4200, 13, -0.03, 5, 200);
const HOLLOW_HATCH = (() => {
  let d = "";
  for (let x = 900; x < 2700; x += 19) d += `M${x},520L${(x - 150 + (hash(x, 6) - 0.5) * 6).toFixed(1)},840L${x - 300},1160`;
  return d;
})();

// the proventricular spines: two rows a side, pointing inward and back toward the midgut
const SPINES = (() => {
  const front: string[] = [];
  const back: string[] = [];
  for (const side of [1, -1]) {
    for (let row = 0; row < 2; row++) {
      const n = row === 0 ? 9 : 8;
      for (let i = 0; i < n; i++) {
        const u = row === 0 ? 0.1 + (0.8 * i) / (n - 1) : 0.15 + (0.7 * i) / (n - 1);
        const s = S_E + u * (S_X - S_E);
        const hw = halfW(s, side);
        const len = (row === 0 ? 0.62 : 0.4) * hw * (0.9 + 0.2 * hash(i * 7 + row * 31 + (side + 1), 3));
        const b0 = pt(s - 5, side * (hw - 5));
        const b1 = pt(s + 5, side * (hw - 5));
        const tip = pt(s + len * 0.55, side * (hw - 3 - len * 0.84));
        const mid = pt(s + len * 0.16, side * (hw - 3 - len * 0.5));
        const d = `M${b0.x.toFixed(1)},${b0.y.toFixed(1)}Q${mid.x.toFixed(1)},${mid.y.toFixed(1)} ${tip.x.toFixed(1)},${tip.y.toFixed(1)}Q${(mid.x + 5).toFixed(1)},${mid.y.toFixed(1)} ${b1.x.toFixed(1)},${b1.y.toFixed(1)}Z`;
        (row === 0 ? front : back).push(d);
      }
    }
  }
  return { front: front.join(""), back: back.join("") };
})();

// ---------------------------------------------------------------------------
// TIMING
// ---------------------------------------------------------------------------
const T = {
  grow: [37, 90] as const, // the germs bud into the plug
  shut: 70, // the entrance of the valve is closed: blood arriving after this piles up
  lastBlood: 112, // the last of the blood meal reaches the pile
  absorb: [102, 150] as const, // the midgut takes up its last droplets
  sag: [115, 158] as const,
  tip: [154, 192] as const, // the flea tips head-down
  probe: [173, 190] as const, // the proboscis is driven in
  sucks: [191, 209, 224],
  flush: 246, // the column runs back
};
const V_STREAM = 11; // plate px / frame
const V_SUCK = 150;
const V_FLUSH = 150;
const DROP_R = 9;
const GERM_R = 11;
const TORN_R = 12.5; // a germ carried off by the flush (about 17 px long in the feeding view)

// ---------------------------------------------------------------------------
// THE PLUG: germs on a jittered lattice in the valve, each budding from an
// older neighbour, from the spines inward.
// ---------------------------------------------------------------------------
type MassGerm = { s: number; lat: number; x: number; y: number; parent: number; born: number; seed: number };
const MASS: MassGerm[] = (() => {
  const g: MassGerm[] = [];
  let row = 0;
  for (let s = S_E - 16; s < S_X - 8; s += 20, row++) {
    const hw = halfW(s, 0) - 27;
    for (let lat = -160 + (row % 2) * 11.5; lat <= 160; lat += 23) {
      if (Math.abs(lat) > Math.max(2, hw)) continue;
      const i = g.length;
      const ss = s + (hash(i, 11) - 0.5) * 7;
      const ll = lat + (hash(i, 12) - 0.5) * 7;
      const p = pt(ss, ll);
      g.push({ s: ss, lat: ll, x: p.x, y: p.y, parent: -1, born: 1e9, seed: i * 3 + 1 });
    }
  }
  // seeds: on the spines, both sides
  const seeds: number[] = [];
  for (const side of [1, -1]) {
    for (const u of [0.24, 0.5, 0.76]) {
      let best = -1;
      let bestV = -1e9;
      g.forEach((q, i) => {
        const qu = (q.s - S_E) / (S_X - S_E);
        const v = side * q.lat * 0.72 - Math.abs(qu - u) * 420;
        if (v > bestV && !seeds.includes(i)) {
          bestV = v;
          best = i;
        }
      });
      seeds.push(best);
    }
  }
  const dist = g.map(() => 1e9);
  seeds.forEach((i) => {
    dist[i] = 0;
  });
  const done = g.map(() => false);
  const order: number[] = [];
  for (;;) {
    let i = -1;
    g.forEach((_, j) => {
      if (!done[j] && dist[j] < 1e9 && (i < 0 || dist[j] < dist[i])) i = j;
    });
    if (i < 0) {
      // anything unreached hangs off its nearest placed neighbour
      const j = done.findIndex((d) => !d);
      if (j < 0) break;
      let near = order[0];
      order.forEach((o) => {
        if (Math.hypot(g[o].x - g[j].x, g[o].y - g[j].y) < Math.hypot(g[near].x - g[j].x, g[near].y - g[j].y)) near = o;
      });
      g[j].parent = near;
      dist[j] = dist[near] + 30;
      continue;
    }
    done[i] = true;
    order.push(i);
    g.forEach((q, j) => {
      if (done[j]) return;
      const d = Math.hypot(q.x - g[i].x, q.y - g[i].y);
      if (d > 36) return;
      // the entrance (oesophagus side) closes early, the middle of the lumen last
      const nd = dist[i] + d * (0.7 + 0.6 * hash(i * 131 + j, 5));
      if (nd < dist[j]) {
        dist[j] = nd;
        g[j].parent = i;
      }
    });
  }
  const grown = order.filter((i) => !seeds.includes(i));
  const N = grown.length;
  const E3 = Math.exp(2.6) - 1;
  grown.forEach((i, n) => {
    // exponential growth: few at first, then the mass closes quickly
    g[i].born = T.grow[0] + ((T.grow[1] - 8 - T.grow[0]) * Math.log(1 + ((n + 1) / N) * E3)) / 2.6;
  });
  seeds.forEach((i) => {
    g[i].born = -1e9;
  });
  return g;
})();
// THE GERMS THE FLUSH CARRIES OFF: each buds from a germ on the oesophagus face of the plug (the plug stays whole)
const FACE = MASS.map((q, i) => ({ i, s: q.s }))
  .sort((a, b) => a.s - b.s)
  .slice(0, 12)
  .map((q) => q.i);
const TORN = Array.from({ length: 46 }, (_, n) => ({
  src: FACE[(n * 5) % FACE.length],
  t: n < 28 ? T.flush + 1 + 17 * Math.sqrt((n + 0.25) / 28) : T.flush + 18.5 + (n - 28) * 2.5,
  fast: n < 28,
  seed: 500 + n * 7,
}));
const BUD = 8; // frames a new germ takes to slide out of its parent
const massPos = (i: number, f: number): { x: number; y: number } => {
  const q = MASS[i];
  if (q.parent < 0 || f >= q.born + BUD) return q;
  const p = massPos(q.parent, f);
  const u = clamp01((f - q.born) / BUD);
  const e = 1 - (1 - u) * (1 - u);
  return { x: p.x + (q.x - p.x) * e, y: p.y + (q.y - p.y) * e };
};
const MASS_ORDER = MASS.map((_, i) => i).sort((a, b) => MASS[b].born - MASS[a].born); // youngest first = underneath

// ---------------------------------------------------------------------------
// THE BLOOD. Every droplet is a function of the frame.
// ---------------------------------------------------------------------------
type Stream = { arrive: number; lf: number; pile: number; restS: number; restL: number; absorb: number; id: number };
const STREAM: Stream[] = (() => {
  const out: Stream[] = [];
  let pile = 0;
  let id = 0;
  const tX = (S_X - S_PLUG) / V_STREAM;
  for (let a = -150; a < T.shut; a += 1.0, id++) {
    const far = Math.pow(hash(id, 21), 1.25);
    const exitAt = a + tX;
    out.push({
      arrive: a,
      lf: (hash(id, 22) - 0.5) * 1.9,
      pile: -1,
      restS: S_X + 70 + far * 640,
      restL: (hash(id, 23) - 0.5) * 1.7,
      absorb: Math.min(exitAt + 52 + hash(id, 24) * 46, T.absorb[0] + hash(id, 25) * (T.absorb[1] - 8 - T.absorb[0])),
      id,
    });
  }
  for (let a = T.shut; a <= T.lastBlood; a += 1.25, id++) {
    out.push({ arrive: a, lf: (hash(id, 22) - 0.5) * 1.9, pile: pile++, restS: 0, restL: 0, absorb: 0, id });
  }
  return out;
})();
const N_BLOCKED = STREAM.filter((d) => d.pile >= 0).length;
const SLUG = 48;
const BIG_R = 15; // the blood the flea draws up in the feeding half is drawn larger, to read in the wider view
// pile slots, counted back from the plug: three abreast
const BIG_BASE = () => S_PLUG - 10 - Math.ceil(N_BLOCKED / 3) * 15.5 - 18;
const slotS = (j: number) =>
  j < N_BLOCKED ? S_PLUG - 10 - Math.floor(j / 3) * 15.5 - hash(j, 31) * 5 : BIG_BASE() - Math.floor((j - N_BLOCKED) / 2) * 26 - ((j - N_BLOCKED) % 2) * 13 - hash(j, 31) * 4;
const slotL = (j: number) => (j < N_BLOCKED ? ((j % 3) - 1) * 0.6 + (hash(j, 32) - 0.5) * 0.24 : ((j - N_BLOCKED) % 2 ? 0.6 : -0.6) + (hash(j, 32) - 0.5) * 0.3);
// the flush: when each droplet of the pile lets go, and how fast it runs back
const flushStart = (j: number) => (hash(j, 41) < 0.8 ? T.flush + 17 * Math.sqrt(hash(j, 42)) : T.flush + 17 + hash(j, 43) * 47);
const flushV = (j: number) => (hash(j, 41) < 0.8 ? V_FLUSH : V_FLUSH * 0.55);
const ACC = 7; // frames a droplet or germ takes to come up to speed
const runDist = (tau: number, v: number) => (tau <= 0 ? 0 : tau < ACC ? (v * tau * tau) / (2 * ACC) : v * (tau - ACC / 2));
const runTime = (dist: number, v: number) => (dist < (v * ACC) / 2 ? Math.sqrt((2 * ACC * dist) / v) : dist / v + ACC / 2);

// the vessel: droplets drifting along it; some of them are the ones the flea draws up
const V_DRIFT = 2.3; // world px / frame
type Slug = { n: number; m: number; pile: number; enter: number; home: { x: number; y: number }; pull: number };
const SLUGS: Slug[] = (() => {
  const out: Slug[] = [];
  for (let n = 0; n < 3; n++) {
    for (let m = 0; m < SLUG; m++) {
      const k = n * SLUG + m;
      const enter = T.sucks[n] + (m / SLUG) * 5.5;
      const home = { x: TIP_W.x + (hash(k, 51) - 0.5) * 900, y: VES_TOP + 26 + hash(k, 52) * (VES_BOT - VES_TOP - 52) };
      const pull = Math.hypot(home.x - TIP_W.x, home.y - TIP_W.y) / 34;
      out.push({ n, m, pile: N_BLOCKED + k, enter, home, pull });
    }
  }
  return out;
})();
const AMBIENT = Array.from({ length: 170 }, (_, i) => ({ x0: hash(i, 61) * 2600, y: VES_TOP + 24 + hash(i, 62) * (VES_BOT - VES_TOP - 48), v: V_DRIFT * (0.85 + 0.3 * hash(i, 63)) }));

/** where something that left the proboscis tip `tau` frames ago has drifted to (world px) */
const vesselDrift = (seed: number, tau: number, isGerm = false) => {
  const side = hash(seed, 71) < (isGerm ? 0.6 : 0.5) ? -1 : 1; // more room to the left of the bite
  // carried off along the vessel, both ways, each at its own steady speed (the blood clears faster than the germs)
  const v = isGerm ? 5 + 5.5 * hash(seed, 72) : 8 + 9 * hash(seed, 72);
  const d = v * (tau + 5 * (1 - Math.exp(-tau / 5))); // a little quicker out of the tip, then steady
  const lane = (hash(seed, 73) - 0.4) * (VES_BOT - VES_TOP - 56);
  const wander = 5 * Math.sin(tau * (0.07 + 0.05 * hash(seed, 74)) + hash(seed, 75) * 6.3) * (1 - Math.exp(-tau / 12));
  return { x: TIP_W.x + side * d, y: TIP_Y + 8 + (lane - 8) * (1 - Math.exp(-tau / 10)) + wander, turn: (hash(seed, 76) - 0.5) * 0.14 * tau };
};
/** a germ capsule's axis at an explicit angle (the kit's mark, tumbling) */
const germTurned = (x: number, y: number, r: number, seed: number, turn: number) => {
  const a = hash(seed, 7) * Math.PI + turn;
  const l = r * (0.7 + 0.35 * hash(seed, 8));
  return `M${(x - Math.cos(a) * l).toFixed(2)},${(y - Math.sin(a) * l).toFixed(2)}L${(x + Math.cos(a) * l).toFixed(2)},${(y + Math.sin(a) * l).toFixed(2)}`;
};

// ---------------------------------------------------------------------------
// THE HOST: skin, tissue and one vessel in section (world px; static).
// ---------------------------------------------------------------------------
const skinY = (x: number) => SKIN_Y + 5 * Math.sin(x / 170) + 3 * Math.sin(x / 61 + 1) + 1.1 * Math.sin(x / 17 + 2);
const wallY = (x: number, top: boolean) => (top ? VES_TOP : VES_BOT) + 6 * Math.sin(x / 260 + (top ? 0 : 0.6)) + 1.2 * Math.sin(x / 29 + (top ? 1 : 3));
const HOST = (() => {
  const X0 = -900;
  const X1 = 2000;
  let skin = "";
  let wallT = "";
  let wallB = "";
  for (let x = X0; x <= X1; x += 10) {
    skin += `${x === X0 ? "M" : "L"}${x},${skinY(x).toFixed(1)}`;
    wallT += `${x === X0 ? "M" : "L"}${x},${wallY(x, true).toFixed(1)}`;
    wallB += `${x === X0 ? "M" : "L"}${x},${wallY(x, false).toFixed(1)}`;
  }
  let hairs = "";
  for (let i = 0, x = X0 + 30; x < X1; i++, x += 62 + hash(i, 81) * 70) {
    if (Math.abs(x - BITE.x) < 70) continue;
    const h = 30 + hash(i, 82) * 30;
    const lean = (hash(i, 83) - 0.3) * 30;
    hairs += `M${x.toFixed(1)},${skinY(x).toFixed(1)}q${(lean * 0.2).toFixed(1)},${(-h * 0.6).toFixed(1)} ${lean.toFixed(1)},${(-h).toFixed(1)}`;
  }
  let stipple = "";
  for (let i = 0; i < 520; i++) {
    const x = X0 + hash(i, 84) * (X1 - X0);
    const y = skinY(x) + 9 + Math.pow(hash(i, 85), 1.6) * 34;
    stipple += `M${x.toFixed(1)},${y.toFixed(1)}h0.01`;
  }
  let tissue = "";
  let ticks = "";
  const rows: number[] = [];
  for (let y = SKIN_Y + 62; y < VES_TOP - 22; y += 30) rows.push(y);
  for (let y = VES_BOT + 34; y < 2100; y += 32) rows.push(y);
  rows.forEach((y, r) => {
    for (let i = 0, x = X0 + hash(r, 86) * 80; x < X1; i++) {
      const len = 26 + hash(r * 97 + i, 87) * 46;
      tissue += `M${x.toFixed(1)},${(y + 3 * Math.sin(x / 140 + r)).toFixed(1)}h${len.toFixed(1)}`;
      x += len + 30 + hash(r * 97 + i, 88) * 60;
    }
  });
  for (let x = X0; x < X1; x += 44) {
    ticks += `M${x},${(wallY(x, true) + 5).toFixed(1)}v10M${x + 22},${(wallY(x + 22, false) - 5).toFixed(1)}v-10`;
  }
  // short engraved hatch under the skin line, and the ruled ground of the vessel lumen
  let skinHatch = "";
  for (let i = 0, x = X0; x < X1; i++, x += 6.5) {
    const len = 7 + hash(i, 89) * 12;
    skinHatch += `M${x.toFixed(1)},${(skinY(x) + 4).toFixed(1)}l${(-len * 0.45).toFixed(1)},${len.toFixed(1)}`;
  }
  let lumen = `M${X0},${wallY(X0, true)}`;
  for (let x = X0; x <= X1; x += 40) lumen += `L${x},${wallY(x, true).toFixed(1)}`;
  for (let x = X1; x >= X0; x -= 40) lumen += `L${x},${wallY(x, false).toFixed(1)}`;
  lumen += "Z";
  let lumenHatch = "";
  for (let y = VES_TOP + 9, n = 0; y < VES_BOT - 4; y += 6.5, n++) {
    for (let x = X0, i = 0; x <= X1; x += 90, i++) {
      const u = (y - VES_TOP) / (VES_BOT - VES_TOP);
      const yy = wallY(x, true) * (1 - u) + wallY(x, false) * u + (hash(n * 71 + i, 90) - 0.5) * 1.6;
      lumenHatch += `${i === 0 ? "M" : "L"}${x},${yy.toFixed(1)}`;
    }
  }
  return { skin, wallT, wallB, hairs, stipple, tissue, ticks, skinHatch, lumen, lumenHatch };
})();

// ---------------------------------------------------------------------------
// CAMERA: one keyed track (in, through, out), damped by the kit. In the
// standing pose the proventriculus is at world (660, 530).
// ---------------------------------------------------------------------------
// It is authored as ONE breath: a log-zoom RATE curve (a long soft push-in that is under way before f0 and
// lands about f50, a slow steady zoom-out glide across the valve toward the midgut, one sine hump for the
// pull-out f148-206, then a faint creep) and a pan tied to it (each zoom is about a fixed anchor, so the pan is
// linear in 1/k; the glide adds a constant drift to the left). Keys are sampled every 2 frames from those
// curves, 5 frames ahead, because the kit's damper trails its keys by about 5.
const CAM: CamKey[] = (() => {
  const C0 = { x: 532, y: 640 };
  const K0 = 1.07;
  const CA = { x: 678, y: 530 }; // inside, at the end of the push-in
  const KA = 8.1;
  const KG = 6.7; // at the end of the glide
  const CE = { x: 760, y: 990 }; // the feeding framing
  const KE = 1.5;
  const CEND = { x: 768, y: 1014 }; // the creep ends here, at k 1.58
  const KEND = 1.58;
  const OUT0 = 148;
  const OUT1 = 210;
  const N = 330;
  // the zoom rate tapers as the plate's hatching grows on screen, so the picture moves at an even pace
  const sIn = (f: number) => (f < 8 ? 1 : f < 36 ? 1 - 0.56 * ((f - 8) / 28) : f < 60 ? 0.22 * (1 + Math.cos((Math.PI * (f - 36)) / 24)) : 0);
  const sGl = (f: number) => smoothstep((f - 34) / 22) * (1 - smoothstep((f - OUT0) / 22));
  const sOut = (f: number) => (f <= OUT0 || f >= OUT1 ? 0 : Math.pow(Math.sin(Math.PI * Math.pow((f - OUT0) / (OUT1 - OUT0), 1.45)), 1.05));
  const sCr = (f: number) => smoothstep((f - 196) / 20);
  const sum = (fn: (f: number) => number, to: number) => {
    let a = 0;
    for (let f = 0; f < to; f++) a += fn(f);
    return a;
  };
  const aIn = Math.log(KA / K0) / sum(sIn, N);
  const aGl = Math.log(KG / KA) / sum(sGl, N);
  const aOut = Math.log(KE / KG) / sum(sOut, N);
  const aCr = Math.log(KEND / KE) / sum(sCr, 311);
  const VG = 48 / sum(sGl, N); // the glide drifts 48 world px to the left in all
  const at1 = (f: number) => {
    const lin = aIn * sum(sIn, f);
    const lout = aOut * sum(sOut, f);
    const kPush = K0 * Math.exp(lin);
    const wIn = (1 / kPush - 1 / KA) / (1 / K0 - 1 / KA); // 1 at f0 -> 0 inside
    const kOut = KG * Math.exp(lout);
    const wOut = (1 / kOut - 1 / KG) / (1 / KE - 1 / KG); // 0 inside -> 1 at the feeding framing
    const cr = sum(sCr, f) / sum(sCr, 311);
    const xin = CA.x + (C0.x - CA.x) * wIn - VG * sum(sGl, f);
    const yin = CA.y + (C0.y - CA.y) * wIn;
    return {
      x: xin * (1 - wOut) + CE.x * wOut + (CEND.x - CE.x) * cr,
      y: yin * (1 - wOut) + CE.y * wOut + (CEND.y - CE.y) * cr,
      k: Math.exp(Math.log(K0) + lin + aGl * sum(sGl, f) + lout + aCr * sum(sCr, f)),
    };
  };
  const keys: CamKey[] = [];
  for (let f = 0; f <= 312; f += 2) keys.push({ f, ...at1(f + 5) });
  return keys;
})();

const LUMEN = "#1F1811"; // deep umber, never black
const CAVITY = "#2A2118";
const WALL_CORE = "#30261B";

// a round-capped stroke segment centred on (x, y)
const dash = (x: number, y: number, tx: number, ty: number, len: number) =>
  `M${(x - (tx * len) / 2).toFixed(1)},${(y - (ty * len) / 2).toFixed(1)}l${(tx * len || 0.01).toFixed(2)},${(ty * len).toFixed(2)}`;

const pulse = (tau: number, up: number, down: number) => (tau <= 0 ? 0 : tau < up ? smoothstep(tau / up) : 1 - smoothstep((tau - up) / down));

const BlockedFlea: React.FC<Props> = ({ plateSrc, vignette }) => {
  const frame = useCurrentFrame();
  const cam = runCamera(CAM, frame);

  // the flea's pose
  const tipU = ramp(frame, T.tip[0], T.tip[1]);
  let pump = 0;
  T.sucks.forEach((f0) => {
    pump += 0.34 * pulse(frame - f0 + 2, 6, 12);
  });
  pump -= 0.3 * pulse(frame - T.flush + 1, 10, 22);
  [274, 292, 310].forEach((f0) => {
    pump += 0.18 * pulse(frame - f0, 8, 12);
  });
  const M = fleaMat(TILT * tipU, LIFT * (1 - tipU), pump, BITE);
  const mat = `matrix(${M.map((v) => v.toFixed(5)).join(",")})`;

  // ---- the blood, in canal coordinates -------------------------------------
  const sag = ramp(frame, T.sag[0], T.sag[1]);
  type Drop = { s: number; lf: number; r: number; len: number };
  const drops: Drop[] = [];
  const outside: Array<{ x: number; y: number; len: number }> = []; // world px, in the vessel
  let piled = 0;
  let backS = S_PLUG;
  const valveOpen = 1 - ramp(frame, 46, T.shut);

  const pileDrop = (j: number, sTravel: number, lfTravel: number, moving: number) => {
    const sj = slotS(j);
    const tau = frame - flushStart(j);
    if (tau > 0) {
      const v = flushV(j);
      const s = sj - runDist(tau, v);
      if (s > 0) {
        drops.push({ s, lf: slotL(j), r: j < N_BLOCKED ? DROP_R : BIG_R, len: Math.min(46, (runDist(tau, v) - runDist(tau - 1, v)) * 0.34) });
      } else {
        const p = vesselDrift(j, tau - runTime(sj, v));
        outside.push({ x: p.x, y: p.y, len: 2 });
      }
      return;
    }
    // it slows into its place in the pile (an eased stop, never a snap)
    const D = j < N_BLOCKED ? 26 : 130;
    const rem = sj - sTravel;
    const s = rem > D ? sTravel : sj - D * Math.exp(rem / D - 1);
    if (rem < -D) {
      piled++;
      backS = Math.min(backS, sj);
    }
    const u = smoothstep((s - (sj - 90)) / 90);
    drops.push({ s, lf: lfTravel + (slotL(j) - lfTravel) * u, r: j < N_BLOCKED ? DROP_R : BIG_R, len: moving * clamp01(rem / D) });
  };

  for (const d of STREAM) {
    const s = S_PLUG - (d.arrive - frame) * V_STREAM;
    if (s < S_M) continue;
    if (d.pile >= 0) {
      pileDrop(d.pile, s, d.lf, 0);
      continue;
    }
    if (s < S_X) {
      // through the valve, the lumen narrowing as the plug closes
      const inValve = smoothstep((s - (S_E - 40)) / 60);
      drops.push({ s, lf: d.lf * (1 - inValve * (0.95 - 0.28 * valveOpen)), r: DROP_R, len: 0 });
      continue;
    }
    // in the midgut: on to a resting place, then taken up by the wall
    const u = clamp01((s - S_X) / (d.restS - S_X));
    const ss = Math.min(s, d.restS);
    let lf = d.lf * 0.33 * (1 - smoothstep(u * 3)) * 0.6 + d.restL * 0.5 * smoothstep(u);
    let r = DROP_R;
    const ta = frame - d.absorb;
    if (ta > 0) {
      const wall = d.restL >= 0 ? 0.93 : -0.93;
      const need = Math.abs(wall - lf) * 22; // frames to reach the wall
      const k = clamp01(ta / Math.max(4, need));
      lf += (wall - lf) * k;
      r *= 1 - smoothstep((ta - need + 2) / 6);
      if (r < 0.4) continue;
    }
    drops.push({ s: ss, lf, r, len: 0 });
  }
  for (const d of SLUGS) {
    const t = frame - d.enter;
    if (t >= 0) {
      pileDrop(d.pile, runDist(t, V_SUCK), (hash(d.pile, 33) - 0.5) * 0.9, 44 * clamp01(t / ACC));
    } else {
      // still in the vessel: drifting with the stream, then drawn to the proboscis tip
      const tp = t + d.pull;
      if (tp <= 0) {
        outside.push({ x: d.home.x + V_DRIFT * tp, y: d.home.y, len: 2 });
      } else {
        const u = Math.pow(tp / d.pull, 1.7); // drawn in, gathering speed
        outside.push({ x: d.home.x + (TIP_W.x - d.home.x) * u, y: d.home.y + (TIP_W.y - d.home.y) * u, len: 2 });
      }
    }
  }
  for (const a of AMBIENT) {
    outside.push({ x: ((a.x0 + a.v * (frame + 400)) % 2600) - 800, y: a.y, len: 2 });
  }

  const swell = smoothstep(piled / 14) * (1 - ramp(frame, T.flush, T.flush + 12));
  const sBack = backS;

  // the proboscis: driven out of the mouth, straight down into the skin
  const probU = clamp01((frame - T.probe[0]) / (T.probe[1] - T.probe[0]));
  const sFrom = S_M - probU * S_M;
  const canal = canalD(sFrom, sag, swell, sBack);

  let dropD = "";
  let bigD = "";
  const small: React.ReactNode[] = [];
  drops.forEach((d, i) => {
    const hw = Math.max(1.5, halfW(d.s, d.lf >= 0 ? 1 : -1, sag, swell, sBack) - 8 - d.r * 0.75);
    const taper = d.s < 110 ? Math.pow(clamp01(d.s / 110), 0.7) * 0.8 + 0.1 : 1;
    const p = pt(d.s, d.lf * hw * taper);
    if (d.r === BIG_R) bigD += dash(p.x, p.y, p.tx, p.ty, d.len);
    else if (d.r < DROP_R - 0.01) small.push(<circle key={i} cx={p.x} cy={p.y} r={d.r} fill={INK} stroke={DARK} strokeWidth={2.5} />);
    else dropD += dash(p.x, p.y, p.tx, p.ty, d.len);
  });

  // ---- the plug and the germs torn from it ---------------------------------
  let baseD = "";
  let germD = "";
  let tornD = "";
  let tornWorldD = "";
  for (const i of MASS_ORDER) {
    const q = MASS[i];
    if (frame < q.born) continue;
    const p = massPos(i, frame);
    baseD += `M${(p.x - 15).toFixed(1)},${p.y.toFixed(1)}a15,15 0 1,0 30,0a15,15 0 1,0 -30,0`;
    germD += germ(p.x, p.y, GERM_R, q.seed);
  }

  for (const g of TORN) {
    const tau = frame - g.t;
    if (tau <= 0) continue;
    const q = MASS[g.src];
    const v = g.fast ? V_FLUSH : V_FLUSH * 0.55;
    const s = q.s - runDist(tau, v);
    if (s > 0) {
      const hw = Math.max(1, halfW(s, 0) - 8 - TORN_R);
      const lat = Math.max(-hw, Math.min(hw, q.lat * (0.25 + 0.75 * (1 - smoothstep((q.s - s) / 60))) + (hash(g.seed, 9) - 0.5) * 16 * smoothstep((q.s - s) / 80)));
      const p = pt(s, lat);
      tornD += germ(p.x, p.y, TORN_R, g.seed);
    } else {
      const p = vesselDrift(g.seed, tau - runTime(q.s, v), true);
      tornWorldD += germTurned(p.x, p.y, TORN_R * S, g.seed, p.turn);
    }
  }

  // the midgut's inner lining, and the hatch that marks it hollow once it has drained
  let lining = "";
  for (let s = S_X + 60; s < S_END - 40; s += 30) {
    for (const side of [1, -1]) {
      const hw = halfW(s, side, sag);
      const a = pt(s, side * (hw - 5));
      const b = pt(s + 5, side * (hw - 22));
      lining += `M${a.x.toFixed(1)},${a.y.toFixed(1)}L${b.x.toFixed(1)},${b.y.toFixed(1)}`;
    }
  }
  const hollow = ramp(frame, 118, 156);
  const hollowX = 2200 - hollow * 1000;

  const outD = outside.map((o) => dash(o.x, o.y, 1, 0, o.len)).join("");

  return (
    <Page vignette={vignette}>
      {/* the host: tissue, one vessel in section, the skin */}
      <WorldSvg cam={cam}>
        <path d={HOST.tissue} fill="none" stroke={INK} strokeOpacity={0.22} strokeWidth={1.6} strokeLinecap="round" />
        <path d={HOST.lumen} fill={LUMEN} fillOpacity={0.9} />
        <path d={HOST.lumenHatch} fill="none" stroke={INK} strokeOpacity={0.2} strokeWidth={1} />
        <path d={HOST.ticks} fill="none" stroke={INK} strokeOpacity={0.4} strokeWidth={1.4} />
        <path d={outD} fill="none" stroke={DARK} strokeOpacity={0.8} strokeWidth={9.6} strokeLinecap="round" />
        <path d={outD} fill="none" stroke={INK_DEEP} strokeOpacity={0.85} strokeWidth={7.6} strokeLinecap="round" />
        {tornWorldD ? (
          <g fill="none" strokeLinecap="round">
            <path d={tornWorldD} stroke={DARK} strokeWidth={2 * TORN_R * S + 2.4} />
            <path d={tornWorldD} stroke={ACCENT} strokeWidth={2 * TORN_R * S} />
          </g>
        ) : null}
        {[HOST.wallT, HOST.wallB].map((d, i) => (
          <g key={i} fill="none">
            <path d={d} stroke={DARK} strokeWidth={11.5} />
            <path d={d} stroke={INK} strokeWidth={8.6} />
            <path d={d} stroke={WALL_CORE} strokeWidth={5} />
            <path d={d} stroke={INK} strokeOpacity={0.85} strokeWidth={5} strokeDasharray="1.3 4.6" />
          </g>
        ))}
        <path d={HOST.skinHatch} fill="none" stroke={INK} strokeOpacity={0.5} strokeWidth={1.2} strokeLinecap="round" />
        <path d={HOST.stipple} fill="none" stroke={INK} strokeOpacity={0.45} strokeWidth={2.2} strokeLinecap="round" />
        <path d={HOST.hairs} fill="none" stroke={DARK} strokeWidth={4.6} strokeLinecap="round" />
        <path d={HOST.hairs} fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" />
        <path d={HOST.skin} fill="none" stroke={DARK} strokeWidth={6.6} />
        <path d={HOST.skin} fill="none" stroke={INK} strokeWidth={3} />
      </WorldSvg>

      {/* Hooke's flea */}
      <WorldDiv cam={cam}>
        <Img
          src={staticFile(plateSrc)}
          style={{ position: "absolute", left: 0, top: 0, width: PLATE_W, height: PLATE_H, maxWidth: "none", transformOrigin: "0 0", transform: mat }}
        />
      </WorldDiv>

      {/* the section cut along its gut, in the plate's own space */}
      <WorldSvg
        cam={cam}
        defs={
          <>
            <mask id="bfEdge" maskUnits="userSpaceOnUse" x={900} y={200} width={2700} height={1300}>
              <path d={WINDOW_D} fill="none" stroke="#fff" strokeWidth={150} strokeLinejoin="round" />
            </mask>
            <clipPath id="bfWindow">
              <path d={WINDOW_D} />
            </clipPath>
            <clipPath id="bfCanal">
              <path d={canal} />
            </clipPath>
            <clipPath id="bfHollow">
              <rect x={hollowX} y={300} width={2200 - hollowX} height={1100} />
            </clipPath>
          </>
        }
      >
        <g transform={mat}>
          {/* the cut body wall: a light band with short hatch and stipple, inked on both edges */}
          <path d={WINDOW_OUT_D} fill={INK} stroke={DARK} strokeWidth={5} strokeLinejoin="round" />
          <path d={WINDOW_D} fill={CAVITY} />
          <path d={BAND_TICKS} fill="none" stroke={DARK} strokeOpacity={0.8} strokeWidth={2.2} strokeLinecap="round" />
          <path d={BAND_STIPPLE} fill="none" stroke={DARK} strokeOpacity={0.7} strokeWidth={3} strokeLinecap="round" />
          {/* the body cavity: deep umber, ruled, cross-hatched toward the cut edge */}
          <g clipPath="url(#bfWindow)">
            <path d={CAVITY_HATCH} fill="none" stroke={INK} strokeOpacity={0.3} strokeWidth={2} />
            <g mask="url(#bfEdge)">
              <path d={CAVITY_CROSS} fill="none" stroke={DARK} strokeOpacity={0.85} strokeWidth={3.2} />
            </g>
          </g>
          <path d={WINDOW_D} fill="none" stroke={DARK} strokeWidth={5} strokeLinejoin="round" />

          {/* the canal: proboscis, oesophagus, proventriculus, midgut */}
          <path d={canal} fill={LUMEN} stroke={DARK} strokeWidth={19} strokeLinejoin="round" />
          <g clipPath="url(#bfCanal)">
            <path d={LUMEN_HATCH} fill="none" stroke={INK} strokeOpacity={0.15} strokeWidth={2} />
            {hollow > 0 ? (
              <g clipPath="url(#bfHollow)">
                <path d={HOLLOW_HATCH} fill="none" stroke={INK} strokeOpacity={0.34} strokeWidth={2.4} />
              </g>
            ) : null}
          </g>
          <path d={lining} fill="none" stroke={INK_DEEP} strokeOpacity={0.75} strokeWidth={2.6} strokeLinecap="round" />
          <path d={SPINES.back} fill={INK_DEEP} stroke={DARK} strokeWidth={2} strokeLinejoin="round" />
          <path d={SPINES.front} fill={INK} stroke={DARK} strokeWidth={2.2} strokeLinejoin="round" />

          <path d={dropD} fill="none" stroke={DARK} strokeWidth={2 * DROP_R + 3.4} strokeLinecap="round" />
          <path d={dropD} fill="none" stroke={INK} strokeWidth={2 * DROP_R} strokeLinecap="round" />
          <path d={bigD} fill="none" stroke={DARK} strokeWidth={2 * BIG_R + 3.6} strokeLinecap="round" />
          <path d={bigD} fill="none" stroke={INK} strokeWidth={2 * BIG_R} strokeLinecap="round" />
          {small}

          {tornD ? (
            <g fill="none" strokeLinecap="round">
              <path d={tornD} stroke={DARK} strokeWidth={2 * TORN_R + 7} />
              <path d={tornD} stroke={ACCENT} strokeWidth={2 * TORN_R} />
            </g>
          ) : null}
          <path d={baseD} fill="none" stroke={DARK} strokeWidth={7} />
          <path d={baseD} fill={ACCENT_DEEP} />
          <path d={germD} fill="none" stroke={ACCENT} strokeWidth={2 * GERM_R} strokeLinecap="round" />


          {/* the gut wall: an inked double line with short cross-hatch between the two */}
          <path d={canal} fill="none" stroke={INK} strokeWidth={13} strokeLinejoin="round" />
          <path d={canal} fill="none" stroke={WALL_CORE} strokeWidth={7.4} strokeLinejoin="round" />
          <path d={canal} fill="none" stroke={INK} strokeOpacity={0.9} strokeWidth={7.4} strokeDasharray="2.4 7.6" />
        </g>
      </WorldSvg>
    </Page>
  );
};

export default BlockedFlea;
