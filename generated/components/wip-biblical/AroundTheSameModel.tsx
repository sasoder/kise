// ---------------------------------------------------------------------------
// AroundTheSameModel (wip-biblical, cut 54). Works in Progress style (styles/works-in-progress.md; kit
// generated/components/kits/works-in-progress/wipShared.tsx).
// Opaque 1080x1920, 24 fps, 96 frames.
//
// CHECK LINE: "Hundreds of millions of separate people are all talking into the same one thing, the way the tribe sat round
// one voice." With no sound: one person on a phone, then a vast gathering, every red thread running to a single OpenAI mark
// where the storyteller used to sit.
//
// THE LINE: "Hundreds of millions of people now talk every day to the same language models."
// WORD -> FRAME: Hundreds 0 · of 5 · millions 10 · of 13 · people 22 · now 28 · talk 34 · every 41 · day 49 · to 55 · the 59 ·
// same 61 · language 69 · models 79 · (next sentence "A" 93; cut to speaker at f96)
// DURATION: the slot 54.083 -> 58.083 s = 4.000 s x 24 = 96 frames (f0..f95).
//
// THE MOTION: one camera pull-back on one decelerating curve, moving at f0 and settling on f79, then a slow creep outward
// to the cut. It opens close on one person on a phone, a thin red thread running from the phone out of frame to the right;
// pulling back shows the thread ends in the OpenAI mark (edging in from about f10, whole by f22) at the centre of a near ring of twelve
// cut-out people, each with its own red thread to the mark, and beyond them the crowd as rings of ink dots on concentric
// ellipses that run out past the top band, down the side strips and off every edge. Every dot has a fine red thread
// pointing at the mark: strongest on the near ring, a short fading tail on the dots (a full-length thread per dot would
// pile into a red sun around the mark). Each near thread is drawn from its phone, heavier there and fine at
// the mark, so the bond reads person -> model. From "talk" (f34) round red beads swell out of the phones and the dots and run inward
// along the threads into the mark, a steady trickle that keeps the settled frame alive.
// Contact frames: the phone's first packet leaves f26 and enters the mark about f60 ("same" 61); the other near-ring phones
// from f30, the dots from f34. Packets enter the mark by passing under its edge.
// SPOT INK: red = the threads and what runs along them (the bond: everyone wired to the one model). Deep-green ink = the
// crowd's dots and the printed OpenAI mark. No indigo, no type.
// LAYOUT RHYME: TRIBE_READY.md did not exist at start, so the brief's fallback: the near ring is an 860 x 420 ellipse at
// (540, 420) (the same numbers as tribeShared's rim), the mark where the storyteller stood, world (540, 400), 180 px (about 178 px on screen once settled).
//
// SHIFT (Nov 12, user): everything prints BIBLICAL_SHIFT_Y = 100 px lower via <ShiftDown>; the screen px above are before it.
// SOURCES: OpenAI mark: animation_source/assets_raw/models/openai_lobehub-1.102.0.svg (lobehub icons 1.102.0), inlined.
// The phone person: assets_raw/ai/TypingPhone_WomanTextingOnStreet_SanFrancisco2008.jpg (Ed Yourdon, CC BY-SA 2.0). The ring:
// broll/B13_GroupOnPhones.mov and its source video "group of people using their phones together" (RoyaltyFree4K, YouTube
// ZseLLgwQA9w, CC BY). Cut out and graded by scripts/clips/wip-biblical/bake-around-54.py: seven distinct people as
// bust prints, five of them repeated mirrored at another size. B14_CrowdLitByPhones is unused (no one in it comes away
// clean from the person behind). The open is at 5.6x: at 6.8x the print's grain broke up. No figures on screen.
// ---------------------------------------------------------------------------
import React from "react";
import { random, useCurrentFrame } from "remotion";
import { z } from "zod";
import { AROUND_PEOPLE } from "./aroundPeopleBake";
import { BIBLICAL_SHIFT_Y, ShiftDown } from "./biblicalShift";
import {
  CaptionBandsDebug,
  CutOut,
  InkPrint,
  PaperGround,
  RED,
  THEMES,
  WipCam,
  WipFilmLife,
  WipPlane,
  inkOn,
} from "../kits/works-in-progress/wipShared";

