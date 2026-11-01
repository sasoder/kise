// ---------------------------------------------------------------------------
// RobotsBuildItAll (sam-self-replicating, cut 47). Cheeky Pint style (stout) (styles/cheeky-pint.md).
// Opaque 1080x1920, 23.976 fps, 158 frames.
//
// CHECK LINE: "AI drives robots, the robots put up everything a data center needs, and a new robot walks out of the
// data center: it copies itself."
//
// THE LINE: "This idea that you can use AI to control robots and run fabs and build turbines or solar panels and
// build data centers."
// WORD -> FRAME: idea 0 · that 6 · you 12 · can 14 · use 17 · AI 25 · to 34 · control 41 · robots 51 · and 58 · run 66 ·
// fabs 73 · and 84 · build 84 · turbines 92 · or 99 · solar 106 · panels 112 · and 121 · build 128 · data 138 ·
// centers 143 · But 153
// DURATION: the slot 47.297 -> 53.887 s = 6.590 s x 23.976 = 158 frames (f0..f157).
//
// THE MOTION: a pop-up book. One long floor with a fold line; the camera trucks right at an even, eased speed from f0
// and pulls back at the end. Flat cards lie on the floor ahead (their dark backs) and each hinges up on the fold as
// the amber cable's tip reaches it, with the three robots jogging along behind the tip, feet locked to the floor.
// Contacts: plug -> first robot's heel f27-32 (it starts to stand f29, light f40); tip -> fab f50 (hinge f52); plug into
// the hall's socket f135 (LEDs f135+). Payoff: door opens f139, a new robot steps forward f144-153, chest light f147-152.
// AMBER = compute: the cable and everything it powers; cream = the subject, board = context.
//
// SOURCES: OpenAI mark via OpenAISlotTile (sam-pricing-tokens/pricingShared, read-only). No figures.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { COLOR, EDGE, LightSweep, StoutStage, bloomFilter, clamp01, lerp, mixHex, rectPath, smoothstep } from "../kits/cheeky-pint/stoutShared";
import { restToRest } from "../kits/cheeky-pint/museShared";
import { DepthPlane, OpenAISlotTile, type Cam } from "../sam-pricing-tokens/pricingShared";

export const FPS = 24000 / 1001;
export const DURATION = 158;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// ---------------------------------------------------------------------------
// THE WORLD (world px; station art is drawn in x = world, y = height above the fold, negative up)
// ---------------------------------------------------------------------------
const FOLD = 1010; // where the back page meets the floor
const FEET = FOLD + 38; // where the robots walk
const CABLE = FOLD + 24; // where the cable lies
const F = 0.3; // how much a card lying flat on the floor foreshortens
const BACK = mixHex(COLOR.ground, COLOR.board, 0.42); // a flat card's back: dark until its line
const TILE_X = 420;
const TILE_SIZE = 460;
const FAB = { x0: 1450, x1: 2390, h: 320, doorX: 1570, doorW: 172, doorH: 286, cx: 1930, cy: -165, wx: 2205, wr: 88 };
const T1 = { x: 2470, H: 720, R: 280 };
const T2 = { x: 2810, H: 650, R: 250 };
const SOLAR = { x0: 2960, pitch: 104, n: 5, w: 92, h: 132, post: 96 };
const HALL = { x0: 3430, x1: 4430, h: 620, doorX: 3850, doorW: 184, doorH: 306, socketX: 3472, socketY: -110 };
const NEW_X = HALL.doorX;

// Beats (frames). Landings settle a few frames before their word.
const HINGE = {
  robotC: [29, 43],
  robotB: [32, 46],
  robotA: [35, 49],
  fab: [52, 68],
  t1: [78, 92],
  t2: [90, 104],
  hall: [118, 133],
} as const;
const SOLAR_F0 = 104;
const SOLAR_STEP = 2.5;
const SOLAR_DUR = 9;
const SWEEP_F = [117, 129] as const;
const PLUG_F = [131, 135] as const;
const LED_F = [135, 142] as const;
const DOOR_F = [139, 147] as const;
const NEW_F0 = 144;
const NEW_LIGHT = 147;

// ---------------------------------------------------------------------------
// THE CAMERA: an even truck (one speed profile, integrated), a final pull-back on its own ease
// ---------------------------------------------------------------------------
const N = 175;
const LOOK_X0 = 540;
const LOOK_X1 = HALL.doorX;
const speedShape = (f: number) => smoothstep((f + 2) / 40) * (1 - smoothstep((f - 122) / 34)) + 0.05 * smoothstep((f - 130) / 20);
const LOOK = (() => {
  const raw = [0];
  for (let f = 1; f < N; f++) raw.push(raw[f - 1] + speedShape(f - 0.5));
  const V = (LOOK_X1 - LOOK_X0) / raw[157];
  return raw.map((v) => LOOK_X0 + v * V);
})();
const camAt = (f: number): Cam => {
  const i = Math.max(0, Math.min(N - 1, f));
  const zoom = Math.exp(lerp(Math.log(1.06), Math.log(1), smoothstep(i / 116)) + Math.log(0.86) * smoothstep((i - 116) / 50));
  return { x: LOOK[i], y: lerp(960, 918, smoothstep((i - 112) / 50)), k: zoom };
};
const REST = camAt(0);

// ---------------------------------------------------------------------------
// THE CABLE TIP (a smoothed keyed track; state of everything it reaches reads this)
// ---------------------------------------------------------------------------
const box = (v: number[], r: number) =>
  v.map((_, i) => {
    let sum = 0;
    for (let d = -r; d <= r; d++) sum += v[Math.max(0, Math.min(v.length - 1, i + d))];
    return sum / (2 * r + 1);
  });
