// ---------------------------------------------------------------------------
// DerpySavantInterns (rsi-derpy-interns, cut 107). Dwarkesh style (styles/dwarkesh.md).
// Opaque 1080x1920, 23.976 fps, 149 frames.
//
// CHECK LINE: "the intern holding up a solved Millennium Prize problem is still a goofy intern with a DAY 1 sign:
// brilliant, and it remembers nothing."
//
// THE LINE: "These models that are out here are solving millennium prize problems. While still being these derpy
// savant interns that have no long-term memory."
// WORD -> FRAME: These -3 · models 3 · that 9 · are 14 · out 14 · here 18 · are 22 · solving 24 · millennium 30 ·
//   prize 40 · problems 44 · While 54 · still 64 · being 68 · these 74 · derpy 81 · savant 91 · interns 101 ·
//   that 108 · have 116 · no 119 · long 124 · term 131 · memory 137 (word_tables.md, composition frames).
// DURATION: the slot 107.316 -> 113.530 s = 6.214 s x 23.976 = 149 frames (f0..f148).
//
// THE MOTION: cut 97's world: the white floor and the row of Millennium cards (NAVIER–STOKES orange-checked,
// POINCARÉ white-checked, the rest padlocked), with the orange intern (rsi-another-jump's figure, age 1, no cup)
// standing just left of its own NAVIER–STOKES card. On "solving millennium" its near hand takes the card by its
// left edge (between the label and the check) and lifts it up and out of the row, holding it up beside its head
// like a prize by "prize problems" (it looks up at it). From "While" the camera pushes in slowly onto the intern
// (k 0.94 -> 2.2). On "derpy" it goes goofy: a little bob, the head cocks, the eyes go lopsided (one drifts low
// and big, the other high and small) and the lanyard badge swings; on "savant" a quick wink, and the face comes
// back. On "that have no" a blank white sign (cut 6's door sign) is lowered fast on two strings from above the
// frame and bobs to a stop over its head; the intern looks up at it, DAY 1 slides up into it on "no long-term",
// and just before "memory" it blinks, still holding the card. f140-148: settled and alive (breath, sign sway,
// camera creep). No fade.
// CAUSE -> EFFECT: the hand is on the card's left edge from f16 (the lift starts f18, lands ~f40); the bob
//   (f75-85) swings the badge from f77; the strings catch the sign ~f111 (the overshoot and sway follow).
// Orange = the AI, nothing else (the intern, its solved card); white = people and structure (floor, cards,
// labels, the DAY 1 sign).
//
// SOURCES: the Millennium Prize row and its states are cut 97's (millenniumWorld.tsx, see SmarterCracksIt.tsx
// for sources). The DAY 1 sign is cut 6's door sign (sessionWorld.tsx). No figures.
// THE WORLDS: millenniumWorld.tsx and sessionWorld.tsx (this clip) on rsi-another-jump's timelineWorld (the
// intern), all imported read-only. The intern is redrawn here from its pose so its near arm can hold the card
// and its face can go derpy (lopsided eyes, head cock, badge swing).
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, Easing, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  BG_BASE,
  BG_DIM,
  CAM_DAMP,
  CAM_STIFF,
  GridBackground,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  camEase,
  clamp01,
  iconShadow,
  smoothstep,
  squirclePath,
  sway,
  worldTransform,
} from "../kits/dwarkesh/fieldShared";
import { INK, LABEL_IN } from "../kits/dwarkesh/alignShared";
import {
  EYE_TONE,
  EYE_UNITS,
  FACE_UNITS,
  FIGURE_TONE,
  FIGURE_TONE_FAR,
  FIGURE_TONE_TIE,
  type FigurePose,
  GROUND_Y,
  HEAD_MARK,
  eyePath,
  figurePose,
} from "../rsi-another-jump/timelineWorld";
import {
  CARD_H,
  CARD_TOP,
  CARD_W,
  CARD_BOTTOM,
  CardLabel,
  Floor,
  MILL_STROKE,
  MillenniumCard,
  ROW,
  ROW_LEFT,
} from "./millenniumWorld";
import { DoorSignText, SIGN_H, SIGN_W, signBox } from "./sessionWorld";

