// ---------------------------------------------------------------------------------------------------------------
// denverStorms — the storm cells of the Denver world (scott-weather-fired): geometry, growth and the canvas painter.
// Re-exported by denverWorld (the API contract lives in denverWorld's header).
//
// A cell is a seeded cloud of lit "puffs" (soft spheres) in world miles. growth g 0..1:
//   0     a small flat-based cumulus (~1.4 mi wide, ~0.5 mi tall)
//   ~0.4  a towering cumulus (top ~4 mi)
//   1     a mature cumulonimbus: top ~7.8 mi, an overshooting dome, an anvil spreading downwind (`anvilDir`)
// GROWTH IS BILLOWING, never a scale-up: every puff has a final height in the mature column. While the column's top
// is below that height the puff rides in the top's dome (the cap), so as the top rises the cap's puffs are left
// behind one by one at their own heights (new turrets push out of the top; the base widens with g). Each puff
// churns slowly on the story clock S (a small orbit and a breath of its radius), so a still cell is alive.
// Light: the low sun in the west (denverCamera SUN): cream tops and west faces, warm grey-brown east faces and base,
// never black; each puff veiled by the air at its own distance (fogAt). A rain shaft hangs under the base from
// g ~0.55, and the cell casts a soft shadow on the ground toward the east-north-east (shadowOffset).
// glow 0..1 lights the base warm from inside (a lightning strike's frames).
// ---------------------------------------------------------------------------------------------------------------
import { COLOR } from "../kits/cheeky-pint/stoutShared";
import { HAZE, type DenView, type RGB, clamp01, fogAt, hash01, hexRgb, lerp, mixRgb, rgbCss, shadowOffset, smooth } from "./denverCamera";

export type StormSpec = {
  id: string;
  /** ground position (miles) at story clock S = 0 */
  x: number;
  y: number;
  seed: number;
  /** world drift, miles per frame (x east, y north) */
  vx?: number;
  vy?: number;
  /** overall size multiplier (1 = a typical high-plains cell) */
  size?: number;
  /** the direction the anvil spreads toward, degrees from north (default 80: the westerlies aloft blow it east) */
  anvilDir?: number;
  /** the direction the flanking turrets step away toward, degrees from north (default FLANK_DIR_DEFAULT 330: away
   *  from the cameras) */
  flankDir?: number;
};
export type StormState = StormSpec & {
  /** 0..1 */
  growth: number;
  /** 0..1 the base lit warm from inside (lightning) */
  glow?: number;
  /** 0..1 how much it looks like a thunderstorm: the lower body and base darken to a heavy warm slate (default from
   *  growth: smooth 0.45 -> 0.95); the sunlit upper turrets and the anvil stay cream */
  storminess?: number;
  /** 0..1 in-cloud lightning: the body lit from inside as a soft warm-amber glow (use flickerAt for timed events) */
  flicker?: number;
  /** 0..1.5 storm life (default STORM_BOIL 1): lobes swell, rise and roll over out of the top and sides while older ones
   *  sink back and soften, the base churns with ragged scud, the anvil streams downwind, rain falls in streaks; a pure
   *  function of the story clock S (joins stay exact). An amplitude, not a rate: it can be eased within a cut. */
  boil?: number;
  /** 0..1 rain-shaft override (default: from growth) */
  rain?: number;
  /** multiplier on the rain shaft's strength (default 1) */
  rainStrength?: number;
  /** multiplier on the ground shadow's strength (default 1) */
  shadowStrength?: number;
};

/** The default flanking-line direction (deg from north): north-north-west, so the turrets step AWAY from the world's
 *  cameras (which look NNW from the south-south-east) and never stand between the camera and the airfield. */
export const FLANK_DIR_DEFAULT = 330;
/** the default storm life (boil) */
export const STORM_BOIL = 1;
/** One lobe's life cycle at story clock S: 0..1 phase and a C1-smooth envelope (0 at both ends: a lobe is born small
 *  inside the body, swells and rises, then shrinks and sinks back in; never a pop at the wrap). */
const lobe = (S: number, period: number, ph: number) => {
  const p = S / period + ph / (Math.PI * 2);
  const lp = p - Math.floor(p);
  const env = Math.sin(Math.PI * lp);
  return { lp, env, env2: env * env };
};
export const CLOUD = {
  baseZ: 1.1,
  topMin: 1.65,
  topMax: 7.8,
  anvilZ: 7.0,
  r0: 0.7,
  rMature: 1.85,
  anvilLen: 6,
} as const;

/** The cell's ground position at story clock S. */
export const cellPos = (c: StormSpec, S: number) => ({ x: c.x + (c.vx ?? 0) * S, y: c.y + (c.vy ?? 0) * S });

const topAt = (g: number) => CLOUD.topMin + (CLOUD.topMax - CLOUD.topMin) * Math.pow(smooth(0, 1, g), 1.05);
/** column radius at height z for growth g (miles; before the size multiplier) */
const colR = (z: number, g: number, top: number) => {
  const base = CLOUD.r0 + (CLOUD.rMature - CLOUD.r0) * smooth(0, 0.85, g);
  const u = clamp01((z - CLOUD.baseZ) / Math.max(0.3, top - CLOUD.baseZ));
  // a broad lower body, narrowing a little up the tower, a rounded top
  const dome = u > 0.82 ? Math.sqrt(Math.max(0.08, 1 - Math.pow((u - 0.82) / 0.2, 2))) * 0.55 + 0.45 : 1;
  // a mature cell's top flares out into the anvil's root
  const flare = 1 + 0.75 * smooth(0.68, 1, g) * smooth(0.72, 0.92, u);
  // a broad lower body that waists in up the tower (not a straight trunk)
  const waist = 1.14 - 0.62 * u + 0.3 * u * u;
  return base * waist * dome * flare;
};

