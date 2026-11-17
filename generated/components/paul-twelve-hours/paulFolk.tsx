// ===================================================================================================================
// paulFolk — THE OUTSIDER of paul-twelve-hours: a small MODERN figure (hoodie, hood up or down, a laptop or a tote) in
// the pandemics gouache paint, the same hand and proportions as the Worker (kyle-pandemics/pandemicFolkWorker): his
// head, face, arms and mittens ARE the Worker's rig (buildWorker), re-dressed: the cap, apron and vest are taken off,
// the shirt and vest become one hoodie (kangaroo pocket, drawstrings, ribbed hem), a hood (up: framing the face; down:
// bunched behind the neck) or short hair, slim trousers and off-white trainers, and his legs are re-drawn so he walks.
// Inks: slate, charcoal, oatmeal (neutral; nothing orange except the cards in his tote).
//
//   OutsiderPose { yaw (deg, 0 = facing us, + turns to screen right), walk (phase, radians; advance ~0.26 / frame for a
//     brisk walk), walkAmt 0..1, reach 0..1 (his right arm forward to a door / key), carry "tote" | "laptop" | "none",
//     hood "up" | "down", frame (breathing), headYaw, headPitch, headRoll, fumble 0..1 (a clumsy jiggle of the arms
//     and head, for S1), armR / armL (full overrides, the Worker's ArmPose) }
//   pose helpers: outsiderStand(o?), outsiderWalk(frame, o?), outsiderReach(t, o?), outsiderCarry(frame, carry, o?)
//   buildOutsider(pose) -> { shapes, anchors }   (figure units, feet at 0, up -y, ~520 units tall with the hood up)
//   <Outsider P at heightM? pose uid toteCards? shadow? />   in a full-frame SVG (PaulStage overlay): feet on the
//     world point `at` of projector P; heightM = his height (default 1.5 m); toteCards 0..4 = cards peeking out.
//   <OutsiderOnScreen x y scale pose uid toteCards? />   the same at screen px (style sheets)
// ===================================================================================================================
import React from "react";
import { PandemicFolk, Paint } from "../kits/dwarkesh-3d/dwarkesh3d";
import { buildWorker, STAND, tube, type ArmPose, type WorkerPose } from "../kyle-pandemics/pandemicFolkWorker";
import type { Shape } from "../kyle-pandemics/pandemicFolkPaint";
import type { Projector, V3 } from "./paulWorld";

const D2R = Math.PI / 180;
const n2 = (v: number) => (Math.round(v * 100) / 100).toString();
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
type P2 = [number, number];

/** the outsider's inks (neutral: slate hoodie, charcoal trousers, off-white trainers) */
export const OUTSIDER_INKS = {
  hoodie: "#5F646A",
  hoodieDeep: "#4D5156",
  hoodieRib: "#555A60",
  string: "#D9D3C7",
  trousers: "#38393B",
  shoes: "#E6E1D7",
  sole: "#BDB7AC",
  hair: "#3E3631",
  tote: "#D3C8B3",
  toteHandle: "#BFB39D",
  laptop: "#B4B7BB",
  laptopEdge: "#55585D",
};
export const OUTSIDER_SHADE = { amt: 0.32, to: "#26282B" };
export const FIGURE_UNITS = 513;

export type OutsiderPose = {
  yaw?: number;
  walk?: number;
  walkAmt?: number;
  reach?: number;
  carry?: "tote" | "laptop" | "none";
  hood?: "up" | "down";
  frame?: number;
  headYaw?: number;
  headPitch?: number;
  headRoll?: number;
  fumble?: number;
  armR?: ArmPose;
  armL?: ArmPose;
};
export const outsiderStand = (o: OutsiderPose = {}): OutsiderPose => ({ carry: "none", hood: "up", ...o });
/** a brisk walk: pass the frame (the phase advances 0.26 rad per frame) */
export const outsiderWalk = (frame: number, o: OutsiderPose = {}): OutsiderPose => ({ hood: "up", carry: "none", ...o, walk: frame * 0.26, walkAmt: o.walkAmt ?? 1, frame });
export const outsiderReach = (t: number, o: OutsiderPose = {}): OutsiderPose => ({ hood: "up", carry: "none", ...o, reach: t });
export const outsiderCarry = (frame: number, carry: "tote" | "laptop", o: OutsiderPose = {}): OutsiderPose => ({ hood: "up", ...o, carry, frame });

