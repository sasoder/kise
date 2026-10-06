// ---------------------------------------------------------------------------
// takingMotion: the geometry and the clocks of TakingThatIndividual (G2 of the
// Sheppard "Centralized empires fell fast" set). Everything here is a pure
// function of the frame, in WORLD px (world px == screen px at camera k 1),
// built on G1's tree (hierShared, read-only).
//
// THE TREE HERE. hierShared's TREE at scale S = 1.9 (836 px wide), its crowd's
// feet on y 1110, centred on x 540. The tiers are brought closer together
// than in G1 (the figures and the fan are G1's; the links between the tiers
// are shorter), so the whole tree AND the headroom for the strings fit above
// the caption band: Ruler's feet y 505 (175 px tall, plume tips y 330), lords'
// feet y 721, officials' feet y 898, the many y 1038 / 1074 / 1110.
// ---------------------------------------------------------------------------
import {
  INK_FULL,
  TREE,
  clamp01,
  hash,
  linkLengthBetween,
  makeCamera,
  nodeAnchors,
  pchip,
  commonerSway,
  rulerHand,
  smootherstep,
  smoothstep,
  type Cam,
  type LinkState,
  type NodeState,
  type Pulse,
  type TreeNode,
} from "./hierShared";

export const FPS = 24;
/** 30.322 -> 37.162 s = 6.840 s; round(6.840 * 24) = 164 frames (f0..f163), no tail */
export const DURATION = 164;
export const LAST = DURATION - 1;

export type P2 = [number, number];
const N = TREE.nodes;
const rad = (d: number) => (d * Math.PI) / 180;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerp2 = (a: P2, b: P2, t: number): P2 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];

// ---------------------------------------------------------------------------
// LAYOUT
// ---------------------------------------------------------------------------
export const S = 1.9;
export const TREE_X = 540;
export const TREE_Y = 1110;
export const toWorld = ([x, y]: P2): P2 => [TREE_X + x * S, TREE_Y + y * S];
const SEAT_Y = 505;
const LORD_FEET_Y = 721;
const OFFICIAL_FEET_Y = 898;
/** the tiers' rest offsets (local units) that bring them closer together */
const TIER_DY = [(SEAT_Y - TREE_Y) / S + 538, (LORD_FEET_Y - TREE_Y) / S + 375, (OFFICIAL_FEET_Y - TREE_Y) / S + 205, 0];
export const SEAT: P2 = [TREE_X, SEAT_Y];
export const RULER_PX = N[0].size * S; // 174.8
/** the clasp sits round his shoulders: this far above his feet (world px) */
const SHOULDER_H = 0.61 * RULER_PX;
const restState = (n: TreeNode): NodeState => ({ dy: TIER_DY[n.tier] });
const REST = N.map((n) => nodeAnchors(n, restState(n)));

// ---------------------------------------------------------------------------
// THE CAMERA: one C1 move through the whole cut (+4.5 % in), with the reframe
// of phase 1 folded into it (the page settles ~24 px lower while he is hoisted)
// ---------------------------------------------------------------------------
export const camAt: (f: number) => Cam = makeCamera([
  { f: 0, k: 1.0, wx: 540, wy: 815, sx: 540, sy: 800 },
  { f: 30, k: 1.011, wx: 540, wy: 815, sx: 540, sy: 824 },
  { f: 90, k: 1.029, wx: 540, wy: 815, sx: 540, sy: 820 },
  { f: LAST, k: 1.045, wx: 540, wy: 815, sx: 540, sy: 812 },
]);

