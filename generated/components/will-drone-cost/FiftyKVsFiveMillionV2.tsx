import React, { useId } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { camJerk } from "../kits/dwarkesh/outgrowShared";
import {
  DepthGroup,
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
  METRIC,
  Numeral,
  SPACE,
  TRACK,
  TYPE,
  labelWidth,
  numeralWidth,
} from "../kits/cheeky-pint/stoutShared";

// ===========================================================================
// FiftyKVsFiveMillionV2 — cut 3 of the Cheeky Pint S4E02 clip "will - $50k drone vs $5m navy drone" (Will
// O'Brien, Ulysses), the cold-review improvement loop on the delivered FiftyKVsFiveMillion (realistic underwater
// look, oceanShared.tsx). 1080x1920, 23.976 fps, opaque.
//
// CHECK LINE: "Ulysses' underwater drone costs about $50K; the Navy's usual one costs roughly a hundred times
// as much — one gold bar against a tower of a hundred of the same bar."
//
// THE MOTION (finish pass): two weathered plinths on the seabed, each with a stone pedestal standing BEHIND it
// (set back ~0.9 m: a touch smaller, a touch of fog). The real Mako cruises in and settles on its plinth; its
// ONE gold ingot rises out of the top of its pedestal and "$50K" comes up out of the capstone in front of it. On
// "For contrast" the camera eases back and the Mk 18 Mod 2 Kingfish cruises in, parked by "most" (f 107).
// From f 120 identical bars sink out of the bright water above, straight down their column's lanes onto the
// Navy's pedestal, row after row in ONE even rhythm that speeds up gradually; each row's landing dips the Navy
// side ~2 px and puffs a little silt, while the camera tilts up with the stack. The 100th lands on "order"
// (f 224) with the big puff, and on "$5" (f 231) "~$5M" comes up from behind the tower's top, centred on it. The
// lone Ulysses bar never moves: it is the yardstick. Labels are fully opaque, revealed only by real edges.
// Amber = money (the gold and its glow).
//
// SEQUENCE 34.034-44.711 s: slot 256 f (the sequence ends there) + a 16-frame living tail = 272.
// ONSETS (f): if 1 · working 7 · navy 20 · we can sell them 25-34 · for 38 · as cheap as 47-63 · $50,000 66-77 ·
// for contrast 82-87 · the most common 102-116 · like 126 · autonomous underwater vehicle 132-152 · that the
// U.S. Navy 166-192 · is buying today 195-203 · is like somewhere on the order of maybe 207-229 · $5 231 ·
// million 239.
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
// plinths' top surface is y = 0 (up is negative); the seabed is y = PLINTH_H. Plinths and vehicles stand on
// z = 0; the money pedestals stand on the seabed at z = Z_BACK, behind them.
// ===========================================================================
const PLINTH_H = 66;
const TOP = 5;
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
const HOR = 900;
/** The money pedestals' depth (world px, - = farther): ~0.93 m behind the vehicles. */
const Z_BACK = -160;
const S_BACK =
  (SCENE_GOLD.focusM * SCENE_GOLD.pxPerM) /
  (SCENE_GOLD.focusM * SCENE_GOLD.pxPerM - Z_BACK);
/** One $50K gold ingot in 3/4: a trapezoid front face (w at the foot, top at its top edge, h tall) and the top
 *  face receding above it (back width, depth). The one drawing for the lone bar and all 100 in the stack. */
export const BAR = { w: 76, top: 66, h: 28, back: 58, d: 9 } as const;
const BAR_TOTAL = BAR.h + BAR.d;
export const COLS = 5;
export const ROWS = 20;
const PITCH = { x: 80, y: BAR.h } as const;
const STACK_W = (COLS - 1) * PITCH.x + BAR.w; // 336
const PAD = 10;
const TILE_GAP = 20;
const MAKO_L = 345;
const MAKO_D = MAKO_L / 11;
const NAVY = { L: 560, D: 56 } as const;
const MAKO_SADDLE = 16;
const NAVY_SADDLE = 14;
const X0 = 540 - (2 * PAD + MAKO_L + TILE_GAP + 2 * PAD + NAVY.L) / 2;
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
/** Plinth plates: cream Söhne Kräftig caps on a dark inset plate (world px = screen px at the end). */
const MARK_PX = 54;
const SHIELD_H = 46;
const LABEL_Y = TOP + 26;

