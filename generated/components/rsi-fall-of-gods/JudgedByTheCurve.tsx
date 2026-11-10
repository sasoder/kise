// ---------------------------------------------------------------------------
// JudgedByTheCurve (rsi-fall-of-gods, cut 74). Dwarkesh style (styles/dwarkesh.md).
// Opaque 1080x1920, 23.976 fps, 191 frames.
//
// CHECK LINE: "Labs judge a new recipe only by what it does to the training curve — cheaper to reach the same
// loss, or a smarter model at the end — not by theory."
//
// THE LINE: "AI labs mainly care about how any new algorithmic recipe empirically makes training more efficient or
// elicits smarter models."
// WORD -> FRAME (Whisper 2-7 f early): AI 0 · labs 4 · mainly 13 · care 24 · about 33 · how 39 · any 44 · new 53 ·
// algorithmic 60 · recipe 78 · empirically ~85-98 · makes 112 · training 122 · more 129 · efficient 139 · or 148 ·
// elicits 159 · smarter 169 · models 177 (then "They don't care about theory for its own sake").
// DURATION: the slot 74.157 -> 82.124 s = 7.966 s x 23.976 = 191 frames (f0..f190).
//
// THE MOTION: three lab marks in white sit above a loss-vs-compute plot (two white axes, LOSS and COMPUTE, no
// numbers); the baseline run draws itself in dim white f2-44 while a small deep-orange model dot waits at the
// curves' common start. On "new algorithmic recipe" a white card of indented code bars slides in from the right
// and drops into the plot's empty top-right corner (f52-76); an orange thread runs from the card to the waiting
// dot (f77-87, CONTACT f87) and the dot starts its run on the next frame (FIRST REACTION f88), drawing the orange
// curve head-led: it falls faster and lower than the baseline. The frame its head passes the baseline's final loss
// (f~109) a white bracket draws along that loss level from the orange crossing to the baseline's end — the compute
// saved — landing f134, before "efficient" f139. The head reaches the end of the budget at f146, lower than the
// baseline ever got; on "elicits smarter models" the dot steps up to 2.5x its size (~58 screen px across at rest)
// and in tone ACCENT_DEEP -> ACCENT -> HIGHLIGHT, landing on a back ease f150-172, then breathes. The orange run is
// at the full stroke (6.5 screen px at K_REST, measured ~6.5 at f190); the dim white baseline is 0.7 of it. One slow push toward the plot runs from f30 to past the end (k 1.00 -> 1.12, anchored near the x
// axis so the plot's bottom never reaches the caption band); sway, the grid drift and the dot's breath keep the
// resolved picture alive to f190.
// Orange = the AI (the model and its run), nothing else; white = people and what they build (the labs, the code,
// the axes, the old run, the bracket).
//
// SOURCES: no figures. The curves are an illustrative shape (power-law loss falling with compute, the new recipe
// steeper), not data, so nothing on screen carries a number. Marks: brandGlyphs OPENAI, ANTHROPIC, DEEPMIND
// (sources in public/logos/, see brandGlyphs.tsx).
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, Easing, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  BG_BASE,
  BG_DIM,
  DOT_RADIUS,
  GridBackground,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  breath,
  camEase,
  clamp01,
  hash,
  iconShadow,
  makeTone,
  runCamera,
  smoothstep,
  squirclePath,
  sway,
  worldTransform,
} from "../kits/dwarkesh/fieldShared";
import { INK, INK_LO, Label, worldPx } from "../kits/dwarkesh/alignShared";
import { ANTHROPIC, DEEPMIND, OPENAI, type BrandGlyph } from "../kits/dwarkesh/brandGlyphs";
import { HIGHLIGHT } from "../kits/dwarkesh/levelUp";

export const FPS = 24000 / 1001;
export const DURATION = 191;
export const schema = z.object({});
export const defaultProps = schema.parse({});

type P = { x: number; y: number };

