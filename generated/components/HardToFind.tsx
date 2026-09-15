import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  CAM_LIFT,
  CAM_DAMP,
  CAM_STIFF,
  ICON_SHADOW_BLUR,
  ICON_SHADOW_OPACITY,
  ICON_SHADOW_Y,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  SQUIRCLE_RATIO,
  SQUIRCLE_SMOOTH,
  Vignette,
  camEase,
  clamp,
  clamp01,
  iconShadow,
  smoothstep,
  squirclePath,
  sway,
  worldTransform,
} from "./fieldShared";
import {
  CONTACT_SHADOW_OP,
  CONTACT_SHADOW_RX,
  CONTACT_SHADOW_RY,
  KRAFT_BASE,
  KRAFT_BLUR,
  KRAFT_DIM,
  KRAFT_SRC,
  KraftBackground,
} from "./d1Shared";
// The clip's shared module: the brand tiles (the Equifax wordmark knocked out
// of the house tile) and the leak (a breach shedding plain data dots out of a
// tile's bottom edge). Imported, never restated, never edited from here.
import { BrandTile, DataDot, EFX_REST, LEAK_FAST, leakDots } from "./equifaxShared";

export const FPS = 24;
// Christina, on the Equifax breach:
// "it's very hard to find that moment in the Equifax stock price chart"
//
// SRT span 0:11.160 -> 0:15.000 at 24fps.
// round((15.000 - 11.160) * 24) = round(3.840 * 24) = round(92.16) = 92 frames
// of speech, plus a 16 frame tail so the resolved state holds = 108.
export const DURATION = 108;

// Word onsets, in frames from the composition's start (= 11.160):
//   f0 it's · f1 very · f6 hard · f10 to · f13 find · f22 that · f30 moment
//   · f46 in · f52 the · f54 equifax · f65 stock · f74 price · f81 chart
//   · f92 end · tail to f108
//
// The inflections that actually bend the motion:
//   f2          — the Equifax tag starts down out of frame, tracking the head
//   f30 moment  — the tag lands on the line; the leak starts; the price falls
//   f38         — the camera lets go (the held breath f30-38 ends)
//   f42         — the head reaches the low, $92.98, and rests on it
//   f46 in      — the head leaves the cliff; nine years start to draw
//   f81 chart   — the camera is landed, the whole decade is on screen
//   f92 end     — speech ends; the leak alone runs to f108
//
// ---------------------------------------------------------------------------
// "Hard to find" — ONE MOTION: THE HEAD OF THE LINE TRAVELS RIGHT AND THE
// CAMERA LETS GO OF IT.
//
// There is one object in this cut and it is the Equifax stock price, drawn as
// one white line on the kraft with no axes, no grid, no labels and no second
// marker. The line IS the chart. The clip's own object — the Equifax brand tile
// from cut 1 — comes down onto the top of the cliff as "that moment", sits
// there with its bottom edge on the line for the rest of the cut, and leaks
// amber data dots out of its bottom edge. The six sessions of the breach are
// drawn in the accent once they exist, because the drop is the moment.
//
//   PHASE 1 · A CHART THAT HAS BEEN CLIMBING FOR YEARS (f0 -> f30)
//     REV 3 lifted the data limit: the line is now twenty years, 2006 -> 2026,
//     so the opening has a decade of rise to stand on instead of four months.
//     At f0 the stroke ALREADY EXISTS from 2006-09-14 (x 100) to the head at
//     2014-09-08 (x 451.28) — no draw-on, no fade, it is simply there — and
//     1,503 screen px of it are inside the frame, rising from the left edge at
//     screen (-2, 1483) to the head at (420, 1150). The head then climbs
//     2014-09-08 -> 2017-09-07, 132 world px of x carrying $78.81 -> $142.72,
//     and reaches the breach at f30 exactly.
//     The camera OPENS at k 2.30 and barely widens — 2.30 -> K_ROOM 2.28 — but
//     it FOLLOWS THE HEAD horizontally (REV 1's mechanism, unchanged), so the
//     climb is a rise across the frame rather than a line running off its right
//     edge: the head travels screen (420, 1150) -> (608, 843) while the drawn
//     box grows from 422 x 338 to 609 x 770. It lands on the anchor at f28, two
//     frames before "moment". The lens is already letting go before the cliff,
//     pauses on the cliff, then lets go all the way: one widening with a breath.
//     From f2 the Equifax tag descends from above the frame DIRECTLY ABOVE THE
//     HEAD and lands with its bottom-LEFT corner on the head's point at f30
//     exactly, so it stands at the top of the cliff without covering the climb;
//     its contact shadow fades in over the last six frames of that descent.
//
//   PHASE 2 · THE DROP (f30 -> f42, "moment")
//     The head falls the real six sessions — 142.72, 123.23, 113.12, 115.96,
//     98.99, 96.66, 92.98 — and that leg is laid in the accent as it goes. At
//     2.875 px/$ the cliff is 143.00 world px, 326 screen px at this zoom, and
//     it fits the brief's twelve frames: measured peak 44.1 px/frame. The camera
//     holds dead still f30-f38: the cut's one held breath, eight frames. The tag
//     stays where it landed, on the top of the cliff, and its leak (LEAK_FAST)
//     falls past the new leg from the frame it landed. The head then rests on
//     the low f42-f46, with the leak and the pull-back carrying the hold.
//
//   PHASE 3 · LET GO (f46 -> f92, "in the Equifax stock price chart")
//     The head leaves the low and draws nine more years: the Dec 2018 dip to
//     $90.00 — a notch of the same depth — the March 2020 dip, the climb to the
//     $307.13 all-time high in Aug 2024 and the fall back to $172.29. The camera
//     pulls back k 2.28 -> 1.00 on one move, landed by "chart". The tag shrinks
//     with the world into a small tag at the notch, its amber leak still
//     running, and the amber leg becomes one notch among several in twenty years
//     of chart.
//
//   TAIL (f92 -> f108)
//     k 1.00 on `sway`. The leak keeps falling: the only motion, so the eye is
//     led back to the notch it can barely find.
//
// DEVIATIONS FROM THE BRIEF, ALL ARGUED WHERE THEY ARE SET:
//   * the head is parametrised by a DAMPED ARC METRIC rather than by x — see
//     LAMBDA — and at twenty years the head's own frame-to-frame displacement is
//     THE CHART'S WEEKLY VOLATILITY, not a travel anyone authored. One trading
//     week is now 0.845 world px of x (1.9 screen px at k 2.3) while the mean
//     week moves the price 8 world px, so the head hops vertically inside a
//     two-pixel column. Measured maxima: climb 75.0 px/frame, run 220.9 — and
//     they do not move when LAMBDA is swept 1 to 12 (74.3 / 78.6 / 83.2 / 86.1 /
//     77.1 / 76.2 / 86.0), which is the proof that there is nothing to tune:
//     that number is the data, not the motion. The thing the eye follows is the
//     REVEAL FRONT, the horizontal rate at which ink appears, and that is 14.8
//     px/frame at its worst in the climb and 23.4 in the run. Only the DROP is a
//     head an eye can track — one object falling a clean cliff — and it is 44.1,
//     inside the cap, and stable across h (44.3 at h = 1/4).
//   * REV 3 FIXES A BUG REV 2 HID: the drop's hermite was handed the climb's
//     rate in METRIC units, and ds/dm is 1 on the weekly segment the climb ends
//     on but LAMBDA (6) on the cliff — a six-fold jump at the join that measured
//     95.4 px/frame on the first drop frame here. See DROP_V0.
//   * CLIMB_SLOW IS RETIRED (set to 0). It existed because REV 2 opened at
//     k 3.60 and finished the climb at 2.39, so the same world displacement cost
//     half again as many screen px at the top of the cut. REV 3 opens at 2.30
//     and lands at 2.28; there is no longer a gradient to pay for, and a flat
//     rate measures marginally BETTER (75.0 against 77.1). The dial is left in
//     place, at zero, so the shape can be brought back if the open is re-keyed.
//   * TAG_WARP IS 1.0, for the same reason: it bought 6 px/frame when the frame
//     was widening 3.60 -> 2.28 under the falling tile, and it COSTS 5 now
//     (39.3 at warp 1, 44.5 at 1.25). The tag still starts at f2 — the descent
//     is 324 world px from outside the frame and nothing pops in.
//   * the drop is 12 frames, the brief's own figure, allowed by the scan: 52.6
//     px/frame at T = 10, 47.5 at 11, 44.1 at 12. The beat does not move.
//   * the tag's descent starts f2, not the original brief's f22, and tracks the
//     head's x — see TAG_F0. Approved in REV 1.
//   * the breach is the tag's bottom-LEFT corner, not its centre — see TAG_X1.
//     Approved in REV 1.
//   * the pull-back is keyed f38-f78, not f44-f80 — see LETGO. The damper costs
//     six frames, and f38 is the frame the held breath ends. Approved in REV 1.
//   * THE PULL-BACK IS NOW ALMOST PURE ZOOM. Under the new mapping the breach
//     sits at x 583 on a chart centred at x 540, so CX_ROOM -> CX_WIDE is 8
//     world px and C_ROOM -> C_WIDE is 39, against REV 2's 326 and 238. The pan
//     warp (1.6) is kept but has almost nothing left to do; that is the
//     twenty-year picture already being nearly centred on the moment, not a move
//     that went missing.
//   * the head sits at screen (520, 1100) at f0, not the brief's approximate
//     (420, 1150) — see OPEN_SCREEN_X, where the five candidates are measured.
//     The head's screen x IS how much frame the drawn history has to fill, and
//     520 is the last value at which the head still drifts right across the
//     climb instead of standing still under the follow. It buys 1,785 screen px
//     of drawn line at f0 against 1,503, and the 50 px of lift keeps the oldest
//     end of the line out of the caption band.
//   * THE CHART IS MASKED BEHIND THE TAG — see OCCLUDE_ID. Not in the brief
//     because it only appears once the camera has pulled back: 2018-2019 runs at
//     exactly the price band the landed tile occupies, and a knock-out is
//     transparent, so the white line was showing through the letters. Rendered
//     and looked at first, then fixed.
//   * x 583.19 / 584.15 for 2017-09-07 / 09-15, and a 143.00 px cliff, are what
//     the REV 3 brief's own date -> x and price -> y mapping give.
// ---------------------------------------------------------------------------

