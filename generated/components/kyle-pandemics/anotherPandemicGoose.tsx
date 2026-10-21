// ---------------------------------------------------------------------------
// anotherPandemicGoose: the wild goose of AnotherPandemicRoad (kyle-pandemics, cut 47), the bird-flu carrier (highly
// pathogenic avian influenza H5N1 is carried by wild waterfowl: CDC, "Avian influenza in birds"). A greylag (Anser
// anser) built in 3D and drawn through the cut's one camera, so it sits in the scene's perspective in three-quarter
// view (we look up at it in the glide, slightly down on it once it stands on the stone). Engraved manner: natural
// plumage (umber back and wings with pale feather edges, near-black primaries, a darker long neck with furrows, a
// cream-grey breast), lit from the upper left with a form shadow and hatching, a thin DARK casing. THE DISEASE is the
// orange: a soft-edged orange stain with orange hatching through its breast and body and threads up the neck, carried
// inside it; the heavy bill and the feet are orange too (a greylag's are).
//
// LOCAL UNITS: cm (x forward, y up, z to its left), origin between its feet; GS scales it in the world.
//   goosePoseAt(f) -> GoosePose | null (null before it enters)
//   <Goose c pose uid />   draws it (inside the identity WorldSvg: screen px)
// ---------------------------------------------------------------------------
import React from "react";
import { G, GOOSE_REST, GOOSE_START, GOOSE_YAW, proj, type Cam3 } from "./anotherPandemicWorld";

export const ORANGE = "#FFB000";
export const ORANGE_DEEP = "#D98A0C";
const DARK = "#17120D";
const BACK = "#5E4D3A"; // the back and wing coverts
const BACK_SH = "#3E3226";
const PRIM = "#2C241B"; // the flight feathers
const PALE = "#D3C5A2"; // pale feather edges
const FLANK = "#7E6D55"; // grey-brown flank
const BREAST = "#B8A988"; // the paler breast
const BREAST_LIT = "#D3C5A2";
const NECK = "#6B5A44";
const HEAD = "#625240";
const UNDER = "#6E604B"; // a wing seen from below

/** a big greylag, drawn a little over life size so it reads on a phone: ~1.2 m bill to tail */
const GS = 1.3;

type V3 = [number, number, number];
type V2 = [number, number];
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const ss = (u: number) => {
  const x = c01(u);
  return x * x * (3 - 2 * x);
};
const r1 = (v: number) => Math.round(v * 10) / 10;
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sc3 = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
const lerp3 = (a: V3, b: V3, t: number): V3 => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];
const lerp2 = (a: V2, b: V2, t: number): V2 => [mix(a[0], b[0], t), mix(a[1], b[1], t)];
const D2R = Math.PI / 180;
const pd = (p: V2[], close = true) => `M${p.map((q) => `${r1(q[0])},${r1(q[1])}`).join("L")}${close ? "Z" : ""}`;

export type GoosePose = {
  pos: V3; // the world point between its feet
  yaw: number; // deg, its heading in the ground plane (from + X toward + Z)
  pitch: number; // deg, nose up +
  wing: number; // 0 folded .. 1 spread
  raise: number; // deg, how far the spread wings are raised (dihedral)
  reach: number; // neck 0 upright .. 1 stretched forward (flight)
  leg: number; // 0 tucked .. 1 standing
  legFwd: number; // feet thrown forward for the landing
  headYaw: number; // deg, the head turned toward us +
  headPitch: number; // deg, bill up +
  dip: number; // cm, the body sinking as it takes its weight
  lift: number; // 0..1 the far foot raised
  shift: number; // cm, weight shifted forward
};

// ---------------------------------------------------------------------------
// THE BODY FRAME: local (x fwd, y up, z left) -> world
// ---------------------------------------------------------------------------
const frameOf = (p: GoosePose) => {
  const ps = p.yaw * D2R;
  const th = p.pitch * D2R;
  const Fw: V3 = [Math.cos(ps), 0, Math.sin(ps)];
  const Uw: V3 = [0, -1, 0];
  const Lw: V3 = [-Math.sin(ps), 0, Math.cos(ps)];
  const Fp = add(sc3(Fw, Math.cos(th)), sc3(Uw, Math.sin(th)));
  const Up = add(sc3(Uw, Math.cos(th)), sc3(Fw, -Math.sin(th)));
  // the body pitches about its middle (BODY_C), the feet stay put when it stands
  return (l: V3, onBody = true): V3 => {
    if (!onBody) return add(p.pos, sc3(add(add(sc3(Fw, l[0]), sc3(Uw, l[1])), sc3(Lw, l[2])), GS));
    const q: V3 = [l[0] - BODY_C[0] + p.shift, l[1] - BODY_C[1] - p.dip, l[2]];
    const w = add(add(sc3(Fp, q[0]), sc3(Up, q[1])), sc3(Lw, q[2]));
    const c = add(add(sc3(Fw, BODY_C[0]), sc3(Uw, BODY_C[1])), [0, 0, 0]);
    return add(p.pos, sc3(add(c, w), GS));
  };
};
const BODY_C: V3 = [-2, 28, 0];

