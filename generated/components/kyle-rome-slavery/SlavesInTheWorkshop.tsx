// ---------------------------------------------------------------------------
// SlavesInTheWorkshop (kyle-rome-slavery, cut 33). Dwarkesh map style (styles/dwarkesh-map.md), the 3D DEPTH manner of
// Kyle London (londonDepth, read only). Opaque 1080x1920, 29.97 fps, 143 frames.
// It returns to cut C's world (./marketWorkshopWorld, read only; C = WeKeepThemApart) and opens on C's last frame.
// The numbers (slabs, paths, sit, throwing, camera) are in ./slavesInTheWorkshopPlan.ts.
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
// THE MOTION: f0 is cut C's last frame exactly (the market slab and the workshop slab apart, the void between). f0-20
// the two slabs slide back together on the floor plane (contact on f20, a small thud), and the crack heals from the
// back to the front edge (f21-36). Meanwhile the two slaves from the sale platform, the chalk-footed one (titulus at
// his neck) and the fettered one, lift their heads, turn, step down the catasta's steps and walk across where the
// seam was into the workshop, coming out of the sale's cold, sunk light into the workshop's warm light; each stops
// in front of an empty front-row stool, turns his back to it, sits and takes the clay; his wheel spins up and his
// hands draw an ORANGE bowl up the wheel in pulls. One camera move rides over them from C's wide: one push-in (one
// lobe, f4-92) onto the front row, landed on "slaves" (f92) on the two slave potters at their wheels (the chalked
// feet, the titulus, the fetter chain on the floor under the stool) with the rows of potters behind them and the rack
// of orange bowls; then a slow creep, everything turning and stacking, to the cut.
// CAUSE BEFORE EFFECT: the slabs move from f1 (the cause of everything after); each wheel turns only after its potter
// sits (main: seated f84, wheel from f80; fettered: seated f97, wheel from f93); the bowl rises only while his hands
// rise up its wall (main pulls from f84, turning orange as it opens by ~f92; fettered from f99).
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
import { ContactShadow, depthTint, perspective, tintInk, type Persp } from "../kyle-london/londonDepth";
import {
  ACCENT,
  ACCENT_DEEP,
  C_END,
  DEAD,
  DEPTH,
  MAIN_SLAVE,
  MarketWorkshopStage,
  WAITING,
  mainSlavePose,
  stationPlace,
  waitingPose,
  type StageExtra,
} from "./marketWorkshopWorld";
import { CREAM, DARK, POSES, PotterWheel, Slave, lerpFig, mixInk, romeAnchors, shadeInk, walkPose, idle, type FigPose, type Ink } from "./romeCast";
import { C0, DURATION as PLAN_DURATION, SEAT, WALKERS, bowlForm, camBase, ease, handRise, seamAt, splitAt, stackAt, thudAt, walkTravel, wheelTurn, type Who } from "./slavesInTheWorkshopPlan";

