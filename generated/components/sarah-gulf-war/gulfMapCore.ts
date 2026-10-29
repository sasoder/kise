// ---------------------------------------------------------------------------
// gulfMapCore: the PURE half of the Gulf map world (no React, no fonts; bun can import it for probes). The camera, the
// haze, paths, THE COLUMN (every tank's route and its constant-speed drive), the oil fields' lit timeline and their
// derricks, and cut 12's camera track. gulfMapWorld.tsx re-exports all of it; cuts import from gulfMapWorld.
//
// THE WORLD (gulfMapData.ts): map world px, ~1 km each (LCC 28.5/31 N, centre meridian 47.8 E). 3D point (X, Y, Zm):
//   X = map x (east), Y = height above the ground (up +), Zm = map y (south +; north recedes when looking north).
//   Kuwait City is the origin. Props on the map are SYMBOLIC: a tank is TANK_L = 3 world px long (3 km).
// ---------------------------------------------------------------------------
import { CAM_DAMP, CAM_STIFF } from "../kits/dwarkesh/fieldShared";
import { pchip } from "../kits/maps/incaShared";
import { BORDERS, FIELDS, PLACES, ROAD, project, type Field } from "./gulfMapData";

export const W = 1080;
export const H = 1920;
/** focal length, px (vertical field ~72 deg), as the medMap / rodent cameras */
export const F = 1300;

