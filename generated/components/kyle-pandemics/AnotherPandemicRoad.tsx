// ---------------------------------------------------------------------------
// AnotherPandemicRoad (kyle-pandemics, cut 47; the brief's "47_AnotherPandemic": the component is named
// AnotherPandemicRoad because kyle-plague already holds an AnotherPandemic). Dwarkesh map style
// (styles/dwarkesh-map.md), the umber page with no map, drawn in the 3D DEPTH manner of the Kyle London clip
// (DEPTH.md): one pinhole camera, a flagged ground plane, light from the upper left, contact and cast shadows,
// atmospheric depth, parallax, painter's order. Opaque 1080x1920, 29.97 fps, 159 frames.
// World, camera and timeline: anotherPandemicWorld.ts; the goose: anotherPandemicGoose.tsx.
//
// CHECK LINE: "pandemics keep coming every few decades; the next one could be bird flu — or something we can't see yet."
//
// THE LINE: "(…to me, like,) there's going to be another pandemic, you know, maybe bird flu, maybe something else. But—"
// WORD -> FRAME (f0 = 47.014 s): going 5 · to 10 · be 18 · ANOTHER 22 · PANDEMIC 32 · you 59 · know 70 · maybe 76 ·
// BIRD 83 · FLU 92 · maybe 102 · SOMETHING 108 · ELSE 135 · but 150 (the slot ends at 159).
// DURATION: the slot 47.014 -> 52.319 s = 5.305 s x 29.97 = 159 frames (f0..f158).
//
// THE MOTION (V2): a road of pandemic years. From f0 the camera is already travelling at a steady pace down a broad
// stone-flagged way across a dim umber plain (a real dolly: the near stones sweep out of frame, the far ones hardly
// move). Rough standing stones stand back from the path, alternating left and right, each carved (from the first
// frame it is seen; the haze veils the whole stone) with its pandemic's agent above its year, centred on the face:
// an influenza A virion (round envelope, a dense fringe of HA and NA spikes) over 1918, 1957, 1968 and 2009, SARS-CoV-2
// (fewer club-shaped spikes) over 2020. Each year reads whole for 13+ frames as its stone comes near (2020 f28-40, on
// "PANDEMIC"), then crosses the frame's edge as we pass it. Ahead, in the middle of the path, stands the next stone,
// lower, carved with an H5N1 influenza virion beside "20??". The camera slows (one cosine deceleration f40-92) to it
// in the middle distance at a standing eye a little raised (2.45 m). On "BIRD FLU" a wild greylag comes in from far
// back on the upper left along its heading, beating its wings (a 10-frame stroke) to ~f80, glides, flares nose-up with
// its wings raised high and feet forward (f84), CONTACT on the stone's top at f91 (first reaction f91: its weight dips
// the body, the wings start to fold), wings folded by f100. The camera then pushes in on it (f94-158, the eye coming
// down a little to its level: d 400 -> 210; the goose ~38% of the frame wide at the cut, centred ~y 630, the carved
// row just above the caption band); the road and the dim blank stones run on beyond it into the haze on both sides.
// f140-158: the goose shifts its weight, lifts and turns its head toward us.
// The goose is real 3D geometry (anotherPandemicGoose3d.tsx, three.js through @remotion/three, rendered with
// --gl=angle) drawn through the same camera in the engraved manner. Orange = the disease: the stain and orange
// hatching through the goose's breast and belly, threads up its neck, its bill and feet. Everything else is umber,
// cream and DEAD.
// DEPTH: F 1150 px; one VP on the frame's centre line (no pitch, no yaw; lens shift: horizon y 615, lowering to 780
// in the push). Year stones ~2.1 x 3.2-3.9 x 1.0 m at X +-3.8 m; the blank stone 1.5 x 2.0 m on the centre line; the goose is a 3D model drawn through
// the same camera (anotherPandemicGoose.tsx). Light: rays (0.5, 1, 0.8) (from the upper left, a little in front):
// lit left faces, dark right faces with hatching, cast shadows to the right and away, contact shadows. Haze: haze(d).
// CAPTION BANDS: the years sit at y ~700-800, the goose at y ~380-950 on every frame (its feet ~y 920 at the cut).
// SOURCES: the years are the five pandemics since 1900 on CDC's "Past Pandemics" page (1918 influenza A/H1N1,
//   1957-58 H2N2, 1968 H3N2, 2009 H1N1pdm09) and COVID-19, declared a pandemic by the WHO Director-General on
//   11 March 2020 (WHO). Bird flu = highly pathogenic avian influenza A(H5N1), carried by wild waterfowl (CDC, "Avian
//   influenza in birds"); the goose is drawn on the greylag (Anser anser).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { loadFont as loadCaslon } from "@remotion/google-fonts/LibreCaslonText";
import { z } from "zod";
import { TexcocoPage, WorldSvg } from "../kits/maps/texcocoShared";
import { hash, mixColor } from "../kits/maps/incaShared";
import { BLANK_Z, DURATION as SLOT, F, PATH_HALF, STONE, STONES, YEAR_SIZE, YEAR_Y, LIGHT, camAt, haze, lightOf, proj, type Cam3, type Stone } from "./anotherPandemicWorld";
import { goosePoseAt } from "./anotherPandemicGoose";
import { Goose3D } from "./anotherPandemicGoose3d";

