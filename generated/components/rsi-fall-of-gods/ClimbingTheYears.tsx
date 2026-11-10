// ---------------------------------------------------------------------------
// ClimbingTheYears (rsi-fall-of-gods, cut 1). Dwarkesh style (styles/dwarkesh.md).
// Opaque 1080x1920, 23.976 fps, 379 frames.
//
// CHECK LINE: "in three years the AI went from botching school arithmetic, past a maths competition and an
// olympiad gold, to solving real open problems — one step up per year."
//
// THE LINE: "As recently as 2023, these models couldn't reliably add four-digit numbers. In 2024, they could
// barely solve any problems in a high school math competition. In 2025, they could win a gold medal in the
// International Math Olympiad. To earlier this year, where they finally started to solve some niche open
// problems."
// WORD -> FRAME (composition frames; Whisper reads 2-7 f early): As -1 · recently 2 · 2023 14 · these 32 ·
// models 41 · couldn't 49 · reliably 59 · add 65 · four-digit 77 · numbers 87 · In 98 · 2024 100 · barely 128 ·
// solve 135 · any 143 · problems 149 · high 169 · school 173 · math 178 · competition 183 · In 197 · 2025 200 ·
// win 230 · gold 238 · medal 242 · International 256 · Math 261 · Olympiad 269 · To 283 · earlier 286 ·
// this 292 · year 298 · finally 315 · started 323 · solve 335 · some 341 · niche 345 · open 353 · problems 361.
// DURATION: the slot 1.960 -> 17.768 s = 15.807 s x 23.976 = 379 frames (f0..f378).
//
// THE MOTION: one white staircase, one step per year, climbing up-right (a profile stair cannot zig-zag
// without its risers stacking into one spine, so the camera follows the diagonal instead and the active landing
// stays in the central column). The camera is one damped track: three eased moves landing to landing, each
// craning up first and panning right 2 f later (the shape of the leap), on a constant creep up the stair and a
// slow zoom creep (k 0.99 -> 1.03), never a hold. The AI is ONE orange dot that leaps up each riser and works the
// year's artefact through a short orange thread: 2023 it writes 4,738 + 2,594 = 7,322 right-to-left (tens digit
// wrong; true sum 7,332) and a white ring lands on the wrong digit; 2024 its thread runs down the margin of a
// 15-problem competition sheet and ticks only two; 2025 it reaches the IMO medal and the medal converts
// white -> orange; 2026 it chains through three of six dashed "?" cards, each closing to solid orange with a
// white tick. The dot grows (r 23 -> 35 world) and goes ACCENT_DEEP -> ACCENT a step per year, over the second
// half of each leap. Above the 2026 landing the stair continues as dashed steps fading into the grid.
// Director pass: short risers (run 580, rise 480) so every resting frame holds the current landing near the
// middle, last year's landing lower-left (white drained to INK_LO, its orange kept in ACCENT_DEEP) and the next
// riser upper-right; the year is cut into the face of its step, under the tread's right end. Every year label
// and artefact is in the world from f0 at INK_AHEAD (the camera reveals it), lights to INK_HI as the dot lands
// and drains to INK_LO after it leaves. Each camera move starts 8 f before the leap, so the new landing reaches
// the centre as the dot lands. Dot 46 -> 70 screen px; leap peak ~46 screen px/f (measured with dotOnScreen).
// BEATS (contact -> first reaction): hop 0 lands f4 (opening: the dot drops onto 2023, camera settling from
// down-left). Thread on 2023's answer row f46; tip on a column -> that digit slides in f46/51/56/61 (units,
// tens, hundreds, thousands). Ring draws f64-73, lands (back ease) f76. Leaps: off f76/174/268, land
// f102/200/294 (on "2024", "2025", "this year"). Sheet thread arrives f118, tip passes row 2 f121 -> tick f122-129,
// row 8 f141 -> tick f142-149, thread fades f166-174. Medal thread arrives on the rim f224 -> wipe from the
// contact point f228-240, face + inner ring f232-242 ("gold medal" 238/242), thread holds with packets, fades
// f258-268. Cards: dot -> A arrives f327 -> dashes close + white -> orange f327-335, "?" -> tick f328-338;
// A -> B arrives f343, B -> C arrives f357 (settled f366, "problems" 361). Resolved and alive (packets on the
// chain, marching dashes, sway, grid drift, creep) f366-378.
// Orange = the AI, nothing else; white = people, maths, structure, labels; dashed = not solved yet.
//
// SOURCES: the years are the speaker's. The four-digit sum is illustrative (the speaker's claim), not data.
// "IMO" = International Mathematical Olympiad (gold-medal level, 2025). No figures on screen.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  BG_BASE,
  BG_DIM,
  CAM_DAMP,
  CAM_STIFF,
  GridBackground,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  breath,
  camEase,
  clamp,
  clamp01,
  hash,
  iconShadow,
  makeTone,
  smoothstep,
  squirclePath,
  sway,
  worldTransform,
} from "../kits/dwarkesh/fieldShared";
import {
  FONT_LABEL,
  INK,
  INK_HI,
  INK_LO,
  LABEL_WEIGHT,
  Label,
  worldPx,
} from "../kits/dwarkesh/alignShared";
import { strokeFor } from "../kits/dwarkesh/punishShared";
import { threadPackets } from "../kits/dwarkesh/trapShared";

