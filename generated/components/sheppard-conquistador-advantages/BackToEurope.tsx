// ---------------------------------------------------------------------------
// BackToEurope (cut D of the "Conquistador advantages" set; Dwarkesh Patel with
// Si Sheppard). Dwarkesh map style, "beyond maps" umber page; the cast is
// backToEuropeFigures. Opaque 1080x1920, 23.976 fps, 92 frames (f0..f91).
//
// CHECK LINE: After this cut the viewer can say: "cotton armour was fine
// against obsidian in Mexico, but against Europe's steel it would not have
// saved him."
//
// THE LINE: "They would not have done that and carried it back to Europe. That
// would have made them too vulnerable. But here, ..."
// WORD -> FRAME: They -1 · would 1 · not 4 · have 8 · done 11 · that 15 · and 20 ·
//   carried 22 · it 28 · back 31 · to 35 · Europe 40-47 · That 49 · would 51 ·
//   have 54 · made 56 · them 59 · too 62 · vulnerable 64-72 · But 76 · here 80-86.
//
// THE MOTION (one move): mid-close on ONE conquistador facing right, an orange
// steel morion on his head but a cream quilted cotton armour on his body; the
// camera is already pulling back and to the right, and that move brings a
// hedge of European pikes (cream shafts, orange steel heads, pikemen in orange
// morions and breastplates) in from the right frame edge, marching at him at a
// constant pace; EUROPE slides up above it. He gives ground onto his back foot,
// the front pikeman thrusts, the leading point meets the quilting (CONTACT) and
// goes straight through the cloth at his flank and out of the back of the coat,
// wadding torn out round it; he is thrown back off balance, pushing another
// shaft down, a second point lodged in his skirt; the block halts, the frame
// settled but alive.
// Orange = the Spaniards' steel only (helmets, breastplates, sword hilt, pike
// heads). One label: EUROPE.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { DARK, LAND, mixColor, pchip, smoothstep, worldOf } from "../kits/maps/incaShared";
import { FPS, Label, TexcocoPage, WorldSvg, makeCamera, shadeInk, type P2 } from "../kits/maps/texcocoShared";
import { type Ink } from "../kits/maps/texcocoFigures";
import { Pike, Soldier, quiltWorld, soldierAnchors, torsoOfWorld, walkLegs, type Dent, type SArm, type SoldierPose } from "./backToEuropeFigures";

export { FPS };
export const DURATION = 92;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// ---------------------------------------------------------------------------
// LAYOUT (world px; the conquistador's feet at the origin, 3 px per figure unit)
// ---------------------------------------------------------------------------
const S = 3;
const HERO_AT: P2 = [0, 0];
const END = DURATION - 1;
/** the leading point meets the cloth on this frame; his recoil starts on it */
export const T_CONTACT = 61;
/** the block marches at a constant pace until T_SLOW and has halted by T_HALT */
const T_SLOW = 68;
const T_HALT = 78;
/** the front pikeman's thrust: the shaft driven forward through his leading hand */
const T_THRUST0 = 58;
const T_THRUST1 = 73;
const THRUST = 186;
const thrustAt = (f: number) => THRUST * smoothstep((f - T_THRUST0) / (T_THRUST1 - T_THRUST0));

