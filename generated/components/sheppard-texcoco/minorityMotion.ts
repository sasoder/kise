// MinorityInOwnCountry: where every dot is on every frame. Pure maths (no
// React), so scripts can count and check it. World px (oceaniaMapData: world ==
// screen at camera k 1).
//
// ORANGE dots (the original peoples) stand on their slots for the whole cut.
// CREAM dots (the newcomers) each have: a port, a place in that port's column
// at sea, a landing frame, and a slot inland. A dot rides its sea route in a
// slim column (a single file at its head, up to three abreast behind), lands
// at the port and slips inland to its slot. Slots fill outward from each port
// (nearest first) as a front; a few stragglers land during the hold.
// THE CAMERA lives here too (one travelling move, Australia -> the Tasman), so
// the check script can measure what is in frame and how fast it moves on screen.
import {
  AUS_CREAM,
  AUS_ORANGE,
  NZ_CREAM,
  NZ_CREAM_NORTH,
  NZ_ORANGE,
  PORTS,
  type Pt,
} from "./oceaniaMapData";

export const DURATION = 106;

// ---- small maths ---------------------------------------------------------------
export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const smoothstep = (v: number) => {
  const t = clamp01(v);
  return t * t * (3 - 2 * t);
};
export const hash = (i: number, k: number) => {
  const s = Math.sin(i * 127.1 + k * 311.7 + 17.3) * 43758.5453;
  return s - Math.floor(s);
};

// ---- sea routes ------------------------------------------------------------------
type Route = { pts: Pt[]; cum: number[]; len: number };
/** a Catmull-Rom through the waypoints, sampled every ~4 px, with arclength */
const routeOf = (way: Pt[]): Route => {
  const ext: Pt[] = [
    [2 * way[0][0] - way[1][0], 2 * way[0][1] - way[1][1]],
    ...way,
    [
      2 * way[way.length - 1][0] - way[way.length - 2][0],
      2 * way[way.length - 1][1] - way[way.length - 2][1],
    ],
  ];
  const pts: Pt[] = [way[0]];
  for (let i = 1; i < ext.length - 2; i++) {
    const [p0, p1, p2, p3] = [ext[i - 1], ext[i], ext[i + 1], ext[i + 2]];
    const n = Math.max(
      2,
      Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / 4),
    );
    for (let s = 1; s <= n; s++) {
      const t = s / n;
      const c = (a: number, b: number, cc: number, d: number) =>
        0.5 *
        (2 * b +
          (-a + cc) * t +
          (2 * a - 5 * b + 4 * cc - d) * t * t +
          (-a + 3 * b - 3 * cc + d) * t * t * t);
      pts.push([c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  const cum = [0];
  for (let i = 1; i < pts.length; i++)
    cum.push(
      cum[i - 1] +
        Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]),
    );
  return { pts, cum, len: cum[cum.length - 1] };
};
/** the point at arclength s, pushed `lat` px to the left of travel */
const routeAt = (r: Route, s: number, lat: number, out: number[]) => {
  const t = Math.max(0, Math.min(r.len, s));
  let lo = 0;
  let hi = r.cum.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (r.cum[mid] <= t) lo = mid;
    else hi = mid;
  }
  const seg = r.cum[hi] - r.cum[lo] || 1;
  const u = (t - r.cum[lo]) / seg;
  // a smoothed tangent (over ~24 px) so the column does not kink
  const a = r.pts[Math.max(0, lo - 3)];
  const b = r.pts[Math.min(r.pts.length - 1, hi + 3)];
  const tl = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const nx = (b[1] - a[1]) / tl;
  const ny = -(b[0] - a[0]) / tl;
  // beyond the start (s < 0) the route runs on straight
  const over = Math.min(0, s);
  const p0 = r.pts[0];
  const p1 = r.pts[1];
  const d0 = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) || 1;
  out[0] =
    r.pts[lo][0] +
    (r.pts[hi][0] - r.pts[lo][0]) * u +
    nx * lat +
    ((p1[0] - p0[0]) / d0) * over;
  out[1] =
    r.pts[lo][1] +
    (r.pts[hi][1] - r.pts[lo][1]) * u +
    ny * lat +
    ((p1[1] - p0[1]) / d0) * over;
};