export const FPS = 24000 / 1001;
export const DURATION = 379;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// ---------------------------------------------------------------------------
// Scale. Everything is sized for the resting zoom.
// ---------------------------------------------------------------------------
const K_REST = 1.0;
const SW = strokeFor(K_REST); // the one stroke weight (6.5 screen px)
const THREAD = SW / 2;
const PACKET_R = worldPx(3.6, K_REST);
const HEAD_R = worldPx(5, K_REST);
const DASH_ON = worldPx(26, K_REST);
const DASH_OFF = worldPx(18, K_REST);
const MARCH = worldPx(0.6, K_REST);
const LABEL_SIZE = worldPx(48, K_REST);

const MODEL_TONE = makeTone(ACCENT_DEEP, ACCENT);
const CONVERT_TONE = makeTone("#FFFFFF", ACCENT);

// ---------------------------------------------------------------------------
// The staircase. Step n (n = 0..3 are 2023..2026) has its tread from x L(n) to L(n)+RUN at height T(n); the
// riser up to step n+1 stands at x L(n+1). Steps below 2023 are solid, steps above 2026 are dashed.
// ---------------------------------------------------------------------------
// Short risers: at rest the frame holds the current landing, last year's landing lower-left and the next
// riser upper-right, so every frame reads as a stair being climbed.
const RUN = 580;
const RISE = 480;
const L0 = 200;
const T0 = 1400;
const Lx = (n: number) => L0 + RUN * n;
const Ty = (n: number) => T0 - RISE * n;
const YEARS = ["2023", "2024", "2025", "2026"];

// The dot. Hero size, a step bigger and riper each year.
const DOT_R = [23, 27, 31, 35]; // 46 -> 70 screen px across
const DOT_T = [0, 0.34, 0.67, 1];
const DOT_X = 50; // its seat on a tread, from the tread's left end

// Hops: the dot leaves step `from` at f0 and lands on step `to` at f1.
const HOPS = [
  { f0: -20, f1: 4, to: 0 },
  { f0: 76, f1: 102, to: 1 },
  { f0: 174, f1: 200, to: 2 },
  { f0: 268, f1: 294, to: 3 },
];

// The arc of a hop from a seat on step n to the seat on step n+1, in step-n-relative px. It rises almost
// straight up past the artefact's left edge and the label, then crosses over and drops onto the next tread
// just right of the riser top.
const bez = (p0: number, p1: number, p2: number, p3: number, t: number) => {
  const u = 1 - t;
  return (
    u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3
  );
};
const hopPos = (n: number, t: number, r0: number, r1: number) => {
  const L = Lx(n);
  const T = Ty(n);
  const x = bez(L + DOT_X, L + 20, L + 380, L + RUN + DOT_X, t);
  const y = bez(T - r0 - SW / 2, T - 1000, T - 640, T - RISE - r1 - SW / 2, t);
  return { x, y };
};
// The bezier's own parameter runs fastest off the tread (its first handle is long), so the dot is moved by
// ARC LENGTH instead: s (0..1 of the path) -> t through a table built once. The speed along the path is then
// exactly the ease's, slowest at takeoff and landing, fastest mid-air where the camera is moving with it.
const HOP_LUT: number[] = (() => {
  const N = 400;
  const acc: number[] = [0];
  let prev = hopPos(0, 0, 27, 27);
  for (let i = 1; i <= N; i++) {
    const p = hopPos(0, i / N, 27, 27);
    acc.push(acc[i - 1] + Math.hypot(p.x - prev.x, p.y - prev.y));
    prev = p;
  }
  return acc.map((a) => a / acc[N]);
})();
const tOfS = (s: number) => {
  const v = clamp01(s);
  let lo = 0;
  let hi = HOP_LUT.length - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (HOP_LUT[m] < v) lo = m;
    else hi = m;
  }
  const span = HOP_LUT[hi] - HOP_LUT[lo];
  const u = span > 0 ? (v - HOP_LUT[lo]) / span : 0;
  return (lo + u) / (HOP_LUT.length - 1);
};
// Half linear, half smoothstep: the dot springs off the tread (no dead start) and settles onto the next.
const hopEase = (t: number) => tOfS(0.5 * t + 0.5 * smoothstep(t));

const dotState = (f: number) => {
  // which hop are we in / after
  let step = -1;
  for (const h of HOPS) {
    if (f >= h.f1) step = h.to;
  }
  for (const h of HOPS) {
    if (f > h.f0 && f < h.f1) {
      const t = hopEase((f - h.f0) / (h.f1 - h.f0));
      const n = h.to - 1;
      const rPrev = DOT_R[Math.max(0, n)];
      const rNext = DOT_R[h.to];
      const p = hopPos(n, t, rPrev, rNext);
      // it ripens and grows over the second half of the leap: it arrives as the next year's model
      const g = smoothstep((t - 0.45) / 0.55);
      const r = rPrev + (rNext - rPrev) * g;
      const tone =
        DOT_T[Math.max(0, n)] + (DOT_T[h.to] - DOT_T[Math.max(0, n)]) * g;
      return { x: p.x, y: p.y, r, tone };
    }
  }
  const n = Math.max(0, step);
  const r = DOT_R[n];
  return { x: Lx(n) + DOT_X, y: Ty(n) - r - SW / 2, r, tone: DOT_T[n] };
};

// A landing is INK_LO until the dot lands on it, INK_HI while it is there, and drains back to INK_LO once the
// dot has left.
const landF = (n: number) => HOPS[n].f1;
const INK_AHEAD = 0.25; // a landing not reached yet: present, quieter than a passed one
const leaveF = (n: number) => (n + 1 < HOPS.length ? HOPS[n + 1].f0 : 1e9);
const inkOf = (n: number, f: number) => {
  const up = interpolate(
    f,
    [landF(n) - 2, landF(n) + 8],
    [INK_AHEAD, INK_HI],
    clamp,
  );
  const down = interpolate(
    f,
    [leaveF(n) + 4, leaveF(n) + 18],
    [0, INK_HI - INK_LO],
    clamp,
  );
  return up - down;
};
const drainOf = (n: number, f: number) =>
  interpolate(f, [leaveF(n) + 4, leaveF(n) + 18], [0, 1], clamp);

