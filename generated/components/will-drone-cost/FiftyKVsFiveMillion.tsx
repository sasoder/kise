import React, { useId } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { camJerk } from "../kits/dwarkesh/outgrowShared";
import {
  InFog,
  OCEAN,
  OceanStage,
  RimLit,
  UlyssesVehicle,
  bloomFilter,
  clamp01,
  fogAt,
  hash01,
  lerp,
  makeClockCam,
  smoothstep,
  useOcean,
  type Cam,
  type Glide,
  type Scene,
} from "../kits/cheeky-pint/oceanShared";
import {
  FONT_LABEL,
  LightSweep,
  METRIC,
  Numeral,
  SPACE,
  TRACK,
  TYPE,
  labelWidth,
  numeralWidth,
} from "../kits/cheeky-pint/stoutShared";

// ===========================================================================
// FiftyKVsFiveMillion — cut 3 of the Cheeky Pint S4E02 clip "will - $50k drone vs $5m navy drone" (Will
// O'Brien, Ulysses). V3, RESTYLED into the clip set's realistic underwater look (oceanShared.tsx: warm graded
// water, depth fog, god rays, marine snow, a sandy seabed, the stout grain and brown vignette).
// 1080x1920, 23.976 fps, opaque.
//
// CHECK LINE: "Ulysses' underwater drone costs about $50K; the Navy's usual one costs roughly a hundred times
// as much — one bar of money against a stack of a hundred."
//
// THE MOTION (the approved V2 structure and timing, in the new world): close on a weathered plinth on the
// seabed, the real Mako (oceanShared UlyssesVehicle: graphite hull, amber shield) cruises in from the right
// and settles on its cradle; ONE gold bar rises on a steel post out of the slot behind it and stands clear
// above it, and "$50K" lands. The camera eases back as the grey U.S. Navy Mk 18 Mod 2 Kingfish (drawn from
// the Navy's photos) cruises in and settles on its own plinth; then a stack of exactly 100 of the same gold
// bars, 5 wide x 20 high, climbs out of the slot behind it, the camera tilting up a little with its top, until
// "~$5M" lands on it with the cut's one light sweep running up the gold. Amber = money (the gold and its glow).
//
// SEQUENCE 34.034-44.711 s: slot 256 f (the sequence ends there) + a 16-frame living tail = 272.
// ONSETS (f): if 1 · working 7 · navy 20 · we can sell them 25-34 · for 38 · as cheap as 47-63 · $50,000 66-77 ·
// for contrast 82-87 · the most common 102-116 · like 126 · autonomous underwater vehicle 132-152 · that the
// U.S. Navy 166-192 · is buying today 195-203 · is like somewhere on the order of maybe 207-229 · $5 231 ·
// million 239.
//
//   f 0-40     the Mako cruises in (constant speed, a touch above its cradle), brakes and settles (k ~2.2)
//   f 47-67    its gold bar rises on its post out of the slot behind it, 36 px clear above it; "$50K" f 64-76
//   f 82-150   the camera eases back to k 1 and over to the pair; the Kingfish enters off the right edge ~f 118
//              and settles on its plinth by f 149
//   f 152-231  the 5 x 20 stack climbs out of the slot behind the Kingfish (~a row every 3.5 f, steady, easing
//              into the top); the camera tilts up a little with it and settles on the whole composition
//   f 221-236  THE ONE LIGHT SWEEP runs up the gold as it tops out, reaching the top on the click
//   f 231-243  "~$5M" lands on the finished stack (HERO)
//   f 243-271  the living hold: a slow push, snow, rays, grain
//
// DATA: Ulysses' own price (Will: "as cheap as $50,000"); the Navy's AUV "on the order of maybe $5 million" (his
// estimate, hence the tilde). The stack is exactly 100 of the $50K bar (100 x $50K = $5M).
// ===========================================================================

export const FPS = 24000 / 1001;
export const SLOT_FRAMES = 256;
export const TAIL = 16;
export const DURATION = SLOT_FRAMES + TAIL; // 272

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

const f2 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const f6 = (v: number) => (Math.round(v * 1e6) / 1e6).toString();
const uidOf = (raw: string) => `fk${raw.replace(/[^A-Za-z0-9_-]/g, "_")}`;
type P2 = { x: number; y: number };
const poly = (pts: P2[]) =>
  `M${pts.map((p) => `${f2(p.x)} ${f2(p.y)}`).join("L")}Z`;

