// ---------------------------------------------------------------------------
// pageFigures: the engraved FIGURES of the V2 page cuts (ConquistadorsMusterV2,
// AgainstAlmostHundredThousandV2, KdRatioOfInfinityV2): every man a small
// figure in the house engraved manner (one stroke family: a DARK casing under
// everything, the fill, a thin dark contour and a hatch line or two), drawn
// once per variant / look / size into sprite canvases and blitted with
// drawImage, so tens of thousands of men stay fast.
//
// FIGURES (glyph units; people stand 100 units tall, feet at (0, 0), up negative)
//   inca 0..3   an Inca warrior, front view: llauto headband, the chequered
//               tunic of the Inca soldier (a 2 x 3 chequer), bare legs; in hand
//               0 a star-mace raised, 1 a sling whirled overhead, 2 a star-mace
//               held low, 3 a sling hanging (another stance). Leans -4/0/+4 deg.
//   foot 0..2   a conquistador on foot, three-quarter front: crested morion
//               (curved brim, comb), peascod breastplate, puffed breeches, legs
//               apart; a pike held upright, taller than the man. 0 standing,
//               1 / 2 the two poses of his step.
//   horse       a conquistador horseman in profile (adapted from incaGlyphs'
//               Horseman: the same horse, rider and morion) with a lance:
//               upright when standing or walking, couched forward at the
//               gallop. Poses: stand, walk 0/1, gallop 0/1/2; facing left or
//               right. 57 units tall (helmet to hoof).
//   dead 0..3   the Inca warrior toppled on his side: rotated +-82/88/94/100 deg
//               about his middle (the heap's dead lie as variant 2 or 3: the
//               raised mace and whirled sling fall with them).
// LOOKS: cream (INK; the Inca), orange (ACCENT / ACCENT_DEEP; Pizarro's side),
// dead (cream; its tone is set when the heap's layer is laid down). Small
// cream figures take a lighter hand (crowdInk: thinner, lighter casing and
// contour, no hatching at 16 px), or a crowd of them reads as a dark smudge;
// the dead lighter still (their pile is all overlap).
// SIZES: each sprite at 16, 32, 64 and 128 px (the figure's reference height);
// a figure is blitted from the smallest sprite at least as large as it.
//
// API
//   FIG                       the reference heights in WORLD px (KdRatioOfInfinity's world)
//   SpriteCanvas cam draw     a full-frame canvas; draw(ctx, sprites) each frame
//   sprites.fig(ctx, key, sx, sy, hPx, alpha?, rotDeg?)
//                             blit figure `key` with its anchor at screen (sx, sy),
//                             its reference height hPx screen px
//   FigureSheet               the sheet (16 / 32 / 64 px, cream / orange / dead)
// ---------------------------------------------------------------------------
import React, { useLayoutEffect, useRef } from "react";
import { AbsoluteFill } from "remotion";
import { loadFont as loadFell } from "@remotion/google-fonts/IMFellEnglish";
import { ACCENT, ACCENT_DEEP, DARK, INK, FRAME_H, FRAME_W, hash, mixColor, type Cam } from "./incaShared";
import { GALLOP, STAND } from "./incaGlyphs";

const { fontFamily: fell } = loadFell("normal", { weights: ["400"], subsets: ["latin"] });

/** reference heights in WORLD px (front rank, scale 1); a horseman (hoof to helmet) stands 1.25x a man on foot */
export const FIG = { inca: 19, foot: 20, horse: 25, dead: 19 };

type Look = "cream" | "orange" | "dead" | "pile";
/** the page under the heap (LAND with its mottle and vignette, averaged) */
const PAGE_UNDER = "#3A3025";
/** the dead tone: every body in the heap is drawn OPAQUE in the cream premixed
 *  onto the page at this tone, so its DARK casing keeps its full weight (a
 *  layer composited at 0.32 would take it down to a fifth). R2: lifted from
 *  0.32 to 0.44 (not thinner casings): a pile of whole-cased bodies is mostly
 *  casing and edge, and at 0.32 the heap's mean (65) sat barely above the page
 *  (58); at 0.44 it is 77, clearly below the living crowd (~116) */
export const DEAD_TONE = 0.44;
const premix = (t: number) => ({ main: mixColor(PAGE_UNDER, INK, t), deep: mixColor(PAGE_UNDER, "#CDBF9C", t), shade: mixColor(PAGE_UNDER, "#B9AA86", t) });
const COLORS: Record<Look, { main: string; deep: string; shade: string }> = {
  cream: { main: INK, deep: "#CDBF9C", shade: "#B9AA86" },
  dead: { main: INK, deep: "#CDBF9C", shade: "#B9AA86" },
  orange: { main: ACCENT, deep: ACCENT_DEEP, shade: "#B87108" },
  // the heap: one uniform pile of bodies, opaque at the dead tone
  pile: premix(DEAD_TONE),
};

