// ---------------------------------------------------------------------------
// sparkTakeoffSet: the set of SparkingSustainedTakeoff (kyle-greek-math, cut 15), drawn in the Dwarkesh 3D medium
// (kits/dwarkesh-3d/dwarkesh3d; styles/dwarkesh-3d.md). Numbers in ./sparkTakeoffPlan.ts; the people and the
// armillary sphere (greekFolk) in ./sparkTakeoffCast.tsx.
//
// The warm sand floor (one continuous tone by distance, soft wind ripples, a few pebbles; the patch round the diagram
// smoothed), a Doric stoa receding on the far left into the haze, Thales' figure drawn in the sand as a glowing orange
// groove (the stick's tip draws it), the long line that runs on from it and lifts into the DASHED orange takeoff curve
// (drawn by its bright moving tip), and the lower frame sinking into the dense low air.
// Orange = Greek mathematical / scientific knowledge (the diagram, the line, the sphere's rings); dashed orange = the
// progress that never came (the takeoff). People never orange.
//
// API
//   <SparkWorld A f />    the whole world for frame f inside <WorldSvg cam>, in painter's order
//   <LowAirVeil A />      the dense low air over the bottom of the frame (AirStage `front`)
//   GlowRibbon, ribbonD   an orange groove / line as a ribbon of per-point widths (no beading at the joins)
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, random } from "remotion";
import { ACCENT, ACCENT_DEEP, AIR, AirBox, AirCyl, AirFloor, AirHorizonHazeW, MAT, lineOf, mixHex, type AirWorld, type Mat, type P2 } from "../kits/dwarkesh-3d/dwarkesh3d";
import { APEX, ARC_TOTAL, C, COMP, D0, D1, GEO, KNEE_ARC, LETGO0, R, SPARK, SPHERE, STOA, A_LINE, c01, circleArc, lerp, lineAt, onCircle, smooth, stickAt, tipArc, type V3 } from "./sparkTakeoffPlan";
import { Companion, Geometer, Sphere } from "./sparkTakeoffCast";

const PAL = AIR.A;
const Pt = (v: P2) => `${v[0].toFixed(2)},${v[1].toFixed(2)}`;
const poly = (q: P2[]) => `M${q.map(Pt).join("L")}Z`;
const pr = (A: AirWorld, q: V3): P2 => A.P.p(q[0], q[1], q[2]);
/** screen px -> world px of the WorldSvg */
const px = (A: AirWorld, s: number) => s / A.k;
const HOT = PAL.orangeHot;

// ===================================================================================================================
// RIBBONS: a line as a polygon of per-point half-widths (semi-transparent glows do not bead at the joins)
// ===================================================================================================================
export const ribbonD = (pts: P2[], hw: number[]) => {
  const n = pts.length;
  if (n < 2) return "";
  const L: P2[] = [];
  const Rt: P2[] = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(n - 1, i + 1)];
    let dx = b[0] - a[0];
    let dy = b[1] - a[1];
    const l = Math.hypot(dx, dy) || 1;
    dx /= l;
    dy /= l;
    L.push([pts[i][0] - dy * hw[i], pts[i][1] + dx * hw[i]]);
    Rt.push([pts[i][0] + dy * hw[i], pts[i][1] - dx * hw[i]]);
  }
  return `M${L.map(Pt).join("L")}L${Rt.reverse().map(Pt).join("L")}Z`;
};
/** the groove / line: 3D points (Y = 0 on the sand), drawn as a glowing orange ribbon. `groove`: a soft darker sand
 *  lip under it (cut in the sand); `glow` 0..1 the halo; hw: half-width in SCREEN px per point */