// ---------------------------------------------------------------------------
// THE CONQUISTADOR'S MOVE (forward units; forward = screen right)
// ---------------------------------------------------------------------------
const arm = (w: P2, elbow: P2, fist: number, hand = 0): SArm => ({ w, elbow, fist, hand });
const STAND: SoldierPose = {
  headYaw: 0.8,
  roll: 0,
  pitch: -2,
  lean: 0,
  hipX: 0,
  crouch: 0,
  // both arms hang, the left beside the hilt
  far: arm([13, 101], [-0.3, 1], 0.45, 0),
  near: arm([-4, 102], [-0.3, 1], 0.4, 0),
  footFar: [0, 0],
  footNear: [0, 0],
  liftFar: 0,
  liftNear: 0,
  brow: 0.25,
  lids: 0,
  mouth: 0,
};
const HERO_KEYS: [number, SoldierPose][] = [
  [0, STAND],
  // he sees them coming: the chin lifts, the brow opens
  [13, { ...STAND, headYaw: 0.87, pitch: -4, lean: 0.6, brow: 0 }],
  [30, { ...STAND, headYaw: 0.9, pitch: -5, lean: 1.5, hipX: -1, crouch: 1, brow: -0.5, mouth: -0.3, far: arm([22, 94], [-0.4, 1], 0.4, 0), near: arm([-7, 101], [-0.4, 1], 0.32, 0) }],
  // the back foot comes off the ground and reaches behind him, the left hand comes up to fend
  [45, { ...STAND, headYaw: 0.92, pitch: -3, lean: 3, hipX: -4, crouch: 2.5, brow: -0.75, mouth: -0.5, far: arm([42, 66], [-0.4, 1], 0.3, 0), near: arm([-14, 97], [-0.6, 1], 0.25, 0), footNear: [-16, -10], liftNear: 20 }],
  [53, { ...STAND, headYaw: 0.92, pitch: 0, lean: 5, hipX: -11, crouch: 5, brow: -0.85, mouth: -0.6, far: arm([58, 42], [-0.3, 1], 0.2, -8), near: arm([-28, 88], [-1, 0.6], 0.2, 0), footNear: [-52, 0], liftNear: -4 }],
  // CONTACT: the point is on the cloth as the back foot takes him
  [T_CONTACT, { ...STAND, headYaw: 0.92, pitch: 1, lean: 6.5, hipX: -16, crouch: 7, brow: -0.9, mouth: -0.7, far: arm([66, 30], [-0.2, 1], 0.2, -12), near: arm([-38, 80], [-1, 0.4], 0.16, 0), footNear: [-54, 0], liftNear: 0 }],
  // it goes through: he is thrown back over the bent knee, the head pulled away, the right arm flung behind him, the front foot leaving the ground
  [66, { ...STAND, headYaw: 0.98, pitch: -3, roll: 6, lean: 13, hipX: -20, crouch: 11, brow: -1, mouth: -0.9, far: arm([62, 34], [-0.2, 1], 0.4, -14), near: arm([-58, 34], [-0.6, -0.8], 0.05, 6), footNear: [-54, 0], footFar: [-3, -3], liftFar: -14 }],
  [73, { ...STAND, headYaw: 1, pitch: -6, roll: 11, lean: 18, hipX: -24, crouch: 15, brow: -1, mouth: -0.9, far: arm([60, 36], [-0.2, 1], 0.5, -14), near: arm([-58, 0], [-0.4, -1], 0, 12), footNear: [-54, 0], footFar: [-6, -7], liftFar: -20 }],
  [END, { ...STAND, headYaw: 1, pitch: -6, roll: 10, lean: 18.3, hipX: -24.5, crouch: 15.6, brow: -0.95, mouth: -0.85, far: arm([60, 36], [-0.2, 1], 0.5, -14), near: arm([-56, 4], [-0.4, -1], 0.04, 10), footNear: [-54, 0], footFar: [-6, -6], liftFar: -18 }],
];
const flatArm = (a: SArm) => [a.w[0], a.w[1], a.elbow[0], a.elbow[1], a.fist, a.hand];
const flat = (q: SoldierPose) => [q.headYaw, q.roll, q.pitch, q.lean, q.hipX, q.crouch, ...flatArm(q.far), ...flatArm(q.near), q.footFar[0], q.footFar[1], q.footNear[0], q.footNear[1], q.liftFar, q.liftNear, q.brow, q.lids, q.mouth];
const unArm = (v: number[], i: number): SArm => ({ w: [v[i], v[i + 1]], elbow: [v[i + 2], v[i + 3]], fist: v[i + 4], hand: v[i + 5] });
const unflat = (v: number[]): SoldierPose => ({
  headYaw: v[0],
  roll: v[1],
  pitch: v[2],
  lean: v[3],
  hipX: v[4],
  crouch: v[5],
  far: unArm(v, 6),
  near: unArm(v, 12),
  footFar: [v[18], v[19]],
  footNear: [v[20], v[21]],
  liftFar: v[22],
  liftNear: v[23],
  brow: v[24],
  lids: v[25],
  mouth: v[26],
});
/** every channel a monotone cubic through the keys (texcocoShared's poseTrack, for this rig) */
const heroTrack = (() => {
  const fl = HERO_KEYS.map(([f, q]) => [f, flat(q)] as [number, number[]]);
  const ch = fl[0][1].map((_, i) => pchip(fl.map(([f, v]) => [f, v[i]] as [number, number]), true));
  return (f: number): SoldierPose => unflat(ch.map((c) => c(Math.max(0, Math.min(END, f)))));
})();
/** settled but alive: he breathes, the head drifts (his left hand is placed afterwards: heroWithHand) */
const heroPose = (f: number): SoldierPose => {
  const q = heroTrack(f);
  return { ...q, lean: q.lean + 0.3 * Math.sin(f / 9 + 1), crouch: q.crouch + 0.5 * Math.sin(f / 7.5), roll: q.roll + 0.5 * Math.sin(f / 13 + 0.6), near: { ...q.near, w: [q.near.w[0] + 0.8 * Math.sin(f / 7 + 2), q.near.w[1] + 0.8 * Math.cos(f / 8)] } };
};