// The Ulysses mark (ulysses.com, refs/ulysses_mark.svg, viewBox 84 x 100): [0] a small detail, [1] the shield
// with the shark cut out of it (evenodd).
const ULYSSES_D = [
  "M56.9422 18.4839C56.9412 19.6783 53.3071 21.0897 53.2826 21.0991L53.4177 19.4907C54.1338 19.178 56.9422 18.4839 56.9422 18.4839Z",
  "M83.9487 5.86929C83.9207 8.82265 83.8796 13.6016 83.8574 16.4878C83.8352 19.374 83.7991 23.3465 83.7774 25.3153C83.7556 27.2846 83.7164 33.0326 83.6911 38.0888C83.6291 50.4586 83.5932 51.1724 82.8281 55.0096C81.6306 61.0145 78.4405 68.6692 74.7748 74.3343C74.413 74.8935 74.0458 75.4684 73.9593 75.6125C71.6584 79.4436 66.3866 85.2993 61.8862 89.0201C57.3554 92.7659 51.7838 95.9088 46.3937 97.7613C45.7247 97.9912 45.0857 98.2124 44.9742 98.2528C43.5773 98.7588 42.0175 99.2021 42 99.2071C42 99.2071 40.4295 98.7618 39.0246 98.2528C38.9119 98.212 38.2743 97.9909 37.6063 97.7613C32.2162 95.9089 26.6446 92.7659 22.1138 89.0201C17.6133 85.2993 12.3403 79.4436 10.0394 75.6125C9.95248 75.4677 9.5855 74.893 9.22397 74.3343C5.55831 68.6692 2.36938 61.0144 1.17191 55.0096C0.406822 51.1724 0.369627 50.4586 0.307674 38.0888C0.282375 33.0326 0.24444 27.2846 0.222626 25.3153C0.200894 23.3465 0.1648 19.374 0.142581 16.4878C0.120362 13.6016 0.0793367 8.82265 0.051279 5.86929L0 0.5H84L83.9487 5.86929ZM72.0733 16.1151C72.0018 14.8807 71.0539 14.6547 67.7546 15.0883C66.7738 15.217 65.6583 15.343 65.2757 15.3672C57.9367 15.8286 43.8154 19.4362 40.2102 21.7708C39.9784 21.9208 39.4906 22.1473 39.1259 22.2736C38.7611 22.3998 37.8527 22.8376 37.1072 23.2466C34.813 24.5051 34.3022 24.4939 33.4977 23.1728C33.3323 22.9014 33.1518 22.6522 33.0975 22.6188C33.0422 22.5843 32.7835 22.3322 32.5221 22.0572C32.2602 21.7816 32.1736 21.7579 31.9456 21.5719C31.6551 21.335 31.6095 21.2482 31.1901 20.9791C29.8552 20.1223 28.4024 20.0342 27.8895 20.6051C27.7205 20.7937 27.7703 21.3327 28.1959 23.8945C28.671 26.7544 28.7322 27.2836 28.7725 28.9148C28.7888 29.578 28.3737 30.2834 27.9095 31.056C27.6448 31.4967 27.53 31.5944 27.1328 32.1191C25.91 33.7352 25.8346 33.8583 24.5339 36.3665C21.284 42.6323 20.9049 42.4431 23.8085 40.8791C25.4836 39.9768 30.5526 37.1894 32.666 36.1652C33.7395 35.6449 34.4464 35.3691 35.6639 35.2659C36.1748 35.2226 36.2631 35.266 36.9772 35.2684C37.2757 35.2166 34.29 36.6558 33.3526 37.1695C32.5678 37.5994 31.2736 38.2483 30.4772 38.6116C29.6807 38.9748 27.9604 39.9267 26.3624 40.7965C23.176 42.5309 20.4108 44.0837 18.2966 45.4066C17.7927 45.722 16.4154 46.5035 15.2374 47.1439C11.7942 49.016 10.8789 49.7724 11.6353 50.1193C12.0721 50.3194 16.1269 49.2701 17.3573 48.6385C17.602 48.5129 18.0361 48.3385 18.3216 48.2508C18.6074 48.1631 19.2543 47.9304 19.7599 47.7342C20.9277 47.2811 20.9398 47.2954 20.6804 48.7373C20.5612 49.3998 20.5169 50.0022 20.5816 50.0755C20.6463 50.1488 20.6697 50.6213 20.6329 51.1261C20.5216 52.6494 20.6846 54.8431 21.0006 56.0689C21.5305 58.1226 21.1035 56.8272 21.3471 57.4209C22.3413 59.8448 21.3471 61.4048 21.3471 64.7676C21.3471 65.989 21.766 65.318 22.988 64.7676C24.2761 64.1875 24.6547 65.5417 25.2768 65.9895C26.4555 66.8377 27.6206 68.832 28.331 71.2187C28.7555 72.6445 29.1621 72.6353 30.0182 71.18L30.4822 70.3908L31.3527 70.7685C31.8315 70.9761 32.458 71.276 32.7435 71.4351C33.0293 71.5943 33.9126 71.9689 34.7071 72.2681C36.393 72.9027 37.2475 73.5406 38.3642 75.0009C38.8091 75.5827 39.2714 76.1163 39.391 76.1866C39.5104 76.2565 39.6178 76.3698 39.6299 76.4379C39.6514 76.5616 41.2923 78.2849 42.3865 79.3321C42.7035 79.6354 43.1312 79.9406 43.337 80.0112C43.5422 80.0816 43.7195 80.1955 43.7322 80.2639C43.8004 80.6559 46.7938 83.139 47.1291 83.0817C47.5486 83.0084 47.4144 81.9027 46.8227 80.559C45.6513 77.8983 44.6211 74.5792 44.8916 74.3393C44.9657 74.2725 44.9919 74.0229 44.9504 73.7839C44.8975 73.4792 44.9623 73.3025 45.1668 73.1961C45.3426 73.1045 45.5602 72.6599 45.7133 72.0767C45.8914 71.3983 46.0528 71.0933 46.2512 71.0587C46.4068 71.0314 46.8425 70.5634 47.2192 70.0193C47.6044 69.463 47.9991 69.0487 48.121 69.0725C48.35 69.1173 49.1909 68.322 49.5818 67.6905C49.7097 67.484 49.9061 67.2986 50.0183 67.279C50.1304 67.2594 50.2113 67.182 50.1984 67.1077C50.1895 67.052 50.2727 66.9631 50.3985 66.885L50.6762 66.7375C50.8022 66.6571 50.8853 66.5636 50.875 66.5023C50.861 66.4206 50.9734 66.3312 51.1252 66.3047C51.2771 66.2778 51.6304 65.9872 51.9106 65.6581C52.1911 65.3286 52.5952 64.9278 52.8086 64.7676C53.3135 64.3887 54.2104 62.9964 54.0918 62.7752C53.958 62.5288 52.2397 62.8243 51.0176 63.3043C47.4347 64.7114 46.4597 65.1167 44.9729 65.8132C44.0589 66.2414 42.9195 66.7698 42.4415 66.9876C41.964 67.205 41.4775 67.438 41.3596 67.5054C41.2427 67.5725 41.0999 67.6263 41.042 67.6255C40.9201 67.6228 39.2817 68.4288 38.6894 68.7874C38.3538 68.9906 38.1311 69.1432 38.2204 69.3727C38.3602 69.7312 39.3182 70.7574 39.2597 70.7685C39.1067 70.7936 37.7754 69.7427 37.7614 69.7317C37.7515 69.7223 36.7873 68.8085 36.5632 68.5322C36.2046 68.0902 35.9401 67.4455 36.173 67.0752C36.5974 66.4004 36.4786 65.8971 35.9128 65.972C35.3235 66.05 34.5895 66.1293 34.2344 66.1546C33.9363 66.1743 32.8133 65.0513 32.0881 64.0072C31.1882 62.7114 31.0849 60.5914 31.9256 60.6778C33.0456 60.793 34.4714 61.1626 35.7677 61.6721C36.8428 62.0949 37.1362 61.4337 36.2755 60.5277C35.9882 60.2252 35.5034 59.712 35.1974 59.3883C34.8913 59.0645 34.1849 58.3874 33.6278 57.8837L32.6147 56.9682L33.554 55.7475C34.0709 55.0766 34.7285 54.3479 35.0148 54.1278C35.3012 53.9076 35.842 53.3845 36.2167 52.9659C36.5914 52.5473 37.0288 52.1276 37.1885 52.0329C37.3482 51.938 37.7584 51.5579 38.1003 51.1887C38.4424 50.8193 38.8109 50.502 38.9183 50.4833C39.0273 50.4632 39.6885 50.0319 40.3891 49.524C41.0906 49.0153 41.7256 48.5877 41.7999 48.5747C41.9235 48.5527 42.4715 48.2012 44.1725 47.0526C44.8995 46.5617 45.1826 46.505 45.597 46.7662C45.8636 46.9343 46.0108 46.9246 46.4588 46.7086C46.9689 46.4628 47.4042 46.4213 49.1028 46.4585C50.639 46.4921 54.5895 48.5719 56.4757 50.3394C56.8547 50.6946 57.2731 51.0677 57.405 51.1687C57.5354 51.2687 58.1408 51.8903 58.1579 51.9078C58.1579 51.9078 59.0143 52.7285 59.8989 53.4362C61.0706 54.3736 61.7737 53.9052 61.7737 53.9052C61.7904 53.8872 62.3499 53.2839 62.3828 53.1335C62.535 52.4124 62.2276 50.1402 61.8212 48.9849C61.7215 48.7018 61.6178 48.3684 61.5898 48.2445C61.5147 47.9135 60.3923 45.6436 60.0627 45.1553C59.907 44.9248 59.6063 44.4501 59.3936 44.1009C58.6254 42.8397 58.1789 42.216 57.5625 41.5445C57.2174 41.1683 56.619 40.5181 56.233 40.0986C55.8468 39.6792 55.4736 39.2397 55.4038 39.1231C55.3092 38.9626 55.835 38.5048 57.5425 37.2608C60.998 34.7432 62.3418 33.6377 63.8086 32.1079C65.8888 29.9383 66.7449 28.3723 66.3738 27.4127C66.1613 26.8629 66.6068 26.0073 67.5282 25.1977C70.4502 22.6301 72.2425 19.0478 72.0733 16.1151Z",
] as const;

