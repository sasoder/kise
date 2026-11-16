// ---------------------------------------------------------------------------
// TenEarths (rsi-ten-earths, cut 9 at 99.18 s; REV 1). Dwarkesh 3D style (styles/dwarkesh-3d.md).
// Opaque 1080x1920, 23.976 fps, 268 frames. The shared world: tenEarthsGlobe (EarthGlobe / OrangeEarth on one
// GlobeLayer canvas) and tenEarthsHall (YearPlate), both read-only.
//
// CHECK LINE: "By 2030 the AIs outnumber China; a year later, everyone on Earth; the year after, ten Earths' worth,
//   and it keeps going."
//
// THE LINE: "effective population of AIs might be larger than the number of people in China, just one year after
//   that, it'd be larger than the number of people on Earth, and the year after that, around 10 Earths, and so on. If"
// WORD -> FRAME: the -3 · effective 1 · population 8 · of 17 · AIs 27 · might 34 · be 38 · larger 41 · than 49 ·
//   the 58 · number 60 · of 67 · people 71 · in 76 · China, 79 · just 83 · one 96 · year 102 · after 109 · that, 114 ·
//   it'd 123 · be 131 · larger 134 · than 141 · the 150 · number 153 · of 157 · people 161 · on 165 · Earth, 172 ·
//   and 184 · the 189 · year 191 · after 194 · that, 200 · around 210 · 10 221 · Earths, 236 · and 250 · so 256 ·
//   on. 259 · If 259 (cut at 268)
// DURATION: the slot 99.1824 -> 110.3602 s (sequence frames 2378-2646) = 11.178 s x 23.976 = 268 frames (f0..f267).
//
// REV 1 (the user: "quite happy ... does a really good job at capturing the scale"; "it can be a bit more dramatic with
// the camera"): the CAMERA only. Content and timings are take 1's; what the new camera forced is listed under REV 1
// CHANGES below.
// THE MOTION: the camera starts CLOSE on China (k 2.35: China ~650 px wide, the globe filling the frame), the Earth
// turned to Asia and turning slowly (lon 104 -> 96), China lit cream, the plate 2030 sliding up over Mongolia above it
// (f0-f12). The camera drifts back (never stopping) while the orange tide of AIs wells up at China's centroid (f8),
// fills China exactly to its border at f70 (cover 0.12), the label China slides up beside it (f64-f76), and the tide
// spills just past the border on "China" (f79, cover ~0.15). On "just one year after that" the first log-space
// pull-back (f68-f116, peak f83) reveals the whole Earth (k ~1.0) while the plate hands over 2030 -> 2031 (2030 slides
// up and out f94-f104 on the globe, 2031 slides up and in f99-f111 in the air above it). From "it'd be larger" (f122)
// the tide runs over all the land (the visible face by f150), then the seas close from the coasts (sea 0 -> 1
// f146-f180): the whole globe orange by "Earth" (f166-f172; the China outline and label drain f146-f166), the camera
// drifting back slowly (k 1.0 -> 0.96). Then the big log-space pull-back (f180-f230, peak f197, x5.2: k 0.96 -> 0.185):
// the nine more orange Earths come out from behind the first as it starts, so the first becomes one of ten (never a
// lone small globe): the bottom row's stack drops out below it (f182-f212), then both rows fan open sideways like a
// dealt deck (f192-f228) into a 5-over-5 formation fixed in world (pitch 2.19 radii), all ten in place by "Earths"
// (f236), the plate riding the top of the group (72-84 px above its top edge, ~76-80 px type) and handing over 2031 ->
// 2032 the same way (out f184-f194, in f189-f201). The camera never lands: it drifts on to the cut (k 0.185 -> 0.169,
// the ten 140 -> 128 px, x 195-890, y 680-950, the plate above them), and from "10 Earths ... Earths" (f232) to "and
// so on" the wider frame fills with MORE: a deep crowd of ~650 further orange Earths in continuous depth round and
// above the ten (a Poisson-disc scatter, ~58 px across beside the ten down to ~8 px toward the top and back, hazier
// with depth, far ones partly behind near ones), fading up out of the haze in a ripple spreading outward from the ten
// (f232 -> ~f261), the farthest still appearing at the cut as the camera backs off (FAR).
// REV 1 CHANGES forced by the camera (reported): the 2030 plate rides a point on the globe (the globe's top is out of
// frame when close); the nine's slots are fixed in world (the camera no longer stops at a landed size); the "and so
// on" Earths are now a depth field of further Earths (director, passes 2-3), replacing take 1's four far Earths.
// Orange = THE AIs only (COMMON.md): the tide and the orange Earths (one Earth's worth of AIs each). The Earth, the
// labels and the air in the style's muted colours.
//
// DEPTH: londonDepth perspective with the eye's row held at screen y 1250 on every frame (eyeY = cam.cy + 290 / k: a
// true dolly-back keeps the horizon still, so the air's light band does not sweep up through the globes; the hero's
// centre is world 0,0, the formation's centre 0,PITCH_W/2), dRef 1800 / kRef 1 / dolly 0.5, fog by DEPTH (fogBy "depth": the pull-back does not fog the payoff). The ten sit on
// the front plane Z 0 (fogged as Z_FRONT 350, the probe's hero tone); the nine emerging come forward from Z_BEHIND 500;
// "and so on": the far field's Z solved per Earth from its size (Z ~5600 -> 66000), fogged as depths 2400 -> 8000.
//
// SOURCES (header only; on screen only China, 2030, 2031, 2032): China ~1.41 billion people (National Bureau of
//   Statistics of China, 2024); Earth ~8.2 billion (UN World Population Prospects 2024); 10 Earths ~82 billion. The
//   chain 2030 > China, 2031 > Earth, 2032 ~ 10 Earths is the speaker's own projection (~10x a year), drawn as said.
//   Land and China outline: Natural Earth 1:110m via world-atlas (tenEarthsGlobe).
// ---------------------------------------------------------------------------
import React, { useLayoutEffect, useRef } from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import { AirStage, WorldSvg, airWorldOf, c01, lerp, pchip, perspective, smoothstep, swayCam, type AirWorld, type Cam, type DepthOpts } from "../kits/dwarkesh-3d/dwarkesh3d";
import { CHINA_FACE, GlobeLayer, drawGlobe, globeFog, globeFromWorld, globePoint, type GlobeSpec } from "./tenEarthsGlobe";
import { YearPlate, yearPlateT } from "./tenEarthsHall";

