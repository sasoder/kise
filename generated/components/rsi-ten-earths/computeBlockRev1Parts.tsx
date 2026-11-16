// ---------------------------------------------------------------------------
// computeBlockRev1Parts — the drawing of the shared world of cuts 6 + 7, revision 1 (rsi-ten-earths). Both cuts draw
// the same <BlockWorld> from a state they compute per frame, so cut 7's f0 is cut 6's last frame pixel for pixel.
// Layout, camera and air: computeBlockRev1.ts. Read-only modules: tenEarthsHall (RackField, Desk), tenEarthsBot (Bot).
//
// <BlockWorld A cam st uid />   floor, horizon haze, the cable (floor run), the year paint, then rows back to front:
//   each row's lit-rack halo, its racks (RackField with their power and wave), the dark racks' veil, the "freed"
//   sheen, the lit wash, then the row's stations (an entry glow, desks, then the robots), the hero riser after the hero
//   station.
// WorldState: { wf (the world frame: ambient twinkle, typing, sway), power: id -> {power, relight},
//   stations: StationState[] (only the stations that exist), litS (the cable's lit length from the desk top: riser +
//   floor), pulse (0..1 the data pulses' strength), year: { from, to, t } (the stencil's crossfade), sheen?: id -> 0..1 }
// StationState: { id, appear 0..1 (the station, chair + desk + robot, fading up with a small squash on its floor
//   point), glow 0..1 (a soft cream light at its rack while it arrives), boot 0..1 (BOT_POSES.bootUp's t over the typing
//   pose), poseFrame (the typing clock), seed, variant }.
// ---------------------------------------------------------------------------
import React from "react";
import { AIR, AirFloor, AirHorizonHazeW, c01, mixHex, type AirWorld, type Cam, type P2 } from "../kits/dwarkesh-3d/dwarkesh3d";
import { Bot, BotLayer, BOT_POSES } from "./tenEarthsBot";
import { CREAM, Desk, PLATE_FONT, RACK, RackField, type RackSpec } from "./tenEarthsHall";
import { CABLE_PATH, CABLE_R, CABLE_RISER, FLOOR, HERO_ID, RACKS, RISER_LEN, ROWS, YEAR_PAINT, cableAt, cableLen, stationOf } from "./computeBlockRev1";

const PAL = AIR.A;
const f2 = (v: number) => (Math.round(v * 100) / 100).toString();
const Pt = (v: P2) => `${f2(v[0])},${f2(v[1])}`;
const poly = (q: P2[]) => `M${q.map(Pt).join("L")}Z`;
const ss = (v: number) => {
  const u = c01(v);
  return u * u * (3 - 2 * u);
};

export type StationState = { id: number; appear: number; glow: number; boot: number; poseFrame: number; seed: number; variant: number };
export type WorldState = {
  wf: number;
  power: Map<number, { power: number; relight: boolean }>;
  stations: StationState[];
  litS: number;
  pulse: number;
  year: { from: string; to: string; t: number };
  sheen?: Map<number, number>;
};

// ---- the lit racks' glow: a soft cream halo in the air around a lit rack, and a faint wash over its lit part --------
const RackHalo: React.FC<{ A: AirWorld; racks: RackSpec[]; uid: string }> = ({ A, racks, uid }) => {
  const lit = racks.filter((rk) => (rk.power ?? 1) > 0.002);
  if (!lit.length) return null;
  const P = A.P;
  const Z = racks[0].Z;
  const r = P.r(Z);
  const fz = A.fog(Z);
  return (
    <g>
      <defs>
        <radialGradient id={`${uid}-halo`}>
          <stop offset="0" stopColor={CREAM} stopOpacity={0.8} />
          <stop offset="0.45" stopColor={CREAM} stopOpacity={0.34} />
          <stop offset="1" stopColor={CREAM} stopOpacity={0} />
        </radialGradient>
      </defs>
      {lit.map((rk) => {
        const pw = rk.power ?? 1;
        const c = P.p(rk.X, -RACK.h * 0.55, Z + RACK.d * 0.4);
        return <ellipse key={rk.id} cx={f2(c[0])} cy={f2(c[1])} rx={f2(RACK.w * 2.0 * r)} ry={f2(RACK.h * 0.95 * r)} fill={`url(#${uid}-halo)`} opacity={pw * (1 - 0.45 * fz)} />;
      })}
    </g>
  );
};
/** a lit rack's light: a cream wash over its lit part, stronger the smaller it is on screen, and at small sizes two
 *  columns of status light (its real lights take over when it is big enough to show them); both follow the wave */
