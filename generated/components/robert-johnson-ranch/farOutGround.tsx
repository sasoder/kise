// ---------------------------------------------------------------------------
// farOutGround — FarOutOfAustin's land, drawn in the clip's picture-book Hill Country look (HillGround's gouache
// ground: slope-lit grass with drier and greener patches, tufts, live oaks and cedar), but WORLD-ANCHORED for a
// camera that travels 40 km: every slice, road piece, tuft, tree and fence post sits on a fixed world grid (with
// power-of-two levels of detail by distance), so nothing crawls or shimmers as the camera moves.
//
// World (farOutPlan: X across, H up, Z toward Austin) -> kit: X = X, Z_kit = Z - oz (oz = the camera's world Z + Dc).
// Everything returns Item[] ({ Z: kit Z, node }) for the cut's one far-to-near sort; a decal or a span is keyed by
// its nearest edge so it comes after every slice behind it.
// ---------------------------------------------------------------------------
import React from "react";
import { AIR, formTone, mixHex, type AirWorld, type Mat } from "../kits/dwarkesh-3d/dwarkesh3d";
import { CedarBush, LiveOak, RMAT, U, type Item } from "./ranchWorld";
import { CedarPost } from "./farOutCar";
import { c01, hash, lerp, line3, n2, polyD, proj, Pt, sstep, type P2, type V3 } from "./farOutFaces";
import { DIRT_HALF, FARM_X, FARM_Z, GUARD_AT, HWY_DIR, HWY_X, JUNCTION, LEFT_DIR, ROUTE, TH, cityGone, eastOf, flatIn, nearestRoad, rawH } from "./farOutPlan";

const PAL = AIR.A;
export type World = { A: AirWorld; oz: number; frame: number };
const hash2 = (i: number, j: number, k = 0) => hash(i * 157.31 + j * 311.77 + k * 71.13);
const vnoise = (x: number, z: number, seed = 0) => {
  const xi = Math.floor(x);
  const zi = Math.floor(z);
  const xf = x - xi;
  const zf = z - zi;
  const s = (t: number) => t * t * (3 - 2 * t);
  const h = (i: number, j: number) => hash2(i, j, seed);
  return lerp(lerp(h(xi, zi), h(xi + 1, zi), s(xf)), lerp(h(xi, zi + 1), h(xi + 1, zi + 1), s(xf)), s(zf));
};
const LIGHT = (() => {
  const v = [-0.6, 0.75, -0.3];
  const l = Math.hypot(v[0], v[1], v[2]);
  return v.map((x) => x / l);
})();
const pow2Step = (base: number, want: number) => base * Math.pow(2, Math.max(0, Math.ceil(Math.log2(Math.max(1, want / base)))));

// ===================================================================================================================
// THE GROUND'S COLOUR (HillGround's groundLocal, on the world terrain)
// ===================================================================================================================
/** `d` (the eye's distance) flattens the form light with distance: far slopes keep only a little of their lit/shade
 *  contrast and no pale limestone risers, so a far sun-facing hill never turns snow-white against the flat land */
/** cut 59's grass hills (ranchWorld HILL_GRASS_NEAR) */
const HILL_GRASS = { lit: "#A9A87A", mid: "#8F9065", dark: "#6A714C" };
const groundLocal = (X: number, Z: number, d = 0) => {
  const kf = 1 - 0.7 * sstep(4000, 20000, d);
  const e = 40;
  const hx = (TH(X + e, Z) - TH(X - e, Z)) / (2 * e);
  const hz = (TH(X, Z + e) - TH(X, Z - e)) / (2 * e);
  const nl = Math.hypot(hx, 1, hz);
  // (the second half's folds are lit softly: the slices sample the light once per row, and a hard light on a fold
  // shows as blocks of shade)
  const ea = eastOf(X, Z);
  const ndl = LIGHT[1] + ((-hx * LIGHT[0] + LIGHT[1] - hz * LIGHT[2]) / nl - LIGHT[1]) * kf * (1 - 0.6 * ea);
  const gm = RMAT.grass;
  const pn = vnoise(X / 1300, Z / 1000, 7);
  const mot = vnoise(X / 900, Z / 1500, 11) - 0.5;
  const g = formTone({ lit: mixHex(gm.lit, RMAT.grassDry.lit, pn), mid: mixHex(gm.mid, RMAT.grassDry.mid, pn), dark: gm.dark }, ndl * 0.85 + 0.02 + 0.12 * mot + 0.1 * (pn - 0.5), PAL.shadow, 0.2);
  const pat = vnoise(X / 2100 + 3.1, Z / 2600, 13);
  const g1 = mot > 0.08 ? mixHex(g, RMAT.grassDry.lit, 0.25 * sstep(0.08, 0.4, mot)) : mixHex(g, gm.dark, 0.07 * sstep(-0.05, -0.4, mot));
  let out = mixHex(g1, mixHex(gm.dark, "#55604A", 0.5), 0.06 * sstep(0.55, 0.85, pat));
  // the limestone showing on the benches' steep risers (pale, a little warm)
  const slope = Math.hypot(hx, hz);
  if (slope > 0.3) out = mixHex(out, formTone(RMAT.caliche, ndl, PAL.shadow, 0.2), 0.16 * kf * sstep(0.3, 0.8, slope));
  // the second half's country in the dry yellow-green of cut 59's slope (warm late-afternoon grass)
  if (ea > 0) out = mixHex(out, formTone(HILL_GRASS, ndl, PAL.shadow, 0.2), 0.45 * ea);
  return out;
};

