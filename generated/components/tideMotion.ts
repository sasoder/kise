// ClosedWorldsTide: where every ship and dot is on every frame. Pure maths (no
// React), so scripts/check-tide-dots.ts can count and measure it. World px of the
// Mercator chart (tideGeo.ts); the camera is tideCamera.ts.
//
// THE LEAD SHIP rides the dashed Carrera track to the ring (ClosedWorlds' own
// schedule: one steady screen speed, bow on the rim at f76).
// THE ATLANTIC STREAM (illustrative, no ratio claimed): cream dots follow the ship
// down the same track in a slim file, a trickle that thickens to a flood, land at
// Veracruz and stand on the land inside and round the ring.
// THE CONVOY: four carracks leave the Channel in line astern, run down the African
// coast, round the Cape and east along 40 S on one shared clock (so the line keeps
// its shape while the camera travels with it). Off Cape Leeuwin the small last ship
// turns north for Perth; the lead anchors off Sydney, the second off the south
// coast, the third sails on across the Tasman and anchors off the North Island.
// THE LANDINGS: the 481 + 83 cream dots of MinorityInOwnCountry come OFF the
// anchored ships in short files to the ports and slip inland to their slots,
// nearest the port first. The ORANGE dots (19 + 18, the original peoples) stand on
// their slots for the whole cut.
import { AUS_CREAM, AUS_ORANGE, MEX_SLOTS, NZ_CREAM, NZ_CREAM_NORTH, NZ_ORANGE, ROUTE, ROUTE_LEN, type P3 } from "./texcocoTideMapData";
import { DURATION, FRAME_H, FRAME_W, cameraAt, toScreen, type Cam } from "./tideCamera";
import { HOP_ROUTE, LANDING, TRUNK, SHIP_ROUTE, VERACRUZ, routeAt, routeOf, type LandingKey, type P2, type Route, type ShipKey } from "./tideGeo";

export { DURATION, FRAME_H, FRAME_W, cameraAt, toScreen };
export type { Cam };

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
/** piecewise-linear y(x) through keys, and its inverse (keys rising in both) */
const lerpKeys = (keys: [number, number][], x: number, from: 0 | 1 = 0) => {
  const to = (1 - from) as 0 | 1;
  if (x <= keys[0][from]) return keys[0][to];
  for (let i = 1; i < keys.length; i++) {
    if (x <= keys[i][from]) return keys[i - 1][to] + ((keys[i][to] - keys[i - 1][to]) * (x - keys[i - 1][from])) / (keys[i][from] - keys[i - 1][from]);
  }
  return keys[keys.length - 1][to];
};

// ---- the Carrera track and the lead ship (ClosedWorlds') ------------------------------
export const carreraAt = (s: number): P2 => {
  const x = Math.max(0, Math.min(ROUTE_LEN, s));
  const i = Math.min(ROUTE_LEN - 1, Math.floor(x));
  const t = x - i;
  return [ROUTE[i][0] + (ROUTE[i + 1][0] - ROUTE[i][0]) * t, ROUTE[i][1] + (ROUTE[i + 1][1] - ROUTE[i][1]) * t];
};
const carreraScreen = (s: number, f: number): P2 => toScreen(carreraAt(s), cameraAt(f));
// Nothing may cross the screen faster than ~22 px / frame, and during the pull-back
// the zoom alone moves the far side of the frame faster than that. So the dashed
// track leads (f32-f51) and the ship rises at its head once it can ride it at
// SHIP_V screen px / frame: solved backwards from the ring (bow on the rim at f76).
const SHIP_V = 20.5;
export const LEAD = { line0: 32, join: 51, f1: 76, rise0: 49, rise1: 58 };
const LEAD_S: number[] = (() => {
  const out: number[] = [];
  out[LEAD.f1] = ROUTE_LEN - 1.5;
  for (let f = LEAD.f1 - 1; f >= LEAD.join; f--) {
    const v = SHIP_V * smoothstep((LEAD.f1 - f - 0.5) / 9);
    const q = carreraScreen(out[f + 1], f + 1);
    let lo = 0;
    let hi = out[f + 1];
    for (let i = 0; i < 44; i++) {
      const mid = (lo + hi) / 2;
      const p = carreraScreen(mid, f);
      if (Math.hypot(p[0] - q[0], p[1] - q[1]) > v) lo = mid;
      else hi = mid;
    }
    out[f] = hi;
  }
  return out;
})();
const leadTable = (f: number) => {
  const i = Math.max(LEAD.join, Math.min(LEAD.f1 - 1, Math.floor(f)));
  return LEAD_S[i] + (LEAD_S[i + 1] - LEAD_S[i]) * (f - i);
};
/** the track's head / the lead ship: arclength along the Carrera on frame f */
export const leadS = (f: number) => {
  if (f >= LEAD.f1) return LEAD_S[LEAD.f1] + 1.5 * clamp01((f - LEAD.f1) / 10);
  if (f >= LEAD.join) return leadTable(f);
  const t = clamp01((f - LEAD.line0) / (LEAD.join - LEAD.line0));
  return LEAD_S[LEAD.join] * (1 - (1 - t) * (1 - t));
};