// ---------------------------------------------------------------------------
// THE BLOCK: four pikemen (two of the front rank, two of the second, cut by the
// frame) and their four pikes, marching left at a constant pace, halting in a
// braced stride (no foot ever slides)
// ---------------------------------------------------------------------------
const STRIDE = 24;
const CYCLE = 26;
const ADV = (2 * STRIDE) / CYCLE; // units per frame
const speed = (f: number) => 1 - smoothstep((f - T_SLOW) / (T_HALT - T_SLOW));
/** frames' worth of full-pace marching done by frame f */
const MARCHED = (() => {
  const out = [0];
  for (let f = 0; f < DURATION + 2; f++) out.push(out[f] + (speed(f) + speed(f + 1)) / 2);
  return out;
})();
const marched = (f: number) => MARCHED[Math.max(0, Math.min(DURATION, Math.round(f)))];
const PHASE_END = 0.035;
const phaseAt = (f: number) => PHASE_END - (marched(END) - marched(f)) / CYCLE;

/** the men, block-local units (the near front pikeman's feet at (0, 0); they face screen left) */
const MEN: { at: P2; s: number; tone: number; ph: number; beard: number; yaw: number }[] = [
  // the front man (pike A, the thrust); a man a pace ahead of him on his far side, pike held low (C); one behind his shoulder (B)
  { at: [0, 0], s: 1, tone: 1, ph: 0, beard: 5, yaw: 0.8 },
  { at: [-25, -9], s: 0.94, tone: 0.88, ph: 0, beard: -1, yaw: 0.7 },
  { at: [21, -17], s: 0.97, tone: 0.78, ph: 0, beard: 10, yaw: 0.86 },
];
const PIKE_LEN = 900;
const shaftDir = (ang: number): P2 => [Math.cos((ang * Math.PI) / 180), Math.sin((ang * Math.PI) / 180)];
const bobOf = (f: number, ph: number) => 0.8 * Math.cos(4 * Math.PI * (phaseAt(f) + ph));
/** pike A, the front man's: levelled at the flank, thrust forward along its own line */
const REACH = 108;
const A_ANG = -9;
const tipA = (hx: number, f: number): P2 => {
  const e = shaftDir(A_ANG);
  const t = thrustAt(f);
  return [(hx - REACH - e[0] * t) * S, (-185 + bobOf(f, 0) - e[1] * t) * S];
};
/** pike B, the second man's, levelled at the breast */
const B_Y = -236;
const B_ANG = -2;
/** pike C, a low one that lodges in the skirt */
const C_Y = -118;
const C_ANG = -6;