const TIP_KEYS: [number, number][] = [
  [0, 600],
  [27, 905], // the plug reaches the first robot's heel, dwells, comes out at its toe
  [32, 925],
  [52, 1480],
  [78, 2420],
  [90, 2740],
  [103, 2980],
  [120, 3440],
  [125, HALL.socketX],
  [N, HALL.socketX],
];
const TIP = (() => {
  const line: number[] = [];
  for (let f = 0; f < N; f++) {
    const j = TIP_KEYS.findIndex((key, i) => f >= key[0] && f <= TIP_KEYS[i + 1][0]);
    const [a, b] = [TIP_KEYS[j], TIP_KEYS[j + 1]];
    line.push(lerp(a[1], b[1], (f - a[0]) / (b[0] - a[0])));
  }
  return box(box(line, 3), 3);
})();
const cableY = (x: number) => CABLE + 4 * Math.sin(x / 170) + 2.5 * Math.sin(x / 61 + 1);

// ---------------------------------------------------------------------------
// THE ROBOTS' WORLD PATHS (derived from the camera, so they stay in the shot; the gait is derived from distance)
// ---------------------------------------------------------------------------
type Path = { x: number[]; s: number[]; v: number[] };
const keyed = (keys: [number, number][]) => {
  const all: [number, number][] = [[0, keys[0][1]], ...keys, [N, keys[keys.length - 1][1]]];
  const line: number[] = [];
  for (let f = 0; f < N; f++) {
    const j = all.findIndex((key, i) => i < all.length - 1 && f >= key[0] && f <= all[i + 1][0]);
    const [a, b] = [all[j], all[j + 1]];
    line.push(b[0] === a[0] ? a[1] : lerp(a[1], b[1], (f - a[0]) / (b[0] - a[0])));
  }
  return line;
};
const pathOf = (x: number[]): Path => {
  const s = [0];
  const v = [0];
  for (let f = 1; f < N; f++) {
    s.push(s[f - 1] + Math.abs(x[f] - x[f - 1]));
    v.push(Math.abs(x[f] - x[f - 1]));
  }
  return { x, s, v };
};
// The team walks on the left of the frame behind the tip, so each station stands in the clear ahead of it; the pair
// falls a little behind the camera so the hall's socket is clear at f135, then catches up at the hall.
const PATH_A = pathOf(box(box(keyed([[48, 1320], [62, 1490], [72, FAB.doorX - 6]]), 3), 3));
const PATH_B = pathOf(box(box(keyed([[46, 1150], [70, 1600], [135, 3350], [146, 3570], [153, 3600]]), 4), 2));
const PATH_C = pathOf(box(box(keyed([[44, 980], [70, 1420], [135, 3170], [146, 3400], [153, 3440]]), 4), 2));
const PATH_NEW = pathOf(Array.from({ length: N }, (_, f) => NEW_X + 130 * restToRest((f - NEW_F0) / 10, 1.6)));
const Y_A = Array.from({ length: N }, (_, f) => lerp(FEET, FOLD + 12, smoothstep((f - 60) / 14)));
const Y_FLAT = Array.from({ length: N }, () => FEET);
const NEW_T = Array.from({ length: N }, (_, f) => smoothstep((f - NEW_F0) / 9));
const Y_NEW = NEW_T.map((t) => lerp(FOLD - 2, FEET + 34, t));
const SCALE_NEW = NEW_T.map((t) => lerp(0.9, 1.16, t));

// THE FOOT PLANNER: feet are planted in the WORLD and only ever move while swinging, so a planted foot cannot slide.
// The rear foot lifts when the body has left it `reach` behind, and lands `reach` ahead of where the body will be.
export const REACH = 46;
type Plan = { x: [number[], number[]]; y: [number[], number[]]; bob: number[]; lean: number[] };
const planFeet = (px: number[], py: number[]): Plan => {
  const at = (v: number[], f: number) => v[Math.max(0, Math.min(N - 1, f))];
  const foot = [
    { x: px[0] - 12, y: py[0] },
    { x: px[0] + 12, y: py[0] },
  ];
  let swing: { i: number; f0: number; D: number; x0: number; y0: number; x1: number; y1: number } | null = null;
  const plan: Plan = { x: [[], []], y: [[], []], bob: [], lean: [] };
  for (let f = 0; f < N; f++) {
    const v = Math.abs(at(px, f + 4) - px[f]) / 4;
    const reach = lerp(12, REACH, smoothstep(v / 14));
    if (!swing) {
      const rear = foot[0].x <= foot[1].x ? 0 : 1;
      const front = 1 - rear;
      const start = (i: number, side: number) => {
        const D = Math.max(3, Math.min(7, Math.round((2 * reach) / Math.max(v, 1))));
        // f0 = f - 1: it moves this very frame, so no frame is lost between steps and the stride cannot grow
        swing = { i, f0: f - 1, D, x0: foot[i].x, y0: foot[i].y, x1: at(px, f + D - 1) + side * reach, y1: at(py, f + D - 1) };
      };
      if (px[f] - foot[rear].x > reach + 0.5) start(rear, 1);
      else if (foot[front].x - px[f] > reach + 12) start(front, -1);
    }
    let bob = 0;
    const lifted = [0, 0];
    if (swing) {
      const sw: { i: number; f0: number; D: number; x0: number; y0: number; x1: number; y1: number } = swing;
      const u = (f - sw.f0) / sw.D;
      foot[sw.i].x = lerp(sw.x0, sw.x1, smoothstep(u));
      foot[sw.i].y = lerp(sw.y0, sw.y1, smoothstep(u));
      lifted[sw.i] = 30 * Math.sin(Math.PI * u);
      bob = -5 * Math.sin(Math.PI * u);
      if (u >= 1) swing = null;
    }
    for (const i of [0, 1]) {
      plan.x[i].push(foot[i].x);
      plan.y[i].push(foot[i].y - lifted[i]);
    }
    plan.bob.push(bob);
    plan.lean.push(3.5 * smoothstep(v / 12));
  }
  return plan;
};
export const PLAN_A = planFeet(PATH_A.x, Y_A);
export const PLAN_B = planFeet(PATH_B.x, Y_FLAT);
export const PLAN_C = planFeet(PATH_C.x, Y_FLAT);
export const PLAN_NEW = planFeet(PATH_NEW.x, Y_NEW);

