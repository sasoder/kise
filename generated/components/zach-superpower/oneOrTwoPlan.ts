// ---------------------------------------------------------------------------
// OneOrTwoVsEight — the plan (pure data, no React): the world layout, the
// camera, the two climbers' flight paths, the jet's contrail and the eight
// copies' drops. Imported by the cut; also run by bun for the numbers in the
// cut's header. World px; the rockets are superpowerRockets' glyphs at scale
// ROCKET_SCALE; the jet is zachShared's side-view glyph, mirrored (nose to the
// left) and scaled up as a symbol (JET_SCALE).
// ---------------------------------------------------------------------------

export const FPS = 24000 / 1001;
export const DURATION = 183;

const W = 1080;
const H = 1920;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (u: number) => {
  const x = clamp01(u);
  return x * x * (3 - 2 * x);
};
const smoother = (u: number) => {
  const x = clamp01(u);
  return x * x * x * (x * (6 * x - 15) + 10);
};

// -- the layout ---------------------------------------------------------------------
/** one scale for every rocket: the original and its eight copies are the same size */
export const ROCKET_SCALE = 0.62;
/** Falcon 9 at ROCKET_SCALE: 70 m x 8 px/m x 0.62 */
export const F9_H = 70 * 8 * ROCKET_SCALE;
/** fairing width (5.2 m x 8 x DIAM_X 2 x scale) */
export const F9_W = 5.2 * 8 * 2 * ROCKET_SCALE;
/** the ground: both rules' TOP edge */
export const RULE_Y = 1000;
export const RULE_B_Y = RULE_Y;

/** the original: the Falcon 9 stands at the right end of America's rule */
export const F9_X = 300;
/** the jet, a SYMBOL not to scale: 45 % of the rocket's height long (zachShared JET_LEN 120 -> JET_LEN), standing
 *  close beside the Falcon 9 on its LEFT, nose to the left (away from China's side), JET_GAP from it */
export const JET_LEN = 0.45 * F9_H;
export const JET_SCALE = JET_LEN / 120;
const JET_GAP = 95;
export const JET_X0 = F9_X - F9_W / 2 - JET_GAP - JET_LEN / 2;
/** America's rule: from well behind the jet (its runway, to the left) to just past the Falcon 9 */
export const RULE = { x0: JET_X0 - JET_LEN / 2 - 260, x1: F9_X + F9_W / 2 + 36 };

/** China's rule, a second rule just to the right on the same level: the eight copies evenly spaced on it, one
 *  every COPY_PITCH (a gap wider than a rocket, so the row reads as rockets, not a picket fence) */
export const COPY_N = 8;
export const COPY_PITCH = 106;
const RULE_GAP = 56;
const RULE_B_X0 = RULE.x1 + RULE_GAP;
export const COPY_X0 = RULE_B_X0 + 44 + F9_W / 2;
export const COPY_X = Array.from({ length: COPY_N }, (_, i) => COPY_X0 + i * COPY_PITCH);
export const RULE_B = { x0: RULE_B_X0, x1: COPY_X[COPY_N - 1] + F9_W / 2 + 44 };

// -- the Falcon 9's flight: straight up -------------------------------------------------
/** the frame it leaves the rule */
export const F9_LIFT = 91;
/** path length s(t) = F9_A * t^F9_P (t = frames since lift-off): off the pad briskly, still gaining speed */
const F9_P = 1.12;
const F9_S_END = 650;
const F9_A = F9_S_END / Math.pow(DURATION - 1 - F9_LIFT, F9_P);
const f9S = (t: number) => (t <= 0 ? 0 : F9_A * Math.pow(t, F9_P));
/** the Falcon 9 at frame f: base point (x, y), pitch (always 0: straight up), speed (world px / frame) */
export const f9At = (f: number) => {
  const t = f - F9_LIFT;
  return { x: F9_X, y: RULE_Y - f9S(t), pitch: 0, v: f9S(t + 0.5) - f9S(t - 0.5) };
};
/** the plume's length (world px): it grows out from behind the rule with the climb, then with speed */
export const plumeLen = (f: number) => {
  if (f < F9_LIFT) return 0;
  const s = RULE_Y - f9At(f).y;
  // the whole flame (its three tongues too) stays above the rule: it comes out of the engines as they clear it
  return Math.min(92 + 6.5 * f9At(f).v, Math.max(0, s - 7));
};