type Puff = { hz: number; th: number; rho: number; rr: number; ph: number; w: number; kind: 0 | 1 | 2; ua: number; va: number; fl?: number };
const PUFFS = new Map<number, Puff[]>();
const puffsOf = (seed: number): Puff[] => {
  const have = PUFFS.get(seed);
  if (have) return have;
  const out: Puff[] = [];
  const R = (i: number) => hash01(seed * 7.13 + i * 1.731);
  let i = 0;
  // the tower's core: a few big puffs that give it mass
  for (let k = 0; k < 22; k++) {
    const hz = Math.pow(R(i++), 0.9);
    out.push({ hz, th: R(i++) * Math.PI * 2, rho: 0.15 + 0.3 * R(i++), rr: 0.5 + 0.2 * R(i++), ph: R(i++) * 6.283, w: 0.5 + R(i++), kind: 0, ua: 0, va: 0 });
  }
  // the tower shell: many smaller turrets, final heights spread up the mature column (biased low: the broad body)
  for (let k = 0; k < 260; k++) {
    const hz = Math.pow(R(i++), 0.8);
    out.push({ hz, th: R(i++) * Math.PI * 2, rho: 0.66 + 0.34 * Math.sqrt(R(i++)), rr: 0.14 + 0.22 * Math.pow(R(i++), 1.5), ph: R(i++) * 6.283, w: 0.5 + R(i++), kind: 0, ua: 0, va: 0 });
  }
  // the flanking line: three smaller turrets stepping down away from the main tower (upwind, south-west side)
  for (let fl = 1; fl <= 3; fl++) {
    for (let k = 0; k < 40 - fl * 6; k++) {
      const hz = Math.pow(R(i++), 0.75);
      out.push({ hz, th: R(i++) * Math.PI * 2, rho: 0.2 + 0.7 * Math.sqrt(R(i++)), rr: 0.38 + 0.26 * Math.pow(R(i++), 1.3), ph: R(i++) * 6.283, w: 0.5 + R(i++), kind: 0, ua: 0, va: 0, fl });
    }
  }
  // the base skirt: flattened puffs along the flat base
  for (let k = 0; k < 18; k++) {
    // irregular: random angles, distances and sizes (evenly spaced skirt lobes read as a frilly curtain)
    out.push({ hz: 0, th: R(i++) * Math.PI * 2, rho: 0.55 + 0.45 * R(i++), rr: 0.2 + 0.24 * Math.pow(R(i++), 1.6), ph: R(i++) * 6.283, w: 0.5 + R(i++), kind: 1, ua: 0, va: 0 });
  }
  // the anvil: puffs along the downwind axis (ua 0..1) and across it (va -1..1)
  for (let k = 0; k < 90; k++) {
    out.push({ hz: 1, th: 0, rho: 0, rr: 0.5 + 0.4 * R(i++), ph: R(i++) * 6.283, w: 0.4 + R(i++), kind: 2, ua: Math.pow(R(i++), 0.9), va: R(i++) * 2 - 1 });
  }
  PUFFS.set(seed, out);
  return out;
};

// ---- colours ------------------------------------------------------------------------------------------------------
/** the storm's heavy lower body and base (warm slate grey-brown, never black) */
const STORM_BODY: RGB = hexRgb("#655B53");
const STORM_BASE: RGB = hexRgb("#4B433D");
const PAL_BASE: RGB = hexRgb("#6A564A"); // the underside (warm grey-brown, never black)
const PAL_SHADE: RGB = hexRgb("#8E7B68"); // faces away from the sun (a warm mauve-grey)
const PAL_MID: RGB = hexRgb("#D0B898");
const PAL_LIT: RGB = hexRgb("#F7E6CC"); // sunlit cream
const PAL_GOLD: RGB = hexRgb("#FFF1D8"); // the brightest sunlit turrets
const RAIN: RGB = hexRgb("#544C46");
const AMBER: RGB = hexRgb(COLOR.amberTop);
const AMBER_HOT: RGB = hexRgb(COLOR.amberHot);
/** the light in screen space (x right, y down, z toward the viewer): the low sun on the left, a little above */
const LS = (() => {
  const l = [-0.88, -0.32, 0.36];
  const n = Math.hypot(l[0], l[1], l[2]);
  return [l[0] / n, l[1] / n, l[2] / n];
})();

/** One drawable at a depth: a cell's lit image (an offscreen canvas placed in screen px) or its rain shaft. */
export type CloudItem =
  | { type: "cell"; d: number; canvas: HTMLCanvasElement; x: number; y: number; w: number; h: number; soft: number }
  | { type: "rain"; d: number; pts: { x: number; y: number }[]; a: number; col: RGB; seed: number; S: number; boil: number };

type SPuff = { x: number; y: number; rx: number; ry: number; h0: number; bias: number; vy: number; anv: number };
const POOL: HTMLCanvasElement[] = [];
let poolAt = 0;
/** reset the offscreen canvas pool (the stage calls it once per frame) */
export const resetCloudPool = () => {
  poolAt = 0;
};
const poolCanvas = (w: number, h: number) => {
  let c = POOL[poolAt];
  if (!c) {
    c = document.createElement("canvas");
    POOL[poolAt] = c;
  }
  poolAt++;
  if (c.width !== w || c.height !== h) {
    c.width = w;
    c.height = h;
  }
  return c;
};

