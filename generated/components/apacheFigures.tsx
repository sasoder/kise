// ---------------------------------------------------------------------------
// apacheFigures: the three ARMIES of the cut VeryLongTimeV2, in the house
// engraved manner of pageFigures (one stroke family: a DARK casing under
// everything, the cream fill, a thin dark contour and a hatch line or two;
// drawn once into sprite canvases and blitted). pageFigures' own foot / horse
// sprites are orange (Pizarro's side) and its parts are private, so the
// conquistador's parts are repeated here in CREAM, and two riders and a foot
// soldier are added in the same manner. Told apart by silhouette:
//   spanish  1600s: "foot" (crested morion, pike taller than the man) and
//            "lancer" (the conquistador horseman, morion, upright lance)
//   cuera    1700s-1820s: the presidial SOLDADO DE CUERA of New Spain's
//            northern frontier: a mounted lancer in a flat broad-brimmed hat,
//            a long lance, the oval adarga shield at his side
//   us       1850s-1886: a United States cavalry TROOPER (kepi, a carbine
//            across the saddle, no lance) and an INFANTRYMAN (kepi, rifle
//            shouldered)
//   apache   (R1) the DEFENDER, the only ORANGE figure: an Apache rifleman
//            KNEELING, his rifle upright before him, headband, long hair
// Men on foot stand 100 units tall (feet at (0, 0)); a horseman 57 units from
// hoof to hat (anchor at the hooves).
//
// API
//   ArmyKey { kind: "foot" | "lancer" | "cuera" | "trooper" | "rifle", pose: 0 | 1 | 2, left?: boolean }
//     pose 0 standing, 1 / 2 the two poses of the step (walk); left = a
//     horseman facing left
//   blitArmy(ctx, key, sx, sy, hPx, alpha?) the figure with its feet / hooves
//     at screen (sx, sy); hPx = a man's height on screen (a horseman is drawn
//     1.25 x that, hoof to hat)
//   <ArmySheet /> the three kinds side by side (a check sheet)
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill } from "remotion";
import { ACCENT, ACCENT_DEEP, DARK, INK, LAND } from "./incaShared";
import { STAND } from "./incaGlyphs";
import { SpriteCanvas } from "./pageFigures";

const COL = { main: INK, deep: "#CDBF9C", shade: "#B9AA86" };
/** (R1) the defenders are the only orange figures */
const COL_ORANGE = { main: ACCENT, deep: ACCENT_DEEP, shade: "#B87108" };
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

// ---- THE CONQUISTADOR ON FOOT (pageFigures' parts) ---------------------------
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


// ---- THE UNITED STATES INFANTRYMAN ------------------------------------------
const RIFLE_PARTS = (pose: number): Part[] => {
  const legL = pose === 1 ? limb([-4, -42], [-5.6, -3.6], 6, 5) : limb([-4, -42], [-8.4, -1.5], 6, 5);
  const legR = pose === 2 ? limb([4, -42], [5.6, -3.6], 6, 5) : limb([4, -42], [8.4, -1.5], 6, 5);
  const fL = pose === 1 ? "M-8.6,-3.4 L-3.2,-3.4" : "M-11.8,-0.6 L-6,-0.6";
  const fR = pose === 2 ? "M3.2,-3.4 L8.6,-3.4" : "M6,-0.6 L11.8,-0.6";
  return [
    // the rifle shouldered, slanting back over the right shoulder, a bayonet at its tip
    P("M14.6,-50 L4.6,-104", { stroke: "deep", w: 2.8 }),
    P("M4.6,-104 L2.6,-116", { stroke: "main", w: 1.4 }),
    P(legL, { fill: "main" }),
    P(legR, { fill: "main" }),
    P(`${fL} ${fR}`, { stroke: "dark", w: 2.4, noCase: true }),
    // the sack coat to the hips, a belt, a row of buttons
    P(limb([-10.4, -70], [-12.6, -47], 5.2, 4.2), { fill: "main" }),
    P("M-10.6,-73 C-12,-62 -11.6,-48 -10.4,-38 L10.4,-38 C11.6,-48 12,-62 10.6,-73 Z", { fill: "deep" }),
    P("M-10.8,-50 L10.8,-50", { detail: true, da: 0.6 }),
    P("M0,-71 L0,-40", { detail: true, da: 0.45 }),
    P(limb([10.6, -70], [15.4, -58], 5.2, 4.4), { fill: "main" }),
    P(limb([15.4, -58], [13.6, -50.6], 4.4, 4.0), { fill: "main" }),
    // neck, face, the kepi: a low flat-topped cap tipped forward, its visor
    P(rect(-2.8, -77, 2.8, -72), { fill: "main" }),
    P(circle(0, -80.6, 6.8), { fill: "main" }),
    P("M-7.4,-85.4 L7.4,-85.4 L8.6,-94.6 L-5.4,-96.4 Z", { fill: "main" }),
    P("M5.4,-85.6 L14.4,-83.6", { stroke: "main", w: 2.6 }),
    P("M-7.4,-87.4 L7.6,-87.4", { detail: true, da: 0.55 }),
  ];
};

