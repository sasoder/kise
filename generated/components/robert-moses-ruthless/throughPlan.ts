// ---------------------------------------------------------------------------
// throughPlan — the world, the camera and the people of ThroughTheNeighborhood (robert-moses-ruthless), pure data so
// the cut and the collision check share one source. Units here are METRES (the cut multiplies by U for the kit).
// X east (screen right), Z north (away from the camera), heights up +. The camera looks NORTH from high over Crotona
// Park, so "south" is toward the camera and down the screen.
//
// THE GRID (a picture-book East Tremont: 5-6 storey walk-ups packed along east-west rows, side streets every 78 m):
//   park (lawn and trees) Z < -3 · the park-edge street -3..7 with the dashed alternative at Z 2 and three small
//   houses straddling it · B1 7..19 · street · B2 28..40 · the wide front street 40..54 · B3 54..66 (the route: the
//   solid line on its roofs, then pressed flat into a gash of rubble lots) · the north street 66..75 · B4 75..87 · and
//   on into the haze.
// Figures are drawn at a picture-book scale (FIG m tall against 2.85 m storeys) so they read at phone size.
// ---------------------------------------------------------------------------
import { random } from "remotion";

export const FPS = 24000 / 1001;
export const DURATION = 242;

/** kit units per metre */
export const U = 10;
/** a figure's height (m), picture-book scale */
export const FIG = 3.8;
export const STOREY = 2.85;
export const PARAPET = 0.6;

// ---- the camera (see the cut's header: DEPTH) -----------------------------------------------------------------------
/** eye height (m) and the settled frame's camera distance from the front plane Z 0 (m) and focal (px) */
export const HC = 304;
export const DC_S = 230;
export const F_S = 2171;
export const K_S = F_S / (DC_S * U);
export const DOLLY = 0.3;
export const dcOf = (k: number) => DC_S * U * Math.pow(K_S / k, DOLLY); // units
/** the 2D world y of a ground point at depth Z (m) under zoom k */
export const groundWy = (k: number, Zm: number) => {
  const dc = dcOf(k);
  const eyeY = -HC * U;
  return eyeY + (0 - eyeY) * (dc / (dc + Zm * U));
};

// ---- the rows ---------------------------------------------------------------------------------------------------
export type Row = { id: number; z0: number; z1: number; storeys: [number, number]; route?: boolean };
export const ROW_DEPTH = 12;
export const ROWS: Row[] = (() => {
  const out: Row[] = [];
  let z = 7;
  for (let id = 1; z < 230; id++) {
    const st: [number, number] = id === 1 ? [4, 4] : id === 2 ? [3, 3] : id === 3 ? [6, 6] : [5, 6];
    out.push({ id, z0: z, z1: z + ROW_DEPTH, storeys: st, route: id === 3 });
    z += ROW_DEPTH + (id === 2 ? 14 : 9);
  }
  return out;
})();
export const B3 = ROWS[2];
/** the route (the solid line) runs along B3's middle */
export const ROUTE_Z = (B3.z0 + B3.z1) / 2;
/** B3's roofs, and the rubble lots it is pressed down to (m) */
export const ROOF_H = 6 * STOREY + PARAPET;
export const LOT_H = 0.3;
/** the alternative (the dashed line), along the park-edge street */
export const ALT_Z = 2;
export const PARK_EDGE = -3;
/** side streets every BLOCK_P m (centres), STREET_W wide */
export const BLOCK_P = 60;
export const STREET_W = 11;

// ---- the buildings ------------------------------------------------------------------------------------------------
export type Bldg = {
  key: string;
  row: number;
  X0: number;
  X1: number;
  Z0: number;
  Z1: number;
  storeys: number;
  h: number;
  mat: number;
  seed: number;
  /** the front doors' centres (m), one every ~5 m */
  doors: number[];
  /** a B3 corner house's doors on its side face onto the side street: the face's X and the doors' centre Zs */
  side?: { xs: number; dir: 1 | -1; zs: number[] };
  /** a small house on the park-edge street */
  small?: boolean;
};
/** the half width (m) the widest frame shows at depth Z, plus a margin */
const halfWidthAt = (Zm: number) => (540 * (DC_S + Zm)) / F_S + 30;

