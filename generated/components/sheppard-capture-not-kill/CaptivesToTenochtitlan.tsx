// ---------------------------------------------------------------------------
// CaptivesToTenochtitlan (file 53_CaptivesToTenochtitlan; Dwarkesh Patel with
// Si Sheppard, "Capture, not kill"). Dwarkesh map style, the umber "page" (no
// map); the cast is captureFigures. Opaque 1080x1920, 23.976 fps.
//
// CHECK LINE: "An Aztec warrior who marched a live captive back to the temple
// in Tenochtitlan was rewarded with rank he could wear."
//
// THE LINE: "The warriors would be recognized for bringing captives back to
// Tenochtitlan for sacrifice."
// WORD -> FRAME: warriors 4 · would 14 · be 29 · recognized 37 · for 52 ·
//   bringing 59 · captives 66 · back 77 · to 84 · Tenochtitlan 87 · for 101 ·
//   sacrifice 110.
// DURATION: sequence 53.595 - 58.850 s = 5.255 s x 23.976 = 126 frames (f0..f125).
//
// THE MOTION (one move): an ORANGE warrior leads a CREAM bound captive by a
// rope toward the right at a constant walk, a furled feather back-standard on
// his back, the camera travelling with them while the stair of the great
// temple slides in; he stops at its foot (~f70), the captive comes up behind
// him, and the bound feathers open
// out of the sheaf into a tall orange fan above his head (open by f108).
// Then it holds, alive: the feathers stir, the rope hangs, the camera creeps.
// Orange = the Aztec side (the warriors and what they wear). No sacrifice shown.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { DARK, hash, smootherstep, smoothstep } from "../kits/maps/incaShared";
import { POSES, Rope, Totonac, Warrior, captureAnchors, walkLegs, type FigPose, type Ink, CREAM, ORANGE } from "./captureFigures";
import { FPS, TexcocoPage, WALK, WorldSvg, idle, makeCamera, poseTrack, shadeInk, track, type P2 } from "../kits/maps/texcocoShared";
import { add, mix, mul, norm, rot, sub, vlen } from "../kits/maps/stringsMotion";