// ---------------------------------------------------------------------------
// THE CAMERA. One slow push, f30 -> f200 on a smoothstep (so it is still easing in on f190), zoom and height off
// the same eased curve, through the kit's damper. The push is anchored near the x axis: the axis goes from screen
// y ~1020 to ~1009 while everything above it grows upward, so the plot's bottom (and the COMPUTE label under it)
// stays clear of the caption band at y 1080 on every frame.
// ---------------------------------------------------------------------------
const K0 = 1.0;
const K1 = 1.12;
const K_REST = 1.06; // strokes and labels are sized here, between the open and the rest
const CY0 = 1040;
const CY1 = 1056;
const PUSH_F0 = 30;
const PUSH_F1 = 200;
const CAM_F: number[] = [];
const CAM_CY: number[] = [];
const CAM_K: number[] = [];
for (let f = 0; f <= DURATION; f++) {
  const g = camEase((f - PUSH_F0) / (PUSH_F1 - PUSH_F0), 1);
  CAM_F.push(f);
  CAM_K.push(K0 + (K1 - K0) * g);
  CAM_CY.push(CY0 + (CY1 - CY0) * g);
}
export const camAt = (frame: number) => runCamera(frame, CAM_F, CAM_CY, CAM_K);

const STROKE = worldPx(6.5, K_REST);
const THREAD = STROKE / 2;

// ---------------------------------------------------------------------------
// THE PLOT, in world px. u = compute 0..1 along x, v = loss 0..1 up y.
// ---------------------------------------------------------------------------
const PX0 = 140;
const PX1 = 940;
const PY_AX = 1100; // the x axis
const PY_TOP = 620; // v = 1
const AX_OVER = 40; // the axes run past the plot's box to their arrowheads
const toX = (u: number) => PX0 + (PX1 - PX0) * u;
const toY = (v: number) => PY_AX - (PY_AX - PY_TOP) * v;

// The baseline run and the new recipe's run: illustrative power-law shapes from one common start.
const V_START = 0.85;
const vBase = (u: number) => 0.1 + 0.75 / (1 + u / 0.35);
const vNew = (u: number) => 0.03 + (V_START - 0.03) * Math.pow(1 + u / 0.15, -1.1);
// A little run-to-run noise so the lines read as measured runs rather than formulas; it dies at u = 0 so both
// runs leave the same point, and it is a sum of slow sines, so it never jitters.
const noise = (u: number, seed: number) =>
  smoothstep(u / 0.05) *
  (1.1 * Math.sin(u * 47 + hash(seed, 1) * 6.28) + 0.6 * Math.sin(u * 113 + hash(seed, 2) * 6.28));

const N_SAMP = 220;
const sampleRun = (v: (u: number) => number, seed: number): P[] => {
  const out: P[] = [];
  for (let i = 0; i <= N_SAMP; i++) {
    const u = i / N_SAMP;
    out.push({ x: toX(u), y: toY(v(u)) + noise(u, seed) });
  }
  return out;
};
const BASE_RUN = sampleRun(vBase, 3);
const NEW_RUN = sampleRun(vNew, 7);

// The polyline up to a fractional head u, ending exactly on the head.
const headAt = (run: P[], u: number): P => {
  const t = clamp01(u) * N_SAMP;
  const i = Math.min(N_SAMP - 1, Math.floor(t));
  const a = run[i];
  const b = run[i + 1];
  const r = t - i;
  return { x: a.x + (b.x - a.x) * r, y: a.y + (b.y - a.y) * r };
};
const partial = (run: P[], u: number) => {
  if (u <= 0) return "";
  const t = clamp01(u) * N_SAMP;
  const n = Math.floor(t);
  let d = `M${run[0].x.toFixed(2)} ${run[0].y.toFixed(2)}`;
  for (let i = 1; i <= n; i++) d += ` L${run[i].x.toFixed(2)} ${run[i].y.toFixed(2)}`;
  const h = headAt(run, u);
  d += ` L${h.x.toFixed(2)} ${h.y.toFixed(2)}`;
  return d;
};

