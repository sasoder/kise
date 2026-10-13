// ---------------------------------------------------------------------------
// FourForOne (file 62_FourForOne; Dwarkesh Patel with Si Sheppard, "Capture,
// not kill"). Dwarkesh map style, "beyond maps" umber page; the cast is
// captureFigures (Totonac and Chichimec captives, cream). Opaque 1080x1920,
// 23.976 fps.
//
// CHECK LINE: "On the Aztecs' scale, four Totonac captives weighed the same as
// one Chichimec, because the Chichimec fought harder."
//
// THE LINE: "like that four Totonacs were worth one Chichimec, because the
// Chichimec were a wilder tribe to the north and fought more fiercely than the
// Totonacs did."
// WORD -> FRAME: that 3 · four 6 · Totonacs 12 · were 23 · worth 27 · one 31 ·
//   Chichimec 36 · because 47 · the 51 · Chichimec 54 · were 64 · a 68 ·
//   wilder 75 · tribe 86 · to the 93 · north 99 · and 104 · fought 107 ·
//   more 111 · fiercely 116 · than 124 · the 128 · Totonacs 130 · did 139.
// DURATION: the sequence runs 62.020-68.110 s = 6.090 s x 23.976 = 146 frames
//   (f0..f145); it cuts back to the speaker at f146.
//
// THE MOTION (one move): an ORANGE beam balance (the Aztecs' valuation) lies
// unhoisted, both pans on the ground; one Chichimec captive stands bound on the
// right pan, three Totonacs on the left and the fourth walks onto it. The haul
// rope takes the beam up its post, the hang-ropes go taut and both pans leave
// the ground together and hang LEVEL (by f40): four against one. Then the
// camera pushes in on the Chichimec (close from f68) while he heaves against his
// bonds (a deep crouch, then a wrench up and back; peaks on "wilder" f75 and
// "fiercely" f116): his pan dips and swings, the beam rocks and comes level
// again, and the four Totonacs ride it. On "than the Totonacs did" the camera
// pulls back to the whole level balance (easing into the settle by f142). Text: TOTONACS, CHICHIMEC.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { DARK, INK, hash, smoothstep } from "./incaShared";
import { CAST_SPECS, Chichimec, ORANGE, POSES, Rope, Totonac, mirrorPose, walkLegs } from "./captureFigures";
import { lerpFig, type ArmPose, type FigPose, type Ink } from "./texcocoFigures";
import { FPS, Label, TexcocoPage, WALK, WorldSvg, idle, makeCamera, poseTrack, track, type P2 } from "./texcocoShared";

export { FPS };
export const DURATION = 146;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// ---------------------------------------------------------------------------
// LAYOUT (world px; the camera opens near k = 1, so world ~ screen)
// ---------------------------------------------------------------------------
/** the post */
const PX = 540;
const GROUND = 1292;
const POST_TOP = 286;
/** the beam: half-length to the hooks; its pivot's height once hoisted */
const ARM = 258;
const BEAM_UP = 436;
/** the pans: half-width, thickness; the hook hangs HOOK under the beam's axis; ROPE_H = hook to the pan's deck */
const PAN_HW = 222;
const PAN_T = 24;
const HOOK = 30;
const ROPE_H = 710;
const TIE: P2 = [PAN_HW - 11, -7];
const ROPE_LEN = Math.hypot(TIE[0], ROPE_H + TIE[1]);
/** the deck's height on the ground and hoisted */
const DECK_DOWN = GROUND - PAN_T;
const DECK_UP = BEAM_UP + HOOK + ROPE_H;
const LIFT = DECK_DOWN - DECK_UP;
/** how far the beam rises before the ropes are taut */
const SLACK = 40;
const BEAM_DOWN = BEAM_UP + LIFT + SLACK;

/** px per figure unit */
const SC_T = 1.26;
const SC_C = 1.34;
/** the men stand this far into the deck's top line (the sole) */
const SOLE = 3;
/** the Totonacs' places on the left pan (offsets from its middle); 0 = the one who walks on */
const SLOT = [-165, -55, 55, 165];