// -- the jet's flight: a shallow climb away to the upper left ---------------------------------
/** it starts its roll (to the left); rotates; leaves the rule; climbs at JET_CLIMB deg (shallow: it stays a jet) */
export const JET_ROLL = 74;
const JET_ACC = 0.6; // world px / frame^2 on the roll
const JET_V_MAX = 18;
export const JET_CLIMB = 30;
/** path length at which it starts to rotate, and the radius of the pull-up arc */
const JET_ROT_S = 50;
const JET_ARC_R = 220;
const jetS = (t: number) => {
  if (t <= 0) return 0;
  const tCap = JET_V_MAX / JET_ACC;
  if (t <= tCap) return 0.5 * JET_ACC * t * t;
  return 0.5 * JET_ACC * tCap * tCap + JET_V_MAX * (t - tCap);
};
/** the path's angle (deg, + = nose up) at path length s */
const jetGamma = (s: number) => {
  if (s <= JET_ROT_S) return 0;
  const arcLen = (JET_ARC_R * JET_CLIMB * Math.PI) / 180;
  return JET_CLIMB * smooth((s - JET_ROT_S) / arcLen);
};
/** the side-view glyph's outline points (zachShared JET_SIDE_D vertices at scale 1, nose +x, belly +y) */
const JET_PTS: [number, number][] = [
  [60, 2.5],
  [12, -8.8],
  [-24, -9],
  [-45, -31],
  [-54.5, -31],
  [-56, -7.6],
  [-60, -5.4],
  [-60, 5.4],
  [-55, 6.6],
  [-24, 8.6],
  [-16, 12],
  [18, 12],
  [22, 6.2],
];
/** the lowest point below the glyph's centre (world px) when it is pitched nose-up by g deg */
const jetLowest = (g: number) => {
  const a = (g * Math.PI) / 180;
  let m = -Infinity;
  for (const [px, py] of JET_PTS) m = Math.max(m, -px * Math.sin(a) + py * Math.cos(a));
  return m * JET_SCALE;
};
const JET_TRACK: { x: number; y: number; gamma: number; v: number }[] = (() => {
  const out: { x: number; y: number; gamma: number; v: number }[] = [];
  let px = JET_X0;
  let py = RULE_Y - jetLowest(0); // the path point: the glyph's centre if it never had to clear its tail
  const SUB = 8;
  for (let f = 0; f <= DURATION + 1; f++) {
    if (f > JET_ROLL) {
      for (let j = 0; j < SUB; j++) {
        const t0 = f - 1 - JET_ROLL + j / SUB;
        const t1 = t0 + 1 / SUB;
        const ds = jetS(t1) - jetS(t0);
        const a = (jetGamma((jetS(t0) + jetS(t1)) / 2) * Math.PI) / 180;
        px -= Math.cos(a) * ds; // nose to the LEFT
        py -= Math.sin(a) * ds;
      }
    }
    const t = f - JET_ROLL;
    const g = jetGamma(jetS(t));
    const y = Math.min(py, RULE_Y - jetLowest(g)); // keep the tail clear of the rule while it rotates
    out.push({ x: px, y, gamma: g, v: jetS(t + 0.5) - jetS(t - 0.5) });
  }
  return out;
})();
/** the jet at frame f: centre (x, y), climb angle gamma (deg, nose up-left), speed */
export const jetAt = (f: number) => {
  const i = Math.max(0, Math.min(JET_TRACK.length - 2, Math.floor(f)));
  const u = clamp01(f - i);
  const a = JET_TRACK[i];
  const b = JET_TRACK[i + 1];
  return {
    x: a.x + (b.x - a.x) * u,
    y: a.y + (b.y - a.y) * u,
    gamma: a.gamma + (b.gamma - a.gamma) * u,
    v: a.v + (b.v - a.v) * u,
  };
};
/** the SVG transform that places the mirrored jet glyph (nose left, climbing up-left) at frame f */
export const jetTransform = (f: number) => {
  const j = jetAt(f);
  return `translate(${j.x} ${j.y}) rotate(${j.gamma}) scale(${-JET_SCALE} ${JET_SCALE})`;
};
/** the nozzle (the glyph's tail, local (-60, 0)) in world px at frame f */
export const jetNozzle = (f: number) => {
  const j = jetAt(f);
  const a = (j.gamma * Math.PI) / 180;
  const lx = 60 * JET_SCALE; // mirrored: the tail sits at +60 x scale
  return { x: j.x + lx * Math.cos(a), y: j.y + lx * Math.sin(a) };
};
/** the contrail starts once the jet's tail is TRAIL_ALT world px clear of the rule (so it never runs along it) */
const TRAIL_ALT = 18;
export const JET_AIRBORNE = (() => {
  for (let f = JET_ROLL; f < DURATION; f += 0.25) if (jetNozzle(f).y < RULE_Y - TRAIL_ALT) return f;
  return DURATION;
})();