const RackWash: React.FC<{ A: AirWorld; racks: RackSpec[] }> = ({ A, racks }) => {
  if (!racks.length) return null;
  const P = A.P;
  const Z = racks[0].Z;
  const r = P.r(Z);
  const hp = RACK.h * r * A.k;
  const fz = A.fog(Z);
  const washA = (0.2 + 0.3 * (1 - c01((hp - 40) / 220))) * (1 - fz);
  const colA = 0.85 * (1 - c01((hp - 70) / 110)) * (1 - 0.5 * fz);
  const colW = Math.max(1.3 / A.k, RACK.w * 0.07 * r);
  let d = "";
  let cols = "";
  for (const rk of racks) {
    const pw = rk.power ?? 1;
    if (pw <= 0.002) continue;
    // the lit part: the bottom `pw` going dark, the top `pw` lighting up (as the hall's wave)
    const y0 = rk.relight ? -RACK.h : -RACK.h * pw;
    const y1 = rk.relight ? -RACK.h * (1 - pw) : 0;
    const a = P.p(rk.X - RACK.w / 2, y0, rk.Z);
    const b = P.p(rk.X + RACK.w / 2, y1, rk.Z);
    d += `M${f2(a[0])},${f2(a[1])}H${f2(b[0])}V${f2(b[1])}H${f2(a[0])}Z`;
    if (colA > 0.01) {
      const ya = Math.max(a[1], P.p(0, -RACK.h * 0.92, rk.Z)[1]);
      const yb = Math.min(b[1], P.p(0, -RACK.h * 0.08, rk.Z)[1]);
      if (yb > ya)
        for (const fx of [-0.27, 0.27]) {
          const x = P.p(rk.X + fx * RACK.w, 0, rk.Z)[0];
          cols += `M${f2(x - colW / 2)},${f2(ya)}H${f2(x + colW / 2)}V${f2(yb)}H${f2(x - colW / 2)}Z`;
        }
    }
  }
  if (!d) return null;
  return (
    <g>
      <path d={d} fill={CREAM} fillOpacity={washA} />
      {cols ? <path d={cols} fill={CREAM} fillOpacity={colA} /> : null}
    </g>
  );
};
/** a soft pool of the lit rack's light on the floor in front of it (drawn before the row's racks) */
const RackPools: React.FC<{ A: AirWorld; racks: RackSpec[]; uid: string }> = ({ A, racks, uid }) => {
  const lit = racks.filter((rk) => (rk.power ?? 1) > 0.002);
  if (!lit.length) return null;
  const P = A.P;
  const Z = racks[0].Z;
  const fz = A.fog(Z);
  return (
    <g>
      <defs>
        <radialGradient id={`${uid}-pool`}>
          <stop offset="0" stopColor={CREAM} stopOpacity={0.42} />
          <stop offset="0.55" stopColor={CREAM} stopOpacity={0.14} />
          <stop offset="1" stopColor={CREAM} stopOpacity={0} />
        </radialGradient>
      </defs>
      {lit.map((rk) => {
        const pw = rk.relight ? (rk.power ?? 1) : c01(((rk.power ?? 1) - 0.0) * 1.0);
        const c = P.p(rk.X, 0, Z - 70);
        const n = P.p(rk.X, 0, Z - 190);
        const f = P.p(rk.X, 0, Z + 30);
        const rx = RACK.w * 1.5 * P.r(Z - 70);
        const ry = Math.max(1, Math.abs(n[1] - f[1]) / 2);
        return <ellipse key={rk.id} cx={f2(c[0])} cy={f2(c[1])} rx={f2(rx)} ry={f2(ry)} fill={`url(#${uid}-pool)`} opacity={pw * (1 - 0.5 * fz)} />;
      })}
    </g>
  );
};
/** the freed racks' sheen (cut 7): a soft cream light over a dark rack's front and top, 0..1 */
const RackSheen: React.FC<{ A: AirWorld; racks: RackSpec[]; sheen?: Map<number, number> }> = ({ A, racks, sheen }) => {
  if (!sheen) return null;
  const P = A.P;
  const els: React.ReactNode[] = [];
  for (const rk of racks) {
    const s = sheen.get(rk.id ?? -1) ?? 0;
    if (s <= 0.003) continue;
    const fz = A.fog(rk.Z);
    const fr = poly([P.p(rk.X - RACK.w / 2, -RACK.h, rk.Z), P.p(rk.X + RACK.w / 2, -RACK.h, rk.Z), P.p(rk.X + RACK.w / 2, 0, rk.Z), P.p(rk.X - RACK.w / 2, 0, rk.Z)]);
    const tp = poly([P.p(rk.X - RACK.w / 2, -RACK.h, rk.Z), P.p(rk.X + RACK.w / 2, -RACK.h, rk.Z), P.p(rk.X + RACK.w / 2, -RACK.h, rk.Z + RACK.d), P.p(rk.X - RACK.w / 2, -RACK.h, rk.Z + RACK.d)]);
    const a = s * (1 - 0.4 * fz);
    els.push(
      <g key={rk.id}>
        <path d={fr} fill={CREAM} fillOpacity={0.3 * a} />
        <path d={tp} fill={CREAM} fillOpacity={0.6 * a} />
        <path d={fr} fill="none" stroke={CREAM} strokeOpacity={0.9 * a} strokeWidth={A.lw(2.2)} strokeLinejoin="round" />
        <path d={tp} fill="none" stroke={CREAM} strokeOpacity={0.9 * a} strokeWidth={A.lw(2.2)} strokeLinejoin="round" />
      </g>,
    );
  }
  return els.length ? <g style={{ mixBlendMode: "screen" }}>{els}</g> : null;
};
/** a dark rack's lights-off veil: its visible faces darkened toward a fogged slate by (1 - power), so "dark = freed"
 *  reads at small size and the far dark racks melt into the air (drawn over the RackField, under the sheen) */
