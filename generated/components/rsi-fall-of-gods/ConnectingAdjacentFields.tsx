// ---------------------------------------------------------------------------
// ConnectingAdjacentFields (rsi-fall-of-gods, cut 90). Dwarkesh style (styles/dwarkesh.md).
// Opaque 1080x1920, 23.976 fps, 168 frames.
//
// CHECK LINE: "the AI keeps tirelessly stringing links between many neighbouring fields, and each new link turns
// up an easy win — a ton of them."
//
// THE LINE: "Which is unlocking a ton of low-hanging fruit by applying a combination of incredible persistence and
// a superhuman capacity to connect ideas from lots of adjacent domains."
// WORD -> FRAME (Whisper 2-7 f early): Which -10 · is -1 · unlocking 7 · a 23 · ton 34 · of 40 · low-hanging 45 ·
// fruit 54 · by 60 · applying 70 · a 81 · combination 86 · of 93 · incredible 103 · persistence 109 · and 123 ·
// a 134 · superhuman 136 · capacity 148 · to 156 · (connect 168 · ideas 175 play over the speaker).
// DURATION: the slot 90.382 -> 97.389 s = 7.007 s x 23.976 = 168 frames (f0..f167).
//
// THE MOTION: the AI (rev 3, the user's note: the OpenAI mark, filled ACCENT, upright, breathing, ~2.3x the old
// dot's radius, nothing behind it) sits at the hub of a loose, grown cluster of white
// station rings, each a neighbouring field (atom, dna, cpu, sigma, flask, brain nearest; telescope, microscope,
// sprout, magnet, globe, pill further out). Seats are hashed Poisson-disc (dense near the hub, sparser outward),
// and each field links only to its 2-4 real neighbours (Gabriel graph, planar), so threads run at varied angles
// and lengths. The AI never stops sending: a packet leaves the hub, runs out through the web it has built and, at
// the frontier, draws a new thread (white head) from one field to a neighbour; the moment the thread joins them a
// small bunch of orange berries (1-3, cherries on stems from one point, ~25 screen px each at rest) buds out of
// its middle and hangs there for good. Sends ride ONE escalation curve (one every ~2.2 f at f0, ~1.1 f from
// ~f100), ordered outward by distance from the hub plus a hash jitter. The camera is one continuous pull-back from
// f0 (k 1.8 -> ~0.965 in log space, firm by "ton", main travel ~f40-140, then a creep) that opens on the hub and
// four fields and reveals the rest bleeding off the edges. The mark holds its screen size against the zoom (~265
// px across at the open, ~195 at the end); every spoke and packet leaves from and returns to its edge. From ~f145
// the lit web is resolved; the frontier's sends keep running out past the frame to f167.
//
// CAUSE -> EFFECT: sends start at T0 = -8, so at f0 the first spokes are DRAWING out of the hub (heads
// travelling) toward the four opening fields. The first field-to-field thread (atom -> dna) chases the first
// spoke's head out of the hub; it leaves atom's ring at f9 and its head touches dna's ring at tc = 13.5 (the
// contact); the stems start out of the thread's midpoint on tc + 1 (f15), berries full by ~f24. A traveller may
// ride a thread still being drawn but never overtakes its head (one speed for all). Visible fruiting links: 4 by
// f34 ("ton"), ~13 by f86, 28 by f167.
// CAPTION BANDS (checked every frame with the sway): the mark never enters them; no field icon is in them at
// f0-42 or from f158 to the end. During the pull-back three fields (flask f50-124, brain f59-157, magnet
// f82-126) cross them as texture, which the brief allows.
//
// Orange = the AI, nothing else (the hub, its packets, threads and finds); white = the fields (people's knowledge).
// Stations stay white: the threads and the fruit carry the orange.
//
// SOURCES: icons are lucide-static v1.71.0 (ISC), unpkg.com/lucide-static@latest/icons/<name>.svg, inlined
// verbatim. No figures.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  BG_BASE,
  BG_DIM,
  GridBackground,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  breath,
  camEase,
  clamp01,
  hash,
  iconShadow,
  runCamera,
  smoothstep,
  sway,
  worldTransform,
} from "../kits/dwarkesh/fieldShared";
import { INK, INK_HI, LINK_IDLE, LINK_LIVE, worldPx } from "../kits/dwarkesh/alignShared";
import { OPENAI } from "../kits/dwarkesh/brandGlyphs";
import { MODEL_SHADOW_OPACITY } from "../kits/dwarkesh/trapShared";