// ===========================================================================
// THE WORLD (world px = screen px at the end framing, k 1; 1 m = 172.5 px, so the 2 m Mako is 345 px). The
// plinths' top surface is y = 0 (up is negative); the seabed is y = PLINTH_H. Everything stands on z = 0.
// ===========================================================================
/** The plinth: a weathered block on the seabed carrying the vehicle's cradle and the slot its money rises
 *  from. TOP = the visible depth of its top face; the front face carries the label. */
const PLINTH_H = 56;
const TOP = 5;
/** The sea: a sandy bed ~16 m down, clear enough that the heroes stay crisp (light fog at the focus plane). */
export const SCENE_GOLD: Scene = {
  label: "gold on the seabed",
  pxPerM: 172.5,
  focusM: 7.5,
  fogNearM: 3,
  fogVisM: 24,
  fogMax: 0.95,
  surfaceY: -16 * 172.5,
  seabedY: PLINTH_H,
  angleGainM: 24,
  seabedTileM: 5,
  surfaceTileM: 12,
  caustics: 0.5,
  seabedLight: 0.9,
  seabedFogBoost: 1,
};
const HOR = 900; // the vanishing point (screen y): the eye a little above the plinths, looking level
/** One $50K gold bar (an ingot seen from the side: a slightly trapezoid face). */
export const BAR = { w: 60, top: 50, h: 28 } as const;
/** The Navy's stack: exactly 100 bars, COLS x ROWS, on an even pitch. */
export const COLS = 5;
export const ROWS = 20;
const PITCH = { x: 64, y: 30 } as const;
const STACK_W = (COLS - 1) * PITCH.x + BAR.w; // 316
const STACK_H = (ROWS - 1) * PITCH.y + BAR.h; // 598
/** The steel post under the money (out of the plinth's slot): it raises the money 36 px clear above its
 *  vehicle's hull, the same over both, so both read as one construction (vehicle in front, money raised up
 *  behind). A stem a little narrower than the money. */
const MONEY_GAP = 36;
const STEM_INSET = 12;
const PAD = 12;
const TILE_GAP = 72;
/** The vehicles, true to size: Mako 2 m (oceanShared's real Mako, D = L / 11); Mk 18 Mod 2 3.25 m, L/D 10. */
const MAKO_L = 345;
const MAKO_D = MAKO_L / 11;
const NAVY = { L: 560, D: 56 } as const;
const MAKO_SADDLE = 16; // clears the Mako's sonar pod and tail fins
const NAVY_SADDLE = 14;
const X0 = 540 - (2 * PAD + MAKO_L + TILE_GAP + 2 * PAD + NAVY.L) / 2; // the layout is centred at k 1
const MT = { x0: X0, x1: X0 + PAD + MAKO_L + PAD } as const;
const MAKO_NOSE = MT.x0 + PAD;
const BAR_X = MAKO_NOSE + MAKO_L / 2;
const NT = {
  x0: MT.x1 + TILE_GAP,
  x1: MT.x1 + TILE_GAP + PAD + NAVY.L + PAD,
} as const;
const NAVY_NOSE = NT.x0 + PAD;
const STACK_X = NAVY_NOSE + NAVY.L / 2;
const X_LAYOUT = (MT.x0 + NT.x1) / 2;
const MAKO_YC = -(MAKO_SADDLE + MAKO_D / 2);
const NAVY_YC = -(NAVY_SADDLE + NAVY.D / 2);
const POST_MAKO = MAKO_SADDLE + MAKO_D + MONEY_GAP;
const POST_NAVY = NAVY_SADDLE + NAVY.D + MONEY_GAP;
const MAKO_COL = POST_MAKO + BAR.h;
const NAVY_COL = POST_NAVY + STACK_H;
type Saddle = { x: number; wt: number; wb: number; h: number };
const SADDLES_MAKO: Saddle[] = [-0.25, 0.22].map((u) => ({
  x: BAR_X + u * MAKO_L,
  wt: 0.1 * MAKO_L,
  wb: 0.14 * MAKO_L,
  h: MAKO_SADDLE,
}));
const SADDLES_NAVY: Saddle[] = [0.2, 0.72].map((u) => ({
  x: NAVY_NOSE + u * NAVY.L,
  wt: 0.09 * NAVY.L,
  wb: 0.12 * NAVY.L,
  h: NAVY_SADDLE,
}));
/** Type on the plinths (Söhne Kräftig caps, cream; world px = screen px at the end). */
const MARK_PX = 34;
const SHIELD_H = 34;
const LABEL_Y = TOP + 19; // the label's centre on the front face (high on it: clear of the caption band)

// ===========================================================================
// TIMING (the approved V2 tracks)
// ===========================================================================
const toGo = (f: number, fLand: number, td: number, v: number) => {
  const u = fLand - f;
  if (u <= 0) return 0;
  if (u <= td) return (v * u * u) / (2 * td);
  return v * (u - td / 2);
};
type Run = {
  land: number;
  brake: number;
  v: number;
  hover: number;
  settle: number;
};
const MAKO_RUN: Run = { land: 40, brake: 18, v: 11, hover: 8, settle: 11 };
const NAVY_RUN: Run = { land: 149, brake: 22, v: 15, hover: 10, settle: 12 };
const runAt = (run: Run, rest: number, f: number) => {
  const down = smoothstep((f - (run.land - run.settle)) / run.settle);
  return {
    nose: rest + toGo(f, run.land, run.brake, run.v),
    hover: run.hover * (1 - down),
    down,
    landed: f >= run.land,
  };
};
const makoAt = (f: number) => runAt(MAKO_RUN, MAKO_NOSE, f);
const navyAt = (f: number) => runAt(NAVY_RUN, NAVY_NOSE, f);
const climbTable = (start: number, ease: number) => {
  const N = 4000;
  const vel = (u: number) =>
    smoothstep(u / start) * (1 - smoothstep((u - (1 - ease)) / ease));
  const out = [0];
  let s = 0;
  for (let i = 1; i <= N; i++) {
    s += vel((i - 0.5) / N);
    out.push(s);
  }
  return out.map((v) => v / s);
};
const sampleTable = (T: number[], u: number) => {
  const i = clamp01(u) * (T.length - 1);
  const a = Math.floor(i);
  const b = Math.min(T.length - 1, a + 1);
  return lerp(T[a], T[b], i - a);
};
export const BAR_F = [47, 67] as const;
const BAR_T = climbTable(0.12, 0.45);
export const makoCol = (f: number) =>
  MAKO_COL * sampleTable(BAR_T, (f - BAR_F[0]) / (BAR_F[1] - BAR_F[0]));
export const STACK_F = [152, 231] as const;
const STACK_T = climbTable(0.05, 0.16);
export const navyCol = (f: number) =>
  NAVY_COL * sampleTable(STACK_T, (f - STACK_F[0]) / (STACK_F[1] - STACK_F[0]));
const SWEEP_F = [221, 236] as const;
const NUM50_IN = 64;
const NUM5M_IN = 231;
const TEXT_F = 12;

