import React from "react";
import { interpolate } from "remotion";
import {
  ACCENT,
  ACCENT_DEEP,
  CAM_DAMP,
  CAM_STIFF,
  camEase,
  clamp,
  clamp01,
  iconShadow,
  makeTone,
  smoothstep,
  squirclePath,
} from "../kits/dwarkesh/fieldShared";
import { INK, INK_HI, Label, STROKE_PX, THREAD_PX, worldPx } from "../kits/dwarkesh/alignShared";

// ---------------------------------------------------------------------------
// timelineWorld — the 2022 -> 2026 (-> 2033) timeline that cut 15
// (`PreschoolerToIntern`) builds and cut 21 (`AnotherJumpThatBig`) returns to.
//
// THE WORLD. One white rule on y = RULE_Y with a tick and a year label per
// year, x = yearX(year), YEAR_PX world px per year, 2022 at X_2022. It extends
// to the right for as many years as a cut asks for (cut 21 goes on to 2028 and
// beyond); nothing in here stops at 2026.
//
// THE AI is one flat orange figure (`AiFigure`) standing on the rule: one
// material whose proportions are a function of `age` — 0 = a preschooler (big
// round head, short body, short limbs, in ACCENT_DEEP), 1 = a grown-up intern
// (adult proportions, in ACCENT). Past 1 the proportions stay adult and the
// figure keeps scaling up on the same line, so a giant is just a large age.
// It wears a lanyard with a small white badge at every age (a preschool name
// tag, then an intern's ID), and holds one white drink in its near hand that
// is a juice box with a straw as a child and turns into a lidded coffee cup as
// it grows (the straw retracts into the lid). Side view, facing right; the far
// limbs are one flat shade darker than the near ones so the legs read as two,
// and the layer order is fixed: far arm, far leg, torso, head, near leg,
// near arm, lanyard and badge, drink.
//
// THE HEIGHT MARKS (`HeightBar`): a thin ACCENT_DEEP bar at a year tick, as
// tall as the figure was when it passed that tick — the doorframe marks. They
// are revealed from behind the figure's torso as it walks off them.
//
// Every length here is WORLD px. Cut 15 rests at k ~1.0, so world px and screen
// px are the same number there; strokes are sized for that (STROKE_W).
// ---------------------------------------------------------------------------

/** The resting zoom the strokes and labels here are sized for. */
export const K_TIMELINE = 1;
export const STROKE_W = worldPx(STROKE_PX, K_TIMELINE); // the rule, the ticks: the style's one weight
export const THREAD_W = worldPx(THREAD_PX, K_TIMELINE);

// --- the axis ---------------------------------------------------------------
export const YEAR0 = 2022;
export const YEAR_PX = 190; // world px per year
export const X_2022 = 100;
export const RULE_Y = 980; // the rule's centre line, world px
/** The top of the rule's stroke: what the feet stand on. */
export const GROUND_Y = RULE_Y - STROKE_W / 2;
export const yearX = (year: number) => X_2022 + (year - YEAR0) * YEAR_PX;
export const xYear = (x: number) => YEAR0 + (x - X_2022) / YEAR_PX;
export const RULE_OVERHANG = 44; // the rule runs this far past its first and last tick
export const TICK_LEN = 18; // a tick drops this far below the rule's centre line
export const TICK_DRAW = 3; // frames for a tick to drop once the rule's head passes it
export const YEAR_LABEL_DY = 30; // the label's text box top, below the rule's centre line
export const YEAR_LABEL_SIZE = worldPx(48, K_TIMELINE);

// --- the figure's height ----------------------------------------------------
/** The intern (age 1) is this tall, feet to the top of the head, in world px. */
export const H_INTERN = 490;
/** The preschooler (age 0) is this fraction of the intern. */
export const CHILD_FRAC = 0.45;
/** Height for any age >= 0. One straight line through 0 and 1, continued past
 *  1, so the growth rate never kinks: age 2 is 1.55x the intern, age 3 2.1x. */
export const figureHeight = (age: number) =>
  H_INTERN * (CHILD_FRAC + (1 - CHILD_FRAC) * Math.max(0, age));
export const ageForHeight = (h: number) => (h / H_INTERN - CHILD_FRAC) / (1 - CHILD_FRAC);

// --- tone -------------------------------------------------------------------
/** The figure's tone along its growth: deep at 0 (the past model), ripe at 1. */
export const FIGURE_TONE = makeTone(ACCENT_DEEP, ACCENT);
const shade = (hex: string, f: number) => {
  const n = parseInt(hex.replace("#", ""), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(v * f));
  return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
};
/** The far limbs: the same ramp, one flat shade down, so the two legs read. */
export const FAR_SHADE = 0.8;
export const FIGURE_TONE_FAR = makeTone(shade(ACCENT_DEEP, FAR_SHADE), shade(ACCENT, FAR_SHADE));
/** The intern's tie: the same ramp, two shades down. */
export const FIGURE_TONE_TIE = makeTone(shade(ACCENT_DEEP, 0.6), shade(ACCENT, 0.6));
export const BAR_TONE = ACCENT_DEEP; // a height mark is a past state
export const BAR_W = STROKE_W * 2;