// sentinel inks: every Worker part comes out in its own colour so it can be found and re-dressed
const SENT = {
  cap: "#C0FFE0",
  capRib: "#C0FFE1",
  apron: "#C0FFE2",
  apronTie: "#C0FFE3",
  vest: "#C0FFE4",
  shirt: "#C0FFE5",
  hair: "#C0FFE6",
  trousers: "#C0FFE7",
  boots: "#C0FFE8",
};
const ARM_HANG: ArmPose = { abd: 13, flex: 6, abd2: -9, flex2: 12, droop: 4, thumb: 0 };
const ARM_TOTE: ArmPose = { abd: 21, flex: 4, abd2: -4, flex2: 8, droop: 2, thumb: 0 };
const ARM_REACH: ArmPose = { abd: 14, flex: 72, abd2: -10, flex2: 22, droop: 30, thumb: 1 };
const ARM_HUG: ArmPose = { abd: 6, flex: 28, abd2: -58, flex2: 96, droop: 6, thumb: 1 };
const mixArm = (a: ArmPose, b: ArmPose, t: number): ArmPose => ({
  abd: lerp(a.abd, b.abd, t),
  flex: lerp(a.flex, b.flex, t),
  abd2: lerp(a.abd2, b.abd2, t),
  flex2: lerp(a.flex2, b.flex2, t),
  droop: lerp(a.droop, b.droop, t),
  thumb: lerp(a.thumb, b.thumb, t),
});
const ell = (cx: number, cy: number, rx: number, ry: number, ccw = false, n = 36) => {
  const pts: P2[] = [];
  for (let i = 0; i < n; i++) {
    const a = ((ccw ? -1 : 1) * i * 2 * Math.PI) / n;
    pts.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
  }
  return `M ${pts.map((p) => `${n2(p[0])} ${n2(p[1])}`).join(" L ")} Z`;
};
const poly = (pts: P2[]) => `M ${pts.map((p) => `${n2(p[0])} ${n2(p[1])}`).join(" L ")} Z`;
const rot = (p: P2, c: P2, deg: number): P2 => {
  const a = deg * D2R;
  const x = p[0] - c[0];
  const y = p[1] - c[1];
  return [c[0] + x * Math.cos(a) - y * Math.sin(a), c[1] + x * Math.sin(a) + y * Math.cos(a)];
};

