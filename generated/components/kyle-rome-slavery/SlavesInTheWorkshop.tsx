// ---------------------------------------------------------------------------
// SlavesInTheWorkshop (kyle-rome-slavery, cut 33), Revision 1. Dwarkesh map style (styles/dwarkesh-map.md), the 3D
// DEPTH manner of Kyle London (londonDepth, read only). Opaque 1080x1920, 29.97 fps, 143 frames.
// It returns to cut C's world (./marketWorkshopWorld, read only; C = WeKeepThemApart) and opens on C's last frame.
// The numbers (slabs, footsteps, sit, throwing, camera) are in ./slavesInTheWorkshopPlan.ts.
//
// CHECK LINE: "The busy, productive Roman workshop was worked by slaves: the men from the sale platform are its
// workforce."
//
// THE LINE: "(...the most economically advanced sectors of the Roman economy that have the most high) degree of
// organization, productivity, that tends to employ slaves. And so in the Roman world"
// WORD -> FRAME: degree 2 · of 9 · organization 14 · productivity 38 · that 49 · tends 69 · to 76 · employ 82 ·
// slaves 92 · And 120 · so 127 · in 134 · the 143 (cut) — "Roman world" falls just after the cut.
// DURATION: the slot 33.567 -> 38.338 s = 4.771 s x 29.97 = 143 frames (f0..f142).
//
// THE MOTION: f0 is cut C's last frame exactly (the market slab and the workshop slab apart, the void between). f0-30
// the two slabs slide gently back together (one smootherstep, contact f30, no bump); the crack heals from the back to
// the front edge (f30-46). The fettered slave, at the head of the catasta's steps, lifts his head and shuffles
// forward (from f16, his chain limiting each step), down the steps and across where the seam was; the chalk-footed
// slave (titulus at his neck) lifts his head as the floor closes, turns and follows him (from f30). Out of the sale's
// cold, sunk light they come into the workshop's warm light. Each walks to his own stool at the workshop's front-left
// (the two front stations), stops in front of it, turns his back to it and sits in one movement, swivels to his wheel
// and takes the clay; the wheel spins up and his hands draw an ORANGE bowl up it in pulls. One camera: C's own camera
// runs on, one push-in lobe (f20-102) lands on the two slave potters at their wheels (the chalked feet, the titulus,
// the fetter chain on the floor), the rows of potters behind; then a gentle creep to the cut.
// Feet are planted in 3D (fixed on the floor or the tread while they bear weight, swung to the next foothold), so
// nothing slides; the hip follows the feet.
// CAUSE BEFORE EFFECT: the slabs move from f1; each wheel turns only as its potter lands on his stool; the bowl rises
// only while his hands rise up its wall.
// Orange = productive output (the bowls); people are cream; the sale half stays sunk toward DEAD.
//
// SOURCES (illustrative; nothing on screen): as cut C's header: slave sales on a raised platform (catasta) with a
// titulus at the neck; chalked feet for imported slaves (Pliny, Natural History 35.199). Arretine terra sigillata
// workshops (Arezzo, 1st c. BC - 1st c. AD) staffed by enslaved potters named on the stamps (Perennius and his potter
// Tigranes; Ateius and his slaves).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { TexcocoPage, WorldSvg } from "../kits/maps/texcocoShared";
import { swayCam, type Cam, type P2 } from "../kits/maps/incaShared";
import { ContactShadow, depthTint, tintInk, type Persp } from "../kyle-london/londonDepth";
import { ACCENT, ACCENT_DEEP, C_END, DEAD, MAIN_SLAVE, MarketWorkshopStage, WAITING, halfPersp, mainSlavePose, waitingPose, type StageExtra } from "./marketWorkshopWorld";
import { CREAM, DARK, POSES, PotterWheel, Slave, Stool, idle, lerpFig, mixInk, poseTrack, romeAnchors, shadeInk, walkPose, type FigPose, type Ink } from "./romeCast";
import {
  C_HAS_D_STATIONS,
  DURATION as PLAN_DURATION,
  G,
  SEATS,
  SIT_LEN,
  TURN,
  WALKS,
  bowlForm,
  camBase,
  ease,
  handRise,
  seamAt,
  seatPlace,
  sitStart,
  smoother,
  splitAt,
  stackAt,
  wheelTurn,
  type V3,
  type Who,
} from "./slavesInTheWorkshopPlan";