// ---------------------------------------------------------------------------
// Parts: a figure is a list of parts drawn in three passes (casing, fill,
// detail). Paths are SVG path strings in glyph units.
// ---------------------------------------------------------------------------
type Part = {
  d: string;
  fill?: "main" | "deep" | "shade" | "dark";
  stroke?: "main" | "deep" | "dark";
  w?: number; // stroke width (units) for stroked parts
  detail?: boolean; // a thin dark line drawn after the fills (contour / hatch)
  dw?: number; // detail width in units (default: thin)
  da?: number; // detail alpha
  noCase?: boolean;
};
const P = (d: string, o: Omit<Part, "d"> = {}): Part => ({ d, ...o });
const circle = (cx: number, cy: number, r: number) => `M${cx - r},${cy} a${r},${r} 0 1 0 ${2 * r},0 a${r},${r} 0 1 0 ${-2 * r},0 Z`;
const rect = (x0: number, y0: number, x1: number, y1: number) => `M${x0},${y0} L${x1},${y0} L${x1},${y1} L${x0},${y1} Z`;
/** a tapering limb from a to b (widths wa, wb) as a filled quad */
const limb = (a: [number, number], b: [number, number], wa: number, wb: number) => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L;
  const ny = dx / L;
  const f = (p: [number, number], n: number, s: number) => `${(p[0] + nx * n * s).toFixed(2)},${(p[1] + ny * n * s).toFixed(2)}`;
  return `M${f(a, wa / 2, 1)} L${f(b, wb / 2, 1)} L${f(b, wb / 2, -1)} L${f(a, wa / 2, -1)} Z`;
};
/** a six-pointed star (the star-mace's head) */
const star = (cx: number, cy: number, r: number, ri: number) => {
  let d = "";
  for (let i = 0; i < 12; i++) {
    const a = (Math.PI * i) / 6 - Math.PI / 2;
    const rr = i % 2 ? ri : r;
    d += `${i ? "L" : "M"}${(cx + rr * Math.cos(a)).toFixed(2)},${(cy + rr * Math.sin(a)).toFixed(2)}`;
  }
  return `${d}Z`;
};

// ---- THE INCA WARRIOR -----------------------------------------------------
const INCA_PARTS = (v: number): Part[] => {
  const stance = v === 3 ? 1.6 : 0;
  // v 5 (a dead pose): the right leg flung out, bent at the knee
  const legs =
    v === 5
      ? [
          P(limb([-4.6, -38], [-7.6, -1.5], 6.4, 4.6), { fill: "main" }),
          P(limb([4.6, -38], [17.6, -21], 6.4, 5.2), { fill: "main" }),
          P(limb([17.6, -21], [15.4, -2], 5.2, 4.6), { fill: "main" }),
          P("M-10.6,-0.6 L-5,-0.6 M12.8,-0.6 L18.4,-0.6", { stroke: "dark", w: 2.2, noCase: true }),
        ]
      : [
          P(limb([-4.6, -38], [-7.6 - stance, -1.5], 6.4, 4.6), { fill: "main" }),
          P(limb([4.6, -38], [7.6 + stance, -1.5], 6.4, 4.6), { fill: "main" }),
          P(`M${-10.6 - stance},-0.6 L${-5 - stance},-0.6 M${5 + stance},-0.6 L${10.6 + stance},-0.6`, { stroke: "dark", w: 2.2, noCase: true }),
        ];
  // the arms: the right (+x) arm carries the weapon; the left hangs or holds the sling
  const armL = v === 3 ? limb([-10.2, -68], [-15.4, -47], 4.8, 3.8) : limb([-10.2, -68], [-14.4, -46], 4.8, 3.8);
  const armR =
    v === 0
      ? limb([10.2, -68], [18.6, -88], 4.8, 3.9)
      : v === 1
        ? limb([10.2, -68], [15.6, -93], 4.8, 3.9)
        : v === 2
          ? limb([10.2, -68], [17.6, -47], 4.8, 3.8)
          : v === 4
            ? limb([10.2, -68], [24, -86], 4.8, 3.9) // a dead pose: the arm flung out, the hand empty
            : v === 5
              ? limb([10.2, -68], [26, -62], 4.8, 3.9) // a dead pose: the arm thrown out
              : limb([10.2, -68], [18.4, -57], 4.8, 3.8);
  const weapon: Part[] =
    v === 4
      ? // the star-mace dropped, lying beyond his head
        [P("M-13,-100 L-27,-112", { stroke: "deep", w: 2.6 }), P(star(-29.4, -114, 6, 2.8), { fill: "main" })]
      : v === 5
        ? // the sling dropped beside him
          [P("M-18,-30 C-24,-24 -26,-14 -22,-8", { stroke: "dark", w: 1.3, noCase: true, da: 0.85 }), P(circle(-21.6, -6.4, 2.8), { fill: "deep" })]
        : v === 0
      ? [P("M18.2,-86 L21.8,-106", { stroke: "deep", w: 2.6 }), P(star(22.4, -109.5, 6.4, 3.0), { fill: "main" })]
      : v === 1
        ? [
            P("M15.4,-93 C11,-106 -2,-115 -10.6,-109 C-15.8,-105 -10.6,-97 -3.6,-101", { stroke: "dark", w: 1.3, noCase: true, da: 0.85 }),
            P(circle(-4.6, -101.2, 3.0), { fill: "deep" }),
          ]
        : v === 2
          ? [P("M17.4,-48 L24.6,-31", { stroke: "deep", w: 2.6 }), P(star(25.8, -28.4, 5.6, 2.6), { fill: "main" })]
          : [P("M-15.4,-47 C-16.6,-40 -16.4,-34 -15.6,-29", { stroke: "dark", w: 1.3, noCase: true, da: 0.85 }), P(circle(-15.6, -27.4, 2.8), { fill: "deep" })];
  return [
    ...legs,
    P(armL, { fill: "main" }),
    // the tunic (unku), a little flared, the chequer of the Inca soldier on its lower half
    P("M-10.6,-72.4 C-6,-74 6,-74 10.6,-72.4 L14.2,-36 L-14.2,-36 Z", { fill: "main" }),
    P(rect(-9, -60, -2.6, -53) + rect(2.6, -53, 9, -46) + rect(-9, -46, -2.6, -39.4) + rect(-2.6, -53, 2.6, -46.2) + rect(2.6, -60, 9, -53.4) , { fill: "dark", noCase: true }),
    P("M-11.6,-62 L11.6,-62", { detail: true, da: 0.55 }),
    P("M-14.6,-36 L14.6,-36", { detail: true, da: 0.5 }),
    P(armR, { fill: "main" }),
    ...weapon,
    // neck, head, the llauto (a dark band round the head with a fringe)
    P(rect(-3, -76, 3, -71), { fill: "main" }),
    P(circle(0, -83, 8.4), { fill: "main" }),
    // the llauto: a braided band wound round the head at the brow, its tassel
    P("M-8.4,-84.6 C-4,-82.6 4,-82.6 8.4,-84.6", { stroke: "dark", w: 2.4, noCase: true, da: 0.78 }),
    P("M-8.2,-84 L-10.2,-77.6", { stroke: "dark", w: 1.2, noCase: true, da: 0.6 }),
  ];
};

