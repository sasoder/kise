// ---------------------------------------------------------------------------
// freeStreetPlan: the street, the shops, the timeline and the camera of kyle-rome-slavery cut 61 (FreeStreetNoEngine),
// kept free of React so a script can plot and check them.
//
// 3D WORLD UNITS (the London depth kit's / the cast's: a man ~310 from soles to skull, ~177 units a metre).
// X across (0 = the street's axis, + = screen right), Y height (the ROAD is Y = 0, up is - Y), Z depth along the street
// (+ = away from us, toward the far end). ONE PINHOLE CAMERA dollying along Z: its eye at (camX, EYE_Y, camZ) looks
// straight down the street; a point draws at r = FOCAL / (Z - camZ):
//     screen [540 + shiftX + (X - camX) * r,  HORIZON + (Y - EYE_Y) * r]
// shiftX is a lens shift (the picture slides, the perspective stays one-point: verticals vertical, every receding
// edge meets the one VP at [540 + shiftX, HORIZON]). At f0 the shift frames the first shop on the left with the VP
// just off the right edge; it returns to 0 by f155, which brings the far end of the street (and the dashed engine at
// the VP) to the centre on "industrializing". After that the only lateral move is a truck (camX) toward the shop being
// passed: near things slide, the far engine barely moves (parallax).
// ---------------------------------------------------------------------------
export const FPS = 30000 / 1001;
export const DURATION = 288;

/** the camera */
export const FOCAL = 1000;
export const EYE_Y = -200;
export const HORIZON = 1010;

/** the street (a narrow Pompeii street: a basalt road between high raised pavements, shop fronts on both sides) */
export const ROAD_HW = 130; // the road's half width (kerb faces at X = +-ROAD_HW)
export const PAVE_Y = -80; // the pavements' top (raised ~0.45 m, as Pompeii's high pavements)
export const FACADE_X = 230; // the shop fronts' plane (|X|)
export const WALL_T = 60; // the front wall's thickness (the jambs and the lintel's underside)
export const BACK_X = 1000; // the shops' back walls (|X|)
export const LINTEL_Y = -660; // the timber lintel's underside over each opening
export const LINTEL_H = 46;
export const UPPER_TOP = -1240; // the upper storey's top (the eaves)
export const EAVE_OUT = 90; // the tiled eaves project over the pavement
/** the street's far end: the rows stop here and the ground opens out toward the horizon */
export const STREET_END = 5600;
/** the steam engine that was never built: cut A's engine, far off at the end, a dashed orange outline */
export const ENGINE_Z = 11000;
export const ENGINE_X = 0;

/** stepping stones across the road (three blocks, gaps for the wheels), at these Z */
export const CROSSINGS = [3500, 4400];
export const STONE = { hx: 30, hz: 64, top: PAVE_Y + 4, xs: [-86, 0, 86] };

// ---- THE CAMERA ----------------------------------------------------------------------------------
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (u: number) => {
  const v = c01(u);
  return v * v * (3 - 2 * v);
};
/** the dolly's speed (units per frame): a slow creep on the slave shop, then up to a steady walk past the free shops */
export const V0 = 1.5;
export const V1 = 10.5;
export const speedAt = (f: number) => V0 + (V1 - V0) * smooth((f - 46) / 90);
const Z_TABLE: number[] = (() => {
  const out = [0];
  for (let f = 1; f <= DURATION + 4; f++) out.push(out[f - 1] + (speedAt(f - 1) + speedAt(f)) / 2);
  return out;
})();
export const camZAt = (f: number) => {
  if (f > Z_TABLE.length - 1) return Z_TABLE[Z_TABLE.length - 1] + V1 * (f - (Z_TABLE.length - 1));
  const i = Math.max(0, Math.min(Z_TABLE.length - 2, Math.floor(f)));
  return Z_TABLE[i] + (Z_TABLE[i + 1] - Z_TABLE[i]) * (f - i);
};

/** the shops: side -1 = left, 1 = right; the opening from z0 to z1 (front plane). After the slave shop, each free
 *  shop is placed so its worker stands ~620 units ahead of the camera (~500 px tall) on its FEATURED frame: they pass
 *  one at a time, alternating sides, 28 frames apart, as the straight dolly carries us by. */
