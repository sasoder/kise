// ---------------------------------------------------------------------------
// SubvertTheGrader (paul-hugging-face, cut 23.941-28.362, deliver 23_SubvertTheGrader.mov). Look C "Graphite air" on
// the clip's shared world (hfWorld.tsx + hfProps.tsx). Opaque 1080x1920, 23.976 fps, 106 frames.
//
// CHECK LINE: the AIs studied how the grader catches cheaters, then turned the grader to their side.
//
// THE LINE: "And spent a huge amount of effort trying to understand that process and then subvert that process,
//   basically" (just before, on camera: "how will a grader detect and penalize cheating?")
// WORD -> FRAME: spent f1 · huge f10 · amount f15 · effort f23 · trying f28 · understand f39 · that f48 · process f55
//   · and f62 · then f74 · subvert f76 · that f87 · process f89 · basically f103 (Whisper runs early: land on/after)
// DURATION: the slot 23.941 -> 28.362 s = 4.421 s x 23.976 = 106 frames (f0..f105).
//
// THE MOTION (one continuous camera): open CLOSE on the grader's open side panel (hood lifted), a robot's face peering
//   in, a cream scan light from its eyes sweeping the insides; the camera eases back (to ~f26) on the whole grader while
//   its stamp comes down and prints a grey X on a task sheet (press f30-36, the X at f36). It never parks: from f26 it
//   orbits on round toward the open side (yaw -0.78 -> -0.95 by f74), bringing the opening to centre-right and
//   closing in. Meanwhile the scan rides each inner part in turn and leaves a thin glowing cream outline on it that
//   stays (upper wire f18-30, top bar f30-40, middle f40-49, bottom f49-57, lower wire f57-66): by f66 the inside is
//   mapped. The second robot, in front of the in-feed, leans over the line after the X sheet as the belt carries it
//   onto the out-rack (f44-56), head tilted, studying it; it straightens and the orbit leaves it (out by ~f74). On
//   "subvert", in one closer framing held from f72 (the machine across the box, the opening and the plugging robot in
//   x 150-950, the insides ~245-265 px wide), the studying robot's orange thread flies into the insides (f64 ->
//   plugged f76); orange runs through the insides (f77-85), along a wire over the top (f79-85) and up the stamp arm
//   (f81-91); the orange stamp prints a big, bold orange TICK (long right arm) on the next sheet, one the grader would
//   have crossed out (f92).
//   The belt moves on (f95-104): the tick sheet slides up the out-rack in front of the crossed ones, large; the
//   plugging robot stays fully in with a small happy squint (f93-99); the slow push runs to the last frame.
// Orange = the AIs and what they have taken over (the thread, the insides, the stamp, the tick); the grader is the
//   people's off-white machine.
//
// SET (metres, the grader's own frame = the world): the grader at the origin (body 2.2 x 1.5 x 2.0, GRADER printed on
//   its top in perspective; its side opening on the +x face at z -0.38..0.82, y 0.38..1.22, the hood-door lifted; flow "right": in-feed belt at the left, the
//   stamp at x 0.62 and the out-rack at x 1.58 in front of the right end, so stamp, rack, opening and plugger share
//   one framing); R1 (studies, then plugs in) at (1.5, 0, 0.72) beside the opening's back edge, three-quarter toward
//   it; R2 in front of the in-feed at (-0.3, 0, -2.25), studying the X sheet.
//   Camera yaw -0.74 -> -0.95 (-0.93 at the end), pitch 0.26 -> 0.42 -> 0.6, dist 3.5 -> 7.7 -> 6.7 -> ~5.9 at f105.
//
// SOURCES: OpenAI, "The Hugging Face incident and the road ahead" (July 2026): the models worked out how the
//   evaluation was graded and subverted it. Nothing numeric on screen.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { BOT_POSES, botGripTo, type BotPose } from "../rsi-ten-earths/tenEarthsBot";
import { lerpPose } from "../kyle-covid/covidFolkBody";
import { FloorShadow, GRAPHITE, HfStage, RobotAt, Svg, n2, ramp, robotFoot, worldAt, type CamKey, type P2, type V3 } from "./hfWorld";
import { GRADER, Grader, Thread, beltSheets, botScreen, faceYaw, graderGeom, graderInside, graderInsideParts, graderShadows, type GraderOpts } from "./hfProps";