// The baseline's final loss, and where the new run first reaches it (on the drawn polyline).
const BASE_END = BASE_RUN[N_SAMP];
const LEVEL_Y = BASE_END.y;
const U_CROSS = (() => {
  for (let i = 1; i <= N_SAMP; i++) {
    if (NEW_RUN[i].y >= LEVEL_Y) {
      const a = NEW_RUN[i - 1];
      const b = NEW_RUN[i];
      return (i - 1 + (LEVEL_Y - a.y) / (b.y - a.y)) / N_SAMP;
    }
  }
  throw new Error("JudgedByTheCurve: the new run never reaches the baseline's final loss");
})();
const CROSS = headAt(NEW_RUN, U_CROSS);

// ---------------------------------------------------------------------------
// TIMING. Every later beat is read off the visible thing that causes it.
// ---------------------------------------------------------------------------
const BASE_F0 = 2;
const BASE_F1 = 44;
const CARD_F0 = 52;
const CARD_F1 = 76;
const THREAD_F0 = 77;
const THREAD_F1 = 87; // CONTACT: the thread's head reaches the dot
const RUN_F0 = THREAD_F1 + 1; // FIRST REACTION: the dot sets off
const RUN_F1 = 146;
const THREAD_FADE = 14;
const BRACKET_T = 24;
const STEP_F0 = 150;
const STEP_F1 = 172;

const runU = (f: number) => {
  const t = clamp01((f - RUN_F0) / (RUN_F1 - RUN_F0));
  return (1 - Math.cos(Math.PI * t)) / 2;
};
// The frame the head passes the baseline's final loss, found off the head itself.
const CROSS_F = (() => {
  for (let f = RUN_F0; f <= RUN_F1; f++) if (runU(f) >= U_CROSS) return f;
  throw new Error("JudgedByTheCurve: the head never crosses");
})();
const BRACKET_F0 = CROSS_F + 1;

// ---------------------------------------------------------------------------
// THE RECIPE: a card of code, indented word-bars (people's code, so white at the context rung).
// ---------------------------------------------------------------------------
const CODE: { ind: number; w: number[] }[] = [
  { ind: 0, w: [62, 96] },
  { ind: 1, w: [46, 30, 74] },
  { ind: 1, w: [88, 42] },
  { ind: 2, w: [54, 64] },
  { ind: 2, w: [38, 76, 28] },
  { ind: 1, w: [62] },
  { ind: 0, w: [44, 56] },
];
const C_PAD = 20;
const C_IND = 24;
const C_GAP = 10;
const C_PITCH = 25;
const C_BAR = 10;
const CARD_W = (() => {
  let m = 0;
  for (const l of CODE) m = Math.max(m, l.ind * C_IND + l.w.reduce((s, w) => s + w, 0) + C_GAP * (l.w.length - 1));
  return Math.ceil(m + 2 * C_PAD);
})();
const CARD_H = 2 * C_PAD + (CODE.length - 1) * C_PITCH + C_BAR;
const CARD_PATH = squirclePath(CARD_W, CARD_H);
const CODE_BARS = (() => {
  const out: { x: number; y: number; w: number }[] = [];
  CODE.forEach((l, i) => {
    let x = C_PAD + l.ind * C_IND;
    for (const w of l.w) {
      out.push({ x, y: C_PAD + i * C_PITCH, w });
      x += w + C_GAP;
    }
  });
  return out;
})();
const BAR_PATH = (w: number) => squirclePath(w, C_BAR, 0.5);
// The card's resting centre: tucked into the plot's empty top-right corner.
const CARD_REST: P = { x: PX1 - 26 - CARD_W / 2, y: PY_TOP + 14 + CARD_H / 2 };
const CARD_START: P = { x: 1250, y: CARD_REST.y - 46 };

const cardAt = (f: number) => {
  const t = clamp01((f - CARD_F0) / (CARD_F1 - CARD_F0));
  const gx = Easing.out(Easing.cubic)(t);
  // the drop: most of it in the back half of the slide, with a small settle
  const gy = Easing.out(Easing.back(1.5))(clamp01((t - 0.35) / 0.65));
  const rot = -5 * (1 - Easing.out(Easing.back(1.8))(clamp01((t - 0.2) / 0.8)));
  return {
    x: CARD_START.x + (CARD_REST.x - CARD_START.x) * gx,
    y: CARD_START.y + (CARD_REST.y - CARD_START.y) * gy,
    rot,
  };
};
const THREAD_A: P = { x: CARD_REST.x - CARD_W / 2, y: CARD_REST.y };