export const FPS = 24000 / 1001;
export const DURATION = 149;
export const schema = z.object({});
export const defaultProps = schema.parse({});

type P = { x: number; y: number };
const line = (pts: P[]) => `M${pts.map((p) => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" L")}`;
const poly = (pts: P[]) => `${line(pts)} Z`;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ramp = (f: number, f0: number, f1: number) => smoothstep(clamp01((f - f0) / (f1 - f0)));

// --- the layout ------------------------------------------------------------------------------
// The row is cut 97's (ROW, same x). The intern stands just left of NAVIER–STOKES, its card at its belly.
const NAVIER = ROW[0];
/** In the row the near hand takes the card by its left edge, between the label and the check (all it can reach:
 *  the card floats at its belly); as the card rises the hand slides down that edge to the card's bottom-left
 *  corner, so the raised card rests on it, the hand over the border in front. Grip points are card-relative
 *  (from the card's top-left). */
const GRIP_ROW = { x: 24, y: 125 };
const GRIP_END = { x: 16, y: CARD_H - 4 };
/** where the near hand takes the card in the row (relative to the hip x; within the arm's reach) */
const HAND_ROW_DX = 70;
/** the intern's hip x: the row card's left edge is GRIP_ROW.x behind the hand's first hold */
const X_I = NAVIER.x - CARD_W / 2 - (HAND_ROW_DX - GRIP_ROW.x);
const CARD_ROW = { left: NAVIER.x - CARD_W / 2, top: CARD_TOP };
/** the raised card: beside the head, its bottom at about shoulder height (the hand under its corner) */
const CARD_END = { left: X_I + 111, top: 380 };

// --- the lift: up and a little out, one eased move ------------------------------------------------
const REACH_F0 = 4;
const REACH_F1 = 16; // the hand is on the card's edge
const LIFT_F0 = 18;
const LIFT_F1 = 40; // up beside its head before "prize problems"
const liftEase = Easing.bezier(0.4, 0, 0.25, 1.3); // a slow start, a small proud overshoot
const liftT = (f: number) => (f <= LIFT_F0 ? 0 : f >= LIFT_F1 ? 1 : liftEase((f - LIFT_F0) / (LIFT_F1 - LIFT_F0)));
/** the card's top-left (it rises with the hand) */
const cardAt = (f: number) => {
  const t = liftT(f);
  return { left: lerp(CARD_ROW.left, CARD_END.left, t), top: lerp(CARD_ROW.top, CARD_END.top, t) };
};
/** the hand's hold on the card: slides from the edge to the corner while the card rises (f22-38) */
const gripAt = (f: number) => {
  const u = ramp(f, 22, 38);
  return { x: lerp(GRIP_ROW.x, GRIP_END.x, u), y: lerp(GRIP_ROW.y, GRIP_END.y, u) };
};

// Guard: the hand's hold stays inside the arm's reach on every frame of the lift (else the hand would leave the card).
{
  const g = figurePose({ x: X_I, age: 1 });
  const S = g.nearArm[0];
  for (let f = REACH_F1; f <= LIFT_F1 + 2; f++) {
    const c = cardAt(f);
    const gp = gripAt(f);
    const d = Math.hypot(c.left + gp.x - S.x, c.top + gp.y - S.y);
    if (d > g.p.armL * 0.995) throw new Error(`DerpySavantInterns: the card's hold is out of reach at f${f} (${d.toFixed(1)})`);
  }
}

// --- the derpy face, the wink, the sign, the blink -------------------------------------------
const BOB = { f0: 77, f1: 88, gait: 0.75 };
const DERP = { in0: 77, in1: 81, out0: 85, out1: 89 }; // normal again by f89
const derpAt = (f: number) => ramp(f, DERP.in0, DERP.in1) * (1 - ramp(f, DERP.out0, DERP.out1));
const WINK = { close0: 89, close1: 91, open0: 95, open1: 98 };
const winkAt = (f: number) => (f < WINK.open0 ? ramp(f, WINK.close0, WINK.close1) : 1 - ramp(f, WINK.open0, WINK.open1));
const BLINK = { f0: 133, mid: 135, f1: 138 };
const blinkAt = (f: number) => (f < BLINK.mid ? ramp(f, BLINK.f0, BLINK.mid) : 1 - ramp(f, BLINK.mid, BLINK.f1));
/** the badge: kicked by the bob, a decaying pendulum */
const SWING = { f0: 79, amp: 0.34, period: 11, tau: 10 };
const swingAt = (f: number) =>
  f <= SWING.f0 ? 0 : -SWING.amp * Math.exp(-(f - SWING.f0) / SWING.tau) * Math.sin((2 * Math.PI * (f - SWING.f0)) / SWING.period);