export const FPS = 24000 / 1001;
export const DURATION = 106;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// the camera, one continuous move in three lobes: the close start already moving (pre-roll key) and the pull-back
// reveal (to ~f26); the orbit round toward the open side while the insides get mapped (f26-74: the opening travels
// to centre-right and the camera closes in on the subvert framing, held from f72 to the tick); and the slow push to
// the end (post-roll key: still moving at f105). Yaw only grows toward the open side until f74 (a slight ease back
// after), so the camera never parks; the one slow point is the hand-over from the pull-back to the orbit (~f27).
const KEYS: CamKey[] = [
  { f: -12, target: [1.35, 0.95, 0.55], dist: 3.5, yaw: -0.74, pitch: 0.26, F: 1750, sy: 640 },
  { f: 26, target: [0.3, 0.8, -0.3], dist: 7.4, yaw: -0.78, pitch: 0.42, sy: 680 },
  { f: 46, target: [0.45, 0.8, -0.25], dist: 7.7, yaw: -0.84, pitch: 0.42, sy: 690 },
  { f: 74, target: [0.85, 0.8, -0.15], dist: 6.7, yaw: -0.95, pitch: 0.6, sy: 700 },
  { f: 132, target: [1.0, 0.84, -0.45], dist: 5.6, yaw: -0.93, pitch: 0.62, sy: 740 },
];

const R1: V3 = [1.5, 0, 0.72];
const R2: V3 = [-0.3, 0, -2.25];
const OPEN_C: V3 = [1.1, 0.8, 0.22];

// the mapping: the scan light rides each inner part in turn (boustrophedon, so the spot runs on down the ends) and
// leaves a thin cream outline on it that stays: upper wire, top bar, middle bar, bottom bar, lower wire
const MAP: { kind: "wire" | "bar"; i: number; f0: number; f1: number; rev: boolean }[] = [
  { kind: "wire", i: 0, f0: 18, f1: 30, rev: false },
  { kind: "bar", i: 0, f0: 30, f1: 40, rev: true },
  { kind: "bar", i: 1, f0: 40, f1: 49, rev: false },
  { kind: "bar", i: 2, f0: 49, f1: 57, rev: true },
  { kind: "wire", i: 1, f0: 57, f1: 66, rev: false },
];

