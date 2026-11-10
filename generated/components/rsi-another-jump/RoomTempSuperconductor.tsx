// ---------------------------------------------------------------------------
// RoomTempSuperconductor (rsi-another-jump, cut 37). Dwarkesh style (styles/dwarkesh.md).
// Opaque 1080x1920, 23.976 fps, 179 frames.
//
// CHECK LINE: "hooked up remotely to a robot lab, the AI tests candidate materials far faster than all of
// humanity together — and it's the AI that finds the superconductor (a magnet floating at room temperature)."
//
// THE LINE: "[And] if it had remote access to a material science experiment lab, it'd be better than the rest
// of humanity put together at finding a room-temperature superconductor."
// WORD -> FRAME: if 1 · it 2 · had 3 · remote 6 · access 12 · to 22 · a 29 · material 32 · science 38 ·
// experiment 43 · lab 52 · it'd 66 · be 72 · better 73 · than 81 · the 84 · rest 87 · of 92 · humanity 96 ·
// put 101 · together 110 · at 120 · finding 129 · a 137 · room-temperature 141 · superconductor 155
// DURATION: the slot 37.496 -> 44.962 s = 7.466 s x 23.976 = 179 frames (f0..f178).
//
// THE MOTION: one reach -> search -> find. The camera opens close on the AI (the OpenAI mark in ACCENT, brandGlyphs `OPENAI`; a plain dot until Nov 10); a
// thread leaves it f6 and lands on a white station ring with a flask (the lab) at f28 while the camera pulls back
// after it; the ring turns orange from the thread's contact point, complete on "lab" (f52). From f53 a wave of
// tests spreads out of the lab through a feathered field of candidate tiles (white outline -> solid ACCENT_DEEP,
// ordered by distance from the lab, accelerating, with lab threads to the front) while the one continuous
// pull-back (f2-f98) reveals the whole field and, on its right, humanity: a white crowd of ~200 whose own white
// threads turn a tile white every ~8 frames. The comparison wide (k 1, f98-f117) fills the frame above the
// captions: at "together" (f110) the orange covers most of the field and humanity's white patch is a handful.
// One more lab thread lands on a deep tile (f122) and it lights ACCENT before "finding" (f129); the camera pushes
// in on it (f117-f147, k 1 -> 3.5) and grows it a little, while every other tile's face greys and shrinks away
// inside a thin dim outline (no warm tint left but the found tile; the field draws smaller and straighter so no
// two tiles touch). The found tile then turns side-on into the Meissner picture (f129-f145): a wide thin orange
// slab with a lighter top face; a small white two-tone magnet cube glides in from the upper right, clear of the
// lab ring, and is caught on a gap of air above the slab (f122-f150), its shadow a thin soft ellipse on the
// slab's top face that breathes with its bob; a white thermometer
// with "20 °C" slides up beside it (f141-f151). Settled and alive (bob, creep, grid drift) f150 to the end.
// CAUSE -> EFFECT: thread tip touches the ring f28 -> conversion starts from that point f28; each wave tile
// flips on the frame the wavefront (and, for ~1 in 5, a lab thread's tip) reaches it; each human tile flips
// on the frame its white thread arrives; the found tile lights on the frame the last lab thread lands (f122).
// Orange = the AI, nothing else; white = people and what they build.
//
// SOURCES: none (no figures). Room temperature shown as 20 °C (a conventional room temperature). Icons:
// Lucide `flask-conical` and `thermometer` (ISC), inlined as paths.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  BG_BASE,
  BG_DIM,
  DOT_RADIUS,
  GridBackground,
  OP_RECEDE,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  WOBBLE_R,
  breath,
  camEase,
  clamp,
  clamp01,
  feather,
  hash,
  iconShadow,
  makeTone,
  smoothstep,
  squirclePath,
  sway,
  wobble,
  worldTransform,
} from "../kits/dwarkesh/fieldShared";
import { INK, INK_LO, Label, worldPx } from "../kits/dwarkesh/alignShared";
import { arcPath, hermite, runCam3, threadPackets } from "../kits/dwarkesh/trapShared";
import { HIGHLIGHT } from "../kits/dwarkesh/levelUp";
import { OPENAI } from "../kits/dwarkesh/brandGlyphs";

export const FPS = 24000 / 1001;
export const DURATION = 179;
export const schema = z.object({});
export const defaultProps = schema.parse({});

type P = { x: number; y: number };
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const dist = (a: P, b: P) => Math.hypot(a.x - b.x, a.y - b.y);

// ---------------------------------------------------------------------------
// TONES. Receding is by TONE: a flat, opaque colour, never transparency (an accent at any alpha washes brown
// into the grid). FIELD is the grid's measured field (styles/dwarkesh.md, ~#727272). A tested tile drains to
// At the payoff every tile but the found one drains back to a thin dim outline (white at OP_RECEDE on the
// stroke only): its solid face greys (tone, never alpha) and shrinks away inside the outline. No warm tint is
// left anywhere but the found tile; the lab ring and the AI's mind drain to the same grey.
// ---------------------------------------------------------------------------
const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mixHex = (a: string, b: string, t: number) =>
  "#" +
  hex(a)
    .map((v, i) => Math.round(v + (hex(b)[i] - v) * t).toString(16).padStart(2, "0"))
    .join("");