// ---- the camera ------------------------------------------------------------------
export const FRAME_W = 1080;
export const FRAME_H = 1920;
export type Cam = { k: number; cx: number; cy: number };
/** frame 0: Australia alone, filling the frame's width (the continent ~980 px wide) */
const CAM_A: Cam = { k: 1.47, cx: 359, cy: 683 };
/** the end: the packed south-east on the left, New Zealand whole on the right */
const CAM_B: Cam = { k: 1.6, cx: 745.5, cy: 906 };
const K_CREEP = 1.02;
/** progress of the travel: a steady glide (already moving on frame 0), a little quicker as New Zealand comes in
 *  on its name (f44-f52), run out to rest by f78. Monotone cubic through these keys [frame, share]. */
const TRAVEL_KEYS: [number, number][] = [
  [-12, -0.2],
  [0, 0],
  [34, 0.57],
  [50, 0.84],
  [62, 0.96],
  [78, 1],
  [120, 1],
];
const TRAVEL = (() => {
  const K = TRAVEL_KEYS;
  const n = K.length;
  const h: number[] = [];
  const dl: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    h.push(K[i + 1][0] - K[i][0]);
    dl.push((K[i + 1][1] - K[i][1]) / h[i]);
  }
  const m: number[] = [dl[0]];
  for (let i = 1; i < n - 1; i++) m.push(dl[i - 1] * dl[i] <= 0 ? 0 : (3 * (h[i - 1] + h[i])) / ((2 * h[i] + h[i - 1]) / dl[i - 1] + (h[i] + 2 * h[i - 1]) / dl[i]));
  m.push(0);
  const at = (f: number) => {
    let i = 0;
    while (i < n - 2 && f > K[i + 1][0]) i++;
    const t = (f - K[i][0]) / h[i];
    const t2 = t * t;
    const t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * K[i][1] + (t3 - 2 * t2 + t) * h[i] * m[i] + (-2 * t3 + 3 * t2) * K[i + 1][1] + (t3 - t2) * h[i] * m[i + 1];
  };
  const out: number[] = [];
  for (let f = 0; f <= DURATION + 2; f++) out.push(at(f));
  return out;
})();
export const cameraAt = (f: number): Cam => {
  const i = Math.max(0, Math.min(TRAVEL.length - 2, Math.floor(f)));
  const s = TRAVEL[i] + (TRAVEL[i + 1] - TRAVEL[i]) * (f - i);
  // the creep: eases in under the end of the travel, still moving on the last frame
  const c = clamp01((f - 66) / (DURATION - 1 - 66));
  const creep = c * c * (1.6 - 0.6 * c);
  return {
    k: CAM_A.k * Math.pow(CAM_B.k / CAM_A.k, s) * Math.pow(K_CREEP, creep),
    cx: CAM_A.cx + (CAM_B.cx - CAM_A.cx) * s + 1.4 * Math.sin(f / 23),
    cy: CAM_A.cy + (CAM_B.cy - CAM_A.cy) * s + 2 * Math.sin(f / 19),
  };
};
export const toScreen = (p: number[], cam: Cam): [number, number] => [FRAME_W / 2 + (p[0] - cam.cx) * cam.k, FRAME_H / 2 + (p[1] - cam.cy) * cam.k];