// ---------------------------------------------------------------------------
// SMALL HELPERS
// ---------------------------------------------------------------------------
const num = (v: number) => (Math.round(v * 1000) / 1000).toString();
/** The flat-to-standing hinge: the card's screen height factor, negative while it lies on the floor toward the viewer. */
const hingeSy = (f: number, f0: number, f1: number) => {
  const a = (Math.PI / 2) * restToRest((f - f0) / (f1 - f0), 2.2);
  return Math.sin(a) - F * Math.cos(a);
};
/** Tone as a card rises into the light: board, then cream. */
const riseDim = (sy: number) => 1 - smoothstep(sy / 0.8);
const cream = (dim: number) => mixHex(COLOR.cream, COLOR.board, dim);
const creamFoot = (dim: number) => mixHex(COLOR.creamFoot, COLOR.boardFoot, dim);
const rectD = (x: number, y: number, w: number, h: number, r = 4) => rectPath(x, y, w, h, r);

/** ONE cast shadow: the object's silhouette laid on the floor, down and right of the key light; it grows as the card stands. */
const FloorShadow: React.FC<{ d: string; sy: number }> = ({ d, sy }) => {
  if (sy <= 0.01) return null;
  const c = -0.1 * sy;
  const e = -0.13 * sy;
  return (
    <g style={{ filter: "blur(7px)" }} opacity={0.62} fill={COLOR.shadow}>
      <g transform={`translate(0 ${FOLD}) matrix(1 0 ${num(c)} ${num(e)} 0 0)`}>
        <path d={d} />
      </g>
    </g>
  );
};

/** A card on its hinge: the back while it lies flat, the shadow and the face once it stands. */
const Hinged: React.FC<{ sy: number; sil: string; children: React.ReactNode }> = ({ sy, sil, children }) => {
  const tf = `translate(0 ${FOLD}) scale(1 ${num(sy)})`;
  if (sy <= 0) {
    return (
      <g transform={tf}>
        <path d={sil} fill={BACK} />
      </g>
    );
  }
  return (
    <g>
      <FloorShadow d={sil} sy={sy} />
      <g transform={tf}>{children}</g>
    </g>
  );
};

// ---------------------------------------------------------------------------
// PARALLAX: two dark rolling card layers behind the fold
// ---------------------------------------------------------------------------
const hillPath = (amp: number, base: number, seed: number) => {
  let d = `M-3000 ${FOLD + 900}`;
  for (let x = -3000; x <= 7000; x += 40) {
    const y = FOLD - base - amp * (0.5 + 0.32 * Math.sin(x / 410 + seed) + 0.18 * Math.sin(x / 173 + seed * 2.1));
    d += `L${x} ${num(y)}`;
  }
  return `${d}L7000 ${FOLD + 900}Z`;
};
const HILL_FAR = hillPath(240, 90, 0.7);
const HILL_MID = hillPath(130, 30, 2.4);

