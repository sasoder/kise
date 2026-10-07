// ---------------------------------------------------------------------------
// breakTurnFigure: Moctezuma TURNING on his string (local to BreakTurnPuppet;
// the shared strings world is frozen and used as-is). The shared Emperor is a
// frontal figure; this one is the same man, same rig (stringsMotion's
// emperorRig), same engraved manner, drawn at any angle of a turn about the
// vertical through his feet: 0 = facing us (identical to the shared figure),
// pi / 2 = edge-on, facing screen right, pi = his BACK to us.
//   - the body is a volume, not a card: its silhouette narrows to its depth
//     (an ellipse 60 x 32), and everything drawn ON it (the neckline, the
//     folds, hatching, the hem's band) is carried round that ellipse and piles
//     up at the edge it goes over; the limbs keep their thickness and only
//     their joints move; the far arm tucks behind the body, the near one
//     crosses in front of it;
//   - the back view is its own art: the hair falling to the shoulders, the
//     diadem's band tied behind with two hanging ends and its point rising
//     beyond the crown, the tilmatli from behind with its knot on the shoulder
//     and long folds to the hem, the bare shoulder blade, elbows, calves, heels;
//   - the head has its own angle (it leads the body), the hem its own (it lags)
//     and a flare (it swings out).
// Draw inside a WorldSvg (world px).
// ---------------------------------------------------------------------------
import React from "react";
import { DARK, INK, hash, type P2 } from "./incaShared";
import { EMPEROR_AT, HEAD_SCALE, add, emperorRig, mix, mix2, mul, norm, rot, sub, vlen, type EmperorPose } from "./stringsShared";

const C_MAIN = INK;
const C_DEEP = "#D3C5A2";
const C_HAIR = "#8C7F60";

/** the body's half-width and half-depth (figure px) */
const BODY_A = 60;
const BODY_B = 32;
/** the head: how far in front of its middle the face and the diadem's plate sit, how far behind the tie */
const FACE_Z = 21;
const PLATE_Z = 20;
const TIE_Z = 23;

export type Turn = {
  /** the body's angle (rad): 0 front, pi back */
  body: number;
  /** the head's angle */
  head: number;
  /** the hem's angle (it lags the body) */
  hem: number;
  /** the hem's flare, 0..~0.15 of its width */
  flare: number;
  /** 0..1 the head tipped back to look up (it reads from behind) */
  look: number;
};
export const NO_TURN: Turn = { body: 0, head: 0, hem: 0, flare: 0, look: 0 };

const P = (v: P2) => `${v[0].toFixed(1)},${v[1].toFixed(1)}`;
const OUT = { stroke: DARK, strokeWidth: 2.3, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
const ln = (w = 1.2, a = 0.8) => ({ fill: "none", stroke: DARK, strokeWidth: w, strokeOpacity: a, strokeLinecap: "round" as const, strokeLinejoin: "round" as const });
type Seg = [P2, P2];
type Map = (p: P2) => P2;
const segD = (segs: Seg[], m: Map) =>
  segs
    .map(([a, b]) => {
      const p = m(a);
      const q = m(b);
      return Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]) < 0.8 ? "" : `M${P(p)}L${P(q)}`;
    })
    .join("");