/** box blur (separable, running sums), radius r, in place into a new array */
const boxBlur = (src: Float32Array, w: number, h: number, r: number) => {
  const tmp = new Float32Array(w * h);
  const out = new Float32Array(w * h);
  const inv = 1 / (2 * r + 1);
  for (let j = 0; j < h; j++) {
    const row = j * w;
    let acc = 0;
    for (let i = -r; i <= r; i++) acc += src[row + Math.min(w - 1, Math.max(0, i))];
    for (let i = 0; i < w; i++) {
      tmp[row + i] = acc * inv;
      acc += src[row + Math.min(w - 1, i + r + 1)] - src[row + Math.max(0, i - r)];
    }
  }
  for (let i = 0; i < w; i++) {
    let acc = 0;
    for (let j = -r; j <= r; j++) acc += tmp[Math.min(h - 1, Math.max(0, j)) * w + i];
    for (let j = 0; j < h; j++) {
      out[j * w + i] = acc * inv;
      acc += tmp[Math.min(h - 1, j + r + 1) * w + i] - tmp[Math.max(0, j - r) * w + i];
    }
  }
  return out;
};
/** normalised blur of a field defined where wt > 0 (two box passes ~ a gaussian) */
const normBlur = (f: Float32Array, wt: Float32Array, w: number, h: number, r: number) => {
  const fw = new Float32Array(w * h);
  for (let n = 0; n < f.length; n++) fw[n] = f[n] * wt[n];
  const a = boxBlur(boxBlur(fw, w, h, r), w, h, r);
  const b = boxBlur(boxBlur(wt, w, h, r), w, h, r);
  for (let n = 0; n < a.length; n++) a[n] = b[n] > 1e-4 ? a[n] / b[n] : 0;
  return a;
};
/** smooth value noise 0..1 with quintic interpolation (C2: no grid steps in its gradient) */
const vnoise5 = (x: number, y: number) => {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * xf * (xf * (xf * 6 - 15) + 10);
  const t = yf * yf * yf * (yf * (yf * 6 - 15) + 10);
  const hh = (a: number, b: number) => hash01(a * 57.31 + b * 131.73);
  return lerp(lerp(hh(xi, yi), hh(xi + 1, yi), u), lerp(hh(xi, yi + 1), hh(xi + 1, yi + 1), u), t);
};

/**
 * The drawables of one cell. The cell's puffs are spheres in the world; projected, they build a HEIGHT FIELD in
 * screen space (max of sphere caps, each lifted by how far toward the eye its centre sits), so the union reads as one
 * lumpy volume: normals from the field, lit by the low sun on the left with a soft wrap (clouds scatter), brighter
 * toward the top, the base and the far side in warm grey-brown, the whole veiled by the air at the cell's distance.
 */