export const GlowRibbon: React.FC<{ A: AirWorld; pts: V3[]; hw: number[]; groove?: boolean; glow?: number; hot?: number; caps?: boolean }> = ({ A, pts, hw, groove = true, glow = 1, hot = 0.5, caps = true }) => {
  if (pts.length < 2) return null;
  const p2 = pts.map((q) => pr(A, q));
  const w = hw.map((h) => px(A, h));
  const zm = pts.reduce((s, q) => s + q[2], 0) / pts.length;
  const hm = -pts.reduce((s, q) => s + q[1], 0) / pts.length;
  const core = A.toneO(ACCENT, zm, hm);
  const deep = A.toneO(ACCENT_DEEP, zm, hm);
  const halo = A.toneO(ACCENT, zm, hm);
  const lip = A.tone(mixHex(MAT.ground.dark, PAL.shadow, 0.25), zm, 0);
  const sc = (k: number) => w.map((v) => v * k);
  const shift = (d: number) => p2.map((q) => [q[0], q[1] + d] as P2);
  const end = p2[p2.length - 1];
  const beg = p2[0];
  return (
    <g>
      {groove ? <path d={ribbonD(shift(px(A, 0.9)), sc(1.75))} fill={lip} opacity={0.32} /> : null}
      {glow > 0 ? <path d={ribbonD(p2, sc(5.2))} fill={halo} opacity={0.07 * glow} /> : null}
      {glow > 0 ? <path d={ribbonD(p2, sc(2.6))} fill={halo} opacity={0.16 * glow} /> : null}
      <path d={ribbonD(p2, sc(1.18))} fill={deep} />
      <path d={ribbonD(p2, w)} fill={core} />
      {caps ? <circle cx={beg[0]} cy={beg[1]} r={w[0]} fill={core} /> : null}
      {caps ? <circle cx={end[0]} cy={end[1]} r={w[w.length - 1]} fill={core} /> : null}
      {hot > 0 ? <path d={ribbonD(p2, sc(0.36))} fill={HOT} opacity={hot} /> : null}
    </g>
  );
};
/** the half-width (screen px) of the groove at depth Z: a 2 cm groove, never thinner than a readable line */
const grooveHW = (A: AirWorld, Z: number) => Math.max(2.5, Math.min(6.5, 2.0 * A.P.r(Z) * A.k));

/** a soft glowing bead (the stick's contact, the line's tip, the spark): screen px radii */
const Bead: React.FC<{ A: AirWorld; at: P2; r: number; halo: number; hot?: number; id: string; amt?: number }> = ({ A, at, r, halo, hot = 1, id, amt = 1 }) => (
  <g>
    <defs>
      <radialGradient id={`${id}-h`}>
        <stop offset="0" stopColor={ACCENT} stopOpacity={0.42 * amt} />
        <stop offset="0.35" stopColor={ACCENT} stopOpacity={0.16 * amt} />
        <stop offset="1" stopColor={ACCENT} stopOpacity={0} />
      </radialGradient>
      <radialGradient id={`${id}-c`}>
        <stop offset="0" stopColor="#FFF6DE" stopOpacity={hot * amt} />
        <stop offset="0.45" stopColor={HOT} stopOpacity={0.95 * amt} />
        <stop offset="1" stopColor={ACCENT} stopOpacity={0} />
      </radialGradient>
    </defs>
    <circle cx={at[0]} cy={at[1]} r={px(A, halo)} fill={`url(#${id}-h)`} />
    <circle cx={at[0]} cy={at[1]} r={px(A, r)} fill={`url(#${id}-c)`} />
  </g>
);