// ---------------------------------------------------------------------------
// TIMING
// ---------------------------------------------------------------------------
const T = { label1: 3, label2: 27, haul: 9, taut: 27, up: 39, settled: 48, drift: 46 };
/** the beam's pivot: it takes up the slack, lifts, one small overshoot, settles */
const beamY = track([
  [T.haul, BEAM_DOWN],
  [T.taut, BEAM_DOWN - SLACK],
  [T.up, BEAM_UP - 5],
  [T.settled, BEAM_UP],
]);

// ---- the Chichimec's heaves: [the frame the wrench peaks on, its strength]. Two great ones, on "wilder" and "fiercely"; a first tug before them
const HEAVES: [number, number][] = [
  [54, 0.42],
  [75, 1],
  [116, 1],
];
/** what the deck feels: his legs drive down through the wrench; it peaks just after the pose does */
const KICK_LAG = 1;
const KICK_HALF = 8;
const kick = (f: number) =>
  HEAVES.reduce((s, [c, a]) => {
    const u = Math.abs(f - c - KICK_LAG) / KICK_HALF;
    return u >= 1 ? s : s + a * Math.cos((Math.PI / 2) * u) ** 2;
  }, 0);

// ---------------------------------------------------------------------------
// THE SCALE'S MOTION, integrated once (a table per frame): the beam's rock
// (theta, deg, + = the right end down) and each pan's swing on its ropes (phi,
// deg, + = swung to screen right) are damped pendulums driven by the
// Chichimec's heaves, so they always move AFTER he does.
// ---------------------------------------------------------------------------
const SUB = 8;
const SIM = (() => {
  const theta: number[] = [];
  const phiR: number[] = [];
  const phiL: number[] = [];
  let th = 0;
  let thV = 0;
  let pr = 0;
  let prV = 0;
  let pl = 0;
  let plV = 0;
  // the beam is stiff and well damped (level again ~12 frames after a heave); the pans swing on, slower
  const wT = (2 * Math.PI) / 15;
  const zT = 0.62;
  const wR = (2 * Math.PI) / 34;
  const zR = 0.3;
  const wL = (2 * Math.PI) / 40;
  const zL = 0.32;
  const hist: number[] = [];
  for (let i = 0; i <= (DURATION + 2) * SUB; i++) {
    const f = i / SUB;
    if (i % SUB === 0) {
      theta.push(th);
      phiR.push(pr);
      phiL.push(pl);
    }
    const kk = kick(f);
    // his end dips; he throws himself back (to screen right), so the deck is kicked the other way first
    const thT = 2.5 * kk;
    const prT = -1.7 * kk;
    hist.push(pr);
    const plT = -0.55 * (hist[Math.max(0, i - 5 * SUB)] ?? 0) - 0.15 * th;
    const dt = 1 / SUB;
    thV += (wT * wT * (thT - th) - 2 * zT * wT * thV) * dt;
    th += thV * dt;
    prV += (wR * wR * (prT - pr) - 2 * zR * wR * prV) * dt;
    pr += prV * dt;
    plV += (wL * wL * (plT - pl) - 2 * zL * wL * plV) * dt;
    pl += plV * dt;
  }
  return { theta, phiR, phiL };
})();
const tab = (a: number[], f: number) => {
  const x = Math.max(0, Math.min(a.length - 1.001, f));
  const i = Math.floor(x);
  return a[i] + (a[i + 1] - a[i]) * (x - i);
};
const rad = (d: number) => (d * Math.PI) / 180;
/** v turned by deg (svg's rotate: + = clockwise on screen) */
const turn = (v: P2, deg: number): P2 => {
  const c = Math.cos(rad(deg));
  const s = Math.sin(rad(deg));
  return [v[0] * c - v[1] * s, v[0] * s + v[1] * c];
};