const RackVeil: React.FC<{ A: AirWorld; racks: RackSpec[]; ex: number }> = ({ A, racks, ex }) => {
  const P = A.P;
  const els: React.ReactNode[] = [];
  for (const rk of racks) {
    const dk = 1 - (rk.power ?? 1);
    if (dk <= 0.003) continue;
    const x0 = rk.X - RACK.w / 2;
    const x1 = rk.X + RACK.w / 2;
    const z0 = rk.Z;
    const z1 = rk.Z + RACK.d;
    // the hull of the faces seen: front, top, and the side toward the eye
    const xs = ex < x0 ? x0 : x1;
    const q: P2[] =
      ex >= x0 && ex <= x1
        ? [P.p(x0, 0, z0), P.p(x0, -RACK.h, z0), P.p(x0, -RACK.h, z1), P.p(x1, -RACK.h, z1), P.p(x1, -RACK.h, z0), P.p(x1, 0, z0)]
        : xs === x0
          ? [P.p(x1, 0, z0), P.p(x0, 0, z0), P.p(x0, 0, z1), P.p(x0, -RACK.h, z1), P.p(x1, -RACK.h, z1), P.p(x1, -RACK.h, z0)]
          : [P.p(x0, 0, z0), P.p(x1, 0, z0), P.p(x1, 0, z1), P.p(x1, -RACK.h, z1), P.p(x0, -RACK.h, z1), P.p(x0, -RACK.h, z0)];
    els.push(<path key={rk.id} d={poly(q)} fill={A.tone("#1A2224", z0 + RACK.d / 2, RACK.h / 2)} fillOpacity={0.42 * dk} />);
  }
  return els.length ? <g>{els}</g> : null;
};