// --- proportions ------------------------------------------------------------
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export type Proportions = {
  H: number;
  headD: number;
  neck: number; // the neck's visible length (0 for the child: the head sits on the body)
  neckW: number;
  legL: number; // hip joint to ankle, straight
  torsoH: number; // hip joint to the top of the torso
  torsoW: number; // the torso's mean width (three-quarter view)
  taper: number; // + = wider at the shoulders, - = wider at the belly
  torsoN: number; // superellipse exponent: round child, squarer adult
  legT: number;
  armT: number;
  armL: number; // shoulder to hand, straight
  footL: number;
  footH: number;
};

/** Everything is a fraction of the height, and every fraction is one straight
 *  line from the child (a = 0) to the adult (a = 1). Past 1 they hold. The
 *  child: a head 0.36 of its height sitting straight on a round belly, short
 *  legs. The adult: a head 0.155, a neck, shoulders wider than the hips, legs
 *  0.465 of its height. */
export const proportions = (age: number): Proportions => {
  const H = figureHeight(age);
  const a = clamp01(age);
  const headD = H * lerp(0.36, 0.155, a);
  const neck = H * lerp(0, 0.03, a);
  const legL = H * lerp(0.28, 0.465, a);
  const legT = H * lerp(0.085, 0.062, a);
  const footH = legT * 0.75;
  const headSink = headD * lerp(0.1, 0, a); // the child's head overlaps its body
  const torsoH = H - (headD - headSink) - neck - legL - footH * 0.5;
  return {
    H,
    headD,
    neck,
    neckW: H * lerp(0.1, 0.058, a),
    legL,
    torsoH,
    torsoW: H * lerp(0.245, 0.165, a),
    taper: lerp(-0.07, 0.24, a),
    torsoN: lerp(2.1, 3.6, a),
    legT,
    armT: legT * 0.82,
    armL: H * lerp(0.27, 0.37, a),
    footL: H * lerp(0.115, 0.085, a),
    footH,
  };
};

/** WHO the figure is, as prop opacities over its age. The child's props (a
 *  backpack) cross-fade out as the intern's (lanyard + ID badge, then collar +
 *  tie) cross-fade in; each window is 0.32 of age, ~13-14 frames at cut 15's
 *  walking speed. The topknot is not faded: it sinks into the head (`bun`).
 *  The drink is not faded either: it morphs (juice box -> coffee cup). */
export const identityAt = (age: number) => {
  const a = clamp01(age);
  return {
    child: 1 - smoothstep((a - 0.4) / 0.32),
    badge: smoothstep((a - 0.45) / 0.32),
    tie: smoothstep((a - 0.55) / 0.32),
    bun: smoothstep(a / 0.6), // 0 = the child's topknot up, 1 = sunk into the head
    drink: smoothstep((a - 0.35) / 0.5), // 0 = juice box, 1 = coffee cup
  };
};

/** Step length (one footfall to the next, opposite feet) as a fraction of the
 *  leg: a child's bouncy little run, an adult's stroll. */
export const strideRatio = (age: number) => lerp(1.15, 0.75, clamp01(age));
export const strideFor = (age: number) => strideRatio(age) * proportions(age).legL;

// --- the walk ---------------------------------------------------------------
// Constant-speed travel from x0 to x1 between frames f0 and f1, with a short
// smoothstep ramp in velocity at each end (a walker sets off and stops; nothing
// else eases). The gait is tied to POSITION, not to a timer: the phase is
// phi(x) = 0.25 + integral dx / (2 S(x)) with S the step length at the age the
// figure has at x, so a planted foot stays exactly where it landed while the
// figure grows over it. The near foot plants at X(n + 0.25), the far foot at
// X(n - 0.25); a swing goes from one plant to the next with a lift. The step
// scale is solved so the walk is a whole number of steps, which puts the start
// and the end on a mid-stance: one foot under the hip, the other passing it —
// so with the lift scaled by the walker's speed both feet stand together at
// x0 before and at x1 after, and nothing pops at either end.
export type Foot = { x: number; lift: number };
export type Feet = { near: Foot; far: Foot };
export type Walk = {
  x0: number;
  x1: number;
  f0: number;
  f1: number;
  hipX: (f: number) => number;
  /** 0 standing .. 1 at full walking speed: scales lift, arm swing, lean */
  gaitW: (f: number) => number;
  phase: (f: number) => number;
  feet: (f: number) => Feet;
  steps: number;
  speed: number; // world px per frame at full speed
};