type PanState = {
  /** the hook (the ropes' apex), the deck's middle as if it hung plumb, the swing (deg), the deck's real middle, the two rope ties, how slack the ropes are */
  hook: P2;
  deck: P2;
  phi: number;
  mid: P2;
  ties: [P2, P2];
  sag: [number, number];
};
const panState = (side: -1 | 1, f: number): PanState => {
  const by = beamY(f);
  const th = tab(SIM.theta, f);
  const hook: P2 = [PX + side * ARM * Math.cos(rad(th)) - HOOK * Math.sin(rad(th)), by + side * ARM * Math.sin(rad(th)) + HOOK * Math.cos(rad(th))];
  const hangY = hook[1] + ROPE_H;
  const onGround = hangY >= DECK_DOWN;
  const deck: P2 = [hook[0], Math.min(DECK_DOWN, hangY)];
  const phi = onGround ? 0 : tab(side < 0 ? SIM.phiL : SIM.phiR, f);
  const world = (local: P2): P2 => {
    const v = turn([deck[0] + local[0] - hook[0], deck[1] + local[1] - hook[1]], -phi);
    return [hook[0] + v[0], hook[1] + v[1]];
  };
  const ties: [P2, P2] = [world([-TIE[0], TIE[1]]), world(TIE)];
  const sagOf = (p: P2) => {
    const d = Math.hypot(p[0] - hook[0], p[1] - hook[1]);
    return Math.sqrt(Math.max(0, (3 * d * (ROPE_LEN - d)) / 8));
  };
  return { hook, deck, phi, mid: world([0, 0]), ties, sag: [sagOf(ties[0]), sagOf(ties[1])] };
};
/** how hard the deck pushes up on the men (px / frame^2, + = they are pressed down: the knees give) */
const deckPush = (side: -1 | 1, f: number) => {
  const y = (g: number) => panState(side, g).mid[1];
  return -(y(f + 2) - 2 * y(f) + y(f - 2)) / 4;
};

// ---------------------------------------------------------------------------
// THE MEN
// ---------------------------------------------------------------------------
// ---- the fourth Totonac walks on at constant speed and takes his place
const CYCLE = WALK.cycle;
const ADV = WALK.advance(SC_T);
const walkAmount = (f: number) => 1 - smoothstep((f - 8) / 9);
/** frames' worth of full-speed walking still to do at frame f */
const TO_GO = (() => {
  const out = new Array<number>(DURATION + 2).fill(0);
  for (let f = DURATION; f >= 0; f--) out[f] = out[f + 1] + (walkAmount(f) + walkAmount(f + 1)) / 2;
  return out;
})();
const PAN_L_X = PX - ARM;
const PAN_EDGE = PAN_L_X - PAN_HW;
const walkerX = (f: number) => PAN_L_X + SLOT[0] - TO_GO[Math.max(0, Math.min(DURATION + 1, Math.round(f)))] * ADV;
/** the height of what is under a foot at world x: the ground, or the deck */
const floorAt = (x: number) => GROUND - SOLE - (PAN_T - 1) * smoothstep((x - PAN_EDGE + 4) / 16);

const BOUND = POSES.bound(1);
const armBy = (a: ArmPose, dx: number, dy: number): ArmPose => ({ ...a, w: [a.w[0] + dx, a.w[1] + dy] });
/** one kind of man, four men: height, how he stands, where his head and his bound hands hang */
const variant = (o: { yaw?: number; head?: number; pitch: number; lids: number; lean?: number; hands?: number; reach?: number; stance?: number; brow?: number }): FigPose => ({
  ...BOUND,
  yaw: BOUND.yaw + (o.yaw ?? 0),
  headYaw: BOUND.headYaw + (o.yaw ?? 0) + (o.head ?? 0),
  pitch: o.pitch,
  lids: o.lids,
  brow: o.brow ?? BOUND.brow,
  lean: BOUND.lean + (o.lean ?? 0),
  armL: armBy(BOUND.armL, o.reach ?? 0, o.hands ?? 0),
  armR: armBy(BOUND.armR, o.reach ?? 0, o.hands ?? 0),
  footL: [-(o.stance ?? 0), 0],
  footR: [o.stance ?? 0, 0],
});
const TOTONACS: { scale: number; seed: number; pose: FigPose }[] = [
  { scale: SC_T * 0.99, seed: 1, pose: variant({ pitch: 11, lids: 0.25, stance: 3 }) },
  { scale: SC_T * 0.94, seed: 5.3, pose: variant({ yaw: -0.14, head: -0.1, pitch: 19, lids: 0.55, lean: 2.2, hands: 12, reach: -5, stance: -2 }) },
  { scale: SC_T * 1.04, seed: 2.6, pose: variant({ yaw: 0.06, head: 0.04, pitch: 6, lids: 0.15, lean: -1.4, hands: -10, reach: 3, stance: 9, brow: 0.2 }) },
  { scale: SC_T * 0.975, seed: 8.1, pose: variant({ yaw: -0.24, head: -0.16, pitch: 14, lids: 0.4, lean: 1, hands: 4, stance: 5 }) },
];
/** the tall one looks across at the Chichimec while he heaves, then looks down again */
const GLANCER = 2;
const glance = track([
  [66, 0],
  [77, 1],
  [90, 1],
  [103, 0],
]);
/** a Totonac riding the pan: he is carried, his knees give when the deck pushes, he sways the other way a moment late */
const ride = (q: FigPose, f: number, i: number): FigPose => {
  const phi = tab(SIM.phiL, f - 2 - i * 1.5);
  const push = Math.max(-1.5, Math.min(2.5, deckPush(-1, f - 1)));
  const g = i === GLANCER ? glance(f) : 0;
  return {
    ...q,
    lean: q.lean + 0.9 * phi,
    roll: q.roll - 1.1 * (tab(SIM.phiL, f - 1 - i * 1.5) - tab(SIM.phiL, f - 4 - i * 1.5)),
    crouch: q.crouch + 1 + 2 * push,
    pitch: q.pitch - (q.pitch + 5) * g,
    headYaw: q.headYaw + 0.1 * g,
    lids: q.lids * (1 - g),
    brow: q.brow - 0.7 * g,
  };
};