// ---- the cable -------------------------------------------------------------------------------------------------------
/** a strip in the floor plane (height Y) along the cable's floor run from s0 to s1, half width w */
const floorStrip = (A: AirWorld, s0: number, s1: number, w: number, Y: number) => {
  const a = Math.max(0, s0);
  const b = Math.min(cableLen, s1);
  if (b - a < 0.5) return "";
  // sample at the path's own vertices inside [a, b] plus the ends
  const ss2: number[] = [a];
  let acc = 0;
  for (let i = 1; i < CABLE_PATH.length; i++) {
    acc += Math.hypot(CABLE_PATH[i][0] - CABLE_PATH[i - 1][0], CABLE_PATH[i][1] - CABLE_PATH[i - 1][1]);
    if (acc > a && acc < b) ss2.push(acc);
  }
  ss2.push(b);
  // long straight runs: subdivide (perspective is not linear in Z)
  const pts: number[] = [];
  for (let i = 0; i < ss2.length - 1; i++) {
    const n = Math.max(1, Math.ceil((ss2[i + 1] - ss2[i]) / 220));
    for (let j = 0; j < n; j++) pts.push(ss2[i] + ((ss2[i + 1] - ss2[i]) * j) / n);
  }
  pts.push(b);
  const L: string[] = [];
  const R: string[] = [];
  pts.forEach((s) => {
    const p = cableAt(s);
    const q = cableAt(Math.min(cableLen, s + 2));
    const o = cableAt(Math.max(0, s - 2));
    const dx = q[0] - o[0];
    const dz = q[1] - o[1];
    const len = Math.hypot(dx, dz) || 1;
    const nx = (-dz / len) * w;
    const nz = (dx / len) * w;
    L.push(Pt(A.P.p(p[0] + nx, Y, p[1] + nz)));
    R.push(Pt(A.P.p(p[0] - nx, Y, p[1] - nz)));
  });
  return `M${L.join("L")}L${R.reverse().join("L")}Z`;
};
const CABLE_MAT = { lit: "#5D6669", mid: "#3E4649", dark: "#23292B" };
const PULSE_GAP = 300;
const PULSE_LEN = 46;
const PULSE_SPEED = 26;
/** the floor run: the dark tube, its lit core from the riser's foot to litS - RISER_LEN, data pulses running toward
 *  the desk */
export const CableFloor: React.FC<{ A: AirWorld; litS: number; pulse: number; wf: number }> = ({ A, litS, pulse, wf }) => {
  const zm = 1200;
  const body = floorStrip(A, 0, cableLen, CABLE_R, -CABLE_R * 0.5);
  const top = floorStrip(A, 0, cableLen, CABLE_R * 0.32, -CABLE_R);
  const sh = floorStrip(A, 0, cableLen, CABLE_R * 1.9, 0);
  const fl = Math.max(0, litS - RISER_LEN);
  const glow = fl > 0.5 ? floorStrip(A, 0, fl, CABLE_R * 3.2, -CABLE_R * 0.6) : "";
  const core = fl > 0.5 ? floorStrip(A, 0, fl, CABLE_R * 0.42, -CABLE_R) : "";
  let pulses = "";
  if (pulse > 0.01 && fl > 1) {
    const ph = (((wf * PULSE_SPEED) % PULSE_GAP) + PULSE_GAP) % PULSE_GAP;
    for (let s = PULSE_GAP - ph; s < fl + PULSE_GAP; s += PULSE_GAP) {
      // runs toward the desk (decreasing s): the pulse's head at s - ..., it fades out past the lit end
      const a = s - PULSE_LEN;
      const b = Math.min(fl, s);
      if (b - a > 1 && a < fl) pulses += floorStrip(A, Math.max(0, a), b, CABLE_R * 0.75, -CABLE_R);
    }
  }
  return (
    <g>
      <path d={sh} fill={PAL.shadow} fillOpacity={0.3} />
      <path d={body} fill={A.tone(CABLE_MAT.mid, zm, 5)} />
      <path d={top} fill={A.tone(CABLE_MAT.lit, zm, 9)} fillOpacity={0.8} />
      {glow ? <path d={glow} fill={CREAM} fillOpacity={0.12} /> : null}
      {core ? <path d={core} fill={CREAM} fillOpacity={0.85} /> : null}
      {pulses ? <path d={pulses} fill={CREAM} fillOpacity={0.95 * pulse} /> : null}
    </g>
  );
};
/** the riser up the hero desk's far right leg (drawn after the hero station) */
export const CableRiser: React.FC<{ A: AirWorld; litS: number; pulse: number; wf: number }> = ({ A, litS, pulse, wf }) => {
  const P = A.P;
  const { X, Z, Y0, Y1 } = CABLE_RISER;
  const R = CABLE_R;
  const quad = (w: number, ya: number, yb: number) => poly([P.p(X - w, ya, Z), P.p(X + w, ya, Z), P.p(X + w, yb, Z), P.p(X - w, yb, Z)]);
  const lit = c01(litS / RISER_LEN);
  const els: React.ReactNode[] = [
    <path key="b" d={quad(R, Y1, Y0 - R)} fill={A.tone(CABLE_MAT.mid, Z, 70)} />,
    <path key="l" d={quad(R * 0.35, Y1, Y0 - R)} transform={`translate(${f2(-R * 0.45 * P.r(Z))} 0)`} fill={A.tone(CABLE_MAT.lit, Z, 70)} fillOpacity={0.7} />,
    // the bend onto the floor: a quarter round toward +X
    <path key="bend" d={`M${Pt(P.p(X - R, Y0 - R, Z))}Q${Pt(P.p(X - R, Y0, Z))} ${Pt(P.p(X + R, Y0, Z))}L${Pt(P.p(X + R, Y0 - R, Z))}Z`} fill={A.tone(CABLE_MAT.mid, Z, 5)} />,
  ];
  if (lit > 0.002) {
    els.push(<path key="g" d={quad(R * 3, Y1, Y1 + (Y0 - Y1) * lit)} fill={CREAM} fillOpacity={0.1} />);
    els.push(<path key="c" d={quad(R * 0.42, Y1, Y1 + (Y0 - R - Y1) * lit)} fill={CREAM} fillOpacity={0.85} />);
    if (pulse > 0.01) {
      // the pulses continue up the riser (from the floor run's s = 0 upward)
      const ph = (((wf * PULSE_SPEED) % PULSE_GAP) + PULSE_GAP) % PULSE_GAP;
      let d = "";
      for (let s = PULSE_GAP - ph - PULSE_GAP; s < PULSE_GAP; s += PULSE_GAP) {
        // the floor pulse whose head passes s = 0 continues up: height along the riser = -(s) clipped to its length
        const head = -(s - PULSE_LEN);
        const tail = -s;
        const ha = Math.max(0, Math.min(RISER_LEN - R, tail));
        const hb = Math.max(0, Math.min(RISER_LEN - R, head));
        if (hb - ha > 1) d += quad(R * 0.75, Y0 - R - hb, Y0 - R - ha);
      }
      if (d) els.push(<path key="p" d={d} fill={CREAM} fillOpacity={0.95 * pulse} />);
    }
  }
  return <g>{els}</g>;
};