// ===================================================================================================================
// THE GROUND: sand, a few pebbles, the horizon zone
// ===================================================================================================================
const SAND: Mat = MAT.ground;
type Pebble = { X: number; Z: number; r: number; t: number };
const PEBBLES: Pebble[] = (() => {
  const out: Pebble[] = [];
  const clear = (X: number, Z: number) => {
    if (Math.hypot(X - C[0], Z - C[1]) < R + 60) return false;
    // keep the line's path clean
    const ux = Math.cos(A_LINE);
    const uz = Math.sin(A_LINE);
    const dx = X - D1[0];
    const dz = Z - D1[1];
    const along = dx * ux + dz * uz;
    const across = Math.abs(-dx * uz + dz * ux);
    if (along > -20 && along < KNEE_ARC + 220 && across < 70) return false;
    if (Math.hypot(X - GEO[0], Z - GEO[1]) < 120) return false;
    if (Math.hypot(X - SPHERE[0], Z - SPHERE[1]) < 90 || Math.hypot(X - COMP[0], Z - COMP[1]) < 90) return false;
    return true;
  };
  for (let i = 0; out.length < 120 && i < 2000; i++) {
    const X = -1500 + random(`pbx${i}`) * 3800;
    const Z = -900 + Math.pow(random(`pbz${i}`), 1.4) * 3600;
    if (!clear(X, Z)) continue;
    out.push({ X, Z, r: 2.6 + Math.pow(random(`pbr${i}`), 2.2) * 6.5, t: random(`pbt${i}`) });
  }
  return out;
})();
const Pebbles: React.FC<{ A: AirWorld }> = ({ A }) => {
  const P = A.P;
  const els: React.ReactNode[] = [];
  for (let i = 0; i < PEBBLES.length; i++) {
    const b = PEBBLES[i];
    if (b.Z < P.zNear + 40) continue;
    const a = 1 - A.fog(b.Z);
    if (a < 0.08) continue;
    const c = P.p(b.X, 0, b.Z);
    const rx = b.r * P.r(b.Z);
    if (rx * A.k < 0.7) continue;
    const ry = Math.max(rx * 0.25, Math.abs(P.p(b.X, 0, b.Z - b.r)[1] - P.p(b.X, 0, b.Z + b.r)[1]) / 2);
    const body = A.tone(mixHex(SAND.mid, SAND.dark, 0.35 + 0.3 * b.t), b.Z, 0);
    const lit = A.tone(mixHex(SAND.lit, PAL.creamLo, 0.3), b.Z, 0);
    els.push(
      <g key={i} opacity={(0.55 * a).toFixed(3)}>
        <ellipse cx={c[0] + rx * 0.35} cy={c[1] + ry * 0.45} rx={rx * 1.15} ry={ry * 0.9} fill={PAL.shadow} opacity={0.35} />
        <ellipse cx={c[0]} cy={c[1] - ry * 0.25} rx={rx} ry={ry * 1.25} fill={body} />
        <ellipse cx={c[0] - rx * 0.28} cy={c[1] - ry * 0.7} rx={rx * 0.45} ry={ry * 0.45} fill={lit} opacity={0.55} />
      </g>,
    );
  }
  return <g>{els}</g>;
};

/** wind ripples in the sand: short soft crests (a wide soft shade on the lee side, a faint lit lip), staggered, fading
 *  with the fog; the patch round the diagram is smoothed (he cleared it to draw) */
type Ripple = { X: number; Z: number; len: number; ph: number; amp: number; wl: number };
const RIPPLES: Ripple[] = (() => {
  const out: Ripple[] = [];
  let Z = -1900;
  let i = 0;
  while (Z < 3400) {
    Z += 52 + random(`rpz${i}`) * 40;
    // a row of crests, staggered along X with gaps
    let X = -2600 + random(`rpx${i}`) * 300;
    let j = 0;
    while (X < 2600) {
      const len = 160 + random(`rpl${i}-${j}`) * 420;
      out.push({ X, Z: Z + (random(`rpo${i}-${j}`) - 0.5) * 22, len, ph: random(`rpp${i}-${j}`) * 6.283, amp: 5 + random(`rpa${i}-${j}`) * 9, wl: 70 + random(`rpw${i}-${j}`) * 80 });
      X += len + 40 + random(`rpg${i}-${j}`) * 160;
      j++;
    }
    i++;
  }
  return out;
})();
const Ripples: React.FC<{ A: AirWorld }> = ({ A }) => {
  const P = A.P;
  const shade: React.ReactNode[] = [];
  const lips: React.ReactNode[] = [];
  RIPPLES.forEach((rp, i) => {
    if (rp.Z < P.zNear + 60) return;
    const a = (1 - A.fog(rp.Z)) * (1 - c01((rp.Z - 1800) / 1400));
    if (a < 0.05) return;
    const dC = Math.hypot((rp.X + rp.len / 2 - C[0]) / 1.4, rp.Z - C[1]);
    const clear = smooth((dC - (R + 130)) / 160) * smooth((Math.hypot(rp.X + rp.len / 2 - GEO[0], rp.Z - GEO[1]) - 110) / 80);
    if (clear < 0.05) return;
    const pts: P2[] = [];
    const n = Math.max(4, Math.round(rp.len / 30));
    for (let k = 0; k <= n; k++) {
      const X = rp.X + (rp.len * k) / n;
      const taper = Math.sin((Math.PI * k) / n);
      const z = rp.Z + rp.amp * Math.sin(X / rp.wl + rp.ph) * taper;
      pts.push(P.p(X, 0, z));
    }
    const d = `M${pts.map(Pt).join("L")}`;
    const r = P.r(rp.Z);
    const amt = a * clear;
    shade.push(<path key={i} d={d} stroke={A.tone(mixHex(SAND.dark, PAL.shadow, 0.1), rp.Z, 0)} strokeWidth={Math.max(2.4 / A.k, 12 * r)} strokeOpacity={(0.06 * amt).toFixed(3)} transform={`translate(0 ${(3.2 * r * A.P.r(0) * 0.6).toFixed(3)})`} />);
    lips.push(<path key={i} d={d} stroke={A.tone(mixHex(SAND.lit, PAL.creamLo, 0.4), rp.Z, 0)} strokeWidth={Math.max(0.6 / A.k, 2.2 * r)} strokeOpacity={(0.05 * amt).toFixed(3)} />);
  });
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      {shade}
      {lips}
    </g>
  );
};