export type V3 = [number, number, number];
export type P2 = [number, number];
export const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const sub3 = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const norm3 = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
export const c01 = (v: number) => Math.max(0, Math.min(1, v));
export const sstep = (a: number, b: number, x: number) => {
  const t = c01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

// ===================================================================================================================
// THE CAMERA: a pinhole aimed at a target T from a distance D, pitched down, yawed (bearing: 0 = map-up, + = east)
// ===================================================================================================================
export type Cam = { C: V3; f: V3; r: V3; u: V3; D: number; pitch: number; yaw: number; T: V3 };
export const camFrom = (tx: number, ty: number, tz: number, D: number, pitchDeg: number, yawDeg: number): Cam => {
  const yaw = (yawDeg * Math.PI) / 180;
  const p = (pitchDeg * Math.PI) / 180;
  const f: V3 = [Math.sin(yaw) * Math.cos(p), -Math.sin(p), -Math.cos(yaw) * Math.cos(p)];
  const r: V3 = [Math.cos(yaw), 0, Math.sin(yaw)];
  const u = cross(r, f);
  const C: V3 = [tx - D * f[0], ty - D * f[1], tz - D * f[2]];
  return { C, f, r, u, D, pitch: pitchDeg, yaw: yawDeg, T: [tx, ty, tz] };
};
/** the LCC pole's image: the map's meridians are rays from it */
export const POLE: P2 = project(47.8, 89.99999);
/** the bearing (deg) of the local meridian at map point (x, y) */
export const northYaw = (x: number, y: number) => (Math.atan2(POLE[0] - x, -(POLE[1] - y)) * 180) / Math.PI;

/** a camera key: target (map x, height, map y), distance, pitch (deg down), yaw (deg, bearing) */
export type CamKey3 = { f: number; tx: number; ty?: number; tz: number; D: number; pitch: number; yaw: number };
/** keys -> pchip per channel (log D) -> the house damped follow (CAM_STIFF / CAM_DAMP), pre-rolled so f0 already moves
 *  as the keys say (medMapWorld's track) */
export const makeTrack = (keys: CamKey3[], duration: number, o: { pre?: number; lead?: number } = {}) => {
  const ch = [
    pchip(keys.map((q) => [q.f, q.tx] as [number, number])),
    pchip(keys.map((q) => [q.f, q.ty ?? 0] as [number, number])),
    pchip(keys.map((q) => [q.f, q.tz] as [number, number])),
    pchip(keys.map((q) => [q.f, Math.log(q.D)] as [number, number])),
    pchip(keys.map((q) => [q.f, q.pitch] as [number, number])),
    pchip(keys.map((q) => [q.f, q.yaw] as [number, number])),
  ];
  const target = (f: number) => ch.map((c) => c(f));
  const PRE = o.pre ?? 60;
  const LEAD = o.lead ?? 5;
  let s = target(-PRE + LEAD);
  let v = s.map(() => 0);
  const raw: number[][] = [];
  for (let fr = -PRE + 1; fr <= duration + 2; fr++) {
    const t = target(fr + LEAD);
    v = v.map((vi, i) => vi + (t[i] - s[i]) * CAM_STIFF - vi * CAM_DAMP);
    s = s.map((si, i) => si + v[i]);
    if (fr >= 0) raw.push([...s]);
  }
  const at = (q: number[]) => camFrom(q[0], q[1], q[2], Math.exp(q[3]), q[4], q[5]);
  const path = raw.map(at);
  const camAt = (frame: number): Cam => {
    const i = Math.max(0, Math.min(raw.length - 2, Math.floor(frame)));
    const t = Math.max(0, Math.min(1, frame - i));
    if (t === 0) return path[i];
    return at(raw[i].map((a, j) => a + (raw[i + 1][j] - a) * t));
  };
  return { camAt, path, raw };
};

export type Scr = { x: number; y: number; z: number; s: number };
/** a 3D point -> screen (x, y), its depth along the view axis z and its scale s (screen px per world px) */
export const toScreen = (cam: Cam, X: number, Y: number, Zm: number): Scr => {
  const d: V3 = [X - cam.C[0], Y - cam.C[1], Zm - cam.C[2]];
  const z = dot(d, cam.f);
  const zz = Math.max(z, 1e-6);
  return { x: W / 2 + (F * dot(d, cam.r)) / zz, y: H / 2 - (F * dot(d, cam.u)) / zz, z, s: F / zz };
};
/** the ground point under a screen pixel (null above the horizon) */
export const groundAt = (cam: Cam, sx: number, sy: number): P2 | null => {
  const a = (sx - W / 2) / F;
  const b = -(sy - H / 2) / F;
  const dir: V3 = [cam.f[0] + a * cam.r[0] + b * cam.u[0], cam.f[1] + a * cam.r[1] + b * cam.u[1], cam.f[2] + a * cam.r[2] + b * cam.u[2]];
  if (dir[1] >= -1e-9) return null;
  const t = -cam.C[1] / dir[1];
  return [cam.C[0] + t * dir[0], cam.C[2] + t * dir[2]];
};
/** the screen-space horizon y (on the centre line) */
export const horizonY = (cam: Cam) => H / 2 - F * Math.tan((cam.pitch * Math.PI) / 180);
export const distTo = (cam: Cam, X: number, Y: number, Zm: number) => Math.hypot(X - cam.C[0], Y - cam.C[1], Zm - cam.C[2]);

// ===================================================================================================================
// HAZE (one function for the shader and every overlay)
// ===================================================================================================================
export const hazeScale = (D: number) => Math.hypot(D, 20);
export const hazeOf = (dist: number, D: number) => {
  const r = dist / hazeScale(D);
  const h0 = 0.8 * sstep(1.7, 4.6, r);
  return h0 + (1 - h0) * sstep(3.6, 14, r);
};

/** THE LIGHT: from the upper left of the frame of a camera looking SOUTH (yaw 180): from the east, high, a little from
 *  the viewer's (north) side. Fixed in the world: shadows fall to the screen's lower right (west, toward the lens). */
export const LIGHT: V3 = norm3([0.55, 0.78, -0.3]);
/** the contact shadows' offset direction on the ground (away from the light), unit (map x, map y) */
export const SHADOW_DIR: P2 = (() => {
  const l = Math.hypot(LIGHT[0], LIGHT[2]);
  return [-LIGHT[0] / l, -LIGHT[2] / l];
})();

// ===================================================================================================================
// PATHS
// ===================================================================================================================
export type Path = { pts: P2[]; cum: number[]; len: number };
export const makePath = (pts: P2[]): Path => {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return { pts, cum, len: cum[cum.length - 1] };
};
/** a centripetal Catmull-Rom through control points (world px), `per` samples per span */
export const smoothPath = (ctrl: P2[], per = 24): Path => {
  const out: P2[] = [];
  const P = [ctrl[0], ...ctrl, ctrl[ctrl.length - 1]];
  for (let i = 1; i < P.length - 2; i++) {
    const [p0, p1, p2, p3] = [P[i - 1], P[i], P[i + 1], P[i + 2]];
    const tj = (a: P2, b: P2) => Math.pow(Math.hypot(b[0] - a[0], b[1] - a[1]) || 1e-6, 0.5);
    const t0 = 0;
    const t1 = t0 + tj(p0, p1);
    const t2 = t1 + tj(p1, p2);
    const t3 = t2 + tj(p2, p3);
    for (let k = 0; k < per; k++) {
      const t = t1 + ((t2 - t1) * k) / per;
      const L = (a: P2, b: P2, ta: number, tb: number): P2 => [((tb - t) / (tb - ta)) * a[0] + ((t - ta) / (tb - ta)) * b[0], ((tb - t) / (tb - ta)) * a[1] + ((t - ta) / (tb - ta)) * b[1]];
      const A1 = L(p0, p1, t0, t1);
      const A2 = L(p1, p2, t1, t2);
      const A3 = L(p2, p3, t2, t3);
      const B1 = L(A1, A2, t0, t2);
      const B2 = L(A2, A3, t1, t3);
      out.push(L(B1, B2, t1, t2));
    }
  }
  out.push(ctrl[ctrl.length - 1]);
  return makePath(out);
};
/** the point at arclength s (extrapolated straight past either end) */
export const pointAt = (p: Path, s: number): P2 => {
  if (s <= 0) {
    const d = [p.pts[1][0] - p.pts[0][0], p.pts[1][1] - p.pts[0][1]];
    const l = Math.hypot(d[0], d[1]) || 1;
    return [p.pts[0][0] + (d[0] / l) * s, p.pts[0][1] + (d[1] / l) * s];
  }
  if (s >= p.len) {
    const n = p.pts.length;
    const d = [p.pts[n - 1][0] - p.pts[n - 2][0], p.pts[n - 1][1] - p.pts[n - 2][1]];
    const l = Math.hypot(d[0], d[1]) || 1;
    return [p.pts[n - 1][0] + (d[0] / l) * (s - p.len), p.pts[n - 1][1] + (d[1] / l) * (s - p.len)];
  }
  let lo = 0;
  let hi = p.cum.length - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (p.cum[m] <= s) lo = m;
    else hi = m;
  }
  const t = (s - p.cum[lo]) / Math.max(1e-9, p.cum[lo + 1] - p.cum[lo]);
  return [p.pts[lo][0] + (p.pts[lo + 1][0] - p.pts[lo][0]) * t, p.pts[lo][1] + (p.pts[lo + 1][1] - p.pts[lo][1]) * t];
};
/** the point and heading (rad bearing: 0 = map-up, + = east) at arclength s; the heading is the tangent over +-2 km,
 *  so a tank always points the way it drives */