// ---- THE CONQUISTADOR ON FOOT ---------------------------------------------
const FOOT_PARTS = (pose: number): Part[] => {
  // pose 0 standing (legs apart); 1 / 2 the step (one knee forward, one foot lifted)
  const legL = pose === 1 ? limb([-4.2, -40], [-6.6, -3.6], 5.6, 4.6) : pose === 2 ? limb([-4.2, -40], [-9.6, -1.5], 5.6, 4.6) : limb([-4.2, -40], [-9.8, -1.5], 5.6, 4.6);
  const legR = pose === 2 ? limb([4.2, -40], [6.6, -3.6], 5.6, 4.6) : pose === 1 ? limb([4.2, -40], [9.6, -1.5], 5.6, 4.6) : limb([4.2, -40], [9.8, -1.5], 5.6, 4.6);
  const fL = pose === 1 ? "M-9.6,-3.4 L-4.2,-3.4" : "M-13.2,-0.6 L-7.4,-0.6";
  const fR = pose === 2 ? "M4.2,-3.4 L9.6,-3.4" : "M7.4,-0.6 L13.2,-0.6";
  return [
    // the pike behind the man, taller than he is, a leaf head
    P("M15.6,2 L15.6,-124", { stroke: "deep", w: 2.4 }),
    P("M15.6,-123 L13.4,-128 L15.6,-138 L17.8,-128 Z", { fill: "main" }),
    P(legL, { fill: "main" }),
    P(legR, { fill: "main" }),
    P(`${fL} ${fR}`, { stroke: "dark", w: 2.4, noCase: true }),
    // puffed breeches
    P("M-11.4,-46 C-13.6,-40 -12.6,-35 -9,-34 L-1.6,-34.6 L1.6,-34.6 L9,-34 C12.6,-35 13.6,-40 11.4,-46 Z", { fill: "deep" }),
    P("M-6,-45 L-6.6,-35 M0,-45.4 L0,-35 M6,-45 L6.6,-35", { detail: true, da: 0.45 }),
    // the left arm down, the peascod breastplate with its ridge, the right arm to the pike
    P(limb([-10.6, -69], [-13.6, -48], 5.2, 4.2), { fill: "main" }),
    P("M-11.4,-72.6 C-13.8,-62 -12.6,-51 -1.2,-45.4 L1.2,-45.4 C12.6,-51 13.8,-62 11.4,-72.6 Z", { fill: "main" }),
    P("M0,-71 L0,-47.4", { detail: true, da: 0.6 }),
    P("M-8.6,-60 C-6,-55 -3.4,-51.6 -1,-49.6", { detail: true, da: 0.45 }),
    P(limb([10.8, -69], [16.2, -59], 5.2, 4.4), { fill: "main" }),
    P(limb([16.2, -59], [15, -54.4], 4.4, 4.0), { fill: "main" }),
    // neck, face, the crested morion (curved brim tipped up fore and aft, dome, comb)
    P(rect(-2.8, -77, 2.8, -72), { fill: "main" }),
    P(circle(0, -80.6, 6.8), { fill: "main" }),
    P("M-18.6,-91 C-11,-82 11,-82 18.6,-91 C14.6,-88.4 11.4,-88 9.4,-88.6 L-9.4,-88.6 C-11.4,-88 -14.6,-88.4 -18.6,-91 Z", { fill: "main" }),
    // the comb: a tall fin over the dome, a shade deeper, so even a small figure's helmet peaks
    P("M-6.4,-92.4 C-5.4,-106 5.4,-106 6.4,-92.4 C3,-94.2 -3,-94.2 -6.4,-92.4 Z", { fill: "deep" }),
    P("M-9,-88.2 C-9,-96.6 9,-96.6 9,-88.2 Z", { fill: "main" }),
    P("M-9,-88.2 L9,-88.2", { detail: true, da: 0.55 }),
  ];
};