// ===================================================================================================================
// THE SLICES (world Z on a power-of-two grid: 30 units near, ~2% of the distance far)
// ===================================================================================================================
/** the haze the far ridge rows pale into (cut 59's FAR_HAZE, a touch warmer: the late-afternoon light holds) */
export const FAR_HAZE = "#B7BA9E";
const SAMPLES = 300;
/** the height the land is toned at: as is up to 500, then a third of the rest, so the tall ridges of the second half
 *  do not take the kit's pale high-altitude air (hHigh 1250) and read as snow */
const landToneH = (H: number) => (H <= 500 ? Math.max(0, H) : 500 + (H - 500) / 3);
/** the slices' levels: a slice at world Z = m * 30 * 2^j (m odd) belongs to level j; it is drawn while the grid wanted
 *  at its distance (0.021 d) is finer than its level's spacing, and fades out (opacity) over the last part of that
 *  range instead of vanishing, so a hill's outline never jumps when the grid coarsens; the top level never fades */
const SLICE_BASE = 30;
const SLICE_TOP = 7;
export const landItems = (W: World, o: { dFar?: number; margin?: number } = {}): Item[] => {
  const { A } = W;
  const P = A.P;
  const k = A.k;
  const margin = o.margin ?? 60;
  const dFar = o.dFar ?? 110000;
  const camZw = W.oz - A.Dc;
  const bottomY = A.cam.cy + (980 + margin) / k;
  const out: Item[] = [];
  // the far plain beyond the last slice: one band from the horizon down
  const eyeY = P.opts.eyeY;
  // the far land pales toward a dry sage (the clip's pale far land), never the teal of the air at the horizon
  const FAR_LAND = "#B4BBA0";
  const farC0 = mixHex(A.tone(mixHex(RMAT.grass.mid, RMAT.grassDry.mid, 0.5), dFar - A.Dc, 0), FAR_LAND, 0.42);
  // the second half: the land under the far ridge rows is their haze (cut 59's pale grey-green), a clear horizon
  const fi = flatIn(W.frame);
  const farC = fi > 0 ? mixHex(farC0, FAR_HAZE, fi) : farC0;
  out.push({ Z: 1e9, node: <rect key="plain" x={n2(A.cam.cx - 800 / k)} y={n2(eyeY)} width={n2(1600 / k)} height={n2(bottomY - eyeY)} fill={farC} /> });
  const dMin = Math.max(P.zNear + 60 + A.Dc, 700);
  for (let j = 0; j <= SLICE_TOP; j++) {
    const sp = SLICE_BASE * 2 ** j;
    const dEnd = j === SLICE_TOP ? dFar : Math.min(dFar, sp / 0.021);
    for (let m = Math.ceil((camZw + dMin) / sp); m * sp <= camZw + dEnd; m++) {
      if (j < SLICE_TOP && m % 2 === 0) continue;
      const Zw = m * sp;
      const d = Zw - camZw;
      const op = j === SLICE_TOP ? 1 : 1 - sstep(0.55 * sp, sp, 0.021 * d);
      if (op <= 0.003) continue;
      const Zk = Zw - W.oz;
      const r = P.r(Zk);
      const hw = (540 + margin) / (k * r);
      const xa = A.cam.cx - hw;
      const xb = A.cam.cx + hw;
      const sx = pow2Step(4, (xb - xa) / SAMPLES);
      const i0 = Math.floor(xa / sx);
      const i1 = Math.ceil(xb / sx);
      const top: P2[] = [];
      const stops: { o: number; c: string }[] = [];
      let minY = 1e9;
      // the colour stops on a world-anchored subset of the samples
      const every = 2 ** Math.max(0, Math.ceil(Math.log2((i1 - i0) / 48)));
      for (let i = i0; i <= i1; i++) {
        const X = i * sx;
        const H = TH(X, Zw);
        const q = P.p(X, -H, Zk);
        top.push(q);
        minY = Math.min(minY, q[1]);
        if (i % every === 0 || i === i0 || i === i1) stops.push({ o: (i - i0) / (i1 - i0), c: mixHex(A.tone(groundLocal(X, Zw, d), Zk, landToneH(H)), FAR_LAND, 0.42 * sstep(26000, 100000, d)) });
      }
      if (minY > bottomY) continue;
      const gid = `ld${Zw}`;
      const dd = `M${top.map(Pt).join("L")}L${n2(top[top.length - 1][0])},${n2(bottomY)}L${n2(top[0][0])},${n2(bottomY)}Z`;
      out.push({
        Z: Zk,
        node: (
          <g key={`s${Zw}`}>
            <defs>
              <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1={n2(top[0][0])} y1="0" x2={n2(top[top.length - 1][0])} y2="0">
                {stops.map((s, i) => (
                  <stop key={i} offset={s.o.toFixed(4)} stopColor={s.c} />
                ))}
              </linearGradient>
            </defs>
            <path d={dd} fill={`url(#${gid})`} opacity={op < 0.999 ? n2(op) : undefined} />
          </g>
        ),
      });
    }
  }
  // far to near among themselves (the scene sorts all items by Z; equal Z keeps this order)
  out.sort((a, b) => b.Z - a.Z);
  return out;
};