// ---- THE APACHE RIFLEMAN, KNEELING (R1; after the 1887 photograph of Geronimo
// kneeling with his rifle): one knee down, the rifle upright in front of him,
// its butt on the ground, a headband, long hair on the shoulders. Faces +x.
// 78 units from the ground to the rifle's muzzle; the man himself ~74.
const KNEEL_PARTS = (): Part[] => [
  // the rifle, upright, the forward hand on its barrel
  P("M21.6,-0.6 L23.2,-78", { stroke: "deep", w: 2.8 }),
  P("M19.4,-1 L24.6,-1 L24.2,-12 L21,-12 Z", { fill: "deep" }),
  // the rear leg: thigh down to the knee on the ground, the shin laid back, the foot
  P(limb([-3, -32], [-8.6, -4.4], 8.4, 6.6), { fill: "main" }),
  P(limb([-8.6, -4.4], [-25, -3.6], 6.4, 5), { fill: "main" }),
  P("M-27.6,-6.6 L-27.6,-0.6", { stroke: "dark", w: 2.6, noCase: true }),
  // the forward leg: thigh level, the shin down to the foot, the high moccasin
  P(limb([1, -31], [15, -29.6], 8.4, 7), { fill: "main" }),
  P(limb([15, -29.6], [14, -2.4], 7, 5.4), { fill: "main" }),
  P("M10.4,-0.6 L18.4,-0.6", { stroke: "dark", w: 2.6, noCase: true }),
  P("M11,-15.6 L17.4,-15", { detail: true, da: 0.5 }),
  // the breechcloth's fall between the legs
  P("M-2.6,-33 L6.4,-33 L5.4,-17 L-0.6,-17 Z", { fill: "deep" }),
  // the torso (a loose shirt), the cartridge belt
  P("M-9.4,-63 C-11.4,-52 -10.4,-40 -7.4,-31.4 L8.4,-31.4 C10.2,-40 10.6,-52 8.6,-63 Z", { fill: "main" }),
  P("M-8.6,-38.6 L9,-38.6", { detail: true, da: 0.65, dw: 1.3 }),
  P("M-6.4,-56 C-3.4,-50 0.6,-45 5.4,-42", { detail: true, da: 0.45 }),
  // the near arm out to the rifle
  P(limb([6, -60], [15.4, -50], 5.6, 4.6), { fill: "main" }),
  P(limb([15.4, -50], [22, -52], 4.6, 4.2), { fill: "main" }),
  // long hair on the shoulders (behind the head), the head, the headband
  P("M-7.6,-76 C-11.6,-70 -12,-62 -9.4,-56 L-3.4,-58 C-4.4,-63 -4,-69 -2.4,-73 Z", { fill: "deep" }),
  P(rect(-2.2, -66.6, 3.4, -62), { fill: "main" }),
  P(circle(1, -70.6, 6.6), { fill: "main" }),
  P("M-5.8,-73.6 C-2.4,-75.4 3.6,-75.6 7.4,-73.4", { stroke: "deep", w: 2.6 }),
  P("M-5.8,-73.6 C-2.4,-75.4 3.6,-75.6 7.4,-73.4", { detail: true, da: 0.5 }),
];