export const FPS = 30000 / 1001;
export const DURATION = 143;
export const schema = z.object({});
export const defaultProps = schema.parse({});

/** cut C's camera continued, the house hand on it */
export const camAt = (f: number): Cam => swayCam(camBase(f), G(f));

// ----- the join with cut C (asserted at load) -----
if (PLAN_DURATION !== DURATION) throw new Error("plan and cut disagree on DURATION");
if (C_END.frame !== 210 || C_END.split !== 1 || C_END.seam !== 1) throw new Error("cut C's end state changed: re-check the join");
if (splitAt(0) !== C_END.split || seamAt(0) !== C_END.seam || stackAt(0) !== C_END.stack) throw new Error("f0 must be cut C's last frame");
{
  const c = camAt(0);
  if (c.k !== C_END.cam.k || c.cx !== C_END.cam.cx || c.cy !== C_END.cam.cy) throw new Error("f0's camera must be C_END.cam");
}

const c01 = (v: number) => Math.max(0, Math.min(1, v));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const Pt = (v: P2) => `${v[0].toFixed(2)},${v[1].toFixed(2)}`;
const poly = (q: P2[]) => `M${q.map(Pt).join("L")}Z`;
const hexRgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mixHex = (a: string, b: string, t: number) => {
  const pa = hexRgb(a);
  const pb = hexRgb(b);
  const u = c01(t);
  return `#${pa.map((v, i) => Math.round(v + (pb[i] - v) * u).toString(16).padStart(2, "0")).join("")}`;
};

// ---------------------------------------------------------------------------
// INKS (cut C's own formulas, repeated: the sale cold and sunk toward DEAD, the workshop warm and lit)
// ---------------------------------------------------------------------------
const DEAD_INK: Ink = { main: DEAD, deep: "#766950", hair: "#544A39" };
const coldInk = (Z: number, dead = 0.62) => tintInk(mixInk(CREAM, DEAD_INK, dead), depthTint(Z, { far: 1400, min: 0.55 }));
const warmInk = (Z: number) => tintInk(shadeInk(1), depthTint(Z, { far: 1800, min: 0.74 }));
/** crossing the seam he comes into the workshop's light (X -30 -> 90) */
const lightAt = (X: number) => ease((X + 30) / 120);
const walkerInk = (who: Who, X: number, Z: number) => {
  const cold = coldInk(Z, who === "main" ? 0.3 : 0.62);
  const t = lightAt(X);
  return t <= 0 ? cold : mixInk(cold, warmInk(Z), t);
};

// ---------------------------------------------------------------------------
// THE BOWL ON THE WHEEL (wheel-local units; the potter sits to its LEFT, facing right)
// ---------------------------------------------------------------------------
const vessel = (m: number) => ({
  by: -77,
  ry: mix(-105, -111, m),
  bw: mix(23, 24, m),
  rw: mix(13, 39, m),
  cx: mix(25, 41, m),
  cy: mix(-95, -82, m),
});
/** a point on the (right-hand) wall at height u (0 base .. 1 rim); mirror x for the left wall */
const wallPt = (m: number, u: number): P2 => {
  const v = vessel(m);
  const s = 1 - u;
  return [s * s * v.bw + 2 * s * u * v.cx + u * u * v.rw, s * s * v.by + 2 * s * u * v.cy + u * u * v.ry];
};
const wheelAt = (P: Persp, who: Who) => {
  const st = SEATS[who];
  return { at: P.p(seatPlace(st).wheel, 0, st.Z - 4), sc: P.r(st.Z - 4) };
};