export const pathAt = (p: Path, s: number): { at: P2; heading: number } => {
  const back = pointAt(p, s - 2);
  const fwd = pointAt(p, s + 2);
  return { at: pointAt(p, s), heading: Math.atan2(fwd[0] - back[0], -(fwd[1] - back[1])) };
};
/** the arclength on a path nearest to a point */
export const nearestS = (p: Path, q: P2) => {
  let best = 0;
  let bd = Infinity;
  p.pts.forEach((a, i) => {
    const d = Math.hypot(a[0] - q[0], a[1] - q[1]);
    if (d < bd) [bd, best] = [d, p.cum[i]];
  });
  return best;
};

// ===================================================================================================================
// THE COLUMN: 18 Iraqi tanks. Every tank drives its own smooth path at ONE constant speed V (the way it points), then
// slows over its last DEC world px to its stop in a field (a real tank brakes) and idles there.
//   group "city"  (6): the head of the column, 2 abreast down the road through Kuwait City (the lead, tank 0, runs
//                      through the debt stack) and on south to Greater Burgan
//   group "west"  (6): the column's rear rows; at Jahra they turn south-west for Minagish (3) and Umm Gudair (3)
//   group "north" (6): the second wave, still north of Basra at f0; it pours over the border as cut 12's camera rises
//                      and turns off the road into Raudhatain (3) and Sabriya (3)
// ===================================================================================================================
export const TANK_L = 3;
/** km (world px) per frame */
export const V = 1.12;
/** the braking distance into a stop */
export const DEC = 5;
export const ROAD_PATH: Path = makePath(ROAD.pts as P2[]);
/** the road's crossing of the Iraq-Kuwait border (arclength on ROAD_PATH) */
export const BORDER_S = (() => {
  const line = BORDERS.iraqKuwait.flat() as P2[];
  let best = 0;
  let bd = Infinity;
  for (let i = 0; i < ROAD_PATH.pts.length; i++) {
    const a = ROAD_PATH.pts[i];
    for (const b of line) {
      const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
      if (d < bd) [bd, best] = [d, ROAD_PATH.cum[i]];
    }
  }
  return best;
})();
export const JAHRA_S = nearestS(ROAD_PATH, PLACES.jahra as P2);
/** the debt stack stands on the road at Kuwait City (2 km short of the road's end) */
export const STACK_S = ROAD_PATH.len - 2;
export const STACK_AT: P2 = pointAt(ROAD_PATH, STACK_S);