// ===========================================================================
// THE CAMERA (oceanShared's house follower, pre-rolled). The opening holds the Mako a little right of centre
// so the Navy's plinth and pedestal stay just off the right edge until the pull-back reveals them. The end
// framing is 10 % larger than k 1 (the plinths reach to ~10 px from the frame's edges).
// ===========================================================================
const K_OPEN = 2.3;
const K_CLOSE = 2.37;
const K_END = 1.04;
const FLOOR_OPEN = 925;
const FLOOR_PAIR = 900;
const FLOOR_END = 966;
const CAM_X_OPEN = 206;
const camY = (floor: number, k: number) => -(floor - 960) / k;
const GLIDES: Glide[] = [
  { f0: -24, f1: 46, k: K_OPEN * 1.015, warp: 1 },
  {
    f0: 40,
    f1: 84,
    dy: camY(FLOOR_OPEN, K_CLOSE) - camY(FLOOR_OPEN, K_OPEN),
    k: K_CLOSE,
    warp: 1,
  },
  // "for contrast": ease back over the pair as the Navy arrives
  {
    f0: 82,
    f1: 122,
    dx: X_LAYOUT - CAM_X_OPEN,
    dy: camY(FLOOR_PAIR, K_END) - camY(FLOOR_OPEN, K_CLOSE),
    k: K_END,
    warp: 1,
  },
  // the cascade: tilt up with the growing stack, settling on the whole composition
  {
    f0: 150,
    f1: 230,
    dy: camY(FLOOR_END, K_END) - camY(FLOOR_PAIR, K_END),
    warp: 1.1,
  },
  // the living hold: a slow push about the composition's middle
  {
    f0: 228,
    f1: 300,
    dy: -((560 - 960) / K_END) * (1 / 1.008 - 1),
    k: K_END * 1.008,
    warp: 1,
  },
];
const CLOCK = makeClockCam(
  { x: CAM_X_OPEN, y: camY(FLOOR_OPEN, K_OPEN), k: K_OPEN },
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
const swayAt = (f: number) => ({
  x: 3 * Math.sin(f / 23),
  y: 5 * Math.sin(f / 19),
});
const P_FOCUS = SCENE_GOLD.focusM * SCENE_GOLD.pxPerM;
const scaleAt = (z: number) => P_FOCUS / (P_FOCUS - z);
/** World (x, y) at depth z -> screen, as the stage draws it (with its sway). */
const toScreen = (f: number, x: number, y: number, z = 0) => {
  const c = camAt(f);
  const sw = swayAt(f);
  const s = scaleAt(z);
  const X = 540 + (x - c.x) * c.k + sw.x;
  const Y = 960 + (y - c.y) * c.k + sw.y;
  return { x: 540 + s * (X - 540), y: HOR + s * (Y - HOR) };
};
/** Screen y -> world y at depth z (frame f). */
const worldYAt = (f: number, sy: number, z: number) => {
  const c = camAt(f);
  return ((sy - HOR) / scaleAt(z) + HOR - 960 - swayAt(f).y) / c.k + c.y;
};
/** The local y (at depth Z_BACK) that lands `gap` screen px above a z = 0 height y0, in the END framing. */
const backYAbove = (y0: number, gap: number) => {
  const target = FLOOR_END + y0 * K_END - gap;
  return ((target - HOR) / S_BACK + HOR - FLOOR_END) / K_END;
};
/** The pedestals' tops (local y at Z_BACK): the money stands ~36 screen px clear above each hull. */
const MAKO_STAND_TOP = backYAbove(-(MAKO_SADDLE + MAKO_D), 36);
const NAVY_STAND_TOP = backYAbove(-(NAVY_SADDLE + NAVY.D), 36);
const STAND_W_MAKO = 240; // wide enough to hide "$50K" before it comes up over its capstone
const STAND_W_NAVY = STACK_W + 56;

// ===========================================================================
// TIMING
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
const NAVY_RUN: Run = { land: 107, brake: 26, v: 12, hover: 10, settle: 12 };
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
/** The Mako's one bar rises out of the top of its pedestal (f 47-67), out of the slot already moving. */
export const BAR_F = [47, 67] as const;
const riseFrac = (u: number) => {
  const a = 0.3;
  const x = clamp01(u);
  const w = 1 - x;
  return (
    (((1 + a) * (1 - w * w * w)) / 3 - (1 - w * w * w * w) / 4) /
    ((1 + a) / 3 - 1 / 4)
  );
};
const makoBarRise = (f: number) =>
  BAR_TOTAL * riseFrac((f - BAR_F[0]) / (BAR_F[1] - BAR_F[0]));

// --- the cascade: 100 identical bars falling from the light above onto the Navy's pedestal ----------------
/** The landing order: row by row from the bottom, left to right in each row. */
const SLOT_OF = Array.from({ length: COLS * ROWS }, (_, i) => ({
  row: Math.floor(i / COLS),
  col: i % COLS,
}));
/** Landing frames: ONE even, accelerating build. Row r lands at ROW_LAND[r]: the gaps shrink smoothly from
 *  ~8.7 f to ~2.2 f (no switch from trickle to flood); within a row the five land left to right a beat apart.
 *  The 100th lands on "order" (f 224) so the payoff holds before "$5". */
const FIRST_LAND = 120;
const LAST_LAND = 224;
const ROW_STAGGER = 0.15; // frames between neighbours within a row (left to right)
const ROW_LAND: number[] = Array.from({ length: ROWS }, (_, r) => {
  const x = r / (ROWS - 1);
  const g = lerp(x, 1 - (1 - x) * (1 - x), 0.6);
  return FIRST_LAND + (LAST_LAND - (COLS - 1) * ROW_STAGGER - FIRST_LAND) * g;
});
const LAND: number[] = Array.from(
  { length: COLS * ROWS },
  (_, i) => ROW_LAND[Math.floor(i / COLS)] + (i % COLS) * ROW_STAGGER,
);
/** The weight of each row landing: the Navy's plinth, vehicle, pedestal and stack dip ~1.8 screen px and recover. */
const DIP_PX = 1.8;
const dipAt = (f: number) => {
  let d = 0;
  for (const r of ROW_LAND) {
    const t = f - (r + (COLS - 1) * ROW_STAGGER);
    if (t <= 0 || t >= 7) continue;
    d = Math.max(
      d,
      t < 1.5 ? smoothstep(t / 1.5) : 1 - smoothstep((t - 1.5) / 5.5),
    );
  }
  return DIP_PX * d;
};
/** Where a bar lands (bottom-centre of its front face), local coords at Z_BACK. */
const slotAt = (i: number): P2 => ({
  x: STACK_X + (SLOT_OF[i].col - (COLS - 1) / 2) * PITCH.x,
  y: NAVY_STAND_TOP - SLOT_OF[i].row * PITCH.y,
});
/** Fall speeds (local px per frame): the first bars sink slowly (the eye follows each one down), the
 *  downpour fast. Every bar falls straight down its column's lane from just above the frame's top edge. */
/** (entry speeds in SCREEN px per frame; converted with the camera at each bar's launch) */
const SPEED_PX = Array.from({ length: COLS * ROWS }, (_, i) =>
  lerp(40, 60, smoothstep(Math.floor(i / COLS) / 8)),
);
/** The fall's shape: a constant sink easing into its seat (the mean speed is 1 / FALL_MEAN of the entry speed). */
const fallE = (u: number) => lerp(u, 1 - (1 - u) * (1 - u), 0.4);
const FALL_MEAN = 1.4;
const FALLS = LAND.map((land, i) => {
  // solve the launch so the bar starts at screen y -60 (iterate: the camera moves)
  let launch = land - 20;
  let y0 = 0;
  for (let it = 0; it < 8; it++) {
    y0 = worldYAt(launch, -44, Z_BACK);
    const speed = SPEED_PX[i] / (camAt(launch).k * S_BACK);
    launch = land - ((slotAt(i).y - y0) / speed) * FALL_MEAN;
  }
  return { launch, y0 };
});
const LAUNCH = FALLS.map((F) => F.launch);
/** A bar at frame f: null before it enters; `landed` once it sits in the stack. */
export const copyAt = (i: number, f: number) => {
  if (f < LAUNCH[i]) return null;
  const u = clamp01((f - LAUNCH[i]) / (LAND[i] - LAUNCH[i]));
  const T = slotAt(i);
  const y = lerp(FALLS[i].y0, T.y, fallE(u));
  // the last one seats with a tiny settle
  const q = clamp01((f - LAND[i]) / 7);
  const settle =
    i === COLS * ROWS - 1 && f > LAND[i]
      ? 2.2 * Math.sin(Math.PI * q) * (1 - q)
      : 0;
  return { x: T.x, y: y + settle, landed: u >= 1 };
};
/** The stack's top (local y) at frame f: the highest landed row's top face. */
export const stackTopAt = (f: number) => {
  let top = NAVY_STAND_TOP;
  for (let i = 0; i < COLS * ROWS; i++)
    if (f >= LAND[i]) top = Math.min(top, slotAt(i).y - BAR_TOTAL);
  return top;
};
const NUM50_IN = 64; // "$50K" comes up over the Mako pedestal's capstone f 64-80
const NUM5M_IN = 231; // "~$5M" comes up from behind the finished tower's top f 231-245 ("$5")
const NUM50_F = 16;
const NUM5M_F = 14;
const PUFF_F = LAST_LAND;
/** The tower's top row: its front face's top edge (local y). */
const STACK_FRONT_TOP = NAVY_STAND_TOP - (ROWS - 1) * PITCH.y - BAR.h;
const PX_5M = TYPE.SECONDARY;
/** "~$5M": centred ON the tower's top, a value gap above its top face. */
const n5Spot = (k: number) => ({
  x: STACK_X,
  y: STACK_FRONT_TOP - BAR.d - SPACE.VALUE / k,
});
const n50Spot = (k: number) => ({
  x: BAR_X,
  y: MAKO_STAND_TOP - BAR_TOTAL - SPACE.VALUE / k,
});

// ===========================================================================
// MATERIALS (realistic, warm-graded)
// ===========================================================================
const STONE = {
  top: "#7A7062",
  hi: "#6A6052",
  mid: "#4E453B",
  lo: "#3A322A",
  foot: "#2C251F",
  plate: "#211B15",
} as const;
const GREY = {
  hi: "#D2CFC2",
  a: "#B3B1A5",
  b: "#8F8E83",
  lo: "#5E5D55",
  deep: "#3E3D38",
  band: "#262320",
  fin: "#7E4A30",
} as const;
const GOLD = {
  deep: "#6E3F06",
  lo: "#A8620A",
  mid: "#E09A12",
  hi: "#FFC93D",
  spec: "#FFF1C2",
  top: "#FFD970",
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
// THE GOLD: one 3/4 ingot drawing for the lone bar and every copy (amber = money)
// ===========================================================================
/** The ingot's paths, (x, yb) = the bottom-centre of its front face. */
const ingot = (x: number, yb: number) => {
  const { w, top, h, back, d } = BAR;
  const y1 = yb - h;
  const front = poly([
    { x: x - w / 2, y: yb },
    { x: x + w / 2, y: yb },
    { x: x + top / 2, y: y1 },
    { x: x - top / 2, y: y1 },
  ]);
  const topFace = poly([
    { x: x - top / 2, y: y1 },
    { x: x + top / 2, y: y1 },
    { x: x + back / 2, y: y1 - d },
    { x: x - back / 2, y: y1 - d },
  ]);
  const outline = poly([
    { x: x - w / 2, y: yb },
    { x: x + w / 2, y: yb },
    { x: x + top / 2, y: y1 },
    { x: x + back / 2, y: y1 - d },
    { x: x - back / 2, y: y1 - d },
    { x: x - top / 2, y: y1 },
  ]);
  return { front, topFace, outline, y1 };
};
/** The ingot's gradients (one set per frame; userSpace per bar is not needed: objectBoundingBox). */
const GoldDefs: React.FC<{ id: string }> = ({ id }) => (
  <defs>
    <linearGradient id={`${id}f`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor={GOLD.hi} />
      <stop offset="0.16" stopColor={GOLD.spec} />
      <stop offset="0.3" stopColor={GOLD.hi} />
      <stop offset="0.62" stopColor={GOLD.mid} />
      <stop offset="0.9" stopColor={GOLD.lo} />
      <stop offset="1" stopColor={GOLD.deep} />
    </linearGradient>
    <linearGradient id={`${id}t`} x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stopColor={GOLD.spec} />
      <stop offset="1" stopColor={GOLD.top} />
    </linearGradient>
    <linearGradient id={`${id}e`} x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor={GOLD.deep} stopOpacity="0.6" />
      <stop offset="0.16" stopColor={GOLD.deep} stopOpacity="0" />
      <stop offset="0.84" stopColor={GOLD.deep} stopOpacity="0" />
      <stop offset="1" stopColor={GOLD.deep} stopOpacity="0.7" />
    </linearGradient>
  </defs>
);
const Ingot: React.FC<{
  x: number;
  yb: number;
  id: string;
  seed: number;
  px: number;
}> = ({ x, yb, id, seed, px }) => {
  const g = ingot(x, yb);
  return (
    <g>
      <path d={g.front} fill={`url(#${id}f)`} />
      <path d={g.front} fill={`url(#${id}e)`} />
      <path d={g.topFace} fill={`url(#${id}t)`} />
      {/* the stamped panel, the bright arris between the faces, a glint */}
      <rect
        x={f2(x - 16)}
        y={f2(g.y1 + 8)}
        width={32}
        height={12}
        rx={1.5}
        fill="none"
        stroke={GOLD.lo}
        strokeOpacity={0.55}
        strokeWidth={f2(Math.max(0.8, 1.1 * px))}
      />
      <path
        d={`M${f2(x - BAR.top / 2 + 1)} ${f2(g.y1)}H${f2(x + BAR.top / 2 - 1)}`}
        stroke={GOLD.spec}
        strokeWidth={f2(Math.max(1.2, 1.8 * px))}
      />
      <ellipse
        cx={f2(x - 12 + 22 * hash01(seed + 3))}
        cy={f2(g.y1 - BAR.d / 2)}
        rx={8}
        ry={1.8}
        fill="#FFFFFF"
        opacity={0.3 + 0.2 * hash01(seed + 9)}
        style={{ filter: "blur(1.2px)" }}
      />
    </g>
  );
};
/** A set of ingots (any number), one bloom pass, drawn in the order given (later on top). */
const Ingots: React.FC<{ bars: { x: number; yb: number; seed: number }[] }> = ({
  bars,
}) => {
  const o = useOcean();
  const uid = uidOf(useId());
  if (!bars.length) return null;
  const px = 1 / o.a;
  return (
    <g>
      <GoldDefs id={uid} />
      <g style={{ filter: bloomFilter(o.a) }}>
        {bars.map((b) => (
          <path key={b.seed} d={ingot(b.x, b.yb).outline} fill={GOLD.mid} />
        ))}
      </g>
      {bars.map((b) => (
        <Ingot key={b.seed} x={b.x} yb={b.yb} id={uid} seed={b.seed} px={px} />
      ))}
    </g>
  );
};
/** The warm glow of gold in the water (screen), over a box of gold (local coords). */
const GoldGlow: React.FC<{ x: number; y0: number; y1: number; w: number }> = ({
  x,
  y0,
  y1,
  w,
}) => {
  const uid = uidOf(useId());
  const h = Math.max(0, y1 - y0);
  if (h < 0.5) return null;
  const r = Math.max(70, 0.75 * Math.max(w, h));
  const cy = (y0 + y1) / 2;
  return (
    <g style={{ mixBlendMode: "screen" }}>
      <defs>
        <radialGradient
          id={`${uid}w`}
          gradientUnits="userSpaceOnUse"
          cx={f2(x)}
          cy={f2(cy)}
          r={f2(r)}
        >
          <stop offset="0" stopColor={OCEAN.amberTop} stopOpacity="0.3" />
          <stop offset="0.5" stopColor={OCEAN.amberFoot} stopOpacity="0.11" />
          <stop offset="1" stopColor={OCEAN.amberFoot} stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse
        cx={f2(x)}
        cy={f2(cy)}
        rx={f2(r * 1.2)}
        ry={f2(r * 1.05 + h * 0.15)}
        fill={`url(#${uid}w)`}
      />
    </g>
  );
};

// ===========================================================================
// THE PEDESTAL (behind each vehicle, at Z_BACK): a stone column on the seabed with a capstone; the gold stands
// on its top. Its foot is hidden by the plinth in front.
// ===========================================================================
const Pedestal: React.FC<{
  cx: number;
  w: number;
  top: number;
  glow: number;
  seed: number;
}> = ({ cx, w, top, glow, seed }) => {
  const o = useOcean();
  const uid = uidOf(useId());
  const px = 1 / o.a;
  const fog = fogAt(o.scene, o.distM) + 0.08;
  const capH = 12;
  const capOver = 8;
  const x0 = cx - w / 2;
  const blot = Array.from({ length: 5 }, (_, i) => ({
    x: x0 + w * (0.1 + 0.8 * hash01(seed + i * 2.3)),
    y:
      top +
      capH +
      (PLINTH_H - top - capH) * (0.2 + 0.7 * hash01(seed + i * 4.1)),
    r: 12 + 20 * hash01(seed + i * 6.7),
  }));
  return (
    <g>
      <InFog amount={fog}>
        <defs>
          <linearGradient id={`${uid}s`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={STONE.lo} />
            <stop offset="0.3" stopColor={STONE.hi} />
            <stop offset="0.7" stopColor={STONE.mid} />
            <stop offset="1" stopColor={STONE.foot} />
          </linearGradient>
          <clipPath id={`${uid}c`}>
            <rect
              x={f2(x0)}
              y={f2(top + capH)}
              width={f2(w)}
              height={f2(PLINTH_H - top - capH)}
            />
          </clipPath>
        </defs>
        {/* the column */}
        <rect
          x={f2(x0)}
          y={f2(top + capH)}
          width={f2(w)}
          height={f2(PLINTH_H - top - capH)}
          fill={`url(#${uid}s)`}
        />
        <g clipPath={`url(#${uid}c)`}>
          {blot.map((b, i) => (
            <ellipse
              key={i}
              cx={f2(b.x)}
              cy={f2(b.y)}
              rx={f2(b.r)}
              ry={f2(b.r * 0.6)}
              fill={i % 2 ? STONE.foot : STONE.hi}
              opacity={0.3}
              style={{ filter: `blur(${f2(b.r * 0.5)}px)` }}
            />
          ))}
          <rect
            x={f2(x0)}
            y={f2(top + capH)}
            width={f2(w)}
            height={10}
            fill={OCEAN.shadow}
            opacity={0.45}
            style={{ filter: "blur(4px)" }}
          />
        </g>
        {/* the capstone: front face + top face (seen a little from above) */}
        <path
          d={poly([
            { x: x0 - capOver + 4, y: top - 6 },
            { x: x0 + w + capOver - 4, y: top - 6 },
            { x: x0 + w + capOver, y: top },
            { x: x0 - capOver, y: top },
          ])}
          fill={STONE.top}
        />
        <rect
          x={f2(x0 - capOver)}
          y={f2(top)}
          width={f2(w + 2 * capOver)}
          height={capH}
          fill={STONE.hi}
        />
        <path
          d={`M${f2(x0 - capOver + 2)} ${f2(top + px)}H${f2(x0 + w + capOver - 2)}`}
          stroke={OCEAN.cream}
          strokeOpacity={0.5}
          strokeWidth={f2(Math.max(1.2, 1.6 * px))}
        />
        <rect
          x={f2(x0 - capOver)}
          y={f2(top + capH - 3)}
          width={f2(w + 2 * capOver)}
          height={3}
          fill={STONE.foot}
          opacity={0.6}
        />
      </InFog>
      {glow > 0.01 ? (
        <g style={{ mixBlendMode: "screen" }} opacity={f2(glow)}>
          <ellipse
            cx={f2(cx)}
            cy={f2(top - 2)}
            rx={f2(w * 0.55)}
            ry={10}
            fill={OCEAN.amberTop}
            opacity={0.4}
            style={{ filter: "blur(8px)" }}
          />
        </g>
      ) : null}
    </g>
  );
};

/** A silt puff where gold seats on the capstone: soft warm discs pushed out along it, drifting and settling.
 *  `s` scales it (each row's landing: a small one; the last bar: the big one). */
const SiltPuff: React.FC<{
  cx: number;
  y: number;
  w: number;
  t: number;
  s?: number;
  seed?: number;
}> = ({ cx, y, w, t, s: sz = 1, seed = 0 }) => {
  if (t <= 0 || t >= 1) return null;
  const parts = Array.from({ length: 22 }, (_, i) => {
    const side = i % 2 ? 1 : -1;
    const h = i + seed * 31;
    const sp = 0.4 + 0.6 * hash01(h + 5);
    const reach = (40 + 70 * sp) * sz * (1 - Math.pow(1 - t, 2.4));
    return {
      x: cx + side * (w / 2 - 20 + 40 * hash01(h + 11) + reach),
      y:
        y -
        4 -
        (10 + 30 * hash01(h + 17)) *
          sz *
          Math.sin(Math.PI * Math.min(1, t * 1.3)) +
        14 * t * t,
      r: (7 + 12 * hash01(h + 23) + 16 * t) * Math.sqrt(sz),
      a: 0.5 * (1 - t) * Math.min(1, t * 8),
    };
  });
  return (
    <g style={{ filter: "blur(5px)" }}>
      {parts.map((p, i) => (
        <circle
          key={i}
          cx={f2(p.x)}
          cy={f2(p.y)}
          r={f2(p.r)}
          fill="#D9C29A"
          opacity={f2(p.a)}
        />
      ))}
    </g>
  );
};

// ===========================================================================
// THE PLINTH (z = 0, in front): weathered block, cradle saddles, a dark plate with the cream name
// ===========================================================================
const ULYSSES_TEXT = "ULYSSES";
const NAVY_TEXT = "U.S. NAVY";
const PlinthPlate: React.FC<{ kind: "ulysses" | "navy"; cx: number }> = ({
  kind,
  cx,
}) => {
  const o = useOcean();
  const px = 1 / o.a;
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
  const sw = (SHIELD_H * 84) / 100;
  const gap = 14;
  const tw = labelWidth(kind === "navy" ? NAVY_TEXT : ULYSSES_TEXT, MARK_PX);
  const total = kind === "navy" ? tw : sw + gap + tw;
  const x0 = cx - total / 2;
  const padX = 18;
  const py0 = LABEL_Y - cap / 2 - 9;
  const py1 = LABEL_Y + cap / 2 + 9;
  const sc = SHIELD_H / 100;
  return (
    <g>
      {/* the plate: a dark inset with a lit lower lip */}
      <rect
        x={f2(x0 - padX)}
        y={f2(py0)}
        width={f2(total + 2 * padX)}
        height={f2(py1 - py0)}
        rx={3}
        fill={STONE.plate}
        opacity={0.88}
      />
      <path
        d={`M${f2(x0 - padX + 3)} ${f2(py1 - px)}H${f2(x0 + total + padX - 3)}`}
        stroke={OCEAN.cream}
        strokeOpacity={0.25}
        strokeWidth={f2(Math.max(1, 1.4 * px))}
      />
      {kind === "ulysses" ? (
        <g
          transform={`translate(${f2(x0)} ${f2(LABEL_Y - SHIELD_H / 2 - 0.5 * sc)}) scale(${f6(sc)})`}
          fill={OCEAN.cream}
        >
          <path d={ULYSSES_D[1]} fillRule="evenodd" />
        </g>
      ) : null}
      <text
        x={f2(kind === "navy" ? x0 : x0 + sw + gap)}
        y={f2(base)}
        {...textProps}
      >
        {kind === "navy" ? NAVY_TEXT : ULYSSES_TEXT}
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
const Plinth: React.FC<{
  x0: number;
  x1: number;
  kind: "ulysses" | "navy";
  markX: number;
  seed: number;
}> = ({ x0, x1, kind, markX, seed }) => {
  const o = useOcean();
  const uid = uidOf(useId());
  const px = 1 / o.a;
  const w = x1 - x0;
  const fog = fogAt(o.scene, o.distM);
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
      <ellipse
        cx={f2((x0 + x1) / 2)}
        cy={f2(PLINTH_H + 2)}
        rx={f2(w * 0.56)}
        ry={9}
        fill={OCEAN.shadow}
        opacity={0.55}
        style={{ filter: "blur(6px)" }}
      />
      <InFog amount={fog * 0.8}>
        <path
          d={poly([
            { x: x0 + 4, y: -TOP },
            { x: x1 - 4, y: -TOP },
            { x: x1, y: TOP },
            { x: x0, y: TOP },
          ])}
          fill={`url(#${uid}t)`}
        />
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
          <rect
            x={f2(x0)}
            y={f2(PLINTH_H - 12)}
            width={f2(w)}
            height={12}
            fill="#2F2B20"
            opacity={0.5}
            style={{ filter: "blur(4px)" }}
          />
        </g>
        <path
          d={`M${f2(x0 + 3)} ${f2(TOP + px)}H${f2(x1 - 3)}`}
          stroke={OCEAN.cream}
          strokeOpacity={0.55}
          strokeWidth={f2(Math.max(1.2, 1.6 * px))}
        />
      </InFog>
      <PlinthPlate kind={kind} cx={markX} />
    </g>
  );
};
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
            cy={1}
            rx={f2(s.wb * 0.55)}
            ry={2.5}
            fill={OCEAN.shadow}
            opacity={0.5}
            style={{ filter: "blur(2px)" }}
          />
        </g>
      ))}
    </InFog>
  );
};