// ---- THE HORSEMAN (adapted from incaGlyphs' Horseman, + a lance) -----------
const H_BODY =
  "M-20,-1.5 C-21,-6.6 -18.6,-10.6 -13.6,-11.2 C-9.6,-11.6 -5,-9.8 -0.6,-9.8 C3.6,-9.8 7.6,-11.4 11,-12.4 " +
  "C15.6,-15.4 20.4,-21.4 24.6,-25.8 L24.4,-29.8 L27,-26.6 C30.4,-24.2 34.6,-19.2 37.6,-15.4 C38.8,-13.8 38,-11.6 36,-11.6 " +
  "C33.6,-11.8 31.2,-13 29.2,-14.6 C28.4,-15.2 27.8,-15.6 27.4,-15.4 " +
  "C25.2,-11.6 22.8,-6.6 20.6,-2.2 C19.6,1.8 17.2,4.6 13.8,6 C7.6,7.8 -2.4,8 -9.2,7 " +
  "C-14,6.2 -17.6,4.6 -19.2,2.2 C-19.8,0.9 -20,-0.2 -20,-1.5 Z";
const H_TAIL = "M-18.2,-8.2 C-24.6,-9.4 -30.4,-6.8 -34.2,1.4 C-33.2,3.6 -31.2,4.2 -30.2,2.2 C-28.2,-1.4 -24.8,-3.2 -20.6,-2.4 C-19.4,-2.6 -18.6,-4.2 -18.2,-8.2 Z";
const H_MANE = "M12.2,-13.4 C15.2,-15.8 19,-20.6 23.4,-25.4";
const R_TORSO = "M-4.4,-9.4 C-4.8,-14.4 -3.4,-20.6 0.4,-25.2 L6.2,-23.4 C4.6,-19.2 3.6,-14.2 3.4,-9.6 Z";
const R_HEAD = circle(4.5, -28.6, 3.1);
const R_HELMET =
  "M-1.4,-31.2 C1.2,-29.2 8.2,-29.4 10.8,-31.8 C9,-31.4 8,-31.6 7.6,-32.2 C7.4,-35.4 5.6,-37.2 4.6,-37.4 " +
  "C3.4,-37.2 1.6,-35.4 1.4,-32.2 C0.8,-31.4 -0.2,-31.2 -1.4,-31.2 Z";