export const FPS = 30000 / 1001;
export const DURATION = SLOT;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const { fontFamily: caslon } = loadCaslon("normal", { weights: ["400"], subsets: ["latin"] });

// ---------------------------------------------------------------------------
// PALETTE (styles/dwarkesh-map.md)
// ---------------------------------------------------------------------------
const LAND = "#3F3428";
const DARK = "#17120D";
const INK = "#E9DDBF";
const INK_DEEP = "#D3C5A2";
const STONE_LIT = "#8A7759";
const STONE_DARK = "#211A13";
const PLAIN = "#6A5838";
const FLAG = "#7A6849";

type V = [number, number];
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const r1 = (v: number) => Math.round(v * 10) / 10;
const P = (q: { x: number; y: number }) => `${r1(q.x)},${r1(q.y)}`;
const ID = { k: 1, cx: 540, cy: 960 };

// ---------------------------------------------------------------------------
// THE GROUND PLANE: the plain (umber bands that sink into the page with distance) and the flagged path (three lanes of
// flags of irregular length, the long joints running to the VP, the cross joints compressing toward the horizon)
// ---------------------------------------------------------------------------
const Z_FAR = 15000;
const fadeFar = (d: number) => 1 - c01((d - 1500) / 9000);
/** near the eye the floor sinks into shadow (and its fast joints stay quiet) */
const fadeNear = (d: number) => c01((d - 170) / 380);
const LANES = [-PATH_HALF, -47, 47, PATH_HALF];
const CROSS: number[][] = LANES.slice(0, 3).map((_, l) => {
  const out: number[] = [];
  let zz = -200 + 60 * hash(l, 3);
  let k = 0;
  while (zz < Z_FAR) {
    out.push(zz);
    zz += 78 + 74 * hash(l * 31 + k, 7);
    k++;
  }
  return out;
});
const Ground: React.FC<{ c: Cam3 }> = ({ c }) => {
  const zA = c.Z + 60;
  const els: React.ReactNode[] = [];
  const NB = 18;
  for (let i = 0; i < NB; i++) {
    const za = mix(zA, c.Z + Z_FAR, Math.pow(i / NB, 1.8));
    const zb = mix(zA, c.Z + Z_FAR, Math.pow((i + 1) / NB, 1.8));
    const dm = (za + zb) / 2 - c.Z;
    const q = [proj(c, -9000, 0, za), proj(c, 9000, 0, za), proj(c, 9000, 0, zb), proj(c, -9000, 0, zb)];
    els.push(<path key={`b${i}`} d={`M${q.map(P).join("L")}Z`} fill={PLAIN} opacity={0.3 * fadeFar(dm) * mix(0.55, 1, fadeNear(dm))} />);
    const pq = [proj(c, -PATH_HALF, 0, za), proj(c, PATH_HALF, 0, za), proj(c, PATH_HALF, 0, zb), proj(c, -PATH_HALF, 0, zb)];
    els.push(<path key={`p${i}`} d={`M${pq.map(P).join("L")}Z`} fill={FLAG} opacity={0.42 * fadeFar(dm) * mix(0.5, 1, fadeNear(dm))} />);
  }
  // the long joints and the path's edges, in depth pieces that fade and thin
  const pieces = 22;
  for (let i = 0; i < pieces; i++) {
    const za = mix(zA, c.Z + 9000, Math.pow(i / pieces, 1.7));
    const zb = mix(zA, c.Z + 9000, Math.pow((i + 1) / pieces, 1.7));
    const dm = (za + zb) / 2 - c.Z;
    const a = fadeFar(dm) * fadeNear(dm);
    if (a < 0.02) continue;
    let d = "";
    LANES.forEach((X) => (d += `M${P(proj(c, X, 0, za))}L${P(proj(c, X, 0, zb))}`));
    const w = Math.max(0.6, Math.min(3.4, (2.6 * F) / 1000 / (dm / 1000)));
    els.push(<path key={`j${i}`} d={d} fill="none" stroke={DARK} strokeWidth={w} strokeOpacity={0.62 * a} strokeLinecap="round" />);
    // the kerb: a lit edge on the plain's side of each path edge
    const e = `M${P(proj(c, -PATH_HALF - 9, 0, za))}L${P(proj(c, -PATH_HALF - 9, 0, zb))}M${P(proj(c, PATH_HALF + 9, 0, za))}L${P(proj(c, PATH_HALF + 9, 0, zb))}`;
    els.push(<path key={`e${i}`} d={e} fill="none" stroke={INK_DEEP} strokeWidth={w * 0.55} strokeOpacity={0.16 * a} />);
  }
  // the cross joints, grouped by tone
  const groups: Record<string, string> = {};
  CROSS.forEach((zs, l) => {
    zs.forEach((Z) => {
      const dm = Z - c.Z;
      if (dm < 60 || dm > 9000) return;
      const a = fadeFar(dm) * fadeNear(dm);
      if (a < 0.03) return;
      const w = Math.max(0.5, Math.min(3, (2.2 * F) / dm));
      const key = `${Math.round(a * 10)}|${Math.round(w * 4)}`;
      groups[key] = (groups[key] ?? "") + `M${P(proj(c, LANES[l], 0, Z))}L${P(proj(c, LANES[l + 1], 0, Z))}`;
    });
  });
  Object.entries(groups).forEach(([key, d]) => {
    const [a10, w4] = key.split("|").map(Number);
    els.push(<path key={`x${key}`} d={d} fill="none" stroke={DARK} strokeWidth={w4 / 4} strokeOpacity={0.55 * (a10 / 10)} />);
  });
  return <g>{els}</g>;
};

