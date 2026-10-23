// ---------------------------------------------------------------------------
// sparkTakeoffCast: the people and the armillary sphere of SparkingSustainedTakeoff (kyle-greek-math, cut 15), from
// this clip's Greek cast (./greekFolk.tsx, read-only; its header is the API), placed in the kit's air.
//   the geometer   Scholar 0 (old, bald, white-bearded: Thales), POSES.crouchDraw with the near hand (the rig's armL)
//                  gripped onto the plan's hand point; his long staff drawn with the cast's Stick prop from its tip
//                  on the sand through his fist (the cast's own held stick is 0.96 m with its tip clamped to the
//                  ground within 1.2 m of his feet; this one is 2.5 m and lifts off); he stands into POSES.lookUp
//   the companion  Scholar 3, standing facing left beside the sphere: his near hand (the rig's armR) comes onto its
//                  equator ring (contact PUSH0), rides it round as he pushes (to PUSH1), then drops to his side;
//                  looks up (chin, head turn toward the climb)
//   the sphere     the cast's ArmillarySphere (stand, axis, globe) with its rings drawn here on the same geometry, so
//                  they go from dull bronze to the glowing orange as they turn under his hand (sphereLit)
// Exports: <Geometer A f/>, <Companion A f/>, <Sphere A f/>, and geoRig / compRig (pose, at, scale, grip, anchors) for
// the caption-band and pop checks.
// ---------------------------------------------------------------------------
import React from "react";
import { AirShadow, type AirWorld, type P2 } from "../kits/dwarkesh-3d/dwarkesh3d";
import * as GF from "./greekFolk";
import { COMP, GEO, PUSH0, PUSH1, SPHERE, lerp, lookUpAt, smoother, sphereLit, sphereTurn, standAt, stickAt, type V3 } from "./sparkTakeoffPlan";

type GPose = GF.GPose;
const pr = (A: AirWorld, q: V3): P2 => A.P.p(q[0], q[1], q[2]);
/** the cast's lerpFig carries the hands' depth (dz) */
const lerpG = (a: GPose, b: GPose, t: number): GPose => GF.lerpFig(a, b, t);

// ===================================================================================================================
// THE GEOMETER
// ===================================================================================================================
const GEO_VAR = 0;
export const geoRig = (A: AirWorld, f: number) => {
  const { at, scale } = A.P.at(GEO[0], GEO[1]);
  const st = stickAt(f);
  const t = standAt(f);
  const crouch: GPose = GF.idle(GF.POSES.crouchDraw(1, 0), f, 3);
  // standing, he looks up at the climb: the chin lifts and the whole upper body tilts back a little
  const up = lookUpAt(f);
  const lu: GPose = GF.POSES.lookUp(1, up);
  const stand: GPose = GF.idle({ ...lu, lean: lu.lean - 9 * up, pitch: lu.pitch - 4 * up }, f, 3);
  const pose = lerpG(crouch, stand, t);
  const grip = { L: pr(A, st.hand) };
  const an = GF.greekAnchors("scholar", pose, at, scale, { variant: GEO_VAR, grip });
  return { pose, at, scale, grip, an, st, t };
};
export const Geometer: React.FC<{ A: AirWorld; f: number }> = ({ A, f }) => {
  const { pose, at, scale, grip, an, st, t } = geoRig(A, f);
  // the staff: from its tip on the sand through his actual fist, on to its butt (the plan's length, projected);
  // standing, its tip is planted on the ground just in front of the fist (the staff upright at his side)
  const fist = an.handL;
  const tip3 = pr(A, st.tip);
  const planted: P2 = [fist[0] + 7 * scale, at[1] + 3 * scale];
  const tip: P2 = [lerp(tip3[0], planted[0], t), lerp(tip3[1], planted[1], t)];
  const dv: P2 = [fist[0] - tip[0], fist[1] - tip[1]];
  const dl = Math.hypot(dv[0], dv[1]) || 1;
  const bw = pr(A, st.butt);
  const len = Math.max(dl + 20 * scale, Math.hypot(bw[0] - tip[0], bw[1] - tip[1]));
  const butt: P2 = [tip[0] + (dv[0] / dl) * len, tip[1] + (dv[1] / dl) * len];
  const ang = (Math.atan2(tip[1] - butt[1], tip[0] - butt[0]) * 180) / Math.PI;
  const fog = A.folkFog(GEO[1]);
  return (
    <g>
      <AirShadow A={A} X={GEO[0] + 10} Z={GEO[1]} w={lerp(96, 62, t)} d={lerp(44, 30, t)} uid="geoS" amt={0.8} />
      <GF.Stick at={butt} scale={scale} angle={ang} len={len / scale} uid="geoStk" fog={fog} unitPx={A.k} />
      <GF.Scholar pose={pose} at={at} scale={scale} uid="geo" variant={GEO_VAR} grip={grip} fog={fog} unitPx={A.k} />
    </g>
  );
};