/** front doors every ~5 m along a house (jittered), kept 2.4 m off its ends */
const doorsOf = (x0: number, x1: number, seed: number) => {
  const wid = x1 - x0;
  const n = Math.max(1, Math.round(wid / 5));
  return Array.from({ length: n }, (_, i) => {
    const c = x0 + (wid * (i + 0.5)) / n + (random(`dj${seed}_${i}`) - 0.5) * 1.6;
    return Math.max(x0 + 2.4, Math.min(x1 - 2.4, c));
  });
};
/** a corner house's side doors (centres, m back from its rear face): two for the stream south, two for the north */
const SIDE_ZS = [10.2, 7.4, 4.6, 1.8];

export const BLDGS: Bldg[] = (() => {
  const out: Bldg[] = [];
  for (const r of ROWS) {
    const hw = halfWidthAt(r.z1);
    const nMax = Math.ceil(hw / BLOCK_P) + 1;
    for (let n = -nMax; n < nMax; n++) {
      const bx0 = n * BLOCK_P + STREET_W / 2;
      const bx1 = (n + 1) * BLOCK_P - STREET_W / 2;
      if (bx1 < -hw || bx0 > hw) continue;
      // three (sometimes four) houses packed along the block, widths jittered
      const cnt = random(`cnt${r.id}_${n}`) < 0.35 ? 3 : 2;
      const ws = Array.from({ length: cnt }, (_, i) => 0.8 + 0.4 * random(`w${r.id}_${n}_${i}`));
      const sum = ws.reduce((a, b) => a + b, 0);
      let x = bx0;
      ws.forEach((w, i) => {
        const wid = ((bx1 - bx0) * w) / sum;
        const seed = r.id * 1000 + (n + 50) * 10 + i;
        const st = r.storeys[0] + Math.floor(random(`st${seed}`) * (r.storeys[1] - r.storeys[0] + 1));
        const matR = random(`m${seed}`);
        const mat = matR < 0.2 ? 3 : matR < 0.45 ? 1 : matR < 0.65 ? 2 : matR < 0.8 ? 4 : 0;
        const x0 = x + (i === 0 ? 0 : 0.15);
        const x1 = x + wid - (i === cnt - 1 ? 0 : 0.15);
        out.push({
          key: `b${r.id}_${n}_${i}`,
          row: r.id,
          X0: x0,
          X1: x1,
          Z0: r.z0 + (random(`zj${seed}`) < 0.25 ? 0.6 : 0),
          Z1: r.z1,
          storeys: st,
          h: st * STOREY + PARAPET,
          mat,
          seed,
          doors: doorsOf(x0, x1, seed),
          side:
            r.id === 3 && i === 0
              ? { xs: x0, dir: -1, zs: SIDE_ZS.map((d) => r.z1 - d) }
              : r.id === 3 && i === cnt - 1
                ? { xs: x1, dir: 1, zs: SIDE_ZS.map((d) => r.z1 - d) }
                : undefined,
        });
        x += wid;
      });
    }
  }
  // the few small low buildings standing in the alternative's way, on the park-edge street (doors on their side faces,
  // the face turned to the middle of the frame)
  const SMALL: [number, number, number, number][] = [
    [-47, -37, 2, 3],
    [-19, -9.5, 2, 1],
    [21, 31, 2, 2],
  ];
  SMALL.forEach(([x0, x1, st, mat], i) =>
    out.push({ key: `s${i}`, row: 0, X0: x0, X1: x1, Z0: -2, Z1: 5, storeys: st, h: st * 3.1 + 0.5, mat, seed: 9000 + i, doors: [], small: true }),
  );
  return out;
})();
export const SMALLS = BLDGS.filter((b) => b.small);