// ---- the Chichimec: tense from the first frame; each heave is a deep crouch, then a wrench up and back against the cord
// (keyed facing screen right, then mirrored: he faces the Totonacs)
const STRAIN0 = POSES.strain(1, 0);
const cArm = (x: number, y: number, hand = 0): Pick<FigPose, "armL" | "armR"> => ({
  armL: { w: [x, y], elbow: [-0.7, 1], fist: 1, hand },
  armR: { w: [x + 9, y + 6], elbow: [-0.7, 1], fist: 1, hand },
});
const TENSE: FigPose = { ...STRAIN0, yaw: 0.95, headYaw: 1.05, roll: 0, pitch: -4, lean: -5, crouch: 13, ...cArm(31, -168), footL: [-17, 0], footR: [19, 0], liftL: 0, liftR: 0, brow: 1, lids: 0.1, mouth: -1 };
/** coiled: hips down, hunched over the bound fists, feet set wider */
const COIL: FigPose = { ...TENSE, yaw: 1.08, headYaw: 1.2, pitch: 14, lean: 17, crouch: 40, ...cArm(40, -112, -10), footL: [-25, 0], footR: [27, 0], lids: 0.35 };
/** the wrench: legs driven straight, the trunk thrown back and round toward us, the fists torn up and out, head back, the front foot off the deck */
const WRENCH: FigPose = { ...TENSE, yaw: 0.6, headYaw: 0.78, roll: -13, pitch: -19, lean: -19, crouch: -4, ...cArm(62, -226, 30), footL: [-29, 0], footR: [34, -15], liftR: -16, lids: 0, mouth: -1 };
/** it holds him: he drops back onto the deck, the foot down further out, the fists dragged down again */
const CAUGHT: FigPose = { ...TENSE, yaw: 0.86, headYaw: 0.95, roll: 5, pitch: 5, lean: 7, crouch: 22, ...cArm(38, -146, 6), footL: [-26, 0], footR: [33, 0], lids: 0.2 };
/** one track per heave (TENSE before and after it); where two overlap their departures from TENSE add */
const heaveTracks = HEAVES.map(([c, a]) =>
  poseTrack([
    [c - 21, TENSE],
    [c - 11, lerpFig(TENSE, COIL, a)],
    [c, lerpFig(TENSE, WRENCH, a)],
    [c + 2, lerpFig(TENSE, { ...WRENCH, crouch: 2, footR: [34, -4], liftR: -5 }, a * 0.92)],
    [c + 9, lerpFig(TENSE, CAUGHT, a)],
    [c + 21, TENSE],
  ]),
);
const chichimecTrack = (f: number): FigPose => heaveTracks.map((t) => t(f)).reduce((sum, q) => lerpFig(lerpFig(TENSE, sum, 2), lerpFig(TENSE, q, 2), 0.5), TENSE);
const chichimecPose = (f: number): FigPose => {
  // never still: between the heaves he works at the cord (the module's strain loop, laid on lightly)
  const q = mirrorPose(lerpFig(chichimecTrack(f), POSES.strain(1, f / 34), 0.16));
  return { ...q, lean: q.lean + 0.7 * tab(SIM.phiR, f - 2) };
};