/** the outsider: the Worker's rig re-dressed (see the header) */
export const buildOutsider = (p: OutsiderPose) => {
  const yaw = p.yaw ?? 0;
  const t = (p.frame ?? 0) / 23.976;
  const breath = 0.5 + 0.5 * Math.sin((t / 4.2) * 2 * Math.PI - Math.PI / 2);
  const wa = c01(p.walkAmt ?? 0);
  const ph = p.walk ?? 0;
  const fum = c01(p.fumble ?? 0);
  const jig = (k: number) => fum * Math.sin(t * 2 * Math.PI * 1.7 + k) * 7;
  // arms: hanging; walking swings them against the legs; the tote hand away from the leg; laptop hugged; reach (R)
  let armR: ArmPose = { ...ARM_HANG, flex: ARM_HANG.flex - 20 * wa * Math.sin(ph) + jig(0) };
  let armL: ArmPose = { ...ARM_HANG, flex: ARM_HANG.flex + 20 * wa * Math.sin(ph) + jig(1.7) };
  if (p.carry === "tote") armL = { ...ARM_TOTE, flex: ARM_TOTE.flex + 8 * wa * Math.sin(ph) + jig(2.2) };
  if (p.carry === "laptop") {
    armR = { ...ARM_HUG };
    armL = { ...ARM_HUG, abd2: -54, flex2: 92 };
  }
  armR = mixArm(armR, ARM_REACH, c01(p.reach ?? 0));
  if (p.armR) armR = p.armR;
  if (p.armL) armL = p.armL;
  const bob = wa * Math.abs(Math.sin(ph)) * 5;
  const pose: WorkerPose = {
    ...STAND,
    yaw,
    headYaw: p.headYaw ?? 0,
    headPitch: (p.headPitch ?? 2) + fum * 4 * Math.sin(t * 9),
    headRoll: (p.headRoll ?? STAND.headRoll) + fum * 3 * Math.sin(t * 7.3),
    bodyPitch: wa * 3,
    bodyRoll: STAND.bodyRoll + wa * 1.4 * Math.sin(ph),
    breath,
    armR,
    armL,
  };
  const b = buildWorker(pose, { inks: SENT });
  const A = b.anchors;
  const I = OUTSIDER_INKS;
  const S: Shape[] = [];
  const legIdx = b.shapes.findIndex((s) => s.fill === SENT.trousers);
  const capIdx = b.shapes.findIndex((s) => s.fill === SENT.cap);
  const torsoIdx = b.shapes.findIndex((s, i) => i > legIdx && (s.fill === SENT.shirt || s.fill === SENT.vest) && !s.op && !s.clip && i > b.shapes.findIndex((q) => q.fill === SENT.boots) + 2);
  const vy = view(yaw);
  b.shapes.forEach((s, i) => {
    // -- the legs: re-drawn (walk), in place of the Worker's planted legs
    if (i === legIdx) S.push(...legs(vy, ph, wa, bob));
    if (s.fill === SENT.trousers || s.fill === SENT.boots) return;
    // -- the hood (down) bunched behind the neck, before the torso
    if (i === torsoIdx && p.hood === "down") S.push(hoodDown(A));
    // -- the laptop, hugged: between the torso and the front copies of the arms
    // -- the head's covering: the hood (up) round the face, or short hair, where the cap was
    if (i === capIdx) S.push(...(p.hood === "down" ? hair(A) : hoodUp(A, yaw + (p.headYaw ?? 0))));
    if (s.fill === SENT.cap || s.fill === SENT.capRib || s.fill === SENT.apron || s.fill === SENT.apronTie || s.fill === SENT.hair) return;
    if (s.fill === SENT.shirt || s.fill === SENT.vest) {
      S.push({ ...s, fill: s.fill === SENT.vest ? I.hoodie : I.hoodie });
      // the pocket, strings and hem go over the hoodie's body (right after the vest, the body's front)
      if (s.fill === SENT.vest) {
        S.push(...hoodieFront(A, p.hood === "up"));
        if (p.carry === "laptop") S.push(...laptop(A));
      }
      return;
    }
    S.push(s);
  });
  // lift the whole figure by the walk's bob
  const out = bob ? S.map((s) => ({ ...s, tf: `translate(0 ${n2(-bob)})${s.tf ? ` ${s.tf}` : ""}` })) : S;
  return { shapes: out, anchors: A };
};

type View = { cs: number; sn: number };
const view = (yaw: number): View => ({ cs: Math.cos(yaw * D2R), sn: Math.sin(yaw * D2R) });
const proj = (v: View, p: [number, number, number]): P2 => [p[0] * v.cs + p[2] * v.sn, p[1]];
const depth = (v: View, p: [number, number, number]) => -p[0] * v.sn + p[2] * v.cs;

/** slim legs and trainers; walk phase ph swings them (the Worker's leg tube widths, slimmer) */
const legs = (v: View, ph: number, wa: number, bob: number): Shape[] => {
  const I = OUTSIDER_INKS;
  const leg = (side: number) => {
    const sw = wa * 24 * Math.sin(ph + (side > 0 ? 0 : Math.PI)); // deg, + forward
    const knee = wa * Math.max(0, -Math.sin(ph + (side > 0 ? 0 : Math.PI))) * 30; // the back leg bends
    const hip: [number, number, number] = [side * 28, -232 + bob, 2];
    const thigh = 104;
    const shin = 104;
    const a1 = sw * D2R;
    const kn: [number, number, number] = [side * 31, hip[1] + Math.cos(a1) * thigh, hip[2] + Math.sin(a1) * thigh];
    const a2 = a1 - knee * D2R;
    const an: [number, number, number] = [side * 31, kn[1] + Math.cos(a2) * shin, kn[2] + Math.sin(a2) * shin];
    const lift = Math.max(0, an[1] - -20);
    const ank: [number, number, number] = [an[0], an[1] - lift + bob * 0, an[2]];
    const toeOut = side * 9;
    const fwd: [number, number, number] = [Math.sin(toeOut * D2R), 0, Math.cos(toeOut * D2R)];
    const heel: [number, number, number] = [ank[0] - fwd[0] * 8, ank[1] + 12, ank[2] - fwd[2] * 8];
    const toe: [number, number, number] = [ank[0] + fwd[0] * 26, ank[1] + 13, ank[2] + fwd[2] * 26];
    const P = [hip, kn, ank].map((q) => proj(v, q));
    const legS: Shape = { d: tube(P, [52, 36, 24]), fill: I.trousers };
    const h = proj(v, heel);
    const tt = proj(v, toe);
    const shoe: Shape = { d: tube([h, [(h[0] + tt[0]) / 2, (h[1] + tt[1]) / 2 - 2], tt], [26, 27, 23]), fill: I.shoes, sh: 0.7 };
    const sole: Shape = { d: tube([[h[0], h[1] + 9], [tt[0], tt[1] + 9]], [7, 7]), fill: I.sole, sh: 0 };
    return { d: depth(v, kn), shapes: [legS, shoe, sole] };
  };
  const R = leg(-1);
  const L = leg(1);
  return R.d <= L.d ? [...R.shapes, ...L.shapes] : [...L.shapes, ...R.shapes];
};