// ---- the timeline (frames) ----------------------------------------------------------------------------------------
export const T = {
  /** the solid line's moving tip (left -> right across the frame) */
  lineA: 2,
  lineB: 40,
  /** every door of the route row pours (doors start staggered over the first frames) */
  pourA: 62,
  pourB: 104,
  /** B3's lit windows go out one by one as the people leave; its walls drain toward DEAD */
  winA: 66,
  winB: 100,
  drainA: 90,
  drainB: 110,
  /** the ribbon presses the emptied row flat: rubble lots and broken wall stubs, a gash across the whole width */
  crushA: 96,
  crushB: 124,
  /** the dashed alternative's tip */
  dashA: 128,
  dashB: 166,
  /** the few step out of the small houses */
  fewA: 194,
};
const ease = (u: number) => {
  const v = Math.max(0, Math.min(1, u));
  return v * v * (3 - 2 * v);
};
/** the solid line's tip X (m) by frame */
export const LINE_X0 = -260;
export const lineTipX = (f: number) => {
  const u = Math.max(0, Math.min(1, (f - T.lineA) / (T.lineB - T.lineA)));
  // constant speed across the frame; it starts off the left edge and runs on past the right edge
  return -62 + u * 124 + Math.max(0, f - T.lineB) * (124 / (T.lineB - T.lineA));
};
export const dashTipX = (f: number) => {
  const u = Math.max(0, Math.min(1, (f - T.dashA) / (T.dashB - T.dashA)));
  return -50 + u * 112 + Math.max(0, f - T.dashB) * (112 / (T.dashB - T.dashA));
};
/** the press: 0 .. 1 */
export const crushAt = (f: number) => ease((f - T.crushA) / (T.crushB - T.crushA));
/** B3's top now (m): the roofs, pressed down to the lots */
export const rowTopAt = (f: number) => ROOF_H - (ROOF_H - LOT_H) * crushAt(f);
/** the ribbon lies on the roofs and rides them down onto the gash */
export const lineHeightAt = (f: number) => rowTopAt(f) + 0.15;

/** a B3 house's broken wall stubs left standing in its lot (m): boxes along its four walls, some gaps */
export type Stub = { X0: number; X1: number; Z0: number; Z1: number; h: number };
export const stubsOf = (b: Bldg): Stub[] => {
  const out: Stub[] = [];
  const TH = 0.6;
  const run = (a: number, z: number, along: "x" | "z", from: number, to: number) => {
    let x = from;
    let i = 0;
    while (x < to - 0.4) {
      const len = Math.min(to - x, 0.9 + random(`sl${b.seed}${a}${i}`) * 2.4);
      if (random(`sp${b.seed}${a}${i}`) < 0.78) {
        // the front and back walls keep more of a storey; the party walls are lower
        // the front wall keeps most of a storey in places, the back less; the party walls break off lower toward the back
        const tall = a === 1 ? 3.4 : a === 2 ? 2.4 : 3.0 * (1 - (x - from) / Math.max(1, to - from)) + 0.6;
        const h = 0.6 + Math.pow(random(`sh${b.seed}${a}${i}`), 1.2) * tall;
        if (along === "x") out.push({ X0: x, X1: x + len, Z0: z, Z1: z + TH, h });
        else out.push({ X0: z, X1: z + TH, Z0: x, Z1: x + len, h });
      }
      x += len;
      i++;
    }
  };
  run(1, b.Z0, "x", b.X0, b.X1);
  run(2, b.Z1 - TH, "x", b.X0, b.X1);
  run(3, b.X0, "z", b.Z0 + TH, b.Z1 - TH);
  run(4, b.X1 - TH, "z", b.Z0 + TH, b.Z1 - TH);
  return out;
};

// ---- the camera -------------------------------------------------------------------------------------------------
/** keys: zoom k, the ground point (X, Z) (m) held at screen y sy (x centred). ONE lobe in on the route row (the drift
 *  while the line draws runs straight into it), the pull back and pan down to the park, a hold on the two-shot as the
 *  dashed line lands, and a gentle push in toward the park edge. Monotone between keys (zero slope at the turns). */