// ---------------------------------------------------------------------------
// THE WINGS (z is outward for the left wing; mirrored for the right): spread (in the shoulder's plane, raised by
// `raise` about the body's long axis) and folded (along the flank and over the back), the same 12 points
// ---------------------------------------------------------------------------
const SH: V3 = [12, 42, 9];
const WING_SPREAD: V3[] = [
  [12, 42, 9], // 0 shoulder
  [16, 43, 26], // 1 leading edge
  [12, 44, 44], // 2 wrist
  [-2, 44, 66], // 3 outer leading edge
  [-18, 44, 88], // 4 tip (outermost primary)
  [-25, 44, 85], // 5
  [-31, 44, 80], // 6
  [-36, 44, 73], // 7
  [-39, 44, 65], // 8 innermost primary
  [-37, 43, 44], // 9 secondaries
  [-31, 43, 30], // 10
  [-22, 42, 15], // 11
];
const WING_FOLD: V3[] = [
  [12, 42, 9],
  [9, 44, 14],
  [0, 45, 15.5],
  [-22, 44, 14],
  [-52, 40, 4],
  [-51, 39.5, 5],
  [-50, 39, 6],
  [-49, 38.5, 7],
  [-48, 38, 8],
  [-34, 29, 14.5],
  [-14, 25, 16],
  [6, 29, 15],
];
const wingLocal = (p: GoosePose, side: 1 | -1): V3[] => {
  const ra = p.raise * D2R;
  return WING_SPREAD.map((sp, i) => {
    const dz = sp[2] - SH[2];
    const dy = sp[1] - SH[1];
    // raise about the shoulder's fore-aft axis
    const raised: V3 = [sp[0], SH[1] + dy * Math.cos(ra) + dz * Math.sin(ra), SH[2] + dz * Math.cos(ra) - dy * Math.sin(ra)];
    const l = lerp3(WING_FOLD[i], raised, p.wing);
    return [l[0], l[1], l[2] * side];
  });
};