export const cellItems = (v: DenView, c: StormState, S: number): CloudItem[] => {
  const g = clamp01(c.growth);
  const sz = c.size ?? 1;
  const p0 = cellPos(c, S);
  const top = topAt(g);
  const items: CloudItem[] = [];
  const puffs = puffsOf(c.seed);
  const glow = clamp01(c.glow ?? 0);
  const storm = clamp01(c.storminess ?? smooth(0.45, 0.95, c.growth));
  const flick = clamp01(c.flicker ?? 0);
  const B = Math.max(0, c.boil ?? STORM_BOIL);
  const anvil = smooth(0.68, 1, g);
  const ad = ((c.anvilDir ?? 80) * Math.PI) / 180;
  const adx = Math.sin(ad);
  const ady = Math.cos(ad);
  // the flanking line steps away upwind (default: a little south of west for the default ENE anvil)
  const fa = ((c.flankDir ?? FLANK_DIR_DEFAULT) * Math.PI) / 180;
  const centre = v.project(p0.x, p0.y, ((CLOUD.baseZ + top) / 2) * sz);
  if (!centre) return items;
  const kC = v.F / centre.d;
  const sp: SPuff[] = [];
  for (const pf of puffs) {
    let x: number;
    let y: number;
    let z: number;
    let r: number;
    let squash = 1;
    let bias = 0; // + brighter (sunlit tops, the anvil), - darker (the base)
    if (pf.kind === 2) {
      if (anvil <= 0.001) continue;
      // a flat shelf that flows out of the column's top: it starts as wide as the flared top and spreads downwind,
      // widening, its underside thinning toward the leading edge (wispy there: the edge noise eats it)
      const lbA = lobe(S, 60 + 40 * pf.w, pf.ph);
      const along = (pf.ua * 1.15 - 0.15 + B * 0.05 * lbA.env) * CLOUD.anvilLen * anvil;
      const rootW = colR(top - 0.5, g, top);
      const half = rootW * (0.9 + 0.12 * along) + 0.35 * along;
      const drift = 0.03 * Math.sin(S * 0.02 * pf.w + pf.ph);
      x = p0.x + (adx * along - ady * pf.va * half + drift) * sz;
      y = p0.y + (ady * along + adx * pf.va * half) * sz;
      const rr = pf.rr * (0.32 + 1.1 * Math.pow(1 - Math.max(0, pf.ua), 1.3)) * (0.5 + 0.5 * anvil) * (0.8 + 0.3 * rootW);
      z = (Math.min(top, CLOUD.anvilZ + 0.55) - rr * 0.3 + 0.04 * Math.sin(pf.ph)) * sz;
      r = rr * sz;
      squash = 0.28;
      bias = 0.4 - 0.14 * pf.ua;
    } else if (pf.kind === 1) {
      const Rb = colR(CLOUD.baseZ, g, top);
      // the base churns: skirt lobes travel slowly round the base, swelling and shrinking (scud)
      const wob = 0.05 * Math.sin(S * 0.03 * pf.w + pf.ph);
      const th = pf.th + B * S * 0.0035 * (pf.w - 0.2);
      const lb = lobe(S, 46 + 30 * pf.w, pf.ph);
      x = p0.x + Math.cos(th) * pf.rho * Rb * sz * (1 + wob + B * 0.035 * (lb.env2 - 0.5));
      y = p0.y + Math.sin(th) * pf.rho * Rb * sz * (1 + wob + B * 0.035 * (lb.env2 - 0.5));
      z = CLOUD.baseZ * sz + 0.1 * sz - B * 0.015 * lb.env * sz;
      r = pf.rr * Rb * sz * (1 + B * 0.12 * (lb.env2 - 0.45));
      squash = 0.45;
      bias = -0.35;
    } else {
      // the main tower (fl 0) or a flanking turret (fl 1..3): each its own column with its own top
      const fl = pf.fl ?? 0;
      const hf = [1, 0.62, 0.44, 0.3][fl];
      const fTop = CLOUD.baseZ + (top - CLOUD.baseZ) * hf * smooth(0.04 * fl, 0.3 + 0.12 * fl, g);
      if (fl > 0 && fTop < CLOUD.baseZ + 0.25) continue;
      const rScale = [1, 0.62, 0.5, 0.4][fl];
      const fd = [0, 1.25, 2.15, 2.9][fl] * colR(CLOUD.baseZ, g, top);
      const fx0 = Math.sin(fa) * fd;
      const fy0 = Math.cos(fa) * fd;
      const zf = CLOUD.baseZ + pf.hz * (fl === 0 ? CLOUD.topMax - CLOUD.baseZ : fTop - CLOUD.baseZ);
      const colAt = (zz: number) => colR(CLOUD.baseZ + ((zz - CLOUD.baseZ) / Math.max(0.3, fTop - CLOUD.baseZ)) * (top - CLOUD.baseZ), g, top) * rScale;
      const Rz = colAt(Math.min(zf, fTop));
      r = pf.rr * Rz;
      const capZ = fTop - 0.5 * r - pf.rho * pf.rho * 0.42 * colAt(fTop - 0.4);
      z = Math.min(zf, capZ);
      z = Math.max(CLOUD.baseZ + 0.45 * r, z);
      const Rl = colAt(z);
      const act = 1 + 1.6 * smooth(0.4, 0, Math.abs(z - capZ));
      const wob = 0.035 * act;
      const ox = wob * Rl * Math.sin(S * 0.045 * pf.w + pf.ph);
      const oz = wob * Rl * Math.cos(S * 0.038 * pf.w + pf.ph * 1.3);
      const hrel = clamp01((z - CLOUD.baseZ) / Math.max(0.4, top - CLOUD.baseZ));
      // the tower leans a little downwind as it climbs into the shear
      const lean = 1.1 * hrel * hrel * smooth(0.3, 1, g) * (fl === 0 ? 1 : 0.4);
      // storm life: each lobe is born small inside the body, swells, rises and rolls outward over the top, then shrinks
      // and sinks back in; strongest near the active top, gentler low on the body
      const lb = lobe(S, 34 + 30 * pf.w, pf.ph);
      const topW = 0.45 + 0.55 * Math.max(hrel, smooth(1, 2.2, act));
      const roll = B * topW;
      const rhoL = pf.rho * (1 + roll * 0.16 * (lb.env2 - 0.45));
      const thL = pf.th + roll * 0.22 * Math.sin(2 * Math.PI * lb.lp);
      const riseL = roll * 0.32 * Rl * lb.env;
      x = p0.x + (fx0 + Math.cos(thL) * rhoL * Rl + ox + adx * lean) * sz;
      y = p0.y + (fy0 + Math.sin(thL) * rhoL * Rl + ady * lean) * sz;
      z = z * sz + oz * sz + riseL * sz;
      r = r * (1 + 0.04 * Math.sin(S * 0.05 * pf.w + pf.ph) + roll * 0.42 * (lb.env2 - 0.45)) * sz;
      bias = 0.22 * hrel - 0.12 + (fl > 0 ? 0.14 : 0);
    }
    const pc = v.project(x, y, z);
    if (!pc) continue;
    const k = v.F / pc.d;
    const rs = r * k;
    if (rs < 0.5) continue;
    sp.push({ x: pc.x, y: pc.y, rx: rs, ry: rs * squash, h0: (centre.d - pc.d) * kC, bias, vy: z / sz, anv: pf.kind === 2 ? 1 : 0 });
  }
  if (!sp.length) return items;
  // the raster: half resolution for big cells
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const p of sp) {
    x0 = Math.min(x0, p.x - p.rx);
    x1 = Math.max(x1, p.x + p.rx);
    y0 = Math.min(y0, p.y - p.ry);
    y1 = Math.max(y1, p.y + p.ry);
  }
  x0 = Math.max(x0, -400);
  y0 = Math.max(y0, -400);
  x1 = Math.min(x1, W_SCREEN + 400);
  y1 = Math.min(y1, H_SCREEN + 400);
  if (x1 <= x0 || y1 <= y0) return items;
  const area = (x1 - x0) * (y1 - y0);
  const q = area > 900000 ? 0.5 : area > 250000 ? 0.7 : 1;
  const w = Math.max(2, Math.ceil((x1 - x0) * q) + 2);
  const h = Math.max(2, Math.ceil((y1 - y0) * q) + 2);
  const N = w * h;
  const Hf = new Float32Array(N).fill(-1e9);
  const Cv = new Float32Array(N);
  const Bi = new Float32Array(N);
  const Av = new Float32Array(N);
  const Vz = new Float32Array(N);
  for (const p of sp) {
    const cx = (p.x - x0) * q;
    const cy = (p.y - y0) * q;
    const rx = p.rx * q;
    const ry = p.ry * q;
    const ia = Math.max(0, Math.floor(cx - rx));
    const ib = Math.min(w - 1, Math.ceil(cx + rx));
    const ja = Math.max(0, Math.floor(cy - ry));
    const jb = Math.min(h - 1, Math.ceil(cy + ry));
    const hq = p.h0 * q;
    for (let j = ja; j <= jb; j++) {
      const dy = (j + 0.5 - cy) / ry;
      const dy2 = dy * dy;
      if (dy2 >= 1) continue;
      const row = j * w;
      for (let i = ia; i <= ib; i++) {
        const dx = (i + 0.5 - cx) / rx;
        const rho2 = dx * dx + dy2;
        if (rho2 >= 1) continue;
        const cap = Math.sqrt(1 - rho2);
        const hh = hq + rx * cap;
        const idx = row + i;
        const e = Math.min(1, (1 - Math.sqrt(rho2)) * rx * 0.9);
        if (e > Cv[idx]) Cv[idx] = e;
        if (hh > Hf[idx]) {
          Hf[idx] = hh;
          Bi[idx] = p.bias;
          Av[idx] = p.anv;
          Vz[idx] = p.vy;
        }
      }
    }
  }
  // smoothed fields (normalised convolution, so the outside does not pull the edge down): a light smoothing for the
  // turrets (soft creases, no hard balls) and a broad one for the tower's large form (lit west side, shaded east)
  const Hn = new Float32Array(N);
  const Wt = new Float32Array(N);
  let hMin = Infinity;
  for (let n = 0; n < N; n++) if (Cv[n] > 0 && Hf[n] < hMin) hMin = Hf[n];
  for (let n = 0; n < N; n++) {
    if (Cv[n] > 0) {
      Wt[n] = 1;
      Hn[n] = Hf[n] - hMin;
    }
  }
  const rFine = Math.max(1, Math.round(kC * q * 0.06 * sz));
  const rBroad = Math.max(2, Math.round(kC * q * 0.55 * sz));
  const Hs = normBlur(Hn, Wt, w, h, rFine);
  const Hb = normBlur(Hn, Wt, w, h, rBroad);
  // the edge: the union's coverage blurred, then cut by world-anchored fBm (soft, noisy, cauliflower edges: no sphere
  // silhouette survives) ...
  const pxPerMi = kC * q;
  const rEdge = Math.max(1, Math.round(pxPerMi * 0.045 * sz));
  const bin = new Float32Array(N);
  for (let n = 0; n < N; n++) bin[n] = Cv[n] > 0 ? 1 : 0;
  const Cb = boxBlur(boxBlur(bin, w, h, rEdge), w, h, rEdge);
  const octs = [3.2, 6.7, 13.9].filter((f) => pxPerMi / (f / sz) >= 4);
  const amps = [0.55, 0.3, 0.17];
  const nx0w = (x0 - centre.x) / kC;
  const ny0w = (y0 - centre.y) / kC;
  const boil = S * (0.012 + 0.016 * B);
  const Nz = new Float32Array(N);
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const idx = j * w + i;
      if (Cb[idx] <= 0.001) continue;
      const wx = (nx0w + i / pxPerMi) / sz;
      const wy = (ny0w + j / pxPerMi) / sz;
      let n = 0;
      for (let o = 0; o < octs.length; o++) n += amps[o] * (vnoise5(wx * octs[o] + c.seed * 1.7 + boil * (o + 1), wy * octs[o] - boil * 0.6) - 0.5);
      Nz[idx] = n;
    }
  }
  // ... and the flat base: nothing below the near arc of the projected base circle
  const Rbase = colR(CLOUD.baseZ, g, top) * 1.05 * sz;
  // the flat bases: the main tower's base circle and each flanking turret's, projected; a column under none of them is
  // not clipped
  const bottom = new Float32Array(w).fill(-1);
  const colCov = new Float32Array(w);
  {
    const Rb0 = colR(CLOUD.baseZ, g, top);
    const bases: { x: number; y: number; r: number }[] = [{ x: p0.x, y: p0.y, r: Rbase }];
    for (let fl = 1; fl <= 3; fl++) {
      const fd = [0, 1.25, 2.15, 2.9][fl] * Rb0;
      const rS = [1, 0.62, 0.5, 0.4][fl];
      bases.push({ x: p0.x + Math.sin(fa) * fd * sz, y: p0.y + Math.cos(fa) * fd * sz, r: Rb0 * rS * 1.1 * sz });
    }
    for (const bs of bases) {
      const ring: { x: number; y: number }[] = [];
      for (let a = 0; a <= 120; a++) {
        const ang = (a / 120) * Math.PI * 2;
        const bq = v.project(bs.x + Math.cos(ang) * bs.r, bs.y + Math.sin(ang) * bs.r, CLOUD.baseZ * sz);
        if (bq) ring.push({ x: (bq.x - x0) * q, y: (bq.y - y0) * q });
      }
      for (let k = 0; k < ring.length - 1; k++) {
        const A = ring[k];
        const B = ring[k + 1];
        const ia = Math.max(0, Math.ceil(Math.min(A.x, B.x)));
        const ib = Math.min(w - 1, Math.floor(Math.max(A.x, B.x)));
        for (let i = ia; i <= ib; i++) {
          const t = Math.abs(B.x - A.x) < 1e-6 ? 0 : (i - A.x) / (B.x - A.x);
          bottom[i] = Math.max(bottom[i], A.y + (B.y - A.y) * t);
        }
      }
    }
    // which columns lie over a base (softened over ~a base band): the base is solid there
    {
      const raw = new Float32Array(w);
      for (let i = 0; i < w; i++) raw[i] = bottom[i] >= 0 ? 1 : 0;
      const rr = Math.max(1, Math.round(Rbase * kC * q * 0.12));
      for (let i = 0; i < w; i++) {
        let a = 0;
        let n = 0;
        for (let k = Math.max(0, i - rr); k <= Math.min(w - 1, i + rr); k++) {
          a += raw[k];
          n++;
        }
        colCov[i] = smooth(0.15, 0.85, a / n);
      }
    }
    // columns under no base circle take the nearest covered column's base (no vertical seam at a ring's edge)
    let last = -1;
    const firstCovered = bottom.findIndex((b) => b >= 0);
    for (let i = 0; i < w; i++) {
      if (bottom[i] >= 0) last = bottom[i];
      else bottom[i] = last >= 0 ? last : firstCovered >= 0 ? bottom[firstCovered] : h + 1e4;
    }
    // the base line is an ENVELOPE, never a column-by-column cut: a running max over a window as wide as the puffs'
    // overhang (so a nearer tower's body is never clipped by a farther flank's base in the next column), then smoothed,
    // so no straight vertical edge can appear at any size
    const win = Math.max(2, Math.round(Rbase * kC * q * 0.6));
    const dil = new Float32Array(w);
    for (let i = 0; i < w; i++) {
      let m = -Infinity;
      for (let k = Math.max(0, i - win); k <= Math.min(w - 1, i + win); k++) m = Math.max(m, bottom[k]);
      dil[i] = m;
    }
    const sm = Math.max(1, Math.round(win * 0.5));
    for (let i = 0; i < w; i++) {
      let a = 0;
      let n = 0;
      for (let k = Math.max(0, i - sm); k <= Math.min(w - 1, i + sm); k++) {
        a += dil[k];
        n++;
      }
      bottom[i] = a / n;
    }
  }
  const baseBand = Math.max(2, Rbase * kC * q * 0.22);
  // shading LUT: light 0..1 -> colour (fogged)
  const fog = fogAt(v, p0.x, p0.y, ((CLOUD.baseZ + top) / 2) * sz);
  const lut = new Uint8ClampedArray(256 * 3);
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    let col: RGB;
    if (t < 0.25) col = mixRgb(PAL_BASE, PAL_SHADE, t / 0.25);
    else if (t < 0.55) col = mixRgb(PAL_SHADE, PAL_MID, (t - 0.25) / 0.3);
    else if (t < 0.85) col = mixRgb(PAL_MID, PAL_LIT, (t - 0.55) / 0.3);
    else col = mixRgb(PAL_LIT, PAL_GOLD, (t - 0.85) / 0.15);
    col = mixRgb(col, HAZE, fog);
    lut[i * 3] = col[0];
    lut[i * 3 + 1] = col[1];
    lut[i * 3 + 2] = col[2];
  }
  const glowRgb = mixRgb(AMBER, AMBER_HOT, 0.4);
  const flashRgb = mixRgb(AMBER, AMBER_HOT, 0.62);
  const root = v.project(p0.x, p0.y, CLOUD.baseZ * sz);
  const rootX = root ? root.x : centre.x;
  const rootY = root ? root.y : centre.y;
  const rootR = Math.max(4, colR(CLOUD.baseZ, g, top) * sz * kC * 0.75);
  const cvs = poolCanvas(w, h);
  const cx2 = cvs.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D;
  const img = cx2.createImageData(w, h);
  const D = img.data;
  const baseZs = CLOUD.baseZ;
  const span = Math.max(0.5, top - baseZs);
  // detail: a world-anchored value noise (miles), so the texture rides with the cell and the camera
  const nScale = 1 / (kC * q); // miles per raster px
  const nx0 = (x0 - centre.x) / kC;
  const ny0 = (y0 - centre.y) / kC;
  const bump = 0.06 * sz;
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const idx = j * w + i;
      if (Cb[idx] <= 0.001) continue;
      const nz = Nz[idx];
      let alpha = smooth(0.34, 0.62, Cb[idx] + nz * 0.75);
      if (Av[idx] > 0) {
        // the anvil's edge: fibrous streaks drawn out along the shelf (screen-horizontal), thin and wispy
        const fx = (nx0w + i / pxPerMi) / sz;
        const fy = (ny0w + j / pxPerMi) / sz;
        const stream = S * 0.012 * B; // the anvil's fibres stream downwind
        const fib = vnoise5((fx - stream) * 1.6 + c.seed, fy * 16 + boil) * 0.6 + vnoise5((fx - stream * 1.3) * 3.1 - c.seed, fy * 31) * 0.4 - 0.5;
        alpha = smooth(0.22, 0.8, Cb[idx] + fib * 0.9 + nz * 0.3) * 0.96;
      }
      // raster px above the flat base; the base edge is ragged with churning scud (world-anchored noise on the clock)
      // irregular scud: a domain-warped two-octave noise (no lattice rhythm) plus a few ragged dark tufts hanging lower
      // at random places, all churning slowly on the clock
      let scud = 0;
      if (B > 0) {
        const u = (nx0w + i / pxPerMi) / sz;
        const warp = vnoise5(u * 0.73 + c.seed * 0.31, S * 0.006) - 0.5;
        const n1 = vnoise5(u * 1.37 + warp * 2.2 + c.seed, S * 0.011) - 0.5;
        const n2 = vnoise5(u * 3.91 - warp * 1.7 + c.seed * 2.3, S * 0.019 + 3.1) - 0.5;
        const tuftN = vnoise5(u * 0.61 + warp + c.seed * 4.7, S * 0.007 + 7.3);
        const tuft = Math.max(0, tuftN - 0.6) * 4.2 * (0.6 + 0.4 * (n2 + 0.5));
        scud = B * baseBand * (0.45 * n1 + 0.22 * n2 + 1.35 * tuft);
      }
      const above = bottom[i] - j + scud;
      // near the flat base the edge noise fades out, so the base is solid (no holes, the ring never shows through) but
      // keeps the soft coverage edge (no forced fill beyond the cloud: no stubs)
      if (Av[idx] === 0) {
        const baseness = smooth(baseBand * 3, baseBand * 0.5, above);
        alpha = Math.max(alpha * (1 - baseness), baseness * smooth(0.3, 0.6, Cb[idx] + nz * 0.15));
        // over the base's footprint the underside is one solid mass (no see-through gaps between skirt lobes)
        alpha = Math.max(alpha, 0.98 * colCov[i] * smooth(baseBand * 5, baseBand * 2.5, above) * smooth(0.05, 0.3, Cb[idx]));
      }
      // a soft, wispy bottom edge (deeper softness where tufts hang)
      alpha *= smooth(-1.2, 2.2, above);
      if (alpha <= 0.004) continue;
      const cov = alpha;
      const il = i > 0 && Wt[idx - 1] > 0 ? idx - 1 : idx;
      const ir = i < w - 1 && Wt[idx + 1] > 0 ? idx + 1 : idx;
      const iu = j > 0 && Wt[idx - w] > 0 ? idx - w : idx;
      const id = j < h - 1 && Wt[idx + w] > 0 ? idx + w : idx;
      const wx = nx0 + i * nScale;
      const wy = ny0 + j * nScale;
      // the fBm as a bump (world-anchored): the small cauliflower texture on the turrets
      const nl = i > 0 ? Nz[idx - 1] : nz;
      const nr = i < w - 1 ? Nz[idx + 1] : nz;
      const nu = j > 0 ? Nz[idx - w] : nz;
      const nd = j < h - 1 ? Nz[idx + w] : nz;
      const gnx = -(nr - nl) * bump * pxPerMi;
      const gny = -(nd - nu) * bump * pxPerMi;
      void wx;
      void wy;
      // fine normal (turrets) and broad normal (the tower's form)
      let fx = -(Hs[ir] - Hs[il]) * 0.5 + gnx;
      let fy = -(Hs[id] - Hs[iu]) * 0.5 + gny;
      let fl = Math.hypot(fx, fy, 1);
      const fdl = (fx * LS[0] + fy * LS[1] + LS[2]) / fl;
      fx = -(Hb[ir] - Hb[il]) * 1.4;
      fy = -(Hb[id] - Hb[iu]) * 1.4;
      fl = Math.hypot(fx, fy, 1);
      const bdl = (fx * LS[0] + fy * LS[1] + LS[2]) / fl;
      const ndl = 0.55 * fdl + 0.45 * bdl;
      const wrap = Math.max(0, (ndl + 0.32) / 1.32);
      const hrel = Math.min(1, Math.max(0, (Vz[idx] - baseZs) / span));
      // the flat base and the low body sink into the shadow (self-shadowing under the tower)
      const baseShade = 0.32 * Math.exp(-Math.max(0, above) / baseBand);
      let L = 0.08 + 0.98 * Math.pow(wrap, 1.35) + Bi[idx] + 0.12 * hrel - baseShade * (1 - Av[idx]) + 0.1 * nz + 0.1 * Av[idx];
      // the underside is in its own shadow: the light fades out toward the flat base (the skirt lobes' tops must not
      // light up as a row of bright arches)
      if (Av[idx] === 0) L *= 0.3 + 0.7 * smooth(baseBand * 0.4, baseBand * 4, above);
      L = Math.min(1, Math.max(0, L));
      const li = Math.round(L * 255) * 3;
      let r = lut[li];
      let gg = lut[li + 1];
      let b = lut[li + 2];
      // the storm: the lower body sinks to a heavy warm slate toward the base (top-lit, bottom-dark); lit faces keep a
      // little of their light; upper turrets and the anvil stay cream
      if (storm > 0 && Av[idx] === 0) {
        const low = 1 - smooth(0.12, 0.62, hrel);
        const k = storm * (0.25 + 0.7 * low) * (1 - 0.35 * L);
        const tgt = mixRgb(mixRgb(STORM_BODY, STORM_BASE, Math.exp(-Math.max(0, above) / (baseBand * 1.6))), HAZE, fog);
        r += (tgt[0] - r) * k;
        gg += (tgt[1] - gg) * k;
        b += (tgt[2] - b) * k;
      }
      if (flick > 0 && Av[idx] === 0) {
        // in-cloud lightning: a soft warm glow from inside the lower-middle body, brightest at its heart
        const ddx = (i / q + x0 - rootX) / (rootR * 1.4);
        const ddy = (j / q + y0 - (rootY - rootR * 1.6)) / (rootR * 1.5);
        const fw = flick * Math.exp(-(ddx * ddx + ddy * ddy) * 0.9) * (0.62 + 0.3 * (1 - L));
        r += (flashRgb[0] - r) * fw * 0.85;
        gg += (flashRgb[1] - gg) * fw * 0.85;
        b += (flashRgb[2] - b) * fw * 0.85;
      }
      if (glow > 0) {
        // a soft internal glow: a feathered blob centred a little above the bolt's root (inside the cloud), fading
        // across the base and toward its edge (no hard band along the flat base)
        const ddx = (i / q + x0 - rootX) / rootR;
        const ddy = (j / q + y0 - (rootY - rootR * 0.35)) / (rootR * 0.75);
        const edgeFade = smooth(0, baseBand * 2.2, above);
        const gw = glow * Math.exp(-(ddx * ddx + ddy * ddy) * 1.3) * edgeFade * (0.35 + 0.4 * (1 - L));
        r += (glowRgb[0] - r) * gw * 0.5;
        gg += (glowRgb[1] - gg) * gw * 0.5;
        b += (glowRgb[2] - b) * gw * 0.5;
      }
      const o = idx * 4;
      D[o] = r;
      D[o + 1] = gg;
      D[o + 2] = b;
      D[o + 3] = Math.round(Math.min(1, cov) * 255);
    }
  }
  cx2.putImageData(img, 0, 0);
  items.push({ type: "cell", d: centre.d, canvas: cvs, x: x0, y: y0, w: w / q, h: h / q, soft: 0.4 + 3.2 * fog });
  // the rain shaft: from the base down to the ground, slanting a little with the drift
  const rainA = (c.rain ?? smooth(0.45, 0.8, g)) * (c.rainStrength ?? 1);
  if (rainA > 0.01) {
    const Rb = colR(CLOUD.baseZ, g, top) * 0.85 * sz;
    const pts: { x: number; y: number }[] = [];
    const lean = 0.45 * sz;
    const corners: [number, number, number][] = [
      [-Rb, 0, CLOUD.baseZ * sz],
      [Rb, 0, CLOUD.baseZ * sz],
      [Rb * 0.85 + lean, 0, 0],
      [-Rb * 0.85 + lean, 0, 0],
    ];
    // the shaft hangs from the NEAR side of the base (toward the eye) so its top shows below the base, and is drawn in
    // front of the cell's body
    const tx = v.eye[0] - p0.x;
    const ty = v.eye[1] - p0.y;
    const tl = Math.hypot(tx, ty) || 1;
    const near = colR(CLOUD.baseZ, g, top) * 0.9 * sz;
    const nx = p0.x + (tx / tl) * near;
    const ny = p0.y + (ty / tl) * near;
    for (const [dx, , cz] of corners) {
      const qq = v.project(nx + dx * v.r[0], ny + dx * v.r[1], cz);
      if (!qq) return items;
      pts.push({ x: qq.x, y: qq.y });
    }
    const fogR = fogAt(v, p0.x, p0.y, 0.5);
    items.push({ type: "rain", d: centre.d - 0.05, pts, a: Math.min(1, rainA * (1 - 0.45 * fogR) * 2), col: mixRgb(RAIN, HAZE, fogR * 0.4), seed: c.seed, S, boil: B });
  }
  return items;
};
const W_SCREEN = 1080;
const H_SCREEN = 1920;