// ---- the year stencilled on the floor ---------------------------------------------------------------------------------
/** the digits in a 4-slot box, mapped onto the floor box YEAR_PAINT piecewise (strips along Z, each an exact affine of
 *  its own corners, clipped to its quad), so the paint lies in perspective. Changed digits crossfade (t 0..1). */
const STRIPS = 26;
const GLYPH = { size: 100, cap: 70, slot: 66 };
export const FloorYear: React.FC<{ A: AirWorld; from: string; to: string; t: number; uid: string }> = ({ A, from, to, t, uid }) => {
  const P = A.P;
  const { x0, x1, z0, z1 } = YEAR_PAINT;
  const W = GLYPH.slot * 4;
  const Hh = GLYPH.cap;
  const zm = (z0 + z1) / 2;
  const paint = mixHex(A.tone("#E6DDC8", zm, 0), PAL.cream, 0.15);
  const digits: React.ReactNode[] = [];
  for (let i = 0; i < 4; i++) {
    const a = from[i];
    const b = to[i];
    const cx = GLYPH.slot * (i + 0.5);
    const txt = (ch: string, op: number, key: string) =>
      op > 0.004 ? (
        <text key={key} x={cx} y={0} textAnchor="middle" fontFamily={PLATE_FONT} fontWeight={700} fontSize={GLYPH.size} fill={paint} fillOpacity={op}>
          {ch}
        </text>
      ) : null;
    if (a === b) digits.push(txt(b, 1, `d${i}`));
    else {
      digits.push(txt(a, 1 - ss(t), `a${i}`));
      digits.push(txt(b, ss(t), `b${i}`));
    }
  }
  const strips: React.ReactNode[] = [];
  for (let k = 0; k < STRIPS; k++) {
    // local v from -Hh (the digits' top, far edge z1) to 0 (the baseline, near edge z0)
    const va = -Hh + (Hh * k) / STRIPS;
    const vb = -Hh + (Hh * (k + 1)) / STRIPS;
    const pad = k === 0 ? 0.25 : 0;
    const padB = k === STRIPS - 1 ? 0.25 : 0;
    const vA = va - pad * Hh;
    const vB = vb + padB * Hh;
    const zOf = (v: number) => z0 + ((z1 - z0) * -v) / Hh;
    // an affine exact on the strip's midline (its x direction and its local v derivative there)
    const vm = (vA + vB) / 2;
    const dv = (vB - vA) * 0.5;
    const M0 = P.p(x0, 0, zOf(vm));
    const M1 = P.p(x1, 0, zOf(vm));
    const Ma = P.p(x0 + (x1 - x0) / 2, 0, zOf(vm - dv / 2));
    const Mb = P.p(x0 + (x1 - x0) / 2, 0, zOf(vm + dv / 2));
    const ux = [(M1[0] - M0[0]) / W, (M1[1] - M0[1]) / W];
    const vx = [(Mb[0] - Ma[0]) / dv, (Mb[1] - Ma[1]) / dv];
    const Mc: P2 = [(M0[0] + M1[0]) / 2, (M0[1] + M1[1]) / 2];
    const e = Mc[0] - ux[0] * (W / 2) - vx[0] * vm;
    const f = Mc[1] - ux[1] * (W / 2) - vx[1] * vm;
    const q = poly([P.p(x0 - 40, 0, zOf(vA)), P.p(x1 + 40, 0, zOf(vA)), P.p(x1 + 40, 0, zOf(vB)), P.p(x0 - 40, 0, zOf(vB))]);
    strips.push(
      <g key={k}>
        <clipPath id={`${uid}-s${k}`}>
          <path d={q} />
        </clipPath>
        <g clipPath={`url(#${uid}-s${k})`}>
          <g transform={`matrix(${ux[0].toFixed(5)} ${ux[1].toFixed(5)} ${vx[0].toFixed(5)} ${vx[1].toFixed(5)} ${f2(e)} ${f2(f)})`}>{digits}</g>
        </g>
      </g>,
    );
  }
  return <g opacity={0.82 * (1 - 0.6 * A.fog(zm))}>{strips}</g>;
};