// ---------------------------------------------------------------------------
// PHASE 1 / 3: the hoist and the set-down
// ---------------------------------------------------------------------------
export const T = {
  ringDown: [0, 8.5] as const, // the clasp comes down over his plumes
  ringClose: [7.5, 10.5] as const, // and closes round his shoulders
  hoist: [11, 24] as const,
  lower: [62, 88] as const,
  release: [18, 20.4, 19.2, 21.6], // each lord's link lets go (lord 1..4)
  reattach: [76, 88] as const,
  bar: [112, 130] as const,
  handStrings: [114, 128] as const,
  tug1: [130, 135] as const,
  tug2: [147.5, 153] as const,
  pulse1: 135,
  pulse2: 153.5,
};
const HOIST = 120;
/** how far he is off his seat (world px, up positive) by the hoist alone */
export const liftAt = (f: number) => HOIST * (smootherstep((f - T.hoist[0]) / (T.hoist[1] - T.hoist[0])) - smootherstep((f - T.lower[0]) / (T.lower[1] - T.lower[0])));
/** how limp he hangs (0 standing .. 1 hanging) */
const hangAt = (f: number) => smoothstep((f - T.hoist[0]) / 5) * (1 - smoothstep((f - 80) / 8));

// ---------------------------------------------------------------------------
// PHASE 4: the control bar. The two clasp strings hang from its middle; the two
// hand strings from its ends. A hand string has a FIXED length: when the bar's
// end rises past the slack, the string is taut and the arm must follow
// (armRaise solves the angle). The arms are never keyed.
// ---------------------------------------------------------------------------
const BAR_REST_Y = 200;
export const BAR_HALF = 96;
const tug1 = (f: number) => smootherstep((f - T.tug1[0]) / (T.tug1[1] - T.tug1[0]));
const tug2 = (f: number) => smootherstep((f - T.tug2[0]) / (T.tug2[1] - T.tug2[0]));
const after2 = (f: number) => smoothstep((f - 154) / 6);
export const barAt = (f: number) => {
  const down = smootherstep((f - T.bar[0]) / (T.bar[1] - T.bar[0]));
  const lift = 12 * tug1(f) + 68 * tug2(f) - 10 * smoothstep((f - 154) / 12);
  const tilt =
    -20 * tug1(f) + 5 * smoothstep((f - 138) / 10) + 18 * tug2(f) + 1.5 * Math.sin((f - 150) / 5.5) * after2(f) + 0.6 * Math.sin(f / 9) * smoothstep((f - 124) / 8);
  return { x: TREE_X + 2 * Math.sin(f / 13), y: -60 + (BAR_REST_Y + 60) * down - lift, tilt };
};
export const barPoint = (f: number, along: number): P2 => {
  const b = barAt(f);
  const a = rad(b.tilt);
  return [b.x + along * Math.cos(a), b.y + along * Math.sin(a)];
};
/** his body bobs up on the second tug and hangs there, swaying (world px, up positive) */
const bobAt = (f: number) => 14 * smootherstep((f - 149.5) / 4) - 5 * smoothstep((f - 154) / 10) + 2 * Math.sin((f - 154) / 6) * after2(f);

