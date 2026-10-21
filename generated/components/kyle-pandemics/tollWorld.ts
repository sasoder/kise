// ---------------------------------------------------------------------------
// tollWorld: the world and the camera of TuberculosisToll (kyle-pandemics, cut 13), kept free of React so the checks
// can run it in bun. Units are londonCastV2's (a man ~310 from soles to skull). X across, Y height (the floor is Y = 0,
// up is - Y), Z depth away from the camera; the TB block's front rank stands at Z = 0.
// ---------------------------------------------------------------------------
/** incaShared's hash (copied: incaShared loads fonts at module scope, and the checks run this file in bun) */
export const hash = (i: number, k: number) => {
  const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return s - Math.floor(s);
};
/** incaShared's monotone cubic (copied, as above) */
export const DURATION = 186;

// ---------------------------------------------------------------------------
// THE GROUPS: one figure = one million deaths; the same file and rank spacing for every group, so the counts compare
// honestly. Every other rank is stepped half a file (each man shows between two in front).
// ---------------------------------------------------------------------------
export const DX = 130;
export const DZ = 150;
/** TB: 25 files x 40 ranks = 1,000, running back toward the horizon */
export const TB_W = 25;
export const TB_D = 40;
/** the hero: the front-rank man the cut opens on (the block's middle file: the reveal stays centred on the block) */
export const HERO_FILE = 12;
const tbX = (i: number, j: number) => (i - (TB_W - 1) / 2) * DX + (j % 2 ? DX / 2 : 0);
export const HERO_X = tbX(HERO_FILE, 0);
/** the block's middle, world X (its label sits there) */
export const TB_MID_X = (tbX(0, 0) + tbX(TB_W - 1, 1)) / 2;

export type Group = { name: string; count: string; rows: number[]; cx: number };
/** ONE FRONT LINE: the cream groups stand on the TB block's front line (Z = 0), to its left, side by side, at the same
 *  spacing, in rows of seven running back (a short row last, at the back); rows listed from the front rank back. So
 *  all four groups draw at one scale and the only difference is how far each runs back. Left to right: COVID-19,
 *  HIV/AIDS, the 1918 flu, then TB. */
const GAP = 2 * DX; // the clear floor between neighbouring groups (room for each label)
const half = (n: number) => ((n - 1) / 2) * DX + DX / 2;
const TB_LEFT = tbX(0, 0) - DX / 2;
const FLU_CX = TB_LEFT - GAP - half(7);
const AIDS_CX = FLU_CX - 2 * half(7) - GAP;
const COVID_CX = AIDS_CX - 2 * half(7) - GAP;
export const GROUPS: Group[] = [
  { name: "COVID-19", count: "7 million", rows: [7], cx: COVID_CX },
  { name: "HIV/AIDS", count: "44 million", rows: [7, 7, 7, 7, 7, 7, 2], cx: AIDS_CX },
  { name: "1918 FLU", count: "50 million", rows: [7, 7, 7, 7, 7, 7, 7, 1], cx: FLU_CX },
];
/** every group's front rank stands on the one front line */
export const groupFrontZ = (_g: Group) => 0;
/** the whole front line, world X (for framing) */
export const LINE_X0 = COVID_CX - half(7);
export const LINE_X1 = tbX(TB_W - 1, 1) + DX / 2;

/** the cast: the plainest build for everyone (londonCastV2's Newton look: his own hair, a plain coat, the white band),
 *  a few with a hat under the arm, a few bare-headed workers; the hair recoloured per man; three head turns */
export const KINDS = 3; // 0 plain, 1 hat under the arm, 2 worker (bare-headed)
export const HAIRS = 6;
export const YAWS = [0, 0.24, -0.24];
export type Man = { X: number; Z: number; kind: number; hair: number; yaw: number; orange: boolean; ph: number; group: number };
export const MEN: Man[] = (() => {
  const out: Man[] = [];
  let seed = 0;
  const pick = (orange: boolean, X: number, Z: number, group: number) => {
    const s = seed++;
    const r = hash(s, 301);
    // (no bare-headed workers in the TB block: their orange is only a waistcoat sliver, so they read as cream men in it)
    const kind = r < 0.07 && !orange ? 2 : r < 0.19 ? 1 : 0;
    const hair = kind === 2 ? 0 : Math.floor(hash(s, 306) * HAIRS);
    const yaw = Math.floor(hash(s, 302) * YAWS.length);
    out.push({ X: X + (hash(s, 303) - 0.5) * 12, Z: Z + (hash(s, 304) - 0.5) * 14, kind, hair, yaw, orange, ph: 6.283 * hash(s, 305), group });
  };
  for (let j = 0; j < TB_D; j++) for (let i = 0; i < TB_W; i++) pick(true, tbX(i, j), j * DZ, -1);
  GROUPS.forEach((g, gi) => {
    g.rows.forEach((n, r) => {
      const Z = r * DZ;
      const step = r % 2 ? DX / 2 : 0;
      for (let i = 0; i < n; i++) pick(false, g.cx + (i - (n - 1) / 2) * DX + step, Z, gi);
    });
  });
  // the hero: exact, facing us, the plain build
  const hero = out.find((m) => m.orange && Math.abs(m.Z) < 20 && Math.abs(m.X - HERO_X) < 30);
  if (hero) {
    hero.X = HERO_X;
    hero.Z = 0;
    hero.kind = 0;
    hero.hair = 1;
    hero.yaw = 0;
  }
  // painter's order: far to near
  out.sort((a, b) => b.Z - a.Z || Math.abs(b.X - HERO_X) - Math.abs(a.X - HERO_X));
  return out;
})();
export const COUNTS = { tb: MEN.filter((m) => m.orange).length, cream: GROUPS.map((_, gi) => MEN.filter((m) => m.group === gi).length) };