const R_ARM = "M3.4,-22.2 C6.4,-19.4 10.4,-17.4 14.6,-16.6";
const R_LEG = "M-1.6,-9.2 C1.6,-6.8 4.8,-4.2 6,-0.6 C5.2,1.6 4,3.4 3,5";
const H_HATCH = "M-13.4,4.4 C-6,6.2 4,6.4 11.6,4.6 M-16.4,-4.4 C-14.6,-1.4 -12.4,1 -9.4,2.6 M16.4,-8.4 C15.4,-4.4 14.4,-1.4 12.6,1.8";
type Leg = [number, number][];
const WALK: Leg[][] = [
  [
    [[14.6, 3.6], [19.8, 10.6], [18.6, 17.4]],
    [[11, 4.6], [9.2, 12.2], [6.6, 19.6]],
    [[-12.6, 3.8], [-16.6, 11.2], [-19.8, 19.6]],
    [[-16, 2.4], [-12.6, 10.6], [-9.8, 18.4]],
  ],
  [
    [[14.6, 3.6], [13.2, 11.8], [10.8, 19.6]],
    [[11, 4.6], [16.2, 11.4], [15.2, 17.6]],
    [[-12.6, 3.8], [-10.2, 11.4], [-7.4, 18.8]],
    [[-16, 2.4], [-19.8, 10.6], [-22.6, 19.6]],
  ],
];
const legShape = (l: Leg, wu: number, wl: number) => {
  const [a, b, c] = l;
  const n = (p: [number, number], q: [number, number]): [number, number] => {
    const L = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1;
    return [-(q[1] - p[1]) / L, (q[0] - p[0]) / L];
  };
  const n1 = n(a, b);
  const n2 = n(b, c);
  const nk: [number, number] = (() => {
    const x = n1[0] + n2[0];
    const y = n1[1] + n2[1];
    const L = Math.hypot(x, y) || 1;
    return [x / L, y / L];
  })();
  const Q = (p: [number, number], nn: [number, number], w: number, s: number) => `${(p[0] + nn[0] * w * s).toFixed(2)},${(p[1] + nn[1] * w * s).toFixed(2)}`;
  const wk = (wu * 0.45 + wl * 0.55) / 2;
  return `M${Q(a, n1, wu / 2, 1)} L${Q(b, nk, wk, 1)} L${Q(c, n2, wl / 2, 1)} L${Q(c, n2, wl / 2, -1)} L${Q(b, nk, wk, -1)} L${Q(a, n1, wu / 2, -1)} Z`;
};
const hoof = (l: Leg) => {
  const [k, h] = [l[1], l[2]];
  const L = Math.hypot(h[0] - k[0], h[1] - k[1]) || 1;
  const ux = (h[0] - k[0]) / L;
  const uy = (h[1] - k[1]) / L;
  return `M${(h[0] - ux * 1.6).toFixed(2)},${(h[1] - uy * 1.6).toFixed(2)} L${(h[0] + ux * 0.6).toFixed(2)},${(h[1] + uy * 0.6).toFixed(2)}`;
};
export type HorsePose = "stand" | "walk0" | "walk1" | "gallop0" | "gallop1" | "gallop2";
/** the horseman's parts in its profile frame (facing +x); the hooves stand at y ~19.6 */
const HORSE_PARTS = (pose: HorsePose): { parts: Part[]; rot: number; lift: number } => {
  const legs = pose === "stand" ? STAND : pose === "walk0" ? WALK[0] : pose === "walk1" ? WALK[1] : GALLOP[Number(pose.slice(-1))];
  const gi = pose.startsWith("gallop") ? Number(pose.slice(-1)) : -1;
  const rot = gi >= 0 ? [0, -2.6, 2.2][gi] : pose === "stand" ? -2.2 : -1.0;
  const lift = gi >= 0 ? [-0.8, -1.6, 0.9][gi] : -0.6;
  const lance = gi >= 0 ? "M-12,-21 L47,-27.6" : "M15.4,-4.6 L17.8,-63";
  const lanceHead = gi >= 0 ? "M46,-26 L54,-28.4 L46.4,-29.6 Z" : "M16.6,-62 L18,-70 L19.2,-62 Z";
  const legD = legs.map((l, i) => legShape(l, i < 2 ? 5.6 : 6.4, 2.9));
  return {
    rot,
    lift,
    parts: [
      P(legD[1], { fill: "deep" }),
      P(legD[3], { fill: "deep" }),
      P(hoof(legs[1]) + hoof(legs[3]), { stroke: "dark", w: 3.2, noCase: true, da: 0.8 }),
      P(H_TAIL, { fill: "deep" }),
      P(lance, { stroke: "deep", w: 1.9 }),
      P(lanceHead, { fill: "main" }),
      P(H_BODY, { fill: "main" }),
      P(legD[0], { fill: "main" }),
      P(legD[2], { fill: "main" }),
      P(hoof(legs[0]) + hoof(legs[2]), { stroke: "dark", w: 3.2, noCase: true, da: 0.8 }),
      P(H_HATCH, { detail: true, da: 0.55 }),
      P(H_MANE, { detail: true, da: 0.5 }),
      P(R_LEG, { detail: true, da: 0.62, dw: 1.3 }),
      P(R_TORSO, { fill: "main" }),
      P(R_ARM, { stroke: "main", w: 2.6 }),
      P(R_HEAD, { fill: "main" }),
      P(R_HELMET, { fill: "main" }),
    ],
  };
};

// ---------------------------------------------------------------------------
// Drawing a figure (three passes) into a 2D context in glyph units
// ---------------------------------------------------------------------------
const pathCache = new Map<string, Path2D>();
const path = (d: string) => {
  let p = pathCache.get(d);
  if (!p) {
    p = new Path2D(d);
    pathCache.set(d, p);
  }
  return p;
};
/** ink: the casing's and the thin contour's alpha (a crowd of small cream figures
 *  takes a lighter hand, or its mass of casings reads as a dark smudge) */
