// ---------------------------------------------------------------------------
// ReplicateOrExceed (rsi-years-in-days, cut 23). Dwarkesh style (styles/dwarkesh.md).
// Opaque 1080x1920, 23.976 fps, 129 frames.
//
// CHECK LINE: "Whatever ran inside Napoleon's and Rockefeller's heads, the AI copies it stroke for stroke, and
// then its copy grows bigger than theirs."
//
// THE LINE: "And whatever was going on inside these guys' brains, an AI should be able to replicate or even exceed."
// WORD -> FRAME: And -2 · whatever 0 · was 6 · going 13 · on 18 · inside 25 · these 30 · guys' 38 · brains 46 · an 58 ·
//   AI 61 · should 67 · be 72 · able 76 · to 81 · replicate 85 · or 93 · even 105 · exceed 113 (· "There's" ~122).
// DURATION: the slot 23.190 -> 28.570 s = 5.380 s x 23.976 = 129 frames (f0..f128), one composition over the
//   user's two disabled clips (their boundary is f60; nothing happens there).
//
// THE MOTION: a small gallery (replicateWorld.tsx): two white marble busts in profile on plinths, NAPOLEON and
// ROCKEFELLER cut into their faces, a white brain in a window in each head with pulses running along its folds; the
// orange intern stands right of them, facing them. One camera move: close on the two heads (k 1.95), one eased
// pull-back and pan right to the whole gallery (the intern comes into frame ~f37-50), then a slow creep toward the
// copy. On "an AI" two heavy orange threads leave the intern's head and touch the two brains; a thin orange scan
// line sweeps each white brain from the contact (its folds flare as it passes), and every frame the brains send a
// bright packet back along the threads, through the intern's head and up the thought dots into the copy above it;
// the copy (the same brain drawing, same size, same orientation) draws behind its own scan line exactly where the
// arriving packets' progress says. On "or even exceed" the threads and scan lines let go and the copy swells up and
// left to ~2.2x a white brain (~320 px), new folds drawing in, its traffic denser and faster. Settled and alive to
// the end. No fade.
// CAUSE -> EFFECT: the threads leave the head f56 and touch both brains at f66 (THREAD_CONTACT). The white scan
//   runs f66-77 (scanU); packets leave f66-77 and arrive TRANSIT = 12 frames later, so the copy's scan line and
//   strokes run f78-89 = scanU(f - 12): first orange stroke f78, copy complete f89, its pulses from f89. Threads and
//   scan lines retract f92-102; swell f99-118.
// Orange = the AI, nothing else; white = people and what they build.
//
// SOURCES: none (no figures). Mark: OpenAI (kits/dwarkesh/brandGlyphs, via the sister clip's AiFigure). The brain
// drawing is rsi-derpy-interns/BottleneckedWeights' (copied, read-only). The intern (AiFigure, figurePose) is the
// sister clip's (rsi-another-jump), imported read-only.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
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
  sway,
  worldTransform,
} from "../kits/dwarkesh/fieldShared";
import { INK } from "../kits/dwarkesh/alignShared";
import {
  BRAIN_IN_HEAD,
  BRAIN_SCALE,
  Brain,
  Bust,
  FLOOR,
  FLOOR_SW,
  HEAD_BOX,
  InternLeft,
  P,
  SCAN_R_MAX,
  SCAN_BAND,
  Traffic,
  contactOf,
  linePath,
  makePoly,
  polySlice,
} from "./replicateWorld";

export const FPS = 24000 / 1001;
export const DURATION = 129;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// --- the camera ------------------------------------------------------------------------
// One key track in (ln k, cx, cy), each frame a sum of eased segments, through the kit's damper. The damper starts
// at f-16 so the pull-back is already moving at f0.
const PRE = 14;
const K0 = 1.95;
const CX0 = 388;
const CY0 = 741; // the two brains at screen y ~880, the names still below the lower caption band
const Q = { x: 840, y: 520 }; // the creep closes on the copy
const K_CREEP = 1.04;
const SEGS = [
  { f0: -PRE, f1: 88, warp: 1.1, dl: Math.log(1 / K0), dx: 540 - CX0, dy: 960 - CY0 },
  {
    f0: 70,
    f1: 175,
    warp: 1,
    dl: Math.log(K_CREEP),
    dx: Q.x - (Q.x - 540) / K_CREEP - 540,
    dy: Q.y - (Q.y - 960) / K_CREEP - 960,
  },
];
const CAM = (() => {
  const T: { l: number; x: number; y: number }[] = [];
  for (let f = -PRE; f <= DURATION; f++) {
    let l = Math.log(K0);
    let x = CX0;
    let y = CY0;
    for (const sg of SEGS) {
      const u = camEase((f - sg.f0) / (sg.f1 - sg.f0), sg.warp);
      l += sg.dl * u;
      x += sg.dx * u;
      y += sg.dy * u;
    }
    T.push({ l, x, y });
  }
  const out: { k: number; cx: number; cy: number }[] = [];
  let { l, x, y } = T[0];
  let vl = 0;
  let vx = 0;
  let vy = 0;
  for (let i = 0; i < T.length; i++) {
    if (i > 0) {
      vl += (T[i].l - l) * CAM_STIFF - vl * CAM_DAMP;
      l += vl;
      vx += (T[i].x - x) * CAM_STIFF - vx * CAM_DAMP;
      x += vx;
      vy += (T[i].y - y) * CAM_STIFF - vy * CAM_DAMP;
      y += vy;
    }
    if (i >= PRE) out.push({ k: Math.exp(l), cx: x, cy: y });
  }
  return out;
})();
export const camAt = (f: number) => CAM[Math.max(0, Math.min(DURATION, Math.round(f)))];