// ---- THE HORSE AND ITS THREE RIDERS (pageFigures' horse, adapted) ----------
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
type Rider = "lancer" | "cuera" | "trooper";
const R_FLAT_BRIM = "M-3.6,-30.4 L12.6,-30.4 L12.6,-31.9 L-3.6,-31.9 Z";
const R_FLAT_CROWN = rect(1.4, -35.4, 7.6, -31.8);
const R_ADARGA = "M-6.2,-15.6 C-6.2,-23.6 4.2,-23.6 4.2,-15.6 C4.2,-7.6 -6.2,-7.6 -6.2,-15.6 Z";
const R_KEPI = "M1.2,-31 L7.8,-31 L8.4,-35 L2.6,-36.2 Z";
const R_KEPI_VISOR = "M7.4,-31.2 L11.8,-30.2";
const R_CARBINE = "M-7,-15 L15.6,-21.4";
const HORSE_PARTS = (rider: Rider, pose: number): { parts: Part[]; rot: number; lift: number } => {
  const legs = pose === 0 ? STAND : WALK[pose - 1];
  const legD = legs.map((l, i) => legShape(l as Leg, i < 2 ? 5.6 : 6.4, 2.9));
  const weapon: Part[] =
    rider === "lancer"
      ? [P("M15.4,-4.6 L17.8,-63", { stroke: "deep", w: 1.9 }), P("M16.6,-62 L18,-70 L19.2,-62 Z", { fill: "main" })]
      : rider === "cuera"
        ? [P("M15.4,-4.6 L18.6,-76", { stroke: "deep", w: 1.9 }), P("M17.4,-75 L18.9,-84 L20,-75 Z", { fill: "main" })]
        : [];
  const head: Part[] =
    rider === "lancer"
      ? [P(R_HEAD, { fill: "main" }), P(R_HELMET, { fill: "main" })]
      : rider === "cuera"
        ? [P(R_HEAD, { fill: "main" }), P(R_FLAT_CROWN, { fill: "main" }), P(R_FLAT_BRIM, { fill: "main" })]
        : [P(R_HEAD, { fill: "main" }), P(R_KEPI, { fill: "main" }), P(R_KEPI_VISOR, { stroke: "main", w: 1.5 })];
  return {
    rot: pose === 0 ? -2.2 : -1.0,
    lift: -0.6,
    parts: [
      P(legD[1], { fill: "deep" }),
      P(legD[3], { fill: "deep" }),
      P(hoof(legs[1] as Leg) + hoof(legs[3] as Leg), { stroke: "dark", w: 3.2, noCase: true, da: 0.8 }),
      P(H_TAIL, { fill: "deep" }),
      ...weapon,
      P(H_BODY, { fill: "main" }),
      P(legD[0], { fill: "main" }),
      P(legD[2], { fill: "main" }),
      P(hoof(legs[0] as Leg) + hoof(legs[2] as Leg), { stroke: "dark", w: 3.2, noCase: true, da: 0.8 }),
      P(H_HATCH, { detail: true, da: 0.55 }),
      P(H_MANE, { detail: true, da: 0.5 }),
      P(R_LEG, { detail: true, da: 0.62, dw: 1.3 }),
      P(R_TORSO, { fill: "main" }),
      ...(rider === "cuera" ? [P(R_ADARGA, { fill: "deep" }), P("M-1,-21 L-1,-10.4", { detail: true, da: 0.5 })] : []),
      ...(rider === "trooper" ? [P(R_CARBINE, { stroke: "deep", w: 2.2 })] : []),
      P(R_ARM, { stroke: "main", w: 2.6 }),
      ...head,
    ],
  };
};