const FIELD = "#727272";
const DIM_INK = mixHex(FIELD, "#ffffff", INK_LO); // drained white; also the magnet's S half (#C0C0C0)
const TONE = makeTone(ACCENT_DEEP, ACCENT);
const DRAIN_AI = makeTone(ACCENT_DEEP, DIM_INK); // a tested tile's face as it empties
const DRAIN_LIT = makeTone(ACCENT, DIM_INK);
const DIM_PEOPLE = mixHex(FIELD, "#ffffff", OP_RECEDE); // humanity's drained white
const DRAIN_INK = makeTone("#ffffff", DIM_PEOPLE);

// ---------------------------------------------------------------------------
// SIZES. The comparison wide is k 1 at the frame's own centre, so a world px there IS a screen px.
// ---------------------------------------------------------------------------
const K_WIDE = 1;
const K_PAY = 3.5; // the payoff push: magnet ~170 px, tiles still read as tiles (~100 px)
const STROKE = worldPx(6.5, 1.25); // the lab ring and its flask: the one weight (6.5 px at k 1.25)
const THREAD_PX = 3.25; // threads are half the weight, held screen-constant through the zooms
const HEAD_PX = 4.5; // a drawing thread's white head
const PACKET_PX = 5;

// ---------------------------------------------------------------------------
// THE WORLD, laid out as the k 1 wide: the AI's mind at the top (y 200), its lab on the field's top edge, the
// field of candidate materials 940 px wide down to y ~1065, humanity's crowd in the field's right side at the
// same level with its own corner of tiles. Nothing readable below 1080 on a settled state.
// ---------------------------------------------------------------------------
const AI: P = { x: 262, y: 205 };
const R_AI = 55; // 110 px at the wide: the biggest orange thing
/** The AI is the OpenAI mark (user, Nov 10: "change the 37 graphic dot to an OpenAI logo"), as in cuts 2, 7, 15
 *  and 21. Its 24-unit box is a little wider than the old dot so the open mark carries the same weight. */
const AI_MARK = 2.3 * R_AI;
const LAB: P = { x: 500, y: 498 };
const LAB_R = 60;

const FIELD_C: P = { x: 530, y: 774 };
const FIELD_RX = 470;
const FIELD_RY = 278;
const FIELD_N = 2.6;
const PITCH = 38;
const TS = 28; // a tile's side, world (= px at the wide, 98 px at the payoff)
const TILE_STROKE = 4.5;

const CROWD_C: P = { x: 872, y: 792 };
const CROWD_RX = 128;
const CROWD_RY = 96;
const CROWD_N = 2.4;

const superR = (p: P, c: P, rx: number, ry: number, n: number) =>
  Math.pow(Math.pow(Math.abs(p.x - c.x) / rx, n) + Math.pow(Math.abs(p.y - c.y) / ry, n), 1 / n);

// --- the field: a jittered, relaxed hash grid, feathered at its superellipse edge -------------------------
type Seat = { x: number; y: number; rot: number; s: number; i: number };
const RAW_SEATS: Seat[] = (() => {
  const out: Seat[] = [];
  let i = 0;
  for (let gy = 0; gy < 19; gy++) {
    for (let gx = 0; gx < 29; gx++, i++) {
      const x = 30 + gx * PITCH + (gy % 2) * PITCH * 0.5 + (hash(i, 11) - 0.5) * PITCH * 0.7;
      const y = 470 + gy * PITCH * 0.9 + (hash(i, 12) - 0.5) * PITCH * 0.7;
      out.push({ x, y, rot: (hash(i, 13) - 0.5) * 18, s: 1, i });
    }
  }
  // relax: push apart any pair closer than MIN_D (seats, never drifted positions)
  const MIN_D = 37;
  for (let it = 0; it < 14; it++) {
    for (let a = 0; a < out.length; a++) {
      for (let b = a + 1; b < out.length; b++) {
        const dx = out[b].x - out[a].x;
        const dy = out[b].y - out[a].y;
        const d = Math.hypot(dx, dy);
        if (d > 0 && d < MIN_D) {
          const push = (MIN_D - d) / 2;
          out[a].x -= (dx / d) * push;
          out[a].y -= (dy / d) * push;
          out[b].x += (dx / d) * push;
          out[b].y += (dy / d) * push;
        }
      }
    }
  }
  return out.filter((s) => {
    const rho = superR(s, FIELD_C, FIELD_RX, FIELD_RY, FIELD_N);
    const th = Math.atan2((s.y - FIELD_C.y) / FIELD_RY, (s.x - FIELD_C.x) / FIELD_RX);
    const inside = ((1 - rho) * FIELD_RY) / PITCH + 0.45 * wobble(th * WOBBLE_R, 3.3);
    const fe = feather(inside, 2);
    if (hash(s.i, 71) >= fe) return false;
    s.s = 0.72 + 0.28 * fe;
    if (hash(s.i, 72) < 0.05) return false; // natural holes, so the payoff's pocket is not the only one
    if (dist(s, LAB) < LAB_R + 30) return false; // the lab's pocket
    if (superR(s, CROWD_C, CROWD_RX + 22, CROWD_RY + 22, CROWD_N) < 1) return false; // humanity's pocket
    return true;
  });
})();