// ===================================================================================================================
// THE ARMILLARY SPHERE and THE COMPANION
// ===================================================================================================================
/** the cast prop's geometry (ArmillarySphere: stand H 108, rings R 62, seen tilted 0.22): a point fixed on the
 *  equator ring at parameter a, turned by `turn` (0..1), in rig units from the prop's floor point */
/** the sphere: the cast's ArmillarySphere geometry (stand H 108, rings `size` R, seen tilted 0.22, in rig units:
 *  world = at + p * scale). The cast's prop draws the stand, axis and globe (its own rings at width ~0);
 *  the rings are drawn here, the same circles, so they can go from dull bronze to the glowing orange */
const SPH = { H: 108, R: 70, tilt: 0.22, ringW: 3.6 };
const OBL = 0.41;
const RINGS: [number, number, number, number][] = [
  // axisTilt, scaleR, yOff, axisTurn: the meridian, the equator, the ecliptic, the two tropics (the cast's set)
  [Math.PI / 2, 1, 0, 0],
  [0.35, 1, 0, 0],
  [0.35 + OBL, 0.98, 0, 0.5],
  [0.35, Math.cos(OBL), -Math.sin(OBL), 0],
  [0.35, Math.cos(OBL), Math.sin(OBL), 0],
];
const turnAt = (f: number) => -sphereTurn(f) / (2 * Math.PI);
/** a point of ring i at parameter a, turned by `turn01`, in the prop's folk units (and its depth sign) */
const ringPt = (i: number, a: number, turn01: number): { p: P2; z: number } => {
  const [axisTilt, scaleR, yOff, axisTurn] = RINGS[i];
  let x = Math.cos(a) * scaleR;
  let y = yOff;
  let z = Math.sin(a) * scaleR;
  const y1 = y * Math.cos(axisTilt) - z * Math.sin(axisTilt);
  const z1 = y * Math.sin(axisTilt) + z * Math.cos(axisTilt);
  y = y1;
  z = z1;
  const x2 = x * Math.cos(axisTurn) + z * Math.sin(axisTurn);
  const z2 = -x * Math.sin(axisTurn) + z * Math.cos(axisTurn);
  x = x2;
  z = z2;
  const tn = turn01 * 2 * Math.PI;
  const yy = -y;
  const xr = x * Math.cos(tn) + z * Math.sin(tn);
  const zr = -x * Math.sin(tn) + z * Math.cos(tn);
  const y2 = yy * Math.cos(SPH.tilt) - zr * Math.sin(SPH.tilt);
  const zv = yy * Math.sin(SPH.tilt) + zr * Math.cos(SPH.tilt);
  return { p: [xr * SPH.R, -SPH.H - SPH.R + y2 * SPH.R], z: zv };
};
/** the equator's point under the companion's hand: on the front, toward him (right) when the push begins */
const A_HAND = (() => {
  let best = 0;
  let bv = -1e9;
  for (let i = 0; i < 720; i++) {
    const a = (i / 720) * 2 * Math.PI;
    const q = ringPt(1, a, turnAt(PUSH0));
    if (q.z <= 0.15) continue;
    const v = q.p[0] - 0.4 * Math.abs(q.p[1] + SPH.H + SPH.R);
    if (v > bv) {
      bv = v;
      best = a;
    }
  }
  return best;
})();
const sphereAt = (A: AirWorld) => A.P.at(SPHERE[0], SPHERE[1]);
const toWorld = (at: P2, scale: number, p: P2): P2 => [at[0] + p[0] * scale, at[1] + p[1] * scale];
const mixH = (a: string, b: string, t: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `#${pa.map((v, i) => Math.round(v + (pb[i] - v) * Math.max(0, Math.min(1, t))).toString(16).padStart(2, "0")).join("")}`;
};
/** the rings' back or front halves as glowing (lit) or dull bronze (unlit) lines; fog as the cast's (orange half) */
const SphereRings: React.FC<{ at: P2; scale: number; f: number; front: boolean; fog: GF.FolkFog }> = ({ at, scale, f, front, fog }) => {
  const lit = sphereLit(f);
  const turn = turnAt(f);
  const runs: P2[][] = [];
  for (let i = 0; i < RINGS.length; i++) {
    let cur: P2[] = [];
    for (let j = 0; j <= 64; j++) {
      const q = ringPt(i, (j / 64) * 2 * Math.PI, turn);
      const isFront = q.z >= 0;
      if (isFront === front) cur.push(toWorld(at, scale, q.p));
      else {
        if (cur.length > 1) runs.push(cur);
        cur = [];
      }
    }
    if (cur.length > 1) runs.push(cur);
  }
  if (!runs.length) return null;
  const d = runs.map((r) => `M${r.map((v) => `${v[0].toFixed(2)},${v[1].toFixed(2)}`).join("L")}`).join("");
  const fogHex = typeof fog.rgb === "string" ? fog.rgb : `#${fog.rgb.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
  const metal = front ? GF.BRONZE.lit : GF.BRONZE.mid;
  const orange = front ? GF.ACCENT : GF.ACCENT_DEEP;
  const col = mixH(mixH(metal, orange, lit), fogHex, fog.amount * (1 - 0.5 * lit));
  const w = SPH.ringW * scale * (front ? 1 : 0.7);
  const op = front ? 1 : lerp(0.75, 0.55, lit);
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      {lit > 0.01 ? <path d={d} stroke={col} strokeWidth={w * GF.GLOW.halo} opacity={GF.GLOW.haloOp * op * lit} /> : null}
      <path d={d} stroke={col} strokeWidth={w} opacity={op} />
    </g>
  );
};
export const Sphere: React.FC<{ A: AirWorld; f: number }> = ({ A, f }) => {
  const { at, scale } = sphereAt(A);
  const fog = A.folkFog(SPHERE[1]);
  return (
    <g>
      <AirShadow A={A} X={SPHERE[0]} Z={SPHERE[1]} w={58} d={36} uid="sphS" amt={0.7} />
      <SphereRings at={at} scale={scale} f={f} front={false} fog={fog} />
      <GF.ArmillarySphere at={at} scale={scale} turn={turnAt(f)} size={SPH.R} ringW={0.0001} uid="sph" fog={fog} unitPx={A.k} />
      <SphereRings at={at} scale={scale} f={f} front fog={fog} />
    </g>
  );
};
const COMP_VAR = 3;
export const compRig = (A: AirWorld, f: number) => {
  const { at, scale } = A.P.at(COMP[0], COMP[1]);
  const up = lookUpAt(f + 6);
  const base: GPose = GF.POSES.stand(-1);
  const look: GPose = GF.POSES.lookUp(-1, 1);
  // looking up at the takeoff: the chin lifts and the head turns from the sphere toward the curve (a slow turn)
  const lifted: GPose = GF.idle(lerpG(base, look, up), f, 7);
  const pose: GPose = GF.POSES.turnHead(lifted, lerp(lifted.headYaw, 0.3, up));
  // his near hand: from his side onto the equator ring (contact PUSH0), riding it round as he pushes, back to his side
  const s = sphereAt(A);
  const onRing = toWorld(s.at, s.scale, ringPt(1, A_HAND, turnAt(Math.max(PUSH0, Math.min(f, PUSH1)))).p);
  const rest = GF.greekAnchors("scholar", pose, at, scale, { variant: COMP_VAR }).handR;
  const on = smoother((f - (PUSH0 - 13)) / 13) * (1 - smoother((f - PUSH1 - 2) / 16));
  const grip = { R: [lerp(rest[0], onRing[0], on), lerp(rest[1], onRing[1], on)] as P2 };
  const an = GF.greekAnchors("scholar", pose, at, scale, { variant: COMP_VAR, grip });
  return { pose, at, scale, grip, an };
};
export const Companion: React.FC<{ A: AirWorld; f: number }> = ({ A, f }) => {
  const { pose, at, scale, grip } = compRig(A, f);
  return (
    <g>
      <AirShadow A={A} X={COMP[0]} Z={COMP[1]} w={62} d={30} uid="cmpS" amt={0.75} />
      <GF.Scholar pose={pose} at={at} scale={scale} uid="cmp" variant={COMP_VAR} grip={grip} fog={A.folkFog(COMP[1])} unitPx={A.k} />
    </g>
  );
};