type Ink = { casing: number; contour: number; detail?: number; casingPx?: number; chequer?: number };
const FULL_INK: Ink = { casing: 0.78, contour: 0.5 };
/** small cream figures in a crowd: thinner, lighter casing and contour, no
 *  hatching at 16 px (it is wider there than a leg) */
const crowdInk = (px: number): Ink =>
  px <= 16 ? { casing: 0.3, contour: 0.18, detail: 0, casingPx: 0.5, chequer: 0.26 } : px <= 32 ? { casing: 0.36, contour: 0.28 } : FULL_INK;
const drawParts = (ctx: CanvasRenderingContext2D, parts: Part[], look: Look, unitsPerPx: number, ink: Ink = FULL_INK) => {
  const col = COLORS[look];
  const pick = (c: string | undefined) => (c === "dark" ? DARK : c === "deep" ? col.deep : c === "shade" ? col.shade : col.main);
  const casing = ink.casingPx !== undefined ? ink.casingPx * unitsPerPx : (0.75 + 1.4 * Math.min(1, 1 / (unitsPerPx * 12))) * unitsPerPx; // ~0.77 px at 16-32 px, ~2 px at 64+
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  // pass 1: the dark casing under everything
  ctx.strokeStyle = DARK;
  ctx.fillStyle = DARK;
  ctx.globalAlpha = ink.casing;
  for (const p of parts) {
    if (ink.casing <= 0) break;
    if (p.noCase || p.detail) continue;
    const pp = path(p.d);
    if (p.fill) {
      ctx.lineWidth = casing * 2;
      ctx.stroke(pp);
      ctx.fill(pp);
    } else if (p.stroke) {
      ctx.lineWidth = (p.w ?? 2) + casing * 2;
      ctx.stroke(pp);
    }
  }
  // pass 2: the fills / strokes in order
  for (const p of parts) {
    if (p.detail) continue;
    const pp = path(p.d);
    ctx.globalAlpha = p.da ?? (p.fill === "dark" ? (ink.chequer ?? 0.62 * (0.4 + (0.6 * ink.contour) / FULL_INK.contour)) : 1);
    if (p.fill) {
      ctx.fillStyle = pick(p.fill);
      ctx.fill(pp);
      if (p.fill !== "dark") {
        // the thin dark contour of the engraving
        ctx.globalAlpha = ink.contour;
        ctx.strokeStyle = DARK;
        ctx.lineWidth = 0.55 * unitsPerPx * 1.6;
        ctx.stroke(pp);
      }
    } else if (p.stroke) {
      ctx.strokeStyle = pick(p.stroke);
      ctx.lineWidth = p.w ?? 2;
      ctx.stroke(pp);
    }
  }
  // pass 3: hatching and contours
  ctx.strokeStyle = DARK;
  for (const p of parts) {
    if (!p.detail) continue;
    ctx.globalAlpha = (p.da ?? 0.5) * (ink.detail ?? ink.contour / FULL_INK.contour);
    if (ctx.globalAlpha <= 0.001) continue;
    ctx.lineWidth = (p.dw ?? 0.9) * Math.max(1, unitsPerPx * 1.4);
    ctx.stroke(path(p.d));
  }
  ctx.globalAlpha = 1;
};

// ---------------------------------------------------------------------------
// SPRITES
// ---------------------------------------------------------------------------
export type FigKey =
  | { kind: "inca"; v: number; lean: -1 | 0 | 1; look: "cream"; ink?: "skin" }
  | { kind: "dead"; v: number; a: number; ink?: number }
  | { kind: "foot"; pose: number }
  | { kind: "horse"; pose: HorsePose; left: boolean };
type Box = { x0: number; x1: number; y0: number; y1: number; ref: number; ax: number; ay: number };
const BOX: Record<"inca" | "dead" | "foot" | "horse", Box> = {
  inca: { x0: -32, x1: 36, y0: -122, y1: 6, ref: 100, ax: 0, ay: 0 },
  foot: { x0: -22, x1: 24, y0: -142, y1: 6, ref: 100, ax: 0, ay: 0 },
  horse: { x0: -40, x1: 56, y0: -74, y1: 24, ref: 57, ax: 0, ay: 19.6 },
  dead: { x0: -78, x1: 78, y0: -78, y1: 78, ref: 100, ax: 0, ay: 0 },
};
/** the dead lie at these angles (deg); the sign is the side he fell to */
export const DEAD_ANGLES = [-125, -112, -100, -90, -80, -68, -55, 55, 68, 80, 90, 100, 112, 125];
/** the heap's ink: a DARK casing (0.55) round every body, so overlapping
 *  bodies separate into a mosaic of shapes (casingPx at the sprite's own size) */