// ---- a station ------------------------------------------------------------------------------------------------------
/** the station's arrival: opacity up and a small squash (0.9 -> 1.03 -> 1 tall) on its floor point, 2D world px */
const stationArrive = (A: AirWorld, id: number, appear: number) => {
  if (appear >= 1) return { op: 1, tf: undefined as string | undefined };
  const so = stationOf(id);
  const o = A.P.p((so.an.at.X + so.X) / 2, 0, (so.zNear + so.zFar) / 2);
  const u = ss(appear);
  const sy = 0.9 + 0.1 * u + 0.05 * Math.sin(Math.PI * u);
  const sx = 1 + (1 - sy) * 0.5;
  return { op: u, tf: `translate(${f2(o[0])} ${f2(o[1])}) scale(${sx.toFixed(4)} ${sy.toFixed(4)}) translate(${f2(-o[0])} ${f2(-o[1])})` };
};
/** a soft cream light at the rack while its new station arrives (screen blend) */
const EntryGlow: React.FC<{ A: AirWorld; id: number; glow: number; gid: string }> = ({ A, id, glow, gid }) => {
  if (glow <= 0.003) return null;
  const rk = RACKS[id];
  const so = stationOf(id);
  const r = A.P.r(rk.Z);
  const c = A.P.p((rk.X + so.an.at.X) / 2, -RACK.h * 0.4, rk.Z - 60);
  return <ellipse cx={f2(c[0])} cy={f2(c[1])} rx={f2(RACK.w * 2.6 * r)} ry={f2(RACK.h * 0.85 * r)} fill={`url(#${gid})`} opacity={glow * (1 - 0.5 * A.fog(rk.Z))} style={{ mixBlendMode: "screen" }} />;
};
/** the robot's pose at its desk: typing, switched on by boot (frozen hands until it is on) */
export const stationPose = (st: StationState) => {
  const q = BOT_POSES.typeAtDesk(1, st.poseFrame, st.seed);
  return st.boot >= 1 ? q : { ...q, boot: st.boot };
};