/** the hoodie's front: the kangaroo pocket, the ribbed hem, and (hood up) the two drawstrings */
const hoodieFront = (A: Record<string, P2>, strings: boolean): Shape[] => {
  const I = OUTSIDER_INKS;
  const cx = A.sternumBottom[0];
  const y0 = A.sternumBottom[1] + 6;
  const pocket: Shape = {
    d: `M ${n2(cx - 38)} ${n2(y0 + 48)} L ${n2(cx - 30)} ${n2(y0 + 4)} C ${n2(cx - 12)} ${n2(y0 - 2)} ${n2(cx + 12)} ${n2(y0 - 2)} ${n2(cx + 30)} ${n2(y0 + 4)} L ${n2(cx + 38)} ${n2(y0 + 48)} Z`,
    fill: I.hoodieDeep,
    sh: 0.35,
  };
  const pocketLine: Shape = { d: `M ${n2(cx - 30)} ${n2(y0 + 6)} C ${n2(cx - 12)} ${n2(y0)} ${n2(cx + 12)} ${n2(y0)} ${n2(cx + 30)} ${n2(y0 + 6)}`, fill: I.hoodieDeep, det: 1.2, op: 0.6 };
  const hem: Shape = { d: `M ${n2(cx - 58)} ${n2(y0 + 54)} C ${n2(cx - 20)} ${n2(y0 + 60)} ${n2(cx + 20)} ${n2(y0 + 60)} ${n2(cx + 58)} ${n2(y0 + 54)}`, fill: I.hoodieRib, det: 1.4, op: 0.55 };
  const out: Shape[] = [pocket, pocketLine, hem];
  if (strings) {
    const n = A.sternumTop;
    out.push({ d: `M ${n2(n[0] - 9)} ${n2(n[1] + 2)} C ${n2(n[0] - 10)} ${n2(n[1] + 20)} ${n2(n[0] - 12)} ${n2(n[1] + 34)} ${n2(n[0] - 13)} ${n2(n[1] + 50)}`, fill: I.string, det: 1.6, keep: true, op: 0.95 });
    out.push({ d: `M ${n2(n[0] + 9)} ${n2(n[1] + 2)} C ${n2(n[0] + 10)} ${n2(n[1] + 20)} ${n2(n[0] + 11)} ${n2(n[1] + 34)} ${n2(n[0] + 12)} ${n2(n[1] + 46)}`, fill: I.string, det: 1.6, keep: true, op: 0.95 });
  }
  return out;
};