// ---------------------------------------------------------------------------
// The camera: a per-frame target (three eased moves landing to landing, on a slow constant creep up the
// stair and a slow zoom creep), followed by the kit's damped tracker in x, y and k.
// The focus of landing n puts its tread at screen y ~1010 and its group (dot + artefact) at screen x 540.
// ---------------------------------------------------------------------------
const TREAD_SCREEN_Y = 995;
// where the tread's left end sits on screen at rest; the last landing sits further right so the orange 2025
// medal stays in shot lower-left beside the 2026 cards
const TREAD_SCREEN_X = [270, 270, 270, 360];
const anchor = (n: number, k: number) => ({
  x: Lx(n) + (540 - TREAD_SCREEN_X[n]) / k,
  y: Ty(n) - (TREAD_SCREEN_Y - 960) / k,
});
// Each move cranes UP first and pans RIGHT a few frames later, the shape of the dot's own leap (straight up past
// the artefact, then across), so the camera never drags the rising dot off the left edge.
// The move LEADS the leap: it starts 8 f before takeoff and its target arrives 4 f after the landing, so the
// new landing reaches the centre as the dot lands.
const X_LAG = 2;
const MOVES = [
  { f0: 68, f1: 106, warp: 0.85 },
  { f0: 166, f1: 204, warp: 0.85 },
  { f0: 260, f1: 298, warp: 0.85 },
];
const K_AT = (f: number) => 0.99 + 0.04 * clamp01(f / (DURATION - 1));
const CREEP = 0.16; // world px per frame up the stair diagonal
const CREEP_DIR = (() => {
  const l = Math.hypot(RUN, RISE);
  return { x: RUN / l, y: -RISE / l };
})();

const camTarget = (f: number) => {
  const k = K_AT(f);
  let x = anchor(0, k).x;
  let y = anchor(0, k).y;
  MOVES.forEach((m, i) => {
    const g = camEase((f - m.f0) / (m.f1 - m.f0), m.warp);
    const gx = camEase((f - m.f0 - X_LAG) / (m.f1 - m.f0), m.warp);
    const a = anchor(i, k);
    const b = anchor(i + 1, k);
    x += (b.x - a.x) * gx;
    y += (b.y - a.y) * g;
  });
  x += CREEP_DIR.x * CREEP * (f - 190);
  y += CREEP_DIR.y * CREEP * (f - 190);
  return { x, y, k };
};

const CAM: { cx: number; cy: number; k: number }[] = (() => {
  const CX: number[] = [];
  const CY: number[] = [];
  const K: number[] = [];
  for (let f = 0; f <= DURATION; f++) {
    const t = camTarget(f);
    CX.push(t.x);
    CY.push(t.y);
    K.push(t.k);
  }
  // The opening is already moving: the camera starts a little down-left of the 2023 landing (where the dot
  // has just come from) and the kit's damped follow (runCamera's loop, with x) settles it onto the landing
  // over the first ~30 frames.
  const out: { cx: number; cy: number; k: number }[] = [];
  const START = { x: CX[0] - 90, y: CY[0] + 75 };
  let cx = START.x;
  let cy = START.y;
  let k = K[0];
  let vx = 0;
  let vy = 0;
  let vk = 0;
  out.push({ cx, cy, k });
  for (let f = 1; f <= DURATION; f++) {
    vx += (CX[f] - cx) * CAM_STIFF - vx * CAM_DAMP;
    cx += vx;
    vy += (CY[f] - cy) * CAM_STIFF - vy * CAM_DAMP;
    cy += vy;
    vk += (K[f] - k) * CAM_STIFF - vk * CAM_DAMP;
    k += vk;
    out.push({ cx, cy, k });
  }
  return out;
})();

/** The dot's screen position (no sway) at a frame: what the speed check in the hand-off measures. */
export const dotOnScreen = (f: number) => {
  const c = CAM[Math.max(0, Math.min(DURATION, f))];
  const d = dotState(f);
  const { tx, ty } = worldTransform(c.cx, c.cy, c.k);
  return { x: tx + d.x * c.k, y: ty + d.y * c.k, r: d.r * c.k };
};

// ---------------------------------------------------------------------------
// Small drawing helpers.
// ---------------------------------------------------------------------------
type P = { x: number; y: number };
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const arcD = (cx: number, cy: number, r: number, a0: number, a1: number) => {
  const sweep = a1 - a0;
  if (Math.abs(sweep) < 1e-4) return "";
  if (Math.abs(sweep) >= Math.PI * 2 - 1e-4) {
    return `M${cx + r * Math.cos(a0)} ${cy + r * Math.sin(a0)} A${r} ${r} 0 1 1 ${cx + r * Math.cos(a0 + Math.PI)} ${
      cy + r * Math.sin(a0 + Math.PI)
    } A${r} ${r} 0 1 1 ${cx + r * Math.cos(a0)} ${cy + r * Math.sin(a0)}`;
  }
  const large = Math.abs(sweep) > Math.PI ? 1 : 0;
  const dir = sweep > 0 ? 1 : 0;
  return `M${cx + r * Math.cos(a0)} ${cy + r * Math.sin(a0)} A${r} ${r} 0 ${large} ${dir} ${cx + r * Math.cos(a1)} ${
    cy + r * Math.sin(a1)
  }`;
};
// A polyline drawn head-led up to fraction t of its length.
const partialPolyline = (pts: P[], t: number) => {
  const segs: number[] = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const l = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    segs.push(l);
    total += l;
  }
  let left = clamp01(t) * total;
  const out: P[] = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    if (left >= segs[i - 1]) {
      out.push(pts[i]);
      left -= segs[i - 1];
    } else {
      const u = left / segs[i - 1];
      out.push({
        x: lerp(pts[i - 1].x, pts[i].x, u),
        y: lerp(pts[i - 1].y, pts[i].y, u),
      });
      break;
    }
  }
  return out
    .map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(" ");
};
const tickPts = (cx: number, cy: number, s: number): P[] => [
  { x: cx - 0.5 * s, y: cy + 0.02 * s },
  { x: cx - 0.14 * s, y: cy + 0.36 * s },
  { x: cx + 0.52 * s, y: cy - 0.34 * s },
];