// ---------------------------------------------------------------------------
// THE RULER: driven by the clasp (the point between his shoulders)
// ---------------------------------------------------------------------------
export type RulerAt = { clasp: P2; feet: P2; tilt: number; legSwing: number; headTilt: number; hang: number; lift: number };
export const rulerAt = (f: number): RulerAt => {
  const hang = hangAt(f);
  const dangle = smoothstep((f - 149.5) / 4); // hanging again, a little, after the second tug
  const lift = liftAt(f) + bobAt(f);
  const tilt =
    hang * (4.5 + 2.6 * Math.sin((f - 11) / 7.5)) + (1 - hang) * (1 - dangle) * commonerSway(0, f, 1) + dangle * 1.6 * Math.sin((f - 150) / 6.5);
  const clasp: P2 = [TREE_X + hang * 3 * Math.sin((f - 14) / 9), SEAT_Y - SHOULDER_H - lift];
  const a = rad(tilt);
  const feet: P2 = [clasp[0] - SHOULDER_H * Math.sin(a), clasp[1] + SHOULDER_H * Math.cos(a)];
  return {
    clasp,
    feet,
    tilt,
    legSwing: hang * (-5 + 4 * Math.sin((f - 13) / 7.5)) + dangle * 4 * Math.sin((f - 151) / 5),
    headTilt: hang * 9 + 5 * tug2(f) - 2 * after2(f),
    hang,
    lift,
  };
};
/** his hand in world px for an arm raise (deg) */
export const handAt = (r: RulerAt, side: "L" | "R", raise: number): P2 => {
  const [hx, hy] = rulerHand(N[0].size, side, raise);
  const a = rad(r.tilt);
  const x = hx * S;
  const y = hy * S;
  return [r.feet[0] + x * Math.cos(a) - y * Math.sin(a), r.feet[1] + x * Math.sin(a) + y * Math.cos(a)];
};
const SIGN = { L: -1, R: 1 } as const;
const HAND_SLACK = 3;
const dist = (a: P2, b: P2) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const STRING_LEN = (() => {
  const r = rulerAt(120);
  const rest: P2 = [TREE_X + BAR_HALF, BAR_REST_Y];
  return dist(rest, handAt({ ...r, feet: SEAT, tilt: 0 }, "R", 0)) + HAND_SLACK;
})();
/** the arm's raise (deg) the hand string forces, and the string's slack (px) */
export const armAt = (f: number, side: "L" | "R") => {
  const r = rulerAt(f);
  if (f < T.handStrings[1]) return { raise: 0, slack: HAND_SLACK, end: barPoint(f, SIGN[side] * BAR_HALF), hand: handAt(r, side, 0) };
  const end = barPoint(f, SIGN[side] * BAR_HALF);
  const d0 = dist(end, handAt(r, side, 0));
  if (d0 <= STRING_LEN) return { raise: 0, slack: STRING_LEN - d0, end, hand: handAt(r, side, 0) };
  let lo = 0;
  let hi = 165;
  for (let i = 0; i < 26; i++) {
    const mid = (lo + hi) / 2;
    if (dist(end, handAt(r, side, mid)) > STRING_LEN) lo = mid;
    else hi = mid;
  }
  return { raise: hi, slack: 0, end, hand: handAt(r, side, hi) };
};

// ---------------------------------------------------------------------------
// THE CLASP RING
// ---------------------------------------------------------------------------
export const ringAt = (f: number) => {
  const r = rulerAt(f);
  const u = clamp01((f - T.ringDown[0]) / (T.ringDown[1] - T.ringDown[0]));
  const fall = 1 - Math.pow(1 - u, 2.2); // already falling at f0, easing onto his shoulders
  const y0 = 150;
  const close = smoothstep((f - T.ringClose[0]) / (T.ringClose[1] - T.ringClose[0]));
  const seated = f >= T.ringDown[1];
  return {
    cx: r.clasp[0],
    cy: seated ? r.clasp[1] : lerp(y0, SEAT_Y - SHOULDER_H, fall),
    rx: lerp(47, 30, close),
    ry: lerp(13, 8, close),
    rot: r.tilt * 0.6,
  };
};

// ---------------------------------------------------------------------------
// PHASE 2 / 3: the two fronts that run DOWN the tree (frame as a function of
// the local rest height)
// ---------------------------------------------------------------------------
const Y = {
  seat: REST[0].bottom[1],
  lordTop: Math.min(...TREE.byTier[1].map((i) => REST[i].top[1])),
  lordFeet: (LORD_FEET_Y - TREE_Y) / S,
  offTop: Math.min(...TREE.byTier[2].map((i) => REST[i].top[1])),
  offFeet: (OFFICIAL_FEET_Y - TREE_Y) / S,
  crowdTop: Math.min(...TREE.byTier[3].map((i) => REST[i].top[1])),
  crowdFeet: 4,
};
/** the frame the SLACK front reaches local height y: the broken top f21, the
 *  lords f25, the officials f35.5, the many f46-f57 */