export const FPS = 24000 / 1001;
export const DURATION = 168;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// --- sizes: SCREEN px at the resting zoom K_REST (world px = screen px at k 1) --------------------------------
const K_REST = 1;
const STROKE = worldPx(6.25, K_REST); // rings and icons: the one weight
const THREAD = worldPx(3.25, K_REST); // threads and stems: half of it
const STATION_R = worldPx(65, K_REST); // a field's ring
const GLYPH = 0.6; // icon box as a fraction of the ring's diameter
// The AI. Its world radius never lets its SCREEN radius fall below HUB_SCREEN_MIN as the camera pulls back, so
// it stays the focal point to the last frame (soft max of the two, no corner): 57 screen px radius at the open,
// ~42 (85 across) at the end.
const HUB_R0 = 30;
const HUB_SCREEN_MIN = 40;
const hubR = (k: number) => Math.pow(HUB_R0 ** 4 + (HUB_SCREEN_MIN / k) ** 4, 0.25);
// The AI is drawn as the OpenAI mark (the user's note), filled ACCENT, upright, breathing, with nothing behind it.
// Its half-width is MARK_SCALE x the old hub dot's radius, so it keeps hubR's hold against the zoom: ~119 screen
// px half-width at the open, ~92 at the end. Spokes and packets leave from and arrive at its edge (MARK_EDGE of
// the half em: the blossom's outer lobes, measured off the path, reach ~0.92 of the 24 box's half).
const MARK_SCALE = 2.3;
const MARK_EDGE = 0.92;
const markHalf = (k: number) => MARK_SCALE * hubR(k);
const markEdge = (k: number) => markHalf(k) * MARK_EDGE;
const PACKET_R = worldPx(3.6, K_REST);
const HEAD_R = worldPx(4.2, K_REST); // the white head of a thread being drawn
const FRUIT_R = worldPx(12.5, K_REST); // a berry ~24 screen px across at rest
const STEM = worldPx(24, K_REST); // midpoint of the thread -> centre of the fruit
// Packets and drawing heads travel at one SCREEN speed (under the 45 px/f strobe ceiling), so in world px they
// speed up as the camera pulls back: ODO(t) is the distance a traveller covers from T0 to t.
const SCREEN_V = 44;