// The style's Thread: an accent line drawn from the dot's rim with a small white head, which holds (packets
// running out and back on a long hold) and then fades.
const Thread: React.FC<{
  frame: number;
  k: number;
  from: P;
  fromR?: number;
  to: P;
  progress: number;
  opacity?: number;
  packets?: boolean;
  phase?: number;
}> = ({
  frame,
  k,
  from,
  fromR = 0,
  to,
  progress,
  opacity = 1,
  packets = false,
  phase = 0,
}) => {
  const p = clamp01(progress);
  if (p <= 0 || opacity <= 0) return null;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy);
  if (len <= fromR) return null;
  const s = { x: from.x + (dx / len) * fromR, y: from.y + (dy / len) * fromR };
  const tip = { x: lerp(s.x, to.x, p), y: lerp(s.y, to.y, p) };
  const pk =
    packets && p >= 1
      ? threadPackets({ frame, k, from: s, to, period: 18, phase })
      : [];
  return (
    <g opacity={opacity}>
      <line
        x1={s.x}
        y1={s.y}
        x2={tip.x}
        y2={tip.y}
        stroke={ACCENT}
        strokeWidth={THREAD}
        strokeLinecap="round"
      />
      {pk.map((q, i) => (
        <circle key={i} cx={q.x} cy={q.y} r={PACKET_R} fill={ACCENT} />
      ))}
      {p < 1 ? <circle cx={tip.x} cy={tip.y} r={HEAD_R} fill={INK} /> : null}
    </g>
  );
};

// ---------------------------------------------------------------------------
// 2023: the column-addition card. 4,738 + 2,594; the AI writes 7,322 right to left, tens digit wrong.
// ---------------------------------------------------------------------------
const SUM = (() => {
  const L = Lx(0);
  const T = Ty(0);
  const box = { x0: L + 95, y0: T - 376, x1: L + 575, y1: T - SW * 1.2 };
  const fs = 88;
  const pitch = 50;
  const right = L + 517; // units column centre
  const col = (i: number) => right - pitch * i - (i >= 3 ? 24 : 0); // i: 0 units .. 3 thousands
  const commaX = right - pitch * 2 - 37;
  const rows = { a: T - 262, b: T - 162, ans: T - 42 };
  const rule = { x0: L + 190, x1: L + 548, y: T - 132 };
  // the answer, written units first
  const ans = ["2", "2", "3", "7"]; // units, tens (wrong: should be 3), hundreds, thousands
  const writeF = [46, 51, 56, 61];
  const ring = { x: col(1), y: rows.ans - fs * 0.36, r: 48 };
  return { L, T, box, fs, col, commaX, rows, rule, ans, writeF, ring };
})();

const SumCard: React.FC<{ frame: number; k: number }> = ({ frame, k }) => {
  const S = SUM;
  const ink = inkOf(0, frame);
  const drain = drainOf(0, frame);
  const orange = MODEL_TONE(1 - drain);
  const w = S.box.x1 - S.box.x0;
  const h = S.box.y1 - S.box.y0;
  const digits = (str: string, y: number, color: string) =>
    str.split("").map((c, i) => (
      <text
        key={`${y}-${i}`}
        x={S.col(str.length - 1 - i)}
        y={y}
        fill={color}
        fontFamily={FONT_LABEL}
        fontWeight={LABEL_WEIGHT}
        fontSize={S.fs}
        textAnchor="middle"
      >
        {c}
      </text>
    ));
  const comma = (y: number, color: string, op = 1, dy = 0) => (
    <text
      x={S.commaX}
      y={y + dy}
      fill={color}
      opacity={op}
      fontFamily={FONT_LABEL}
      fontWeight={LABEL_WEIGHT}
      fontSize={S.fs}
      textAnchor="middle"
    >
      ,
    </text>
  );
  // the ring on the wrong digit: drawn head-led from the top, landing with the style's back ease
  const rU = clamp01((frame - 64) / 9);
  const rLand = interpolate(frame, [64, 76], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.back(1.6)),
  });
  const rr = S.ring.r * (1.18 - 0.18 * rLand);
  return (
    <g>
      <g style={{ filter: iconShadow(k) }} opacity={ink}>
        <path
          d={squirclePath(w, h)}
          transform={`translate(${S.box.x0} ${S.box.y0})`}
          fill="none"
          stroke={INK}
          strokeWidth={SW}
        />
        {digits("4738", S.rows.a, INK)}
        {comma(S.rows.a, INK)}
        {digits("2594", S.rows.b, INK)}
        {comma(S.rows.b, INK)}
        <text
          x={S.col(3) - 86}
          y={S.rows.b}
          fill={INK}
          fontFamily={FONT_LABEL}
          fontWeight={LABEL_WEIGHT}
          fontSize={S.fs}
          textAnchor="middle"
        >
          +
        </text>
        <line
          x1={S.rule.x0}
          x2={S.rule.x1}
          y1={S.rule.y}
          y2={S.rule.y}
          stroke={INK}
          strokeWidth={SW}
          strokeLinecap="round"
        />
        {rU > 0 ? (
          <path
            d={arcD(
              S.ring.x,
              S.ring.y,
              rr,
              -Math.PI / 2,
              -Math.PI / 2 + Math.PI * 2 * rU,
            )}
            fill="none"
            stroke={INK}
            strokeWidth={SW}
            strokeLinecap="round"
          />
        ) : null}
      </g>
      {/* the AI's answer, in its own colour */}
      {S.ans.map((c, i) => {
        const u = smoothstep((frame - (S.writeF[i] - 1)) / 6);
        if (u <= 0) return null;
        const dy = worldPx(14, K_REST) * (1 - u);
        return (
          <g key={i}>
            <text
              x={S.col(i)}
              y={S.rows.ans + dy}
              fill={orange}
              opacity={u}
              fontFamily={FONT_LABEL}
              fontWeight={LABEL_WEIGHT}
              fontSize={S.fs}
              textAnchor="middle"
            >
              {c}
            </text>
            {i === 3 ? comma(S.rows.ans, orange, u, dy) : null}
          </g>
        );
      })}
    </g>
  );
};