export const schema = z.object({
  ink: z.string(),
  accent: z.string(), // the six sessions of the breach, and every data dot
  accentDeep: z.string(), // the set's shared palette
  backgroundBase: z.string(),
  backgroundSrc: z.string(),
  backgroundBlur: z.number(),
  backgroundDim: z.number(),
  parallax: z.number(),
  shadowY: z.number(),
  shadowBlur: z.number(),
  shadowOpacity: z.number(),
  iconShadowY: z.number(),
  iconShadowBlur: z.number(),
  iconShadowOpacity: z.number(),
  lineWidth: z.number(),
  tagW: z.number(),
  tagH: z.number(),
  beats: z.object({
    its: z.number(), // "it's"
    very: z.number(), // "very"
    hard: z.number(), // "hard"
    to: z.number(), // "to"
    find: z.number(), // "find" — the tag is already on its way down
    that: z.number(), // "that"
    moment: z.number(), // "moment" — the tag lands and the price falls
    inn: z.number(), // "in" — the head leaves the cliff
    the: z.number(), // "the"
    equifax: z.number(), // "Equifax"
    stock: z.number(), // "stock"
    price: z.number(), // "price"
    chart: z.number(), // "chart" — the camera is landed on the whole decade
    end: z.number(), // speech ends; tail to 108
  }),
});

export type Props = z.infer<typeof schema>;

// ---------------------------------------------------------------------------
// THE DATA — REV 3. Equifax (NYSE: EFX) daily closes, 2006-09-14 -> 2026-09-14,
// Nasdaq historical, 5030 rows, resampled to ONE POINT PER TRADING WEEK (the
// last close of the week) for the whole span, with the DAILY closes kept for
// 2017-08-01 -> 2017-10-31 so the cliff has its real six-session shape. 1098
// points, twice the span of REV 2's ten years.
//
// THE MAPPING IS NEW AND IT REPLACES THE TEN-YEAR ONE EVERYWHERE (REV 3 brief):
// date -> x linear with 2006-09-14 at x 100 and 2026-09-14 at x 980 (44 px a
// year, half of REV 2's rate); price -> y linear with $0 at y 1300 and $320 at
// y 380, i.e. 2.875 world px per dollar (REV 2 was $80 at 1300 and 3.8333 px/$,
// which cannot hold a $19.79 low). Every pair below is already in world px, so
// nothing is computed from a date at render time and no CSV is read.
//
// The facts the cut is built on, all verified against the file:
//   2006-09-14   $36.76  (100.00, 1194.32)  the first close, bottom left
//   2009-03-09   $19.79  (209.26, 1243.10)  the financial-crisis low
//   2014-09-08   $78.81  (451.28, 1073.42)  where the head stands at f0
//   2017-09-07  $142.72  (583.19,  889.68)  the close the breach was announced
//   2017-09-15   $92.98  (584.15, 1032.68)  the low, minus 35 per cent in six
//                                           sessions
//   2018-12-24   $90.00  (640.17, 1041.25)  a notch of the same depth
//   2024-08-30  $307.13  (890.25,  417.00)  the all-time high
//   2026-09-14  $172.29  (980.00,  804.67)  the last close
//
// The cliff is now 143.00 world px, not REV 2's 190.67: the same six sessions
// drawn at the new dollar scale. That is the whole point of the revision — the
// drop has to be a notch the decade around it can dwarf.
// ---------------------------------------------------------------------------
export const X0 = 100;
export const X1 = 980;
export const I_BREACH = 595; // index of 2017-09-07 in EFX_XY
export const I_LOW = 601; // index of 2017-09-15