// ---------------------------------------------------------------------------
// THE ROBOT: a picture-book card, side-on, feet at (0, 0), 280 tall
// ---------------------------------------------------------------------------
const LimbPath: React.FC<{ x0: number; y0: number; x1: number; y1: number; w: number; color: string }> = ({ x0, y0, x1, y1, w, color }) => (
  <path d={`M${num(x0)} ${num(y0)}L${num(x1)} ${num(y1)}`} stroke={color} strokeWidth={w} strokeLinecap="round" fill="none" />
);
const Robot: React.FC<{
  x: number;
  y: number;
  plan: Plan;
  sy?: number;
  scale?: number;
  light: number;
  k: number;
  f: number;
  seed: number;
}> = ({ x, y, plan, sy = 1, scale = 1, light, k, f, seed }) => {
  const flat = sy <= 0;
  const dim = flat ? 0 : riseDim(sy);
  const skin = flat ? BACK : cream(dim);
  const skinFoot = flat ? BACK : creamFoot(dim);
  const far = flat ? BACK : mixHex(COLOR.board, COLOR.boardFoot, 0.5);
  // feet come from the world plan: local = (world - body) / scale
  const back = { x: (plan.x[0][f] - x) / scale, y: (plan.y[0][f] - y) / scale };
  const near = { x: (plan.x[1][f] - x) / scale, y: (plan.y[1][f] - y) / scale };
  const idle = 1.5 * Math.sin(f / 13 + seed) * (1 - clamp01(plan.lean[f] / 3.5));
  const bob = plan.bob[f] + idle;
  const hipY = -68 + bob;
  const shoulderY = -140 + bob;
  const handSwing = Math.max(-34, Math.min(34, (back.x - near.x) * 0.34));
  const lean = plan.lean[f];
  const visor = flat ? BACK : mixHex(COLOR.inkDark, COLOR.board, dim * 0.7);
  const shoe = flat ? BACK : mixHex(COLOR.boardFoot, COLOR.inkDark, 0.28);
  const chestOff = mixHex(COLOR.inkDark, COLOR.board, 0.35);
  const eye = mixHex(COLOR.board, COLOR.cream, clamp01(light * 1.5));
  const lt = clamp01(light);
  return (
    <g>
      {!flat ? (
        <ellipse
          cx={x + 16 * sy}
          cy={Math.max(plan.y[0][f], plan.y[1][f]) + 2}
          rx={92 * scale}
          ry={13 * scale}
          fill={COLOR.shadow}
          opacity={0.55 * clamp01(sy)}
          style={{ filter: "blur(5px)" }}
        />
      ) : null}
      <g transform={`translate(${num(x)} ${num(y)}) scale(${num(scale)} ${num(scale * sy)})`}>
        {/* far arm, far leg */}
        <LimbPath x0={-6} y0={shoulderY} x1={-6 - handSwing} y1={shoulderY + 66} w={24} color={far} />
        <LimbPath x0={-8} y0={hipY} x1={back.x - 8} y1={back.y - 20} w={30} color={far} />
        <path d={rectD(back.x - 8 - 24, back.y - 22, 56, 22, 10)} fill={flat ? BACK : mixHex(shoe, COLOR.board, 0.3)} />
        <g transform={`rotate(${num(lean)} 0 ${num(hipY)})`}>
          {/* body */}
          <path d={rectD(-54, -162 + bob, 108, 100, 30)} fill={skinFoot} />
          {/* antenna */}
          <path d={`M-22 ${num(-282 + bob)}V${num(-300 + bob)}`} stroke={far} strokeWidth={8} strokeLinecap="round" />
          <circle cx={-22} cy={-306 + bob} r={10} fill={far} />
          {/* head */}
          <path d={rectD(-80, -284 + bob, 160, 124, 50)} fill={skin} />
          {!flat ? (
            <>
              <path d={rectD(-16, -256 + bob, 84, 62, 28)} fill={visor} />
              <circle cx={32} cy={-226 + bob} r={10} fill={eye} />
              {/* the chest light */}
              <circle cx={26} cy={-112 + bob} r={21} fill={chestOff} />
              {lt > 0.01 ? (
                <g style={{ filter: bloomFilter(k) }} opacity={lt}>
                  <circle cx={26} cy={-112 + bob} r={18} fill={COLOR.amberTop} />
                  <circle cx={22} cy={-117 + bob} r={6} fill={COLOR.amberHot} />
                </g>
              ) : null}
            </>
          ) : null}
        </g>
        {/* near leg, near arm */}
        <LimbPath x0={6} y0={hipY} x1={near.x + 6} y1={near.y - 20} w={30} color={skinFoot} />
        <path d={rectD(near.x + 6 - 24, near.y - 22, 56, 22, 10)} fill={shoe} />
        <LimbPath x0={-24} y0={shoulderY} x1={-24 + handSwing * 0.8} y1={shoulderY + 62} w={24} color={skin} />
      </g>
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE FAB
// ---------------------------------------------------------------------------
const FAB_W = FAB.x1 - FAB.x0;
// A long, low plant (about 3x wider than tall) under real roof ducting: a long main duct on risers, a second run above
// it, air-handling boxes and two stacks. The hero on the facade is the chip: a square die with pins all round.
const RISERS = [70, 210, 350, 490, 630, 770];
const FAB_SIL = [
  rectD(FAB.x0, -FAB.h, FAB_W, FAB.h, 10),
  rectD(FAB.x0 + 40, -FAB.h - 68, FAB_W - 80, 36, 12),
  ...RISERS.map((o) => rectD(FAB.x0 + o, -FAB.h - 36, 24, 40, 2)),
  rectD(FAB.x0 + 250, -FAB.h - 116, 430, 28, 10),
  ...[290, 460, 630].map((o) => rectD(FAB.x0 + o, -FAB.h - 92, 20, 28, 2)),
  rectD(FAB.x0 + 96, -FAB.h - 136, 50, 72, 6),
  rectD(FAB.x0 + 170, -FAB.h - 108, 44, 44, 6),
  rectD(FAB.x1 - 150, -FAB.h - 112, 92, 48, 8),
].join("");
const FAB_FLANGES = [130, 300, 470, 640, 810].map((o) => rectD(FAB.x0 + o, -FAB.h - 70, 9, 40, 1)).join("");
const PKG = 98; // the chip's half size
const PINS = Array.from({ length: 7 }, (_, i) => -PKG + 20 + (i * (2 * PKG - 40)) / 6);
const PIN_D = PINS.flatMap((p) => [
  rectD(p - 7, -PKG - 26, 14, 30, 2),
  rectD(p - 7, PKG - 4, 14, 30, 2),
  rectD(-PKG - 26, p - 7, 30, 14, 2),
  rectD(PKG - 4, p - 7, 30, 14, 2),
]).join("");
const DIES = (() => {
  const out: { x: number; y: number; r: number }[] = [];
  const pitch = 19;
  for (let i = -5; i <= 5; i++) {
    for (let j = -5; j <= 5; j++) {
      const x = i * pitch;
      const y = j * pitch;
      const far = Math.max(Math.hypot(x - 8, y - 8), Math.hypot(x + 8, y - 8), Math.hypot(x - 8, y + 8), Math.hypot(x + 8, y + 8));
      if (far < FAB.wr - 10) out.push({ x, y, r: Math.hypot(x, y) });
    }
  }
  return out;
})();
const Fab: React.FC<{ sy: number; f: number; k: number }> = ({ sy, f, k }) => {
  // the wall recedes by tone once it stands, so a cream robot in front of it stays the subject
  const dim = Math.max(riseDim(sy), 0.42 * smoothstep((f - 62) / 10));
  const seam = mixHex(COLOR.creamFoot, COLOR.boardFoot, 0.55);
  const duct = mixHex(COLOR.board, COLOR.cream, 0.22 * (1 - dim));
  const chipOn = smoothstep((f - 64) / 7); // lit before "fabs" (f73)
  const wave = lerp(-10, FAB.wr + 30, smoothstep((f - 67) / 10));
  const offTone = mixHex(COLOR.inkDark, COLOR.board, 0.42);
  return (
    <Hinged sy={sy} sil={FAB_SIL}>
      {/* the roof ducting, behind the facade */}
      <path d={FAB_SIL} fill={duct} />
      <path d={FAB_FLANGES} fill={mixHex(duct, COLOR.shadow, 0.26)} />
      <linearGradient id="fabFace" gradientUnits="userSpaceOnUse" x1="0" y1={-FAB.h} x2="0" y2={0}>
        <stop offset="0" stopColor={cream(dim)} />
        <stop offset="1" stopColor={creamFoot(dim)} />
      </linearGradient>
      <path d={rectD(FAB.x0, -FAB.h, FAB_W, FAB.h, 10)} fill="url(#fabFace)" />
      <path d={`M${FAB.x0 + 10} ${-FAB.h + 1}H${FAB.x1 - 10}`} stroke={COLOR.edge} strokeOpacity={0.85} strokeWidth={EDGE.CREAM / k} />
      <path d={`M${FAB.x0} -28H${FAB.x1}`} stroke={seam} strokeWidth={3} />
      {/* the door */}
      <path d={rectD(FAB.doorX - FAB.doorW / 2 - 9, -FAB.doorH - 9, FAB.doorW + 18, FAB.doorH + 9, 6)} fill={mixHex(COLOR.board, COLOR.cream, 0.1)} />
      <path d={rectD(FAB.doorX - FAB.doorW / 2, -FAB.doorH, FAB.doorW, FAB.doorH, 4)} fill={mixHex(COLOR.inkDark, COLOR.board, 0.2)} />
      {/* the chip: the hero */}
      <g transform={`translate(${FAB.cx} ${FAB.cy})`}>
        <path d={PIN_D} fill={COLOR.inkDark} />
        <path d={rectD(-PKG, -PKG, 2 * PKG, 2 * PKG, 14)} fill={COLOR.inkDark} />
        <path d={rectD(-58, -58, 116, 116, 8)} fill={offTone} />
        <g style={{ filter: bloomFilter(k) }} opacity={chipOn}>
          <path d={PIN_D} fill={COLOR.amberFoot} />
          <path d={rectD(-58, -58, 116, 116, 8)} fill={COLOR.amberTop} />
        </g>
        <path d={rectD(-58, -58, 116, 116, 8)} fill="none" stroke={COLOR.amberHot} strokeWidth={3} opacity={chipOn} />
        <path d={rectD(-24, -24, 48, 48, 4)} fill={COLOR.inkDark} />
      </g>
      {/* the wafer it was cut from, small beside it */}
      <g transform={`translate(${FAB.wx} ${FAB.cy})`}>
        <circle r={FAB.wr + 7} fill={mixHex(COLOR.board, COLOR.cream, 0.1)} />
        <circle r={FAB.wr} fill={COLOR.inkDark} />
        {DIES.map((die) => (
          <path key={`${die.x}_${die.y}`} d={rectD(die.x - 8, die.y - 8, 16, 16, 2)} fill={offTone} />
        ))}
        <g style={{ filter: bloomFilter(k) }}>
          {DIES.map((die) => {
            const on = smoothstep((wave - die.r) / 20);
            return on > 0.01 ? <path key={`${die.x}_${die.y}`} d={rectD(die.x - 8, die.y - 8, 16, 16, 2)} fill={COLOR.amberTop} opacity={on} /> : null;
          })}
        </g>
      </g>
    </Hinged>
  );
};

// ---------------------------------------------------------------------------
// THE WIND TURBINE
// ---------------------------------------------------------------------------
const bladeD = (hx: number, hy: number, R: number, deg: number) => {
  const a = (deg * Math.PI) / 180;
  const ux = Math.sin(a);
  const uy = -Math.cos(a);
  const nx = -uy;
  const ny = ux;
  const P = (t: number, w: number) => `${num(hx + ux * t * R + nx * w)} ${num(hy + uy * t * R + ny * w)}`;
  return `M${P(0, -8)}L${P(0.16, -17)}L${P(1, -3)}L${P(1, 3)}L${P(0.14, 11)}L${P(0, 8)}Z`;
};
const turbineSil = (t: typeof T1, angle: number) => {
  const hy = -t.H;
  const tower = `M${t.x - 26} 0L${t.x - 11} ${hy}H${t.x + 11}L${t.x + 26} 0Z`;
  const nac = rectD(t.x - 40, hy - 18, 80, 34, 12);
  const hub = `M${t.x + 21} ${hy}A21 21 0 1 1 ${t.x - 21} ${hy}A21 21 0 1 1 ${t.x + 21} ${hy}Z`;
  return [tower, nac, hub, bladeD(t.x, hy, t.R, angle), bladeD(t.x, hy, t.R, angle + 120), bladeD(t.x, hy, t.R, angle + 240)].join("");
};
const rotorAngle = (f: number, f0: number, seed: number) => {
  const t = f - f0;
  // slow and heavy: spin-up over 30 f to 2.2 deg/f
  const spin = t <= 0 ? 0 : t < 30 ? 2.2 * ((t * t) / 60) : 2.2 * (t - 15);
  return seed + spin;
};
const Turbine: React.FC<{ t: typeof T1; sy: number; angle: number; f: number; k: number }> = ({ t, sy, angle }) => {
  const dim = riseDim(sy);
  const hy = -t.H;
  const id = `tw${t.x}`;
  return (
    <Hinged sy={sy} sil={turbineSil(t, angle)}>
      <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="0" y1={hy} x2="0" y2={0}>
        <stop offset="0" stopColor={cream(dim)} />
        <stop offset="1" stopColor={creamFoot(dim)} />
      </linearGradient>
      <path d={`M${t.x - 26} 0L${t.x - 11} ${hy}H${t.x + 11}L${t.x + 26} 0Z`} fill={`url(#${id})`} />
      <path d={rectD(t.x - 40, hy - 18, 80, 34, 12)} fill={mixHex(COLOR.board, COLOR.cream, 0.35 * (1 - dim))} />
      <path d={[bladeD(t.x, hy, t.R, angle), bladeD(t.x, hy, t.R, angle + 120), bladeD(t.x, hy, t.R, angle + 240)].join("")} fill={cream(dim)} />
      <circle cx={t.x} cy={hy} r={21} fill={mixHex(COLOR.board, COLOR.cream, 0.5 * (1 - dim))} />
      <circle cx={t.x} cy={hy} r={7} fill={COLOR.amberTop} opacity={1 - dim} />
    </Hinged>
  );
};

// ---------------------------------------------------------------------------
// THE SOLAR PANELS
// ---------------------------------------------------------------------------
const SOLAR_SKEW = -10;
const PANEL_X = (i: number) => SOLAR.x0 + i * SOLAR.pitch;
const panelSil = (cx: number) => {
  const tan = Math.tan((SOLAR_SKEW * Math.PI) / 180);
  const yB = -SOLAR.post;
  const yT = -SOLAR.post - SOLAR.h;
  const xAt = (x: number, y: number) => x - tan * (y - yB);
  const w = SOLAR.w / 2;
  const face = `M${num(xAt(cx - w, yB))} ${yB}L${num(xAt(cx - w, yT))} ${yT}L${num(xAt(cx + w, yT))} ${yT}L${num(xAt(cx + w, yB))} ${yB}Z`;
  return `${face}${rectD(cx - 7, -SOLAR.post, 14, SOLAR.post, 2)}${rectD(cx - 26, -10, 52, 10, 3)}`;
};
const Panel: React.FC<{ cx: number; sy: number; sweepX: number; k: number }> = ({ cx, sy, sweepX, k }) => {
  const dim = riseDim(sy);
  const frame = cream(dim);
  const glass = mixHex(COLOR.inkDark, COLOR.board, 0.16 + 0.4 * dim);
  const grid = mixHex(glass, COLOR.board, 0.55);
  const yB = -SOLAR.post;
  const yT = yB - SOLAR.h;
  const w = SOLAR.w;
  const x0 = cx - w / 2;
  const band = 84 / k;
  const skew = Math.tan((22 * Math.PI) / 180) * SOLAR.h;
  const t = (sweepX - (x0 - band - skew)) / (w + 2 * band + 2 * skew);
  return (
    <Hinged sy={sy} sil={panelSil(cx)}>
      <path d={rectD(cx - 7, -SOLAR.post, 14, SOLAR.post, 2)} fill={mixHex(COLOR.board, COLOR.boardFoot, 0.5)} />
      <path d={rectD(cx - 26, -10, 52, 10, 3)} fill={mixHex(COLOR.board, COLOR.boardFoot, 0.5)} />
      <g transform={`translate(${cx} ${yB}) skewX(${SOLAR_SKEW}) translate(${-cx} ${-yB})`}>
        <path d={rectD(x0 - 6, yT - 6, w + 12, SOLAR.h + 12, 5)} fill={frame} />
        <path d={rectD(x0, yT, w, SOLAR.h, 2)} fill={glass} />
        {[1, 2].map((i) => (
          <path key={`v${i}`} d={`M${num(x0 + (w * i) / 3)} ${yT}V${yB}`} stroke={grid} strokeWidth={3} />
        ))}
        {[1, 2, 3].map((i) => (
          <path key={`h${i}`} d={`M${x0} ${num(yT + (SOLAR.h * i) / 4)}H${x0 + w}`} stroke={grid} strokeWidth={3} />
        ))}
        <LightSweep x={x0} y={yT} w={w} h={SOLAR.h} k={k} t={t} on="amber" r={2} />
      </g>
    </Hinged>
  );
};

// ---------------------------------------------------------------------------
// THE DATA-CENTER HALL
// ---------------------------------------------------------------------------
const HALL_W = HALL.x1 - HALL.x0;
const WIN = { x0: HALL.x0 + 50, x1: HALL.x1 - 50, y0: -HALL.h + 92, y1: -HALL.h + 300 };
const RACKS = (() => {
  const n = 13;
  const pitch = (WIN.x1 - WIN.x0 - 24) / n;
  return Array.from({ length: n }, (_, i) => WIN.x0 + 12 + i * pitch + (pitch - 50) / 2);
})();
const HALL_SIL = [
  rectD(HALL.x0, -HALL.h, HALL_W, HALL.h, 12),
  rectD(HALL.x0 + 120, -HALL.h - 54, 150, 58, 8),
  rectD(HALL.x0 + 310, -HALL.h - 54, 150, 58, 8),
  rectD(HALL.x0 + 500, -HALL.h - 54, 150, 58, 8),
].join("");
const LEDS = RACKS.flatMap((rx, r) =>
  Array.from({ length: 7 }, (_, j) => [0, 1].map((c) => ({ x: rx + 14 + c * 22, y: WIN.y0 + 34 + j * 25, seed: r * 7.3 + j * 3.1 + c * 11.7 }))).flat(),
);
const Hall: React.FC<{ sy: number; f: number; k: number; doorOpen: number; front?: React.ReactNode }> = ({ sy, f, k, doorOpen, front }) => {
  // the wall recedes by tone as the door opens: the new robot is the subject
  const dim = Math.max(riseDim(sy), 0.5 * smoothstep((f - 134) / 10));
  const roof = mixHex(COLOR.board, COLOR.cream, 0.28 * (1 - dim));
  const frameTone = mixHex(COLOR.board, COLOR.cream, 0.1);
  const wave = lerp(HALL.socketX - 40, HALL.x1 + 40, smoothstep((f - LED_F[0]) / (LED_F[1] - LED_F[0])));
  const panelTone = mixHex(COLOR.board, COLOR.boardFoot, 0.5);
  const dw = HALL.doorW;
  const dl = HALL.doorX - dw / 2;
  const open = Math.cos(doorOpen * 1.42);
  return (
    <Hinged sy={sy} sil={HALL_SIL}>
      <path d={HALL_SIL} fill={roof} />
      {[120, 310, 500].map((o) => (
        <path key={o} d={`M${HALL.x0 + o + 22} ${-HALL.h - 30}H${HALL.x0 + o + 128}M${HALL.x0 + o + 22} ${-HALL.h - 14}H${HALL.x0 + o + 128}`} stroke={mixHex(roof, COLOR.shadow, 0.3)} strokeWidth={5} />
      ))}
      <linearGradient id="hallFace" gradientUnits="userSpaceOnUse" x1="0" y1={-HALL.h} x2="0" y2={0}>
        <stop offset="0" stopColor={cream(dim)} />
        <stop offset="1" stopColor={creamFoot(dim)} />
      </linearGradient>
      <path d={rectD(HALL.x0, -HALL.h, HALL_W, HALL.h, 12)} fill="url(#hallFace)" />
      <path d={`M${HALL.x0 + 12} ${-HALL.h + 1}H${HALL.x1 - 12}`} stroke={COLOR.edge} strokeOpacity={0.85} strokeWidth={EDGE.CREAM / k} />
      <path d={rectD(HALL.x0, -HALL.h + 34, HALL_W, 18, 0)} fill={mixHex(COLOR.creamFoot, COLOR.boardFoot, 0.35 + 0.5 * dim)} />
      {/* the window band and the racks behind it */}
      <path d={rectD(WIN.x0 - 8, WIN.y0 - 8, WIN.x1 - WIN.x0 + 16, WIN.y1 - WIN.y0 + 16, 8)} fill={frameTone} />
      <path d={rectD(WIN.x0, WIN.y0, WIN.x1 - WIN.x0, WIN.y1 - WIN.y0, 4)} fill={COLOR.inkDark} />
      {RACKS.map((rx) => (
        <path key={rx} d={rectD(rx, WIN.y0 + 14, 50, WIN.y1 - WIN.y0 - 14, 3)} fill={mixHex(COLOR.inkDark, COLOR.board, 0.3)} />
      ))}
      {LEDS.map((l) => (
        <circle key={l.seed} cx={l.x} cy={l.y} r={5} fill={mixHex(COLOR.inkDark, COLOR.board, 0.1)} />
      ))}
      <g style={{ filter: bloomFilter(k) }}>
        {LEDS.map((l) => {
          const on = smoothstep((wave - l.x) / 30);
          if (on <= 0.01) return null;
          const tw = 0.5 + 0.5 * Math.sin(f / (11 + (l.seed % 9)) + l.seed);
          return <circle key={l.seed} cx={l.x} cy={l.y} r={6} fill={mixHex(COLOR.amberFoot, COLOR.amberHot, 0.55 * tw)} opacity={on} />;
        })}
      </g>
      {/* the socket */}
      <path d={rectD(HALL.socketX - 36, HALL.socketY - 44, 72, 88, 10)} fill={frameTone} />
      <path d={rectD(HALL.socketX - 15, HALL.socketY - 26, 30, 30, 5)} fill={COLOR.inkDark} />
      {/* the plinth seam and the loading dock */}
      <path d={`M${HALL.x0} -40H${HALL.x1}`} stroke={mixHex(COLOR.creamFoot, COLOR.boardFoot, 0.55)} strokeWidth={3} />
      <path d={rectD(HALL.x1 - 310, -252, 240, 252, 6)} fill={frameTone} />
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <path key={i} d={`M${HALL.x1 - 302} ${-252 + i * 36}H${HALL.x1 - 78}`} stroke={mixHex(frameTone, COLOR.shadow, 0.28)} strokeWidth={4} />
      ))}
      {/* the door: a dark interior, the new robot is drawn into it between here and the leaf */}
      <path d={rectD(dl - 10, -HALL.doorH - 10, dw + 20, HALL.doorH + 10, 8)} fill={frameTone} />
      <path d={rectD(dl, -HALL.doorH, dw, HALL.doorH, 4)} fill={COLOR.inkDark} />
      {front}
      <path d={rectD(dl, -HALL.doorH, Math.max(4, dw * open), HALL.doorH, 3)} fill={panelTone} />
      <circle cx={dl + Math.max(4, dw * open) * 0.84} cy={-HALL.doorH * 0.46} r={8 * Math.max(0.2, open)} fill={mixHex(COLOR.inkDark, COLOR.board, 0.4)} />
    </Hinged>
  );
};