/** where the eyes look (mark units, added to both): up at the card as it rises, back to us, up at the sign */
const gazeAt = (f: number) => {
  const card = ramp(f, 16, 30) * (1 - ramp(f, 52, 68));
  const sign = ramp(f, 110, 119);
  return { x: 0.45 * card - 0.25 * sign, y: -0.6 * card - 0.85 * sign };
};

// The sign: cut 6's door-sign plate on two strings, dropped from above the frame onto a stop over the head.
const SIGN_X = X_I - 12;
const SIGN_REST_TOP = 300;
const SIGN_DROP = { f0: 103, f1: 116, from: -70 };
const signDropEase = Easing.out(Easing.back(1.7));
const SIGN_TEXT_F0 = 118;
/** lowered fast on its strings from above the frame edge, overshooting once as the strings catch it (~f111) */
const signTopAt = (f: number) =>
  lerp(SIGN_DROP.from, SIGN_REST_TOP, signDropEase(clamp01((f - SIGN_DROP.f0) / (SIGN_DROP.f1 - SIGN_DROP.f0))));
const SIGN_CATCH = 111;
/** a slow pendulum after the catch (degrees), about a point high on the strings */
const signRotAt = (f: number) =>
  f <= SIGN_CATCH ? 0 : 2.2 * Math.exp(-(f - SIGN_CATCH) / 22) * Math.sin((2 * Math.PI * (f - SIGN_CATCH)) / 26);
const SIGN_PIVOT_ABOVE = 420;

// --- the camera --------------------------------------------------------------------------------
// One key track: k, and where one world point A (between the head and the raised card) sits on screen; cx/cy are
// solved from those, then the kit damper. Open: the whole intern and the row (floor at screen ~1050). Then one
// slow push onto the head, the card and the sign.
const A = { x: X_I + 107, y: 480 };
const K0 = 0.94;
const CY0 = GROUND_Y - (1050 - 960) / K0;
const CX0 = X_I + 137; // P VS NP just off the right edge (no sliver)
const A0 = { x: 540 + (A.x - CX0) * K0, y: 960 + (A.y - CY0) * K0 };
const CAM_MOVES = [
  { f0: 0, f1: 50, k: 1.0, ax: A0.x, ay: 1050 - (GROUND_Y - A.y) * 1.0, warp: 1 },
  { f0: 48, f1: 106, k: 2.14, ax: 540, ay: 780, warp: 1 },
  { f0: 104, f1: DURATION + 6, k: 2.22, ax: 540, ay: 770, warp: 1 },
];
const camTarget = (f: number) => {
  let k = K0;
  let ax = A0.x;
  let ay = A0.y;
  for (const m of CAM_MOVES) {
    const u = camEase((f - m.f0) / (m.f1 - m.f0), m.warp);
    k = lerp(k, m.k, u);
    ax = lerp(ax, m.ax, u);
    ay = lerp(ay, m.ay, u);
  }
  return { k, cx: A.x - (ax - 540) / k, cy: A.y - (ay - 960) / k };
};
const CAM_TRACK = (() => {
  const out: { k: number; cx: number; cy: number }[] = [];
  let { k, cx, cy } = camTarget(0);
  let vk = 0;
  let vx = 0;
  let vy = 0;
  out.push({ k, cx, cy });
  for (let f = 1; f <= DURATION; f++) {
    const t = camTarget(f);
    vk += (t.k - k) * CAM_STIFF - vk * CAM_DAMP;
    k += vk;
    vx += (t.cx - cx) * CAM_STIFF - vx * CAM_DAMP;
    cx += vx;
    vy += (t.cy - cy) * CAM_STIFF - vy * CAM_DAMP;
    cy += vy;
    out.push({ k, cx, cy });
  }
  return out;
})();
export const camAt = (f: number) => CAM_TRACK[Math.max(0, Math.min(DURATION, Math.round(f)))];
const CAM_REST = camAt(0);