/** the hood up: one ring round the face (outer hood, the face opening cut out), a darker inner edge */
const hoodUp = (A: Record<string, P2>, yawDeg = 0): Shape[] => {
  const I = OUTSIDER_INKS;
  const hc = A.headCenter;
  const face: P2 = [lerp(hc[0], A.nose[0], 0.7), A.nose[1] - 4];
  const tilt = Math.atan2(A.crown[0] - A.chin[0], A.chin[1] - A.crown[1]) / D2R;
  // the silhouette: the hood's arc over the head (screen left -> top -> right), then down over the shoulders
  const arc: P2[] = [];
  for (let i = 0; i <= 30; i++) {
    const a = (160 + (i / 30) * 220) * D2R;
    arc.push(rot([hc[0] + 72 * Math.cos(a), hc[1] - 6 + 80 * Math.sin(a)], [hc[0], hc[1]], tilt));
  }
  const sil: P2[] = [...arc, [A.shoulderL[0] - 10, A.shoulderL[1] + 2], [A.sternumTop[0], A.sternumTop[1] + 20], [A.shoulderR[0] + 10, A.shoulderR[1] + 2]];
  // the face opening narrows as he turns; from behind there is none
  const k = Math.abs(Math.cos(yawDeg * D2R));
  if (Math.abs((((yawDeg % 360) + 540) % 360) - 180) > 110) return [{ d: poly(sil), fill: I.hoodie, sh: 0.8 }];
  const rx = 41 * (0.5 + 0.5 * k);
  const inner = ringPts(face[0], face[1] - 10, rx, 49, tilt).reverse();
  const ringD = `${poly(sil)} ${poly(inner)}`;
  return [
    { d: ringD, fill: I.hoodie, sh: 0.8 },
    { d: poly(ringPts(face[0], face[1] - 10, rx + 2, 51, tilt)), fill: I.hoodieDeep, det: 2.4, op: 0.85, keep: true },
  ];
};
const ringPts = (cx: number, cy: number, rx: number, ry: number, tiltDeg: number, n = 40): P2[] => {
  const pts: P2[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i * 2 * Math.PI) / n;
    pts.push(rot([cx + rx * Math.cos(a), cy + ry * Math.sin(a)], [cx, cy], tiltDeg));
  }
  return pts;
};
/** the hood down: bunched behind the neck, showing over the shoulders */
const hoodDown = (A: Record<string, P2>): Shape => {
  const n = A.sternumTop;
  return { d: ell(n[0], n[1] - 14, 66, 30), fill: OUTSIDER_INKS.hoodieDeep, sh: 0.6 };
};
/** short dark hair, a soft fringe */
const hair = (A: Record<string, P2>): Shape[] => {
  const hc = A.headCenter;
  const cr = A.crown;
  const tilt = Math.atan2(cr[0] - A.chin[0], A.chin[1] - cr[1]) / D2R;
  const pts: P2[] = [];
  // the cap of hair: an arc over the top, a fringe of four soft bumps across the brow
  for (let i = 0; i <= 20; i++) {
    const a = Math.PI + (i / 20) * Math.PI;
    pts.push([hc[0] + 58 * Math.cos(a), hc[1] - 10 + 62 * Math.sin(a)]);
  }
  const brow = hc[1] - 18;
  [
    [52, brow + 6],
    [30, brow - 4],
    [10, brow + 4],
    [-12, brow - 6],
    [-34, brow + 2],
    [-56, brow + 8],
  ].forEach(([x, y]) => pts.push([hc[0] + x, y]));
  return [{ d: poly(pts.map((q) => rot(q, hc, tilt))), fill: OUTSIDER_INKS.hair, sh: 0.7 }];
};
/** a closed laptop hugged to the chest: a silver lid over a darker edge, the hinge line and an orange sticker */
const laptop = (A: Record<string, P2>): Shape[] => {
  const I = OUTSIDER_INKS;
  const c = A.chest;
  const lid: P2[] = [
    [c[0] - 70, c[1] - 34],
    [c[0] + 66, c[1] - 42],
    [c[0] + 70, c[1] + 44],
    [c[0] - 66, c[1] + 52],
  ];
  // the closed body's thickness, showing below the lid
  const edge: P2[] = [lid[3], lid[2], [lid[2][0] - 1, lid[2][1] + 13], [lid[3][0] + 1, lid[3][1] + 13]];
  const sc: P2 = [c[0] + 26, c[1] - 6];
  const sr = 11;
  const circ = `M ${n2(sc[0] - sr)} ${n2(sc[1])} a ${sr} ${sr} 0 1 0 ${2 * sr} 0 a ${sr} ${sr} 0 1 0 ${-2 * sr} 0 Z`;
  return [
    { d: poly(edge), fill: I.laptopEdge, sh: 0.7 },
    { d: poly(lid), fill: I.laptop, sh: 0.55 },
    { d: `M ${n2(lid[0][0] + 6)} ${n2(lid[0][1] + 7)} L ${n2(lid[1][0] - 6)} ${n2(lid[1][1] + 7)}`, fill: I.laptopEdge, det: 1.6, op: 0.75 },
    { d: circ, fill: "#FFB000", sh: 0.25 },
  ];
};