export const FPS = 24;
export const DURATION = 96;
export const schema = z.object({ bands: z.boolean(), mask: z.boolean() });
export const defaultProps = schema.parse({ bands: false, mask: false });

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const INK = THEMES.mint.ink;
const RED_INK = inkOn(RED, "mint");
const DEEP_INK = inkOn(INK, "mint");

// -- the ground: concentric ellipses of one flattening, the tribe's ring as the near one --------------------------------
const CX = 540;
const CY = 420;
const NEAR_R = 430; // ring px (= the x radius): the near ring, 860 x 420
const FLAT = 210 / 430;
const ringPt = (r: number, deg: number) => {
  const a = (deg * Math.PI) / 180;
  return { x: CX + r * Math.cos(a), y: CY + r * FLAT * Math.sin(a) };
};
/** A mild size cue for depth: things lower on the page are nearer and larger. */
const depthQ = (y: number) => Math.min(2.3, Math.max(0.55, 1 + (y - CY) / 1500));

// -- the model: the OpenAI mark where the storyteller stood -------------------------------------------------------------
const HUB = { x: 540, y: 400 };
const MARK_SIZE = 180;
const MARK_EDGE = 101; // threads end, and packets go under, at this radius from the hub
const OPENAI_D =
  "M9.205 8.658v-2.26c0-.19.072-.333.238-.428l4.543-2.616c.619-.357 1.356-.523 2.117-.523 2.854 0 4.662 2.212 4.662 4.566 0 .167 0 .357-.024.547l-4.71-2.759a.797.797 0 00-.856 0l-5.97 3.473zm10.609 8.8V12.06c0-.333-.143-.57-.429-.737l-5.97-3.473 1.95-1.118a.433.433 0 01.476 0l4.543 2.617c1.309.76 2.189 2.378 2.189 3.948 0 1.808-1.07 3.473-2.76 4.163zM7.802 12.703l-1.95-1.142c-.167-.095-.239-.238-.239-.428V5.899c0-2.545 1.95-4.472 4.591-4.472 1 0 1.927.333 2.712.928L8.23 5.067c-.285.166-.428.404-.428.737v6.898zM12 15.128l-2.795-1.57v-3.33L12 8.658l2.795 1.57v3.33L12 15.128zm1.796 7.23c-1 0-1.927-.332-2.712-.927l4.686-2.712c.285-.166.428-.404.428-.737v-6.898l1.974 1.142c.167.095.238.238.238.428v5.233c0 2.545-1.974 4.472-4.614 4.472zm-5.637-5.303l-4.544-2.617c-1.308-.761-2.188-2.378-2.188-3.948A4.482 4.482 0 014.21 6.327v5.423c0 .333.143.571.428.738l5.947 3.449-1.95 1.118a.432.432 0 01-.476 0zm-.262 3.9c-2.688 0-4.662-2.021-4.662-4.519 0-.19.024-.38.047-.57l4.686 2.71c.286.167.571.167.856 0l5.97-3.448v2.26c0 .19-.07.333-.237.428l-4.543 2.616c-.619.357-1.356.523-2.117.523zm5.899 2.83a5.947 5.947 0 005.827-4.756C22.287 18.339 24 15.84 24 13.296c0-1.665-.713-3.282-1.998-4.448.119-.5.19-.999.19-1.498 0-3.401-2.759-5.947-5.946-5.947-.642 0-1.26.095-1.88.31A5.962 5.962 0 0010.205 0a5.947 5.947 0 00-5.827 4.757C1.713 5.447 0 7.945 0 10.49c0 1.666.713 3.283 1.998 4.448-.119.5-.19 1-.19 1.499 0 3.401 2.759 5.946 5.946 5.946.642 0 1.26-.095 1.88-.309a5.96 5.96 0 004.162 1.713z";

