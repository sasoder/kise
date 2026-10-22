// ---------------------------------------------------------------------------
// anotherPandemicFolkGoose: the greylag of AnotherPandemicRoad (kyle-pandemics, cut 47) in the picture-book GOUACHE
// hand of the V3 cast, take 2 (pandemicFolkSketch's goose: an S neck, a deep grey-brown body, a pale breast, scalloped
// rows on the folded wing, a white rump, the orange bill and feet; flat matte colour, one soft shadow shape per part,
// the gouache texture, a dot eye). It flies, flares, lands (CONTACT f91) and folds exactly as before: its pose is
// anotherPandemicGoose's goosePoseAt and its body frame / wing kinematics are that file's (copied here), projected
// through the cut's one camera, so it keeps its place in the scene's perspective; only the drawing is new.
// The disease: a soft orange stain inside the breast and body (in the same texture), the orange bill and feet.
// <FolkGoose c pose fog />   (screen px; fog = the air behind it and the amount, as the cut computes for Goose3D)
// ---------------------------------------------------------------------------
import React from "react";
import { type GoosePose } from "./anotherPandemicGoose";
import { proj, type Cam3 } from "./anotherPandemicWorld";
import { FolkLayer, mapD, mixC, type FPart } from "./pandemicFolkAnimals";

type V3 = [number, number, number];
type V2 = [number, number];
const D2R = Math.PI / 180;
const GS = 1.3;
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sc3 = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
const lerp3 = (a: V3, b: V3, t: number): V3 => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];
const lerp2 = (a: V2, b: V2, t: number): V2 => [mix(a[0], b[0], t), mix(a[1], b[1], t)];
const r1 = (v: number) => (Math.round(v * 10) / 10).toString();
const P2s = (p: V2[]) => `M ${p.map((q) => `${r1(q[0])} ${r1(q[1])}`).join(" L ")} Z`;