// ---------------------------------------------------------------------------
// THE CABLE
// ---------------------------------------------------------------------------
const cableD = (x0: number, tip: number, rise: number) => {
  const start = Math.max(TILE_X + 60, x0);
  let d = start <= TILE_X + 60 ? `M${TILE_X + 60} ${FOLD - 4}L${TILE_X + 60} ${num(cableY(TILE_X + 60) - 14)}Q${TILE_X + 60} ${num(cableY(TILE_X + 60))} ${TILE_X + 80} ${num(cableY(TILE_X + 80))}` : `M${num(start)} ${num(cableY(start))}`;
  for (let x = Math.ceil(Math.max(start, TILE_X + 80) / 18) * 18; x < tip; x += 18) d += `L${x} ${num(cableY(x))}`;
  d += `L${num(tip)} ${num(cableY(tip))}`;
  if (rise > 0) {
    const yEnd = lerp(cableY(tip), FOLD + HALL.socketY + 20, rise);
    d += `L${num(tip)} ${num(yEnd)}`;
  }
  return d;
};
const Cable: React.FC<{ f: number; cam: Cam }> = ({ f, cam }) => {
  const k = cam.k;
  const tip = TIP[f];
  const rise = restToRest((f - PLUG_F[0]) / (PLUG_F[1] - PLUG_F[0]), 2);
  const view0 = cam.x - 540 / k - 60;
  const d = cableD(view0, tip, rise);
  const tipY = rise > 0 ? lerp(cableY(tip), FOLD + HALL.socketY + 20, rise) : cableY(tip);
  const turn = -90 * smoothstep((f - (PLUG_F[0] - 3)) / 3);
  const stub = (x: number, f0: number) => {
    const g = restToRest((f - f0) / 8, 2);
    if (g <= 0) return null;
    return <path key={x} d={`M${x} ${num(cableY(x))}L${x} ${num(lerp(cableY(x), FOLD, g))}`} />;
  };
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <g stroke={COLOR.shadow} strokeWidth={10} opacity={0.42} transform="translate(2 5)" style={{ filter: "blur(3px)" }}>
        <path d={d} />
      </g>
      <g style={{ filter: bloomFilter(k) }}>
        <g stroke={COLOR.amberTop} strokeWidth={8}>
          {stub(FAB.cx, HINGE.fab[1] - 6)}
          {stub(T1.x, HINGE.t1[1] - 6)}
          {stub(T2.x, HINGE.t2[1] - 6)}
          {stub(SOLAR.x0, SOLAR_F0 + SOLAR_DUR)}
          <path d={d} strokeWidth={10} />
        </g>
      </g>
      <path d={d} stroke={COLOR.amberHot} strokeWidth={2.2} transform="translate(0 -2.6)" />
      <g transform={`translate(${num(tip)} ${num(tipY)}) rotate(${num(turn)})`}>
        <path d={rectD(-24, -14, 42, 28, 7)} fill={COLOR.cream} stroke="none" />
        <path d={`M18 -7H31M18 7H31`} stroke={COLOR.inkDark} strokeWidth={5} strokeLinecap="round" />
      </g>
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE PICTURE
// ---------------------------------------------------------------------------
const RobotsBuildItAll: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const cam = camAt(f);
  const k = cam.k;
  const v0 = cam.x - 540 / k - 420;
  const v1 = cam.x + 540 / k + 420;
  const inView = (a: number, b: number) => b > v0 && a < v1;

  const sy = (key: keyof typeof HINGE) => hingeSy(f, HINGE[key][0], HINGE[key][1]);
  const sweepX = lerp(SOLAR.x0 - 400, PANEL_X(SOLAR.n - 1) + 400, clamp01((f - SWEEP_F[0]) / (SWEEP_F[1] - SWEEP_F[0])));
  const doorOpen = restToRest((f - DOOR_F[0]) / (DOOR_F[1] - DOOR_F[0]), 2);

  const newRobotInHall = f >= DOOR_F[0];

  const newRobot = newRobotInHall ? (
    <g transform={`translate(0 ${-FOLD}) `}>
      <Robot x={PATH_NEW.x[f]} y={Y_NEW[f]} plan={PLAN_NEW} scale={SCALE_NEW[f]} light={smoothstep((f - NEW_LIGHT) / 5)} k={k} f={f} seed={4} />
    </g>
  ) : null;

  return (
    <StoutStage S={f} cam={cam} rest={REST} pool={{ x: cam.x, y: 780 }}>
      <defs>
        <clipPath id="aboveFold">
          <rect x={-4000} y={-4000} width={14000} height={FOLD + 4000} />
        </clipPath>
        <linearGradient id="floorTone" gradientUnits="userSpaceOnUse" x1="0" y1={FOLD} x2="0" y2={FOLD + 900}>
          <stop offset="0" stopColor={COLOR.board} stopOpacity={0.2} />
          <stop offset="1" stopColor={COLOR.board} stopOpacity={0.05} />
        </linearGradient>
      </defs>
      {/* the two parallax layers, behind the fold */}
      <g clipPath="url(#aboveFold)">
        <DepthPlane cam={cam} rest={REST} d={1.7}>
          <path d={HILL_FAR} fill={mixHex(COLOR.ground, COLOR.board, 0.09)} />
        </DepthPlane>
        <DepthPlane cam={cam} rest={REST} d={1.3}>
          <path d={HILL_MID} fill={mixHex(COLOR.ground, COLOR.board, 0.17)} />
        </DepthPlane>
      </g>
      {/* the floor and its fold */}
      <rect x={-3000} y={FOLD} width={10000} height={2400} fill="url(#floorTone)" />
      <path d={`M-3000 ${FOLD}H7000`} stroke={COLOR.shadow} strokeOpacity={0.6} strokeWidth={3 / k} />

      {/* the stations, each a card on the fold */}
      {inView(TILE_X - TILE_SIZE, TILE_X + TILE_SIZE) ? (
        <g>
          <FloorShadow d={rectD(TILE_X - TILE_SIZE / 2, -TILE_SIZE, TILE_SIZE, TILE_SIZE, 70)} sy={1} />
          <OpenAISlotTile x={TILE_X} floor={FOLD} k={k} size={TILE_SIZE} shadow={false} />
          <g style={{ filter: bloomFilter(k) }}>
            <path d={rectD(TILE_X - 42, FOLD - 52, 84, 18, 9)} fill={COLOR.amberTop} />
          </g>
        </g>
      ) : null}
      {inView(FAB.x0, FAB.x1) ? <Fab sy={sy("fab")} f={f} k={k} /> : null}
      {inView(T1.x - T1.R, T1.x + T1.R) ? <Turbine t={T1} sy={sy("t1")} angle={rotorAngle(f, HINGE.t1[0] + 8, 20)} f={f} k={k} /> : null}
      {inView(T2.x - T2.R, T2.x + T2.R) ? <Turbine t={T2} sy={sy("t2")} angle={rotorAngle(f, HINGE.t2[0] + 8, 70)} f={f} k={k} /> : null}
      {Array.from({ length: SOLAR.n }, (_, i) => {
        const cx = PANEL_X(i);
        if (!inView(cx - 100, cx + 100)) return null;
        const f0 = SOLAR_F0 + i * SOLAR_STEP;
        return <Panel key={i} cx={cx} sy={hingeSy(f, f0, f0 + SOLAR_DUR)} sweepX={sweepX} k={k} />;
      })}
      {inView(HALL.x0, HALL.x1) ? <Hall sy={sy("hall")} f={f} k={k} doorOpen={doorOpen} front={newRobot} /> : null}

      {/* the one amber line */}
      <Cable f={f} cam={cam} />

      {/* the robots */}
      {inView(PATH_A.x[f] - 120, PATH_A.x[f] + 120) ? (
        <Robot x={PATH_A.x[f]} y={Y_A[f]} plan={PLAN_A} sy={sy("robotA")} scale={lerp(1, 0.96, smoothstep((f - 60) / 14))} light={smoothstep((f - 44) / 5)} k={k} f={f} seed={0} />
      ) : null}
      <Robot x={PATH_C.x[f]} y={FEET} plan={PLAN_C} sy={sy("robotC")} light={smoothstep((f - 40) / 5)} k={k} f={f} seed={1.7} />
      <Robot x={PATH_B.x[f]} y={FEET} plan={PLAN_B} sy={sy("robotB")} light={smoothstep((f - 42) / 5)} k={k} f={f} seed={3.1} />
    </StoutStage>
  );
};

export default RobotsBuildItAll;