// ===========================================================================
// THE CAMERA (oceanShared's house follower, pre-rolled): the V2 framings
// ===========================================================================
const K_OPEN = 2.16;
const K_CLOSE = 2.22;
const K_END = 1;
const FLOOR_OPEN = 950;
const FLOOR_PAIR = 900;
const FLOOR_END = 990;
const camY = (floor: number, k: number) => -(floor - 960) / k;
const GLIDES: Glide[] = [
  { f0: -24, f1: 46, dx: -4, k: K_OPEN * 1.015, warp: 1 },
  {
    f0: 40,
    f1: 84,
    dy: camY(FLOOR_OPEN, K_CLOSE) - camY(FLOOR_OPEN, K_OPEN),
    k: K_CLOSE,
    warp: 1,
  },
  {
    f0: 82,
    f1: 150,
    dx: X_LAYOUT - BAR_X,
    dy: camY(FLOOR_PAIR, K_END) - camY(FLOOR_OPEN, K_CLOSE),
    k: K_END,
    warp: 0.95,
  },
  {
    f0: 150,
    f1: 236,
    dy: camY(FLOOR_END, K_END) - camY(FLOOR_PAIR, K_END),
    warp: 1.1,
  },
  {
    f0: 234,
    f1: 300,
    dy: -((560 - 960) / K_END) * (1 / 1.008 - 1),
    k: K_END * 1.008,
    warp: 1,
  },
];
const CLOCK = makeClockCam(
  { x: BAR_X + 4, y: camY(FLOOR_OPEN, K_OPEN), k: K_OPEN },
  GLIDES,
  DURATION + 4,
);
export const camAt = (f: number): Cam => CLOCK.at(f);
const K_CLOSE_REAL = camAt(84).k;
const K_END_REAL = camAt(160).k;
const zoomOut = (k: number) =>
  clamp01(
    (Math.log(k) - Math.log(K_CLOSE_REAL)) /
      (Math.log(K_END_REAL) - Math.log(K_CLOSE_REAL)),
  );
/** OceanStage's handheld sway (the stage applies it; the checks allow for it). */
const swayAt = (f: number) => ({
  x: 3 * Math.sin(f / 23),
  y: 5 * Math.sin(f / 19),
});
const toScreen = (f: number, x: number, y: number) => {
  const c = camAt(f);
  const s = swayAt(f);
  return { x: 540 + (x - c.x) * c.k + s.x, y: 960 + (y - c.y) * c.k + s.y };
};

// ===========================================================================
// MATERIALS (realistic, warm-graded)
// ===========================================================================
/** The plinth: weathered grey-brown concrete with a lit top edge. */
const STONE = {
  top: "#7A7062",
  hi: "#6A6052",
  mid: "#4E453B",
  lo: "#3A322A",
  foot: "#2C251F",
} as const;
/** The Kingfish's grey paint (warm-graded) and its black bands. */
const GREY = {
  hi: "#D2CFC2",
  a: "#B3B1A5",
  b: "#8F8E83",
  lo: "#5E5D55",
  deep: "#3E3D38",
  band: "#262320",
  fin: "#7E4A30",
} as const;
/** Gold: dark foot, rich body, bright bevel and specular. */
const GOLD = {
  deep: "#6E3F06",
  lo: "#A8620A",
  mid: "#E09A12",
  hi: "#FFC93D",
  spec: "#FFF1C2",
} as const;