/** the road's trunk, offset `lane` world px to the right of travel, resampled every `step` between s0 and s1 */
const trunk = (s0: number, s1: number, lane: number, step = 5): P2[] => {
  const out: P2[] = [];
  const n = Math.max(1, Math.round((s1 - s0) / step));
  for (let i = 0; i <= n; i++) {
    const s = s0 + ((s1 - s0) * i) / n;
    const a = pointAt(ROAD_PATH, s - 1);
    const b = pointAt(ROAD_PATH, s + 1);
    const t: P2 = [b[0] - a[0], b[1] - a[1]];
    const l = Math.hypot(t[0], t[1]) || 1;
    const nr: P2 = [-t[1] / l, t[0] / l];
    const p = pointAt(ROAD_PATH, s);
    out.push([p[0] + nr[0] * lane, p[1] + nr[1] * lane]);
  }
  return out;
};
const fld = (k: keyof typeof FIELDS) => FIELDS[k].centre as P2;
/** a point in a field's own frame: u along its long axis (+ toward the axis bearing), v across, both in rim radii */
export const fieldPt = (k: keyof typeof FIELDS, u: number, v: number): P2 => {
  const fd = FIELDS[k];
  const ax = fd.axis;
  const ac: P2 = [-ax[1], ax[0]];
  return [fd.centre[0] + ax[0] * u * fd.a + ac[0] * v * fd.b, fd.centre[1] + ax[1] * u * fd.a + ac[1] * v * fd.b];
};
/** where a field's 3 tanks park (the first in deepest), in field radii */
const SMALL_STOPS: [number, number][] = [
  [-0.9, 0.15],
  [0.05, -1.02],
  [0.95, 0.2],
];
const add = (a: P2, b: P2): P2 => [a[0] + b[0], a[1] + b[1]];