// prettier-ignore
export const EFX_XY: number[] = [
  100.00, 1194.32, 100.12, 1194.80, 100.96, 1196.13, 101.81, 1194.46, 102.65, 1195.72, 103.49, 1195.12, 104.34, 1194.78, 105.18, 1192.47,
  106.02, 1192.36, 106.87, 1190.12, 107.71, 1189.37, 108.55, 1190.23, 109.40, 1190.87, 110.24, 1187.99, 111.08, 1181.61, 111.93, 1182.76,
  112.77, 1183.28, 113.61, 1185.75, 114.46, 1184.86, 115.30, 1183.39, 116.14, 1184.86, 116.99, 1181.98, 117.83, 1180.40, 118.67, 1185.78,
  119.52, 1186.35, 120.36, 1191.53, 121.20, 1192.88, 122.05, 1193.71, 122.89, 1191.44, 123.73, 1195.21, 124.45, 1193.22, 125.42, 1191.84,
  126.26, 1186.64, 127.10, 1184.65, 127.95, 1182.27, 128.79, 1181.69, 129.63, 1180.49, 130.48, 1181.46, 131.32, 1178.27, 132.16, 1173.47,
  133.01, 1172.84, 133.85, 1173.64, 134.69, 1172.29, 135.54, 1170.31, 136.38, 1167.75, 137.22, 1170.68, 138.07, 1184.88, 138.91, 1186.49,
  139.75, 1191.73, 140.60, 1188.51, 141.44, 1187.53, 142.28, 1189.26, 143.13, 1192.53, 143.97, 1193.94, 144.81, 1188.59, 145.66, 1190.40,
  146.50, 1187.96, 147.34, 1192.56, 148.19, 1198.43, 149.03, 1191.76, 149.87, 1190.20, 150.72, 1189.40, 151.56, 1189.74, 152.40, 1193.14,
  153.25, 1192.96, 154.09, 1190.61, 154.93, 1191.67, 155.78, 1193.77, 156.62, 1195.78, 157.46, 1201.36, 158.31, 1206.76, 159.15, 1206.05,
  159.99, 1200.84, 160.84, 1193.62, 161.68, 1202.60, 162.52, 1199.46, 163.36, 1197.82, 164.21, 1201.62, 165.05, 1202.45, 165.89, 1203.20,
  166.62, 1200.24, 167.58, 1201.44, 168.42, 1197.25, 169.27, 1202.05, 170.11, 1196.13, 170.95, 1188.34, 171.80, 1187.53, 172.64, 1191.38,
  173.48, 1190.09, 174.33, 1193.19, 175.17, 1190.29, 176.01, 1196.07, 176.86, 1195.32, 177.70, 1200.47, 178.54, 1203.17, 179.27, 1203.80,
  180.23, 1202.51, 181.07, 1199.32, 181.92, 1202.37, 182.76, 1198.34, 183.60, 1194.57, 184.45, 1193.25, 185.29, 1199.38, 186.13, 1198.43,
  186.98, 1199.72, 187.82, 1194.17, 188.66, 1197.79, 189.51, 1198.74, 190.35, 1209.84, 191.19, 1223.84, 192.04, 1227.12, 192.88, 1232.81,
  193.72, 1225.02, 194.57, 1227.20, 195.41, 1232.35, 196.25, 1239.02, 197.10, 1226.83, 197.94, 1232.78, 198.78, 1232.49, 199.62, 1226.52,
  200.47, 1227.61, 201.31, 1220.51, 202.15, 1222.14, 203.00, 1227.20, 203.84, 1230.68, 204.68, 1228.93, 205.53, 1229.42, 206.37, 1233.30,
  207.21, 1238.68, 208.06, 1238.19, 208.90, 1241.90, 209.74, 1238.36, 210.59, 1235.77, 211.43, 1229.05, 212.27, 1223.47, 213.00, 1222.66,
  213.96, 1221.54, 214.80, 1217.17, 215.65, 1216.91, 216.49, 1216.42, 217.33, 1220.74, 218.18, 1221.02, 219.02, 1221.74, 219.86, 1224.88,
  220.71, 1221.54, 221.55, 1224.93, 222.39, 1225.05, 223.12, 1226.92, 224.08, 1227.09, 224.92, 1226.08, 225.77, 1226.40, 226.61, 1225.11,
  227.45, 1220.31, 228.30, 1221.34, 229.14, 1219.59, 229.98, 1220.62, 230.83, 1222.32, 231.67, 1221.22, 232.51, 1217.20, 233.36, 1217.75,
  234.20, 1220.05, 235.04, 1218.75, 235.89, 1217.11, 236.73, 1216.91, 237.57, 1221.28, 238.41, 1218.06, 239.26, 1216.31, 240.10, 1217.26,
  240.94, 1217.14, 241.79, 1213.81, 242.63, 1213.00, 243.47, 1212.46, 244.20, 1209.75, 245.04, 1211.19, 246.00, 1208.17, 246.85, 1208.75,
  247.69, 1209.64, 248.53, 1208.00, 249.38, 1209.24, 250.22, 1209.61, 251.06, 1208.00, 251.91, 1207.25, 252.75, 1204.15, 253.59, 1203.66,
  254.44, 1197.85, 255.28, 1196.24, 256.00, 1197.28, 256.97, 1197.74, 257.81, 1199.86, 258.65, 1196.67, 259.50, 1203.40, 260.34, 1209.21,
  261.18, 1206.96, 262.03, 1214.07, 262.87, 1213.03, 263.71, 1216.91, 264.56, 1214.67, 265.40, 1212.86, 266.24, 1216.80, 267.09, 1219.27,
  267.93, 1216.77, 268.77, 1216.11, 269.62, 1212.40, 270.46, 1209.90, 271.30, 1208.78, 272.15, 1213.17, 272.99, 1213.38, 273.83, 1214.07,
  274.67, 1212.80, 275.52, 1214.10, 276.36, 1213.72, 277.20, 1211.28, 278.05, 1210.56, 278.89, 1209.29, 279.73, 1207.71, 280.58, 1205.93,
  281.42, 1204.75, 282.26, 1200.12, 283.11, 1201.36, 283.95, 1199.92, 284.79, 1199.58, 285.64, 1197.94, 286.48, 1198.34, 287.32, 1196.93,
  288.05, 1197.94, 289.01, 1197.65, 289.85, 1195.90, 290.70, 1194.00, 291.54, 1196.59, 292.38, 1197.99, 293.23, 1195.90, 294.07, 1195.32,
  294.91, 1195.61, 295.76, 1198.80, 296.60, 1196.67, 297.44, 1194.03, 298.29, 1196.67, 299.13, 1191.81, 299.97, 1186.04, 300.82, 1190.38,
  301.66, 1192.82, 302.38, 1190.89, 303.35, 1192.10, 304.19, 1189.49, 305.03, 1191.87, 305.88, 1193.83, 306.72, 1193.16, 307.56, 1195.84,
  308.41, 1199.75, 309.25, 1201.27, 310.09, 1203.26, 310.93, 1198.97, 311.78, 1199.55, 312.62, 1201.19, 313.46, 1200.93, 314.31, 1201.21,
  315.15, 1208.37, 315.99, 1211.02, 316.84, 1217.23, 317.68, 1210.27, 318.52, 1210.82, 319.37, 1213.06, 320.21, 1207.14, 321.05, 1213.09,
  321.90, 1211.62, 322.74, 1208.58, 323.58, 1202.11, 324.43, 1202.62, 325.27, 1197.88, 326.11, 1197.25, 326.96, 1196.04, 327.80, 1199.78,
  328.64, 1203.51, 329.49, 1193.05, 330.33, 1190.69, 331.17, 1191.53, 332.02, 1187.62, 332.86, 1188.62, 333.70, 1188.05, 334.55, 1188.05,
  335.39, 1186.32, 336.23, 1186.95, 337.08, 1186.04, 337.92, 1177.44, 338.76, 1177.44, 339.61, 1178.13, 340.45, 1179.71, 341.29, 1177.44,
  342.14, 1173.64, 342.98, 1173.73, 343.82, 1172.75, 344.54, 1174.02, 345.51, 1174.08, 346.35, 1172.21, 347.20, 1167.32, 348.04, 1168.58,
  348.88, 1167.03, 349.72, 1172.06, 350.57, 1168.76, 351.41, 1175.40, 352.25, 1165.31, 353.10, 1163.64, 353.94, 1166.28, 354.78, 1166.03,
  355.63, 1164.90, 356.47, 1159.79, 357.31, 1160.62, 358.16, 1164.70, 359.00, 1166.74, 359.84, 1168.07, 360.69, 1164.99, 361.53, 1164.67,
  362.37, 1168.38, 363.22, 1165.34, 364.06, 1163.87, 364.90, 1164.90, 365.75, 1166.08, 366.59, 1158.55, 367.43, 1158.38, 368.28, 1155.01,
  369.12, 1157.00, 369.96, 1156.02, 370.81, 1155.19, 371.65, 1155.39, 372.49, 1153.29, 373.34, 1152.68, 374.18, 1143.80, 375.02, 1147.62,
  375.87, 1145.73, 376.71, 1146.59, 377.55, 1140.26, 378.40, 1138.48, 379.24, 1131.96, 380.08, 1130.75, 380.93, 1129.57, 381.77, 1140.26,
  382.61, 1141.39, 383.46, 1144.32, 384.30, 1139.40, 385.14, 1136.64, 385.98, 1137.76, 386.83, 1137.82, 387.55, 1134.43, 388.51, 1138.19,
  389.36, 1130.52, 390.20, 1131.47, 391.04, 1123.68, 391.89, 1121.35, 392.73, 1116.55, 393.57, 1119.22, 394.42, 1124.02, 395.26, 1124.91,
  396.10, 1126.49, 396.95, 1125.20, 397.79, 1131.96, 398.63, 1130.58, 399.48, 1128.82, 400.32, 1124.37, 401.16, 1123.36, 402.01, 1122.35,
  402.85, 1112.58, 403.69, 1112.66, 404.54, 1120.83, 405.38, 1120.51, 406.22, 1130.12, 407.07, 1129.40, 407.91, 1127.64, 408.75, 1123.10,
  409.60, 1128.05, 410.44, 1128.68, 411.28, 1124.91, 412.13, 1121.26, 412.97, 1111.63, 413.81, 1112.61, 414.66, 1113.99, 415.50, 1109.04,
  416.34, 1104.93, 417.19, 1106.43, 418.03, 1103.61, 418.87, 1108.07, 419.72, 1105.39, 420.56, 1101.34, 421.40, 1101.91, 422.25, 1102.20,
  423.09, 1096.65, 423.93, 1099.41, 424.77, 1098.58, 425.62, 1096.02, 426.46, 1099.33, 427.30, 1101.94, 428.15, 1098.58, 428.99, 1096.57,
  429.83, 1095.79, 430.68, 1095.24, 431.52, 1103.95, 432.36, 1105.36, 433.21, 1113.01, 433.93, 1102.75, 434.89, 1101.94, 435.74, 1096.13,
  436.58, 1095.21, 437.42, 1096.65, 438.27, 1100.10, 439.11, 1096.48, 439.95, 1093.32, 440.80, 1093.92, 441.64, 1089.41, 442.48, 1091.07,
  443.21, 1090.99, 444.17, 1089.18, 445.01, 1089.18, 445.86, 1079.26, 446.70, 1082.65, 447.54, 1082.62, 448.39, 1077.91, 449.23, 1075.20,
  450.07, 1073.57, 450.92, 1070.40, 451.76, 1075.58, 452.60, 1079.29, 453.45, 1085.53, 454.29, 1087.13, 455.13, 1093.98, 455.98, 1090.47,
  456.82, 1087.57, 457.66, 1082.25, 458.51, 1076.41, 459.35, 1075.17, 460.19, 1074.23, 461.03, 1071.29, 461.88, 1067.30, 462.72, 1071.06,
  463.56, 1066.95, 464.41, 1064.45, 465.25, 1066.20, 466.09, 1062.12, 466.94, 1060.45, 467.78, 1054.93, 468.62, 1057.18, 469.47, 1054.88,
  470.31, 1033.89, 471.15, 1030.84, 472.00, 1031.56, 472.84, 1031.53, 473.68, 1036.48, 474.53, 1032.39, 475.37, 1035.59, 476.09, 1031.27,
  477.06, 1031.45, 477.90, 1035.96, 478.74, 1016.84, 479.59, 1017.47, 480.43, 1015.69, 481.27, 1015.66, 482.12, 1011.72, 482.96, 1011.55,
  483.80, 1018.77, 484.65, 1016.70, 485.49, 1013.33, 486.33, 1012.79, 487.06, 1017.65, 488.02, 1018.91, 488.86, 1016.67, 489.71, 1012.38,
  490.55, 1006.38, 491.39, 1003.62, 492.24, 999.62, 493.08, 1014.34, 493.92, 1016.96, 494.77, 1021.10, 495.61, 1018.25, 496.45, 1021.01,
  497.30, 1019.83, 498.14, 1014.46, 498.98, 996.75, 499.82, 994.21, 500.67, 995.16, 501.51, 993.61, 502.35, 995.08, 503.20, 999.07,
  504.04, 983.12, 504.88, 977.08, 505.73, 978.66, 506.57, 990.13, 507.41, 984.81, 508.14, 975.84, 508.98, 979.81, 509.94, 1006.06,
  510.79, 1004.28, 511.63, 998.59, 512.47, 995.83, 513.32, 1012.85, 514.16, 1019.77, 515.00, 1009.65, 515.85, 994.19, 516.69, 990.48,
  517.53, 988.21, 518.38, 976.53, 519.10, 980.21, 520.06, 964.80, 520.91, 969.32, 521.75, 965.98, 522.59, 967.33, 523.44, 954.28,
  524.28, 955.23, 525.12, 947.55, 525.97, 946.72, 526.81, 936.92, 527.65, 940.05, 528.50, 943.79, 529.34, 947.38, 530.18, 948.99,
  531.03, 930.65, 531.87, 919.81, 532.71, 914.61, 533.56, 909.63, 534.40, 919.18, 535.24, 918.09, 536.08, 919.46, 536.93, 922.17,
  537.77, 922.02, 538.61, 914.29, 539.46, 923.12, 540.30, 919.90, 541.14, 920.13, 541.99, 913.08, 542.83, 925.85, 543.67, 925.24,
  544.52, 926.94, 545.36, 949.25, 546.20, 944.62, 547.05, 972.16, 547.89, 950.51, 548.73, 954.83, 549.58, 972.16, 550.42, 963.16,
  551.26, 963.71, 552.11, 956.01, 552.95, 960.09, 553.79, 952.12, 554.64, 954.11, 555.48, 960.52, 556.32, 960.49, 557.17, 953.99,
  558.01, 924.64, 558.85, 925.85, 559.70, 928.03, 560.54, 918.20, 561.38, 916.88, 562.23, 908.65, 563.07, 909.20, 563.91, 906.87,
  564.76, 908.37, 565.48, 912.28, 566.44, 905.18, 567.29, 910.98, 568.13, 900.92, 568.97, 911.73, 569.82, 907.94, 570.66, 907.76,
  571.50, 904.37, 572.34, 910.38, 573.19, 890.08, 574.03, 899.25, 574.87, 904.92, 575.72, 902.19, 576.56, 898.16, 577.40, 886.32,
  578.25, 882.87, 578.73, 879.50, 578.85, 881.72, 578.97, 883.30, 579.09, 881.89, 579.45, 881.77, 579.57, 890.69, 579.69, 889.05,
  579.81, 891.58, 579.93, 893.62, 580.30, 889.42, 580.42, 889.22, 580.54, 888.88, 580.66, 895.69, 580.78, 897.82, 581.14, 897.96,
  581.26, 891.12, 581.38, 894.68, 581.50, 896.41, 581.62, 895.49, 581.98, 895.72, 582.10, 895.20, 582.22, 893.42, 582.34, 890.40,
  582.46, 892.93, 582.95, 894.34, 583.07, 893.50, 583.19, 889.68, 583.31, 945.71, 583.67, 974.78, 583.79, 966.62, 583.91, 1015.40,
  584.03, 1022.10, 584.15, 1032.68, 584.51, 1028.66, 584.63, 1027.25, 584.75, 1024.00, 584.87, 1017.53, 584.99, 998.01, 585.36, 997.87,
  585.48, 995.11, 585.60, 993.99, 585.72, 994.19, 585.84, 995.28, 586.20, 990.05, 586.32, 982.46, 586.44, 978.20, 586.56, 975.21,
  586.68, 979.90, 587.04, 977.28, 587.16, 973.57, 587.28, 982.31, 587.40, 987.17, 587.52, 985.19, 587.89, 987.49, 588.01, 987.83,
  588.13, 981.97, 588.25, 982.28, 588.37, 983.84, 588.73, 985.59, 588.85, 987.20, 588.97, 990.82, 589.09, 986.77, 589.21, 985.50,
  589.57, 986.60, 589.69, 987.98, 590.05, 987.49, 590.90, 987.37, 591.74, 979.81, 592.58, 984.04, 593.43, 975.33, 594.27, 962.47,
  595.11, 956.41, 595.96, 955.78, 596.80, 960.98, 597.64, 946.86, 598.49, 946.81, 599.33, 941.98, 600.17, 933.47, 601.02, 950.72,
  601.86, 977.42, 602.70, 962.30, 603.55, 968.22, 604.39, 962.96, 605.23, 940.86, 606.08, 945.05, 606.92, 966.93, 607.64, 961.30,
  608.61, 961.96, 609.45, 966.50, 610.29, 958.22, 611.13, 971.44, 611.98, 976.68, 612.82, 970.18, 613.66, 970.21, 614.51, 968.77,
  615.35, 971.42, 616.19, 932.52, 617.04, 943.47, 617.88, 936.03, 618.72, 940.31, 619.57, 934.18, 620.41, 934.90, 621.25, 936.28,
  622.10, 944.97, 622.94, 932.69, 623.78, 930.96, 624.63, 917.37, 625.47, 918.86, 626.31, 914.84, 627.16, 909.26, 628.00, 907.04,
  628.84, 916.45, 629.69, 924.61, 630.53, 928.49, 631.37, 946.23, 632.22, 944.76, 633.06, 1020.58, 633.90, 1001.40, 634.75, 1006.40,
  635.59, 1009.86, 636.43, 1009.45, 637.28, 1004.82, 638.12, 1014.34, 638.96, 1020.61, 639.81, 1038.38, 640.65, 1033.03, 641.49, 1029.03,
  642.34, 1022.13, 643.18, 1000.31, 644.02, 996.31, 644.87, 989.67, 645.71, 992.72, 646.55, 985.73, 647.39, 981.57, 648.24, 982.43,
  649.08, 987.98, 649.92, 980.82, 650.77, 975.47, 651.61, 959.31, 652.45, 944.13, 653.30, 940.45, 654.02, 938.61, 654.98, 939.88,
  655.83, 943.01, 656.67, 956.72, 657.51, 951.78, 658.36, 950.06, 659.20, 952.41, 660.04, 925.76, 660.89, 920.38, 661.73, 914.55,
  662.57, 911.18, 663.42, 903.08, 664.26, 904.23, 665.10, 905.26, 665.95, 890.77, 666.79, 903.05, 667.63, 892.61, 668.48, 886.75,
  669.32, 892.47, 670.16, 879.16, 671.01, 878.07, 671.85, 893.76, 672.69, 894.48, 673.54, 893.73, 674.38, 903.13, 675.22, 886.20,
  676.07, 884.04, 676.91, 903.54, 677.75, 901.24, 678.60, 914.87, 679.44, 902.10, 680.28, 902.90, 681.13, 898.54, 681.97, 901.81,
  682.81, 901.24, 683.66, 901.50, 684.50, 896.90, 685.34, 889.25, 686.18, 878.18, 687.03, 860.04, 687.87, 857.22, 688.71, 869.04,
  689.56, 852.62, 690.40, 831.49, 691.24, 841.35, 692.09, 891.63, 692.93, 856.73, 693.77, 895.46, 694.62, 996.26, 695.46, 956.29,
  696.30, 993.47, 697.03, 942.87, 697.99, 932.09, 698.83, 922.17, 699.68, 903.57, 700.52, 870.53, 701.36, 884.79, 702.21, 877.29,
  703.05, 858.51, 703.89, 791.10, 704.74, 817.06, 705.58, 817.29, 706.42, 818.35, 707.15, 805.79, 708.11, 831.06, 708.95, 820.45,
  709.80, 819.41, 710.64, 832.64, 711.48, 820.91, 712.33, 826.37, 713.17, 841.93, 714.01, 815.94, 714.86, 821.63, 715.70, 832.67,
  716.54, 851.73, 717.39, 850.32, 718.23, 842.99, 719.07, 827.69, 719.92, 830.40, 720.76, 860.27, 721.60, 907.28, 722.44, 868.55,
  723.29, 825.37, 724.13, 806.54, 724.97, 826.37, 725.82, 821.31, 726.66, 759.10, 727.50, 738.89, 728.23, 742.37, 729.07, 745.59,
  730.03, 765.08, 730.88, 791.12, 731.72, 786.12, 732.56, 790.81, 733.41, 786.41, 734.25, 790.58, 735.09, 792.45, 735.94, 834.60,
  736.78, 811.97, 737.62, 809.73, 738.47, 799.23, 739.31, 775.31, 740.03, 775.00, 741.00, 765.80, 741.84, 750.93, 742.68, 639.55,
  743.53, 640.96, 744.37, 611.26, 745.21, 611.70, 746.06, 618.25, 746.90, 624.26, 747.74, 628.98, 748.59, 635.99, 749.43, 630.70,
  750.27, 612.90, 751.12, 603.27, 751.96, 585.45, 752.80, 567.94, 753.65, 572.42, 754.49, 550.77, 755.33, 570.24, 756.18, 552.21,
  757.02, 556.78, 757.86, 532.78, 758.70, 499.95, 759.55, 515.50, 760.39, 528.09, 761.23, 536.69, 762.08, 563.11, 762.92, 556.29,
  763.76, 541.14, 764.61, 528.70, 765.45, 502.39, 766.29, 481.89, 767.14, 494.74, 767.98, 469.53, 768.82, 501.50, 769.67, 487.81,
  770.51, 451.53, 771.35, 504.66, 772.08, 474.79, 773.04, 458.23, 773.88, 531.08, 774.73, 582.69, 775.57, 651.23, 776.41, 627.11,
  777.26, 627.05, 778.10, 653.12, 778.94, 687.51, 779.79, 671.64, 780.63, 645.45, 781.47, 656.29, 782.32, 606.81, 783.16, 623.05,
  784.00, 626.88, 784.85, 658.44, 785.57, 677.91, 786.53, 714.65, 787.38, 714.88, 788.22, 710.34, 789.06, 730.20, 789.91, 740.50,
  790.75, 706.92, 791.59, 723.39, 792.44, 772.87, 793.28, 802.28, 794.12, 768.61, 794.97, 763.67, 795.81, 752.46, 796.65, 746.79,
  797.49, 722.56, 798.34, 699.38, 799.18, 689.21, 800.02, 660.80, 800.87, 700.02, 801.71, 733.25, 802.55, 760.94, 803.40, 733.16,
  804.24, 773.16, 805.08, 797.13, 805.93, 807.14, 806.77, 814.64, 807.61, 842.62, 808.46, 862.94, 809.30, 808.69, 810.14, 831.12,
  810.99, 742.28, 811.83, 724.48, 812.67, 723.76, 813.52, 721.03, 814.36, 732.33, 815.20, 748.29, 816.05, 737.28, 816.89, 741.21,
  817.73, 711.72, 818.58, 676.12, 819.42, 659.77, 820.26, 672.56, 821.11, 650.28, 821.95, 707.29, 822.79, 691.30, 823.64, 724.60,
  824.48, 703.38, 825.32, 744.72, 826.17, 722.44, 827.01, 731.96, 827.85, 716.84, 828.57, 735.32, 829.54, 738.05, 830.38, 717.04,
  831.23, 700.91, 832.07, 724.68, 832.91, 713.64, 833.75, 695.90, 834.60, 694.41, 835.44, 685.76, 836.28, 656.46, 837.13, 639.41,
  837.97, 655.91, 838.81, 623.51, 839.66, 651.37, 840.50, 620.00, 841.34, 689.49, 842.19, 717.04, 843.03, 731.58, 843.87, 732.73,
  844.72, 747.54, 845.56, 730.81, 846.40, 705.36, 847.25, 734.89, 848.09, 734.03, 848.93, 766.51, 849.78, 773.36, 850.62, 776.12,
  851.46, 787.04, 852.31, 792.94, 853.15, 832.29, 853.99, 777.27, 854.84, 768.38, 855.68, 710.02, 856.52, 694.12, 857.37, 661.40,
  858.21, 643.41, 859.05, 596.77, 859.90, 598.85, 860.74, 589.04, 861.58, 618.57, 862.43, 599.19, 863.27, 594.65, 864.11, 592.40,
  864.96, 581.54, 865.80, 583.61, 866.64, 558.02, 867.49, 535.31, 868.33, 520.93, 869.17, 523.75, 870.02, 572.80, 870.86, 540.54,
  871.58, 530.88, 872.54, 563.57, 873.39, 589.90, 874.23, 678.43, 875.07, 657.67, 875.92, 647.23, 876.76, 605.43, 877.60, 584.84,
  878.45, 609.94, 879.29, 634.75, 880.13, 629.32, 880.98, 605.37, 881.82, 610.75, 882.66, 602.93, 883.51, 603.56, 884.35, 558.34,
  885.19, 551.64, 886.04, 518.75, 886.88, 481.69, 887.72, 499.51, 888.57, 459.72, 889.41, 431.26, 890.25, 417.00, 891.10, 460.27,
  891.94, 418.09, 892.78, 440.12, 893.63, 465.13, 894.47, 484.65, 895.31, 480.05, 896.16, 489.28, 897.00, 524.07, 897.84, 539.88,
  898.69, 521.08, 899.53, 586.22, 900.37, 570.96, 901.22, 548.01, 902.06, 532.89, 902.90, 535.80, 903.75, 557.01, 904.59, 564.06,
  905.43, 571.50, 906.28, 597.49, 907.12, 544.25, 907.96, 527.14, 908.80, 510.01, 909.65, 586.20, 910.49, 582.69, 911.33, 615.66,
  912.18, 595.05, 913.02, 567.77, 913.86, 621.73, 914.71, 598.50, 915.55, 609.05, 916.39, 696.05, 917.24, 666.81, 917.96, 663.91,
  918.92, 562.62, 919.77, 540.05, 920.61, 524.01, 921.45, 498.79, 922.30, 546.20, 923.14, 540.45, 923.98, 528.61, 924.83, 540.17,
  925.67, 564.86, 926.51, 563.60, 927.24, 547.30, 928.20, 556.35, 929.04, 543.62, 929.89, 592.00, 930.73, 610.03, 931.57, 610.55,
  932.42, 587.80, 933.26, 566.88, 934.10, 591.89, 934.95, 582.20, 935.79, 563.28, 936.63, 559.46, 937.48, 568.97, 938.32, 619.57,
  939.16, 637.89, 940.01, 647.63, 940.85, 627.82, 941.69, 693.09, 942.54, 703.18, 943.38, 704.44, 944.22, 685.53, 945.07, 689.44,
  945.91, 691.91, 946.75, 665.11, 947.59, 669.91, 948.44, 661.58, 949.28, 684.66, 950.12, 647.49, 950.97, 668.74, 951.81, 697.00,
  952.65, 720.98, 953.50, 737.59, 954.34, 745.70, 955.18, 732.30, 956.03, 699.24, 956.87, 702.49, 957.71, 770.20, 958.56, 788.19,
  959.40, 805.93, 960.12, 775.63, 961.09, 788.34, 961.93, 735.87, 962.77, 804.15, 963.62, 800.18, 964.46, 794.49, 965.30, 844.69,
  966.15, 828.38, 966.99, 823.35, 967.83, 805.13, 968.68, 829.33, 969.40, 857.45, 970.36, 844.37, 971.09, 805.30, 972.05, 821.49,
  972.89, 790.89, 973.74, 803.95, 974.58, 803.72, 975.42, 775.14, 976.27, 780.06, 977.11, 746.22, 977.95, 741.24, 978.80, 790.98,
  979.64, 814.12, 980.00, 804.67,
];