// ---------------------------------------------------------------------------
// THE WALKERS' STATE (pure in f; the feet planted in 3D and projected through the half's own P)
// ---------------------------------------------------------------------------
type WState = { hip: V3; pose: FigPose; grip?: { L?: P2; R?: P2 }; sat: number };
const variantOf = (who: Who) => (who === "main" ? MAIN_SLAVE.variant : WAITING[0].variant);
const startPose = (who: Who, f: number) => (who === "main" ? mainSlavePose(G(f)) : waitingPose(0, G(f)));
const WALK_STRIDE = 60;
/** walking right: the yaw follows the heading (toward us: more of his front; away: more of his back) */
const walkingPose = (who: Who, f: number) => {
  const W = WALKS[who];
  // the heading over a short window (the hip's own corners would kink the yaw)
  const a = W.hip(f - 6);
  const b = W.hip(f + 6);
  const dx = b[0] - a[0];
  const dz = b[2] - a[2];
  const sp = Math.hypot(dx, dz);
  const hz = sp > 0.05 ? dz / sp : 0;
  const yaw = 0.9 + (hz < 0 ? -0.3 * -hz : 0.1 * hz);
  const base = POSES.walk(1, 0, 0);
  const q = walkPose({ ...base, yaw, headYaw: yaw - 0.04 }, W.phaseAt(f), W.amountAt(f), WALK_STRIDE);
  return who === "main" ? { ...q, pitch: q.pitch + 6, lids: Math.max(q.lids, 0.35) } : POSES.bowed(q);
};
/** the feet: 3D points -> figure offsets from his hip point (at) */
const withFeet = (q: FigPose, P: Persp, hip: V3, L: V3, R: V3): FigPose => {
  const at = P.p(hip[0], hip[1], hip[2]);
  const sc = P.r(hip[2]);
  const off = (p: V3): [number, number] => {
    const w = P.p(p[0], p[1], p[2]);
    return [(w[0] - at[0]) / sc, (w[1] - at[1]) / sc];
  };
  return { ...q, footL: off(L), footR: off(R) };
};
/** turned to face us, his back to the stool, lowering (the head toward his wheel, on his right) */
const TURNED: FigPose = {
  ...POSES.front(),
  crouch: 48,
  lean: 4,
  pitch: 6,
  yaw: 0.12,
  headYaw: 0.55,
  lids: 0.4,
  brow: 0.3,
  // the hands come forward to the thighs as he lowers
  armL: { w: [-34, -118], elbow: [-0.3, 1], fist: 0.25, hand: 0 },
  armR: { w: [34, -118], elbow: [0.3, 1], fist: 0.25, hand: 0 },
};
const seatedPose = (who: Who, f: number) => idle(POSES.potter(1, 0.25), G(f), 13 + variantOf(who), 0.4);