// ---- the world --------------------------------------------------------------------------------------------------------
export const BlockWorld: React.FC<{ A: AirWorld; cam: Cam; st: WorldState; uid: string }> = ({ A, cam, st, uid }) => {
  const racks: RackSpec[] = RACKS.map((rk) => {
    const p = st.power.get(rk.id ?? 0);
    return p ? { ...rk, power: p.power, relight: p.relight } : rk;
  });
  const stByRow = new Map<number, StationState[]>();
  for (const s of st.stations) {
    const r = stationOf(s.id).row;
    const a = stByRow.get(r);
    if (a) a.push(s);
    else stByRow.set(r, [s]);
  }
  const rows: React.ReactNode[] = [];
  for (let r = ROWS - 1; r >= 0; r--) {
    const rr = racks.filter((rk) => rk.row === r);
    const sts = (stByRow.get(r) ?? []).slice().sort((a, b) => Math.abs(stationOf(b.id).X - cam.cx) - Math.abs(stationOf(a.id).X - cam.cx));
    const desks: React.ReactNode[] = [];
    const bots: { id: number; el: React.ReactNode }[] = [];
    const glows: React.ReactNode[] = [];
    let scaleRow = 0;
    for (const s of sts) {
      if (s.appear <= 0) continue;
      const so = stationOf(s.id);
      const { op, tf } = stationArrive(A, s.id, s.appear);
      glows.push(<EntryGlow key={`g${s.id}`} A={A} id={s.id} glow={s.glow} gid={`${uid}-eg`} />);
      desks.push(
        <g key={`d${s.id}`} opacity={op < 1 ? f2(op) : undefined} transform={tf}>
          <Desk A={A} X={so.X} Z={so.Z} uid={`${uid}-dk${s.id}`} seat="left" layer="all" screen={c01(s.boot * 1.6)} mug={s.id === HERO_ID} />
        </g>,
      );
      const pl = A.P.at(so.an.at.X, so.an.at.Z);
      scaleRow = pl.scale;
      bots.push({
        id: s.id,
        el: (
          <g key={`b${s.id}`} opacity={op < 1 ? f2(op) : undefined} transform={tf}>
            <Bot variant={s.variant} pose={stationPose(s)} at={pl.at} scale={pl.scale} uid={`${uid}-bt${s.id}`} frame={st.wf} fog={A.folkFog(so.an.at.Z)} unitPx={cam.k} texture={s.id === HERO_ID ? true : false} />
          </g>
        ),
      });
    }
    const hero = sts.find((s) => s.id === HERO_ID && s.appear > 0);
    const others = bots.filter((b) => b.id !== HERO_ID).map((b) => b.el);
    const heroBot = bots.filter((b) => b.id === HERO_ID).map((b) => b.el);
    rows.push(
      <g key={`row${r}`}>
        <RackPools A={A} racks={rr} uid={`${uid}-p${r}`} />
        <RackHalo A={A} racks={rr} uid={`${uid}-h${r}`} />
        <RackField A={A} racks={rr} frame={st.wf} uid={`${uid}-r${r}`} />
        <RackVeil A={A} racks={rr} ex={cam.cx} />
        <RackSheen A={A} racks={rr} sheen={st.sheen} />
        <RackWash A={A} racks={rr} />
        {glows}
        {desks}
        {others.length ? (
          <BotLayer uid={`${uid}-bl${r}`} px={(scaleRow * cam.k * 512) / 860} unitPx={cam.k}>
            {others}
          </BotLayer>
        ) : null}
        {heroBot}
        {hero ? <CableRiser A={A} litS={st.litS} pulse={st.pulse} wf={st.wf} /> : null}
      </g>,
    );
  }
  return (
    <g>
      <AirFloor A={A} x0={FLOOR.x0} x1={FLOOR.x1} z0={FLOOR.z0} z1={FLOOR.z1} mat={FLOOR.mat} course={FLOOR.tile} plank={FLOOR.tile} jointAmt={FLOOR.jointAmt} melt={FLOOR.melt} />
      <AirHorizonHazeW A={A} id={`${uid}-haze`} />
      <defs>
        <radialGradient id={`${uid}-eg`}>
          <stop offset="0" stopColor={CREAM} stopOpacity={0.7} />
          <stop offset="0.5" stopColor={CREAM} stopOpacity={0.22} />
          <stop offset="1" stopColor={CREAM} stopOpacity={0} />
        </radialGradient>
      </defs>
      <FloorYear A={A} from={st.year.from} to={st.year.to} t={st.year.t} uid={`${uid}-yr`} />
      <CableFloor A={A} litS={st.litS} pulse={st.pulse} wf={st.wf} />
      {rows}
    </g>
  );
};