export const N_PTS = EFX_XY.length / 2;
export const PX = (i: number) => EFX_XY[i * 2];
export const PY = (i: number) => EFX_XY[i * 2 + 1];

// ---------------------------------------------------------------------------
// THE OPENING ZOOM SCHEDULE, written here rather than with the rest of the
// camera at the bottom of the file, because THE HEAD'S OWN RATE IS DERIVED FROM
// IT (see CLIMB_M): a chart line costs screen px in proportion to k, so a head
// that advances at one rate through a widening frame is faster at the top of the
// cut than at the bottom of it. In REV 3 that gradient is gone — the open is
// 2.30 -> 2.28 — and CLIMB_SLOW is duly zero, but the coupling stays written
// here because it is the reason the dial exists. Only the zoom is up here; the
// pan, the tilt and the pull-back stay below, where they can read the head.
// ---------------------------------------------------------------------------
// K_OPEN 2.30 (REV 3; it was 3.60, 3.10 and 2.40 as the open was tightened in
// turn against ten years of data). The tightening is over: with twenty years on
// the sheet the opening no longer has to magnify four months of chart to fill a
// frame, so the cut opens at very nearly the frame it holds through the drop —
// 2.30 -> K_ROOM 2.28 — and the OPENING MOVE IS A FOLLOW, NOT A ZOOM. At k 2.30
// the visible world is 470 x 835 px, about 2010 -> 2021, and 1,503 screen px of
// line are already drawn inside it at f0.
export const K_OPEN = 2.3; // f0: a decade of climb already on the sheet
export const K_ROOM = 2.28; // f28: the frame the cut holds through the drop
export const OPEN_F1 = 28; // the widening lands two frames before "moment"
export const OPEN_WARP_K = 1;
export const kOpen = (f: number) =>
  K_OPEN + (K_ROOM - K_OPEN) * camEase(clamp01(f / OPEN_F1), OPEN_WARP_K);