// ===================================================================================================================
// THE ROADS (ribbons on the ground, in world-anchored pieces)
// ===================================================================================================================
type Line = { pts: P2[]; s: number[] };
const mkLine = (pts: P2[]): Line => {
  const s = [0];
  for (let i = 1; i < pts.length; i++) s.push(s[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return { pts, s };
};
const lineAt = (L: Line, s: number): { p: P2; t: P2 } => {
  const n = L.pts.length;
  const sc = Math.max(0, Math.min(L.s[n - 1], s));
  let lo = 0;
  let hi = n - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (L.s[m] <= sc) lo = m;
    else hi = m;
  }
  const a = L.pts[lo];
  const b = L.pts[hi];
  const u = (sc - L.s[lo]) / Math.max(1e-6, L.s[hi] - L.s[lo]);
  const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  return { p: [lerp(a[0], b[0], u), lerp(a[1], b[1], u)], t: [(b[0] - a[0]) / l, (b[1] - a[1]) / l] };
};
/** US 290: from far toward the city (beyond the cheat's far city) down the straight, round the bend, through the
 *  junction and on west out of the story */
export const HWY_LINE = (() => {
  const P = ROUTE.pts;
  const pts: P2[] = [[HWY_X, 760000]];
  for (const p of P) if (p.s <= ROUTE.sT1 + 0.1) pts.push([p.X, p.Z]);
  pts.push(JUNCTION);
  pts.push([JUNCTION[0] + 40000 * HWY_DIR[0], JUNCTION[1] + 40000 * HWY_DIR[1]]);
  return mkLine(pts);
})();
/** the caliche ranch road: from the highway's edge through the guard to the farm yard */
export const DIRT_LINE = (() => {
  const pts: P2[] = [[JUNCTION[0] + 520 * LEFT_DIR[0], JUNCTION[1] + 520 * LEFT_DIR[1]]];
  for (const p of ROUTE.pts) if (p.s >= ROUTE.sGuard - 1000 + 1e-6) pts.push([p.X, p.Z]);
  return mkLine(pts);
})();
export const HWY_W = 590;
const ASPHALT: Mat = { lit: "#8D8F86", mid: "#727469", dark: "#46483F" };
const SHOULDER: Mat = { lit: "#A49A7E", mid: "#877E66", dark: "#4E4A3D" };

type RoadKind = "hwy" | "dirt";
/** the dirt road's soft entry: frames it runs (F0 to F1, exclusive), the frame its time ramp starts, and the screen
 *  rows over which it goes from the ground's tone (Y0, the bottom edge) to full caliche (Y1, about the mid frame) */
const SOFT_F0 = 112;
const SOFT_F1 = 130;
const SOFT_T0 = 122;
const SOFT_Y0 = 1880;
const SOFT_Y1 = 1000;
/** one road's pieces as items; `sFrom`/`sTo` limit it along its length */
/** keep the part of a world polygon (X, Z) on one side of the line Z = c (Sutherland-Hodgman) */
const clipZ = (q: P2[], c: number, far: boolean): P2[] => {
  const inside = (p: P2) => (far ? p[1] >= c : p[1] <= c);
  const out: P2[] = [];
  for (let i = 0; i < q.length; i++) {
    const a = q[i];
    const b = q[(i + 1) % q.length];
    const ia = inside(a);
    const ib = inside(b);
    if (ia) out.push(a);
    if (ia !== ib) {
      const t = (c - a[1]) / (b[1] - a[1]);
      out.push([lerp(a[0], b[0], t), c]);
    }
  }
  return out;
};
/** a body standing on a road (the car, the guard's bed): its item is keyed at the world line Z = cut; a road piece
 *  reaching under it is split there, its far part drawn just before the body, its near part in the usual order */
export type Under = { X: number; Z: number; R: number; cut: number };
export const roadItems = (W: World, kind: RoadKind, o: { sFrom?: number; sTo?: number; dFar?: number; unders?: Under[] } = {}): Item[] => {
  const { A } = W;
  const P = A.P;
  const L = kind === "hwy" ? HWY_LINE : DIRT_LINE;
  const total = L.s[L.s.length - 1];
  const s0 = o.sFrom ?? 0;
  const s1 = Math.min(total, o.sTo ?? total);
  const dFar = o.dFar ?? 900000;
  const camX = A.cam.cx;
  const camZw = W.oz - A.Dc;
  const zMin = P.zNear + 10;
  const out: Item[] = [];
  const half = (s: number) => (kind === "hwy" ? HWY_W : 250 + 46 * (vnoise(s / 380, 0.5, 41) - 0.5) * 2);
  const edgeAt = (s: number, off: number) => {
    const { p, t } = lineAt(L, s);
    // the left normal (-tz, tx)
    const X = p[0] - t[1] * off;
    const Z = p[1] + t[0] * off;
    return [X, Z] as P2;
  };
  const toK = (q: P2, lift = 2): P2 => P.p(q[0], -(TH(q[0], q[1]) + lift), q[1] - W.oz);
  const kZ = (Z: number) => Z - W.oz;
  let s = s0;
  while (s < s1) {
    const c = lineAt(L, s).p;
    const d = Math.hypot(c[0] - camX, c[1] - camZw);
    const step = pow2Step(kind === "hwy" ? 100 : 60, (kind === "hwy" ? 0.016 : 0.012) * d);
    const sn = Math.min(s1, Math.max(s + 1, (Math.floor(s / step + 1e-7) + 1) * step));
    const sa = s;
    s = sn;
    const za = kZ(lineAt(L, sa).p[1]);
    const zb = kZ(lineAt(L, sn).p[1]);
    if (Math.max(za, zb) < zMin) continue;
    if (Math.min(za, zb) + A.Dc > dFar) continue;
    // cull pieces wholly off the frame's sides
    const qa = P.p(c[0], 0, Math.max(zMin, za));
    const sxa = 540 + (qa[0] - A.cam.cx) * A.k;
    const halfPx = (half(sa) + 400) * P.r(Math.max(zMin, Math.min(za, zb))) * A.k;
    if (sxa + halfPx < -60 || sxa - halfPx > 1140) continue;
    // the piece's nearest corner (on a bend or a diagonal its edges reach nearer than its centre line)
    const wMax = (kind === "hwy" ? HWY_W + 110 : half(sa) + 70) + 10;
    const corners = [edgeAt(sa, wMax), edgeAt(sa, -wMax), edgeAt(sn, wMax), edgeAt(sn, -wMax)];
    const zNearestW = Math.min(lineAt(L, sa).p[1], lineAt(L, sn).p[1], ...corners.map((q) => q[1]));
    const zFarthestW = Math.max(lineAt(L, sa).p[1], lineAt(L, sn).p[1], ...corners.map((q) => q[1]));
    const zm = (za + zb) / 2;
    const midW = lineAt(L, (sa + sn) / 2).p;
    const hM = TH(midW[0], midW[1]);
    const rM = P.r(zm);
    const pxPerU = rM * A.k;
    const sub = Math.max(1, Math.min(4, Math.round(((sn - sa) * pxPerU) / 60)));
    // the dirt road's soft entry: its caliche share k at the piece's two ends (by their screen row, and the frame)
    let soft: { y: [number, number]; k: [number, number]; g: string } | null = null;
    if (kind === "dirt" && W.frame >= SOFT_F0 && W.frame < SOFT_F1) {
      const kT = sstep(SOFT_T0, SOFT_F1 - 1, W.frame);
      const ends = [lineAt(L, sa).p, lineAt(L, sn).p].map((q) => toK(q)[1]);
      const kOf = (yk: number) => Math.max(kT, 1 - sstep(SOFT_Y1, SOFT_Y0, 960 + (yk - A.cam.cy) * A.k));
      const k: [number, number] = [kOf(ends[0]), kOf(ends[1])];
      if (Math.min(k[0], k[1]) < 0.999) soft = { y: [ends[0], ends[1]], k, g: A.tone(groundLocal(midW[0], midW[1]), zm, hM) };
    }
    const band = (o0: number, o1: number): P2[] => {
      const a: P2[] = [];
      const b: P2[] = [];
      for (let j = 0; j <= sub; j++) {
        const ss = lerp(sa, sn, j / sub);
        a.push(edgeAt(ss, o0));
        b.push(edgeAt(ss, o1));
      }
      return [...a, ...b.reverse()];
    };
    // once the city has gone (f160 on), the highway back toward it fades into the far land instead of running to the
    // horizon as a dark wedge
    const farFade = kind === "hwy" ? 1 - cityGone(W.frame) * sstep(14000, 40000, Math.min(za, zb) + A.Dc) : 1;
    if (farFade < 0.01) continue;
    const draw = (clip: { c: number; far: boolean } | null, keyS: string): React.ReactNode => {
      const D = (o0: number, o1: number) => {
        const q = band(o0, o1);
        // the near plane: keep only what lies beyond it
        let qc = clipZ(q, W.oz + zMin, true);
        if (clip && qc.length >= 3) qc = clipZ(qc, clip.c, clip.far);
        return qc.length >= 3 ? polyD(qc.map((p) => toK(p))) : "";
      };
      const els: React.ReactNode[] = [];
      if (kind === "hwy") {
        const hw = HWY_W;
        els.push(<path key="sh" d={D(-hw - 110, hw + 110)} fill={A.tone(formTone(SHOULDER, 0.62, PAL.shadow, 0.2), zm, hM)} />);
        els.push(<path key="as" d={D(-hw, hw)} fill={A.tone(mixHex(formTone(ASPHALT, 0.6, PAL.shadow, 0.2), "#7C7A70", 0.25 * vnoise(sa / 900, 1, 5)), zm, hM)} />);
        // the painted lines: cream edges, a solid double centre line (no dashes: nothing to strobe)
        const lineW = 22;
        const op = c01((lineW * pxPerU - 0.35) / 1.1);
        if (op > 0.02) {
          const lc = A.tone(mixHex(PAL.cream, "#D8D0BC", 0.4), zm, hM);
          const dl = D(hw - 50, hw - 50 - lineW) + D(-hw + 50, -hw + 50 + lineW) + D(10, 10 + 14) + D(-10, -10 - 14);
          els.push(<path key="ln" d={dl} fill={lc} opacity={0.8 * op} />);
        }
      } else {
        const hw = half(sa);
        // the soft entry (f112-129 only): where the road rises in from the frame's bottom edge it starts in the
        // ground's own tone and turns caliche as it climbs into the mid frame, so no pale band races up the edge
        const fillOf = (c: string, tag: string) => {
          if (!soft) return c;
          const [yA, yB] = soft.y;
          const [kA, kB] = soft.k;
          if (Math.abs(yB - yA) < 1) return mixHex(soft.g, c, (kA + kB) / 2);
          const gid = `dsoft${W.frame}_${keyS}_${tag}`;
          defs.push(
            <linearGradient key={gid} id={gid} gradientUnits="userSpaceOnUse" x1="0" y1={n2(yA)} x2="0" y2={n2(yB)}>
              <stop offset="0" stopColor={mixHex(soft.g, c, kA)} />
              <stop offset="1" stopColor={mixHex(soft.g, c, kB)} />
            </linearGradient>,
          );
          return `url(#${gid})`;
        };
        const defs: React.ReactNode[] = [];
        els.push(<path key="vg" d={D(-hw - 70, hw + 70)} fill={fillOf(A.tone(mixHex(formTone(RMAT.grassDry, 0.6, PAL.shadow, 0.2), RMAT.caliche.mid, 0.35), zm, hM), "vg")} opacity={0.85} />);
        els.push(<path key="cl" d={D(-hw, hw)} fill={fillOf(A.tone(mixHex(mixHex(RMAT.caliche.lit, PAL.cream, 0.28), RMAT.caliche.mid, 0.12 + 0.2 * vnoise(sa / 500, 2, 9)), zm, hM), "cl")} />);
        // two wheel ruts, a little darker, and the grassy hump between them when close
        const rw = 52;
        const op = c01((rw * pxPerU - 0.5) / 1.5);
        if (op > 0.02) {
          els.push(<path key="rt" d={D(-170, -170 + rw) + D(170 - rw, 170)} fill={fillOf(A.tone(RMAT.caliche.mid, zm, hM), "rt")} opacity={0.55 * op} />);
          els.push(<path key="hm" d={D(-40, 40)} fill={fillOf(A.tone(mixHex(RMAT.grassDry.mid, RMAT.caliche.mid, 0.4), zm, hM), "hm")} opacity={0.4 * op} />);
        }
        if (defs.length) els.unshift(<defs key="df">{defs}</defs>);
      }
      return (
        <g key={keyS} opacity={farFade < 0.999 ? n2(farFade) : undefined}>
          {els}
        </g>
      );
    };
    // a body on the road whose cut line crosses this piece: split it there
    const pa = lineAt(L, sa).p;
    const pb = lineAt(L, sn).p;
    const u = (o.unders ?? []).find((q) => {
      const dU = Math.min(Math.hypot(pa[0] - q.X, pa[1] - q.Z), Math.hypot(pb[0] - q.X, pb[1] - q.Z), Math.hypot(midW[0] - q.X, midW[1] - q.Z));
      return dU < q.R + wMax + (sn - sa) && zNearestW < q.cut && zFarthestW > q.cut;
    });
    if (u && kZ(u.cut) > zMin) {
      out.push({ Z: kZ(u.cut) + 0.5, node: draw({ c: u.cut, far: true }, `${kind}${sa}f`) });
      out.push({ Z: Math.max(kZ(zNearestW), zMin) - 1, node: draw({ c: u.cut, far: false }, `${kind}${sa}n`) });
    } else out.push({ Z: Math.max(kZ(zNearestW), zMin) - 1, node: draw(null, `${kind}${sa}`) });
  }
  return out;
};

// ===================================================================================================================
// TUFTS (HillGround's Tuft, on a world grid near the camera)
// ===================================================================================================================
const Tuft: React.FC<{ A: AirWorld; X: number; Zk: number; H: number; s: number; seed: number; frame: number; op: number }> = ({ A, X, Zk, H, s, seed, frame, op }) => {
  const base = A.P.p(X, -H, Zk);
  const r = A.P.r(Zk);
  const n = 3 + Math.floor(hash(seed) * 3);
  const wind = Math.sin(frame * 0.09 + X * 0.004 + Zk * 0.002) * 0.5 + Math.sin(frame * 0.21 + seed) * 0.25;
  const fillB = A.tone(mixHex(RMAT.grass.mid, RMAT.grassDry.mid, hash(seed + 1)), Zk, H);
  const fillT = A.tone(mixHex(RMAT.grassDry.lit, "#C9C29A", hash(seed + 2) * 0.6), Zk, H + s);
  let dB = "";
  let dF = "";
  for (let i = 0; i < n; i++) {
    const a = (i / Math.max(1, n - 1) - 0.5) * 1.1 + (hash(seed + i * 3) - 0.5) * 0.4;
    const len = s * (0.7 + 0.5 * hash(seed + i * 5));
    const lean = a * 0.55 + wind * 0.35 * (0.6 + hash(seed + i));
    const w = s * 0.11;
    const bx = base[0] + a * s * 0.25 * r;
    const by = base[1];
    const tx = bx + Math.sin(lean) * len * r;
    const ty = by - Math.cos(lean) * len * r;
    const mx = bx + Math.sin(lean * 0.5) * len * 0.5 * r;
    const my = by - Math.cos(lean * 0.5) * len * 0.5 * r;
    const blade = `M${n2(bx - w * r)},${n2(by)}Q${n2(mx - w * 0.45 * r)},${n2(my)} ${n2(tx)},${n2(ty)}Q${n2(mx + w * 0.45 * r)},${n2(my)} ${n2(bx + w * r)},${n2(by)}Z`;
    if (i % 2) dF += blade;
    else dB += blade;
  }
  return (
    <g opacity={op < 0.999 ? op : undefined}>
      <path d={dB} fill={fillB} />
      <path d={dF} fill={mixHex(fillB, fillT, 0.55)} />
    </g>
  );
};
/** clear ground (no tufts, no trees): the roads and their shoulders, the farm yard, the guard */
const clearAt = (X: number, Z: number, pad: number) => {
  const r = nearestRoad(X, Z);
  if (r.kind === 0 && r.d < HWY_W + 160 + pad) return true;
  if (r.kind === 1 && r.d < DIRT_HALF + pad) return true;
  if (Math.hypot(X - GUARD_AT[0], Z - GUARD_AT[1]) < 900 + pad) return true;
  return false;
};
export const tuftItems = (W: World, o: { step?: number; dMax?: number; dFrom?: number; sMul?: number; op?: number; seed?: number } = {}): Item[] => {
  const { A } = W;
  const P = A.P;
  const st = o.step ?? 150;
  const dMax = o.dMax ?? 7000;
  const dFrom = o.dFrom ?? 0;
  const sMul = o.sMul ?? 1;
  const opAll = o.op ?? 1;
  const sd = o.seed ?? 17;
  if (opAll < 0.01) return [];
  const camX = A.cam.cx;
  const camZw = W.oz - A.Dc;
  const out: Item[] = [];
  const dMin = P.zNear + 80 + A.Dc;
  for (let j = Math.floor((camZw + dMin) / st); j <= (camZw + dMax) / st; j++) {
    const dRow = j * st - camZw;
    const hw = ((560 + 60) * dRow) / (A.k * A.Dc);
    for (let i = Math.floor((camX - hw) / st); i <= (camX + hw) / st; i++) {
      const seed = hash2(i, j, sd) * 1000;
      if (hash(seed) < 0.3) continue;
      const X = (i + hash(seed + 11)) * st;
      const Z = (j + hash(seed + 13)) * st;
      const dd = Z - camZw;
      if (dd < Math.max(dMin, dFrom) || dd > dMax) continue;
      if (clearAt(X, Z, 60)) continue;
      const Zk = Z - W.oz;
      const H = TH(X, Z);
      const q = P.p(X, -H, Zk);
      const sy = 960 + (q[1] - A.cam.cy) * A.k;
      const sx = 540 + (q[0] - A.cam.cx) * A.k;
      if (sy < -40 || sy > 1990 || sx < -80 || sx > 1160) continue;
      const s = 62 * sMul * (0.7 + 0.6 * hash(seed + 17));
      if (s * P.r(Zk) * A.k < 1.6) continue;
      const op = opAll * (1 - sstep(dMax * 0.7, dMax, dd)) * (dFrom > 0 ? sstep(dFrom, dFrom + 1200, dd) : 1);
      out.push({ Z: Zk, node: <Tuft key={`t${i}_${j}`} A={A} X={X} Zk={Zk} H={H} s={s} seed={seed} frame={W.frame} op={op} /> });
    }
  }
  return out;
};

// ===================================================================================================================
// TREES: live oaks and cedar on a world grid (none on the roads, the yard, or the camera's sight lines)
// ===================================================================================================================
/** sight lines the cut looks along (world: from the camera to the car, every few frames): a tree is left out only
 *  where its crown would rise into one of them */
export type Seg = { a: [number, number, number]; b: [number, number, number] };
const blocks = (X: number, Z: number, top: number, R: number, s: Seg) => {
  const [ax, az, ah] = s.a;
  const [bx, bz, bh] = s.b;
  const vx = bx - ax;
  const vz = bz - az;
  const t = c01(((X - ax) * vx + (Z - az) * vz) / (vx * vx + vz * vz || 1));
  const dxz = Math.hypot(X - (ax + vx * t), Z - (az + vz * t));
  if (dxz > R + 250) return false;
  return lerp(ah, bh, t) < top + 220;
};
const TREE_CELL = 1500;
type Tree = { X: number; Z: number; kind: 0 | 1 | 2; size: number; seed: number };
const treeCache = new Map<string, Tree[]>();
const CEDAR_LIGHT: Mat = { lit: "#7A8B70", mid: "#5A6B58", dark: "#36443A" };
// cut 59's lit bush (NothingButMoreHills): olive with a pale rim on the lit side, never a black shape
const BUSH_MAT: Mat = { lit: "#76845A", mid: "#52603C", dark: "#3D4A33" };
const CEDAR_RIM = "#B9B98E";
const treeOk = (t: Tree, keep: Seg[], camPath: P2[], east = false) => {
  if (clearAt(t.X, t.Z, t.kind === 0 ? 520 : 380)) return false;
  const top = TH(t.X, t.Z) + (t.kind === 0 ? 1.2 : 1.05) * t.size;
  const R = (t.kind === 0 ? 0.95 : 0.5) * t.size;
  // (the second half's camera is high: a tree under it sweeps through the bottom of the frame, so none near its path)
  if (camPath.some((q) => Math.hypot(q[0] - t.X, q[1] - t.Z) < (east ? 6500 : t.kind === 0 ? 1400 : 3600))) return false;
  return !keep.some((sg) => blocks(t.X, t.Z, top, R, sg));
};
const treeAt = (i: number, j: number, keep: Seg[], camPath: P2[]): Tree[] => {
  const key = `${i},${j}`;
  const hit = treeCache.get(key);
  if (hit) return hit;
  const h = (k: number) => hash2(i, j, 50 + k);
  const X = (i + 0.15 + 0.7 * h(1)) * TREE_CELL;
  const Z = (j + 0.15 + 0.7 * h(2)) * TREE_CELL;
  const out: Tree[] = [];
  if (eastOf(X, Z) < 0.5) {
    // density: the hills more wooded on their slopes and in the draws, the city's plain sparse
    const plain = sstep(38000, 50000, Z);
    const dens = lerp(0.46, 0.12, plain) * (0.6 + 0.8 * vnoise(X / 9000, Z / 9000, 61));
    if (h(3) < dens && !clearAt(X, Z, 520) && Math.hypot(X - FARM_X, Z - (FARM_Z + 600)) > 3400) {
      const kind = (h(4) < 0.66 ? 0 : h(4) < 0.86 ? 1 : 2) as 0 | 1 | 2;
      const size = kind === 0 ? (4.2 + 2.2 * h(5)) * U : kind === 1 ? (2.2 + 1.0 * h(5)) * U : (2.6 + 1.2 * h(5)) * U;
      const t: Tree = { X, Z, kind, size, seed: Math.floor(h(6) * 97) + 1 };
      if (treeOk(t, keep, camPath)) out.push(t);
    }
  } else {
    // the second half's country: mostly open grass; now and then a mott of live oaks or a cedar brake, in a fold or
    // on a slope (2-5 crowns close together), and a rare lone tree
    const e = 40;
    const slope = Math.hypot(TH(X + e, Z) - TH(X - e, Z), TH(X, Z + e) - TH(X, Z - e)) / (2 * e);
    const mott = vnoise(X / 6500 + 2.7, Z / 5200 + 0.4, 71);
    const pClump = 0.34 * sstep(0.64, 0.8, mott) * (0.4 + Math.min(1, slope * 6));
    if (h(3) < pClump) {
      const brake = vnoise(X / 9000, Z / 9000, 72) > 0.55;
      const n = 2 + Math.floor(h(7) * 3);
      for (let m = 0; m < n; m++) {
        const hm = (k: number) => hash2(i * 7 + m, j * 5 - m, 90 + k);
        const kind = (brake ? (hm(1) < 0.75 ? 1 : 2) : hm(1) < 0.7 ? 0 : 2) as 0 | 1 | 2;
        const size = kind === 0 ? (4.0 + 2.0 * hm(2)) * U : kind === 1 ? (2.2 + 1.0 * hm(2)) * U : (2.6 + 1.2 * hm(2)) * U;
        const ang = hm(3) * Math.PI * 2;
        const rr = m === 0 ? 0 : 260 + 300 * hm(4);
        const t: Tree = { X: X + Math.cos(ang) * rr, Z: Z + Math.sin(ang) * rr * 0.8, kind, size, seed: Math.floor(hm(5) * 97) + 1 };
        if (treeOk(t, keep, camPath, true)) out.push(t);
      }
    } else if (h(3) > 0.975) {
      const kind = (h(4) < 0.6 ? 0 : 2) as 0 | 1 | 2;
      const t: Tree = { X, Z, kind, size: (kind === 0 ? 4.6 + 1.8 * h(5) : 2.6 + 1.0 * h(5)) * U, seed: Math.floor(h(6) * 97) + 1 };
      if (treeOk(t, keep, camPath, true)) out.push(t);
    }
  }
  treeCache.set(key, out);
  return out;
};
export const treeItems = (W: World, keep: Seg[], camPath: P2[], o: { dMax?: number } = {}): Item[] => {
  const { A } = W;
  const P = A.P;
  const dMax = o.dMax ?? 42000;
  const camX = A.cam.cx;
  const camZw = W.oz - A.Dc;
  const out: Item[] = [];
  const dMin = P.zNear + 200 + A.Dc;
  for (let j = Math.floor((camZw + dMin) / TREE_CELL) - 1; j <= (camZw + dMax) / TREE_CELL; j++) {
    const dRow = Math.max(dMin, j * TREE_CELL - camZw);
    const hw = ((620 + 80) * dRow) / (A.k * A.Dc) + TREE_CELL;
    for (let i = Math.floor((camX - hw) / TREE_CELL); i <= (camX + hw) / TREE_CELL; i++) {
      for (const [ti, t] of treeAt(i, j, keep, camPath).entries()) {
      const dd = t.Z - camZw;
      if (dd < dMin || dd > dMax) continue;
      const Zk = t.Z - W.oz;
      const H = TH(t.X, t.Z) - 10;
      const q = P.p(t.X, -H, Zk);
      const sx = 540 + (q[0] - A.cam.cx) * A.k;
      const px = t.size * P.r(Zk) * A.k;
      if (sx + px < -40 || sx - px > 1120) continue;
      const sy = 960 + (q[1] - A.cam.cy) * A.k;
      if (sy - px * 1.2 > 1960 || sy < -20) continue;
      // fade, never cut: out as it shrinks to a couple of px, out with distance, out where it nears the camera
      if (px < 1.6) continue;
      const op = sstep(1.6, 4.5, px) * (1 - sstep(dMax * 0.78, dMax, dd)) * sstep(dMin, dMin + 700, dd);
      if (op < 0.01) continue;
      const uid = `tr${i}_${j}_${ti}`;
      const node =
        t.kind === 0 ? (
          <LiveOak key={uid} A={A} X={t.X} Z={Zk} H={H} size={t.size} seed={t.seed} frame={W.frame} uid={uid} />
        ) : t.kind === 1 ? (
          <CedarBush key={uid} A={A} X={t.X} Z={Zk} H={H} size={t.size} seed={t.seed} frame={W.frame} uid={uid} mat={CEDAR_LIGHT} rim={CEDAR_RIM} />
        ) : (
          <CedarBush key={uid} A={A} X={t.X} Z={Zk} H={H} size={t.size} seed={t.seed + 3} frame={W.frame} uid={uid} mat={BUSH_MAT} rim={CEDAR_RIM} />
        );
      out.push({ Z: Zk - t.size * 0.3, node: op < 0.999 ? <g key={`g${uid}`} opacity={op}>{node}</g> : node });
      }
    }
  }
  return out;
};

// ===================================================================================================================
// FENCES: barbed wire on cedar posts, one item per span (so a hill or the car sorts correctly against each span)
// ===================================================================================================================
export type FenceSpec = { pts: P2[]; spacing: number; seed: number; skip?: number[] };
export const fencePosts = (f: FenceSpec): P2[] => {
  const posts: P2[] = [];
  for (let i = 0; i < f.pts.length - 1; i++) {
    const [x0, z0] = f.pts[i];
    const [x1, z1] = f.pts[i + 1];
    const n = Math.max(1, Math.round(Math.hypot(x1 - x0, z1 - z0) / f.spacing));
    for (let k = 0; k < n; k++) posts.push([lerp(x0, x1, k / n), lerp(z0, z1, k / n)]);
  }
  posts.push(f.pts[f.pts.length - 1]);
  return posts;
};
const STRANDS = [70, 125, 180, 235];
export const fenceItems = (W: World, f: FenceSpec, posts: P2[], o: { dMax?: number } = {}): Item[] => {
  const { A } = W;
  const P = A.P;
  const dMax = o.dMax ?? 26000;
  const camZw = W.oz - A.Dc;
  const zMin = P.zNear + 60;
  const out: Item[] = [];
  for (let i = 0; i < posts.length; i++) {
    const [x0, z0w] = posts[i];
    const z0 = z0w - W.oz;
    const d0 = z0w - camZw;
    if (z0 < zMin || d0 > dMax) continue;
    const q0 = P.p(x0, -TH(x0, z0w), z0);
    const sx = 540 + (q0[0] - A.cam.cx) * A.k;
    const sy = 960 + (q0[1] - A.cam.cy) * A.k;
    const r0 = P.r(z0);
    const op = 1 - sstep(dMax * 0.75, dMax, d0);
    const els: React.ReactNode[] = [];
    // the span to the next post
    if (i < posts.length - 1) {
      const [x1, z1w] = posts[i + 1];
      const z1 = z1w - W.oz;
      if (z1 >= zMin) {
        const g0 = TH(x0, z0w);
        const g1 = TH(x1, z1w);
        const zm = (z0 + z1) / 2;
        const r = P.r(zm);
        const q1 = P.p(x1, -g1, z1);
        const sx1 = 540 + (q1[0] - A.cam.cx) * A.k;
        if (!((sx < -40 && sx1 < -40) || (sx > 1120 && sx1 > 1120))) {
          let d = "";
          let barbs = "";
          const bpx = 60 * r * A.k;
          const bop = c01((bpx - 7) / 5);
          for (const h of STRANDS) {
            const q: V3[] = [0, 0.25, 0.5, 0.75, 1].map((t) => [lerp(x0, x1, t), lerp(g0, g1, t) + h - 6 * Math.sin(Math.PI * t), lerp(z0, z1, t)]);
            d += line3(A, q);
            if (bop > 0) {
              const L = Math.hypot(x1 - x0, z1w - z0w);
              for (let s = 40; s < L - 20; s += 70) {
                const t = s / L;
                const p = proj(A, [lerp(x0, x1, t), lerp(g0, g1, t) + h - 6 * Math.sin(Math.PI * t), lerp(z0, z1, t)]);
                const e = 7 * r;
                barbs += `M${n2(p[0] - e)},${n2(p[1] - e)}L${n2(p[0] + e)},${n2(p[1] + e)}M${n2(p[0] - e)},${n2(p[1] + e)}L${n2(p[0] + e)},${n2(p[1] - e)}`;
              }
            }
          }
          const col = A.tone("#5E5A52", zm, 150);
          const wpx = Math.max(A.lw(0.55), 3.2 * r);
          els.push(<path key="w" d={d} fill="none" stroke={col} strokeWidth={wpx} strokeOpacity={0.8 * c01((3.2 * r * A.k) / 0.5 + 0.35)} />);
          if (barbs) els.push(<path key="b" d={barbs} fill="none" stroke={col} strokeWidth={Math.max(A.lw(0.45), 2.4 * r)} strokeOpacity={0.8 * bop} />);
        }
      }
    }
    if (sx > -40 && sx < 1120 && sy < 2000 && !(f.skip ?? []).includes(i < 0 ? i : i === posts.length - 1 ? -1 : i)) els.push(<CedarPost key="p" A={A} X={x0} Z={z0} H={TH(x0, z0w)} seed={f.seed * 31 + i} />);
    if (!els.length) continue;
    void r0;
    const zKey = i < posts.length - 1 ? Math.min(z0, posts[i + 1][1] - W.oz) - 2 : z0 - 2;
    out.push({ Z: zKey, node: <g key={`f${f.seed}_${i}`} opacity={op < 0.999 ? op : undefined}>{els}</g> });
  }
  return out;
};
/** the ranch fences along the highway (both sides, 1100 off its centre); the left one runs through the guard */
export const HWY_FENCE_OFF = 1100;
export const highwayFences = (): FenceSpec[] => {
  const left: P2[] = [];
  const right: P2[] = [];
  const L = HWY_LINE;
  const sStart = L.s.find((_, i) => L.pts[i][1] < 52000) ?? 0;
  const total = L.s[L.s.length - 1];
  for (let s = sStart; s <= total; s += 300) {
    const { p, t } = lineAt(L, s);
    left.push([p[0] - t[1] * HWY_FENCE_OFF, p[1] + t[0] * HWY_FENCE_OFF]);
    right.push([p[0] + t[1] * HWY_FENCE_OFF, p[1] - t[0] * HWY_FENCE_OFF]);
  }
  // split the left fence at the guard's gap (its corner posts carry the wire on)
  const gap = 1100;
  const near = (q: P2) => Math.hypot(q[0] - GUARD_AT[0], q[1] - GUARD_AT[1]);
  const a: P2[] = [];
  const b: P2[] = [];
  let past = false;
  for (const q of left) {
    if (near(q) < gap) {
      past = true;
      continue;
    }
    (past ? b : a).push(q);
  }
  a.push([GUARD_AT[0] - HWY_DIR[0] * gap, GUARD_AT[1] - HWY_DIR[1] * gap]);
  b.unshift([GUARD_AT[0] + HWY_DIR[0] * gap, GUARD_AT[1] + HWY_DIR[1] * gap]);
  return [
    { pts: a, spacing: 1100, seed: 3, skip: [-1] },
    { pts: b, spacing: 1100, seed: 5, skip: [0] },
    { pts: right, spacing: 1100, seed: 7 },
  ];
};
export { rawH };