// ===================================================================================================================
// THE STOA: a Doric colonnade on a stylobate, a back wall, the entablature, running back along Z on the far left
// ===================================================================================================================
const Stoa: React.FC<{ A: AirWorld }> = ({ A }) => {
  const P = A.P;
  const s = STOA;
  const marble = MAT.marble;
  const lw = A.lw(1.0);
  const yTopCol = -(s.styloH + s.colH);
  const entH = 150;
  const xa = s.X - 92;
  const xb = s.X + 92;
  const zs: number[] = [];
  for (let Z = s.Z0; Z <= s.Z1; Z += s.step) zs.push(Z);
  const face = (q: P2[], fill: string, Z: number, key: string) => <path key={key} d={poly(q)} fill={fill} stroke={A.tone(lineOf(marble), Z, 600)} strokeWidth={lw} strokeLinejoin="round" />;
  const zm = (s.Z0 + s.Z1) / 2;
  // the entablature's underside (seen from below), split by depth so it fogs along its length
  const under: React.ReactNode[] = [];
  const side: React.ReactNode[] = [];
  const N = 10;
  for (let i = 0; i < N; i++) {
    const za = lerp(s.Z0 - 60, s.Z1 + 60, i / N);
    const zb = lerp(s.Z0 - 60, s.Z1 + 60, (i + 1) / N);
    const zc = (za + zb) / 2;
    under.push(<path key={`u${i}`} d={poly([P.p(xa, yTopCol, za), P.p(xb, yTopCol, za), P.p(xb, yTopCol, zb), P.p(xa, yTopCol, zb)])} fill={A.tone(mixHex(marble.dark, PAL.shadow, 0.25), zc, 1100)} />);
    side.push(
      <g key={`s${i}`}>
        <path d={poly([P.p(xb, yTopCol - entH, za), P.p(xb, yTopCol, za), P.p(xb, yTopCol, zb), P.p(xb, yTopCol - entH, zb)])} fill={A.tone(marble.mid, zc, 1150)} />
        <path d={poly([P.p(xb + 14, yTopCol - entH - 46, za), P.p(xb + 14, yTopCol - entH, za), P.p(xb + 14, yTopCol - entH, zb), P.p(xb + 14, yTopCol - entH - 46, zb)])} fill={A.tone(marble.lit, zc, 1250)} />
        <path d={`M${Pt(P.p(xb, yTopCol - entH * 0.42, za))}L${Pt(P.p(xb, yTopCol - entH * 0.42, zb))}`} stroke={A.tone(lineOf(marble), zc, 1150)} strokeWidth={lw * 0.8} strokeOpacity={0.5} />
      </g>,
    );
  }
  // the near end of the entablature and cornice
  const endFace = (
    <g>
      {face([P.p(xa, yTopCol - entH, s.Z0 - 60), P.p(xb, yTopCol - entH, s.Z0 - 60), P.p(xb, yTopCol, s.Z0 - 60), P.p(xa, yTopCol, s.Z0 - 60)], A.tone(marble.mid, s.Z0, 1150), s.Z0, "ef")}
      {face([P.p(xa - 14, yTopCol - entH - 46, s.Z0 - 74), P.p(xb + 14, yTopCol - entH - 46, s.Z0 - 74), P.p(xb + 14, yTopCol - entH, s.Z0 - 74), P.p(xa - 14, yTopCol - entH, s.Z0 - 74)], A.tone(marble.lit, s.Z0, 1250), s.Z0, "cf")}
    </g>
  );
  const cols = [...zs].reverse().map((Z, i) => {
    const capY = yTopCol + 52;
    return (
      <g key={`c${Z}`}>
        <AirCyl A={A} X={s.X} Z={Z} R={s.colR} Y0={capY} Y1={-s.styloH} mat={marble} uid={`stc${i}`} lw={lw} flutes={9} joints={[-s.styloH - s.colH * 0.36, -s.styloH - s.colH * 0.7]} />
        <AirCyl A={A} X={s.X} Z={Z} R={s.colR * 1.32} Y0={capY - 22} Y1={capY} mat={marble} uid={`ste${i}`} lw={lw} />
        <AirBox A={A} X0={s.X - s.colR * 1.45} X1={s.X + s.colR * 1.45} Y0={yTopCol} Y1={capY - 22} Z0={Z - s.colR * 1.45} Z1={Z + s.colR * 1.45} mat={marble} uid={`sta${i}`} lw={lw} rim={0.6} />
      </g>
    );
  });
  return (
    <g>
      {/* the back wall */}
      <AirBox A={A} X0={s.wallX - 60} X1={s.wallX} Y0={yTopCol - entH} Y1={0} Z0={s.Z0 - 120} Z1={s.Z1 + 200} mat={MAT.stone} uid="stw" lw={lw} rim={0.4} />
      {/* the stylobate: three steps toward the open ground */}
      {[0, 1, 2].map((i) => (
        <AirBox key={i} A={A} X0={s.wallX - 60} X1={s.X + 150 - i * 34} Y0={-(i + 1) * (s.styloH / 3)} Y1={-i * (s.styloH / 3)} Z0={s.Z0 - 150 + i * 34} Z1={s.Z1 + 200} mat={marble} uid={`sts${i}`} lw={lw} rim={0.7} />
      ))}
      {under}
      {cols}
      {side}
      {endFace}
      <path d={`M${Pt(P.p(xb + 14, yTopCol - entH - 46, s.Z0 - 74))}L${Pt(P.p(xb + 14, yTopCol - entH - 46, s.Z1))}`} stroke={PAL.cream} strokeWidth={lw * 1.2} strokeOpacity={0.35 * (1 - A.fog(zm))} />
    </g>
  );
};