/** where a point is on the cloth along its own line: p = how far past the front surface (< 0 = not there yet, units), the way in, the way out */
const penetration = (tip: P2, ang: number, poly: P2[]) => {
  const e = shaftDir(ang);
  const d: P2 = [-e[0], -e[1]];
  let front: { t: number; at: P2 } | null = null;
  let back: { t: number; at: P2 } | null = null;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const ex = b[0] - a[0];
    const ey = b[1] - a[1];
    const den = d[0] * ey - d[1] * ex;
    if (Math.abs(den) < 1e-9) continue;
    const t = ((a[0] - tip[0]) * ey - (a[1] - tip[1]) * ex) / den;
    const u = ((a[0] - tip[0]) * d[1] - (a[1] - tip[1]) * d[0]) / den;
    if (u < 0 || u > 1) continue;
    const at: P2 = [tip[0] + d[0] * t, tip[1] + d[1] * t];
    if (!front || at[0] > front.at[0]) front = { t, at };
    if (!back || at[0] < back.at[0]) back = { t, at };
  }
  if (!front || !back) return { p: -1e6, out: -1e6, at: tip, exit: tip, d };
  return { p: -front.t / S, out: -back.t / S, at: front.at, exit: back.at, d };
};
const heroQuilt = (f: number) => quiltWorld(1, heroPose(f), HERO_AT, S);
const bisect = (fn: (v: number) => number, lo: number, hi: number) => {
  // fn is decreasing in v; find fn(v) = 0
  let a = lo;
  let b = hi;
  for (let i = 0; i < 48; i++) {
    const m = (a + b) / 2;
    if (fn(m) > 0) a = m;
    else b = m;
  }
  return (a + b) / 2;
};
/** where the block stands at the end, so that pike A's point meets the cloth exactly on T_CONTACT */
const HX_END = (() => {
  const poly = heroQuilt(T_CONTACT);
  const back = ADV * (marched(END) - marched(T_CONTACT));
  return bisect((hx) => penetration(tipA(hx + back, T_CONTACT), A_ANG, poly).p, 20, 520);
})();
const blockX = (f: number) => HX_END + ADV * (marched(END) - marched(f));
const tipB = (hx: number, f: number, reach: number): P2 => [(hx - reach) * S, (B_Y + bobOf(f, 0.5)) * S];
/** pike B ends 9 units short of his breast; pike C ends 15 units into the skirt's padding */
const B_REACH = bisect((v) => -9 - penetration(tipB(HX_END, END, v), B_ANG, heroQuilt(END)).p, 20, 320);
const cTip = (hx: number, f: number, reach: number): P2 => [(hx - reach) * S, (C_Y + bobOf(f, 0.3)) * S];
const C_REACH = bisect((v) => 15 - penetration(cTip(HX_END, END, v), C_ANG, heroQuilt(END)).p, 20, 320);

/** a pikeman marching with his pike charged: his fists round the shaft where it passes him */
const pikeman = (f: number, i: number, hx: number, tip: P2, ang: number, lunge = 0): { pose: SoldierPose; at: P2; scale: number } => {
  const m = MEN[i];
  const at: P2 = [(hx + m.at[0]) * S, m.at[1] * S];
  const scale = S * m.s;
  const w = walkLegs(phaseAt(f) + m.ph, STRIDE);
  const e = shaftDir(ang);
  const wrist = (F: number): P2 => {
    const gx = at[0] - F * scale;
    const along = (gx - tip[0]) / e[0];
    return [(tip[0] + e[0] * along - at[0]) / scale + 3, (tip[1] + e[1] * along - at[1]) / scale + 8];
  };
  return {
    at,
    scale,
    pose: {
      headYaw: m.yaw,
      roll: 0.4 * Math.sin(f / 11 + i * 2),
      pitch: 4 + 3 * lunge,
      lean: -6 - 8 * lunge,
      hipX: 4 * lunge,
      crouch: 3.5 + w.bob + 2 * lunge,
      far: { w: [0, 0], to: wrist(-20 + 34 * lunge), elbow: [-0.7, 0.5], fist: 1, hand: 0 },
      near: { w: [0, 0], to: wrist(46 + 20 * lunge), elbow: [-0.3, 1], fist: 1, hand: 0 },
      footFar: w.far.off,
      footNear: w.near.off,
      liftFar: w.far.lift,
      liftNear: w.near.lift,
      brow: 0.8,
      lids: 0,
      mouth: -0.5,
    },
  };
};

// ---------------------------------------------------------------------------
// THE CAMERA: one pull-back to the right, then a creep
// ---------------------------------------------------------------------------
/** his chest as he stands at f0 */
const CHEST: P2 = [0, -208 * S];
const camAt = makeCamera([
  { f: 0, k: 1.84, wx: CHEST[0], wy: CHEST[1], sx: 525, sy: 930 },
  { f: 11, k: 1.5, wx: CHEST[0], wy: CHEST[1], sx: 452, sy: 930 },
  { f: 30, k: 1.2, wx: CHEST[0], wy: CHEST[1], sx: 415, sy: 916 },
  { f: 46, k: 1.14, wx: CHEST[0], wy: CHEST[1], sx: 430, sy: 906 },
  { f: 72, k: 1.125, wx: CHEST[0], wy: CHEST[1], sx: 536, sy: 900 },
  { f: END, k: 1.105, wx: CHEST[0], wy: CHEST[1], sx: 542, sy: 904 },
]);