// ---------------------------------------------------------------------------
// THE HEAD'S TRACK.
//
// LAMBDA — WHY THE HEAD IS NOT PARAMETRISED BY x. The brief asks for a head
// that travels right at a steady speed. The data will not have it: at twenty
// years the chart is 880 world px of x carrying 11,196 px of actual path,
// because one trading week is 0.845 px of x and the mean week moves the price
// about 8 px. A head advancing 4.4 px of x a frame during the climb therefore
// crosses five of those segments a frame, and it reverses direction on most
// frames.
//
// So the head advances along a DAMPED ARC METRIC instead:
//     dm = hypot(dx, dy / LAMBDA)
// which is arc length with the vertical axis compressed LAMBDA times. On a flat
// stretch dm is dx, so the head still travels right at the briefed speed; on a
// steep one ds/dm tends to LAMBDA, so the head slows into the spike instead of
// jumping it. That is what makes the CLIFF — the one place a single head is
// genuinely an object an eye can track — a controllable fall rather than a jump.
//
// LAMBDA 6 is kept from REV 2 and it is now chosen for the cliff, not for the
// climb, because at twenty years the climb cannot be tuned at all: swept 1, 2,
// 3, 4, 6, 8, 12 the climb's worst frame measures 74.3, 78.6, 83.2, 86.1, 77.1,
// 76.2, 86.0 screen px — noise around a floor that is the chart's own weekly
// volatility. 6 gives the quietest reveal front of the set in both the climb
// (14.8) and the run (23.4), and it is the value the approved phase 2 was built
// on.
//
// The tail of that argument, stated plainly because the velocity scan reports
// it: NOTHING can trace 11,196 px of real path inside 92 frames under a 45
// px/frame cap, and at 44 px a year the head is not a travelling object at all —
// it is the end of a line that is filling in, hopping vertically inside a
// two-pixel column. There is no dot, no glow and no marker on it. The thing the
// eye actually follows is the REVEAL FRONT, the horizontal rate at which ink
// appears, and that stays at or under 23.4 screen px/frame for the whole cut.
export const LAMBDA = 6;

export const METRIC: number[] = (() => {
  const m = [0];
  for (let i = 1; i < N_PTS; i++) {
    m.push(m[i - 1] + Math.hypot(PX(i) - PX(i - 1), (PY(i) - PY(i - 1)) / LAMBDA));
  }
  return m;
})();
export const M_END = METRIC[N_PTS - 1];
export const M_BREACH = METRIC[I_BREACH];
export const M_LOW = METRIC[I_LOW];

// The metric at an arbitrary x, so the opening head can be put on a date that
// is not itself a sample (2017-01-03 is a Tuesday; the week's sample is its
// Friday). Only used once, at module scope.
const metricAtX = (x: number) => {
  if (x <= PX(0)) return 0;
  if (x >= PX(N_PTS - 1)) return M_END;
  let lo = 0;
  let hi = N_PTS - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (PX(mid) <= x) lo = mid;
    else hi = mid;
  }
  const u = (x - PX(lo)) / (PX(hi) - PX(lo));
  return METRIC[lo] + (METRIC[hi] - METRIC[lo]) * u;
};

// A point on the polyline at metric distance m, plus the index/fraction the
// line has to be drawn up to.
export type Head = { x: number; y: number; i: number; u: number };
export const headAt = (m: number): Head => {
  if (m <= 0) return { x: PX(0), y: PY(0), i: 0, u: 0 };
  if (m >= M_END) return { x: PX(N_PTS - 1), y: PY(N_PTS - 1), i: N_PTS - 1, u: 0 };
  let lo = 0;
  let hi = N_PTS - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (METRIC[mid] <= m) lo = mid;
    else hi = mid;
  }
  const u = (m - METRIC[lo]) / (METRIC[hi] - METRIC[lo]);
  return { x: PX(lo) + (PX(hi) - PX(lo)) * u, y: PY(lo) + (PY(hi) - PY(lo)) * u, i: lo, u };
};

// A travel with a flat middle: eases in over the first `a`, runs at one speed,
// eases out over the last `a`. Zero velocity at both ends, peak 1/(1-a) times
// the average — so `a` is the dial between "smooth" and "fast enough to fit".
// (BackIntoItV5's `flow`, with `a` exposed because this cut spends it.)
export const FLOW_A = 0.28;
export const flow = (u: number, a: number = FLOW_A) => {
  const x = clamp01(u);
  const area = 1 - a;
  if (x < a) {
    const g = x / a;
    return (a * (g * g * g - (g * g * g * g) / 2)) / area;
  }
  if (x <= 1 - a) return (a * 0.5 + (x - a)) / area;
  const g = (1 - x) / a;
  return (area - a * (g * g * g - (g * g * g * g) / 2)) / area;
};

// A cubic Hermite, so the fall can leave the climb at the climb's own speed and
// still come to rest at the low. Without it the head stops dead on "moment" and
// starts again, which is a 5 screen px/frame step in the one place the scan is
// there to protect.
const hermite = (u: number, p0: number, p1: number, v0: number, v1: number, T: number) => {
  const h00 = 2 * u ** 3 - 3 * u ** 2 + 1;
  const h10 = u ** 3 - 2 * u ** 2 + u;
  const h01 = -2 * u ** 3 + 3 * u ** 2;
  const h11 = u ** 3 - u ** 2;
  return h00 * p0 + h10 * T * v0 + h01 * p1 + h11 * T * v1;
};

export const OPEN_X = 451.28; // 2014-09-08, $78.81 — where the head starts
export const M_OPEN = metricAtX(OPEN_X);
export const CLIMB_F1 = 30; // "moment": the head is on 2017-09-07 exactly
export const CLIMB_V = (M_BREACH - M_OPEN) / CLIMB_F1; // the average rate

// THE CLIMB IS AT A CONSTANT RATE AGAIN (CLIMB_SLOW = 0, REV 3). The shaping
// below existed for one reason: REV 2 opened at k 3.60 and finished the climb at
// 2.39, so the same world displacement cost half again as many screen px at the
// top of the cut as at the bottom of it, and the head's worst frame had to be
// pushed out of the tight end. REV 3 opens at 2.30 and lands at 2.28. There is
// no gradient left to pay for, and measured on the new data a flat rate is
// marginally the BETTER of the two: 75.0 screen px on the head's worst frame
// against 77.1 at REV 2's 0.36 (swept: 0 -> 75.0, 0.1 -> 71.9, 0.2 -> 90.3,
// 0.3 -> 84.2, 0.36 -> 77.1, 0.45 -> 80.4 — a scatter, not a curve, because what
// is being measured is which weekly jag the head crosses on an integer frame).
// A dial that buys nothing is a dial that should be off, so it is zero and the
// climb is one plain rate; the machinery is left in place, and documented, so
// the shape can be brought back if the open is ever re-keyed to zoom again.
//
//     rate(f) / average  =  1 - CLIMB_SLOW · sin²(π f / CLIMB_SLOW_F)   f < 10
//                        =  1 + CLIMB_GIVE · sin²(π (f - 10) / 20)      f >= 10
//
// Two raised-cosine windows, the second's amplitude DERIVED from the first so
// the areas cancel exactly (CLIMB_GIVE = CLIMB_SLOW · 10 / 20), and BOTH ARE
// ZERO AT f30, so the head arrives at 2017-09-07 at exactly the average rate
// whatever the dial is set to. That is the velocity the drop is handed.
export const CLIMB_SLOW = 0;
export const CLIMB_SLOW_F = 10;
export const CLIMB_GIVE = (CLIMB_SLOW * CLIMB_SLOW_F) / (CLIMB_F1 - CLIMB_SLOW_F);
export const climbRate = (f: number) =>
  f < CLIMB_SLOW_F
    ? 1 - CLIMB_SLOW * Math.sin((Math.PI * f) / CLIMB_SLOW_F) ** 2
    : 1 + CLIMB_GIVE * Math.sin((Math.PI * (f - CLIMB_SLOW_F)) / (CLIMB_F1 - CLIMB_SLOW_F)) ** 2;