// ---------------------------------------------------------------------------
// THE CAMERA: it rises a little with the hoist, then drifts toward the right pan
// ---------------------------------------------------------------------------
/** the close-up on the Chichimec: he stands ~850 px tall, feet near y 1410, his face above the caption strip */
const CLOSE = { k: 2.03, wx: PX + ARM + 8, wy: 951 };
const camAt = makeCamera([
  { f: 0, k: 1.07, wx: 514, wy: 843, sx: 540, sy: 960 },
  { f: 20, k: 1.072, wx: 527, wy: 840, sx: 540, sy: 960 },
  { f: 42, k: 1.075, wx: 540, wy: 804, sx: 540, sy: 960 },
  { f: 47, k: 1.077, wx: 541, wy: 804, sx: 540, sy: 960 },
  // "because the Chichimec": one push in on him
  { f: 68, k: CLOSE.k, wx: CLOSE.wx, wy: CLOSE.wy, sx: 540, sy: 960 },
  { f: 96, k: CLOSE.k * 1.022, wx: CLOSE.wx + 2, wy: CLOSE.wy + 1, sx: 540, sy: 960 },
  { f: 123, k: CLOSE.k * 1.04, wx: CLOSE.wx + 3, wy: CLOSE.wy + 2, sx: 540, sy: 960 },
  // "than the Totonacs did": back to the whole balance
  { f: 137, k: 1.13, wx: 559, wy: 812, sx: 540, sy: 960 },
  { f: 142, k: 1.086, wx: 547.5, wy: 805.5, sx: 540, sy: 960 },
  { f: 145, k: 1.09, wx: 549, wy: 806, sx: 540, sy: 960 },
]);