// ===========================================================================
// THE KINGFISH (Mk 18 Mod 2 / REMUS 600), after the Navy's studio render: a grey cylinder with a blunt rounded
// nose, black band seams, the side-scan array along the forward lower side, a low lifting bracket amidships,
// a thin short antenna and a short mast aft, a short tail cone with swept fins (the top one rust-red, as in
// the photo) and the propeller. Side view, nose LEFT at x0, hull centre on yc.
// ===========================================================================
const navyGeo = (x0: number, yc: number) => {
  const { L, D } = NAVY;
  const r = D / 2;
  const n = 0.065 * L;
  const b = x0 + 0.875 * L;
  const c = x0 + 0.955 * L;
  const hull =
    `M${f2(x0 + n)} ${f2(yc - r)}H${f2(b)}C${f2(b + 0.035 * L)} ${f2(yc - r)} ${f2(c - 0.03 * L)} ${f2(yc - 0.42 * r)} ${f2(c)} ${f2(yc - 0.3 * r)}` +
    `V${f2(yc + 0.3 * r)}C${f2(c - 0.03 * L)} ${f2(yc + 0.42 * r)} ${f2(b + 0.035 * L)} ${f2(yc + r)} ${f2(b)} ${f2(yc + r)}H${f2(x0 + n)}` +
    `A${f2(n)} ${f2(r)} 0 0 1 ${f2(x0)} ${f2(yc)}A${f2(n)} ${f2(r)} 0 0 1 ${f2(x0 + n)} ${f2(yc - r)}Z`;
  const fin = (s: number) => {
    const y = (v: number) => f2(yc + s * v);
    return `M${f2(x0 + 0.895 * L)} ${y(0.5 * r)}L${f2(x0 + 0.93 * L)} ${y(1.38 * r)}Q${f2(x0 + 0.934 * L)} ${y(1.42 * r)} ${f2(x0 + 0.94 * L)} ${y(1.42 * r)}H${f2(x0 + 0.95 * L)}Q${f2(x0 + 0.955 * L)} ${y(1.42 * r)} ${f2(x0 + 0.955 * L)} ${y(1.36 * r)}V${y(0.2 * r)}Z`;
  };
  const hub = `M${f2(c - 2)} ${f2(yc - 0.3 * r)}H${f2(c + 3)}Q${f2(x0 + L)} ${f2(yc - 0.22 * r)} ${f2(x0 + L)} ${f2(yc)}Q${f2(x0 + L)} ${f2(yc + 0.22 * r)} ${f2(c + 3)} ${f2(yc + 0.3 * r)}H${f2(c - 2)}Z`;
  const prop = { cx: x0 + 0.975 * L, rx: 0.05 * D, ry: 0.8 * r };
  const ax = x0 + 0.845 * L;
  const antenna = `M${f2(ax - 0.035 * D)} ${f2(yc - r + 2)}V${f2(yc - r - 0.36 * D)}H${f2(ax + 0.035 * D)}V${f2(yc - r + 2)}Z`;
  const mx = x0 + 0.81 * L;
  const mast = `M${f2(mx - 0.06 * D)} ${f2(yc - r + 2)}V${f2(yc - r - 0.22 * D)}H${f2(mx + 0.06 * D)}V${f2(yc - r + 2)}Z`;
  const mastCap = `M${f2(mx - 0.1 * D)} ${f2(yc - r - 0.2 * D)}V${f2(yc - r - 0.28 * D)}H${f2(mx + 0.1 * D)}V${f2(yc - r - 0.2 * D)}Z`;
  const bracket = `M${f2(x0 + 0.34 * L)} ${f2(yc - r + 1)}L${f2(x0 + 0.38 * L)} ${f2(yc - r - 0.15 * D)}H${f2(x0 + 0.51 * L)}L${f2(x0 + 0.55 * L)} ${f2(yc - r + 1)}Z`;
  return {
    hull,
    finTop: fin(-1),
    finBot: fin(1),
    hub,
    prop,
    antenna,
    mast,
    mastCap,
    bracket,
    r,
    n,
    b,
    c,
  };
};
const Kingfish: React.FC<{ x0: number; yc: number }> = ({ x0, yc }) => {
  const o = useOcean();
  const uid = uidOf(useId());
  const g = navyGeo(x0, yc);
  const { L, D } = NAVY;
  const r = g.r;
  const px = 1 / o.a;
  const fog = fogAt(o.scene, o.distM) * 0.8;
  const bands = [0.045, 0.075, 0.41, 0.49, 0.72];
  const bw = Math.max(0.012 * L, 2.2 * px);
  return (
    <InFog amount={fog}>
      <defs>
        <linearGradient
          id={`${uid}h`}
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1={f2(yc - r)}
          x2="0"
          y2={f2(yc + r)}
        >
          <stop offset="0" stopColor={GREY.hi} />
          <stop offset="0.16" stopColor={GREY.a} />
          <stop offset="0.5" stopColor={GREY.b} />
          <stop offset="0.82" stopColor={GREY.lo} />
          <stop offset="1" stopColor={GREY.deep} />
        </linearGradient>
        <linearGradient
          id={`${uid}f`}
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1={f2(yc - 1.4 * r)}
          x2="0"
          y2={f2(yc + 1.4 * r)}
        >
          <stop offset="0" stopColor={GREY.a} />
          <stop offset="1" stopColor={GREY.deep} />
        </linearGradient>
        <linearGradient
          id={`${uid}b`}
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1={f2(yc - r)}
          x2="0"
          y2={f2(yc + r)}
        >
          <stop offset="0" stopColor="#4A4540" />
          <stop offset="0.2" stopColor={GREY.band} />
          <stop offset="1" stopColor="#141210" />
        </linearGradient>
        <clipPath id={`${uid}c`}>
          <path d={g.hull} />
        </clipPath>
      </defs>
      {/* behind the hull: the antenna, the mast, the bracket, the fins (top rust-red, as painted) */}
      <path d={g.antenna} fill={`url(#${uid}f)`} />
      <path d={g.mast} fill={`url(#${uid}f)`} />
      <path d={g.mastCap} fill={GREY.lo} />
      <path d={g.bracket} fill={`url(#${uid}f)`} />
      <path d={g.finTop} fill={GREY.fin} />
      <path d={g.finBot} fill={`url(#${uid}f)`} />
      {/* the prop hub and the propeller (edge-on) */}
      <path d={g.hub} fill={GREY.deep} />
      <ellipse
        cx={f2(g.prop.cx)}
        cy={f2(yc)}
        rx={f2(g.prop.rx)}
        ry={f2(g.prop.ry)}
        fill={GREY.band}
      />
      <ellipse
        cx={f2(g.prop.cx - g.prop.rx * 0.3)}
        cy={f2(yc - g.prop.ry * 0.35)}
        rx={f2(g.prop.rx * 0.45)}
        ry={f2(g.prop.ry * 0.35)}
        fill={GREY.lo}
        opacity={0.6}
      />
      {/* the hull: painted grey, lit from above (a cream rim) */}
      <RimLit
        d={g.hull}
        body={`url(#${uid}h)`}
        w={Math.max(r * 0.09, 1.6 * px)}
        rimOpacity={0.8}
      />
      <g clipPath={`url(#${uid}c)`}>
        {/* a soft specular sheen along the upper hull */}
        <rect
          x={f2(x0)}
          y={f2(yc - r * 0.62)}
          width={f2(L)}
          height={f2(r * 0.22)}
          fill={OCEAN.cream}
          opacity={0.22}
          style={{ filter: `blur(${f2(r * 0.12)}px)` }}
        />
        {/* the black bands */}
        {bands.map((u) => (
          <g key={u}>
            <rect
              x={f2(x0 + u * L - bw / 2)}
              y={f2(yc - r)}
              width={f2(bw)}
              height={f2(2 * r)}
              fill={`url(#${uid}b)`}
            />
            <rect
              x={f2(x0 + u * L - bw / 2)}
              y={f2(yc - r)}
              width={f2(bw * 0.3)}
              height={f2(r * 0.9)}
              fill={OCEAN.cream}
              opacity={0.12}
            />
          </g>
        ))}
        <rect
          x={f2(g.b - bw * 0.3)}
          y={f2(yc - r)}
          width={f2(bw * 1.3)}
          height={f2(2 * r)}
          fill={`url(#${uid}b)`}
        />
        {/* the side-scan array: a long dark panel low on the forward hull */}
        <path
          d={`M${f2(x0 + 0.09 * L)} ${f2(yc + 0.5 * r)}H${f2(x0 + 0.4 * L)}V${f2(yc + 0.7 * r)}H${f2(x0 + 0.09 * L)}Z`}
          fill={GREY.band}
          opacity={0.92}
        />
        <path
          d={`M${f2(x0 + 0.09 * L)} ${f2(yc + 0.5 * r + px)}H${f2(x0 + 0.4 * L)}`}
          stroke={OCEAN.cream}
          strokeOpacity={0.22}
          strokeWidth={f2(px)}
        />
        {/* the nose: a sensor window */}
        <ellipse
          cx={f2(x0 + 0.022 * L)}
          cy={f2(yc + 0.05 * r)}
          rx={f2(0.11 * r)}
          ry={f2(0.16 * r)}
          fill={GREY.band}
        />
        <ellipse
          cx={f2(x0 + 0.02 * L)}
          cy={f2(yc - 0.02 * r)}
          rx={f2(0.04 * r)}
          ry={f2(0.06 * r)}
          fill={OCEAN.cream}
          opacity={0.45}
        />
        {/* the near side fin, edge-on */}
        <path
          d={`M${f2(x0 + 0.9 * L)} ${f2(yc - 0.05 * D)}H${f2(x0 + 0.955 * L)}V${f2(yc + 0.05 * D)}H${f2(x0 + 0.9 * L)}Z`}
          fill={GREY.lo}
        />
      </g>
    </InFog>
  );
};

// ===========================================================================
// THE GOLD: realistic ingots on a steel post, rising out of a plinth's slot (amber = money)
// ===========================================================================
const barPath = (x: number, y0: number) => {
  const t = BAR.top / 2;
  const b = BAR.w / 2;
  return `M${f2(x - t + 2)} ${f2(y0)}H${f2(x + t - 2)}Q${f2(x + t)} ${f2(y0)} ${f2(x + t + 0.35)} ${f2(y0 + 1.8)}L${f2(x + b)} ${f2(y0 + BAR.h)}H${f2(x - b)}L${f2(x - t - 0.35)} ${f2(y0 + 1.8)}Q${f2(x - t)} ${f2(y0)} ${f2(x - t + 2)} ${f2(y0)}Z`;
};
const pileBars = (cx: number, top: number, cols: number, rows: number) => {
  const out: { x: number; y: number; i: number }[] = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      out.push({
        x: cx + (c - (cols - 1) / 2) * PITCH.x,
        y: top + r * PITCH.y,
        i: r * cols + c,
      });
  return out;
};
/**
 * GoldPile — a steel post (out of the slot at y 0) carrying cols x rows gold ingots, risen `col` px. Each
 * ingot: a metallic face (dark foot, rich body, a bright bevel on top and a specular streak), a faint
 * stamped panel, a warm bloom; the gaps between ingots are the pile's own dark gold. A warm amber glow
 * lights the water around it (screen), growing with the gold that is out.
 */