export const makeWalk = ({
  x0,
  x1,
  f0,
  f1,
  easeIn = 6,
  easeOut = 8,
  ageAt,
  steps,
  liftFrac = 0.09,
}: {
  x0: number;
  x1: number;
  f0: number;
  f1: number;
  easeIn?: number;
  easeOut?: number;
  ageAt: (x: number) => number;
  /** whole steps over the walk; omit to take the nearest to the natural stride */
  steps?: number;
  /** foot lift at mid-swing, as a fraction of the height */
  liftFrac?: number;
}): Walk => {
  const D = x1 - x0;
  const T = f1 - f0;
  const V = D / (T - easeIn / 2 - easeOut / 2);
  // distance covered after t frames of the walk
  const dist = (t: number) => {
    if (t <= 0) return 0;
    if (t >= T) return D;
    const ramp = (u: number) => u * u * u - (u * u * u * u) / 2; // integral of smoothstep
    let d = V * easeIn * ramp(Math.min(1, t / easeIn));
    if (t > easeIn) d += V * (Math.min(t, T - easeOut) - easeIn);
    if (t > T - easeOut) {
      const u = (t - (T - easeOut)) / easeOut;
      d += V * easeOut * (u - ramp(u));
    }
    return d;
  };
  const speedAt = (t: number) => {
    if (t <= 0 || t >= T) return 0;
    if (t < easeIn) return smoothstep(t / easeIn);
    if (t > T - easeOut) return smoothstep((T - t) / easeOut);
    return 1;
  };
  // phase table, 1 world px resolution
  const N = Math.max(2, Math.ceil(Math.abs(D)));
  const raw: number[] = [0];
  for (let i = 1; i <= N; i++) {
    const xa = x0 + (D * (i - 1)) / N;
    const xb = x0 + (D * i) / N;
    const sa = strideFor(ageAt(xa));
    const sb = strideFor(ageAt(xb));
    raw.push(raw[i - 1] + (Math.abs(D) / N) * 0.5 * (1 / sa + 1 / sb));
  }
  const natural = raw[N]; // steps at scale 1
  const nSteps = steps ?? Math.max(1, Math.round(natural));
  const scale = natural / nSteps; // multiply stride by this
  const phis = raw.map((r) => 0.25 + r / (2 * scale));
  const s0 = strideFor(ageAt(x0)) * scale;
  const s1 = strideFor(ageAt(x1)) * scale;
  const Xof = (phi: number) => {
    if (phi <= phis[0]) return x0 + (phi - phis[0]) * 2 * s0 * Math.sign(D || 1);
    if (phi >= phis[N]) return x1 + (phi - phis[N]) * 2 * s1 * Math.sign(D || 1);
    let lo = 0;
    let hi = N;
    while (hi - lo > 1) {
      const m = (lo + hi) >> 1;
      if (phis[m] <= phi) lo = m;
      else hi = m;
    }
    const u = (phi - phis[lo]) / (phis[hi] - phis[lo]);
    return x0 + (D * (lo + u)) / N;
  };
  const phiOfX = (x: number) => {
    const i = clamp01((x - x0) / D) * N;
    const lo = Math.min(N - 1, Math.floor(i));
    return phis[lo] + (phis[lo + 1] - phis[lo]) * (i - lo);
  };
  const hipX = (f: number) => x0 + dist(f - f0);
  const gaitW = (f: number) => speedAt(f - f0);
  const phase = (f: number) => phiOfX(hipX(f));
  const footAt = (psi: number, off: number, w: number, liftH: number): Foot => {
    // psi is this foot's own phase (phi + off); its plants sit at X(n + 0.25 - off) in phi
    const n = Math.floor(psi);
    const u = psi - n;
    if (u < 0.5) return { x: Xof(n + 0.25 - off), lift: 0 };
    const s = (u - 0.5) / 0.5;
    const e = 0.5 - 0.5 * Math.cos(Math.PI * s);
    return {
      x: Xof(n + 0.25 - off) + (Xof(n + 1.25 - off) - Xof(n + 0.25 - off)) * e,
      lift: Math.sin(Math.PI * s) * liftH * w,
    };
  };
  const feet = (f: number): Feet => {
    const phi = phase(f);
    const w = gaitW(f);
    const ag = ageAt(hipX(f));
    // a child's high little knees, an adult's low step
    const liftH = liftFrac * lerp(1, 0.6, clamp01(ag)) * figureHeight(ag);
    return { near: footAt(phi, 0, w, liftH), far: footAt(phi + 0.5, 0.5, w, liftH) };
  };
  return { x0, x1, f0, f1, hipX, gaitW, phase, feet, steps: nSteps, speed: V };
};

// --- the figure ---------------------------------------------------------------
type P = { x: number; y: number };
const poly = (pts: P[]) =>
  `M${pts.map((p) => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" L")} Z`;
const line = (pts: P[]) => `M${pts.map((p) => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" L")}`;

/** A superellipse "egg" for the torso: half-width a at the bottom, a * (1 -
 *  taper) ... a * (1 + taper) towards the top, half-height b, exponent n. */
const torsoOutline = (cx: number, cy: number, a: number, b: number, n: number, taper: number, lean: number) => {
  const pts: P[] = [];
  const M = 56;
  for (let i = 0; i < M; i++) {
    const t = (i / M) * Math.PI * 2;
    const c = Math.cos(t);
    const s = Math.sin(t);
    const px = Math.sign(c) * Math.pow(Math.abs(c), 2 / n) * a;
    const py = Math.sign(s) * Math.pow(Math.abs(s), 2 / n) * b;
    const tw = 1 + taper * (-py / b); // wider at the top (py < 0)
    // lean: shear the upper half forward about the hip line (bottom)
    const shearX = lean * (b - py);
    pts.push({ x: cx + px * tw + shearX, y: cy + py });
  }
  return pts;
};

