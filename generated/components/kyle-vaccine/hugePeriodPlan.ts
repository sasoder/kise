// ---------------------------------------------------------------------------
// hugePeriodPlan: the road, the stations and the camera of HugePeriodOfTrialAndError (kyle-vaccine, cut 18).
// Pure data and functions (no React), so the camera plot and the checks can import it.
//
// UNITS: the cast's (a man ~312 = 1.75 m, U = 178 per metre). X across (+ = screen right), Y height (floor 0, up -),
// zw = WORLD depth along the road (the camera starts at zw 0). The camera is a pinhole on the road: eye EYE units up
// at (camX, camZ), focal F px; a lens shift moves the vanishing point on screen (verticals stay vertical).
// ---------------------------------------------------------------------------
export const FPS = 30000 / 1001;
export const DURATION = 249;
export const U = 178;
/** focal length, screen px */
export const F = 1350;
/** the eye's height (units): a little over a child's face, so faces sit near the horizon row at any distance */
export const EYE = 230;
/** the horizon's screen row: 860 on the lane, 660 at the landing (a vertical lens shift in the landing's one lobe, so
 *  the station's faces, the boy's arm and the far vial above them all sit in the frame's middle) */
export const H_START = 960;
export const H_END = 750;

const c01 = (v: number) => Math.max(0, Math.min(1, v));
export const smooth = (u: number) => {
  const v = c01(u);
  return v * v * (3 - 2 * v);
};
/** the integral of a raised-cosine velocity lobe over [a, b], normalised 0..1 (one smooth lobe) */
export const lobe = (f: number, a: number, b: number) => {
  const L = b - a;
  const x = Math.max(0, Math.min(L, f - a));
  return (x - (L / (2 * Math.PI)) * Math.sin((2 * Math.PI * x) / L)) / L;
};

// ---- THE CAMERA ---------------------------------------------------------------------------------
/** the dolly's speed (units per frame): already moving at f0 ("this huge period": a slow walk), gathering to a steady
 *  glide past the tries (f12-66), then ONE deceleration lobe into the inoculation station (f100-176) and a creep */
export const V0 = 7;
export const V1 = 25;
export const V_END = 0.7;
export const ACC: readonly [number, number] = [12, 66];
export const DEC: readonly [number, number] = [100, 176];
export const speedAt = (f: number) => {
  const up = V0 + (V1 - V0) * smooth((f - ACC[0]) / (ACC[1] - ACC[0]));
  return V_END + (up - V_END) * (1 - smooth((f - DEC[0]) / (DEC[1] - DEC[0])));
};
const Z_TABLE: number[] = (() => {
  const out = [0];
  for (let f = 1; f <= DURATION + 4; f++) out.push(out[f - 1] + (speedAt(f - 1) + speedAt(f)) / 2);
  return out;
})();
export const camZAt = (f: number) => {
  if (f <= 0) return speedAt(0) * f;
  if (f >= Z_TABLE.length - 1) return Z_TABLE[Z_TABLE.length - 1] + V_END * (f - (Z_TABLE.length - 1));
  const i = Math.floor(f);
  return Z_TABLE[i] + (Z_TABLE[i + 1] - Z_TABLE[i]) * (f - i);
};
/** the truck and the lens shift: one lobe with the deceleration, from the lane's axis to just in front of the pair
 *  (between them), the vanishing point a little right of centre and the horizon raised: the lane runs on into the haze
 *  between their heads, where the vial waits */
export const TRUCK: readonly [number, number] = [96, 184];
export const CAM_X1 = 212;
export const SHIFT1 = 22;
export const camXAt = (f: number) => CAM_X1 * lobe(f, TRUCK[0], TRUCK[1]);
export const shiftAt = (f: number) => SHIFT1 * lobe(f, TRUCK[0], TRUCK[1]);
export const horizonAt = (f: number) => H_START + (H_END - H_START) * lobe(f, TRUCK[0], TRUCK[1]);
export type RoadCam = { X: number; Z: number; shift: number; h0: number; f: number };
export const camAt = (f: number): RoadCam => ({ X: camXAt(f), Z: camZAt(f), shift: shiftAt(f), h0: horizonAt(f), f });
/** screen px per unit at world depth zw */
export const rAt = (c: RoadCam, zw: number) => F / Math.max(zw - c.Z, 30);
/** the screen point of a world point */
export const screenOf = (c: RoadCam, X: number, Y: number, zw: number): [number, number] => {
  const r = rAt(c, zw);
  return [540 + c.shift + (X - c.X) * r, c.h0 + (Y + EYE) * r];
};