export const CLIMB_M: number[] = (() => {
  const cum = [0];
  for (let f = 1; f <= CLIMB_F1; f++)
    cum.push(cum[f - 1] + (climbRate(f - 1) + climbRate(f)) / 2);
  const total = cum[CLIMB_F1];
  return cum.map((c) => M_OPEN + (M_BREACH - M_OPEN) * (c / total));
})();
// The climb's metric at a (possibly fractional) frame, and the rate it leaves
// at — which is what the drop's hermite is handed, so the join at "moment" is
// C1 and lands on the same numbers phase 2 was approved on.
export const climbM = (f: number) => {
  const t = Math.max(0, Math.min(CLIMB_F1, f));
  const i = Math.min(CLIMB_F1 - 1, Math.floor(t));
  return CLIMB_M[i] + (CLIMB_M[i + 1] - CLIMB_M[i]) * (t - i);
};
export const CLIMB_V_END = CLIMB_M[CLIMB_F1] - CLIMB_M[CLIMB_F1 - 1];

// THE DROP'S ENTRY VELOCITY IS THE CLIMB'S IN ARC, NOT IN METRIC — REV 3, and
// this is a bug the ten-year build hid rather than a new choice. The hermite is
// parametrised in the METRIC, and ds/dm is about 1 on the near-flat weekly
// segment the climb ends on but LAMBDA (6) on the cliff it starts on. Handing
// the fall the climb's metric rate therefore multiplies the head's screen speed
// by six across the join: measured on the new mapping, the first drop frame ran
// at 95.4 screen px/frame. So the join is made C1 in the thing the eye actually
// measures — world px of PATH per frame — by converting through the ratio:
//     DROP_V0 = (arc the climb covers in its last frame) / (ds/dm on the cliff)
// It was invisible at ten years only because the climb's metric rate was 2.5
// there and is 6.9 here; the fix is right either way.
const DSDM_CLIFF = (() => {
  const dx = PX(I_BREACH + 1) - PX(I_BREACH);
  const dy = PY(I_BREACH + 1) - PY(I_BREACH);
  return Math.hypot(dx, dy) / Math.hypot(dx, dy / LAMBDA);
})();
export const CLIMB_ARC_END = (() => {
  const a = headAt(climbM(CLIMB_F1 - 1));
  const b = headAt(climbM(CLIMB_F1));
  return Math.hypot(b.x - a.x, b.y - a.y);
})();
export const DROP_V0 = CLIMB_ARC_END / DSDM_CLIFF;

// DROP_F1 IS 42 — THE BRIEF'S TWELVE FRAMES, WHICH REV 2 COULD NOT AFFORD. At
// 2.875 px/$ the cliff is 143.00 world px of fall (it was 190.67), the camera is
// at k 2.28 through it, and ds/dm on a cliff this steep is LAMBDA exactly. Swept
// with the corrected entry velocity: T = 10 measures 53.1 screen px/frame on the
// head's worst frame, 11 -> 47.5, 12 -> 44.1, 13 -> 40.3, 14 -> 37.7. The brief
// says "you may shorten the drop to 12 frames if the scan allows" and the scan
// allows it, at h = 1 (44.1) and at h = 1/4 (44.3). The beat does not move — the
// fall still starts on "moment" at f30 — and the head then RESTS ON THE LOW from
// f42 to f46, four frames in which the leak is falling past it and the camera
// has already begun to let go, before it leaves the cliff on "in".
export const DROP_F0 = 30;
export const DROP_F1 = 42;
export const RUN_F0 = 46; // "in"
export const RUN_F1 = 92; // speech ends with the head on the last close

// RUN_WARP IS THE BRIEF'S "SHAPE THE EASE SO THE HEAD IS SLOW WHILE k IS
// LARGE". The nine years still start while the camera is at k 2.15, so a plain
// `flow` runs the reveal front at 33.5 screen px/frame through f55-f60 while the
// frame is still tight. Warping the ease's own time by u^1.6 moves that speed to
// where the camera has already opened: measured front maxima are 33.5 at warp 1,
// 29.8 at 1.2, 25.7 at 1.4, 23.4 at 1.6, 22.4 at 1.8 and 23.5 at 2.2. 1.6 rather
// than REV 2's 1.8 because past it the whole reveal crowds into the last twenty
// frames — the head's own worst frame goes 220.9 -> 281.0 — for 1 px of front.
// It also takes the head's first ten frames out of the cliff at a crawl, which
// is what lets the frame leave the breach behind without the eye being dragged
// off it.
export const RUN_WARP = 1.6;

export const headM = (f: number) => {
  if (f <= CLIMB_F1) return climbM(f);
  if (f <= DROP_F1)
    return hermite(
      (f - DROP_F0) / (DROP_F1 - DROP_F0),
      M_BREACH,
      M_LOW,
      DROP_V0,
      0,
      DROP_F1 - DROP_F0,
    );
  if (f <= RUN_F0) return M_LOW;
  return M_LOW + (M_END - M_LOW) * flow(Math.pow((f - RUN_F0) / (RUN_F1 - RUN_F0), RUN_WARP));
};

// ---------------------------------------------------------------------------
// THE TAG. The clip's own object: the Equifax wordmark knocked out of the house
// tile, at half the crowd size (`EFX_REST` is 300 x 96, so this is 150 x 48 —
// derived, not a new number). It lands with its BOTTOM EDGE on the line at the
// top of the cliff and never moves again: it is a world object, so the pull-back
// shrinks it into a small tag at the notch.
//
// THE BREACH IS THE TAG'S BOTTOM-LEFT CORNER, NOT ITS CENTRE. Centred on the
// breach — which is what the brief asks for — a 150 px tile spans x 111 to 261,
// and the whole of the climb the cut has just spent thirty frames drawing (x
// 126.75 to 186.27) is behind it. Rendered and looked at: the tag lands and the
// climb disappears. Anchoring its left edge on the breach instead puts the tile
// on the empty sheet to the RIGHT of the cliff — where, at this zoom, there is
// nothing yet, and at k 1.00 the line is below the tile's band for all but about
// nine px of its width. It still stands on the top of the cliff and it still
// carries its contact shadow; it is a flag planted at the edge rather than a
// label pasted over the thing it names.
//
// TAG_F0 IS 2, NOT THE BRIEF'S 22, AND THE TAG TRACKS THE HEAD'S x. Two rules
// collide at f22. "Nothing pops in" wants the tag to start above the top of the
// frame, and the descent from outside the frame to the landing is 745 screen px
// at k 2.30; that under a 45 px/frame cap is 28 frames however it is eased.
// Swept again on the REV 3 geometry at warp 1: f0 measures 37.4 px/frame, f2
// 39.3, f4 41.7, f6 44.5, f8 48.0, f10 52.4. f2 is kept — it is the frame REV 1
// and REV 2 were approved on and it is comfortably inside the cap. Starting at
// f22 would either pop the tag in inside the frame or run it far over the cap.
// So the descent takes the frames it needs and starts two frames in, coming down
// through "very hard to find" and landing on "that MOMENT". The second half of
// the fix is that its x is the HEAD's x, not the breach's: the tag comes down
// directly above the head and lands on it, so at no point is there a marker
// sitting out in front of the line showing the viewer where the moment is
// before the line gets there. FLOW_A_TAG 0.15 (rather than 0.28) spends the
// ease on the travel instead of the ends; the tag is off-frame for the whole
// ease-in, so nothing is lost by making it short.
// ---------------------------------------------------------------------------
export const TAG = { w: EFX_REST.w / 2, h: EFX_REST.h / 2 }; // 150 x 48
export const TAG_F0 = 2; // two frames in: the earliest the cap allows
export const TAG_F1 = CLIMB_F1; // it lands the frame the head reaches the breach
export const TAG_Y1 = PY(I_BREACH) - TAG.h / 2; // 865.68: bottom edge on the line
// Its bottom-LEFT corner is the breach, not its centre — see the note above.
export const TAG_X1 = PX(I_BREACH) + TAG.w / 2; // 658.19: the tile's centre once landed
export const FLOW_A_TAG = 0.15;
// TAG_WARP IS 1.0 IN REV 3 — the warp is retired with the zoom that justified
// it. It was 1.25 because the descent is a world-space `flow` while the cap is a
// SCREEN-space number, and REV 2's camera was widening 3.60 -> 2.35 underneath
// the falling tile; moving the tile's speed to where the frame had already
// opened bought 6 px/frame there. At k 2.30 -> 2.28 there is nothing to move it
// into, and the warp now COSTS: measured, the tag's worst frame is 39.3
// px/frame at warp 1 and 44.5 at 1.25. The landing is untouched either way —
// the warp is inside the ease, so f30 is still exactly 1.
export const TAG_WARP = 1;
export const TAG_CONTACT_IN = 6; // the contact shadow fades in over the last six

export const LEAK_START = TAG_F1; // the leak starts the frame the tag lands
export const LEAK_SEED = 37;