/** Two-bone IK, knee (or elbow) bending towards +x (forward). */
const knee = (h: P, a: P, l1: number, l2: number): P => {
  const dx = a.x - h.x;
  const dy = a.y - h.y;
  const d = Math.max(1e-6, Math.hypot(dx, dy));
  const dd = Math.min(d, (l1 + l2) * 0.99999);
  // distance from h along h->a to the foot of the knee's perpendicular
  const along = (l1 * l1 - l2 * l2 + dd * dd) / (2 * dd);
  const off = Math.sqrt(Math.max(0, l1 * l1 - along * along));
  const ux = dx / d;
  const uy = dy / d;
  // perpendicular with +x component for a downward-pointing limb: (uy, -ux)
  return { x: h.x + ux * along + uy * off, y: h.y + uy * along - ux * off };
};

export type FigurePose = ReturnType<typeof figurePose>;

/**
 * The figure's geometry for one frame. `x` is the hip / ground centre in world
 * px, `groundY` what the feet stand on. `feet` are world-x foot centres (from
 * `makeWalk`); omitted = standing with both feet at x. `gait` 0..1 scales arm
 * swing and lean; `breathT` is a frame clock for the idle breath.
 */
export const figurePose = ({
  x,
  groundY = GROUND_Y,
  age,
  feet,
  gait = 0,
  breathT = 0,
  drinkMorph,
  identity,
}: {
  x: number;
  groundY?: number;
  age: number;
  feet?: Feet;
  gait?: number;
  breathT?: number;
  /** 0 = juice box, 1 = coffee cup; defaults to the age's own morph */
  drinkMorph?: number;
  /** override any of `identityAt(age)` */
  identity?: Partial<ReturnType<typeof identityAt>>;
}) => {
  const id = { ...identityAt(age), ...(identity ?? {}) };
  const p = proportions(age);
  const a = clamp01(age);
  const ft: Feet = feet ?? { near: { x, lift: 0 }, far: { x, lift: 0 } };
  // standing, the far foot sits a little behind the near one so both legs
  // read; walking, the gait owns both feet. The split fades with the gait, and
  // the far foot is the swinging one at both ends of a walk, so it never slips.
  const split = p.footL * 0.42 * (1 - gait);
  const farFoot: Foot = { x: ft.far.x - split, lift: ft.far.lift };
  const nearFoot = ft.near;
  const ankleY = groundY - p.footH * 0.5;
  const hipNearX = x + p.torsoW * 0.06;
  const hipFarX = x - p.torsoW * 0.12;
  const L = p.legL;
  // highest hip both legs can reach, then lowered part way to the walk's
  // lowest point: an inverted pendulum with soft knees
  const reach = (hx: number, f: Foot) => {
    const dx = f.x - hx;
    const fy = ankleY - f.lift;
    return fy - Math.sqrt(Math.max(0, (L * 0.995) ** 2 - dx * dx));
  };
  const hipHigh = Math.max(reach(hipNearX, nearFoot), reach(hipFarX, farFoot));
  const S = strideFor(age);
  const hipLow = ankleY - Math.sqrt(Math.max(0, (L * 0.995) ** 2 - (S * 0.55) ** 2));
  const hipY = Math.max(hipHigh, lerp(hipHigh, hipLow, lerp(0.45, 0.25, a) * gait));
  const breath = 1 + 0.012 * Math.sin(breathT * 0.16);
  const lean = 0.07 * gait; // shear, forward
  const torsoTop = hipY - p.torsoH * breath;
  const torsoBottom = hipY + p.legT * 0.45;
  const tcy = (torsoTop + torsoBottom) / 2;
  const tb = (torsoBottom - torsoTop) / 2;
  const ta = p.torsoW / 2;
  const torso = torsoOutline(x, tcy, ta, tb, p.torsoN, p.taper, lean);
  const leanX = (y: number) => lean * (torsoBottom - y);
  /** the torso's front edge (max x) at height y */
  const frontAt = (y: number) => {
    const py = Math.max(-tb, Math.min(tb, y - tcy));
    const u = Math.pow(Math.abs(py / tb), p.torsoN);
    const px = ta * Math.pow(Math.max(0, 1 - u), 1 / p.torsoN);
    return x + px * (1 + p.taper * (-py / tb)) + leanX(y);
  };
  const neckBase: P = { x: x + p.torsoW * 0.1 + leanX(torsoTop), y: torsoTop + p.neckW * 0.3 };
  const headSink = p.headD * lerp(0.1, 0, a);
  const head: P = {
    x: x + p.torsoW * 0.12 + leanX(torsoTop) * 1.25,
    y: torsoTop - p.neck - p.headD * 0.5 + headSink,
  };
  const shoulder: P = {
    x: x + p.torsoW * 0.04 + leanX(torsoTop + p.torsoW * 0.25),
    y: torsoTop + p.torsoW * 0.25,
  };

  const legHalf = L / 2;
  const legs = (["far", "near"] as const).map((side) => {
    const f = side === "near" ? nearFoot : farFoot;
    const h: P = { x: side === "near" ? hipNearX : hipFarX, y: hipY };
    const an: P = { x: f.x, y: ankleY - f.lift };
    const kn = knee(h, an, legHalf, legHalf);
    return { side, hip: h, knee: kn, ankle: an };
  });

  // arms: the far arm swings against the far leg; the near arm holds the drink
  const swingAmp = 0.5 * gait;
  const farOff = (farFoot.x - x) / Math.max(1, S * 0.5);
  const th = -swingAmp * Math.max(-1.2, Math.min(1.2, farOff)); // radians from straight down, + = forward
  const upper = p.armL * 0.5;
  const fore = p.armL * 0.5;
  const farShoulder: P = { x: shoulder.x - p.torsoW * 0.16, y: shoulder.y };
  const farElbow: P = { x: farShoulder.x + Math.sin(th) * upper, y: farShoulder.y + Math.cos(th) * upper };
  const fth = th + 0.25 + 0.35 * Math.max(0, th);
  const farHand: P = { x: farElbow.x + Math.sin(fth) * fore, y: farElbow.y + Math.cos(fth) * fore };
  const nearSway = 0.05 * gait * -Math.max(-1, Math.min(1, farOff));
  // a child holds its juice box out in front; an adult carries the coffee
  // with the elbow at its side and the forearm up
  const nu = lerp(0.6, -0.12, a) + nearSway;
  const nearElbow: P = { x: shoulder.x + Math.sin(nu) * upper, y: shoulder.y + Math.cos(nu) * upper };
  const nf = lerp(1.62, 1.86, a) + nearSway * 0.5;
  const nearHand: P = { x: nearElbow.x + Math.sin(nf) * fore, y: nearElbow.y + Math.cos(nf) * fore };

  // the intern's ID: a lanyard (two strands from either side of the neck) and
  // a white badge ~43 world px tall at age 1, on the chest near its front edge
  const badgeW = p.H * 0.068;
  const badgeH = p.H * 0.088;
  const badgeTop = torsoTop + p.torsoH * lerp(0.3, 0.2, a);
  const badgeSwing = 0.006 * p.H * gait * -Math.max(-1, Math.min(1, farOff));
  const badge = {
    x: frontAt(badgeTop + badgeH * 0.5) - badgeW * 1.12 + badgeSwing,
    y: badgeTop,
    w: badgeW,
    h: badgeH,
  };
  const badgeTopC = { x: badge.x + badgeW * 0.5, y: badge.y + badgeH * 0.03 };
  const lanyards = [
    [{ x: neckBase.x - p.neckW * 0.45, y: neckBase.y - p.neckW * 0.35 }, badgeTopC],
    [{ x: neckBase.x + p.neckW * 0.4, y: neckBase.y - p.neckW * 0.3 }, badgeTopC],
  ];
  const lanyard = lanyards[1];
  // two details in the figure's far tone so the white card reads as an ID: the
  // clip slot and a photo square
  const badgeSlot = { x: badge.x + badgeW * 0.32, y: badge.y + badgeH * 0.1, w: badgeW * 0.36, h: badgeH * 0.07 };
  const badgePhoto = { x: badge.x + badgeW * 0.2, y: badge.y + badgeH * 0.3, w: badgeW * 0.42, h: badgeH * 0.36 };

  // shirt and tie: a white collar V at the neck and a tie down the shirt front
  const tieX = x - p.torsoW * 0.03 + leanX(torsoTop); // mid-chest, clear of the badge at the front
  const collar: P[] = [
    { x: tieX - p.H * 0.04, y: torsoTop + p.H * 0.004 },
    { x: tieX + p.H * 0.038, y: torsoTop + p.H * 0.004 },
    { x: tieX + p.H * 0.004, y: torsoTop + p.H * 0.058 },
  ];
  const tieTop = torsoTop + p.H * 0.022;
  const tieEnd = torsoTop + p.torsoH * 0.62;
  const tie: P[] = [
    { x: tieX - p.H * 0.011, y: tieTop },
    { x: tieX + p.H * 0.011, y: tieTop },
    { x: tieX + p.H * 0.006, y: tieTop + p.H * 0.022 },
    { x: tieX + p.H * 0.02 + leanX(tieEnd) - leanX(tieTop), y: tieEnd - p.H * 0.025 },
    { x: tieX + p.H * 0.002 + leanX(tieEnd) - leanX(tieTop), y: tieEnd },
    { x: tieX - p.H * 0.016 + leanX(tieEnd) - leanX(tieTop), y: tieEnd - p.H * 0.025 },
    { x: tieX - p.H * 0.006, y: tieTop + p.H * 0.022 },
  ];

  // the child's backpack: a white pack on the back with a strap over the
  // shoulder; it cross-fades out as the badge cross-fades in
  const bpW = p.H * 0.16;
  const bpH = p.H * 0.25;
  const bpTop = torsoTop + p.torsoH * 0.02;
  const bpCx = x - ta * (1 - Math.abs(p.taper) * 0.5) - bpW * 0.22 + leanX(bpTop + bpH / 2);
  const backpack = torsoOutline(bpCx, bpTop + bpH / 2, bpW / 2, bpH / 2, 3.2, 0, lean * 0.5);
  const strap: P[] = [
    { x: bpCx + bpW * 0.32, y: bpTop + bpH * 0.08 },
    { x: shoulder.x - p.torsoW * 0.06, y: torsoTop + p.H * 0.008 },
    { x: shoulder.x + p.torsoW * 0.14, y: torsoTop + p.torsoH * 0.38 },
  ];

  // the topknot: a little round bun on top of the child's head that sinks back
  // into the head as it grows (drawn behind the head, so it is covered, not faded)
  const bunR = p.headD * 0.17 * (1 - id.bun * 0.35);
  const bun = {
    x: head.x - p.headD * 0.08,
    y: head.y - p.headD * 0.5 * lerp(1.12, 0.45, id.bun),
    r: bunR,
  };

  // the drink: a juice box with a straw -> a lidded coffee cup
  const m = drinkMorph === undefined ? id.drink : smoothstep(drinkMorph);
  const Hd = p.H;
  // the juice box is about the cup's own size in world px, so it reads big in
  // the child's small hand
  const wTop = Hd * lerp(0.14, 0.074, m);
  const wBot = Hd * lerp(0.14, 0.056, m);
  const dh = Hd * lerp(0.19, 0.105, m);
  const lidH = Hd * 0.02 * m;
  const lidW = wTop * 1.12;
  const dcx = nearHand.x + wTop * 0.12;
  const dBottom = nearHand.y + dh * 0.42;
  const dTop = dBottom - dh;
  const drinkBody: P[] = [
    { x: dcx - wTop / 2, y: dTop },
    { x: dcx + wTop / 2, y: dTop },
    { x: dcx + wBot / 2, y: dBottom },
    { x: dcx - wBot / 2, y: dBottom },
  ];
  const lid: P[] = [
    { x: dcx - lidW / 2, y: dTop - lidH },
    { x: dcx + lidW / 2, y: dTop - lidH },
    { x: dcx + lidW / 2, y: dTop + 0.001 },
    { x: dcx - lidW / 2, y: dTop + 0.001 },
  ];
  const strawL = Hd * 0.1 * (1 - m);
  const straw: P[] = [
    { x: dcx + wTop * 0.2, y: dTop },
    { x: dcx + wTop * 0.2 + strawL * 0.3, y: dTop - strawL },
  ];

  const foot = (side: "near" | "far") => {
    const an = legs.find((l) => l.side === side)!.ankle;
    return { cx: an.x + p.footL * 0.22, cy: an.y, rx: p.footL / 2, ry: p.footH / 2 };
  };

  // the torso's back edge: what the height marks emerge from behind
  const backX = x - ta * (1 - Math.abs(p.taper));

  return {
    p,
    torso,
    head,
    headR: p.headD / 2,
    neck: [neckBase, head],
    legs,
    farArm: [farShoulder, farElbow, farHand],
    nearArm: [shoulder, nearElbow, nearHand],
    footNear: foot("near"),
    footFar: foot("far"),
    id,
    badge,
    badgeSlot,
    badgePhoto,
    lanyard,
    lanyards,
    collar,
    tie,
    backpack,
    strap,
    bun,
    drinkBody,
    lid,
    lidH,
    straw,
    strawL,
    backX,
    top: head.y - p.headD / 2,
  };
};