export const FPS = 24000 / 1001;
export const DURATION = 268;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// ===================================================================================================================
// THE WORLD (world px of the front plane; the hero Earth's centre is 0,0)
// ===================================================================================================================
/** the hero's world radius (760 px wide at k 1) */
export const R = 380;
/** the formation: 5 over 5, the hero at the top middle (j 0, row 0), FIXED IN WORLD: a pitch of 2.188 radii (take 1's
 *  186 px pitch at 170 px globes, so 16 px gaps at 170 px, ~10 px at 110 px) */
export const PITCH_W = (186 / 85) * R;
/** the formation's centre sits at screen row FORM_SY once the camera is out (the zoom's fixed point at the end) */
export const FORM_SY = 820;
/** the front plane's fog depth (the probe's hero tone) and the air height the globes fog toward */
const Z_FRONT = 350;
const H_AIR = 600;

/** the horizon's screen row (the probe's): held still through the pull-backs */
const HORIZON_SY = 1250;
const depthOf = (cam: Cam): DepthOpts => ({ eyeY: cam.cy + (HORIZON_SY - 960) / cam.k, dRef: 1800, kRef: 1, dolly: 0.5 });

// ===================================================================================================================
// THE CAMERA (rev 1: "it can be a bit more dramatic with the camera"). Driven in LOG space: the zoom's rate
// d(ln k)/df is a slow constant pull-back (DRIFT, never zero) plus two eased lobes, so the camera never stops, each
// lobe eases in and out, and every x2 of the pull-back reads as the same step ("powers of ten"):
//   f0-f70   close on China (k 2.35 -> 1.96, China ~650 -> 540 px wide, x ~65-700), drifting back while the tide fills it;
//   LOBE 1   f68-f116 (peak f83) the pull-back to the whole Earth (k -> ~0.95) on "just one year after that" (2031);
//   f118-f180 the drift (k -> ~0.81) while the tide runs over the land and closes the seas;
//   LOBE 2   f180-f230 (peak f197) the big pull-back on "and the year after that, around 10 Earths" (k -> ~0.185,
//            x5.2 in 50 frames, peak -0.063 ln k per frame), the nine dealt out of the hero on the way and more Earths arriving at the edges;
//   f230-f267 the drift on: a living, widening end (k -> ~0.169; the ten ~128 px) while the far rings arrive.
// The pan rides the zoom: the hero's screen centre is a function of ln k (China framed left of centre with its label
// room on the right when close; the hero centred at x 540 from k 1.1; the formation's centre at FORM_SY when out).
// The track is integrated at quarter frames; no damped follow (the lobes are already smooth).
// ===================================================================================================================
export const K0 = 2.35;
/** the slow pull-back between the lobes (ln k per frame): slower while the whole Earth is covered (f118-f180) */
export const DRIFT = [0.0026, 0.0012] as const;
const driftAt = (f: number) => lerp(DRIFT[0], DRIFT[1], smoothstep(100, 124, f) * (1 - smoothstep(172, 192, f)));
type Lobe = { a: number; p: number; b: number; amp: number };
export const LOBES: Lobe[] = [
  { a: 68, p: 83, b: 116, amp: 0.0216 },
  { a: 180, p: 197, b: 230, amp: 0.0608 },
];
/** a smooth bump on [a, b] peaking at p: sin^2 of a phase that runs 0 -> 0.5 on [a, p] and 0.5 -> 1 on [p, b] */
const bump = (L: Lobe, f: number) => {
  if (f <= L.a || f >= L.b) return 0;
  const u = f < L.p ? (0.5 * (f - L.a)) / (L.p - L.a) : 0.5 + (0.5 * (f - L.p)) / (L.b - L.p);
  return L.amp * Math.sin(Math.PI * u) ** 2;
};
/** the zoom's rate (ln k per frame, negative = pulling back) */
export const lnkRate = (f: number) => -(driftAt(f) + LOBES.reduce((s, L) => s + bump(L, f), 0));
const STEP = 0.25;
const PRE = 0;
const LNK_TAB: number[] = (() => {
  const out = [Math.log(K0)];
  const n = Math.ceil((DURATION + 4 + PRE) / STEP);
  for (let i = 1; i <= n; i++) {
    const f = -PRE + (i - 0.5) * STEP;
    out.push(out[i - 1] + STEP * lnkRate(f));
  }
  return out;
})();
export const lnkAt = (f: number) => {
  const x = Math.max(0, Math.min(LNK_TAB.length - 1 - 1e-6, (f + PRE) / STEP));
  const i = Math.floor(x);
  return lerp(LNK_TAB[i], LNK_TAB[i + 1], x - i);
};
/** the hero's screen centre as a function of ln k: China framed close (x ~400), the hero centred from k ~1.1 */
const HX = pchip([
  [Math.log(0.05), 540],
  [Math.log(1.1), 540],
  [Math.log(1.45), 492],
  [Math.log(2.04), 416],
  [Math.log(3), 418],
]);
const HY_HERO = pchip([
  [Math.log(0.05), 806],
  [Math.log(0.95), 812],
  [Math.log(1.1), 822],
  [Math.log(1.6), 852],
  [Math.log(2.04), 868],
  [Math.log(3), 876],
]);
/** once out, the formation's centre holds at FORM_SY: the hero (its top middle) sits half a pitch above it */
const formW = (lnk: number) => smoothstep(Math.log(0.62), Math.log(0.2), lnk);
export const heroScreen = (f: number) => {
  const lnk = lnkAt(f);
  const k = Math.exp(lnk);
  const hy = lerp(HY_HERO(lnk), FORM_SY - 0.5 * PITCH_W * k, formW(lnk));
  return { k, x: HX(lnk), y: hy };
};
export const camAt = (frame: number): Cam => {
  const h = heroScreen(frame);
  return { k: h.k, cx: -(h.x - 540) / h.k, cy: -(h.y - 960) / h.k };
};
export const camOf = (frame: number): Cam => swayCam(camAt(frame), frame);
const REST = camOf(0);
export const airOf = (frame: number) => {
  const cam = camOf(frame);
  return airWorldOf({ cam, rest: REST, depth: depthOf(cam), frame, fogBy: "depth" });
};