// ---- the ports -------------------------------------------------------------------
type PortKey = keyof typeof PORTS;
type PortDef = {
  key: PortKey;
  country: "aus" | "nz";
  /** sea route waypoints to the port (the port is appended); it runs on straight before its first point */
  way: Pt[];
  /** world px per frame at sea, and over the last SHORE px before the port (where a column turns across the camera's travel) */
  v: number;
  vShore?: number;
  /** the frame its first dot lands */
  first: number;
  /** abreast behind the head */
  lanes: number;
  /** its share of Australia's cream dots (Hobart takes Tasmania; New Zealand: one port per island) */
  share: number;
  /** how late the landings bunch: 1 = steady, more = a trickle then a flood */
  pow: number;
  /** dots that land during the hold, as one short file from this frame */
  late: number;
  lateAt: number;
};
/** the last regular dot stands by here; stragglers land after */
const FILL_END = 82;
// Sea routes (world px). Sydney and Brisbane down the Coral Sea side, Perth,
// Adelaide and Melbourne from the west along the Bight (the clipper route),
// Hobart from the Southern Ocean; New Zealand in two columns, from the north
// into Auckland (the North Island) and from the east into Christchurch (the
// South Island). Wellington and Dunedin have no column of their own.
const PORT_DEFS: PortDef[] = [
  { key: "sydney", country: "aus", way: [[862, 250], [852, 520], [782, 700], [712, 772]], v: 9.5, first: 12, lanes: 3, share: 0.28, pow: 1, late: 4, lateAt: 89 },
  { key: "brisbane", country: "aus", way: [[802, 250], [794, 500], [746, 640]], v: 9.5, first: 15, lanes: 3, share: 0.23, pow: 1, late: 3, lateAt: 95 },
  { key: "perth", country: "aus", way: [[-200, 872], [10, 864]], v: 13, first: 13, lanes: 2, share: 0.2, pow: 1.2, late: 0, lateAt: 0 },
  { key: "adelaide", country: "aus", way: [[-260, 924], [120, 921], [330, 908], [440, 890]], v: 15, vShore: 10, first: 39, lanes: 3, share: 0.14, pow: 1.3, late: 0, lateAt: 0 },
  { key: "melbourne", country: "aus", way: [[-260, 978], [120, 976], [330, 972], [470, 962], [538, 930]], v: 15, vShore: 10, first: 45, lanes: 3, share: 0.15, pow: 1.1, late: 0, lateAt: 0 },
  { key: "hobart", country: "aus", way: [[712, 1600], [700, 1180], [648, 1046]], v: 7.5, first: 57, lanes: 1, share: 0, pow: 1, late: 0, lateAt: 0 },
  { key: "auckland", country: "nz", way: [[1053, 300], [1053, 790], [1036, 862]], v: 8, first: 50, lanes: 2, share: 0, pow: 1.2, late: 2, lateAt: 91 },
  { key: "christchurch", country: "nz", way: [[1400, 1052], [1100, 1042], [1005, 1040]], v: 7.5, first: 46, lanes: 2, share: 0, pow: 1.2, late: 2, lateAt: 97 },
];

// ---- sizes (world px; on screen x the camera's k, 1.47 ... 1.63) -------------------
export const SIZE = {
  aus: { cream: 5.1, orange: 6.3, casing: 1.25, halo: 2.2 },
  nz: { cream: 3.55, orange: 4.3, casing: 0.9, halo: 1.6 },
};
const LANE_GAP = { aus: 11.4, nz: 8.3 };
/** a dot slipping inland is drawn a little smaller until it reaches its place */
const WALK_SIZE = 0.6;

// ---- every dot ---------------------------------------------------------------------
export type Dot = {
  country: "aus" | "nz";
  orange: boolean;
  slot: Pt;
  /** cream only */
  port: number;
  /** enters its route / lands at the port / stands on its slot */
  tEmit: number;
  tLand: number;
  tSettle: number;
  lat: number;
  /** where it leaves the water (route end, on its side of the column) */
  shore: Pt;
};

const landedInv = (c: number, pow: number) => Math.pow(c, 1 / pow);
/** frames to walk d world px inland */
const walkFrames = (d: number, nz: boolean) => Math.max(3, Math.min(60, d / (nz ? 6.5 : 11)));
const WALK_EASE = 1.2;

const SHORE = 90;
/** frames from the route's start to the port, and the arclength reached at a given age */
const seaFrames = (def: PortDef, len: number) => (def.vShore ? (len - SHORE) / def.v + SHORE / def.vShore : len / def.v);
const seaS = (def: PortDef, len: number, age: number) => {
  if (!def.vShore) return age * def.v;
  const t1 = (len - SHORE) / def.v;
  return age < t1 ? age * def.v : len - SHORE + (age - t1) * def.vShore;
};
const ROUTES: Route[] = PORT_DEFS.map((p) => routeOf([...p.way, PORTS[p.key]]));