/** the far edge of the plain: a low ridge at the horizon, effectively at infinity (it rides the horizon) */
const Horizon: React.FC<{ c: Cam3 }> = ({ c }) => {
  let d = `M-20,${r1(c.HZ + 2)}`;
  for (let x = -20; x <= 1100; x += 20) {
    const h = 9 + 7 * Math.sin(x / 97 + 1.3) + 5 * Math.sin(x / 41 + 0.4) + 3 * hash(Math.round(x / 20), 5);
    d += `L${x},${r1(c.HZ - h)}`;
  }
  d += `L1100,${r1(c.HZ + 2)}Z`;
  return (
    <g>
      <defs>
        <linearGradient id="ap-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={INK} stopOpacity={0} />
          <stop offset="1" stopColor={INK} stopOpacity={0.06} />
        </linearGradient>
      </defs>
      <rect x={0} y={c.HZ - 260} width={1080} height={260} fill="url(#ap-sky)" />
      <path d={d} fill="#372D22" opacity={0.85} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// GRASS TUFTS on the plain (parallax: near ones sweep by, far ones crawl): a jittered grid, never on the path
// ---------------------------------------------------------------------------
type Tuft = { X: number; Z: number; h: number; seed: number };
const TUFTS: Tuft[] = (() => {
  const out: Tuft[] = [];
  const cell = 120;
  for (let i = -22; i < 22; i++) {
    for (let j = -2; j < 110; j++) {
      const X = (i + hash(i * 131 + j, 11)) * cell;
      if (Math.abs(X) < PATH_HALF + 40) continue;
      if (hash(i * 7 + j * 13, 17) < 0.35) continue;
      out.push({ X, Z: (j + hash(i + j * 97, 13)) * cell, h: 12 + 16 * hash(i, j + 19), seed: i * 1000 + j });
    }
  }
  return out;
})();
const tuftsD = (c: Cam3, z0: number, z1: number) => {
  const groups: Record<string, string> = {};
  for (const t of TUFTS) {
    if (t.Z < z0 || t.Z >= z1) continue;
    const dm = t.Z - c.Z;
    if (dm < 140 || dm > 7000) continue;
    const b = proj(c, t.X, 0, t.Z);
    if (b.x < -60 || b.x > 1140 || b.y > 1990) continue;
    const a = fadeFar(dm) * c01((dm - 140) / 300) * (1 - haze(dm));
    if (a < 0.04) continue;
    const w = Math.max(0.6, Math.min(2.6, 0.9 * b.s));
    const key = `${Math.round(a * 8)}|${Math.round(w * 4)}`;
    let d = "";
    for (let k = 0; k < 4; k++) {
      const lean = (k - 1.5) * 4 + 4 * (hash(t.seed, k) - 0.5);
      const hh = t.h * (0.6 + 0.5 * hash(t.seed, k + 5));
      const bx = b.x + (k - 1.5) * 2.2 * b.s;
      d += `M${r1(bx)},${r1(b.y)}Q${r1(bx + lean * 0.3 * b.s)},${r1(b.y - hh * 0.6 * b.s)} ${r1(bx + lean * b.s)},${r1(b.y - hh * b.s)}`;
    }
    groups[key] = (groups[key] ?? "") + d;
  }
  return Object.entries(groups).map(([key, d]) => {
    const [a8, w4] = key.split("|").map(Number);
    return <path key={`t${z0}-${key}`} d={d} fill="none" stroke={INK_DEEP} strokeWidth={w4 / 4} strokeOpacity={0.3 * (a8 / 8)} strokeLinecap="round" />;
  });
};

// ---------------------------------------------------------------------------
// A STANDING STONE: a slab (front outline extruded by T), the faces the eye sees, each lit by the one light, hatching
// on the faces turned away, a contact shadow and a cast shadow on the ground, the year cut into its face
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// THE CARVINGS: each year stone carries its pandemic's agent, engraved in cream line (no colour), above its year:
// 1918, 1957, 1968, 2009 an influenza A virion (a round envelope with a dense fringe of HA "lollipop" and NA "box"
// spikes, the coiled RNP segments inside); 2020 SARS-CoV-2 (a round envelope with fewer, longer club-shaped spike
// proteins). The blank stone in the path: the H5N1 influenza virion beside "20??" in one row under its top.
// ---------------------------------------------------------------------------
type Carving = { kind: "flu" | "covid"; vx: number; vy: number; vr: number; text: string; tx: number; ty: number; size: number };
const carvingOf = (st: Stone): Carving | null => {
  if (st.year) {
    const vr = st.W * 0.15; // the portrait ~30% of the face's width
    return { kind: st.year === "2020" ? "covid" : "flu", vx: 0, vy: YEAR_Y - YEAR_SIZE * 0.42 - 16 - vr, vr, text: st.year, tx: 0, ty: YEAR_Y, size: YEAR_SIZE };
  }
  if (st.blank === "path") {
    const vr = 13.5;
    return { kind: "flu", vx: -st.W * 0.28, vy: -st.H + 19, vr, text: "20??", tx: st.W * 0.1, ty: -st.H + 19, size: 28 };
  }
  return null;
};
/** a virion as one path (screen px; centre cx, cy; radius r) */
const virionD = (kind: "flu" | "covid", cx: number, cy: number, r: number) => {
  const P2 = (a: number, rr: number) => `${r1(cx + Math.cos(a) * rr)},${r1(cy + Math.sin(a) * rr)}`;
  let d = "";
  const env = kind === "flu" ? 0.68 : 0.62;
  // the envelope: a circle drawn as a polygon of short arcs
  const ring = (rr: number) => {
    let q = "";
    for (let i = 0; i <= 36; i++) q += `${i ? "L" : "M"}${P2((i / 36) * 2 * Math.PI, rr)}`;
    return q;
  };
  d += ring(env * r);
  if (kind === "flu") {
    // a dense fringe: HA spikes (a stalk with a small round head) alternating with NA spikes (a stalk with a cross bar)
    const n = 30;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * 2 * Math.PI + 0.05;
      const tip = (i % 2 ? 0.93 : 0.97) * r;
      d += `M${P2(a, env * r)}L${P2(a, tip)}`;
      if (i % 2 === 0) {
        const hc = (tip + 0.035 * r) / r;
        d += `M${P2(a - 0.045, hc * r)}L${P2(a + 0.045, hc * r)}`;
      } else {
        const tx = Math.cos(a + Math.PI / 2) * 0.05 * r;
        const ty = Math.sin(a + Math.PI / 2) * 0.05 * r;
        const ex = cx + Math.cos(a) * tip;
        const ey = cy + Math.sin(a) * tip;
        d += `M${r1(ex - tx)},${r1(ey - ty)}L${r1(ex + tx)},${r1(ey + ty)}`;
      }
    }
    // the eight RNP segments inside: short coiled strokes
    for (let k = 0; k < 7; k++) {
      const a = (k / 7) * 2 * Math.PI + 0.4;
      const rr = (k === 6 ? 0 : 0.34) * r;
      const x0 = cx + Math.cos(a) * rr;
      const y0 = cy + Math.sin(a) * rr;
      const L = 0.2 * r;
      const ang = a + Math.PI / 2;
      const ux = Math.cos(ang) * L;
      const uy = Math.sin(ang) * L;
      d += `M${r1(x0 - ux)},${r1(y0 - uy)}Q${r1(x0 + uy * 0.5)},${r1(y0 - ux * 0.5)} ${r1(x0)},${r1(y0)}T${r1(x0 + ux)},${r1(y0 + uy)}`;
    }
  } else {
    // SARS-CoV-2: fewer, longer spike proteins, each a stalk ending in a club
    const n = 14;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * 2 * Math.PI + 0.12;
      d += `M${P2(a, env * r)}L${P2(a, 0.84 * r)}`;
      const ccx = cx + Math.cos(a) * 0.91 * r;
      const ccy = cy + Math.sin(a) * 0.91 * r;
      const cr = 0.085 * r;
      d += `M${r1(ccx - cr)},${r1(ccy)}A${r1(cr)},${r1(cr)} 0 1 0 ${r1(ccx + cr)},${r1(ccy)}A${r1(cr)},${r1(cr)} 0 1 0 ${r1(ccx - cr)},${r1(ccy)}`;
    }
    // the RNA inside: a few small loops
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * 2 * Math.PI + 0.9;
      const x0 = cx + Math.cos(a) * 0.3 * r;
      const y0 = cy + Math.sin(a) * 0.3 * r;
      const cr = 0.07 * r;
      d += `M${r1(x0 - cr)},${r1(y0)}A${r1(cr)},${r1(cr)} 0 1 0 ${r1(x0 + cr)},${r1(y0)}A${r1(cr)},${r1(cr)} 0 1 0 ${r1(x0 - cr)},${r1(y0)}`;
    }
  }
  return d;
};