// ---------------------------------------------------------------------------
// THE ENGRAVER'S HAND (as texcocoFigures')
// ---------------------------------------------------------------------------
const P = (v: P2) => `${v[0].toFixed(1)},${v[1].toFixed(1)}`;
const OUT = { stroke: DARK, strokeWidth: 2.4, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
const ln = (w = 1.2, a = 0.8) => ({ fill: "none", stroke: DARK, strokeWidth: w, strokeOpacity: a, strokeLinecap: "round" as const, strokeLinejoin: "round" as const });
/** hand-cut hatching: parallel strokes at `ang` deg filling the rect, each a hair off its place and ragged at both ends */
const hatchD = (x0: number, y0: number, x1: number, y1: number, ang: number, gap: number, seed: number, rag = 0.28) => {
  const dx = Math.cos(rad(ang));
  const dy = Math.sin(rad(ang));
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const R = Math.hypot(x1 - x0, y1 - y0) / 2;
  let d = "";
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
    d += `M${P([px + dx * t0, py + dy * t0])}L${P([px + dx * t1, py + dy * t1])}`;
  }
  return d;
};
/** a dark casing round a form, so it reads on the umber page */
const Cased: React.FC<{ id: string; r?: number; children?: React.ReactNode }> = ({ id, r = 1.6, children }) => (
  <>
    <filter id={id} x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
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
const rectD = (x0: number, y0: number, x1: number, y1: number) => `M${x0},${y0}H${x1}V${y1}H${x0}Z`;

// ---------------------------------------------------------------------------
// THE BALANCE, drawn as timber: orange form, firm outline, grain, hatched shade
// (light from the upper left)
// ---------------------------------------------------------------------------
const O: Ink = ORANGE;
const POST_HW = 21;
/** the post, planted in the ground and wedged; a capped head with the staple the haul rope runs through */
const Post: React.FC = () => {
  const body = rectD(PX - POST_HW, POST_TOP + 22, PX + POST_HW, GROUND + 2);
  const cap = `M${PX - POST_HW - 9},${POST_TOP + 24}L${PX - POST_HW - 5},${POST_TOP}H${PX + POST_HW + 5}L${PX + POST_HW + 9},${POST_TOP + 24}Z`;
  return (
    <Cased id="ffo-post">
      <clipPath id="ffo-post-c">
        <path d={body} />
      </clipPath>
      <path d={body} fill={O.main} {...OUT} />
      <g clipPath="url(#ffo-post-c)">
        <path d={hatchD(PX + 3, POST_TOP, PX + POST_HW + 2, GROUND, 104, 3.3, 11)} {...ln(1, 0.6)} />
        <path d={hatchD(PX + 11, POST_TOP, PX + POST_HW + 2, GROUND, 62, 4.2, 12)} {...ln(0.9, 0.42)} />
        <path d={`M${PX - 9},${POST_TOP + 40}Q${PX - 12},${(POST_TOP + GROUND) / 2} ${PX - 8},${GROUND - 20}M${PX - 1},${POST_TOP + 90}Q${PX + 2},${(POST_TOP + GROUND) / 2 + 60} ${PX - 1},${GROUND - 60}`} {...ln(1, 0.34)} />
        {/* the wear where the collar has run */}
        <path d={hatchD(PX - POST_HW, BEAM_UP - 30, PX - 2, BEAM_DOWN + 30, 178, 46, 13, 0.4)} {...ln(0.9, 0.3)} />
      </g>
      <path d={cap} fill={O.deep} {...OUT} />
      <path d={`M${PX - POST_HW - 5},${POST_TOP + 9}H${PX + POST_HW + 5}`} {...ln(1, 0.55)} />
      {/* the wedges at its foot */}
      <path d={`M${PX - POST_HW},${GROUND - 44}L${PX - POST_HW - 20},${GROUND + 2}H${PX - POST_HW}Z`} fill={O.deep} {...OUT} />
      <path d={`M${PX + POST_HW},${GROUND - 44}L${PX + POST_HW + 20},${GROUND + 2}H${PX + POST_HW}Z`} fill={O.deep} {...OUT} />
      <path d={hatchD(PX + POST_HW, GROUND - 40, PX + POST_HW + 20, GROUND, 70, 3.4, 14)} {...ln(0.9, 0.5)} />
    </Cased>
  );
};
/** the beam, in its own frame: the pivot at (0, 0), the hooks at (+-ARM, HOOK) */
const BEAM_END = ARM + 20;
const BEAM_D = `M${-BEAM_END},-10L-40,-19H40L${BEAM_END},-10V10L40,19H-40L${-BEAM_END},10Z`;
const Beam: React.FC<{ at: P2; theta: number }> = ({ at, theta }) => (
  <g transform={`translate(${at[0].toFixed(2)} ${at[1].toFixed(2)}) rotate(${theta.toFixed(3)})`}>
    <Cased id="ffo-beam">
      <clipPath id="ffo-beam-c">
        <path d={BEAM_D} />
      </clipPath>
      {/* the hooks under its ends */}
      {[-1, 1].map((s) => (
        <g key={s}>
          <path d={`M${s * ARM},10V${HOOK - 9}`} stroke={DARK} strokeWidth={8.4} strokeLinecap="round" />
          <path d={`M${s * ARM},10V${HOOK - 9}`} stroke={O.deep} strokeWidth={4.6} strokeLinecap="round" />
          <circle cx={s * ARM} cy={HOOK} r={8.5} fill="none" stroke={DARK} strokeWidth={8.4} />
          <circle cx={s * ARM} cy={HOOK} r={8.5} fill="none" stroke={O.main} strokeWidth={4.6} />
        </g>
      ))}
      <path d={BEAM_D} fill={O.main} {...OUT} />
      <g clipPath="url(#ffo-beam-c)">
        <path d={hatchD(-BEAM_END, 3, BEAM_END, 20, 76, 3.3, 21)} {...ln(1, 0.58)} />
        <path d={hatchD(-BEAM_END, 9, BEAM_END, 20, 118, 4.4, 22)} {...ln(0.9, 0.4)} />
        <path d={`M${-BEAM_END + 26},-3.5Q${-ARM / 2},-9.5 -52,-9M52,-9Q${ARM / 2},-9.5 ${BEAM_END - 26},-3.5M${-BEAM_END + 70},1Q${-ARM / 2},-3 -70,-2M84,-2Q${ARM / 2 + 20},-3 ${BEAM_END - 60},1`} {...ln(1, 0.36)} />
      </g>
      {/* the bands that carry the hooks */}
      {[-1, 1].map((s) => (
        <g key={s}>
          <path d={rectD(s * ARM - 8, -13.5, s * ARM + 8, 13.5)} fill={O.deep} {...OUT} strokeWidth={2} />
          <path d={`M${s * ARM - 3},-10V10M${s * ARM + 3},-10V10`} {...ln(0.9, 0.5)} />
        </g>
      ))}
    </Cased>
  </g>
);
/** the collar that carries the beam up the post: a banded block, the pivot pin, the ring the haul rope is tied to */
const Collar: React.FC<{ y: number }> = ({ y }) => (
  <g transform={`translate(${PX} ${y.toFixed(2)})`}>
    <Cased id="ffo-collar">
      <circle cx={0} cy={-42} r={8} fill="none" stroke={DARK} strokeWidth={8.4} />
      <circle cx={0} cy={-42} r={8} fill="none" stroke={O.main} strokeWidth={4.6} />
      <path d={rectD(-33, -34, 33, 34)} fill={O.deep} {...OUT} />
      <path d={`M-33,-23H33M-33,23H33`} {...ln(1.2, 0.7)} />
      <path d={hatchD(6, -22, 33, 22, 100, 3.3, 31)} {...ln(0.95, 0.55)} />
      <circle cx={0} cy={0} r={9.5} fill={O.main} {...OUT} strokeWidth={2.1} />
      <circle cx={0} cy={0} r={3.2} fill={DARK} opacity={0.85} />
    </Cased>
  </g>
);
/** a pan in its own frame: the deck's top line at y = 0, its middle at x = 0 */
const Pan: React.FC<{ uid: string }> = ({ uid }) => {
  const deck = rectD(-PAN_HW, 0, PAN_HW, PAN_T - 7);
  return (
    <Cased id={`${uid}-case`}>
      <clipPath id={`${uid}-c`}>
        <path d={deck} />
      </clipPath>
      {/* the two bearers under the deck */}
      {[-1, 1].map((s) => (
        <path key={s} d={rectD(s * (PAN_HW - 62) - 15, PAN_T - 8, s * (PAN_HW - 62) + 15, PAN_T)} fill={O.deep} {...OUT} strokeWidth={2} />
      ))}
      <path d={deck} fill={O.main} {...OUT} />
      <g clipPath={`url(#${uid}-c)`}>
        <path d={hatchD(-PAN_HW, 8, PAN_HW, PAN_T - 6, 78, 3.4, 41)} {...ln(1, 0.58)} />
        <path d={`M${-PAN_HW + 30},5.5H${-40}M${-10},5.5H${PAN_HW - 50}`} {...ln(0.9, 0.34)} />
      </g>
      {/* the end cleats the ropes are tied round */}
      {[-1, 1].map((s) => (
        <g key={s}>
          <path d={rectD(s * TIE[0] - 10, -9, s * TIE[0] + 10, PAN_T - 4)} fill={O.deep} {...OUT} strokeWidth={2} />
          <path d={`M${s * TIE[0] - 10},-2H${s * TIE[0] + 10}M${s * TIE[0] - 10},3H${s * TIE[0] + 10}`} {...ln(1, 0.6)} />
        </g>
      ))}
    </Cased>
  );
};
/** the ground: one cream line, broken strokes under it, a hatched shade under each pan */
const GROUND_D = (() => {
  let d = "";
  [9, 17, 27, 39].forEach((dy, r) => {
    let x = -700 + 60 * hash(r, 51);
    let i = 0;
    while (x < 1800) {
      const len = 18 + 70 * hash(i, 52 + r) * (1 - r * 0.15);
      d += `M${x.toFixed(1)},${GROUND + dy + (hash(i, 60 + r) - 0.5) * 2}h${len.toFixed(1)}`;
      x += len + 16 + 90 * hash(i, 56 + r) * (1 + r * 0.6);
      i++;
    }
  });
  return d;
})();
const Ground: React.FC = () => (
  <g>
    <path d={`M-700,${GROUND}H1800`} stroke={DARK} strokeWidth={6} strokeOpacity={0.5} />
    <path d={`M-700,${GROUND}H1800`} stroke={INK} strokeWidth={2.6} strokeOpacity={0.8} />
    <path d={GROUND_D} fill="none" stroke={INK} strokeWidth={1.7} strokeOpacity={0.3} strokeLinecap="round" />
    {[-1, 1].map((s) => (
      <path key={s} d={hatchD(PX + s * ARM - PAN_HW + 8, GROUND + 4, PX + s * ARM + PAN_HW - 8, GROUND + 19, 152, 4.2, 70 + s, 0.35)} {...ln(1.5, 0.55)} />
    ))}
  </g>
);

// ---------------------------------------------------------------------------
// THE STATE AT A FRAME
// ---------------------------------------------------------------------------
const ROPE_W = 7;
const slackOf = (a: P2, b: P2, sag: number) => sag / (0.34 * Math.hypot(b[0] - a[0], b[1] - a[1]) + 24);

const FourForOne: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const by = beamY(frame);
  const theta = tab(SIM.theta, frame);
  const L = panState(-1, frame);
  const R = panState(1, frame);

  // the fourth Totonac: each foot stands on what is under it (the ground, then the deck)
  const wa = walkAmount(frame);
  const wx = walkerX(frame);
  const stepping = wa > 0.002;
  const wBase = walkLegs(TOTONACS[0].pose, (frame + 5) / CYCLE, wa);
  const wY = stepping ? floorAt(wx) : L.deck[1] - SOLE;
  const footY = (q: P2): P2 => {
    const fx = wx + q[0] * SC_T;
    return [q[0], q[1] + (floorAt(fx) - floorAt(wx)) / SC_T];
  };
  const walker: FigPose = stepping ? { ...wBase, footL: footY(wBase.footL), footR: footY(wBase.footR) } : wBase;

  const men = TOTONACS.map((m, i) => {
    const at: P2 = i === 0 && stepping ? [wx, wY] : [L.deck[0] + SLOT[i], L.deck[1] - SOLE];
    const pose = idle(ride(i === 0 ? walker : m.pose, frame, i), frame, m.seed, 0.8);
    return { ...m, at, pose, i };
  });
  const ropes = [L, R].flatMap((p, s) =>
    p.ties.map((t, j) => <Rope key={`${s}-${j}`} from={p.hook} to={t} slack={slackOf(p.hook, t, p.sag[j])} width={ROPE_W} ink={O} />),
  );
  return (
    <AbsoluteFill>
      <TexcocoPage cam={cam}>
        <WorldSvg cam={cam}>
          <Ground />
          <Post />
          {/* the haul rope: from the collar's ring up through the staple on the post's head and away */}
          <Rope from={[PX, by - 46]} to={[PX, by - 46 - 1500]} slack={0} width={ROPE_W} ink={O} />
          <Cased id="ffo-staple">
            <path d={rectD(PX - 13, POST_TOP + 5, PX + 13, POST_TOP + 17)} fill={O.main} {...OUT} strokeWidth={2} />
          </Cased>
          {ropes}
          <g transform={`rotate(${(-R.phi).toFixed(3)} ${R.hook[0].toFixed(2)} ${R.hook[1].toFixed(2)})`}>
            <g transform={`translate(${R.deck[0].toFixed(2)} ${R.deck[1].toFixed(2)})`}>
              <Pan uid="ffo-panR" />
            </g>
            <Chichimec pose={chichimecPose(frame)} at={[R.deck[0] + 8, R.deck[1] - SOLE]} scale={SC_C} uid="ffo-chi" />
          </g>
          <g transform={`rotate(${(-L.phi).toFixed(3)} ${L.hook[0].toFixed(2)} ${L.hook[1].toFixed(2)})`}>
            <g transform={`translate(${L.deck[0].toFixed(2)} ${L.deck[1].toFixed(2)})`}>
              <Pan uid="ffo-panL" />
            </g>
            {[...men].reverse().map((m) => (
              <Totonac key={m.i} pose={m.pose} at={m.at} scale={m.scale} uid={`ffo-tot${m.i}`} />
            ))}
          </g>
          <Beam at={[PX, by]} theta={theta} />
          <Collar y={by} />
        </WorldSvg>
        <Label text="TOTONACS" x={PX - ARM} y={BEAM_UP - 62} cam={cam} frame={frame} f0={T.label1} size={54} spacing={0.22} />
        <Label text="CHICHIMEC" x={PX + ARM} y={BEAM_UP - 62} cam={cam} frame={frame} f0={T.label2} size={54} spacing={0.22} />
      </TexcocoPage>
    </AbsoluteFill>
  );
};

export default FourForOne;

/** the figures' specs this cut stands on (kept for the director's probes) */
export const FOUR_FOR_ONE_CAST = { totonac: CAST_SPECS.totonac, chichimec: CAST_SPECS.chichimec };