// --- the found tile and its pocket (the magnet's air gap above it; thermometer + label sit over the field) --
const FOUND_AIM: P = { x: 540, y: 884 };
const FOUND_RAW = RAW_SEATS.reduce((b, s) => (dist(s, FOUND_AIM) < dist(b, FOUND_AIM) ? s : b));
const F: P = { x: FOUND_RAW.x, y: FOUND_RAW.y };
// The found tile grows a little as it is singled out (f122+), then turns into the classic Meissner picture
// seen from the SIDE: the same orange material swings and flattens into a wide thin slab (f129-f145), its top
// face a lighter strip; a small magnet cube hovers over that top face on a gap of air, its shadow a thin soft
// ellipse on the top face. Sizes are authored in screen px at K_PAY.
const FOUND_GROW = 1.25;
const LEGACY_POCKET_HALF = 20.3125; // the air-gap pocket cut into the seats (fixed: the field before f125 is locked)
const SLAB_W = 480 / K_PAY; // ~480 x 96 px
const SLAB_H = 96 / K_PAY;
const SLAB_TOP = 27 / K_PAY; // the top face's visible strip
// the group (slab + magnet + thermometer + label) spans ~70 % of the width, centred on x 540, the slab at
// y ~900-1000 (F rests at 430, 985)
const SLAB_C: P = { x: F.x + 6 / K_PAY, y: F.y - 35 / K_PAY };
const MAG = 170 / K_PAY; // the magnet cube's side (~170 px)
const GAP = 58 / K_PAY; // the air under it (~58 px)
const FLOAT_Y = SLAB_C.y - SLAB_H / 2 - GAP - MAG / 2;
const BOB = 2.4; // world px, ~8 screen px
const MAG_SWING = 0.4; // it glides in from the upper right, clear of the lab ring: x offset per world px of drop
const THERMO_BOX = 130 / K_PAY;
const THERMO: P = { x: SLAB_C.x + MAG / 2 + 40 / K_PAY + THERMO_BOX / 2, y: FLOAT_Y };
const LABEL_X = THERMO.x + THERMO_BOX / 2 + 14 / K_PAY;
const LABEL_SIZE = worldPx(76, K_PAY); // cap height ~60 px
const MORPH_F0 = 129;
const MORPH_F1 = 145;
// the payoff's clear ground: tiles here never bring their outline up (their faces still empty away)
const PAY_CLEAR = [
  { x0: SLAB_C.x - SLAB_W / 2 - 5, x1: SLAB_C.x + SLAB_W / 2 + 5, y0: SLAB_C.y - SLAB_H / 2 - 5, y1: SLAB_C.y + SLAB_H / 2 + 5 },
  { x0: SLAB_C.x - MAG / 2 - 5, x1: SLAB_C.x + MAG / 2 + 5, y0: FLOAT_Y - MAG / 2 - 5, y1: SLAB_C.y },
  { x0: THERMO.x - THERMO_BOX / 2 - 4, x1: LABEL_X + 230 / K_PAY, y0: THERMO.y - THERMO_BOX * 0.7, y1: THERMO.y + THERMO_BOX * 0.7 },
];
// the rest of the field draws smaller and straighter as it recedes, so no two tiles touch at the payoff
const SHRINK = 0.8;
const ROT_KEEP = 0.35;
const DR_STROKE = 3; // a drained outline, world (~10 px at K_PAY)
const POCKETS = [
  { x0: F.x - 10, x1: F.x + 10, y0: F.y - LEGACY_POCKET_HALF - 10, y1: F.y - LEGACY_POCKET_HALF }, // fixed seats
];
const inPocket = (s: Seat) =>
  s !== FOUND_RAW &&
  POCKETS.some(
    (r) =>
      s.x + TS / 2 + 2 > r.x0 && s.x - TS / 2 - 2 < r.x1 && s.y + TS / 2 + 2 > r.y0 && s.y - TS / 2 - 2 < r.y1,
  );

type Tile = Seat & { d: string; ds: number; dLab: number; tAI: number; tH: number; thread: boolean };
const SEATS: Seat[] = RAW_SEATS.filter((s) => !inPocket(s));
FOUND_RAW.rot = 0;
FOUND_RAW.s = 1;
const FOUND_I = SEATS.indexOf(FOUND_RAW);

// --- the AI's wave: radius from the lab, accelerating -----------------------------------------------------
const WAVE_T0 = 53;
const WAVE_R0 = LAB_R + 14;
const D_MAX = Math.max(...SEATS.map((s) => dist(s, LAB)));
// R(t) = R0 + A (t - T0)^1.5: first tiles ~f60, ~90 % of the reach by "together" (f110), all of it by f114.
// The front speeds up all the way, and the tiles per frame (front length x speed) faster still.
const WAVE_P = 1.5;
const WAVE_A = (D_MAX + 6 - WAVE_R0) / Math.pow(114 - WAVE_T0, WAVE_P);
const waveTime = (d: number) =>
  d <= WAVE_R0 ? WAVE_T0 : WAVE_T0 + Math.pow((d - WAVE_R0) / WAVE_A, 1 / WAVE_P);