// ---- the Atlantic stream ---------------------------------------------------------------
// its route: the Carrera, then on from the track's end to the beach at Veracruz
const A_WAY: P2[] = [];
for (let i = 0; i < ROUTE_LEN - 12; i += 24) A_WAY.push(ROUTE[i]);
A_WAY.push(ROUTE[ROUTE_LEN], VERACRUZ);
const A_ROUTE: Route = routeOf(A_WAY);
const A_RATIO = (A_ROUTE.len - Math.hypot(ROUTE[ROUTE_LEN][0] - VERACRUZ[0], ROUTE[ROUTE_LEN][1] - VERACRUZ[1])) / ROUTE_LEN;
/** a dot's own schedule: the lead ship's up to U0 (before the ship slows for the ring), then straight on at that pace */
const U0 = 66;
const A_V = leadTable(U0) - leadTable(U0 - 1);
const A_V51 = LEAD_S[LEAD.join + 1] - LEAD_S[LEAD.join];
const aS = (u: number) => A_RATIO * (u <= LEAD.join ? LEAD_S[LEAD.join] - A_V51 * (LEAD.join - u) : u <= U0 ? leadTable(u) : leadTable(U0) + A_V * (u - U0));
const A_UEND = U0 + (A_ROUTE.len / A_RATIO - leadTable(U0)) / A_V;
/** how many have landed by frame f: a trickle behind the ship, a flood on "huge numbers" (f101-115) */
const A_CUM: [number, number][] = [
  [79.5, 0],
  [88, 8],
  [96, 34],
  [104, 78],
  [112, 126],
  [123, MEX_SLOTS.length],
];
const A_LANE = 9.6;
export const A_R = 4.3;

