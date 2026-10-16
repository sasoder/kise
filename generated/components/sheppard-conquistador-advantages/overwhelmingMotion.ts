// ---------------------------------------------------------------------------
// overwhelmingMotion: the parade-ground layout and the camera of
// OverwhelmingNumbers (pure maths, no React). World units: 1 = the spacing of
// two men in a rank (x right, y DOWN the page; the army marches toward -y).
//
// THE COUNT. 1 dot = 1 man-symbol. 200 orange (the Spanish company, 10 files x
// 20 ranks) to exactly 40,000 cream in 80 companies = 1 : 200 (Cortes's Third
// Letter: ~900 Spaniards at the 1521 siege; modern estimates of the allied
// force run up to ~200,000).
//
// THE HOST SURROUNDS the orange company: nine rows of companies (four ahead
// of it, its own, four behind), eight companies in its own row (four on each
// flank) and nine in every other. Companies differ a little (18-22 files x
// 22-26 ranks, each clearly bigger than the orange one); the rows are offset
// against each other (ROW_SHIFT), the lanes vary (3.5-5 units; 7+ round the
// orange company) and every row bends on the same shallow arc (ARC: the flanks
// trail). Inside a company the ranks are exact. The few companies whose depth
// is trimmed to make the count exact stand at the far ends of the outer rows,
// never in frame (the last one has a short rear rank).
// ---------------------------------------------------------------------------
import { clamp01, hash, smootherstep, type Cam } from "../kits/maps/incaShared";

export const N_SPANISH = 200;
export const SP_FILES = 10;
export const SP_RANKS = 20;
export const N_COMPANIES = 80;
export const N_ALLIES = 40000;

/** the orange company's centre (the world origin) */
export const SP_CENTRE: [number, number] = [0, 0];

/** a company: (x, y) = its front-left man; files along +x, ranks along +y; last = the men in its rear rank (default: files) */
export type Company = { x: number; y: number; files: number; ranks: number; seed: number; last?: number };

/** row pitch: the deepest company (25 across its ranks) + a 5-unit lane */
const PITCH_Y = 30;
/** the lane beside the orange company (a little air so it can be found) */
const SP_LANE = 7.5;
/** how far a row trails back at distance x from the middle */
const ARC = (x: number) => 0.0013 * x * x;
const ROW_SHIFT: Record<number, number> = { [-4]: 7, [-3]: -10, [-2]: 5, [-1]: -8.5, 1: 10.5, 2: -4, 3: 9, 4: -7.5 };

export const SPANISH: Company = { x: -(SP_FILES - 1) / 2, y: -(SP_RANKS - 1) / 2, files: SP_FILES, ranks: SP_RANKS, seed: 0 };

export const COMPANIES: Company[] = (() => {
  const out: Company[] = [];
  const filesOf = (s: number) => 18 + Math.floor(hash(s, 3) * 5); // 18..22
  const ranksOf = (s: number) => 22 + Math.floor(hash(s, 4) * 5); // 22..26
  const laneOf = (s: number) => 3.5 + hash(s, 5) * 1.5;
  const jy = (s: number) => (hash(s, 2) - 0.5) * 1.2;
  /** a company of the row whose line is y = rowY + ARC(x), its left file at x */
  const put = (x: number, rowY: number, files: number, ranks: number, seed: number) => {
    const cx = x + (files - 1) / 2;
    out.push({ x, y: rowY + ARC(cx) + jy(seed) - (ranks - 1) / 2, files, ranks, seed });
  };
  // the orange company's own row: four companies on each flank, laid outward
  for (let side = -1; side <= 1; side += 2) {
    let edge = (SP_FILES - 1) / 2 + SP_LANE;
    for (let i = 0; i < 4; i++) {
      const seed = 100 + out.length;
      const files = filesOf(seed);
      put(side > 0 ? edge : -edge - (files - 1), 0, files, ranksOf(seed), seed);
      edge += files - 1 + laneOf(seed);
    }
  }
  // the rows ahead (r < 0) and behind (r > 0): nine companies each, laid left to right, the row centred then shifted
  for (const r of [-4, -3, -2, -1, 1, 2, 3, 4]) {
    const seeds = Array.from({ length: 9 }, (_, i) => 100 + out.length + i);
    const widths = seeds.map((sd) => filesOf(sd) - 1);
    const lanes = seeds.map(laneOf);
    const total = widths.reduce((a, w) => a + w, 0) + lanes.slice(0, 8).reduce((a, w) => a + w, 0);
    let x = -total / 2 + ROW_SHIFT[r];
    seeds.forEach((sd, i) => {
      put(x, r * PITCH_Y, widths[i] + 1, ranksOf(sd), sd);
      x += widths[i] + lanes[i];
    });
  }
  // the exact count: deepen or trim the companies of the outermost rows, farthest from the middle first (never
  // in frame), one rank at a time, always on the side away from the host
  const far = out
    .map((_, i) => i)
    .filter((i) => Math.abs(out[i].y + out[i].ranks / 2) > 3.5 * PITCH_Y)
    .sort((a, b) => Math.abs(out[b].x + out[b].files / 2) - Math.abs(out[a].x + out[a].files / 2));
  let delta = N_ALLIES - out.reduce((a, c) => a + c.files * c.ranks, 0);
  for (let pass = 0; pass < 8 && Math.abs(delta) >= 18; pass++) {
    for (let q = 0; q < 8 && Math.abs(delta) >= 18; q++) {
      const c = out[far[q]];
      const d = Math.sign(delta);
      c.ranks += d;
      if (c.y < 0) c.y -= d;
      delta -= d * c.files;
    }
  }
  if (delta !== 0) {
    const c = out[far[0]];
    if (delta > 0) {
      c.ranks += 1;
      c.last = delta;
    } else c.last = c.files + delta;
  }
  return out;
})();