// --- the icons (lucide-static v1.71.0, ISC, verbatim) ---------------------------------------------------------
const ICONS: Record<string, string> = {
  atom: `<circle cx="12" cy="12" r="1"/><path d="M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5Z"/><path d="M15.7 15.7c4.52-4.54 6.54-9.87 4.5-11.9-2.03-2.04-7.36-.02-11.9 4.5-4.52 4.54-6.54 9.87-4.5 11.9 2.03 2.04 7.36.02 11.9-4.5Z"/>`,
  dna: `<path d="m10 16 1.5 1.5"/><path d="m14 8-1.5-1.5"/><path d="M15 2c-1.798 1.998-2.518 3.995-2.807 5.993"/><path d="m16.5 10.5 1 1"/><path d="m17 6-2.891-2.891"/><path d="M2 15c6.667-6 13.333 0 20-6"/><path d="m20 9 .891.891"/><path d="M3.109 14.109 4 15"/><path d="m6.5 12.5 1 1"/><path d="m7 18 2.891 2.891"/><path d="M9 22c1.798-1.998 2.518-3.995 2.807-5.993"/>`,
  cpu: `<path d="M12 20v2"/><path d="M12 2v2"/><path d="M17 20v2"/><path d="M17 2v2"/><path d="M2 12h2"/><path d="M2 17h2"/><path d="M2 7h2"/><path d="M20 12h2"/><path d="M20 17h2"/><path d="M20 7h2"/><path d="M7 20v2"/><path d="M7 2v2"/><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="8" y="8" width="8" height="8" rx="1"/>`,
  sigma: `<path d="M18 7V5a1 1 0 0 0-1-1H6.5a.5.5 0 0 0-.4.8l4.5 6a2 2 0 0 1 0 2.4l-4.5 6a.5.5 0 0 0 .4.8H17a1 1 0 0 0 1-1v-2"/>`,
  flask: `<path d="M14 2v6a2 2 0 0 0 .245.96l5.51 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.755-2.96l5.51-10.08A2 2 0 0 0 10 8V2"/><path d="M6.453 15h11.094"/><path d="M8.5 2h7"/>`,
  brain: `<path d="M12 18V5"/><path d="M15 13a4.17 4.17 0 01-3-4 4.17 4.17 0 01-3 4"/><path d="M17.707 6.294A3 3 0 1012 5a3 3 0 10-5.707 1.294"/><path d="M17.996 5.125a4 4 0 012.526 5.77"/><path d="M18 18a4 4 0 002-7.465"/><path d="M19.967 17.482a4 4 0 11-7.967.517 4 4 0 11-7.967-.517"/><path d="M6 18a4 4 0 01-2-7.465"/><path d="M6.004 5.125a4 4 0 00-2.526 5.77"/>`,
  telescope: `<path d="m10.065 12.493-6.18 1.318a.934.934 0 0 1-1.108-.702l-.537-2.15a1.07 1.07 0 0 1 .691-1.265l13.504-4.44"/><path d="m13.56 11.747 4.332-.924"/><path d="m16 21-3.105-6.21"/><path d="M16.485 5.94a2 2 0 0 1 1.455-2.425l1.09-.272a1 1 0 0 1 1.212.727l1.515 6.06a1 1 0 0 1-.727 1.213l-1.09.272a2 2 0 0 1-2.425-1.455z"/><path d="m6.158 8.633 1.114 4.456"/><path d="m8 21 3.105-6.21"/><circle cx="12" cy="13" r="2"/>`,
  microscope: `<path d="M6 18h8"/><path d="M3 22h18"/><path d="M14 22a7 7 0 1 0 0-14h-1"/><path d="M9 14h2"/><path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z"/><path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3"/>`,
  sprout: `<path d="M14 9.536V7a4 4 0 0 1 4-4h1.5a.5.5 0 0 1 .5.5V5a4 4 0 0 1-4 4 4 4 0 0 0-4 4c0 2 1 3 1 5a5 5 0 0 1-1 3"/><path d="M4 9a5 5 0 0 1 8 4 5 5 0 0 1-8-4"/><path d="M5 21h14"/>`,
  magnet: `<path d="m12 15 4 4"/><path d="M2.352 10.648a1.205 1.205 0 0 0 0 1.704l2.296 2.296a1.205 1.205 0 0 0 1.704 0l6.029-6.029a1 1 0 1 1 3 3l-6.029 6.029a1.205 1.205 0 0 0 0 1.704l2.296 2.296a1.205 1.205 0 0 0 1.704 0l6.365-6.367A1 1 0 0 0 8.716 4.282z"/><path d="m5 8 4 4"/>`,
  globe: `<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>`,
  pill: `<path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/>`,
};
// The first six fields around the hub are the brief's; the rest fill outward with no two neighbours alike.
const FIRST = ["atom", "dna", "cpu", "sigma", "flask", "brain"];
const ALL = Object.keys(ICONS);

// --- the camera: ONE continuous pull-back from f0 (gentle start, firm by "ton", main travel ~f40-140), then a
// creep to the last frame. k 1.8 -> ~0.965, in log space so the opening never reads as a hold.
const K_OPEN = 1.8;
const K_END = 1.0;
const FOCUS_SCREEN_Y = 900; // the hub's screen height throughout
const CAM_F: number[] = [];
const CAM_CY: number[] = [];
const CAM_K: number[] = [];
for (let f = 0; f <= DURATION; f++) {
  const g = camEase(f / 140, 0.9);
  const creep = 1 - 0.035 * smoothstep((f - 112) / 56);
  const k = Math.exp(Math.log(K_OPEN) + (Math.log(K_END) - Math.log(K_OPEN)) * g) * creep;
  CAM_F.push(f);
  CAM_K.push(k);
  CAM_CY.push(900 + (960 - FOCUS_SCREEN_Y) / k);
}
const CAM_FIN = runCamera(DURATION - 1, CAM_F, CAM_CY, CAM_K);