// ---------------------------------------------------------------------------
// THE CAMERA. Three moves through one damped tracker, and the tracker damps cx
// as well as cy and k because the OPENING pans: the frame rides the head 45
// world px to the right across the climb. The pull-back barely pans at all (8
// world px) — under the twenty-year mapping the chart is already nearly centred
// on the breach. `cy = c + CAM_LIFT / k` off the same eased k, so
// the content centre sits on screen y 835, above the burnt-in captions, at
// every zoom.
//
//   OPEN  f0-f28   one follow: cx rides the climbing head and hands off to the
//                  anchor while k eases 2.30 -> 2.28. Lands at f28, two frames
//                  before "moment"
//   (held breath f30-f38: eight frames, the cut's only one. The camera is the
//    one still thing while the price falls; the leak, the sheet's own drift and
//    the fall itself are all running under it.)
//   LETGO f38-f78  one move: k 2.28 -> 1.00, cx 548 -> 540, content 879 -> 840
//
// LETGO IS ONE MOVE AND NOT TWO. It was built as two — a release and a reveal,
// split at f58 — and the camera's own screen speed came out as two lobes with a
// dead spot between them: 16.4 px/frame at f46, down to 3.1 at f59, back up to
// 13.6 at f67. That is the stall the house warns about, and it is what two
// contiguous eases always do, because `camEase` has zero slope at both of its
// ends. One move with warp 0.75 is a single deceleration lobe (peak 20.7 at
// f50, monotone to nothing by f70) with the damper's own settle behind it.
//
// THE PAN HAS ITS OWN WARP (1.6) AND THE ZOOM'S IS 0.75. They are one move —
// one `camMove3`, one eased curve each, both landing together — but they must
// not run on the same clock, because the two axes are answering different
// things. The zoom is answering the picture getting bigger than the frame, and
// wants its speed early. The pan is answering WHERE THE DRAWN LINE IS, and the
// drawn line is still only as far as 2018 when the zoom is half done: on one
// clock the frame has already walked to x 399 while the line ends at x 441, so
// 300 px of the right of frame is empty sheet and the chart is jammed into the
// bottom-left. Measured over f46-f92 as |left margin − right margin| in screen
// px, a single clock averages 326 px of imbalance and peaks at 751; giving the
// pan warp 1.6 takes that to 194 and 380, and takes the reveal front's worst
// frame from 41.5 to 35.2 as well, because a frame that hangs back is a frame
// the head is not racing.
//
// f38 IS THE KEY AND f78 IS THE END, FOR THE BRIEF'S f44-f80. The damper
// (CAM_STIFF 0.09 / CAM_DAMP 0.468) costs about six frames on a move this size,
// so a key at f44 lands at f86, five frames past "chart". Keyed at f38 — the
// frame the held breath ends — k is 1.019 at f80 and 1.001 at f86: landed
// before the word, which is what the brief is actually asking for. It also
// takes the last third of the fall down to k 2.19, which is where the drop's
// measured 44.1 px/frame comes from.
// ---------------------------------------------------------------------------
export const K_WIDE = 1.0;
// CX_ROOM / C_ROOM ARE SOLVED FROM THE FRAMING, NOT WRITTEN DOWN (REV 3): the
// brief asks for the breach at screen (620, 860) on the breath frame, so
//     CX_ROOM = xBreach - (620 - 540) / K_ROOM
//     C_ROOM  = yBreach - (860 - 960) / K_ROOM - CAM_LIFT / K_ROOM
// which at the new mapping is 548.10 / 878.71. Under the new mapping the breach
// sits at x 583 — a third of the way along a chart that is centred on x 540 —
// so the pull-back is now almost PURE ZOOM: the pan is 8 world px and the tilt
// 39, against REV 2's 326 and 238. That is not a move that got lost, it is the
// twenty-year picture already being nearly centred on the moment.
export const CX_ROOM = PX(I_BREACH) - (620 - 540) / K_ROOM; // 548.10
export const CX_WIDE = 540;
export const C_ROOM = PY(I_BREACH) - (860 - 960) / K_ROOM - CAM_LIFT / K_ROOM; // 878.71
export const C_WIDE = 840;
export const CY_FINAL = C_WIDE + CAM_LIFT / K_WIDE;

// WHERE THE HEAD SITS AT f0, in screen px, rather than where the camera sits in
// world px: the framing is the thing being chosen, and the world number follows
// from it. Lower-left third of the frame, so the whole climb has room up and to
// the right. (960 - CAM_LIFT = 835 is the screen row the content centre lands
// on at every zoom, so an offset is measured from there, not from 960.)
//
// (520, 1100) IS THE BRIEF'S "head at screen approximately (420, 1150)", MOVED
// 100 px right and 50 px up, and the reason is the brief's own acceptance test:
// "the line must cross the frame as a clear rising diagonal". The head's screen
// x at f0 is exactly how much frame there is to the LEFT of it for the drawn
// history to occupy, so it is the dial that sets how full the opening is.
// Measured with the scan's FRAMING block, drawn stroke inside the frame at f0 /
// f14 and the f0 bounding box:
//     (420, 1150)  1503 / 2175 px   box 422 x 338 at y 1145
//     (480, 1150)  1687 / 2318 px   box 482 x 342 at y 1145
//     (520, 1100)  1785 / 2377 px   box 521 x 359 at y 1095
//     (570, 1260)  1946 / 2453 px   but the head is PARKED — screen 570 at f0,
//                                   570 at f14 — because the follow is holding
//                                   it while the anchor it hands off to is at
//                                   615, and a camera that does not move for
//                                   fourteen frames is the thing the house
//                                   forbids.
// 520 is the last value where the head still drifts right across the climb
// (520 -> 535 -> 612) instead of standing still, and the extra 50 px of lift
// keeps the oldest, lowest end of the line out of the caption band: the box runs
// screen y 1095 -> 1454 rather than 1145 -> 1483.
//
// What that buys, measured: the visible world at f0 is 470 x 835 px around
// (460.0, 1011.8), which is 2009.4 -> 2019.5, so the stroke — already drawn from
// x 100, no draw-on and no fade — enters the frame at the left edge just after
// the crisis low and rises to the head at (520, 1100). Over the climb the head
// runs to (612, 846) at f30 and the drawn box grows to 613 x 770, more than half
// the frame, with the right of frame left as the sheet the next nine years grow
// into. The brief asked for at least 500 px of drawn line at f0; there are
// 1,785.
export const OPEN_SCREEN_X = 520;
export const OPEN_SCREEN_Y = 1100;
export const OPEN_OFF_X = (540 - OPEN_SCREEN_X) / K_OPEN; // +50.97 world px
export const OPEN_OFF_Y = (960 - CAM_LIFT - OPEN_SCREEN_Y) / K_OPEN; // -101.61
export const OPEN_WARP_C = 1;
export const OPEN_HEAD_0 = headAt(headM(0));
export const C_OPEN = OPEN_HEAD_0.y + OPEN_OFF_Y; // 1045.74

type Track = { F: number[]; K: number[]; CX: number[]; CY: number[] };

// `camMove`, with a horizontal key alongside the zoom and the tilt. Same
// contract as fieldShared's: one key per frame off the eased curve, and cy
// taken off the EASED k so the content centre cannot sag away from its own
// zoom.
const camMove3 = ({
  f0,
  f1,
  k0,
  k1,
  cx0,
  cx1,
  c0,
  c1,
  warp = 1,
  warpX = warp,
}: {
  f0: number;
  f1: number;
  k0: number;
  k1: number;
  cx0: number;
  cx1: number;
  c0: number;
  c1: number;
  warp?: number;
  warpX?: number;
}): Track => {
  if (f1 <= f0) throw new Error(`camMove3: f${f0}-${f1} is not a forward move`);
  const F: number[] = [];
  const K: number[] = [];
  const CX: number[] = [];
  const CY: number[] = [];
  const span = f1 - f0;
  for (let i = 0; i <= span; i++) {
    const g = camEase(i / span, warp);
    const k = k0 + (k1 - k0) * g;
    F.push(f0 + i);
    K.push(k);
    CX.push(cx0 + (cx1 - cx0) * camEase(i / span, warpX));
    CY.push(c0 + (c1 - c0) * g + CAM_LIFT / k);
  }
  return { F, K, CX, CY };
};

// OPEN — the one widening, f0-f28. It is not a `camMove3` because its cx is not
// a number: over the climb the camera's horizontal target is THE HEAD ITSELF,
// offset so the head sits in the lower-left third, cross-faded on one eased
// curve into the anchor the rest of the cut already uses —
//
//     cx(f) = (1 - g)·(head(f).x + OPEN_OFF_X) + g·CX_ROOM,  g = camEase(f/28)
//
// At f0 that is a pure follow; at f28 it is the anchor exactly, and because g'
// is zero there AND the head's term is weighted by (1 - g), it arrives with zero
// target velocity — the follow hands off to the park without a kink. k rides the
// same clock, so the frame is already letting go before the cliff.
//
// THE FOLLOW IS HORIZONTAL ONLY, AND THAT IS NOT A HALF-MEASURE. Tracking the
// head vertically as well was built and measured first: the head climbs 87 world
// px over these 28 frames, so a cy that follows it CANCELS THE CLIMB — the thing
// the whole phase exists to show — and, because the follow target then has to
// cross-fade back down to the anchor, the camera bobs up 62 world px and back
// down again (measured content centre: 1036 -> 1015 at f10 -> 1077 at f30), a
// wobble that also added 14 screen px/frame to the head's own speed and left the
// camera still creeping at 4.6 px/frame into the held breath. So the tilt is one
// plain eased key, C_OPEN -> C_ROOM (32 world px, monotone down), the head's
// climb is allowed to be the vertical motion, and the follow does the axis the
// head is actually travelling along.
export const OPEN: Track = (() => {
  const F: number[] = [];
  const K: number[] = [];
  const CX: number[] = [];
  const CY: number[] = [];
  for (let f = 0; f <= OPEN_F1; f++) {
    const gk = camEase(f / OPEN_F1, OPEN_WARP_K);
    const g = camEase(f / OPEN_F1, OPEN_WARP_C);
    const k = K_OPEN + (K_ROOM - K_OPEN) * gk;
    const h = headAt(headM(f));
    F.push(f);
    K.push(k);
    CX.push((h.x + OPEN_OFF_X) * (1 - g) + CX_ROOM * g);
    CY.push(C_OPEN + (C_ROOM - C_OPEN) * g + CAM_LIFT / k);
  }
  return { F, K, CX, CY };
})();

export const LETGO = camMove3({
  f0: 38,
  f1: 78,
  k0: K_ROOM,
  k1: K_WIDE,
  cx0: CX_ROOM,
  cx1: CX_WIDE,
  c0: C_ROOM,
  c1: C_WIDE,
  warp: 0.75,
  warpX: 1.6,
});