export const slackFrame = pchip(
  [
    [Y.seat, 21],
    [Y.lordTop, 25],
    [Y.lordFeet, 30],
    [Y.offTop, 35.5],
    [Y.offFeet, 40],
    [Y.crowdTop, 46],
    [Y.crowdFeet, 57],
  ],
  true,
);
/** the frame the TAUT front reaches local height y: his feet f88, the lords
 *  f89, the officials f94, the many f99-f102 */
export const tautFrame = pchip(
  [
    [Y.seat, 88],
    [Y.lordTop, 89],
    [Y.lordFeet, 92],
    [Y.offTop, 94],
    [Y.offFeet, 97],
    [Y.crowdTop, 99],
    [Y.crowdFeet, 102],
  ],
  true,
);
const SLACK_F = 11; // frames a figure takes to lose his upright
const TAUT_F = 8; // and to be pulled straight again
/** how unstable a node is (0 upright .. 1 loose) */
export const looseAt = (n: TreeNode, f: number) => {
  if (n.tier === 0) return 0;
  const y = REST[n.id].top[1];
  return smoothstep((f - slackFrame(y)) / SLACK_F) * (1 - smoothstep((f - tautFrame(y)) / TAUT_F));
};
/** how slack a link (named by its child) is: it starts to droop when the front reaches its upper end */
export const linkSlackAt = (c: TreeNode, f: number) => {
  const y = REST[c.parent].bottom[1];
  const lag = 1.5 * hash(c.id, 71);
  return smoothstep((f - slackFrame(y) - lag) / 8) * (1 - smoothstep((f - tautFrame(y) - 0.5 * lag) / 6));
};

// ---------------------------------------------------------------------------
// PHASE 4: the command pulses (orange), tier by tier in step
// ---------------------------------------------------------------------------
/** windows (frames after the pulse leaves him) */
export const CMD = { lordLink: [0, 5], lordBody: [4, 9.5], offLink: [8, 13], crowdLink: [15, 20], obey: 18 } as const;
const OBEY_F = T.pulse1 + CMD.obey; // f153
const obeyAt = (id: number, f: number) => smootherstep((f - OBEY_F - 2 * hash(id, 81)) / 6);
/** each command's progress (0..1, parent -> child) along the link of child c; -1 = not on it */
export const commandOn = (c: TreeNode, f: number): number[] => {
  const w = c.tier === 1 ? CMD.lordLink : c.tier === 2 ? CMD.offLink : CMD.crowdLink;
  return [T.pulse1, T.pulse2].map((t0) => (f - t0 - w[0]) / (w[1] - w[0])).filter((q) => q > 0 && q < 1);
};
/** a lord's orange rim (0..1) while a command passes through him */
export const rimAt = (f: number) =>
  Math.max(...[T.pulse1, T.pulse2].map((t0) => smoothstep((f - t0 - CMD.lordBody[0]) / 2.5) * (1 - smoothstep((f - t0 - CMD.lordBody[1] + 3) / 3.5))));