const GoldPile: React.FC<{
  cx: number;
  col: number;
  cols: number;
  rows: number;
}> = ({ cx, col, cols, rows }) => {
  const o = useOcean();
  const uid = uidOf(useId());
  if (col <= 0.05) return null;
  const px = 1 / o.a;
  const w = (cols - 1) * PITCH.x + BAR.w;
  const h = (rows - 1) * PITCH.y + BAR.h;
  const top = -col;
  const bottom = top + h;
  const bars = pileBars(cx, top, cols, rows).filter((b) => b.y < 0);
  const goldOut = Math.max(0, Math.min(0, bottom) - top); // gold height above the slot
  const glowR = Math.max(60, 0.75 * Math.max(w, goldOut));
  const glowY = top + Math.min(h, -top) / 2;
  return (
    <g>
      <defs>
        <clipPath id={`${uid}s`}>
          <rect
            x={f2(cx - w)}
            y={f2(-col - 80)}
            width={f2(2 * w)}
            height={f2(col + 80)}
          />
        </clipPath>
        <linearGradient id={`${uid}p`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={OCEAN.steelLo} />
          <stop offset="0.3" stopColor={OCEAN.steelHi} />
          <stop offset="0.55" stopColor={OCEAN.steelMid} />
          <stop offset="1" stopColor="#35352F" />
        </linearGradient>
        <linearGradient id={`${uid}g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={GOLD.hi} />
          <stop offset="0.12" stopColor={GOLD.spec} />
          <stop offset="0.22" stopColor={GOLD.hi} />
          <stop offset="0.55" stopColor={GOLD.mid} />
          <stop offset="0.85" stopColor={GOLD.lo} />
          <stop offset="1" stopColor={GOLD.deep} />
        </linearGradient>
        <linearGradient id={`${uid}e`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={GOLD.deep} stopOpacity="0.55" />
          <stop offset="0.14" stopColor={GOLD.deep} stopOpacity="0" />
          <stop offset="0.86" stopColor={GOLD.deep} stopOpacity="0" />
          <stop offset="1" stopColor={GOLD.deep} stopOpacity="0.7" />
        </linearGradient>
        <radialGradient
          id={`${uid}w`}
          gradientUnits="userSpaceOnUse"
          cx={f2(cx)}
          cy={f2(glowY)}
          r={f2(glowR)}
        >
          <stop offset="0" stopColor={OCEAN.amberTop} stopOpacity="0.32" />
          <stop offset="0.5" stopColor={OCEAN.amberFoot} stopOpacity="0.12" />
          <stop offset="1" stopColor={OCEAN.amberFoot} stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* the warm glow of the gold in the water */}
      {goldOut > 0.5 ? (
        <g style={{ mixBlendMode: "screen" }}>
          <ellipse
            cx={f2(cx)}
            cy={f2(glowY)}
            rx={f2(glowR * 1.25)}
            ry={f2(glowR * 1.1 + goldOut * 0.15)}
            fill={`url(#${uid}w)`}
          />
        </g>
      ) : null}
      <g clipPath={`url(#${uid}s)`}>
        {/* the steel post */}
        {bottom < 0 ? (
          <g>
            <rect
              x={f2(cx - w / 2 + STEM_INSET)}
              y={f2(bottom - 1)}
              width={f2(w - 2 * STEM_INSET)}
              height={f2(-bottom + 1)}
              fill={`url(#${uid}p)`}
            />
            <rect
              x={f2(cx - w / 2 + STEM_INSET)}
              y={f2(bottom - 1)}
              width={f2(w - 2 * STEM_INSET)}
              height={f2(Math.min(6, -bottom))}
              fill={OCEAN.shadow}
              opacity={0.45}
            />
          </g>
        ) : null}
        {/* the dark gold between the ingots */}
        {rows * cols > 1 ? (
          <rect
            x={f2(cx - w / 2 + 3)}
            y={f2(top + 8)}
            width={f2(w - 6)}
            height={f2(Math.min(h, -top) - 8)}
            fill={GOLD.deep}
          />
        ) : null}
        <g style={{ filter: bloomFilter(o.a) }}>
          {bars.map((b) => (
            <path key={b.i} d={barPath(b.x, b.y)} fill={`url(#${uid}g)`} />
          ))}
        </g>
        {bars.map((b) => (
          <g key={b.i}>
            <path d={barPath(b.x, b.y)} fill={`url(#${uid}e)`} />
            {/* the stamped panel and the bright bevel on top */}
            <rect
              x={f2(b.x - 15)}
              y={f2(b.y + 9)}
              width={30}
              height={11}
              rx={1.5}
              fill="none"
              stroke={GOLD.lo}
              strokeOpacity={0.55}
              strokeWidth={f2(Math.max(0.8, 1.1 * px))}
            />
            <path
              d={`M${f2(b.x - BAR.top / 2 + 2)} ${f2(b.y + Math.max(0.8, 1.2 * px))}H${f2(b.x + BAR.top / 2 - 2)}`}
              stroke={GOLD.spec}
              strokeWidth={f2(Math.max(1.4, 2 * px))}
            />
            {/* a glint that sits a little differently on each ingot */}
            <ellipse
              cx={f2(b.x - 12 + 22 * hash01(b.i + 3))}
              cy={f2(b.y + 5)}
              rx={7}
              ry={1.6}
              fill="#FFFFFF"
              opacity={0.35 + 0.25 * hash01(b.i + 9)}
              style={{ filter: `blur(${f2(1.2)}px)` }}
            />
          </g>
        ))}
      </g>
    </g>
  );
};

// ===========================================================================
// THE PLINTH: a weathered block on the seabed, its cradle saddles, its slot, its cream label
// ===========================================================================
const ULYSSES_TEXT = "ULYSSES";
const NAVY_TEXT = "U.S. NAVY";
const PlinthLabel: React.FC<{ kind: "ulysses" | "navy"; cx: number }> = ({
  kind,
  cx,
}) => {
  const cap = MARK_PX * METRIC.cap;
  const base = LABEL_Y + cap / 2;
  const textProps = {
    fontFamily: FONT_LABEL,
    fontWeight: 500,
    fontSize: MARK_PX,
    letterSpacing: `${TRACK.label}em`,
    fill: OCEAN.cream,
    style: { fontFeatureSettings: '"case" 1' },
  } as const;
  if (kind === "navy") {
    const w = labelWidth(NAVY_TEXT, MARK_PX);
    return (
      <text x={f2(cx - w / 2)} y={f2(base)} {...textProps}>
        {NAVY_TEXT}
      </text>
    );
  }
  const sw = (SHIELD_H * 84) / 100;
  const gap = 12;
  const tw = labelWidth(ULYSSES_TEXT, MARK_PX);
  const x0 = cx - (sw + gap + tw) / 2;
  const sc = SHIELD_H / 100;
  return (
    <g>
      <g
        transform={`translate(${f2(x0)} ${f2(LABEL_Y - SHIELD_H / 2 - 0.5 * sc)}) scale(${f6(sc)})`}
        fill={OCEAN.cream}
      >
        <path d={ULYSSES_D[1]} fillRule="evenodd" />
      </g>
      <text x={f2(x0 + sw + gap)} y={f2(base)} {...textProps}>
        {ULYSSES_TEXT}
      </text>
    </g>
  );
};
const saddlePath = (s: Saddle) =>
  poly([
    { x: s.x - s.wt / 2, y: -s.h },
    { x: s.x + s.wt / 2, y: -s.h },
    { x: s.x + s.wb / 2, y: 0.5 },
    { x: s.x - s.wb / 2, y: 0.5 },
  ]);
/** The plinth body (behind the money and the vehicle): AO on the seabed, the front face, the top face, the
 *  slot; `glow` 0..1 warms its top with the gold's light. */
const Plinth: React.FC<{
  x0: number;
  x1: number;
  slotX: number;
  slotW: number;
  kind: "ulysses" | "navy";
  markX: number;
  glow: number;
  seed: number;
}> = ({ x0, x1, slotX, slotW, kind, markX, glow, seed }) => {
  const o = useOcean();
  const uid = uidOf(useId());
  const px = 1 / o.a;
  const w = x1 - x0;
  const fog = fogAt(o.scene, o.distM);
  const ch = 3; // the chamfer of the top edge
  const blotches = Array.from({ length: 7 }, (_, i) => ({
    x: x0 + w * (0.06 + 0.88 * hash01(seed + i * 3.1)),
    y: TOP + (PLINTH_H - TOP) * (0.35 + 0.6 * hash01(seed + i * 5.7)),
    r: 10 + 26 * hash01(seed + i * 7.3),
  }));
  return (
    <g>
      <defs>
        <linearGradient
          id={`${uid}f`}
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1={f2(TOP)}
          x2="0"
          y2={f2(PLINTH_H)}
        >
          <stop offset="0" stopColor={STONE.hi} />
          <stop offset="0.35" stopColor={STONE.mid} />
          <stop offset="0.85" stopColor={STONE.lo} />
          <stop offset="1" stopColor={STONE.foot} />
        </linearGradient>
        <linearGradient
          id={`${uid}t`}
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1={f2(-TOP)}
          x2="0"
          y2={f2(TOP)}
        >
          <stop offset="0" stopColor={STONE.hi} />
          <stop offset="1" stopColor={STONE.top} />
        </linearGradient>
        <clipPath id={`${uid}c`}>
          <rect
            x={f2(x0)}
            y={f2(TOP)}
            width={f2(w)}
            height={f2(PLINTH_H - TOP)}
          />
        </clipPath>
      </defs>
      {/* contact shadow on the seabed */}
      <ellipse
        cx={f2((x0 + x1) / 2)}
        cy={f2(PLINTH_H + 2)}
        rx={f2(w * 0.56)}
        ry={f2(9)}
        fill={OCEAN.shadow}
        opacity={0.55}
        style={{ filter: `blur(${f2(6)}px)` }}
      />
      <InFog amount={fog * 0.8}>
        {/* the top face (seen a little from above) */}
        <path
          d={poly([
            { x: x0 + 4, y: -TOP },
            { x: x1 - 4, y: -TOP },
            { x: x1, y: TOP },
            { x: x0, y: TOP },
          ])}
          fill={`url(#${uid}t)`}
        />
        {/* the front face, weathered */}
        <path
          d={`M${f2(x0)} ${f2(TOP)}H${f2(x1)}V${f2(PLINTH_H)}H${f2(x0)}Z`}
          fill={`url(#${uid}f)`}
        />
        <g clipPath={`url(#${uid}c)`}>
          {blotches.map((b, i) => (
            <ellipse
              key={i}
              cx={f2(b.x)}
              cy={f2(b.y)}
              rx={f2(b.r)}
              ry={f2(b.r * 0.45)}
              fill={i % 2 ? STONE.foot : STONE.hi}
              opacity={0.28}
              style={{ filter: `blur(${f2(b.r * 0.5)}px)` }}
            />
          ))}
          {/* fouling at the foot */}
          <rect
            x={f2(x0)}
            y={f2(PLINTH_H - 12)}
            width={f2(w)}
            height={12}
            fill="#2F2B20"
            opacity={0.5}
            style={{ filter: `blur(${f2(4)}px)` }}
          />
        </g>
        {/* the lit edge where top meets front (the surface's light) */}
        <path
          d={`M${f2(x0 + ch)} ${f2(TOP + px)}H${f2(x1 - ch)}`}
          stroke={OCEAN.cream}
          strokeOpacity={0.55}
          strokeWidth={f2(Math.max(1.2, 1.6 * px))}
        />
        {/* the slot the money rises from */}
        <rect
          x={f2(slotX - slotW / 2)}
          y={f2(-2)}
          width={f2(slotW)}
          height={4}
          rx={1.5}
          fill={OCEAN.shadow}
        />
      </InFog>
      {/* the gold's warm light on the plinth's top */}
      {glow > 0.01 ? (
        <g style={{ mixBlendMode: "screen" }} opacity={f2(glow)}>
          <ellipse
            cx={f2(slotX)}
            cy={f2(TOP)}
            rx={f2(slotW * 0.9)}
            ry={f2(14)}
            fill={OCEAN.amberTop}
            opacity={0.35}
            style={{ filter: `blur(${f2(10)}px)` }}
          />
        </g>
      ) : null}
      <PlinthLabel kind={kind} cx={markX} />
    </g>
  );
};
/** The cradle saddles (steel), in front of the money, under the vehicle. */
const Saddles: React.FC<{ saddles: Saddle[] }> = ({ saddles }) => {
  const o = useOcean();
  const uid = uidOf(useId());
  const px = 1 / o.a;
  const fog = fogAt(o.scene, o.distM);
  return (
    <InFog amount={fog * 0.8}>
      <defs>
        <linearGradient id={`${uid}s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={OCEAN.steelMid} />
          <stop offset="1" stopColor={OCEAN.steelLo} />
        </linearGradient>
      </defs>
      {saddles.map((s) => (
        <g key={s.x}>
          <path d={saddlePath(s)} fill={`url(#${uid}s)`} />
          <path
            d={`M${f2(s.x - s.wt / 2 + 1)} ${f2(-s.h + px)}H${f2(s.x + s.wt / 2 - 1)}`}
            stroke={OCEAN.cream}
            strokeOpacity={0.5}
            strokeWidth={f2(Math.max(1, 1.4 * px))}
          />
          <ellipse
            cx={f2(s.x)}
            cy={f2(1)}
            rx={f2(s.wb * 0.55)}
            ry={2.5}
            fill={OCEAN.shadow}
            opacity={0.5}
            style={{ filter: `blur(${f2(2)}px)` }}
          />
        </g>
      ))}
    </InFog>
  );
};