const walkerState = (who: Who, f: number, P: Persp): WState => {
  const W = WALKS[who];
  const [ta, tb] = TURN[who];
  const s0 = sitStart(who);
  if (f < s0) {
    const hip = W.hip(f);
    if (f <= ta) return { hip, pose: startPose(who, f), sat: 0 };
    const t = smoother((f - ta) / (tb - ta));
    const q = lerpFig(startPose(who, f), walkingPose(who, f), t);
    return { hip, pose: withFeet(q, P, hip, W.footAt("L", f).p, W.footAt("R", f).p), sat: 0 };
  }
  // THE SIT: one timeline from the last footfall to the seat (hips on the stool at u = 1)
  const st = SEATS[who];
  const u = c01((f - s0) / SIT_LEN);
  const A = withFeet(walkingPose(who, s0), P, W.hip(s0), W.footAt("L", s0).p, W.footAt("R", s0).p);
  const C = seatedPose(who, f);
  const pose0 = u >= 1 ? C : poseTrack([
    [0, A],
    [0.5, TURNED],
    [1, C],
  ])(u);
  const h0 = W.hip(s0);
  const hu = smoother(u);
  const hip: V3 = [mix(h0[0], st.X, hu), 0, mix(h0[2], st.Z, hu)];
  // the feet: the trailing foot steps up just ahead of the leading one (still nearly in profile: an ordinary step),
  // then both go forward to the wheel together, so the legs never cross while he faces us
  const L0 = W.footAt("L", s0).p;
  const R0 = W.footAt("R", s0).p;
  const lead = L0[0] >= R0[0] ? "L" : "R";
  const Lend: V3 = [st.X + C.footL[0], 0, st.Z];
  const Rend: V3 = [st.X + C.footR[0], 0, st.Z];
  const seg = (a: V3, b: V3, u0: number, u1: number, lift: number): V3 => {
    const v = c01((u - u0) / (u1 - u0));
    const e = smoother(v);
    // the lift rises and settles with zero speed at both ends (no kick as the foot leaves or lands)
    return [mix(a[0], b[0], e), mix(a[1], b[1], e) - lift * 4 * e * (1 - e), mix(a[2], b[2], e)];
  };
  const leadP = lead === "L" ? L0 : R0;
  const trailP = lead === "L" ? R0 : L0;
  // the trailing foot comes up beside and a little ahead of the leading one
  const trailMid: V3 = [leadP[0] + 14, 0, leadP[2] + 4];
  const trail1 = seg(trailP, trailMid, 0, 0.32, 10);
  // then to the wheel: the foot that ends ahead (R, at footR) is the one now ahead
  const aheadEnd = Rend[0] >= Lend[0] ? Rend : Lend;
  const behindEnd = Rend[0] >= Lend[0] ? Lend : Rend;
  const trailF = u <= 0.5 ? trail1 : seg(trailMid, aheadEnd, 0.5, 0.95, 7);
  const leadF = seg(leadP, behindEnd, 0.45, 0.92, 7);
  const trailIsR = lead === "L";
  const aheadIsR = Rend[0] >= Lend[0];
  // keep each foot's identity: the trailing foot becomes the one ahead; if that is not the same leg, swap the ends
  const L = trailIsR === aheadIsR ? (trailIsR ? leadF : trailF) : trailIsR ? seg(leadP, Lend, 0.45, 0.92, 7) : u <= 0.5 ? trail1 : seg(trailMid, Lend, 0.5, 0.95, 7);
  const R = trailIsR === aheadIsR ? (trailIsR ? trailF : leadF) : trailIsR ? (u <= 0.5 ? trail1 : seg(trailMid, Rend, 0.5, 0.95, 7)) : seg(leadP, Rend, 0.45, 0.92, 7);
  const pose = withFeet(pose0, P, hip, L, R);
  // the hands come onto the clay as he lands, then ride the wall up in each pull
  const gw = ease((u - 0.55) / 0.45);
  let grip: WState["grip"];
  if (gw > 0) {
    const wh = wheelAt(P, who);
    const m = bowlForm(who, f);
    const h = 0.12 + 0.8 * handRise(who, f);
    const out = wallPt(m, h);
    const inn = wallPt(m, Math.min(1, h + 0.12));
    const toW = (p: P2): P2 => [wh.at[0] + p[0] * wh.sc, wh.at[1] + p[1] * wh.sc];
    const at = P.p(hip[0], 0, hip[2]);
    const nat = romeAnchors("slave", pose, at, P.r(hip[2]), { variant: variantOf(who) });
    // facing right: the near hand (L) on the outside of the wall nearest him (the left wall), the far hand (R) inside it
    const Lw = toW([-out[0] - 5, out[1]]);
    const Rw = toW([-inn[0] + 9, inn[1] - 2]);
    grip = { L: [mix(nat.handL[0], Lw[0], gw), mix(nat.handL[1], Lw[1], gw)], R: [mix(nat.handR[0], Rw[0], gw), mix(nat.handR[1], Rw[1], gw)] };
  }
  return { hip, pose, grip, sat: u };
};

