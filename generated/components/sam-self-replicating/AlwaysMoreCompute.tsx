// ---------------------------------------------------------------------------
// AlwaysMoreCompute (sam-self-replicating, cut 15). Cheeky Pint style (stout) (styles/cheeky-pint.md).
// Opaque 1080x1920, 23.976 fps, 112 frames. Palette B1.
//
// CHECK LINE: "Pull back and the bumps are noise on one climb, and however many racks we build, demand is always still
// above them."
//
// THE LINE: "But I think the trend is toward a, we always just want more compute."
// WORD -> FRAME: But 0 · I 3 · think 5 · the 10 · trend 13 · is 22 · toward 33 · a 46 · we 63 · always 72 · just 78 ·
// want 83 · more 87 · compute 92 · Like 104 · the 110.
// DURATION: the slot 15.474 -> 20.145 s (sequence frames 371-483) = 112 frames (f0..f111). Rev 1 added f105-f111 to the
// first delivery's 105 frames; f0-f104 are pixel-identical to it.
//
// THE MOTION: one amber line drawing while the camera makes one long eased pull-back and rise: it opens close on cut A's
// stumbles (the same geometry, imported from computeCurve, up to the crouch), and by "trend" they are ripples on one
// long sweep. From "toward" cream rack towers rise out of slots in the ground, left to right, each one taller and
// faster, each stopping just under the line (contact = the end of its rise; its LEDs run up from the foot on the next
// frame). The tip is always ahead of the newest tower, and the next tower is still coming up on the last frame.
// AMBER = compute (the demand for it, and the LEDs of what serves it); cream = the supply; the board = context.
//
// SOURCES: none. The curve is an unlabelled proxy shape: no data, no numbers.
// ---------------------------------------------------------------------------
import React, { useId } from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { ALPHA, COLOR, EDGE, StoutStage, amberBandFor, bloomFilter, clamp01, lerp, mixHex, rectPath, smoothstep } from "../kits/cheeky-pint/stoutShared";
import { UnionShadow, makeClockCam, makePoolTrack } from "../kits/cheeky-pint/museShared";
import { CURVE_LEN, GROUND_Y, GroundFloor, KINK, LineStroke, curveAt } from "./computeCurve";

export const FPS = 24000 / 1001;
export const DURATION = 112;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const n6 = (v: number) => (Math.round(v * 1e6) / 1e6).toString();

// --- the long curve: cut A's line up to its crouch, then one long sweep on (A's own overshoot belongs to A) -----------
type P = { x: number; y: number };
const hermite = (a: P, b: P, ma: P, mb: P, t: number): P => {
  const t2 = t * t;
  const t3 = t2 * t;
  const h00 = 2 * t3 - 3 * t2 + 1;
  const h10 = t3 - 2 * t2 + t;
  const h01 = -2 * t3 + 3 * t2;
  const h11 = t3 - t2;
  return { x: h00 * a.x + h10 * ma.x + h01 * b.x + h11 * mb.x, y: h00 * a.y + h10 * ma.y + h01 * b.y + h11 * mb.y };
};
const LINE: P[] = (() => {
  const pts: P[] = [];
  const STEP = 1.5;
  for (let a = 0; a < KINK.crouch; a += STEP) pts.push(curveAt(a / CURVE_LEN));
  const crouch = curveAt(KINK.crouch / CURVE_LEN);
  pts.push(crouch);
  const w1 = { x: 880, y: 1146 };
  const w2 = { x: 2440, y: -640 };
  const N = 500;
  for (let i = 1; i <= 90; i++) pts.push(hermite(crouch, w1, { x: 200, y: -40 }, { x: 240, y: -210 }, i / 90));
  for (let i = 1; i <= N; i++) pts.push(hermite(w1, w2, { x: 1190, y: -1041 }, { x: 1320, y: -2480 }, i / N));
  return pts;
})();
const LINE_ARC: number[] = [0];
for (let i = 1; i < LINE.length; i++) LINE_ARC.push(LINE_ARC[i - 1] + Math.hypot(LINE[i].x - LINE[i - 1].x, LINE[i].y - LINE[i - 1].y));
const LINE_LEN = LINE_ARC[LINE_ARC.length - 1];
const lineAt = (arc: number): P => {
  const a = Math.max(0, Math.min(LINE_LEN, arc));
  let lo = 0;
  let hi = LINE_ARC.length - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (LINE_ARC[m] <= a) lo = m;
    else hi = m;
  }
  const t = (a - LINE_ARC[lo]) / Math.max(1e-9, LINE_ARC[hi] - LINE_ARC[lo]);
  return { x: lerp(LINE[lo].x, LINE[hi].x, t), y: lerp(LINE[lo].y, LINE[hi].y, t) };
};
/** The line's height over world x: its lowest (largest y) point across [x0, x1], for a tower standing there. */
const lowestOver = (x0: number, x1: number) => {
  let y = -Infinity;
  for (const p of LINE) if (p.x >= x0 && p.x <= x1) y = Math.max(y, p.y);
  return y;
};