// ===========================================================================
// THE CUT
// ===========================================================================
const World: React.FC<{ f: number }> = ({ f }) => {
  const o = useOcean();
  const k = o.a;
  const mk = makoAt(f);
  const nv = navyAt(f);
  const mCol = makoCol(f);
  const nCol = navyCol(f);
  const px50 = lerp(TYPE.HERO, TYPE.SECONDARY, zoomOut(k));
  const sweepT = (f - SWEEP_F[0]) / (SWEEP_F[1] - SWEEP_F[0]);
  const sTop = -nCol;
  const sBot = Math.min(0, sTop + STACK_H);
  const mkC = { x: mk.nose + MAKO_L / 2, y: MAKO_YC - mk.hover };
  return (
    <>
      <Plinth
        x0={MT.x0}
        x1={MT.x1}
        slotX={BAR_X}
        slotW={BAR.w + 4}
        kind="ulysses"
        markX={BAR_X}
        glow={clamp01(mCol / 40)}
        seed={11}
      />
      <Plinth
        x0={NT.x0}
        x1={NT.x1}
        slotX={STACK_X}
        slotW={STACK_W + 4}
        kind="navy"
        markX={STACK_X}
        glow={clamp01(nCol / 120)}
        seed={41}
      />
      {/* the money, out of the slots behind the vehicles */}
      <GoldPile cx={BAR_X} col={mCol} cols={1} rows={1} />
      <GoldPile cx={STACK_X} col={nCol} cols={COLS} rows={ROWS} />
      {/* THE ONE LIGHT SWEEP: up the gold as it tops out */}
      {sweepT > 0 && sweepT < 1 && sBot - sTop > 1 ? (
        <g
          transform={`rotate(-90 ${f2(STACK_X)} ${f2((sTop + sBot) / 2)})`}
          style={{ mixBlendMode: "screen" }}
        >
          <LightSweep
            x={STACK_X - (sBot - sTop) / 2}
            y={(sTop + sBot) / 2 - STACK_W / 2}
            w={sBot - sTop}
            h={STACK_W}
            k={k}
            t={sweepT}
            on="amber"
          />
        </g>
      ) : null}
      <Saddles saddles={SADDLES_MAKO} />
      <Saddles saddles={SADDLES_NAVY} />
      {/* soft contact under each landed hull on its saddles */}
      {[
        { x: mkC.x, y: -MAKO_SADDLE, w: MAKO_L * 0.42, d: mk.down },
        {
          x: nv.nose + NAVY.L * 0.46,
          y: -NAVY_SADDLE,
          w: NAVY.L * 0.42,
          d: nv.down,
        },
      ].map((c, i) =>
        c.d > 0.01 ? (
          <ellipse
            key={i}
            cx={f2(c.x)}
            cy={f2(c.y + 1)}
            rx={f2(c.w)}
            ry={3}
            fill={OCEAN.shadow}
            opacity={f2(0.35 * c.d)}
            style={{ filter: `blur(${f2(3)}px)` }}
          />
        ) : null,
      )}
      {/* the vehicles: the real Mako (nose left, running light off: amber = money here) and the Kingfish */}
      <UlyssesVehicle
        x={mkC.x}
        y={mkC.y}
        L={MAKO_L}
        facing={-1}
        tilt={0}
        frame={f}
        light={0}
      />
      <Kingfish x0={nv.nose} yc={NAVY_YC - nv.hover} />
      {/* the figures: the only numbers on screen (a soft brown shade under them: cream on the bright upper water) */}
      <g
        style={{
          filter: `drop-shadow(0 ${f2(3 / k)}px ${f2(14 / k)}px rgba(${OCEAN.vignette},0.6))`,
        }}
      >
        <Numeral
          x={BAR_X}
          y={-MAKO_COL - SPACE.VALUE / k}
          k={k}
          px={px50}
          text="$50K"
          anchor="middle"
          enter={(f - NUM50_IN) / TEXT_F}
        />
        <Numeral
          x={STACK_X}
          y={-NAVY_COL - SPACE.VALUE / k}
          k={k}
          px={TYPE.HERO}
          text="~$5M"
          anchor="middle"
          enter={(f - NUM5M_IN) / TEXT_F}
        />
      </g>
    </>
  );
};