const build = (): { dots: Dot[]; perPort: number[] } => {
  const dots: Dot[] = [];
  const perPort = PORT_DEFS.map(() => 0);
  const creamOf = (country: "aus" | "nz", slots: Pt[]) => {
    let byPort: number[][] = PORT_DEFS.map(() => []);
    // Australia: each port's hinterland is sized to its share (an additive weight per port, solved by iteration)
    const bias = PORT_DEFS.map(() => 0);
    const assign = () => {
      byPort = PORT_DEFS.map(() => []);
      slots.forEach((s, si) => {
        let best = -1;
        let bd = Infinity;
        PORT_DEFS.forEach((p, pi) => {
          if (p.country !== country) return;
          if (country === "aus") {
            // Tasmania is Hobart's, and only Tasmania
            const tas = s[1] > 935 && s[0] > 530 && s[0] < 640;
            if (tas !== (p.key === "hobart")) return;
          } else if (si < NZ_CREAM_NORTH !== (p.key === "auckland")) return;
          const port = PORTS[p.key];
          const d = Math.hypot(s[0] - port[0], s[1] - port[1]) + bias[pi];
          if (d < bd) {
            bd = d;
            best = pi;
          }
        });
        byPort[best].push(si);
      });
    };
    assign();
    if (country === "aus") {
      const pool = slots.length - byPort[PORT_DEFS.findIndex((p) => p.key === "hobart")].length;
      for (let it = 0; it < 400; it++) {
        PORT_DEFS.forEach((p, pi) => {
          if (p.country === "aus" && p.share > 0) bias[pi] += 0.35 * (byPort[pi].length - p.share * pool);
        });
        assign();
      }
    }
    byPort.forEach((list, pi) => {
      if (!list.length) return;
      const def = PORT_DEFS[pi];
      const port = PORTS[def.key];
      const route = ROUTES[pi];
      const nz = country === "nz";
      const dist = (si: number) => Math.hypot(slots[si][0] - port[0], slots[si][1] - port[1]);
      // nearest first: the land fills as a front from the port (a touch of disorder so it is not a ruled arc)
      const order = [...list].sort((a, b) => dist(a) * (0.97 + 0.06 * hash(a, 3 + pi)) - dist(b) * (0.97 + 0.06 * hash(b, 3 + pi)));
      // stragglers: slots in the near third (not the very first), kept for the hold
      const lateSet = new Set<number>();
      for (let j = 0; j < def.late && order.length > 12; j++) lateSet.add(order[Math.floor(order.length * (0.06 + 0.24 * ((j + 0.5) / def.late)))]);
      const regular = order.filter((si) => !lateSet.has(si));
      const n = regular.length;
      type Rec = { si: number; tLand: number; tSettle: number };
      const recs: Rec[] = [];
      regular.forEach((si, r) => {
        const T = walkFrames(dist(si), nz);
        const tS = def.first + 3 + (FILL_END - def.first - 3) * landedInv((r + 0.5) / n, def.pow);
        // a small port's few dots come as one compact file
        if (n < 12) recs.push({ si, tLand: def.first + r * 0.01, tSettle: def.first + r * 0.01 + T });
        else recs.push({ si, tLand: tS - T, tSettle: tS });
      });
      // the column: landing frames in order, never more at once than it can carry abreast,
      // a single file at its head widening to `lanes`
      recs.sort((a, b) => a.tLand - b.tLand);
      const along = LANE_GAP[country] * 1.12;
      const abreast = (i: number) => Math.min(def.lanes, 1 + i / 8);
      for (let i = recs.length - 2; i >= 0; i--) recs[i].tLand = Math.min(recs[i].tLand, recs[i + 1].tLand - along / ((def.vShore ?? def.v) * def.lanes));
      let t = def.first;
      recs.forEach((q, i) => {
        if (i > 0) t += along / ((def.vShore ?? def.v) * abreast(i));
        q.tLand = Math.max(q.tLand, t);
        t = q.tLand;
        // a dot the column delivers late still walks at a walking pace
        q.tSettle = Math.max(q.tSettle, q.tLand + Math.max(3, dist(q.si) / (nz ? 7.5 : 12)));
      });
      const nReg = recs.length;
      [...lateSet].forEach((si, j) => {
        const tLand = def.lateAt + (along / def.v) * j;
        recs.push({ si, tLand, tSettle: tLand + Math.max(3, Math.min(6, dist(si) / 9)) });
      });
      recs.forEach((rec, i) => {
        const head = i < nReg ? i : i - nReg; // the stragglers are their own short file
        const open = def.lanes > 1 ? (Math.floor(abreast(head) + 1e-6) - 1) / (def.lanes - 1) : 0;
        const lanePos = def.lanes === 1 ? 0 : def.lanes === 2 ? (i % 2 ? 0.5 : -0.5) : [0, -1, 1][i % 3];
        const lat = i < nReg ? lanePos * LANE_GAP[country] * open + (hash(rec.si, 21 + pi) - 0.5) * 1.6 : 0;
        const shore = [0, 0];
        routeAt(route, route.len, lat * 0.55, shore);
        dots.push({ country, orange: false, slot: slots[rec.si], port: pi, tEmit: rec.tLand - seaFrames(def, route.len), tLand: rec.tLand, tSettle: rec.tSettle, lat, shore: [shore[0], shore[1]] });
        perPort[pi]++;
      });
    });
  };
  creamOf("aus", AUS_CREAM);
  creamOf("nz", NZ_CREAM);
  const orangeOf = (country: "aus" | "nz", slots: Pt[]) =>
    slots.forEach((slot) => dots.push({ country, orange: true, slot, port: -1, tEmit: -1e9, tLand: -1e9, tSettle: -1e9, lat: 0, shore: slot }));
  orangeOf("aus", AUS_ORANGE);
  orangeOf("nz", NZ_ORANGE);
  return { dots, perPort };
};
const BUILT = build();
export const DOTS: Dot[] = BUILT.dots;
export const PORT_COUNTS = PORT_DEFS.map((p, i) => ({ port: p.key, dots: BUILT.perPort[i], route: Math.round(ROUTES[i].len) }));