// -- the near ring: twelve people on their phones, half-figure bust prints standing on the ring (straight bottom edge),
// open at the front so the mark stays in view. Seven real people (aroundPeopleBake.ts), five of them used twice, the
// second time mirrored and at another size. Spaced evenly by a metric that counts vertical distance at 0.42, so neighbours
// barely touch in the hold (the back row's prints may lap a few px, pasted one over the next); in the opening close-up the
// phone person's neighbours show only at the frame edges.
type BakedName = keyof typeof AROUND_PEOPLE;
const BUST_H = 160; // world px at depthQ 1: about 135-180 px on screen in the hold (back to front), so each reads as a person on a phone
const PHONE_DEG = 222;
const RING: { deg: number; who: BakedName; size: number; flip: boolean }[] = [
  { deg: 118, who: "curly", size: 1, flip: false },
  { deg: 140, who: "bald", size: 1.04, flip: false },
  { deg: 183, who: "sweater", size: 0.9, flip: false },
  { deg: 222, who: "woman", size: 1.1, flip: false }, // her print runs to the hip, so a little larger to read as big as the rest
  { deg: 247, who: "redhead", size: 1, flip: false },
  { deg: 265, who: "blueshirt", size: 0.97, flip: false },
  { deg: 282, who: "vest", size: 1.03, flip: false },
  { deg: 299, who: "curly", size: 0.95, flip: true },
  { deg: 318, who: "bald", size: 1, flip: true },
  { deg: 357, who: "blueshirt", size: 1.04, flip: true },
  { deg: 40, who: "redhead", size: 0.97, flip: true },
  { deg: 62, who: "vest", size: 1, flip: true },
];
type Person = {
  deg: number;
  src: string;
  aspect: number;
  feet: { x: number; y: number };
  h: number;
  w: number;
  flipX: boolean;
  hand: { x: number; y: number }; // the phone
  over: boolean; // its thread runs in front of the people (it comes towards the viewer), or behind them
  phone: boolean;
};
const PEOPLE: Person[] = RING.map(({ deg, who, size, flip }) => {
  const b = AROUND_PEOPLE[who];
  const feet = ringPt(NEAR_R, deg);
  const h = BUST_H * depthQ(feet.y) * size;
  const w = h * b.aspect;
  const fx = flip ? 1 - b.phoneFx : b.phoneFx;
  const a = (deg * Math.PI) / 180;
  return {
    deg,
    src: b.src,
    aspect: b.aspect,
    feet,
    h,
    w,
    flipX: flip,
    hand: { x: feet.x - w / 2 + fx * w, y: feet.y - h + b.phoneFy * h },
    over: Math.sin(a) < 0.25 || deg === PHONE_DEG,
    phone: deg === PHONE_DEG,
  };
}).sort((p, q) => p.feet.y - q.feet.y);
const PHONE = PEOPLE.find((p) => p.phone)!;

/** A thread from p to the mark's edge. */
const toEdge = (p: { x: number; y: number }) => {
  const dx = HUB.x - p.x;
  const dy = HUB.y - p.y;
  const len = Math.hypot(dx, dy);
  const reach = Math.max(0, len - MARK_EDGE);
  return { x0: p.x, y0: p.y, ux: dx / len, uy: dy / len, len: reach };
};

// -- the camera: one decelerating pull-back from f0, settling on f79, then a slow creep outward ---------------------------
const K0 = 4.6; // 6.8 broke the print up (the cut-out's grain is drawn in print px, so it grows with the zoom)
const K1 = 1.04; // with the creep: k 0.99 at the settle (f79), 0.98 at f95
const SETTLE = 79;
const POWER = 2.3;
const CREEP = 0.0006; // per frame, on k, from f0 (so the settle has no corner)
// The camera keeps one world point at one screen point: at f0 the phone at screen (460, 500), close on the phone person's
// head, hands and phone (the neighbours at 183 and 247 deg only at the frame edges); settled, the mark at screen
// (540, 420), k 0.99, the near ring spanning about x 90-990. The anchor slides from phone to mark on the same curve as the zoom, so the top band always holds the action.
const ANCHOR0 = { wx: PHONE.hand.x, wy: PHONE.hand.y, sx: 460, sy: 500 };
const ANCHOR1 = { wx: HUB.x, wy: HUB.y, sx: 540, sy: 420 };
const ANCHOR_LAG = 0.4;
const camAt = (frame: number): WipCam => {
  const t = clamp01(frame / SETTLE);
  const e = (1 - t) ** POWER; // 1 -> 0, fastest at f0, zero speed at the settle
  const k = K1 * (K0 / K1) ** e * (1 - CREEP * frame);
  // the anchor leaves the phone later than the zoom starts, so the opening pulls back around the phone first
  const w = e ** ANCHOR_LAG;
  const lerp = (a: number, b: number) => b + (a - b) * w;
  const wx = lerp(ANCHOR0.wx, ANCHOR1.wx);
  const wy = lerp(ANCHOR0.wy, ANCHOR1.wy);
  const sx = lerp(ANCHOR0.sx, ANCHOR1.sx);
  const sy = lerp(ANCHOR0.sy, ANCHOR1.sy);
  return { k, x: wx - (sx - 540) / k, y: wy - (sy - 960) / k, x0: 540, y0: 960 };
};
// the widest view (the last frame), for culling the crowd
const VIEW = (() => {
  const c = camAt(DURATION - 1);
  const m = 60 / c.k;
  return { x0: c.x - 540 / c.k - m, x1: c.x + 540 / c.k + m, y0: c.y - 960 / c.k - m, y1: c.y + 960 / c.k + m };
})();
const inView = (x: number, y: number, pad = 0) => x > VIEW.x0 - pad && x < VIEW.x1 + pad && y > VIEW.y0 - pad && y < VIEW.y1 + pad;
// <ShiftDown> prints everything BIBLICAL_SHIFT_Y lower, so the frame now also shows that much more page above the old top
const SHIFT_TOP = BIBLICAL_SHIFT_Y / camAt(DURATION - 1).k;
const inShiftedView = (x: number, y: number, pad = 0) =>
  x > VIEW.x0 - pad && x < VIEW.x1 + pad && y > VIEW.y0 - SHIFT_TOP - pad && y < VIEW.y1 + pad;