// ---------------------------------------------------------------------------
// THE LABS, the audience, in a row above the plot.
// ---------------------------------------------------------------------------
const MARK = 100;
const MARK_Y = 498;
const MARK_GAP = 260;
const MARKS: BrandGlyph[] = [OPENAI, ANTHROPIC, DEEPMIND];

const DOT_R0 = DOT_RADIUS * 1.9;
const DOT_R1 = DOT_R0 * 2.5; // ~58 screen px across at rest: the smarter model
const DOT_TONE_A = makeTone(ACCENT_DEEP, ACCENT);
const DOT_TONE_B = makeTone(ACCENT, HIGHLIGHT);
const dotTone = (t: number) => (t < 0.5 ? DOT_TONE_A(t * 2) : DOT_TONE_B((t - 0.5) * 2));

const LABEL = worldPx(34, K_REST);

const Arrowhead: React.FC<{ x: number; y: number; dir: "up" | "right" }> = ({ x, y, dir }) => {
  const a = worldPx(15, K_REST);
  const d =
    dir === "up"
      ? `M${x - a} ${y + a} L${x} ${y} L${x + a} ${y + a}`
      : `M${x - a} ${y - a} L${x} ${y} L${x - a} ${y + a}`;
  return <path d={d} fill="none" stroke={INK} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round" />;
};

