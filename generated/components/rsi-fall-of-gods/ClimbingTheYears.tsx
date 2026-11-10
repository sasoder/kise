// ---------------------------------------------------------------------------
// ClimbingTheYears (rsi-fall-of-gods, cut 1). Dwarkesh style (styles/dwarkesh.md).
// Opaque 1080x1920, 23.976 fps, 379 frames.
//
// CHECK LINE: "in three years the AI went from botching school arithmetic, past a maths competition and an
// olympiad gold, to solving real open problems — one year at a time."
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
// THE MOTION (rev 2, the user's note: a timeline instead of stairs, the OpenAI mark instead of a dot, not
// cramped): one thin white horizontal timeline at screen y ~1000 with a year tick every 880 world px, its year
// label under the line right of the tick. Horizontal, so every label and artefact keeps its screen height the
// whole way and never crosses the caption bands (1080-1250, 1360-1460). One year owns the frame: its artefact
// (~610-630 px wide) stands above the line, centred, the mark parked on the year's tick under its lower-left
// corner. The camera is one damped track gliding right: three eased moves year to year, each starting 8 f
// before the mark leaves so the new year reaches its seat as the mark arrives, on a constant creep right and a
// slow zoom creep (k 0.99 -> 1.02), never a hold. The last year slides out left, dimmed (white -> INK_LO, its
// orange kept in ACCENT_DEEP); the next one slides in at INK_AHEAD and lights as the mark lands.
// The AI is the OpenAI mark (kits/dwarkesh/brandGlyphs OPENAI), a bead on the line in the AI's orange, 105 -> 135
// px and ACCENT_DEEP -> ACCENT a step per year (over the second half of each glide), spinning as it glides and
// a hair at rest. Behind it the line is orange (its progress), a gradient deep -> bright that matches the mark's
// tone at each year. It works each artefact through the style's Thread: 2023 it writes 4,738 + 2,594 = 7,322
// right-to-left (tens digit wrong; true sum 7,332) and a white ring lands on the wrong digit; 2024 its thread
// runs down the margin of a 15-problem competition sheet and ticks only two; 2025 it reaches the IMO medal and
// the medal converts white -> orange; 2026 it chains through three of six dashed "?" cards, each closing to
// solid orange with a white tick. Past 2026 the line goes on dashed, marching right into the dark.
// BEATS (contact -> first reaction): the mark glides in from the left and parks on 2023 at f8 (sum card
// already up). Thread on 2023's answer row f46; tip on a column -> that digit slides in f46/51/56/61. Ring draws
// f68-77, lands (back ease) f80, read on the still card f80-86. Glides: off f88/186/268, arrive f104/202/294 ("2024",
// "2025", "this year"); the camera pans f83-101 and f181-199.
// Sheet thread arrives f118, tip passes row 2 f121 -> tick f122-129, row 8 f141 -> tick f142-149, fades
// f166-174. Medal thread on the rim f224 -> wipe f228-240, face f232-242 ("gold medal" 238/242), packets, fades
// f258-268. Cards: mark -> A f327, A -> B f343, B -> C f357 ("problems" 361). Resolved and alive (packets,
// marching dashes, idle spin, sway, grid drift, creep) f362-378.
// Orange = the AI, nothing else; white = people, maths, structure, labels; dashed = not solved / not yet.
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
import { OPENAI } from "../kits/dwarkesh/brandGlyphs";

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

type P = { x: number; y: number };
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// ---------------------------------------------------------------------------
// The timeline. Year n (0..3 = 2023..2026) has its tick at x tickX(n) on the line at Y_LINE. The line is solid
// up to a little past 2026 and dashed beyond it.
// ---------------------------------------------------------------------------
const Y_LINE = 996;
const SPACING = 880;
const X0 = 220;
const tickX = (n: number) => X0 + SPACING * n;
const YEARS = ["2023", "2024", "2025", "2026"];
const LINE_START = tickX(0) - 3000;
const SOLID_END = tickX(3) + 380;
const DASH_FADE = 1100; // world px past SOLID_END where the dashes have faded out
const TICK_H = 26; // half-height of a year tick
const MINOR_H = 12; // half-height of a quarter tick

