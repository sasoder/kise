// ---------------------------------------------------------------------------
// NotOptimallyAdapted (rsi-stupidest-species, cut 19), REVISION 1: THE CLUMSY FIRE-KEEPER. Dwarkesh 3D style
// (styles/dwarkesh-3d.md). Opaque 1080x1920, 23.976 fps, 73 frames. Built on cut B's world stupidestStairs.tsx
// (read-only; STAIRS_READY.md) and B's own exports (StupidestPossibleSpecies.tsx: the cast's places, the lamp row, the
// fire's size); the human is covidFolk's Commuter v0. No chimp in this cut (the director's call: it sat in caption band 1).
//
// CHECK LINE: "We got there first, but we're clumsy at it: the fire of civilization barely survives in our hands."
//
// THE LINE: "not because we were in any sense optimally adapted to it."
// WORD -> FRAME: not -2 · because 5 · we 12 · were 19 · in 22 · any 25 · sense 29 · optimally 35 · adapted 49 · to 56 ·
//   it 67 (Whisper onsets from the composition start; may run ~0.2-0.4 s early)
// DURATION: the slot 19.353 -> 22.397 s (sequence frames 464-537) = 3.044 s x 23.976 = 73 frames (f0..f72).
//
// THE PICTURE: B's resolved world, closer: the human on his step behind the row of lit stone lamp bowls (the threshold of
// civilization), his campfire burning full, the first dashed orange species on the step above (pushed out of frame by f20).
// THE MOTION (one continuous push-in and crane down, f0 -> f64, then a creep, landing on a medium close of him and his fire):
//   f0-13   he already holds a big leafy bough, far too big for the little fire; he crouches with it (f0-10) and lets it
//           drop onto the fire (released f10, lands LAND f13).
//   f13-34  the fire chokes under it (flames 1 -> ~0.2 by f19), grey smoke rolls up from under the leaves, the lamps
//           nearest him flicker and dim with it (the far ones barely); he jerks back, worried (f14-22), leans in again.
//   f34-56  "optimally adapted": he fans it frantically with his near hand and blows (mouth open), the fire sputters;
//           a flare licks his hand (FLARE f44-46): he yanks it up and shakes it, singed (f46-56), a wisp off his mitten.
//   f52-72  "to it": the fire just barely comes back to a small flame, the lamps steady again; he sits back on his
//           heels, relieved. Living hold: flicker, breathing, creep.
// Cause before effect: the bough lands (f13) -> the flames shrink (f14) -> smoke and the lamps dim; the flare (f44) ->
// the hand jerks (f45); the fire comes back -> the lamps steady.
// Colour: orange = intelligence only (the dashed species). The fire and lamps are B's cream (FIRE_COL), the smoke a muted
// warm grey, the bough timber umber with muted olive leaves; nobody is orange. No text.
//
// CAMERA: stairCam specs about a point between him and the fire (SPEC_OPEN -> SPEC_END, one designed lobe, ln px/m):
// pushes in from B's height (150 px/m) to a medium close (400 px/m, him ~450-480 px crouched, face y ~640-690, the lamp
// row y ~1025, the lamps either side of him and the fire) while the eye cranes down to just above his step; plus the
// house sway on the crop (as B). Checked per frame by scripts/clips/rsi-stupidest-species/check-not-optimally-adapted.ts
// (his head in the keep-in box and out of the bands, the zoom's one lobe, the fire, lamps and smoke in the box, the
// dashed species fully out of frame from f20).
//
// SOURCES: none (no figures on screen).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { AIR, AirShadow, AirStage, WorldSvg, airRamp, mixHex, rgbHex, swayCam, type AirWorld, type P2 } from "../kits/dwarkesh-3d/dwarkesh3d";
import * as Covid from "../kyle-covid/covidFolk";
import { Campfire, DashedSpecies, HeadGlow, LAMPS, Lamp, LightPool, Stairs, U, inFront, speciesOf, stairCam, stairsAirOf, stepAnchor, stepOf, type StairCam } from "./stupidestStairs";
import { FIRE_AT, FIRE_SIZE, HEAD_GLOW, HUMAN_AT, LAMP_XS, moteView } from "./StupidestPossibleSpecies";

