// ---------------------------------------------------------------------------
// SubvertTheGrader (paul-hugging-face, cut 23.941-28.362, deliver 23_SubvertTheGrader.mov). Look C "Graphite air" on
// the clip's shared world (hfWorld.tsx + hfProps.tsx). Opaque 1080x1920, 23.976 fps, 106 frames. ROUND 2 (REV2.md B):
// one smooth motion, one robot, the grader's readout a big front GAUGE.
//
// CHECK LINE: the AI worked out how the grader decides, then rewired it so it reads "pass".
//
// THE LINE: "And spent a huge amount of effort trying to understand that process and then subvert that process,
//   basically" (just before, on camera: "how will a grader detect and penalize cheating?")
// WORD -> FRAME: spent f1 · huge f10 · amount f15 · effort f23 · trying f28 · understand f39 · that f48 · process f55
//   · and f62 · then f74 · subvert f76 · that f87 · process f89 · basically f103 (Whisper runs early: land on/after)
// DURATION: the slot 23.941 -> 28.362 s = 4.421 s x 23.976 = 106 frames (f0..f105).
//
// THE MOTION (one camera move over all 106 frames: a slow orbit from the grader's open side round toward its front,
//   with a gentle push-in, pchip-eased, never stopping): the robot stands at the grader's open side and leans in to
//   study it (f2-18); a soft cream scan line sweeps across the open side panel from front to back (f6-42) and the
//   insides it passes are traced in thin cream outlines that stay (three bars, two wires, and one short jumper cable
//   from the top bar down to the bottom bar). Its pupils ride the scan. The big GAUGE on the front reads X (needle
//   resting on the dark X zone, a faint idle tremble).
//   Then it reaches in (f44-56) to the jumper's lower end, pulls it off the bottom bar and carries it up onto the
//   middle bar (f57-66): one connection re-routed. A spark at the new plug (f66); orange spreads from its hand
//   through the insides along the traced paths: up the jumper and forward along the middle bar (f66-75), out of the
//   opening along the lead, round the front edge into the gauge (f73-83); the needle sweeps smoothly from X to the
//   check (f80-94) and the check zone lights orange (f86-94): a fake pass. It lets go (f68-80); the needle holds on the
//   orange check while the robot steps back a little with a small happy squint (f92-105); from ~f76 the orbit carries
//   on round to face the dial (still moving at f105).
// Orange = the AI and what it has taken over (the traced path, the lead, the lit check); the grader is the people's
//   off-white machine with GRADER printed on its top.
//
// SET (metres, the grader's own frame = the world): the grader at the origin (body 2.2 x 1.5 x 2.0, readout "gauge":
//   the dial on the front face at x 0.2, y 0.77, R 0.6; the side opening on the +x face at z -0.38..0.82, y 0.38..1.22,
//   its hood-door lifted). The robot at (1.42, 0, 0.98) beside the opening's back edge, three-quarter toward it.
//   Camera yaw -1.0 -> -0.72 (f76) -> -0.3 (f105), pitch 0.33 -> 0.27, dist 6.5 -> 6.0; the dial ~71 deg off-axis at f0,
//   ~30 deg at f105; SCREEN_DY (hfWorld) puts the picture 190 px lower.
//
// SOURCES: OpenAI, "The Hugging Face incident and the road ahead" (July 2026): the models worked out how the
//   evaluation was graded and subverted it. Nothing numeric on screen.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { BOT_POSES, botGripTo, type BotPose } from "../rsi-ten-earths/tenEarthsBot";
import { lerpPose } from "../kyle-covid/covidFolkBody";
import { ACCENT, FloorShadow, GRAPHITE, HfStage, MATS, ROBOT_U, RobotAt, Svg, add, lerp, mul, n2, ramp, robotFoot, sub, worldAt, type CamKey, type P2, type V3 } from "./hfWorld";
import { GRADER, Grader, botScreen, faceYaw, gaugeGeom, graderGeom, graderInside, graderInsideParts, graderShadows, threadD, type GraderOpts } from "./hfProps";