/** 0 at sea, 1 slipping inland, 2 standing on its slot */
export type DotState = 0 | 1 | 2;
/** dot i at frame f: world px into out[0..1], its size factor into out[2]; returns its state */
export const placeDot = (i: number, f: number, out: number[]): DotState => {
  const d = DOTS[i];
  out[2] = 1;
  // alive: a tiny slow drift, its own phase per dot
  const amp = d.orange ? 0.8 : 0.45;
  const ax = amp * Math.sin(f * (0.045 + 0.03 * hash(i, 1)) + 6.283 * hash(i, 2));
  const ay = amp * Math.sin(f * (0.04 + 0.03 * hash(i, 3)) + 6.283 * hash(i, 4));
  if (d.orange || f >= d.tSettle) {
    const w = d.orange ? 1 : smoothstep((f - d.tSettle) / 8);
    out[0] = d.slot[0] + ax * w;
    out[1] = d.slot[1] + ay * w;
    return 2;
  }
  if (f < d.tLand) {
    const def = PORT_DEFS[d.port];
    const r = ROUTES[d.port];
    // an uneven step along the file (so a column of like dots does not strobe), closing to its place at the shore
    const s0 = seaS(def, r.len, f - d.tEmit);
    const s = s0 + (hash(i, 31) - 0.5) * 8 * (1 - smoothstep((s0 - (r.len - 60)) / 50));
    // the column closes up a little as it nears the shore
    const near = smoothstep((s - (r.len - 70)) / 70);
    routeAt(r, s, d.lat * (1 - 0.45 * near), out);
    return 0;
  }
  const T = d.tSettle - d.tLand;
  const u = clamp01((f - d.tLand) / T);
  const e = 1 - Math.pow(1 - u, WALK_EASE);
  out[0] = d.shore[0] + (d.slot[0] - d.shore[0]) * e;
  out[1] = d.shore[1] + (d.slot[1] - d.shore[1]) * e;
  // smaller while it slips through the crowd, full size again as it arrives
  out[2] = 1 - (1 - WALK_SIZE) * smoothstep((f - d.tLand) / 2.5) * (1 - smoothstep((f - (d.tSettle - 4)) / 4));
  return 1;
};

/** counts at frame f (for the check script and the header's claims) */
export const countAt = (f: number) => {
  const c = { aus: { orange: 0, cream: 0 }, nz: { orange: 0, cream: 0 } };
  const p = [0, 0, 1];
  DOTS.forEach((d, i) => {
    if (placeDot(i, f, p) !== 2) return;
    c[d.country][d.orange ? "orange" : "cream"]++;
  });
  return c;
};