// --- the beats ---------------------------------------------------------------------------
const THREAD_F0 = 56;
export const THREAD_CONTACT = 66;
// The transfer: the scan line sweeps each white brain f66-77; every frame the brains emit a packet carrying the
// line's progress at that moment; the packets ride the threads into the intern's head and up the thought dots in
// TRANSIT frames, and the copy's own scan line (and its strokes) stand where the arriving packets say: the copy's
// progress is the white scan's progress TRANSIT frames earlier. One variable (scanU), delayed by the visible trip.
const SCAN_DONE = 77; // the white brains are scanned
const TRANSIT = 12; // frames from a brain to the copy, on both routes
const COPY_DONE = SCAN_DONE + TRANSIT; // 89: the copy is complete
const RETRACT_F0 = 92;
const RETRACT_F1 = 102;
const SWELL_F0 = 99;
const SWELL_F1 = 118;
const SWELL_TO = 2.18; // ~320 screen px across at the end
const BUSY_F = 46; // "brains": the traffic peaks

/** the scan's progress at frame f, 0..1 */
const scanU = (f: number) => camEase((f - THREAD_CONTACT) / (SCAN_DONE - THREAD_CONTACT), 0.9);
const frontR = (f: number) => SCAN_R_MAX * scanU(f);
/** the copy's progress: what the packets arriving now were carrying */
const copyR = (f: number) => frontR(f - TRANSIT);
/** the white scan lines: out with the scan, back to the contact as the threads let go */
const lineR = (f: number) =>
  f < RETRACT_F0 ? frontR(f) : SCAN_R_MAX * (1 - camEase((f - RETRACT_F0) / (RETRACT_F1 - RETRACT_F0), 1));
const swellAt = (f: number) => 1 + (SWELL_TO - 1) * camEase((f - SWELL_F0) / (SWELL_F1 - SWELL_F0), 0.8);

// --- traffic -----------------------------------------------------------------------------
const busy = (f: number) => Math.exp(-(((f - BUSY_F) / 11) ** 2));
const NAP_TRAFFIC: Traffic = { seed: 1, period: (f) => 7 - 4.4 * busy(f), density: (f) => 0.5 + 0.5 * busy(f), speed: 8, len: 28 };
const ROCK_TRAFFIC: Traffic = {
  seed: 2,
  period: (f) => 10 - 6.5 * busy(f - 2),
  density: (f) => 0.5 + 0.5 * busy(f - 2),
  speed: 6,
  len: 32,
};
const COPY_TRAFFIC: Traffic = {
  seed: 3,
  period: (f) => 5 - 1.8 * smoothstep(clamp01((f - SWELL_F0) / 15)),
  density: (f) => 0.75 + 0.25 * smoothstep(clamp01((f - SWELL_F0) / 15)),
  speed: 11,
  len: 28,
};

// --- the copy and the dots ------------------------------------------------------------------
// At 1x the copy is a white brain's twin above the intern's head; it swells up and a little left, so the grown
// brain fills the air above (top ~y 340) and stays inside x 1015.
const C1: P = { x: 844.6, y: 548.4 }; // the copy's centre at 1x (world)
const CG: P = { x: 840, y: 455 }; // ... at SWELL_TO
const ATTACH: P = { x: 40, y: 60 }; // where the dots meet the brain (local units)
const copyAt = (f: number) => {
  const s = swellAt(f);
  const u = (s - 1) / (SWELL_TO - 1);
  const unit = BRAIN_SCALE * s;
  const c = { x: C1.x + (CG.x - C1.x) * u, y: C1.y + (CG.y - C1.y) * u };
  return { unit, c, attach: { x: c.x + unit * ATTACH.x, y: c.y + unit * ATTACH.y } };
};
const HEAD_TOP: P = { x: HEAD_BOX.cx, y: HEAD_BOX.y + 4 };
const DOTS = [
  { t: 0.24, r: 6.5, f0: 59 },
  { t: 0.52, r: 9, f0: 62 },
  { t: 0.8, r: 12, f0: 65 },
];
const dotAt = (t: number, attach: P): P => ({ x: HEAD_TOP.x + (attach.x - HEAD_TOP.x) * t, y: HEAD_TOP.y + (attach.y - HEAD_TOP.y) * t });
const DOT_SLIDE = 6;