/**
 * The AI figure. SVG <g>, world px. `toneT` 0..1 picks the fill along
 * deep -> ripe (defaults to the age). `dashed` draws the same silhouette as a
 * dashed orange outline with no fill — the forecast copy (needs a unique `id`).
 */
export const AiFigure: React.FC<{
  id: string;
  k: number;
  x: number;
  groundY?: number;
  age: number;
  feet?: Feet;
  gait?: number;
  breathT?: number;
  toneT?: number;
  drinkMorph?: number;
  dashed?: boolean;
  dashOffset?: number;
  opacity?: number;
  /** override any of `identityAt(age)` (prop opacities / morphs) */
  identity?: Partial<ReturnType<typeof identityAt>>;
}> = ({
  id,
  k,
  x,
  groundY,
  age,
  feet,
  gait,
  breathT,
  toneT,
  drinkMorph,
  dashed = false,
  dashOffset = 0,
  opacity = 1,
  identity,
}) => {
  const g = figurePose({ x, groundY, age, feet, gait, breathT, drinkMorph, identity });
  const t = toneT ?? clamp01(age);
  const near = FIGURE_TONE(t);
  const far = FIGURE_TONE_FAR(t);
  const { p } = g;
  const limb = (pts: P[], w: number, color: string, key: string) => (
    <path key={key} d={line(pts)} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
  );
  const legPts = (side: "near" | "far") => {
    const l = g.legs.find((q) => q.side === side)!;
    return [l.hip, l.knee, l.ankle];
  };
  const body = (farC: string, nearC: string) => (
    <>
      {limb(g.farArm, p.armT, farC, "fa")}
      {limb(legPts("far"), p.legT, farC, "fl")}
      <ellipse cx={g.footFar.cx} cy={g.footFar.cy} rx={g.footFar.rx} ry={g.footFar.ry} fill={farC} />
      {g.id.child > 0.004 ? <path d={poly(g.backpack)} fill={INK} opacity={g.id.child} /> : null}
      {limb(g.neck, p.neckW, nearC, "nk")}
      <path d={poly(g.torso)} fill={nearC} />
      <circle cx={g.bun.x} cy={g.bun.y} r={g.bun.r} fill={nearC} />
      <circle cx={g.head.x} cy={g.head.y} r={g.headR} fill={nearC} />
      {limb(legPts("near"), p.legT, nearC, "nl")}
      <ellipse cx={g.footNear.cx} cy={g.footNear.cy} rx={g.footNear.rx} ry={g.footNear.ry} fill={nearC} />
    </>
  );
  const tieC = FIGURE_TONE_TIE(t);
  const rectAt = (r: { x: number; y: number; w: number; h: number }, fill: string) => (
    <path d={squirclePath(r.w, r.h)} transform={`translate(${r.x.toFixed(2)} ${r.y.toFixed(2)})`} fill={fill} />
  );
  // shirt and tie under the near arm; strap over the torso; badge over all
  const shirt =
    g.id.tie > 0.004 ? (
      <g opacity={g.id.tie}>
        <path d={poly(g.collar)} fill={INK} strokeLinejoin="round" stroke={INK} strokeWidth={p.H * 0.004} />
        <path d={poly(g.tie)} fill={tieC} />
      </g>
    ) : null;
  const strap =
    g.id.child > 0.004 ? (
      <path
        d={line(g.strap)}
        fill="none"
        stroke={INK}
        strokeWidth={p.H * 0.024}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={g.id.child}
      />
    ) : null;
  const props =
    g.id.badge > 0.004 ? (
      <g opacity={g.id.badge}>
        {g.lanyards.map((l, i) => (
          <path key={i} d={line(l)} fill="none" stroke={INK} strokeWidth={p.H * 0.009} strokeLinecap="round" />
        ))}
        {rectAt(g.badge, INK)}
        {rectAt(g.badgeSlot, far)}
        {rectAt(g.badgePhoto, far)}
      </g>
    ) : null;
  const nearArm = limb(g.nearArm, p.armT, near, "na");
  const drink = (
    <>
      {g.strawL > 0.3 ? (
        <path d={line(g.straw)} fill="none" stroke={INK} strokeWidth={p.H * 0.016} strokeLinecap="round" />
      ) : null}
      <path d={poly(g.drinkBody)} fill={INK} strokeLinejoin="round" stroke={INK} strokeWidth={p.H * 0.004} />
      {g.lidH > 0.05 ? <path d={poly(g.lid)} fill={INK} stroke={INK} strokeWidth={p.H * 0.004} strokeLinejoin="round" /> : null}
    </>
  );

  if (!dashed) {
    return (
      <g style={{ filter: iconShadow(k) }} opacity={opacity}>
        {body(far, near)}
        {shirt}
        {strap}
        {nearArm}
        {props}
        {drink}
      </g>
    );
  }
  // dashed: stroke every part's outline with dashes, then mask out the
  // silhouette's interior so only its outer edge is left
  const dash = STROKE_W * 2.2;
  const sw = STROKE_W * 2; // half of it is masked away, so it reads at STROKE_W
  const outline = (
    <g fill="none" stroke={near} strokeWidth={sw} strokeDasharray={`${dash} ${dash * 0.7}`} strokeDashoffset={dashOffset}>
      <path d={poly(g.torso)} />
      <circle cx={g.head.x} cy={g.head.y} r={g.headR} />
    </g>
  );
  return (
    <g style={{ filter: iconShadow(k) }} opacity={opacity}>
      <defs>
        <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x={-20000} y={-20000} width={40000} height={40000}>
          <rect x={-20000} y={-20000} width={40000} height={40000} fill="white" />
          <g fill="black" stroke="black">
            <path d={poly(g.torso)} strokeWidth={0} />
            <circle cx={g.head.x} cy={g.head.y} r={g.headR} strokeWidth={0} />
          </g>
        </mask>
      </defs>
      <g mask={`url(#${id}-m)`}>
        {outline}
        {[g.farArm, legPts("far"), legPts("near"), g.nearArm].map((pts, i) => (
          <path
            key={i}
            d={line(pts)}
            fill="none"
            stroke={near}
            strokeWidth={STROKE_W}
            strokeDasharray={`${dash} ${dash * 0.7}`}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
          />
        ))}
      </g>
    </g>
  );
};