export { FPS };
export const DURATION = 126;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// ---------------------------------------------------------------------------
// the engraver's helpers (as texcocoFigures')
// ---------------------------------------------------------------------------
const P = (v: P2) => `${v[0].toFixed(1)},${v[1].toFixed(1)}`;
const OUT = { stroke: DARK, strokeWidth: 2.3, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
const ln = (w = 1.2, a = 0.8) => ({ fill: "none", stroke: DARK, strokeWidth: w, strokeOpacity: a, strokeLinecap: "round" as const, strokeLinejoin: "round" as const });
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
/** a tapered form through stations [point, width] */
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
const Cased: React.FC<{ id: string; r?: number; children?: React.ReactNode }> = ({ id, r = 1.5, children }) => (
  <>
    <filter id={id} x="-40%" y="-40%" width="180%" height="180%" colorInterpolationFilters="sRGB">
      <feMorphology in="SourceAlpha" operator="dilate" radius={r} result="fat" />
      <feGaussianBlur in="fat" stdDeviation={r * 0.45} result="soft" />
      <feFlood floodColor={DARK} floodOpacity={0.62} />
      <feComposite in2="soft" operator="in" result="case" />
      <feMerge>
        <feMergeNode in="case" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <g filter={`url(#${id})`}>{children}</g>
  </>
);
// ---------------------------------------------------------------------------
// LAYOUT (world px). The stair's first riser (its near side) is at x = 0, the
// ground at y = GY; everything walks toward + x.
// ---------------------------------------------------------------------------
const GY = 1240;
/** px per figure unit of the hero pair (a man ~310 units: ~660 px) */
const U = 2.15;
const CYCLE = WALK.cycle;
const ADV = WALK.advance(U);
/** where the hero warrior stands at the end (his feet) */
const X1 = -72;
/** the captive's distance behind him at the end, px */
const GAP_END = 226;

// ---- the walk: constant speed, then he stops at the foot of the stair
const T = { stop: 61, capStop: 73, ties: 85, open: 89, opened: 108 };
const warAmount = (f: number) => 1 - smoothstep((f - T.stop) / 9);
const capAmount = (f: number) => 1 - smoothstep((f - T.capStop) / 9);
const integral = (fn: (f: number) => number) => {
  const out = [0];
  for (let f = 0; f < DURATION; f++) out.push(out[f] + (fn(f) + fn(f + 1)) / 2);
  return out;
};
const WAR_W = integral(warAmount);
const CAP_W = integral(capAmount);
const at = (arr: number[], f: number) => arr[Math.max(0, Math.min(DURATION, Math.round(f)))];
const warX = (f: number) => X1 - (WAR_W[DURATION] - at(WAR_W, f)) * ADV;
const capX = (f: number) => X1 - GAP_END - (CAP_W[DURATION] - at(CAP_W, f)) * ADV;
const PH_W = 0.2;
const PH_C = 0.72;

// ---- the poses
const LEAD = POSES.lead(1);
const STOOD: FigPose = { ...LEAD, pitch: -4, lean: -0.8, armR: { w: [-8, -150], elbow: [-0.4, 1], fist: 1, hand: 0 } };
const PROUD: FigPose = { ...STOOD, pitch: -9, lean: -1.6, brow: 0.15, mouth: 0.25 };
const warTrack = poseTrack([
  [0, LEAD],
  [T.stop, LEAD],
  [T.stop + 13, STOOD],
  [T.open + 2, STOOD],
  [T.opened - 2, PROUD],
  [125, { ...PROUD, pitch: -9.6 }],
]);
const BOUND = POSES.bound(1);
const capTrack = poseTrack([
  [0, BOUND],
  [T.capStop, BOUND],
  [T.capStop + 14, { ...BOUND, pitch: 16, lean: 3.4, lids: 0.45 }],
  [125, { ...BOUND, pitch: 17, lean: 3.6, lids: 0.5 }],
]);
const ropeSlack = track([[0, 0.2], [T.stop, 0.2], [T.capStop + 12, 0.92], [125, 0.96]]);

// ---------------------------------------------------------------------------
// THE CAMERA: with them along the ground, easing back and up for the banner
// ---------------------------------------------------------------------------
const camAt = makeCamera([
  { f: 0, k: 1.0, wx: warX(0), wy: GY, sx: 482, sy: 1500 },
  { f: 34, k: 0.996, wx: warX(34), wy: GY, sx: 490, sy: 1500 },
  { f: 66, k: 0.988, wx: warX(66), wy: GY, sx: 474, sy: 1500 },
  { f: 86, k: 0.98, wx: X1, wy: GY, sx: 482, sy: 1500 },
  { f: 108, k: 0.972, wx: X1, wy: GY, sx: 489, sy: 1500 },
  { f: 125, k: 0.967, wx: X1, wy: GY, sx: 491, sy: 1500 },
]);

// ---------------------------------------------------------------------------
// THE BACK-STANDARD: a pole strapped to his back; its feathers bound up tight
// (spread 0) open upward and outward into a tall fan on a frame (spread 1).
// Figure-local units; drawn BEHIND the warrior.
// ---------------------------------------------------------------------------
const N_FEATHER = 13;
const FAN = 68;
const FEATHER_L = 170;
/** how far the bound sheaf still splays (of the open fan) */
const FURLED = 0.085;
type BannerState = {
  /** 0 = furled, 1 = open; ties 0 = bound up the bundle, 1 = slid down to the hub */
  spread: number;
  ties: number;
  /** the global frame (the feathers stir) and how much */
  g: number;
  stir: number;
  /** extra tilt, deg */
  sway: number;
};
const Banner: React.FC<{ rig: ReturnType<typeof captureAnchors>["rig"]; lean: number; at: P2; scale: number; st: BannerState; ink?: Ink; uid: string }> = ({ rig, lean, at: figAt, scale, st, ink = ORANGE, uid }) => {
  const hub = rig.toFig([-37, rig.shY - 74]);
  const foot = rig.toFig([-27, -6]);
  const tilt = lean - 5 + st.sway;
  const feathers = Array.from({ length: N_FEATHER }, (_, i) => {
    const u = (i / (N_FEATHER - 1)) * 2 - 1;
    // the outer feathers lead, the middle follows a few frames' worth behind
    const s = smootherstep(st.spread * 1.18 - 0.18 * (1 - Math.abs(u)));
    const e = mix(FURLED, 1, s);
    const L = FEATHER_L - 36 * Math.abs(u) ** 1.6 - 16 * hash(i, 771) * (1 - s);
    const W = mix(11, 27, s);
    const a = tilt + u * FAN * e + st.stir * s * 1.5 * Math.sin(st.g / 8.5 + i * 0.9);
    const bend = u * 13 * s + st.stir * s * 2.2 * Math.sin(st.g / 7 + i * 1.3 + 1);
    const pt = (t: number): P2 => add(hub, rot([0, -L * t], a + bend * t * t));
    return { i, u, s, W, pt };
  }).sort((p, q) => Math.abs(q.u) - Math.abs(p.u));
  const sAll = smootherstep(st.spread);
  const inner = [-0.86, 0.86, -0.52, 0.52, -0.18, 0.18].map((u, j) => {
    const a = tilt + u * FAN * 0.92 * mix(0.05, 1, sAll) + st.stir * sAll * 1.2 * Math.sin(st.g / 9 + j);
    const pt = (t: number): P2 => add(hub, rot([0, -56 * t], a));
    return { j, pt, W: mix(5, 17, sAll) };
  });
  const dir = rot([0, -1], tilt);
  const nrm: P2 = [-dir[1], dir[0]];
  const ties = [0.14, 0.3, 0.5].map((v, j) => {
    const d = mix(v * FEATHER_L, 15 + 6 * j, smootherstep(st.ties));
    const hw = 6 + d * Math.tan((FAN * mix(FURLED, 1, sAll) * Math.PI) / 180) * (1 - 0.86 * smoothstep(sAll * 3));
    const c = add(hub, mul(dir, d));
    return { j, a: add(c, mul(nrm, -Math.min(hw, 17))), b: add(c, mul(nrm, Math.min(hw, 17))) };
  });
  const hubR = mix(7.5, 12.5, sAll);
  return (
    <g transform={`translate(${figAt[0].toFixed(2)} ${figAt[1].toFixed(2)}) scale(${scale.toFixed(4)})`}>
      <Cased id={`${uid}-case`} r={1.4}>
        {/* the pole */}
        <path d={`M${P(foot)}L${P(hub)}`} fill="none" stroke={DARK} strokeWidth={8.2} strokeLinecap="round" />
        <path d={`M${P(foot)}L${P(hub)}`} fill="none" stroke={ink.deep} strokeWidth={4.8} strokeLinecap="round" />
        {feathers.map((ft) => {
          const { pt, W, s, i } = ft;
          const d = limbD([
            [pt(0.02), W * 0.3],
            [pt(0.22), W * 0.62],
            [pt(0.48), W * 0.95],
            [pt(0.72), W],
            [pt(0.9), W * 0.74],
            [pt(1), W * 0.3],
          ]);
          let barbs = "";
          if (s > 0.25)
            for (let t = 0.26; t < 0.95; t += 0.085) {
              const p = pt(t);
              const ax = norm(sub(pt(t + 0.04), pt(t - 0.04)));
              const w = W * (t < 0.72 ? mix(0.62, 1, (t - 0.22) / 0.5) : mix(1, 0.6, (t - 0.72) / 0.28)) * 0.4;
              barbs += `M${P(p)}L${P(add(p, add(mul(ax, -w * 0.75), mul([-ax[1], ax[0]], w))))}`;
            }
          return (
            <g key={i}>
              <path d={d} fill={i % 2 ? ink.deep : ink.main} {...OUT} strokeWidth={mix(1.05, 1.9, s)} strokeOpacity={mix(0.8, 1, s)} />
              <path d={`M${P(pt(0.1))}L${P(pt(0.4))}L${P(pt(0.7))}L${P(pt(0.95))}`} {...ln(1.1, mix(0.22, 0.7, s))} />
              {barbs ? <path d={barbs} {...ln(0.9, 0.5 * smoothstep((s - 0.25) * 2.2))} /> : null}
            </g>
          );
        })}
        {/* the cords that bind the bundle: they slip down the pole onto the hub */}
        {ties.map((t) => (
          <g key={t.j}>
            <path d={`M${P(t.a)}L${P(t.b)}`} fill="none" stroke={DARK} strokeWidth={7.4} strokeLinecap="round" />
            <path d={`M${P(t.a)}L${P(t.b)}`} fill="none" stroke={ink.deep} strokeWidth={4.4} strokeLinecap="round" />
            <path d={`M${P(t.a)}L${P(t.b)}`} {...ln(0.9, 0.7)} />
          </g>
        ))}
        {/* the short inner row and the hub of the frame */}
        {inner.map((ft) => (
          <g key={ft.j}>
            <path d={limbD([[ft.pt(0.05), ft.W * 0.4], [ft.pt(0.5), ft.W], [ft.pt(0.85), ft.W * 0.8], [ft.pt(1), ft.W * 0.3]])} fill={ft.j % 2 ? ink.main : ink.deep} {...OUT} strokeWidth={1.8} />
            <path d={`M${P(ft.pt(0.15))}L${P(ft.pt(0.92))}`} {...ln(1, 0.6)} />
          </g>
        ))}
        <circle cx={hub[0]} cy={hub[1]} r={hubR} fill={ink.deep} {...OUT} strokeWidth={2} />
        <circle cx={hub[0]} cy={hub[1]} r={hubR * 0.52} {...ln(1.1, 0.7)} />
      </Cased>
    </g>
  );
};

/** the strap that holds the pole on his back: over the shoulder and down across his chest (drawn over him) */
const Strap: React.FC<{ rig: ReturnType<typeof captureAnchors>["rig"]; at: P2; scale: number; ink?: Ink }> = ({ rig, at: figAt, scale, ink = ORANGE }) => {
  const a = rig.toFig([-15, rig.shY - 4]);
  const m = rig.toFig([0, rig.shY + 16]);
  const b = rig.toFig([19, rig.shY + 40]);
  const d = limbD([[a, 7.4], [m, 7.8], [b, 7.4]]);
  return (
    <g transform={`translate(${figAt[0].toFixed(2)} ${figAt[1].toFixed(2)}) scale(${scale.toFixed(4)})`}>
      <path d={d} fill={ink.hair} {...OUT} strokeWidth={2} />
      <path d={`M${P(add(a, [1.5, 2]))}L${P(add(b, [-1.5, -2]))}`} fill="none" stroke={ink.deep} strokeWidth={1.6} strokeLinecap="round" />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE GREAT TEMPLE (its foot only): a steep double stairway between
// balustrades, seen a little from the side, and the stepped tiers it climbs.
// Local px: the near side of the first riser at (0, 0), up = - y.
// ---------------------------------------------------------------------------
const RISE = 26;
const SLOPE = 2.4;
const RUN = RISE / SLOPE;
const N_STEP = 64;
/** the stair's far side lies this far to the left and a little up */
const DEPTH: P2 = [-98, -11];
const TIER_H = 340;
const TALUD = 0.268;
const TIER_X0 = 74;
/** the temple is drawn in its own px and scaled with the figures */
const TS = 1.13;
const TIER_DX = TIER_H / SLOPE;
const N_TIER = 5;
const RIGHT = 2600;
const STONE = shadeInk(0.36);
const STAIR = shadeInk(0.84);
/** the nosing line at step s, depth t (0 near .. 1 far), lifted by `up` */
const nose = (s: number, t: number, up = 0): P2 => [s * RUN + t * DEPTH[0], -s * RISE + t * DEPTH[1] - up];
const tierX = (j: number, h: number) => TIER_X0 + j * TIER_DX + h * TALUD;
const Temple: React.FC<{ at: P2 }> = ({ at: o }) => {
  let risers = "";
  let treads = "";
  for (let i = 0; i < N_STEP; i++) {
    const a = nose(i, 0);
    const b = nose(i, 0, RISE);
    const c = nose(i, 1, RISE);
    const d = nose(i, 1);
    risers += `M${P(a)}L${P(b)}L${P(c)}L${P(d)}Z`;
    const e: P2 = [b[0] + RUN, b[1]];
    const g: P2 = [c[0] + RUN, c[1]];
    treads += `M${P(b)}L${P(e)}L${P(g)}L${P(c)}Z`;
  }
  // a balustrade: a plank lying on the flight between depths t0 and t1, standing `up` above the nosings
  const plank = (t0: number, t1: number, up: number) => {
    const top = `M${P(nose(0, t0, up))}L${P(nose(N_STEP, t0, up))}L${P(nose(N_STEP, t1, up))}L${P(nose(0, t1, up))}Z`;
    const front = `M${P(nose(0, t0, up))}L${P(nose(0, t1, up))}L${P([nose(0, t1)[0], nose(0, t1)[1]])}L${P(nose(0, t0))}Z`;
    const sideD = `M${P(nose(0, t0, up))}L${P(nose(N_STEP, t0, up))}L${P(nose(N_STEP, t0, -RISE))}L${P(nose(0, t0, 0))}Z`;
    return { top, front, sideD };
  };
  const far = plank(1.0, 1.15, 13);
  const mid = plank(0.44, 0.56, 12);
  const near = plank(-0.2, 0.0, 13);
  // the side wall of the stair under the near balustrade, back to the tiers
  const flank = `M${P(nose(0, -0.2))}L${P(nose(N_STEP, -0.2))}L${P([RIGHT, -N_STEP * RISE])}L${P([RIGHT, 0])}Z`;
  let flankHatch = "";
  for (let i = 0; i < 150; i++) {
    const x0 = 4 + i * 11 + 4 * hash(i, 901);
    const h = Math.min(x0 * SLOPE * 0.9, 1700);
    flankHatch += `M${x0.toFixed(1)},${(-h * (0.1 + 0.25 * hash(i, 902))).toFixed(1)}L${(x0 + h * 0.2).toFixed(1)},${(-h * (0.78 + 0.18 * hash(i, 903))).toFixed(1)}`;
  }
  const tiers = Array.from({ length: N_TIER }, (_, j) => {
    const y0 = -j * TIER_H;
    const y1 = y0 - TIER_H;
    const wall = `M${P([tierX(j, 0), y0])}L${P([tierX(j, TIER_H), y1])}L${P([RIGHT, y1])}L${P([RIGHT, y0])}Z`;
    const cy = y1 + 38;
    const cornice = `M${P([tierX(j, TIER_H - 38) - 9, cy])}L${P([tierX(j, TIER_H) - 9, y1])}L${P([RIGHT, y1])}L${P([RIGHT, cy])}Z`;
    // the stone courses
    let courses = "";
    let joints = "";
    [62, 124, 186, 248].forEach((h, r) => {
      const xa = tierX(j, h) + 3;
      courses += `M${xa.toFixed(1)},${(y0 - h).toFixed(1)}L${RIGHT},${(y0 - h).toFixed(1)}`;
      for (let q = 0; q < 26; q++) {
        const x = xa + 40 + q * 96 + ((r % 2) * 48 + 30 * hash(q + j * 31, 910 + r));
        joints += `M${x.toFixed(1)},${(y0 - h).toFixed(1)}l0,${(h === 62 ? 62 : 62).toFixed(0)}`;
      }
    });
    // the shadow under the cornice
    let shade = "";
    for (let q = 0; q < 330; q++) {
      const x = tierX(j, TIER_H - 40) + 2 + q * 7.5 + 3 * hash(q, 920 + j);
      shade += `M${x.toFixed(1)},${(cy + 1).toFixed(1)}l${(-3 - 2 * hash(q, 921)).toFixed(1)},${(11 + 12 * hash(q, 922 + j)).toFixed(1)}`;
    }
    // the sloping face of the tier, hatched down its edge
    let edge = "";
    for (let q = 0; q < 34; q++) {
      const h = 6 + q * 8.6;
      if (h > TIER_H - 44) break;
      const x = tierX(j, h) + 2.5;
      edge += `M${x.toFixed(1)},${(y0 - h).toFixed(1)}l${(9 + 12 * hash(q, 930 + j)).toFixed(1)},${(2.5).toFixed(1)}`;
    }
    return { j, wall, cornice, courses, joints, shade, edge, cy, y1 };
  });
  return (
    <g transform={`translate(${o[0]} ${o[1]}) scale(${TS})`}>
      {/* the far balustrade, the two flights, the divider between them */}
      <path d={far.top} fill={STAIR.deep} {...OUT} strokeWidth={2.2} />
      <path d={far.front} fill={STAIR.deep} {...OUT} strokeWidth={2.2} />
      <path d={risers} fill={STAIR.deep} {...OUT} strokeWidth={1.5} />
      <path d={treads} fill={STAIR.main} {...OUT} strokeWidth={1.5} />
      <path d={mid.sideD} fill={STAIR.hair} {...OUT} strokeWidth={1.6} />
      <path d={mid.top} fill={STAIR.main} {...OUT} strokeWidth={2} />
      <path d={mid.front} fill={STAIR.deep} {...OUT} strokeWidth={2} />
      {/* the stair's side wall and the tiers of the pyramid behind it */}
      <clipPath id="tmp-flank">
        <path d={flank} />
      </clipPath>
      <path d={flank} fill={shadeInk(0.27).main} {...OUT} strokeWidth={2.4} />
      <g clipPath="url(#tmp-flank)">
        <path d={flankHatch} {...ln(1.2, 0.42)} />
      </g>
      {tiers.map((t) => (
        <g key={t.j}>
          <path d={t.wall} fill={STONE.main} {...OUT} strokeWidth={2.6} />
          <path d={t.courses} {...ln(1.3, 0.34)} />
          <path d={t.joints} {...ln(1.1, 0.24)} />
          <path d={t.edge} {...ln(1.1, 0.4)} />
          <path d={t.shade} {...ln(1.2, 0.5)} />
          <path d={t.cornice} fill={shadeInk(0.52).main} {...OUT} strokeWidth={2.4} />
          <path d={`M${P([tierX(t.j, TIER_H - 20) - 6, t.cy - 19])}L${RIGHT},${(t.cy - 19).toFixed(1)}`} {...ln(1.2, 0.45)} />
        </g>
      ))}
      {/* the near balustrade lies over the flight's near edge */}
      <path d={near.top} fill={STAIR.main} {...OUT} strokeWidth={2.2} />
      <path d={near.front} fill={STAIR.deep} {...OUT} strokeWidth={2.2} />
    </g>
  );
};

/** the ground: short engraved strokes, denser along the line they walk on */
const GROUND = (() => {
  let d = "";
  for (let i = 0; i < 520; i++) {
    const x = -1900 + hash(i, 950) * 3300;
    const v = hash(i, 951);
    const y = GY + 6 + (v * v * (hash(i, 952) < 0.5 ? -1 : 1.6)) * 62 + (hash(i, 953) - 0.5) * 8;
    const L = 16 + 70 * hash(i, 954);
    d += `M${x.toFixed(1)},${y.toFixed(1)}l${L.toFixed(1)},${((hash(i, 955) - 0.5) * 2).toFixed(1)}`;
  }
  return d;
})();
/** the paving of the precinct in front of them: courses of flagstones, wider toward us */
const PAVING = (() => {
  let d = "";
  const rows = [26, 66, 122, 196, 292, 414, 566, 750];
  rows.forEach((dy, r) => {
    let x = -2300 + 200 * hash(r, 960);
    let q = 0;
    while (x < 1500) {
      const L = 150 + 260 * hash(q + r * 57, 961);
      const y = GY + dy + (hash(q + r * 57, 962) - 0.5) * 2.4;
      d += `M${x.toFixed(1)},${y.toFixed(1)}l${L.toFixed(1)},${((hash(q + r * 57, 963) - 0.5) * 1.6).toFixed(1)}`;
      // a joint down to the next course
      if (r < rows.length - 1 && hash(q + r * 57, 964) < 0.8) d += `M${(x + L * 0.5).toFixed(1)},${(y + 2).toFixed(1)}l${(-6 - 5 * r).toFixed(1)},${(rows[r + 1] - dy - 4).toFixed(1)}`;
      x += L + 12 + 26 * hash(q + r * 57, 965);
      q++;
    }
  });
  return d;
})();

// ---------------------------------------------------------------------------
// THE STATE AT A FRAME
// ---------------------------------------------------------------------------
const stateAt = (f: number) => {
  const wAmt = warAmount(f);
  const cAmt = capAmount(f);
  const wAt: P2 = [warX(f), GY];
  const cAt: P2 = [capX(f), GY];
  const wPhase = f / CYCLE + PH_W;
  const wPose = idle(walkLegs(warTrack(f), wPhase, wAmt), f, 1, 1 - 0.6 * wAmt);
  const cPose = idle(walkLegs(capTrack(f), f / CYCLE + PH_C, cAmt), f, 2, 1 - 0.6 * cAmt);
  const wa = captureAnchors("warrior", wPose, wAt, U);
  const ca = captureAnchors("totonac", cPose, cAt, U);
  const banner: BannerState = {
    spread: (f - T.open) / (T.opened - T.open),
    ties: (f - T.ties) / 10,
    g: f,
    stir: 1,
    sway: -1.6 * wAmt * Math.sin(4 * Math.PI * wPhase + 0.6) + 0.5 * Math.sin(f / 13),
  };
  return { cam: camAt(f), wAt, cAt, wPose, cPose, wa, ca, banner, slack: ropeSlack(f) };
};


const CaptivesToTenochtitlan: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const s = stateAt(frame);
  const cam = s.cam;
  return (
    <AbsoluteFill>
      <TexcocoPage cam={cam}>
        <WorldSvg cam={cam}>
          <path d={PAVING} fill="none" stroke={CREAM.main} strokeOpacity={0.17} strokeWidth={1.8} strokeLinecap="round" />
          <path d={GROUND} fill="none" stroke={CREAM.main} strokeOpacity={0.3} strokeWidth={1.7} strokeLinecap="round" />
          <Temple at={[0, GY]} />
          {/* the hero pair */}
          <Totonac pose={s.cPose} at={s.cAt} scale={U} uid="ct-c" />
          <Rope from={s.ca.bind} to={s.wa.farHand} slack={s.slack} width={3.2 * U} />
          <Banner rig={s.wa.rig} lean={s.wPose.lean} at={s.wAt} scale={U} st={s.banner} uid="ct-ban" />
          <Warrior pose={s.wPose} at={s.wAt} scale={U} club={false} uid="ct-w" />
          <Strap rig={s.wa.rig} at={s.wAt} scale={U} />
        </WorldSvg>
      </TexcocoPage>
    </AbsoluteFill>
  );
};

export default CaptivesToTenochtitlan;