const outline = (st: Stone): V[] => {
  const H = st.H;
  const W = st.W;
  const h = (k: number) => hash(st.seed * 17 + k, 23) - 0.5;
  // the blank stone in the path: the same rough pillar, its top broken but level (the goose stands on it)
  if (st.blank === "path")
    return [
      [-W / 2, 0],
      [-W / 2 - 3, -H * 0.4],
      [-W / 2 + 6, -H * 0.78],
      [-W * 0.32, -H * 0.96],
      [-W * 0.1, -H],
      [W * 0.22, -H + 2],
      [W * 0.36, -H * 0.9],
      [W / 2 + 2, -H * 0.45],
      [W / 2, 0],
    ];
  // a rough standing stone (a menhir): a tall, thick pillar, a little lumpy down its sides, its top a broken slant
  // (one shoulder high, the other well down, a chip between); it leans a little; the slant and lean alternate stone
  // to stone. Never a slab with a rounded headstone top.
  const m = st.seed % 2 === 0 ? 1 : -1;
  const lean = (4 + 4 * h(11)) / H; // x shift per unit of height
  const pts: V[] = [
    [-W / 2, 0],
    [-W / 2 - 4 + 8 * h(1), -H * 0.35],
    [-W / 2 + 2 + 8 * h(2), -H * 0.74],
    [-W * 0.38 + 8 * h(3), -H * (0.97 + 0.03 * h(4))],
    [-W * 0.14 + 10 * h(5), -H],
    [W * 0.12 + 10 * h(6), -H * (0.9 + 0.04 * h(7))],
    [W * 0.42 + 6 * h(8), -H * (0.7 + 0.05 * h(9))],
    [W / 2 + 3 * h(10), -H * 0.4],
    [W / 2, 0],
  ];
  const leant = pts.map(([x, y]) => [x - y * lean, y] as V);
  return m === 1 ? leant : leant.map(([x, y]) => [-x, y] as V).reverse();
};
const hatchD = (q: { x: number; y: number }[], gap: number, ang: number) => {
  const xs = q.map((v) => v.x);
  const ys = q.map((v) => v.y);
  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs);
  const y0 = Math.min(...ys);
  const y1 = Math.max(...ys);
  const a = (ang * Math.PI) / 180;
  const dx = Math.cos(a);
  const dy = Math.sin(a);
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const R = Math.hypot(x1 - x0, y1 - y0) / 2 + 2;
  let d = "";
  for (let o = -R; o <= R; o += gap) d += `M${r1(cx - dy * o - dx * R)},${r1(cy + dx * o - dy * R)}L${r1(cx - dy * o + dx * R)},${r1(cy + dx * o + dy * R)}`;
  return d;
};
const StoneShadow: React.FC<{ c: Cam3; st: Stone }> = ({ c, st }) => {
  const d = st.Z - c.Z;
  if (d < 30) return null;
  const h = haze(d);
  const o = outline(st);
  // the cast shadow: the slab's top edge carried along the light onto the ground (right and away), joined to its foot
  const top = o.filter((p) => p[1] < -st.H * 0.6);
  const sh = (X: number, Y: number, Z: number) => proj(c, X - (LIGHT[0] * Y) / LIGHT[1], 0, Z - (LIGHT[2] * Y) / LIGHT[1]);
  const ring = [
    proj(c, st.X + st.W / 2, 0, st.Z),
    ...top.map((p) => sh(st.X + p[0], p[1], st.Z + STONE.T)).reverse(),
    proj(c, st.X - st.W / 2, 0, st.Z + STONE.T),
    proj(c, st.X + st.W / 2, 0, st.Z + STONE.T),
  ];
  const fp = proj(c, st.X + 20, 0, st.Z + STONE.T * 0.4);
  const rx = (st.W / 2 + 26) * fp.s;
  const ry = Math.max(1, (proj(c, st.X, 0, st.Z - 34).y - proj(c, st.X, 0, st.Z + STONE.T + 34).y) / 2);
  const uid = `ap-cs${st.seed}`;
  return (
    <g opacity={1 - h}>
      <defs>
        <radialGradient id={uid}>
          <stop offset="0" stopColor={DARK} stopOpacity={0.8} />
          <stop offset="0.6" stopColor={DARK} stopOpacity={0.5} />
          <stop offset="1" stopColor={DARK} stopOpacity={0} />
        </radialGradient>
      </defs>
      <path d={`M${ring.map(P).join("L")}Z`} fill={DARK} opacity={0.26} />
      <ellipse cx={fp.x} cy={fp.y} rx={rx} ry={ry} fill={`url(#${uid})`} />
    </g>
  );
};
const StandingStone: React.FC<{ c: Cam3; st: Stone }> = ({ c, st }) => {
  const d = st.Z - c.Z;
  if (d < 30) return null;
  const o = outline(st);
  const front = o.map((p) => proj(c, st.X + p[0], p[1], st.Z));
  const back = o.map((p) => proj(c, st.X + p[0], p[1], st.Z + STONE.T));
  if (Math.max(...front.map((p) => p.x)) < -40 || Math.min(...front.map((p) => p.x)) > 1120) return null;
  const s = front[0].s;
  const sw = Math.max(0.7, Math.min(3.2, 2.3 * (s / 1.6) ** 0.6));
  const els: React.ReactNode[] = [];
  // the side faces: each edge of the outline (but the foot) extruded back; drawn when it faces the eye
  for (let i = 0; i < o.length - 1; i++) {
    const a = o[i];
    const b = o[i + 1];
    const ex = b[0] - a[0];
    const ey = b[1] - a[1];
    const L = Math.hypot(ex, ey);
    const n: [number, number, number] = [ey / L, -ex / L, 0];
    const mx = st.X + (a[0] + b[0]) / 2;
    const my = (a[1] + b[1]) / 2;
    const vis = (mx - c.X) * n[0] + (my - c.eye) * n[1] < 0;
    if (!vis) continue;
    const lit = lightOf(n);
    const q = [front[i], front[i + 1], back[i + 1], back[i]];
    const qd = `M${q.map(P).join("L")}Z`;
    els.push(<path key={`s${i}`} d={qd} fill={mixColor(STONE_DARK, STONE_LIT, lit)} stroke={DARK} strokeWidth={sw} strokeLinejoin="round" />);
    if (lit < 0.45) {
      els.push(
        <g key={`h${i}`}>
          <clipPath id={`ap-sc${st.seed}-${i}`}>
            <path d={qd} />
          </clipPath>
          <path d={hatchD(q, Math.max(2.2, 2.6 * s), 100)} clipPath={`url(#ap-sc${st.seed}-${i})`} stroke={DARK} strokeWidth={Math.max(0.5, 0.75 * s)} strokeOpacity={0.4} fill="none" />
        </g>,
      );
    }
  }
  // the front face, lit, with a fine cream edge on its lit (upper left) edges and a few chisel marks
  const fd = `M${front.map(P).join("L")}Z`;
  const frontFill = mixColor(STONE_DARK, STONE_LIT, lightOf([0, 0, -1]));
  els.push(<path key="f" d={fd} fill={frontFill} opacity={1} stroke={DARK} strokeWidth={sw} strokeLinejoin="round" />);
  const litEdge = `M${P(front[0])}L${P(front[1])}L${P(front[2])}L${P(front[3])}L${P(front[4])}`;
  els.push(<path key="le" d={litEdge} fill="none" stroke={INK_DEEP} strokeWidth={sw * 0.7} strokeOpacity={0.42} strokeLinejoin="round" />);
  let marks = "";
  for (let k = 0; k < 7; k++) {
    const u = hash(st.seed * 5 + k, 31);
    const v = hash(st.seed * 9 + k, 37);
    const X = st.X + (u - 0.5) * st.W * 0.78;
    const Y = -st.H * (0.08 + 0.84 * v);
    if (st.year && Y < YEAR_Y + 46) continue;
    if (st.blank === "path" && Y < -st.H + 50) continue;
    const a = proj(c, X, Y, st.Z);
    const len = (8 + 14 * hash(k, st.seed)) * a.s;
    marks += `M${r1(a.x)},${r1(a.y)}l${r1(len)},${r1(len * 0.18)}`;
  }
  els.push(<path key="m" d={marks} stroke={INK_DEEP} strokeWidth={Math.max(0.5, 0.8 * s)} strokeOpacity={0.16} fill="none" />);
  // the carving: the agent's portrait above and the year below, cut into the face from the first frame the stone is
  // seen (the haze veils the whole stone, carving and all); the blank stone in the path carries one row, H5N1 + "20??"
  const cv = carvingOf(st);
  if (cv) {
    const incise = (d: string, w: number, key: string) => (
      <g key={key}>
        <path d={d} transform={`translate(${r1(-1.3 * s)} ${r1(-1.3 * s)})`} stroke={DARK} strokeWidth={w} strokeOpacity={0.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d={d} transform={`translate(${r1(0.8 * s)} ${r1(0.8 * s)})`} stroke={INK} strokeWidth={w * 0.8} strokeOpacity={0.55} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d={d} stroke={INK_DEEP} strokeWidth={w} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    );
    const vc = proj(c, st.X + cv.vx, cv.vy, st.Z);
    els.push(incise(virionD(cv.kind, vc.x, vc.y, cv.vr * vc.s), Math.max(0.6, Math.min(3.4, 1.6 * vc.s)), "v"));
    const t = proj(c, st.X + cv.tx, cv.ty, st.Z);
    const fs = cv.size * t.s;
    const ty = t.y + fs * 0.34;
    const common = { x: t.x, textAnchor: "middle" as const, fontSize: fs, fontFamily: caslon, style: { fontVariantNumeric: "lining-nums" as const, letterSpacing: `${0.04 * fs}px` } };
    els.push(
      <g key="y">
        <text {...common} y={ty - 1.4 * t.s} dx={-1.4 * t.s} fill={DARK} opacity={0.85}>
          {cv.text}
        </text>
        <text {...common} y={ty + 1.0 * t.s} dx={1.0 * t.s} fill={INK} opacity={0.9}>
          {cv.text}
        </text>
        <text {...common} y={ty} fill={INK_DEEP}>
          {cv.text}
        </text>
      </g>,
    );
  }
  return <g>{els}</g>;
};
/** haze on a whole stone: a veil of the page tone over it (the stone's silhouette) */
const StoneVeil: React.FC<{ c: Cam3; st: Stone }> = ({ c, st }) => {
  const d = st.Z - c.Z;
  const h = haze(d);
  if (h < 0.01 || d < 30) return null;
  const o = outline(st);
  const front = o.map((p) => proj(c, st.X + p[0], p[1], st.Z));
  const back = o.map((p) => proj(c, st.X + p[0], p[1], st.Z + STONE.T));
  const all = [...front, ...back];
  // the convex silhouette of front + back
  const pts = all.map((p) => [p.x, p.y] as V).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o2: V, a: V, b: V) => (a[0] - o2[0]) * (b[1] - o2[1]) - (a[1] - o2[1]) * (b[0] - o2[0]);
  const lo: V[] = [];
  pts.forEach((q) => {
    while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
    lo.push(q);
  });
  const hi: V[] = [];
  pts.slice().reverse().forEach((q) => {
    while (hi.length >= 2 && cr(hi[hi.length - 2], hi[hi.length - 1], q) <= 0) hi.pop();
    hi.push(q);
  });
  const hull = [...lo.slice(0, -1), ...hi.slice(0, -1)];
  return <path d={`M${hull.map((q) => `${r1(q[0])},${r1(q[1])}`).join("L")}Z`} fill={LAND} opacity={h} stroke={LAND} strokeWidth={1.5} strokeOpacity={h} />;
};