// ---------------------------------------------------------------------------
// NODE STATES (every figure's sway is applied here: sway = false for the Tree,
// so the anchors below are exactly the Tree's)
// ---------------------------------------------------------------------------
const SEED = 1;
export const nodeStateAt = (n: TreeNode, f: number): NodeState => {
  if (n.tier === 0) {
    const r = rulerAt(f);
    return {
      dx: (r.feet[0] - TREE_X) / S - n.x,
      dy: (r.feet[1] - TREE_Y) / S - n.y,
      tilt: r.tilt,
      sway: false,
      look: "orange",
      armL: armAt(f, "L").raise,
      armR: armAt(f, "R").raise,
      headTilt: r.headTilt,
      legSwing: r.legSwing,
    };
  }
  const a = looseAt(n, f);
  const id = n.id;
  const h = (k: number) => hash(id, k);
  const sgn = n.tier === 1 ? (id % 2 ? -1 : 1) : h(91) > 0.5 ? 1 : -1;
  const wob = 1 + 0.25 * Math.sin(f / 7 + 6.283 * h(92));
  let dx = 0;
  let dy = TIER_DY[n.tier];
  let tilt = commonerSway(id, f, SEED);
  if (n.tier === 1) {
    tilt += a * sgn * (4 + 3 * h(93)) * wob;
    dx += a * ((h(94) - 0.5) * 9 + 1.8 * Math.sin(f / 9 + 6.283 * h(95)));
    dy += a * ((h(96) - 0.5) * 5 + 1 * Math.sin(f / 11 + 6.283 * h(97)));
  } else if (n.tier === 2) {
    tilt += a * sgn * (4.5 + 4.5 * h(93)) * wob;
    dx += a * ((h(94) - 0.5) * 10 + 2 * Math.sin(f / 9 + 6.283 * h(95)));
    dy += a * ((h(96) - 0.5) * 6 + 1 * Math.sin(f / 11 + 6.283 * h(97)));
  } else {
    // the many: loosen and spread, then stand; at the first command they step and lean as one
    const ob = obeyAt(id, f);
    tilt = tilt * (1 - 0.65 * ob) + a * sgn * (3 + 6 * h(93)) * wob + 5 * ob * (1 - 0.5 * smoothstep((f - 159) / 8));
    dx += a * ((n.x / 220) * 4.5 + (h(94) - 0.5) * 8 + 1.6 * Math.sin(f / 9 + 6.283 * h(95))) + 3.4 * ob;
    dy += a * ((h(96) - 0.5) * 7 + 1.2 * Math.sin(f / 10 + 6.283 * h(97)));
  }
  return { dx, dy, tilt, sway: false };
};
export const anchorsAt = (n: TreeNode, f: number) => {
  const a = nodeAnchors(n, nodeStateAt(n, f));
  return { top: toWorld(a.top as P2), bottom: toWorld(a.bottom as P2) };
};

// ---------------------------------------------------------------------------
// THE LOYALTY PULSES of phase 0 (G1's hand-off: cream dashes travelling UP)
// ---------------------------------------------------------------------------
const PULSE_V = 11; // local units per frame (G1's)
const PULSE_T = 46;
export const PULSE_LEN = 15;
const restLen = (c: TreeNode) => linkLengthBetween(REST[c.parent].bottom as P2, REST[c.id].top as P2, 0, 1);
const CHAINS = (() => {
  const out: { segs: { id: number; s0: number; len: number }[]; phase: number }[] = [];
  for (const id of TREE.byTier[3]) {
    if (hash(id + 131, 61) > 0.4) continue;
    const segs: { id: number; s0: number; len: number }[] = [];
    let s = 0;
    for (const n of TREE.chainOf(id)) {
      if (n.parent < 0) break;
      const len = restLen(n);
      segs.push({ id: n.id, s0: s, len });
      s += len + (REST[n.parent].bottom[1] - REST[n.parent].top[1]);
    }
    out.push({ segs, phase: hash(id + 131, 62) * PULSE_T });
  }
  return out;
})();
/** the cream loyalty pulses on each link this frame (by child id), `at` from
 *  the CHILD end in local units */
export const loyaltyAt = (f: number) => {
  const m = new Map<number, Pulse[]>();
  if (f > 62) return m;
  for (const ch of CHAINS) {
    const s = ((((f + 60 - ch.phase) % PULSE_T) + PULSE_T) % PULSE_T) * PULSE_V;
    for (const sg of ch.segs) {
      const at = s - sg.s0;
      if (at + PULSE_LEN <= 0 || at >= sg.len) continue;
      const n = N[sg.id];
      // a pulse lives on a taut link only; on a lord's link it fades as the link lets go
      const live = n.tier === 1 ? 1 - smoothstep((f - T.release[n.id - 1] + 3) / 5) : 1 - smoothstep(linkSlackAt(n, f) * 2.5);
      if (live <= 0.01) continue;
      const arr = m.get(sg.id) ?? [];
      arr.push({ at, len: PULSE_LEN, op: INK_FULL * live });
      m.set(sg.id, arr);
    }
  }
  return m;
};