// ---------------------------------------------------------------------------
// DRAWING HELPERS
// ---------------------------------------------------------------------------
type Pr = { x: number; y: number; s: number; d: number };
/** an ellipsoid (centre, three semi-axis vectors, world) as a screen ellipse: the local Jacobian of the camera */
const ellipseOf = (c: Cam3, C: V3, axes: V3[]) => {
  const p0 = proj(c, C[0], C[1], C[2]);
  const J = (v: V3): V2 => {
    const e = 1;
    const q = proj(c, C[0] + v[0] * e, C[1] + v[1] * e, C[2] + v[2] * e);
    return [q.x - p0.x, q.y - p0.y];
  };
  let a = 0;
  let b = 0;
  let d = 0;
  axes.forEach((ax) => {
    const v = J(ax);
    a += v[0] * v[0];
    b += v[0] * v[1];
    d += v[1] * v[1];
  });
  const m = (a + d) / 2;
  const q = Math.sqrt(((a - d) / 2) ** 2 + b * b);
  const ang = 0.5 * Math.atan2(2 * b, a - d);
  return { cx: p0.x, cy: p0.y, rx: Math.sqrt(m + q), ry: Math.sqrt(Math.max(0.01, m - q)), rot: ang / D2R, d: p0.d };
};
type Ell = ReturnType<typeof ellipseOf>;
const ellD = (e: Ell, dx = 0, dy = 0, k = 1) => {
  const t = e.rot * D2R;
  const ux = Math.cos(t) * e.rx * k;
  const uy = Math.sin(t) * e.rx * k;
  const cx = e.cx + dx;
  const cy = e.cy + dy;
  return `M${r1(cx - ux)},${r1(cy - uy)}A${r1(e.rx * k)},${r1(e.ry * k)} ${r1(e.rot)} 1 0 ${r1(cx + ux)},${r1(cy + uy)}A${r1(e.rx * k)},${r1(e.ry * k)} ${r1(e.rot)} 1 0 ${r1(cx - ux)},${r1(cy - uy)}Z`;
};
const hatchD = (box: [number, number, number, number], gap: number, angle: number) => {
  const a = angle * D2R;
  const dx = Math.cos(a);
  const dy = Math.sin(a);
  const cx = (box[0] + box[2]) / 2;
  const cy = (box[1] + box[3]) / 2;
  const R = Math.hypot(box[2] - box[0], box[3] - box[1]) / 2 + 2;
  let d = "";
  for (let o = -R; o <= R; o += gap) d += `M${r1(cx - dy * o - dx * R)},${r1(cy + dx * o - dy * R)}L${r1(cx - dy * o + dx * R)},${r1(cy + dx * o + dy * R)}`;
  return d;
};
const boxOf = (p: V2[]): [number, number, number, number] => [Math.min(...p.map((q) => q[0])), Math.min(...p.map((q) => q[1])), Math.max(...p.map((q) => q[0])), Math.max(...p.map((q) => q[1]))];
/** convex hull (monotone chain) */
const hull = (pts: V2[]): V2[] => {
  const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o: V2, a: V2, b: V2) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo: V2[] = [];
  p.forEach((q) => {
    while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
    lo.push(q);
  });
  const hi: V2[] = [];
  p.slice().reverse().forEach((q) => {
    while (hi.length >= 2 && cr(hi[hi.length - 2], hi[hi.length - 1], q) <= 0) hi.pop();
    hi.push(q);
  });
  return [...lo.slice(0, -1), ...hi.slice(0, -1)];
};
/** a smooth closed outline through points (midpoint quadratics) */
const smoothD = (ring: V2[]) => {
  const n = ring.length;
  const mid = (i: number): V2 => [(ring[i][0] + ring[(i + 1) % n][0]) / 2, (ring[i][1] + ring[(i + 1) % n][1]) / 2];
  const m0 = mid(n - 1);
  let d = `M${r1(m0[0])},${r1(m0[1])}`;
  for (let i = 0; i < n; i++) {
    const m = mid(i);
    d += `Q${r1(ring[i][0])},${r1(ring[i][1])} ${r1(m[0])},${r1(m[1])}`;
  }
  return `${d}Z`;
};

