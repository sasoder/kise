// ---------------------------------------------------------------------------
// DrowningInApplications (shruti-trailer, cut 53). Core Memory podcast style, the ARCHIVE COLLAGE at 16:9 (base:
// ../neal-stephenson-trailer/nealShared). Opaque 1920x1080, 23.976 fps, 140 frames.
//
// CHECK LINE: "Shruti's desk disappears under a flood of grant applications, and most of them turn out to be the same
// machine-made copy." (Sound off: "the applications pile up and bury the desk, and most of them are identical AI
// copies.")
//
// THE LINE (Shruti Rajagopalan, Emergent Ventures India; on camera before and the Naman Pushp news card after):
//   "I'm getting about 200 applications a week, I'm drowning in them, and a lot of it is now AI slop."
// WORD -> FRAME (local onset): getting 4 · about 8 · 200 12 · applications 18 · a 30 · week 37 · I'm 43 · drowning 47 ·
//   in 54 · them 59 · and 64 · a 74 · lot 85 · of 105 · it 108 · is 111 · now 115 · AI 118 · slop 125 · ends ~133.
// DURATION: the slot 53.762 -> 59.601 s (sequence f1289 -> f1429) = 5.839 s x 23.976 = 140 frames (f0..f139).
//
// THE MOTION (rev 2): one continuous rain of application sheets (b&w cut-outs, each on its hard shadow) onto an empty
// office desk standing on the squared paper. Every sheet drifts down from above the frame on ONE speed profile (eased
// in off-frame, eased out into its rest; ~22-38 frames a fall), swaying and tumbling less and less, leaning into its
// sideways drift, and comes to rest on the heap, which is SIMULATED sheet by sheet (each sheet lies on the sheets under
// it and raises the pile only where it covers, toward a planned height; it goes where the plan has most room). The
// rain starts light and accelerates: f0-16 a handful, landing on the desk top (a small pile starts there); f16-40
// thickening (the desk pile grows, a few slide off its edges, low heaps start either side); f40-58 the flood: the
// heaps close over the desk from both sides (sheets land on the heaps beside it and slide inward across its face)
// and from below, swallowing it on "drowning" (f47), the last edge under by ~f54. By f64 a BROAD hill fills the lower
// ~55% of the frame across its whole width (sheets sliding down its flanks), then rises slowly with fewer sheets in
// the air. The camera pulls back a little and tilts up with the pile (f0-58), then turns smoothly into a push-in on
// the face of the heap (f58 on, stronger from f64, still creeping at f139). From "lot" (f84) a wave runs left to
// right across the frame (f84-114): about two in three of the sheets it passes, on the heap or still in the air,
// flip over (10 frames, about their vertical axis, on a blank sheet back so the heap shows paper where the turning
// sheet narrows) and come up as ONE identical machine-regular form, upright and full size, with a large OpenAI
// knot printed bottom-right; the rest keep their own varied layouts and angles. New sheets spawned from f84 are the
// same copy about two times in three. The change is complete by "slop" (f125: ~2/3 of the sheets on screen are the
// copy); to f139 a few copies still drift down, film life.
// Sizes: the desk 660 world px wide, top ~y 600 at f0; sheets 160 world px tall (~160 px falling at f0). Rev 3: from
// f64 the push-in runs to k ~1.9 at f139 (one smooth lobe, still creeping), so the heap-face sheets are ~280-310 px
// tall at f118-139 and the knot (41 % of the copy's width, ~51 world px) is ~82 px at f118, ~88 px at f125, ~97 px
// at f139 at 1920 wide.
// THE READER (rev 4, user note "a cutout of the person behind the desk ... a bit more personal"): an anonymous woman
// (a stand-in for whoever reads the applications; never the speaker, never named) sits behind the desk, forearms on
// its top, head bowed over her reading, 330 world px wide (shoulders ~1/3 of the desk), on the same +4/+4 hard shadow.
// She is alive with two rigid transforms only: a slow breath (0.6 % stretch from her bottom edge) and a tiny sway
// (+-0.6 deg). Desk-top sheets land around her, never over her face. The rising heap lifts her (she only rises,
// smoothly, following the simulated heap across her shoulders), so from "drowning" on she is up to her chest and
// shoulders in paper, head clear, and stays there through the wave and the push-in. Sheets that would cover her face
// rest BEHIND her (a fixed per-sheet split: behind for the whole fall, or in front for the whole fall, no flicker),
// and every sheet that comes to rest in front of her slides in from beside her, so none settles across her face.
// Rev 4 aims the push-in ~120 world px higher (PUSH_Y), so her head sits in the upper middle of the frame to f139.
// No text and no counter; the OpenAI knot is the only logo. CHAIN: none (the chain means India's outliers).
//
// SOURCES (all baked to public/shruti-trailer/drowning/ by scripts/clips/shruti-trailer/bake-drowning-sheets.py,
// pre-graded to the archive look, each with a pure black shadow sprite):
//   the desk: <working>/animation_source/assets/desk_steel_woodtop.jpg (Bonner Springs Library, CC BY 2.0), matted
//     with the Vision matte (neal-matte.swift + subject-cutout.py) to assets-src/shruti-trailer/desk_cutout.png;
//   the paper: <working>/animation_source/assets/paper_scattered_sheets.jpg (Brandi Redd / Unsplash, CC0), a flat
//     crop used as the texture of every sheet (the print layouts on it are drawn: three varied letters/forms and the
//     one slop form);
//   the OpenAI knot: <working>/animation_source/assets/openai_symbol.svg, rasterised black by
//     scripts/clips/shruti-trailer/bake-drowning-mark.mjs to assets-src/shruti-trailer/openai_mark_black.png;
//   the reader (rev 4): <working>/animation_source/assets/person_desk_a_SriLankaClerkReadingLedger.jpg, photo by
//     Peter van der Sluijs / Wikimedia Commons, CC BY-SA 3.0; matted (Vision fg + subject-cutout.py, the calculator
//     under her hand removed) to assets-src/shruti-trailer/person_cutout.png, graded b&w. THIS GRAPHIC IS A DERIVATIVE
//     WORK OF THAT PHOTO AND IS SHARED UNDER CC BY-SA 3.0 (credit: Peter van der Sluijs / Wikimedia Commons).
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, Img, random, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import { type NealCam, NealFilmLife, NealPaper, NealPlane, NealSvg, PhotoCutOut, SHADOW_OFF, W, H } from "../neal-stephenson-trailer/nealShared";