// ---- THE ROAD -----------------------------------------------------------------------------------
/** the lane's half width (dirt), the grass verges to the low walls, the walls' inner face and thickness */
export const ROAD_HW = 330;
export const WALL_X = 700;
export const WALL_T = 34;
export const WALL_H = 86;
/** the cottages' road-side walls (|X|), their depth back from the road, eaves and ridge heights */
export const HOUSE_X = 730;
export const HOUSE_D = 420;
export const EAVE_H = 430;
export const RIDGE_H = 620;
/** the far end: the road melts into the haze */
export const ROAD_END = 16000;
/** the cottages: side, z0..z1 (world depth of their gable ends); a long irregular row each side, on and on into the
 *  haze ("a huge period") */
export type House = { side: -1 | 1; z0: number; z1: number; door: number; seed: number };
const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
export const HOUSES: House[] = (() => {
  const out: House[] = [];
  let seed = 1;
  for (const side of [-1, 1] as const) {
    let z = side < 0 ? 380 : 560;
    while (z < 13500) {
      const len = 330 + 120 * hash(seed * 3.1);
      out.push({ side, z0: z, z1: z + len, door: 0.3 + 0.35 * hash(seed * 7.7), seed });
      seed++;
      z += len + 160 + 520 * hash(seed * 5.3);
    }
  }
  return out;
})();
/** round trees behind the walls and cottages */
export type Tree = { X: number; z: number; R: number; h: number; seed: number };
export const TREES: Tree[] = (() => {
  const out: Tree[] = [];
  let seed = 1;
  for (const side of [-1, 1] as const) {
    let z = side < 0 ? 300 : 900;
    while (z < 14000) {
      out.push({ X: side * (1250 + 300 * hash(seed * 2.3)), z, R: 340 + 110 * hash(seed * 4.1), h: 760 + 140 * hash(seed * 6.7), seed });
      seed++;
      z += 520 + 600 * hash(seed * 9.1);
    }
  }
  return out;
})();

// ---- THE STATIONS (world depth of each tableau's front line) ------------------------------------
/** a: the red treatment (a girl sitting up in a bed hung with red cloth, her mother beside it), left lane edge */
export const ZA = 1330;
/** b: the smoke cure (a man waving a smoking bundle of herbs over a boy on a stool), right lane edge */
export const ZB = 1950;
/** c: the charm (a mother holds the amulet hung round her girl's neck), left lane edge */
export const ZC = 2450;
/** the inoculation station (the Inoculator and a boy with his sleeve pushed up), in the lane's right half */
export const ZS = 3385;
/** the vaccine that does not exist yet: a dashed orange vial far down the lane, in the haze */
export const ZV = 9950;
export const VIAL = { X: 200, H: 660, R: 156 };
/** each try FAILS in place as we approach: by the camera's distance it drains toward DEAD, sinks into the air and is
 *  gone (dissolved into the medium) before we reach it; one smooth ramp u 0 -> 1 from DRAIN_D[0] to DRAIN_D[1] */
export const DRAIN_D: readonly [number, number] = [1050, 650];
export const drainAt = (c: RoadCam, zw: number) => smooth((DRAIN_D[0] - (zw - c.Z)) / (DRAIN_D[0] - DRAIN_D[1]));
/** the stages of that one ramp: the colour drains first, the air takes it, the last of it dissolves */
export const drainStages = (u: number) => ({ dead: smooth(u / 0.6), sink: smooth((u - 0.2) / 0.7), gone: smooth((u - 0.62) / 0.38) });

// ---- THE TIMELINE (frames; the brief's word table) ----------------------------------------------
export const T = {
  sleeve: [92, 126] as const, // the station child pushes its sleeve up as we approach
  inoc0: 110, // inoculate phase 0 (reach 114-152, scratch 156-174 on "smallpox" 155, withdraw 182-208)
  inocLen: 100,
  flinch: 156,
  pox: [184, 212] as const, // "very, very dangerous": a few plum pox dots come out on the child (0 -> 0.4)
  vial: [210, 236] as const, // "not vaccination" (219-222): the dashed vial drawn by a moving tip
};