// ---------------------------------------------------------------------------
// The mark: the OpenAI glyph, a bead on the line. It glides tick to tick, a step bigger and riper each year.
// ---------------------------------------------------------------------------
const MARK_S = [105, 115, 125, 135]; // px across
const MARK_T = [0, 0.34, 0.67, 1];
const GLIDES = [
  { f0: -16, f1: 8, to: 0 },
  { f0: 88, f1: 104, to: 1 },
  { f0: 186, f1: 202, to: 2 },
  { f0: 268, f1: 294, to: 3 },
];
const ENTRY_X = tickX(0) - 620;
// Half linear, half smoothstep: it pushes off (no dead start) and settles onto the tick.
const glideEase = (t: number) => 0.5 * t + 0.5 * smoothstep(t);

const markState = (f: number) => {
  let at = -1;
  for (const g of GLIDES) {
    if (f >= g.f1) at = g.to;
  }
  for (const g of GLIDES) {
    if (f > g.f0 && f < g.f1) {
      const t = (f - g.f0) / (g.f1 - g.f0);
      const n = g.to - 1;
      const from = n < 0 ? ENTRY_X : tickX(n);
      const x = lerp(from, tickX(g.to), glideEase(t));
      // it grows and ripens over the second half of the glide: it arrives as the next year's model
      const gr = smoothstep((t - 0.45) / 0.55);
      const m = Math.max(0, n);
      return {
        x,
        y: Y_LINE,
        s: lerp(MARK_S[m], MARK_S[g.to], gr),
        tone: lerp(MARK_T[m], MARK_T[g.to], gr),
      };
    }
  }
  const n = Math.max(0, at);
  return { x: tickX(n), y: Y_LINE, s: MARK_S[n], tone: MARK_T[n] };
};
// Spin: tied to the distance travelled (a quarter of a rolling wheel's, so the six-fold knot never strobes),
// plus a slow idle turn so the parked mark is alive.
const markSpin = (x: number, f: number) =>
  (((x - X0) * 0.004 + f * 0.004) * 180) / Math.PI;

// A year is INK_AHEAD until the mark lands on it, INK_HI while the mark is there, and drains to INK_LO once
// the mark has left. 2023 opens already up.
const landF = (n: number) => GLIDES[n].f1;
const leaveF = (n: number) => (n + 1 < GLIDES.length ? GLIDES[n + 1].f0 : 1e9);
const INK_AHEAD = 0.4;
const inkOf = (n: number, f: number) => {
  const up = interpolate(
    f,
    [landF(n) - 4, landF(n) + 6],
    [n === 0 ? 0.75 : INK_AHEAD, INK_HI],
    clamp,
  );
  const down = interpolate(
    f,
    [leaveF(n) + 2, leaveF(n) + 16],
    [0, INK_HI - INK_LO],
    clamp,
  );
  return up - down;
};
const drainOf = (n: number, f: number) =>
  interpolate(f, [leaveF(n) + 2, leaveF(n) + 16], [0, 1], clamp);

// ---------------------------------------------------------------------------
// The camera: a per-frame target (three eased moves year to year on a slow constant creep right and a slow
// zoom creep), followed by the kit's damped tracker in x, y and k. At rest the mark sits at screen x ~220 and
// the year's artefact is centred.
// ---------------------------------------------------------------------------
const MARK_SCREEN_X = 220;
// The user's note "move the graphic down slightly": the whole world (line, labels, mark, artefacts, threads,
// trail, dashes) sits DROP screen px lower than first delivered; the camera simply looks DROP higher. The grid's
// parallax is measured from the camera's own start, so the background does not move.
const DROP = 110;
const CAM_Y = 960 - DROP;
const anchorX = (n: number, k: number) => tickX(n) + (540 - MARK_SCREEN_X) / k;
// Each move LEADS the glide by ~5 f (the damped follow lags about that much), so the new year is near its seat
// as the mark lands; the 2023 card and the 2024 sheet hold still and whole through their punch (ring landed
// f80, read f80-86; sheet whole to f186) and the move is a short quick pan (peak ~65 px/f) on the year word.
const MOVES = [
  { f0: 83, f1: 101, warp: 1 },
  { f0: 181, f1: 199, warp: 1 },
  { f0: 260, f1: 296, warp: 0.85 },
];
const K_AT = (f: number) => 0.99 + 0.03 * clamp01(f / (DURATION - 1));
const CREEP = 0.22; // world px per frame, rightward

const camTarget = (f: number) => {
  const k = K_AT(f);
  let x = anchorX(0, k);
  MOVES.forEach((m, i) => {
    const g = camEase((f - m.f0) / (m.f1 - m.f0), m.warp);
    x += (anchorX(i + 1, k) - anchorX(i, k)) * g;
  });
  x += CREEP * (f - 190);
  return { x, y: CAM_Y, k };
};