// --- the tip: arc length against the frame, a monotone cubic with a real ease-in and a line that never stops ----------
const C = KINK.crouch;
const TIP_KEYS: readonly [number, number][] = [
  [0, C - 34],
  [16, C + 180],
  [34, C + 760],
  [60, C + 1420],
  [84, C + 2020],
  [104, C + 2480],
];
const TIP_M0 = 3;
const TIP_MN = 22;
// Rev 1's tail, f104 -> f111: it leaves on f104's speed and eases to a creep. It sits outside TIP_KEYS so the slopes above,
// and with them every frame up to f104, stay as delivered.
const TAIL = { f0: 104, f1: 111, a0: C + 2480, a1: C + 2480 + 112, m0: TIP_MN, m1: 10 } as const;
const tipSlopes = (() => {
  const n = TIP_KEYS.length;
  const d: number[] = [];
  for (let i = 0; i < n - 1; i++) d.push((TIP_KEYS[i + 1][1] - TIP_KEYS[i][1]) / (TIP_KEYS[i + 1][0] - TIP_KEYS[i][0]));
  const m: number[] = [TIP_M0];
  for (let i = 1; i < n - 1; i++) m.push((2 * d[i - 1] * d[i]) / (d[i - 1] + d[i]));
  m.push(TIP_MN);
  return m;
})();
export const tipArc = (f: number) => {
  if (f > TAIL.f0) {
    const h = TAIL.f1 - TAIL.f0;
    const t = (f - TAIL.f0) / h;
    const t2 = t * t;
    const t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * TAIL.a0 + (t3 - 2 * t2 + t) * h * TAIL.m0 + (-2 * t3 + 3 * t2) * TAIL.a1 + (t3 - t2) * h * TAIL.m1;
  }
  const K = TIP_KEYS;
  const hit = K.findIndex((q, j) => j < K.length - 1 && f < K[j + 1][0]);
  const i = hit < 0 ? K.length - 2 : hit;
  const h = K[i + 1][0] - K[i][0];
  const t = (f - K[i][0]) / h;
  const t2 = t * t;
  const t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * K[i][1] + (t3 - 2 * t2 + t) * h * tipSlopes[i] + (-2 * t3 + 3 * t2) * K[i + 1][1] + (t3 - t2) * h * tipSlopes[i + 1];
};

// --- the camera: one long pull-back and rise, a second glide overlapping it so the climb never holds ------------------
export const CAM = makeClockCam(
  { x: 500, y: 1470, k: 2.75 },
  [
    { f0: -6, f1: 52, dx: 620, dy: -560, k: 0.5 },
    { f0: 34, f1: 118, dx: 250, dy: -150, k: 0.4 },
  ],
  DURATION,
);
const POOL = makePoolTrack({ x: 560, y: 1400, strength: 1 }, [{ f0: -6, f1: 110, x: 1500, y: 700, strength: 1.5 }], DURATION);

// --- the racks ---------------------------------------------------------------------------------------------------------
const RACK = { w: 304, pitch: 334, x0: 288, gap: 118, unit: 90, cap: 40, r: 16, slit: 15 } as const;
// [rise start, rise frames]: arrivals speed up on "always just want more compute", the last is still rising at the end
const TIMING: readonly [number, number][] = [
  [40, 15],
  [50, 15],
  [60, 14],
  [68, 14],
  [75, 14],
  [82, 14],
  [91, 34],
];
type Tower = { x0: number; x1: number; cx: number; h: number; n: number; u: number; start: number; dur: number };
const TOWERS: Tower[] = TIMING.map(([start, dur], i) => {
  const x0 = RACK.x0 + i * RACK.pitch;
  const x1 = x0 + RACK.w;
  const h = GROUND_Y - lowestOver(x0 - 8, x1) - RACK.gap;
  const n = Math.max(2, Math.round((h - RACK.cap) / RACK.unit));
  return { x0, x1, cx: (x0 + x1) / 2, h, n, u: (h - RACK.cap) / n, start, dur };
});
/** A weighty rise: it leaves the slot with a short ease-in and damps into its stop, with no bounce. */
const riseAt = (f: number, t: Tower) => {
  const v = clamp01((f - t.start) / t.dur);
  const e = smoothstep(v);
  return lerp(e, 1 - Math.pow(1 - v, 3), 0.55);
};
/** Slots run on past the last tower and off the frame: there is always room for one more. */
const SLOTS = Array.from({ length: 12 }, (_, i) => RACK.x0 + i * RACK.pitch);