// --- the axis, drawn ----------------------------------------------------------
/** The rule from x0 to headX (head-led), and a tick at every year it has passed
 *  (each drops TICK_LEN over TICK_DRAW frames from the frame the head reaches
 *  it, `tickFrame(year)`). SVG, world px. */
export const TimelineRule: React.FC<{
  k: number;
  frame: number;
  x0: number;
  headX: number;
  years: number[];
  tickFrame: (year: number) => number;
  opacity?: number;
}> = ({ k, frame, x0, headX, years, tickFrame, opacity = INK_HI }) => {
  const y = Math.round(RULE_Y) + 0.5;
  return (
    <g style={{ filter: iconShadow(k) }} opacity={opacity}>
      {headX > x0 ? (
        <line x1={x0} y1={y} x2={headX} y2={y} stroke={INK} strokeWidth={STROKE_W} strokeLinecap="round" />
      ) : null}
      {years.map((yr) => {
        const u = clamp01((frame - tickFrame(yr)) / TICK_DRAW);
        if (u <= 0 || yearX(yr) > headX) return null;
        const e = 1 - (1 - u) * (1 - u);
        return (
          <line
            key={yr}
            x1={yearX(yr)}
            y1={y}
            x2={yearX(yr)}
            y2={y + TICK_LEN * e}
            stroke={INK}
            strokeWidth={STROKE_W}
            strokeLinecap="round"
          />
        );
      })}
    </g>
  );
};