export type TankDef = { id: number; group: "city" | "west" | "north"; field: keyof typeof FIELDS; path: Path; s0: number; stop: number };
const LANE = 0.95;
const ROW = 4.6;
/** the gap between the column's head (3 rows) and its rear rows (3 rows) */
const REAR_GAP = 11;
/** the lead's arclength on the road at f0: just over the border, the column still streaming out of Safwan */
export const LEAD_S0 = BORDER_S + 8.23;
export const TANKS: TankDef[] = (() => {
  const out: TankDef[] = [];
  const mk = (group: TankDef["group"], field: TankDef["field"], ctrl: P2[], s0: number) => {
    const path = smoothPath(ctrl, 10);
    out.push({ id: out.length, group, field, path, s0, stop: path.len });
  };
  // the head: 3 rows of 2. Row r starts r * ROW behind the lead; the right file (lane +) leads its row by half a row
  // (a staggered column). Through the city (the lead exactly down the road's centre, over the stack), then south.
  const burStops: P2[] = ([[-0.62, 0.12], [-0.4, -0.52], [-0.02, 0.55], [0.1, -0.5], [0.5, 0.42], [0.62, -0.18]] as [number, number][]).map(([u, v]) => fieldPt("burgan", u, v));
  for (let r = 0; r < 3; r++)
    for (let side = 0; side < 2; side++) {
      const i = r * 2 + side;
      const lane = i === 0 ? 0 : side === 0 ? LANE : -LANE;
      const back = r * ROW + (side === 1 ? ROW * 0.5 : 0);
      const sStart = LEAD_S0 - back - 25;
      const ctrl: P2[] = [...trunk(sStart, STACK_S + 3, lane)];
      ctrl.push(add(STACK_AT, [5.5 + side * 0.8 - r * 0.6, 5 + r * 0.7]), add(STACK_AT, [6.5 - r * 1.2 + side * 1.4, 15 + r * 0.6]), burStops[i]);
      mk("city", "burgan", ctrl, 25);
    }
  // the rear rows of the column: rows 3..5; at Jahra south-west to Minagish (side 0) and Umm Gudair (side 1)
  const mng = fld("minagish");
  const umg = fld("ummGudair");
  for (let r = 3; r < 6; r++)
    for (let side = 0; side < 2; side++) {
      const back = r * ROW + REAR_GAP + (side === 1 ? ROW * 0.5 : 0);
      const lane = side === 0 ? LANE : -LANE;
      const sStart = LEAD_S0 - back - 25;
      const ctrl: P2[] = [...trunk(sStart, JAHRA_S - 6, lane)];
      const p = ctrl[ctrl.length - 1];
      const k = r - 3;
      if (side === 0) ctrl.push(add(p, [-4 - k, 7]), add(mng, [6 - k * 2, -14]), fieldPt("minagish", ...SMALL_STOPS[k]));
      else ctrl.push(add(p, [-1 - k, 8]), add(p, [-1.5 - k, 24]), add(umg, [1 - k, -12]), fieldPt("ummGudair", ...SMALL_STOPS[k]));
      mk("west", side === 0 ? "minagish" : "ummGudair", ctrl, 25);
    }
  // the second wave: 3 rows of 2, far behind (north of Basra at f0); off the road into Raudhatain (side 0) and Sabriya
  const rau = fld("raudhatain");
  const sab = fld("sabriya");
  const WAVE = 130;
  for (let r = 0; r < 3; r++)
    for (let side = 0; side < 2; side++) {
      const back = WAVE + r * ROW + (side === 1 ? ROW * 0.5 : 0);
      const lane = side === 0 ? LANE : -LANE;
      const sStart = LEAD_S0 - back - 25;
      if (side === 0) {
        const ctrl: P2[] = [...trunk(sStart, nearestS(ROAD_PATH, rau) - 9, lane)];
        ctrl.push(fieldPt("raudhatain", ...SMALL_STOPS[r]));
        mk("north", "raudhatain", ctrl, 25);
      } else {
        const ctrl: P2[] = [...trunk(sStart, BORDER_S + 6, lane)];
        const p = ctrl[ctrl.length - 1];
        ctrl.push(add(p, [5, 4]), add(sab, [-3 - r, -6 + r]), fieldPt("sabriya", ...SMALL_STOPS[r]));
        mk("north", "sabriya", ctrl, 25);
      }
    }
  return out;
})();

export type TankState = { at: P2; heading: number; s: number; speed: number; arrive: number; idle: number };
/** frame the tank reaches its stop */
export const arriveFrame = (t: TankDef) => {
  const lin = t.stop - DEC - t.s0;
  return lin / V + (2 * DEC) / V;
};
/** a tank's state at a frame: constant V, then a uniform brake over the last DEC to its stop */
export const tankAt = (t: TankDef, frame: number): TankState => {
  const fDec = (t.stop - DEC - t.s0) / V;
  const fArr = fDec + (2 * DEC) / V;
  let s: number;
  let speed: number;
  if (frame <= fDec) {
    s = t.s0 + V * frame;
    speed = V;
  } else if (frame < fArr) {
    const u = (frame - fDec) / (fArr - fDec);
    s = t.stop - DEC * (1 - u) * (1 - u);
    speed = V * (1 - u);
  } else {
    s = t.stop;
    speed = 0;
  }
  const p = pathAt(t.path, Math.min(s, t.stop - 0.01));
  return { at: p.at, heading: p.heading, s, speed, arrive: fArr, idle: Math.max(0, frame - fArr) };
};