/** world (front-plane px) -> screen */
const toScreen = (cam: Cam, x: number, y: number) => [540 + (x - cam.cx) * cam.k, 960 + (y - cam.cy) * cam.k] as const;
/** screen -> world (front plane) */
const toWorld = (cam: Cam, sx: number, sy: number) => [cam.cx + (sx - 540) / cam.k, cam.cy + (sy - 960) / cam.k] as const;

// ===================================================================================================================
// THE TIDE (the hero's cover / sea / china), the turn
// ===================================================================================================================
const COVER = pchip(
  [
    [0, 0],
    [8, 0],
    [14, 0.02],
    [27, 0.036],
    [70, 0.12],
    [84, 0.165],
    [122, 0.2],
    [150, 0.62],
    [158, 1],
  ],
  true,
);
export const coverAt = (f: number) => (f <= 8 ? 0 : f >= 158 ? 1 : c01(COVER(f)));
export const seaAt = (f: number) => interpolate(f, [146, 180], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.sin) });
export const chinaAt = (f: number) => 1 - smoothstep(148, 166, f);
/** the turn: the facing longitude drifts east -> west (the surface moves left to right), one rate for every Earth */
const TURN = 8 / (DURATION - 1);
export const heroLon = (f: number) => 104 - TURN * f;