// ===================================================================================================================
// THE DIAGRAM: Thales' figure in the sand (the circle closed by the stick, the triangle on the diameter, the mark)
// ===================================================================================================================
const arcPts = (a0: number, a1: number, step = 0.06): V3[] => {
  const n = Math.max(2, Math.ceil(Math.abs(a1 - a0) / step));
  const out: V3[] = [];
  for (let i = 0; i <= n; i++) {
    const p = onCircle(lerp(a0, a1, i / n));
    out.push([p[0], 0, p[1]]);
  }
  return out;
};
const segPts = (a: P2, b: P2, n = 10): V3[] => Array.from({ length: n + 1 }, (_, i) => [lerp(a[0], b[0], i / n), 0, lerp(a[1], b[1], i / n)] as V3);
const Diagram: React.FC<{ A: AirWorld; f: number }> = ({ A, f }) => {
  const hwOf = (pts: V3[]) => pts.map((q) => grooveHW(A, q[2]));
  const [a0, a1] = circleArc(f);
  const circ = arcPts(a0, a1);
  // the right-angle mark at the apex: a small square on the two legs
  const leg = (to: P2, d: number): P2 => {
    const dx = to[0] - APEX[0];
    const dz = to[1] - APEX[1];
    const l = Math.hypot(dx, dz);
    return [APEX[0] + (dx / l) * d, APEX[1] + (dz / l) * d];
  };
  const m = 22;
  const mA = leg(D0, m);
  const mB = leg(D1, m);
  const mC: P2 = [mA[0] + mB[0] - APEX[0], mA[1] + mB[1] - APEX[1]];
  const markPts = [...segPts(mA, mC, 3), ...segPts(mC, mB, 3).slice(1)];
  const lines: V3[][] = [segPts(D0, D1, 16), segPts(D0, APEX, 12), segPts(APEX, D1, 12)];
  return (
    <g>
      {lines.map((pts, i) => (
        <GlowRibbon key={i} A={A} pts={pts} hw={hwOf(pts)} hot={0.42} />
      ))}
      <GlowRibbon A={A} pts={markPts} hw={markPts.map((q) => 0.62 * grooveHW(A, q[2]))} hot={0.3} glow={0.6} caps={false} />
      <GlowRibbon A={A} pts={circ} hw={hwOf(circ)} hot={0.42} />
      <CircleTrail A={A} f={f} />
    </g>
  );
};
/** the groove lights as the stick's tip passes: a hot trail behind the tip on the circle, settling as it closes */
const CircleTrail: React.FC<{ A: AirWorld; f: number }> = ({ A, f }) => {
  const [, a1] = circleArc(f);
  const fade = 1 - smooth((f - 30) / 14);
  if (fade <= 0.01) return null;
  const pts = arcPts(a1 - 0.75, a1, 0.05);
  const a = pr(A, pts[0]);
  const b = pr(A, pts[pts.length - 1]);
  return (
    <g>
      <defs>
        <linearGradient id="ct-trail" gradientUnits="userSpaceOnUse" x1={a[0].toFixed(2)} y1={a[1].toFixed(2)} x2={b[0].toFixed(2)} y2={b[1].toFixed(2)}>
          <stop offset="0" stopColor={HOT} stopOpacity={0} />
          <stop offset="1" stopColor={HOT} stopOpacity={0.9 * fade} />
        </linearGradient>
      </defs>
      <path d={ribbonD(pts.map((q) => pr(A, q)), pts.map((q) => px(A, 0.75 * grooveHW(A, q[2]))))} fill="url(#ct-trail)" />
    </g>
  );
};