// -- the crowd: many separate people seen from above. Dots seeded along concentric ellipses (the ring logic), then each
// jittered along and across its ring and varied in size; the spacing along a ring widens with distance (the crowd thins
// out), a coarse noise field leaves small irregular gaps, and a spatial hash keeps a minimum spacing, so it never reads
// as a screen tone.
const RING0 = 520;
const ROW = (r: number) => 60 * (1 + Math.max(0, r - 900) / 1100);
const ARC = 36; // px between dots along a ring, times depthQ, times the thinning
const THIN = (r: number) => 1 + Math.max(0, r - RING0) / 4500;
const DOT_R = 4.0; // times depthQ
const MIN_GAP = 0.42; // of the local ARC: no two dots closer than this
/** Smooth value noise, 0..1, on a coarse grid (world px). */
const noise2 = (x: number, y: number, cell: number, salt: string) => {
  const gx = Math.floor(x / cell);
  const gy = Math.floor(y / cell);
  const fx = x / cell - gx;
  const fy = y / cell - gy;
  const sm = (t: number) => t * t * (3 - 2 * t);
  const v = (i: number, j: number) => random(`${salt}-${gx + i}-${gy + j}`);
  const a = v(0, 0) + (v(1, 0) - v(0, 0)) * sm(fx);
  const b = v(0, 1) + (v(1, 1) - v(0, 1)) * sm(fx);
  return a + (b - a) * sm(fy);
};
type Dot = { x: number; y: number; q: number; r: number; seed: number; ring: number };
const DOTS: Dot[] = (() => {
  const out: Dot[] = [];
  const HASH = 24;
  const grid = new Map<string, Dot[]>();
  const tooClose = (x: number, y: number, minD: number) => {
    const gx = Math.floor(x / HASH);
    const gy = Math.floor(y / HASH);
    const reach = Math.ceil(minD / HASH);
    for (let i = -reach; i <= reach; i++)
      for (let j = -reach; j <= reach; j++)
        for (const d of grid.get(`${gx + i},${gy + j}`) ?? []) if (Math.hypot(d.x - x, d.y - y) < minD) return true;
    return false;
  };
  // Two passes: the first is the crowd as it was before the shift (same dots, same seeds, so the same packets); the
  // second only fills the strip the shift opened above the old top, against the same minimum spacing.
  const pass = (accept: (x: number, y: number) => boolean, seedBase: number) => {
    let r = RING0;
    let ring = 0;
    while (r < 4200) {
      const phase = random(`ring-${ring}`);
      const steps = Math.ceil(r * 2.2);
      const row = ROW(r);
      let acc = phase * ARC;
      let prev = ringPt(r, 0);
      for (let i = 1; i <= steps; i++) {
        const deg = (i / steps) * 360;
        const p = ringPt(r, deg);
        const q = depthQ(p.y);
        const arc = ARC * q * THIN(r);
        acc += Math.hypot(p.x - prev.x, p.y - prev.y);
        prev = p;
        if (acc < arc) continue;
        acc -= arc;
        const key = `${ring}-${i}`;
        // jitter along the ring (in arc px) and across it (in ring px): a crowd, not a print grid
        const along = (random(`da-${key}`) - 0.5) * 0.7 * arc;
        const across = (random(`dc-${key}`) - 0.5) * 0.6 * row;
        const rad = (deg * Math.PI) / 180;
        const t = { x: -Math.sin(rad), y: FLAT * Math.cos(rad) };
        const tl = Math.hypot(t.x, t.y);
        const x = p.x + (t.x / tl) * along + Math.cos(rad) * across;
        const y = p.y + (t.y / tl) * along + FLAT * Math.sin(rad) * across;
        if (!accept(x, y)) continue;
        // small irregular gaps where the coarse noise is low, a little more often far out
        const n = noise2(x, y, 150, "gap") * 0.75 + noise2(x, y, 55, "gap2") * 0.25;
        if (n < 0.24 + 0.05 * Math.min(1, (r - RING0) / 1500)) continue;
        const minD = Math.min(MIN_GAP * ARC * q * THIN(r), 0.8 * row * FLAT * q);
        if (tooClose(x, y, minD)) continue;
        const d: Dot = { x, y, q, r: DOT_R * q * (0.72 + 0.56 * random(`dr-${key}`)), seed: seedBase + out.length, ring };
        out.push(d);
        const hk = `${Math.floor(x / HASH)},${Math.floor(y / HASH)}`;
        grid.set(hk, [...(grid.get(hk) ?? []), d]);
      }
      r += ROW(r);
      ring++;
    }
  };
  pass((x, y) => inView(x, y, 40), 0);
  pass((x, y) => inShiftedView(x, y, 40) && !inView(x, y, 40), 100000);
  return out;
})();
const f2 = (v: number) => v.toFixed(2);
const circlePath = (x: number, y: number, r: number) => `M${f2(x - r)} ${f2(y)}a${f2(r)} ${f2(r)} 0 1 0 ${f2(2 * r)} 0a${f2(r)} ${f2(r)} 0 1 0 ${f2(-2 * r)} 0`;
const DOTS_D = DOTS.map((d) => circlePath(d.x, d.y, d.r)).join("");