// ---------------------------------------------------------------------------
// Drawing (pageFigures' three passes: casing, fills with contour, hatching)
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
const drawParts = (ctx: CanvasRenderingContext2D, parts: Part[], unitsPerPx: number, ink: Ink = FULL_INK, col = COL) => {
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
export type ArmyKind = "foot" | "lancer" | "cuera" | "trooper" | "rifle" | "apache";
export type ArmyKey = { kind: ArmyKind; pose: 0 | 1 | 2; left?: boolean };
type Box = { x0: number; x1: number; y0: number; y1: number; ref: number; ay: number };
const FOOT_BOX: Box = { x0: -22, x1: 24, y0: -142, y1: 6, ref: 100, ay: 0 };
const HORSE_BOX: Box = { x0: -42, x1: 44, y0: -90, y1: 24, ref: 57, ay: 19.6 };
const KNEEL_BOX: Box = { x0: -34, x1: 32, y0: -86, y1: 6, ref: 100, ay: 0 };
/** the kneeling rifleman's own height (units, ground to muzzle) per 100 units of a standing man */
export const KNEEL_UNITS = 78;
/** a horseman (hoof to hat) stands this many times a man on foot */
export const HORSE_K = 1.25;
const isHorse = (k: ArmyKind) => k === "lancer" || k === "cuera" || k === "trooper";
type Sprite = { c: HTMLCanvasElement; ax: number; ay: number; px: number };
const SPRITES = new Map<string, Sprite>();
const SIZES = [48, 96, 192];
const makeSprite = (k: ArmyKey, px: number): Sprite => {
  const horse = isHorse(k.kind);
  const b = horse ? HORSE_BOX : k.kind === "apache" ? KNEEL_BOX : FOOT_BOX;
  const s = px / b.ref;
  const c = document.createElement("canvas");
  c.width = Math.ceil((b.x1 - b.x0) * s) + 2;
  c.height = Math.ceil((b.y1 - b.y0) * s) + 2;
  const ctx = c.getContext("2d") as CanvasRenderingContext2D;
  const mirror = (horse || k.kind === "apache") && !!k.left;
  const ox = (mirror ? b.x1 : -b.x0) * s + 1;
  const oy = -b.y0 * s + 1;
  ctx.translate(ox, oy);
  ctx.scale(mirror ? -s : s, s);
  if (horse) {
    const h = HORSE_PARTS(k.kind as Rider, k.pose);
    ctx.translate(0, h.lift);
    ctx.rotate((h.rot * Math.PI) / 180);
    drawParts(ctx, h.parts, 1 / s);
  } else if (k.kind === "apache") drawParts(ctx, KNEEL_PARTS(), 1 / s, FULL_INK, COL_ORANGE);
  else drawParts(ctx, k.kind === "foot" ? FOOT_PARTS(k.pose) : RIFLE_PARTS(k.pose), 1 / s);
  return { c, ax: ox, ay: oy + b.ay * s, px };
};
/** blit a figure with its feet / hooves at screen (sx, sy); hPx = a man's height on screen */
export const blitArmy = (ctx: CanvasRenderingContext2D, k: ArmyKey, sx: number, sy: number, hPx: number, alpha = 1) => {
  if (alpha <= 0.003 || hPx < 0.5) return;
  const h = isHorse(k.kind) ? hPx * HORSE_K : hPx;
  const px = SIZES.find((q) => q >= h * 1.05) ?? SIZES[SIZES.length - 1];
  const id = `${k.kind}${k.pose}${k.left ? "L" : "R"}${px}`;
  let sp = SPRITES.get(id);
  if (!sp) {
    sp = makeSprite(k, px);
    SPRITES.set(id, sp);
  }
  const f = h / sp.px;
  ctx.globalAlpha = alpha;
  ctx.drawImage(sp.c, sx - sp.ax * f, sy - sp.ay * f, sp.c.width * f, sp.c.height * f);
};

/** the check sheet: the three kinds side by side at 3 x (a man 150 px) */
export const ARMY_SHEET = { w: 1900, h: 620 };
export const ArmySheet: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: LAND }}>
    <SpriteCanvas
      width={ARMY_SHEET.w}
      height={ARMY_SHEET.h}
      draw={(ctx) => {
        const H = 150;
        const y = 520;
        const row: [ArmyKey, number][] = [
          [{ kind: "foot", pose: 1 }, 110],
          [{ kind: "lancer", pose: 1 }, 330],
          [{ kind: "cuera", pose: 1 }, 640],
          [{ kind: "cuera", pose: 2, left: true }, 900],
          [{ kind: "trooper", pose: 1 }, 1170],
          [{ kind: "rifle", pose: 2 }, 1400],
          [{ kind: "apache", pose: 0 }, 1620],
          [{ kind: "apache", pose: 0, left: true }, 1790],
        ];
        for (const [k, x] of row) blitArmy(ctx, k, x, y, H);
        ctx.globalAlpha = 1;
      }}
    />
  </AbsoluteFill>
);