/** A figure revealed only by a real occluding edge: fully opaque, drawn BEHIND the object it comes out of, it
 *  rises from below that object's top edge (wholly hidden at the start) to its place, with a small settle in
 *  scale. No opacity ramp, no blur, no mask line in open water. */
const ArrivingNumeral: React.FC<{
  x: number;
  y: number;
  text: string;
  px: number;
  edge: number;
  t: number;
  /** clip the figure to above `edge` (when it is drawn IN FRONT of what stands on that edge) */
  clip?: boolean;
}> = ({ x, y, text, px, edge, t, clip = false }) => {
  const o = useOcean();
  if (t <= 0) return null;
  const k = o.a;
  const u = clamp01(t);
  const e = 1 - (1 - u) * (1 - u) * (1 - u);
  // start: the figure's top (the "$"'s top) just under the occluding edge
  const y0 = edge + (METRIC.dollarTop * px) / k + 2;
  const yy = lerp(y0, y, e);
  const sc = lerp(0.95, 1, smoothstep(u));
  const cy = yy - (METRIC.fig * px) / k / 2;
  const cid = `fkn${Math.round(edge * 100)}`;
  return (
    <g clipPath={clip ? `url(#${cid})` : undefined}>
      {clip ? (
        <defs>
          <clipPath id={cid}>
            <rect
              x={f2(x - 4000)}
              y={f2(edge - 8000)}
              width={8000}
              height={8000}
            />
          </clipPath>
        </defs>
      ) : null}
      <g
        transform={`translate(${f6(x)} ${f6(cy)}) scale(${f6(sc)}) translate(${f6(-x)} ${f6(-cy)})`}
        style={{
          filter: `drop-shadow(0 ${f2(3 / k)}px ${f2(14 / k)}px rgba(${OCEAN.vignette},0.6))`,
        }}
      >
        <Numeral x={x} y={yy} k={k} px={px} text={text} anchor="middle" />
      </g>
    </g>
  );
};