/** Paint cloud items (already sorted far -> near) on a 2D canvas. */
export const paintCloudItem = (ctx: CanvasRenderingContext2D, it: CloudItem) => {
  if (it.type === "cell") {
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(it.canvas, it.x, it.y, it.w, it.h);
    ctx.restore();
    return;
  }
  // rain: a soft veil with a few darker streaks, fading toward the ground
  const [a, b, c, d] = it.pts;
  const yTop = Math.min(a.y, b.y);
  const yBot = Math.max(c.y, d.y);
  if (yBot - yTop < 2) return;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.lineTo(c.x, c.y);
  ctx.lineTo(d.x, d.y);
  ctx.closePath();
  ctx.clip();
  const wTop = b.x - a.x;
  // the veil: darkest just under the base, fading to nothing at the ground and softly at both sides (vertical strips
  // with a sine profile across the shaft: no canvas blur, which the headless renderer drops at large radii)
  const nS = 16;
  for (let k = 0; k < nS; k++) {
    const u0 = k / nS;
    const u1 = (k + 1) / nS;
    const prof = Math.pow(Math.sin(Math.PI * (u0 + u1) * 0.5), 1.4);
    const gr = ctx.createLinearGradient(0, yTop, 0, yBot);
    gr.addColorStop(0, rgbCss(it.col, it.a * 0.95 * prof));
    gr.addColorStop(0.55, rgbCss(it.col, it.a * 0.75 * prof));
    gr.addColorStop(0.92, rgbCss(it.col, it.a * 0.6 * prof));
    gr.addColorStop(1, rgbCss(it.col, it.a * 0.4 * prof));
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.moveTo(lerp(a.x, b.x, u0) - 0.5, a.y);
    ctx.lineTo(lerp(a.x, b.x, u1) + 0.5, b.y);
    ctx.lineTo(lerp(d.x, c.x, u1) + 0.5, c.y);
    ctx.lineTo(lerp(d.x, c.x, u0) - 0.5, d.y);
    ctx.closePath();
    ctx.fill();
  }
  // streaks: thin slanted falls of rain, each fading toward the ground (they sway slowly on the story clock)
  for (let k = 0; k < 18; k++) {
    const u = 0.08 + 0.84 * hash01(it.seed * 3.1 + k * 7.7);
    const sway = 0.012 * Math.sin(it.S * 0.05 + k);
    const xt = lerp(a.x, b.x, u);
    const xb = lerp(d.x, c.x, Math.min(1, Math.max(0, u + sway)));
    const len = 0.75 + 0.25 * hash01(k * 5.1 + it.seed);
    const g2 = ctx.createLinearGradient(0, yTop, 0, yTop + (yBot - yTop) * len);
    const al = it.a * (0.3 + 0.35 * hash01(k + it.seed));
    g2.addColorStop(0, rgbCss(it.col, al));
    g2.addColorStop(1, rgbCss(it.col, 0));
    ctx.strokeStyle = g2;
    ctx.lineWidth = Math.max(1, wTop * (0.015 + 0.035 * hash01(k * 2.3 + it.seed)));
    if (it.boil > 0) {
      // falling streaks: dashes that travel down the shaft on the story clock
      const hS = yBot - yTop;
      const dash = Math.max(4, hS * (0.08 + 0.06 * hash01(k * 1.9 + it.seed)));
      ctx.setLineDash([dash, dash * (0.5 + 0.5 * it.boil)]);
      ctx.lineDashOffset = -(it.S * hS * 0.035 * (0.8 + 0.4 * hash01(k * 3.7))) - hash01(k + 9) * dash * 2;
    }
    ctx.beginPath();
    ctx.moveTo(xt, yTop);
    ctx.lineTo(lerp(xt, xb, len), yTop + (yBot - yTop) * len);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.restore();
};

/** The ground shadow of a cell: a projected soft ellipse polygon (screen points) and its strength. */
export const cellShadow = (v: DenView, c: StormState, S: number) => {
  const g = clamp01(c.growth);
  const sz = c.size ?? 1;
  const p0 = cellPos(c, S);
  const top = topAt(g);
  const offF = shadowOffset((CLOUD.baseZ + 0.35 * (top - CLOUD.baseZ)) * sz);
  // under a raining cell the shadow sits nearly beneath it (the wet, dark ground the shaft falls on)
  const pull = 1 - 0.6 * smooth(0.45, 0.85, g);
  const off = { x: offF.x * pull, y: offF.y * pull };
  const R = colR(CLOUD.baseZ + 0.3, g, top) * sz * 1.05;
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * Math.PI * 2;
    const q = v.project(p0.x + off.x + Math.cos(a) * R * 1.25, p0.y + off.y + Math.sin(a) * R * 0.9, 0);
    if (!q) return null;
    pts.push(q);
  }
  return { pts, a: clamp01((0.5 * smooth(0.05, 0.7, g) + 0.06 + 0.12 * smooth(0.6, 1, g)) * (c.shadowStrength ?? 1)), blur: Math.max(3, v.scaleAt(p0.x, p0.y, 0) * R * 0.35) };
};

/** In-cloud lightning envelope for a list of event start frames: each event lights for `dur` frames (a quick rise,
 *  a short fall), 0 between events. Pass the result as a cell's `flicker`. */
export const flickerAt = (S: number, frames: number[], dur = 3) => {
  let m = 0;
  for (const f0 of frames) {
    const t = S - f0;
    if (t < -0.5 || t > dur) continue;
    m = Math.max(m, t < 0.5 ? 1 : Math.max(0, 1 - (t - 0.5) / (dur - 0.5)) * (0.75 + 0.25 * Math.cos(t * 2.3)));
  }
  return clamp01(m);
};