const CAM: { cx: number; cy: number; k: number }[] = (() => {
  const T = Array.from({ length: DURATION + 1 }, (_, f) => camTarget(f));
  // The opening is already moving: the camera starts a little left (where the mark has come from) and the
  // kit's damped follow settles it over the first ~30 frames.
  const out: { cx: number; cy: number; k: number }[] = [];
  let cx = T[0].x - 120;
  let cy = T[0].y;
  let k = T[0].k;
  let vx = 0;
  let vy = 0;
  let vk = 0;
  out.push({ cx, cy, k });
  for (let f = 1; f <= DURATION; f++) {
    vx += (T[f].x - cx) * CAM_STIFF - vx * CAM_DAMP;
    cx += vx;
    vy += (T[f].y - cy) * CAM_STIFF - vy * CAM_DAMP;
    cy += vy;
    vk += (T[f].k - k) * CAM_STIFF - vk * CAM_DAMP;
    k += vk;
    out.push({ cx, cy, k });
  }
  return out;
})();

// The grid's parallax is measured from mid-travel, so its shift stays inside the image's overscan both ways.
const BG_CX_REST = (CAM[0].cx + CAM[DURATION].cx) / 2;

/** The camera at a frame (for the hand-off checks). */
export const camAt = (f: number) => CAM[Math.max(0, Math.min(DURATION, f))];

/** The mark's screen position and size (no sway) at a frame: what the speed check measures. */
export const markOnScreen = (f: number) => {
  const c = CAM[Math.max(0, Math.min(DURATION, f))];
  const m = markState(f);
  const { tx, ty } = worldTransform(c.cx, c.cy, c.k);
  return { x: tx + m.x * c.k, y: ty + m.y * c.k, s: m.s * c.k };
};

// ---------------------------------------------------------------------------
// The artefacts are drawn in their own local frame (origin at the bottom-left of the old landing; every one is
// centred on local x 335 with its bottom at local y ~-6) and placed above their tick, scaled to ~610-630 px
// wide. Strokes inside are SW / sc, so the screen stroke stays the one weight.
// ---------------------------------------------------------------------------
const ART_SC = [1.3, 1.36, 1.36, 1.32];
const ART_CX = 335;
const ART_BOT = 905;
const ART = ART_SC.map((sc, n) => ({
  sc,
  ox: tickX(n) + (540 - MARK_SCREEN_X) - sc * ART_CX,
  oy: ART_BOT,
}));
const toW = (n: number, p: P): P => ({
  x: ART[n].ox + ART[n].sc * p.x,
  y: ART[n].oy + ART[n].sc * p.y,
});
const Placed: React.FC<{ n: number; children: React.ReactNode }> = ({
  n,
  children,
}) => (
  <g transform={`translate(${ART[n].ox} ${ART[n].oy}) scale(${ART[n].sc})`}>
    {children}
  </g>
);

// ---------------------------------------------------------------------------
// Small drawing helpers.
// ---------------------------------------------------------------------------
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

// The style's Thread: an accent line drawn from the mark's rim with a small white head, which holds (packets
// running out and back on a long hold) and then fades. World coordinates.
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
  weight?: number;
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
  weight = THREAD,
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
        strokeWidth={weight}
        strokeLinecap="round"
      />
      {pk.map((q, i) => (
        <circle
          key={i}
          cx={q.x}
          cy={q.y}
          r={PACKET_R * (weight / THREAD)}
          fill={ACCENT}
        />
      ))}
      {p < 1 ? <circle cx={tip.x} cy={tip.y} r={HEAD_R} fill={INK} /> : null}
    </g>
  );
};

type MarkPos = { x: number; y: number; r: number };

// ---------------------------------------------------------------------------
// 2023: the column-addition card. 4,738 + 2,594; the AI writes 7,322 right to left, tens digit wrong.
// ---------------------------------------------------------------------------
const SUM = (() => {
  const box = { x0: 95, y0: -376, x1: 575, y1: -8 };
  const fs = 88;
  const pitch = 50;
  const right = 517; // units column centre
  const col = (i: number) => right - pitch * i - (i >= 3 ? 24 : 0); // i: 0 units .. 3 thousands
  const commaX = right - pitch * 2 - 37;
  const rows = { a: -262, b: -162, ans: -42 };
  const rule = { x0: 190, x1: 548, y: -132 };
  // the answer, written units first
  const ans = ["2", "2", "3", "7"]; // units, tens (wrong: should be 3), hundreds, thousands
  const writeF = [46, 51, 56, 61];
  const ring = { x: col(1), y: rows.ans - fs * 0.36, r: 48 };
  return { box, fs, col, commaX, rows, rule, ans, writeF, ring };
})();