// --- the world -------------------------------------------------------------------------------------------------
// The hub at world (540, 900). The fields are seated by hashed dart-throwing (a maximal Poisson-disc set): no
// lattice, uneven spacing that grows with distance from the hub (a loose cluster, dense near the AI, sparse
// outward). A candidate seat is refused if, at the LAST frame's camera, its centre falls in a caption band, or if
// at the first or last frame its ring would show only as a sliver at the frame edge.
const HUB = { x: 540, y: 900 };
type Node = { x: number; y: number; icon: string; hub: boolean };
const NODES: Node[] = [{ x: HUB.x, y: HUB.y, icon: "", hub: true }];
const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);
const SEED = 7; // chosen from 20 seeds: 2 fields above and 2 below the hub at the open, first fruit f14
const spacing = (r: number) => Math.min(188 + 0.17 * r, 330);
const HUB_CLEAR = 232;
const screenOf = (p: { x: number; y: number }, cy: number, k: number) => ({
  x: 540 + (p.x - 540) * k,
  y: 960 + (p.y - cy) * k,
});
/** how far a ring's centre sits inside the frame (negative = outside), in screen px */
const inset = (p: { x: number; y: number }, cy: number, k: number) => {
  const q = screenOf(p, cy, k);
  return Math.min(q.x, 1080 - q.x, q.y, 1920 - q.y);
};
(() => {
  for (let i = 0; i < 14000; i++) {
    const c = { x: -1100 + hash(i + SEED * 14000, 101) * 3300, y: -1300 + hash(i + SEED * 14000, 103) * 4400 };
    const r = dist(c, HUB);
    if (r < HUB_CLEAR) continue;
    const sc = spacing(r);
    if (NODES.some((n, j) => j > 0 && dist(n, c) < (sc + spacing(dist(n, HUB))) / 2)) continue;
    const yEnd = screenOf(c, CAM_FIN.cy, CAM_FIN.k).y;
    const yOpen = screenOf(c, CAM_CY[0], K_OPEN).y;
    const inBand = (y: number) => (y > 1050 && y < 1272) || (y > 1343 && y < 1488);
    if (inBand(yEnd) || inBand(yOpen)) continue;
    const rOpen = STATION_R * K_OPEN;
    const inOpen = inset(c, CAM_CY[0], K_OPEN);
    if (inOpen > -rOpen * 1.05 && inOpen < rOpen * 1.1) continue; // fully in or fully out at the open
    const rEnd = STATION_R * CAM_FIN.k;
    const inEnd = inset(c, CAM_FIN.cy, CAM_FIN.k);
    if (inEnd > -rEnd * 0.95 && inEnd < -rEnd * 0.2) continue; // no slivers at the end; bleeding halves are fine
    NODES.push({ x: c.x, y: c.y, icon: "", hub: false });
  }
  // A field seated in the narrow gap between the bands is nudged so its whole ICON clears both bands at rest
  // (centre within 1250 + g .. 1360 - g, g = the icon's half box at the last frame's zoom plus sway), not just its centre.
  const g = STATION_R * GLYPH * CAM_FIN.k + 7; // + the sway (5) and 2 px of air
  NODES.forEach((n) => {
    if (n.hub) return;
    const y = screenOf(n, CAM_FIN.cy, CAM_FIN.k).y;
    if (y < 1250 || y > 1360) return;
    const yc = Math.min(1360 - g, Math.max(1250 + g, y));
    n.y += (yc - y) / CAM_FIN.k;
  });
})();