// ---------------------------------------------------------------------------
// DRAWING
// ---------------------------------------------------------------------------
/** the chalk-footed slave with his titulus (cut C's SaleSlave, drawn the same way, any pose) */
const ChalkSlave: React.FC<{ pose: FigPose; at: P2; sc: number; ink: Ink; uid: string; grip?: { L?: P2; R?: P2 } }> = ({ pose, at, sc, ink, uid, grip }) => {
  const s = MAIN_SLAVE;
  const a = romeAnchors("slave", pose, at, sc, { variant: s.variant, grip });
  // the board hangs on the front of his chest: C's offset (4) on the platform (yaw -0.14), forward as he turns
  const bx = 4 + 14 * (pose.yaw - mainSlavePose(C_END.frame).yaw);
  const bc: P2 = [a.chest[0] + bx * sc, a.chest[1] + 16 * sc];
  const neck: P2 = [bc[0], bc[1] - 30 * sc];
  const bw = 40 * sc;
  const bh = 26 * sc;
  const board: P2[] = [
    [bc[0] - bw / 2, bc[1] - bh / 2 + 2 * sc],
    [bc[0] + bw / 2, bc[1] - bh / 2 - 1 * sc],
    [bc[0] + bw / 2, bc[1] + bh / 2 - 1 * sc],
    [bc[0] - bw / 2, bc[1] + bh / 2 + 2 * sc],
  ];
  const chalk = (ank: P2, k: string) => (
    <g key={k}>
      <ellipse cx={ank[0] + 4 * sc} cy={ank[1] + 8 * sc} rx={11 * sc} ry={5 * sc} fill="#F3EBD8" opacity={0.92} />
      <path d={`M${Pt([ank[0] - 5 * sc, ank[1] + 3 * sc])}l${(4 * sc).toFixed(2)},${(-6 * sc).toFixed(2)}l${(6 * sc).toFixed(2)},${(-1 * sc).toFixed(2)}`} fill="none" stroke="#F3EBD8" strokeWidth={3 * sc} strokeLinecap="round" opacity={0.8} />
    </g>
  );
  return (
    <g>
      <Slave pose={pose} at={at} scale={sc} uid={uid} variant={s.variant} ink={ink} cloth={ink} shade={1} grip={grip} />
      {chalk(a.ankleL, "cl")}
      {chalk(a.ankleR, "cr")}
      <path d={`M${Pt(board[0])}L${Pt([neck[0] - 7 * sc, neck[1]])}M${Pt(board[1])}L${Pt([neck[0] + 7 * sc, neck[1]])}`} stroke={DARK} strokeWidth={1.6 * sc} fill="none" />
      <path d={poly(board)} fill="#EFE6CF" stroke={DARK} strokeWidth={2 * sc} strokeLinejoin="round" />
      <path d={`M${Pt([board[0][0] + 2 * sc, board[3][1] - 2.5 * sc])}L${Pt([board[2][0] - 2 * sc, board[2][1] - 2.5 * sc])}L${Pt([board[1][0] - 2 * sc, board[1][1] + 3 * sc])}`} fill="none" stroke="#B9AD92" strokeWidth={1.4 * sc} />
    </g>
  );
};

/** the bowl being thrown on his wheel: the clay lump (m 0) drawn up into an open, flaring red-gloss bowl (m 1); it
 *  turns orange as it becomes the product. Wheel-local units (the wheel head's centre), not mirrored. */