// ---------------------------------------------------------------------------
// THE STATE AT A FRAME
// ---------------------------------------------------------------------------
const D_MAX = 11;
export const backState = (f: number) => {
  const q0 = heroPose(f);
  const hx = blockX(f);
  // the pikes
  const A = { tip: tipA(hx, f), ang: A_ANG };
  const B = { tip: tipB(hx, f, B_REACH), ang: B_ANG };
  const C = { tip: cTip(hx, f, C_REACH), ang: C_ANG };
  const poly = quiltWorld(1, q0, HERO_AT, S);
  const pa = penetration(A.tip, A.ang, poly);
  // from the contact on, his left hand goes to the shaft that is in his coat and bears down on it
  const grab = pa.p > 0 ? smoothstep((f - T_CONTACT) / 6) : 0;
  const rig0 = soldierAnchors(1, q0, HERO_AT, S);
  const eA = shaftDir(A.ang);
  const onShaft: P2 = [(pa.at[0] + eA[0] * 24 * S) / S - 5.5, (pa.at[1] + eA[1] * 24 * S) / S - 8];
  const free: P2 = [rig0.shoulderFar[0] / S + q0.far.w[0], rig0.shoulderFar[1] / S + q0.far.w[1]];
  const q: SoldierPose = grab > 0 ? { ...q0, far: { ...q0.far, fist: q0.far.fist + (0.75 - q0.far.fist) * grab, to: [free[0] + (onShaft[0] - free[0]) * grab, free[1] + (onShaft[1] - free[1]) * grab] } } : q0;
  const tor = torsoOfWorld(1, q, HERO_AT, S);
  const pc = penetration(C.tip, C.ang, poly);
  const dents: Dent[] = [];
  if (pa.p > 0) {
    const depth = Math.min(pa.p, D_MAX);
    const torn = smoothstep((pa.p - 5) / 10);
    dents.push({ at: tor.toTorso(pa.at), push: tor.dirToTorso([pa.d[0] * depth, pa.d[1] * depth]), r: 14, slit: smoothstep((pa.p - 3) / 7), tuft: torn, out: tor.dirToTorso([-pa.d[0], -pa.d[1]]) });
    if (pa.out > -6) {
      const o = smoothstep((pa.out + 6) / 10);
      dents.push({ at: tor.toTorso(pa.exit), push: tor.dirToTorso([pa.d[0] * 2 * o, pa.d[1] * 2 * o]), r: 10, slit: 0.7 * o, tuft: 0.55 * o, out: tor.dirToTorso(pa.d) });
    }
  }
  if (pc.p > 0) {
    const depth = Math.min(pc.p, 9);
    dents.push({ at: tor.toTorso(pc.at), push: tor.dirToTorso([pc.d[0] * depth, pc.d[1] * depth]), r: 13, slit: smoothstep((pc.p - 3) / 7), tuft: 0.7 * smoothstep((pc.p - 6) / 8), out: tor.dirToTorso([-pc.d[0], -pc.d[1]]) });
  }
  const lunge = smoothstep((f - T_THRUST0) / (T_THRUST1 - 3 - T_THRUST0));
  return {
    q,
    hx,
    dents,
    pa: pa.p,
    out: pa.out,
    pc: pc.p,
    pikes: { A, B, C },
    men: [pikeman(f, 0, hx, A.tip, A.ang, lunge), pikeman(f, 1, hx, C.tip, C.ang), pikeman(f, 2, hx, B.tip, B.ang)],
    cam: camAt(f),
  };
};

/** a foot's shadow on the page: a few level strokes, thinning as the foot leaves the ground */
const FootShadow: React.FC<{ ankle: P2; groundY: number; dir: number; scale: number }> = ({ ankle, groundY, dir, scale }) => {
  const up = Math.max(0, (groundY - 15 * scale - ankle[1]) / scale);
  const o = 0.55 * Math.max(0, 1 - up / 16);
  if (o < 0.02) return null;
  const cx = ankle[0] + dir * 7 * scale;
  return (
    <g opacity={o}>
      {[0, 1, 2, 3].map((i) => {
        const w = (34 - i * 7) * scale;
        const y = groundY + (4 + i * 3.4) * scale;
        return <path key={i} d={`M${(cx - w + i * 5).toFixed(1)},${y.toFixed(1)}L${(cx + w + i * 9).toFixed(1)},${y.toFixed(1)}`} fill="none" stroke={DARK} strokeWidth={1.5 * scale * 0.5} strokeOpacity={0.7} strokeLinecap="round" />;
      })}
    </g>
  );
};