// ---- the landings ---------------------------------------------------------------------
type PortDef = {
  key: LandingKey;
  country: "aus" | "nz";
  /** the frame its first dot lands */
  first: number;
  /** world px per frame on the hop from the ship */
  v: number;
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
/** the last regular dot stands by here ("minority" is f205-214); stragglers land after */
const FILL_END = 206;
const PORT_DEFS: PortDef[] = [
  { key: "sydney", country: "aus", first: 167, v: 8.5, lanes: 3, share: 0.28, pow: 1, late: 4, lateAt: 217 },
  { key: "brisbane", country: "aus", first: 172, v: 9.5, lanes: 3, share: 0.23, pow: 1, late: 3, lateAt: 220 },
  { key: "perth", country: "aus", first: 172, v: 8, lanes: 2, share: 0.2, pow: 1, late: 0, lateAt: 0 },
  { key: "adelaide", country: "aus", first: 182, v: 8.5, lanes: 3, share: 0.14, pow: 1, late: 0, lateAt: 0 },
  { key: "melbourne", country: "aus", first: 178, v: 8.5, lanes: 3, share: 0.15, pow: 1, late: 0, lateAt: 0 },
  { key: "hobart", country: "aus", first: 178, v: 8, lanes: 1, share: 0, pow: 1, late: 0, lateAt: 0 },
  { key: "auckland", country: "nz", first: 187, v: 7, lanes: 2, share: 0, pow: 1.1, late: 2, lateAt: 218 },
  { key: "nelson", country: "nz", first: 188, v: 6.5, lanes: 2, share: 0, pow: 1.1, late: 2, lateAt: 222 },
];
const ROUTES: Route[] = PORT_DEFS.map((p) => HOP_ROUTE[p.key]);
const PORTS = LANDING;

// ---- the convoy -----------------------------------------------------------------------
// THE CLOCK: world px a ship covers per frame, the same for every ship at any moment.
// Fast while the camera crosses the oceans with the line (it holds near the middle of
// the frame), braking as the camera comes down on Australia, so on screen nothing runs
// away. The ship for New Zealand keeps more way on (its own tail of the clock).
const S_RATE: [number, number][] = [
  [80, 20],
  [100, 22],
  [112, 26],
  [122, 32],
  [132, 38],
  [140, 44],
  [150, 50],
  [157, 48],
  [162, 32],
  [167, 14],
  [172, 8],
  [180, 6.4],
  [240, 6],
];
const S_F0 = 70;
const S_SUB = 8;
const S_TAB: number[] = (() => {
  const out = [0];
  for (let i = 1; i <= (DURATION + 8 - S_F0) * S_SUB; i++) out.push(out[i - 1] + lerpKeys(S_RATE, S_F0 + (i - 0.5) / S_SUB) / S_SUB);
  return out;
})();
export const clockAt = (f: number): number => {
  const x = (f - S_F0) * S_SUB;
  if (x <= 0) return x * (S_RATE[0][1] / S_SUB);
  const i = Math.min(S_TAB.length - 2, Math.floor(x));
  return S_TAB[i] + (S_TAB[i + 1] - S_TAB[i]) * (x - i);
};
const rateTab = (keys: [number, number][]) => {
  const out = [0];
  for (let i = 1; i <= (DURATION + 8 - S_F0) * S_SUB; i++) out.push(out[i - 1] + lerpKeys(keys, S_F0 + (i - 0.5) / S_SUB) / S_SUB);
  return (f: number) => {
    const x = (f - S_F0) * S_SUB;
    if (x <= 0) return x * (keys[0][1] / S_SUB);
    const i = Math.min(out.length - 2, Math.floor(x));
    return out[i] + (out[i + 1] - out[i]) * (x - i);
  };
};
const TASMAN_RATE: [number, number][] = [...S_RATE.filter((q) => q[0] <= 157), [163, 34], [169, 25], [176, 17], [183, 12], [240, 9]];
const clockTasman = rateTab(TASMAN_RATE);
export type Ship = { key: ShipKey; route: Route; anchorAt: number; clock: (f: number) => number; size: number; seed: number };
/** screen px across at the wide crossing (k 0.8); a ship grows only mildly as the camera comes down */
export const SHIPS: Ship[] = [
  { key: "sydney", route: SHIP_ROUTE.sydney, anchorAt: 165, clock: clockAt, size: 120, seed: 3 },
  { key: "south", route: SHIP_ROUTE.south, anchorAt: 165.5, clock: clockAt, size: 97, seed: 7 },
  { key: "tasman", route: SHIP_ROUTE.tasman, anchorAt: 184, clock: clockTasman, size: 97, seed: 12 },
  { key: "west", route: SHIP_ROUTE.west, anchorAt: 166, clock: clockAt, size: 80, seed: 17 },
];
/** a ship runs up to its anchorage and loses its way over the last stretch (no dead stop) */
const BRAKE = 55;
const brake = (x: number) => (x <= 0 ? 0 : (x * x) / (x + BRAKE));
/** arclength of a ship along its route on frame f */
export const shipS = (sh: Ship, f: number) => sh.route.len - brake(sh.clock(sh.anchorAt) - sh.clock(f));
export const shipSize = (sh: Ship, k: number) => sh.size * Math.pow(k / 0.8, 0.12);
/** a ship on frame f: world px into out[0..1]; returns how far out of port it is (0..1, it rises as it leaves) and how much way it has on (0 at anchor) */
export const placeShip = (sh: Ship, f: number, out: number[]) => {
  const s = shipS(sh, f);
  routeAt(sh.route, Math.max(0, s), 0, out);
  return { s, rise: smoothstep((s - 4) / 70), way: smoothstep((sh.clock(sh.anchorAt) - sh.clock(f)) / 70) };
};

// ---- sizes: world px there (MinorityInOwnCountry's), carried by each dot's local scale ----
const SIZE = {
  aus: { cream: 5.1, orange: 6.3, casing: 1.25, halo: 2.2, lane: 11.4 },
  nz: { cream: 3.55, orange: 4.3, casing: 0.9, halo: 1.6, lane: 8.3 },
};
/** a dot slipping inland is drawn a little smaller until it reaches its place */
const WALK_SIZE = 0.6;
const WALK_EASE = 1.2;

// ---- every dot ---------------------------------------------------------------------
export type Dot = {
  group: "mex" | "aus" | "nz";
  orange: boolean;
  slot: P2;
  /** world radius of the disc, its dark casing, and (orange) its halo */
  r: number;
  casing: number;
  halo: number;
  /** cream only: its route, when it lands and stands, where it leaves the water */
  port: number;
  tLand: number;
  tSettle: number;
  /** its place across the file */
  lat: number;
  shore: P2;
};

const build = (): { dots: Dot[]; perPort: number[] } => {
  const dots: Dot[] = [];
  const perPort = PORT_DEFS.map(() => 0);

  // -- Mexico --
  {
    const dist = (i: number) => Math.hypot(MEX_SLOTS[i][0] - VERACRUZ[0], MEX_SLOTS[i][1] - VERACRUZ[1]);
    const order = MEX_SLOTS.map((_, i) => i).sort((a, b) => dist(a) * (0.94 + 0.12 * hash(a, 5)) - dist(b) * (0.94 + 0.12 * hash(b, 5)));
    let t = -1e9;
    const abreast = (i: number) => Math.min(3, 1 + i / 7);
    order.forEach((si, i) => {
      let tLand = lerpKeys(A_CUM, i + 0.5, 1);
      tLand = Math.max(tLand, t + A_LANE / (A_V * abreast(i)));
      t = tLand;
      // a point at the head, three abreast behind, drawn back to a point at the tail
      const open = ((Math.floor(abreast(i) + 1e-6) - 1) / 2) * smoothstep((order.length - 1 - i) / 9);
      const lat = [0, -1, 1][i % 3] * A_LANE * open + (hash(si, 9) - 0.5) * 1.8;
      const shore = [0, 0];
      routeAt(A_ROUTE, A_ROUTE.len, lat * 0.5, shore);
      dots.push({ group: "mex", orange: false, slot: MEX_SLOTS[si], r: A_R, casing: 1.2, halo: 0, port: -1, tLand, tSettle: tLand + Math.max(3, Math.min(12, dist(si) / 11)), lat, shore: [shore[0], shore[1]] });
    });
  }

  // -- Oceania --
  const creamOf = (country: "aus" | "nz", slots: P3[]) => {
    let byPort: number[][] = PORT_DEFS.map(() => []);
    const bias = PORT_DEFS.map(() => 0);
    // Tasmania is Hobart's, and only Tasmania (south of Bass Strait, 144-149 E)
    const TAS = { y: PORTS.melbourne[1] + 14, x0: PORTS.melbourne[0] - 12, x1: PORTS.sydney[0] - 18 };
    const assign = () => {
      byPort = PORT_DEFS.map(() => []);
      slots.forEach((s, si) => {
        let best = -1;
        let bd = Infinity;
        PORT_DEFS.forEach((p, pi) => {
          if (p.country !== country) return;
          if (country === "aus") {
            const tas = s[1] > TAS.y && s[0] > TAS.x0 && s[0] < TAS.x1;
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
          if (p.country === "aus" && p.share > 0) bias[pi] += 0.18 * (byPort[pi].length - p.share * pool);
        });
        assign();
      }
    }
    const z = SIZE[country];
    byPort.forEach((list, pi) => {
      if (!list.length) return;
      const def = PORT_DEFS[pi];
      const port = PORTS[def.key];
      const route = ROUTES[pi];
      const nz = country === "nz";
      const sc = slots[list[0]][2];
      /** distance in the old chart's px, so its walking paces carry over */
      const dist = (si: number) => Math.hypot(slots[si][0] - port[0], slots[si][1] - port[1]) / slots[si][2];
      const order = [...list].sort((a, b) => dist(a) * (0.97 + 0.06 * hash(a, 3 + pi)) - dist(b) * (0.97 + 0.06 * hash(b, 3 + pi)));
      const lateSet = new Set<number>();
      for (let j = 0; j < def.late && order.length > 12; j++) lateSet.add(order[Math.floor(order.length * (0.06 + 0.24 * ((j + 0.5) / def.late)))]);
      const regular = order.filter((si) => !lateSet.has(si));
      const n = regular.length;
      type Rec = { si: number; tLand: number; tSettle: number };
      const recs: Rec[] = [];
      const walkFrames = (d: number) => Math.max(3, Math.min(44, d / (nz ? 8.5 : 14)));
      regular.forEach((si, r) => {
        const T = walkFrames(dist(si));
        const tS = def.first + 3 + (FILL_END - def.first - 3) * Math.pow((r + 0.5) / n, 1 / def.pow);
        if (n < 12) recs.push({ si, tLand: def.first + r * 0.01, tSettle: def.first + r * 0.01 + T });
        else recs.push({ si, tLand: tS - T, tSettle: tS });
      });
      // the file off the ship: landings in order, never more at once than it can carry abreast,
      // a single file at its head widening to `lanes`
      recs.sort((a, b) => a.tLand - b.tLand);
      const along = z.lane * sc * 0.92;
      const abreast = (i: number) => Math.min(def.lanes, 1 + i / 8);
      for (let i = recs.length - 2; i >= 0; i--) recs[i].tLand = Math.min(recs[i].tLand, recs[i + 1].tLand - along / (def.v * def.lanes));
      let t = def.first;
      recs.forEach((q, i) => {
        if (i > 0) t += along / (def.v * abreast(i));
        q.tLand = Math.max(q.tLand, t);
        t = q.tLand;
        q.tSettle = Math.max(q.tSettle, q.tLand + Math.max(3, dist(q.si) / (nz ? 9.5 : 15)));
      });
      const nReg = recs.length;
      [...lateSet].forEach((si, j) => {
        const tLand = def.lateAt + (along / def.v) * j;
        recs.push({ si, tLand, tSettle: tLand + Math.max(3, Math.min(6, dist(si) / 9)) });
      });
      recs.forEach((rec, i) => {
        const head = i < nReg ? i : i - nReg;
        const open = def.lanes > 1 ? (Math.floor(abreast(head) + 1e-6) - 1) / (def.lanes - 1) : 0;
        const lanePos = def.lanes === 1 ? 0 : def.lanes === 2 ? (i % 2 ? 0.5 : -0.5) : [0, -1, 1][i % 3];
        const lat = i < nReg ? lanePos * z.lane * sc * open + (hash(rec.si, 21 + pi) - 0.5) * 0.9 : 0;
        const shore = [0, 0];
        routeAt(route, route.len, lat * 0.55, shore);
        const s = slots[rec.si];
        dots.push({ group: country, orange: false, slot: [s[0], s[1]], r: z.cream * s[2], casing: z.casing * s[2], halo: 0, port: pi, tLand: rec.tLand, tSettle: rec.tSettle, lat, shore: [shore[0], shore[1]] });
        perPort[pi]++;
      });
    });
  };
  creamOf("aus", AUS_CREAM);
  creamOf("nz", NZ_CREAM);
  const orangeOf = (country: "aus" | "nz", slots: P3[]) =>
    slots.forEach((s) => dots.push({ group: country, orange: true, slot: [s[0], s[1]], r: SIZE[country].orange * s[2], casing: 0, halo: SIZE[country].halo * s[2], port: -1, tLand: -1e9, tSettle: -1e9, lat: 0, shore: [s[0], s[1]] }));
  orangeOf("aus", AUS_ORANGE);
  orangeOf("nz", NZ_ORANGE);
  return { dots, perPort };
};
const BUILT = build();
export const DOTS: Dot[] = BUILT.dots;
export const PORT_COUNTS = PORT_DEFS.map((p, i) => ({ port: p.key, dots: BUILT.perPort[i], route: Math.round(ROUTES[i].len) }));

/** 0 at sea, 1 slipping inland, 2 standing on its slot, -1 not yet out of port */
export type DotState = -1 | 0 | 1 | 2;
/** dot i at frame f: world px into out[0..1], its size factor into out[2]; returns its state */
export const placeDot = (i: number, f: number, out: number[]): DotState => {
  const d = DOTS[i];
  out[2] = 1;
  // alive: a tiny slow drift, its own phase per dot
  const amp = (d.orange ? 0.8 : 0.45) * (d.group === "mex" ? 1 : 0.55);
  const ax = amp * Math.sin(f * (0.045 + 0.03 * hash(i, 1)) + 6.283 * hash(i, 2));
  const ay = amp * Math.sin(f * (0.04 + 0.03 * hash(i, 3)) + 6.283 * hash(i, 4));
  if (d.orange || f >= d.tSettle) {
    const w = d.orange ? 1 : smoothstep((f - d.tSettle) / 8);
    out[0] = d.slot[0] + ax * w;
    out[1] = d.slot[1] + ay * w;
    return 2;
  }
  if (f < d.tLand) {
    if (d.group === "mex") {
      const s = aS(f - d.tLand + A_UEND);
      if (s <= 0) return -1;
      const near = smoothstep((s - (A_ROUTE.len - 60)) / 60);
      routeAt(A_ROUTE, s + (hash(i, 31) - 0.5) * 7 * (1 - near), d.lat * (1 - 0.5 * near), out);
      // they come out of Seville behind the ship, not before it has risen
      out[2] = smoothstep(s / 30) * smoothstep((f - LEAD.rise0 - 3) / 8);
      if (out[2] <= 0.01) return -1;
      return 0;
    }
    // off the ship: a short file to the port
    const r = ROUTES[d.port];
    const s0 = r.len - PORT_DEFS[d.port].v * (d.tLand - f);
    if (s0 <= 0) return -1;
    const s = s0 + (hash(i, 31) - 0.5) * 3 * smoothstep(s0 / 14) * (1 - smoothstep((s0 - (r.len - 20)) / 16));
    const near = smoothstep((s - (r.len - 24)) / 24);
    // it opens from the ship's side and closes again at the quay
    routeAt(r, s, d.lat * smoothstep(s0 / 22) * (1 - 0.45 * near), out);
    out[2] = smoothstep(s0 / 9);
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
/** the radius a dot is drawn at (world px): its own, but never under a few screen px, so the streams read from far off */
export const drawRadius = (d: Dot, k: number) => Math.max(d.r, (d.orange ? 4.6 : 4.1) / k);

/** standing dots at frame f (for the check script and the header's claims) */
export const countAt = (f: number) => {
  const c = { mex: { orange: 0, cream: 0 }, aus: { orange: 0, cream: 0 }, nz: { orange: 0, cream: 0 } };
  const p = [0, 0, 1];
  DOTS.forEach((d, i) => {
    if (placeDot(i, f, p) !== 2) return;
    c[d.group][d.orange ? "orange" : "cream"]++;
  });
  return c;
};
/** Mexico's dots leave with the left edge of the frame: each shrinks away over its last 40 px (nothing is cut by the edge or whips out) */
export const edgeScale = (d: Dot, sx: number, f: number) => (d.group === "mex" && f > 96 ? smoothstep((sx - 6) / 40) : 1);
/** the two that follow the lead ship down the Carrera (ClosedWorlds'): arclength on frame f */
export const FOLLOW = [
  { f0: 66.5, v: 7.5, seed: 7 },
  { f0: 75, v: 7.5, seed: 12 },
];
export const followS = (f: number, q: (typeof FOLLOW)[number]) => {
  const t = f - q.f0;
  if (t <= 0) return 0;
  return q.v * (t < 5 ? (t * t) / 10 : t - 2.5);
};
/** a route from arclength s0 to s1 as an SVG path (world px) */
export const routePathD = (r: Route, s0: number, s1: number) => {
  if (s1 - s0 < 0.5) return "";
  const q = [0, 0];
  routeAt(r, s0, 0, q);
  let d = `M${q[0].toFixed(2)},${q[1].toFixed(2)}`;
  for (let i = 0; i < r.cum.length; i++) {
    if (r.cum[i] <= s0) continue;
    if (r.cum[i] >= s1) break;
    d += `L${r.pts[i][0].toFixed(2)},${r.pts[i][1].toFixed(2)}`;
  }
  routeAt(r, s1, 0, q);
  return `${d}L${q[0].toFixed(2)},${q[1].toFixed(2)}`;
};
export const TRUNK_LEN = TRUNK.len;