/** The year labels, DOM (put in the world div). Each slides up while fading in
 *  from `tickFrame(year)`. */
export const YearLabels: React.FC<{
  k: number;
  frame: number;
  years: number[];
  tickFrame: (year: number) => number;
  opacity?: number;
}> = ({ k, frame, years, tickFrame, opacity = INK_HI }) => (
  <>
    {years.map((yr) => (
      <Label
        key={yr}
        k={k}
        x={yearX(yr)}
        y={RULE_Y + YEAR_LABEL_DY}
        text={String(yr)}
        f0={tickFrame(yr)}
        frame={frame}
        size={YEAR_LABEL_SIZE}
        opacity={opacity}
      />
    ))}
  </>
);

/** A height mark: a thin ACCENT_DEEP bar standing on the rule at x, h tall,
 *  visible only left of `revealX` (the walker's torso back edge, so it comes
 *  out from behind the figure). `dashed` = the forecast copy. SVG, world px. */
export const HeightBar: React.FC<{
  id: string;
  x: number;
  h: number;
  revealX?: number;
  dashed?: boolean;
  dashOffset?: number;
  color?: string;
  width?: number;
}> = ({ id, x, h, revealX = Infinity, dashed = false, dashOffset = 0, color = BAR_TONE, width = BAR_W }) => {
  const left = x - width / 2;
  if (revealX <= left || h <= 0) return null;
  const top = GROUND_Y - h;
  if (dashed) {
    return (
      <line
        x1={x}
        y1={GROUND_Y}
        x2={x}
        y2={top + width / 2}
        stroke={color}
        strokeWidth={width}
        strokeDasharray={`${width * 1.6} ${width * 1.1}`}
        strokeDashoffset={dashOffset}
      />
    );
  }
  const clip = Math.min(width, revealX - left);
  return (
    <g>
      <defs>
        <clipPath id={`${id}-c`}>
          <rect x={left - 1} y={top - 2} width={clip + 1} height={h + STROKE_W + 4} />
        </clipPath>
      </defs>
      <path
        d={squirclePath(width, h + STROKE_W / 2)}
        transform={`translate(${left.toFixed(3)} ${top.toFixed(3)})`}
        fill={color}
        clipPath={clip < width ? `url(#${id}-c)` : undefined}
      />
    </g>
  );
};