// --- the links: each field to its 2-4 real neighbours ---------------------------------------------------------
// A Gabriel graph (a link only when no third field sits inside the circle on it as diameter), planar, never
// grazing a third ring, at most 4 links a field (6 for the hub), shortest first. A field left with one link gets
// its next-nearest legal one. Links therefore run at the seats' own varied angles and lengths.
type Edge = { a: number; b: number; len: number };
const crosses = (p1: Node, p2: Node, p3: Node, p4: Node) => {
  const d = (a: Node, b: Node, c: Node) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  const d1 = d(p3, p4, p1);
  const d2 = d(p3, p4, p2);
  const d3 = d(p1, p2, p3);
  const d4 = d(p1, p2, p4);
  return d1 * d2 < 0 && d3 * d4 < 0;
};
const segPointDist = (a: Node, b: Node, p: Node) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const t = clamp01(((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy));
  return Math.hypot(a.x + dx * t - p.x, a.y + dy * t - p.y);
};
const EDGES: Edge[] = (() => {
  const cand: Edge[] = [];
  for (let a = 0; a < NODES.length; a++) {
    for (let b = a + 1; b < NODES.length; b++) {
      const len = dist(NODES[a], NODES[b]);
      if (len < 620) cand.push({ a, b, len });
    }
  }
  cand.sort((p, q) => p.len - q.len);
  const deg = NODES.map(() => 0);
  const cap = (i: number) => (NODES[i].hub ? 6 : 4);
  const out: Edge[] = [];
  const legal = (e: Edge, gabriel: boolean) => {
    const A = NODES[e.a];
    const B = NODES[e.b];
    const mid = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 };
    for (let i = 0; i < NODES.length; i++) {
      if (i === e.a || i === e.b) continue;
      if (segPointDist(A, B, NODES[i]) < STATION_R + 34) return false;
      if (gabriel && dist(NODES[i], mid) < e.len / 2) return false;
    }
    for (const f of out) {
      if (f.a === e.a || f.a === e.b || f.b === e.a || f.b === e.b) {
        if ((f.a === e.a && f.b === e.b) || (f.a === e.b && f.b === e.a)) return false;
        continue;
      }
      if (crosses(A, B, NODES[f.a], NODES[f.b])) return false;
    }
    return true;
  };
  for (const e of cand) {
    if (deg[e.a] >= cap(e.a) || deg[e.b] >= cap(e.b)) continue;
    if (!legal(e, true)) continue;
    out.push(e);
    deg[e.a]++;
    deg[e.b]++;
  }
  for (const e of cand) {
    if (!(deg[e.a] < 2 || deg[e.b] < 2)) continue;
    if (deg[e.a] >= cap(e.a) || deg[e.b] >= cap(e.b)) continue;
    if (!legal(e, false)) continue;
    out.push(e);
    deg[e.a]++;
    deg[e.b]++;
  }
  return out;
})();

// Icons: nearest the hub first; the first six are the brief's, the rest spread so repeats sit far apart.
(() => {
  const order = NODES.map((_n, i) => i)
    .filter((i) => !NODES[i].hub)
    .sort((p, q) => dist(NODES[p], HUB) - dist(NODES[q], HUB));
  order.forEach((i, rank) => {
    if (rank < FIRST.length) {
      NODES[i].icon = FIRST[rank];
      return;
    }
    // the icon least used nearby (weighted by closeness), never a neighbour's; ties by hash
    let best = "";
    let bestScore = Infinity;
    ALL.forEach((ic, j) => {
      let score = hash(i * 13 + j, 17) * 0.01;
      order.slice(0, rank).forEach((o) => {
        if (NODES[o].icon !== ic) return;
        const d = dist(NODES[o], NODES[i]);
        score += d < 420 ? 100 : Math.max(0, 1 - d / 1400);
      });
      if (score < bestScore) {
        bestScore = score;
        best = ic;
      }
    });
    NODES[i].icon = best;
  });
})();

// The hub's edge depends on the zoom (the mark holds its screen size); fields are fixed rings.
const radiusOf = (i: number, k: number = CAM_K[0]) => (NODES[i].hub ? markEdge(k) : STATION_R);

const T0 = -8;
const ODO_T: number[] = [];
const ODO_D: number[] = [];
{
  let d = 0;
  for (let f = T0; f <= DURATION + 80; f++) {
    ODO_T.push(f);
    ODO_D.push(d);
    const kk = CAM_K[Math.max(0, Math.min(CAM_K.length - 1, f))];
    d += SCREEN_V / kk;
  }
}
const odo = (t: number) => interpolate(t, ODO_T, ODO_D, { extrapolateLeft: "extend", extrapolateRight: "extend" });
/** the time a traveller that left at `t` has covered `d` */
const odoInv = (t: number, d: number) => {
  const target = odo(t) + d;
  return interpolate(target, ODO_D, ODO_T, { extrapolateLeft: "extend", extrapolateRight: "extend" });
};