// ---------------------------------------------------------------------------
// THE CUT
// ---------------------------------------------------------------------------
const AnotherPandemicRoad: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const c = camAt(frame);
  // painter's order: far to near; the goose stands on (draws just after) the blank stone
  const order = STONES.slice().sort((a, b) => b.Z - a.Z);
  const pose = goosePoseAt(frame);
  const gp = pose ? pose.pos : [0, -9000, BLANK_Z];
  const blank = STONES.find((s) => s.blank === "path")!;
  // the goose's contact shadow on the stone's top (it firms up as the feet come down)
  const hAbove = -blank.H - gp[1];
  const shAmt = c01(1 - Math.abs(hAbove) / 90) * c01((frame - 80) / 6);
  const sc = proj(c, gp[0] + 8, -blank.H, blank.Z + STONE.T * 0.42);
  const scy = (proj(c, 0, -blank.H, blank.Z + STONE.T * 0.15).y - proj(c, 0, -blank.H, blank.Z + STONE.T * 0.95).y) / 2;
  const els: React.ReactNode[] = [];
  let zPrev = c.Z + Z_FAR;
  order.forEach((st) => {
    els.push(<g key={`tf${st.seed}`}>{tuftsD(c, st.Z + STONE.T, zPrev)}</g>);
    zPrev = st.Z + STONE.T;
    els.push(<StandingStone key={`st${st.seed}`} c={c} st={st} />);
    els.push(<StoneVeil key={`sv${st.seed}`} c={c} st={st} />);
    if (st === blank) {
      els.push(
        <g key="goose">
          {shAmt > 0.01 ? <ellipse cx={sc.x} cy={sc.y} rx={30 * sc.s} ry={Math.max(1, scy * 0.75)} fill={DARK} opacity={0.5 * shAmt} /> : null}
        </g>,
      );
    }
  });
  els.push(<g key="tf-near">{tuftsD(c, c.Z, zPrev)}</g>);
  return (
    <TexcocoPage cam={ID}>
      <WorldSvg cam={ID}>
        <Horizon c={c} />
        <Ground c={c} />
        {order.map((st) => (
          <StoneShadow key={`sh${st.seed}`} c={c} st={st} />
        ))}
        {els}
      </WorldSvg>
      {pose ? <Goose3D cam={c} pose={pose} /> : null}
    </TexcocoPage>
  );
};

export { BLANK_Z };
export default AnotherPandemicRoad;