// OPEN ends on the anchor and LETGO starts on it, so f28-f38 is one constant
// target — the held breath — with no key written in it. `interpolate` wants a
// strictly increasing input range, so a repeated join frame is dropped; the
// tracks agree on their shared values by construction, so that drops nothing.
const mergeTracks = (tracks: Track[]): Track => {
  const out: Track = { F: [], K: [], CX: [], CY: [] };
  for (const t of tracks) {
    for (let i = 0; i < t.F.length; i++) {
      if (out.F.length > 0 && t.F[i] <= out.F[out.F.length - 1]) continue;
      out.F.push(t.F[i]);
      out.K.push(t.K[i]);
      out.CX.push(t.CX[i]);
      out.CY.push(t.CY[i]);
    }
  }
  return out;
};

const CAM = mergeTracks([
  OPEN,
  LETGO,
  { F: [DURATION], K: [K_WIDE], CX: [CX_WIDE], CY: [CY_FINAL] },
]);
export const CAM_F = CAM.F;
export const CAM_K = CAM.K;
export const CAM_CX = CAM.CX;
export const CAM_CY = CAM.CY;

// fieldShared's `runCamera` with a third axis. Same stiffness and damping, so a
// pan has exactly the weight a zoom does.
export const runCamera3 = (upto: number) => {
  let cx = CAM_CX[0];
  let cy = CAM_CY[0];
  let k = CAM_K[0];
  let vx = 0;
  let vy = 0;
  let vk = 0;
  for (let f = 1; f <= upto; f++) {
    const tx = interpolate(f, CAM_F, CAM_CX, clamp);
    const ty = interpolate(f, CAM_F, CAM_CY, clamp);
    const tk = interpolate(f, CAM_F, CAM_K, clamp);
    vx += (tx - cx) * CAM_STIFF - vx * CAM_DAMP;
    cx += vx;
    vy += (ty - cy) * CAM_STIFF - vy * CAM_DAMP;
    cy += vy;
    vk += (tk - k) * CAM_STIFF - vk * CAM_DAMP;
    k += vk;
  }
  return { cx, cy, k };
};

// WHERE THE TAG STARTS is read off that camera rather than written down: the
// top of the frame at TAG_F0, less half the tile, less eight world px of
// clearance. So the tile is genuinely outside the frame on the frame it starts,
// and it stays outside it if the camera is ever re-keyed.
export const TAG_Y0 = (() => {
  const c = runCamera3(TAG_F0);
  return c.cy - 960 / c.k - TAG.h / 2 - 8;
})();

// ---------------------------------------------------------------------------
// THE LINE. One path, drawn head-led, in three pieces so that the six sessions
// of the breach can be the accent once they exist without the line ever being
// broken: 0 -> I_BREACH in ink, I_BREACH -> I_LOW in the accent, I_LOW -> the
// end in ink. The pieces share their endpoints exactly, so at any head there is
// one continuous stroke.
// ---------------------------------------------------------------------------
export const WORLD_W = 1080;
export const WORLD_H = 1400;

export const subPath = (a: number, b: number, head: Head) => {
  if (head.i < a) return "";
  const last = Math.min(b, head.i);
  let d = `M${PX(a).toFixed(2)} ${PY(a).toFixed(2)}`;
  for (let i = a + 1; i <= last; i++) d += `L${PX(i).toFixed(2)} ${PY(i).toFixed(2)}`;
  // the partial segment the head is standing in, if it has not passed `b`
  if (head.i < b) d += `L${head.x.toFixed(2)} ${head.y.toFixed(2)}`;
  return d;
};

// ---------------------------------------------------------------------------
// THE TAG OCCLUDES WHAT IS BEHIND IT — INCLUDING THROUGH ITS OWN KNOCK-OUT.
// The house tile is white with the wordmark KNOCKED OUT so the sheet shows
// through, and in cut 1 there is only sheet behind it. Here there is a chart:
// once the camera has pulled back, 2018-2019 runs at $143-$159, which is exactly
// the band the landed tile occupies, so the white line was showing through the
// letters — rendered and looked at, the "A" of EQUIFAX filled in solid at f107.
// A knock-out shows the PAPER, not whatever happens to be behind the tile, so
// the chart is drawn through a mask that subtracts the tile's own squircle. The
// line then passes behind the tag the way it looks like it should, the letters
// stay paper, and nothing else changes: the amber leg starts at the tile's
// bottom-LEFT corner and falls away from it, and the climb is entirely to the
// left of the tile's x span, so neither is touched.
// ---------------------------------------------------------------------------
export const OCCLUDE_ID = "htf-behind-tag";

export const defaultProps: Props = schema.parse({
  ink: "#FFFFFF",
  accent: ACCENT,
  accentDeep: ACCENT_DEEP,
  backgroundBase: KRAFT_BASE,
  backgroundSrc: KRAFT_SRC,
  backgroundBlur: KRAFT_BLUR,
  backgroundDim: KRAFT_DIM,
  parallax: 0.15,
  shadowY: SHADOW_Y,
  shadowBlur: SHADOW_BLUR,
  shadowOpacity: SHADOW_OPACITY,
  iconShadowY: ICON_SHADOW_Y,
  iconShadowBlur: ICON_SHADOW_BLUR,
  iconShadowOpacity: ICON_SHADOW_OPACITY,
  lineWidth: 3.5,
  tagW: TAG.w,
  tagH: TAG.h,
  beats: {
    its: 0,
    very: 1,
    hard: 6,
    to: 10,
    find: 13,
    that: 22,
    moment: 30,
    inn: 46,
    the: 52,
    equifax: 54,
    stock: 65,
    price: 74,
    chart: 81,
    end: 92,
  },
});

const HardToFind: React.FC<Props> = ({
  ink,
  accent,
  backgroundBase,
  parallax,
  shadowY,
  shadowBlur,
  shadowOpacity,
  iconShadowY,
  iconShadowBlur,
  iconShadowOpacity,
  lineWidth,
  tagW,
  tagH,
}) => {
  const frame = useCurrentFrame();

  // -- the camera ------------------------------------------------------------
  const cam = runCamera3(frame);
  const drift = sway(frame);
  const cx = cam.cx + drift.dx;
  const cy = cam.cy + drift.dy;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);

  // -- the head, and the line behind it --------------------------------------
  const head = headAt(headM(frame));
  const dInk1 = subPath(0, I_BREACH, head);
  const dFall = subPath(I_BREACH, I_LOW, head);
  const dInk2 = subPath(I_LOW, N_PTS - 1, head);

  // -- the tag ---------------------------------------------------------------
  // It descends on `flow` from above the frame, its x always the head's own, and
  // stops for good the frame the head reaches the breach.
  const tagU = clamp01((frame - TAG_F0) / (TAG_F1 - TAG_F0));
  const tagG = flow(Math.pow(tagU, TAG_WARP), FLOW_A_TAG);
  const tagX = frame >= TAG_F1 ? TAG_X1 : head.x + TAG.w / 2;
  const tagY = TAG_Y0 + (TAG_Y1 - TAG_Y0) * tagG;
  const tagOn = frame >= TAG_F0;
  const contact =
    CONTACT_SHADOW_OP *
    smoothstep((frame - (TAG_F1 - TAG_CONTACT_IN)) / TAG_CONTACT_IN);

  // -- the leak --------------------------------------------------------------
  // A breach: records falling out of the tile's bottom edge, which is the line
  // at the top of the cliff. Drawn UNDER the line and the tag, so they emerge
  // from beneath the tag rather than out of its face.
  const dots = leakDots({
    frame,
    seed: LEAK_SEED,
    start: LEAK_START,
    rate: LEAK_FAST,
    x: TAG_X1,
    y: PY(I_BREACH),
    width: tagW,
  });

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <KraftBackground
        frame={frame}
        cy={cy}
        cyRest={CAM_CY[0]}
        cx={cx}
        cxRest={CAM_CX[0]}
        k={k}
        parallax={parallax}
      />

      <AbsoluteFill
        style={{ filter: `drop-shadow(0 ${shadowY}px ${shadowBlur}px rgba(0,0,0,${shadowOpacity}))` }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: WORLD_W,
            height: WORLD_H,
            transformOrigin: "0 0",
            transform: `translate(${tx}px, ${ty}px) scale(${k})`,
          }}
        >
          <svg
            width={WORLD_W}
            height={WORLD_H}
            viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          >
            <defs>
              <mask
                id={OCCLUDE_ID}
                maskUnits="userSpaceOnUse"
                x={-WORLD_W}
                y={-WORLD_H}
                width={WORLD_W * 3}
                height={WORLD_H * 3}
              >
                <rect
                  x={-WORLD_W}
                  y={-WORLD_H}
                  width={WORLD_W * 3}
                  height={WORLD_H * 3}
                  fill="#fff"
                />
                {tagOn ? (
                  <path
                    d={squirclePath(tagW, tagH, SQUIRCLE_RATIO, SQUIRCLE_SMOOTH)}
                    transform={`translate(${tagX - tagW / 2} ${tagY - tagH / 2})`}
                    fill="#000"
                  />
                ) : null}
              </mask>
            </defs>

            {/* the records already in the air, under everything */}
            {dots.map((d) => (
              <DataDot key={d.key} x={d.x} y={d.y} k={k} opacity={d.opacity} color={accent} />
            ))}

            {/* the chart. No axes, no grid, no labels: the line is the chart. */}
            <g
              mask={`url(#${OCCLUDE_ID})`}
              style={{ filter: icon }}
              fill="none"
              strokeWidth={lineWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {dInk1 ? <path d={dInk1} stroke={ink} /> : null}
              {dInk2 ? <path d={dInk2} stroke={ink} /> : null}
              {/* the six sessions, in the accent from the frame they exist */}
              {dFall ? <path d={dFall} stroke={accent} /> : null}
            </g>

            {/* the moment itself: Equifax, standing on the top of the cliff */}
            {tagOn ? (
              <>
                {contact > 0.002 ? (
                  <ellipse
                    cx={tagX}
                    cy={tagY + tagH / 2 + 1}
                    rx={tagW * CONTACT_SHADOW_RX}
                    ry={CONTACT_SHADOW_RY}
                    fill="#000"
                    opacity={contact}
                    style={{ filter: "blur(3px)" }}
                  />
                ) : null}
                <BrandTile x={tagX} y={tagY} brand="EQUIFAX" w={tagW} h={tagH} k={k} opacity={1} />
              </>
            ) : null}
          </svg>
        </div>
      </AbsoluteFill>

      <Vignette strength={0.55} />
    </AbsoluteFill>
  );
};

export default HardToFind;