const ThrownBowl: React.FC<{ at: P2; sc: number; m: number; turn: number; clay: string }> = ({ at, sc, m, turn, clay }) => {
  const v = vessel(m);
  const col = mixHex(clay, ACCENT, ease(m / 0.28));
  const deep = mixHex(clay, ACCENT_DEEP, ease(m / 0.28));
  const ryOf = (r: number) => r * 0.3;
  const wall = `M${-v.rw},${v.ry}Q${-v.cx},${v.cy} ${-v.bw},${v.by}A${v.bw},${ryOf(v.bw)} 0 0 0 ${v.bw},${v.by}Q${v.cx},${v.cy} ${v.rw},${v.ry}`;
  const body = `${wall}A${v.rw},${ryOf(v.rw)} 0 0 1 ${-v.rw},${v.ry}Z`;
  // the throwing rings, turning up the wall
  const rings = Array.from({ length: 3 }, (_, i) => {
    const u = (((i / 3 + turn * 1.5) % 1) + 1) % 1;
    const p = wallPt(m, 0.08 + 0.84 * u);
    return `M${(-p[0]).toFixed(2)},${p[1].toFixed(2)}Q0,${(p[1] + ryOf(p[0]) * 0.9).toFixed(2)} ${p[0].toFixed(2)},${p[1].toFixed(2)}`;
  }).join("");
  const sh = wallPt(m, 0.5);
  return (
    <g transform={`translate(${Pt(at)}) scale(${sc.toFixed(5)})`}>
      <path d={body} fill={col} stroke={DARK} strokeWidth={2.4} strokeLinejoin="round" />
      {/* the right side in shade (light from the upper left) */}
      <path d={`M${(v.rw * 0.35).toFixed(2)},${(v.ry + ryOf(v.rw)).toFixed(2)}L${(v.rw * 0.97).toFixed(2)},${(v.ry + 1).toFixed(2)}Q${v.cx},${v.cy} ${v.bw},${v.by}L${(v.bw * 0.2).toFixed(2)},${(v.by + ryOf(v.bw) * 0.9).toFixed(2)}Q${(sh[0] * 0.35).toFixed(2)},${sh[1].toFixed(2)} ${(v.rw * 0.35).toFixed(2)},${(v.ry + ryOf(v.rw)).toFixed(2)}Z`} fill={deep} opacity={0.85} />
      <path d={rings} fill="none" stroke={DARK} strokeWidth={0.9} strokeOpacity={mix(0.45, 0.22, m)} />
      {/* the open mouth: the inside seen from above, darker */}
      <ellipse cx={0} cy={v.ry} rx={v.rw} ry={ryOf(v.rw)} fill={mixHex(clay, ACCENT, ease(m / 0.28))} stroke={DARK} strokeWidth={2.2} />
      <ellipse cx={0} cy={v.ry + ryOf(v.rw) * 0.12} rx={v.rw * 0.84} ry={ryOf(v.rw) * 0.72} fill={deep} stroke={DARK} strokeWidth={1.2} strokeOpacity={0.7} />
    </g>
  );
};

/** his wheel: C's own (still) wheel until it moves (so f0 is exact), then turning with the bowl on it */
const WorkedWheel: React.FC<{ P: Persp; who: Who; f: number; uid: string }> = ({ P, who, f, uid }) => {
  const turn = wheelTurn(who, f);
  const st = SEATS[who];
  const ink = warmInk(st.Z);
  if (turn === 0.15 && C_HAS_D_STATIONS) return null;
  const wh = wheelAt(P, who);
  const m = bowlForm(who, f);
  const clay = mixHex(ink.main, ink.hair, 0.38);
  return (
    <g>
      {/* preview only, until C carries the stations: the empty stool C will draw */}
      {C_HAS_D_STATIONS ? null : <Stool at={P.p(seatPlace(st).stool, 0, st.Z + 4)} scale={P.r(st.Z)} uid={`${uid}-tmps`} ink={ink} />}
      <PotterWheel at={wh.at} scale={wh.sc} uid={`${uid}-w`} ink={ink} turn={turn} dir={st.dir} clay={m <= 0} />
      {m > 0 ? <ThrownBowl at={wh.at} sc={wh.sc} m={m} turn={turn} clay={clay} /> : null}
    </g>
  );
};