// --- the schedule: one escalation curve of sends, ordered outward -----------------------------------------------
// rate(f) = sends per frame. Every send is ONE traveller at SCREEN_V: out of the hub along the web already built
// (its tree path) to the source field, then drawing the new thread to the neighbour.
const rate = (f: number) => 0.45 + 0.47 * smoothstep((f - 6) / 100);
type Send = {
  edge: number;
  src: number;
  dst: number;
  path: number[]; // node ids, hub ... src
  cum: number[]; // cumulative length at each path node
  depart: number;
  tc: number; // the head touches the neighbour's ring
  fruit: boolean;
  side: number;
  bunch: { ang: number; delay: number; size: number; stem: number }[];
};
// How many finds a link turns up (1-3). They hang together from the thread's midpoint like a bunch of cherries:
// stems from one point, fanned around the hanging direction, the middle one first.
const bunchOf = (ei: number) => {
  const h = hash(ei, 53);
  const n = h < 0.42 ? 1 : h < 0.86 ? 2 : 3;
  const fan = n === 1 ? [0] : n === 2 ? [-1, 1] : [0, -1, 1];
  return fan.map((side, j) => ({
    ang: side * (0.75 + 0.08 * hash(ei * 7 + j, 59)) + (hash(ei, 71) - 0.5) * 0.25,
    delay: n === 2 ? 2 * j : j === 0 ? 0 : 2 + j,
    size: 0.88 + 0.2 * hash(ei * 7 + j, 61),
    stem: (side === 0 && n === 3 ? 1.75 : 1.15) + 0.2 * hash(ei * 7 + j, 67),
  }));
};
const SENDS: Send[] = (() => {
  const reach: number[] = NODES.map((n) => (n.hub ? -Infinity : Infinity));
  const parent: number[] = NODES.map(() => -1); // edge index that first reached the node
  const drawFrom: number[] = EDGES.map(() => Infinity); // when the thread's head leaves its source centre
  const key = EDGES.map((e, ei) => {
    const mx = (NODES[e.a].x + NODES[e.b].x) / 2;
    const my = (NODES[e.a].y + NODES[e.b].y) / 2;
    return Math.hypot(mx - HUB.x, (my - HUB.y) * 0.92) + 70 * hash(ei, 23);
  });
  const pending = EDGES.map((_e, i) => i).sort((p, q) => key[p] - key[q]);
  // The opening gesture: the first spoke and, chasing right behind its head, the first field-to-field thread
  // (the pair inside the opening frame with the shortest hub -> A -> B reach), so the first fruit lands early.
  const openIn = (i: number) => inset(NODES[i], CAM_CY[0], K_OPEN) > STATION_R * K_OPEN;
  let best: [number, number, number] | null = null;
  EDGES.forEach((sp, si) => {
    if (!(NODES[sp.a].hub || NODES[sp.b].hub)) return;
    const A = NODES[sp.a].hub ? sp.b : sp.a;
    if (!openIn(A) || NODES[A].y > HUB.y) return;
    EDGES.forEach((ln, li) => {
      if (NODES[ln.a].hub || NODES[ln.b].hub || (ln.a !== A && ln.b !== A)) return;
      const B = ln.a === A ? ln.b : ln.a;
      if (!openIn(B)) return;
      const score = sp.len + ln.len;
      if (!best || score < best[2]) best = [si, li, score];
    });
  });
  if (best) {
    const [si, li] = best as [number, number, number];
    pending.splice(pending.indexOf(si), 1);
    pending.splice(pending.indexOf(li), 1);
    pending.unshift(si, li);
  }
  const out: Send[] = [];
  let t = T0;
  let guard = 0;
  while (pending.length > 0 && t < DURATION + 40 && guard++ < 5000) {
    // the nearest pending edge that touches the built web
    const pi = pending.findIndex((ei) => reach[EDGES[ei].a] < Infinity || reach[EDGES[ei].b] < Infinity);
    if (pi < 0) break;
    const ei = pending.splice(pi, 1)[0];
    const e = EDGES[ei];
    const src = reach[e.a] <= reach[e.b] ? e.a : e.b;
    const dst = src === e.a ? e.b : e.a;
    // tree path hub -> src
    const path: number[] = [src];
    const viaEdges: number[] = [];
    let cur = src;
    while (!NODES[cur].hub) {
      const pe = parent[cur];
      viaEdges.unshift(pe);
      cur = EDGES[pe].a === cur ? EDGES[pe].b : EDGES[pe].a;
      path.unshift(cur);
    }
    const cum: number[] = [0];
    for (let i = 1; i < path.length; i++) cum.push(cum[i - 1] + dist(NODES[path[i - 1]], NODES[path[i]]));
    // A traveller may run along a thread that is still being drawn, but never overtakes its head: everything
    // moves at one speed, so entering each thread after its head left keeps it behind all the way.
    let depart = t;
    viaEdges.forEach((pe, i) => {
      while (odoInv(depart, cum[i]) < drawFrom[pe] + 0.8) depart += 0.25;
    });
    const Ls = cum[cum.length - 1];
    const tc = odoInv(depart, Ls + e.len - radiusOf(dst));
    drawFrom[ei] = odoInv(depart, Ls);
    if (tc < reach[dst]) {
      reach[dst] = tc;
      parent[dst] = ei;
    }
    out.push({
      edge: ei,
      src,
      dst,
      path,
      cum,
      depart,
      tc,
      fruit: !NODES[src].hub && !NODES[dst].hub,
      side: hash(ei, 41) < 0.5 ? -1 : 1,
      bunch: bunchOf(ei),
    });
    t += 1 / rate(t);
  }
  return out;
})();