export const FPS = 24000 / 1001;
export const DURATION = 73;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const c01 = (x: number) => Math.max(0, Math.min(1, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerp2 = (a: P2, b: P2, t: number): P2 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
const sst = (a: number, b: number, f: number) => {
  const u = c01((f - a) / (b - a));
  return u * u * (3 - 2 * u);
};
const m = (v: number) => v * U;

// ---- the beats ------------------------------------------------------------------------------------------------------
export const CROUCH = { a: 0, b: 10 };
/** the bough: let go on RELEASE, lands on the fire on LAND */
export const BOUGH_T = { release: 10, land: 13 };
export const RECOIL = { a: 14, b: 21, back: [25, 33] as [number, number] };
export const FAN = { a: 33, b: 45, period: 4 };
export const FLARE = { a: 43, peak: 45, b: 50 };
export const SHAKE = { a: 45, up: 48, b: 56 };
export const SITBACK = { a: 55, b: 66 };

// ---- the fire: full, choked under the bough, sputtering, a flare, then barely back ----------------------------------
export const fireAt = (f: number) => {
  let t = 1;
  if (f >= BOUGH_T.land) t = lerp(1, 0.22, Math.pow(sst(BOUGH_T.land, BOUGH_T.land + 6, f), 0.8));
  // sputter while it is choked (two incommensurate sines), a little livelier while he fans
  const sp = sst(BOUGH_T.land + 4, BOUGH_T.land + 8, f) * (1 - sst(54, 62, f));
  t += sp * (0.05 * Math.sin(f * 1.7) + 0.04 * Math.sin(f * 0.93 + 1.3) + 0.08 * sst(FAN.a, FAN.a + 6, f) * Math.max(0, Math.sin(f * 1.26)));
  // the flare that licks his hand
  t += 0.55 * sst(FLARE.a, FLARE.peak, f) * (1 - sst(FLARE.peak + 1, FLARE.b, f));
  // it just barely comes back to a small flame
  t += 0.22 * sst(50, 64, f);
  return Math.max(0.16, t);
};
/** how lit the lamps can be from the fire (0 = dark when choked, 1 = steady): 1 at the small recovered flame */
const fireNorm = (f: number) => c01((fireAt(f) - 0.2) / 0.2);

// ---- the camera ------------------------------------------------------------------------------------------------------
/** the anchor between him and the fire, at his chest (standing) -> lower (crouched) */
const ANCHOR = { X: (HUMAN_AT.X + FIRE_AT.X) / 2 + m(0.15), Z: HUMAN_AT.Z };
type Spec = { sx: number; sy: number; pxm: number; dist: number; eyeRight: number; eyeUp: number; hM: number };
export const SPEC_OPEN: Spec = { sx: 480, sy: 672, pxm: 150, dist: 8.5, eyeRight: -0.6, eyeUp: 1.2, hM: 1.05 };
export const SPEC_END: Spec = { sx: 605, sy: 740, pxm: 400, dist: 9.5, eyeRight: -1.2, eyeUp: -0.5, hM: 0.7 };
export const LOBE = { A: 1.0, B: 3.0, F0: -18, F1: 62 };
export const CREEP = 0.012;
/** the sideways reframe onto him and the fire lags the push (s^SX_LAG), so the dashed species on the step above leaves
 *  the frame's left edge early (gone by f20) */
export const SX_LAG = 2.2;
const N_INT = 1200;
const S_TAB = (() => {
  const tab = [0];
  const v = (i: number) => Math.pow(i / N_INT, LOBE.A) * Math.pow(1 - i / N_INT, LOBE.B);
  for (let i = 0; i < N_INT; i++) tab.push(tab[i] + (v(i) + v(i + 1)) / 2);
  return tab.map((q) => q / tab[N_INT]);
})();
const sRaw = (f: number) => {
  const x = ((f - LOBE.F0) / (LOBE.F1 - LOBE.F0)) * N_INT;
  if (x <= 0) return 0;
  if (x >= N_INT) return 1;
  const i = Math.floor(x);
  return S_TAB[i] + (S_TAB[i + 1] - S_TAB[i]) * (x - i);
};
const S0 = sRaw(0);
export const moveS = (f: number) => (sRaw(f) - S0) / (1 - S0);
export const specAt = (f: number): Spec => {
  const s = moveS(f);
  const u = Math.max(0, (f - 40) / (DURATION - 1 - 40));
  const P = SPEC_OPEN;
  const Q = SPEC_END;
  return {
    sx: lerp(P.sx, Q.sx, Math.pow(s, SX_LAG)),
    sy: lerp(P.sy, Q.sy, s),
    pxm: Math.exp(lerp(Math.log(P.pxm), Math.log(Q.pxm), s) + CREEP * u * u),
    dist: lerp(P.dist, Q.dist, s),
    eyeRight: lerp(P.eyeRight, Q.eyeRight, s),
    eyeUp: lerp(P.eyeUp, Q.eyeUp, s),
    hM: lerp(P.hM, Q.hM, s),
  };
};
export const camTrack = (f: number): StairCam => {
  const s = specAt(f);
  return stairCam({ X: ANCHOR.X, Y: HUMAN_AT.Y - m(s.hM), Z: ANCHOR.Z, sx: s.sx, sy: s.sy, pxm: s.pxm, dist: s.dist, eyeRight: s.eyeRight, eyeUp: s.eyeUp });
};
export const camOf = (f: number): StairCam => {
  const c = camTrack(f);
  const w = swayCam(c, f);
  return { ...c, cx: w.cx, cy: w.cy };
};
const REST = camOf(0);

// ---- the human ------------------------------------------------------------------------------------------------------
const HUMAN_KIND: Covid.CovidKind = "commuter";
/** standing turned to his fire (B's last stance), the bough held across in front of him in both fists */
const holdStand = (): Covid.CovidPose => ({
  ...Covid.POSES.turnTo(0.55),
  headYaw: 0.5,
  pitch: 12,
  look: [0.5, 0.45],
  armL: { w: [74, -150], elbow: [-0.3, 1], fist: 0.9, hand: 10 },
  armR: { w: [100, -158], elbow: [-0.1, 1], fist: 0.9, hand: 10 },
});
/** squatting facing the fire (B's crouch), the bough in both fists low over the fire */
const crouchBase = (): Covid.CovidPose => ({
  ...Covid.POSES.sit(1, 22),
  yaw: 0.86,
  headYaw: 0.75,
  lean: 20,
  pitch: 16,
  look: [0.55, 0.55],
  armL: { w: [100, -82], elbow: [-0.2, 1], fist: 0.9, hand: 0 },
  armR: { w: [116, -96], elbow: [-0.5, 0.8], fist: 0.9, hand: 0 },
});
/** the near hand's fanning stroke (wrist offset, hand angle) */
const fanStroke = (f: number) => {
  const ph = ((f - FAN.a) / FAN.period) * Math.PI * 2;
  return { dx: 10 * Math.sin(ph + 0.6), dy: 26 * Math.sin(ph), hand: 55 * Math.sin(ph + 0.4) };
};
export const humanPoseAt = (f: number): Covid.CovidPose => {
  const st = holdStand();
  const cr = crouchBase();
  let q = Covid.lerpPose(st, cr, sst(CROUCH.a, CROUCH.b, f));
  // let go: the fists open
  const open = sst(BOUGH_T.release - 1, BOUGH_T.release + 2, f);
  q = { ...q, armL: { ...q.armL, fist: lerp(q.armL.fist, 0.05, open), hand: q.armL.hand + 20 * open }, armR: { ...q.armR, fist: lerp(q.armR.fist, 0.05, open), hand: q.armR.hand + 20 * open } };
  // the recoil from the smoke: back, hands up, worried; then in again to fan
  const rec = sst(RECOIL.a, RECOIL.b, f) * (1 - sst(RECOIL.back[0], RECOIL.back[1], f));
  const worry = sst(RECOIL.a, RECOIL.b, f) * (1 - sst(SITBACK.a, SITBACK.b, f));
  q = {
    ...q,
    lean: q.lean - 16 * rec,
    pitch: q.pitch - 10 * rec,
    worry,
    open: 0.35 * rec,
    look: [lerp(q.look?.[0] ?? 0, 0.45, rec), lerp(q.look?.[1] ?? 0, 0.1, rec)],
    armL: { ...q.armL, w: lerp2(q.armL.w, [64, -150], rec), hand: q.armL.hand + 20 * rec },
    armR: { ...q.armR, w: lerp2(q.armR.w, [86, -170], rec), hand: q.armR.hand + 20 * rec },
  };
  // fanning (the near hand, armL) and blowing (leaning in, mouth open), from FAN.a until the flare
  const fan = sst(FAN.a, FAN.a + 3, f) * (1 - sst(SHAKE.a, SHAKE.a + 2, f));
  if (fan > 0) {
    const s = fanStroke(f);
    q = {
      ...q,
      lean: q.lean + 8 * fan,
      pitch: q.pitch + 4 * fan,
      open: Math.max(q.open ?? 0, 0.6 * fan * (0.75 + 0.25 * Math.sin(f * 0.9))),
      look: lerp2(q.look ?? [0, 0], [0.6, 0.6], fan),
      armL: { ...q.armL, w: lerp2(q.armL.w, [112 + s.dx, -74 + s.dy], fan), elbow: [0.2, 1], fist: lerp(q.armL.fist, 0, fan), hand: lerp(q.armL.hand, -10 + s.hand, fan) },
      armR: { ...q.armR, w: lerp2(q.armR.w, [70, -86], fan), fist: lerp(q.armR.fist, 0.3, fan) },
    };
  }
  // singed: the near hand jerks up by his shoulder and shakes, he leans back a little, mouth "ow"
  const sh = sst(SHAKE.a, SHAKE.up, f) * (1 - sst(SHAKE.b - 3, SHAKE.b + 2, f));
  if (sh > 0) {
    const jig = sst(SHAKE.up - 1, SHAKE.up + 1, f) * (1 - sst(SHAKE.b - 4, SHAKE.b, f));
    const shake = jig * Math.sin(f * 2.6);
    q = {
      ...q,
      lean: q.lean - 10 * sh,
      pitch: q.pitch - 6 * sh,
      open: Math.max(q.open ?? 0, 0.45 * sh),
      worry: 1,
      look: lerp2(q.look ?? [0, 0], [0.35, -0.2], sh),
      armL: { ...q.armL, w: lerp2(q.armL.w, [70 + 10 * shake, -196 + 4 * shake], sh), fist: lerp(q.armL.fist, 0, sh), hand: q.armL.hand + 30 * shake * sh },
    };
  }
  // sitting back on his heels, relieved: leaning back, hands to his knees, a small smile, eyes on the little flame
  const sb = sst(SITBACK.a, SITBACK.b, f);
  if (sb > 0) {
    q = {
      ...q,
      lean: lerp(q.lean, -6, sb),
      pitch: lerp(q.pitch, 6, sb),
      open: lerp(q.open ?? 0, 0, sb),
      mouth: lerp(q.mouth, 0.55, sb),
      lids: lerp(q.lids, 0.3, sb),
      look: lerp2(q.look ?? [0, 0], [0.55, 0.4], sb),
      armL: { ...q.armL, w: lerp2(q.armL.w, [62, -92], sb), fist: lerp(q.armL.fist, 0.3, sb), hand: lerp(q.armL.hand, 20, sb) },
      armR: { ...q.armR, w: lerp2(q.armR.w, [74, -88], sb), fist: lerp(q.armR.fist, 0.3, sb), hand: lerp(q.armR.hand, 20, sb) },
    };
  }
  return Covid.breathe(q, f);
};
/** keep his feet planted: shift his standing point by the ankles' drift from the f0 stance */
const ANKLE0 = (() => {
  const a = Covid.covidAnchors(HUMAN_KIND, holdStand(), [0, 0], 1);
  return (a.ankleL[0] + a.ankleR[0]) / 2;
})();
export const humanX = (f: number) => {
  const a = Covid.covidAnchors(HUMAN_KIND, humanPoseAt(f), [0, 0], 1);
  return HUMAN_AT.X - ((a.ankleL[0] + a.ankleR[0]) / 2 - ANKLE0);
};
/** the human's anchors this frame (world px) */
export const humanAnchorsAt = (A: AirWorld, f: number) => {
  const at = A.P.p(humanX(f), HUMAN_AT.Y, HUMAN_AT.Z);
  return Covid.covidAnchors(HUMAN_KIND, humanPoseAt(f), at, A.P.r(HUMAN_AT.Z));
};

// ---- the bough: far too big for the fire ----------------------------------------------------------------------------
// Local metres: u along the limb (butt -0.85 .. tip 1.05), v up from it. Held at GRIP_U between his fists; let go on
// RELEASE it falls onto the fire (LAND), its butt on the tread by his feet, the leafy crown propped up over the fire.
const GRIP_U = -0.42;
const LIMB: [number, number, number][] = [
  // u, v, radius (m)
  [-0.85, 0.0, 0.075],
  [-0.4, 0.02, 0.066],
  [0.05, 0.0, 0.055],
  [0.5, 0.04, 0.04],
  [1.0, 0.0, 0.02],
];
const FORKS: [number, number][][] = [
  [
    [0.2, 0.01],
    [0.48, 0.2],
    [0.72, 0.36],
  ],
  [
    [0.42, 0.03],
    [0.66, -0.12],
    [0.9, -0.24],
  ],
  [
    [0.62, 0.04],
    [0.82, 0.14],
  ],
];
/** leaf clusters: centre (u, v), radius (m), seed */
const LEAVES: [number, number, number, number][] = [
  [1.04, 0.02, 0.19, 1],
  [0.74, 0.39, 0.17, 2],
  [0.93, -0.27, 0.16, 3],
  [0.84, 0.16, 0.15, 4],
  [0.5, 0.22, 0.12, 5],
  [0.6, -0.12, 0.11, 6],
];
const LEAF = { lit: "#9C9D6C", mid: "#7A7F55", dark: "#545A3C" };
const BARK = { lit: "#7A6248", mid: "#5A4634", dark: "#3A2C20" };
/** the bough's placement: grip point (world px, 2D), angle (rad, + = tip up), scale (world px per m) */
type Place = { g: P2; ang: number; s: number; Z: number };
const restPlace = (A: AirWorld): Place => {
  // the butt on the tread 0.62 m left of the fire's centre, 0.05 m nearer; propped up 26 deg over the kindling
  const Z = FIRE_AT.Z - m(0.05);
  const ang = (26 * Math.PI) / 180;
  const s = m(1) * A.P.r(Z);
  const butt = A.P.p(FIRE_AT.X - m(0.62), FIRE_AT.Y - m(0.07), Z);
  const du = GRIP_U - LIMB[0][0];
  return { g: [butt[0] + Math.cos(ang) * du * s, butt[1] - Math.sin(ang) * du * s], ang, s, Z };
};
const heldPlace = (A: AirWorld, f: number): Place => {
  const an = humanAnchorsAt(A, f);
  const g: P2 = [(an.mittenL[0] + an.mittenR[0]) / 2, (an.mittenL[1] + an.mittenR[1]) / 2];
  const Z = HUMAN_AT.Z;
  return { g, ang: lerp(0.14, 0.05, sst(CROUCH.a, CROUCH.b, f)), s: m(1) * A.P.r(Z), Z };
};
export const boughPlace = (A: AirWorld, f: number): Place => {
  if (f <= BOUGH_T.release) return heldPlace(A, f);
  const h = heldPlace(A, BOUGH_T.release);
  const r = restPlace(A);
  // the fall: gravity (ease in) to the landing, a small bounce-settle after
  const u = c01((f - BOUGH_T.release) / (BOUGH_T.land - BOUGH_T.release));
  const fall = u * u;
  const settle = f > BOUGH_T.land ? 0.04 * Math.sin(((f - BOUGH_T.land) / 4) * Math.PI) * (1 - sst(BOUGH_T.land, BOUGH_T.land + 4, f)) : 0;
  return { g: lerp2(h.g, r.g, fall), ang: lerp(h.ang, r.ang, fall) - settle, s: lerp(h.s, r.s, fall), Z: lerp(h.Z, r.Z, fall) };
};
const Bough: React.FC<{ A: AirWorld; pl: Place; frame: number; char: number }> = ({ A, pl, frame, char }) => {
  const { g, ang, s } = pl;
  const ca = Math.cos(ang);
  const sa = Math.sin(ang);
  const W = (u: number, v: number): P2 => {
    const du = u - GRIP_U;
    return [g[0] + (du * ca - v * sa) * s, g[1] - (du * sa + v * ca) * s];
  };
  const tone = (hex: string) => A.tone(hex, pl.Z, -FIRE_AT.Y);
  // the limb as a tapered ribbon
  const top: P2[] = [];
  const bot: P2[] = [];
  for (const [u, v, r] of LIMB) {
    top.push(W(u, v + r));
    bot.push(W(u, v - r));
  }
  const limbD = `M${[...top, ...bot.reverse()].map((p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join("L")}Z`;
  const lw = 0.035 * s;
  const sway = 0.012 * Math.sin(frame * 0.5);
  return (
    <g>
      {FORKS.map((fk, k) => (
        <path key={`fk${k}`} d={`M${fk.map(([u, v]) => W(u, v)).map((p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join("L")}`} stroke={tone(mixHex(BARK.mid, BARK.dark, char))} strokeWidth={lw * (k === 2 ? 0.7 : 1)} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      ))}
      <path d={limbD} fill={tone(mixHex(BARK.mid, BARK.dark, char))} />
      <path d={`M${top.map((p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join("L")}`} stroke={tone(BARK.lit)} strokeWidth={lw * 0.45} strokeLinecap="round" fill="none" strokeOpacity={0.8} />
      {LEAVES.map(([u, v, r, sd]) => {
        const c = W(u, v + sway * sd);
        const R = r * s;
        // a cluster: three overlapping leaf ovals (dark, mid, a lit one upper left)
        return (
          <g key={`lf${sd}`}>
            <ellipse cx={c[0] + 0.25 * R} cy={c[1] + 0.15 * R} rx={R * 0.95} ry={R * 0.62} fill={tone(mixHex(LEAF.dark, BARK.dark, 0.3 * char))} transform={`rotate(${(-20 + sd * 23) % 50} ${c[0].toFixed(2)} ${c[1].toFixed(2)})`} />
            <ellipse cx={c[0]} cy={c[1]} rx={R * 0.8} ry={R * 0.55} fill={tone(mixHex(LEAF.mid, BARK.mid, 0.3 * char))} transform={`rotate(${(15 - sd * 17) % 45} ${c[0].toFixed(2)} ${c[1].toFixed(2)})`} />
            <ellipse cx={c[0] - 0.3 * R} cy={c[1] - 0.25 * R} rx={R * 0.42} ry={R * 0.28} fill={tone(LEAF.lit)} fillOpacity={0.85} transform={`rotate(-25 ${c[0].toFixed(2)} ${c[1].toFixed(2)})`} />
          </g>
        );
      })}
    </g>
  );
};

// ---- the smoke: puffs rolling up from under the bough while the fire chokes; a wisp off his singed mitten ----------
type Puff = { f0: number; life: number; u0: number; drift: number; rise: number; r0: number; r1: number; a: number; seed: number };
/** puffs born at the fire while it is choked (denser at the choke and while he fans), each rising, growing, thinning */
export const PUFFS: Puff[] = (() => {
  const out: Puff[] = [];
  const births = [14, 15.5, 17, 18.5, 20, 22, 24.5, 27, 30, 33, 35, 36.5, 38, 39.5, 41, 42.5, 47, 50, 53, 57];
  births.forEach((f0, k) => {
    const h = (n: number) => (Math.sin(k * 12.9898 + n * 78.233) * 43758.5453) % 1;
    const r = (n: number) => Math.abs(h(n));
    const late = f0 > 46 ? 0.55 : 1;
    out.push({ f0, life: 20 + 8 * r(1), u0: -0.15 + 0.5 * r(2), drift: 0.3 + 0.4 * r(3) + (f0 >= 34 && f0 < 45 ? 0.3 : 0), rise: 1.05 + 0.5 * r(4), r0: 0.14 + 0.06 * r(5), r1: (0.45 + 0.2 * r(6)) * late, a: (0.8 + 0.15 * r(7)) * late, seed: k });
  });
  return out;
})();
const SMOKE = { lit: "#C9C1B2", mid: "#8E867A", dark: "#655E56" };
const Smoke: React.FC<{ A: AirWorld; frame: number; uid: string }> = ({ A, frame, uid }) => {
  const els: React.ReactNode[] = [];
  const Z = FIRE_AT.Z;
  const r1 = m(1) * A.P.r(Z);
  PUFFS.forEach((p, k) => {
    const t = (frame - p.f0) / p.life;
    if (t <= 0 || t >= 1) return;
    const e = 1 - Math.pow(1 - t, 1.6);
    const X = FIRE_AT.X + m(p.u0 + p.drift * e + 0.06 * Math.sin(frame * 0.3 + p.seed));
    const Y = FIRE_AT.Y - m(0.3 + p.rise * e);
    const c = A.P.p(X, Y, Z);
    const R = (p.r0 + (p.r1 - p.r0) * Math.pow(t, 0.6)) * r1;
    const a = p.a * sst(0, 0.12, t) * (1 - sst(0.35, 1, t));
    els.push(
      <g key={k}>
        <circle cx={c[0]} cy={c[1]} r={R} fill={`url(#${uid}sm)`} opacity={a} />
        <circle cx={c[0] - 0.28 * R} cy={c[1] - 0.3 * R} r={R * 0.55} fill={`url(#${uid}sl)`} opacity={a * 0.8} />
      </g>,
    );
  });
  return (
    <g>
      <defs>
        <radialGradient id={`${uid}sm`}>
          <stop offset="0" stopColor={A.tone(SMOKE.mid, Z)} stopOpacity={0.95} />
          <stop offset="0.6" stopColor={A.tone(SMOKE.dark, Z)} stopOpacity={0.6} />
          <stop offset="1" stopColor={A.tone(SMOKE.dark, Z)} stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${uid}sl`}>
          <stop offset="0" stopColor={A.tone(SMOKE.lit, Z)} stopOpacity={0.8} />
          <stop offset="1" stopColor={A.tone(SMOKE.lit, Z)} stopOpacity={0} />
        </radialGradient>
      </defs>
      {els}
    </g>
  );
};
/** the singe: a few small wisps curling up off his near mitten after the flare */
const Singe: React.FC<{ A: AirWorld; frame: number; uid: string }> = ({ A, frame, uid }) => {
  const els: React.ReactNode[] = [];
  const r = A.P.r(HUMAN_AT.Z);
  [FLARE.peak + 1, FLARE.peak + 4, FLARE.peak + 7].forEach((f0, k) => {
    const t = (frame - f0) / 12;
    if (t <= 0 || t >= 1) return;
    const src = humanAnchorsAt(A, f0).mittenL;
    const c: P2 = [src[0] + m(0.05) * r * Math.sin(t * 5 + k), src[1] - m(0.45) * r * t];
    const R = m(0.04 + 0.08 * t) * r;
    els.push(<circle key={k} cx={c[0]} cy={c[1]} r={R} fill={`url(#${uid}sg)`} opacity={0.7 * sst(0, 0.15, t) * (1 - sst(0.4, 1, t))} />);
  });
  return (
    <g>
      <defs>
        <radialGradient id={`${uid}sg`}>
          <stop offset="0" stopColor={A.tone(SMOKE.lit, HUMAN_AT.Z)} stopOpacity={0.9} />
          <stop offset="1" stopColor={A.tone(SMOKE.mid, HUMAN_AT.Z)} stopOpacity={0} />
        </radialGradient>
      </defs>
      {els}
    </g>
  );
};

/** his blowing: small pale breaths from his mouth toward the embers while he fans (FAN.a .. the flare) */
export const BREATHS = [35, 38.5, 42];
/** the sigh of relief once the little flame holds */
export const SIGH = 61;
const Breath: React.FC<{ A: AirWorld; frame: number; uid: string }> = ({ A, frame, uid }) => {
  const els: React.ReactNode[] = [];
  const r = A.P.r(HUMAN_AT.Z);
  const fire = A.P.p(FIRE_AT.X - m(0.1), FIRE_AT.Y - m(0.35), FIRE_AT.Z);
  BREATHS.forEach((f0, k) => {
    const t = (frame - f0) / 7;
    if (t <= 0 || t >= 1) return;
    const an = humanAnchorsAt(A, Math.floor(f0));
    const mouth: P2 = [an.headC[0] + 0.55 * an.headR, an.headC[1] + 0.45 * an.headR];
    const c = lerp2(mouth, fire, 0.15 + 0.75 * t);
    const R = m(0.035 + 0.06 * t) * r;
    els.push(<ellipse key={k} cx={c[0]} cy={c[1]} rx={R * 1.6} ry={R} fill={`url(#${uid}br)`} opacity={0.75 * sst(0, 0.2, t) * (1 - sst(0.5, 1, t))} transform={`rotate(25 ${c[0].toFixed(2)} ${c[1].toFixed(2)})`} />);
  });
  // the sigh: one soft breath out and up, away from the fire
  const ts = (frame - SIGH) / 12;
  if (ts > 0 && ts < 1) {
    const an = humanAnchorsAt(A, SIGH);
    const c: P2 = [an.headC[0] + 0.5 * an.headR + m(0.12) * r * ts, an.headC[1] + 0.4 * an.headR - m(0.25) * r * ts];
    const R = m(0.04 + 0.07 * ts) * r;
    els.push(<ellipse key="sigh" cx={c[0]} cy={c[1]} rx={R * 1.5} ry={R} fill={`url(#${uid}br)`} opacity={0.8 * sst(0, 0.2, ts) * (1 - sst(0.45, 1, ts))} transform={`rotate(-30 ${c[0].toFixed(2)} ${c[1].toFixed(2)})`} />);
  }
  return (
    <g>
      <defs>
        <radialGradient id={`${uid}br`}>
          <stop offset="0" stopColor={FIRE_BREATH} stopOpacity={0.95} />
          <stop offset="1" stopColor={FIRE_BREATH} stopOpacity={0} />
        </radialGradient>
      </defs>
      {els}
    </g>
  );
};
const FIRE_BREATH = "#EFE9DC";

// ---- the lamps: the nearest flicker and dim with his fire, the far ones barely ----------------------------------------
/** each lamp's coupling to his fire: 1 next to it, falling off with distance (m) */
export const LAMP_COUPLE = { fall: 1.25, flicker: 0.28 };
export const lampBright = (k: number, f: number) => {
  const d = Math.abs(LAMP_XS[k] - FIRE_AT.X) / U;
  const w = Math.exp(-(d - 0.6) / LAMP_COUPLE.fall);
  const lack = 1 - fireNorm(f);
  const fl = LAMP_COUPLE.flicker * lack * (0.5 + 0.5 * Math.sin(f * 1.9 + k * 2.1)) * Math.sin(f * 0.77 + k);
  return c01(1 - Math.min(1, w) * (lack * 0.85 + fl));
};
const DimLampRow: React.FC<{ A: AirWorld; frame: number; uid: string }> = ({ A, frame, uid }) => {
  const s = stepOf(LAMPS.step);
  const Z = s.Z0 + m(LAMPS.back);
  if (!inFront(A, Z)) return null;
  return (
    <g>
      {LAMP_XS.map((x, k) => {
        const b = lampBright(k, frame);
        const seed = k * 1.37 + 0.4;
        return (
          <g key={k}>
            {b < 0.999 ? <Lamp A={A} X={x} Y={s.Y} Z={Z} lit={0} frame={frame} uid={`${uid}c${k}`} seed={seed} /> : null}
            <g opacity={b}>
              <Lamp A={A} X={x} Y={s.Y} Z={Z} lit={1} frame={frame} uid={`${uid}l${k}`} seed={seed} />
            </g>
          </g>
        );
      })}
    </g>
  );
};

// ---- the scene --------------------------------------------------------------------------------------------------------
const HumanFig: React.FC<{ A: AirWorld; frame: number }> = ({ A, frame }) => {
  const X = humanX(frame);
  const at = A.P.p(X, HUMAN_AT.Y, HUMAN_AT.Z);
  const scale = A.P.r(HUMAN_AT.Z);
  const pose = humanPoseAt(frame);
  const fog = A.folkFog(HUMAN_AT.Z, -HUMAN_AT.Y);
  const an = Covid.covidAnchors(HUMAN_KIND, pose, at, scale);
  return (
    <g>
      <AirShadow A={A} X={X} Z={HUMAN_AT.Z} Y={HUMAN_AT.Y} w={62} d={30} uid="noaHs" amt={0.8} />
      <HeadGlow c={an.headC} rW={an.headR} amt={HEAD_GLOW.human} uid="noaHg" />
      <Covid.CovidFigure kind={HUMAN_KIND} variant={0} pose={pose} at={at} scale={scale} uid="noaHuman" fog={{ rgb: fog.rgb, amount: fog.amount }} unitPx={A.k} frame={frame} />
    </g>
  );
};

/** the lower frame sinks into the dense low air (the style: a big flat face in the bottom third reads as dead space):
 *  a soft screen-row gradient over the steps below his, from LOW_FADE.from to the bottom edge */
export const LOW_FADE = { from: 1180, to: 1920, amt: 0.62, t: 0.4 };
const LowFade: React.FC<{ A: AirWorld; uid: string }> = ({ A, uid }) => {
  const c = A.cam;
  const wy = (sy: number) => c.cy + (sy - 960) / c.k;
  const x0 = c.cx - 600 / c.k;
  const col = rgbHex(airRamp("A", LOW_FADE.t));
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}lf`} gradientUnits="userSpaceOnUse" x1="0" y1={wy(LOW_FADE.from).toFixed(2)} x2="0" y2={wy(LOW_FADE.to).toFixed(2)}>
          {[0, 0.25, 0.5, 0.75, 1].map((q) => (
            <stop key={q} offset={q} stopColor={col} stopOpacity={(LOW_FADE.amt * q * q * (3 - 2 * q)).toFixed(3)} />
          ))}
        </linearGradient>
      </defs>
      <rect x={x0.toFixed(2)} y={wy(LOW_FADE.from).toFixed(2)} width={(1200 / c.k).toFixed(2)} height={((LOW_FADE.to - LOW_FADE.from + 20) / c.k).toFixed(2)} fill={`url(#${uid}lf)`} />
    </g>
  );
};

const NotOptimallyAdapted: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const cam = camOf(frame);
  const A = stairsAirOf({ cam, rest: REST, frame });
  const fire = fireAt(frame);
  const fn = fireNorm(frame);
  const pl = boughPlace(A, frame);
  const char = 0.5 * sst(BOUGH_T.land, 40, frame);
  const onStep = (i: number): React.ReactNode => {
    if (i >= 1) {
      if (!inFront(A, stepAnchor(i).Z)) return null;
      const sp = speciesOf(i);
      return <DashedSpecies A={A} at={stepAnchor(i)} H={sp.H} headR={sp.headR} glow={sp.glow} a={sp.a} frame={frame} uid={`noaQ${i}`} seed={i} shape={sp.shape} brain={sp.brain} />;
    }
    if (i === 0 && inFront(A, stepOf(0).Z0)) {
      const s0 = stepOf(0);
      const held = frame <= BOUGH_T.release;
      return (
        <g>
          <LightPool A={A} X={HUMAN_AT.X + m(0.2)} Y={s0.Y} Z={HUMAN_AT.Z} rM={1.25} a={0.32 * (0.35 + 0.65 * Math.min(1, fn))} uid="noaPool" col={AIR.A.cream} />
          <Campfire A={A} X={FIRE_AT.X} Y={FIRE_AT.Y} Z={FIRE_AT.Z} t={fire} frame={frame} uid="noaFire" size={FIRE_SIZE} />
          {held ? null : <Bough A={A} pl={pl} frame={frame} char={char} />}
          <HumanFig A={A} frame={frame} />
          {held ? <Bough A={A} pl={pl} frame={frame} char={0} /> : null}
          <Smoke A={A} frame={frame} uid="noaSmoke" />
          <Singe A={A} frame={frame} uid="noaSinge" />
          <Breath A={A} frame={frame} uid="noaBreath" />
          <DimLampRow A={A} frame={frame} uid="noaLamp" />
        </g>
      );
    }
    return null;
  };
  return (
    <AirStage v={moteView(A.v)} bloom={0.22}>
      <WorldSvg cam={cam}>
        <Stairs A={A} onStep={onStep} uid="noaSt" />
        <LowFade A={A} uid="noaLow" />
      </WorldSvg>
    </AirStage>
  );
};

export default NotOptimallyAdapted;