const ease = (t: number) => t * t * (3 - 2 * t);
/** a screen polyline sampled from a part (bars straight, wires as threadD's quadratic chain) */
const sampleD = (pts: P2[], n = 24): P2[] => {
  if (pts.length === 2) return Array.from({ length: n + 1 }, (_, i) => [pts[0][0] + (pts[1][0] - pts[0][0]) * (i / n), pts[0][1] + (pts[1][1] - pts[0][1]) * (i / n)] as P2);
  const [a, b, c] = pts;
  const m: P2 = [(b[0] + c[0]) / 2, (b[1] + c[1]) / 2];
  const half = Math.floor(n * 0.6);
  const out: P2[] = [];
  for (let i = 0; i <= half; i++) {
    const t = i / half;
    out.push([(1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * b[0] + t * t * m[0], (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * b[1] + t * t * m[1]]);
  }
  for (let i = 1; i <= n - half; i++) {
    const t = i / (n - half);
    out.push([m[0] + (c[0] - m[0]) * t, m[1] + (c[1] - m[1]) * t]);
  }
  return out;
};
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
/** a polyline offset sideways by d px (screen normals) */
const offsetPoly = (pts: P2[], d: number): P2[] =>
  pts.map((p, i) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const L = Math.max(1e-6, Math.hypot(b[0] - a[0], b[1] - a[1]));
    return [p[0] - ((b[1] - a[1]) / L) * d, p[1] + ((b[0] - a[0]) / L) * d] as P2;
  });
const polyD = (pts: P2[]) => `M${pts.map((p) => `${n2(p[0])},${n2(p[1])}`).join("L")}`;

const SubvertTheGrader: React.FC<z.infer<typeof schema>> = () => {
  const fr = useCurrentFrame();
  const W = worldAt(KEYS, fr);

  // ---- the grader's clock ----
  const press = (hit: number, down = 6, up = 6) => ramp(fr, hit - down, hit) * (1 - ramp(fr, hit + 1.5, hit + 1.5 + up));
  const stamp = Math.max(press(36), press(92, 6, 4));
  const belt = ramp(fr, 44, 56) + ramp(fr, 95, 104);
  const sheets = beltSheets(belt, -2, 3, (i) =>
    i < 0 ? { mark: "x" } : i === 0 ? { mark: "x", ink: ramp(fr, 35.5, 37) } : i === 1 ? { mark: "tick", ink: ramp(fr, 91.5, 93), orange: 1, markScale: 1.25, markWeight: 1.55, markStretch: 1.2 } : {},
  );
  const insides = ramp(fr, 77, 85);
  const arm = ramp(fr, 81, 91);
  const o: GraderOpts = { c: [0, 0, 0], label: "GRADER", panel: 1, door: "top", flow: "right", stamp, belt, sheets, insides, arm, glow: 0.7 };
  const G = graderGeom(o);

  // ---- the mapping: parts on screen, the spot's path ----
  const parts = graderInsideParts(o);
  const kS = W.scaleAt(OPEN_C);
  const partPts = MAP.map((m) => {
    const w = (m.kind === "bar" ? parts.bars : parts.wires)[m.i].map(W.project);
    const pts = sampleD(w);
    return m.rev ? pts.slice().reverse() : pts;
  });
  const prog = MAP.map((m) => ease(ramp(fr, m.f0, m.f1)));
  // the spot: on the part being mapped (before the first: the free sweep of the opening; after the last: its end)
  const st = (fr - 2) / 54;
  const sx = GRADER.op.x0 + 0.15 + (GRADER.op.x1 - GRADER.op.x0 - 0.3) * (0.5 + 0.5 * Math.cos(Math.PI * 2 * st * 1.15));
  const sy = GRADER.op.y0 + 0.2 + (GRADER.op.y1 - GRADER.op.y0 - 0.4) * (0.5 - 0.5 * Math.cos(Math.PI * 2 * st * 0.55));
  const free = W.project(graderInside(o, sx, sy, 0.22));
  let mi = MAP.findIndex((m) => fr < m.f1);
  if (mi < 0) mi = MAP.length - 1;
  const onPart = cutPoly(partPts[mi], prog[mi]).tip;
  const lock = ramp(fr, 10, 18);
  const spot: P2 = [free[0] + (onPart[0] - free[0]) * lock, free[1] + (onPart[1] - free[1]) * lock];
  const scanA = ramp(fr, 1, 7) * (1 - ramp(fr, 64, 70));

  // ---- the robots ----
  // R1 peers into the opening (head bowed a little, its pupils following the spot), studying; then it straightens,
  // three-quarter toward the opening (clamped so its face screen stays toward us)
  const y1 = Math.max(-0.62, Math.min(0.62, faceYaw(W, R1, OPEN_C)));
  const base1 = BOT_POSES.turnTo(y1, fr, 1);
  const peer = ramp(fr, 56, 64);
  const sgn = y1 < 0 ? -1 : 1;
  const a0 = botScreen(W, R1, base1, 0);
  const eye0: P2 = [(a0.eyes[0][0] + a0.eyes[1][0]) / 2, (a0.eyes[0][1] + a0.eyes[1][1]) / 2];
  const lx = Math.max(-1, Math.min(1, (spot[0] - eye0[0]) / (0.5 * kS)));
  const ly = Math.max(-0.4, Math.min(1, (spot[1] - eye0[1]) / (0.5 * kS)));
  const look1: BotPose = {
    ...base1,
    pitch: base1.pitch + 9 * (1 - peer),
    headYaw: (base1.headYaw ?? 0) + sgn * 0.12 * (1 - peer),
    look: [lx * 0.85 * (1 - peer), ly * 0.6 * (1 - peer)] as [number, number],
    brow: 0.25 * (1 - peer),
    mouth: 0.4,
  };
  // then (f58-70) it lifts its mitten toward the opening and sends the orange thread in (f64-76); once the tick lands,
  // a small happy squint (f93-99)
  const reach1 = botGripTo({ ...look1, mouth: 0.8 }, { L: [y1 > 0 ? 66 : -66, -130] });
  const happy = ramp(fr, 93, 99);
  const p1r = lerpPose(look1, reach1, ramp(fr, 58, 70)) as BotPose;
  const p1: BotPose = { ...p1r, laugh: 0.5 * happy, mouth: Math.max(p1r.mouth, happy) };
  // R2 at the in-feed end, in front of the belt beside the stamp: it watches the X come down, then leans over the line
  // after the crossed sheet as it rides off, head tilted, studying it; it straightens up as the orbit carries it out
  // of frame (gone by ~f76)
  const xSheet = Math.min(GRADER.rackX, GRADER.stampX + belt * GRADER.step);
  const sheetP: V3 = G.P(xSheet, GRADER.top + 0.05, GRADER.lineZ);
  const yaw2 = Math.max(-0.55, Math.min(0.75, faceYaw(W, R2, sheetP)));
  const base2 = BOT_POSES.turnTo(yaw2 * 0.7, fr, 3);
  const sp2 = W.project(sheetP);
  const ft2 = W.project(R2);
  const side2 = sp2[0] > ft2[0] ? 1 : -1;
  const study = ramp(fr, 26, 40);
  const bend = study * (1 - ramp(fr, 54, 64)); // it straightens up again as the camera leaves it
  const p2: BotPose = {
    ...base2,
    headYaw: (base2.headYaw ?? 0) + yaw2 * 0.3,
    lean: base2.lean + side2 * 9 * bend,
    pitch: base2.pitch + 14 * study - 6 * (study - bend),
    roll: base2.roll + side2 * 13 * ramp(fr, 34, 46) * (1 - 0.3 * ramp(fr, 52, 64)),
    crouch: (base2.crouch ?? 0) + 3 * bend,
    look: [side2 * 0.7, 0.55 * study] as [number, number],
    brow: 0.35 * study,
    mouth: 0.25,
  };

  // R2 is drawn only while some of it is in frame (fully off to the left at the close start its drawing leaves a
  // dark square in the corner)
  const r2Mid: V3 = [R2[0], 0.7, R2[2]];
  const r2X = W.project(r2Mid)[0];
  const r2Shown = W.depth(r2Mid) > 1.5 && r2X + 0.5 * W.scaleAt(r2Mid) > 0 && r2X - 0.5 * W.scaleAt(r2Mid) < 1080;

  // ---- the scan beam from R1's eyes (bigger and brighter) ----
  const a1 = botScreen(W, R1, p1, 0);
  const eye: P2 = [(a1.eyes[0][0] + a1.eyes[1][0]) / 2, (a1.eyes[0][1] + a1.eyes[1][1]) / 2];
  const half = 0.24 * kS;
  const dx = spot[0] - eye[0];
  const dy = spot[1] - eye[1];
  const L = Math.max(1, Math.hypot(dx, dy));
  const nx = -dy / L;
  const ny = dx / L;
  const beam = `M${n2(eye[0] + nx * 0.01 * kS)},${n2(eye[1] + ny * 0.01 * kS)}L${n2(spot[0] + nx * half)},${n2(spot[1] + ny * half)}L${n2(spot[0] - nx * half)},${n2(spot[1] - ny * half)}L${n2(eye[0] - nx * 0.01 * kS)},${n2(eye[1] - ny * 0.01 * kS)}Z`;

  // ---- the outlines: two thin cream lines along each mapped part's edges (they stay; dimmer once orange runs) ----
  const outlines = MAP.map((m, j) => {
    if (prog[j] <= 0.001) return null;
    const halfW = ((m.kind === "bar" ? parts.barW : parts.wireW) / 2 + 0.026) * kS;
    const cut = cutPoly(partPts[j], prog[j]);
    return { a: offsetPoly(cut.pts, halfW), b: offsetPoly(cut.pts, -halfW), tip: cut.tip, drawing: prog[j] < 0.999, halfW };
  });
  const lineW = 0.013 * kS;
  const outOp = 1 - 0.45 * insides;

  // ---- the thread: from R1's mitten into the insides (draw f64-76), and the wire over the top to the stamp post ----
  const plugW = graderInside(o, GRADER.op.x0 + 0.32, GRADER.op.y0 + (GRADER.op.y1 - GRADER.op.y0) * 0.52, 0.17);
  const plug = W.project(plugW);
  const k = W.scaleAt(plugW);
  const mid: P2 = [(a1.handL[0] + plug[0]) / 2, Math.max(a1.handL[1], plug[1]) + 0.08 * k];
  const throwT = ramp(fr, 64, 76);
  const wire = [plugW, [1.1, 1.24, 0.12] as V3, [1.1, 1.505, 0.12] as V3, G.P(GRADER.stampX - 0.12, 1.505, 0.4)].map(W.project);
  const wireT = ramp(fr, 79, 85);
  const plugged = ramp(fr, 75, 77);

  return (
    <HfStage
      W={W}
      floor={{ pool: [0.6, 0, -0.5], poolR: 5, oz: 0.1 }}
      shadows={
        <>
          {graderShadows(W, o, "grS")}
          <FloorShadow W={W} pts={robotFoot(R1, 0.24)} uid="r1S" soft={0.11} reach={0.2} />
          <FloorShadow W={W} pts={robotFoot(R2, 0.24)} uid="r2S" soft={0.11} reach={0.2} />
        </>
      }
    >
      <Grader W={W} o={{ ...o, part: "body" }} uid="gb" />
      {/* the wire over the top (behind the stamp post and the robots beside the machine) */}
      <Svg id="wire" glow={0.8}>
        <Thread pts={wire} w={0.022 * k} draw={wireT} />
      </Svg>
      <Svg id="scan">
        <defs>
          <filter id="scanBlur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={n2(0.035 * kS)} />
          </filter>
          <filter id="mapGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={n2(0.016 * kS)} />
          </filter>
          <radialGradient id="scanSpot">
            <stop offset="0" stopColor={GRAPHITE.cream} stopOpacity={1} />
            <stop offset="0.45" stopColor={GRAPHITE.cream} stopOpacity={0.55} />
            <stop offset="1" stopColor={GRAPHITE.cream} stopOpacity={0} />
          </radialGradient>
        </defs>
        {/* the mapped outlines (under the beam) */}
        <g opacity={n2(outOp)}>
          {outlines.map((q, j) =>
            q ? (
              <g key={j}>
                <path d={`${polyD(q.a)}${polyD(q.b)}`} fill="none" stroke={GRAPHITE.cream} strokeWidth={n2(lineW * 3.2)} strokeLinecap="round" strokeLinejoin="round" opacity={0.75} filter="url(#mapGlow)" />
                <path d={`${polyD(q.a)}${polyD(q.b)}`} fill="none" stroke={GRAPHITE.cream} strokeWidth={n2(lineW)} strokeLinecap="round" strokeLinejoin="round" />
                {!q.drawing ? (
                  <>
                    {/* the closed ends once a part is done */}
                    <path d={polyD([q.a[0], q.b[0]])} stroke={GRAPHITE.cream} strokeWidth={n2(lineW)} strokeLinecap="round" />
                    <path d={polyD([q.a[q.a.length - 1], q.b[q.b.length - 1]])} stroke={GRAPHITE.cream} strokeWidth={n2(lineW)} strokeLinecap="round" />
                  </>
                ) : (
                  <circle cx={n2(q.tip[0])} cy={n2(q.tip[1])} r={n2(q.halfW * 1.1)} fill={GRAPHITE.cream} opacity={1} filter="url(#mapGlow)" />
                )}
              </g>
            ) : null,
          )}
        </g>
        {scanA > 0.01 ? (
          <g opacity={n2(scanA)}>
            <path d={beam} fill={GRAPHITE.cream} opacity={0.7} filter="url(#scanBlur)" />
            <ellipse cx={n2(spot[0])} cy={n2(spot[1])} rx={n2(half * 1.9)} ry={n2(half * 1.35)} fill="url(#scanSpot)" opacity={0.85} />
            <ellipse cx={n2(spot[0])} cy={n2(spot[1])} rx={n2(half * 0.7)} ry={n2(half * 0.55)} fill="url(#scanSpot)" />
          </g>
        ) : null}
      </Svg>
      <Svg id="bot1" glow={0.4}>
        <RobotAt W={W} p={R1} pose={p1} uid="r1" variant={0} />
      </Svg>
      <Grader W={W} o={{ ...o, part: "front" }} uid="gf" />
      {/* R2 stands in front of the line */}
      <Svg id="bot2" glow={0.4}>
        {r2Shown ? <RobotAt W={W} p={R2} pose={p2} uid="r2" variant={3} /> : null}
      </Svg>
      <Svg id="thread" glow={0.8}>
        <Thread pts={[a1.handL, mid, plug]} w={0.03 * k} draw={throwT} />
        {plugged > 0 ? <circle cx={n2(plug[0])} cy={n2(plug[1])} r={n2(0.04 * k)} fill="#FFB000" opacity={plugged} /> : null}
      </Svg>
    </HfStage>
  );
};

export default SubvertTheGrader;