const PILE_INK: Ink = { casing: 0.55, contour: 0.2, detail: 0.18, casingPx: 0.8, chequer: 0.18 };
export const SIZES = [16, 32, 64, 128];
type Sprite = { c: HTMLCanvasElement; ax: number; ay: number; px: number };
const keyStr = (k: FigKey, px: number) =>
  k.kind === "inca" ? `i${k.v}${k.lean}${k.ink ?? ""}${px}` : k.kind === "dead" ? `d${k.v}_${k.a}_${k.ink ?? 0}_${px}` : k.kind === "foot" ? `f${k.pose}_${px}` : `h${k.pose}${k.left ? "L" : "R"}${px}`;
const SPRITES = new Map<string, Sprite>();
const makeSprite = (k: FigKey, px: number): Sprite => {
  const b = BOX[k.kind];
  const s = px / b.ref; // px per unit
  const W = Math.ceil((b.x1 - b.x0) * s) + 2;
  const H = Math.ceil((b.y1 - b.y0) * s) + 2;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d") as CanvasRenderingContext2D;
  const ox = -b.x0 * s + 1;
  const oy = -b.y0 * s + 1;
  ctx.translate(ox, oy);
  ctx.scale(s, s);
  const upp = 1 / s; // units per px
  if (k.kind === "inca") {
    ctx.rotate((k.lean * 4 * Math.PI) / 180);
    // the living warrior: a lighter hand at crowd sizes; a struck one (toppling) the heap's ink
    drawParts(ctx, INCA_PARTS(k.v), "cream", upp, k.ink === "skin" ? PILE_INK : crowdInk(px));
  } else if (k.kind === "dead") {
    // rotate about his middle (0, -50): the centre of the sprite is his middle
    ctx.rotate((k.a * Math.PI) / 180);
    ctx.translate(0, 50);
    // the dead: ink 0 a body of the heap (opaque at the dead tone, a DARK
    // casing); ink 1 the same in the composited cream look (A2: a body just
    // landed, still bright, laid over him as he dims)
    drawParts(ctx, INCA_PARTS(k.v), k.ink === 1 ? "dead" : "pile", upp, PILE_INK);
  } else if (k.kind === "foot") {
    drawParts(ctx, FOOT_PARTS(k.pose), "orange", upp);
  } else {
    if (k.left) ctx.scale(-1, 1);
    const h = HORSE_PARTS(k.pose);
    ctx.translate(0, h.lift);
    ctx.rotate((h.rot * Math.PI) / 180);
    drawParts(ctx, h.parts, "orange", upp);
  }
  // the anchor (feet / hooves / middle) in sprite px
  return { c, ax: ox + b.ax * s, ay: oy + (k.kind === "horse" ? (b.ay + 0) * s : b.ay * s), px };
};
/** per key OBJECT, its sprites by size index (reuse key objects in hot loops: no string keys) */
const BY_OBJ = new WeakMap<FigKey, (Sprite | undefined)[]>();
export const sprite = (k: FigKey, hPx: number): Sprite => {
  let si = SIZES.length - 1;
  for (let q = 0; q < SIZES.length; q++)
    if (SIZES[q] >= hPx * 1.05) {
      si = q;
      break;
    }
  let arr = BY_OBJ.get(k);
  if (!arr) {
    arr = [];
    BY_OBJ.set(k, arr);
  }
  let sp = arr[si];
  if (!sp) {
    const px = SIZES[si];
    const ks = keyStr(k, px);
    sp = SPRITES.get(ks);
    if (!sp) {
      sp = makeSprite(k, px);
      SPRITES.set(ks, sp);
    }
    arr[si] = sp;
  }
  return sp;
};
/** blit figure k with its anchor at screen (sx, sy) at reference height hPx
 *  (rotDeg about the anchor; scaleX squeezes it about the anchor: a horse
 *  turning seen from the side) */
export const blit = (ctx: CanvasRenderingContext2D, k: FigKey, sx: number, sy: number, hPx: number, alpha = 1, rotDeg = 0, scaleX = 1) => {
  if (alpha <= 0.003 || hPx < 0.5) return;
  const sp = sprite(k, hPx);
  const f = hPx / sp.px;
  ctx.globalAlpha = alpha;
  if (rotDeg || scaleX !== 1) {
    ctx.save();
    ctx.translate(sx, sy);
    if (rotDeg) ctx.rotate((rotDeg * Math.PI) / 180);
    if (scaleX !== 1) ctx.scale(scaleX, 1);
    ctx.drawImage(sp.c, -sp.ax * f, -sp.ay * f, sp.c.width * f, sp.c.height * f);
    ctx.restore();
  } else ctx.drawImage(sp.c, sx - sp.ax * f, sy - sp.ay * f, sp.c.width * f, sp.c.height * f);
};
/** the horseman's sprite anchor sits at the hooves: the sprite's reference
 *  height (57 units) maps to FIG.horse world px */
export const HORSE_REF_UNITS = 57;