if (COMPANIES.length !== N_COMPANIES) throw new Error(`OverwhelmingNumbers: ${COMPANIES.length} companies, want ${N_COMPANIES}`);
const COUNTED = COMPANIES.reduce((a, c) => a + c.files * (c.ranks - 1) + (c.last ?? c.files), 0);
if (COUNTED !== N_ALLIES) throw new Error(`OverwhelmingNumbers: ${COUNTED} allies, want ${N_ALLIES}`);

// ---------------------------------------------------------------------------
// THE MARCH: constant speed toward the top. The camera travels with the army,
// so the ground slides down the frame under it.
// ---------------------------------------------------------------------------
/** world units per frame */
export const MARCH_V = 0.42;
/** frames per step (two steps = one cycle) */
export const STEP = 7;
/** a rank's tiny fore-and-aft give as it steps (world units); alternate ranks are half a cycle apart */
export const stepShift = (f: number, rank: number, seed: number) => 0.035 * Math.sin((Math.PI * f) / STEP + Math.PI * rank + seed * 1.7);

// ---------------------------------------------------------------------------
// THE CAMERA: one log-space pull-back off the orange company
// ---------------------------------------------------------------------------
/** tight: the orange company (10 units wide with its dots) is 60 % of the frame width */
export const K_TIGHT = 648 / 10;
/** wide: the orange company ~95 px wide as the pull-back lands */
export const K_WIDE = 9.5;
const [WX, WY] = SP_CENTRE;
/** the pull-back's window: it began before the cut (so the camera is already moving on f0), its speed peaks
 *  around f20-26 (the host arrives on "support ... allies") and it lands long and soft on f60 */
const PULL: [number, number] = [-6, 60];
const SKEW = 1.15;
/** the hold's creep, in ln k per frame (it runs under the whole cut, so the camera is never at rest) */
const CREEP = 0.0014;
const pullRaw = (f: number) => {
  const u = clamp01((f - PULL[0]) / (PULL[1] - PULL[0]));
  return smootherstep(1 - Math.pow(1 - u, SKEW));
};
const E0 = pullRaw(0);
/** 0 on f0 -> 1 on f60 */
export const pull = (f: number) => (pullRaw(f) - E0) / (1 - E0);
export const camAt = (f: number): Cam => {
  const e = pull(f);
  const k = Math.exp(Math.log(K_TIGHT) + (Math.log(K_WIDE) + CREEP * PULL[1] - Math.log(K_TIGHT)) * e - CREEP * f);
  // the orange company's centre: (540, 900) tight -> (540, 890) wide
  const sy = 900 - 10 * e;
  return { k, cx: WX, cy: WY - (sy - 960) / k };
};
/** the ground under the camera on frame f: the page slides down the frame as the army marches up it */
export const groundCam = (cam: Cam, f: number): Cam => ({ k: cam.k, cx: cam.cx + 3.3, cy: cam.cy - MARCH_V * f - 41.7 });

/** dot radius, world units (solid dots, ~70 % of the spacing) */
export const DOT_R = 0.36;