// ===================================================================================================================
// THE LONG LINE: the solid groove from D1 to the knee, then the dashed curve in the air, the moving tip and the spark
// ===================================================================================================================
const DASH = 30;
const GAP = 19;
const sampleLine = (s0: number, s1: number, step: number): V3[] => {
  const n = Math.max(1, Math.ceil((s1 - s0) / step));
  return Array.from({ length: n + 1 }, (_, i) => lineAt(lerp(s0, s1, i / n)));
};
const LongLine: React.FC<{ A: AirWorld; f: number; part: "ground" | "air" }> = ({ A, f, part }) => {
  const s = tipArc(f);
  if (s <= 0.5) return null;
  if (part === "air") return <LineAir A={A} s={s} />;
  const solidEnd = Math.min(s, KNEE_ARC);
  const ground = sampleLine(0, solidEnd, 12);
  const els: React.ReactNode[] = [];
  els.push(<GlowRibbon key="g" A={A} pts={ground} hw={ground.map((q) => grooveHW(A, q[2]))} hot={0.45} />);
  // the hot trail behind the moving tip on the sand (the groove lights as the tip passes, then settles)
  if (s < KNEE_ARC + 40) {
    const t0 = Math.max(0, solidEnd - 70);
    const trail = sampleLine(t0, solidEnd, 6);
    if (trail.length > 1) {
      const a = pr(A, trail[0]);
      const b = pr(A, trail[trail.length - 1]);
      els.push(
        <g key="trail">
          <defs>
            <linearGradient id="ll-trail" gradientUnits="userSpaceOnUse" x1={a[0].toFixed(2)} y1={a[1].toFixed(2)} x2={b[0].toFixed(2)} y2={b[1].toFixed(2)}>
              <stop offset="0" stopColor={HOT} stopOpacity={0} />
              <stop offset="1" stopColor={HOT} stopOpacity={0.9} />
            </linearGradient>
          </defs>
          <path d={ribbonD(trail.map((q) => pr(A, q)), trail.map((q) => px(A, 0.75 * grooveHW(A, q[2]))))} fill="url(#ll-trail)" />
        </g>,
      );
    }
  }
  return <g>{els}</g>;
};
/** the dashed takeoff: dashes in 3D arc length from the knee, drawn up to the tip */
const LineAir: React.FC<{ A: AirWorld; s: number }> = ({ A, s }) => {
  const els: React.ReactNode[] = [];
  if (s > KNEE_ARC) {
    for (let d0 = KNEE_ARC + 4; d0 < s; d0 += DASH + GAP) {
      const d1 = Math.min(s, d0 + DASH);
      if (d1 - d0 < 1.5) continue;
      const pts = sampleLine(d0, d1, 6);
      // the dashes widen from the groove's width at the knee to the takeoff's bolder line over the first ~1 m
      const grow = smooth((d0 - KNEE_ARC) / 220);
      const hw = pts.map((q) => lerp(grooveHW(A, q[2]), Math.max(3.7, Math.min(7, 2.6 * A.P.r(q[2]) * A.k)), grow));
      els.push(<GlowRibbon key={`d${d0}`} A={A} pts={pts} hw={hw} groove={false} hot={0.38} glow={1.1} />);
    }
  }
  return <g>{els}</g>;
};
/** the moving tip: a small hot bead while the stick draws and the line runs on; from SPARK the spark (brighter,
 *  bigger, a short flare at ignition), carried up the curve and out of the frame */