// ---------------------------------------------------------------------------
// THE CAMERA: one pinhole, no pitch (verticals stay vertical, one VP on the horizon), focal F px, standing at
// (cx, -h, cz); the horizon sits at screen y = hy (a lens shift, as a 2D camera's cy). ONE crane move: every channel
// runs on its own bell-shaped speed profile (one acceleration lobe, one deceleration lobe, no keys to stall on):
//   log d0  (d0 = -cz, the distance to the front rank): already moving at f0, fastest mid-reveal, settled ~f150
//   h       the eye's height, climbing from the hero's brow to ~17 men up (the view ends ~38 deg down)
//   ty      where the front rank's feet sit on screen (the horizon hy = ty - h F / d0)
//   cx      held on the block's middle through the reveal, then the slide left from f84 (the cream groups come in
//           from the left after "than")
// and a slow creep (dolly back, drift left) that fades in from f118 and runs to the cut, so the hold stays alive.
// ---------------------------------------------------------------------------
export const F = 1100;
/** a bell-shaped progress 0..1 over f0..f1: the integral of t^a (1-t)^b, normalised */
const bell = (f0: number, f1: number, a: number, b: number) => {
  const N = 400;
  const cum = new Float64Array(N + 1);
  for (let i = 1; i <= N; i++) {
    const t = (i - 0.5) / N;
    cum[i] = cum[i - 1] + Math.pow(t, a) * Math.pow(1 - t, b);
  }
  const tot = cum[N];
  return (f: number) => {
    const t = Math.max(0, Math.min(1, (f - f0) / (f1 - f0))) * N;
    const i = Math.min(N - 1, Math.floor(t));
    return (cum[i] + (cum[i + 1] - cum[i]) * (t - i)) / tot;
  };
};
/** the end: the front line centred, its feet at y ~880, the eye ~38 deg down (h / d0 = 0.78), the horizon at the top */
const D_END = (F * (LINE_X1 - LINE_X0)) / 1040;
export const CAM = {
  d0: [(F * 310) / 900, D_END],
  h: [300, 0.78 * D_END],
  ty: [1392, 880],
  cx: [HERO_X, (LINE_X0 + LINE_X1) / 2],
  pD: bell(-12, 150, 2.4, 1.8),
  pH: bell(-10, 146, 1.5, 2.2),
  pT: bell(6, 148, 1.9, 1.9),
  pX: bell(84, 150, 1.7, 2.0),
};
const creep = (f: number) => {
  const u = Math.max(0, Math.min(1, (f - 118) / 50));
  return u < 1 ? u * u * u * (1 - u / 2) * (50 / 185) : (0.5 * 50) / 185 + (f - 168) / 185;
};
const mixv = (a: number, b: number, t: number) => a + (b - a) * t;
export type Cam3 = { cx: number; h: number; cz: number; hy: number };
export const cam3At = (f: number): Cam3 => {
  const cr = creep(f);
  const d0 = Math.exp(mixv(Math.log(CAM.d0[0]), Math.log(CAM.d0[1]), CAM.pD(f))) * (1 + 0.1 * cr);
  // the eye rides a straight line back and up: h / d0 ~0.8 throughout (from his brow at f0 to ~17 men up)
  const h = d0 * mixv(CAM.h[0] / CAM.d0[0], CAM.h[1] / CAM.d0[1], CAM.pH(f));
  const ty = mixv(CAM.ty[0], CAM.ty[1], CAM.pT(f)) - 10 * cr;
  return { cx: mixv(CAM.cx[0], CAM.cx[1], CAM.pX(f)) - 40 * cr, h, cz: -d0, hy: ty - (h * F) / d0 };
};
/** a world point on screen: x, y and px per unit (null behind the camera) */
export const project = (c: Cam3, X: number, Y: number, Z: number) => {
  const d = Z - c.cz;
  if (d < 20) return null;
  const s = F / d;
  return { x: 540 + (X - c.cx) * s, y: c.hy + (Y + c.h) * s, s };
};
/** the sprite's box round a man, units (feet at 0, 0) */
export const BOX = { x0: -118, x1: 118, y0: -372, y1: 22 };
/** is any of a man in frame */
export const inFrame = (c: Cam3, m: Man) => {
  const p = project(c, m.X, 0, m.Z);
  if (!p) return null;
  if (p.x + BOX.x1 * p.s < 0 || p.x + BOX.x0 * p.s > 1080 || p.y + BOX.y0 * p.s > 1920 || p.y + BOX.y1 * p.s < 0) return null;
  return p;
};
/** the camera of the settled end frame (labels are sized for it) */
export const END_CAM = cam3At(DURATION - 1);