/** the stack's arclength on the lead's (tank 0's) own path */
export const LEAD_STACK_S = nearestS(TANKS[0].path, STACK_AT);
/** the frame the lead (tank 0) has driven to arclength s on its path (it is still at constant speed there) */
export const leadFrameAt = (s: number) => (s - TANKS[0].s0) / V;

// ===================================================================================================================
// THE OIL FIELDS: lit 0..1 each. Kuwait's light as their tanks arrive: the field's FIRST tank reaching the field's
// rim starts its light at the field's heart (the glow spreads from where the tanks roll in over LIT_RAMP frames).
// Iraq's fields stay dark in cut 12 (cut 26 lights them: pass its own lit values).
// ===================================================================================================================
export type FieldKey = keyof typeof FIELDS;
export const FIELD_KEYS = Object.keys(FIELDS) as FieldKey[];
export const KUWAIT_FIELDS: FieldKey[] = ["burgan", "minagish", "ummGudair", "raudhatain", "sabriya"];
export const IRAQ_FIELDS: FieldKey[] = ["rumaila", "westQurna", "zubair", "majnoon"];
/** the field's rim radius toward a point (world px) and whether the point is inside */
export const fieldQ = (fd: Field, q: P2) => {
  const d: P2 = [q[0] - fd.centre[0], q[1] - fd.centre[1]];
  const ax = fd.axis;
  const ac: P2 = [-ax[1], ax[0]];
  const u = (d[0] * ax[0] + d[1] * ax[1]) / fd.a;
  const v = (d[0] * ac[0] + d[1] * ac[1]) / fd.b;
  const rho = Math.hypot(u, v);
  const t = Math.atan2(v, u);
  const w = fd.wob;
  const wob = 1 + 0.1 * Math.sin(2 * t + w[0]) + 0.07 * Math.sin(3 * t + w[1]) + 0.045 * Math.sin(5 * t + w[2]) + 0.025 * Math.sin(7 * t + w[3]);
  return rho / wob;
};
/** the frame the first tank of a field rolls in over its rim */
export const FIELD_ENTRY: Partial<Record<FieldKey, number>> = (() => {
  const o: Partial<Record<FieldKey, number>> = {};
  for (const t of TANKS) {
    const fd = FIELDS[t.field];
    for (let f = 0; f < 400; f += 0.25) {
      const st = tankAt(t, f);
      if (fieldQ(fd, st.at) < 1) {
        o[t.field] = Math.min(o[t.field] ?? Infinity, f);
        break;
      }
      if (st.speed === 0) break;
    }
  }
  return o;
})();
export const LIT_RAMP = 26;
/** every field is fully lit by this frame ("fields" lands ~f160): a late entry gets a shorter ramp (never under 16) */
export const LIT_BY = 160;
export const litRampOf = (entry: number) => Math.max(16, Math.min(LIT_RAMP, LIT_BY - entry));
/** cut 12's lit amount of every field at a frame */
export const fieldLitAt = (frame: number): Record<FieldKey, number> => {
  const o = Object.fromEntries(FIELD_KEYS.map((k) => [k, 0])) as Record<FieldKey, number>;
  for (const k of KUWAIT_FIELDS) {
    const e = FIELD_ENTRY[k];
    if (e === undefined) continue;
    const u = c01((frame - e) / litRampOf(e));
    o[k] = 1 - Math.pow(1 - u, 2.2);
  }
  return o;
};
/** the glow's front in the field's own radius units (shader twin): lit 1 covers the whole field */
export const litFront = (lit: number) => lit * 1.42;