// ===========================================================================
const World: React.FC<{ f: number }> = ({ f }) => {
  const o = useOcean();
  const k = o.a;
  const mk = makoAt(f);
  const nv = navyAt(f);
  const mkC = { x: mk.nose + MAKO_L / 2, y: MAKO_YC - mk.hover };
  const rise = makoBarRise(f);
  // the cascade: bars in the stack (landed) and still falling
  const landed: { x: number; yb: number; seed: number }[] = [];
  const flying: { x: number; yb: number; seed: number }[] = [];
  for (let i = 0; i < COLS * ROWS; i++) {
    const c = copyAt(i, f);
    if (!c) continue;
    (c.landed ? landed : flying).push({ x: c.x, yb: c.y, seed: 100 + i });
  }
  const sTop = stackTopAt(f);
  const puffT = (f - PUFF_F) / 34;
  const px50 = lerp(TYPE.HERO, TYPE.SECONDARY, zoomOut(k));
  const k50 = k * S_BACK; // screen px per local px in the pedestals' plane
  const n5 = n5Spot(k50);
  const n50 = n50Spot(k50);
  const rowsDone = Math.floor(landed.length / COLS);
  const dipF = dipAt(f) / k; // the weight of a row landing (screen px -> local, front plane)
  const dipB = dipAt(f) / k50; // ... and in the pedestals' plane
  return (
    <>
      {/* behind: the pedestals and their gold (set back, a touch smaller, a touch of water) */}
      <DepthGroup z={Z_BACK}>
        <Pedestal
          cx={BAR_X}
          w={STAND_W_MAKO}
          top={MAKO_STAND_TOP}
          glow={clamp01(rise / 20)}
          seed={7}
        />
        <g transform={`translate(0 ${f6(dipB)})`}>
          <Pedestal
            cx={STACK_X}
            w={STAND_W_NAVY}
            top={NAVY_STAND_TOP}
            glow={clamp01(landed.length / 10)}
            seed={31}
          />
        </g>
        <GoldGlow
          x={BAR_X}
          y0={MAKO_STAND_TOP - rise}
          y1={MAKO_STAND_TOP}
          w={BAR.w}
        />
        <GoldGlow
          x={STACK_X}
          y0={sTop}
          y1={landed.length ? NAVY_STAND_TOP : sTop}
          w={STACK_W}
        />
        {/* the lone bar, rising out of the top of its pedestal (clipped at the capstone); it never moves again */}
        <defs>
          <clipPath id="fk2rise">
            <rect
              x={BAR_X - 200}
              y={MAKO_STAND_TOP - 400}
              width={400}
              height={400}
            />
          </clipPath>
        </defs>
        {rise > 0.05 ? (
          <g clipPath="url(#fk2rise)">
            <Ingots
              bars={[
                { x: BAR_X, yb: MAKO_STAND_TOP + BAR_TOTAL - rise, seed: 1 },
              ]}
            />
          </g>
        ) : null}
        {/* "$50K" comes up out of the Mako pedestal's capstone, in FRONT of the bar (no digit is ever behind the
            bar): clipped at the capstone's front edge, the stone it comes up out of */}
        <ArrivingNumeral
          x={n50.x}
          y={n50.y}
          text="$50K"
          px={px50}
          edge={MAKO_STAND_TOP}
          t={(f - NUM50_IN) / NUM50_F}
          clip
        />
        {/* "~$5M" comes up from behind the finished tower's top (drawn behind the stack and its dark-gold core) */}
        <ArrivingNumeral
          x={n5.x}
          y={n5.y}
          text="~$5M"
          px={PX_5M}
          edge={STACK_FRONT_TOP}
          t={(f - NUM5M_IN) / NUM5M_F}
        />
        <g transform={`translate(0 ${f6(dipB)})`}>
          {rowsDone > 0 ? (
            <rect
              x={f2(STACK_X - STACK_W / 2 + 3)}
              y={f2(NAVY_STAND_TOP - rowsDone * PITCH.y)}
              width={f2(STACK_W - 6)}
              height={f2(rowsDone * PITCH.y)}
              fill={GOLD.deep}
            />
          ) : null}
          <Ingots bars={landed} />
        </g>
        {ROW_LAND.map((r, i) => (
          <SiltPuff
            key={i}
            cx={STACK_X}
            y={NAVY_STAND_TOP}
            w={STACK_W}
            t={(f - r - (COLS - 1) * ROW_STAGGER) / 24}
            s={0.55}
            seed={i + 1}
          />
        ))}
        <SiltPuff
          cx={STACK_X}
          y={NAVY_STAND_TOP}
          w={STACK_W}
          t={puffT}
          s={1.15}
        />
        {/* the bars still falling, over the stack */}
        <Ingots bars={flying} />
      </DepthGroup>
      {/* in front: the plinths, cradles and vehicles */}
      <Plinth x0={MT.x0} x1={MT.x1} kind="ulysses" markX={BAR_X} seed={11} />
      <g transform={`translate(0 ${f6(dipF)})`}>
        <Plinth x0={NT.x0} x1={NT.x1} kind="navy" markX={STACK_X} seed={41} />
        <Saddles saddles={SADDLES_NAVY} />
        <Kingfish x0={nv.nose} yc={NAVY_YC - nv.hover} />
      </g>
      <Saddles saddles={SADDLES_MAKO} />
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
            style={{ filter: "blur(3px)" }}
          />
        ) : null,
      )}
      <UlyssesVehicle
        x={mkC.x}
        y={mkC.y}
        L={MAKO_L}
        facing={-1}
        tilt={0}
        frame={f}
        light={0}
      />
    </>
  );
};