const Rack: React.FC<{ t: Tower; f: number; k: number; uid: string }> = ({ t, f, k, uid }) => {
  const rise = riseAt(f, t);
  if (rise <= 0) return null;
  const top = GROUND_Y - t.h * rise;
  const m = 34; // the slot's side margin in the face
  const slotH = 0.54 * RACK.unit;
  const led = 0.17 * RACK.unit;
  const contact = t.start + t.dur;
  const slots: string[] = [];
  const leds: React.ReactNode[] = [];
  for (let i = 0; i < t.n; i++) {
    const y = top + RACK.cap + i * t.u + (t.u - slotH) / 2;
    if (y > GROUND_Y + 4) break;
    slots.push(rectPath(t.x0 + m, y, RACK.w - 2 * m, slotH, slotH * 0.28));
    // the LEDs run up from the foot, on the frame after contact
    const on = clamp01((f - contact - 0.6 - (t.n - 1 - i) * 0.42) / 3);
    const cy = y + slotH / 2;
    const xs = [t.x1 - m - slotH * 0.5, t.x1 - m - slotH * 1.32];
    for (let j = 0; j < 2; j++) {
      leds.push(<circle key={`${i}-${j}`} cx={n6(xs[j])} cy={n6(cy)} r={n6(led)} fill={on > 0 ? mixHex(COLOR.amberFoot, COLOR.amberTop, on) : "none"} opacity={n6(on)} />);
    }
  }
  return (
    <g>
      <path d={rectPath(t.x0, top, RACK.w, GROUND_Y - top + 2600, RACK.r)} fill={`url(#${uid}f)`} />
      <path
        d={`M${n6(t.x0 + RACK.r)} ${n6(top + EDGE.CREAM / k / 2)}H${n6(t.x1 - RACK.r)}`}
        stroke={COLOR.edge}
        strokeOpacity={ALPHA.edge}
        strokeWidth={n6(EDGE.CREAM / k)}
      />
      <path d={slots.join("")} fill={COLOR.inkDark} />
      <g style={{ filter: rise >= 1 ? bloomFilter(k) : undefined }}>{leds}</g>
    </g>
  );
};

/** The line drawn to its tip, on the long path. */
const LongCurve: React.FC<{ arc: number; k: number; band: [number, number] }> = ({ arc, k, band }) => {
  let d = "";
  for (let i = 0; i < LINE.length && LINE_ARC[i] < arc; i++) d += `${i ? "L" : "M"}${n6(LINE[i].x)} ${n6(LINE[i].y)}`;
  const e = lineAt(arc);
  d += `L${n6(e.x)} ${n6(e.y)}`;
  return <LineStroke d={d} e={e} k={k} band={band} />;
};

const AlwaysMoreCompute: React.FC<z.infer<typeof schema>> = () => {
  const S = useCurrentFrame();
  const cam = CAM.at(S);
  const uid = useId().replace(/[^A-Za-z0-9_-]/g, "_");
  const k = cam.k;
  const live = TOWERS.filter((t) => riseAt(S, t) > 0);
  // one shared shadow for the whole row: only the part above the ground
  const sil = live.map((t) => {
    const top = GROUND_Y - t.h * riseAt(S, t);
    return { d: rectPath(t.x0, top, RACK.w, GROUND_Y - top, RACK.r, true, false) };
  });
  return (
    <StoutStage S={S} cam={cam} rest={CAM.rest} pool={POOL(S)}>
      <defs>
        <linearGradient id={`${uid}f`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COLOR.cream} />
          <stop offset="1" stopColor={COLOR.creamFoot} />
        </linearGradient>
      </defs>
      {sil.length ? <UnionShadow sil={sil} s={4} elevation="rest" /> : null}
      {TOWERS.map((t, i) => (
        <Rack key={i} t={t} f={S} k={k} uid={uid} />
      ))}
      <LongCurve arc={tipArc(S)} k={k} band={amberBandFor(cam)} />
      {/* the ground, in front of everything that is still inside it, with its slots */}
      <GroundFloor k={k} />
      {SLOTS.map((x, i) => (
        <rect key={i} x={n6(x - 6)} y={GROUND_Y} width={RACK.w + 12} height={RACK.slit} rx={RACK.slit / 2} fill={COLOR.inkDark} fillOpacity={ALPHA.slot + 0.2} />
      ))}
    </StoutStage>
  );
};

export default AlwaysMoreCompute;