const Tip: React.FC<{ A: AirWorld; f: number }> = ({ A, f }) => {
  const s = tipArc(f);
  if (s <= 0.5 || s >= ARC_TOTAL - 1) return null;
  const at = pr(A, lineAt(s));
  const sp = smooth((f - SPARK + 2) / 5);
  const flare = Math.exp(-Math.pow((f - SPARK - 3) / 4, 2));
  const r = lerp(9, 17, sp) + 8 * flare;
  const halo = lerp(26, 62, sp) + 40 * flare;
  // while the stick draws, the contact is a modest glow under the stick
  const amt = f < LETGO0 ? 0.75 : 1;
  return <Bead A={A} at={at} r={r} halo={halo} id="tip" amt={amt} hot={lerp(0.7, 1, sp)} />;
};
/** the stick's contact glow while it closes the circle */
const CircleTip: React.FC<{ A: AirWorld; f: number }> = ({ A, f }) => {
  const st = stickAt(f);
  if (!st.onSand || f > 40 || tipArc(f) > 0) return null;
  return <Bead A={A} at={pr(A, st.tip)} r={8} halo={30} id="ctip" amt={0.75 * (1 - smooth((f - 30) / 8))} hot={0.7} />;
};

// ===================================================================================================================
// THE WORLD, in painter's order
// ===================================================================================================================
export const SparkWorld: React.FC<{ A: AirWorld; f: number }> = ({ A, f }) => (
  <g>
    <AirFloor A={A} x0={-7000} x1={7000} z0={-3000} z1={14000} mat={SAND} jointAmt={0} melt={0.5} />
    <AirHorizonHazeW A={A} id="haze" />
    <Ripples A={A} />
    <Pebbles A={A} />
    <Stoa A={A} />
    <Diagram A={A} f={f} />
    <LongLine A={A} f={f} part="ground" />
    <Companion A={A} f={f} />
    <Sphere A={A} f={f} />
    <Geometer A={A} f={f} />
    <CircleTip A={A} f={f} />
    <LongLine A={A} f={f} part="air" />
    <Tip A={A} f={f} />
  </g>
);
/** the lower frame sinks into the dense low air (the style's "Lower frame" rule): a soft veil of the low air's own
 *  colour over the bottom of the frame, part of the medium (screen space, like the vignette) */
export const LowAirVeil: React.FC<{ A: AirWorld; amt?: number }> = ({ A, amt = 1 }) => {
  const c = A.v.airAtScreen(1920);
  const d = A.v.airAtScreen(1500);
  const dk = c.map((v, i) => v * 0.8 + [34, 24, 16][i] * 0.2);
  const rg = (q: number[], a: number) => `rgba(${q.map((v) => Math.round(v)).join(",")},${a.toFixed(3)})`;
  return (
    <AbsoluteFill
      style={{ background: `linear-gradient(to bottom, ${rg(d, 0)} 0%, ${rg(d, 0)} 59%, ${rg(d, 0.3 * amt)} 67%, ${rg(c, 0.66 * amt)} 80%, ${rg(dk, 0.86 * amt)} 100%)` }}
    />
  );
};