const FiftyKVsFiveMillionV2: React.FC<Props> = () => {
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

export default FiftyKVsFiveMillionV2;

// ===========================================================================
// LOAD-TIME CHECKS
// ===========================================================================
/** Screen boxes of the text at frame f (with the stage's sway and the pedestals' depth). */
export const textBoxes = (f: number) => {
  const k = camAt(f).k;
  const kb = k * S_BACK;
  const px50 = lerp(TYPE.HERO, TYPE.SECONDARY, zoomOut(k));
  const s50 = n50Spot(kb);
  const b50 = toScreen(f, s50.x, s50.y, Z_BACK);
  const s5 = n5Spot(kb);
  const b5 = toScreen(f, s5.x, s5.y, Z_BACK);
  const w50 = numeralWidth("$50K", px50);
  const w5 = numeralWidth("~$5M", PX_5M);
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
      y0: b5.y - METRIC.dollarTop * PX_5M,
      y1: b5.y + METRIC.dollarDesc * PX_5M,
    },
    px50,
    w50,
    w5,
    kb,
    labels: { y0: face.y - cap / 2 - 9 * k, y1: face.y + cap / 2 + 9 * k },
  };
};
{
  const fail = (m: string) => {
    throw new Error(`FiftyKVsFiveMillionV2: ${m}`);
  };
  if (COLS * ROWS !== 100 || LAND.length !== 100)
    fail("the stack is not exactly 100 bars");
  if (Math.abs(LAND[99] - LAST_LAND) > 1e-6)
    fail(`the last copy lands on f${LAND[99].toFixed(2)}, not on "$5"`);
  for (let i = 1; i < 100; i++)
    if (LAND[i] < LAND[i - 1]) fail(`bar ${i} lands out of order`);
  if (LAND[0] < NAVY_RUN.land + 10)
    fail("the first bar lands before the Navy has settled");
  // the cascade's lanes: a bar never catches the one falling ahead of it in its column
  for (let i = 0; i < 100; i++) {
    for (let j2 = i + 1; j2 < 100; j2++) {
      if (SLOT_OF[j2].col !== SLOT_OF[i].col) continue;
      for (let f = LAUNCH[j2]; f < LAND[i]; f += 0.25) {
        const a = copyAt(i, f);
        const b = copyAt(j2, f);
        if (a && b && b.y > a.y - BAR_TOTAL)
          fail(`bar ${j2} catches bar ${i} in its lane on f${f.toFixed(2)}`);
      }
      break;
    }
  }
  // the occluders are wider than what they reveal (no edge in open water)
  for (let f = NUM50_IN; f <= NUM50_IN + NUM50_F; f++) {
    const t = textBoxes(f);
    const capW = (STAND_W_MAKO + 16) * t.kb;
    if (t.w50 > capW - 6)
      fail(
        `"$50K" (${t.w50.toFixed(0)} px) is wider than the capstone it comes over (${capW.toFixed(0)} px) on f${f}`,
      );
  }
  for (let f = NUM5M_IN; f <= NUM5M_IN + NUM5M_F; f++) {
    const t = textBoxes(f);
    const sw = (STACK_W - 6) * t.kb;
    if (t.w5 > sw - 4)
      fail(
        `"~$5M" (${t.w5.toFixed(0)} px) is wider than the tower it comes from (${sw.toFixed(0)} px) on f${f}`,
      );
  }
  const j = camJerk(CLOCK.track, DURATION);
  if (j.maxA > 2.5) fail(`camera |dv| ${j.maxA.toFixed(2)} px/f^2 at f${j.at}`);
  const movers: [string, (f: number) => P2][] = [
    ["mako nose", (f) => toScreen(f, makoAt(f).nose, MAKO_YC)],
    ["navy nose", (f) => toScreen(f, navyAt(f).nose, NAVY_YC)],
  ];
  // the singles (the eye follows each one down) stay under the guide; the cascade may run faster
  // the first rows' own sinking speed on screen (under this frame's camera; the camera is checked above)
  for (let i = 0; i < 10; i++) {
    for (let f = Math.ceil(LAUNCH[i]) + 1; f <= LAND[i]; f++) {
      const a = copyAt(i, f - 1);
      const b = copyAt(i, f);
      if (!a || !b) continue;
      const pa = toScreen(f, a.x, a.y, Z_BACK);
      const pb = toScreen(f, b.x, b.y, Z_BACK);
      const v = Math.hypot(pb.x - pa.x, pb.y - pa.y);
      if (v > 45 && pb.y > -20)
        fail(`bar ${i} sinks ${v.toFixed(1)} px on f${f}`);
    }
  }
  for (const [name, fn] of movers) {
    for (let f = 1; f < DURATION; f++) {
      const a = fn(f - 1);
      const b = fn(f);
      const v = Math.hypot(b.x - a.x, b.y - a.y);
      if (a.x < -900 || b.x < -900) continue;
      if (v > 45 && b.x > -20 && b.x < 1100 && b.y > -20)
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
    if (clash(t.labels)) fail(`a plinth plate in a caption band on f${f}`);
    if (f >= NUM50_IN + 4 && clash(t.n50))
      fail(`"$50K" in a caption band on f${f}`);
    if (f >= NUM5M_IN + 4 && clash(t.n5))
      fail(`"~$5M" in a caption band on f${f}`);
    if (f >= NUM5M_IN && (t.n5.x0 < 24 || t.n5.x1 > 1056))
      fail(`"~$5M" near the frame edge on f${f}`);
    if (f >= 243 && (t.n5.y0 < 200 || t.labels.y1 > 1035))
      fail(
        `the end composition is off its margins on f${f} (~$5M top ${t.n5.y0.toFixed(1)}, plates end ${t.labels.y1.toFixed(1)})`,
      );
  }
}