// ---------------------------------------------------------------------------
// A per-man variety: variant, lean, scale (+-8 %)
// ---------------------------------------------------------------------------
export const incaKey = (i: number): FigKey => ({ kind: "inca", v: Math.floor(hash(i, 701) * 4), lean: (Math.floor(hash(i, 702) * 3) - 1) as -1 | 0 | 1, look: "cream" });
export const deadKey = (i: number): FigKey => ({ kind: "dead", v: Math.floor(hash(i, 701) * 4), a: DEAD_ANGLES[Math.floor(hash(i, 703) * DEAD_ANGLES.length)] });
export const manScale = (i: number) => 0.92 + 0.16 * hash(i, 704);

// ---------------------------------------------------------------------------
// THE CANVAS
// ---------------------------------------------------------------------------
/** a full-frame canvas: draw(ctx) runs in a layout effect each frame */
export const SpriteCanvas: React.FC<{ draw: (ctx: CanvasRenderingContext2D) => void; width?: number; height?: number }> = ({ draw, width = FRAME_W, height = FRAME_H }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.imageSmoothingEnabled = true;
    draw(ctx);
    ctx.globalAlpha = 1;
  });
  return <canvas ref={ref} width={width} height={height} style={{ position: "absolute", left: 0, top: 0, width, height }} />;
};
/** an offscreen layer canvas (for the dead: laid down whole, then composited at the dead tone) */
const LAYERS: HTMLCanvasElement[] = [];
export const layerCanvas = (i: number) => {
  while (LAYERS.length <= i) {
    const c = document.createElement("canvas");
    c.width = FRAME_W;
    c.height = FRAME_H;
    LAYERS.push(c);
  }
  return LAYERS[i];
};
export type { Cam };

// ---------------------------------------------------------------------------
// THE FIGURE SHEET (its own composition: each figure at 16, 32, 64 px)
// ---------------------------------------------------------------------------
export const SHEET = { w: 2400, h: 1500 };
export const FigureSheet: React.FC = () => {
  const rows: { label: string; keys: FigKey[]; tone?: number }[] = [
    { label: "Inca warrior (cream): variants 0-3, leans", keys: [0, 1, 2, 3].map((v) => ({ kind: "inca", v, lean: 0, look: "cream" }) as FigKey).concat([{ kind: "inca", v: 0, lean: -1, look: "cream" }, { kind: "inca", v: 1, lean: 1, look: "cream" }]) },
    { label: "Conquistador on foot (orange): stand, step 1, step 2", keys: [0, 1, 2].map((pose) => ({ kind: "foot", pose }) as FigKey) },
    {
      label: "Horseman (orange): stand L, walk L, gallop L, gallop R",
      keys: [
        { kind: "horse", pose: "stand", left: true },
        { kind: "horse", pose: "walk0", left: true },
        { kind: "horse", pose: "walk1", left: true },
        { kind: "horse", pose: "gallop0", left: true },
        { kind: "horse", pose: "gallop2", left: false },
      ],
    },
    {
      label: "The dead (opaque at the dead tone, a DARK casing): toppled warriors, weapons fallen, an arm or a leg flung out",
      keys: [2, 3, 4, 5, 4].map((v, j) => ({ kind: "dead", v, a: [-100, 80, -68, 112, 55][j], ink: 0 }) as FigKey),
    },
  ];
  const sizes = [16, 32, 64];
  return (
    <AbsoluteFill style={{ backgroundColor: "#3F3428" }}>
      <SpriteCanvas
        width={SHEET.w}
        height={SHEET.h}
        draw={(ctx) => {
          let y = 260;
          for (const row of rows) {
            let x = 70;
            for (const hPx of sizes) {
              for (const k of row.keys) {
                const w = k.kind === "horse" ? hPx * 1.9 : k.kind === "dead" ? hPx * 1.1 : hPx * 0.75;
                const ay = k.kind === "dead" ? y - hPx * 0.3 : y;
                if (row.tone) {
                  const L = layerCanvas(0);
                  const lc = L.getContext("2d") as CanvasRenderingContext2D;
                  lc.setTransform(1, 0, 0, 1, 0, 0);
                  lc.clearRect(0, 0, L.width, L.height);
                  blit(lc, k, x + w / 2, ay, hPx);
                  ctx.globalAlpha = row.tone;
                  ctx.drawImage(L, 0, 0);
                } else blit(ctx, k, x + w / 2, ay, hPx);
                x += w + 10;
              }
              x += 26;
            }
            y += 330;
          }
        }}
      />
      {rows.map((r, i) => (
        <div key={r.label} style={{ position: "absolute", left: 70, top: 280 + i * 330, color: INK, fontFamily: fell, fontSize: 30, opacity: 0.85 }}>
          {r.label}
        </div>
      ))}
      <div style={{ position: "absolute", left: 70, top: 40, color: INK, fontFamily: fell, fontSize: 44 }}>Figure sheet: 16 / 32 / 64 px</div>
    </AbsoluteFill>
  );
};