/** hand-cut hatching (stringsFigures' hatchD, as segments so they can be carried round the form) */
const hatchSegs = (x0: number, y0: number, x1: number, y1: number, ang: number, gap: number, seed: number, rag = 0.28): Seg[] => {
  const r = (ang * Math.PI) / 180;
  const dx = Math.cos(r);
  const dy = Math.sin(r);
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const R = Math.hypot(x1 - x0, y1 - y0) / 2;
  const out: Seg[] = [];
  let i = 0;
  for (let o = -R; o <= R; o += gap, i++) {
    const oo = o + (hash(i, seed) - 0.5) * gap * 0.5;
    const px = cx - dy * oo;
    const py = cy + dx * oo;
    let t0 = -R;
    let t1 = R;
    if (Math.abs(dx) > 1e-6) {
      const a = (x0 - px) / dx;
      const b = (x1 - px) / dx;
      t0 = Math.max(t0, Math.min(a, b));
      t1 = Math.min(t1, Math.max(a, b));
    } else if (px < x0 || px > x1) continue;
    if (Math.abs(dy) > 1e-6) {
      const a = (y0 - py) / dy;
      const b = (y1 - py) / dy;
      t0 = Math.max(t0, Math.min(a, b));
      t1 = Math.min(t1, Math.max(a, b));
    } else if (py < y0 || py > y1) continue;
    const span = t1 - t0;
    if (span < 3) continue;
    t0 += hash(i, seed + 7) * rag * span;
    t1 -= hash(i, seed + 13) * rag * span;
    out.push([
      [px + dx * t0, py + dy * t0],
      [px + dx * t1, py + dy * t1],
    ]);
  }
  return out;
};
const ID: Map = (p) => p;
const hatchD = (x0: number, y0: number, x1: number, y1: number, ang: number, gap: number, seed: number, rag = 0.28) => segD(hatchSegs(x0, y0, x1, y1, ang, gap, seed, rag), ID);
const smoothClosed = (pts: P2[]) => {
  const n = pts.length;
  let d = `M${P(pts[0])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    d += `C${P([p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6])} ${P([p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6])} ${P(p2)}`;
  }
  return `${d}Z`;
};
type St = [P2, number];
const limbD = (st: St[]) => {
  const n = st.length;
  const L: P2[] = [];
  const R: P2[] = [];
  let last: P2 = [0, 1];
  for (let i = 0; i < n; i++) {
    const a = st[Math.max(0, i - 1)][0];
    const b = st[Math.min(n - 1, i + 1)][0];
    const dv = sub(b, a);
    const u = vlen(dv) > 0.5 ? norm(dv) : last;
    last = u;
    const nr: P2 = [-u[1], u[0]];
    const h = st[i][1] / 2;
    L.push(add(st[i][0], mul(nr, h)));
    R.push(add(st[i][0], mul(nr, -h)));
  }
  const d0 = sub(st[1][0], st[0][0]);
  const d1 = sub(st[n - 1][0], st[n - 2][0]);
  const u0: P2 = vlen(d0) > 0.5 ? norm(d0) : [0, 1];
  const u1: P2 = vlen(d1) > 0.5 ? norm(d1) : [0, 1];
  return smoothClosed([...L, add(st[n - 1][0], mul(u1, st[n - 1][1] * 0.42)), ...R.reverse(), add(st[0][0], mul(u0, -st[0][1] * 0.42))]);
};
const bones = (S: P2, E: P2, W: P2, w: [number, number, number, number, number]): St[] => [
  [S, w[0]],
  [mix2(S, E, 0.42), w[1]],
  [E, w[2]],
  [mix2(E, W, 0.36), w[3]],
  [W, w[4]],
];
const braceletD = (a: P2, b: P2, wa: number, wb: number, seed: number, gap = 3.1, reach = 1) => {
  const L = vlen(sub(b, a));
  if (L < 9) return "";
  const u = norm(sub(b, a));
  let n: P2 = [-u[1], u[0]];
  if (n[0] + n[1] * 0.6 < 0) n = [-n[0], -n[1]];
  let d = "";
  let i = 0;
  for (let t = 4; t < L - 3; t += gap, i++) {
    const tt = t / L;
    const c = mix2(a, b, tt);
    const w = mix(wa, wb, tt);
    const p0 = add(c, mul(n, w * (0.5 - reach * (0.44 - 0.2 * hash(i, seed)))));
    const p1 = add(c, mul(n, w / 2 - 0.7));
    d += `M${P(p0)}Q${P(add(mix2(p0, p1, 0.5), mul(u, 1.7)))} ${P(p1)}`;
  }
  return d;
};
const quad = (a: P2, c: P2, b: P2, t: number): P2 => mix2(mix2(a, c, t), mix2(c, b, t), t);
const foldHatchSegs = (a: P2, c: P2, b: P2, seed: number, len = 11, step = 0.04): Seg[] => {
  const out: Seg[] = [];
  let i = 0;
  for (let t = 0.16; t < 0.97; t += step, i++) {
    const p = quad(a, c, b, t);
    const l = (2.5 + len * t) * (0.55 + 0.75 * hash(i, seed));
    out.push([p, [p[0] + l * 0.86, p[1] + l * 0.5]]);
  }
  return out;
};
const clamp1 = (v: number) => Math.max(-1, Math.min(1, v));
const c01 = (v: number) => Math.max(0, Math.min(1, v));

// ---------------------------------------------------------------------------
// THE TURNED FORM: carrying the art round the body's ellipse
// ---------------------------------------------------------------------------
const surface = (theta: number) => {
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  const flat = Math.abs(s) < 1e-9;
  const A = Math.hypot(BODY_A * c, BODY_B * s);
  const wf = A / BODY_A;
  const term = Math.atan2(BODY_A * c, BODY_B * s); // where the surface goes over the edge
  const front = c >= 0;
  /** a point of the FRONT surface, given as drawn from the front */
  const mF: Map = (p) => {
    if (flat && front) return p;
    const xc = clamp1(p[0] / BODY_A) * BODY_A;
    const ph = Math.min(Math.asin(xc / BODY_A), term);
    return [BODY_A * Math.sin(ph) * c + BODY_B * Math.cos(ph) * s + (p[0] - xc) * wf, p[1]];
  };
  /** a point of the BACK surface, given as drawn from behind */
  const mB: Map = (p) => {
    if (flat && !front) return p;
    const xc = clamp1(p[0] / BODY_A) * BODY_A;
    const ps = Math.max(Math.asin(xc / BODY_A), term);
    return [-BODY_A * Math.sin(ps) * c - BODY_B * Math.cos(ps) * s + (p[0] - xc) * wf, p[1]];
  };
  /** a point of the silhouette (front coordinates): it keeps its side of the figure */
  const side: Map = (p) => [p[0] * (front ? wf : -wf), p[1]];
  /** a joint on the body's axis plane: it goes round with the body */
  const joint: Map = (p) => [p[0] * c, p[1]];
  /** the surface seen: front art from the front, the same art mirrored from behind */
  const surf: Map = (p) => (front ? mF(p) : mB([-p[0], p[1]]));
  return { c, s, wf, front, mF, mB, side, joint, surf };
};

type Arm = { S: P2; E: P2; W: P2; dir: P2; fist: number; sgn: number; grip: P2 };
/** the rig, turned: joints, anchors, the head */
export const turnRig = (pose: EmperorPose, t: Turn) => {
  const r = emperorRig(pose, "aztec");
  const sf = surface(t.body);
  const arm = (a: Arm): Arm => {
    const S = sf.joint(a.S);
    const E = sf.joint(a.E);
    const W = sf.joint(a.W);
    const dv: P2 = [a.dir[0] * sf.c, a.dir[1]];
    const dir: P2 = vlen(dv) > 0.2 ? norm(dv) : [0, 1];
    return { S, E, W, dir, fist: a.fist, sgn: sf.front ? a.sgn : -a.sgn, grip: add(W, mul(dir, 10)) };
  };
  const ch = Math.cos(t.head);
  const sh = Math.sin(t.head);
  const headC = sf.joint(r.headC);
  const headAngle = r.headAngle * ch;
  const plateTip = -21 - 32 * (1 - 0.45 * t.look);
  const tipLocal: P2 = [PLATE_Z * sh, plateTip * (1 - 0.1 * t.look) + 5 * t.look];
  return {
    r,
    sf,
    armL: arm(r.armL),
    armR: arm(r.armR),
    headC,
    headAngle,
    neck: sf.joint(r.neck),
    headTop: add(headC, rot(mul(tipLocal, HEAD_SCALE), headAngle)),
    ch,
    sh,
  };
};
/** his anchors in WORLD px at this turn (L / R are HIS arms as named in the frontal figure: at pi they have changed sides) */
export const turnAnchors = (pose: EmperorPose, t: Turn, at: P2 = EMPEROR_AT) => {
  const q = turnRig(pose, t);
  const w = (v: P2): P2 => add(at, v);
  return {
    fistL: w(q.armL.grip),
    fistR: w(q.armR.grip),
    wristL: w(add(q.armL.W, [0, -7])),
    wristR: w(add(q.armR.W, [0, -7])),
    headTop: w(q.headTop),
    c: q.sf.c,
  };
};

// ---------------------------------------------------------------------------
// THE HAND (stringsFigures' EmperorHand)
// ---------------------------------------------------------------------------
const Hand: React.FC<{ a: Arm }> = ({ a }) => {
  const { W, dir: d, fist: f, sgn } = a;
  const n: P2 = [-d[1], d[0]];
  const open = 1 - f;
  const at = (along: number, across: number): P2 => add(W, add(mul(d, along), mul(n, across)));
  const ts = n[0] * -sgn >= 0 ? 1 : -1;
  const fingers = [0, 1, 2, 3].map((j) => {
    const b = at(13.5, (j - 1.5) * 4.9);
    const fd = rot(d, (j - 1.5) * 5 * open * ts);
    const L = 3 + [12.5, 15.5, 14.5, 11][ts > 0 ? j : 3 - j] * open;
    return limbD([
      [add(b, mul(fd, -3)), 5.3],
      [add(b, mul(fd, L * 0.55)), 5],
      [add(b, mul(fd, L)), 4],
    ]);
  });
  const tb = at(6, ts * 8);
  const td = rot(d, ts * (12 + 30 * open));
  const thumb = limbD([
    [add(tb, mul(td, -4)), 6.4],
    [add(tb, mul(td, 3 + 4 * open)), 5.6],
    [add(tb, mul(td, 6 + 8 * open)), 4.4],
  ]);
  const palm = smoothClosed([at(0, -8), at(7, -10.4), at(14.5, -9.8), at(16.5, 0), at(14.5, 9.8), at(7, 10.4), at(0, 8)]);
  return (
    <g>
      {fingers.map((fd, j) => (
        <path key={j} d={fd} fill={C_MAIN} {...OUT} strokeWidth={1.9} />
      ))}
      <path d={palm} fill={C_MAIN} {...OUT} strokeWidth={2} />
      <path d={braceletD(at(1, 0), at(15, 0), 19, 19, 91, 2.8)} {...ln(0.9, 0.5)} />
      <path d={thumb} fill={C_MAIN} {...OUT} strokeWidth={1.9} />
      {f > 0.5 ? <path d={[-1, 0, 1].map((j) => `M${P(at(9.5, j * 4.9))}L${P(at(16, j * 4.9))}`).join("")} {...ln(1.2, 0.75 * (f - 0.5) * 2)} /> : null}
      <path d={limbD([[at(-3.4, -8.2), 5], [at(-3.4, 8.2), 5]])} fill={C_DEEP} {...OUT} strokeWidth={1.9} />
      <path d={`M${P(at(-3.4, -4))}L${P(at(-3.4, 4))}`} {...ln(0.9, 0.55)} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE HEAD, at any angle (head-local units: (0, 0) = the middle of the face)
// ---------------------------------------------------------------------------
const FACE = "M0,-24C-15,-24 -19.5,-12 -19.5,0C-19.5,11 -12,24 0,26.4C12,24 19.5,11 19.5,0C19.5,-12 15,-24 0,-24Z";
const PLATE = "M-15.5,-21L-1,-52Q0,-53.5 1,-52L15.5,-21Q0,-25.5 -15.5,-21Z";
const Head: React.FC<{ ch: number; sh: number; nod: number; look: number; uid: string }> = ({ ch, sh, nod, look, uid }) => {
  const fy = 5 * nod;
  const open = 1 - nod;
  const y = (v: number, k = 1) => (v + fy * k).toFixed(1);
  const brow = (s: number) => `M${s * 14},${y(-6.6 + 2.8 * nod)}Q${s * 8.5},${y(-9.6 + nod)} ${s * 2.8},${y(-5 - 3.2 * nod)}`;
  const lid = (s: number) => `M${s * 13},${y(-0.4)}Q${s * 8},${y(-0.4 - 4.2 * open + 2.8 * nod)} ${s * 3.6},${y(0)}`;
  const under = (s: number) => `M${s * 12},${y(0.6)}Q${s * 8},${y(2.6)} ${s * 4.4},${y(0.8)}`;
  const back = c01(-ch); // 0 front .. 1 full back
  const turned = Math.max(c01(Math.abs(sh) * 3), back);
  const wfH = Math.hypot(ch, 0.9 * sh);
  // the hair: cut at the jaw in front, falling to the shoulders behind
  const away = c01(0.5 - ch * 0.7);
  const hb = mix(32, 40, away);
  const hw = mix(21, 25, away);
  const crown = mix(-30, -38, turned);
  const teeth = Array.from({ length: 7 }, (_, i) => {
    const x = hw - ((i + 0.5) / 7) * 2 * hw;
    return `L${x.toFixed(1)},${(hb + 1 + (i % 2 ? 3.4 : -0.6) * back + 3 * back * (1 - Math.abs(x) / hw)).toFixed(1)}`;
  }).join("");
  const HAIR = `M-23,-14C-28.5,6 -28.5,${hb - 12} -${hw},${hb}${teeth.split("L").reverse().filter(Boolean).map((q) => `L${q}`).join("")}L${hw},${hb}C28.5,${hb - 12} 28.5,6 23,-14C19,${crown} -19,${crown} -23,-14Z`;
  const faceS = Math.max(ch, 0.0001);
  const plateS = Math.abs(ch) < 0.09 ? (ch < 0 ? -0.09 : 0.09) : ch;
  const plate = (
    <g transform={`translate(${(PLATE_Z * sh).toFixed(2)} -21) scale(${plateS.toFixed(4)} ${(1 - 0.45 * look).toFixed(3)}) translate(0 21)`}>
      <path d={PLATE} fill={ch >= 0 ? C_MAIN : C_DEEP} {...OUT} />
      <g clipPath={`url(#${uid}-dia)`}>
        <path d={hatchD(-16, -53, 16, -20, 64, 4.8, 31, 0) + hatchD(-16, -53, 16, -20, -64, 4.8, 32, 0)} {...ln(1, ch >= 0 ? 0.8 : 0.35)} />
        <path d={hatchD(2, -53, 16, -20, 64, 2.4, 33, 0.1)} {...ln(0.85, 0.55)} />
      </g>
      <path d="M-12.4,-22.6L0,-48.4L12.4,-22.6" {...ln(0.9, 0.5)} />
    </g>
  );
  const plug = (x: number, r: number, deep: boolean) =>
    r > 0.4 ? (
      <g>
        <circle cx={x} cy={8} r={r} fill={deep ? C_DEEP : C_MAIN} {...OUT} strokeWidth={2} />
        <circle cx={x} cy={8} r={r * 0.31} fill={DARK} opacity={0.7} />
      </g>
    ) : null;
  const nearPlug = plug(-21.5 * ch, 4.8 * c01(1 + ch * 1.4), false);
  const farPlug = plug(21.5 * ch, 4.8 * c01(ch * 1.6), true);
  return (
    <g transform={`translate(0 ${(5 * look).toFixed(2)}) scale(1 ${(1 - 0.1 * look).toFixed(3)})`}>
      <clipPath id={`${uid}-face`}>
        <path d={FACE} />
      </clipPath>
      <clipPath id={`${uid}-dia`}>
        <path d={PLATE} />
      </clipPath>
      <clipPath id={`${uid}-hair`}>
        <path d={HAIR} />
      </clipPath>
      {/* seen from behind, the diadem's point rises beyond the crown */}
      {ch < 0 ? plate : null}
      {turned > 0.5 ? farPlug : null}
      <g transform={`scale(${wfH.toFixed(4)} 1)`}>
        <path d={HAIR} fill={C_HAIR} {...OUT} />
        <g clipPath={`url(#${uid}-hair)`}>
          <path d={hatchD(-28, -24, -13, hb + 6, 86, 2.1, 21, 0.1) + hatchD(13, -24, 28, hb + 6, 94, 2.1, 22, 0.1)} {...ln(1.25, 0.85)} />
          {turned > 0.02 ? (
            <>
              <path d={hatchD(-14, -28, 14, hb + 6, 90, 2.2, 36, 0.08)} {...ln(1.25, 0.85 * turned)} />
              <path d={hatchD(-28, 4, 28, hb + 6, 84, 3.1, 37, 0.3)} {...ln(1.1, 0.5 * turned)} />
              {/* the locks' ends on the shoulders */}
              <path d={[-20, -12, -4, 4, 12, 20].map((x, i) => `M${x},${hb - 9 + 3 * hash(i, 38)}Q${x + 2},${hb - 2} ${x - 1},${hb + 3}`).join("")} {...ln(1.3, 0.75 * back)} />
            </>
          ) : null}
        </g>
      </g>
      {/* the face goes round to the side of the head */}
      {ch > 0.03 ? (
        <g transform={`translate(${(FACE_Z * sh).toFixed(2)} 0) scale(${faceS.toFixed(4)} 1)`}>
          <path d={FACE} fill={C_MAIN} {...OUT} />
          <g clipPath={`url(#${uid}-face)`}>
            <path d={hatchD(8.5, -9 + fy, 21, 23, 114, 2.3, 24)} {...ln(0.95, 0.66)} />
            <path d={hatchD(13, -4, 21, 18, 58, 2.9, 25)} {...ln(0.85, 0.5)} />
            <path d={hatchD(-13, 21.5, 13, 28, 4, 2, 26, 0.2)} {...ln(0.85, 0.5)} />
            <path d={hatchD(-19, -24, 19, -9.5 + fy * 1.6, 90, 2.6, 27, 0.25)} {...ln(0.85, 0.22 + 0.4 * nod)} />
            <path d={hatchD(-19, -3, -14, 14, 70, 2.8, 30, 0.3)} {...ln(0.8, 0.35)} />
          </g>
          <path d={brow(-1) + brow(1)} {...ln(2.4, 0.92)} />
          <path d={lid(-1) + lid(1)} {...ln(1.8, 0.92)} />
          {open > 0.25 ? (
            <>
              <path d={under(-1) + under(1)} {...ln(0.9, 0.55 * open)} />
              <circle cx={-8.2} cy={-0.5 + fy} r={2.05} fill={DARK} opacity={0.92 * open} />
              <circle cx={7.8} cy={-0.5 + fy} r={2.05} fill={DARK} opacity={0.92 * open} />
            </>
          ) : (
            <path d={`M-11,${y(1.6)}l-1.6,1.8M-8,${y(2.2)}l-0.4,2.2M5,${y(2.2)}l0.4,2.2M8.4,${y(1.9)}l1.4,2`} {...ln(0.9, 0.6)} />
          )}
          <path d={`M-2,${y(-3.6)}L-3.6,${y(8)}Q-3.4,${y(10.6)} 0.2,${y(10.9)}Q3.6,${y(10.8)} 4.6,${y(8.2)}Q4.4,${y(6.2)} 2.8,${y(5.6)}`} {...ln(1.6, 0.88)} />
          <path d={`M1.4,${y(-2)}l2.4,1.4M1.2,${y(0.8)}l2.6,1.5M1,${y(3.6)}l2.4,1.4`} {...ln(0.85, 0.55)} />
          <path d={`M-7.8,${y(16.4, 0.7)}Q-3.6,${y(14.2, 0.7)} 0,${y(15.5 - nod, 0.7)}Q3.6,${y(14.2, 0.7)} 7.8,${y(16.4, 0.7)}`} {...ln(1.9, 0.92)} />
          <path d={`M-4.4,${y(19, 0.6)}Q0,${y(20.8, 0.6)} 4.4,${y(19, 0.6)}`} {...ln(1.1, 0.65)} />
          <path d={`M-3,${y(23.2, 0.4)}Q0,${y(22.2, 0.4)} 3,${y(23.2, 0.4)}`} {...ln(0.9, 0.45)} />
        </g>
      ) : null}
      {/* the nose in profile */}
      {sh > 0.25 && ch > -0.35 ? (
        <path
          d={`M${(FACE_Z * sh + 18 * faceS).toFixed(1)},${y(-3)}L${(FACE_Z * sh + 18 * faceS + 7.5 * sh * sh).toFixed(1)},${y(8.4)}L${(FACE_Z * sh + 17 * faceS).toFixed(1)},${y(10.6)}Z`}
          fill={C_MAIN}
          {...OUT}
          strokeWidth={1.9}
          opacity={c01((ch + 0.35) * 4)}
        />
      ) : null}
      {turned <= 0.5 ? farPlug : null}
      {/* the band round the head */}
      <g transform={`scale(${wfH.toFixed(4)} 1)`}>
        {ch >= 0 ? (
          <>
            <path d="M-22.5,-11.6Q0,-17.5 22.5,-11.6L23,-21Q0,-27.5 -23,-21Z" fill={C_DEEP} {...OUT} />
            <path d="M-22.6,-16.4Q0,-22.4 22.6,-16.4" {...ln(1, 0.65)} />
            <path d={[-18.5, -13, -7, 7, 13, 18.5].map((x) => `M${x},${(-13.4 - (1 - (x * x) / 506) * 5.4).toFixed(1)}l0,-3.6`).join("")} {...ln(1, 0.6)} />
            <path d={hatchD(9, -27, 23, -11, 100, 2.2, 34, 0.15)} {...ln(0.8, 0.5)} />
          </>
        ) : (
          <>
            <path d="M-22.5,-13.4Q0,-8.6 22.5,-13.4L23,-22.6Q0,-17.6 -23,-22.6Z" fill={C_DEEP} {...OUT} />
            <path d="M-22.6,-18Q0,-13 22.6,-18" {...ln(1, 0.65)} />
            <path d={hatchD(9, -24, 23, -9, 100, 2.2, 34, 0.15)} {...ln(0.8, 0.5)} />
          </>
        )}
      </g>
      {ch >= 0 ? plate : null}
      {/* the band's tie at the back of the head: a knot and two hanging ends */}
      {ch < -0.04 ? (
        <g transform={`translate(${(-TIE_Z * sh).toFixed(2)} 0) scale(${(-ch).toFixed(4)} 1)`}>
          <path d={limbD([[[-2, -12], 6.4], [[-6.5, 2], 7], [[-9, 17], 6.4], [[-8, 27], 3.6]])} fill={C_MAIN} {...OUT} strokeWidth={1.9} />
          <path d={limbD([[[2, -12], 6.4], [[5.5, 3], 7], [[9.5, 15], 6.4], [[10.5, 24], 3.6]])} fill={C_MAIN} {...OUT} strokeWidth={1.9} />
          <path d="M-6,0l-3,13M6,2l3.4,11M-8.6,22l0.6,-5M10,19l-0.6,-4" {...ln(0.9, 0.55)} />
          <path d="M0,-13.4l-11,-6q-4.6,5 -0.6,10.4ZM0,-13.4l11,-6q4.6,5 0.6,10.4Z" fill={C_MAIN} {...OUT} strokeWidth={1.9} />
          <circle cx={0} cy={-13.4} r={4.4} fill={C_DEEP} {...OUT} strokeWidth={1.9} />
        </g>
      ) : null}
      {nearPlug}
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE FIGURE
// ---------------------------------------------------------------------------
export const TurnEmperor: React.FC<{ pose: EmperorPose; turn: Turn; at?: P2; uid?: string }> = ({ pose, turn, at = EMPEROR_AT, uid = "temp" }) => {
  const q = turnRig(pose, turn);
  const { r, sf } = q;
  const { front, side, surf, mF, mB, joint } = sf;
  const hs = surface(turn.hem);
  const s = pose.slump;
  const pt = r.point;
  const { hip, shL, shR, neck, top } = r;
  const mirror: Map = (p) => [-p[0], p[1]];
  // ---- the tilmatli ----------------------------------------------------------
  const hem = -60 - pose.hang + 3 * s;
  const fl = 1 + turn.flare;
  const lift = 16 * turn.flare;
  const hemL: P2 = [(hip[0] - 56 - 3 * s) * fl, hem + 1 - lift];
  const hemR: P2 = [(hip[0] + 53 + 3 * s) * fl, hem + 5 - lift];
  const hemC: P2 = [(hemL[0] + hemR[0]) / 2 + 3, hem + 13 - lift * 0.4];
  const hemPt = (t: number, up = 0): P2 => {
    const p = quad(hemL, hemC, hemR, t);
    return [p[0], p[1] - up];
  };
  /** the hem has its own angle: it lags the body */
  const hemSide: Map = (p) => [p[0] * (front ? hs.wf : -hs.wf), p[1]];
  const hemSurf: Map = (p) => (front ? hs.mF(p) : hs.mB([-p[0], p[1]]));
  const knot = add(shL, [9, -7]);
  const cloakA = add(shL, [-9, 5]);
  const cloakB = add(shR, [-3, 34]);
  const n0 = add(neck, [-8, 17]);
  const n1 = add(cloakB, [-34, -3]);
  const CLOAK =
    `M${P(side(cloakA))}L${P(surf(cloakA))}Q${P(surf(add(shL, [-4, -11])))} ${P(surf(knot))}` +
    `C${P(surf(n0))} ${P(surf(n1))} ${P(surf(cloakB))}L${P(side(cloakB))}` +
    `C${P(side(add(cloakB, [9, 42])))} ${P(side([hemR[0] / fl + 5, hemR[1] - 78]))} ${P(hemSide(hemR))}` +
    `Q${P(hemSide(hemC))} ${P(hemSide(hemL))}` +
    `C${P(side([hemL[0] / fl - 7, hemL[1] - 76]))} ${P(side(add(cloakA, [-10, 54])))} ${P(side(cloakA))}Z`;
  // the folds: from under the knot down to the hem; their feet go with the hem
  const foldAt = (a: P2, b: P2, bend: number) => {
    const c: P2 = [mix(a[0], b[0], 0.28) + bend, mix(a[1], b[1], 0.55)];
    return { a, c, b };
  };
  const frontFolds = [0.07, 0.22, 0.38, 0.54, 0.7, 0.86].map((t, i) => foldAt(add(knot, [1 + t * 46, 13 + t * 30 + 9 * hash(i, 41)]), hemPt(t, 10 + 26 * hash(i, 42)), (t - 0.45) * 20));
  // from behind (authored as seen from behind: the knot's shoulder is on screen right)
  const knotB = mirror(knot);
  const backFolds = [0.08, 0.2, 0.33, 0.46, 0.59, 0.72, 0.85, 0.95].map((t, i) =>
    foldAt(add(knotB, [-3 - (1 - t) * 62 + 6 * hash(i, 61), 12 + (1 - t) * 26 + 8 * hash(i, 62)]), mirror(hemPt(1 - t, 6 + 12 * hash(i, 63))), (0.5 - t) * 26),
  );
  const foldPath = (f: { a: P2; c: P2; b: P2 }, m: Map, mh: Map) => `M${P(m(f.a))}Q${P(mix2(m(f.c), mh(f.c), 0.5))} ${P(mh(f.b))}`;
  const foldMap = (f: { a: P2; c: P2; b: P2 }, m: Map, mh: Map): Map => {
    const y0 = f.a[1];
    const y1 = f.b[1];
    return (p) => mix2(m(p), mh(p), c01((p[1] - y0) / (y1 - y0 || 1)));
  };
  const backHem: Map = (p) => hs.mB(p);
  // the knot on the shoulder rides the surface
  const knotAt = surf(knot);
  const kd = Math.max(0.18, Math.abs(surf([knot[0] + 2, knot[1]])[0] - surf([knot[0] - 2, knot[1]])[0]) / 4);
  // ---- legs and feet -----------------------------------------------------------
  const facing = sf.s; // > 0: he faces screen right
  const legs = [r.legL, r.legR].map((l) => {
    const H = joint(l.H);
    const K = joint(l.K);
    const A = joint(l.A);
    const sg = front ? l.sgn : -l.sgn;
    const calf = mix2(K, A, 0.34);
    const st: St[] = [
      [H, 21],
      [mix2(H, K, 0.5), 19],
      [K, 15],
      [[calf[0] + sg * 1.2 * Math.abs(sf.c), calf[1]], 17.5],
      [mix2(K, A, 0.82), 11.5],
      [A, 10.5],
    ];
    const hw = mix(7.6, 12.5, c01(sf.c));
    const toe = 14 * facing;
    const fx = A[0] + sg * 4.5 * c01(sf.c);
    const F = (flat: P2, hang: P2): P2 => [mix(flat[0], hang[0], pt), mix(flat[1], hang[1], pt)];
    const foot = smoothClosed([
      F([A[0] - 6, A[1] + 1], [A[0] - 5.4, A[1] + 1]),
      F([A[0] + 6, A[1] + 1], [A[0] + 5.4, A[1] + 1]),
      F([fx + hw + toe, -5], [A[0] + 6.6, A[1] + 12]),
      F([fx + hw * 0.88 + toe, 1.6], [A[0] + 4, A[1] + 23]),
      F([fx + toe * 0.5, 2.6], [A[0], A[1] + 25.5]),
      F([fx - hw * 0.88, 1.6], [A[0] - 4, A[1] + 23]),
      F([fx - hw, -5], [A[0] - 6.6, A[1] + 12]),
    ]);
    const toeY = mix(1.4, A[1] + 24, pt);
    const toeX = mix(fx + toe * 0.8, A[0], pt);
    const toeW = mix(4.6, 2, pt) * mix(0.5, 1, c01(sf.c));
    const toes = [-1.5, -0.5, 0.5, 1.5].map((j) => `M${(toeX + j * toeW).toFixed(1)},${toeY.toFixed(1)}l0,${mix(-4.6, -5.4, pt).toFixed(1)}`).join("");
    const strap = `M${P([A[0] - 6.4, A[1] + 3.4])}L${P([toeX, mix(-4.4, A[1] + 17, pt)])}L${P([A[0] + 6.4, A[1] + 3.4])}`;
    // from behind: the sandal's heel-piece and its tie up the tendon
    const heel = `M${P([A[0] - 6.8, A[1] + 4.5])}Q${P([A[0], A[1] + 2.2])} ${P([A[0] + 6.8, A[1] + 4.5])}L${P(F([A[0] + 7.6, 1.8], [A[0] + 5, A[1] + 14]))}Q${P(F([A[0], 3.4], [A[0], A[1] + 16]))} ${P(F([A[0] - 7.6, 1.8], [A[0] - 5, A[1] + 14]))}Z`;
    return { sg, d: limbD(st), K, A, calf, foot, toes, strap, heel };
  });
  // ---- arms: the far one tucks behind the body ---------------------------------
  const hidden = sf.s > 0.5; // > 30 deg from either full view
  const farArm = q.armR; // for a turn 0 -> pi his screen-right arm goes away from us
  const nearArm = q.armL;
  const drawArm = (a: Arm, key: string) => {
    const fl2 = vlen(sub(a.W, a.E));
    const ul = vlen(sub(a.E, a.S));
    const dv = sub(a.E, a.S);
    const u: P2 = vlen(dv) > 0.5 ? norm(dv) : [0, 1];
    const n: P2 = [-u[1], u[0]];
    const c = mix2(a.S, a.E, 0.56);
    return (
      <g key={key}>
        <path d={limbD(bones(a.S, a.E, a.W, [20, 19.5, 15, 16, 11]))} fill={C_MAIN} {...OUT} />
        <path d={braceletD(a.S, a.E, 19.5, 15, 85 + a.sgn, 2.9) + (fl2 > 14 ? braceletD(a.E, a.W, 16, 11, 87 + a.sgn, 2.9) : "")} {...ln(0.95, 0.62)} />
        {ul > 30 ? <path d={limbD([[add(c, mul(n, -8.4)), 5.6], [add(c, mul(n, 8.4)), 5.6]])} fill={C_DEEP} {...OUT} strokeWidth={1.9} /> : null}
        {/* from behind: the point of the elbow */}
        {!front && ul > 30 ? <path d={`M${P(add(a.E, [-5, -3]))}Q${P(add(a.E, [0, 4]))} ${P(add(a.E, [5, -3]))}`} {...ln(1.2, 0.7)} /> : null}
        <Hand a={a} />
      </g>
    );
  };
  const TORSO = `M${P(side(add(shL, [1, -4])))}Q${P(side(add(neck, [-14, -1])))} ${P(side(add(neck, [-8, -5])))}L${P(side(add(neck, [8, -5])))}Q${P(side(add(neck, [14, -1])))} ${P(side(add(shR, [-1, -4])))}L${P(side(add(hip, [26, 6])))}L${P(side(add(hip, [-26, 6])))}Z`;
  // back-view points (as seen from behind: his bare shoulder is on screen left)
  const bShoulder = mirror(shR);
  const bNeck = mirror(neck);
  return (
    <g transform={`translate(${at[0].toFixed(2)} ${at[1].toFixed(2)})`}>
      <clipPath id={`${uid}-cloak`}>
        <path d={CLOAK} />
      </clipPath>
      <clipPath id={`${uid}-torso`}>
        <path d={TORSO} />
      </clipPath>
      {hidden ? drawArm(farArm, "far") : null}
      {/* legs and sandalled feet */}
      {(sf.s > 0.02 ? [legs[1], legs[0]] : legs).map((g) => (
        <g key={g.sg}>
          <path d={g.d} fill={C_MAIN} {...OUT} />
          <path d={braceletD(g.K, g.A, 17, 11, 81 + g.sg, 2.9)} {...ln(0.95, 0.62)} />
          {front ? (
            <path d={`M${P([g.K[0] - 5, g.K[1] + 1])}Q${P([g.K[0], g.K[1] + 5])} ${P([g.K[0] + 5, g.K[1] + 1])}`} {...ln(1, 0.5)} />
          ) : (
            <>
              {/* the hollow of the knee, the calf's two bellies, the tendon */}
              <path d={`M${P([g.K[0] - 5.5, g.K[1] - 2])}L${P([g.K[0] + 5.5, g.K[1] - 2])}`} {...ln(1.1, 0.6)} />
              <path d={`M${P([g.calf[0], g.K[1] + 4])}Q${P([g.calf[0] + 1.5, g.calf[1] + 8])} ${P([g.A[0], g.A[1] - 14])}`} {...ln(1.1, 0.6)} />
              <path d={`M${P([g.A[0] - 2.2, g.A[1] - 12])}L${P([g.A[0] - 1.6, g.A[1] - 3])}M${P([g.A[0] + 2.2, g.A[1] - 12])}L${P([g.A[0] + 1.6, g.A[1] - 3])}`} {...ln(0.9, 0.5)} />
            </>
          )}
          <path d={g.foot} fill={C_MAIN} {...OUT} strokeWidth={2.1} />
          {sf.c > 0.3 ? <path d={g.toes} {...ln(1, 0.7 * c01((sf.c - 0.3) * 3))} /> : null}
          {sf.c > 0.3 ? <path d={g.strap} {...ln(1.7, 0.85 * c01((sf.c - 0.3) * 3))} /> : null}
          {!front ? <path d={g.heel} fill={C_DEEP} {...OUT} strokeWidth={1.9} opacity={c01(-sf.c * 3)} /> : null}
          <path d={`M${P([g.A[0] - 6.6, g.A[1] - 1.5])}h13.2M${P([g.A[0] - 6.4, g.A[1] + 2.4])}h12.8`} {...ln(1.5, 0.85)} />
          {!front ? <path d={`M${P([g.A[0], g.A[1] - 1.5])}L${P([g.A[0], g.A[1] + 4])}`} {...ln(1.5, 0.85 * c01(-sf.c * 3))} /> : null}
        </g>
      ))}
      {/* the bare torso */}
      <path d={TORSO} fill={C_MAIN} {...OUT} />
      {front ? (
        <g clipPath={`url(#${uid}-torso)`}>
          <path d={`M${P(mF(add(neck, [3, 27])))}Q${P(mF(add(neck, [19, 38])))} ${P(mF(add(shR, [-9, 25])))}`} {...ln(1.3, 0.75)} />
          <path d={`M${P(mF(add(neck, [6, 7])))}Q${P(mF(add(neck, [18, 5])))} ${P(mF(add(shR, [-10, 5])))}`} {...ln(1.1, 0.6)} />
          <path d={segD(hatchSegs(shR[0] - 26, shR[1] + 6, shR[0] - 3, shR[1] + 34, 116, 2.6, 43), mF)} {...ln(0.9, 0.6)} />
        </g>
      ) : (
        <g clipPath={`url(#${uid}-torso)`}>
          {/* the spine, the bare shoulder blade, the nape */}
          <path d={`M${P(mB(add(bNeck, [1, 4])))}Q${P(mB(add(bNeck, [-1, 30])))} ${P(mB(add(bNeck, [1, 60])))}`} {...ln(1.3, 0.7)} />
          <path d={`M${P(mB(add(bShoulder, [10, 9])))}Q${P(mB(add(bShoulder, [26, 16])))} ${P(mB(add(bShoulder, [22, 40])))}Q${P(mB(add(bShoulder, [14, 46])))} ${P(mB(add(bShoulder, [8, 38])))}`} {...ln(1.3, 0.75)} />
          <path d={segD(hatchSegs(bShoulder[0] + 12, bShoulder[1] + 16, bShoulder[0] + 26, bShoulder[1] + 42, 112, 2.6, 64), mB)} {...ln(0.9, 0.55)} />
          <path d={segD(hatchSegs(bNeck[0] + 2, bNeck[1] + 2, bNeck[0] + 9, bNeck[1] + 50, 100, 2.8, 65), mB)} {...ln(0.85, 0.5)} />
        </g>
      )}
      {/* the tilmatli */}
      <path d={CLOAK} fill={C_MAIN} {...OUT} />
      <g clipPath={`url(#${uid}-cloak)`}>
        {front ? (
          <>
            <path d={segD(hatchSegs(hip[0] + 24, top[1] + 24, hip[0] + 70, hem + 16, 111, 3, 44), mF)} {...ln(0.95, 0.62)} />
            <path d={segD(hatchSegs(hip[0] + 40, top[1] + 60, hip[0] + 70, hem + 16, 60, 3.6, 45), mF)} {...ln(0.9, 0.52)} />
            {frontFolds.map((f, i) => (
              <path key={i} d={segD(foldHatchSegs(f.a, f.c, f.b, 46 + i, 9 + 5 * hash(i, 47)), foldMap(f, mF, hs.mF))} {...ln(0.95, 0.62)} />
            ))}
            <path d={`M${P(mF(add(knot, [3, 9])))}C${P(mF(add(n0, [1, 8])))} ${P(mF(add(n1, [0, 8])))} ${P(mF(add(cloakB, [-1, 9])))}`} {...ln(1.2, 0.7)} />
          </>
        ) : (
          <>
            <path d={segD(hatchSegs(hip[0] + 22, top[1] + 10, hip[0] + 70, hem + 16, 111, 3, 66), mB)} {...ln(0.95, 0.62)} />
            <path d={segD(hatchSegs(hip[0] + 40, top[1] + 50, hip[0] + 70, hem + 16, 60, 3.6, 67), mB)} {...ln(0.9, 0.52)} />
            <path d={segD(hatchSegs(hip[0] - 70, top[1] + 60, hip[0] - 46, hem + 16, 80, 4.2, 68, 0.4), mB)} {...ln(0.9, 0.4)} />
            {backFolds.map((f, i) => (
              <path key={i} d={segD(foldHatchSegs(f.a, f.c, f.b, 70 + i, 11 + 6 * hash(i, 69), 0.032), foldMap(f, mB, backHem))} {...ln(0.95, 0.62)} />
            ))}
            {/* the rolled upper edge, from the knot across the back and under the far arm */}
            <path d={`M${P(surf(add(knot, [3, 9])))}C${P(surf(add(n0, [1, 8])))} ${P(surf(add(n1, [0, 8])))} ${P(surf(add(cloakB, [-1, 9])))}`} {...ln(1.2, 0.7)} />
          </>
        )}
        {/* the border: a band of little eyes along the hem */}
        <path d={`M${P(hemSide(hemPt(0, 12)))}Q${P(hemSide([hemC[0], hemC[1] - 12]))} ${P(hemSide(hemPt(1, 12)))}`} {...ln(1.3, 0.8)} />
        {Array.from({ length: 12 }, (_, i) => {
          const p = hemSurf(hemPt((i + 0.5) / 12, 6));
          const w = Math.abs(hemSurf(hemPt((i + 0.9) / 12, 6))[0] - hemSurf(hemPt((i + 0.1) / 12, 6))[0]) / 7.6;
          if (w < 0.12) return null;
          return (
            <g key={i}>
              <ellipse cx={p[0]} cy={p[1]} rx={2.3 * Math.min(1, w)} ry={2.3} {...ln(0.9, 0.7)} />
              <ellipse cx={p[0]} cy={p[1]} rx={0.8 * Math.min(1, w)} ry={0.8} fill={DARK} opacity={0.8} />
            </g>
          );
        })}
      </g>
      {front ? (
        <path d={frontFolds.map((f) => foldPath(f, mF, hs.mF)).join("")} {...ln(1.5, 0.78)} />
      ) : (
        <g clipPath={`url(#${uid}-cloak)`}>
          <path d={backFolds.map((f) => foldPath(f, mB, backHem)).join("")} {...ln(1.5, 0.78)} />
        </g>
      )}
      {/* the knot on the shoulder: two ends, two loops */}
      <g transform={`translate(${knotAt[0].toFixed(2)} ${knotAt[1].toFixed(2)}) scale(${(front ? kd : -kd).toFixed(3)} 1)`}>
        <path d={limbD([[[0, 0], 5.4], [[-4, 11], 5], [[-2.4, 21], 3.4]])} fill={C_MAIN} {...OUT} strokeWidth={1.9} />
        <path d={limbD([[[0, 0], 5.4], [[6, 9], 5], [[10.6, 17], 3.4]])} fill={C_MAIN} {...OUT} strokeWidth={1.9} />
        <path d="M0,0l-12,-8.6q-5.6,3.4 -1.6,9.4ZM0,0l11.6,-8q5.4,4.4 1,9.6Z" fill={C_MAIN} {...OUT} strokeWidth={1.9} />
        <circle cx={0} cy={0} r={4.6} fill={C_DEEP} {...OUT} strokeWidth={1.9} />
      </g>
      {/* the arms, bare, an armband on each */}
      {hidden ? null : drawArm(farArm, "far")}
      {drawArm(nearArm, "near")}
      {/* neck and head */}
      <path d={limbD([[add(q.neck, [0, 5]), 20], [mix2(q.neck, q.headC, 0.75), 16]])} fill={C_MAIN} {...OUT} />
      <path d={braceletD(add(q.neck, [0, 4]), mix2(q.neck, q.headC, 0.55), 20, 17, 89, 2.4)} {...ln(0.9, 0.6)} />
      <g transform={`translate(${q.headC[0].toFixed(2)} ${q.headC[1].toFixed(2)}) rotate(${q.headAngle.toFixed(2)}) scale(${HEAD_SCALE})`}>
        <Head ch={q.ch} sh={q.sh} nod={pose.nod} look={turn.look} uid={uid} />
      </g>
    </g>
  );
};