// Each dot's thread: a short red tail aimed at the mark, strongest at the dot and fading in steps towards the centre.
const TAIL_ROWS = 1.7;
const TAIL_ALPHA = [0.62, 0.46, 0.3, 0.15];
const TAIL_TAPER = [1.35, 1.1, 0.85, 0.6]; // the tails thin towards the mark too (weight per band, dot end first)
// Far rings print fainter (three groups by ring radius), so the field recedes and the near ring stays the strongest.
const TAIL_GROUPS = [
  { upTo: 900, k: 1 },
  { upTo: 1500, k: 0.62 },
  { upTo: Infinity, k: 0.38 },
];
const ringOf = (p: { x: number; y: number }) => Math.max(1, Math.hypot(p.x - CX, (p.y - CY) / FLAT));
const groupOf = (d: Dot) => TAIL_GROUPS.findIndex((g) => ringOf(d) < g.upTo);
/** A dot's tail along its line to the mark: from just off the dot, TAIL_ROWS rows long (in ring px). */
const tailOf = (d: Dot) => {
  const th = toEdge(d);
  const ringR = ringOf(d);
  const end = Math.min(th.len - 6, (TAIL_ROWS * ROW(ringR) * th.len) / ringR);
  return { ...th, start: d.r + 2, end };
};
const bandSeg = (t: ReturnType<typeof tailOf>, a: number, b: number) =>
  `M${f2(t.x0 + t.ux * a)} ${f2(t.y0 + t.uy * a)}L${f2(t.x0 + t.ux * b)} ${f2(t.y0 + t.uy * b)}`;
const TAILS: { d: string; alpha: number }[] = TAIL_GROUPS.flatMap((g, gi) =>
  TAIL_ALPHA.map((alpha, band) => ({
    alpha: alpha * g.k,
    d: DOTS.filter((d) => groupOf(d) === gi)
      .map((d) => {
        const t = tailOf(d);
        const seg = (t.end - t.start) / TAIL_ALPHA.length;
        return seg > 0 ? bandSeg(t, t.start + band * seg, t.start + (band + 1) * seg) : "";
      })
      .join(""),
  })),
);