export type ShopKind = "slave" | "potter" | "seller" | "sellerM" | "fuller" | "baker" | "smith" | "cobbler" | "quern" | "closed";
export type Shop = { id: string; side: -1 | 1; z0: number; z1: number; kind: ShopKind; peak?: number };
const OPEN = 400;
/** where each kind's worker stands, from the opening's near edge */
export const FIG_DZ: Record<ShopKind, number> = { slave: 270, potter: 260, seller: 170, sellerM: 170, fuller: 280, baker: 300, smith: 270, cobbler: 250, quern: 270, closed: 270 };
export const SHOW_DZ = 620;
const FEATURED: [number, -1 | 1, ShopKind][] = [
  [120, -1, "seller"],
  [148, 1, "quern"],
  [176, -1, "potter"],
  [204, 1, "baker"],
  [232, -1, "smith"],
  [260, 1, "cobbler"],
  [288, -1, "sellerM"],
  // beyond the cut: the street goes on, working, toward the far end
  [316, 1, "seller"],
  [344, -1, "potter"],
  [372, 1, "smith"],
  [400, -1, "baker"],
  [428, 1, "cobbler"],
  [456, -1, "seller"],
];
export const SHOPS: Shop[] = (() => {
  const out: Shop[] = [{ id: "L0", side: -1, z0: 300, z1: 860, kind: "slave" }];
  FEATURED.forEach(([pk, side, kind], i) => {
    const z0 = Math.round(camZAt(pk) + SHOW_DZ - FIG_DZ[kind]);
    out.push({ id: `F${i}`, side, z0, z1: z0 + OPEN, kind, peak: pk });
  });
  // shut shops fill the right row before its first working one
  const firstR = out.filter((q) => q.side === 1).reduce((m, q) => Math.min(m, q.z0), Infinity);
  for (let z0 = firstR - 700; z0 > 0; z0 -= 700) out.push({ id: `C${z0}`, side: 1, z0, z1: z0 + OPEN, kind: "closed" });
  return out.filter((q) => q.z1 < STREET_END - 100);
})();
export const FEATURED_KEYS = FEATURED;

/** the lens shift: frames the slave shop at f0 (VP just off the right edge), one smooth return lobe f60-155 */
export const SHIFT0 = 660;
export const SHIFT_LOBE: readonly [number, number] = [58, 156];
const lobe = (f: number, [a, b]: readonly [number, number]) => {
  const L = b - a;
  const x = Math.max(0, Math.min(L, f - a));
  return (x - (L / (2 * Math.PI)) * Math.sin((2 * Math.PI * x) / L)) / L;
};
export const shiftAt = (f: number) => SHIFT0 * (1 - 0.04 * (Math.min(f, SHIFT_LOBE[0]) / SHIFT_LOBE[0])) * (1 - lobe(f, SHIFT_LOBE));
/** the camera's track: one straight line down the street. The only lateral change is the opening's: the eye starts
 *  120 units right of the axis (framing the slave shop) and eases onto the axis in the SAME single lobe as the lens
 *  shift (f58-156); after that it is dead straight on the axis (no truck, no weave) */
export const X0 = 120;
export const camXAt = (f: number) => X0 * (1 - lobe(f, SHIFT_LOBE));
export type StreetCam = { X: number; Z: number; shift: number; f: number };
export const camAt = (f: number): StreetCam => ({ X: camXAt(f), Z: camZAt(f), shift: shiftAt(f), f });
/** the depth ratio (screen px per unit) of depth Z */
export const rAt = (c: StreetCam, Z: number) => FOCAL / Math.max(Z - c.Z, 30);
export const project = (c: StreetCam, X: number, Y: number, Z: number): [number, number] => {
  const r = rAt(c, Z);
  return [540 + c.shift + (X - c.X) * r, HORIZON + (Y - EYE_Y) * r];
};
/** ATMOSPHERIC DEPTH: 1 near, toward the page with distance from the camera (one function for the cut) */
export const hazeAt = (c: StreetCam, Z: number) => 1 - 0.62 * (1 - Math.exp(-Math.max(0, Z - c.Z - 500) / 3200));

// ---- THE TIMELINE ---------------------------------------------------------------------------------
export const T = {
  labor: 72, // "labor": the slave shop is the picture
  keeps: 90, // the dolly gathers speed past it
  industrializing: 158, // the far end, the dashed engine centred at the VP
  lots: 187, // "lots of sectors": shop after shop of free workers
  dominant: 257,
};