const sumThread = (
  frame: number,
  k: number,
  dot: { x: number; y: number; r: number },
) => {
  const S = SUM;
  const tipX = interpolate(
    frame,
    S.writeF,
    [0, 1, 2, 3].map((i) => S.col(i) - 8),
    clamp,
  );
  const to = { x: tipX, y: S.rows.ans - S.fs * 0.3 };
  const progress = interpolate(frame, [36, 46], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.quad),
  });
  const opacity = interpolate(frame, [64, 72], [1, 0], clamp);
  return (
    <Thread
      frame={frame}
      k={k}
      from={dot}
      fromR={dot.r + 4}
      to={to}
      progress={progress}
      opacity={opacity}
    />
  );
};

// ---------------------------------------------------------------------------
// 2024: the competition sheet. 15 numbered problem rows; the thread runs down the margin and ticks two.
// ---------------------------------------------------------------------------
const SHEET = (() => {
  const L = Lx(1);
  const T = Ty(1);
  const box = { x0: L + 110, y0: T - 466, x1: L + 560, y1: T - SW * 1.2 };
  const rows = 15;
  const pitch = 24;
  const row0 = T - 368;
  const rowY = (i: number) => row0 + pitch * i;
  const tickX = L + 152;
  const numX = L + 208;
  const barX = L + 224;
  const barLen = (i: number) => 100 + 200 * hash(i, 4.1);
  const scan = { f0: 118, f1: 164 };
  const passF = (i: number) => scan.f0 + ((scan.f1 - scan.f0) * i) / (rows - 1);
  const solved = [1, 7];
  return {
    L,
    T,
    box,
    rows,
    pitch,
    rowY,
    tickX,
    numX,
    barX,
    barLen,
    scan,
    passF,
    solved,
  };
})();

const Sheet: React.FC<{ frame: number; k: number }> = ({ frame, k }) => {
  const S = SHEET;
  const ink = inkOf(1, frame);
  const drain = drainOf(1, frame);
  const orange = MODEL_TONE(1 - drain);
  const w = S.box.x1 - S.box.x0;
  const h = S.box.y1 - S.box.y0;
  const barH = worldPx(11, K_REST);
  return (
    <g>
      <g style={{ filter: iconShadow(k) }} opacity={ink}>
        <path
          d={squirclePath(w, h)}
          transform={`translate(${S.box.x0} ${S.box.y0})`}
          fill="none"
          stroke={INK}
          strokeWidth={SW}
        />
        {/* the paper's title block */}
        <path
          d={squirclePath(250, 18)}
          transform={`translate(${S.box.x0 + 46} ${S.box.y0 + 34})`}
          fill={INK}
        />
        <path
          d={squirclePath(160, 11)}
          transform={`translate(${S.box.x0 + 46} ${S.box.y0 + 64})`}
          fill={INK}
        />
        {Array.from({ length: S.rows }, (_, i) => (
          <g key={i}>
            <text
              x={S.numX}
              y={S.rowY(i) + 7}
              fill={INK}
              fontFamily={FONT_LABEL}
              fontWeight={LABEL_WEIGHT}
              fontSize={20}
              textAnchor="end"
            >
              {i + 1}
            </text>
            <path
              d={squirclePath(S.barLen(i), barH)}
              transform={`translate(${S.barX} ${S.rowY(i) - barH / 2})`}
              fill={INK}
            />
          </g>
        ))}
      </g>
      {S.solved.map((i) => {
        const u = interpolate(frame, [S.passF(i) + 1, S.passF(i) + 8], [0, 1], {
          ...clamp,
          easing: Easing.out(Easing.quad),
        });
        if (u <= 0) return null;
        return (
          <path
            key={i}
            d={partialPolyline(tickPts(S.tickX, S.rowY(i), 40), u)}
            fill="none"
            stroke={orange}
            strokeWidth={SW}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      })}
    </g>
  );
};

const sheetThread = (
  frame: number,
  k: number,
  dot: { x: number; y: number; r: number },
) => {
  const S = SHEET;
  const ty = interpolate(
    frame,
    [S.scan.f0, S.scan.f1],
    [S.rowY(0), S.rowY(S.rows - 1)],
    clamp,
  );
  const to = { x: S.tickX - 30, y: ty };
  const progress = interpolate(frame, [107, 118], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.quad),
  });
  const opacity = interpolate(frame, [166, 174], [1, 0], clamp);
  return (
    <Thread
      frame={frame}
      k={k}
      from={dot}
      fromR={dot.r + 4}
      to={to}
      progress={progress}
      opacity={opacity}
    />
  );
};