/** the derricks: a few per Kuwaiti field (and Iraq's, for cut 26), at fixed spots inside the field, clear of where the tanks park */
export type Derrick = { field: FieldKey; at: P2; q: number; i: number };
export const DERRICKS: Derrick[] = (() => {
  const out: Derrick[] = [];
  const n: Record<FieldKey, number> = { burgan: 5, minagish: 2, ummGudair: 2, raudhatain: 2, sabriya: 2, rumaila: 4, westQurna: 3, zubair: 2, majnoon: 3 };
  const spots: P2[] = [
    [0.3, 0.08],
    [-0.3, -0.1],
    [0.75, 0.3],
    [-0.78, -0.32],
    [0.02, 0.02],
  ];
  for (const k of FIELD_KEYS) {
    const fd = FIELDS[k];
    const ax = fd.axis;
    const ac: P2 = [-ax[1], ax[0]];
    for (let i = 0; i < n[k]; i++) {
      const [u, v] = spots[i];
      const at: P2 = [fd.centre[0] + ax[0] * u * fd.a + ac[0] * v * fd.b, fd.centre[1] + ax[1] * u * fd.a + ac[1] * v * fd.b];
      out.push({ field: k, at, q: fieldQ(fd, at), i: out.length });
    }
  }
  return out;
})();
export const DERRICK_RISE = 16;
/** a derrick's rise 0..1: it starts the frame the field's glow front reaches its spot (lit is the field's lit curve) */
export const derrickRise = (d: Derrick, litOf: (frame: number) => number, frame: number) => {
  // find the frame the front passed d.q (search back from the frame; the lit curves are monotone)
  if (litFront(litOf(frame)) < d.q + 0.05) return 0;
  let f0 = frame;
  while (f0 > -200 && litFront(litOf(f0 - 0.5)) >= d.q + 0.05) f0 -= 0.5;
  const u = c01((frame - f0) / DERRICK_RISE);
  return 1 - Math.pow(1 - u, 3);
};

// ===================================================================================================================
// CUT 12'S CAMERA (InvadedKuwaitForOil): the follow down the road, the ease at the city, the rise over Kuwait
// ===================================================================================================================
export const CUT12_DURATION = 174;
export const CUT12_END_FRAME = 173;
export const CUT12_KEYS: CamKey3[] = [
  // the follow (rev 2: everything 6.5 f later than rev 1, the column starts 7.3 km further back)
  { f: 0, tx: -25.3, tz: -68.1, D: 54, pitch: 45, yaw: 182 },
  { f: 31.5, tx: -28.1, tz: -40.5, D: 54, pitch: 45, yaw: 182 },
  { f: 56.5, tx: -30.1, tz: -18, D: 55, pitch: 45, yaw: 181 },
  { f: 76.5, tx: -18, tz: 3.5, D: 56, pitch: 45, yaw: 180 },
  { f: 94.5, tx: -3, tz: 0, D: 56, pitch: 45, yaw: 181 },
  { f: 106.5, tx: -1.5, tz: 1, D: 60, pitch: 45, yaw: 184 },
  // the rise (rev 2): back and up over the route, a small orbit to yaw 176 (looking a touch east of south, Iraq at
  // the bottom), all five Kuwaiti fields in a tall middle band y ~320-1080, thin haze at the top
  { f: 120, tx: -9, tz: -6, D: 76, pitch: 48, yaw: 181 },
  { f: 152, tx: -11.7, tz: -47.2, D: 122.5, pitch: 54, yaw: 176.4 },
  { f: 174, tx: -12, tz: -48.5, D: 125, pitch: 54, yaw: 176 },
];
export const cut12Track = makeTrack(CUT12_KEYS, CUT12_DURATION);
export const CUT12_REST: Cam = cut12Track.camAt(0);
export const CUT12_END_CAM: Cam = cut12Track.camAt(CUT12_END_FRAME);
/** cut 12's tank size (km, their length): 3 in the follow, growing 1 -> 1.4x as the camera rises (a map symbol that
 *  holds its read in the wide); 4.2 from f158 on, so cut 26 picks the tanks up at CUT12_END_TANK_SCALE */
export const tankScaleAt = (frame: number) => TANK_L * (1 + 0.4 * sstep(108, 158, frame));
export const CUT12_END_TANK_SCALE = tankScaleAt(CUT12_END_FRAME);