// ===================================================================================================================
// THE NINE: they come out from behind the first WHILE the camera pulls back, so the first becomes one of ten and no
// frame shows a lone small globe. The bottom row's stack drops out below the first (f182-f212), then both rows fan
// open sideways like a dealt deck (f192-f228). Rev 1: their slots are FIXED IN WORLD (j x PITCH_W, row x PITCH_W from
// the first), a fraction g of the way out, so once dealt they ride the camera's continuing pull-back like the hero
// (the camera no longer stops at a landed size). Inner ones in front of outer ones, everything behind the first until
// it is out.
// ===================================================================================================================
const ease = Easing.bezier(0.33, 0, 0.2, 1);
export const DROP = [182, 212] as const;
export const SPREAD = [192, 228] as const;
const dropE = (f: number) => interpolate(f, [...DROP], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
const spreadE = (f: number) => interpolate(f, [...SPREAD], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
type Slot = { j: number; row: number; lon: number; lat: number };
export const NINE: Slot[] = [
  { j: -2, row: 0, lon: -62, lat: 20 },
  { j: -1, row: 0, lon: 42, lat: 18 },
  { j: 1, row: 0, lon: -20, lat: 24 },
  { j: 2, row: 0, lon: 168, lat: 16 },
  { j: -2, row: 1, lon: 12, lat: 22 },
  { j: -1, row: 1, lon: 140, lat: 15 },
  { j: 0, row: 1, lon: 72, lat: 18 },
  { j: 1, row: 1, lon: -150, lat: 20 },
  { j: 2, row: 1, lon: -108, lat: 14 },
];
/** how far behind the front plane a stacked Earth is (b 1 = fully stacked): fog depth and size */
const Z_BEHIND = 500;
const S_BEHIND = 0.88;
/** an Earth of the nine at frame f under zoom k: its screen offset from the first (px) and how stacked it still is */
export const nineAt = (s: Slot, f: number, k: number) => {
  const gd = s.row === 1 ? dropE(f) : 1;
  const gs = s.j !== 0 ? spreadE(f) : 1;
  const b = 1 - Math.min(gd, gs);
  return { dx: s.j * PITCH_W * k * gs, dy: s.row * PITCH_W * k * gd, b };
};

// ===================================================================================================================
// THE PLATES AND THE CHINA LABEL (world space)
// ===================================================================================================================
/** the China label: beside China, over the sea east of it (a point on the globe; it turns with it) */
export const CHINA_LABEL = { lon: 146, lat: 33, size: 56 };
/** THE YEAR PLATES. 2031 and 2032 ride the top of the group as in take 1 (the hero, then the formation's top row: no
 *  Earth is ever above them), PLATE_GAP px above its top edge, centred over the hero, ~76 -> 80 px type. Rev 1: 2030
 *  lives while the camera is close on China, where the globe's top is out of frame, so it rides a point ON the globe
 *  (world space) above China's north tip, over Mongolia/Siberia (0.6 radii above the hero's centre).
 *  Each new year slides up in (0.5 em) just after the old one slides up and out (0.4 em less 6 px). */
const EXIT_TRIM = 6;
const PLATE_GAP = [84, 72] as const; // out, close up (the big Earth leaves less air above it)
/** the camera's size once the ten are out (the plate's type and gap reach their "out" values there) */
export const K_OUT = 0.185;
/** 2030's point on the globe, in hero radii from its centre */
export const PLATE_2030 = { dx: 0, dy: -0.6 };
type Year = { text: string; in: number; out: number; onGlobe?: boolean };
export const YEARS: Year[] = [
  { text: "2030", in: 0, out: 94, onGlobe: true },
  { text: "2031", in: 99, out: 184 },
  { text: "2032", in: 189, out: 1e9 },
];
const IN_DUR = 12;
const OUT_DUR = 10;
export const plateAt = (frame: number, hero: { cx: number; cy: number; r: number }, k: number) => {
  const kk = c01((k - K_OUT) / (1 - K_OUT));
  const syTop = hero.cy - hero.r - lerp(PLATE_GAP[0], PLATE_GAP[1], kk);
  const size = lerp(80, 76, kk);
  return YEARS.map((y) => {
    const tIn = yearPlateT(frame, y.in, IN_DUR);
    const u = c01((frame - y.out) / OUT_DUR);
    const sx = y.onGlobe ? hero.cx + PLATE_2030.dx * hero.r : hero.cx;
    const sy = y.onGlobe ? hero.cy + PLATE_2030.dy * hero.r : syTop;
    // the old year rises at once (ease out) and is gone before the new one, coming up from below, is legible
    return { text: y.text, sx, sy, size, tIn, opacity: 1 - smoothstep(0, 0.7, u), lift: (0.4 * size - EXIT_TRIM) * Math.sin((u * Math.PI) / 2), on: tIn > 0 && u < 1 };
  });
};

// ===================================================================================================================
// AND SO ON: THE FAR EARTHS
// ===================================================================================================================
/** "and so on" (rev 1, pass 3: the director's "a natural depth field, not rings"): a deep crowd of further orange
 *  Earths receding into the haze round and above the ten. A Poisson-disc scatter in CONTINUOUS depth: each Earth has a
 *  depth u (0 near .. 1 far) set by where it sits on the end frame (deeper toward the top and away from the ten, with
 *  noise, one in three thrown deeper so far ones show between and behind near ones, one in seventeen nearer); its size on the end
 *  frame runs smoothly with u from ~60 px across (u 0) to ~8 px (u 1), its world depth Z solved from that size through
 *  the perspective, and the haze over it grows with u (fog depth 2400 -> 8000, opacity at full 1 -> 0.4). Accepted
 *  largest first by dart throwing: Earths of similar size keep a disc apart (2.2-2.7 x the sum of radii, so the spacing is
 *  irregular and scales with size: sparse and big beside the ten, small and dense toward the top and back); Earths of
 *  different depth may overlap, the far one partly behind the near one but never mostly hidden. All of it fills the air
 *  from the frame edges up toward the top (y >= 200) and stays above the caption band (y <= 1072) and >= 24 px clear of
 *  the ten and the 2032 plate. Laid out on the END camera's screen and carried back through the perspective, so they are
 *  fixed in world: the never-stopping pull-back draws them in with parallax (the near ones faster). Arrival: each fades
 *  up out of the haze over FAR_FADE frames in a ripple spreading outward from the ten, from f232 ("10 Earths ...
 *  Earths"); the farthest start at ~f258-262 and are still appearing on the last frame. Painted as cached OrangeEarth
 *  sprites (FarLayer). */
export const FAR_T0 = 232;
export const FAR_FADE = 14;
/** the ripple: start f232 at the ten's edge, + FAR_SPAN frames at the farthest, a little later for the deeper ones */
const FAR_SPAN = 27;
/** the size range on the end frame (radius px) and the field's bounds there */
const FAR_R = [30, 4] as const;
const FAR_BOX = { x0: -40, x1: 1120, yTop: 200, yMax: 1072 };
/** how far clear of the ten and the plate (px, disc to halo) */
const FAR_CLEAR = 24;
/** the Poisson spacing between Earths of similar depth (x the sum of their radii) */
const FAR_SPACE = [2.2, 2.7] as const;
const farSpace = (u: number) => lerp(FAR_SPACE[0], FAR_SPACE[1], u);
/** the haze by depth u: the fog depth of the sprite and the opacity at full */
export const farFogZ = (u: number) => lerp(2400, 8000, u);
export const farVeil = (u: number) => lerp(1, 0.4, u ** 0.9);
/** the faces the far Earths show (lon, lat) */
const FAR_FACES: [number, number][] = [
  [20, 18],
  [-90, 16],
  [120, 22],
  [-170, 14],
];
/** depth buckets for the sprites (one sprite per bucket per face per frame) */
export const FAR_BUCKETS = 10;
/** a small deterministic PRNG (mulberry32) for the scatter */
const prng = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
export type FarEarth = { u: number; b: number; Z: number; X: number; Y: number; face: number; t0: number };
/** the ten's discs on a frame (screen): the hero and the nine */
export const tenDiscs = (frame: number, cam: Cam) => {
  const hero = globeFromWorld(cam, 0, 0, R);
  return [{ x: hero.cx, y: hero.cy, r: hero.r }, ...NINE.map((sl) => {
    const q = nineAt(sl, frame, cam.k);
    return { x: hero.cx + q.dx, y: hero.cy + q.dy, r: R * cam.k * lerp(1, S_BEHIND, q.b) };
  })];
};
/** the 2032 plate's box on a frame (screen, unpadded) */
export const plateBox = (frame: number, cam: Cam) => {
  const hero = globeFromWorld(cam, 0, 0, R);
  const pl = plateAt(frame, { cx: hero.cx, cy: hero.cy, r: hero.r }, cam.k).find((q) => q.text === "2032")!;
  const y = pl.sy - pl.lift;
  return { x0: pl.sx - 1.24 * pl.size, x1: pl.sx + 1.24 * pl.size, y0: y - 0.42 * pl.size, y1: y + 0.36 * pl.size };
};
const boxGap = (q: { x0: number; x1: number; y0: number; y1: number }, x: number, y: number) =>
  Math.hypot(Math.max(q.x0 - x, 0, x - q.x1), Math.max(q.y0 - y, 0, y - q.y1));
export const FAR: FarEarth[] = (() => {
  const fEnd = DURATION - 1;
  const c = camOf(fEnd);
  const D = depthOf(c);
  const P = perspective(c, D);
  const k = c.k;
  const ten = tenDiscs(fEnd, c);
  const plate = plateBox(fEnd, c);
  // the ten's bounding box: the ripple's origin and the depth's "away from the ten"
  const tb = { x0: Math.min(...ten.map((d) => d.x - d.r)), x1: Math.max(...ten.map((d) => d.x + d.r)), y0: Math.min(...ten.map((d) => d.y - d.r)), y1: Math.max(...ten.map((d) => d.y + d.r)) };
  const rnd = prng(9917);
  const rOf = (u: number) => FAR_R[0] * (FAR_R[1] / FAR_R[0]) ** u;
  const early = [FAR_T0, FAR_T0 + 4, FAR_T0 + 9, FAR_T0 + 15, FAR_T0 + 22, FAR_T0 + 29].map((f) => {
    const cf = camOf(f);
    const Pf = perspective(cf, depthOf(cf));
    return { cf, Pf, ten: tenDiscs(f, cf), plate: plateBox(f, cf) };
  });
  const clearEarlier = (x: number, y: number, r: number) => {
    const rp = r / (R * k);
    const [wx, wy] = toWorld(c, x, y);
    const X = c.cx + (wx - c.cx) / rp;
    const Y = D.eyeY + (wy - D.eyeY) / rp;
    const Z = P.Dc * (1 / rp - 1);
    return early.every((q) => {
      const pp = q.Pf.p(X, Y, Z);
      const [sx, sy] = toScreen(q.cf, pp[0], pp[1]);
      const rr = R * q.Pf.r(Z) * q.cf.k;
      return q.ten.every((d) => Math.hypot(sx - d.x, sy - d.y) >= d.r + FAR_CLEAR + 1.1 * rr) && boxGap(q.plate, sx, sy) >= FAR_CLEAR + 1.1 * rr && sy + rr <= FAR_BOX.yMax;
    });
  };
  type Cand = { x: number; y: number; u: number; r: number };
  const cands: Cand[] = [];
  for (let i = 0; i < 40000; i++) {
    const x = lerp(FAR_BOX.x0, FAR_BOX.x1, rnd());
    const y = lerp(FAR_BOX.yTop, FAR_BOX.yMax, rnd());
    const away = c01(boxGap(tb, x, y) / 560);
    const up = c01((tb.y1 - y) / (tb.y1 - FAR_BOX.yTop));
    // below the ten the strip to the band only holds farther, smaller ones (no row of big ones along the band)
    const down = c01((y - tb.y1 + 30) / (FAR_BOX.yMax - tb.y1));
    let u = c01(0.08 + 0.5 * away + 0.42 * up * up + 0.5 * down + 0.22 * (rnd() - 0.5));
    // the top thins out into the haze instead of ending on a line
    if (rnd() > smoothstep(FAR_BOX.yTop - 20, FAR_BOX.yTop + 170, y)) continue;
    // and the bottom thins out toward the band
    if (rnd() > smoothstep(FAR_BOX.yMax + 10, FAR_BOX.yMax - 110, y)) continue;
    const throwDepth = rnd();
    if (throwDepth < 0.33) u = u + (1 - u) * (0.35 + 0.65 * rnd());
    else if (throwDepth > 0.94) u = u * (0.45 + 0.3 * rnd());
    const r = rOf(u);
    if (x + r < FAR_BOX.x0 + 20 || x - r > FAR_BOX.x1 - 20) continue;
    if (y - r < FAR_BOX.yTop || y + 1.1 * r > FAR_BOX.yMax) continue;
    if (ten.some((d) => Math.hypot(x - d.x, y - d.y) < d.r + FAR_CLEAR + 1.18 * r)) continue;
    if (boxGap(plate, x, y) < FAR_CLEAR + 1.18 * r) continue;
    // and clear on every frame it can show (the ten are larger and the far Earths farther out earlier in the drift)
    if (!clearEarlier(x, y, r)) continue;
    cands.push({ x, y, u, r });
  }
  cands.sort((a, b) => a.u - b.u);
  const kept: Cand[] = [];
  for (const q of cands) {
    const ok = kept.every((o) => {
      const d = Math.hypot(q.x - o.x, q.y - o.y);
      if (q.r > 0.55 * o.r) return d >= farSpace(q.u) * (q.r + o.r) * (Math.abs(q.u - o.u) < 0.14 ? 1 : 0.8) + 3;
      return d >= o.r + 0.45 * q.r + 2;
    });
    if (ok) kept.push(q);
  }
  const maxGap = Math.max(...kept.map((q) => boxGap(tb, q.x, q.y)));
  const field = kept.map((q, i) => {
    const rp = q.r / (R * k);
    const Z = P.Dc * (1 / rp - 1);
    const [wx, wy] = toWorld(c, q.x, q.y);
    const X = c.cx + (wx - c.cx) / rp;
    const Y = D.eyeY + (wy - D.eyeY) / rp;
    const jit = (((i * 7919) % 13) / 12 - 0.5) * 4;
    const t0 = Math.min(FAR_T0 + FAR_SPAN + 6, FAR_T0 + FAR_SPAN * c01(boxGap(tb, q.x, q.y) / maxGap) ** 0.85 + 4 * q.u + jit);
    return { u: q.u, b: Math.min(FAR_BUCKETS - 1, Math.floor(q.u * FAR_BUCKETS)), Z, X, Y, face: i % FAR_FACES.length, t0 };
  });
  // the first ones start on f232 exactly
  const first = Math.min(...field.map((e) => e.t0));
  return field.map((e) => ({ ...e, t0: e.t0 - first + FAR_T0 }));
})();
/** the far Earths at a frame: screen centre, radius, opacity (out of the haze x the veil) */
export const farAt = (frame: number, cam: Cam, A: AirWorld) =>
  FAR.map((e) => {
    const a = smoothstep(e.t0, e.t0 + FAR_FADE, frame);
    const p = A.P.p(e.X, e.Y, e.Z);
    const [x, y] = toScreen(cam, p[0], p[1]);
    return { ...e, x, y, r: R * A.P.r(e.Z) * cam.k, a: a * farVeil(e.u) };
  }).filter((q) => q.a > 0.002);

// ===================================================================================================================
// THE FRAME
// ===================================================================================================================
export type Scene = {
  cam: Cam;
  A: AirWorld;
  globes: GlobeSpec[];
  hero: GlobeSpec;
  china: { x: number; y: number; front: number; t: number; o: number };
  far: ReturnType<typeof farAt>;
};
export const sceneAt = (frame: number): Scene => {
  const cam = camOf(frame);
  const A = airOf(frame);
  const lonT = TURN * frame;
  const front = globeFog(A, Z_FRONT, H_AIR);
  const hero: GlobeSpec = { ...globeFromWorld(cam, 0, 0, R), lon: heroLon(frame), lat: CHINA_FACE.lat, china: chinaAt(frame), cover: coverAt(frame), sea: seaAt(frame), ...front };
  // the nine: stacked behind the hero, dropping and spreading out to their slots as the camera pulls back
  const nine = NINE.map((sl, i) => {
    if (frame < DROP[0]) return null;
    const q = nineAt(sl, frame, cam.k);
    const g = { cx: hero.cx + q.dx, cy: hero.cy + q.dy, r: R * cam.k * lerp(1, S_BEHIND, q.b) };
    return { b: q.b, row: sl.row, aj: Math.abs(sl.j), i, spec: { ...g, lon: sl.lon - lonT, lat: sl.lat, cover: 1, sea: 1, ...globeFog(A, Z_FRONT + Z_BEHIND * q.b, H_AIR) } as GlobeSpec };
  }).filter((q): q is { b: number; row: number; aj: number; i: number; spec: GlobeSpec } => q !== null);
  // painter's order: the most stacked first; at a tie the bottom row, then the outer ones, go behind (fixed through the move)
  nine.sort((a, b) => b.b - a.b || b.row - a.row || b.aj - a.aj || a.i - b.i);
  const globes = [...nine.map((q) => q.spec), hero];
  const far = frame >= FAR_T0 ? farAt(frame, cam, A) : [];
  // the China label rides its point on the turning globe
  const cp = globePoint(hero, CHINA_LABEL.lon, CHINA_LABEL.lat);
  const china = { ...cp, t: yearPlateT(frame, 64, 12), o: (1 - smoothstep(146, 158, frame)) * c01((cp.front - 0.15) / 0.25) };
  return { cam, A, globes, hero, china, far };
};

// screen -> world for the label (the plate component draws in world px on the front plane)
const ChinaLabel: React.FC<{ s: Scene }> = ({ s }) => {
  const { china, cam, A } = s;
  if (china.t <= 0 || china.o <= 0.001) return null;
  const [X, Y] = toWorld(cam, china.x, china.y);
  return (
    <g opacity={china.o}>
      <YearPlate A={A} X={X} Y={Y} Z={0} text="China" t={china.t} uid="lblChina" size={CHINA_LABEL.size} weight={700} />
    </g>
  );
};


/** the far Earths on their own full-frame canvas, behind the ten: per frame one OrangeEarth sprite per depth bucket
 *  and face (drawGlobe on a small offscreen canvas at the bucket's largest radius and its fog), blitted scaled to each
 *  Earth's radius at its centre with its opacity. Deepest first. Set FAR_LOG_MS to print the draw time per frame. */
const FAR_LOG_MS = false;
const FarLayer: React.FC<{ s: Scene; frame: number }> = ({ s, frame }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const c = ref.current;
    if (!c) return;
    const t0 = performance.now();
    const ctx = c.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, c.width, c.height);
    if (s.far.length === 0) return;
    const lonT = TURN * frame;
    // one sprite per depth bucket and face, drawn at the bucket's largest radius this frame and scaled down per Earth
    const rMax = new Map<string, number>();
    for (const e of s.far) {
      const key = `${e.b}:${e.face}`;
      rMax.set(key, Math.max(rMax.get(key) ?? 0, e.r));
    }
    const sprites = new Map<string, { cv: HTMLCanvasElement; S: number; r: number }>();
    const spriteOf = (b: number, face: number) => {
      const key = `${b}:${face}`;
      const hit = sprites.get(key);
      if (hit) return hit;
      const r = rMax.get(key)!;
      const S = Math.ceil(2.5 * r) + 4;
      const cv = document.createElement("canvas");
      cv.width = S;
      cv.height = S;
      const g = cv.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D;
      const [lon, lat] = FAR_FACES[face];
      drawGlobe(g, { cx: S / 2, cy: S / 2, r, lon: lon - lonT, lat, cover: 1, sea: 1, ...globeFog(s.A, farFogZ((b + 0.5) / FAR_BUCKETS), H_AIR) });
      const v = { cv, S, r };
      sprites.set(key, v);
      return v;
    };
    const order = [...s.far].sort((a, b) => b.Z - a.Z || a.x - b.x);
    for (const e of order) {
      if (e.x + 1.3 * e.r < 0 || e.x - 1.3 * e.r > c.width || e.y + 1.3 * e.r < 0 || e.y - 1.3 * e.r > c.height) continue;
      const sp = spriteOf(e.b, e.face);
      const sc = e.r / sp.r;
      const W = sp.S * sc;
      ctx.globalAlpha = e.a;
      ctx.drawImage(sp.cv, e.x - W / 2, e.y - W / 2, W, W);
    }
    ctx.globalAlpha = 1;
    if (FAR_LOG_MS) {
      ctx.getImageData(0, 0, 1, 1);
      console.log(`[far-ms] f${frame} n${s.far.length} ${(performance.now() - t0).toFixed(1)}`);
    }
  });
  return <canvas ref={ref} width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920 }} />;
};

const TenEarths: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const s = sceneAt(frame);
  const { cam, A } = s;
  const plates = plateAt(frame, s.hero, cam.k);
  return (
    <AirStage v={A.v} bloom={0.22}>
      <FarLayer s={s} frame={frame} />
      <GlobeLayer globes={s.globes} />
      <WorldSvg cam={cam}>
        <ChinaLabel s={s} />
        {plates.map((p) => {
          if (!p.on) return null;
          const [X, Y] = toWorld(cam, p.sx, p.sy);
          return (
            <g key={p.text} opacity={p.opacity} transform={`translate(0 ${(-p.lift / cam.k).toFixed(3)})`}>
              <YearPlate A={A} X={X} Y={Y} Z={0} text={p.text} t={p.tIn} uid={`y${p.text}`} size={p.size / cam.k} />
            </g>
          );
        })}
      </WorldSvg>
    </AirStage>
  );
};

export default TenEarths;