// ---------------------------------------------------------------------------
// THE GOOSE
// ---------------------------------------------------------------------------
export const Goose: React.FC<{ c: Cam3; pose: GoosePose; uid: string }> = ({ c, pose, uid }) => {
  const W = frameOf(pose);
  const P = (l: V3, onBody = true): Pr => {
    const w = W(l, onBody);
    return proj(c, w[0], w[1], w[2]);
  };
  const P2 = (l: V3, onBody = true): V2 => {
    const q = P(l, onBody);
    return [q.x, q.y];
  };
  const ref = P([0, 34, 0]);
  const px = ref.s * GS; // screen px per cm here
  const sw = Math.max(1.2, Math.min(2.6, 0.55 * px)); // the casing
  const hw = Math.max(0.6, Math.min(1.3, 0.28 * px)); // hatching / feather lines
  // world-axis helpers for ellipsoids: local axis vectors carried through the body frame
  const axis = (v: V3): V3 => {
    const a = W(v);
    const o = W([0, 0, 0]);
    return [a[0] - o[0], a[1] - o[1], a[2] - o[2]];
  };
  const tiltX = (deg: number, len: number): V3 => [Math.cos(deg * D2R) * len, Math.sin(deg * D2R) * len, 0];
  const tiltY = (deg: number, len: number): V3 => [-Math.sin(deg * D2R) * len, Math.cos(deg * D2R) * len, 0];
  const ell = (cl: V3, ax: V3[]) => ellipseOf(c, W(cl), ax.map(axis));

  // ---- the body (a union of a long body, the breast's bulge and the rear), the tail
  const body = ell([-4, 28, 0], [tiltX(-4, 30), tiltY(-4, 13.5), [0, 0, 14]]);
  const breastE = ell([13, 26.5, 0], [tiltX(-28, 15), tiltY(-28, 12.5), [0, 0, 12.5]]);
  const rear = ell([-22, 28, 0], [tiltX(10, 14), tiltY(10, 10.5), [0, 0, 11.5]]);
  const tail = ell([-34, 32, 0], [tiltX(14, 10), tiltY(14, 3.8), [0, 0, 7.5]]);
  const breast = ell([12, 24, 0], [tiltX(-28, 13), tiltY(-28, 10), [0, 0, 11]]);
  const parts = [rear, body, breastE];
  const stains = ([[13, 24, 1, 1], [3, 21, -3, 0.75], [18, 31, -2, 0.6], [-8, 25, 4, 0.5]] as const).map(([x, y, z, k]) => ({ p: P([x, y, z]), k }));
  const stain = stains[0].p;
  // the light falls from the upper left: the form shadow is the ellipse less a copy shifted toward the light
  const shadeOf = (e: Ell, k = 0.34) => `M-50,-50H1130V1970H-50Z${ellD(e, -k * e.rx * 0.8, -k * e.ry * 1.1)}`;

  // ---- the neck: a tapered tube from inside the breast to the head
  const head0: V3 = [mix(24, 62, pose.reach), mix(70, 42, pose.reach), 0];
  const ctrl: V3 = [mix(25, 44, pose.reach), mix(52, 40, pose.reach), 0];
  const base: V3 = [18, 34, 0];
  const quad = (t: number): V3 => lerp3(lerp3(base, ctrl, t), lerp3(ctrl, head0, t), t);
  const N = 14;
  const Lp: V2[] = [];
  const Rp: V2[] = [];
  const mids: V2[] = [];
  const radii: number[] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const a = P(quad(Math.max(0, t - 0.03)));
    const b = P(quad(Math.min(1, t + 0.03)));
    const m = P(quad(t));
    const tx = b.x - a.x;
    const ty = b.y - a.y;
    const tl = Math.hypot(tx, ty) || 1;
    const r = mix(7.4, 4.1, Math.pow(Math.min(1, t / 0.7), 0.8)) * m.s * GS;
    Lp.push([m.x - (ty / tl) * r, m.y + (tx / tl) * r]);
    Rp.push([m.x + (ty / tl) * r, m.y - (tx / tl) * r]);
    mids.push([m.x, m.y]);
    radii.push(r);
  }
  const neckD = `M${Lp.map((q) => `${r1(q[0])},${r1(q[1])}`).join("L")}L${Rp.slice().reverse().map((q) => `${r1(q[0])},${r1(q[1])}`).join("L")}Z`;
  // furrows: short strokes across the neck
  let furrow = "";
  for (let i = 3; i < N - 1; i++) furrow += `M${r1(mix(mids[i][0], Lp[i][0], 0.8))},${r1(mix(mids[i][1], Lp[i][1], 0.8))}L${r1(mix(mids[i + 1][0], Rp[i + 1][0], 0.55))},${r1(mix(mids[i + 1][1], Rp[i + 1][1], 0.55))}`;
  // orange threads up the lower neck
  let threads = "";
  for (let k = 0; k < 3; k++) {
    const i0 = 1 + k;
    const i1 = Math.min(N, i0 + 4 + k);
    threads += `M${r1(lerp2(mids[i0], Lp[i0], 0.3 - 0.25 * k)[0])},${r1(lerp2(mids[i0], Lp[i0], 0.3 - 0.25 * k)[1])}L${r1(lerp2(mids[i1], Rp[i1], 0.15 * k)[0])},${r1(lerp2(mids[i1], Rp[i1], 0.15 * k)[1])}`;
  }

  // ---- the head: an ellipsoid along the head's direction, the heavy wedge bill, the eye on the side toward us
  const hp = (mix(-12, 0, pose.reach) + pose.headPitch) * D2R;
  const hy = pose.headYaw * D2R;
  // head axes in the body's local frame: forward (turned by headYaw about local up, pitched by hp), up, side
  const hd: V3 = [Math.cos(hp) * Math.cos(hy), Math.sin(hp), -Math.cos(hp) * Math.sin(hy)];
  const hu: V3 = [-Math.sin(hp) * Math.cos(hy), Math.cos(hp), Math.sin(hp) * Math.sin(hy)];
  const hs: V3 = [Math.sin(hy), 0, Math.cos(hy)];
  const H = (f: number, u: number, s: number): V3 => add(add(add(head0, sc3(hd, f)), sc3(hu, u)), sc3(hs, s));
  const headE = ell(H(1.2, 0.8, 0), [sc3(hd, 8.2), sc3(hu, 5.4), sc3(hs, 4.8)]);
  const billPts = [H(6.5, 3.4, 0), H(6.5, -2.9, 0), H(6.5, 0.2, 2.9), H(6.5, 0.2, -2.9), H(20, 0.6, 0.9), H(20, 0.6, -0.9), H(19.5, -1.2, 0)].map((l) => P2(l));
  const billD = pd(hull(billPts));
  const nail = P2(H(19.6, 0.2, 0));
  const gape = `M${r1(P2(H(6.5, -0.6, 0))[0])},${r1(P2(H(6.5, -0.6, 0))[1])}L${r1(P2(H(16.5, -0.4, 0))[0])},${r1(P2(H(16.5, -0.4, 0))[1])}`;
  const eyeL = P(H(3, 1.9, 4.2));
  const eyeR = P(H(3, 1.9, -4.2));
  const eye = eyeL.d < eyeR.d ? eyeL : eyeR;
  const eyeSide = (eyeL.d < eyeR.d ? 1 : -1) as 1 | -1;

  // ---- the legs and webbed feet (on the stone when it stands)
  const legOf = (side: 1 | -1, isFar: boolean) => {
    const hip: V3 = [1, 17, 5 * side];
    const hipW = P(hip);
    const stand: V3 = [2 + pose.shift * 0.4, (isFar ? 5 * pose.lift : 0), 5.5 * side];
    const tuck: V3 = [-14, 24, 4 * side];
    const fwd: V3 = [13, 5, 5 * side];
    const air = lerp3(tuck, fwd, pose.legFwd);
    const footL = lerp3(air, stand, pose.leg);
    const onBody = pose.leg < 0.5;
    const foot = P(footL, onBody);
    const toe = (dx: number, dz: number) => P2(add(footL, [dx, 0, dz]), onBody);
    const vis = c01((pose.leg + pose.legFwd) * 1.6);
    if (vis < 0.02) return { d: hipW.d, node: null };
    const w = Math.max(2.2, 3.0 * px);
    const web = pd([P2(footL, onBody), toe(9, 3.2), toe(10.5, 0), toe(9, -3.2)]);
    return {
      d: foot.d,
      node: (
        <g key={`leg${side}`} opacity={vis}>
          <path d={`M${r1(hipW.x)},${r1(hipW.y)}L${r1(foot.x)},${r1(foot.y)}`} stroke={DARK} strokeWidth={w + 2 * sw} strokeLinecap="round" />
          <path d={`M${r1(hipW.x)},${r1(hipW.y)}L${r1(foot.x)},${r1(foot.y)}`} stroke={isFar ? ORANGE_DEEP : ORANGE} strokeWidth={w} strokeLinecap="round" />
          <path d={web} fill={isFar ? ORANGE_DEEP : ORANGE} stroke={DARK} strokeWidth={sw * 0.8} strokeLinejoin="round" />
        </g>
      ),
    };
  };

  // ---- the wings: the arm (coverts with pale-edged rows, the secondaries) over five long, separate primaries
  const wingNode = (side: 1 | -1) => {
    const L = wingLocal(pose, side);
    const S2 = L.map((l) => P2(l));
    const depth = P(L[3]).d;
    // which face we see: the wing's normal against the view ray
    const w0 = W(L[0]);
    const w2 = W(L[2]);
    const w10 = W(L[10]);
    const e1: V3 = [w2[0] - w0[0], w2[1] - w0[1], w2[2] - w0[2]];
    const e2: V3 = [w10[0] - w0[0], w10[1] - w0[1], w10[2] - w0[2]];
    const n: V3 = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
    const view: V3 = [w0[0] - c.X, w0[1] - c.eye, w0[2] - c.Z];
    const upper = (n[0] * view[0] + n[1] * view[1] + n[2] * view[2]) * side < 0 || pose.wing < 0.35;
    // the hand line: from the outer leading edge to the innermost primary's base
    const h0 = S2[3];
    const h1 = lerp2(S2[2], S2[9], 0.82);
    const prims: string[] = [];
    [4, 5, 6, 7, 8].forEach((ti, k) => {
      const bA = lerp2(h0, h1, k / 5);
      const bB = lerp2(h0, h1, Math.min(1, (k + 2.2) / 5));
      const tip = S2[ti];
      const mA = lerp2(bA, tip, 0.62);
      const mB = lerp2(bB, tip, 0.62);
      // a little swelling toward the tip (the feather's vane), a pointed end
      const wv = 0.1;
      const qA: V2 = [mA[0] + (mA[0] - mB[0]) * wv, mA[1] + (mA[1] - mB[1]) * wv];
      const qB: V2 = [mB[0] + (mB[0] - mA[0]) * wv, mB[1] + (mB[1] - mA[1]) * wv];
      prims.push(`M${r1(bA[0])},${r1(bA[1])}Q${r1(qA[0])},${r1(qA[1])} ${r1(tip[0])},${r1(tip[1])}Q${r1(qB[0])},${r1(qB[1])} ${r1(bB[0])},${r1(bB[1])}Z`);
    });
    const arm = smoothD([S2[0], S2[1], S2[2], S2[3], lerp2(h0, h1, 0.5), h1, S2[9], S2[10], S2[11]]);
    // covert rows: scalloped pale edges across the arm
    let cov = "";
    let covDark = "";
    for (let r = 0; r < 4; r++) {
      const t = 0.14 + r * 0.2;
      const A = lerp2(S2[1], S2[11], t);
      const B = lerp2(S2[3], S2[9], t * 0.95);
      for (let k = 0; k < 5; k++) {
        const q0 = lerp2(A, B, k / 5);
        const q1 = lerp2(A, B, (k + 1) / 5);
        const nx = -(q1[1] - q0[1]);
        const ny = q1[0] - q0[0];
        const m: V2 = [(q0[0] + q1[0]) / 2 + nx * 0.35, (q0[1] + q1[1]) / 2 + ny * 0.35];
        cov += `M${r1(q0[0])},${r1(q0[1])}Q${r1(m[0])},${r1(m[1])} ${r1(q1[0])},${r1(q1[1])}`;
        covDark += `M${r1(q0[0] + 0.8)},${r1(q0[1] + 1.2)}Q${r1(m[0] + 0.8)},${r1(m[1] + 1.2)} ${r1(q1[0] + 0.8)},${r1(q1[1] + 1.2)}`;
      }
    }
    // the secondaries' trailing feathers: short strokes across the arm's back edge
    let secs = "";
    for (let k = 1; k < 6; k++) {
      const a0 = lerp2(S2[9], S2[11], k / 6);
      const a1 = lerp2(lerp2(S2[2], S2[1], k / 6), a0, 0.72);
      secs += `M${r1(a0[0])},${r1(a0[1])}L${r1(a1[0])},${r1(a1[1])}`;
    }
    const id = `${uid}-w${side}`;
    const isFar = side === eyeSide * -1;
    return {
      d: depth,
      node: (
        <g key={`wing${side}`}>
          <clipPath id={id}>
            <path d={arm} />
          </clipPath>
          {prims.map((d, k) => (
            <path key={k} d={d} fill={upper ? PRIM : "#4A3D2E"} stroke={DARK} strokeWidth={sw * 0.9} strokeLinejoin="round" />
          ))}
          <path d={arm} fill={upper ? BACK : UNDER} stroke={DARK} strokeWidth={sw} strokeLinejoin="round" />
          <g clipPath={`url(#${id})`}>
            {upper ? <path d={covDark} stroke={DARK} strokeWidth={hw} strokeOpacity={0.55} fill="none" /> : null}
            {upper ? <path d={cov} stroke={PALE} strokeWidth={hw * 1.3} strokeOpacity={0.85} fill="none" /> : null}
            <path d={secs} stroke={DARK} strokeWidth={hw} strokeOpacity={0.45} fill="none" />
            {isFar || !upper ? <path d={hatchD(boxOf(S2), Math.max(2.2, 1.0 * px), 112)} stroke={DARK} strokeWidth={hw} strokeOpacity={0.3} fill="none" /> : null}
          </g>
        </g>
      ),
    };
  };

  const legA = legOf(1, eyeSide === -1);
  const legB = legOf(-1, eyeSide === 1);
  const wingA = wingNode(1);
  const wingB = wingNode(-1);
  const [farWing, nearWing] = wingA.d > wingB.d ? [wingA, wingB] : [wingB, wingA];
  const legs = [legA, legB].sort((a, b) => b.d - a.d);
  const bb = boxOf(
    parts.flatMap((e) => [
      [e.cx - e.rx, e.cy - e.rx] as V2,
      [e.cx + e.rx, e.cy + e.rx] as V2,
    ]),
  );
  const stainR = 13 * px;
  const id = (k: string) => `${uid}-${k}`;
  return (
    <g>
      <defs>
        <clipPath id={id("body")}>
          {parts.map((e, k) => (
            <path key={k} d={ellD(e)} />
          ))}
        </clipPath>
        <clipPath id={id("stainc")}>
          {stains.map((q, k) => (
            <circle key={k} cx={q.p.x} cy={q.p.y} r={stainR * q.k * 0.8} />
          ))}
        </clipPath>
        <clipPath id={id("neck")}>
          <path d={neckD} />
        </clipPath>
        <clipPath id={id("head")}>
          <path d={ellD(headE)} />
        </clipPath>
        <radialGradient id={id("stain")}>
          <stop offset="0" stopColor={ORANGE} stopOpacity={0.7} />
          <stop offset="0.45" stopColor={ORANGE} stopOpacity={0.42} />
          <stop offset="0.8" stopColor={ORANGE_DEEP} stopOpacity={0.12} />
          <stop offset="1" stopColor={ORANGE_DEEP} stopOpacity={0} />
        </radialGradient>
      </defs>
      {farWing.node}
      {legs.map((l) => l.node)}
      {/* the neck (darker, furrowed, orange threads): the breast overlaps its base */}
      <path d={neckD} fill={NECK} stroke={DARK} strokeWidth={sw} strokeLinejoin="round" />
      <g clipPath={`url(#${id("neck")})`}>
        <path d={`M${Rp.map((q) => `${r1(q[0])},${r1(q[1])}`).join("L")}`} stroke={BACK_SH} strokeWidth={radii[4] * 0.9} fill="none" strokeOpacity={0.8} />
        <path d={furrow} stroke={DARK} strokeWidth={hw} strokeOpacity={0.45} fill="none" />
        <path d={threads} stroke={ORANGE} strokeWidth={hw * 1.6} strokeOpacity={0.85} fill="none" strokeLinecap="round" />
      </g>
      {/* the tail, then the body as one outline: grey-brown flank, the paler breast, the form shadow, the orange
          stain and its hatching inside the breast */}
      <path d={ellD(tail)} fill={BACK_SH} stroke={DARK} strokeWidth={sw} />
      {parts.map((e, k) => (
        <path key={`o${k}`} d={ellD(e)} fill="none" stroke={DARK} strokeWidth={sw * 2} />
      ))}
      {parts.map((e, k) => (
        <path key={`f${k}`} d={ellD(e)} fill={FLANK} />
      ))}
      <g clipPath={`url(#${id("body")})`}>
        <path d={ellD(breast)} fill={BREAST} />
        <path d={ellD(breast, -0.18 * breast.rx, -0.22 * breast.ry, 0.75)} fill={BREAST_LIT} opacity={0.35} />
        <path d={shadeOf(body, 0.3)} fill={BACK_SH} opacity={0.5} fillRule="evenodd" />
        <path d={hatchD(bb, Math.max(2.4, 1.05 * px), 64)} stroke={DARK} strokeWidth={hw} strokeOpacity={0.2} fill="none" />
        {stains.map((q, k) => (
          <circle key={k} cx={q.p.x} cy={q.p.y} r={stainR * q.k} fill={`url(#${id("stain")})`} />
        ))}
        <path d={hatchD([stain.x - 3 * stainR, stain.y - 2 * stainR, stain.x + 3 * stainR, stain.y + 2 * stainR], Math.max(2, 0.8 * px), 118)} stroke={ORANGE} strokeWidth={hw * 1.1} strokeOpacity={0.75} fill="none" clipPath={`url(#${id("stainc")})`} />
      </g>
      {nearWing.node}
      {/* the head and the heavy orange bill */}
      <path d={ellD(headE)} fill={HEAD} stroke={DARK} strokeWidth={sw} />
      <g clipPath={`url(#${id("head")})`}>
        <path d={shadeOf(headE, 0.4)} fill={BACK_SH} opacity={0.6} fillRule="evenodd" />
      </g>
      <path d={billD} fill={ORANGE} stroke={DARK} strokeWidth={sw * 0.9} strokeLinejoin="round" />
      <path d={gape} stroke={DARK} strokeWidth={hw} strokeOpacity={0.6} fill="none" />
      <circle cx={nail[0]} cy={nail[1]} r={Math.max(1, 0.9 * px)} fill={PALE} stroke={DARK} strokeWidth={hw * 0.8} />
      <circle cx={eye.x} cy={eye.y} r={Math.max(1.2, 1.15 * px)} fill={DARK} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE TIMELINE
// ---------------------------------------------------------------------------
/** the flight: a cubic in 3D from just off the frame's upper left (further back) to the stone's top, along which it
 *  glides forward and toward us; it brakes in the flare */
const A0 = GOOSE_START;
const A3 = GOOSE_REST;
const A1: V3 = [mix(A0[0], A3[0], 0.38), mix(A0[1], A3[1], 0.3), mix(A0[2], A3[2], 0.38)];
const A2: V3 = [A3[0] - 52, A3[1] - 46, A3[2] + 40];
const bez = (t: number): V3 => {
  const u = 1 - t;
  const k = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
  return [0, 1, 2].map((i) => k[0] * A0[i] + k[1] * A1[i] + k[2] * A2[i] + k[3] * A3[i]) as V3;
};
const PROG: number[] = (() => {
  const n = 400;
  const out = [0];
  let acc = 0;
  for (let i = 1; i <= n; i++) {
    const t = (i - 0.5) / n;
    acc += t < 0.55 ? 1 : mix(1, 0.4, ss((t - 0.55) / 0.45));
    out.push(acc);
  }
  return out.map((v) => v / acc);
})();
const progAt = (f: number) => {
  const t = c01((f - G.enter) / (G.touch - G.enter)) * 400;
  const i = Math.min(399, Math.floor(t));
  return mix(PROG[i], PROG[i + 1], t - i);
};
/** the heading (yaw, deg) and the glide's slope (deg, + = descending) along the flight */
const flightDir = (f: number) => {
  const u = progAt(f);
  const a = bez(Math.max(0, u - 0.02));
  const b = bez(Math.min(1, u + 0.02));
  const dx = b[0] - a[0];
  const dz = b[2] - a[2];
  return { yaw: Math.atan2(dz, dx) / D2R, slope: Math.atan2(b[1] - a[1], Math.hypot(dx, dz)) / D2R };
};
const GLIDE_DIR = flightDir(G.enter + 4);

export const goosePoseAt = (f: number): GoosePose | null => {
  if (f < G.enter) return null;
  const flare = ss((f - G.flare) / (G.touch - G.flare));
  const fold = ss((f - (G.touch + 1)) / (G.folded - G.touch - 1));
  const landed = ss((f - G.touch) / 6);
  const dir = f < G.touch ? flightDir(Math.min(f, G.touch - 1)) : GLIDE_DIR;
  // it travels along its heading; on the stone it settles to its rest yaw
  const yaw = mix(mix(GLIDE_DIR.yaw, dir.yaw, 0.5), GOOSE_YAW, landed);
  const glidePitch = -Math.min(24, dir.slope) * 0.7;
  const pitch = mix(mix(glidePitch, 30, flare), 0, landed);
  const dip = f >= G.touch ? 3 * Math.sin(Math.PI * c01((f - G.touch) / 7)) : 0;
  const breathe = f >= G.folded ? 0.6 * Math.sin((f - G.folded) / 7) : 0;
  const shift = ss((f - G.shift) / 9) - 0.6 * ss((f - G.shift - 11) / 7);
  const turn = ss((f - G.turn) / 6) - 0.6 * ss((f - G.turn - 8) / 6);
  const glance = 0.5 * (1 - Math.cos(2 * Math.PI * c01((f - 112) / 18)));
  const raise = f < G.touch + 1 ? mix(20 + 4 * Math.sin((f - G.enter) / 2.6), 72, flare) : 72;
  return {
    pos: f >= G.touch ? [A3[0], A3[1], A3[2]] : bez(progAt(f)),
    yaw,
    pitch: pitch + breathe,
    wing: f < G.touch + 1 ? 1 : 1 - fold,
    raise,
    reach: mix(mix(1, 0.35, flare), 0, landed),
    leg: landed,
    legFwd: ss((f - (G.flare - 4)) / 7),
    headYaw: 34 * turn,
    headPitch: 6 * glance + 6 * turn,
    dip,
    lift: Math.sin(Math.PI * c01((f - G.shift - 2) / 9)),
    shift: 2.5 * shift,
  };
};
