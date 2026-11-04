// ---------------------------------------------------------------------------
// farOutFar — FarOutOfAustin's far country in the second half (robert-johnson-ranch cut 6, take 3).
//   farRowItems(W, c) -> Item[]: the plan's flatRows() painted like cut 59 (HillCountryRidges, grass + flatFar,
//   paling into FAR_HAZE toward a clear horizon), one item per row at its own Z so the near land, trees and road
//   sort against them; each of the nearer rows carries its stretch of the caliche ranch road: it comes up from behind
//   the row in front, winds across the row's face and tops it at a saddle near the row's xRoad (at f321), so the road
//   can be followed back over ridge after ridge toward the horizon. The rows come up out of the haze over FLAT_IN.
// ---------------------------------------------------------------------------
import React from "react";
import { mixHex } from "../kits/dwarkesh-3d/dwarkesh3d";
import { HillCountryRidges, RMAT, hillTop, type Item, type Ridge } from "./ranchWorld";
import { FAR_HAZE, type World } from "./farOutGround";
import { n2 } from "./farOutFaces";
import { DURATION, FLAT_Z0, TH, camAt, dirtXAtZ, flatIn, flatRows, type CamW, type FlatRow } from "./farOutPlan";

type P2 = [number, number];
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const Pt = (p: P2) => `${n2(p[0])},${n2(p[1])}`;
const ROAD_ROWS = 7;
/** the road's seen thickness on a row's face (world units: a 600-wide road seen from ~17 degrees above) */
const ROAD_T = 150;