export const FPS = 30000 / 1001;
export const DURATION = 143;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// ----- the join with cut C (asserted at load) -----
if (PLAN_DURATION !== DURATION) throw new Error("plan and cut disagree on DURATION");
if (C_END.frame !== 210 || C_END.split !== 1 || C_END.seam !== 1) throw new Error("cut C's end state changed: re-check the join");
if (splitAt(0) !== C_END.split || seamAt(0) !== C_END.seam || stackAt(0) !== C_END.stack) throw new Error("f0 must be cut C's last frame");
{
  const c = swayCam(camBase(0), C_END.frame);
  if (c.k !== C_END.cam.k || c.cx !== C_END.cam.cx || c.cy !== C_END.cam.cy || C0.k !== camBase(0).k) throw new Error("f0's camera must be C_END.cam");
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

/** C's ambient frame: the life (wheels, kiln, breathing) runs on from C's f210 */
const G = (f: number) => C_END.frame + f;

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
// THE WALKERS' STATE (pure in f)
// ---------------------------------------------------------------------------
type WState = { X: number; Y: number; Z: number; pose: FigPose; seated: number; grip?: { L?: P2; R?: P2 }; gripW: number };
const startPose = (who: Who, f: number) => (who === "main" ? mainSlavePose(G(f)) : waitingPose(0, G(f)));
/** walking right: the walk with a longer stride (they are hurried across), the yaw following the heading */
const walkingPose = (who: Who, phase: number, amount: number, hd: [number, number]) => {
  const w = WALKERS[who];
  const base = POSES.walk(1, 0, 0);
  const yaw = 0.9 + (hd[1] < 0 ? -0.5 * -hd[1] : 0.14 * hd[1]);
  const q = walkPose({ ...base, yaw, headYaw: yaw - 0.04 }, phase, amount, w.stride);
  return who === "main" ? { ...q, pitch: q.pitch + 7, lids: Math.max(q.lids, 0.35) } : POSES.bowed(q);
};
/** turned to face us, his back to the stool, lowering */
const TURNED: FigPose = { ...POSES.front(), crouch: 52, lean: 6, pitch: 8, yaw: -0.1, headYaw: -0.45, lids: 0.4, brow: 0.3 };

/** the vessel on his wheel (wheel-local units, the wheel head's centre at the origin's x): base and rim */
const vessel = (m: number) => ({
  by: -77,
  ry: mix(-105, -111, m),
  bw: mix(23, 24, m),
  rw: mix(13, 39, m),
  cx: mix(25, 41, m),
  cy: mix(-95, -82, m),
});
/** a point on the right wall at height u (0 base .. 1 rim): the quadratic wall */
const wallPt = (m: number, u: number): P2 => {
  const v = vessel(m);
  const a: P2 = [v.bw, v.by];
  const c: P2 = [v.cx, v.cy];
  const b: P2 = [v.rw, v.ry];
  const s = 1 - u;
  return [s * s * a[0] + 2 * s * u * c[0] + u * u * b[0], s * s * a[1] + 2 * s * u * c[1] + u * u * b[1]];
};
const wheelAt = (P: Persp, who: Who) => {
  const st = SEAT[who];
  const pl = stationPlace(st);
  return { at: P.p(pl.wheel, 0, st.Z - 4), sc: P.r(st.Z - 4) };
};

const walkerState = (who: Who, f: number, P: Persp): WState => {
  const w = WALKERS[who];
  const tr = walkTravel(who);
  const st = SEAT[who];
  if (f < w.arrive) {
    const s = tr.s(f);
    const [X, Y, Z] = w.path.at(s);
    const amount = c01(tr.speed(f) / tr.v);
    const q = walkingPose(who, s / (2 * w.stride), amount, w.path.heading(s));
    const t = ease((f - w.turn[0]) / (w.turn[1] - w.turn[0]));
    const pose = t <= 0 ? startPose(who, f) : t >= 1 ? q : lerpFig(startPose(who, f), q, t);
    return { X, Y, Z, pose, seated: 0, gripW: 0 };
  }
  // the sit: turn to face us, back onto the stool, swivel to the wheel
  const u = c01((f - w.arrive) / w.sit);
  const end = w.path.at(w.path.len);
  const qa = walkingPose(who, w.path.len / (2 * w.stride), 0, w.path.heading(w.path.len));
  const seatedBase = idle(POSES.potter(-1, 0.25), G(f), 13 + st.variant, 0.4);
  const t1 = ease(u / 0.55);
  const t2 = ease((u - 0.3) / 0.7);
  let pose = lerpFig(lerpFig(qa, TURNED, t1), seatedBase, t2);
  if (who === "wait") pose = { ...pose, pitch: pose.pitch + 10 * (1 - t2), lids: Math.max(pose.lids, 0.45) };
  const X = mix(end[0], st.X, ease((u - 0.15) / 0.7));
  const Z = mix(end[2], st.Z, ease((u - 0.1) / 0.75));
  // the hands come onto the clay as he settles, then ride the wall up in each pull
  const gw = ease((u - 0.6) / 0.4);
  let grip: WState["grip"];
  if (gw > 0) {
    const wh = wheelAt(P, who);
    const m = bowlForm(who, f);
    const h = 0.12 + 0.8 * handRise(who, f);
    const out = wallPt(m, h);
    const inn = wallPt(m, Math.min(1, h + 0.12));
    const toW = (p: P2): P2 => [wh.at[0] + p[0] * wh.sc, wh.at[1] + p[1] * wh.sc];
    const sc = P.r(Z);
    const at = P.p(X, 0, Z);
    const nat = romeAnchors("slave", pose, at, sc, { variant: who === "main" ? MAIN_SLAVE.variant : WAITING[0].variant });
    // the near hand (R, facing left) on the outside of the wall, the far hand (L) inside it, a little higher
    const R = toW([out[0] + 5, out[1]]);
    const L = toW([inn[0] - 9, inn[1] - 2]);
    grip = { R: [mix(nat.handR[0], R[0], gw), mix(nat.handR[1], R[1], gw)], L: [mix(nat.handL[0], L[0], gw), mix(nat.handL[1], L[1], gw)] };
  }
  return { X, Y: 0, Z, pose, seated: u, grip, gripW: gw };
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

/** the front-row wheel he works: cut C's own wheel until it moves (so f0 is exact), then turning with the bowl */
const WorkedWheel: React.FC<{ P: Persp; who: Who; f: number; uid: string }> = ({ P, who, f, uid }) => {
  const turn = wheelTurn(who, f);
  if (turn === 0.15) return null;
  const st = SEAT[who];
  const ink = warmInk(st.Z);
  const wh = wheelAt(P, who);
  const m = bowlForm(who, f);
  const clay = mixHex(ink.main, ink.hair, 0.38);
  return (
    <g>
      <PotterWheel at={wh.at} scale={wh.sc} uid={`${uid}-w`} ink={ink} turn={turn} dir={-1} clay={m <= 0} />
      {m > 0 ? <ThrownBowl at={wh.at} sc={wh.sc} m={m} turn={turn} clay={clay} /> : null}
    </g>
  );
};

const Walker: React.FC<{ P: Persp; who: Who; s: WState; f: number; uid: string }> = ({ P, who, s, f, uid }) => {
  const at = P.p(s.X, s.Y, s.Z);
  const sc = P.r(s.Z);
  const ink = walkerInk(who, s.X, s.Z);
  const w = WALKERS[who];
  // his own contact shadow (on the platform, the treads, the floor): in from his first move (C's is hidden by the
  // platform's top), then under his feet; seated, under his feet before the stool
  const amt = ease((f - w.turn[0]) / 6);
  const shX = s.seated > 0 ? mix(s.X, s.X - 30, s.seated) : s.X;
  const shadow = amt > 0 ? <ContactShadow P={P} X={shX} Z={s.Z} w={mix(52, 64, s.seated)} d={26} Y={s.Y} uid={`${uid}-cs`} amt={amt} /> : null;
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
export const camAt = (f: number): Cam => {
  const c = swayCam(camBase(f), G(f));
  const th = thudAt(f);
  return th === 0 ? c : { ...c, cy: c.cy - th / c.k };
};

const SlavesInTheWorkshop: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const cam = camAt(f);
  const split = splitAt(f);
  const extra: StageExtra[] = [];
  (["wait", "main"] as Who[]).forEach((who) => {
    // the worked wheel first (at the station's depth: after C's station item, before the potter)
    extra.push({ half: "R", Z: SEAT[who].Z, node: (P) => <WorkedWheel key={`ww-${who}`} P={P} who={who} f={f} uid={`d-${who}`} /> });
  });
  (["wait", "main"] as Who[]).forEach((who) => {
    // the walker: on the left half until he crosses the seam (the halves share one perspective once split is 0)
    const probe = walkerState(who, f, perspective0(cam));
    const half = split > 0 || probe.X < 0 ? "L" : "R";
    extra.push({ half, Z: probe.Z, node: (P) => <Walker key={`wk-${who}`} P={P} who={who} s={walkerState(who, f, P)} f={f} uid={`d-${who}-fig`} /> });
  });
  return (
    <TexcocoPage cam={cam}>
      <WorldSvg cam={cam}>
        <MarketWorkshopStage cam={cam} frame={G(f)} split={split} seam={seamAt(f)} stack={stackAt(f)} hide={{ main: true, waiting: [true] }} extra={extra} uid="wk" />
      </WorldSvg>
    </TexcocoPage>
  );
};

/** a perspective only for the walker's depth (painter's order); drawing uses the stage's own per-half P */
const perspective0 = (cam: Cam) => perspective(cam, DEPTH);

export default SlavesInTheWorkshop;