/** a Tree link's state (the four links to the Ruler are drawn by lordLinkAt, not the Tree) */
export const linkStateAt = (c: TreeNode, f: number, loyalty: Map<number, Pulse[]>): LinkState => {
  if (c.tier === 1) return { op: 0 };
  const sl = linkSlackAt(c, f);
  const amp = c.tier === 3 ? 0.62 + 0.22 * hash(c.id, 72) : 0.8 + 0.2 * hash(c.id, 72);
  return { sag: sl * amp * (0.9 + 0.1 * Math.sin(f / 8 + 6.283 * hash(c.id, 73))), pulses: loyalty.get(c.id) };
};

// ---------------------------------------------------------------------------
// THE FOUR LINKS TO THE RULER (drawn here: they stretch as he rises, let go,
// hang wilted from the lords' heads, and reach up to his feet again)
// ---------------------------------------------------------------------------
export type Cubic = [P2, P2, P2, P2];
const taut = (F: P2, Tp: P2): Cubic => {
  const dy = Tp[1] - F[1];
  return [F, [F[0], F[1] + 0.42 * dy], [Tp[0], Tp[1] - 0.42 * dy], Tp];
};
const mix = (a: Cubic, b: Cubic, t: number): Cubic => [lerp2(a[0], b[0], t), lerp2(a[1], b[1], t), lerp2(a[2], b[2], t), lerp2(a[3], b[3], t)];
const REST_LORD_LEN = TREE.byTier[1].map((i) => dist(SEAT, toWorld(REST[i].top as P2)));
/** lord i's (1..4) link to the Ruler: the cubic PARENT end -> the lord's head, and how far it has let go (0..1) */
export const lordLinkAt = (i: number, f: number): { c: Cubic; gone: number } => {
  const n = N[i];
  const Tp = anchorsAt(n, f).top;
  const rel = T.release[i - 1];
  const gone = smoothstep((f - rel) / 10);
  const back = smootherstep((f - T.reattach[0] - (i % 2)) / (T.reattach[1] - T.reattach[0] - (i % 2)));
  const now = taut(rulerAt(f).feet, Tp);
  if (gone <= 0) return { c: now, gone: 0 };
  if (back >= 1) return { c: now, gone: 0 };
  const L = REST_LORD_LEN[i - 1];
  const side = Tp[0] < TREE_X ? 1 : -1; // it wilts toward the empty seat
  const swing = 5 * Math.sin(f / 11 + i * 1.7);
  const E: P2 = [Tp[0] + side * 0.34 * L + swing, Tp[1] + 0.16 * L];
  const wilt: Cubic = [E, [E[0] - side * 0.02 * L + swing * 0.5, E[1] - 0.5 * L], [Tp[0], Tp[1] - 0.44 * L], Tp];
  const held = taut(rulerAt(Math.min(f, rel)).feet, Tp);
  return { c: mix(mix(held, wilt, gone), now, back), gone: gone * (1 - back) };
};
export const cubicD = (c: Cubic) => `M${c[0][0].toFixed(2)},${c[0][1].toFixed(2)} C${c[1][0].toFixed(2)},${c[1][1].toFixed(2)} ${c[2][0].toFixed(2)},${c[2][1].toFixed(2)} ${c[3][0].toFixed(2)},${c[3][1].toFixed(2)}`;
export const cubicLen = (c: Cubic) => {
  let len = 0;
  let p = c[0];
  for (let i = 1; i <= 28; i++) {
    const t = i / 28;
    const u = 1 - t;
    const q: P2 = [
      u * u * u * c[0][0] + 3 * u * u * t * c[1][0] + 3 * u * t * t * c[2][0] + t * t * t * c[3][0],
      u * u * u * c[0][1] + 3 * u * u * t * c[1][1] + 3 * u * t * t * c[2][1] + t * t * t * c[3][1],
    ];
    len += dist(p, q);
    p = q;
  }
  return len;
};