// --- humanity: a white crowd, a couple of hundred seats in a feathered superellipse -----------------------
type Dot = { x: number; y: number; r: number; i: number };
const CROWD: Dot[] = (() => {
  const out: Dot[] = [];
  const step = 14.2;
  let i = 0;
  for (let gy = -10; gy <= 10; gy++) {
    for (let gx = -11; gx <= 11; gx++, i++) {
      const x = CROWD_C.x + gx * step + (gy % 2 ? step / 2 : 0) + (hash(i, 21) - 0.5) * step * 0.5;
      const y = CROWD_C.y + gy * step * 0.88 + (hash(i, 22) - 0.5) * step * 0.5;
      const rho = superR({ x, y }, CROWD_C, CROWD_RX, CROWD_RY, CROWD_N);
      const th = Math.atan2((y - CROWD_C.y) / CROWD_RY, (x - CROWD_C.x) / CROWD_RX);
      const inside = ((1 - rho) * CROWD_RY) / step + 0.4 * wobble(th * WOBBLE_R, 1.7);
      const fe = feather(inside, 2);
      if (hash(i, 23) >= fe) continue;
      out.push({ x, y, r: DOT_RADIUS * 0.82 * (0.8 + 0.4 * hash(i, 24)) * (0.7 + 0.3 * fe), i });
    }
  }
  return out;
})();

// --- the schedule: every tile's AI time, humanity's claims ------------------------------------------------
const H_THREAD = 9; // frames a human thread takes to reach its tile
const TILES: Tile[] = (() => {
  const tiles: Tile[] = SEATS.map((s, n) => {
    const dLab = dist(s, LAB);
    const w = TS * s.s;
    return {
      ...s,
      d: squirclePath(w, w),
      ds: w,
      dLab,
      tAI: n === FOUND_I ? waveTime(dLab) : waveTime(dLab) + (hash(s.i, 31) - 0.5) * 5,
      tH: Infinity,
      thread: hash(s.i, 32) < 0.18,
    };
  });
  // humanity has always been at it: four tiles already white at f0, then one every ~8.5 frames
  const events: number[] = [-60, -45, -30, -15];
  for (let t = 3; t < DURATION; t += 8.5 + (hash(t, 33) - 0.5) * 3) events.push(t);
  // one clump growing from the field at the crowd's lower left, its own corner
  const PATCH: P = { x: CROWD_C.x - CROWD_RX - 20, y: CROWD_C.y + 70 };
  const byCrowd = tiles
    .map((t, n) => ({ n, d: dist(t, PATCH) / CROWD_RX + hash(t.i, 34) * 0.12 }))
    .sort((a, b) => a.d - b.d);
  for (const t of events) {
    // humanity works its own corner only: once the AI has swept it, there is nothing near left to test
    const pick = byCrowd.find(
      (c) =>
        c.d < 1.5 &&
        tiles[c.n].x > CROWD_C.x - CROWD_RX - 90 &&
        tiles[c.n].tH === Infinity &&
        tiles[c.n].tAI > t + H_THREAD + 6 &&
        c.n !== FOUND_I,
    );
    if (pick) tiles[pick.n].tH = t + H_THREAD;
  }
  return tiles;
})();
const nearestCrowd = (p: P) => CROWD.reduce((b, d) => (dist(d, p) < dist(b, p) ? d : b));
const H_FROM: (Dot | null)[] = TILES.map((t) => (t.tH < Infinity ? nearestCrowd(t) : null));

// ---------------------------------------------------------------------------
// TIMING (frames)
// ---------------------------------------------------------------------------
const TH_F0 = 6; // the AI's thread leaves ("remote")
const TH_F1 = 28; // ...and lands on the lab ring
const CONV_F1 = 52; // the ring is fully orange on "lab"
const FLIP = 6; // a tile's flip
const FIND_F0 = 112; // the last lab thread leaves for the found tile
const FIND_F1 = 122; // ...lands; the tile lights by f127, before "finding" (f129)
const LIGHT_DUR = 5;
const PUSH_F0 = 117;
const PUSH_F1 = 147;
const DRAIN_F0 = 121;
const DRAIN_F1 = 138;
const MAG_F0 = 122; // the magnet enters from above the frame...
const MAG_F1 = 150; // ...and is caught on its gap of air
const MAG_DROP = 900; // screen px above its float at MAG_F0 (off the top edge)
const THERMO_F0 = 141;