// --- the intern, redrawn from its pose ------------------------------------------------------------
/** two-bone arm, upper = forearm = armL / 2, the elbow on the side away from the body's front-up (down/back for a
 *  low reach, forward-down for a raised hand: one rule, continuous while the hand is in front of the shoulder) */
const ikArm = (S: P, H: P, armL: number): P[] => {
  const l = armL / 2;
  const dx = H.x - S.x;
  const dy = H.y - S.y;
  const d = Math.max(1e-6, Math.hypot(dx, dy));
  const dd = Math.min(d, 2 * l * 0.99999);
  const ux = dx / d;
  const uy = dy / d;
  const off = Math.sqrt(Math.max(0, l * l - (dd / 2) ** 2));
  const E = { x: S.x + ux * (dd / 2) - uy * off, y: S.y + uy * (dd / 2) + ux * off };
  return [S, E, { x: S.x + ux * dd, y: S.y + uy * dd }];
};

const rot = (p: P, o: P, a: number): P => {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return { x: o.x + (p.x - o.x) * c - (p.y - o.y) * s, y: o.y + (p.x - o.x) * s + (p.y - o.y) * c };
};

type Face = { gaze: P; derp: number; wink: number; blink: number; tilt: number; swing: number };

/** The series intern (timelineWorld's parts, tones and layer order), without the cup, its near arm from the pose
 *  passed in, and a face that can go derpy. SVG, world px. */