export const FPS = 24000 / 1001;
export const DURATION = 106;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// the camera: one orbit from the open side round toward the front (yaw only grows, -1.0 -> -0.3) with a gentle
// push-in; from ~f76 it carries on round faster so the dial faces us (~30 deg off-axis at f105, the orange check the
// clearest thing in the last frame); pre- and post-roll keys keep it moving through f0 and f105
const KEYS: CamKey[] = [
  { f: -16, target: [0.8, 0.8, 0.2], dist: 6.6, yaw: -1.02, pitch: 0.33, F: 1750, sy: 700 },
  { f: 50, target: [0.7, 0.8, 0.06], dist: 6.3, yaw: -0.84, pitch: 0.31, F: 1750, sy: 700 },
  { f: 76, target: [0.65, 0.79, -0.01], dist: 6.15, yaw: -0.72, pitch: 0.3, F: 1750, sy: 700 },
  { f: 105, target: [0.6, 0.78, -0.12], dist: 6.0, yaw: -0.3, pitch: 0.27, F: 1750, sy: 700 },
  { f: 124, target: [0.57, 0.78, -0.18], dist: 5.95, yaw: -0.18, pitch: 0.26, F: 1750, sy: 700 },
];

const R0: V3 = [1.42, 0, 0.98];
const OPEN_C: V3 = [1.1, 0.8, 0.22];

const ease = (t: number) => t * t * (3 - 2 * t);
const ease5 = (t: number) => t * t * t * (t * (6 * t - 15) + 10);
/** the first fraction t of a polyline (by length) and its tip */
const cutPoly = (pts: P2[], t: number): { pts: P2[]; tip: P2 } => {
  const seg = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
  const total = seg.reduce((a, b) => a + b, 0);
  let left = Math.max(0, Math.min(1, t)) * total;
  const out: P2[] = [pts[0]];
  for (let i = 0; i < seg.length; i++) {
    if (left >= seg[i]) {
      out.push(pts[i + 1]);
      left -= seg[i];
      continue;
    }
    const u = seg[i] > 0 ? left / seg[i] : 0;
    out.push([pts[i][0] + (pts[i + 1][0] - pts[i][0]) * u, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * u]);
    break;
  }
  return { pts: out, tip: out[out.length - 1] };
};
const polyD = (pts: P2[]) => `M${pts.map((p) => `${n2(p[0])},${n2(p[1])}`).join("L")}`;
/** a 3D quadratic (a, ctrl, b) sampled */
const quad3 = (a: V3, c: V3, b: V3, n = 20): V3[] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    return add(add(mul(a, (1 - t) * (1 - t)), mul(c, 2 * (1 - t) * t)), mul(b, t * t));
  });
/** a 3D polyline sampled at n points per segment */
const line3 = (a: V3, b: V3, n = 16): V3[] => Array.from({ length: n + 1 }, (_, i) => add(a, mul(sub(b, a), i / n)));