// ---------------------------------------------------------------------------
// 2025: the IMO medal on its ribbon. The thread reaches its rim and it converts white -> orange.
// ---------------------------------------------------------------------------
const MEDAL = (() => {
  const L = Lx(2);
  const T = Ty(2);
  const c = { x: L + 335, y: T - 180 };
  const R = 166;
  const Ri = 127;
  const top = T - 470;
  // two straps converging on the disc, each a quad cut where it meets the rim
  const strap = (side: -1 | 1) => {
    const outerTop = { x: c.x + side * 150, y: top };
    const innerTop = { x: c.x + side * 80, y: top };
    const outerBot = { x: c.x + side * 84, y: c.y - R + 20 };
    const innerBot = { x: c.x + side * 20, y: c.y - R + 4 };
    const cut = (a: P, b: P) => {
      // walk from a toward b until the point is SW*1.5 outside the rim
      let lo = 0;
      let hi = 1;
      for (let i = 0; i < 30; i++) {
        const m = (lo + hi) / 2;
        const p = { x: lerp(a.x, b.x, m), y: lerp(a.y, b.y, m) };
        if (Math.hypot(p.x - c.x, p.y - c.y) > R + SW * 1.6) lo = m;
        else hi = m;
      }
      return { x: lerp(a.x, b.x, lo), y: lerp(a.y, b.y, lo) };
    };
    return {
      outerTop,
      innerTop,
      outerEnd: cut(outerTop, outerBot),
      innerEnd: cut(innerTop, innerBot),
    };
  };
  const contactA = Math.PI * 0.86; // where the thread meets the rim (left, a little low)
  return {
    L,
    T,
    c,
    R,
    Ri,
    top,
    strap,
    contactA,
    convert: { f0: 228, f1: 240 },
  };
})();

const Medal: React.FC<{ frame: number; k: number }> = ({ frame, k }) => {
  const M = MEDAL;
  const ink = inkOf(2, frame);
  const drain = drainOf(2, frame);
  const wipe = interpolate(frame, [M.convert.f0, M.convert.f1], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.quad),
  });
  const face = interpolate(
    frame,
    [M.convert.f0 + 4, M.convert.f1 + 2],
    [0, 1],
    clamp,
  );
  const land = interpolate(
    frame,
    [M.convert.f0 + 4, M.convert.f1 + 6],
    [0, 1],
    {
      ...clamp,
      easing: Easing.out(Easing.back(1.6)),
    },
  );
  const orange = MODEL_TONE(1 - drain);
  const faceCol = face >= 1 ? orange : CONVERT_TONE(face);
  const ri = M.Ri * (face > 0 ? 0.92 + 0.08 * land : 1);
  const straps = ([-1, 1] as const).map((s) => M.strap(s));
  return (
    <g>
      <g style={{ filter: iconShadow(k) }} opacity={ink}>
        {straps.map((s, i) => (
          <path
            key={i}
            d={`M${s.outerEnd.x} ${s.outerEnd.y} L${s.outerTop.x} ${s.outerTop.y} L${s.innerTop.x} ${s.innerTop.y} L${s.innerEnd.x} ${s.innerEnd.y}`}
            fill="none"
            stroke={INK}
            strokeWidth={SW}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}
        {/* the white rim, under the orange wipe */}
        <circle
          cx={M.c.x}
          cy={M.c.y}
          r={M.R}
          fill="none"
          stroke={INK}
          strokeWidth={SW}
        />
        {face < 1 ? (
          <g opacity={1}>
            <circle
              cx={M.c.x}
              cy={M.c.y}
              r={ri}
              fill="none"
              stroke={INK}
              strokeWidth={SW}
            />
            <text
              x={M.c.x}
              y={M.c.y + 31}
              fill={INK}
              fontFamily={FONT_LABEL}
              fontWeight={LABEL_WEIGHT}
              fontSize={88}
              textAnchor="middle"
              letterSpacing="0.04em"
            >
              IMO
            </text>
          </g>
        ) : null}
      </g>
      {wipe > 0 ? (
        <g>
          <path
            d={arcD(
              M.c.x,
              M.c.y,
              M.R,
              M.contactA - Math.PI * wipe,
              M.contactA + Math.PI * wipe,
            )}
            fill="none"
            stroke={orange}
            strokeWidth={SW}
            strokeLinecap="round"
          />
        </g>
      ) : null}
      {face > 0 ? (
        <g opacity={face >= 1 ? 1 : face}>
          <circle
            cx={M.c.x}
            cy={M.c.y}
            r={ri}
            fill="none"
            stroke={faceCol}
            strokeWidth={SW}
          />
          <text
            x={M.c.x}
            y={M.c.y + 31}
            fill={faceCol}
            fontFamily={FONT_LABEL}
            fontWeight={LABEL_WEIGHT}
            fontSize={88}
            textAnchor="middle"
            letterSpacing="0.04em"
          >
            IMO
          </text>
        </g>
      ) : null}
    </g>
  );
};

const medalThread = (
  frame: number,
  k: number,
  dot: { x: number; y: number; r: number },
) => {
  const M = MEDAL;
  const to = {
    x: M.c.x + (M.R + SW * 0.2) * Math.cos(M.contactA),
    y: M.c.y + (M.R + SW * 0.2) * Math.sin(M.contactA),
  };
  const progress = interpolate(frame, [210, 224], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.quad),
  });
  const opacity = interpolate(frame, [258, 268], [1, 0], clamp);
  return (
    <Thread
      frame={frame}
      k={k}
      from={dot}
      fromR={dot.r + 4}
      to={to}
      progress={progress}
      opacity={opacity}
      packets
    />
  );
};