const SumCard: React.FC<{ frame: number; k: number }> = ({ frame, k }) => {
  const S = SUM;
  const sc = ART[0].sc;
  const sw = SW / sc;
  const ink = inkOf(0, frame);
  const orange = MODEL_TONE(1 - drainOf(0, frame));
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
  const rU = clamp01((frame - 68) / 9);
  const rLand = interpolate(frame, [68, 80], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.back(1.6)),
  });
  const rr = S.ring.r * (1.18 - 0.18 * rLand);
  return (
    <Placed n={0}>
      <g style={{ filter: iconShadow(k * sc) }} opacity={ink}>
        <path
          d={squirclePath(w, h)}
          transform={`translate(${S.box.x0} ${S.box.y0})`}
          fill="none"
          stroke={INK}
          strokeWidth={sw}
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
          strokeWidth={sw}
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
            strokeWidth={sw}
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
    </Placed>
  );
};

const sumThread = (frame: number, k: number, mark: MarkPos) => {
  const S = SUM;
  const tipX = interpolate(
    frame,
    S.writeF,
    [0, 1, 2, 3].map((i) => S.col(i) - 8),
    clamp,
  );
  const to = toW(0, { x: tipX, y: S.rows.ans - S.fs * 0.3 });
  const progress = interpolate(frame, [36, 46], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.quad),
  });
  const opacity = interpolate(frame, [64, 72], [1, 0], clamp);
  return (
    <Thread
      frame={frame}
      k={k}
      from={mark}
      fromR={mark.r + 6}
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
  const box = { x0: 110, y0: -466, x1: 560, y1: -8 };
  const rows = 15;
  const pitch = 24;
  const row0 = -368;
  const rowY = (i: number) => row0 + pitch * i;
  const tickX = 152;
  const numX = 208;
  const barX = 224;
  const barLen = (i: number) => 100 + 200 * hash(i, 4.1);
  const scan = { f0: 118, f1: 164 };
  const passF = (i: number) => scan.f0 + ((scan.f1 - scan.f0) * i) / (rows - 1);
  const solved = [1, 7];
  return {
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
  const sc = ART[1].sc;
  const sw = SW / sc;
  const ink = inkOf(1, frame);
  const orange = MODEL_TONE(1 - drainOf(1, frame));
  const w = S.box.x1 - S.box.x0;
  const h = S.box.y1 - S.box.y0;
  const barH = 11.5;
  return (
    <Placed n={1}>
      <g style={{ filter: iconShadow(k * sc) }} opacity={ink}>
        <path
          d={squirclePath(w, h)}
          transform={`translate(${S.box.x0} ${S.box.y0})`}
          fill="none"
          stroke={INK}
          strokeWidth={sw}
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
            d={partialPolyline(tickPts(S.tickX, S.rowY(i), 34), u)}
            fill="none"
            stroke={orange}
            strokeWidth={sw}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      })}
    </Placed>
  );
};