// -- the packets: talking. Born at a phone or a dot, running inward at a constant speed, under the mark's edge ------------
const PACKET_V = 9; // world px a frame on the near threads
const DOT_PACKET_V = 6.2; // times depthQ, on the dots' lines
type Emitter = { x0: number; y0: number; ux: number; uy: number; len: number; first: number; period: number; v: number; q: number };
const NEAR_EMIT: (Emitter & { over: boolean })[] = PEOPLE.map((p, i) => ({
  ...toEdge(p.hand),
  first: p.phone ? 26 : 30 + Math.floor(random(`pf-${i}`) * 14),
  period: 30 + Math.floor(random(`pp-${i}`) * 16),
  v: PACKET_V,
  q: depthQ(p.feet.y),
  over: p.over,
}));
// The dots' packets run their own tail and fade with it into the page (the near ring's carry all the way into the mark).
const DOT_EMIT = DOTS.filter((d) => random(`emit-${d.seed}`) < 0.2)
  .map((d) => ({
    tail: tailOf(d),
    group: groupOf(d),
    first: 34 + Math.floor(random(`df-${d.seed}`) * 40),
    period: 60 + Math.floor(random(`dp-${d.seed}`) * 50),
    v: DOT_PACKET_V * d.q,
    q: d.q,
  }))
  .filter((e) => e.tail.end - e.tail.start > 8);
const PACKET_ALPHA = [1, 0.78, 0.5, 0.24];
const dotPackets = (frame: number, dotBeadR: number) => {
  const bins: string[][] = TAIL_GROUPS.flatMap(() => PACKET_ALPHA.map(() => []));
  for (const e of DOT_EMIT) {
    if (frame < e.first) continue;
    const span = e.tail.end - e.tail.start;
    const n = Math.floor((frame - e.first) / e.period);
    for (let m = n; m >= 0; m--) {
      const at = e.tail.start + (frame - (e.first + m * e.period)) * e.v;
      if (at > e.tail.end) break;
      const band = Math.min(PACKET_ALPHA.length - 1, Math.floor(((at - e.tail.start) / span) * PACKET_ALPHA.length));
      const grow = Math.min(1, (at - e.tail.start) / (6 * e.q));
      bins[e.group * PACKET_ALPHA.length + band].push(
        circlePath(e.tail.x0 + e.tail.ux * at, e.tail.y0 + e.tail.uy * at, dotBeadR * e.q * Math.sqrt(grow)),
      );
    }
  }
  return bins.map((b, i) => ({
    d: b.join(""),
    alpha: PACKET_ALPHA[i % PACKET_ALPHA.length] * TAIL_GROUPS[Math.floor(i / PACKET_ALPHA.length)].k,
  }));
};
const BEAD_GROW = 14; // world px: a bead swells out of the phone over this distance
const BEAD_SINK = 18; // and shrinks into the mark's edge over this one, so it is plainly taken in there
/** The near ring's packets: round beads, born at the phone and taken in at the mark. r = the full bead radius. */
const packetsPath = (emitters: Emitter[], frame: number, r: number) => {
  const parts: string[] = [];
  for (const e of emitters) {
    if (frame < e.first) continue;
    const n = Math.floor((frame - e.first) / e.period);
    // every packet still in flight (a long thread can carry more than one)
    for (let m = n; m >= 0; m--) {
      const s = (frame - (e.first + m * e.period)) * e.v;
      if (s >= e.len) break;
      const grow = Math.min(1, s / BEAD_GROW);
      const sink = Math.min(1, (e.len - s) / BEAD_SINK);
      const br = r * Math.min(Math.sqrt(grow), sink);
      if (br < 0.05) continue;
      parts.push(circlePath(e.x0 + e.ux * s, e.y0 + e.uy * s, br));
    }
  }
  return parts.join("");
};
/** A near thread as a drawn line from the phone: w0 wide at the phone (a round end there), w1 at the mark. */
const taperPath = (e: Emitter, w0: number, w1: number) => {
  const nx = -e.uy;
  const ny = e.ux;
  const x1 = e.x0 + e.ux * e.len;
  const y1 = e.y0 + e.uy * e.len;
  return (
    `M${f2(e.x0 + (nx * w0) / 2)} ${f2(e.y0 + (ny * w0) / 2)}L${f2(x1 + (nx * w1) / 2)} ${f2(y1 + (ny * w1) / 2)}` +
    `L${f2(x1 - (nx * w1) / 2)} ${f2(y1 - (ny * w1) / 2)}L${f2(e.x0 - (nx * w0) / 2)} ${f2(e.y0 - (ny * w0) / 2)}Z` +
    circlePath(e.x0, e.y0, w0 / 2)
  );
};