// ---------------------------------------------------------------------------
// THE CAMERA. One pull-back f2-f98 (k 3.4 on the AI -> 1.75 on AI + lab -> 1.4 for the conversion -> the k 1
// wide), each channel on its own monotone Hermite (k in log); the tilt down leads the zoom so humanity comes in
// from the right edge above the captions; a slow creep to f117; one push-in f117-f147 to k 3.5 on the found
// tile, the tile's screen offset going linearly to its rest in log zoom so it never swings away; a creep to the
// end. All through the shared damper (runCam3).
// ---------------------------------------------------------------------------
const K_KNOTS: [number, number][] = [
  [0, 3.4],
  [28, 1.75],
  [52, 1.4],
  [98, K_WIDE],
  [PUSH_F0, K_WIDE * 0.99],
];
const X_KNOTS: [number, number][] = [
  [0, 262],
  [28, 380],
  [52, 372],
  [98, 540],
  [PUSH_F0, 540],
];
const Y_KNOTS: [number, number][] = [
  [0, 228],
  [28, 506],
  [52, 600],
  [70, 850],
  [88, 955],
  [98, 960],
  [PUSH_F0, 962],
];
const F_SCREEN: P = { x: 430, y: 985 }; // where the found tile rests at the payoff
const CAM = (() => {
  const lk = hermite(
    K_KNOTS.map((n) => n[0]),
    K_KNOTS.map((n) => Math.log(n[1])),
  );
  const xs = hermite(
    X_KNOTS.map((n) => n[0]),
    X_KNOTS.map((n) => n[1]),
  );
  const ys = hermite(
    Y_KNOTS.map((n) => n[0]),
    Y_KNOTS.map((n) => n[1]),
  );
  const K: number[] = [];
  const CX: number[] = [];
  const CY: number[] = [];
  const k0 = Math.exp(lk(PUSH_F0));
  const c0 = { x: xs(PUSH_F0), y: ys(PUSH_F0) };
  const s0 = { x: (F.x - c0.x) * k0, y: (F.y - c0.y) * k0 };
  const s1 = { x: F_SCREEN.x - 540, y: F_SCREEN.y - 960 };
  for (let f = 0; f <= DURATION + 1; f++) {
    if (f <= PUSH_F0) {
      K.push(Math.exp(lk(f)));
      CX.push(xs(f));
      CY.push(ys(f));
      continue;
    }
    const g = camEase((f - PUSH_F0) / (PUSH_F1 - PUSH_F0), 0.8);
    const creep = 1 + 0.03 * smoothstep((f - PUSH_F1) / (DURATION - PUSH_F1));
    const k = k0 * Math.pow(K_PAY / k0, g) * creep;
    K.push(k);
    CX.push(F.x - lerp(s0.x, s1.x, g) / k);
    CY.push(F.y - lerp(s0.y, s1.y, g) / k);
  }
  return { K, CX, CY };
})();

// tiles whose drained outline would cross the payoff group: they never bring it up
const PAY_CLEAR_SET = new Set(
  TILES.map((t, n) => ({ t, n }))
    .filter(({ t, n }) => {
      if (n === FOUND_I) return false;
      const h = (t.ds * SHRINK) / 2 + DR_STROKE;
      return PAY_CLEAR.some((r) => t.x + h > r.x0 && t.x - h < r.x1 && t.y + h > r.y0 && t.y - h < r.y1);
    })
    .map(({ n }) => n),
);

// ---------------------------------------------------------------------------
// ICONS (Lucide, ISC), 24-unit boxes
// ---------------------------------------------------------------------------
const ICON_FLASK = `<path d="M14 2v6a2 2 0 0 0 .245.96l5.51 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.755-2.96l5.51-10.08A2 2 0 0 0 10 8V2"/><path d="M6.453 15h11.094"/><path d="M8.5 2h7"/>`;
const ICON_THERMO = `<path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/>`;
const MAG_PATH = squirclePath(MAG, MAG);

// The magnet's height over its float, world px, at a frame and zoom: the drop is authored in SCREEN px (so it
// enters from the top edge and decelerates at a speed the eye can follow while the camera pushes in), then the
// catch carries on into the bob — first a little further down towards the tile, then back up.
const magnetDrop = (frame: number, k: number) => {
  const u = clamp01((frame - MAG_F0) / (MAG_F1 - MAG_F0));
  return (MAG_DROP * Math.pow(1 - u, 1.4)) / k;
};
const magnetLift = (frame: number, k: number) => {
  const drop = magnetDrop(frame, k);
  const t = frame - MAG_F1;
  const bob = t > 0 ? -BOB * Math.sin(t * 0.17) * smoothstep(t / 6) : 0;
  return drop + bob;
};