// ---- the body frame and the wings (anotherPandemicGoose, unchanged) ------------------------------------------------
const BODY_C: V3 = [-2, 28, 0];
const frameOf = (p: GoosePose) => {
  const ps = p.yaw * D2R;
  const th = p.pitch * D2R;
  const Fw: V3 = [Math.cos(ps), 0, Math.sin(ps)];
  const Uw: V3 = [0, -1, 0];
  const Lw: V3 = [-Math.sin(ps), 0, Math.cos(ps)];
  const Fp = add(sc3(Fw, Math.cos(th)), sc3(Uw, Math.sin(th)));
  const Up = add(sc3(Uw, Math.cos(th)), sc3(Fw, -Math.sin(th)));
  return (l: V3, onBody = true): V3 => {
    if (!onBody) return add(p.pos, sc3(add(add(sc3(Fw, l[0]), sc3(Uw, l[1])), sc3(Lw, l[2])), GS));
    const q: V3 = [l[0] - BODY_C[0] + p.shift, l[1] - BODY_C[1] - p.dip, l[2]];
    const w = add(add(sc3(Fp, q[0]), sc3(Up, q[1])), sc3(Lw, q[2]));
    const c = add(sc3(Fw, BODY_C[0]), sc3(Uw, BODY_C[1]));
    return add(p.pos, sc3(add(c, w), GS));
  };
};
const SH: V3 = [12, 42, 9];
const WING_SPREAD: V3[] = [
  [12, 42, 9],
  [16, 43, 26],
  [12, 44, 44],
  [-2, 44, 66],
  [-18, 44, 88],
  [-25, 44, 85],
  [-31, 44, 80],
  [-36, 44, 73],
  [-39, 44, 65],
  [-37, 43, 44],
  [-31, 43, 30],
  [-22, 42, 15],
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
    const raised: V3 = [sp[0], SH[1] + dy * Math.cos(ra) + dz * Math.sin(ra), SH[2] + dz * Math.cos(ra) - dy * Math.sin(ra)];
    const l = lerp3(WING_FOLD[i], raised, p.wing);
    return [l[0], l[1], l[2] * side];
  });
};
/** an ellipsoid (centre, three semi-axis vectors, world) as a screen ellipse (the camera's local Jacobian) */
const ellipseOf = (c: Cam3, C: V3, axes: V3[]) => {
  const p0 = proj(c, C[0], C[1], C[2]);
  const J = (v: V3): V2 => {
    const q = proj(c, C[0] + v[0], C[1] + v[1], C[2] + v[2]);
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
  return { cx: p0.x, cy: p0.y, rx: Math.sqrt(m + q), ry: Math.sqrt(Math.max(0.01, m - q)), rot: ang, d: p0.d };
};
type Ell = ReturnType<typeof ellipseOf>;
/** an ellipse as cubic beziers (so the layer's point maps keep it exact) */
const ellPath = (e: Ell, k = 1) => {
  const K = 0.5523;
  const ca = Math.cos(e.rot);
  const sa = Math.sin(e.rot);
  const P = (x: number, y: number): string => {
    const X = e.cx + (x * ca - y * sa) * k;
    const Y = e.cy + (x * sa + y * ca) * k;
    return `${r1(X)} ${r1(Y)}`;
  };
  const a = e.rx;
  const b = e.ry;
  return `M ${P(a, 0)} C ${P(a, b * K)} ${P(a * K, b)} ${P(0, b)} C ${P(-a * K, b)} ${P(-a, b * K)} ${P(-a, 0)} C ${P(-a, -b * K)} ${P(-a * K, -b)} ${P(0, -b)} C ${P(a * K, -b)} ${P(a, -b * K)} ${P(a, 0)} Z`;
};
/** a smooth closed outline through points (cubic Catmull-Rom) */
const smoothC = (ring: V2[]) => {
  const n = ring.length;
  let d = `M ${r1(ring[0][0])} ${r1(ring[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = ring[(i - 1 + n) % n];
    const p1 = ring[i];
    const p2 = ring[(i + 1) % n];
    const p3 = ring[(i + 2) % n];
    d += ` C ${r1(p1[0] + (p2[0] - p0[0]) / 6)} ${r1(p1[1] + (p2[1] - p0[1]) / 6)} ${r1(p2[0] - (p3[0] - p1[0]) / 6)} ${r1(p2[1] - (p3[1] - p1[1]) / 6)} ${r1(p2[0])} ${r1(p2[1])}`;
  }
  return `${d} Z`;
};

/** the sketch's inks */
export const GOOSE_INKS = { body: "#958B7B", back: "#756B5D", back2: "#6A6053", back3: "#5E5549", prim: "#4F473D", under: "#A39A8A", breast: "#B7AD9C", neck: "#8A8072", head: "#7F7669", rump: "#F1EBDF", nail: "#F3E7CC", eye: "#211813", orange: "#FFB000", orangeDk: "#D98A0C" };

export const FolkGoose: React.FC<{ c: Cam3; pose: GoosePose; fog?: { rgb: [number, number, number]; amt: number }; uid?: string }> = ({ c, pose, fog, uid = "fg" }) => {
  const W = frameOf(pose);
  const P = (l: V3, onBody = true) => {
    const w = W(l, onBody);
    return proj(c, w[0], w[1], w[2]);
  };
  const P2 = (l: V3, onBody = true): V2 => {
    const q = P(l, onBody);
    return [q.x, q.y];
  };
  const fogHex = fog ? `#${fog.rgb.map((v) => Math.round(v * 255).toString(16).padStart(2, "0")).join("")}` : "#5F877D";
  const F = (h: string, extra = 0) => (fog ? mixC(h, fogHex, Math.min(0.92, fog.amt + extra)) : h);
  const I = GOOSE_INKS;
  const axis = (v: V3): V3 => {
    const a = W(v);
    const o = W([0, 0, 0]);
    return [a[0] - o[0], a[1] - o[1], a[2] - o[2]];
  };
  const tiltX = (deg: number, len: number): V3 => [Math.cos(deg * D2R) * len, Math.sin(deg * D2R) * len, 0];
  const tiltY = (deg: number, len: number): V3 => [-Math.sin(deg * D2R) * len, Math.cos(deg * D2R) * len, 0];
  const ell = (cl: V3, ax: V3[]) => ellipseOf(c, W(cl), ax.map(axis));
  const ref = P([0, 34, 0]);
  const px = ref.s * GS;
  // ---- the body (one silhouette from three ellipsoids), the tail, the pale breast, the white rump
  const body = ell([-4, 28, 0], [tiltX(-4, 30), tiltY(-4, 13.5), [0, 0, 14]]);
  const breastE = ell([13, 26.5, 0], [tiltX(-28, 15), tiltY(-28, 12.5), [0, 0, 12.5]]);
  const rear = ell([-22, 28, 0], [tiltX(10, 14), tiltY(10, 10.5), [0, 0, 11.5]]);
  const tail = ell([-34, 32, 0], [tiltX(14, 10), tiltY(14, 3.8), [0, 0, 7.5]]);
  const breast = ell([12, 24, 0], [tiltX(-28, 13), tiltY(-28, 10), [0, 0, 11]]);
  const rump = ell([-34, 25, 0], [tiltX(28, 7), tiltY(28, 2.4), [0, 0, 5]]);
  const bodyD = `${ellPath(rear)} ${ellPath(body)} ${ellPath(breastE)}`;
  // ---- the S neck: a tapered tube from inside the breast to the head
  const head0: V3 = [mix(24, 62, pose.reach), mix(70, 42, pose.reach), 0];
  const ctrl: V3 = [mix(25, 44, pose.reach), mix(52, 40, pose.reach), 0];
  const base: V3 = [18, 34, 0];
  const quad = (t: number): V3 => lerp3(lerp3(base, ctrl, t), lerp3(ctrl, head0, t), t);
  const N = 14;
  const Lp: V2[] = [];
  const Rp: V2[] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const a = P(quad(Math.max(0, t - 0.03)));
    const b = P(quad(Math.min(1, t + 0.03)));
    const m = P(quad(t));
    const tx = b.x - a.x;
    const ty = b.y - a.y;
    const tl = Math.hypot(tx, ty) || 1;
    const r = mix(7.6, 4.2, Math.pow(Math.min(1, t / 0.7), 0.8)) * m.s * GS;
    Lp.push([m.x - (ty / tl) * r, m.y + (tx / tl) * r]);
    Rp.push([m.x + (ty / tl) * r, m.y - (tx / tl) * r]);
  }
  const neckD = P2s([...Lp, ...Rp.slice().reverse()]);
  // ---- the head, the bill, the eye
  const hp = (mix(-12, 0, pose.reach) + pose.headPitch) * D2R;
  const hy = pose.headYaw * D2R;
  const hd: V3 = [Math.cos(hp) * Math.cos(hy), Math.sin(hp), -Math.cos(hp) * Math.sin(hy)];
  const hu: V3 = [-Math.sin(hp) * Math.cos(hy), Math.cos(hp), Math.sin(hp) * Math.sin(hy)];
  const hs: V3 = [Math.sin(hy), 0, Math.cos(hy)];
  const H = (f: number, u: number, s: number): V3 => add(add(add(head0, sc3(hd, f)), sc3(hu, u)), sc3(hs, s));
  const headE = ell(H(1.2, 0.8, 0), [sc3(hd, 8.2), sc3(hu, 5.6), sc3(hs, 4.8)]);
  const bill = [H(6.3, 3.0, 0), H(13, 2.0, 0), H(19.8, 0.4, 0), H(19.4, -1.0, 0), H(13, -1.4, 0), H(6.3, -2.6, 0)].map((l) => P2(l));
  const billSide = [H(6.3, 0.2, 2.8), H(19, 0.2, 0.9), H(6.3, 0.2, -2.8)].map((l) => P2(l));
  const billD = smoothC([bill[0], bill[1], billSide[1], bill[2], bill[3], bill[4], bill[5], billSide[0]]);
  const nail = P2(H(19.4, 0.2, 0));
  const eyeL = P(H(3, 1.9, 4.2));
  const eyeR = P(H(3, 1.9, -4.2));
  const eye = eyeL.d < eyeR.d ? eyeL : eyeR;
  const eyeSide = (eyeL.d < eyeR.d ? 1 : -1) as 1 | -1;
  // ---- the legs and webbed feet
  const legOf = (side: 1 | -1, isFar: boolean): { d: number; parts: FPart[] } => {
    const hip: V3 = [1, 17, 5 * side];
    const hipW = P2(hip);
    const stand: V3 = [2 + pose.shift * 0.4, isFar ? 5 * pose.lift : 0, 5.5 * side];
    const tuck: V3 = [-14, 24, 4 * side];
    const fwd: V3 = [13, 5, 5 * side];
    const air = lerp3(tuck, fwd, pose.legFwd);
    const footL = lerp3(air, stand, pose.leg);
    const onBody = pose.leg < 0.5;
    const foot = P(footL, onBody);
    const toe = (dx: number, dz: number) => P2(add(footL, [dx, 0, dz]), onBody);
    const vis = c01((pose.leg + pose.legFwd) * 1.6);
    if (vis < 0.02) return { d: foot.d, parts: [] };
    const w = Math.max(2.4, 3.4 * px);
    const dx = foot.x - hipW[0];
    const dy = foot.y - hipW[1];
    const l = Math.hypot(dx, dy) || 1;
    const nx = (-dy / l) * w * 0.5;
    const ny = (dx / l) * w * 0.4;
    const leg = P2s([[hipW[0] + nx, hipW[1] + ny], [foot.x + nx * 0.8, foot.y + ny * 0.8], [foot.x - nx * 0.8, foot.y - ny * 0.8], [hipW[0] - nx, hipW[1] - ny]]);
    const web = smoothC([[foot.x, foot.y], toe(9, 3.4), toe(11, 0), toe(9, -3.4)]);
    const ink = F(isFar ? I.orangeDk : I.orange, -0.2);
    return { d: foot.d, parts: [{ d: leg, fill: ink, sh: 0.3, op: vis }, { d: web, fill: ink, sh: 0.3, op: vis }] };
  };
  // ---- the wings: the arm with its scalloped feather rows (upper side), long separate primaries
  const wingOf = (side: 1 | -1): { d: number; parts: FPart[] } => {
    const L = wingLocal(pose, side);
    const S2 = L.map((l) => P2(l));
    const depth = P(L[3]).d;
    const w0 = W(L[0]);
    const w2 = W(L[2]);
    const w10 = W(L[10]);
    const e1: V3 = [w2[0] - w0[0], w2[1] - w0[1], w2[2] - w0[2]];
    const e2: V3 = [w10[0] - w0[0], w10[1] - w0[1], w10[2] - w0[2]];
    const n: V3 = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
    const view: V3 = [w0[0] - c.X, w0[1] - c.eye, w0[2] - c.Z];
    const upper = (n[0] * view[0] + n[1] * view[1] + n[2] * view[2]) * side < 0 || pose.wing < 0.35;
    const isFar = side === eyeSide * -1;
    const ex = isFar ? 0.08 : 0;
    const h0 = S2[3];
    const h1 = lerp2(S2[2], S2[9], 0.82);
    const parts: FPart[] = [];
    [4, 5, 6, 7, 8].forEach((ti, k) => {
      const bA = lerp2(h0, h1, k / 5);
      const bB = lerp2(h0, h1, Math.min(1, (k + 2.2) / 5));
      const tip = S2[ti];
      const mA = lerp2(bA, tip, 0.62);
      const mB = lerp2(bB, tip, 0.62);
      const qA: V2 = [mA[0] + (mA[0] - mB[0]) * 0.12, mA[1] + (mA[1] - mB[1]) * 0.12];
      const qB: V2 = [mB[0] + (mB[0] - mA[0]) * 0.12, mB[1] + (mB[1] - mA[1]) * 0.12];
      parts.push({ d: smoothC([bA, qA, tip, qB, bB]), fill: F(upper ? I.prim : I.back2, ex), sh: 0.4 });
    });
    const arm = [S2[0], S2[1], S2[2], S2[3], lerp2(h0, h1, 0.5), h1, S2[9], S2[10], S2[11]];
    parts.push({ d: smoothC(arm), fill: F(upper ? I.back : I.under, ex), sh: 0.8 });
    if (upper) {
      // three scalloped rows, darker toward the trailing edge, each a band whose trailing edge is round scallops
      const rows = [
        { t0: 0.34, t1: 0.58, ink: I.back2 },
        { t0: 0.56, t1: 0.8, ink: I.back3 },
        { t0: 0.78, t1: 1.0, ink: I.back3 },
      ];
      rows.forEach((rw, ri) => {
        const A0 = lerp2(S2[1], S2[11], rw.t0);
        const B0 = lerp2(S2[3], S2[9], rw.t0 * 0.95);
        const A1 = lerp2(S2[1], S2[11], rw.t1);
        const B1 = lerp2(S2[3], S2[9], rw.t1 * 0.95);
        const nS = 5;
        const pts: V2[] = [];
        for (let k = 0; k <= nS; k++) pts.push(lerp2(A0, B0, k / nS));
        for (let k = nS; k >= 0; k--) {
          const q = lerp2(A1, B1, k / nS);
          pts.push(q);
          if (k > 0) {
            const q2 = lerp2(A1, B1, (k - 0.5) / nS);
            const tr: V2 = [A1[0] - A0[0], A1[1] - A0[1]];
            pts.push([q2[0] + tr[0] * 0.45, q2[1] + tr[1] * 0.45]);
          }
        }
        parts.push({ d: smoothC(pts), fill: F(rw.ink, ex), sh: ri === 0 ? 0.6 : 0.5 });
      });
    }
    return { d: depth, parts };
  };
  const legA = legOf(1, eyeSide === -1);
  const legB = legOf(-1, eyeSide === 1);
  const wingA = wingOf(1);
  const wingB = wingOf(-1);
  const [farWing, nearWing] = wingA.d > wingB.d ? [wingA, wingB] : [wingB, wingA];
  const legs = [legA, legB].sort((a, b) => b.d - a.d);
  // the stain: soft orange in the breast and body (the disease, carried inside it)
  // the infection (approved look, r2): a small, deep soft orange stain on the breast, with fine orange threads and
  // specks spreading from it into the grey-brown feathers (it reads "infected", not "yellow-bellied")
  const SC: V3 = [14, 24, 0];
  const stains = ([[14, 24, 0, 1], [9, 22.5, -2, 0.6]] as const).map(([x, y, z, k]) => ({ p: P([x, y, z]), k }));
  const stainR = 7.5 * px;
  const threadPaths: { d: string; w: number; ink: string }[] = [];
  const TH: [number, number, number][] = [
    [-10, 4, 15],
    [-6, -5, 13],
    [4, 6, 11],
    [-14, 0, 17],
    [6, -4, 9],
    [-2, 8, 12],
    [-9, -8, 14],
  ];
  TH.forEach(([dx, dy, len], i) => {
    const l = Math.hypot(dx, dy) || 1;
    const ux = dx / l;
    const uy = dy / l;
    const pts: V2[] = [];
    for (let k = 0; k <= 8; k++) {
      const t = k / 8;
      const wig = 1.3 * Math.sin(t * 5.2 + i * 1.7) * t;
      pts.push(P2([SC[0] + ux * (3 + len * t) - uy * wig, SC[1] + uy * (3 + len * t) + ux * wig, 0]));
    }
    threadPaths.push({ d: `M ${pts.map((q) => `${r1(q[0])} ${r1(q[1])}`).join(" L ")}`, w: Math.max(0.6, (i % 3 === 0 ? 0.55 : 0.4) * px), ink: i % 2 ? I.orange : I.orangeDk });
  });
  const specks = Array.from({ length: 16 }, (_, i) => {
    const a = (i * 2.399963) % (Math.PI * 2);
    const r = 6 + ((i * 0.618) % 1) * 12;
    return { p: P2([SC[0] + Math.cos(a) * r * 1.2, SC[1] + Math.sin(a) * r * 0.7, 0]), r: Math.max(0.6, (0.35 + 0.3 * ((i * 0.37) % 1)) * px) };
  });
  // the texture locked to the goose: its parts are given in the frame of its body centre, at its own scale
  const o = P([0, 28, 0]);
  const s = Math.max(0.05, px);
  const loc = (d: string) => mapD(d, (q) => [(q[0] - o.x) / s, (q[1] - o.y) / s]);
  const L = (p: FPart): FPart => ({ ...p, d: loc(p.d) });
  // behind the stain: the far wing and leg, the neck, the tail, the body, its breast and rump; in front of it: the near
  // leg and wing, the head and bill (two layers in the same texture frame, so the grain runs on across them)
  const back: FPart[] = [
    ...farWing.parts,
    ...legs[0].parts,
    { d: neckD, fill: F(I.neck), sh: 0.8 },
    { d: ellPath(tail), fill: F(I.back3), sh: 0.4 },
    { d: bodyD, fill: F(I.body) },
    { d: ellPath(breast), fill: F(mixC(I.breast, I.body, 0.6)), sh: 0 },
    { d: ellPath(rump), fill: F(I.rump, -0.1), sh: 0.3 },
  ].map(L);
  const front: FPart[] = [
    ...legs[1].parts,
    ...nearWing.parts,
    { d: ellPath(headE), fill: F(I.head) },
    { d: billD, fill: F(I.orange, -0.2), sh: 0.5 },
    { d: ellPath({ cx: nail[0], cy: nail[1], rx: Math.max(1, 1.1 * px), ry: Math.max(0.8, 0.8 * px), rot: 0, d: 0 }), fill: F(I.nail), sh: 0 },
    { d: ellPath({ cx: eye.x, cy: eye.y, rx: Math.max(1.2, 1.25 * px), ry: Math.max(1.4, 1.45 * px), rot: 0, d: 0 }), fill: I.eye, sh: 0 },
  ].map(L);
  const bodyLocal = loc(bodyD);
  const fr = { x: o.x, y: o.y, a: 0, s };
  return (
    <g>
      <FolkLayer uid={`${uid}b`} parts={back} pxPerUnit={s} frame={fr}>
        <defs>
          <clipPath id={`${uid}-bc`}>
            <path d={bodyLocal} />
          </clipPath>
          <radialGradient id={`${uid}-st`}>
            <stop offset="0" stopColor={I.orangeDk} stopOpacity={0.9} />
            <stop offset="0.45" stopColor={I.orange} stopOpacity={0.6} />
            <stop offset="1" stopColor={I.orange} stopOpacity={0} />
          </radialGradient>
        </defs>
        <g clipPath={`url(#${uid}-bc)`}>
          {stains.map((q, k) => (
            <circle key={k} cx={(q.p.x - o.x) / s} cy={(q.p.y - o.y) / s} r={(stainR * q.k) / s} fill={`url(#${uid}-st)`} />
          ))}
          {threadPaths.map((t, k) => (
            <path key={`t${k}`} d={loc(t.d)} fill="none" stroke={t.ink} strokeWidth={t.w / s} strokeLinecap="round" strokeLinejoin="round" opacity={0.9} />
          ))}
          {specks.map((q, k) => (
            <circle key={`s${k}`} cx={(q.p[0] - o.x) / s} cy={(q.p[1] - o.y) / s} r={q.r / s} fill={k % 3 ? I.orange : I.orangeDk} opacity={0.85} />
          ))}
        </g>
      </FolkLayer>
      <FolkLayer uid={`${uid}f`} parts={front} pxPerUnit={s} frame={fr} />
    </g>
  );
};