// -- preview aid: the presenter's rough silhouette, keyed over the plate in the finished video ---------------------------
const SpeakerMask: React.FC<{ on: boolean }> = ({ on }) =>
  on ? (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
      <path
        d="M540 790 C690 790 780 900 780 1040 C780 1170 730 1250 680 1300 L1000 1390 L1000 1920 L115 1920 L115 1390 L400 1300 C350 1250 300 1170 300 1040 C300 900 390 790 540 790 Z"
        fill="rgba(70,70,70,0.86)"
      />
    </svg>
  ) : null;

const AroundTheSameModel: React.FC<z.infer<typeof schema>> = ({ bands, mask }) => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  // thread weights in screen px, so a close-up does not turn them into ropes
  const nearW = (2.2 + 0.5 * Math.log(cam.k / K1)) / cam.k;
  const tailW = 1.05 / cam.k;
  // a packet is a round bead on its thread (no dash, nothing arrow-like): the same red, about three times the thread's weight
  const beadR = nearW * 2.2;
  // the cut-outs' print grain is drawn in print px: thin it while the camera is close so the print never breaks up
  const printGrain = 0.13 * Math.min(1, 2.2 / cam.k);
  const dotBeadR = tailW * 1.6;
  const nearUnder = NEAR_EMIT.filter((e) => !e.over);
  const nearOver = NEAR_EMIT.filter((e) => e.over);
  // each near thread is drawn from the phone: heavier there, fine where it reaches the mark
  const threads = (list: typeof NEAR_EMIT) => list.map((e) => taperPath(e, nearW * 1.7, nearW * 0.45)).join("");
  return (
    <>
      <WipFilmLife frame={frame}>
        <ShiftDown>
          <PaperGround cam={cam} />
          {/* printed on the page: the crowd, its threads, the packets on them, the mark */}
          <WipPlane cam={cam} ink>
            <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
              <path d={DOTS_D} fill={DEEP_INK} />
              {TAILS.map((t, i) => (
                <path key={i} d={t.d} stroke={RED_INK} strokeOpacity={t.alpha} strokeWidth={tailW * TAIL_TAPER[i % TAIL_TAPER.length]} fill="none" />
              ))}
              {dotPackets(frame, dotBeadR).map((p, i) => (
                <path key={`dp${i}`} d={p.d} fill={RED_INK} fillOpacity={p.alpha} />
              ))}
              <path d={threads(nearUnder)} fill={RED_INK} />
              <path d={packetsPath(nearUnder, frame, beadR)} fill={RED_INK} />
            </svg>
            <InkPrint x={HUB.x - MARK_SIZE / 2} y={HUB.y - MARK_SIZE / 2} w={MARK_SIZE} h={MARK_SIZE} ink={INK} seed="openai" rough={1} wear={0.2} misregister={1.2}>
              <svg width="100%" height="100%" viewBox="0 0 24 24" style={{ position: "absolute", left: 0, top: 0 }}>
                <path d={OPENAI_D} fill="currentColor" fillRule="evenodd" />
              </svg>
            </InkPrint>
          </WipPlane>
          {/* pasted on: the near ring, back to front */}
          <WipPlane cam={cam}>
            {PEOPLE.map((p) => (
              <React.Fragment key={p.deg}>
                <CutOut src={p.src} x={p.feet.x} y={p.feet.y - p.h / 2} w={p.w} aspect={p.aspect} flipX={p.flipX} border={3} grain={printGrain} seed={`p${p.deg}`} />
              </React.Fragment>
            ))}
          </WipPlane>
          {/* the threads that come towards the viewer run in front of their own people */}
          <WipPlane cam={cam} ink>
            <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
              <path d={threads(nearOver)} fill={RED_INK} />
              <path d={packetsPath(nearOver, frame, beadR)} fill={RED_INK} />
            </svg>
          </WipPlane>
        </ShiftDown>
      </WipFilmLife>
      <SpeakerMask on={mask} />
      <CaptionBandsDebug on={bands} />
    </>
  );
};

export default AroundTheSameModel;