// --- the threads ------------------------------------------------------------------------------
const THREAD_W = 9; // heavy enough to read at 270 px
/** a Catmull-Rom spline through the points, as a polyline */
const spline = (pts: P[], n = 20): P[] => {
  const out: P[] = [pts[0]];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let s = 1; s <= n; s++) {
      const t = s / n;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push({
        x: 0.5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
        y: 0.5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
      });
    }
  }
  return out;
};
const H_OUT: P = { x: HEAD_BOX.x + HEAD_BOX.size * 0.12, y: HEAD_BOX.cy - HEAD_BOX.size * 0.05 };
const C_ROCK = contactOf("rockefeller");
const C_NAP = contactOf("napoleon");
const ROCK_PTS = spline([H_OUT, { x: (H_OUT.x + C_ROCK.x) / 2, y: Math.min(H_OUT.y, C_ROCK.y) - 34 }, C_ROCK]);
const NAP_PTS = spline([
  { x: H_OUT.x, y: H_OUT.y - 10 },
  { x: H_OUT.x - 120, y: 560 },
  { x: 620, y: 432 },
  { x: 466, y: 446 },
  { x: 404, y: 566 },
  { x: 366, y: 684 },
  C_NAP,
]);
const THREAD_ROCK = makePoly(ROCK_PTS);
const THREAD_NAP = makePoly(NAP_PTS);
/** a packet's way: from the brain back along its thread, into the head, out of its top and up the dots into the copy */
const UP_PTS = (() => {
  const a = copyAt(0).attach;
  return [{ x: HEAD_BOX.cx, y: HEAD_BOX.cy }, HEAD_TOP, ...DOTS.map((d) => dotAt(d.t, a)), a];
})();
const ROUTE_ROCK = makePoly([...[...ROCK_PTS].reverse(), ...UP_PTS]);
const ROUTE_NAP = makePoly([...[...NAP_PTS].reverse(), ...UP_PTS]);
const PACKET_EVERY = 2; // frames between packets on one route
const PACKET_W = 12;
const PACKET_CORE = 5;

const threadProgress = (f: number) => {
  if (f < RETRACT_F0) return camEase((f - THREAD_F0) / (THREAD_CONTACT - THREAD_F0), 0.75);
  return 1 - camEase((f - RETRACT_F0) / (RETRACT_F1 - RETRACT_F0), 1);
};

const Thread: React.FC<{ poly: ReturnType<typeof makePoly>; frame: number }> = ({ poly, frame }) => {
  const pr = threadProgress(frame);
  if (pr <= 0) return null;
  const tip = polySlice(poly, 0, poly.len * pr);
  const end = tip[tip.length - 1];
  return (
    <g>
      <path d={linePath(tip)} fill="none" stroke={ACCENT} strokeWidth={THREAD_W} strokeLinecap="round" strokeLinejoin="round" />
      {pr < 1 ? <circle cx={end.x} cy={end.y} r={THREAD_W * 1.2} fill={INK} /> : null}
    </g>
  );
};

/** the transfer: packets leave the brain every PACKET_EVERY frames while the scan runs (f66-77) and reach the
 *  copy TRANSIT frames later, each drawn as a short bright streak along its route */
const Packets: React.FC<{ route: ReturnType<typeof makePoly>; frame: number; phase: number }> = ({ route, frame, phase }) => {
  const speed = route.len / TRANSIT;
  const tail = Math.min(speed * 0.7, 46);
  const out: React.ReactNode[] = [];
  for (let e = THREAD_CONTACT + phase; e <= SCAN_DONE; e += PACKET_EVERY) {
    const age = frame - e;
    if (age < 0 || age > TRANSIT) continue;
    const d = age * speed;
    const seg = polySlice(route, d - tail, d);
    if (seg.length < 2) continue;
    out.push(
      <g key={e}>
        <path d={linePath(seg)} fill="none" stroke={ACCENT} strokeWidth={PACKET_W} strokeLinecap="round" strokeLinejoin="round" />
        <path d={linePath(seg)} fill="none" stroke={INK} strokeWidth={PACKET_CORE} strokeLinecap="round" strokeLinejoin="round" />
      </g>,
    );
  }
  return <>{out}</>;
};