// -- the camera -------------------------------------------------------------------------
// One coarse target track through the house damper (CAM_STIFF 0.09 / CAM_DAMP 0.468, log k), pre-rolled from
// f-PRE so it is already drifting at f0. The frame is held by two anchors: the rule's screen y and the Falcon 9's
// screen x.
//   A  f-PRE..A1: close on the pair, a slow drift in (k K0 -> KA); the Falcon 9's screen x slides so the eye is on
//      it on "one" (f52) and on the jet on "two" (f62), then the pair sits centred.
//   lift  from F9_LIFT: k never exceeds what keeps the rising Falcon 9's nose TOP_S px below the frame's top edge
//      (a pull-back carried by the rocket itself).
//   C  C0..C1: the pull-back and pan right on "against" to the resolved frame: k KC, the Falcon 9 at SX_F9_END,
//      China's rule's right end SCENE_MARGIN px in from the right edge, the rule at RULE_SC.
//   D  C1..end: the creep, log k at one steady rate to K_END.
const CAM_STIFF = 0.09;
const CAM_DAMP = 0.468;
const PRE = 14;
const K0 = 2.26;
const KA = 2.4;
const A1 = 84;
/** the pair's middle, and where the Falcon 9 sits on screen when the pair is centred */
const PAIR_MID = (JET_X0 - JET_LEN / 2 + F9_X + F9_W / 2) / 2;
const SX_F9_MID = W / 2 + (F9_X - PAIR_MID) * KA;
const RULE_SA = 1052;
const TOP_S = 120;
const C0 = 102;
const C1 = 146;
const C_WARP = 1.0;
const SCENE_MARGIN = 30;
const SX_F9_END = 230;
const RULE_SC = 1040;
export const KC = (W - SCENE_MARGIN - SX_F9_END) / (RULE_B.x1 - F9_X);
const K_END = KC * 0.985;

/** the Falcon 9's screen x during A: centred pair, nudged onto the rocket for "one", onto the jet for "two" */
const sxF9A = (f: number) => {
  const toRocket = 110 * smooth((f - 30) / 20) * (1 - smooth((f - 54) / 10));
  const toJet = -90 * smooth((f - 54) / 10) * (1 - smooth((f - 70) / 16));
  return SX_F9_MID - toRocket - toJet;
};

export const cameraTarget = (f: number) => {
  const eA = smooth((f + PRE) / (A1 + PRE));
  let logkA = Math.log(K0) + (Math.log(KA) - Math.log(K0)) * eA;
  // the rising Falcon 9 keeps its nose in shot
  const nose = F9_H + (RULE_Y - f9At(f).y) + 40;
  logkA = Math.min(logkA, Math.log((RULE_SA - TOP_S) / nose));
  const eC = smoother(Math.pow(clamp01((f - C0) / (C1 - C0)), C_WARP));
  let logk = logkA + (Math.log(KC) - logkA) * eC;
  if (f > C1) logk += ((Math.log(K_END) - Math.log(KC)) * (f - C1)) / (DURATION - 1 - C1);
  const k = Math.exp(logk);
  const sx = sxF9A(f) + (SX_F9_END - sxF9A(f)) * eC;
  const ruleS = RULE_SA + (RULE_SC - RULE_SA) * eC;
  return { cx: F9_X - (sx - W / 2) / k, cy: RULE_Y - (ruleS - H / 2) / k, k };
};

const CAM: { cx: number; cy: number; k: number }[] = (() => {
  const out: { cx: number; cy: number; k: number }[] = [];
  const t0 = cameraTarget(-PRE);
  let { cx, cy } = t0;
  let lk = Math.log(t0.k);
  let vx = 0;
  let vy = 0;
  let vk = 0;
  for (let f = -PRE + 1; f <= DURATION + 1; f++) {
    const t = cameraTarget(f);
    vx += (t.cx - cx) * CAM_STIFF - vx * CAM_DAMP;
    cx += vx;
    vy += (t.cy - cy) * CAM_STIFF - vy * CAM_DAMP;
    cy += vy;
    vk += (Math.log(t.k) - lk) * CAM_STIFF - vk * CAM_DAMP;
    lk += vk;
    if (f >= 0) out.push({ cx, cy, k: Math.exp(lk) });
  }
  return out;
})();

/** the damped camera at frame f */
export const cameraAt = (f: number) => {
  const i = Math.max(0, Math.min(CAM.length - 2, Math.floor(f)));
  const t = clamp01(f - i);
  const a = CAM[i];
  const b = CAM[i + 1];
  return { cx: a.cx + (b.cx - a.cx) * t, cy: a.cy + (b.cy - a.cy) * t, k: a.k * Math.pow(b.k / a.k, t) };
};