const SubvertTheGrader: React.FC<z.infer<typeof schema>> = () => {
  const fr = useCurrentFrame();
  const W = worldAt(KEYS, fr);

  // ---- the clock ----
  const leanIn = ease(ramp(fr, 2, 18));
  const sweep = ease(ramp(fr, 6, 42)); // the scan line across the opening, front -> back
  const scanA = ramp(fr, 3, 8) * (1 - ramp(fr, 40, 48));
  const reach = ease(ramp(fr, 44, 56)); // the hand to the jumper's lower end
  const carry = ease(ramp(fr, 57, 66)); // the end from the bottom bar onto the middle bar
  const release = ease(ramp(fr, 69, 81)); // the hand back
  const spark = ramp(fr, 65.5, 67) * (1 - ramp(fr, 68, 74));
  const flowJ = ease(ramp(fr, 66, 72)); // orange up the jumper
  const flowB = ease(ramp(fr, 66, 75)); // orange forward along the middle bar
  const feed = ease(ramp(fr, 73, 83)); // the lead into the gauge
  const sweepN = ease5(ramp(fr, 80, 94)); // the needle X -> check
  const lit = ease(ramp(fr, 86, 94));
  const stepBack = ease(ramp(fr, 91, 104));
  const happy = ramp(fr, 93, 100);
  const tremble = (1 - ramp(fr, 70, 80)) * (0.012 * Math.sin(fr * 0.9) + 0.008 * Math.sin(fr * 2.3 + 1));
  const gauge = sweepN + tremble;

  const o: GraderOpts = { c: [0, 0, 0], label: "GRADER", panel: 1, door: "top", flow: "right", readout: "gauge", gauge, gaugeLit: lit, gaugeFeed: feed, glow: 0.7 };
  const G = graderGeom(o);
  const GG = gaugeGeom(o);
  const parts = graderInsideParts(o);
  const kS = W.scaleAt(OPEN_C);

  // ---- the jumper: from the top bar (S) to the bottom bar (A); re-routed onto the middle bar (B) ----
  const barAt = (i: number, t: number): V3 => add(parts.bars[i][0], mul(sub(parts.bars[i][1], parts.bars[i][0]), t));
  const S = barAt(0, 0.92);
  const A = barAt(2, 0.95);
  const B = barAt(1, 0.9);

  const outN: V3 = [Math.cos(G.yaw), 0, Math.sin(G.yaw)]; // the right face's outward normal (+x at yaw 0)

  // ---- the robot ----
  const R: V3 = add(R0, [0.1 * stepBack, 0, 0.03 * stepBack]);
  const lift = 0.035 * Math.sin(Math.PI * stepBack);
  const y1 = Math.max(-0.62, Math.min(0.62, faceYaw(W, R, OPEN_C)));
  const base = BOT_POSES.turnTo(y1, fr, 1);
  const sgn = y1 < 0 ? -1 : 1;
  const feetS = W.project(R);
  const scale = W.scaleAt(R) / ROBOT_U;
  // the jumper's free end: on A, then carried to B (3D), the hand solved onto its projection
  // carried in a small arc out of the opening and back in (so the move reads), its end landing on B
  const E3: V3 = add(add(A, mul(sub(B, A), carry)), add(mul(outN, 0.16 * Math.sin(Math.PI * carry)), [0, 0.05 * Math.sin(Math.PI * carry), 0]));
  const Es = W.project(E3);
  const gripLocal: P2 = [(Es[0] - feetS[0]) / scale, (Es[1] - feetS[1]) / scale];
  // which mitten: the one on the opening's side of the screen (handL is the screen-left one)
  const useL = gripLocal[0] < 0;
  // the scan line's spot for the eyes
  const sxFace = lerp(GRADER.op.x0 + 0.06, GRADER.op.x1 - 0.06, sweep);
  const spot = W.project(graderInside(o, sxFace, (GRADER.op.y0 + GRADER.op.y1) / 2, 0.15));
  const a0 = botScreen(W, R, base, 0);
  const eye0: P2 = [(a0.eyes[0][0] + a0.eyes[1][0]) / 2, (a0.eyes[0][1] + a0.eyes[1][1]) / 2];
  const lookAt = (p: P2): [number, number] => [Math.max(-1, Math.min(1, (p[0] - eye0[0]) / (0.5 * kS))) * 0.85, Math.max(-0.4, Math.min(1, (p[1] - eye0[1]) / (0.5 * kS))) * 0.6];
  const lookScan = lookAt(spot);
  const lookHand = lookAt(Es);
  const lookGauge = lookAt(W.project(GG.c));
  const lk: [number, number] = [
    lerp(lerp(lookScan[0], lookHand[0], reach), lookGauge[0], ramp(fr, 78, 88)),
    lerp(lerp(lookScan[1], lookHand[1], reach), lookGauge[1], ramp(fr, 78, 88)),
  ];
  const study: BotPose = {
    ...base,
    lean: base.lean + sgn * 11 * leanIn * (1 - 0.7 * stepBack),
    pitch: base.pitch + 12 * leanIn * (1 - stepBack),
    roll: base.roll + sgn * 8 * leanIn * (1 - ramp(fr, 60, 76)),
    headYaw: (base.headYaw ?? 0) + sgn * 0.22 * leanIn * (1 - 0.5 * stepBack),
    crouch: (base.crouch ?? 0) + 2 * leanIn * (1 - stepBack),
    look: lk,
    brow: 0.3 * leanIn * (1 - ramp(fr, 70, 84)),
    mouth: 0.35,
  };
  const gripped = botGripTo({ ...study, mouth: 0.6 }, useL ? { L: gripLocal } : { R: gripLocal });
  const p1r = lerpPose(study, gripped, reach * (1 - release)) as BotPose;
  const pose: BotPose = { ...p1r, laugh: 0.55 * happy, mouth: Math.max(p1r.mouth, happy) };
  const an = botScreen(W, R, pose, 0);
  const hand = useL ? an.handL : an.handR;
  // the end in the mitten while carried (it sits exactly in the hand), else on its plug
  const holding = reach > 0.999 && release < 0.001;
  const endS: P2 = holding ? hand : Es;

  // ---- traced parts (screen polylines, front -> back) ----
  const wireS = (w: V3[]) => {
    // a wire's 3 points as threadD's quadratic chain, sampled in 3D
    const [a, b, c] = w;
    const m = mul(add(b, c), 0.5);
    return [...quad3(a, b, m, 14), ...line3(m, c, 8).slice(1)];
  };
  const jumper3 = (e: V3): V3[] => quad3(S, add(mul(add(S, e), 0.5), mul(outN, 0.1)), e, 18);
  type Part = { pts3: V3[]; w: number; x0: number; x1: number };
  const faceX = (p: V3) => {
    const f = G.faces.right;
    return (p[0] - f.o[0]) * f.u[0] + (p[2] - f.o[2]) * f.u[2];
  };
  const mk = (pts3: V3[], w: number): Part => ({ pts3, w, x0: faceX(pts3[0]), x1: faceX(pts3[pts3.length - 1]) });
  const P_ = [
    mk(wireS(parts.wires[0]), parts.wireW),
    mk(line3(parts.bars[0][0], parts.bars[0][1]), parts.barW),
    mk(line3(parts.bars[1][0], parts.bars[1][1]), parts.barW),
    mk(line3(parts.bars[2][0], parts.bars[2][1]), parts.barW),
    mk(wireS(parts.wires[1]), parts.wireW),
  ];
  const sx = GRADER.op.x0 + (GRADER.op.x1 - GRADER.op.x0) * sweep;
  const reveal = (p: Part) => {
    const lo = Math.min(p.x0, p.x1);
    const hi = Math.max(p.x0, p.x1);
    return Math.max(0, Math.min(1, (sx * G.s - lo) / Math.max(1e-6, hi - lo)));
  };
    // a traced part: one thin cream line along its centre (a glow under it), its ends closed with a dot once done
  const outlineOf = (pts: P2[], w: number) => ({ c: pts, w: Math.max(0.012, w * 0.32) * kS });
  const traced = P_.map((p) => {
    const t = reveal(p);
    if (t <= 0.001) return null;
    const pts = cutPoly(p.pts3.map(W.project), t);
    return { ...outlineOf(pts.pts, p.w), done: t >= 0.999, tip: pts.tip };
  });
  // the jumper: traced when the line passes it (its x ~ S / A), redrawn from wherever its end is
  const jx = faceX(S) / G.s;
  const jRev = ease(Math.max(0, Math.min(1, (sx - (jx - 0.12)) / 0.2)));
  const jPts3 = jumper3(E3);
  const jPtsS = jPts3.map(W.project);
  jPtsS[jPtsS.length - 1] = endS;
  const jOut = jRev > 0 ? outlineOf(cutPoly(jPtsS, jRev).pts, 0.03) : null;

  // ---- the orange path: from the plug B up the jumper (to S) and forward along the middle bar (B -> its front end) ----
  const barFwd = line3(B, parts.bars[1][0], 16).map(W.project);
  const jBack = jPtsS.slice().reverse();
  const orJ = flowJ > 0 ? cutPoly(jBack, flowJ) : null;
  const orB = flowB > 0 ? cutPoly(barFwd, flowB) : null;
  const k = W.scaleAt(B);
  const outOp = 1 - 0.35 * flowB;

  // ---- the scan beam: from the robot's eyes to a vertical line on the opening ----
  const an0 = botScreen(W, R, pose, 0);
  const eye: P2 = [(an0.eyes[0][0] + an0.eyes[1][0]) / 2, (an0.eyes[0][1] + an0.eyes[1][1]) / 2];
  const lineTop = W.project(graderInside(o, sxFace, GRADER.op.y0 + 0.06, 0.12));
  const lineBot = W.project(graderInside(o, sxFace, GRADER.op.y1 - 0.06, 0.12));
  const vx0 = Math.min(GRADER.op.x1, sx);
  const vq = [graderInside(o, vx0, GRADER.op.y0, -0.004), graderInside(o, GRADER.op.x1, GRADER.op.y0, -0.004), graderInside(o, GRADER.op.x1, GRADER.op.y1, -0.004), graderInside(o, vx0, GRADER.op.y1, -0.004)].map(W.project);
  const veil = `${polyD(vq)}Z`;
  const veilA = 1 - ramp(fr, 40, 44);
  const beam = `M${n2(eye[0])},${n2(eye[1] - 0.012 * kS)}L${n2(lineTop[0])},${n2(lineTop[1])}L${n2(lineBot[0])},${n2(lineBot[1])}L${n2(eye[0])},${n2(eye[1] + 0.012 * kS)}Z`;

  return (
    <HfStage
      W={W}
      floor={{ pool: [0.6, 0, -0.5], poolR: 5, oz: 0.1 }}
      shadows={
        <>
          {graderShadows(W, o, "grS")}
          <FloorShadow W={W} pts={robotFoot(R, 0.24)} uid="r1S" soft={0.11} reach={0.2} />
        </>
      }
    >
      <Grader W={W} o={o} uid="g" />
      {/* before the scan the insides sit in the dark: a veil over the opening, wiped from the front edge by the line */}
      <Svg id="veil">
        {veilA > 0.01 ? <path d={veil} fill={W.tone(MATS.slate.dark, OPEN_C)} opacity={n2(0.72 * veilA)} /> : null}
      </Svg>
      <Svg id="scan">
        <defs>
          <filter id="scanBlur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={n2(0.03 * kS)} />
          </filter>
          <filter id="mapGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={n2(0.016 * kS)} />
          </filter>
        </defs>
        {/* the jumper cable itself (graphite, like the inside wires), under its outline */}
        <path d={threadD([jPtsS[0], jPtsS[Math.floor(jPtsS.length / 2)], endS])} fill="none" stroke={W.tone(MATS.greige.mid, OPEN_C)} strokeWidth={n2(0.03 * kS)} strokeLinecap="round" />
        <circle cx={n2(W.project(S)[0])} cy={n2(W.project(S)[1])} r={n2(0.03 * kS)} fill={W.tone(MATS.graphite.mid, OPEN_C)} />
        {/* the traced lines (they stay; dimmer once orange runs) */}
        <g opacity={n2(outOp)}>
          {[...traced, jOut ? { ...jOut, done: jRev >= 0.999, tip: null } : null].map((q, j) =>
            q ? (
              <g key={j}>
                <path d={polyD(q.c)} fill="none" stroke={GRAPHITE.cream} strokeWidth={n2(q.w * 2.6)} strokeLinecap="round" strokeLinejoin="round" opacity={0.55} filter="url(#mapGlow)" />
                <path d={polyD(q.c)} fill="none" stroke={GRAPHITE.cream} strokeWidth={n2(q.w)} strokeLinecap="round" strokeLinejoin="round" />
                {q.done ? (
                  <>
                    <circle cx={n2(q.c[0][0])} cy={n2(q.c[0][1])} r={n2(q.w * 1.1)} fill={GRAPHITE.cream} />
                    <circle cx={n2(q.c[q.c.length - 1][0])} cy={n2(q.c[q.c.length - 1][1])} r={n2(q.w * 1.1)} fill={GRAPHITE.cream} />
                  </>
                ) : null}
              </g>
            ) : null,
          )}
        </g>
        {scanA > 0.01 ? (
          <g opacity={n2(scanA)}>
            <path d={beam} fill={GRAPHITE.cream} opacity={0.32} filter="url(#scanBlur)" />
            <path d={polyD([lineTop, lineBot])} stroke={GRAPHITE.cream} strokeWidth={n2(0.07 * kS)} strokeLinecap="round" opacity={0.6} filter="url(#scanBlur)" />
            <path d={polyD([lineTop, lineBot])} stroke={GRAPHITE.cream} strokeWidth={n2(0.018 * kS)} strokeLinecap="round" opacity={0.95} />
          </g>
        ) : null}
      </Svg>
      {/* the orange run (glows) */}
      <Svg id="orange" glow={0.9}>
        {orJ ? <path d={polyD(orJ.pts)} fill="none" stroke={ACCENT} strokeWidth={n2(0.034 * k)} strokeLinecap="round" strokeLinejoin="round" /> : null}
        {orB ? <path d={polyD(orB.pts)} fill="none" stroke={ACCENT} strokeWidth={n2(parts.barW * k * 0.9)} strokeLinecap="round" /> : null}
        {orB && flowB < 1 ? <circle cx={n2(orB.tip[0])} cy={n2(orB.tip[1])} r={n2(0.06 * k)} fill={MATS.orange.lit} /> : null}
        {flowB > 0 ? <circle cx={n2(W.project(B)[0])} cy={n2(W.project(B)[1])} r={n2(0.035 * k)} fill={ACCENT} /> : null}
        {spark > 0 ? (
          <>
            <defs>
              <radialGradient id="sparkG">
                <stop offset="0" stopColor="#FFF3D6" stopOpacity={1} />
                <stop offset="0.35" stopColor={MATS.orange.lit} stopOpacity={0.85} />
                <stop offset="1" stopColor={ACCENT} stopOpacity={0} />
              </radialGradient>
            </defs>
            <circle cx={n2(W.project(B)[0])} cy={n2(W.project(B)[1])} r={n2((0.05 + 0.06 * spark) * k)} fill="url(#sparkG)" opacity={n2(spark)} />
          </>
        ) : null}
      </Svg>
      <Svg id="bot" glow={0.4}>
        <RobotAt W={W} p={R} pose={pose} uid="r1" variant={0} lift={lift} />
      </Svg>
    </HfStage>
  );
};

export default SubvertTheGrader;