const DerpyIntern: React.FC<{ k: number; g: FigurePose; face: Face }> = ({ k, g, face }) => {
  const near = FIGURE_TONE(1);
  const far = FIGURE_TONE_FAR(1);
  const tieC = FIGURE_TONE_TIE(1);
  const { p } = g;
  const limb = (pts: P[], w: number, color: string) => (
    <path d={line(pts)} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
  );
  const legPts = (side: "near" | "far") => {
    const l = g.legs.find((q) => q.side === side)!;
    return [l.hip, l.knee, l.ankle];
  };
  const rectAt = (r: { x: number; y: number; w: number; h: number }, fill: string) => (
    <path d={squirclePath(r.w, r.h)} transform={`translate(${r.x.toFixed(2)} ${r.y.toFixed(2)})`} fill={fill} />
  );
  // the head cocks about the neck's top
  const s = g.mark.size / 24;
  const pivot = { x: g.head.x, y: g.head.y + g.mark.size * 0.3 };
  const tiltDeg = face.tilt;
  // the eyes, in mark units: lopsided when derpy, about 2:1 and looking different ways (the back one grows and
  // drifts up-left, the front one shrinks and drifts down-right)
  const d = face.derp;
  const eb = { x: EYE_UNITS.back.x + face.gaze.x - 0.7 * d, y: EYE_UNITS.back.y + face.gaze.y - 0.95 * d };
  const ef = { x: EYE_UNITS.front.x + face.gaze.x + 0.55 * d, y: EYE_UNITS.front.y + face.gaze.y + 1.0 * d };
  const rb = EYE_UNITS.r * (1 + 0.4 * d);
  const rf = EYE_UNITS.r * (1 - 0.3 * d);
  const toW = (u: P) => ({ x: g.mark.x + u.x * s, y: g.mark.y + u.y * s });
  const EB = toW(eb);
  const EF = toW(ef);
  // the badge swings about the lanyard's top (between its two strands)
  const top0 = g.lanyards[0][0];
  const top1 = g.lanyards[1][0];
  const lp = { x: (top0.x + top1.x) / 2, y: (top0.y + top1.y) / 2 };
  const badgeTop = g.lanyards[0][1];
  const bt = rot(badgeTop, lp, face.swing);
  const swingDeg = (face.swing * 180) / Math.PI;
  return (
    <g style={{ filter: iconShadow(k) }}>
      {limb(g.farArm, p.armT, far)}
      {limb(legPts("far"), p.legT, far)}
      <ellipse cx={g.footFar.cx} cy={g.footFar.cy} rx={g.footFar.rx} ry={g.footFar.ry} fill={far} />
      {limb(g.neck, p.neckW, near)}
      <path d={poly(g.torso)} fill={near} />
      <g transform={`rotate(${tiltDeg.toFixed(4)} ${pivot.x.toFixed(3)} ${pivot.y.toFixed(3)})`}>
        <g transform={`translate(${g.mark.x.toFixed(3)} ${g.mark.y.toFixed(3)}) scale(${s.toFixed(5)})`}>
          <circle cx={FACE_UNITS.x} cy={FACE_UNITS.y} r={FACE_UNITS.r} fill={near} />
          {HEAD_MARK.paths.map((dd, i) => (
            <path key={i} d={dd} fill={near} fillRule="evenodd" />
          ))}
        </g>
        <path d={eyePath(EB.x, EB.y, rb * s, face.blink)} fill={EYE_TONE} />
        <path d={eyePath(EF.x, EF.y, rf * s, Math.max(face.wink, face.blink))} fill={EYE_TONE} />
      </g>
      {limb(legPts("near"), p.legT, near)}
      <ellipse cx={g.footNear.cx} cy={g.footNear.cy} rx={g.footNear.rx} ry={g.footNear.ry} fill={near} />
      <path d={poly(g.collar)} fill={INK} strokeLinejoin="round" stroke={INK} strokeWidth={p.H * 0.004} />
      <path d={poly(g.tie)} fill={tieC} />
      {limb(g.nearArm, p.armT, near)}
      {g.lanyards.map((l, i) => (
        <path key={i} d={line([l[0], bt])} fill="none" stroke={INK} strokeWidth={p.H * 0.009} strokeLinecap="round" />
      ))}
      <g transform={`translate(${(bt.x - badgeTop.x).toFixed(3)} ${(bt.y - badgeTop.y).toFixed(3)}) rotate(${swingDeg.toFixed(4)} ${badgeTop.x.toFixed(3)} ${badgeTop.y.toFixed(3)})`}>
        {rectAt(g.badge, INK)}
        {rectAt(g.badgeSlot, far)}
        {rectAt(g.badgePhoto, far)}
      </g>
    </g>
  );
};

// --- the sign --------------------------------------------------------------------------------------
const SIGN_BOX = signBox(SIGN_X);
const SignPlate: React.FC<{ k: number }> = ({ k }) => (
  <g style={{ filter: iconShadow(k) }} fill="none" stroke={INK} strokeWidth={MILL_STROKE}>
    {[-0.3, 0.3].map((u) => (
      <line
        key={u}
        x1={SIGN_X + u * SIGN_W}
        y1={SIGN_BOX.y - 3000}
        x2={SIGN_X + u * SIGN_W}
        y2={SIGN_BOX.y}
        strokeWidth={MILL_STROKE / 2}
        strokeLinecap="round"
      />
    ))}
    <path d={squirclePath(SIGN_W, SIGN_H)} transform={`translate(${SIGN_BOX.x.toFixed(3)} ${SIGN_BOX.y.toFixed(3)})`} />
  </g>
);