/** where a world point lands on screen at frame f (no sway) */
export const toScreen = (f: number, x: number, y: number) => {
  const c = cameraAt(f);
  return { x: W / 2 + (x - c.cx) * c.k, y: H / 2 + (y - c.cy) * c.k };
};

/** the paper's rest point: the middle of the camera's travel */
export const PAPER_REST = { cx: (PAIR_MID + F9_X - (SX_F9_END - W / 2) / KC) / 2, cy: 760 };

// -- the copies' drops ----------------------------------------------------------------
// Each copy falls tail-first at a constant DROP_V from wholly above the frame's top edge (on the frame it starts)
// and stops dead on its rule; its three chain copies trail DROP_STEP apart behind it (above) and close up under
// the core over CLOSE_F frames after it lands. One stamp every COPY_BEAT frames, left to right, never before the
// pan has brought the column REVEAL_IN px inside the right edge at the drop's start.
export const COPY_LAND0 = 132;
export const COPY_BEAT = 4.8;
export const DROP_V = 64;
export const DROP_STEP = 22;
export const CLOSE_F = 6;
const REVEAL_IN = 6;
const frameTopW = (f: number) => {
  const c = cameraAt(f);
  return c.cy - H / 2 / c.k;
};
const rightEdgeW = (f: number) => {
  const c = cameraAt(f);
  return c.cx + W / 2 / c.k;
};
/** the drop's start frame for a landing at L: the copy (base, its shadow) wholly above the frame top then */
const dropStartFor = (L: number) => {
  let s = L - 1;
  while (s > L - 60 && (L - s) * DROP_V < RULE_B_Y - frameTopW(s) + 10) s -= 0.25;
  return s;
};
export const COPY_LAND: number[] = (() => {
  const out: number[] = [];
  let prev = -Infinity;
  COPY_X.forEach((x, i) => {
    let L = Math.max(COPY_LAND0 + i * COPY_BEAT, prev + 3);
    while (L < DURATION && x + F9_W / 2 + REVEAL_IN > rightEdgeW(dropStartFor(L))) L += 0.25;
    out.push(L);
    prev = L;
  });
  return out;
})();
export const COPY_START = COPY_LAND.map(dropStartFor);

/** a copy's state at frame f: dy = world px ABOVE its rest (0 = landed), step = the chain's step behind it */
export const copyDrop = (i: number, f: number) => {
  const land = COPY_LAND[i];
  const start = COPY_START[i];
  if (f < start) return { visible: false, dy: 0, step: 0, landed: false, closing: false };
  if (f < land) return { visible: true, dy: (land - f) * DROP_V, step: DROP_STEP, landed: false, closing: true };
  const c = clamp01((f - land) / CLOSE_F);
  const e = 1 - Math.pow(1 - c, 2);
  return { visible: true, dy: 0, step: DROP_STEP * (1 - e), landed: true, closing: c < 1 };
};

/** China's rule runs out from under the first copy as it lands (never alone): its left end out to RULE_B.x0 over
 *  RULE_B_LEFT_F frames, its right end reaching each later copy's slot (right edge + 44) RULE_LEAD frames before
 *  that copy lands. Returns null before the first landing. */
const RULE_B_LEFT_F = 6;
const RULE_LEAD = 3;
export const ruleBSpan = (f: number): { x0: number; x1: number } | null => {
  const L0 = COPY_LAND[0];
  if (f < L0) return null;
  const x0 = COPY_X[0] + (RULE_B.x0 - COPY_X[0]) * smooth((f - L0) / RULE_B_LEFT_F);
  const keys: [number, number][] = [[L0, COPY_X[0] + F9_W / 2 + 44]];
  for (let i = 1; i < COPY_N; i++) keys.push([COPY_LAND[i] - RULE_LEAD, COPY_X[i] + F9_W / 2 + 44]);
  let x1 = RULE_B.x1;
  for (let j = 1; j < keys.length; j++) {
    const [f0, a] = keys[j - 1];
    const [f1, b] = keys[j];
    if (f <= f1) {
      x1 = a + (b - a) * clamp01((f - f0) / (f1 - f0));
      break;
    }
  }
  // at the landing frame itself the rule starts as the copy's own footprint
  const grow = clamp01((f - L0) / 2);
  return { x0: COPY_X[0] - F9_W / 2 + (x0 - (COPY_X[0] - F9_W / 2)) * grow, x1: COPY_X[0] + F9_W / 2 + (x1 - (COPY_X[0] + F9_W / 2)) * grow };
};