// ---------------------------------------------------------------------------
const RoomTempSuperconductor: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const cam = runCam3(frame, CAM.CX, CAM.CY, CAM.K);
  const k = cam.k;
  const s = sway(frame);
  const cx = cam.cx + s.dx / k;
  const cy = cam.cy + s.dy / k;
  const { tx, ty } = worldTransform(cx, cy, k);
  const icon = iconShadow(k);
  const thw = THREAD_PX / k;
  const headR = HEAD_PX / k;

  // --- the drain: every tile but the found one, the lab, the AI and humanity go to their flat dim tones ----
  const drain = interpolate(frame, [DRAIN_F0, DRAIN_F1], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });

  // --- the AI's thread to the lab -------------------------------------------------------------------------
  const dirAL = { x: (LAB.x - AI.x) / dist(AI, LAB), y: (LAB.y - AI.y) / dist(AI, LAB) };
  const thFrom = { x: AI.x + dirAL.x * (AI_MARK / 2 + 8), y: AI.y + dirAL.y * (AI_MARK / 2 + 8) };
  const thTo = { x: LAB.x - dirAL.x * (LAB_R + STROKE / 2 + 4), y: LAB.y - dirAL.y * (LAB_R + STROKE / 2 + 4) };
  const thU = interpolate(frame, [TH_F0, TH_F1], [0, 1], { ...clamp, easing: Easing.bezier(0.33, 0, 0.45, 1) });
  const thTip = { x: lerp(thFrom.x, thTo.x, thU), y: lerp(thFrom.y, thTo.y, thU) };
  const aiPackets =
    frame > TH_F1 + 2 ? threadPackets({ frame, k, from: thFrom, to: thTo, period: 13, phase: TH_F1 + 2 }) : [];
  const thFade = 1 - drain; // a thread fades (the Thread mechanism); only lines do

  // --- the lab ring converts from the contact point, both ways ---------------------------------------------
  const contactAng = Math.atan2(-dirAL.y, -dirAL.x);
  const conv =
    frame < TH_F1
      ? 0
      : Math.max(
          0.035 * smoothstep((frame - TH_F1) / 3),
          interpolate(frame, [TH_F1 + 2, CONV_F1 - 1], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) }),
        );
  const labOrange = DRAIN_LIT(drain);
  const inkNow = DRAIN_INK(drain);

  // --- tiles ----------------------------------------------------------------------------------------------
  const light = smoothstep((frame - FIND_F1) / LIGHT_DUR);

  type Th = { key: string; x1: number; y1: number; x2: number; y2: number; head: boolean; op: number; col: string; w: number };
  const threads: Th[] = [];
  const LAB_SPEED = 30; // world px / frame a lab thread draws at
  const pushLabThread = (key: string, t: Tile, arrive: number, holdF: number, op: number) => {
    const dv = { x: t.x - LAB.x, y: t.y - LAB.y };
    const L = Math.hypot(dv.x, dv.y);
    const ux = dv.x / L;
    const uy = dv.y / L;
    const a = { x: LAB.x + ux * (LAB_R + STROKE / 2 + 3), y: LAB.y + uy * (LAB_R + STROKE / 2 + 3) };
    const b = { x: t.x - ux * (t.ds / 2 + 3), y: t.y - uy * (t.ds / 2 + 3) };
    const len = dist(a, b);
    const dur = Math.max(5, len / LAB_SPEED);
    const age = frame - (arrive - dur);
    if (age < 0) return;
    const u = clamp01(age / dur);
    const fade = interpolate(age, [dur + holdF, dur + holdF + 8], [1, 0], clamp);
    if (fade <= 0.01) return;
    threads.push({
      key,
      x1: a.x,
      y1: a.y,
      x2: lerp(a.x, b.x, u),
      y2: lerp(a.y, b.y, u),
      head: u < 1,
      op: op * fade,
      col: ACCENT,
      w: thw,
    });
  };

  const tileEls = TILES.map((t, n) => {
    const isFound = n === FOUND_I;
    const tFlip = t.tH < Infinity ? t.tH : t.tAI;
    const human = t.tH < Infinity;
    if (!human && (t.thread || isFound)) pushLabThread(`l${n}`, t, t.tAI, 2, 0.8);
    if (human) {
      const from = H_FROM[n] as Dot;
      const age = frame - (t.tH - H_THREAD);
      if (age >= 0) {
        const u = clamp01(age / H_THREAD);
        const fade = interpolate(age, [H_THREAD + 3, H_THREAD + 11], [1, 0], clamp);
        if (fade > 0.01) {
          const dv = { x: t.x - from.x, y: t.y - from.y };
          const L = Math.hypot(dv.x, dv.y);
          const a = { x: from.x + (dv.x / L) * (from.r + 2), y: from.y + (dv.y / L) * (from.r + 2) };
          const b = { x: t.x - (dv.x / L) * (t.ds / 2 + 3), y: t.y - (dv.y / L) * (t.ds / 2 + 3) };
          threads.push({
            key: `h${n}`,
            x1: a.x,
            y1: a.y,
            x2: lerp(a.x, b.x, u),
            y2: lerp(a.y, b.y, u),
            head: u < 1,
            op: 0.75 * fade,
            col: INK,
            w: thw * 0.9,
          });
        }
      }
    }
    const fu = clamp01((frame - tFlip) / FLIP);
    // the flip: the tile turns on its own axis, its face swapping at the edge-on moment
    const sx = frame < tFlip ? 1 : 0.12 + 0.88 * Math.abs(Math.cos(Math.PI * fu));
    const tested = frame >= tFlip && fu >= 0.5;
    return { t, n, sx, tested, human, isFound };
  });
  if (frame >= FIND_F0 - 12) {
    pushLabThread("find", TILES[FOUND_I], FIND_F1, 6, 0.95);
  }

  const grow = smoothstep((frame - FIND_F1) / 16);
  const foundW = (TS + TILE_STROKE) * (1 + (FOUND_GROW - 1) * grow);
  const shr = 1 - (1 - SHRINK) * drain;
  const rotK = 1 - (1 - ROT_KEEP) * drain;
  const empty = smoothstep(drain * 1.15); // the face shrinking away inside the outline
  const outIn = smoothstep(drain / 0.55); // a tested tile's outline coming up under its emptying face
  // the found tile turning side-on into the slab: one material changing shape
  const morph = Easing.inOut(Easing.cubic)(clamp01((frame - MORPH_F0) / (MORPH_F1 - MORPH_F0)));
  const bodyW = lerp(foundW, SLAB_W, morph);
  const bodyH = lerp(foundW, SLAB_H, morph);
  const bodyC = { x: lerp(F.x, SLAB_C.x, morph), y: lerp(F.y, SLAB_C.y, morph) };
  const topH = SLAB_TOP * morph; // the top face comes into view as it swings
  const bodyTop = bodyC.y - bodyH / 2;
  const bodyPath = squirclePath(bodyW, bodyH);
  const bodyAt = `translate(${(bodyC.x - bodyW / 2).toFixed(3)} ${bodyTop.toFixed(3)})`;
  const drawTile = (e: (typeof tileEls)[number]) => {
    const { t, sx, tested, human, isFound } = e;
    const at = (w: number) => `translate(${(-w / 2).toFixed(3)} ${(-w / 2).toFixed(3)})`;
    if (isFound) {
      const w = t.ds;
      if (tested && sx >= 0.999) {
        return (
          <g key={`t${e.n}`}>
            <path d={bodyPath} transform={bodyAt} fill={TONE(light)} />
            {topH > 0.05 ? (
              <g clipPath="url(#rts-slab-top)">
                <path d={bodyPath} transform={bodyAt} fill={HIGHLIGHT} />
              </g>
            ) : null}
          </g>
        );
      }
      return (
        <g key={`t${e.n}`} transform={`translate(${t.x.toFixed(3)} ${t.y.toFixed(3)}) scale(${sx.toFixed(4)} 1)`}>
          {tested ? (
            <path d={squirclePath(foundW, foundW)} transform={at(foundW)} fill={TONE(light)} />
          ) : (
            <path d={t.d} transform={at(w)} fill="none" stroke={INK} strokeOpacity={INK_LO} strokeWidth={TILE_STROKE} />
          )}
        </g>
      );
    }
    const ow = t.ds * shr; // the outline's size
    const sw = TILE_STROKE + (DR_STROKE - TILE_STROKE) * drain;
    const op = PAY_CLEAR_SET.has(e.n)
      ? tested
        ? 0
        : INK_LO * (1 - drain)
      : tested
        ? OP_RECEDE * outIn
        : INK_LO + (OP_RECEDE - INK_LO) * drain;
    const fw = (t.ds + TILE_STROKE) * shr * (1 - empty); // the solid face
    return (
      <g
        key={`t${e.n}`}
        transform={`translate(${t.x.toFixed(3)} ${t.y.toFixed(3)}) rotate(${(t.rot * rotK).toFixed(3)}) scale(${sx.toFixed(4)} 1)`}
      >
        {op > 0.004 ? (
          <path d={squirclePath(ow, ow)} transform={at(ow)} fill="none" stroke={INK} strokeOpacity={op} strokeWidth={sw} />
        ) : null}
        {tested && fw > 0.3 ? (
          <path d={squirclePath(fw, fw)} transform={at(fw)} fill={human ? inkNow : DRAIN_AI(drain)} />
        ) : null}
      </g>
    );
  };

  // --- the magnet: dropped in from above, caught on a gap of air, bobbing --------------------------------
  const lift = frame >= MAG_F0 ? magnetLift(frame, k) : Infinity;
  const magY = FLOAT_Y - lift;
  const magX = SLAB_C.x + (lift < Infinity ? MAG_SWING * magnetDrop(frame, k) : 0);
  // its shadow: a thin soft ellipse on the slab's top face, directly under it; grows and darkens as it comes
  // down, breathes with the bob
  const air = lift + GAP; // world px between the magnet's underside and the slab
  const shade = clamp01(1 - (air - GAP) / (MAG * 2.2));
  const shRx = (MAG * 0.55 * (0.8 + 0.2 * shade)) / (1 + (air - GAP) * 0.015);
  const shRy = SLAB_TOP * 0.32 * (0.8 + 0.2 * shade);
  const shOp = 0.5 * shade * morph;
  const shX = magX;

  // --- the thermometer + label: slide up while fading in --------------------------------------------------
  const thIn = smoothstep((frame - THERMO_F0) / 10);
  const rise = worldPx(36, K_PAY) * (1 - thIn);
  const tb = THERMO_BOX;
  const level = 9.6; // the column's top, in the icon's 24 units: a middling reading

  return (
    <AbsoluteFill style={{ backgroundColor: BG_BASE }}>
      <GridBackground
        src="grid-background.jpg"
        blur={13}
        dim={BG_DIM}
        frame={frame}
        cy={cy}
        cyRest={CAM.CY[0]}
        cx={cx}
        cxRest={CAM.CX[0]}
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
            transform: `translate(${tx}px, ${ty}px) scale(${k})`,
          }}
        >
          <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            <defs>
              <clipPath id="rts-mag-top">
                <rect x={-MAG} y={-MAG} width={MAG * 2} height={MAG} />
              </clipPath>
              <clipPath id="rts-slab-top">
                <rect x={bodyC.x - bodyW / 2 - 1} y={bodyTop - 1} width={bodyW + 2} height={topH + 1} />
              </clipPath>
              <filter id="rts-soft" x="-50%" y="-200%" width="200%" height="500%">
                <feGaussianBlur stdDeviation={1.6} />
              </filter>
            </defs>

            {/* the field of candidate materials */}
            <g style={{ filter: icon }}>{tileEls.filter((e) => !e.isFound).map(drawTile)}</g>
            <g style={{ filter: icon }}>{drawTile(tileEls[FOUND_I])}</g>

            {/* the magnet's shadow, on the slab's top face, directly under it */}
            {shOp > 0.005 ? (
              <g clipPath="url(#rts-slab-top)">
                <ellipse
                  cx={shX}
                  cy={bodyTop + topH * 0.5}
                  rx={shRx}
                  ry={shRy}
                  fill="#000000"
                  opacity={shOp}
                  filter="url(#rts-soft)"
                />
              </g>
            ) : null}

            {/* threads: the lab's tests (orange) and humanity's (white), head-led */}
            {threads.map((t) => (
              <g key={t.key} opacity={t.op}>
                <line x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke={t.col} strokeWidth={t.w} strokeLinecap="round" />
                {t.head ? <circle cx={t.x2} cy={t.y2} r={headR} fill={INK} /> : null}
              </g>
            ))}

            {/* humanity */}
            <g>
              {CROWD.map((d) => (
                <circle key={`c${d.i}`} cx={d.x} cy={d.y} r={d.r * breath(frame, hash(d.i, 25))} fill={inkNow} />
              ))}
            </g>

            {/* the AI's remote access: the thread to the lab, then its packets */}
            {thU > 0 && thFade > 0.01 ? (
              <g opacity={thFade}>
                <line x1={thFrom.x} y1={thFrom.y} x2={thTip.x} y2={thTip.y} stroke={ACCENT} strokeWidth={thw} strokeLinecap="round" />
                {thU < 1 ? <circle cx={thTip.x} cy={thTip.y} r={headR} fill={INK} /> : null}
                {aiPackets.map((q, i) => (
                  <circle key={`p${i}`} cx={q.x} cy={q.y} r={PACKET_PX / k} fill={ACCENT} />
                ))}
              </g>
            ) : null}

            {/* the lab: a white station ring with a flask, converting from the thread's contact point */}
            <g style={{ filter: icon }}>
              <circle cx={LAB.x} cy={LAB.y} r={LAB_R} fill="none" stroke={inkNow} strokeWidth={STROKE} />
              {conv > 0 ? (
                conv >= 1 ? (
                  <circle cx={LAB.x} cy={LAB.y} r={LAB_R} fill="none" stroke={labOrange} strokeWidth={STROKE + 0.4} />
                ) : (
                  <path
                    d={arcPath(LAB.x, LAB.y, LAB_R, contactAng - Math.PI * conv, contactAng + Math.PI * conv)}
                    fill="none"
                    stroke={labOrange}
                    strokeWidth={STROKE + 0.4}
                    strokeLinecap="round"
                  />
                )
              ) : null}
              <g
                transform={`translate(${LAB.x - LAB_R * 0.6} ${LAB.y - LAB_R * 0.6}) scale(${(LAB_R * 1.2) / 24})`}
                fill="none"
                stroke={inkNow}
                strokeWidth={(STROKE * 24) / (LAB_R * 1.2)}
                strokeLinecap="round"
                strokeLinejoin="round"
                dangerouslySetInnerHTML={{ __html: ICON_FLASK }}
              />
            </g>

            {/* the AI: the OpenAI mark */}
            {(() => {
              const sz = AI_MARK * breath(frame, 0.37);
              return (
                <g transform={`translate(${AI.x - sz / 2} ${AI.y - sz / 2}) scale(${sz / 24})`}>
                  {OPENAI.paths.map((d, i) => (
                    <path key={i} d={d} fill={labOrange} fillRule="evenodd" />
                  ))}
                </g>
              );
            })()}

            {/* the magnet: N half white, S half drained white, both solid */}
            {lift < Infinity ? (
              <g style={{ filter: icon }}>
                <g transform={`translate(${magX.toFixed(3)} ${magY.toFixed(3)})`}>
                  <g transform={`translate(${-MAG / 2} ${-MAG / 2})`}>
                    <path d={MAG_PATH} fill={DIM_INK} />
                  </g>
                  <g clipPath="url(#rts-mag-top)">
                    <g transform={`translate(${-MAG / 2} ${-MAG / 2})`}>
                      <path d={MAG_PATH} fill={INK} />
                    </g>
                  </g>
                </g>
              </g>
            ) : null}

            {/* room temperature */}
            {thIn > 0 ? (
              <g style={{ filter: icon }} opacity={thIn}>
                <g
                  transform={`translate(${THERMO.x - tb / 2} ${THERMO.y - tb / 2 + rise}) scale(${tb / 24})`}
                  fill="none"
                  stroke={INK}
                  strokeWidth={(worldPx(10, K_PAY) * 24) / tb}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <g dangerouslySetInnerHTML={{ __html: ICON_THERMO }} />
                  <circle cx={12} cy={17.6} r={2.0} fill={INK} stroke="none" />
                  <line x1={12} y1={17.6} x2={12} y2={level} stroke={INK} strokeWidth={1.9} />
                </g>
              </g>
            ) : null}
          </svg>
          <Label
            k={k}
            x={LABEL_X}
            y={THERMO.y - LABEL_SIZE * 0.5}
            text="20 °C"
            inT={thIn}
            size={LABEL_SIZE}
            align="left"
          />
        </div>
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

export default RoomTempSuperconductor;