const ReplicateOrExceed: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const s = sway(frame);
  const k = cam.k;
  const cx = cam.cx + s.dx / k;
  const cy = cam.cy + s.dy / k;
  const { tx, ty } = worldTransform(cx, cy, k);
  const cam0 = CAM[0];

  const r = frontR(frame);
  const scanning = frame >= THREAD_CONTACT && r < SCAN_R_MAX + SCAN_BAND;
  const lr = lineR(frame);
  const rc = copyR(frame);
  const { unit, c: copyC, attach } = copyAt(frame);

  const headBrain = (who: "napoleon" | "rockefeller", tr: Traffic) => (
    <g transform={`translate(${BRAIN_IN_HEAD.x} ${BRAIN_IN_HEAD.y}) scale(${BRAIN_SCALE})`}>
      <Brain id={`ro-${who}`} frame={frame} unit={BRAIN_SCALE} kind="white"
        traffic={tr}
        scanR={scanning ? r : undefined}
        scanLine={frame >= THREAD_CONTACT && lr > 0 && lr < SCAN_R_MAX ? lr : undefined}
      />
    </g>
  );

  return (
    <AbsoluteFill style={{ backgroundColor: BG_BASE }}>
      <GridBackground
        src="grid-background.jpg"
        blur={13}
        dim={BG_DIM}
        frame={frame}
        cy={cy}
        cyRest={cam0.cy}
        cx={cx}
        cxRest={cam0.cx}
        k={k}
        parallax={0.15}
      />
      <AbsoluteFill style={{ filter: `drop-shadow(0 ${SHADOW_Y}px ${SHADOW_BLUR}px rgba(0,0,0,${SHADOW_OPACITY}))` }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 1080,
            height: 1920,
            transformOrigin: "0 0",
            transform: `translate(${tx}px, ${ty}px) scale(${k})`,
          }}
        >
          <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            {/* the gallery floor */}
            <g style={{ filter: iconShadow(k) }}>
              <line x1={-600} x2={1700} y1={FLOOR + FLOOR_SW / 2} y2={FLOOR + FLOOR_SW / 2} stroke={INK} strokeWidth={FLOOR_SW} />
            </g>
            <Bust k={k} who="napoleon">
              {headBrain("napoleon", NAP_TRAFFIC)}
            </Bust>
            <Bust k={k} who="rockefeller">
              {headBrain("rockefeller", ROCK_TRAFFIC)}
            </Bust>
            {/* the scan threads (under the intern: they leave from behind its head) */}
            <g style={{ filter: iconShadow(k) }}>
              <Thread poly={THREAD_NAP} frame={frame} />
              <Thread poly={THREAD_ROCK} frame={frame} />
            </g>
            {/* the copy, above the intern's head */}
            <g style={{ filter: iconShadow(k) }}>
              {DOTS.map((d, i) => {
                const u = smoothstep(clamp01((frame - d.f0) / DOT_SLIDE));
                if (u <= 0) return null;
                const bob = 2 * Math.sin((frame + 9 * i) / 14) * u;
                const q = dotAt(d.t, attach);
                return (
                  <circle
                    key={i}
                    cx={HEAD_BOX.cx + (q.x - HEAD_BOX.cx) * u}
                    cy={HEAD_BOX.cy + (q.y - HEAD_BOX.cy) * u + bob}
                    r={d.r}
                    fill={ACCENT}
                  />
                );
              })}
              <g transform={`translate(${copyC.x.toFixed(3)} ${copyC.y.toFixed(3)}) scale(${unit.toFixed(5)})`}>
                <Brain
                  id="ro-copy"
                  frame={frame}
                  unit={unit}
                  kind="orange"
                  traffic={COPY_TRAFFIC}
                  trafficFrom={COPY_DONE}
                  reveal={frame >= THREAD_CONTACT ? rc : 0}
                  scanLine={rc > 0 && rc < SCAN_R_MAX ? rc : undefined}
                  extra={clamp01((frame - SWELL_F0 - 3) / (SWELL_F1 - SWELL_F0 - 2))}
                  extraFrom={SWELL_F1 - 6}
                />
              </g>
            </g>
            {/* the packets: over the threads and the dots, under the intern's head (they pass through it) */}
            <g style={{ filter: iconShadow(k) }}>
              <Packets route={ROUTE_NAP} frame={frame} phase={0} />
              <Packets route={ROUTE_ROCK} frame={frame} phase={1} />
            </g>
            <InternLeft k={k} breathT={frame} />
          </svg>
        </div>
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

export default ReplicateOrExceed;