const sheetThread = (frame: number, k: number, mark: MarkPos) => {
  const S = SHEET;
  const ty = interpolate(
    frame,
    [S.scan.f0, S.scan.f1],
    [S.rowY(0), S.rowY(S.rows - 1)],
    clamp,
  );
  const to = toW(1, { x: S.tickX - 30, y: ty });
  const progress = interpolate(frame, [107, 118], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.quad),
  });
  const opacity = interpolate(frame, [166, 174], [1, 0], clamp);
  return (
    <Thread
      frame={frame}
      k={k}
      from={mark}
      fromR={mark.r + 6}
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
  const sw = SW / ART_SC[2];
  const c = { x: 335, y: -180 };
  const R = 166;
  const Ri = 127;
  const top = -470;
  // two straps converging on the disc, each a quad cut where it meets the rim
  const strap = (side: -1 | 1) => {
    const outerTop = { x: c.x + side * 150, y: top };
    const innerTop = { x: c.x + side * 80, y: top };
    const outerBot = { x: c.x + side * 84, y: c.y - R + 20 };
    const innerBot = { x: c.x + side * 20, y: c.y - R + 4 };
    const cut = (a: P, b: P) => {
      // walk from a toward b until the point is sw*1.6 outside the rim
      let lo = 0;
      let hi = 1;
      for (let i = 0; i < 30; i++) {
        const m = (lo + hi) / 2;
        const p = { x: lerp(a.x, b.x, m), y: lerp(a.y, b.y, m) };
        if (Math.hypot(p.x - c.x, p.y - c.y) > R + sw * 1.6) lo = m;
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
  return { c, R, Ri, strap, contactA, convert: { f0: 228, f1: 240 } };
})();

const Medal: React.FC<{ frame: number; k: number }> = ({ frame, k }) => {
  const M = MEDAL;
  const sc = ART[2].sc;
  const sw = SW / sc;
  const ink = inkOf(2, frame);
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
    { ...clamp, easing: Easing.out(Easing.back(1.6)) },
  );
  const orange = MODEL_TONE(1 - drainOf(2, frame));
  const faceCol = face >= 1 ? orange : CONVERT_TONE(face);
  const ri = M.Ri * (face > 0 ? 0.92 + 0.08 * land : 1);
  const straps = ([-1, 1] as const).map((s) => M.strap(s));
  const imo = (col: string) => (
    <text
      x={M.c.x}
      y={M.c.y + 31}
      fill={col}
      fontFamily={FONT_LABEL}
      fontWeight={LABEL_WEIGHT}
      fontSize={88}
      textAnchor="middle"
      letterSpacing="0.04em"
    >
      IMO
    </text>
  );
  return (
    <Placed n={2}>
      <g style={{ filter: iconShadow(k * sc) }} opacity={ink}>
        {straps.map((s, i) => (
          <path
            key={i}
            d={`M${s.outerEnd.x} ${s.outerEnd.y} L${s.outerTop.x} ${s.outerTop.y} L${s.innerTop.x} ${s.innerTop.y} L${s.innerEnd.x} ${s.innerEnd.y}`}
            fill="none"
            stroke={INK}
            strokeWidth={sw}
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
          strokeWidth={sw}
        />
        {face < 1 ? (
          <g>
            <circle
              cx={M.c.x}
              cy={M.c.y}
              r={ri}
              fill="none"
              stroke={INK}
              strokeWidth={sw}
            />
            {imo(INK)}
          </g>
        ) : null}
      </g>
      {wipe > 0 ? (
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
          strokeWidth={sw}
          strokeLinecap="round"
        />
      ) : null}
      {face > 0 ? (
        <g opacity={face >= 1 ? 1 : face}>
          <circle
            cx={M.c.x}
            cy={M.c.y}
            r={ri}
            fill="none"
            stroke={faceCol}
            strokeWidth={sw}
          />
          {imo(faceCol)}
        </g>
      ) : null}
    </Placed>
  );
};

const medalThread = (frame: number, k: number, mark: MarkPos) => {
  const M = MEDAL;
  const sw = SW / ART_SC[2];
  const to = toW(2, {
    x: M.c.x + (M.R + sw * 0.2) * Math.cos(M.contactA),
    y: M.c.y + (M.R + sw * 0.2) * Math.sin(M.contactA),
  });
  const progress = interpolate(frame, [210, 224], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.quad),
  });
  const opacity = interpolate(frame, [258, 268], [1, 0], clamp);
  return (
    <Thread
      frame={frame}
      k={k}
      from={mark}
      fromR={mark.r + 6}
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
  const s = 144;
  const list = [
    { x: 170, y: -86 }, // 0 bottom-left  (A)
    { x: 332, y: -92 }, // 1 bottom-mid  (C)
    { x: 494, y: -84 }, // 2 bottom-right
    { x: 180, y: -256 }, // 3 top-left     (B)
    { x: 342, y: -262 }, // 4 top-mid
    { x: 502, y: -252 }, // 5 top-right
  ];
  const solve = [
    { card: 0, f: 327 },
    { card: 3, f: 343 },
    { card: 1, f: 357 },
  ];
  return { s, list, solve };
})();
const cardSolveF = (i: number) => {
  const s = CARDS.solve.find((q) => q.card === i);
  return s ? s.f : 1e9;
};

const Cards: React.FC<{ frame: number; k: number }> = ({ frame, k }) => {
  const C = CARDS;
  const sc = ART[3].sc;
  const sw = SW / sc;
  const ink = inkOf(3, frame);
  const half = C.s / 2;
  return (
    <Placed n={3}>
      {C.list.map((c, i) => {
        const f0 = cardSolveF(i);
        const close = interpolate(frame, [f0, f0 + 8], [0, 1], {
          ...clamp,
          easing: Easing.inOut(Easing.quad),
        });
        const swap = interpolate(frame, [f0 + 1, f0 + 11], [0, 1], clamp);
        const col = close >= 1 ? ACCENT : CONVERT_TONE(close);
        const strokeOp = lerp(ink, 1, close);
        const march = (frame * MARCH * (1 - close)) / sc;
        return (
          <g key={i}>
            <path
              d={squirclePath(C.s, C.s)}
              transform={`translate(${c.x - half} ${c.y - half})`}
              fill="none"
              stroke={col}
              opacity={strokeOp}
              strokeWidth={sw}
              strokeLinecap="butt"
              strokeDasharray={
                close >= 1
                  ? undefined
                  : `${DASH_ON / sc} ${(DASH_OFF / sc) * (1 - close)}`
              }
              strokeDashoffset={-march}
              style={close > 0 ? undefined : { filter: iconShadow(k * sc) }}
            />
            <g style={{ filter: iconShadow(k * sc) }} opacity={ink}>
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
                  strokeWidth={sw}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : null}
            </g>
          </g>
        );
      })}
    </Placed>
  );
};

// The chain: mark -> A, A -> B, B -> C. Each link starts at the rim of the card that was just solved.
const edgeToward = (c: P, half: number, toward: P): P => {
  const dx = toward.x - c.x;
  const dy = toward.y - c.y;
  const s = half / Math.max(Math.abs(dx), Math.abs(dy), 1e-6);
  return { x: c.x + dx * s, y: c.y + dy * s };
};
const cardThreads = (frame: number, k: number, mark: MarkPos) => {
  const C = CARDS;
  const half = C.s / 2 + SW / ART_SC[3];
  const A = C.list[0];
  const B = C.list[3];
  const Cc = C.list[1];
  // the mark in the cards' local frame, to aim the first link's end at it
  const markL = {
    x: (mark.x - ART[3].ox) / ART[3].sc,
    y: (mark.y - ART[3].oy) / ART[3].sc,
  };
  const links = [
    {
      from: mark as P,
      fromR: mark.r + 6,
      to: toW(3, edgeToward(A, half, markL)),
      f0: 316,
      f1: 327,
    },
    {
      from: toW(3, edgeToward(A, half, B)),
      fromR: 0,
      to: toW(3, edgeToward(B, half, A)),
      f0: 337,
      f1: 343,
    },
    {
      from: toW(3, edgeToward(B, half, Cc)),
      fromR: 0,
      to: toW(3, edgeToward(Cc, half, B)),
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
      weight={SW}
    />
  ));
};

// ---------------------------------------------------------------------------
// The timeline itself: orange behind the mark (its progress), white ahead of it, broken around the mark so it
// reads as a bead on the line; a tick per year and a short tick per quarter; dashed past 2026, marching on.
// ---------------------------------------------------------------------------
const TRAIL_ID = "climbing-years-trail";
const Timeline: React.FC<{ frame: number; k: number; mark: MarkPos }> = ({
  frame,
  k,
  mark,
}) => {
  const gap = mark.r + 12;
  const leftEnd = mark.x - gap;
  const rightStart = mark.x + gap;
  // a tick near the mark fades out so it never shows through the knot
  const nearMark = (x: number) =>
    clamp01((Math.abs(x - mark.x) - gap * 0.9) / 24);
  const minors: number[] = [];
  for (let q = -16; q <= 15; q++) {
    if (q % 4 === 0) continue;
    const x = X0 + (SPACING * q) / 4;
    if (x < SOLID_END - 40) minors.push(x);
  }
  // the dashes past the solid line, each its own segment so each carries its own fade; they march right
  const period = DASH_ON + DASH_OFF;
  const off = (frame * MARCH * 1.6) % period;
  const dashes: { a: number; b: number; op: number }[] = [];
  for (let s0 = off - period; s0 < DASH_FADE; s0 += period) {
    const a = Math.max(0, s0);
    const b = Math.min(DASH_FADE, s0 + DASH_ON);
    if (b <= a) continue;
    const op = INK_HI * Math.pow(clamp01(1 - (a + b) / 2 / DASH_FADE), 1.3);
    dashes.push({
      a: SOLID_END + DASH_OFF + a,
      b: SOLID_END + DASH_OFF + b,
      op,
    });
  }
  return (
    <g>
      <defs>
        <linearGradient
          id={TRAIL_ID}
          gradientUnits="userSpaceOnUse"
          x1={tickX(0)}
          y1={0}
          x2={tickX(3)}
          y2={0}
        >
          <stop offset={0} stopColor={ACCENT_DEEP} />
          <stop offset={1} stopColor={ACCENT} />
        </linearGradient>
      </defs>
      <g style={{ filter: iconShadow(k) }}>
        {rightStart < SOLID_END ? (
          <line
            x1={rightStart}
            x2={SOLID_END}
            y1={Y_LINE}
            y2={Y_LINE}
            stroke={INK}
            strokeWidth={SW}
            opacity={INK_HI}
          />
        ) : null}
        {dashes.map((q, i) => (
          <line
            key={i}
            x1={q.a}
            x2={q.b}
            y1={Y_LINE}
            y2={Y_LINE}
            stroke={INK}
            strokeWidth={SW}
            opacity={q.op}
          />
        ))}
        {minors.map((x) => (
          <line
            key={x}
            x1={x}
            x2={x}
            y1={Y_LINE - MINOR_H}
            y2={Y_LINE + MINOR_H}
            stroke={INK}
            strokeWidth={SW}
            opacity={INK_LO * nearMark(x)}
          />
        ))}
        {YEARS.map((_, n) => (
          <line
            key={n}
            x1={tickX(n)}
            x2={tickX(n)}
            y1={Y_LINE - TICK_H}
            y2={Y_LINE + TICK_H}
            stroke={INK}
            strokeWidth={SW}
            opacity={INK_HI * nearMark(tickX(n))}
          />
        ))}
      </g>
      {/* the progress: the AI's colour on the line it has travelled */}
      <line
        x1={LINE_START}
        x2={leftEnd}
        y1={Y_LINE}
        y2={Y_LINE}
        stroke={`url(#${TRAIL_ID})`}
        strokeWidth={SW}
      />
    </g>
  );
};

const Mark: React.FC<{ frame: number; x: number; s: number; tone: number }> = ({
  frame,
  x,
  s,
  tone,
}) => {
  const size = s * breath(frame, 0.3);
  const rot = markSpin(x, frame);
  return (
    <g
      transform={`translate(${x} ${Y_LINE}) rotate(${rot.toFixed(3)}) scale(${size / 24}) translate(-12 -12)`}
    >
      {OPENAI.paths.map((d, i) => (
        <path key={i} d={d} fill={MODEL_TONE(tone)} fillRule="evenodd" />
      ))}
    </g>
  );
};

// ---------------------------------------------------------------------------
// The cut.
// ---------------------------------------------------------------------------
// The year label sits under the line, just right of its tick (the parked mark covers the tick itself).
const LABEL_GAP = 16; // label's left edge, past the parked mark's rim
const LABEL_DY = 18;

const ClimbingTheYears: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const { cx, cy, k } = CAM[Math.max(0, Math.min(DURATION, frame))];
  const sw = sway(frame);
  const { tx, ty } = worldTransform(cx, cy, k);
  const m = markState(frame);
  const mark: MarkPos = { x: m.x, y: m.y, r: m.s / 2 };
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
        cxRest={BG_CX_REST}
        k={k}
        parallax={0.1}
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
            transform: `translate(${tx + sw.dx}px, ${ty + sw.dy}px) scale(${k})`,
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
            <Timeline frame={frame} k={k} mark={mark} />
            <SumCard frame={frame} k={k} />
            <Sheet frame={frame} k={k} />
            <Medal frame={frame} k={k} />
            <Cards frame={frame} k={k} />
            {sumThread(frame, k, mark)}
            {sheetThread(frame, k, mark)}
            {medalThread(frame, k, mark)}
            {cardThreads(frame, k, mark)}
            <Mark frame={frame} x={m.x} s={m.s} tone={m.tone} />
          </svg>
          {YEARS.map((y, n) => (
            <Label
              key={y}
              k={k}
              x={tickX(n) + MARK_S[n] / 2 + LABEL_GAP}
              y={Y_LINE + LABEL_DY}
              text={y}
              inT={1}
              size={LABEL_SIZE}
              align="left"
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