const Walker: React.FC<{ P: Persp; who: Who; f: number; uid: string }> = ({ P, who, f, uid }) => {
  const s = walkerState(who, f, P);
  const at = P.p(s.hip[0], s.hip[1], s.hip[2]);
  const sc = P.r(s.hip[2]);
  const ink = walkerInk(who, s.hip[0], s.hip[2]);
  // on the treads his own shadow (C's figures' shadows lie under everything, so the steps would hide it there)
  const onTread = Math.sin(Math.PI * c01(-s.hip[1] / 100));
  const shadow = onTread > 0.01 ? <ContactShadow P={P} X={s.hip[0]} Z={s.hip[2]} w={52} d={26} Y={s.hip[1]} uid={`${uid}-cs`} amt={onTread} /> : null;
  const fig =
    who === "main" ? (
      <ChalkSlave pose={s.pose} at={at} sc={sc} ink={ink} uid={uid} grip={s.grip} />
    ) : (
      <Slave pose={s.pose} at={at} scale={sc} uid={uid} variant={WAITING[0].variant} ink={ink} cloth={ink} shade={1} fetters grip={s.grip} />
    );
  return (
    <g>
      {shadow}
      {fig}
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE CUT
// ---------------------------------------------------------------------------
/** the walker's painter depth (his hip's Z) without a perspective */
const depthOf = (who: Who, f: number) => {
  if (f < sitStart(who)) return WALKS[who].hip(f)[2];
  const u = c01((f - sitStart(who)) / SIT_LEN);
  return mix(WALKS[who].hip(sitStart(who))[2], SEATS[who].Z, smoother(u));
};

/** for the glitch audit (scratch scripts): a walker's drawn state on frame f, in the 2D world of the camera */
export const auditWalker = (who: Who, f: number) => {
  const cam = camAt(f);
  const split = splitAt(f);
  const X = f < sitStart(who) ? WALKS[who].hip(f)[0] : SEATS[who].X;
  const half = split > 0 || X < 0 ? "L" : "R";
  const { P, dx } = halfPersp(cam, half, split);
  const s = walkerState(who, f, P);
  const at = P.p(s.hip[0], s.hip[1], s.hip[2]);
  return { cam, dx, P, at: [at[0] + dx, at[1]] as P2, sc: P.r(s.hip[2]), pose: s.pose, grip: s.grip ? { L: s.grip.L ? ([s.grip.L[0] + dx, s.grip.L[1]] as P2) : undefined, R: s.grip.R ? ([s.grip.R[0] + dx, s.grip.R[1]] as P2) : undefined } : undefined, hip: s.hip, variant: variantOf(who), depth: depthOf(who, f) };
};

const SlavesInTheWorkshop: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const cam = camAt(f);
  const split = splitAt(f);
  const extra: StageExtra[] = [];
  (["wait", "main"] as Who[]).forEach((who) => {
    // the worked wheel at the station's depth (after C's station item, before the potter)
    extra.push({ half: "R", Z: SEATS[who].Z, node: (P) => <WorkedWheel key={`ww-${who}`} P={P} who={who} f={f} uid={`d-${who}`} /> });
  });
  (["wait", "main"] as Who[]).forEach((who) => {
    const Z = depthOf(who, f);
    const X = f < sitStart(who) ? WALKS[who].hip(f)[0] : SEATS[who].X;
    // on the left half until he crosses the seam (both halves share one perspective once split is 0)
    const half = split > 0 || X < 0 ? "L" : "R";
    extra.push({ half, Z, node: (P) => <Walker key={`wk-${who}`} P={P} who={who} f={f} uid={`d-${who}-fig`} /> });
    // his contact shadow in C's own layer (under every item), as C draws it for him on its last frame, then following
    // his hip (and out under the stool as he sits)
    extra.push({
      half,
      Z: 1e6,
      node: (P) => {
        const s0 = sitStart(who);
        const u = f < s0 ? 0 : smoother(c01((f - s0) / SIT_LEN));
        const h = f < s0 ? WALKS[who].hip(f) : ([mix(WALKS[who].hip(s0)[0], SEATS[who].X, u), 0, Z] as V3);
        const w = who === "main" ? 52 : 50;
        return <ContactShadow key={`cs-${who}`} P={P} X={h[0] + 20 * u} Z={h[2]} w={mix(w, 64, u)} d={26} Y={h[1]} uid={`wk-${who === "main" ? "csm" : "csw0"}`} amt={1} />;
      },
    });
  });
  return (
    <TexcocoPage cam={cam}>
      <WorldSvg cam={cam}>
        <MarketWorkshopStage cam={cam} frame={G(f)} split={split} seam={seamAt(f)} stack={stackAt(f)} hide={{ main: true, waiting: [true] }} extra={extra} uid="wk" />
      </WorldSvg>
    </TexcocoPage>
  );
};

export default SlavesInTheWorkshop;