const FiftyKVsFiveMillion: React.FC<Props> = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <OceanStage
        frame={f + 300}
        cam={camAt(f)}
        scene={SCENE_GOLD}
        horizon={HOR}
        rest={CLOCK.rest}
        sway
      >
        <World f={f} />
      </OceanStage>
    </AbsoluteFill>
  );
};

export default FiftyKVsFiveMillion;

// ===========================================================================
// LOAD-TIME CHECKS: the rules the cut rests on.
// ===========================================================================
/** For the build's checks (scripts only): screen boxes of the text at frame f (with the stage's sway). */
export const textBoxes = (f: number) => {
  const k = camAt(f).k;
  const px50 = lerp(TYPE.HERO, TYPE.SECONDARY, zoomOut(k));
  const b50 = toScreen(f, BAR_X, -MAKO_COL - SPACE.VALUE / k);
  const b5 = toScreen(f, STACK_X, -NAVY_COL - SPACE.VALUE / k);
  const w50 = numeralWidth("$50K", px50);
  const w5 = numeralWidth("~$5M", TYPE.HERO);
  const face = toScreen(f, 0, LABEL_Y);
  const cap = MARK_PX * METRIC.cap * k;
  return {
    k,
    n50: {
      x0: b50.x - w50 / 2,
      x1: b50.x + w50 / 2,
      y0: b50.y - METRIC.dollarTop * px50,
      y1: b50.y + METRIC.dollarDesc * px50,
    },
    n5: {
      x0: b5.x - w5 / 2,
      x1: b5.x + w5 / 2,
      y0: b5.y - METRIC.dollarTop * TYPE.HERO,
      y1: b5.y + METRIC.dollarDesc * TYPE.HERO,
    },
    labels: { y0: face.y - cap / 2, y1: face.y + cap / 2 },
  };
};
{
  const fail = (m: string) => {
    throw new Error(`FiftyKVsFiveMillion: ${m}`);
  };
  if (COLS * ROWS !== 100) fail("the stack is not exactly 100 bars");
  if (
    Math.abs(navyCol(STACK_F[1]) - NAVY_COL) > 1e-6 ||
    Math.abs(makoCol(BAR_F[1]) - MAKO_COL) > 1e-6
  )
    fail("a pile does not land on its height");
  if (STACK_X + STACK_W / 2 + 4 > NAVY_NOSE + 0.81 * NAVY.L - 0.1 * NAVY.D)
    fail("a Kingfish mast stands under the stack");
  const j = camJerk(CLOCK.track, DURATION);
  if (j.maxA > 2.5) fail(`camera |dv| ${j.maxA.toFixed(2)} px/f^2 at f${j.at}`);
  const movers: [string, (f: number) => P2][] = [
    ["mako nose", (f) => toScreen(f, makoAt(f).nose, MAKO_YC)],
    ["navy nose", (f) => toScreen(f, navyAt(f).nose, NAVY_YC)],
    ["stack top", (f) => toScreen(f, STACK_X, -navyCol(f))],
    ["bar top", (f) => toScreen(f, BAR_X, -makoCol(f))],
  ];
  for (const [name, fn] of movers) {
    for (let f = 1; f < DURATION; f++) {
      const a = fn(f - 1);
      const b = fn(f);
      const v = Math.hypot(b.x - a.x, b.y - a.y);
      if (v > 45 && b.x > -20 && b.x < 1100)
        fail(`${name} moves ${v.toFixed(1)} px on f${f}`);
    }
  }
  const BANDS = [
    [1080, 1250],
    [1360, 1460],
  ];
  const clash = (b: { y0: number; y1: number }) =>
    BANDS.some(([a0, a1]) => b.y1 > a0 - 2 && b.y0 < a1 + 2);
  for (let f = 0; f < DURATION; f++) {
    const t = textBoxes(f);
    if (clash(t.labels)) fail(`a plinth label in a caption band on f${f}`);
    if (f >= NUM50_IN && clash(t.n50))
      fail(`"$50K" in a caption band on f${f}`);
    if (f >= NUM5M_IN && clash(t.n5)) fail(`"~$5M" in a caption band on f${f}`);
    if (f >= NUM5M_IN && (t.n5.x0 < 24 || t.n5.x1 > 1056))
      fail(`"~$5M" near the frame edge on f${f}`);
    if (f >= 243 && (t.n5.y0 < 110 || t.labels.y1 > 1035))
      fail(
        `the end composition is off its margins on f${f} (~$5M top ${t.n5.y0.toFixed(1)}, labels end ${t.labels.y1.toFixed(1)})`,
      );
  }
}
