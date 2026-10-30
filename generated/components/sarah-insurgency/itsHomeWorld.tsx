// ---------------------------------------------------------------------------
// itsHomeWorld: the drawn pieces of cut 91 ItsHome (sarah-insurgency) that the clip kit does not have, built in the
// kit's manner and through its one projection (so they stay locked to the WebGL map). Reusable by cut 96.
//   RisingColumn   the kit's (classical) ValueColumn RISING out of the map (the kit's ValueColumn has no rise of its
//                  own): the Pawn's tear pattern (insurgencyPieces riseState) carried to the column: a torn opening in
//                  the map (pale lip, dark inside, the far earth wall, a few dust specks) opens a frame before the
//                  square abacus breaks the surface, is always 1.12 x the widest part already up (square parts by their
//                  half-diagonal), and closes round the square plinth at the end; the kit column is drawn lowered
//                  (ValueColumn sink) and clipped to the ground above the opening. At rise 1 it is the plain kit piece.
//   ChimneySmoke   a thin plume of soft ash-cream puffs from the Farmhouse chimney, bending with a light wind
//   FarmFields     ploughed field parcels lying on the map round the house (thin cream hedges, furrow hatch: an
//                  old estate map's fields), fogged by their own distance
//   River          a river on the map: a petrol channel with cream engraved banks (the map's sea inks)
// ---------------------------------------------------------------------------
import React from "react";
import { Easing } from "remotion";
import { GroundLine, INK, ValueColumn, dirOfYaw, groundAt, toScreen, valueColumnWidestAbove, type InsWorld, type P2, type V3 } from "./insurgencyShared";