// --- cut 15's camera -------------------------------------------------------------
// One coarse key track through the kit's damped follow, k / cy / cx all keyed
// per frame. cy is solved from the rule's target SCREEN y and k, so the rule
// (and the year labels under it, which must stay above the caption band at
// 1080) is placed exactly at every zoom.
export const CAM15 = {
  open: { k: 1.3, cx: X_2022 + (540 - 430) / 1.3, ruleScreenY: 948 },
  rest: { k: 1.0, cx: 503, ruleScreenY: 980 },
  end: { k: 1.02, cx: 510, ruleScreenY: 982 },
  pullF1: 38, // the pull-back's keys end here (the damper settles it ~f46)
  creepF1: 103,
};
const cyFor = (k: number, ruleScreenY: number) => RULE_Y - (ruleScreenY - 960) / k;
const CAM15_F: number[] = [];
const CAM15_K: number[] = [];
const CAM15_CX: number[] = [];
const CAM15_CY: number[] = [];
for (let f = 0; f <= CAM15.creepF1; f++) {
  const a = f <= CAM15.pullF1 ? CAM15.open : CAM15.rest;
  const b = f <= CAM15.pullF1 ? CAM15.rest : CAM15.end;
  const u =
    f <= CAM15.pullF1
      ? camEase(f / CAM15.pullF1, 0.65)
      : camEase((f - CAM15.pullF1) / (CAM15.creepF1 - CAM15.pullF1), 1);
  const k = lerp(a.k, b.k, u);
  CAM15_F.push(f);
  CAM15_K.push(k);
  CAM15_CX.push(lerp(a.cx, b.cx, u));
  CAM15_CY.push(cyFor(k, lerp(a.ruleScreenY, b.ruleScreenY, u)));
}
/** cut 15's camera at frame f (before sway): the same damper as `runCamera`,
 *  run on cx too. */
export const cam15 = (upto: number) => {
  let k = CAM15_K[0];
  let cy = CAM15_CY[0];
  let cx = CAM15_CX[0];
  let vk = 0;
  let vy = 0;
  let vx = 0;
  for (let f = 1; f <= upto; f++) {
    const tk = interpolate(f, CAM15_F, CAM15_K, clamp);
    const ty = interpolate(f, CAM15_F, CAM15_CY, clamp);
    const tx = interpolate(f, CAM15_F, CAM15_CX, clamp);
    vk += (tk - k) * CAM_STIFF - vk * CAM_DAMP;
    k += vk;
    vy += (ty - cy) * CAM_STIFF - vy * CAM_DAMP;
    cy += vy;
    vx += (tx - cx) * CAM_STIFF - vx * CAM_DAMP;
    cx += vx;
  }
  return { k, cx, cy };
};
export const CAM15_CX0 = CAM15_CX[0];
export const CAM15_CY0 = CAM15_CY[0];