// --- drawing helpers --------------------------------------------------------------------------------------------
const at = (path: number[], cum: number[], d: number) => {
  for (let i = 1; i < path.length; i++) {
    if (d <= cum[i]) {
      const A = NODES[path[i - 1]];
      const B = NODES[path[i]];
      const u = (d - cum[i - 1]) / (cum[i] - cum[i - 1]);
      return { x: A.x + (B.x - A.x) * u, y: A.y + (B.y - A.y) * u };
    }
  }
  const L = NODES[path[path.length - 1]];
  return { x: L.x, y: L.y };
};
const budEase = Easing.out(Easing.back(1.6));

const World: React.FC<{ frame: number; k: number }> = ({ frame, k }) => {
  const lines: React.ReactNode[] = [];
  const heads: React.ReactNode[] = [];
  const packets: React.ReactNode[] = [];
  const fruits: React.ReactNode[] = [];
  for (let si = 0; si < SENDS.length; si++) {
    const s = SENDS[si];
    if (frame < s.depart) continue;
    const D = odo(frame) - odo(s.depart);
    const Ls = s.cum[s.cum.length - 1];
    const A = NODES[s.src];
    const B = NODES[s.dst];
    const len = dist(A, B);
    const ux = (B.x - A.x) / len;
    const uy = (B.y - A.y) / len;
    const r0 = radiusOf(s.src, k);
    const r1 = radiusOf(s.dst, k);
    if (D < Ls + r0) {
      // the packet on its way out through the web: hidden while it passes inside a ring or the hub
      const p = at(s.path, s.cum, Math.min(D, Ls));
      const inside = s.path.some((ni) => dist(p, NODES[ni]) < radiusOf(ni, k) - PACKET_R * 0.5);
      if (!inside && D < Ls) {
        packets.push(<circle key={`p${si}`} cx={p.x} cy={p.y} r={PACKET_R} fill={ACCENT} />);
      }
      continue;
    }
    const reachD = Math.min(D - Ls, len - r1);
    const x0 = A.x + ux * r0;
    const y0 = A.y + uy * r0;
    const x1 = A.x + ux * reachD;
    const y1 = A.y + uy * reachD;
    const after = frame - s.tc;
    const op =
      after < 0
        ? LINK_LIVE
        : interpolate(after, [6, 30], [LINK_LIVE, LINK_IDLE + 0.08], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.inOut(Easing.quad),
          });
    lines.push(
      <line
        key={`l${si}`}
        x1={x0}
        y1={y0}
        x2={x1}
        y2={y1}
        stroke={ACCENT}
        strokeWidth={THREAD}
        strokeLinecap="round"
        opacity={op}
      />,
    );
    if (after < 0) {
      heads.push(<circle key={`h${si}`} cx={x1} cy={y1} r={HEAD_R} fill={INK} />);
    } else if (s.fruit) {
      // the finds: a small bunch (1-3) buds out of the thread's middle, middle one first, and hangs from it on
      // short stems, for good
      const mx = (A.x + ux * r0 + B.x - ux * r1) / 2;
      const my = (A.y + uy * r0 + B.y - uy * r1) / 2;
      let nx = -uy;
      let ny = ux;
      if (ny < 0 || (Math.abs(ny) < 1e-6 && s.side < 0)) {
        nx = -nx;
        ny = -ny;
      }
      const hang = Math.atan2(ny + 1.4, nx); // mostly down, leaning off a steep thread
      s.bunch.forEach((b, bi) => {
        const u = after - 1 - b.delay; // first reaction on tc + 1
        if (u < 0) return;
        const stemU = clamp01(u / 6);
        const budU = clamp01((u - 1) / 9);
        const r = THREAD / 2 + (FRUIT_R * b.size - THREAD / 2) * budEase(budU);
        const L = STEM * b.stem * smoothstep(stemU);
        const fx = mx + Math.cos(hang + b.ang) * L;
        const fy = my + Math.sin(hang + b.ang) * L;
        fruits.push(
          <g key={`f${si}_${bi}`}>
            <line x1={mx} y1={my} x2={fx} y2={fy} stroke={ACCENT} strokeWidth={THREAD} strokeLinecap="round" />
            <circle cx={fx} cy={fy} r={r} fill={ACCENT} />
          </g>,
        );
      });
    }
  }
  const glyphBox = 2 * STATION_R * GLYPH;
  const view = { x0: -300, x1: 1380, y0: -400, y1: 2300 };
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <g>{lines}</g>
      <g>{packets}</g>
      <g>{fruits}</g>
      <g style={{ filter: iconShadow(k) }}>
        {NODES.map((n, i) =>
          n.hub || n.x < view.x0 || n.x > view.x1 || n.y < view.y0 || n.y > view.y1 ? null : (
            <g key={`s${i}`} opacity={INK_HI}>
              <circle cx={n.x} cy={n.y} r={STATION_R} fill="none" stroke={INK} strokeWidth={STROKE} />
              <g
                transform={`translate(${(n.x - glyphBox / 2).toFixed(3)} ${(n.y - glyphBox / 2).toFixed(3)}) scale(${(
                  glyphBox / 24
                ).toFixed(5)})`}
                fill="none"
                stroke={INK}
                strokeWidth={(STROKE * 24) / glyphBox}
                strokeLinecap="round"
                strokeLinejoin="round"
                dangerouslySetInnerHTML={{ __html: ICONS[n.icon] }}
              />
            </g>
          ),
        )}
      </g>
      <g>{heads}</g>
      <g style={{ filter: iconShadow(k, undefined, undefined, MODEL_SHADOW_OPACITY) }}>
        <g
          transform={`translate(${HUB.x} ${HUB.y}) scale(${((2 * markHalf(k) * breath(frame, 0.37)) / 24).toFixed(
            6,
          )}) translate(-12 -12)`}
        >
          {OPENAI.paths.map((d) => (
            <path key={d.length} d={d} fill={ACCENT} fillRule="evenodd" />
          ))}
        </g>
      </g>
    </svg>
  );
};

const ConnectingAdjacentFields: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const { cy, k } = runCamera(frame, CAM_F, CAM_CY, CAM_K);
  const s = sway(frame);
  const { tx, ty } = worldTransform(540, cy, k);
  return (
    <AbsoluteFill style={{ backgroundColor: BG_BASE }}>
      <GridBackground
        src="grid-background.jpg"
        blur={13}
        dim={BG_DIM}
        frame={frame}
        cy={cy}
        cyRest={CAM_CY[0]}
        k={k}
        parallax={0.15}
      />
      <AbsoluteFill style={{ filter: `drop-shadow(0 ${SHADOW_Y}px ${SHADOW_BLUR}px rgba(0,0,0,${SHADOW_OPACITY}))` }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 1080,
            height: 1920,
            transformOrigin: "0 0",
            transform: `translate(${tx + s.dx}px, ${ty + s.dy}px) scale(${k})`,
          }}
        >
          <World frame={frame} k={k} />
        </div>
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

export default ConnectingAdjacentFields;