const DerpySavantInterns: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const k = cam.k;
  const s = sway(frame);
  const { tx, ty } = worldTransform(cam.cx, cam.cy, k);

  // the pose: standing, breathing, a little bob on "derpy" (the gait's lean and dip, feet kept planted)
  const bobG = BOB.gait * Math.sin(Math.PI * clamp01((frame - BOB.f0) / (BOB.f1 - BOB.f0)));
  const g0 = figurePose({ x: X_I, age: 1, breathT: frame, identity: { drink: 1 } });
  const split = g0.p.footL * 0.42;
  const g1 = figurePose({
    x: X_I,
    age: 1,
    breathT: frame,
    gait: bobG,
    feet: { near: { x: X_I, lift: 0 }, far: { x: X_I - split + split * (1 - bobG), lift: 0 } },
    identity: { drink: 1 },
  });
  // the near hand: hanging, then on the card's left edge, then up with it
  const S = g1.nearArm[0];
  const l = g1.p.armL / 2;
  const handRest = { x: S.x + Math.sin(0.25) * l, y: S.y + l + Math.cos(0.25) * l };
  const card = cardAt(frame);
  const cardX = card.left + CARD_W / 2;
  const cardTop = card.top;
  const gp = gripAt(frame);
  const grip = { x: card.left + gp.x, y: card.top + gp.y };
  const r = ramp(frame, REACH_F0, REACH_F1);
  const hand = { x: lerp(handRest.x, grip.x, r), y: lerp(handRest.y, grip.y, r) };
  const g: FigurePose = { ...g1, nearArm: ikArm(S, hand, g1.p.armL) };

  const derp = derpAt(frame);
  const face: Face = {
    gaze: gazeAt(frame),
    derp,
    wink: winkAt(frame),
    blink: blinkAt(frame),
    tilt: 18 * derp,
    swing: swingAt(frame),
  };

  const signTop = signTopAt(frame);
  const signDy = signTop - SIGN_BOX.y;
  const signRot = signRotAt(frame);
  const pivot = { x: SIGN_X, y: SIGN_BOX.y - SIGN_PIVOT_ABOVE };
  const signTextIn = smoothstep(clamp01((frame - SIGN_TEXT_F0) / LABEL_IN));

  const world = {
    position: "absolute" as const,
    left: 0,
    top: 0,
    width: 1080,
    height: 1920,
    transformOrigin: "0 0",
    transform: `translate(${tx + s.dx}px, ${ty + s.dy}px) scale(${k})`,
  };
  const svgStyle = { position: "absolute" as const, left: 0, top: 0, overflow: "visible" as const };

  return (
    <AbsoluteFill style={{ backgroundColor: BG_BASE }}>
      <GridBackground
        src="grid-background.jpg"
        blur={13}
        dim={BG_DIM}
        frame={frame}
        cy={cam.cy}
        cyRest={CAM_REST.cy}
        cx={cam.cx}
        cxRest={CAM_REST.cx}
        k={k}
        parallax={0.15}
      />
      <AbsoluteFill style={{ filter: `drop-shadow(0 ${SHADOW_Y}px ${SHADOW_BLUR}px rgba(0,0,0,${SHADOW_OPACITY}))` }}>
        <div style={world}>
          <svg width={1080} height={1920} style={svgStyle}>
            <Floor k={k} x0={ROW_LEFT - 1400} x1={ROW_LEFT + 3200} />
            {ROW.slice(1).map((c) => (
              <MillenniumCard key={c.id} k={k} x={c.x} bottom={CARD_BOTTOM} w={CARD_W} h={CARD_H} state={c.state} />
            ))}
            <MillenniumCard k={k} x={cardX} bottom={cardTop + CARD_H} w={CARD_W} h={CARD_H} state={NAVIER.state} />
          </svg>
          {ROW.slice(1).map((c) => (
            <CardLabel key={c.id} k={k} x={c.x} top={CARD_TOP} lines={c.lines} />
          ))}
          <CardLabel k={k} x={cardX} top={cardTop} lines={NAVIER.lines} />
          <svg width={1080} height={1920} style={svgStyle}>
            <DerpyIntern k={k} g={g} face={face} />
          </svg>
          {frame >= SIGN_DROP.f0 ? (
            <>
              <svg width={1080} height={1920} style={svgStyle}>
                <g transform={`translate(0 ${signDy.toFixed(3)}) rotate(${signRot.toFixed(4)} ${pivot.x} ${pivot.y})`}>
                  <SignPlate k={k} />
                </g>
              </svg>
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: 0,
                  height: 0,
                  transformOrigin: `${pivot.x}px ${pivot.y}px`,
                  transform: `translate(0px, ${signDy}px) rotate(${signRot}deg)`,
                }}
              >
                <DoorSignText k={k} x={SIGN_X} inT={signTextIn} />
              </div>
            </>
          ) : null}
        </div>
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

export default DerpySavantInterns;