export const FPS = 24000 / 1001;
export const DURATION = 140;
export const schema = z.object({ debug: z.boolean() });
export const defaultProps = schema.parse({ debug: false });

const DIR = "shruti-trailer/drowning/";
const SPRITES = ["sheet_a", "sheet_b", "sheet_c"] as const;
const SLOP = "slop";

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
/** quintic smootherstep: zero velocity and acceleration at both ends */
const smoother = (x: number) => {
  const t = clamp01(x);
  return t * t * t * (t * (6 * t - 15) + 10);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** piecewise-linear table lookup */
const table = (pts: readonly (readonly [number, number])[], t: number) => {
  if (t <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    if (t <= pts[i][0]) return lerp(pts[i - 1][1], pts[i][1], (t - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]));
  }
  return pts[pts.length - 1][1];
};
/** a standard normal from two seeded uniforms (Box-Muller) */
const gauss = (seed: string) => {
  const u = Math.max(1e-6, random(`${seed}-u`));
  const v = random(`${seed}-v`);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

// ---------------------------------------------------------------------------
// THE CAMERA: one continuous move. A small pull-back with a tilt up as the pile rises (S over f-6..62), which hands
// over smoothly (the two quintic ramps overlap) to the push-in on the heap face (S over f56..152). Rev 3: from f64 a
// stronger push (S over f64..164, starting at zero speed, so every frame before f64 is rev 2's) aimed at the front of
// the heap's face, so the copies near the middle are big at "AI slop" (k ~1.6 at f118, ~1.72 at f125, ~1.9 at f139,
// still creeping): their knots ~80-90 px at 1920 wide.
// ---------------------------------------------------------------------------
const CAM0 = { x: 960, y: 520 };
/** rev 2's camera (the landing spread is planned on it, so the simulation is rev 2's to the sheet) */
const camRev2 = (f: number): NealCam => {
  const a = smoother((f + 6) / 68);
  const b = smoother((f - 56) / 96);
  return { x: CAM0.x + 8 * b, y: CAM0.y - 60 * a - 62 * b, k: 1.0 - 0.1 * a + 0.52 * b, x0: CAM0.x, y0: CAM0.y };
};
const PUSH_K = 0.56;
const PUSH_Y = -90;
export const camAt = (f: number): NealCam => {
  const c0 = camRev2(f);
  const c = smoother((f - 64) / 100);
  return { ...c0, y: c0.y + PUSH_Y * c, k: c0.k + PUSH_K * c };
};
/** the world y of the frame's top edge, and the half-width in world px, at frame f */
const frameTop = (f: number) => {
  const c = camAt(f);
  return c.y - H / 2 / c.k;
};

// ---------------------------------------------------------------------------
// THE WORLD (focus plane, world px). The desk stands on the floor line FLOOR; its top surface is DESK_SURF.
// ---------------------------------------------------------------------------
const FLOOR = 1010;
const DESK = { cx: 960, w: 660, aspect: 1375 / 820 };
const DESK_H = DESK.w / DESK.aspect;
const DESK_HALF = DESK.w / 2;
/** where sheets lying on the bare desk top touch it (the middle of its top surface in the sprite) */
const DESK_SURF = FLOOR - DESK_H + 48;

export const SHEET_H = 160;
export const SHEET_ASPECT = 360 / 466;
export const SHEET_W = SHEET_H * SHEET_ASPECT;
/** how far a sheet sinks below the surface line it lands on (it covers the top of what is under it) */
const NEST = 0.36 * SHEET_H;
/** on the bare desk top they sink less: they lie on it, over its front edge only a little */
const NEST_DESK = 0.16 * SHEET_H;

type Pt = [number, number];

/** the rotated sheet's half-extent in y (for resting its lowest point on a line) */
const halfY = (rotDeg: number, scale: number) => {
  const r = (rotDeg * Math.PI) / 180;
  return 0.5 * scale * (SHEET_W * Math.abs(Math.sin(r)) + SHEET_H * Math.abs(Math.cos(r)));
};

// The heap is SIMULATED once at module load, sheet by sheet in landing order, on two support lines sampled every
// COL world px: the front mound AF (in front of and around the desk, from the floor up) and the desk-top pile AD
// (on the desk). A sheet rests with its lowest point NEST below the highest support under its middle; it then
// raises the support only in the columns it really covers (its rotated outline reaches down to the old support
// there), to its top edge + COVER - NEST, and never above a DESIGNED cap (DF / DD: the mound's planned height over
// time, so the growth is exact). So everything below a support line + NEST is covered by paper (the invariant the
// heap's depth fill relies on), the heap's shape follows the plan, and a sheet can only sit on sheets.
const COL = 16;
const X_MIN = -900;
const X_MAX = 2820;
const NCOL = Math.round((X_MAX - X_MIN) / COL) + 1;
const colX = (i: number) => X_MIN + i * COL;
const colOf = (x: number) => Math.max(0, Math.min(NCOL - 1, Math.round((x - X_MIN) / COL)));
/** the next sheets' bottoms sit COVER below a covering sheet's top edge (each sheet shows ~ 2e - COVER) */
const COVER = 0.34 * SHEET_H;
// the front mound: its height over the desk's middle (HF) and its half-width (WF). A BROAD hill: low heaps either
// side of the desk (f16-40), the flood over the desk (f40-58), a hill across the whole frame width by f64 (top about
// 45% down the frame, the flanks ~60% down at the frame edges), then rising slowly under the push-in
const HF: readonly (readonly [number, number])[] = [
  [0, 0],
  [14, 0],
  [24, 30],
  [34, 100],
  [42, 220],
  [47, 320],
  [52, 420],
  [58, 530],
  [64, 640],
  [100, 690],
  [139, 720],
  [220, 820],
];
const WF: readonly (readonly [number, number])[] = [
  [0, 600],
  [30, 900],
  [47, 1300],
  [64, 1500],
  [139, 1650],
  [220, 1900],
];
const HD: readonly (readonly [number, number])[] = [
  [0, 0],
  [16, 20],
  [36, 70],
  [52, 110],
];
const bump = (u: number) => (u >= 1 ? 0 : Math.pow(1 - u * u, 0.9));
/** the front mound's planned surface y (a cap) at x, time t */
export const frontCap = (x: number, t: number) => FLOOR - table(HF, t) * bump(Math.abs(x - DESK.cx) / table(WF, t));
/** the desk-top pile's planned surface y (a cap) at x, time t (only over the desk) */
const deskCap = (x: number, t: number) => {
  const u = Math.abs(x - DESK.cx) / DESK_HALF;
  if (u > 1) return Infinity;
  return DESK_SURF - table(HD, t) * (1 - Math.pow(u, 6));
};

/** the vertical extent [ymin, ymax] of a rotated sheet (centre cx, cy) in the column at x, or null */
const spanAt = (cx: number, cy: number, rotDeg: number, scale: number, x: number): [number, number] | null => {
  const r = (rotDeg * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  const hw = (SHEET_W * scale) / 2;
  const hh = (SHEET_H * scale) / 2;
  const P: Pt[] = [
    [-hw, -hh],
    [hw, -hh],
    [hw, hh],
    [-hw, hh],
  ].map(([px, py]) => [cx + px * c - py * s, cy + px * s + py * c]);
  let lo = Infinity;
  let hi = -Infinity;
  for (let i = 0; i < 4; i++) {
    const [ax, ay] = P[i];
    const [bx, by] = P[(i + 1) % 4];
    if ((x < Math.min(ax, bx)) || (x > Math.max(ax, bx)) || ax === bx) continue;
    const y = ay + ((x - ax) / (bx - ax)) * (by - ay);
    lo = Math.min(lo, y);
    hi = Math.max(hi, y);
  }
  return lo <= hi ? [lo, hi] : null;
};

type Rest = { x: number; y: number; rot: number; scale: number };
/** rest a sheet on support line A at x (its lowest point NEST below the deepest support under its middle) */
const restOn = (A: number[], x: number, rot: number, scale: number, nest = NEST): Rest => {
  // the DEEPEST support under its middle: a sheet sinks into a dip rather than bridging it, so no hole is left
  // under the heap's face; it overlaps higher neighbours in front, as a collage
  const half = 0.28 * SHEET_W * scale;
  let top = -Infinity;
  for (let i = colOf(x - half); i <= colOf(x + half); i++) if (Number.isFinite(A[i])) top = Math.max(top, A[i]);
  return { x, y: top + nest - halfY(rot, scale), rot, scale };
};
/** raise support line A where the sheet covers it, never above the cap */
const deposit = (A: number[], r: Rest, cap: (x: number) => number) => {
  const reach = 0.5 * Math.hypot(SHEET_W, SHEET_H) * r.scale;
  for (let i = colOf(r.x - reach); i <= colOf(r.x + reach); i++) {
    const sp = spanAt(r.x, r.y, r.rot, r.scale, colX(i));
    if (!sp || !Number.isFinite(A[i])) continue;
    // it covers this column only if it reaches down into what is already covered there (everything below the old
    // support + NEST - COVER is paper), so no chink opens under it
    if (sp[1] < A[i] + NEST - COVER + 10) continue;
    A[i] = Math.max(cap(colX(i)), Math.min(A[i], sp[0] + COVER - NEST));
  }
};

// ---------------------------------------------------------------------------
// THE RAIN: landings per frame, a smooth ramp (a continuous stream, thickest around "drowning", thinning to a few
// by "slop"); the j-th sheet lands where the running count passes j (+ a little jitter).
// ---------------------------------------------------------------------------
// light and accelerating: a handful to f16 (onto the desk top), thickening f16-40, the flood f40-58, then fewer
const RATE: readonly (readonly [number, number])[] = [
  [0, 0.2],
  [16, 0.3],
  [26, 0.5],
  [34, 0.9],
  [40, 1.7],
  [44, 3.4],
  [48, 5.6],
  [56, 6.0],
  [60, 4.2],
  [66, 2.2],
  [76, 1.2],
  [100, 0.8],
  [116, 0.8],
  [139, 0.9],
  [210, 0.9],
];
const T_END = 205;

/** spawning sheets from here on are mostly the identical copy */
const SLOP_SPAWN_T = 84;
const P_SLOP_BORN = 0.65;
/** the wave: its front runs linearly across x WAVE_X0 -> WAVE_X1 over WAVE_T0 -> WAVE_T1 */
const WAVE_T0 = 84;
const WAVE_T1 = 114;
const WAVE_X0 = 120;
const WAVE_X1 = 1800;
const P_FLIP = 0.7;
const FLIP_DUR = 10;

// the flight: duration from the drop, one ease (smooth rise and settle: from TonsOfTVShows rev 2)
const DUR_BASE = 8;
const DUR_PER_PX = 0.016;
const RAMP_IN = 0.42;
const RAMP_OUT = 0.5;
const N_E = 1000;
const E_TABLE: number[] = (() => {
  const out = [0];
  for (let j = 1; j <= N_E; j++) {
    const u = (j - 0.5) / N_E;
    out.push(out[j - 1] + smoother(u / RAMP_IN) * smoother((1 - u) / RAMP_OUT));
  }
  return out.map((x) => x / out[N_E]);
})();
const ease = (u: number) => {
  if (u <= 0) return 0;
  if (u >= 1) return 1;
  const t = u * N_E;
  const j = Math.floor(t);
  return E_TABLE[j] + (E_TABLE[j + 1] - E_TABLE[j]) * (t - j);
};

export type Sheet = {
  j: number;
  tl: number; // landing frame
  ts: number; // spawn frame (above the frame top)
  dur: number;
  C: [Pt, Pt, Pt, Pt]; // the path: spawn, handle, impact, rest
  rotRest: number;
  rot0: number;
  scale: number;
  sprite: number; // 0..2 an original, -1 born slop
  sway: { a: number; n: number; p: number };
  tumble: { a: number; n: number; p: number };
  flutter: { a: number; n: number; p: number };
  flip: number; // the frame its flip starts (Infinity: never)
  target: "desk" | "front" | "slide" | "flank" | "pour";
};

const bez = (C: [Pt, Pt, Pt, Pt], u: number): Pt => {
  const v = 1 - u;
  const w0 = v * v * v;
  const w1 = 3 * v * v * u;
  const w2 = 3 * v * u * u;
  const w3 = u * u * u;
  return [w0 * C[0][0] + w1 * C[1][0] + w2 * C[2][0] + w3 * C[3][0], w0 * C[0][1] + w1 * C[1][1] + w2 * C[2][1] + w3 * C[3][1]];
};

const LANDINGS: number[] = (() => {
  const out: number[] = [];
  let n = 0;
  let next = 0.5 + 0.35 * (2 * random("land-0") - 1);
  for (let t = RATE[0][0]; t < T_END; t += 0.02) {
    n += table(RATE, t) * 0.02;
    while (n >= next) {
      out.push(t);
      const j = out.length;
      next = j + 0.5 + 0.35 * (2 * random(`land-${j}`) - 1);
    }
  }
  return out;
})();

const P_DESK: readonly (readonly [number, number])[] = [
  [0, 1],
  [24, 0.85],
  [32, 0.4],
  [40, 0.1],
  [46, 0],
];

/** the chance a front sheet keeps clear of the desk's face (the burial runs ~f43-56) */
const P_AVOID_DESK: readonly (readonly [number, number])[] = [
  [0, 1],
  [42, 1],
  [47, 0],
];
/** the half-width of the frame (world px) at frame t, plus a margin: front sheets land where they will be seen */
const visHalf = (t: number) => (0.5 * W) / camRev2(t).k + 140;
/** the share of front sheets (on the flanks) that hit the hill higher up and slide down it */
const P_FLANK_SLIDE = 0.4;
/** the share of the sheets that bury the desk's face which pour in from the heaps beside it */
const P_POUR = 0.8;

// THE READER (rev 4): a woman reading at the desk (an anonymous stand-in for whoever reads the applications), a b&w
// cut-out, waist up, sitting behind the desk with her forearms on its top. world px; her bottom edge is the photo's
// table line, laid on the middle of the desk's top surface.
const PERSON = { x: 960, w: 330, aspect: 1131 / 900, bottom: 674 };
const PERSON_H = PERSON.w / PERSON.aspect;
/** her chin, as a fraction of the cut-out's height from its top */
const CHIN_FR = 0.52;
const CHIN0 = PERSON.bottom - PERSON_H * (1 - CHIN_FR);
/** the middle of her head (cut-out x ~500 of 1131: she bows to her right) */
const HEAD_X = PERSON.x + PERSON.w * ((500 - 565.5) / 1131);
/** desk-top sheets keep this far (x) from her head: they land around her, never over her face */
const HEAD_CLEAR = 140;

const SIM = (() => {
  const AF: number[] = Array.from({ length: NCOL }, () => FLOOR);
  const AD: number[] = Array.from({ length: NCOL }, (_, i) => (Math.abs(colX(i) - DESK.cx) <= DESK_HALF ? DESK_SURF : Infinity));
  /** AF after every landing up to frame t (t = 0 .. DURATION) */
  const snaps: number[][] = [];
  let next = 0;
  const sheets: Sheet[] = [];
  const snapUpTo = (t: number) => {
    while (next <= Math.min(t, DURATION)) snaps[next++] = AF.slice();
  };
  LANDINGS.forEach((tl, j) => {
    snapUpTo(Math.floor(tl - 1e-9));
    const sd = `sheet-${j}`;
    let onDesk = random(`${sd}-pile`) < table(P_DESK, tl);
    let x = DESK.cx + DESK_HALF * 1.08 * (2 * random(`${sd}-dx`) - 1);
    if (onDesk && Math.abs(x - HEAD_X) < HEAD_CLEAR) {
      // around the reader, not over her face: out to her elbows and beyond
      x = HEAD_X + (x < HEAD_X ? -1 : 1) * (HEAD_CLEAR + 50 * random(`${sd}-dhx`));
    }
    const avoid = random(`${sd}-avoid`) < table(P_AVOID_DESK, tl);
    if (!onDesk) {
      // the front mound: the sheet goes where the hill has most room under its plan (the best of a few seeded
      // candidates across the visible width), so the hill grows broad and even; early on only beside the desk
      // (its face stays clear until the heap comes for it)
      const span = Math.min(table(WF, tl), visHalf(tl));
      let best = -Infinity;
      for (let k = 0; k < 6; k++) {
        const xc = DESK.cx + span * (2 * random(`${sd}-fx${k}`) - 1);
        if (avoid && Math.abs(xc - DESK.cx) <= DESK_HALF + 70) continue;
        const score = AF[colOf(xc)] - frontCap(xc, tl) + 50 * random(`${sd}-fs${k}`);
        if (score > best) {
          best = score;
          x = xc;
        }
      }
      if (best === -Infinity) x = DESK.cx + (random(`${sd}-out`) < 0.5 ? -1 : 1) * (DESK_HALF + 70 + 120 * random(`${sd}-out2`));
    }
    // the desk-top pile only while it is above the front mound there
    if (onDesk && AF[colOf(x)] < AD[colOf(x)]) onDesk = false;
    /** it will rest in front of the reader (or behind her): it arrives from beside her */
    const nearHead = !onDesk && tl >= 40 && Math.abs(x - HEAD_X) < 150;
    const slopBorn = tl - 40 >= SLOP_SPAWN_T && random(`${sd}-slop`) < P_SLOP_BORN;
    const sprite = slopBorn ? -1 : Math.floor(random(`${sd}-sprite`) * SPRITES.length) % SPRITES.length;
    let rot = slopBorn ? 0 : Math.max(-32, Math.min(32, 13 * gauss(`${sd}-rot`)));
    const scale = slopBorn ? 1 : 0.93 + 0.14 * random(`${sd}-scale`);
    let target: Sheet["target"] = onDesk ? "desk" : "front";
    let P1: Pt;
    let R: Rest;
    if (onDesk && DESK_HALF - Math.abs(x - DESK.cx) < 34) {
      // lands at the desk's edge and slides off it, down onto the front mound beside the desk
      target = "slide";
      const side = Math.sign(x - DESK.cx) || 1;
      const ex = DESK.cx + side * (DESK_HALF - 30);
      const imp = restOn(AD, ex, rot, scale, NEST_DESK);
      P1 = [imp.x, imp.y];
      if (!slopBorn) rot = side * (14 + 14 * random(`${sd}-slrot`));
      x = DESK.cx + side * (DESK_HALF + 80 + 90 * random(`${sd}-slide`));
      R = restOn(AF, x, rot, scale);
      deposit(AF, R, (xx) => frontCap(xx, tl));
    } else if (
      !onDesk &&
      !avoid &&
      (nearHead || (Math.abs(x - DESK.cx) <= DESK_HALF + 60 && random(`${sd}-pour`) < P_POUR))
    ) {
      // the burial: it lands on the heap beside the desk and slides inward across the desk's face, so the heap
      // closes over the desk from both sides (and the air over the desk stays clear until then). Every sheet that
      // comes to rest in front of the reader arrives this way (from beside her, once the desk is gone), so none
      // settles slowly down across her face
      target = "pour";
      const late = nearHead && tl > 56;
      const c0 = late ? HEAD_X : DESK.cx;
      const side = x === c0 ? 1 : Math.sign(x - c0);
      const reach = late ? 170 + 110 * random(`${sd}-pi`) : DESK_HALF + 60 + 120 * random(`${sd}-pi`);
      const imp = restOn(AF, c0 + side * reach, rot, scale);
      P1 = [imp.x, imp.y];
      if (!slopBorn) rot = -side * (8 + 12 * random(`${sd}-slrot`));
      R = restOn(AF, x, rot, scale);
      deposit(AF, R, (xx) => frontCap(xx, tl));
    } else if (
      !onDesk &&
      tl > 20 &&
      Math.abs(x - DESK.cx) > (avoid ? DESK_HALF + 300 : 260) &&
      random(`${sd}-flank`) < P_FLANK_SLIDE
    ) {
      // hits the hill higher up its flank and slides down it, outward
      target = "flank";
      const side = Math.sign(x - DESK.cx) || 1;
      const imp = restOn(AF, x - side * (100 + 110 * random(`${sd}-fl`)), rot, scale);
      P1 = [imp.x, imp.y];
      if (!slopBorn) rot = side * (10 + 14 * random(`${sd}-slrot`));
      R = restOn(AF, x, rot, scale);
      deposit(AF, R, (xx) => frontCap(xx, tl));
    } else if (onDesk) {
      R = restOn(AD, x, rot, scale, NEST_DESK);
      P1 = [R.x, R.y];
      deposit(AD, R, (xx) => deskCap(xx, tl));
    } else {
      R = restOn(AF, x, rot, scale);
      P1 = [R.x, R.y];
      deposit(AF, R, (xx) => frontCap(xx, tl));
    }
    // the drop: spawn above the frame top at the spawn frame (iterate: the spawn frame depends on the duration)
    let dur = 40;
    let S: Pt = [R.x, R.y - 800];
    const drift = 34 * gauss(`${sd}-drift`);
    for (let it = 0; it < 5; it++) {
      const top = frameTop(tl - dur);
      // a sheet that slides (off the hill's flank, or across the desk) drops above where it hits
      S = [(target === "pour" || target === "flank" ? P1[0] : R.x) + drift, top - SHEET_H * 0.8 - 40 - 0.1 * Math.max(0, R.y - top)];
      const dist = Math.hypot(P1[0] - S[0], P1[1] - S[1]) + Math.hypot(R.x - P1[0], R.y - P1[1]);
      dur = DUR_BASE + DUR_PER_PX * dist;
    }
    const fallY = P1[1] - S[1];
    const C: [Pt, Pt, Pt, Pt] =
      target === "slide" || target === "pour" || target === "flank"
        ? [S, [S[0], S[1] + 0.6 * fallY], P1, [R.x, R.y]]
        : [S, [S[0], S[1] + 0.55 * fallY], [R.x, R.y - 0.22 * fallY], [R.x, R.y]];
    // the wave: an original it passes (landed, or still falling) flips with probability P_FLIP
    const fl = WAVE_T0 + ((R.x - WAVE_X0) / (WAVE_X1 - WAVE_X0)) * (WAVE_T1 - WAVE_T0) + 1.2 * (2 * random(`${sd}-fj`) - 1);
    const flip = sprite >= 0 && tl - dur < fl - 1 && random(`${sd}-flip`) < P_FLIP ? fl : Infinity;
    sheets.push({
      j,
      tl,
      ts: tl - dur,
      dur,
      C,
      rotRest: rot,
      rot0: rot + 28 * gauss(`${sd}-rot0`),
      scale,
      sprite,
      sway: { a: 26 + 26 * random(`${sd}-sa`), n: 0.9 + 0.7 * random(`${sd}-sn`), p: 2 * Math.PI * random(`${sd}-sp`) },
      tumble: { a: 9 + 10 * random(`${sd}-ta`), n: 0.8 + 0.8 * random(`${sd}-tn`), p: 2 * Math.PI * random(`${sd}-tp`) },
      flutter: { a: 0.12 + 0.14 * random(`${sd}-fa`), n: 1 + 1.2 * random(`${sd}-fn`), p: 2 * Math.PI * random(`${sd}-fp`) },
      flip,
      target,
    });
  });
  snapUpTo(DURATION);
  return { sheets, snaps };
})();
export const SHEETS = SIM.sheets;
/** the front support line after all landings up to frame t */
export const frontSupport = (t: number) => SIM.snaps[Math.max(0, Math.min(DURATION, Math.floor(t)))];

// Her rise: as the heap reaches her, she is lifted with it (she only ever rises), her chin CHIN_ABOVE above the mean
// heap surface across her shoulders, so from "drowning" on she is up to her neck in paper and stays there. The
// target follows the simulated heap, made monotonic and smoothed (gaussian, sigma 7 frames: one soft, continuous move).
const CHIN_ABOVE = 60;
const LIFT: number[] = (() => {
  const n = DURATION + 30;
  const target: number[] = [];
  for (let t = 0; t <= n; t++) {
    const A = SIM.snaps[Math.min(DURATION, t)];
    let sum = 0;
    let k = 0;
    for (let i = colOf(HEAD_X - 120); i <= colOf(HEAD_X + 120); i++) {
      sum += A[i];
      k++;
    }
    target.push(Math.max(0, CHIN0 - (sum / k - CHIN_ABOVE)));
  }
  for (let t = 1; t <= n; t++) target[t] = Math.max(target[t], target[t - 1]);
  return target.map((_, t) => {
    let a = 0;
    let w = 0;
    for (let d = -16; d <= 16; d++) {
      const g = Math.exp(-(d * d) / 98);
      a += g * target[Math.max(0, Math.min(n, t + d))];
      w += g;
    }
    return a / w;
  });
})();
export const liftAt = (f: number) => {
  const t = Math.max(0, Math.min(LIFT.length - 1.001, f));
  const i = Math.floor(t);
  return lerp(LIFT[i], LIFT[i + 1], t - i);
};
const chinAt = (f: number) => CHIN0 - liftAt(f);
/** the sheets that land on the heap BEHIND her: near her head and resting higher than just under her chin (they
 * would cover her face). Fixed per sheet, so a sheet is behind her or in front of her for its whole fall. */
export const BEHIND: ReadonlySet<number> = new Set(
  SHEETS.filter((s) => s.target !== "desk" && Math.abs(s.C[3][0] - HEAD_X) < 150 && s.C[3][1] < chinAt(s.tl) + 60).map((s) => s.j),
);

/** the reader: her hard shadow and the graded cut-out, lifted by the heap; alive with a slow breath (a rigid
 * stretch of 0.6% from her bottom edge) and a tiny sway of her whole figure (+-0.6 deg about her bottom centre) */
const Reader: React.FC<{ frame: number; shadow: boolean }> = ({ frame, shadow }) => {
  const off = shadow ? SHADOW_OFF : 0;
  const breath = 1 + 0.006 * Math.sin((2 * Math.PI * frame) / 58);
  const sway = 0.6 * Math.sin((2 * Math.PI * frame) / 86 + 0.7);
  return (
    <div
      style={{
        position: "absolute",
        left: PERSON.x - PERSON.w / 2 + off,
        top: PERSON.bottom - liftAt(frame) - PERSON_H + off,
        width: PERSON.w,
        height: PERSON_H,
        transformOrigin: "50% 100%",
        transform: `rotate(${sway}deg) scale(1, ${breath})`,
      }}
    >
      <Img
        src={staticFile(DIR + (shadow ? "person_sh.png" : "person.png"))}
        style={{ position: "absolute", left: 0, top: 0, width: PERSON.w, height: PERSON_H, maxWidth: "none" }}
      />
    </div>
  );
};

const LEAN_MAX = 9; // deg: the most a sheet leans into its sideways drift
const LEAN_V = 6; // world px a frame sideways at which the lean is ~3/4 of LEAN_MAX

/** the sheet's centre (world) at frame f, before the sway */
const pathAt = (s: Sheet, f: number): Pt => {
  const tau = (f - s.ts) / s.dur;
  const e = ease(tau);
  const [x, y] = bez(s.C, e);
  const rest = 1 - e;
  const sw = s.sway.a * Math.sin(2 * Math.PI * s.sway.n * clamp01(tau) + s.sway.p) * Math.pow(rest, 1.5);
  return [x + sw, y];
};

export type SheetState = { x: number; y: number; rot: number; sx: number; sy: number; scale: number; src: string; sh: string; landed: boolean };
export const sheetAt = (s: Sheet, f: number): SheetState | null => {
  if (f < s.ts) return null;
  const tau = clamp01((f - s.ts) / s.dur);
  const e = ease(tau);
  const rest = Math.pow(1 - e, 1.5);
  const [x, y] = pathAt(s, f);
  const vx = pathAt(s, f + 0.5)[0] - pathAt(s, f - 0.5)[0];
  const lean = LEAN_MAX * Math.tanh(vx / LEAN_V);
  // the flip (the wave): about its vertical axis; the face swaps at the half; it straightens and comes up full size
  // (a falling sheet flips in the air and keeps tumbling round its new, upright rest)
  const g = f >= s.flip ? smoother((f - s.flip) / FLIP_DUR) : 0;
  const rotRest = lerp(s.rotRest, 0, g);
  const rot = rotRest + (s.rot0 - s.rotRest) * (1 - e) + s.tumble.a * Math.sin(2 * Math.PI * s.tumble.n * tau + s.tumble.p) * rest + lean * (1 - e);
  const sy = 1 - s.flutter.a * rest * (0.5 - 0.5 * Math.cos(2 * Math.PI * s.flutter.n * tau + s.flutter.p));
  const sx = g > 0 ? Math.max(0.03, Math.abs(Math.cos(Math.PI * g))) : 1;
  const scale = lerp(s.scale, 1, g);
  const name: string = s.sprite < 0 || g >= 0.5 ? SLOP : SPRITES[s.sprite];
  return { x, y, rot, sx, sy, scale, src: DIR + name + ".png", sh: DIR + name + "_sh.png", landed: tau >= 1 };
};

const SheetImg: React.FC<{ st: SheetState; shadow: boolean }> = ({ st, shadow }) => {
  const w = SHEET_W * st.scale;
  const h = SHEET_H * st.scale;
  const off = shadow ? SHADOW_OFF : 0;
  return (
    <div
      style={{
        position: "absolute",
        left: st.x - w / 2 + off,
        top: st.y - h / 2 + off,
        width: w,
        height: h,
        transform: `rotate(${st.rot}deg) scale(${st.sx}, ${st.sy})`,
      }}
    >
      <Img src={staticFile(shadow ? st.sh : st.src)} style={{ position: "absolute", left: 0, top: 0, width: w, height: h, maxWidth: "none" }} />
    </div>
  );
};

// THE HEAP'S DEPTH: behind every sheet (in front of the desk) the inside of the heap, a dark shadowed paper tone,
// up to the support of DEPTH_LAG frames ago (+ NEST - COVER): everything below that is covered by sheets, so it
// shows only through a chink or where a sheet is mid-flip (the depth of the pile, never the buried desk or the paper).
const DEPTH_LAG = 22;
const DEPTH_FILL = "#3b3936";
const depthPath = (f: number) => {
  const t = f - DEPTH_LAG;
  if (t < 0) return null;
  const A = frontSupport(t);
  const bottom = FLOOR + 4;
  const top: string[] = [];
  let any = false;
  for (let i = 0; i < NCOL; i++) {
    const y = Math.min(bottom, A[i] + NEST - COVER + 6);
    if (y < bottom - 1) any = true;
    top.push(`${colX(i)} ${y.toFixed(2)}`);
  }
  if (!any) return null;
  return `M${top.join(" L")} L${X_MAX} ${bottom} L${X_MIN} ${bottom} Z`;
};

// A sheet that flips on the heap turns over on a blank sheet back laid at its old pose (from the flip's start, and
// it stays): where the turning sheet narrows, and round the upright copy's edges after, the heap shows paper, never
// the dark depth fill. Sheets that flip in the air need none (the squared paper is behind them).
const BACK: SheetState = { x: 0, y: 0, rot: 0, sx: 1, sy: 1, scale: 1, src: DIR + "back.png", sh: DIR + "back_sh.png", landed: true };
const backAt = (s: Sheet, f: number): SheetState | null =>
  f >= s.flip && s.tl <= s.flip ? { ...BACK, x: s.C[3][0], y: s.C[3][1], rot: s.rotRest, scale: s.scale } : null;

/** is the sheet's bounding circle on screen? */
const onScreen = (st: SheetState, cam: NealCam) => {
  const r = 0.5 * Math.hypot(SHEET_W, SHEET_H) * st.scale + SHADOW_OFF + 2;
  const sxp = W / 2 + (st.x - cam.x) * cam.k;
  const syp = H / 2 + (st.y - cam.y) * cam.k;
  const rs = r * cam.k;
  return sxp > -rs && sxp < W + rs && syp > -rs && syp < H + rs;
};

const DrowningInApplications: React.FC<z.infer<typeof schema>> = ({ debug }) => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const depth = depthPath(frame);
  const live: { j: number; st: SheetState; back: SheetState | null; tg: Sheet["target"]; behind: boolean }[] = [];
  for (const s of SHEETS) {
    if (s.ts > frame) continue;
    const st = sheetAt(s, frame);
    if (st && onScreen(st, cam)) live.push({ j: s.j, st, back: backAt(s, frame), tg: s.target, behind: BEHIND.has(s.j) });
  }
  return (
    <AbsoluteFill>
      <NealFilmLife frame={frame}>
        <NealPaper frame={frame} cam={cam} />
        <NealPlane cam={cam}>
          <PhotoCutOut src={DIR + "desk.png"} x={DESK.cx} y={FLOOR} w={DESK.w} aspect={DESK.aspect} filter="none" />
          {depth ? (
            <NealSvg>
              <path d={depth} fill={DEPTH_FILL} />
            </NealSvg>
          ) : null}
          {/* the sheets behind her, then the reader, then the sheets in front of her */}
          {[true, false].map((behind) => (
            <React.Fragment key={behind ? "behind" : "front"}>
              {live
                .filter((l) => l.behind === behind)
                .map(({ j, st, back }) => (
                  <React.Fragment key={j}>
                    {back ? <SheetImg st={back} shadow /> : null}
                    {back ? <SheetImg st={back} shadow={false} /> : null}
                    <SheetImg st={st} shadow />
                    <SheetImg st={st} shadow={false} />
                  </React.Fragment>
                ))}
              {behind ? (
                <>
                  <Reader frame={frame} shadow />
                  <Reader frame={frame} shadow={false} />
                </>
              ) : null}
            </React.Fragment>
          ))}
          {debug ? (
            <NealSvg>
              {live.map(({ j, st, tg }) => (
                <circle key={j} cx={st.x} cy={st.y} r={st.landed ? 14 : 9} stroke={BEHIND.has(j) ? "black" : "none"} strokeWidth={5} fill={tg === "desk" ? "red" : tg === "front" ? "blue" : tg === "pour" ? "orange" : "lime"} />
              ))}
            </NealSvg>
          ) : null}
        </NealPlane>
      </NealFilmLife>
      {debug ? (
        <div style={{ position: "absolute", left: 20, top: 20, color: "red", fontSize: 28, fontFamily: "monospace" }}>
          f{frame} live {live.length} / {SHEETS.length}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export default DrowningInApplications;