/** the steel of a man standing further back: the same orange, sunk a little toward the page */
const steelAt = (t: number): Ink => ({ main: mixColor(LAND, "#FFB000", 0.55 + 0.45 * t), deep: mixColor(LAND, "#D98A0C", 0.55 + 0.45 * t), hair: "#A56707" });

const BackToEurope: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const s = backState(frame);
  const cam = s.cam;
  const hero = soldierAnchors(1, s.q, HERO_AT, S);
  const label = worldOf([806, 366], cam);
  const pikeOf = [s.pikes.A, s.pikes.C, s.pikes.B];
  const man = (i: number, layer: "back" | "front") => {
    const m = s.men[i];
    return <Soldier key={`${i}${layer}`} kit="steel" dir={-1} pose={m.pose} at={m.at} scale={m.scale} uid={`be-m${i}${layer}`} ink={shadeInk(MEN[i].tone)} steel={steelAt(MEN[i].tone)} layer={layer} beard={MEN[i].beard} />;
  };
  const pike = (i: number) => <Pike key={`p${i}`} tip={pikeOf[i].tip} ang={pikeOf[i].ang} len={PIKE_LEN} scale={S} uid={`be-p${i}`} ink={shadeInk(MEN[i].tone)} steel={steelAt(MEN[i].tone)} head={1.05} />;
  return (
    <AbsoluteFill>
      <TexcocoPage cam={cam}>
        <WorldSvg cam={cam}>
          <FootShadow ankle={hero.ankleFar} groundY={0} dir={1} scale={S} />
          <FootShadow ankle={hero.ankleNear} groundY={0} dir={1} scale={S} />
          {[1, 0].map((i) => {
            const a = soldierAnchors(-1, s.men[i].pose, s.men[i].at, s.men[i].scale);
            return (
              <g key={i}>
                <FootShadow ankle={a.ankleFar} groundY={s.men[i].at[1]} dir={-1} scale={S} />
                <FootShadow ankle={a.ankleNear} groundY={s.men[i].at[1]} dir={-1} scale={S} />
              </g>
            );
          })}
          {/* the man behind the front man's shoulder shows head, breast and pike only: his legs are behind the rank */}
          {pike(2)}
          {man(2, "front")}
          {[man(1, "back"), pike(1), man(1, "front")]}
          {man(0, "back")}
          <Soldier kit="cotton" dir={1} pose={s.q} at={HERO_AT} scale={S} uid="be-h" layer="back" />
          {pike(0)}
          <Soldier kit="cotton" dir={1} pose={s.q} at={HERO_AT} scale={S} uid="be-hf" layer="front" dents={s.dents} />
          {man(0, "front")}
        </WorldSvg>
        <Label text="EUROPE" x={label[0]} y={label[1]} cam={cam} frame={frame} f0={30} size={68} spacing={0.32} />
      </TexcocoPage>
    </AbsoluteFill>
  );
};

export default BackToEurope;

/** review sheet: the conquistador and a pikeman large, the pike's head */
export const BackToEuropeSheet: React.FC = () => {
  const cam = { k: 1, cx: 540, cy: 960 };
  const pm = pikeman(0, 0, 0, [-300, -600], A_ANG).pose;
  return (
    <AbsoluteFill>
      <TexcocoPage cam={cam}>
        <WorldSvg cam={cam}>
          <Soldier kit="cotton" dir={1} pose={STAND} at={[300, 1560]} scale={3.1} uid="sh-h" />
          <Soldier kit="steel" dir={-1} pose={{ ...pm, far: { ...pm.far, to: undefined, w: [-40, 30] }, near: { ...pm.near, to: undefined, w: [60, 30] } }} at={[800, 1560]} scale={3.1} uid="sh-m" beard={-1} />
          <Pike tip={[120, 330]} ang={0} len={300} scale={3.1} uid="sh-p" />
        </WorldSvg>
      </TexcocoPage>
    </AbsoluteFill>
  );
};