const catmull = (K: P2[], sub: number): P2[] => {
  const out: P2[] = [];
  for (let i = 0; i < K.length - 1; i++) {
    const p0 = K[Math.max(0, i - 1)];
    const p1 = K[i];
    const p2 = K[i + 1];
    const p3 = K[Math.min(K.length - 1, i + 2)];
    for (let j = 0; j < sub; j++) {
      const t = j / sub;
      const t2 = t * t;
      const t3 = t2 * t;
      const cr = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([cr(p0[0], p1[0], p2[0], p3[0]), cr(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(K[K.length - 1]);
  return out;
};

const ridgeOf = (r: FlatRow): Ridge => ({ Z: r.Z, H: r.H, amp: r.amp, lambda: r.lambda, seed: r.seed, tree: r.tree, dots: r.dots });

/** the road on each of the nearer rows, in the row's plane (X, H), world-fixed; set once from the end camera */
type RowRoad = { pts: P2[] };
let ROADS: RowRoad[] | null = null;
const rowRoads = (): RowRoad[] => {
  if (ROADS) return ROADS;
  const ce: CamW = camAt(DURATION - 1);
  const rows = flatRows();
  const out: RowRoad[] = [];
  let prevX = 0;
  let prevY = 0;
  for (let i = 0; i < Math.min(ROAD_ROWS, rows.length); i++) {
    const r = rows[i];
    const rd = ridgeOf(r);
    const d = r.Z - ce.Z;
    const px = d / ce.C;
    // the crossing: the lowest point of the crest within half a hill of the row's xRoad
    const Xt = ce.X + (r.xRoad - 540) * px;
    let b = Xt;
    let hb = Infinity;
    for (let k = -20; k <= 20; k++) {
      const X = Xt + (k / 20) * 0.5 * r.lambda;
      const h = hillTop(rd, X);
      if (h < hb) {
        hb = h;
        b = X;
      }
    }
    // the start: row 0 from the ranch road's end on the land; the others from just behind the row in front (where the
    // road went over it), below that row's crest line as seen from the end camera
    let a: number;
    let ha: number;
    if (i === 0) {
      a = dirtXAtZ(FLAT_Z0);
      ha = TH(a, FLAT_Z0) - 420;
    } else {
      a = ce.X + (prevX - 540) * px;
      ha = ce.E - (prevY - ce.yH) * px - 0.25 * r.amp;
    }
    const dh = hb - ha;
    const w = 52 * px * (i === 0 ? 0.8 : 1);
    const side = i % 2 ? -1 : 1;
    // it comes up straight from where it was last seen (the ranch road's end, or the crest of the row in front), so
    // each stretch reads as the same road, then winds across the face to the saddle
    const K: P2[] = [
      [a, ha],
      [a, ha + 0.3 * dh],
      [lerp(a, b, 0.45) + side * w, ha + 0.6 * dh],
      [lerp(a, b, 0.8) - side * 0.5 * w, ha + 0.85 * dh],
      [b, hb + 0.02 * r.amp],
      [b + side * 0.15 * w, hb + 0.3 * r.amp],
    ];
    out.push({ pts: catmull(K, 10) });
    prevX = 540 + ((b - ce.X) * ce.C) / d;
    prevY = ce.yH + ((ce.E - hb) * ce.C) / d;
  }
  ROADS = out;
  return out;
};

export const farRowItems = (W: World): Item[] => {
  const { A, frame, oz } = W;
  const fin = flatIn(frame);
  if (fin < 0.003) return [];
  const rows = flatRows();
  const roads = rowRoads();
  const P = A.P;
  const k = A.k;
  const camZw = oz - A.Dc;
  const dist = (Z: number) => Z - camZw;
  const l0 = Math.log(dist(rows[0].Z));
  const l1 = Math.log(dist(rows[rows.length - 1].Z));
  const bottomY = A.cam.cy + 1040 / k;
  const topY = A.cam.cy - 1100 / k;
  const left = A.cam.cx - 700 / k;
  const right = A.cam.cx + 700 / k;
  // the stack, as cut 59 paints it (each row's valley mist reaches down to the crest of the row in front)
  const ridges: Ridge[] = rows.filter((r) => r.Z - oz > P.zNear + 100).map((r) => ({ ...ridgeOf(r), Z: r.Z - oz }));
  // each row's outline (everything below its crest), for the road's clips
  const outlineOf = (r: FlatRow) => {
    const Zk = r.Z - oz;
    const rd = ridgeOf(r);
    const hw = 640 / (k * P.r(Zk));
    const N = 110;
    const X0 = A.cam.cx - hw;
    const top: P2[] = [];
    for (let j = 0; j <= N; j++) {
      const X = X0 + (2 * hw * j) / N;
      top.push(P.p(X, -hillTop(rd, X), Zk));
    }
    return `M${top.map(Pt).join("L")}L${n2(top[N][0])},${n2(bottomY)}L${n2(top[0][0])},${n2(bottomY)}Z`;
  };
  const frame0 = `M${n2(left)},${n2(topY)}H${n2(right)}V${n2(bottomY + 200 / k)}H${n2(left)}Z`;
  const defs: React.ReactNode[] = [];
  const roadEls: React.ReactNode[] = [];
  const outlines = rows.slice(0, roads.length).map((r) => (r.Z - oz > P.zNear + 100 ? outlineOf(r) : null));
  roads.forEach((rr, i) => {
    const r = rows[i];
    const Zk = r.Z - oz;
    const ol = outlines[i];
    if (!ol) return;
    const sc = P.r(Zk);
    if (ROAD_T * sc * k < 0.7) return;
    const t = Math.max(0, Math.min(1, (Math.log(dist(r.Z)) - l0) / (l1 - l0)));
    const haze = 0.05 + 0.8 * Math.pow(0.82 * t, 1.15);
    const cal = mixHex(mixHex(RMAT.caliche.lit, "#E6DCC0", 0.25), FAR_HAZE, 0.8 * haze);
    const verge = mixHex(mixHex(RMAT.caliche.mid, RMAT.grassDry.mid, 0.5), FAR_HAZE, 0.8 * haze);
    const d = `M${rr.pts.map(([X, H]) => Pt(P.p(X, -H, Zk))).join("L")}`;
    // visible only on its own row: inside its outline, outside every nearer row's
    const cid = `frc${i}`;
    defs.push(
      <clipPath key={cid} id={cid}>
        <path d={ol} />
      </clipPath>,
    );
    let node: React.ReactNode = (
      <g clipPath={`url(#${cid})`}>
        <path d={d} fill="none" stroke={verge} strokeWidth={n2(ROAD_T * 1.7 * sc)} strokeLinecap="round" strokeLinejoin="round" opacity={0.45} />
        <path d={d} fill="none" stroke={cal} strokeWidth={n2(ROAD_T * sc)} strokeLinecap="round" strokeLinejoin="round" />
      </g>
    );
    for (let j = 0; j < i; j++) {
      const oj = outlines[j];
      if (!oj) continue;
      const xid = `frx${i}_${j}`;
      defs.push(
        <clipPath key={xid} id={xid}>
          <path d={frame0 + oj} clipRule="evenodd" />
        </clipPath>,
      );
      node = <g clipPath={`url(#${xid})`}>{node}</g>;
    }
    roadEls.push(<React.Fragment key={`rr${i}`}>{node}</React.Fragment>);
  });
  void l1;
  return [
    {
      Z: FLAT_Z0 - oz + 0.5,
      node: (
        <g key="farrows" opacity={fin < 0.999 ? n2(fin) : undefined}>
          <defs>{defs}</defs>
          <HillCountryRidges A={A} ridges={ridges} uid="fr" tRange={[0, 0.82]} hazeHex={FAR_HAZE} grass flatFar />
          {roadEls}
        </g>
      ),
    },
  ];
};