// ---------------------------------------------------------------------------
// 2026: six dashed "?" cards (open problems). Three close up to solid orange with a white tick.
// ---------------------------------------------------------------------------
const CARDS = (() => {
  const L = Lx(3);
  const T = Ty(3);
  const s = 144;
  const list = [
    { x: L + 170, y: T - 86 }, // 0 bottom-left  (A)
    { x: L + 332, y: T - 92 }, // 1 bottom-mid  (C)
    { x: L + 494, y: T - 84 }, // 2 bottom-right
    { x: L + 180, y: T - 256 }, // 3 top-left     (B)
    { x: L + 342, y: T - 262 }, // 4 top-mid
    { x: L + 502, y: T - 252 }, // 5 top-right
  ];
  const solve = [
    { card: 0, f: 327 },
    { card: 3, f: 343 },
    { card: 1, f: 357 },
  ];
  return { L, T, s, list, solve };
})();
const cardSolveF = (i: number) => {
  const s = CARDS.solve.find((q) => q.card === i);
  return s ? s.f : 1e9;
};

const Cards: React.FC<{ frame: number; k: number }> = ({ frame, k }) => {
  const C = CARDS;
  const ink = inkOf(3, frame);
  const half = C.s / 2;
  return (
    <g>
      {C.list.map((c, i) => {
        const f0 = cardSolveF(i);
        const close = interpolate(frame, [f0, f0 + 8], [0, 1], {
          ...clamp,
          easing: Easing.inOut(Easing.quad),
        });
        const swap = interpolate(frame, [f0 + 1, f0 + 11], [0, 1], clamp);
        const col = close >= 1 ? ACCENT : CONVERT_TONE(close);
        const strokeOp = lerp(ink, 1, close);
        const march = frame * MARCH * (1 - close);
        return (
          <g key={i}>
            <path
              d={squirclePath(C.s, C.s)}
              transform={`translate(${c.x - half} ${c.y - half})`}
              fill="none"
              stroke={col}
              opacity={strokeOp}
              strokeWidth={SW}
              strokeLinecap="butt"
              strokeDasharray={
                close >= 1 ? undefined : `${DASH_ON} ${DASH_OFF * (1 - close)}`
              }
              strokeDashoffset={-march}
              style={close > 0 ? undefined : { filter: iconShadow(k) }}
            />
            <g style={{ filter: iconShadow(k) }} opacity={ink}>
              {swap < 1 ? (
                <text
                  x={c.x}
                  y={c.y + 30}
                  fill={INK}
                  opacity={1 - swap}
                  fontFamily={FONT_LABEL}
                  fontWeight={LABEL_WEIGHT}
                  fontSize={84}
                  textAnchor="middle"
                >
                  ?
                </text>
              ) : null}
              {swap > 0 ? (
                <path
                  d={partialPolyline(tickPts(c.x, c.y, 62), 1)}
                  fill="none"
                  stroke={INK}
                  opacity={swap / Math.max(ink, 1e-4)}
                  strokeWidth={SW}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : null}
            </g>
          </g>
        );
      })}
    </g>
  );
};

// The chain: dot -> A, A -> B, B -> C. Each link starts at the rim of the card that was just solved.
const edgeToward = (c: P, half: number, toward: P): P => {
  const dx = toward.x - c.x;
  const dy = toward.y - c.y;
  const s = half / Math.max(Math.abs(dx), Math.abs(dy), 1e-6);
  return { x: c.x + dx * s, y: c.y + dy * s };
};
const cardThreads = (
  frame: number,
  k: number,
  dot: { x: number; y: number; r: number },
) => {
  const C = CARDS;
  const half = C.s / 2 + SW;
  const A = C.list[0];
  const B = C.list[3];
  const Cc = C.list[1];
  const links = [
    {
      from: dot,
      fromR: dot.r + 4,
      to: edgeToward(A, half, dot),
      f0: 316,
      f1: 327,
    },
    {
      from: edgeToward(A, half, B),
      fromR: 0,
      to: edgeToward(B, half, A),
      f0: 337,
      f1: 343,
    },
    {
      from: edgeToward(B, half, Cc),
      fromR: 0,
      to: edgeToward(Cc, half, B),
      f0: 351,
      f1: 357,
    },
  ];
  return links.map((l, i) => (
    <Thread
      key={i}
      frame={frame}
      k={k}
      from={l.from}
      fromR={l.fromR}
      to={l.to}
      progress={interpolate(frame, [l.f0, l.f1], [0, 1], {
        ...clamp,
        easing: Easing.inOut(Easing.quad),
      })}
      packets
      phase={i * 6}
    />
  ));
};

// ---------------------------------------------------------------------------
// The staircase itself.
// ---------------------------------------------------------------------------
const SOLID_FROM = -4;
const SOLID_PTS: P[] = (() => {
  const pts: P[] = [{ x: Lx(SOLID_FROM), y: Ty(SOLID_FROM) + RISE }];
  for (let n = SOLID_FROM; n <= 3; n++) {
    pts.push({ x: Lx(n), y: Ty(n) });
    pts.push({ x: Lx(n) + RUN, y: Ty(n) });
  }
  return pts;
})();
const DASH_PTS: P[] = (() => {
  const pts: P[] = [{ x: Lx(4), y: Ty(3) }];
  for (let n = 4; n <= 7; n++) {
    pts.push({ x: Lx(n), y: Ty(n) });
    pts.push({ x: Lx(n) + RUN, y: Ty(n) });
  }
  return pts;
})();
const DASH_LEN = (() => {
  let s = 0;
  for (let i = 1; i < DASH_PTS.length; i++)
    s += Math.hypot(
      DASH_PTS[i].x - DASH_PTS[i - 1].x,
      DASH_PTS[i].y - DASH_PTS[i - 1].y,
    );
  return s;
})();
const dashAt = (s: number): { p: P; seg: number } => {
  let left = s;
  for (let i = 1; i < DASH_PTS.length; i++) {
    const a = DASH_PTS[i - 1];
    const b = DASH_PTS[i];
    const l = Math.hypot(b.x - a.x, b.y - a.y);
    if (left <= l)
      return {
        p: { x: lerp(a.x, b.x, left / l), y: lerp(a.y, b.y, left / l) },
        seg: i,
      };
    left -= l;
  }
  return { p: DASH_PTS[DASH_PTS.length - 1], seg: DASH_PTS.length - 1 };
};
// Where the dashed part has faded to nothing (world px along it).
const DASH_FADE = RISE * 2.4 + RUN * 1.6;

const Stair: React.FC<{ frame: number; k: number }> = ({ frame, k }) => {
  const solidD = SOLID_PTS.map((p, i) => `${i ? "L" : "M"}${p.x} ${p.y}`).join(
    " ",
  );
  // the dashes, each its own segment so each can carry its own fade; they march up the stair
  const period = DASH_ON + DASH_OFF;
  const off = (frame * MARCH) % period;
  const dashes: { d: string; op: number }[] = [];
  for (
    let s0 = off - period;
    s0 < Math.min(DASH_LEN, DASH_FADE);
    s0 += period
  ) {
    const a = Math.max(0, s0);
    const b = Math.min(DASH_LEN, s0 + DASH_ON);
    if (b <= a) continue;
    const A = dashAt(a);
    const B = dashAt(b);
    const pts: P[] = [A.p];
    for (let j = A.seg; j < B.seg; j++) pts.push(DASH_PTS[j]);
    pts.push(B.p);
    const mid = (a + b) / 2;
    const op = INK_HI * Math.pow(clamp01(1 - mid / DASH_FADE), 1.3);
    dashes.push({
      d: pts
        .map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
        .join(" "),
      op,
    });
  }
  return (
    <g style={{ filter: iconShadow(k) }}>
      <path
        d={solidD}
        fill="none"
        stroke={INK}
        strokeWidth={SW}
        strokeLinejoin="miter"
        strokeLinecap="butt"
        opacity={INK_HI}
      />
      {dashes.map((q, i) => (
        <path
          key={i}
          d={q.d}
          fill="none"
          stroke={INK}
          strokeWidth={SW}
          strokeLinejoin="miter"
          opacity={q.op}
        />
      ))}
    </g>
  );
};

// ---------------------------------------------------------------------------
// The cut.
// ---------------------------------------------------------------------------
// The year is cut into the face of its step, under the tread at its right end (right next to the riser it
// climbs from), so the year below-left stays readable while its landing is in shot.
const LABEL_W = 104; // "2023" in Roboto Condensed 700 caps at 48 px, measured
const LABEL_POS = YEARS.map((_, n) => ({
  x: Lx(n) + RUN - 30 - LABEL_W / 2,
  top: Ty(n) + 22,
}));

const ClimbingTheYears: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const { cx, cy, k } = CAM[Math.max(0, Math.min(DURATION, frame))];
  const s = sway(frame);
  const { tx, ty } = worldTransform(cx, cy, k);
  const d = dotState(frame);
  const dot = { x: d.x, y: d.y, r: d.r };
  const dotR = d.r * breath(frame, 0.3);
  return (
    <AbsoluteFill style={{ backgroundColor: BG_BASE }}>
      <GridBackground
        src="grid-background.jpg"
        blur={13}
        dim={BG_DIM}
        frame={frame}
        cy={cy}
        cyRest={CAM[0].cy}
        cx={cx}
        cxRest={CAM[0].cx}
        k={k}
        parallax={0.15}
      />
      <AbsoluteFill
        style={{
          filter: `drop-shadow(0 ${SHADOW_Y}px ${SHADOW_BLUR}px rgba(0,0,0,${SHADOW_OPACITY}))`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 1080,
            height: 1920,
            transformOrigin: "0 0",
            transform: `translate(${tx + s.dx}px, ${ty + s.dy}px) scale(${k})`,
          }}
        >
          <svg
            width={1080}
            height={1920}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              overflow: "visible",
            }}
          >
            <Stair frame={frame} k={k} />
            <SumCard frame={frame} k={k} />
            <Sheet frame={frame} k={k} />
            <Medal frame={frame} k={k} />
            <Cards frame={frame} k={k} />
            {sumThread(frame, k, dot)}
            {sheetThread(frame, k, dot)}
            {medalThread(frame, k, dot)}
            {cardThreads(frame, k, dot)}
            <circle cx={d.x} cy={d.y} r={dotR} fill={MODEL_TONE(d.tone)} />
          </svg>
          {YEARS.map((y, n) => (
            <Label
              key={y}
              k={k}
              x={LABEL_POS[n].x}
              y={LABEL_POS[n].top}
              text={y}
              inT={1}
              size={LABEL_SIZE}
              opacity={inkOf(n, frame)}
            />
          ))}
        </div>
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

export default ClimbingTheYears;