/** the tote (figure units of the Worker), handles at the origin, cards peeking out (0..4) */
const toteShapes = (cards: number): Shape[] => {
  const I = OUTSIDER_INKS;
  const rect = (cx: number, cy: number, w: number, h: number, r: number) => {
    const a = (r * Math.PI) / 180;
    const pts: P2[] = [
      [-w / 2, -h / 2],
      [w / 2, -h / 2],
      [w / 2, h / 2],
      [-w / 2, h / 2],
    ].map(([x, y]) => [cx + x * Math.cos(a) - y * Math.sin(a), cy + x * Math.sin(a) + y * Math.cos(a)]);
    return poly(pts);
  };
  const cs = [
    { x: -24, y: 52, r: -16 },
    { x: 8, y: 44, r: 9 },
    { x: 30, y: 54, r: 24 },
    { x: -4, y: 58, r: -4 },
  ].slice(0, Math.max(0, Math.min(4, Math.round(cards))));
  // handles from the hand (0, 0) down to the bag's mouth (y 60), the bag 60..170
  return [
    ...cs.map((c, i) => ({ d: rect(c.x, c.y, 48, 32, c.r), fill: i === 1 ? "#FFB000" : "#F2A400", sh: 0.25 })),
    { d: "M-30,62 C-30,4 -6,-4 -2,0 C2,4 -18,12 -20,62 Z", fill: I.toteHandle, sh: 0.3 },
    { d: "M28,62 C28,4 6,-4 2,0 C-2,4 18,12 20,62 Z", fill: I.toteHandle, sh: 0.3 },
    { d: "M-52,62 C-18,56 18,56 52,62 C60,96 62,140 58,166 C26,174 -26,174 -58,166 C-62,140 -60,96 -52,62 Z", fill: I.tote, sh: 0.42 },
  ];
};

/** the outsider at screen px (feet at x, y; scale px per figure unit) */
export const OutsiderOnScreen: React.FC<{ x: number; y: number; scale: number; pose: OutsiderPose; uid: string; toteCards?: number; shadow?: boolean }> = ({ x, y, scale, pose, uid, toteCards = 3, shadow = true }) => {
  const b = buildOutsider(pose);
  const hand = b.anchors.handL;
  return (
    <g>
      {shadow ? (
        <>
          <defs>
            <radialGradient id={`${uid}-cs`}>
              <stop offset="0" stopColor="#1F1D1B" stopOpacity={0.5} />
              <stop offset="0.6" stopColor="#1F1D1B" stopOpacity={0.22} />
              <stop offset="1" stopColor="#1F1D1B" stopOpacity={0} />
            </radialGradient>
          </defs>
          <ellipse cx={x + 22 * scale} cy={y + 2} rx={120 * scale} ry={28 * scale} fill={`url(#${uid}-cs)`} />
        </>
      ) : null}
      <Paint.FolkPaint shapes={b.shapes} x={x} y={y} scale={scale} uid={uid} shade={OUTSIDER_SHADE} />
      {pose.carry === "tote" ? <Paint.FolkPaint shapes={toteShapes(toteCards)} x={x + hand[0] * scale} y={y + (hand[1] + 6) * scale} scale={scale * 0.95} uid={`${uid}t`} shade={OUTSIDER_SHADE} /> : null}
    </g>
  );
};
/** the outsider standing on a world point (PaulStage overlay) */
export const Outsider: React.FC<{ P: Projector; at: V3; heightM?: number; pose: OutsiderPose; uid: string; toteCards?: number; shadow?: boolean }> = ({ P, at, heightM = 1.5, pose, uid, toteCards, shadow }) => {
  const f = P(at);
  const hd = P([at[0], at[1] + heightM, at[2]]);
  const scale = (f[1] - hd[1]) / FIGURE_UNITS;
  return <OutsiderOnScreen x={f[0]} y={f[1]} scale={scale} pose={pose} uid={uid} toteCards={toteCards} shadow={shadow} />;
};
/** the Worker (for the style sheet): the pandemics hand, re-inked neutral */
export const WorkerOnScreen: React.FC<{ x: number; y: number; scale: number; uid: string; yaw?: number }> = ({ x, y, scale, uid, yaw = 0 }) => (
  <PandemicFolk.FolkWorker pose={PandemicFolk.breathe(PandemicFolk.stand(yaw), 30)} x={x} y={y} scale={scale} uid={uid} shade={OUTSIDER_SHADE} />
);