const JudgedByTheCurve: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const { cy, k } = camAt(frame);
  const s = sway(frame);
  const { tx, ty } = worldTransform(540, cy, k);
  const icon = iconShadow(k);

  // the baseline run
  const baseU = Easing.inOut(Easing.sin)(clamp01((frame - BASE_F0) / (BASE_F1 - BASE_F0)));
  // the card
  const card = cardAt(frame);
  const cardOn = frame >= CARD_F0;
  // the thread from the card to the dot
  const thU = Easing.inOut(Easing.quad)(clamp01((frame - THREAD_F0) / (THREAD_F1 - THREAD_F0)));
  const thOp = 0.95 * (1 - smoothstep((frame - RUN_F0) / THREAD_FADE));
  const START = NEW_RUN[0];
  const thHead = { x: THREAD_A.x + (START.x - THREAD_A.x) * thU, y: THREAD_A.y + (START.y - THREAD_A.y) * thU };
  // the new run
  const u = runU(frame);
  const head = headAt(NEW_RUN, u);
  // the bracket: from the orange crossing to the baseline's end, along the baseline's final loss
  const brU = Easing.out(Easing.cubic)(clamp01((frame - BRACKET_F0) / BRACKET_T));
  const brX = CROSS.x + (BASE_END.x - CROSS.x) * brU;
  const tickH = worldPx(16, K_REST);
  const tickR = smoothstep((frame - BRACKET_F0 - BRACKET_T + 6) / 6);
  // the model dot
  const step = Easing.out(Easing.back(1.6))(clamp01((frame - STEP_F0) / (STEP_F1 - STEP_F0)));
  const dotR = (DOT_R0 + (DOT_R1 - DOT_R0) * step) * breath(frame, 0.37);
  const dotFill = dotTone(smoothstep((frame - STEP_F0) / (STEP_F1 - STEP_F0)));

  return (
    <AbsoluteFill style={{ backgroundColor: BG_BASE }}>
      <GridBackground
        src="grid-background.jpg"
        blur={13}
        dim={BG_DIM}
        frame={frame}
        cy={cy}
        cyRest={CAM_CY[0]}
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
            transform: `translate(${tx + s.dx}px, ${ty + s.dy}px) scale(${k})`,
          }}
        >
          <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            {/* the labs */}
            <g style={{ filter: iconShadow(k, 2, 3, 0.27) }}>
              {MARKS.map((m, i) => {
                const cx = 540 + (i - 1) * MARK_GAP;
                return (
                  <g key={i} transform={`translate(${cx - MARK / 2} ${MARK_Y - MARK / 2}) scale(${MARK / 24})`}>
                    {m.paths.map((d, j) => (
                      <path key={j} d={d} fill={INK} fillRule="evenodd" />
                    ))}
                  </g>
                );
              })}
            </g>

            {/* the axes */}
            <g style={{ filter: icon }}>
              <path
                d={`M${PX0} ${PY_TOP - AX_OVER} L${PX0} ${PY_AX} L${PX1 + AX_OVER} ${PY_AX}`}
                fill="none"
                stroke={INK}
                strokeWidth={STROKE}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Arrowhead x={PX0} y={PY_TOP - AX_OVER} dir="up" />
              <Arrowhead x={PX1 + AX_OVER} y={PY_AX} dir="right" />
            </g>

            {/* the baseline run, dim white */}
            {baseU > 0 ? (
              <path
                d={partial(BASE_RUN, baseU)}
                fill="none"
                stroke={INK}
                strokeOpacity={INK_LO}
                strokeWidth={STROKE * 0.7}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}

            {/* the bracket: the compute saved */}
            {brU > 0 ? (
              <g style={{ filter: icon }}>
                <line
                  x1={CROSS.x}
                  y1={LEVEL_Y}
                  x2={brX}
                  y2={LEVEL_Y}
                  stroke={INK}
                  strokeWidth={STROKE}
                  strokeLinecap="round"
                />
                <line
                  x1={CROSS.x}
                  y1={LEVEL_Y - tickH * smoothstep(brU * 6)}
                  x2={CROSS.x}
                  y2={LEVEL_Y + tickH * smoothstep(brU * 6)}
                  stroke={INK}
                  strokeWidth={STROKE}
                  strokeLinecap="round"
                />
                {tickR > 0 ? (
                  <line
                    x1={BASE_END.x}
                    y1={LEVEL_Y - tickH * tickR}
                    x2={BASE_END.x}
                    y2={LEVEL_Y + tickH * tickR}
                    stroke={INK}
                    strokeWidth={STROKE}
                    strokeLinecap="round"
                  />
                ) : null}
              </g>
            ) : null}

            {/* the thread: the recipe reaches the model */}
            {thU > 0 && thOp > 0.004 ? (
              <g opacity={thOp}>
                <line
                  x1={THREAD_A.x}
                  y1={THREAD_A.y}
                  x2={thHead.x}
                  y2={thHead.y}
                  stroke={ACCENT}
                  strokeWidth={THREAD}
                  strokeLinecap="round"
                />
                {thU < 1 ? <circle cx={thHead.x} cy={thHead.y} r={THREAD * 1.4} fill={INK} /> : null}
              </g>
            ) : null}

            {/* the new recipe's run, orange, head-led */}
            {u > 0 ? (
              <path
                d={partial(NEW_RUN, u)}
                fill="none"
                stroke={ACCENT}
                strokeWidth={STROKE}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}

            {/* the card */}
            {cardOn ? (
              <g
                transform={`translate(${card.x.toFixed(3)} ${card.y.toFixed(3)}) rotate(${card.rot.toFixed(3)}) translate(${(-CARD_W / 2).toFixed(3)} ${(-CARD_H / 2).toFixed(3)})`}
                style={{ filter: icon }}
              >
                <path d={CARD_PATH} fill="none" stroke={INK} strokeWidth={STROKE} />
                {CODE_BARS.map((b, i) => (
                  <path
                    key={i}
                    d={BAR_PATH(b.w)}
                    transform={`translate(${b.x} ${b.y})`}
                    fill={INK}
                    opacity={INK_LO}
                  />
                ))}
              </g>
            ) : null}

            {/* the model */}
            <circle cx={head.x} cy={head.y} r={dotR} fill={dotFill} />
          </svg>
          <Label k={k} x={PX0 + worldPx(22, K_REST)} y={PY_TOP - 4} text="Loss" frame={frame} f0={4} size={LABEL} align="left" />
          <Label k={k} x={(PX0 + PX1) / 2} y={PY_AX + worldPx(16, K_REST)} text="Compute" frame={frame} f0={8} size={LABEL} />
        </div>
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

export default JudgedByTheCurve;