const CAM_KEYS = [
  { f: 0, k: 1.2, X: 0, Z: B3.z0, sy: 985 },
  { f: 40, k: 1.3, X: 0, Z: B3.z0, sy: 965 },
  { f: 104, k: 2.0, X: 0, Z: B3.z0, sy: 880 },
  { f: 174, k: K_S * 1.04, X: 0, Z: ALT_Z, sy: 1292 },
  { f: 188, k: K_S * 1.065, X: -0.6, Z: ALT_Z, sy: 1296 },
  { f: DURATION - 1, k: 1.6, X: -7, Z: 1, sy: 1328 },
];
const hermite = (xs: number[], ys: number[], ms: number[]) => (x: number) => {
  const n = xs.length;
  if (x <= xs[0]) return ys[0] + ms[0] * (x - xs[0]);
  if (x >= xs[n - 1]) return ys[n - 1] + ms[n - 1] * (x - xs[n - 1]);
  let i = 0;
  while (x > xs[i + 1]) i++;
  const h = xs[i + 1] - xs[i];
  const t = (x - xs[i]) / h;
  const t2 = t * t;
  const t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * ms[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * ms[i + 1];
};
const channel = (ys: number[]) => {
  const xs = CAM_KEYS.map((q) => q.f);
  const d = xs.slice(0, -1).map((_, i) => (ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  // f0: the drift's own slope; f40: the harmonic (monotone) blend into the lobe; the turns: zero; f188: the slow creep
  // of the hold f174-188 carried into the push; the end: still easing in, a third of its average speed
  const hm = (a: number, b: number) => (a * b <= 0 ? 0 : (2 * a * b) / (a + b));
  return hermite(xs, ys, [d[0], hm(d[0], d[1]), 0, 0, Math.min(d[3], d[4]) * (d[3] * d[4] > 0 ? 1 : 0), d[4] * 0.33]);
};
const LK = channel(CAM_KEYS.map((q) => Math.log(q.k)));
const CX = channel(CAM_KEYS.map((q) => q.X * U));
const CY = channel(CAM_KEYS.map((q) => groundWy(q.k, q.Z) - (q.sy - 960) / q.k));
export type CamS = { k: number; cx: number; cy: number };
export const camAt = (f: number): CamS => ({ k: Math.exp(LK(f)), cx: CX(f), cy: CY(f) });

// ---- the people ---------------------------------------------------------------------------------------------------
export type CrowdKindT = "man" | "woman" | "boy" | "girl" | "oldMan" | "oldWoman";
export type Way = { pts: [number, number][]; t0: number; v: number };
export type Walker = {
  id: string;
  ink: number;
  way: Way;
  /** the door the walker comes out of: front (a B3 house, clipped to that door until past its face) or side (a corner
   *  house's side face, or a small house) */
  door?: { b: string; face: "front" | "sideR" | "sideL"; x: number; z: number };
  /** the yaw to turn to at the end of the path */
  endYaw?: number;
  /** the park-edge few (idle at the end) */
  few?: boolean;
  /** a far, standing member of the crowd: a front-facing crowd drawing (not the rig); visible from way.t0 */
  crowd?: { kind: CrowdKindT; seed: number };
};
/** walking speeds, m per frame: the evicted hurry; the few step out */
export const V = 0.17;
export const V_EVAC = 0.22;
/** the gap between two out of the same door column (frames): a fan's 5 x 0.22 = 1.1 m (it bends up to 55 deg); a
 *  river's 6.5 (1.4 m: its corners are square) */
const FAN_GAP = 5;
const RIVER_GAP = 6.5;
/** doors with |X| under FAN_X pour rig walkers that fan into the front street; beyond it (out of frame while they pour)
 *  the street is filled with standing crowd drawings */
export const FAN_X = 46;
/** the front street's standing area (Z, m): from the part B2 hides at the closest frame up to B3's pavement */
const FRONT_Z = { z0: 46.8, z1: B3.z0 - 1.2 };
/** the north street's */
const NORTH_Z = { z0: B3.z1 + 1.6, z1: ROWS[3].z0 - 1.4 };
/** the side-street lanes (|X| from the street's centre, m): the inner first */
const LANES = [0.75, 2.1, 3.45, 4.8];

const KINDS: CrowdKindT[] = ["man", "woman", "man", "woman", "oldMan", "oldWoman", "boy", "girl"];
/** a slot grid in a box (staggered rows, a little jitter; neighbours >= ~1.0 m apart) */
const slotsIn = (x0: number, x1: number, z0: number, z1: number, seed: string) => {
  const out: [number, number][] = [];
  let r = 0;
  for (let z = z1; z >= z0 - 1e-6; z -= 1.15, r++) {
    for (let x = x0 + 0.5 + (r % 2) * 0.7; x <= x1 - 0.5 + 1e-6; x += 1.4) {
      out.push([x + (random(`jx${seed}${r}_${x.toFixed(1)}`) - 0.5) * 0.4, z + (random(`jz${seed}${r}_${x.toFixed(1)}`) - 0.5) * 0.22]);
    }
  }
  return out;
};
const pickYaw = (key: string) => {
  const r = random(key);
  return r < 0.55 ? 0 : r < 0.66 ? 30 : r < 0.77 ? -30 : 180;
};

const B3S = BLDGS.filter((b) => b.row === 3);
export const WALKERS: Walker[] = (() => {
  const out: Walker[] = [];
  const statics: [number, number, number, string][] = []; // X, Z, appear frame, id
  // ---- the front: every door of the row
  type Door = { b: Bldg; x: number; n: number };
  const blocks = new Map<number, Door[]>();
  for (const b of B3S) {
    const n = Math.floor((b.X0 + 1) / BLOCK_P);
    const list = blocks.get(n) ?? [];
    b.doors.forEach((x) => list.push({ b, x, n }));
    blocks.set(n, list);
  }
  for (const [n, list] of blocks) {
    list.sort((a, b) => a.x - b.x);
    const bx0 = n * BLOCK_P + STREET_W / 2 + 0.4;
    const bx1 = (n + 1) * BLOCK_P - STREET_W / 2 - 0.4;
    list.forEach((d, i) => {
      const cx0 = i === 0 ? bx0 : (list[i - 1].x + d.x) / 2 + 0.25;
      const cx1 = i === list.length - 1 ? bx1 : (list[i + 1].x + d.x) / 2 - 0.25;
      const slots = slotsIn(cx0, cx1, FRONT_Z.z0, FRONT_Z.z1, `${d.b.key}${d.x.toFixed(1)}`);
      if (Math.abs(d.x) >= FAN_X) {
        slots.forEach(([x, z], j) => {
          if (random(`fs${d.b.key}${i}_${j}`) < 0.5) statics.push([x, z, 92 + Math.floor(random(`fa${d.b.key}${i}_${j}`) * 10), `Q${d.b.key}_${i}_${j}`]);
        });
        return;
      }
      // a rig fan: two door columns; each column's walkers take its side's slots (within 55 deg of straight out, so two
      // in a column stay a step apart round the bend), the farthest first
      const t0 = T.pourA + Math.floor(random(`pt${d.b.key}${i}`) * 8);
      const v = V_EVAC * (0.96 + 0.08 * random(`pv${d.b.key}${i}`));
      const per = Math.floor((T.pourB - t0) / FAN_GAP) + 1;
      ([-1, 1] as const).forEach((side, ci) => {
        const colX = d.x + side * 0.75;
        const start: [number, number] = [colX, d.b.Z0 - 0.9];
        const mine = slots.filter(([x, z]) => (side < 0 ? x < d.x - 0.45 : x > d.x + 0.45) && Math.abs(x - colX) <= Math.tan((55 * Math.PI) / 180) * (start[1] - z));
        // spread the picks: a seeded shuffle, the first `per`, then the farthest first
        const pick = mine
          .map((s, j) => ({ s, r: random(`pk${d.b.key}${i}${ci}_${j}`) }))
          .sort((a, b) => a.r - b.r)
          .slice(0, per)
          .map((q) => q.s)
          .sort((a, b) => Math.hypot(b[0] - start[0], b[1] - start[1]) - Math.hypot(a[0] - start[0], a[1] - start[1]));
        pick.forEach((s, j) => {
          out.push({
            id: `F${d.b.key}_${i}_${ci}_${j}`,
            ink: Math.floor(random(`ik${d.b.key}${i}${ci}${j}`) * 5),
            way: { pts: [[colX, d.b.Z0 + 0.7], start, s], t0: t0 + ci * (FAN_GAP / 2) + j * FAN_GAP, v },
            door: { b: d.b.key, face: "front", x: d.x, z: d.b.Z0 },
            endYaw: pickYaw(`ey${d.b.key}${i}${ci}${j}`),
          });
        });
      });
    });
  }
  // ---- the corner houses' side doors: a river down the middle side street toward us, and one up it, away
  for (const b of B3S) {
    if (!b.side) continue;
    const sc = b.side.xs + b.side.dir * (STREET_W / 2);
    if (Math.abs(sc) > 1) {
      // the other side streets are out of frame while the doors pour: standing crowd drawings there
      for (const [z0, z1] of [
        [30, FRONT_Z.z1],
        [NORTH_Z.z0, 104],
      ] as const) {
        const half = slotsIn(sc - b.side.dir * 0.2 - (b.side.dir > 0 ? 5.4 : 0), sc - b.side.dir * 0.2 + (b.side.dir > 0 ? 0 : 5.4), z0, z1, `ss${b.key}${z0}`);
        half.forEach(([x, z], j) => {
          if (random(`sf${b.key}${z0}_${j}`) < 0.55) statics.push([x, z, 94 + Math.floor(random(`sa${b.key}${z0}_${j}`) * 10), `R${b.key}_${z0}_${j}`]);
        });
      }
      continue;
    }
    const t0 = T.pourA + 2 + Math.floor(random(`rt${b.key}`) * 5);
    const v = V_EVAC;
    const per = Math.floor((T.pourB - t0) / RIVER_GAP) + 1;
    // door columns: [door index, column z offset, lane, heading]; inner lanes leave from the columns nearest the middle
    const cols: [number, number, number, 1 | -1][] = [
      [1, 0.6, 0, -1],
      [1, -0.6, 1, -1],
      [0, 0.6, 2, -1],
      [0, -0.6, 3, -1],
      [2, -0.6, 0, 1],
      [2, 0.6, 1, 1],
      [3, -0.6, 2, 1],
      [3, 0.6, 3, 1],
    ];
    cols.forEach(([di, dz, lane, head], ci) => {
      const zc = b.side!.zs[di] + dz;
      const laneX = sc - b.side!.dir * LANES[lane];
      const xIn = b.side!.xs - b.side!.dir * 0.8;
      for (let j = 0; j < per; j++) {
        out.push({
          id: `${head < 0 ? "S" : "N"}${b.key}_${ci}_${j}`,
          ink: Math.floor(random(`ri${b.key}${ci}${j}`) * 5),
          way: {
            pts: [
              [xIn, zc],
              [laneX, zc],
              [laneX, head < 0 ? 12 : 150],
            ],
            t0: t0 + (ci % 2) * (RIVER_GAP / 2) + j * RIVER_GAP,
            v,
          },
          door: { b: b.key, face: b.side!.dir > 0 ? "sideR" : "sideL", x: b.side!.xs, z: b.side!.zs[di] },
        });
      }
    });
  }
  // ---- the north street: hidden behind the row while it stands, a standing crowd facing the gash
  {
    const xs = slotsIn(-84, 84, NORTH_Z.z0, NORTH_Z.z1, "north");
    xs.forEach(([x, z], j) => {
      const m = ((x % BLOCK_P) + BLOCK_P) % BLOCK_P;
      const off = Math.min(m, BLOCK_P - m);
      if (off < 7.2) return; // the side-street gaps: the rivers' lanes, and seen through the row
      if (random(`nf${j}`) < 0.55) statics.push([x, z, 72 + Math.floor(random(`na${j}`) * 18), `M${j}`]);
    });
  }
  statics.forEach(([x, z, f, id]) => {
    const kind = KINDS[Math.floor(random(`kd${id}`) * KINDS.length)];
    out.push({ id, ink: 0, way: { pts: [[x, z]], t0: f, v: 0 }, crowd: { kind, seed: Math.floor(random(`sd${id}`) * 8) } });
  });
  // ---- the few: out of the small houses' side doors onto the dashed line, a few steps, then they turn to us
  const few: [string, "sideR" | "sideL", number, number, number][] = [
    // house, face, start frame, z lane, steps out (m); the second out of a door stops short of the first
    ["s0", "sideR", T.fewA, 0.75, 3.0],
    ["s1", "sideR", T.fewA + 5, 1.0, 4.4],
    ["s1", "sideR", T.fewA + 14, 1.0, 2.3],
    ["s2", "sideL", T.fewA + 3, 0.8, 3.6],
    ["s2", "sideL", T.fewA + 12, 0.8, 1.7],
  ];
  few.forEach(([key, face, t0, z, out1], i) => {
    const b = SMALLS.find((s) => s.key === key)!;
    const xIn = face === "sideR" ? b.X1 - 0.8 : b.X0 + 0.8;
    const xOut = face === "sideR" ? b.X1 + out1 : b.X0 - out1;
    out.push({
      id: `P${i}`,
      ink: [1, 3, 0, 2, 4][i],
      way: { pts: [[xIn, z], [xOut, z]], t0, v: V * 0.8 },
      door: { b: key, face, x: face === "sideR" ? b.X1 : b.X0, z: 1.1 },
      endYaw: 0,
      few: true,
    });
  });
  return out;
})();

// ---- a walker at a frame ------------------------------------------------------------------------------------------
const norm = (a: number) => {
  let y = (((a + 180) % 360) + 360) % 360 - 180;
  if (y === -180) y = 180;
  return y;
};
/** the yaw of a direction of travel, to the nearest 30 deg: toward us 0, east (screen right) 90, west -90, away 180 */
const yawOf = (dx: number, dz: number) => norm(Math.round((Math.atan2(dx, -dz) * 180) / Math.PI / 30) * 30);
/** the shortest turn from a to b in 30-degree steps, 3 frames a step */
const TURN_STEP_F = 3;
const turnYaw = (a: number, b: number, s: number) => {
  let d = norm(b - a);
  if (d === 180 && a === 0) d = 180;
  const steps = Math.round(Math.abs(d) / 30);
  const k = Math.min(steps, Math.floor(s / TURN_STEP_F));
  return norm(a + Math.sign(d) * 30 * k);
};
export type WalkerState = { X: number; Z: number; yaw: number; moving: boolean; dist: number; visible: boolean; seg: number };
export const walkerAt = (w: Walker, f: number): WalkerState => {
  const { pts, t0, v } = w.way;
  if (f < t0) return { X: pts[0][0], Z: pts[0][1], yaw: 0, moving: false, dist: 0, visible: false, seg: 0 };
  if (pts.length === 1) return { X: pts[0][0], Z: pts[0][1], yaw: 0, moving: false, dist: 0, visible: true, seg: 0 };
  const segs = pts.slice(1).map((p, i) => {
    const a = pts[i];
    return { a, b: p, len: Math.hypot(p[0] - a[0], p[1] - a[1]), yaw: yawOf(p[0] - a[0], p[1] - a[1]) };
  });
  // the turn at a corner happens on the first steps of the new leg (no stop)
  let t = f - t0;
  let dist = 0;
  for (let i = 0; i < segs.length; i++) {
    const s = segs[i];
    const tl = s.len / v;
    if (t < tl) {
      const u = t / tl;
      const yaw = i > 0 ? turnYaw(segs[i - 1].yaw, s.yaw, t) : s.yaw;
      return { X: s.a[0] + (s.b[0] - s.a[0]) * u, Z: s.a[1] + (s.b[1] - s.a[1]) * u, yaw, moving: true, dist: dist + t * v, visible: true, seg: i };
    }
    t -= tl;
    dist += s.len;
  }
  const last = segs[segs.length - 1];
  const yaw = w.endYaw === undefined ? last.yaw : turnYaw(last.yaw, w.endYaw, t);
  return { X: last.b[0], Z: last.b[1], yaw, moving: false, dist, visible: true, seg: segs.length };
};