const c01 = (v: number) => Math.max(0, Math.min(1, v));
const sstep = (a: number, b: number, x: number) => {
  const t = c01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const f2 = (v: number) => v.toFixed(2);
const hashN = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
/** outline width that thins a little with distance (the kit's lwAt) */
const lwAt = (A: InsWorld, dist: number, base = 1.15) => Math.max(0.5, Math.min(2.4, base * Math.sqrt(A.D / Math.max(1e-6, dist))));

// ===================================================================================================================
// THE COLUMN'S RISE
// ===================================================================================================================
/** the rise's ease: the abacus eases out of the tear, the column travels, then settles long (a weight pushed up) */
const RISE_EASE = Easing.bezier(0.25, 0.25, 0.35, 1);
const DEPTH0 = 0.5;
/** the column's rise schedule from the 0..1 drive (riseState's pattern): the tear starts at 0 and is open (1.12 x the
 *  abacus' half-diagonal: the square top clears it) by 0.045; the abacus breaks the surface ~1 f later (it starts
 *  DEPTH0 x r below); the column comes up over 0.045..0.84, the tear always 1.12 x the widest part already up
 *  (valueColumnWidestAbove: square parts by their half-diagonal), so it widens for the plinth as it lands; then it
 *  closes round the plinth over 0.84..1. Units: world (h = full height). */
export const columnRiseState = (u: number, r: number, h: number) => {
  const v = c01(u);
  const t = c01((v - 0.045) / 0.795);
  const up = RISE_EASE(t);
  const sink = v >= 0.84 ? 0 : (h + DEPTH0 * r) * (1 - up) + 0.002;
  const widest = valueColumnWidestAbove(r, h, sink);
  const close = sstep(0.84, 1, v);
  const abacusDiag = valueColumnWidestAbove(r, h, h - 1e-3);
  const tear = Math.max(widest, abacusDiag * sstep(0, 0.045, v));
  const holeR = 1.12 * tear * sstep(0, 0.03, v) * (1 - close);
  return { hole: holeR / (1.12 * abacusDiag), holeR, sink, up, dust: sstep(0.02, 0.12, v) * (1 - sstep(0.8, 1, v)) };
};

export type RisingColumnProps = { A: InsWorld; x: number; z: number; r: number; height: number; rise: number; uid: string; seed?: number; face?: number };
/** the kit's ValueColumn rising out of the map (rise 0..1; at 1 it is the plain kit ValueColumn) */
export const RisingColumn: React.FC<RisingColumnProps> = ({ A, x, z, r, height, rise, uid, seed = 5, face }) => {
  if (rise >= 1) return <ValueColumn A={A} x={x} z={z} r={r} height={height} color="orange" uid={uid} face={face} />;
  if (rise <= 0) return null;
  const st = columnRiseState(rise, r, height);
  const dist = A.dist(x, 0, z);
  const fz = A.hazeAt(dist);
  const lw = lwAt(A, dist);
  // THE TEAR (the Pawn's): a torn opening in the map, a pale paper lip lifting round it, dark inside, the far wall's
  // earth catching a little light, dust specks thrown out as it opens
  let hole: React.ReactNode = null;
  let clip: string | null = null;
  const g = toScreen(A.cam, x, 0, z);
  if (st.holeR > 0.004) {
    const n = 32;
    const fh = dirOfYaw(A.cam.yaw);
    const rv = A.cam.r;
    const jagR = (i: number) => 1 + 0.08 * (hashN(seed * 31 + i) - 0.5) + 0.04 * Math.sin(((i / n) * Math.PI * 2) * 5 + seed);
    const ptAt = (i: number, rr: number) => {
      const a = (i / n) * Math.PI * 2;
      return toScreen(A.cam, x + (rv[0] * Math.cos(a) + fh[0] * Math.sin(a)) * rr, 0, z + (rv[2] * Math.cos(a) + fh[2] * Math.sin(a)) * rr);
    };
    const pts = Array.from({ length: n }, (_, i) => ptAt(i, st.holeR * jagR(i)));
    const hd = `M${pts.map((p) => `${f2(p.x)},${f2(p.y)}`).join("L")}Z`;
    const area = (q: { x: number; y: number }[]) => q.reduce((s, p, i) => s + p.x * q[(i + 1) % q.length].y - q[(i + 1) % q.length].x * p.y, 0);
    const rect = [
      { x: -50, y: -50 },
      { x: 1130, y: -50 },
      { x: 1130, y: g.y },
      { x: -50, y: g.y },
    ];
    const hpts = Math.sign(area(pts)) === Math.sign(area(rect)) ? pts : pts.slice().reverse();
    if (st.sink > 0.001) clip = `M${rect.map((p) => `${f2(p.x)},${f2(p.y)}`).join("L")}ZM${hpts.map((p) => `${f2(p.x)},${f2(p.y)}`).join("L")}Z`;
    const inner = A.tone("#140E09", dist);
    const wall = A.tone("#4A3A2A", dist);
    const back = pts.filter((_, i) => i >= n / 2 || i === 0);
    const wallD = `M${back.map((p) => `${f2(p.x)},${f2(p.y)}`).join("L")}Z`;
    const lipA = (1 - fz) * Math.min(1, st.hole);
    const outer = pts.map((_, i) => ptAt(i, st.holeR * jagR(i) * (1.1 + 0.16 * hashN(seed * 53 + i))));
    const lipD = `M${outer.map((p) => `${f2(p.x)},${f2(p.y)}`).join("L")}ZM${pts
      .slice()
      .reverse()
      .map((p) => `${f2(p.x)},${f2(p.y)}`)
      .join("L")}Z`;
    const specks: React.ReactNode[] = [];
    for (let i = 0; i < 11; i++) {
      const a = hashN(seed * 7 + i) * Math.PI * 2;
      const rr = st.holeR * (1.2 + 0.7 * hashN(seed * 13 + i) * (0.3 + 0.7 * st.dust));
      const p = toScreen(A.cam, x + (rv[0] * Math.cos(a) + fh[0] * Math.sin(a)) * rr, 0, z + (rv[2] * Math.cos(a) + fh[2] * Math.sin(a)) * rr);
      const rad = Math.max(0.6, r * (0.05 + 0.06 * hashN(seed * 17 + i)) * p.s);
      specks.push(<circle key={i} cx={f2(p.x)} cy={f2(p.y)} r={f2(rad)} fill={A.tone(i % 2 === 0 ? "#CDBF9F" : "#2E2318", dist)} opacity={0.6 * st.dust} />);
    }
    hole = (
      <g key="hole">
        <path d={lipD} fill={A.tone("#CDBB94", dist)} fillOpacity={0.75 * lipA} fillRule="evenodd" />
        <path d={hd} fill={inner} />
        <path d={wallD} fill={wall} opacity={0.6} />
        <path d={hd} fill="none" stroke={A.tone("#1E150D", dist)} strokeWidth={f2(lw * 0.9)} strokeOpacity={0.8 * lipA} strokeLinejoin="round" />
        {specks}
      </g>
    );
  } else if (st.sink > 0.001) {
    clip = `M-50,-50H1130V${f2(g.y)}H-50Z`;
  }
  // the contact shadow and foot line come in as the plinth lands (the kit column's own, at full strength at 1)
  const shadow = st.sink <= 0.001 ? sstep(0.84, 1, rise) : 0;
  const cid = `${uid}-clip`;
  return (
    <g>
      {clip ? (
        <defs>
          <clipPath id={cid}>
            <path d={clip} />
          </clipPath>
        </defs>
      ) : null}
      {hole}
      <g clipPath={clip ? `url(#${cid})` : undefined}>
        <ValueColumn A={A} x={x} z={z} r={r} height={height} color="orange" uid={uid} face={face} sink={st.sink} shadow={shadow} />
      </g>
    </g>
  );
};

// ===================================================================================================================
// CHIMNEY SMOKE
// ===================================================================================================================
/** the Farmhouse's chimney top (world) for its x, z, size and face (the kit's Farmhouse geometry) */
export const chimneyTop = (x: number, z: number, size: number, face: number): V3 => {
  const nf = dirOfYaw(face);
  const rb: V3 = [nf[2], 0, -nf[0]]; // cross(UP, nf), unit
  const lx = 0.3 * size;
  return [x + rb[0] * lx, 0.82 * size, z + rb[2] * lx];
};
/** a thin plume of soft puffs, one every `every` frames from frame `start`, each rising and widening, bent by a
 *  light wind toward `windYaw`; fogged by distance. Ash cream, never orange. */
export const ChimneySmoke: React.FC<{ A: InsWorld; frame: number; at: V3; start: number; windYaw: number; scale: number; uid: string; every?: number; life?: number }> = ({
  A,
  frame,
  at,
  start,
  windYaw,
  scale,
  uid,
  every = 1.5,
  life = 46,
}) => {
  if (frame < start) return null;
  const wd = dirOfYaw(windYaw);
  const dist = A.dist(at[0], at[1], at[2]);
  const col = A.tone("#E2D9C6", dist);
  const puffs: React.ReactNode[] = [];
  const n0 = Math.max(0, Math.floor((frame - start - life) / every));
  const n1 = Math.floor((frame - start) / every);
  for (let k = n0; k <= n1; k++) {
    const born = start + k * every;
    const a = frame - born;
    if (a < 0 || a > life) continue;
    const s = scale; // world units per "chimney unit" (the chimney is ~0.18 size wide)
    // born inside the chimney's mouth (just under its top), slow at first, then lifting
    const rise = s * (-0.25 + 0.18 * a + 0.0135 * a * a - 0.00018 * a * a * a);
    const drift = s * (0.012 * a + 0.0065 * a * a);
    const wob = s * 0.35 * Math.sin(a * 0.21 + k * 0.9) * sstep(0, 10, a);
    const px = at[0] + wd[0] * drift + A.cam.r[0] * wob;
    const pz = at[2] + wd[2] * drift + A.cam.r[2] * wob;
    const py = at[1] + rise;
    const p = toScreen(A.cam, px, py, pz);
    if (p.z <= 1) continue;
    const rad = s * (0.34 + 0.08 * a) * p.s;
    const op = 0.32 * sstep(0, 1.5, a) * (1 - sstep(life * 0.35, life, a));
    if (op < 0.004) continue;
    puffs.push(<circle key={k} cx={f2(p.x)} cy={f2(p.y)} r={f2(rad)} fill={`url(#${uid}-pf)`} opacity={f2(op)} />);
  }
  return (
    <g>
      <defs>
        <radialGradient id={`${uid}-pf`}>
          <stop offset="0" stopColor={col} stopOpacity={1} />
          <stop offset="0.5" stopColor={col} stopOpacity={0.6} />
          <stop offset="1" stopColor={col} stopOpacity={0} />
        </radialGradient>
      </defs>
      {puffs}
    </g>
  );
};

// ===================================================================================================================
// FIELDS AND THE RIVER (lying on the map)
// ===================================================================================================================
/** a field parcel: four ground corners (in order) and the furrows' spacing (world units), parallel to edge 0-1 */
export type Field = { q: [P2, P2, P2, P2]; furrow: number };
const lerp2 = (a: P2, b: P2, t: number): P2 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
/** ground geometry is clipped at a near eye depth before projecting: a point near / behind the lens projects to huge
 *  coordinates, and a huge SVG path breaks the stage's multiply blend (the paper mottle composites as a beige veil
 *  over the whole frame; seen at f0-10 before this clip). The near depth is 0.7 x the depth where the frame's bottom
 *  row meets the ground, so the clipped part is always below the frame and coordinates stay bounded. */
const nearZ = (A: InsWorld) => {
  const g = groundAt(A.cam, 540, 1920);
  return g ? 0.7 * toScreen(A.cam, g[0], 0, g[1]).z : 30;
};
const depthOf = (A: InsWorld, p: P2) => toScreen(A.cam, p[0], 0, p[1]).z;
const seg = (A: InsWorld, a0: P2, b0: P2) => {
  const NEAR_Z = nearZ(A);
  let a = a0;
  let b = b0;
  const da = depthOf(A, a);
  const db = depthOf(A, b);
  if (da < NEAR_Z && db < NEAR_Z) return "";
  if (da < NEAR_Z) a = lerp2(a, b, (NEAR_Z - da) / (db - da));
  if (db < NEAR_Z) b = lerp2(b, a, (NEAR_Z - db) / (da - db));
  const p = toScreen(A.cam, a[0], 0, a[1]);
  const q = toScreen(A.cam, b[0], 0, b[1]);
  return `M${f2(p.x)},${f2(p.y)}L${f2(q.x)},${f2(q.y)}`;
};
/** a ground polygon clipped to the near depth (Sutherland-Hodgman against one plane), projected; "" if nothing is left */
const polyNear = (A: InsWorld, pts: P2[]) => {
  const NEAR_Z = nearZ(A);
  const out: P2[] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const da = depthOf(A, a);
    const db = depthOf(A, b);
    if (da >= NEAR_Z) out.push(a);
    if (da >= NEAR_Z !== db >= NEAR_Z) out.push(lerp2(a, b, (NEAR_Z - da) / (db - da)));
  }
  if (out.length < 3) return "";
  return `M${out.map((p) => toScreen(A.cam, p[0], 0, p[1])).map((q) => `${f2(q.x)},${f2(q.y)}`).join("L")}Z`;
};
/** ploughed parcels on the map: cream hedge outlines and furrow hatch, low strength (an estate map's fields) */
export const FarmFields: React.FC<{ A: InsWorld; fields: Field[]; amount?: number }> = ({ A, fields, amount = 1 }) => (
  <g>
    {fields.map((fd, i) => {
      const [a, b, c, d] = fd.q;
      const m: P2 = [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2];
      const dist = A.dist(m[0], 0, m[1]);
      const s = toScreen(A.cam, m[0], 0, m[1]).s;
      const fz = A.hazeAt(dist);
      const ink = A.tone(INK.creamDim, dist);
      const len = Math.hypot(d[0] - a[0], d[1] - a[1]);
      const nF = Math.max(2, Math.round(len / fd.furrow));
      let furrows = "";
      for (let k = 1; k < nF; k++) furrows += seg(A, lerp2(a, d, k / nF), lerp2(b, c, k / nF));
      const hedge = seg(A, a, b) + seg(A, b, c) + seg(A, c, d) + seg(A, d, a);
      const fill = polyNear(A, [a, b, c, d]);
      return (
        <g key={i}>
          {fill ? <path d={fill} fill={ink} fillOpacity={0.045 * amount * (1 - 0.6 * fz)} /> : null}
          <path d={furrows} stroke={ink} strokeWidth={f2(Math.min(1.4, Math.max(0.5, 0.12 * s)))} strokeOpacity={0.13 * amount * (1 - 0.6 * fz)} fill="none" strokeLinecap="round" />
          <path d={hedge} stroke={ink} strokeWidth={f2(Math.min(2.2, Math.max(0.6, 0.26 * s)))} strokeOpacity={0.27 * amount * (1 - 0.6 * fz)} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      );
    })}
  </g>
);
/** a river lying on the map: cream engraved banks round a petrol channel (w world units) */
export const River: React.FC<{ A: InsWorld; pts: P2[]; w: number }> = ({ A, pts, w }) => (
  <g>
    <GroundLine A={A} pts={pts} w={w * 1.36} color={INK.creamDim} opacity={0.85} />
    <GroundLine A={A} pts={pts} w={w} color="#1E292D" />
  </g>
);
